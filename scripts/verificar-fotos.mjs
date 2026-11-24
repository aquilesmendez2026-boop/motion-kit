// Verifica las fotos vivas: en el encabezado (partículas, ondas, cambio líquido entre tomas, fotos caídas o de otro
// sitio, contexto WebGL perdido, movimiento reducido) y en la galería (lienzo que sigue a la foto y visor que crece).
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-fotos.mjs [http://localhost:5173] [parte]`,
// donde la parte (opcional) es encabezado, galeria o visor.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const navegador = await chromium.launch();
// Tercer argumento opcional: correr solo una parte (encabezado, galeria o visor).
const solo = process.argv[3];
const parte = (nombre) => !solo || solo === nombre;

const svg = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="${color}"/><circle cx="400" cy="250" r="140" fill="#fff" opacity=".7"/></svg>`;
const OTRO = "https://otro.ejemplo";

/** Abre una página de la demo con fotos servidas por la prueba: del mismo sitio, una caída (404) y de otro sitio. */
async function abrir(hash, { opciones = {}, cors = false, antes = [], preparar } = {}) {
  // antes: funciones que corren en la página antes de cargar (espías). preparar: recibe la página (rutas extra).
  // cors: false = sin permiso; true = con permiso; "solo-fetch" = la imagen pedida con CORS falla (como cuando la caché
  // del navegador devuelve la respuesta sin permiso que guardó el <img> de siempre) y solo un fetch nuevo lo consigue.
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  const pedidos = { otro: 0, conCors: 0, porDireccion: {} };
  // Safari avisa una foto sin permiso también como error de página («Cannot load image … due to access control checks»):
  // es del navegador, no del kit.
  pagina.on("pageerror", (e) => !/access control checks/.test(e.message) && errores.push(e.message));
  // Una foto caída deja su propio aviso de red: ese no cuenta como error del kit.
  // (Chrome y Safari lo dicen distinto: «blocked by CORS policy», «not allowed by Access-Control-Allow-Origin», «due to access control checks».)
  pagina.on("console", (m) => m.type() === "error" && !/Failed to load resource|ERR_FAILED|CORS|Access-Control-Allow-Origin|access control checks/.test(m.text()) && errores.push(m.text()));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.route(/\/__foto\/(\d)\.svg/, (r) => r.fulfill({ status: 200, contentType: "image/svg+xml", body: svg(["#b5462f", "#2f6db5", "#3a9b5c"][Number(r.request().url().match(/(\d)\.svg/)[1]) % 3]) }));
  await pagina.route(/\/__foto\/falta\.svg/, (r) => r.fulfill({ status: 404, body: "" }));
  await pagina.route(`${OTRO}/**`, (r) => {
    pedidos.otro++;
    // El pedido del motor (para WebGL) va con CORS; el de la <img> de siempre, no.
    const conCors = r.request().resourceType() === "image" && r.request().headers()["sec-fetch-mode"] === "cors";
    if (conCors) pedidos.conCors++;
    // Los pedidos que hace el motor (imagen con CORS o fetch), por dirección.
    if (conCors || r.request().resourceType() === "fetch") pedidos.porDireccion[r.request().url()] = (pedidos.porDireccion[r.request().url()] ?? 0) + 1;
    // Sin permiso: una cabecera que no calza (si no se pone ninguna, Playwright agrega una que deja pasar todo).
    const permitido = cors === true || (cors === "solo-fetch" && r.request().resourceType() === "fetch");
    r.fulfill({ status: 200, contentType: "image/svg+xml", body: svg("#7a3fb5"), headers: { "access-control-allow-origin": permitido ? "*" : "https://nadie.ejemplo" } });
  });
  // Anota cada efecto por el que pasa cada lienzo de fotos.
  await pagina.addInitScript(() => {
    window.__efectos = [];
    window.__maxLienzos = 0;
    new MutationObserver(() => {
      const ls = document.querySelectorAll("canvas.mk-foto-viva");
      window.__maxLienzos = Math.max(window.__maxLienzos, ls.length);
      for (const l of ls) if (l.dataset.efecto && l.dataset.efecto !== window.__efectos.at(-1)) window.__efectos.push(l.dataset.efecto);
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-efecto"] });
  });
  for (const guion of antes) await pagina.addInitScript(guion);
  if (preparar) await preparar(pagina);
  await pagina.goto(base + "/" + hash);
  return { ctx, pagina, errores, pedidos };
}

/** Espía del WebGL de las fotos vivas: uniformes por cuadro, dibujos, contextos pedidos y contextos soltados. */
const espiarWebgl = () => {
  window.__gl = { marcos: [], dibujos: 0, contextos: 0, soltados: 0 };
  const P = WebGLRenderingContext.prototype;
  const deFotos = (gl) => gl.canvas?.className === "mk-foto-viva";
  const ubicar = P.getUniformLocation;
  P.getUniformLocation = function (programa, nombre) {
    const u = ubicar.call(this, programa, nombre);
    if (u) u.__nombre = nombre;
    return u;
  };
  const uniforme = P.uniform1f;
  P.uniform1f = function (u, v) {
    if (u && deFotos(this)) {
      // Cada dibujo de foto pone primero la mezcla (m) y después el acercamiento de cada foto (z, y).
      if (u.__nombre === "m") window.__gl.marcos.push({ m: v });
      else if (u.__nombre === "z" || u.__nombre === "y") Object.assign(window.__gl.marcos.at(-1) ?? {}, { [u.__nombre]: v });
    }
    return uniforme.call(this, u, v);
  };
  const dibujar = P.drawArrays;
  P.drawArrays = function (...a) {
    if (deFotos(this)) window.__gl.dibujos++;
    return dibujar.apply(this, a);
  };
  const extension = P.getExtension;
  P.getExtension = function (nombre) {
    const e = extension.call(this, nombre);
    if (e && nombre === "WEBGL_lose_context" && !e.__espiado) {
      e.__espiado = true;
      const soltar = e.loseContext.bind(e);
      e.loseContext = () => {
        window.__gl.soltados++;
        return soltar();
      };
    }
    return e;
  };
  const contexto = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (tipo, ...r) {
    if (this.className === "mk-foto-viva" && /webgl/.test(tipo)) window.__gl.contextos++;
    return contexto.call(this, tipo, ...r);
  };
};

/**
 * Deja a la prueba decidir si el lienzo de fotos está a la vista: para esos lienzos el IntersectionObserver no mira la
 * página, sino lo que diga `window.__vista(true | false)`. `window.__enVista` es lo que se avisa apenas se observa.
 */
const vistaFalsa = () => {
  const Real = window.IntersectionObserver;
  const falsos = [];
  window.IntersectionObserver = class {
    constructor(aviso, opciones) {
      this.aviso = aviso;
      this.real = new Real((es) => aviso(es, this), opciones);
      this.lienzos = [];
    }
    observe(el) {
      if (!(el instanceof HTMLCanvasElement) || el.className !== "mk-foto-viva") return this.real.observe(el);
      this.lienzos.push(el);
      falsos.push(this);
      // Como el de verdad, avisa después (nunca dentro de observe).
      if (window.__enVista !== undefined) setTimeout(() => this.lienzos.includes(el) && this.avisar(el, window.__enVista), 0);
    }
    avisar(el, si) {
      this.aviso([{ isIntersecting: si, intersectionRatio: si ? 1 : 0, target: el }], this);
    }
    unobserve(el) {
      this.real.unobserve(el);
    }
    disconnect() {
      this.real.disconnect();
      this.lienzos = [];
    }
    takeRecords() {
      return [];
    }
  };
  window.__vista = (si) => {
    window.__enVista = si;
    for (const f of falsos) for (const el of f.lienzos) f.avisar(el, si);
  };
};
/** Cuántas veces dibuja el WebGL de fotos en un segundo. */
async function dibujosPorSegundo(pagina) {
  const a = await pagina.evaluate(() => window.__gl.dibujos);
  await pagina.waitForTimeout(1000);
  return (await pagina.evaluate(() => window.__gl.dibujos)) - a;
}
const pestana = (pagina, estado) =>
  pagina.evaluate((e) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => e });
    document.dispatchEvent(new Event("visibilitychange"));
  }, estado);
const vista = (config) => "#vista?d=" + Buffer.from(JSON.stringify(config)).toString("base64url");
const BASE = { estilo: "pelicula", composicion: "imagen", titulo: "Café *Luna*", alt: "El local", fotoViva: true };
const LIENZO = ".mk-enc canvas.mk-foto-viva[data-lista]";
const efectos = (pagina) => pagina.evaluate(() => window.__efectos);

// 1. Una foto: se arma desde partículas, queda quieta y ondula bajo el cursor. La foto real sigue en la página.
if (parte("encabezado")) {
  const { ctx, pagina, errores } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg"] }));
  await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
  revisar((await pagina.locator(LIENZO).count()) === 1, "con foto viva hay un lienzo sobre la foto del encabezado");
  await pagina.waitForTimeout(2200);
  const e = await efectos(pagina);
  revisar(e[0] === "particulas" && e.at(-1) === "quieta", `la foto se arma desde partículas y queda quieta (${e.join(" → ")})`);
  revisar((await pagina.locator(".mk-enc-media img[alt='El local']").count()) === 1, "la foto real sigue en la página con su texto");
  revisar((await pagina.locator(LIENZO).getAttribute("aria-hidden")) === "true", "el lienzo es decorativo (aria-hidden)");
  const caja = await pagina.locator(".mk-enc-media").first().boundingBox();
  await pagina.mouse.move(caja.x + caja.width * 0.4, caja.y + caja.height * 0.4);
  await pagina.mouse.move(caja.x + caja.width * 0.5, caja.y + caja.height * 0.5, { steps: 6 });
  await pagina.waitForTimeout(150);
  revisar((await pagina.locator(LIENZO).getAttribute("data-efecto")) === "ondas", "al pasar el cursor, la foto ondula");
  await pagina.waitForTimeout(2200);
  revisar((await pagina.locator(LIENZO).getAttribute("data-efecto")) === "quieta", "sin cursor encima, la foto vuelve a quedar quieta");

  // Contexto WebGL perdido: el lienzo se va y queda la foto.
  await pagina.locator(LIENZO).evaluate((c) => (c.getContext("webgl") ?? c.getContext("experimental-webgl")).getExtension("WEBGL_lose_context").loseContext());
  await pagina.waitForTimeout(400);
  revisar((await pagina.locator(".mk-enc canvas.mk-foto-viva").count()) === 0 && (await pagina.locator(".mk-enc-media img").count()) >= 1, "si se pierde el contexto WebGL, el lienzo se quita y queda la foto");
  revisar(errores.length === 0, `sin errores en la consola${errores.length ? `: ${errores.join(" | ")}` : ""}`);
  revisar((await pagina.evaluate(() => window.__maxLienzos)) <= 1, "nunca hay más de un lienzo en el encabezado");
  await ctx.close();
}

// 2. Varias tomas: el cambio de foto es líquido.
if (parte("encabezado")) {
  const { ctx, pagina, errores } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg", "/__foto/2.svg"], tomas: true }), { antes: [espiarWebgl] });
  await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
  // Partículas (1,2 s), cinco segundos de la primera toma y un segundo de cambio: se espera a que la toma avance.
  await pagina.waitForSelector('.mk-tomas[data-activa="1"]', { timeout: 12000 }).catch(() => {});
  await pagina.waitForTimeout(300);
  const e = await efectos(pagina);
  revisar(e.includes("liquido"), `con tomas, el cambio de foto es líquido (${e.join(" → ")})`);
  revisar((await pagina.locator(".mk-tomas").getAttribute("data-activa")) === "1", "y la toma visible avanza");
  // El acercamiento de la foto que entra sigue donde iba: no vuelve de golpe a cero al terminar el cambio.
  const marcos = await pagina.evaluate(() => window.__gl.marcos);
  const fin = marcos.findIndex((f, i) => i > 0 && f.m === 0 && marcos[i - 1].m > 0);
  const entrante = fin > 0 ? marcos[fin - 1].y ?? marcos[fin - 1].z : NaN;
  revisar(fin > 0 && Math.abs(marcos[fin].z - entrante) < 0.01, `al terminar el cambio líquido el acercamiento no salta (${entrante.toFixed?.(3)} → ${marcos[fin]?.z?.toFixed(3)})`);
  // Si se pierde el contexto con las tomas ya avanzadas, la toma no vuelve a la primera.
  await pagina.locator(LIENZO).evaluate((c) => c.getContext("webgl").getExtension("WEBGL_lose_context").loseContext());
  await pagina.waitForTimeout(500);
  revisar((await pagina.locator(".mk-tomas").getAttribute("data-activa")) === "1", "si se pierde el contexto, la toma no vuelve a la primera");
  revisar(errores.length === 0, "sin errores con tomas");
  await ctx.close();
}

// 3. Con apertura no hay partículas (la apertura ya es la entrada).
if (parte("encabezado")) {
  const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg"], apertura: {} }));
  await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
  await pagina.waitForTimeout(2500);
  const e = await efectos(pagina);
  revisar((await pagina.locator(LIENZO).count()) === 1 && !e.includes("particulas"), `con apertura hay foto viva pero sin partículas (${e.join(" → ")})`);
  await ctx.close();
}

// 4. Foto caída (404): se ve como hoy, sin lienzo.
if (parte("encabezado")) {
  const { ctx, pagina, errores } = await abrir(vista({ ...BASE, imagenes: ["/__foto/falta.svg"] }));
  await pagina.waitForSelector(".mk-enc");
  await pagina.waitForTimeout(1800);
  revisar((await pagina.locator(".mk-enc canvas.mk-foto-viva[data-lista]").count()) === 0, "con la foto caída no aparece el lienzo");
  revisar(errores.length === 0, "sin errores del kit con la foto caída");
  await ctx.close();
}

// 5. Foto de otro sitio sin permiso: foto normal y una sola descarga.
if (parte("encabezado")) {
  const { ctx, pagina, pedidos } = await abrir(vista({ ...BASE, imagenes: [`${OTRO}/f.svg`] }));
  await pagina.waitForSelector(".mk-enc");
  await pagina.waitForTimeout(1800);
  revisar((await pagina.locator(".mk-enc canvas.mk-foto-viva[data-lista]").count()) === 0, "una foto de otro sitio queda como foto normal");
  revisar(pedidos.otro >= 1 && pedidos.conCors === 0, `y el motor no la vuelve a pedir (${pedidos.conCors} pedidos con CORS)`);
  await ctx.close();
}

// 6. Foto de otro sitio autorizado (origenesFotos) y con permiso CORS: foto viva.
if (parte("encabezado")) {
  const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: [`${OTRO}/f.svg`], origenesFotos: [OTRO] }), { cors: true });
  await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
  revisar((await pagina.locator(LIENZO).count()) === 1, "una foto de un sitio autorizado y con permiso sí es foto viva");
  await ctx.close();
}

// 7. Sitio autorizado pero el servidor no da permiso: foto normal, sin errores del kit.
if (parte("encabezado")) {
  const { ctx, pagina, errores } = await abrir(vista({ ...BASE, imagenes: [`${OTRO}/f.svg`], origenesFotos: [OTRO] }));
  await pagina.waitForSelector(".mk-enc");
  await pagina.waitForTimeout(1800);
  revisar((await pagina.locator(".mk-enc canvas.mk-foto-viva[data-lista]").count()) === 0 && errores.length === 0, "si el servidor no da permiso, queda la foto normal y sin errores");
  await ctx.close();
}

// 7b. La caché del navegador devuelve la foto sin permiso (la guardó el <img> de siempre): el motor la pide de nuevo
// saltándose la caché y la foto viva funciona igual.
if (parte("encabezado")) {
  const { ctx, pagina, errores } = await abrir(vista({ ...BASE, imagenes: [`${OTRO}/f.svg`], origenesFotos: [OTRO] }), { cors: "solo-fetch" });
  await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
  revisar((await pagina.locator(LIENZO).count()) === 1 && errores.length === 0, "si la caché devuelve la foto sin permiso, el motor la vuelve a pedir y la foto viva funciona");
  await ctx.close();
}

// 7c. El lienzo se ve igual que la foto que tapa: con el tratamiento de foto y con el corrimiento de la profundidad.
if (parte("encabezado")) {
  const estilo = (pagina, prop) => pagina.locator(LIENZO).evaluate((c, p) => getComputedStyle(c)[p], prop);
  const foto = (pagina, prop) => pagina.locator(".mk-enc-media img").first().evaluate((c, p) => getComputedStyle(c)[p], prop);
  {
    const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg"], tratamiento: "bn" }));
    await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
    const [l, f] = [await estilo(pagina, "filter").catch(() => "sin lienzo"), await foto(pagina, "filter")];
    revisar(/grayscale/.test(l) && l === f, `con tratamiento blanco y negro, el lienzo lleva el mismo filtro que la foto (${l})`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg"] }));
    await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
    const [l, f] = [await estilo(pagina, "scale").catch(() => "sin lienzo"), await foto(pagina, "scale")];
    revisar(l === f, `sin profundidad, el lienzo tiene el mismo tamaño que la foto (lienzo ${l}, foto ${f})`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg"], profundidad: true }));
    await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
    const [l, f] = [await estilo(pagina, "scale").catch(() => "sin lienzo"), await foto(pagina, "scale")];
    revisar(l === f && l === "1.05", `con profundidad, el lienzo se agranda igual que la foto (lienzo ${l}, foto ${f})`);
    await ctx.close();
  }
}

// 7d. Cambiar el tamaño de la ventana varias veces seguidas: la foto se vuelve a subir al final, no en cada paso.
if (parte("encabezado")) {
  const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg"], apertura: {} }));
  await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
  await pagina.waitForTimeout(800);
  await pagina.evaluate(() => {
    window.__subidas = 0;
    const original = WebGLRenderingContext.prototype.texImage2D;
    WebGLRenderingContext.prototype.texImage2D = function (...a) {
      window.__subidas++;
      return original.apply(this, a);
    };
  });
  for (let w = 1260; w >= 1120; w -= 20) {
    await pagina.setViewportSize({ width: w, height: 860 });
    await pagina.waitForTimeout(30);
  }
  await pagina.waitForTimeout(700);
  const subidas = await pagina.evaluate(() => window.__subidas);
  const calza = await pagina.locator(LIENZO).evaluate((c) => Math.abs(c.width - Math.round(c.clientWidth * Math.min(2, devicePixelRatio || 1))) <= 2);
  revisar(subidas >= 1 && subidas <= 2 && calza, `al cambiar el tamaño 8 veces seguidas, la foto se sube de nuevo una vez (${subidas}) y el lienzo queda del tamaño final`);
  await ctx.close();
}

// 7e. Fuera de la vista el motor no dibuja, y volver a la pestaña no lo despierta si sigue fuera de la vista.
if (parte("encabezado")) {
  const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg", "/__foto/2.svg"], tomas: true }), { antes: [espiarWebgl, vistaFalsa] });
  await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
  await pagina.waitForTimeout(1600);
  const corriendo = await dibujosPorSegundo(pagina);
  await pagina.evaluate(() => window.__vista(false));
  await pagina.waitForTimeout(200);
  const fuera = await dibujosPorSegundo(pagina);
  await pestana(pagina, "hidden");
  await pestana(pagina, "visible");
  const alVolver = await dibujosPorSegundo(pagina);
  revisar(corriendo > 20 && fuera <= 2 && alVolver <= 2, `fuera de la vista no dibuja, tampoco al volver a la pestaña (a la vista ${corriendo}/s, fuera ${fuera}/s, al volver ${alVolver}/s)`);
  await pagina.evaluate(() => window.__vista(true));
  revisar((await dibujosPorSegundo(pagina)) > 20, "al volver a la vista, sigue dibujando");
  await ctx.close();
}

// 7f. Si la página carga con el encabezado fuera de la vista, el lienzo no tapa la foto hasta haber dibujado.
if (parte("encabezado")) {
  const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg"], apertura: {} }), {
    antes: [vistaFalsa, () => (window.__enVista = false)],
  });
  await pagina.waitForSelector(".mk-enc");
  await pagina.waitForTimeout(1800);
  const tapa = await pagina.evaluate(() => [...document.querySelectorAll(".mk-enc canvas.mk-foto-viva")].some((c) => getComputedStyle(c).opacity !== "0"));
  revisar(!tapa, "fuera de la vista y sin haber dibujado, el lienzo no tapa la foto");
  await pagina.evaluate(() => window.__vista(true));
  await pagina.waitForSelector(LIENZO, { timeout: 4000 }).catch(() => {});
  revisar((await pagina.locator(LIENZO).evaluate((c) => getComputedStyle(c).opacity).catch(() => "sin lienzo")) === "1", "al entrar a la vista, dibuja y recién ahí aparece");
  await ctx.close();
}

// 7g. Cuando llega el archivo de la foto viva, la foto de siempre no se vuelve a montar.
if (parte("encabezado")) {
  const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg"] }), {
    preparar: (p) =>
      p.route(/src\/fotos\/FotoVivaEncabezado\.tsx/, async (r) => {
        await new Promise((ok) => setTimeout(ok, 1000));
        await r.continue();
      }),
  });
  await pagina.waitForSelector(".mk-enc-media img");
  await pagina.evaluate(() => (document.querySelector(".mk-enc-media img").__marca = true));
  await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
  revisar((await pagina.locator(LIENZO).count()) === 1 && (await pagina.evaluate(() => document.querySelector(".mk-enc-media img").__marca === true)), "al llegar la foto viva, la <img> es la misma (no se vuelve a montar)");
  await ctx.close();
}

// 8. Movimiento reducido: sin lienzo.
if (parte("encabezado")) {
  const { ctx, pagina } = await abrir(vista({ ...BASE, imagenes: ["/__foto/1.svg"] }), { opciones: { reducedMotion: "reduce" } });
  await pagina.waitForSelector(".mk-enc");
  await pagina.waitForTimeout(1500);
  revisar((await pagina.locator("canvas.mk-foto-viva").count()) === 0, "con movimiento reducido no hay lienzo");
  await ctx.close();
}

// --- Galería: un solo lienzo que pasa de foto en foto ---
const FOTO = (n, zona = "mosaico") => `[data-prueba=${zona}] .mk-m-foto:nth-child(${n}) img`;
const LIENZO_G = "[data-prueba=mosaico] canvas.mk-foto-viva[data-lista]";
const cajas = (pagina, n) =>
  pagina.evaluate(([f, l]) => {
    const a = document.querySelector(f)?.getBoundingClientRect();
    const b = document.querySelector(l)?.getBoundingClientRect();
    return a && b ? Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.width - b.width), Math.abs(a.height - b.height)) : null;
  }, [FOTO(n), LIENZO_G]);
/** Deja el mosaico arriba de la ventana, con sus fotos ya en su lugar. */
async function alMosaico(pagina) {
  await pagina.waitForSelector("[data-prueba=mosaico] .mk-m-foto img");
  await pagina.evaluate(() => scrollTo(0, document.querySelector("[data-prueba=mosaico]").getBoundingClientRect().top + scrollY - 60));
  await pagina.waitForTimeout(900);
}
const sobre = async (pagina, n, zona = "mosaico") => {
  const r = await pagina.locator(FOTO(n, zona)).boundingBox();
  await pagina.mouse.move(r.x + r.width * 0.3, r.y + r.height * 0.3);
  await pagina.mouse.move(r.x + r.width * 0.6, r.y + r.height * 0.6, { steps: 6 });
};

// 9. Al pasar por una foto de la galería, el lienzo se pone encima, ondula y la sigue al bajar.
if (parte("galeria")) {
  const { ctx, pagina, errores } = await abrir("#momentos");
  await alMosaico(pagina);
  await sobre(pagina, 1);
  await pagina.waitForSelector(LIENZO_G, { timeout: 6000 }).catch(() => {});
  await sobre(pagina, 1);
  await pagina.waitForTimeout(200);
  revisar((await pagina.locator(LIENZO_G).getAttribute("data-efecto").catch(() => null)) === "ondas", "la foto de la galería ondula bajo el cursor");
  const d1 = await cajas(pagina, 1);
  revisar(d1 !== null && d1 <= 2, `el lienzo calza con la foto (${d1} px)`);
  // Se baja poco: con más, el cursor queda sobre otra foto y el lienzo (bien) se cambia a esa.
  const antes = (await pagina.locator(FOTO(1)).boundingBox()).y;
  await pagina.mouse.wheel(0, 40);
  await pagina.waitForTimeout(250);
  const corrida = antes - (await pagina.locator(FOTO(1)).boundingBox()).y;
  const d2 = await cajas(pagina, 1);
  revisar(Math.abs(corrida - 40) <= 2 && d2 !== null && d2 <= 2, `al bajar 40 px la foto se corre (${corrida} px) y el lienzo la sigue (${d2} px)`);
  await sobre(pagina, 2);
  await pagina.waitForFunction((l) => document.querySelector(l)?.parentElement?.matches(".mk-m-foto:nth-child(2)"), LIENZO_G, { timeout: 6000 }).catch(() => {});
  const d3 = await cajas(pagina, 2);
  revisar(d3 !== null && d3 <= 2 && (await pagina.locator("canvas.mk-foto-viva").count()) === 1, `al pasar a otra foto, el mismo lienzo se cambia a ella (${d3} px)`);
  revisar((await pagina.evaluate(() => window.__maxLienzos)) <= 2, "nunca hay más de dos lienzos en la página");
  await pagina.mouse.move(5, 5);
  await pagina.waitForTimeout(2300);
  revisar((await pagina.locator(LIENZO_G).count()) === 0, "sin cursor encima, el lienzo se va");
  revisar(errores.length === 0, `sin errores en la galería${errores.length ? `: ${errores.join(" | ")}` : ""}`);
  await ctx.close();
}

// 9b. Una foto de un sitio autorizado que no da permiso se intenta una vez, no en cada pasada.
if (parte("galeria")) {
  const fotos = ["a", "b", "c"].map((n) => ({ url: `${OTRO}/${n}.svg`, pie: n.toUpperCase() }));
  const banco = "#banco?d=" + Buffer.from(JSON.stringify({ mosaico: { viva: true, origenesFotos: [OTRO], fotos } })).toString("base64url");
  const { ctx, pagina, pedidos, errores } = await abrir(banco);
  await pagina.waitForSelector(FOTO(1, "banco"));
  await pagina.waitForTimeout(900);
  for (let i = 0; i < 3; i++) {
    await sobre(pagina, 1, "banco");
    await pagina.waitForTimeout(900);
    await pagina.mouse.move(5, 5);
    await pagina.waitForTimeout(300);
  }
  const veces = pedidos.porDireccion[`${OTRO}/a.svg`] ?? 0;
  revisar(veces >= 1 && veces <= 2, `una foto sin permiso se intenta una sola vez, no en cada pasada (${veces} pedidos del motor en 3 pasadas)`);
  revisar((await pagina.locator("canvas.mk-foto-viva[data-lista]").count()) === 0 && errores.length === 0, "y queda como foto normal, sin errores del kit");
  await ctx.close();
}

// 9c. Con el lienzo encima, si cambia el tamaño de la ventana el lienzo sigue calzando con la foto.
if (parte("galeria")) {
  const { ctx, pagina } = await abrir("#momentos");
  await alMosaico(pagina);
  await sobre(pagina, 1);
  await pagina.waitForSelector(LIENZO_G, { timeout: 6000 }).catch(() => {});
  await pagina.setViewportSize({ width: 880, height: 860 });
  await pagina.waitForTimeout(450);
  const d = await cajas(pagina, 1);
  revisar(d !== null && d <= 2, `al cambiar el tamaño de la ventana, el lienzo sigue calzando con la foto (${d} px)`);
  await ctx.close();
}

// 9d. Al salir de la página, el WebGL de la galería se suelta (el navegador permite pocos contextos).
if (parte("galeria")) {
  const { ctx, pagina } = await abrir("#momentos", { antes: [espiarWebgl] });
  await alMosaico(pagina);
  await sobre(pagina, 1);
  await pagina.waitForSelector(LIENZO_G, { timeout: 6000 }).catch(() => {});
  await pagina.evaluate(() => (location.hash = ""));
  await pagina.waitForTimeout(700);
  const g = await pagina.evaluate(() => window.__gl);
  revisar(g.contextos >= 1 && g.soltados >= 1, `al salir de la página se suelta el contexto WebGL (pedidos ${g.contextos}, soltados ${g.soltados})`);
  await ctx.close();
}

// 9e. Si se sale de la página mientras baja el archivo de la galería, no se crea nada después.
if (parte("galeria")) {
  const { ctx, pagina, errores } = await abrir("#momentos", {
    antes: [espiarWebgl],
    preparar: (p) =>
      p.route(/src\/fotos\/galeria\.ts/, async (r) => {
        await new Promise((ok) => setTimeout(ok, 1200));
        await r.continue();
      }),
  });
  await alMosaico(pagina);
  await sobre(pagina, 1);
  await pagina.waitForTimeout(250);
  await pagina.evaluate(() => (location.hash = ""));
  await pagina.waitForTimeout(2200);
  const g = await pagina.evaluate(() => window.__gl);
  revisar(g.contextos === 0 && errores.length === 0, `si se sale mientras baja el archivo, no se crea ningún WebGL después (${g.contextos})`);
  await ctx.close();
}

// 10. En liviano no hay lienzo en la galería.
if (parte("galeria")) {
  const { ctx, pagina } = await abrir("#momentos");
  await pagina.waitForSelector("[data-prueba=nivel]");
  await pagina.selectOption("[data-prueba=nivel]", "liviano");
  await alMosaico(pagina);
  await sobre(pagina, 1);
  await pagina.waitForTimeout(900);
  revisar((await pagina.locator("canvas.mk-foto-viva").count()) === 0, "en liviano la galería no usa WebGL");
  await ctx.close();
}

// --- Visor: la foto crece hasta llenar la pantalla ---
const BOTON = (zona, n) => `[data-prueba=${zona}] .mk-m-foto:nth-child(${n}) button`;
const DIALOGO = "[role=dialog][aria-modal=true]";
const adentro = (pagina) => pagina.evaluate((d) => Boolean(document.activeElement?.closest(d)), DIALOGO);

// 11. Un toque abre el visor; teclado, foco y cierre.
if (parte("visor")) {
  const { ctx, pagina, errores } = await abrir("#momentos");
  await alMosaico(pagina);
  // Arrastrar sobre la foto (para hacer ondas) no la abre.
  const r = await pagina.locator(BOTON("mosaico", 1)).boundingBox();
  await pagina.mouse.move(r.x + 20, r.y + 20);
  await pagina.mouse.down();
  await pagina.mouse.move(r.x + 70, r.y + 50, { steps: 5 });
  await pagina.mouse.up();
  await pagina.waitForTimeout(400);
  revisar((await pagina.locator(DIALOGO).count()) === 0, "arrastrar sobre la foto no abre el visor");
  // El navegador no inicia su propio «arrastrar imagen» sobre las fotos con gestos: en Safari eso se tragaba el toque
  // siguiente y el visor no abría (visto el 24-11-2026 con `node scripts/en-safari.mjs fotos visor`).
  const arrastreNativo = await pagina.locator(`${BOTON("mosaico", 1)} img`).evaluate((img) => !img.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true })));
  revisar(arrastreNativo, "arrastrar una foto de la galería no inicia el arrastre de imágenes del navegador");

  const src = await pagina.locator(`${BOTON("mosaico", 1)} img`).getAttribute("src");
  await pagina.locator(BOTON("mosaico", 1)).click();
  await pagina.waitForSelector(DIALOGO, { timeout: 6000 }).catch(() => {});
  await pagina.waitForTimeout(600);
  revisar((await pagina.locator(DIALOGO).count()) === 1, "un toque en la foto abre el visor");
  revisar((await pagina.locator(`${DIALOGO} img.mk-visor-foto`).getAttribute("src").catch(() => null)) === src, "el visor muestra la foto tocada");
  revisar((await pagina.locator(DIALOGO).getAttribute("aria-label").catch(() => null)) === "El mesón", "el visor se llama como el pie de la foto");
  revisar(((await pagina.locator(DIALOGO).textContent().catch(() => "")) ?? "").includes("Foto 1 de 6"), "el visor dice «Foto 1 de 6»");
  revisar(await adentro(pagina), "el foco entra al visor");
  let siempre = true;
  for (let i = 0; i < 10; i++) {
    await pagina.keyboard.press("Tab");
    siempre = siempre && (await adentro(pagina));
  }
  revisar(siempre, "con Tab el foco no sale del visor");
  await pagina.locator(`${DIALOGO} button`, { hasText: "Siguiente" }).click();
  revisar(((await pagina.locator(DIALOGO).textContent()) ?? "").includes("Foto 2 de 6"), "«Siguiente» pasa a la foto 2");
  await pagina.keyboard.press("ArrowRight");
  for (let i = 0; i < 3; i++) await pagina.keyboard.press("ArrowLeft");
  revisar(((await pagina.locator(DIALOGO).textContent()) ?? "").includes("Foto 6 de 6"), "las flechas cambian de foto y dan la vuelta");
  const y0 = await pagina.evaluate(() => scrollY);
  await pagina.mouse.wheel(0, 300);
  await pagina.waitForTimeout(250);
  revisar((await pagina.evaluate(() => scrollY)) === y0, "con el visor abierto, la página de atrás no se mueve");
  await pagina.keyboard.press("Escape");
  await pagina.waitForTimeout(700);
  revisar((await pagina.locator(DIALOGO).count()) === 0, "Escape cierra el visor");
  revisar(await pagina.evaluate((b) => document.activeElement === document.querySelector(b), BOTON("mosaico", 1)), "al cerrar, el foco vuelve a la foto tocada");
  await pagina.mouse.wheel(0, 200);
  await pagina.waitForTimeout(250);
  revisar((await pagina.evaluate(() => scrollY)) !== y0, "al cerrar, la página se vuelve a mover");
  revisar(errores.length === 0, `sin errores con el visor${errores.length ? `: ${errores.join(" | ")}` : ""}`);
  await ctx.close();
}

// 11b. Con el teclado: Enter sobre una foto abre el visor, aunque antes se haya arrastrado el mouse en otra parte.
if (parte("visor")) {
  const { ctx, pagina } = await abrir("#momentos");
  await alMosaico(pagina);
  const r = await pagina.locator(BOTON("mosaico", 1)).boundingBox();
  await pagina.mouse.move(r.x + 20, r.y + 20);
  await pagina.mouse.down();
  await pagina.mouse.move(r.x + 80, r.y + 60, { steps: 5 });
  await pagina.mouse.up();
  await pagina.waitForTimeout(300);
  await pagina.locator(BOTON("mosaico", 3)).focus();
  await pagina.keyboard.press("Enter");
  await pagina.waitForSelector(DIALOGO, { timeout: 5000 }).catch(() => {});
  revisar(((await pagina.locator(DIALOGO).textContent().catch(() => "")) ?? "").includes("Foto 3 de 6"), "con el teclado, Enter sobre una foto abre el visor en esa foto");
  await ctx.close();
}

// 11c. El visor deja ampliar la foto con los dedos.
if (parte("visor")) {
  const { ctx, pagina } = await abrir("#momentos");
  await alMosaico(pagina);
  await pagina.locator(BOTON("mosaico", 1)).click();
  await pagina.waitForSelector(DIALOGO, { timeout: 6000 }).catch(() => {});
  const toques = await pagina.evaluate(() => [".mk-visor", ".mk-visor-foto"].map((q) => getComputedStyle(document.querySelector(q)).touchAction));
  revisar(toques.every((t) => t === "pinch-zoom"), `el visor deja ampliar con los dedos (${toques.join(", ")})`);
  await ctx.close();
}

// 11d. Sin View Transitions, al cerrar no se anima la foto dentro de la galería (quedaría tapada y recortada).
if (parte("visor")) {
  const { ctx, pagina } = await abrir("#momentos", { antes: [() => (Document.prototype.startViewTransition = undefined)] });
  await alMosaico(pagina);
  await pagina.locator(BOTON("mosaico", 1)).click();
  await pagina.waitForSelector(DIALOGO, { timeout: 6000 }).catch(() => {});
  await pagina.waitForTimeout(600);
  await pagina.keyboard.press("Escape");
  // Solo las animaciones hechas por código: las del mosaico al bajar son de CSS y siempre están.
  const animadas = await pagina.evaluate(
    () => document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition) && a.effect?.target?.closest?.(".mk-m-foto")).length,
  );
  await pagina.waitForTimeout(400);
  revisar(animadas === 0 && (await pagina.locator(DIALOGO).count()) === 0, `sin View Transitions, al cerrar no se anima la foto dentro de la galería (${animadas})`);
  await ctx.close();
}

// 12. Con una sola foto no hay «Anterior» ni «Siguiente».
if (parte("visor")) {
  const { ctx, pagina } = await abrir("#momentos");
  await pagina.locator(BOTON("mosaico-una", 1)).scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(600);
  await pagina.locator(BOTON("mosaico-una", 1)).click();
  await pagina.waitForSelector(DIALOGO, { timeout: 6000 }).catch(() => {});
  const botones = await pagina.locator(`${DIALOGO} button`).allTextContents().catch(() => []);
  revisar(botones.length === 1 && botones[0].includes("Cerrar"), `con una foto, el visor solo tiene «Cerrar» (${botones.join(", ")})`);
  await ctx.close();
}

// 13. Movimiento reducido: el visor abre sin animaciones. Y a 360 px no se sale de la pantalla.
if (parte("visor")) {
  const { ctx, pagina } = await abrir("#momentos", { opciones: { reducedMotion: "reduce", viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true } });
  await pagina.locator(BOTON("mosaico", 1)).scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(500);
  await pagina.locator(BOTON("mosaico", 1)).tap();
  await pagina.waitForSelector(DIALOGO, { timeout: 6000 }).catch(() => {});
  const animaciones = await pagina.evaluate(
    () => document.getAnimations().filter((a) => a.effect?.target?.closest?.(".mk-visor") || String(a.effect?.pseudoElement ?? "").startsWith("::view-transition")).length,
  );
  revisar((await pagina.locator(DIALOGO).count()) === 1 && animaciones === 0, `con movimiento reducido el visor abre sin animaciones (${animaciones})`);
  const ancho = await pagina.evaluate(() => document.documentElement.scrollWidth);
  revisar(ancho <= 360, `a 360 px el visor no se sale de la pantalla (${ancho})`);
  await ctx.close();
}

// --- Foto profunda: la foto del encabezado con profundidad real (un mapa en grises al lado de la foto) ---
if (parte("profunda")) {
  const FOTO = "/demo/fotos/cafe.jpg";
  const MAPA = "/demo/fotos/cafe-mapa.jpg";
  const CON = { estilo: "pelicula", composicion: "imagen", titulo: "Café *Luna*", alt: "El local", entrada: "ninguna", imagenes: [FOTO], mapasFotos: [MAPA], fotoProfunda: true, ahorro: "nunca" };
  const L = ".mk-enc canvas.mk-foto-profunda";
  /** Deja leer lo que dibuja el lienzo y cuenta sus dibujos. */
  const espiar = () => {
    window.__prof = { dibujos: 0, texturas: [], sombreadores: [] };
    const real = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (tipo, o) {
      if (this.className !== "mk-foto-profunda" || !/webgl/.test(tipo)) return real.call(this, tipo, o);
      const gl = real.call(this, tipo, { ...o, preserveDrawingBuffer: true });
      if (gl && !gl.__espiado) {
        gl.__espiado = true;
        const dibujar = gl.drawArrays.bind(gl);
        gl.drawArrays = (...a) => {
          window.__prof.dibujos++;
          return dibujar(...a);
        };
        // Lo que se sube a la tarjeta gráfica (su tamaño) y el texto de los sombreadores.
        const subir = gl.texImage2D.bind(gl);
        gl.texImage2D = (...a) => {
          const f = a[a.length - 1];
          window.__prof.texturas.push({ ancho: f?.naturalWidth || f?.width || 0, alto: f?.naturalHeight || f?.height || 0 });
          return subir(...a);
        };
        const fuente = gl.shaderSource.bind(gl);
        gl.shaderSource = (sh, texto) => {
          window.__prof.sombreadores.push(texto);
          return fuente(sh, texto);
        };
      }
      return gl;
    };
  };
  /** Una firma de lo dibujado (un punto de cada tanto) y si hay algo pintado. */
  const firma = (pagina) =>
    pagina.locator(L).evaluate((c) => {
      const gl = c.getContext("webgl");
      const [w, h] = [gl.drawingBufferWidth, gl.drawingBufferHeight];
      const d = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, d);
      const puntos = [];
      let suma = 0;
      for (let i = 0; i < d.length; i += 4 * 211) {
        puntos.push(d[i]);
        suma += d[i] + d[i + 1] + d[i + 2];
      }
      return { texto: puntos.join(","), pintado: suma > 0, ancho: w, alto: h };
    });
  const dibujosEn = async (pagina, ms) => {
    const a = await pagina.evaluate(() => window.__prof.dibujos);
    await pagina.waitForTimeout(ms);
    return (await pagina.evaluate(() => window.__prof.dibujos)) - a;
  };
  const quieto = (pagina) => pagina.waitForSelector(`${L}[data-estado=quieto]`, { timeout: 5000 }).catch(() => {});
  {
    const { ctx, pagina, errores } = await abrir(vista(CON), { antes: [espiar] });
    await pagina.waitForSelector(`${L}[data-lista]`, { timeout: 8000 }).catch(() => {});
    const armado = await pagina.evaluate((q) => {
      const c = document.querySelector(q);
      const img = document.querySelector(".mk-enc-media img");
      return c && { lista: c.hasAttribute("data-lista"), oculto: c.getAttribute("aria-hidden"), toques: getComputedStyle(c).pointerEvents, opacidad: getComputedStyle(c).opacity, foto: img?.getAttribute("alt"), calza: Math.abs(c.getBoundingClientRect().width - c.parentElement.parentElement.getBoundingClientRect().width) < 1 && Math.abs(img.getBoundingClientRect().width - c.getBoundingClientRect().width * 1.06) < 1.5 };
    }, L);
    const alPartir = await firma(pagina);
    revisar(armado && armado.lista && armado.oculto === "true" && armado.toques === "none" && armado.opacidad === "1" && armado.foto === "El local" && armado.calza && alPartir.pintado, `la foto profunda pone un lienzo decorativo encima de la foto, que sigue en la página (${JSON.stringify(armado)})`);
    // Con el cursor a un lado y al otro, lo dibujado cambia.
    const caja = await pagina.locator(".mk-enc").boundingBox();
    await pagina.mouse.move(caja.x + caja.width * 0.1, caja.y + caja.height * 0.5, { steps: 4 });
    await pagina.waitForTimeout(200);
    await quieto(pagina);
    const izquierda = await firma(pagina);
    await pagina.mouse.move(caja.x + caja.width * 0.9, caja.y + caja.height * 0.5, { steps: 4 });
    await pagina.waitForTimeout(200);
    const moviendose = await pagina.locator(L).getAttribute("data-estado");
    await quieto(pagina);
    const derecha = await firma(pagina);
    revisar(izquierda.texto !== derecha.texto && izquierda.texto !== alPartir.texto && moviendose === "vivo", `al mover el cursor, la foto se mueve con profundidad (cambia lo dibujado; mientras tanto está «${moviendose}»)`);
    // Quieto, no dibuja.
    const enReposo = await dibujosEn(pagina, 700);
    revisar(enReposo === 0 && (await pagina.locator(L).getAttribute("data-estado")) === "quieto", `con el cursor quieto, deja de dibujar (${enReposo} dibujos)`);
    // Al bajar la página (con el encabezado a la vista) también se mueve; fuera de la vista, no dibuja.
    await pagina.mouse.move(2, 2);
    await quieto(pagina);
    const arriba = await firma(pagina);
    await pagina.evaluate(() => window.scrollTo(0, 260));
    await pagina.waitForTimeout(200);
    await quieto(pagina);
    const bajando = await firma(pagina);
    // La página de prueba es corta: se le suma espacio abajo para poder sacar el encabezado de la vista.
    await pagina.evaluate(() => {
      document.body.style.paddingBottom = "220vh";
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await pagina.waitForTimeout(500);
    const fueraDeVista = await pagina.evaluate((q) => document.querySelector(q).getBoundingClientRect().bottom < 0, L);
    await pagina.mouse.wheel(0, -30);
    const lejos = fueraDeVista ? await dibujosEn(pagina, 500) : -1;
    revisar(arriba.texto !== bajando.texto && fueraDeVista && lejos === 0, `al bajar la página la foto también se mueve, y fuera de la vista no dibuja (fuera de la vista: ${fueraDeVista}; ${lejos} dibujos)`);
    // Otro tamaño: el lienzo se ajusta y sigue pintado.
    await pagina.evaluate(() => {
      document.body.style.paddingBottom = "";
      window.scrollTo(0, 0);
    });
    await pagina.setViewportSize({ width: 700, height: 860 });
    await pagina.waitForTimeout(500);
    const angosto = await firma(pagina);
    // La foto de abajo va acercada igual que lo que dibuja el lienzo (un 6 %).
    const calza = await pagina.evaluate((q) => Math.abs(document.querySelector(q).getBoundingClientRect().width - document.querySelector(".mk-enc-media").getBoundingClientRect().width) < 1 && Math.abs(document.querySelector(".mk-enc-media img").getBoundingClientRect().width - document.querySelector(q).getBoundingClientRect().width * 1.06) < 1.5, L);
    revisar(angosto.pintado && angosto.ancho !== alPartir.ancho && calza, `al cambiar el tamaño, el lienzo se ajusta y sigue calzando con la foto (${alPartir.ancho} → ${angosto.ancho} px)`);
    // Contexto perdido: el lienzo se va y queda la foto.
    await pagina.locator(L).evaluate((c) => c.getContext("webgl").getExtension("WEBGL_lose_context").loseContext());
    await pagina.waitForTimeout(400);
    revisar((await pagina.locator(L).count()) === 0 && (await pagina.locator(".mk-enc-media img").count()) === 1, "si se pierde el contexto WebGL, el lienzo se quita y queda la foto");
    revisar(errores.length === 0, `sin errores con la foto profunda${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  // Cuando no se puede, queda la foto normal y sin errores.
  const CASOS = [
    ["con movimiento reducido", CON, { opciones: { reducedMotion: "reduce" } }],
    ["sin WebGL", CON, { antes: [() => { const real = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...r) { return /webgl/.test(t) ? null : real.call(this, t, ...r); }; }] }],
    ["sin mapa para la foto", { ...CON, mapasFotos: [] }, {}],
    ["con un mapa que no carga", { ...CON, mapasFotos: ["/__foto/falta.svg"] }, {}],
    ["con una foto que no carga", { ...CON, imagenes: ["/__foto/falta.svg"] }, {}],
    ["con la foto en otro sitio que no está autorizado", { ...CON, imagenes: [`${OTRO}/f.svg`] }, { cors: true }],
    ["con la foto en un sitio autorizado que no da permiso", { ...CON, imagenes: [`${OTRO}/f.svg`], origenesFotos: [OTRO] }, {}],
    ["con el efecto apagado", { ...CON, fotoProfunda: false }, {}],
    ["con un mapa de otra proporción (no es el de esa foto)", { ...CON, mapasFotos: ["/__foto/1.svg"] }, {}],
  ];
  for (const [que, config, opciones] of CASOS) {
    const { ctx, pagina, errores } = await abrir(vista(config), opciones);
    await pagina.waitForSelector(".mk-enc-media img", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(900);
    const v = { lienzos: await pagina.locator(".mk-enc canvas.mk-foto-profunda[data-lista]").count(), restos: await pagina.locator(".mk-enc canvas.mk-foto-profunda").count(), foto: await pagina.locator(".mk-enc-media img").count() };
    revisar(v.lienzos === 0 && v.restos === 0 && v.foto === 1 && errores.length === 0, `${que}: queda la foto normal, sin lienzo y sin errores (${JSON.stringify(v)}${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
  {
    // Con la foto viva también prendida, gana la foto viva (todavía no se combinan).
    const { ctx, pagina } = await abrir(vista({ ...CON, fotoViva: true }));
    await pagina.waitForSelector(".mk-enc canvas.mk-foto-viva", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(600);
    revisar((await pagina.locator(".mk-enc canvas.mk-foto-viva").count()) === 1 && (await pagina.locator(".mk-enc canvas.mk-foto-profunda").count()) === 0, "con la foto viva también prendida, va solo la foto viva");
    await ctx.close();
  }
  {
    // Foto y mapa en otro sitio, autorizado y con permiso: funciona.
    const { ctx, pagina, errores } = await abrir(vista({ ...CON, imagenes: [`${OTRO}/f.svg`], mapasFotos: [`${OTRO}/m.svg`], origenesFotos: [OTRO] }), { cors: true });
    await pagina.waitForSelector(`${L}[data-lista]`, { timeout: 8000 }).catch(() => {});
    revisar((await pagina.locator(`${L}[data-lista]`).count()) === 1 && errores.length === 0, "con la foto y el mapa en otro sitio, autorizado y con permiso, la foto profunda funciona");
    await ctx.close();
  }
  {
    // Al salir de la página del encabezado no quedan lienzos; y en teléfono nada se sale de lado.
    const { ctx, pagina, errores } = await abrir(vista(CON), { antes: [espiar], opciones: { viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true } });
    await pagina.waitForSelector(`${L}[data-lista]`, { timeout: 8000 }).catch(() => {});
    const sobra = await pagina.evaluate(() => document.documentElement.scrollWidth - 360);
    await pagina.touchscreen.tap(180, 300).catch(() => {});
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => (location.hash = ""));
    await pagina.waitForTimeout(500);
    const restos = await pagina.locator("canvas.mk-foto-profunda").count();
    const despues = await dibujosEn(pagina, 500);
    revisar(sobra <= 0 && restos === 0 && despues === 0 && errores.length === 0, `en teléfono no se sale de lado (${sobra} px) y al salir no quedan lienzos ni dibujos (${restos} lienzos, ${despues} dibujos)`);
    await ctx.close();
  }
  // --- Lo que encontró la revisión final (24-11-2026) ---
  /** Cuánto se diferencian dos capturas (promedio por canal, de 0 a 255). Se comparan en una página aparte. */
  const diferencia = async (ctx, a, b) => {
    const hoja = await ctx.newPage();
    const d = await hoja.evaluate(async ([x, y]) => {
      const leer = async (b64) => {
        const mapa = await createImageBitmap(await (await fetch("data:image/png;base64," + b64)).blob());
        const c = new OffscreenCanvas(mapa.width, mapa.height);
        const g = c.getContext("2d");
        g.drawImage(mapa, 0, 0);
        return g.getImageData(0, 0, mapa.width, mapa.height).data;
      };
      const [p, q] = [await leer(x), await leer(y)];
      if (p.length !== q.length) return 255;
      let suma = 0;
      for (let i = 0; i < p.length; i += 4) suma += Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]);
      return suma / ((p.length / 4) * 3);
    }, [a.toString("base64"), b.toString("base64")]);
    await hoja.close();
    return d;
  };
  /** En reposo: el cursor fuera del encabezado (abajo, en la franja de los medidores). */
  const reposo = async (pagina) => {
    const pie = (await pagina.locator(".mk-enc").boundingBox()).height;
    await pagina.mouse.move(640, Math.min(855, pie + 30));
  };
  {
    // Con las capas de profundidad la foto de abajo lleva otra escala más: el lienzo también calza ahí.
    const { ctx, pagina, errores } = await abrir(vista({ ...CON, profundidad: true }), { antes: [espiar] });
    await pagina.waitForSelector(`${L}[data-lista]`, { timeout: 8000 }).catch(() => {});
    await reposo(pagina);
    await pagina.waitForTimeout(1800);
    await quieto(pagina);
    const zona = { x: 0, y: 0, width: 1280, height: 700 };
    const que = await pagina.evaluate(() => ({ capas: document.querySelector(".mk-enc").hasAttribute("data-profundidad"), escala: getComputedStyle(document.querySelector(".mk-enc-media img")).scale }));
    const conLienzo = await pagina.screenshot({ clip: zona });
    await pagina.locator(L).evaluate((c) => (c.style.visibility = "hidden"));
    const calce = await diferencia(ctx, conLienzo, await pagina.screenshot({ clip: zona }));
    revisar(que.capas && que.escala === "1.113" && calce < 2.5 && errores.length === 0, `con las capas de profundidad prendidas, el lienzo también calza con la foto de abajo (${JSON.stringify(que)}; diferencia ${calce.toFixed(2)})`);
    await ctx.close();
  }
  {
    // En reposo, el lienzo muestra lo mismo que la foto de abajo: al aparecer o al irse no hay salto.
    const { ctx, pagina, errores } = await abrir(vista(CON), { antes: [espiar] });
    await pagina.waitForSelector(`${L}[data-lista]`, { timeout: 8000 }).catch(() => {});
    const fuera = () => reposo(pagina);
    await fuera();
    await pagina.waitForTimeout(1500);
    await quieto(pagina);
    const zona = { x: 0, y: 0, width: 1280, height: 700 };
    const conLienzo = await pagina.screenshot({ clip: zona });
    await pagina.locator(L).evaluate((c) => (c.style.visibility = "hidden"));
    const sinLienzo = await pagina.screenshot({ clip: zona });
    await pagina.locator(L).evaluate((c) => (c.style.visibility = ""));
    // Con el cursor a un lado sí tiene que diferenciarse (si no, la comparación no estaría mirando el lienzo).
    await pagina.mouse.move(1200, 600, { steps: 3 });
    await pagina.waitForTimeout(300);
    await quieto(pagina);
    const corrida = await pagina.screenshot({ clip: zona });
    await fuera();
    await pagina.waitForTimeout(300);
    await quieto(pagina);
    const calce = await diferencia(ctx, conLienzo, sinLienzo);
    const control = await diferencia(ctx, corrida, sinLienzo);
    revisar(calce < 2.5 && control > calce * 1.5, `en reposo el lienzo calza con la foto de abajo, sin salto de acercamiento (diferencia ${calce.toFixed(2)} de 255; con el cursor a un lado, ${control.toFixed(2)})`);
    // Si el efecto se cae (contexto perdido), la foto queda donde estaba.
    await pagina.locator(L).evaluate((c) => c.getContext("webgl").getExtension("WEBGL_lose_context").loseContext());
    await pagina.waitForTimeout(400);
    const caida = await diferencia(ctx, await pagina.screenshot({ clip: zona }), sinLienzo);
    revisar((await pagina.locator(L).count()) === 0 && caida < 0.5, `si el efecto se cae, la foto queda igual que antes (diferencia ${caida.toFixed(2)})`);
    const fino = await pagina.evaluate(() => window.__prof.sombreadores.some((t) => /GL_FRAGMENT_PRECISION_HIGH/.test(t) && /highp/.test(t)));
    revisar(fino, "el sombreador pide precisión alta cuando el aparato la tiene (en teléfonos, la media deja la foto borrosa)");
    revisar(errores.length === 0, `sin errores${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    // Una foto enorme no se sube entera a la tarjeta gráfica.
    const enorme = `<svg xmlns="http://www.w3.org/2000/svg" width="6000" height="4000" viewBox="0 0 600 400"><rect width="600" height="400" fill="#b5462f"/><circle cx="300" cy="200" r="120" fill="#fff"/></svg>`;
    const { ctx, pagina, errores } = await abrir(vista({ ...CON, imagenes: ["/__grande.svg"] }), {
      antes: [espiar],
      preparar: (pg) => pg.route(/\/__grande\.svg/, (r) => r.fulfill({ status: 200, contentType: "image/svg+xml", body: enorme })),
    });
    await pagina.waitForSelector(`${L}[data-lista]`, { timeout: 8000 }).catch(() => {});
    const t = await pagina.evaluate(() => window.__prof.texturas);
    const mayor = Math.max(0, ...t.map((x) => Math.max(x.ancho, x.alto)));
    const foto = t.find((x) => x.ancho === mayor);
    revisar((await pagina.locator(`${L}[data-lista]`).count()) === 1 && t.length >= 2 && mayor <= 1600 && mayor >= 1200 && foto && Math.abs(foto.ancho / foto.alto - 1.5) < 0.01 && errores.length === 0, `una foto de 6000 × 4000 se sube achicada, con su proporción (${JSON.stringify(t)})`);
    await ctx.close();
  }
  {
    // La caché del navegador guardó la foto sin permiso (la pidió el <img> de siempre): se pide de nuevo y funciona.
    const { ctx, pagina, errores, pedidos } = await abrir(vista({ ...CON, imagenes: [`${OTRO}/f.svg`], mapasFotos: [`${OTRO}/m.svg`], origenesFotos: [OTRO] }), { cors: "solo-fetch" });
    await pagina.waitForSelector(`${L}[data-lista]`, { timeout: 8000 }).catch(() => {});
    revisar((await pagina.locator(`${L}[data-lista]`).count()) === 1 && errores.length === 0, `si la caché devuelve la foto sin permiso, se pide de nuevo saltándose la caché y la foto profunda funciona (${JSON.stringify(pedidos.porDireccion)})`);
    await ctx.close();
  }
  {
    // El teléfono en la mano: el temblor no despierta al efecto; una inclinación de verdad, sí; acostado, no se usa.
    const inclinar = (pagina, lecturas, cada = 16) =>
      pagina.evaluate(
        async ([ls, ms]) => {
          for (const [beta, gamma] of ls) {
            // En un computador, Safari no trae `DeviceOrientationEvent`: va un evento común con los mismos datos.
            const datos = { alpha: 0, beta, gamma };
            window.dispatchEvent(typeof DeviceOrientationEvent === "function" ? new DeviceOrientationEvent("deviceorientation", datos) : Object.assign(new Event("deviceorientation"), datos));
            await new Promise((r) => setTimeout(r, ms));
          }
        },
        [lecturas, cada],
      );
    const { ctx, pagina, errores } = await abrir(vista(CON), { antes: [espiar] });
    await pagina.waitForSelector(`${L}[data-lista]`, { timeout: 8000 }).catch(() => {});
    await pagina.mouse.move(2, 2);
    await pagina.waitForTimeout(600);
    await inclinar(pagina, [[50, 0]]);
    await pagina.waitForTimeout(300);
    await quieto(pagina);
    const derecho = await firma(pagina);
    const antes = await pagina.evaluate(() => window.__prof.dibujos);
    // Un segundo de temblor: tres décimas de grado para cada lado, también justo en el borde entre dos grados.
    await inclinar(pagina, Array.from({ length: 60 }, (_, i) => [50 + (i % 2 ? 0.3 : -0.3), i % 3 ? 0.3 : -0.3]));
    const temblando = (await pagina.evaluate(() => window.__prof.dibujos)) - antes;
    revisar(temblando === 0 && (await pagina.locator(L).getAttribute("data-estado")) === "quieto", `con el teléfono quieto en la mano (el sensor tiembla), el efecto no dibuja (${temblando} dibujos en un segundo)`);
    await inclinar(pagina, [[60, 10]]);
    await pagina.waitForTimeout(150);
    const estado = await pagina.locator(L).getAttribute("data-estado");
    await quieto(pagina);
    const inclinado = await firma(pagina);
    // En el borde entre dos grados (10,5°), el ruido tampoco lo hace bailar.
    await inclinar(pagina, [[60.5, 10.5]]);
    await pagina.waitForTimeout(300);
    await quieto(pagina);
    const antesBorde = await pagina.evaluate(() => window.__prof.dibujos);
    await inclinar(pagina, Array.from({ length: 40 }, (_, i) => [60.5 + (i % 2 ? 0.2 : -0.2), 10.5 + (i % 2 ? -0.2 : 0.2)]));
    const enElBorde = (await pagina.evaluate(() => window.__prof.dibujos)) - antesBorde;
    revisar(estado === "vivo" && inclinado.texto !== derecho.texto && enElBorde === 0, `al inclinar el teléfono de verdad la foto se mueve, y justo entre dos grados no baila (estaba «${estado}»; ${enElBorde} dibujos en el borde)`);
    // Acostado: los ejes del sensor quedan cambiados. La inclinación deja de usarse y la foto vuelve a su lugar.
    await pagina.evaluate(() => {
      Object.defineProperty(screen.orientation, "angle", { configurable: true, get: () => 90 });
      window.dispatchEvent(new Event("orientationchange"));
    });
    await inclinar(pagina, [[20, 70], [22, 75]]);
    await pagina.waitForTimeout(300);
    await quieto(pagina);
    const acostado = await firma(pagina);
    // De vuelta derecho: parte de cero desde como está ahora (no desde como estaba antes de acostarlo).
    await pagina.evaluate(() => {
      Object.defineProperty(screen.orientation, "angle", { configurable: true, get: () => 0 });
      window.dispatchEvent(new Event("orientationchange"));
    });
    await inclinar(pagina, [[30, 0], [30, 0]]);
    await pagina.waitForTimeout(300);
    await quieto(pagina);
    const deVuelta = await firma(pagina);
    revisar(acostado.texto === derecho.texto && deVuelta.texto === derecho.texto, "con el teléfono acostado la inclinación no se usa, y al volver a pararlo parte de cero desde como está");
    revisar(errores.length === 0, `sin errores con la inclinación${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    // Con la entrada «zoom» la foto de abajo se acerca sola: el lienzo espera a que termine para no cortarla.
    const lenta = () => addEventListener("DOMContentLoaded", () => document.head.appendChild(Object.assign(document.createElement("style"), { textContent: ".mk-enc-media img{animation-duration:40s!important}" })));
    const { ctx, pagina, errores } = await abrir(vista({ ...CON, entrada: "zoom" }), { antes: [espiar, lenta] });
    await pagina.waitForSelector(`${L}[data-lista]`, { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(300);
    const durante = await pagina.evaluate((q) => ({ corriendo: document.querySelector(".mk-enc-media img").getAnimations().filter((a) => a.playState === "running").length, opacidad: getComputedStyle(document.querySelector(q)).opacity }), L);
    await pagina.evaluate(() => document.querySelector(".mk-enc-media img").getAnimations().forEach((a) => a.finish()));
    await pagina.waitForTimeout(300);
    const despues = await pagina.evaluate((q) => getComputedStyle(document.querySelector(q)).opacity, L);
    revisar(durante.corriendo >= 1 && durante.opacidad === "0" && despues === "1" && errores.length === 0, `con la entrada «zoom», el lienzo espera a que la foto termine de entrar (durante: ${JSON.stringify(durante)}; después: ${despues})`);
    await ctx.close();
  }
  {
    // Salir de la página a medio cargar: no queda nada y no hay errores.
    const { ctx, pagina, errores } = await abrir(vista(CON), {
      antes: [espiar],
      preparar: (pg) => pg.route(/\/demo\/fotos\/cafe-mapa\.jpg/, async (r) => (await new Promise((f) => setTimeout(f, 1500)), r.continue())),
    });
    await pagina.waitForSelector(L, { state: "attached", timeout: 8000 }).catch(() => {});
    const aMedias = { lienzos: await pagina.locator(L).count(), listos: await pagina.locator(`${L}[data-lista]`).count() };
    await pagina.evaluate(() => (location.hash = ""));
    await pagina.waitForTimeout(2200);
    const restos = await pagina.locator("canvas.mk-foto-profunda").count();
    const dibujos = await pagina.evaluate(() => window.__prof.dibujos);
    revisar(aMedias.lienzos === 1 && aMedias.listos === 0 && restos === 0 && dibujos === 0 && errores.length === 0, `al salir a medio cargar no queda lienzo ni se dibuja nada (${JSON.stringify(aMedias)}; ${restos} lienzos, ${dibujos} dibujos${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
  {
    // En una composición sin foto a la vista, la pieza ni siquiera se baja.
    const bajadas = [];
    const { ctx, pagina } = await abrir(vista({ ...CON, composicion: "gigante" }), { preparar: (pg) => pg.on("request", (r) => /FotoProfunda/.test(r.url()) && bajadas.push(r.url())) });
    await pagina.waitForSelector(".mk-enc", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(900);
    revisar(bajadas.length === 0 && (await pagina.locator(".mk-enc").count()) === 1, `en una composición sin foto a la vista, la foto profunda no se baja (${bajadas.length} bajadas)`);
    await ctx.close();
  }
  {
    // La vitrina: las tres fotos de ejemplo se ven con su efecto.
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 } });
    const pagina = await ctx.newPage();
    const errores = [];
    pagina.on("pageerror", (e) => errores.push(e.message));
    await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
    await pagina.goto(base + "/#profundidad");
    await pagina.waitForSelector("canvas.mk-foto-profunda[data-lista]", { timeout: 8000 }).catch(() => {});
    await pagina.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
    });
    await pagina.waitForTimeout(600);
    const listos = await pagina.locator("canvas.mk-foto-profunda[data-lista]").count();
    revisar(listos === 3 && errores.length === 0, `la vitrina muestra las tres fotos de ejemplo con su efecto (${listos} lienzos)`);
    await ctx.close();
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
