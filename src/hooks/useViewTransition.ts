import { useCallback } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "./useReducedMotion";

type StartViewTransition = (update: () => void) => unknown;

/**
 * Devuelve una función para envolver un cambio de estado y que el navegador
 * lo anime como transición entre pantallas (View Transitions API).
 * Donde no hay soporte, o con movimiento reducido, el cambio se aplica directo.
 *
 * ```tsx
 * const transition = useViewTransition();
 * <button onClick={() => transition(() => setPage("detalle"))}>Ver</button>
 * ```
 */
export function useViewTransition() {
  const reduced = useReducedMotion();

  return useCallback(
    (update: () => void) => {
      const start =
        typeof document !== "undefined"
          ? (document as unknown as { startViewTransition?: StartViewTransition })
              .startViewTransition
          : undefined;

      if (reduced || typeof start !== "function") {
        update();
        return;
      }
      start.call(document, () => flushSync(update));
    },
    [reduced]
  );
}
