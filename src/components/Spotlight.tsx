import { useRef, type HTMLAttributes, type PointerEvent } from "react";

export interface SpotlightProps extends HTMLAttributes<HTMLDivElement> {
  /** Color de la luz. */
  color?: string;
  /** Diámetro de la luz en píxeles. */
  size?: number;
}

/**
 * Tarjeta con una luz suave que sigue al cursor o al dedo.
 */
export function Spotlight({
  color = "rgba(124, 92, 255, 0.35)",
  size = 360,
  style,
  onPointerMove,
  onPointerLeave,
  children,
  ...rest
}: SpotlightProps) {
  const lightRef = useRef<HTMLDivElement>(null);

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const light = lightRef.current;
    if (!light) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    light.style.opacity = "1";
    light.style.background = `radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 65%)`;
  };

  const handleLeave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event);
    if (lightRef.current) lightRef.current.style.opacity = "0";
  };

  return (
    <div
      onPointerMove={handleMove}
      onPointerDown={handleMove}
      onPointerLeave={handleLeave}
      onPointerCancel={handleLeave}
      style={{ position: "relative", overflow: "hidden", ...style }}
      {...rest}
    >
      <div
        ref={lightRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          pointerEvents: "none",
          transition: "opacity 400ms ease",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
