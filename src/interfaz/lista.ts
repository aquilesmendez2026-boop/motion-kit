// Lo que llega (ListaViva y Contador): lo calculable.

/** Qué claves entran, cuáles salen (con su lugar de antes) y cuáles quedan, de una vuelta a la siguiente. */
export function cambios(antes: string[], ahora: string[]): { entran: string[]; salen: { clave: string; indice: number }[]; quedan: string[] } {
  const habia = new Set(antes);
  const hay = new Set(ahora);
  return {
    entran: [...hay].filter((k) => !habia.has(k)),
    salen: antes.map((clave, indice) => ({ clave, indice })).filter((s, i) => !hay.has(s.clave) && antes.indexOf(s.clave) === i),
    quedan: [...hay].filter((k) => habia.has(k)),
  };
}

/** Si la vuelta actual (la última) cuenta como la primera carga: todas las anteriores estaban vacías. */
export function esPrimera(vistas: string[][]): boolean {
  return vistas.slice(0, -1).every((v) => v.length === 0);
}

/** El número de la insignia: entero, nunca negativo, y «99+» sobre el máximo. */
export function textoContador(valor: number, max: number): string {
  const v = Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : 0;
  return v > max ? `${max}+` : String(v);
}
