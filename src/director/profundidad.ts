// La profundidad con que se ve lo que se inclina en las escenas continuas y de estado. Va en el padre de lo que se
// inclina (`perspective`), y la pone el Director: no es parte del dato. Se lleva la cuenta de cuántos la usan, porque
// dos partituras pueden compartir padre.
// Límite conocido: mientras está puesta, ese padre ordena y ubica a sus hijos como lo haría uno con `transform` (un
// hijo `position: fixed` se ubica respecto de él, y sus `z-index` no salen de él). Si el actor es la raíz, el padre
// queda fuera de la raíz.
import { PROFUNDIDAD } from "./modelo";

/** Cuántos usan la profundidad que el Director puso en cada elemento. */
const cuenta = new WeakMap<object, number>();

/**
 * Pone la profundidad en `el`, si no trae una propia. Lo que devuelve la suelta (una sola vez); cuando la suelta el
 * último que la usaba, el elemento queda como estaba.
 */
export function darProfundidad(el: HTMLElement | null): () => void {
  if (!el) return () => {};
  const usos = cuenta.get(el) ?? 0;
  if (!usos) {
    // Si ya trae la suya (en línea o por CSS), no se toca.
    const propia = el.style.perspective || (typeof getComputedStyle === "function" ? getComputedStyle(el).perspective : "");
    if (propia && propia !== "none") return () => {};
    el.style.perspective = `${PROFUNDIDAD}px`;
  }
  cuenta.set(el, usos + 1);
  let suelta = false;
  return () => {
    if (suelta) return;
    suelta = true;
    const quedan = (cuenta.get(el) ?? 1) - 1;
    if (quedan > 0) return void cuenta.set(el, quedan);
    cuenta.delete(el);
    // Solo si sigue siendo la que se puso aquí: si la página puso la suya después, es de la página.
    if (el.style.perspective === `${PROFUNDIDAD}px`) el.style.perspective = "";
  };
}
