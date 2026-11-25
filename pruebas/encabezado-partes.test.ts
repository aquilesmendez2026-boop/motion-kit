// El encabezado marca sus partes (para que una partitura las encuentre) y puede ir sin su propia entrada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Encabezado } from "../src/encabezados/Encabezado";

const base = { titulo: "*Smash* burgers", antetitulo: "Desde 2019", bajada: "Pan brioche y papas a mano", boton: { texto: "Pedir", href: "#pedir" } };
const marca = (html: string, parte: string) => new RegExp(`data-mk-parte="${parte}"`).test(html);

test("encabezado: marca sus partes con data-mk-parte", () => {
  const html = renderToString(createElement(Encabezado, base));
  for (const parte of ["antetitulo", "titulo", "bajada", "botones", "contenido"]) assert.ok(marca(html, parte), `falta la marca «${parte}»`);
  // El título marcado es el h1, y sigue leyéndose entero.
  assert.match(html, /<h1[^>]*data-mk-parte="titulo"[^>]*aria-label="Smash burgers"|<h1[^>]*aria-label="Smash burgers"[^>]*data-mk-parte="titulo"/);
  // Sin antetítulo, bajada ni botón, esas marcas no están (no hay partes vacías).
  const solo = renderToString(createElement(Encabezado, { titulo: "Hola" }));
  assert.ok(marca(solo, "titulo") && marca(solo, "contenido"));
  for (const parte of ["antetitulo", "bajada", "botones"]) assert.ok(!marca(solo, parte), `sobra la marca «${parte}»`);
});

test("encabezado: la foto va marcada como «media» en las composiciones que la llevan", () => {
  for (const composicion of ["dividido", "tarjeta", "imagen"] as const) {
    assert.ok(marca(renderToString(createElement(Encabezado, { ...base, composicion, imagenes: ["/foto.jpg"] })), "media"), composicion);
  }
  // En «viñetas» son tres.
  const vinetas = renderToString(createElement(Encabezado, { ...base, composicion: "vinetas", imagenes: ["/a.jpg", "/b.jpg", "/c.jpg"] }));
  assert.equal((vinetas.match(/data-mk-parte="media"/g) ?? []).length, 3);
  // Todas las composiciones marcan su contenido una sola vez.
  for (const composicion of ["izquierda", "gigante", "poster", "letrero", "pantalla", "boleto", "marquesina"] as const) {
    const html = renderToString(createElement(Encabezado, { ...base, composicion }));
    assert.equal((html.match(/data-mk-parte="contenido"/g) ?? []).length, 1, composicion);
  }
});

test("encabezado: con sinEntrada no trae entrada propia (la pone la partitura)", () => {
  const con = renderToString(createElement(Encabezado, base));
  const sin = renderToString(createElement(Encabezado, { ...base, sinEntrada: true }));
  assert.match(con, /data-entrada="cascada"/);
  assert.match(sin, /data-entrada="ninguna"/);
  // Aunque se pida una entrada, sinEntrada manda.
  assert.match(renderToString(createElement(Encabezado, { ...base, entrada: "telon", sinEntrada: true })), /data-entrada="ninguna"/);
  // El atributo no se cuela al HTML.
  assert.ok(!/sinentrada/i.test(sin));
});
