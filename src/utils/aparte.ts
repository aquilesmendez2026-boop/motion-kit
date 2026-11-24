import { useEffect, useRef, useState, type ComponentType } from "react";

/**
 * Monta una pieza que se baja aparte con `import()`. Con `activo`, la pide una vez y devuelve su componente; mientras
 * llega, o si el archivo no baja (red mala, deploy nuevo), devuelve `null` y la página sigue. Al apagarse `activo`,
 * vuelve a `null`.
 */
export function useAparte<P>(activo: boolean, cargar: () => Promise<{ default: ComponentType<P> }>): ComponentType<P> | null {
  const [Pieza, setPieza] = useState<ComponentType<P> | null>(null);
  const pedir = useRef(cargar);
  pedir.current = cargar;
  useEffect(() => {
    if (!activo) {
      setPieza(null);
      return;
    }
    let vivo = true;
    pedir
      .current()
      .then((m) => {
        // Un componente es una función: se guarda con la forma de función de setState.
        if (vivo) setPieza(() => m.default);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [activo]);
  return activo ? Pieza : null;
}
