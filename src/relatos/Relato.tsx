import { useContext, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes } from "react";
import { useStyles } from "../utils/styles";
import { PARTES_RELATO, RELATOS, type RelatoBloqueId } from "./catalogo";
import { ContextoRelato } from "./PaginaRelato";
import { CSS_RELATOS } from "./css";
import { altoVista, contenedorScroll } from "./medidas";

export interface RelatoProps extends HTMLAttributes<HTMLDivElement> {
  /** El relato de este bloque; por defecto, el de la página. «ninguno» lo deja quieto. */
  modo?: RelatoBloqueId | "ninguno";
}

/** Pone --mk-i (índice entre las de su tipo) y --mk-n (cuántas hay) en cada parte marcada y en cada palabra. */
function indexar(el: HTMLElement) {
  const grupos = [...PARTES_RELATO.map((p) => `[data-mk-parte="${p}"]`), "[data-mk-palabra]"];
  for (const g of grupos) {
    const xs = el.querySelectorAll<HTMLElement>(g);
    xs.forEach((x, i) => {
      x.style.setProperty("--mk-i", String(i));
      x.style.setProperty("--mk-n", String(xs.length));
    });
  }
}

/**
 * La tira de un carrete: el contenedor que tiene al menos dos fotos (o, si no, dos tarjetas), nunca el bloque entero.
 * Una sola foto suelta no es una tira.
 */
function tiraDe(el: HTMLElement): HTMLElement | null {
  for (const parte of ["foto", "tarjeta"]) {
    const cuenta = new Map<HTMLElement, number>();
    el.querySelectorAll<HTMLElement>(`[data-mk-parte="${parte}"]`).forEach((x) => {
      const p = x.parentElement;
      if (p && !p.classList.contains("mk-relato-in")) cuenta.set(p, (cuenta.get(p) ?? 0) + 1);
    });
    for (const [p, n] of cuenta) if (n >= 2) return p;
  }
  return null;
}

/** El relato que se puede usar: si la ficha requiere marcas y el bloque no las trae (o no hay tira), «escenas». */
function efectivoDe(el: HTMLElement, pedido: RelatoBloqueId | "ninguno"): RelatoBloqueId | "ninguno" {
  if (pedido === "ninguno") return pedido;
  if (pedido === "carrete") return tiraDe(el) ? pedido : "escenas";
  // Subtítulos enciende palabras: sin palabras marcadas (FraseRelato) no hay nada que encender.
  if (pedido === "subtitulos") return el.querySelector('[data-mk-parte="frase"] [data-mk-palabra]') ? pedido : "escenas";
  const { requiere } = RELATOS[pedido];
  return requiere.length === 0 || requiere.some((p) => el.querySelector(`[data-mk-parte="${p}"]`)) ? pedido : "escenas";
}


/** Carrete: marca la tira y mide cuánto tiene que correr. */
function prepararTira(el: HTMLElement, interior: HTMLElement) {
  const tira = tiraDe(el);
  el.querySelectorAll("[data-mk-tira]").forEach((t) => t !== tira && t.removeAttribute("data-mk-tira"));
  if (!tira) return null;
  tira.setAttribute("data-mk-tira", "");
  const sobra = tira.scrollWidth - interior.clientWidth;
  // Si la tira cabe entera, no hay nada que pasar de lado: se cuenta como escenas y no alarga la página.
  el.toggleAttribute("data-tira-corta", sobra <= 0);
  el.style.setProperty("--mk-tira-dx", `${-Math.max(0, sobra + 24)}px`);
  return tira;
}

/**
 * Envuelve un bloque cualquiera (también uno de La Mente) y lo cuenta con su relato. Encuentra las partes del bloque
 * por sus marcas `data-mk-parte`; si llegan partes después (datos que cargan), las vuelve a contar.
 */
export function Relato({ modo, className, children, ...resto }: RelatoProps) {
  useStyles("relatos", CSS_RELATOS);
  const ctx = useContext(ContextoRelato);
  const pedido = modo ?? ctx?.relato ?? "escenas";
  const ref = useRef<HTMLDivElement>(null);
  const interior = useRef<HTMLDivElement>(null);
  const [efectivo, setEfectivo] = useState(pedido);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const revisar = () => {
      indexar(el);
      setEfectivo(efectivoDe(el, pedido));
    };
    revisar();
    if (typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(revisar);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [pedido]);

  // Medidas para los relatos que se quedan quietos mientras se baja (cuento, carrete, subtítulos).
  const largo = efectivo === "cuento" || efectivo === "carrete" || efectivo === "subtitulos";
  useLayoutEffect(() => {
    const el = ref.current;
    const inn = interior.current;
    if (!el || !inn || !largo) return;
    const caja = contenedorScroll(el);
    let ro: ResizeObserver | null = null;
    let tiraVista: Element | null = null;
    const medir = () => {
      const alto = altoVista(caja);
      el.style.setProperty("--mk-alto-vista", `${alto}px`);
      if (efectivo === "cuento") {
        const contenido = [...inn.children].reduce((t, c) => t + (c as HTMLElement).offsetHeight, 0);
        el.toggleAttribute("data-capitulo-largo", contenido > alto * 0.9);
      }
      if (efectivo === "carrete") {
        // La tira también se observa: si llegan fotos o cargan imágenes, crece y hay que volver a medir.
        const tira = prepararTira(el, inn);
        if (tira && tira !== tiraVista && ro) {
          ro.observe(tira);
          tiraVista = tira;
        }
      }
    };
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(medir);
      ro.observe(caja ?? document.documentElement);
      ro.observe(inn);
    }
    medir();
    return () => {
      ro?.disconnect();
      el.removeAttribute("data-capitulo-largo");
      el.removeAttribute("data-tira-corta");
    };
  }, [efectivo, largo]);

  const observar = ctx?.observar;
  useEffect(() => observar?.(ref.current), [observar]);

  return (
    <div {...resto} ref={ref} className={`mk-relato${className ? " " + className : ""}`} data-modo={efectivo} data-pedido={pedido}>
      {efectivo === "profundidad" && (
        <span className="mk-capas" aria-hidden="true"><i /><i /><i /></span>
      )}
      <div className="mk-relato-in" ref={interior}>{children}</div>
    </div>
  );
}
