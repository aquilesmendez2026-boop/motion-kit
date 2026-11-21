import type { HTMLAttributes } from "react";

export interface DeviceFrameProps extends HTMLAttributes<HTMLDivElement> {
  /** Ancho del teléfono en píxeles. El alto se calcula solo. */
  width?: number;
  /** Color del marco. */
  frameColor?: string;
  /** Color de fondo de la pantalla. */
  screenColor?: string;
}

/**
 * Marco de teléfono genérico para mostrar una pantalla móvil dentro de una
 * página (por ejemplo, en la portada de una plantilla). El contenido se puede
 * deslizar adentro.
 */
export function DeviceFrame({
  width = 300,
  frameColor = "#15151f",
  screenColor = "#0b0b12",
  style,
  children,
  ...rest
}: DeviceFrameProps) {
  const border = Math.round(width * 0.035);

  return (
    <div
      style={{
        position: "relative",
        width,
        maxWidth: "100%",
        aspectRatio: "9 / 19",
        padding: border,
        borderRadius: width * 0.16,
        background: frameColor,
        boxShadow:
          "0 0 0 1px rgba(255, 255, 255, 0.14), 0 30px 60px rgba(0, 0, 0, 0.45)",
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden auto",
          borderRadius: width * 0.16 - border,
          background: screenColor,
          // Crea un contexto propio: lo `fixed` de adentro queda dentro del marco.
          transform: "translateZ(0)",
        }}
      >
        {children}
      </div>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: border + width * 0.03,
          left: "50%",
          width: width * 0.28,
          height: width * 0.07,
          transform: "translateX(-50%)",
          borderRadius: 999,
          background: frameColor,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
