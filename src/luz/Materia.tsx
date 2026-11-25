import { useRef, type CSSProperties, type ElementType, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";
import { useModoAhorro } from "../escena/nivel";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";
import { ALTURA_MAX } from "./calculo-luz";
import { CSS_LUZ } from "./css";

export type TipoMateria = "papel" | "mate" | "vidrio" | "metal" | "holografico";
export const MATERIAS: readonly TipoMateria[] = ["papel", "mate", "vidrio", "metal", "holografico"];

export interface MateriaProps extends HTMLAttributes<HTMLElement> {
  /** De qué está hecha: cada material responde distinto a la luz. Por defecto, `mate`. */
  tipo?: TipoMateria;
  /** Qué tan levantada está de la mesa, de 0 a 4. La sombra lo dice. Por defecto 1. */
  altura?: number;
  /** A qué altura sube al apuntarla. Por defecto, una más. */
  alApuntar?: number;
  /** Cuántos grados se inclina hacia el cursor o el dedo (0 a 25). Por defecto no se inclina. */
  inclina?: number;
  /** La etiqueta que dibuja (`div`, `article`, `a`, `button`…). */
  como?: ElementType;
  href?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  children?: ReactNode;
}

const nivel = (v: unknown, siNo: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(ALTURA_MAX, Math.round(v))) : siNo);
const INCLINA_MAX = 25;

/**
 * Una superficie que responde a la luz de la página (`Luz`): deja una sombra que dice a qué altura está, y un brillo
 * que se corre con la luz según de qué esté hecha. Apuntarla la levanta; apretarla (si se puede apretar) la hunde.
 * Fuera de una `Luz` usa la luz de siempre, quieta. El color de base va en `--mk-lz-color` y el del texto en
 * `--mk-lz-texto`.
 */
export function Materia({ tipo, altura, alApuntar, inclina, como: Como = "div", className, style, children, onPointerMove, onPointerLeave, onPointerCancel, ...resto }: MateriaProps) {
  useStyles("luz", CSS_LUZ);
  const ref = useRef<HTMLElement>(null);
  const reducido = useReducedMotion();
  const ahorro = useModoAhorro();
  const material = MATERIAS.includes(tipo as TipoMateria) ? (tipo as TipoMateria) : "mate";
  const base = nivel(altura, 1);
  const arriba = Math.max(base, nivel(alApuntar, Math.min(ALTURA_MAX, base + 1)));
  const grados = reducido || ahorro || typeof inclina !== "number" || !Number.isFinite(inclina) ? 0 : Math.max(0, Math.min(INCLINA_MAX, inclina));
  const apagada = resto.disabled === true || resto["aria-disabled"] === true || resto["aria-disabled"] === "true";
  const aprieta = !apagada && (Como === "a" || Como === "button" || typeof resto.onClick === "function");

  // Hacia dónde está el cursor sobre la superficie (de -1 a 1): la inclina y corre su brillo.
  const alMover = (e: PointerEvent<HTMLElement>) => {
    onPointerMove?.(e);
    const el = ref.current;
    if (!grados || !el) return;
    const c = el.getBoundingClientRect();
    if (!(c.width > 0) || !(c.height > 0)) return;
    const a = (n: number) => String(Math.round(Math.max(-1, Math.min(1, n)) * 1000) / 1000);
    el.setAttribute("data-mk-inclinando", "");
    el.style.setProperty("--mk-lz-ix", a(((e.clientX - c.left) / c.width - 0.5) * 2));
    el.style.setProperty("--mk-lz-iy", a(((e.clientY - c.top) / c.height - 0.5) * 2));
  };
  const alSalir = (e: PointerEvent<HTMLElement>) => {
    (e.type === "pointercancel" ? onPointerCancel : onPointerLeave)?.(e);
    const el = ref.current;
    if (!el) return;
    el.removeAttribute("data-mk-inclinando");
    el.style.removeProperty("--mk-lz-ix");
    el.style.removeProperty("--mk-lz-iy");
  };

  const variables = { "--mk-lz-a0": base, "--mk-lz-a1": arriba, ...(grados ? { "--mk-lz-i": grados } : {}) } as CSSProperties;
  return (
    <Como
      {...resto}
      ref={ref}
      className={`mk-lz${className ? ` ${className}` : ""}`}
      data-mk-materia={material}
      data-mk-altura={base}
      data-mk-aprieta={aprieta ? "" : undefined}
      data-mk-inclina={grados ? "" : undefined}
      style={{ ...variables, ...style }}
      onPointerMove={alMover}
      onPointerLeave={alSalir}
      onPointerCancel={alSalir}
    >
      <span className="mk-lz-sombra" aria-hidden="true">
        <i className="mk-lz-contacto" />
        <i className="mk-lz-proyectada" />
      </span>
      <span className="mk-lz-cara" aria-hidden="true">
        <i className="mk-lz-brillo" />
      </span>
      {children}
    </Como>
  );
}
