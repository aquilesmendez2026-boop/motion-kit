// Objetos del rubro que caen: se apilan al fondo del encabezado y el dedo o el cursor los empuja. Un lienzo 2D con
// física propia (fisica.ts). Con «reducir movimiento» o en nivel liviano se dibuja la pila ya en reposo, sin moverse.
import { useEffect, useRef } from "react";
import { CapaEfecto } from "../CapaEfecto";
import { crearLienzo, CSS_LIENZO, puntoEn, seguirQuietud, zonaPuntero, type Lienzo } from "../lienzo";
import type { EfectoProps } from "../tokens";
import { apilados, cantidadObjetos, crearCuerpos, despertar, dormir, golpe, pasoFisica, todoQuieto, type Cuerpo, type Dedo } from "./fisica";
import { OBJETOS } from "./objetos";

const CSS = CSS_LIENZO;

/** En pantallas anchas los objetos van más grandes, hasta una vez y media. */
const ANGOSTO = 700;
const ESCALA_MAXIMA = 1.5;
/** La física va a pasos fijos, aunque la pantalla refresque más rápido o más lento. */
const PASO = 1 / 60;
/** El seguro: si después de tantos pasos sin que nadie los toque siguen moviéndose, se duermen donde están. */
const PASOS_MAXIMOS = 1500;
const ORDEN = Object.keys(OBJETOS);

export function Caida({ objeto, variante = 1, ...p }: { objeto: keyof typeof OBJETOS } & EfectoProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const trazo = new Path2D(OBJETOS[objeto]);
    const semilla = variante * 7 + ORDEN.indexOf(objeto);
    let cuerpos: Cuerpo[] = [];
    let cantidad = 0;
    /** Sin simular: la pila en reposo (movimiento reducido o nivel liviano). */
    let quieta = false;
    let acumulado = 0;
    let pasos = 0;
    let dedo: Dedo | null = null;
    let ultimo: { x: number; y: number; t: number } | null = null;

    const mundo = (l: Lienzo) => ({ ancho: l.ancho, alto: l.alto });
    /** Los deja en reposo de una vez (para la pila quieta). */
    const asentar = (l: Lienzo) => {
      for (let i = 0; i < 900 && !todoQuieto(cuerpos); i++) pasoFisica(cuerpos, mundo(l), PASO);
      dormir(cuerpos);
    };

    const paso = (dt: number, l: Lienzo) => {
      if (!l.ancho || !l.alto) return false;
      if (!quieta) {
        acumulado = Math.min(acumulado + dt, PASO * 3);
        while (acumulado >= PASO) {
          acumulado -= PASO;
          pasoFisica(cuerpos, mundo(l), PASO, dedo);
          dedo = null;
          if (++pasos > PASOS_MAXIMOS) dormir(cuerpos);
        }
      }
      const { ctx } = l;
      ctx.clearRect(0, 0, l.ancho, l.alto);
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      cuerpos.forEach((b, i) => {
        // El dibujo es una caja de 24 con su centro en (12, 12) y cabe en un círculo de radio 11.
        const escala = b.r / 11;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.a);
        ctx.scale(escala, escala);
        ctx.translate(-12, -12);
        ctx.strokeStyle = i % 2 ? l.claro : l.color;
        ctx.stroke(trazo);
        ctx.restore();
      });
      return !quieta && (dedo !== null || !todoQuieto(cuerpos));
    };

    const alCambiar = (l: Lienzo) => {
      if (!l.ancho || !l.alto) return;
      quieta = quietud.quieta();
      pasos = 0;
      if (!cantidad) {
        // La primera vez: cuántos son, y parten cayendo (o ya apilados, si no se mueven).
        cantidad = cantidadObjetos(variante, l.ancho);
        const escala = Math.max(1, Math.min(ESCALA_MAXIMA, l.ancho / ANGOSTO));
        cuerpos = quieta ? apilados(cantidad, mundo(l), semilla, escala) : crearCuerpos(cantidad, mundo(l), semilla, escala);
      } else {
        // Otro tamaño: los mismos objetos se reacomodan y quedan adentro.
        despertar(cuerpos);
        if (quieta) asentar(l);
      }
    };

    /** El nivel o «reducir movimiento» cambió: si ahora no se mueven, se asientan de una vez. */
    const quietud = seguirQuietud(cv, () => {
      const ahora = quietud.quieta();
      if (!lienzo || ahora === quieta) return;
      quieta = ahora;
      pasos = 0;
      if (quieta) asentar(lienzo);
      lienzo.correr();
    });
    const lienzo = crearLienzo(cv, paso, alCambiar);
    if (!lienzo) return quietud.soltar;

    const zona = zonaPuntero(cv);
    const mover = (ev: PointerEvent) => {
      if (quieta) return;
      const ahora = puntoEn(cv, ev);
      const dt = ultimo ? ahora.t - ultimo.t : 0;
      if (ultimo && dt > 0 && dt < 120) {
        const d: Dedo = { ...ahora, vx: ((ahora.x - ultimo.x) / dt) * 1000, vy: ((ahora.y - ultimo.y) / dt) * 1000, r: ev.pointerType === "mouse" ? 36 : 46 };
        // Solo cuenta si alcanza a alguno: mover el cursor lejos de la pila no la despierta.
        if (cuerpos.some((b) => Math.hypot(b.x - d.x, b.y - d.y) < d.r + b.r)) {
          dedo = d;
          pasos = 0;
          lienzo.correr();
        }
      }
      ultimo = ahora;
    };
    const tocar = (ev: PointerEvent) => {
      if (quieta) return;
      const { x, y } = puntoEn(cv, ev);
      golpe(cuerpos, x, y);
      if (!todoQuieto(cuerpos)) {
        pasos = 0;
        lienzo.correr();
      }
    };
    zona?.addEventListener("pointermove", mover, { passive: true });
    zona?.addEventListener("pointerdown", tocar, { passive: true });

    return () => {
      zona?.removeEventListener("pointermove", mover);
      zona?.removeEventListener("pointerdown", tocar);
      quietud.soltar();
      lienzo.destruir();
    };
  }, [objeto, variante]);

  return (
    <CapaEfecto nombre="caida" css={CSS} variante={variante} {...p}>
      <canvas ref={ref} className="mk-lienzo" />
    </CapaEfecto>
  );
}
