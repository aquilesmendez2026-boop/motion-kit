// Rastro: huellas que van apareciendo por el recorrido del hilo, según el rubro (patitas en la veterinaria, granos en
// la cafetería, puntadas en la peluquería…). Van una tras otra, alternando el lado, mirando hacia donde van. Donde hay
// poco lugar se achican; donde no cabe ni una chica, no van. Solo aparecen (opacidad): no hay línea que dibujar.
// Puro, sin navegador.
import type { FiguraId } from "../catalogo";
import { HOLGURA, contraste, scrollDe, trazarHilos, type Caja, type Medidas, type Punto } from "./trazar";

export type FormaRastro = "patita" | "grano" | "sesamo" | "pisada" | "puntada" | "corazon" | "estrella";
/** Cada cuántos px de recorrido va una huella. */
export const PASO_RASTRO = 22;
/** El radio de una huella a tamaño completo (las formas caben en ±6). */
export const RADIO_RASTRO = 6;
/** Cuánto se corre cada huella hacia su lado del recorrido. */
const CORRE = 4;
const CHICA = 0.45;

const estrella = () => {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 ? 2.3 : 5.6;
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  });
  return `M${p.join("L")}Z`;
};
/** Las formas, apuntando hacia arriba, dentro de ±6. */
export const FORMAS_RASTRO: Record<FormaRastro, string> = {
  patita: "M-3,2.2a3,2.6 0 1,0 6,0a3,2.6 0 1,0 -6,0ZM-4.6,-2.4a1.4,1.7 0 1,0 2.8,0a1.4,1.7 0 1,0 -2.8,0ZM-1.4,-4.4a1.4,1.7 0 1,0 2.8,0a1.4,1.7 0 1,0 -2.8,0ZM1.8,-2.4a1.4,1.7 0 1,0 2.8,0a1.4,1.7 0 1,0 -2.8,0Z",
  // Un grano de café: dos mitades llenas con su surco al medio.
  grano: "M-0.35,-5.4C-4.8,-4.8 -4.8,4.8 -0.35,5.4C-1,1.8 -1,-1.8 -0.35,-5.4ZM0.35,-5.4C4.8,-4.8 4.8,4.8 0.35,5.4C1,1.8 1,-1.8 0.35,-5.4Z",
  sesamo: "M0,-4.6C2.6,-4.6 2.6,4.6 0,4.6C-2.6,4.6 -2.6,-4.6 0,-4.6Z",
  pisada: "M-2.6,-1C-3,-5.6 2.8,-6 2.6,-1.4C2.4,1 -2.4,1.2 -2.6,-1ZM-2,2.4C-2,5.6 2,5.6 2,2.4C2,1.6 -2,1.6 -2,2.4Z",
  puntada: "M-1.1,-5H1.1V5H-1.1Z",
  corazon: "M0,4.8C-6,0.6 -4.6,-5.2 0,-2.4C4.6,-5.2 6,0.6 0,4.8Z",
  estrella: estrella(),
};
const DE_FIGURA: Record<string, FormaRastro> = {
  taza: "grano", hamburguesa: "sesamo", plato: "pisada", poste: "pisada", tijera: "puntada", huella: "patita",
  pesa: "pisada", lapiz: "puntada", bolsa: "pisada", corazon: "corazon", estrella: "estrella",
};
/** La forma de las huellas según la figura del rubro (`figuraDeRubro`); una estrellita si no se conoce. */
export function formaDeRastro(figura: unknown): FormaRastro {
  return (typeof figura === "string" && Object.prototype.hasOwnProperty.call(DE_FIGURA, figura) && DE_FIGURA[figura]) || "estrella";
}

export interface Huella extends Punto {
  /** Hacia dónde mira, en grados (0: arriba; 180: abajo). */
  giro: number;
  /** De qué lado del recorrido va: -1 o 1 (izquierda, derecha). */
  lado: number;
  /** De 0,45 a 1: más chica donde hay poco lugar. */
  tamano: number;
  /** En qué parte del scroll aparece (0 a 100). */
  en: number;
  color?: string;
}
export interface OpcionesRastro {
  semilla: string;
  acento: string;
  figura?: FiguraId;
}

/** A cuánto queda un punto de una caja (0 si está adentro). */
const lejosDe = (p: Punto, c: Caja) => Math.hypot(Math.max(c.izquierda - p.x, 0, p.x - (c.izquierda + c.ancho)), Math.max(c.arriba - p.y, 0, p.y - (c.arriba + c.alto)));

/** Las huellas de una página con esas medidas. Nunca lanza. */
export function trazarRastro(m: Medidas, o: OpcionesRastro): { forma: FormaRastro; huellas: Huella[] } {
  const forma = formaDeRastro(o.figura);
  const huellas: Huella[] = [];
  const { tramos } = trazarHilos(m, { tipo: "rulos", rulos: false, semilla: o.semilla, acento: o.acento });
  if (!tramos.length) return { forma, huellas };
  const bloques = (Array.isArray(m.bloques) ? m.bloques : []).filter((b) => b && b.caja);
  const cajas: Caja[] = bloques.flatMap((b) => [...(Array.isArray(b.cosas) ? b.cosas : []), ...(Array.isArray(b.tarjetas) ? b.tarjetas : [])]);
  /** El radio que cabe en ese punto (sin pisar el contenido ni salir de la página). */
  const cabe = (p: Punto) => Math.min(RADIO_RASTRO, p.x, m.ancho - p.x, p.y, m.alto - p.y, ...cajas.map((c) => lejosDe(p, c) - HOLGURA));
  let lado = 1;
  for (const t of tramos) {
    // Se camina el tramo y se deja una huella cada PASO_RASTRO px.
    let falta = PASO_RASTRO / 2;
    for (let i = 1; i < t.puntos.length; i++) {
      const [a, b] = [t.puntos[i - 1], t.puntos[i]];
      const largo = Math.hypot(b.x - a.x, b.y - a.y);
      let hecho = 0;
      while (largo > 0 && hecho + falta <= largo) {
        hecho += falta;
        falta = PASO_RASTRO;
        const k = hecho / largo;
        const [dx, dy] = [(b.x - a.x) / largo, (b.y - a.y) / largo];
        const centro = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
        // Pie izquierdo, pie derecho: corrida hacia su lado; si ahí no cabe, en el medio.
        let p = { x: centro.x - dy * CORRE * lado, y: centro.y + dx * CORRE * lado };
        let r = cabe(p);
        if (r / RADIO_RASTRO < CHICA) {
          p = centro;
          r = cabe(p);
        }
        const tamano = r / RADIO_RASTRO;
        if (tamano >= CHICA) {
          const giro = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
          huellas.push({ x: p.x, y: p.y, giro, lado, tamano: Math.min(1, tamano), en: scrollDe(p.y, m), ...(t.color ? { color: t.color } : {}) });
        }
        lado = -lado;
      }
      falta -= largo - hecho;
    }
  }
  // Aparecen en el orden en que se camina.
  for (let i = 1; i < huellas.length; i++) huellas[i].en = Math.max(huellas[i].en, huellas[i - 1].en);
  return { forma, huellas };
}
