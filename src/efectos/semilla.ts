/** Número repetible entre 0 y 1: el mismo `i` da siempre lo mismo (sin Math.random, sin saltos al renderizar). */
export function semilla(i: number, sal = 0): number {
  const x = Math.sin((i + 1) * 12.9898 + sal * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Entero 0..n-1 repetible. */
export function lista(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}
