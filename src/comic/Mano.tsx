// La mano de cómic que apunta (SVG propio, dibujada a partir de la referencia de Aquiles). Apunta a la derecha y se gira
// con `direccion`. `toca`: avanza, toca y salen las rayitas de «¡pop!». La punta del dedo está en PUNTA_MANO.
import type { HTMLAttributes } from "react";
import { c } from "../interfaz/tema";
import { useStyles } from "../utils/styles";
import { estilosComic } from "./estilos";
import type { Direccion, Piel } from "./calculo";

const PIELES: Record<Piel, [string, string]> = {
  clara: ["#ffd9bd", "#e9a98a"],
  media: ["#f7c9a4", "#d8936d"],
  morena: ["#c98b62", "#9c6342"],
  oscura: ["#8d5a3b", "#663f28"],
};
const GIRO: Record<Direccion, string> = { derecha: "none", izquierda: "scaleX(-1)", arriba: "rotate(-90deg)", abajo: "rotate(90deg)" };

export interface ManoProps extends HTMLAttributes<HTMLSpanElement> {
  /** Ancho en px (el alto es la mitad). */
  ancho?: number;
  piel?: Piel;
  /** Color de la manga (por defecto, el acento del tema). */
  manga?: string;
  direccion?: Direccion;
  /** Avanza y toca, una y otra vez. */
  toca?: boolean;
  /** Toca una sola vez y queda quieta. */
  unaVez?: boolean;
  /** Las rayitas de «¡pop!» al tocar. */
  pop?: boolean;
}

/** Decorativa: `aria-hidden`. Con «reducir movimiento» queda quieta (y el pop, a la vista). */
export function Mano({ ancho = 160, piel = "media", manga, direccion = "derecha", toca = true, unaVez = false, pop = true, className, style, ...resto }: ManoProps) {
  useStyles("comic", estilosComic());
  const [p, s] = PIELES[piel] ?? PIELES.media;
  return (
    <span
      className={`mk-mano${className ? ` ${className}` : ""}`}
      data-una={unaVez || undefined}
      data-direccion={direccion}
      style={{ width: ancho, height: ancho / 2, transform: GIRO[direccion], ...style }}
      aria-hidden="true"
      {...resto}
    >
      <svg viewBox="0 0 300 150" width={ancho} height={ancho / 2}>
        <g className={toca || unaVez ? "mk-mano-toca" : undefined} strokeLinejoin="round" strokeLinecap="round">
          <path d="M-6 18 L70 26 L74 134 L-6 144 Z" fill={manga ?? c("acento")} stroke="#111" strokeWidth="6" />
          <path d="M8 40 L40 44 M6 112 L44 106" stroke="rgba(255,255,255,.22)" strokeWidth="7" fill="none" />
          <path d="M66 28 L94 30 L96 130 L68 132 Z" fill="#f6f6fa" stroke="#111" strokeWidth="6" />
          <path d="M69 104 L95 102 L96 128 L70 130 Z" fill="#c9c9d6" />
          <path d="M92 44 Q96 22 124 22 L184 30 Q206 36 206 60 L204 106 Q200 130 170 130 L114 130 Q92 126 92 104 Z" fill={p} stroke="#111" strokeWidth="6" />
          <path d="M96 108 Q120 124 170 124 Q196 122 202 100 L204 124 Q190 132 160 132 L112 132 Q94 128 94 112 Z" fill={s} />
          <path d="M162 60 Q214 54 216 70 Q216 86 162 84" fill={p} stroke="#111" strokeWidth="6" />
          <path d="M158 84 Q210 80 210 96 Q209 110 156 107" fill={p} stroke="#111" strokeWidth="6" />
          <path d="M152 107 Q198 104 198 117 Q196 130 150 128" fill={p} stroke="#111" strokeWidth="6" />
          <path d="M170 78 Q200 80 212 76 M166 102 Q194 104 206 100 M160 124 Q184 126 194 122" stroke={s} strokeWidth="5" fill="none" />
          <path d="M112 48 Q132 58 152 56 M114 70 Q132 78 150 76 M118 92 Q132 98 146 96" stroke="#111" strokeWidth="3" fill="none" opacity=".55" />
          <path d="M184 28 L272 34 Q294 36 294 50 Q294 63 272 64 L188 64 Z" fill={p} stroke="#111" strokeWidth="6" />
          <path d="M190 58 L270 58 Q286 58 290 54 Q288 62 272 64 L190 64 Z" fill={s} />
          <path d="M222 37 Q226 46 222 54 M228 37 Q232 46 228 54 M250 38 Q253 46 250 53" stroke="#111" strokeWidth="2.6" fill="none" />
          <path d="M268 40 Q288 39 289 50 Q288 59 268 58 Q263 49 268 40 Z" fill="#fff4ec" stroke="#111" strokeWidth="3" />
          <path d="M126 58 Q160 44 196 58 Q204 68 192 74 Q160 66 130 74 Q118 68 126 58 Z" fill={p} stroke="#111" strokeWidth="6" />
          <path d="M184 64 Q194 62 196 58" stroke={s} strokeWidth="4" fill="none" />
        </g>
        {pop && (toca || unaVez) && (
          <g stroke="#111" strokeWidth="5" strokeLinejoin="round" fill="#ffc21a">
            <path className="mk-pop" d="M276 22 L262 -6 L274 -9 L286 18 Z" />
            <path className="mk-pop" d="M296 26 L306 -2 L318 3 L304 30 Z" />
          </g>
        )}
      </svg>
    </span>
  );
}
