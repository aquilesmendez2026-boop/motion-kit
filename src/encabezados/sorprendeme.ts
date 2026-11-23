import { ESTILOS, type EstiloId, type TextoEfecto } from "../estilos/estilos";
import { EFECTOS } from "../efectos/registro";
import type { EfectoId, Variante } from "../efectos/tokens";
import { PACK_IDS, type PackBotonId } from "../piezas/packs";
import { COMPOSICIONES, COMPOSICION_IDS, ENTRADA_IDS, type ComposicionId, type EntradaId } from "./catalogo";

export interface EncabezadoAzar {
  composicion: ComposicionId;
  entrada: EntradaId;
  efecto: EfectoId;
  variante: Variante;
  efectoTexto: TextoEfecto;
  pack: PackBotonId;
}

/** Encabezado al azar que combina con el estilo (composición, entrada, efecto, texto y pack). */
export function encabezadoAlAzar(estilo: EstiloId, azar: () => number = Math.random): EncabezadoAzar {
  const e = ESTILOS[estilo];
  const elige = <T,>(xs: readonly T[]) => xs[Math.floor(azar() * xs.length)];
  const composiciones = COMPOSICION_IDS.filter((c) => COMPOSICIONES[c].estilos.includes(estilo));
  const efecto = elige(e.efectos);
  const vistoso = EFECTOS[efecto].animo === "vistoso";
  return {
    composicion: elige(composiciones),
    entrada: elige(ENTRADA_IDS.filter((x) => x !== "ninguna")),
    efecto,
    variante: (1 + Math.floor(azar() * 3)) as Variante,
    efectoTexto: elige(vistoso ? ["revelar", "voltear", "maquina", "trailer"] : [...e.texto, "revelar", "voltear", "rebote"]),
    pack: azar() < 0.6 ? e.pack : elige(PACK_IDS),
  };
}
