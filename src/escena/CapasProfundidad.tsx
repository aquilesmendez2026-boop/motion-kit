import { useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { CSS_ESCENA } from "./css";
import { useMovimientoEscena, type FuenteMovimiento } from "./movimiento";

/** Formas que se dibujan con los colores del estilo, sin bajar nada (pesan 0 KB). */
export type FormaCapa = "orbes" | "anillos" | "chispas" | "rayas";

export interface Capa {
  /** Foto recortada (PNG o WebP con fondo transparente). */
  src?: string;
  alt?: string;
  /** O una forma dibujada con los colores del estilo. */
  forma?: FormaCapa;
  /**
   * Cuánto se mueve: 0 queda quieta, 1 es el frente (se mueve más), negativo va al fondo y se mueve al revés.
   * Lo normal es entre -0,5 y 1.
   */
  profundidad: number;
  /** Posición y tamaño de una foto (CSS). Por defecto, centrada y del ancho del encabezado. */
  x?: string;
  y?: string;
  ancho?: string;
  opacidad?: number;
}

export const CAPAS_POR_DEFECTO: Capa[] = [
  { forma: "orbes", profundidad: -0.35 },
  { forma: "anillos", profundidad: 0.45 },
  { forma: "chispas", profundidad: 1 },
];

const ORBES = [[18, 30, 26], [78, 22, 20], [62, 78, 30]] as const;
const ANILLOS = [[12, 70, 9], [86, 64, 6], [70, 16, 4], [30, 14, 3]] as const;
const CHISPAS = [[8, 20], [22, 82], [35, 40], [48, 12], [57, 64], [68, 88], [80, 36], [91, 76], [15, 52], [74, 54], [42, 92], [95, 14]] as const;

function dibujo(forma: FormaCapa): ReactNode {
  const acento = { fill: "var(--mk-acento, #7c5cff)" };
  const borde = { fill: "none", stroke: "var(--mk-acento-2, var(--mk-acento, #7c5cff))" };
  switch (forma) {
    case "orbes":
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <radialGradient id="mk-orbe">
              <stop offset="0" stopColor="currentColor" stopOpacity=".55" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          {ORBES.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="url(#mk-orbe)" />)}
        </svg>
      );
    case "anillos":
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {ANILLOS.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} style={borde} strokeWidth={0.5} opacity={0.7} />)}
        </svg>
      );
    case "chispas":
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {CHISPAS.map(([x, y], i) => <circle key={`${x}-${y}`} cx={x} cy={y} r={i % 3 ? 0.5 : 0.9} style={acento} opacity={0.85} />)}
        </svg>
      );
    case "rayas":
      return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {[10, 32, 58, 80].map((x) => <path key={x} d={`M${x} -5 L${x + 18} 105`} style={borde} strokeWidth={0.35} opacity={0.5} />)}
        </svg>
      );
  }
}

/** Las capas, sin escuchar el movimiento: las mueve quien tenga las variables `--mk-cx`, `--mk-cy` y `--mk-cs`. */
export function CapasEscena({ capas = CAPAS_POR_DEFECTO, rango = 28 }: { capas?: Capa[]; rango?: number }) {
  useStyles("escena", CSS_ESCENA);
  return (
    <div className="mk-planos" aria-hidden="true" style={{ "--mk-planos-rango": `${rango}px` } as CSSProperties}>
      {capas.map((c, i) => (
        <div
          key={i}
          className="mk-plano"
          data-forma={c.forma}
          style={{ "--z": c.profundidad, "--zs": 1 + Math.abs(c.profundidad) * 0.06, opacity: c.opacidad } as CSSProperties}
        >
          {c.src ? (
            <img src={c.src} alt="" decoding="async" style={{ left: c.x ?? "50%", top: c.y ?? "50%", width: c.ancho ?? "100%" }} />
          ) : (
            c.forma && dibujo(c.forma)
          )}
        </div>
      ))}
    </div>
  );
}

export interface CapasProfundidadProps extends HTMLAttributes<HTMLDivElement> {
  capas?: Capa[];
  /** Con qué se mueve. Por defecto, dedo o cursor y scroll. */
  mover?: FuenteMovimiento[];
  /** Cuántos píxeles se mueve la capa del frente. */
  rango?: number;
  children?: ReactNode;
}

/**
 * Efecto 2.5D: fotos recortadas o formas en planos que se mueven a distinta velocidad con el dedo, el cursor,
 * el scroll o la inclinación del teléfono. Solo usa `translate` y `scale`.
 */
export function CapasProfundidad({ capas, mover, rango, children, className, ...resto }: CapasProfundidadProps) {
  useStyles("escena", CSS_ESCENA);
  const ref = useRef<HTMLDivElement>(null);
  useMovimientoEscena(ref, { mover });
  return (
    <div {...resto} ref={ref} className={`mk-escena${className ? " " + className : ""}`}>
      <CapasEscena capas={capas} rango={rango} />
      {children && <div className="mk-escena-contenido">{children}</div>}
    </div>
  );
}
