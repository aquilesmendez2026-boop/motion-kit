// Inclinación por velocidad: de la rapidez del scroll a un ángulo chico. Sin React.

/** Grados de inclinación para una velocidad de scroll (px por segundo): crece con la velocidad hasta `tope`. */
export function inclinacionDe(velocidad: number, tope = 1.5, escala = 1200): number {
  if (!Number.isFinite(velocidad)) return 0;
  return Math.max(-1, Math.min(1, velocidad / escala)) * tope;
}

/** Una muestra del scroll: cuándo (ms) y dónde (px). */
export interface MuestraScroll {
  t: number;
  y: number;
}

/**
 * Suma una muestra a `muestras` y devuelve la velocidad (px por segundo) de los últimos `ventana` ms. Mirar una ventana
 * y no solo el último cuadro la deja pareja cuando el scroll llega a saltos (la rueda del mouse). Guarda solo lo de
 * la ventana.
 */
export function velocidadScroll(muestras: MuestraScroll[], t: number, y: number, ventana = 100): number {
  muestras.push({ t, y });
  // La primera que queda es la más nueva que ya salió de la ventana (o la más vieja que haya).
  while (muestras.length > 2 && t - muestras[1].t >= ventana) muestras.shift();
  const a = muestras[0];
  return t > a.t ? ((y - a.y) / (t - a.t)) * 1000 : 0;
}
