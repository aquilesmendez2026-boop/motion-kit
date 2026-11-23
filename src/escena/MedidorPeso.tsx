import { useEffect, useState, type HTMLAttributes, type RefObject } from "react";
import { useStyles } from "../utils/styles";
import { formatearPeso, medirPeso, PRESUPUESTO_ENCABEZADO, type Dispositivo, type MedicionPeso, type Presupuesto } from "./peso";

export const CSS_MEDIDOR = `
.mk-peso{font:13px/1.4 system-ui,sans-serif;color:#1d1b26;background:#fff;border:1px solid #d9d6e3;border-radius:12px;padding:.75rem .9rem;display:grid;gap:.5rem}
.mk-peso-fila{display:flex;justify-content:space-between;gap:.75rem;align-items:baseline;flex-wrap:wrap}
.mk-peso-total{font-size:1.05rem;font-weight:650}
.mk-peso-estado{padding:.15rem .55rem;border-radius:999px;font-weight:600;font-size:12px}
.mk-peso[data-estado=optimo] .mk-peso-estado{background:#dff3e6;color:#16613a}
.mk-peso[data-estado=aceptable] .mk-peso-estado{background:#fff1d1;color:#7a4b00}
.mk-peso[data-estado=excedido] .mk-peso-estado{background:#fde0de;color:#9b1c14}
.mk-peso-barra{position:relative;height:8px;border-radius:99px;background:#eeecf3;overflow:hidden}
.mk-peso-barra>i{position:absolute;inset:0 auto 0 0;border-radius:inherit;background:#2f9e5d;transition:width .3s}
.mk-peso[data-estado=aceptable] .mk-peso-barra>i{background:#d99a00}
.mk-peso[data-estado=excedido] .mk-peso-barra>i{background:#d1372c}
.mk-peso-barra>b{position:absolute;top:0;bottom:0;width:2px;background:#1d1b26;opacity:.45}
.mk-peso small{color:#5d5a6b}
.mk-peso ul{margin:0;padding:0;list-style:none;display:grid;gap:.2rem;max-height:9rem;overflow:auto}
.mk-peso li{display:flex;justify-content:space-between;gap:.75rem;font-size:12px}
.mk-peso li span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
`;

const ESTADOS = { optimo: "Óptimo", aceptable: "Sobre lo óptimo", excedido: "Pasado del máximo" } as const;
const DISPOSITIVOS = { movil: "celular", escritorio: "escritorio" } as const;

const nombreDe = (url: string) => {
  if (url.startsWith("blob:")) return "archivo elegido";
  if (url.startsWith("data:")) return `incrustado (${url.slice(5, url.indexOf(";") > 0 ? url.indexOf(";") : 20)})`;
  try {
    const u = new URL(url, location.href);
    return u.pathname.split("/").filter(Boolean).pop() ?? u.host;
  } catch {
    return url;
  }
};

/**
 * Mide en vivo lo que pesa un elemento y lo muestra contra el presupuesto.
 * Se vuelve a medir cuando cambian sus imágenes o fondos y cuando termina de bajar algo.
 */
export function usePeso(
  objetivo: RefObject<Element | null>,
  opciones: { dispositivo?: Dispositivo; presupuesto?: Record<Dispositivo, Presupuesto> } = {},
) {
  const [medicion, setMedicion] = useState<MedicionPeso | null>(null);
  const { dispositivo, presupuesto } = opciones;

  useEffect(() => {
    const el = objetivo.current;
    if (!el || typeof window === "undefined") return;
    let vivo = true;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const medir = () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        medirPeso(el, { dispositivo, presupuesto }).then((m) => vivo && setMedicion(m));
      }, 350);
    };
    medir();
    const cambios = new MutationObserver(medir);
    cambios.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["src", "srcset", "poster", "class", "href", "data-composicion"] });
    // `style` queda fuera: la escena lo cambia en cada cuadro mientras se mueve.
    let recursos: PerformanceObserver | undefined;
    if (typeof PerformanceObserver !== "undefined") {
      recursos = new PerformanceObserver(medir);
      try {
        recursos.observe({ type: "resource", buffered: false });
      } catch {
        recursos = undefined;
      }
    }
    const tamano = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : undefined;
    tamano?.observe(el);
    return () => {
      vivo = false;
      clearTimeout(espera);
      cambios.disconnect();
      recursos?.disconnect();
      tamano?.disconnect();
    };
  }, [objetivo, dispositivo, presupuesto]);

  return medicion;
}

export interface MedidorPesoProps extends HTMLAttributes<HTMLDivElement> {
  /** El elemento que se mide (por ejemplo, un contenedor alrededor del `Encabezado`). */
  objetivo: RefObject<Element | null>;
  /** Por defecto se decide por el ancho del elemento (hasta 640 px es celular). */
  dispositivo?: Dispositivo;
  presupuesto?: Record<Dispositivo, Presupuesto>;
  /** Mostrar la lista de recursos. */
  detalle?: boolean;
  titulo?: string;
}

/** Cuánto pesa el encabezado y si está dentro del presupuesto (óptimo, sobre lo óptimo o pasado del máximo). */
export function MedidorPeso({ objetivo, dispositivo, presupuesto = PRESUPUESTO_ENCABEZADO, detalle = true, titulo = "Peso del encabezado", className, ...resto }: MedidorPesoProps) {
  useStyles("medidor-peso", CSS_MEDIDOR);
  const m = usePeso(objetivo, { dispositivo, presupuesto });
  if (!m) return <div {...resto} className={`mk-peso${className ? " " + className : ""}`} aria-busy="true">Midiendo…</div>;
  const escala = Math.max(m.presupuesto.maximo * 1.15, m.total);
  return (
    <div {...resto} className={`mk-peso${className ? " " + className : ""}`} data-estado={m.estado} data-bytes={m.total} role="status" aria-live="polite">
      <div className="mk-peso-fila">
        <strong>{titulo}</strong>
        <span className="mk-peso-estado">{ESTADOS[m.estado]}</span>
      </div>
      <div className="mk-peso-fila">
        <span className="mk-peso-total">{formatearPeso(m.total)}</span>
        <small>
          en {DISPOSITIVOS[m.dispositivo]}: óptimo hasta {formatearPeso(m.presupuesto.optimo)}, máximo {formatearPeso(m.presupuesto.maximo)}
        </small>
      </div>
      <div className="mk-peso-barra" aria-hidden="true">
        <i style={{ width: `${Math.min(100, (m.total / escala) * 100)}%` }} />
        <b style={{ left: `${(m.presupuesto.optimo / escala) * 100}%` }} />
        <b style={{ left: `${(m.presupuesto.maximo / escala) * 100}%` }} />
      </div>
      {detalle && m.recursos.length > 0 && (
        <ul>
          {m.recursos.map((r) => (
            <li key={r.url} title={r.url}>
              <span>{r.tipo} · {nombreDe(r.url)}</span>
              <span>{r.bytes === null ? "sin dato" : formatearPeso(r.bytes)}{r.origen === "cache" ? " (caché)" : r.origen === "local" ? " (sin subir)" : ""}</span>
            </li>
          ))}
        </ul>
      )}
      {m.desconocidos > 0 && <small>{m.desconocidos} recurso(s) de otro dominio no informan su peso y no entran al total.</small>}
      <small>Sin contar el JavaScript ni el CSS del sitio.</small>
    </div>
  );
}
