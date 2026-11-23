// Verifica el editor de encabezados: 12 composiciones, 7 entradas, packs de botones y textos.
// Uso: node scripts/verificar-encabezados.mjs <url-base>   (necesita Playwright y la demo servida)
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const COMPOS = ["centrado", "izquierda", "dividido", "gigante", "tarjeta", "imagen", "letrero", "poster", "boleto", "pantalla", "vinetas", "marquesina"];
const ENTRADAS = ["ninguna", "cascada", "deslizar", "zoom", "foco", "telon", "golpe"];
const browser = await chromium.launch();
let fallos = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FALLA") + " " + m); if (!c) fallos++; };

async function abrir(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, ...opts });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errs.push(m.text()));
  await page.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await page.goto(base + "/#encabezados");
  await page.waitForSelector('[data-prueba="vista"] .mk-enc');
  return { ctx, page, errs };
}

const VISTA = '[data-prueba="vista"]';
// Contraste del título, bajada, antetítulo, datos y botones contra el fondo real.
const contraste = (raiz) => {
  const rgba = (s) => { const m = s.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]; const k = s.startsWith("color(") ? 255 : 1; return [m[0] * k, m[1] * k, m[2] * k, m[3] ?? 1]; };
  const mezcla = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1);
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const fondo = (el) => {
    const capas = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== "none" && !e.classList.contains("mk-estilo")) return null;
      const c = rgba(cs.backgroundColor);
      if (c[3] > 0) { capas.push(c); if (c[3] >= 1) break; }
    }
    let f = [255, 255, 255, 1];
    for (const c of capas.reverse()) f = mezcla(c, f);
    return f;
  };
  const malos = [];
  const r0 = document.querySelector(raiz);
  if (r0.querySelector(".mk-enc[data-composicion=imagen],.mk-enc[data-composicion=tarjeta]")) return malos; // texto sobre foto: no se mide
  for (const el of r0.querySelectorAll(".mk-enc-titulo,.mk-enc-bajada,.mk-enc-ante,.mk-enc-datos li,.mk-btn")) {
    const cs = getComputedStyle(el);
    const bg = fondo(el);
    if (!bg) continue;
    const fg = mezcla(rgba(cs.color), bg);
    const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    const px = parseFloat(cs.fontSize);
    const grande = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (grande ? 3 : 4.5)) malos.push(`${el.className.split(" ")[0] || el.tagName} "${el.textContent.trim().slice(0, 18)}" ${ratio.toFixed(2)}`);
  }
  return malos;
};
const todoVisible = (raiz) => {
  const r0 = document.querySelector(raiz);
  const ocultos = [...r0.querySelectorAll(".mk-enc-caja>*,.mk-enc-marco,.mk-enc-media,.mk-enc-paneles,.mk-tc-l,.mk-btn")].filter((e) => {
    let o = 1;
    for (let x = e; x && x !== r0; x = x.parentElement) o *= +getComputedStyle(x).opacity;
    return o < 0.98;
  });
  const telon = [...r0.querySelectorAll(".mk-enc-telon")].some((t) => getComputedStyle(t).display !== "none" && [...t.children].some((i) => { const r = i.getBoundingClientRect(), c = t.getBoundingClientRect(); return r.right > c.left + 2 && r.left < c.right - 2 && getComputedStyle(i).display !== "none"; }) && +getComputedStyle(t).opacity > 0.02);
  return { ocultos: ocultos.length, telon };
};

// Por estilo y composición: visible, sin desborde, contraste, botones de 44 px
for (const [nombre, vp, mob] of [["escritorio", { width: 1280, height: 860 }, false], ["360 px", { width: 360, height: 780 }, true]]) {
  const { ctx, page, errs } = await abrir({ viewport: vp, hasTouch: mob, isMobile: mob });
  for (const estilo of ["Neón", "Retro", "Rock", "Anime", "Película"]) {
    await page.getByRole("button", { name: estilo, exact: true }).click();
    await page.waitForTimeout(700);
    const problemas = [];
    for (const c of COMPOS) {
      await page.locator('[data-prueba="composicion"]').selectOption(c);
      await page.waitForTimeout(3000);
      const v = await page.evaluate(todoVisible, VISTA);
      if (v.ocultos || v.telon) problemas.push(`${c}: ${v.ocultos} ocultos${v.telon ? ", telón tapando" : ""}`);
      const d = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (d > 0) problemas.push(`${c}: scroll horizontal ${d}`);
      const enc = await page.locator(`${VISTA} .mk-enc`).evaluate((e) => {
        const r = e.getBoundingClientRect();
        let peor = 0;
        for (const x of e.querySelectorAll(".mk-enc-in *:not(.mk-enc-cinta *)")) {
          const b = x.getBoundingClientRect();
          if (b.width) peor = Math.max(peor, b.right - r.right, r.left - b.left);
        }
        return Math.round(peor);
      });
      if (enc > 1) problemas.push(`${c}: contenido más ancho que el encabezado (${enc})`);
      for (const m of await page.evaluate(contraste, VISTA)) problemas.push(`${c}: contraste ${m}`);
      const bajos = await page.locator(`${VISTA} .mk-btn`).evaluateAll((bs) => bs.filter((b) => b.getBoundingClientRect().height < 43.5).length);
      if (bajos) problemas.push(`${c}: ${bajos} botones bajo 44 px`);
    }
    ok(problemas.length === 0, `${nombre}, ${estilo}: 12 composiciones visibles, sin desborde, con contraste` + (problemas.length ? " -> " + problemas.slice(0, 4).join(" | ") : ""));
  }
  ok(errs.length === 0, `${nombre}: sin errores de consola` + (errs.length ? ": " + errs[0] : ""));
  await ctx.close();
}

// Entradas: todas terminan con todo visible y el telón fuera
{
  const { ctx, page, errs } = await abrir();
  for (const c of ["dividido", "boleto", "vinetas", "imagen"]) {
    await page.locator('[data-prueba="composicion"]').selectOption(c);
    for (const e of ENTRADAS) {
      await page.locator('[data-prueba="entrada"]').selectOption(e);
      await page.waitForTimeout(150);
      const durante = await page.evaluate(() => document.querySelector('[data-prueba="vista"] .mk-enc')?.dataset.entrada);
      await page.waitForTimeout(2800);
      const v = await page.evaluate(todoVisible, VISTA);
      ok(durante === e && v.ocultos === 0 && !v.telon, `${c} + ${e}: termina con todo visible`);
    }
  }
  // pack, palabra destacada y JSON
  await page.locator('[data-prueba="pack"]').selectOption("ticket");
  ok((await page.locator(`${VISTA} .mk-btn`).first().getAttribute("data-forma")) === "ticket", "el pack cambia la forma de los botones");
  await page.locator('[data-campo="titulo"]').fill("Pan de *masa madre*, todos los días");
  await page.locator('[data-campo="titulo"]').blur();
  await page.waitForTimeout(300);
  ok((await page.locator(`${VISTA} .mk-tc-dest`).count()) === 1, "la palabra entre asteriscos se destaca");
  ok((await page.locator(`${VISTA} h1`).getAttribute("aria-label")) === "Pan de masa madre, todos los días", "el lector lee el título sin asteriscos");
  const json = JSON.parse(await page.locator('[data-prueba="json"]').textContent());
  ok(json.composicion && json.entrada && json.pack === "ticket" && json.titulo.includes("*masa madre*"), "el JSON guarda lo que el cliente eligió");
  ok(json.version === 2 && json.estilo && (await page.locator('[data-prueba="json"][data-valida]').count()) === 1, "el JSON es una receta válida (se guarda como v2)");
  // receta mala: título largo → error en español con el campo; al corregirlo, vuelve a ser válida
  await page.locator('[data-campo="titulo"]').fill("x".repeat(90));
  await page.locator('[data-campo="titulo"]').blur();
  const error = await page.locator('[data-prueba="errores"]').textContent().catch(() => "");
  ok(/titulo: El título no puede pasar de 80 letras/.test(error), "un título de 90 letras da su error en español");
  await page.locator('[data-campo="titulo"]').fill("Pan de *masa madre*, todos los días");
  await page.locator('[data-campo="titulo"]').blur();
  ok((await page.locator('[data-prueba="errores"]').count()) === 0, "al corregirlo, el error se va");
  for (let i = 0; i < 5; i++) { await page.locator('[data-prueba="azar"]').click(); await page.waitForTimeout(900); }
  ok(errs.length === 0, "entradas y sorpréndeme sin errores" + (errs.length ? ": " + errs[0] : ""));
  ok((await page.locator("[data-muestra] .mk-enc-titulo").count()) === 12, "la galería muestra las 12 composiciones");
  // Volver: «← Demo» lleva a la portada sin recargar, y el botón atrás del navegador trae de vuelta el editor.
  await page.locator('.estudio-panel a[href="#"]').first().click();
  await page.waitForTimeout(300);
  ok((await page.locator('a[href="#encabezados"]').count()) > 0 && (await page.locator(".enc-editor").count()) === 0, "«← Demo» vuelve a la portada sin recargar");
  await page.goBack();
  await page.waitForTimeout(300);
  ok((await page.locator(".enc-editor").count()) === 1, "atrás del navegador vuelve al editor");
  const malos = await page.evaluate(() => {
    const r = [];
    for (const s of document.querySelectorAll('style[id^="motion-kit-"]'))
      for (const m of s.textContent.matchAll(/@keyframes\s+(mk-[\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g))
        for (const d of m[2].matchAll(/\{([^}]*)\}/g))
          for (const prop of d[1].split(";").map((x) => x.split(":")[0].trim()).filter(Boolean))
            // translate, scale y rotate son partes de transform escritas aparte: el navegador las anima igual de liviano.
            if (!["transform", "translate", "scale", "rotate", "opacity"].includes(prop)) r.push(m[1] + ":" + prop);
    return r;
  });
  ok(malos.length === 0, "keyframes mk- solo con transform (o translate, scale, rotate) y opacity" + (malos.length ? " -> " + malos.join(",") : ""));
  await ctx.close();
}

// Reducir movimiento: todo visible de inmediato, sin telón
{
  const { ctx, page } = await abrir({ reducedMotion: "reduce" });
  for (const e of ["telon", "foco", "deslizar"]) {
    await page.locator('[data-prueba="entrada"]').selectOption(e);
    await page.waitForTimeout(200);
    const v = await page.evaluate(todoVisible, VISTA);
    ok(v.ocultos === 0 && !v.telon, `reducir + ${e}: visible de inmediato`);
  }
  await ctx.close();
}

await browser.close();
console.log(fallos ? `\n${fallos} fallas` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
