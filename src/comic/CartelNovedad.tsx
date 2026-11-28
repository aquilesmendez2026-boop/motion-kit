// CartelNovedad: cuando hay algo nuevo, un cartel cuelga de su ancla (la campana, que es su hijo), se mece al llegar y
// queda quieto. Tocarlo llama `alTocar` (abrir las novedades).
import type { ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { Colgante } from "./Colgante";
import { estilosComic } from "./estilos";

export interface CartelNovedadProps {
  texto: ReactNode;
  visible?: boolean;
  alTocar?: () => void;
  /** El ancla: de ahí cuelga el cartel. */
  children: ReactNode;
  /** Lo que lee el lector de pantalla en el cartel (por defecto, «Ver novedades»). */
  etiqueta?: string;
}

export function CartelNovedad({ texto, visible = true, alTocar, children, etiqueta = "Ver novedades" }: CartelNovedadProps) {
  useStyles("comic", estilosComic());
  return (
    <span className="mk-cartel-novedad" style={{ position: "relative", display: "inline-block" }}>
      {children}
      {visible && (
        <button
          type="button"
          onClick={alTocar}
          aria-label={etiqueta}
          style={{ position: "absolute", top: "100%", left: "50%", translate: "-50% 0", zIndex: 5, padding: 0, border: 0, background: "none", cursor: "pointer", font: "inherit" }}
        >
          <Colgante texto={texto} quieto />
        </button>
      )}
    </span>
  );
}
