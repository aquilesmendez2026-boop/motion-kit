import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface ToastOptions {
  /** Milisegundos que se muestra el aviso. */
  duration?: number;
}

export interface ToastProviderProps {
  /** Dónde aparecen los avisos. */
  position?: "top" | "bottom";
  children: ReactNode;
}

interface ToastEntry {
  id: number;
  message: ReactNode;
  leaving: boolean;
}

type ShowToast = (message: ReactNode, options?: ToastOptions) => void;

const ToastContext = createContext<ShowToast | null>(null);

const EXIT = 260;
const CSS = `
@keyframes motion-kit-toast-in {
  from { opacity: 0; transform: translate3d(0, var(--motion-kit-toast-from), 0) scale(0.96); }
}`;

/**
 * Envuelve la app para poder mostrar avisos breves con `useToast()`.
 */
export function ToastProvider({ position = "bottom", children }: ToastProviderProps) {
  useStyles("toast", CSS);
  const reduced = useReducedMotion();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [ready, setReady] = useState(false);
  const nextId = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setReady(true);
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    timers.current.push(
      setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), EXIT)
    );
  }, []);

  const show = useCallback<ShowToast>(
    (message, options) => {
      const id = nextId.current++;
      // Como máximo tres a la vez: el más antiguo sale.
      setToasts((list) => [...list.slice(-2), { id, message, leaving: false }]);
      timers.current.push(setTimeout(() => dismiss(id), options?.duration ?? 3200));
    },
    [dismiss]
  );

  const from = position === "bottom" ? "16px" : "-16px";

  return (
    <ToastContext.Provider value={show}>
      {children}
      {ready &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              top: position === "top" ? "calc(16px + env(safe-area-inset-top))" : undefined,
              bottom:
                position === "bottom" ? "calc(16px + env(safe-area-inset-bottom))" : undefined,
              zIndex: 1200,
              display: "flex",
              flexDirection: position === "bottom" ? "column" : "column-reverse",
              alignItems: "center",
              gap: 8,
              padding: "0 16px",
              pointerEvents: "none",
            }}
          >
            {toasts.map((toast) => (
              <button
                key={toast.id}
                type="button"
                onClick={() => dismiss(toast.id)}
                style={{
                  ...({ "--motion-kit-toast-from": from } as CSSProperties),
                  pointerEvents: "auto",
                  maxWidth: 420,
                  minHeight: 44,
                  padding: "10px 18px",
                  border: 0,
                  borderRadius: 14,
                  background: "#f1f1f6",
                  color: "#12121c",
                  font: "inherit",
                  fontWeight: 600,
                  textAlign: "left",
                  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
                  cursor: "pointer",
                  opacity: toast.leaving ? 0 : 1,
                  transform: toast.leaving ? "scale(0.96)" : "none",
                  transition: reduced
                    ? "none"
                    : `opacity ${EXIT}ms ease, transform ${EXIT}ms ease`,
                  animation: reduced
                    ? "none"
                    : "motion-kit-toast-in 380ms cubic-bezier(0.34, 1.4, 0.64, 1)",
                }}
              >
                {toast.message}
              </button>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

/**
 * Devuelve la función para mostrar un aviso: `const toast = useToast();
 * toast("Guardado")`. Necesita un `ToastProvider` más arriba.
 */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast necesita un <ToastProvider> más arriba.");
  return show;
}
