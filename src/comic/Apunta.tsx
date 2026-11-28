// La mano dentro de una caja de su tamaño ya girada (ancho × la mitad, o al revés si apunta arriba o abajo), para que la
// punta del dedo quede pegada a lo que va al lado (a ~3 px). La usan Vacio y Oferta.
import { useEffect, useState } from "react";
import type { Direccion } from "./calculo";
import { Mano } from "./Mano";

/** Menos de esto de ancho, la mano apunta desde arriba. */
const TELEFONO = "(max-width: 559px)";

export function useTelefono() {
  const [tel, setTel] = useState(() => typeof matchMedia !== "undefined" && matchMedia(TELEFONO).matches);
  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const m = matchMedia(TELEFONO);
    const alCambiar = () => setTel(m.matches);
    m.addEventListener("change", alCambiar);
    return () => m.removeEventListener("change", alCambiar);
  }, []);
  return tel;
}

/** `activo`: toca una vez (al entrar en pantalla); si no, quieta apuntando. */
export function Apunta({ direccion, ancho = 110, activo }: { direccion: Direccion; ancho?: number; activo: boolean }) {
  const vertical = direccion === "arriba" || direccion === "abajo";
  const w = vertical ? ancho / 2 : ancho;
  const h = vertical ? ancho : ancho / 2;
  return (
    <span style={{ position: "relative", display: "inline-block", flex: "none", width: w, height: h }} aria-hidden="true">
      <Mano
        ancho={ancho}
        direccion={direccion}
        toca={false}
        unaVez={activo}
        pop={activo}
        style={{ position: "absolute", left: (w - ancho) / 2, top: (h - ancho / 2) / 2 }}
      />
    </span>
  );
}
