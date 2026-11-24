// La carga perezosa común de los momentos: cada pieza se baja aparte (`import()`) cuando se usa. Mientras llega su
// archivo se ve el `respaldo` que le pasen (en La Mente, el bloque de siempre) y, si el archivo no baja (red mala, un
// deploy nuevo), el respaldo se queda y la página sigue. Nunca lanza.
import { Component, Suspense, lazy, type ComponentType, type ReactNode } from "react";

/** Si lo de adentro falla al dibujarse o al bajar, se muestra `siFalla`. */
export class Limite extends Component<{ children: ReactNode; siFalla: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  render() {
    return this.state.fallo ? this.props.siFalla : this.props.children;
  }
}

/** Lo que suma la carga perezosa a las props de una pieza. */
export type ConRespaldo = {
  /** Lo que se ve mientras llega el archivo de la pieza, y si no llega. Por defecto, nada. */
  respaldo?: ReactNode;
};

/** Envuelve una pieza para que su archivo se baje aparte. */
export function aparte<P extends object>(cargar: () => Promise<{ default: ComponentType<P> }>): ComponentType<P & ConRespaldo> {
  const Real = lazy(cargar);
  return function Aparte({ respaldo = null, ...props }: P & ConRespaldo) {
    return (
      <Limite siFalla={respaldo}>
        <Suspense fallback={respaldo}>
          <Real {...(props as unknown as P)} />
        </Suspense>
      </Limite>
    );
  };
}
