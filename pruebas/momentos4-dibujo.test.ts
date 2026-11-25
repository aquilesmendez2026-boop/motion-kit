// Con el dedo: lo que se dibuja la primera vez (en el servidor, o antes de que el teléfono diga qué día es).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import CuponQueSeArranca from "../src/momentos/CuponQueSeArranca";

test("cupón: el código no viaja en el primer dibujo (el servidor no sabe si venció)", () => {
  // En quieto el código va a la vista, pero recién cuando el teléfono confirma que no venció.
  const html = renderToString(createElement(CuponQueSeArranca, { nivel: "quieto", titulo: "Desayuno a mitad de precio", codigo: "VIEJO50", vence: "2020-01-01" }));
  assert.match(html, /Desayuno a mitad de precio/);
  assert.ok(!html.includes("VIEJO50"), "el código de un cupón vencido salió en el primer dibujo");
});
