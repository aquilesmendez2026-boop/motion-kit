import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { CSS_LUZ } from "./css";
import { Materia, type MateriaProps } from "./Materia";

/**
 * Una tarjeta holográfica: se inclina hacia el cursor o el dedo y su arcoíris cambia con el ángulo. Para una
 * membresía, un cupón o un sello. Es una `Materia` holográfica con la inclinación ya puesta.
 */
export function TarjetaHolografica({ inclina = 14, altura = 2, ...resto }: Omit<MateriaProps, "tipo">) {
  return <Materia {...resto} tipo="holografico" inclina={inclina} altura={altura} />;
}

export interface TituloConVolumenProps extends HTMLAttributes<HTMLElement> {
  /** Cuántas capas de espesor, de 2 a 12. Por defecto 6. */
  espesor?: number;
  /** La etiqueta que dibuja. Por defecto, `h2`. */
  como?: ElementType;
  children?: ReactNode;
}

/** Las capas del costado (una por píxel de espesor) y la sombra que deja el título, al lado contrario de la luz. */
function capas(n: number): string {
  const en = (k: number, resto: string) => `calc(var(--mk-lz-vx)*${k}) calc(var(--mk-lz-vy)*${k}) ${resto}`;
  return [...Array.from({ length: n }, (_, k) => en(k + 1, "0 var(--mk-lz-lado)")), en(n + 5, "12px rgba(0,0,0,.38)")].join(",");
}

/**
 * Un título con espesor: el costado cae al lado contrario de la luz de la página y toma su color del color del texto.
 * Sigue siendo texto: se lee, se selecciona y lo dice un lector de pantalla.
 */
export function TituloConVolumen({ espesor = 6, como: Como = "h2", className, style, children, ...resto }: TituloConVolumenProps) {
  useStyles("luz", CSS_LUZ);
  const n = typeof espesor === "number" && Number.isFinite(espesor) ? Math.max(2, Math.min(12, Math.round(espesor))) : 6;
  return (
    <Como {...resto} className={`mk-lz-volumen${className ? ` ${className}` : ""}`} style={{ textShadow: capas(n), ...style } as CSSProperties}>
      {children}
    </Como>
  );
}
