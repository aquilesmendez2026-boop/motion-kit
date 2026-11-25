// Verifica los hilos (rulos, hebras, figura, rastro, enredadera y ramas) en #hilos: una página que imita una de La Mente en el teléfono.
// Uso: npm run dev (en otra terminal) y después
// `node scripts/verificar-hilos.mjs [http://localhost:5173] [parte]`, donde la parte (opcional) es rulos, hebras,
// figura, niveles, marco (la página dentro de un marco con scroll propio, en #relatos) o lamente (la página como una de
// La Mente: sin el estilo del kit, en su vista previa, con bloques que cambian de orden), material (el hilo de cada estilo)
// rastro (huellas por el recorrido), enredadera (tallo con hojas que se mecen y una flor al final) o ramas (el Hilo de
// fondo que se divide: ramas que chocan con los bloques y otras que se juntan al fondo).
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const solo = process.argv[3];
const PARTES = ["rulos", "hebras", "figura", "niveles", "marco", "lamente", "material", "rastro", "enredadera", "ramas"];
if (solo && !PARTES.includes(solo)) {
  console.log(`No existe la parte «${solo}». Las que hay: ${PARTES.join(", ")}.`);
  process.exit(1);
}
const parte = (nombre) => !solo || solo === nombre;
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const navegador = await chromium.launch();
const P = "[data-prueba=hilo-pagina]";
/** Para lo que solo pasa donde hay animaciones atadas al scroll: en los demás navegadores el hilo va entero y quieto. */
let alBajarGlobal = revisar;
const noAplica = (_ok, texto) => console.log(`– no aplica aquí (este navegador no tiene animaciones atadas al scroll: el hilo va entero y quieto): ${texto.split(" (")[0]}`);

/** Abre #hilos en un teléfono. Cuenta los cuadros que piden los hilos y deja las ayudas para mirar el trazado. */
async function abrir({ opciones = {}, hilo, ruta = "#hilos", raiz = P } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.addInitScript(() => {
    window.__cuadros = 0;
    const pedir = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (f) => {
      if (/relatos\/hilos\//.test(new Error().stack ?? "")) window.__cuadros++;
      return pedir(f);
    };
    /** Los tramos del hilo: sus puntos en la pantalla (uno cada 6 px) y cuánto va dibujado de cada uno. */
    window.__hilos = (raiz = "[data-prueba=hilo-pagina]") => {
      const svg = document.querySelector(`${raiz} svg.mk-hilos`);
      if (!svg) return { hay: false, tramos: [], nudos: [], luces: [] };
      const c = svg.getBoundingClientRect();
      // De los px del dibujo a los de la pantalla (la página puede estar achicada, como en una vista previa). Se saca de
      // la caja del dibujo y no de getScreenCTM(): en WebKit esa no cuenta el `transform` de lo que envuelve al SVG.
      const k = c.width / (Number(svg.getAttribute("width")) || c.width || 1);
      const aPantalla = { a: k, b: 0, c: 0, d: k, e: c.left, f: c.top };
      const tramos = [...svg.querySelectorAll("path[data-tramo]")].map((p) => {
        const largo = p.getTotalLength();
        const s = getComputedStyle(p);
        const n = Math.max(2, Math.ceil(largo / 6));
        const puntos = Array.from({ length: n + 1 }, (_, i) => {
          const q = p.getPointAtLength((largo * i) / n);
          const e = new DOMPoint(q.x, q.y).matrixTransform(new DOMMatrix([aPantalla.a, 0, 0, aPantalla.d, aPantalla.e, aPantalla.f]));
          return { x: e.x, y: e.y };
        });
        // `stroke-dashoffset` va de 1 (sin dibujar) a 0 (entero); el largo del camino está normalizado a 1.
        // Con un material, el color del tramo va en su grupo de capas.
        const grupo = p.closest("[data-capas]");
        return { clase: p.dataset.clase, largo, puntos, dibujado: 1 - Math.min(1, Math.max(0, parseFloat(s.strokeDashoffset) || 0)), color: grupo ? getComputedStyle(grupo).color : s.stroke, d: p.getAttribute("d"), tiempo: p.hasAttribute("data-tiempo") };
      });
      const nudos = [...svg.querySelectorAll("[data-nudo]")].map((n) => {
        const r = n.getBoundingClientRect();
        return { clase: n.dataset.clase, x: r.left + r.width / 2, y: r.top + r.height / 2, opacidad: Number(getComputedStyle(n).opacity) };
      });
      const luces = [...document.querySelectorAll(`${raiz} .mk-hilos-luz`)].map((l) => Number(getComputedStyle(l).opacity));
      return { hay: true, vivo: svg.hasAttribute("data-vivo"), final: svg.hasAttribute("data-final"), ancho: Number(svg.getAttribute("width")), alto: Number(svg.getAttribute("height")), color: getComputedStyle(svg).color, caja: svg.getAttribute("viewBox"), tramos, nudos, luces };
    };
    /** Las cajas de lo que el hilo no puede pisar: cada texto, las fotos, las tarjetas y los botones. */
    window.__contenido = (donde = "[data-prueba=hilo-pagina]") => {
      const raiz = document.querySelector(donde);
      const cajas = [];
      const anda = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      for (let n = anda.nextNode(); n; n = anda.nextNode()) {
        if (!n.textContent.trim() || n.parentElement.closest("[aria-hidden=true], svg")) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        for (const c of r.getClientRects()) cajas.push({ izq: c.left, arriba: c.top, der: c.right, abajo: c.bottom, que: n.textContent.trim().slice(0, 24) });
      }
      for (const e of raiz.querySelectorAll("[data-mk-parte], a, button, img")) {
        const c = e.getBoundingClientRect();
        cajas.push({ izq: c.left, arriba: c.top, der: c.right, abajo: c.bottom, que: e.dataset.mkParte ?? e.tagName });
      }
      return cajas.filter((c) => c.der > c.izq && c.abajo > c.arriba);
    };
    window.__franja = (nombre) => {
      const c = document.querySelector(`[data-franja="${nombre}"]`).getBoundingClientRect();
      return { izq: c.left, arriba: c.top, der: c.right, abajo: c.bottom };
    };
  });
  await pagina.goto(`${base}/${ruta}`);
  await pagina.waitForSelector(raiz, { timeout: 8000 }).catch(() => {});
  if (hilo) await pagina.selectOption("[data-prueba=hilo-tipo]", hilo);
  await pagina.waitForSelector(`${raiz} svg.mk-hilos path[data-tramo]`, { timeout: 4000 }).catch(() => {});
  await pagina.waitForTimeout(500);
  const nativo = await pagina.evaluate(() => CSS.supports("animation-timeline: scroll()"));
  alBajarGlobal = nativo ? revisar : noAplica;
  // `alBajar`: una revisión de lo que el hilo hace mientras se baja (solo donde el navegador lo dibuja atado al scroll).
  return { ctx, pagina, errores, nativo, alBajar: nativo ? revisar : noAplica };
}
/** Baja hasta esa parte del scroll total (de 0 a 1) y espera a que el navegador pinte. */
async function bajar(pagina, parte) {
  await pagina.evaluate((k) => {
    const e = document.scrollingElement;
    e.scrollTo(0, (e.scrollHeight - e.clientHeight) * k);
    return new Promise((listo) => requestAnimationFrame(() => requestAnimationFrame(listo)));
  }, parte);
  await pagina.waitForTimeout(120);
}
/** Baja hasta dejar el centro de una franja en el centro de la pantalla. */
async function centrar(pagina, franja, corrido = 0) {
  await pagina.evaluate(([f, c]) => {
    const r = document.querySelector(`[data-franja="${f}"]`).getBoundingClientRect();
    window.scrollBy(0, r.top + r.height / 2 - innerHeight / 2 + c);
    return new Promise((listo) => requestAnimationFrame(() => requestAnimationFrame(listo)));
  }, [franja, corrido]);
  await pagina.waitForTimeout(120);
}
const hilos = (pagina, raiz = P) => pagina.evaluate((r) => window.__hilos(r), raiz);
/** Cuántos px de hilo ya dibujado hay dentro de la pantalla. */
const aLaVista = (h, alto = 844) => h.tramos.reduce((s, t) => s + t.puntos.filter((p, i) => i / (t.puntos.length - 1) <= t.dibujado && p.y >= 0 && p.y <= alto).length * 6, 0);
const dibujado = (h) => h.tramos.reduce((s, t) => s + t.dibujado * t.largo, 0);
/**
 * Deja los bloques en su lugar (sin la entrada de su relato) para comparar el hilo con el contenido. También sin
 * transición: donde la entrada es una transición (sin scroll nativo), el cambio se animaría y los bloques seguirían
 * a medio camino al mirar.
 */
const asentar = (pagina) => pagina.addStyleTag({ content: ".mk-relato,.mk-relato *{animation:none!important;transition:none!important;transform:none!important;translate:none!important;scale:none!important;opacity:1!important}" });
/** Espera a que el final (la llegada y la figura, que van con tiempo) termine de dibujarse. */
const esperarFinal = (pagina, raiz = P) =>
  pagina.waitForFunction((r) => {
    const h = window.__hilos(r);
    return h.tramos.length > 0 && h.tramos.filter((t) => t.tiempo).every((t) => t.dibujado > 0.99);
  }, raiz, { timeout: 6000 }).catch(() => {});
/** Los puntos del hilo (y sus nudos) que caen sobre el contenido. */
async function pisados(pagina, raiz = P) {
  return pagina.evaluate((r) => {
    const cajas = window.__contenido(r);
    const h = window.__hilos(r);
    const sobre = (p) => cajas.find((c) => p.x > c.izq + 2 && p.x < c.der - 2 && p.y > c.arriba + 2 && p.y < c.abajo - 2);
    // El borde de las capas del material: lo que más se aleja del centro, hacia cada lado.
    const svg = document.querySelector(`${r} svg.mk-hilos`);
    const bordes = [];
    if (svg) {
      const caja = svg.getBoundingClientRect();
      const k = caja.width / (Number(svg.getAttribute("width")) || caja.width || 1);
      const aPantalla = new DOMMatrix([k, 0, 0, k, caja.left, caja.top]);
      for (const c of svg.querySelectorAll("[data-capas] path:not([data-tramo])")) {
        const ancho = parseFloat(getComputedStyle(c).strokeWidth) / 2;
        const largo = c.getTotalLength();
        const n = Math.max(2, Math.ceil(largo / 8));
        for (let i = 1; i < n; i++) {
          const [a, b] = [c.getPointAtLength((largo * (i - 1)) / n), c.getPointAtLength((largo * i) / n)];
          const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          for (const lado of [-1, 1]) {
            const e = new DOMPoint(b.x + (lado * ancho * -(b.y - a.y)) / l, b.y + (lado * ancho * (b.x - a.x)) / l).matrixTransform(aPantalla);
            bordes.push({ x: e.x, y: e.y });
          }
        }
      }
    }
    const malos = [];
    for (const t of h.tramos) for (const p of t.puntos) if (sobre(p)) malos.push(`${t.clase} en (${Math.round(p.x)}, ${Math.round(p.y)}) sobre «${sobre(p).que}»`);
    for (const n of h.nudos) if (sobre(n)) malos.push(`${n.clase} sobre «${sobre(n).que}»`);
    for (const b of bordes) if (sobre(b)) malos.push(`borde de una capa en (${Math.round(b.x)}, ${Math.round(b.y)}) sobre «${sobre(b).que}»`);
    return { malos: [...new Set(malos)], puntos: h.tramos.reduce((s, t) => s + t.puntos.length, 0), cajas: cajas.length };
  }, raiz);
}
/** Cuánto gira en total un camino (en grados): un rulo suma una vuelta entera. */
function giro(puntos) {
  let total = 0;
  for (let i = 2; i < puntos.length; i++) {
    const a = Math.atan2(puntos[i - 1].y - puntos[i - 2].y, puntos[i - 1].x - puntos[i - 2].x);
    const b = Math.atan2(puntos[i].y - puntos[i - 1].y, puntos[i].x - puntos[i - 1].x);
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    total += d;
  }
  return Math.abs((total * 180) / Math.PI);
}
/** Razón de contraste entre dos colores `rgb()`. */
function contraste(a, b) {
  const luz = (c) => {
    const [r, g, b2] = (c.match(/[\d.]+/g) ?? []).slice(0, 3).map((v) => {
      const k = Number(v) / 255;
      return k <= 0.03928 ? k / 12.92 : ((k + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const ALTURAS = Array.from({ length: 10 }, (_, i) => 0.28 + (i * 0.72) / 9);

// --- El hilo con rulos ---
if (parte("rulos")) {
  {
    const { ctx, pagina, errores, nativo, alBajar } = await abrir({ hilo: "rulos" });
    const arriba = await hilos(pagina);
    revisar(arriba.hay && arriba.vivo === nativo && arriba.tramos.length >= 4 && arriba.tramos.every((t) => t.clase === "tronco") && errores.length === 0, `con «rulos» hay un hilo de ${arriba.tramos.length} tramos, todos del tronco${errores.length ? ` (${errores[0]})` : ""}`);
    alBajar(arriba.tramos.every((t) => t.dibujado < 0.05), `arriba de todo el hilo todavía no se dibuja (${arriba.tramos.map((t) => t.dibujado.toFixed(2)).join(" ")})`);
    // A diez alturas de la bajada hay hilo dibujado a la vista, y avanza sin retroceder.
    const vistas = [];
    const avance = [];
    for (const k of ALTURAS) {
      await bajar(pagina, k);
      const h = await hilos(pagina);
      vistas.push(aLaVista(h));
      avance.push(Math.round(dibujado(h)));
    }
    revisar(vistas.every((v) => v >= 120), `a diez alturas de la bajada hay hilo dibujado a la vista (px de trazo: ${vistas.join(", ")})`);
    alBajar(avance.every((v, i) => i === 0 || v >= avance[i - 1] - 1) && avance.at(-1) > avance[0] + 400, `el hilo avanza al bajar y no retrocede (px dibujados: ${avance.join(", ")})`);
    const abajo = await hilos(pagina);
    revisar(abajo.tramos.every((t) => t.dibujado > 0.99), `al terminar de bajar, el hilo está entero (${abajo.tramos.map((t) => t.dibujado.toFixed(2)).join(" ")})`);
    // La punta del hilo va a la altura de la vista (cerca del 60 %), aunque haya cosas sobre la página en el mismo scroll.
    const puntas = [];
    for (const k of [0.22, 0.3, 0.38, 0.46]) {
      await bajar(pagina, k);
      const h = await hilos(pagina);
      for (const t of h.tramos.filter((x) => x.dibujado > 0.08 && x.dibujado < 0.92)) puntas.push(t.puntos[Math.round(t.dibujado * (t.puntos.length - 1))].y / 844);
    }
    // Va un poco más arriba del 60 %: mientras dibuja el cruce (que es largo y no baja), la línea de la vista sigue bajando.
    alBajar(puntas.length >= 2 && puntas.every((y) => y > 0.38 && y < 0.72), `la punta del hilo va a la altura de la vista, entre el 40 y el 70 % (${puntas.map((y) => `${Math.round(y * 100)} %`).join(", ")})`);
    // Solo cambian el trazo, el viaje de la luz y la opacidad.
    const estilos = () =>
      pagina.evaluate(() =>
        [...document.querySelectorAll("[data-prueba=hilo-pagina] svg.mk-hilos, [data-prueba=hilo-pagina] svg.mk-hilos *, [data-prueba=hilo-pagina] .mk-hilos-luz")].map((e) => {
          const s = getComputedStyle(e);
          return Object.fromEntries([...s].filter((p) => !p.startsWith("--")).map((p) => [p, s.getPropertyValue(p)]));
        }),
      );
    await bajar(pagina, 0.4);
    const e1 = await estilos();
    await bajar(pagina, 0.55);
    const e2 = await estilos();
    const cambia = [...new Set(e1.flatMap((x, i) => Object.keys(x).filter((p) => x[p] !== e2[i]?.[p])))];
    alBajar(cambia.length > 0 && cambia.every((p) => ["stroke-dashoffset", "offset-distance", "offset", "opacity"].includes(p)), `al bajar, en el hilo solo cambia: ${cambia.join(", ")}`);
    // Donde no se dibuja al bajar, no cambia nada.
    if (!nativo) revisar(cambia.length === 0, `sin animaciones atadas al scroll, al bajar no cambia nada en el hilo (${cambia.join(", ") || "nada"})`);
    // Con la página quieta no se pide ningún cuadro.
    await pagina.waitForTimeout(500);
    const c1 = await pagina.evaluate(() => window.__cuadros);
    await pagina.waitForTimeout(700);
    const c2 = await pagina.evaluate(() => window.__cuadros);
    revisar(c1 === c2, `con la página quieta el hilo no pide cuadros (${c2 - c1} en 0,7 s)`);
    // Una luz viaja por la punta.
    const luces = (await hilos(pagina)).luces.filter((o) => o > 0.5).length;
    alBajar(luces === 1, `una sola luz viaja por la punta del hilo (${luces} a la vista)`);
    await ctx.close();
  }
  {
    // Nunca sobre el contenido; rulos de verdad; puntadas frente a la foto; y otro color sobre la franja de acento.
    const { ctx, pagina, errores } = await abrir({ hilo: "rulos" });
    await asentar(pagina);
    await pagina.waitForTimeout(400);
    const p = await pisados(pagina);
    revisar(p.malos.length === 0 && p.puntos > 200 && p.cajas > 20, `ningún punto del hilo cae sobre un texto, una foto, una tarjeta o un botón (${p.puntos} puntos contra ${p.cajas} cajas${p.malos.length ? `; ${p.malos.slice(0, 3).join("; ")}` : ""})`);
    const h = await hilos(pagina);
    const conRulo = h.tramos.filter((t) => giro(t.puntos) >= 250).length;
    revisar(conRulo >= 3 && h.caja === `0 0 ${h.ancho} ${h.alto}`, `el hilo hace rulos (${conRulo} tramos dan una vuelta entera) y no se estira: el dibujo mide lo mismo que la página (${h.caja} en ${h.ancho} × ${h.alto})`);
    const foto = await pagina.evaluate(() => window.__franja("foto"));
    const sobreLaFoto = h.tramos.flatMap((t) => t.puntos).filter((q) => q.y > foto.arriba + 2 && q.y < foto.abajo - 2).length;
    const puntadas = h.nudos.filter((n) => n.clase === "puntada");
    const entra = puntadas.filter((n) => n.y <= foto.arriba + 2 && n.y > foto.arriba - 90).length;
    const sale = puntadas.filter((n) => n.y >= foto.abajo - 2 && n.y < foto.abajo + 90).length;
    revisar(sobreLaFoto === 0 && entra === 1 && sale === 1, `frente a la foto de lado a lado el hilo pasa por debajo: no hay línea (${sobreLaFoto} puntos) y quedan dos puntadas, una donde entra y otra donde sale (${entra} y ${sale})`);
    // Una foto puesta como fondo de la franja (por CSS) tampoco se pisa, aunque su texto deje orilla libre.
    const conFondo = await pagina.evaluate(() => window.__franja("fondo-foto"));
    const sobreElFondo = h.tramos.flatMap((t) => t.puntos).filter((q) => q.y > conFondo.arriba + 2 && q.y < conFondo.abajo - 2).length;
    revisar(sobreElFondo === 0 && puntadas.length === 4, `sobre una franja con una foto de fondo tampoco hay línea: el hilo pasa por debajo (${sobreElFondo} puntos sobre ella; ${puntadas.length} puntadas en la página)`);
    const acento = await pagina.evaluate(() => {
      const f = document.querySelector('[data-franja="acento"]');
      const c = f.getBoundingClientRect();
      return { fondo: getComputedStyle(f).backgroundColor, arriba: c.top, abajo: c.bottom };
    });
    const enAcento = h.tramos.filter((t) => t.puntos.filter((q) => q.y > acento.arriba && q.y < acento.abajo).length > t.puntos.length / 2);
    const otros = h.tramos.filter((t) => !enAcento.includes(t));
    revisar(enAcento.length >= 1 && enAcento.every((t) => contraste(t.color, acento.fondo) >= 1.6) && otros.every((t) => t.color !== enAcento[0].color), `sobre la franja de acento el hilo cambia de color para no perderse (contraste ${enAcento.map((t) => contraste(t.color, acento.fondo).toFixed(1)).join(", ")} a 1 con el fondo)`);
    // Si un bloque cambia de alto, el hilo se vuelve a trazar.
    const antes = { alto: h.alto, d: h.tramos.map((t) => t.d).join("|") };
    await pagina.locator("[data-prueba=hilo-crece]").click();
    await pagina.waitForTimeout(700);
    const despues = await hilos(pagina);
    const p2 = await pisados(pagina);
    const altoPagina = await pagina.locator(P).evaluate((e) => e.offsetHeight);
    revisar(despues.alto > antes.alto + 40 && Math.abs(despues.alto - altoPagina) < 1 && despues.tramos.map((t) => t.d).join("|") !== antes.d && p2.malos.length === 0 && errores.length === 0, `si un bloque crece, el hilo se vuelve a trazar y sigue sin pisar el contenido (${antes.alto} → ${despues.alto} px${p2.malos.length ? `; ${p2.malos[0]}` : ""})`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir({ hilo: "rulos", opciones: { viewport: { width: 360, height: 760 } } });
    await asentar(pagina);
    await pagina.waitForTimeout(400);
    const sobra = await pagina.evaluate(() => document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth);
    const p = await pisados(pagina);
    revisar(sobra <= 0 && p.malos.length === 0 && p.puntos > 200, `a 360 px nada se sale de lado (${sobra} px) y el hilo sigue sin pisar el contenido${p.malos.length ? ` (${p.malos[0]})` : ""}`);
    await ctx.close();
  }
}

// --- Las hebras ---
if (parte("hebras")) {
  const { ctx, pagina, errores, alBajar } = await abrir({ hilo: "hebras" });
  const enFranja = async (nombre) => {
    const f = await pagina.evaluate((n) => window.__franja(n), nombre);
    const h = await hilos(pagina);
    return { f, h, hebras: h.tramos.filter((t) => t.clase === "hebra" && t.puntos.every((q) => q.y > f.arriba - 4 && q.y < f.abajo + 4)) };
  };
  await centrar(pagina, "grilla");
  const grilla = await enFranja("grilla");
  const aLaVez = grilla.hebras.filter((t) => t.dibujado > 0.05 && t.dibujado < 0.95).length;
  const lucesGrilla = grilla.h.luces.filter((o) => o > 0.5).length;
  revisar(grilla.hebras.length === 3 && errores.length === 0, `en la grilla de dos columnas el hilo se abre en tres hebras (${grilla.hebras.length})${errores.length ? ` (${errores[0]})` : ""}`);
  alBajar(aLaVez >= 2, `a media bajada se dibujan varias hebras a la vez (${grilla.hebras.map((t) => t.dibujado.toFixed(2)).join(" ")})`);
  alBajar(lucesGrilla >= 2, `mientras está abierto viaja una luz por hebra (${lucesGrilla} a la vista)`);
  // Parten de un punto y se juntan en otro.
  const puntas = grilla.hebras.map((t) => [t.puntos[0], t.puntos.at(-1)]);
  const junto = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) <= 2;
  revisar(puntas.every(([a, b]) => junto(a, puntas[0][0]) && junto(b, puntas[0][1])), "las hebras parten del mismo punto y se juntan en el mismo punto");
  await centrar(pagina, "lista");
  const lista = await enFranja("lista");
  revisar(lista.hebras.length === 2 && grilla.hebras.every((_, i) => lista.h.tramos.filter((t) => t.clase === "hebra")[i].dibujado > 0.99), `en la lista de una columna son dos hebras que la abrazan, y las de la grilla ya quedaron enteras (${lista.hebras.length})`);
  await centrar(pagina, "texto");
  const lucesTexto = (await hilos(pagina)).luces.filter((o) => o > 0.5).length;
  alBajar(lucesTexto === 1, `donde el hilo va junto, hay una sola luz (${lucesTexto})`);
  // Un nudo junto a cada tarjeta, sin pisarla.
  await asentar(pagina);
  await pagina.waitForTimeout(400);
  const nudos = await pagina.evaluate(() => {
    const tarjetas = [...document.querySelectorAll('[data-prueba=hilo-pagina] [data-mk-parte="tarjeta"]')].map((t) => t.getBoundingClientRect());
    return window.__hilos().nudos.filter((n) => n.clase === "nudo").map((n) => Math.min(...tarjetas.map((t) => Math.max(t.left - n.x, n.x - t.right, t.top - n.y, n.y - t.bottom))));
  });
  const p = await pisados(pagina);
  revisar(nudos.length === 7 && nudos.every((d) => d > 0 && d <= 20) && p.malos.length === 0, `hay un nudo junto a cada tarjeta (${nudos.length}; a ${nudos.map((d) => Math.round(d)).join(", ")} px de ella) y ni las hebras ni los nudos pisan el contenido${p.malos.length ? ` (${p.malos.slice(0, 2).join("; ")})` : ""}`);
  await ctx.close();
}

// --- El hilo que dibuja ---
if (parte("figura")) {
  const { ctx, pagina, errores, alBajar } = await abrir({ hilo: "figura" });
  const remate = () =>
    pagina.evaluate(() => {
      const r = document.querySelector("[data-prueba=hilo-pagina] .mk-hilos-remate")?.getBoundingClientRect();
      const p = document.querySelector("[data-prueba=hilo-pagina]").getBoundingClientRect();
      return r ? { alto: r.height, arriba: r.top, abajo: r.bottom, alFinal: Math.abs(r.bottom - p.bottom) < 1 } : null;
    });
  await bajar(pagina, 0.8);
  const antes = (await hilos(pagina)).tramos.find((t) => t.clase === "figura");
  await bajar(pagina, 1);
  await esperarFinal(pagina);
  const h = await hilos(pagina);
  const r = await remate();
  const figura = h.tramos.find((t) => t.clase === "figura");
  const ys = figura ? figura.puntos.map((q) => q.y) : [0];
  revisar(Boolean(r) && r.alto === 140 && r.alFinal && errores.length === 0, `con «figura» la página termina en un remate de 140 px (${r?.alto})${errores.length ? ` (${errores[0]})` : ""}`);
  revisar(Boolean(figura) && figura.dibujado > 0.99 && h.tramos.at(-1) === figura, `al terminar de bajar, la figura está entera y es lo último del hilo (${figura?.dibujado.toFixed(2)})`);
  alBajar(Boolean(antes) && antes.dibujado < 0.05, `la figura se dibuja recién al final de la bajada (al 80 % todavía no: ${antes?.dibujado.toFixed(2)})`);
  // El final no depende de cuánto quede por bajar: se dibuja con tiempo cuando el remate se ve, y a la vista.
  {
    const { ctx: ctx2, pagina: p2, alBajar: alBajar2 } = await abrir({ hilo: "figura" });
    await p2.evaluate(() => document.querySelector(".mk-hilos-remate").scrollIntoView({ block: "end" }));
    await p2.waitForTimeout(250);
    const recien = await hilos(p2);
    const enPantalla = await p2.evaluate(() => {
      const r = document.querySelector(".mk-hilos-remate").getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight + 1;
    });
    await esperarFinal(p2);
    const luego = await hilos(p2);
    const t0 = recien.tramos.filter((t) => t.tiempo);
    alBajar2(t0.length === 2 && recien.final && t0.every((t) => t.dibujado < 0.95) && luego.tramos.filter((t) => t.tiempo).every((t) => t.dibujado > 0.99) && enPantalla, `el final (la llegada y la figura) se dibuja con tiempo apenas el remate se ve, entero dentro de la pantalla (recién: ${t0.map((t) => t.dibujado.toFixed(2)).join(", ")}; después: entero)`);
    await ctx2.close();
  }
  revisar(Boolean(figura) && Math.min(...ys) >= r.arriba - 1 && Math.max(...ys) <= r.abajo + 1 && Math.max(...ys) - Math.min(...ys) >= 70, `la figura queda dentro del remate y se nota (${Math.round(Math.max(...ys) - Math.min(...ys))} px de alto)`);
  // Es el mismo hilo: sigue de corrido.
  const pegado = h.tramos.some((t) => t !== figura && Math.hypot(t.puntos.at(-1).x - figura.puntos[0].x, t.puntos.at(-1).y - figura.puntos[0].y) <= 2);
  revisar(pegado, "la figura sigue de corrido desde la punta del hilo");
  // Otra figura, otro dibujo; otra semilla, otro hilo.
  await pagina.selectOption("[data-prueba=hilo-figura]", "tijera");
  await pagina.waitForTimeout(400);
  const tijera = await hilos(pagina);
  await pagina.locator("[data-prueba=hilo-semilla]").fill("otro-local");
  await pagina.waitForTimeout(400);
  const otra = await hilos(pagina);
  revisar(tijera.tramos.at(-1).d !== figura.d && otra.tramos[0].d !== tijera.tramos[0].d, "otra figura cambia el dibujo del final, y otra semilla cambia el hilo");
  // Con «rulos» no hay remate: la página mide 140 px menos.
  // El remate se mide: con relleno bajo él, la figura sigue dentro.
  await pagina.locator(P).evaluate((e) => (e.style.paddingBottom = "60px"));
  await pagina.waitForTimeout(700);
  const conRelleno = await pagina.evaluate(() => {
    const r = document.querySelector("[data-prueba=hilo-pagina] .mk-hilos-remate").getBoundingClientRect();
    const f = window.__hilos().tramos.find((t) => t.clase === "figura");
    const ys = f.puntos.map((q) => q.y);
    return { arriba: r.top, abajo: r.bottom, min: Math.min(...ys), max: Math.max(...ys) };
  });
  revisar(conRelleno.min >= conRelleno.arriba - 1 && conRelleno.max <= conRelleno.abajo + 1, `con relleno bajo el remate, la figura sigue dentro de él: se mide dónde está (${Math.round(conRelleno.min - conRelleno.arriba)} a ${Math.round(conRelleno.max - conRelleno.arriba)} px de los 140)`);
  await pagina.locator(P).evaluate((e) => (e.style.paddingBottom = ""));
  await pagina.waitForTimeout(500);
  const conRemate = await pagina.locator(P).evaluate((e) => e.offsetHeight);
  await pagina.selectOption("[data-prueba=hilo-tipo]", "rulos");
  await pagina.waitForTimeout(400);
  const sinRemate = await pagina.locator(P).evaluate((e) => e.offsetHeight);
  revisar(conRemate - sinRemate === 140 && (await remate()) === null, `sin «figura» no hay remate (${conRemate} → ${sinRemate} px)`);
  await ctx.close();
}

// --- Niveles y navegadores ---
if (parte("niveles")) {
  {
    // Sin scroll nativo (o en liviano): el hilo entero y quieto, sin luces.
    const { ctx, pagina, errores } = await abrir({ hilo: "figura" });
    await pagina.locator("[data-prueba=hilo-respaldo]").check();
    // Se cambia de hilo y se vuelve: así la página se mide de nuevo ya sin scroll nativo (como en un navegador que
    // no lo tiene, donde el hilo nace en ese modo).
    await pagina.selectOption("[data-prueba=hilo-tipo]", "rulos");
    await pagina.waitForTimeout(400);
    await pagina.selectOption("[data-prueba=hilo-tipo]", "figura");
    await pagina.waitForTimeout(700);
    const h = await hilos(pagina);
    await bajar(pagina, 0.6);
    const h2 = await hilos(pagina);
    revisar(h.hay && !h.vivo && h.tramos.length >= 6 && h.tramos.every((t) => t.dibujado > 0.99) && h.luces.length === 0 && dibujado(h2) === dibujado(h) && errores.length === 0, `sin scroll nativo el hilo está entero y quieto, con su figura y sin luces (${h.tramos.length} tramos, ${h.luces.length} luces)`);
    // Ahí los bloques entran con una transición (corridos 24 px hasta que se ven): el hilo se mide igual contra su
    // lugar final, no contra donde están mientras tanto.
    await asentar(pagina);
    await pagina.waitForTimeout(900);
    const p = await pisados(pagina);
    revisar(p.malos.length === 0 && p.puntos > 200, `sin scroll nativo el hilo tampoco pisa el contenido: se mide contra el lugar final de cada bloque (${p.puntos} puntos${p.malos.length ? `; ${p.malos.slice(0, 3).join("; ")}` : ""})`);
    await ctx.close();
  }
  {
    // Quieto (movimiento reducido): sin hilo; con «figura», solo la figura, dibujada.
    const { ctx, pagina, errores } = await abrir({ hilo: "figura", opciones: { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" } });
    const h = await hilos(pagina);
    const cuadros = await pagina.evaluate(() => window.__cuadros);
    revisar(h.hay && h.tramos.length === 1 && h.tramos[0].clase === "figura" && h.tramos[0].dibujado > 0.99 && h.nudos.length === 0 && h.luces.length === 0 && errores.length === 0, `con movimiento reducido no hay hilo: queda solo la figura, dibujada y quieta (${h.tramos.map((t) => t.clase).join(", ")})`);
    await pagina.selectOption("[data-prueba=hilo-tipo]", "hebras");
    await pagina.waitForTimeout(400);
    const sin = await hilos(pagina);
    revisar(sin.tramos.length === 0 && sin.nudos.length === 0, `y con «hebras», nada (${sin.tramos.length} tramos); el trazado pidió ${cuadros} cuadros al medir`);
    await ctx.close();
  }
  {
    // El Hilo de siempre no cambia.
    const { ctx, pagina, errores } = await abrir({ hilo: "hilo" });
    const viejo = await pagina.evaluate(() => ({ hilo: document.querySelectorAll("[data-prueba=hilo-pagina] svg.mk-hilo path").length, hilos: document.querySelectorAll("[data-prueba=hilo-pagina] svg.mk-hilos").length, z: getComputedStyle(document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilo")).zIndex }));
    revisar(viejo.hilo === 1 && viejo.hilos === 0 && viejo.z === "-1" && errores.length === 0, `el Hilo de siempre sigue igual: una S por detrás de los bloques (${JSON.stringify(viejo)})`);
    await ctx.close();
  }
}

// --- La página dentro de un marco con su propio scroll (como una vista previa) ---
if (parte("marco")) {
  const T = '[data-telefono="p-figura"]';
  const R = `${T} .mk-pagina`;
  const { ctx, pagina, errores, nativo, alBajar } = await abrir({ ruta: "#relatos", raiz: R, opciones: { viewport: { width: 1280, height: 900 } } });
  await pagina.evaluate((t) => document.querySelector(t).scrollIntoView({ block: "center" }), T);
  await pagina.waitForTimeout(700);
  /** Baja dentro del marco hasta esa parte de su scroll (de 0 a 1). */
  const bajarEn = async (k) => {
    await pagina.evaluate(([t, parte]) => {
      const e = document.querySelector(t);
      e.scrollTo(0, (e.scrollHeight - e.clientHeight) * parte);
      return new Promise((listo) => requestAnimationFrame(() => requestAnimationFrame(listo)));
    }, [T, k]);
    await pagina.waitForTimeout(150);
  };
  const marco = await pagina.evaluate((t) => {
    const e = document.querySelector(t);
    const c = e.getBoundingClientRect();
    return { arriba: c.top, alto: e.clientHeight, baja: e.scrollHeight - e.clientHeight, pagina: e.querySelector(".mk-pagina").offsetHeight };
  }, T);
  await bajarEn(0);
  const arriba = await hilos(pagina, R);
  revisar(arriba.hay && arriba.vivo === nativo && arriba.tramos.length >= 3 && marco.baja > 400 && errores.length === 0, `dentro de un marco con su propio scroll también hay hilo (${arriba.tramos.length} tramos; el marco baja ${Math.round(marco.baja)} px)${errores.length ? ` (${errores[0]})` : ""}`);
  alBajar(arriba.tramos.every((t) => t.dibujado < 0.05), `arriba del marco el hilo todavía no se dibuja (${arriba.tramos.map((t) => t.dibujado.toFixed(2)).join(" ")})`);
  // La punta sigue al scroll del marco (no al de la ventana), y va a la altura de su vista.
  const puntas = [];
  const avance = [];
  for (const k of [0.25, 0.4, 0.55, 0.7]) {
    await bajarEn(k);
    const h = await hilos(pagina, R);
    avance.push(Math.round(dibujado(h)));
    for (const t of h.tramos.filter((x) => x.dibujado > 0.08 && x.dibujado < 0.92)) puntas.push((t.puntos[Math.round(t.dibujado * (t.puntos.length - 1))].y - marco.arriba) / marco.alto);
  }
  alBajar(avance.every((v, i) => i === 0 || v >= avance[i - 1] - 1) && avance.at(-1) > avance[0] + 200, `el hilo avanza con el scroll del marco (px dibujados: ${avance.join(", ")})`);
  alBajar(puntas.length >= 2 && puntas.every((y) => y > 0.15 && y < 0.95), `su punta va a la vista del marco (${puntas.map((y) => `${Math.round(y * 100)} %`).join(", ")})`);
  await bajarEn(1);
  await esperarFinal(pagina, R);
  const abajo = await hilos(pagina, R);
  const figura = abajo.tramos.find((t) => t.clase === "figura");
  revisar(abajo.tramos.every((t) => t.dibujado > 0.99) && Boolean(figura) && Math.abs(abajo.alto - marco.pagina) < 1, `al terminar de bajar el marco, el hilo está entero, con su figura, y mide lo mismo que la página (${abajo.alto} px)`);
  await asentar(pagina);
  await pagina.waitForTimeout(500);
  const p = await pisados(pagina, R);
  revisar(p.malos.length === 0 && p.puntos > 100, `y no pisa el contenido de esa página (${p.puntos} puntos contra ${p.cajas} cajas${p.malos.length ? `; ${p.malos.slice(0, 3).join("; ")}` : ""})`);
  await ctx.close();
}

// --- La página como una de La Mente: sin el estilo del kit, en su vista previa, con bloques que cambian de orden ---
if (parte("lamente")) {
  {
    // Sin el estilo del kit, el hilo toma el acento de La Mente (`--lm-acento`), no un naranjo fijo.
    const { ctx, pagina, errores } = await abrir({ hilo: "hebras" });
    await pagina.selectOption("[data-prueba=hilo-marco]", "lamente");
    await pagina.waitForTimeout(700);
    const h = await hilos(pagina);
    revisar(h.hay && h.color === "rgb(46, 125, 50)" && h.tramos.length > 3 && errores.length === 0, `sin el estilo del kit, el hilo es del acento de la página de La Mente (${h.color})${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  {
    // En la vista previa (achicada y sin scroll propio): entero y quieto, y en su lugar.
    const { ctx, pagina, errores } = await abrir({ hilo: "hebras", opciones: { viewport: { width: 1280, height: 900 } } });
    await pagina.selectOption("[data-prueba=hilo-marco]", "previa");
    await pagina.waitForTimeout(900);
    const h = await hilos(pagina);
    revisar(h.hay && !h.vivo && h.tramos.length > 3 && h.tramos.every((t) => t.dibujado > 0.99), `en la vista previa (achicada y sin scroll propio) el hilo va entero y quieto: con el scroll no se dibujaría nunca (${h.tramos.length} tramos)`);
    await asentar(pagina);
    await pagina.waitForTimeout(500);
    const p = await pisados(pagina);
    const escala = await pagina.evaluate(() => {
      const e = document.querySelector("[data-prueba=hilo-pagina]");
      return e.getBoundingClientRect().width / e.offsetWidth;
    });
    revisar(Math.abs(escala - 0.6) < 0.01 && p.malos.length === 0 && p.puntos > 200 && errores.length === 0, `y achicada al ${Math.round(escala * 100)} % el hilo sigue sin pisar el contenido (${p.puntos} puntos${p.malos.length ? `; ${p.malos.slice(0, 3).join("; ")}` : ""})`);
    await ctx.close();
  }
  {
    // Los bloques cambian de orden sin cambiar de tamaño (como al ordenarlos en el Estudio): el hilo se vuelve a trazar.
    const { ctx, pagina, errores } = await abrir({ hilo: "rulos" });
    const antes = (await hilos(pagina)).tramos.map((t) => t.d).join("|");
    await pagina.locator("[data-prueba=hilo-orden]").evaluate((b) => b.click());
    await pagina.waitForTimeout(900);
    const despues = await hilos(pagina);
    await asentar(pagina);
    await pagina.waitForTimeout(400);
    const p = await pisados(pagina);
    revisar(despues.tramos.map((t) => t.d).join("|") !== antes && p.malos.length === 0 && errores.length === 0, `si los bloques cambian de orden sin cambiar de tamaño, el hilo se vuelve a trazar y no pisa el contenido${p.malos.length ? ` (${p.malos.slice(0, 2).join("; ")})` : ""}`);
    await ctx.close();
  }
  {
    // Medir no hace correr las transiciones de nuevo: una tarjeta levantada no baja y sube cada vez que se mide.
    const { ctx, pagina } = await abrir({ hilo: "rulos" });
    const T = '[data-prueba=hilo-pagina] [data-franja="lista"] .hil-tarjeta:first-child';
    await pagina.waitForTimeout(800);
    const muestras = await pagina.evaluate(async (t) => {
      const el = document.querySelector(t);
      const vistos = new Set();
      document.querySelector("[data-prueba=hilo-crece]").click();
      const t0 = performance.now();
      while (performance.now() - t0 < 900) {
        vistos.add(getComputedStyle(el).translate);
        await new Promise((listo) => requestAnimationFrame(listo));
      }
      return [...vistos];
    }, T);
    revisar(muestras.length === 1 && muestras[0] === "0px -3px", `al volver a medir, una tarjeta levantada con transición no se mueve (${muestras.join(" → ")})`);
    // Y varios cambios seguidos se miden una sola vez, cuando se calman.
    const veces = await pagina.evaluate(async () => {
      const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos");
      // Cada vez que el hilo se vuelve a dibujar, sus caminos cambian juntos: llegan en un solo aviso.
      let n = 0;
      const mo = new MutationObserver(() => n++);
      mo.observe(svg, { subtree: true, attributes: true, attributeFilter: ["d"] });
      const b = document.querySelector("[data-prueba=hilo-crece]");
      for (let i = 0; i < 3; i++) {
        b.click();
        await new Promise((listo) => setTimeout(listo, 40));
      }
      await new Promise((listo) => setTimeout(listo, 900));
      mo.disconnect();
      return n;
    });
    revisar(veces === 1, `tres cambios seguidos se miden una sola vez, cuando se calman (el hilo se volvió a dibujar ${veces} ${veces === 1 ? "vez" : "veces"})`);
    await ctx.close();
  }
}

// --- El hilo de cada estilo: el mismo recorrido, otro material ---
if (parte("material")) {
  const ESPERADO = { neon: 2, retro: 2, rock: 2, anime: 2, pelicula: 3 };
  const { ctx, pagina, errores } = await abrir({ hilo: "rulos" });
  const vistos = {};
  for (const estilo of Object.keys(ESPERADO)) {
    await pagina.selectOption("[data-prueba=hilo-estilo]", estilo);
    await pagina.waitForTimeout(700);
    vistos[estilo] = await pagina.evaluate(() => {
      const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos");
      const g = svg.querySelector("[data-capas]");
      // Las capas que se ven (la del recorrido va sin trazo).
      const capas = g ? [...g.querySelectorAll("path:not([data-tramo])")] : [];
      return {
        material: svg.dataset.material,
        capas: capas.length,
        // Todas las capas de un tramo se dibujan juntas: el mismo tramo del scroll.
        juntas: capas.every((c) => c.style.getPropertyValue("--mk-h-d") === capas[0].style.getPropertyValue("--mk-h-d")),
        grosores: capas.map((c) => getComputedStyle(c).strokeWidth),
        tramos: svg.querySelectorAll("path[data-tramo]").length,
      };
    });
  }
  const bien = Object.entries(ESPERADO).every(([e, n]) => vistos[e].material !== "linea" && vistos[e].capas === n && vistos[e].juntas);
  const distintos = new Set(Object.values(vistos).map((v) => `${v.material}/${v.grosores.join(",")}`)).size;
  revisar(bien && distintos === 5 && errores.length === 0, `cada estilo dibuja el hilo con su material: ${Object.entries(vistos).map(([e, v]) => `${e} ${v.material} (${v.capas} capas)`).join("; ")}${errores.length ? ` (${errores[0]})` : ""}`);
  // Las capas se dibujan al bajar igual que el hilo: a media bajada van a medio camino, todas juntas.
  await pagina.selectOption("[data-prueba=hilo-estilo]", "retro");
  await pagina.waitForTimeout(600);
  await bajar(pagina, 0.45);
  const medio = await pagina.evaluate(() => {
    const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos");
    return [...svg.querySelectorAll("[data-capas]")].map((g) => [...g.querySelectorAll("path:not([data-tramo])")].map((c) => Number(parseFloat(getComputedStyle(c).strokeDashoffset).toFixed(3))));
  });
  const aMedias = medio.filter((g) => g.some((v) => v > 0.02 && v < 0.98));
  alBajarGlobal(aMedias.length >= 1 && aMedias.every((g) => g.every((v) => Math.abs(v - g[0]) < 0.001)), `las capas del material se dibujan juntas al bajar (${JSON.stringify(aMedias.slice(0, 2))})`);
  // Sin el estilo del kit (La Mente), una sola línea.
  await pagina.selectOption("[data-prueba=hilo-marco]", "lamente");
  await pagina.waitForTimeout(700);
  const lamente = await pagina.evaluate(() => {
    const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos");
    return { material: svg.dataset.material, capas: svg.querySelectorAll("[data-capas]").length };
  });
  revisar(lamente.material === "linea" && lamente.capas === 0, `sin el estilo del kit el hilo es una línea, como siempre (${JSON.stringify(lamente)})`);
  // Y sigue sin pisar el contenido, en cada estilo (se mira el borde de cada capa), con los bloques en su lugar.
  await pagina.selectOption("[data-prueba=hilo-marco]", "kit");
  await asentar(pagina);
  const malos = [];
  for (const estilo of Object.keys(ESPERADO)) {
    await pagina.selectOption("[data-prueba=hilo-estilo]", estilo);
    await pagina.waitForTimeout(600);
    const p = await pisados(pagina);
    malos.push(...p.malos.map((m) => `${estilo}: ${m}`));
  }
  revisar(malos.length === 0, `en ningún estilo el hilo pisa el contenido${malos.length ? ` (${malos.slice(0, 3).join("; ")})` : ""}`);
  await ctx.close();
}

// --- Rastro: huellas que aparecen por el recorrido ---
if (parte("rastro")) {
  /** Las huellas: su forma, dónde están en la pantalla, su radio y cuánto se ven. */
  const huellas = (pagina) =>
    pagina.evaluate(() => {
      const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos");
      if (!svg) return null;
      const c = svg.getBoundingClientRect();
      const k = c.width / (Number(svg.getAttribute("width")) || 1);
      const todas = [...svg.querySelectorAll("[data-huella]")].map((g) => ({
        x: c.left + Number(g.dataset.x) * k,
        y: c.top + Number(g.dataset.y) * k,
        radio: Number(g.dataset.radio) * k,
        opacidad: Number(getComputedStyle(g.querySelector("path")).opacity),
      }));
      return { forma: svg.dataset.forma, vivo: svg.hasAttribute("data-vivo"), lineas: svg.querySelectorAll("path[data-tramo]").length, todas };
    });
  {
    const { ctx, pagina, errores, alBajar } = await abrir({ hilo: "rastro" });
    await pagina.selectOption("[data-prueba=hilo-figura]", "huella");
    await pagina.waitForTimeout(700);
    const arriba = await huellas(pagina);
    revisar(Boolean(arriba) && arriba.forma === "patita" && arriba.todas.length > 40 && arriba.lineas === 0 && errores.length === 0, `con «rastro» hay huellas y no línea: ${arriba?.todas.length} ${arriba?.forma}s (la figura «huella» da patitas)${errores.length ? ` (${errores[0]})` : ""}`);
    alBajar(arriba.todas.every((h) => h.opacidad < 0.05), "arriba de todo, las huellas todavía no aparecen");
    // Al bajar, aparecen una tras otra, en orden, y a la vista.
    const vistas = [];
    let enOrden = true;
    for (const k of ALTURAS) {
      await bajar(pagina, k);
      const h = await huellas(pagina);
      const visibles = h.todas.filter((x) => x.opacidad > 0.5);
      vistas.push(visibles.filter((x) => x.y >= 0 && x.y <= 844).length);
      // Las que ya aparecieron son las primeras del recorrido: ninguna aparece antes que una anterior.
      const ultima = h.todas.findLastIndex((x) => x.opacidad > 0.5);
      if (h.todas.slice(0, Math.max(0, ultima - 2)).some((x) => x.opacidad < 0.5)) enOrden = false;
    }
    alBajar(vistas.every((n) => n >= 3) && enOrden, `al bajar, las huellas aparecen una tras otra, en orden y a la vista (a la vista en diez alturas: ${vistas.join(", ")})`);
    // Otra figura, otra huella.
    await pagina.selectOption("[data-prueba=hilo-figura]", "taza");
    await pagina.waitForTimeout(700);
    revisar((await huellas(pagina)).forma === "grano", "con la figura «taza» las huellas son granos de café");
    // Ninguna pisa el contenido.
    await asentar(pagina);
    await pagina.waitForTimeout(500);
    const malas = await pagina.evaluate(() => {
      const cajas = window.__contenido();
      const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos");
      const c = svg.getBoundingClientRect();
      const k = c.width / Number(svg.getAttribute("width"));
      const lejos = (x, y, b) => Math.hypot(Math.max(b.izq - x, 0, x - b.der), Math.max(b.arriba - y, 0, y - b.abajo));
      return [...svg.querySelectorAll("[data-huella]")].flatMap((g) => {
        const [x, y, r] = [c.left + Number(g.dataset.x) * k, c.top + Number(g.dataset.y) * k, Number(g.dataset.radio) * k];
        const b = cajas.find((b) => lejos(x, y, b) < r - 0.5);
        return b ? [`(${Math.round(x)}, ${Math.round(y)}) sobre «${b.que}»`] : [];
      });
    });
    revisar(malas.length === 0, `ninguna huella pisa el contenido${malas.length ? ` (${malas.slice(0, 3).join("; ")})` : ""}`);
    await ctx.close();
  }
  for (const [que, opciones, respaldo] of [["con movimiento reducido", { reducedMotion: "reduce" }, false], ["sin scroll nativo", {}, true]]) {
    const { ctx, pagina, errores } = await abrir({ hilo: "rastro", opciones: { viewport: { width: 390, height: 844 }, ...opciones } });
    if (respaldo) await pagina.locator("[data-prueba=hilo-respaldo]").check();
    await pagina.selectOption("[data-prueba=hilo-tipo]", "rulos");
    await pagina.waitForTimeout(300);
    await pagina.selectOption("[data-prueba=hilo-tipo]", "rastro");
    await pagina.waitForTimeout(800);
    const h = await huellas(pagina);
    revisar(Boolean(h) && !h.vivo && h.todas.length > 40 && h.todas.every((x) => x.opacidad > 0.8) && errores.length === 0, `${que} las huellas están todas, quietas (${h?.todas.length})`);
    await ctx.close();
  }
}

// --- Enredadera: un tallo con hojas que brotan al bajar, se mecen con el viento del scroll y una flor al final ---
if (parte("enredadera")) {
  /**
   * Las hojas y la flor: dónde está la base de cada hoja (según su dibujo, con lo que la mece incluido), su contorno en
   * la pantalla, cuánto se ve y cuánto se mece; y de la flor, sus pétalos.
   */
  const planta = (pagina) =>
    pagina.evaluate(() => {
      const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos");
      if (!svg) return null;
      const c = svg.getBoundingClientRect();
      const k = c.width / (Number(svg.getAttribute("width")) || 1);
      const hojas = [...svg.querySelectorAll("[data-hoja]")].map((g) => {
        const path = g.querySelector("path");
        const m = path.getScreenCTM();
        const base = new DOMPoint(0, 0).matrixTransform(m);
        const largo = path.getTotalLength();
        const contorno = Array.from({ length: 13 }, (_, i) => {
          const q = path.getPointAtLength((largo * i) / 12);
          const e = new DOMPoint(q.x, q.y).matrixTransform(m);
          return { x: e.x, y: e.y };
        });
        const rot = getComputedStyle(g.querySelector("[data-mece]")).rotate;
        return {
          x: c.left + Number(g.dataset.x) * k, y: c.top + Number(g.dataset.y) * k, base: { x: base.x, y: base.y }, contorno,
          opacidad: Number(getComputedStyle(path).opacity), giro: rot === "none" ? 0 : parseFloat(rot), tiempo: g.hasAttribute("data-tiempo"),
        };
      });
      const flor = svg.querySelector("[data-flor]");
      const petalos = flor ? [...flor.querySelectorAll("[data-petalo]")].map((q) => { const r = q.getBoundingClientRect(); return { opacidad: Number(getComputedStyle(q).opacity), ancho: r.width, x: r.left + r.width / 2, y: r.top + r.height / 2 }; }) : [];
      return {
        vivo: svg.hasAttribute("data-vivo"), final: svg.hasAttribute("data-final"), viento: svg.querySelector("[data-hojas]")?.style.getPropertyValue("--mk-viento") ?? "",
        tramos: [...svg.querySelectorAll("path[data-tramo]")].map((t) => t.dataset.clase), hojas, petalos,
        flor: flor ? (() => { const r = flor.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, ancho: r.width }; })() : null,
      };
    });
  {
    const { ctx, pagina, errores, alBajar, nativo } = await abrir({ hilo: "enredadera" });
    await pagina.waitForTimeout(500);
    const arriba = await planta(pagina);
    revisar(Boolean(arriba) && arriba.hojas.length > 40 && arriba.tramos.length > 3 && arriba.tramos.every((t) => t === "tronco") && arriba.petalos.length >= 5 && errores.length === 0, `con «enredadera» hay un tallo (sin hebras), ${arriba?.hojas.length} hojas y una flor de ${arriba?.petalos.length} pétalos${errores.length ? ` (${errores[0]})` : ""}`);
    // Cada hoja nace en el tallo: su base (la de su dibujo) es el punto que dice el trazado.
    const lejosBase = Math.max(...arriba.hojas.map((h) => Math.hypot(h.base.x - h.x, h.base.y - h.y)));
    revisar(lejosBase < 0.6, `cada hoja nace en su punto del tallo (a lo más ${lejosBase.toFixed(2)} px)`);
    alBajar(arriba.hojas.filter((h) => h.y > 844 * 1.6).every((h) => h.opacidad < 0.05) && arriba.petalos.every((q) => q.opacidad < 0.05), "arriba de todo, las hojas de más abajo y la flor todavía no están");
    // Al bajar, brotan en orden y a la vista.
    const vistas = [];
    let enOrden = true;
    for (const k of ALTURAS) {
      await bajar(pagina, k);
      const h = await planta(pagina);
      const alScroll = h.hojas.filter((x) => !x.tiempo);
      vistas.push(alScroll.filter((x) => x.opacidad > 0.5 && x.y >= 0 && x.y <= 844).length);
      const ultima = alScroll.findLastIndex((x) => x.opacidad > 0.5);
      if (alScroll.slice(0, Math.max(0, ultima - 2)).some((x) => x.opacidad < 0.5)) enOrden = false;
    }
    alBajar(vistas.filter((n) => n >= 3).length >= 7 && enOrden, `al bajar, las hojas brotan una tras otra, en orden y a la vista (a la vista en diez alturas: ${vistas.join(", ")})`);
    // El viento: bajando rápido las hojas se inclinan, cada una a su lado, sin despegarse del tallo; al parar se calman.
    await bajar(pagina, 0.35);
    await pagina.waitForTimeout(400);
    const viento = () => {
      const g = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos [data-hojas]");
      return g ? parseFloat(g.style.getPropertyValue("--mk-viento")) || 0 : 0;
    };
    const rafaga = await pagina.evaluate(async (leer) => {
      const viento = new Function(`return (${leer})()`);
      let maximo = 0;
      for (let i = 0; i < 18; i++) {
        window.scrollBy(0, 70);
        await new Promise((r) => requestAnimationFrame(r));
        maximo = Math.max(maximo, Math.abs(viento()));
      }
      return maximo;
    }, viento.toString());
    const enRafaga = await planta(pagina);
    // Al soltar, cada cuadro: se pasa un poco hacia afuera y vuelve, sin quedar cortado en el tope del rebote.
    const rebote = await pagina.evaluate(async (leer) => {
      const viento = new Function(`return (${leer})()`);
      let minimo = 0;
      for (let i = 0; i < 90; i++) {
        await new Promise((r) => requestAnimationFrame(r));
        minimo = Math.min(minimo, viento());
      }
      return minimo;
    }, viento.toString());
    alBajar(rebote < -0.2 && rebote > -1.99, `al soltar, las hojas rebotan un poco hacia afuera y vuelven (hasta ${rebote.toFixed(2)}°, sin quedar cortadas en el tope de 2°)`);
    const inclinadas = enRafaga.hojas.filter((h) => Math.abs(h.giro) > 1);
    const lados = new Set(inclinadas.map((h) => Math.sign(h.giro)));
    const pegadas = Math.max(...enRafaga.hojas.map((h) => Math.hypot(h.base.x - h.x, h.base.y - h.y)));
    await pagina.waitForTimeout(2200);
    const calma = await planta(pagina);
    // La punta se mueve (la hoja gira de verdad) y la base no (gira desde ahí): es la hoja la que se mece, no su lugar.
    const puntas = enRafaga.hojas.map((h, i) => Math.hypot(h.contorno[6].x - calma.hojas[i].contorno[6].x, h.contorno[6].y - calma.hojas[i].contorno[6].y));
    alBajar(rafaga > 4 && inclinadas.length > 10 && lados.size === 2 && pegadas < 0.6 && Math.max(...puntas) > 1, `bajando rápido, las hojas se mecen (viento de ${rafaga.toFixed(1)}°, ${inclinadas.length} inclinadas, a uno y otro lado; la punta se corre hasta ${Math.max(...puntas).toFixed(1)} px) sin despegarse del tallo (${pegadas.toFixed(2)} px)`);
    revisar(calma.viento === "" && calma.hojas.every((h) => Math.abs(h.giro) < 0.01), `al parar, las hojas vuelven a su lugar y el viento se apaga${calma.viento ? ` (queda ${calma.viento})` : ""}`);
    // El final (en una página recién abierta, que llega de una al final): la flor se abre cuando el remate se ve,
    // después de que llega el tallo, y brotan las hojas de su tallo.
    // Si ya se vio el final de «figura» y se cambia a «enredadera», el final suyo parte de cero: la flor se abre, no
    // aparece abierta.
    {
      const { ctx: c4, pagina: p4, alBajar: alBajar4 } = await abrir({ hilo: "figura" });
      await bajar(p4, 1);
      await p4.waitForTimeout(2500);
      await p4.selectOption("[data-prueba=hilo-tipo]", "enredadera");
      await p4.waitForSelector(`${P} svg.mk-hilos [data-flor]`);
      await p4.waitForTimeout(120);
      const recien = await planta(p4);
      await p4.waitForTimeout(2600);
      const luego = await planta(p4);
      alBajar4(recien.petalos.every((q) => q.opacidad < 0.5) && luego.final && luego.petalos.every((q) => q.opacidad > 0.8), "después de ver el final de «figura», al cambiar a «enredadera» la flor se abre (no aparece abierta)");
      await c4.close();
    }
    const { ctx: ctx2, pagina: p2, alBajar: alBajar2 } = await abrir({ hilo: "enredadera" });
    await bajar(p2, 1);
    await p2.waitForTimeout(150);
    const recien = await planta(p2);
    await p2.waitForTimeout(2600);
    const fin = await planta(p2);
    await ctx2.close();
    const finales = fin.hojas.filter((h) => h.tiempo);
    alBajar2(recien.final && recien.petalos.every((q) => q.opacidad < 0.5) && fin.petalos.every((q) => q.opacidad > 0.8) && finales.length >= 1 && finales.every((h) => h.opacidad > 0.8), `al llegar al final la flor se abre con tiempo (recién: cerrada; después: abierta, de ${Math.round(fin.flor?.ancho ?? 0)} px) y brotan las ${finales.length} hojas de su tallo` + ``);
    // Si lo último del tallo se dibuja tarde (aquí, a propósito, en el último 1 % del scroll), la flor espera a que
    // termine aunque el remate ya se vea.
    {
      const { ctx: c3, pagina: p3, alBajar: alBajar3 } = await abrir({ hilo: "enredadera" });
      await p3.evaluate(() => {
        const ultimo = [...document.querySelectorAll("[data-prueba=hilo-pagina] svg.mk-hilos path[data-tramo]:not([data-tiempo])")].pop();
        for (const q of ultimo.closest("[data-capas]")?.querySelectorAll("path") ?? [ultimo]) {
          q.style.setProperty("--mk-h-d", "99%");
          q.style.setProperty("--mk-h-h", "100%");
        }
      });
      const casi = await p3.evaluate(() => {
        const r = document.querySelector("[data-prueba=hilo-pagina] .mk-hilos-remate").getBoundingClientRect();
        const e = document.scrollingElement;
        e.scrollTo(0, scrollY + r.bottom - innerHeight + 4);
        return (100 * e.scrollTop) / (e.scrollHeight - e.clientHeight);
      });
      await p3.waitForTimeout(700);
      const antes = await planta(p3);
      await bajar(p3, 1);
      await p3.waitForTimeout(400);
      const despues = await planta(p3);
      alBajar3(casi < 99 && !antes.final && despues.final, `con el remate a la vista pero el tallo sin terminar (scroll en ${casi.toFixed(1)} %), la flor espera; al terminar de bajar, se abre`);
      await c3.close();
    }
    revisar(Boolean(fin.flor) && fin.flor.y > 0 && fin.flor.y < 844 && fin.flor.ancho >= 40, `la flor queda entera a la vista al terminar de bajar (centro en y = ${Math.round(fin.flor?.y ?? -1)})`);
    // Cada pétalo en su lugar, alrededor del centro (no todos encima del primero).
    const angulos = (fin.petalos ?? []).map((q) => Math.atan2(q.y - fin.flor.y, q.x - fin.flor.x));
    const separados = angulos.every((a, i) => angulos.every((b, j) => i === j || Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) > 0.6));
    revisar(angulos.length >= 5 && separados, `los ${angulos.length} pétalos quedan repartidos alrededor del centro`);
    // Ni el tallo ni las hojas pisan el contenido.
    await asentar(pagina);
    await pagina.waitForTimeout(500);
    const tallo = await pisados(pagina);
    const malas = await pagina.evaluate(() => {
      const cajas = window.__contenido();
      const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos");
      return [...svg.querySelectorAll("[data-hoja] path")].flatMap((path) => {
        const m = path.getScreenCTM();
        const largo = path.getTotalLength();
        for (let i = 0; i <= 12; i++) {
          const q = path.getPointAtLength((largo * i) / 12);
          const e = new DOMPoint(q.x, q.y).matrixTransform(m);
          const b = cajas.find((c) => e.x > c.izq + 0.5 && e.x < c.der - 0.5 && e.y > c.arriba + 0.5 && e.y < c.abajo - 0.5);
          if (b) return [`(${Math.round(e.x)}, ${Math.round(e.y)}) sobre «${b.que}»`];
        }
        return [];
      });
    });
    revisar(tallo.malos.length === 0 && malas.length === 0, `ni el tallo ni las hojas pisan el contenido${[...tallo.malos, ...malas].length ? ` (${[...tallo.malos, ...malas].slice(0, 3).join("; ")})` : ""}`);
    void nativo;
    await ctx.close();
  }
  // Una página donde quien hace scroll es el `body` (`html` con `overflow: hidden`): el hilo igual se dibuja al bajar y
  // las hojas se mecen.
  {
    const { ctx, pagina, errores, alBajar } = await abrir({ hilo: "enredadera" });
    await pagina.addStyleTag({ content: "html{overflow:hidden;height:100%}body{overflow:auto;height:100%;margin:0}" });
    await pagina.selectOption("[data-prueba=hilo-tipo]", "rulos");
    await pagina.waitForTimeout(300);
    await pagina.selectOption("[data-prueba=hilo-tipo]", "enredadera");
    await pagina.waitForTimeout(900);
    const r = await pagina.evaluate(async () => {
      const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-hilos");
      const g = svg.querySelector("[data-hojas]");
      document.body.scrollTo(0, 1200);
      await new Promise((x) => setTimeout(x, 300));
      let maximo = 0;
      for (let i = 0; i < 18; i++) {
        document.body.scrollBy(0, 70);
        await new Promise((x) => requestAnimationFrame(x));
        maximo = Math.max(maximo, Math.abs(parseFloat(g.style.getPropertyValue("--mk-viento")) || 0));
      }
      return { vivo: svg.hasAttribute("data-vivo"), maximo, baja: document.body.scrollTop > 1200 };
    });
    alBajar(r.baja && r.vivo && r.maximo > 4 && errores.length === 0, `con el scroll en el \`body\` el hilo se dibuja al bajar y las hojas se mecen (vivo: ${r.vivo}, viento de ${r.maximo.toFixed(1)}°)`);
    await ctx.close();
  }
  // Con movimiento reducido: solo la flor, abierta y quieta; sin viento. Sin scroll nativo: todo entero y quieto.
  for (const [que, opciones, respaldo] of [["con movimiento reducido", { reducedMotion: "reduce" }, false], ["sin scroll nativo", {}, true]]) {
    const { ctx, pagina, errores } = await abrir({ hilo: "enredadera", opciones: { viewport: { width: 390, height: 844 }, ...opciones } });
    if (respaldo) await pagina.locator("[data-prueba=hilo-respaldo]").check();
    await pagina.selectOption("[data-prueba=hilo-tipo]", "rulos");
    await pagina.waitForTimeout(300);
    await pagina.selectOption("[data-prueba=hilo-tipo]", "enredadera");
    await pagina.waitForTimeout(800);
    await pagina.evaluate(async () => {
      for (let i = 0; i < 10; i++) {
        window.scrollBy(0, 80);
        await new Promise((r) => requestAnimationFrame(r));
      }
    });
    const h = await planta(pagina);
    const flor = h?.petalos.length >= 5 && h.petalos.every((q) => q.opacidad > 0.8);
    if (respaldo) revisar(Boolean(h) && !h.vivo && h.hojas.length > 40 && h.hojas.every((x) => x.opacidad > 0.8 && x.giro === 0) && h.tramos.length > 3 && flor && h.viento === "" && errores.length === 0, `${que} el tallo, las ${h?.hojas.length} hojas y la flor están enteros y quietos, sin viento`);
    else revisar(Boolean(h) && !h.vivo && h.hojas.length === 0 && h.tramos.length === 0 && flor && h.viento === "" && errores.length === 0, `${que} queda solo la flor, abierta y quieta`);
    await ctx.close();
  }
}

// --- Ramas: sobre el fondo de los bloques y bajo su contenido; unas chocan con el contenido (con su chispa) y otras se
// juntan con el tronco al fondo ---
if (parte("ramas")) {
  /** Baja hasta esa parte del scroll (0 a 100), la que mueve las animaciones de las ramas. */
  const alScroll = async (pagina, p) => {
    await pagina.evaluate((q) => {
      const e = document.scrollingElement;
      e.scrollTo(0, ((e.scrollHeight - e.clientHeight) * q) / 100);
      return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, p);
    await pagina.waitForTimeout(80);
  };
  /** El tronco y las ramas: cuánto va dibujado cada uno, dónde termina cada rama y sus chispas (en la pantalla). */
  const ramas = (pagina) =>
    pagina.evaluate(() => {
      const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-ramas");
      if (!svg) return null;
      const c = svg.getBoundingClientRect();
      const k = c.width / (Number(svg.getAttribute("width")) || 1);
      const trazo = (p) => {
        const largo = p.getTotalLength();
        const z = p.getPointAtLength(largo);
        return { clase: p.dataset.clase ?? "tronco", dibujado: 1 - Math.min(1, Math.max(0, parseFloat(getComputedStyle(p).strokeDashoffset) || 0)), fin: { x: c.left + z.x * k, y: c.top + z.y * k }, grosor: parseFloat(getComputedStyle(p).strokeWidth), opacidad: Number(getComputedStyle(p).opacity), color: getComputedStyle(p).stroke };
      };
      // El tronco va en tramos: cuánto va dibujado (por su largo) y dónde termina el último.
      const partes = [...svg.querySelectorAll("path[data-rama=tronco]")].map((t) => ({ ...trazo(t), largo: t.getTotalLength() }));
      const largoTotal = partes.reduce((s, t) => s + t.largo, 0);
      const tronco = { ...partes[partes.length - 1], dibujado: partes.reduce((s, t) => s + t.dibujado * t.largo, 0) / (largoTotal || 1), tramos: partes.length };
      const todas = [...svg.querySelectorAll("path[data-rama=rama]")].map(trazo);
      const huecos = [...svg.querySelectorAll("[data-hueco]")].map((h) => ({ izq: c.left + Number(h.getAttribute("x")) * k, arriba: c.top + Number(h.getAttribute("y")) * k, der: c.left + (Number(h.getAttribute("x")) + Number(h.getAttribute("width"))) * k, abajo: c.top + (Number(h.getAttribute("y")) + Number(h.getAttribute("height"))) * k }));
      const chispas = [...svg.querySelectorAll("[data-chispa]")].map((g) => ({ x: c.left + Number(g.dataset.x) * k, y: c.top + Number(g.dataset.y) * k, opacidad: Number(getComputedStyle(g.firstElementChild).opacity), desde: parseFloat(g.style.getPropertyValue("--mk-r-d")) }));
      const pagina = document.querySelector("[data-prueba=hilo-pagina]").getBoundingClientRect();
      return { vivo: svg.hasAttribute("data-vivo"), z: getComputedStyle(svg).zIndex, alto: Number(svg.getAttribute("height")), altoPagina: pagina.height, tronco, ramas: todas, chispas, huecos, mascara: Boolean(svg.querySelector("mask")) && Boolean(svg.querySelector("g[mask] path[data-rama=tronco]")) };
    });
  const { nativo } = await (async () => {
    const { ctx, nativo } = await abrir({});
    await ctx.close();
    return { nativo };
  })();
  if (!nativo) {
    // Sin animaciones atadas al scroll la página va «sin scroll nativo»: como el Hilo, no hay ramas.
    const { ctx, pagina, errores } = await abrir({ hilo: "ramas" });
    await pagina.waitForTimeout(600);
    const hay = await pagina.evaluate(() => document.querySelectorAll("[data-prueba=hilo-pagina] .mk-ramas").length);
    revisar(hay === 0 && errores.length === 0, "sin animaciones atadas al scroll, como el Hilo, no hay ramas");
    await ctx.close();
  } else {
    const { ctx, pagina, errores, alBajar } = await abrir({ hilo: "ramas" });
    await pagina.locator("[data-prueba=hilo-separadas]").check();
    await pagina.waitForTimeout(600);
    const r = await ramas(pagina);
    const clases = new Set(r?.ramas.map((x) => x.clase));
    revisar(Boolean(r) && r.z === "1" && r.mascara && r.ramas.length >= 4 && r.ramas.length <= 9 && clases.has("choca") && clases.has("junta") && r.chispas.length === r.ramas.filter((x) => x.clase === "choca").length && errores.length === 0, `con «ramas» hay un tronco sobre el fondo de los bloques (con su máscara) y ${r?.ramas.length} ramas de las dos clases (${[...clases].join(" y ")}), con su chispa cada una que choca${errores.length ? ` (${errores[0]})` : ""}`);
    // Profundidad y tonos: grosores distintos, las delgadas más tenues, y más de un color.
    const orden = [...r.ramas].sort((a, b) => a.grosor - b.grosor);
    revisar(orden[orden.length - 1].grosor - orden[0].grosor >= 1 && orden.slice(1).every((x, i) => x.opacidad >= orden[i].opacidad) && new Set(r.ramas.map((x) => x.color)).size >= 3, `cada rama con su grosor (de ${orden[0].grosor.toFixed(1)} a ${orden[orden.length - 1].grosor.toFixed(1)} px; las delgadas, más tenues) y su tono (${new Set(r.ramas.map((x) => x.color)).size} distintos)`);
    // Las que chocan terminan en el borde de un bloque con fondo (o de la página), justo donde está su chispa. Los
    // bloques, en su lugar (sin la entrada de su relato, que con el scroll los corre).
    await asentar(pagina);
    await pagina.waitForTimeout(300);
    // El contenido, y las franjas con foto de fondo (enteras: sobre una foto tampoco se dibuja).
    const contenido = await pagina.evaluate(() => [
      ...window.__contenido(),
      ...[...document.querySelectorAll("[data-prueba=hilo-pagina] .hil-con-fondo")].map((f) => { const c = f.getBoundingClientRect(); return { izq: c.left, arriba: c.top, der: c.right, abajo: c.bottom, que: "foto de fondo" }; }),
    ]);
    const pag = await pagina.evaluate(() => { const c = document.querySelector("[data-prueba=hilo-pagina]").getBoundingClientRect(); return { izq: c.left, der: c.right }; });
    /** A cuánto queda un punto de una caja (0 si está adentro). */
    const lejos = (p, b) => Math.hypot(Math.max(b.izq - p.x, 0, p.x - b.der), Math.max(b.arriba - p.y, 0, p.y - b.abajo));
    // Choca a 12 px del contenido (la chispa no lo alcanza a pisar) o en el borde de la página.
    const enBorde = (p) => Math.abs(p.x - pag.izq) < 1 || Math.abs(p.x - pag.der) < 1 || (contenido.every((b) => lejos(p, b) >= 10) && contenido.some((b) => lejos(p, b) <= 14));
    // Todo medido en el mismo momento (son posiciones en la pantalla).
    const ya = await ramas(pagina);
    const chocan = ya.ramas.filter((x) => x.clase === "choca");
    const juntas = chocan.every((x, i) => Math.hypot(x.fin.x - ya.chispas[i].x, x.fin.y - ya.chispas[i].y) < 1);
    revisar(juntas && chocan.every((x) => enBorde(x.fin)) && chocan.some((x) => Math.abs(x.fin.x - pag.izq) > 1 && Math.abs(x.fin.x - pag.der) > 1), `las que chocan terminan justo antes del contenido (o en el borde de la página), donde está su chispa`);
    // Cada texto, foto, botón y tarjeta tiene su hueco en la máscara: ahí las ramas no se ven.
    const sinHueco = contenido.filter((b) => !ya.huecos.some((h) => h.izq <= b.izq + 1 && h.der >= b.der - 1 && h.arriba <= b.arriba + 1 && h.abajo >= b.abajo - 1));
    revisar(ya.huecos.length > 10 && sinHueco.length === 0, `las ramas no se ven sobre el contenido: cada uno de los ${contenido.length} elementos tiene su hueco${sinHueco.length ? ` (faltan: ${sinHueco.slice(0, 3).map((b) => b.que).join(", ")})` : ""}`);
    // Las que se juntan terminan donde termina el tronco.
    const juntan = ya.ramas.filter((x) => x.clase === "junta");
    revisar(juntan.every((x) => Math.hypot(x.fin.x - ya.tronco.fin.x, x.fin.y - ya.tronco.fin.y) < 1), "las que se juntan terminan en el tronco, al fondo");
    // Al bajar se dibujan: arriba casi nada, después más y más.
    await alScroll(pagina, 0);
    const arriba = await ramas(pagina);
    const vistos = [];
    for (const p of [20, 40, 60, 80, 100]) {
      await alScroll(pagina, p);
      vistos.push((await ramas(pagina)).tronco.dibujado);
    }
    // Al cargar va dibujado solo lo que ya se ve (sobre el 60 % de la pantalla); después, cada vez más.
    alBajar(arriba.tronco.dibujado < 0.2 && vistos.every((v, i) => (i === 0 ? v > arriba.tronco.dibujado : v > vistos[i - 1])) && vistos[vistos.length - 1] > 0.99, `al bajar se dibujan el tronco y las ramas (el tronco: ${arriba.tronco.dibujado.toFixed(2)} al cargar; después ${vistos.map((v) => v.toFixed(2)).join(", ")})`);
    // La chispa aparece recién cuando su rama llega, y se apaga.
    const c0 = r.chispas[0];
    await alScroll(pagina, Math.max(0, c0.desde - 3));
    const antes = await ramas(pagina);
    await alScroll(pagina, c0.desde + 0.9);
    const durante = await ramas(pagina);
    await alScroll(pagina, Math.min(100, c0.desde + 8));
    const despues = await ramas(pagina);
    alBajar(antes.chispas[0].opacidad < 0.1 && antes.ramas.find((x) => x.clase === "choca").dibujado < 0.98 && durante.chispas[0].opacidad > 0.5 && durante.ramas.find((x) => x.clase === "choca").dibujado > 0.98 && despues.chispas[0].opacidad < 0.1, `la chispa aparece cuando su rama llega a chocar, y se apaga (${antes.chispas[0].opacidad.toFixed(2)} → ${durante.chispas[0].opacidad.toFixed(2)} → ${despues.chispas[0].opacidad.toFixed(2)})`);
    // Si la página crece, el tronco vuelve a llegar al fondo.
    await pagina.click("[data-prueba=hilo-crece]");
    await pagina.waitForTimeout(500);
    const crecida = await ramas(pagina);
    revisar(Math.abs(crecida.alto - crecida.altoPagina) < 1 && crecida.alto > r.alto, `si la página crece, las ramas se vuelven a trazar hasta el nuevo fondo (${r.alto} → ${crecida.alto} px)`);
    await ctx.close();
  }
  // En #pagina, en pantalla ancha: el encabezado marca sus partes, y la que envuelve a las demás («contenido») no es
  // contenido entero: las ramas se ven en su espacio libre (solo se cortan en el texto, los botones y las fotos).
  if (nativo) {
    const { ctx, pagina, errores } = await abrir({ ruta: "#pagina", raiz: ".pag-vista .mk-pagina", opciones: { viewport: { width: 1400, height: 900 } } });
    await pagina.selectOption("[data-prueba=relato-pagina]", "ramas");
    await pagina.waitForSelector(".pag-vista .mk-ramas [data-hueco]", { timeout: 4000 }).catch(() => {});
    await pagina.waitForTimeout(600);
    const r = await pagina.evaluate(() => {
      const pag = document.querySelector(".pag-vista .mk-pagina");
      const svg = pag.querySelector("svg.mk-ramas");
      const caja = pag.querySelector('.mk-enc [data-mk-parte="contenido"]');
      if (!svg || !caja) return null;
      const c = svg.getBoundingClientRect();
      const k = c.width / Number(svg.getAttribute("width"));
      const e = caja.getBoundingClientRect();
      const envuelve = [...svg.querySelectorAll("[data-hueco]")].some((h) => {
        const [x, y, w, a] = ["x", "y", "width", "height"].map((n) => Number(h.getAttribute(n)) * k);
        return c.left + x <= e.left + 2 && c.top + y <= e.top + 2 && c.left + x + w >= e.right - 2 && c.top + y + a >= e.bottom - 2;
      });
      return { envuelve, huecos: svg.querySelectorAll("[data-hueco]").length };
    });
    revisar(Boolean(r) && !r.envuelve && r.huecos > 5 && errores.length === 0, `en el encabezado, la parte que envuelve a las otras no tapa las ramas (solo se cortan en lo que lleva adentro)${r ? "" : " (no se encontró)"}`);
    await ctx.close();
  }
  // Lo que la revisión pidió probar con el contenido real (sin `asentar` donde no hace falta).
  if (nativo) {
    /** Si una caja de la pantalla queda dentro de algún hueco de la máscara. */
    const tapada = (pagina, raiz, sel) =>
      pagina.evaluate(([raiz, sel]) => {
        const svg = document.querySelector(`${raiz} svg.mk-ramas`);
        const e = document.querySelector(sel);
        if (!svg || !e) return null;
        const c = svg.getBoundingClientRect();
        const k = c.width / Number(svg.getAttribute("width"));
        const r = e.getBoundingClientRect();
        return [...svg.querySelectorAll("[data-hueco]")].some((h) => {
          const [x, y, w, a] = ["x", "y", "width", "height"].map((n) => Number(h.getAttribute(n)) * k);
          return c.left + x <= r.left + 1 && c.top + y <= r.top + 1 && c.left + x + w >= r.right - 1 && c.top + y + a >= r.bottom - 1;
        });
      }, [raiz, sel]);
    // Un chip con borde (sin marca) y un ícono decorativo (`aria-hidden`) tienen su hueco.
    {
      const { ctx, pagina } = await abrir({ hilo: "ramas" });
      await pagina.waitForTimeout(600);
      await asentar(pagina);
      await pagina.waitForTimeout(400);
      const [chip, icono] = [await tapada(pagina, P, "[data-prueba=hilo-chip]"), await tapada(pagina, P, "[data-prueba=hilo-icono]")];
      revisar(chip === true && icono === true, `un chip con borde y un ícono decorativo también tienen su hueco (chip: ${chip}, ícono: ${icono})`);
      // Al cambiar el orden de los bloques (sin cambiar el alto), los huecos siguen al contenido.
      await pagina.click("[data-prueba=hilo-orden]");
      await pagina.waitForTimeout(900);
      const sinHueco = await pagina.evaluate(() => {
        const svg = document.querySelector("[data-prueba=hilo-pagina] svg.mk-ramas");
        const c = svg.getBoundingClientRect();
        const k = c.width / Number(svg.getAttribute("width"));
        const huecos = [...svg.querySelectorAll("[data-hueco]")].map((h) => ["x", "y", "width", "height"].map((n) => Number(h.getAttribute(n)) * k));
        return window.__contenido().filter((b) => !huecos.some(([x, y, w, a]) => c.left + x <= b.izq + 1 && c.top + y <= b.arriba + 1 && c.left + x + w >= b.der - 1 && c.top + y + a >= b.abajo - 1)).map((b) => b.que);
      });
      revisar(sinHueco.length === 0, `al cambiar el orden de los bloques, los huecos siguen al contenido${sinHueco.length ? ` (sin hueco: ${sinHueco.slice(0, 3).join(", ")})` : ""}`);
      await ctx.close();
    }
    // En la vista previa (achicada, sin scroll propio) van enteras y quietas, sin chispas.
    {
      const { ctx, pagina } = await abrir({ hilo: "ramas" });
      await pagina.selectOption("[data-prueba=hilo-marco]", "previa");
      await pagina.waitForTimeout(900);
      const r = await ramas(pagina);
      revisar(Boolean(r) && !r.vivo && r.tronco.dibujado > 0.99 && r.ramas.every((x) => x.dibujado > 0.99) && r.chispas.length === 0, `en la vista previa del Estudio van enteras y quietas, sin chispas${r ? ` (tronco ${r.tronco.dibujado.toFixed(2)})` : ""}`);
      await ctx.close();
    }
    // En el teléfono, la barra del navegador cambia el alto visible al bajar: la forma no cambia por eso.
    {
      const { ctx, pagina } = await abrir({ hilo: "ramas", opciones: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } });
      await pagina.waitForTimeout(700);
      const forma = () => pagina.evaluate(() => [...document.querySelectorAll("[data-prueba=hilo-pagina] svg.mk-ramas path[data-rama=tronco]")].map((t) => t.getAttribute("d")).join(" ") || null);
      const antes = await forma();
      await pagina.setViewportSize({ width: 390, height: 784 });
      await pagina.waitForTimeout(300);
      // Algo cambia de tamaño y vuelve (como una foto que carga): la página se mide otra vez con el alto nuevo.
      await pagina.click("[data-prueba=hilo-crece]");
      await pagina.waitForTimeout(400);
      await pagina.click("[data-prueba=hilo-crece]");
      await pagina.waitForTimeout(700);
      const despues = await forma();
      revisar(Boolean(antes) && antes === despues, "en el teléfono, cuando la barra del navegador cambia el alto visible, la forma no salta");
      await ctx.close();
    }
    // En #pagina, en pantalla ancha: en el encabezado se ve el tronco (la máscara corta solo los renglones y los botones).
    {
      const { ctx, pagina } = await abrir({ ruta: "#pagina", raiz: ".pag-vista .mk-pagina", opciones: { viewport: { width: 1400, height: 900 } } });
      await pagina.selectOption("[data-prueba=relato-pagina]", "ramas");
      await pagina.waitForSelector(".pag-vista .mk-ramas [data-hueco]", { timeout: 4000 }).catch(() => {});
      await pagina.waitForTimeout(700);
      const visto = await pagina.evaluate(() => {
        const pag = document.querySelector(".pag-vista .mk-pagina");
        const svg = pag.querySelector("svg.mk-ramas");
        const enc = pag.querySelector(".mk-enc");
        if (!svg || !enc) return -1;
        const huecos = [...svg.querySelectorAll("[data-hueco]")].map((h) => ["x", "y", "width", "height"].map((n) => Number(h.getAttribute(n))));
        const alto = enc.offsetHeight;
        // Lo que se ve del tronco en el encabezado recién cargada la página: fuera de los huecos y ya dibujado.
        let libres = 0;
        for (const t of svg.querySelectorAll("path[data-rama=tronco]")) {
          const L = t.getTotalLength();
          const dibujado = 1 - Math.min(1, Math.max(0, parseFloat(getComputedStyle(t).strokeDashoffset) || 0));
          for (let s = 0; s < L * dibujado; s += 4) {
            const q = t.getPointAtLength(s);
            if (q.y <= alto && !huecos.some(([x, y, w, a]) => q.x >= x && q.x <= x + w && q.y >= y && q.y <= y + a)) libres += 4;
          }
        }
        return libres;
      });
      revisar(visto >= 200, `en el encabezado de #pagina se ve el tronco apenas carga la página (${visto} px dibujados a la vista)`);
      // Una tira que se desliza al bajar (el relato «carrete» en la galería) es un hueco entero: sus fotos se mueven.
      await pagina.selectOption("[data-prueba=relato-galeria]", "carrete");
      await pagina.waitForTimeout(900);
      const tira = await tapada(pagina, ".pag-vista .mk-pagina", '.pag-vista [data-bloque="galeria"]');
      revisar(tira === true, `una tira que se desliza al bajar queda entera bajo un hueco (${tira})`);
      await ctx.close();
    }
  }
  for (const [que, opciones, respaldo] of [["con movimiento reducido", { reducedMotion: "reduce" }, false], ["sin scroll nativo", {}, true]]) {
    const { ctx, pagina, errores } = await abrir({ hilo: "ramas", opciones: { viewport: { width: 390, height: 844 }, ...opciones } });
    if (respaldo) await pagina.locator("[data-prueba=hilo-respaldo]").check();
    await pagina.waitForTimeout(700);
    const hay = await pagina.evaluate(() => document.querySelectorAll("[data-prueba=hilo-pagina] .mk-ramas").length);
    revisar(hay === 0 && errores.length === 0, `${que} no hay ramas`);
    await ctx.close();
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
