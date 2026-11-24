// Secciones: preguntas en acordeón (con <details>, que funciona con teclado y sin JavaScript), pasos numerados, equipo
// y texto. Al verse, los números y las iniciales se estampan; al abrir una pregunta, su respuesta aparece con resorte.
// El texto se lee desde el primer cuadro: lo que entra animado es decoración.
import type { CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { inicialDe, numeroDePaso, parrafosDe } from "./calculos-2";

export type SeccionViva = { seccionId: string; titulo: string } & (
  | { tipo: "preguntas"; items: { pregunta: string; respuesta: string }[] }
  | { tipo: "equipo"; items: { nombre: string; cargo?: string; descripcion?: string }[] }
  | { tipo: "texto"; texto: string }
  | { tipo: "pasos"; items: { titulo: string; texto?: string }[] }
);

export interface SeccionesVivasProps extends ComunesMomento {
  secciones: SeccionViva[];
}

const ETIQUETAS: Record<string, string> = { preguntas: "Preguntas", equipo: "Equipo", texto: "Información", pasos: "Paso a paso" };

export const CSS_SECCIONES =
  ".mk-m-secciones{display:grid;gap:28px}" +
  ".mk-m-sec-etiqueta{margin:0;font-size:.75rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--mk-m-acento)}" +
  ".mk-m-sec-titulo{margin:2px 0 12px;font-size:1.3rem}" +
  ".mk-m-sec-pregunta{border-bottom:1px solid color-mix(in srgb,var(--mk-m-texto) 16%,transparent)}" +
  ".mk-m-sec-pregunta summary{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:48px;padding:6px 0;font-weight:700;cursor:pointer;list-style:none}" +
  ".mk-m-sec-pregunta summary::-webkit-details-marker{display:none}" +
  ".mk-m-sec-pregunta summary:focus-visible{outline:3px solid var(--mk-m-acento);outline-offset:2px}" +
  ".mk-m-sec-flecha{flex:none;width:.6em;height:.6em;margin:0 4px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;rotate:45deg;transition:rotate .25s ease}" +
  ".mk-m-sec-pregunta[open] .mk-m-sec-flecha{rotate:225deg}" +
  ".mk-m-sec-respuesta{margin:0;padding:0 0 14px;transform-origin:50% 0}" +
  ".mk-m-secciones:not([data-nivel=quieto]) .mk-m-sec-pregunta[open] .mk-m-sec-respuesta{animation:mk-m-abre var(--mk-resorte-ms,500ms) var(--mk-resorte-curva,cubic-bezier(.2,.8,.2,1)) both}" +
  ".mk-m-sec-pasos{list-style:none;margin:0;padding:0;display:grid;gap:12px}" +
  ".mk-m-sec-pasos li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:start}" +
  ".mk-m-sec-numero{display:grid;place-items:center;width:2.4em;height:2.4em;border-radius:50%;font-weight:800;font-variant-numeric:tabular-nums;background:var(--mk-m-acento);color:var(--mk-m-sobre)}" +
  ".mk-m-sec-paso-titulo,.mk-m-sec-nombre{margin:0;font-weight:700}" +
  ".mk-m-sec-paso-texto,.mk-m-sec-cargo,.mk-m-sec-descripcion{margin:0;font-size:.9rem;color:var(--mk-m-suave)}" +
  ".mk-m-sec-equipo{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))}" +
  ".mk-m-sec-equipo li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;padding:10px;border-radius:12px;border:1px solid color-mix(in srgb,var(--mk-m-texto) 14%,transparent)}" +
  ".mk-m-sec-inicial{display:grid;place-items:center;width:2.6em;height:2.6em;border-radius:50%;font-weight:800;background:var(--mk-m-acento);color:var(--mk-m-sobre)}" +
  ".mk-m-sec-texto p{margin:0 0 .8em;white-space:pre-line}" +
  // Los números y las iniciales (decoración) se estampan al verse, uno tras otro.
  ".mk-m-secciones:not([data-nivel=quieto]):not([data-activo]) :is(.mk-m-sec-numero,.mk-m-sec-inicial){opacity:0}" +
  ".mk-m-secciones[data-activo]:not([data-nivel=quieto]) :is(.mk-m-sec-numero,.mk-m-sec-inicial){animation:mk-m-estampa-sec var(--mk-resorte-ms,500ms) var(--mk-resorte-curva,cubic-bezier(.2,.8,.2,1)) both;animation-delay:calc(var(--i)*110ms)}" +
  ".mk-m-secciones[data-activo][data-nivel=liviano] :is(.mk-m-sec-numero,.mk-m-sec-inicial){animation-name:mk-m-aparece-sec}" +
  "@keyframes mk-m-abre{from{opacity:0;transform:translateY(-8px) scaleY(.94)}to{opacity:1;transform:none}}" +
  "@keyframes mk-m-estampa-sec{from{opacity:0;transform:scale(1.7)}40%{opacity:1}to{opacity:1;transform:none}}" +
  "@keyframes mk-m-aparece-sec{from{opacity:0}to{opacity:1}}";

const lista = <T,>(x: unknown): T[] => (Array.isArray(x) ? (x.filter(Boolean) as T[]) : []);

function Cuerpo({ s }: { s: SeccionViva }) {
  if (s.tipo === "preguntas") {
    return (
      <div>
        {lista<{ pregunta: string; respuesta: string }>(s.items).map((p, i) => (
          <details key={i} className="mk-m-sec-pregunta">
            <summary>
              <span>{p.pregunta}</span>
              <span className="mk-m-sec-flecha" aria-hidden="true" />
            </summary>
            <p className="mk-m-sec-respuesta">{p.respuesta}</p>
          </details>
        ))}
      </div>
    );
  }
  if (s.tipo === "pasos") {
    return (
      <ol className="mk-m-sec-pasos">
        {lista<{ titulo: string; texto?: string }>(s.items).map((p, i) => (
          <li key={i}>
            <span className="mk-m-sec-numero" aria-hidden="true" style={{ "--i": i } as CSSProperties}>{numeroDePaso(i)}</span>
            <div>
              <p className="mk-m-sec-paso-titulo">{p.titulo}</p>
              {p.texto && <p className="mk-m-sec-paso-texto">{p.texto}</p>}
            </div>
          </li>
        ))}
      </ol>
    );
  }
  if (s.tipo === "equipo") {
    return (
      <ul className="mk-m-sec-equipo">
        {lista<{ nombre: string; cargo?: string; descripcion?: string }>(s.items).map((p, i) => (
          <li key={i}>
            <span className="mk-m-sec-inicial" aria-hidden="true" style={{ "--i": i } as CSSProperties}>{inicialDe(p.nombre)}</span>
            <div>
              <p className="mk-m-sec-nombre">{p.nombre}</p>
              {p.cargo && <p className="mk-m-sec-cargo">{p.cargo}</p>}
              {p.descripcion && <p className="mk-m-sec-descripcion">{p.descripcion}</p>}
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return <div className="mk-m-sec-texto">{parrafosDe(s.texto).map((p, i) => <p key={i}>{p}</p>)}</div>;
}

export default function SeccionesVivas({ secciones, nivel: forzado, ahorro, className }: SeccionesVivasProps) {
  useStyles("momento-secciones", CSS_SECCIONES);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  // Un tipo que la pieza no conoce no se dibuja (La Mente puede sumar tipos antes que el kit).
  const conocidas = lista<SeccionViva>(secciones).filter((s) => Object.prototype.hasOwnProperty.call(ETIQUETAS, s.tipo) && typeof s.titulo === "string");
  if (!conocidas.length) return null;
  return (
    <div ref={ref} className={["mk-momento mk-m-secciones", className].filter(Boolean).join(" ")} data-momento="secciones" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      {conocidas.map((s) => (
        <section key={s.seccionId} data-seccion={s.tipo}>
          <p className="mk-m-sec-etiqueta">{ETIQUETAS[s.tipo]}</p>
          <h3 className="mk-m-sec-titulo">{s.titulo}</h3>
          <Cuerpo s={s} />
        </section>
      ))}
    </div>
  );
}
