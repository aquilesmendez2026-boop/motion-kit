import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ButtonHTMLAttributes,
  type PointerEvent,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface MagneticButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Cuánto se acerca al cursor (0 = nada, 1 = lo sigue por completo). */
  strength?: number;
}

const FOLLOW = "transform 120ms ease-out";
const RETURN = "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)";

/**
 * Botón que se mueve hacia el cursor (o hacia el dedo al tocarlo) y vuelve con
 * un pequeño rebote al soltar.
 */
export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  function MagneticButton(
    {
      strength = 0.35,
      style,
      onPointerMove,
      onPointerDown,
      onPointerLeave,
      onPointerUp,
      onPointerCancel,
      children,
      ...rest
    },
    forwardedRef
  ) {
    const innerRef = useRef<HTMLButtonElement>(null);
    const reduced = useReducedMotion();

    useImperativeHandle(forwardedRef, () => innerRef.current as HTMLButtonElement);

    // Con mouse sigue al cursor; con el dedo se mueve hacia donde se toca.
    const follow = (event: PointerEvent<HTMLButtonElement>) => {
      const element = innerRef.current;
      if (!element || reduced) return;

      const rect = element.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);

      element.style.transition = FOLLOW;
      element.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
    };

    const reset = () => {
      const element = innerRef.current;
      if (!element) return;

      element.style.transition = RETURN;
      element.style.transform = "translate3d(0, 0, 0)";
    };

    return (
      <button
        ref={innerRef}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          follow(event);
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          follow(event);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          reset();
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          // Con mouse el cursor sigue encima; con el dedo ya se soltó.
          if (event.pointerType !== "mouse") reset();
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          reset();
        }}
        style={{ transition: RETURN, willChange: "transform", ...style }}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
