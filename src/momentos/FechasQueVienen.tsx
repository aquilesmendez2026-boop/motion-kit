// Calendario: lo que viene. Cada fecha lleva una hoja de calendario que se voltea al verse, una tras otra; la de hoy
// queda encendida y las de «cerrado» van tachadas. El texto se lee desde el primer cuadro: lo que se anima es la hoja,
// que es decoración.
import type { CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { useHoraAlDia } from "./reloj";
import { hojaDe, hoyEn } from "./calculos-2";

export interface FechaQueViene {
  titulo: string;
  /** `AAAA-MM-DD`, en el día del negocio. */
  fecha: string;
  /** `HH:MM`. Sin hora es «Todo el día». */
  hora?: string;
  tipo: "actividad" | "cerrado" | "promocion" | "evento";
}

export interface FechasQueVienenProps extends ComunesMomento {
  fechas: FechaQueViene[];
  /** El día de hoy (`AAAA-MM-DD`). Sin él, se usa el de la zona del negocio. */
  hoy?: string;
  /** Zona del negocio. Por defecto, Chile. */
  zona?: string;
  /** Reloj (pruebas y vitrina). */
  ahora?: () => Date;
}

const MARCAS: Record<string, string> = { cerrado: "Cerrado", promocion: "Promoción", evento: "Evento" };

export const CSS_FECHAS =
  ".mk-m-fechas-lista{list-style:none;margin:0;padding:0;display:grid;gap:12px}" +
  ".mk-m-fechas-lista li{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:14px}" +
  ".mk-m-fechas-lista li:not(:has(.mk-m-hoja)){grid-template-columns:minmax(0,1fr)}" +
  ".mk-m-fechas-hoja{perspective:320px}" +
  ".mk-m-hoja{display:grid;justify-items:center;width:54px;border-radius:10px;overflow:hidden;background:var(--mk-m-superficie);color:var(--mk-m-texto);" +
  "border:1px solid color-mix(in srgb,var(--mk-m-texto) 18%,transparent);transform-origin:50% 0;backface-visibility:hidden}" +
  ".mk-m-hoja-mes{width:100%;text-align:center;font-size:.68rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 0;background:var(--mk-m-suave);color:var(--mk-m-superficie)}" +
  ".mk-m-hoja-dia{font-size:1.45rem;font-weight:800;line-height:1.5;font-variant-numeric:tabular-nums}" +
  ".mk-m-fechas-lista li[data-hoy] .mk-m-hoja{border-color:var(--mk-m-acento)}" +
  ".mk-m-fechas-lista li[data-hoy] .mk-m-hoja-mes{background:var(--mk-m-acento);color:var(--mk-m-sobre)}" +
  ".mk-m-fechas-cuando{margin:0;font-size:.85rem;color:var(--mk-m-suave)}" +
  ".mk-m-fechas-titulo{position:relative;margin:0;font-weight:700}" +
  ".mk-m-fechas-lista li[data-tipo=cerrado] .mk-m-fechas-titulo{color:var(--mk-m-suave)}" +
  // «Cerrado» va tachado con una línea que se dibuja: encima del título va una copia sin tinta, solo con la raya, que se
  // destapa de izquierda a derecha (la caja entra desde la izquierda y su contenido se devuelve lo mismo).
  ".mk-m-fechas-raya{position:absolute;inset:0;overflow:hidden;pointer-events:none;user-select:none;-webkit-user-select:none}" +
  ".mk-m-fechas-raya span{display:block;color:transparent;text-decoration:line-through;text-decoration-color:var(--mk-m-suave)}" +
  ".mk-m-fechas[data-nivel=completo]:not([data-activo]) .mk-m-fechas-raya{transform:translateX(-101%)}" +
  ".mk-m-fechas[data-nivel=completo]:not([data-activo]) .mk-m-fechas-raya span{transform:translateX(101%)}" +
  ".mk-m-fechas[data-activo][data-nivel=completo] .mk-m-fechas-raya{animation:mk-m-raya .5s ease-out both;animation-delay:calc(var(--i)*110ms + 350ms)}" +
  ".mk-m-fechas[data-activo][data-nivel=completo] .mk-m-fechas-raya span{animation:mk-m-raya-contra .5s ease-out both;animation-delay:calc(var(--i)*110ms + 350ms)}" +
  "@keyframes mk-m-raya{from{transform:translateX(-101%)}to{transform:none}}" +
  "@keyframes mk-m-raya-contra{from{transform:translateX(101%)}to{transform:none}}" +
  ".mk-m-fechas-marca{font-weight:600;color:var(--mk-m-acento)}" +
  // Antes de verse, la hoja espera de canto; al verse se voltea. En quieto ya está puesta.
  ".mk-m-fechas:not([data-nivel=quieto]):not([data-activo]) .mk-m-hoja{opacity:0}" +
  ".mk-m-fechas[data-activo][data-nivel=completo] .mk-m-hoja{animation:mk-m-hoja-cae var(--mk-resorte-ms,600ms) var(--mk-resorte-curva,cubic-bezier(.2,.8,.2,1)) both;animation-delay:calc(var(--i)*110ms)}" +
  ".mk-m-fechas[data-activo][data-nivel=liviano] .mk-m-hoja{animation:mk-m-hoja-aparece .35s ease-out both;animation-delay:calc(var(--i)*60ms)}" +
  "@keyframes mk-m-hoja-cae{from{opacity:0;transform:rotateX(-92deg)}35%{opacity:1}to{opacity:1;transform:none}}" +
  "@keyframes mk-m-hoja-aparece{from{opacity:0}to{opacity:1}}";

const relojDe = () => new Date();

export default function FechasQueVienen({ fechas, hoy, zona = "America/Santiago", ahora = relojDe, nivel: forzado, ahorro, className }: FechasQueVienenProps) {
  useStyles("momento-fechas", CSS_FECHAS);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  // «Hoy» se pone al día si la página queda abierta y cambia el día.
  useHoraAlDia();
  const lista = Array.isArray(fechas) ? fechas.filter((f) => f && typeof f.titulo === "string") : [];
  if (!lista.length) return null;
  const diaDeHoy = hoy ?? hoyEn(zona, ahora());
  return (
    <div ref={ref} className={["mk-momento mk-m-fechas", className].filter(Boolean).join(" ")} data-momento="fechas" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      <ul className="mk-m-fechas-lista">
        {lista.map((f, i) => {
          const hoja = hojaDe(f.fecha);
          const esHoy = f.fecha === diaDeHoy;
          const dia = hoja ? (esHoy ? "Hoy" : `${hoja.semana} ${hoja.dia} ${hoja.mes}`) : "";
          const cuando = [dia, hoja ? f.hora || "Todo el día" : ""].filter(Boolean).join(" · ");
          return (
            <li key={`${f.fecha}-${i}`} data-tipo={f.tipo} data-hoy={esHoy ? "" : undefined} style={{ "--i": i } as CSSProperties}>
              {hoja && (
                <span className="mk-m-fechas-hoja" aria-hidden="true">
                  <span className="mk-m-hoja">
                    <span className="mk-m-hoja-mes">{hoja.mes}</span>
                    <span className="mk-m-hoja-dia">{hoja.dia}</span>
                  </span>
                </span>
              )}
              <div>
                {cuando && (
                  <p className="mk-m-fechas-cuando">
                    {hoja ? <time dateTime={f.fecha}>{cuando}</time> : cuando}
                    {MARCAS[f.tipo] && <span className="mk-m-fechas-marca"> · {MARCAS[f.tipo]}</span>}
                  </p>
                )}
                <p className="mk-m-fechas-titulo">
                  {f.titulo}
                  {f.tipo === "cerrado" && <span className="mk-m-fechas-raya" aria-hidden="true"><span>{f.titulo}</span></span>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
