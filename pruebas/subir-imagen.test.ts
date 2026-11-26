// SubirImagen: la revisión del archivo antes de subirlo (tipo y peso) y el peso en palabras.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pesoLegible, revisarArchivo } from "../src/interfaz/archivo";

const FOTOS = "image/png,image/jpeg,image/webp";

test("subir: acepta lo que pide", () => {
  assert.deepEqual(revisarArchivo({ type: "image/png", size: 1_000_000 }, FOTOS, 2), { ok: true });
  assert.deepEqual(revisarArchivo({ type: "image/jpeg", size: 10 }, FOTOS, 2), { ok: true });
});

test("subir: el peso en el mensaje", () => {
  const r = revisarArchivo({ type: "image/png", size: 3_400_000 }, FOTOS, 2);
  assert.deepEqual(r, { ok: false, mensaje: "Esa foto pesa 3,4 MB: el máximo es 2 MB." });
  assert.deepEqual(revisarArchivo({ type: "image/png", size: 2 * 1024 * 1024 }, FOTOS, 2), { ok: true });
  const medio = revisarArchivo({ type: "image/png", size: 3_000_000 }, FOTOS, 2.5);
  assert.equal(medio.ok ? "" : medio.mensaje, "Esa foto pesa 3 MB: el máximo es 2,5 MB.");
});

test("subir: el tipo", () => {
  const gif = revisarArchivo({ type: "image/gif", size: 10 }, FOTOS, 2);
  assert.deepEqual(gif, { ok: false, mensaje: "Ese archivo no es una foto PNG, JPG o WebP." });
  assert.deepEqual(revisarArchivo({ type: "image/gif", size: 10 }, "image/*", 2), { ok: true });
  assert.equal(revisarArchivo({ type: "", size: 10 }, FOTOS, 2).ok, false);
  const comodin = revisarArchivo({ type: "application/pdf", size: 10 }, "image/*", 2);
  assert.equal(comodin.ok ? "" : comodin.mensaje, "Ese archivo no es una foto.");
  // El tipo manda sobre el peso: si no es foto, no importa cuánto pese.
  const ambos = revisarArchivo({ type: "text/plain", size: 9_000_000 }, FOTOS, 2);
  assert.match(ambos.ok ? "" : ambos.mensaje, /no es una foto/);
});

test("subir: pesoLegible", () => {
  assert.equal(pesoLegible(3_400_000), "3,4 MB");
  assert.equal(pesoLegible(850_000), "850 KB");
  assert.equal(pesoLegible(0), "0 KB");
  assert.equal(pesoLegible(12_000_000), "12 MB");
  assert.doesNotThrow(() => pesoLegible(NaN));
  assert.equal(pesoLegible(NaN), "0 KB");
});
