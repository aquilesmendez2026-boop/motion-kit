import { Component, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { EFECTOS } from "./registro";
import type { EfectoProps, EfectoId } from "./tokens";

const cache = new Map<string, ComponentType<EfectoProps>>();

function cargar(id: EfectoId) {
  let c = cache.get(id);
  if (!c) {
    c = lazy(EFECTOS[id].cargar) as ComponentType<EfectoProps>;
    cache.set(id, c);
  }
  return c;
}

class Limite extends Component<{ children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  render() {
    return this.state.fallo ? null : this.props.children;
  }
}

/** Dibuja un efecto por su id. Id desconocido o archivo que no carga: no dibuja nada y la página sigue. */
export function EfectoPagina({ id, ...props }: EfectoProps & { id: string }) {
  if (!Object.prototype.hasOwnProperty.call(EFECTOS, id)) return null;
  const Efecto = cargar(id as EfectoId);
  return (
    <Limite>
      <Suspense fallback={null}>
        <Efecto {...props} />
      </Suspense>
    </Limite>
  );
}
