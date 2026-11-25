// El vocabulario del lenguaje de las partituras: las escenas y lo común al lector y al escritor. Es otra forma de
// escribir el mismo dato: nada de aquí se ejecuta.
import type { Estado, Senal, Tramo } from "../director/modelo";

/** Sin tildes, en minúsculas y con un solo espacio entre palabras: así se compara todo lo que se escribe. */
export const llano = (t: string): string =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export interface FormaEscena {
  /** Cómo se escribe (sin los dos puntos). */
  texto: string;
  con: Senal;
  repetir?: true;
  tramo?: Tramo;
}

/** Las escenas que se escriben siempre igual. Las de estado llevan además un actor: van aparte. */
export const ESCENAS: FormaEscena[] = [
  { texto: "al verse", con: "verse" },
  { texto: "cada vez que se ve", con: "verse", repetir: true },
  { texto: "al entrar a la vista", con: "vista", tramo: "entrada" },
  { texto: "al salir de la vista", con: "vista", tramo: "salida" },
  { texto: "al cruzar la pantalla", con: "vista", tramo: "paso" },
  { texto: "con la vista", con: "vista" },
  { texto: "con el scroll", con: "scroll" },
  { texto: "con el puntero", con: "puntero" },
  { texto: "con la velocidad", con: "velocidad" },
];

/** El verbo de cada estado: «al apuntar boton:». */
export const VERBO_ESTADO: Record<Estado, string> = { apuntado: "apuntar", enfocado: "enfocar", apretado: "apretar" };

/** Un número sin ruido de decimales (0.30000000000000004 → 0.3), con tres decimales a lo más. */
export const numero = (n: number): string => `${Math.round(n * 1000) / 1000 || 0}`;
