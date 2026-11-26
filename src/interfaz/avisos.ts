// Avisos (Toast): lo calculable. Cuándo un deslizamiento cierra, cuál sale si hay muchos y cuánto dura cada uno.

/** Cierra si se arrastró más de 80 px, o un tirón rápido (más de 0,6 px/ms) de al menos 24 px. Para cualquier lado. */
export function cierraDeslizando(dx: number, vx: number): boolean {
  const d = Math.abs(Number.isFinite(dx) ? dx : 0);
  const v = Math.abs(Number.isFinite(vx) ? vx : 0);
  return d > 80 || (v > 0.6 && d > 24);
}

/**
 * Cuál aviso sale cuando hay demasiados (su índice; la lista va del más antiguo al recién llegado, el último), o -1 si
 * nadie. Caben tres; cuatro si alguno trae acción («Deshacer»). Sale el más antiguo sin acción, nunca el recién llegado;
 * si todos los anteriores tienen acción, el más antiguo.
 */
export function quienSale<T extends { conAccion: boolean }>(lista: T[]): number {
  const caben = lista.some((a) => a.conAccion) ? 4 : 3;
  if (lista.length <= caben) return -1;
  const sinAccion = lista.slice(0, -1).findIndex((a) => !a.conAccion);
  return sinAccion >= 0 ? sinAccion : 0;
}

/** Lo que dura un aviso: 3,2 s; 6 s si trae una acción; lo que diga `duration`, si se pasa. */
export function duracionDe(o: { duration?: number; accion?: unknown }): number {
  return o.duration ?? (o.accion ? 6000 : 3200);
}
