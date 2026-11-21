import { useInsertionEffect } from "react";

const injected = new Set<string>();

/**
 * Inserta una sola vez un bloque de CSS (keyframes y clases) en el <head>.
 * Así la librería no necesita que quien la usa importe un archivo .css.
 */
export function useStyles(id: string, css: string) {
  useInsertionEffect(() => {
    if (typeof document === "undefined" || injected.has(id)) return;
    injected.add(id);
    const domId = `motion-kit-${id}`;
    if (document.getElementById(domId)) return;
    const element = document.createElement("style");
    element.id = domId;
    element.textContent = css;
    document.head.appendChild(element);
  }, [id, css]);
}
