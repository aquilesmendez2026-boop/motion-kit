import type { EfectoId } from "../efectos/tokens";
import type { BotonEfecto, BotonVariante } from "../piezas/Boton";
import type { TarjetaVariante } from "../piezas/Tarjeta";
import type { TransicionId } from "../piezas/transiciones";
import type { PackBotonId } from "../piezas/packs";

export type EstiloId = "neon" | "retro" | "rock" | "anime" | "pelicula";
export type SonidoId = "zumbido" | "pitido" | "golpe" | "destello" | "proyector";
export type VistaId = "fundido" | "deslizar" | "apagon" | "canal" | "corte" | "barrido" | "cine";
export type TextoEfecto = "encender" | "glitch" | "maquina" | "impacto" | "temblor" | "caer" | "trailer" | "onda" | "revelar" | "voltear" | "rebote";

export interface EstiloDef {
  id: EstiloId;
  nombre: string;
  descripcion: string;
  /** Variables CSS que fija el estilo (colores, letras, radios). */
  vars: Record<string, string>;
  /** Fuentes de Google Fonts (licencia OFL) que usa; se cargan solo con `fuentes`. */
  googleFonts: string;
  boton: { variante: BotonVariante; efecto: BotonEfecto };
  /** Pack de botones que le queda al estilo. */
  pack: PackBotonId;
  tarjeta: TarjetaVariante;
  /** Efectos protagonistas que combinan con el estilo, el primero es el sugerido. */
  efectos: EfectoId[];
  texto: TextoEfecto[];
  transicion: TransicionId;
  vista: VistaId;
  sonido: SonidoId;
}

const sans = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

export const ESTILOS: Record<EstiloId, EstiloDef> = {
  neon: {
    id: "neon",
    nombre: "Neón",
    descripcion: "Noche, letreros que se encienden y brillo eléctrico.",
    vars: {
      "--mk-fondo": "#07060f", "--mk-superficie": "#13102a", "--mk-texto": "#f4f0ff",
      "--mk-acento": "#ff3fd8", "--mk-acento-2": "#25f2ff", "--mk-sobre-acento": "#07060f",
      "--mk-fuente-titulo": `'Tilt Neon','Arial Rounded MT Bold',${sans}`, "--mk-fuente-texto": sans,
      "--mk-radio-boton": "12px", "--mk-radio-tarjeta": "16px",
    },
    googleFonts: "family=Tilt+Neon",
    boton: { variante: "contorno", efecto: "elevar" },
    pack: "neon-tubo",
    tarjeta: "borde",
    efectos: ["rejilla", "letrero", "lluvia", "estrellas", "cometas"],
    texto: ["encender", "glitch", "onda"],
    transicion: "escalar",
    vista: "apagon",
    sonido: "zumbido",
  },
  retro: {
    id: "retro",
    nombre: "Retro",
    descripcion: "Arcade de los 80: píxeles, pantalla de tubo y sombras duras.",
    vars: {
      "--mk-fondo": "#1b1135", "--mk-superficie": "#2a1c52", "--mk-texto": "#fff4d6",
      "--mk-acento": "#ffcc33", "--mk-acento-2": "#ff5e7a", "--mk-sobre-acento": "#1b1135",
      "--mk-fuente-titulo": "'Press Start 2P','VT323',ui-monospace,monospace", "--mk-fuente-texto": sans,
      "--mk-radio-boton": "0px", "--mk-radio-tarjeta": "0px",
    },
    googleFonts: "family=Press+Start+2P",
    boton: { variante: "solido", efecto: "ninguno" },
    pack: "arcade",
    tarjeta: "plana",
    efectos: ["tubo", "puntos", "estrellas", "abecedario"],
    texto: ["maquina", "caer", "onda"],
    transicion: "pasar",
    vista: "canal",
    sonido: "pitido",
  },
  rock: {
    id: "rock",
    nombre: "Rock",
    descripcion: "Fotocopia, cinta adhesiva, letras gruesas que tiemblan.",
    vars: {
      "--mk-fondo": "#121110", "--mk-superficie": "#1f1d1a", "--mk-texto": "#f2ede3",
      "--mk-acento": "#ff2b1c", "--mk-acento-2": "#ffd21f", "--mk-sobre-acento": "#121110", "--mk-acento-texto": "#ff6a5c",
      "--mk-fuente-titulo": "'Anton',Impact,'Arial Narrow Bold',sans-serif", "--mk-fuente-texto": sans,
      "--mk-radio-boton": "2px", "--mk-radio-tarjeta": "3px",
    },
    googleFonts: "family=Anton",
    boton: { variante: "solido", efecto: "relleno" },
    pack: "sello",
    tarjeta: "plana",
    efectos: ["ecualizador", "lluvia", "letrero"],
    texto: ["temblor", "impacto", "glitch"],
    transicion: "zoom",
    vista: "corte",
    sonido: "golpe",
  },
  anime: {
    id: "anime",
    nombre: "Anime",
    descripcion: "Viñetas, líneas de velocidad, trama de puntos y textos de impacto.",
    vars: {
      "--mk-fondo": "#fff8ef", "--mk-superficie": "#ffffff", "--mk-texto": "#17142a",
      "--mk-acento": "#cc1145", "--mk-acento-2": "#1aa7e6", "--mk-sobre-acento": "#ffffff",
      "--mk-fuente-titulo": "'Dela Gothic One','Arial Black',sans-serif", "--mk-fuente-texto": sans,
      "--mk-radio-boton": "14px", "--mk-radio-tarjeta": "14px",
    },
    googleFonts: "family=Dela+Gothic+One",
    boton: { variante: "solido", efecto: "elevar" },
    pack: "manga",
    tarjeta: "elevada",
    efectos: ["velocidad", "petalos", "burbujas", "abecedario"],
    texto: ["impacto", "caer", "onda"],
    transicion: "zoom",
    vista: "barrido",
    sonido: "destello",
  },
  pelicula: {
    id: "pelicula",
    nombre: "Película",
    descripcion: "Franjas de cine, grano, títulos de tráiler y fundidos a negro.",
    vars: {
      "--mk-fondo": "#0c0b0a", "--mk-superficie": "#1a1714", "--mk-texto": "#efe6d2",
      "--mk-acento": "#d9a62e", "--mk-acento-2": "#b3261e", "--mk-sobre-acento": "#0c0b0a",
      "--mk-fuente-titulo": "'Playfair Display',Didot,Georgia,serif", "--mk-fuente-texto": sans,
      "--mk-radio-boton": "2px", "--mk-radio-tarjeta": "4px",
    },
    googleFonts: "family=Playfair+Display:wght@600;800",
    boton: { variante: "contorno", efecto: "brillo" },
    pack: "ticket",
    tarjeta: "borde",
    efectos: ["grano", "niebla", "estrellas"],
    texto: ["trailer", "maquina", "encender"],
    transicion: "fundido",
    vista: "cine",
    sonido: "proyector",
  },
};

export const ESTILO_IDS = Object.keys(ESTILOS) as EstiloId[];
