// Un paso de resorte: lo usan las letras con imán y la inclinación por velocidad. Sin React.

/**
 * Avanza `dt` segundos un resorte que tira de `x` hacia `objetivo`. Con los valores por defecto se pasa un poco y
 * vuelve (rebote corto).
 */
export function pasoResorte(e: { x: number; v: number }, objetivo: number, dt: number, rigidez = 180, amortiguacion = 14): { x: number; v: number } {
  const v = e.v + (-rigidez * (e.x - objetivo) - amortiguacion * e.v) * dt;
  return { x: e.x + v * dt, v };
}
