// El lenguaje en español de las partituras: leer el texto, escribirlo y la ida y vuelta.
import { test } from "node:test";
import assert from "node:assert/strict";
import { leerPartitura } from "../src/partitura/leer";
import { escribirPartitura } from "../src/partitura/escribir";
import { validarPartitura } from "../src/director/validar";
import { PARTITURAS } from "../src/director/partituras";
import { semilla } from "../src/efectos/semilla";
import type { Cambio, Escena, Partitura } from "../src/director/modelo";

/** Lee un texto que tiene que valer y devuelve su partitura. */
const leer = (texto: string): Partitura => {
  const r = leerPartitura(texto);
  assert.ok(r.ok, r.ok ? "" : r.errores.map((e) => `línea ${e.linea}: ${e.mensaje}`).join(" | "));
  return r.ok ? r.partitura : (null as never);
};
/** Los errores de un texto que no vale, como «línea: mensaje». */
const errores = (texto: string): string[] => {
  const r = leerPartitura(texto);
  return r.ok ? [] : r.errores.map((e) => `${e.linea}: ${e.mensaje}`);
};
/** El primer paso de la primera escena de un texto de una sola línea de paso. */
const paso = (escena: string, linea: string) => leer(`${escena}\n  ${linea}`).escenas[0].pasos[0] as Record<string, unknown>;

const DEL_DISENO = `
partitura portada

al verse:
  antetitulo  desde abajo 28px, aparece, 800ms, en 50ms
  titulo      desde abajo 135%, por palabra, con máscara, 800ms, cada 90ms, en 150ms
  bajada      desde abajo 28px, aparece, 800ms, en 550ms
  botones     desde abajo 28px, aparece, por hijo, 700ms, cada 90ms, en 850ms

al salir de la vista:
  contenido   sube 14%, se apaga

con el puntero:
  tarjeta     se inclina 6 grados, resorte firme

al apuntar boton:
  cara        sube 3px, crece a 1.05
`;

test("el ejemplo del diseño se lee campo por campo", () => {
  assert.deepEqual(leer(DEL_DISENO), {
    version: 1,
    nombre: "portada",
    escenas: [
      {
        con: "verse",
        pasos: [
          { actor: "antetitulo", de: { y: 28, opacidad: 0 }, dura: 800, en: 50 },
          { actor: "titulo", de: { y: "135%" }, por: "palabra", mascara: true, dura: 800, cada: 90, en: 150 },
          { actor: "bajada", de: { y: 28, opacidad: 0 }, dura: 800, en: 550 },
          { actor: "botones", de: { y: 28, opacidad: 0 }, por: "hijo", dura: 700, cada: 90, en: 850 },
        ],
      },
      { con: "vista", tramo: "salida", pasos: [{ actor: "contenido", a: { y: "-14%", opacidad: 0 } }] },
      { con: "puntero", pasos: [{ actor: "tarjeta", a: { inclinaX: 6, inclinaY: 6 }, resorte: "firme" }] },
      { con: "estado", estado: "apuntado", sobre: "boton", pasos: [{ actor: "cara", a: { y: -3, escala: 1.05 } }] },
    ],
  });
});

test("las escenas: cada encabezado es una señal", () => {
  const con = (encabezado: string, linea = "foto desde abajo 10px") => {
    const { pasos: _pasos, ...resto } = leer(`${encabezado}\n  ${linea}`).escenas[0] as Escena & Record<string, unknown>;
    return resto;
  };
  assert.deepEqual(con("al verse:"), { con: "verse" });
  assert.deepEqual(con("cada vez que se ve:"), { con: "verse", repetir: true });
  assert.deepEqual(con("al entrar a la vista:"), { con: "vista", tramo: "entrada" });
  assert.deepEqual(con("al salir de la vista:"), { con: "vista", tramo: "salida" });
  assert.deepEqual(con("al cruzar la pantalla:"), { con: "vista", tramo: "paso" });
  assert.deepEqual(con("con la vista:"), { con: "vista" });
  assert.deepEqual(con("con el scroll:"), { con: "scroll" });
  assert.deepEqual(con("con el puntero:", "foto baja 10px"), { con: "puntero" });
  assert.deepEqual(con("con la velocidad:", "foto gira 4 grados"), { con: "velocidad" });
  assert.deepEqual(con("al apuntar tarjeta:", "foto crece a 1.04"), { con: "estado", estado: "apuntado", sobre: "tarjeta" });
  assert.deepEqual(con("al enfocar:", "foto crece a 1.04"), { con: "estado", estado: "enfocado" });
  assert.deepEqual(con("al apretar boton:", "foto se achica a 0.96"), { con: "estado", estado: "apretado", sobre: "boton" });
});

test("las frases: de dónde parte, con su signo", () => {
  const de = (frase: string) => paso("al verse:", `foto ${frase}`).de;
  assert.deepEqual(de("desde abajo 28px"), { y: 28 });
  assert.deepEqual(de("desde arriba 28px"), { y: -28 });
  assert.deepEqual(de("desde la izquierda 40px"), { x: -40 });
  assert.deepEqual(de("desde la derecha 12.5%"), { x: "12.5%" });
  assert.deepEqual(de("desde arriba 120%"), { y: "-120%" });
  assert.deepEqual(de("desde abajo 28"), { y: 28 }, "sin unidad son px");
  assert.deepEqual(de("aparece"), { opacidad: 0 });
  assert.deepEqual(de("aparece desde 0.15"), { opacidad: 0.15 });
  assert.deepEqual(de("crece desde 0.8"), { escala: 0.8 });
  assert.deepEqual(de("gira desde -8 grados"), { giro: -8 });
  assert.deepEqual(de("se levanta desde -70 grados"), { inclinaX: -70 });
  assert.deepEqual(de("se abre desde 60 grados"), { inclinaY: 60 });
  assert.deepEqual(de("desde abajo 20px, desde la derecha 10px, aparece, crece desde 0.9"), { y: 20, x: 10, opacidad: 0, escala: 0.9 });
});

test("las frases: a dónde llega, con su signo", () => {
  const a = (frase: string, escena = "al cruzar la pantalla:") => paso(escena, `foto ${frase}`).a;
  assert.deepEqual(a("sube 14%"), { y: "-14%" });
  assert.deepEqual(a("baja 20px"), { y: 20 });
  assert.deepEqual(a("va a la izquierda 30px"), { x: -30 });
  assert.deepEqual(a("va a la derecha 30px"), { x: 30 });
  assert.deepEqual(a("se apaga"), { opacidad: 0 });
  assert.deepEqual(a("se apaga a 0.6"), { opacidad: 0.6 });
  assert.deepEqual(a("se enciende"), { opacidad: 1 });
  assert.deepEqual(a("crece a 1.05"), { escala: 1.05 });
  assert.deepEqual(a("se achica a 0.95"), { escala: 0.95 });
  assert.deepEqual(a("gira 6 grados"), { giro: 6 });
  assert.deepEqual(a("gira -6 grados"), { giro: -6 });
  assert.deepEqual(a("se inclina 6 grados"), { inclinaX: 6, inclinaY: 6 });
  assert.deepEqual(a("se vuelca 6 grados"), { inclinaX: 6 });
  assert.deepEqual(a("se ladea -8 grados"), { inclinaY: -8 });
  assert.deepEqual(a("gira 1 grado"), { giro: 1 }, "en singular también");
});

test("las frases: cómo y cuándo", () => {
  const p = (frases: string, escena = "al verse:") => {
    const { actor: _actor, de: _de, ...resto } = paso(escena, `foto desde abajo 10px, ${frases}`);
    return resto;
  };
  assert.deepEqual(p("por letra"), { por: "letra" });
  assert.deepEqual(p("por palabra, con máscara"), { por: "palabra", mascara: true });
  assert.deepEqual(p("por hijo"), { por: "hijo" });
  assert.deepEqual(p("800ms"), { dura: 800 });
  assert.deepEqual(p("1.2s"), { dura: 1200 });
  assert.deepEqual(p("cada 90ms"), { cada: 90 });
  assert.deepEqual(p("en 150ms"), { en: 150 });
  assert.deepEqual(p("luego"), { luego: 0 });
  assert.deepEqual(p("luego 100ms"), { luego: 100 });
  assert.deepEqual(p("junto"), { junto: 0 });
  assert.deepEqual(p("junto 80ms"), { junto: 80 });
  assert.deepEqual(p("curva resorte"), { curva: "resorte" });
  assert.deepEqual(p("curva vaivén"), { curva: "vaiven" });
  assert.deepEqual(p("entre 60% y 100%", "con el scroll:"), { entre: [0.6, 1] });
  assert.deepEqual(p("por palabra, reparto 30%", "al cruzar la pantalla:"), { por: "palabra", reparto: 0.3 });
  assert.equal(paso("con el puntero:", "foto baja 10px, resorte elástico").resorte, "elastico");
});

test("se escribe con o sin tildes, con mayúsculas, con comentarios y con líneas en blanco", () => {
  const limpio = leer("al verse:\n  titulo desde abajo 20px, por palabra, con máscara, curva vaivén");
  const sucio = leer("# la portada\n\nAL VERSE:   # entra al verse\n\n\tTitulo   DESDE ABAJO 20PX ,  por palabra,con mascara , curva vaiven   # el título\n\n");
  assert.deepEqual(sucio, limpio);
  // El nombre va tal cual (con sus mayúsculas, y aunque tenga un «#»).
  assert.equal(leer("partitura Oferta #1 de Café\nal verse:\n  foto aparece").nombre, "Oferta #1 de Café");
  // Un actor puede llamarse como una palabra del lenguaje: va primero en la línea.
  assert.deepEqual(leer("al apuntar luego:\n  entre crece a 1.04").escenas[0], { con: "estado", estado: "apuntado", sobre: "luego", pasos: [{ actor: "entre", a: { escala: 1.04 } }] });
});

test("lo que no se entiende se explica, con su línea, y se juntan todos los errores", () => {
  // Frase que no existe.
  assert.match(errores("al verse:\n  foto vuela alto")[0], /^2: .*«vuela alto»/);
  // Coma decimal.
  assert.match(errores("al verse:\n  foto crece desde 0,8")[0], /^2: .*punto para los decimales/);
  // Frase fuera de su escena.
  assert.match(errores("con el puntero:\n  foto baja 10px, cada 90ms")[0], /^2: .*«cada».*con el puntero/);
  assert.match(errores("con el puntero:\n  foto desde abajo 10px")[0], /^2: /);
  assert.match(errores("al verse:\n  foto desde abajo 10px, resorte firme")[0], /^2: .*resorte/);
  assert.match(errores("con el scroll:\n  foto sube 10px, curva resorte")[0], /^2: /);
  // «resorte» solo, o un resorte que no existe.
  assert.match(errores("con el puntero:\n  foto baja 10px, resorte")[0], /^2: .*suave, firme, elastico/);
  // Frase repetida.
  assert.match(errores("al verse:\n  foto desde abajo 10px, desde arriba 20px")[0], /^2: .*dos veces/);
  assert.match(errores("al verse:\n  foto aparece, 800ms, 600ms")[0], /^2: .*dos veces/);
  // Número fuera de tope: lo dice el validador, con la línea del paso.
  assert.match(errores("al verse:\n  foto aparece\n  hoja se levanta desde 120 grados")[0], /^3: .*inclina/i);
  // Un paso sin escena, una escena que no existe, una escena sin pasos, un texto vacío.
  assert.match(errores("  foto aparece")[0], /^1: .*escena/);
  assert.match(errores("al amanecer:\n  foto aparece")[0], /^1: .*al verse/);
  assert.match(errores("al verse:")[0], /escena/);
  assert.match(errores("")[0], /escena/);
  assert.match(errores("# solo un comentario")[0], /escena/);
  // Un paso sin frases, y un actor mal escrito.
  assert.match(errores("al verse:\n  foto")[0], /^2: /);
  assert.match(errores("al verse:\n  Mi_Foto aparece")[0], /^2: .*actor/i);
  // Todos los errores juntos, cada uno con su línea.
  const varios = errores("al verse:\n  foto vuela\n  titulo desde abajo 10px\n  bajada crece desde 0,8\ncon la luna:\n  foto aparece");
  assert.deepEqual(varios.map((e) => e.split(":")[0]), ["2", "4", "5"]);
});

test("texto hostil: no lanza, tarda poco y devuelve a lo más 20 errores", () => {
  const hostiles = [
    Array.from({ length: 5000 }, (_, i) => `  foto${i} hace algo raro`).join("\n"),
    "al verse:\n" + Array.from({ length: 5000 }, () => "  foto aparece").join("\n"),
    "al verse:\n  foto " + "desde abajo 10px, ".repeat(20000),
    "al verse:\n  " + "x".repeat(200000),
    "\t\t\t\u0000​﻿ al verse:\r\n\tfoto\taparece\r\n",
    "al verse:\n  foto desde abajo 1e999px",
    "al verse:\n  foto desde abajo NaNpx, 9999999999999999999999ms",
    "🙂:\n  🙂 🙂",
    "al apuntar " + "a".repeat(5000) + ":\n  foto crece a 1.04",
    String(Symbol.iterator),
  ];
  for (const t of hostiles) {
    const inicio = performance.now();
    let r: ReturnType<typeof leerPartitura> | undefined;
    assert.doesNotThrow(() => (r = leerPartitura(t)));
    assert.ok(performance.now() - inicio < 1500, `tardó ${Math.round(performance.now() - inicio)} ms`);
    if (r && !r.ok) assert.ok(r.errores.length >= 1 && r.errores.length <= 20 && r.errores.every((e) => Number.isInteger(e.linea) && e.linea >= 1 && e.mensaje.length < 400));
  }
  for (const x of [null, undefined, 7, {}, []]) assert.doesNotThrow(() => leerPartitura(x as unknown as string));
  assert.equal(leerPartitura(null as unknown as string).ok, false);
});

test("escribir: la forma canónica de la portada", () => {
  assert.equal(
    escribirPartitura(PARTITURAS.portada),
    [
      "partitura portada",
      "",
      "al verse:",
      "  antetitulo desde abajo 28px, aparece, 800ms, en 50ms",
      "  titulo desde abajo 135%, por palabra, con máscara, 800ms, cada 90ms, en 150ms",
      "  bajada desde abajo 28px, aparece, 800ms, en 550ms",
      "  botones desde abajo 28px, aparece, por hijo, 700ms, cada 90ms, en 850ms",
      "",
      "al salir de la vista:",
      "  contenido sube 14%, se apaga",
      "",
    ].join("\n"),
  );
});

test("ida y vuelta: leer lo escrito da la misma partitura (los seis ejemplos y los valores de borde)", () => {
  for (const [nombre, p] of Object.entries(PARTITURAS as Record<string, Partitura>)) assert.deepEqual(leer(escribirPartitura(p)), p, nombre);
  const bordes: Partitura = {
    version: 1,
    nombre: "Bordes: ceros, negativos y topes #2",
    escenas: [
      {
        con: "verse",
        repetir: true,
        pasos: [
          { actor: "luego", de: { x: 0, y: 0, escala: 0, giro: 0, inclinaX: 0, inclinaY: 0, opacidad: 0 }, a: { x: 0, y: 0, escala: 1, giro: 0, opacidad: 1 }, dura: 0, cada: 0, en: 0 },
          { actor: "junto", de: { x: -2000, y: "-300%", giro: -720, inclinaX: -90, inclinaY: 90 }, a: { x: 200, y: "100%", escala: 2, inclinaX: 15, inclinaY: -15, opacidad: 0.5 }, por: "letra", mascara: true, dura: 10000, cada: 1000, curva: "resorte", luego: 0 },
          { actor: "entre", de: { x: "12.5%", opacidad: 0.333 }, junto: 250, curva: "lineal" },
        ],
      },
      { con: "vista", pasos: [{ actor: "cada", por: "palabra", de: { opacidad: 0.15, inclinaX: 80 }, a: { opacidad: 1, inclinaX: 0 }, entre: [0, 1], reparto: 0.05, curva: "vaiven" }] },
      { con: "scroll", pasos: [{ actor: "por", a: { escala: 4, giro: 720 }, entre: [0.25, 0.6], reparto: 1 }] },
      { con: "puntero", pasos: [{ actor: "resorte", a: { x: -200, y: 200, inclinaX: 25, inclinaY: -25, escala: 0.5, opacidad: 0 }, resorte: "elastico" }, { actor: "curva", a: { giro: -45 } }] },
      { con: "velocidad", pasos: [{ actor: "desde", a: { inclinaX: 7, inclinaY: 7 }, resorte: "suave" }] },
      { con: "estado", estado: "apretado", pasos: [{ actor: "aparece", a: { x: -6, y: 6, escala: 0.94, opacidad: 0.5 }, dura: 1000, curva: "sale" }] },
      { con: "estado", estado: "enfocado", sobre: "al", pasos: [{ actor: "sube", a: { inclinaX: -4, inclinaY: 4 } }] },
    ],
  };
  assert.ok(validarPartitura(bordes).ok, JSON.stringify(validarPartitura(bordes)));
  assert.deepEqual(leer(escribirPartitura(bordes)), bordes);
});

/** Una partitura válida armada con una semilla: pasa por todas las señales y por casi todas las frases. */
function alAzar(s: number): Partitura {
  let k = 0;
  const r = () => semilla(k++, s);
  const elige = <T>(lista: readonly T[]): T => lista[Math.floor(r() * lista.length)];
  const num = (min: number, max: number, paso = 1) => Math.round((min + r() * (max - min)) / paso) * paso;
  const si = () => r() < 0.5;
  const dist = (max: number) => (si() ? num(-max, max) : `${num(-100, 100)}%`);
  const cambio = (limites: { px: number; giro: number; inclina: number; escala: [number, number]; opacidad: [number, number]; porciento: boolean }, continuo: boolean): Cambio => {
    const c: Cambio = {};
    if (si()) c.x = limites.porciento ? dist(limites.px) : num(-limites.px, limites.px);
    if (si()) c.y = limites.porciento ? dist(limites.px) : num(-limites.px, limites.px);
    if (si()) c.escala = num(limites.escala[0], limites.escala[1], 0.01);
    const gira = si();
    if (gira) c.giro = num(-limites.giro, limites.giro);
    if (!(continuo && gira)) {
      if (si()) c.inclinaX = num(-limites.inclina, limites.inclina);
      if (si()) c.inclinaY = num(-limites.inclina, limites.inclina);
    }
    if (si()) c.opacidad = num(limites.opacidad[0], limites.opacidad[1], 0.05);
    if (!Object.keys(c).length) c.y = num(-limites.px, limites.px);
    // Sin ruido de decimales (0.30000000000000004).
    for (const [campo, v] of Object.entries(c)) if (typeof v === "number") (c as Record<string, unknown>)[campo] = Math.round(v * 1000) / 1000;
    return c;
  };
  const libre = { px: 200, giro: 90, inclina: 90, escala: [0, 4] as [number, number], opacidad: [0, 1] as [number, number], porciento: true };
  const final = { px: 200, giro: 90, inclina: 15, escala: [0.5, 2] as [number, number], opacidad: [0.5, 1] as [number, number], porciento: true };
  const seguir = { px: 200, giro: 45, inclina: 25, escala: [0.5, 2] as [number, number], opacidad: [0, 1] as [number, number], porciento: false };
  const estado = { px: 6, giro: 3, inclina: 4, escala: [0.94, 1.08] as [number, number], opacidad: [0.5, 1] as [number, number], porciento: false };
  const escenas: Escena[] = [];
  // Una escena por tiempo (sin opacidad, para no chocar con las otras) y una de cada señal continua, con actores propios.
  const sinOpacidad = (c: Cambio): Cambio => {
    const { opacidad: _o, ...resto } = c;
    return Object.keys(resto).length ? resto : { y: 10 };
  };
  escenas.push({
    con: "verse",
    ...(si() ? { repetir: true } : {}),
    pasos: Array.from({ length: num(1, 3) }, (_, i) => ({
      actor: `tiempo-${i}`,
      ...(si() ? { de: sinOpacidad(cambio(libre, false)) } : {}),
      a: sinOpacidad(cambio(final, false)),
      ...(si() ? { por: elige(["hijo"] as const) } : {}),
      ...(si() ? { dura: num(0, 3000, 10) } : {}),
      ...(si() ? { cada: num(0, 300, 10) } : {}),
      ...(si() ? { curva: elige(["suave", "lineal", "entra", "sale", "vaiven", "resorte"] as const) } : {}),
      ...(i === 0 ? (si() ? { en: num(0, 500, 10) } : {}) : si() ? { luego: num(0, 300, 10) } : { junto: num(0, 300, 10) }),
    })),
  });
  const tramo = elige(["entrada", "salida", "paso", undefined] as const);
  // En lo continuo un paso gira o se inclina: si «de» gira, «a» no se inclina (y al revés).
  const deVista = sinOpacidad(cambio(libre, true));
  const aVista = (() => {
    const { giro, inclinaX, inclinaY, ...resto } = sinOpacidad(cambio(libre, true)) as Cambio;
    const c: Cambio = { ...resto, ...(deVista.giro !== undefined ? {} : { ...(inclinaX !== undefined ? { inclinaX } : {}), ...(inclinaY !== undefined ? { inclinaY } : {}) }), ...(deVista.inclinaX !== undefined || deVista.inclinaY !== undefined || inclinaX !== undefined || inclinaY !== undefined ? {} : giro !== undefined ? { giro } : {}) };
    return Object.keys(c).length ? c : { y: 10 };
  })();
  escenas.push({ con: "vista", ...(tramo ? { tramo } : {}), pasos: [{ actor: "vista-0", de: deVista, ...(si() ? { a: aVista } : {}), ...(si() ? { por: elige(["hijo", "palabra", "letra"] as const), reparto: num(0.05, 1, 0.05) } : {}), ...(si() ? { entre: [num(0, 0.4, 0.05), num(0.5, 1, 0.05)] as [number, number] } : {}), ...(si() ? { curva: elige(["suave", "lineal", "entra", "sale", "vaiven"] as const) } : {}) }] });
  escenas.push({ con: "scroll", pasos: [{ actor: "scroll-0", a: sinOpacidad(cambio(libre, true)) }] });
  escenas.push({ con: "puntero", pasos: [{ actor: "puntero-0", a: sinOpacidad(cambio(seguir, true)), ...(si() ? { resorte: elige(["suave", "firme", "elastico"] as const) } : {}) }] });
  escenas.push({ con: "velocidad", pasos: [{ actor: "velocidad-0", a: sinOpacidad(cambio(seguir, true)) }] });
  escenas.push({ con: "estado", estado: elige(["apuntado", "enfocado", "apretado"] as const), ...(si() ? { sobre: "zona" } : {}), pasos: [{ actor: "estado-0", a: cambio(estado, true), ...(si() ? { dura: num(0, 1000, 10) } : {}), ...(si() ? { curva: elige(["suave", "resorte"] as const) } : {}) }] });
  // Lo que sale de multiplicar pasos queda sin ruido de decimales.
  return JSON.parse(JSON.stringify({ version: 1, ...(si() ? { nombre: `azar ${s}` } : {}), escenas }), (_campo, v) => (typeof v === "number" ? Math.round(v * 1000) / 1000 : v)) as Partitura;
}

test("ida y vuelta: 200 partituras armadas con semilla", () => {
  for (let s = 1; s <= 200; s++) {
    const p = alAzar(s);
    const v = validarPartitura(p);
    assert.ok(v.ok, `semilla ${s}: la partitura de prueba no vale: ${JSON.stringify(v)}`);
    const texto = escribirPartitura(p);
    const r = leerPartitura(texto);
    assert.ok(r.ok, `semilla ${s}: no se pudo leer lo escrito:\n${texto}\n${JSON.stringify(r)}`);
    assert.deepEqual(r.ok && r.partitura, p, `semilla ${s}:\n${texto}`);
    // Y escribir de nuevo da el mismo texto.
    assert.equal(r.ok && escribirPartitura(r.partitura), texto);
  }
});

// --- Lo que encontró la revisión final ---

test("texto hostil: separadores de línea raros (U+2028, U+2029) no lo vuelven lento, y cortan la línea", () => {
  for (const raro of ["\u2028", "\u2029"]) {
    const t0 = performance.now();
    const r = leerPartitura(`al verse:\n  foto aparece ${"#".repeat(120_000)}${raro}`);
    const ms = performance.now() - t0;
    assert.ok(ms < 300, `tardó ${Math.round(ms)} ms`);
    assert.ok(r.ok, "el comentario se quita entero");
    // Lo que viene después del separador es otra línea: el comentario no se la come ni la deja pegada.
    assert.deepEqual(leer(`al salir de la vista:\n  foto se apaga # hola${raro}  caja sube 10px`).escenas[0].pasos, [{ actor: "foto", a: { opacidad: 0 } }, { actor: "caja", a: { y: -10 } }]);
  }
});

test("los porcentajes se leen sin ruido de decimales", () => {
  assert.deepEqual(paso("con el scroll:", "foto sube 10px, entre 10.1% y 70.7%, reparto 33.3%"), { actor: "foto", a: { y: -10 }, entre: [0.101, 0.707], reparto: 0.333 });
});

test("un nombre muy largo se avisa en la línea donde está", () => {
  assert.deepEqual(errores(`# una nota\n\npartitura ${"x".repeat(80)}\nal verse:\n  foto aparece`).map((e) => e.split(":")[0]), ["3"]);
});

test("una escena sin los dos puntos se entiende igual", () => {
  const sin = leer("al verse\n  foto aparece\ncada vez que se ve\n  caja aparece\nal apuntar boton\n  boton sube 3px");
  const con = leer("al verse:\n  foto aparece\ncada vez que se ve:\n  caja aparece\nal apuntar boton:\n  boton sube 3px");
  assert.deepEqual(sin, con);
  // Un actor que se llama como el comienzo de una escena sigue siendo un actor.
  assert.deepEqual(paso("al verse:", "al aparece"), { actor: "al", de: { opacidad: 0 } });
});

test("una frase que no va en la escena se nombra entera", () => {
  const de = (escena: string, linea: string) => errores(`${escena}\n  ${linea}`)[0];
  assert.match(de("con el scroll:", "foto sube 10px, con máscara"), /«con mascara» no va/);
  assert.match(de("con el scroll:", "foto sube 10px, cada 90ms"), /«cada» no va/);
  assert.match(de("con el puntero:", "foto se inclina 6 grados, por letra"), /«por letra» no va/);
  assert.match(de("al verse:", "foto aparece, entre 10% y 20%"), /«entre» no va/);
  assert.match(de("al verse:", "foto aparece, resorte firme"), /«resorte firme» no va/);
  assert.match(de("con el puntero:", "foto se levanta desde -20 grados"), /«se levanta» no va/);
  assert.match(de("con el puntero:", "foto aparece desde 0.2"), /«aparece» no va/);
});

test("el nombre de un actor no se cambia en silencio: con tilde o «ñ» no vale, y se dice", () => {
  assert.match(errores("al verse:\n  Título aparece")[0], /^2: «título» no sirve como actor/);
  assert.match(errores("al verse:\n  pequeño aparece")[0], /^2: «pequeño» no sirve como actor/);
  assert.match(errores("al apuntar Botón:\n  boton sube 3px")[0], /^1: .*actor/);
  // Las mayúsculas dan igual en todo el texto, también en un nombre.
  assert.deepEqual(leer("al apuntar Boton:\n  Boton sube 3px").escenas[0], { con: "estado", estado: "apuntado", sobre: "boton", pasos: [{ actor: "boton", a: { y: -3 } }] });
  // Las frases sí van con o sin tildes y mayúsculas.
  assert.deepEqual(paso("AL VERSE:", "titulo APARECE, Con Máscara, por palabra"), { actor: "titulo", de: { opacidad: 0 }, mascara: true, por: "palabra" });
});

test("escribir exige una partitura que vale: con otra cosa lanza un error que lo dice", () => {
  assert.throws(() => escribirPartitura({ version: 1, escenas: [{ con: "luna", pasos: [] }] } as never), /escribirPartitura: .*no vale/);
  assert.throws(() => escribirPartitura({ version: 0, escenas: [{ con: "puntero", pasos: [{ actor: "a", x: 3 }] }] } as never), /no vale/);
  assert.throws(() => escribirPartitura(null as never), /no vale/);
});

test("ida y vuelta: lo que da igual vuelve en su forma canónica, y de ahí en adelante no cambia", () => {
  const rara = {
    version: 1,
    nombre: "  mi   portada ",
    escenas: [
      { con: "verse", repetir: false, pasos: [{ actor: "titulo", por: "palabra", mascara: false, de: { y: "12.50%", x: "-0%", opacidad: 0.12345 } }] },
      { con: "scroll", pasos: [{ actor: "foto", a: { y: "007%" }, entre: [0.1, 0.7] }] },
    ],
  } as unknown as Partitura;
  const texto = escribirPartitura(rara);
  const leida = leer(texto);
  assert.deepEqual(leida, {
    version: 1,
    nombre: "mi portada",
    escenas: [
      { con: "verse", pasos: [{ actor: "titulo", de: { y: "12.5%", x: "0%", opacidad: 0.123 }, por: "palabra" }] },
      { con: "scroll", pasos: [{ actor: "foto", a: { y: "7%" }, entre: [0.1, 0.7] }] },
    ],
  });
  assert.equal(escribirPartitura(leida), texto, "escribir lo leído da el mismo texto");
});
