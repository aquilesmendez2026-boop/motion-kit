// La prueba visual de las piezas del panel (#panel-piezas): las piezas de motion-kit/interfaz con los colores del panel de La Mente.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-panel.mjs [http://localhost:5173] [parte]`,
// donde la parte (opcional) es tema, imagen, avisos, cargando, llega, vivo (el panel entero de #panel) o adn (forma,
// letra y ritmo del tema). Las capturas quedan en <tmp>/mk-panel/.
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv.find((a) => /^https?:/.test(a)) ?? "http://localhost:5173";
const solo = process.argv.slice(2).find((a) => !/^https?:/.test(a));
const PARTES = ["tema", "imagen", "avisos", "cargando", "llega", "vivo", "adn", "piezas-panel", "conductas"];
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
const CAPTURAS = join(tmpdir(), "mk-panel");
mkdirSync(CAPTURAS, { recursive: true });
const navegador = await chromium.launch();
const TELEFONO = { width: 390, height: 844 };
const ESCRITORIO = { width: 1280, height: 800 };

/** Abre la vitrina con un tamaño, el tema y (si se pide) movimiento reducido; junta los errores de la página. */
async function abrir(tamano, { tema = "claro", reducido = false } = {}) {
  const ctx = await navegador.newContext({ viewport: tamano, reducedMotion: reducido ? "reduce" : "no-preference" });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.goto(`${base}/#panel-piezas`);
  await pagina.waitForSelector("[data-prueba=panel-tema]");
  if (tema !== "claro") await pagina.selectOption("[data-prueba=panel-tema]", tema);
  await pagina.waitForTimeout(150);
  return { ctx, pagina, errores };
}

/** Lee un color calculado («rgb(…)», «rgba(…)» o «color(srgb …)») como [r, g, b, a] en 0–255 y 0–1. */
const LEER_COLOR = `(t) => {
  const n = (t.match(/-?[\\d.]+(e-?\\d+)?/g) || []).map(Number);
  if (t.startsWith("color(")) return [n[0] * 255, n[1] * 255, n[2] * 255, n.length > 3 ? n[3] : 1];
  return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
}`;
/** Luminancia relativa (0 negro, 1 blanco) de un [r, g, b]. */
const luminancia = ([r, g, b]) => {
  const l = (v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
};
const contraste = (a, b) => {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
/** Los colores calculados de un elemento: fondo y texto. */
const colores = (pagina, selector) =>
  pagina.$eval(
    selector,
    (el, leer) => {
      const f = new Function(`return ${leer}`)();
      const s = getComputedStyle(el);
      return { fondo: f(s.backgroundColor), texto: f(s.color) };
    },
    LEER_COLOR,
  );

if (parte("tema")) {
  for (const tema of ["claro", "oscuro"]) {
    for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
      const { ctx, pagina, errores } = await abrir(tamano, { tema });
      const oscuro = tema === "oscuro";
      const sigue = (c) => (oscuro ? luminancia(c) < 0.2 : luminancia(c) > 0.8);
      const donde = `${tema}, ${nombre}`;

      await pagina.click("[data-prueba=mostrar-aviso]");
      const aviso = ".mk-aviso";
      await pagina.waitForSelector(aviso);
      await pagina.waitForTimeout(450);
      const a = await colores(pagina, aviso);
      revisar(sigue(a.fondo), `tema (${donde}): el aviso toma la superficie del tema (fondo ${a.fondo.map(Math.round).join(",")})`);
      revisar(contraste(a.fondo, a.texto) >= 4.5, `tema (${donde}): el texto del aviso se lee (contraste ${contraste(a.fondo, a.texto).toFixed(1)})`);

      const e = await colores(pagina, "[data-prueba=esqueleto] > div");
      // El esqueleto es el color del texto, transparente: claro sobre oscuro y al revés.
      revisar(oscuro ? luminancia(e.fondo) > 0.6 : luminancia(e.fondo) < 0.2, `tema (${donde}): el esqueleto sale del color del texto`);

      const b = await colores(pagina, "[data-prueba=barra] nav");
      revisar(sigue(b.fondo), `tema (${donde}): la barra toma la superficie del tema`);
      revisar(oscuro ? luminancia(b.texto) > 0.6 : luminancia(b.texto) < 0.2, `tema (${donde}): el texto de la barra es el del tema`);

      await pagina.click("[data-prueba=abrir-hoja]");
      await pagina.waitForSelector("[data-prueba=hoja]");
      await pagina.waitForTimeout(500);
      const h = await colores(pagina, "[role=dialog]");
      revisar(sigue(h.fondo), `tema (${donde}): la hoja toma la superficie del tema`);
      revisar(contraste(h.fondo, h.texto) >= 4.5, `tema (${donde}): el texto de la hoja se lee`);
      await pagina.screenshot({ path: join(CAPTURAS, `tema-${tema}-${tamano.width}.png`) });
      revisar(errores.length === 0, `tema (${donde}): sin errores en la página${errores.length ? ` (${errores[0]})` : ""}`);
      await ctx.close();
    }
  }
}

/** Un PNG de 1 × 1 y un archivo «grande» (3 MB de PNG falso) para soltar o elegir. */
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const archivo = (nombre, tipo, bytes) => ({ name: nombre, mimeType: tipo, buffer: bytes });

/** Suelta un archivo sobre el recuadro de una pieza (como al arrastrarlo desde el escritorio). */
const soltar = (pagina, donde, { nombre = "foto.png", tipo = "image/png", tamano = 0 } = {}) =>
  pagina.$eval(
    `[data-prueba=${donde}] .mk-subir-caja`,
    async (caja, { nombre, tipo, tamano, base64 }) => {
      const bytes = tamano ? new Uint8Array(tamano) : Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], nombre, { type: tipo }));
      const ev = (t) => caja.dispatchEvent(new DragEvent(t, { bubbles: true, cancelable: true, dataTransfer: dt }));
      ev("dragenter");
      ev("dragover");
      // React aplica el cambio en el cuadro siguiente.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const durante = caja.closest(".mk-subir").dataset.estado;
      ev("drop");
      return durante;
    },
    { nombre, tipo, tamano, base64: PNG.toString("base64") },
  );
/** Las animaciones hechas con WAAPI (la sacudida), sin las transiciones de color del CSS. */
const sacudidasDe = (el) => el.getAnimations().filter((x) => !(x instanceof CSSTransition) && !(x instanceof CSSAnimation)).length;
const altoDe = (pagina, selector) => pagina.$eval(selector, (el) => el.getBoundingClientRect().height).catch(() => 0);
const estado = (pagina, donde) => pagina.$eval(`[data-prueba=${donde}] .mk-subir`, (el) => el.dataset.estado ?? "");
const elegidos = (pagina, donde) => pagina.$eval(`[data-prueba=elegidos-${donde}]`, (el) => Number(el.textContent));
/** Espera hasta que el estado sea el pedido (o pasen `ms`); devuelve cuánto tardó, o -1. */
async function esperarEstado(pagina, donde, quiero, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if ((await estado(pagina, donde)) === quiero) return Date.now() - t0;
    await pagina.waitForTimeout(40);
  }
  return -1;
}
/** Anota las vistas locales que se crean y se sueltan (URL.createObjectURL / revokeObjectURL). */
const ESPIA_BLOB = () => {
  const crear = URL.createObjectURL.bind(URL);
  const soltar = URL.revokeObjectURL.bind(URL);
  window.__blobs = { creados: [], soltados: [] };
  URL.createObjectURL = (o) => {
    const u = crear(o);
    window.__blobs.creados.push(u);
    return u;
  };
  URL.revokeObjectURL = (u) => {
    window.__blobs.soltados.push(u);
    return soltar(u);
  };
};

if (parte("imagen")) {
  for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir(tamano);
    await pagina.addInitScript(ESPIA_BLOB);
    await pagina.reload();
    await pagina.waitForSelector("[data-prueba=panel-imagen]");
    const d = `imagen (${nombre})`;
    await pagina.$eval("[data-prueba=panel-imagen]", (s) => s.scrollIntoView());

    const textoVacia = await pagina.$eval("[data-prueba=subir-logo] .mk-subir", (el) => el.textContent ?? "");
    revisar(textoVacia.includes("Arrastra una foto o toca para elegir"), `${d}: vacía, dice «Arrastra una foto o toca para elegir»`);
    revisar((await estado(pagina, "subir-logo")) === "vacia", `${d}: parte vacía`);

    // La forma: el logo redondo de 112 px; la portada apaisada 16:9.
    const logoCaja = await pagina.$eval("[data-prueba=subir-logo] .mk-subir-caja", (el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, radio: getComputedStyle(el).borderRadius };
    });
    revisar(Math.abs(logoCaja.w - 112) < 1 && Math.abs(logoCaja.h - 112) < 1 && /50%|9999|56px/.test(logoCaja.radio), `${d}: el logo es redondo de 112 px (${Math.round(logoCaja.w)}×${Math.round(logoCaja.h)}, ${logoCaja.radio})`);
    const portadaCaja = await pagina.$eval("[data-prueba=subir-portada] .mk-subir-caja", (el) => el.getBoundingClientRect().toJSON());
    revisar(Math.abs(portadaCaja.width / portadaCaja.height - 16 / 9) < 0.03 && portadaCaja.width <= 481, `${d}: la portada es 16:9 y no pasa de 480 px (${Math.round(portadaCaja.width)}×${Math.round(portadaCaja.height)})`);

    // Soltar una foto: arrastrando → subiendo (con la vista local) → lista con su ✓.
    const durante = await soltar(pagina, "subir-logo");
    revisar(durante === "arrastrando", `${d}: al pasar una foto encima, el recuadro lo muestra (estado «${durante}»)`);
    await pagina.waitForTimeout(60);
    revisar((await estado(pagina, "subir-logo")) === "subiendo", `${d}: al soltarla, sube`);
    const vista = await pagina.$eval("[data-prueba=subir-logo] .mk-subir-foto", (img) => img.getAttribute("src") ?? "").catch(() => "");
    revisar(vista.startsWith("blob:"), `${d}: mientras sube, la foto elegida ya se ve`);
    revisar(await pagina.$eval("[data-prueba=subir-logo] .mk-subir", (el) => el.getAttribute("aria-busy") === "true"), `${d}: mientras sube, aria-busy`);
    revisar((await pagina.$$("[data-prueba=subir-logo] .mk-subir-anillo")).length === 1, `${d}: mientras sube, el anillo de avance`);
    revisar((await elegidos(pagina, "logo")) === 1, `${d}: avisó al panel una vez`);
    const tardo = await esperarEstado(pagina, "subir-logo", "lista");
    revisar(tardo >= 0, `${d}: al terminar queda lista`);
    const listo = await pagina.$("[data-prueba=subir-logo] .mk-subir-listo");
    revisar(Boolean(listo && (await listo.isVisible())), `${d}: sale el ✓`);
    const anuncio = await pagina.$eval("[data-prueba=subir-logo] [aria-live=polite]", (el) => el.textContent ?? "").catch(() => "");
    revisar(anuncio.includes("Foto lista"), `${d}: anuncia «Foto lista» a quien usa lector`);
    await pagina.waitForTimeout(400);
    const blobs = await pagina.evaluate(() => window.__blobs);
    revisar(blobs.creados.length === 1 && blobs.soltados.includes(blobs.creados[0]), `${d}: al llegar la foto del panel, suelta la vista local`);
    revisar((await pagina.$$("[data-prueba=subir-logo] .mk-subir-anillo")).length === 0, `${d}: lista, sin anillo`);
    await pagina.waitForTimeout(900);
    revisar(!(await pagina.$("[data-prueba=subir-logo] .mk-subir-listo")) || !(await pagina.isVisible("[data-prueba=subir-logo] .mk-subir-listo")), `${d}: el ✓ es breve`);
    await pagina.screenshot({ path: join(CAPTURAS, `imagen-lista-${tamano.width}.png`) });

    // «Cambiar» y «Quitar» sobre la foto (Quitar solo si el panel lo permite).
    revisar(Boolean(await pagina.$("[data-prueba=subir-logo] .mk-subir-quitar")), `${d}: el logo trae «Quitar»`);
    const altos = [await altoDe(pagina, "[data-prueba=subir-logo] .mk-subir-quitar"), await altoDe(pagina, "[data-prueba=subir-logo] .mk-subir-cambiar")];
    revisar(altos.every((h) => h >= 44), `${d}: «Cambiar» y «Quitar» miden al menos 44 px de alto (${altos.map(Math.round).join(", ")})`);
    await soltar(pagina, "subir-portada");
    await esperarEstado(pagina, "subir-portada", "lista");
    revisar(!(await pagina.$("[data-prueba=subir-portada] .mk-subir-quitar")), `${d}: la portada (sin alQuitar) no trae «Quitar»`);
    revisar(Boolean(await pagina.$("[data-prueba=subir-portada] .mk-subir-cambiar")), `${d}: la portada trae «Cambiar»`);
    await pagina.click("[data-prueba=subir-logo] .mk-subir-quitar");
    await pagina.waitForTimeout(100);
    revisar((await estado(pagina, "subir-logo")) === "vacia", `${d}: «Quitar» la deja vacía`);

    // Una foto muy pesada: error propio, sin avisar al panel, con una sacudida.
    const antes = await elegidos(pagina, "logo");
    await soltar(pagina, "subir-logo", { tamano: 3_000_000 });
    await pagina.waitForTimeout(80);
    revisar((await estado(pagina, "subir-logo")) === "error", `${d}: una foto de 3 MB da error`);
    const alerta = await pagina.$eval("[data-prueba=subir-logo] [role=alert]", (el) => el.textContent ?? "").catch(() => "");
    revisar(alerta.includes("Esa foto pesa 3 MB: el máximo es 2 MB."), `${d}: el error dice cuánto pesa («${alerta}»)`);
    revisar((await elegidos(pagina, "logo")) === antes, `${d}: con el error, no le avisa al panel`);
    const sacudidas = await pagina.$eval("[data-prueba=subir-logo] .mk-subir-caja", sacudidasDe);
    revisar(sacudidas === 1, `${d}: se sacude una vez (${sacudidas})`);
    await pagina.waitForTimeout(400);
    // El mismo error otra vez: no vuelve a sacudir (ya está ahí); uno nuevo sí.
    await soltar(pagina, "subir-logo", { tamano: 3_000_000 });
    await pagina.waitForTimeout(80);
    revisar((await pagina.$eval("[data-prueba=subir-logo] .mk-subir-caja", sacudidasDe)) === 0, `${d}: el mismo error no vuelve a sacudir`);
    await soltar(pagina, "subir-logo", { nombre: "doc.pdf", tipo: "application/pdf" });
    await pagina.waitForTimeout(80);
    revisar((await pagina.$eval("[data-prueba=subir-logo] .mk-subir-caja", sacudidasDe)) === 1, `${d}: un error nuevo sí sacude`);
    await pagina.screenshot({ path: join(CAPTURAS, `imagen-error-${tamano.width}.png`) });

    // El error que pone el panel (la subida falló).
    await soltar(pagina, "subir-producto");
    const fallo = await esperarEstado(pagina, "subir-producto", "error");
    revisar(fallo >= 0, `${d}: si la subida falla, queda en error`);
    const alertaPanel = await pagina.$eval("[data-prueba=subir-producto] [role=alert]", (el) => el.textContent ?? "").catch(() => "");
    revisar(alertaPanel.includes("No se pudo subir. Intenta de nuevo."), `${d}: muestra el error del panel`);
    await pagina.waitForTimeout(100);
    const blobs2 = await pagina.evaluate(() => window.__blobs);
    const ultimo = blobs2.creados[blobs2.creados.length - 1];
    revisar(blobs2.soltados.includes(ultimo), `${d}: con el error, suelta la vista local`);

    // La misma foto dos veces: el <input> queda limpio para volver a avisar.
    const input = "[data-prueba=subir-portada] input[type=file]";
    const antesPortada = await elegidos(pagina, "portada");
    await pagina.setInputFiles(input, archivo("misma.png", "image/png", PNG));
    await pagina.waitForTimeout(60);
    revisar((await pagina.$eval(input, (el) => el.value)) === "", `${d}: tras elegir, el campo queda limpio (la misma foto puede volver a elegirse)`);
    // Cambiar de foto mientras otra sube: suelta la vista anterior.
    const antesDeCambiar = (await pagina.evaluate(() => window.__blobs)).creados.length;
    await pagina.setInputFiles(input, archivo("otra.png", "image/png", PNG));
    await pagina.waitForTimeout(60);
    const b3 = await pagina.evaluate(() => window.__blobs);
    revisar(b3.creados.length === antesDeCambiar + 1 && b3.soltados.includes(b3.creados[antesDeCambiar - 1]), `${d}: al cambiar de foto mientras sube, suelta la vista anterior`);
    revisar((await elegidos(pagina, "portada")) === antesPortada + 2, `${d}: cada elección avisa al panel`);
    await esperarEstado(pagina, "subir-portada", "lista");

    // Con teclado: el campo se alcanza con Tab y Enter abre el selector.
    await pagina.focus("[data-prueba=subir-producto] input[type=file]");
    const conFoco = await pagina.$eval("[data-prueba=subir-producto] .mk-subir-caja", (el) => getComputedStyle(el).outlineStyle !== "none" || getComputedStyle(el).boxShadow !== "none");
    revisar(conFoco, `${d}: con el foco, el recuadro se marca`);
    const [selector] = await Promise.all([pagina.waitForEvent("filechooser", { timeout: 2000 }).catch(() => null), pagina.keyboard.press("Enter")]);
    revisar(Boolean(selector), `${d}: Enter abre el selector de fotos`);
    if (selector) await selector.setFiles([]);

    // La subida termina y el guardado falla enseguida: el ✓ no se queda pegado sobre el error.
    await soltar(pagina, "subir-galeria");
    const fallaGuardar = await esperarEstado(pagina, "subir-galeria", "error", 4000);
    revisar(fallaGuardar >= 0, `${d}: si falla al guardar, queda en error`);
    await pagina.waitForTimeout(1200);
    revisar(!(await pagina.$("[data-prueba=subir-galeria] .mk-subir-listo")), `${d}: con el error, el ✓ no se queda pegado`);

    // Con un front de verdad (las subidas no se cancelan): elegir A y después B mientras A sube.
    // Cuando A termina, se sigue viendo B (la que eligió); cuando B termina, la foto de B.
    const portada = "[data-prueba=subir-portada] input[type=file]";
    await pagina.setInputFiles(portada, archivo("A.png", "image/png", PNG));
    await pagina.waitForTimeout(500);
    await pagina.setInputFiles(portada, archivo("B.png", "image/png", PNG));
    await pagina.waitForTimeout(1300);
    const trasA = await pagina.$eval("[data-prueba=subir-portada] .mk-subir-foto", (img) => img.getAttribute("src") ?? "").catch(() => "");
    revisar(trasA.startsWith("blob:"), `${d}: cuando termina la foto anterior, se sigue viendo la elegida (${trasA.slice(0, 30)})`);
    await pagina.waitForTimeout(900);
    const trasB = await pagina.$eval("[data-prueba=subir-portada] .mk-subir-foto", (img) => decodeURIComponent(img.getAttribute("src") ?? "")).catch(() => "");
    revisar(trasB.includes("B.png"), `${d}: cuando termina la elegida, queda su foto`);

    revisar(errores.length === 0, `${d}: sin errores en la página${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }

  // Con movimiento reducido: el error sin sacudida.
  const { ctx, pagina } = await abrir(TELEFONO, { reducido: true });
  await soltar(pagina, "subir-logo", { tamano: 3_000_000 });
  await pagina.waitForTimeout(80);
  const sinSacudir = await pagina.$eval("[data-prueba=subir-logo] .mk-subir-caja", sacudidasDe).catch(() => -1);
  revisar((await estado(pagina, "subir-logo")) === "error" && sinSacudir === 0, `imagen (reducido): el error sin sacudida`);
  await ctx.close();
}

const avisos = (pagina) => pagina.$$eval(".mk-aviso", (l) => l.map((el) => el.textContent ?? ""));
const hay = async (pagina, texto) => (await avisos(pagina)).some((x) => x.includes(texto));
/** Arrastra un aviso hacia el lado con el puntero, en `pasos` movimientos de `ms` cada uno. */
async function deslizar(pagina, selector, dx, pasos, ms) {
  const caja = await pagina.$eval(selector, (el) => el.getBoundingClientRect().toJSON());
  const y = caja.y + caja.height / 2;
  const x0 = caja.x + 30;
  await pagina.mouse.move(x0, y);
  await pagina.mouse.down();
  for (let i = 1; i <= pasos; i++) {
    await pagina.mouse.move(x0 + (dx * i) / pasos, y);
    await pagina.waitForTimeout(ms);
  }
  await pagina.mouse.up();
}

if (parte("avisos")) {
  for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir(tamano);
    const d = `avisos (${nombre})`;
    const regiones = await pagina.evaluate(() => ({
      educada: document.querySelectorAll("[aria-live=polite].mk-avisos").length,
      urgente: document.querySelectorAll("[aria-live=assertive].mk-avisos").length,
    }));
    revisar(regiones.educada === 1 && regiones.urgente === 1, `${d}: las dos regiones (educada y urgente) están desde el principio`);

    await pagina.click("[data-prueba=aviso-bien]");
    await pagina.waitForSelector(".mk-aviso[data-tipo=bien]");
    const bien = await pagina.$eval(".mk-aviso[data-tipo=bien]", (el) => ({
      dentro: Boolean(el.closest("[aria-live=polite]")),
      icono: el.querySelector(".mk-aviso-icono") ? getComputedStyle(el.querySelector(".mk-aviso-icono")).color : "",
    }));
    revisar(bien.dentro, `${d}: «Guardado» va en la región educada`);
    revisar(/rgb\(31, 157, 85\)/.test(bien.icono), `${d}: «Guardado» trae su ícono verde (${bien.icono})`);
    await pagina.click("[data-prueba=aviso-mal]");
    await pagina.waitForSelector(".mk-aviso[data-tipo=mal]");
    const mal = await pagina.$eval(".mk-aviso[data-tipo=mal]", (el) => ({
      dentro: Boolean(el.closest("[aria-live=assertive]")),
      icono: el.querySelector(".mk-aviso-icono") ? getComputedStyle(el.querySelector(".mk-aviso-icono")).color : "",
    }));
    revisar(mal.dentro, `${d}: «No se pudo guardar» va en la región urgente`);
    revisar(/rgb\(214, 69, 69\)/.test(mal.icono), `${d}: el error trae su ícono rojo (${mal.icono})`);
    await pagina.screenshot({ path: join(CAPTURAS, `avisos-${tamano.width}.png`) });
    revisar(await pagina.evaluate(() => !document.querySelector(".mk-avisos button button")), `${d}: ningún botón dentro de otro`);

    // Tocar el cuerpo no cierra; la × sí.
    await pagina.click(".mk-aviso[data-tipo=bien] .mk-aviso-texto");
    await pagina.waitForTimeout(350);
    revisar(await hay(pagina, "Guardado"), `${d}: tocar el texto del aviso no lo cierra`);
    await pagina.click(".mk-aviso[data-tipo=bien] .mk-aviso-cerrar");
    await pagina.waitForTimeout(400);
    revisar(!(await hay(pagina, "Guardado")), `${d}: la × lo cierra`);
    await pagina.click(".mk-aviso[data-tipo=mal] .mk-aviso-cerrar");
    await pagina.waitForTimeout(400);

    // «Deshacer» llama su función y cierra.
    await pagina.click("[data-prueba=aviso-borrar]");
    await pagina.waitForSelector(".mk-aviso-accion");
    await pagina.waitForTimeout(450); // ya asentado (entra desde escala 0,96)
    const toques = [await altoDe(pagina, ".mk-aviso-accion"), await altoDe(pagina, ".mk-aviso-cerrar")];
    revisar(toques.every((h) => h >= 44), `${d}: «Deshacer» y la × miden al menos 44 px de alto (${toques.map(Math.round).join(", ")})`);
    await pagina.click(".mk-aviso-accion");
    await pagina.waitForTimeout(400);
    revisar((await pagina.$eval("[data-prueba=deshechos]", (el) => el.textContent)) === "1", `${d}: «Deshacer» llama su función`);
    revisar(!(await hay(pagina, "Borrado")), `${d}: y cierra el aviso`);

    // Deslizar: 120 px lo cierra; 40 px lento no.
    await pagina.click("[data-prueba=aviso-hola]");
    await pagina.waitForSelector(".mk-aviso");
    await pagina.waitForTimeout(400);
    await deslizar(pagina, ".mk-aviso", 40, 8, 40);
    await pagina.waitForTimeout(400);
    revisar(await hay(pagina, "Hola"), `${d}: deslizar 40 px despacio no lo cierra (vuelve a su lugar)`);
    await deslizar(pagina, ".mk-aviso", 120, 6, 16);
    await pagina.waitForTimeout(400);
    revisar(!(await hay(pagina, "Hola")), `${d}: deslizar 120 px lo cierra`);

    // Con el mouse encima, no se va; al salir, sí.
    await pagina.click("[data-prueba=aviso-hola]");
    await pagina.waitForSelector(".mk-aviso");
    await pagina.hover(".mk-aviso .mk-aviso-texto");
    await pagina.waitForTimeout(4200);
    revisar(await hay(pagina, "Hola"), `${d}: con el mouse encima no se va (4,2 s)`);
    await pagina.mouse.move(5, 5);
    await pagina.waitForTimeout(3700);
    revisar(!(await hay(pagina, "Hola")), `${d}: al sacar el mouse, sigue su cuenta y se va`);

    // Tres «Deshacer» a la vista y llega un error: el error se queda a la vista.
    await pagina.click("[data-prueba=aviso-tres-y-error]");
    await pagina.waitForTimeout(600);
    revisar(await hay(pagina, "No se pudo guardar"), `${d}: con tres «Deshacer» a la vista, un error que llega se ve`);
    for (const x of await pagina.$$(".mk-aviso-cerrar")) await x.click().catch(() => {});
    await pagina.waitForTimeout(400);

    // Cinco avisos con «Deshacer» primero: el de la acción se queda.
    await pagina.click("[data-prueba=aviso-muchos]");
    await pagina.waitForTimeout(500);
    const quedan = await avisos(pagina);
    revisar(quedan.some((x) => x.includes("Pedido borrado")), `${d}: con cinco avisos, el de «Deshacer» sigue (${quedan.length} a la vista)`);
    revisar(quedan.length <= 4, `${d}: no se amontonan (a lo más cuatro)`);
    revisar(errores.length === 0, `${d}: sin errores en la página${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  const { ctx, pagina } = await abrir(TELEFONO, { reducido: true });
  await pagina.click("[data-prueba=aviso-bien]");
  await pagina.waitForSelector(".mk-aviso");
  const animaciones = await pagina.$eval(".mk-aviso", (el) => el.getAnimations().filter((x) => !(x instanceof CSSTransition)).length);
  revisar(animaciones === 0, `avisos (reducido): sin animación de entrada`);
  await ctx.close();
}

/** Empieza a anotar si aparece algún esqueleto dentro de la carga de ejemplo (en cualquier cuadro). */
const vigilarEsqueleto = (pagina) =>
  pagina.evaluate(() => {
    const zona = document.querySelector("[data-prueba=carga-demo]");
    window.__esqueleto = false;
    window.__vigia?.disconnect();
    window.__vigia = new MutationObserver(() => {
      if (zona.querySelector("[data-mk-esqueleto]")) window.__esqueleto = true;
    });
    window.__vigia.observe(zona, { childList: true, subtree: true });
  });

if (parte("cargando")) {
  for (const tema of ["claro", "oscuro"]) {
    const { ctx, pagina, errores } = await abrir(TELEFONO, { tema });
    const d = `cargando (${tema})`;
    await pagina.$eval("[data-prueba=panel-cargando]", (s) => s.scrollIntoView());

    // Una carga corta (80 ms): nunca se pinta el esqueleto.
    await vigilarEsqueleto(pagina);
    await pagina.click("[data-prueba=cargar-rapido]");
    await pagina.waitForTimeout(500);
    revisar(!(await pagina.evaluate(() => window.__esqueleto)), `${d}: una carga corta no muestra el esqueleto`);
    revisar(Boolean(await pagina.$("[data-prueba=carga-contenido]")), `${d}: y muestra el contenido`);

    // Una carga de 1 s: el esqueleto con forma de tabla y después el contenido con un fundido.
    await pagina.click("[data-prueba=cargar-lento]");
    await pagina.waitForTimeout(350);
    const durante = await pagina.$eval("[data-prueba=carga-demo]", (z) => ({
      forma: z.querySelector("[data-mk-esqueleto]")?.getAttribute("data-mk-esqueleto") ?? "",
      ocupado: z.querySelector("[aria-busy=true]") !== null,
      anuncio: z.textContent?.includes("Cargando…") ?? false,
      contenido: Boolean(z.querySelector("[data-prueba=carga-contenido]")),
    }));
    revisar(durante.forma === "tabla" && !durante.contenido, `${d}: una carga larga muestra el esqueleto con forma de tabla`);
    revisar(durante.ocupado && durante.anuncio, `${d}: mientras carga, aria-busy y «Cargando…» para el lector`);
    await pagina.waitForSelector("[data-prueba=carga-contenido]", { timeout: 2000 });
    const fundido = await pagina.$eval("[data-prueba=carga-demo] > div", (el) => el.getAnimations().length);
    revisar(fundido >= 1, `${d}: el contenido entra con un fundido`);
    revisar(!(await pagina.$("[data-prueba=carga-demo] [data-mk-esqueleto]")), `${d}: llegado el contenido, no queda esqueleto`);

    // Refrescar (vuelve a «no listo» sin desmontar): el contenido se queda.
    await vigilarEsqueleto(pagina);
    await pagina.click("[data-prueba=refrescar]");
    await pagina.waitForTimeout(600);
    revisar(!(await pagina.evaluate(() => window.__esqueleto)) && Boolean(await pagina.$("[data-prueba=carga-contenido]")), `${d}: al refrescar, el contenido se queda`);

    // Las cinco formas.
    for (const f of ["texto", "fila", "tarjeta", "tabla", "foto"]) {
      const alto = await pagina.$eval(`[data-prueba=forma-${f}] [data-mk-esqueleto=${f}]`, (el) => el.getBoundingClientRect().height).catch(() => 0);
      revisar(alto > 10, `${d}: la forma «${f}» se ve (${Math.round(alto)} px)`);
    }
    await pagina.$eval("[data-prueba=formas]", (s) => s.scrollIntoView());
    await pagina.screenshot({ path: join(CAPTURAS, `cargando-${tema}.png`) });
    revisar(errores.length === 0, `${d}: sin errores en la página${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
}

/** Las animaciones WAAPI de cada elemento de la lista (por su clave), sin transiciones de CSS. */
const animadosEnLista = (pagina) =>
  pagina.$$eval("[data-prueba=lista] [data-mk-clave]", (l) =>
    l.filter((el) => el.getAnimations().some((a) => !(a instanceof CSSTransition) && !(a instanceof CSSAnimation))).map((el) => el.dataset.mkClave),
  );
/** Las transformaciones que toma un elemento en sus animaciones. */
const movimientoDe = (pagina, selector) =>
  pagina
    .$eval(selector, (el) => el.getAnimations().flatMap((a) => a.effect?.getKeyframes?.() ?? []).map((k) => k.transform ?? "").filter(Boolean))
    .catch(() => []);

if (parte("llega")) {
  for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir(tamano);
    const d = `llega (${nombre})`;
    await pagina.$eval("[data-prueba=panel-llega]", (s) => s.scrollIntoView());
    await pagina.waitForTimeout(200);
    revisar((await animadosEnLista(pagina)).length === 0, `${d}: al cargar, nada se anima`);

    // Llega un pedido: entra con un destello que se apaga; el contador late.
    await pagina.click("[data-prueba=llega]");
    await pagina.waitForTimeout(40);
    const nuevos = await animadosEnLista(pagina);
    revisar(nuevos.includes("p3"), `${d}: el pedido nuevo entra animado (${nuevos.join(", ")})`);
    revisar(Boolean(await pagina.$("[data-mk-clave=p3] [data-mk-destello]")), `${d}: con un destello`);
    const latido = await movimientoDe(pagina, "[data-prueba=contador]");
    revisar(latido.some((x) => /scale\((1\.1[5-9]|1\.[2-9])/.test(x)), `${d}: el contador late al subir (${latido.join(" | ")})`);
    await pagina.screenshot({ path: join(CAPTURAS, `llega-${tamano.width}.png`) });
    await pagina.waitForTimeout(1400);
    revisar(!(await pagina.$("[data-mk-destello]")), `${d}: el destello se apaga en menos de 1,4 s`);

    // Pasa a listo: el que cambia de lugar se mueve a su lugar nuevo, sin salto.
    await pagina.click("[data-prueba=pasa-listo]");
    await pagina.waitForTimeout(40);
    const mueve = await movimientoDe(pagina, "[data-mk-clave=p3]");
    revisar(mueve.some((x) => /translate/.test(x)), `${d}: el que pasa a listo se desliza a su lugar (${mueve.join(" | ")})`);
    revisar((await movimientoDe(pagina, "[data-prueba=contador]")).length === 0, `${d}: al bajar, el contador no late`);
    await pagina.waitForTimeout(600);
    const final = await pagina.$eval("[data-mk-clave=p3]", (el) => ({
      caja: el.getBoundingClientRect().top,
      flujo: el.offsetTop,
      padre: el.offsetParent.getBoundingClientRect().top + el.offsetParent.clientTop,
      anim: el.getAnimations().length,
    }));
    revisar(final.anim === 0 && Math.abs(final.caja - (final.padre + final.flujo)) < 1, `${d}: termina justo en su lugar`);

    // Entregado: el que sale se desvanece en su lugar un momento y después se va.
    await pagina.click("[data-prueba=entregado]");
    await pagina.waitForTimeout(40);
    revisar(Boolean(await pagina.$("[data-prueba=lista] [data-mk-saliendo]")), `${d}: el entregado se queda un momento desvaneciéndose`);
    await pagina.waitForTimeout(700);
    revisar(!(await pagina.$("[data-prueba=lista] [data-mk-saliendo]")), `${d}: después se va del todo`);

    // Abrir de nuevo: vacía y los datos llegan después; no entran todos animados.
    await pagina.click("[data-prueba=recargar]");
    await pagina.waitForTimeout(340);
    const alAbrir = await animadosEnLista(pagina);
    const cuantos = (await pagina.$$("[data-prueba=lista] [data-mk-clave]")).length;
    revisar(cuantos === 10 && alAbrir.length === 0, `${d}: al abrir, los 10 pedidos que llegan tarde no entran animados (${cuantos} a la vista, ${alAbrir.length} animados)`);

    // El interruptor: clic, espacio y enter; su caja para el dedo.
    const boton = "[data-prueba=interruptor] [role=switch]";
    const lee = () => pagina.$eval(boton, (el) => el.getAttribute("aria-checked")).catch(() => "");
    const antes = await lee();
    await pagina.click(boton).catch(() => {});
    const tras1 = await lee();
    await pagina.focus(boton).catch(() => {});
    await pagina.keyboard.press("Space");
    const tras2 = await lee();
    await pagina.keyboard.press("Enter");
    const tras3 = await lee();
    revisar(antes === "true" && tras1 === "false" && tras2 === "true" && tras3 === "false", `${d}: el interruptor cambia con clic, espacio y enter (${antes}→${tras1}→${tras2}→${tras3})`);
    revisar((await pagina.$eval("[data-prueba=abierto]", (el) => el.textContent)) === "false", `${d}: y avisa al panel`);
    const caja = await pagina.$eval(boton, (el) => el.getBoundingClientRect().toJSON()).catch(() => ({ width: 0, height: 0 }));
    revisar(caja.width >= 44 && caja.height >= 44, `${d}: el interruptor mide al menos 44 × 44 (${Math.round(caja.width)}×${Math.round(caja.height)})`);
    revisar((await pagina.$eval("[data-prueba=interruptor]", (el) => el.textContent ?? "")).includes("Cerrado"), `${d}: apagado dice «Cerrado»`);
    revisar(errores.length === 0, `${d}: sin errores en la página${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // Con movimiento reducido: sin deslizar ni latir, solo fundidos.
  const { ctx, pagina } = await abrir(TELEFONO, { reducido: true });
  await pagina.$eval("[data-prueba=panel-llega]", (s) => s.scrollIntoView());
  await pagina.click("[data-prueba=llega]");
  await pagina.waitForTimeout(40);
  const entra = await animadosEnLista(pagina);
  const movimiento = [...(await movimientoDe(pagina, "[data-mk-clave=p3]")), ...(await movimientoDe(pagina, "[data-prueba=contador]"))];
  revisar(entra.includes("p3") && movimiento.length === 0, `llega (reducido): entra con un fundido, sin deslizar ni latir (${movimiento.join(" | ")})`);
  await ctx.close();
}

/** El panel entero (#panel): todas las secciones de la barra, con las piezas funcionando dentro. */
async function abrirVivo(tamano, seccion, { reducido = false } = {}) {
  const ctx = await navegador.newContext({ viewport: tamano, reducedMotion: reducido ? "reduce" : "no-preference" });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  await pagina.goto(`${base}/#panel?s=${seccion}`);
  await pagina.waitForSelector(".pv-panel");
  await pagina.waitForTimeout(700);
  return { ctx, pagina, errores };
}
const sinEspacios = (x) => (x ?? "").replace(/\s+/g, "");
const tarjetas = (pagina) => pagina.$$eval(".pv-colab", (l) => l.length);

if (parte("vivo")) {
  // Escritorio: la barra con todas las secciones y cada una se abre con su título.
  {
    const { ctx, pagina, errores } = await abrirVivo(ESCRITORIO, "resumen");
    const nombres = await pagina.$$eval(".pv-lado .mk-barra-item", (l) => l.map((b) => [b.dataset.seccion, (b.querySelector(".mk-barra-oculto") ?? b.querySelector(".mk-barra-nombre"))?.textContent.trim() ?? ""]));
    revisar(nombres.length === 41, `vivo: la barra tiene las 41 secciones del panel (${nombres.length})`);
    const malas = [];
    for (const [id, nombre] of nombres) {
      await pagina.click(`.pv-lado [data-seccion="${id}"]`);
      await pagina.waitForTimeout(120);
      const titulo = await pagina.$eval(".pv-titulo", (h) => h.textContent).catch(() => "");
      const activa = await pagina.$eval(".pv-lado [aria-current=page]", (b) => b.dataset.seccion).catch(() => "");
      if (sinEspacios(titulo) !== sinEspacios(nombre) || activa !== id) malas.push(id);
    }
    revisar(malas.length === 0, `vivo: cada sección se abre con su título y queda marcada${malas.length ? ` (fallan: ${malas.join(", ")})` : ""}`);
    revisar(errores.length === 0, `vivo: recorrer todas sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // La barra lateral es la pieza BarraLateral (fase 3): grupos, teclado, elegida, contraída, la firma del tema y el ritmo.
  for (const reducido of [false, true]) {
    const d = reducido ? "vivo (reducido)" : "vivo";
    const { ctx, pagina, errores } = await abrirVivo(ESCRITORIO, "resumen", { reducido });
    const barra = ".pv-lado nav.mk-barra";
    const info = await pagina.$eval(barra, (n) => ({
      etiqueta: n.getAttribute("aria-label"), marca: n.dataset.mkAdorno,
      grupos: [...n.querySelectorAll(".mk-barra-grupo")].map((g) => [g.style.getPropertyValue("--mk-grupo"), g.querySelectorAll(".mk-barra-item").length]),
      sueltas: [...n.querySelectorAll(".mk-barra-item")].filter((b) => !b.closest(".mk-barra-grupo")).length,
    })).catch(() => null);
    revisar(Boolean(info) && info.etiqueta === "Secciones" && info.marca === "barra", `${d}: la barra es un nav con nombre y la marca «barra»`);
    revisar(Boolean(info) && info.sueltas === 0 && info.grupos.length === 6 && info.grupos.every(([c, n]) => c && n > 0) && info.grupos.reduce((s, [, n]) => s + n, 0) === 41, `${d}: las 41 secciones, cada una en su grupo con su color (${JSON.stringify(info?.grupos)})`);
    // Teclado: Tab entra, las flechas bajan y suben, Enter elige.
    await pagina.focus(`${barra} [data-seccion=resumen]`);
    await pagina.keyboard.press("ArrowDown");
    const trasFlecha = await pagina.evaluate(() => document.activeElement?.dataset.seccion);
    await pagina.keyboard.press("ArrowUp");
    const trasSubir = await pagina.evaluate(() => document.activeElement?.dataset.seccion);
    await pagina.keyboard.press("Tab");
    const trasTab = await pagina.evaluate(() => document.activeElement?.dataset.seccion);
    revisar(trasFlecha === "pagina" && trasSubir === "resumen" && trasTab === "pagina", `${d}: las flechas y Tab la recorren (${trasFlecha}, ${trasSubir}, ${trasTab})`);
    await pagina.keyboard.press("End");
    const alFinal = await pagina.evaluate(() => document.activeElement?.dataset.seccion);
    await pagina.keyboard.press("Home");
    const alInicio = await pagina.evaluate(() => document.activeElement?.dataset.seccion);
    revisar(alFinal === "consumo" && alInicio === "resumen", `${d}: Inicio y Fin van a la primera y a la última (${alInicio}, ${alFinal})`);
    await pagina.keyboard.press("ArrowDown");
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(80);
    const elegida = await pagina.$$eval(`${barra} [aria-current]`, (l) => l.map((b) => `${b.dataset.seccion}=${b.getAttribute("aria-current")}`));
    revisar(elegida.length === 1 && elegida[0] === "pagina=page", `${d}: Enter elige y aria-current queda solo en la elegida (${elegida.join(", ")})`);
    const pop = await pagina.$eval(`${barra} [aria-current=page] .mk-icono-caja`, (i) => i.getAnimations().some((a) => String(a.animationName ?? "").startsWith("mk-barra-pop")));
    revisar(reducido ? !pop : pop, `${d}: el ícono de la elegida ${reducido ? "no hace pop" : "hace pop"}`);
    // Al pasar, el ícono salta.
    await pagina.hover(`${barra} [data-seccion=agenda]`);
    await pagina.waitForTimeout(450);
    const salto = await pagina.$eval(`${barra} [data-seccion=agenda] .mk-icono-caja`, (i) => getComputedStyle(i).transform);
    revisar(reducido ? salto === "none" : salto !== "none", `${d}: al pasar, el ícono ${reducido ? "no se mueve" : "salta"} (${salto})`);
    // Sin módulo: punteada, con su propio texto al pasar.
    const sinModulo = await pagina.$eval(`${barra} [data-sin-modulo]`, (b) => [getComputedStyle(b.querySelector(".mk-icono-caja")).borderTopStyle, b.title]).catch(() => []);
    revisar(sinModulo[0] === "dashed" && /No está en tu pack/.test(sinModulo[1]), `${d}: lo que no tiene módulo lleva el ícono punteado y lo dice al pasar (${sinModulo.join(", ")})`);
    // Elegir algo sin módulo: el nombre se lee igual que en cualquier elegida (revisión de la v0.9.0).
    const colorElegida = await pagina.$eval(`${barra} [aria-current=page]`, (b) => getComputedStyle(b).color);
    await pagina.click(`${barra} [data-seccion=exclusiva]`);
    await pagina.waitForTimeout(150);
    const colorSinModulo = await pagina.$eval(`${barra} [data-seccion=exclusiva]`, (b) => [b.getAttribute("aria-current"), getComputedStyle(b).color]);
    revisar(colorSinModulo[0] === "page" && colorSinModulo[1] === colorElegida, `${d}: elegida, una sección sin módulo se lee como cualquier elegida (${colorSinModulo[1]} y ${colorElegida})`);
    await pagina.click(`${barra} [data-seccion=pagina]`);
    await pagina.waitForTimeout(150);
    // El botón de contraer lleva lo que le pase el front (soporte y aria-controls).
    const contraer = await pagina.$eval(`${barra} .mk-barra-contraer`, (b) => [b.dataset.soporteAccion, b.getAttribute("aria-controls")]);
    revisar(contraer[0] === "Contraer la barra" && contraer[1] === "secciones-del-panel", `${d}: el botón de contraer lleva sus atributos (${contraer.join(", ")})`);
    // Lo que el front necesita de su barra: la insignia de novedad, el nombre corto y sus atributos (soporte).
    const extra = await pagina.evaluate((sel) => {
      const n = document.querySelector(sel);
      const ped = n.querySelector("[data-seccion=pedidos]");
      const ins = ped?.querySelector(".mk-barra-insignia");
      const cc = n.querySelector("[data-seccion=clientes-cuenta]");
      const visible = (e) => Boolean(e) && e.getBoundingClientRect().width > 1 && getComputedStyle(e).visibility !== "hidden";
      return {
        insignia: ins?.textContent, insigniaVisible: visible(ins), novedad: ped?.hasAttribute("data-novedad"),
        corto: cc?.querySelector(".mk-barra-nombre [aria-hidden=true]")?.textContent, completo: cc?.querySelector(".mk-barra-oculto")?.textContent,
        soporte: n.querySelector("[data-seccion=agenda]")?.dataset.soporteAccion,
      };
    }, barra);
    revisar(extra.insignia === "3" && extra.insigniaVisible && extra.novedad, `${d}: la insignia de novedad se ve en la barra abierta (${JSON.stringify(extra)})`);
    revisar(extra.corto === "Con cuenta" && extra.completo === "Clientes con cuenta", `${d}: el nombre corto se ve y el completo queda para el lector`);
    revisar(extra.soporte === "Pestaña Agenda", `${d}: cada sección lleva sus atributos (data-soporte-accion)`);
    // Contraída: solo íconos, cada uno con su nombre y de 44 px.
    await pagina.click(`${barra} .mk-barra-contraer`);
    await pagina.waitForTimeout(350);
    const contraida = await pagina.$$eval(`${barra} .mk-barra-item`, (l) => l.map((b) => {
      const r = b.getBoundingClientRect(); const nombre = b.querySelector(".mk-barra-nombre");
      return { etiqueta: b.getAttribute("aria-label"), titulo: b.title, ancho: r.width, alto: r.height, nombreVisible: nombre ? nombre.getBoundingClientRect().width > 1 : false };
    }));
    revisar(contraida.length === 41 && contraida.every((x) => x.etiqueta && x.titulo.startsWith(x.etiqueta) && !x.nombreVisible), `${d}: contraída, solo íconos y cada uno con su nombre (aria-label y title)`);
    const tituloContraida = await pagina.$eval(`${barra} [data-seccion=exclusiva]`, (b) => b.title);
    revisar(tituloContraida === "Página exclusiva. No está en tu pack.", `${d}: contraída, lo que no está en el pack lo dice con su nombre (${tituloContraida})`);
    const punto = await pagina.$eval(`${barra} [data-seccion=pedidos]`, (b) => {
      const v = (e) => Boolean(e) && e.getBoundingClientRect().width > 1 && getComputedStyle(e).display !== "none";
      return { punto: v(b.querySelector(".mk-barra-punto")), insignia: v(b.querySelector(".mk-barra-insignia")) };
    });
    revisar(punto.punto && !punto.insignia, `${d}: contraída, la novedad queda como un punto (${JSON.stringify(punto)})`);
    revisar(contraida.every((x) => x.ancho >= 44 && x.alto >= 44), `${d}: contraída, cada ícono mide al menos 44 px (${Math.min(...contraida.map((x) => Math.round(x.alto)))} de alto)`);
    revisar(await pagina.$eval(`${barra} .mk-barra-contraer`, (b) => b.getAttribute("aria-expanded") === "false"), `${d}: el botón de contraer dice que está contraída`);
    await pagina.click(`${barra} .mk-barra-contraer`);
    await pagina.waitForTimeout(200);
    // La firma de «taller»: la cinta de peligro arriba de la barra.
    await pagina.selectOption("[data-prueba=tema]", "taller");
    await pagina.waitForTimeout(500);
    const cinta = await pagina.$eval(barra, (n) => getComputedStyle(n).backgroundImage);
    revisar(/repeating-linear-gradient/.test(cinta), `${d}: con «taller», la barra lleva la cinta de su firma`);
    await pagina.hover(`${barra} [data-seccion=agenda]`);
    await pagina.waitForTimeout(200);
    const pasarTaller = await pagina.$eval(`${barra} [data-seccion=agenda]`, (b) => getComputedStyle(b).backgroundColor);
    // Con «taller» (su firma pone outline:none en la elegida), el foco de teclado sigue viéndose (revisión de la v0.9.0).
    await pagina.focus(`${barra} [data-seccion=resumen]`);
    await pagina.keyboard.press("ArrowDown");
    const foco = await pagina.evaluate(() => { const s = getComputedStyle(document.activeElement); return [document.activeElement.getAttribute("aria-current"), s.outlineStyle, s.outlineWidth]; });
    revisar(foco[0] === "page" && foco[1] === "solid" && foco[2] === "3px", `${d}: con «taller», el foco se ve en la elegida (${foco.join(", ")})`);
    revisar(/255, 106, 20|srgb 1 0\.41/.test(pasarTaller), `${d}: con «taller», al pasar una sección se tiñe del naranjo de su firma (${pasarTaller})`);
    revisar(errores.length === 0, `${d}: la barra sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // Colaboraciones, como la pantalla de verdad: filtrar, responder, borrar con confirmación y deshacer.
  {
    const { ctx, pagina, errores } = await abrirVivo(ESCRITORIO, "colaboraciones");
    revisar((await tarjetas(pagina)) === 4, `vivo: colaboraciones parte con 4 tarjetas`);
    await pagina.click(".pv-pestanas >> text=Nueva (1)");
    await pagina.waitForTimeout(400);
    revisar((await tarjetas(pagina)) === 1, `vivo: el filtro «Nueva» deja una`);
    await pagina.click(".pv-colab >> text=Responder por correo");
    await pagina.waitForTimeout(300);
    revisar((await pagina.$$eval(".pv-pestanas [role=tab], .pv-pestanas button", (l) => l.map((b) => b.textContent).join("|"))).includes("Conversando (2)"), `vivo: responder a una nueva la pasa a «Conversando»`);
    await pagina.click(".pv-pestanas >> text=Todas (4)");
    await pagina.waitForTimeout(400);
    await pagina.click(".pv-colab >> nth=0 >> text=Borrar");
    await pagina.waitForSelector("[role=alertdialog]");
    await pagina.click("[role=alertdialog] >> text=Sí, borrar");
    await pagina.waitForTimeout(1200);
    revisar((await tarjetas(pagina)) === 3, `vivo: borrar pide confirmar y la saca`);
    await pagina.click("text=Deshacer");
    await pagina.waitForTimeout(700);
    revisar((await tarjetas(pagina)) === 4, `vivo: «Deshacer» la devuelve`);
    await pagina.screenshot({ path: join(CAPTURAS, "vivo-colaboraciones.png") });
    revisar(errores.length === 0, `vivo: colaboraciones sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // Una sección vacía: la mano señala «Crear el primero», se llena y se celebra. Publicar la página también celebra.
  {
    const { ctx, pagina, errores } = await abrirVivo(ESCRITORIO, "sellos");
    revisar(Boolean(await pagina.$(".pv-principal .mk-mano")), `vivo: la sección vacía tiene la mano que señala`);
    await pagina.click("text=Crear el primero");
    await pagina.waitForTimeout(500);
    revisar((await pagina.$$eval(".pv-principal .pv-hoja", (l) => l.length)) === 3, `vivo: «Crear el primero» la llena con 3 ejemplos`);
    revisar(Boolean(await pagina.$(".mk-celebrar")), `vivo: y lo celebra`);
    await pagina.click('.pv-lado [data-seccion="pagina"]');
    await pagina.waitForTimeout(300);
    await pagina.click(".pv-principal >> text=Publicar");
    await pagina.waitForTimeout(400);
    revisar(Boolean(await pagina.$(".pv-vista-sello")), `vivo: publicar pone el sello «¡En vivo!» en la vista`);
    // La guía recorre el panel y se cierra con Esc.
    await pagina.waitForTimeout(2600);
    await pagina.click("text=¿Cómo se usa?");
    await pagina.waitForTimeout(700);
    revisar(Boolean(await pagina.$(".mk-guia [role=dialog]")), `vivo: «¿Cómo se usa?» abre la guía`);
    await pagina.keyboard.press("Escape");
    await pagina.waitForTimeout(500);
    revisar(!(await pagina.$(".mk-guia [role=dialog]")), `vivo: y Esc la cierra`);
    revisar(errores.length === 0, `vivo: vacíos, publicar y guía sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // Teléfono: sin correrse de lado, las secciones en una hoja desde abajo y botones de 44 px.
  {
    const { ctx, pagina, errores } = await abrirVivo(TELEFONO, "colaboraciones");
    const ancho = await pagina.evaluate(() => document.scrollingElement.scrollWidth);
    revisar(ancho <= TELEFONO.width, `vivo (teléfono): no se corre de lado (${ancho} px)`);
    const chicos = await pagina.$$eval(".pv-panel .pv-boton, .pv-panel select", (l) => l.filter((b) => b.getBoundingClientRect().height > 0 && b.getBoundingClientRect().height < 44).length);
    revisar(chicos === 0, `vivo (teléfono): botones de al menos 44 px de alto (${chicos} más chicos)`);
    await pagina.screenshot({ path: join(CAPTURAS, "vivo-telefono.png") });
    await pagina.click("[aria-label=Secciones]");
    await pagina.waitForTimeout(500);
    await pagina.click('.pv-hoja-menu [data-seccion="caja"]');
    await pagina.waitForTimeout(600);
    revisar(sinEspacios(await pagina.$eval(".pv-titulo", (h) => h.textContent)) === "Caja", `vivo (teléfono): la hoja de secciones lleva a «Caja»`);
    revisar(!(await pagina.$(".pv-hoja-menu")), `vivo (teléfono): y se cierra al elegir`);
    revisar(errores.length === 0, `vivo (teléfono): sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // El selector «Tema» (el catálogo, fase 2): el globo de Confirmar toma el radio de cada tema y vuelve.
  {
    const { ctx, pagina, errores } = await abrirVivo(ESCRITORIO, "colaboraciones");
    const radioGlobo = async () => {
      await pagina.click(".pv-colab >> nth=0 >> text=Borrar");
      await pagina.waitForSelector(".mk-confirmar-globo");
      await pagina.waitForTimeout(450);
      const r = await pagina.$eval(".mk-confirmar-globo", (g) => getComputedStyle(g).borderTopLeftRadius);
      await pagina.keyboard.press("Escape");
      await pagina.waitForTimeout(400);
      return r;
    };
    const antes = await radioGlobo();
    await pagina.selectOption("[data-prueba=tema]", "taller");
    const taller = await radioGlobo();
    const marca = await pagina.$eval(".pv-panel", (el) => el.dataset.mkTema);
    await pagina.selectOption("[data-prueba=tema]", "lamente");
    const despues = await radioGlobo();
    revisar(antes === "16px" && taller === "0px" && despues === "16px" && marca === "taller", `vivo: el selector «Tema» cambia la forma de las piezas y vuelve (${antes} → ${taller} → ${despues}, ${marca})`);
    revisar(errores.length === 0, `vivo: el selector sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // Movimiento reducido: nada se estampa ni gira.
  {
    const { ctx, pagina } = await abrirVivo(ESCRITORIO, "resumen", { reducido: true });
    const animadas = await pagina.$$eval(".pv-panel *", (l) => l.filter((el) => el.getAnimations().some((a) => a.playState === "running" && /^(pv-|mk-barra)/.test(String(a.animationName ?? "")))).length);
    revisar(animadas === 0, `vivo (reducido): ninguna animación propia del panel corre (${animadas})`);
    await ctx.close();
  }
}

/** Pone el ADN en :root (como hace el front) y espera un cuadro. */
async function ponerAdn(pagina, vars) {
  await pagina.evaluate((v) => {
    for (const [k, x] of Object.entries(v)) document.documentElement.style.setProperty(k, x);
  }, vars);
  await pagina.waitForTimeout(60);
}
const estiloDe = (pagina, sel, props) =>
  pagina.$eval(sel, (el, ps) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { ...Object.fromEntries(ps.map((p) => [p, s.getPropertyValue(p)])), alto: r.height }; }, props).catch(() => null);

if (parte("adn")) {
  const RARO = { "--mk-radio-tarjeta": "0px", "--mk-radio-boton": "0px", "--mk-sombra": "6px 6px 0 rgb(0, 0, 0)", "--mk-trazo": "3px solid rgb(0, 0, 0)", "--mk-fuente-texto": "Georgia", "--mk-fuente-titulo": "Georgia" };
  for (const [d, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir(tamano);
    await ponerAdn(pagina, RARO);
    // Confirmar (se dibuja aparte): el globo toma trazo, sombra, radio y letra; sus botones, el radio y siguen de 44 px.
    await pagina.$eval("[data-prueba=abrir-confirmar]", (b) => b.scrollIntoView({ block: "center" }));
    await pagina.click("[data-prueba=abrir-confirmar]");
    await pagina.waitForTimeout(450);
    const contenido = await estiloDe(pagina, ".mk-confirmar-contenido", ["font-family"]);
    revisar(Boolean(contenido) && contenido["font-family"].includes("Georgia"), `adn (${d}): Confirmar toma la letra del tema`);
    if (tamano === ESCRITORIO) {
      const globo = await estiloDe(pagina, ".mk-confirmar-globo", ["box-shadow", "border-top-width", "border-top-left-radius"]);
      revisar(Boolean(globo) && globo["box-shadow"].includes("6px 6px 0px") && globo["border-top-width"] === "3px" && globo["border-top-left-radius"] === "0px",
        `adn (${d}): el globo de Confirmar toma sombra, trazo y radio (${JSON.stringify(globo)})`);
    } else {
      const hoja = await estiloDe(pagina, "[role=alertdialog]", ["border-top-left-radius"]);
      revisar(Boolean(hoja) && hoja["border-top-left-radius"] === "0px", `adn (${d}): la hoja de Confirmar toma el radio (${JSON.stringify(hoja)})`);
    }
    const pregunta = await estiloDe(pagina, ".mk-confirmar-pregunta", ["font-family"]);
    revisar(Boolean(pregunta) && pregunta["font-family"].includes("Georgia"), `adn (${d}): el título de Confirmar toma la letra de títulos`);
    const boton = await estiloDe(pagina, ".mk-confirmar-botones button", ["border-top-left-radius"]);
    revisar(Boolean(boton) && boton["border-top-left-radius"] === "0px" && boton.alto >= 44, `adn (${d}): sus botones toman el radio y siguen de 44 px (${boton?.alto})`);
    await pagina.keyboard.press("Escape");
    await pagina.waitForTimeout(400);
    // Un aviso (se dibuja en body): toma el trazo y el radio de :root.
    await pagina.$eval("[data-prueba=aviso-hola]", (b) => b.scrollIntoView({ block: "center" }));
    await pagina.click("[data-prueba=aviso-hola]");
    await pagina.waitForTimeout(450);
    const aviso = await estiloDe(pagina, ".mk-aviso", ["border-top-width", "border-top-left-radius"]);
    revisar(Boolean(aviso) && aviso["border-top-width"] === "3px" && aviso["border-top-left-radius"] === "0px", `adn (${d}): el aviso toma el trazo y el radio (${JSON.stringify(aviso)})`);
    // Valores extremos: sin radio ni sombra, nada se rompe ni se achica.
    await ponerAdn(pagina, { "--mk-radio-boton": "0", "--mk-sombra": "none", "--mk-trazo": "0 none" });
    await pagina.click("[data-prueba=abrir-confirmar]");
    await pagina.waitForTimeout(450);
    const b2 = await estiloDe(pagina, ".mk-confirmar-botones button", ["border-top-left-radius"]);
    revisar(Boolean(b2) && b2.alto >= 44, `adn (${d}): con radio 0, sin sombra ni trazo, los botones siguen de 44 px`);
    await pagina.keyboard.press("Escape");
    await pagina.waitForTimeout(300);
    revisar(errores.length === 0, `adn (${d}): sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // Como lo hará el front (encargo del ADN): la forma va en <body>, no en :root. Las piezas que se dibujan en <body>
  // (avisos, Confirmar) la toman igual. Hallazgo de la revisión final de la v0.7.0.
  {
    const { ctx, pagina, errores } = await abrir(ESCRITORIO);
    await pagina.evaluate(() => {
      for (const [k, v] of Object.entries({ "--mk-trazo": "3px solid rgb(0, 0, 0)", "--mk-radio-tarjeta": "0px" })) document.body.style.setProperty(k, v);
    });
    await pagina.$eval("[data-prueba=aviso-hola]", (b) => b.scrollIntoView({ block: "center" }));
    await pagina.click("[data-prueba=aviso-hola]");
    await pagina.waitForTimeout(450);
    const aviso = await estiloDe(pagina, ".mk-aviso", ["border-top-width", "border-top-left-radius"]);
    revisar(Boolean(aviso) && aviso["border-top-width"] === "3px" && aviso["border-top-left-radius"] === "0px", `adn: con la forma en <body>, el aviso la toma (${JSON.stringify(aviso)})`);
    await pagina.click("[data-prueba=abrir-confirmar]");
    await pagina.waitForTimeout(450);
    const globo = await estiloDe(pagina, ".mk-confirmar-globo", ["border-top-width", "border-top-left-radius"]);
    revisar(Boolean(globo) && globo["border-top-width"] === "3px" && globo["border-top-left-radius"] === "0px", `adn: con la forma en <body>, Confirmar la toma (${JSON.stringify(globo)})`);
    revisar(errores.length === 0, `adn: forma en <body> sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }

  // El ritmo: «quieto» no salta; «manga» es más rápido; con movimiento reducido manda lo de siempre (sin saltito).
  const saltito = async (ritmo, reducido = false) => {
    const { ctx, pagina } = await abrir(TELEFONO, { reducido });
    if (ritmo) await ponerAdn(pagina, ritmo);
    await pagina.$eval("[data-prueba=guardar-bien]", (b) => b.scrollIntoView({ block: "center" }));
    await pagina.evaluate(() => {
      const b = document.querySelector("[data-prueba=guardar-bien]");
      window.__animaciones = [];
      const animar = b.animate.bind(b);
      b.animate = (k, o) => { window.__animaciones.push({ k: JSON.parse(JSON.stringify(k)), o: JSON.parse(JSON.stringify(o)) }); return animar(k, o); };
    });
    await pagina.click("[data-prueba=guardar-bien]");
    await pagina.waitForTimeout(2200);
    const animaciones = await pagina.evaluate(() => window.__animaciones);
    await ctx.close();
    return animaciones;
  };
  const deHoy = await saltito(null);
  const quieto = await saltito({ "--mk-ritmo-tiempo": "1", "--mk-ritmo-fuerza": "0" });
  const manga = await saltito({ "--mk-ritmo-tiempo": "0.85", "--mk-ritmo-fuerza": "1.4" });
  const reducidoManga = await saltito({ "--mk-ritmo-tiempo": "0.85", "--mk-ritmo-fuerza": "1.4" }, true);
  const escalas = (l) => l.flatMap((a) => a.k.map((x) => x.scale).filter(Boolean));
  revisar(deHoy.length === 1 && escalas(deHoy).includes("1.08"), `adn: sin ritmo, el saltito es el de siempre (${JSON.stringify(escalas(deHoy))})`);
  revisar(quieto.length === 0 || escalas(quieto).every((s) => Number(s) === 1), `adn: con ritmo «quieto», el botón no salta (${JSON.stringify(escalas(quieto))})`);
  const dHoy = deHoy[0]?.o?.duration ?? 0;
  const dManga = manga[0]?.o?.duration ?? 0;
  revisar(dHoy > 0 && Math.abs(dManga / dHoy - 0.85) <= 0.05 && escalas(manga).some((s) => Number(s) > 1.08), `adn: con ritmo «manga», más rápido y más marcado (${dManga} ms, ${JSON.stringify(escalas(manga))})`);
  revisar(reducidoManga.length === 0, `adn: con movimiento reducido manda lo de siempre, aunque el ritmo sea «manga» (${reducidoManga.length})`);

  // El título de Vacio (en el cómic) toma la letra de títulos.
  const ctx = await navegador.newContext({ viewport: ESCRITORIO });
  const pagina = await ctx.newPage();
  await pagina.goto(`${base}/#comic`);
  await pagina.waitForSelector(".mk-vacio-titulo");
  await ponerAdn(pagina, { "--mk-fuente-titulo": "Georgia" });
  const vacio = await estiloDe(pagina, ".mk-vacio-titulo", ["font-family"]);
  revisar(Boolean(vacio) && vacio["font-family"].includes("Georgia"), `adn: el título de Vacio toma la letra de títulos`);
  await ctx.close();
}

// Fase 3 de «Un solo motor»: las piezas del panel (IconoCaja, BotonPanel, Pastilla), comparadas con las del front.
const PROPS = ["borderTopWidth", "borderTopStyle", "borderTopColor", "borderTopLeftRadius", "boxShadow", "backgroundColor", "color", "fontSize", "fontWeight", "paddingTop", "paddingLeft"];
// Un borde de ancho 0 no se ve: su estilo y su color no cuentan (el reseteo de Chakra pone `0 solid` en todo).
const PROPS_BARRA = [...PROPS, "textTransform", "letterSpacing", "outlineStyle", "outlineWidth", "outlineOffset", "opacity"];
const estilos = (pagina, sel, props = PROPS) => pagina.$eval(sel, (el, ps) => {
  const s = getComputedStyle(el); const r = el.getBoundingClientRect();
  const v = Object.fromEntries(ps.map((p) => [p, s[p]]));
  if (parseFloat(s.borderTopWidth) === 0) Object.assign(v, { borderTopStyle: "(sin borde)", borderTopColor: "(sin borde)" });
  return { ...v, alto: Math.round(r.height) };
}, props).catch(() => null);
if (parte("piezas-panel")) {
  for (const [d, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir(tamano);
    await pagina.$eval("[data-prueba=panel-piezas-panel]", (s) => s.scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(200);
    const altos = await pagina.$$eval("[data-prueba=piezas-panel] .mk-bp", (l) => l.map((b) => Math.round(b.getBoundingClientRect().height)));
    revisar(altos.length >= 4 && altos.every((a) => a >= 44), `piezas-panel (${d}): los botones miden al menos 44 px (${altos.join(", ")})`);
    // Se hunde al tocarlo (solo con transform).
    await pagina.$eval("[data-prueba=boton-grande]", (b) => b.scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(150);
    const caja = await pagina.$eval("[data-prueba=boton-grande]", (b) => b.getBoundingClientRect().toJSON());
    await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await pagina.mouse.down();
    await pagina.waitForTimeout(200);
    const hundido = await pagina.$eval("[data-prueba=boton-grande]", (b) => getComputedStyle(b).transform);
    await pagina.mouse.up();
    revisar(hundido !== "none" && /matrix\(1, 0, 0, 1, 3, 3\)/.test(hundido), `piezas-panel (${d}): el botón grande se hunde al tocarlo (${hundido})`);
    // Con «taller»: su trazo de 3 px y su esquina de 2 px.
    await pagina.selectOption("[data-prueba=tema-piezas]", "taller");
    await pagina.waitForTimeout(150);
    const taller = await estilos(pagina, "[data-prueba=boton-grande]");
    revisar(taller?.borderTopWidth === "3px" && taller?.borderTopLeftRadius === "2px", `piezas-panel (${d}): con «taller» toma su trazo y su esquina (${taller?.borderTopWidth}, ${taller?.borderTopLeftRadius})`);
    // Con «cancha», su firma inclina el título de la sección.
    await pagina.selectOption("[data-prueba=tema-piezas]", "cancha");
    await pagina.waitForTimeout(400);
    const inclinado = await pagina.$eval("[data-prueba=cabeza-seccion] h2", (h) => getComputedStyle(h).transform).catch(() => "none");
    revisar(inclinado !== "none", `piezas-panel (${d}): con «cancha», la firma inclina el título (${inclinado})`);
    await pagina.selectOption("[data-prueba=tema-piezas]", "lamente");
    await pagina.waitForTimeout(150);
    // La grilla: una columna en el teléfono, dos desde 1024 px; un título larguísimo no corre el ancho.
    const columnas = await pagina.$eval("[data-prueba=grilla]", (g) => getComputedStyle(g).gridTemplateColumns.split(" ").length);
    revisar(columnas === (tamano.width >= 1024 ? 2 : 1), `piezas-panel (${d}): la grilla tiene ${columnas} columna(s)`);
    const ancho = await pagina.evaluate(() => document.scrollingElement.scrollWidth);
    const larga = await pagina.$eval("[data-prueba=tarjeta-larga]", (el) => Math.round(el.getBoundingClientRect().right));
    revisar(ancho <= tamano.width && larga <= tamano.width, `piezas-panel (${d}): un título larguísimo no corre el ancho (${larga} de ${tamano.width})`);
    // El selector: su etiqueta y su ayuda accesibles.
    const sel = await pagina.$eval("[data-prueba=selector]", (s) => ({ etiqueta: s.labels?.[0]?.textContent ?? "", ayuda: (s.getAttribute("aria-describedby") ?? "").split(" ").map((id) => document.getElementById(id)?.textContent ?? "").join(" ") }));
    revisar(sel.etiqueta.includes("domingos") && sel.ayuda.includes("Sale en tu página"), `piezas-panel (${d}): el selector tiene su etiqueta y su ayuda (${JSON.stringify(sel)})`);
    // La cabecera: en el teléfono la acción baja bajo el título; desde 768 px va a la derecha (como en el front).
    const cab = await pagina.$eval("[data-prueba=cabeza-seccion]", (c) => {
      const lado = c.querySelector(".mk-cabeza-seccion-lado").getBoundingClientRect();
      const acc = c.querySelector(".mk-cabeza-seccion-accion").getBoundingClientRect();
      return { abajo: acc.top >= lado.bottom - 1, ladoAncho: Math.round(lado.width), ancho: Math.round(c.getBoundingClientRect().width) };
    });
    revisar(tamano.width >= 768 ? !cab.abajo : cab.abajo && cab.ladoAncho >= cab.ancho - 1, `piezas-panel (${d}): la acción de la cabecera va ${tamano.width >= 768 ? "a la derecha" : "abajo y el título usa todo el ancho"} (${JSON.stringify(cab)})`);
    // Un estado larguísimo no corre el ancho (revisión de la v0.9.0).
    const estadoLargo = await pagina.$eval("[data-prueba=tarjeta-larga]", (t) => {
      const p = t.querySelector(".mk-pastilla").getBoundingClientRect();
      return { derecha: Math.round(p.right), tarjeta: Math.round(t.getBoundingClientRect().right) };
    });
    revisar(estadoLargo.derecha <= estadoLargo.tarjeta, `piezas-panel (${d}): un estado larguísimo no se sale de la tarjeta (${estadoLargo.derecha} de ${estadoLargo.tarjeta})`);
    // El selector tiene la letra de la página y su relleno, no el del navegador (revisión de la v0.9.0).
    const select = await pagina.$eval("[data-prueba=selector] select, select[data-prueba=selector]", (s) => ({ letra: getComputedStyle(s).fontSize, relleno: parseFloat(getComputedStyle(s).paddingLeft), cuerpo: getComputedStyle(s.closest(".mk-campo")).fontSize }));
    revisar(select.letra === select.cuerpo && select.relleno >= 10, `piezas-panel (${d}): el selector tiene la letra de la página y su relleno (${JSON.stringify(select)})`);
    // v0.9.1: una sección puede llevar su título en h3, con la misma marca y la misma letra.
    const h3 = await pagina.$eval("[data-prueba=seccion-h3]", (s) => {
      const t = s.querySelector(".mk-seccion-titulo");
      const h2 = document.querySelector("[data-prueba=seccion] .mk-seccion-titulo");
      return { etiqueta: t?.tagName, marca: t?.dataset.mkAdorno, h2: s.querySelectorAll("h2").length, letra: t && getComputedStyle(t).fontSize, otra: h2 && getComputedStyle(h2).fontSize };
    });
    revisar(h3.etiqueta === "H3" && h3.marca === "titulo" && h3.h2 === 0 && h3.letra === h3.otra, `piezas-panel (${d}): una sección con nivel 3 lleva su título en h3, con su marca y la misma letra (${JSON.stringify(h3)})`);
    // v0.9.1: un enlace con los estilos de BotonPanel se ve como el botón chico.
    const enlace = await pagina.evaluate(() => {
      const a = document.querySelector("[data-prueba=enlace-chico]");
      const b = document.querySelector("[data-prueba=boton-chico]");
      const p = ["borderTopLeftRadius", "borderTopWidth", "paddingLeft", "fontSize", "fontWeight", "minHeight", "textDecorationLine"];
      return p.filter((x) => getComputedStyle(a)[x] !== getComputedStyle(b)[x]);
    });
    revisar(enlace.length === 0, `piezas-panel (${d}): un enlace con los estilos de BotonPanel se ve como el botón chico${enlace.length ? ` (distinto: ${enlace.join(", ")})` : ""}`);
    // Revisión de la v0.9.1: una etiqueta con aria-disabled se ve deshabilitada, y con el foco en su radio se marca.
    const apagada = await pagina.$eval("[data-prueba=opcion-deshabilitada]", (l) => [getComputedStyle(l).opacity, getComputedStyle(l).cursor]);
    revisar(apagada[0] === "0.55" && apagada[1] === "not-allowed", `piezas-panel (${d}): una etiqueta con aria-disabled se ve deshabilitada (${apagada.join(", ")})`);
    await pagina.focus("[data-prueba=opcion-chica] input");
    await pagina.keyboard.press("Shift");
    const marcada = await pagina.$eval("[data-prueba=opcion-chica]", (l) => [getComputedStyle(l).outlineStyle, getComputedStyle(l).outlineWidth]);
    revisar(marcada[0] === "solid" && marcada[1] === "3px", `piezas-panel (${d}): con el foco en su radio, la etiqueta se marca (${marcada.join(", ")})`);
    // La sección separa lo que lleva adentro (como el Bloque de la guía del front: 1rem).
    const separa = await pagina.$eval("[data-prueba=seccion]", (s) => getComputedStyle(s).rowGap);
    revisar(separa === "16px", `piezas-panel (${d}): la sección separa lo que lleva adentro (${separa})`);
    revisar(errores.length === 0, `piezas-panel (${d}): sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // Movimiento reducido: los botones del panel no se levantan ni se hunden (revisión de la v0.9.0).
  {
    const { ctx, pagina } = await abrir(ESCRITORIO, { reducido: true });
    await pagina.$eval("[data-prueba=panel-piezas-panel]", (s) => s.scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(200);
    const quieto = [];
    for (const sel of ["[data-prueba=boton-grande]", "[data-prueba=boton-chico]"]) {
      await pagina.hover(sel);
      await pagina.waitForTimeout(150);
      const pasar = await pagina.$eval(sel, (b) => getComputedStyle(b).transform);
      await pagina.mouse.down();
      await pagina.waitForTimeout(150);
      const tocar = await pagina.$eval(sel, (b) => getComputedStyle(b).transform);
      await pagina.mouse.up();
      quieto.push(`${pasar}/${tocar}`);
    }
    revisar(quieto.every((x) => x === "none/none"), `piezas-panel (reducido): los botones no se levantan ni se hunden (${quieto.join(", ")})`);
    await ctx.close();
  }
  // Contra las del front de verdad (su guía en local, con «lamente»): mismos bordes, esquinas, sombras, colores y letra.
  const FRONT = "http://localhost:5181/guia?tema=lamente";
  const ctxF = await navegador.newContext({ viewport: ESCRITORIO });
  const front = await ctxF.newPage();
  const hayFront = await front.goto(FRONT, { timeout: 8000 }).then(() => front.waitForSelector(".lm-mod-boton", { timeout: 8000 })).then(() => true).catch(() => false);
  if (!hayFront) console.log("· piezas-panel: la guía del front no está en local (localhost:5181) o no muestra sus piezas; se salta la comparación con el front");
  else {
    await front.waitForTimeout(1500);
    const { ctx, pagina } = await abrir(ESCRITORIO);
    await pagina.$eval("[data-prueba=panel-piezas-panel]", (s) => s.scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(200);
    for (const [nombre, delFront, nuestro] of [
      ["el botón grande", ".lm-mod-boton:not(:disabled)", "[data-prueba=boton-grande]"],
      ["el botón chico", ".lm-mod-chico:not([data-tono]):not(:disabled)", "[data-prueba=boton-chico]"],
      ["el chico principal", '.lm-mod-chico[data-tono="principal"]', "[data-prueba=boton-principal]"],
      ["el chico de peligro", '.lm-mod-chico[data-tono="peligro"]', "[data-prueba=boton-peligro]"],
      ["el ícono", ".lm-mod-icono", "[data-prueba=icono-caja]"],
      ["el estado verde", '.lm-mod-estado[data-tono="verde"]', "[data-prueba=pastilla-verde]"],
      ["la tarjeta", ".lm-mod-tarjeta", "[data-prueba=tarjeta-fila]"],
      ["el título de la tarjeta", ".lm-mod-tarjeta .lm-mod-nombre", "[data-prueba=tarjeta-fila] .mk-tarjeta-fila-nombre"],
      ["el título de la sección", ".lm-mod-titulo", "[data-prueba=cabeza-seccion] h2"],
      ["la bajada de la sección", ".lm-mod-bajada", "[data-prueba=cabeza-seccion] .mk-bajada-seccion"],
    ]) {
      const a = await estilos(front, delFront);
      const b = await estilos(pagina, nuestro);
      const distintos = a && b ? PROPS.filter((p) => a[p] !== b[p]).map((p) => `${p}: front «${a[p]}», motion-kit «${b[p]}»`) : ["falta"];
      revisar(distintos.length === 0, `piezas-panel: ${nombre} se ve como el del front${distintos.length ? ` (${distintos.join("; ")})` : ""}`);
    }
    // La barra lateral (revisión de la v0.9.0): la de muestra de la guía del front, abierta y contraída.
    await pagina.$eval("[data-prueba=barra-muestra]", (s) => s.scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(500);
    const FB = ".lm-barra:not([data-colapsada])";
    const FC = ".lm-barra[data-colapsada]";
    const NB = "[data-prueba=barra-muestra]";
    const NC = "[data-prueba=barra-contraida]";
    const item = ':not([aria-selected="true"]):not([data-sin-modulo])';
    const SIN_COLOR = PROPS_BARRA.filter((p) => p !== "color");
    for (const [nombre, delFront, nuestro, props] of [
      ["la barra", FB, NB],
      // El color del texto de las no elegidas es a propósito distinto: el front usa grises de Chakra (#52525b y, sin módulo,
      // #a1a1aa, que da ~2,5 sobre blanco); motion-kit, --mk-suave del tema.
      ["una sección de la barra", `${FB} [role=tab]${item}`, `${NB} .mk-barra-item:not([aria-current]):not([data-sin-modulo])`, SIN_COLOR],
      ["su ícono", `${FB} [role=tab]${item} .lm-icono`, `${NB} .mk-barra-item:not([aria-current]):not([data-sin-modulo]) .mk-icono-caja`],
      ["la sección elegida", `${FB} [role=tab][aria-selected="true"]`, `${NB} [aria-current=page]`, PROPS_BARRA],
      ["el ícono de la elegida", `${FB} [role=tab][aria-selected="true"] .lm-icono`, `${NB} [aria-current=page] .mk-icono-caja`],
      ["una sección sin módulo", `${FB} [role=tab][data-sin-modulo]`, `${NB} [data-sin-modulo]`, SIN_COLOR],
      ["el ícono sin módulo", `${FB} [role=tab][data-sin-modulo] .lm-icono`, `${NB} [data-sin-modulo] .mk-icono-caja`],
      ["el nombre de un grupo", `${FB} .lm-grupo`, `${NB} .mk-barra-grupo-nombre`, PROPS_BARRA],
      ["el grupo en la barra contraída", `${FC} .lm-grupo`, `${NC} .mk-barra-grupo-nombre`, ["height", "backgroundColor", "marginTop", "marginLeft"]],
      ["el ícono sin módulo en la barra contraída", `${FC} [role=tab][data-sin-modulo] .lm-icono`, `${NC} [data-sin-modulo] .mk-icono-caja`, ["opacity", "borderTopStyle"]],
    ]) {
      const ps = props ?? PROPS;
      const a = await estilos(front, delFront, ps);
      const b = await estilos(pagina, nuestro, ps);
      const distintos = a && b ? ps.filter((p) => a[p] !== b[p]).map((p) => `${p}: front «${a[p]}», motion-kit «${b[p]}»`) : [`falta (${a ? "nuestra" : "del front"})`];
      revisar(distintos.length === 0, `piezas-panel: ${nombre} se ve como en el front${distintos.length ? ` (${distintos.join("; ")})` : ""}`);
    }
    await ctx.close();
  }
  await ctxF.close();
}

// Fase 3: las conductas que el front tenía en su CSS, ahora en las piezas (SubirImagen, ListaViva, Campo).
const animaciones = (pagina) => pagina.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => a.animationName ?? ""));
if (parte("conductas")) {
  for (const reducido of [false, true]) {
    const d = reducido ? "conductas (reducido)" : "conductas";
    const { ctx, pagina, errores } = await abrir(ESCRITORIO, { reducido });
    // SubirImagen vacía: se levanta al pasar.
    await pagina.$eval("[data-prueba=subir-portada]", (s) => s.scrollIntoView({ block: "center" }));
    await pagina.hover("[data-prueba=subir-portada] .mk-subir-caja");
    await pagina.waitForTimeout(250);
    const alPasar = await pagina.$eval("[data-prueba=subir-portada] .mk-subir-caja", (c) => ({ t: getComputedStyle(c).transform, s: getComputedStyle(c).boxShadow }));
    revisar(reducido ? alPasar.t === "none" : alPasar.t === "matrix(1, 0, 0, 1, -2, -2)" && alPasar.s !== "none", `${d}: la foto vacía ${reducido ? "no se mueve" : "se levanta"} al pasar (${alPasar.t})`);
    // Arrastrando: se agranda y el ícono salta.
    await pagina.$eval("[data-prueba=subir-portada] .mk-subir-caja", (caja) => {
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array(4)], "f.png", { type: "image/png" }));
      caja.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: dt }));
      caja.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
    });
    await pagina.waitForTimeout(250);
    const arrastrando = await pagina.$eval("[data-prueba=subir-portada] .mk-subir-caja", (c) => getComputedStyle(c).transform);
    const salta = (await animaciones(pagina)).includes("mk-subir-salto");
    revisar(reducido ? !salta : /^matrix\(1\.03/.test(arrastrando) && salta, `${d}: al arrastrar, ${reducido ? "nada se mueve" : "se agranda y el ícono salta"} (${arrastrando}, salto ${salta})`);
    await pagina.$eval("[data-prueba=subir-portada] .mk-subir-caja", (caja) => caja.dispatchEvent(new DragEvent("dragleave", { bubbles: true, cancelable: true })));
    // Subiendo: la franja de luz la cruza (con transform); lista: la foto entra revelándose; Cambiar y Quitar en píldora.
    await soltar(pagina, "subir-logo");
    await pagina.waitForTimeout(150);
    const barrido = (await animaciones(pagina)).includes("mk-subir-barrido");
    revisar(reducido ? !barrido : barrido, `${d}: mientras sube, ${reducido ? "sin franja que se mueva" : "una franja de luz la cruza"}`);
    await pagina.waitForFunction(() => document.querySelector("[data-prueba=subir-logo] .mk-subir")?.dataset.estado === "lista", null, { timeout: 4000 }).catch(() => {});
    const revela = (await animaciones(pagina)).includes("mk-subir-revela");
    revisar(reducido ? !revela : revela, `${d}: la foto ${reducido ? "aparece sin moverse" : "entra revelándose"}`);
    const pildora = await pagina.$eval("[data-prueba=subir-logo] .mk-subir-acciones button", (b) => getComputedStyle(b).borderTopLeftRadius).catch(() => "falta");
    revisar(pildora === "999px", `${d}: Cambiar y Quitar van en píldora (${pildora})`);
    // ListaViva: el destello es un marco de cartel y tinta que late.
    await pagina.$eval("[data-prueba=panel-llega]", (s) => s.scrollIntoView({ block: "center" }));
    await pagina.click("[data-prueba=llega]");
    await pagina.waitForTimeout(80);
    const destello = await pagina.$eval("[data-mk-destello]", (h) => getComputedStyle(h).boxShadow).catch(() => "");
    const late = (await animaciones(pagina)).includes("mk-lista-latido");
    revisar(/3px/.test(destello) && /5px/.test(destello) && (reducido ? !late : late), `${d}: lo que llega trae un marco ${reducido ? "quieto" : "que late"} (${destello.slice(0, 60)}…)`);
    // Campo: se levanta al pasar y al escribir; deshabilitado, punteado; el error con su «!»; las casillas, del acento.
    await pagina.$eval("[data-prueba=campo]", (s) => s.scrollIntoView({ block: "center" }));
    await pagina.hover("[data-prueba=campo-input]");
    await pagina.waitForTimeout(200);
    const pasar = await pagina.$eval("[data-prueba=campo-input]", (i) => getComputedStyle(i).boxShadow);
    await pagina.focus("[data-prueba=campo-input]");
    await pagina.keyboard.press("a");
    await pagina.waitForTimeout(250);
    const foco = await pagina.$eval("[data-prueba=campo-input]", (i) => getComputedStyle(i).transform);
    revisar(pasar !== "none" && (reducido ? foco === "none" : foco === "matrix(1, 0, 0, 1, -2, -2)"), `${d}: el campo marca al pasar y ${reducido ? "no se mueve" : "se levanta"} al escribir (${foco})`);
    const punteado = await pagina.$eval("[data-prueba=campo-deshabilitado]", (i) => getComputedStyle(i).borderTopStyle);
    revisar(punteado === "dashed", `${d}: un campo deshabilitado se ve punteado (${punteado})`);
    await pagina.click("[data-prueba=error-uno]");
    await pagina.waitForTimeout(200);
    const senal = await pagina.$eval("[data-prueba=campo] .mk-campo-error", (e) => getComputedStyle(e, "::before").content).catch(() => "");
    revisar(senal === '"!"', `${d}: el error lleva su señal «!» (${senal})`);
    const casilla = await pagina.$eval("[data-prueba=campo-casilla]", (i) => getComputedStyle(i).accentColor);
    revisar(casilla !== "auto", `${d}: las casillas usan el color del acento (${casilla})`);
    revisar(errores.length === 0, `${d}: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : `\nTodo bien. Capturas en ${CAPTURAS}`);
process.exit(fallas ? 1 : 0);
