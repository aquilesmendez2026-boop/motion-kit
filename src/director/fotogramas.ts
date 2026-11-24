// De un cambio de la partitura a fotogramas del navegador. Dos canales, para que se sumen sin pisarse: las escenas
// `verse` escriben en `transform`; lo atado al scroll, lo que sigue al dedo y `estado`, en `translate`, `rotate` y
// `scale`. Puro, sin navegador.
import type { Cambio, Curva, Tramo } from "./modelo";

/** Los tres niveles del repo (el tipo `NivelEscena` de src/escena/nivel.ts, sin traer ese archivo). */
export type Nivel = "completo" | "liviano" | "quieto";

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

/** El cambio como una transformación: mover, girar y agrandar, en ese orden. */
function transformar(c: Cambio): string {
  return [
    c.x !== undefined || c.y !== undefined ? `translate(${px(c.x ?? 0)},${px(c.y ?? 0)})` : "",
    c.giro !== undefined ? `rotate(${c.giro}deg)` : "",
    c.escala !== undefined ? `scale(${c.escala})` : "",
  ].filter(Boolean).join(" ");
}

const conOpacidad = (c: Cambio) => (c.opacidad !== undefined ? { opacity: c.opacidad } : {});

function enTransform(c: Cambio, offset: number): Keyframe {
  const t = transformar(c);
  return { offset, ...(t ? { transform: t } : {}), ...conOpacidad(c) };
}

function suelto(c: Cambio, offset: number): Keyframe {
  return {
    offset,
    ...(c.x !== undefined || c.y !== undefined ? { translate: `${px(c.x ?? 0)} ${px(c.y ?? 0)}` } : {}),
    ...(c.giro !== undefined ? { rotate: `${c.giro}deg` } : {}),
    ...(c.escala !== undefined ? { scale: `${c.escala}` } : {}),
    ...conOpacidad(c),
  };
}

const armar = (p: { de?: Cambio; a?: Cambio }, hacer: (c: Cambio, o: number) => Keyframe) => {
  const f = [...(p.de ? [hacer(p.de, 0)] : []), ...(p.a ? [hacer(p.a, 1)] : [])];
  return f.length ? f : null;
};

/**
 * Los fotogramas de un paso por tiempo, o `null` si en ese nivel no hace nada. En liviano solo funde: una entrada
 * (`de`) parte de su opacidad, o de 0 si no la trae; un paso solo con `a` conserva su opacidad. `fundir: false` es para
 * un actor cuya opacidad es de otra escena: ahí la entrada no funde, aparece.
 */
export function fotogramasTiempo(p: { de?: Cambio; a?: Cambio }, nivel: Nivel, fundir = true): Keyframe[] | null {
  if (nivel === "quieto") return null;
  if (nivel === "completo") return armar(p, enTransform);
  const desde = p.de ? (p.de.opacidad ?? (fundir ? 0 : undefined)) : undefined;
  const f: Keyframe[] = [...(desde !== undefined ? [{ offset: 0, opacity: desde }] : []), ...(p.a?.opacidad !== undefined ? [{ offset: 1, opacity: p.a.opacidad }] : [])];
  return f.length ? f : null;
}

/** Los fotogramas de un paso continuo o de estado. En liviano sobrevive solo la opacidad. */
export function fotogramasSueltos(p: { de?: Cambio; a?: Cambio }, nivel: Nivel): Keyframe[] | null {
  if (nivel === "quieto") return null;
  if (nivel === "completo") return armar(p, suelto);
  const solo = (c?: Cambio) => (c?.opacidad !== undefined ? { opacidad: c.opacidad } : undefined);
  return armar({ de: solo(p.de), a: solo(p.a) }, suelto);
}

const CURVA: Record<Curva, string> = {
  suave: "cubic-bezier(.2,.8,.2,1)",
  lineal: "linear",
  entra: "ease-in",
  sale: "ease-out",
  vaiven: "ease-in-out",
  // Sin estilo alrededor: se pasa un poco y vuelve.
  resorte: "cubic-bezier(.3,1.45,.5,1)",
};

/**
 * La curva de CSS de un nombre. `resorte` usa el resorte del estilo de la página si lo hay (su curva y su duración,
 * `--mk-resorte-curva` y `--mk-resorte-ms`).
 */
export function curvaCss(curva: Curva | undefined, delEstilo?: { curva: string; ms: number } | null): { easing: string; ms?: number } {
  if (curva === "resorte" && delEstilo) return { easing: delEstilo.curva, ms: delEstilo.ms };
  return { easing: CURVA[curva as Curva] ?? CURVA.suave };
}

const RANGO: Record<Tramo, string> = { entrada: "entry", salida: "exit", paso: "cover" };
const porciento = (n: number) => `${Math.round(n * 1000) / 10}%`;

/** El rango nativo de una línea de tiempo de scroll. `tramo: null` es la página entera. */
export function tramoScroll(tramo: Tramo | null, entre: [number, number] = [0, 1]): { inicio: string; fin: string } {
  const antes = tramo ? `${RANGO[tramo]} ` : "";
  return { inicio: antes + porciento(entre[0]), fin: antes + porciento(entre[1]) };
}

const acotar = (n: number) => (n > 0 ? (n < 1 ? n : 1) : 0);

/**
 * El respaldo: cuánto ha avanzado (de 0 a 1) el paso de la raíz por la pantalla, con lo mismo que mide una línea de
 * tiempo de vista. `caja`: dónde está la raíz; `alto`: el alto de la pantalla.
 */
export function avanceEn(caja: { top: number; height: number }, alto: number, tramo: Tramo): number {
  if (!(caja.height > 0)) return 0;
  // Entrar y salir se miden sobre lo que cabe: una raíz más alta que la pantalla termina de entrar cuando la cubre, y
  // empieza a salir cuando su borde de abajo llega al de la pantalla (así lo hace la línea de tiempo nativa).
  const tramoAlto = Math.min(caja.height, alto);
  if (tramo === "entrada") return acotar((alto - caja.top) / tramoAlto);
  if (tramo === "salida") return acotar((tramoAlto - (caja.top + caja.height)) / tramoAlto);
  return acotar((alto - caja.top) / (alto + caja.height));
}

/** El avance dentro del tramo `entre` (antes y después queda en sus extremos). */
export function tramoLocal(avance: number, entre: [number, number] | undefined): number {
  return entre ? acotar((avance - entre[0]) / (entre[1] - entre[0])) : avance;
}
