// Corrientes: trazos finos que siguen un campo de rumbos y dejan estela; rodean el dedo o el cursor. Un lienzo 2D. Cada
// trazo guarda sus últimos puntos y la estela se dibuja de nuevo en cada cuadro, de lo más tenue (lo viejo) a lo más
// marcado (lo nuevo): así no queda ningún velo en el lienzo con el tiempo. Con «reducir movimiento» o en nivel liviano
// queda un cuadro con las líneas de la corriente, sin moverse.
import { useEffect, useRef } from "react";
import { CapaEfecto } from "../CapaEfecto";
import { cantidadFondo, CSS_LIENZO, type Lienzo } from "../lienzo";
import type { EfectoProps } from "../tokens";
import { montarFondo, type EscenaFondo } from "./fondo";
import { alargarCola, crearTrazos, pasoTrazos, rumbo, type Trazo } from "./calculo-corrientes";

const CSS = CSS_LIENZO;
const CANTIDAD: [number, number, number] = [60, 100, 150];
/** Cuántos puntos guarda la estela de cada trazo (a 30 por segundo, poco más de un segundo) y en cuántos tonos se dibuja. */
const COLA = 36;
const TONOS = 6;
/** En la versión quieta, cada línea se dibuja de una vez: tantos pasos de tantos px. */
const PASOS = 34;
const LARGO = 5;

function escena(variante: number): EscenaFondo {
  let trazos: Trazo[] = [];
  /** La estela de cada trazo: x, y seguidos, del punto más viejo al más nuevo. */
  let colas: number[][] = [];
  let t = 0;
  /**
   * Dibuja, de cada línea, sus puntos entre `desde(m)` y `hasta(m)` (`m` es cuántos puntos tiene): las líneas pares con
   * el acento y las impares con su versión clara. Dos trazos de pincel en total, sin crear listas nuevas.
   */
  const pintar = (l: Lienzo, lineas: number[][], fuerza: number, desde: (m: number) => number, hasta: (m: number) => number) => {
    const { ctx } = l;
    ctx.globalAlpha = fuerza;
    for (const resto of [0, 1]) {
      ctx.strokeStyle = resto ? l.claro : l.color;
      ctx.beginPath();
      for (let i = resto; i < lineas.length; i += 2) {
        const p = lineas[i];
        const m = p.length / 2;
        const a = Math.max(0, desde(m));
        const z = Math.min(m - 1, hasta(m));
        if (z <= a) continue;
        ctx.moveTo(p[a * 2], p[a * 2 + 1]);
        for (let k = a + 1; k <= z; k++) ctx.lineTo(p[k * 2], p[k * 2 + 1]);
      }
      ctx.stroke();
    }
  };
  return {
    medir(l, quieta) {
      // Otro tamaño (o cambio de quietud): los trazos parten de nuevo, sin estela.
      trazos = crearTrazos(cantidadFondo(variante, l.ancho, CANTIDAD, quieta), l.ancho, l.alto, variante);
      colas = trazos.map((q) => [q.x, q.y]);
    },
    mover(dt, l, dedo) {
      t += dt;
      const edades = trazos.map((q) => q.edad);
      pasoTrazos(trazos, dt, l.ancho, l.alto, t, dedo);
      trazos.forEach((q, i) => {
        // El que renació saltó a otro punto: su estela parte de nuevo ahí.
        if (q.edad < edades[i]) colas[i] = [];
        alargarCola(colas[i], q.x, q.y, COLA);
      });
    },
    dibujar(l, quieta) {
      const { ctx } = l;
      ctx.clearRect(0, 0, l.ancho, l.alto);
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      if (quieta) {
        pintar(
          l,
          trazos.map((q) => {
            const linea = [q.x, q.y];
            let [x, y] = [q.x, q.y];
            for (let k = 0; k < PASOS; k++) {
              const a = rumbo(x, y, 0);
              x += Math.cos(a) * LARGO;
              y += Math.sin(a) * LARGO;
              linea.push(x, y);
            }
            return linea;
          }),
          0.45,
          () => 0,
          (m) => m - 1,
        );
        return;
      }
      // La estela, por tramos: del más viejo (tenue) al más nuevo (marcado). Los puntos se cuentan desde el final de
      // cada cola (lo nuevo), y cada tramo empieza donde termina el anterior.
      const porTono = COLA / TONOS;
      for (let tono = 0; tono < TONOS; tono++) {
        pintar(l, colas, (0.7 * (tono + 1)) / TONOS, (m) => m - (COLA - tono * porTono), (m) => m - (COLA - (tono + 1) * porTono));
      }
    },
  };
}

export default function Corrientes({ variante = 1, ...p }: EfectoProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return montarFondo(cv, escena(variante));
  }, [variante]);
  return (
    <CapaEfecto nombre="corrientes" css={CSS} variante={variante} {...p}>
      <canvas ref={ref} className="mk-lienzo" />
    </CapaEfecto>
  );
}
