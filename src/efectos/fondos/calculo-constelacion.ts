// Constelación: lo calculable. Sin React.
import { semilla } from "../semilla";

export interface Punto {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Cuántos puntos: 36, 60 o 90 según la variante; el 60 % en pantallas angostas y otro 60 % en la versión quieta (nivel
 * liviano o movimiento reducido).
 */
export function cantidadPuntos(variante: number, ancho: number, quieta: boolean): number {
  const base = [36, 60, 90][variante - 1] ?? 36;
  return Math.round(base * (ancho < 700 ? 0.6 : 1) * (quieta ? 0.6 : 1));
}

/** Puntos repartidos en la caja, cada uno con su rumbo y una rapidez de 6 a 14 px por segundo. */
export function crearPuntos(n: number, ancho: number, alto: number, sal: number): Punto[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const angulo = semilla(i * 4 + 2, sal) * Math.PI * 2;
    const rapidez = 6 + semilla(i * 4 + 3, sal) * 8;
    return { x: semilla(i * 4, sal) * ancho, y: semilla(i * 4 + 1, sal) * alto, vx: Math.cos(angulo) * rapidez, vy: Math.sin(angulo) * rapidez };
  });
}

/** Mueve los puntos `dt` segundos. Dan la vuelta por los bordes; los que están a menos de 160 px del dedo se le acercan. */
export function moverPuntos(puntos: Punto[], dt: number, ancho: number, alto: number, dedo?: { x: number; y: number } | null): void {
  for (const p of puntos) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (dedo) {
      const dx = dedo.x - p.x;
      const dy = dedo.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < 160) {
        const tiron = (1 - d / 160) * 60 * dt;
        p.x += (dx / d) * tiron;
        p.y += (dy / d) * tiron;
      }
    }
    if (p.x < 0) p.x += ancho;
    else if (p.x > ancho) p.x -= ancho;
    if (p.y < 0) p.y += alto;
    else if (p.y > alto) p.y -= alto;
  }
}

/** Los pares de puntos más cerca que `distancia`: [i, j, fuerza], con i < j y fuerza de 0 a 1 (más cerca, más fuerte). */
export function enlaces(puntos: { x: number; y: number }[], distancia = 110): [number, number, number][] {
  const pares: [number, number, number][] = [];
  for (let i = 0; i < puntos.length; i++) {
    for (let j = i + 1; j < puntos.length; j++) {
      const d = Math.hypot(puntos[i].x - puntos[j].x, puntos[i].y - puntos[j].y);
      if (d < distancia) pares.push([i, j, 1 - d / distancia]);
    }
  }
  return pares;
}
