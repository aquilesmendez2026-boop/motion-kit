// Los colores de las piezas de interfaz: salen de variables del tema (las del panel de La Mente u otras).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { c, f, fuenteCartel, fuerza, letra, ritmoDe, tiempo, variablesTema } from "../src/interfaz/tema";

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

// El ADN (fase 1 de «Un solo motor»): forma, letra y ritmo, con el respaldo de cada uso.
test("adn: f() y letra() usan la variable y el respaldo de cada uso", () => {
  assert.equal(f("radioBoton", "12px"), "var(--mk-radio-boton,12px)");
  assert.equal(f("sombraSuave", "none"), "var(--mk-sombra-suave,none)");
  assert.equal(letra("fuenteTitulo", "serif"), "var(--mk-fuente-titulo,serif)");
});

test("adn: variablesTema traduce el ritmo a tiempo y fuerza", () => {
  assert.deepEqual(variablesTema({ ritmo: "manga" }), { "--mk-ritmo-tiempo": "0.85", "--mk-ritmo-fuerza": "1.4" });
  assert.deepEqual(variablesTema({ ritmo: "quieto" }), { "--mk-ritmo-tiempo": "1", "--mk-ritmo-fuerza": "0" });
  assert.deepEqual(variablesTema({ radioTarjeta: "0px", trazo: "" }), { "--mk-radio-tarjeta": "0px" });
  assert.deepEqual(variablesTema({ acento: "#7c3aed", fuenteCartel: "Impact" }), { "--mk-acento": "#7c3aed", "--mk-fuente-cartel": "Impact" });
});

test("adn: tiempo() y fuerza() escalan por el ritmo", () => {
  assert.equal(tiempo(300), "calc(300ms*var(--mk-ritmo-tiempo,1))");
  assert.equal(fuerza(0.08), "calc(0.08*var(--mk-ritmo-fuerza,1))");
});

test("adn: ritmoDe lee el ritmo calculado y, sin él, es el de hoy", () => {
  const g = globalThis as { getComputedStyle?: unknown };
  const antes = g.getComputedStyle;
  try {
    const vars: Record<string, string> = {};
    g.getComputedStyle = () => ({ getPropertyValue: (n: string) => vars[n] ?? "" });
    assert.deepEqual(ritmoDe({} as Element), { tiempo: 1, fuerza: 1 });
    vars["--mk-ritmo-tiempo"] = " 0.85";
    vars["--mk-ritmo-fuerza"] = "0";
    assert.deepEqual(ritmoDe({} as Element), { tiempo: 0.85, fuerza: 0 });
    vars["--mk-ritmo-tiempo"] = "nada";
    assert.deepEqual(ritmoDe({} as Element), { tiempo: 1, fuerza: 0 });
  } finally {
    g.getComputedStyle = antes;
  }
});

test("adn: fuenteCartel no cambia", () => {
  assert.equal(fuenteCartel(), "var(--mk-fuente-cartel,'Arial Black','Helvetica Neue',sans-serif)");
});

// Fase 1: las piezas leen la forma del ADN. Cada radio, sombra o borde con ancho va por f(…) con el valor de hoy de
// respaldo. Se permiten las formas que no son del tema (0, círculo, píldora, none, lo que se copia del elemento), las
// líneas de JS marcadas `adn:no` y estas excepciones: efectos o formas propias, no del tema. (No van como comentario en
// el CSS: el CSS viaja al navegador.)
const EXCEPCIONES = [
  ".16em solid currentColor", // la rueda de carga (BotonQueGuarda, Confirmar)
  "1.5px dashed var(--b)", // el borde punteado de la zona para soltar (SubirImagen)
  "0 1px 3px rgba(0,0,0,.25)", // la sombra de la perilla (Interruptor)
  "0 0 0 4px ${CARTEL}", // el aro amarillo de la guía (Guia)
];
const ARCHIVOS_FORMA = [
  "interfaz/BotonQueGuarda.tsx", "interfaz/Copiar.tsx", "interfaz/Campo.tsx", "interfaz/Confirmar.tsx", "interfaz/SubirImagen.tsx",
  "interfaz/Interruptor.tsx", "interfaz/Cargando.tsx", "interfaz/Contador.tsx", "interfaz/ListaViva.tsx",
  "comic/estilos.ts", "comic/Guia.tsx", "comic/CartelNovedad.tsx", "comic/Vacio.tsx", "comic/Oferta.tsx", "comic/Celebrar.tsx",
  "components/Toast.tsx", "components/BottomSheet.tsx", "components/Tabs.tsx", "components/TabBar.tsx",
];
const PROPIEDAD = /(border(?:-(?:top|bottom|left|right))?(?:-radius)?|box-shadow|borderRadius|boxShadow|border(?:Top|Bottom|Left|Right)?)\s*:\s*/g;
const PERMITIDO = /^(?:\$\{f\(|f\(|0(?:px)?\b|50%|999(?:px)?\b|none\b|radio\b|"?0"?\s*[,}])/;

test("adn: las piezas no traen forma fija", () => {
  const malas: string[] = [];
  for (const archivo of ARCHIVOS_FORMA) {
    readFileSync(`src/${archivo}`, "utf8").split("\n").forEach((linea, i) => {
      if (linea.includes("adn:no")) return;
      for (const m of linea.matchAll(PROPIEDAD)) {
        const valor = linea.slice((m.index ?? 0) + m[0].length).replace(/^["'`]/, "");
        if (!PERMITIDO.test(valor) && !EXCEPCIONES.some((x) => valor.startsWith(x))) malas.push(`${archivo}:${i + 1} ${m[1]}:${valor.slice(0, 30)}`);
      }
    });
  }
  assert.deepEqual(malas, [], `forma fija fuera del ADN:\n${malas.join("\n")}`);
});

test("adn: los títulos y las piezas que se dibujan aparte leen la letra del tema", () => {
  for (const [archivo, nombre] of [["interfaz/Confirmar.tsx", "fuenteTitulo"], ["comic/Vacio.tsx", "fuenteTitulo"], ["interfaz/Confirmar.tsx", "fuenteTexto"], ["components/Toast.tsx", "fuenteTexto"], ["comic/Guia.tsx", "fuenteTexto"]]) {
    assert.ok(readFileSync(`src/${archivo}`, "utf8").includes(`letra("${nombre}"`), `${archivo} no lee letra("${nombre}")`);
  }
});

// Chromium se cae (la pestaña entera) con un @keyframes que anima la propiedad `scale` con una variable adentro
// (encontrado el 28-11 con el ritmo). Con `transform: scale(…)` no pasa.
test("adn: ninguna animación usa la propiedad scale con una variable (hace caer Chromium)", () => {
  const malas: string[] = [];
  const revisarCarpeta = (dir: string) => {
    for (const n of readdirSync(dir)) {
      const p = `${dir}/${n}`;
      if (statSync(p).isDirectory()) revisarCarpeta(p);
      else if (/\.tsx?$/.test(n))
        readFileSync(p, "utf8").split("\n").forEach((linea, i) => {
          if (/@keyframes.*[{;]\s*scale:\s*[^;]*(var\(|\$\{)/.test(linea)) malas.push(`${p}:${i + 1}`);
        });
    }
  };
  revisarCarpeta("src");
  assert.deepEqual(malas, []);
});
