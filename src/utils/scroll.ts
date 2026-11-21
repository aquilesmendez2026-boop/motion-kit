type Listener = () => void;

const listeners = new Set<Listener>();
let frame = 0;
let attached = false;

function run() {
  frame = 0;
  listeners.forEach((listener) => listener());
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(run);
}

/**
 * Suscribe una función al scroll y al cambio de tamaño de la ventana.
 * Todos los efectos comparten un solo listener y se ejecutan como máximo una
 * vez por cuadro (requestAnimationFrame). Devuelve la función para desuscribir.
 */
export function onScrollFrame(listener: Listener): () => void {
  if (typeof window === "undefined") return () => {};

  listeners.add(listener);
  if (!attached) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    attached = true;
  }
  schedule();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && attached) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      attached = false;
    }
  };
}
