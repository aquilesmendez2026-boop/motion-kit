// La barra lateral del panel: las secciones por grupo, cada grupo con su color, la elegida marcada y, si se pide,
// contraída a solo íconos. Lee el tema (hoja, trazo, radios, sombras, letra de cartel) y se marca para su firma
// (`barra`, `grupo`, `icono`). Es el `barraLateral.css` del panel de La Mente; ver docs/un-solo-motor/piezas-del-panel.md.
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
} from "react";
import { useStyles } from "../utils/styles";
import { IconoCaja } from "./IconoCaja";

export interface SeccionBarra {
  id: string;
  nombre: string;
  /** El ícono (un SVG o un emoji). */
  icono: ReactNode;
  /** La sección existe pero el negocio no tiene su módulo: va punteada, con un «+». */
  sinModulo?: boolean;
  /** Un nombre más corto para la barra; el completo queda para el lector. */
  corto?: string;
  /** El texto al pasar con la barra abierta. */
  titulo?: string;
  /** El texto al pasar con la barra contraída (por defecto, el nombre). */
  tituloContraida?: string;
  /** Una insignia de novedad a la derecha (un número, «Nuevo»); contraída, queda como un punto. */
  insignia?: ReactNode;
  /** Atributos `data-*` del botón de la sección (por ejemplo, `data-soporte-accion`). */
  atributos?: Record<`data-${string}`, string>;
}

export interface GrupoBarra {
  /** El nombre del grupo (`null`: sin título, como «Resumen» arriba). */
  nombre: string | null;
  /** El color del grupo (tiñe los íconos, la rayita y la sombra de la elegida). */
  color?: string;
  secciones: SeccionBarra[];
}

export interface BarraLateralProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children"
> {
  grupos: GrupoBarra[];
  /** El `id` de la sección elegida. */
  actual: string;
  alElegir: (id: string) => void;
  /** Solo íconos (cada uno con su nombre para el lector y al pasar). */
  contraida?: boolean;
  /** Si viene, la barra muestra el botón para contraerse y estirarse. */
  alContraer?: () => void;
  /** El nombre de la barra para el lector (por defecto, «Secciones»). */
  etiqueta?: string;
  /** Atributos del botón de contraer (`aria-controls`, `data-soporte-accion`, otros textos…). */
  propsContraer?: ButtonHTMLAttributes<HTMLButtonElement> &
    Record<`data-${string}`, string>;
}

const T = "var(--mk-texto,#1C1A22)";
const G = "var(--mk-grupo,var(--mk-acento,#9333ea))";
let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-barra{box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background-color:var(--mk-superficie,#fff);color:${T};border:var(--mk-trazo,2.5px solid ${T});border-radius:var(--mk-radio-tarjeta,16px);box-shadow:var(--mk-sombra,6px 6px 0 ${T})}
.mk-barra-cabeza{display:flex;justify-content:flex-end;padding:2px 6px;border-bottom:var(--mk-fila-borde,1px solid var(--mk-borde,#E7E1D8))}
.mk-barra[data-contraida] .mk-barra-cabeza{justify-content:center}
.mk-barra-contraer{display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;border-radius:var(--mk-radio-boton,10px);background:none;color:inherit;cursor:pointer}
.mk-barra-contraer:hover{background-color:color-mix(in srgb,${T} 8%,transparent)}
.mk-barra-contraer svg{width:18px;height:18px}
.mk-barra[data-contraida] .mk-barra-contraer svg{transform:rotate(180deg)}
.mk-barra-grupos{display:flex;flex-direction:column;gap:2px;padding:8px 10px 12px 8px}
.mk-barra-grupo-nombre{display:flex;align-items:center;gap:.5rem;margin:0;padding:16px 12px 4px;font-family:var(--mk-fuente-cartel,inherit);font-size:.75rem;font-weight:400;letter-spacing:.01em}
.mk-barra-grupo-nombre::before{content:"";flex-shrink:0;width:10px;height:2px;border-radius:999px;background-color:${G}}
.mk-barra-lista{display:flex;flex-direction:column;gap:2px;margin:0;padding:0;list-style:none}
.mk-barra-item{position:relative;display:flex;align-items:center;gap:.7rem;box-sizing:border-box;width:100%;min-height:44px;padding:8px 16px;border:0;border-radius:var(--mk-radio-boton,10px);background:none;color:var(--mk-suave,#5E5A68);font:inherit;font-size:.875rem;font-weight:500;text-align:start;cursor:pointer}
.mk-barra-item:not([data-sin-modulo]) .mk-barra-nombre{font-weight:600;color:${T}}
.mk-barra-item:hover:not([aria-current=page]){background-color:color-mix(in srgb,${G} 10%,transparent)}
.mk-barra-item[aria-current=page]{background-color:${T};color:var(--mk-fondo,#FAF7F2);outline:2px solid ${T};outline-offset:-2px;box-shadow:var(--mk-elegida-sombra,3px 3px 0 ${G})}
.mk-barra-item[aria-current=page] .mk-barra-nombre{color:inherit}
.mk-barra-item:focus-visible{outline:3px solid ${G}!important;outline-offset:1px!important}
.mk-barra .mk-icono-caja{border-width:2px;border-radius:var(--mk-radio-icono-chico,8px);background-color:color-mix(in srgb,${G} 18%,var(--mk-superficie,#fff));color:${T};font-size:.875rem;line-height:1;transition:transform .18s ease}
.mk-barra .mk-icono-caja>svg{width:15px;height:15px}
.mk-barra-item[data-sin-modulo] .mk-icono-caja{border-style:dashed;border-color:currentColor;background-color:transparent}
.mk-barra-item:hover:not([aria-current=page]) .mk-icono-caja{transform:translate(-1px,-1px);box-shadow:var(--mk-sombra-mini,2px 2px 0 ${T})}
.mk-barra-item:hover .mk-icono-caja{animation:mk-barra-salto .42s cubic-bezier(.3,1.6,.5,1)}
.mk-barra-item[aria-current=page] .mk-icono-caja{border-color:var(--mk-fondo,#FAF7F2);background-color:var(--mk-cartel,#ffc83d);color:var(--mk-sobre-sol,#10223f);animation:mk-barra-pop .45s cubic-bezier(.3,1.7,.5,1)}
.mk-barra-nombre{min-width:0;overflow-wrap:anywhere}
.mk-barra-oculto{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.mk-barra-insignia{margin-inline-start:auto;font-size:.75rem;font-weight:800}
.mk-barra-punto{display:none}
.mk-barra[data-contraida] .mk-barra-insignia{display:none}
.mk-barra[data-contraida] .mk-barra-punto{display:block;position:absolute;top:4px;right:4px;width:8px;height:8px;border-radius:50%;background-color:var(--mk-novedad,#14b8a6)}
.mk-barra-item[data-sin-modulo]::after{content:"+";display:grid;place-items:center;flex-shrink:0;box-sizing:border-box;width:18px;height:18px;margin-inline-start:auto;border-width:1.5px;border-style:dashed;border-color:currentColor;border-radius:999px;font-size:.75rem;font-weight:800;line-height:1;opacity:.7}
.mk-barra-item[data-sin-modulo]:hover::after{color:${G};opacity:1}
.mk-barra[data-contraida] .mk-barra-grupos{align-items:center;padding:8px 6px 12px}
.mk-barra[data-contraida] .mk-barra-item{justify-content:center;width:44px;height:44px;padding:0}
.mk-barra[data-contraida] .mk-barra-nombre{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.mk-barra[data-contraida] .mk-barra-item::after{display:none}
.mk-barra[data-contraida] .mk-barra-item[data-sin-modulo] .mk-icono-caja{opacity:.55}
.mk-barra[data-contraida] .mk-barra-grupo-nombre{align-self:stretch;height:1px;margin:.6rem .75rem;padding:0;overflow:hidden;font-size:0;background-color:var(--mk-borde,#E7E1D8)}
.mk-barra[data-contraida] .mk-barra-grupo-nombre::before{display:none}
@keyframes mk-barra-salto{40%{transform:translateY(-3px) rotate(-8deg)}}
@keyframes mk-barra-pop{from{transform:scale(.6) rotate(-12deg)}}
@media (prefers-reduced-motion:reduce){.mk-barra .mk-icono-caja{transition:none;animation:none!important;transform:none!important}}`);

/** Las flechas, Inicio y Fin llevan el foco entre las secciones (Tab también las recorre, una por una). */
function alTeclado(ev: KeyboardEvent<HTMLElement>) {
  const items = [
    ...ev.currentTarget.querySelectorAll<HTMLButtonElement>(".mk-barra-item"),
  ];
  const i = items.indexOf(ev.target as HTMLButtonElement);
  if (i < 0) return;
  const destino = {
    ArrowDown: i + 1,
    ArrowUp: i - 1,
    Home: 0,
    End: items.length - 1,
  }[ev.key];
  if (destino === undefined) return;
  ev.preventDefault();
  items[Math.max(0, Math.min(items.length - 1, destino))]?.focus();
}

export function BarraLateral({
  grupos,
  actual,
  alElegir,
  contraida = false,
  alContraer,
  etiqueta = "Secciones",
  propsContraer,
  className,
  onKeyDown,
  ...resto
}: BarraLateralProps) {
  useStyles("barra-lateral", estilos());
  return (
    <nav
      aria-label={etiqueta}
      {...resto}
      className={className ? `mk-barra ${className}` : "mk-barra"}
      data-mk-adorno="barra"
      data-contraida={contraida ? "" : undefined}
      onKeyDown={(ev) => {
        onKeyDown?.(ev);
        if (!ev.defaultPrevented) alTeclado(ev);
      }}
    >
      {alContraer && (
        <div className="mk-barra-cabeza">
          <button
            type="button"
            aria-label={
              contraida ? "Mostrar los nombres" : "Mostrar solo los íconos"
            }
            title={contraida ? "Mostrar los nombres" : "Contraer la barra"}
            {...propsContraer}
            className="mk-barra-contraer"
            aria-expanded={!contraida}
            onClick={alContraer}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>
      )}
      <div className="mk-barra-grupos">
        {grupos.map((g, n) => (
          <div
            key={g.nombre ?? `grupo-${n}`}
            className="mk-barra-grupo"
            role={g.nombre ? "group" : undefined}
            aria-label={g.nombre ?? undefined}
            style={
              g.color ? ({ "--mk-grupo": g.color } as CSSProperties) : undefined
            }
          >
            {g.nombre && (
              <p
                className="mk-barra-grupo-nombre"
                data-mk-adorno="grupo"
                aria-hidden="true"
              >
                {g.nombre}
              </p>
            )}
            <ul className="mk-barra-lista">
              {g.secciones.map((x) => (
                <li key={x.id}>
                  <button
                    type="button"
                    {...x.atributos}
                    className="mk-barra-item"
                    data-seccion={x.id}
                    data-sin-modulo={x.sinModulo ? "" : undefined}
                    data-novedad={x.insignia ? "" : undefined}
                    aria-current={x.id === actual ? "page" : undefined}
                    aria-label={contraida ? x.nombre : undefined}
                    title={
                      contraida ? (x.tituloContraida ?? x.nombre) : x.titulo
                    }
                    onClick={() => alElegir(x.id)}
                  >
                    <IconoCaja style={{ width: 28, height: 28 }}>
                      {x.icono}
                    </IconoCaja>
                    <span className="mk-barra-nombre">
                      {x.corto ? (
                        <>
                          <span aria-hidden="true">{x.corto}</span>
                          <span className="mk-barra-oculto">{x.nombre}</span>
                        </>
                      ) : (
                        x.nombre
                      )}
                    </span>
                    {x.insignia != null &&
                      x.insignia !== false &&
                      x.insignia !== "" && (
                        <>
                          <span className="mk-barra-insignia">
                            {x.insignia}
                          </span>
                          <span className="mk-barra-punto" aria-hidden="true" />
                        </>
                      )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
