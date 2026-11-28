// La prueba visual de los temas como datos (#temas, fase 2 de «Un solo motor»).
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-temas.mjs [http://localhost:5173]`.
// Las capturas quedan en <tmp>/mk-temas/.
import { mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv.find((a) => /^https?:/.test(a)) ?? "http://localhost:5173";
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const CAPTURAS = join(tmpdir(), "mk-temas");
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
  await pagina.goto(`${base}/#temas`);
  await pagina.waitForSelector("[data-prueba=selector-temas]");
  return { ctx, pagina, errores };
}
const elegir = async (pagina, lado, id) => {
  await pagina.click(`[data-lado="${lado}"]`);
  await pagina.click(`[data-tema-id="${id}"]`);
  await pagina.waitForTimeout(120);
};
const temaDeLaVista = (pagina) => pagina.$eval(".tm-vista", (el) => el.dataset.mkTema).catch(() => null);
const varDe = (pagina, sel, v) => pagina.$eval(sel, (el, vv) => getComputedStyle(el).getPropertyValue(vv).trim(), v).catch(() => null);

for (const [d, tamano] of TAMANOS) {
  const { ctx, pagina, errores } = await abrir(tamano);
  // Cada tema de cada lado se aplica: la caja dice cuál es.
  const malos = [];
  for (const lado of ["panel", "pagina"]) {
    await pagina.click(`[data-lado="${lado}"]`);
    const ids = await pagina.$$eval("[data-tema-id]", (l) => l.map((b) => b.dataset.temaId));
    for (const id of ids) {
      await pagina.click(`[data-tema-id="${id}"]`);
      await pagina.waitForTimeout(60);
      if ((await temaDeLaVista(pagina)) !== id) malos.push(`${lado}:${id}`);
    }
    revisar(ids.length === (lado === "panel" ? 14 : 12), `${d}: el selector trae los ${lado === "panel" ? 14 : 12} temas de ${lado === "panel" ? "el panel" : "la página"} (${ids.length})`);
  }
  revisar(malos.length === 0, `${d}: cada tema se aplica a la vista (${malos.join(", ") || "todos"})`);

  // El selector se ve entero, sin deslizar (en dos líneas si hace falta).
  if (tamano.width >= 1280) {
    const cabe = await pagina.$eval("[data-prueba=selector-temas]", (el) => el.scrollWidth <= el.clientWidth + 1);
    revisar(cabe, `${d}: el selector de temas se ve entero, sin deslizar`);
  }

  // El alcance: la vista de la página, dentro del panel «taller», tiene sus propios colores y no hereda su trazo.
  await elegir(pagina, "panel", "taller");
  const fondoPagina = await varDe(pagina, "[data-prueba=vista-pagina]", "--mk-fondo");
  const trazoPagina = await varDe(pagina, "[data-prueba=vista-pagina]", "--mk-trazo");
  const trazoPanel = await varDe(pagina, ".tm-vista", "--mk-trazo");
  revisar(fondoPagina === "#ffffff" && trazoPagina === "" && trazoPanel !== "", `${d}: la página dentro del panel no hereda su tema (fondo ${fondoPagina}, trazo «${trazoPagina}»)`);

  // Cambiar de tema quita la firma del anterior: la cinta de peligro de «taller» no queda en «calma».
  const conCinta = await pagina.$eval(".tm-vista [data-mk-adorno~=hoja]", (el) => getComputedStyle(el).backgroundImage);
  await elegir(pagina, "panel", "calma");
  const sinCinta = await pagina.$eval(".tm-vista [data-mk-adorno~=hoja]", (el) => getComputedStyle(el).backgroundImage);
  revisar(/repeating-linear-gradient/.test(conCinta) && sinCinta === "none", `${d}: cambiar de tema quita la firma del anterior`);

  // Una parte marcada dentro de la página (el título de la vista previa) no toma la firma del panel: con «cancha», el
  // título del panel se inclina y el de la página no (hallazgo de la revisión final de la v0.8.0).
  await elegir(pagina, "panel", "cancha");
  await pagina.waitForTimeout(300);
  const inclinado = await pagina.$eval(".tm-vista > .tm-cabeza [data-mk-adorno~=titulo]", (el) => getComputedStyle(el).transform).catch(() => "none");
  const enLaPagina = await pagina.$eval("[data-prueba=vista-pagina] [data-mk-adorno~=titulo]", (el) => getComputedStyle(el).transform).catch(() => "falta");
  revisar(inclinado !== "none" && enLaPagina === "none", `${d}: la firma del panel no entra a la página (panel ${inclinado}, página ${enLaPagina})`);

  // Teléfono primero: nada se sale de lado.
  revisar((await pagina.evaluate(() => document.scrollingElement.scrollWidth)) <= tamano.width, `${d}: no se corre de lado`);
  await elegir(pagina, "panel", "barberia");
  await pagina.screenshot({ path: join(CAPTURAS, `temas-${tamano.width}.png`) });
  revisar(errores.length === 0, `${d}: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
  await ctx.close();
}

// La guía (fase 3): cada uno de los 14 temas del panel, en teléfono y escritorio, con todas sus secciones, sin errores,
// sin correrse de lado y con su firma montada (los adornos del contrato).
{
  const CONTRATO = JSON.parse(readFileSync(new URL("../contrato/temas-motionkit.json", import.meta.url), "utf8"));
  const adornosDe = (id) => {
    const t = CONTRATO.temas.find((x) => x.id === id);
    return t?.panel?.adornos ?? t?.adornos ?? [];
  };
  const inicio = Date.now();
  for (const [d, tamano] of TAMANOS) {
    const { ctx, pagina, errores } = await abrir(tamano);
    await pagina.click('[data-lado="panel"]');
    const ids = await pagina.$$eval("[data-tema-id]", (l) => l.map((b) => b.dataset.temaId));
    const malos = [];
    for (const id of ids) {
      await pagina.click(`[data-tema-id="${id}"]`);
      await pagina.waitForTimeout(250);
      const r = await pagina.evaluate((tid) => {
        const secciones = [...document.querySelectorAll(".tm-guia > section")];
        return {
          tema: document.querySelector(".tm-vista")?.dataset.mkTema,
          secciones: secciones.length,
          sinBajada: secciones.filter((s) => !s.querySelector("h2") || !(s.textContent ?? "").trim()).length,
          ancho: document.scrollingElement.scrollWidth,
          firma: [...document.querySelectorAll("style")].some((s) => s.textContent.includes(`[data-mk-tema="${tid}"][data-mk-para="panel"]`)),
          barra: document.querySelectorAll(".tm-guia .mk-barra").length,
        };
      }, id);
      const conFirma = adornosDe(id).length > 0;
      const fallas = [];
      if (r.tema !== id) fallas.push(`vista ${r.tema}`);
      if (r.secciones !== 12 || r.sinBajada) fallas.push(`${r.secciones} secciones`);
      if (r.ancho > tamano.width) fallas.push(`ancho ${r.ancho}`);
      if (conFirma && !r.firma) fallas.push("sin firma");
      if (r.barra !== 2) fallas.push(`${r.barra} barras`);
      if (fallas.length) malos.push(`${id}: ${fallas.join(", ")}`);
    }
    revisar(ids.length === 14 && malos.length === 0, `guía (${d}): los 14 temas con las 12 secciones, sin correrse de lado y con su firma (${malos.join("; ") || "todos"})`);
    revisar(errores.length === 0, `guía (${d}): sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await pagina.screenshot({ path: join(CAPTURAS, `guia-${tamano.width}.png`), fullPage: true });
    await ctx.close();
  }
  const segundos = (Date.now() - inicio) / 1000;
  revisar(segundos < 120, `guía: el recorrido dura menos de 2 minutos (${segundos.toFixed(0)} s)`);
}
// La guía en uso: la subida de muestra hace su recorrido completo, llega un pedido, se confirma y suena un aviso.
{
  const { ctx, pagina, errores } = await abrir(TAMANOS[0][1]);
  const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  await pagina.setInputFiles(".tm-guia .mk-subir >> nth=0 >> input[type=file]", { name: "logo.png", mimeType: "image/png", buffer: PNG });
  await pagina.waitForTimeout(200);
  const subiendo = await pagina.$eval(".tm-guia .mk-subir >> nth=0", (el) => el.dataset.estado).catch(() => pagina.$$eval(".tm-guia .mk-subir", (l) => l[0]?.dataset.estado));
  await pagina.waitForTimeout(2200);
  const lista = await pagina.$$eval(".tm-guia .mk-subir", (l) => l[0]?.dataset.estado);
  revisar(subiendo === "subiendo" && lista === "lista", `guía: la subida de muestra sube y queda lista (${subiendo} → ${lista})`);
  const antes = await pagina.$$eval(".tm-pedido", (l) => l.length);
  await pagina.click("text=Llega un pedido");
  await pagina.waitForTimeout(150);
  revisar((await pagina.$$eval(".tm-pedido", (l) => l.length)) === antes + 1 && Boolean(await pagina.$(".tm-pedidos [data-mk-destello]")), `guía: llega un pedido, con su destello`);
  await pagina.click("text=Borrar «Latte»");
  await pagina.waitForSelector("[role=alertdialog]");
  await pagina.click("[role=alertdialog] >> text=Sí, borrar");
  await pagina.waitForTimeout(500);
  revisar(Boolean(await pagina.$("text=Borraste «Latte»")), `guía: confirmar borra y avisa`);
  await pagina.click("text=Recorrer la guía");
  await pagina.waitForTimeout(700);
  revisar(Boolean(await pagina.$(".mk-guia [role=dialog]")), `guía: «Recorrer la guía» abre el recorrido`);
  await pagina.keyboard.press("Escape");
  revisar(errores.length === 0, `guía en uso: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
  await ctx.close();
}

// Movimiento reducido: los adornos que se mueven (aura, poste, pulso, respira, cola) quedan quietos.
{
  const { ctx, pagina } = await abrir(TAMANOS[1][1], { reducido: true });
  const corriendo = [];
  for (const id of ["calma", "barberia", "clinica", "patitas"]) {
    await elegir(pagina, "panel", id);
    await pagina.waitForTimeout(200);
    const n = await pagina.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && /^mk-(aura|poste|pulso|respira|cola)/.test(a.animationName ?? "")).length);
    if (n) corriendo.push(`${id}: ${n}`);
  }
  revisar(corriendo.length === 0, `reducido: ningún adorno se mueve (${corriendo.join(", ") || "todos quietos"})`);
  await ctx.close();
}
// Cambiar de tema en vivo sin volver a montar (el panel vivo): la firma del tema nuevo se monta (hallazgo de la revisión).
{
  const { ctx, pagina } = await navegador.newContext({ viewport: TAMANOS[1][1] }).then(async (ctx) => ({ ctx, pagina: await ctx.newPage() }));
  await pagina.goto(`${base}/#panel?s=colaboraciones`);
  await pagina.waitForSelector("[data-prueba=tema]");
  await pagina.selectOption("[data-prueba=tema]", "taller");
  await pagina.waitForTimeout(500);
  await pagina.selectOption("[data-prueba=tema]", "calma");
  await pagina.waitForTimeout(500);
  const aura = await pagina.evaluate(() => [...document.querySelectorAll("style")].some((s) => s.textContent.includes('[data-mk-tema="calma"]') && s.textContent.includes("mk-aura")));
  const hoja = await pagina.$eval(".pv-panel [data-mk-adorno~=hoja]", (el) => getComputedStyle(el).backgroundImage).catch(() => "falta");
  revisar(aura && hoja === "none", `en el panel vivo, pasar de «taller» a «calma» monta la firma de calma y saca la de taller (${aura}, ${hoja})`);
  await ctx.close();
}
// Sin reducir, el poste de la barbería sí se mueve (y solo con transform).
{
  const { ctx, pagina } = await abrir(TAMANOS[1][1]);
  await elegir(pagina, "panel", "barberia");
  await pagina.waitForTimeout(300);
  const poste = await pagina.evaluate(() => document.getAnimations().filter((a) => a.animationName === "mk-poste").length);
  revisar(poste > 0, `el poste de la barbería se mueve (${poste})`);
  await ctx.close();
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : `\nTodo bien. Capturas en ${CAPTURAS}`);
process.exit(fallas ? 1 : 0);
