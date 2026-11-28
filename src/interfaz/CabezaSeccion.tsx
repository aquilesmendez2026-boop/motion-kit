// La cabecera de una sección del panel (el `EncabezadoModulo` de La Mente): el ícono en su caja, el título en letra de
// cartel, para qué sirve y la acción principal a la derecha. Ver docs/un-solo-motor/piezas-del-panel.md.
import type { HTMLAttributes, ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { IconoCaja } from "./IconoCaja";

export interface CabezaSeccionProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** El ícono (un SVG); va en su caja de 44 px. */
  icono?: ReactNode;
  titulo: ReactNode;
  bajada?: ReactNode;
  accion?: ReactNode;
}

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-cabeza-seccion{display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-start;justify-content:space-between;color:var(--mk-texto,#1C1A22)}
.mk-cabeza-seccion-lado{display:flex;gap:.875rem;align-items:center;flex:1 1 100%;min-width:0}
@media (min-width:768px){.mk-cabeza-seccion{align-items:center}.mk-cabeza-seccion-lado{flex-basis:0}}
.mk-cabeza-seccion-textos{min-width:0}
.mk-titulo-seccion{margin:0;font-family:var(--mk-fuente-cartel,inherit);font-weight:400;font-size:clamp(1.45rem,1.2rem + .9vw,1.9rem);line-height:1.1;letter-spacing:-.01em;overflow-wrap:anywhere}
.mk-bajada-seccion{margin:4px 0 0;line-height:1.5;color:var(--mk-suave,#5E5A68)}
.mk-cabeza-seccion-accion{flex-shrink:0}`);

export function CabezaSeccion({ icono, titulo, bajada, accion, className, ...resto }: CabezaSeccionProps) {
  useStyles("cabeza-seccion", estilos());
  return (
    <div {...resto} className={className ? `mk-cabeza-seccion ${className}` : "mk-cabeza-seccion"} data-mk-adorno="hoja">
      <div className="mk-cabeza-seccion-lado">
        {icono && <IconoCaja>{icono}</IconoCaja>}
        <div className="mk-cabeza-seccion-textos">
          <h2 className="mk-titulo-seccion" data-mk-adorno="titulo">{titulo}</h2>
          {bajada && <p className="mk-bajada-seccion">{bajada}</p>}
        </div>
      </div>
      {accion && <div className="mk-cabeza-seccion-accion">{accion}</div>}
    </div>
  );
}
