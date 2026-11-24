// Fondos de lienzo de la segunda tanda: lo calculable de cada uno, y que la receta y el contrato los conozcan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cantidadFondo } from "../src/efectos/lienzo";
import { crearBandada, pasoBandada } from "../src/efectos/fondos/calculo-bandada";
import { crearLuces, pasoLuces, brilloLuz } from "../src/efectos/fondos/calculo-luciernagas";
import { rumbo, crearTrazos, pasoTrazos, alargarCola } from "../src/efectos/fondos/calculo-corrientes";
import { ajustarCantidad } from "../src/efectos/fondos/fondo";
import { pasoGotas, radioGota, fuerzaGota, gotaSola } from "../src/efectos/fondos/calculo-gotas";
import { alturaRelieve } from "../src/efectos/fondos/calculo-relieve";
import { validarReceta } from "../src/receta/receta";
import { EFECTOS } from "../src/efectos/registro";

const NUEVOS = ["bandada", "luciernagas", "corrientes", "gotas", "relieve"] as const;

test("bandada: adentro, con rapidez acotada, repetible y esquiva al dedo", () => {
  const a = crearBandada(30, 400, 300, 3);
  assert.deepEqual(a, crearBandada(30, 400, 300, 3));
  assert.equal(a.length, 30);
  for (let i = 0; i < 600; i++) pasoBandada(a, 1 / 30, 400, 300);
  for (const p of a) {
    const v = Math.hypot(p.vx, p.vy);
    assert.ok(p.x >= 0 && p.x <= 400 && p.y >= 0 && p.y <= 300 && v >= 29 && v <= 91, JSON.stringify(p));
  }
  const uno = [{ x: 100, y: 100, vx: 40, vy: 0 }];
  pasoBandada(uno, 1 / 30, 400, 300, { x: 130, y: 100 });
  assert.ok(uno[0].vx < 40, "frena o se devuelve ante el dedo");
  pasoBandada([], 1 / 30, 0, 0);
  // Un ave detenida o con números rotos no rompe a las demás.
  const rara = [{ x: 10, y: 10, vx: 0, vy: 0 }, { x: 12, y: 10, vx: 50, vy: 0 }];
  for (let i = 0; i < 30; i++) pasoBandada(rara, 1 / 30, 400, 300);
  for (const p of rara) assert.ok(Number.isFinite(p.x + p.y + p.vx + p.vy), JSON.stringify(p));
});

test("cantidadFondo: menos en pantallas angostas y en la versión quieta", () => {
  assert.equal(cantidadFondo(2, 1280, [10, 20, 30]), 20);
  assert.equal(cantidadFondo(9, 390, [10, 20, 30], true), 4);
  assert.equal(cantidadFondo(3, 390, [10, 20, 30]), 18);
});

test("luciérnagas: repetibles, adentro, lentas, con brillo de 0 a 1 y encendidas junto al dedo", () => {
  const l = crearLuces(24, 400, 300, 2);
  assert.deepEqual(l, crearLuces(24, 400, 300, 2));
  for (let i = 0; i < 600; i++) pasoLuces(l, 1 / 30, 400, 300);
  for (const p of l) {
    assert.ok(p.x >= 0 && p.x <= 400 && p.y >= 0 && p.y <= 300, JSON.stringify(p));
    assert.ok(Math.hypot(p.vx, p.vy) < 12, "deriva a menos de 12 px/s");
  }
  let minimo = 1;
  let maximo = 0;
  for (let i = 0; i < 200; i++) {
    const b = brilloLuz(l[i % l.length], i * 0.137);
    assert.ok(b >= 0 && b <= 1, String(b));
    minimo = Math.min(minimo, b);
    maximo = Math.max(maximo, b);
  }
  assert.ok(minimo < 0.1 && maximo > 0.9, "se apagan y se encienden");
  for (let i = 0; i < 20; i++) assert.equal(brilloLuz(l[0], i * 0.31, { x: l[0].x + 60, y: l[0].y }), 1);
  assert.ok(brilloLuz(l[0], 0, { x: l[0].x + 500, y: l[0].y }) === brilloLuz(l[0], 0), "lejos del dedo no cambia");
});

test("corrientes: el rumbo es finito, repetible y rodea al dedo; los trazos siguen adentro y renacen", () => {
  for (let i = 0; i < 100; i++) {
    const a = rumbo(i * 13.7, i * 7.1, i * 0.21);
    assert.ok(Number.isFinite(a));
    assert.equal(a, rumbo(i * 13.7, i * 7.1, i * 0.21));
  }
  assert.notEqual(rumbo(200, 150, 1, { x: 230, y: 150 }), rumbo(200, 150, 1));
  assert.equal(rumbo(200, 150, 1, { x: 900, y: 150 }), rumbo(200, 150, 1));
  const t = crearTrazos(40, 400, 300, 1);
  assert.deepEqual(t, crearTrazos(40, 400, 300, 1));
  let renacieron = 0;
  for (let i = 0; i < 900; i++) {
    const antes = t.map((q) => q.edad);
    pasoTrazos(t, 1 / 30, 400, 300, i / 30);
    t.forEach((q, j) => q.edad < antes[j] && renacieron++);
  }
  for (const q of t) assert.ok(q.x >= 0 && q.x <= 400 && q.y >= 0 && q.y <= 300 && q.edad < 6.1, JSON.stringify(q));
  assert.ok(renacieron >= 40 * 4, `renacen (${renacieron})`);
  pasoTrazos([], 1 / 30, 0, 0, 0);
});

test("gotas: envejecen y se van, el radio crece hasta 90 y la fuerza va de 1 a 0", () => {
  let g = [{ x: 10, y: 10, edad: 0 }, { x: 20, y: 20, edad: 2.3 }];
  g = pasoGotas(g, 0.2);
  assert.equal(g.length, 1);
  assert.ok(Math.abs(g[0].edad - 0.2) < 1e-9);
  assert.equal(pasoGotas([{ x: 0, y: 0, edad: 0.5 }], 0.6, 1).length, 0);
  let antes = -1;
  for (let e = 0; e <= 6; e += 0.1) {
    const r = radioGota(e);
    assert.ok(r > antes && r <= 90, `${e}: ${r}`);
    antes = r;
  }
  assert.equal(radioGota(-1), 0);
  assert.equal(fuerzaGota(0), 1);
  assert.equal(fuerzaGota(2.4), 0);
  assert.equal(fuerzaGota(9), 0);
  assert.ok(fuerzaGota(1.2) > 0.4 && fuerzaGota(1.2) < 0.6);
  for (let i = 0; i < 50; i++) {
    const s = gotaSola(i, 400, 300, 2);
    assert.deepEqual(s, gotaSola(i, 400, 300, 2));
    assert.ok(s.x >= 0 && s.x <= 400 && s.y >= 0 && s.y <= 300 && s.edad === 0);
  }
});

test("relieve: entre -1 y 1, repetible, suave y más alto bajo el dedo", () => {
  for (let i = 0; i < 400; i++) {
    const [x, y, t] = [i * 9.3, i * 5.7, i * 0.17];
    const h = alturaRelieve(x, y, t);
    assert.ok(h >= -1 && h <= 1, String(h));
    assert.equal(h, alturaRelieve(x, y, t));
    assert.ok(Math.abs(alturaRelieve(x + 4, y, t) - h) < 0.15, "suave");
    const dedo = { x: x + 30, y: y - 20 };
    const conDedo = alturaRelieve(x, y, t, dedo);
    assert.ok(conDedo >= h && conDedo <= 1, `${h} → ${conDedo}`);
    assert.ok(Math.abs(alturaRelieve(x + 4, y, t, dedo) - conDedo) < 0.15, "suave también junto al dedo");
  }
  assert.ok(Math.abs(alturaRelieve(100, 100, 3, { x: 100, y: 100 }) - 1) < 1e-9, "justo bajo el dedo llega arriba");
  assert.equal(alturaRelieve(100, 100, 3, { x: 900, y: 100 }), alturaRelieve(100, 100, 3));
});

test("la receta acepta los cinco fondos nuevos, el contrato los lista y el registro los carga aparte", () => {
  const contrato = JSON.parse(readFileSync("contrato/encabezado-motionkit.json", "utf8"));
  const registro = readFileSync("src/efectos/registro.ts", "utf8");
  for (const efecto of NUEVOS) {
    assert.ok(validarReceta({ version: 2, estilo: "neon", titulo: "Hola", efecto, variante: 3 }).ok, efecto);
    assert.ok(contrato.listas.efecto.includes(efecto), `contrato: ${efecto}`);
    assert.equal(EFECTOS[efecto].familia, "fondo");
    assert.ok(new RegExp(`${efecto}: \\{[^}]*import\\("\\./fondos/`).test(registro), `aparte: ${efecto}`);
  }
});

test("cada fondo nuevo queda con el rubro y el ánimo del diseño", () => {
  const diseno: Record<(typeof NUEVOS)[number], [string, string]> = {
    bandada: ["otro", "vistoso"],
    luciernagas: ["comida", "sobrio"],
    corrientes: ["belleza", "sobrio"],
    gotas: ["salud", "sobrio"],
    relieve: ["clases", "sobrio"],
  };
  for (const id of NUEVOS) assert.deepEqual([EFECTOS[id].rubros.join(","), EFECTOS[id].animo], diseno[id], id);
});

test("luciérnagas: pasean, no dan vueltas al mismo círculo", () => {
  // En una caja enorme (sin dar la vuelta), a los 100 segundos casi todas se alejaron de donde partieron.
  const l = crearLuces(24, 2_000_000, 2_000_000, 2);
  const inicio = l.map((p) => [p.x, p.y]);
  for (let i = 0; i < 3000; i++) pasoLuces(l, 1 / 30, 2_000_000, 2_000_000);
  const lejos = l.filter((p, i) => Math.hypot(p.x - inicio[i][0], p.y - inicio[i][1]) > 200).length;
  assert.ok(lejos >= 20, `${lejos} de 24 se alejaron más de 200 px`);
  for (const p of l) assert.ok(Math.hypot(p.vx, p.vy) < 12);
});

test("corrientes: la cola de un trazo guarda sus últimos puntos, del más viejo al más nuevo", () => {
  const cola: number[] = [];
  for (let i = 0; i < 5; i++) alargarCola(cola, i, i * 10, 3);
  assert.deepEqual(cola, [2, 20, 3, 30, 4, 40]);
  alargarCola(cola, 9, 9, 1);
  assert.deepEqual(cola, [9, 9]);
});

test("ajustarCantidad: saca los que sobran y repone los que faltan (al volver de la versión quieta)", () => {
  const crear = (n: number) => Array.from({ length: n }, (_, i) => `nuevo-${i}`);
  assert.deepEqual(ajustarCantidad(["a", "b", "c"], 2, crear), ["a", "b"]);
  assert.deepEqual(ajustarCantidad(["a"], 3, crear), ["a", "nuevo-1", "nuevo-2"]);
  assert.deepEqual(ajustarCantidad(["a", "b"], 2, crear), ["a", "b"]);
  assert.deepEqual(ajustarCantidad([], 0, crear), []);
});

test("los fondos nuevos no usan Math.random ni dependencias", () => {
  for (const f of ["fondo.ts", "calculo-bandada.ts", "calculo-luciernagas.ts", "calculo-corrientes.ts", "calculo-gotas.ts", "calculo-relieve.ts", "Bandada.tsx", "Luciernagas.tsx", "Corrientes.tsx", "Gotas.tsx", "Relieve.tsx"]) {
    const s = readFileSync(`src/efectos/fondos/${f}`, "utf8");
    assert.ok(!s.includes("Math.random"), f);
    for (const m of s.matchAll(/from "([^"]+)"/g)) assert.ok(m[1].startsWith(".") || m[1] === "react", `${f}: ${m[1]}`);
  }
});
