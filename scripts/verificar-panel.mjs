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
const PARTES = ["tema", "imagen", "avisos", "cargando", "llega", "vivo", "adn"];
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
    const nombres = await pagina.$$eval(".pv-lado .pv-item", (l) => l.map((b) => [b.dataset.seccion, [...b.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim()]));
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
    const animadas = await pagina.$$eval(".pv-panel *", (l) => l.filter((el) => el.getAnimations().some((a) => a.playState === "running" && String(a.animationName ?? "").startsWith("pv-"))).length);
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

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : `\nTodo bien. Capturas en ${CAPTURAS}`);
process.exit(fallas ? 1 : 0);
