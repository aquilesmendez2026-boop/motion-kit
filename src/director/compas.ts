// El compás: un solo bucle de cuadros para toda una partitura. Cada suscriptor dice si le queda trabajo; cuando a
// nadie le queda, el bucle se detiene y no pide más cuadros hasta que lo despierten.

export interface Compas {
  /** Suma un suscriptor: recibe los segundos que pasaron y devuelve si le queda trabajo. Devuelve cómo quitarlo. */
  sumar(f: (dt: number) => boolean): () => void;
  /** Algo cambió (una señal): pide un cuadro si no hay uno pedido. */
  despertar(): void;
  /** Mueve el compás a mano, en pasos de 1/60 s (para pruebas, y para el reloj manual). */
  avanzar(ms: number): void;
  parar(): void;
}

const PASO = 1 / 60;

/** `puedeCorrer`: si la raíz se ve y la pestaña está a la vista. `manual`: no pide cuadros; solo `avanzar` lo mueve. */
export function crearCompas(puedeCorrer: () => boolean, manual = false): Compas {
  let suscriptores: ((dt: number) => boolean)[] = [];
  let cuadro = 0;
  let antes = 0;
  const latido = (dt: number) => {
    let queda = false;
    for (const f of [...suscriptores]) queda = f(dt) || queda;
    return queda;
  };
  const latir = (t: number) => {
    cuadro = 0;
    // El primer cuadro después de dormir cuenta como uno normal (no como el rato que estuvo dormido).
    const dt = antes ? Math.min(0.05, Math.max(0, (t - antes) / 1000)) : PASO;
    antes = t;
    // Si un suscriptor despertó al compás durante este latido, el cuadro ya está pedido: no se pide otro.
    if (latido(dt) && puedeCorrer()) cuadro ||= requestAnimationFrame(latir);
    else if (!cuadro) antes = 0;
  };
  return {
    sumar(f) {
      suscriptores.push(f);
      return () => {
        suscriptores = suscriptores.filter((x) => x !== f);
      };
    },
    despertar() {
      if (manual || cuadro || !suscriptores.length || typeof requestAnimationFrame === "undefined" || !puedeCorrer()) return;
      cuadro = requestAnimationFrame(latir);
    },
    avanzar(ms) {
      for (let resto = ms / 1000; resto > PASO / 2; resto -= PASO) latido(PASO);
    },
    parar() {
      if (cuadro) cancelAnimationFrame(cuadro);
      cuadro = 0;
      antes = 0;
      suscriptores = [];
    },
  };
}
