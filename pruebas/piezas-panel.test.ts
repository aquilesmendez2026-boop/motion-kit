// Las piezas del panel en motion-kit (fase 3 de «Un solo motor»): leen el ADN y el detalle del tema, se marcan para la
// firma de cada tema y sus estados se leen bien. Ver docs/un-solo-motor/piezas-del-panel.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TONOS, TEXTO_TONO, colorDeTono } from "../src/interfaz/tonos";
import { contraste } from "../src/receta/lamente";
import { TEMAS, variablesDeTema } from "../src/entradas/temas";

const PIEZAS = ["IconoCaja", "BotonPanel", "Pastilla", "CabezaSeccion", "Seccion", "GrillaTarjetas", "TarjetaFila", "Selector", "BarraLateral"];

test("piezas del panel: cada estado se lee con contraste AA en «lamente»", () => {
  assert.deepEqual(Object.keys(TONOS).sort(), ["gris", "morado", "naranjo", "rojo", "verde"]);
  for (const [tono, fondo] of Object.entries(TONOS)) {
    assert.ok(contraste(fondo, TEXTO_TONO) >= 4.5, `${tono}: contraste ${contraste(fondo, TEXTO_TONO).toFixed(2)}`);
    assert.equal(colorDeTono(tono as keyof typeof TONOS).fondo, `var(--mk-estado-${tono},${fondo})`);
  }
});

/** Lo que vale `var(--x,respaldo)` con las variables de un tema (lo que el tema no define, el respaldo). */
function resolver(expr: string, v: Record<string, string>): string {
  const m = /^var\((--[a-z0-9-]+),(.+)\)$/.exec(expr.trim());
  if (!m) return expr.trim();
  const valor = v[m[1]];
  return valor && valor !== "initial" ? resolver(valor, v) : resolver(m[2], v);
}

// Hallazgo de la revisión de la v0.9.0: con «cancha» (sobre-sol blanco) los estados daban 1,2 a 1,4.
test("piezas del panel: cada estado se lee con contraste AA en los 14 temas del panel", () => {
  for (const t of TEMAS.filter((x) => x.para.includes("panel"))) {
    const v = variablesDeTema(t.id, { para: "panel" }) as Record<string, string>;
    for (const tono of Object.keys(TONOS) as (keyof typeof TONOS)[]) {
      const { fondo, texto } = colorDeTono(tono);
      const f = resolver(fondo, v);
      const x = resolver(texto, v);
      assert.ok(contraste(x, f) >= 4.5, `${t.id}, ${tono}: ${x} sobre ${f} da ${contraste(x, f).toFixed(2)}`);
    }
  }
});

/** Saca los var(--mk-…, respaldo) (también anidados) y lo que queda no puede traer colores fijos. */
function sinVariables(css: string): string {
  let antes = "";
  while (antes !== css) {
    antes = css;
    css = css.replace(/var\(--mk-[a-z0-9-]+(,[^()]*)?\)/g, "");
  }
  return css;
}

// El botón de peligro y Quitar escriben en --mk-mal (respaldo #b42318) sobre la superficie: en un tema oscuro ese rojo
// no se lee si el tema no trae el suyo (hallazgo de la guía, fase 3).
test("piezas del panel: el rojo de peligro se lee sobre la superficie de cada tema del panel (AA)", () => {
  for (const t of TEMAS.filter((x) => x.para.includes("panel"))) {
    const v = variablesDeTema(t.id, { para: "panel" }) as Record<string, string>;
    const mal = v["--mk-mal"] && v["--mk-mal"] !== "initial" ? v["--mk-mal"] : "#b42318";
    assert.ok(contraste(mal, v["--mk-superficie"]) >= 4.5, `${t.id}: ${mal} sobre ${v["--mk-superficie"]} da ${contraste(mal, v["--mk-superficie"]).toFixed(2)}`);
  }
});

test("piezas del panel: sin colores ni formas fijas (todo por --mk-*)", () => {
  for (const p of PIEZAS) {
    const t = readFileSync(`src/interfaz/${p}.tsx`, "utf8");
    const css = sinVariables(t.slice(t.indexOf("css ??= `"), t.indexOf("`);", t.indexOf("css ??= `"))));
    assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css), `${p}: trae un color fijo: ${/#[0-9a-f]{3,8}\b/i.exec(css)?.[0]}`);
    for (const m of css.matchAll(/(border-radius|box-shadow|border)\s*:\s*([^;}]+)/g)) {
      assert.ok(/^(0|none|50%|999px|\$\{|var\(--mk-)/.test(m[2].trim()), `${p}: ${m[1]} fijo: «${m[2].trim()}»`);
    }
  }
});

test("piezas del panel: cada pieza se marca para la firma del tema", () => {
  for (const [p, marca] of [["IconoCaja", "icono"], ["BotonPanel", "boton"], ["Pastilla", "estado"]]) {
    assert.ok(readFileSync(`src/interfaz/${p}.tsx`, "utf8").includes(`data-mk-adorno="${marca}"`), `${p} no lleva data-mk-adorno="${marca}"`);
  }
});

test("piezas del panel: los títulos van en su nivel (h2 la sección, h3 la tarjeta) y con su marca", () => {
  const leer = (p: string) => readFileSync(`src/interfaz/${p}.tsx`, "utf8");
  assert.match(leer("CabezaSeccion"), /<h2[^>]*data-mk-adorno="titulo"/);
  // Seccion: h2 por defecto, h3 con nivel={3} (v0.9.1); el título lleva su marca.
  assert.match(leer("Seccion"), /nivel = 2/);
  assert.match(leer("Seccion"), /nivel === 3 \? "h3" : "h2"/);
  assert.match(leer("Seccion"), /<Titulo[^>]*data-mk-adorno="titulo"/);
  assert.match(leer("TarjetaFila"), /<h3/);
  assert.match(leer("TarjetaFila"), /data-mk-adorno="hoja"/);
  assert.match(leer("Seccion"), /data-mk-adorno="hoja"/);
});

test("piezas del panel: la barra lateral es un nav con nombre, marca la elegida y usa IconoCaja", () => {
  const t = readFileSync("src/interfaz/BarraLateral.tsx", "utf8");
  assert.match(t, /<nav[^>]*aria-label=/);
  assert.match(t, /aria-current=\{[^}]*"page"/);
  assert.match(t, /<IconoCaja/);
  for (const marca of ["barra", "grupo"]) assert.ok(t.includes(`data-mk-adorno="${marca}"`), `BarraLateral no lleva data-mk-adorno="${marca}"`);
  assert.match(t, /"--mk-grupo"/);
  assert.match(t, /prefers-reduced-motion/);
});

// v0.9.1 (pedido del front): lo que se ve como botón chico sin serlo (un enlace, una etiqueta) carga los estilos solo.
test("piezas del panel: useEstilosBotonPanel se exporta en interfaz y en motion-kit", async () => {
  const interfaz = await import("../src/entradas/interfaz");
  const todo = await import("../src/index");
  assert.equal(typeof interfaz.useEstilosBotonPanel, "function");
  assert.equal(typeof todo.useEstilosBotonPanel, "function");
});

test("piezas del panel: Selector usa Campo (etiqueta, ayuda y error accesibles)", () => {
  const t = readFileSync("src/interfaz/Selector.tsx", "utf8");
  assert.match(t, /<Campo/);
  assert.match(t, /\{\.\.\.a11y\}/);
});
