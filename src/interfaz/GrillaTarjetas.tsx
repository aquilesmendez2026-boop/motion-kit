// La grilla de las tarjetas de una sección del panel (`ListaTarjetas` de La Mente): una columna en el teléfono y dos
// desde pantallas grandes (Aquiles, 27-11: «que no ocupen todo el ancho, solo la mitad, así vemos 2 cards»).
import type { HTMLAttributes, ReactNode } from "react";
import { useStyles } from "../utils/styles";

export interface GrillaTarjetasProps extends HTMLAttributes<HTMLElement> {
  /** `div` cuando las tarjetas son artículos y no una lista. */
  como?: "ul" | "div";
  children: ReactNode;
}

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-grilla-tarjetas{display:grid;grid-template-columns:minmax(0,1fr);gap:1.25rem;align-items:stretch;list-style:none;margin:0;padding:0}
@media (min-width:1024px){.mk-grilla-tarjetas{grid-template-columns:repeat(2,minmax(0,1fr))}}`);

export function GrillaTarjetas({ como = "ul", className, children, ...resto }: GrillaTarjetasProps) {
  useStyles("grilla-tarjetas", estilos());
  const Etiqueta = como;
  return (
    <Etiqueta {...resto} className={className ? `mk-grilla-tarjetas ${className}` : "mk-grilla-tarjetas"}>
      {children}
    </Etiqueta>
  );
}
