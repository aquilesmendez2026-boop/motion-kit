// El calendario de una escena por tiempo: cuándo parte y cuándo termina cada paso. Puro, sin navegador.
import { TOPES } from "./modelo";

/** Lo que el calendario mira de un paso. */
export interface Tiempos {
  dura?: number;
  cada?: number;
  en?: number;
  luego?: number;
  junto?: number;
}

export interface Turno {
  /** ms desde el inicio de la escena: cuándo parte la primera pieza y cuándo termina la última. */
  inicio: number;
  fin: number;
  /** ms: lo que dura cada pieza y lo que espera cada una a la anterior. */
  dura: number;
  cada: number;
}

/** Lo que dura un paso si no lo dice. */
const DURA = 600;
/** En nivel liviano todo es más corto. */
const LIVIANO = { dura: 400, cada: 40 };

const positivo = (v: unknown, siNo: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : siNo);

/**
 * El turno de cada paso. `piezas[i]` es cuántas piezas mueve el paso `i` (van una tras otra, cada `cada` ms).
 * `en`: a los N ms de la escena. `luego`: N ms después de que termina el paso anterior. `junto`: N ms después de que
 * empieza. Sin ninguno, parte con la escena. Nada pasa del tope de la escena: lo que no cabe se acorta.
 */
export function inicios(pasos: Tiempos[], piezas: number[], liviano = false): Turno[] {
  const turnos: Turno[] = [];
  let anterior = { inicio: 0, fin: 0 };
  pasos.forEach((p, i) => {
    const n = Math.max(1, Math.floor(positivo(piezas[i], 1)));
    const pedido = p.luego !== undefined ? anterior.fin + positivo(p.luego, 0) : p.junto !== undefined ? anterior.inicio + positivo(p.junto, 0) : positivo(p.en, 0);
    const inicio = Math.min(pedido, TOPES.escena);
    const dura = Math.min(positivo(p.dura, DURA), liviano ? LIVIANO.dura : TOPES.dura, TOPES.escena - inicio);
    const espera = Math.min(positivo(p.cada, 0), liviano ? LIVIANO.cada : TOPES.cada);
    const cada = n > 1 ? Math.min(espera, (TOPES.escena - inicio - dura) / (n - 1)) : espera;
    const turno = { inicio, fin: inicio + dura + (n - 1) * cada, dura, cada };
    turnos.push(turno);
    anterior = turno;
  });
  return turnos;
}
