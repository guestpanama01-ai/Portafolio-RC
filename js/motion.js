/* =========================================
   MOTION: 3D Tilt en tarjetas y 3D en el hero (solo con mouse).
   Las entradas por scroll (aparecer, máscaras, paralaje, contadores, línea de tiempo)
   viven en main.js, sección 12, porque dependen de la posición del scroll.
   Se omite con prefers-reduced-motion; tilt y 3D solo con mouse (no táctil).
   ========================================= */
(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    if (!fine) return; // Lo siguiente es solo para mouse: nada de tilt ni 3D en táctiles

    /* ---------- 3D TILT en tarjetas (con brillo, gracias a .spot) ---------- */
    const busy = '.sd-live';  // no interrumpe la entrada guiada por el scroll
    const tiltConfig = [
        ['.skill-card', 7, 'translateY(-6px)'],
        ['.project-card', 5, 'translateY(-8px)'],
        ['.metric-card', 9, 'translateY(-5px)'],
        ['.creative-item', 8, 'translateY(-5px)'],
        ['.exp-item', 4, 'translateX(8px)'],
        ['.ficha', 4, '']
    ];

    tiltConfig.forEach(([selector, max, lift]) => {
        $$(selector).forEach(el => {
            let raf = 0, px = 0, py = 0;
            const apply = () => {
                raf = 0;
                el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) ${lift}`;
                el.style.setProperty('--tx', (px * 2).toFixed(2));
                el.style.setProperty('--ty', (py * 2).toFixed(2));
            };
            const reset = () => {
                cancelAnimationFrame(raf); raf = 0;
                el.classList.remove('tilt-on');
                el.style.transform = '';
                el.style.willChange = '';
                el.style.setProperty('--tx', 0);
                el.style.setProperty('--ty', 0);
            };
            el.addEventListener('pointerenter', (e) => {
                if (e.pointerType !== 'mouse' || el.matches(busy)) return;
                el.classList.add('tilt-on');
                el.style.willChange = 'transform';
            });
            el.addEventListener('pointermove', (e) => {
                if (e.pointerType !== 'mouse' || !el.classList.contains('tilt-on')) return;
                const r = el.getBoundingClientRect();
                px = (e.clientX - r.left) / r.width - 0.5;
                py = (e.clientY - r.top) / r.height - 0.5;
                if (!raf) raf = requestAnimationFrame(apply);
            });
            el.addEventListener('pointerleave', reset);
        });
    });

    /* ---------- 3D MOTION en el hero: los chips flotan a distinta profundidad ---------- */
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual && window.innerWidth > 968) {
        heroVisual.addEventListener('pointermove', (e) => {
            const r = heroVisual.getBoundingClientRect();
            heroVisual.style.setProperty('--hx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
            heroVisual.style.setProperty('--hy', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
            heroVisual.style.setProperty('--hz', 1);
        });
        heroVisual.addEventListener('pointerleave', () => {
            heroVisual.style.setProperty('--hx', 0);
            heroVisual.style.setProperty('--hy', 0);
            heroVisual.style.setProperty('--hz', 0);
        });
    }
})();
