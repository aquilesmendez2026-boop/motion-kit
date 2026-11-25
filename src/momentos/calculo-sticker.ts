// El sticker que se despega, en números: de dónde se toma, por dónde pasa el doblez y qué parte va levantada.
// Doblar un papel llevando un punto (el que se tomó) hasta otro (donde está el dedo) deja el doblez justo a medio
// camino entre los dos, perpendicular al tirón. Puro, sin navegador.

export interface Punto {
  x: number;
  y: number;
}
export interface Caja {
  ancho: number;
  alto: number;
}
export type FormaSticker = "circulo" | "cuadrado";

/** El doblez: un punto por donde pasa, hacia dónde se tira (grados; 0 es a la derecha, 90 hacia abajo) y cuánto va levantado. */
export interface Doblez extends Punto {
  angulo: number;
  /** Qué parte del sticker va levantada, de 0 a 1. */
  despegado: number;
}

const esNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const esPunto = (p: unknown): p is Punto => p !== null && typeof p === "object" && esNumero((p as Punto).x) && esNumero((p as Punto).y);
const corto = (n: number, cifras = 1000) => Math.round(n * cifras) / cifras || 0;
/** Un tirón más corto que esto (px) no levanta nada. */
const MINIMO = 2;

/** El punto del borde de la caja más cercano a `p` (de ahí se toma el sticker). En un empate gana arriba, después abajo. */
export function bordeMasCercano(p: Punto, caja: Caja): Punto {
  const x = Math.max(0, Math.min(caja.ancho, p.x));
  const y = Math.max(0, Math.min(caja.alto, p.y));
  const a = [y, caja.alto - y, x, caja.ancho - x];
  const cual = a.indexOf(Math.min(...a));
  return cual === 0 ? { x, y: 0 } : cual === 1 ? { x, y: caja.alto } : cual === 2 ? { x: 0, y } : { x: caja.ancho, y };
}

/** El área de un polígono (fórmula del cordón). */
const area = (p: Punto[]) => Math.abs(p.reduce((s, a, i) => s + a.x * p[(i + 1) % p.length].y - p[(i + 1) % p.length].x * a.y, 0)) / 2;

/** La parte de un rectángulo que queda del lado de donde se tomó (lo levantado), como fracción de su área. */
function levantadoCuadrado(m: Punto, n: Punto, caja: Caja): number {
  const lado = (p: Punto) => (p.x - m.x) * n.x + (p.y - m.y) * n.y;
  const esquinas: Punto[] = [{ x: 0, y: 0 }, { x: caja.ancho, y: 0 }, { x: caja.ancho, y: caja.alto }, { x: 0, y: caja.alto }];
  // Se recorta el rectángulo con la recta del doblez (lo que queda del lado negativo).
  const dentro: Punto[] = [];
  esquinas.forEach((a, i) => {
    const b = esquinas[(i + 1) % 4];
    const [la, lb] = [lado(a), lado(b)];
    if (la < 0) dentro.push(a);
    if (la < 0 !== lb < 0) {
      const t = la / (la - lb);
      dentro.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  });
  return dentro.length < 3 ? 0 : area(dentro) / (caja.ancho * caja.alto);
}

/** Lo mismo para un círculo (o un óvalo) inscrito en la caja. */
function levantadoCirculo(m: Punto, n: Punto, caja: Caja): number {
  const [rx, ry] = [caja.ancho / 2, caja.alto / 2];
  // La distancia del centro al doblez, medida en radios (se estira el óvalo hasta volverlo un círculo).
  const q = ((rx - m.x) * n.x + (ry - m.y) * n.y) / Math.hypot(rx * n.x, ry * n.y);
  if (q >= 1) return 0;
  if (q <= -1) return 1;
  return (Math.acos(q) - q * Math.sqrt(1 - q * q)) / Math.PI;
}

/**
 * El doblez de un sticker que se tomó en `toma` y cuyo dedo va en `dedo` (px, dentro de su caja). `null` si todavía
 * no hay tirón (o los datos no sirven): el sticker sigue pegado.
 */
export function doblez(toma: Punto, dedo: Punto, caja: Caja, forma: FormaSticker = "cuadrado"): Doblez | null {
  if (!esPunto(toma) || !esPunto(dedo) || !caja || !(caja.ancho > 0) || !(caja.alto > 0)) return null;
  const [dx, dy] = [dedo.x - toma.x, dedo.y - toma.y];
  const largo = Math.hypot(dx, dy);
  if (largo < MINIMO) return null;
  const m = { x: (toma.x + dedo.x) / 2, y: (toma.y + dedo.y) / 2 };
  const n = { x: dx / largo, y: dy / largo };
  const levantado = forma === "circulo" ? levantadoCirculo(m, n, caja) : levantadoCuadrado(m, n, caja);
  return { x: corto(m.x), y: corto(m.y), angulo: corto((Math.atan2(dy, dx) * 180) / Math.PI), despegado: corto(Math.max(0, Math.min(1, levantado)), 10000) };
}

/** Un punto reflejado en el doblez: dónde queda, al doblar, lo que estaba ahí. */
export function reflejar(p: Punto, d: Doblez): Punto {
  const a = (d.angulo * Math.PI) / 180;
  const n = { x: Math.cos(a), y: Math.sin(a) };
  const lejos = (p.x - d.x) * n.x + (p.y - d.y) * n.y;
  return { x: p.x - 2 * lejos * n.x, y: p.y - 2 * lejos * n.y };
}
