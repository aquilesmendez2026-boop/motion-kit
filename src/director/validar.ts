// El validador de la Partitura: lo que no calza con el modelo no vale, con un mensaje que dice dónde. No corrige nada.
import { CAMPOS, CURVAS, ESTADOS, NOMBRE_ACTOR, POR, PORCENTAJE, RESORTES, SENALES, SENALES_CONTINUAS, TOPES, TRAMOS, VERSION_PARTITURA, type Partitura, type Senal } from "./modelo";

export interface ErrorPartitura {
  campo: string;
  mensaje: string;
}
export type ResultadoPartitura = { ok: true; partitura: Partitura } | { ok: false; errores: ErrorPartitura[] };

const esObjeto = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const esNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const en = (lista: readonly string[], v: unknown): v is string => typeof v === "string" && lista.includes(v);

/** Hasta dónde puede llegar cada número de un cambio, según dónde va. */
type Limites = { px: number; porciento: number; escala: [number, number]; giro: number; opacidad: [number, number] };
const LIBRE: Limites = { px: TOPES.px, porciento: TOPES.porciento, escala: [0, TOPES.escala], giro: TOPES.giro, opacidad: [0, 1] };
const FINAL: Limites = { px: TOPES.final.px, porciento: TOPES.final.porciento, escala: [TOPES.final.escalaMin, TOPES.final.escalaMax], giro: TOPES.giro, opacidad: [TOPES.final.opacidadMin, 1] };
const DE_ESTADO: Limites = { px: TOPES.estado.px, porciento: 0, escala: [TOPES.estado.escalaMin, TOPES.estado.escalaMax], giro: TOPES.estado.giro, opacidad: [TOPES.estado.opacidadMin, 1] };
const DE_SEGUIR: Limites = { px: TOPES.seguir.px, porciento: 0, escala: [TOPES.seguir.escalaMin, TOPES.seguir.escalaMax], giro: TOPES.seguir.giro, opacidad: [0, 1] };

export function validarPartitura(x: unknown): ResultadoPartitura {
  const errores: ErrorPartitura[] = [];
  const mal = (campo: string, mensaje: string) => {
    // Una partitura enorme y rota no llena la memoria de mensajes.
    if (errores.length < 50) errores.push({ campo, mensaje });
  };
  if (!esObjeto(x)) return { ok: false, errores: [{ campo: "partitura", mensaje: "La partitura no es válida: tiene que ser un objeto." }] };

  const sobran = (o: Record<string, unknown>, campos: readonly string[], donde: string) => {
    for (const k of Object.keys(o)) if (!campos.includes(k)) mal(`${donde}.${k}`, "Este campo no existe en la partitura.");
  };
  /** Un número entre dos topes (o no viene). */
  const numero = (v: unknown, min: number, max: number, donde: string, que: string) => {
    if (v === undefined) return;
    if (!esNumero(v) || v < min || v > max) mal(donde, `${que} tiene que ser un número entre ${min} y ${max}.`);
  };
  const distancia = (v: unknown, l: Limites, donde: string) => {
    if (v === undefined) return;
    if (esNumero(v)) {
      if (Math.abs(v) > l.px) mal(donde, `En px, tiene que estar entre -${l.px} y ${l.px}.`);
    } else if (typeof v === "string" && l.porciento && PORCENTAJE.test(v)) {
      if (Math.abs(parseFloat(v)) > l.porciento) mal(donde, `En porcentaje, tiene que estar entre -${l.porciento}% y ${l.porciento}%.`);
    } else mal(donde, l.porciento ? "Tiene que ser un número (px) o un porcentaje como «-14%»." : "Tiene que ser un número (px).");
  };
  const cambio = (v: unknown, l: Limites, donde: string): boolean => {
    if (v === undefined) return false;
    if (!esObjeto(v)) {
      mal(donde, "Tiene que ser un objeto con x, y, escala, giro u opacidad.");
      return false;
    }
    sobran(v, CAMPOS.cambio, donde);
    distancia(v.x, l, `${donde}.x`);
    distancia(v.y, l, `${donde}.y`);
    numero(v.escala, l.escala[0], l.escala[1], `${donde}.escala`, "La escala");
    numero(v.giro, -l.giro, l.giro, `${donde}.giro`, "El giro");
    numero(v.opacidad, l.opacidad[0], l.opacidad[1], `${donde}.opacidad`, "La opacidad");
    if (!Object.keys(v).length) mal(donde, "No dice qué cambia.");
    return v.opacidad !== undefined;
  };
  const actor = (v: unknown, donde: string): string | null => {
    if (typeof v === "string" && NOMBRE_ACTOR.test(v)) return v;
    mal(donde, "El actor es el nombre de una parte: minúsculas, números y guiones (hasta 40).");
    return null;
  };

  sobran(x, CAMPOS.partitura, "partitura");
  if (x.version !== VERSION_PARTITURA) mal("version", `La versión de la partitura tiene que ser ${VERSION_PARTITURA}.`);
  if (x.nombre !== undefined && (typeof x.nombre !== "string" || x.nombre.length > TOPES.nombre)) mal("nombre", `El nombre es un texto de hasta ${TOPES.nombre} letras.`);
  if (!Array.isArray(x.escenas) || !x.escenas.length) {
    mal("escenas", "La partitura necesita al menos una escena.");
    return { ok: false, errores };
  }
  if (x.escenas.length > TOPES.escenas) mal("escenas", `Una partitura lleva a lo más ${TOPES.escenas} escenas.`);

  /** Qué escena continua mueve a cada actor, y qué escena es dueña de su opacidad. */
  const continua = new Map<string, number>();
  const opacidad = new Map<string, number>();
  /** Cómo se corta el texto de cada actor: una sola forma en toda la partitura. */
  const cortes = new Map<string, string>();
  const anotar = (mapa: Map<string, number>, nombre: string | null, escena: number, donde: string, mensaje: string) => {
    if (nombre === null) return;
    const antes = mapa.get(nombre);
    if (antes !== undefined && antes !== escena) mal(donde, mensaje);
    else mapa.set(nombre, escena);
  };

  x.escenas.slice(0, TOPES.escenas).forEach((e, i) => {
    const aqui = `escenas[${i}]`;
    if (!esObjeto(e) || !en(SENALES, e.con)) return mal(`${aqui}.con`, `Cada escena dice con qué se mueve: ${SENALES.join(", ")}.`);
    const con = e.con as Senal;
    sobran(e, CAMPOS.escena[con], aqui);
    if (con === "verse" && e.repetir !== undefined && typeof e.repetir !== "boolean") mal(`${aqui}.repetir`, "Es verdadero o falso.");
    if (con === "estado") {
      if (!en(ESTADOS, e.estado)) mal(`${aqui}.estado`, `El estado es uno de: ${ESTADOS.join(", ")}.`);
      if (e.sobre !== undefined) actor(e.sobre, `${aqui}.sobre`);
    }
    if (con === "vista" && e.tramo !== undefined && !en(TRAMOS, e.tramo)) mal(`${aqui}.tramo`, `El tramo es uno de: ${TRAMOS.join(", ")}.`);
    if (!Array.isArray(e.pasos) || !e.pasos.length) return mal(`${aqui}.pasos`, "La escena necesita al menos un paso.");
    if (e.pasos.length > TOPES.pasos) mal(`${aqui}.pasos`, `Una escena lleva a lo más ${TOPES.pasos} pasos.`);
    const esContinua = SENALES_CONTINUAS.includes(con);
    const vistos = new Set<string>();
    /** El turno del paso anterior, para saber cuánto dura la escena (con una pieza por paso, que es lo mínimo). */
    let anterior = { inicio: 0, fin: 0 };

    e.pasos.slice(0, TOPES.pasos).forEach((p, k) => {
      const paso = `${aqui}.pasos[${k}]`;
      if (!esObjeto(p)) return mal(paso, "Cada paso es un objeto con su actor.");
      sobran(p, CAMPOS.paso[con], paso);
      const nombre = actor(p.actor, `${paso}.actor`);
      let tocaOpacidad = false;

      if (con === "puntero" || con === "velocidad") {
        // Lo que cambia va directo en el paso: se revisa como un cambio, con los topes de lo que sigue.
        const loQueCambia = Object.fromEntries(CAMPOS.cambio.filter((c) => p[c] !== undefined).map((c) => [c, p[c]]));
        tocaOpacidad = cambio(loQueCambia, DE_SEGUIR, paso);
        if (p.resorte !== undefined && !en(RESORTES, p.resorte)) mal(`${paso}.resorte`, `El resorte es uno de: ${RESORTES.join(", ")}.`);
      } else if (con === "estado") {
        if (p.a === undefined) mal(`${paso}.a`, "Un paso de estado dice hacia dónde va («a»).");
        tocaOpacidad = cambio(p.a, DE_ESTADO, `${paso}.a`);
        numero(p.dura, 0, TOPES.estado.dura, `${paso}.dura`, "La duración (ms)");
        if (p.curva !== undefined && !en(CURVAS, p.curva)) mal(`${paso}.curva`, `La curva es una de: ${CURVAS.join(", ")}.`);
      } else {
        if (p.de === undefined && p.a === undefined) mal(paso, "El paso no dice desde dónde («de») ni hasta dónde («a»).");
        const deOpacidad = cambio(p.de, LIBRE, `${paso}.de`);
        // Lo que una entrada deja puesto no puede esconder ni sacar de su lugar; atado al scroll sí, porque vuelve.
        tocaOpacidad = cambio(p.a, con === "verse" ? FINAL : LIBRE, `${paso}.a`) || deOpacidad;
        if (p.por !== undefined && !en(POR, p.por)) mal(`${paso}.por`, `«por» es uno de: ${POR.join(", ")}.`);
        if (nombre !== null && (p.por === "palabra" || p.por === "letra")) {
          const forma = `${p.por}${p.mascara === true ? " con máscara" : ""}`;
          const antes = cortes.get(nombre);
          if (antes !== undefined && antes !== forma) mal(`${paso}.por`, `Este actor ya se corta por ${antes}: su texto se corta de una sola forma.`);
          else cortes.set(nombre, forma);
        }
        if (con === "verse") {
          if (p.mascara !== undefined && typeof p.mascara !== "boolean") mal(`${paso}.mascara`, "Es verdadero o falso.");
          if (p.mascara === true && p.por !== "palabra" && p.por !== "letra") mal(`${paso}.mascara`, "La máscara va solo con «por: palabra» o «por: letra».");
          if (p.curva !== undefined && !en(CURVAS, p.curva)) mal(`${paso}.curva`, `La curva es una de: ${CURVAS.join(", ")}.`);
          numero(p.dura, 0, TOPES.dura, `${paso}.dura`, "La duración (ms)");
          numero(p.cada, 0, TOPES.cada, `${paso}.cada`, "La espera entre piezas (ms)");
          const cuando = (["en", "luego", "junto"] as const).filter((c) => p[c] !== undefined);
          if (cuando.length > 1) mal(paso, "Un paso parte de una sola forma: «en», «luego» o «junto».");
          for (const c of cuando) numero(p[c], 0, TOPES.escena, `${paso}.${c}`, "El momento (ms)");
          // Cuánto dura la escena hasta aquí. Con más piezas dura más, y ahí el Director acorta las esperas.
          const ms = (v: unknown, siNo: number) => (esNumero(v) && v >= 0 ? v : siNo);
          const inicio = p.luego !== undefined ? anterior.fin + ms(p.luego, 0) : p.junto !== undefined ? anterior.inicio + ms(p.junto, 0) : ms(p.en, 0);
          anterior = { inicio, fin: inicio + ms(p.dura, 600) };
          // Solo si sus tiempos valen por separado (si no, ya se avisó de eso).
          const enRango = (v: unknown, max: number) => v === undefined || (esNumero(v) && v >= 0 && v <= max);
          if (anterior.fin > TOPES.escena && enRango(p.dura, TOPES.dura) && cuando.every((c) => enRango(p[c], TOPES.escena))) mal(paso, `Con este paso la escena dura más de ${TOPES.escena / 1000} segundos.`);
        } else {
          if (p.curva !== undefined && (!en(CURVAS, p.curva) || p.curva === "resorte")) mal(`${paso}.curva`, "Atada al scroll, la curva es una de: suave, lineal, entra, sale, vaiven.");
          if (p.entre !== undefined) {
            const t = p.entre;
            if (!Array.isArray(t) || t.length !== 2 || !esNumero(t[0]) || !esNumero(t[1]) || t[0] < 0 || t[1] > 1 || t[0] >= t[1]) mal(`${paso}.entre`, "«entre» son dos números de 0 a 1, el primero menor que el segundo.");
          }
        }
      }

      if (esContinua && nombre !== null) {
        if (vistos.has(nombre)) mal(`${paso}.actor`, "Este actor ya tiene un paso en esta escena: aquí va uno solo por actor.");
        vistos.add(nombre);
        anotar(continua, nombre, i, `${paso}.actor`, "Este actor ya sigue a otra señal. Un actor sigue a una sola (vista, scroll, puntero, velocidad o estado); para sumar, usa un actor dentro de otro.");
      }
      if (tocaOpacidad) anotar(opacidad, nombre, i, paso, "Otra escena ya cambia la opacidad de este actor: la opacidad de un actor es de una sola escena.");
    });
  });

  return errores.length ? { ok: false, errores } : { ok: true, partitura: x as unknown as Partitura };
}
