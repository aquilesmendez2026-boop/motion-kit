// La hora al día: las piezas que dicen «Hoy» o «Próxima» se vuelven a dibujar cada medio minuto mientras la pestaña
// se ve, y al volver a ella. Sin esto, una página que queda abierta seguiría mostrando la clase que ya pasó.
import { useEffect, useState } from "react";

/** Cada cuánto se mira la hora (ms). */
const CADA = 30_000;

/** Devuelve un número que cambia cada medio minuto con la pestaña a la vista, y al volver a ella. */
export function useHoraAlDia(): number {
  const [tic, setTic] = useState(0);
  useEffect(() => {
    const avanzar = () => {
      if (!document.hidden) setTic((n) => n + 1);
    };
    const reloj = setInterval(avanzar, CADA);
    document.addEventListener("visibilitychange", avanzar);
    return () => {
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", avanzar);
    };
  }, []);
  return tic;
}
