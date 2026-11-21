/* =========================================
   CONFIGURACIÓN COMPARTIDA
   Mapa del recorrido: cada escena ocupa un tramo del progreso de scroll (p: 0 → 1)
   y la cámara sigue estos fotogramas clave en primera persona a lo largo del eje -Z.
   ========================================= */

export const ACCENT = 0x7dd3fc; // azul celeste

// Posición en Z de las estructuras que conectan una escena con la siguiente
export const Z = { gate1: -34, gate2: -90, gate3: -154, gate4: -220, gate5: -284 };

export const SCENES = [
    { id: 'intro',    num: '01', label: 'Introducción', p0: 0,    p1: 0.14, stop: 0 },
    { id: 'about',    num: '02', label: 'Sobre mí',     p0: 0.14, p1: 0.38, stop: 0.17 },
    { id: 'skills',   num: '03', label: 'Habilidades',  p0: 0.38, p1: 0.60, stop: 0.455 },
    { id: 'projects', num: '04', label: 'Proyectos',    p0: 0.60, p1: 0.81, stop: 0.72 },
    { id: 'path',     num: '05', label: 'Formación',    p0: 0.81, p1: 0.94, stop: 0.885 },
    { id: 'contact',  num: '06', label: 'Contacto',     p0: 0.94, p1: 1.01, stop: 1 }
];

// Fotogramas clave de la cámara: progreso, posición y punto de mira
export const KEYS = [
    { p: 0.00, pos: [0, 1.7, 6],     look: [0, 2.6, -20] },
    { p: 0.12, pos: [0, 1.7, -27],   look: [0, 2.4, -40] },
    { p: 0.17, pos: [0, 1.7, -41],   look: [0, 2.0, -56] },
    { p: 0.23, pos: [0, 1.7, -55],   look: [0, 2.0, -70] },
    { p: 0.31, pos: [0, 1.7, -71],   look: [0, 2.0, -86] },
    { p: 0.38, pos: [0, 1.7, -86],   look: [0, 2.2, -100] },
    { p: 0.46, pos: [0, 1.7, -108],  look: [0, 1.9, -123] },
    { p: 0.54, pos: [0, 1.7, -130],  look: [0, 1.9, -145] },
    { p: 0.60, pos: [0, 1.7, -150],  look: [0, 2.2, -165] },
    { p: 0.66, pos: [0, 1.8, -164],  look: [0, 3.0, -188] },
    { p: 0.74, pos: [0, 2.0, -174],  look: [0, 3.4, -196] },
    { p: 0.80, pos: [0, 2.2, -180],  look: [0, 3.4, -204] },
    { p: 0.84, pos: [0, 2.0, -226],  look: [0, 3.0, -243] },
    { p: 0.90, pos: [0, 2.4, -248],  look: [0, 4.0, -266] },
    { p: 0.94, pos: [0, 3.0, -266],  look: [0, 4.0, -283] },
    { p: 1.00, pos: [0, 1.8, -293],  look: [0, 1.8, -304] }
];

// Paneles laterales de "Sobre mí": aparecen sincronizados con el avance de la cámara
export const PANELS = [
    { id: 'a', from: 0.170, to: 0.235, side: -1 },
    { id: 'b', from: 0.210, to: 0.290, side: 1 },
    { id: 'c', from: 0.265, to: 0.335, side: -1 },
    { id: 'd', from: 0.310, to: 0.385, side: 1 }
];

// Ventanas de visibilidad de los encabezados de cada escena
export const HUD = {
    intro:    [-1, 0.105],
    skills:   [0.40, 0.595],
    projects: [0.625, 0.80],
    path:     [0.835, 0.935],
    contact:  [0.955, 1.2]
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const sstep = t => { t = clamp(t); return t * t * (3 - 2 * t); };

// Cantidad 0..1 de una ventana [from,to] con entrada y salida suaves
export function amt(p, from, to, f = 0.012) {
    return sstep(Math.min((p - from) / f, (to - p) / f));
}
