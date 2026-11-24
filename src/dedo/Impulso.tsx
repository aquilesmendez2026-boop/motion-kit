// Inclinación por velocidad (relato de página «impulso»): mientras más rápido se baja, más se inclinan los bloques; al
// parar vuelven a quedar derechos. Se carga aparte y la página lo monta solo en nivel completo.
import { useEffect, type RefObject } from "react";
import { useStyles } from "../utils/styles";
import { inclinacionDe, velocidadScroll, type MuestraScroll } from "./calculo-impulso";
import { pasoResorte } from "./resorte";

// La inclinación va solo en los bloques que se ven y solo mientras se mueven (`data-impulso`): cada cuadro toca un par
// de elementos y, en reposo, los bloques quedan sin transformación, igual que sin el relato. La variable no se hereda
// (`@property`): cambiarla no obliga a recalcular lo que hay dentro del bloque.
export const CSS_IMPULSO =
  '@property --mk-impulso{syntax:"<number>";inherits:false;initial-value:0}' +
  ".mk-pagina[data-mk-relato-pagina=impulso] .mk-relato-in[data-impulso]{transform:skewY(calc(var(--mk-impulso,0)*1deg));will-change:transform}";

/**
 * Tope de la inclinación (grados). El resorte es el de la casa: al parar, los bloques se pasan un poco al otro lado y
 * vuelven. Lo que se dibuja nunca pasa del tope, aunque el resorte se pase.
 */
const TOPE = 1.5;

export default function Impulso({ pagina }: { pagina: RefObject<HTMLDivElement | null> }) {
  useStyles("impulso", CSS_IMPULSO);
  useEffect(() => {
    const el = pagina.current;
    if (!el || typeof requestAnimationFrame === "undefined") return;
    let e = { x: 0, v: 0 };
    let cuadro = 0;
    let antes = 0;
    /** Lo que hace scroll en esta pasada: un contenedor, o `null` si es la ventana. */
    let caja: HTMLElement | null = null;
    /** Dónde estaba el scroll la última vez que se miró. */
    let ultimaY = window.scrollY;
    let muestras: MuestraScroll[] = [];
    let bloques: HTMLElement[] = [];
    let inclinados = new Set<HTMLElement>();

    const leer = () => (caja ? caja.scrollTop : window.scrollY);
    const soltar = (b: HTMLElement) => {
      b.removeAttribute("data-impulso");
      b.style.removeProperty("--mk-impulso");
    };
    /** De vuelta derechos: los bloques quedan sin rastro y deja de calcular. */
    const dormir = () => {
      e = { x: 0, v: 0 };
      antes = 0;
      inclinados.forEach(soltar);
      inclinados = new Set();
    };

    const paso = (t: number) => {
      cuadro = 0;
      const dt = antes ? Math.min(0.05, Math.max(0.004, (t - antes) / 1000)) : 1 / 60;
      // Al despertar: lo que se movió desde el reposo hasta este cuadro cuenta como un cuadro de 60 por segundo.
      if (!antes) muestras = [{ t: t - 1000 / 60, y: ultimaY }];
      antes = t;
      ultimaY = leer();
      const velocidad = velocidadScroll(muestras, t, ultimaY);
      e = pasoResorte(e, inclinacionDe(velocidad, TOPE), dt);
      if (velocidad === 0 && Math.abs(e.x) < 0.005 && Math.abs(e.v) < 0.05) return dormir();
      // Primero se lee (qué bloques se ven) y después se escribe.
      const marco = caja?.getBoundingClientRect();
      const arriba = Math.max(0, marco ? marco.top : 0);
      const abajo = Math.min(window.innerHeight, marco ? marco.bottom : Infinity);
      const ahora = new Set<HTMLElement>();
      for (const b of bloques) {
        const r = b.getBoundingClientRect();
        if (r.bottom > arriba && r.top < abajo) ahora.add(b);
      }
      const x = Math.max(-TOPE, Math.min(TOPE, e.x)).toFixed(3);
      inclinados.forEach((b) => !ahora.has(b) && soltar(b));
      ahora.forEach((b) => {
        if (!inclinados.has(b)) b.setAttribute("data-impulso", "");
        b.style.setProperty("--mk-impulso", x);
      });
      inclinados = ahora;
      cuadro = requestAnimationFrame(paso);
    };

    // Se escucha en el documento, en la bajada del evento: así da igual si la página baja con la ventana o dentro de
    // un contenedor. El scroll de algo que está dentro de la página (una tira de fotos) no cuenta.
    const alBajar = (ev: Event) => {
      if (cuadro) return;
      const t = ev.target;
      const nueva = t === document ? null : t instanceof HTMLElement && t.contains(el) ? t : undefined;
      if (nueva === undefined) return;
      if (nueva !== caja) {
        // Otro contenedor: se parte desde donde está, sin salto.
        caja = nueva;
        ultimaY = leer();
      }
      bloques = [...el.querySelectorAll<HTMLElement>(".mk-relato-in")];
      cuadro = requestAnimationFrame(paso);
    };
    document.addEventListener("scroll", alBajar, { capture: true, passive: true });

    return () => {
      document.removeEventListener("scroll", alBajar, { capture: true });
      cancelAnimationFrame(cuadro);
      inclinados.forEach(soltar);
    };
  }, [pagina]);
  return null;
}
