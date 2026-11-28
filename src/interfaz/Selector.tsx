// Un selector del panel: un `select` nativo con su etiqueta, su ayuda y su error accesibles (los de `Campo`). Junta
// las copias a mano de «selector» del front de La Mente. El aspecto del control lo da `Campo` (fase 3, tarea 4).
import type { ReactNode, SelectHTMLAttributes } from "react";
import { useStyles } from "../utils/styles";
import { Campo } from "./Campo";

let css: string | undefined;
const estilos = () => (css ??= `.mk-selector{font:inherit;padding:0 2.25rem 0 .75rem}`);

export interface SelectorProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string;
  /** Las opciones (`<option>`). */
  children: ReactNode;
}

export function Selector({ etiqueta, ayuda, error, className, children, ...resto }: SelectorProps) {
  useStyles("selector", estilos());
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} error={error} className={className}>
      {(a11y) => (
        <select {...resto} {...a11y} className="mk-selector">
          {children}
        </select>
      )}
    </Campo>
  );
}
