// Verifica los momentos en #momentos: que el texto se lea desde el inicio, que cada momento arranque al verse y llegue
// a su estado final, el movimiento reducido, los controles con teclado (deslizador, «Ver premio», reseñas), los colores
// de La Mente fuera de un Estilo, que los keyframes solo animen transform y opacidad, y el ancho a 360 px.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-momentos.mjs [http://localhost:5173]`.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const navegador = await chromium.launch();
const IDS = ["sellos", "resenas", "carta", "precio", "cuenta", "mapa", "mosaico", "antesdespues", "sorteo"];

async function abrir(opciones = {}, preparar) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, ...opciones });
  const pagina = await ctx.newPage();
  if (preparar) await preparar(pagina);
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.goto(base + "/#momentos");
  await pagina.waitForSelector("[data-momento]");
  return { ctx, pagina, errores };
}

/** Pasa por cada momento para que arranque y espera a que terminen las entradas. */
async function recorrer(pagina) {
  for (const el of await pagina.locator("[data-momento]").all()) {
    await el.scrollIntoViewIfNeeded();
    await pagina.waitForTimeout(150);
  }
  await pagina.waitForTimeout(2600);
}

/** Opacidad efectiva (multiplicada hasta la raíz del momento) de lo que es texto visible. */
const opacidadTextos = (pagina) =>
  pagina.evaluate(() =>
    [...document.querySelectorAll(".mk-momento :is(p, a, blockquote, figcaption, strong)")]
      .filter((e) => !e.closest("[aria-hidden=true]") && !e.classList.contains("mk-m-lector"))
      .map((e) => {
        let o = 1;
        for (let n = e; n && n !== document.body; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      }),
  );

// 1. Escritorio: todos los momentos, sin errores, texto legible antes de bajar.
{
  const { ctx, pagina, errores } = await abrir();
  const ids = await pagina.$$eval("[data-momento]", (xs) => [...new Set(xs.map((x) => x.dataset.momento))]);
  revisar(IDS.every((id) => ids.includes(id)), `están los 9 momentos (${ids.join(", ")})`);
  revisar((await opacidadTextos(pagina)).every((o) => o === 1), "antes de bajar, todo el texto se lee (opacidad 1)");
  revisar((await pagina.locator("[data-prueba=sorteo] .mk-m-raspe-premio").textContent()).includes("Desayuno para dos"), "el premio está en la página desde el inicio");

  await recorrer(pagina);
  const sinArrancar = await pagina.$$eval("[data-momento]", (xs) => xs.filter((x) => !x.hasAttribute("data-activo")).map((x) => x.dataset.momento));
  revisar(sinArrancar.length === 0, `todos arrancaron al verse${sinArrancar.length ? ` (faltan: ${sinArrancar.join(", ")})` : ""}`);
  const decorado = await pagina.$$eval(".mk-m-sellos-lista li[data-lleno], .mk-m-mapa-capa, .mk-m-pin-cae", (xs) => xs.map((x) => Number(getComputedStyle(x).opacity)));
  revisar(decorado.length > 0 && decorado.every((o) => o === 1), "lo decorativo llega a su estado final (sellos, calles, pin)");
  revisar((await opacidadTextos(pagina)).every((o) => o === 1), "después de bajar, todo el texto se lee");

  // Solo transform, translate, rotate, scale y opacidad en los keyframes de los momentos.
  const malos = await pagina.evaluate(() => {
    const permitidas = new Set(["transform", "translate", "rotate", "scale", "opacity"]);
    const fuera = [];
    let vistos = 0;
    for (const hoja of document.styleSheets) {
      const nodo = hoja.ownerNode;
      if (!nodo || !String(nodo.id).startsWith("motion-kit-momento")) continue;
      for (const r of hoja.cssRules) {
        if (!(r instanceof CSSKeyframesRule)) continue;
        vistos++;
        for (const k of r.cssRules) for (let i = 0; i < k.style.length; i++) if (!permitidas.has(k.style[i])) fuera.push(`${r.name}: ${k.style[i]}`);
      }
    }
    return { fuera, vistos };
  });
  revisar(malos.vistos >= 10 && malos.fuera.length === 0, `los ${malos.vistos} keyframes solo animan transform y opacidad${malos.fuera.length ? ` (${malos.fuera.join(", ")})` : ""}`);

  // Deslizador con teclado.
  const slider = pagina.locator("[data-momento=antesdespues] [role=slider]");
  await slider.focus();
  await pagina.keyboard.press("ArrowRight");
  revisar((await slider.getAttribute("aria-valuenow")) === "55", "el deslizador se mueve con las flechas (50 → 55)");

  // Reseñas con «Siguiente».
  await pagina.locator("[data-prueba=resenas] button", { hasText: "Siguiente" }).click();
  await pagina.waitForTimeout(450);
  revisar((await pagina.locator("[data-prueba=resenas] [data-prueba='reseña-actual']").textContent()).startsWith("Reseña 2 de"), "«Siguiente» pasa a la reseña 2");

  // «Ver premio» quita la capa y la página se vuelve a mover sobre la tarjeta.
  await pagina.locator("[data-prueba=sorteo] button.mk-m-boton", { hasText: "Ver premio" }).click();
  await pagina.waitForTimeout(700);
  revisar((await pagina.locator("[data-prueba=sorteo] canvas").count()) === 0, "«Ver premio» quita la capa del raspe");
  const zona = await pagina.locator("[data-prueba=sorteo] .mk-m-raspe-zona").boundingBox();
  const antes = await pagina.evaluate(() => scrollY);
  await pagina.mouse.move(zona.x + zona.width / 2, zona.y + zona.height / 2);
  await pagina.mouse.wheel(0, 300);
  await pagina.waitForTimeout(400);
  revisar((await pagina.evaluate(() => scrollY)) !== antes, "después de revelar, la rueda sobre la tarjeta mueve la página");

  // «Repetir» vuelve a montar y a arrancar el momento.
  await pagina.locator("[data-prueba=sellos] .mom-repetir").click();
  await pagina.waitForTimeout(600);
  revisar(await pagina.locator("[data-prueba=sellos] [data-momento=sellos]").evaluate((e) => e.hasAttribute("data-activo")), "«Repetir» vuelve a arrancar el momento");

  // Fuera de un Estilo, los colores salen de las variables de La Mente.
  const fondo = await pagina.locator("[data-prueba=suelto] .mk-m-sellos-lista li[data-lleno]").first().evaluate((e) => getComputedStyle(e).backgroundColor);
  revisar(fondo === "rgb(42, 157, 143)", `sin Estilo, el sello toma el acento de La Mente (${fondo})`);

  // Cambiar de estilo (retro va por pasos) no rompe nada.
  await pagina.selectOption("[data-prueba=estilo]", "retro");
  await pagina.waitForTimeout(300);
  await pagina.selectOption("[data-prueba=estilo]", "lamente");
  await pagina.waitForTimeout(300);
  revisar(errores.length === 0, `sin errores en la consola${errores.length ? `: ${errores.join(" | ")}` : ""}`);
  await ctx.close();
}

// 2. Movimiento reducido: nada se anima y todo se ve.
{
  const { ctx, pagina, errores } = await abrir({ reducedMotion: "reduce" });
  await recorrer(pagina);
  const animaciones = await pagina.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.closest?.(".mk-momento")).length);
  revisar(animaciones === 0, `con movimiento reducido no hay animaciones (${animaciones})`);
  revisar((await pagina.locator("[data-momento=sorteo] canvas").count()) === 0, "con movimiento reducido el premio se ve sin raspar");
  const sellos = await pagina.$$eval(".mk-m-sellos-lista li[data-lleno]", (xs) => xs.every((x) => getComputedStyle(x).opacity === "1"));
  revisar(sellos, "con movimiento reducido los sellos se ven");
  revisar(errores.length === 0, "sin errores con movimiento reducido");
  await ctx.close();
}

// 3. Teléfono de 360 px: nada se sale de la pantalla.
{
  const { ctx, pagina, errores } = await abrir({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  await recorrer(pagina);
  const ancho = await pagina.evaluate(() => document.documentElement.scrollWidth);
  revisar(ancho <= 360, `a 360 px no hay scroll horizontal (${ancho})`);
  revisar(errores.length === 0, "sin errores en el teléfono");
  await ctx.close();
}

// 4. Si el archivo aparte del sorteo no baja, la página sigue y el premio se ve.
{
  const { ctx, pagina, errores } = await abrir({}, (p) => p.route(/src\/momentos\/SorteoRaspe\.tsx/, (r) => r.abort()));
  await pagina.waitForTimeout(800);
  const momentos = await pagina.locator("[data-momento]").count();
  revisar(momentos >= 10, `sin el archivo del sorteo la página sigue (${momentos} momentos)`);
  const premio = pagina.locator("[data-prueba=sorteo] [data-momento=sorteo]", { hasText: "Desayuno para dos" });
  revisar((await premio.count()) === 1 && (await premio.locator("text=Desayuno para dos").first().isVisible()), "y el premio se ve sin raspar");
  await ctx.close();
}

// 5. Teléfono sin el recorte de la demo: nada empuja la página de lado, ni al entrar el mosaico ni al pasar reseñas.
{
  const { ctx, pagina } = await abrir({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  await pagina.addStyleTag({ content: "main{overflow-x:visible!important}" });
  let maximo = 0;
  const medir = async () => (maximo = Math.max(maximo, await pagina.evaluate(() => document.documentElement.scrollWidth)));
  // La vitrina tiene dos galerías (la de seis fotos y la de una): aquí va la de seis.
  const mosaico = pagina.locator("[data-prueba=mosaico] [data-momento=mosaico]");
  await pagina.evaluate(() => scrollTo(0, 0));
  const y = await mosaico.evaluate((e) => e.getBoundingClientRect().top + scrollY);
  for (let d = y - 900; d < y + 400; d += 60) {
    await pagina.evaluate((v) => scrollTo(0, v), d);
    await medir();
  }
  await pagina.locator("[data-prueba=resenas] [data-momento=resenas]").scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(1200);
  await pagina.locator("[data-prueba=resenas] button", { hasText: "Siguiente" }).click();
  for (let i = 0; i < 6; i++) {
    await medir();
    await pagina.waitForTimeout(40);
  }
  revisar(maximo <= 360, `sin recorte de la demo, a 360 px no hay scroll horizontal (máximo ${maximo})`);
  await ctx.close();
}

// 6. El canvas del raspe se ajusta si cambia el ancho (teléfono que gira).
{
  const { ctx, pagina } = await abrir();
  const canvas = pagina.locator("[data-prueba=sorteo] canvas");
  await canvas.scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(300);
  await pagina.setViewportSize({ width: 700, height: 900 });
  await pagina.waitForTimeout(500);
  const [ancho, css, dpr] = await canvas.evaluate((c) => [c.width, c.offsetWidth, Math.min(2, devicePixelRatio || 1)]);
  revisar(Math.abs(ancho - Math.round(css * dpr)) <= 1, `el canvas sigue al ancho nuevo (${ancho} para ${css} px)`);
  await ctx.close();
}

// 7. El promedio de las reseñas solo sube: nunca muestra 4,6 y después vuelve a 0,0.
{
  const { ctx, pagina } = await abrir({}, (p) =>
    p.addInitScript(() => {
      window.__promedios = [];
      new MutationObserver(() => {
        const t = document.querySelector("[data-prueba=resenas] .mk-m-resenas-promedio")?.textContent;
        if (t && t !== window.__promedios.at(-1)) window.__promedios.push(t);
      }).observe(document, { subtree: true, childList: true, characterData: true });
    }),
  );
  await pagina.locator("[data-prueba=resenas] [data-momento=resenas]").scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(1500);
  const vistos = (await pagina.evaluate(() => window.__promedios)).map((t) => Number(t.replace(",", ".")));
  revisar(vistos.length > 1 && vistos.every((v, i) => i === 0 || v >= vistos[i - 1]) && vistos.at(-1) === 4.6, `el promedio solo sube hasta 4,6 (${vistos.slice(0, 4).join(" → ")} … ${vistos.at(-1)})`);
  await ctx.close();
}

// 8. Liviano: las fotos del mosaico caen derechas (sin giro).
{
  const { ctx, pagina } = await abrir();
  await pagina.selectOption("[data-prueba=nivel]", "liviano");
  const giros = await pagina.$$eval("[data-momento=mosaico] .mk-m-foto", (xs) => xs.map((x) => getComputedStyle(x).getPropertyValue("--giro").trim()));
  revisar(giros.length > 0 && giros.every((g) => g === "0deg"), `en liviano las fotos no giran (${[...new Set(giros)].join(", ")})`);
  const alts = await pagina.$$eval("[data-momento=mosaico] figure:has(figcaption) img", (xs) => xs.map((x) => x.getAttribute("alt")));
  revisar(alts.length > 0 && alts.every((a) => a === ""), "con pie, la foto no repite el pie en el alt");
  await ctx.close();
}

// 9. Una sola medición de fluidez para toda la página (no una por momento).
{
  const { ctx, pagina } = await abrir({}, (p) =>
    p.addInitScript(() => {
      window.__raf = 0;
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (f) => {
        window.__raf++;
        return raf(f);
      };
    }),
  );
  await pagina.waitForTimeout(800);
  const a = await pagina.evaluate(() => window.__raf);
  await pagina.waitForTimeout(1000);
  const porSegundo = (await pagina.evaluate(() => window.__raf)) - a;
  revisar(porSegundo < 200, `una sola medición de fluidez (${porSegundo} cuadros pedidos en un segundo)`);
  await ctx.close();
}

// 10. La cuenta regresiva no vuelve a observar en cada segundo, y con la pestaña oculta no deja relojes corriendo.
{
  const { ctx, pagina } = await abrir({}, (p) =>
    p.addInitScript(() => {
      window.__observa = 0;
      const obs = IntersectionObserver.prototype.observe;
      IntersectionObserver.prototype.observe = function (el) {
        if (el?.dataset?.momento === "cuenta") window.__observa++;
        return obs.call(this, el);
      };
      window.__relojes = new Set();
      const si = window.setInterval.bind(window);
      const no = window.clearInterval.bind(window);
      window.setInterval = (f, ms, ...r) => {
        const id = si(f, ms, ...r);
        if (ms === 60000 || ms === 1000) window.__relojes.add(id);
        return id;
      };
      window.clearInterval = (id) => {
        window.__relojes.delete(id);
        return no(id);
      };
      window.__ocultar = () => {
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
        document.dispatchEvent(new Event("visibilitychange"));
      };
    }),
  );
  const cuenta = pagina.locator("[data-momento=cuenta]");
  await cuenta.scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(500);
  const antes = await pagina.evaluate(() => window.__observa);
  await pagina.waitForTimeout(3200);
  const despues = await pagina.evaluate(() => window.__observa);
  revisar(despues - antes === 0, `la cuenta no vuelve a observar cada segundo (${despues - antes} veces en 3 s)`);
  await pagina.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await pagina.waitForTimeout(400);
  await pagina.evaluate(() => window.__ocultar());
  await pagina.waitForTimeout(300);
  const vivos = await pagina.evaluate(() => window.__relojes.size);
  revisar(vivos === 0, `con la pestaña oculta no quedan relojes corriendo (${vivos})`);
  await ctx.close();
}

// 11. Timers que no se disparan después de desmontar (reseñas y sorteo).
{
  const { ctx, pagina } = await abrir({}, (p) =>
    p.addInitScript(() => {
      window.__tarde = 0;
      const st = window.setTimeout.bind(window);
      window.setTimeout = (f, ms, ...r) => (ms === 260 || ms === 450 ? st(() => { window.__tarde++; f(); }, ms, ...r) : st(f, ms, ...r));
    }),
  );
  await pagina.locator("[data-prueba=resenas]").scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(1200);
  await pagina.locator("[data-prueba=resenas] button", { hasText: "Siguiente" }).click();
  await pagina.locator("[data-prueba=resenas] .mom-repetir").click();
  await pagina.locator("[data-prueba=sorteo]").scrollIntoViewIfNeeded();
  await pagina.locator("[data-prueba=sorteo] button.mk-m-boton", { hasText: "Ver premio" }).click();
  await pagina.locator("[data-prueba=sorteo] .mom-repetir").click();
  await pagina.waitForTimeout(700);
  revisar((await pagina.evaluate(() => window.__tarde)) === 0, "al desmontar no quedan timers que se disparen tarde");
  await ctx.close();
}

// 12. Accesibilidad: las fotos del antes y después se leen; la pila de reseñas tiene rol y su texto se puede copiar.
{
  const { ctx, pagina } = await abrir();
  await pagina.waitForSelector("[data-momento=antesdespues] [role=slider]");
  revisar((await pagina.locator("[data-momento=antesdespues] [role=slider] img").count()) === 0 && (await pagina.locator("[data-momento=antesdespues] img[alt]").count()) === 2, "las fotos del antes y después no quedan dentro del deslizador (su alt se lee)");
  revisar(Boolean(await pagina.locator("[data-momento=resenas] .mk-m-pila").getAttribute("role")), "la pila de reseñas tiene rol");
  const sel = await pagina.locator("[data-momento=resenas] .mk-m-resena").first().evaluate((e) => getComputedStyle(e).userSelect);
  revisar(sel !== "none", `el texto de las reseñas se puede seleccionar (${sel})`);
  await ctx.close();
}

// 13. Mientras baja el sorteo, su espacio ya está reservado (sin salto).
{
  const { ctx, pagina } = await abrir({}, (p) =>
    p.route(/src\/momentos\/SorteoRaspe\.tsx/, async (r) => {
      await new Promise((ok) => setTimeout(ok, 1500));
      await r.continue();
    }),
  );
  const sorteo = pagina.locator("[data-prueba=sorteo] [data-momento=sorteo]");
  const alEsperar = (await sorteo.boundingBox()).height;
  await pagina.waitForSelector("[data-prueba=sorteo] canvas", { timeout: 5000 });
  const alLlegar = (await sorteo.boundingBox()).height;
  revisar(Math.abs(alLlegar - alEsperar) <= 4, `el sorteo no salta al llegar (${Math.round(alEsperar)} → ${Math.round(alLlegar)} px)`);
  await ctx.close();
}

// 14. Raspar no deja avisos de lectura lenta del canvas, y con el dedo: sobre la capa no se mueve la página; ya revelado, sí.
{
  const { ctx, pagina } = await abrir({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true }, (p) => {
    p.on("console", (m) => m.text().includes("willReadFrequently") && (p.__avisos = (p.__avisos ?? 0) + 1));
  });
  const canvas = pagina.locator("[data-prueba=sorteo] canvas");
  await canvas.scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(400);
  const cdp = await ctx.newCDPSession(pagina);
  const caja = await canvas.boundingBox();
  const deslizar = async () => {
    const y0 = await pagina.evaluate(() => scrollY);
    await cdp.send("Input.synthesizeScrollGesture", { x: Math.round(caja.x + caja.width / 2), y: Math.round(caja.y + caja.height / 2), yDistance: -200, gestureSourceType: "touch", speed: 1200 });
    await pagina.waitForTimeout(300);
    return (await pagina.evaluate(() => scrollY)) - y0;
  };
  // Raspar con el mouse simulado para que lea el canvas varias veces.
  const m = await canvas.boundingBox();
  for (let y = m.y + 10; y < m.y + m.height * 0.4; y += 20) {
    await pagina.mouse.move(m.x + 2, y);
    await pagina.mouse.down();
    for (let x = m.x; x <= m.x + m.width; x += 14) await pagina.mouse.move(x, y);
    await pagina.mouse.up();
  }
  revisar(!pagina.__avisos, `raspar no deja avisos de lectura lenta (${pagina.__avisos ?? 0})`);
  revisar((await deslizar()) === 0, "con el dedo sobre la capa, la página no se mueve (se raspa)");
  // El gesto pudo haber raspado lo suficiente: el botón solo está si la capa sigue.
  const ver = pagina.locator("[data-prueba=sorteo] button.mk-m-boton", { hasText: "Ver premio" });
  if (await ver.count()) await ver.click();
  await pagina.waitForTimeout(700);
  revisar((await deslizar()) !== 0, "ya revelado, el dedo sobre la tarjeta mueve la página");
  await ctx.close();
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
