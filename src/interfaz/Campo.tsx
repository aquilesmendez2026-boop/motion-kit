// Campo: la etiqueta, la ayuda y el error de un campo, con el control que pone quien lo usa (el Input de Chakra, un
// select). El error se sacude una vez por cada mensaje nuevo y queda al lado; el borde del control se pone rojo.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";
import { c, f, ritmoDe } from "./tema";

export interface CampoProps {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string;
  className?: string;
  /** El control, con lo que necesita para ser accesible. */
  children: (a11y: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}

/** Los controles de texto que viste Campo (las casillas y opciones van aparte). */
const CONTROL = "input:not([type=checkbox]):not([type=radio]),textarea,select";
const T = "var(--mk-texto,#1C1A22)";
let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-campo{display:grid;gap:6px}
.mk-campo-etiqueta{font-weight:600}
.mk-campo-ayuda{margin:0;font-size:.85rem;color:${c("suave")}}
.mk-campo-error{margin:0;font-size:.88rem;font-weight:700;color:${c("mal")}}
.mk-campo-error::before{content:"!";display:inline-grid;place-items:center;width:1.05rem;height:1.05rem;margin-inline-end:.35rem;border-radius:999px;background:${c("mal")};color:#fff;font-size:.7rem;font-weight:800}
.mk-campo :is(${CONTROL}){box-sizing:border-box;border-radius:${f("radioCampo", "12px")};border:var(--mk-campo-borde,2px solid color-mix(in srgb,${T} 78%,transparent));background-color:var(--mk-campo-fondo,var(--mk-superficie,#fff));color:${T};caret-color:var(--mk-acento,#a855f7);transition:transform .15s ease}
.mk-campo :is(input:not([type=checkbox]):not([type=radio]),select){min-height:var(--mk-campo-alto,2.75rem)}
.mk-campo textarea{min-height:5.5rem;resize:vertical}
.mk-campo :is(${CONTROL})::placeholder{color:color-mix(in srgb,var(--mk-suave,#5E5A68) 75%,transparent)}
.mk-campo :is(${CONTROL}):hover:not(:disabled):not(:focus-visible){border-color:${T};box-shadow:var(--mk-campo-pasar,2px 2px 0 color-mix(in srgb,${T} 22%,transparent))}
.mk-campo :is(${CONTROL}):focus-visible{outline:2px solid transparent;border-color:${T};background-color:var(--mk-superficie,#fff);box-shadow:var(--mk-campo-foco,4px 4px 0 #a855f7);transform:var(--mk-campo-levantar,translate(-2px,-2px))}
.mk-campo :is(${CONTROL})[aria-invalid=true]{border-color:${c("mal")};box-shadow:var(--mk-campo-error,3px 3px 0 color-mix(in srgb,${c("mal")} 45%,transparent))}
.mk-campo :is(${CONTROL}):disabled{border-style:dashed;background-color:color-mix(in srgb,var(--mk-fondo,#FAF7F2) 70%,var(--mk-borde,#E7E1D8));color:var(--mk-suave,#5E5A68);cursor:not-allowed;box-shadow:none}
.mk-campo input:is([type=checkbox],[type=radio]){accent-color:var(--mk-acento,#9333ea);width:1.05rem;height:1.05rem}
@media (prefers-reduced-motion:reduce){.mk-campo :is(${CONTROL}){transition:none}.mk-campo :is(${CONTROL}):focus-visible{transform:none}}`);

export function Campo({ etiqueta, ayuda, error, className, children }: CampoProps) {
  useStyles("campo", estilos());
  const id = useId();
  const reducido = useReducedMotion();
  const caja = useRef<HTMLParagraphElement>(null);
  const antes = useRef<string | undefined>(undefined);
  useEffect(() => {
    const previo = antes.current;
    antes.current = error;
    if (!error || error === previo || reducido) return;
    if (!caja.current) return;
    const r = ritmoDe(caja.current);
    if (r.fuerza > 0) caja.current.animate([0, -6, 5, -2, 0].map((x) => ({ translate: `${x * r.fuerza}px 0` })), { duration: 320 * r.tiempo, easing: "ease-out" });
  }, [error, reducido]);
  const describe = [ayuda ? `${id}-ayuda` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return (
    <div className={`mk-campo${className ? ` ${className}` : ""}`}>
      <label htmlFor={id} className="mk-campo-etiqueta">{etiqueta}</label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describe || undefined })}
      {ayuda && <p id={`${id}-ayuda`} className="mk-campo-ayuda">{ayuda}</p>}
      {error && (
        <p ref={caja} id={`${id}-error`} role="alert" className="mk-campo-error">
          {error}
        </p>
      )}
    </div>
  );
}
