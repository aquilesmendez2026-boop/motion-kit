/**
 * El contenedor que de verdad hace scroll (null = la página). Solo cuenta un ancestro con overflow-y auto o scroll que
 * tenga contenido más alto que su caja, y nunca `body` ni `html`: con `body{overflow-x:hidden}` (muy común), `body`
 * computa overflow-y auto sin hacer scroll, y medir su alto haría crecer la página sin límite.
 */
export function contenedorScroll(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
    // El `body` tiene scroll propio solo si `html` no se lo pasa a la ventana (con un `overflow` que no es visible).
    if (p === document.body && getComputedStyle(document.documentElement).overflowY === "visible") break;
    const o = getComputedStyle(p).overflowY;
    if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight + 1) return p;
  }
  return null;
}

/** El alto visible donde se baja: el del contenedor con scroll o el de la ventana. */
export const altoVista = (caja: HTMLElement | null) => (caja ? caja.clientHeight : window.innerHeight);
