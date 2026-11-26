// El trazado de los hilos: por dónde pasa el hilo en una página, a partir de sus medidas. Puro, sin navegador.
//
// El hilo va por lo libre: baja por la orilla de cada bloque (entre el borde y su contenido), cruza al otro lado en el
// paso de un bloque al siguiente (con un rulo, si cabe), se abre en hebras por los canales de un bloque con tarjetas y
// se junta abajo. Donde no cabe, pasa por debajo: ese tramo no se dibuja y queda una puntada donde entra y otra donde
// sale. Con «figura», termina dibujando la figura en el remate del final de la página. Con «enredadera», va sin hebras
// y en el remate llega a una flor por abajo (las hojas las pone `enredadera.ts`).
// Cada tramo dice en qué parte del scroll se dibuja (de 0 a 100): el navegador hace el resto.
import type { FiguraId } from "../catalogo";
import { puntosDeFigura } from "./figuras";
import { arco, quebrada, recta, suave, type Punto } from "./geometria";
import { scrollDe } from "./avance";
import { contraste } from "./color";

export { scrollDe } from "./avance";
export { contraste } from "./color";

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
  /** Solo en el modo fino de la medición: lo que se puede rodear (tarjetas, fotos, botones y enlaces; los de más afuera). */
  marcos?: Caja[];
  /** Solo en el modo fino: el bloque entero cuenta como contenido (una foto de fondo, algo pegado, una tira). */
  entero?: boolean;
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
export type TipoHilo = "rulos" | "hebras" | "figura" | "enredadera";
export interface OpcionesHilo {
  tipo: TipoHilo;
  semilla: string;
  /** Sin rulos en los cruces (el rastro: unas huellas no dan vueltas). Por defecto, con. */
  rulos?: boolean;
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
/** La flor del final de la enredadera: su centro, su radio, cuántos pétalos y cuándo se abre (ms, desde que el remate se ve). */
export interface Flor extends Punto {
  radio: number;
  /** En grados: cuánto va girado el primer pétalo. */
  giro: number;
  petalos: number;
  espera: number;
}
export interface Trazado {
  tramos: Tramo[];
  nudos: Nudo[];
  flor?: Flor;
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
export function azar(i: number, sal: number): number {
  const x = Math.sin((i + 1) * 12.9898 + sal * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
/** Un número del texto (para la semilla). */
export function numeroDe(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 0x01000193);
  return h >>> 0;
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
  const enredadera = o.tipo === "enredadera";
  /** Con «figura» o «enredadera»: el remate, donde va la figura o la flor. Lo que se midió; si no, lo último de la página. */
  const medido = m.remate && fin(m.remate.arriba) && fin(m.remate.alto) && m.remate.alto > 0 ? m.remate : null;
  const remate = conFigura || enredadera ? (medido ?? { arriba: m.alto - REMATE, alto: REMATE }) : null;
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
    let hasta = Math.max(en(!remate && y1 >= fondo - 8 ? m.alto : y1), Math.min(100, en(y0) + 2));
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
    if (libre < CRUCE_CON_RULO || o.rulos === false) return { y: medio, medio, radio: 0, lado: 1, en: 0.5 };
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
    const final = remate ? fondo + 14 : Math.min(b.abajo, fondo) - 6;
    // Hasta dónde pueden llegar las hebras para juntarse. Si el bloque de abajo cruza en su propio relleno, hasta el
    // borde entre los dos. Si no, el cruce de abajo va en este mismo espacio: las hebras toman un poco menos de la mitad.
    const libre = ultimoDe(b);
    const piso = !abajo ? final - 3 : cruzaEnLoSuyo(abajo) ? abajo.caja.arriba - 3 : libre + (primero(abajo) - libre) * 0.45;
    let hebras = o.tipo === "rulos" || enredadera ? null : abrir(b, techo, piso);
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

  const largo = (ps: Punto[]) => ps.slice(1).reduce((t, q, k) => t + Math.hypot(q.x - ps[k].x, q.y - ps[k].y), 0);
  if (remate && enredadera) {
    // La flor, arriba en el remate y un poco corrida según la semilla. El tallo llega por abajo: baja por su orilla
    // hasta bajo la flor, va hacia ella y sube derecho hasta su centro (así no la cruza; los pétalos lo tapan). En un
    // remate chico (menos de 76 px; el de la página mide 140) no cabe el tallo: va la flor sola, más chica.
    const conTallo = remate.alto >= 76;
    const radio = Math.max(1, Math.min(30, conTallo ? (remate.alto - 60) / 2 : (remate.alto - 8) / 2, m.ancho * 0.12));
    const x = m.ancho / 2 + (al(98) - 0.5) * 0.3 * m.ancho;
    const y = remate.arriba + (conTallo ? 12 : 4) + radio;
    const base = Math.min(remate.arriba + remate.alto - 10, y + radio + 40);
    // Si el último bloque no dejaba lugar (una foto de lado a lado), el tallo pasó por debajo: sale al empezar el
    // remate, con su ojal, por el mismo lado.
    let desde: Punto | null = null;
    if (punta && !porDebajo && punta.y >= fondo - 1) desde = punta;
    else if (punta) {
      desde = { x: acota(punta.x, 7, m.ancho - 7), y: fondo + 6 };
      puntada(desde);
    }
    const llegada = conTallo && desde && desde.y < base - DOBLEZ ? quebrada([desde, { x: desde.x, y: base }, { x, y: base }, { x, y: y + radio * 0.3 }], 8, DOBLEZ) : [];
    if (!llegada.length && desde && desde !== punta) nudos.pop();
    const dura = llegada.length > 1 ? Math.round(acota((largo(llegada) / PASO_FINAL) * 1000, 300, 900)) : 0;
    if (dura) tramos.push({ d: suave(llegada), puntos: llegada, desde: 100, hasta: 100, clase: "tronco", tiempo: { espera: 0, dura } });
    const petalos = al(97) < 0.5 ? 5 : 6;
    return { tramos, nudos, flor: { x, y, radio, giro: Math.round(al(96) * (360 / petalos)), petalos, espera: dura } };
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
    // El final va con tiempo: primero la llegada, después la figura, al mismo paso.
    const espera = llegada.length > 1 ? Math.round(acota((largo(llegada) / PASO_FINAL) * 1000, 200, 700)) : 0;
    if (llegada.length > 1) tramos.push({ d: suave(llegada), puntos: llegada, desde: 100, hasta: 100, clase: "tronco", tiempo: { espera: 0, dura: espera } });
    tramos.push({ d: suave(figura), puntos: figura, desde: 100, hasta: 100, clase: "figura", tiempo: { espera, dura: Math.round(acota((largo(figura) / PASO_FINAL) * 1000, 900, 1600)) } });
  }
  return { tramos, nudos };
}
