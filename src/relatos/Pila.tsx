// Cartas apiladas (relato «pila»): cada bloque queda pegado arriba mientras el siguiente sube y lo tapa; el tapado se
// achica y se apaga un poco, ligado al scroll. Se carga aparte y solo actúa con scroll nativo y en nivel completo:
// pone su CSS, marca el bloque (`data-pila`) y deja las medidas que el CSS no puede sacar solo.
import { useEffect, type RefObject } from "react";
import { useStyles } from "../utils/styles";
import { altoVista, contenedorScroll } from "./medidas";
import { topPila } from "./medidas-pila";

const COMPLETO = ".mk-pagina:not([data-mk-sin-scroll]):not([data-nivel=quieto]):not([data-nivel=liviano])";
const BLOQUE = `${COMPLETO} .mk-relato[data-modo=pila][data-pila]`;
/** El bloque que tiene otro de pila justo después: ese es el que queda pegado y se tapa. */
const TAPADO = `${BLOQUE}:has(+ .mk-relato[data-modo=pila][data-pila])`;

// El bloque tapado se achica según cuánto lo cubre el siguiente: usa la línea de tiempo de ese bloque (con nombre
// propio, visible desde aquí por el `timeline-scope` de la página), entre que lo empieza a tapar y que lo tapa entero.
// Un bloque con el foco del teclado adentro se despega, para que lo enfocado nunca quede tapado. Solo con el teclado
// (`:focus-visible`): el mouse también enfoca al apretar, y si la carta saltara en ese momento, el clic se perdería.
export const CSS_PILA =
  "@supports (animation-timeline:view()){" +
  `${BLOQUE}{z-index:var(--mk-pila-z,1);background:var(--mk-fondo,var(--lm-fondo,#fff));border-radius:24px 24px 0 0;box-shadow:0 -18px 40px -24px rgba(0,0,0,.45),inset 0 1px 0 color-mix(in srgb,var(--mk-texto,var(--lm-texto,#888)) 16%,transparent)}` +
  `${TAPADO}{position:sticky;top:var(--mk-pila-top,0px)}` +
  `${TAPADO}:has(:focus-visible){position:relative;top:auto}` +
  `${TAPADO}[data-pila-sig]>.mk-relato-in{transform-origin:50% 0;animation:mk-r-pila linear both;animation-timeline:var(--mk-pila-sig);` +
  "animation-range:cover var(--mk-pila-desde,0px) cover var(--mk-pila-hasta,100vh)}" +
  "@keyframes mk-r-pila{to{scale:.94;opacity:.65}}}";

const VARIABLES = ["--mk-pila-top", "--mk-pila-z", "--mk-pila-sig", "--mk-pila-desde", "--mk-pila-hasta", "view-timeline-name"];
const pendientes = new WeakMap<Element, number>();

/** Numera los bloques de pila de la página: orden de apilado y la línea de tiempo de cada uno y de su siguiente. */
function ordenar(pagina: HTMLElement | null) {
  if (!pagina || pendientes.has(pagina)) return;
  pendientes.set(
    pagina,
    requestAnimationFrame(() => {
      pendientes.delete(pagina);
      const bloques = [...pagina.querySelectorAll<HTMLElement>(".mk-relato[data-pila]")];
      bloques.forEach((b, i) => {
        b.style.setProperty("--mk-pila-z", String(i + 1));
        b.style.setProperty("view-timeline-name", `--mk-pila-${i}`);
        const sig = b.nextElementSibling;
        if (sig instanceof HTMLElement && sig === bloques[i + 1]) {
          b.style.setProperty("--mk-pila-sig", `--mk-pila-${i + 1}`);
          b.setAttribute("data-pila-sig", "");
        } else {
          b.style.removeProperty("--mk-pila-sig");
          b.removeAttribute("data-pila-sig");
        }
      });
      if (bloques.length) pagina.style.setProperty("timeline-scope", bloques.map((_, i) => `--mk-pila-${i}`).join(", "));
      else pagina.style.removeProperty("timeline-scope");
    }),
  );
}

export default function Pila({ bloque }: { bloque: RefObject<HTMLDivElement | null> }) {
  useStyles("relato-pila", CSS_PILA);
  useEffect(() => {
    const el = bloque.current;
    if (!el) return;
    const pagina = el.closest<HTMLElement>(".mk-pagina");
    const caja = contenedorScroll(el);
    el.setAttribute("data-pila", "");
    const medir = () => {
      const vista = altoVista(caja);
      const alto = el.offsetHeight;
      // Más alto que la pantalla: primero se recorre entero y recién ahí queda pegado.
      el.style.setProperty("--mk-pila-top", `${topPila(alto, vista)}px`);
      // El siguiente lo empieza a tapar cuando su borde llega al pie de este, y lo tapa entero al llegar arriba.
      el.style.setProperty("--mk-pila-desde", `${Math.max(0, vista - Math.min(alto, vista))}px`);
      el.style.setProperty("--mk-pila-hasta", `${vista}px`);
    };
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    ro?.observe(caja ?? document.documentElement);
    medir();
    ordenar(pagina);
    return () => {
      ro?.disconnect();
      el.removeAttribute("data-pila");
      el.removeAttribute("data-pila-sig");
      for (const v of VARIABLES) el.style.removeProperty(v);
      ordenar(pagina);
    };
  }, [bloque]);
  return null;
}
