// Relatos: maneras de contar la página al bajar. Cada uno es CSS ligado al scroll más esta ficha.
// Sumar uno nuevo es escribir su CSS (src/relatos/css.ts) y su ficha aquí. Sin React: lo usan la receta y el contrato.
import type { EstiloId } from "../estilos/estilos";

export type RelatoBloqueId = "escenas" | "pelicula" | "cuento" | "profundidad" | "iris" | "carrete" | "subtitulos" | "pila";
export type RelatoPaginaId = "hilo" | "luz" | "impulso" | "rulos" | "hebras" | "figura" | "rastro";
export type RelatoId = RelatoBloqueId | RelatoPaginaId;

/** Marcas que un bloque pone en sus partes (`data-mk-parte`) para que un relato las encuentre. */
export type ParteRelato = "linea" | "foto" | "tarjeta" | "frase";
export const PARTES_RELATO: ParteRelato[] = ["linea", "foto", "tarjeta", "frase"];

export interface FichaRelato {
  id: RelatoId;
  nombre: string;
  descripcion: string;
  /** De bloque (envuelve un bloque) o de página (va por detrás de todos). */
  alcance: "bloque" | "pagina";
  /** Bloques que le quedan: sugerencia para el editor y «Sorpréndeme», no prohíbe. */
  para: string[];
  /** Al menos una de estas marcas; sin ninguna, el bloque usa «escenas». [] = no necesita marcas. */
  requiere: ParteRelato[];
  /** Qué se ve en cada nivel. */
  completo: string;
  liviano: string;
  quieto: string;
  /** Alarga la página (el bloque se queda quieto mientras se baja). */
  largo: boolean;
}

/** La ficha de un hilo: los tres se dibujan al bajar y, en liviano, van enteros y quietos. */
const hilo = (id: RelatoPaginaId, nombre: string, descripcion: string, quieto: string): FichaRelato => ({ id, nombre, alcance: "pagina", para: ["pagina"], requiere: [], largo: false, descripcion, completo: "Se dibuja al bajar.", liviano: "Entero y quieto.", quieto });

export const RELATOS: Record<RelatoId, FichaRelato> = {
  escenas: {
    id: "escenas", nombre: "Escenas que aparecen", alcance: "bloque", para: ["cualquiera"], requiere: [], largo: false,
    descripcion: "Cada bloque entra al bajar, con el movimiento del estilo.",
    completo: "Cada bloque entra con la entrada del estilo.", liviano: "Igual.", quieto: "Visible, sin movimiento.",
  },
  pelicula: {
    id: "pelicula", nombre: "Película continua", alcance: "bloque", para: ["cualquiera"], requiere: [], largo: false,
    descripcion: "El encabezado se aleja como un plano que termina y cada bloque entra tras un telón del color del acento.",
    completo: "El encabezado se aleja; cada bloque entra tras un telón; cinta de avance.", liviano: "Sin telón: entrada de escenas.",
    quieto: "Visible, sin telón.",
  },
  cuento: {
    id: "cuento", nombre: "Cuento por capítulos", alcance: "bloque", para: ["historia", "clases", "eventos"], requiere: ["linea"], largo: true,
    descripcion: "El bloque se queda quieto mientras bajas y cuenta su parte línea por línea; la foto se acerca.",
    completo: "Capítulo quieto que cuenta línea por línea.", liviano: "Sin quedarse quieto: entrada de escenas.",
    quieto: "Visible, sin quedarse quieto.",
  },
  profundidad: {
    id: "profundidad", nombre: "Profundidad", alcance: "bloque", para: ["carta", "servicios"], requiere: ["tarjeta"], largo: false,
    descripcion: "Capas de formas que se mueven a distinta velocidad y tarjetas que suben en cascada.",
    completo: "Capas a distinta velocidad y tarjetas en cascada.", liviano: "Sin capas: tarjetas en cascada.", quieto: "Visible, sin capas.",
  },
  iris: {
    id: "iris", nombre: "Iris", alcance: "bloque", para: ["cualquiera"], requiere: [], largo: false,
    descripcion: "El bloque se revela desde un círculo de luz que crece, como en el cine antiguo.",
    completo: "Círculo que se abre y revela el bloque.", liviano: "Entrada de escenas.", quieto: "Visible, sin círculo.",
  },
  carrete: {
    id: "carrete", nombre: "Carrete", alcance: "bloque", para: ["galeria", "carta", "trabajos"], requiere: ["foto", "tarjeta"], largo: true,
    descripcion: "Al bajar, las fotos pasan de lado como una tira de película.",
    completo: "La tira pasa de lado con el scroll.", liviano: "Tira deslizable con el dedo.", quieto: "Tira deslizable con el dedo.",
  },
  subtitulos: {
    id: "subtitulos", nombre: "Subtítulos", alcance: "bloque", para: ["historia", "promesa"], requiere: ["frase"], largo: true,
    descripcion: "Una frase grande se enciende palabra por palabra mientras bajas.",
    completo: "La frase se enciende palabra por palabra.", liviano: "Frase entera con entrada de escenas.", quieto: "Frase entera visible.",
  },
  pila: {
    id: "pila", nombre: "Cartas apiladas", alcance: "bloque", para: ["cualquiera"], requiere: [], largo: false,
    descripcion: "Cada bloque queda pegado arriba y el siguiente sube y lo tapa, como cartas que se apilan.",
    completo: "Cada bloque queda pegado mientras el siguiente lo tapa; el tapado se achica un poco.", liviano: "Entrada de escenas.",
    quieto: "Visible, sin pegarse.",
  },
  hilo: {
    id: "hilo", nombre: "Hilo", alcance: "pagina", para: ["pagina"], requiere: [], largo: false,
    descripcion: "Una línea une los bloques mientras bajas y una luz viaja contigo.",
    completo: "La línea se dibuja y la luz viaja.", liviano: "Línea dibujada y quieta, sin luz.", quieto: "Sin línea.",
  },
  luz: {
    id: "luz", nombre: "Luz que cambia", alcance: "pagina", para: ["pagina"], requiere: [], largo: false,
    descripcion: "El cielo de la página pasa por las horas del día mientras bajas y el sol se pone.",
    completo: "El cielo cambia de hora y el sol baja.", liviano: "Cielo fijo.", quieto: "Cielo fijo.",
  },
  impulso: {
    id: "impulso", nombre: "Inclinación por velocidad", alcance: "pagina", para: ["pagina"], requiere: [], largo: false,
    descripcion: "Mientras más rápido bajas, más se inclinan los bloques; al parar vuelven a quedar derechos.",
    completo: "Los bloques se inclinan con la velocidad al bajar.", liviano: "Sin inclinación.", quieto: "Sin inclinación.",
  },
  // Los hilos (van por delante, por lo libre de cada bloque; se bajan aparte). Cada uno incluye al anterior.
  rulos: hilo("rulos", "Hilo con rulos", "Un hilo baja por la orilla y hace un rulo en cada cruce.", "Sin hilo."),
  hebras: hilo("hebras", "Hebras", "Además, se abre en hebras donde hay tarjetas y se junta.", "Sin hilo."),
  figura: hilo("figura", "Hilo que dibuja", "Además, al final dibuja una figura del rubro.", "Solo la figura."),
  rastro: hilo("rastro", "Rastro", "Huellas del rubro que aparecen por el recorrido.", "Las huellas, quietas."),
};

export const RELATO_IDS = Object.keys(RELATOS) as RelatoId[];
export const RELATOS_DE_BLOQUE = RELATO_IDS.filter((id) => RELATOS[id].alcance === "bloque") as RelatoBloqueId[];
export const RELATOS_DE_PAGINA = RELATO_IDS.filter((id) => RELATOS[id].alcance === "pagina") as RelatoPaginaId[];

/** El relato que propone cada estilo para la página. */
export const RELATO_DE_ESTILO: Record<EstiloId, RelatoBloqueId> = {
  neon: "pelicula",
  retro: "carrete",
  rock: "escenas",
  anime: "profundidad",
  pelicula: "cuento",
};

/** Las figuras que el «Hilo que dibuja» arma al final de la página (sus trazos van aparte, en `hilos/figuras.ts`). */
export type FiguraId = "taza" | "hamburguesa" | "plato" | "poste" | "tijera" | "huella" | "pesa" | "lapiz" | "bolsa" | "corazon" | "estrella";
/** La figura de cada rubro de los encabezados (`RubroId`). */
export const FIGURA_DE_RUBRO: Record<string, FiguraId> = {
  cafeteria: "taza", hamburgueseria: "hamburguesa", restaurante: "plato", barberia: "poste", peluqueria: "tijera",
  veterinaria: "huella", gimnasio: "pesa", academia: "lapiz", tienda: "bolsa", consulta: "corazon",
};
export const FIGURA_IDS: FiguraId[] = [...Object.values(FIGURA_DE_RUBRO), "estrella"];
/** La figura de un rubro; la estrella si no se conoce. */
export function figuraDeRubro(rubro: unknown): FiguraId {
  return (typeof rubro === "string" && Object.prototype.hasOwnProperty.call(FIGURA_DE_RUBRO, rubro) && FIGURA_DE_RUBRO[rubro]) || "estrella";
}
