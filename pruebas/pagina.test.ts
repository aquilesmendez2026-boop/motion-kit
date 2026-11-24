import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validarPagina, normalizarPagina, relatoDeBloque, TOPES_PAGINA, type RecetaPagina } from "../src/relatos/receta-pagina";
import { textoContratoPagina } from "../src/relatos/contrato-pagina";
import { normalizarReceta } from "../src/receta/receta";
import { RELATOS_DE_PAGINA } from "../src/relatos/catalogo";

const enc = { version: 1, estilo: "neon", titulo: "Hola" };
const campos = (x: unknown) => {
  const r = validarPagina(x);
  assert.equal(r.ok, false, "tenía que fallar");
  return r.ok ? {} : Object.fromEntries(r.errores.map((e) => [e.campo, e.mensaje]));
};

test("una página mínima pasa", () => {
  const r = validarPagina({ version: 1, encabezado: enc });
  assert.ok(r.ok);
  assert.deepEqual(r.pagina.encabezado, normalizarReceta(enc));
  assert.ok(!("relato" in r.pagina));
  assert.equal(r.pagina.version, 1);
});

test("los errores del encabezado llevan su ruta", () => {
  const c = campos({ version: 1, encabezado: { version: 1, estilo: "neon" } });
  assert.match(c["encabezado.titulo"], /título/);
  assert.match(campos({ version: 1 })["encabezado"], /encabezado/);
  assert.match(campos({ version: 2, encabezado: enc })["version"], /1/);
});

test("hilo y luz solo como relato de página", () => {
  assert.match(campos({ version: 1, encabezado: enc, relato: "hilo" })["relato"], /relatoPagina/);
  assert.match(campos({ version: 1, encabezado: enc, bloques: [{ id: "carta", relato: "luz" }] })["bloques[0].relato"], /relatoPagina/);
  assert.ok(campos({ version: 1, encabezado: enc, relatoPagina: "escenas" })["relatoPagina"]);
  assert.ok(validarPagina({ version: 1, encabezado: enc, relato: "iris", relatoPagina: "hilo" }).ok);
});

test("impulso: solo como relato de página", () => {
  const r = validarPagina({ version: 1, encabezado: enc, relato: "pila", relatoPagina: "impulso" });
  assert.ok(r.ok);
  assert.equal(r.ok && r.pagina.relatoPagina, "impulso");
  assert.match(campos({ version: 1, encabezado: enc, relato: "impulso" })["relato"], /«impulso» es un relato de página: va en relatoPagina\./);
  assert.match(campos({ version: 1, encabezado: enc, bloques: [{ id: "carta", relato: "impulso" }] })["bloques[0].relato"], /relatoPagina/);
  assert.equal(normalizarPagina({ version: 1, encabezado: enc, relatoPagina: "impulso" }).relatoPagina, "impulso");
  // El mensaje de un relato de página que no existe los nombra todos.
  const mal = campos({ version: 1, encabezado: enc, relatoPagina: "nada" })["relatoPagina"];
  for (const id of RELATOS_DE_PAGINA) assert.ok(mal.includes(`«${id}»`), `el mensaje nombra «${id}»: ${mal}`);
});

test("estela: va prendida o apagada", () => {
  const r = validarPagina({ version: 1, encabezado: enc, estela: true, relatoPagina: "impulso" });
  assert.ok(r.ok);
  assert.equal(r.ok && r.pagina.estela, true);
  assert.ok(validarPagina({ version: 1, encabezado: enc, estela: false }).ok);
  assert.equal(campos({ version: 1, encabezado: enc, estela: "si" })["estela"], "«estela» va prendida (true) o apagada (false).");
  assert.ok(!("estela" in normalizarPagina({ version: 1, encabezado: enc, estela: false })), "apagada no se guarda");
  assert.ok(!("estela" in normalizarPagina({ version: 1, encabezado: enc, estela: "si" })), "lo que no es un sí no se guarda");
  const p = normalizarPagina({ version: 1, encabezado: enc, estela: true });
  assert.equal(p.estela, true);
  assert.deepEqual(normalizarPagina(p), p, "normalizar es estable");
});

test("bloques: ids válidos, sin repetir, hasta 30", () => {
  assert.ok(campos({ version: 1, encabezado: enc, bloques: [{ id: "Carta!" }] })["bloques[0].id"]);
  assert.match(campos({ version: 1, encabezado: enc, bloques: [{ id: "carta" }, { id: "carta" }] })["bloques[1].id"], /repetido/);
  const muchos = Array.from({ length: TOPES_PAGINA.bloques + 1 }, (_, i) => ({ id: `b${i}` }));
  assert.ok(campos({ version: 1, encabezado: enc, bloques: muchos })["bloques"]);
  assert.ok(campos({ version: 1, encabezado: enc, bloques: [{ id: "carta", color: "rojo" }] })["bloques[0].color"]);
  assert.ok(campos({ version: 1, encabezado: enc, otro: 1 })["otro"]);
  assert.ok(validarPagina({ version: 1, encabezado: enc, bloques: [{ id: "carta", relato: "ninguno" }, { id: "galeria-fotos" }] }).ok);
});

test("relatoDeBloque", () => {
  const p = normalizarPagina({ version: 1, encabezado: { ...enc, estilo: "pelicula" }, bloques: [{ id: "carta", relato: "carrete" }, { id: "nada", relato: "ninguno" }] }) as RecetaPagina;
  assert.equal(relatoDeBloque(p, "carta"), "carrete");
  assert.equal(relatoDeBloque(p, "nada"), "ninguno");
  assert.equal(relatoDeBloque(p, "historia"), "cuento", "sin relato: el del estilo");
  assert.equal(relatoDeBloque({ ...p, relato: "iris" }, "historia"), "iris", "el de la página gana al del estilo");
});

test("normalizar nunca lanza y es estable", () => {
  for (const x of [null, [], 3, { bloques: "x" }, { encabezado: 5, relato: "hilo", bloques: [{ id: "A" }, 7] }]) {
    const p = normalizarPagina(x);
    assert.equal(p.version, 1);
    assert.equal(p.encabezado.version, 2);
    assert.deepEqual(normalizarPagina(p), p);
  }
  const p = normalizarPagina({ version: 1, encabezado: enc, relato: "hilo", relatoPagina: "luz", bloques: [{ id: "x", relato: "luz" }, { id: "x" }] });
  assert.ok(!("relato" in p), "hilo no vale como relato de bloque");
  assert.equal(p.relatoPagina, "luz");
  assert.deepEqual(p.bloques, [{ id: "x" }], "sin relato de página en un bloque y sin repetidos");
});

test("el contrato de página está al día", () => {
  const archivo = readFileSync("contrato/pagina-motionkit.json", "utf8");
  assert.equal(archivo, textoContratoPagina(), "Corre: npm run contrato");
  const c = JSON.parse(archivo);
  assert.equal(c.listas.relato.length, 8);
  assert.ok(c.listas.relato.includes("pila"));
  assert.deepEqual(c.listas.relatoPagina, ["hilo", "luz", "impulso"]);
  assert.ok(c.campos.includes("estela"));
  assert.match(c.$comentario, /estela/);
  assert.deepEqual(c.partes, ["linea", "foto", "tarjeta", "frase"]);
  assert.equal(c.relatoDeEstilo.neon, "pelicula");
  assert.equal(c.topes.bloques, 30);
});
