// Los temas del front de La Mente → el catálogo de motion-kit (fase 2 de «Un solo motor»). Lee el front sin tocarlo.
//   node scripts/temas-del-front.mjs importar   escribe src/temas/datos/*.ts (una vez; después se editan ahí)
//   node scripts/temas-del-front.mjs revisar    (npm run temas) revisa que el catálogo dé lo mismo que el CSS del
//                                               front, tema por tema, hasta que el front borre el suyo
// Traduce cada variable con docs/un-solo-motor/tabla-de-nombres.md.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const modo = process.argv[2];
const FRONT = join(process.cwd(), "..", "lamente-front");
const BACKEND = join(process.cwd(), "..", "lamente-backend");
const PANEL = join(FRONT, "fronts/panel/src");
if (!existsSync(PANEL)) {
  console.log(`No encontré el front en ${FRONT}: no hay nada que ${modo === "importar" ? "importar" : "revisar"}.`);
  process.exit(0);
}

// --- La tabla de nombres: variable de La Mente → destino ------------------------------------------------------------
const tabla = new Map();
for (const linea of readFileSync("docs/un-solo-motor/tabla-de-nombres.md", "utf8").split("\n")) {
  const m = /^\| `(--lmt?-[a-zA-Z0-9-]+)` \| ([^|]+) \|/.exec(linea);
  if (m) tabla.set(m[1], m[2].trim());
}
const camel = (s) => s.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
const COLOR = { "--mk-fondo": "fondo", "--mk-superficie": "superficie", "--mk-texto": "texto", "--mk-suave": "suave", "--mk-borde": "borde", "--mk-acento": "acento", "--mk-sobre-acento": "sobreAcento", "--mk-cartel": "cartel" };
const FORMA = new Set(["trazo", "radioTarjeta", "radioBoton", "radioCampo", "sombra", "sombraSuave", "hundir"]);
/** El destino `--mk-*` de una variable de La Mente (las de detalle y firma, `--mk-<nombre>`); null si se queda en el front. */
function destino(v) {
  const d = tabla.get(v);
  if (!d) return null;
  const mk = /`(--mk-[a-z0-9-]+)`/.exec(d);
  if (mk) return mk[1];
  if (/^fase [23]/.test(d)) return `--mk-${v.replace(/^--lmt?-/, "")}`;
  return null;
}

// --- El CSS del front ----------------------------------------------------------------------------------------------
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "");
const temaPanelCss = sinComentarios(readFileSync(join(PANEL, "pages/temaPanel.css"), "utf8"));
const temasPanelCss = sinComentarios(readFileSync(join(PANEL, "pages/temasPanel.css"), "utf8"));
/** Las variables (`--x: valor`) del bloque cuyo selector es exactamente `selector`. */
function bloque(css, selector) {
  const i = css.indexOf(selector + " {");
  if (i < 0) return null;
  const cuerpo = css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i));
  const vars = {};
  for (const m of cuerpo.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim().replace(/\s+/g, " ");
  return vars;
}
const POR_DEFECTO = bloque(temaPanelCss, ":where([data-tema-panel], [data-tema-panel-cuerpo])");
const COMUN = bloque(temasPanelCss, ':where([data-tema-panel]:not([data-tema-panel="lamente"]))');
const IDS_PANEL = [...new Set([...temasPanelCss.matchAll(/^\[data-tema-panel="([a-z-]+)"\] \{/gm)].map((m) => m[1]))];

// Los colores de «lamente» (theme.ts del panel) y los de Chakra que se usan sin pisar (los de su paleta por defecto).
const themeTs = readFileSync(join(PANEL, "theme.ts"), "utf8");
const tokenTheme = (n) => {
  const m = new RegExp(`${n}: \\{ value: \\{ base: "(#[0-9A-Fa-f]{6})", _dark: "(#[0-9A-Fa-f]{6})" \\} \\}`).exec(themeTs);
  if (!m) throw new Error(`No encontré el color «${n}» en theme.ts`);
  return { claro: m[1], oscuro: m[2] };
};
const CHAKRA = { "purple-400": "#c084fc", "purple-500": "#a855f7", "purple-600": "#9333ea", "red-500": "#ef4444", "green-600": "#16a34a", "red-600": "#dc2626" };
const TOKEN_COLOR = { fondo: "fondo", superficie: "superficie", tinta: "texto", "tinta-suave": "suave", borde: "borde" };

/**
 * Traduce un valor del front a uno de motion-kit: `var(--chakra-colors-tinta)` → `var(--mk-texto)`, `var(--lmt-sol)` →
 * `var(--mk-cartel)`; la escala violeta, según el tema (en «lamente», la de Chakra; en los demás, la del bloque común,
 * que sale del acento). Lo que no sabe traducir lo anota en `faltan`.
 */
function traducir(valor, idTema, faltan) {
  // 1. Los colores de Chakra, enteros (`var(--chakra-colors-x)`).
  let r = valor.replace(/var\((--chakra-colors-[a-z0-9-]+)\)/g, (todo, v) => {
    const n = v.slice("--chakra-colors-".length);
    if (TOKEN_COLOR[n]) return `var(--mk-${TOKEN_COLOR[n]})`;
    if (/^purple-/.test(n) && idTema !== "lamente" && COMUN[v]) return traducir(COMUN[v], idTema, faltan);
    if (CHAKRA[n]) return CHAKRA[n];
    faltan.add(v);
    return todo;
  });
  // 2. Las de La Mente (con o sin respaldo): solo cambia el nombre.
  r = r.replace(/var\((--lmt?-[a-zA-Z0-9-]+)/g, (todo, v) => {
    const d = destino(v);
    if (d) return `var(${d}`;
    faltan.add(v);
    return todo;
  });
  if (/var\(--chakra/.test(r)) faltan.add(`${valor} (Chakra con respaldo)`);
  return r;
}

/** Las variables principales del panel: dan nombre a su `--mk-*`. Las demás que van al mismo destino son alias. */
const PRINCIPALES = new Set(["--lmt-acento", "--lmt-sobre-acento", "--lmt-sol", "--lmt-trazo", "--lmt-hoja-radio", "--lmt-sombra", "--lmt-boton-radio", "--lmt-boton-sombra", "--lmt-boton-hundir", "--lmt-campo-radio", "--lmt-cartel"]);

/** Todas las variables del front para un tema del panel, ya con nombre y valor de motion-kit. */
function variablesDelFront(id, faltan) {
  const propio = bloque(temasPanelCss, `[data-tema-panel="${id}"]`) ?? {};
  const todas = { ...POR_DEFECTO, ...(id === "lamente" ? {} : COMUN), ...propio };
  const mk = {};
  if (id === "lamente") {
    for (const [n, c] of Object.entries({ fondo: "fondo", superficie: "superficie", texto: "tinta", suave: "tintaSuave", borde: "borde" })) mk[`--mk-${n}`] = tokenTheme(c).claro;
    mk["--mk-acento"] = CHAKRA["purple-600"];
    mk["--mk-sobre-acento"] = "#fff";
  }
  // Primero los colores de Chakra y las principales; después el resto.
  const principal = ([v]) => /^--chakra-colors-/.test(v) || PRINCIPALES.has(v);
  const orden = [...Object.entries(todas).filter(principal), ...Object.entries(todas).filter((e) => !principal(e))];
  for (const [v, valor] of orden) {
    const ch = /^--chakra-colors-([a-z0-9-]+)$/.exec(v);
    const nombre = ch ? (TOKEN_COLOR[ch[1]] ? `--mk-${TOKEN_COLOR[ch[1]]}` : null) : destino(v);
    if (!nombre) continue;
    const t = traducir(valor, id, faltan);
    // Una variable que solo apunta a su propio destino (hoja-borde: var(--lmt-trazo)) no agrega nada.
    if (t === `var(${nombre})`) continue;
    if (mk[nombre] === undefined) mk[nombre] = t;
    else if (mk[nombre] !== t) {
      // Un alias con otro valor en este tema (sobre-sol distinto de la tinta): va aparte, con su nombre.
      const propio = `--mk-${v.replace(/^--lmt?-/, "")}`;
      if (propio === nombre) faltan.add(`${v} (dos valores)`);
      else mk[propio] = t;
    }
  }
  return mk;
}

/** Arma el Tema del panel a partir de sus variables `--mk-*`. */
function temaDesde(mk) {
  const lado = { colores: {}, forma: {}, detalle: {}, letra: {} };
  for (const [v, valor] of Object.entries(mk)) {
    if (COLOR[v]) lado.colores[COLOR[v]] = valor;
    else if (FORMA.has(camel(v.slice(5)))) lado.forma[camel(v.slice(5))] = valor;
    else if (v === "--mk-fuente-cartel") lado.letra.fuenteCartel = valor;
    else lado.detalle[v.slice(5)] = valor;
  }
  return lado;
}

// --- Lo que ya está en TypeScript (temasGuia.ts del front y la copia de La Mente de motion-kit) -------------------
async function importarTs(archivo) {
  const r = await build({ entryPoints: [archivo], bundle: true, format: "esm", platform: "node", write: false, logLevel: "error", external: ["react", "motion-kit"] });
  const tmp = join(process.env.TMPDIR ?? "/tmp", `mk-temas-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(tmp, r.outputFiles[0].text);
  return import(pathToFileURL(tmp).href);
}

async function importar() {
  const faltan = new Set();
  const { TEMAS: GUIA, FUENTES_TEMAS } = await importarTs(join(PANEL, "pages/guia/temasGuia.ts"));
  // «family=Caveat:wght@600;700&family=…» → { Caveat: "Caveat:wght@600;700", … }
  const PEDIDOS = Object.fromEntries([...new URL(FUENTES_TEMAS).searchParams.getAll("family")].map((f) => [f.split(":")[0].replace(/\+/g, " "), f.replace(/ /g, "+")]));
  const googleDe = (letra) => {
    const nombres = [letra?.fuenteCartel, letra?.fuenteTitulo, letra?.fuenteTexto].map((l) => l?.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "")).filter(Boolean);
    const pedidos = [...new Set(nombres.map((n) => PEDIDOS[n]).filter(Boolean))];
    return pedidos.length ? pedidos : undefined;
  };
  const { PALETAS_LAMENTE, TEMAS_LAMENTE, BASE_DE_TEMA } = await importarTs("src/receta/lamente.ts");
  const contrato = JSON.parse(readFileSync(existsSync(join(BACKEND, "contrato/diseno.json")) ? join(BACKEND, "contrato/diseno.json") : join(FRONT, "packages/ui/src/contrato-diseno.json"), "utf8"));

  const paletas = Object.entries(PALETAS_LAMENTE).map(([id, p]) => {
    const { textoSuave, ...resto } = p.colores;
    return { id, nombre: p.nombre, colores: { ...resto, suave: textoSuave } };
  });

  const pagina = Object.entries(TEMAS_LAMENTE).map(([id, t]) => {
    const e = t.estilo;
    const tema = { id, nombre: t.nombre, para: ["pagina"], premium: t.premium, paleta: t.paleta, estiloBase: BASE_DE_TEMA[id] };
    if (e) {
      tema.letra = { fuenteTitulo: e.fuenteTitulo, google: [e.fuente], peso: e.peso, ...(e.mayusculas ? { mayusculas: true } : {}), ...(e.espaciado ? { espaciado: e.espaciado } : {}), ...(e.brillo ? { brillo: true } : {}) };
      tema.forma = { radioTarjeta: e.radio, radioBoton: e.redondo };
    }
    return tema;
  });

  const panel = IDS_PANEL.concat(IDS_PANEL.includes("lamente") ? [] : ["lamente"]).map((id) => {
    const g = GUIA.find((x) => x.id === id);
    const lado = temaDesde(variablesDelFront(id, faltan));
    const google = googleDe(lado.letra);
    if (google) lado.letra.google = google;
    const tema = { id, nombre: g?.nombre ?? id, para: ["panel"], ...lado, ...(FIRMA[id] ? { adornos: [FIRMA[id]] } : {}), ...(g ? { rubros: g.rubros, movimiento: { titulo: g.efecto, tarjeta: g.tarjeta, presencia: g.presencia, luz: g.luz } } : {}) };
    if (id === "lamente") {
      tema.oscuro = {};
      for (const [n, c] of Object.entries({ fondo: "fondo", superficie: "superficie", texto: "tinta", suave: "tintaSuave", borde: "borde" })) tema.oscuro[n] = tokenTheme(c).oscuro;
    }
    return tema;
  });

  // Un mismo id en los dos lados: un solo tema, con la versión del panel aparte.
  const temas = [...pagina];
  for (const t of panel) {
    const misma = temas.find((x) => x.id === t.id);
    if (!misma) temas.push(t);
    else {
      const { id, nombre, para, rubros, movimiento, ...lado } = t;
      misma.para = ["pagina", "panel"];
      misma.panel = lado;
      if (rubros) misma.rubros = rubros;
      if (movimiento) misma.movimiento = movimiento;
    }
  }

  const mezclas = Object.entries(contrato.mezclas).map(([id, m]) => ({ id, nombre: m.nombre, rubros: m.rubros, tema: m.tema, paleta: m.paleta, porQue: m.porQue }));

  if (faltan.size) {
    console.log(`No sé traducir: ${[...faltan].join(", ")}. Súmalas a la tabla de nombres.`);
    process.exit(1);
  }
  mkdirSync("src/temas/datos", { recursive: true });
  const cabeza = (que) =>
    `// ${que}. Importado del front de La Mente el 28-11-2026 con \`node scripts/temas-del-front.mjs importar\`; desde\n` +
    `// ahora la fuente es este archivo (fase 2 de «Un solo motor»). \`npm run temas\` revisa que siga dando lo mismo que el\n// CSS del front mientras el front no borre el suyo.\n`;
  const escribir = (archivo, que, tipo, nombre, datos) =>
    writeFileSync(`src/temas/datos/${archivo}`, `${cabeza(que)}import type { ${tipo} } from "../tipos";\n\nexport const ${nombre}: ${tipo}[] = ${JSON.stringify(datos, null, 2)};\n`);
  escribir("paletas.ts", "Las paletas de la página (paletas.ts del front)", "Paleta", "PALETAS", paletas);
  escribir("temas.ts", "Los temas de la página (temas.ts del front) y los del panel (temaPanel.css, temasPanel.css y temasGuia.ts)", "Tema", "TEMAS", temas);
  escribir("mezclas.ts", "Las mezclas (contrato de diseño del backend)", "Mezcla", "MEZCLAS", mezclas);
  console.log(`Importados: ${paletas.length} paletas, ${temas.length} temas (${pagina.length} de la página, ${panel.length} del panel, ${temas.filter((t) => t.panel).length} en los dos lados) y ${mezclas.length} mezclas.`);
  // Las reglas propias de cada tema (su firma), para escribir los adornos.
  const reglas = {};
  for (const m of temasPanelCss.matchAll(/^(\[data-tema-panel="([a-z-]+)"\][^{]+)\{/gm)) (reglas[m[2]] ??= []).push(m[1].trim());
  writeFileSync(join(process.env.TMPDIR ?? "/tmp", "mk-firmas-del-front.json"), JSON.stringify(reglas, null, 2));
  console.log(`Las reglas de firma de cada tema quedaron en ${join(process.env.TMPDIR ?? "/tmp", "mk-firmas-del-front.json")}.`);
}

async function revisar() {
  const faltan = new Set();
  const { variablesDeTema } = await importarTs("src/temas/aplicar.ts");
  const malas = [];
  for (const id of IDS_PANEL.concat(IDS_PANEL.includes("lamente") ? [] : ["lamente"])) {
    const front = variablesDelFront(id, faltan);
    const catalogo = variablesDeTema(id, { para: "panel" });
    for (const [v, valor] of Object.entries(front)) if (catalogo[v] !== valor) malas.push(`${id}: ${v} es «${catalogo[v]}» y en el front «${valor}»`);
    for (const [v, valor] of Object.entries(catalogo)) if (valor !== "initial" && !(v in front)) malas.push(`${id}: el catálogo trae ${v} («${valor}») y el front no`);
  }
  if (faltan.size) malas.push(`No sé traducir: ${[...faltan].join(", ")}`);
  if (malas.length) {
    console.log(malas.join("\n"));
    console.log(`\n${malas.length} diferencia(s) entre el catálogo y el front.`);
    process.exit(1);
  }
  console.log(`Los ${IDS_PANEL.length + (IDS_PANEL.includes("lamente") ? 0 : 1)} temas del panel dan lo mismo que el front.`);
}

// --- Las firmas de cada tema → adornos con nombre ---------------------------------------------------------------
/** El nombre de la firma de cada tema del panel. */
const FIRMA = {
  noche: "brillo-noche", cuaderno: "hoja-cuaderno", pastel: "pastel-suave", taller: "cinta-peligro", cultivo: "esquina-hoja",
  rock: "cinta-torcida", calma: "aura-que-respira", barberia: "poste-barbero", salon: "linea-champana", patitas: "cola",
  clinica: "pulso", cancha: "inclinado", picada: "pizarra-y-mantel",
};
/**
 * Las clases del front → partes marcadas con data-mk-adorno (puede llevar varias, separadas por espacio). No entran a una
 * página dentro del panel (la vista previa): esa caja es `[data-mk-para="pagina"]`.
 */
const MARCA = (n) => `[data-mk-adorno~="${n}"]`;
const PARTE = (n) => `${MARCA(n)}:not([data-mk-para="pagina"] *)`;
const CLASES = [
  [/\.lm-hoja:not\(\.lm-hoja \.lm-hoja\)/g, `${PARTE("hoja")}:not(${MARCA("hoja")} ${MARCA("hoja")})`],
  [/\.lm-hoja/g, PARTE("hoja")],
  [/h2\.chakra-heading/g, PARTE("titulo")],
  [/\.lm-mod-titulo/g, PARTE("titulo")],
  [/\.lm-mod-icono/g, PARTE("icono")],
  [/\.lm-icono/g, PARTE("icono")],
  [/\.lm-barra/g, PARTE("barra")],
  [/\.lm-grupo/g, PARTE("grupo")],
  [/\.lm-cabeza/g, PARTE("cabeza")],
  [/\.lm-mod-estado/g, PARTE("estado")],
  [/\.lm-mod-chico/g, PARTE("boton")],
  [/\.lm-mod-boton/g, PARTE("boton")],
  [/\.lm-mod-vacio/g, PARTE("vacio")],
  [/\.lm-mod\b/g, PARTE("hoja")],
  [/\[role="tab"\]\[aria-selected="true"\]/g, ':is([role="tab"][aria-selected="true"],[aria-current="page"])'],
  [/\[role="tab"\]/g, ':is([role="tab"],[aria-current])'],
];

/** Divide un CSS en sus reglas de primer nivel: { cabeza, cuerpo }. */
function reglas(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const a = css.indexOf("{", i);
    if (a < 0) break;
    let n = 1, j = a + 1;
    for (; j < css.length && n > 0; j++) n += css[j] === "{" ? 1 : css[j] === "}" ? -1 : 0;
    out.push({ cabeza: css.slice(i, a).trim(), cuerpo: css.slice(a + 1, j - 1) });
    i = j;
  }
  return out;
}

function convertir(texto, id, faltan) {
  let r = texto.replace(/\[data-tema-panel="([a-z-]+)"\]/g, '[data-mk-tema="$1"][data-mk-para="panel"]');
  for (const [re, por] of CLASES) r = r.replace(re, por);
  if (/\.lm-|chakra-[a-z]/.test(r.replace(/--chakra-colors-[a-z0-9-]+/g, ""))) faltan.add(`${id}: queda una clase del front en «${r.slice(0, 80)}»`);
  r = r.replace(/@keyframes lmt-/g, "@keyframes mk-").replace(/animation:\s*lmt-/g, "animation: mk-");
  return traducir(r.replace(/var\(--lm-grupo/g, "var(--mk-grupo"), id, faltan);
}

/**
 * Lo que motion-kit no anima igual que el front (solo transform y opacity): el aura de «calma» (background-position →
 * una capa detrás que se desliza), el poste de «barbería» (background-position → la franja se desliza dentro de la
 * pestaña) y el pulso de «clínica» (clip-path → aparece y se apaga).
 */
function aMano(nombre, css, faltan) {
  const cambiar = (de, a) => {
    if (!css.includes(de)) faltan.add(`${nombre}: no encontré «${de.slice(0, 60)}» para rehacerlo`);
    css = css.replace(de, a);
  };
  if (nombre === "aura-que-respira") {
    const i = css.indexOf('[data-mk-tema="calma"][data-mk-para="panel"]{background-image:');
    const fin = css.indexOf("}", i);
    const fondo = css.slice(css.indexOf("background-image:", i), css.indexOf(";background-size", i));
    css = css.slice(0, i) + `[data-mk-tema="calma"][data-mk-para="panel"]{position:relative;isolation:isolate}\n[data-mk-tema="calma"][data-mk-para="panel"]::before{content:"";position:fixed;inset:-20%;z-index:-1;pointer-events:none;${fondo};animation: mk-aura 24s ease-in-out infinite alternate}` + css.slice(fin + 1);
    cambiar("@keyframes mk-aura{\n to {\n background-position: 30% 20%, 70% 60%;\n }\n}", "@keyframes mk-aura{to{transform:translate(4%,3%)}}");
    cambiar('@media (prefers-reduced-motion: reduce){[data-mk-tema="calma"][data-mk-para="panel"],', '@media (prefers-reduced-motion: reduce){[data-mk-tema="calma"][data-mk-para="panel"]::before,');
  }
  if (nombre === "poste-barbero") {
    cambiar(" outline: none;\n padding-inline-start: 1.1rem;\n}", " outline: none;\n padding-inline-start: 1.1rem;\n position: relative;\n overflow: clip;\n}");
    cambiar(" inset: 4px auto 4px 4px;", " inset: -45px auto -45px 4px;");
    cambiar(" animation: mk-poste 1.6s linear infinite;\n}", " animation: mk-poste 1.6s linear infinite;\n will-change: transform;\n}");
    cambiar("@keyframes mk-poste{\n to {\n background-position: 0 45px;\n }\n}", "@keyframes mk-poste{from{transform:translateY(-45px)}to{transform:translateY(0)}}");
  }
  if (nombre === "pulso") {
    cambiar(" clip-path: inset(0 100% 0 0);\n animation: mk-pulso", " opacity: 0;\n animation: mk-pulso");
    const k = css.indexOf("@keyframes mk-pulso{");
    const kFin = css.indexOf("\n}\n", k);
    if (k < 0 || kFin < 0) faltan.add("pulso: no encontré sus keyframes");
    else css = css.slice(0, k) + "@keyframes mk-pulso{0%{opacity:0;transform:translateX(-6px)}45%,80%{opacity:1;transform:none}100%{opacity:0;transform:translateX(6px)}}" + css.slice(kFin + 2);
    cambiar(" animation: none;\n clip-path: none;", " animation: none;\n opacity: 1;");
  }
  return css;
}

async function adornos() {
  const faltan = new Set();
  const css = temasPanelCss;
  const todas = reglas(css);
  const porTema = {};
  for (const r of todas) {
    if (r.cabeza.startsWith("@keyframes")) {
      const nombre = r.cabeza.split(/\s+/)[1];
      for (const [id] of Object.entries(FIRMA)) if (todas.some((x) => x.cabeza.includes(`"${id}"`) && x.cuerpo.includes(nombre))) (porTema[id] ??= []).push(`${r.cabeza}{${r.cuerpo}}`);
      continue;
    }
    if (r.cabeza.startsWith("@media")) {
      for (const sub of reglas(r.cuerpo)) {
        const ids = [...new Set([...sub.cabeza.matchAll(/data-tema-panel="([a-z-]+)"/g)].map((m) => m[1]))];
        for (const id of ids) {
          const sel = sub.cabeza.split(",").map((s) => s.trim()).filter((s) => s.includes(`"${id}"`)).join(",\n");
          (porTema[id] ??= []).push(`${r.cabeza}{${sel}{${sub.cuerpo}}}`);
        }
      }
      continue;
    }
    const ids = [...new Set([...r.cabeza.matchAll(/data-tema-panel="([a-z-]+)"/g)].map((m) => m[1]))];
    for (const id of ids) {
      // El bloque de variables del tema: solo lo que no es variable (por ejemplo, el aura de «calma»).
      if (r.cabeza === `[data-tema-panel="${id}"]`) {
        const resto = r.cuerpo.split(";").map((d) => d.trim()).filter((d) => d && !d.startsWith("--") && !d.startsWith("/*")).join(";");
        if (resto) (porTema[id] ??= []).push(`${r.cabeza}{${resto}}`);
        continue;
      }
      (porTema[id] ??= []).push(`${r.cabeza}{${r.cuerpo}}`);
    }
  }
  const salida = {};
  for (const [id, nombre] of Object.entries(FIRMA)) {
    salida[nombre] = aMano(nombre, (porTema[id] ?? []).map((x) => convertir(x, id, faltan)).join("\n").replace(/\n\s*\n/g, "\n").replace(/[ \t]+/g, " "), faltan);
  }
  if (faltan.size) {
    console.log([...faltan].join("\n"));
    process.exit(1);
  }
  writeFileSync(
    "src/temas/datos/adornos.ts",
    `// Las firmas de los temas del panel, como adornos con nombre. Importadas del front de La Mente el 28-11-2026 con\n` +
      `// \`node scripts/temas-del-front.mjs adornos\` (sus clases pasan a partes marcadas con data-mk-parte y sus variables a\n` +
      `// --mk-*); desde ahora la fuente es este archivo. Animan solo transform y opacity.\n\n` +
      `export const CSS_ADORNOS: Record<string, string> = ${JSON.stringify(salida, null, 2)};\n\n` +
      `/** La firma de cada tema del panel. */\nexport const FIRMA_DE_TEMA: Record<string, string> = ${JSON.stringify(FIRMA, null, 2)};\n`,
  );
  console.log(`Adornos: ${Object.keys(salida).length} (${Object.entries(salida).map(([n, c]) => `${n} ${c.length}`).join(", ")}).`);
}

if (modo === "adornos") await adornos();
else if (modo === "importar") await importar();
else if (modo === "revisar") await revisar();
else {
  console.log("Uso: node scripts/temas-del-front.mjs importar | adornos | revisar");
  process.exit(1);
}
