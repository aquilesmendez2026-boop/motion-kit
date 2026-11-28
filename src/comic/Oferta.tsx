// Oferta: un módulo que el negocio no tiene. Un estallido que late con lo destacado («¡30 días gratis!»), lo que el front
// ya muestra (su tarjeta) y, si hay, la acción con la mano que la señala.
import type { HTMLAttributes, ReactNode } from "react";
import { useInView } from "../hooks/useInView";
import { useStyles } from "../utils/styles";
import { Apunta, useTelefono } from "./Apunta";
import { Estallido } from "./Estallido";
import { estilosComic } from "./estilos";
import { estilosInvitar } from "./Vacio";

export interface OfertaProps extends HTMLAttributes<HTMLDivElement> {
  /** El texto del estallido (lo pone el front con los datos del módulo). */
  destacado: string;
  children: ReactNode;
  accion?: ReactNode;
}

export function Oferta({ destacado, children, accion, className, ...resto }: OfertaProps) {
  useStyles("comic", estilosComic());
  useStyles("comic-invitar", estilosInvitar());
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  const tel = useTelefono();
  return (
    <div ref={ref} className={`mk-oferta${className ? ` ${className}` : ""}`} {...resto}>
      <Estallido texto={destacado} tamano={124} />
      <div className="mk-oferta-cuerpo">
        {children}
        {accion && (
          <div className="mk-invitar-accion" data-tel={tel || undefined}>
            <Apunta direccion={tel ? "abajo" : "derecha"} activo={inView} ancho={96} />
            {accion}
          </div>
        )}
      </div>
    </div>
  );
}
