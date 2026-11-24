// Relieve: lo calculable. Un terreno suave que ondula de a poco; el dedo levanta un cerro. Sin React.

/** A menos de esto del dedo, el terreno sube (px). */
const CERRO = 140;

/** La altura del terreno en un punto a los `t` segundos, de -1 a 1. Bajo el dedo llega a 1. */
export function alturaRelieve(x: number, y: number, t: number, dedo?: { x: number; y: number } | null): number {
  const h = (Math.sin(x * 0.006 + y * 0.013 + t * 0.25) + 0.6 * Math.sin(x * 0.013 - y * 0.031 - t * 0.18) + 0.4 * Math.sin(y * 0.02 + t * 0.12)) / 2;
  if (!dedo) return h;
  const d = Math.hypot(x - dedo.x, y - dedo.y);
  if (d >= CERRO) return h;
  // Un cerro redondo: sin quiebres en la cima ni en la falda.
  const c = Math.cos((Math.PI * d) / (CERRO * 2));
  return h + (1 - h) * c * c;
}
