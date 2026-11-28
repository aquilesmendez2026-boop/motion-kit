// La pasada rápida («humo»): entra a cada vitrina de la demo, la baja de arriba abajo y revisa que no haya errores (en la
// página ni en la consola) y que lo principal se vea. En #hilos y #pagina, además, prueba cada relato de página (cada uno
// se baja aparte). No mira detalles: para eso están las pruebas visuales. Se corre antes de una etiqueta, junto con lo
// que cambió desde la anterior (`npm run verificar -- --desde=<etiqueta>`).
// Uso (con `npm run dev` arriba): node scripts/humo.mjs [url]
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

/** Los relatos de página que existen (del contrato, que sale del catálogo). */
const RELATOS_DE_PAGINA = JSON.parse(readFileSync("contrato/pagina-motionkit.json", "utf8")).listas.relatoPagina;

const base = process.argv.find((a) => /^https?:/.test(a)) ?? "http://localhost:5173";
const empezo = Date.now();
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};

/** Las vitrinas: su ruta y lo que tiene que verse (un selector) para que cuente como cargada. */
const VITRINAS = [
  ["", "main, h1"],
  ["#landing", "main, section"],
  ["#efectos", "main"],
  ["#piezas", "main"],
  ["#estudio", "main, aside"],
  ["#encabezados", ".mk-enc"],
  ["#biblioteca", ".bib"],
  ["#relatos", ".mk-pagina"],
  ["#hilos", "[data-prueba=hilo-pagina]"],
  ["#momentos", "main"],
  ["#profundidad", "main"],
  ["#director", "main"],
  ["#luz", "main"],
  ["#panel", ".pv-panel"],
  ["#panel-piezas", "[data-prueba=panel-tema]"],
  ["#comic", ".cx-pagina"],
  ["#growshop", ".gs-pagina"],
  ["#temas", "[data-prueba=selector-temas]"],
  ["#pagina", ".pag-vista .mk-pagina"],
];

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } });
const pagina = await ctx.newPage();
/** Los errores desde la última vez que se miró. */
let errores = [];
pagina.on("pageerror", (e) => errores.push(e.message.slice(0, 160)));
pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 160)));
// Las letras de Google no se bajan (como en las pruebas visuales): así no dependemos de la red.
await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));

/** Baja la página (o lo que hace scroll en ella) de arriba abajo en unos pasos, para que se carguen las piezas. */
const recorrer = () =>
  pagina.evaluate(async () => {
    const e = document.scrollingElement;
    const pasos = 8;
    for (let i = 0; i <= pasos; i++) {
      e.scrollTo(0, ((e.scrollHeight - e.clientHeight) * i) / pasos);
      await new Promise((r) => setTimeout(r, 120));
    }
    e.scrollTo(0, 0);
  });
/** Corre una revisión; si algo se cae (la página dejó de responder), cuenta como falla y sigue con la siguiente. */
const intentar = async (texto, f) => {
  try {
    await f();
  } catch (e) {
    revisar(false, `${texto}: se cayó (${String(e.message ?? e).split("\n")[0].slice(0, 140)})`);
    errores = [];
  }
};
/** Abre una vitrina desde cero (pasando por una página en blanco: si solo cambiara el ancla, no se recargaría). */
const abrir = async (ruta, principal) => {
  await pagina.goto("about:blank");
  await pagina.goto(`${base}/${ruta}`);
  return pagina.waitForSelector(principal, { timeout: 8000 }).then(() => true, () => false);
};
const mirar = async () => {
  await pagina.waitForTimeout(250);
  const vistos = errores;
  errores = [];
  return vistos.length ? ` (${vistos.length} error${vistos.length > 1 ? "es" : ""}: ${vistos[0]})` : "";
};

for (const [ruta, principal] of VITRINAS) {
  await intentar(ruta || "portada", async () => {
    const hay = await abrir(ruta, principal);
    errores = [];
    await recorrer();
    const problema = await mirar();
    revisar(hay && !problema, `${ruta || "portada"}: carga y se recorre sin errores${hay ? "" : ` (no aparece «${principal}»)`}${problema}`);
  });
}

// Cada relato de página en #hilos y en #pagina (cada uno se baja aparte).
await abrir("#hilos", "[data-prueba=hilo-pagina]");
const enHilos = await pagina.evaluate(() => [...document.querySelectorAll("[data-prueba=hilo-tipo] option")].map((o) => o.value));
for (const hilo of enHilos) {
  await intentar(`#hilos con «${hilo}»`, async () => {
    // Cada uno desde la vitrina recién abierta: si el anterior se cayó, no arrastra al siguiente.
    await abrir("#hilos", "[data-prueba=hilo-pagina]");
    errores = [];
    await pagina.selectOption("[data-prueba=hilo-tipo]", hilo);
    await pagina.waitForTimeout(400);
    await recorrer();
    const problema = await mirar();
    revisar(!problema, `#hilos con «${hilo}» se recorre sin errores${problema}`);
  });
}
await abrir("#pagina", "[data-prueba=relato-pagina]");
const enPagina = await pagina.evaluate(() => [...document.querySelectorAll("[data-prueba=relato-pagina] option")].map((o) => o.value).filter(Boolean));
const faltan = RELATOS_DE_PAGINA.filter((r) => !enPagina.includes(r));
revisar(faltan.length === 0, `#pagina ofrece todos los relatos de página${faltan.length ? ` (faltan: ${faltan.join(", ")})` : ""}`);
for (const relato of enPagina) {
  await intentar(`#pagina con «${relato}»`, async () => {
    await abrir("#pagina", "[data-prueba=relato-pagina]");
    errores = [];
    await pagina.selectOption("[data-prueba=relato-pagina]", relato);
    await pagina.waitForTimeout(400);
    await pagina.evaluate(async () => {
      const v = document.querySelector(".pag-vista");
      for (let i = 0; i <= 6; i++) {
        v.scrollTo(0, ((v.scrollHeight - v.clientHeight) * i) / 6);
        await new Promise((r) => setTimeout(r, 100));
      }
    });
    const problema = await mirar();
    revisar(!problema, `#pagina con «${relato}» se recorre sin errores${problema}`);
  });
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : `\nTodo bien en ${Math.round((Date.now() - empezo) / 1000)} s.`);
process.exit(fallas ? 1 : 0);
