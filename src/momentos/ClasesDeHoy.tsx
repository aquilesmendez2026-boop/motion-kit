// Clases: el horario de hoy y de mañana. La próxima clase del día va resaltada, «Queda 1» late suave y, si se conoce
// el total de cupos, una barra se llena hasta lo ocupado. Los cupos van siempre en texto.
import type { CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { CSS_LATE, useMomento, type ComunesMomento } from "./base";
import { useHoraAlDia } from "./reloj";
import { cuposDe, horaEn, hoyEn, proximaClase, sumarDias } from "./calculos-2";

export interface SesionDeClase {
  nombre: string;
  profesor?: string;
  /** `HH:MM`. */
  hora: string;
  /** `AAAA-MM-DD`. */
  fecha: string;
  libres: number;
  espera: "no" | "abierta" | "llena";
  /** El total de cupos. Sin él no hay barra (La Mente hoy no lo manda). */
  cupos?: number;
}

export interface ClasesDeHoyProps extends ComunesMomento {
  sesiones: SesionDeClase[];
  /** El día de hoy (`AAAA-MM-DD`). Sin él, se usa el de la zona del negocio. */
  hoy?: string;
  zona?: string;
  /** Reloj (pruebas y vitrina). */
  ahora?: () => Date;
}

export const CSS_CLASES =
  ".mk-m-clases{display:grid;gap:18px}" +
  ".mk-m-clases-grupo h3{margin:0 0 8px;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:var(--mk-m-suave)}" +
  ".mk-m-clases-grupo ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}" +
  ".mk-m-clases-grupo li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:6px 12px;padding:10px 12px;border-radius:12px;" +
  "border:1px solid color-mix(in srgb,var(--mk-m-texto) 14%,transparent)}" +
  ".mk-m-clases-grupo li[data-proxima]{border-color:var(--mk-m-acento);background:color-mix(in srgb,var(--mk-m-acento) 10%,transparent)}" +
  ".mk-m-clases-hora{font-weight:800;font-variant-numeric:tabular-nums}" +
  ".mk-m-clases-nombre{margin:0;font-weight:700}" +
  ".mk-m-clases-profe{margin:0;font-size:.85rem;color:var(--mk-m-suave)}" +
  ".mk-m-clases-cupos{display:inline-block;font-size:.85rem;font-weight:700;white-space:nowrap}" +
  ".mk-m-clases-grupo li[data-cupos=ultimo] .mk-m-clases-cupos{color:var(--mk-m-acento)}" +
  ".mk-m-clases-grupo li[data-cupos=lleno] .mk-m-clases-cupos{color:var(--mk-m-suave)}" +
  ".mk-m-clases-marca{font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mk-m-acento)}" +
  ".mk-m-clases-barra{grid-column:1/-1;height:6px;border-radius:999px;overflow:hidden;background:color-mix(in srgb,var(--mk-m-texto) 12%,transparent)}" +
  ".mk-m-clases-barra i{display:block;height:100%;border-radius:inherit;background:var(--mk-m-acento);transform-origin:0 50%;scale:var(--ocupado) 1}" +
  // La barra se llena al verse; «Queda 1» late unas veces y se detiene.
  ".mk-m-clases:not([data-nivel=quieto]):not([data-activo]) .mk-m-clases-barra i{scale:0 1}" +
  ".mk-m-clases[data-activo][data-nivel=completo] .mk-m-clases-barra i{animation:mk-m-llena .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i)*70ms)}" +
  ".mk-m-clases[data-activo][data-nivel=completo] li[data-cupos=ultimo] .mk-m-clases-cupos{animation:mk-m-late 1.4s ease-in-out 6}" +
  "@keyframes mk-m-llena{from{scale:0 1}}" +
  CSS_LATE;

const relojDe = () => new Date();

export default function ClasesDeHoy({ sesiones, hoy, zona = "America/Santiago", ahora = relojDe, nivel: forzado, ahorro, className }: ClasesDeHoyProps) {
  useStyles("momento-clases", CSS_CLASES);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const lista = Array.isArray(sesiones) ? sesiones.filter((s) => s && typeof s.nombre === "string" && typeof s.hora === "string") : [];
  // «Hoy», «Mañana» y «Próxima» se ponen al día si la página queda abierta.
  useHoraAlDia();
  const instante = ahora();
  const diaDeHoy = hoy ?? hoyEn(zona, instante);
  const manana = sumarDias(diaDeHoy, 1);
  const proxima = proximaClase(lista, diaDeHoy, horaEn(zona, instante));
  const grupos = [
    { titulo: "Hoy", dia: diaDeHoy },
    { titulo: "Mañana", dia: manana },
  ].map((g) => ({ ...g, filas: lista.map((s, i) => ({ s, i })).filter((x) => x.s.fecha === g.dia).sort((a, b) => a.s.hora.localeCompare(b.s.hora)) }));
  const hay = grupos.some((g) => g.filas.length);
  return (
    <div ref={ref} className={["mk-momento mk-m-clases", className].filter(Boolean).join(" ")} data-momento="clases" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      {!hay && <p className="mk-m-clases-nombre">No hay clases hoy ni mañana.</p>}
      {grupos.filter((g) => g.filas.length).map((g) => (
        <section key={g.titulo} className="mk-m-clases-grupo">
          <h3>{g.titulo}</h3>
          <ul>
            {g.filas.map(({ s, i }, k) => {
              const c = cuposDe(s.libres, s.espera, s.cupos);
              return (
                <li key={i} data-cupos={c.estado} data-proxima={i === proxima ? "" : undefined}>
                  <span className="mk-m-clases-hora">{s.hora}</span>
                  <div>
                    {i === proxima && <span className="mk-m-clases-marca">Próxima</span>}
                    <p className="mk-m-clases-nombre">{s.nombre}</p>
                    {s.profesor && <p className="mk-m-clases-profe">Con {s.profesor}</p>}
                  </div>
                  <span className="mk-m-clases-cupos">{c.texto}</span>
                  {c.ocupado !== null && (
                    <span className="mk-m-clases-barra" aria-hidden="true">
                      <i style={{ "--ocupado": c.ocupado, "--i": k } as CSSProperties} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
