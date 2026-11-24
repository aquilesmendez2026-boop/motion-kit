// Verifica los efectos en un navegador real. Uso: node scripts/verificar-efectos.mjs <url-base>
// Requiere playwright instalado y la demo servida (ver README, sección Efectos).
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:4173";
const IDS = ["cafe","petalos","pulso","abecedario","letrero","cometas","niebla","burbujas","olas","puntos","lluvia","estrellas","rejilla","tubo","ecualizador","velocidad","grano","granos","tijeras","huellas","pesas","lapices","constelacion"];
const browser = await chromium.launch();
let fallos = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FALLA") + " " + m); if (!c) fallos++; };

async function abrir(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto(base + "/#efectos");
  await page.waitForSelector('[data-efecto="estrellas"] .mk-capa');
  return { ctx, page, errs };
}

// 1-4, 7-8 : desktop, variante por variante
const { ctx, page, errs } = await abrir();
for (const v of [1, 2, 3]) {
  await page.getByRole("button", { name: `Variante ${v}` }).click();
  await page.waitForTimeout(300);
  for (const id of IDS) {
    const sel = `[data-efecto="${id}"] .mk-capa`;
    await page.locator(sel).scrollIntoViewIfNeeded();
    await page.waitForSelector(sel);
    const n = await page.locator(`${sel} *`).count();
    ok(n > 0, `${id} v${v}: renderiza hijos (${n})`);
    ok((await page.locator(sel).getAttribute("data-variante")) === String(v), `${id} v${v}: variante aplicada`);
  }
}
const kf = await page.evaluate(() => {
  const malos = [];
  for (const s of document.querySelectorAll('style[id^="motion-kit-"]')) {
    for (const m of s.textContent.matchAll(/@keyframes\s+(mk-[\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
      for (const d of m[2].matchAll(/\{([^}]*)\}/g)) {
        for (const prop of d[1].split(";").map((x) => x.split(":")[0].trim()).filter(Boolean))
          if (!["transform", "opacity"].includes(prop)) malos.push(m[1] + ":" + prop);
      }
    }
  }
  return malos;
});
ok(kf.length === 0, "solo transform y opacity en @keyframes mk-" + (kf.length ? " -> " + kf.join(",") : ""));
const estilos = await page.evaluate(() => {
  const ids = [...document.querySelectorAll('style[id^="motion-kit-"]')].map((s) => s.id);
  return { total: ids.length, unicos: new Set(ids).size };
});
ok(estilos.total === estilos.unicos, `etiquetas <style> únicas (${estilos.total})`);
ok((await page.locator('[data-efecto="no-existe"] .mk-capa').count()) === 0, "id desconocido no dibuja nada");

// 3: pausa fuera de pantalla
await page.evaluate(() => window.scrollTo(0, 0));
await page.locator('[data-efecto="cafe"]').scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(400);
const quieto = await page.locator('[data-efecto="cafe"] .mk-capa').getAttribute("data-quieto");
ok(quieto === "true", "pausa fuera de pantalla (data-quieto)");

// 6: tokens
const color = async () => page.evaluate(() => getComputedStyle(document.querySelector('[data-efecto="petalos"] .mk-capa i')).backgroundImage);
await page.evaluate(() => window.scrollTo(0, 0));
const a = await color();
await page.getByRole("button", { name: "terracota" }).click();
const b = await color();
ok(a !== b, "al cambiar --lm-acento cambia el color del efecto");
ok(errs.length === 0, "sin errores de consola" + (errs.length ? ": " + errs[0] : ""));
await ctx.close();

// 4: reducir movimiento
{
  const { ctx, page } = await abrir({ reducedMotion: "reduce" });
  const r = await page.evaluate((ids) => ids.map((id) => {
    const capa = document.querySelector(`[data-efecto="${id}"] .mk-capa`);
    const con = [...capa.querySelectorAll("*")].filter((e) => getComputedStyle(e).animationName !== "none");
    return { id, animados: con.length, hijos: capa.children.length };
  }), IDS);
  for (const x of r) ok(x.animados === 0 && x.hijos > 0, `${x.id}: quieto y con composición con «reducir movimiento»`);
  await page.screenshot({ path: "/tmp/efectos-reducido.png" });
  await ctx.close();
}

// 5: sin scroll horizontal en teléfono, con todas las paletas
{
  const { ctx, page } = await abrir({ viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true });
  for (const pal of ["clásica", "noche", "terracota", "océano"]) {
    await page.getByRole("button", { name: pal }).click();
    await page.waitForTimeout(200);
    // Contra el ancho del teléfono y no contra innerWidth: en modo teléfono, innerWidth crece con lo que se sale y la resta da siempre cero.
    const d = await page.evaluate(() => document.documentElement.scrollWidth - 360);
    ok(d <= 0, `360 px, paleta ${pal}: sin scroll horizontal (${d})`);
  }
  await ctx.close();
}
await browser.close();
console.log(fallos ? `\n${fallos} fallas` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
