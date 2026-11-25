// El material del hilo según el estilo de la página: el mismo recorrido, dibujado con otras capas. Un tubo de luz en
// neón, dos hebras de lana que se trenzan en retro, un cable en rock, una cinta en anime y los rieles de una tira de
// película en «película». Sin estilo del kit (La Mente), una línea. Cada capa va a lo más a 3,25 px del centro del
// hilo, para que el material no pise el contenido que el recorrido esquiva. Puro, sin navegador.
import type { Punto } from "./geometria";

export type MaterialId = "linea" | "tubo" | "lana" | "cable" | "cinta" | "rieles";

/** Una capa del material: una línea al lado del recorrido (`lado`, en px; con `onda` se aleja y se acerca). */
export interface Capa {
  grosor: number;
  lado?: number;
  onda?: number;
  /** Cada cuántos px se repite la onda. */
  periodo?: number;
  /** Media vuelta de diferencia con la otra hebra (para que se trencen). */
  fase?: number;
  /** De qué color: el del hilo, uno más claro, uno oscuro (el fondo de la página) o blanco. */
  tinta: "hilo" | "claro" | "fondo" | "blanco";
  opacidad?: number;
}

export const MATERIALES: Record<MaterialId, Capa[]> = {
  linea: [{ grosor: 3, tinta: "hilo" }],
  // Un halo ancho y suave, y adentro un núcleo claro.
  tubo: [{ grosor: 6, tinta: "hilo", opacidad: 0.3 }, { grosor: 2.2, tinta: "claro" }],
  // Dos hebras que se trenzan.
  lana: [
    { grosor: 2, lado: 1.1, onda: 1.1, periodo: 20, tinta: "hilo" },
    { grosor: 2, lado: -1.1, onda: 1.1, periodo: 20, fase: Math.PI, tinta: "claro" },
  ],
  // Un cable: grueso, con el alma oscura.
  cable: [{ grosor: 4.5, tinta: "hilo" }, { grosor: 1.6, tinta: "fondo" }],
  // Una cinta, con su brillo al medio.
  cinta: [{ grosor: 5, tinta: "hilo" }, { grosor: 1.4, tinta: "blanco", opacidad: 0.8 }],
  // La tira de una película: una banda suave entre dos rieles.
  rieles: [{ grosor: 5.5, tinta: "hilo", opacidad: 0.18 }, { grosor: 1.3, lado: 2.6, tinta: "hilo" }, { grosor: 1.3, lado: -2.6, tinta: "hilo" }],
};

const DE_ESTILO: Record<string, MaterialId> = { neon: "tubo", retro: "lana", rock: "cable", anime: "cinta", pelicula: "rieles" };
/** El material de un estilo del kit (`data-mk-estilo`); sin estilo, una línea. */
export function materialDe(estilo: unknown): MaterialId {
  return (typeof estilo === "string" && Object.prototype.hasOwnProperty.call(DE_ESTILO, estilo) && DE_ESTILO[estilo]) || "linea";
}

/**
 * Una línea al lado de `puntos`, a `lado` px (positivo: a la derecha de hacia donde va). Con `onda`, la distancia sube
 * y baja (una vuelta cada `periodo` px de recorrido), como una hebra que se trenza con otra.
 */
export function paralela(puntos: Punto[], lado: number, onda = 0, periodo = 24, fase = 0): Punto[] {
  if (puntos.length < 2) return puntos.map((p) => ({ ...p }));
  let recorrido = 0;
  return puntos.map((p, i) => {
    const [a, b] = [puntos[Math.max(0, i - 1)], puntos[Math.min(puntos.length - 1, i + 1)]];
    if (i > 0) recorrido += Math.hypot(p.x - puntos[i - 1].x, p.y - puntos[i - 1].y);
    const [dx, dy] = [b.x - a.x, b.y - a.y];
    const largo = Math.hypot(dx, dy);
    if (!(largo > 1e-6)) return { ...p };
    const d = lado + onda * Math.sin((recorrido / periodo) * 2 * Math.PI + fase);
    return { x: p.x - (dy / largo) * d, y: p.y + (dx / largo) * d };
  });
}
