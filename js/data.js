/* =========================================
   CONTENIDO REAL (tomado de tu portafolio anterior, sin inventar nada)
   ========================================= */

const KAVARI_IMG = 'https://kavari-website.github.io/Kavariwebsite/img/';

export const PROFILE = {
    name: 'Rafael C.',
    role: 'Estudiante de tecnología',
    place: 'David, Chiriquí, Panamá',
    lead: 'Programación, Linux, redes y ciberseguridad.'
};

export const ABOUT = {
    a: {
        tag: 'Presentación',
        title: 'Mi historia con la tecnología',
        text: 'Soy un estudiante apasionado por la tecnología y el aprendizaje constante. Me interesa comprender cómo funcionan los sistemas, desarrollar herramientas digitales y encontrar soluciones a problemas mediante la tecnología.'
    },
    b: {
        tag: 'Formación académica',
        title: 'Bachillerato en Ciencias',
        text: 'Colegio Pablo Emilio Corsen, David, Chiriquí, Panamá. También participo en el programa ¡Supérate! (Institución ¡Supérate! David), enfocado en habilidades técnicas y tecnológicas.'
    },
    c: {
        tag: 'Intereses',
        title: 'Experimentar y mejorar',
        text: 'Tengo conocimientos en programación, desarrollo web, diseño digital, hardware, software y fundamentos de redes y ciberseguridad. Me gusta experimentar con nuevas tecnologías y convertir ideas en soluciones funcionales. También me interesa la inteligencia artificial.'
    },
    d: {
        tag: 'Objetivos tecnológicos',
        title: 'Lo que quiero construir',
        list: [
            'Profundizar en ciberseguridad, redes y protección de sistemas.',
            'Mejorar mi programación y crear aplicaciones funcionales.',
            'Construir sitios web modernos, optimizados y con buena experiencia de usuario.',
            'Explorar cómo integrar IA y automatizar procesos.',
            'Ampliar mis conocimientos de hardware y sistemas operativos.',
            'Desarrollar proyectos propios y ofrecer soluciones digitales en el futuro.'
        ]
    }
};

/* Cada tecnología es un objeto del laboratorio: forma 3D + descripción tomada de tus habilidades reales */
export const SKILLS = [
    {
        id: 'python', name: 'Python', shape: 'torus', area: 'Programación',
        text: 'Desarrollo de soluciones mediante lenguajes de programación, automatización de tareas y experimentación con diferentes herramientas.',
        tags: ['Programación', 'Automatización']
    },
    {
        id: 'js', name: 'JavaScript', shape: 'box', area: 'Programación y web',
        text: 'Lenguaje con el que construyo la lógica de mis sitios web y las interacciones. Lo uso en KAVARI Travel y en este portafolio.',
        tags: ['Interacción', 'Frontend']
    },
    {
        id: 'html', name: 'HTML y CSS', shape: 'prism', area: 'Desarrollo web',
        text: 'Creación, mantenimiento y mejora de sitios web: estructura, diseño de interfaces y experiencias digitales.',
        tags: ['HTML', 'CSS', 'UI']
    },
    {
        id: 'linux', name: 'Linux', shape: 'terminal', area: 'Software y sistemas',
        text: 'Instalación, configuración, administración y resolución de problemas de sistemas operativos y aplicaciones. Trabajo también con Windows.',
        tags: ['Linux', 'Windows', 'Software']
    },
    {
        id: 'redes', name: 'Redes informáticas', shape: 'network', area: 'Redes',
        text: 'Fundamentos de redes informáticas, conectividad y comandos de diagnóstico desde CMD.',
        tags: ['Redes', 'CMD']
    },
    {
        id: 'sec', name: 'Ciberseguridad', shape: 'shield', area: 'En aprendizaje',
        text: 'Fundamentos de seguridad digital. Es el área en la que más quiero profundizar: seguridad informática, redes y protección de sistemas.',
        tags: ['Seguridad informática', 'Fundamentos']
    }
];

export const SKILLS_EXTRA = 'También trabajo con bases de datos (Supabase, SQL, JSON), hardware y mantenimiento de equipos, inteligencia artificial generativa y diseño digital (Canva, Photoshop).';

export const PROJECTS = [
    {
        id: 'kavari', featured: true,
        name: 'KAVARI Travel',
        label: 'Proyecto destacado',
        text: 'Plataforma web de turismo que reúne información útil para personas interesadas en conocer diferentes destinos. Facilita la exploración de lugares, cultura, gastronomía, alojamientos y opciones de viaje desde un mismo sitio. Incluye mapas interactivos y asistente informativo.',
        tech: ['HTML', 'CSS', 'JavaScript', 'Supabase'],
        link: 'https://kavari-website.github.io/Kavariwebsite/',
        images: [
            { src: KAVARI_IMG + 'panama/bannerpanama2.webp', alt: 'Guía de Panamá en KAVARI' },
            { src: KAVARI_IMG + 'banner-venezuela.webp', alt: 'Destino en KAVARI' },
            { src: KAVARI_IMG + 'mascota.webp', alt: 'Mascota de KAVARI' }
        ],
        logo: KAVARI_IMG + 'logokavari.webp'
    },
    {
        id: 'web', name: 'Desarrollo de sitios web', label: 'Práctica continua',
        text: 'Creación y mejora de páginas web, trabajando en estructura, diseño, funcionalidades, rendimiento y experiencia de usuario.',
        tech: ['Frontend', 'UI/UX', 'JavaScript']
    },
    {
        id: 'data', name: 'Gestión de bases de datos', label: 'Práctica continua',
        text: 'Práctica de organización, mantenimiento e integración de bases de datos para almacenar y administrar información de proyectos.',
        tech: ['Supabase', 'SQL', 'JSON']
    },
    {
        id: 'ai', name: 'Experimentación con IA', label: 'Exploración',
        text: 'Exploración de herramientas generativas para crear imágenes, recursos digitales y apoyar procesos creativos y de desarrollo.',
        tech: ['IA', 'Generación visual', 'Prompts']
    }
];

export const PATH = [
    {
        id: 'p1', when: 'Actualidad', title: 'Bachillerato en Ciencias',
        sub: 'Colegio Pablo Emilio Corsen',
        text: 'David, Chiriquí, Panamá. Formación enfocada en ciencias y bases académicas sólidas.'
    },
    {
        id: 'p2', when: 'Actualidad', title: 'Programa ¡Supérate!',
        sub: 'Institución ¡Supérate! David',
        text: 'Participación en el programa ¡Supérate!, enfocado en el desarrollo de habilidades técnicas y tecnológicas.'
    },
    {
        id: 'p3', when: 'Formación independiente', title: 'Aprendizaje tecnológico',
        sub: 'Proyectos personales',
        text: 'Programación, desarrollo web, hardware, software, bases de datos y sistemas operativos. Mi experiencia se desarrolla mediante proyectos personales, actividades académicas y aprendizaje independiente.'
    },
    {
        id: 'p4', when: 'Interés en profundizar', title: 'Ciberseguridad',
        sub: 'Siguiente paso',
        text: 'Seguridad informática, redes, protección de sistemas y administración de infraestructura tecnológica.'
    }
];

export const CONTACT = {
    email: 'guestpanama01@gmail.com',
    github: { label: 'guestpanama01-ai', url: 'https://github.com/guestpanama01-ai' },
    instagram: { label: '@rafaelcamch', url: 'https://www.instagram.com/rafaelcamch' },
    discord: 'rafaelcmch'
};
