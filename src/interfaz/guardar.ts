// BotonQueGuarda: lo calculable. Los estados del botón, el texto de cada uno y cuánto dura el resultado.
import type { ReactNode } from "react";

export type EstadoGuardar = "listo" | "guardando" | "bien" | "mal";

/** Cuánto se ve «✓ Guardado» y «No se pudo» antes de volver a «Guardar» (ms). */
export const DURA = { bien: 1600, mal: 2000 };

/** El texto del botón en cada estado; en «listo», lo que puso quien lo usa. */
export function textoGuardar(e: EstadoGuardar, base: ReactNode, t: { guardando: string; bien: string; mal: string }): ReactNode {
  return e === "listo" ? base : t[e];
}
