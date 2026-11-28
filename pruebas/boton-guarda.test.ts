// BotonQueGuarda: el texto de cada estado y cuánto dura el «✓ Guardado» y el «No se pudo».
import { test } from "node:test";
import assert from "node:assert/strict";
import { DURA, textoGuardar } from "../src/interfaz/guardar";

const T = { guardando: "Guardando…", bien: "✓ Guardado", mal: "No se pudo" };

test("guardar: los textos", () => {
  assert.equal(textoGuardar("listo", "Guardar", T), "Guardar");
  assert.equal(textoGuardar("guardando", "Guardar", T), "Guardando…");
  assert.equal(textoGuardar("bien", "Guardar", T), "✓ Guardado");
  assert.equal(textoGuardar("mal", "Guardar", T), "No se pudo");
});

test("guardar: las duraciones", () => {
  assert.deepEqual(DURA, { bien: 1600, mal: 2000 });
});
