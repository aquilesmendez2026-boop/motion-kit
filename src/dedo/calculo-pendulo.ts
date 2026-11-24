// Letrero colgante: el péndulo. Ángulos en grados. Sin React.

/**
 * Avanza `dt` segundos un péndulo con roce que busca el ángulo `objetivo`. Con los valores por defecto se balancea
 * cada 1,3 s y se asienta en menos de 4 s.
 */
export function pasoPendulo(e: { a: number; w: number }, dt: number, objetivo = 0, g = 22, roce = 2.4): { a: number; w: number } {
  const w = e.w + (-g * (e.a - objetivo) - roce * e.w) * dt;
  return { a: e.a + w * dt, w };
}

/** Quieto en su lugar: se puede dejar de calcular. */
export function penduloDormido(e: { a: number; w: number }, objetivo = 0): boolean {
  return Math.abs(e.a - objetivo) < 0.05 && Math.abs(e.w) < 0.05;
}

/**
 * El viento del scroll sobre el letrero: cuántos grados lo ladea bajar la página a `velocidad` px por segundo. Tiene
 * tope: por más rápido que se baje, son pocos grados (el letrero se mueve poco, a propósito).
 */
export function vientoDe(velocidad: number, tope = 3, escala = 400): number {
  if (!Number.isFinite(velocidad)) return 0;
  return Math.max(-1, Math.min(1, velocidad / escala)) * tope;
}
