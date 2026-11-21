import type { HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface GlowBorderProps extends HTMLAttributes<HTMLDivElement> {
  /** Colores de la luz que recorre el borde. */
  colors?: string[];
  /** Grosor del borde en píxeles. */
  borderWidth?: number;
  /** Radio de las esquinas en píxeles. */
  radius?: number;
  /** Segundos que tarda una vuelta. */
  speed?: number;
  /** Fondo del interior de la tarjeta. */
  background?: string;
}

const CSS = `@keyframes motion-kit-spin { to { transform: translate(-50%, -50%) rotate(360deg); } }`;

/**
 * Tarjeta con una luz de colores que da vueltas por el borde. Sirve para
 * destacar un plan, una oferta o el bloque principal.
 */
export function GlowBorder({
  colors = ["#7c5cff", "#ff5ca8", "#3ecbff"],
  borderWidth = 1.5,
  radius = 20,
  speed = 5,
  background = "#12121c",
  style,
  children,
  ...rest
}: GlowBorderProps) {
  useStyles("glow-border", CSS);
  const reduced = useReducedMotion();
  const stops = ["transparent 0deg", ...colors, "transparent 200deg"].join(", ");

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: borderWidth,
        borderRadius: radius,
        background: "rgba(128, 128, 128, 0.22)",
        ...style,
      }}
      {...rest}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          // Cuadrado más grande que la tarjeta, para que al girar la cubra entera.
          width: "max(150%, 150vh)",
          aspectRatio: "1",
          background: `conic-gradient(${stops})`,
          transform: "translate(-50%, -50%)",
          animation: reduced ? "none" : `motion-kit-spin ${speed}s linear infinite`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          borderRadius: Math.max(0, radius - borderWidth),
          background,
        }}
      >
        {children}
      </div>
    </div>
  );
}
