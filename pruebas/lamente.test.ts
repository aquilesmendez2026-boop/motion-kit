import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  estiloDesdeLaMente, contraste, TEMAS_LAMENTE, PALETAS_LAMENTE, TEMA_LAMENTE_IDS, PALETA_LAMENTE_IDS, BASE_DE_TEMA,
} from "../src/receta";
import { esHex } from "../src/receta/lamente";
import { ESTILO_IDS } from "../src/estilos/estilos";
// @ts-expect-error: módulo .mjs sin tipos
import { importarTs } from "../scripts/ts.mjs";

const COLORES = ["--mk-fondo", "--mk-superficie", "--mk-texto", "--mk-texto-suave", "--mk-borde", "--mk-acento", "--mk-acento-2", "--mk-sobre-acento", "--mk-acento-texto"];

test("cada tema con cada paleta da colores válidos y títulos que se leen", () => {
  for (const tema of TEMA_LAMENTE_IDS) {
    for (const paleta of PALETA_LAMENTE_IDS) {
      const { colores: c, estilo } = estiloDesdeLaMente({ tema, paleta });
      const que = `${tema} + ${paleta}`;
      assert.ok(ESTILO_IDS.includes(estilo), `${que}: estilo base ${estilo}`);
      for (const k of COLORES) assert.ok(esHex(c[k]), `${que}: ${k} = ${c[k]}`);
      assert.ok(contraste(c["--mk-texto"], c["--mk-fondo"]) >= 4.5, `${que}: título sobre el fondo`);
      assert.ok(contraste(c["--mk-texto"], c["--mk-superficie"]) >= 4.5, `${que}: texto sobre la superficie`);
      assert.ok(contraste(c["--mk-texto-suave"], c["--mk-fondo"]) >= 4.5, `${que}: bajada sobre el fondo`);
      assert.ok(contraste(c["--mk-acento-texto"], c["--mk-fondo"]) >= 4.5, `${que}: antetítulo sobre el fondo`);
      assert.ok(contraste(c["--mk-sobre-acento"], c["--mk-acento"]) >= 4.5, `${que}: botón principal`);
      assert.ok(c["--mk-fuente-titulo"] && c["--mk-fuente-texto"] && c["--mk-radio-boton"] && c["--mk-radio-tarjeta"], `${que}: letras y radios`);
    }
  }
});

test("hamburguesería con bosque: base neón, colores de bosque y letra Lilita One", () => {
  const p = estiloDesdeLaMente({ tema: "hamburgueseria", paleta: "bosque" });
  assert.equal(p.estilo, "neon");
  assert.equal(p.colores["--mk-fondo"], PALETAS_LAMENTE.bosque.colores.fondo);
  assert.equal(p.colores["--mk-acento"], PALETAS_LAMENTE.bosque.colores.acento);
  assert.match(p.colores["--mk-fuente-titulo"], /Lilita One/);
  assert.equal(p.colores["--mk-radio-boton"], "9999px");
  assert.match(p.googleFonts, /family=Lilita\+One/);
  assert.equal(p.brillo, false);
  assert.equal(p.claro, true);
  assert.equal(estiloDesdeLaMente({ tema: "hamburgueseria" }).claro, false, "noche es oscura");
});

test("sin paleta usa la del tema; lo desconocido cae al clásico, como en La Mente", () => {
  assert.equal(estiloDesdeLaMente({ tema: "deco" }).colores["--mk-fondo"], PALETAS_LAMENTE.noche.colores.fondo);
  const raro = estiloDesdeLaMente({ tema: "constructor", paleta: "toString" });
  assert.equal(raro.colores["--mk-fondo"], PALETAS_LAMENTE.clasica.colores.fondo);
  assert.equal(raro.estilo, BASE_DE_TEMA.clasico);
  assert.match(raro.colores["--mk-fuente-titulo"], /Outfit/);
});

test("el tema pone mayúsculas, espaciado, peso y brillo", () => {
  const rock = estiloDesdeLaMente({ tema: "rock" }).colores;
  assert.equal(rock["--lm-titulo-mayusculas"], "uppercase");
  assert.equal(rock["--lm-titulo-peso"], "400");
  assert.equal(rock["--mk-radio-boton"], "0px");
  assert.equal(estiloDesdeLaMente({ tema: "neon" }).brillo, true);
  assert.equal(estiloDesdeLaMente({ tema: "clasico" }).colores["--lm-titulo-mayusculas"], "none");
});

test("la receta puede forzar su estilo base", () => {
  assert.equal(estiloDesdeLaMente({ tema: "papel", paleta: "bosque", base: "rock" }).estilo, "rock");
});

const FRONT = "../lamente-front/packages/ui/src";
const CONTRATO = "../lamente-backend/contrato/diseno.json";

test("la copia de temas y paletas sigue igual que en lamente-front", { skip: !existsSync(`${FRONT}/temas.ts`) && "lamente-front no está al lado" }, async () => {
  const { PALETAS } = await importarTs(`${FRONT}/paletas.ts`);
  const { TEMAS } = await importarTs(`${FRONT}/temas.ts`);
  assert.deepEqual(JSON.parse(JSON.stringify(PALETAS_LAMENTE)), JSON.parse(JSON.stringify(PALETAS)), "paletas.ts cambió: actualiza src/receta/lamente.ts");
  assert.deepEqual(JSON.parse(JSON.stringify(TEMAS_LAMENTE)), JSON.parse(JSON.stringify(TEMAS)), "temas.ts cambió: actualiza src/receta/lamente.ts");
});

test("los ids calzan con el contrato del backend", { skip: !existsSync(CONTRATO) && "lamente-backend no está al lado" }, () => {
  const c = JSON.parse(readFileSync(CONTRATO, "utf8"));
  assert.deepEqual([...PALETA_LAMENTE_IDS].sort(), [...c.paletas].sort());
  assert.deepEqual([...TEMA_LAMENTE_IDS].sort(), Object.keys(c.temas).sort());
  for (const t of TEMA_LAMENTE_IDS) assert.equal(TEMAS_LAMENTE[t].premium, c.temas[t].premium, `premium de ${t}`);
});
