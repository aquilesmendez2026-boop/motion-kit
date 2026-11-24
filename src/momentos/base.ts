// La base de los momentos: cuándo arranca cada uno (una vez, al verse), en qué nivel y con qué colores.
import { useEffect, useRef, useState } from "react";
import { useModoAhorro, type ModoAhorro, type NivelEscena } from "../escena/nivel";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";
import { CSS_RESORTES } from "./resorte";
import { debeArrancar, nivelFijo } from "./calculos";
export { numeroDe } from "./calculos";

/** Props que comparten todos los momentos. */
export type ComunesMomento = {
  /** Fuerza el nivel (editor y vitrina). Sin esto, lo decide el teléfono. */
  nivel?: NivelEscena;
  ahorro?: ModoAhorro;
  className?: string;
};

export const CSS_BASE =
  ".mk-momento{--mk-m-acento:var(--mk-acento,var(--lm-acento,#e4572e));--mk-m-acento-2:var(--mk-acento-2,var(--mk-m-acento));" +
  "--mk-m-superficie:var(--mk-superficie,var(--lm-superficie,#fff));--mk-m-texto:var(--mk-texto,var(--lm-texto,#1d1d1b));" +
  "--mk-m-sobre:var(--mk-sobre-acento,var(--lm-sobreAcento,#fff));--mk-m-suave:color-mix(in srgb,var(--mk-m-texto) 55%,transparent);" +
  "position:relative;color:var(--mk-m-texto)}" +
  ".mk-m-lector{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}" +
  ".mk-m-boton{min-height:44px;min-width:44px;padding:.5rem 1rem;border-radius:999px;border:2px solid var(--mk-m-acento);" +
  "background:transparent;color:inherit;font:inherit;cursor:pointer}" +
  ".mk-m-boton:focus-visible{outline:3px solid var(--mk-m-acento);outline-offset:2px}" +
  "@media (prefers-reduced-motion:reduce){.mk-momento,.mk-momento *{animation:none!important;transition:none!important}}" +
  CSS_RESORTES;

/** Latido suave (premio de los sellos, punto «Abierto ahora»). */
export const CSS_LATE = "@keyframes mk-m-late{50%{transform:scale(1.08)}}";

/** Un observador para todos los momentos de la página. */
let observador: { io: IntersectionObserver; avisos: Map<Element, () => void> } | null = null;
// Varios cortes: así un bloque muy alto (que nunca llega al 35 %) también avisa mientras va entrando.
const CORTES = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35];

function observarUnaVez(el: Element, aviso: () => void): () => void {
  let o = observador;
  if (!o) {
    const avisos = new Map<Element, () => void>();
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const alto = e.rootBounds?.height || window.innerHeight;
          if (!e.isIntersecting || !debeArrancar(e.intersectionRatio, e.intersectionRect.height, alto)) continue;
          avisos.get(e.target)?.();
          avisos.delete(e.target);
          io.unobserve(e.target);
        }
      },
      { threshold: CORTES },
    );
    o = { io, avisos };
    observador = o;
  }
  const actual = o;
  actual.avisos.set(el, aviso);
  actual.io.observe(el);
  return () => {
    actual.avisos.delete(el);
    actual.io.unobserve(el);
  };
}

/**
 * Fluidez de la página: una sola medición de 4 s para todos los momentos (no un bucle por cada uno). Si va a menos de
 * 40 cuadros por segundo, avisa a los momentos para que pasen a liviano.
 */
const fluidez = { trabado: false, empezo: false, oyentes: new Set<(t: boolean) => void>() };

function medirPagina() {
  if (fluidez.empezo || typeof requestAnimationFrame === "undefined") return;
  fluidez.empezo = true;
  const muestras: number[] = [];
  let inicio = 0;
  let ventana = 0;
  let n = 0;
  const paso = (t: number) => {
    if (!inicio) inicio = ventana = t;
    n++;
    if (t - ventana >= 1000) {
      // Una pestaña oculta pausa los cuadros: esa muestra no cuenta.
      if (document.visibilityState === "visible" && t - ventana < 2000) muestras.push((n * 1000) / (t - ventana));
      n = 0;
      ventana = t;
    }
    if (t - inicio < 4000) {
      requestAnimationFrame(paso);
      return;
    }
    const orden = [...muestras].sort((a, b) => a - b);
    if (orden.length && orden[Math.floor(orden.length / 2)] < 40) {
      fluidez.trabado = true;
      fluidez.oyentes.forEach((f) => f(true));
    }
  };
  requestAnimationFrame(paso);
}

function useTrabadoPagina(medir: boolean): boolean {
  const [trabado, setTrabado] = useState(fluidez.trabado);
  useEffect(() => {
    if (!medir) return;
    fluidez.oyentes.add(setTrabado);
    medirPagina();
    setTrabado(fluidez.trabado);
    return () => {
      fluidez.oyentes.delete(setTrabado);
    };
  }, [medir]);
  return trabado;
}

/**
 * Cuándo y cómo se anima un momento. `activo` pasa a true la primera vez que se ve (un tercio a la vista, o media
 * pantalla si el bloque es muy alto), y desde el inicio en nivel quieto o sin IntersectionObserver.
 */
export function useMomento<T extends HTMLElement>({ ahorro = "auto", nivel: forzado }: { ahorro?: ModoAhorro; nivel?: NivelEscena } = {}): {
  ref: (el: T | null) => void;
  nivel: NivelEscena;
  activo: boolean;
} {
  useStyles("momentos-base", CSS_BASE);
  const reducido = useReducedMotion();
  const ahorrar = useModoAhorro(ahorro);
  const quieto = reducido || ahorrar;
  const trabado = useTrabadoPagina(forzado === undefined && !quieto && ahorro !== "nunca");
  const actual: NivelEscena = quieto ? "quieto" : ahorro !== "nunca" && trabado ? "liviano" : "completo";
  const [el, setEl] = useState<T | null>(null);
  const [visto, setVisto] = useState(false);
  // El nivel con que arrancó: después no cambia de completo a liviano (se animaría dos veces).
  const fijado = useRef<NivelEscena | null>(null);
  if (visto && fijado.current === null) fijado.current = actual;
  const nivel = forzado ?? (visto ? nivelFijo(fijado.current, actual) : actual);
  useEffect(() => {
    if (!el || visto) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisto(true);
      return;
    }
    return observarUnaVez(el, () => setVisto(true));
  }, [el, visto]);
  return { ref: setEl, nivel, activo: visto || nivel === "quieto" };
}
