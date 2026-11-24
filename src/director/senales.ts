// Las señales continuas, llevadas a números de -1 a 1, y el resorte con que se las sigue. Puro, sin navegador.
import { pasoResorte } from "../dedo/resorte";
import type { PasoSeguir, Resorte } from "./modelo";

const acotar = (n: number) => (Number.isFinite(n) ? Math.max(-1, Math.min(1, n)) : 0);

/** Dónde está el cursor dentro de una caja: (0, 0) al centro, ±1 en los bordes. */
export function punteroEn(caja: { left: number; top: number; width: number; height: number }, x: number, y: number): { x: number; y: number } {
  if (!(caja.width > 0) || !(caja.height > 0)) return { x: 0, y: 0 };
  return { x: acotar(((x - caja.left) / caja.width - 0.5) * 2), y: acotar(((y - caja.top) / caja.height - 0.5) * 2) };
}

/** La velocidad del scroll (px por segundo) como un número de -1 a 1. A 1500 px por segundo ya es el máximo. */
export const velocidadNormal = (pxPorSegundo: number) => acotar(pxPorSegundo / 1500);

/** Rigidez y amortiguación de cada resorte. */
export const RESORTES_SEGUIR: Record<Resorte, [number, number]> = {
  suave: [120, 22],
  firme: [220, 30],
  elastico: [180, 11],
};

/** Un paso del resorte que lleva `e.x` hacia `meta`. */
export function seguir(e: { x: number; v: number }, meta: number, dt: number, resorte: Resorte | undefined): { x: number; v: number } {
  const [rigidez, freno] = RESORTES_SEGUIR[resorte as Resorte] ?? RESORTES_SEGUIR.suave;
  return pasoResorte(e, meta, dt, rigidez, freno);
}

/** ¿Ya llegó y está quieto? Entonces el compás puede dormir. */
export const llego = (e: { x: number; v: number }, meta: number) => Math.abs(e.x - meta) < 0.002 && Math.abs(e.v) < 0.02;

const corto = (n: number) => `${Math.round(n * 1000) / 1000}`;

/**
 * Lo que escribe un paso que sigue, con la señal en (sx, sy), de -1 a 1 (la velocidad usa el mismo valor en los dos).
 * Los números del paso son cuánto se mueve con la señal al máximo. La escala y la opacidad miran qué tan lejos del
 * centro está la señal, no hacia dónde.
 */
export function valorSeguido(p: PasoSeguir, sx: number, sy: number): { translate?: string; rotate?: string; scale?: string; opacity?: string } {
  const lejos = Math.max(Math.abs(sx), Math.abs(sy));
  return {
    ...(p.x !== undefined || p.y !== undefined ? { translate: `${corto(sx * (p.x ?? 0))}px ${corto(sy * (p.y ?? 0))}px` } : {}),
    ...(p.giro !== undefined ? { rotate: `${corto(sx * p.giro)}deg` } : {}),
    ...(p.escala !== undefined ? { scale: corto(1 + lejos * (p.escala - 1)) } : {}),
    ...(p.opacidad !== undefined ? { opacity: corto(1 + lejos * (p.opacidad - 1)) } : {}),
  };
}
