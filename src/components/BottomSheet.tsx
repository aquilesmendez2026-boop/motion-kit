import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { c } from "../interfaz/tema";

export interface BottomSheetProps {
  /** Si la hoja está abierta. */
  open: boolean;
  /** Se llama al cerrar: arrastre hacia abajo, toque afuera o tecla Esc. */
  onClose: () => void;
  /** Nombre de la hoja para lectores de pantalla. */
  label: string;
  /** Alto máximo (cualquier medida CSS). */
  maxHeight?: string;
  /** Píxeles de arrastre a partir de los cuales se cierra. */
  closeThreshold?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const DURATION = 380;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/**
 * Hoja que sube desde abajo de la pantalla, como en las apps móviles.
 * Se cierra arrastrándola hacia abajo, tocando afuera o con Esc.
 */
export function BottomSheet({
  open,
  onClose,
  label,
  maxHeight = "85dvh",
  closeThreshold = 110,
  className,
  style,
  children,
}: BottomSheetProps) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startY: 0, lastY: 0, lastT: 0, velocity: 0 });
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const transition = reduced ? "none" : `transform ${DURATION}ms ${EASE}`;

  // Montar al abrir; desmontar cuando termina la animación de salida.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() =>
        requestAnimationFrame(() => setShown(true))
      );
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const timer = setTimeout(() => setMounted(false), reduced ? 0 : DURATION);
    return () => clearTimeout(timer);
  }, [open, reduced]);

  // Mientras está abierta: Esc cierra, la página no se mueve y el foco entra.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (shown) sheetRef.current?.focus({ preventScroll: true });
  }, [shown]);

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = {
      active: true,
      startY: event.clientY,
      lastY: event.clientY,
      lastT: event.timeStamp,
      velocity: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state.active || !sheetRef.current) return;

    const dt = event.timeStamp - state.lastT;
    if (dt > 0) state.velocity = (event.clientY - state.lastY) / dt;
    state.lastY = event.clientY;
    state.lastT = event.timeStamp;

    const raw = event.clientY - state.startY;
    // Hacia abajo sigue al dedo; hacia arriba ofrece resistencia.
    const dy = raw > 0 ? raw : raw / 6;
    sheetRef.current.style.transform = `translate3d(0, ${dy}px, 0)`;
    if (backdropRef.current) {
      const height = sheetRef.current.offsetHeight || 1;
      backdropRef.current.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / height));
    }
  };

  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state.active) return;
    state.active = false;

    const dy = event.clientY - state.startY;
    const sheet = sheetRef.current;
    if (sheet) {
      sheet.style.transition = transition;
      sheet.style.transform = "";
    }
    if (backdropRef.current) backdropRef.current.style.opacity = "";

    // Se cierra por distancia o por un gesto rápido hacia abajo.
    if (dy > closeThreshold || (dy > 24 && state.velocity > 0.6)) onClose();
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1100 }}>
      <div
        ref={backdropRef}
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.4)",
          opacity: shown ? 1 : 0,
          transition: reduced ? "none" : `opacity ${DURATION}ms ease`,
        }}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={className}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight,
          display: "flex",
          flexDirection: "column",
          margin: "0 auto",
          maxWidth: 560,
          borderRadius: "20px 20px 0 0",
          background: c("superficie"),
          color: c("texto"),
          boxShadow: "0 -12px 40px rgba(0, 0, 0, 0.18)",
          outline: "none",
          paddingBottom: "env(safe-area-inset-bottom)",
          transform: shown ? "translate3d(0, 0, 0)" : "translate3d(0, 100%, 0)",
          transition,
          ...style,
        }}
      >
        {/* Zona para arrastrar: solo aquí se captura el gesto. */}
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            height: 28,
            cursor: "grab",
            touchAction: "none",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 40,
              height: 5,
              borderRadius: 999,
              background: c("borde"),
            }}
          />
        </div>
        <div style={{ overflowY: "auto", overscrollBehavior: "contain" }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
