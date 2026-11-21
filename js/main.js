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

    /* 5. SCROLL REVEAL Y STAGGER */
    const revealItems = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-item, .draw-line');
    revealItems.forEach(el => {
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

    revealItems
        .filter(el => !el.closest('.hero-section'))
        .forEach(el => revealObserver.observe(el));

    /* 6. CONTADORES DE MÉTRICAS */
    const metricsGrid = $('.metrics-grid');
    if (metricsGrid) {
        const counterObserver = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            counterObserver.disconnect();
            $$('.stat-number').forEach(stat => {
                const target = parseInt(stat.dataset.target, 10);
                if (reduceMotion) { stat.textContent = target; return; }
                const duration = 1600;
                const t0 = performance.now();
                const step = (now) => {
                    const p = Math.min((now - t0) / duration, 1);
                    stat.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
                    if (p < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            });
        }, { threshold: 0.4 });
        counterObserver.observe(metricsGrid);
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
       12. CINEMÁTICA: animaciones ligadas al scroll
       (se omite si el sistema pide menos movimiento)
       ========================================= */
    if (reduceMotion) return;

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

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

    /* Profundidad: las tarjetas de cada columna se mueven a distinta velocidad */
    const depthItems = [];
    $$('.goals-grid, .portfolio-grid, .creative-list, .metrics-grid').forEach(grid => {
        [...grid.children].forEach((el, i) => {
            const k = ((i % 3) - 1) * 0.04;
            if (k !== 0) depthItems.push({ el, k, y: 0 });
        });
    });

    /* Deslizamiento lateral: experiencia y línea de tiempo entran desde los lados */
    const slideItems = [
        ...$$('.exp-item').map((el, i) => ({ el, dir: i % 2 ? 1 : -1, x: null })),
        ...$$('.timeline-item').map(el => ({ el, dir: 1, x: null }))
    ];

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

    function updateHscroll() {
        if (!hs || !hs.on || hs.max <= 0) return;
        const rect = hs.wrap.getBoundingClientRect();
        const p = clamp(-rect.top / hs.max);
        hs.grid.style.transform = `translate3d(${(-p * hs.max).toFixed(1)}px, 0, 0)`;
        hs.bar.style.transform = `scaleX(${p.toFixed(3)})`;
        const idx = Math.min(hs.total, Math.floor(p * hs.total) + 1);
        hs.count.textContent = `${String(idx).padStart(2, '0')} / ${String(hs.total).padStart(2, '0')}`;
    }

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

    function updateHud(sy, vh) {
        let cur = sceneSections[0];
        for (const s of sceneSections) { if (s.el.getBoundingClientRect().top <= vh * 0.5) cur = s; }
        if (cur.id !== currentScene) {
            currentScene = cur.id;
            hudScene.textContent = 'Esc. ' + cur.label;
            document.body.dataset.scene = cur.id;
            hud.classList.remove('cut');
            void hud.offsetWidth; // reinicia la animación del corte de escena
            hud.classList.add('cut');
        }
        const max = document.documentElement.scrollHeight - vh;
        const f = Math.round((max > 0 ? sy / max : 0) * TOTAL_SECONDS * FPS);
        const pad = n => String(n).padStart(2, '0');
        hudTc.textContent = `${pad(Math.floor(f / FPS / 60))}:${pad(Math.floor(f / FPS) % 60)}:${pad(f % FPS)}`;
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

        // Hero: se aleja y se desenfoca
        if (heroSection) heroSection.style.setProperty('--hp', clamp(sy / (vh * 0.9)).toFixed(3));

        // Luces de fondo: derivan suavemente con el scroll
        if (orb1) orb1.style.translate = `${(Math.sin(sy / 1800) * 120).toFixed(1)}px ${(Math.cos(sy / 1500) * 140).toFixed(1)}px`;
        if (orb2) orb2.style.translate = `${(Math.cos(sy / 1700) * -120).toFixed(1)}px ${(Math.sin(sy / 1400) * -140).toFixed(1)}px`;

        // Capítulos: entran con zoom y el número gigante se desplaza
        heads.forEach(h => {
            const r = h.getBoundingClientRect();
            const e = clamp((vh * 0.95 - r.top) / (vh * 0.4));
            const sp = clamp((vh - r.top) / (vh + r.height));
            if (h._e === undefined || Math.abs(e - h._e) > 0.004) { h.style.setProperty('--e', e.toFixed(3)); h._e = e; }
            if (h._sp === undefined || Math.abs(sp - h._sp) > 0.004) { h.style.setProperty('--sp', sp.toFixed(3)); h._sp = sp; }
            const fl = clamp(1 - Math.abs(sp - 0.4) / 0.28); // flare: sube y baja al cruzar el título
            if (h._fl === undefined || Math.abs(fl - h._fl) > 0.01) { h.style.setProperty('--fl', fl.toFixed(2)); h._fl = fl; }
            if (e > 0.55) h.classList.add('active');
        });

        // Palabras que se encienden
        scrubEls.forEach(s => {
            const r = s.el.getBoundingClientRect();
            const p = clamp((vh * 0.9 - r.top) / (vh * 0.45));
            const n = Math.round(p * s.spans.length);
            if (n !== s.lit) {
                s.spans.forEach((w, i) => w.classList.toggle('on', i < n));
                s.lit = n;
            }
        });

        // Profundidad (se desactiva en pantallas pequeñas)
        depthItems.forEach(d => {
            if (!wide) {
                if (d.y !== 0) { d.el.style.translate = ''; d.y = 0; }
                return;
            }
            const r = d.el.getBoundingClientRect();
            if (r.bottom < -200 || r.top > vh + 200) return;
            const base = r.top + r.height / 2 - d.y; // posición sin el desplazamiento ya aplicado
            d.y = (base - vh / 2) * d.k;
            d.el.style.translate = `0 ${d.y.toFixed(1)}px`;
        });

        // Deslizamiento lateral
        const amp = wide ? 90 : 36;
        slideItems.forEach(s => {
            const r = s.el.getBoundingClientRect();
            const e = clamp((vh * 1.02 - r.top) / (vh * 0.38));
            const x = (1 - e) * amp * s.dir;
            if (s.x === null || Math.abs(x - s.x) > 0.3) {
                s.el.style.translate = `${x.toFixed(1)}px 0`;
                s.x = x;
            }
        });

        updateHud(sy, vh);
        updateHscroll();
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
