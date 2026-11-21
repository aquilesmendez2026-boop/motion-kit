import { useRef, type HTMLAttributes, type PointerEvent } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Inclinación máxima en grados. */
  maxTilt?: number;
  /** Escala al pasar el mouse por encima. */
  scale?: number;
  /** Distancia de la perspectiva en píxeles (menor = más dramático). */
  perspective?: number;
  /** Muestra un brillo que sigue al cursor. */
  glare?: boolean;
}

const FOLLOW = "transform 100ms ease-out";
const RETURN = "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Tarjeta que se inclina en 3D siguiendo al mouse, o hacia donde se toca.
 */
export function TiltCard({
  maxTilt = 10,
  scale = 1.03,
  perspective = 800,
  glare = false,
  style,
  onPointerMove,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  onPointerCancel,
  children,
  ...rest
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Con mouse sigue al cursor; con el dedo se inclina hacia donde se toca.
  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || reduced) return;

    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 2 * maxTilt;
    const rotateX = -(py - 0.5) * 2 * maxTilt;

    card.style.transition = FOLLOW;
    card.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;

    const glareEl = glareRef.current;
    if (glareEl) {
      glareEl.style.opacity = "1";
      glareEl.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.35), transparent 55%)`;
    }
  };

  const reset = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.transition = RETURN;
    card.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;

    if (glareRef.current) glareRef.current.style.opacity = "0";
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        tilt(event);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        tilt(event);
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        reset();
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (event.pointerType !== "mouse") reset();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        reset();
      }}
      style={{
        position: "relative",
        transformStyle: "preserve-3d",
        transition: RETURN,
        willChange: "transform",
        ...style,
      }}
      {...rest}
    >
      {children}
      {glare && !reduced && (
        <div
          ref={glareRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: 0,
            transition: "opacity 300ms ease",
          }}
        />
      )}
    </div>
  );
}
