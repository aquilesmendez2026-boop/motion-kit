import type { HTMLAttributes } from "react";
import { useInView } from "../hooks/useInView";
import { useReducedMotion } from "../hooks/useReducedMotion";

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  /** Desde dónde llega el contenido. */
  direction?: RevealDirection;
  /** Distancia del desplazamiento en píxeles. */
  distance?: number;
  /** Duración en milisegundos. */
  duration?: number;
  /** Espera antes de empezar, en milisegundos. */
  delay?: number;
  /** Si es `true`, anima solo la primera vez que aparece. */
  once?: boolean;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Hace aparecer su contenido (fade + desplazamiento) al entrar en pantalla.
 */
export function Reveal({
  direction = "up",
  distance = 32,
  duration = 700,
  delay = 0,
  once = true,
  style,
  children,
  ...rest
}: RevealProps) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({ once });

  const offsets: Record<RevealDirection, [number, number]> = {
    up: [0, distance],
    down: [0, -distance],
    left: [distance, 0],
    right: [-distance, 0],
    none: [0, 0],
  };
  const [x, y] = offsets[direction];
  const visible = reduced || inView;

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : `translate3d(${x}px, ${y}px, 0)`,
        transition: reduced
          ? "none"
          : `opacity ${duration}ms ${EASE} ${delay}ms, transform ${duration}ms ${EASE} ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
