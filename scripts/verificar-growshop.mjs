// La prueba visual de la página de muestra del growshop (#growshop). Reemplaza el diagnóstico del front (diag.ts).
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-growshop.mjs [http://localhost:5173]`.
// Las capturas quedan en <tmp>/mk-growshop/.
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv.find((a) => /^https?:/.test(a)) ?? "http://localhost:5173";
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const CAPTURAS = join(tmpdir(), "mk-growshop");
mkdirSync(CAPTURAS, { recursive: true });
const navegador = await chromium.launch();
const TAMANOS = [["teléfono", { width: 390, height: 844 }], ["escritorio", { width: 1280, height: 800 }]];

async function abrir(tamano, { reducido = false } = {}) {
  const ctx = await navegador.newContext({ viewport: tamano, reducedMotion: reducido ? "reduce" : "no-preference" });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  pagina.on("crash", () => errores.push("la pestaña se cayó"));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.goto(`${base}/#growshop`);
  await pagina.waitForSelector(".gs-pagina");
  return { ctx, pagina, errores };
}

/** Baja la página entera de a poco (como alguien que la recorre) y vuelve arriba. */
async function recorrer(pagina, alto) {
  const total = await pagina.evaluate(() => document.scrollingElement.scrollHeight);
  for (let y = 0; y <= total; y += Math.round(alto * 0.7)) {
    await pagina.evaluate((yy) => window.scrollTo(0, yy), y);
    await pagina.waitForTimeout(350);
  }
  await pagina.waitForTimeout(1200);
}

for (const [d, tamano] of TAMANOS) {
  const { ctx, pagina, errores } = await abrir(tamano);
  await pagina.waitForTimeout(3500);

  // Un solo encabezado (no dos cabeceras, el error que encontró el front).
  revisar((await pagina.$$(".mk-enc")).length === 1, `${d}: un solo encabezado`);

  // El antetítulo del letrero queda centrado sobre el marco y no tapa el título.
  const letrero = await pagina.evaluate(() => {
    const ante = document.querySelector(".mk-enc-ante")?.getBoundingClientRect();
    const titulo = document.querySelector(".mk-enc h1")?.getBoundingClientRect();
    const marco = document.querySelector(".mk-enc-ante")?.parentElement?.getBoundingClientRect();
    if (!ante || !titulo || !marco) return null;
    const cruza = !(ante.bottom <= titulo.top || ante.top >= titulo.bottom || ante.right <= titulo.left || ante.left >= titulo.right);
    return { centro: Math.round(ante.left + ante.width / 2 - (marco.left + marco.width / 2)), cruza, dentro: ante.left >= -1 && ante.right <= innerWidth + 1 };
  });
  revisar(Boolean(letrero) && Math.abs(letrero.centro) <= 4, `${d}: el antetítulo va centrado sobre el letrero (${letrero?.centro} px del centro)`);
  revisar(Boolean(letrero) && !letrero.cruza && letrero.dentro, `${d}: el antetítulo no tapa el título ni se sale de la pantalla`);

  // Recorrer la página: cada bloque termina visible y con alto (sin bloques transparentes).
  await recorrer(pagina, tamano.height);
  const ocultos = await pagina.$$eval("[data-bloque]", (l) =>
    l.filter((x) => Number(getComputedStyle(x).opacity) < 0.99 || x.getBoundingClientRect().height < 20).map((x) => x.dataset.bloque),
  );
  revisar(ocultos.length === 0, `${d}: al bajar, todos los bloques quedan visibles (${ocultos.join(", ") || "todos"})`);
  revisar((await pagina.$$("[data-bloque]")).length >= 17, `${d}: la página tiene sus bloques (${(await pagina.$$("[data-bloque]")).length})`);

  // El precio que rueda no deja huecos entre cifras (con una letra de números de ancho variable).
  const precio = await pagina.$eval(".gs-precio .mk-m-precio", (el) => {
    const cifras = el.querySelector(".mk-m-precio-cifras").getBoundingClientRect().width;
    const medir = document.createElement("span");
    medir.textContent = el.querySelector(".mk-m-lector").textContent;
    medir.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap";
    el.appendChild(medir);
    const texto = medir.getBoundingClientRect().width;
    medir.remove();
    return { cifras: Math.round(cifras), texto: Math.round(texto) };
  });
  revisar(Math.abs(precio.cifras - precio.texto) <= 2, `${d}: el precio que rueda mide lo mismo que su texto, sin huecos (${precio.cifras} vs ${precio.texto} px)`);

  // Teléfono primero: nada se sale de lado y los botones se tocan bien.
  revisar((await pagina.evaluate(() => document.scrollingElement.scrollWidth)) <= tamano.width, `${d}: no se corre de lado`);
  const chicos = await pagina.$$eval(".gs-boton", (l) => l.filter((b) => b.getBoundingClientRect().height < 44).length);
  revisar(chicos === 0, `${d}: los botones miden al menos 44 px`);
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForTimeout(300);
  await pagina.screenshot({ path: join(CAPTURAS, `growshop-${tamano.width}.png`) });
  revisar(errores.length === 0, `${d}: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
  await ctx.close();
}

// Movimiento reducido: todo visible de entrada, sin recorrer.
{
  const { ctx, pagina, errores } = await abrir(TAMANOS[0][1], { reducido: true });
  await pagina.waitForTimeout(1500);
  const ocultos = await pagina.$$eval("[data-bloque]", (l) => l.filter((x) => Number(getComputedStyle(x).opacity) < 0.99).map((x) => x.dataset.bloque));
  revisar(ocultos.length === 0, `reducido: todos los bloques visibles sin bajar (${ocultos.join(", ") || "todos"})`);
  revisar(errores.length === 0, `reducido: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
  await ctx.close();
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : `\nTodo bien. Capturas en ${CAPTURAS}`);
process.exit(fallas ? 1 : 0);
