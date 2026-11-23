import { useInsertionEffect } from "react";

const injected = new Set<string>();
let inyectar: boolean | undefined;

/**
 * Apaga la inserción de `<style>`: úsalo cuando la página carga `motion-kit/estilos.css` (por ejemplo, con una CSP sin
 * `'unsafe-inline'` en `style-src`). Llámalo antes del primer render. Lo mismo hace, sin código, poner en el `<head>`
 * `<meta name="motion-kit-estilos" content="archivo">`.
 */
export function sinInyectarEstilos() {
  inyectar = false;
}

const debeInyectar = () => {
  if (inyectar === undefined) inyectar = !document.querySelector('meta[name="motion-kit-estilos"][content="archivo"]');
  return inyectar;
};

/**
 * Inserta una sola vez un bloque de CSS (keyframes y clases) en el <head>.
 * Así la librería no necesita que quien la usa importe un archivo .css.
 * Con `sinInyectarEstilos()` no inserta nada: el CSS viene de `motion-kit/estilos.css`.
 */
export function useStyles(id: string, css: string) {
  useInsertionEffect(() => {
    if (typeof document === "undefined" || injected.has(id) || !debeInyectar()) return;
    injected.add(id);
    const domId = `motion-kit-${id}`;
    if (document.getElementById(domId)) return;
    const element = document.createElement("style");
    element.id = domId;
    element.textContent = css;
    document.head.appendChild(element);
  }, [id, css]);
}
