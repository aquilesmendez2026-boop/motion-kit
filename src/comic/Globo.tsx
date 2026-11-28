// El globo de diálogo de cómic: borde grueso, sombra dura y su cola. Toma el texto y la superficie del tema.
import type { HTMLAttributes } from "react";
import { useStyles } from "../utils/styles";
import { estilosComic } from "./estilos";

export interface GloboProps extends HTMLAttributes<HTMLSpanElement> {
  /** Hacia dónde sale la cola. */
  cola?: "abajo" | "arriba" | "izquierda" | "derecha";
  /** Entra con un pequeño salto (al montarse). */
  entra?: boolean;
  /** Letra de cartel (mayúsculas, inclinada). */
  cartel?: boolean;
}

export function Globo({ cola = "abajo", entra = true, cartel = true, className, children, ...resto }: GloboProps) {
  useStyles("comic", estilosComic());
  return (
    <span className={`mk-globo${cartel ? " mk-letra-cartel" : ""}${className ? ` ${className}` : ""}`} data-cola={cola} data-entra={entra || undefined} {...resto}>
      {children}
    </span>
  );
}
