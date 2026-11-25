// Director, fase 2: el modelo versión 1 (inclinación, `a` en lo que sigue, reparto), la subida desde la versión 0 y el contrato.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROFUNDIDAD, TOPES, VERSION_PARTITURA, type Partitura } from "../src/director/modelo";
import { validarPartitura } from "../src/director/validar";
import { subirPartitura } from "../src/director/subir";
import { contratoPartitura } from "../src/director/contrato-partitura";
import { PARTITURAS } from "../src/director/partituras";

/** Una partitura versión 1 con una sola escena. */
const con = (escena: Record<string, unknown>): unknown => ({ version: 1, escenas: [escena] });
const vale = (x: unknown) => validarPartitura(x).ok;
/** Los mensajes de error de una partitura, juntos (vacío si vale). */
const errores = (x: unknown) => {
  const r = validarPartitura(x);
  return r.ok ? "" : r.errores.map((e) => `${e.campo}: ${e.mensaje}`).join(" | ");
};

test("versión 1: es la única que corre el Director", () => {
  assert.equal(VERSION_PARTITURA, 1);
  const r = validarPartitura(con({ con: "verse", pasos: [{ actor: "titulo", de: { y: 20 } }] }));
  assert.ok(r.ok && r.partitura.version === 1);
  assert.ok(!vale({ version: 2, escenas: [{ con: "verse", pasos: [{ actor: "titulo", de: { y: 20 } }] }] }), "una versión que no existe no vale");
  assert.match(errores({ version: 2, escenas: [{ con: "verse", pasos: [{ actor: "a", de: { y: 1 } }] }] }), /versión/i);
});

test("versión 0: una partitura guardada antes se sube con subirPartitura y sigue valiendo", () => {
  const vieja = { version: 0, nombre: "iman", escenas: [{ con: "puntero", pasos: [{ actor: "tarjeta", x: 16, y: 12, giro: 2, resorte: "elastico" }, { actor: "brillo", x: -40, opacidad: 0.4 }] }] };
  // El Director no la sube solo (eso no viaja a las páginas): dice cómo.
  assert.match(errores(vieja), /subirPartitura/);
  const r = validarPartitura(subirPartitura(vieja));
  assert.ok(r.ok, errores(subirPartitura(vieja)));
  assert.deepEqual(r.ok && r.partitura, {
    version: 1,
    nombre: "iman",
    escenas: [{ con: "puntero", pasos: [{ actor: "tarjeta", a: { x: 16, y: 12, giro: 2 }, resorte: "elastico" }, { actor: "brillo", a: { x: -40, opacidad: 0.4 } }] }],
  });
  // No toca el dato que le pasaron.
  assert.equal(vieja.version, 0);
  assert.ok("x" in vieja.escenas[0].pasos[0]);
  // Lo que no es de seguir pasa igual.
  const verse = { version: 0, escenas: [{ con: "verse", pasos: [{ actor: "titulo", por: "palabra", mascara: true, de: { y: "135%" }, dura: 800, cada: 90, en: 150 }] }] };
  assert.deepEqual(subirPartitura(verse), { ...verse, version: 1 });
  // Una versión 1 no se toca.
  const nueva = con({ con: "puntero", pasos: [{ actor: "tarjeta", a: { x: 4 } }] });
  assert.equal(subirPartitura(nueva), nueva);
});

test("versión 0 mal formada: se rechaza con mensaje y nada lanza", () => {
  for (const basura of [null, undefined, 7, "x", [], { version: 0 }, { version: 0, escenas: "no" }, { version: 0, escenas: [null, 5, { con: "puntero" }, { con: "puntero", pasos: "x" }, { con: "puntero", pasos: [null, 3] }] }]) {
    assert.doesNotThrow(() => subirPartitura(basura));
    assert.doesNotThrow(() => validarPartitura(subirPartitura(basura)));
    assert.ok(!vale(subirPartitura(basura)), JSON.stringify(basura));
  }
  // Campos de más en un paso de la versión 0: no desaparecen al subir, se rechazan.
  assert.match(errores(subirPartitura({ version: 0, escenas: [{ con: "puntero", pasos: [{ actor: "tarjeta", x: 4, zoom: 9 }] }] })), /zoom/);
  // En la versión 1 lo que sigue va en «a»: los campos sueltos de la versión 0 ya no valen.
  assert.ok(!vale(con({ con: "puntero", pasos: [{ actor: "tarjeta", x: 4 }] })));
});

test("inclinación: dos campos nuevos en un cambio, con sus topes según dónde van", () => {
  assert.equal(PROFUNDIDAD, 900);
  assert.equal(TOPES.inclina, 90);
  // De partida en una entrada: hasta 90°.
  assert.ok(vale(con({ con: "verse", pasos: [{ actor: "hoja", de: { inclinaX: -90, opacidad: 0 } }] })));
  assert.ok(!vale(con({ con: "verse", pasos: [{ actor: "hoja", de: { inclinaX: -91 } }] })));
  // Lo que una entrada deja puesto se tiene que poder leer: hasta 15°.
  assert.ok(vale(con({ con: "verse", pasos: [{ actor: "hoja", a: { inclinaY: 15 } }] })));
  assert.match(errores(con({ con: "verse", pasos: [{ actor: "hoja", a: { inclinaY: 16 } }] })), /inclina/i);
  // Siguiendo al puntero: hasta 25°.
  assert.ok(vale(con({ con: "puntero", pasos: [{ actor: "tarjeta", a: { inclinaX: 25, inclinaY: -25 } }] })));
  assert.ok(!vale(con({ con: "puntero", pasos: [{ actor: "tarjeta", a: { inclinaX: 26 } }] })));
  // En un estado (lo que se aprieta no se escapa del cursor): hasta 4°.
  assert.ok(vale(con({ con: "estado", estado: "apuntado", pasos: [{ actor: "boton", a: { inclinaX: 4 } }] })));
  assert.ok(!vale(con({ con: "estado", estado: "apuntado", pasos: [{ actor: "boton", a: { inclinaX: 5 } }] })));
  // Atada al scroll: hasta 90° en los dos extremos (ahí vuelve).
  assert.ok(vale(con({ con: "vista", tramo: "entrada", pasos: [{ actor: "hoja", de: { inclinaX: 80 }, a: { inclinaX: 0 } }] })));
  assert.ok(!vale(con({ con: "verse", pasos: [{ actor: "hoja", de: { inclinaX: "mucho" } }] })));
});

test("inclinación: en lo continuo un paso gira o se inclina, no las dos cosas", () => {
  const mezcla = { giro: 4, inclinaX: 6 };
  assert.ok(vale(con({ con: "verse", pasos: [{ actor: "hoja", de: { giro: -8, inclinaX: -60 } }] })), "en una entrada por tiempo sí se pueden juntar");
  for (const escena of [
    { con: "puntero", pasos: [{ actor: "tarjeta", a: mezcla }] },
    { con: "velocidad", pasos: [{ actor: "tarjeta", a: mezcla }] },
    { con: "estado", estado: "apuntado", pasos: [{ actor: "tarjeta", a: { giro: 2, inclinaY: 3 } }] },
    { con: "vista", pasos: [{ actor: "tarjeta", de: { giro: 10 }, a: { inclinaX: 10 } }] },
    { con: "scroll", pasos: [{ actor: "tarjeta", de: mezcla }] },
  ]) {
    assert.match(errores(con(escena)), /gira o se inclina/, escena.con);
  }
});

test("lo que sigue lleva su cambio en «a», en px", () => {
  assert.ok(vale(con({ con: "puntero", pasos: [{ actor: "tarjeta", a: { x: 16, y: 12, giro: 2 }, resorte: "elastico" }] })));
  assert.ok(!vale(con({ con: "puntero", pasos: [{ actor: "tarjeta", resorte: "suave" }] })), "sin «a» no dice qué cambia");
  assert.ok(!vale(con({ con: "puntero", pasos: [{ actor: "tarjeta", a: {} }] })));
  assert.match(errores(con({ con: "velocidad", pasos: [{ actor: "tarjeta", a: { x: "10%" } }] })), /px/);
  assert.ok(!vale(con({ con: "puntero", pasos: [{ actor: "tarjeta", a: { x: 201 } }] })), "los topes de lo que sigue no cambian");
  assert.ok(!vale(con({ con: "puntero", pasos: [{ actor: "tarjeta", a: { giro: 46 } }] })));
});

test("reparto: qué parte del tramo ocupa cada pieza, de 0,05 a 1", () => {
  const paso = (reparto: unknown) => con({ con: "vista", pasos: [{ actor: "frase", por: "palabra", de: { opacidad: 0.2 }, reparto }] });
  assert.ok(vale(paso(0.05)) && vale(paso(0.5)) && vale(paso(1)));
  assert.ok(!vale(paso(0)) && !vale(paso(1.2)) && !vale(paso("medio")));
  assert.ok(vale(con({ con: "scroll", pasos: [{ actor: "frase", por: "letra", a: { opacidad: 0 }, reparto: 0.3 }] })));
  // Solo existe en lo atado al scroll.
  assert.ok(!vale(con({ con: "verse", pasos: [{ actor: "frase", de: { y: 4 }, reparto: 0.3 }] })));
});

test("el contrato trae la versión 1 y los números para reproducir el movimiento fuera del navegador", () => {
  const c = contratoPartitura() as Record<string, any>;
  assert.equal(c.version, 1);
  assert.equal(c.experimental, undefined, "ya no dice experimental");
  assert.deepEqual(c.curvas.suave, [0.2, 0.8, 0.2, 1]);
  assert.deepEqual(c.curvas.lineal, [0, 0, 1, 1]);
  assert.equal(Object.keys(c.curvas).length, 6);
  assert.deepEqual(c.resortes, { suave: { rigidez: 120, freno: 22 }, firme: { rigidez: 220, freno: 30 }, elastico: { rigidez: 180, freno: 11 } });
  assert.equal(c.profundidad, 900);
  assert.equal(c.topes.seguir.inclina, 25);
  assert.ok(c.campos.cambio.includes("inclinaX") && c.campos.cambio.includes("inclinaY"));
  assert.deepEqual(c.campos.paso.puntero, ["actor", "a", "resorte"]);
  assert.ok(c.campos.paso.vista.includes("reparto"));
  for (const tramo of ["entrada", "salida", "paso"]) assert.ok(typeof c.tramos[tramo] === "string" && c.tramos[tramo].length > 20, tramo);
  assert.ok(/reparto/.test(c.tramos.reparto));
});

test("los seis ejemplos son versión 1 y valen", () => {
  for (const [nombre, p] of Object.entries(PARTITURAS as Record<string, Partitura>)) {
    assert.equal(p.version, 1, nombre);
    assert.ok(vale(p), `${nombre}: ${errores(p)}`);
  }
});

// --- Tarea 2: el Director inclina ---
import { fotogramasSueltos, fotogramasTiempo } from "../src/director/fotogramas";
import { valorSeguido } from "../src/director/senales";
import { rangoDePieza } from "../src/director/montar";
import { darProfundidad } from "../src/director/profundidad";

test("inclinación por tiempo: va primero, con su profundidad, y con la misma lista en los dos extremos", () => {
  // Solo de partida: un fotograma (el final es como está la página).
  assert.deepEqual(fotogramasTiempo({ de: { inclinaX: -70, opacidad: 0 } }, "completo"), [{ offset: 0, transform: "perspective(900px) rotateX(-70deg) rotateY(0deg)", opacity: 0 }]);
  // Con lo demás: la inclinación va antes de mover, girar y agrandar.
  assert.deepEqual(fotogramasTiempo({ de: { y: 20, inclinaY: 30, giro: -4, escala: 0.9 } }, "completo"), [{ offset: 0, transform: "perspective(900px) rotateX(0deg) rotateY(30deg) translate(0px,20px) rotate(-4deg) scale(0.9)" }]);
  // Si un extremo inclina, el otro lleva la misma lista en cero: el navegador interpola cada giro, no una matriz.
  assert.deepEqual(fotogramasTiempo({ de: { inclinaX: -60 }, a: { y: -10 } }, "completo"), [
    { offset: 0, transform: "perspective(900px) rotateX(-60deg) rotateY(0deg)" },
    { offset: 1, transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translate(0px,-10px)" },
  ]);
  // Sin inclinación, todo sigue igual que antes.
  assert.deepEqual(fotogramasTiempo({ de: { y: 28, opacidad: 0 } }, "completo"), [{ offset: 0, transform: "translate(0px,28px)", opacity: 0 }]);
  // En liviano las entradas solo funden: no hay inclinación. En quieto, nada.
  assert.deepEqual(fotogramasTiempo({ de: { inclinaX: -70 } }, "liviano"), [{ offset: 0, opacity: 0 }]);
  assert.equal(fotogramasTiempo({ de: { inclinaX: -70 } }, "quieto"), null);
});

test("inclinación en lo continuo: un giro sobre un eje, con el mismo eje en los dos extremos", () => {
  // Un solo eje: exacto.
  assert.deepEqual(fotogramasSueltos({ a: { inclinaX: 4 } }, "completo"), [{ offset: 1, rotate: "1 0 0 4deg" }]);
  assert.deepEqual(fotogramasSueltos({ a: { inclinaY: -8 } }, "completo"), [{ offset: 1, rotate: "0 -1 0 8deg" }]);
  // Los dos ejes: el eje es el vector y el ángulo, su largo.
  assert.deepEqual(fotogramasSueltos({ a: { inclinaX: 3, inclinaY: 4 } }, "completo"), [{ offset: 1, rotate: "0.6 0.8 0 5deg" }]);
  // De inclinado a plano: el extremo plano usa el eje del otro, con ángulo cero.
  assert.deepEqual(fotogramasSueltos({ de: { inclinaX: 80 }, a: { inclinaX: 0, opacidad: 1 } }, "completo"), [
    { offset: 0, rotate: "1 0 0 80deg" },
    { offset: 1, rotate: "1 0 0 0deg", opacity: 1 },
  ]);
  assert.deepEqual(fotogramasSueltos({ de: { inclinaY: 40 }, a: { y: -20 } }, "completo"), [
    { offset: 0, rotate: "0 1 0 40deg" },
    { offset: 1, translate: "0px -20px", rotate: "0 1 0 0deg" },
  ]);
  // El giro de siempre no cambia, y en liviano sobrevive solo la opacidad.
  assert.deepEqual(fotogramasSueltos({ a: { giro: 3 } }, "completo"), [{ offset: 1, rotate: "3deg" }]);
  assert.equal(fotogramasSueltos({ a: { inclinaX: 4 } }, "liviano"), null);
});

test("lo que sigue al puntero se inclina hacia donde está el cursor", () => {
  const tarjeta = { actor: "tarjeta", a: { inclinaX: 6, inclinaY: 8 } };
  // En el centro: plano.
  assert.deepEqual(valorSeguido(tarjeta, 0, 0), { rotate: "1 0 0 0deg" });
  // Cursor a la derecha: gira sobre el eje vertical (el borde derecho se aleja).
  assert.deepEqual(valorSeguido(tarjeta, 1, 0), { rotate: "0 1 0 8deg" });
  // Cursor arriba: se vuelca (el borde de arriba se aleja).
  assert.deepEqual(valorSeguido(tarjeta, 0, -1), { rotate: "1 0 0 6deg" });
  // En diagonal, a media señal.
  assert.deepEqual(valorSeguido({ actor: "tarjeta", a: { inclinaX: 6, inclinaY: 8 } }, 0.5, -0.5), { rotate: "0.6 0.8 0 5deg" });
  // Con lo demás.
  assert.deepEqual(valorSeguido({ actor: "tarjeta", a: { x: 10, inclinaY: 10 } }, -1, 0), { translate: "-10px 0px", rotate: "0 -1 0 10deg" });
});

test("reparto: qué parte del tramo ocupa cada pieza cuando un paso atado al scroll reparte", () => {
  // Por defecto, la mitad (como en la fase 1).
  assert.deepEqual(rangoDePieza(undefined, 0, 3), [0, 0.5]);
  assert.deepEqual(rangoDePieza(undefined, 2, 3), [0.5, 1]);
  assert.deepEqual(rangoDePieza(undefined, 1, 3, 0.5), [0.25, 0.75]);
  // Con 1 van todas juntas; con poco, de a una.
  assert.deepEqual(rangoDePieza([0.2, 0.8], 0, 4, 1), [0.2, 0.8]);
  assert.deepEqual(rangoDePieza([0.2, 0.8], 3, 4, 1), [0.2, 0.8]);
  const [a, b] = rangoDePieza([0, 1], 9, 10, 0.1);
  assert.ok(Math.abs(a - 0.9) < 1e-9 && Math.abs(b - 1) < 1e-9, `${a} ${b}`);
  // Una sola pieza usa el tramo entero, diga lo que diga el reparto.
  assert.deepEqual(rangoDePieza([0.2, 0.8], 0, 1, 0.1), [0.2, 0.8]);
});

test("profundidad: se pone en el padre una vez, con cuenta, y al soltar queda como estaba", () => {
  const padre = { style: { perspective: "" } } as unknown as HTMLElement;
  const soltar1 = darProfundidad(padre);
  assert.equal(padre.style.perspective, "900px");
  const soltar2 = darProfundidad(padre);
  soltar1();
  assert.equal(padre.style.perspective, "900px", "otra partitura todavía la usa");
  soltar1();
  assert.equal(padre.style.perspective, "900px", "soltar dos veces lo mismo no descuenta de más");
  soltar2();
  assert.equal(padre.style.perspective, "", "la última la quita");
  // Un padre que ya traía la suya (puesta en línea): no se toca.
  const propio = { style: { perspective: "600px" } } as unknown as HTMLElement;
  darProfundidad(propio)();
  assert.equal(propio.style.perspective, "600px");
  // Sin padre no pasa nada.
  assert.doesNotThrow(() => darProfundidad(null)());
});

// --- Tarea 5: las partituras de la casa y «Sorpréndeme» ---
import { CASA } from "../src/director/casa";
import { sorprender } from "../src/director/sorprender";
import { leerPartitura } from "../src/partitura/leer";
import { escribirPartitura } from "../src/partitura/escribir";

test("de la casa: todas valen, solo usan sus partes, y se escriben y se leen igual", () => {
  const ids = CASA.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, "sin ids repetidos");
  for (const id of ["revelar", "voltear", "trailer", "impacto", "rebote", "caer", "maquina", "cascada", "deslizar", "zoom", "titulo-con-volumen", "tarjeta-holografica"]) assert.ok(ids.includes(id), id);
  assert.equal(CASA.filter((c) => c.grupo === "momento").length, 4);
  for (const c of CASA) {
    assert.ok(vale(c.partitura), `${c.id}: ${errores(c.partitura)}`);
    assert.equal(c.partitura.nombre, c.id);
    const usados = new Set(c.partitura.escenas.flatMap((e) => e.pasos.map((p) => p.actor)));
    for (const actor of usados) assert.ok(c.partes.includes(actor), `${c.id} usa «${actor}», que no está en sus partes`);
    const r = leerPartitura(escribirPartitura(c.partitura));
    assert.deepEqual(r.ok && r.partitura, c.partitura, c.id);
  }
});

test("sorpréndeme: con la misma semilla da lo mismo, siempre vale y usa solo las partes que le pasan", () => {
  const partes = ["antetitulo", "titulo", "bajada", "botones"];
  assert.deepEqual(sorprender(7, partes), sorprender(7, partes));
  assert.notDeepEqual(sorprender(7, partes), sorprender(8, partes));
  const distintas = new Set<string>();
  for (let s = 0; s < 500; s++) {
    const p = sorprender(s, partes);
    assert.ok(vale(p), `semilla ${s}: ${errores(p)}`);
    const actores = p.escenas.flatMap((e) => e.pasos.map((x) => x.actor));
    assert.deepEqual([...new Set(actores)].sort(), [...partes].sort(), `semilla ${s}`);
    // Se puede escribir en español y leer de vuelta (los números salen redondos).
    const r = leerPartitura(escribirPartitura(p));
    assert.deepEqual(r.ok && r.partitura, p, `semilla ${s}`);
    distintas.add(JSON.stringify(p.escenas));
  }
  assert.ok(distintas.size > 200, `de 500 semillas salieron ${distintas.size} partituras distintas`);
  // Partes raras: se saltan las que no sirven como actor, las repetidas y las que pasan de doce; sin ninguna, igual vale.
  const rara = sorprender(3, ["titulo", "titulo", "Mi Parte", "", ...Array.from({ length: 30 }, (_, i) => `parte-${i}`)] as string[]);
  assert.ok(vale(rara) && rara.escenas[0].pasos.length <= 12);
  assert.ok(vale(sorprender(1, [])) && vale(sorprender(NaN, null as unknown as string[])));
});

// --- Lo que encontró la revisión final ---

test("subir: un paso que ya trae «a» no la pierde, y un campo raro no desaparece", () => {
  const v0 = (paso: unknown) => ({ version: 0, escenas: [{ con: "puntero", pasos: [paso] }] });
  const pasoDe = (x: unknown) => (subirPartitura(x) as { escenas: { pasos: Record<string, unknown>[] }[] }).escenas[0].pasos[0];
  // Mezcla de las dos formas: no se adivina; queda como venía y el validador lo rechaza.
  const mezcla = pasoDe(v0({ actor: "tarjeta", a: { y: 100 }, x: 3 }));
  assert.deepEqual(mezcla, { actor: "tarjeta", a: { y: 100 }, x: 3 });
  assert.match(errores(subirPartitura(v0({ actor: "tarjeta", a: { y: 100 }, x: 3 }))), /pasos\[0\]/);
  // Un campo propio «__proto__» (llega así desde JSON) sigue ahí para que el validador lo rechace.
  const raro = JSON.parse('{"actor":"tarjeta","x":3,"__proto__":{"y":9}}');
  const subido = pasoDe(v0(raro));
  assert.ok(Object.prototype.hasOwnProperty.call(subido, "__proto__"), "el campo no se pierde");
  assert.equal(Object.getPrototypeOf(subido), Object.prototype, "ni se vuelve el prototipo");
  assert.ok(!vale(subirPartitura(v0(raro))));
});

test("el contrato no promete lo que el Director no hace: una versión 0 no se sube sola", () => {
  const c = contratoPartitura() as Record<string, any>;
  assert.ok(!/se sube sola/.test(c.$comentario));
  assert.match(c.$comentario, /subirPartitura/);
  // Y lo que dice es cierto: el Director no corre una versión 0.
  assert.ok(!vale({ version: 0, escenas: [{ con: "verse", pasos: [{ actor: "titulo", de: { y: 20 } }] }] }));
});

test("los números de las curvas del contrato son las curvas que usa el Director", async () => {
  const { curvaCss } = await import("../src/director/fotogramas");
  const { NUMEROS_CURVA, CURVAS } = await import("../src/director/modelo");
  const DE_CSS: Record<string, number[]> = { linear: [0, 0, 1, 1], "ease-in": [0.42, 0, 1, 1], "ease-out": [0, 0, 0.58, 1], "ease-in-out": [0.42, 0, 0.58, 1] };
  for (const curva of CURVAS) {
    const css = curvaCss(curva).easing;
    const numeros = DE_CSS[css] ?? /^cubic-bezier\((.+)\)$/.exec(css)?.[1].split(",").map(Number);
    assert.deepEqual(numeros, [...NUMEROS_CURVA[curva]], `${curva}: ${css}`);
  }
});

test("el contrato trae cómo se sigue al puntero y a la velocidad, con casos calculados por el mismo código", async () => {
  const { valorSeguido, seguir, velocidadNormal, punteroEn } = await import("../src/director/senales");
  const { avanceEn } = await import("../src/director/fotogramas");
  const { rangoDePieza } = await import("../src/director/montar");
  const c = contratoPartitura() as Record<string, any>;
  // Las señales.
  assert.equal(c.seguir.velocidadMaxima, 1500);
  assert.equal(velocidadNormal(c.seguir.velocidadMaxima), 1);
  assert.equal(velocidadNormal(c.seguir.velocidadMaxima / 2), 0.5);
  assert.equal(c.seguir.velocidadVuelveMs, 160);
  assert.deepEqual(punteroEn({ left: 100, top: 100, width: 200, height: 100 }, 300, 100), { x: 1, y: -1 });
  for (const clave of ["puntero", "velocidad", "valor", "inclinacion", "resorte", "reposo"]) assert.ok(typeof c.seguir[clave] === "string" && c.seguir[clave].length > 30, clave);
  assert.match(c.seguir.inclinacion, /ix = -sy × inclinaX e iy = sx × inclinaY/);
  // El eje y el ángulo que dice el contrato son los que se escriben: con ix = 3 e iy = 4, eje (0.6, 0.8) y 5 grados.
  assert.match(c.inclinacion.continua, /√\(ix² \+ iy²\)/);
  assert.equal(valorSeguido({ actor: "x", a: { inclinaX: 3, inclinaY: 4 } }, 1, -1).rotate, "0.6 0.8 0 5deg");
  assert.match(c.inclinacion.verse, /eje X y después .* eje Y/);
  // Los casos del contrato salen del mismo código: aquí se vuelven a calcular.
  assert.ok(c.seguir.casos.length >= 3);
  for (const caso of c.seguir.casos) assert.deepEqual(valorSeguido({ actor: "x", a: caso.a }, caso.senal.x, caso.senal.y), caso.escribe);
  const r = c.seguir.casoResorte;
  assert.deepEqual(seguir(r.desde, r.meta, r.dt, r.resorte), r.queda);
  assert.ok(c.tramos.casos.length >= 6);
  for (const caso of c.tramos.casos) {
    if (caso.tramo) assert.equal(avanceEn({ top: caso.arriba, height: caso.altoRaiz }, caso.alto, caso.tramo), caso.avance);
    else assert.deepEqual(rangoDePieza(caso.entre, caso.pieza, caso.piezas, caso.reparto), caso.rango);
  }
  // Lo que vale cuando la partitura no lo dice.
  const { inicios } = await import("../src/director/calendario");
  const { $comentario, ...porDefecto } = c.porDefecto;
  assert.ok($comentario.length > 30);
  assert.deepEqual(porDefecto, { dura: 600, duraEstado: 180, curva: "suave", curvaScroll: "lineal", tramo: "paso", resorte: "suave", reparto: 0.5, liviano: { dura: 400, cada: 40 } });
  assert.deepEqual(rangoDePieza([0, 1], 1, 3), rangoDePieza([0, 1], 1, 3, c.porDefecto.reparto));
  assert.deepEqual(seguir({ x: 0, v: 0 }, 1, 0.016, undefined), seguir({ x: 0, v: 0 }, 1, 0.016, c.porDefecto.resorte));
  assert.equal(inicios([{}], [1])[0].dura, c.porDefecto.dura);
  const liviano = inicios([{ dura: 900, cada: 90 }], [3], true)[0];
  assert.deepEqual({ dura: liviano.dura, cada: liviano.cada }, c.porDefecto.liviano);
});
