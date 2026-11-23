import { createContext, useLayoutEffect, useMemo, useRef, useState, type HTMLAttributes } from "react";
import { useStyles } from "../utils/styles";
import { useEstilo } from "../estilos/Estilo";
import { useNivelEscena, type ModoAhorro, type NivelEscena } from "../escena/nivel";
import { RELATO_DE_ESTILO, type RelatoBloqueId, type RelatoPaginaId } from "./catalogo";
import { useRespaldo } from "./respaldo";
import { CSS_RELATOS } from "./css";
import { altoVista, contenedorScroll } from "./medidas";

export interface ContextoRelatos {
  /** El relato por defecto de los bloques. */
  relato: RelatoBloqueId;
  nivel: NivelEscena;
  /** Sin animaciones con scroll nativas (o forzado): los bloques usan el respaldo. */
  sinScroll: boolean;
  observar: (el: Element | null) => () => void;
}
export const ContextoRelato = createContext<ContextoRelatos | null>(null);

export interface PaginaRelatoProps extends HTMLAttributes<HTMLDivElement> {
  /** Relato por defecto de los bloques. Por defecto, el que propone el estilo vigente, o «escenas». */
  relato?: RelatoBloqueId;
  /** Relato de fondo para toda la página. */
  relatoPagina?: RelatoPaginaId;
  ahorro?: ModoAhorro;
  /** Fuerza el respaldo sin scroll nativo (pruebas y demo). */
  respaldo?: boolean;
}

const soportaScroll = () => typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timeline: view()");
const r = (x: number) => Math.round(x * 10) / 10;

/** El camino del Hilo para una página de ancho `w` y alto `h`: baja desde arriba al centro en una S hasta abajo al centro. */
export function caminoHilo(w: number, h: number): string {
  const c = r(w / 2);
  return `M ${c} 0 C ${r(w * 0.92)} ${r(h * 0.15)}, ${r(w * 0.08)} ${r(h * 0.28)}, ${c} ${r(h * 0.43)} S ${r(w * 0.93)} ${r(h * 0.71)}, ${c} ${r(h)}`;
}

/** Mide la página (para el camino del Hilo) y el alto visible (para el cielo). */
function useMedidas(ref: React.RefObject<HTMLDivElement | null>, activo: boolean) {
  const [m, setM] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !activo) return;
    const caja = contenedorScroll(el);
    const medir = () => {
      setM({ w: el.offsetWidth, h: el.offsetHeight });
      el.style.setProperty("--mk-alto-vista", `${altoVista(caja)}px`);
    };
    medir();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    if (caja) ro.observe(caja);
    return () => ro.disconnect();
  }, [ref, activo]);
  return m;
}

/**
 * La página que se cuenta al bajar: pone el relato por defecto, el nivel (completo, liviano, quieto), el respaldo para
 * navegadores sin scroll nativo y, si hay, el relato de página (hilo o luz) por detrás de los bloques. Cada bloque va
 * dentro de un `<Relato>`.
 */
export function PaginaRelato({ relato, relatoPagina, ahorro = "auto", respaldo = false, className, children, ...resto }: PaginaRelatoProps) {
  useStyles("relatos", CSS_RELATOS);
  const estilo = useEstilo();
  const nivel = useNivelEscena({ ahorro });
  const [soporta] = useState(soportaScroll);
  const sinScroll = respaldo || !soporta;
  const { observar } = useRespaldo(sinScroll && nivel !== "quieto");
  const ref = useRef<HTMLDivElement>(null);
  const { w, h } = useMedidas(ref, Boolean(relatoPagina));
  const valor = useMemo<ContextoRelatos>(
    () => ({ relato: relato ?? (estilo ? RELATO_DE_ESTILO[estilo.id] : "escenas"), nivel, sinScroll, observar }),
    [relato, estilo, nivel, sinScroll, observar],
  );
  const camino = relatoPagina === "hilo" && w > 0 && h > 0 ? caminoHilo(w, h) : "";
  return (
    <ContextoRelato.Provider value={valor}>
      <div
        {...resto}
        ref={ref}
        className={`mk-pagina${className ? " " + className : ""}`}
        data-nivel={nivel}
        data-mk-relato={valor.relato}
        data-mk-relato-pagina={relatoPagina}
        data-mk-sin-scroll={sinScroll ? "" : undefined}
      >
        {relatoPagina === "luz" && (
          <div className="mk-cielo" aria-hidden="true">
            <i data-hora="tarde" /><i data-hora="atardecer" /><i data-hora="noche" /><b className="mk-sol" />
          </div>
        )}
        {camino && (
          <>
            <svg className="mk-hilo" aria-hidden="true" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
              <path pathLength={1} d={camino} />
            </svg>
            <i className="mk-hilo-viajero" aria-hidden="true" style={{ offsetPath: `path("${camino}")` }} />
          </>
        )}
        {valor.relato === "pelicula" && <div className="mk-cinta" aria-hidden="true"><i /></div>}
        {children}
      </div>
    </ContextoRelato.Provider>
  );
}
