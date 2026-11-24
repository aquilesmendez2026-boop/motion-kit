import { useRef, useState } from "react";
import { Encabezado, Estilo, EstiloLaMente, type NivelEscena } from "../src";
import { MedidorCarga, MedidorFluidez, MedidorPeso } from "../src/entradas/escena";
import { decodificar } from "./compartir";

/** La vista que abre el QR: solo el encabezado, a pantalla completa, y abajo cómo anda en este teléfono. */
export function Vista({ d }: { d: string }) {
  const c = decodificar(d);
  const [nivel, setNivel] = useState<NivelEscena>("completo");
  const ref = useRef<HTMLDivElement>(null);
  if (!c) return <p style={{ padding: "2rem" }}>El enlace no se pudo leer. Vuelve a escanear el QR.</p>;
  const { estilo, lmTema, lmPaleta, ...props } = c;
  return (
    <div className="vista-telefono">
      <div ref={ref}>
        {lmTema ? (
          <EstiloLaMente tema={lmTema} paleta={lmPaleta} base={estilo} fuentes>
            <Encabezado {...props} alCambiarNivel={setNivel} />
          </EstiloLaMente>
        ) : (
          <Estilo nombre={estilo} fuentes>
            <Encabezado {...props} alCambiarNivel={setNivel} />
          </Estilo>
        )}
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
