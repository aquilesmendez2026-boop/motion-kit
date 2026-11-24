// Gotas: ondas que se abren como en el agua. Sola, cae una cada tanto; cada toque o movimiento del dedo o el cursor
// suelta otra. Un lienzo 2D. Con «reducir movimiento» o en nivel liviano quedan unas pocas ondas, sin moverse.
import { useEffect, useRef } from "react";
import { CapaEfecto } from "../CapaEfecto";
import { cantidadFondo, CSS_LIENZO } from "../lienzo";
import type { EfectoProps } from "../tokens";
import { montarFondo, type EscenaFondo } from "./fondo";
import { fuerzaGota, gotaSola, pasoGotas, radioGota, type Gota } from "./calculo-gotas";

const CSS = CSS_LIENZO;
/** Sola, cae una gota cada tantos segundos; el dedo suelta a lo más una cada tantos ms; y nunca hay más de tantas. */
const CADA = 0.9;
const ENTRE_DEDO = 120;
const TOPE = 24;
/** Cuántas ondas quedan en la versión quieta, y cuánto se atrasa cada anillo de una gota (segundos). */
const QUIETAS: [number, number, number] = [5, 7, 9];
const ATRASO = 0.28;
const VUELTA = Math.PI * 2;

function escena(variante: number): EscenaFondo {
  let gotas: Gota[] = [];
  let cuenta = 0;
  let reloj = 0;
  let ultimoDedo = -1e9;
  /** La variante dice cuántos anillos trae cada gota. */
  const anillos = Math.max(1, Math.min(3, variante));
  const sumar = (g: Gota) => {
    if (gotas.length >= TOPE) gotas.shift();
    gotas.push(g);
  };
  return {
    medir(l, quieta) {
      if (quieta) {
        // Unas pocas, cada una en un momento distinto de su vida.
        gotas = Array.from({ length: cantidadFondo(variante, l.ancho, QUIETAS, true) }, (_, i) => ({ ...gotaSola(i, l.ancho, l.alto, variante), edad: 0.4 + ((i * 0.37) % 1.5) }));
        return;
      }
      // Parte con un par de ondas ya abiertas (y al cambiar de tamaño, las de antes ya no calzan).
      gotas = [0.5, 1.2].map((edad) => ({ ...gotaSola(cuenta++, l.ancho, l.alto, variante), edad }));
      reloj = 0;
    },
    mover(dt, l) {
      gotas = pasoGotas(gotas, dt);
      reloj += dt;
      if (reloj >= CADA) {
        reloj = 0;
        sumar(gotaSola(cuenta++, l.ancho, l.alto, variante));
      }
    },
    dibujar(l) {
      const { ctx } = l;
      ctx.clearRect(0, 0, l.ancho, l.alto);
      ctx.lineWidth = 1.5;
      for (const g of gotas) {
        for (let k = 0; k < anillos; k++) {
          const r = radioGota(g.edad - k * ATRASO);
          if (r < 1) continue;
          ctx.globalAlpha = fuerzaGota(g.edad) * (0.65 - k * 0.18);
          ctx.strokeStyle = k ? l.color : l.claro;
          ctx.beginPath();
          ctx.arc(g.x, g.y, r, 0, VUELTA);
          ctx.stroke();
        }
      }
    },
    alDedo(dedo, toque, t) {
      if (!toque && t - ultimoDedo < ENTRE_DEDO) return;
      ultimoDedo = t;
      sumar({ x: dedo.x, y: dedo.y, edad: 0 });
    },
  };
}

export default function Gotas({ variante = 1, ...p }: EfectoProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return montarFondo(cv, escena(variante));
  }, [variante]);
  return (
    <CapaEfecto nombre="gotas" css={CSS} variante={variante} {...p}>
      <canvas ref={ref} className="mk-lienzo" />
    </CapaEfecto>
  );
}
