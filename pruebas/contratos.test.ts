// Los contratos que leen el backend y el front (encargo del 27-11): las partituras de la casa como JSON puro y un índice
// con la versión y la lista de contratos, para copiar todo de una vez.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { CASA } from "../src/director/casa";
import { contratoCasa, textoContratoCasa } from "../src/director/contrato-casa";
import { indiceContratos } from "../src/director/indice-contratos";

test("contratos: las partituras de la casa van en un contrato JSON", () => {
  const c = contratoCasa();
  assert.equal(c.version, 1);
  assert.equal(c.partituras.length, CASA.length);
  for (const p of c.partituras) {
    assert.ok(p.id && p.nombre && p.grupo, `falta algo en ${p.id}`);
    assert.ok(typeof p.que === "string" && p.que.length > 10, `«${p.id}» no dice qué hace`);
    assert.ok(Array.isArray(p.partes) && p.partes.length > 0, `«${p.id}» sin partes`);
    // JSON puro: sin funciones ni nada que se pierda al guardarlo.
    assert.deepEqual(JSON.parse(JSON.stringify(p.partitura)), p.partitura, `«${p.id}» no es JSON puro`);
  }
  assert.deepEqual(new Set(c.partituras.map((p) => p.id)).size, CASA.length, "ids repetidos");
});

test("contratos: el índice dice la versión y todos los contratos", () => {
  const i = indiceContratos("0.6.0");
  assert.equal(i.motionKit, "0.6.0");
  assert.deepEqual(i.contratos.map((c) => c.archivo), [
    "encabezado-motionkit.json",
    "pagina-motionkit.json",
    "partitura-motionkit.json",
    "partituras-casa-motionkit.json",
    "temas-motionkit.json",
  ]);
  for (const c of i.contratos) assert.ok(Number.isInteger(c.version) && c.version >= 1, `${c.archivo} sin versión`);
});

test("contratos: los archivos están al día con el código y con la versión del paquete", () => {
  assert.equal(readFileSync("contrato/partituras-casa-motionkit.json", "utf8"), textoContratoCasa());
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  assert.equal(JSON.parse(readFileSync("contrato/indice.json", "utf8")).motionKit, version);
});

// Fase 2 de «Un solo motor»: el contrato de temas (paletas, temas, mezclas y adornos) para el backend y el front.
test("contratos: el contrato de temas es JSON puro y trae todo lo que valida el backend", async () => {
  const { contratoTemas } = await import("../src/temas/contrato");
  const c = contratoTemas();
  assert.equal(c.version, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(c)), c, "no es JSON puro");
  const backend = "../lamente-backend/contrato/diseno.json";
  if (existsSync(backend)) {
    const d = JSON.parse(readFileSync(backend, "utf8"));
    for (const p of d.paletas) assert.ok(c.paletas.some((x) => x.id === p), `falta la paleta «${p}»`);
    for (const t of Object.keys(d.temas)) assert.ok(c.temas.some((x) => x.id === t), `falta el tema «${t}»`);
    for (const m of Object.keys(d.mezclas)) assert.ok(c.mezclas.some((x) => x.id === m), `falta la mezcla «${m}»`);
  }
  for (const t of c.temas) for (const a of [...(t.adornos ?? []), ...(t.panel?.adornos ?? [])]) assert.ok(c.adornos.includes(a), `«${t.id}» usa el adorno «${a}», que no está`);
});

test("contratos: el índice lista el contrato de temas y el archivo está al día", async () => {
  const { textoContratoTemas, contratoTemas } = await import("../src/temas/contrato");
  const i = indiceContratos("0.8.0");
  assert.ok(i.contratos.some((c) => c.archivo === "temas-motionkit.json" && c.version === contratoTemas().version));
  assert.equal(readFileSync("contrato/temas-motionkit.json", "utf8"), textoContratoTemas());
});
