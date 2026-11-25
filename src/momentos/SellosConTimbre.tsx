// Sellos con timbre: los sellos de antes ya están en la tarjeta; los nuevos se timbran al verse. El timbre baja con su
// sombra, aprieta (la tarjeta cede un poco) y se levanta dejando la marca. Cada marca es distinta (giro, corrimiento,
// carga de tinta y borde) y siempre la misma para el mismo sello. El texto dice cuántos van.
// Todo lo que se mueve va con `translate`, `scale`, `rotate` y `opacity`; el borde irregular es un filtro fijo.
import { useEffect, useId, type CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { vibrar } from "../estilos/sonidos";
import { CSS_LATE, useMomento, type ComunesMomento } from "./base";
import { limitesTimbre, tintaDe } from "./calculo-timbre";

export interface SellosConTimbreProps extends ComunesMomento {
  /** Cuántos sellos completan el premio (en La Mente, `sellosPremio`). */
  total: number;
  /** Cuántos lleva la persona, contando los nuevos (en La Mente, `sellos`). */
  llenos: number;
  /** Cuántos de esos son nuevos: son los que se timbran al verse. Por defecto, ninguno. */
  nuevos?: number;
  premio: string;
  /** El `slug` del negocio: decide la tinta de cada sello. */
  semilla?: string;
  /** Un golpe por cada sello que se timbra (donde el teléfono vibra). Por defecto, sí. */
  vibracion?: boolean;
}

/** Cada cuánto baja el timbre (ms) y cuánto tarda en tocar la tarjeta. */
const CADA = 900;
const TOCA = 360;
const NUEVO = ".mk-m-timbre[data-activo][data-nivel=completo] li[data-nuevo]";
const ESPERA = "animation-delay:calc(var(--k)*900ms)";
const AL_TOCAR = "animation-delay:calc(var(--k)*900ms + 360ms)";

export const CSS_TIMBRE =
  ".mk-m-timbre{--mk-m-tinta:color-mix(in srgb,var(--mk-m-acento) 88%,#000)}" +
  ".mk-m-timbre-lista{list-style:none;margin:0;padding:6px 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:12px;max-width:440px}" +
  ".mk-m-timbre-lista li{position:relative;aspect-ratio:1;border-radius:50%;border:2px dashed var(--mk-m-suave);display:grid;place-items:center;color:var(--mk-m-suave)}" +
  ".mk-m-timbre-lista li[data-premio]{border-style:solid;border-color:var(--mk-m-acento);color:var(--mk-m-acento)}" +
  ".mk-m-timbre-lista li>svg{width:46%;height:46%}" +
  // La marca: un aro, otro más fino adentro y una estrella. Más cargada de un lado, girada y un poco corrida.
  ".mk-m-timbre-marca{position:absolute;inset:-5%;border-radius:50%;display:grid;place-items:center;box-sizing:border-box;color:var(--mk-m-tinta);border:3px solid currentColor;" +
  "background:radial-gradient(circle at var(--lado),color-mix(in srgb,currentColor 30%,transparent),color-mix(in srgb,currentColor 7%,transparent) 68%);" +
  "translate:calc(var(--x)*1px) calc(var(--y)*1px);rotate:var(--giro);opacity:var(--carga)}" +
  ".mk-m-timbre-marca::before{content:\"\";position:absolute;inset:11%;border-radius:50%;border:1.5px solid currentColor}" +
  ".mk-m-timbre-marca svg{width:44%;height:44%}" +
  // La tinta fresca brilla y se asienta.
  ".mk-m-timbre-fresca{position:absolute;inset:0;border-radius:50%;pointer-events:none;opacity:0;background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.6),transparent 58%)}" +
  // El timbre, visto desde arriba: la base de goma y su mango. Y su sombra sobre la tarjeta, que se junta al bajar.
  ".mk-m-timbre-goma,.mk-m-timbre-sombra{position:absolute;left:50%;top:50%;width:124%;aspect-ratio:1;margin:-62% 0 0 -62%;border-radius:50%;pointer-events:none;opacity:0;z-index:2}" +
  ".mk-m-timbre-goma{background:radial-gradient(circle at 36% 30%,#7a6450,#2f251d 72%);box-shadow:inset 0 -5px 0 rgba(0,0,0,.35)}" +
  ".mk-m-timbre-goma::after{content:\"\";position:absolute;inset:30%;border-radius:50%;background:radial-gradient(circle at 36% 30%,#e3c595,#8d6235 75%);box-shadow:0 3px 5px rgba(0,0,0,.45)}" +
  ".mk-m-timbre-sombra{z-index:1;background:#000;filter:blur(7px)}" +
  // Los sellos nuevos esperan su turno; al verse, el timbre baja de a uno.
  ".mk-m-timbre:not([data-nivel=quieto]):not([data-activo]) li[data-nuevo] .mk-m-timbre-marca{opacity:0}" +
  `${NUEVO} .mk-m-timbre-goma{animation:mk-m-timbre-baja .78s cubic-bezier(.3,0,.2,1) both;${ESPERA}}` +
  "@keyframes mk-m-timbre-baja{0%{opacity:0;translate:14px -84px;scale:1.25;rotate:-10deg}16%{opacity:1}46%{translate:0 0;scale:1;rotate:var(--giro)}58%{opacity:1;translate:0 2px;scale:.97;rotate:var(--giro)}100%{opacity:0;translate:-10px -80px;scale:1.2;rotate:6deg}}" +
  `${NUEVO} .mk-m-timbre-sombra{animation:mk-m-timbre-sombra .78s cubic-bezier(.3,0,.2,1) both;${ESPERA}}` +
  "@keyframes mk-m-timbre-sombra{0%{opacity:0;scale:1.5;translate:calc(var(--mk-l0x,-.45)*-26px) calc(var(--mk-l0y,-.8)*-30px)}46%{opacity:.5;scale:1;translate:0 0}58%{opacity:.55;scale:1;translate:0 0}100%{opacity:0;scale:1.5;translate:calc(var(--mk-l0x,-.45)*-26px) calc(var(--mk-l0y,-.8)*-30px)}}" +
  `${NUEVO} .mk-m-timbre-marca{animation:mk-m-timbre-marca .16s ease-out both;${AL_TOCAR}}` +
  "@keyframes mk-m-timbre-marca{from{opacity:0;scale:1.1}}" +
  `${NUEVO} .mk-m-timbre-fresca{animation:mk-m-timbre-seca 1.5s ease-out both;${AL_TOCAR}}` +
  "@keyframes mk-m-timbre-seca{from{opacity:1}to{opacity:0}}" +
  // La tarjeta cede un poco con cada golpe.
  ".mk-m-timbre[data-activo][data-nivel=completo] .mk-m-timbre-lista{animation:mk-m-timbre-cede .9s ease-out 360ms both;animation-iteration-count:var(--mk-m-nuevos)}" +
  "@keyframes mk-m-timbre-cede{0%{scale:1}9%{scale:.984}32%{scale:1}}" +
  // Liviano: sin timbre; las marcas nuevas aparecen.
  ".mk-m-timbre[data-activo][data-nivel=liviano] li[data-nuevo] .mk-m-timbre-marca{animation:mk-m-timbre-marca .3s ease-out both;animation-delay:calc(var(--k)*220ms)}" +
  ".mk-m-timbre[data-completo][data-activo][data-nivel=completo] li[data-premio]{animation:mk-m-late 1.6s ease-in-out infinite;animation-delay:calc(var(--mk-m-nuevos)*900ms + 600ms)}" +
  ".mk-m-timbre-texto{margin:.75rem 0 0;font-weight:600}";

const Estrella = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.6l2.7 6 6.5.6-4.9 4.3 1.5 6.4L12 16.6 6.2 19.9l1.5-6.4L2.8 9.2l6.5-.6z" fill="currentColor" />
  </svg>
);
const Regalo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10.5 4 7 4 7 6.5S12 7 12 7zm0 0c1.5-3 5-3 5-.5S12 7 12 7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export default function SellosConTimbre({ total, llenos, nuevos = 0, premio, semilla = "", vibracion = true, nivel: forzado, ahorro, className }: SellosConTimbreProps) {
  useStyles("momento-timbre", CSS_TIMBRE);
  useStyles("momento-late", CSS_LATE);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const l = limitesTimbre(total, llenos, nuevos);
  /** Los tres bordes irregulares (filtros fijos). Su nombre es propio de esta tarjeta: puede haber varias en la página. */
  const id = `mk-timbre-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const primeroNuevo = l.llenos - l.nuevos;

  // Un golpe por cada sello que se timbra, cuando el timbre toca la tarjeta.
  useEffect(() => {
    if (!activo || nivel !== "completo" || !vibracion || !l.nuevos) return;
    const esperas = Array.from({ length: l.nuevos }, (_, k) => setTimeout(() => vibrar(14), k * CADA + TOCA));
    return () => esperas.forEach(clearTimeout);
  }, [activo, nivel, vibracion, l.nuevos]);

  return (
    <div
      ref={ref}
      className={`mk-momento mk-m-timbre${className ? ` ${className}` : ""}`}
      data-momento="timbre"
      data-nivel={nivel}
      data-activo={activo ? "" : undefined}
      data-completo={l.llenos >= l.total ? "" : undefined}
      style={{ "--mk-m-nuevos": l.nuevos } as CSSProperties}
    >
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        {[0, 1, 2].map((b) => (
          <filter key={b} id={`${id}-${b}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency={0.7 + b * 0.22} numOctaves="2" seed={3 + b * 11} result="ruido" />
            <feDisplacementMap in="SourceGraphic" in2="ruido" scale={2.4 + b * 0.5} />
          </filter>
        ))}
      </svg>
      <ol aria-hidden="true" className="mk-m-timbre-lista">
        {Array.from({ length: l.total }, (_, i) => {
          const lleno = i < l.llenos;
          const nuevo = lleno && i >= primeroNuevo;
          const t = tintaDe(semilla, i);
          const lado = `${Math.round(50 + 34 * Math.cos((t.lado * Math.PI) / 180))}% ${Math.round(50 + 34 * Math.sin((t.lado * Math.PI) / 180))}%`;
          return (
            <li key={i} data-sello={i} data-lleno={lleno ? "" : undefined} data-nuevo={nuevo ? "" : undefined} data-premio={i === l.total - 1 ? "" : undefined} style={nuevo ? ({ "--k": i - primeroNuevo, "--giro": `${t.giro}deg` } as CSSProperties) : undefined}>
              {i === l.total - 1 && <Regalo />}
              {lleno && (
                <span className="mk-m-timbre-marca" style={{ "--x": t.x, "--y": t.y, "--giro": `${t.giro}deg`, "--carga": t.carga, "--lado": lado, filter: `url(#${id}-${t.borde})` } as CSSProperties}>
                  <Estrella />
                  {nuevo && nivel === "completo" && <i className="mk-m-timbre-fresca" />}
                </span>
              )}
              {nuevo && nivel === "completo" && (
                <>
                  <i className="mk-m-timbre-sombra" />
                  <i className="mk-m-timbre-goma" />
                </>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mk-m-timbre-texto" data-texto="">{l.llenos} de {l.total} sellos{l.nuevos ? ` (${l.nuevos} ${l.nuevos === 1 ? "nuevo" : "nuevos"})` : ""}. Premio: {premio}.</p>
    </div>
  );
}
