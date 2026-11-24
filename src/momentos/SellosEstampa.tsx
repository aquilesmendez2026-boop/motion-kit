// Sellos: los sellos ganados se estampan uno tras otro y el del premio late. El texto dice cuántos van.
import { useMemo, useState, type CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { vibrar } from "../estilos/sonidos";
import { CSS_LATE, useMomento, type ComunesMomento } from "./base";
import { girosSellos, limitesSellos } from "./calculos";

export interface SellosEstampaProps extends ComunesMomento {
  /** Cuántos sellos completan el premio (en La Mente, `sellosPremio`). */
  total: number;
  /** Cuántos lleva la persona (en La Mente, `sellos`). */
  llenos: number;
  premio: string;
  /** El `slug` del negocio: decide el giro de cada sello. */
  semilla?: string;
}

export const CSS_SELLOS =
  ".mk-m-sellos-lista{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:10px;max-width:420px}" +
  ".mk-m-sellos-lista li{aspect-ratio:1;border-radius:50%;border:2px dashed var(--mk-m-suave);display:grid;place-items:center;color:var(--mk-m-sobre)}" +
  ".mk-m-sellos-lista li[data-lleno]{border:2px solid var(--mk-m-acento);background:var(--mk-m-acento);cursor:pointer}" +
  ".mk-m-sellos-lista li[data-premio]:not([data-lleno]){border-style:solid;border-color:var(--mk-m-acento);color:var(--mk-m-acento)}" +
  ".mk-m-sellos-lista svg{width:55%;height:55%}" +
  ".mk-m-sellos-texto{margin:.75rem 0 0;font-weight:600}" +
  ".mk-m-sellos:not([data-nivel=quieto]):not([data-activo]) li[data-lleno]{opacity:0}" +
  ".mk-m-sellos[data-activo]:not([data-nivel=quieto]) li[data-lleno]{animation:mk-m-estampa var(--mk-resorte-ms) var(--mk-resorte-curva) both;animation-delay:calc(var(--i)*120ms)}" +
  ".mk-m-sellos[data-activo][data-nivel=liviano] li[data-lleno]{animation-name:mk-m-estampa-suave}" +
  "@keyframes mk-m-estampa{from{opacity:0;transform:scale(1.8) rotate(var(--giro))}30%{opacity:1}to{opacity:1;transform:none}}" +
  "@keyframes mk-m-estampa-suave{from{opacity:0;transform:scale(1.3)}to{opacity:1;transform:none}}" +
  ".mk-m-sellos[data-activo][data-nivel=completo] .mk-m-sellos-lista{animation:mk-m-sacude .3s ease-out both;animation-delay:calc(var(--mk-m-n)*120ms + var(--mk-resorte-ms)*.4)}" +
  "@keyframes mk-m-sacude{0%,100%{transform:none}25%{transform:translate(-3px,1px)}50%{transform:translate(2px,-2px)}75%{transform:translate(-1px,1px)}}" +
  ".mk-m-sellos[data-activo][data-nivel=completo] li[data-premio]:not([data-lleno]){animation:mk-m-late 1.6s ease-in-out infinite}";

const Visto = () => (
  <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Regalo = () => (
  <svg viewBox="0 0 24 24">
    <path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10.5 4 7 4 7 6.5S12 7 12 7zm0 0c1.5-3 5-3 5-.5S12 7 12 7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export function SellosEstampa({ total, llenos, premio, semilla = "", nivel: forzado, ahorro, className }: SellosEstampaProps) {
  useStyles("momento-sellos", CSS_SELLOS);
  useStyles("momento-late", CSS_LATE);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const l = limitesSellos(total, llenos);
  const giros = useMemo(() => girosSellos(l.total, semilla), [l.total, semilla]);
  // Tocar un sello lleno lo estampa otra vez (cambia su key para reiniciar la animación).
  const [otra, setOtra] = useState<{ i: number; vez: number } | null>(null);
  return (
    <div
      ref={ref}
      className={["mk-momento mk-m-sellos", className].filter(Boolean).join(" ")}
      data-momento="sellos"
      data-nivel={nivel}
      data-activo={activo ? "" : undefined}
      style={{ "--mk-m-n": l.llenos } as CSSProperties}
    >
      <ol aria-hidden="true" className="mk-m-sellos-lista">
        {Array.from({ length: l.total }, (_, i) => {
          const lleno = i < l.llenos;
          const esPremio = i === l.total - 1;
          const repetido = otra?.i === i;
          return (
            <li
              key={repetido ? `${i}-${otra.vez}` : i}
              data-lleno={lleno ? "" : undefined}
              data-premio={esPremio ? "" : undefined}
              style={{ "--i": repetido ? 0 : i, "--giro": `${giros[i]}deg` } as CSSProperties}
              onClick={lleno ? () => { vibrar(10); setOtra((o) => ({ i, vez: (o?.vez ?? 0) + 1 })); } : undefined}
            >
              {esPremio ? <Regalo /> : lleno ? <Visto /> : null}
            </li>
          );
        })}
      </ol>
      <p className="mk-m-sellos-texto">{l.llenos} de {l.total} sellos. Premio: {premio}.</p>
    </div>
  );
}
