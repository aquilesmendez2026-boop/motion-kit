import type { HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { c } from "../interfaz/tema";
import { useStyles } from "../utils/styles";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Ancho (número = píxeles, o cualquier medida CSS). */
  width?: number | string;
  /** Alto (número = píxeles, o cualquier medida CSS). */
  height?: number | string;
  /** Radio de las esquinas. Usa 999 para un círculo o una píldora. */
  radius?: number | string;
}

const CSS = `@keyframes motion-kit-skeleton{to{background-position:-200% 0}}`;

/**
 * Bloque gris con un brillo que lo recorre, para mostrar mientras carga el
 * contenido real.
 */
export function Skeleton({
  width = "100%",
  height = 16,
  radius = 8,
  style,
  ...rest
}: SkeletonProps) {
  useStyles("skeleton", CSS);
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: `color-mix(in srgb,${c("texto")} 10%,transparent)`,
        backgroundImage: `linear-gradient(90deg,transparent 25%,color-mix(in srgb,${c("superficie")} 60%,transparent) 50%,transparent 75%)`,
        backgroundSize: "200% 100%",
        backgroundPosition: "200% 0",
        animation: reduced ? "none" : "motion-kit-skeleton 1.6s linear infinite",
        ...style,
      }}
      {...rest}
    />
  );
}
