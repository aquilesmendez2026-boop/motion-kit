// La Partitura (v0, experimental): el dato que describe un movimiento. Quién se mueve (actores), con qué señal
// (escenas), qué cambia (solo posición, tamaño, giro y opacidad) y cuándo. No es código: no tiene ciclos, funciones
// ni direcciones, y trae topes. La hace correr el Director (montar.ts).

export const VERSION_PARTITURA = 0;

/** Con qué se mueve una escena. */
export const SENALES = ["verse", "estado", "vista", "scroll", "puntero", "velocidad"] as const;
export type Senal = (typeof SENALES)[number];
/** Las señales continuas (y `estado`): escriben en el mismo canal, así que un actor admite una sola. */
export const SENALES_CONTINUAS: readonly Senal[] = ["estado", "vista", "scroll", "puntero", "velocidad"];

export const CURVAS = ["suave", "lineal", "entra", "sale", "vaiven", "resorte"] as const;
export type Curva = (typeof CURVAS)[number];
/** Cómo se reparte un movimiento entre las piezas de un actor. */
export const POR = ["hijo", "palabra", "letra"] as const;
export type Por = (typeof POR)[number];
/** Qué parte del paso de la raíz por la pantalla sigue una escena de `vista`. */
export const TRAMOS = ["entrada", "salida", "paso"] as const;
export type Tramo = (typeof TRAMOS)[number];
export const ESTADOS = ["apuntado", "enfocado", "apretado"] as const;
export type Estado = (typeof ESTADOS)[number];
export const RESORTES = ["suave", "firme", "elastico"] as const;
export type Resorte = (typeof RESORTES)[number];

/** Los topes de una partitura. Lo que se pase no vale: una partitura la puede guardar cualquiera con su login. */
export const TOPES = {
  escenas: 12,
  pasos: 24,
  /** ms: lo que dura un paso, lo que espera cada pieza a la anterior y lo que puede durar una escena. */
  dura: 10000,
  cada: 1000,
  escena: 20000,
  /** Piezas por paso; con más (un texto muy largo cortado por letra) el actor se mueve entero. */
  piezas: 200,
  px: 2000,
  porciento: 300,
  escala: 4,
  giro: 720,
  /**
   * El estado final de una entrada (`a` en una escena `verse`) queda puesto para siempre: no puede esconder nada ni
   * sacarlo de su lugar. El punto de partida (`de`) y lo atado al scroll no tienen este tope: de ahí se viene, o se vuelve.
   */
  final: { opacidadMin: 0.5, escalaMin: 0.5, escalaMax: 2, px: 200, porciento: 100 },
  /** Lo más que arma una partitura entera: animaciones, y elementos que siguen al cursor o a la velocidad. */
  animaciones: 600,
  seguidores: 100,
  /** Los movimientos de `estado` son chicos: lo que se aprieta no se escapa del dedo. */
  estado: { px: 6, escalaMin: 0.94, escalaMax: 1.08, giro: 3, opacidadMin: 0.5, dura: 1000 },
  /** Lo más que se corre algo que sigue al cursor o a la velocidad. */
  seguir: { px: 200, giro: 45, escalaMin: 0.5, escalaMax: 2 },
  nombre: 60,
} as const;

/** Lo único que una partitura puede cambiar. `x` e `y`: px, o un porcentaje del propio tamaño («-14%»). */
export interface Cambio {
  x?: number | string;
  y?: number | string;
  escala?: number;
  /** Grados. */
  giro?: number;
  opacidad?: number;
}

/** Un paso de una escena por tiempo (`verse`). */
export interface PasoTiempo {
  /** El nombre de una parte de la página (`data-mk-parte`, o el mapa que pasa quien monta). */
  actor: string;
  por?: Por;
  /** Cada pieza va en una caja que la recorta (solo con `palabra` o `letra`). */
  mascara?: boolean;
  /** Desde dónde y hasta dónde. Lo que falta es como el actor está en la página. */
  de?: Cambio;
  a?: Cambio;
  /** ms. */
  dura?: number;
  curva?: Curva;
  /** ms entre una pieza y la siguiente. */
  cada?: number;
  /** Cuándo parte (uno solo; por defecto `en: 0`): a los N ms de la escena, N ms después de que termina el paso anterior, o N ms después de que empieza. */
  en?: number;
  luego?: number;
  junto?: number;
}

/** Un paso de una escena de `estado`: hacia dónde va el actor mientras dura el estado. */
export interface PasoEstado {
  actor: string;
  a: Cambio;
  dura?: number;
  curva?: Curva;
}

/** Un paso atado al scroll (`vista` o `scroll`). */
export interface PasoScroll {
  actor: string;
  por?: Por;
  de?: Cambio;
  a?: Cambio;
  /** El tramo de la señal (de 0 a 1) en que ocurre. */
  entre?: [number, number];
  curva?: Exclude<Curva, "resorte">;
}

/** Un paso que sigue a una señal con resorte (`puntero` o `velocidad`): cuánto se mueve con la señal al máximo. */
export interface PasoSeguir {
  actor: string;
  x?: number;
  y?: number;
  giro?: number;
  escala?: number;
  opacidad?: number;
  resorte?: Resorte;
}

export type Escena =
  | { con: "verse"; repetir?: boolean; pasos: PasoTiempo[] }
  /** `sobre`: el actor donde se mira el estado; sin él, el de cada paso. */
  | { con: "estado"; estado: Estado; sobre?: string; pasos: PasoEstado[] }
  | { con: "vista"; tramo?: Tramo; pasos: PasoScroll[] }
  | { con: "scroll"; pasos: PasoScroll[] }
  | { con: "puntero"; pasos: PasoSeguir[] }
  | { con: "velocidad"; pasos: PasoSeguir[] };

export interface Partitura {
  version: typeof VERSION_PARTITURA;
  nombre?: string;
  escenas: Escena[];
}

/** Los campos que acepta cada cosa (lo demás se rechaza). */
export const CAMPOS = {
  partitura: ["version", "nombre", "escenas"],
  cambio: ["x", "y", "escala", "giro", "opacidad"],
  escena: {
    verse: ["con", "repetir", "pasos"],
    estado: ["con", "estado", "sobre", "pasos"],
    vista: ["con", "tramo", "pasos"],
    scroll: ["con", "pasos"],
    puntero: ["con", "pasos"],
    velocidad: ["con", "pasos"],
  },
  paso: {
    verse: ["actor", "por", "mascara", "de", "a", "dura", "curva", "cada", "en", "luego", "junto"],
    estado: ["actor", "a", "dura", "curva"],
    vista: ["actor", "por", "de", "a", "entre", "curva"],
    scroll: ["actor", "por", "de", "a", "entre", "curva"],
    puntero: ["actor", "x", "y", "giro", "escala", "opacidad", "resorte"],
    velocidad: ["actor", "x", "y", "giro", "escala", "opacidad", "resorte"],
  },
} as const;

/** Cómo se escribe el nombre de un actor: minúsculas, números y guiones. */
export const NOMBRE_ACTOR = /^[a-z0-9][a-z0-9-]{0,39}$/;
/** Un porcentaje: «-14%», «135%», «12.5%». */
export const PORCENTAJE = /^-?\d{1,3}(\.\d{1,2})?%$/;
