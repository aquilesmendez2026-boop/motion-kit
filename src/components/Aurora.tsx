import type { HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface AuroraProps extends HTMLAttributes<HTMLDivElement> {
  /** Colores de las manchas de luz. */
  colors?: string[];
  /** Desenfoque en píxeles. */
  blur?: number;
  /** Segundos que tarda un ciclo de movimiento. */
  speed?: number;
  /** Intensidad, de 0 a 1. */
  intensity?: number;
}

const CSS = `
@keyframes motion-kit-aurora-a { 50% { transform: translate3d(18%, 12%, 0) scale(1.25); } }
@keyframes motion-kit-aurora-b { 50% { transform: translate3d(-16%, -10%, 0) scale(0.85); } }
@keyframes motion-kit-aurora-c { 50% { transform: translate3d(10%, -18%, 0) scale(1.15); } }
`;

const SPOTS = [
  { left: "-10%", top: "-20%", width: "60%", height: "70%", name: "a" },
  { left: "45%", top: "-10%", width: "65%", height: "75%", name: "b" },
  { left: "15%", top: "40%", width: "70%", height: "70%", name: "c" },
];

/**
 * Fondo de luces de colores que se mueven lento. Va dentro de un contenedor
 * con `position: relative` y lo cubre completo, por detrás del contenido.
 */
export function Aurora({
  colors = ["#7c5cff", "#ff5ca8", "#3ecbff"],
  blur = 80,
  speed = 18,
  intensity = 0.55,
  style,
  ...rest
}: AuroraProps) {
  useStyles("aurora", CSS);
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        opacity: intensity,
        ...style,
      }}
      {...rest}
    >
      {SPOTS.map((spot, i) => (
        <div
          key={spot.name}
          style={{
            position: "absolute",
            left: spot.left,
            top: spot.top,
            width: spot.width,
            height: spot.height,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors[i % colors.length]}, transparent 68%)`,
            filter: `blur(${blur}px)`,
            animation: reduced
              ? "none"
              : `motion-kit-aurora-${spot.name} ${speed + i * 4}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}
