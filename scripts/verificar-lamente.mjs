// Verifica el puente con La Mente en el editor: cada tema con su paleta, y hamburguesería con cada paleta, deja el
// encabezado con los colores de la paleta, la letra del tema y el semáforo de contraste en verde.
// Uso: node scripts/verificar-lamente.mjs [url-base]   (necesita Playwright y la demo servida)
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const TEMAS = ["clasico", "papel", "rock", "rustico", "neon", "mano", "retro", "bruto", "deco", "andino", "hamburgueseria", "peruano"];
const PALETAS = ["clasica", "arena", "bosque", "oceano", "terracota", "ciruela", "noche", "menta", "neon", "papel", "rock", "rustico"];
const navegador = await chromium.launch();
let fallos = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FALLA") + " " + m); if (!c) fallos++; };

const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 } });
const pagina = await ctx.newPage();
const errores = [];
pagina.on("pageerror", (e) => errores.push(e.message));
await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
await pagina.goto(base + "/#encabezados");
await pagina.waitForSelector('[data-prueba="vista"] .mk-enc');

const VISTA = '[data-prueba="vista"]';
async function probar(tema, paleta) {
  await pagina.locator('[data-prueba="lm-tema"]').selectOption(tema);
  await pagina.waitForTimeout(150);
  // Composición sin foto y sin entrada, para medir el contraste sobre el fondo de la paleta.
  await pagina.locator('[data-prueba="composicion"]').selectOption("izquierda");
  await pagina.locator('[data-prueba="entrada"]').selectOption("ninguna");
  if (paleta) await pagina.locator('[data-prueba="lm-paleta"]').selectOption(paleta);
  await pagina.waitForTimeout(2400);
  const r = await pagina.evaluate((sel) => {
    const v = document.querySelector(sel);
    const h = v.querySelector(".mk-enc-titulo");
    const cs = getComputedStyle(v);
    return {
      tema: v.getAttribute("data-lm-tema"),
      paleta: v.getAttribute("data-lm-paleta"),
      fondo: cs.getPropertyValue("--mk-fondo").trim(),
      letra: getComputedStyle(h).fontFamily,
      textura: Boolean(v.querySelector(".mk-estilo-textura")),
    };
  }, VISTA);
  const sem = pagina.locator('[data-prueba="contraste"]');
  const fallas = Number((await sem.getAttribute("data-fallas")) ?? 0);
  const detalle = fallas ? " -> " + (await sem.textContent()).replace(/\s+/g, " ").slice(0, 160) : "";
  return { ...r, fallas, detalle };
}

const LETRA = { clasico: /Outfit/, papel: /Fraunces/, rock: /Anton/, rustico: /Zilla Slab/, neon: /Tilt Neon/, mano: /Caveat/, retro: /Shrikhand/, bruto: /Archivo Black/, deco: /Poiret One/, andino: /Outfit/, hamburgueseria: /Lilita One/, peruano: /Alfa Slab One/ };

for (const tema of TEMAS) {
  const r = await probar(tema);
  ok(r.tema === tema && LETRA[tema].test(r.letra) && !r.textura && r.fallas === 0, `${tema} con su paleta (${r.paleta}): letra del tema, sin textura, contraste en verde${r.detalle}`);
}
for (const paleta of PALETAS) {
  const r = await probar("hamburgueseria", paleta);
  ok(r.paleta === paleta && r.fondo && r.fallas === 0, `hamburguesería + ${paleta}: fondo ${r.fondo}, contraste en verde${r.detalle}`);
}
// Volver a «Sin La Mente» deja los colores del estilo.
await pagina.locator('[data-prueba="lm-tema"]').selectOption("");
await pagina.waitForTimeout(300);
ok((await pagina.locator(`${VISTA}[data-lm-tema]`).count()) === 0, "sin La Mente, vuelven los colores del estilo");
ok(errores.length === 0, "sin errores en la página" + (errores.length ? ": " + errores[0] : ""));

await navegador.close();
console.log(fallos ? `\n${fallos} fallas` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
