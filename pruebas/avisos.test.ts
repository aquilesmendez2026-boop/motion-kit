// Avisos (Toast): cuándo un deslizamiento cierra, cuál aviso sale cuando hay muchos y cuánto dura cada uno.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cierraDeslizando, duracionDe, quienSale } from "../src/interfaz/avisos";

test("avisos: deslizar cierra", () => {
  assert.equal(cierraDeslizando(80.1, 0), true);
  assert.equal(cierraDeslizando(79, 0.1), false);
  assert.equal(cierraDeslizando(30, 0.8), true);
  assert.equal(cierraDeslizando(10, 0.8), false);
  assert.equal(cierraDeslizando(-90, 0), true);
  assert.equal(cierraDeslizando(-30, -0.8), true);
  assert.equal(cierraDeslizando(NaN, NaN), false);
});

test("avisos: el de la acción se queda", () => {
  // La lista va del más antiguo al recién llegado (el último). Si alguno tiene acción, caben cuatro; si no, tres.
  const a = (conAccion: boolean) => ({ conAccion });
  assert.equal(quienSale([a(true), a(false), a(false), a(false)]), -1);
  assert.equal(quienSale([a(true), a(false), a(false), a(false), a(false)]), 1);
  assert.equal(quienSale([a(true), a(true), a(true), a(true)]), -1);
  assert.equal(quienSale([a(true), a(true), a(true), a(true), a(true)]), 0);
  assert.equal(quienSale([a(false), a(false), a(false)]), -1);
  assert.equal(quienSale([a(false), a(false), a(false), a(false)]), 0);
  assert.equal(quienSale([]), -1);
});

test("avisos: el recién llegado nunca sale", () => {
  const a = (conAccion: boolean) => ({ conAccion });
  // Tres «Deshacer» a la vista y llega un error: entra (caben cuatro).
  assert.equal(quienSale([a(true), a(true), a(true), a(false)]), -1);
  // Cuatro «Deshacer» y llega uno más sin acción: sale el más antiguo, no el que llegó.
  assert.equal(quienSale([a(true), a(true), a(true), a(true), a(false)]), 0);
});

test("avisos: duración", () => {
  assert.equal(duracionDe({}), 3200);
  assert.equal(duracionDe({ accion: { texto: "Deshacer", alHacer: () => {} } }), 6000);
  assert.equal(duracionDe({ duration: 1000, accion: { texto: "Deshacer", alHacer: () => {} } }), 1000);
});
