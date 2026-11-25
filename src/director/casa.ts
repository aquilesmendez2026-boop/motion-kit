// Partituras de la casa: los movimientos de hoy escritos como datos, para elegir y combinar al crear. No reemplazan a
// las piezas que ya existen (que pesan menos para una página que solo usa una): son para el Estudio y la vitrina.
// Cada una dice qué partes (`data-mk-parte`) espera.
import type { Partitura } from "./modelo";

export interface DeLaCasa {
  id: string;
  nombre: string;
  grupo: "texto" | "encabezado" | "momento" | "especial";
  /** Las partes que mueve. Las que no estén en la página se saltan. */
  partes: string[];
  partitura: Partitura;
  /** En qué se diferencia de la pieza original, si no es igual. */
  nota?: string;
}

const una = (id: string, escenas: Partitura["escenas"]): Partitura => ({ version: 1, nombre: id, escenas });
/** Un efecto de texto: una entrada del título. */
const texto = (id: string, nombre: string, paso: Record<string, unknown>, nota?: string): DeLaCasa => ({
  id, nombre, grupo: "texto", partes: ["titulo"],
  partitura: una(id, [{ con: "verse", pasos: [{ actor: "titulo", ...paso }] }] as Partitura["escenas"]),
  ...(nota ? { nota } : {}),
});
const SUBE = { y: 20, opacidad: 0 };
const PARECIDO = "Parecido al original: el rebote lo da la curva «resorte».";

export const CASA: DeLaCasa[] = [
  // Efectos de texto (de `TextoCinetico`). Iguales al original: revelar, trailer y maquina.
  texto("revelar", "Revelar", { por: "palabra", mascara: true, de: { y: "135%" }, dura: 800, cada: 90 }),
  texto("trailer", "Tráiler", { por: "palabra", de: { escala: 1.18, opacidad: 0 }, dura: 900, cada: 300 }),
  texto("maquina", "Máquina de escribir", { por: "letra", de: { opacidad: 0 }, dura: 60, cada: 55, curva: "lineal" }, "Igual al original, sin el cursor que parpadea."),
  texto("voltear", "Voltear", { por: "letra", de: { inclinaX: -90, opacidad: 0 }, dura: 700, cada: 40 }, "Parecido al original: con la profundidad del Director."),
  texto("impacto", "Impacto", { por: "palabra", de: { escala: 2.6, opacidad: 0 }, dura: 550, cada: 160, curva: "resorte" }, PARECIDO),
  texto("rebote", "Rebote", { por: "letra", de: { escala: 0, opacidad: 0 }, dura: 600, cada: 45, curva: "resorte" }, PARECIDO),
  texto("caer", "Caer", { por: "letra", de: { y: "-120%", giro: -25, opacidad: 0 }, dura: 900, cada: 45, curva: "resorte" }, PARECIDO),

  // Entradas del encabezado.
  {
    id: "cascada", nombre: "Cascada", grupo: "encabezado", partes: ["antetitulo", "titulo", "bajada", "botones", "media"],
    partitura: una("cascada", [{ con: "verse", pasos: [
      { actor: "antetitulo", de: SUBE, dura: 800, en: 50 },
      { actor: "titulo", por: "palabra", mascara: true, de: { y: "135%" }, dura: 800, cada: 90, en: 150 },
      { actor: "media", de: { opacidad: 0 }, dura: 1000, en: 200 },
      { actor: "bajada", de: SUBE, dura: 800, en: 550 },
      { actor: "botones", de: SUBE, dura: 800, en: 850 },
    ] }]),
  },
  {
    id: "deslizar", nombre: "Deslizar", grupo: "encabezado", partes: ["antetitulo", "titulo", "bajada", "botones", "media"],
    partitura: una("deslizar", [{ con: "verse", pasos: [
      { actor: "antetitulo", de: { x: -60, opacidad: 0 }, dura: 900, en: 0 },
      { actor: "titulo", de: { x: -60, opacidad: 0 }, dura: 900, en: 100 },
      { actor: "media", de: { x: 60, opacidad: 0 }, dura: 1000, en: 150 },
      { actor: "bajada", de: { x: -60, opacidad: 0 }, dura: 900, en: 200 },
      { actor: "botones", de: { x: -60, opacidad: 0 }, dura: 900, en: 300 },
    ] }]),
  },
  {
    id: "zoom", nombre: "Zoom", grupo: "encabezado", partes: ["contenido", "media"],
    partitura: una("zoom", [{ con: "verse", pasos: [
      { actor: "media", de: { escala: 1.25 }, dura: 1800 },
      { actor: "contenido", de: { y: 30, opacidad: 0 }, dura: 1000, en: 350 },
    ] }]),
  },

  // Momentos: una grilla que entra en cadena, cada una con su carácter.
  {
    id: "sellos", nombre: "Sellos que se estampan", grupo: "momento", partes: ["grilla"],
    partitura: una("sellos", [{ con: "verse", pasos: [{ actor: "grilla", por: "hijo", de: { escala: 1.6, giro: -12, opacidad: 0 }, dura: 380, cada: 90, curva: "resorte" }] }]),
  },
  {
    id: "correo", nombre: "Novedades que llegan", grupo: "momento", partes: ["grilla"],
    partitura: una("correo", [{ con: "verse", pasos: [{ actor: "grilla", por: "hijo", de: { y: -40, giro: 6, opacidad: 0 }, dura: 600, cada: 110, curva: "resorte" }] }]),
  },
  {
    id: "domino", nombre: "Fichas de dominó", grupo: "momento", partes: ["grilla"],
    partitura: una("domino", [{ con: "verse", pasos: [{ actor: "grilla", por: "hijo", de: { inclinaX: -80, opacidad: 0 }, dura: 600, cada: 90 }] }]),
  },
  {
    id: "hojas", nombre: "Hojas que se voltean", grupo: "momento", partes: ["rotulo", "grilla"],
    partitura: una("hojas", [{ con: "verse", pasos: [
      { actor: "rotulo", por: "letra", de: { y: 14, opacidad: 0 }, dura: 420, cada: 24 },
      { actor: "grilla", por: "hijo", de: { inclinaX: 85, opacidad: 0 }, dura: 700, cada: 100, junto: 200 },
    ] }]),
  },

  // Nuevas, con la inclinación en 3D.
  {
    id: "titulo-con-volumen", nombre: "Título con volumen", grupo: "especial", partes: ["titulo"],
    partitura: una("titulo-con-volumen", [{ con: "puntero", pasos: [{ actor: "titulo", a: { inclinaX: 10, inclinaY: 14 }, resorte: "suave" }] }]),
    nota: "El volumen es un estilo de la página; la partitura da la inclinación.",
  },
  {
    id: "tarjeta-holografica", nombre: "Tarjeta holográfica", grupo: "especial", partes: ["tarjeta", "brillo"],
    partitura: una("tarjeta-holografica", [{ con: "puntero", pasos: [
      { actor: "tarjeta", a: { inclinaX: 9, inclinaY: 12 }, resorte: "firme" },
      { actor: "brillo", a: { x: -60, y: -40 }, resorte: "suave" },
    ] }]),
  },
];
