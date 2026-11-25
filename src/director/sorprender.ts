// «Sorpréndeme»: arma una entrada para las partes de una página, eligiendo con una semilla. Sin modelos de IA ni azar
// de verdad: la misma semilla da siempre la misma partitura, y siempre vale.
import { semilla } from "../efectos/semilla";
import { NOMBRE_ACTOR, type Cambio, type Curva, type Partitura, type PasoTiempo } from "./modelo";

/** Un molde de entrada: de dónde parte y con qué curva. `r(min, max)` da un entero entre los dos. */
type Molde = (r: (min: number, max: number) => number) => { de: Cambio; curva?: Curva };

const MOLDES: Molde[] = [
  (r) => ({ de: { y: r(16, 40), opacidad: 0 } }),
  (r) => ({ de: { y: -r(16, 40), opacidad: 0 } }),
  (r) => ({ de: { x: r(30, 70), opacidad: 0 } }),
  (r) => ({ de: { x: -r(30, 70), opacidad: 0 } }),
  (r) => ({ de: { escala: r(85, 95) / 100, opacidad: 0 }, curva: "resorte" }),
  (r) => ({ de: { inclinaX: -r(50, 80), opacidad: 0 } }),
  (r) => ({ de: { y: r(14, 28), giro: r(4, 10) * (r(0, 1) ? 1 : -1), opacidad: 0 }, curva: "resorte" }),
];

/**
 * Una entrada para `partes` (los nombres de las partes de la página, en el orden en que se quieren ver llegar). Se usan
 * hasta doce; las que no sirven como nombre o vienen repetidas se saltan. Sin ninguna, mueve «contenido».
 */
export function sorprender(s: number, partes: string[]): Partitura {
  const sal = Number.isFinite(s) ? Math.abs(Math.round(s)) % 100003 : 0;
  let k = 0;
  const r = (min: number, max: number) => min + Math.floor(semilla(k++, sal) * (max - min + 1));
  const nombres = [...new Set((Array.isArray(partes) ? partes : []).filter((p) => typeof p === "string" && NOMBRE_ACTOR.test(p)))].slice(0, 12);
  if (!nombres.length) nombres.push("contenido");
  // Un mismo ritmo para toda la entrada: cuánto espera cada parte a la anterior.
  const ritmo = r(6, 14) * 10;
  let espera = r(0, 8) * 10;
  const pasos: PasoTiempo[] = nombres.map((actor) => {
    // El título, a veces, se revela palabra por palabra.
    const revela = actor === "titulo" && r(0, 2) === 0;
    const molde = revela ? { de: { y: "135%" } as Cambio } : MOLDES[r(0, MOLDES.length - 1)](r);
    const paso: PasoTiempo = { actor, ...(revela ? { por: "palabra", mascara: true, cada: r(6, 12) * 10 } : {}), de: molde.de, dura: r(6, 9) * 100, ...("curva" in molde && molde.curva ? { curva: molde.curva } : {}), en: espera };
    espera += ritmo;
    return paso;
  });
  return { version: 1, nombre: `sorpresa ${sal}`, escenas: [{ con: "verse", pasos }] };
}
