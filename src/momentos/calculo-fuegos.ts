// Fuegos artificiales: lo calculable. Sin React ni DOM: se prueba con node --test.
import { semilla } from "../efectos/semilla";

const acotar = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Chispas por ráfaga. */
export const CHISPAS = 40;
/** ms entre una ráfaga y la siguiente, lo que demora el cohete en subir y lo que vive una chispa. */
export const ENTRE_RAFAGAS = 450;
export const SUBIDA = 520;
export const VIDA = 1500;
/** Lo más lejos que llega una chispa, y cuánto cae en un segundo (como parte del lado menor del lienzo). */
const ALCANCE = 0.34;
const CAIDA = 0.09;

export interface Rafaga {
  /** Dónde revienta: de 0 a 1 del ancho y del alto (0 es arriba). */
  x: number;
  y: number;
  /** ms desde el comienzo en que sale su cohete. */
  parte: number;
  color: 0 | 1 | 2;
  chispas: { angulo: number; rapidez: number }[];
}

const cuantasRafagas = (n: number) => (Number.isFinite(n) ? acotar(Math.round(n), 1, 5) : 3);

/** Las ráfagas de una celebración. La misma semilla da siempre las mismas. */
export function rafagasDe(s: number, cuantas: number): Rafaga[] {
  const sal = Number.isFinite(s) ? Math.abs(Math.round(s)) % 10007 : 0;
  const base = Math.floor(semilla(0, sal) * 3);
  const n = cuantasRafagas(cuantas);
  // Se reparten a lo ancho: el lienzo se divide en `n` franjas y cada ráfaga cae en una distinta, saltando de franja
  // en franja (el salto no comparte divisores con `n`, así no repite ninguna).
  const salto = n === 4 ? 3 : n === 2 ? 1 : 2;
  const desde = Math.floor(semilla(5, sal) * n);
  return Array.from({ length: n }, (_, i) => ({
    x: 0.18 + (((desde + i * salto) % n) + 0.5 + (semilla(i * 7 + 1, sal) - 0.5) * 0.6) * (0.64 / n),
    y: 0.18 + semilla(i * 7 + 2, sal) * 0.27,
    parte: i * ENTRE_RAFAGAS,
    // Dos seguidas nunca del mismo color.
    color: ((base + i) % 3) as 0 | 1 | 2,
    chispas: Array.from({ length: CHISPAS }, (_, k) => ({
      angulo: (k / CHISPAS) * Math.PI * 2 + (semilla(i * 100 + k * 2 + 10, sal) - 0.5) * 0.14,
      rapidez: 0.55 + semilla(i * 100 + k * 2 + 11, sal) * 0.45,
    })),
  }));
}

/** Cuánto dura la celebración entera, en ms. */
export const duracionFuegos = (cuantas: number): number => (cuantasRafagas(cuantas) - 1) * ENTRE_RAFAGAS + SUBIDA + VIDA;

/** Dónde va el cohete de una ráfaga a los `t` ms de salir (sube frenando). `null` si todavía no sale o ya reventó. */
export function cohete(r: Rafaga, t: number): { x: number; y: number } | null {
  if (!(t >= 0) || t >= SUBIDA) return null;
  const falta = 1 - t / SUBIDA;
  return { x: r.x, y: 1 - (1 - r.y) * (1 - falta * falta) };
}

/**
 * Dónde va una chispa a los `t` ms de reventar, contado desde el centro de la ráfaga y como parte del lado menor del
 * lienzo: se abre frenando, cae con peso y se va apagando. `null` si todavía no existe o ya se apagó.
 */
export function chispa(c: { angulo: number; rapidez: number }, t: number): { dx: number; dy: number; brillo: number } | null {
  if (!(t >= 0) || t >= VIDA) return null;
  const s = t / 1000;
  const lejos = c.rapidez * ALCANCE * (1 - Math.exp(-3.2 * s));
  return { dx: Math.cos(c.angulo) * lejos, dy: Math.sin(c.angulo) * lejos + CAIDA * s * s, brillo: Math.pow(1 - t / VIDA, 1.5) };
}

/**
 * El color para una ráfaga: el del tema si tiene color, o `respaldo` si es negro, gris o blanco (en un tema sobrio los
 * fuegos saldrían negros). `color` llega como lo entrega el navegador («rgb(…)» o «color(srgb …)»); si viene en otra
 * forma se deja tal cual.
 */
export function colorVivo(color: string, respaldo: string): string {
  if (!color) return respaldo;
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(color);
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(color);
  const partes = rgb ? rgb.slice(1, 4).map((n) => Number(n) / 255) : srgb ? srgb.slice(1, 4).map(Number) : null;
  if (!partes) return color;
  const max = Math.max(...partes);
  // Saturación: cuánto se aleja del gris. Bajo 0,3 (o casi negro) no se ve como un color.
  return max < 0.2 || (max - Math.min(...partes)) / max < 0.3 ? respaldo : color;
}
