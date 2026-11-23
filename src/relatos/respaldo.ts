import { useCallback, useEffect, useRef } from "react";

/**
 * Respaldo para navegadores sin animaciones con scroll nativas: un solo IntersectionObserver por página marca
 * `data-visto` en cada bloque la primera vez que entra, y el CSS hace una entrada simple. Inactivo, no observa nada.
 */
export function useRespaldo(activo: boolean): { observar: (el: Element | null) => () => void } {
  const io = useRef<IntersectionObserver | null>(null);
  useEffect(() => () => io.current?.disconnect(), []);
  const observar = useCallback(
    (el: Element | null) => {
      if (!activo || !el || typeof IntersectionObserver === "undefined") return () => {};
      io.current ??= new IntersectionObserver(
        (entradas) => {
          for (const e of entradas) {
            if (!e.isIntersecting) continue;
            e.target.setAttribute("data-visto", "");
            io.current?.unobserve(e.target);
          }
        },
        // Sin margen negativo: un bloque chico al final de la página también tiene que entrar.
        { threshold: 0 },
      );
      io.current.observe(el);
      return () => io.current?.unobserve(el);
    },
    [activo],
  );
  return { observar };
}
