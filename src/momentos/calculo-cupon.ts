// El cupón que se arranca, en números: cuánto va cortado según el dedo, los dientes de la línea de puntos, cómo cuelga
// lo cortado y si ya venció. Puro, sin navegador.

/** Los dientes de la línea de puntos, de punta a punta de la franja. */
export const DIENTES = 24;
/** Pasado esto, la franja se suelta sola y cae. */
export const SE_SUELTA = 0.85;
/** En cuántos tramos se parte lo que cuelga: cada uno gira un poco más y así se lee como papel que se enrosca. */
const TRAMOS = 4;

const acotar = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const corto = (n: number) => Math.round(n * 100) / 100 || 0;

/** Qué parte de la franja va cortada (0 a 1) con el dedo en `xDedo` (px desde su borde izquierdo). */
export function cortado(xDedo: number, ancho: number): number {
  if (!(ancho > 0) || Number.isNaN(xDedo)) return 0;
  return acotar(xDedo / ancho);
}

/** Cuántos dientes van cortados con ese avance. Cada uno da su golpecito. */
export function dientesCortados(avance: number): number {
  return Number.isFinite(avance) || avance === Infinity ? Math.floor(acotar(avance) * DIENTES + 1e-9) : 0;
}

/**
 * Cómo cuelga lo cortado: el giro de cada tramo (grados, contado desde la franja; el último es la punta suelta) y
 * cuánto baja (px). Mientras más se corta, más pesa y más se enrosca.
 */
export function tramosColgando(avance: number): { giro: number; baja: number }[] {
  const a = Number.isFinite(avance) || avance === Infinity ? acotar(avance) : 0;
  // Cada tramo suma este giro al del anterior.
  const paso = a ? 5 + a * 13 : 0;
  return Array.from({ length: TRAMOS }, (_, k) => ({ giro: corto(paso * (k + 1)), baja: corto(a * (k + 1) * 1.5) }));
}

/** Una fecha `AAAA-MM-DD` que existe, como [año, mes, día]; o `null`. */
function fecha(v: unknown): [number, number, number] | null {
  const m = typeof v === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim()) : null;
  if (!m) return null;
  const [a, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(a, mes - 1, d);
  return f.getFullYear() === a && f.getMonth() === mes - 1 && f.getDate() === d ? [a, mes, d] : null;
}

/** ¿Ya pasó el día de vencimiento? El cupón vale todo ese día, en la hora del teléfono. Una fecha mala no vence. */
export function vencio(vence: unknown, hoy: Date): boolean {
  const f = fecha(vence);
  if (!f || !(hoy instanceof Date) || Number.isNaN(hoy.getTime())) return false;
  const [a, m, d] = [hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()];
  return a !== f[0] ? a > f[0] : m !== f[1] ? m > f[1] : d > f[2];
}

export interface Cupon {
  titulo: string;
  detalle?: string;
  codigo: string;
  vence?: string;
}

const texto = (v: unknown, tope: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, tope) : "");

/** Los datos de un cupón, limpios y con tope de largo. Sin código no hay cupón (`null`). */
export function limpiarCupon(x: unknown): Cupon | null {
  if (x === null || typeof x !== "object" || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  const codigo = texto(o.codigo, 40);
  if (!codigo) return null;
  const detalle = texto(o.detalle, 160);
  const vence = fecha(o.vence) ? (o.vence as string).trim() : "";
  return { titulo: texto(o.titulo, 80), ...(detalle ? { detalle } : {}), codigo, ...(vence ? { vence } : {}) };
}
