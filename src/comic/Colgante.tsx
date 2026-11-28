// El cartel que cuelga de dos cuerdas y se mece. `quieto`: se mece al llegar y después queda quieto.
import type { HTMLAttributes, ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { estilosComic } from "./estilos";

export interface ColganteProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  texto: ReactNode;
  quieto?: boolean;
}

export function Colgante({ texto, quieto = false, className, ...resto }: ColganteProps) {
  useStyles("comic", estilosComic());
  return (
    <span className={`mk-colgante${className ? ` ${className}` : ""}`} data-quieto={quieto || undefined} {...resto}>
      <svg className="mk-colgante-cuerda" viewBox="0 0 90 34" aria-hidden="true">
        <circle cx="45" cy="4" r="4" fill="#111" />
        <path d="M45 4 L12 34 M45 4 L78 34" stroke="#111" strokeWidth="3" fill="none" />
      </svg>
      <span className="mk-colgante-tabla mk-letra-cartel">{texto}</span>
    </span>
  );
}
