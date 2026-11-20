document.addEventListener('DOMContentLoaded', () => {
    
    /* 1. PRELOADER Y BARRA DE PROGRESO */
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => setTimeout(() => preloader.classList.add('hidden'), 600));
    
    const progressBar = document.getElementById('scrollProgress');
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progressBar.style.transform = `scaleX(${(scrollTop / scrollHeight)})`;
    });

    /* 2. EFECTO 3D TARJETA */
    const card = document.getElementById('floatingCard');
    const wrapper = document.querySelector('.hero-card-wrapper');
    if (wrapper && card) {
        wrapper.addEventListener('mousemove', (e) => {
            const rect = wrapper.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            card.style.transform = `rotateY(${x/10}deg) rotateX(${y/-10}deg) rotateZ(5deg) scale(1.02)`;
        });
        wrapper.addEventListener('mouseleave', () => {
            card.style.transform = `rotateY(-15deg) rotateX(5deg) rotateZ(5deg) scale(1)`;
        });
    }

    /* 3. SCROLL REVEAL Y STAGGER */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('active'); observer.unobserve(entry.target); }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('active'), index * 100);
                staggerObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.stagger-item').forEach(el => staggerObserver.observe(el));

    /* 4. CONTADORES DE MÉTRICAS */
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;
    const metricsSection = document.querySelector('.metrics-grid');
    if (metricsSection) {
        const counterObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !animated) {
                animated = true;
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    let count = 0;
                    const updateCount = () => {
                        count++; stat.innerText = count;
                        if (count < target) setTimeout(updateCount, 1000 / target);
                    };
                    updateCount();
                });
            }
        }, { threshold: 0.5 });
        counterObserver.observe(metricsSection);
    }

    /* 5. NAVBAR Y MENÚ MÓVIL */
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            if (scrollY >= (section.offsetTop - section.clientHeight / 3)) current = section.getAttribute('id');
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
        });
    });

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.innerText = navMenu.classList.contains('active') ? '✕' : '☰';
        });
    }

    navLinks.forEach(link => link.addEventListener('click', () => {
        navMenu.classList.remove('active'); 
        if(mobileToggle) mobileToggle.innerText = '☰';
    }));

    /* 6. TEMA CLARO/OSCURO */
    const themeToggle = document.getElementById('themeToggle');
    if(themeToggle) {
        themeToggle.addEventListener('click', () => document.body.classList.toggle('light-mode'));
    }

    /* 7. MODAL DE PROYECTOS */
    const modal = document.getElementById('projectModal');
    document.querySelectorAll('.open-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.getElementById('modalTitle').innerText = e.target.getAttribute('data-title');
            document.getElementById('modalDesc').innerText = e.target.getAttribute('data-desc');
            document.getElementById('modalLink').href = e.target.getAttribute('data-link');
            modal.classList.add('active');
        });
    });
    
    if(document.getElementById('closeModal')){
        document.getElementById('closeModal').addEventListener('click', () => modal.classList.remove('active'));
    }
    if(modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    }

    /* 8. COPIAR EMAIL (Con símbolos [@] y [OK]) */
    const copyBtn = document.getElementById('copyEmail');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(copyBtn.getAttribute('data-email')).then(() => {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span class="symbol">[OK]</span> ¡Copiado!';
                copyBtn.style.background = 'var(--accent-color)'; 
                copyBtn.style.color = '#000';
                
                setTimeout(() => { 
                    copyBtn.innerHTML = originalHTML; 
                    copyBtn.style.background = ''; 
                    copyBtn.style.color = ''; 
                }, 2000);
            });
        });
    }

    /* 9. VOLVER ARRIBA */
    const backToTop = document.getElementById('backToTop');
    if(backToTop) {
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
    });;;