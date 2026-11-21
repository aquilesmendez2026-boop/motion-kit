import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ButtonHTMLAttributes,
  type PointerEvent,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface PressableProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Escala mientras está presionado (0.96 = se achica un 4 %). */
  scale?: number;
}

const DOWN = "transform 90ms ease-out";
const UP = "transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)";

/**
 * Botón que se hunde al tocarlo y vuelve con un rebote. Funciona igual con
 * dedo, mouse y lápiz, así que es el efecto base para móvil.
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  function Pressable(
    {
      scale = 0.96,
      style,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      children,
      ...rest
    },
    forwardedRef
  ) {
    const innerRef = useRef<HTMLButtonElement>(null);
    const reduced = useReducedMotion();
    useImperativeHandle(forwardedRef, () => innerRef.current as HTMLButtonElement);

    const press = (down: boolean) => {
      const element = innerRef.current;
      if (!element || reduced) return;
      element.style.transition = down ? DOWN : UP;
      element.style.transform = down ? `scale(${scale})` : "scale(1)";
    };

    const release =
      (handler?: (event: PointerEvent<HTMLButtonElement>) => void) =>
      (event: PointerEvent<HTMLButtonElement>) => {
        handler?.(event);
        press(false);
      };

    return (
      <button
        ref={innerRef}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          press(true);
        }}
        onPointerUp={release(onPointerUp)}
        onPointerLeave={release(onPointerLeave)}
        onPointerCancel={release(onPointerCancel)}
        style={{
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
