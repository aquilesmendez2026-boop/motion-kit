// El estallido de cómic («¡Nuevo!», «¡30 días gratis!»): una estrella con sombra dura que late. La letra se ajusta a la
// palabra más larga para no salirse.
import type { HTMLAttributes } from "react";
import { CARTEL } from "../interfaz/tema";
import { useStyles } from "../utils/styles";
import { estilosComic } from "./estilos";
import { letraEstallido } from "./calculo";

const PUNTAS = 14;
/** Los puntos de la estrella: se calculan al dibujar la primera (así el módulo se puede descartar si no se usa). */
let puntos: string | undefined;
const estrella = () =>
  (puntos ??= Array.from({ length: PUNTAS * 2 }, (_, i) => {
    const r = i % 2 ? 38 : 50;
    const a = (i / (PUNTAS * 2)) * Math.PI * 2;
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" "));

export interface EstallidoProps extends HTMLAttributes<HTMLSpanElement> {
  texto: string;
  /** Lado en px. */
  tamano?: number;
  /** Relleno (por defecto, el amarillo de cartel). */
  color?: string;
  /** Late suave. */
  late?: boolean;
}

export function Estallido({ texto, tamano = 140, color, late = true, className, style, ...resto }: EstallidoProps) {
  useStyles("comic", estilosComic());
  return (
    <span className={`mk-estallido${className ? ` ${className}` : ""}`} data-late={late || undefined} style={{ width: tamano, height: tamano, ...style }} {...resto}>
      <svg viewBox="-4 -4 108 108" width={tamano} height={tamano} aria-hidden="true">
        <polygon points={estrella()} fill="#111" transform="translate(4 4)" />
        <polygon points={estrella()} fill={color ?? CARTEL} stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <span className="mk-letra-cartel" style={{ fontSize: letraEstallido(texto, tamano) }}>{texto}</span>
    </span>
  );
}
