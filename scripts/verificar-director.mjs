// La prueba genérica del Director: revisa las reglas de la casa en cada partitura de ejemplo (y en cualquiera que se
// le pase a `#director?d=…`), más los casos que el diseño marcó como riesgo.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-director.mjs [http://localhost:5173] [parte]`,
// donde la parte (opcional) es reglas, senales, react, sin, hostil, revision o vitrina. Con `reglas` se puede sumar el nombre de
// un solo ejemplo: `… reglas portada`.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const solo = process.argv[3];
const parte = (nombre) => !solo || solo === nombre;
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const navegador = await chromium.launch();

/** Los ejemplos; con un cuarto argumento, solo ese (para repetir una revisión rápido). */
const EJEMPLOS = ["portada", "tarjetas", "paralaje", "iman", "inercia", "boton"].filter((n) => !process.argv[4] || n === process.argv[4]);
/** Lo que hay que saber de cada ejemplo para probarlo. */
const DE = {
  portada: { entrada: true, scroll: true, tocable: ".dir-botones a", reposoNatural: true },
  tarjetas: { entrada: true, repite: true, tocable: ".dir-tarjetita", reposoNatural: true },
  paralaje: { scroll: true, arriba: 110 },
  iman: { puntero: true, reposoNatural: true },
  inercia: { scroll: true, velocidad: true },
  boton: { estado: true, reposoNatural: true },
};
const ESCENARIO = "[data-prueba=dir-escenario]";

/** Abre `#director?d=…` con un pedido. `antes`: guiones que corren en la página antes de cargar. */
async function abrir(pedido, { opciones = {}, antes = [] } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  // Cuenta los cuadros pedidos: en reposo, el Director no pide ninguno.
  await pagina.addInitScript(() => {
    window.__cuadros = 0;
    const pedir = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (f) => {
      window.__cuadros++;
      return pedir(f);
    };
  });
  for (const f of antes) await pagina.addInitScript(f);
  await pagina.goto(`${base}/#director?d=${Buffer.from(JSON.stringify(pedido)).toString("base64url")}`);
  await pagina.waitForSelector(ESCENARIO, { timeout: 8000 }).catch(() => {});
  return { ctx, pagina, errores };
}

/** Lleva la cuenta de los oyentes del documento y la ventana, y de los observadores activos. */
const contarOyentes = () => {
  const vivos = new Map();
  const numeros = new WeakMap();
  let n = 0;
  const numero = (f) => {
    if (!numeros.has(f)) numeros.set(f, ++n);
    return numeros.get(f);
  };
  const captura = (o) => (typeof o === "boolean" ? o : Boolean(o && o.capture));
  for (const [destino, nombre] of [[document, "documento"], [window, "ventana"]]) {
    const poner = destino.addEventListener.bind(destino);
    const quitar = destino.removeEventListener.bind(destino);
    destino.addEventListener = (tipo, f, o) => {
      if (f && !(o && typeof o === "object" && o.once)) vivos.set(`${nombre}:${tipo}:${captura(o)}:${numero(f)}`, `${nombre}:${tipo}`);
      return poner(tipo, f, o);
    };
    destino.removeEventListener = (tipo, f, o) => {
      if (f) vivos.delete(`${nombre}:${tipo}:${captura(o)}:${numero(f)}`);
      return quitar(tipo, f, o);
    };
  }
  const activos = new Map();
  for (const nombre of ["IntersectionObserver", "ResizeObserver", "MutationObserver"]) {
    const Real = window[nombre];
    window[nombre] = class extends Real {
      observe(...a) {
        activos.set(this, nombre);
        return super.observe(...a);
      }
      disconnect() {
        activos.delete(this);
        return super.disconnect();
      }
    };
  }
  window.__vivos = () => [...vivos.values(), ...activos.values()].sort();
};

/** Dónde está y cuánto se ve cada parte (y sus hijos propios) del escenario. */
const foto = (pagina) =>
  pagina.evaluate((q) => {
    const raiz = document.querySelector(q);
    const partes = [...raiz.querySelectorAll("[data-mk-parte]")];
    const todos = [...new Set(partes.flatMap((p) => [p, ...[...p.children].filter((h) => !h.hasAttribute("data-mk-d"))]))];
    return todos.map((e) => {
      const r = e.getBoundingClientRect();
      let o = 1;
      for (let n = e; n && n !== raiz.parentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
      return { x: r.x, y: r.y + scrollY, ancho: r.width, alto: r.height, opacidad: o };
    });
  }, ESCENARIO);
/** La mayor diferencia entre dos fotos. */
const diferencia = (a, b) => {
  if (a.length !== b.length) return { px: Infinity, opacidad: Infinity };
  let px = 0;
  let opacidad = 0;
  a.forEach((p, i) => {
    px = Math.max(px, Math.abs(p.x - b[i].x), Math.abs(p.y - b[i].y), Math.abs(p.ancho - b[i].ancho), Math.abs(p.alto - b[i].alto));
    opacidad = Math.max(opacidad, Math.abs(p.opacidad - b[i].opacidad));
  });
  return { px, opacidad };
};
const igual = (d) => d.px <= 0.6 && d.opacidad <= 0.02;
const corta = (d) => `${Number.isFinite(d.px) ? d.px.toFixed(2) : "∞"} px, ${Number.isFinite(d.opacidad) ? d.opacidad.toFixed(3) : "∞"} de opacidad`;

/** Las animaciones del Director (no las de CSS de la página), con lo que importa de cada una. */
const animaciones = (pagina) =>
  pagina.evaluate(() =>
    document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).map((a) => ({
      estado: a.playState,
      ahora: Number(a.currentTime),
      porTiempo: a.timeline instanceof DocumentTimeline,
      propiedades: [...new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)))].filter((k) => !["offset", "easing", "composite", "computedOffset"].includes(k)),
      dura: Number(a.effect.getTiming().duration),
    })),
  );
const cuadrosEn = async (pagina, ms) => {
  const a = await pagina.evaluate(() => window.__cuadros);
  await pagina.waitForTimeout(ms);
  return (await pagina.evaluate(() => window.__cuadros)) - a;
};
/** El texto que oye un lector de pantalla: el de los nodos que no están ocultos para él. */
const leido = (pagina) =>
  pagina.evaluate((q) => {
    const raiz = document.querySelector(q);
    const paseo = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    let t = "";
    for (let n = paseo.nextNode(); n; n = paseo.nextNode()) if (!n.parentElement.closest("[aria-hidden=true]")) t += n.nodeValue;
    return t.replace(/\s+/g, " ").trim();
  }, ESCENARIO);
/** El texto que se ve: el de los nodos que no son la copia para lectores. */
const visto = (pagina) =>
  pagina.evaluate((q) => {
    const raiz = document.querySelector(q);
    const paseo = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    let t = "";
    for (let n = paseo.nextNode(); n; n = paseo.nextNode()) if (!n.parentElement.closest("[data-mk-d=lector]")) t += n.nodeValue;
    return t.replace(/\s+/g, " ").trim();
  }, ESCENARIO);
const PERMITIDAS = ["transform", "translate", "rotate", "scale", "opacity"];
const manual = (pagina, f, ...a) => pagina.evaluate(([cuerpo, args]) => new Function("m", "a", cuerpo)(window.__mkDirectores, args), [f, a]);

// --- Las reglas de la casa, para cada partitura de ejemplo ---
if (parte("reglas")) {
  for (const nombre of EJEMPLOS) {
    const de = DE[nombre];
    const pedido = { ejemplo: nombre, arriba: de.arriba ?? 0 };
    // La página tal cual, sin partitura: contra esto se compara.
    const natural = await abrir({ ...pedido, sin: true });
    await natural.pagina.waitForTimeout(300);
    const fotoNatural = await foto(natural.pagina);
    const htmlNatural = await natural.pagina.locator(ESCENARIO).innerHTML();
    const textoNatural = await leido(natural.pagina);
    const vistoNatural = await visto(natural.pagina);
    await natural.ctx.close();

    {
      // 1. Con movimiento reducido no hay animaciones y todo está en su lugar.
      const { ctx, pagina, errores } = await abrir(pedido, { opciones: { reducedMotion: "reduce" } });
      await pagina.waitForTimeout(400);
      const a = await animaciones(pagina);
      const d = diferencia(fotoNatural, await foto(pagina));
      const html = await pagina.locator(ESCENARIO).innerHTML();
      revisar(a.length === 0 && igual(d) && html === htmlNatural && errores.length === 0, `${nombre} 1: con movimiento reducido no hay animaciones y la página queda tal cual (${a.length} animaciones; ${corta(d)})`);
      await ctx.close();
    }
    {
      // 2. Al terminar no quedan animaciones por tiempo corriendo ni cuadros pedidos en reposo.
      const { ctx, pagina, errores } = await abrir(pedido);
      await pagina.waitForTimeout(3600);
      const a = await animaciones(pagina);
      const corriendo = a.filter((x) => x.porTiempo && x.estado === "running").length;
      const vivas = a.filter((x) => x.porTiempo).length;
      const cuadros = await cuadrosEn(pagina, 800);
      const d = de.reposoNatural ? diferencia(fotoNatural, await foto(pagina)) : { px: 0, opacidad: 0 };
      revisar(corriendo === 0 && vivas === 0 && cuadros === 0 && igual(d) && errores.length === 0, `${nombre} 2: al terminar no queda nada por tiempo ni cuadros en reposo, y todo vuelve a su lugar (${vivas} vivas, ${cuadros} cuadros; ${corta(d)}${errores.length ? `; ${errores[0]}` : ""})`);
      // 6. Solo se animan las propiedades permitidas (también lo que escribe el compás en el estilo).
      const propiedades = [...new Set(a.flatMap((x) => x.propiedades))];
      const estilos = await pagina.evaluate((q) => [...new Set([...document.querySelectorAll(`${q} [data-mk-parte]`)].flatMap((e) => [...e.style]))], ESCENARIO);
      revisar(propiedades.every((x) => PERMITIDAS.includes(x)) && estilos.every((x) => PERMITIDAS.includes(x)), `${nombre} 6: solo se anima posición, tamaño, giro y opacidad (${[...propiedades, ...estilos].join(", ") || "nada vivo"})`);
      // 9. El texto para lectores de pantalla es el original, y el que se ve también.
      const [oye, ve] = [await leido(pagina), await visto(pagina)];
      revisar(oye === textoNatural && ve === vistoNatural, `${nombre} 9: el texto que se lee y el que se ve son los originales («${oye.slice(0, 40)}…»)`);
      // 5 y 7. Al quitar la partitura no queda nada, y el HTML es el original.
      await pagina.locator("[data-prueba=dir-quitar]").evaluate((b) => b.click());
      await pagina.waitForTimeout(300);
      const sin = { animaciones: (await animaciones(pagina)).length, marcas: await pagina.locator("[data-mk-d]").count(), html: (await pagina.locator(ESCENARIO).innerHTML()) === htmlNatural, cuadros: await cuadrosEn(pagina, 500) };
      revisar(sin.animaciones === 0 && sin.marcas === 0 && sin.html && sin.cuadros === 0 && errores.length === 0, `${nombre} 5: al quitar la partitura no quedan animaciones ni texto cortado, y el HTML es el original (${JSON.stringify(sin)})`);
      await ctx.close();
    }
    {
      // 5 (oyentes). Montar y desmontar dos veces: no crecen los oyentes ni los observadores.
      const { ctx, pagina, errores } = await abrir(pedido, { antes: [contarOyentes] });
      await pagina.waitForTimeout(600);
      const apretar = async () => {
        await pagina.locator("[data-prueba=dir-desmontar]").evaluate((b) => b.click());
        await pagina.waitForTimeout(350);
      };
      await apretar();
      const fuera1 = await pagina.evaluate(() => window.__vivos());
      await apretar();
      await pagina.mouse.move(400, 300);
      await pagina.mouse.wheel(0, 300);
      await pagina.waitForTimeout(400);
      const dentro = await pagina.evaluate(() => window.__vivos());
      await apretar();
      const fuera2 = await pagina.evaluate(() => window.__vivos());
      const restos = { animaciones: (await animaciones(pagina)).length, cuadros: await cuadrosEn(pagina, 500) };
      revisar(fuera1.join() === fuera2.join() && dentro.length > fuera1.length && restos.animaciones === 0 && restos.cuadros === 0 && errores.length === 0, `${nombre} 5: al desmontar no quedan oyentes, observadores, animaciones ni cuadros (montado ${dentro.length}, fuera ${fuera1.length} y ${fuera2.length}; ${JSON.stringify(restos)})`);
      await ctx.close();
    }
    {
      // 8 y 10. Con reloj manual: en cada instante nada se sale de lado a 360 px, y el mismo instante da el mismo cuadro.
      const { ctx, pagina, errores } = await abrir({ ...pedido, reloj: "manual" }, { opciones: { viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true } });
      await pagina.waitForTimeout(300);
      const en = async (ms, senal) => {
        await manual(pagina, "m[0].irA(a[0]); m[0].senal('vista', a[1]); m[0].senal('scroll', a[1]); m[0].senal('puntero', { x: a[1] * 2 - 1, y: 1 - a[1] * 2 }); m[0].senal('velocidad', a[1] * 2 - 1); m[0].avanzar(3000);", ms, senal);
        return { foto: await foto(pagina), sobra: await pagina.evaluate((q) => Math.max(document.documentElement.scrollWidth - 360, document.querySelector(q).scrollWidth - document.querySelector(q).clientWidth), ESCENARIO) };
      };
      const pasos = [[0, 0], [150, 0.2], [400, 0.5], [900, 0.8], [1700, 1], [9000, 0.5]];
      const vistas = [];
      for (const [ms, s] of pasos) vistas.push(await en(ms, s));
      const otraVez = await en(400, 0.5);
      const sobra = Math.max(...vistas.map((v) => v.sobra));
      const d = diferencia(vistas[2].foto, otraVez.foto);
      const seMueve = diferencia(vistas[0].foto, vistas[2].foto);
      revisar(sobra <= 0 && errores.length === 0, `${nombre} 8: a 360 px nada se sale de lado en ningún instante (${sobra} px en ${pasos.length} instantes)`);
      revisar(igual(d) && (seMueve.px > 1 || seMueve.opacidad > 0.05 || de.estado), `${nombre} 10: el mismo instante da el mismo cuadro, y entre instantes distintos sí cambia (${corta(d)}; entre 0 y 400 ms cambia ${corta(seMueve)})`);
      await ctx.close();
    }
    if (de.entrada) {
      // 3. Fuera de la vista espera; a media entrada, salir la detiene (o la devuelve al inicio si se repite) y volver la sigue.
      const { ctx, pagina, errores } = await abrir({ ...pedido, arriba: 160 });
      await pagina.waitForTimeout(700);
      const esperando = (await animaciones(pagina)).filter((x) => x.porTiempo);
      const cuadros = await cuadrosEn(pagina, 500);
      revisar(esperando.length > 0 && esperando.every((x) => x.estado === "paused" && x.ahora === 0) && cuadros === 0, `${nombre} 3: fuera de la vista la entrada espera, detenida en su inicio y sin pedir cuadros (${esperando.length} animaciones, ${cuadros} cuadros)`);
      await pagina.locator(ESCENARIO).evaluate((e) => e.scrollIntoView({ block: "center" }));
      await pagina.waitForTimeout(450);
      const corriendo = (await animaciones(pagina)).filter((x) => x.porTiempo && x.estado === "running").length;
      await pagina.evaluate(() => scrollTo(0, 0));
      await pagina.waitForTimeout(250);
      const t1 = (await animaciones(pagina)).filter((x) => x.porTiempo);
      await pagina.waitForTimeout(400);
      const t2 = (await animaciones(pagina)).filter((x) => x.porTiempo);
      const detenidas = t1.length > 0 && t1.every((x) => x.estado !== "running") && t1.map((x) => x.ahora).join() === t2.map((x) => x.ahora).join();
      const alInicio = t1.every((x) => x.ahora === 0);
      await pagina.locator(ESCENARIO).evaluate((e) => e.scrollIntoView({ block: "center" }));
      await pagina.waitForTimeout(3400);
      const alFinal = (await animaciones(pagina)).filter((x) => x.porTiempo).length;
      const d = diferencia(await foto((await abrirNatural({ ...pedido, arriba: 160 }, pagina)).pagina), await foto(pagina));
      revisar(corriendo > 0 && detenidas && (de.repite ? alInicio : !alInicio) && alFinal === 0 && igual(d) && errores.length === 0, `${nombre} 3: al salir a media entrada se detiene${de.repite ? " y vuelve a su inicio (se repite)" : " donde iba"}; al volver sigue y termina en su lugar (${corriendo} corriendo; detenidas: ${detenidas}; al final ${alFinal} vivas; ${corta(d)})`);
      await ctx.close();
    }
    if (de.tocable) {
      // 4. Lo que se puede apretar no se mueve bajo el cursor ni bajo el foco, y nunca queda escondido.
      const naturalAqui = await abrir({ ...pedido, sin: true });
      const cajaNatural = await naturalAqui.pagina.locator(`${ESCENARIO} ${de.tocable}`).first().boundingBox();
      await naturalAqui.ctx.close();
      const { ctx, pagina, errores } = await abrir(pedido);
      const enlace = pagina.locator(`${ESCENARIO} ${de.tocable}`).first();
      /** Cómo está el enlace: sus animaciones por tiempo, cuánto se ve y dónde está. */
      const como = () =>
        enlace.evaluate((e) => {
          let o = 1;
          for (let n = e; n && n !== document.body; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
          const r = e.getBoundingClientRect();
          return { estados: document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && a.timeline instanceof DocumentTimeline && (a.effect.target === e || a.effect.target.contains(e) || e.contains(a.effect.target))).map((a) => a.playState), opacidad: o, y: r.y + scrollY };
        });
      const enSuLugar = (c) => c.opacidad === 1 && Math.abs(c.y - cajaNatural.y) < 0.6;
      // (a) El cursor llega antes de que el enlace entre (donde el enlace espera, todavía sin verse): aparece ya, en su
      // lugar, y ahí se queda.
      const espera = await enlace.boundingBox();
      await pagina.mouse.move(espera.x + espera.width / 2, espera.y + espera.height / 2);
      await pagina.waitForTimeout(250);
      const antesDeEntrar = await como();
      await pagina.waitForTimeout(500);
      const sigue = await como();
      await pagina.mouse.move(2, 2);
      // (b) El cursor llega a media entrada: se detiene donde va (no salta) y sigue al salir.
      await pagina.locator("[data-prueba=dir-repetir]").evaluate((b) => b.click());
      await pagina.waitForFunction((q) => document.getAnimations().some((a) => !(a instanceof CSSAnimation) && a.timeline instanceof DocumentTimeline && a.playState === "running" && (a.effect.target === document.querySelector(q) || a.effect.target.contains(document.querySelector(q))) && Number(a.currentTime) > Number(a.effect.getTiming().delay) + 60), `${ESCENARIO} ${de.tocable}`, { timeout: 4000 }).catch(() => {});
      const c = await enlace.boundingBox();
      await pagina.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
      await pagina.waitForTimeout(150);
      const aMedias = await como();
      await pagina.waitForTimeout(350);
      const aMedias2 = await como();
      await pagina.mouse.move(2, 2);
      await pagina.waitForTimeout(1800);
      const alSalir = await como();
      // (c) El foco del teclado llega antes de que entre: se ve entero y en su lugar mientras dure el foco.
      await pagina.locator("[data-prueba=dir-repetir]").evaluate((b) => b.click());
      await enlace.focus();
      await pagina.waitForTimeout(250);
      const enfocado = await como();
      await pagina.waitForTimeout(900);
      const enfocado2 = await como();
      await enlace.evaluate((e) => e.blur());
      revisar(
        enSuLugar(antesDeEntrar) && enSuLugar(sigue) && aMedias.estados.length > 0 && aMedias.estados.every((x) => x === "paused") && Math.abs(aMedias.y - aMedias2.y) < 0.1 && aMedias.opacidad > 0.2 && enSuLugar(alSalir) && alSalir.estados.length === 0 && enSuLugar(enfocado) && enSuLugar(enfocado2) && errores.length === 0,
        `${nombre} 4: lo que se aprieta no se mueve bajo el cursor ni el foco, y nunca queda escondido (cursor antes de entrar: opacidad ${antesDeEntrar.opacidad.toFixed(2)}; a media entrada: ${aMedias.estados.join() || "sin animación"}, opacidad ${aMedias.opacidad.toFixed(2)}, se corre ${Math.abs(aMedias.y - aMedias2.y).toFixed(2)} px; con foco: opacidad ${enfocado.opacidad.toFixed(2)})`,
      );
      await ctx.close();
    }
    if (de.scroll) {
      // 7. Sin líneas de tiempo de scroll, el respaldo da los mismos valores.
      const nativa = await abrir(pedido);
      const respaldo = await abrir(pedido, { antes: [() => { delete window.ViewTimeline; delete window.ScrollTimeline; }] });
      const hay = await nativa.pagina.evaluate(() => "ViewTimeline" in window);
      const sinEllas = await respaldo.pagina.evaluate(() => !("ViewTimeline" in window) && !("ScrollTimeline" in window));
      await nativa.pagina.waitForTimeout(3400);
      await respaldo.pagina.waitForTimeout(400);
      const alto = await nativa.pagina.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      let peor = { px: 0, opacidad: 0 };
      let cambia = 0;
      let antes = null;
      for (const f of [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1]) {
        for (const p of [nativa.pagina, respaldo.pagina]) await p.evaluate((y) => scrollTo(0, y), Math.round(alto * f));
        // Lo que sigue a la velocidad tiene que volver a cero antes de medir.
        await nativa.pagina.waitForTimeout(de.velocidad ? 1700 : 250);
        const [a, b] = [await foto(nativa.pagina), await foto(respaldo.pagina)];
        const d = diferencia(a, b);
        peor = { px: Math.max(peor.px, d.px), opacidad: Math.max(peor.opacidad, d.opacidad) };
        if (antes) cambia = Math.max(cambia, diferencia(antes, a).px, diferencia(antes, a).opacidad * 100);
        antes = a;
      }
      revisar(hay && sinEllas && peor.px <= 1.5 && peor.opacidad <= 0.03 && cambia > 2 && nativa.errores.length + respaldo.errores.length === 0, `${nombre} 7: sin líneas de tiempo de scroll el respaldo da lo mismo en 7 puntos (${corta(peor)}; y al bajar sí cambia)`);
      await nativa.ctx.close();
      await respaldo.ctx.close();
    }
  }
}

/** La página tal cual (sin partitura), en el mismo punto del scroll que `otra`: para comparar al final de una prueba. */
async function abrirNatural(pedido, otra) {
  const n = await abrir({ ...pedido, sin: true });
  await n.pagina.evaluate((y) => scrollTo(0, y), await otra.evaluate(() => scrollY));
  await n.pagina.waitForTimeout(200);
  // Se cierra sola cuando termina el proceso; la foto se toma enseguida.
  setTimeout(() => n.ctx.close().catch(() => {}), 4000);
  return n;
}

// --- Las señales: lo que hace cada una ---
if (parte("senales")) {
  {
    // El cursor: la tarjeta lo sigue, sobre su botón se queda quieta, y sin movimiento el compás duerme.
    const { ctx, pagina, errores } = await abrir({ ejemplo: "iman" });
    const tarjeta = pagina.locator(`${ESCENARIO} [data-mk-parte=tarjeta]`);
    const corrida = () => tarjeta.evaluate((e) => getComputedStyle(e).translate);
    const escenario = await pagina.locator(ESCENARIO).boundingBox();
    await pagina.mouse.move(escenario.x + 60, escenario.y + 60);
    await pagina.mouse.move(escenario.x + escenario.width - 80, escenario.y + escenario.height - 80, { steps: 12 });
    await pagina.waitForTimeout(600);
    const alLado = await corrida();
    // El resorte elástico tarda un par de segundos en asentarse; después, ni un cuadro.
    await pagina.waitForTimeout(2200);
    const durmio = await cuadrosEn(pagina, 700);
    const boton = await pagina.locator(`${ESCENARIO} .dir-boton`).boundingBox();
    await pagina.mouse.move(boton.x + boton.width / 2, boton.y + boton.height / 2, { steps: 6 });
    await pagina.waitForTimeout(300);
    const sobreBoton = await corrida();
    await pagina.mouse.move(boton.x + boton.width / 2 + 6, boton.y + boton.height / 2 + 4, { steps: 3 });
    await pagina.waitForTimeout(400);
    const sigueQuieta = await corrida();
    // Fuera del escenario (más abajo): vuelve a su lugar.
    await pagina.mouse.move(escenario.x + 200, escenario.y + escenario.height + 120, { steps: 4 });
    await pagina.waitForTimeout(2600);
    const alSalir = await corrida();
    revisar(alLado !== "none" && alLado !== "0px" && durmio === 0 && sobreBoton === sigueQuieta && /^(none|0px( 0px)?)$/.test(alSalir) && errores.length === 0, `puntero: la tarjeta sigue al cursor (${alLado}), duerme si no se mueve (${durmio} cuadros), se queda quieta sobre su botón (${sobreBoton} = ${sigueQuieta}) y vuelve al salir (${alSalir})`);
    await ctx.close();
  }
  {
    // La velocidad: al bajar rápido los bloques se inclinan; al parar vuelven a cero y el compás duerme. La barra avanza con la página.
    const { ctx, pagina, errores } = await abrir({ ejemplo: "inercia" });
    await pagina.waitForTimeout(500);
    const giro = () => pagina.locator(`${ESCENARIO} [data-mk-parte=izquierda]`).evaluate((e) => parseFloat(getComputedStyle(e).rotate) || 0);
    const barra = () => pagina.locator(`${ESCENARIO} [data-mk-parte=avance]`).evaluate((e) => Math.round(e.getBoundingClientRect().right - e.parentElement.getBoundingClientRect().left));
    const barraAntes = await barra();
    await pagina.evaluate(async () => {
      for (let i = 0; i < 14; i++) {
        scrollBy(0, 22);
        await new Promise((r) => requestAnimationFrame(r));
      }
    });
    const bajando = await giro();
    await pagina.waitForTimeout(1900);
    const quieto = await giro();
    const durmio = await cuadrosEn(pagina, 600);
    await pagina.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await pagina.waitForTimeout(300);
    const barraAlFinal = await barra();
    const ancho = await pagina.locator(`${ESCENARIO} .dir-barra`).evaluate((e) => Math.round(e.getBoundingClientRect().width));
    revisar(Math.abs(bajando) > 0.4 && Math.abs(quieto) < 0.05 && durmio === 0 && barraAntes <= 1 && Math.abs(barraAlFinal - ancho) <= 1 && errores.length === 0, `velocidad y scroll: al bajar los bloques se inclinan (${bajando.toFixed(2)}°), al parar vuelven (${quieto.toFixed(2)}°) y el compás duerme (${durmio} cuadros); la barra va de ${barraAntes} a ${barraAlFinal} de ${ancho} px`);
    await ctx.close();
  }
  {
    // El estado: se levanta al apuntarlo, se hunde al apretarlo y vuelve; en reposo no queda ninguna animación.
    const { ctx, pagina, errores } = await abrir({ ejemplo: "boton" });
    // Apretar el enlace no tiene que sacar la página de aquí.
    await pagina.evaluate(() => document.addEventListener("click", (ev) => ev.preventDefault(), true));
    const boton = pagina.locator(`${ESCENARIO} [data-mk-parte=boton]`);
    const cara = pagina.locator(`${ESCENARIO} [data-mk-parte=cara]`);
    const de = (l) => l.evaluate((e) => `${getComputedStyle(e).translate} / ${getComputedStyle(e).scale}`);
    const caja = await boton.boundingBox();
    const enReposo = await de(boton);
    await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await pagina.waitForTimeout(500);
    const apuntado = await de(boton);
    const cajaAhora = await boton.boundingBox();
    await pagina.mouse.down();
    await pagina.waitForTimeout(300);
    const apretado = await de(cara);
    await pagina.mouse.up();
    await pagina.mouse.move(2, 2);
    await pagina.waitForTimeout(700);
    const [vuelve, vuelveCara] = [await de(boton), await de(cara)];
    const vivas = (await animaciones(pagina)).length;
    const sigueBajoElCursor = cajaAhora.x <= caja.x + caja.width / 2 && cajaAhora.x + cajaAhora.width >= caja.x + caja.width / 2 && cajaAhora.y <= caja.y + caja.height / 2 && cajaAhora.y + cajaAhora.height >= caja.y + caja.height / 2;
    revisar(apuntado === "0px -3px / 1.05" && apretado === "none / 0.95" && vuelve === enReposo && vuelveCara === "none / none" && vivas === 0 && sigueBajoElCursor && errores.length === 0, `estado: apuntado sube (${apuntado}), apretado se hunde (${apretado}), y al soltar vuelve (${vuelve}) sin dejar animaciones (${vivas}); nunca se escapa del cursor`);
    await ctx.close();
  }
  {
    // Pasar el cursor por encima del botón y salir, sin apretar: la cara (que solo responde al apretar) no se mueve nunca.
    const { ctx, pagina, errores } = await abrir({ ejemplo: "boton" });
    const caja = await pagina.locator(`${ESCENARIO} [data-mk-parte=boton]`).boundingBox();
    await pagina.evaluate((q) => {
      window.__escalas = new Set();
      const cara = document.querySelector(`${q} [data-mk-parte=cara]`);
      const mirar = () => {
        window.__escalas.add(getComputedStyle(cara).scale);
        requestAnimationFrame(mirar);
      };
      mirar();
    }, ESCENARIO);
    for (let i = 0; i < 3; i++) {
      await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 3 });
      await pagina.waitForTimeout(250);
      await pagina.mouse.move(caja.x - 60, caja.y - 60, { steps: 3 });
      await pagina.waitForTimeout(350);
    }
    const escalas = await pagina.evaluate(() => [...window.__escalas]);
    revisar(escalas.join() === "none" && errores.length === 0, `estado: pasar por encima sin apretar no hunde el botón ni lo hace parpadear (escalas vistas en la cara: ${escalas.join(", ")})`);
    await ctx.close();
  }
  {
    // Una raíz mucho más alta que la pantalla (una carta larga en el teléfono): la entrada parte igual.
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada", arriba: 120, alto: 900 }, { opciones: { viewport: { width: 390, height: 640 }, isMobile: true, hasTouch: true } });
    await pagina.waitForTimeout(400);
    const esperando = (await animaciones(pagina)).filter((x) => x.porTiempo && x.estado === "paused" && x.ahora === 0).length;
    // Se baja de a poco (como con el dedo) hasta que el comienzo de la raíz quede a un tercio de la pantalla: ya ocupa
    // más de media pantalla. De a poco importa: el primer aviso del navegador llega cuando asoman apenas unos px.
    await pagina.locator(ESCENARIO).evaluate(async (e) => {
      const hasta = e.getBoundingClientRect().top + scrollY - innerHeight * 0.3;
      for (let y = scrollY; y < hasta; y += 40) {
        scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      scrollTo(0, hasta);
    });
    await pagina.waitForTimeout(500);
    const corriendo = (await animaciones(pagina)).filter((x) => x.porTiempo && x.estado === "running").length;
    await pagina.waitForTimeout(3000);
    const opacidad = await pagina.locator(`${ESCENARIO} [data-mk-parte=bajada]`).evaluate((e) => Number(getComputedStyle(e).opacity));
    const vivas = (await animaciones(pagina)).filter((x) => x.porTiempo).length;
    revisar(esperando > 0 && corriendo > 0 && opacidad === 1 && vivas === 0 && errores.length === 0, `una raíz de nueve pantallas de alto igual parte al ocupar media pantalla, y nada queda escondido (${esperando} esperando, después ${corriendo} corriendo; al final opacidad ${opacidad}, ${vivas} vivas)`);
    await ctx.close();
  }
  {
    // Con «por» atado al scroll, las palabras van en cascada: a medio camino, la primera se ve más que la última.
    const { ctx, pagina } = await abrir({ ejemplo: "paralaje", reloj: "manual" });
    await pagina.waitForTimeout(300);
    const opacidades = async (s) => {
      await manual(pagina, "m[0].senal('vista', a[0]);", s);
      return pagina.evaluate((q) => [...document.querySelectorAll(`${q} [data-mk-parte=frase] [data-mk-d=corte] span`)].map((x) => Number(getComputedStyle(x).opacity)), ESCENARIO);
    };
    const [antes, medio, despues] = [await opacidades(0.1), await opacidades(0.42), await opacidades(0.9)];
    revisar(antes.length >= 8 && antes.every((o) => Math.abs(o - 0.15) < 0.01) && medio[0] > medio.at(-1) + 0.2 && despues.every((o) => o === 1), `vista con «por»: la frase se enciende en cascada (${antes.length} palabras; a medio camino ${medio[0].toFixed(2)} la primera y ${medio.at(-1).toFixed(2)} la última)`);
    await ctx.close();
  }
  {
    // Nivel liviano: las entradas solo funden y duran poco; nada sigue al cursor.
    const { ctx, pagina } = await abrir({ ejemplo: "portada", nivel: "liviano", arriba: 160 });
    await pagina.waitForTimeout(500);
    const a = (await animaciones(pagina)).filter((x) => x.porTiempo);
    const soloFunden = a.length > 0 && a.every((x) => x.propiedades.join() === "opacity" && x.dura <= 400);
    await ctx.close();
    const iman = await abrir({ ejemplo: "iman", nivel: "liviano" });
    await iman.pagina.mouse.move(300, 300);
    await iman.pagina.mouse.move(900, 500, { steps: 8 });
    await iman.pagina.waitForTimeout(400);
    const corrida = await iman.pagina.locator(`${ESCENARIO} [data-mk-parte=tarjeta]`).evaluate((e) => getComputedStyle(e).translate);
    const cuadros = await cuadrosEn(iman.pagina, 400);
    revisar(soloFunden && corrida === "none" && cuadros === 0, `nivel liviano: las entradas solo funden y duran 400 ms o menos (${a.length} animaciones), y nada sigue al cursor (${corrida}, ${cuadros} cuadros)`);
    await iman.ctx.close();
  }
  {
    // La pestaña se oculta a media entrada: se detiene; al volver, sigue.
    const { ctx, pagina } = await abrir({ ejemplo: "portada" });
    await pagina.waitForTimeout(350);
    const ocultar = (si) => pagina.evaluate((oculta) => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => oculta });
      document.dispatchEvent(new Event("visibilitychange"));
    }, si);
    await ocultar(true);
    // Detener una animación toma un cuadro en asentarse.
    await pagina.waitForTimeout(120);
    const t1 = (await animaciones(pagina)).filter((x) => x.porTiempo);
    await pagina.waitForTimeout(400);
    const t2 = (await animaciones(pagina)).filter((x) => x.porTiempo);
    await ocultar(false);
    await pagina.waitForTimeout(200);
    const t3 = (await animaciones(pagina)).filter((x) => x.porTiempo);
    revisar(t1.length > 0 && t1.every((x) => x.estado === "paused") && t1.map((x) => x.ahora).join() === t2.map((x) => x.ahora).join() && t3.some((x) => x.estado === "running"), `con la pestaña oculta la entrada se detiene y al volver sigue (${t1.length} detenidas; después ${t3.filter((x) => x.estado === "running").length} corriendo)`);
    await ctx.close();
  }
}

// --- React: cambiar un texto cortado, y dos partituras a la vez ---
if (parte("react")) {
  {
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada" });
    const titulo = () => pagina.evaluate((q) => {
      const t = document.querySelector(`${q} [data-mk-parte=titulo]`);
      const sin = (sel) => {
        const paseo = document.createTreeWalker(t, NodeFilter.SHOW_TEXT);
        let x = "";
        for (let n = paseo.nextNode(); n; n = paseo.nextNode()) if (!n.parentElement.closest(sel)) x += n.nodeValue;
        return x.replace(/\s+/g, " ").trim();
      };
      return { ve: sin("[data-mk-d=lector]"), oye: sin("[aria-hidden=true]"), piezas: t.querySelectorAll("[data-mk-d=corte] span").length };
    }, ESCENARIO);
    await pagina.waitForTimeout(300);
    const alPartir = await titulo();
    // A media entrada, React cambia el texto del título.
    await pagina.locator("[data-prueba=dir-cambiar-texto]").evaluate((b) => b.click());
    await pagina.waitForTimeout(200);
    const cambiado = await titulo();
    // La entrada no parte de nuevo ni salta al final: sigue (hay animaciones a medio camino).
    const enCurso = (await animaciones(pagina)).filter((x) => x.porTiempo && x.estado === "running");
    const siguio = enCurso.length > 0 && enCurso.some((x) => x.ahora > 300);
    await pagina.waitForTimeout(2600);
    const alFinal = await titulo();
    await pagina.locator("[data-prueba=dir-cambiar-texto]").evaluate((b) => b.click());
    await pagina.waitForTimeout(300);
    const deVuelta = await titulo();
    const NUEVO = "Té y café de especialidad en Ñuñoa";
    const VIEJO = "Café de especialidad en Ñuñoa";
    revisar(alPartir.ve === VIEJO && alPartir.oye === VIEJO && cambiado.ve === NUEVO && cambiado.oye === NUEVO && alFinal.ve === NUEVO && alFinal.oye === NUEVO && deVuelta.ve === VIEJO && deVuelta.oye === VIEJO && alPartir.piezas > 0 && cambiado.piezas > alPartir.piezas && siguio && errores.length === 0, `React cambia el texto de un título cortado a media entrada: se ve y se lee el nuevo, sin duplicar ni lanzar, y la entrada sigue donde iba («${cambiado.ve}», ${cambiado.piezas} piezas; de vuelta «${deVuelta.ve}»${errores.length ? `; ${errores[0]}` : ""})`);
    // Desmontar a media entrada (el actor se va con animaciones corriendo): no lanza.
    await pagina.locator("[data-prueba=dir-repetir]").evaluate((b) => b.click());
    await pagina.waitForTimeout(250);
    await pagina.locator("[data-prueba=dir-desmontar]").evaluate((b) => b.click());
    await pagina.waitForTimeout(300);
    const restos = (await animaciones(pagina)).length;
    revisar(restos === 0 && errores.length === 0, `desmontar a media entrada no lanza ni deja animaciones (${restos})`);
    await ctx.close();
  }
  {
    // Dos partituras en la misma página: cada una con su estado.
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada", veces: 2, reloj: "manual" });
    await pagina.waitForTimeout(300);
    const altura = (i) => pagina.evaluate(([q, k]) => document.querySelectorAll(q)[k].querySelector("[data-mk-parte=bajada]").getBoundingClientRect().y - document.querySelectorAll(q)[k].getBoundingClientRect().y, [ESCENARIO, i]);
    const [a0, b0] = [await altura(0), await altura(1)];
    await manual(pagina, "m[0].irA(5000);");
    const [a1, b1] = [await altura(0), await altura(1)];
    const dos = await pagina.evaluate(() => window.__mkDirectores.length);
    revisar(dos === 2 && Math.abs(a0 - b0) < 0.5 && Math.abs(a1 - a0) > 5 && Math.abs(b1 - b0) < 0.5 && errores.length === 0, `dos partituras en la misma página no comparten estado (mover la primera la corre ${Math.abs(a1 - a0).toFixed(1)} px; la segunda, ${Math.abs(b1 - b0).toFixed(1)})`);
    await ctx.close();
  }
}

// --- Sin lo que el navegador debería traer ---
if (parte("sin")) {
  const natural = await abrir({ ejemplo: "portada", sin: true });
  await natural.pagina.waitForTimeout(300);
  const fotoNatural = await foto(natural.pagina);
  const htmlNatural = await natural.pagina.locator(ESCENARIO).innerHTML();
  await natural.ctx.close();
  {
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada" }, { antes: [() => delete window.IntersectionObserver] });
    await pagina.waitForTimeout(300);
    const corriendo = (await animaciones(pagina)).filter((x) => x.porTiempo && x.estado === "running").length;
    await pagina.waitForTimeout(3200);
    const d = diferencia(fotoNatural, await foto(pagina));
    revisar(corriendo > 0 && igual(d) && errores.length === 0, `sin observador de vista, la entrada parte de inmediato y termina en su lugar (${corriendo} corriendo; ${corta(d)})`);
    await ctx.close();
  }
  {
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada" }, { antes: [() => delete Element.prototype.animate] });
    await pagina.waitForTimeout(500);
    const d = diferencia(fotoNatural, await foto(pagina));
    const html = (await pagina.locator(ESCENARIO).innerHTML()) === htmlNatural;
    revisar(igual(d) && html && errores.length === 0, `sin animaciones nativas, el Director no hace nada y la página se ve entera (${corta(d)}; HTML original: ${html})`);
    await ctx.close();
  }
  {
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada" }, { antes: [() => delete window.MutationObserver] });
    await pagina.waitForTimeout(3400);
    const d = diferencia(fotoNatural, await foto(pagina));
    revisar(igual(d) && errores.length === 0, `sin observador de cambios, la portada igual entra y termina en su lugar (${corta(d)})`);
    await ctx.close();
  }
}

// --- Partituras rotas u hostiles: no se montan, se avisa y la página queda tal cual ---
if (parte("hostil")) {
  const natural = await abrir({ ejemplo: "portada", sin: true });
  await natural.pagina.waitForTimeout(300);
  const htmlNatural = await natural.pagina.locator(ESCENARIO).innerHTML();
  await natural.ctx.close();
  const MALAS = {
    "un selector en vez de un nombre": { version: 0, escenas: [{ con: "verse", pasos: [{ actor: "body *", de: { y: 28 } }] }] },
    "una propiedad que no existe": { version: 0, escenas: [{ con: "verse", pasos: [{ actor: "titulo", de: { color: "red", y: 1 } }] }] },
    "números enormes": { version: 0, escenas: [{ con: "verse", pasos: [{ actor: "titulo", de: { y: 999999 }, dura: 9e9 }] }] },
    "miles de pasos": { version: 0, escenas: [{ con: "verse", pasos: Array.from({ length: 5000 }, () => ({ actor: "titulo", de: { y: 28 } })) }] },
    "código en un texto": { version: 0, escenas: [{ con: "verse", pasos: [{ actor: "titulo", de: { y: "calc(1px);background:url(javascript:alert(1))" } }] }] },
    "no es una partitura": "hola",
  };
  for (const [que, partitura] of Object.entries(MALAS)) {
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada", partitura });
    await pagina.waitForTimeout(500);
    const v = { fallas: Number(await pagina.locator("[data-prueba=dir-fallas]").textContent()), animaciones: (await animaciones(pagina)).length, html: (await pagina.locator(ESCENARIO).innerHTML()) === htmlNatural };
    revisar(v.fallas > 0 && v.animaciones === 0 && v.html && errores.length === 0, `partitura rota (${que}): no se monta, avisa y la página queda tal cual (${JSON.stringify(v)})`);
    await ctx.close();
  }
  {
    // Una partitura que vale pero nombra actores que no están: no hace nada y no lanza.
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada", partitura: { version: 0, escenas: [{ con: "verse", pasos: [{ actor: "no-existe", por: "letra", de: { y: 28 } }] }, { con: "puntero", pasos: [{ actor: "tampoco", x: 10 }] }] } });
    await pagina.waitForTimeout(500);
    await pagina.mouse.move(400, 300);
    await pagina.mouse.move(600, 400, { steps: 5 });
    const v = { fallas: Number(await pagina.locator("[data-prueba=dir-fallas]").textContent()), animaciones: (await animaciones(pagina)).length, html: (await pagina.locator(ESCENARIO).innerHTML()) === htmlNatural, cuadros: await cuadrosEn(pagina, 400) };
    revisar(v.fallas === 0 && v.animaciones === 0 && v.html && v.cuadros === 0 && errores.length === 0, `actores que no están en la página: la partitura vale, no hace nada y no lanza (${JSON.stringify(v)})`);
    await ctx.close();
  }
  {
    // Un texto con más letras que el tope de piezas no se corta: el actor se mueve entero.
    const largo = { version: 0, escenas: [{ con: "verse", pasos: [{ actor: "contenido", por: "letra", de: { opacidad: 0 }, cada: 5 }] }] };
    const { ctx, pagina, errores } = await abrir({ ejemplo: "tarjetas", partitura: { version: 0, escenas: [{ con: "verse", pasos: [{ actor: "grilla", por: "letra", de: { opacidad: 0 }, cada: 1 }] }] } });
    await pagina.waitForTimeout(300);
    const piezas = await pagina.locator(`${ESCENARIO} [data-mk-d=corte] span`).count();
    revisar(piezas > 0 && piezas <= 200 * 2 && errores.length === 0 && Boolean(largo), `cortar por letra respeta el tope de piezas (${piezas} cajas)`);
    await ctx.close();
  }
}

// --- Lo que encontró la revisión final ---
if (parte("revision")) {
  {
    // Terminada la entrada, el texto vuelve a estar entero (sin cajas): se subraya, se selecciona y se busca como siempre.
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada" });
    await pagina.waitForTimeout(500);
    const durante = await pagina.locator(`${ESCENARIO} [data-mk-d]`).count();
    await pagina.waitForTimeout(3200);
    const despues = await pagina.locator(`${ESCENARIO} [data-mk-d]`).count();
    const titulo = await pagina.locator(`${ESCENARIO} [data-mk-parte=titulo]`).evaluate((e) => e.innerText.replace(/\s+/g, " ").trim());
    revisar(durante > 0 && despues === 0 && titulo === "Café de especialidad en Ñuñoa" && errores.length === 0, `terminada la entrada, el texto cortado vuelve a estar entero (${durante} marcas durante, ${despues} después; «${titulo}»)`);
    await ctx.close();
  }
  {
    // React cambia un texto cuando la entrada ya terminó: nada vuelve a entrar, y lo que quedó puesto sigue puesto.
    const partitura = { version: 0, escenas: [{ con: "verse", pasos: [{ actor: "titulo", por: "palabra", de: { y: "135%" }, dura: 300 }, { actor: "bajada", de: { opacidad: 0 }, dura: 1500 }, { actor: "antetitulo", a: { escala: 1.1 }, dura: 300 }] }] };
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada", partitura });
    await pagina.waitForTimeout(2600);
    await pagina.evaluate((q) => {
      window.__minima = 1;
      const bajada = document.querySelector(`${q} [data-mk-parte=bajada]`);
      const mirar = () => {
        window.__minima = Math.min(window.__minima, Number(getComputedStyle(bajada).opacity));
        requestAnimationFrame(mirar);
      };
      mirar();
    }, ESCENARIO);
    await pagina.locator("[data-prueba=dir-cambiar-texto]").evaluate((b) => b.click());
    await pagina.waitForTimeout(900);
    const minima = await pagina.evaluate(() => window.__minima);
    const puesta = await pagina.locator(`${ESCENARIO} [data-mk-parte=antetitulo]`).evaluate((e) => getComputedStyle(e).transform);
    revisar(minima === 1 && /^matrix\(1\.1, 0, 0, 1\.1/.test(puesta) && errores.length === 0, `al rearmar con la entrada ya terminada, nada vuelve a entrar (opacidad mínima ${minima}) y lo que quedó puesto sigue puesto (${puesta})`);
    await ctx.close();
  }
  {
    // Un actor que ya trae su propia transformación en el CSS no salta de lugar: la entrada se suma a ella.
    const conEstilo = (p) => p.addStyleTag({ content: "[data-mk-parte=bajada]{transform:translateX(40px)}" });
    const natural = await abrir({ ejemplo: "portada", sin: true });
    await conEstilo(natural.pagina);
    await natural.pagina.waitForTimeout(200);
    const caja = await natural.pagina.locator(`${ESCENARIO} [data-mk-parte=bajada]`).boundingBox();
    await natural.ctx.close();
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada", reloj: "manual" }, { antes: [() => document.addEventListener("DOMContentLoaded", () => document.head.insertAdjacentHTML("beforeend", "<style>[data-mk-parte=bajada]{transform:translateX(40px)}</style>"))] });
    await pagina.waitForTimeout(300);
    await manual(pagina, "m[0].irA(0);");
    const alPartir = await pagina.locator(`${ESCENARIO} [data-mk-parte=bajada]`).boundingBox();
    await manual(pagina, "m[0].irA(9000);");
    const alFinal = await pagina.locator(`${ESCENARIO} [data-mk-parte=bajada]`).boundingBox();
    revisar(Math.abs(alPartir.x - caja.x) < 0.6 && Math.abs(alPartir.y - caja.y - 28) < 0.6 && Math.abs(alFinal.x - caja.x) < 0.6 && Math.abs(alFinal.y - caja.y) < 0.6 && errores.length === 0, `un actor con transformación propia en el CSS la conserva durante la entrada (corrido ${(alPartir.x - caja.x).toFixed(1)} px de lado y ${(alPartir.y - caja.y).toFixed(1)} hacia abajo al partir; ${(alFinal.x - caja.x).toFixed(1)} y ${(alFinal.y - caja.y).toFixed(1)} al final)`);
    await ctx.close();
  }
  {
    // `ConPartitura` recorta en los dos sentidos: una parte agrandada no tapa lo que está fuera de su caja.
    const partitura = { version: 0, escenas: [{ con: "vista", pasos: [{ actor: "contenido", de: { escala: 4 }, a: { escala: 4 } }] }] };
    const { ctx, pagina } = await abrir({ ejemplo: "portada", partitura, arriba: 30 });
    await pagina.waitForTimeout(400);
    const v = await pagina.locator(ESCENARIO).evaluate((e) => {
      const r = e.getBoundingClientRect();
      const arriba = document.elementFromPoint(r.x + r.width / 2, r.y - 20);
      return { ancho: getComputedStyle(e).overflowX, alto: getComputedStyle(e).overflowY, tapa: e.contains(arriba) };
    });
    revisar(v.ancho === "clip" && v.alto === "clip" && !v.tapa, `una parte agrandada 4 veces no se sale de su caja ni tapa lo de arriba (${JSON.stringify(v)})`);
    await ctx.close();
  }
  {
    // Sin líneas de tiempo nativas y en una página sin scroll: una escena atada al scroll no deja nada escondido.
    const partitura = { version: 0, escenas: [{ con: "scroll", pasos: [{ actor: "bajada", de: { opacidad: 0 }, a: { opacidad: 1 } }] }] };
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada", partitura, corta: true }, { antes: [() => { delete window.ViewTimeline; delete window.ScrollTimeline; }] });
    await pagina.waitForTimeout(500);
    const v = await pagina.evaluate((q) => ({ conScroll: document.documentElement.scrollHeight > innerHeight, opacidad: Number(getComputedStyle(document.querySelector(`${q} [data-mk-parte=bajada]`)).opacity) }), ESCENARIO);
    revisar(!v.conScroll && v.opacidad === 1 && errores.length === 0, `en una página sin scroll, el respaldo no deja escondido lo atado al scroll (${JSON.stringify(v)})`);
    await ctx.close();
  }
  {
    // Una partitura válida pero enorme no arma más animaciones que el tope.
    const partitura = { version: 0, escenas: Array.from({ length: 12 }, () => ({ con: "verse", repetir: true, pasos: Array.from({ length: 24 }, () => ({ actor: "grilla", por: "hijo", de: { y: 6 }, dura: 9000 })) })) };
    const { ctx, pagina, errores } = await abrir({ ejemplo: "tarjetas", partitura });
    await pagina.waitForTimeout(600);
    const v = { fallas: Number(await pagina.locator("[data-prueba=dir-fallas]").textContent()), animaciones: (await animaciones(pagina)).length };
    revisar(v.fallas === 0 && v.animaciones > 0 && v.animaciones <= 600 && errores.length === 0, `una partitura válida pero enorme no pasa del tope de animaciones (${v.animaciones} de 1728 pedidas; tope 600)`);
    await ctx.close();
  }
  {
    // Al imprimir a media entrada, todo se ve.
    const { ctx, pagina, errores } = await abrir({ ejemplo: "portada" });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await pagina.waitForTimeout(150);
    const v = await pagina.evaluate((q) => ({ minima: Math.min(...[...document.querySelectorAll(`${q} [data-mk-parte], ${q} [data-mk-parte] *`)].map((e) => Number(getComputedStyle(e).opacity))), corriendo: document.getAnimations().filter((a) => a.timeline instanceof DocumentTimeline && a.playState === "running").length }), ESCENARIO);
    revisar(v.minima === 1 && v.corriendo === 0 && errores.length === 0, `al imprimir a media entrada, todo queda a la vista (${JSON.stringify(v)})`);
    await ctx.close();
  }
}

// --- La vitrina: los seis ejemplos se ven, y el dato se edita ---
if (parte("vitrina")) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.goto(`${base}/#director`);
  await pagina.waitForSelector("[data-prueba=dir-boton]", { timeout: 8000 }).catch(() => {});
  const hay = await pagina.evaluate((nombres) => nombres.filter((n) => document.querySelector(`[data-prueba=dir-${n}] [data-mk-partitura="${n}"]`)), EJEMPLOS);
  revisar(hay.length === 6, `la vitrina muestra los seis ejemplos (${hay.join(", ")})`);
  // Editar el dato: un error se explica; un cambio válido se aplica.
  const tarjeta = "[data-prueba=dir-boton]";
  await pagina.locator(`${tarjeta} summary`).click();
  const caja = pagina.locator(`${tarjeta} textarea`);
  const original = await caja.inputValue();
  await caja.fill(original.replace('"y": -3', '"y": -30'));
  await pagina.waitForTimeout(200);
  const conError = await pagina.locator(`${tarjeta} [data-prueba=dir-errores]`).textContent().catch(() => "");
  await caja.fill(original.replace('"y": -3', '"y": -6'));
  await pagina.waitForTimeout(300);
  const sinError = await pagina.locator(`${tarjeta} [data-prueba=dir-errores]`).count();
  const boton = pagina.locator(`${tarjeta} [data-mk-parte=boton]`);
  const b = await boton.boundingBox();
  await pagina.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await pagina.waitForTimeout(500);
  const sube = await boton.evaluate((e) => getComputedStyle(e).translate);
  revisar(/escenas\[0\]\.pasos\[0\]\.a\.y/.test(conError) && sinError === 0 && sube === "0px -6px", `en la vitrina, un dato fuera de tope se explica y uno válido se aplica al tiro (error: «${conError.slice(0, 60)}»; el botón ahora sube ${sube})`);
  // A 360 px la vitrina entera no se sale de lado.
  await pagina.setViewportSize({ width: 360, height: 760 });
  await pagina.waitForTimeout(300);
  const sobra = await pagina.evaluate(() => document.documentElement.scrollWidth - 360);
  revisar(sobra <= 0 && errores.length === 0, `la vitrina a 360 px no se sale de lado y no tiene errores (${sobra} px${errores.length ? `; ${errores[0]}` : ""})`);
  await ctx.close();
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
