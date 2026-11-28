// Confirmar: el foco atrapado da la vuelta (Tab desde el último va al primero; Shift+Tab desde el primero, al último).
import { test } from "node:test";
import assert from "node:assert/strict";
import { siguienteFoco } from "../src/interfaz/foco";

const a = { n: "a" } as unknown as HTMLElement;
const b = { n: "b" } as unknown as HTMLElement;
const c = { n: "c" } as unknown as HTMLElement;
const afuera = { n: "x" } as unknown as Element;

test("foco: da la vuelta hacia adelante y hacia atrás", () => {
  assert.equal(siguienteFoco([a, b, c], a, false), b);
  assert.equal(siguienteFoco([a, b, c], c, false), a);
  assert.equal(siguienteFoco([a, b, c], a, true), c);
  assert.equal(siguienteFoco([a, b, c], b, true), a);
  // Desde afuera (o nada enfocado): al primero, o al último si va hacia atrás.
  assert.equal(siguienteFoco([a, b, c], afuera, false), a);
  assert.equal(siguienteFoco([a, b, c], null, true), c);
});

test("foco: sin enfocables, undefined", () => {
  assert.equal(siguienteFoco([], a, false), undefined);
  assert.equal(siguienteFoco([], null, true), undefined);
});
