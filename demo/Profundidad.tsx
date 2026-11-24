// Vitrina de la foto profunda: tres fotos de ejemplo con su mapa de profundidad ya calculado (`demo/fotos/`).
// Aquí no se baja ni se corre ningún modelo: por decisión de Aquiles (24-11-2026) todavía no se usan modelos de IA.
import { useState } from "react";
import { Encabezado, Estilo } from "../src";

const FOTOS = [
  { id: "perro", titulo: "Peluquería *canina*", antetitulo: "Baño y corte", composicion: "imagen" as const },
  { id: "cafe", titulo: "Café de *especialidad*", antetitulo: "Tostaduría de barrio", composicion: "imagen" as const },
  { id: "verduras", titulo: "Verduras del *día*", antetitulo: "Feria y despacho", composicion: "dividido" as const },
].map((f) => ({ ...f, foto: new URL(`./fotos/${f.id}.jpg`, import.meta.url).href, mapa: new URL(`./fotos/${f.id}-mapa.jpg`, import.meta.url).href }));

function Ejemplo({ foto, mapa, titulo, antetitulo, composicion }: { foto: string; mapa: string; titulo: string; antetitulo: string; composicion: "imagen" | "dividido" }) {
  const [prendida, setPrendida] = useState(true);
  const [verMapa, setVerMapa] = useState(false);
  return (
    <section className="prof-ejemplo">
      <div className="prof-controles">
        <label><input type="checkbox" checked={prendida} onChange={(e) => setPrendida(e.target.checked)} /> Foto profunda</label>
        <label><input type="checkbox" checked={verMapa} onChange={(e) => setVerMapa(e.target.checked)} /> Ver el mapa</label>
      </div>
      <div className="prof-marco">
        <Estilo nombre="pelicula" fuentes={false}>
          <Encabezado titulo={titulo} antetitulo={antetitulo} composicion={composicion} entrada="ninguna" alto="medio" imagenes={[foto]} alt="" mapasFotos={[mapa]} fotoProfunda={prendida} ahorro="nunca" />
        </Estilo>
        {verMapa && <img className="prof-mapa" src={mapa} alt="Mapa de profundidad: más claro es más cerca" />}
      </div>
    </section>
  );
}

export function Profundidad() {
  return (
    <main className="prof-demo">
      <a href="#">← Demo</a>
      <h1>Foto profunda</h1>
      <p className="enc-nota">
        La foto del encabezado con profundidad real. Mueve el cursor, baja la página o inclina el teléfono: lo que está cerca se mueve distinto de lo que está lejos.
        Cada foto lleva al lado un mapa chico en grises (unos 2 a 5 KB). Estas tres ya traen el suyo.
      </p>
      {FOTOS.map((f) => <Ejemplo key={f.id} {...f} />)}
    </main>
  );
}
