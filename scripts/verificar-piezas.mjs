// Verifica botones, tarjetas, movimientos y transiciones en un navegador real.
// Uso: node scripts/verificar-piezas.mjs <url-base>   (necesita Playwright y la demo servida)
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const browser = await chromium.launch();
let fallos = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FALLA") + " " + m); if (!c) fallos++; };
const q = (p) => `[data-prueba="${p}"]`;

async function abrir(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.text()));
  await page.goto(base + "/#piezas");
  await page.waitForSelector(q("presencia"));
  return { ctx, page, errs };
}

const { ctx, page, errs } = await abrir();

// Keyframes: solo transform y opacity
const malos = await page.evaluate(() => {
  const r = [];
  for (const s of document.querySelectorAll('style[id^="motion-kit-"]'))
    for (const m of s.textContent.matchAll(/@keyframes\s+(mk-[\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g))
      for (const d of m[2].matchAll(/\{([^}]*)\}/g))
        for (const prop of d[1].split(";").map((x) => x.split(":")[0].trim()).filter(Boolean))
          if (!["transform", "opacity"].includes(prop)) r.push(m[1] + ":" + prop);
  return r;
});
ok(malos.length === 0, "keyframes mk- solo con transform y opacity" + (malos.length ? " -> " + malos.join(",") : ""));
const estilos = await page.evaluate(() => [...document.querySelectorAll('style[id^="motion-kit-"]')].map((s) => s.id));
ok(estilos.length === new Set(estilos).size, `etiquetas <style> únicas (${estilos.length})`);

// Botones
ok((await page.locator("button.mk-btn:not([type])").count()) === 0, "todos los botones tienen type");
const alturas = await page.locator(".mk-btn").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
ok(alturas.every((h) => h >= 44), `todos los botones miden 44 px o más (mín ${Math.min(...alturas).toFixed(0)})`);
const elev = page.locator(q("efecto-elevar"));
await elev.hover();
await page.waitForTimeout(400);
ok((await elev.evaluate((e) => getComputedStyle(e).transform)) !== "none", "elevar se mueve al pasar el mouse");
await page.locator(q("efecto-relleno")).hover();
await page.waitForTimeout(500);
ok(await page.locator(q("efecto-relleno")).evaluate((e) => getComputedStyle(e, "::before").transform.startsWith("matrix(1,")), "relleno llena el botón");
const des = await page.locator(q("efecto-deslizar") + " .mk-btn-rodillo span").count();
ok(des === 2 && (await page.locator(q("efecto-deslizar") + ' [aria-hidden="true"]').count()) === 1, "deslizar duplica el texto y oculta la copia al lector");
await page.locator(q("carga")).click();
ok((await page.locator(q("carga")).getAttribute("aria-busy")) === "true" && (await page.locator(q("carga")).isDisabled()), "cargando: aria-busy y desactivado");
const enlace = page.locator("a.mk-btn");
ok((await enlace.count()) === 1 && (await enlace.getAttribute("href")) === "#piezas", "Boton con href es un enlace");
await page.keyboard.press("Tab");
ok(await page.evaluate(() => document.activeElement !== document.body), "se puede llegar con teclado");

// Tarjetas
const t = page.locator(q("tarjeta-elevada"));
await t.scrollIntoViewIfNeeded();
await t.hover();
await page.waitForTimeout(800);
ok((await t.evaluate((e) => getComputedStyle(e).transform)) !== "none", "tarjeta elevar se mueve");
ok((await t.locator(".mk-card-media img").evaluate((e) => getComputedStyle(e).transform)) !== "none", "tarjeta zoom acerca la imagen");
const v = page.locator(q("volteable"));
const boton = v.locator(".mk-flip-boton");
await boton.click();
await page.waitForTimeout(800);
ok((await boton.getAttribute("aria-pressed")) === "true" && (await v.getAttribute("data-volteada")) === "", "volteable gira con el botón");
ok((await v.locator(".mk-flip-frente").getAttribute("aria-hidden")) === "true", "la cara oculta no la lee el lector");
await v.locator(".mk-flip-dorso h3").click();
await page.waitForTimeout(100);
ok((await boton.getAttribute("aria-pressed")) === "false", "volteable vuelve al tocarla");

// Movimientos
const n = await page.locator(".piezas-mov-caja [data-movimiento]").count();
ok(n === 23, `23 movimientos en la galería (${n})`);
const sinAnim = await page.locator(".piezas-mov-caja [data-movimiento]").evaluateAll((els) => els.filter((e) => getComputedStyle(e).animationName === "none").map((e) => e.dataset.movimiento));
ok(sinAnim.length === 0, "cada movimiento tiene su animación" + (sinAnim.length ? ": " + sinAnim.join(",") : ""));

// Transiciones
for (const tipo of ["Subir", "Hoja (desde abajo)", "Pasar (como páginas)"]) {
  await page.getByRole("button", { name: tipo, exact: true }).click();
  await page.locator(q("alternar")).click();
  ok((await page.locator(q("presencia")).getAttribute("data-presencia")) === "saliendo", `${tipo}: al ocultar queda saliendo`);
  await page.waitForTimeout(450);
  ok((await page.locator(q("presencia")).count()) === 0, `${tipo}: después sale del DOM`);
  await page.locator(q("alternar")).click();
  ok((await page.locator(q("presencia")).count()) === 1, `${tipo}: vuelve a entrar`);
  await page.waitForTimeout(400);
  const antes = await page.locator(q("cambio") + " h3").textContent();
  await page.locator(q("siguiente")).click();
  await page.waitForTimeout(80);
  ok((await page.locator(q("cambio") + " h3").textContent()) === antes, `${tipo}: el contenido viejo sale primero`);
  await page.waitForTimeout(600);
  const despues = await page.locator(q("cambio") + " h3").textContent();
  ok(despues !== antes && (await page.locator(q("cambio")).evaluate((e) => getComputedStyle(e).opacity)) === "1", `${tipo}: entra el nuevo (${despues})`);
}
// Interrumpir: ocultar y mostrar antes de que termine
await page.locator(q("alternar")).click();
await page.waitForTimeout(60);
await page.locator(q("alternar")).click();
await page.waitForTimeout(500);
ok((await page.locator(q("presencia")).count()) === 1 && (await page.locator(q("presencia")).getAttribute("data-presencia")) === "dentro", "interrumpir la salida deja el contenido visible");
ok(errs.length === 0, "sin errores ni advertencias de consola" + (errs.length ? ": " + errs[0] : ""));
await ctx.close();

// Reducir movimiento
{
  const { ctx, page } = await abrir({ reducedMotion: "reduce" });
  const anim = await page.locator(".piezas-mov-caja [data-movimiento]").evaluateAll((els) => els.map((e) => [e.dataset.movimiento, getComputedStyle(e).animationName]));
  ok(anim.every(([id, a]) => a === "none" || a === "mk-m-aparecer"), "reducir: solo queda el fundido de entrada");
  const op = await page.locator(".piezas-mov-caja [data-movimiento]").evaluateAll((els) => els.map((e) => +getComputedStyle(e).opacity));
  await page.waitForTimeout(500);
  const op2 = await page.locator(".piezas-mov-caja [data-movimiento]").evaluateAll((els) => els.filter((e) => +getComputedStyle(e).opacity < 0.99).length);
  ok(op2 === 0, `reducir: todos los movimientos terminan visibles (${op.length})`);
  const b = page.locator(q("efecto-elevar"));
  await b.hover();
  await page.waitForTimeout(300);
  ok((await b.evaluate((e) => getComputedStyle(e).transform)) === "none", "reducir: el botón no se desplaza");
  await page.getByRole("button", { name: "Voltear", exact: true }).click();
  await page.locator(q("alternar")).click();
  await page.waitForTimeout(300);
  ok((await page.locator(q("presencia")).count()) === 0, "reducir: la salida es corta");
  await ctx.close();
}

// Celular a 360 px con todas las paletas
{
  const { ctx, page } = await abrir({ viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true });
  for (const pal of ["clásica", "noche", "terracota", "océano"]) {
    await page.getByRole("button", { name: pal }).click();
    const d = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(d <= 0, `360 px, paleta ${pal}: sin scroll horizontal (${d})`);
  }
  const rev = page.locator(".mk-card-revelar").first();
  ok((await rev.evaluate((e) => getComputedStyle(e).opacity)) === "1", "celular: el contenido de «revelar» se ve sin hover");
  await ctx.close();
}

await browser.close();
console.log(fallos ? `\n${fallos} fallas` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
