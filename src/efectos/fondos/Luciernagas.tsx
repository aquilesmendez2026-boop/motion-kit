// Luciérnagas: luces chicas que derivan y se encienden y apagan; las que quedan cerca del dedo o el cursor se
// encienden. Un lienzo 2D. Con «reducir movimiento» o en nivel liviano queda un cuadro, sin moverse.
import { useEffect, useRef } from "react";
import { CapaEfecto } from "../CapaEfecto";
import { cantidadFondo, CSS_LIENZO } from "../lienzo";
import type { EfectoProps } from "../tokens";
import { ajustarCantidad, bordeSuave, montarFondo, type EscenaFondo } from "./fondo";
import { brilloLuz, crearLuces, pasoLuces, type Luz } from "./calculo-luciernagas";

const CSS = CSS_LIENZO;
const CANTIDAD: [number, number, number] = [18, 30, 44];
/** Cada luz son tres discos: un resplandor ancho y tenue, otro más chico y el punto. Radio y fuerza de cada uno. */
const DISCOS: [number, number][] = [[15, 0.07], [8, 0.18], [2.2, 1]];
const VUELTA = Math.PI * 2;

function escena(variante: number): EscenaFondo {
  let luces: Luz[] = [];
  let t = 0;
  return {
    medir(l, quieta, antes) {
      const n = cantidadFondo(variante, l.ancho, CANTIDAD, quieta);
      if (!luces.length || !antes.ancho) {
        luces = crearLuces(n, l.ancho, l.alto, variante);
        return;
      }
      for (const p of luces) {
        p.x *= l.ancho / antes.ancho;
        p.y *= l.alto / antes.alto;
      }
      ajustarCantidad(luces, n, (cuantas) => crearLuces(cuantas, l.ancho, l.alto, variante));
    },
    mover(dt, l) {
      t += dt;
      pasoLuces(luces, dt, l.ancho, l.alto);
    },
    dibujar(l, quieta, dedo) {
      const { ctx } = l;
      ctx.clearRect(0, 0, l.ancho, l.alto);
      for (const p of luces) {
        // En la versión quieta ninguna queda apagada del todo.
        const b = (quieta ? 0.35 + 0.65 * brilloLuz(p, 0) : brilloLuz(p, t, dedo)) * bordeSuave(p.x, p.y, l.ancho, l.alto);
        if (b < 0.02) continue;
        DISCOS.forEach(([radio, fuerza], k) => {
          ctx.globalAlpha = b * fuerza;
          ctx.fillStyle = k === 2 ? l.claro : l.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radio, 0, VUELTA);
          ctx.fill();
        });
      }
    },
  };
}

export default function Luciernagas({ variante = 1, ...p }: EfectoProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return montarFondo(cv, escena(variante));
  }, [variante]);
  return (
    <CapaEfecto nombre="luciernagas" css={CSS} variante={variante} {...p}>
      <canvas ref={ref} className="mk-lienzo" />
    </CapaEfecto>
  );
}
