// Libro que se abre: lo calculable. Sin React ni DOM: se prueba con node --test.

const acotar = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
/** Un texto limpio y cortado, o nada. */
const texto = (v: unknown, largo: number): string | undefined => (typeof v === "string" ? v.trim().slice(0, largo) || undefined : undefined);
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export const MAX_HOJAS = 16;
export const MAX_LINEAS = 10;

export interface LineaLibro {
  texto: string;
  detalle?: string;
  precio?: string;
  agotado?: true;
}
export interface Hoja {
  titulo: string;
  lineas: LineaLibro[];
}

/**
 * Las hojas que se pueden dibujar. Un grupo con más de diez líneas sigue en la hoja siguiente («Cafés (sigue)»): no se
 * pierde ningún plato. Hasta dieciséis hojas.
 */
export function limpiarHojas(x: unknown): Hoja[] {
  if (!Array.isArray(x)) return [];
  const hojas: Hoja[] = [];
  for (const e of x) {
    if (!esObjeto(e)) continue;
    const titulo = texto(e.titulo, 60) ?? "";
    const lineas: LineaLibro[] = [];
    for (const l of Array.isArray(e.lineas) ? e.lineas : []) {
      if (!esObjeto(l)) continue;
      const t = texto(l.texto, 80);
      if (!t) continue;
      const linea: LineaLibro = { texto: t };
      const detalle = texto(l.detalle, 140);
      const precio = texto(l.precio, 24);
      if (detalle) linea.detalle = detalle;
      if (precio) linea.precio = precio;
      if (l.agotado === true) linea.agotado = true;
      lineas.push(linea);
    }
    if (!titulo && !lineas.length) continue;
    for (let i = 0; i === 0 || i < lineas.length; i += MAX_LINEAS) {
      if (hojas.length >= MAX_HOJAS) return hojas;
      hojas.push({ titulo: i && titulo ? `${titulo} (sigue)` : titulo, lineas: lineas.slice(i, i + MAX_LINEAS) });
    }
  }
  return hojas;
}

/** Lo que lleva una hoja del libro en cada cara: el número de una página, la tapa o nada (papel en blanco). */
export interface CarasHoja {
  frente: number | "tapa" | null;
  dorso: number | null;
}

/**
 * Cómo se reparten `n` páginas en las hojas del libro. En angosto (`doble` en falso) cada hoja lleva una página, en su
 * frente. En ancho lleva dos: al dar vuelta una hoja, su dorso queda a la izquierda. Si la última página queda a la
 * izquierda, a la derecha va la contratapa, en blanco.
 */
export function carasLibro(n: number, doble: boolean): CarasHoja[] {
  if (!(n >= 1)) return [];
  if (!doble) return [{ frente: "tapa", dorso: null }, ...Array.from({ length: n }, (_, i): CarasHoja => ({ frente: i, dorso: null }))];
  const hojas: CarasHoja[] = [{ frente: "tapa", dorso: 0 }];
  for (let k = 1; k < n; k += 2) hojas.push({ frente: k, dorso: k + 1 < n ? k + 1 : null });
  if (hojas[hojas.length - 1].dorso !== null) hojas.push({ frente: null, dorso: null });
  return hojas;
}

/** Cuántas hojas se pueden dar vuelta (la tapa cuenta). */
export const maxVueltas = (n: number, doble: boolean): number => (n >= 1 ? (doble ? Math.ceil(n / 2) : Math.floor(n)) : 0);

const enRango = (vueltas: number, n: number, doble: boolean) => acotar(Number.isFinite(vueltas) ? Math.floor(vueltas) : 0, 0, maxVueltas(n, doble));

/** Lo que se está leyendo, en palabras. */
export function estadoLibro(vueltas: number, n: number, doble: boolean): string {
  const v = enRango(vueltas, n, doble);
  if (!v) return "Tapa";
  if (!doble) return `Página ${v} de ${n}`;
  return v * 2 <= n ? `Páginas ${v * 2 - 1} y ${v * 2} de ${n}` : `Página ${v * 2 - 1} de ${n}`;
}

/**
 * Al pasar de una página a dos (`aDoble`) o al revés, cuántas hojas quedan dadas vuelta para seguir leyendo lo mismo.
 * `vueltas` viene del modo anterior.
 */
export function vueltasAlCambiar(vueltas: number, n: number, aDoble: boolean): number {
  const v = enRango(vueltas, n, !aDoble);
  // De una a dos: la página `v` queda en la vuelta que la contiene. De dos a una: se muestra la de la izquierda.
  return enRango(aDoble ? Math.ceil(v / 2) : v * 2 - 1, n, aDoble);
}

/**
 * Cuántos px hacia quien mira va la hoja `i` (de `total`), con `vueltas` hojas ya pasadas. A la derecha manda la
 * primera sin pasar; a la izquierda, la última pasada.
 */
export const apilado = (i: number, vueltas: number, total: number): number => (i < vueltas ? i + 1 : total - i);
