// Una sección del panel en su hoja: el título en letra de cartel, para qué sirve, una acción y lo de adentro. Junta
// las copias a mano de «sección» del front de La Mente. Ver docs/un-solo-motor/piezas-del-panel.md.
import type { HTMLAttributes, ReactNode } from "react";
import { useStyles } from "../utils/styles";

export interface SeccionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  titulo: ReactNode;
  bajada?: ReactNode;
  accion?: ReactNode;
  children?: ReactNode;
}

const T = "var(--mk-texto,#1C1A22)";
let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-seccion{box-sizing:border-box;display:flex;flex-direction:column;gap:1rem;padding:18px 20px;color:${T};background:var(--mk-superficie,#fff);border:var(--mk-trazo,2.5px solid ${T});border-radius:var(--mk-radio-tarjeta,14px);box-shadow:var(--mk-sombra,4px 4px 0 ${T})}
.mk-seccion-cabeza{display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-start;justify-content:space-between}
.mk-seccion-titulo{margin:0;font-family:var(--mk-fuente-cartel,inherit);font-weight:400;font-size:1.25rem;line-height:1.15;overflow-wrap:anywhere}
.mk-seccion-bajada{margin:4px 0 0;line-height:1.5;color:var(--mk-suave,#5E5A68)}`);

export function Seccion({ titulo, bajada, accion, className, children, ...resto }: SeccionProps) {
  useStyles("seccion", estilos());
  return (
    <section {...resto} className={className ? `mk-seccion ${className}` : "mk-seccion"} data-mk-adorno="hoja">
      <div className="mk-seccion-cabeza">
        <div>
          <h2 className="mk-seccion-titulo" data-mk-adorno="titulo">{titulo}</h2>
          {bajada && <p className="mk-seccion-bajada">{bajada}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}
