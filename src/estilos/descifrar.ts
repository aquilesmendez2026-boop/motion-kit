// Texto que se descifra: cada letra pasa por unos signos y se resuelve de izquierda a derecha. El texto está completo
// desde el inicio y para lectores de pantalla no cambia (el aria-label lo pone TextoCinetico). Se carga aparte.

/** Los signos por los que pasa cada letra (sin letras que se confundan: sin I ni O). */
export const SIGNOS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&?";

/** Para las letras angostas (una «i», una «l», un punto): signos igual de angostos, que no se enciman con las vecinas. */
export const SIGNOS_ANGOSTOS = "!/1:;|";
const ANGOSTAS = "iIlíìïjtf.,:;!¡'|1";

/** Número repetible entre 0 y 1 (el mismo cálculo de src/efectos/semilla.ts, aquí para no depender de otro trozo). */
function azar(i: number, paso: number, semilla: number): number {
  const x = Math.sin((i + 1) * 12.9898 + paso * 78.233 + semilla * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

const esEspacio = (l: string) => /^\s*$/.test(l);

/**
 * Lo que muestra cada letra a los `t` ms. `i` es la posición de la letra entre las que no son espacio (los espacios
 * no cuentan ni retrasan): se resuelve cuando `t >= (i + 1) * paso`, con `paso = min(45, 1200 / n)`; antes muestra un
 * signo que cambia cada 40 ms. Los espacios no cambian.
 */
export function cuadroDescifrar(letras: string[], t: number, semilla: number): string[] {
  const n = letras.reduce((c, l) => c + (esEspacio(l) ? 0 : 1), 0);
  const paso = Math.min(45, 1200 / Math.max(1, n));
  let i = -1;
  return letras.map((l) => {
    if (esEspacio(l)) return l;
    i++;
    if (t >= (i + 1) * paso) return l;
    const signos = ANGOSTAS.includes(l) ? SIGNOS_ANGOSTOS : SIGNOS;
    return signos[Math.floor(azar(i, Math.floor(t / 40), semilla) * signos.length) % signos.length];
  });
}

/** Cuánto dura descifrar `n` letras (ms). */
export const duracionDescifrar = (n: number) => Math.max(1, n) * Math.min(45, 1200 / Math.max(1, n));

/**
 * Corre el efecto sobre las letras (`.mk-tc-l`) de un título. Fija el ancho de cada letra mientras cambia, para que el
 * título no baile, y al terminar deja el texto y los anchos como estaban. Devuelve cómo cancelar (que también
 * restaura). No hace nada con movimiento reducido ni en nivel liviano o quieto.
 */
export function descifrar(el: HTMLElement, semilla = 1): () => void {
  if (typeof window === "undefined" || typeof requestAnimationFrame === "undefined") return () => {};
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || el.closest("[data-nivel=liviano],[data-nivel=quieto]")) return () => {};
  const spans = [...el.querySelectorAll<HTMLElement>(".mk-tc-l")];
  const letras = spans.map((s) => s.textContent ?? "");
  if (!spans.length) return () => {};
  const previos = spans.map((s) => ({ ancho: s.style.width, alinea: s.style.textAlign }));
  spans.forEach((s) => {
    const w = s.getBoundingClientRect().width;
    if (w) {
      s.style.width = `${w}px`;
      s.style.textAlign = "center";
    }
  });
  const total = duracionDescifrar(letras.filter((l) => !esEspacio(l)).length);
  const inicio = performance.now();
  let cuadro = 0;
  let listo = false;
  const restaurar = () => {
    if (listo) return;
    listo = true;
    cancelAnimationFrame(cuadro);
    spans.forEach((s, i) => {
      if (s.textContent !== letras[i]) s.textContent = letras[i];
      s.style.width = previos[i].ancho;
      s.style.textAlign = previos[i].alinea;
    });
  };
  const paso = (ahora: number) => {
    const t = ahora - inicio;
    if (t >= total) return restaurar();
    const ver = cuadroDescifrar(letras, t, semilla);
    spans.forEach((s, i) => {
      if (s.textContent !== ver[i]) s.textContent = ver[i];
    });
    cuadro = requestAnimationFrame(paso);
  };
  cuadro = requestAnimationFrame(paso);
  return restaurar;
}
