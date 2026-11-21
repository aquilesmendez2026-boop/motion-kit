import { useEffect, useRef, useState } from "react";

export interface UseInViewOptions {
  /** Porcentaje del elemento visible para activarse (0 a 1). */
  threshold?: number;
  /** Margen alrededor de la pantalla, por ejemplo "0px 0px -10% 0px". */
  rootMargin?: string;
  /** Si es `true`, se activa una sola vez y no se vuelve a ocultar. */
  once?: boolean;
}

/**
 * Detecta cuándo un elemento entra en pantalla usando IntersectionObserver.
 */
export function useInView<T extends Element = HTMLDivElement>(
  options: UseInViewOptions = {}
) {
  const { threshold = 0.15, rootMargin = "0px", once = true } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
