// Esfera: una esfera de puntos que flota y, al bajar, suelta sus puntos para rodear lo que se ve. Lo calculable, sin
// navegador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PUNTOS_ESFERA, avancePunto, colorDe, contorno, disolucion, lugarEsfera, objetivosPagina, proyectar, puntosEsfera, reparto } from "../src/relatos/esfera/calculo-esfera";

type P = { x: number; y: number };
const numeros = (v: unknown): number[] => (typeof v === "number" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(numeros) : []);
const lejos = (p: P, c: { izquierda: number; arriba: number; ancho: number; alto: number }) =>
  Math.hypot(Math.max(c.izquierda - p.x, 0, p.x - (c.izquierda + c.ancho)), Math.max(c.arriba - p.y, 0, p.y - (c.arriba + c.alto)));

test("esfera: la bola tiene sus puntos en la superficie, repartidos", () => {
  const ps = puntosEsfera(PUNTOS_ESFERA);
  // Muchos y chicos (Aquiles: «pueden ser más pequeños y más»), y que alcancen para toda la página.
  assert.equal(PUNTOS_ESFERA, 400);
  assert.equal(ps.length, 400);
  for (const p of ps) assert.ok(Math.abs(Math.hypot(p.x, p.y, p.z) - 1) < 1e-9);
  const arriba = ps.filter((p) => p.y > 0).length;
  assert.ok(Math.abs(arriba - 200) <= 2, `${arriba} arriba`);
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) assert.ok(Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y, ps[i].z - ps[j].z) >= 0.1, `los puntos ${i} y ${j} están pegados`);
});

test("esfera: los de atrás se ven más chicos y tenues", () => {
  const adelante = proyectar({ x: 0, y: 0, z: 1 }, 0, 0);
  const atras = proyectar({ x: 0, y: 0, z: -1 }, 0, 0);
  assert.ok(adelante.tamano > atras.tamano && adelante.alfa > atras.alfa);
  for (const q of [adelante, atras]) {
    assert.ok(q.alfa >= 0.25 && q.alfa <= 1 && q.tamano >= 0.8 && q.tamano <= 2);
  }
  // Girar media vuelta pone adelante lo de atrás.
  const girado = proyectar({ x: 0, y: 0, z: -1 }, Math.PI, 0);
  assert.ok(Math.abs(girado.tamano - adelante.tamano) < 1e-9);
});

test("esfera: el lugar", () => {
  for (const [ancho, alto] of [[390, 844], [1400, 900], [320, 568]]) {
    const d = lugarEsfera("derecha", ancho, alto);
    const i = lugarEsfera("izquierda", ancho, alto);
    const c = lugarEsfera("centro", ancho, alto);
    for (const l of [d, i, c]) {
      assert.ok(l.radio >= 40 && l.radio <= 110 && l.radio <= ancho / 2 - 24, `${ancho}: radio ${l.radio}`);
      assert.equal(l.y, alto / 2);
    }
    assert.ok(d.x + d.radio <= ancho - 12 && d.x > ancho / 2);
    assert.ok(i.x - i.radio >= 12 && i.x < ancho / 2);
    assert.ok(Math.abs(d.x - (ancho - i.x)) < 1e-9, "derecha e izquierda no son simétricas");
    assert.equal(c.x, ancho / 2);
  }
});

test("esfera: el contorno va por fuera de la caja, parejo", () => {
  const caja = { izquierda: 40, arriba: 100, ancho: 300, alto: 120 };
  const ps = contorno(caja, 6, 10);
  assert.ok(ps.length >= 70 && ps.length <= 90, `${ps.length} puntos`);
  for (const p of ps) assert.ok(Math.abs(lejos(p, caja) - 6) <= 0.5, `un punto a ${lejos(p, caja).toFixed(2)} de la caja`);
  const pasos = ps.map((p, i) => Math.hypot(p.x - ps[(i + 1) % ps.length].x, p.y - ps[(i + 1) % ps.length].y));
  assert.ok(pasos.every((d) => d >= 7 && d <= 13), `pasos de ${Math.min(...pasos).toFixed(1)} a ${Math.max(...pasos).toFixed(1)}`);
});

test("esfera: se disuelve en la primera media pantalla, cada punto a su ritmo", () => {
  const vista = 800;
  assert.equal(disolucion(0, vista), 0);
  assert.equal(disolucion(-50, vista), 0);
  assert.equal(disolucion(400, vista), 1);
  assert.equal(disolucion(5000, vista), 1);
  const medio = disolucion(200, vista);
  assert.ok(medio > 0 && medio < 1);
  // Una página corta (que solo deja bajar 120 px) se disuelve del todo al terminar de bajar.
  assert.equal(disolucion(120, vista, 120), 1);
  assert.ok(disolucion(60, vista, 120) > 0.4 && disolucion(60, vista, 120) < 0.6);
  // Con un tope raro, como sin tope.
  assert.equal(disolucion(400, vista, NaN), 1);
  assert.equal(disolucion(400, vista, 0), 1);
  // Cada punto avanza a su ritmo: todos parten en 0 y terminan en 1, sin volver atrás, y no todos a la vez.
  const n = 400;
  for (let i = 0; i < n; i += 37) {
    const av = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map((d) => avancePunto(d, i, n));
    assert.equal(av[0], 0);
    assert.equal(av.at(-1), 1);
    assert.ok(av.every((v, k) => k === 0 || v >= av[k - 1]), `el punto ${i} vuelve atrás`);
  }
  const aMedias = Array.from({ length: n }, (_, i) => avancePunto(0.4, i, n));
  assert.ok(aMedias.some((v) => v < 0.2), "todos parten a la vez");
  assert.ok(aMedias.some((v) => v > 0.6), "ninguno avanzó");
});

test("esfera: los puntos se reparten por los bloques de toda la página", () => {
  const ancho = 390;
  const bloques = [
    // Un bloque con tarjetas: los puntos van a su contorno.
    { caja: { izquierda: 0, arriba: 0, ancho, alto: 600 }, marcos: [{ izquierda: 20, arriba: 100, ancho: 160, alto: 140 }, { izquierda: 210, arriba: 100, ancho: 160, alto: 140 }], entera: false },
    // Uno sin nada que rodear: van a su borde, por dentro.
    { caja: { izquierda: 0, arriba: 600, ancho, alto: 400 }, marcos: [], entera: false },
    // Uno que es todo contenido (una foto de fondo): ahí no va nada.
    { caja: { izquierda: 0, arriba: 1000, ancho, alto: 400 }, marcos: [], entera: true },
    { caja: { izquierda: 0, arriba: 1400, ancho, alto: 500 }, marcos: [{ izquierda: 30, arriba: 1500, ancho: 330, alto: 60 }], entera: false },
  ];
  const ps = objetivosPagina(bloques, PUNTOS_ESFERA);
  assert.ok(ps.length >= 300 && ps.length <= PUNTOS_ESFERA, `${ps.length} objetivos`);
  const de = (k: number) => ps.filter((p) => p.y >= bloques[k].caja.arriba && p.y < bloques[k].caja.arriba + bloques[k].caja.alto);
  assert.ok(de(0).length > 20 && de(1).length > 20 && de(3).length > 10, "un bloque se quedó sin puntos");
  assert.equal(de(2).length, 0, "hay puntos sobre la foto de fondo");
  // En el bloque con tarjetas, a 10 px por fuera de alguna; en el que no tiene, cerca de su borde, por dentro.
  for (const p of de(0)) assert.ok(Math.min(...bloques[0].marcos.map((m) => Math.abs(lejos(p, m) - 10))) < 0.6);
  // Todos los objetivos son de un bloque que no es entero.
  assert.ok(ps.every((p) => p.b !== 2));
  const b1 = bloques[1].caja;
  for (const p of de(1)) {
    const borde = Math.min(p.x - b1.izquierda, b1.izquierda + b1.ancho - p.x, p.y - b1.arriba, b1.arriba + b1.alto - p.y);
    assert.ok(borde >= 8 && borde <= 16, `un punto del borde a ${borde.toFixed(1)} px`);
  }
  assert.deepEqual(objetivosPagina(bloques, PUNTOS_ESFERA), ps);
  assert.deepEqual(objetivosPagina([], PUNTOS_ESFERA), []);
  // Cada objetivo dice de qué bloque es (para correrlo con él mientras entra).
  for (const p of ps) {
    const c = bloques[p.b].caja;
    assert.ok(p.y >= c.arriba - 12 && p.y <= c.arriba + c.alto + 12, "un objetivo dice ser de otro bloque");
  }
  // Una foto de lado a lado: su contorno no se sale de la página (los costados quedan a 4 px del borde, por dentro).
  const ancha = objetivosPagina([{ caja: { izquierda: 0, arriba: 0, ancho, alto: 400 }, marcos: [{ izquierda: 0, arriba: 60, ancho, alto: 260 }], entera: false }], PUNTOS_ESFERA);
  assert.ok(ancha.length > 50 && ancha.every((p) => p.x >= 4 && p.x <= ancho - 4), "el contorno de una foto de lado a lado se sale de la página");
});

test("esfera: el reparto", () => {
  assert.ok(reparto(150, []).every((x) => x === null));
  const pocos = Array.from({ length: 30 }, (_, i) => ({ x: i, y: 0 }));
  const r = reparto(150, pocos);
  assert.equal(r.length, 150);
  const cuenta = new Map<number, number>();
  for (const p of r) cuenta.set(p!.x, (cuenta.get(p!.x) ?? 0) + 1);
  assert.equal(cuenta.size, 30);
  assert.ok([...cuenta.values()].every((n) => n === 5), "un objetivo recibe más que otro");
  const muchos = Array.from({ length: 600 }, (_, i) => ({ x: i, y: 0 }));
  const m = reparto(150, muchos);
  const xs = m.map((p) => p!.x);
  assert.equal(new Set(xs).size, 150);
  assert.ok(Math.min(...xs) < 8 && Math.max(...xs) > 590, "no reparte por toda la lista");
  assert.deepEqual(reparto(150, muchos), m);
});

test("esfera: sobre un fondo donde el acento se pierde, el punto toma el color del texto del bloque", () => {
  const verde = "rgb(46, 125, 50)";
  const bloques = [
    { caja: { izquierda: 0, arriba: 0, ancho: 390, alto: 500 }, fondo: "rgb(255, 255, 255)", texto: "rgb(29, 29, 27)" },
    { caja: { izquierda: 0, arriba: 500, ancho: 390, alto: 400 }, fondo: verde, texto: "rgb(255, 255, 255)" },
    { caja: { izquierda: 0, arriba: 900, ancho: 390, alto: 300 }, fondo: "", texto: "rgb(0, 0, 0)" },
  ];
  assert.equal(colorDe(verde, bloques, { x: 100, y: 200 }), verde);
  assert.equal(colorDe(verde, bloques, { x: 100, y: 700 }), "rgb(255, 255, 255)");
  // Sin fondo que leer, o fuera de los bloques: el acento.
  assert.equal(colorDe(verde, bloques, { x: 100, y: 1000 }), verde);
  assert.equal(colorDe(verde, bloques, { x: 100, y: 5000 }), verde);
  assert.equal(colorDe(verde, [], { x: 1, y: 1 }), verde);
});

test("esfera: medidas raras no la botan", () => {
  for (const v of [NaN, 0, -5, Infinity]) {
    assert.ok(numeros(lugarEsfera("derecha", v, 800)).every(Number.isFinite));
    assert.ok(numeros(lugarEsfera("centro", 390, v)).every(Number.isFinite));
    assert.ok(numeros(contorno({ izquierda: v, arriba: 0, ancho: 100, alto: 50 }, 6, 10)).every(Number.isFinite));
    assert.ok(numeros(contorno({ izquierda: 0, arriba: 0, ancho: v, alto: 50 }, 6, 10)).every(Number.isFinite));
    assert.ok(Number.isFinite(disolucion(v, 800)) && Number.isFinite(disolucion(100, v)) && Number.isFinite(avancePunto(v, 3, 400)));
    assert.ok(numeros(puntosEsfera(v)).every(Number.isFinite));
  }
  assert.ok(numeros(reparto(150, [{ x: NaN, y: 1 }, null as never])).every(Number.isFinite));
  assert.equal(puntosEsfera(0).length, 0);
});
