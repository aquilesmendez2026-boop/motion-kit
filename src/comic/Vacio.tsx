// Vacio: la sección vacía que invita. El ícono, qué falta y la acción para crear lo primero, con la mano de cómic que la
// señala: toca una vez cuando la sección entra en pantalla y queda apuntando.
import type { HTMLAttributes, ReactNode } from "react";
import { useInView } from "../hooks/useInView";
import { c, letra } from "../interfaz/tema";
import { useStyles } from "../utils/styles";
import { Apunta, useTelefono } from "./Apunta";
import { estilosComic } from "./estilos";

export interface VacioProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  icono?: ReactNode;
  titulo: ReactNode;
  texto?: ReactNode;
  /** El botón o enlace para crear lo primero: la mano lo señala. */
  accion?: ReactNode;
}

let css: string | undefined;
export const estilosInvitar = () =>
  (css ??= `
.mk-vacio{display:grid;justify-items:center;text-align:center;gap:10px}
.mk-vacio-titulo{margin:0;font-weight:800;font-size:1.15rem;font-family:${letra("fuenteTitulo", "inherit")}}
.mk-vacio-texto{margin:0;max-width:46ch;color:${c("suave")}}
.mk-invitar-accion{display:flex;align-items:center;justify-content:center}
.mk-invitar-accion[data-tel]{flex-direction:column}
.mk-oferta{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center}
.mk-oferta-cuerpo{display:grid;gap:8px;justify-items:start;min-width:0;flex:1 1 220px}`);

export function Vacio({ icono, titulo, texto, accion, className, ...resto }: VacioProps) {
  useStyles("comic", estilosComic());
  useStyles("comic-invitar", estilosInvitar());
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  const tel = useTelefono();
  return (
    <div ref={ref} className={`mk-vacio${className ? ` ${className}` : ""}`} {...resto}>
      {icono}
      <p className="mk-vacio-titulo">{titulo}</p>
      {texto && <p className="mk-vacio-texto">{texto}</p>}
      {accion && (
        <div className="mk-invitar-accion" data-tel={tel || undefined}>
          <Apunta direccion={tel ? "abajo" : "derecha"} activo={inView} />
          {accion}
        </div>
      )}
    </div>
  );
}
