// Verifica estilos, texto cinético, scroll, estudio y las 5 plantillas en un navegador real.
// Uso: node scripts/verificar-estilos.mjs <url-base>   (necesita Playwright y la demo servida)
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const IDS = ["hamburgueseria-neon", "barberia-retro", "sala-ensayo-rock", "academia-anime", "cineclub-pelicula"];
const browser = await chromium.launch();
let fallos = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FALLA") + " " + m); if (!c) fallos++; };

async function abrir(ruta, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/fonts\.googleapis/.test(m.text()) && errs.push(m.text()));
  await page.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.goto(base + ruta);
  return { ctx, page, errs };
}

// Contraste WCAG de cada texto contra el fondo real (sube por los ancestros mezclando transparencias).
const contraste = () => {
  const rgba = (s) => { const m = s.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]; const k = s.startsWith("color(") ? 255 : 1; return [m[0] * k, m[1] * k, m[2] * k, m[3] ?? 1]; };
  const mezcla = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const fondo = (el) => {
    const capas = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== "none" && !e.classList.contains("mk-estilo") && e.tagName !== "IMG") return null; // fondo con imagen: no se mide
      const c = rgba(cs.backgroundColor);
      if (c[3] > 0) { capas.push(c); if (c[3] >= 1) break; }
    }
    let f = [255, 255, 255, 1];
    for (const c of capas.reverse()) f = mezcla(c, f);
    return f;
  };
  const malos = [];
  for (const el of document.querySelectorAll(".mk-pag :is(h1,h2,h3,p,dd,dt,.mk-btn,.mk-pag-precio,.mk-pag-autor,.mk-pag-nav a,.mk-pag-cifras span)")) {
    const r = el.getBoundingClientRect();
    if (!r.width || el.closest(".mk-capa,[aria-hidden=true]")) continue;
    const cs = getComputedStyle(el);
    const bg = fondo(el);
    if (!bg) continue;
    const fg = mezcla(rgba(cs.color), bg);
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    const px = parseFloat(cs.fontSize);
    const grande = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (grande ? 3 : 4.5)) malos.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 24)}" ${ratio.toFixed(2)}`);
  }
  return malos;
};

for (const id of IDS) {
  const { ctx, page, errs } = await abrir(`/#plantilla/${id}`);
  await page.waitForSelector(".mk-pag");
  await page.waitForTimeout(400);
  const secciones = await page.locator(".mk-pag main > *").count();
  ok(secciones === 7, `${id}: 7 secciones (${secciones})`);
  ok((await page.locator(".mk-pag .mk-capa").count()) >= 1, `${id}: efecto protagonista en la portada`);
  const h1 = page.locator(".mk-pag h1");
  ok((await h1.getAttribute("aria-label"))?.length > 3, `${id}: el título se lee completo (aria-label)`);
  await page.waitForTimeout(3500);
  const ocultas = await page.locator(".mk-pag-portada .mk-tc-l").evaluateAll((ls) => ls.filter((l) => +getComputedStyle(l).opacity < 0.99).length);
  ok(ocultas === 0, `${id}: el título termina visible (${ocultas} letras ocultas)`);
  // recorrer la página para activar animaciones
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= alto; y += 350) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(40); }
  // galería horizontal: se mueve con el scroll
  const gh = page.locator(".mk-gh");
  const top = await gh.evaluate((e) => e.getBoundingClientRect().top + scrollY);
  const tx = async (y) => { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(120); return page.locator(".mk-gh-pista").evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41); };
  const t1 = await tx(top + 10), t2 = await tx(top + 500);
  ok(t2 < t1 - 20, `${id}: la galería se desplaza de lado al bajar (${t1.toFixed(0)} → ${t2.toFixed(0)})`);
  // contraste con las animaciones terminadas: cada bloque en pantalla
  const malos = new Set();
  for (let y = 0; y <= alto; y += 500) {
    await page.evaluate((v) => scrollTo(0, v), y);
    await page.waitForTimeout(150);
    for (const m of await page.evaluate(contraste)) malos.add(m);
  }
  ok(malos.size === 0, `${id}: contraste suficiente en textos y botones` + (malos.size ? " -> " + [...malos].slice(0, 4).join(" | ") : ""));
  ok(errs.length === 0, `${id}: sin errores de consola` + (errs.length ? ": " + errs[0] : ""));
  await ctx.close();
}

// Keyframes y celular
{
  const { ctx, page } = await abrir("/#estudio", { viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true });
  await page.waitForSelector(".mk-estilo");
  for (const id of IDS) {
    await page.goto(`${base}/#plantilla/${id}`);
    await page.waitForSelector(".mk-pag");
    await page.waitForTimeout(300);
    // Contra el ancho del teléfono y no contra innerWidth: en modo teléfono, innerWidth crece con lo que se sale y la resta da siempre cero.
    const d = await page.evaluate(() => document.documentElement.scrollWidth - 360);
    ok(d <= 0, `360 px ${id}: sin scroll horizontal (${d})`);
  }
  const malos = await page.evaluate(() => {
    const r = [];
    for (const s of document.querySelectorAll('style[id^="motion-kit-"]'))
      for (const m of s.textContent.matchAll(/@keyframes\s+(mk-[\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g))
        for (const d of m[2].matchAll(/\{([^}]*)\}/g))
          for (const prop of d[1].split(";").map((x) => x.split(":")[0].trim()).filter(Boolean))
            // La regla del repo: transform (o sus propiedades sueltas translate, scale y rotate) y opacity.
            if (!["transform", "translate", "scale", "rotate", "opacity"].includes(prop)) r.push(m[1] + ":" + prop);
    return r;
  });
  ok(malos.length === 0, "keyframes mk- solo con transform (o translate, scale, rotate) y opacity" + (malos.length ? " -> " + malos.join(",") : ""));
  await ctx.close();
}

// Estudio: sorpréndeme, cambio de estilo con transición de vista y sonidos
{
  const { ctx, page, errs } = await abrir("/#estudio");
  await page.waitForSelector('[data-prueba="vista"]');
  const vistos = new Set();
  for (let i = 0; i < 8; i++) {
    await page.locator('[data-prueba="sorprendeme"]').click();
    await page.waitForTimeout(700);
    vistos.add(await page.locator('[data-prueba="vista"]').getAttribute("data-mk-estilo"));
  }
  ok(vistos.size >= 2, `sorpréndeme cambia de estilo (${[...vistos].join(", ")})`);
  await page.getByRole("button", { name: "Película" }).click();
  await page.waitForTimeout(1300);
  ok((await page.locator('[data-prueba="vista"]').getAttribute("data-mk-estilo")) === "pelicula", "elegir estilo con transición de vista");
  ok(!(await page.evaluate(() => document.documentElement.dataset.mkVista)), "la transición de vista se limpia al terminar");
  await page.getByLabel("Sonidos al tocar").check();
  await page.locator('[data-prueba="vista"] .mk-btn').first().click();
  ok(errs.length === 0, "estudio sin errores de consola" + (errs.length ? ": " + errs[0] : ""));
  await ctx.close();
}

// Reducir movimiento
{
  const { ctx, page } = await abrir(`/#plantilla/${IDS[3]}`, { reducedMotion: "reduce" });
  await page.waitForSelector(".mk-pag");
  await page.waitForTimeout(200);
  const anim = await page.locator(".mk-tc-l").evaluateAll((ls) => ls.filter((l) => getComputedStyle(l).animationName !== "none" || +getComputedStyle(l).opacity < 1).length);
  ok(anim === 0, "reducir: el texto cinético aparece quieto y completo");
  const fijo = await page.locator(".mk-gh-fijo").evaluate((e) => getComputedStyle(e).overflowX);
  ok(fijo === "auto", "reducir: la galería horizontal queda como fila deslizable");
  await ctx.close();
}

await browser.close();
console.log(fallos ? `\n${fallos} fallas` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
