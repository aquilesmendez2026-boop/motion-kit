// Luciérnagas: lo calculable. Luces que derivan despacio y se encienden y apagan, cada una a su ritmo. Sin React.
import { semilla } from "../semilla";

export interface Luz {
  x: number;
  y: number;
  /** Dónde va de su ciclo de luz (radianes) y qué tan rápido lo recorre (radianes por segundo). */
  fase: number;
  ritmo: number;
  vx: number;
  vy: number;
  /** Segundos que lleva volando (para su vaivén). */
  vuelo: number;
}

/** Cerca del dedo se encienden: del todo a menos de 110 px, y de ahí se apagan hasta los 150. */
const CERCA = 110;
const LEJOS = 150;

/** Luces repartidas en la caja, con una deriva de 4 a 11 px por segundo. */
export function crearLuces(n: number, ancho: number, alto: number, sal: number): Luz[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const angulo = semilla(i * 6 + 2, sal) * Math.PI * 2;
    const rapidez = 4 + semilla(i * 6 + 3, sal) * 7;
    return {
      x: semilla(i * 6, sal) * ancho,
      y: semilla(i * 6 + 1, sal) * alto,
      fase: semilla(i * 6 + 4, sal) * Math.PI * 2,
      ritmo: 0.6 + semilla(i * 6 + 5, sal) * 0.9,
      vx: Math.cos(angulo) * rapidez,
      vy: Math.sin(angulo) * rapidez,
      vuelo: 0,
    };
  });
}

/**
 * Mueve las luces `dt` segundos: van serpenteando (giran a un lado y después al otro, sin cambiar de rapidez) y dan la
 * vuelta por los bordes. Con un giro parejo darían vueltas al mismo círculo para siempre.
 */
export function pasoLuces(luces: Luz[], dt: number, ancho: number, alto: number): void {
  if (!(dt > 0)) return;
  for (const p of luces) {
    p.vuelo += dt;
    const giro = Math.sin(p.vuelo * p.ritmo * 0.7 + p.fase) * 0.9 * dt;
    const [c, s] = [Math.cos(giro), Math.sin(giro)];
    [p.vx, p.vy] = [p.vx * c - p.vy * s, p.vx * s + p.vy * c];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < 0) p.x += ancho;
    else if (p.x > ancho) p.x -= ancho;
    if (p.y < 0) p.y += alto;
    else if (p.y > alto) p.y -= alto;
  }
}

/** Cuánto brilla una luz a los `t` segundos, de 0 a 1: pasa buena parte del tiempo apagada. Junto al dedo, encendida. */
export function brilloLuz(luz: Luz, t: number, dedo?: { x: number; y: number } | null): number {
  const pulso = Math.max(0, Math.sin(luz.fase + t * luz.ritmo));
  const sola = pulso * pulso;
  if (!dedo) return sola;
  const d = Math.hypot(luz.x - dedo.x, luz.y - dedo.y);
  return Math.max(sola, Math.max(0, Math.min(1, (LEJOS - d) / (LEJOS - CERCA))));
}
