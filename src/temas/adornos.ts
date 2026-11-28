// Los adornos con nombre: la firma de cada tema (la cinta de peligro del taller, el poste de la barbería…). Su CSS
// apunta a partes marcadas (`[data-mk-parte~="hoja"]`, `barra`, `titulo`, `icono`, `grupo`, `cabeza`, `estado`, `boton`,
// `vacio`) dentro de `[data-mk-tema="<id>"]`, nunca a clases de quien lo usa. Se baja aparte (src/temas/datos/adornos.ts)
// y solo si el tema que se ve tiene firma: «lamente» no baja nada.
import { useEffect, useState } from "react";
import { useStyles } from "../utils/styles";

let cargados: Record<string, string> | undefined;
const cssDe = (todos: Record<string, string>, nombres: string[]) => nombres.map((n) => todos[n] ?? "").join("");

/**
 * Monta el CSS de los adornos de un tema (una sola vez por juego de adornos). Al cambiar de tema, las reglas del
 * anterior quedan, pero no aplican: cada una vive dentro de `[data-mk-tema="<su tema>"]`.
 */
export function useAdornos(nombres: string[]): void {
  const clave = nombres.join("-");
  const [, setListos] = useState(Boolean(cargados));
  useEffect(() => {
    if (!nombres.length || cargados) return;
    let vivo = true;
    void import("./datos/adornos").then((m) => {
      cargados = m.CSS_ADORNOS;
      if (vivo) setListos(true);
    });
    return () => {
      vivo = false;
    };
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  // Calculado aquí, no guardado: al cambiar de tema, el id y el CSS siempre son del tema que se ve.
  const css = cargados && nombres.length ? cssDe(cargados, nombres) : "";
  useStyles(css ? `adornos-${clave}` : "adornos-ninguno", css);
}
