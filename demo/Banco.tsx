import { Estilo, type EstiloId } from "../src";
import { MosaicoQueSeArma, type MosaicoQueSeArmaProps } from "../src/momentos/MosaicoQueSeArma";
import { decodificar } from "./compartir";

/**
 * Banco de pruebas: monta una pieza con las props que vienen en la dirección (`#banco?d=…`, JSON en base64). Lo usan
 * las pruebas visuales para casos que la vitrina no tiene, como una galería con fotos de otro sitio.
 */
export function Banco({ d }: { d: string }) {
  const c = decodificar(d) as unknown as { estilo?: EstiloId; mosaico?: MosaicoQueSeArmaProps } | null;
  if (!c?.mosaico) return <p style={{ padding: "2rem" }}>El banco de pruebas no pudo leer la dirección.</p>;
  return (
    <main style={{ padding: 24 }}>
      <a href="#">← Demo</a>
      <Estilo nombre={c.estilo ?? "pelicula"} style={{ maxWidth: 720, padding: 16, borderRadius: 16 }}>
        <div data-prueba="banco">
          <MosaicoQueSeArma {...c.mosaico} />
        </div>
      </Estilo>
    </main>
  );
}
