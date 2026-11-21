/* =========================================
   IMAGE SEQUENCE ON SCROLL + extras
   - Si existen frames/f_0001.jpg ... se usan como secuencia.
   - Si no existen, se dibuja una secuencia procedural en el canvas.
   ========================================= */
(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const ease = t => t * t * (3 - 2 * t);

    /* ---------- 1. SECUENCIA DE IMAGENES LIGADA AL SCROLL ---------- */
    const wrap = document.querySelector('#sequence');
    if (wrap) {
        const canvas = wrap.querySelector('.seq-canvas');
        const ctx = canvas.getContext('2d');
        const total = parseInt(wrap.dataset.frames, 10) || 120;
        const tpl = wrap.dataset.src || 'frames/f_{n}.jpg';
        const bar = wrap.querySelector('.seq-bar i');
        const count = wrap.querySelector('.seq-count');
        const caps = [...wrap.querySelectorAll('.seq-cap')];

        let W = 0, H = 0, cur = 0, target = 0, last = -1, active = false;

        /* Frames reales (opcional) */
        const frames = new Array(total).fill(null);
        let useFrames = false;
        const pad = n => String(n).padStart(4, '0');
        function loadFrame(i) {
            const img = new Image();
            img.onload = () => { frames[i] = img; if (i === 0) { useFrames = true; last = -1; draw(cur); } };
            img.src = tpl.replace('{n}', pad(i + 1));
        }
        loadFrame(0);
        // Solo se cargan los demás si el primero existe
        const probe = new Image();
        probe.onload = () => { for (let i = 1; i < total; i++) loadFrame(i); };
        probe.src = tpl.replace('{n}', pad(1));

        function drawFrame(p) {
            const idx = Math.round(p * (total - 1));
            let img = frames[idx];
            for (let k = idx; k >= 0 && !img; k--) img = frames[k];
            if (!img) return;
            const s = Math.max(W / img.width, H / img.height); // cover
            const w = img.width * s, h = img.height * s;
            ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        }

        /* Secuencia procedural de respaldo: nube de datos que se ensambla en una esfera */
        const N = 240;
        const pts = [];
        let seed = 7;
        const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        for (let i = 0; i < N; i++) {
            const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), th = i * 2.399963;
            pts.push({ sx: Math.cos(th) * r, sy: y, sz: Math.sin(th) * r, rx: (rnd() - 0.5) * 5, ry: (rnd() - 0.5) * 5, rz: (rnd() - 0.5) * 5 });
        }
        const edges = [];
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
            const dx = pts[i].sx - pts[j].sx, dy = pts[i].sy - pts[j].sy, dz = pts[i].sz - pts[j].sz;
            if (dx * dx + dy * dy + dz * dz < 0.17) edges.push([i, j]);
        }

        function drawProcedural(p) {
            const cx = W / 2, cy = H / 2, base = Math.min(W, H) * 0.34;
            const form = ease(clamp(p / 0.4));
            const rot = p * Math.PI * 2.6;
            const cam = 3.4 - ease(clamp((p - 0.4) / 0.6)) * 1.5;
            const sin = Math.sin(rot), cos = Math.cos(rot);
            const r = Math.round(180 + (139 - 180) * p), g = Math.round(255 + (92 - 255) * p), b = Math.round(0 + 246 * p);
            const col = a => `rgba(${r},${g},${b},${a})`;

            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 2);
            glow.addColorStop(0, col(0.18 * form));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, W, H);

            const pr = pts.map(pt => {
                const x = pt.rx + (pt.sx - pt.rx) * form, y = pt.ry + (pt.sy - pt.ry) * form, z = pt.rz + (pt.sz - pt.rz) * form;
                const x2 = x * cos + z * sin, z2 = -x * sin + z * cos;
                const k = cam / (cam + z2);
                return { x: cx + x2 * k * base, y: cy + y * k * base, z: z2, k };
            });

            ctx.lineWidth = 1;
            for (const [i, j] of edges) {
                const a = pr[i], c = pr[j];
                const al = (0.1 + 0.25 * ((a.z + c.z) / 2 + 1) / 2) * form;
                ctx.strokeStyle = col(al);
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
            }
            for (const q of pr) {
                const al = clamp(0.35 + 0.5 * (q.z + 1) / 2, 0.2, 1);
                ctx.fillStyle = col(al);
                ctx.beginPath(); ctx.arc(q.x, q.y, (1.2 + 1.6 * q.k) * (0.6 + form * 0.4), 0, Math.PI * 2); ctx.fill();
            }

            // Anillos orbitales
            for (let n = 0; n < 2; n++) {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(rot * (n ? -0.6 : 0.8));
                ctx.setLineDash(n ? [4, 10] : [14, 10]);
                ctx.strokeStyle = col(0.35 * form);
                ctx.beginPath();
                ctx.ellipse(0, 0, base * (1.3 + n * 0.28) * (cam < 3 ? 3.4 / cam : 1), base * (0.42 + n * 0.1), 0.5 + n, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            ctx.setLineDash([]);
        }

        function draw(p) {
            ctx.clearRect(0, 0, W, H);
            if (useFrames) drawFrame(p); else if (!document.documentElement.classList.contains('has-build')) drawProcedural(p);
        }

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = canvas.clientWidth; H = canvas.clientHeight;
            canvas.width = W * dpr; canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            last = -1; draw(cur);
        }

        function progress() {
            const r = wrap.getBoundingClientRect();
            return clamp(-r.top / Math.max(1, r.height - window.innerHeight));
        }

        function updateUi(p) {
            if (bar) bar.style.transform = `scaleX(${p.toFixed(3)})`;
            if (count) count.textContent = `${String(Math.round(p * (total - 1)) + 1).padStart(3, '0')} / ${String(total).padStart(3, '0')}`;
            caps.forEach(c => c.classList.toggle('on', p >= parseFloat(c.dataset.from) && p < parseFloat(c.dataset.to)));
        }

        function loop() {
            if (!active) return;
            target = progress();
            cur += (target - cur) * 0.14; // inercia suave
            if (Math.abs(target - cur) < 0.0004) cur = target;
            if (cur !== last) { draw(cur); updateUi(cur); last = cur; }
            requestAnimationFrame(loop);
        }

        new IntersectionObserver(([e]) => {
            active = e.isIntersecting;
            if (active && !reduce) requestAnimationFrame(loop);
        }, { rootMargin: '10% 0px' }).observe(wrap);

        window.addEventListener('resize', resize);
        resize();
        if (reduce) { cur = 0.55; draw(cur); updateUi(cur); }
        else updateUi(0);
    }

    if (reduce) return;

    /* ---------- 2. CINTA DE HABILIDADES: se inclina con la velocidad del scroll ---------- */
    const marquee = document.querySelector('.marquee-container');
    if (marquee) {
        let lastY = window.scrollY, vel = 0, running = false;
        const tick = () => {
            vel *= 0.88;
            const s = clamp(vel, -8, 8);
            marquee.style.transform = Math.abs(s) > 0.05 ? `skewX(${(-s).toFixed(2)}deg)` : '';
            if (Math.abs(vel) > 0.05) requestAnimationFrame(tick);
            else { running = false; marquee.style.transform = ''; }
        };
        window.addEventListener('scroll', () => {
            vel = vel * 0.5 + (window.scrollY - lastY) * 0.1;
            lastY = window.scrollY;
            if (!running) { running = true; requestAnimationFrame(tick); }
        }, { passive: true });
    }

    /* ---------- 3. CURSOR: anillo que sigue al mouse y crece sobre lo interactivo ---------- */
    if (finePointer) {
        const ring = document.createElement('div');
        ring.className = 'cursor-ring';
        ring.setAttribute('aria-hidden', 'true');
        document.body.append(ring);
        const dot = document.createElement('div');
        dot.className = 'cursor-dot';
        dot.setAttribute('aria-hidden', 'true');
        document.body.append(dot);
        let mx = -100, my = -100, rx = -100, ry = -100;
        window.addEventListener('mousemove', (e) => {
            mx = e.clientX; my = e.clientY;
            dot.style.translate = `${mx}px ${my}px`;
            dot.classList.add('on');
            ring.classList.add('on');
            ring.classList.toggle('hover', !!e.target.closest('a, button, .spot'));
        }, { passive: true });
        document.addEventListener('mouseleave', () => { ring.classList.remove('on'); dot.classList.remove('on'); });
        window.addEventListener('mousedown', () => ring.classList.add('down'));
        window.addEventListener('mouseup', () => ring.classList.remove('down'));
        let following = false;
        function follow() {
            rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
            ring.style.translate = `${rx.toFixed(1)}px ${ry.toFixed(1)}px`;
            if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) requestAnimationFrame(follow);
            else following = false;
        }
        window.addEventListener('mousemove', () => {
            if (!following) { if (rx === -100) { rx = mx; ry = my; } following = true; requestAnimationFrame(follow); }
        }, { passive: true });
    }
})();
