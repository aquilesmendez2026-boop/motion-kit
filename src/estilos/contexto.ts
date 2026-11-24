import { createContext, useContext } from "react";
import type { EstiloDef } from "./estilos";

/**
 * El estilo vigente. Va aparte del componente `Estilo` para que quien solo lo lee (la página y sus relatos) no cargue
 * con el estilo entero: su CSS, sus cursores y sus sonidos.
 */
export const ContextoEstilo = createContext<EstiloDef | null>(null);

/** El estilo vigente (o null fuera de un `<Estilo>`). */
export function useEstilo() {
  return useContext(ContextoEstilo);
}
