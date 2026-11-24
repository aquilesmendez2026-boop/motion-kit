// Carrusel giratorio: lo calculable. Sin React ni DOM: se prueba con node --test.
import { esEnlaceSeguro } from "./calculos";

const acotar = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
/** Un texto limpio y cortado, o nada. */
const texto = (v: unknown, largo: number): string | undefined => (typeof v === "string" ? v.trim().slice(0, largo) || undefined : undefined);
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export const MAX_FICHAS = 12;
/** Lo más largo que puede ser la dirección de una foto o de un enlace. */
const LARGO_DIRECCION = 2000;

export interface Ficha {
  url?: string;
  alt?: string;
  titulo?: string;
  pie?: string;
  precio?: string;
  href?: string;
  agotado?: true;
}

/** Las fichas que se pueden dibujar: con foto o con título, textos cortados, enlaces seguros y doce como máximo. */
export function limpiarFichas(x: unknown): Ficha[] {
  if (!Array.isArray(x)) return [];
  const fichas: Ficha[] = [];
  for (const e of x) {
    if (fichas.length >= MAX_FICHAS) break;
    if (!esObjeto(e)) continue;
    const f: Ficha = {};
    const poner = (k: "alt" | "titulo" | "pie" | "precio", largo: number) => {
      const v = texto(e[k], largo);
      if (v) f[k] = v;
    };
    // Una dirección demasiado larga se descarta entera: cortada sería otra dirección.
    const direccion = (v: unknown) => (typeof v === "string" && v.trim().length <= LARGO_DIRECCION ? v.trim() || undefined : undefined);
    poner("titulo", 80);
    const url = direccion(e.url);
    if (url) f.url = url;
    if (!f.url && !f.titulo) continue;
    poner("alt", 140);
    poner("pie", 140);
    poner("precio", 24);
    const href = direccion(e.href);
    if (href && esEnlaceSeguro(href)) f.href = href;
    if (e.agotado === true) f.agotado = true;
    fichas.push(f);
  }
  return fichas;
}

/**
 * Cuántos puestos tiene el anillo. Con seis fichas o más, uno por ficha. Con tres, cuatro o cinco se repiten (seis,
 * ocho o diez puestos): así las de los lados no quedan de canto. Con menos de tres no hay anillo.
 */
export function puestosAnillo(n: number): number {
  if (!Number.isFinite(n) || n < 3) return 0;
  const m = Math.min(MAX_FICHAS, Math.floor(n));
  return m >= 6 ? m : m * Math.ceil(6 / m);
}

/** Cuántos grados hay entre un puesto y el siguiente. */
export const pasoAnillo = (puestos: number): number => (puestos > 0 ? 360 / puestos : 0);

/** A qué distancia del centro van las fichas para que quepan una al lado de la otra. */
export function radioAnillo(anchoFicha: number, puestos: number, aire = 16): number {
  if (!(anchoFicha > 0) || !(puestos >= 3)) return 0;
  return Math.round((anchoFicha + aire) / 2 / Math.tan(Math.PI / puestos));
}

/** Qué puesto queda al frente con el anillo girado `angulo` grados (el puesto `i` está al frente en `-i × paso`). */
export function alFrente(angulo: number, puestos: number): number {
  if (!Number.isFinite(angulo) || !(puestos >= 1)) return 0;
  const i = Math.round(-angulo / pasoAnillo(puestos));
  return ((i % puestos) + puestos) % puestos;
}

/**
 * Dónde se detiene el anillo al soltarlo: justo en un puesto, y más lejos si venía con impulso (`velocidad`, en grados
 * por segundo). A lo más recorre media vuelta.
 */
export function dondeSeDetiene(angulo: number, velocidad: number, puestos: number): number {
  const paso = pasoAnillo(puestos);
  if (!Number.isFinite(angulo) || !paso) return 0;
  const impulso = Number.isFinite(velocidad) ? acotar(velocidad * 0.3, -150, 150) : 0;
  return Math.round((angulo + impulso) / paso) * paso + 0;
}

/** El giro que deja al puesto `i` al frente, yendo por el lado corto desde `angulo`. */
export function haciaFicha(i: number, angulo: number, puestos: number): number {
  const base = -i * pasoAnillo(puestos);
  return base + Math.round(((Number.isFinite(angulo) ? angulo : 0) - base) / 360) * 360 + 0;
}
