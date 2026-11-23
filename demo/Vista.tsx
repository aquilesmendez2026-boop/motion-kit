import { useRef, useState } from "react";
import { Encabezado, Estilo, MedidorCarga, MedidorFluidez, MedidorPeso, type NivelEscena } from "../src";
import { decodificar } from "./compartir";

/** La vista que abre el QR: solo el encabezado, a pantalla completa, y abajo cómo anda en este teléfono. */
export function Vista({ d }: { d: string }) {
  const c = decodificar(d);
  const [nivel, setNivel] = useState<NivelEscena>("completo");
  const ref = useRef<HTMLDivElement>(null);
  if (!c) return <p style={{ padding: "2rem" }}>El enlace no se pudo leer. Vuelve a escanear el QR.</p>;
  const { estilo, ...props } = c;
  return (
    <div className="vista-telefono">
      <div ref={ref}>
        <Estilo nombre={estilo} fuentes>
          <Encabezado {...props} alCambiarNivel={setNivel} />
        </Estilo>
      </div>
      <div className="vista-medidores">
        <MedidorFluidez nivel={nivel} />
        <MedidorPeso objetivo={ref} />
        <MedidorCarga />
        <a href="#encabezados">← Volver al editor</a>
      </div>
    </div>
  );
}
