import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { animarEntrada, animarSalida, type TransicionId } from "./transiciones";

export interface PresenciaProps extends HTMLAttributes<HTMLDivElement> {
  /** Mostrar u ocultar. Al ocultar, el contenido se anima antes de salir del DOM. */
  visible: boolean;
  tipo?: TransicionId;
  /** Milisegundos de la entrada (la salida dura un 80 %). */
  duracion?: number;
  /** Animar también la primera vez que aparece. */
  inicial?: boolean;
  /** Se llama cuando terminó de salir. */
  alSalir?: () => void;
  children: ReactNode;
}

/**
 * Muestra u oculta contenido con transición de entrada y salida (como AnimatePresence, sin librerías).
 * Con «reducir movimiento» queda solo un fundido corto.
 */
export function Presencia({ visible, tipo = "fundido", duracion = 280, inicial = true, alSalir, children, ...resto }: PresenciaProps) {
  const [montado, setMontado] = useState(visible);
  const ref = useRef<HTMLDivElement>(null);
  const primera = useRef(true);
  const ultimo = useRef(children);
  const reducido = useReducedMotion();
  if (visible) ultimo.current = children;

  useLayoutEffect(() => {
    if (visible && !montado) setMontado(true);
  }, [visible, montado]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const esPrimera = primera.current;
    primera.current = false;
    if (visible) {
      if (esPrimera && !inicial) return;
      const a = animarEntrada(el, tipo, duracion, reducido);
      return () => a?.cancel();
    }
    const a = animarSalida(el, tipo, duracion, reducido);
    if (!a) {
      setMontado(false);
      alSalir?.();
      return;
    }
    a.onfinish = () => {
      setMontado(false);
      alSalir?.();
    };
    return () => {
      a.onfinish = null;
      a.cancel();
    };
    // Solo reacciona a mostrar/ocultar y a cuando el nodo aparece.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, montado]);

  if (!montado) return null;
  return (
    <div {...resto} ref={ref} data-presencia={visible ? "dentro" : "saliendo"}>
      {visible ? children : ultimo.current}
    </div>
  );
}
