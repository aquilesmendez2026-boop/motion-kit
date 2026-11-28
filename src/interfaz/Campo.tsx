// Campo: la etiqueta, la ayuda y el error de un campo, con el control que pone quien lo usa (el Input de Chakra, un
// select). El error se sacude una vez por cada mensaje nuevo y queda al lado; el borde del control se pone rojo.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";
import { c } from "./tema";

export interface CampoProps {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string;
  className?: string;
  /** El control, con lo que necesita para ser accesible. */
  children: (a11y: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-campo{display:grid;gap:6px}
.mk-campo-etiqueta{font-weight:700}
.mk-campo-ayuda{margin:0;font-size:.85rem;color:${c("suave")}}
.mk-campo-error{margin:0;font-size:.88rem;font-weight:700;color:${c("mal")}}
.mk-campo [aria-invalid=true]{border-color:${c("mal")}}`);

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
    caja.current?.animate([{ translate: "0 0" }, { translate: "-6px 0" }, { translate: "5px 0" }, { translate: "-2px 0" }, { translate: "0 0" }], { duration: 320, easing: "ease-out" });
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
