// Foto profunda: lo calculable, sin React ni WebGL. Se prueba con node --test.

/** Cuánto se acerca la foto, para que al correrse no asomen sus bordes. */
export const ACERCAR = 1.06;
/** Lo más que se corre un punto de la foto, como parte del ancho. Chico: no marea. */
export const FUERZA = 0.035;
/** A cuántos grados de inclinación el teléfono ya llegó al máximo. */
const GRADOS = 20;
/** Cuánto pesa el scroll frente al cursor. */
const DEL_SCROLL = 1.2;

const acotar = (n: number) => (Number.isNaN(n) ? 0 : Math.max(-1, Math.min(1, n)));

/**
 * Qué parte de la foto se ve en la caja, igual que `object-fit: cover` y un poco acercada: en cada eje, de 0 a 1 (1 es
 * la foto entera). El lienzo usa esto para calzar con la foto que tiene debajo.
 */
export function encuadre(fotoAncho: number, fotoAlto: number, cajaAncho: number, cajaAlto: number, acercar = ACERCAR): { x: number; y: number } {
  if (!(fotoAncho > 0) || !(fotoAlto > 0) || !(cajaAncho > 0) || !(cajaAlto > 0)) return { x: 1, y: 1 };
  const foto = fotoAncho / fotoAlto;
  const caja = cajaAncho / cajaAlto;
  // Caja más angosta que la foto: sobran lados. Más ancha: sobra arriba y abajo.
  return caja < foto ? { x: caja / foto / acercar, y: 1 / acercar } : { x: 1 / acercar, y: foto / caja / acercar };
}

export interface Senales {
  /** El cursor sobre el encabezado: de -1 a 1, el centro es 0. */
  puntero?: { x: number; y: number } | null;
  /** El paso del encabezado por la pantalla: 0 al entrar, 1 al salir. */
  avance?: number | null;
  /** La inclinación del teléfono, de -1 a 1. */
  inclinacion?: { x: number; y: number } | null;
}

/** Hacia dónde se corre la foto (de -1 a 1 en cada eje) con todo lo que la mueve sumado. */
export function objetivoProfunda({ puntero, avance, inclinacion }: Senales): { x: number; y: number } {
  const delScroll = typeof avance === "number" && Number.isFinite(avance) ? (avance - 0.5) * DEL_SCROLL : 0;
  return { x: acotar((puntero?.x ?? 0) + (inclinacion?.x ?? 0)), y: acotar((puntero?.y ?? 0) + (inclinacion?.y ?? 0) + delScroll) };
}

/** Desde cuántos grados (de adelante hacia atrás) la lectura de lado a lado ya no sirve: cerca de 90 salta de signo. */
const PARADO = 75;
const sinMenos = (n: number) => n || 0;

/**
 * La inclinación del teléfono como un número de -1 a 1. `base`: cómo estaba (de adelante hacia atrás) al empezar.
 * Va de a un grado: menos de medio grado no cuenta, así el temblor de la mano no despierta al efecto.
 */
export function inclinacionDe(beta: number | null, gamma: number | null, base: number): { x: number; y: number } {
  if (beta === null || gamma === null) return { x: 0, y: 0 };
  return { x: Math.abs(beta) > PARADO ? 0 : sinMenos(acotar(Math.round(gamma) / GRADOS)), y: sinMenos(acotar(Math.round(beta - base) / GRADOS)) };
}

/**
 * Una lectura del sensor, llevada a grados enteros con holgura: mientras la lectura siga a menos de 0,75° del paso ya
 * tomado, el paso no cambia. Sin esto, el ruido justo en el borde entre dos grados haría bailar la foto.
 */
export const pasoFirme = (anterior: number | null, lectura: number): number =>
  anterior !== null && Math.abs(lectura - anterior) < 0.75 ? anterior : sinMenos(Math.round(lectura));

/** Cuánto dura un cuadro normal (60 por segundo), en ms. */
const CUADRO = 16.7;
/**
 * Un paso hacia la meta: se acerca de a poco. `dt`: cuántos ms pasaron desde el paso anterior; con eso va igual de
 * rápido en una pantalla de 60 cuadros por segundo que en una de 120.
 */
export function acercarA(e: number, meta: number, suavidad = 0.08, dt = CUADRO): number {
  if (!(dt > 0)) return e;
  return e + (meta - e) * (1 - Math.pow(1 - suavidad, dt / CUADRO));
}
/**
 * ¿Ya llegó? Entonces no hace falta seguir dibujando. El umbral es lo que ya no se ve: 0,02 de la carrera es menos de
 * un cuarto de px en un teléfono y cerca de medio px en una pantalla grande.
 */
export const llegoA = (e: number, meta: number) => Math.abs(e - meta) < 0.02;

/** El tamaño al que se sube la foto: el lado mayor no pasa de `tope`, con la misma proporción. */
export function ladoTextura(ancho: number, alto: number, tope: number): { ancho: number; alto: number } {
  if (!(ancho > 0) || !(alto > 0) || !(tope > 0)) return { ancho: 1, alto: 1 };
  const k = Math.min(1, tope / Math.max(ancho, alto));
  return { ancho: Math.max(1, Math.round(ancho * k)), alto: Math.max(1, Math.round(alto * k)) };
}

/**
 * A cuántos puntos de ancho se lleva el mapa antes de usarlo, según el ancho del lienzo: un doceavo, entre 64 y 160.
 * Así el suavizado se ve igual en un teléfono que en una pantalla grande.
 */
export const anchoMapa = (anchoLienzo: number): number => (anchoLienzo > 0 ? Math.max(64, Math.min(160, Math.round(anchoLienzo / 12))) : 64);

/** ¿El mapa es de esa foto? Tiene que tener su misma proporción (con un 4 % de holgura, por el redondeo al achicarlo). */
export function mismaProporcion(fotoAncho: number, fotoAlto: number, mapaAncho: number, mapaAlto: number): boolean {
  if (!(fotoAncho > 0) || !(fotoAlto > 0) || !(mapaAncho > 0) || !(mapaAlto > 0)) return false;
  const foto = fotoAncho / fotoAlto;
  return Math.abs(mapaAncho / mapaAlto - foto) / foto <= 0.04;
}
