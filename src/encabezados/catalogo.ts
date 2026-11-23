import type { EstiloId } from "../estilos/estilos";

export type ComposicionId =
  | "centrado" | "izquierda" | "dividido" | "gigante" | "tarjeta" | "imagen"
  | "letrero" | "poster" | "boleto" | "pantalla" | "vinetas" | "marquesina";

export type EntradaId = "ninguna" | "cascada" | "deslizar" | "zoom" | "foco" | "telon" | "golpe";

export const COMPOSICIONES: Record<ComposicionId, { nombre: string; descripcion: string; usaImagen: boolean; estilos: EstiloId[] }> = {
  centrado: { nombre: "Centrado", descripcion: "Todo al centro, sobre el efecto de fondo.", usaImagen: false, estilos: ["neon", "anime", "pelicula"] },
  izquierda: { nombre: "A la izquierda", descripcion: "Texto a la izquierda, el efecto respira a la derecha.", usaImagen: false, estilos: ["neon", "rock", "pelicula", "retro", "anime"] },
  dividido: { nombre: "Dividido", descripcion: "Texto a un lado y foto al otro (en celular, la foto arriba).", usaImagen: true, estilos: ["anime", "pelicula", "neon", "retro", "rock"] },
  gigante: { nombre: "Título gigante", descripcion: "El título ocupa todo el ancho; el resto va abajo en una fila.", usaImagen: false, estilos: ["rock", "pelicula", "anime"] },
  tarjeta: { nombre: "Tarjeta flotante", descripcion: "Foto de fondo y el texto en una tarjeta de vidrio.", usaImagen: true, estilos: ["neon", "anime", "pelicula"] },
  imagen: { nombre: "Foto completa", descripcion: "Foto a pantalla completa con degradado y texto abajo.", usaImagen: true, estilos: ["pelicula", "rock", "neon"] },
  letrero: { nombre: "Letrero", descripcion: "El título dentro de un marco iluminado, como un cartel.", usaImagen: false, estilos: ["neon", "retro"] },
  poster: { nombre: "Póster", descripcion: "Título apilado y datos en columna, como afiche de gira.", usaImagen: false, estilos: ["rock", "pelicula", "anime"] },
  boleto: { nombre: "Boleto", descripcion: "El texto en una entrada de cine con talón.", usaImagen: false, estilos: ["pelicula", "retro", "rock"] },
  pantalla: { nombre: "Pantalla", descripcion: "Dentro de un monitor antiguo.", usaImagen: false, estilos: ["retro", "neon"] },
  vinetas: { nombre: "Viñetas", descripcion: "Texto junto a un collage de paneles de cómic.", usaImagen: true, estilos: ["anime", "rock"] },
  marquesina: { nombre: "Marquesina", descripcion: "El título gigante corre detrás, el texto al frente.", usaImagen: false, estilos: ["rock", "neon", "anime", "retro"] },
};

export const ENTRADAS: Record<EntradaId, string> = {
  ninguna: "Sin entrada",
  cascada: "Cascada (uno tras otro)",
  deslizar: "Deslizar (texto y foto se cruzan)",
  zoom: "Zoom (la foto se acerca)",
  foco: "Foco (se enciende la luz)",
  telon: "Telón (se abre)",
  golpe: "Golpe (aparece y sacude)",
};

export const COMPOSICION_IDS = Object.keys(COMPOSICIONES) as ComposicionId[];
export const ENTRADA_IDS = Object.keys(ENTRADAS) as EntradaId[];
