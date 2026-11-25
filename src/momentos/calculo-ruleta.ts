// La ruleta de premios, en números: los premios, la velocidad del gesto, el plan de giro (que termina en el premio
// que le digan, frenando siempre y sin retroceder) y los clavos que hacen saltar la lengüeta. Puro, sin navegador.
//
// El ángulo de la rueda es cuánto está girada, en grados, en el sentido del reloj. La flecha está arriba. El premio `i`
// ocupa, en la rueda, de `i × paso` a `(i + 1) × paso` grados desde arriba (paso = 360 / premios).
import { semilla as azar } from "../efectos/semilla";
import { numeroDe } from "./calculos";

export interface Premio {
  texto: string;
}
/** Un premio de la rueda, con su lugar en la lista tal como llegó: ese es el número que usan `resultado` y `alTerminar`. */
export interface PremioLimpio extends Premio {
  indice: number;
}
export const MIN_PREMIOS = 2;
export const MAX_PREMIOS = 12;

/**
 * Los premios, limpios: de 2 a 12, con texto. Vale un texto suelto. Con menos de 2 no hay ruleta (lista vacía).
 * Los que no sirven (vacíos, o del 13 en adelante) se quitan, pero los demás conservan su `indice` de la lista original.
 */
export function limpiarPremios(x: unknown): PremioLimpio[] {
  if (!Array.isArray(x)) return [];
  const premios = x
    .map((p, indice) => ({ texto: (typeof p === "string" ? p : p !== null && typeof p === "object" && typeof (p as Premio).texto === "string" ? (p as Premio).texto : "").replace(/\s+/g, " ").trim().slice(0, 40), indice }))
    .filter((p) => p.texto)
    .slice(0, MAX_PREMIOS);
  return premios.length < MIN_PREMIOS ? [] : premios;
}

/** El premio que queda bajo la flecha con la rueda en ese ángulo. */
export function premioEn(angulo: number, n: number): number {
  const paso = 360 / n;
  const bajoLaFlecha = (((-angulo % 360) + 360) % 360) / paso;
  return Math.min(n - 1, Math.floor(bajoLaFlecha + 1e-9));
}

/** Cuántos clavos (uno entre cada par de premios) pasan bajo la flecha al ir de un ángulo a otro. */
export function clavosPasados(a0: number, a1: number, n: number): number {
  const paso = 360 / n;
  return Math.abs(Math.floor(a1 / paso) - Math.floor(a0 / paso));
}

/** La velocidad con que se soltó la rueda (grados por segundo), mirando los últimos instantes del gesto. */
export function velocidadDeGesto(muestras: { t: number; a: number }[]): number {
  if (!Array.isArray(muestras) || muestras.length < 2) return 0;
  const ultima = muestras[muestras.length - 1];
  // Solo cuenta lo de los últimos 120 ms: un tirón viejo, con la rueda ya quieta bajo el dedo, no la lanza.
  const primera = muestras.find((m) => ultima.t - m.t <= 120) ?? ultima;
  const dt = (ultima.t - primera.t) / 1000;
  return dt > 0.008 ? (ultima.a - primera.a) / dt : 0;
}

/** El roce de siempre: cuánto frena la rueda por lo rápido que va (por segundo)… */
export const ROCE = 0.9;
/** …y lo que frena siempre, vaya como vaya (grados por segundo al cuadrado): es lo que la detiene del todo. */
const FRENO = 40;
/**
 * Con menos impulso que esto (grados por segundo) la rueda no sale: vuelve a su lugar. Es un lanzamiento de verdad:
 * la rueda siempre da varias vueltas, y con un mínimo más bajo saldría disparada a varias veces la velocidad del dedo.
 */
export const IMPULSO_MINIMO = 500;
/** Entre cuántas vueltas da, con el roce de siempre. */
const VUELTAS = [3.6, 7];

/** Cuánto tarda en detenerse y cuánto recorre, saliendo a `v0` con roce `k`. */
function recorrido(v0: number, k: number): { dura: number; grados: number } {
  const dura = Math.log(1 + (k * v0) / FRENO) / k;
  return { dura, grados: (v0 - FRENO * dura) / k };
}
/** Busca, entre `a` y `b`, el valor donde `f` (que solo baja o solo sube) vale `meta`. */
function buscar(f: (x: number) => number, meta: number, a: number, b: number): number {
  const sube = f(b) > f(a);
  for (let i = 0; i < 60; i++) {
    const medio = (a + b) / 2;
    if (f(medio) < meta === sube) a = medio;
    else b = medio;
  }
  return (a + b) / 2;
}
/** La velocidad de salida más lenta y la más rápida: con el roce de siempre dan el mínimo y el máximo de vueltas. */
const [V_MIN, V_MAX] = VUELTAS.map((v) => buscar((x) => recorrido(x, ROCE).grados, v * 360, 100, 20000));

export interface PlanDeGiro {
  desde: number;
  final: number;
  /** 1 en el sentido del reloj, -1 al revés. */
  sentido: number;
  /** Con qué velocidad sale (grados por segundo, sin signo). */
  velocidad: number;
  roce: number;
  /** Cuánto tarda en detenerse (segundos). */
  dura: number;
}

/** La velocidad de salida y su sentido, o `null` si el impulso no alcanza. */
function salida(velocidad: number): { sentido: number; v0: number } | null {
  if (!Number.isFinite(velocidad) || Math.abs(velocidad) < IMPULSO_MINIMO) return null;
  return { sentido: Math.sign(velocidad), v0: Math.max(V_MIN, Math.min(V_MAX, Math.abs(velocidad))) };
}

/**
 * El plan de un giro que termina en el premio `resultado`. La rueda sale con la velocidad del gesto (acotada) y frena
 * como siempre; lo que se ajusta es el roce, apenas, para que el recorrido caiga en ese premio (a lo más media vuelta
 * de diferencia con lo que habría recorrido sola). El punto exacto dentro del premio sale de la semilla.
 * `null` si el impulso es flojo o el premio no existe.
 */
export function planDeGiro(angulo: number, velocidad: number, n: number, resultado: number, semilla: string): PlanDeGiro | null {
  const s = salida(velocidad);
  if (!s || !Number.isFinite(angulo) || !Number.isInteger(resultado) || resultado < 0 || resultado >= n) return null;
  const paso = 360 / n;
  // Dónde cae dentro del premio: lejos de las orillas (del 20 % al 80 % de su ancho).
  const adentro = 0.2 + azar(resultado, numeroDe(typeof semilla === "string" ? semilla : "") % 1000) * 0.6;
  const bajoLaFlecha = (resultado + adentro) * paso;
  const sola = angulo + s.sentido * recorrido(s.v0, ROCE).grados;
  // El ángulo más cercano a donde habría llegado sola que deja ese punto bajo la flecha.
  const final = -bajoLaFlecha + 360 * Math.round((sola + bajoLaFlecha) / 360);
  const grados = Math.abs(final - angulo);
  const roce = buscar((k) => recorrido(s.v0, k).grados, grados, ROCE * 0.5, ROCE * 2);
  return { desde: angulo, final, sentido: s.sentido, velocidad: s.v0, roce, dura: recorrido(s.v0, roce).dura };
}

/** Un giro sin premio elegido (falló la consulta del resultado): frena donde la lleve su impulso, con el roce de siempre. */
export function planLibre(angulo: number, velocidad: number): PlanDeGiro | null {
  const s = salida(velocidad);
  if (!s || !Number.isFinite(angulo)) return null;
  const r = recorrido(s.v0, ROCE);
  return { desde: angulo, final: angulo + s.sentido * r.grados, sentido: s.sentido, velocidad: s.v0, roce: ROCE, dura: r.dura };
}

/** Dónde va la rueda a los `t` segundos de salir. Pasado el final, queda justo en su lugar. */
export function anguloEn(plan: PlanDeGiro, t: number): number {
  if (!(t > 0)) return plan.desde;
  if (t >= plan.dura) return plan.final;
  const k = plan.roce;
  const grados = ((plan.velocidad + FRENO / k) * (1 - Math.exp(-k * t))) / k - (FRENO * t) / k;
  return plan.desde + plan.sentido * grados;
}

/** La velocidad de salida del botón «Girar» (grados por segundo). */
export const IMPULSO_BOTON = 1500;
