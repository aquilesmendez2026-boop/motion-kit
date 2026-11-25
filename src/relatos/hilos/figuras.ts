// Las figuras que el hilo dibuja al final de la página: once, cada una de un solo trazo, en una caja de 0 a 100.
// Cada una parte de un punto al que se llega desde arriba sin cruzarla: por ahí le entra el hilo.
// Se definen por sus puntos (líneas y arcos); el camino sale de pasar suave por ellos.
import type { FiguraId } from "../catalogo";
import { arco, quebrada, suave, type Punto } from "./geometria";

const p = (x: number, y: number): Punto => ({ x, y });
/** Una línea quebrada con muestras cada 5 unidades (así las esquinas quedan esquinas). */
const linea = (...puntos: [number, number][]) => quebrada(puntos.map(([x, y]) => p(x, y)), 5);
/** Junta pedazos en un solo trazo: de donde termina uno va derecho a donde parte el otro. */
const trazo = (...pedazos: Punto[][]): Punto[] => pedazos.slice(1).reduce((t, pedazo) => [...t, ...quebrada([t[t.length - 1], pedazo[0]], 5).slice(1), ...pedazo.slice(1)], pedazos[0]);

/** El corazón, por su fórmula de siempre, desde la hendidura de arriba. */
const corazon = (): Punto[] =>
  Array.from({ length: 41 }, (_, i) => {
    const t = (i / 40) * 2 * Math.PI;
    return p(50 + 2.7 * 16 * Math.sin(t) ** 3, 46 - 2.7 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)));
  });
/** La estrella de cinco puntas, cerrada. */
const estrella = (): Punto[] =>
  linea(...Array.from({ length: 11 }, (_, i): [number, number] => {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 ? 19 : 46;
    return [50 + r * Math.cos(a), 53 + r * Math.sin(a)];
  }));

const PUNTOS: Record<FiguraId, () => Punto[]> = {
  // El vapor, el borde, la taza, su asa y el plato (una curva bajo la taza).
  taza: () => trazo(linea([50, 5], [43, 12], [53, 19], [46, 27]), linea([74, 36], [22, 36]), arco(48, 36, 26, 42, 180, 0), arco(74, 55, 15, 13, -80, 110), arco(48, 84, 40, 9, 0, 180)),
  // El pan de arriba, la lechuga, la carne y el pan de abajo.
  hamburguesa: () => trazo(arco(50, 44, 39, 32, 180, 360), linea([89, 52], [78, 59], [66, 52], [54, 59], [42, 52], [30, 59], [11, 52]), linea([11, 66], [89, 66]), linea([89, 75]), arco(50, 75, 39, 17, 0, 180), linea([11, 75], [11, 66])),
  // Un plato servido bajo su campana: el pomo, la campana y la bandeja.
  plato: () => trazo(arco(50, 27, 7, 7, -90, 450), arco(50, 76, 36, 41, -90, 0), linea([95, 76], [5, 76], [14, 76]), arco(50, 76, 36, 41, 180, 270), linea([50, 35], [50, 35]), linea([5, 76], [9, 86], [91, 86], [95, 76])),
  // El poste de la barbería: su bola, el cilindro con sus franjas y la base.
  poste: () => trazo(arco(50, 13, 10, 9, -90, 450), linea([32, 24], [68, 24], [68, 82], [32, 82], [32, 24]), linea([68, 36], [32, 48], [68, 60], [32, 72], [68, 82]), linea([78, 82], [78, 95], [22, 95], [22, 82], [32, 82])),
  // Una hoja, el eje, un ojo, el otro ojo y la otra hoja.
  tijera: () => trazo(linea([14, 6], [50, 50]), arco(71, 76, 14, 14, -125, 235), arco(29, 76, 14, 14, -55, -415), linea([50, 50], [86, 6])),
  // La almohadilla grande y los cuatro dedos.
  huella: () => trazo(arco(50, 68, 23, 19, -90, 270), arco(20, 42, 8, 11, 90, 450), arco(39, 22, 8, 11, 90, 450), arco(61, 22, 8, 11, 90, 450), arco(80, 42, 8, 11, 90, 450)),
  // La silueta de una pesa: dos discos a cada lado y la barra.
  pesa: () => linea([6, 38], [6, 62], [16, 62], [16, 72], [28, 72], [28, 55], [72, 55], [72, 72], [84, 72], [84, 62], [94, 62], [94, 38], [84, 38], [84, 28], [72, 28], [72, 45], [28, 45], [28, 28], [16, 28], [16, 38], [6, 38]),
  // La punta, el cuerpo y la goma de un lápiz inclinado.
  lapiz: () => linea([70, 14], [86, 30], [32, 84], [16, 68], [70, 14], [60, 24], [76, 40], [32, 84], [10, 90], [16, 68]),
  // El asa y la bolsa.
  bolsa: () => trazo(arco(50, 34, 15, 24, 180, 360), linea([80, 34], [87, 93], [13, 93], [20, 34], [35, 34])),
  corazon,
  estrella,
};

/** Los puntos de una figura (su trazo, en la caja de 0 a 100). */
export function puntosDeFigura(id: FiguraId): Punto[] {
  return (PUNTOS[id] ?? PUNTOS.estrella)().map((q) => p(Math.min(100, Math.max(0, q.x)), Math.min(100, Math.max(0, q.y))));
}

/** El camino SVG de cada figura: un solo trazo (una sola orden `M`). */
export const CAMINOS = Object.fromEntries((Object.keys(PUNTOS) as FiguraId[]).map((id) => [id, suave(puntosDeFigura(id))])) as Record<FiguraId, string>;
