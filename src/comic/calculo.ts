// Los dibujos de cómic: lo calculable. Dónde queda la punta del dedo de la mano en cada dirección (para apuntar justo a
// algo) y el tamaño de la letra de un estallido (para que no se salga de la estrella).

export type Direccion = "derecha" | "izquierda" | "arriba" | "abajo";
export type Piel = "clara" | "media" | "morena" | "oscura";

/**
 * La punta del índice, en fracciones del ANCHO de la mano, desde la esquina superior izquierda de su caja (ancho × la
 * mitad de alto). Girada, la caja gira sobre su centro: «arriba» deja la punta por encima de la caja (y negativo).
 */
export const PUNTA_MANO: Record<Direccion, { x: number; y: number }> = {
  derecha: { x: 0.973, y: 0.167 },
  izquierda: { x: 0.027, y: 0.167 },
  arriba: { x: 0.417, y: -0.223 },
  abajo: { x: 0.583, y: 0.723 },
};

/** La letra del texto de un estallido (px): se ajusta a la palabra más larga, nunca más de 22. */
export function letraEstallido(texto: string, tamano: number): number {
  const larga = Math.max(5, ...String(texto ?? "").split(/\s+/).map((p) => p.length));
  const t = Number.isFinite(tamano) && tamano > 0 ? tamano : 100;
  return Math.min(22, (t * 0.95) / larga);
}
