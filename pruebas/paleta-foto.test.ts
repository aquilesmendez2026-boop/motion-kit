import { test } from "node:test";
import assert from "node:assert/strict";
import { paletaDesdePixeles } from "../src/receta/paletaDeFoto";

/** Una «foto» de `n` píxeles con colores en proporción: [["#rrggbb", 0.7], …]. */
function foto(colores: [string, number][], n = 4096): Uint8ClampedArray {
  const px = new Uint8ClampedArray(n * 4);
  let i = 0;
  for (const [hex, parte] of colores) {
    const [r, g, b] = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
    for (let c = 0; c < Math.round(n * parte) && i < n; c++, i++) px.set([r, g, b, 255], i * 4);
  }
  return px;
}

test("una foto verde bosque propone la paleta bosque", () => {
  const r = paletaDesdePixeles(foto([["#f3f7f2", 0.7], ["#2f6b3f", 0.3]]));
  assert.equal(r.paleta, "bosque");
  assert.ok(r.colores.length >= 2);
});

test("una foto de noche con amarillo propone noche y un tema que la usa", () => {
  const r = paletaDesdePixeles(foto([["#111418", 0.7], ["#f2c14e", 0.3]]));
  assert.equal(r.paleta, "noche");
  assert.equal(r.tema, "deco");
});

test("una foto toda blanca propone la clásica", () => {
  const r = paletaDesdePixeles(foto([["#ffffff", 1]]));
  assert.equal(r.paleta, "clasica");
  assert.equal(r.tema, "clasico");
});

test("los píxeles transparentes no cuentan", () => {
  const px = foto([["#111418", 0.7], ["#f2c14e", 0.3]]);
  const conHueco = new Uint8ClampedArray(px.length * 2);
  conHueco.set(px); // la segunda mitad queda en 0 (transparente)
  assert.equal(paletaDesdePixeles(conHueco).paleta, "noche");
});
