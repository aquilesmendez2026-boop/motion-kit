// Saber cuándo termina una animación o una transición, sin quedarse esperando un aviso que puede no llegar: con
// «reducir movimiento» no corre ninguna (base.ts las apaga), y entonces no hay `animationend` ni `transitionend`.

/** El tiempo más largo de una lista de CSS («.3s, 1s»), en segundos. */
const segundos = (v: string) => Math.max(0, ...v.split(",").map((x) => parseFloat(x) || 0));

/**
 * Llama a `listo` una sola vez cuando termina la animación (o la transición) de `el`: con el aviso del navegador (el
 * de `el`, no el de un hijo), o pasado su tiempo si el aviso no llega; y de inmediato si no hay ninguna corriendo.
 * Devuelve cómo dejar de esperar.
 */
export function alAcabar(el: HTMLElement, tipo: "animation" | "transition", listo: () => void): () => void {
  const c = getComputedStyle(el);
  const dura = tipo === "animation" ? (c.animationName === "none" ? 0 : segundos(c.animationDuration) + segundos(c.animationDelay)) : segundos(c.transitionDuration) + segundos(c.transitionDelay);
  let hecho = false;
  const soltar = () => {
    hecho = true;
    clearTimeout(espera);
    el.removeEventListener(`${tipo}end`, fin);
  };
  const fin = (ev?: Event) => {
    if (hecho || (ev && ev.target !== el)) return;
    soltar();
    listo();
  };
  const espera = setTimeout(fin, dura ? dura * 1000 + 200 : 0);
  el.addEventListener(`${tipo}end`, fin);
  return soltar;
}
