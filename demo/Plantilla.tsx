import { PaginaReceta, RECETAS, ESTILOS, transicionVista } from "../src";

export function Plantilla({ id }: { id: string }) {
  const i = Math.max(0, RECETAS.findIndex((r) => r.id === id));
  const r = RECETAS[i];
  const sig = RECETAS[(i + 1) % RECETAS.length];
  const ir = () => transicionVista(() => { window.location.hash = `#plantilla/${sig.id}`; window.scrollTo(0, 0); }, ESTILOS[sig.estilo].vista);
  return (
    <>
      <PaginaReceta receta={r} cursor fuentes />
      <div className="plantilla-barra">
        <a href="#estudio">← Estudio</a>
        <button onClick={ir} data-prueba="siguiente-plantilla">Siguiente: {sig.nombre} →</button>
      </div>
    </>
  );
}
