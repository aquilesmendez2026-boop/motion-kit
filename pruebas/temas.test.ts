// Los temas como datos (fase 2 de «Un solo motor»): el catálogo trae todo lo que hoy dibuja La Mente y aplicar un tema
// declara todas sus variables (así corta lo que hereda de afuera).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { adornosDe, buscarTema, variablesDeTema } from "../src/temas/aplicar";
import { CSS_ADORNOS, FIRMA_DE_TEMA } from "../src/temas/datos/adornos";
import { MEZCLAS, PALETAS, TEMAS } from "../src/temas/datos";

const CONTRATO = "../lamente-backend/contrato/diseno.json";

test("temas: cada id del contrato del backend existe en el catálogo", { skip: !existsSync(CONTRATO) && "lamente-backend no está al lado" }, () => {
  const c = JSON.parse(readFileSync(CONTRATO, "utf8"));
  const paletas = new Set(PALETAS.map((p) => p.id));
  const temas = new Set(TEMAS.filter((t) => t.para.includes("pagina")).map((t) => t.id));
  const mezclas = new Set(MEZCLAS.map((m) => m.id));
  for (const p of c.paletas) assert.ok(paletas.has(p), `falta la paleta «${p}»`);
  for (const t of Object.keys(c.temas)) assert.ok(temas.has(t), `falta el tema «${t}»`);
  for (const m of Object.keys(c.mezclas)) assert.ok(mezclas.has(m), `falta la mezcla «${m}»`);
});

test("temas: variablesDeTema declara todas las variables", () => {
  const panel = variablesDeTema("taller", { para: "panel" });
  const pagina = variablesDeTema("papel", { para: "pagina" });
  assert.deepEqual(Object.keys(panel).sort(), Object.keys(pagina).sort());
  for (const v of ["--mk-fondo", "--mk-acento", "--mk-trazo", "--mk-radio-tarjeta", "--mk-fuente-titulo", "--mk-ritmo-tiempo", "--mk-campo-foco"]) {
    assert.ok(v in panel, `falta ${v}`);
  }
  // Lo que el tema no define va como «initial»: cada pieza usa su respaldo.
  assert.equal(pagina["--mk-campo-foco"], "initial");
  assert.equal(panel["--mk-trazo"], "3px solid var(--mk-texto)");
});

test("temas: el mismo id da su versión en cada lado", () => {
  const panel = variablesDeTema("rock", { para: "panel" });
  const pagina = variablesDeTema("rock", { para: "pagina" });
  assert.equal(panel["--mk-fondo"], "#efe4cf");
  assert.equal(pagina["--mk-fondo"], PALETAS.find((p) => p.id === "rock")!.colores.fondo);
  assert.notEqual(panel["--mk-radio-tarjeta"], pagina["--mk-radio-tarjeta"]);
});

test("temas: un id desconocido cae al de su lado", () => {
  assert.equal(buscarTema("nada", "panel").id, "lamente");
  assert.equal(buscarTema("nada", "pagina").id, "clasico");
  assert.equal(buscarTema(undefined, "panel").id, "lamente");
  // Un tema solo del panel, pedido para la página, cae al de la página.
  assert.equal(buscarTema("taller", "pagina").id, "clasico");
});

test("temas: una paleta cambia solo los colores", () => {
  const papel = variablesDeTema("papel", { para: "pagina" });
  const conBosque = variablesDeTema("papel", { para: "pagina", paleta: "bosque" });
  const bosque = PALETAS.find((p) => p.id === "bosque")!.colores;
  assert.equal(conBosque["--mk-fondo"], bosque.fondo);
  assert.equal(conBosque["--mk-suave"], bosque.suave);
  assert.equal(conBosque["--mk-fuente-titulo"], papel["--mk-fuente-titulo"]);
  assert.equal(conBosque["--mk-radio-tarjeta"], papel["--mk-radio-tarjeta"]);
});

test("temas: el modo oscuro de «lamente» cambia sus colores", () => {
  const claro = variablesDeTema("lamente", { para: "panel" });
  const oscuro = variablesDeTema("lamente", { para: "panel", oscuro: true });
  assert.equal(claro["--mk-fondo"], "#FAF7F2");
  assert.equal(oscuro["--mk-fondo"], "#14121A");
  assert.equal(oscuro["--mk-trazo"], claro["--mk-trazo"]);
});

// Los adornos con nombre: la firma de cada tema, que apunta a partes marcadas (nunca a clases de quien lo usa), anima
// solo transform y opacity, se queda quieta con movimiento reducido y pesa poco.
/** Separa una lista de selectores por sus comas de primer nivel (no las de adentro de :is(…)). */
function porComas(s: string): string[] {
  const out: string[] = [];
  let n = 0, desde = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") n++;
    else if (s[i] === ")") n--;
    else if (s[i] === "," && n === 0) {
      out.push(s.slice(desde, i));
      desde = i + 1;
    }
  }
  return [...out, s.slice(desde)];
}

test("temas: cada adorno apunta a partes marcadas y respeta movimiento reducido", async () => {
  const { gzipSync } = await import("node:zlib");
  for (const [nombre, css] of Object.entries(CSS_ADORNOS)) {
    assert.ok(!/\.lm-|chakra-heading|--lmt?-/.test(css), `${nombre}: trae clases o variables del front`);
    for (const r of css.matchAll(/(^|\})\s*([^@{}\s][^{}]*)\{/g)) {
      for (const sel of porComas(r[2])) if (sel.trim() && !/^\s*(from|to|\d+%)/.test(sel)) assert.ok(sel.includes("[data-mk-tema="), `${nombre}: un selector fuera de su tema: «${sel.trim()}»`);
    }
    for (const k of css.matchAll(/@keyframes [\w-]+\{([\s\S]*?\}\s*)\}/g)) {
      const props = [...k[1].matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
      for (const p of props) assert.ok(["transform", "opacity", "translate", "scale", "rotate"].includes(p), `${nombre}: anima «${p}» (solo transform y opacity)`);
    }
    if (/animation\s*:/.test(css)) assert.ok(/prefers-reduced-motion/.test(css), `${nombre}: anima y no se queda quieto con movimiento reducido`);
    assert.ok(gzipSync(css).length <= 3000, `${nombre}: pesa ${gzipSync(css).length} B comprimido (máximo 3 KB)`);
  }
  // Cada tema del panel con firma la lleva puesta.
  for (const [tema, nombre] of Object.entries(FIRMA_DE_TEMA)) assert.ok(adornosDe(tema, "panel").includes(nombre), `«${tema}» no trae su adorno «${nombre}»`);
});

// Hallazgos de la revisión final de la v0.8.0.
test("temas: los adornos solo aplican en el panel y nunca dentro de una página (ni en el título del encabezado)", () => {
  for (const [nombre, css] of Object.entries(CSS_ADORNOS)) {
    assert.ok(!/data-mk-parte/.test(css), `${nombre}: usa data-mk-parte, que es del director y del encabezado`);
    for (const r of css.matchAll(/(^|\})\s*([^@{}\s][^{}]*)\{/g)) {
      for (const sel of porComas(r[2]).map((s) => s.trim()).filter((s) => s && !/^(from|to|\d+%)/.test(s))) {
        assert.ok(sel.includes('[data-mk-para="panel"]'), `${nombre}: un selector que no mira el lado: «${sel}»`);
        if (/data-mk-adorno/.test(sel)) assert.ok(sel.includes(':not([data-mk-para="pagina"] *)'), `${nombre}: una parte que entra a la página: «${sel}»`);
      }
    }
  }
});

test("temas: la versión del panel de «rock» es completa (no hereda la letra de la página)", async () => {
  const { familiasDe } = await import("../src/temas/letras");
  const rock = buscarTema("rock", "panel");
  const panel = variablesDeTema("rock", { para: "panel" });
  assert.equal(panel["--mk-fuente-titulo"], "initial");
  assert.equal(panel["--mk-titulo-mayusculas"], "initial");
  assert.ok(familiasDe(rock.panel?.letra).some((f) => f.startsWith("Rubik+Dirt")), `familias: ${familiasDe(rock.panel?.letra)}`);
});

test("temas: las letras del panel se piden con sus pesos (como el front)", async () => {
  const { familiasDe } = await import("../src/temas/letras");
  assert.ok(familiasDe(buscarTema("cancha", "panel").letra).includes("Barlow+Condensed:ital,wght@1,800"));
  assert.ok(familiasDe(buscarTema("patitas", "panel").letra).some((f) => /^Baloo\+2:wght@/.test(f)));
});

test("temas: una paleta desconocida cae a la del tema (no deja la página sin colores)", () => {
  const papel = variablesDeTema("papel", { para: "pagina" });
  const conNueva = variablesDeTema("papel", { para: "pagina", paleta: "una-que-aun-no-existe" });
  assert.equal(conNueva["--mk-fondo"], papel["--mk-fondo"]);
  assert.notEqual(conNueva["--mk-fondo"], "initial");
});
