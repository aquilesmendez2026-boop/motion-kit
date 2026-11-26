// Cargando: qué mostrar en cada momento. Una carga corta no muestra el esqueleto (no parpadea); si ya se mostró, dura un
// mínimo; y una vez que el contenido se vio, refrescar no vuelve al esqueleto.

export type FormaCarga = "texto" | "fila" | "tarjeta" | "tabla" | "foto";

/** Milisegundos antes de mostrar el esqueleto. */
export const ESPERA = 150;
/** Lo mínimo que dura el esqueleto una vez a la vista. */
export const MINIMO = 300;

/** Tiempos en ms desde que se montó; `null` si todavía no pasó. */
export function fase(e: { ahora: number; listoEn: number | null; esqueletoDesde: number | null; yaMostro: boolean }): "nada" | "esqueleto" | "contenido" {
  if (e.yaMostro) return "contenido";
  if (e.listoEn !== null) {
    if (e.esqueletoDesde === null) return "contenido";
    return e.ahora >= e.esqueletoDesde + MINIMO ? "contenido" : "esqueleto";
  }
  return e.ahora >= ESPERA ? "esqueleto" : "nada";
}
