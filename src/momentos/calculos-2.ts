// Lo calculable de la segunda tanda de momentos. Sin React: con pruebas en pruebas/momentos2.test.ts.
import { partesEn } from "./calculos";

const dos = (n: number) => String(n).padStart(2, "0");

/** Año, mes, día, hora y minuto de un instante en la zona del negocio; si la zona no existe, en la del navegador. */
function partes(zona: string, ahora: Date): number[] {
  try {
    return partesEn(zona, ahora.getTime());
  } catch {
    return [ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate(), ahora.getHours(), ahora.getMinutes(), ahora.getSeconds()];
  }
}

/** El día de hoy en la zona del negocio, como `AAAA-MM-DD`. */
export function hoyEn(zona: string, ahora: Date): string {
  const [y, m, d] = partes(zona, ahora);
  return `${y}-${dos(m)}-${dos(d)}`;
}

/** La hora de ahora en la zona del negocio, como `HH:MM`. */
export function horaEn(zona: string, ahora: Date): string {
  const [, , , h, mi] = partes(zona, ahora);
  return `${dos(h)}:${dos(mi)}`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const RE_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Lo que va en la hoja de calendario de una fecha `AAAA-MM-DD`; `null` si la fecha no existe. */
export function hojaDe(fecha: string): { dia: number; mes: string; semana: string } | null {
  const m = typeof fecha === "string" ? RE_FECHA.exec(fecha) : null;
  if (!m) return null;
  const [y, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(y, mes - 1, dia));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
  return { dia, mes: MESES[mes - 1], semana: SEMANA[d.getUTCDay()] };
}

/** La fecha `AAAA-MM-DD` corrida en `dias`; cadena vacía si la fecha no existe. */
export function sumarDias(fecha: string, dias: number): string {
  if (!hojaDe(fecha)) return "";
  const [y, m, d] = fecha.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + dias));
  return `${t.getUTCFullYear()}-${dos(t.getUTCMonth() + 1)}-${dos(t.getUTCDate())}`;
}

/**
 * Los cupos de una clase: el texto que se lee, su estado (para decidir si late) y, si se conoce el total, qué parte
 * está ocupada (de 0 a 1) para la barra.
 */
export function cuposDe(libres: number, espera: "no" | "abierta" | "llena", cupos?: number): { texto: string; estado: "libre" | "ultimo" | "lleno"; ocupado: number | null } {
  const quedan = Number.isFinite(libres) ? Math.max(0, Math.floor(libres)) : 0;
  const total = typeof cupos === "number" && Number.isFinite(cupos) && cupos > 0 ? cupos : null;
  const ocupado = total === null ? null : Math.max(0, Math.min(1, (total - quedan) / total));
  if (quedan === 0) return { texto: espera === "abierta" ? "Lleno · lista de espera" : "Lleno", estado: "lleno", ocupado };
  return quedan === 1 ? { texto: "Queda 1", estado: "ultimo", ocupado } : { texto: `Quedan ${quedan}`, estado: "libre", ocupado };
}

/** La próxima clase de hoy (la primera que parte a esta hora o después): su posición en la lista, o -1. */
export function proximaClase(sesiones: { fecha: string; hora: string }[], hoy: string, hora: string): number {
  let mejor = -1;
  sesiones.forEach((s, i) => {
    if (s.fecha === hoy && s.hora >= hora && (mejor < 0 || s.hora < sesiones[mejor].hora)) mejor = i;
  });
  return mejor;
}

/** Una novedad es «nueva» si se publicó hace `dias` días o menos (y no en el futuro). */
export function esNueva(publicada: string, ahora: Date, dias = 7): boolean {
  const t = Date.parse(publicada);
  if (!Number.isFinite(t)) return false;
  const hace = ahora.getTime() - t;
  return hace >= 0 && hace <= dias * 86400000;
}

const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «15 de noviembre», en el día de la zona del negocio; cadena vacía si la fecha no se entiende. */
export function fechaLarga(iso: string, zona: string): string {
  // Una fecha sin hora es ese día y punto: leída como instante sería la medianoche de Londres, el día anterior en Chile.
  const sola = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? hojaDe(iso) : null;
  if (sola) return `${sola.dia} de ${MESES_LARGOS[Number(iso.slice(5, 7)) - 1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const [, m, d] = partes(zona, new Date(t));
  return `${d} de ${MESES_LARGOS[m - 1]}`;
}

const REDES: Record<string, string> = {
  youtube: "YouTube", spotify: "Spotify", twitch: "Twitch", tiktok: "TikTok", kick: "Kick", instagram: "Instagram", facebook: "Facebook",
  x: "X", threads: "Threads", apple_podcasts: "Apple Podcasts", soundcloud: "SoundCloud", linkedin: "LinkedIn", whatsapp: "WhatsApp",
};

/** El nombre de una red para leerlo (sin logos): el conocido, o el identificador con espacios y mayúscula inicial. */
export function nombreDeRed(red: string): string {
  if (typeof red !== "string" || !red) return "";
  const limpio = red.replace(/_/g, " ");
  return REDES[red] ?? limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

/** Número repetible entre 0 y 1 (el mismo cálculo de src/efectos/semilla.ts). */
function azar(i: number, sal: number): number {
  const x = Math.sin((i + 1) * 12.9898 + sal * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** El alto de cada barra de la onda de un episodio (de 0,25 a 1). La misma semilla da siempre la misma onda. */
export function barrasOnda(semilla: number, n = 28): number[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    // Una forma suave (dos ondas) más un poco de grano, para que parezca voz y no ruido.
    const forma = 0.5 + 0.28 * Math.sin(i * 0.55 + semilla) + 0.14 * Math.sin(i * 1.7 + semilla * 2.3);
    return Math.max(0.25, Math.min(1, forma + (azar(i, semilla) - 0.5) * 0.3));
  });
}

/** «46 min» o «1 h 2 min»; cadena vacía si no viene o no sirve. */
export function duracionEnPalabras(segundos?: number): string {
  if (typeof segundos !== "number" || !Number.isFinite(segundos) || segundos <= 0) return "";
  const minutos = Math.max(1, Math.round(segundos / 60));
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

/** Los párrafos de un texto: se separan con una línea en blanco. */
export function parrafosDe(texto: string): string[] {
  return typeof texto === "string" ? texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [];
}

/** La inicial de un nombre, en mayúscula. */
export function inicialDe(nombre: string): string {
  const primera = Array.from((nombre ?? "").trim())[0];
  return primera ? primera.toUpperCase() : "";
}

/** «01», «02»… para los pasos. */
export const numeroDePaso = (i: number) => dos(i + 1);

/**
 * A qué ritmo corre la cinta según la velocidad del scroll (px por segundo): 1 es su paso normal; bajando rápido
 * acelera (hasta 4 veces) y subiendo se devuelve (hasta -3).
 */
export function ritmoCinta(velocidad: number): number {
  if (!Number.isFinite(velocidad)) return 1;
  return Math.max(-3, Math.min(4, 1 + velocidad / 600));
}

/** Cuántas copias del lema lleva cada mitad de la cinta: cuatro como mínimo y lo necesario para cubrir el ancho del bloque y una copia más (así nunca asoma un hueco). */
export function copiasCinta(anchoCopia: number, anchoBloque: number): number {
  if (!(anchoCopia > 0) || !(anchoBloque > 0)) return 4;
  return Math.max(4, Math.min(40, Math.ceil(anchoBloque / anchoCopia) + 1));
}

/** Deja `x` entre 0 y `largo` dando la vuelta (para la cinta, que es un ciclo). */
export function envolver(x: number, largo: number): number {
  return largo > 0 ? ((x % largo) + largo) % largo : 0;
}
