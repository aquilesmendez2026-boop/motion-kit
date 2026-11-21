import { useEffect, useRef, type HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { onScrollFrame } from "../utils/scroll";

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  /** Se esconde al bajar y vuelve al subir. */
  hideOnScroll?: boolean;
  /** Píxeles de scroll a partir de los cuales toma fondo. */
  threshold?: number;
  /** Fondo cuando la página ya se movió. */
  background?: string;
}

/**
 * Barra superior fija. Parte transparente, toma fondo con desenfoque al bajar,
 * y puede esconderse mientras se baja para dejar más espacio en el teléfono.
 * Al elemento se le pone `data-scrolled="true"` para estilos propios.
 */
export function Navbar({
  hideOnScroll = true,
  threshold = 24,
  background = "rgba(11, 11, 18, 0.78)",
  style,
  children,
  ...rest
}: NavbarProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let last = window.scrollY;

    return onScrollFrame(() => {
      const y = window.scrollY;
      const scrolled = y > threshold;
      element.dataset.scrolled = String(scrolled);
      element.style.background = scrolled ? background : "transparent";
      element.style.backdropFilter = scrolled ? "blur(14px)" : "none";
      element.style.setProperty("-webkit-backdrop-filter", scrolled ? "blur(14px)" : "none");

      if (hideOnScroll) {
        const goingDown = y > last + 4;
        const goingUp = y < last - 4;
        // No se esconde si alguien está navegando adentro con el teclado.
        const focused = element.contains(document.activeElement);
        if (!scrolled || goingUp || focused) element.style.transform = "translate3d(0, 0, 0)";
        else if (goingDown) element.style.transform = "translate3d(0, -100%, 0)";
      } else {
        element.style.transform = "translate3d(0, 0, 0)";
      }
      if (Math.abs(y - last) > 4) last = y;
    });
  }, [hideOnScroll, threshold, background]);

  return (
    <header
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 950,
        paddingTop: "env(safe-area-inset-top)",
        transition: reduced
          ? "none"
          : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), background 250ms ease",
        ...style,
      }}
      {...rest}
    >
      {children}
    </header>
  );
}
