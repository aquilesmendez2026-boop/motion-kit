import { useRef, type HTMLAttributes, type PointerEvent } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface RippleProps extends HTMLAttributes<HTMLDivElement> {
  /** Color de la onda. */
  color?: string;
  /** Duración de la onda en milisegundos. */
  duration?: number;
}

const CSS = `@keyframes motion-kit-ripple { to { transform: scale(1); opacity: 0; } }`;

/**
 * Contenedor que dibuja una onda desde el punto donde se toca o hace clic.
 * Sirve para envolver botones, filas de lista o tarjetas.
 */
export function Ripple({
  color = "rgba(255, 255, 255, 0.35)",
  duration = 600,
  style,
  onPointerDown,
  children,
  ...rest
}: RippleProps) {
  useStyles("ripple", CSS);
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    const host = ref.current;
    if (!host || reduced) return;

    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // Radio suficiente para cubrir hasta la esquina más lejana.
    const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));

    const wave = document.createElement("span");
    wave.setAttribute("aria-hidden", "true");
    Object.assign(wave.style, {
      position: "absolute",
      left: `${x - radius}px`,
      top: `${y - radius}px`,
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      borderRadius: "50%",
      background: color,
      pointerEvents: "none",
      transform: "scale(0)",
      opacity: "1",
      animation: `motion-kit-ripple ${duration}ms ease-out forwards`,
    });
    wave.addEventListener("animationend", () => wave.remove());
    host.appendChild(wave);
  };

  return (
    <div
      ref={ref}
      onPointerDown={handleDown}
      style={{
        position: "relative",
        overflow: "hidden",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
