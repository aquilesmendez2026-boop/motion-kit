// Enlaces: los botones se levantan uno tras otro, como fichas de dominó al revés, y después quedan quietos. Son
// enlaces a otros sitios: abren en otra pestaña y dicen su red en texto (sin logos). Uno al que se le apunta o se
// aprieta deja de moverse, para que el clic no se pierda.
import type { CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { nombreDeRed } from "./calculos-2";

export interface EnlaceDomino {
  titulo: string;
  /** La red (`youtube`, `spotify`, `instagram`…): se muestra su nombre. */
  red: string;
  /** Solo `http` o `https`; cualquier otra cosa no se dibuja. */
  url: string;
}

export interface EnlacesDominoProps extends ComunesMomento {
  enlaces: EnlaceDomino[];
}

export const CSS_ENLACES =
  ".mk-m-enlaces-lista{list-style:none;margin:0 auto;padding:0;display:grid;gap:10px;max-width:28rem}" +
  ".mk-m-enlace{display:grid;justify-items:center;gap:2px;min-height:48px;padding:10px 18px;border-radius:999px;color:inherit;text-decoration:none;text-align:center;" +
  "border:2px solid var(--mk-m-acento);transform-origin:50% 100%}" +
  ".mk-m-enlace:focus-visible{outline:3px solid var(--mk-m-acento);outline-offset:2px}" +
  ".mk-m-enlace-titulo{font-weight:700}" +
  ".mk-m-enlace-red{font-size:.78rem;color:var(--mk-m-suave)}" +
  ".mk-m-enlaces[data-activo][data-nivel=completo] .mk-m-enlace{animation:mk-m-domino var(--mk-resorte-ms,600ms) var(--mk-resorte-curva,cubic-bezier(.2,.8,.2,1)) both;animation-delay:calc(var(--i)*90ms)}" +
  // Al que se le apunta, se enfoca o se aprieta, se detiene donde va (con la misma fuerza que la regla que lo anima;
  // quitarle la animación lo haría entrar de nuevo al sacar el cursor).
  ".mk-m-enlaces[data-activo][data-nivel=completo] .mk-m-enlace:is(:hover,:focus-visible,:active){animation-play-state:paused}" +
  // Se levanta desde un poco tumbado: nunca tanto que no se lea. La perspectiva va en el propio giro (la de la lista no
  // llega hasta el enlace).
  "@keyframes mk-m-domino{from{transform:perspective(600px) rotateX(-38deg) translateY(6px)}to{transform:none}}";

const esWeb = (url: unknown): url is string => typeof url === "string" && /^https?:\/\//i.test(url.trim());

export default function EnlacesDomino({ enlaces, nivel: forzado, ahorro, className }: EnlacesDominoProps) {
  useStyles("momento-enlaces", CSS_ENLACES);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const lista = Array.isArray(enlaces) ? enlaces.filter((e) => e && typeof e.titulo === "string" && esWeb(e.url)) : [];
  if (!lista.length) return null;
  return (
    <div ref={ref} className={["mk-momento mk-m-enlaces", className].filter(Boolean).join(" ")} data-momento="enlaces" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      <ul className="mk-m-enlaces-lista">
        {lista.map((e, i) => (
          <li key={i}>
            <a className="mk-m-enlace" href={e.url.trim()} target="_blank" rel="noopener noreferrer" style={{ "--i": i } as CSSProperties}>
              <span className="mk-m-enlace-titulo">{e.titulo}</span>
              {nombreDeRed(e.red) && <span className="mk-m-enlace-red">{nombreDeRed(e.red)}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
