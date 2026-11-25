// Los sellos con timbre, en números: la tinta de cada sello (un timbre de goma nunca deja dos marcas iguales) y los
// límites de la tarjeta. Puro, sin navegador.
import { semilla } from "../efectos/semilla";
import { limitesSellos, numeroDe } from "./calculos";

/** La marca que deja el timbre en un sello. */
export interface Tinta {
  /** Cuánto quedó girada (grados, de -14 a 14). */
  giro: number;
  /** Cuánto se corrió del centro (px, de -3 a 3). */
  x: number;
  y: number;
  /** Qué tan cargada de tinta (de 0,7 a 1). */
  carga: number;
  /** De qué lado quedó más cargada (grados, de 0 a 360). */
  lado: number;
  /** Cuál de los tres bordes irregulares le toca (0, 1 o 2). */
  borde: number;
}

const corto = (n: number) => Math.round(n * 10) / 10 || 0;

/** La tinta de un sello: sale del negocio (`texto`) y del número del sello. Siempre la misma para los mismos datos. */
export function tintaDe(texto: string, sello: number): Tinta {
  const sal = numeroDe(typeof texto === "string" ? texto : "") % 1000;
  const i = Number.isFinite(sello) ? Math.max(0, Math.floor(sello)) : 0;
  const azar = (k: number) => semilla(i * 7 + k, sal);
  return {
    giro: corto((azar(0) - 0.5) * 28),
    x: corto((azar(1) - 0.5) * 6),
    y: corto((azar(2) - 0.5) * 6),
    carga: Math.round((0.7 + azar(3) * 0.3) * 100) / 100,
    lado: Math.floor(azar(4) * 360),
    borde: Math.floor(azar(5) * 3) % 3,
  };
}

/** Los números de la tarjeta, acotados: de 1 a 30 sellos, sin más llenos que el total ni más nuevos que llenos. */
export function limitesTimbre(total: number, llenos: number, nuevos: number): { total: number; llenos: number; nuevos: number } {
  const l = limitesSellos(total, llenos);
  const n = Number.isFinite(nuevos) ? Math.max(0, Math.min(l.llenos, Math.floor(nuevos))) : 0;
  return { ...l, nuevos: n };
}
