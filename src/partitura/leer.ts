// Lee una partitura escrita en español y entrega el dato (versión 1). No ejecuta nada: cada línea es una escena o un
// paso, y cada frase de un paso pone un campo del modelo. Lo leído pasa por `validarPartitura`.
import { CAMPOS, CURVAS, NOMBRE_ACTOR, RESORTES, type Estado, type Partitura, type Senal } from "../director/modelo";
import { validarPartitura } from "../director/validar";
import { ESCENAS, VERBO_ESTADO, llano, numero } from "./frases";

export interface ErrorTexto {
  /** La línea del texto (la primera es la 1). */
  linea: number;
  mensaje: string;
}
export type ResultadoTexto = { ok: true; partitura: Partitura } | { ok: false; errores: ErrorTexto[] };

/** Cuántos errores se devuelven a lo más: un texto enorme y roto no llena la memoria de mensajes. */
const MAX_ERRORES = 20;
const N = "(-?\\d+(?:\\.\\d+)?)";
const TIEMPO = "(\\d+(?:\\.\\d+)?)(ms|s)";
const ms = (n: string, unidad: string) => Number(n) * (unidad === "s" ? 1000 : 1);
/** Un porcentaje como parte de 1, sin ruido de decimales (10.1% es 0.101, no 0.10099999999999999). */
const parte = (n: string) => Math.round(Number(n) * 1e4) / 1e6;
/** Una distancia: px (número) o un porcentaje del propio tamaño (texto). `signo`: hacia dónde es el verbo. */
const distancia = (n: string, unidad: string | undefined, signo: number): number | string => (unidad === "%" ? `${numero(Number(n) * signo)}%` : Number(n) * signo || 0);

/** Lo que pone una frase: el campo del paso, el campo de adentro (en `de` y `a`) y su valor. */
type Puesto = [campo: string, sub: string | null, valor: unknown];
/** Una frase: cómo se reconoce y qué pone. Si devuelve un texto, es un error. */
type Frase = [RegExp, (m: RegExpExecArray) => Puesto[] | string];

const lista = (nombres: readonly string[]) => nombres.join(", ");
const FRASES: Frase[] = [
  // De dónde parte.
  [new RegExp(`^desde (?:la )?(abajo|arriba|izquierda|derecha) ${N}(px|%)?$`), (m) => [["de", m[1] === "abajo" || m[1] === "arriba" ? "y" : "x", distancia(m[2], m[3], m[1] === "abajo" || m[1] === "derecha" ? 1 : -1)]]],
  [new RegExp(`^aparece(?: desde ${N})?$`), (m) => [["de", "opacidad", m[1] ? Number(m[1]) : 0]]],
  [new RegExp(`^crece desde ${N}$`), (m) => [["de", "escala", Number(m[1])]]],
  [new RegExp(`^gira desde ${N} grados?$`), (m) => [["de", "giro", Number(m[1])]]],
  [new RegExp(`^se levanta desde ${N} grados?$`), (m) => [["de", "inclinaX", Number(m[1])]]],
  [new RegExp(`^se abre desde ${N} grados?$`), (m) => [["de", "inclinaY", Number(m[1])]]],
  // A dónde llega (o cuánto cambia con la señal).
  [new RegExp(`^(sube|baja) ${N}(px|%)?$`), (m) => [["a", "y", distancia(m[2], m[3], m[1] === "baja" ? 1 : -1)]]],
  [new RegExp(`^va a la (izquierda|derecha) ${N}(px|%)?$`), (m) => [["a", "x", distancia(m[2], m[3], m[1] === "derecha" ? 1 : -1)]]],
  [new RegExp(`^se apaga(?: a ${N})?$`), (m) => [["a", "opacidad", m[1] ? Number(m[1]) : 0]]],
  [/^se enciende$/, () => [["a", "opacidad", 1]]],
  [new RegExp(`^(?:crece|se achica) a ${N}$`), (m) => [["a", "escala", Number(m[1])]]],
  [new RegExp(`^gira ${N} grados?$`), (m) => [["a", "giro", Number(m[1])]]],
  [new RegExp(`^se inclina ${N} grados?$`), (m) => [["a", "inclinaX", Number(m[1])], ["a", "inclinaY", Number(m[1])]]],
  [new RegExp(`^se vuelca ${N} grados?$`), (m) => [["a", "inclinaX", Number(m[1])]]],
  [new RegExp(`^se ladea ${N} grados?$`), (m) => [["a", "inclinaY", Number(m[1])]]],
  // Cómo y cuándo.
  [/^por (letra|palabra|hijo)$/, (m) => [["por", null, m[1]]]],
  [/^con mascara$/, () => [["mascara", null, true]]],
  [new RegExp(`^${TIEMPO}$`), (m) => [["dura", null, ms(m[1], m[2])]]],
  [new RegExp(`^(cada|en) ${TIEMPO}$`), (m) => [[m[1], null, ms(m[2], m[3])]]],
  [new RegExp(`^(luego|junto)(?: ${TIEMPO})?$`), (m) => [[m[1], null, m[2] ? ms(m[2], m[3]) : 0]]],
  [/^curva(?: (\S+))?$/, (m) => (CURVAS.includes(m[1] as never) ? [["curva", null, m[1]]] : `La curva es una de: ${lista(CURVAS)}.`)],
  [/^resorte(?: (\S+))?$/, (m) => (RESORTES.includes(m[1] as never) ? [["resorte", null, m[1]]] : `Después de «resorte» va uno de: ${lista(RESORTES)}. (La curva con rebote se escribe «curva resorte».)`)],
  [new RegExp(`^entre ${N}% y ${N}%$`), (m) => [["entre", null, [parte(m[1]), parte(m[2])]]]],
  [new RegExp(`^reparto ${N}%$`), (m) => [["reparto", null, parte(m[1])]]],
];

/**
 * La escena de un encabezado (ya sin los dos puntos y en llano), o `null` si no existe. `sobre`: el actor de una escena
 * de estado, en minúsculas pero con sus tildes (a un nombre no se le quitan: con tilde o «ñ» no vale, y se dice).
 */
function escenaDe(texto: string, sobre: string): { con: Senal; extra: Record<string, unknown> } | null | string {
  const fija = ESCENAS.find((e) => e.texto === texto);
  if (fija) return { con: fija.con, extra: { ...(fija.repetir ? { repetir: true } : {}), ...(fija.tramo ? { tramo: fija.tramo } : {}) } };
  const m = /^al (apuntar|enfocar|apretar)(?: (.+))?$/.exec(texto);
  if (!m) return null;
  const estado = (Object.keys(VERBO_ESTADO) as Estado[]).find((e) => VERBO_ESTADO[e] === m[1])!;
  if (m[2] !== undefined && !NOMBRE_ACTOR.test(sobre)) return "Después del verbo va el actor: el nombre de una parte, en minúsculas, con números y guiones.";
  return { con: "estado", extra: { estado, ...(m[2] !== undefined ? { sobre } : {}) } };
}

const FORMAS = `${ESCENAS.map((e) => `«${e.texto}:»`).join(", ")}, «al apuntar <actor>:», «al enfocar <actor>:» y «al apretar <actor>:»`;

/** Lee el texto de una partitura. Nunca lanza: lo que no se entiende vuelve como errores, cada uno con su línea. */
export function leerPartitura(texto: string): ResultadoTexto {
  const errores: ErrorTexto[] = [];
  const mal = (linea: number, mensaje: string) => {
    if (errores.length < MAX_ERRORES) errores.push({ linea, mensaje });
  };
  if (typeof texto !== "string") return { ok: false, errores: [{ linea: 1, mensaje: "La partitura se escribe como un texto, con una escena por lo menos (por ejemplo «al verse:»)." }] };

  let nombre: string | undefined;
  let lineaNombre = 1;
  const escenas: { con: Senal; linea: number; titulo: string; extra: Record<string, unknown>; pasos: Record<string, unknown>[]; lineas: number[] }[] = [];
  /** La escena en curso; `false` si su encabezado no se entendió (sus pasos se saltan: el error ya está dicho). */
  let actual: (typeof escenas)[number] | false | null = null;
  // U+2028 y U+2029 también cortan la línea (los deja un copiar y pegar desde un procesador de texto).
  const lineas = texto.split(/\r\n|[\n\r\u2028\u2029]/);

  for (let i = 0; i < lineas.length && errores.length < MAX_ERRORES; i++) {
    const n = i + 1;
    // Sin caracteres invisibles (los deja un copiar y pegar).
    const cruda = lineas[i].replace(/[\u0000-\u0008\u000b-\u001f​-‏﻿]/g, "");
    // El nombre va tal cual, hasta el final de la línea (puede llevar «#» o dos puntos).
    const conNombre = /^\s*partitura\s+(.*)$/i.exec(cruda);
    if (conNombre && !escenas.length && actual === null) {
      nombre = conNombre[1].replace(/\s+/g, " ").trim().slice(0, 200);
      lineaNombre = n;
      continue;
    }
    const gato = cruda.indexOf("#");
    /** La línea sin su comentario, en minúsculas y con sus tildes: de aquí salen los nombres de los actores. */
    const escrita = (gato < 0 ? cruda : cruda.slice(0, gato)).toLowerCase().trim().split(/\s+/);
    const linea = llano(escrita.join(" "));
    if (!linea) continue;

    // Una escena. Sin los dos puntos se entiende igual, si es una de las que existen.
    const conPuntos = linea.endsWith(":");
    const titulo = conPuntos ? linea.slice(0, -1).trim() : linea;
    const e = escenaDe(titulo, escrita.slice(2).join(" ").replace(/\s*:$/, ""));
    if (conPuntos || e) {
      if (!e || typeof e === "string") {
        mal(n, e ?? `No conozco la escena «${titulo.slice(0, 60)}». Las que hay: ${FORMAS}.`);
        actual = false;
        continue;
      }
      actual = { con: e.con, linea: n, titulo, extra: e.extra, pasos: [], lineas: [] };
      escenas.push(actual);
      continue;
    }

    if (actual === false) continue;
    if (!actual) {
      mal(n, "Este paso no está dentro de una escena. Antes va una línea como «al verse:».");
      continue;
    }
    const corte = linea.indexOf(" ");
    const actor = escrita[0];
    if (!NOMBRE_ACTOR.test(actor)) {
      mal(n, `«${actor.slice(0, 40)}» no sirve como actor: es el nombre de una parte, en minúsculas, con números y guiones (hasta 40).`);
      continue;
    }
    const frases = corte < 0 ? [] : linea.slice(corte + 1).split(",").map((f) => f.trim()).filter(Boolean);
    if (!frases.length) {
      mal(n, `Falta decir qué hace «${actor}» (por ejemplo «${actor} desde abajo 20px, aparece»).`);
      continue;
    }
    const paso: Record<string, unknown> = { actor };
    const puestos = new Set<string>();
    const permitidos: readonly string[] = CAMPOS.paso[actual.con];
    let antes = "";
    for (const frase of frases) {
      if (errores.length >= MAX_ERRORES) break;
      let hecho: Puesto[] | string | null = null;
      for (const [forma, hacer] of FRASES) {
        const m = forma.exec(frase);
        if (m) {
          hecho = hacer(m);
          break;
        }
      }
      const corta = frase.slice(0, 60);
      if (hecho === null) {
        // «0,8» se parte en dos frases: se avisa por su nombre.
        if (/^\d+\S*$/.test(frase) && /\d$/.test(antes)) mal(n, `«${antes.slice(-20)},${corta}»: usa punto para los decimales (la coma separa las frases).`);
        else mal(n, `No entiendo «${corta}».`);
      } else if (typeof hecho === "string") mal(n, `«${corta}»: ${hecho}`);
      else {
        for (const [campo, sub, valor] of hecho) {
          const clave = sub ? `${campo}.${sub}` : campo;
          if (!permitidos.includes(campo)) {
            // La frase sin su número: «cada 90ms» es «cada»; «con mascara» va entera.
            mal(n, `«${corta.replace(/(?: a| desde)? -?\d.*$/, "")}» no va en una escena «${actual.titulo}».`);
            break;
          }
          if (puestos.has(clave)) {
            mal(n, `«${corta}»: eso ya está dicho en este paso (va dos veces).`);
            break;
          }
          puestos.add(clave);
          if (sub) paso[campo] = { ...(paso[campo] as Record<string, unknown> | undefined), [sub]: valor };
          else paso[campo] = valor;
        }
      }
      antes = frase;
    }
    actual.pasos.push(paso);
    actual.lineas.push(n);
  }

  if (!errores.length && !escenas.length) mal(1, "El texto no tiene ninguna escena. Una escena parte con una línea como «al verse:» y sus pasos van debajo.");
  for (const e of escenas) if (!errores.length && !e.pasos.length) mal(e.linea, `La escena «${e.titulo}» no tiene pasos: debajo va una línea por cada cosa que se mueve.`);
  if (errores.length) return { ok: false, errores };

  const partitura = { version: 1, ...(nombre ? { nombre } : {}), escenas: escenas.map((e) => ({ con: e.con, ...e.extra, pasos: e.pasos })) };
  const r = validarPartitura(partitura);
  if (r.ok) return { ok: true, partitura: r.partitura };
  // Lo que encontró el validador, con la línea del paso (o de la escena) donde está.
  for (const error of r.errores) {
    const m = /^escenas\[(\d+)\](?:\.pasos\[(\d+)\])?/.exec(error.campo);
    const escena = m ? escenas[Number(m[1])] : undefined;
    mal(escena ? (m![2] !== undefined ? (escena.lineas[Number(m![2])] ?? escena.linea) : escena.linea) : error.campo === "nombre" ? lineaNombre : 1, error.mensaje);
  }
  return { ok: false, errores };
}
