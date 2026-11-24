// Verifica los efectos vistosos (fuegos artificiales, carrusel giratorio y libro que se abre) en #momentos.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-momentos3.mjs [http://localhost:5173] [parte]`,
// donde la parte (opcional) es fuegos, carrusel, libro o cierre.
import { chromium, webkit } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const solo = process.argv[3];
const parte = (nombre) => !solo || solo === nombre;
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const navegador = await chromium.launch();
/** La sección de la vitrina de una pieza. */
const seccion = (id) => `[data-prueba="${id}"]`;

/**
 * Abre #momentos. `antes` recibe la página antes de cargar (para bloquear archivos o espiar). Cuenta los cuadros de
 * animación que pide cada pieza (por el archivo desde donde se piden), para saber si alguna sigue corriendo.
 */
async function abrir(opciones = {}, antes, motor = navegador) {
  const ctx = await motor.newContext({ viewport: { width: 1280, height: 900 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.addInitScript(() => {
    window.__cuadros = { fuegos: 0, carrusel: 0, libro: 0 };
    // Cuánto se sale la página de lado. La vitrina recorta lo que sobra (`main{overflow-x:clip}`): se mide sin ese
    // recorte, o la medida daría cero siempre.
    window.__desborde = () => {
      const m = document.querySelector("main");
      const antes = m.style.overflowX;
      m.style.overflowX = "visible";
      const d = document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth;
      m.style.overflowX = antes;
      return d;
    };
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (f) => {
      const pila = new Error().stack ?? "";
      if (pila.includes("FuegosArtificiales")) window.__cuadros.fuegos++;
      else if (pila.includes("CarruselGiratorio")) window.__cuadros.carrusel++;
      else if (pila.includes("LibroQueSeAbre")) window.__cuadros.libro++;
      return raf(f);
    };
  });
  if (antes) await antes(pagina);
  await pagina.goto(base + "/#momentos");
  await pagina.waitForSelector("[data-prueba=vistosos]", { timeout: 8000 }).catch(() => {});
  return { ctx, pagina, errores };
}

/** Lleva una sección al centro de la pantalla (varias veces: las piezas de arriba llegan de a poco y corren la página). */
async function ver(pagina, id, espera = 600) {
  for (let i = 0; i < 3; i++) {
    await pagina.evaluate((q) => document.querySelector(q)?.scrollIntoView({ block: "center" }), seccion(id));
    await pagina.waitForTimeout(350);
  }
  await pagina.waitForTimeout(espera);
}
/** Aprieta un botón sin mover la página. */
const apretar = (pagina, selector) => pagina.evaluate((q) => document.querySelector(q)?.click(), selector);
/** Cuántos cuadros pidió una pieza durante `ms`. */
async function cuadrosEn(pagina, cual, ms) {
  const a = await pagina.evaluate((c) => window.__cuadros[c], cual);
  await pagina.waitForTimeout(ms);
  return (await pagina.evaluate((c) => window.__cuadros[c], cual)) - a;
}
/** Hace creer a la página que su pestaña se ocultó o volvió. */
const pestana = (pagina, estado) =>
  pagina.evaluate((e) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => e });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => e === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, estado);
const sinDesborde = (pagina) => pagina.evaluate(() => window.__desborde());

// --- Fuegos artificiales ---
if (parte("fuegos")) {
  const LIENZO = `${seccion("fuegos")} canvas.mk-m-fuegos`;
  const fines = (pagina) => pagina.locator("[data-prueba=fuegos-fin]").innerText().then(Number);
  /** Cuántos puntos del lienzo tienen algo pintado. */
  const pintados = (pagina) =>
    pagina.evaluate((q) => {
      const c = document.querySelector(q);
      if (!c || !c.width) return -1;
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++;
      return n;
    }, LIENZO);
  {
    const { ctx, pagina, errores } = await abrir();
    await ver(pagina, "fuegos");
    revisar((await pagina.locator(LIENZO).count()) === 0, "los fuegos no parten solos: los monta quien celebra");
    // Se aprieta «Celebrar» y se mira el lienzo cada 60 ms: primero hay poco pintado (el cohete que sube) y después mucho (revienta).
    const muestras = await pagina.evaluate(async (q) => {
      document.querySelector("[data-prueba=celebrar]").click();
      const vistas = [];
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 60));
        const c = document.querySelector(q);
        if (!c || !c.width) continue;
        const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let k = 3; k < d.length; k += 4) if (d[k] > 20) n++;
        vistas.push(n);
      }
      return vistas;
    }, LIENZO);
    const mayor = Math.max(0, ...muestras);
    const subiendo = muestras.find((n) => n > 0) ?? 0;
    const armado = await pagina.evaluate((q) => {
      const c = document.querySelector(q);
      return c && { oculto: c.getAttribute("aria-hidden"), toques: getComputedStyle(c).pointerEvents, cubre: Math.abs(c.getBoundingClientRect().width - c.parentElement.getBoundingClientRect().width) < 1, ancho: c.width };
    }, LIENZO);
    revisar(armado && armado.oculto === "true" && armado.toques === "none" && armado.cubre && subiendo > 0 && subiendo < mayor / 3 && mayor > 1500, `al celebrar, un lienzo decorativo cubre su caja: primero sube el cohete y después revienta (${subiendo} puntos pintados al partir, ${mayor} en lo más alto; ${JSON.stringify(armado)})`);
    revisar(armado && armado.ancho <= 1600, `el lienzo no pasa de 1600 px de lado (${armado?.ancho})`);
    // Al terminar: se quita solo, avisa una vez y no pide más cuadros.
    await pagina.waitForSelector(LIENZO, { state: "detached", timeout: 5000 }).catch(() => {});
    await pagina.waitForTimeout(200);
    const despues = await cuadrosEn(pagina, "fuegos", 500);
    revisar((await pagina.locator(LIENZO).count()) === 0 && (await fines(pagina)) === 1 && despues === 0, `al terminar se quita solo, avisa una vez y no pide más cuadros (avisos: ${await fines(pagina)}; cuadros después: ${despues})`);
    // Otra celebración (cambia la semilla): parte de nuevo.
    await apretar(pagina, "[data-prueba=celebrar]");
    await pagina.waitForSelector(LIENZO, { state: "attached", timeout: 4000 }).catch(() => {});
    await pagina.waitForTimeout(900);
    const otraVez = await pintados(pagina);
    // Con la pestaña oculta no dibuja; al volver sigue donde iba (no termina de golpe).
    await pestana(pagina, "hidden");
    await pagina.waitForTimeout(100);
    const oculta = await cuadrosEn(pagina, "fuegos", 1200);
    const sigueAhi = await pagina.locator(LIENZO).count();
    await pestana(pagina, "visible");
    await pagina.waitForTimeout(250);
    const alVolver = await pintados(pagina);
    revisar(otraVez > 0 && oculta === 0 && sigueAhi === 1 && alVolver > 0, `otra celebración parte de nuevo; con la pestaña oculta no dibuja y al volver sigue donde iba (${oculta} cuadros oculta; ${alVolver} puntos al volver)`);
    await pagina.waitForSelector(LIENZO, { state: "detached", timeout: 5000 }).catch(() => {});
    revisar((await fines(pagina)) === 2, `la segunda también avisa una sola vez (avisos: ${await fines(pagina)})`);
    // Fuera de la vista tampoco dibuja.
    await apretar(pagina, "[data-prueba=celebrar]");
    await pagina.waitForSelector(LIENZO, { state: "attached", timeout: 4000 }).catch(() => {});
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => window.scrollTo(0, 0));
    await pagina.waitForTimeout(300);
    const lejos = await pagina.evaluate((q) => document.querySelector(q)?.getBoundingClientRect().top > innerHeight, LIENZO);
    const fuera = await cuadrosEn(pagina, "fuegos", 600);
    revisar(lejos && fuera === 0, `fuera de la vista no dibuja (${fuera} cuadros)`);
    // Quitarlos a medias: no queda lienzo ni cuadros, y no avisan que terminaron.
    await ver(pagina, "fuegos", 200);
    await apretar(pagina, "[data-prueba=quitar]");
    await pagina.waitForTimeout(200);
    const trasQuitar = await cuadrosEn(pagina, "fuegos", 500);
    revisar((await pagina.locator(LIENZO).count()) === 0 && trasQuitar === 0 && (await fines(pagina)) === 2, `al quitarlos a medias no queda lienzo ni cuadros, y no avisan (${trasQuitar} cuadros; avisos: ${await fines(pagina)})`);
    revisar(errores.length === 0, `sin errores con los fuegos${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    // Movimiento reducido: no hay nada que mostrar, pero quien espera el aviso lo recibe.
    const { ctx, pagina, errores } = await abrir({ reducedMotion: "reduce" });
    await ver(pagina, "fuegos");
    await apretar(pagina, "[data-prueba=celebrar]");
    await pagina.waitForTimeout(700);
    const cuadros = await pagina.evaluate(() => window.__cuadros.fuegos);
    revisar((await pagina.locator(LIENZO).count()) === 0 && (await fines(pagina)) === 1 && cuadros === 0 && errores.length === 0, `con movimiento reducido no hay lienzo ni cuadros, y avisa de inmediato una vez (avisos: ${await fines(pagina)}; cuadros: ${cuadros})`);
    await ctx.close();
  }
  {
    // En un tema sobrio (el acento es negro) los fuegos igual tienen color.
    const { ctx, pagina, errores } = await abrir();
    await pagina.selectOption("[data-prueba=estilo]", "lamente");
    await ver(pagina, "fuegos", 300);
    const color = await pagina.evaluate(async (q) => {
      document.querySelector("[data-prueba=celebrar]").click();
      let mejor = { pintados: 0, vivos: 0 };
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 60));
        const c = document.querySelector(q);
        if (!c || !c.width) continue;
        const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let pintados = 0;
        let vivos = 0;
        for (let k = 0; k < d.length; k += 4) {
          if (d[k + 3] < 120) continue;
          pintados++;
          const max = Math.max(d[k], d[k + 1], d[k + 2]);
          if (max > 60 && (max - Math.min(d[k], d[k + 1], d[k + 2])) / max > 0.3) vivos++;
        }
        if (pintados > mejor.pintados) mejor = { pintados, vivos };
      }
      return mejor;
    }, LIENZO);
    revisar(color.pintados > 300 && color.vivos / color.pintados > 0.8 && errores.length === 0, `en un tema sobrio (acento negro) los fuegos igual tienen color (${color.vivos} de ${color.pintados} puntos con color)`);
    await ctx.close();
  }
  {
    // El sorteo: con «fuegos» los muestra; por defecto sigue el confeti.
    const { ctx, pagina, errores } = await abrir();
    await ver(pagina, "sorteo-fuegos", 900);
    const conFuegos = await pagina.evaluate((q) => ({ lienzo: document.querySelectorAll(`${q} canvas.mk-m-fuegos`).length, confeti: document.querySelectorAll(`${q} .mk-m-confeti`).length, ganador: /Camila R\./.test(document.querySelector(q)?.textContent ?? "") }), seccion("sorteo-fuegos"));
    await ver(pagina, "sorteo-ganador", 900);
    const conConfeti = await pagina.evaluate((q) => ({ lienzo: document.querySelectorAll(`${q} canvas.mk-m-fuegos`).length, confeti: document.querySelectorAll(`${q} .mk-m-confeti`).length }), seccion("sorteo-ganador"));
    revisar(conFuegos.lienzo === 1 && conFuegos.confeti === 0 && conFuegos.ganador && conConfeti.lienzo === 0 && conConfeti.confeti === 1 && errores.length === 0, `el sorteo con «fuegos» los muestra, y sin decir nada sigue el confeti (${JSON.stringify({ conFuegos, conConfeti })})`);
    await ctx.close();
  }
  {
    // Si el archivo de los fuegos no baja, la página sigue (y el sorteo también).
    const { ctx, pagina, errores } = await abrir({}, (p) => p.route(/FuegosArtificiales/, (r) => r.abort()));
    await ver(pagina, "fuegos");
    await apretar(pagina, "[data-prueba=celebrar]");
    await ver(pagina, "sorteo-fuegos", 900);
    const v = await pagina.evaluate((q) => ({ lienzos: document.querySelectorAll("canvas.mk-m-fuegos").length, sorteo: /Camila R\./.test(document.querySelector(q)?.textContent ?? ""), vitrina: document.querySelectorAll("[data-prueba=vistosos] .mom-seccion").length }), seccion("sorteo-fuegos"));
    revisar(v.lienzos === 0 && v.sorteo && v.vitrina >= 2 && errores.length === 0, `si el archivo de los fuegos no baja, la página y el sorteo siguen (${JSON.stringify(v)}${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
}

// --- Carrusel giratorio ---
if (parte("carrusel")) {
  const C = (id) => `${seccion(id)} .mk-m-carrusel`;
  /** Lo que se ve del carrusel de una sección. */
  const estado = (pagina, id) =>
    pagina.evaluate((q) => {
      const c = document.querySelector(q);
      if (!c) return null;
      const puestos = [...c.querySelectorAll(".mk-m-carrusel-anillo>li")];
      const frente = c.querySelector("li[data-frente]");
      const caja = c.getBoundingClientRect();
      const f = frente?.getBoundingClientRect();
      return {
        modo: c.dataset.modo,
        rol: c.getAttribute("role"),
        nombre: c.getAttribute("aria-label"),
        puestos: puestos.length,
        copias: puestos.filter((l) => l.getAttribute("aria-hidden") === "true").length,
        frente: frente ? Number(frente.dataset.ficha) : -1,
        // La ficha del frente queda al centro del carrusel.
        centrada: f ? Math.abs(f.left + f.width / 2 - (caja.left + caja.width / 2)) < 3 : false,
        angulo: c.dataset.angulo === undefined ? null : Number(c.dataset.angulo),
        enlacesAlTeclado: [...c.querySelectorAll(".mk-m-carrusel-anillo a[href]")].filter((a) => a.tabIndex !== -1).map((a) => Number(a.closest("li").dataset.ficha)),
        enlacesEnCopias: c.querySelectorAll(".mk-m-carrusel-anillo li[aria-hidden=true] a:not([tabindex='-1'])").length,
        dicho: c.querySelector("[data-dicho]")?.textContent ?? "",
        actual: c.querySelectorAll("li[aria-current=true]").length,
      };
    }, C(id));
  /** Espera a que el anillo se detenga (deja de pedir cuadros). */
  const quieto = async (pagina) => {
    for (let i = 0; i < 40; i++) if ((await cuadrosEn(pagina, "carrusel", 120)) === 0) return true;
    return false;
  };
  const centro = async (pagina, id) => {
    const c = await pagina.locator(`${C(id)} .mk-m-carrusel-escena`).boundingBox();
    return { x: c.x + c.width / 2, y: c.y + c.height / 2, ancho: c.width };
  };
  /** Arrastra el anillo `dx` px desde el centro, en `ms`. */
  const arrastrar = async (pagina, id, dx, ms = 300, desde = 0) => {
    const c = await centro(pagina, id);
    await pagina.mouse.move(c.x + desde, c.y);
    await pagina.mouse.down();
    const pasos = Math.max(2, Math.round(ms / 16));
    for (let i = 1; i <= pasos; i++) {
      await pagina.mouse.move(c.x + desde + (dx * i) / pasos, c.y);
      await pagina.waitForTimeout(ms / pasos);
    }
    await pagina.mouse.up();
  };
  {
    const { ctx, pagina, errores } = await abrir();
    await ver(pagina, "carrusel", 1200);
    await quieto(pagina);
    const e = await estado(pagina, "carrusel");
    revisar(e && e.modo === "anillo" && e.rol === "region" && e.nombre === "Lo más pedido" && e.puestos === 6 && e.copias === 0 && e.frente === 0 && e.centrada && e.actual === 1, `seis fichas en un anillo, con nombre para lectores y la primera al frente y al centro (${JSON.stringify(e)})`);
    revisar(e && e.enlacesAlTeclado.length === 1 && e.enlacesAlTeclado[0] === e.frente, `solo el enlace de la ficha del frente está en el orden del teclado (${JSON.stringify(e?.enlacesAlTeclado)})`);
    revisar((await cuadrosEn(pagina, "carrusel", 500)) === 0, "quieto, el carrusel no pide cuadros");
    // La ficha del frente se lee a plena opacidad (las de los lados van atenuadas a propósito).
    const lectura = await pagina.evaluate((q) => {
      const efectiva = (e) => {
        let o = 1;
        for (let n = e; n && n !== document.body; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      };
      const c = document.querySelector(q);
      return { frente: efectiva(c.querySelector("li[data-frente] .mk-m-carrusel-titulo")), lado: efectiva(c.querySelector("li:not([data-frente]) .mk-m-carrusel-titulo")) };
    }, C("carrusel"));
    revisar(lectura.frente === 1 && lectura.lado < 1 && lectura.lado >= 0.5, `la ficha del frente se lee a plena opacidad; las de los lados van atenuadas (${JSON.stringify(lectura)})`);
    // Arrastrar una ficha de ancho: gira un puesto y queda justo en una ficha.
    const c = await centro(pagina, "carrusel");
    const fichaAncho = await pagina.locator(`${C("carrusel")} li[data-frente]`).evaluate((l) => l.offsetWidth);
    await arrastrar(pagina, "carrusel", -(fichaAncho + 16) * 0.8, 500);
    await quieto(pagina);
    const tras = await estado(pagina, "carrusel");
    revisar(tras.frente === 1 && tras.centrada && tras.angulo === -60 && /Ficha 2 de 6: Tostada con palta/.test(tras.dicho), `al arrastrar gira y se detiene justo en la ficha que sigue; ahí lo dice para lectores (${JSON.stringify({ frente: tras.frente, angulo: tras.angulo, dicho: tras.dicho })})`);
    // Con impulso (un tirón corto y rápido) llega más lejos que el mismo movimiento lento.
    await arrastrar(pagina, "carrusel", -fichaAncho * 0.7, 60);
    await quieto(pagina);
    const conImpulso = await estado(pagina, "carrusel");
    revisar(conImpulso.frente >= 3 && conImpulso.centrada && conImpulso.angulo % 60 === 0, `un tirón rápido sigue con impulso y también queda justo en una ficha (frente ${conImpulso.frente}, ángulo ${conImpulso.angulo})`);
    // Botones.
    const antes = conImpulso.frente;
    await apretar(pagina, `${C("carrusel")} [data-ir=despues]`);
    await quieto(pagina);
    const sig = (await estado(pagina, "carrusel")).frente;
    await apretar(pagina, `${C("carrusel")} [data-ir=antes]`);
    await apretar(pagina, `${C("carrusel")} [data-ir=antes]`);
    await quieto(pagina);
    const ant = (await estado(pagina, "carrusel")).frente;
    const medidas = await pagina.evaluate((q) => [...document.querySelectorAll(`${q} [data-ir]`)].map((b) => ({ ancho: b.getBoundingClientRect().width, alto: b.getBoundingClientRect().height, nombre: b.getAttribute("aria-label") })), C("carrusel"));
    revisar(sig === (antes + 1) % 6 && ant === (antes + 5) % 6 && medidas.every((m) => m.ancho >= 44 && m.alto >= 44 && m.nombre), `los botones «Anterior» y «Siguiente» giran de a una ficha y miden 44 px o más (${antes} → ${sig} → ${ant}; ${JSON.stringify(medidas)})`);
    // Teclado: las flechas actúan solo con el foco dentro del carrusel.
    await pagina.evaluate(() => document.activeElement?.blur());
    await pagina.keyboard.press("ArrowRight");
    await pagina.waitForTimeout(300);
    const sinFoco = (await estado(pagina, "carrusel")).frente;
    await pagina.locator(`${C("carrusel")} [data-ir=despues]`).focus();
    await pagina.keyboard.press("ArrowRight");
    await quieto(pagina);
    const conFoco = (await estado(pagina, "carrusel")).frente;
    const otro = (await estado(pagina, "carrusel-3")).frente;
    revisar(sinFoco === ant && conFoco === (ant + 1) % 6 && otro === 0, `las flechas del teclado giran solo con el foco dentro, y no mueven al otro carrusel de la página (${ant} → ${sinFoco} → ${conFoco}; el otro sigue en ${otro})`);
    // El foco en el enlace del frente: al girar con las flechas, el foco pasa a la ficha que queda al frente.
    await apretar(pagina, `${C("carrusel")} [data-ir=antes]`);
    await quieto(pagina);
    // Se deja al frente una ficha con enlace (las pares lo tienen).
    if ((await estado(pagina, "carrusel")).frente % 2) {
      await apretar(pagina, `${C("carrusel")} [data-ir=despues]`);
      await quieto(pagina);
    }
    const conEnlace = (await estado(pagina, "carrusel")).frente;
    await pagina.locator(`${C("carrusel")} li[data-frente] a[href]`).focus();
    await pagina.keyboard.press("ArrowRight");
    await pagina.keyboard.press("ArrowRight");
    await quieto(pagina);
    await pagina.waitForTimeout(150);
    const foco = await pagina.evaluate((q) => {
      const a = document.activeElement;
      return { dentro: Boolean(a?.closest(q)), alFrente: Boolean(a?.closest("li[data-frente]")), enlace: a?.tagName };
    }, C("carrusel"));
    revisar(conEnlace % 2 === 0 && foco.dentro && foco.alFrente && foco.enlace === "A", `con el foco en el enlace de una ficha, al girar el foco pasa a la que queda al frente (${JSON.stringify(foco)})`);
    // Arrastre contra clic sobre el enlace del frente.
    await pagina.evaluate((q) => {
      window.__nav = 0;
      for (const a of document.querySelectorAll(`${q} a[href]`))
        a.addEventListener("click", (ev) => {
          if (!ev.defaultPrevented) window.__nav++;
          ev.preventDefault();
        });
    }, C("carrusel"));
    await arrastrar(pagina, "carrusel", -40, 200);
    await quieto(pagina);
    const trasArrastre = await pagina.evaluate(() => window.__nav);
    const alFrenteAhora = (await estado(pagina, "carrusel")).frente;
    // Un clic lento (apretar, esperar, soltar) sí cuenta.
    await pagina.mouse.move(c.x, c.y);
    await pagina.mouse.down();
    await pagina.waitForTimeout(160);
    await pagina.mouse.up();
    await pagina.waitForTimeout(150);
    const trasClic = await pagina.evaluate(() => window.__nav);
    revisar(trasArrastre === 0 && alFrenteAhora % 2 === 0 && trasClic === 1, `un arrastre que empieza sobre el enlace del frente no navega, y un clic lento sí cuenta (${trasArrastre} y ${trasClic} clics; al frente la ficha ${alFrenteAhora})`);
    // Tocar una ficha que está de lado la trae al frente, sin abrir su enlace.
    const lado = await pagina.evaluate((q) => {
      const c = document.querySelector(q);
      const f = Number(c.querySelector("li[data-frente]").dataset.ficha);
      const sigue = c.querySelectorAll(".mk-m-carrusel-anillo>li")[(f + 1) % 6].getBoundingClientRect();
      const caja = c.getBoundingClientRect();
      // Un punto de la ficha de la derecha que se vea (dentro del carrusel).
      return { x: Math.min(caja.right - 14, sigue.left + sigue.width * 0.75), y: sigue.top + sigue.height * 0.3, f };
    }, C("carrusel"));
    await pagina.mouse.click(lado.x, lado.y);
    await quieto(pagina);
    const trasLado = await estado(pagina, "carrusel");
    revisar(trasLado.frente === (lado.f + 1) % 6 && (await pagina.evaluate(() => window.__nav)) === trasClic, `tocar la ficha de al lado la trae al frente sin abrir su enlace (${lado.f} → ${trasLado.frente})`);
    // Soltar con impulso y salir de la página: no quedan cuadros.
    await arrastrar(pagina, "carrusel", -150, 50);
    await pagina.evaluate(() => (location.hash = ""));
    await pagina.waitForTimeout(400);
    const alSalir = await cuadrosEn(pagina, "carrusel", 600);
    revisar(alSalir === 0 && errores.length === 0, `al salir de la página con el anillo girando no quedan cuadros ni errores (${alSalir} cuadros${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
  {
    // Pocas fichas, datos raros y sin fichas.
    const { ctx, pagina, errores } = await abrir();
    await ver(pagina, "carrusel-3", 1200);
    await quieto(pagina);
    const tres = await estado(pagina, "carrusel-3");
    revisar(tres.modo === "anillo" && tres.puestos === 6 && tres.copias === 3 && tres.enlacesEnCopias === 0 && tres.frente === 0, `con tres fichas el anillo las repite (seis puestos); las copias son decoración (${JSON.stringify({ puestos: tres.puestos, copias: tres.copias, enlacesEnCopias: tres.enlacesEnCopias })})`);
    // Al pasar a la segunda mitad del anillo, la del frente sigue siendo de verdad (no una copia).
    for (let i = 0; i < 4; i++) await apretar(pagina, `${C("carrusel-3")} [data-ir=despues]`);
    await quieto(pagina);
    const vuelta = await pagina.evaluate((q) => {
      const f = document.querySelector(`${q} li[data-frente]`);
      return { ficha: Number(f.dataset.ficha), copia: f.getAttribute("aria-hidden") === "true", reales: document.querySelectorAll(`${q} .mk-m-carrusel-anillo>li:not([aria-hidden=true])`).length };
    }, C("carrusel-3"));
    revisar(vuelta.ficha === 1 && !vuelta.copia && vuelta.reales === 3, `al seguir girando, la ficha del frente nunca es una copia y para lectores siguen siendo tres (${JSON.stringify(vuelta)})`);
    await ver(pagina, "carrusel-2", 700);
    const dos = await pagina.evaluate((q) => ({ modo: document.querySelector(q)?.dataset.modo, fichas: document.querySelectorAll(`${q} .mk-m-carrusel-fila>li`).length }), C("carrusel-2"));
    revisar(dos.modo === "fila" && dos.fichas === 2, `con dos fichas van en fila, sin anillo (${JSON.stringify(dos)})`);
    await ver(pagina, "carrusel-bordes", 1500);
    await quieto(pagina);
    const raros = await pagina.evaluate((q) => {
      const c = document.querySelector(q);
      const reales = [...c.querySelectorAll(".mk-m-carrusel-anillo>li")];
      return {
        puestos: reales.length,
        peligrosos: c.querySelectorAll("a[href^='javascript']").length,
        sinFoto: c.querySelector("li[data-ficha='0'] .mk-m-carrusel-ficha")?.hasAttribute("data-sin-foto"),
        titulo0: c.querySelector("li[data-ficha='0'] .mk-m-carrusel-titulo")?.textContent,
        agotado: c.querySelector("li[data-ficha='2'] .mk-m-carrusel-agotado")?.textContent,
        largo: c.querySelector("li[data-ficha='3'] .mk-m-carrusel-titulo")?.textContent.length,
        // Ninguna ficha crece con un texto largo.
        altos: new Set(reales.map((l) => Math.round(l.getBoundingClientRect().height / 4))).size,
        desborde: window.__desborde(),
      };
    }, C("carrusel-bordes"));
    revisar(raros.puestos === 12 && raros.peligrosos === 0 && raros.sinFoto === true && raros.titulo0 === "Una foto que no carga" && raros.agotado === "Agotado" && raros.largo === 80 && raros.desborde <= 0, `con datos raros: doce fichas como máximo, sin enlaces peligrosos, la foto caída deja su título, «Agotado» se lee, los textos largos se cortan y nada se sale de lado (${JSON.stringify(raros)})`);
    const vacio = await pagina.evaluate((q) => document.querySelectorAll(`${q} .mk-m-carrusel`).length, seccion("carrusel-vacio"));
    revisar(vacio === 0 && errores.length === 0, `sin fichas no se dibuja nada, y no hay errores${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  for (const [que, opciones, nivel] of [["en nivel liviano", {}, "liviano"], ["con movimiento reducido", { reducedMotion: "reduce" }, ""]]) {
    const { ctx, pagina, errores } = await abrir(opciones);
    if (nivel) await pagina.selectOption("[data-prueba=nivel]", nivel);
    await ver(pagina, "carrusel", 900);
    const f = await pagina.evaluate((q) => {
      const c = document.querySelector(q);
      const fila = c?.querySelector(".mk-m-carrusel-fila");
      return c && fila ? { modo: c.dataset.modo, fichas: fila.children.length, iman: getComputedStyle(fila).scrollSnapType, enlaces: fila.querySelectorAll("a[href]").length, alTeclado: [...fila.querySelectorAll("a[href]")].filter((a) => a.tabIndex !== -1).length } : null;
    }, C("carrusel"));
    await apretar(pagina, `${C("carrusel")} [data-ir=despues]`);
    await pagina.waitForTimeout(700);
    const corrida = await pagina.evaluate((q) => document.querySelector(`${q} .mk-m-carrusel-fila`)?.scrollLeft ?? 0, C("carrusel"));
    const cuadros = await pagina.evaluate(() => window.__cuadros.carrusel);
    revisar(f && f.modo === "fila" && f.fichas === 6 && /x mandatory/.test(f.iman) && f.enlaces === 3 && f.alTeclado === 3 && corrida > 50 && cuadros === 0 && errores.length === 0, `${que}: una fila que desliza el navegador, con todos sus enlaces al teclado, botones que la mueven y sin cuadros (${JSON.stringify(f)}; corrió ${Math.round(corrida)} px; ${cuadros} cuadros)`);
    await ctx.close();
  }
  {
    // Teléfono: con el dedo, sin desborde de lado, y el scroll vertical de la página sigue siendo del navegador.
    const { ctx, pagina, errores } = await abrir({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
    await ver(pagina, "carrusel", 1200);
    await quieto(pagina);
    const t = await pagina.evaluate((q) => {
      const c = document.querySelector(q);
      const f = c.querySelector("li[data-frente]").getBoundingClientRect();
      return { desborde: window.__desborde(), ficha: Math.round(f.width), cabe: f.left >= 0 && f.right <= innerWidth, toque: getComputedStyle(c.querySelector(".mk-m-carrusel-escena")).touchAction };
    }, C("carrusel"));
    revisar(t.desborde <= 0 && t.cabe && t.ficha >= 160 && t.toque === "pan-y" && errores.length === 0, `en un teléfono de 360 px la ficha del frente cabe entera, nada se sale de lado y el scroll vertical sigue siendo de la página (${JSON.stringify(t)})`);
    await ctx.close();
  }
  {
    // Lo que encontró la revisión final.
    const avisos = [];
    const { ctx, pagina, errores } = await abrir({}, (p) => p.on("console", (m) => /aria-hidden/i.test(m.text()) && avisos.push(m.text().slice(0, 120))));
    await ver(pagina, "carrusel", 1200);
    await quieto(pagina);
    const alEntrar = (await estado(pagina, "carrusel")).dicho;
    await pagina.evaluate((q) => {
      window.__nav = 0;
      for (const a of document.querySelectorAll(`${q} a[href]`))
        a.addEventListener("click", (ev) => {
          if (!ev.defaultPrevented) window.__nav++;
          ev.preventDefault();
        });
    }, C("carrusel"));
    // Un arrastre con el dedo (no lo sigue ningún clic) y después Enter sobre el enlace del frente: el Enter cuenta.
    await pagina.evaluate(async (q) => {
      const escena = document.querySelector(`${q} .mk-m-carrusel-escena`);
      const r = escena.getBoundingClientRect();
      const manda = (tipo, dx) => escena.dispatchEvent(new PointerEvent(tipo, { bubbles: true, pointerId: 77, pointerType: "touch", isPrimary: true, clientX: r.left + r.width / 2 + dx, clientY: r.top + r.height / 2, button: 0 }));
      manda("pointerdown", 0);
      for (let i = 1; i <= 8; i++) {
        manda("pointermove", -i * 4);
        await new Promise((f) => setTimeout(f, 16));
      }
      manda("pointerup", -32);
    }, C("carrusel"));
    await quieto(pagina);
    const trasDedo = await estado(pagina, "carrusel");
    await pagina.locator(`${C("carrusel")} li[data-frente] a[href]`).focus();
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(150);
    const conEnter = await pagina.evaluate(() => window.__nav);
    revisar(alEntrar === "" && trasDedo.frente === 0 && /Ficha 1 de 6/.test(trasDedo.dicho) && conEnter === 1 && errores.length === 0, `la entrada no le habla a los lectores (solo cuando alguien lo mueve), y después de un arrastre con el dedo el Enter sobre el enlace del frente sí cuenta (al entrar: «${alEntrar}»; clics con Enter: ${conEnter}${errores.length ? `; ${errores[0]}` : ""})`);
    // Con el mouse, bajar el cursor 20 px sobre el enlace antes de soltar tampoco es un clic.
    const c = await centro(pagina, "carrusel");
    await pagina.mouse.move(c.x, c.y - 10);
    await pagina.mouse.down();
    await pagina.mouse.move(c.x, c.y, { steps: 3 });
    await pagina.mouse.move(c.x, c.y + 10, { steps: 3 });
    await pagina.mouse.up();
    await quieto(pagina);
    const trasBajar = await pagina.evaluate(() => window.__nav);
    revisar(trasBajar === conEnter && (await estado(pagina, "carrusel")).frente === 0, `mover el cursor 20 px hacia abajo sobre el enlace no lo abre (${trasBajar - conEnter} clics de más)`);
    // Con el foco en el enlace del frente, al girar el foco pasa al carrusel (no queda en una ficha escondida) y al
    // detenerse va a la ficha del frente. Con tres fichas el anillo cruza de un tramo de copias al otro.
    await ver(pagina, "carrusel-3", 1200);
    await quieto(pagina);
    await pagina.locator(`${C("carrusel-3")} li[data-frente] a[href]`).focus();
    await pagina.keyboard.press("ArrowRight");
    await pagina.waitForTimeout(80);
    const girando = await pagina.evaluate((q) => ({ enLaRaiz: document.activeElement === document.querySelector(q), escondido: Boolean(document.activeElement?.closest("[aria-hidden=true]")) }), C("carrusel-3"));
    await pagina.keyboard.press("ArrowRight");
    await pagina.keyboard.press("ArrowRight");
    await quieto(pagina);
    await pagina.waitForTimeout(150);
    const alParar = await pagina.evaluate((q) => {
      const a = document.activeElement;
      return { etiqueta: a?.tagName, alFrente: Boolean(a?.closest("li[data-frente]")), escondido: Boolean(a?.closest("[aria-hidden=true]")), ficha: Number(document.querySelector(`${q} li[data-frente]`)?.dataset.ficha) };
    }, C("carrusel-3"));
    revisar(girando.enLaRaiz && !girando.escondido && alParar.etiqueta === "A" && alParar.alFrente && !alParar.escondido && alParar.ficha === 0 && avisos.length === 0, `mientras gira, el foco espera en el carrusel; al detenerse pasa al enlace del frente, y el navegador no reclama por foco en algo escondido (${JSON.stringify({ girando, alParar })}; avisos: ${avisos.length}${avisos.length ? `: ${avisos[0]}` : ""})`);
    // Una foto que no cargó vuelve cuando llega una dirección buena.
    await ver(pagina, "carrusel-cambia", 1500);
    const mala = await pagina.evaluate((q) => document.querySelector(`${q} li[data-ficha="0"] .mk-m-carrusel-ficha`)?.hasAttribute("data-sin-foto"), C("carrusel-cambia"));
    await apretar(pagina, "[data-prueba=corregir-foto]");
    await pagina.waitForTimeout(900);
    const buena = await pagina.evaluate((q) => {
      const f = document.querySelector(`${q} li[data-ficha="0"] .mk-m-carrusel-ficha`);
      return { sinFoto: f?.hasAttribute("data-sin-foto"), foto: Boolean(f?.querySelector("img")?.naturalWidth) };
    }, C("carrusel-cambia"));
    revisar(mala === true && buena.sinFoto === false && buena.foto, `una foto que no cargó vuelve a verse cuando se corrige su dirección (${JSON.stringify({ mala, buena })})`);
    await ctx.close();
  }
  {
    // Si el archivo no baja, queda el respaldo.
    const { ctx, pagina, errores } = await abrir({}, (p) => p.route(/CarruselGiratorio/, (r) => r.abort()));
    await ver(pagina, "carrusel", 900);
    const v = await pagina.evaluate((q) => ({ respaldo: document.querySelector(`${q} [data-respaldo]`)?.textContent, pieza: document.querySelectorAll(`${q} .mk-m-carrusel`).length }), seccion("carrusel"));
    revisar(v.respaldo === "Lo más pedido." && v.pieza === 0 && errores.length === 0, `si el archivo del carrusel no baja, se ve el respaldo y la página sigue (${JSON.stringify(v)})`);
    await ctx.close();
  }
}

// --- Libro que se abre ---
if (parte("libro")) {
  const L = (id) => `${seccion(id)} .mk-m-libro`;
  /** Lo que se ve del libro de una sección: su modo, cuántas hojas van pasadas, lo que dice y qué página hay en cada mitad. */
  const estado = (pagina, id) =>
    pagina.evaluate((q) => {
      const l = document.querySelector(q);
      if (!l) return null;
      const pila = l.querySelector(".mk-m-libro-pila");
      const caja = pila?.getBoundingClientRect();
      // Qué cara está a la vista en un punto (la tapa, el número de la página, «blanco» o nada).
      const en = (x, y) => document.elementFromPoint(x, y)?.closest("[data-cara]")?.getAttribute("data-cara") ?? null;
      const y = caja ? caja.top + Math.min(caja.height / 2, 120) : 0;
      return {
        modo: l.dataset.modo,
        vueltas: l.dataset.vueltas === undefined ? null : Number(l.dataset.vueltas),
        dice: l.querySelector("[data-estado-libro]")?.textContent ?? null,
        izquierda: caja && l.dataset.modo === "doble" ? en(caja.left - caja.width / 2, y) : null,
        derecha: caja ? en(caja.left + caja.width / 2, y) : null,
        lineas: l.querySelectorAll(":is(.mk-m-libro-texto, .mk-m-libro-plano) [data-linea]").length,
        paginas: l.querySelectorAll(":is(.mk-m-libro-texto, .mk-m-libro-plano) [data-pagina]").length,
        hojas: l.querySelectorAll(".mk-m-libro-hoja").length,
        hojasALectores: l.querySelectorAll(".mk-m-libro-hoja:not([aria-hidden=true])").length,
        enVivo: l.querySelector("[data-estado-libro]")?.getAttribute("aria-live") ?? null,
        nombres: [...l.querySelectorAll("[data-ir]")].map((b) => b.getAttribute("aria-label") ?? b.textContent).join(" | "),
        botonesX: [...l.querySelectorAll("[data-ir]")].map((b) => Math.round(b.getBoundingClientRect().left)).join(","),
        girando: [...l.querySelectorAll(".mk-m-libro-hoja")].filter((h) => h.getAnimations().length).length,
        botones: [...l.querySelectorAll("[data-ir]")].map((b) => `${b.dataset.ir}${b.getAttribute("aria-disabled") === "true" ? "(apagado)" : ""}`).join(" "),
      };
    }, L(id));
  /** Espera a que ninguna hoja esté girando. */
  const quieto = async (pagina, id) => {
    for (let i = 0; i < 40; i++) {
      await pagina.waitForTimeout(120);
      if ((await estado(pagina, id))?.girando === 0) return;
    }
  };
  const ir = async (pagina, id, cual) => {
    await apretar(pagina, `${L(id)} [data-ir=${cual}]`);
    await quieto(pagina, id);
  };
  {
    const { ctx, pagina, errores } = await abrir();
    // Antes de verse está cerrado (se espera a que llegue su archivo; la sección está lejos, más abajo).
    await pagina.waitForSelector(L("libro"), { state: "attached", timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(900);
    const lejos = await estado(pagina, "libro");
    await ver(pagina, "libro", 900);
    await quieto(pagina, "libro");
    const abierto = await estado(pagina, "libro");
    revisar(lejos && lejos.vueltas === 0 && abierto.modo === "doble" && abierto.vueltas === 1 && abierto.dice === "Páginas 1 y 2 de 4" && abierto.izquierda === "0" && abierto.derecha === "1", `en pantalla ancha el libro espera cerrado y, al verse, la tapa se abre sola: quedan dos páginas a la vista (${JSON.stringify(abierto)})`);
    revisar(abierto.lineas === 15 && abierto.paginas === 4, `todo el texto de la carta está en la página, aunque no se vea (${abierto.lineas} líneas en ${abierto.paginas} páginas)`);
    // Las páginas que están a la vista se leen a plena opacidad.
    const lectura = await pagina.evaluate((q) => {
      const efectiva = (e) => {
        let o = 1;
        for (let n = e; n && n !== document.body; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      };
      return [0, 1].map((i) => efectiva(document.querySelector(`${q} .mk-m-libro-hoja [data-pagina="${i}"] [data-linea] b`)));
    }, L("libro"));
    revisar(lectura.every((o) => o === 1), `las páginas a la vista se leen a plena opacidad (${lectura.join(", ")})`);
    revisar(abierto.enVivo === "off" && abierto.nombres === "Página anterior | Página siguiente | Cerrar" && abierto.hojasALectores === 0, `que se abra solo no le habla a los lectores; los botones tienen nombre completo y las hojas que se ven son decoración (${JSON.stringify({ enVivo: abierto.enVivo, nombres: abierto.nombres, hojasALectores: abierto.hojasALectores })})`);
    const mov = await pagina.evaluate((q) => {
      const h = document.querySelector(`${q} .mk-m-libro-hoja`);
      return { que: getComputedStyle(h).transitionProperty, rol: document.querySelector(q).getAttribute("role"), nombre: document.querySelector(q).getAttribute("aria-label") };
    }, L("libro"));
    revisar(/^transform(, opacity)?$/.test(mov.que) && mov.rol === "group" && mov.nombre === "La carta", `las hojas solo animan transform y opacity, y el libro tiene nombre para lectores (${JSON.stringify(mov)})`);
    await ir(pagina, "libro", "despues");
    const dos = await estado(pagina, "libro");
    revisar(dos.vueltas === 2 && dos.dice === "Páginas 3 y 4 de 4" && dos.izquierda === "2" && dos.derecha === "3" && /despues\(apagado\)/.test(dos.botones), `«Siguiente» da vuelta la hoja: se ven las páginas 3 y 4, y al final el botón queda apagado (${JSON.stringify(dos)})`);
    await ir(pagina, "libro", "despues");
    const tope = await estado(pagina, "libro");
    await ir(pagina, "libro", "antes");
    const vuelta = await estado(pagina, "libro");
    revisar(tope.vueltas === 2 && vuelta.vueltas === 1 && vuelta.izquierda === "0" && vuelta.derecha === "1", `en la última página «Siguiente» no hace nada, y «Anterior» vuelve (${tope.vueltas} → ${vuelta.vueltas})`);
    // Tocar la página: la derecha avanza, la izquierda retrocede.
    const caja = await pagina.locator(`${L("libro")} .mk-m-libro-pila`).boundingBox();
    await pagina.mouse.click(caja.x + caja.width * 0.6, caja.y + 200);
    await quieto(pagina, "libro");
    const tocoDerecha = (await estado(pagina, "libro")).vueltas;
    await pagina.mouse.click(caja.x - caja.width * 0.4, caja.y + 200);
    await quieto(pagina, "libro");
    const tocoIzquierda = (await estado(pagina, "libro")).vueltas;
    // En la primera página, tocar a la izquierda no cierra el libro (para eso está el botón).
    await pagina.mouse.click(caja.x - caja.width * 0.4, caja.y + 200);
    await quieto(pagina, "libro");
    const noCierra = await estado(pagina, "libro");
    revisar(tocoDerecha === 2 && tocoIzquierda === 1 && noCierra.vueltas === 1 && noCierra.enVivo === "polite", `tocar la página de la derecha avanza y la de la izquierda retrocede, sin cerrar el libro; desde que alguien lo mueve, el estado se dice a los lectores (${tocoDerecha}, ${tocoIzquierda}, ${noCierra.vueltas}; ${noCierra.enVivo})`);
    // Teclado: las flechas actúan solo con el foco dentro, y no mueven al otro libro.
    await pagina.evaluate(() => document.activeElement?.blur());
    await pagina.keyboard.press("ArrowRight");
    await pagina.waitForTimeout(300);
    const sinFoco = (await estado(pagina, "libro")).vueltas;
    await pagina.locator(`${L("libro")} [data-ir=despues]`).focus();
    await pagina.keyboard.press("ArrowRight");
    await quieto(pagina, "libro");
    const conFoco = await estado(pagina, "libro");
    const focoSigue = await pagina.evaluate((q) => document.activeElement === document.querySelector(`${q} [data-ir=despues]`), L("libro"));
    const otro = await estado(pagina, "libro-una");
    revisar(sinFoco === 1 && conFoco.vueltas === 2 && focoSigue && otro.vueltas <= 1 && otro.dice !== conFoco.dice, `las flechas pasan la página solo con el foco dentro, el foco no se pierde y el otro libro no se mueve (${sinFoco} → ${conFoco.vueltas}; el otro dice «${otro.dice}»)`);
    // A media lectura el bloque se angosta (se giró el teléfono): se sigue leyendo la misma hoja y nada queda a medio girar.
    await pagina.setViewportSize({ width: 520, height: 900 });
    await pagina.waitForTimeout(250);
    const angosto = await estado(pagina, "libro");
    await pagina.setViewportSize({ width: 1280, height: 900 });
    await pagina.waitForTimeout(250);
    const anchoOtraVez = await estado(pagina, "libro");
    revisar(angosto.modo === "simple" && angosto.vueltas === 3 && angosto.dice === "Página 3 de 4" && angosto.girando === 0 && anchoOtraVez.modo === "doble" && anchoOtraVez.vueltas === 2 && anchoOtraVez.dice === "Páginas 3 y 4 de 4" && anchoOtraVez.girando === 0, `al angostarse a media lectura sigue en la misma hoja, sin hojas a medio girar, y al ensancharse vuelve (${JSON.stringify({ angosto: [angosto.modo, angosto.dice, angosto.girando], ancho: [anchoOtraVez.modo, anchoOtraVez.dice, anchoOtraVez.girando] })})`);
    // «Cerrar» vuelve a la tapa y no se abre solo de nuevo.
    await ver(pagina, "libro", 300);
    await ir(pagina, "libro", "cerrar");
    await pagina.evaluate(() => window.scrollTo(0, 0));
    await pagina.waitForTimeout(500);
    // También al cambiar de ancho (pasa de dos páginas a una y vuelve): sigue cerrado.
    await pagina.setViewportSize({ width: 520, height: 900 });
    await ver(pagina, "libro", 900);
    await pagina.setViewportSize({ width: 1280, height: 900 });
    await ver(pagina, "libro", 1200);
    const cerrado = await estado(pagina, "libro");
    revisar(cerrado.vueltas === 0 && cerrado.dice === "Tapa" && cerrado.derecha === "tapa" && /antes\(apagado\).*cerrar\(apagado\)/.test(cerrado.botones), `«Cerrar» vuelve a la tapa, y al salir de la vista y volver no se abre solo otra vez (${JSON.stringify(cerrado)})`);
    // Los botones no se corren al abrir ni al llegar al final (lo que se aprieta no se mueve bajo el cursor).
    await ir(pagina, "libro", "despues");
    const b1 = await estado(pagina, "libro");
    await ir(pagina, "libro", "despues");
    const b2 = await estado(pagina, "libro");
    revisar(cerrado.nombres.startsWith("Página anterior | Abrir la carta") && b1.botonesX === cerrado.botonesX && b2.botonesX === cerrado.botonesX, `los botones quedan en su lugar al abrir y al llegar al final (${cerrado.botonesX} · ${b1.botonesX} · ${b2.botonesX})`);
    // Una sola hoja: a la izquierda la página, a la derecha la contratapa en blanco.
    await ver(pagina, "libro-una", 1500);
    await quieto(pagina, "libro-una");
    const una = await estado(pagina, "libro-una");
    revisar(una.vueltas === 1 && una.dice === "Página 1 de 1" && una.izquierda === "0" && una.derecha === "blanco", `con una sola hoja se abre igual: la página a la izquierda y la contratapa en blanco a la derecha (${JSON.stringify(una)})`);
    // El libro no usa bucles: solo transiciones.
    const cuadros = await pagina.evaluate(() => window.__cuadros.libro);
    // Dar vuelta una hoja y salir de la página a medio giro: sin errores.
    await apretar(pagina, `${L("libro-una")} [data-ir=cerrar]`);
    await pagina.waitForTimeout(120);
    await pagina.evaluate(() => (location.hash = ""));
    await pagina.waitForTimeout(500);
    revisar(cuadros === 0 && errores.length === 0, `el libro no pide cuadros (solo transiciones) y salir a medio giro no deja errores (${cuadros} cuadros${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
  {
    // Un grupo largo, datos raros y sin hojas.
    const { ctx, pagina, errores } = await abrir();
    await ver(pagina, "libro-largo", 1500);
    const largo = await pagina.evaluate((q) => {
      const l = document.querySelector(q);
      const t = l.querySelector(".mk-m-libro-texto");
      return { titulos: [...t.querySelectorAll("[data-pagina] h3")].map((h) => h.textContent), lineas: [...t.querySelectorAll("[data-pagina]")].map((p) => p.querySelectorAll("[data-linea]").length), ultimo: [...t.querySelectorAll("[data-linea] b")].at(-1)?.textContent };
    }, L("libro-largo"));
    revisar(largo.titulos.join("|") === "Sándwiches|Sándwiches (sigue)|Sándwiches (sigue)" && largo.lineas.join(",") === "10,10,3" && largo.ultimo === "Sándwich número 23", `un grupo de 23 platos sigue en las hojas siguientes, sin perder ninguno (${JSON.stringify(largo)})`);
    await ver(pagina, "libro", 1500);
    const agotado = await pagina.evaluate((q) => document.querySelector(`${q} [data-linea][data-agotado]`)?.textContent ?? "", L("libro"));
    revisar(/Quiche del día.*Agotado/.test(agotado), `un plato agotado lo dice en texto («${agotado}»)`);
    await ver(pagina, "libro-bordes", 1500);
    const raros = await pagina.evaluate((q) => {
      const l = document.querySelector(q);
      const caja = l.getBoundingClientRect();
      return {
        paginas: l.querySelectorAll(".mk-m-libro-texto [data-pagina]").length,
        tituloTapa: l.querySelector(".mk-m-libro-tapa-titulo")?.textContent.length,
        linea: l.querySelector("[data-linea] b")?.textContent.length,
        // Ninguna cara se sale del libro de lado.
        seSale: [...l.querySelectorAll(".mk-m-libro-cara *")].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow === "visible").length,
        desborde: window.__desborde(),
        ancho: Math.round(caja.width),
      };
    }, L("libro-bordes"));
    revisar(raros.paginas === 16 && raros.tituloTapa === 80 && raros.linea === 80 && raros.desborde <= 0, `con datos raros: dieciséis hojas como máximo, textos cortados y nada se sale de lado (${JSON.stringify(raros)})`);
    // Una carta de dieciséis hojas: en 3D van solo las cercanas a la que se lee (cada hoja es una capa en la tarjeta
    // gráfica; todas juntas no caben en un teléfono). El texto completo sigue en la página.
    await quieto(pagina, "libro-bordes");
    const alAbrir = await estado(pagina, "libro-bordes");
    for (let i = 0; i < 5; i++) await ir(pagina, "libro-bordes", "despues");
    const adentro = await estado(pagina, "libro-bordes");
    await ir(pagina, "libro-bordes", "cerrar");
    const alCerrar = await estado(pagina, "libro-bordes");
    revisar(alAbrir.hojas <= 4 && adentro.hojas <= 4 && adentro.hojasALectores === 0 && adentro.paginas === 16 && adentro.dice === "Página 6 de 16" && adentro.derecha === "5" && alCerrar.vueltas === 0 && alCerrar.derecha === "tapa" && alCerrar.girando === 0, `con dieciséis hojas solo las cercanas van en 3D (${alAbrir.hojas} y ${adentro.hojas} hojas dibujadas), el texto completo sigue en la página y se ve la página que dice; al cerrar desde adentro queda la tapa (${JSON.stringify({ dice: adentro.dice, derecha: adentro.derecha, paginas: adentro.paginas, alCerrar: [alCerrar.vueltas, alCerrar.derecha] })})`);
    const vacio = await pagina.evaluate((q) => document.querySelectorAll(`${q} .mk-m-libro`).length, seccion("libro-vacio"));
    revisar(vacio === 0 && errores.length === 0, `sin hojas no se dibuja nada, y no hay errores${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  for (const [que, opciones, nivel] of [["en nivel liviano", {}, "liviano"], ["con movimiento reducido", { reducedMotion: "reduce" }, ""]]) {
    const { ctx, pagina, errores } = await abrir(opciones);
    if (nivel) await pagina.selectOption("[data-prueba=nivel]", nivel);
    await ver(pagina, "libro", 900);
    const plano = await pagina.evaluate((q) => {
      const l = document.querySelector(q);
      const paginas = [...l.querySelectorAll("[data-pagina]")];
      return {
        modo: l.dataset.modo,
        botones: l.querySelectorAll("button").length,
        titulo: l.querySelector(".mk-m-libro-plano-titulo")?.textContent,
        // Todas las páginas se ven, una debajo de otra.
        visibles: paginas.filter((p) => p.getBoundingClientRect().height > 20 && p.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) !== false).length,
        enOrden: paginas.every((p, i) => i === 0 || p.getBoundingClientRect().top >= paginas[i - 1].getBoundingClientRect().bottom - 1),
        animando: l.getAnimations({ subtree: true }).length,
      };
    }, L("libro"));
    revisar(plano.modo === "plano" && plano.botones === 0 && plano.titulo === "La carta" && plano.visibles === 4 && plano.enOrden && plano.animando === 0 && errores.length === 0, `${que}: la carta plana, con todas las hojas una debajo de otra, sin botones y sin nada animándose (${JSON.stringify(plano)})`);
    await ctx.close();
  }
  {
    // Teléfono: de a una página.
    const { ctx, pagina, errores } = await abrir({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
    await ver(pagina, "libro", 1500);
    await quieto(pagina, "libro");
    const uno = await estado(pagina, "libro");
    await ir(pagina, "libro", "despues");
    const dos = await estado(pagina, "libro");
    const medidas = await pagina.evaluate((q) => ({ botones: [...document.querySelectorAll(`${q} [data-ir]`)].every((b) => b.getBoundingClientRect().height >= 44 && b.getBoundingClientRect().width >= 44), desborde: window.__desborde(), pasadas: [...document.querySelectorAll(`${q} .mk-m-libro-hoja[data-pasada]`)].map((h) => getComputedStyle(h).opacity).join(",") }), L("libro"));
    revisar(uno.modo === "simple" && uno.vueltas === 1 && uno.dice === "Página 1 de 4" && uno.derecha === "0" && dos.dice === "Página 2 de 4" && dos.derecha === "1" && medidas.botones && medidas.desborde <= 0 && medidas.pasadas === "0,0" && errores.length === 0, `en un teléfono va de a una página: la que dice el estado es la que se ve, los botones miden 44 px o más y nada se sale de lado (${JSON.stringify({ uno: [uno.dice, uno.derecha], dos: [dos.dice, dos.derecha], ...medidas })})`);
    await ctx.close();
  }
  {
    // Si el archivo no baja, queda el respaldo.
    const { ctx, pagina, errores } = await abrir({}, (p) => p.route(/LibroQueSeAbre/, (r) => r.abort()));
    await ver(pagina, "libro", 900);
    const v = await pagina.evaluate((q) => ({ respaldo: document.querySelector(`${q} [data-respaldo]`)?.textContent, pieza: document.querySelectorAll(`${q} .mk-m-libro`).length }), seccion("libro"));
    revisar(v.respaldo === "La carta del café." && v.pieza === 0 && errores.length === 0, `si el archivo del libro no baja, se ve el respaldo y la página sigue (${JSON.stringify(v)})`);
    await ctx.close();
  }
}

// --- Cierre: las tres piezas en Safari (WebKit) ---
if (parte("cierre")) {
  const safari = await webkit.launch().catch(() => null);
  if (!safari) revisar(false, "WebKit no está instalado: no se pudo probar en Safari (npx playwright install webkit)");
  else {
    const { ctx, pagina, errores } = await abrir({}, undefined, safari);
    await ver(pagina, "fuegos", 400);
    await apretar(pagina, "[data-prueba=celebrar]");
    await pagina.waitForSelector(`${seccion("fuegos")} canvas.mk-m-fuegos`, { state: "attached", timeout: 5000 }).catch(() => {});
    await pagina.waitForTimeout(1100);
    const pintado = await pagina.evaluate((q) => {
      const c = document.querySelector(q);
      if (!c || !c.width) return -1;
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++;
      return n;
    }, `${seccion("fuegos")} canvas.mk-m-fuegos`);
    await pagina.waitForSelector(`${seccion("fuegos")} canvas.mk-m-fuegos`, { state: "detached", timeout: 6000 }).catch(() => {});
    const fin = await pagina.locator("[data-prueba=fuegos-fin]").innerText();
    revisar(pintado > 500 && fin === "1", `Safari: los fuegos dibujan, terminan y avisan (${pintado} puntos pintados; avisos: ${fin})`);
    await ver(pagina, "carrusel", 1500);
    await apretar(pagina, `${seccion("carrusel")} [data-ir=despues]`);
    await pagina.waitForTimeout(1500);
    const c = await pagina.evaluate((q) => {
      const r = document.querySelector(q);
      const f = r?.querySelector("li[data-frente]")?.getBoundingClientRect();
      const caja = r?.getBoundingClientRect();
      return r && f ? { modo: r.dataset.modo, frente: Number(r.querySelector("li[data-frente]").dataset.ficha), centrada: Math.abs(f.left + f.width / 2 - (caja.left + caja.width / 2)) < 3, dicho: r.querySelector("[data-dicho]")?.textContent } : null;
    }, `${seccion("carrusel")} .mk-m-carrusel`);
    revisar(c && c.modo === "anillo" && c.frente === 1 && c.centrada && /Ficha 2 de 6/.test(c.dicho), `Safari: el carrusel arma su anillo y gira con el botón hasta la ficha que sigue (${JSON.stringify(c)})`);
    await ver(pagina, "libro", 2200);
    await apretar(pagina, `${seccion("libro")} [data-ir=despues]`);
    await pagina.waitForTimeout(1500);
    const l = await pagina.evaluate((q) => {
      const r = document.querySelector(q);
      const caja = r?.querySelector(".mk-m-libro-pila")?.getBoundingClientRect();
      const en = (x, y) => document.elementFromPoint(x, y)?.closest("[data-cara]")?.getAttribute("data-cara") ?? null;
      return r && caja ? { modo: r.dataset.modo, dice: r.querySelector("[data-estado-libro]")?.textContent, izquierda: en(caja.left - caja.width / 2, caja.top + 120), derecha: en(caja.left + caja.width / 2, caja.top + 120) } : null;
    }, `${seccion("libro")} .mk-m-libro`);
    revisar(l && l.modo === "doble" && l.dice === "Páginas 3 y 4 de 4" && l.izquierda === "2" && l.derecha === "3", `Safari: el libro se abre y da vuelta la hoja; se ven las páginas que dice (${JSON.stringify(l)})`);
    revisar(errores.length === 0, `Safari: sin errores${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
    await safari.close();
  }
  {
    // En un teléfono, la vitrina entera de los efectos vistosos no se sale de lado.
    const { ctx, pagina, errores } = await abrir({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
    for (const id of ["fuegos", "carrusel", "carrusel-bordes", "libro", "libro-bordes"]) await ver(pagina, id, 500);
    const desborde = await sinDesborde(pagina);
    revisar(desborde <= 0 && errores.length === 0, `en un teléfono de 360 px nada de la vitrina se sale de lado (${desborde} px${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
