import { useRef, type HTMLAttributes, type ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { CSS_ESCENA } from "./css";
import { useMovimientoEscena } from "./movimiento";

/** «puntero»: un foco de luz sigue al dedo o al cursor. «barrido»: un brillo cruza cada tanto, como sobre vidrio o metal. */
export type ModoLuz = "puntero" | "barrido";

/** La luz, sin escuchar el movimiento (lee `--mk-cx` y `--mk-cy` de quien la contiene). */
export function LuzEscena({ modo = "puntero" }: { modo?: ModoLuz }) {
  useStyles("escena", CSS_ESCENA);
  return (
    <div className="mk-luz" data-modo={modo} aria-hidden="true">
      <i />
    </div>
  );
}

export interface LuzYReflejoProps extends HTMLAttributes<HTMLDivElement> {
  modo?: ModoLuz;
  children?: ReactNode;
}

/** Luz que sigue al dedo o brillo que recorre la superficie. Pesa 0 KB: son gradientes CSS. */
export function LuzYReflejo({ modo = "puntero", children, className, ...resto }: LuzYReflejoProps) {
  useStyles("escena", CSS_ESCENA);
  const ref = useRef<HTMLDivElement>(null);
  useMovimientoEscena(ref, { mover: ["puntero"], apagado: modo !== "puntero" });
  return (
    <div {...resto} ref={ref} className={`mk-escena${className ? " " + className : ""}`}>
      <LuzEscena modo={modo} />
      {children && <div className="mk-escena-contenido">{children}</div>}
    </div>
  );
}
