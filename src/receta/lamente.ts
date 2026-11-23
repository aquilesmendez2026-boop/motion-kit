// Puente con los temas y paletas de La Mente: el encabezado de motion-kit toma los colores de la paleta y la letra,
// las mayúsculas y las esquinas del tema, igual que `TemaPagina` del front de La Mente. Así combina con el resto de la
// página. El estilo de motion-kit queda de base: formas de los botones, efectos y movimiento.
//
// Copia de lamente-front/packages/ui/src/paletas.ts y temas.ts (23-11-2026). La prueba `pruebas/lamente.test.ts` la
// compara con esos archivos y con lamente-backend/contrato/diseno.json cuando están al lado de este repo.
import type { EstiloId } from "../estilos/estilos";

export type ColorLaMente = "fondo" | "superficie" | "texto" | "textoSuave" | "acento" | "sobreAcento" | "borde";

export const PALETAS_LAMENTE = {
  clasica: { nombre: "Clásica", colores: { fondo: "#ffffff", superficie: "#f4f4f5", texto: "#09090b", textoSuave: "#52525b", acento: "#09090b", sobreAcento: "#ffffff", borde: "#e4e4e7" } },
  arena: { nombre: "Arena", colores: { fondo: "#fbf7f0", superficie: "#f3ebdd", texto: "#2b2118", textoSuave: "#5f5243", acento: "#8a5a2b", sobreAcento: "#ffffff", borde: "#e6d9c4" } },
  bosque: { nombre: "Bosque", colores: { fondo: "#f3f7f2", superficie: "#e4eee2", texto: "#14261a", textoSuave: "#43584a", acento: "#2f6b3f", sobreAcento: "#ffffff", borde: "#cfdfcc" } },
  oceano: { nombre: "Océano", colores: { fondo: "#f2f7fb", superficie: "#e1edf6", texto: "#0f2233", textoSuave: "#3e5568", acento: "#1d5f8a", sobreAcento: "#ffffff", borde: "#cbdceb" } },
  terracota: { nombre: "Terracota", colores: { fondo: "#fdf5f1", superficie: "#f7e6dd", texto: "#2e1610", textoSuave: "#6a4337", acento: "#b04a2a", sobreAcento: "#ffffff", borde: "#eed3c6" } },
  ciruela: { nombre: "Ciruela", colores: { fondo: "#f8f3f8", superficie: "#eee2ef", texto: "#2a1330", textoSuave: "#5d4562", acento: "#7a3b86", sobreAcento: "#ffffff", borde: "#e0cfe2" } },
  noche: { nombre: "Noche", colores: { fondo: "#111418", superficie: "#1b2027", texto: "#f1f3f5", textoSuave: "#a9b1bc", acento: "#f2c14e", sobreAcento: "#1a1a1a", borde: "#2c333d" } },
  menta: { nombre: "Menta", colores: { fondo: "#f1faf7", superficie: "#ddf1ea", texto: "#0f2a23", textoSuave: "#3f5f56", acento: "#127a64", sobreAcento: "#ffffff", borde: "#c6e5da" } },
  neon: { nombre: "Neón", colores: { fondo: "#0b0a12", superficie: "#16131f", texto: "#f5f3ff", textoSuave: "#b6aecf", acento: "#ff3fd8", sobreAcento: "#0b0a12", borde: "#2c2742" } },
  papel: { nombre: "Papel", colores: { fondo: "#f7f2e8", superficie: "#ede5d4", texto: "#1f1b16", textoSuave: "#5a5145", acento: "#b23a0e", sobreAcento: "#ffffff", borde: "#d9cdb6" } },
  rock: { nombre: "Rock", colores: { fondo: "#0e0e0e", superficie: "#1a1a1a", texto: "#f2f2f2", textoSuave: "#a8a8a8", acento: "#d90429", sobreAcento: "#ffffff", borde: "#2e2e2e" } },
  rustico: { nombre: "Rústico", colores: { fondo: "#f3eadb", superficie: "#e7d9c1", texto: "#2a1d12", textoSuave: "#5c4836", acento: "#7a461b", sobreAcento: "#ffffff", borde: "#d3bf9f" } },
} as const satisfies Record<string, { nombre: string; colores: Record<ColorLaMente, string> }>;

export type PaletaLaMente = keyof typeof PALETAS_LAMENTE;

/** La forma de un tema de La Mente (letra de los títulos, mayúsculas, esquinas, brillo). */
export interface FormaTemaLaMente {
  fuenteTitulo: string;
  /** Familia en Google Fonts (`Anton`, `Caveat:wght@700`). */
  fuente: string;
  mayusculas?: boolean;
  espaciado?: string;
  peso?: number;
  radio: string;
  redondo: string;
  brillo?: boolean;
}

interface DefTemaLaMente {
  nombre: string;
  premium: boolean;
  /** La paleta con que se ve mejor (el editor de La Mente la propone). */
  paleta: PaletaLaMente;
  estilo?: FormaTemaLaMente;
}

export const TEMAS_LAMENTE = {
  clasico: { nombre: "Clásico", premium: false, paleta: "clasica" },
  papel: { nombre: "Papel", premium: true, paleta: "papel", estilo: { fuenteTitulo: "'Fraunces', Georgia, serif", fuente: "Fraunces:opsz,wght@9..144,800", peso: 800, espaciado: "-0.01em", radio: "3px", redondo: "3px" } },
  rock: { nombre: "Rock", premium: true, paleta: "rock", estilo: { fuenteTitulo: "'Anton', Impact, 'Arial Narrow', sans-serif", fuente: "Anton", peso: 400, mayusculas: true, espaciado: "0.02em", radio: "0px", redondo: "0px" } },
  rustico: { nombre: "Rústico", premium: true, paleta: "rustico", estilo: { fuenteTitulo: "'Zilla Slab', Rockwell, Georgia, serif", fuente: "Zilla+Slab:wght@700", peso: 700, radio: "6px", redondo: "9999px" } },
  neon: { nombre: "Neón", premium: true, paleta: "neon", estilo: { fuenteTitulo: "'Tilt Neon', system-ui, sans-serif", fuente: "Tilt+Neon", peso: 400, radio: "14px", redondo: "9999px", brillo: true } },
  mano: { nombre: "Hecho a mano", premium: true, paleta: "arena", estilo: { fuenteTitulo: "'Caveat', 'Comic Sans MS', cursive", fuente: "Caveat:wght@700", peso: 700, radio: "18px", redondo: "9999px" } },
  retro: { nombre: "Retro 70", premium: true, paleta: "terracota", estilo: { fuenteTitulo: "'Shrikhand', Georgia, serif", fuente: "Shrikhand", peso: 400, radio: "28px", redondo: "9999px" } },
  bruto: { nombre: "Neobrutalismo", premium: true, paleta: "clasica", estilo: { fuenteTitulo: "'Archivo Black', 'Arial Black', sans-serif", fuente: "Archivo+Black", peso: 400, mayusculas: true, espaciado: "-0.01em", radio: "0px", redondo: "0px" } },
  deco: { nombre: "Art déco", premium: true, paleta: "noche", estilo: { fuenteTitulo: "'Poiret One', 'Futura', sans-serif", fuente: "Poiret+One", peso: 400, mayusculas: true, espaciado: "0.1em", radio: "0px", redondo: "0px" } },
  andino: { nombre: "Textil andino", premium: true, paleta: "terracota", estilo: { fuenteTitulo: "'Outfit', 'Inter', system-ui, sans-serif", fuente: "Outfit:wght@900", peso: 900, radio: "8px", redondo: "9999px" } },
  hamburgueseria: { nombre: "Hamburguesería", premium: true, paleta: "noche", estilo: { fuenteTitulo: "'Lilita One', 'Arial Rounded MT Bold', sans-serif", fuente: "Lilita+One", peso: 400, espaciado: "0.01em", radio: "18px", redondo: "9999px" } },
  peruano: { nombre: "Peruano", premium: true, paleta: "terracota", estilo: { fuenteTitulo: "'Alfa Slab One', Rockwell, serif", fuente: "Alfa+Slab+One", peso: 400, radio: "6px", redondo: "9999px" } },
} as const satisfies Record<string, DefTemaLaMente>;

export type TemaLaMente = keyof typeof TEMAS_LAMENTE;
export const TEMA_LAMENTE_IDS = Object.keys(TEMAS_LAMENTE) as TemaLaMente[];
export const PALETA_LAMENTE_IDS = Object.keys(PALETAS_LAMENTE) as PaletaLaMente[];

/**
 * El estilo de motion-kit que se propone como base para cada tema (formas de botones, efectos, movimiento). Es una
 * propuesta: la receta puede traer otro estilo y el puente lo respeta.
 */
export const BASE_DE_TEMA: Record<TemaLaMente, EstiloId> = {
  clasico: "pelicula",
  papel: "pelicula",
  rock: "rock",
  rustico: "pelicula",
  neon: "neon",
  mano: "anime",
  retro: "retro",
  bruto: "retro",
  deco: "pelicula",
  andino: "anime",
  hamburgueseria: "neon",
  peruano: "anime",
};

// --- Color ---------------------------------------------------------------------------------------------------------

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const aHex = (c: number[]) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
/** Mezcla dos colores `#rrggbb`: `peso` es cuánto de `a` (0 a 1). */
export const mezclar = (a: string, b: string, peso: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  return aHex(x.map((v, i) => v * peso + y[i] * (1 - peso)));
};
/** Luminancia relativa WCAG. */
export function luminancia(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Razón de contraste WCAG, de 1 a 21. */
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export const esHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

// --- El puente -----------------------------------------------------------------------------------------------------

const TITULO_CLASICO = "'Outfit', 'Inter', system-ui, sans-serif";
const TEXTO_LAMENTE = "'Inter', system-ui, sans-serif";

export interface PuenteLaMente {
  /** El estilo base de motion-kit. */
  estilo: EstiloId;
  /** Variables CSS que pisa: pásalas a `<Estilo colores={…}>` (o usa `EstiloLaMente`). */
  colores: Record<string, string>;
  /** Para cargar la letra del tema: `https://fonts.googleapis.com/css2?{googleFonts}&display=swap`. */
  googleFonts: string;
  /** Los títulos brillan con el acento (tema neón). */
  brillo: boolean;
  /** La paleta es clara (fondo con luminancia sobre 0,5). */
  claro: boolean;
}

/**
 * Pasa un tema y una paleta de La Mente a motion-kit: el estilo base y las variables que pisa (fondo, superficie,
 * texto, acentos, letras, mayúsculas, peso y radios). `base` fuerza el estilo (por ejemplo, el de la receta).
 * Un tema o una paleta que no existen caen al clásico y a la clásica, como en La Mente.
 */
export function estiloDesdeLaMente({ tema, paleta, base }: { tema?: string; paleta?: string; base?: EstiloId }): PuenteLaMente {
  const t: TemaLaMente = tema && Object.prototype.hasOwnProperty.call(TEMAS_LAMENTE, tema) ? (tema as TemaLaMente) : "clasico";
  const def: DefTemaLaMente = TEMAS_LAMENTE[t];
  const p: PaletaLaMente = paleta && Object.prototype.hasOwnProperty.call(PALETAS_LAMENTE, paleta) ? (paleta as PaletaLaMente) : def.paleta;
  const c = PALETAS_LAMENTE[p].colores;
  const f = def.estilo;
  // El acento como texto (antetítulo, precios) solo si se lee sobre el fondo; si no, el texto de siempre.
  const acentoTexto = contraste(c.acento, c.fondo) >= 4.5 ? c.acento : c.texto;
  return {
    estilo: base ?? BASE_DE_TEMA[t],
    colores: {
      "--mk-fondo": c.fondo,
      "--mk-superficie": c.superficie,
      "--mk-texto": c.texto,
      "--mk-texto-suave": c.textoSuave,
      "--mk-borde": c.borde,
      "--mk-acento": c.acento,
      "--mk-acento-2": mezclar(c.acento, c.texto, 0.55),
      "--mk-sobre-acento": c.sobreAcento,
      "--mk-acento-texto": acentoTexto,
      "--mk-fuente-titulo": f?.fuenteTitulo ?? TITULO_CLASICO,
      "--mk-fuente-texto": TEXTO_LAMENTE,
      "--mk-radio-boton": f?.redondo ?? "9999px",
      "--mk-radio-tarjeta": f?.radio ?? "12px",
      "--lm-titulo-mayusculas": f?.mayusculas ? "uppercase" : "none",
      "--lm-titulo-espaciado": f?.espaciado ?? "normal",
      "--lm-titulo-peso": String(f?.peso ?? 800),
    },
    googleFonts: [`family=${f?.fuente ?? "Outfit:wght@800"}`, "family=Inter:wght@400;600"].join("&"),
    brillo: Boolean(f?.brillo),
    claro: luminancia(c.fondo) > 0.5,
  };
}
