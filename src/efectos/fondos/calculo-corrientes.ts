// Corrientes: lo calculable. Un campo de rumbos suave que cambia de a poco, y trazos que lo siguen. Sin React.
import { semilla } from "../semilla";

export interface Trazo {
  x: number;
  y: number;
  /** Segundos desde que nació. */
  edad: number;
}

/** A menos de esto del dedo, la corriente lo rodea (px). */
const RODEO = 130;
/** Rapidez de los trazos (px por segundo) y cuánto viven (segundos). */
const RAPIDEZ = 40;
const VIDA = 6;

/** Hacia dónde va la corriente en un punto, a los `t` segundos (radianes). Cerca del dedo, lo rodea. */
export function rumbo(x: number, y: number, t: number, dedo?: { x: number; y: number } | null): number {
  const a = (Math.sin(x * 0.006 + t * 0.13) + Math.cos(y * 0.008 - t * 0.1) + Math.sin((x + y) * 0.004 + 1.7)) * 1.1;
  if (!dedo) return a;
  const dx = x - dedo.x;
  const dy = y - dedo.y;
  const d = Math.hypot(dx, dy);
  if (d >= RODEO) return a;
  // Se mezcla con la tangente al círculo en torno al dedo: más cerca, más rodea.
  const w = 1 - d / RODEO;
  const tangente = Math.atan2(dy, dx) + Math.PI / 2;
  return Math.atan2((1 - w) * Math.sin(a) + w * Math.sin(tangente), (1 - w) * Math.cos(a) + w * Math.cos(tangente));
}

/** Suma un punto a la cola de un trazo (x, y seguidos) y bota los más viejos si pasa de `puntos`. */
export function alargarCola(cola: number[], x: number, y: number, puntos: number): void {
  cola.push(x, y);
  const sobra = cola.length - Math.max(1, puntos) * 2;
  if (sobra > 0) cola.splice(0, sobra);
}

/** Trazos repartidos en la caja, con edades distintas (así no renacen todos juntos). */
export function crearTrazos(n: number, ancho: number, alto: number, sal: number): Trazo[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => ({ x: semilla(i * 3, sal) * ancho, y: semilla(i * 3 + 1, sal) * alto, edad: semilla(i * 3 + 2, sal) * VIDA }));
}

/** Avanza los trazos `dt` segundos por la corriente. El que sale de la caja o cumple su vida renace en otro punto. */
export function pasoTrazos(trazos: Trazo[], dt: number, ancho: number, alto: number, t: number, dedo?: { x: number; y: number } | null): void {
  if (!(dt > 0)) return;
  trazos.forEach((q, i) => {
    const a = rumbo(q.x, q.y, t, dedo);
    q.x += Math.cos(a) * RAPIDEZ * dt;
    q.y += Math.sin(a) * RAPIDEZ * dt;
    q.edad += dt;
    if (q.edad >= VIDA || q.x < 0 || q.x > ancho || q.y < 0 || q.y > alto) {
      // Un punto repetible: depende de cuál trazo es y de cuándo renace.
      const vez = Math.floor(t * 30) % 10007;
      q.x = semilla(i * 2 + 5, vez) * ancho;
      q.y = semilla(i * 2 + 6, vez) * alto;
      q.edad = 0;
    }
  });
}
