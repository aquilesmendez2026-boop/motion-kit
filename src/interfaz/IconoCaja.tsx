// El ícono de una sección en su cuadradito de cartel (el `IconoModulo` del panel de La Mente). Lee el tema: trazo,
// esquina del ícono, amarillo de cartel y la tinta sobre él. Ver docs/un-solo-motor/piezas-del-panel.md.
import type { HTMLAttributes, ReactNode } from "react";
import { useStyles } from "../utils/styles";

export interface IconoCajaProps extends HTMLAttributes<HTMLSpanElement> {
  /** El lado en píxeles (44 por defecto; 56 en una tarjeta o un vacío, 36 en una fila chica). */
  tamano?: 36 | 44 | 56;
  /** El ícono (un SVG). */
  children: ReactNode;
}

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-icono-caja{display:grid;place-items:center;flex-shrink:0;box-sizing:border-box;border:var(--mk-trazo,2.5px solid var(--mk-texto,#1C1A22));border-radius:var(--mk-radio-icono,10px);background:var(--mk-cartel,#ffc83d);color:var(--mk-sobre-sol,#10223f)}
.mk-icono-caja>svg{width:48%;height:48%}`);

export function IconoCaja({ tamano = 44, className, style, children, ...resto }: IconoCajaProps) {
  useStyles("icono-caja", estilos());
  return (
    <span aria-hidden="true" {...resto} className={className ? `mk-icono-caja ${className}` : "mk-icono-caja"} data-mk-adorno="icono" style={{ width: tamano, height: tamano, ...style }}>
      {children}
    </span>
  );
}
