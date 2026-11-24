// Bandada: aves chicas que vuelan juntas, giran y esquivan el dedo o el cursor. Un lienzo 2D. Con «reducir movimiento»
// o en nivel liviano queda un cuadro, sin moverse.
import { useEffect, useRef } from "react";
import { CapaEfecto } from "../CapaEfecto";
import { cantidadFondo, CSS_LIENZO } from "../lienzo";
import type { EfectoProps } from "../tokens";
import { ajustarCantidad, bordeSuave, montarFondo, type EscenaFondo } from "./fondo";
import { crearBandada, pasoBandada, type Ave } from "./calculo-bandada";

const CSS = CSS_LIENZO;
const CANTIDAD: [number, number, number] = [24, 36, 50];
/** Largo y medio ancho de cada ave (px). */
const LARGO = 7;
const ALA = 4;

function escena(variante: number): EscenaFondo {
  let aves: Ave[] = [];
  return {
    medir(l, quieta, antes) {
      const n = cantidadFondo(variante, l.ancho, CANTIDAD, quieta);
      if (!aves.length || !antes.ancho) {
        aves = crearBandada(n, l.ancho, l.alto, variante);
        // Parte ya armada: unos segundos de vuelo antes de mostrarse.
        for (let i = 0; i < 90; i++) pasoBandada(aves, 1 / 30, l.ancho, l.alto);
        return;
      }
      // Otro tamaño: las mismas aves, repartidas en la caja nueva. En la versión quieta van menos; al volver, se reponen.
      for (const a of aves) {
        a.x *= l.ancho / antes.ancho;
        a.y *= l.alto / antes.alto;
      }
      ajustarCantidad(aves, n, (cuantas) => crearBandada(cuantas, l.ancho, l.alto, variante));
    },
    mover(dt, l, dedo) {
      pasoBandada(aves, dt, l.ancho, l.alto, dedo);
    },
    dibujar(l) {
      const { ctx } = l;
      ctx.clearRect(0, 0, l.ancho, l.alto);
      aves.forEach((a, i) => {
        const v = Math.hypot(a.vx, a.vy) || 1;
        const [c, s] = [a.vx / v, a.vy / v];
        ctx.globalAlpha = 0.85 * bordeSuave(a.x, a.y, l.ancho, l.alto);
        ctx.fillStyle = i % 4 ? l.claro : l.color;
        ctx.beginPath();
        ctx.moveTo(a.x + c * LARGO, a.y + s * LARGO);
        ctx.lineTo(a.x - c * LARGO * 0.6 - s * ALA, a.y - s * LARGO * 0.6 + c * ALA);
        ctx.lineTo(a.x - c * LARGO * 0.2, a.y - s * LARGO * 0.2);
        ctx.lineTo(a.x - c * LARGO * 0.6 + s * ALA, a.y - s * LARGO * 0.6 - c * ALA);
        ctx.closePath();
        ctx.fill();
      });
    },
  };
}

export default function Bandada({ variante = 1, ...p }: EfectoProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return montarFondo(cv, escena(variante));
  }, [variante]);
  return (
    <CapaEfecto nombre="bandada" css={CSS} variante={variante} {...p}>
      <canvas ref={ref} className="mk-lienzo" />
    </CapaEfecto>
  );
}
