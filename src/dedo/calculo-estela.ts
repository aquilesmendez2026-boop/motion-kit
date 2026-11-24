// Estela y chispas: lo calculable. Sin React.

export interface PuntoEstela {
  x: number;
  y: number;
  /** Cuándo pasó el cursor por ahí (ms). */
  t: number;
  /** Aquí parte una estela nueva (el cursor salió y volvió, o se detuvo un rato): no se une al punto anterior. */
  corte?: boolean;
}

export interface Chispa {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Segundos que le quedan. */
  vida: number;
}

/** Número repetible entre 0 y 1 (mismo cálculo de src/efectos/semilla.ts, aquí para no depender de otro trozo). */
function azar(i: number, sal: number): number {
  const x = Math.sin((i + 1) * 12.9898 + sal * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Deja solo los puntos de la estela que todavía se ven (más nuevos que `vida` ms). */
export function recortarEstela(puntos: PuntoEstela[], ahora: number, vida = 450): PuntoEstela[] {
  return puntos.filter((p) => ahora - p.t < vida);
}

/** Un tramo de la estela para dibujar; `fresco` va de 0 (a punto de apagarse) a 1 (recién hecho). */
export interface TramoEstela {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fresco: number;
}

/** Los tramos que se dibujan: une cada punto vigente con el anterior, salvo a través de un corte. */
export function tramosEstela(puntos: PuntoEstela[], ahora: number, vida = 450): TramoEstela[] {
  const vigentes = recortarEstela(puntos, ahora, vida);
  const tramos: TramoEstela[] = [];
  for (let i = 1; i < vigentes.length; i++) {
    const a = vigentes[i - 1];
    const b = vigentes[i];
    if (!b.corte) tramos.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, fresco: Math.max(0, Math.min(1, 1 - (ahora - b.t) / vida)) });
  }
  return tramos;
}

/** Las chispas de un toque: salen en todas direcciones, entre 80 y 260 px por segundo, y viven medio segundo. */
export function chispasDe(x: number, y: number, semilla: number, n = 10): Chispa[] {
  return Array.from({ length: Math.max(0, n) }, (_, i) => {
    const angulo = azar(i * 2, semilla) * Math.PI * 2;
    const rapidez = 80 + azar(i * 2 + 1, semilla) * 180;
    return { x, y, vx: Math.cos(angulo) * rapidez, vy: Math.sin(angulo) * rapidez, vida: 0.5 };
  });
}

/** Avanza las chispas `dt` segundos (caen con gravedad) y saca las que terminaron. */
export function pasoChispas(chispas: Chispa[], dt: number): Chispa[] {
  const vivas: Chispa[] = [];
  for (const c of chispas) {
    const vida = c.vida - dt;
    if (vida <= 0) continue;
    const vy = c.vy + 600 * dt;
    vivas.push({ x: c.x + c.vx * dt, y: c.y + vy * dt, vx: c.vx, vy, vida });
  }
  return vivas;
}
