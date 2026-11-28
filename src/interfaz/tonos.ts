// Los estados de las tarjetas del panel (`Pastilla`): el fondo de cada tono y su texto. Puro, sin React. Los fondos
// son los de hoy del panel de La Mente (modulo.css); el tema puede cambiarlos con `--mk-estado-<tono>`.
export type TonoEstado = "verde" | "gris" | "naranjo" | "morado" | "rojo";

export const TONOS: Record<TonoEstado, string> = {
  verde: "#c9f2d6",
  gris: "#e6e9ef",
  naranjo: "#ffd9b8",
  morado: "#e3d7ff",
  rojo: "#ffd2d2",
};

/**
 * La tinta sobre los estados. Tiene su propia variable (`--mk-estado-texto`): los fondos son siempre pastel, y la tinta
 * de sobre el cartel (`--mk-sobre-sol`) puede ser blanca («cancha»; revisión de la v0.9.0).
 */
export const TEXTO_TONO = "#10223f";

export const colorDeTono = (tono: TonoEstado): { fondo: string; texto: string } => ({
  fondo: `var(--mk-estado-${tono},${TONOS[tono]})`,
  texto: `var(--mk-estado-texto,${TEXTO_TONO})`,
});
