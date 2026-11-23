import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { animarEntrada, animarSalida, type TransicionId } from "./transiciones";

export interface CambioContenidoProps extends HTMLAttributes<HTMLDivElement> {
  /** Cuando cambia, el contenido actual sale y el nuevo entra (uno después del otro). */
  clave: string | number;
  tipo?: TransicionId;
  duracion?: number;
  /** Para «pasar»: 1 avanza (entra desde la derecha), -1 retrocede. */
  sentido?: 1 | -1;
  children: ReactNode;
}

/**
 * Cambia de contenido con transición: pasos de un formulario, pestañas, una sección que cambia de página.
 * El contenido viejo sale y después entra el nuevo.
 */
export function CambioContenido({ clave, tipo = "fundido", duracion = 260, sentido = 1, children, ...resto }: CambioContenidoProps) {
  const [mostrado, setMostrado] = useState({ clave, hijos: children });
  const ref = useRef<HTMLDivElement>(null);
  const reducido = useReducedMotion();
  const ultimo = useRef(children);
  ultimo.current = children;
  const cambio = useRef(false);

  useLayoutEffect(() => {
    if (clave === mostrado.clave) return;
    const el = ref.current;
    const a = el && animarSalida(el, tipo, duracion, reducido, sentido);
    const listo = () => {
      cambio.current = true;
      setMostrado({ clave, hijos: ultimo.current });
    };
    if (!a) return listo();
    a.onfinish = listo;
    return () => {
      a.onfinish = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  useLayoutEffect(() => {
    if (!cambio.current || !ref.current) return;
    cambio.current = false;
    for (const a of ref.current.getAnimations?.() ?? []) a.cancel();
    animarEntrada(ref.current, tipo, duracion, reducido, sentido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrado.clave]);

  return (
    <div {...resto} ref={ref} data-clave={String(mostrado.clave)}>
      {clave === mostrado.clave ? children : mostrado.hijos}
    </div>
  );
}
