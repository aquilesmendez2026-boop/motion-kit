import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface ShinyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Segundos entre un destello y el siguiente. */
  interval?: number;
  /** Color del destello. */
  shine?: string;
}

const CSS = `
@keyframes motion-kit-shine {
  0% { transform: translate3d(-120%, 0, 0) skewX(-20deg); }
  35%, 100% { transform: translate3d(320%, 0, 0) skewX(-20deg); }
}`;

/**
 * Botón con un destello de luz que lo cruza cada cierto tiempo. Para el
 * llamado a la acción principal de una página.
 */
export const ShinyButton = forwardRef<HTMLButtonElement, ShinyButtonProps>(
  function ShinyButton(
    { interval = 3.2, shine = "rgba(255, 255, 255, 0.45)", style, children, ...rest },
    ref
  ) {
    useStyles("shiny-button", CSS);
    const reduced = useReducedMotion();

    return (
      <button
        ref={ref}
        style={{ position: "relative", overflow: "hidden", ...style }}
        {...rest}
      >
        <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
        {!reduced && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "40%",
              background: `linear-gradient(90deg, transparent, ${shine}, transparent)`,
              pointerEvents: "none",
              animation: `motion-kit-shine ${interval}s ease-in-out infinite`,
            }}
          />
        )}
      </button>
    );
  }
);
