// Lo calculable de los momentos, sin React: rangos, semillas, cifras y tiempos. Se prueba con node --test.
import { semilla } from "../efectos/semilla";

/** Número entero estable para un texto (el `slug` del negocio sirve de semilla). FNV-1a de 32 bits. */
export function numeroDe(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const entero = (n: number, min: number, max: number, siNo: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : siNo;

/** Sellos: total entre 1 y 30, llenos entre 0 y el total. */
export function limitesSellos(total: number, llenos: number): { total: number; llenos: number } {
  const t = entero(total, 1, 30, 1);
  return { total: t, llenos: entero(llenos, 0, t, 0) };
}

/** Giro de cada sello al caer (grados, −12 a 12), siempre igual para el mismo negocio. */
export function girosSellos(total: number, texto: string): number[] {
  const sal = numeroDe(texto) % 1000;
  return Array.from({ length: total }, (_, i) => Math.round((semilla(i, sal) - 0.5) * 24 * 10) / 10);
}

/** Cuánto se llena cada una de las 5 estrellas (0 a 1). Sin promedio, todas vacías. */
export function estrellasDe(promedio: number | null): number[] {
  const p = promedio === null || !Number.isFinite(promedio) ? 0 : Math.min(5, Math.max(0, promedio));
  return Array.from({ length: 5 }, (_, i) => Math.min(1, Math.max(0, p - i)));
}

/** El índice siguiente o anterior, dando la vuelta. */
export function siguienteIndice(i: number, n: number, paso: 1 | -1): number {
  return n <= 0 ? 0 : (((i + paso) % n) + n) % n;
}

/** Un decimal con coma, como en Chile: 4,6. */
export function formatoDecimal(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1).replace(".", ",");
}

/** Pesos chilenos sin decimales: $12.990. Vacío si no es un monto válido. */
export function formatoPesos(valor: number): string {
  if (!Number.isFinite(valor) || valor < 0) return "";
  return "$" + String(Math.round(valor)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Giro de cada carta en el abanico (grados), simétrico respecto del centro. */
export function abanicoDe(n: number): number[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => (i - (n - 1) / 2) * 6 + 0);
}

export type Falta = {
  estado: "falta" | "hoy" | "empezo" | "invalida";
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  texto: string;
};

const RE_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const RE_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
const formatos = new Map<string, Intl.DateTimeFormat>();

/** Año, mes, día, hora, minuto y segundo de un instante en una zona (lanza si la zona no existe). */
export function partesEn(zona: string, instante: number): number[] {
  let f = formatos.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zona, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    formatos.set(zona, f);
  }
  const p = Object.fromEntries(f.formatToParts(new Date(instante)).map((x) => [x.type, Number(x.value)]));
  return [p.year, p.month, p.day, p.hour, p.minute, p.second];
}

/** Cuánto adelanta la zona al UTC en ese instante (ms). */
function desfase(zona: string, instante: number): number {
  const [y, mo, d, h, mi, s] = partesEn(zona, instante);
  return Date.UTC(y, mo - 1, d, h, mi, s) - Math.floor(instante / 1000) * 1000;
}

const cuenta = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
const INVALIDA: Falta = { estado: "invalida", dias: 0, horas: 0, minutos: 0, segundos: 0, texto: "" };

/**
 * Cuánto falta para un evento con fecha y hora del negocio (no del navegador). Pasa la hora local a un instante con
 * la zona y vuelve a revisar el desfase en ese instante, por el cambio de hora.
 */
export function faltaPara(fecha: string, hora: string, zona: string, ahora: Date): Falta {
  const f = RE_FECHA.exec(fecha);
  const h = RE_HORA.exec(hora);
  if (!f || !h) return INVALIDA;
  const [y, mo, d] = [Number(f[1]), Number(f[2]), Number(f[3])];
  const local = Date.UTC(y, mo - 1, d, Number(h[1]), Number(h[2]));
  const comprobada = new Date(local);
  if (comprobada.getUTCMonth() !== mo - 1 || comprobada.getUTCDate() !== d) return INVALIDA;
  let instante: number;
  let hoy: boolean;
  try {
    const d1 = desfase(zona, local);
    instante = local - d1;
    const d2 = desfase(zona, instante);
    if (d2 !== d1) {
      // Con el otro desfase, ¿el reloj del negocio marca la hora pedida? Si no, esa hora no existe (el salto de
      // septiembre): se cuenta después del salto, que es como la vive el negocio.
      const otra = local - d2;
      const [oy, om, od, oh, omi] = partesEn(zona, otra);
      if (Date.UTC(oy, om - 1, od, oh, omi) === local) instante = otra;
    }
    const [ya, ma, da] = partesEn(zona, ahora.getTime());
    hoy = ya === y && ma === mo && da === d;
  } catch {
    return INVALIDA;
  }
  const resto = instante - ahora.getTime();
  if (resto <= 0) return { estado: "empezo", dias: 0, horas: 0, minutos: 0, segundos: 0, texto: "Ya empezó" };
  const segTotal = Math.floor(resto / 1000);
  const dias = Math.floor(segTotal / 86400);
  const horas = Math.floor((segTotal % 86400) / 3600);
  const minutos = Math.floor((segTotal % 3600) / 60);
  const segundos = segTotal % 60;
  if (hoy) return { estado: "hoy", dias, horas, minutos, segundos, texto: `¡Es hoy! A las ${hora}` };
  let primera: number;
  let texto: string;
  if (dias > 0) {
    primera = dias;
    texto = cuenta(dias, "día", "días") + (horas ? ` y ${cuenta(horas, "hora", "horas")}` : "");
  } else if (horas > 0) {
    primera = horas;
    texto = cuenta(horas, "hora", "horas") + (minutos ? ` y ${cuenta(minutos, "minuto", "minutos")}` : "");
  } else if (minutos > 0) {
    primera = minutos;
    texto = cuenta(minutos, "minuto", "minutos");
  } else {
    return { estado: "falta", dias, horas, minutos, segundos, texto: "Falta menos de un minuto" };
  }
  return { estado: "falta", dias, horas, minutos, segundos, texto: `${primera === 1 ? "Falta" : "Faltan"} ${texto}` };
}

export type Calle = { x1: number; y1: number; x2: number; y2: number; ancho: number };

/** Un plano inventado (no es un mapa real): calles en un cuadro de 0 a 100 y el pin cerca del centro. */
export function callesDe(n: number): { calles: Calle[]; pin: { x: number; y: number } } {
  const sal = Math.abs(Math.round(n)) % 10007;
  let k = 0;
  const r = () => semilla(k++, sal);
  const lim = (v: number) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
  const calles: Calle[] = [];
  const horizontales = 3 + Math.floor(r() * 2);
  const verticales = 3 + Math.floor(r() * 2);
  for (let i = 0; i < horizontales; i++) {
    const y = 8 + ((i + r() * 0.6) / horizontales) * 84;
    calles.push({ x1: 0, y1: lim(y), x2: 100, y2: lim(y + (r() - 0.5) * 16), ancho: i === 1 ? 6 : 2 + Math.round(r() * 3) });
  }
  for (let i = 0; i < verticales; i++) {
    const x = 8 + ((i + r() * 0.6) / verticales) * 84;
    calles.push({ x1: lim(x), y1: 0, x2: lim(x + (r() - 0.5) * 16), y2: 100, ancho: 2 + Math.round(r() * 3) });
  }
  if (r() > 0.5) calles.push({ x1: 0, y1: lim(r() * 30), x2: 100, y2: lim(70 + r() * 30), ancho: 4 });
  return { calles, pin: { x: lim(40 + r() * 20), y: lim(40 + r() * 20) } };
}

/** Dónde cae cada foto antes de ordenarse: corrida (px) y girada (grados), siempre igual para la misma semilla. */
export function desordenDe(n: number, s: number): { x: number; y: number; giro: number }[] {
  const sal = Math.abs(Math.round(s)) % 10007;
  const r = (i: number, k: number) => semilla(i * 3 + k, sal) * 2 - 1;
  return Array.from({ length: Math.max(0, n) }, (_, i) => ({
    x: Math.round(r(i, 0) * 40),
    y: Math.round(r(i, 1) * 30),
    giro: Math.round(r(i, 2) * 14),
  }));
}

/** Enlace que se puede poner en un href: web (http o https), correo, teléfono o una ruta de la misma página. */
export function esEnlaceSeguro(href: string): boolean {
  if (typeof href !== "string") return false;
  // Se mira lo que va a ver el navegador: quita los saltos y tabuladores de cualquier parte, y los espacios y
  // caracteres de control del comienzo. Sin esto, «java\nscript:» pasaría por una ruta de la misma página.
  const h = href.replace(/[\t\n\r]/g, "").replace(/^[\u0000-\u0020]+/, "").trimEnd();
  // Dos barras (de cualquier tipo) al comienzo llevan a otro sitio.
  if (!h || /^[\\/]{2}/.test(h)) return false;
  const esquema = /^([a-z][a-z0-9+.-]*):/i.exec(h);
  return !esquema || ["http", "https", "mailto", "tel"].includes(esquema[1].toLowerCase());
}

/** Un momento arranca con un tercio a la vista o, si es muy alto, cuando ya llena media pantalla. */
export function debeArrancar(fraccion: number, altoVisible: number, altoVista: number): boolean {
  return fraccion >= 0.35 || altoVisible >= altoVista * 0.5;
}

/** Una vez arrancado, el momento no pasa de completo a liviano (se animaría otra vez); a quieto sí. */
export function nivelFijo(fijado: "completo" | "liviano" | "quieto" | null, actual: "completo" | "liviano" | "quieto"): "completo" | "liviano" | "quieto" {
  return actual === "quieto" ? actual : fijado ?? actual;
}

export interface ResenaDatos {
  nombre: string;
  /** 0 a 5. */
  estrellas: number;
  texto?: string;
}

/** Reseñas limpias: estrellas entre 0 y 5, total que no es NaN (al menos las que llegaron) y si hay algo que dibujar. */
export function datosResenas(promedio: number | null, total: number, resenas: ResenaDatos[]): {
  valor: number | null;
  total: number;
  resenas: ResenaDatos[];
  dibujar: boolean;
} {
  const valor = promedio !== null && Number.isFinite(promedio) ? Math.min(5, Math.max(0, promedio)) : null;
  const limpias = resenas.map((r) => ({ ...r, estrellas: Number.isFinite(r.estrellas) ? Math.min(5, Math.max(0, r.estrellas)) : 0 }));
  const t = Math.max(Number.isFinite(total) && total > 0 ? Math.round(total) : 0, limpias.length);
  return { valor, total: t, resenas: limpias, dibujar: limpias.length > 0 || (valor !== null && t > 0) };
}

/** Fotos con dirección usable: web, ruta propia, `data:image` o `blob:`. */
export function fotosValidas<T extends { url: string }>(fotos: T[]): T[] {
  return fotos.filter((f) => {
    const u = (f.url ?? "").trim();
    if (!u || u.startsWith("//")) return false;
    const esquema = /^([a-z][a-z0-9+.-]*):/i.exec(u);
    if (!esquema) return true;
    const e = esquema[1].toLowerCase();
    return e === "http" || e === "https" || e === "blob" || (e === "data" && /^data:image\//i.test(u));
  });
}
