import type { HTMLAttributes, ReactNode } from "react";
import { useStyles } from "../utils/styles";

export type AlScrollAnimacion = "subir" | "aparecer" | "escalar" | "girar" | "desde-izquierda" | "desde-derecha" | "parallax" | "alejar";

export interface AlScrollProps extends HTMLAttributes<HTMLDivElement> {
  animacion: AlScrollAnimacion;
  /** Para «parallax»: cuánto se desplaza (px). Positivo va más lento que el scroll. */
  intensidad?: number;
  children?: ReactNode;
}

const CSS = `
@keyframes mk-s-subir{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:none}}
@keyframes mk-s-aparecer{from{opacity:0}to{opacity:1}}
@keyframes mk-s-escalar{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
@keyframes mk-s-girar{from{opacity:0;transform:rotate(-8deg) translateY(40px)}to{opacity:1;transform:none}}
@keyframes mk-s-izq{from{opacity:0;transform:translateX(-80px)}to{opacity:1;transform:none}}
@keyframes mk-s-der{from{opacity:0;transform:translateX(80px)}to{opacity:1;transform:none}}
@keyframes mk-s-parallax{from{transform:translateY(calc(var(--mk-intensidad) * 1px))}to{transform:translateY(calc(var(--mk-intensidad) * -1px))}}
@keyframes mk-s-alejar{from{opacity:1;transform:none}to{opacity:0;transform:scale(.9) translateY(-40px)}}
@keyframes mk-s-pista{from{transform:translateX(0)}to{transform:translateX(calc(-100% + 100vw - var(--mk-gh-margen,0px) * 2))}}
@supports (animation-timeline:view()){@media (prefers-reduced-motion:no-preference){
.mk-scroll{animation:var(--mk-s) linear both;animation-timeline:view();animation-range:entry 0% cover 38%}
.mk-scroll[data-a=subir]{--mk-s:mk-s-subir}.mk-scroll[data-a=aparecer]{--mk-s:mk-s-aparecer}.mk-scroll[data-a=escalar]{--mk-s:mk-s-escalar}
.mk-scroll[data-a=girar]{--mk-s:mk-s-girar}.mk-scroll[data-a=desde-izquierda]{--mk-s:mk-s-izq}.mk-scroll[data-a=desde-derecha]{--mk-s:mk-s-der}
.mk-scroll[data-a=parallax]{--mk-s:mk-s-parallax;animation-range:cover 0% cover 100%}
.mk-scroll[data-a=alejar]{--mk-s:mk-s-alejar;animation-range:exit 0% exit 100%}
.mk-gh{view-timeline:--mk-gh block}
.mk-gh-fijo{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;display:flex;flex-direction:column;justify-content:center}
.mk-gh-pista{display:flex;width:max-content;animation:mk-s-pista linear both;animation-timeline:--mk-gh;animation-range:contain 0% contain 100%}
}}
.mk-gh-pista{display:flex;gap:var(--mk-gh-espacio,1.25rem);padding-inline:var(--mk-gh-margen,1rem)}
.mk-gh-pista>*{flex:none}
@supports not (animation-timeline:view()){.mk-gh{height:auto!important}.mk-gh-fijo{overflow-x:auto;scroll-snap-type:x mandatory}.mk-gh-pista>*{scroll-snap-align:start}}
@media (prefers-reduced-motion:reduce){.mk-gh{height:auto!important}.mk-gh-fijo{overflow-x:auto;scroll-snap-type:x mandatory}.mk-gh-pista>*{scroll-snap-align:start}}
`;

/**
 * Animación que avanza con el scroll, hecha con CSS nativo (sin JavaScript corriendo al hacer scroll).
 * Donde el navegador no la soporta, o con «reducir movimiento», el contenido se ve quieto.
 */
export function AlScroll({ animacion, intensidad = 60, className, style, ...resto }: AlScrollProps) {
  useStyles("al-scroll", CSS);
  return (
    <div
      {...resto}
      className={`mk-scroll${className ? " " + className : ""}`}
      data-a={animacion}
      style={{ ...(animacion === "parallax" ? ({ "--mk-intensidad": intensidad } as React.CSSProperties) : null), ...style }}
    />
  );
}

export interface GaleriaHorizontalProps extends HTMLAttributes<HTMLElement> {
  /** Encabezado fijo arriba de la pista. */
  titulo?: ReactNode;
  /** Cuánto scroll vertical dura el recorrido, en alturas de pantalla. */
  largo?: number;
  children: ReactNode;
}

/**
 * Galería que se mueve de lado mientras la persona baja. Sin soporte o con «reducir movimiento»
 * queda como una fila que se desliza con el dedo.
 */
export function GaleriaHorizontal({ titulo, largo = 3, className, style, children, ...resto }: GaleriaHorizontalProps) {
  useStyles("al-scroll", CSS);
  return (
    <section {...resto} className={`mk-gh${className ? " " + className : ""}`} style={{ height: `${largo * 100}vh`, ...style }}>
      <div className="mk-gh-fijo">
        {titulo}
        <div className="mk-gh-pista">{children}</div>
      </div>
    </section>
  );
}
