import { useRef, type HTMLAttributes } from "react";
import { useScrollProgress } from "../hooks/useScrollProgress";

export interface ScrollProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Color de la barra (acepta cualquier fondo CSS, también degradados). */
  color?: string;
  /** Alto de la barra en píxeles. */
  height?: number;
  /** Pegada arriba o abajo de la pantalla. */
  position?: "top" | "bottom";
}

/**
 * Barra fija que se llena a medida que se avanza por la página.
 */
export function ScrollProgress({
  color = "#7c5cff",
  height = 3,
  position = "top",
  style,
  ...rest
}: ScrollProgressProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useScrollProgress((progress) => {
    if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
  });

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: position === "top" ? 0 : undefined,
        bottom: position === "bottom" ? 0 : undefined,
        height,
        background: color,
        transform: "scaleX(0)",
        transformOrigin: "0 50%",
        zIndex: 1000,
        pointerEvents: "none",
        ...style,
      }}
      {...rest}
    />
  );
}
