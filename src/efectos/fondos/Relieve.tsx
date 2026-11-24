// Relieve: líneas horizontales que dibujan un terreno que ondula de a poco; el dedo o el cursor levanta un cerro. Un
// lienzo 2D. Con «reducir movimiento» o en nivel liviano queda un cuadro, sin moverse.
import { useEffect, useRef } from "react";
import { CapaEfecto } from "../CapaEfecto";
import { CSS_LIENZO } from "../lienzo";
import type { EfectoProps } from "../tokens";
import { montarFondo, type EscenaFondo } from "./fondo";
import { alturaRelieve } from "./calculo-relieve";

const CSS = CSS_LIENZO;
/** Cada cuántos px va una línea, según la variante. */
const ENTRE = [34, 26, 20];
/** Cada cuántos px se calcula la altura a lo largo de una línea. */
const TRAMO = 14;

function escena(variante: number): EscenaFondo {
  let t = 0;
  const entre = ENTRE[variante - 1] ?? ENTRE[0];
  // Cuánto se corre una línea con el terreno arriba del todo: casi hasta la línea vecina, para que el cerro se note.
  const sube = entre * 0.9;
  return {
    medir() {},
    mover(dt) {
      t += dt;
    },
    dibujar(l, quieta, dedo) {
      const { ctx } = l;
      const ahora = quieta ? 0 : t;
      ctx.clearRect(0, 0, l.ancho, l.alto);
      ctx.lineWidth = 1;
      // Dos pasadas: una de cada tres líneas va con el acento claro.
      for (const clara of [false, true]) {
        ctx.strokeStyle = clara ? l.claro : l.color;
        ctx.globalAlpha = clara ? 0.5 : 0.32;
        ctx.beginPath();
        for (let y = entre / 2, i = 0; y < l.alto + sube; y += entre, i++) {
          if ((i % 3 === 0) !== clara) continue;
          ctx.moveTo(0, y - alturaRelieve(0, y, ahora, dedo) * sube);
          for (let x = TRAMO; x < l.ancho + TRAMO; x += TRAMO) ctx.lineTo(x, y - alturaRelieve(x, y, ahora, dedo) * sube);
        }
        ctx.stroke();
      }
    },
  };
}

export default function Relieve({ variante = 1, ...p }: EfectoProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return montarFondo(cv, escena(variante));
  }, [variante]);
  return (
    <CapaEfecto nombre="relieve" css={CSS} variante={variante} {...p}>
      <canvas ref={ref} className="mk-lienzo" />
    </CapaEfecto>
  );
}
