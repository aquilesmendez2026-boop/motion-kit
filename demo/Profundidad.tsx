// Vitrina de la foto profunda: tres fotos con su mapa de profundidad, y una herramienta para soltar una foto propia.
// El modelo que calcula el mapa (Depth Anything V2 Small, Apache-2.0) se baja de internet SOLO aquí, en la vitrina,
// cuando se suelta una foto: no es parte del paquete ni viaja a las páginas.
import { useState } from "react";
import { Encabezado, Estilo } from "../src";

const FOTOS = [
  { id: "perro", titulo: "Peluquería *canina*", antetitulo: "Baño y corte", composicion: "imagen" as const },
  { id: "cafe", titulo: "Café de *especialidad*", antetitulo: "Tostaduría de barrio", composicion: "imagen" as const },
  { id: "verduras", titulo: "Verduras del *día*", antetitulo: "Feria y despacho", composicion: "dividido" as const },
].map((f) => ({ ...f, foto: new URL(`./fotos/${f.id}.jpg`, import.meta.url).href, mapa: new URL(`./fotos/${f.id}-mapa.jpg`, import.meta.url).href }));

/** Lo que entrega el modelo para una foto. */
interface Calculo {
  foto: string;
  mapa: string;
  ms: number;
  kb: number;
}

/** La biblioteca abierta que corre el modelo en el navegador. Versión fija. */
const BIBLIOTECA = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";
const MODELO = "onnx-community/depth-anything-v2-small";
/** La revisión exacta del modelo (la del 14-04-2026, con la que se hizo la prueba): así no cambia sin que lo sepamos. */
const REVISION = "4472b7362082ad9968fee890ca0f1e5aca36b93d";
type Estimador = (foto: string) => Promise<{ depth: { width: number; height: number; data: Uint8Array } }>;
let estimador: Promise<Estimador> | null = null;

/** Calcula el mapa de profundidad de una foto, aquí en el navegador. El mapa sale de 256 px de ancho, en JPG. */
async function calcular(foto: string): Promise<Calculo> {
  estimador ??= import(/* @vite-ignore */ BIBLIOTECA).then((m: { pipeline: (tarea: string, modelo: string, o: object) => Promise<Estimador> }) => m.pipeline("depth-estimation", MODELO, { device: "wasm", dtype: "q8", revision: REVISION }));
  // Si el modelo no bajó (sin red, por ejemplo), no se guarda el intento fallido: el botón puede probar de nuevo.
  const modelo = await estimador.catch((e: unknown) => {
    estimador = null;
    throw e;
  });
  const inicio = performance.now();
  const { depth } = await modelo(foto);
  const ms = performance.now() - inicio;
  const grande = document.createElement("canvas");
  grande.width = depth.width;
  grande.height = depth.height;
  const ctx = grande.getContext("2d")!;
  const datos = ctx.createImageData(depth.width, depth.height);
  for (let i = 0; i < depth.data.length; i++) {
    datos.data[i * 4] = datos.data[i * 4 + 1] = datos.data[i * 4 + 2] = depth.data[i];
    datos.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(datos, 0, 0);
  const chico = document.createElement("canvas");
  chico.width = 256;
  chico.height = Math.max(1, Math.round((256 * depth.height) / depth.width));
  chico.getContext("2d")!.drawImage(grande, 0, 0, chico.width, chico.height);
  const mapa = chico.toDataURL("image/jpeg", 0.8);
  return { foto, mapa, ms, kb: ((mapa.length - mapa.indexOf(",") - 1) * 0.75) / 1024 };
}

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
  const [propia, setPropia] = useState<Calculo | null>(null);
  const [estado, setEstado] = useState("");
  const alElegir = (archivo: File | undefined) => {
    if (!archivo || !archivo.type.startsWith("image/")) return;
    const lector = new FileReader();
    lector.onload = () => {
      setEstado("Calculando… la primera vez baja el modelo (decenas de MB).");
      calcular(String(lector.result))
        .then((c) => {
          setPropia(c);
          setEstado(`Listo en ${(c.ms / 1000).toFixed(1)} s. El mapa pesa ${c.kb.toFixed(1)} KB.`);
        })
        .catch(() => setEstado("No se pudo calcular (¿sin conexión?). Las tres fotos de arriba siguen funcionando."));
    };
    lector.readAsDataURL(archivo);
  };
  return (
    <main className="prof-demo">
      <a href="#">← Demo</a>
      <h1>Foto profunda</h1>
      <p className="enc-nota">
        La foto del encabezado con profundidad real. Mueve el cursor, baja la página o inclina el teléfono: lo que está cerca se mueve distinto de lo que está lejos.
        Cada foto lleva al lado un mapa chico en grises (unos 2 a 5 KB) que se calcula una sola vez.
      </p>
      {FOTOS.map((f) => <Ejemplo key={f.id} {...f} />)}
      <section className="prof-ejemplo">
        <h2>Prueba con tu foto</h2>
        <p className="enc-nota">Se calcula aquí, en tu navegador: la foto no sale de tu computador. El modelo se baja de internet solo en esta vitrina.</p>
        <input type="file" accept="image/*" onChange={(e) => alElegir(e.target.files?.[0])} data-prueba="prof-archivo" />
        <p role="status" data-prueba="prof-estado">{estado}</p>
        {propia && <Ejemplo foto={propia.foto} mapa={propia.mapa} titulo="Tu *foto*" antetitulo="Recién calculada" composicion="imagen" />}
      </section>
    </main>
  );
}
