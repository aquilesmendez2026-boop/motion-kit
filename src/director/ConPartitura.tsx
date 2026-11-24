// El Director para React: una caja que mueve lo de adentro con una partitura. El trabajo lo hace `montar`.
import { createElement, useEffect, useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type RefObject } from "react";
import type { Partitura } from "./modelo";
import { montar, type Montaje, type OpcionesMontar } from "./montar";

/** Antes del primer pintado (para que un texto no aparezca entero y después se corte). En el servidor no hay pintado. */
const useAntesDePintar = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface OpcionesPartitura extends OpcionesMontar {
  /** Cámbiala para volver a montar (si el contenido de adentro llegó después, o para repetir la entrada). */
  clave?: unknown;
  /** Recibe el montaje (o `null` al desmontar): para `irA`, `avanzar` y `senal` con reloj manual. */
  alMontar?: (m: Montaje | null) => void;
}

/** El contenido de una partitura y su mapa, como texto. Algo que no se puede escribir como JSON (un ciclo) no vale igual: su firma es fija. */
function firmaDe(partitura: unknown, partes: unknown): string {
  try {
    return JSON.stringify([partitura ?? null, partes ?? null]);
  } catch {
    return "sin-firma";
  }
}

/** Monta `partitura` sobre el elemento de `ref` mientras el componente vive. Sin partitura no hace nada. */
export function usePartitura(ref: RefObject<HTMLElement | null>, partitura: Partitura | null | undefined, opciones: OpcionesPartitura = {}): void {
  const { partes, nivel, reloj, clave } = opciones;
  // Lo último que pasaron, sin volver a montar por una función nueva en cada dibujo.
  const avisos = useRef(opciones);
  avisos.current = opciones;
  // La partitura y el mapa son datos: se comparan por su contenido, no por si son el mismo objeto.
  const firma = firmaDe(partitura, partes);
  useAntesDePintar(() => {
    const el = ref.current;
    if (!el || !partitura) return;
    const m = montar(el, partitura, { partes, nivel, reloj, alFallar: (e) => avisos.current.alFallar?.(e) });
    avisos.current.alMontar?.(m);
    return () => {
      avisos.current.alMontar?.(null);
      m.desmontar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, nivel, reloj, clave]);
}

export interface ConPartituraProps extends Omit<HTMLAttributes<HTMLElement>, "children">, OpcionesPartitura {
  partitura: Partitura | null | undefined;
  /**
   * Recorta lo que se salga de la caja: una entrada que viene desde un lado no agrega scroll horizontal, y una parte
   * agrandada o corrida no tapa lo que está fuera. Por defecto, sí (en los dos sentidos). `"ancho"`: solo a lo ancho.
   */
  recortar?: boolean | "ancho";
  /** La etiqueta de la caja. Por defecto, `div`. */
  como?: "div" | "section" | "header" | "article" | "main" | "aside" | "footer" | "li";
  children?: React.ReactNode;
}

/** Lo de adentro, movido por una partitura. Sus actores son los elementos con `data-mk-parte` (o el mapa `partes`). */
export function ConPartitura({ partitura, partes, nivel, reloj, clave, alMontar, alFallar, recortar = true, como = "div", style, children, ...resto }: ConPartituraProps) {
  const ref = useRef<HTMLElement>(null);
  usePartitura(ref, partitura, { partes, nivel, reloj, clave, alMontar, alFallar });
  const estilo: CSSProperties | undefined = recortar === "ancho" ? { overflowX: "clip", ...style } : recortar ? { overflow: "clip", ...style } : style;
  return createElement(como, { ...resto, ref, style: estilo, "data-mk-partitura": partitura?.nombre ?? "" }, children);
}
