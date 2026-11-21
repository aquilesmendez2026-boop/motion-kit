import { useEffect, useRef } from "react";
import { onScrollFrame } from "../utils/scroll";

/**
 * Llama a `onChange` con el avance del scroll de la página, de 0 a 1.
 * No provoca renders: sirve para mover cosas directo en el DOM.
 */
export function useScrollProgress(onChange: (progress: number) => void) {
  const callback = useRef(onChange);
  callback.current = onChange;

  useEffect(() => {
    return onScrollFrame(() => {
      const root = document.documentElement;
      const max = root.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      callback.current(progress);
    });
  }, []);
}
