import { useMemo, type SVGAttributes } from "react";
import { caminoQR } from "../utils/qr";

export interface CodigoQRProps extends Omit<SVGAttributes<SVGSVGElement>, "children"> {
  /** Lo que guarda el código (una URL, normalmente). */
  texto: string;
  /** Tamaño en píxeles. */
  tam?: number;
  /** Color de los módulos; el fondo va blanco para que cualquier cámara lo lea. */
  color?: string;
  /** Texto para lectores de pantalla. */
  etiqueta?: string;
}

/** Código QR en SVG, generado en el navegador sin librerías. */
export function CodigoQR({ texto, tam = 180, color = "#111", etiqueta, ...resto }: CodigoQRProps) {
  const { d, lado } = useMemo(() => caminoQR(texto), [texto]);
  return (
    <svg {...resto} width={tam} height={tam} viewBox={`0 0 ${lado} ${lado}`} role="img" aria-label={etiqueta ?? `Código QR: ${texto}`} shapeRendering="crispEdges">
      <rect width={lado} height={lado} fill="#fff" />
      <path d={d} fill={color} />
    </svg>
  );
}
