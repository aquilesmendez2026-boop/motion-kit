// Precios (bloque): las listas de precios llegan como cartas que se abren en abanico; la destacada va adelante con un
// borde de luz que la recorre. Las cartas son enlaces reales.
import type { CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { abanicoDe, esEnlaceSeguro } from "./calculos";

export interface CartaQueSeAbreProps extends ComunesMomento {
  listas: { titulo: string; href: string }[];
  /** Índice de la lista destacada. Fuera de rango o sin valor: ninguna se adelanta. */
  destacada?: number;
}

export const CSS_CARTA =
  ".mk-m-carta-lista{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}" +
  ".mk-m-carta-item{position:relative;display:flex;align-items:flex-end;min-height:120px;padding:1rem;border-radius:14px;overflow:hidden;isolation:isolate;" +
  "background:var(--mk-m-superficie);color:var(--mk-m-texto);text-decoration:none;font-weight:700;font-size:1.05rem;" +
  "border:1px solid color-mix(in srgb,var(--mk-m-texto) 14%,transparent);box-shadow:0 10px 26px -16px rgba(0,0,0,.5)}" +
  ".mk-m-carta-item span{position:relative;z-index:1}" +
  ".mk-m-carta-item:focus-visible{outline:3px solid var(--mk-m-acento);outline-offset:3px}" +
  ".mk-m-carta-item[data-destacada]{transform:scale(1.04);z-index:1;border-color:transparent}" +
  ".mk-m-carta-item[data-destacada]::before{content:\"\";position:absolute;inset:-60%;z-index:-2;background:conic-gradient(from 0deg,transparent 0 62%,var(--mk-m-acento) 82%,transparent 100%)}" +
  ".mk-m-carta-item[data-destacada]::after{content:\"\";position:absolute;inset:2px;z-index:-1;border-radius:12px;background:var(--mk-m-superficie)}" +
  ".mk-m-carta[data-activo][data-nivel=completo] .mk-m-carta-item[data-destacada]::before{animation:mk-m-gira 3.2s linear infinite}" +
  "@keyframes mk-m-gira{to{transform:rotate(1turn)}}" +
  ".mk-m-carta:not([data-nivel=quieto]):not([data-activo]) .mk-m-carta-item{transform:translateY(30px) rotate(var(--giro)) scale(.9)}" +
  ".mk-m-carta[data-activo]:not([data-nivel=quieto]) .mk-m-carta-item{transition:transform var(--mk-resorte-ms) var(--mk-resorte-curva) calc(var(--i)*90ms)}" +
  ".mk-m-carta[data-nivel=liviano]:not([data-activo]) .mk-m-carta-item{transform:translateY(30px)}";

export function CartaQueSeAbre({ listas, destacada, nivel: forzado, ahorro, className }: CartaQueSeAbreProps) {
  useStyles("momento-carta", CSS_CARTA);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  if (!listas.length) return null;
  const d = destacada !== undefined && Number.isInteger(destacada) && destacada >= 0 && destacada < listas.length ? destacada : -1;
  // La destacada va primero; el resto en su orden.
  const orden = d < 0 ? listas.map((l, i) => ({ l, i })) : [{ l: listas[d], i: d }, ...listas.map((l, i) => ({ l, i })).filter((x) => x.i !== d)];
  const giros = abanicoDe(orden.length);
  return (
    <div ref={ref} className={["mk-momento mk-m-carta", className].filter(Boolean).join(" ")} data-momento="carta" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      <ul className="mk-m-carta-lista">
        {orden.map(({ l, i }, k) => (
          <li key={i}>
            <a className="mk-m-carta-item" href={esEnlaceSeguro(l.href) ? l.href : undefined} data-destacada={i === d ? "" : undefined} style={{ "--i": k, "--giro": `${giros[k]}deg` } as CSSProperties}>
              <span>{l.titulo}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
