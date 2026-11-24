import { test } from "node:test";
import assert from "node:assert/strict";
import { resorte, RESORTES_DE_ESTILO } from "../src/momentos/resorte";
import { numeroDe } from "../src/momentos/base";
import { limitesSellos, girosSellos, estrellasDe, siguienteIndice, formatoDecimal, formatoPesos, abanicoDe, faltaPara, callesDe, desordenDe, esEnlaceSeguro, debeArrancar, nivelFijo, datosResenas, fotosValidas } from "../src/momentos/calculos";
import { valorPorTecla, cuantoRaspado, piezasConfeti } from "../src/momentos/calculos-aparte";

const valores = (c: string) => c.replace(/^linear\(|\)$/g, "").split(",").map(Number);

test("resorte medio: curva linear de 0 a 1 y se pasa un poco", () => {
  const r = resorte();
  assert.match(r.curva, /^linear\(0,/);
  assert.match(r.curva, /, ?1\)$/);
  assert.ok(Math.max(...valores(r.curva)) > 1);
  assert.ok(r.ms >= 200 && r.ms <= 2000);
});

test("resorte crítico no se pasa", () => {
  assert.ok(Math.max(...valores(RESORTES_DE_ESTILO.pelicula.curva)) <= 1.0001);
});

test("cada estilo tiene resorte y retro va por pasos", () => {
  assert.deepEqual(Object.keys(RESORTES_DE_ESTILO).sort(), ["anime", "neon", "pelicula", "retro", "rock"]);
  assert.match(RESORTES_DE_ESTILO.retro.curva, /^steps\(/);
});

test("numeroDe es estable", () => {
  assert.equal(numeroDe("cafe-luna"), numeroDe("cafe-luna"));
  assert.notEqual(numeroDe("cafe-luna"), numeroDe("cafe-sol"));
  assert.ok(Number.isInteger(numeroDe("x")) && numeroDe("x") >= 0);
});

test("limitesSellos corrige el rango", () => {
  assert.deepEqual(limitesSellos(10, 3), { total: 10, llenos: 3 });
  assert.deepEqual(limitesSellos(0, 5), { total: 1, llenos: 1 });
  assert.deepEqual(limitesSellos(50, -2), { total: 30, llenos: 0 });
  assert.deepEqual(limitesSellos(NaN, NaN), { total: 1, llenos: 0 });
});

test("girosSellos repetibles y en rango", () => {
  const g = girosSellos(10, "cafe-luna");
  assert.equal(g.length, 10);
  assert.deepEqual(g, girosSellos(10, "cafe-luna"));
  assert.ok(g.every((x) => x >= -12 && x <= 12));
});

test("estrellasDe llena con fracciones y corrige el rango", () => {
  const e = estrellasDe(4.6);
  assert.deepEqual(e.slice(0, 4), [1, 1, 1, 1]);
  assert.ok(Math.abs(e[4] - 0.6) < 1e-9);
  assert.deepEqual(estrellasDe(null), [0, 0, 0, 0, 0]);
  assert.deepEqual(estrellasDe(7), [1, 1, 1, 1, 1]);
  assert.deepEqual(estrellasDe(-1), [0, 0, 0, 0, 0]);
});

test("siguienteIndice da la vuelta", () => {
  assert.equal(siguienteIndice(4, 5, 1), 0);
  assert.equal(siguienteIndice(0, 5, -1), 4);
});

test("formatoDecimal en es-CL", () => assert.equal(formatoDecimal(4.6), "4,6"));

test("formatoPesos", () => {
  assert.equal(formatoPesos(12990), "$12.990");
  assert.equal(formatoPesos(0), "$0");
  assert.equal(formatoPesos(1234567), "$1.234.567");
  assert.equal(formatoPesos(12990.6), "$12.991");
  assert.equal(formatoPesos(NaN), "");
  assert.equal(formatoPesos(-5), "");
});

test("abanicoDe es simétrico", () => assert.deepEqual(abanicoDe(3), [-6, 0, 6]));

const Z = "America/Santiago";
test("faltan dos días", () => {
  const f = faltaPara("2026-11-25", "20:00", Z, new Date("2026-11-23T23:00:00Z"));
  assert.equal(f.estado, "falta");
  assert.equal(f.dias, 2);
  assert.equal(f.horas, 0);
  assert.equal(f.texto, "Faltan 2 días");
});

test("es hoy", () => {
  const f = faltaPara("2026-11-25", "20:00", Z, new Date("2026-11-25T12:00:00Z"));
  assert.equal(f.estado, "hoy");
  assert.equal(f.texto, "¡Es hoy! A las 20:00");
});

test("ya empezó", () => assert.equal(faltaPara("2026-11-25", "20:00", Z, new Date("2026-11-26T00:00:00Z")).texto, "Ya empezó"));

test("cruza el cambio de hora de abril", () => {
  const f = faltaPara("2027-04-05", "12:00", Z, new Date("2027-04-03T15:00:00Z"));
  assert.equal(f.dias, 2);
  assert.equal(f.horas, 1);
  assert.equal(f.texto, "Faltan 2 días y 1 hora");
});

test("textos en singular, plural y horas", () => {
  assert.equal(faltaPara("2026-11-25", "21:00", Z, new Date("2026-11-23T23:00:00Z")).texto, "Faltan 2 días y 1 hora");
  assert.equal(faltaPara("2026-11-25", "21:00", Z, new Date("2026-11-24T23:00:00Z")).texto, "Falta 1 día y 1 hora");
  assert.equal(faltaPara("2026-11-25", "01:10", Z, new Date("2026-11-24T23:00:00Z")).texto, "Faltan 5 horas y 10 minutos");
  assert.equal(faltaPara("2026-11-24", "21:00", Z, new Date("2026-11-24T12:00:00Z")).texto, "¡Es hoy! A las 21:00");
});

test("fecha u hora mal escrita", () => {
  assert.equal(faltaPara("2026-13-01", "20:00", Z, new Date()).estado, "invalida");
  assert.equal(faltaPara("2026-11-25", "25:00", Z, new Date()).estado, "invalida");
});

test("callesDe repetible y dentro del plano", () => {
  const a = callesDe(5);
  assert.deepEqual(a, callesDe(5));
  assert.notDeepEqual(a, callesDe(6));
  assert.ok(a.calles.length >= 6 && a.calles.length <= 9);
  assert.ok(a.pin.x >= 40 && a.pin.x <= 60 && a.pin.y >= 40 && a.pin.y <= 60);
  assert.ok(a.calles.every((c) => [c.x1, c.y1, c.x2, c.y2].every((v) => v >= 0 && v <= 100)));
});

test("desordenDe en rango y repetible", () => {
  const d = desordenDe(8, 3);
  assert.equal(d.length, 8);
  assert.deepEqual(d, desordenDe(8, 3));
  assert.ok(d.every((p) => Math.abs(p.x) <= 40 && Math.abs(p.y) <= 30 && Math.abs(p.giro) <= 14));
});

test("valorPorTecla", () => {
  assert.equal(valorPorTecla(50, "ArrowRight"), 55);
  assert.equal(valorPorTecla(2, "ArrowLeft"), 0);
  assert.equal(valorPorTecla(95, "PageUp"), 100);
  assert.equal(valorPorTecla(40, "Home"), 0);
  assert.equal(valorPorTecla(40, "End"), 100);
  assert.equal(valorPorTecla(40, "a"), null);
});

const pix = (alfas: number[]) => new Uint8ClampedArray(alfas.flatMap((a) => [0, 0, 0, a]));
test("cuantoRaspado", () => {
  assert.equal(cuantoRaspado(pix([255, 255, 255, 255]), 1), 0);
  assert.equal(cuantoRaspado(pix([0, 0, 0, 0]), 1), 1);
  assert.equal(cuantoRaspado(pix([0, 255, 0, 255]), 1), 0.5);
});

test("piezasConfeti repetibles y en rango", () => {
  const p = piezasConfeti(36, 9);
  assert.equal(p.length, 36);
  assert.deepEqual(p, piezasConfeti(36, 9));
  assert.ok(p.every((q) => q.x >= -50 && q.x <= 50 && q.retraso >= 0 && q.retraso <= 0.6 && [0, 1, 2].includes(q.color)));
});

test("esEnlaceSeguro deja pasar web y rutas, no javascript ni data", () => {
  for (const ok of ["https://a.cl", "http://a.cl/x", "/precios/1", "#carta", "precios/1", "?l=1"]) assert.equal(esEnlaceSeguro(ok), true, ok);
  for (const malo of ["javascript:alert(1)", " JavaScript:alert(1)", "data:text/html,x", "vbscript:x", "", "//evil.com"]) assert.equal(esEnlaceSeguro(malo), false, malo);
});

test("debeArrancar con un tercio a la vista o con media pantalla llena", () => {
  assert.equal(debeArrancar(0.4, 200, 800), true);
  assert.equal(debeArrancar(0.2, 200, 800), false);
  // Un bloque muy alto nunca llega al 35 %, pero si llena media pantalla arranca.
  assert.equal(debeArrancar(0.25, 450, 800), true);
});

test("hora que no existe en el cambio de septiembre: cuenta después del salto", () => {
  // El 6-9-2026 en Chile el reloj pasa de 00:00 a 01:00: las 00:00 son las 01:00 nuevas (04:00 UTC).
  const f = faltaPara("2026-09-06", "00:00", Z, new Date("2026-09-05T12:00:00Z"));
  assert.equal(f.horas, 16);
  assert.equal(f.texto, "Faltan 16 horas");
});

test("nivelFijo: una vez arrancado no pasa de completo a liviano, pero sí a quieto", () => {
  assert.equal(nivelFijo(null, "liviano"), "liviano");
  assert.equal(nivelFijo("completo", "liviano"), "completo");
  assert.equal(nivelFijo("completo", "quieto"), "quieto");
  assert.equal(nivelFijo("liviano", "completo"), "liviano");
});

test("datosResenas limpia datos raros", () => {
  const r = datosResenas(4.6, NaN, [{ nombre: "Cami", estrellas: NaN }, { nombre: "Tomás", estrellas: 9, texto: "Rico" }]);
  assert.equal(r.dibujar, true);
  assert.equal(r.total, 2);
  assert.deepEqual(r.resenas.map((x) => x.estrellas), [0, 5]);
  assert.equal(datosResenas(0, 0, []).dibujar, false);
  assert.equal(datosResenas(null, 3, []).dibujar, false);
  assert.equal(datosResenas(null, 0, [{ nombre: "A", estrellas: 4 }]).dibujar, true);
  assert.equal(datosResenas(4, 10, []).dibujar, true);
  assert.equal(datosResenas(NaN, 10, []).valor, null);
});

test("fotosValidas saca las fotos sin dirección o con dirección peligrosa", () => {
  const f = fotosValidas([{ url: "" }, { url: "  " }, { url: "javascript:x" }, { url: "https://a.cl/1.jpg" }, { url: "/f.webp" }, { url: "data:image/png;base64,AA" }, { url: "blob:https://a.cl/x" }]);
  assert.deepEqual(f.map((x) => x.url), ["https://a.cl/1.jpg", "/f.webp", "data:image/png;base64,AA", "blob:https://a.cl/x"]);
});
