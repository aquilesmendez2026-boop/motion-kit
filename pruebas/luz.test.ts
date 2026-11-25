// Luz y materia: lo calculable de la luz de página (dónde está, la luz de la hora y la sombra que deja cada altura).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALTURA_MAX, RANGO, REPOSO, inclinacionEnPantalla, limpiarLuz, luzAhora, luzDeLaHora, sombraDe } from "../src/luz/calculo-luz";

test("la luz ahora es el reposo más lo que la persona la movió, dentro de su rango", () => {
  assert.deepEqual(luzAhora(REPOSO, { x: 1, y: 1 }, 0.35), { x: -0.1, y: -0.45 });
  assert.deepEqual(luzAhora(REPOSO, { x: 0, y: 0 }, 0.35), REPOSO);
  // El rango va de 0 a 1 (5 se toma como 1). Y por mucho que se mueva, la luz no cruza al otro lado de su reposo
  // ni viene de abajo: las sombras no cambian de lado.
  assert.deepEqual(luzAhora(REPOSO, { x: 1, y: 1 }, 5), { x: 0, y: -0.05 });
  assert.deepEqual(luzAhora({ x: 0.5, y: -0.6 }, { x: -1, y: -1 }, 1), { x: 0, y: -1 });
  assert.deepEqual(luzAhora({ x: 0.9, y: -0.9 }, { x: 1, y: -1 }, 1), { x: 1, y: -1 });
  assert.deepEqual(luzAhora(REPOSO, { x: 1, y: 1 }, -3), REPOSO);
  // Lo que no es número no mueve nada.
  assert.deepEqual(luzAhora(REPOSO, { x: NaN, y: Infinity }, 0.35), REPOSO);
  assert.deepEqual(luzAhora(REPOSO, { x: 1, y: 1 }, NaN), luzAhora(REPOSO, { x: 1, y: 1 }, RANGO));
  assert.deepEqual(luzAhora(REPOSO, null as never, 0.35), REPOSO);
});

test("con los valores por defecto, moverla nunca cambia de lado a las sombras", () => {
  for (let x = -1; x <= 1; x += 0.25)
    for (let y = -1; y <= 1; y += 0.25) {
      const l = luzAhora(REPOSO, { x, y }, RANGO);
      assert.ok(l.x < 0 && l.y < 0, `señal ${x}, ${y}: ${JSON.stringify(l)}`);
    }
});

test("con la luz de cualquier hora, moverla tampoco cambia de lado a las sombras ni la deja venir de abajo", () => {
  for (let h = 0; h < 24; h += 0.5) {
    const reposo = luzDeLaHora(new Date(2026, 10, 24, Math.floor(h), (h % 1) * 60));
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [0, 1]]) {
      const l = luzAhora(reposo, { x: sx, y: sy }, RANGO);
      assert.ok(l.y <= -0.05, `a las ${h}: y ${l.y}`);
      // Con el sol alto (casi sin lado) la sombra puede moverse a los dos lados; si no, se queda en el suyo.
      if (Math.abs(reposo.x) >= 0.1) assert.ok(Math.sign(l.x) === Math.sign(reposo.x) || l.x === 0, `a las ${h}: x ${reposo.x} → ${l.x}`);
    }
  }
});

test("la inclinación del teléfono se lleva a la pantalla según cómo está girado", () => {
  // De pie: de lado a lado es «x»; adelante y atrás (desde como se sostiene, unos 45°) es «y».
  assert.deepEqual(inclinacionEnPantalla(15, 45, 0), { x: 0.5, y: 0 });
  assert.deepEqual(inclinacionEnPantalla(0, 75, 0), { x: 0, y: 1 });
  // Acostado: los ejes del teléfono se cruzan con los de la pantalla.
  assert.deepEqual(inclinacionEnPantalla(-30, 15, 90), { x: 0.5, y: -0.5 });
  assert.deepEqual(inclinacionEnPantalla(30, -15, 270), { x: 0.5, y: -0.5 });
  assert.deepEqual(inclinacionEnPantalla(-15, -45, 180), { x: 0.5, y: 0 });
  // Siempre de -1 a 1, y con datos raros, quieta.
  assert.deepEqual(inclinacionEnPantalla(90, 180, 0), { x: 1, y: 1 });
  assert.deepEqual(inclinacionEnPantalla(NaN, null as never, 0), { x: 0, y: 0 });
  assert.deepEqual(inclinacionEnPantalla(15, 45, 33), inclinacionEnPantalla(15, 45, 0));
});

test("el reposo que se pasa se limpia: cada eje entre -1 y 1, y lo que no sirve cae al de siempre", () => {
  assert.deepEqual(limpiarLuz({ x: 0.3, y: -0.2 }), { x: 0.3, y: -0.2 });
  assert.deepEqual(limpiarLuz({ x: 7, y: -7 }), { x: 1, y: -1 });
  assert.deepEqual(limpiarLuz({ x: "0.3", y: null }), REPOSO);
  assert.deepEqual(limpiarLuz({ x: 0.5 }), { x: 0.5, y: REPOSO.y });
  for (const raro of [undefined, null, 3, "luz", [], NaN]) assert.deepEqual(limpiarLuz(raro), REPOSO);
});

test("la luz de la hora: en la mañana viene de la izquierda, en la tarde de la derecha y al mediodía de arriba", () => {
  const a = (h: number, m = 0) => luzDeLaHora(new Date(2026, 10, 24, h, m));
  assert.ok(a(8).x < -0.3, `8:00 ${JSON.stringify(a(8))}`);
  assert.ok(a(18).x > 0.3, `18:00 ${JSON.stringify(a(18))}`);
  assert.ok(Math.abs(a(13).x) < 0.2);
  // Al mediodía es cuando viene más de arriba (la «y» más negativa del día) y con más fuerza.
  for (const h of [7, 9, 11, 15, 17, 19]) {
    assert.ok(a(13).y < a(h).y, `13:00 más arriba que ${h}:00`);
    assert.ok(a(13).fuerza >= a(h).fuerza);
  }
  assert.equal(a(13).fuerza, 1);
  // De noche es tenue y fría; de día, cálida en las orillas y blanca al mediodía.
  assert.equal(a(2).fuerza, 0.6);
  assert.equal(a(23).fuerza, 0.6);
  assert.equal(a(13).tinte, "#ffffff");
  assert.notEqual(a(8).tinte, "#ffffff");
  assert.match(a(8).tinte, /^#[0-9a-f]{6}$/);
  assert.match(a(2).tinte, /^#[0-9a-f]{6}$/);
  // Siempre dentro de -1 a 1, y siempre de arriba.
  for (let h = 0; h < 24; h++)
    for (const m of [0, 30]) {
      const l = a(h, m);
      assert.ok(Math.abs(l.x) <= 1 && l.y < 0 && l.y >= -1 && l.fuerza >= 0.6 && l.fuerza <= 1, `${h}:${m} ${JSON.stringify(l)}`);
    }
  // La misma fecha da siempre lo mismo; una fecha que no sirve, la luz de siempre.
  assert.deepEqual(a(10, 20), a(10, 20));
  for (const mala of [new Date(NaN), null, "hoy", undefined]) assert.deepEqual(luzDeLaHora(mala as never), { ...REPOSO, tinte: "#ffffff", fuerza: 1 });
});

test("la sombra dice la altura: más arriba, más lejos, más grande y más clara, siempre al lado contrario de la luz", () => {
  assert.equal(ALTURA_MAX, 4);
  const luz = { x: -0.5, y: -0.8 };
  const en = (a: number) => sombraDe(luz, a);
  assert.deepEqual(en(0), { x: 0, y: 0, crece: 0, opacidad: 0 });
  for (let a = 1; a <= ALTURA_MAX; a++) {
    // La luz viene de arriba a la izquierda: la sombra cae abajo a la derecha.
    assert.ok(en(a).x > 0 && en(a).y > 0, `altura ${a}`);
    if (a > 1) {
      assert.ok(en(a).x > en(a - 1).x && en(a).y > en(a - 1).y, `más lejos en ${a}`);
      assert.ok(en(a).crece > en(a - 1).crece, `más grande en ${a}`);
      // Nunca asoma por el lado de la luz: crece menos de lo que se corre.
      assert.ok(en(a).crece < en(a).x && en(a).crece < en(a).y, `no asoma en ${a}`);
      assert.ok(en(a).opacidad < en(a - 1).opacidad && en(a).opacidad > 0.1, `más clara en ${a}`);
    }
  }
  // Con la luz al otro lado, la sombra cambia de lado.
  assert.ok(sombraDe({ x: 0.5, y: -0.8 }, 2).x < 0);
  // Alturas raras: se toman como la más cercana que existe.
  assert.deepEqual(en(99), en(4));
  assert.deepEqual(en(-3), en(0));
  assert.deepEqual(en(2.4), en(2));
  assert.deepEqual(en(NaN), en(1));
});

test("en el servidor (sin navegador) la luz se dibuja con su reposo, sin lanzar", async () => {
  const { renderToString } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { Luz } = await import("../src/luz/Luz");
  const html = renderToString(createElement(Luz, { sigue: ["puntero", "hora"], desde: { x: 0.3, y: -0.6 }, className: "mesa" }, "hola"));
  assert.match(html, /data-mk-luz/);
  assert.match(html, /--mk-l0x:0\.3/);
  assert.match(html, /--mk-l0y:-0\.6/);
  assert.match(html, /--mk-lx:var\(--mk-l0x\)/);
  assert.match(html, /class="mesa"/);
  // Sin la hora todavía (se mira después de montar, para que el servidor y el navegador dibujen lo mismo): la luz
  // es blanca y entera. Va escrito siempre, para que una luz adentro de otra no herede el tinte de la de afuera.
  assert.match(html, /--mk-luz-tinte:#fff/);
  assert.match(html, /--mk-luz-fuerza:1/);
  // Con datos raros tampoco lanza.
  assert.match(renderToString(createElement(Luz, { sigue: "todo" as never, rango: NaN, desde: 7 as never })), /--mk-l0x:-0\.45/);
});
