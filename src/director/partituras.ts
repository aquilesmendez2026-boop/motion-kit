// Seis partituras de ejemplo: una por cada señal, y la portada, que junta dos. Son datos: se pueden guardar, copiar y
// editar. Cada una espera partes con estos nombres (`data-mk-parte`).
import type { Partitura } from "./modelo";

const SUBE = { y: 28, opacidad: 0 };

/** La entrada de un encabezado y su salida al bajar. Partes: antetitulo, titulo, bajada, botones y contenido. */
const portada: Partitura = {
  version: 1,
  nombre: "portada",
  escenas: [
    {
      con: "verse",
      pasos: [
        { actor: "antetitulo", de: SUBE, dura: 800, en: 50 },
        { actor: "titulo", por: "palabra", mascara: true, de: { y: "135%" }, dura: 800, cada: 90, en: 150 },
        { actor: "bajada", de: SUBE, dura: 800, en: 550 },
        { actor: "botones", por: "hijo", de: SUBE, dura: 700, cada: 90, en: 850 },
      ],
    },
    { con: "vista", tramo: "salida", pasos: [{ actor: "contenido", a: { y: "-14%", opacidad: 0 } }] },
  ],
};

/** Una grilla que entra de a una, después de su rótulo. Partes: rotulo y grilla (sus hijos son las tarjetas). */
const tarjetas: Partitura = {
  version: 1,
  nombre: "tarjetas",
  escenas: [
    {
      con: "verse",
      repetir: true,
      pasos: [
        { actor: "rotulo", por: "letra", de: { y: 14, opacidad: 0 }, dura: 420, cada: 24 },
        { actor: "grilla", por: "hijo", de: { y: 36, escala: 0.94, opacidad: 0 }, curva: "resorte", cada: 80, junto: 200 },
        { actor: "nota", de: { opacidad: 0 }, dura: 500, luego: 100 },
      ],
    },
  ],
};

/** Capas que se mueven distinto al cruzar la pantalla, y una frase que se enciende palabra por palabra. Partes: fondo, medio, frente y frase. */
const paralaje: Partitura = {
  version: 1,
  nombre: "paralaje",
  escenas: [
    {
      con: "vista",
      tramo: "paso",
      pasos: [
        { actor: "fondo", de: { y: 60, escala: 1.15 }, a: { y: -60, escala: 1.15 } },
        { actor: "medio", de: { y: 110 }, a: { y: -110 } },
        { actor: "frente", de: { y: -30, giro: -3 }, a: { y: 30, giro: 3 } },
        { actor: "frase", por: "palabra", de: { opacidad: 0.15 }, a: { opacidad: 1 }, entre: [0.25, 0.6] },
      ],
    },
  ],
};

/** Una tarjeta que sigue al cursor, con su brillo al revés. Partes: tarjeta y brillo. */
const iman: Partitura = {
  version: 1,
  nombre: "iman",
  escenas: [
    {
      con: "puntero",
      pasos: [
        { actor: "tarjeta", a: { x: 16, y: 12, giro: 2 }, resorte: "elastico" },
        { actor: "brillo", a: { x: -40, y: -30, opacidad: 0.4 }, resorte: "suave" },
      ],
    },
  ],
};

/**
 * Bloques que se inclinan con la velocidad del scroll y vuelven solos, y una barra que avanza con la página. Partes:
 * izquierda, centro, derecha y avance (la barra, dentro de una caja que la recorta).
 */
const inercia: Partitura = {
  version: 1,
  nombre: "inercia",
  escenas: [
    {
      con: "velocidad",
      pasos: [
        { actor: "izquierda", a: { giro: -5, y: 18 }, resorte: "suave" },
        { actor: "centro", a: { y: 30, escala: 0.94 }, resorte: "elastico" },
        { actor: "derecha", a: { giro: 5, y: 18 }, resorte: "suave" },
      ],
    },
    { con: "scroll", pasos: [{ actor: "avance", de: { x: "-100%" }, a: { x: "0%" } }] },
  ],
};

/** Un botón que se levanta al apuntarlo y se hunde al apretarlo. Partes: boton y cara (adentro del botón). */
const boton: Partitura = {
  version: 1,
  nombre: "boton",
  escenas: [
    { con: "estado", estado: "apuntado", pasos: [{ actor: "boton", a: { y: -3, escala: 1.05 }, dura: 180, curva: "resorte" }] },
    { con: "estado", estado: "apretado", sobre: "boton", pasos: [{ actor: "cara", a: { escala: 0.95, opacidad: 0.8 }, dura: 90 }] },
  ],
};

export const PARTITURAS = { portada, tarjetas, paralaje, iman, inercia, boton } as const;
export type PartituraDeEjemplo = keyof typeof PARTITURAS;
