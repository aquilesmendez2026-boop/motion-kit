import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface GradientTextProps extends HTMLAttributes<HTMLElement> {
  /** Colores del degradado (mínimo dos). */
  colors?: string[];
  /** Segundos que tarda una vuelta completa. */
  speed?: number;
  /** Etiqueta HTML a usar. */
  as?: ElementType;
}

const CSS = `@keyframes motion-kit-gradient { to { background-position: -200% 50%; } }`;

/**
 * Texto relleno con un degradado que se desplaza de forma continua.
 */
export function GradientText({
  colors = ["#7c5cff", "#ff5ca8", "#ffb45c"],
  speed = 6,
  as: Tag = "span",
  style,
  children,
  ...rest
}: GradientTextProps) {
  useStyles("gradient-text", CSS);
  const reduced = useReducedMotion();
  // Se repite el primer color al final para que el ciclo no tenga corte.
  const stops = [...colors, colors[0]].join(", ");

  const base: CSSProperties = {
    backgroundImage: `linear-gradient(90deg, ${stops})`,
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    animation: reduced ? "none" : `motion-kit-gradient ${speed}s linear infinite`,
  };

  return (
    <Tag style={{ ...base, ...style }} {...rest}>
      {children}
    </Tag>
  );
}
