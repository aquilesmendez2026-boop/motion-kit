import type { HTMLAttributes, ComponentType } from "react";

export type Rubro = "comida" | "belleza" | "salud" | "clases" | "barrio" | "otro";
export type Variante = 1 | 2 | 3;
export type EfectoId =
  | "cafe" | "petalos" | "pulso" | "abecedario" | "letrero" | "cometas"
  | "niebla" | "burbujas" | "olas" | "puntos" | "lluvia" | "estrellas"
  | "rejilla" | "tubo" | "ecualizador" | "velocidad" | "grano"
  | "granos" | "tijeras" | "huellas" | "pesas" | "lapices" | "constelacion"
  | "bandada" | "luciernagas" | "corrientes" | "gotas" | "relieve";

export interface EfectoProps extends HTMLAttributes<HTMLDivElement> {
  /** 1, 2 o 3: cambia densidad, velocidad o forma. */
  variante?: Variante;
}

export interface EfectoDef {
  id: EfectoId;
  nombre: string;
  familia: "escena" | "fondo" | "estilo";
  rubros: Rubro[];
  animo: "sobrio" | "vistoso";
  cargar: () => Promise<{ default: ComponentType<EfectoProps> }>;
}

/** Colores: primero `--mk-*`, luego las variables de La Mente, luego un respaldo. */
export const COLOR = {
  acento: "var(--mk-acento, var(--lm-acento, #7c5cff))",
  acentoClaro: "color-mix(in srgb, var(--mk-acento, var(--lm-acento, #7c5cff)) 55%, white)",
  fondo: "var(--mk-fondo, var(--lm-fondo, #ffffff))",
  superficie: "var(--mk-superficie, var(--lm-superficie, #f4f2ff))",
};
