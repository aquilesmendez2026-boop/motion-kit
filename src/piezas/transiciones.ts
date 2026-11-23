export type TransicionId =
  | "fundido" | "subir" | "bajar" | "izquierda" | "derecha"
  | "escalar" | "zoom" | "voltear" | "hoja" | "cortina" | "pasar";

/** Estado «fuera» de cada transición (el estado «dentro» es siempre opacidad 1 y sin transformación). */
export const TRANSICIONES: Record<TransicionId, { nombre: string; fuera: (sentido: 1 | -1) => Keyframe }> = {
  fundido: { nombre: "Fundido", fuera: () => ({ opacity: 0 }) },
  subir: { nombre: "Subir", fuera: () => ({ opacity: 0, transform: "translateY(18px)" }) },
  bajar: { nombre: "Bajar", fuera: () => ({ opacity: 0, transform: "translateY(-18px)" }) },
  izquierda: { nombre: "Desde la izquierda", fuera: () => ({ opacity: 0, transform: "translateX(-28px)" }) },
  derecha: { nombre: "Desde la derecha", fuera: () => ({ opacity: 0, transform: "translateX(28px)" }) },
  escalar: { nombre: "Escalar", fuera: () => ({ opacity: 0, transform: "scale(.92)" }) },
  zoom: { nombre: "Zoom", fuera: () => ({ opacity: 0, transform: "scale(1.08)" }) },
  voltear: { nombre: "Voltear", fuera: () => ({ opacity: 0, transform: "perspective(800px) rotateX(-55deg)" }) },
  hoja: { nombre: "Hoja (desde abajo)", fuera: () => ({ opacity: 1, transform: "translateY(100%)" }) },
  cortina: { nombre: "Cortina (desde el lado)", fuera: () => ({ opacity: 1, transform: "translateX(100%)" }) },
  pasar: { nombre: "Pasar (como páginas)", fuera: (s) => ({ opacity: 0, transform: `translateX(${32 * s}px)` }) },
};

const DENTRO: Keyframe = { opacity: 1, transform: "none" };
export const ENTRA = "cubic-bezier(.2,.8,.2,1)";
export const SALE = "cubic-bezier(.4,0,1,1)";

/** Anima la entrada de un elemento. Devuelve la animación (o null si el navegador no tiene WAAPI). */
export function animarEntrada(el: Element, tipo: TransicionId, duracion: number, reducido: boolean, sentido: 1 | -1 = 1) {
  if (!("animate" in el)) return null;
  const fuera = reducido ? { opacity: 0 } : TRANSICIONES[tipo].fuera(sentido);
  return el.animate([fuera, reducido ? { opacity: 1 } : DENTRO], { duration: reducido ? Math.min(duracion, 200) : duracion, easing: ENTRA, fill: "backwards" });
}

/** Anima la salida. En «pasar», sale hacia el lado contrario del que entra el siguiente. */
export function animarSalida(el: Element, tipo: TransicionId, duracion: number, reducido: boolean, sentido: 1 | -1 = 1) {
  if (!("animate" in el)) return null;
  const fuera = reducido ? { opacity: 0 } : TRANSICIONES[tipo].fuera(tipo === "pasar" ? ((-sentido) as 1 | -1) : sentido);
  return el.animate([reducido ? { opacity: 1 } : DENTRO, fuera], { duration: reducido ? Math.min(duracion, 200) : duracion * 0.8, easing: SALE, fill: "forwards" });
}
