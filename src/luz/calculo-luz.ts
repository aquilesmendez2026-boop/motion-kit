// La luz de la página, en números: de dónde viene, cuánto la corre la persona, la luz de cada hora y la sombra que
// deja cada altura. Puro, sin navegador.

/** De dónde viene la luz: cada eje de -1 a 1. `x` negativo es desde la izquierda; `y` negativo, desde arriba. */
export interface Punto {
  x: number;
  y: number;
}

/** La luz de siempre: de arriba a la izquierda. */
export const REPOSO: Punto = { x: -0.45, y: -0.8 };
/** Cuánto se aparta del reposo cuando la persona la mueve. Con este valor, ninguna sombra cambia de lado. */
export const RANGO = 0.35;
/** Las alturas van de 0 (pegado a la mesa) a esta. */
export const ALTURA_MAX = 4;
/** Lo que se corre la sombra proyectada por cada nivel de altura, con la luz de costado (px). */
export const PASO_SOMBRA = 7;

const esNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const acotar = (n: number, min = -1, max = 1) => Math.max(min, Math.min(max, n));
const corto = (n: number) => Math.round(n * 1000) / 1000 || 0;

/** Una luz que se puede usar: cada eje entre -1 y 1; el eje que no es un número toma el de `siNo`. */
export function limpiarLuz(v: unknown, siNo: Punto = REPOSO): Punto {
  const o = (v !== null && typeof v === "object" ? v : {}) as Partial<Record<keyof Punto, unknown>>;
  return { x: esNumero(o.x) ? acotar(o.x) : siNo.x, y: esNumero(o.y) ? acotar(o.y) : siNo.y };
}

/** Un eje de la luz no cruza al otro lado de su reposo (salvo que el reposo casi no tenga lado). */
const delLado = (reposo: number, v: number) => (Math.abs(reposo) < 0.1 ? v : reposo < 0 ? Math.min(v, 0) : Math.max(v, 0));

/**
 * La luz ahora: el reposo más la señal (de -1 a 1 por eje) por el rango (de 0 a 1). Nunca sale de -1 a 1, no cruza al
 * otro lado de su reposo (las sombras no cambian de lado) y, si viene de arriba, no llega a venir de abajo.
 */
export function luzAhora(reposo: Punto, senal: Punto, rango: number = RANGO): Punto {
  const r = esNumero(rango) ? acotar(rango, 0, 1) : RANGO;
  const s = limpiarLuz(senal, { x: 0, y: 0 });
  const y = delLado(reposo.y, acotar(reposo.y + s.y * r));
  return { x: corto(delLado(reposo.x, acotar(reposo.x + s.x * r))), y: corto(reposo.y <= -0.05 ? Math.min(y, -0.05) : y) };
}

/**
 * La inclinación del teléfono llevada a la pantalla (cada eje de -1 a 1), según cuánto está girada la pantalla
 * (`angulo`: 0, 90, 180 o 270). `gamma` es de lado a lado del aparato y `beta`, de adelante a atrás; un teléfono se
 * sostiene unos 45° hacia quien lo mira, y desde ahí se cuenta.
 */
export function inclinacionEnPantalla(gamma: number, beta: number, angulo: number): Punto {
  if (!esNumero(gamma) || !esNumero(beta)) return { x: 0, y: 0 };
  const giro = esNumero(angulo) ? ((Math.round(angulo / 90) % 4) + 4) % 4 : 0;
  const [lado, frente] = giro === 1 ? [beta, -gamma] : giro === 2 ? [-gamma, -beta] : giro === 3 ? [-beta, gamma] : [gamma, beta];
  return { x: corto(acotar(lado / 30)), y: corto(acotar((frente - 45) / 30)) };
}

const AMANECE = 6;
const ANOCHECE = 20;
/** El color de la luz baja (amanecer y atardecer), el de la noche y el del mediodía. */
const CALIDA = [255, 176, 112];
const NOCHE = "#b9c8ff";
const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");

/**
 * La luz según la hora del reloj de `fecha`: en la mañana viene baja y cálida desde la izquierda; al mediodía, de
 * arriba y blanca; en la tarde, baja y cálida desde la derecha; de noche, tenue y fría. Sin red ni ubicación.
 */
export function luzDeLaHora(fecha: Date): Punto & { tinte: string; fuerza: number } {
  const hora = fecha instanceof Date ? fecha.getHours() + fecha.getMinutes() / 60 : NaN;
  if (!Number.isFinite(hora)) return { ...REPOSO, tinte: "#ffffff", fuerza: 1 };
  if (hora < AMANECE || hora >= ANOCHECE) return { x: -0.3, y: -0.7, tinte: NOCHE, fuerza: 0.6 };
  /** El día de 0 (amanece) a 1 (anochece), y qué tan alto está el sol (0 en las orillas, 1 al mediodía). */
  const dia = (hora - AMANECE) / (ANOCHECE - AMANECE);
  const alto = Math.sin(Math.PI * dia);
  return {
    x: corto(-Math.cos(Math.PI * dia) * 0.85),
    y: corto(-(0.25 + 0.7 * alto)),
    tinte: `#${CALIDA.map((c) => hex(c + (255 - c) * alto)).join("")}`,
    fuerza: corto(0.75 + 0.25 * alto),
  };
}

/** Lo que crece la sombra proyectada por cada nivel de altura, hacia cada lado (px). */
export const CRECE_SOMBRA = 2;

/**
 * La sombra proyectada de algo que está a `altura` (0 a 4): cuánto se corre (px, al lado contrario de la luz), cuánto
 * crece hacia cada lado (px) y qué tan oscura es. Pegado a la mesa no proyecta nada. El CSS de `Materia` hace esta
 * misma cuenta.
 */
export function sombraDe(luz: Punto, altura: number): { x: number; y: number; crece: number; opacidad: number } {
  const a = esNumero(altura) ? acotar(Math.round(altura), 0, ALTURA_MAX) : 1;
  return {
    x: corto(-luz.x * a * PASO_SOMBRA),
    y: corto(-luz.y * a * PASO_SOMBRA),
    crece: a * CRECE_SOMBRA,
    opacidad: a ? corto(0.42 - a * 0.055) : 0,
  };
}
