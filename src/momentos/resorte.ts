// Resorte: simula un resorte de verdad y lo deja como curva CSS `linear(...)`. Sin React; lo usan los momentos y,
// más adelante, el resto del kit. Cada estilo trae el suyo (variables --mk-resorte-curva y --mk-resorte-ms).
import type { EstiloId } from "../estilos/estilos";

export interface OpcionesResorte {
  /** Qué tan fuerte tira hacia el final. */
  rigidez?: number;
  /** Cuánto frena. Con 2·√(rigidez·masa) llega sin pasarse. */
  amortiguacion?: number;
  masa?: number;
  /** Muestras de la curva. */
  puntos?: number;
}

export interface Resorte {
  /** Curva para `animation-timing-function` o `transition-timing-function`. */
  curva: string;
  /** Lo que tarda en quedar quieto. */
  ms: number;
}

const PASO = 1 / 600;
const MAXIMO = 3;

export function resorte({ rigidez = 170, amortiguacion = 18, masa = 1, puntos = 32 }: OpcionesResorte = {}): Resorte {
  const xs: number[] = [];
  let x = 0;
  let v = 0;
  let t = 0;
  while (t < MAXIMO) {
    xs.push(x);
    const a = (-rigidez * (x - 1) - amortiguacion * v) / masa;
    v += a * PASO;
    x += v * PASO;
    t += PASO;
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break;
  }
  xs.push(1);
  const n = Math.max(2, Math.round(puntos));
  const muestras = Array.from({ length: n }, (_, i) => {
    if (i === 0) return 0;
    if (i === n - 1) return 1;
    return Math.round(xs[Math.round((i / (n - 1)) * (xs.length - 1))] * 1000) / 1000;
  });
  return { curva: `linear(${muestras.join(", ")})`, ms: Math.round(t * 1000) };
}

export const RESORTE_MEDIO: Resorte = resorte();

export const RESORTES_DE_ESTILO: Record<EstiloId, Resorte> = {
  neon: resorte({ rigidez: 260, amortiguacion: 14 }),
  anime: resorte({ rigidez: 300, amortiguacion: 10 }),
  pelicula: resorte({ rigidez: 120, amortiguacion: 2 * Math.sqrt(120) }),
  rock: resorte({ rigidez: 400, amortiguacion: 30 }),
  // Retro no rebota: llega a saltos, como sus 8 bits.
  retro: { curva: "steps(4, end)", ms: 320 },
};

/** Respaldo donde `linear()` no existe: una curva que se pasa un poco (o no, en película). */
const RESPALDO: Record<EstiloId, string> = {
  neon: "cubic-bezier(.34,1.5,.64,1)",
  anime: "cubic-bezier(.34,1.7,.6,1)",
  pelicula: "cubic-bezier(.22,1,.36,1)",
  rock: "cubic-bezier(.3,1.2,.5,1)",
  retro: RESORTES_DE_ESTILO.retro.curva,
};

const ids = Object.keys(RESORTES_DE_ESTILO) as EstiloId[];
const regla = (id: EstiloId, curva: string, ms = true) =>
  `[data-mk-estilo=${id}] .mk-momento{--mk-resorte-curva:${curva}${ms ? `;--mk-resorte-ms:${RESORTES_DE_ESTILO[id].ms}ms` : ""}}`;

export const CSS_RESORTES =
  `.mk-momento{--mk-resorte-curva:cubic-bezier(.34,1.4,.64,1);--mk-resorte-ms:${RESORTE_MEDIO.ms}ms}` +
  ids.map((id) => regla(id, RESPALDO[id])).join("") +
  `@supports (animation-timing-function:linear(0, 1)){.mk-momento{--mk-resorte-curva:${RESORTE_MEDIO.curva}}` +
  ids.filter((id) => id !== "retro").map((id) => regla(id, RESORTES_DE_ESTILO[id].curva, false)).join("") +
  "}";
