// Enredadera: el hilo como un tallo. Va por el mismo recorrido que el hilo con rulos (los rulos son sus zarcillos), le
// brotan hojas a medida que se baja, alternando el lado y apuntando hacia donde crece, y al final se abre una flor.
// Donde hay poco lugar las hojas se achican o se pegan más al tallo; donde no cabe ni una chica, no van. Nunca pisan
// el contenido ni la flor. Puro, sin navegador.
import { HOLGURA, azar, numeroDe, trazarHilos, type Caja, type Flor, type Medidas, type Punto, type Trazado } from "./trazar";

/** El largo de una hoja a tamaño completo, de su base (en el tallo) a su punta. */
export const LARGO_HOJA = 13;
/** Cuánto lugar pide una hoja a cada lado de su eje (su mitad más ancha, con un poco de juego). */
export const ANCHO_HOJA = 4.5;
/** Cada cuántos px de tallo brota una hoja (alguna falta, según la semilla). */
export const PASO_HOJA = 30;
/** La hoja, apuntando hacia arriba desde su base en (0, 0). */
export const FORMA_HOJA = "M0,0C-4.5,-3 -4.5,-10 0,-13C4.5,-10 4.5,-3 0,0Z";
/** Un pétalo de 20 de largo, apuntando hacia arriba desde el centro de la flor (se escala a su radio). */
export const FORMA_PETALO = "M0,0C-9,-5 -9,-17 0,-20C9,-17 9,-5 0,0Z";

/**
 * Cuánto se pliegan las hojas con el viento del scroll, a lo más (grados), y cuánto rebotan hacia afuera al soltar.
 * Plegadas no se acercan al contenido; en el rebote la punta se corre menos que la holgura.
 */
export const TOPE_MECE = 20;
export const REBOTE = 2;
/** Cuánto se abre la hoja del tallo (grados): primero lo más abierto; si no cabe, más pegada. */
const ABIERTAS = [40, 30, 20];
const TAMANOS = [1, 0.8, 0.65, 0.5];
/** Cuánto dura en brotar una hoja del final (la que crece con el tallo hacia la flor), en ms. */
const BROTA = 350;

export interface Hoja extends Punto {
  /** Hacia dónde apunta, en grados (0: arriba; 180: abajo). */
  giro: number;
  /** De qué lado del tallo va: -1 o 1. */
  lado: number;
  /** De 0,5 a 1. */
  tamano: number;
  /** En qué parte del scroll brota (0 a 100). Las del final van con `tiempo`. */
  en: number;
  /**
   * Cuánto se mece cuando se baja rápido: de -1 a 1 (nunca menos de la mitad). El signo la pliega hacia el tallo: con
   * el viento se cierra, nunca se abre hacia el contenido.
   */
  mece: number;
  color?: string;
  /** Las del final no siguen al scroll: brotan cuando el tallo pasa por ahí (ms, desde que el remate se ve). */
  tiempo?: { espera: number; dura: number };
}
export interface OpcionesEnredadera {
  semilla: string;
  acento: string;
}

const lejosDe = (p: Punto, c: Caja) => Math.hypot(Math.max(c.izquierda - p.x, 0, p.x - (c.izquierda + c.ancho)), Math.max(c.arriba - p.y, 0, p.y - (c.arriba + c.alto)));

/** El tallo, las hojas y la flor de una página con esas medidas. Nunca lanza. */
export function trazarEnredadera(m: Medidas, o: OpcionesEnredadera): { trazado: Trazado; hojas: Hoja[] } {
  const trazado = trazarHilos(m, { tipo: "enredadera", semilla: o.semilla, acento: o.acento });
  const hojas: Hoja[] = [];
  if (!trazado.tramos.length) return { trazado, hojas };
  const sal = numeroDe(typeof o.semilla === "string" ? o.semilla : "") % 9973;
  const al = (i: number) => azar(i + 500, sal);
  const cajas: Caja[] = (Array.isArray(m.bloques) ? m.bloques : []).filter((b) => b && b.caja).flatMap((b) => [...(Array.isArray(b.cosas) ? b.cosas : []), ...(Array.isArray(b.tarjetas) ? b.tarjetas : [])]);
  const flor: Flor | undefined = trazado.flor;
  /**
   * Si una hoja con esa base, ese giro y ese tamaño cabe: todo su eje, con su ancho y `holgura`, lejos del contenido, y
   * dentro de la página y fuera de la flor.
   */
  const cabe = (base: Punto, giro: number, tamano: number, holgura = HOLGURA) => {
    const g = (giro * Math.PI) / 180;
    const ancho = ANCHO_HOJA * tamano;
    for (let k = 1; k <= 20; k++) {
      const t = (0.15 + (0.85 * k) / 20) * LARGO_HOJA * tamano;
      const p = { x: base.x + Math.sin(g) * t, y: base.y - Math.cos(g) * t };
      if (!(p.x >= ancho && p.x <= m.ancho - ancho && p.y >= ancho && p.y <= m.alto - ancho)) return false;
      if (flor && !(Math.hypot(p.x - flor.x, p.y - flor.y) >= flor.radio + ancho)) return false;
      for (const c of cajas) if (!(lejosDe(p, c) >= ancho + holgura)) return false;
    }
    return true;
  };
  let lado = 1;
  let n = 0;
  /** Lo que falta caminar hasta la próxima hoja (sigue de un tramo al otro: el tallo es uno). */
  let falta = PASO_HOJA / 2;
  for (const t of trazado.tramos) {
    const total = t.puntos.slice(1).reduce((s, q, k) => s + Math.hypot(q.x - t.puntos[k].x, q.y - t.puntos[k].y), 0);
    let caminado = 0;
    for (let i = 1; i < t.puntos.length; i++) {
      const [a, b] = [t.puntos[i - 1], t.puntos[i]];
      const largo = Math.hypot(b.x - a.x, b.y - a.y);
      let hecho = 0;
      while (largo > 0 && hecho + falta <= largo) {
        hecho += falta;
        falta = PASO_HOJA;
        n++;
        const [dx, dy] = [(b.x - a.x) / largo, (b.y - a.y) / largo];
        const base = { x: a.x + dx * hecho, y: a.y + dy * hecho };
        const tallo = (Math.atan2(dx, -dy) * 180) / Math.PI;
        // Una de cada siete, más o menos, no brota: así no se ve hecha en serie.
        if (al(n * 5) >= 0.15) {
          const juego = (al(n * 5 + 1) - 0.5) * 10;
          let puesta: { giro: number; tamano: number; fuerza: number } | null = null;
          for (const tamano of TAMANOS) {
            for (const abierta of ABIERTAS) {
              const giro = tallo + lado * (abierta + juego);
              // Plegada al máximo, nunca pasa al otro lado del tallo (no se pliega más de lo que está abierta).
              const fuerza = Math.min(0.5 + 0.5 * al(n * 5 + 2), (abierta + juego) / TOPE_MECE);
              // Quieta cabe con su holgura; mecida (plegada del todo o en su rebote), sin tocar nada.
              if (cabe(base, giro, tamano) && cabe(base, giro - lado * fuerza * TOPE_MECE, tamano, 0) && cabe(base, giro + lado * fuerza * REBOTE, tamano, 0)) {
                puesta = { giro, tamano, fuerza };
                break;
              }
            }
            if (puesta) break;
          }
          if (puesta) {
            // Brota cuando el tallo pasa por su base: el tramo se dibuja de punta a punta entre `desde` y `hasta` (y la
            // hoja tarda 2 puntos del scroll en brotar: a lo más en el 98, termina al terminar de bajar).
            const en = t.tiempo ? 100 : Math.min(98, t.desde + ((t.hasta - t.desde) * (caminado + hecho)) / Math.max(1, total));
            const hoja: Hoja = { ...base, giro: ((puesta.giro % 360) + 360) % 360, lado, tamano: puesta.tamano, en, mece: -lado * puesta.fuerza, ...(t.color ? { color: t.color } : {}) };
            if (t.tiempo) hoja.tiempo = { espera: Math.round(t.tiempo.espera + (t.tiempo.dura * (caminado + hecho)) / Math.max(1, total)), dura: BROTA };
            hojas.push(hoja);
          }
        }
        lado = -lado;
      }
      falta -= largo - hecho;
      caminado += largo;
    }
  }
  // Las del scroll brotan en el orden en que crece el tallo.
  let antes = 0;
  for (const h of hojas) if (!h.tiempo) antes = h.en = Math.max(h.en, antes);
  return { trazado, hojas };
}
