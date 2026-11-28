// La prueba visual del cómic del panel (#comic, motion-kit/comic) y de las piezas del grupo 1 (#panel, motion-kit/interfaz).
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-comic.mjs [http://localhost:5173] [parte]`, donde la
// parte (opcional) es dibujos, boton, copiar, campo, confirmar, vacio, guia o celebrar. Capturas en <tmp>/mk-comic/.
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.argv.find((a) => /^https?:/.test(a)) ?? "http://localhost:5173";
const solo = process.argv.slice(2).find((a) => !/^https?:/.test(a));
const PARTES = ["dibujos", "boton", "copiar", "campo", "confirmar", "vacio", "guia", "celebrar"];
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
const CAPTURAS = join(tmpdir(), "mk-comic");
mkdirSync(CAPTURAS, { recursive: true });
const navegador = await chromium.launch();
const TELEFONO = { width: 390, height: 844 };
const ESCRITORIO = { width: 1280, height: 860 };

/** Abre una vitrina (#comic o #panel) con un tamaño y, si se pide, movimiento reducido; junta los errores. */
async function abrir(ruta, tamano, { reducido = false, permisos = [] } = {}) {
  const opciones = { viewport: tamano, reducedMotion: reducido ? "reduce" : "no-preference" };
  // Algunos motores (WebKit) no conocen todos los permisos: sin ellos, la prueba sigue y se salta lo que los necesita.
  let ctx = await navegador.newContext({ ...opciones, permissions: permisos });
  let pagina = await ctx.newPage().catch(() => null);
  let conPermisos = true;
  if (!pagina) {
    await ctx.close();
    ctx = await navegador.newContext(opciones);
    pagina = await ctx.newPage();
    conPermisos = false;
  }
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.goto(`${base}/${ruta}`);
  await pagina.waitForTimeout(400);
  return { ctx, pagina, errores, conPermisos };
}
/** Las animaciones vivas de un elemento y de lo que tiene adentro (WAAPI y CSS, sin transiciones). */
const animaciones = (pagina, selector) =>
  pagina.$eval(selector, (el) => el.getAnimations({ subtree: true }).filter((a) => !(a instanceof CSSTransition)).length).catch(() => -1);

if (parte("dibujos")) {
  for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir("#comic", tamano);
    const d = `dibujos (${nombre})`;
    await pagina.$eval("[data-prueba=direcciones]", (el) => el.scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(300);
    // La punta del dedo (PUNTA_MANO) cae sobre la uña en cada dirección.
    const PUNTA = { derecha: [0.973, 0.167], izquierda: [0.027, 0.167], arriba: [0.417, -0.223], abajo: [0.583, 0.723] };
    for (const [dir, [fx, fy]] of Object.entries(PUNTA)) {
      const r = await pagina.$eval(`[data-prueba=mano-${dir}]`, (el) => {
        const caja = el.getBoundingClientRect();
        // La caja sin girar: el ancho manda (el span mide ancho × ancho/2 antes del giro).
        const ancho = el.offsetWidth;
        const centro = { x: caja.left + caja.width / 2, y: caja.top + caja.height / 2 };
        const izq = centro.x - ancho / 2;
        const arr = centro.y - ancho / 4;
        const una = [...el.querySelectorAll("path")].find((p) => p.getAttribute("fill") === "#fff4ec").getBoundingClientRect();
        return { izq, arr, ancho, una: { x: una.left, y: una.top, w: una.width, h: una.height } };
      });
      const px = r.izq + fx * r.ancho;
      const py = r.arr + fy * r.ancho;
      const dentro = px >= r.una.x - 6 && px <= r.una.x + r.una.w + 6 && py >= r.una.y - 6 && py <= r.una.y + r.una.h + 6;
      revisar(dentro, `${d}: la punta de la mano «${dir}» cae en la uña (${Math.round(px)},${Math.round(py)})`);
    }
    // La que toca se mueve y su pop aparece; el texto largo del estallido no se sale.
    revisar((await animaciones(pagina, "[data-prueba=mano-toca]")) >= 2, `${d}: la mano que toca se mueve y salen las rayitas de pop`);
    revisar((await animaciones(pagina, "[data-prueba=mano-derecha]")) === 0, `${d}: la mano quieta no se mueve`);
    const cabe = await pagina.$eval("[data-prueba=estallido-largo] > span", (s) => {
      const r = document.createRange();
      r.selectNodeContents(s);
      const t = r.getBoundingClientRect();
      const e = s.parentElement.getBoundingClientRect();
      return t.left >= e.left && t.right <= e.right;
    });
    revisar(cabe, `${d}: «¡Bienvenidos!» no se sale del estallido`);
    await pagina.screenshot({ path: join(CAPTURAS, `dibujos-${tamano.width}.png`) });
    revisar(errores.length === 0, `${d}: sin errores en la página${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  const { ctx, pagina } = await abrir("#comic", TELEFONO, { reducido: true });
  revisar((await animaciones(pagina, "[data-prueba=mano-toca]")) === 0, "dibujos (reducido): la mano queda quieta");
  await ctx.close();
}

/** Las propiedades que animan las animaciones de un elemento (por ejemplo «scale», «translate», «transform»). */
const propiedadesAnimadas = (pagina, selector) =>
  pagina
    .$eval(selector, (el) =>
      el.getAnimations().filter((a) => !(a instanceof CSSTransition)).flatMap((a) => (a.effect?.getKeyframes?.() ?? []).flatMap((k) => Object.keys(k).filter((p) => !["offset", "easing", "composite", "computedOffset"].includes(p)))),
    )
    .catch(() => []);
/** El texto que se ve y se lee (sin lo escondido con aria-hidden, como los textos que fijan el ancho del botón). */
const texto = (pagina, selector) =>
  pagina.$eval(selector, (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll("[aria-hidden=true]").forEach((x) => x.remove());
    return c.textContent?.trim() ?? "";
  }).catch(() => "");
const ancho = (pagina, selector) => pagina.$eval(selector, (el) => el.getBoundingClientRect().width).catch(() => 0);
async function esperarTexto(pagina, selector, quiero, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if ((await texto(pagina, selector)).includes(quiero)) return Date.now() - t0;
    await pagina.waitForTimeout(30);
  }
  return -1;
}

if (parte("boton")) {
  for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir("#panel-piezas", tamano);
    const d = `boton (${nombre})`;
    const bien = "[data-prueba=guardar-bien]";
    const mal = "[data-prueba=guardar-mal]";
    await pagina.$eval("[data-prueba=panel-guardar]", (el) => el.scrollIntoView({ block: "center" }));
    const anchos = [await ancho(pagina, bien)];

    // Sale bien: guardando (ocupado, con anillo; no se puede volver a mandar) → ✓ Guardado (saltito con scale) → vuelve.
    await pagina.click(bien);
    await pagina.waitForTimeout(80);
    revisar((await texto(pagina, bien)).includes("Guardando…"), `${d}: al tocar, dice «Guardando…»`);
    revisar(await pagina.$eval(bien, (el) => el.getAttribute("aria-busy") === "true" && Boolean(el.querySelector(".mk-guardar-anillo"))), `${d}: mientras guarda, aria-busy y el anillo`);
    anchos.push(await ancho(pagina, bien));
    await pagina.click(bien, { force: true });
    await pagina.waitForTimeout(80);
    revisar((await texto(pagina, "[data-prueba=llamadas-bien]")) === "1", `${d}: un segundo toque mientras guarda no vuelve a mandar`);
    const tardo = await esperarTexto(pagina, bien, "✓ Guardado");
    revisar(tardo >= 0, `${d}: al terminar, «✓ Guardado»`);
    const props = await propiedadesAnimadas(pagina, bien);
    revisar(props.includes("scale") && !props.includes("transform"), `${d}: el saltito anima «scale», no «transform» (convive con el botón que se hunde): ${props.join(", ")}`);
    anchos.push(await ancho(pagina, bien));
    revisar(Math.max(...anchos) - Math.min(...anchos) <= 1, `${d}: el ancho no salta entre estados (${anchos.map(Math.round).join(", ")})`);
    await pagina.screenshot({ path: join(CAPTURAS, `boton-bien-${tamano.width}.png`) });
    // En «✓ Guardado» se puede volver a tocar.
    await pagina.click(bien);
    await pagina.waitForTimeout(80);
    revisar((await texto(pagina, "[data-prueba=llamadas-bien]")) === "2", `${d}: en «✓ Guardado» se puede volver a guardar`);
    await esperarTexto(pagina, bien, "✓ Guardado");
    const vuelve = await esperarTexto(pagina, bien, "Guardar", 2400);
    revisar(vuelve >= 1400 && (await texto(pagina, bien)) === "Guardar", `${d}: a los 1,6 s vuelve a «Guardar» (${vuelve} ms)`);

    // Sale mal: «No se pudo» con sacudida (translate) y vuelve a los 2 s; se puede reintentar.
    await pagina.click(mal);
    revisar((await esperarTexto(pagina, mal, "No se pudo")) >= 0, `${d}: si falla, «No se pudo»`);
    const propsMal = await propiedadesAnimadas(pagina, mal);
    revisar(propsMal.includes("translate") && !propsMal.includes("transform"), `${d}: la sacudida anima «translate»: ${propsMal.join(", ")}`);
    await pagina.screenshot({ path: join(CAPTURAS, `boton-mal-${tamano.width}.png`) });
    await pagina.click(mal);
    await pagina.waitForTimeout(80);
    revisar((await texto(pagina, "[data-prueba=llamadas-mal]")) === "2", `${d}: en «No se pudo» se puede reintentar`);

    // Con onClick propio: un segundo toque mientras guarda no lo vuelve a llamar.
    await pagina.click("[data-prueba=guardar-onclick]");
    await pagina.waitForTimeout(60);
    await pagina.click("[data-prueba=guardar-onclick]", { force: true });
    await pagina.waitForTimeout(60);
    revisar((await texto(pagina, "[data-prueba=onclicks]")) === "1", `${d}: mientras guarda, su onClick no vuelve a correr`);

    // Desmontarlo mientras guarda (cambiar de sección) no deja errores.
    await pagina.click("[data-prueba=guardar-desmonta]");
    await pagina.waitForTimeout(80);
    await pagina.click("[data-prueba=cambiar-seccion]");
    await pagina.waitForTimeout(2400);
    revisar(errores.length === 0, `${d}: sin errores (también al desmontarlo mientras guarda)${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  const { ctx, pagina } = await abrir("#panel-piezas", TELEFONO, { reducido: true });
  await pagina.click("[data-prueba=guardar-bien]");
  await pagina.waitForTimeout(800);
  const reducido = await propiedadesAnimadas(pagina, "[data-prueba=guardar-bien]");
  revisar(reducido.length === 0, `boton (reducido): sin saltito ni sacudida (${reducido.join(", ")})`);
  await ctx.close();
}

if (parte("copiar")) {
  for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores, conPermisos } = await abrir("#panel-piezas", tamano, { permisos: ["clipboard-read", "clipboard-write"] });
    const d = `copiar (${nombre})`;
    await pagina.$eval("[data-prueba=panel-copiar-campo]", (el) => el.scrollIntoView({ block: "center" }));
    await pagina.click("[data-prueba=copiar]");
    await pagina.waitForTimeout(200);
    const globo = await pagina.$("[data-prueba=copiar] ~ .mk-copiar-globo, .mk-copiar .mk-copiar-globo");
    revisar(Boolean(globo) && (await globo.isVisible()), `${d}: sale el globo al copiar (≤ 200 ms)`);
    revisar((await globo?.textContent())?.includes("¡Copiado!") ?? false, `${d}: el globo dice «¡Copiado!»`);
    const anuncio = await pagina.$$eval("[aria-live=polite]", (l) => l.map((x) => x.textContent).join("|"));
    revisar(anuncio.includes("¡Copiado!"), `${d}: se anuncia «¡Copiado!»`);
    if (conPermisos) revisar((await pagina.evaluate(() => navigator.clipboard.readText())) === "https://lamente.cl/cami-viaja", `${d}: el portapapeles tiene el link`);
    else console.log(`· ${d}: este motor no deja leer el portapapeles; se salta esa revisión`);
    await pagina.screenshot({ path: join(CAPTURAS, `copiar-${tamano.width}.png`) });
    await pagina.waitForTimeout(1500);
    revisar(!(await pagina.$(".mk-copiar-globo")), `${d}: el globo se va a los 1,4 s`);
    revisar(errores.length === 0, `${d}: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  // Con el portapapeles bloqueado y sin execCommand: «Cópialo a mano».
  const { ctx, pagina } = await abrir("#panel-piezas", TELEFONO);
  await pagina.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("bloqueado")) }, configurable: true });
    document.execCommand = () => false;
  });
  await pagina.$eval("[data-prueba=panel-copiar-campo]", (el) => el.scrollIntoView({ block: "center" }));
  await pagina.click("[data-prueba=copiar]");
  await pagina.waitForTimeout(250);
  revisar(((await pagina.$eval(".mk-copiar-globo", (g) => g.textContent).catch(() => "")) ?? "").includes("Cópialo a mano"), "copiar (bloqueado): dice «Cópialo a mano»");
  await ctx.close();
}

if (parte("campo")) {
  for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir("#panel-piezas", tamano);
    const d = `campo (${nombre})`;
    const input = "[data-prueba=campo-input]";
    await pagina.$eval("[data-prueba=panel-copiar-campo]", (el) => el.scrollIntoView({ block: "center" }));
    // La etiqueta enfoca el control.
    await pagina.click("[data-prueba=campo] label");
    revisar(await pagina.$eval(input, (el) => document.activeElement === el), `${d}: tocar la etiqueta enfoca el campo`);
    revisar((await pagina.$eval(input, (el) => el.getAttribute("aria-invalid"))) === "false", `${d}: sin error, aria-invalid=false`);
    const ayuda = await pagina.$eval(input, (el) => (el.getAttribute("aria-describedby") ?? "").split(" ").map((id) => document.getElementById(id)?.textContent).join("|"));
    revisar(ayuda.includes("Como lo ven tus clientes."), `${d}: la ayuda va en aria-describedby`);
    // Error: aria-invalid, describedby al error con role=alert, borde rojo y una sacudida.
    await pagina.click("[data-prueba=error-uno]");
    await pagina.waitForTimeout(60);
    const err = await pagina.$eval(input, (el) => {
      const ids = (el.getAttribute("aria-describedby") ?? "").split(" ");
      const e = ids.map((id) => document.getElementById(id)).find((x) => x?.getAttribute("role") === "alert");
      return { invalido: el.getAttribute("aria-invalid"), texto: e?.textContent ?? "", borde: getComputedStyle(el).borderTopColor, sacude: e ? e.getAnimations().filter((a) => !(a instanceof CSSTransition)).length : 0 };
    });
    revisar(err.invalido === "true", `${d}: con error, aria-invalid=true`);
    revisar(err.texto.includes("Escribe el nombre de tu negocio."), `${d}: el error con role=alert va en aria-describedby`);
    revisar(/214, 69, 69/.test(err.borde), `${d}: el borde del campo se pone rojo (${err.borde})`);
    revisar(err.sacude === 1, `${d}: el error se sacude una vez (${err.sacude})`);
    await pagina.screenshot({ path: join(CAPTURAS, `campo-${tamano.width}.png`) });
    await pagina.waitForTimeout(450);
    // El mismo error al repintar no vuelve a sacudir; uno nuevo sí.
    await pagina.click("[data-prueba=error-mismo]");
    await pagina.waitForTimeout(60);
    const sacudeMismo = await pagina.$eval("[data-prueba=campo] [role=alert]", (e) => e.getAnimations().filter((a) => !(a instanceof CSSTransition)).length).catch(() => -1);
    revisar(sacudeMismo === 0, `${d}: el mismo error no vuelve a sacudir`);
    await pagina.click("[data-prueba=error-otro]");
    await pagina.waitForTimeout(60);
    const sacudeOtro = await pagina.$eval("[data-prueba=campo] [role=alert]", (e) => e.getAnimations().filter((a) => !(a instanceof CSSTransition)).length).catch(() => -1);
    revisar(sacudeOtro === 1, `${d}: un error nuevo sí sacude`);
    await pagina.click("[data-prueba=error-nada]");
    await pagina.waitForTimeout(60);
    revisar(!(await pagina.$("[data-prueba=campo] [role=alert]")) && (await pagina.$eval(input, (el) => el.getAttribute("aria-invalid"))) === "false", `${d}: sin error, se va el mensaje`);
    revisar(errores.length === 0, `${d}: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  const { ctx, pagina } = await abrir("#panel-piezas", TELEFONO, { reducido: true });
  await pagina.$eval("[data-prueba=panel-copiar-campo]", (el) => el.scrollIntoView({ block: "center" }));
  await pagina.click("[data-prueba=error-uno]");
  await pagina.waitForTimeout(60);
  const quieto = await pagina.$eval("[data-prueba=campo] [role=alert]", (e) => e.getAnimations().filter((a) => !(a instanceof CSSTransition)).length).catch(() => -1);
  revisar(quieto === 0, "campo (reducido): el error no se sacude");
  await ctx.close();
}

const enfocado = (pagina) => pagina.evaluate(() => ({ texto: document.activeElement?.textContent?.trim() ?? "", dentro: Boolean(document.activeElement?.closest("[role=alertdialog]")), prueba: document.activeElement?.getAttribute("data-prueba") ?? "" }));
const cuenta = (pagina, cual) => pagina.$eval(`[data-prueba=${cual}]`, (el) => Number(el.textContent));

if (parte("confirmar")) {
  for (const [nombre, tamano] of [["escritorio", ESCRITORIO], ["teléfono", TELEFONO]]) {
    const { ctx, pagina, errores } = await abrir("#panel-piezas", tamano);
    const d = `confirmar (${nombre})`;
    await pagina.$eval("[data-prueba=panel-confirmar]", (el) => el.scrollIntoView({ block: "center" }));
    // Se abre con el teclado: así el botón queda enfocado en todos los motores (Safari no enfoca un botón al hacer clic).
    await pagina.focus("[data-prueba=abrir-confirmar]");
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(450);
    const dialogo = await pagina.$("[role=alertdialog]");
    revisar(Boolean(dialogo), `${d}: se abre un alertdialog`);
    revisar((await dialogo?.getAttribute("aria-label")) === "¿Borro la novedad?", `${d}: su nombre es la pregunta`);
    const f0 = await enfocado(pagina);
    revisar(f0.dentro && f0.texto === "No", `${d}: el foco cae en «No» (el botón seguro): «${f0.texto}»`);
    // El foco no sale del diálogo.
    for (let i = 0; i < 4; i++) await pagina.keyboard.press("Tab");
    revisar((await enfocado(pagina)).dentro, `${d}: Tab no saca el foco del diálogo`);
    for (let i = 0; i < 3; i++) await pagina.keyboard.press("Shift+Tab");
    revisar((await enfocado(pagina)).dentro, `${d}: Shift+Tab tampoco`);
    const peligro = await pagina.$eval("[role=alertdialog] .mk-confirmar-si", (b) => getComputedStyle(b).backgroundColor).catch(() => "");
    revisar(/214, 69, 69/.test(peligro), `${d}: «Sí, borrar» en rojo (${peligro})`);
    if (tamano === TELEFONO) {
      const r = await dialogo.boundingBox();
      revisar(Boolean(r) && Math.abs(r.y + r.height - tamano.height) < 4, `${d}: en el teléfono es una hoja pegada abajo`);
    } else {
      const r = await dialogo.boundingBox();
      revisar(Boolean(r) && Math.abs(r.x + r.width / 2 - tamano.width / 2) < 4, `${d}: en el computador, un globo centrado`);
    }
    await pagina.screenshot({ path: join(CAPTURAS, `confirmar-${tamano.width}.png`) });
    // Escape cancela y el foco vuelve al botón que lo abrió.
    await pagina.keyboard.press("Escape");
    await pagina.waitForTimeout(450);
    revisar(!(await pagina.$("[role=alertdialog]")) && (await cuenta(pagina, "cancelados")) === 1, `${d}: Escape cancela`);
    revisar((await enfocado(pagina)).prueba === "abrir-confirmar", `${d}: el foco vuelve al botón que lo abrió`);
    // Tocar el fondo cancela.
    await pagina.click("[data-prueba=abrir-confirmar]");
    await pagina.waitForTimeout(450);
    await pagina.mouse.click(6, 6);
    await pagina.waitForTimeout(450);
    revisar((await cuenta(pagina, "cancelados")) === 2, `${d}: tocar afuera cancela`);
    // Confirmar con espera: dos toques rápidos llaman una vez; mientras actúa, ni Escape ni el fondo cierran.
    await pagina.click("[data-prueba=abrir-confirmar-espera]");
    await pagina.waitForTimeout(450);
    const si = "[role=alertdialog] .mk-confirmar-si";
    await pagina.click(si);
    await pagina.click(si, { force: true }).catch(() => {});
    await pagina.waitForTimeout(60);
    revisar((await cuenta(pagina, "confirmados")) === 1, `${d}: dos toques rápidos en «Sí» confirman una vez`);
    revisar(await pagina.$eval(si, (b) => b.getAttribute("aria-busy") === "true" && Boolean(b.querySelector(".mk-confirmar-anillo"))).catch(() => false), `${d}: mientras actúa, la rueda en «Sí»`);
    await pagina.keyboard.press("Escape");
    await pagina.mouse.click(6, 6);
    await pagina.waitForTimeout(120);
    revisar(Boolean(await pagina.$("[role=alertdialog]")) && (await cuenta(pagina, "cancelados")) === 2, `${d}: mientras actúa, Escape y el fondo no cierran`);
    await pagina.waitForTimeout(1200);
    revisar(!(await pagina.$("[role=alertdialog]")), `${d}: al terminar, se cierra`);
    // Si la acción falla y el diálogo sigue abierto, «Sí» se puede volver a tocar.
    const antes = await cuenta(pagina, "confirmados");
    await pagina.click("[data-prueba=abrir-confirmar-falla]");
    await pagina.waitForTimeout(450);
    await pagina.click(si);
    await pagina.waitForTimeout(700);
    await pagina.click(si);
    await pagina.waitForTimeout(100);
    revisar((await cuenta(pagina, "confirmados")) === antes + 2, `${d}: si falla, «Sí» se puede reintentar`);
    await pagina.waitForTimeout(500); // el segundo intento también queda «ocupado» 400 ms
    await pagina.keyboard.press("Escape");
    await pagina.waitForTimeout(400);
    // Abierto desde una ventana del panel (z-index 1400): queda encima.
    await pagina.click("[data-prueba=abrir-ventana]");
    await pagina.click("[data-prueba=abrir-confirmar-ventana]");
    await pagina.waitForTimeout(450);
    const encima = await pagina.$eval("[role=alertdialog]", (dl) => { const r = dl.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return Boolean(e && dl.contains(e)); }).catch(() => false);
    revisar(encima, `${d}: abierto desde una ventana del panel, queda encima`);
    revisar(errores.length === 0, `${d}: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
}

/** Dónde queda la punta del dedo de la mano que está dentro de `selector` (con su dirección). */
const puntaDe = (pagina, selector) =>
  pagina.$eval(`${selector} .mk-mano`, (el) => {
    const P = { derecha: [0.973, 0.167], izquierda: [0.027, 0.167], arriba: [0.417, -0.223], abajo: [0.583, 0.723] };
    const dir = el.getAttribute("data-direccion");
    const caja = el.getBoundingClientRect();
    const ancho = el.offsetWidth;
    const cx = caja.left + caja.width / 2;
    const cy = caja.top + caja.height / 2;
    const [fx, fy] = P[dir];
    return { dir, x: cx - ancho / 2 + fx * ancho, y: cy - ancho / 4 + fy * ancho };
  }).catch(() => null);
const cajaDe = (pagina, selector) => pagina.$eval(selector, (el) => el.getBoundingClientRect().toJSON()).catch(() => null);

if (parte("vacio")) {
  for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir("#comic", tamano);
    const d = `vacio (${nombre})`;
    await pagina.$eval("[data-prueba=vacio]", (el) => el.scrollIntoView({ block: "center" }));
    await pagina.waitForTimeout(150);
    // La mano apunta a la acción: a la derecha en el computador, desde arriba en el teléfono.
    const p = await puntaDe(pagina, "[data-prueba=vacio]");
    const a = await cajaDe(pagina, "[data-prueba=vacio-accion]");
    if (!p || !a) revisar(false, `${d}: hay mano y acción`);
    else if (tamano === TELEFONO) revisar(p.dir === "abajo" && Math.abs(p.y - a.y) <= 8 && p.x > a.x && p.x < a.x + a.width, `${d}: desde arriba, la punta toca la acción (${Math.round(p.x)},${Math.round(p.y)} → ${Math.round(a.x)},${Math.round(a.y)})`);
    else revisar(p.dir === "derecha" && Math.abs(p.x - a.x) <= 8 && p.y > a.y && p.y < a.y + a.height, `${d}: a la izquierda, la punta toca la acción (${Math.round(p.x)},${Math.round(p.y)} → ${Math.round(a.x)},${Math.round(a.y)})`);
    revisar((await animaciones(pagina, "[data-prueba=vacio] .mk-mano")) >= 1, `${d}: al entrar en pantalla, la mano toca`);
    await pagina.screenshot({ path: join(CAPTURAS, `vacio-${tamano.width}.png`) });
    await pagina.waitForTimeout(2200);
    revisar((await animaciones(pagina, "[data-prueba=vacio] .mk-mano")) === 0, `${d}: toca una vez y queda quieta`);
    revisar(Boolean(await pagina.$("[data-prueba=vacio-enlace] .mk-mano")), `${d}: con un enlace como acción, también apunta`);
    revisar(!(await pagina.$("[data-prueba=vacio-sin] .mk-mano")), `${d}: sin acción, no hay mano`);
    // La oferta: el estallido late y el contenido se ve entero.
    await pagina.$eval("[data-prueba=oferta]", (el) => el.scrollIntoView({ block: "center" }));
    revisar((await animaciones(pagina, "[data-prueba=oferta] .mk-estallido")) >= 1, `${d}: la oferta trae su estallido que late`);
    revisar(((await pagina.$eval("[data-prueba=oferta]", (el) => el.textContent).catch(() => "")) ?? "").includes("Tus clientes reservan solos"), `${d}: la oferta muestra su contenido`);
    revisar(((await pagina.$eval("[data-prueba=oferta] .mk-estallido", (el) => el.textContent).catch(() => "")) ?? "").includes("¡30 días gratis!"), `${d}: el estallido dice «¡30 días gratis!»`);
    // El cartel de novedad: aparece colgando de la campana, se mece y queda quieto; tocarlo avisa.
    await pagina.$eval("[data-prueba=campana]", (el) => el.scrollIntoView({ block: "center" }));
    revisar(!(await pagina.$(".mk-cartel-novedad .mk-colgante")), `${d}: sin novedad, no hay cartel`);
    await pagina.click("[data-prueba=llega-novedad]");
    await pagina.waitForTimeout(200);
    const cartel = await cajaDe(pagina, ".mk-cartel-novedad .mk-colgante");
    const campana = await cajaDe(pagina, "[data-prueba=campana]");
    revisar(Boolean(cartel && campana) && cartel.y >= campana.y + campana.height - 6 && cartel.x < campana.x + campana.width && cartel.x + cartel.width > campana.x, `${d}: el cartel cuelga de la campana`);
    revisar((await animaciones(pagina, ".mk-cartel-novedad .mk-colgante")) >= 1, `${d}: al llegar, se mece`);
    await pagina.screenshot({ path: join(CAPTURAS, `novedad-${tamano.width}.png`) });
    await pagina.waitForTimeout(3300);
    revisar((await animaciones(pagina, ".mk-cartel-novedad .mk-colgante")) === 0, `${d}: después queda quieto`);
    await pagina.click(".mk-cartel-novedad .mk-colgante");
    revisar((await pagina.$eval("[data-prueba=tocado]", (el) => el.textContent)) === "1", `${d}: tocar el cartel avisa`);
    revisar(errores.length === 0, `${d}: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  const { ctx, pagina } = await abrir("#comic", TELEFONO, { reducido: true });
  await pagina.$eval("[data-prueba=vacio]", (el) => el.scrollIntoView({ block: "center" }));
  await pagina.click("[data-prueba=llega-novedad]");
  await pagina.waitForTimeout(200);
  const quieto = (await animaciones(pagina, "[data-prueba=vacio] .mk-mano")) + (await animaciones(pagina, ".mk-cartel-novedad .mk-colgante"));
  revisar(quieto === 0, "vacio (reducido): la mano y el cartel quietos");
  await ctx.close();
}

/** Distancia de la punta del dedo de la guía al elemento (0 si cae dentro). */
async function distanciaAl(pagina, selector) {
  const p = await puntaDe(pagina, ".mk-guia");
  const r = await cajaDe(pagina, selector);
  if (!p || !r) return Infinity;
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.width));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.height));
  return Math.hypot(dx, dy);
}
const pasoDice = (pagina) => pagina.$eval(".mk-guia [role=dialog]", (el) => el.getAttribute("aria-label") ?? "").catch(() => "");
async function esperarPaso(pagina, texto, ms = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if ((await pasoDice(pagina)) === texto) return Date.now() - t0;
    await pagina.waitForTimeout(40);
  }
  return -1;
}

if (parte("guia")) {
  for (const [nombre, tamano] of [["escritorio", ESCRITORIO], ["teléfono", TELEFONO]]) {
    const { ctx, pagina, errores } = await abrir("#comic", tamano);
    const d = `guia (${nombre})`;
    await pagina.$eval("[data-prueba=guia-demo]", (el) => el.scrollIntoView({ block: "start" }));
    await pagina.click("[data-prueba=abrir-guia]");
    await pagina.waitForTimeout(700);
    revisar((await pasoDice(pagina)) === "Paso 1 de 5", `${d}: abre en el paso 1 de 5`);
    const dist = await distanciaAl(pagina, "[data-guia=editar-diseno]");
    revisar(dist <= 6, `${d}: la punta toca el elemento del paso (${dist.toFixed(1)} px)`);
    const foco = await pagina.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    revisar(foco === "Siguiente", `${d}: el foco en «Siguiente» («${foco}»)`);
    // Dentro de la vista: la mano y el globo.
    const vista = await pagina.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    const cajas = await pagina.$$eval(".mk-guia .mk-mano svg, .mk-guia [role=dialog]", (l) => l.map((e) => e.getBoundingClientRect().toJSON()));
    revisar(cajas.length === 2 && cajas.every((c) => c.left >= 0 && c.top >= 0 && c.right <= vista.w + 1 && c.bottom <= vista.h + 1), `${d}: la mano y el globo quedan dentro de la ventana`);
    await pagina.screenshot({ path: join(CAPTURAS, `guia-${tamano.width}.png`) });
    // Algo de arriba termina de cargar y corre el elemento (sin cambiar su tamaño): la mano lo sigue.
    await pagina.evaluate(() => { const d = document.createElement("div"); d.id = "empuja"; d.style.height = "140px"; const c = document.querySelector("[data-prueba=guia-demo] .cx-tarjeta"); c.parentNode.insertBefore(d, c); });
    await pagina.waitForTimeout(800);
    revisar((await distanciaAl(pagina, "[data-guia=editar-diseno]")) <= 6, `${d}: si algo corre el elemento, la mano lo sigue`);
    await pagina.evaluate(() => document.getElementById("empuja")?.remove());
    await pagina.waitForTimeout(800);

    // Lo señalado se puede tocar; lo de afuera, no.
    await pagina.click("[data-prueba=editar-diseno]");
    revisar((await pagina.$eval("[data-prueba=toques]", (e) => e.textContent)) === "1", `${d}: el elemento señalado se puede tocar`);
    const tapa = await pagina.$eval("[data-prueba=abrir-guia-vacia]", (b) => {
      const r = b.getBoundingClientRect();
      const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return arriba !== b && !b.contains(arriba);
    });
    revisar(tapa, `${d}: lo de afuera queda tapado (no se toca)`);
    // Flechas y botones.
    await pagina.keyboard.press("ArrowRight");
    revisar((await esperarPaso(pagina, "Paso 2 de 5", 800)) >= 0, `${d}: la flecha derecha pasa al paso 2`);
    await pagina.keyboard.press("ArrowLeft");
    revisar((await esperarPaso(pagina, "Paso 1 de 5", 800)) >= 0, `${d}: la flecha izquierda vuelve al 1`);
    await pagina.$eval(".mk-guia-mano", (el) => { el.dataset.marca = "antes"; });
    await pagina.click(".mk-guia [role=dialog] >> text=Siguiente");
    await pagina.waitForTimeout(60);
    const viaja = await pagina.$eval(".mk-guia-mano", (el) => el.dataset.marca === "antes" && el.getAnimations().some((a) => a instanceof CSSTransition)).catch(() => false);
    revisar(viaja, `${d}: entre pasos, la mano viaja (es la misma, no se vuelve a crear)`);
    await esperarPaso(pagina, "Paso 2 de 5", 1500);
    // El paso 3 apunta a algo que aparece 800 ms después de pedirlo: la guía espera y no lo salta.
    // (Se pide después del clic: el clic espera a que el globo deje de viajar.)
    await pagina.click(".mk-guia [role=dialog] >> text=Siguiente");
    await pagina.evaluate(() => window.__guiaTarde(800));
    await pagina.waitForTimeout(200);
    revisar((await pagina.$$(".mk-guia-oscuro")).length === 4, `${d}: mientras busca el elemento, la guía no desaparece`);
    const espero = await esperarPaso(pagina, "Paso 3 de 5", 2500);
    revisar(espero >= 600, `${d}: el paso cuyo elemento aparece tarde espera y se muestra (${espero} ms)`);
    await pagina.waitForTimeout(800);
    revisar((await distanciaAl(pagina, "[data-guia=tarde]")) <= 6, `${d}: y la mano lo señala cuando aparece`);
    // El paso 4 no existe: se salta solo a los 1,5 s.
    await pagina.click(".mk-guia [role=dialog] >> text=Siguiente");
    const salto = await esperarPaso(pagina, "Paso 5 de 5", 3000);
    revisar(salto >= 1200 && salto <= 2400, `${d}: el paso sin elemento se salta solo (${salto} ms)`);
    // Seguir al elemento al hacer scroll.
    await pagina.mouse.wheel(0, 60);
    await pagina.waitForTimeout(800); // la mano viaja 0,55 s
    revisar((await distanciaAl(pagina, "[data-guia=publicar]")) <= 6, `${d}: al hacer scroll, la mano sigue al elemento`);
    await pagina.click(".mk-guia [role=dialog] >> text=¡Listo!");
    await pagina.waitForTimeout(300);
    revisar(!(await pagina.$(".mk-guia")) && (await pagina.$eval("[data-prueba=terminadas]", (e) => e.textContent)) === "1", `${d}: «¡Listo!» la termina`);
    // Escape la salta.
    await pagina.click("[data-prueba=abrir-guia]");
    await pagina.waitForTimeout(500);
    await pagina.keyboard.press("Escape");
    await pagina.waitForTimeout(300);
    revisar(!(await pagina.$(".mk-guia")) && (await pagina.$eval("[data-prueba=saltadas]", (e) => e.textContent)) === "1", `${d}: Escape la salta`);
    // Reabrir no arranca en el paso viejo: abrir, pasar al 2, saltar y abrir la guía sin elementos (espera 1,5 s).
    await pagina.click("[data-prueba=abrir-guia]");
    await pagina.waitForTimeout(500);
    await pagina.keyboard.press("ArrowRight");
    await pagina.waitForTimeout(400);
    await pagina.keyboard.press("Escape");
    await pagina.waitForTimeout(300);
    const saltadasAntes = await pagina.$eval("[data-prueba=saltadas]", (e) => Number(e.textContent));
    // Si no hay ningún elemento, termina sola (a los 1,5 s, no al instante).
    await pagina.click("[data-prueba=abrir-guia-vacia]");
    await pagina.waitForTimeout(600);
    revisar((await pagina.$eval("[data-prueba=terminadas]", (e) => e.textContent)) === "1", `${d}: reabrir no termina al instante (arranca en el paso 1)`);
    await pagina.waitForTimeout(1600);
    revisar((await pagina.$eval("[data-prueba=terminadas]", (e) => e.textContent)) === "2", `${d}: sin ningún elemento, termina sola (avisa alTerminar)`);
    revisar(errores.length === 0, `${d}: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  const { ctx, pagina } = await abrir("#comic", TELEFONO, { reducido: true });
  await pagina.$eval("[data-prueba=guia-demo]", (el) => el.scrollIntoView({ block: "start" }));
  await pagina.click("[data-prueba=abrir-guia]");
  await pagina.waitForTimeout(500);
  const viaja = await pagina.$eval(".mk-guia-mano", (el) => parseFloat(getComputedStyle(el).transitionDuration)).catch(() => -1);
  revisar(viaja === 0, `guia (reducido): la mano aparece en su lugar, sin viajar (${viaja})`);
  await ctx.close();
}

if (parte("celebrar")) {
  for (const [nombre, tamano] of [["teléfono", TELEFONO], ["escritorio", ESCRITORIO]]) {
    const { ctx, pagina, errores } = await abrir("#comic", tamano);
    const d = `celebrar (${nombre})`;
    await pagina.$eval("[data-prueba=celebrar]", (el) => el.scrollIntoView({ block: "center" }));
    const regionAntes = await pagina.$$eval(".mk-celebrar-oculto[aria-live=polite]", (l) => l.map((x) => x.textContent));
    revisar(regionAntes.length === 1 && regionAntes[0] === "", `${d}: la región que anuncia existe (vacía) antes de la primera celebración`);
    await pagina.click("[data-prueba=publicar]");
    await pagina.waitForTimeout(250);
    const est = await pagina.$(".mk-celebrar .mk-estallido");
    revisar(Boolean(est) && (await est.isVisible()), `${d}: sale el estallido`);
    revisar(((await est?.textContent()) ?? "").includes("¡Publicada!"), `${d}: dice «¡Publicada!»`);
    const colores = await pagina.$$eval(".mk-celebrar .mk-m-confeti i", (l) => l.slice(0, 6).map((i) => getComputedStyle(i).backgroundColor));
    revisar(colores.length > 0 && colores.every((x) => x !== "rgba(0, 0, 0, 0)" && x !== "transparent"), `${d}: con confeti que se ve (${colores.slice(0, 3).join(" ")})`);
    const anuncio = await pagina.$$eval("[aria-live=polite]", (l) => l.map((x) => x.textContent).join("|"));
    revisar(anuncio.includes("¡Publicada!"), `${d}: se anuncia`);
    await pagina.screenshot({ path: join(CAPTURAS, `celebrar-${tamano.width}.png`) });
    // No recibe toques: el botón de debajo se puede tocar.
    await pagina.click("[data-prueba=debajo]");
    revisar((await pagina.$eval("[data-prueba=debajo-n]", (e) => e.textContent)) === "1", `${d}: lo de debajo se sigue pudiendo tocar`);
    await pagina.waitForTimeout(2600);
    revisar(!(await pagina.$(".mk-celebrar .mk-estallido")), `${d}: se va a los 2,5 s`);
    // Dos seguidas: un solo estallido y un solo confeti a la vista.
    await pagina.click("[data-prueba=publicar-dos]");
    await pagina.waitForTimeout(250);
    const cuantos = await pagina.$$eval(".mk-celebrar .mk-estallido", (l) => l.length);
    const confetis = await pagina.$$eval(".mk-celebrar .mk-m-confeti", (l) => l.length);
    const texto = await pagina.$eval(".mk-celebrar .mk-estallido", (e) => e.textContent).catch(() => "");
    revisar(cuantos === 1 && confetis === 1 && texto.includes("¡Primer pedido!"), `${d}: dos seguidas dejan una sola (la última): ${cuantos} estallido(s), ${confetis} confeti(s)`);
    revisar(errores.length === 0, `${d}: sin errores${errores.length ? ` (${errores[0]})` : ""}`);
    await ctx.close();
  }
  const { ctx, pagina } = await abrir("#comic", TELEFONO, { reducido: true });
  await pagina.$eval("[data-prueba=celebrar]", (el) => el.scrollIntoView({ block: "center" }));
  await pagina.click("[data-prueba=publicar]");
  await pagina.waitForTimeout(250);
  revisar(Boolean(await pagina.$(".mk-celebrar .mk-estallido")) && !(await pagina.$(".mk-celebrar .mk-m-confeti")), "celebrar (reducido): el estallido sin confeti");
  await ctx.close();
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : `\nTodo bien. Capturas en ${CAPTURAS}`);
process.exit(fallas ? 1 : 0);
