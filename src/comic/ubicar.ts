// La guía: dónde va la mano (y hacia dónde apunta), el globo y el recorte del elemento señalado, dentro de la vista.
import { PUNTA_MANO } from "./calculo";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Ubicacion {
  /** La esquina superior izquierda de la caja de la mano (sin girar) y hacia dónde apunta. */
  mano: { x: number; y: number; direccion: "derecha" | "arriba" | "abajo" };
  globo: { x: number; y: number; cola: "arriba" | "abajo" };
  foco: Rect;
}

const MARGEN = 8;
const num = (n: number, d = 0) => (Number.isFinite(n) ? n : d);
const entre = (n: number, a: number, b: number) => (b < a ? a : Math.min(b, Math.max(a, n)));

/**
 * La mano a la izquierda del elemento, apuntando a la derecha, si cabe; si no, debajo apuntando arriba; si no, encima
 * apuntando abajo. El globo debajo del elemento y de la mano; si no cabe, encima. Todo dentro de la vista con 8 px.
 */
export function ubicar(objetivo: Rect, vista: { w: number; h: number }, medidas: { mano: number; globo: number; altoGlobo: number }): Ubicacion {
  const v = { w: Math.max(1, num(vista.w, 390)), h: Math.max(1, num(vista.h, 844)) };
  const o = { x: num(objetivo.x), y: num(objetivo.y), w: Math.max(0, num(objetivo.w)), h: Math.max(0, num(objetivo.h)) };
  const W = Math.max(1, num(medidas.mano, 150));
  const G = Math.max(1, num(medidas.globo, 300));
  const A = Math.max(1, num(medidas.altoGlobo, 190));
  const P = PUNTA_MANO;

  let mano: Ubicacion["mano"];
  let caja: Rect;
  const xDerecha = o.x - 2 - P.derecha.x * W;
  // Ya girada, la punta queda 0,167 W a la izquierda del borde de la caja (arriba) o 0,333 W (abajo).
  const tx = (izq: number, der: number) => entre(o.x + Math.min(o.w / 2, 60), MARGEN + izq * W, v.w - MARGEN - der * W);
  if (xDerecha >= MARGEN) {
    const y = entre(o.y + o.h / 2 - P.derecha.y * W, MARGEN, v.h - MARGEN - W / 2);
    mano = { x: xDerecha, y, direccion: "derecha" };
    caja = { x: xDerecha, y, w: W, h: W / 2 };
  } else {
    const abajoDelObjetivo = o.y + o.h + 2;
    const cabeDebajo = abajoDelObjetivo + 0.973 * W <= v.h - MARGEN;
    const cabeEncima = o.y - 2 - 0.973 * W >= MARGEN;
    if (cabeDebajo || !cabeEncima) {
      const px = tx(0.167, 0.333);
      const py = entre(abajoDelObjetivo, MARGEN + 0.027 * W, v.h - MARGEN - 0.973 * W);
      mano = { x: px - P.arriba.x * W, y: py - P.arriba.y * W, direccion: "arriba" };
    } else {
      const px = tx(0.333, 0.167);
      mano = { x: px - P.abajo.x * W, y: o.y - 2 - P.abajo.y * W, direccion: "abajo" };
    }
    caja = { x: mano.x + W / 4, y: mano.y - W / 4, w: W / 2, h: W };
  }

  const gx = entre(o.x, MARGEN, v.w - MARGEN - G);
  const debajo = Math.max(o.y + o.h, caja.y + caja.h) + 12;
  const encima = Math.min(o.y, caja.y) - 12 - A;
  const globo: Ubicacion["globo"] =
    debajo + A <= v.h - MARGEN
      ? { x: gx, y: debajo, cola: "arriba" }
      : encima >= MARGEN
        ? { x: gx, y: encima, cola: "abajo" }
        : { x: gx, y: entre(debajo, MARGEN, v.h - MARGEN - A), cola: "arriba" };

  return { mano, globo, foco: { x: o.x - 6, y: o.y - 6, w: o.w + 12, h: o.h + 12 } };
}

/**
 * Como `ubicar`, pero dentro de la parte visible de la ventana (`visualViewport`: con el teclado del teléfono abierto es
 * más chica, y puede estar corrida). Todo sigue en coordenadas de la ventana.
 */
export function ubicarVisible(objetivo: Rect, visible: Rect, medidas: { mano: number; globo: number; altoGlobo: number }): Ubicacion {
  const dx = Number.isFinite(visible.x) ? visible.x : 0;
  const dy = Number.isFinite(visible.y) ? visible.y : 0;
  const u = ubicar({ ...objetivo, x: objetivo.x - dx, y: objetivo.y - dy }, { w: visible.w, h: visible.h }, medidas);
  return {
    mano: { ...u.mano, x: u.mano.x + dx, y: u.mano.y + dy },
    globo: { ...u.globo, x: u.globo.x + dx, y: u.globo.y + dy },
    foco: { ...u.foco, x: u.foco.x + dx, y: u.foco.y + dy },
  };
}
