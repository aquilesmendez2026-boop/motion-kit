// Los colores de las piezas de interfaz: salen de variables del tema (las del panel de La Mente u otras).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { c, variablesTema } from "../src/interfaz/tema";

test("tema: c() usa el respaldo --lm solo donde existe", () => {
  assert.equal(c("acento"), "var(--mk-acento,var(--lm-acento,#7c5cff))");
  assert.equal(c("superficie"), "var(--mk-superficie,var(--lm-superficie,#ffffff))");
  assert.equal(c("fondo"), "var(--mk-fondo,var(--lm-fondo,#ffffff))");
  assert.equal(c("borde"), "var(--mk-borde,#e7e1d8)");
  assert.equal(c("mal"), "var(--mk-mal,#d64545)");
  // Lo que va sobre el acento es --mk-sobre-acento (--mk-acento-texto ya es «el acento usado como texto» en el kit).
  assert.equal(c("sobreAcento"), "var(--mk-sobre-acento,#ffffff)");
});

test("tema: variablesTema pasa a kebab y salta lo vacío", () => {
  assert.deepEqual(variablesTema({ sobreAcento: "#fff", bien: "" }), { "--mk-sobre-acento": "#fff" });
  assert.deepEqual(variablesTema({}), {});
});

test("tema: las piezas no traen colores fijos", () => {
  const leer = (n: string) => readFileSync(`src/components/${n}.tsx`, "utf8");
  for (const n of ["Toast", "BottomSheet", "Skeleton"]) {
    const t = leer(n);
    for (const fijo of ["#f1f1f6", "#12121c", "#1b1b2b", "rgba(255, 255, 255, 0.14)"]) {
      assert.ok(!t.includes(fijo), `${n} trae ${fijo}`);
    }
  }
  assert.ok(!leer("TabBar").includes('accent = "#7c5cff"'), "TabBar trae el acento fijo");
});

test("tema: ninguna pieza de interfaz usa --mk-acento-texto (es otra cosa en el kit)", () => {
  for (const f of ["tema.ts", "Contador.tsx", "SubirImagen.tsx", "ListaViva.tsx", "Interruptor.tsx", "Cargando.tsx"]) {
    const t = readFileSync(`src/interfaz/${f}`, "utf8");
    assert.ok(!t.includes("acentoTexto") && !t.includes("acento-texto"), `${f} usa acentoTexto`);
  }
});
