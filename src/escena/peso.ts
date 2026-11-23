/**
 * Cuánto pesa un encabezado (o cualquier parte de la página) y cómo va contra el presupuesto.
 * Cuenta lo que el elemento trae de la red: imágenes, videos, pósters y fondos CSS con url().
 * No cuenta el JavaScript ni el CSS de la página, que se comparten con todo el sitio.
 * Cifras y fuentes: cerebro-aquiles/investigaciones/2026-11-23-pesos-web-y-movil.md
 */

export type Dispositivo = "movil" | "escritorio";
export type EstadoPeso = "optimo" | "aceptable" | "excedido";

export interface Presupuesto {
  /** Bytes hasta los que va bien. */
  optimo: number;
  /** Bytes que no se deben pasar. */
  maximo: number;
}

const KB = 1000;

/** Presupuesto del encabezado al cargar (póster, fotos y fondos), comprimido como viaja por la red. */
export const PRESUPUESTO_ENCABEZADO: Record<Dispositivo, Presupuesto> = {
  movil: { optimo: 250 * KB, maximo: 500 * KB },
  escritorio: { optimo: 500 * KB, maximo: 1000 * KB },
};

/** Presupuestos por tipo de recurso, para revisar piezas sueltas. */
export const PRESUPUESTO_RECURSOS: Record<"poster" | "video" | "secuencia" | "shader" | "lottie" | "modelo3d", Record<Dispositivo, Presupuesto>> = {
  poster: { movil: { optimo: 100 * KB, maximo: 200 * KB }, escritorio: { optimo: 200 * KB, maximo: 400 * KB } },
  video: { movil: { optimo: 800 * KB, maximo: 1500 * KB }, escritorio: { optimo: 2000 * KB, maximo: 3000 * KB } },
  secuencia: { movil: { optimo: 1000 * KB, maximo: 2000 * KB }, escritorio: { optimo: 2000 * KB, maximo: 4000 * KB } },
  shader: { movil: { optimo: 10 * KB, maximo: 20 * KB }, escritorio: { optimo: 10 * KB, maximo: 20 * KB } },
  lottie: { movil: { optimo: 50 * KB, maximo: 150 * KB }, escritorio: { optimo: 100 * KB, maximo: 300 * KB } },
  modelo3d: { movil: { optimo: 500 * KB, maximo: 1000 * KB }, escritorio: { optimo: 1500 * KB, maximo: 3000 * KB } },
};

export type TipoRecurso = "imagen" | "video" | "fondo";
/** De dónde salió el número: red (bajado ahora), caché (ya estaba), incrustado (data: en el HTML), local (archivo elegido y aún sin subir) o desconocido. */
export type OrigenDato = "red" | "cache" | "incrustado" | "local" | "desconocido";

export interface RecursoPeso {
  url: string;
  tipo: TipoRecurso;
  /** Bytes comprimidos; `null` si el navegador no los entrega (otro dominio sin permiso). */
  bytes: number | null;
  origen: OrigenDato;
}

export interface MedicionPeso {
  total: number;
  /** Recursos sin peso conocido (no entran al total). */
  desconocidos: number;
  recursos: RecursoPeso[];
  dispositivo: Dispositivo;
  presupuesto: Presupuesto;
  estado: EstadoPeso;
}

/** Ancho desde el que se mide como escritorio (el ancho del elemento, no de la ventana). */
export const ANCHO_ESCRITORIO = 640;

export function estadoPeso(bytes: number, p: Presupuesto): EstadoPeso {
  return bytes <= p.optimo ? "optimo" : bytes <= p.maximo ? "aceptable" : "excedido";
}

export function formatearPeso(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < 1000 * KB) return `${Math.round(bytes / KB)} KB`;
  return `${(bytes / (1000 * KB)).toFixed(1).replace(".", ",")} MB`;
}

const URL_CSS = /url\(\s*(['"]?)(.*?)\1\s*\)/g;

/** Las URL de lo que el elemento muestra, sin repetir. */
export function recursosDe(el: Element): { url: string; tipo: TipoRecurso }[] {
  const vistos = new Map<string, TipoRecurso>();
  const sumar = (url: string | null | undefined, tipo: TipoRecurso) => {
    if (!url || url === "none" || vistos.has(url)) return;
    vistos.set(url, tipo);
  };
  el.querySelectorAll("img").forEach((img) => sumar(img.currentSrc || img.src, "imagen"));
  el.querySelectorAll("video").forEach((v) => {
    sumar(v.currentSrc, "video");
    sumar(v.poster, "imagen");
  });
  el.querySelectorAll("image").forEach((im) => sumar(im.getAttribute("href"), "imagen"));
  const todos = [el, ...Array.from(el.querySelectorAll("*")).slice(0, 3000)];
  for (const n of todos) {
    const cs = getComputedStyle(n);
    for (const prop of [cs.backgroundImage, cs.getPropertyValue("mask-image"), cs.getPropertyValue("-webkit-mask-image")]) {
      if (!prop || !prop.includes("url(")) continue;
      for (const m of prop.matchAll(URL_CSS)) sumar(m[2], "fondo");
    }
  }
  return Array.from(vistos, ([url, tipo]) => ({ url, tipo }));
}

/** Bytes de un data: (lo que pesa dentro del HTML o del JS). */
function bytesIncrustado(url: string): number {
  const coma = url.indexOf(",");
  const cabeza = url.slice(0, coma);
  const datos = url.slice(coma + 1);
  if (cabeza.endsWith(";base64")) return Math.floor((datos.length * 3) / 4);
  try {
    return new TextEncoder().encode(decodeURIComponent(datos)).length;
  } catch {
    return datos.length;
  }
}

async function pesoDe(url: string): Promise<{ bytes: number | null; origen: OrigenDato }> {
  if (url.startsWith("data:")) return { bytes: bytesIncrustado(url), origen: "incrustado" };
  if (url.startsWith("blob:")) {
    try {
      return { bytes: (await (await fetch(url)).blob()).size, origen: "local" };
    } catch {
      return { bytes: null, origen: "desconocido" };
    }
  }
  const absoluta = new URL(url, location.href).href;
  const entradas = performance.getEntriesByName(absoluta, "resource") as PerformanceResourceTiming[];
  // Un video llega en varios pedazos: se suman.
  let red = 0;
  let cache = 0;
  for (const e of entradas) {
    if (e.transferSize > 0) red += e.encodedBodySize || e.transferSize;
    else if (e.encodedBodySize > 0) cache = Math.max(cache, e.encodedBodySize);
  }
  if (red > 0) return { bytes: red, origen: "red" };
  if (cache > 0) return { bytes: cache, origen: "cache" };
  // Sin datos de tiempos (otro dominio sin Timing-Allow-Origin): se pide de la caché, si el dominio lo permite.
  try {
    const r = await fetch(absoluta, { cache: "force-cache" });
    if (!r.ok) return { bytes: null, origen: "desconocido" };
    const largo = Number(r.headers.get("content-length"));
    if (largo > 0) return { bytes: largo, origen: "cache" };
    return { bytes: (await r.blob()).size, origen: "cache" };
  } catch {
    return { bytes: null, origen: "desconocido" };
  }
}

/** Mide lo que pesa `el` y lo compara con el presupuesto del encabezado (o con el que se pase). */
export async function medirPeso(
  el: Element,
  opciones: { dispositivo?: Dispositivo; presupuesto?: Record<Dispositivo, Presupuesto> } = {},
): Promise<MedicionPeso> {
  const dispositivo = opciones.dispositivo ?? (el.clientWidth > 0 && el.clientWidth <= ANCHO_ESCRITORIO ? "movil" : "escritorio");
  const presupuesto = (opciones.presupuesto ?? PRESUPUESTO_ENCABEZADO)[dispositivo];
  const recursos: RecursoPeso[] = await Promise.all(recursosDe(el).map(async (r) => ({ ...r, ...(await pesoDe(r.url)) })));
  recursos.sort((a, b) => (b.bytes ?? -1) - (a.bytes ?? -1));
  const total = recursos.reduce((s, r) => s + (r.bytes ?? 0), 0);
  const desconocidos = recursos.filter((r) => r.bytes === null).length;
  return { total, desconocidos, recursos, dispositivo, presupuesto, estado: estadoPeso(total, presupuesto) };
}
