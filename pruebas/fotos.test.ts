import { test } from "node:test";
import assert from "node:assert/strict";
import { origenPermitido, rejillaParticulas } from "../src/fotos/calculos";

test("origenPermitido", () => {
  const P = "https://cafe.lamente.cl";
  assert.equal(origenPermitido("https://cafe.lamente.cl/f.jpg", [], P), true);
  assert.equal(origenPermitido("/f.jpg", [], P), true);
  assert.equal(origenPermitido("data:image/png;base64,AA", [], P), true);
  assert.equal(origenPermitido("blob:https://cafe.lamente.cl/x", [], P), true);
  assert.equal(origenPermitido("https://fotos.lamente.cl/f.jpg", ["https://fotos.lamente.cl"], P), true);
  assert.equal(origenPermitido("https://instagram.com/f.jpg", ["https://fotos.lamente.cl"], P), false);
  assert.equal(origenPermitido("//otro.cl/f.jpg", [], P), false);
  assert.equal(origenPermitido("javascript:x", [], P), false);
  assert.equal(origenPermitido("data:text/html,x", [], P), false);
  assert.equal(origenPermitido("", [], P), false);
});

test("rejillaParticulas guarda la proporción y el tope", () => {
  const r = rejillaParticulas(1600, 900, 10000);
  assert.ok(r.columnas * r.filas <= 10000 && r.columnas * r.filas > 9000);
  assert.ok(Math.abs(r.columnas / r.filas - 16 / 9) < 0.05);
  assert.deepEqual(rejillaParticulas(0, 900, 10000), { columnas: 1, filas: 1 });
  assert.deepEqual(rejillaParticulas(NaN, NaN, 4000), { columnas: 1, filas: 1 });
});
