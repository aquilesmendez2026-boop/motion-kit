// Cargando: qué se muestra en cada momento (nada, el esqueleto o el contenido), para que no parpadee.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ESPERA, MINIMO, fase } from "../src/interfaz/carga";

const f = (ahora: number, listoEn: number | null, esqueletoDesde: number | null = null, yaMostro = false) =>
  fase({ ahora, listoEn, esqueletoDesde, yaMostro });

test("cargando: los tiempos", () => {
  assert.equal(ESPERA, 150);
  assert.equal(MINIMO, 300);
});

test("cargando: rápido no parpadea", () => {
  assert.equal(f(50, null), "nada");
  assert.equal(f(100, 100), "contenido");
});

test("cargando: lento muestra el esqueleto", () => {
  assert.equal(f(149, null), "nada");
  assert.equal(f(150, null), "esqueleto");
  assert.equal(f(200, null), "esqueleto");
});

test("cargando: el esqueleto dura al menos 300", () => {
  assert.equal(f(300, 200, 150), "esqueleto");
  assert.equal(f(449, 200, 150), "esqueleto");
  assert.equal(f(450, 200, 150), "contenido");
  // Si llegó después de los 300, al tiro.
  assert.equal(f(900, 900, 150), "contenido");
});

test("cargando: listo al montar", () => {
  assert.equal(f(0, 0), "contenido");
});

test("cargando: refrescar no vuelve", () => {
  assert.equal(f(5000, null, 150, true), "contenido");
  assert.equal(f(10, null, null, true), "contenido");
});
