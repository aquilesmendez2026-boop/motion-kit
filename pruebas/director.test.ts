// El Director (fase 1): el modelo de la Partitura, su validador y lo calculable del motor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CURVAS, NOMBRE_ACTOR, POR, SENALES, TOPES, type Partitura } from "../src/director/modelo";
import { validarPartitura } from "../src/director/validar";
import { contratoPartitura, textoContratoPartitura } from "../src/director/contrato-partitura";

const MINIMA: Partitura = { version: 1, escenas: [{ con: "verse", pasos: [{ actor: "titulo", de: { y: 28, opacidad: 0 } }] }] };
/** La misma partitura con un cambio en su primer paso. */
const conPaso = (paso: Record<string, unknown>, escena: Record<string, unknown> = {}) => ({ version: 1, escenas: [{ con: "verse", ...escena, pasos: [{ actor: "titulo", ...paso }] }] });
const vale = (x: unknown) => validarPartitura(x).ok;
/** Los campos de los errores de una partitura que no vale. */
const errores = (x: unknown): string[] => {
  const r = validarPartitura(x);
  return r.ok ? [] : r.errores.map((e) => e.campo);
};

test("partitura: la mínima vale y una completa también", () => {
  assert.ok(vale(MINIMA));
  const completa: Partitura = {
    version: 1,
    nombre: "portada",
    escenas: [
      { con: "verse", repetir: true, pasos: [
        { actor: "antetitulo", de: { y: 28, opacidad: 0 }, dura: 800, en: 50, curva: "suave" },
        { actor: "titulo", por: "palabra", mascara: true, de: { y: "135%" }, dura: 800, cada: 90, junto: 100 },
        { actor: "botones", por: "hijo", de: { escala: 0.9, opacidad: 0 }, a: { escala: 1, opacidad: 1 }, luego: 0, curva: "resorte" },
      ] },
      { con: "vista", tramo: "salida", pasos: [{ actor: "contenido", a: { y: "-14%", opacidad: 0 }, entre: [0.2, 1], curva: "lineal" }] },
      { con: "scroll", pasos: [{ actor: "barra", de: { escala: 0 }, a: { escala: 1 } }] },
      { con: "puntero", pasos: [{ actor: "caja", a: { x: 10, y: 10, giro: 2 }, resorte: "firme" }] },
      { con: "velocidad", pasos: [{ actor: "foto", a: { giro: 4, escala: 0.96 } }] },
      { con: "estado", estado: "apuntado", sobre: "tarjeta", pasos: [{ actor: "boton", a: { y: -3, escala: 1.04 }, dura: 160 }] },
    ],
  };
  const r = validarPartitura(completa);
  assert.ok(r.ok, JSON.stringify(r));
  assert.equal(r.ok && r.partitura, completa, "no la copia ni la cambia");
});

test("partitura: lo que no es una partitura no vale, y no lanza", () => {
  for (const x of [null, undefined, 3, "hola", [], [MINIMA], () => 1, { version: 1 }, { version: 1, escenas: [] }, { version: 1, escenas: "x" }, { version: 2, escenas: MINIMA.escenas }, { version: "1", escenas: MINIMA.escenas }]) {
    assert.equal(vale(x), false, JSON.stringify(x) ?? String(x));
  }
  assert.deepEqual(errores({ ...MINIMA, otra: 1 }), ["partitura.otra"]);
  assert.deepEqual(errores({ ...MINIMA, nombre: "x".repeat(61) }), ["nombre"]);
  assert.deepEqual(errores({ version: 1, escenas: [{ con: "magia", pasos: [] }] }), ["escenas[0].con"]);
  assert.deepEqual(errores({ version: 1, escenas: [{ con: "verse", pasos: [] }] }), ["escenas[0].pasos"]);
  assert.deepEqual(errores({ version: 1, escenas: [{ con: "verse", pasos: [3] }] }), ["escenas[0].pasos[0]"]);
  assert.deepEqual(errores(conPaso({ de: { y: 1 } }, { tramo: "salida" })), ["escenas[0].tramo"]);
});

test("partitura: los actores son nombres de partes, nunca selectores", () => {
  for (const malo of ["", "Titulo", ".mk-enc", "a b", "div > p", "[data-x]", "x".repeat(41), "-raro", 3, null]) assert.deepEqual(errores(conPaso({ actor: malo, de: { y: 1 } })), ["escenas[0].pasos[0].actor"], String(malo));
  for (const bueno of ["titulo", "foto-1", "a", "x".repeat(40)]) assert.ok(vale(conPaso({ actor: bueno, de: { y: 1 } })), bueno);
  assert.ok(NOMBRE_ACTOR.test("antetitulo") && !NOMBRE_ACTOR.test("javascript:alert(1)"));
});

test("partitura: un cambio solo toca posición, tamaño, giro y opacidad, dentro de sus topes", () => {
  const p = (de: unknown) => errores(conPaso({ de }));
  assert.deepEqual(p({ color: "red" }), ["escenas[0].pasos[0].de.color"]);
  assert.deepEqual(p({ x: 1, filtro: "blur(3px)" }), ["escenas[0].pasos[0].de.filtro"]);
  assert.deepEqual(p({}), ["escenas[0].pasos[0].de"]);
  assert.deepEqual(p("arriba"), ["escenas[0].pasos[0].de"]);
  assert.deepEqual(p({ x: TOPES.px + 1 }), ["escenas[0].pasos[0].de.x"]);
  assert.deepEqual(p({ y: -TOPES.px - 1 }), ["escenas[0].pasos[0].de.y"]);
  assert.deepEqual(p({ y: "301%" }), ["escenas[0].pasos[0].de.y"]);
  for (const malo of ["10", "10px", "1e3%", "calc(1px)", "var(--x)", "%", " 5%", "5 %", NaN, Infinity, true]) assert.deepEqual(p({ y: malo }), ["escenas[0].pasos[0].de.y"], String(malo));
  for (const bueno of [0, -14, 135.5, "135%", "-14%", "12.5%", "0%"]) assert.deepEqual(p({ y: bueno }), [], String(bueno));
  assert.deepEqual(p({ escala: -0.1 }), ["escenas[0].pasos[0].de.escala"]);
  assert.deepEqual(p({ escala: TOPES.escala + 0.1 }), ["escenas[0].pasos[0].de.escala"]);
  assert.deepEqual(p({ giro: 721 }), ["escenas[0].pasos[0].de.giro"]);
  assert.deepEqual(p({ opacidad: 1.1 }), ["escenas[0].pasos[0].de.opacidad"]);
  assert.deepEqual(p({ opacidad: "0" }), ["escenas[0].pasos[0].de.opacidad"]);
  assert.deepEqual(errores(conPaso({})), ["escenas[0].pasos[0]"], "un paso sin «de» ni «a»");
});

test("partitura: tiempos, curvas, «por» y máscara", () => {
  const p = (paso: Record<string, unknown>) => errores(conPaso({ de: { y: 1 }, ...paso }));
  assert.deepEqual(p({ dura: TOPES.dura + 1 }), ["escenas[0].pasos[0].dura"]);
  assert.deepEqual(p({ dura: -1 }), ["escenas[0].pasos[0].dura"]);
  assert.deepEqual(p({ cada: TOPES.cada + 1 }), ["escenas[0].pasos[0].cada"]);
  assert.deepEqual(p({ en: TOPES.escena + 1 }), ["escenas[0].pasos[0].en"]);
  assert.deepEqual(p({ en: 0, luego: 0 }), ["escenas[0].pasos[0]"]);
  assert.deepEqual(p({ luego: 10, junto: 10 }), ["escenas[0].pasos[0]"]);
  for (const c of ["en", "luego", "junto"]) assert.deepEqual(p({ [c]: 300 }), [], c);
  assert.deepEqual(p({ curva: "cubic-bezier(0,0,1,1)" }), ["escenas[0].pasos[0].curva"]);
  for (const c of CURVAS) assert.deepEqual(p({ curva: c }), [], c);
  assert.deepEqual(p({ por: "silaba" }), ["escenas[0].pasos[0].por"]);
  for (const x of POR) assert.deepEqual(p({ por: x }), [], x);
  assert.deepEqual(p({ mascara: true }), ["escenas[0].pasos[0].mascara"]);
  assert.deepEqual(p({ mascara: true, por: "hijo" }), ["escenas[0].pasos[0].mascara"]);
  assert.deepEqual(p({ mascara: true, por: "letra" }), []);
  assert.deepEqual(p({ selector: ".x" }), ["escenas[0].pasos[0].selector"]);
});

test("partitura: topes de cantidad", () => {
  const paso = { actor: "titulo", de: { y: 1 } };
  assert.deepEqual(errores({ version: 1, escenas: Array.from({ length: TOPES.escenas + 1 }, () => ({ con: "verse", pasos: [paso] })) }), ["escenas"]);
  assert.deepEqual(errores({ version: 1, escenas: [{ con: "verse", pasos: Array.from({ length: TOPES.pasos + 1 }, () => paso) }] }), ["escenas[0].pasos"]);
  // Algo enorme y roto no devuelve una lista enorme de mensajes.
  const r = validarPartitura({ version: 1, escenas: [{ con: "verse", pasos: Array.from({ length: TOPES.pasos }, () => ({ actor: "X", de: { y: "malo", color: 1 }, raro: 1 })) }] });
  assert.ok(!r.ok && r.errores.length <= 50);
});

test("partitura: atada al scroll", () => {
  const e = (paso: Record<string, unknown>, escena: Record<string, unknown> = { con: "vista" }) => errores({ version: 1, escenas: [{ ...escena, pasos: [{ actor: "foto", a: { y: -40 }, ...paso }] }] });
  assert.deepEqual(e({}), []);
  assert.deepEqual(e({}, { con: "vista", tramo: "paso" }), []);
  assert.deepEqual(e({}, { con: "vista", tramo: "medio" }), ["escenas[0].tramo"]);
  assert.deepEqual(e({}, { con: "scroll", tramo: "paso" }), ["escenas[0].tramo"]);
  assert.deepEqual(e({ entre: [0.6, 1] }), []);
  for (const malo of [[1, 0.5], [0.5, 0.5], [-0.1, 1], [0, 1.1], [0], [0, 1, 2], "0-1", [0, "1"]]) assert.deepEqual(e({ entre: malo }), ["escenas[0].pasos[0].entre"], JSON.stringify(malo));
  assert.deepEqual(e({ curva: "resorte" }), ["escenas[0].pasos[0].curva"]);
  assert.deepEqual(e({ curva: "vaiven" }), []);
  assert.deepEqual(e({ dura: 100 }), ["escenas[0].pasos[0].dura"], "no lleva tiempos");
  assert.deepEqual(e({ mascara: true, por: "palabra" }), ["escenas[0].pasos[0].mascara"]);
});

test("partitura: lo que sigue al cursor o a la velocidad, y los estados, van con topes chicos", () => {
  /** Un paso que sigue: su cambio va en «a»; `extra` son otros campos del paso. */
  const seguir = (a: Record<string, unknown>, con = "puntero", extra: Record<string, unknown> = {}) => errores({ version: 1, escenas: [{ con, pasos: [{ actor: "caja", a, ...extra }] }] });
  assert.deepEqual(seguir({ x: 10, y: 10, giro: 2 }, "puntero", { resorte: "elastico" }), []);
  assert.deepEqual(seguir({ giro: 4 }, "velocidad"), []);
  assert.deepEqual(seguir({}), ["escenas[0].pasos[0].a"], "no dice qué cambia");
  assert.deepEqual(seguir({ x: TOPES.seguir.px + 1 }), ["escenas[0].pasos[0].a.x"]);
  assert.deepEqual(seguir({ x: "10%" }), ["escenas[0].pasos[0].a.x"], "aquí no hay porcentajes");
  assert.deepEqual(seguir({ giro: 46 }), ["escenas[0].pasos[0].a.giro"]);
  assert.deepEqual(seguir({ escala: 3 }), ["escenas[0].pasos[0].a.escala"]);
  assert.deepEqual(seguir({ x: 1 }, "puntero", { resorte: "duro" }), ["escenas[0].pasos[0].resorte"]);
  assert.deepEqual(seguir({ x: 1 }, "puntero", { de: { y: 1 } }), ["escenas[0].pasos[0].de"]);

  const estado = (paso: Record<string, unknown>, escena: Record<string, unknown> = {}) => errores({ version: 1, escenas: [{ con: "estado", estado: "apuntado", ...escena, pasos: [{ actor: "boton", ...paso }] }] });
  assert.deepEqual(estado({ a: { y: -3, escala: 1.04 } }), []);
  assert.deepEqual(estado({ a: { y: -3 } }, { estado: "dormido" }), ["escenas[0].estado"]);
  assert.deepEqual(estado({ a: { y: -3 } }, { sobre: "Tarjeta" }), ["escenas[0].sobre"]);
  assert.deepEqual(estado({}), ["escenas[0].pasos[0].a"]);
  assert.deepEqual(estado({ a: { y: -7 } }), ["escenas[0].pasos[0].a.y"]);
  assert.deepEqual(estado({ a: { y: "-3%" } }), ["escenas[0].pasos[0].a.y"]);
  assert.deepEqual(estado({ a: { escala: 1.2 } }), ["escenas[0].pasos[0].a.escala"]);
  assert.deepEqual(estado({ a: { giro: 4 } }), ["escenas[0].pasos[0].a.giro"]);
  assert.deepEqual(estado({ a: { opacidad: 0.2 } }), ["escenas[0].pasos[0].a.opacidad"]);
  assert.deepEqual(estado({ a: { y: -3 }, dura: 1001 }), ["escenas[0].pasos[0].dura"]);
  assert.deepEqual(estado({ a: { y: -3 }, de: { y: 0 } }), ["escenas[0].pasos[0].de"]);
});

test("partitura: un actor sigue a una sola señal continua, y su opacidad es de una sola escena", () => {
  const con = (...escenas: unknown[]) => errores({ version: 1, escenas });
  const vista = { con: "vista", pasos: [{ actor: "foto", a: { y: -40 } }] };
  const puntero = { con: "puntero", pasos: [{ actor: "foto", a: { x: 10 } }] };
  const estado = { con: "estado", estado: "apuntado", pasos: [{ actor: "foto", a: { escala: 1.04 } }] };
  const entrada = { con: "verse", pasos: [{ actor: "foto", de: { y: 28 } }] };
  assert.deepEqual(con(vista, puntero), ["escenas[1].pasos[0].actor"]);
  assert.deepEqual(con(vista, estado), ["escenas[1].pasos[0].actor"]);
  assert.deepEqual(con(puntero, { con: "velocidad", pasos: [{ actor: "foto", a: { giro: 2 } }] }), ["escenas[1].pasos[0].actor"]);
  assert.deepEqual(con(entrada, vista), [], "una por tiempo y una continua se suman");
  assert.deepEqual(con(entrada, entrada, estado), [], "varias por tiempo, también");
  assert.deepEqual(con(vista, { con: "puntero", pasos: [{ actor: "marco", a: { x: 10 } }] }), [], "actores distintos");
  assert.deepEqual(con({ con: "vista", pasos: [{ actor: "foto", a: { y: -40 } }, { actor: "foto", a: { escala: 1.2 } }] }), ["escenas[0].pasos[1].actor"], "uno solo por actor en una escena continua");
  assert.deepEqual(con({ con: "verse", pasos: [{ actor: "foto", de: { y: 28 } }, { actor: "foto", a: { escala: 1.1 }, luego: 0 }] }), [], "por tiempo, un actor puede tener varios pasos");
  // La opacidad.
  const funde = { con: "verse", pasos: [{ actor: "foto", de: { opacidad: 0 } }] };
  assert.deepEqual(con(funde, { con: "vista", pasos: [{ actor: "foto", a: { opacidad: 0 } }] }), ["escenas[1].pasos[0]"]);
  assert.deepEqual(con(funde, { con: "vista", pasos: [{ actor: "foto", a: { y: -40 } }] }), []);
  assert.deepEqual(con(funde, { con: "puntero", pasos: [{ actor: "foto", a: { opacidad: 0.5 } }] }), ["escenas[1].pasos[0]"]);
  assert.deepEqual(con({ con: "verse", pasos: [{ actor: "foto", de: { opacidad: 0 } }, { actor: "foto", a: { opacidad: 0.5 }, luego: 0 }] }), [], "dentro de la misma escena sí");
});

test("partitura: los mensajes van en español y dicen dónde", () => {
  const r = validarPartitura(conPaso({ de: { y: "10px" } }));
  assert.ok(!r.ok);
  assert.deepEqual(r.ok ? [] : r.errores, [{ campo: "escenas[0].pasos[0].de.y", mensaje: "Tiene que ser un número (px) o un porcentaje como «-14%»." }]);
});

test("el contrato de la partitura sale del modelo y está al día", () => {
  const c = contratoPartitura();
  assert.equal(c.version, 1);
  assert.deepEqual(c.listas.con, [...SENALES]);
  assert.deepEqual(c.listas.curva, [...CURVAS]);
  assert.equal(c.topes.escenas, TOPES.escenas);
  assert.ok(new RegExp(c.actor).test("titulo") && !new RegExp(c.actor).test(".titulo"));
  assert.ok(new RegExp(c.porcentaje).test("-14%") && !new RegExp(c.porcentaje).test("14"));
  assert.equal(readFileSync("contrato/partitura-motionkit.json", "utf8"), textoContratoPartitura(), "corre: npm run contrato");
});

// --- Calendario, curvas y fotogramas ---
import { inicios } from "../src/director/calendario";
import { avanceEn, curvaCss, fotogramasSueltos, fotogramasTiempo, tramoLocal, tramoScroll } from "../src/director/fotogramas";

test("calendario: «en», «luego», «junto» y «cada»", () => {
  const r = inicios(
    [
      { dura: 800, en: 150, cada: 90 }, // 3 piezas: 150 → 150 + 800 + 2 × 90 = 1130
      { dura: 500, luego: 100 }, // parte 100 ms después de que termina el anterior: 1230 → 1730
      { dura: 300, junto: 50 }, // parte 50 ms después de que empieza el anterior: 1280 → 1580
      { en: 0 }, // sin duración: 600
      {}, // nada: en 0
    ],
    [3, 1, 1, 1, 0],
  );
  assert.deepEqual(r.map((x) => [x.inicio, x.fin]), [[150, 1130], [1230, 1730], [1280, 1580], [0, 600], [0, 600]]);
  assert.deepEqual(r.map((x) => [x.dura, x.cada]), [[800, 90], [500, 0], [300, 0], [600, 0], [600, 0]]);
  // El primero con «luego» o «junto» cuenta desde el inicio de la escena.
  assert.deepEqual(inicios([{ luego: 200, dura: 100 }], [1]).map((x) => x.inicio), [200]);
  assert.deepEqual(inicios([{ junto: 70, dura: 100 }], [1]).map((x) => x.inicio), [70]);
  assert.deepEqual(inicios([], []), []);
});

test("calendario: en liviano dura a lo más 400 ms y espera a lo más 40 ms entre piezas; nada pasa del tope de la escena", () => {
  const r = inicios([{ dura: 800, cada: 90, en: 100 }, { dura: 200, luego: 0 }], [4, 1], true);
  assert.deepEqual(r.map((x) => [x.inicio, x.fin, x.dura, x.cada]), [[100, 620, 400, 40], [620, 820, 200, 0]]);
  const largo = inicios([{ en: TOPES.escena, dura: TOPES.dura, cada: TOPES.cada }], [TOPES.piezas]);
  assert.ok(largo[0].inicio <= TOPES.escena && largo[0].fin <= TOPES.escena, JSON.stringify(largo));
  for (const raro of [{ dura: NaN }, { en: -5 }, { cada: Infinity }, { luego: "x" as unknown as number }]) {
    const x = inicios([raro], [2])[0];
    assert.ok(Number.isFinite(x.inicio + x.fin + x.dura + x.cada) && x.inicio >= 0, JSON.stringify(raro));
  }
});

test("fotogramas por tiempo: van en transform y opacity", () => {
  assert.deepEqual(fotogramasTiempo({ de: { y: "135%" } }, "completo"), [{ offset: 0, transform: "translate(0px,135%)" }]);
  assert.deepEqual(fotogramasTiempo({ de: { y: 28, opacidad: 0 } }, "completo"), [{ offset: 0, transform: "translate(0px,28px)", opacity: 0 }]);
  assert.deepEqual(fotogramasTiempo({ de: { x: -40, escala: 0.9, giro: -3 }, a: { opacidad: 0.5 } }, "completo"), [
    { offset: 0, transform: "translate(-40px,0px) rotate(-3deg) scale(0.9)" },
    { offset: 1, opacity: 0.5 },
  ]);
  assert.deepEqual(fotogramasTiempo({ a: { escala: 1.1 } }, "completo"), [{ offset: 1, transform: "scale(1.1)" }]);
  assert.equal(fotogramasTiempo({}, "completo"), null);
  assert.equal(fotogramasTiempo({ de: { y: 28 } }, "quieto"), null);
});

test("fotogramas por tiempo en liviano: solo funden", () => {
  assert.deepEqual(fotogramasTiempo({ de: { y: 28 } }, "liviano"), [{ offset: 0, opacity: 0 }], "una entrada pasa a ser un fundido");
  assert.deepEqual(fotogramasTiempo({ de: { y: 28, opacidad: 0.4 } }, "liviano"), [{ offset: 0, opacity: 0.4 }]);
  assert.deepEqual(fotogramasTiempo({ de: { y: 28 }, a: { opacidad: 0.5 } }, "liviano"), [{ offset: 0, opacity: 0 }, { offset: 1, opacity: 0.5 }]);
  assert.deepEqual(fotogramasTiempo({ a: { escala: 1.1, opacidad: 0.5 } }, "liviano"), [{ offset: 1, opacity: 0.5 }]);
  assert.equal(fotogramasTiempo({ a: { escala: 1.1 } }, "liviano"), null, "solo «a» y sin opacidad: se salta");
  // Si la opacidad del actor es de otra escena, la entrada no funde: aparece.
  assert.equal(fotogramasTiempo({ de: { y: 28 } }, "liviano", false), null);
});

test("fotogramas sueltos (scroll, cursor y estado): van en translate, rotate y scale", () => {
  assert.deepEqual(fotogramasSueltos({ a: { y: "-14%", opacidad: 0 } }, "completo"), [{ offset: 1, translate: "0px -14%", opacity: 0 }]);
  assert.deepEqual(fotogramasSueltos({ de: { x: 10, giro: 4, escala: 0.8 }, a: { x: -10 } }, "completo"), [
    { offset: 0, translate: "10px 0px", rotate: "4deg", scale: "0.8" },
    { offset: 1, translate: "-10px 0px" },
  ]);
  assert.deepEqual(fotogramasSueltos({ a: { y: -40, opacidad: 0.2 } }, "liviano"), [{ offset: 1, opacity: 0.2 }], "en liviano sobrevive solo la opacidad");
  assert.equal(fotogramasSueltos({ a: { y: -40 } }, "liviano"), null);
  assert.equal(fotogramasSueltos({ a: { y: -40 } }, "quieto"), null);
  // Ningún fotograma toca otra propiedad.
  for (const f of [...fotogramasTiempo({ de: { x: 1, y: 1, escala: 1, giro: 1, opacidad: 1 } }, "completo")!, ...fotogramasSueltos({ de: { x: 1, y: 1, escala: 1, giro: 1, opacidad: 1 } }, "completo")!]) {
    for (const k of Object.keys(f)) assert.ok(["offset", "transform", "translate", "rotate", "scale", "opacity"].includes(k), k);
  }
});

test("curvas: cada nombre es una curva de CSS; el resorte toma el del estilo si lo hay", () => {
  for (const c of CURVAS) assert.ok(/^(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\([\d.,-]+\))$/.test(curvaCss(c).easing), `${c}: ${curvaCss(c).easing}`);
  assert.equal(curvaCss(undefined).easing, curvaCss("suave").easing);
  assert.equal(curvaCss("lineal").easing, "linear");
  assert.equal(curvaCss("suave").ms, undefined);
  assert.deepEqual(curvaCss("resorte", { curva: "linear(0, 1.2, 1)", ms: 640 }), { easing: "linear(0, 1.2, 1)", ms: 640 });
  assert.equal(curvaCss("suave", { curva: "linear(0, 1.2, 1)", ms: 640 }).ms, undefined, "solo el resorte usa el del estilo");
  assert.equal(curvaCss("mala" as never).easing, curvaCss("suave").easing);
});

test("tramos de scroll: el rango nativo y el avance del respaldo dicen lo mismo", () => {
  assert.deepEqual(tramoScroll("salida"), { inicio: "exit 0%", fin: "exit 100%" });
  assert.deepEqual(tramoScroll("entrada", [0.2, 0.9]), { inicio: "entry 20%", fin: "entry 90%" });
  assert.deepEqual(tramoScroll("paso", [0.25, 0.5]), { inicio: "cover 25%", fin: "cover 50%" });
  assert.deepEqual(tramoScroll(null, [0.6, 1]), { inicio: "60%", fin: "100%" }, "la página entera");
  // Una raíz de 400 px en una pantalla de 800.
  const en = (top: number, tramo: "entrada" | "salida" | "paso") => avanceEn({ top, height: 400 }, 800, tramo);
  assert.equal(en(800, "entrada"), 0);
  assert.equal(en(600, "entrada"), 0.5);
  assert.equal(en(400, "entrada"), 1);
  assert.equal(en(0, "salida"), 0);
  assert.equal(en(-100, "salida"), 0.25);
  assert.equal(en(-400, "salida"), 1);
  assert.equal(en(800, "paso"), 0);
  assert.equal(en(200, "paso"), 0.5);
  assert.equal(en(-400, "paso"), 1);
  assert.equal(en(5000, "paso"), 0);
  assert.equal(en(-5000, "paso"), 1);
  assert.equal(avanceEn({ top: 0, height: 0 }, 800, "salida"), 0, "una raíz sin alto no divide por cero");
  // El tramo «entre»: fuera de él, quieto en sus extremos.
  assert.equal(tramoLocal(0.5, [0.6, 1]), 0);
  assert.ok(Math.abs(tramoLocal(0.8, [0.6, 1]) - 0.5) < 1e-9);
  assert.equal(tramoLocal(1, [0.6, 1]), 1);
  assert.equal(tramoLocal(0.3, undefined), 0.3);
});

// --- Corte de texto, compás y señales ---
import { trozos } from "../src/director/cortar";
import { crearCompas } from "../src/director/compas";
import { llego, punteroEn, RESORTES_SEGUIR, seguir, valorSeguido, velocidadNormal } from "../src/director/senales";
import { RESORTES } from "../src/director/modelo";

test("trozos: palabras y letras, con los espacios aparte y los emoji enteros", () => {
  assert.deepEqual(trozos("Café de  barrio", "palabra"), [
    { texto: "Café", espacio: false },
    { texto: " ", espacio: true },
    { texto: "de", espacio: false },
    { texto: "  ", espacio: true },
    { texto: "barrio", espacio: false },
  ]);
  assert.deepEqual(trozos(" hola\n", "palabra").map((t) => [t.texto, t.espacio]), [[" ", true], ["hola", false], ["\n", true]]);
  assert.deepEqual(trozos("Ñu 🇨🇱", "letra"), [
    { texto: "Ñu", espacio: false, letras: ["Ñ", "u"] },
    { texto: " ", espacio: true },
    { texto: "🇨🇱", espacio: false, letras: ["🇨🇱"] },
  ]);
  assert.deepEqual(trozos("", "palabra"), []);
  assert.deepEqual(trozos("   ", "letra"), [{ texto: "   ", espacio: true }]);
  // Juntando los trozos sale el texto original, siempre.
  for (const t of ["Hola,  mundo ❤️ ", "a", "\tdos\nlíneas", "¡Felices Fiestas Patrias 🇨🇱!"]) for (const por of ["palabra", "letra"] as const) assert.equal(trozos(t, por).map((x) => x.texto).join(""), t);
});

test("compás: un solo bucle, que se puede mover a mano en pasos fijos", () => {
  const compas = crearCompas(() => true, true);
  const pasos: number[] = [];
  const quitar = compas.sumar((dt) => {
    pasos.push(dt);
    return true;
  });
  let otros = 0;
  compas.sumar(() => {
    otros++;
    return false;
  });
  compas.avanzar(100);
  assert.equal(pasos.length, 6, "100 ms son 6 pasos de 1/60 s");
  assert.ok(pasos.every((dt) => Math.abs(dt - 1 / 60) < 1e-9));
  assert.equal(otros, 6);
  quitar();
  compas.avanzar(50);
  assert.equal(pasos.length, 6, "el que se quitó ya no corre");
  assert.equal(otros, 9);
  compas.parar();
  compas.avanzar(50);
  assert.equal(otros, 9, "parado, no corre nadie");
  // En modo manual, despertar no pide cuadros (en Node ni siquiera existen).
  compas.despertar();
  crearCompas(() => true).despertar();
});

test("señales: el cursor y la velocidad van de -1 a 1", () => {
  const caja = { left: 100, top: 50, width: 400, height: 200 };
  assert.deepEqual(punteroEn(caja, 300, 150), { x: 0, y: 0 });
  assert.deepEqual(punteroEn(caja, 100, 50), { x: -1, y: -1 });
  assert.deepEqual(punteroEn(caja, 500, 250), { x: 1, y: 1 });
  assert.deepEqual(punteroEn(caja, 9999, -9999), { x: 1, y: -1 });
  assert.deepEqual(punteroEn({ left: 0, top: 0, width: 0, height: 0 }, 10, 10), { x: 0, y: 0 });
  assert.equal(velocidadNormal(750), 0.5);
  assert.equal(velocidadNormal(-99999), -1);
  assert.equal(velocidadNormal(99999), 1);
  assert.equal(velocidadNormal(NaN), 0);
});

test("señales: cada resorte llega a su meta y se duerme; el elástico se pasa y el suave no", () => {
  assert.deepEqual(Object.keys(RESORTES_SEGUIR).sort(), [...RESORTES].sort());
  for (const r of RESORTES) {
    let e = { x: 0, v: 0 };
    let maximo = 0;
    let durmio = -1;
    for (let i = 0; i < 240; i++) {
      e = seguir(e, 1, 1 / 60, r);
      maximo = Math.max(maximo, e.x);
      if (durmio < 0 && llego(e, 1)) durmio = i;
    }
    assert.ok(llego(e, 1) && Math.abs(e.x - 1) < 0.01, `${r}: llega (${e.x})`);
    assert.ok(durmio > 0 && durmio < 200, `${r}: se duerme antes de 3,3 s (${durmio})`);
    if (r === "elastico") assert.ok(maximo > 1.08, `elástico se pasa (${maximo})`);
    if (r === "suave") assert.ok(maximo < 1.02, `suave no se pasa (${maximo})`);
  }
  assert.equal(seguir({ x: 0.3, v: 0 }, 0.3, 1 / 60, "malo" as never).x, 0.3, "un resorte desconocido usa el suave");
});

test("señales: lo que escribe un paso que sigue, según la señal", () => {
  assert.deepEqual(valorSeguido({ actor: "caja", a: { x: 10, y: 20, giro: 4 } }, 0.5, -1), { translate: "5px -20px", rotate: "2deg" });
  assert.deepEqual(valorSeguido({ actor: "caja", a: { escala: 1.2, opacidad: 0.5 } }, -0.5, 0.25), { scale: "1.1", opacity: "0.75" });
  assert.deepEqual(valorSeguido({ actor: "caja", a: { x: 10 } }, 0, 0), { translate: "0px 0px" });
  assert.deepEqual(valorSeguido({ actor: "caja", a: { y: 8 } }, 1, 1), { translate: "0px 8px" });
});

// --- El Director ---
import { duenosDeOpacidad, montar, rangoDePieza } from "../src/director/montar";

test("director: una partitura que no vale no se monta, avisa y no lanza", () => {
  const raiz = { animate() {}, querySelectorAll: () => [] } as unknown as HTMLElement;
  for (const mala of [null, 3, { version: 1 }, { version: 1, escenas: [{ con: "verse", pasos: [{ actor: ".x", de: { y: 1 } }] }] }]) {
    let avisos = 0;
    const m = montar(raiz, mala as never, { alFallar: (e) => (avisos += e.length) });
    assert.ok(avisos > 0, JSON.stringify(mala));
    // El montaje vacío responde a todo sin hacer nada.
    m.irA(100);
    m.avanzar(100);
    m.senal("puntero", { x: 1, y: 1 });
    m.senal("vista", 0.5);
    m.rearmar();
    m.desmontar();
    m.desmontar();
  }
});

test("director: sin navegador, o sin animaciones nativas, devuelve un montaje vacío", () => {
  // En Node no hay `document`: montar no toca nada.
  const m = montar({} as HTMLElement, MINIMA);
  m.irA(0);
  m.desmontar();
  montar(null as unknown as HTMLElement, MINIMA).desmontar();
});

test("director: quién es dueño de la opacidad de cada actor", () => {
  const p: Partitura = {
    version: 1,
    escenas: [
      { con: "verse", pasos: [{ actor: "titulo", de: { y: 28 } }, { actor: "foto", de: { opacidad: 0 } }] },
      { con: "vista", pasos: [{ actor: "titulo", a: { opacidad: 0 } }] },
      { con: "puntero", pasos: [{ actor: "caja", a: { opacidad: 0.5 } }] },
      { con: "estado", estado: "apuntado", pasos: [{ actor: "boton", a: { opacidad: 0.8 } }] },
    ],
  };
  assert.deepEqual([...duenosDeOpacidad(p)].sort(), [["boton", 3], ["caja", 2], ["foto", 0], ["titulo", 1]]);
});

test("director: con «por», las piezas de un paso de scroll se reparten en cascada dentro de su tramo", () => {
  assert.deepEqual(rangoDePieza([0, 1], 0, 1), [0, 1], "una sola pieza: el tramo entero");
  assert.deepEqual(rangoDePieza([0, 1], 0, 3), [0, 0.5]);
  assert.deepEqual(rangoDePieza([0, 1], 1, 3), [0.25, 0.75]);
  assert.deepEqual(rangoDePieza([0, 1], 2, 3), [0.5, 1]);
  const r = rangoDePieza([0.6, 1], 1, 2);
  assert.ok(Math.abs(r[0] - 0.8) < 1e-9 && Math.abs(r[1] - 1) < 1e-9);
  assert.deepEqual(rangoDePieza(undefined, 0, 1), [0, 1]);
});

// --- Las partituras de ejemplo ---
import { PARTITURAS } from "../src/director/partituras";

test("las seis partituras de ejemplo valen, y entre todas usan las seis señales", () => {
  const usadas = new Set<string>();
  for (const [nombre, p] of Object.entries(PARTITURAS)) {
    const r = validarPartitura(p);
    assert.ok(r.ok, `${nombre}: ${JSON.stringify(r)}`);
    assert.equal(p.nombre, nombre);
    for (const e of p.escenas) usadas.add(e.con);
    // Son datos: van y vuelven de JSON sin perder nada.
    assert.deepEqual(JSON.parse(JSON.stringify(p)), p);
  }
  assert.deepEqual([...usadas].sort(), [...SENALES].sort());
  assert.equal(Object.keys(PARTITURAS).length, 6);
});

// --- Lo que encontró la revisión final (24-11-2026) ---
import { PORCENTAJE } from "../src/director/modelo";

test("revisión: el estado final de una entrada no puede esconder nada ni sacarlo de su lugar", () => {
  const a = (cambio: unknown) => errores(conPaso({ a: cambio }));
  assert.deepEqual(a({ opacidad: 0 }), ["escenas[0].pasos[0].a.opacidad"]);
  assert.deepEqual(a({ opacidad: TOPES.final.opacidadMin - 0.01 }), ["escenas[0].pasos[0].a.opacidad"]);
  assert.deepEqual(a({ opacidad: TOPES.final.opacidadMin }), []);
  assert.deepEqual(a({ escala: 0 }), ["escenas[0].pasos[0].a.escala"]);
  assert.deepEqual(a({ escala: TOPES.final.escalaMax + 0.1 }), ["escenas[0].pasos[0].a.escala"]);
  assert.deepEqual(a({ escala: 1.1 }), []);
  assert.deepEqual(a({ x: TOPES.final.px + 1 }), ["escenas[0].pasos[0].a.x"]);
  assert.deepEqual(a({ y: "-101%" }), ["escenas[0].pasos[0].a.y"]);
  assert.deepEqual(a({ y: -20, giro: 8 }), []);
  // El punto de partida («de») sigue libre: de ahí se viene.
  assert.deepEqual(errores(conPaso({ de: { opacidad: 0, escala: 0, x: 1500 } })), []);
  // Atado al scroll, el final también es libre: al subir, vuelve.
  assert.deepEqual(errores({ version: 1, escenas: [{ con: "vista", tramo: "salida", pasos: [{ actor: "contenido", a: { y: "-140%", opacidad: 0 } }] }] }), []);
});

test("revisión: un actor se corta de una sola forma", () => {
  const con = (...pasos: Record<string, unknown>[]) => errores({ version: 1, escenas: [{ con: "verse", pasos }] });
  const palabra = { actor: "titulo", por: "palabra", de: { y: 20 } };
  assert.deepEqual(con(palabra, { actor: "titulo", por: "letra", de: { opacidad: 0 }, luego: 0 }), ["escenas[0].pasos[1].por"]);
  assert.deepEqual(con(palabra, { actor: "titulo", por: "palabra", mascara: true, de: { y: "100%" }, luego: 0 }), ["escenas[0].pasos[1].por"]);
  assert.deepEqual(con(palabra, { actor: "titulo", por: "palabra", a: { giro: 3 }, luego: 0 }), [], "igual que antes, vale");
  assert.deepEqual(con(palabra, { actor: "titulo", a: { escala: 1.05 }, luego: 0 }), [], "sin «por», mueve al actor entero");
  // También entre escenas.
  assert.deepEqual(errores({ version: 1, escenas: [{ con: "verse", pasos: [palabra] }, { con: "vista", pasos: [{ actor: "titulo", por: "letra", a: { opacidad: 0.2 } }] }] }), ["escenas[1].pasos[0].por"]);
});

test("revisión: una escena que dura más de 20 segundos no vale (no se acorta en silencio)", () => {
  const pasos = (lista: Record<string, unknown>[]) => errores({ version: 1, escenas: [{ con: "verse", pasos: lista.map((p) => ({ actor: "titulo", de: { y: 1 }, ...p })) }] });
  assert.deepEqual(pasos([{ en: 15000, dura: 6000 }]), ["escenas[0].pasos[0]"]);
  assert.deepEqual(pasos([{ dura: 10000 }, { dura: 10000, luego: 0 }, { dura: 500, luego: 0 }]), ["escenas[0].pasos[2]"]);
  assert.deepEqual(pasos([{ dura: 10000 }, { dura: 10000, luego: 0 }]), []);
  assert.deepEqual(pasos([{ en: 19000, dura: 1000 }]), []);
});

test("revisión: el respaldo de scroll calza con el nativo también con una raíz más alta que la pantalla", () => {
  // Una raíz de 2000 px en una pantalla de 800.
  const en = (top: number, tramo: "entrada" | "salida" | "paso") => avanceEn({ top, height: 2000 }, 800, tramo);
  // Entrada: desde que asoma por abajo hasta que cubre la pantalla (su borde de arriba llega arriba).
  assert.equal(en(800, "entrada"), 0);
  assert.equal(en(400, "entrada"), 0.5);
  assert.equal(en(0, "entrada"), 1);
  assert.equal(en(-500, "entrada"), 1);
  // Salida: desde que su borde de abajo llega al borde de abajo de la pantalla hasta que se va del todo.
  assert.equal(en(-1100, "salida"), 0, "todavía cubre la pantalla");
  assert.equal(en(-1200, "salida"), 0);
  assert.equal(en(-1600, "salida"), 0.5);
  assert.equal(en(-2000, "salida"), 1);
});

test("revisión: el contrato lleva las mismas reglas de texto que usa el validador, y los topes nuevos", () => {
  const c = contratoPartitura();
  assert.equal(c.actor, NOMBRE_ACTOR.source);
  assert.equal(c.porcentaje, PORCENTAJE.source);
  assert.equal(c.topes.animaciones, 600);
  assert.equal(c.topes.seguidores, 100);
  assert.deepEqual(c.topes.final, { opacidadMin: 0.5, escalaMin: 0.5, escalaMax: 2, px: 200, porciento: 100, inclina: 15 });
});

test("revisión: montar no se queda con la partitura que le pasaron (si alguien la cambia después, no corre algo sin validar)", () => {
  // Sin navegador no monta, pero tampoco guarda ni cambia el objeto.
  const p = JSON.parse(JSON.stringify(MINIMA));
  montar({} as HTMLElement, p).desmontar();
  assert.deepEqual(p, MINIMA);
});
