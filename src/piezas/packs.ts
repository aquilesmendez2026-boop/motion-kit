import type { BotonEfecto, BotonForma, BotonVariante } from "./Boton";

export type PackBotonId =
  | "clasico" | "minimal" | "neon-tubo" | "arcade" | "tecla" | "sello"
  | "ticket" | "manga" | "vidrio" | "degradado" | "flecha" | "borde";

interface Spec { variante: BotonVariante; efecto: BotonEfecto; forma: BotonForma }

export interface PackBoton {
  nombre: string;
  principal: Spec;
  secundario: Spec;
}

/** Packs de botones: la pareja principal + secundario que se usa en encabezados y llamados. */
export const PACKS_BOTONES: Record<PackBotonId, PackBoton> = {
  clasico: { nombre: "Clásico", principal: { variante: "solido", efecto: "elevar", forma: "pastilla" }, secundario: { variante: "contorno", efecto: "ninguno", forma: "pastilla" } },
  minimal: { nombre: "Mínimo", principal: { variante: "solido", efecto: "ninguno", forma: "recto" }, secundario: { variante: "fantasma", efecto: "flecha", forma: "subrayado" } },
  "neon-tubo": { nombre: "Tubo de neón", principal: { variante: "contorno", efecto: "elevar", forma: "recto" }, secundario: { variante: "fantasma", efecto: "ninguno", forma: "recto" } },
  arcade: { nombre: "Arcade", principal: { variante: "solido", efecto: "ninguno", forma: "pixel" }, secundario: { variante: "contorno", efecto: "ninguno", forma: "pixel" } },
  tecla: { nombre: "Tecla", principal: { variante: "solido", efecto: "ninguno", forma: "tecla" }, secundario: { variante: "suave", efecto: "ninguno", forma: "tecla" } },
  sello: { nombre: "Sello", principal: { variante: "solido", efecto: "relleno", forma: "sello" }, secundario: { variante: "contorno", efecto: "ninguno", forma: "sello" } },
  ticket: { nombre: "Entrada de cine", principal: { variante: "solido", efecto: "brillo", forma: "ticket" }, secundario: { variante: "fantasma", efecto: "flecha", forma: "subrayado" } },
  manga: { nombre: "Manga", principal: { variante: "solido", efecto: "latido", forma: "pastilla" }, secundario: { variante: "contorno", efecto: "deslizar", forma: "pastilla" } },
  vidrio: { nombre: "Vidrio", principal: { variante: "vidrio", efecto: "brillo", forma: "pastilla" }, secundario: { variante: "fantasma", efecto: "ninguno", forma: "pastilla" } },
  degradado: { nombre: "Degradado", principal: { variante: "degradado", efecto: "brillo", forma: "pastilla" }, secundario: { variante: "suave", efecto: "flecha", forma: "pastilla" } },
  flecha: { nombre: "Flecha", principal: { variante: "solido", efecto: "flecha", forma: "recto" }, secundario: { variante: "fantasma", efecto: "flecha", forma: "subrayado" } },
  borde: { nombre: "Borde giratorio", principal: { variante: "solido", efecto: "borde", forma: "pastilla" }, secundario: { variante: "fantasma", efecto: "ninguno", forma: "pastilla" } },
};

export const PACK_IDS = Object.keys(PACKS_BOTONES) as PackBotonId[];
