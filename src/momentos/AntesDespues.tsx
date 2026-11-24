// Antes y después: un deslizador que corta entre dos fotos. Se mueve con el dedo, el mouse o las flechas. El corte se
// hace solo con transform: la capa «después» se corre a la derecha y su foto se corre al revés.
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { useStyles } from "../utils/styles";
import { CSS_LATE, useMomento, type ComunesMomento } from "./base";
import { valorPorTecla } from "./calculos-aparte";

export interface AntesDespuesProps extends ComunesMomento {
  antes: { url: string; alt: string };
  despues: { url: string; alt: string };
  etiquetas?: [string, string];
  /** Dónde parte el corte (0 a 100). */
  inicial?: number;
}

export const CSS_ANTES_DESPUES =
  ".mk-m-ad-marco{position:relative;overflow:hidden;border-radius:14px;aspect-ratio:4/3;touch-action:pan-y;cursor:ew-resize;user-select:none}" +
  ".mk-m-ad-control{position:absolute;inset:0;border-radius:14px;outline:none}" +
  ".mk-m-ad-control:focus-visible{box-shadow:inset 0 0 0 3px var(--mk-m-acento)}" +
  ".mk-m-ad-marco img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}" +
  ".mk-m-ad-capa{position:absolute;inset:0;overflow:hidden;transform:translateX(calc(var(--p)*1%))}" +
  ".mk-m-ad-capa img{transform:translateX(calc(var(--p)*-1%))}" +
  ".mk-m-ad-linea{position:absolute;inset:0;pointer-events:none;transform:translateX(calc(var(--p)*1%))}" +
  ".mk-m-ad-linea::before{content:\"\";position:absolute;top:0;bottom:0;left:-1px;width:2px;background:#fff;box-shadow:0 0 8px rgba(0,0,0,.4)}" +
  ".mk-m-ad-manija{position:absolute;top:50%;left:-22px;width:44px;height:44px;margin-top:-22px;border-radius:50%;background:#fff;color:#1d1d1b;" +
  "display:grid;place-items:center;box-shadow:0 4px 14px rgba(0,0,0,.35);font-weight:800}" +
  ".mk-m-ad[data-activo][data-nivel=completo] .mk-m-ad-manija{animation:mk-m-late 1.4s ease-in-out 3}" +
  ".mk-m-ad-etiqueta{position:absolute;bottom:10px;padding:3px 10px;border-radius:999px;background:rgba(0,0,0,.6);color:#fff;font-size:.8rem;font-weight:700}" +
  ".mk-m-ad-etiqueta[data-lado=antes]{left:10px}.mk-m-ad-etiqueta[data-lado=despues]{right:10px}";

export function AntesDespues({ antes, despues, etiquetas = ["Antes", "Después"], inicial = 50, nivel: forzado, ahorro, className }: AntesDespuesProps) {
  useStyles("momento-antes-despues", CSS_ANTES_DESPUES);
  useStyles("momento-late", CSS_LATE);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const [p, setP] = useState(() => Math.min(100, Math.max(0, Number.isFinite(inicial) ? inicial : 50)));
  const arrastrando = useRef(false);
  const desde = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (r.width) setP(Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))));
  };
  const tecla = (e: KeyboardEvent) => {
    const v = valorPorTecla(p, e.key);
    if (v === null) return;
    e.preventDefault();
    setP(v);
  };
  return (
    <div ref={ref} className={["mk-momento mk-m-ad", className].filter(Boolean).join(" ")} data-momento="antesdespues" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      {/* Las fotos quedan fuera del deslizador (un slider esconde lo de adentro): su alt se lee. El control es una capa
          transparente encima, que recibe el foco y las flechas; el arrastre lo toma el marco. */}
      <div
        className="mk-m-ad-marco"
        style={{ "--p": p } as CSSProperties}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); arrastrando.current = true; desde(e); }}
        onPointerMove={(e) => arrastrando.current && desde(e)}
        onPointerUp={() => (arrastrando.current = false)}
        onPointerCancel={() => (arrastrando.current = false)}
      >
        <img src={antes.url} alt={antes.alt} loading="lazy" decoding="async" />
        <div className="mk-m-ad-capa">
          <img src={despues.url} alt={despues.alt} loading="lazy" decoding="async" />
        </div>
        <span className="mk-m-ad-etiqueta" data-lado="antes" aria-hidden="true">{etiquetas[0]}</span>
        <span className="mk-m-ad-etiqueta" data-lado="despues" aria-hidden="true">{etiquetas[1]}</span>
        <span className="mk-m-ad-linea" aria-hidden="true"><span className="mk-m-ad-manija">↔</span></span>
        <div
          className="mk-m-ad-control"
          role="slider"
          tabIndex={0}
          aria-label="Comparar antes y después"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={p}
          aria-valuetext={`${etiquetas[0]} ${p} %, ${etiquetas[1]} ${100 - p} %`}
          onKeyDown={tecla}
        />
      </div>
    </div>
  );
}
