// Ubicación: un plano dibujado (calles inventadas desde la semilla, no un mapa real) que aparece por capas y un pin
// que cae con resorte. La dirección y el enlace a Google Maps son texto y enlace reales.
import { useMemo, type CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { CSS_LATE, useMomento, type ComunesMomento } from "./base";
import { callesDe, esEnlaceSeguro, numeroDe } from "./calculos";

export interface MapaDibujadoProps extends ComunesMomento {
  direccion: string;
  /** El `slug` del negocio: decide el dibujo de las calles. */
  semilla?: string;
  /** Si el negocio está abierto ahora (La Mente lo saca del horario). */
  abierto?: boolean;
  mapsUrl?: string;
}

export const CSS_MAPA =
  ".mk-m-mapa svg{display:block;width:100%;aspect-ratio:16/10;border-radius:14px;background:color-mix(in srgb,var(--mk-m-texto) 6%,var(--mk-m-superficie))}" +
  ".mk-m-mapa-capa{stroke:color-mix(in srgb,var(--mk-m-texto) 22%,transparent);stroke-linecap:round;transform-box:view-box;transform-origin:50% 50%}" +
  ".mk-m-mapa-capa .mk-m-mapa-principal{stroke:color-mix(in srgb,var(--mk-m-acento) 45%,transparent)}" +
  ".mk-m-pin-cae{fill:var(--mk-m-acento)}" +
  ".mk-m-pin-ojo{fill:var(--mk-m-superficie)}" +
  ".mk-m-anillo{fill:none;stroke:var(--mk-m-acento);stroke-width:.8;transform-box:fill-box;transform-origin:center;opacity:0}" +
  ".mk-m-mapa:not([data-nivel=quieto]):not([data-activo]) :is(.mk-m-mapa-capa,.mk-m-pin-cae){opacity:0}" +
  ".mk-m-mapa[data-activo]:not([data-nivel=quieto]) .mk-m-mapa-capa{animation:mk-m-capa .6s ease-out both;animation-delay:calc(var(--c)*140ms)}" +
  ".mk-m-mapa[data-activo]:not([data-nivel=quieto]) .mk-m-pin-cae{animation:mk-m-cae var(--mk-resorte-ms) var(--mk-resorte-curva) both;animation-delay:.45s}" +
  ".mk-m-mapa[data-activo][data-nivel=completo] .mk-m-anillo{animation:mk-m-anillo 1.1s ease-out both;animation-delay:calc(.45s + var(--mk-resorte-ms)*.6)}" +
  "@keyframes mk-m-capa{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}" +
  "@keyframes mk-m-cae{from{opacity:0;transform:translateY(-30px)}25%{opacity:1}to{opacity:1;transform:none}}" +
  "@keyframes mk-m-anillo{from{opacity:.9;transform:scale(.2)}to{opacity:0;transform:scale(2.4)}}" +
  ".mk-m-mapa-dir{margin:.75rem 0 .25rem;font-weight:700}" +
  ".mk-m-mapa-abierto{display:flex;align-items:center;gap:.45rem;margin:0 0 .75rem;font-weight:600}" +
  ".mk-m-mapa-abierto i{width:10px;height:10px;border-radius:50%;background:#2fbf71;box-shadow:0 0 0 3px color-mix(in srgb,#2fbf71 30%,transparent)}" +
  ".mk-m-mapa[data-activo][data-nivel=completo] .mk-m-mapa-abierto i{animation:mk-m-late 1.6s ease-in-out infinite}" +
  ".mk-m-mapa a.mk-m-boton{display:inline-flex;align-items:center;text-decoration:none}";

const esWeb = (u?: string) => !!u && /^https?:\/\//i.test(u) && esEnlaceSeguro(u);

export function MapaDibujado({ direccion, semilla = "", abierto, mapsUrl, nivel: forzado, ahorro, className }: MapaDibujadoProps) {
  useStyles("momento-mapa", CSS_MAPA);
  // El latido del punto «Abierto ahora» usa la misma animación que el premio de los sellos.
  useStyles("momento-late", CSS_LATE);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const { calles, pin } = useMemo(() => callesDe(numeroDe(semilla)), [semilla]);
  const capas = [0, 1, 2].map((c) => calles.filter((_, i) => i % 3 === c));
  return (
    <div ref={ref} className={["mk-momento mk-m-mapa", className].filter(Boolean).join(" ")} data-momento="mapa" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        {capas.map((grupo, c) => (
          <g key={c} className="mk-m-mapa-capa" style={{ "--c": c } as CSSProperties}>
            {grupo.map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} strokeWidth={l.ancho * 0.5} className={l.ancho === 6 ? "mk-m-mapa-principal" : undefined} />
            ))}
          </g>
        ))}
        <g transform={`translate(${pin.x} ${pin.y})`}>
          <circle className="mk-m-anillo" r="3" />
          <g className="mk-m-pin-cae">
            <path d="M0 0C-4-5-5-7-5-9.5a5 5 0 0 1 10 0C5-7 4-5 0 0z" />
            <circle className="mk-m-pin-ojo" cx="0" cy="-9.5" r="2" />
          </g>
        </g>
      </svg>
      <p className="mk-m-mapa-dir">{direccion}</p>
      {abierto && <p className="mk-m-mapa-abierto"><i aria-hidden="true" />Abierto ahora</p>}
      {esWeb(mapsUrl) && <a className="mk-m-boton" href={mapsUrl} target="_blank" rel="noopener noreferrer">Ver en Google Maps</a>}
    </div>
  );
}
