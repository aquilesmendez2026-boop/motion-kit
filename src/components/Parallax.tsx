import { useEffect, useRef, type HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { onScrollFrame } from "../utils/scroll";

export interface ParallaxProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Cuánto se mueve respecto al scroll. 0.2 = sutil, 0.5 = marcado.
   * En negativo se mueve en sentido contrario.
   */
  speed?: number;
  /** Eje del movimiento. */
  axis?: "y" | "x";
}

/**
 * Mueve su contenido a una velocidad distinta a la del scroll, para dar
 * sensación de profundidad. Conviene usar valores chicos.
 */
export function Parallax({
  speed = 0.2,
  axis = "y",
  style,
  children,
  ...rest
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (reduced) {
      element.style.transform = "none";
      return;
    }

    let offset = 0;
    return onScrollFrame(() => {
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      // Posición real del elemento, sin contar lo que ya lo movimos.
      const top = rect.top - (axis === "y" ? offset : 0);
      if (top > viewport * 1.5 || top + rect.height < -viewport * 0.5) return;

      const fromCenter = top + rect.height / 2 - viewport / 2;
      offset = -fromCenter * speed;
      element.style.transform =
        axis === "y"
          ? `translate3d(0, ${offset.toFixed(1)}px, 0)`
          : `translate3d(${offset.toFixed(1)}px, 0, 0)`;
    });
  }, [speed, axis, reduced]);

  return (
    <div ref={ref} style={{ willChange: "transform", ...style }} {...rest}>
      {children}
    </div>
  );
}
