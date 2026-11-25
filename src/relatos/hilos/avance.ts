// En qué parte del scroll se dibuja cada punto de un hilo (o de las ramas). Puro, sin navegador. Va aparte para que
// las ramas lo usen sin bajar el trazado de los hilos.

/** Lo que hace falta de la página: su alto, el alto visible, cuánto se baja en total y dónde parte la página en ese scroll. */
export interface Avance {
  alto: number;
  vista: number;
  recorrido: number;
  arriba: number;
}

const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const acota = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * El porcentaje del scroll (0 a 100) en que el punto de altura `y` pasa por el 60 % de la vista. Al final de la bajada
 * esa línea ya no alcanza a lo último de la página: en el último tramo (un alto de vista) la línea baja de a poco hasta
 * el borde de abajo, para que el hilo llegue al final justo cuando se termina de bajar. Nada se dibuja bajo la pantalla.
 */
export function scrollDe(y: number, m: Avance): number {
  if (!fin(y) || !m || !fin(m.recorrido) || m.recorrido <= 0 || !fin(m.vista) || !fin(m.arriba) || !fin(m.alto)) return 100;
  const llano = (v: number) => (m.arriba + v - 0.6 * m.vista) / m.recorrido;
  // Hasta dónde llega la línea del 60 % con todo el scroll.
  const tope = m.recorrido - m.arriba + 0.6 * m.vista;
  if (m.alto <= tope) return acota(llano(y) * 100, 0, 100);
  const s0 = Math.max(0, 1 - m.vista / m.recorrido);
  const y0 = s0 * m.recorrido - m.arriba + 0.6 * m.vista;
  // Lo último que se puede ver con todo el scroll (el borde de abajo de la pantalla): ahí termina la bajada.
  const ultimo = Math.min(m.alto, m.recorrido - m.arriba + m.vista);
  const s = y <= y0 ? llano(y) : s0 + ((1 - s0) * (y - y0)) / Math.max(1, ultimo - y0);
  return acota(s * 100, 0, 100);
}
