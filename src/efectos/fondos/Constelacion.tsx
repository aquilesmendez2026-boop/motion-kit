// Constelación: puntos que derivan despacio y se unen con líneas cuando quedan cerca. El dedo o el cursor los atrae y
// se suma como un punto más. Un lienzo 2D. Con «reducir movimiento» o en nivel liviano queda un cuadro, sin moverse.
import { useEffect, useRef } from "react";
import { CapaEfecto } from "../CapaEfecto";
import { crearLienzo, CSS_LIENZO, puntoEn, seguirQuietud, zonaPuntero, type Lienzo } from "../lienzo";
import type { EfectoProps } from "../tokens";
import { cantidadPuntos, crearPuntos, enlaces, moverPuntos, type Punto } from "./calculo-constelacion";

const CSS = CSS_LIENZO;

/** Cerca del borde se apagan: así no desaparecen de golpe al dar la vuelta. */
const BORDE = 30;
/** Las líneas se dibujan en pocas tandas, de la más tenue a la más marcada. */
const TANDAS = 4;
/** Se mueve lento: con 30 dibujos por segundo alcanza, y es la mitad del trabajo (y de la batería). */
const CADA = 1 / 30;

export default function Constelacion({ variante = 1, ...p }: EfectoProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let puntos: Punto[] = [];
    let ancho = 0;
    let alto = 0;
    let distancia = 110;
    let quieta = false;
    let dedo: { x: number; y: number } | null = null;
    let pendiente = 0;

    /** De 0 a 1: cuánto se ve un punto según lo cerca que está del borde. */
    const brillo = (q: { x: number; y: number }) => Math.max(0, Math.min(1, q.x / BORDE, (ancho - q.x) / BORDE, q.y / BORDE, (alto - q.y) / BORDE));

    const paso = (dt: number, l: Lienzo) => {
      if (!ancho || !alto) return false;
      if (!quieta && dt > 0) {
        // Entre un dibujo y otro se junta el tiempo: los cuadros de más no hacen nada.
        pendiente += dt;
        if (pendiente < CADA - 0.004) return true;
        moverPuntos(puntos, pendiente, ancho, alto, dedo);
        pendiente = 0;
      }
      const { ctx } = l;
      ctx.clearRect(0, 0, ancho, alto);
      // El dedo cuenta como un punto más para las líneas (no se dibuja). En la versión quieta no se le sigue.
      const nodos: { x: number; y: number }[] = dedo && !quieta ? [...puntos, dedo] : puntos;
      const luz = nodos.map((q, i) => (i < puntos.length ? brillo(q) : 1));
      const pares = enlaces(nodos, distancia);
      ctx.lineWidth = 1;
      ctx.strokeStyle = l.color;
      for (let tanda = 1; tanda <= TANDAS; tanda++) {
        ctx.beginPath();
        for (const [i, j, fuerza] of pares) {
          if (Math.ceil(fuerza * Math.min(luz[i], luz[j]) * TANDAS) !== tanda) continue;
          ctx.moveTo(nodos[i].x, nodos[i].y);
          ctx.lineTo(nodos[j].x, nodos[j].y);
        }
        ctx.globalAlpha = (tanda / TANDAS) * 0.5;
        ctx.stroke();
      }
      ctx.fillStyle = l.claro;
      puntos.forEach((q, i) => {
        ctx.globalAlpha = 0.85 * luz[i];
        ctx.beginPath();
        ctx.arc(q.x, q.y, 1.4 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
      return !quieta;
    };

    const alCambiar = (l: Lienzo) => {
      if (!l.ancho || !l.alto) return;
      quieta = quietud.quieta();
      if (!puntos.length) {
        puntos = crearPuntos(cantidadPuntos(variante, l.ancho, quieta), l.ancho, l.alto, variante);
      } else {
        // Otro tamaño: los mismos puntos, repartidos en la caja nueva.
        for (const q of puntos) {
          q.x *= l.ancho / ancho;
          q.y *= l.alto / alto;
        }
      }
      ancho = l.ancho;
      alto = l.alto;
      tejer();
    };
    /** Con pocos puntos en una caja grande, las líneas alcanzan más lejos (y al revés): siempre se arma una red. */
    const tejer = () => {
      // En la versión quieta van menos puntos (si venía corriendo, se quedan los primeros).
      if (quieta) puntos.length = Math.min(puntos.length, cantidadPuntos(variante, ancho, true));
      distancia = Math.max(90, Math.min(170, Math.sqrt((ancho * alto) / Math.max(1, puntos.length)) * 1.15));
    };

    const quietud = seguirQuietud(cv, () => {
      quieta = quietud.quieta();
      if (ancho && alto) tejer();
      lienzo?.correr();
    });
    const lienzo = crearLienzo(cv, paso, alCambiar);
    if (!lienzo) return quietud.soltar;

    const zona = zonaPuntero(cv);
    const mover = (ev: PointerEvent) => {
      const { x, y } = puntoEn(cv, ev);
      dedo = { x, y };
    };
    const salir = () => {
      dedo = null;
    };
    zona?.addEventListener("pointermove", mover, { passive: true });
    zona?.addEventListener("pointerleave", salir);
    zona?.addEventListener("pointerup", salir);
    zona?.addEventListener("pointercancel", salir);

    return () => {
      zona?.removeEventListener("pointermove", mover);
      zona?.removeEventListener("pointerleave", salir);
      zona?.removeEventListener("pointerup", salir);
      zona?.removeEventListener("pointercancel", salir);
      quietud.soltar();
      lienzo.destruir();
    };
  }, [variante]);

  return (
    <CapaEfecto nombre="constelacion" css={CSS} variante={variante} {...p}>
      <canvas ref={ref} className="mk-lienzo" />
    </CapaEfecto>
  );
}
