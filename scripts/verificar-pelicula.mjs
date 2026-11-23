// Verifica el encabezado de película en el editor (#encabezados): apertura, varias tomas, palabras que rotan, barra y
// telón al bajar, estado del negocio, foto en las letras, tratamiento de foto, hora del día y colores desde la foto.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-pelicula.mjs [http://localhost:5173]`.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const navegador = await chromium.launch();
const VISTA = '[data-prueba="vista"]';

async function abrir(opciones = {}, antes) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  if (antes) await pagina.addInitScript(antes);
  await pagina.goto(base + "/#encabezados");
  await pagina.waitForSelector(`${VISTA} .mk-enc`);
  return { ctx, pagina, errores };
}
const hay = (pagina, sel) => pagina.locator(`${VISTA} ${sel}`).count();

// --- Apertura ---
{
  const { ctx, pagina, errores } = await abrir();
  await pagina.locator('[data-prueba="presenta"]').fill("Café Vinilo presenta");
  await pagina.locator('[data-prueba="apertura"]').check();
  await pagina.waitForTimeout(150);
  const aparece = await hay(pagina, ".mk-enc-apertura");
  const presenta = aparece ? await pagina.locator(`${VISTA} .mk-enc-apertura`).textContent() : "";
  await pagina.waitForTimeout(3200);
  revisar(aparece === 1 && presenta.includes("Café Vinilo presenta") && (await hay(pagina, ".mk-enc-apertura")) === 0, "apertura: aparece con «presenta» y se quita sola (≤ 3 s)");
  await pagina.locator('[data-prueba="repetir"]').click();
  await pagina.waitForTimeout(300);
  revisar((await hay(pagina, ".mk-enc-apertura")) === 0, "apertura: no vuelve en la misma sesión");
  await pagina.locator('[data-prueba="apertura-otra-vez"]').click();
  await pagina.waitForTimeout(150);
  const otra = await hay(pagina, ".mk-enc-apertura");
  await pagina.mouse.click(700, 300);
  await pagina.waitForTimeout(250);
  revisar(otra === 1 && (await hay(pagina, ".mk-enc-apertura")) === 0, "apertura: «ver otra vez» la muestra y un toque la salta");
  revisar(errores.length === 0, "apertura: sin errores" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}
{
  // Review Focus 1: sessionStorage que lanza (modo privado estricto)
  const { ctx, pagina, errores } = await abrir({}, () => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("bloqueado"); } });
  });
  await pagina.locator('[data-prueba="apertura"]').check();
  await pagina.waitForTimeout(150);
  const aparece = await hay(pagina, ".mk-enc-apertura");
  await pagina.waitForTimeout(3200);
  revisar(aparece === 1 && (await hay(pagina, ".mk-enc-apertura")) === 0 && errores.length === 0, "apertura: con sessionStorage que lanza, igual aparece y se quita, sin errores");
  await ctx.close();
}

// --- Varias tomas ---
async function prepararTomas(pagina) {
  await pagina.locator('[data-prueba="composicion"]').selectOption("imagen");
  await pagina.locator('[data-prueba="fotos-ejemplo"]').check();
  await pagina.locator('[data-prueba="tomas"]').check();
  await pagina.waitForTimeout(600);
}
const tomaActiva = (pagina) => pagina.locator(`${VISTA} .mk-tomas`).getAttribute("data-activa");
{
  const { ctx, pagina, errores } = await abrir();
  await prepararTomas(pagina);
  const a = await tomaActiva(pagina);
  const n = await pagina.locator(`${VISTA} .mk-tomas img`).count();
  await pagina.waitForTimeout(5600);
  const b = await tomaActiva(pagina);
  revisar(n === 3 && a === "0" && b === "1", `tomas: tres fotos y a los 6 s se ve la segunda (${a} → ${b})`);
  revisar(errores.length === 0, "tomas: sin errores" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}
{
  const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
  await prepararTomas(pagina);
  await pagina.waitForTimeout(5600);
  revisar((await tomaActiva(pagina)) === "0", "tomas en quieto: solo la primera, quieta");
  await ctx.close();
}

// --- Palabras que rotan ---
{
  const { ctx, pagina, errores } = await abrir();
  // Un solo protagonista: sin fondo animado, para que las palabras sean las que se mueven.
  await pagina.locator('[data-prueba="efecto"]').selectOption("");
  await pagina.locator('[data-prueba="palabras"]').fill("barrio, autor, la casa");
  await pagina.locator('[data-prueba="palabras"]').blur();
  await pagina.waitForTimeout(1500); // el título se ajusta a su ancho una vez; después ya no debe moverse
  const leer = () => pagina.evaluate((v) => {
    const h = document.querySelector(`${v} .mk-enc-titulo`);
    const activa = h.querySelector(".mk-rot [data-activa]");
    return { alto: Math.round(h.getBoundingClientRect().height), palabra: activa?.textContent ?? "", aria: h.getAttribute("aria-label") };
  }, VISTA);
  const vistos = [await leer()];
  for (let k = 0; k < 3; k++) {
    await pagina.waitForTimeout(2500);
    vistos.push(await leer());
  }
  const palabras = new Set(vistos.map((v) => v.palabra));
  revisar(palabras.size >= 3, `palabras: cambian (${[...palabras].join(", ")})`);
  revisar(new Set(vistos.map((v) => v.alto)).size === 1, `palabras: el título no cambia de alto (${vistos.map((v) => v.alto).join(", ")})`);
  revisar(vistos[0].aria === "Café de especialidad, tostado aquí", `palabras: el lector lee el título con una sola palabra («${vistos[0].aria}»)`);
  // Con fondo animado, las palabras se calman (queda la del título).
  await pagina.locator('[data-prueba="efecto"]').selectOption("rejilla");
  await pagina.waitForTimeout(400);
  revisar((await pagina.locator(`${VISTA} .mk-rot`).count()) === 0, "palabras: con fondo animado no rotan (un solo protagonista)");
  revisar(errores.length === 0, "palabras: sin errores" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}

await navegador.close();
console.log(fallas ? `\n${fallas} fallas` : "\nTodo bien");
process.exit(fallas ? 1 : 0);
