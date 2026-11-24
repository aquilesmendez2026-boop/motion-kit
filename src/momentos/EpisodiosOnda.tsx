// Episodios: cada uno lleva una onda de barras que se mueve solo mientras suena su audio. Es un dibujo que acompaña
// al reproductor del navegador (no analiza el sonido): la forma sale de una semilla. Fuera de la vista no se anima.
import { useCallback, useEffect, useState, type CSSProperties, type SyntheticEvent } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { numeroDe } from "./calculos";
import { barrasOnda, duracionEnPalabras, fechaLarga } from "./calculos-2";

export interface EpisodioOnda {
  titulo: string;
  /** Fecha ISO. */
  fecha?: string;
  /** La dirección del audio. */
  audio: string;
  /** En segundos. */
  duracion?: number;
}

export interface EpisodiosOndaProps extends ComunesMomento {
  episodios: EpisodioOnda[];
  zona?: string;
}

export const CSS_EPISODIOS =
  ".mk-m-epi-lista{list-style:none;margin:0;padding:0;display:grid;gap:14px}" +
  ".mk-m-epi{display:grid;gap:8px;padding:12px;border-radius:14px;border:1px solid color-mix(in srgb,var(--mk-m-texto) 14%,transparent)}" +
  ".mk-m-epi-titulo{margin:0;font-weight:700}" +
  ".mk-m-epi-datos{margin:0;font-size:.85rem;color:var(--mk-m-suave)}" +
  ".mk-m-epi audio{width:100%;min-height:44px}" +
  ".mk-m-onda{display:flex;align-items:center;gap:3px;height:34px}" +
  // El alto de cada barra va en `height` (fijo). La animación solo la achica y la suelta, con valores fijos: una escala
  // con una variable dentro de los fotogramas hace caer la pestaña en Chrome (visto el 24-11).
  ".mk-m-onda i{flex:1;max-width:6px;height:calc(var(--h)*100%);border-radius:3px;background:var(--mk-m-suave);transform-origin:50% 50%}" +
  ".mk-m-epi[data-suena] .mk-m-onda i{background:var(--mk-m-acento)}" +
  // Solo se mueve la onda del que suena, y solo si el bloque se ve.
  ".mk-m-episodios[data-nivel=completo][data-vista] .mk-m-epi[data-suena] .mk-m-onda i{animation:mk-m-onda .62s ease-in-out infinite alternate}" +
  "@keyframes mk-m-onda{to{transform:scaleY(.35)}}";

export default function EpisodiosOnda({ episodios, zona = "America/Santiago", nivel: forzado, ahorro, className }: EpisodiosOndaProps) {
  useStyles("momento-episodios", CSS_EPISODIOS);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [suena, setSuena] = useState(-1);
  const [aLaVista, setALaVista] = useState(false);
  // Una sola función, estable: una nueva en cada dibujo haría que React la llame de nuevo cada vez (y no pararía).
  const pegar = useCallback(
    (n: HTMLDivElement | null) => {
      ref(n);
      setEl(n);
    },
    [ref],
  );
  useEffect(() => {
    if (!el) return;
    // Sin observador (navegador viejo) se toma como a la vista: la onda igual corre solo mientras suena.
    if (typeof IntersectionObserver === "undefined") {
      setALaVista(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setALaVista(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  const lista = Array.isArray(episodios) ? episodios.filter((e) => e && typeof e.titulo === "string" && typeof e.audio === "string") : [];
  if (!lista.length) return null;

  const alSonar = (i: number) => (ev: SyntheticEvent<HTMLAudioElement>) => {
    // Uno a la vez: los demás reproductores de esta pieza se pausan.
    const propio = ev.currentTarget;
    el?.querySelectorAll("audio").forEach((a) => a !== propio && !a.paused && a.pause());
    setSuena(i);
  };
  const alParar = (i: number) => () => setSuena((actual) => (actual === i ? -1 : actual));

  return (
    <div
      ref={pegar}
      className={["mk-momento mk-m-episodios", className].filter(Boolean).join(" ")}
      data-momento="episodios"
      data-nivel={nivel}
      data-activo={activo ? "" : undefined}
      data-vista={aLaVista ? "" : undefined}
    >
      <ul className="mk-m-epi-lista">
        {lista.map((e, i) => {
          const datos = [e.fecha ? fechaLarga(e.fecha, zona) : "", duracionEnPalabras(e.duracion)].filter(Boolean).join(" · ");
          return (
            <li key={i} className="mk-m-epi" data-suena={suena === i ? "" : undefined}>
              <p className="mk-m-epi-titulo">{e.titulo}</p>
              {datos && <p className="mk-m-epi-datos">{datos}</p>}
              <span className="mk-m-onda" aria-hidden="true">
                {barrasOnda(numeroDe(e.titulo) + i).map((h, k) => <i key={k} style={{ "--h": h.toFixed(2), animationDelay: `${-((k * 83) % 620)}ms` } as CSSProperties} />)}
              </span>
              <audio controls preload="none" src={e.audio} aria-label={e.titulo} onPlay={alSonar(i)} onPause={alParar(i)} onEnded={alParar(i)} onError={alParar(i)} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
