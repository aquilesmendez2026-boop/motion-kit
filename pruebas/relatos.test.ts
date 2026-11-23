import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RELATOS, RELATO_IDS, RELATOS_DE_BLOQUE, RELATOS_DE_PAGINA, RELATO_DE_ESTILO, PARTES_RELATO,
} from "../src/relatos/catalogo";
import { ESTILO_IDS } from "../src/estilos/estilos";
import { caminoHilo } from "../src/relatos/PaginaRelato";

test("hay 9 relatos: 7 de bloque y 2 de página", () => {
  assert.equal(RELATO_IDS.length, 9);
  assert.deepEqual(RELATOS_DE_BLOQUE, ["escenas", "pelicula", "cuento", "profundidad", "iris", "carrete", "subtitulos"]);
  assert.deepEqual(RELATOS_DE_PAGINA, ["hilo", "luz"]);
  for (const id of RELATOS_DE_BLOQUE) assert.equal(RELATOS[id].alcance, "bloque", id);
  for (const id of RELATOS_DE_PAGINA) assert.equal(RELATOS[id].alcance, "pagina", id);
});

test("cada ficha está completa", () => {
  for (const id of RELATO_IDS) {
    const f = RELATOS[id];
    assert.equal(f.id, id);
    for (const k of ["nombre", "descripcion", "completo", "liviano", "quieto"] as const) assert.ok(f[k].trim(), `${id}.${k}`);
    assert.ok(f.requiere.every((p) => PARTES_RELATO.includes(p)), `${id}.requiere`);
  }
});

test("lo que requiere cada relato", () => {
  const req = Object.fromEntries(RELATO_IDS.map((id) => [id, RELATOS[id].requiere]));
  assert.deepEqual(req, {
    escenas: [], pelicula: [], cuento: ["linea"], profundidad: ["tarjeta"], iris: [], carrete: ["foto", "tarjeta"],
    subtitulos: ["frase"], hilo: [], luz: [],
  });
});

test("el relato sugerido por estilo", () => {
  assert.deepEqual(RELATO_DE_ESTILO, { neon: "pelicula", pelicula: "cuento", rock: "escenas", anime: "profundidad", retro: "carrete" });
  assert.deepEqual(Object.keys(RELATO_DE_ESTILO).sort(), [...ESTILO_IDS].sort());
});

test("largo", () => {
  const largos = RELATO_IDS.filter((id) => RELATOS[id].largo);
  assert.deepEqual(largos, ["cuento", "carrete", "subtitulos"]);
});


test("caminoHilo empieza arriba al centro y termina abajo al centro", () => {
  const d = caminoHilo(300, 1000);
  assert.ok(d.startsWith("M 150 0"), d);
  assert.ok(d.endsWith("150 1000"), d);
  assert.notEqual(caminoHilo(300, 1000), caminoHilo(500, 1000), "depende del ancho");
});
