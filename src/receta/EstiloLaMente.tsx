import { useEffect } from "react";
import { Estilo, type EstiloProps } from "../estilos/Estilo";
import type { EstiloId } from "../estilos/estilos";
import { estiloDesdeLaMente } from "./lamente";

export interface EstiloLaMenteProps extends Omit<EstiloProps, "nombre" | "colores"> {
  /** Tema de La Mente (`hamburgueseria`, `papel`…). Uno desconocido cae al clásico. */
  tema?: string;
  /** Paleta de La Mente (`bosque`, `noche`…). Sin paleta, la del tema. */
  paleta?: string;
  /** Estilo base de motion-kit; por defecto, el de la receta o el que se propone para el tema. */
  base?: EstiloId;
}

const cargadas = new Set<string>();

/**
 * `<Estilo>` con los colores y la letra de un tema y una paleta de La Mente: el encabezado se ve como parte de la
 * página. Sin textura (las páginas de La Mente no la tienen). Con `fuentes`, carga la letra del tema.
 */
export function EstiloLaMente({ tema, paleta, base, fuentes, textura = false, children, ...resto }: EstiloLaMenteProps) {
  const p = estiloDesdeLaMente({ tema, paleta, base });
  useEffect(() => {
    if (!fuentes || typeof document === "undefined" || cargadas.has(p.googleFonts)) return;
    cargadas.add(p.googleFonts);
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = `https://fonts.googleapis.com/css2?${p.googleFonts}&display=swap`;
    document.head.appendChild(l);
  }, [fuentes, p.googleFonts]);
  return (
    <Estilo {...resto} nombre={p.estilo} colores={p.colores} textura={textura} data-lm-tema={tema ?? "clasico"} data-lm-brillo={p.brillo ? "" : undefined} data-lm-claro={p.claro ? "" : undefined}>
      {children}
    </Estilo>
  );
}
