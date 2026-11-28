// ListaViva: una lista donde lo que llega entra con un destello, lo que cambia de lugar se desliza a su lugar nuevo y lo
// que sale se desvanece donde estaba. La primera carga no se anima (todo ya estaba).
import { Children, isValidElement, useLayoutEffect, useRef, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";
import { cambios, esPrimera } from "./lista";
import { c, f, ritmoDe } from "./tema";

export interface ListaVivaProps extends HTMLAttributes<HTMLDivElement> {
  /** Un halo del acento alrededor de lo que llega (por defecto, sí). */
  destello?: boolean;
  /** Elementos con `key` (sin clave no se animan). */
  children: ReactNode;
}

interface Lugar {
  top: number;
  left: number;
  ancho: number;
}

const clave = (k: ReactElement["key"]) => String(k).replace(/^\.\$/, "");

/**
 * `<ListaViva>{pedidos.map((p) => <Fila key={p.id} … />)}</ListaViva>`. Cada hijo va dentro de un `div` con su clave
 * (`data-mk-clave`), que es lo que se anima. Con «reducir movimiento», solo fundidos.
 */
/**
 * El destello de lo que llega: un marco del color del tema (cartel) y otro de tinta, con un halo, que late dos veces
 * (fase 3: así lo pidió el front, porque el de antes casi no se veía). `--mk-destello-color` y `--mk-destello-ancho`
 * lo cambian.
 */
// (Texto plano, sin interpolar: así se descarta al armar si no se usa ListaViva.)
const HALO =
  "0 0 0 var(--mk-destello-ancho,3px) var(--mk-destello-color,var(--mk-cartel,#ffc83d)),0 0 0 calc(var(--mk-destello-ancho,3px) + 2px) var(--mk-texto,#1C1A22),0 0 24px color-mix(in srgb,var(--mk-destello-color,var(--mk-cartel,#ffc83d)) 70%,transparent)";
let css: string | undefined;
const estilos = () =>
  (css ??= `
@media (prefers-reduced-motion:no-preference){[data-mk-destello]{animation:mk-lista-latido .45s ease-in-out 2}}
@keyframes mk-lista-latido{50%{transform:scale(1.025)}}`);

export function ListaViva({ destello = true, children, style, ...resto }: ListaVivaProps) {
  useStyles("lista-viva", estilos());
  const caja = useRef<HTMLDivElement>(null);
  const reducido = useReducedMotion();
  const hijos = Children.toArray(children).filter(isValidElement);
  const claves = hijos.map((h) => clave(h.key));
  const antes = useRef<{ claves: string[]; lugares: Map<string, Lugar>; nodos: Map<string, HTMLElement>; huboLlena: boolean }>({
    claves: [],
    lugares: new Map(),
    nodos: new Map(),
    huboLlena: false,
  });

  useLayoutEffect(() => {
    const el = caja.current;
    if (!el) return;
    const a = antes.current;
    const r = ritmoDe(el);
    const nodos = new Map<string, HTMLElement>();
    for (const n of Array.from(el.children) as HTMLElement[]) if (n.dataset.mkClave) nodos.set(n.dataset.mkClave, n);
    const primera = esPrimera([...(a.huboLlena ? [["·"]] : []), claves]);
    const { entran, salen, quedan } = cambios(a.claves, claves);

    if (!primera) {
      // Lo que sale: una copia en su último lugar, que se desvanece.
      for (const s of salen) {
        const viejo = a.nodos.get(s.clave);
        const lugar = a.lugares.get(s.clave);
        if (!viejo || !lugar) continue;
        const copia = viejo.cloneNode(true) as HTMLElement;
        delete copia.dataset.mkClave;
        copia.dataset.mkSaliendo = "";
        copia.setAttribute("aria-hidden", "true");
        Object.assign(copia.style, { position: "absolute", top: `${lugar.top}px`, left: `${lugar.left}px`, width: `${lugar.ancho}px`, margin: "0", pointerEvents: "none" });
        el.appendChild(copia);
        copia.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320 * r.tiempo, easing: "ease-out" }).onfinish = () => copia.remove();
      }
      // Lo que queda y cambió de lugar: se desliza desde donde estaba (FLIP).
      if (!reducido && r.fuerza > 0)
        for (const k of quedan) {
          const n = nodos.get(k);
          const lugar = a.lugares.get(k);
          if (!n || !lugar) continue;
          const dx = lugar.left - n.offsetLeft;
          const dy = lugar.top - n.offsetTop;
          if (dx || dy) n.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 340 * r.tiempo, easing: "cubic-bezier(.2,.8,.2,1)" });
        }
      // Lo que llega: entra y, si se pide, con un destello.
      for (const k of entran) {
        const n = nodos.get(k);
        if (!n) continue;
        n.animate(reducido ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: `translateY(${12 * r.fuerza}px)` }, { opacity: 1, transform: "none" }], { duration: 280 * r.tiempo, easing: "ease-out" });
        if (!destello) continue;
        const halo = document.createElement("span");
        halo.dataset.mkDestello = "";
        halo.setAttribute("aria-hidden", "true");
        const radio = n.firstElementChild ? getComputedStyle(n.firstElementChild).borderRadius : f("radioTarjeta", "12px");
        Object.assign(halo.style, { position: "absolute", inset: "0", borderRadius: radio, pointerEvents: "none", boxShadow: HALO }); // adn:no: el halo es un efecto
        n.appendChild(halo);
        halo.animate([{ opacity: 1 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], { duration: 1200 * r.tiempo, easing: "ease-out" }).onfinish = () => halo.remove();
      }
    }

    const lugares = new Map<string, Lugar>();
    for (const [k, n] of nodos) lugares.set(k, { top: n.offsetTop, left: n.offsetLeft, ancho: n.offsetWidth });
    antes.current = { claves, lugares, nodos, huboLlena: a.huboLlena || claves.length > 0 };
  });

  return (
    <div ref={caja} style={{ position: "relative", ...style }} {...resto}>
      {hijos.map((h, i) => (
        <div key={h.key ?? i} data-mk-clave={clave(h.key)} style={{ position: "relative" }}>
          {h}
        </div>
      ))}
    </div>
  );
}
