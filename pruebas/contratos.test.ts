// Los contratos que leen el backend y el front (encargo del 27-11): las partituras de la casa como JSON puro y un índice
// con la versión y la lista de contratos, para copiar todo de una vez.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  ]);
  for (const c of i.contratos) assert.ok(Number.isInteger(c.version) && c.version >= 1, `${c.archivo} sin versión`);
});

test("contratos: los archivos están al día con el código y con la versión del paquete", () => {
  assert.equal(readFileSync("contrato/partituras-casa-motionkit.json", "utf8"), textoContratoCasa());
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  assert.equal(JSON.parse(readFileSync("contrato/indice.json", "utf8")).motionKit, version);
});
