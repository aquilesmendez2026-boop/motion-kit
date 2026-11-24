// Los dos momentos más pesados se bajan aparte (React.lazy), para que motion-kit/momentos quede bajo su tope. Mientras
// llegan, se ve lo esencial: el título y el ganador del sorteo (el premio queda para lectores, para no arruinar el
// raspe) y la foto de «antes». Si el archivo no baja (red mala, deploy nuevo), la página sigue: el sorteo muestra el
// premio sin capa y el antes y después, la foto de «antes».
import { Component, Suspense, lazy, type ReactNode } from "react";
import type { SorteoRaspeProps } from "./SorteoRaspe";
import type { AntesDespuesProps } from "./AntesDespues";

const SorteoReal = lazy(() => import("./SorteoRaspe").then((m) => ({ default: m.SorteoRaspe })));
const AntesDespuesReal = lazy(() => import("./AntesDespues").then((m) => ({ default: m.AntesDespues })));
const ConfetiReal = lazy(() => import("./Confeti").then((m) => ({ default: m.Confeti })));

/** Confeti suelto (el sorteo ya lo trae): se baja aparte y, si no llega, no se dibuja nada. */
export function Confeti(props: { semilla: number; n?: number }) {
  return (
    <Limite siFalla={null}>
      <Suspense fallback={null}><ConfetiReal {...props} /></Suspense>
    </Limite>
  );
}

class Limite extends Component<{ children: ReactNode; siFalla: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  render() {
    return this.state.fallo ? this.props.siFalla : this.props.children;
  }
}

const clase = (base: string, extra?: string) => [base, extra].filter(Boolean).join(" ");

/**
 * El sorteo sin capa. Mientras baja el archivo, ocupa lo mismo que el sorteo real (título, zona de 140 px más su
 * relleno y el botón) para que la página no salte; el premio queda solo para lectores. Si el archivo no bajó, el premio
 * se ve. Estilos en línea: el CSS del sorteo viaja con su archivo.
 */
function SorteoPlano({ titulo, premio, ganador, className, premioVisible }: SorteoRaspeProps & { premioVisible: boolean }) {
  return (
    <div className={clase("mk-momento mk-m-sorteo", className)} data-momento="sorteo">
      <p style={{ margin: "0 0 .6rem", fontWeight: 700, fontSize: "1.1rem" }}>{titulo}</p>
      {premioVisible ? (
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>Premio: {premio}</p>
      ) : (
        <>
          <div style={{ boxSizing: "border-box", minHeight: 140, padding: "1rem", border: "2px solid transparent", borderRadius: 14 }}>
            <p className="mk-m-lector">Premio: {premio}</p>
          </div>
          <div aria-hidden="true" style={{ height: 44, marginTop: ".75rem" }} />
        </>
      )}
      {ganador && <p style={{ margin: ".75rem 0 0", fontWeight: 700 }}>Ganador: {ganador}</p>}
    </div>
  );
}

export function SorteoRaspe(props: SorteoRaspeProps) {
  return (
    <Limite siFalla={<SorteoPlano {...props} premioVisible />}>
      <Suspense fallback={<SorteoPlano {...props} premioVisible={false} />}><SorteoReal {...props} /></Suspense>
    </Limite>
  );
}

function FotoAntes({ antes, className }: AntesDespuesProps) {
  return (
    <div className={clase("mk-momento mk-m-ad", className)} data-momento="antesdespues">
      <img src={antes.url} alt={antes.alt} style={{ display: "block", width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 14 }} />
    </div>
  );
}

export function AntesDespues(props: AntesDespuesProps) {
  return (
    <Limite siFalla={<FotoAntes {...props} />}>
      <Suspense fallback={<FotoAntes {...props} />}><AntesDespuesReal {...props} /></Suspense>
    </Limite>
  );
}
