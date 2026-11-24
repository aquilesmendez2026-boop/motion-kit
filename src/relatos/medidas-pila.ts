// Cartas apiladas: lo calculable. Sin React.

/**
 * Dónde queda pegado un bloque: arriba (0) si cabe en la pantalla; si es más alto, sube lo que le sobra (negativo),
 * así primero se recorre entero y recién ahí queda pegado.
 */
export function topPila(altoBloque: number, altoVista: number): number {
  const sobra = altoVista - altoBloque;
  return Number.isFinite(sobra) ? Math.min(0, sobra) : 0;
}
