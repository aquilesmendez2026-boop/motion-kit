// Novedades: las tarjetas llegan de a una, como correo que cae en la bandeja. La más nueva lleva «Nuevo» si es de
// esta semana. El texto se lee siempre: lo que se anima es el lugar de la tarjeta, y una tarjeta a la que se apunta o
// se aprieta deja de moverse, para que el clic no se pierda.
import type { CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { esEnlaceSeguro } from "./calculos";
import { esNueva, fechaLarga } from "./calculos-2";

export interface EntradaNovedad {
  titulo: string;
  resumen?: string;
  /** La foto de portada. */
  foto?: string;
  /** Fecha ISO de publicación. */
  publicada: string;
  /** A dónde lleva la tarjeta. Si no es un enlace seguro, la tarjeta se dibuja sin enlace. */
  href: string;
}

export interface NovedadesQueLleganProps extends ComunesMomento {
  entradas: EntradaNovedad[];
  zona?: string;
  /** Reloj (pruebas y vitrina). */
  ahora?: () => Date;
}

export const CSS_NOVEDADES =
  ".mk-m-nov-lista{list-style:none;margin:0;padding:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}" +
  ".mk-m-nov-tarjeta{position:relative;display:grid;align-content:start;gap:6px;height:100%;padding:12px;border-radius:14px;color:inherit;text-decoration:none;" +
  "background:var(--mk-m-superficie);border:1px solid color-mix(in srgb,var(--mk-m-texto) 14%,transparent)}" +
  "a.mk-m-nov-tarjeta:focus-visible{outline:3px solid var(--mk-m-acento);outline-offset:2px}" +
  ".mk-m-nov-tarjeta img{display:block;width:100%;height:150px;object-fit:cover;border-radius:10px}" +
  ".mk-m-nov-fecha{margin:0;font-size:.8rem;color:var(--mk-m-suave)}" +
  ".mk-m-nov-titulo{margin:0;font-weight:700;font-size:1.05rem}" +
  ".mk-m-nov-resumen{margin:0;font-size:.9rem;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}" +
  ".mk-m-nov-nuevo{position:absolute;top:-8px;right:10px;padding:2px 10px;border-radius:999px;font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;" +
  "background:var(--mk-m-acento);color:var(--mk-m-sobre)}" +
  ".mk-m-novedades[data-activo][data-nivel=completo] .mk-m-nov-tarjeta{animation:mk-m-llega var(--mk-resorte-ms,600ms) var(--mk-resorte-curva,cubic-bezier(.2,.8,.2,1)) both;animation-delay:calc(var(--i)*130ms)}" +
  ".mk-m-novedades[data-activo][data-nivel=completo] .mk-m-nov-nuevo{animation:mk-m-sello var(--mk-resorte-ms,600ms) var(--mk-resorte-curva,cubic-bezier(.2,.8,.2,1)) both;animation-delay:.5s}" +
  // A la que se le apunta, se enfoca o se aprieta, se detiene donde va (con la misma fuerza que la regla que la anima;
  // quitarle la animación la haría entrar de nuevo al sacar el cursor).
  ".mk-m-novedades[data-activo][data-nivel=completo] .mk-m-nov-tarjeta:is(:hover,:focus-visible,:active){animation-play-state:paused}" +
  "@keyframes mk-m-llega{from{transform:translateY(-22px) rotate(-2.5deg)}to{transform:none}}" +
  "@keyframes mk-m-sello{from{transform:scale(1.7) rotate(-12deg)}to{transform:none}}";

const relojDe = () => new Date();
/** Una foto se puede mostrar si es de la web, de la misma página o una imagen incrustada. */
const esFoto = (f: unknown): f is string => typeof f === "string" && (/^(data:image\/|blob:)/i.test(f.trim()) || esEnlaceSeguro(f));

export default function NovedadesQueLlegan({ entradas, zona = "America/Santiago", ahora = relojDe, nivel: forzado, ahorro, className }: NovedadesQueLleganProps) {
  useStyles("momento-novedades", CSS_NOVEDADES);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const lista = Array.isArray(entradas) ? entradas.filter((e) => e && typeof e.titulo === "string") : [];
  if (!lista.length) return null;
  const instante = ahora();
  // «Nuevo» va solo en la más reciente, y solo si es de esta semana.
  const tiempos = lista.map((e) => Date.parse(e.publicada));
  const masNueva = tiempos.reduce((mejor, t, i) => (Number.isFinite(t) && (mejor < 0 || t > tiempos[mejor]) ? i : mejor), -1);
  return (
    <div ref={ref} className={["mk-momento mk-m-novedades", className].filter(Boolean).join(" ")} data-momento="novedades" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      <ul className="mk-m-nov-lista">
        {lista.map((e, i) => {
          const fecha = fechaLarga(e.publicada, zona);
          const adentro = (
            <>
              {i === masNueva && esNueva(e.publicada, instante) && <span className="mk-m-nov-nuevo">Nuevo</span>}
              {esFoto(e.foto) && <img src={e.foto} alt="" loading="lazy" decoding="async" />}
              {fecha && <p className="mk-m-nov-fecha"><time dateTime={e.publicada}>{fecha}</time></p>}
              <p className="mk-m-nov-titulo">{e.titulo}</p>
              {e.resumen && <p className="mk-m-nov-resumen">{e.resumen}</p>}
            </>
          );
          const estilo = { "--i": i } as CSSProperties;
          return (
            <li key={i}>
              {typeof e.href === "string" && esEnlaceSeguro(e.href) ? (
                <a className="mk-m-nov-tarjeta" href={e.href} style={estilo}>{adentro}</a>
              ) : (
                <div className="mk-m-nov-tarjeta" style={estilo}>{adentro}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
