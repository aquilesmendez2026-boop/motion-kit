// Gotas: lo calculable. Cada gota es una onda que crece y se apaga. Sin React.
import { semilla } from "../semilla";

export interface Gota {
  x: number;
  y: number;
  /** Segundos desde que cayó. */
  edad: number;
}

/** Hasta dónde llega una onda (px). */
const RADIO = 90;

/** Envejece las gotas `dt` segundos y saca las que cumplieron su `vida`. */
export function pasoGotas(gotas: Gota[], dt: number, vida = 2.4): Gota[] {
  for (const g of gotas) g.edad += dt;
  return gotas.filter((g) => g.edad < vida);
}

/** El radio de la onda a esa edad: crece rápido al principio y se acerca a 90 px sin pasarlos. */
export function radioGota(edad: number): number {
  return edad > 0 ? RADIO * (1 - Math.exp(-edad * 1.3)) : 0;
}

/** Qué tan marcada se ve la onda: 1 al caer, 0 al cumplir su vida. */
export function fuerzaGota(edad: number, vida = 2.4): number {
  return Math.max(0, Math.min(1, 1 - edad / vida));
}

/** Dónde cae la gota número `i` cuando nadie toca. */
export function gotaSola(i: number, ancho: number, alto: number, sal: number): Gota {
  return { x: semilla(i * 2, sal) * ancho, y: semilla(i * 2 + 1, sal) * alto, edad: 0 };
}
