import { useEffect, useState, type HTMLAttributes, type RefObject } from "react";
import { useStyles } from "../utils/styles";
import { CSS_MEDIDOR } from "./MedidorPeso";
import { useFluidez, type NivelEscena } from "./nivel";

type Estado = "optimo" | "aceptable" | "excedido";

/* ---------- Fluidez ---------- */

export interface MedidorFluidezProps extends HTMLAttributes<HTMLDivElement> {
  /** El nivel con que quedó la escena, si se quiere mostrar al lado. */
  nivel?: NivelEscena;
}

const NIVELES: Record<NivelEscena, string> = {
  completo: "completo",
  liviano: "liviano (sin shader, video ni luz)",
  quieto: "quieto (ahorro de datos o movimiento reducido)",
};

/** Cuadros por segundo mientras se ve la página: 55 o más va fluido; menos de 40 se nota trabado. */
export function MedidorFluidez({ nivel, className, ...resto }: MedidorFluidezProps) {
  useStyles("medidor-peso", CSS_MEDIDOR);
  const { fps } = useFluidez();
  const estado: Estado = fps === null || fps >= 55 ? "optimo" : fps >= 40 ? "aceptable" : "excedido";
  return (
    <div {...resto} className={`mk-peso${className ? " " + className : ""}`} data-estado={estado} data-fps={fps ?? undefined} role="status">
      <div className="mk-peso-fila">
        <strong>Fluidez</strong>
        <span className="mk-peso-estado">{fps === null ? "Midiendo" : estado === "optimo" ? "Fluido" : estado === "aceptable" ? "Aceptable" : "Trabado"}</span>
      </div>
      <div className="mk-peso-fila">
        <span className="mk-peso-total">{fps ?? "…"} cuadros/s</span>
        <small>meta 55 o más; bajo 40 se nota</small>
      </div>
      {nivel && <small data-nivel={nivel}>Nivel de la escena: {NIVELES[nivel]}</small>}
      <small>Mide este computador; pruébalo también en un Android de gama media.</small>
    </div>
  );
}

/* ---------- Carga (LCP) ---------- */

export interface Carga {
  /** Milisegundos hasta que se pintó el elemento más grande de la primera pantalla. */
  lcp: number | null;
  /** Qué elemento fue (etiqueta y clase). */
  elemento: string | null;
}

/** El LCP con lo que trae el navegador (Chrome y Edge; Safari y Firefox recientes también lo informan). */
export function useCarga(): Carga {
  const [c, setC] = useState<Carga>({ lcp: null, elemento: null });
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined" || !PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")) return;
    const o = new PerformanceObserver((lista) => {
      const todas = lista.getEntries();
      const e = todas[todas.length - 1] as PerformanceEntry & { element?: Element | null };
      if (!e) return;
      const el = e.element;
      setC({ lcp: Math.round(e.startTime), elemento: el ? `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""}` : null });
    });
    o.observe({ type: "largest-contentful-paint", buffered: true });
    return () => o.disconnect();
  }, []);
  return c;
}

/** Cuánto tardó en verse lo principal: bueno hasta 2,5 s, mejorable hasta 4 s (umbrales de Google). */
export function MedidorCarga({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  useStyles("medidor-peso", CSS_MEDIDOR);
  const { lcp, elemento } = useCarga();
  const estado: Estado = lcp === null || lcp <= 2500 ? "optimo" : lcp <= 4000 ? "aceptable" : "excedido";
  return (
    <div {...resto} className={`mk-peso${className ? " " + className : ""}`} data-estado={estado} data-lcp={lcp ?? undefined} role="status">
      <div className="mk-peso-fila">
        <strong>Carga (LCP)</strong>
        <span className="mk-peso-estado">{lcp === null ? "Sin dato" : estado === "optimo" ? "Bueno" : estado === "aceptable" ? "Mejorable" : "Lento"}</span>
      </div>
      <div className="mk-peso-fila">
        <span className="mk-peso-total">{lcp === null ? "—" : `${(lcp / 1000).toFixed(1).replace(".", ",")} s`}</span>
        <small>bueno hasta 2,5 s{elemento ? ` · ${elemento}` : ""}</small>
      </div>
      <small>Es de esta carga, en este computador y esta red. Recarga para medir de nuevo.</small>
    </div>
  );
}

/* ---------- Contraste ---------- */

export interface FallaContraste {
  texto: string;
  ratio: number;
  minimo: number;
}

const rgba = (s: string): [number, number, number, number] => {
  const m = s.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
  const k = s.startsWith("color(") ? 255 : 1;
  return [m[0] * k, m[1] * k, m[2] * k, m[3] ?? 1];
};
const mezcla = (a: number[], b: number[]) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1);
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const fondoDe = (el: Element) => {
  const capas: number[][] = [];
  for (let e: Element | null = el; e; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.backgroundImage !== "none" && !e.classList.contains("mk-estilo")) return null;
    const c = rgba(cs.backgroundColor);
    if (c[3] > 0) {
      capas.push(c);
      if (c[3] >= 1) break;
    }
  }
  let f = [255, 255, 255, 1];
  for (const c of capas.reverse()) f = mezcla(c, f);
  return f;
};

/** Revisa el contraste WCAG AA de los textos del encabezado contra su fondo de color. El texto sobre foto o degradado no se puede medir así. */
export function revisarContraste(raiz: Element, selector = ".mk-enc-titulo,.mk-enc-bajada,.mk-enc-ante,.mk-enc-datos li,.mk-btn"): { fallas: FallaContraste[]; medidos: number; sinMedir: number } {
  const fallas: FallaContraste[] = [];
  let medidos = 0;
  let sinMedir = 0;
  for (const el of raiz.querySelectorAll(selector)) {
    const cs = getComputedStyle(el);
    const bg = fondoDe(el);
    if (!bg) {
      sinMedir++;
      continue;
    }
    medidos++;
    const fg = mezcla(rgba(cs.color), bg);
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    const px = parseFloat(cs.fontSize);
    const grande = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
    const minimo = grande ? 3 : 4.5;
    if (ratio < minimo) fallas.push({ texto: (el.textContent ?? "").trim().slice(0, 28), ratio: Math.round(ratio * 100) / 100, minimo });
  }
  return { fallas, medidos, sinMedir };
}

export interface SemaforoContrasteProps extends HTMLAttributes<HTMLDivElement> {
  objetivo: RefObject<Element | null>;
}

/** Semáforo de contraste para el editor: verde si todo se lee, rojo con la lista de lo que no. */
export function SemaforoContraste({ objetivo, className, ...resto }: SemaforoContrasteProps) {
  useStyles("medidor-peso", CSS_MEDIDOR);
  const [r, setR] = useState<ReturnType<typeof revisarContraste> | null>(null);
  useEffect(() => {
    const el = objetivo.current;
    if (!el) return;
    let espera: ReturnType<typeof setTimeout> | undefined;
    // Espera a que terminen las entradas (texto que aparece con opacidad).
    const revisar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => setR(revisarContraste(el)), 1800);
    };
    revisar();
    const o = new MutationObserver(revisar);
    o.observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "data-mk-estilo", "data-composicion"] });
    return () => {
      clearTimeout(espera);
      o.disconnect();
    };
  }, [objetivo]);

  const estado: Estado = !r || r.fallas.length === 0 ? "optimo" : "excedido";
  return (
    <div {...resto} className={`mk-peso${className ? " " + className : ""}`} data-estado={estado} data-fallas={r?.fallas.length ?? undefined} role="status">
      <div className="mk-peso-fila">
        <strong>Contraste</strong>
        <span className="mk-peso-estado">{!r ? "Revisando" : r.fallas.length === 0 ? "Se lee bien" : `${r.fallas.length} por arreglar`}</span>
      </div>
      {r && r.fallas.length > 0 && (
        <ul>
          {r.fallas.map((f, i) => (
            <li key={i}>
              <span>«{f.texto}»</span>
              <span>{f.ratio.toFixed(2).replace(".", ",")} de {String(f.minimo).replace(".", ",")}</span>
            </li>
          ))}
        </ul>
      )}
      {r && r.sinMedir > 0 && <small>{r.sinMedir} texto(s) sobre foto o degradado: revisa a ojo que se lean.</small>}
      <small>WCAG AA: 4,5 para texto normal y 3 para texto grande.</small>
    </div>
  );
}
