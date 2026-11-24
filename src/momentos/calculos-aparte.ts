// Lo calculable de las piezas que se cargan aparte (antes y después, sorteo, confeti). Va en su propio archivo para que
// viaje con ellas y no pese en la entrada. Sin React; se prueba con node --test.

/** Número repetible entre 0 y 1 (el mismo de src/efectos/semilla.ts, copiado para no depender de la entrada). */
function semilla(i: number, sal = 0): number {
  const x = Math.sin((i + 1) * 12.9898 + sal * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** El nuevo valor del deslizador (0 a 100) para una tecla, o null si la tecla no lo mueve. */
export function valorPorTecla(valor: number, tecla: string): number | null {
  const pasos: Record<string, number> = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 10, PageDown: -10 };
  let v: number;
  if (tecla === "Home") v = 0;
  else if (tecla === "End") v = 100;
  else if (tecla in pasos) v = valor + pasos[tecla];
  else return null;
  return Math.min(100, Math.max(0, v));
}

/** Desde qué fracción raspada se muestra el premio entero. */
export const UMBRAL_RASPE = 0.5;

/** Fracción (0 a 1) de los píxeles muestreados (uno cada `paso`) que ya están borrados (alfa bajo 128). */
export function cuantoRaspado(rgba: Uint8ClampedArray, paso: number): number {
  const p = Math.max(1, Math.round(paso));
  let vistos = 0;
  let borrados = 0;
  for (let i = 3; i < rgba.length; i += 4 * p) {
    vistos++;
    if (rgba[i] < 128) borrados++;
  }
  return vistos ? borrados / vistos : 0;
}

/** Las piezas del confeti: dónde caen (−50 a 50 %), cuánto giran, cuándo parten y de qué color (0, 1 o 2). */
export function piezasConfeti(n: number, s: number): { x: number; giro: number; retraso: number; color: 0 | 1 | 2 }[] {
  const sal = Math.abs(Math.round(s)) % 10007;
  return Array.from({ length: Math.max(0, n) }, (_, i) => ({
    x: Math.round((semilla(i * 4, sal) * 100 - 50) * 10) / 10,
    giro: Math.round(semilla(i * 4 + 1, sal) * 720 - 360),
    retraso: Math.round(semilla(i * 4 + 2, sal) * 60) / 100,
    color: Math.floor(semilla(i * 4 + 3, sal) * 3) as 0 | 1 | 2,
  }));
}
