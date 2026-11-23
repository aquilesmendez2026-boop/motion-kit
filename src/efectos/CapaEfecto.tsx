import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { useStyles } from "../utils/styles";
import type { Variante } from "./tokens";

const BASE = `
.mk-capa{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;contain:paint}
.mk-capa[data-quieto="true"] *{animation-play-state:paused!important}
.mk-col{position:absolute;height:100%;width:0;display:flex;flex-direction:column;align-items:center;will-change:transform}
.mk-col>*{display:block;flex:none}
.mk-caer{top:-14%;animation:mk-caer linear infinite}
.mk-sube{top:14%;justify-content:flex-end;animation:mk-subir linear infinite}
@keyframes mk-caer{0%{transform:translateY(0);opacity:0}10%{opacity:1}85%{opacity:1}100%{transform:translateY(128%);opacity:0}}
@keyframes mk-subir{0%{transform:translateY(0);opacity:0}12%{opacity:1}80%{opacity:1}100%{transform:translateY(-128%);opacity:0}}
@keyframes mk-giro{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes mk-vaiven{0%,100%{transform:translateX(-10px)}50%{transform:translateX(10px)}}
@keyframes mk-titilar{0%,100%{opacity:.15}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.mk-capa *,.mk-capa *::before,.mk-capa *::after{animation:none!important}}
`;

export interface CapaEfectoProps extends HTMLAttributes<HTMLDivElement> {
  /** Identificador del efecto; el CSS se inyecta una sola vez por nombre. */
  nombre: string;
  css: string;
  variante?: Variante;
  children: ReactNode;
}

/**
 * Capa decorativa detrás del contenido: no recibe toques, no la lee el lector de pantalla,
 * se pausa fuera de pantalla y queda quieta (pero visible) con «reducir movimiento».
 */
export function CapaEfecto({ nombre, css, variante = 1, children, className, ...resto }: CapaEfectoProps) {
  useStyles("efectos-base", BASE);
  useStyles(`efecto-${nombre}`, css);
  const ref = useRef<HTMLDivElement>(null);
  const [quieto, setQuieto] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([e]) => setQuieto(!e.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      {...resto}
      ref={ref}
      aria-hidden="true"
      className={`mk-capa mk-${nombre}${className ? " " + className : ""}`}
      data-variante={variante}
      data-quieto={quieto ? "true" : "false"}
    >
      {children}
    </div>
  );
}
