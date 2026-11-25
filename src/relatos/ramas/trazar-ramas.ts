// Ramas: el Hilo de fondo que se divide. Un tronco baja ondulando de arriba al fondo de la página (siempre llega) y le
// salen ramas de dos clases: las que **chocan** van hacia un lado hasta tocar un bloque (o el borde de la página), y
// ahí va su chispa; las que **se juntan** se abren y vuelven al tronco justo al fondo, cuando él termina. Cada rama con
// su grosor, su opacidad y su tono: las delgadas, más tenues, se ven lejos (profundidad). Va sobre el fondo de los
// bloques y bajo su contenido (el dibujo lo corta donde hay contenido), así que las ramas nacen donde se ven; una que no
// tiene dónde nacer libre, o que chocaría recién nacida, se junta. Puro, sin navegador.
import { scrollDe } from "../hilos/avance";
import { suave, type Punto } from "../hilos/geometria";

export interface Caja {
  izquierda: number;
  arriba: number;
  ancho: number;
  alto: number;
}
export interface TrazoRama {
  d: string;
  puntos: Punto[];
  /** En qué parte del scroll se dibuja (de 0 a 100). */
  desde: number;
  hasta: number;
}
export interface Rama extends TrazoRama {
  clase: "choca" | "junta";
  /** Hacia qué lado se va: -1 a la izquierda, 1 a la derecha. */
  lado: -1 | 1;
  /** En px. */
  grosor: number;
  /** De 0,3 (delgada, lejos) a 0,85 (gruesa, cerca). */
  opacidad: number;
  /** De -1 (el acento más oscuro) a 1 (más claro). */
  tono: number;
  /** Las que chocan: dónde (su último punto). Ahí va la chispa, cuando la rama termina de dibujarse. */
  choque?: Punto;
}
export interface OpcionesRamas {
  /** El alto visible: de él sale cuántas ramas van. */
  vista: number;
  /** El `slug` del negocio: decide la onda del tronco, las clases, los lados, los grosores y los tonos. */
  semilla: string;
  /**
   * El scroll de la página (dónde parte la página en él y cuánto se baja en total). Con esto, cada punto se dibuja
   * cuando pasa por el 60 % de la pantalla, como los hilos (lo que se ve al cargar ya va dibujado); sin esto, el tronco
   * va de 0 a 100 parejo por su largo.
   */
  scroll?: { arriba: number; recorrido: number };
  /** Las cajas de lo que tapa (el contenido, agrandado lo que haga falta): ahí chocan las ramas. Respecto de la página, en px. */
  bloques?: Caja[];
}

/** A cuánto de los bordes va el tronco, a lo menos. */
export const MARGEN_TRONCO = 12;
export const GROSOR_MINIMO = 1;
export const GROSOR_MAXIMO = 3.5;
/** Hasta dónde del scroll se dibuja, a lo más, una rama que choca: su chispa dura 3 % más y tiene que verse entera. */
export const CHOQUE_HASTA = 97;
/** Lo mínimo que tiene que medir una rama que choca (px): más corta, chocaría recién nacida, sobre el tronco. */
export const LARGO_CHOQUE = 24;
const PASO = 8;
const RAMAS_MINIMAS = 4;
const RAMAS_MAXIMAS = 9;

const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
/**
 * Un número repetible entre 0 y 1, y un número del texto (los de `efectos/semilla`, copiados: si este archivo, que se
 * baja aparte, los importara, el empaquetador los separaría de la página y ella pesaría más al cargar).
 */
function azar(i: number, sal: number): number {
  const x = Math.sin((i + 1) * 12.9898 + sal * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
function numeroDe(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 0x01000193);
  return h >>> 0;
}
const largoDe = (ps: Punto[]) => ps.slice(1).reduce((s, q, k) => s + Math.hypot(q.x - ps[k].x, q.y - ps[k].y), 0);
const cajaVale = (c: unknown): c is Caja => {
  const k = c as Caja | null;
  return k !== null && typeof k === "object" && fin(k.izquierda) && fin(k.arriba) && fin(k.ancho) && fin(k.alto) && k.ancho > 0 && k.alto > 0;
};
/** Si un punto queda tapado por una caja (su borde no cuenta). */
const tapa = (p: Punto, c: Caja) => p.x > c.izquierda && p.x < c.izquierda + c.ancho && p.y > c.arriba && p.y < c.arriba + c.alto;

/** El tronco y las ramas de una página de ese ancho y alto. Nunca lanza: con medidas que no sirven, no hay nada. */
/** Cada cuántos px de tronco va un tramo (cada uno con su parte del scroll). */
const TRAMO = 160;

/**
 * El tronco y las ramas de una página de ese ancho y alto. `tramos`: el tronco en pedazos seguidos, cada uno con su
 * parte del scroll (es lo que se dibuja). Nunca lanza: con medidas que no sirven, no hay nada.
 */
export function trazarRamas(ancho: number, alto: number, o: OpcionesRamas): { tronco: TrazoRama | null; tramos: TrazoRama[]; ramas: Rama[] } {
  const vista = o?.vista;
  if (!fin(ancho) || !fin(alto) || !fin(vista) || ancho < MARGEN_TRONCO * 3 || alto <= 0 || vista <= 0) return { tronco: null, tramos: [], ramas: [] };
  const sc = o.scroll && fin(o.scroll.arriba) && fin(o.scroll.recorrido) && o.scroll.recorrido > 0 ? o.scroll : null;
  /** En qué parte del scroll se dibuja el punto `i` del tronco. */
  const avanceDe = (i: number): number => (sc ? scrollDe(puntos[i].y, { alto, vista, recorrido: sc.recorrido, arriba: sc.arriba }) : (100 * recorrido[i]) / total);
  const sal = numeroDe(typeof o.semilla === "string" ? o.semilla : "") % 9973;
  const al = (i: number) => azar(i, sal);
  const bloques = (Array.isArray(o.bloques) ? o.bloques : []).filter(cajaVale);
  const tapado = (p: Punto) => bloques.some((c) => tapa(p, c));

  // El tronco: una onda alrededor del centro, de arriba al fondo.
  const amplitud = Math.min(ancho * 0.3, 160, ancho / 2 - MARGEN_TRONCO);
  const periodo = vista * (1.1 + 0.5 * al(1));
  const fase = al(2) * 2 * Math.PI;
  const xDe = (y: number) => Math.min(ancho - MARGEN_TRONCO, Math.max(MARGEN_TRONCO, ancho / 2 + amplitud * Math.sin((2 * Math.PI * y) / periodo + fase)));
  const n = Math.max(2, Math.ceil(alto / PASO));
  const puntos: Punto[] = Array.from({ length: n + 1 }, (_, i) => {
    const y = i === n ? alto : (alto * i) / n;
    return { x: xDe(y), y };
  });
  /** Cuánto tronco hay hasta cada punto. */
  const recorrido: number[] = [0];
  for (let i = 1; i < puntos.length; i++) recorrido.push(recorrido[i - 1] + Math.hypot(puntos[i].x - puntos[i - 1].x, puntos[i].y - puntos[i - 1].y));
  const total = recorrido[recorrido.length - 1];
  const tronco: TrazoRama = { d: suave(puntos), puntos, desde: 0, hasta: 100 };
  // Los tramos: sin el scroll, el tronco entero; con él, pedazos de unos 160 px, cada uno con su parte (al menos medio
  // punto, y nunca antes de que termine el anterior). El último termina al terminar de bajar. Uno que ya pasó la línea
  // del 60 % al cargar (lo que se ve de entrada, como el encabezado) va de 0 a 0: dibujado desde el principio.
  const tramos: TrazoRama[] = [];
  if (!sc) tramos.push(tronco);
  else {
    const cada = Math.max(2, Math.round(TRAMO / (alto / n)));
    let fin0 = 0;
    for (let a = 0; a < n; a += cada) {
      const b = Math.min(n, a + cada);
      const pedazo = puntos.slice(a, b + 1);
      if (b < n && avanceDe(b) <= 0) {
        tramos.push({ d: suave(pedazo), puntos: pedazo, desde: 0, hasta: 0 });
        continue;
      }
      const desde = Math.max(fin0, Math.min(99.5, avanceDe(a)));
      const hasta = b === n ? 100 : Math.min(100, Math.max(desde + 0.5, avanceDe(b)));
      tramos.push({ d: suave(pedazo), puntos: pedazo, desde, hasta });
      fin0 = hasta;
    }
  }
  /** En qué parte del scroll pasa el tronco por su punto `i` (lo que dicen los tramos, para que la rama parta junto con él). */
  const pasaPor = (i: number): number => {
    if (!sc) return (100 * recorrido[i]) / total;
    const cada = Math.max(2, Math.round(TRAMO / (alto / n)));
    const t = tramos[Math.min(tramos.length - 1, Math.floor(i / cada))];
    const a = Math.floor(i / cada) * cada;
    const b = Math.min(n, a + cada);
    return t.desde + ((t.hasta - t.desde) * (recorrido[i] - recorrido[a])) / Math.max(1e-9, recorrido[b] - recorrido[a]);
  };
  const fondo = puntos[n];
  /** Si una rama que nace en el punto `j` del tronco se ve: ahí no hay bloque, y tampoco un poco más abajo (si no, chocaría al nacer). */
  const libre = (j: number) => !tapado(puntos[j]) && !tapado(puntos[Math.min(n, j + 3)]) && !tapado({ x: puntos[j].x, y: puntos[j].y + 20 });

  const cuantas = Math.min(RAMAS_MAXIMAS, Math.max(RAMAS_MINIMAS, Math.round((1.5 * alto) / vista)));
  /** Hasta cuántos puntos del tronco se corre una rama para nacer donde se ve (media pantalla). */
  const busca = Math.max(1, Math.round(vista / 2 / (alto / n)));
  const primera = al(4) < 0.5 ? 0 : 1;
  let ladoChoca: -1 | 1 = al(3) < 0.5 ? -1 : 1;
  const ramas: Rama[] = [];
  let antes = -1;
  for (let k = 0; k < cuantas; k++) {
    // Dónde tocaba nacer (alturas parejas, del 8 % al 85 %) y, si ahí la tapa un bloque, el punto libre más cercano.
    const toca = Math.round(((0.08 + (0.77 * k) / (cuantas - 1)) * alto) / (alto / n));
    let i = -1;
    for (let d = 0; d <= busca && i < 0; d++) {
      for (const j of d ? [toca - d, toca + d] : [toca]) if (j > antes && j > 0 && j < n && libre(j)) i = j;
    }
    /** Si nace donde se ve (si no, no puede chocar: se junta). */
    const seVe = i >= 0;
    if (i < 0) i = toca > antes && toca < n ? toca : antes + 1;
    if (i <= antes || i >= n) continue;
    antes = i;
    const nace = puntos[i];
    const desde = pasaPor(i);
    const grosor = GROSOR_MINIMO + (GROSOR_MAXIMO - GROSOR_MINIMO) * al(20 + k);
    const estilo = { grosor, opacidad: 0.3 + (0.55 * (grosor - GROSOR_MINIMO)) / (GROSOR_MAXIMO - GROSOR_MINIMO), tono: al(30 + k) * 2 - 1 };

    /** Una rama que choca, si puede: nace donde se ve, alcanza a crecer y su chispa se ve entera. Si no, `null`. */
    const choca = (): Rama | null => {
      if (!seVe) return null;
      const lado = ladoChoca;
      // Sale bajando hacia su lado y llega de lado al borde de la página, como un golpe (sin bajar del borde de abajo:
      // ahí la chispa no se vería); si en el camino toca un contenido, termina ahí.
      const borde = { x: lado === 1 ? ancho : 0, y: Math.min(alto - 12, nace.y + 60 + 100 * al(10 + k)) };
      if (!(borde.y > nace.y)) return null;
      const tira = { x: nace.x + (borde.x - nace.x) * 0.5, y: borde.y };
      const en = (t: number): Punto => {
        const [a, b, c] = [(1 - t) ** 2, 2 * t * (1 - t), t * t];
        return t >= 1 ? { ...borde } : { x: a * nace.x + b * tira.x + c * borde.x, y: a * nace.y + b * tira.y + c * borde.y };
      };
      const pasos = Math.max(4, Math.ceil(Math.hypot(borde.x - nace.x, borde.y - nace.y) / PASO));
      const camino: Punto[] = [{ ...nace }];
      for (let j = 1; j <= pasos; j++) {
        const t = j / pasos;
        const p = en(t);
        if (!tapado(nace) && tapado(p)) {
          // Entró a un bloque: el choque es justo en su borde (se busca entre el punto anterior y este).
          let [libre, adentro] = [(j - 1) / pasos, t];
          for (let r = 0; r < 24; r++) {
            const medio = (libre + adentro) / 2;
            if (tapado(en(medio))) adentro = medio;
            else libre = medio;
          }
          camino.push(en(libre));
          break;
        }
        camino.push(p);
      }
      const largo = largoDe(camino);
      // Al paso del tronco (con el scroll, al menos 2 puntos: si no, aparecería de golpe).
      const hasta = Math.min(CHOQUE_HASTA, desde + Math.max(sc ? 2 : 0, (100 * largo) / total));
      if (largo < LARGO_CHOQUE || !(hasta > desde)) return null;
      const choque = { ...camino[camino.length - 1] };
      ladoChoca = lado === 1 ? -1 : 1;
      return { d: suave(camino), puntos: camino, desde, hasta, clase: "choca", lado, ...estilo, choque };
    };
    const golpe = (k + primera) % 2 === 0 ? choca() : null;
    if (golpe) ramas.push(golpe);
    else {
      // Se junta: se abre hacia el lado con más lugar y vuelve al tronco al fondo, cuando él termina.
      const medio = (nace.y + alto) / 2;
      const lado: -1 | 1 = xDe(medio) < ancho / 2 ? 1 : -1;
      const abre = Math.min(ancho * (0.25 + 0.1 * al(40 + k)), 300);
      const m = Math.max(2, Math.ceil((alto - nace.y) / PASO));
      const camino: Punto[] = Array.from({ length: m + 1 }, (_, j) => {
        if (j === 0) return { ...nace };
        if (j === m) return { ...fondo };
        const y = nace.y + ((alto - nace.y) * j) / m;
        const x = xDe(y) + lado * abre * Math.sin((Math.PI * j) / m);
        return { x: Math.min(ancho - 6, Math.max(6, x)), y };
      });
      ramas.push({ d: suave(camino), puntos: camino, desde, hasta: 100, clase: "junta", lado, ...estilo });
    }
  }
  return { tronco, tramos, ramas };
}
