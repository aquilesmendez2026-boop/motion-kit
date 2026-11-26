// Lo que llega: qué entra, sale y queda en una ListaViva, cuándo es la primera carga y el texto del contador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cambios, esPrimera, textoContador } from "../src/interfaz/lista";

test("lista: entra, sale y queda", () => {
  assert.deepEqual(cambios(["a", "b", "c"], ["d", "a", "c"]), {
    entran: ["d"],
    salen: [{ clave: "b", indice: 1 }],
    quedan: ["a", "c"],
  });
  assert.deepEqual(cambios([], ["a"]), { entran: ["a"], salen: [], quedan: [] });
  assert.deepEqual(cambios(["a"], []), { entran: [], salen: [{ clave: "a", indice: 0 }], quedan: [] });
});

test("lista: la primera no vacía no anima", () => {
  assert.equal(esPrimera([[]]), true);
  assert.equal(esPrimera([[], ["a"]]), true);
  assert.equal(esPrimera([[], ["a"], ["a", "b"]]), false);
  assert.equal(esPrimera([["a"]]), true);
  assert.equal(esPrimera([["a"], ["a", "b"]]), false);
});

test("lista: claves repetidas no la botan", () => {
  assert.doesNotThrow(() => cambios(["a", "a"], ["a", "b", "b"]));
  const r = cambios(["a", "a"], ["a", "b", "b"]);
  assert.deepEqual(r.entran, ["b"]);
});

test("contador: el texto", () => {
  assert.equal(textoContador(3, 99), "3");
  assert.equal(textoContador(120, 99), "99+");
  assert.equal(textoContador(-2, 99), "0");
  assert.equal(textoContador(NaN, 99), "0");
  assert.equal(textoContador(4.7, 99), "4");
});
