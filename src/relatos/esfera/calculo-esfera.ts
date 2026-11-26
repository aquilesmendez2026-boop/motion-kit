// Esfera: lo calculable. Una bola de puntos (espiral de Fibonacci) que gira, dónde flota en la pantalla, cuánto se ha
// disuelto (según lo que se bajó) y cuánto avanza cada punto, a dónde va cada uno en los bloques de la página (el
// contorno de lo que se puede rodear o, si no hay, el borde del bloque) y su color. Puro, sin navegador.
import { contraste } from "../hilos/color";
import type { Caja, Punto } from "../hilos/trazar";

export interface P3 {
  x: number;
  y: number;
  z: number;
}
export type LugarEsfera = "derecha" | "izquierda" | "centro";
/** Cuántos puntos tiene la esfera: muchos y chicos, para que alcancen para toda la página. */
export const PUNTOS_ESFERA = 400;
/** A cuánto por fuera de cada cosa va su contorno, y a cuánto del borde de un bloque sin cosas (por dentro), en px. */
export const SEPARACION = 10;
export const BORDE = 12;
/** Lo menos que se separan dos puntos de un contorno (px). */
export const PASO = 7;

const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const positivo = (v: unknown) => (fin(v) && v > 0 ? v : 0);
const cajaVale = (c: unknown): c is Caja => {
  const k = c as Caja | null;
  return k !== null && typeof k === "object" && fin(k.izquierda) && fin(k.arriba) && fin(k.ancho) && fin(k.alto) && k.ancho > 0 && k.alto > 0;
};

/** `n` puntos repartidos parejo sobre una esfera de radio 1 (la espiral de Fibonacci). */
export function puntosEsfera(n: number): P3[] {
  const cuantos = fin(n) && n > 0 ? Math.floor(n) : 0;
  const aureo = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: cuantos }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / cuantos;
    const r = Math.sqrt(1 - y * y);
    return { x: Math.cos(i * aureo) * r, y, z: Math.sin(i * aureo) * r };
  });
}

/**
 * Un punto de la esfera, girado (`giro`, alrededor del eje vertical) e inclinado (`inclinacion`, hacia adelante), en la
 * pantalla: `x` e `y` en unidades del radio (con un poco de perspectiva), `z` de -1 (atrás) a 1 (adelante), y su tamaño
 * (de 0,8 a 2 px) y su opacidad (de 0,25 a 1): los de atrás, más chicos y tenues.
 */
export function proyectar(p: P3, giro: number, inclinacion: number): { x: number; y: number; z: number; tamano: number; alfa: number } {
  const [g, i] = [fin(giro) ? giro : 0, fin(inclinacion) ? inclinacion : 0];
  const x1 = p.x * Math.cos(g) + p.z * Math.sin(g);
  const z1 = -p.x * Math.sin(g) + p.z * Math.cos(g);
  const y2 = p.y * Math.cos(i) - z1 * Math.sin(i);
  const z2 = Math.max(-1, Math.min(1, p.y * Math.sin(i) + z1 * Math.cos(i)));
  const f = 1 / (1.6 - z2 * 0.4);
  const cerca = (z2 + 1) / 2;
  return { x: x1 * f, y: y2 * f, z: z2, tamano: 0.8 + 1.2 * cerca, alfa: 0.25 + 0.75 * cerca };
}

/** Dónde flota la esfera en una pantalla de ese ancho y alto: su centro y su radio (de 40 a 110 px). */
export function lugarEsfera(lugar: LugarEsfera, ancho: number, alto: number): { x: number; y: number; radio: number } {
  const [a, h] = [positivo(ancho), positivo(alto)];
  const radio = Math.min(Math.max(40, Math.min(110, a * 0.18, h * 0.16)), Math.max(0, a / 2 - 24));
  const x = lugar === "izquierda" ? radio + 16 : lugar === "centro" ? a / 2 : a - radio - 16;
  return { x, y: h / 2, radio };
}

/**
 * El contorno punteado de una caja: puntos a `separacion` px por fuera de ella (sus esquinas, redondeadas), uno cada
 * `paso` px más o menos, en orden.
 */
export function contorno(c: Caja, separacion: number, paso: number): Punto[] {
  if (!cajaVale(c) || !(positivo(separacion) > 0) || !(positivo(paso) > 0)) return [];
  const [s, x0, y0, x1, y1] = [separacion, c.izquierda, c.arriba, c.izquierda + c.ancho, c.arriba + c.alto];
  const arco = (Math.PI / 2) * s;
  // Los ocho pedazos: arriba, esquina, derecha, esquina, abajo, esquina, izquierda, esquina.
  const pedazos: { largo: number; en: (t: number) => Punto }[] = [
    { largo: c.ancho, en: (t) => ({ x: x0 + c.ancho * t, y: y0 - s }) },
    { largo: arco, en: (t) => ({ x: x1 + s * Math.sin((t * Math.PI) / 2), y: y0 - s * Math.cos((t * Math.PI) / 2) }) },
    { largo: c.alto, en: (t) => ({ x: x1 + s, y: y0 + c.alto * t }) },
    { largo: arco, en: (t) => ({ x: x1 + s * Math.cos((t * Math.PI) / 2), y: y1 + s * Math.sin((t * Math.PI) / 2) }) },
    { largo: c.ancho, en: (t) => ({ x: x1 - c.ancho * t, y: y1 + s }) },
    { largo: arco, en: (t) => ({ x: x0 - s * Math.sin((t * Math.PI) / 2), y: y1 + s * Math.cos((t * Math.PI) / 2) }) },
    { largo: c.alto, en: (t) => ({ x: x0 - s, y: y1 - c.alto * t }) },
    { largo: arco, en: (t) => ({ x: x0 - s * Math.cos((t * Math.PI) / 2), y: y0 - s * Math.sin((t * Math.PI) / 2) }) },
  ];
  const total = pedazos.reduce((t, p) => t + p.largo, 0);
  const n = Math.max(4, Math.round(total / paso));
  return Array.from({ length: n }, (_, k) => {
    let s0 = (total * k) / n;
    for (const p of pedazos) {
      if (s0 <= p.largo) return p.en(p.largo ? s0 / p.largo : 0);
      s0 -= p.largo;
    }
    return pedazos[0].en(0);
  });
}

/**
 * Cuánto se ha disuelto la esfera (de 0 a 1) cuando la página bajó `bajado` px: del todo en la primera media pantalla
 * o, en una página que no deja bajar tanto, al terminar de bajar (`tope`: lo más que se puede bajar).
 */
export function disolucion(bajado: number, vista: number, tope?: number): number {
  if (!fin(bajado) || !(positivo(vista) > 0)) return 0;
  const hasta = positivo(tope) > 0 ? Math.min(vista / 2, tope as number) : vista / 2;
  return Math.max(0, Math.min(1, bajado / hasta));
}

/**
 * Cuánto avanzó el punto `i` de `n` (de 0 a 1) con la esfera disuelta en `d`: cada uno parte en su momento (en la
 * primera mitad) y tarda la otra mitad, así se ve deshacerse y no transformarse de una.
 */
export function avancePunto(d: number, i: number, n: number): number {
  if (!fin(d) || !fin(i) || !(positivo(n) > 0)) return 0;
  const parte = ((i * 0.6180339887498949) % 1) * 0.5;
  const t = Math.max(0, Math.min(1, (d - parte) / 0.5));
  return t * t * (3 - 2 * t);
}

/**
 * A dónde van los puntos en la página (a lo más `cuantos`): en cada bloque, el contorno de lo que se puede rodear o, si
 * no tiene, su borde (por dentro); nada en un bloque que es todo contenido (una foto de fondo). Parejos por toda la
 * página: un punto cada 7 px o, si no alcanzan, más separados.
 */
export function objetivosPagina(bloques: { caja: Caja; marcos: Caja[]; entera: boolean }[], cuantos: number): (Punto & { b: number })[] {
  const n = fin(cuantos) && cuantos > 0 ? Math.floor(cuantos) : 0;
  const lista = Array.isArray(bloques) ? bloques : [];
  // Las formas: las cosas a rodear (por fuera) o el borde del bloque (por dentro: la caja achicada, rodeada a 2 px).
  const formas: { caja: Caja; separacion: number; b: number }[] = [];
  lista.forEach((b, k) => {
    if (!b || b.entera || !cajaVale(b.caja)) return;
    const marcos = (Array.isArray(b.marcos) ? b.marcos : []).filter(cajaVale);
    if (marcos.length) for (const m of marcos) formas.push({ caja: m, separacion: SEPARACION, b: k });
    else {
      const d = BORDE + 2;
      const adentro = { izquierda: b.caja.izquierda + d, arriba: b.caja.arriba + d, ancho: b.caja.ancho - 2 * d, alto: b.caja.alto - 2 * d };
      if (cajaVale(adentro)) formas.push({ caja: adentro, separacion: 2, b: k });
    }
  });
  if (!n || !formas.length) return [];
  // Lo que se sale de la página (el contorno de una foto de lado a lado) queda a 4 px de su borde, por dentro.
  const izquierda = Math.min(...lista.filter((b) => b && cajaVale(b.caja)).map((b) => b.caja.izquierda));
  const derecha = Math.max(...lista.filter((b) => b && cajaVale(b.caja)).map((b) => b.caja.izquierda + b.caja.ancho));
  const adentroX = (x: number) => Math.min(derecha - 4, Math.max(izquierda + 4, x));
  const largo = formas.reduce((t, f) => t + 2 * (f.caja.ancho + f.caja.alto) + 2 * Math.PI * f.separacion, 0);
  const paso = Math.max(PASO, largo / n);
  const todos = formas.flatMap((f) => contorno(f.caja, f.separacion, paso).map((p) => ({ x: adentroX(p.x), y: p.y, b: f.b })));
  // Por el redondeo de cada forma pueden sobrar algunos: se toman parejos.
  return todos.length <= n ? todos : Array.from({ length: n }, (_, i) => todos[Math.floor((i * todos.length) / n)]);
}

/** Con qué contraste (a 1) el acento se pierde sobre un fondo (el mismo de los hilos). */
const SE_PIERDE = 1.6;
/**
 * El color de un punto: el acento o, si está sobre un bloque cuyo fondo se parece al acento, el color del texto de ese
 * bloque (como hacen los hilos y las ramas).
 */
export function colorDe(acento: string, bloques: { caja: Caja; fondo: string; texto: string }[], p: Punto): string {
  const b = (Array.isArray(bloques) ? bloques : []).find((x) => x && cajaVale(x.caja) && p.x >= x.caja.izquierda && p.x <= x.caja.izquierda + x.caja.ancho && p.y >= x.caja.arriba && p.y <= x.caja.arriba + x.caja.alto);
  return b && b.texto && contraste(acento, b.fondo) < SE_PIERDE ? b.texto : acento;
}

/**
 * A qué objetivo va cada uno de los `cuantos` puntos de la esfera: si hay menos objetivos que puntos, cada objetivo
 * recibe los suyos por turno (todos usados; los primeros, uno más si no da exacto; los que caen juntos se ven como un
 * punto más marcado); si hay más, se toman parejo por toda la lista. Sin objetivos, `null`.
 */
export function reparto(cuantos: number, objetivos: Punto[]): (Punto | null)[] {
  const n = fin(cuantos) && cuantos > 0 ? Math.floor(cuantos) : 0;
  const validos = (Array.isArray(objetivos) ? objetivos : []).filter((p): p is Punto => Boolean(p) && fin(p.x) && fin(p.y));
  const L = validos.length;
  if (!L) return Array.from({ length: n }, () => null);
  return Array.from({ length: n }, (_, i) => (L <= n ? validos[i % L] : validos[Math.floor((i * L) / n)]));
}
