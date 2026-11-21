document.addEventListener('DOMContentLoaded', () => {

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Utilidad: mostrar elementos con animación ---------- */
    function show(el, delay = 0) {
        el.style.transitionDelay = `${delay}ms`;
        requestAnimationFrame(() => el.classList.add('active'));
        // Al terminar, se retiran las clases de entrada para que el hover use sus propias transiciones
        setTimeout(() => {
            el.classList.remove('reveal', 'reveal-left', 'reveal-right', 'reveal-scale', 'stagger-item');
            el.style.transitionDelay = '';
        }, delay + 1300);
    }

    /* ---------- Preparación inicial (solo con animaciones activas) ---------- */
    const typedEl = $('#typed');
    const terminal = $('#terminal');
    const termLines = $$('#terminalBody .t-line');

    if (!reduceMotion) {
        if (typedEl) typedEl.textContent = '';
        $$('.stat-number').forEach(n => { n.textContent = '0'; });
        if (terminal) {
            terminal.classList.add('is-typing');
            termLines.forEach(line => {
                const span = $('.t-text', line);
                if (span) { span.dataset.full = span.textContent; span.textContent = ''; }
            });
        }
    }

    /* 1. PRELOADER, ENTRADA DEL HERO Y BARRA DE PROGRESO */
    const preloader = $('#preloader');
    let heroStarted = false;

    function startHero() {
        if (heroStarted) return;
        heroStarted = true;
        if (preloader) preloader.classList.add('hidden');
        document.body.classList.add('cine-open');
        setTimeout(() => { const lb = $('.letterbox'); if (lb) lb.remove(); }, 3200);
        $$('.hero-section .stagger-item').forEach((el, i) => show(el, 150 + i * 120));
        setTimeout(() => { startTyped(); startTerminal(); }, reduceMotion ? 0 : 700);
    }

    if (document.readyState === 'complete') {
        setTimeout(startHero, reduceMotion ? 0 : 700);
    } else {
        window.addEventListener('load', () => setTimeout(startHero, reduceMotion ? 0 : 700));
    }
    setTimeout(startHero, 3500); // Seguro por si 'load' tarda demasiado

    const progressBar = $('#scrollProgress');
    const navPill = $('.nav-pill');
    let ticking = false;

    function onScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
        navPill.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* 2. TEXTO ESCRITO EN EL HERO */
    const phrases = [
        'Estudiante de tecnología',
        'Desarrollador en formación',
        'Interesado en ciberseguridad',
        'Curioso de Linux y redes',
        'Aprendiendo con proyectos reales'
    ];

    function startTyped() {
        if (!typedEl || reduceMotion) return;
        let p = 0, c = 0, deleting = false;
        const tick = () => {
            const word = phrases[p];
            typedEl.textContent = word.slice(0, c);
            if (!deleting && c === word.length) { deleting = true; return setTimeout(tick, 1800); }
            if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; return setTimeout(tick, 350); }
            c += deleting ? -1 : 1;
            setTimeout(tick, deleting ? 30 : 65);
        };
        tick();
    }

    /* 3. TERMINAL ANIMADA (reemplaza la tarjeta con foto) */
    function startTerminal() {
        if (!terminal || reduceMotion) return;
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        (async () => {
            for (const line of termLines) {
                line.classList.add('on');
                const type = line.dataset.type;
                if (type === 'cmd') {
                    const span = $('.t-text', line);
                    const text = span.dataset.full;
                    line.classList.add('typing');
                    for (let i = 1; i <= text.length; i++) {
                        span.textContent = text.slice(0, i);
                        await sleep(55 + Math.random() * 50);
                    }
                    await sleep(350);
                    line.classList.remove('typing');
                } else if (type === 'prompt') {
                    line.classList.add('typing');
                } else {
                    await sleep(180);
                }
            }
        })();
    }

    /* Inclinación 3D suave de la terminal */
    const heroVisual = $('.hero-visual');
    if (heroVisual && terminal && finePointer && !reduceMotion && window.innerWidth > 968) {
        heroVisual.addEventListener('mousemove', (e) => {
            const r = heroVisual.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            terminal.style.transform = `rotateY(${-8 + x * 14}deg) rotateX(${4 - y * 14}deg) scale(1.02)`;
        });
        heroVisual.addEventListener('mouseleave', () => { terminal.style.transform = ''; });
    }

    /* 4. BRILLO QUE SIGUE AL CURSOR EN TARJETAS */
    if (finePointer) {
        $$('.spot').forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--mx', `${e.clientX - r.left}px`);
                el.style.setProperty('--my', `${e.clientY - r.top}px`);
            });
        });
    }

    /* 5. ENTRADAS DE CONTENIDO
       Con movimiento completo NO hay animaciones "de una sola vez": cada tarjeta se coloca según su
       posición en pantalla (sección 12), así que subir y bajar las construye y las deshace.
       Con "reducir movimiento" se mantiene el observador clásico (aparecer una vez). */
    const ENTRY_CLASSES = ['reveal', 'reveal-left', 'reveal-right', 'reveal-scale', 'stagger-item'];
    const revealItems = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-item, .draw-line');
    const lateItems = revealItems.filter(el => !el.closest('.hero-section'));

    if (reduceMotion) {
        lateItems.forEach(el => {
            if (el.classList.contains('stagger-item')) {
                const siblings = [...el.parentElement.children].filter(c => c.classList.contains('stagger-item'));
                el.dataset.i = siblings.indexOf(el);
            }
        });
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                revealObserver.unobserve(entry.target);
                show(entry.target, (parseInt(entry.target.dataset.i, 10) || 0) * 100);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        lateItems.forEach(el => revealObserver.observe(el));
    } else {
        lateItems.forEach(el => el.classList.remove(...ENTRY_CLASSES));
    }

    /* 6. CONTADORES DE MÉTRICAS (con movimiento completo los mueve el scroll, ver sección 12) */
    const metricsGrid = $('.metrics-grid');
    if (metricsGrid && reduceMotion) {
        $$('.stat-number').forEach(stat => { stat.textContent = stat.dataset.target; });
    }

    /* 7. NAVBAR (sección activa) Y MENÚ MÓVIL */
    const navLinks = $$('.nav-link');
    const mobileToggle = $('#mobileToggle');
    const navMenu = $('#navLinks');

    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('section[id]').forEach(section => spy.observe(section));

    function setMenu(open) {
        navMenu.classList.toggle('active', open);
        document.body.classList.toggle('no-scroll', open);
        if (mobileToggle) {
            mobileToggle.textContent = open ? '✕' : '☰';
            mobileToggle.setAttribute('aria-expanded', String(open));
        }
    }
    if (mobileToggle) mobileToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('active')));
    navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));

    /* 8. TEMA CLARO/OSCURO (se recuerda la elección) */
    const themeToggle = $('#themeToggle');
    try { if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode'); } catch (e) { /* sin almacenamiento */ }
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const light = document.body.classList.toggle('light-mode');
            try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) { /* sin almacenamiento */ }
        });
    }

    /* 9. MODAL DE PROYECTOS */
    const modal = $('#projectModal');
    let lastFocused = null;

    function closeModal() {
        modal.classList.remove('active');
        document.body.classList.remove('no-scroll');
        if (lastFocused) lastFocused.focus();
    }

    $$('.open-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            lastFocused = btn;
            $('#modalTitle').innerText = btn.dataset.title;
            $('#modalDesc').innerText = btn.dataset.desc;
            $('#modalLink').href = btn.dataset.link;
            modal.classList.add('active');
            document.body.classList.add('no-scroll');
            $('#closeModal').focus();
        });
    });

    const closeBtn = $('#closeModal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (modal.classList.contains('active')) closeModal();
        if (navMenu.classList.contains('active')) setMenu(false);
    });

    /* 10. COPIAR EMAIL (con símbolos [@] y [OK]) */
    $$('[data-copy]').forEach(copyBtn => {
        copyBtn.addEventListener('click', () => {
            const email = copyBtn.dataset.copy;
            const original = copyBtn.innerHTML;
            const feedback = (html, ok) => {
                copyBtn.innerHTML = html;
                copyBtn.classList.toggle('copied', ok);
                setTimeout(() => {
                    copyBtn.innerHTML = original;
                    copyBtn.classList.remove('copied');
                }, 2000);
            };
            navigator.clipboard.writeText(email)
                .then(() => feedback('<span class="app-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><span class="contact-text"><small>Listo</small><b>¡Copiado!</b></span>', true))
                .catch(() => feedback('<span class="app-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 7v6m0 4h.01"/></svg></span><span class="contact-text"><small>Error</small><b>Cópialo manualmente</b></span>', false));
        });
    });

    /* 11. VOLVER ARRIBA */
    const backToTop = $('#backToTop');
    if (backToTop) {
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* =========================================
       12. HISTORIA GUIADA POR EL SCROLL
       Un solo bucle por fotograma, en dos fases: primero se LEE toda la geometría
       y después se ESCRIBEN los estilos (evita recálculos de layout intermedios).
       Nada se dispara "una vez": cada valor es función de la posición del scroll.
       (se omite si el sistema pide menos movimiento)
       ========================================= */
    if (reduceMotion) return;

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const sm = t => { t = clamp(t); return t * t * (3 - 2 * t); };

    /* Capas de cine: barras (letterbox), viñeta y grano de película */
    document.body.insertAdjacentHTML('beforeend',
        '<div class="letterbox" aria-hidden="true"><span class="bar bar-top"></span><span class="bar bar-bottom"></span></div>' +
        '<div class="cine-vignette" aria-hidden="true"></div>' +
        '<div class="cine-grain" aria-hidden="true"></div>' +
        '<div class="cine-hud" aria-hidden="true"><span class="rec">REC</span><span class="scene">Esc. 00 · Apertura</span><span class="tc">00:00:00</span></div>');

    /* Capítulos: cada encabezado recibe su número gigante y se anima con el scroll */
    const heads = $$('.section-head');
    heads.forEach((h, i) => {
        h.classList.remove('reveal');
        h.dataset.chapter = String(i + 1).padStart(2, '0');
    });

    /* Texto que se ilumina palabra por palabra */
    const scrubEls = $$('.about-text p, .section-sub').map(el => {
        const words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        const spans = words.map((word, i) => {
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = word;
            el.append(s, i < words.length - 1 ? ' ' : '');
            return s;
        });
        el.classList.add('scrub');
        return { el, spans, lit: -1 };
    });

    const heroSection = $('.hero-section');
    const orb1 = $('.orb-1');
    const orb2 = $('.orb-2');

    /* Habilidades: galería horizontal fija mientras se baja */
    let hs = null;
    const skillsGrid = $('.skills-grid');
    if (skillsGrid) {
        const wrap = document.createElement('div');
        wrap.className = 'hscroll';
        const sticky = document.createElement('div');
        sticky.className = 'hscroll-sticky';
        const ui = document.createElement('div');
        ui.className = 'hscroll-ui';
        ui.innerHTML = '<span class="hscroll-count">01 / 01</span><span class="hscroll-bar"><i></i></span><span class="hscroll-hint">sigue bajando ↓</span>';
        skillsGrid.parentNode.insertBefore(wrap, skillsGrid);
        sticky.append(ui, skillsGrid);
        wrap.append(sticky);
        const cards = $$('.skill-card', skillsGrid);
        cards.forEach((c, i) => { c.dataset.i = i < 4 ? i : 0; });
        hs = { wrap, grid: skillsGrid, bar: $('i', ui), count: $('.hscroll-count', ui), total: cards.length, max: 0, on: false };
    }

    function layoutHscroll() {
        if (!hs) return;
        hs.on = window.innerWidth > 1024 && window.innerHeight >= 560;
        hs.wrap.classList.toggle('hscroll-on', hs.on);
        hs.grid.style.transform = '';
        hs.wrap.style.height = '';
        if (hs.on) {
            hs.max = Math.max(0, hs.grid.scrollWidth - window.innerWidth);
            hs.wrap.style.height = `${hs.max + window.innerHeight}px`;
        }
    }

    function updateHscroll(top) {
        if (!hs || !hs.on || hs.max <= 0) return;
        const p = clamp(-top / hs.max);
        hs.grid.style.transform = `translate3d(${(-p * hs.max).toFixed(1)}px, 0, 0)`;
        hs.bar.style.transform = `scaleX(${p.toFixed(3)})`;
        const idx = Math.min(hs.total, Math.floor(p * hs.total) + 1);
        hs.count.textContent = `${String(idx).padStart(2, '0')} / ${String(hs.total).padStart(2, '0')}`;
    }

    /* ---------- Entradas guiadas por el scroll ----------
       Cada tarjeta se coloca en función de dónde está en pantalla (e: 0 = oculta y desplazada, 1 = en su sitio).
       Mientras e < 1 lleva la clase .sd-live (opacidad, escala y desenfoque salen de --e en el CSS);
       al asentarse se retira la clase para que los efectos de hover sigan funcionando. */
    const flow = [];
    function addFlow(sel, kind, o = {}) {
        $$(sel).forEach(el => {
            const idx = [...el.parentElement.children].indexOf(el);
            el.classList.add('sd-' + kind);
            flow.push({
                el, kind, skip: o.skip || null,
                col: o.grid ? idx % 3 : 0,                          // columna: escalona la entrada dentro de una fila
                dir: o.alt ? (idx % 2 ? 1 : -1) : (o.dir || 1),     // lado desde el que entra (kind 'side')
                depth: 0, e: -1, live: false, tx: 0, ty: 0
            });
        });
    }
    const inHscroll = el => !!(hs && hs.on && el.closest('.hscroll'));
    addFlow('.about-text', 'side', { dir: -1 });
    addFlow('.ficha', 'side', { dir: 1 });
    addFlow('.metric-card', 'zoom', { grid: true });
    addFlow('.marquee-container', 'up');
    addFlow('.skill-card', 'up', { grid: true, skip: inHscroll });
    addFlow('.exp-item', 'side', { alt: true });
    addFlow('.project-card', 'tilt', { grid: true });
    addFlow('.timeline-item', 'side', { dir: 1 });
    addFlow('.creative-item', 'zoom', { grid: true });
    addFlow('.contact-container', 'zoom');
    addFlow('.main-footer', 'up');

    /* Profundidad: las tarjetas de cada columna se mueven a distinta velocidad */
    flow.forEach(it => {
        if (!it.el.parentElement.matches('.goals-grid, .portfolio-grid, .creative-list, .metrics-grid')) return;
        const i = [...it.el.parentElement.children].indexOf(it.el);
        it.depth = ((i % 3) - 1) * 0.04;
    });

    /* Línea de tiempo: la línea se dibuja con el scroll */
    const timeline = $('.timeline');
    if (timeline) { timeline.classList.add('sd-line'); timeline.style.setProperty('--line', 0); }
    let lineP = -1;

    /* Contadores de métricas: suben y bajan con el scroll */
    const stats = $$('.stat-number').map(el => ({ el, target: parseInt(el.dataset.target, 10) || 0, v: -1 }));

    /* Máscaras de portadas y ficha (se abren con el scroll) + paralaje interno de las portadas */
    const masks = [
        ...$$('.project-cover').map(el => [el, 'up']),
        ...$$('.ficha').map(el => [el, 'left'])
    ].map(([el, dir]) => {
        el.classList.add('mr');
        el.dataset.mask = dir;
        el.style.setProperty('--mr', 0);
        return { el, host: el.parentElement, on: true, p: -1 };
    });
    const covers = $$('.project-cover').map(el => ({ el, py: 9 }));

    /* HUD de cámara: escena actual, timecode según el scroll y color de fondo por escena */
    const hud = $('.cine-hud');
    const hudScene = $('.scene', hud);
    const hudTc = $('.tc', hud);
    const sceneSections = $$('section[id]').map(s => {
        const eb = $('.eyebrow', s);
        return { el: s, id: s.id, label: s.id === 'hero' ? '00 · Apertura' : (eb ? eb.textContent.replace('//', '').trim() : s.id) };
    });
    let currentScene = '';
    const FPS = 24, TOTAL_SECONDS = 150;
    const pad2 = n => String(n).padStart(2, '0');

    function updateHud(sceneTops, sy, vh, max) {
        let cur = sceneSections[0];
        sceneSections.forEach((s, i) => { if (sceneTops[i] <= vh * 0.5) cur = s; });
        if (cur.id !== currentScene) {
            currentScene = cur.id;
            hudScene.textContent = 'Esc. ' + cur.label;
            document.body.dataset.scene = cur.id;
            hud.classList.remove('cut');
            void hud.offsetWidth; // reinicia la animación del corte de escena
            hud.classList.add('cut');
        }
        const f = Math.round((max > 0 ? sy / max : 0) * TOTAL_SECONDS * FPS);
        hudTc.textContent = `${pad2(Math.floor(f / FPS / 60))}:${pad2(Math.floor(f / FPS) % 60)}:${pad2(f % FPS)}`;
    }

    /* Botones con efecto imán: siguen suavemente al cursor */
    if (finePointer) {
        $$('.contact-btn, .btn-primary, .btn-secondary').forEach(el => {
            el.classList.add('magnetic');
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.translate = `${(((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(1)}px ${(((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(1)}px`;
            });
            el.addEventListener('mouseleave', () => { el.style.translate = ''; });
        });
    }

    /* Bucle principal: un solo cálculo por fotograma */
    let cineTick = false;

    function cineUpdate() {
        cineTick = false;
        const vh = window.innerHeight;
        const sy = window.scrollY;
        const wide = window.innerWidth > 900;

        /* ---- 1) LECTURA: toda la geometría junta ---- */
        const headR = heads.map(h => h.getBoundingClientRect());
        const scrubR = scrubEls.map(s => s.el.getBoundingClientRect());
        const flowR = flow.map(it => it.el.getBoundingClientRect());
        const maskR = masks.map(m => m.host.getBoundingClientRect());
        const coverR = covers.map(c => c.el.getBoundingClientRect());
        const sceneTops = sceneSections.map(s => s.el.getBoundingClientRect().top);
        const hsTop = hs && hs.on ? hs.wrap.getBoundingClientRect().top : 0;
        const metricsTop = metricsGrid ? metricsGrid.getBoundingClientRect().top : 0;
        const tlR = timeline ? timeline.getBoundingClientRect() : null;
        const maxScroll = document.documentElement.scrollHeight - vh;

        /* ---- 2) ESCRITURA ---- */

        // Hero: se aleja y se desenfoca
        if (heroSection) heroSection.style.setProperty('--hp', clamp(sy / (vh * 0.9)).toFixed(3));

        // Luces de fondo: derivan suavemente con el scroll
        if (orb1) orb1.style.translate = `${(Math.sin(sy / 1800) * 120).toFixed(1)}px ${(Math.cos(sy / 1500) * 140).toFixed(1)}px`;
        if (orb2) orb2.style.translate = `${(Math.cos(sy / 1700) * -120).toFixed(1)}px ${(Math.sin(sy / 1400) * -140).toFixed(1)}px`;

        // Capítulos: entran con zoom y el número gigante se desplaza
        heads.forEach((h, i) => {
            const r = headR[i];
            const e = clamp((vh * 0.95 - r.top) / (vh * 0.4));
            const sp = clamp((vh - r.top) / (vh + r.height));
            if (h._e === undefined || Math.abs(e - h._e) > 0.004) { h.style.setProperty('--e', e.toFixed(3)); h._e = e; }
            if (h._sp === undefined || Math.abs(sp - h._sp) > 0.004) { h.style.setProperty('--sp', sp.toFixed(3)); h._sp = sp; }
            const fl = clamp(1 - Math.abs(sp - 0.4) / 0.28); // flare: sube y baja al cruzar el título
            if (h._fl === undefined || Math.abs(fl - h._fl) > 0.01) { h.style.setProperty('--fl', fl.toFixed(2)); h._fl = fl; }
            h.classList.toggle('active', e > 0.55);
        });

        // Palabras que se encienden
        scrubEls.forEach((s, i) => {
            const p = clamp((vh * 0.9 - scrubR[i].top) / (vh * 0.45));
            const n = Math.round(p * s.spans.length);
            if (n !== s.lit) {
                s.spans.forEach((w, k) => w.classList.toggle('on', k < n));
                s.lit = n;
            }
        });

        // Tarjetas: entrada + profundidad, todo en función de la posición
        flow.forEach((it, i) => {
            const r = flowR[i];
            const off = it.skip ? it.skip(it.el) : false;
            let e = 1;
            if (!off) e = sm((vh - (r.top - it.ty)) / (vh * 0.38) - it.col * 0.14); // se mide sobre la posición sin desplazar
            const live = e < 0.999;

            let x = 0, y = 0;
            if (live) {
                const k = 1 - e;
                if (it.kind === 'side') x = k * (wide ? 90 : 36) * it.dir;
                else if (it.kind === 'zoom') y = k * 30;
                else y = k * (it.kind === 'tilt' ? (wide ? 70 : 40) : (wide ? 56 : 36));
            }
            if (it.depth && wide && !off) y += (r.top + r.height / 2 - it.ty - vh / 2) * it.depth;

            if (live !== it.live) { it.el.classList.toggle('sd-live', live); it.live = live; it.e = -1; }
            if (live && Math.abs(e - it.e) > 0.003) { it.el.style.setProperty('--e', e.toFixed(3)); it.e = e; }
            if (Math.abs(x - it.tx) > 0.3 || Math.abs(y - it.ty) > 0.3 || (x === 0 && y === 0 && (it.tx || it.ty))) {
                it.el.style.translate = (x || y) ? `${x.toFixed(1)}px ${y.toFixed(1)}px` : '';
                it.tx = x; it.ty = y;
            }
        });

        // Máscaras: portadas (de abajo hacia arriba) y ficha (de izquierda a derecha)
        masks.forEach((m, i) => {
            const p = sm((vh * 0.96 - maskR[i].top) / (vh * 0.46));
            const done = p >= 0.999;
            if (done === m.on) { m.el.classList.toggle('mr', !done); m.on = !done; m.p = -1; }
            if (m.on && Math.abs(p - m.p) > 0.004) { m.el.style.setProperty('--mr', p.toFixed(3)); m.p = p; }
        });

        // Paralaje dentro de las portadas
        covers.forEach((c, i) => {
            const r = coverR[i];
            if (r.bottom < -vh || r.top > vh * 2) return;
            const py = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
            if (Math.abs(py - c.py) > 0.004) { c.el.style.setProperty('--py', py.toFixed(3)); c.py = py; }
        });

        // Línea de tiempo
        if (tlR) {
            const lp = clamp((vh * 0.62 - tlR.top) / Math.max(1, tlR.height));
            if (Math.abs(lp - lineP) > 0.003) { timeline.style.setProperty('--line', lp.toFixed(3)); lineP = lp; }
        }

        // Contadores
        if (metricsGrid) {
            const k = 1 - Math.pow(1 - sm((vh * 0.95 - metricsTop) / (vh * 0.45)), 3);
            stats.forEach(st => {
                const v = Math.round(st.target * k);
                if (v !== st.v) { st.el.textContent = v; st.v = v; }
            });
        }

        updateHud(sceneTops, sy, vh, maxScroll);
        updateHscroll(hsTop);
    }

    function requestCine() {
        if (!cineTick) { cineTick = true; requestAnimationFrame(cineUpdate); }
    }

    window.addEventListener('scroll', requestCine, { passive: true });
    window.addEventListener('resize', () => { layoutHscroll(); requestCine(); });
    window.addEventListener('load', () => { layoutHscroll(); requestCine(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layoutHscroll(); requestCine(); });

    layoutHscroll();
    cineUpdate();
});
