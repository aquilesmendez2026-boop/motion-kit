// El trazado de los hilos: por dónde pasa el hilo en una página, a partir de sus medidas. Puro, sin navegador.
//
// El hilo va por lo libre: baja por la orilla de cada bloque (entre el borde y su contenido), cruza al otro lado en el
// paso de un bloque al siguiente (con un rulo, si cabe), se abre en hebras por los canales de un bloque con tarjetas y
// se junta abajo. Donde no cabe, pasa por debajo: ese tramo no se dibuja y queda una puntada donde entra y otra donde
// sale. Con «figura», termina dibujando la figura en el remate del final de la página.
// Cada tramo dice en qué parte del scroll se dibuja (de 0 a 100): el navegador hace el resto.
import type { FiguraId } from "../catalogo";
import { puntosDeFigura } from "./figuras";
import { arco, quebrada, recta, suave, type Punto } from "./geometria";

export type { Punto } from "./geometria";

export interface Caja {
  izquierda: number;
  arriba: number;
  ancho: number;
  alto: number;
}
export interface BloqueMedido {
  caja: Caja;
  /** Lo que hay en el bloque fuera de las tarjetas: cada texto, foto, botón o campo, con su caja. */
  cosas: Caja[];
  /** Las tarjetas (`data-mk-parte="tarjeta"`). */
  tarjetas: Caja[];
  /** El color de fondo del bloque y el de su texto, como los entrega el navegador. */
  fondo: string;
  texto: string;
  /** Sus tarjetas van en una tira que se desliza de lado: no abre el hilo. */
  tira: boolean;
}
/** Todo en px. Las cajas, respecto de la página. */
export interface Medidas {
  ancho: number;
  alto: number;
  /** El alto visible. */
  vista: number;
  /** Cuánto se puede bajar en total (el contenedor que hace scroll puede tener cosas fuera de la página). */
  recorrido: number;
  /** Dónde parte la página dentro de ese contenedor. */
  arriba: number;
  bloques: BloqueMedido[];
  /** Con «figura»: dónde está el remate (la franja del final). Sin esto, se supone que es lo último de la página. */
  remate?: { arriba: number; alto: number } | null;
}
export type TipoHilo = "rulos" | "hebras" | "figura";
export interface OpcionesHilo {
  tipo: TipoHilo;
  semilla: string;
  figura?: FiguraId;
  /** El color del hilo, para saber sobre qué fondos se pierde. */
  acento: string;
}
export interface Tramo {
  d: string;
  /** Muestras del mismo camino (cada 8 px o menos). */
  puntos: Punto[];
  /** En qué parte del scroll se dibuja (de 0 a 100). */
  desde: number;
  hasta: number;
  clase: "tronco" | "hebra" | "figura";
  /** Si no es el acento: el color del texto del bloque (sobre un fondo donde el acento se pierde). */
  color?: string;
  /**
   * El final (la llegada a la figura y la figura) no sigue al scroll: se dibuja con tiempo cuando el remate se ve. La
   * figura está al final de la página y solo cabe entera en la pantalla cuando ya casi no queda nada por bajar. En ms.
   */
  tiempo?: { espera: number; dura: number };
}
export interface Nudo extends Punto {
  /** En qué parte del scroll aparece. */
  en: number;
  clase: "nudo" | "puntada";
}
export interface Trazado {
  tramos: Tramo[];
  nudos: Nudo[];
}

/** Lo mínimo libre para que pase una línea. */
export const CANAL_MINIMO = 10;
/** A cuánto del borde va el hilo, a lo más. */
export const ORILLA_MAXIMA = 14;
export const RULO_MINIMO = 8;
export const RULO_MAXIMO = 18;
/** Con menos libre que esto, el cruce va sin rulo. */
export const CRUCE_CON_RULO = 24;
export const HEBRAS_MAXIMAS = 5;
/** El alto de la franja del final donde se dibuja la figura. */
export const REMATE = 140;
/** Cuánto puede meterse una línea en una caja sin que cuente como pisarla. */
export const HOLGURA = 2;
/** Con qué contraste (a 1) el hilo se pierde sobre un fondo. */
const SE_PIERDE = 1.6;

const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const acota = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const cajaVale = (c: unknown): c is Caja => {
  const k = c as Caja | null;
  return k !== null && typeof k === "object" && fin(k.izquierda) && fin(k.arriba) && fin(k.ancho) && fin(k.alto) && k.ancho > 0 && k.alto > 0;
};
/**
 * Un número repetible entre 0 y 1 (el mismo de `efectos/semilla`, copiado: si este archivo, que se baja aparte, lo
 * importara, el empaquetador lo separaría de la página y ella pesaría más al cargar).
 */
function azar(i: number, sal: number): number {
  const x = Math.sin((i + 1) * 12.9898 + sal * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
/** Un número del texto (para la semilla). */
function numeroDe(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/**
 * El porcentaje del scroll (0 a 100) en que el punto de altura `y` pasa por el 60 % de la vista. Al final de la bajada
 * esa línea ya no alcanza a lo último de la página: en el último tramo (un alto de vista) la línea baja de a poco hasta
 * el borde de abajo, para que el hilo llegue al final justo cuando se termina de bajar. Nada se dibuja bajo la pantalla.
 */
export function scrollDe(y: number, m: Medidas): number {
  if (!fin(y) || !m || !fin(m.recorrido) || m.recorrido <= 0 || !fin(m.vista) || !fin(m.arriba) || !fin(m.alto)) return 100;
  const llano = (v: number) => (m.arriba + v - 0.6 * m.vista) / m.recorrido;
  // Hasta dónde llega la línea del 60 % con todo el scroll.
  const tope = m.recorrido - m.arriba + 0.6 * m.vista;
  if (m.alto <= tope) return acota(llano(y) * 100, 0, 100);
  const s0 = Math.max(0, 1 - m.vista / m.recorrido);
  const y0 = s0 * m.recorrido - m.arriba + 0.6 * m.vista;
  // Lo último que se puede ver con todo el scroll (el borde de abajo de la pantalla): ahí termina la bajada.
  const ultimo = Math.min(m.alto, m.recorrido - m.arriba + m.vista);
  const s = y <= y0 ? llano(y) : s0 + ((1 - s0) * (y - y0)) / Math.max(1, ultimo - y0);
  return acota(s * 100, 0, 100);
}

/** De sRGB lineal (0 a 1) a sRGB (0 a 255). */
const aSrgb = (lineal: number[]) => lineal.map((v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055));
/** De Oklab a sRGB lineal. */
function deOklab(l: number, a: number, b: number): number[] {
  const [x, y, z] = [l + 0.3963377774 * a + 0.2158037573 * b, l - 0.1055613458 * a - 0.0638541728 * b, l - 0.0894841775 * a - 1.291485548 * b].map((v) => v ** 3);
  return [4.0767416621 * x - 3.3077115913 * y + 0.2309699292 * z, -1.2684380046 * x + 2.6097574011 * y - 0.3413193965 * z, -0.0041960863 * x - 0.7034186147 * y + 1.707614701 * z];
}
/** De CIELAB (D50) a sRGB lineal. */
function deLab(l: number, a: number, b: number): number[] {
  const fy = (l + 16) / 116;
  const f = (t: number) => (t > 6 / 29 ? t ** 3 : 3 * (6 / 29) ** 2 * (t - 4 / 29));
  const [x, y, z] = [0.96422 * f(fy + a / 500), f(fy), 0.82521 * f(fy - b / 200)];
  return [3.1338561 * x - 1.6168667 * y - 0.4906146 * z, -0.9787684 * x + 1.9161415 * y + 0.033454 * z, 0.0719453 * x - 0.2289914 * y + 1.4052427 * z];
}
/**
 * Un color como lo entrega el navegador (`#hex`, `rgb()`, `color(srgb …)`, `color(display-p3 …)`, `oklab()`,
 * `oklch()`, `lab()`, `lch()`), en rojo, verde y azul; `null` si no se entiende o no tapa.
 */
function rgbDe(color: unknown): number[] | null {
  if (typeof color !== "string") return null;
  const t = color.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(t);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const f = /^(rgba?|color|oklab|oklch|lab|lch)\(([^)]+)\)$/.exec(t);
  if (!f) return null;
  let [cuerpo, alfa] = f[2].split("/");
  let espacio = f[1];
  if (espacio === "color") {
    const [nombre, ...resto] = cuerpo.trim().split(/\s+/);
    // display-p3 es un poco más amplio que sRGB: para saber si se distingue, alcanza con tomarlo como sRGB.
    if (nombre !== "srgb" && nombre !== "display-p3") return null;
    espacio = "srgb";
    cuerpo = resto.join(" ");
  }
  const n = cuerpo.split(/[\s,]+/).filter(Boolean).map((v) => parseFloat(v) * (v.endsWith("%") ? (espacio === "oklab" || espacio === "oklch" ? 0.01 : 1) : 1));
  const tapa = alfa !== undefined ? parseFloat(alfa) * (alfa.includes("%") ? 0.01 : 1) : (n[3] ?? 1);
  if (n.length < 3 || n.slice(0, 3).some((v) => !Number.isFinite(v)) || !(tapa >= 0.5)) return null;
  const [p, q, r] = n;
  const giro = (r * Math.PI) / 180;
  if (espacio === "srgb") return [p, q, r].map((v) => v * 255);
  if (espacio === "oklab") return aSrgb(deOklab(p, q, r));
  if (espacio === "oklch") return aSrgb(deOklab(p, q * Math.cos(giro), q * Math.sin(giro)));
  if (espacio === "lab") return aSrgb(deLab(p, q, r));
  if (espacio === "lch") return aSrgb(deLab(p, q * Math.cos(giro), q * Math.sin(giro)));
  return [p, q, r];
}
const luz = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = acota(v, 0, 255) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** La razón de contraste entre dos colores; 21 (se distinguen) si alguno no se entiende o es transparente. */
export function contraste(a: string, b: string): number {
  const [x, y] = [rgbDe(a), rgbDe(b)];
  if (!x || !y) return 21;
  const [l1, l2] = [luz(x), luz(y)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Un bloque con lo que el trazado necesita: su contenido junto (o `null` si está vacío) y sus orillas. */
interface Bloque extends BloqueMedido {
  cont: Caja | null;
  abajo: number;
  derecha: number;
}
function union(cajas: Caja[]): Caja | null {
  if (!cajas.length) return null;
  const izquierda = Math.min(...cajas.map((c) => c.izquierda));
  const arriba = Math.min(...cajas.map((c) => c.arriba));
  return { izquierda, arriba, ancho: Math.max(...cajas.map((c) => c.izquierda + c.ancho)) - izquierda, alto: Math.max(...cajas.map((c) => c.arriba + c.alto)) - arriba };
}
function limpio(b: BloqueMedido): Bloque {
  const cosas = (Array.isArray(b.cosas) ? b.cosas : []).filter(cajaVale);
  const tarjetas = (Array.isArray(b.tarjetas) ? b.tarjetas : []).filter(cajaVale);
  return {
    caja: b.caja, cosas, tarjetas, fondo: typeof b.fondo === "string" ? b.fondo : "", texto: typeof b.texto === "string" ? b.texto : "", tira: b.tira === true,
    cont: union([...cosas, ...tarjetas]), abajo: b.caja.arriba + b.caja.alto, derecha: b.caja.izquierda + b.caja.ancho,
  };
}

/** Los bloques que se montan más de la mitad (en pantalla ancha, los que van lado a lado) cuentan como uno solo. */
export function juntarFilas(bloques: BloqueMedido[]): BloqueMedido[] {
  const filas: BloqueMedido[] = [];
  for (const b of [...bloques].sort((x, y) => x.caja.arriba - y.caja.arriba)) {
    const f = filas[filas.length - 1];
    const monta = f ? Math.min(f.caja.arriba + f.caja.alto, b.caja.arriba + b.caja.alto) - Math.max(f.caja.arriba, b.caja.arriba) : 0;
    if (!f || monta < Math.min(f.caja.alto, b.caja.alto) / 2) {
      filas.push({ ...b, cosas: [...(Array.isArray(b.cosas) ? b.cosas : [])], tarjetas: [...(Array.isArray(b.tarjetas) ? b.tarjetas : [])] });
      continue;
    }
    const [izquierda, arriba] = [Math.min(f.caja.izquierda, b.caja.izquierda), Math.min(f.caja.arriba, b.caja.arriba)];
    f.caja = { izquierda, arriba, ancho: Math.max(f.caja.izquierda + f.caja.ancho, b.caja.izquierda + b.caja.ancho) - izquierda, alto: Math.max(f.caja.arriba + f.caja.alto, b.caja.arriba + b.caja.alto) - arriba };
    f.cosas.push(...(Array.isArray(b.cosas) ? b.cosas : []));
    f.tarjetas.push(...(Array.isArray(b.tarjetas) ? b.tarjetas : []));
    f.tira = f.tira || b.tira;
  }
  return filas;
}

/** El paso de un bloque al siguiente: a qué altura cruza el hilo y con qué rulo (radio 0: sin rulo). */
interface Cruce {
  y: number;
  medio: number;
  radio: number;
  /** 1: el rulo va sobre la línea; -1: bajo ella. */
  lado: number;
  /** En qué parte del cruce va el rulo (de 0 a 1). */
  en: number;
}

/** La orilla libre de un bloque, de un lado: por dónde baja el hilo (`x`) y cuánto puede ondular. */
function orilla(b: Bloque, izquierda: boolean): { x: number; onda: number } | null {
  const libre = b.cont ? (izquierda ? b.cont.izquierda - b.caja.izquierda : b.derecha - (b.cont.izquierda + b.cont.ancho)) : b.caja.ancho / 2;
  if (!(libre >= CANAL_MINIMO)) return null;
  const d = Math.min(ORILLA_MAXIMA, libre / 2);
  return { x: izquierda ? b.caja.izquierda + d : b.derecha - d, onda: Math.max(0, Math.min(3, d - 3, libre - d - 3)) };
}

/** Baja derecho de `a` hasta la altura `y`, ondulando un poco (nada cerca de las puntas). */
function bajar(a: Punto, y: number, onda: number, fase: number): Punto[] {
  const largo = y - a.y;
  if (!(largo > 1)) return [];
  const n = Math.ceil(largo / 8);
  return Array.from({ length: n }, (_, i) => {
    const yi = a.y + (largo * (i + 1)) / n;
    const punta = Math.min(yi - a.y, y - yi);
    return { x: a.x + onda * acota((punta - 12) / 20, 0, 1) * Math.sin((yi / 90) * 2 * Math.PI + fase), y: yi };
  });
}

/** Cuánto doblan las esquinas del hilo. */
const DOBLEZ = 10;

/** Cruza de `a` hasta `x` a la misma altura, con su rulo si lo lleva. */
function cruzar(a: Punto, x: number, c: Cruce, ancho: number): Punto[] {
  const b = { x, y: a.y };
  if (!c.radio || Math.abs(x - a.x) < c.radio * 4 + DOBLEZ * 2) return recta(a, b);
  const sentido = Math.sign(x - a.x);
  const xm = acota(a.x + (x - a.x) * c.en, c.radio + 4, ancho - c.radio - 4);
  // El rulo: una vuelta entera, tangente a la línea, hacia donde va el hilo.
  const parte = c.lado > 0 ? 90 : -90;
  const vuelta = arco(xm, c.medio, c.radio, c.radio, parte, parte - 360 * sentido * c.lado);
  return [...recta(a, vuelta[0]), ...vuelta.slice(1), ...recta(vuelta[vuelta.length - 1], b)];
}

/** Por dónde se abre el hilo en un bloque con tarjetas: las alturas donde se abre y se junta, sus canales y sus nudos. */
function abrir(b: Bloque, techo0: number, piso0: number): { abre: number; junta: number; holgura: number; canales: number[]; nudos: Punto[] } | null {
  if (b.tira || b.tarjetas.length < 2) return null;
  const arriba = Math.min(...b.tarjetas.map((t) => t.arriba));
  const abajo = Math.max(...b.tarjetas.map((t) => t.arriba + t.alto));
  // Si hay algo que no es tarjeta a la altura de las tarjetas, no es una grilla limpia: no se abre.
  if (b.cosas.some((c) => c.arriba < abajo - 1 && c.arriba + c.alto > arriba + 1)) return null;
  const techo = Math.max(techo0, b.caja.arriba, ...b.cosas.filter((c) => c.arriba + c.alto <= arriba + 1).map((c) => c.arriba + c.alto));
  const piso = Math.min(piso0, ...b.cosas.filter((c) => c.arriba >= abajo - 1).map((c) => c.arriba));
  if (arriba - techo < CANAL_MINIMO || piso - abajo < CANAL_MINIMO) return null;
  // Las columnas: las tarjetas que se montan de lado a lado son de la misma.
  const columnas: { izq: number; der: number }[] = [];
  for (const t of [...b.tarjetas].sort((p, q) => p.izquierda - q.izquierda)) {
    const ultima = columnas[columnas.length - 1];
    if (ultima && t.izquierda < ultima.der - 4) ultima.der = Math.max(ultima.der, t.izquierda + t.ancho);
    else columnas.push({ izq: t.izquierda, der: t.izquierda + t.ancho });
  }
  // Los canales: la orilla izquierda, entre columnas y la orilla derecha.
  const bordes = [b.caja.izquierda, ...columnas.flatMap((c) => [c.izq, c.der]), b.derecha];
  let canales: number[] = [];
  for (let k = 0; k <= columnas.length; k++) {
    const [desde, hasta] = [bordes[2 * k], bordes[2 * k + 1]];
    const ancho = hasta - desde;
    if (ancho < CANAL_MINIMO) continue;
    canales.push(k === 0 ? desde + Math.min(ORILLA_MAXIMA, ancho / 2) : k === columnas.length ? hasta - Math.min(ORILLA_MAXIMA, ancho / 2) : (desde + hasta) / 2);
  }
  if (canales.length > HEBRAS_MAXIMAS) canales = Array.from({ length: HEBRAS_MAXIMAS }, (_, i) => canales[Math.round((i * (canales.length - 1)) / (HEBRAS_MAXIMAS - 1))]);
  if (canales.length < 2) return null;
  // Un nudo por tarjeta, en el canal que tiene a su izquierda (o, si no hay, a su derecha).
  const nudos = b.tarjetas.flatMap((t) => {
    const x = canales.filter((c) => c <= t.izquierda + 1).pop() ?? canales.find((c) => c >= t.izquierda + t.ancho - 1);
    return x === undefined ? [] : [{ x, y: t.arriba + Math.min(14, t.alto / 3) }];
  });
  // `holgura`: cuánto queda libre sobre la línea donde se abre y bajo la línea donde se junta.
  const [sobre, bajo] = [Math.min(arriba - techo, 30) / 2, Math.min(piso - abajo, 30) / 2];
  return { abre: arriba - sobre, junta: abajo + bajo, holgura: Math.min(sobre, bajo), canales, nudos };
}

/** A cuántos px por segundo se dibuja el final (la llegada a la figura y la figura). */
const PASO_FINAL = 520;

/** El trazado de un hilo para una página con esas medidas. Nunca lanza: con medidas que no sirven, no hay hilo. */
export function trazarHilos(m: Medidas, o: OpcionesHilo): Trazado {
  const tramos: Tramo[] = [];
  const nudos: Nudo[] = [];
  if (!m || !fin(m.ancho) || !fin(m.alto) || m.ancho <= 0 || m.alto <= 0) return { tramos, nudos };
  // Un bloque vacío (un separador) es espacio libre: no cuenta como bloque.
  const bloques = juntarFilas((Array.isArray(m.bloques) ? m.bloques : []).filter((b) => b && cajaVale(b.caja))).map(limpio).filter((b) => b.cont);
  const sal = numeroDe(typeof o.semilla === "string" ? o.semilla : "") % 9973;
  const al = (i: number) => azar(i, sal);
  const conFigura = o.tipo === "figura";
  /** Con «figura»: el remate, donde va la figura. Lo que se midió; si no, lo último de la página. */
  const medido = m.remate && fin(m.remate.arriba) && fin(m.remate.alto) && m.remate.alto > 0 ? m.remate : null;
  const remate = conFigura ? (medido ?? { arriba: m.alto - REMATE, alto: REMATE }) : null;
  /** Hasta dónde llegan los bloques. */
  const fondo = remate ? remate.arriba : m.alto;
  const en = (y: number) => scrollDe(y, m);
  /** Dónde terminó (en el scroll) el último tramo del tronco: el que sigue no parte antes. */
  let dibujado = 0;
  const agrega = (puntos: Punto[], clase: Tramo["clase"], color: string | undefined, alturas?: [number, number]) => {
    if (puntos.length < 2) return;
    // El tronco se dibuja de corrido: cada tramo parte donde va su primer punto (aunque su rulo suba más arriba).
    const [y0, y1] = alturas ?? [puntos[0].y, Math.max(...puntos.map((q) => q.y))];
    // Cada tramo ocupa al menos 2 puntos del scroll: uno que cabe en un instante se dibujaría de golpe. Y lo que
    // llega al final de la página termina de dibujarse cuando se termina de bajar.
    let hasta = Math.max(en(!conFigura && y1 >= fondo - 8 ? m.alto : y1), Math.min(100, en(y0) + 2));
    let desde = Math.max(0, Math.min(en(y0), hasta - 2));
    if (clase === "tronco") {
      desde = Math.min(98, Math.max(desde, dibujado));
      hasta = Math.min(100, Math.max(hasta, desde + 2));
      dibujado = hasta;
    }
    tramos.push({ d: suave(puntos), puntos, desde, hasta, clase, ...(color ? { color } : {}) });
  };

  /** Dónde empieza lo propio de un bloque: lo primero de su contenido. */
  const primero = (b: Bloque) => (b.cont ? b.cont.arriba : b.abajo);
  /** Dónde termina lo suyo: lo último de su contenido. */
  const ultimoDe = (b: Bloque) => (b.cont ? b.cont.arriba + b.cont.alto : b.caja.arriba);
  /** Si un bloque tiene relleno propio arriba para su cruce (así el cruce queda sobre su fondo). */
  const cruzaEnLoSuyo = (b: Bloque) => primero(b) - b.caja.arriba >= CRUCE_CON_RULO;
  /**
   * El cruce hacia el bloque `i`. Va en el relleno propio del bloque, si lo tiene; si no, entre lo último del bloque de
   * arriba y lo primero de este. Nunca más arriba que lo último del bloque de arriba (los bloques pueden montarse).
   * `ocupado`: hasta dónde llegó ya el hilo del bloque de arriba (la junta de sus hebras).
   */
  const cruceDe = (i: number, ocupado = -Infinity): Cruce | null => {
    if (i < 1 || i >= bloques.length) return null;
    const b = bloques[i];
    const antes = bloques[i - 1];
    const hasta = primero(b);
    const desde = Math.max(cruzaEnLoSuyo(b) ? b.caja.arriba : -Infinity, ultimoDe(antes), ocupado, hasta - 80);
    const libre = hasta - desde;
    if (!(libre >= CANAL_MINIMO)) return null;
    const medio = desde + libre / 2;
    if (libre < CRUCE_CON_RULO) return { y: medio, medio, radio: 0, lado: 1, en: 0.5 };
    const tope = Math.min(RULO_MAXIMO, (libre - 6) / 2);
    const radio = acota(tope * (0.75 + 0.25 * al(i * 7 + 1)), Math.min(RULO_MINIMO, tope), tope);
    const lado = al(i * 7 + 2) < 0.5 ? -1 : 1;
    return { y: medio + lado * radio, medio, radio, lado, en: 0.3 + 0.4 * al(i * 7 + 3) };
  };
  const puntada = (q: Punto) => nudos.push({ x: q.x, y: q.y, en: en(q.y), clase: "puntada" });

  /** De qué lado va el hilo, dónde quedó su punta y si viene de pasar por debajo de un bloque. */
  let izquierda = al(0) < 0.5;
  let punta: Punto | null = null;
  let porDebajo = false;
  /** El cruce hacia el bloque que toca (se calcula al terminar el de arriba). */
  let cruce = cruceDe(1);
  for (let i = 1; i < bloques.length; i++) {
    const b = bloques[i];
    const abajo = i === bloques.length - 1 ? null : bloques[i + 1];
    const [este, otro] = [orilla(b, izquierda), orilla(b, !izquierda)];
    const color = contraste(o.acento, b.fondo) < SE_PIERDE && b.texto ? b.texto : undefined;
    let viene = punta && !porDebajo ? punta : null;
    /** El camino hasta quedar a la altura del cruce, en la orilla por donde baja o a un doblez de ella. */
    let puntos: Punto[];
    let lado: { x: number; onda: number };
    /** Si cruzó: la esquina donde dobla hacia abajo (el doblez se hace después, cuando se sabe cuánto puede bajar). */
    let esquina: Punto | null = null;
    if (cruce && otro) {
      // Cruza al otro lado: dobla hacia el cruce y cruza (con su rulo).
      const parte: Punto = viene ?? { x: este?.x ?? (izquierda ? b.caja.izquierda + 7 : b.derecha - 7), y: cruce.y };
      const sentido = Math.sign(otro.x - parte.x) || 1;
      if (Math.abs(otro.x - parte.x) < DOBLEZ * 4) puntos = [parte, ...recta(parte, { x: parte.x, y: cruce.y }), ...recta({ x: parte.x, y: cruce.y }, { x: otro.x, y: cruce.y })];
      else {
        const [entra, sale] = [{ x: parte.x + sentido * DOBLEZ, y: cruce.y }, { x: otro.x - sentido * DOBLEZ, y: cruce.y }];
        const dobla = parte.y < cruce.y - 1 ? quebrada([parte, { x: parte.x, y: cruce.y }, entra], 8, DOBLEZ) : [parte, ...recta(parte, entra)];
        puntos = [...dobla, ...cruzar(entra, sale.x, cruce, m.ancho)];
        esquina = { x: otro.x, y: cruce.y };
      }
      izquierda = !izquierda;
      lado = otro;
    } else if (este) {
      // No puede cruzar: sigue por su lado.
      if (viene && !cruce && Math.abs(este.x - viene.x) >= 1) {
        // Sin espacio entre los dos bloques para correrse a la orilla de este: pasa por debajo y sale en la suya.
        puntada(viene);
        viene = null;
        porDebajo = true;
      }
      const parte: Punto = viene ?? { x: este.x, y: cruce?.y ?? Math.max(b.caja.arriba + 2, ultimoDe(bloques[i - 1]) + HOLGURA + 4) };
      // Baja por donde venía hasta lo libre entre los dos bloques, y ahí se corre a la orilla de este.
      const altura = cruce ? Math.max(parte.y, cruce.y) : parte.y;
      puntos = [parte, ...(altura > parte.y + 0.5 ? recta(parte, { x: parte.x, y: altura }) : []), ...(Math.abs(este.x - parte.x) >= 1 ? recta({ x: parte.x, y: altura }, { x: este.x, y: altura }) : [])];
      lado = este;
    } else {
      // No hay lugar: pasa por debajo.
      if (viene) puntada(viene);
      porDebajo = true;
      cruce = cruceDe(i + 1);
      continue;
    }
    if (porDebajo && tramos.length) puntada(puntos[0]);
    porDebajo = false;
    const fase = al(i * 7 + 4) * 6.28;
    /** Dónde va el hilo: en la esquina, si cruzó. */
    const ahora = esquina ?? puntos[puntos.length - 1];
    /** Desde dónde queda libre la orilla para abrirse: bajo el doblez y bajo el rulo. */
    const techo = Math.max(ahora.y + (esquina ? DOBLEZ : 0), cruce ? cruce.medio + cruce.radio : -Infinity) + 3;
    /** Hasta dónde llega el hilo de este bloque si es el último. */
    const final = conFigura ? fondo + 14 : Math.min(b.abajo, fondo) - 6;
    // Hasta dónde pueden llegar las hebras para juntarse. Si el bloque de abajo cruza en su propio relleno, hasta el
    // borde entre los dos. Si no, el cruce de abajo va en este mismo espacio: las hebras toman un poco menos de la mitad.
    const libre = ultimoDe(b);
    const piso = !abajo ? final - 3 : cruzaEnLoSuyo(abajo) ? abajo.caja.arriba - 3 : libre + (primero(abajo) - libre) * 0.45;
    let hebras = o.tipo === "rulos" ? null : abrir(b, techo, piso);
    // El cruce que sigue parte bajo lo que ocuparon las hebras al juntarse.
    let sigue = cruceDe(i + 1, hebras ? hebras.junta + hebras.holgura : undefined);
    // La bajada termina un poco antes del cruce que sigue: así el tramo siguiente parte doblando, no en una esquina.
    // Sin cruce, termina antes de lo primero del bloque de abajo, con lugar para la puntada si pasa por debajo.
    const hastaDe = (c: Cruce | null) => (!abajo ? final : c ? c.y - DOBLEZ : Math.min(b.abajo, primero(abajo)) - 6);
    let hasta = hastaDe(sigue);
    if (hebras && !(hebras.junta < hasta)) {
      hebras = null;
      sigue = cruceDe(i + 1);
      hasta = hastaDe(sigue);
    }
    /** Dobla la esquina (si cruzó) y baja hasta `y`. Si no hay cómo bajar, llega a la esquina y se queda ahí. */
    const bajarHasta = (y: number): Punto[] => {
      if (!esquina) return bajar(ahora, y, lado.onda, fase);
      const antes = puntos[puntos.length - 1];
      const cabe = y - esquina.y;
      if (cabe < 2) return recta(antes, esquina);
      const dobla = Math.min(DOBLEZ, cabe);
      const sale = { x: esquina.x, y: esquina.y + dobla };
      return [...quebrada([antes, esquina, sale], 8, dobla).slice(1), ...bajar(sale, y, lado.onda, fase)];
    };
    if (hebras) {
      const abre = { x: lado.x, y: hebras.abre };
      const junta = { x: lado.x, y: hebras.junta };
      agrega([...puntos, ...bajarHasta(abre.y)], "tronco", color);
      // Cada hebra va por su propia línea: la del canal más lejano, por fuera (así no se montan ni se cruzan).
      const lejanas = hebras.canales.filter((x) => Math.abs(x - lado.x) >= 1.5).sort((p, q) => Math.abs(p - lado.x) - Math.abs(q - lado.x));
      const paso = lejanas.length > 1 ? Math.min(5, Math.max(0, hebras.holgura - 3) / (lejanas.length - 1)) : 0;
      for (const x of hebras.canales) {
        const k = lejanas.indexOf(x);
        if (k < 0) {
          agrega(quebrada([abre, junta]), "hebra", color, [abre.y, junta.y]);
          continue;
        }
        const [sube, baja] = [abre.y - k * paso, junta.y + k * paso];
        const sale = lado.x + Math.sign(x - lado.x) * Math.min(DOBLEZ, Math.abs(x - lado.x) / 2);
        agrega(quebrada([abre, { x: sale, y: sube }, { x, y: sube }, { x, y: baja }, { x: sale, y: baja }, junta], 8, DOBLEZ), "hebra", color, [abre.y, junta.y]);
      }
      for (const n of hebras.nudos) nudos.push({ ...n, en: en(n.y), clase: "nudo" });
      const sigueBajando = [junta, ...bajar(junta, hasta, lado.onda, fase)];
      agrega(sigueBajando, "tronco", color);
      punta = sigueBajando[sigueBajando.length - 1];
    } else {
      const camino = [...puntos, ...bajarHasta(hasta)];
      agrega(camino, "tronco", color);
      punta = camino[camino.length - 1];
    }
    cruce = sigue;
  }

  if (remate) {
    // La figura, en el remate: centrada, girada un poco según la semilla, y de corrido desde la punta del hilo.
    const tamano = Math.max(24, Math.min(96, remate.alto - 44, m.ancho * 0.6));
    const [cx, cy] = [m.ancho / 2, remate.arriba + Math.min(30, (remate.alto - tamano) / 2) + tamano / 2];
    const giro = ((al(99) - 0.5) * 16 * Math.PI) / 180;
    const figura = puntosDeFigura(o.figura ?? "estrella").map((p) => {
      const [x, y] = [((p.x - 50) / 100) * tamano, ((p.y - 50) / 100) * tamano];
      return { x: cx + x * Math.cos(giro) - y * Math.sin(giro), y: cy + x * Math.sin(giro) + y * Math.cos(giro) };
    });
    // Al punto de partida de la figura se llega por arriba (de lado por lo alto del remate y después derecho hacia
    // abajo): así el hilo no la cruza. Esa llegada es hilo, no figura: en quieto, donde no hay hilo, queda la figura sola.
    const llegada = punta && !porDebajo && punta.y >= fondo - 1 ? quebrada([punta, { x: figura[0].x, y: punta.y }, figura[0]], 8, DOBLEZ) : [];
    const largo = (ps: Punto[]) => ps.slice(1).reduce((t, q, k) => t + Math.hypot(q.x - ps[k].x, q.y - ps[k].y), 0);
    // El final va con tiempo: primero la llegada, después la figura, al mismo paso.
    const espera = llegada.length > 1 ? Math.round(acota((largo(llegada) / PASO_FINAL) * 1000, 200, 700)) : 0;
    if (llegada.length > 1) tramos.push({ d: suave(llegada), puntos: llegada, desde: 100, hasta: 100, clase: "tronco", tiempo: { espera: 0, dura: espera } });
    tramos.push({ d: suave(figura), puntos: figura, desde: 100, hasta: 100, clase: "figura", tiempo: { espera, dura: Math.round(acota((largo(figura) / PASO_FINAL) * 1000, 900, 1600)) } });
  }
  return { tramos, nudos };
}
