// Una tarjeta de una lista del panel (`TarjetaItem` de La Mente): la foto o el ícono, el título con su estado, el
// detalle y, abajo, las acciones; se levanta al pasar. Ver docs/un-solo-motor/piezas-del-panel.md.
import type { HTMLAttributes, ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { IconoCaja } from "./IconoCaja";
import { Pastilla } from "./Pastilla";
import type { TonoEstado } from "./tonos";

export interface TarjetaFilaProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** `article` (con su `aria-label`) cuando la tarjeta no va en una lista. */
  como?: "li" | "article";
  foto?: string;
  /** El ícono (un SVG), si no hay foto; va en su caja de 56 px. */
  icono?: ReactNode;
  titulo: ReactNode;
  estado?: { texto: string; tono: TonoEstado };
  detalle?: ReactNode;
  acciones?: ReactNode;
  /** Va al final (una confirmación, un error, el QR). */
  pie?: ReactNode;
}

const T = "var(--mk-texto,#1C1A22)";
let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-tarjeta-fila{list-style:none;display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:16px 18px;color:${T};background:var(--mk-superficie,#fff);border:var(--mk-trazo,2.5px solid ${T});border-radius:var(--mk-radio-tarjeta,14px);box-shadow:var(--mk-sombra,4px 4px 0 ${T});transition:transform 120ms ease-out}
.mk-tarjeta-fila:hover{transform:var(--mk-levantar,translate(-1px,-1px));box-shadow:var(--mk-sombra-pasar,5px 5px 0 ${T})}
.mk-tarjeta-fila-arriba{display:flex;gap:1rem;align-items:center}
.mk-tarjeta-fila-foto{width:56px;height:56px;object-fit:cover;flex-shrink:0;box-sizing:border-box;border:var(--mk-trazo,2.5px solid ${T});border-radius:var(--mk-radio-icono,10px)}
.mk-tarjeta-fila-textos{display:flex;flex-direction:column;gap:.25rem;flex:1;min-width:0}
.mk-tarjeta-fila-titulo{display:flex;flex-wrap:wrap;align-items:center;gap:.625rem}
.mk-tarjeta-fila-nombre{margin:0;font-weight:700;font-size:1.02rem;overflow-wrap:anywhere}
.mk-tarjeta-fila-detalle{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;color:var(--mk-suave,#5E5A68);font-size:.9rem}
.mk-tarjeta-fila-detalle a{color:${T};font-weight:600;text-decoration:underline;text-underline-offset:3px}
.mk-tarjeta-fila-acciones{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin-top:auto;padding-top:1rem}
.mk-tarjeta-fila-pie{margin-top:.75rem}
@media (prefers-reduced-motion:reduce){.mk-tarjeta-fila{transition:none}.mk-tarjeta-fila:hover{transform:none}}`);

export function TarjetaFila({ como = "li", foto, icono, titulo, estado, detalle, acciones, pie, className, ...resto }: TarjetaFilaProps) {
  useStyles("tarjeta-fila", estilos());
  const Etiqueta = como;
  return (
    <Etiqueta {...resto} className={className ? `mk-tarjeta-fila ${className}` : "mk-tarjeta-fila"} data-mk-adorno="hoja">
      <div className="mk-tarjeta-fila-arriba">
        {foto ? <img className="mk-tarjeta-fila-foto" src={foto} alt="" /> : icono ? <IconoCaja tamano={56}>{icono}</IconoCaja> : null}
        <div className="mk-tarjeta-fila-textos">
          <div className="mk-tarjeta-fila-titulo">
            {/* El título es el encabezado de la tarjeta (h3, bajo el h2 de la sección): así se recorre con el lector. */}
            <h3 className="mk-tarjeta-fila-nombre">{titulo}</h3>
            {estado && <Pastilla tono={estado.tono}>{estado.texto}</Pastilla>}
          </div>
          {detalle && <div className="mk-tarjeta-fila-detalle">{detalle}</div>}
        </div>
      </div>
      {acciones && <div className="mk-tarjeta-fila-acciones">{acciones}</div>}
      {pie && <div className="mk-tarjeta-fila-pie">{pie}</div>}
    </Etiqueta>
  );
}
