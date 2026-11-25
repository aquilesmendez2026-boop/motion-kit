// La geometría de los hilos: puntos, líneas con sus muestras, arcos y el camino SVG que pasa suave por ellos.
// Puro, sin navegador.

export interface Punto {
  x: number;
  y: number;
}

/** Un decimal: los caminos quedan cortos y se leen. */
export const r1 = (n: number) => Math.round(n * 10) / 10;

/** Muestras de la recta de `a` a `b`, cada `paso` px o menos (sin repetir `a`). */
export function recta(a: Punto, b: Punto, paso = 8): Punto[] {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / paso));
  return Array.from({ length: n }, (_, i) => ({ x: a.x + ((b.x - a.x) * (i + 1)) / n, y: a.y + ((b.y - a.y) * (i + 1)) / n }));
}

/**
 * Una línea quebrada, con muestras cada `paso` px. Sin `radio` pasa por todos los puntos dados; con `radio`, dobla
 * cada esquina en una curva de ese tamaño (o lo que quepa): un hilo no hace esquinas vivas.
 */
export function quebrada(puntos: Punto[], paso = 8, radio = 0): Punto[] {
  if (!puntos.length) return [];
  const linea: Punto[] = [puntos[0]];
  let desde = puntos[0];
  for (let i = 1; i < puntos.length - 1; i++) {
    const [c, b] = [puntos[i], puntos[i + 1]];
    const [la, lb] = [Math.hypot(c.x - desde.x, c.y - desde.y), Math.hypot(b.x - c.x, b.y - c.y)];
    const r = Math.min(radio, la / 2, lb / 2);
    if (!(r >= 1)) {
      linea.push(...recta(desde, c, paso));
      desde = c;
      continue;
    }
    const entra = { x: c.x + ((desde.x - c.x) * r) / la, y: c.y + ((desde.y - c.y) * r) / la };
    const sale = { x: c.x + ((b.x - c.x) * r) / lb, y: c.y + ((b.y - c.y) * r) / lb };
    linea.push(...recta(desde, entra, paso));
    // La curva de la esquina: de donde entra a donde sale, tirada hacia el vértice.
    for (const t of [0.25, 0.5, 0.75, 1]) linea.push({ x: (1 - t) ** 2 * entra.x + 2 * t * (1 - t) * c.x + t * t * sale.x, y: (1 - t) ** 2 * entra.y + 2 * t * (1 - t) * c.y + t * t * sale.y });
    desde = sale;
  }
  if (puntos.length > 1) linea.push(...recta(desde, puntos[puntos.length - 1], paso));
  return linea;
}

/** Un arco de elipse, en grados (0° a la derecha, 90° abajo), con muestras cada 6 px o menos. */
export function arco(cx: number, cy: number, rx: number, ry: number, desde: number, hasta: number): Punto[] {
  const n = Math.max(4, Math.ceil((Math.abs(hasta - desde) / 360) * ((2 * Math.PI * Math.max(rx, ry)) / 6)));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((desde + ((hasta - desde) * i) / n) * Math.PI) / 180;
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
}

/**
 * El camino SVG que pasa suave por los puntos: de punto medio a punto medio, con cada punto como control. Con las
 * muestras cada 8 px se aparta de la línea quebrada menos de 3 px, y siempre hacia adentro de la curva.
 */
export function suave(puntos: Punto[]): string {
  if (puntos.length < 2) return "";
  const p = (q: Punto) => `${r1(q.x)} ${r1(q.y)}`;
  let d = `M${p(puntos[0])}`;
  for (let i = 1; i < puntos.length - 1; i++) d += `Q${p(puntos[i])} ${p({ x: (puntos[i].x + puntos[i + 1].x) / 2, y: (puntos[i].y + puntos[i + 1].y) / 2 })}`;
  return `${d}L${p(puntos[puntos.length - 1])}`;
}
