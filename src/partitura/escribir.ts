// Escribe una partitura en español, en su forma canónica: las frases siempre en el mismo orden. Leer lo que sale de
// aquí da la misma partitura (se prueba). Los comentarios de un texto no existen en el dato: no vuelven.
import type { Cambio, Escena, Partitura } from "../director/modelo";
import { validarPartitura } from "../director/validar";
import { ESCENAS, VERBO_ESTADO, numero } from "./frases";

/** Una distancia con su verbo: el signo va en la palabra, no en el número. */
function distancia(v: number | string, menos: string, mas: string): string {
  const n = typeof v === "number" ? v : parseFloat(v);
  return `${n < 0 ? menos : mas} ${numero(Math.abs(n))}${typeof v === "number" ? "px" : "%"}`;
}
const porciento = (n: number) => `${numero(n * 100)}%`;
const tiempo = (n: number) => `${numero(n)}ms`;

/** De dónde parte. */
function frasesDe(c: Cambio): string[] {
  return [
    ...(c.y !== undefined ? [distancia(c.y, "desde arriba", "desde abajo")] : []),
    ...(c.x !== undefined ? [distancia(c.x, "desde la izquierda", "desde la derecha")] : []),
    ...(c.opacidad !== undefined ? [c.opacidad === 0 ? "aparece" : `aparece desde ${numero(c.opacidad)}`] : []),
    ...(c.escala !== undefined ? [`crece desde ${numero(c.escala)}`] : []),
    ...(c.giro !== undefined ? [`gira desde ${numero(c.giro)} grados`] : []),
    ...(c.inclinaX !== undefined ? [`se levanta desde ${numero(c.inclinaX)} grados`] : []),
    ...(c.inclinaY !== undefined ? [`se abre desde ${numero(c.inclinaY)} grados`] : []),
  ];
}

/** A dónde llega, o cuánto cambia con la señal. */
function frasesA(c: Cambio): string[] {
  // «se inclina» son los dos ejes con el mismo valor; si no, va cada uno con su verbo.
  const juntos = c.inclinaX !== undefined && c.inclinaX === c.inclinaY;
  return [
    ...(c.y !== undefined ? [distancia(c.y, "sube", "baja")] : []),
    ...(c.x !== undefined ? [distancia(c.x, "va a la izquierda", "va a la derecha")] : []),
    ...(c.opacidad !== undefined ? [c.opacidad === 0 ? "se apaga" : c.opacidad === 1 ? "se enciende" : `se apaga a ${numero(c.opacidad)}`] : []),
    ...(c.escala !== undefined ? [`${c.escala < 1 ? "se achica" : "crece"} a ${numero(c.escala)}`] : []),
    ...(c.giro !== undefined ? [`gira ${numero(c.giro)} grados`] : []),
    ...(juntos ? [`se inclina ${numero(c.inclinaX!)} grados`] : []),
    ...(!juntos && c.inclinaX !== undefined ? [`se vuelca ${numero(c.inclinaX)} grados`] : []),
    ...(!juntos && c.inclinaY !== undefined ? [`se ladea ${numero(c.inclinaY)} grados`] : []),
  ];
}

const CON_TILDE: Record<string, string> = { vaiven: "vaivén", elastico: "elástico" };

function encabezado(e: Escena): string {
  if (e.con === "estado") return `al ${VERBO_ESTADO[e.estado]}${e.sobre ? ` ${e.sobre}` : ""}:`;
  const repetir = e.con === "verse" && e.repetir === true;
  const tramo = e.con === "vista" ? e.tramo : undefined;
  return `${ESCENAS.find((f) => f.con === e.con && Boolean(f.repetir) === repetir && f.tramo === tramo)!.texto}:`;
}

/** El texto de una partitura. Exige una que vale (versión 1): con otra cosa lanza, y dice por qué no vale. */
export function escribirPartitura(p: Partitura): string {
  const r = validarPartitura(p);
  if (!r.ok) throw new TypeError(`escribirPartitura: la partitura no vale (${r.errores[0]?.campo}: ${r.errores[0]?.mensaje})`);
  const lineas: string[] = [];
  if (p.nombre) lineas.push(`partitura ${p.nombre.replace(/\s+/g, " ").trim()}`, "");
  for (const escena of p.escenas) {
    lineas.push(encabezado(escena));
    for (const paso of escena.pasos as unknown as Record<string, unknown>[]) {
      const cuando = (campo: "luego" | "junto") => (paso[campo] !== undefined ? [paso[campo] === 0 ? campo : `${campo} ${tiempo(paso[campo] as number)}`] : []);
      const entre = paso.entre as [number, number] | undefined;
      const frases = [
        ...(paso.de ? frasesDe(paso.de as Cambio) : []),
        ...(paso.a ? frasesA(paso.a as Cambio) : []),
        ...(paso.por ? [`por ${paso.por as string}`] : []),
        ...(paso.mascara === true ? ["con máscara"] : []),
        ...(paso.dura !== undefined ? [tiempo(paso.dura as number)] : []),
        ...(paso.cada !== undefined ? [`cada ${tiempo(paso.cada as number)}`] : []),
        ...(paso.en !== undefined ? [`en ${tiempo(paso.en as number)}`] : []),
        ...cuando("luego"),
        ...cuando("junto"),
        ...(paso.curva ? [`curva ${CON_TILDE[paso.curva as string] ?? (paso.curva as string)}`] : []),
        ...(paso.resorte ? [`resorte ${CON_TILDE[paso.resorte as string] ?? (paso.resorte as string)}`] : []),
        ...(entre ? [`entre ${porciento(entre[0])} y ${porciento(entre[1])}`] : []),
        ...(paso.reparto !== undefined ? [`reparto ${porciento(paso.reparto as number)}`] : []),
      ];
      lineas.push(`  ${paso.actor as string} ${frases.join(", ")}`);
    }
    lineas.push("");
  }
  return lineas.join("\n");
}
