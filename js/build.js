/* =========================================
   ESTACIÓN ORBITAL CONTROLADA POR SCROLL (scroll-driven 3D)
   Un canvas fijo detrás del contenido dibuja una estación futurista en 3D
   (proyección propia, sin librerías). El scroll NO dispara animaciones:
   es la variable que posiciona cada pieza. Subir revierte la construcción.

   Progreso S: suma del avance de cada sección (0 a n). Cada pieza se define
   con sec('id', fracción) para nacer exactamente en su sección:
     hero ........ escenario vacío + plataforma
     sequence .... pilar y núcleo
     about ....... anillo y radios
     skills ...... módulos que se acoplan
     experience .. mástil
     projects .... paneles que se despliegan
     education ... antena
     creative/goals órbita y satélites
     contact ..... estación completa encendida
   ========================================= */
(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = [...document.querySelectorAll('section[id]')];
    if (sections.length < 3) return;

    document.documentElement.classList.add('has-build');
    const canvas = document.createElement('canvas');
    canvas.id = 'build-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const bgfx = document.querySelector('.bg-fx');
    if (bgfx) bgfx.after(canvas); else document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    const ids = sections.map(s => s.id);
    const n = sections.length;
    const sec = (id, f = 0) => Math.max(0, ids.indexOf(id)) + f;

    const TAU = Math.PI * 2;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const sm = t => { t = clamp(t); return t * t * (3 - 2 * t); };
    const seg = (v, a, b) => clamp((v - a) / (b - a));
    const frac = v => v - Math.floor(v);

    /* ---------- Estado de pantalla ---------- */
    let W = 0, H = 0, dpr = 1, small = false, portrait = false, focal = 800;
    let quality = 2;                 // 2 = completo · 1 = sin halos ni caras sólidas · 0 = mínimo (baja solo si el equipo va lento)
    let px = 0, py = 0, tpx = 0, tpy = 0; // paralaje del puntero (suavizado)

    /* ---------- Paleta (modo oscuro / claro) ---------- */
    const DARK = { lime: [180, 255, 0], violet: [139, 92, 246], blue: [59, 130, 246], white: [235, 242, 255], add: true, k: 1 };
    const LIGHT = { lime: [74, 120, 0], violet: [109, 40, 217], blue: [29, 78, 216], white: [40, 34, 70], add: false, k: 1.25 };
    let P = DARK, bright = 1;
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

    /* ---------- Cámara y proyección ---------- */
    const cam = [0, 0, 0];
    let fx = 0, fy = 0, fz = 1, rx = 1, rz = 0, ux = 0, uy = 1, uz = 0, cx = 0, cy = 0;
    const A = { x: 0, y: 0, z: 0, k: 1 }, B = { x: 0, y: 0, z: 0, k: 1 };

    function proj(x, y, z, o) {
        const vx = x - cam[0], vy = y - cam[1], vz = z - cam[2];
        const zc = vx * fx + vy * fy + vz * fz;
        if (zc < 0.4) return false;
        const k = focal / zc;
        o.x = cx + (vx * rx + vz * rz) * k;
        o.y = cy - (vx * ux + vy * uy + vz * uz) * k;
        o.z = zc; o.k = k;
        return true;
    }

    // Keyframes de cámara: [S, distancia, azimut, elevación, altura del objetivo]
    const K = [
        [sec('hero', 0.4), 12.5, 0.25, 0.20, -0.7],
        [sec('sequence', 0), 11, 0.55, 0.24, -0.3],
        [sec('sequence', 1), 8.8, 1.5, 0.30, 0.1],
        [sec('about', 1), 8.4, 2.3, 0.26, 0.2],
        [sec('skills', 1), 8.8, 3.3, 0.32, 0.6],
        [sec('experience', 1), 12, 4.3, 0.16, 3.0],
        [sec('projects', 1), 13, 5.2, 0.20, 3.7],
        [sec('education', 1), 13, 6.0, 0.24, 3.9],
        [sec('goals', 1), 15.5, 6.9, 0.34, 2.8],
        [sec('contact', 1), 18, 7.7, 0.26, 2.6]
    ];

    function setCamera(S) {
        let i = 0;
        while (i < K.length - 2 && S >= K[i + 1][0]) i++;
        const a = K[i], b = K[i + 1];
        let t = clamp((S - a[0]) / (b[0] - a[0]));
        t = t * 0.5 + sm(t) * 0.5;
        const d = lerp(a[1], b[1], t) * (portrait ? 1.3 : 1);
        const az = lerp(a[2], b[2], t) + px * 0.08, el = clamp(lerp(a[3], b[3], t) - py * 0.04, 0.05, 0.8), ty = lerp(a[4], b[4], t);
        cam[0] = Math.sin(az) * Math.cos(el) * d;
        cam[1] = ty + Math.sin(el) * d;
        cam[2] = Math.cos(az) * Math.cos(el) * d;
        let dx = -cam[0], dy = ty - cam[1], dz = -cam[2];
        const l = Math.hypot(dx, dy, dz);
        fx = dx / l; fy = dy / l; fz = dz / l;
        const rl = Math.hypot(fz, fx) || 1;
        rx = -fz / rl; rz = fx / rl;                    // right = normalize(cross(f, up))
        ux = -rz * fy; uy = rz * fx - rx * fz; uz = rx * fy; // up = cross(right, f)
        cx = W / 2; cy = H / 2;
    }

    /* ---------- Primitivas de dibujo ---------- */
    function L(ax, ay, az, bx, by, bz) {
        if (!proj(ax, ay, az, A) || !proj(bx, by, bz, B)) return;
        ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
    }
    // Transformación de pieza: giro sobre Y + desplazamiento (para el vuelo de ensamblaje)
    let ox = 0, oy = 0, oz = 0, pc = 1, ps = 0;
    function part(e, off, rot) {
        const k = 1 - e;
        ox = off ? off[0] * k : 0; oy = off ? off[1] * k : 0; oz = off ? off[2] * k : 0;
        const a = (rot || 0) * k; pc = Math.cos(a); ps = Math.sin(a);
    }
    function Lp(ax, ay, az, bx, by, bz) {
        L(ax * pc + az * ps + ox, ay + oy, -ax * ps + az * pc + oz,
          bx * pc + bz * ps + ox, by + oy, -bx * ps + bz * pc + oz);
    }
    function glowStroke(c, a, w) {
        const aa = Math.min(1, a * bright * P.k);
        if (quality > 1) { ctx.strokeStyle = rgba(c, aa * 0.16); ctx.lineWidth = w * 4.2; ctx.stroke(); }
        ctx.strokeStyle = rgba(c, aa); ctx.lineWidth = w; ctx.stroke();
    }
    function radial(x, y, r, c, a) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Punto de un anillo inclinado sobre X
    function ringPt(r, th, t) {
        const s = Math.sin(th);
        return [r * Math.cos(th), -r * s * Math.sin(t), r * s * Math.cos(t)];
    }
    function ringArc(r, a0, a1, t, rot) {
        const steps = Math.max(2, Math.ceil(110 * (a1 - a0) / TAU));
        let p = ringPt(r, a0, t);
        for (let i = 1; i <= steps; i++) {
            const q = ringPt(r, a0 + (a1 - a0) * i / steps, t);
            Lp(p[0], p[1], p[2], q[0], q[1], q[2]);
            p = q;
        }
    }

    /* ---------- Geometría precalculada ---------- */
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    const stars = [];
    for (let i = 0; i < 260; i++) {
        const u = rnd() * 2 - 1, a = rnd() * TAU, r = Math.sqrt(1 - u * u);
        stars.push([Math.cos(a) * r * 70, u * 70, Math.sin(a) * r * 70, 0.5 + rnd() * 1.2]);
    }

    const NC = window.innerWidth < 720 ? 54 : 72;
    const cs = new Float32Array(NC * 3), cr = new Float32Array(NC * 3);
    for (let i = 0; i < NC; i++) {
        const y = 1 - 2 * (i + 0.5) / NC, r = Math.sqrt(1 - y * y), th = i * 2.399963;
        cs[i * 3] = Math.cos(th) * r; cs[i * 3 + 1] = y; cs[i * 3 + 2] = Math.sin(th) * r;
        cr[i * 3] = (rnd() - 0.5) * 9; cr[i * 3 + 1] = (rnd() - 0.5) * 7; cr[i * 3 + 2] = (rnd() - 0.5) * 9;
    }
    const coreEdges = [];
    for (let i = 0; i < NC; i++) for (let j = i + 1; j < NC; j++) {
        const dx = cs[i * 3] - cs[j * 3], dy = cs[i * 3 + 1] - cs[j * 3 + 1], dz = cs[i * 3 + 2] - cs[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < 0.36) coreEdges.push(i, j);
    }
    const cpx = new Float32Array(NC), cpy = new Float32Array(NC), cok = new Uint8Array(NC);

    const BOX = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    const BOX_EDGES = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
    const OCT = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

    const GY = -2.4;            // altura de la plataforma
    const MAST_Y0 = 1.0, MAST_N = 18, MAST_DY = 0.34;
    const MAST_TOP = MAST_Y0 + MAST_N * MAST_DY;
    const RING_T = 0.35;        // inclinación del anillo principal
    const HALO_R = 4.8, HALO_T = -0.5;

    /* ---------- Escenario: estrellas, suelo y plataforma ---------- */
    function drawStars() {
        ctx.fillStyle = rgba(P.white, P.add ? 0.55 : 0.35);
        for (let i = 0; i < stars.length; i += quality ? 1 : 2) {
            const s = stars[i];
            if (!proj(s[0], s[1], s[2], A)) continue;
            ctx.fillRect(A.x, A.y, s[3], s[3]);
        }
    }

    function drawGround(S) {
        part(1);
        ctx.beginPath();
        for (const r of [5, 8, 11, 14, 18]) {
            let px = r, pz = 0;
            for (let i = 1; i <= 64; i++) {
                const a = i / 64 * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
                L(px, GY, pz, x, GY, z); px = x; pz = z;
            }
        }
        for (let i = 0; i < 16; i++) {
            const a = i / 16 * TAU;
            L(Math.cos(a) * 3.8, GY, Math.sin(a) * 3.8, Math.cos(a) * 18, GY, Math.sin(a) * 18);
        }
        ctx.strokeStyle = rgba(P.violet, (P.add ? 0.17 : 0.22)); ctx.lineWidth = 1; ctx.stroke();
    }

    function drawPad(S) {
        const t = seg(S, sec('hero', 0.55), sec('sequence', 0.35));
        if (t > 0) {
            part(1);
            ctx.beginPath();
            [1.3, 2.4, 3.5].forEach((r, j) => {
                const e = sm(seg(t, j * 0.15, j * 0.15 + 0.6));
                if (e <= 0) return;
                const steps = Math.max(2, Math.ceil(72 * e));
                let px = r, pz = 0;
                for (let i = 1; i <= steps; i++) {
                    const a = e * TAU * i / steps, x = Math.cos(a) * r, z = Math.sin(a) * r;
                    L(px, GY, pz, x, GY, z); px = x; pz = z;
                }
            });
            const et = sm(seg(t, 0.4, 1));
            for (let i = 0; i < 24; i++) {
                if (i / 24 > et) break;
                const a = i / 24 * TAU;
                L(Math.cos(a) * 3.55, GY, Math.sin(a) * 3.55, Math.cos(a) * 3.85, GY, Math.sin(a) * 3.85);
            }
            for (let i = 0; i < 4; i++) {
                const a = i * Math.PI / 2;
                L(Math.cos(a) * 0.5, GY, Math.sin(a) * 0.5, Math.cos(a) * 1.0, GY, Math.sin(a) * 1.0);
            }
            glowStroke(P.lime, 0.7, 1.1);
        }
        const tp = sm(seg(S, sec('sequence', 0), sec('sequence', 0.3)));
        if (tp > 0) {
            part(1);
            ctx.beginPath();
            const top = GY + (MAST_Y0 + 0.05 - GY) * tp;
            for (const sx of [-0.07, 0.07]) L(sx, GY, 0, sx, top, 0);
            for (let y = GY + 0.3; y < top; y += 0.3) L(-0.07, y, 0, 0.07, y + 0.15, 0);
            glowStroke(P.white, 0.7, 1);
        }
    }

    /* ---------- Núcleo (sequence) ---------- */
    function drawCore(S) {
        const t = seg(S, sec('sequence', 0.05), sec('sequence', 0.6));
        if (t <= 0) return;
        const f = sm(t), a = S * 0.7, ca = Math.cos(a), sa = Math.sin(a);
        for (let i = 0; i < NC; i++) {
            const x = lerp(cr[i * 3], cs[i * 3], f), y = lerp(cr[i * 3 + 1], cs[i * 3 + 1], f), z = lerp(cr[i * 3 + 2], cs[i * 3 + 2], f);
            if (proj(x * ca + z * sa, y, -x * sa + z * ca, A)) { cpx[i] = A.x; cpy[i] = A.y; cok[i] = 1; } else cok[i] = 0;
        }
        ctx.beginPath();
        for (let e = 0; e < coreEdges.length; e += 2) {
            const i = coreEdges[e], j = coreEdges[e + 1];
            if (cok[i] && cok[j]) { ctx.moveTo(cpx[i], cpy[i]); ctx.lineTo(cpx[j], cpy[j]); }
        }
        glowStroke(P.lime, 0.5 * f * f, 1);
        ctx.beginPath();
        for (let i = 0; i < NC; i++) if (cok[i]) { ctx.moveTo(cpx[i] + 1.7, cpy[i]); ctx.arc(cpx[i], cpy[i], 1.7, 0, TAU); }
        ctx.fillStyle = rgba(P.white, 0.85 * f * Math.min(1, bright)); ctx.fill();
        if (proj(0, 0, 0, A)) radial(A.x, A.y, A.k * 1.9, P.lime, (P.add ? 0.3 : 0.18) * f * bright);
    }

    /* ---------- Anillo y radios (about) ---------- */
    // Banda translúcida del anillo (da cuerpo a las líneas)
    function ringBand(r0, r1, a0, a1, c, al) {
        const steps = Math.max(4, Math.ceil(80 * (a1 - a0) / TAU));
        const xs = [], ys = [];
        for (let i = 0; i <= steps; i++) {
            const p = ringPt(r1, a0 + (a1 - a0) * i / steps, RING_T);
            if (!proj(p[0], p[1], p[2], A)) return;
            xs.push(A.x); ys.push(A.y);
        }
        for (let i = steps; i >= 0; i--) {
            const p = ringPt(r0, a0 + (a1 - a0) * i / steps, RING_T);
            if (!proj(p[0], p[1], p[2], A)) return;
            xs.push(A.x); ys.push(A.y);
        }
        ctx.beginPath(); ctx.moveTo(xs[0], ys[0]);
        for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
        ctx.closePath(); ctx.fillStyle = rgba(c, al); ctx.fill();
    }

    function drawRing(S) {
        const t = seg(S, sec('sequence', 0.5), sec('about', 0.7));
        if (t <= 0) return;
        const e = sm(t), ang = e * TAU, rot = S * 0.55;
        if (quality > 1 && ang > 0.05) ringBand(2.5, 2.74, rot, rot + ang, P.violet, (P.add ? 0.11 : 0.1) * e);
        part(1);
        ctx.beginPath();
        ringArc(2.5, rot, rot + ang, RING_T);
        ringArc(2.74, rot, rot + ang, RING_T);
        for (let k = 0; k < 24; k++) {
            const th = k / 24 * TAU;
            if (th > ang) break;
            const p = ringPt(2.5, rot + th, RING_T), q = ringPt(2.74, rot + th, RING_T);
            Lp(p[0], p[1], p[2], q[0], q[1], q[2]);
        }
        glowStroke(P.violet, 0.8, 1.2);
        const ts = seg(t, 0.3, 1);
        if (ts > 0) {
            ctx.beginPath();
            for (let k = 0; k < 8; k++) {
                const es = sm(seg(ts, k * 0.08, k * 0.08 + 0.5));
                if (es <= 0) continue;
                const th = rot + k * TAU / 8, p = ringPt(1.05, th, RING_T), q = ringPt(2.5, th, RING_T);
                Lp(p[0], p[1], p[2], lerp(p[0], q[0], es), lerp(p[1], q[1], es), lerp(p[2], q[2], es));
            }
            glowStroke(P.lime, 0.6, 1);
        }
    }

    /* ---------- Caras sólidas con luz direccional (volumen) ---------- */
    const LD = (() => { const x = -0.45, y = 0.8, z = 0.4, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();
    const FACES = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]];
    // Usa la transformación activa de part(): dibuja solo las caras visibles, más claras las que miran a la luz
    function solidBox(pts, c, alpha) {
        const q = [], o = [];
        let mx = 0, my = 0, mz = 0;
        for (let i = 0; i < 8; i++) {
            const p = pts[i];
            const x = p[0] * pc + p[2] * ps + ox, y = p[1] + oy, z = -p[0] * ps + p[2] * pc + oz;
            q.push([x, y, z]); mx += x; my += y; mz += z;
            const s = { x: 0, y: 0, z: 0, k: 1 };
            o.push(proj(x, y, z, s) ? s : null);
        }
        mx /= 8; my /= 8; mz /= 8;
        for (const f of FACES) {
            const a = q[f[0]], b = q[f[1]], d = q[f[3]], g = q[f[2]];
            const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
            let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
            const fx_ = (a[0] + g[0]) / 2, fy_ = (a[1] + g[1]) / 2, fz_ = (a[2] + g[2]) / 2;
            if (nx * (fx_ - mx) + ny * (fy_ - my) + nz * (fz_ - mz) < 0) { nx = -nx; ny = -ny; nz = -nz; }
            if (nx * (fx_ - cam[0]) + ny * (fy_ - cam[1]) + nz * (fz_ - cam[2]) >= 0) continue; // cara de espaldas
            const r0 = o[f[0]], r1 = o[f[1]], r2 = o[f[2]], r3 = o[f[3]];
            if (!r0 || !r1 || !r2 || !r3) continue;
            const lit = 0.25 + 0.75 * Math.max(0, nx * LD[0] + ny * LD[1] + nz * LD[2]);
            ctx.beginPath(); ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.lineTo(r3.x, r3.y); ctx.closePath();
            ctx.fillStyle = rgba(c, alpha * lit); ctx.fill();
        }
    }

    /* ---------- Módulos que se acoplan (skills) ---------- */
    function moduleBox(i, S, e) {
        const th = i * TAU / 6 + S * 0.55;
        const c = ringPt(2.62, th, RING_T), s = Math.sin(RING_T), co = Math.cos(RING_T);
        const R = ringPt(1, th, RING_T);
        const T = [-Math.sin(th), -Math.cos(th) * s, Math.cos(th) * co];
        const N = [0, co, s];
        const pts = BOX.map(b => [
            c[0] + b[0] * 0.27 * T[0] + b[1] * 0.15 * N[0] + b[2] * 0.17 * R[0],
            c[1] + b[0] * 0.27 * T[1] + b[1] * 0.15 * N[1] + b[2] * 0.17 * R[1],
            c[2] + b[0] * 0.27 * T[2] + b[1] * 0.15 * N[2] + b[2] * 0.17 * R[2]
        ]);
        part(e, [R[0] * 5, 3.6, R[2] * 5], 1.9);
        if (quality > 1) solidBox(pts, P.violet, (P.add ? 0.2 : 0.22) * e);
        ctx.beginPath();
        for (let k = 0; k < BOX_EDGES.length; k += 2) {
            const p = pts[BOX_EDGES[k]], q = pts[BOX_EDGES[k + 1]];
            Lp(p[0], p[1], p[2], q[0], q[1], q[2]);
        }
    }

    function drawModules(S) {
        const t = seg(S, sec('skills', 0), sec('skills', 0.95));
        if (t <= 0) return;
        for (let i = 0; i < 6; i++) {
            const ti = seg(t, i * 0.12, i * 0.12 + 0.45), e = sm(ti);
            if (e <= 0) continue;
            moduleBox(i, S, e);
            const snap = 1 + 0.9 * Math.sin(clamp((ti - 0.75) / 0.25) * Math.PI);
            glowStroke(P.lime, (0.35 + 0.5 * e) * snap, 1.1);
            // luz de ventana al acoplarse
            const th = i * TAU / 6 + S * 0.55, c = ringPt(2.62, th, RING_T);
            part(e, [Math.cos(th) * 5, 3.6, Math.sin(th) * 5], 1.9);
            ctx.beginPath();
            const x = c[0] * pc + c[2] * ps + ox, y = c[1] + oy, z = -c[0] * ps + c[2] * pc + oz;
            const seen = proj(x, y, z, A);
            if (seen) { ctx.moveTo(A.x + 2.4, A.y); ctx.arc(A.x, A.y, 2.4, 0, TAU); }
            ctx.fillStyle = rgba(P.white, 0.9 * sm(seg(ti, 0.8, 1))); ctx.fill();
            // destello de soldadura justo cuando el módulo encaja
            if (seen && quality > 0 && ti > 0.72 && ti < 1) radial(A.x, A.y, A.k * 0.95, P.lime, 0.55 * Math.sin((ti - 0.72) / 0.28 * Math.PI) * bright);
        }
    }

    /* ---------- Mástil (experience) ---------- */
    const mastW = y => 0.3 - 0.15 * clamp((y - MAST_Y0) / (MAST_N * MAST_DY));
    const MC = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    function drawMast(S) {
        const t = seg(S, sec('experience', 0), sec('experience', 0.95));
        if (t <= 0) return;
        part(1);
        const Lv = t * MAST_N;
        ctx.beginPath();
        let tipY = MAST_Y0;
        for (let j = 0; j < Math.ceil(Lv); j++) {
            const fr = clamp(Lv - j), yj = MAST_Y0 + j * MAST_DY, yk = yj + MAST_DY * fr;
            const wj = mastW(yj), wk = mastW(yk);
            tipY = yk;
            for (let c = 0; c < 4; c++) {
                const a = MC[c], b = MC[(c + 1) % 4];
                L(a[0] * wj, yj, a[1] * wj, a[0] * wk, yk, a[1] * wk);                       // montantes
                if (fr >= 1) {
                    L(a[0] * wk, yk, a[1] * wk, b[0] * wk, yk, b[1] * wk);                   // aro del nivel
                    if ((c + j) % 2 === 0) L(a[0] * wj, yj, a[1] * wj, b[0] * wk, yk, b[1] * wk); // diagonal
                    else L(b[0] * wj, yj, b[1] * wj, a[0] * wk, yk, a[1] * wk);
                }
            }
        }
        glowStroke(P.white, 0.55, 1);
        if (proj(0, tipY, 0, A)) {
            const pulse = 1 + 0.35 * Math.sin(S * 14);
            radial(A.x, A.y, A.k * 0.55 * pulse, P.lime, (P.add ? 0.55 : 0.35) * bright);
        }
    }

    /* ---------- Paneles que se despliegan (projects) ---------- */
    const PANELS = [
        { y: 4.4, d: [1, 0] }, { y: 4.4, d: [-1, 0] },
        { y: 5.8, d: [0, 1] }, { y: 5.8, d: [0, -1] }
    ];
    function drawPanels(S) {
        const t = seg(S, sec('projects', 0), sec('projects', 0.95));
        if (t <= 0) return;
        part(1);
        PANELS.forEach((pn, i) => {
            const e = sm(seg(t, i * 0.18, i * 0.18 + 0.5));
            if (e <= 0) return;
            const w = mastW(pn.y) + 0.1, len = 2.0 * e, h = 0.55;
            const dx = pn.d[0], dz = pn.d[1];
            const at = (u, v) => [dx * (w + u), pn.y + v, dz * (w + u)];
            ctx.beginPath();
            L(0, pn.y, 0, dx * w, pn.y, dz * w);                         // brazo
            const corners = [at(0, -h), at(len, -h), at(len, h), at(0, h)];
            for (let c = 0; c < 4; c++) { const a = corners[c], b = corners[(c + 1) % 4]; L(a[0], a[1], a[2], b[0], b[1], b[2]); }
            for (let g = 1; g < 5; g++) { const a = at(len * g / 5, -h), b = at(len * g / 5, h); L(a[0], a[1], a[2], b[0], b[1], b[2]); }
            for (let g = 1; g < 3; g++) { const a = at(0, -h + h * 2 * g / 3), b = at(len, -h + h * 2 * g / 3); L(a[0], a[1], a[2], b[0], b[1], b[2]); }
            glowStroke(P.blue, 0.85, 1);
            // cristal
            const pr = corners.map(p => (proj(p[0], p[1], p[2], A) ? [A.x, A.y] : null));
            if (pr.every(Boolean)) {
                ctx.beginPath(); ctx.moveTo(pr[0][0], pr[0][1]);
                for (let c = 1; c < 4; c++) ctx.lineTo(pr[c][0], pr[c][1]);
                ctx.closePath(); ctx.fillStyle = rgba(P.blue, 0.09 * e); ctx.fill();
            }
        });
    }

    /* ---------- Antena (education) ---------- */
    let DX = 0, DY = 0, DZ = 0;
    function dishPt(S, x, y, z) {
        const tilt = -0.55, ct = Math.cos(tilt), st = Math.sin(tilt);
        const y1 = y * ct - z * st, z1 = y * st + z * ct;
        const yaw = S * 0.9, cy_ = Math.cos(yaw), sy_ = Math.sin(yaw);
        DX = x * cy_ + z1 * sy_; DY = MAST_TOP + 0.12 + y1; DZ = -x * sy_ + z1 * cy_;
    }
    function drawDish(S) {
        const t = seg(S, sec('education', 0), sec('education', 0.9));
        if (t <= 0) return;
        const e = sm(seg(t, 0, 0.6)), Rd = 1.0 * e;
        const pt = (u, ph) => { const r = Rd * u; return [r * Math.cos(ph), 0.6 * r * r, r * Math.sin(ph)]; };
        ctx.beginPath();
        for (let k = 0; k < 12; k++) {
            const ph = k / 12 * TAU;
            let p = pt(0, ph);
            for (let s = 1; s <= 6; s++) {
                const q = pt(s / 6, ph);
                dishPt(S, p[0], p[1], p[2]); const ax = DX, ay = DY, az = DZ;
                dishPt(S, q[0], q[1], q[2]); L(ax, ay, az, DX, DY, DZ);
                p = q;
            }
        }
        [0.35, 0.65, 1.0].forEach(u => {
            let p = pt(u, 0);
            for (let s = 1; s <= 28; s++) {
                const q = pt(u, s / 28 * TAU);
                dishPt(S, p[0], p[1], p[2]); const ax = DX, ay = DY, az = DZ;
                dishPt(S, q[0], q[1], q[2]); L(ax, ay, az, DX, DY, DZ);
                p = q;
            }
        });
        dishPt(S, 0, 0, 0); const bx = DX, by = DY, bz = DZ;
        dishPt(S, 0, 0.95 * e, 0); L(bx, by, bz, DX, DY, DZ);
        glowStroke(P.lime, 0.7, 1);
        // Ondas de señal controladas por el scroll
        const ts = seg(t, 0.55, 1);
        if (ts > 0) {
            for (let j = 0; j < 3; j++) {
                const ph = frac(ts * 2.2 + j / 3), rr = 0.45 + ph * 1.3, hh = 1.0 + ph * 2.6;
                ctx.beginPath();
                let p = [rr, hh, 0];
                for (let s = 1; s <= 32; s++) {
                    const a = s / 32 * TAU, q = [rr * Math.cos(a), hh, rr * Math.sin(a)];
                    dishPt(S, p[0], p[1], p[2]); const ax = DX, ay = DY, az = DZ;
                    dishPt(S, q[0], q[1], q[2]); L(ax, ay, az, DX, DY, DZ);
                    p = q;
                }
                glowStroke(P.lime, (1 - ph) * 0.55 * sm(ts * 3), 1);
            }
        }
    }

    /* ---------- Órbita y satélites (creative + goals) ---------- */
    function satPos(i, S) {
        return ringPt(HALO_R, i * TAU / 5 + S * 0.35, HALO_T);
    }
    function drawHalo(S) {
        const t = seg(S, sec('creative', 0.2), sec('goals', 0.9));
        if (t <= 0) return;
        const e = sm(seg(t, 0, 0.55));
        part(1);
        ctx.beginPath();
        ringArc(HALO_R, S * 0.35, S * 0.35 + e * TAU, HALO_T);
        glowStroke(P.violet, 0.65, 1.1);
        for (let i = 0; i < 5; i++) {
            const ti = seg(t, 0.25 + i * 0.1, 0.25 + i * 0.1 + 0.4), es = sm(ti);
            if (es <= 0) continue;
            const p = satPos(i, S);
            // enlace de datos con el núcleo
            ctx.beginPath(); ctx.setLineDash([5, 7]);
            L(0, 0, 0, p[0] * es, p[1] * es, p[2] * es);
            glowStroke(P.violet, 0.4 * es, 1);
            ctx.setLineDash([]);
            // satélite (octaedro) volando hasta su órbita
            part(es, [p[0] * 0.9, 4, p[2] * 0.9], 2.2);
            ctx.beginPath();
            for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) {
                if (OCT[a][0] + OCT[b][0] === 0 && OCT[a][1] + OCT[b][1] === 0 && OCT[a][2] + OCT[b][2] === 0) continue;
                Lp(p[0] + OCT[a][0] * 0.2, p[1] + OCT[a][1] * 0.2, p[2] + OCT[a][2] * 0.2,
                   p[0] + OCT[b][0] * 0.2, p[1] + OCT[b][1] * 0.2, p[2] + OCT[b][2] * 0.2);
            }
            glowStroke(P.lime, 0.85 * es, 1);
            // paquete de datos viajando por el enlace
            if (ti >= 1) {
                const f = frac(S * 2.2 + i * 0.2);
                if (proj(p[0] * f, p[1] * f, p[2] * f, A)) {
                    ctx.beginPath(); ctx.moveTo(A.x + 2, A.y); ctx.arc(A.x, A.y, 2, 0, TAU);
                    ctx.fillStyle = rgba(P.white, 0.9); ctx.fill();
                }
            }
        }
    }

    /* ---------- Final: estación completa encendida (contact) ---------- */
    function drawFinale(S) {
        const tf = seg(S, sec('contact', 0), sec('contact', 0.8));
        if (tf <= 0) return;
        const f = sm(tf);
        part(1);
        for (let j = 0; j < 3; j++) {
            const ph = frac(tf * 1.5 + j / 3), r = 1 + ph * 11;
            ctx.beginPath();
            let px = r, pz = 0;
            for (let i = 1; i <= 72; i++) {
                const a = i / 72 * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
                L(px, GY, pz, x, GY, z); px = x; pz = z;
            }
            ctx.strokeStyle = rgba(P.lime, (1 - ph) * 0.5 * f); ctx.lineWidth = 1.4; ctx.stroke();
        }
        if (proj(0, MAST_TOP + 0.1, 0, A) && proj(0, 40, 0, B)) {
            const g = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
            g.addColorStop(0, rgba(P.lime, 0.55 * f)); g.addColorStop(1, rgba(P.lime, 0));
            ctx.strokeStyle = g; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
            radial(A.x, A.y, A.k * 1.6, P.lime, 0.28 * f);
        }
        if (proj(0, 0, 0, A)) radial(A.x, A.y, A.k * 3.2, P.violet, 0.22 * f);
    }

    /* ---------- Etiquetas sincronizadas con cada sección ---------- */
    const LABELS = [
        { t: '00 · Plataforma', a: [sec('hero', 0.6), sec('hero', 1.0)], at: () => [3.55, GY, 0] },
        { t: '01 · Núcleo · Idea', a: [sec('sequence', 0.2), sec('sequence', 0.95)], at: () => [0.75, 0.7, 0.2] },
        { t: '02 · Anillo · Sobre mí', a: [sec('about', 0.05), sec('about', 0.95)], at: S => ringPt(2.74, S * 0.55 + 0.3, RING_T) },
        { t: '03 · Módulos · Habilidades', a: [sec('skills', 0.05), sec('skills', 0.95)], at: S => ringPt(2.9, S * 0.55 + 1.05, RING_T) },
        { t: '04 · Mástil · Experiencia', a: [sec('experience', 0.05), sec('experience', 0.95)], at: () => [0.2, 3.2, 0.2] },
        { t: '05 · Paneles · Proyectos', a: [sec('projects', 0.05), sec('projects', 0.95)], at: () => [2.0, 4.4, 0] },
        { t: '06 · Antena · Formación', a: [sec('education', 0.05), sec('education', 0.95)], at: () => [0, MAST_TOP + 0.6, 0.3] },
        { t: '07 · Órbita · Creatividad y objetivos', a: [sec('creative', 0.1), sec('goals', 0.9)], at: S => satPos(0, S) },
        { t: '08 · Estación completa', a: [sec('contact', 0.05), sec('contact', 0.95)], at: () => [0, MAST_TOP + 0.4, 0] }
    ];

    function drawLabels(S) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.font = `600 ${small ? 10 : 11}px ui-monospace, "JetBrains Mono", monospace`;
        if ('letterSpacing' in ctx) ctx.letterSpacing = '1.5px';
        ctx.textBaseline = 'alphabetic';
        for (const lb of LABELS) {
            const al = sm(seg(S, lb.a[0], lb.a[0] + 0.1)) * (1 - sm(seg(S, lb.a[1] - 0.1, lb.a[1])));
            if (al < 0.02) continue;
            const p = lb.at(S);
            if (!proj(p[0], p[1], p[2], A)) continue;
            const reach = small ? 150 : 250;
            let side = A.x < W / 2 ? -1 : 1;
            if (side > 0 && A.x + reach > W) side = -1;
            if (side < 0 && A.x - reach < 0) side = 1;
            const tw = ctx.measureText(lb.t.toUpperCase()).width + lb.t.length * 1.5; // + espaciado entre letras
            const y1 = A.y - (small ? 22 : 34);
            let x2 = A.x + side * (small ? 36 : 58);
            x2 = side > 0 ? Math.min(x2, W - 18 - tw) : Math.max(x2, 18 + tw); // el texto siempre cabe en pantalla
            const x1 = A.x + (x2 - A.x) * 0.6;
            ctx.strokeStyle = rgba(P.lime, 0.85 * al); ctx.fillStyle = rgba(P.lime, 0.95 * al); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(A.x, A.y, 4, 0, TAU); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x1, y1); ctx.lineTo(x2, y1); ctx.stroke();
            ctx.textAlign = side > 0 ? 'left' : 'right';
            ctx.fillText(lb.t.toUpperCase(), x2 + side * 6, y1 + 4);
        }
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    }

    /* ---------- Render ---------- */
    let bldEl = null;
    function hudEl() {
        if (bldEl && bldEl.isConnected) return bldEl;
        const hud = document.querySelector('.cine-hud');
        if (!hud) return null;
        bldEl = document.createElement('span');
        bldEl.className = 'bld';
        hud.append(bldEl);
        return bldEl;
    }

    function render(S) {
        P = document.body.classList.contains('light-mode') ? LIGHT : DARK;
        bright = 1 + 0.45 * sm(seg(S, sec('contact', 0), sec('contact', 0.8)));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = P.add ? 'lighter' : 'source-over';
        setCamera(S);
        drawStars();
        // luz ambiental de la plataforma: crece a medida que avanza la construcción
        if (quality > 0 && proj(0, GY, 0, A)) radial(A.x, A.y, A.k * 6.5, P.violet, (P.add ? 0.05 : 0.035) + (P.add ? 0.15 : 0.08) * clamp(S / n));
        drawGround(S);
        drawPad(S);
        drawCore(S);
        drawRing(S);
        drawModules(S);
        drawMast(S);
        drawPanels(S);
        drawDish(S);
        drawHalo(S);
        drawFinale(S);
        drawLabels(S);
        ctx.globalCompositeOperation = 'source-over';
        const bld = hudEl();
        if (bld) bld.textContent = 'Estación ' + String(Math.round(clamp(S / n) * 100)).padStart(3, '0') + '%';
    }

    /* ---------- Progreso por scroll ---------- */
    // Posición de cada sección medida una sola vez (y al cambiar el layout): leer el progreso en cada fotograma es solo aritmética
    const tops = new Array(n).fill(0), hts = new Array(n).fill(1);
    function measure() {
        const sy = window.scrollY;
        for (let i = 0; i < n; i++) {
            const r = sections[i].getBoundingClientRect();
            tops[i] = r.top + sy; hts[i] = r.height;
        }
    }
    function readProgress() {
        const vh = window.innerHeight, sy = window.scrollY;
        let S = 0;
        for (let i = 0; i < n; i++) S += clamp((vh * 0.5 - (tops[i] - sy)) / Math.max(1, hts[i]));
        return S;
    }

    /* ---------- Carril de fases: cada tramo se llena con el avance de su sección ---------- */
    const PHASES = { hero: 'Plataforma', sequence: 'Núcleo', about: 'Anillo', skills: 'Módulos', experience: 'Mástil', projects: 'Paneles', education: 'Antena', creative: 'Órbita', goals: 'Satélites', contact: 'Estación' };
    const rail = document.createElement('nav');
    rail.className = 'build-rail';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = sections.map(s => `<a class="br-step" href="#${s.id}" tabindex="-1"><i></i><span>${PHASES[s.id] || s.id}</span></a>`).join('');
    document.body.append(rail);
    const stepEls = [...rail.children];
    const railLast = new Array(n).fill(-1);
    function updateRail(S) {
        for (let i = 0; i < n; i++) {
            const q = Math.round(clamp(S - i) * 200) / 200;
            if (q === railLast[i]) continue;
            railLast[i] = q;
            const el = stepEls[i];
            el.style.setProperty('--p', q);
            el.classList.toggle('done', q >= 1);
            el.classList.toggle('now', q > 0 && q < 1);
        }
    }

    let cur = 0, raf = 0, chained = false, lastT = 0, emaDt = 16, nDt = 0;
    function frame(now) {
        raf = 0;
        const target = readProgress();
        cur += (target - cur) * 0.12;       // inercia suave
        if (Math.abs(target - cur) < 0.0008) cur = target;
        px += (tpx - px) * 0.07; py += (tpy - py) * 0.07;
        render(cur);
        updateRail(cur);
        // Calidad adaptativa: si fotogramas consecutivos tardan demasiado, se simplifican los efectos (nunca el contenido)
        const dt = now - lastT; lastT = now;
        if (chained && dt > 4 && dt < 120 && quality > 0) {
            emaDt += (dt - emaDt) * 0.1;
            if (++nDt > 45 && emaDt > 27) { quality--; nDt = 0; emaDt = 16; }
        }
        chained = cur !== target || Math.abs(tpx - px) > 0.002 || Math.abs(tpy - py) > 0.002;
        if (chained) raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.5 : 2);
        W = window.innerWidth; H = window.innerHeight;
        small = W < 720; portrait = H > W;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        focal = portrait ? W * 1.25 : Math.min(W, H) * 1.2;
    }

    resize();
    measure();
    if (reduce) {
        cur = n; render(n); updateRail(n);
        window.addEventListener('resize', () => { resize(); measure(); render(n); });
    } else {
        cur = readProgress();
        render(cur); updateRail(cur);
        window.addEventListener('scroll', kick, { passive: true });
        window.addEventListener('resize', () => { resize(); measure(); kick(); });
        window.addEventListener('load', () => { measure(); kick(); });
        if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); kick(); }).observe(document.body);
        // Paralaje de cámara con el mouse (solo escritorio)
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            window.addEventListener('pointermove', (e) => {
                if (e.pointerType !== 'mouse' || quality < 1) return;
                tpx = e.clientX / W - 0.5; tpy = e.clientY / H - 0.5;
                kick();
            }, { passive: true });
        }
    }
})();
