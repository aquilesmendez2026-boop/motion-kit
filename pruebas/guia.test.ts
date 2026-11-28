// La guía: dónde va la mano (y hacia dónde apunta), dónde va el globo y el recorte, para un elemento en cualquier lugar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PUNTA_MANO } from "../src/comic/calculo";
import { ubicar, type Rect } from "../src/comic/ubicar";

const M = { mano: 150, globo: 300, altoGlobo: 190 };
const punta = (u: ReturnType<typeof ubicar>) => ({ x: u.mano.x + PUNTA_MANO[u.mano.direccion].x * M.mano, y: u.mano.y + PUNTA_MANO[u.mano.direccion].y * M.mano });
/** La caja que ocupa la mano ya girada. */
const cajaMano = (u: ReturnType<typeof ubicar>): Rect => {
  const W = M.mano;
  const vertical = u.mano.direccion === "arriba" || u.mano.direccion === "abajo";
  return vertical ? { x: u.mano.x + W / 4, y: u.mano.y - W / 4, w: W / 2, h: W } : { x: u.mano.x, y: u.mano.y, w: W, h: W / 2 };
};
const dentro = (r: Rect, v: { w: number; h: number }, m = 8) => r.x >= m - 0.5 && r.y >= m - 0.5 && r.x + r.w <= v.w - m + 0.5 && r.y + r.h <= v.h - m + 0.5;

test("guia: con espacio, la mano a la izquierda", () => {
  const o = { x: 500, y: 300, w: 120, h: 44 };
  const u = ubicar(o, { w: 1280, h: 860 }, M);
  assert.equal(u.mano.direccion, "derecha");
  const p = punta(u);
  assert.ok(Math.abs(p.x - o.x) <= 2, `punta x ${p.x}`);
  assert.ok(Math.abs(p.y - (o.y + o.h / 2)) <= 1, `punta y ${p.y}`);
  assert.deepEqual(u.foco, { x: 494, y: 294, w: 132, h: 56 });
});

test("guia: pegado a la izquierda, la mano abajo apuntando arriba", () => {
  const o = { x: 10, y: 200, w: 200, h: 44 };
  const u = ubicar(o, { w: 390, h: 844 }, M);
  assert.equal(u.mano.direccion, "arriba");
  const p = punta(u);
  assert.ok(Math.abs(p.y - (o.y + o.h)) <= 3, `punta y ${p.y}`);
  assert.ok(p.x > o.x && p.x < o.x + o.w, `punta x ${p.x}`);
  assert.equal(u.globo.cola, "arriba");
});

test("guia: pegado abajo, la mano encima apuntando abajo y el globo arriba", () => {
  const o = { x: 10, y: 760, w: 200, h: 44 };
  const u = ubicar(o, { w: 390, h: 844 }, M);
  assert.equal(u.mano.direccion, "abajo");
  const p = punta(u);
  assert.ok(Math.abs(p.y - o.y) <= 3, `punta y ${p.y}`);
  assert.equal(u.globo.cola, "abajo");
  assert.ok(u.globo.y + M.altoGlobo <= cajaMano(u).y + 1, "el globo va encima de la mano");
});

test("guia: todo queda dentro de la vista", () => {
  const v = { w: 390, h: 844 };
  for (let i = 0; i < 40; i++) {
    const o = { x: (i % 5) * 67, y: Math.floor(i / 5) * 100, w: 120, h: 44 };
    const u = ubicar(o, v, M);
    assert.ok(dentro(cajaMano(u), v), `mano fuera para ${JSON.stringify(o)}: ${JSON.stringify(cajaMano(u))}`);
    assert.ok(dentro({ x: u.globo.x, y: u.globo.y, w: M.globo, h: M.altoGlobo }, v), `globo fuera para ${JSON.stringify(o)}`);
  }
});

test("guia: medidas raras no la botan", () => {
  for (const o of [{ x: NaN, y: 0, w: 10, h: 10 }, { x: 0, y: 0, w: 0, h: 0 }, { x: -50, y: -50, w: 2000, h: 2000 }]) {
    const u = ubicar(o, { w: 390, h: 844 }, M);
    for (const n of [u.mano.x, u.mano.y, u.globo.x, u.globo.y, u.foco.x, u.foco.w]) assert.ok(Number.isFinite(n), JSON.stringify(u));
  }
  assert.doesNotThrow(() => ubicar({ x: 0, y: 0, w: 10, h: 10 }, { w: NaN, h: 0 }, M));
});

test("guia: con el teclado abierto, todo queda en la parte visible", async () => {
  const { ubicarVisible } = await import("../src/comic/ubicar");
  // Pantalla de 390 × 844; el teclado deja visibles los primeros 400 px (y la página está corrida 0).
  const visible = { x: 0, y: 0, w: 390, h: 400 };
  const o = { x: 20, y: 300, w: 200, h: 44 };
  const u = ubicarVisible(o, visible, M);
  assert.ok(u.globo.y >= 8 && u.globo.y + M.altoGlobo <= 400 - 8 + 0.5, `globo fuera de lo visible: ${u.globo.y}`);
  // Con lo visible corrido (iOS sube la vista al enfocar): coordenadas de la ventana, dentro de la franja visible.
  const corrida = { x: 0, y: 250, w: 390, h: 400 };
  const u2 = ubicarVisible({ x: 20, y: 500, w: 200, h: 44 }, corrida, M);
  assert.ok(u2.globo.y >= 250 + 8 - 0.5 && u2.globo.y + M.altoGlobo <= 650 - 8 + 0.5, `globo fuera de la franja corrida: ${u2.globo.y}`);
});
