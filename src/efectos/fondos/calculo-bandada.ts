// Bandada: lo calculable. Cada ave mira a sus vecinas: se junta, se alinea y no se encima. Sin React.
import { semilla } from "../semilla";

export interface Ave {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Hasta dónde ve un ave a sus vecinas, cuándo están muy cerca, y a qué distancia esquiva al dedo (px). */
const VER = 70;
const CERCA = 22;
const HUIR = 120;
/** Rapidez mínima y máxima (px por segundo). */
const MIN = 30;
const MAX = 90;

/** Aves repartidas en la caja, cada una con su rumbo. */
export function crearBandada(n: number, ancho: number, alto: number, sal: number): Ave[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const angulo = semilla(i * 4 + 2, sal) * Math.PI * 2;
    const rapidez = MIN + semilla(i * 4 + 3, sal) * (MAX - MIN) * 0.5;
    return { x: semilla(i * 4, sal) * ancho, y: semilla(i * 4 + 1, sal) * alto, vx: Math.cos(angulo) * rapidez, vy: Math.sin(angulo) * rapidez };
  });
}

/** Avanza la bandada `dt` segundos. Dan la vuelta por los bordes y esquivan al dedo. */
export function pasoBandada(aves: Ave[], dt: number, ancho: number, alto: number, dedo?: { x: number; y: number } | null): void {
  if (!(dt > 0)) return;
  for (const a of aves) {
    let cx = 0;
    let cy = 0;
    let mx = 0;
    let my = 0;
    let vecinas = 0;
    let ax = 0;
    let ay = 0;
    for (const b of aves) {
      if (b === a) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= VER * VER) continue;
      vecinas++;
      cx += b.x;
      cy += b.y;
      mx += b.vx;
      my += b.vy;
      if (d2 < CERCA * CERCA && d2 > 0) {
        const d = Math.sqrt(d2);
        const empuje = (1 - d / CERCA) * 240;
        ax -= (dx / d) * empuje;
        ay -= (dy / d) * empuje;
      }
    }
    if (vecinas) {
      ax += (cx / vecinas - a.x) * 0.6 + (mx / vecinas - a.vx) * 1.2;
      ay += (cy / vecinas - a.y) * 0.6 + (my / vecinas - a.vy) * 1.2;
    }
    if (dedo) {
      const dx = a.x - dedo.x;
      const dy = a.y - dedo.y;
      const d = Math.hypot(dx, dy);
      if (d < HUIR) {
        const empuje = (1 - d / HUIR) * 600;
        // Justo encima del dedo no hay hacia dónde: sale por donde venía.
        ax += d > 0 ? (dx / d) * empuje : -a.vx;
        ay += d > 0 ? (dy / d) * empuje : -a.vy;
      }
    }
    // Un vaivén suave según dónde va: la bandada no sigue derecho para siempre.
    const giro = Math.sin(a.x * 0.004 + a.y * 0.003) * 0.4 * dt;
    const [c, s] = [Math.cos(giro), Math.sin(giro)];
    let vx = (a.vx + ax * dt) * c - (a.vy + ay * dt) * s;
    let vy = (a.vx + ax * dt) * s + (a.vy + ay * dt) * c;
    const v = Math.hypot(vx, vy);
    if (!(v > 0)) {
      vx = MIN;
      vy = 0;
    } else if (v < MIN || v > MAX) {
      const k = (v < MIN ? MIN : MAX) / v;
      vx *= k;
      vy *= k;
    }
    a.vx = vx;
    a.vy = vy;
    a.x = dentro(a.x + vx * dt, ancho);
    a.y = dentro(a.y + vy * dt, alto);
  }
}

/** Da la vuelta por el borde; si aun así queda fuera (una caja más chica que el paso), se deja adentro. */
const dentro = (x: number, largo: number) => {
  const y = x < 0 ? x + largo : x > largo ? x - largo : x;
  return y >= 0 && y <= largo ? y : 0;
};
