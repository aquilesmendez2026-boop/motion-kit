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
  pagina.on("pageerror", (e) => errores.push(e.message));
  // Una foto caída deja su propio aviso de red: ese no cuenta como error del kit.
  pagina.on("console", (m) => m.type() === "error" && !/Failed to load resource|ERR_FAILED|CORS/.test(m.text()) && errores.push(m.text()));
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

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
