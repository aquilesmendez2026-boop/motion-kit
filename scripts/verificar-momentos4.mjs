// Verifica «Con el dedo» (cupón que se arranca, sticker que se despega, sellos con timbre y ruleta de premios) en
// #momentos. Uso: npm run dev (en otra terminal) y después
// `node scripts/verificar-momentos4.mjs [http://localhost:5173] [parte]`, donde la parte (opcional) es cupon, sticker,
// sello o ruleta.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const solo = process.argv[3];
const PARTES = ["cupon", "sticker", "sello", "ruleta"];
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
/** La sección de la vitrina de una pieza. */
const seccion = (id) => `[data-prueba="${id}"]`;

/** Abre #momentos. Cuenta los cuadros pedidos y deja medir cuánto se sale la página de lado. */
async function abrir({ opciones = {}, nivel, antes } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.addInitScript(() => {
    window.__cuadros = 0;
    const pedir = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (f) => {
      // Solo los de estas piezas (por el archivo desde donde se piden).
      if (/CuponQueSeArranca|StickerQueSeDespega|SellosConTimbre|RuletaDePremios/.test(new Error().stack ?? "")) window.__cuadros++;
      return pedir(f);
    };
    // La vitrina recorta lo que sobra de lado: se mide sin ese recorte, o daría cero siempre.
    window.__desborde = () => {
      const m = document.querySelector("main");
      const antes = m.style.overflowX;
      m.style.overflowX = "visible";
      const d = document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth;
      m.style.overflowX = antes;
      return d;
    };
  });
  if (antes) await antes(pagina);
  await pagina.goto(base + "/#momentos");
  await pagina.waitForSelector("[data-prueba=con-el-dedo]", { timeout: 8000 }).catch(() => {});
  if (nivel) await pagina.selectOption("[data-prueba=nivel]", nivel);
  return { ctx, pagina, errores };
}

/** Lleva una sección al centro de la pantalla (varias veces: las piezas de arriba llegan de a poco y corren la página). */
async function ver(pagina, id, espera = 500) {
  for (let i = 0; i < 3; i++) {
    await pagina.evaluate((q) => document.querySelector(q)?.scrollIntoView({ block: "center" }), seccion(id));
    await pagina.waitForTimeout(300);
  }
  await pagina.waitForTimeout(espera);
}
/** Todo el estilo calculado de lo que hay dentro de un elemento (sin las variables), para ver qué cambia entre dos instantes. */
const estilos = (pagina, selector) =>
  pagina.evaluate((q) => {
    const raiz = document.querySelector(q);
    return [raiz, ...raiz.querySelectorAll("*")].map((c) => {
      const s = getComputedStyle(c);
      return Object.fromEntries([...s].filter((p) => !p.startsWith("--")).map((p) => [p, s.getPropertyValue(p)]));
    });
  }, selector);
const ANIMABLES = ["translate", "scale", "rotate", "transform", "opacity", "transform-origin", "perspective-origin"];
const cambiados = (a, b) => [...new Set(a.flatMap((x, i) => Object.keys(x).filter((p) => x[p] !== b[i]?.[p])))];

// --- El cupón que se arranca ---
if (parte("cupon")) {
  const C = `${seccion("cupon")} .mk-m-cupon`;
  /** Cómo va el cupón: su estado, cuánto va cortada la tira, si el código está en la página y lo que se dijo. */
  const mirar = (pagina, raiz = C) =>
    pagina.evaluate((q) => {
      const c = document.querySelector(q);
      const tira = c?.querySelector(".mk-m-cupon-tira");
      return {
        estado: c?.dataset.estado ?? null,
        avance: tira ? Number(getComputedStyle(tira).getPropertyValue("--mk-cp-a")) : null,
        giro: tira ? Number(getComputedStyle(tira).getPropertyValue("--mk-cp-g")) : null,
        codigo: c?.querySelector("[data-codigo]")?.textContent ?? null,
        enTexto: c?.textContent.includes("LUNA2X1") ?? false,
        copiar: !!c?.querySelector("[data-copiar]"),
        dicho: c?.querySelector("[data-dicho]")?.textContent ?? "",
        ver: !!c?.querySelector("[data-ver]"),
      };
    }, raiz);
  {
    const { ctx, pagina, errores } = await abrir({ nivel: "completo" });
    await ver(pagina, "cupon");
    const antes = await mirar(pagina);
    // La franja se tiene que ver: su color no es el del hueco de abajo ni el del papel.
    const colores = await pagina.evaluate((q) => {
      const c = document.querySelector(q);
      const de = (s) => getComputedStyle(c.querySelector(s)).backgroundColor;
      return { franja: de(".mk-m-cupon-pegada .mk-m-cupon-cara"), hueco: de(".mk-m-cupon-hueco"), papel: de(".mk-m-cupon-papel") };
    }, C);
    const transparente = (v) => /rgba\(0, 0, 0, 0\)|transparent/.test(v);
    revisar(!transparente(colores.franja) && !transparente(colores.papel) && colores.franja !== colores.hueco && colores.franja !== colores.papel && colores.hueco !== colores.papel, `la franja, el hueco y el papel se distinguen (${colores.franja}; ${colores.hueco}; ${colores.papel})`);
    revisar(antes.estado === "cerrado" && !antes.enTexto && antes.codigo === null && antes.ver && errores.length === 0, `el cupón parte cerrado: el código no está en la página y hay un botón «Ver código» (${JSON.stringify({ estado: antes.estado, enTexto: antes.enTexto })}${errores.length ? `; ${errores[0]}` : ""})`);
    // Tirar de la lengüeta hasta la mitad: la tira se corta hasta donde va el dedo, y lo cortado cuelga.
    const tira = await pagina.locator(`${C} .mk-m-cupon-tira`).boundingBox();
    const lengueta = await pagina.locator(`${C} [data-lengueta]`).boundingBox();
    const y = lengueta.y + lengueta.height / 2;
    await pagina.mouse.move(lengueta.x + lengueta.width / 2, y);
    await pagina.mouse.down();
    await pagina.mouse.move(tira.x + tira.width * 0.25, y + 3, { steps: 5 });
    await pagina.waitForTimeout(120);
    const a25 = await estilos(pagina, `${C} .mk-m-cupon-tira`);
    const scroll0 = await pagina.evaluate(() => [scrollX, window.__desborde()]);
    await pagina.mouse.move(tira.x + tira.width * 0.5, y - 2, { steps: 6 });
    await pagina.waitForTimeout(120);
    const a50 = await estilos(pagina, `${C} .mk-m-cupon-tira`);
    const medio = await mirar(pagina);
    const cambia = cambiados(a25, a50);
    revisar(Math.abs(medio.avance - 0.5) < 0.03 && medio.giro > 5 && medio.estado === "cerrado" && !medio.enTexto, `tirar de la lengüeta corta la tira hasta donde va el dedo, y lo cortado cuelga (cortado ${medio.avance}; giro de cada tramo ${medio.giro}°)`);
    revisar(cambia.length > 0 && cambia.every((p) => ANIMABLES.includes(p)) && scroll0[0] === 0 && scroll0[1] <= 0, `mientras se tira, en la tira solo cambia: ${cambia.join(", ")}; y la página no se corre de lado (${scroll0.join(", ")})`);
    // Volver atrás con el dedo no la vuelve a pegar; soltar a medias la deja donde va.
    await pagina.mouse.move(tira.x + tira.width * 0.3, y, { steps: 4 });
    await pagina.mouse.up();
    await pagina.waitForTimeout(500);
    const suelto = await mirar(pagina);
    revisar(Math.abs(suelto.avance - 0.5) < 0.03 && suelto.estado === "cerrado" && !suelto.enTexto && (await pagina.evaluate(() => window.__cuadros)) === 0, `el papel no se vuelve a pegar, y soltarlo a medias lo deja donde va, sin gastar cuadros (cortado ${suelto.avance}; ${suelto.estado})`);
    // Seguir tirando: pasado el 85 % se suelta sola, cae y el código queda a la vista, como texto.
    const l2 = await pagina.locator(`${C} [data-lengueta]`).boundingBox();
    await pagina.mouse.move(l2.x + l2.width / 2, y);
    await pagina.mouse.down();
    await pagina.mouse.move(tira.x + tira.width * 0.9, y, { steps: 8 });
    await pagina.waitForTimeout(1500);
    await pagina.mouse.up();
    const abierto = await mirar(pagina);
    const arrancados = await pagina.locator(`${seccion("cupon")} [data-arrancados]`).textContent();
    revisar(abierto.estado === "abierto" && abierto.codigo === "LUNA2X1" && abierto.copiar && /LUNA2X1/.test(abierto.dicho) && !abierto.ver && arrancados === "1" && errores.length === 0, `pasado el 85 % la tira se suelta y cae: el código queda como texto, con «Copiar», se anuncia y se avisa una vez (${JSON.stringify({ estado: abierto.estado, codigo: abierto.codigo, dicho: abierto.dicho, avisos: arrancados })})`);
    const quieta = await pagina.evaluate(() => {
      const antes = window.__cuadros;
      return new Promise((listo) => setTimeout(() => listo(window.__cuadros - antes), 500));
    });
    revisar(quieta === 0, `abierto, el cupón no pide cuadros (${quieta})`);
    await ctx.close();
  }
  {
    // El botón «Ver código» (con teclado) llega al mismo final.
    const { ctx, pagina, errores } = await abrir({ nivel: "completo" });
    await ver(pagina, "cupon");
    await pagina.locator(`${C} [data-ver]`).focus();
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(1500);
    const abierto = await mirar(pagina);
    revisar(abierto.estado === "abierto" && abierto.codigo === "LUNA2X1" && /LUNA2X1/.test(abierto.dicho) && errores.length === 0, `con teclado, «Ver código» llega al mismo final (${abierto.estado}; «${abierto.dicho}»)`);
    await ctx.close();
  }
  for (const [nivel, opciones] of [["liviano", {}], ["quieto", {}], [null, { reducedMotion: "reduce" }]]) {
    const { ctx, pagina, errores } = await abrir({ nivel, opciones });
    await ver(pagina, "cupon");
    const antes = await mirar(pagina);
    if (nivel === "liviano") {
      // Sin arrastre: un toque en la lengüeta (o el botón) funde la tira.
      const cadena = await pagina.locator(`${C} .mk-m-cupon-cuelga`).count();
      await pagina.locator(`${C} [data-ver]`).click();
      await pagina.waitForTimeout(700);
      const abierto = await mirar(pagina);
      revisar(antes.estado === "cerrado" && cadena === 0 && abierto.estado === "abierto" && abierto.codigo === "LUNA2X1" && errores.length === 0, `en liviano no hay tira que cuelgue: un toque la funde y el código aparece (${antes.estado} → ${abierto.estado})`);
    } else revisar(antes.estado === "abierto" && antes.codigo === "LUNA2X1" && antes.dicho === "" && (await pagina.evaluate(() => window.__cuadros)) === 0 && errores.length === 0, `${nivel ? "en quieto" : "con movimiento reducido"} el código está a la vista desde el principio, sin anuncio y sin pedir cuadros (${antes.estado})`);
    await ctx.close();
  }
  {
    // Un cupón vencido no se arranca; uno sin código no se dibuja; textos enormes no rompen; y a 360 px nada se sale.
    const { ctx, pagina, errores } = await abrir({ nivel: "completo", opciones: { viewport: { width: 360, height: 760 } } });
    await ver(pagina, "cupon-vencido");
    const franja = await pagina.locator(`${seccion("cupon-vencido")} .mk-m-cupon-pegada`).textContent();
    revisar(/Vencido/.test(franja) && !/Tira/.test(franja), `la franja de un cupón vencido dice «Vencido», no invita a tirar («${franja}»)`);
    const vencido = await pagina.evaluate((q) => {
      const c = document.querySelector(`${q} .mk-m-cupon`);
      return { estado: c?.dataset.estado, lengueta: !!c?.querySelector("[data-lengueta]"), ver: !!c?.querySelector("[data-ver]"), texto: c?.querySelector("[data-vence]")?.textContent ?? "", codigo: c?.textContent.includes("VIEJO") };
    }, seccion("cupon-vencido"));
    const sinCodigo = await pagina.locator(`${seccion("cupon-sin-codigo")} .mk-m-cupon`).count();
    await ver(pagina, "cupon-largo");
    const sobra = await pagina.evaluate(() => window.__desborde());
    revisar(vencido.estado === "vencido" && !vencido.lengueta && !vencido.ver && /Venció el 01-01-2020/.test(vencido.texto) && !vencido.codigo && sinCodigo === 0 && sobra <= 0 && errores.length === 0, `un cupón vencido no se arranca ni muestra su código («${vencido.texto}»), uno sin código no se dibuja, y a 360 px nada se sale (${sobra} px${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
  // Lo que encontró la revisión final.
  for (const nivel of ["completo", "liviano"]) {
    const { ctx, pagina, errores } = await abrir({ nivel, opciones: { reducedMotion: "reduce" } });
    await ver(pagina, "cupon");
    await pagina.locator(`${seccion("cupon")} [data-ver]`).focus();
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(1000);
    const r = await pagina.evaluate((q) => {
      const c = document.querySelector(`${q} .mk-m-cupon`);
      return { estado: c?.dataset.estado, codigo: c?.querySelector("[data-codigo]")?.textContent ?? null, foco: document.activeElement?.hasAttribute("data-copiar") ?? false };
    }, seccion("cupon"));
    revisar(r.estado === "abierto" && r.codigo === "LUNA2X1" && r.foco && errores.length === 0, `con «reducir movimiento» y el nivel forzado en ${nivel}, «Ver código» igual muestra el código, y el foco pasa a «Copiar» (${JSON.stringify(r)})`);
    await ctx.close();
  }
  {
    const { ctx, pagina, errores } = await abrir({
      opciones: { reducedMotion: "reduce" },
      antes: (p) =>
        p.addInitScript(() => {
          window.__vioViejo = false;
          new MutationObserver(() => {
            if (document.body?.textContent?.includes("VIEJO50")) window.__vioViejo = true;
          }).observe(document, { subtree: true, childList: true, characterData: true });
        }),
    });
    await ver(pagina, "cupon-vencido");
    await ver(pagina, "cupon");
    const q = await pagina.evaluate((s) => ({ arrancados: document.querySelector(`${s} [data-arrancados]`)?.textContent, vioViejo: window.__vioViejo, vencido: document.querySelector('[data-prueba="cupon-vencido"] .mk-m-cupon')?.dataset.estado }), seccion("cupon"));
    revisar(q.arrancados === "1" && errores.length === 0, `en quieto el código está a la vista desde el principio, y se avisa una vez (alArrancar: ${q.arrancados})`);
    revisar(q.vencido === "vencido" && q.vioViejo === false, `el código de un cupón vencido no llega nunca a la página, ni un instante (${JSON.stringify({ vencido: q.vencido, vioViejo: q.vioViejo })})`);
    // El segundo «Copiar» se vuelve a anunciar.
    await pagina.evaluate((s) => {
      window.__dichos = 0;
      new MutationObserver(() => window.__dichos++).observe(document.querySelector(`${s} [data-dicho]`), { subtree: true, childList: true, characterData: true });
    }, seccion("cupon"));
    const copiar = pagina.locator(`${seccion("cupon")} [data-copiar]`);
    await copiar.click();
    await pagina.waitForTimeout(300);
    const uno = await pagina.evaluate(() => window.__dichos);
    await copiar.click();
    await pagina.waitForTimeout(300);
    const dos = await pagina.evaluate(() => window.__dichos);
    revisar(uno >= 1 && dos > uno, `copiar dos veces se anuncia dos veces (el aviso cambia ${uno} y después ${dos - uno} veces más)`);
    await ctx.close();
  }
}

// --- El sticker que se despega ---
if (parte("sticker")) {
  const S = `${seccion("sticker")} .mk-m-sticker`;
  /** Cómo va el sticker: su estado, cuánto va despegado y si lo de abajo se alcanza. */
  const mirar = (pagina, raiz = S) =>
    pagina.evaluate((q) => {
      const s = document.querySelector(q);
      const pieza = s?.querySelector(".mk-m-sticker-pieza");
      const debajo = s?.querySelector("[data-debajo]");
      const solapa = pieza?.querySelector(".mk-m-sticker-solapa");
      return {
        estado: s?.dataset.estado ?? null,
        pegado: pieza ? pieza.hasAttribute("data-pegado") : null,
        despegado: pieza ? Number(pieza.dataset.despegado) : null,
        solapa: solapa ? getComputedStyle(solapa).display !== "none" : false,
        toque: pieza ? getComputedStyle(pieza).touchAction : null,
        tapado: debajo ? debajo.hasAttribute("inert") && debajo.getAttribute("aria-hidden") === "true" : null,
        texto: debajo?.textContent ?? "",
        dicho: s?.querySelector("[data-dicho]")?.textContent ?? "",
        boton: !!s?.querySelector("[data-despegar]"),
      };
    }, raiz);
  {
    const { ctx, pagina, errores } = await abrir({ nivel: "completo" });
    await ver(pagina, "sticker");
    const antes = await mirar(pagina);
    // Lo de abajo no se alcanza con el teclado mientras está tapado.
    await pagina.locator(`${S} [data-despegar]`).focus();
    await pagina.keyboard.press("Shift+Tab");
    const focoAdentro = await pagina.evaluate((q) => !!document.activeElement?.closest(`${q} [data-debajo]`), S);
    revisar(antes.estado === "pegado" && antes.pegado && !antes.solapa && antes.tapado && /café gratis/.test(antes.texto) && !focoAdentro && antes.toque === "none" && antes.boton && errores.length === 0, `el sticker parte pegado; lo de abajo está en la página pero no lo alcanzan el foco ni los lectores (${JSON.stringify({ estado: antes.estado, tapado: antes.tapado, focoAdentro, toque: antes.toque })}${errores.length ? `; ${errores[0]}` : ""})`);
    // Tirar desde el borde izquierdo hacia la derecha: se levanta una solapa, y más mientras más se tira.
    // (Probar el foco pudo desplazar la página: se vuelve a centrar el sticker.)
    await ver(pagina, "sticker", 200);
    const c = await pagina.locator(`${S} .mk-m-sticker-pieza`).boundingBox();
    const y = c.y + c.height / 2;
    await pagina.mouse.move(c.x + 6, y);
    await pagina.mouse.down();
    await pagina.mouse.move(c.x + c.width * 0.4, y - 10, { steps: 5 });
    await pagina.waitForTimeout(100);
    const poco = await mirar(pagina);
    const e1 = await estilos(pagina, `${S} .mk-m-sticker-pieza`);
    const desplazada0 = await pagina.evaluate(() => scrollY);
    await pagina.mouse.move(c.x + c.width * 0.7, y + 30, { steps: 5 });
    await pagina.waitForTimeout(100);
    const mas = await mirar(pagina);
    const e2 = await estilos(pagina, `${S} .mk-m-sticker-pieza`);
    const cambia = cambiados(e1, e2);
    const desplazada1 = await pagina.evaluate(() => scrollY);
    revisar(!poco.pegado && poco.solapa && poco.despegado > 0.02 && mas.despegado > poco.despegado + 0.08 && mas.despegado < 0.5 && mas.tapado, `tirar levanta una solapa que crece con el tirón (${poco.despegado} → ${mas.despegado})`);
    revisar(cambia.length > 0 && cambia.every((p) => ANIMABLES.includes(p)) && desplazada0 === desplazada1, `mientras se tira, en el sticker solo cambia: ${cambia.join(", ")}; y la página no se desplaza`);
    // Soltar con menos de la mitad: se vuelve a pegar.
    await pagina.mouse.up();
    await pagina.waitForTimeout(1300);
    const vuelto = await mirar(pagina);
    const quieto = await pagina.evaluate(() => {
      const antes = window.__cuadros;
      return new Promise((listo) => setTimeout(() => listo(window.__cuadros - antes), 400));
    });
    revisar(vuelto.pegado && vuelto.estado === "pegado" && vuelto.tapado && quieto === 0, `soltarlo con menos de la mitad lo vuelve a pegar, y pegado no pide cuadros (${JSON.stringify({ pegado: vuelto.pegado, cuadros: quieto })})`);
    // Si el navegador cancela el gesto a medias, también vuelve.
    await pagina.mouse.move(c.x + 6, y);
    await pagina.mouse.down();
    await pagina.mouse.move(c.x + c.width * 0.5, y, { steps: 4 });
    await pagina.locator(`${S} .mk-m-sticker-pieza`).evaluate((e) => e.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 1 })));
    await pagina.waitForTimeout(1300);
    await pagina.mouse.up();
    const cancelado = await mirar(pagina);
    revisar(cancelado.pegado && cancelado.estado === "pegado", `si el navegador cancela el gesto, cuenta como soltar: vuelve a pegarse (${JSON.stringify({ pegado: cancelado.pegado, estado: cancelado.estado })})`);
    // Tirar más de la mitad y soltar: termina de despegarse solo, cae, y lo de abajo queda a la vista y se anuncia.
    await pagina.mouse.move(c.x + 6, y);
    await pagina.mouse.down();
    await pagina.mouse.move(c.x + c.width * 1.15, y + 10, { steps: 8 });
    await pagina.waitForTimeout(100);
    const pasado = await mirar(pagina);
    await pagina.mouse.up();
    await pagina.waitForTimeout(1500);
    const suelto = await mirar(pagina);
    const avisos = await pagina.locator(`${seccion("sticker")} [data-despegados]`).textContent();
    revisar(pasado.despegado > 0.5 && suelto.estado === "despegado" && suelto.tapado === false && /café gratis/.test(suelto.dicho) && !suelto.boton && avisos === "1" && errores.length === 0, `con más de la mitad despegada, al soltarlo termina de despegarse y cae: lo de abajo queda a la vista, se anuncia y se avisa una vez (${JSON.stringify({ despegadoAlSoltar: pasado.despegado, estado: suelto.estado, dicho: suelto.dicho, avisos })})`);
    // Ahora el enlace de abajo sí recibe el foco.
    await pagina.locator(`${S} [data-debajo] a`).focus();
    revisar(await pagina.evaluate((q) => !!document.activeElement?.closest(`${q} [data-debajo]`), S), "despegado, lo de abajo se alcanza con el teclado");
    await ctx.close();
  }
  {
    // El botón «Despegar» (con teclado) llega al mismo final; y el cuadrado también se despega.
    const { ctx, pagina, errores } = await abrir({ nivel: "completo" });
    await ver(pagina, "sticker");
    await pagina.locator(`${S} [data-despegar]`).focus();
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(300);
    const aMedias = await mirar(pagina);
    await pagina.waitForTimeout(1400);
    const final = await mirar(pagina);
    const C2 = `${seccion("sticker-cuadrado")} .mk-m-sticker`;
    await ver(pagina, "sticker-cuadrado");
    const c = await pagina.locator(`${C2} .mk-m-sticker-pieza`).boundingBox();
    await pagina.mouse.move(c.x + c.width - 5, c.y + 5);
    await pagina.mouse.down();
    await pagina.mouse.move(c.x + c.width * 0.45, c.y + c.height * 0.55, { steps: 6 });
    await pagina.waitForTimeout(100);
    const cuadrado = await mirar(pagina, C2);
    await pagina.mouse.up();
    revisar(aMedias.despegado > 0.05 && aMedias.despegado < 0.95 && final.estado === "despegado" && /café gratis/.test(final.dicho) && cuadrado.solapa && cuadrado.despegado > 0.1 && errores.length === 0, `con teclado, «Despegar» lo levanta de a poco (${aMedias.despegado} a los 300 ms) y llega al mismo final; el cuadrado también se despega desde una esquina (${cuadrado.despegado})`);
    await ctx.close();
  }
  for (const [nivel, opciones] of [["liviano", {}], ["quieto", {}], [null, { reducedMotion: "reduce" }]]) {
    const { ctx, pagina, errores } = await abrir({ nivel, opciones });
    await ver(pagina, "sticker");
    const antes = await mirar(pagina);
    if (nivel === "liviano") {
      await pagina.locator(`${S} .mk-m-sticker-pieza`).click();
      await pagina.waitForTimeout(700);
      const despues = await mirar(pagina);
      revisar(antes.estado === "pegado" && despues.estado === "despegado" && despues.tapado === false && errores.length === 0, `en liviano no hay doblez: un toque lo funde y lo de abajo queda a la vista (${antes.estado} → ${despues.estado})`);
    } else revisar(antes.estado === "despegado" && antes.tapado === false && antes.dicho === "" && (await pagina.evaluate(() => window.__cuadros)) === 0 && errores.length === 0, `${nivel ? "en quieto" : "con movimiento reducido"} lo de abajo está a la vista desde el principio, sin anuncio y sin pedir cuadros (${antes.estado})`);
    await ctx.close();
  }
  {
    const { ctx, pagina, errores } = await abrir({ nivel: "completo", opciones: { viewport: { width: 360, height: 760 } } });
    await ver(pagina, "sticker");
    const ancho = await pagina.locator(`${S} .mk-m-sticker-pieza`).evaluate((e) => e.getBoundingClientRect().width);
    const sobra = await pagina.evaluate(() => window.__desborde());
    revisar(ancho <= 260 && ancho >= 44 && sobra <= 0 && errores.length === 0, `a 360 px el sticker es chico (${Math.round(ancho)} px: queda página por donde desplazarse) y nada se sale de lado (${sobra} px)`);
    await ctx.close();
  }
  // Lo que encontró la revisión final.
  for (const nivel of ["completo", "liviano"]) {
    const { ctx, pagina, errores } = await abrir({ nivel, opciones: { reducedMotion: "reduce" } });
    await ver(pagina, "sticker");
    await pagina.locator(`${seccion("sticker")} [data-despegar]`).focus();
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(1500);
    const r = await pagina.evaluate((q) => ({ estado: document.querySelector(`${q} .mk-m-sticker`)?.dataset.estado, foco: Boolean(document.activeElement?.closest("[data-debajo]")) }), seccion("sticker"));
    revisar(r.estado === "despegado" && r.foco && errores.length === 0, `con «reducir movimiento» y el nivel forzado en ${nivel}, «Despegar» igual deja ver lo de abajo, y el foco pasa ahí (${JSON.stringify(r)})`);
    await ctx.close();
  }
  {
    const { ctx, pagina, errores } = await abrir({ nivel: "quieto" });
    await ver(pagina, "sticker");
    const avisos = await pagina.locator(`${seccion("sticker")} [data-despegados]`).textContent();
    revisar(avisos === "1" && errores.length === 0, `en quieto lo de abajo está a la vista desde el principio, y se avisa una vez (alDespegar: ${avisos})`);
    await ctx.close();
  }
}

// --- Los sellos con timbre ---
if (parte("sello")) {
  const T = `${seccion("timbre")} .mk-m-timbre`;
  /** Cómo va la tarjeta: cada marca (su opacidad y su giro), los timbres que quedan y el texto. */
  const mirar = (pagina, raiz = T) =>
    pagina.evaluate((q) => {
      const t = document.querySelector(q);
      const marcas = [...(t?.querySelectorAll(".mk-m-timbre-marca") ?? [])].map((m) => {
        const c = getComputedStyle(m);
        return { sello: Number(m.parentElement.dataset.sello), nuevo: m.parentElement.hasAttribute("data-nuevo"), opacidad: Number(c.opacity), giro: c.rotate, filtro: c.filter !== "none" };
      });
      const gomas = [...(t?.querySelectorAll(".mk-m-timbre-goma") ?? [])].map((g) => Number(getComputedStyle(g).opacity));
      return { nivel: t?.dataset.nivel, activo: t?.hasAttribute("data-activo") ?? false, marcas, gomas, texto: t?.querySelector("[data-texto]")?.textContent ?? "", cupos: t?.querySelectorAll(".mk-m-timbre-lista li").length ?? 0, lista: t?.querySelector(".mk-m-timbre-lista")?.getAttribute("aria-hidden") };
    }, raiz);
  {
    const { ctx, pagina, errores } = await abrir({ nivel: "completo" });
    // Antes de verse: los sellos de antes ya están; los nuevos esperan.
    await pagina.waitForSelector(T, { state: "attached", timeout: 8000 }).catch(() => {});
    const lejos = await mirar(pagina);
    const viejos = (m) => m.marcas.filter((x) => !x.nuevo);
    const nuevos = (m) => m.marcas.filter((x) => x.nuevo);
    revisar(!lejos.activo && lejos.cupos === 10 && viejos(lejos).length === 5 && viejos(lejos).every((x) => x.opacidad >= 0.7) && nuevos(lejos).length === 2 && nuevos(lejos).every((x) => x.opacidad === 0) && /7 de 10 sellos/.test(lejos.texto) && lejos.lista === "true" && errores.length === 0, `antes de verse, los sellos de antes ya están en la tarjeta y los dos nuevos esperan; el texto dice cuántos van («${lejos.texto}»${errores.length ? `; ${errores[0]}` : ""})`);
    // Al verse, el timbre baja de a uno: primero un sello, después el otro.
    await pagina.evaluate((q) => document.querySelector(q)?.scrollIntoView({ block: "center" }), seccion("timbre"));
    await pagina.waitForFunction((q) => document.querySelector(q)?.hasAttribute("data-activo"), T, { timeout: 5000 }).catch(() => {});
    await pagina.waitForTimeout(250);
    const e1 = await estilos(pagina, `${T} .mk-m-timbre-lista`);
    const bajando = await mirar(pagina);
    await pagina.waitForTimeout(450);
    const e2 = await estilos(pagina, `${T} .mk-m-timbre-lista`);
    const uno = await mirar(pagina);
    await pagina.waitForTimeout(2300);
    const final = await mirar(pagina);
    const cambia = cambiados(e1, e2);
    revisar(bajando.gomas.length === 2 && bajando.gomas[0] > 0.5 && nuevos(bajando).every((x) => x.opacidad === 0) && nuevos(uno)[0].opacidad > 0.5 && nuevos(uno)[1].opacidad === 0, `al verse, el timbre baja de a uno: primero deja un sello y el otro espera su turno (a los 250 ms el timbre está en ${bajando.gomas[0].toFixed(2)} y no hay marca; a los 700 ms: ${nuevos(uno).map((x) => x.opacidad.toFixed(2)).join(" y ")})`);
    revisar(cambia.length > 0 && cambia.every((p) => ANIMABLES.includes(p)), `mientras timbra, en la tarjeta solo cambia: ${cambia.join(", ")}`);
    const giros = new Set(final.marcas.map((x) => x.giro));
    revisar(final.marcas.length === 7 && final.marcas.every((x) => x.opacidad >= 0.7 && x.filtro) && final.gomas.every((g) => g === 0) && giros.size >= 6 && errores.length === 0, `al terminar quedan las siete marcas, cada una con su giro y su borde irregular, y el timbre se fue (${giros.size} giros distintos; opacidades ${final.marcas.map((x) => x.opacidad).join(", ")})`);
    await ctx.close();
  }
  for (const [nivel, opciones] of [["liviano", {}], ["quieto", {}], [null, { reducedMotion: "reduce" }]]) {
    const { ctx, pagina, errores } = await abrir({ nivel, opciones });
    await ver(pagina, "timbre", 1400);
    const m = await mirar(pagina);
    revisar(m.marcas.length === 7 && m.marcas.every((x) => x.opacidad >= 0.7) && m.gomas.length === 0 && (await pagina.evaluate(() => window.__cuadros)) === 0 && errores.length === 0, `${nivel === "liviano" ? "en liviano" : nivel ? "en quieto" : "con movimiento reducido"} no hay timbre: las marcas están puestas y no se pide ningún cuadro (${m.marcas.length} marcas, ${m.gomas.length} timbres)`);
    await ctx.close();
  }
  {
    // Datos raros (más llenos que el total, más nuevos que llenos, un premio enorme) y teléfono angosto.
    const { ctx, pagina, errores } = await abrir({ nivel: "completo", opciones: { viewport: { width: 360, height: 760 } } });
    await ver(pagina, "timbre-raro", 3200);
    const raro = await mirar(pagina, `${seccion("timbre-raro")} .mk-m-timbre`);
    const sobra = await pagina.evaluate(() => window.__desborde());
    revisar(raro.cupos === 5 && raro.marcas.length === 5 && /5 de 5 sellos/.test(raro.texto) && sobra <= 0 && errores.length === 0, `con datos raros la tarjeta se acota (${raro.cupos} cupos, ${raro.marcas.length} marcas) y a 360 px nada se sale (${sobra} px${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
  {
    // Lo que encontró la revisión final: el texto dice cuántos sellos son nuevos.
    const { ctx, pagina } = await abrir({ nivel: "quieto" });
    await ver(pagina, "timbre");
    await ver(pagina, "timbre-completa");
    const textos = await pagina.evaluate(() => ["timbre", "timbre-completa"].map((id) => document.querySelector(`[data-prueba="${id}"] [data-texto]`)?.textContent ?? ""));
    revisar(/7 de 10 sellos \(2 nuevos\)/.test(textos[0]) && /6 de 6 sellos \(1 nuevo\)/.test(textos[1]), `el texto dice cuántos sellos son nuevos («${textos[0]}»; «${textos[1]}»)`);
    await ctx.close();
  }
}

// --- La ruleta de premios ---
if (parte("ruleta")) {
  const R = (id) => `${seccion(id)} .mk-m-ruleta`;
  /** Cómo va la ruleta: su estado, cuánto está girada la rueda, la lengüeta, el premio y los avisos. */
  const mirar = (pagina, id = "ruleta") =>
    pagina.evaluate((q) => {
      const s = document.querySelector(q);
      const r = s?.querySelector(".mk-m-ruleta");
      const giro = (e) => (e ? parseFloat(getComputedStyle(e).rotate === "none" ? "0" : getComputedStyle(e).rotate) : null);
      const avisos = s?.querySelector("[data-avisos]");
      return {
        estado: r?.dataset.estado ?? null,
        premio: r?.dataset.premio === undefined ? null : Number(r.dataset.premio),
        angulo: giro(r?.querySelector(".mk-m-ruleta-rueda")),
        lengueta: giro(r?.querySelector(".mk-m-ruleta-lengueta")),
        texto: r?.querySelector("[data-resultado]")?.textContent ?? "",
        boton: r?.querySelector("[data-girar]")?.textContent ?? "",
        apagado: r?.querySelector("[data-girar]")?.getAttribute("aria-disabled") === "true",
        avisos: avisos ? JSON.parse(avisos.textContent || "[]") : [],
        pedido: avisos ? Number(avisos.dataset.pedido) : null,
        premios: r?.querySelectorAll("[data-premios] li").length ?? 0,
        rotulos: r?.querySelectorAll(".mk-m-ruleta-rotulo").length ?? 0,
        pedidos: avisos ? Number(avisos.dataset.pedidos) : null,
        tactil: r?.querySelector(".mk-m-ruleta-zona") ? getComputedStyle(r.querySelector(".mk-m-ruleta-zona")).touchAction : null,
        estela: Math.max(0, ...[...(r?.querySelectorAll(".mk-m-ruleta-estela") ?? [])].map((e) => Number(getComputedStyle(e).opacity))),
        velo: r?.querySelector(".mk-m-ruleta-velo") ? { opacidad: Number(getComputedStyle(r.querySelector(".mk-m-ruleta-velo")).opacity), giro: giro(r.querySelector(".mk-m-ruleta-velo")) } : null,
        luz: r?.querySelector(".mk-m-ruleta-luz") ? getComputedStyle(r.querySelector(".mk-m-ruleta-luz")).rotate : null,
        letras: [...(r?.querySelectorAll(".mk-m-ruleta-rotulo span") ?? [])].map((e) => ({ px: parseFloat(getComputedStyle(e).fontSize), cabe: e.scrollHeight <= e.clientHeight + 1 })),
      };
    }, seccion(id));
  /** El premio que queda bajo la flecha con la rueda en ese ángulo (la misma cuenta de la pieza). */
  const bajoLaFlecha = (angulo, n) => Math.floor((((-angulo % 360) + 360) % 360) / (360 / n) + 1e-9);
  /**
   * Un lanzamiento con el dedo: un arco por el borde de la rueda. `sentido`: 1 como el reloj, -1 al revés.
   * Rápido son unos 1500° por segundo; `lento`, a lo más 50 (bajo el impulso mínimo, pero no cero).
   * Las pausas entre un movimiento y otro son de verdad (no del reloj de la página): la pieza mide el gesto con la
   * hora de cada toque. Y se espera a que la página reciba cada uno antes de seguir.
   */
  async function lanzarConElDedo(pagina, id, sentido, { lento = false } = {}) {
    const c = await pagina.locator(`${R(id)} .mk-m-ruleta-zona`).boundingBox();
    const [cx, cy, radio] = [c.x + c.width / 2, c.y + c.height / 2, c.width * 0.4];
    const en = (grados) => [cx + radio * Math.cos((grados * Math.PI) / 180), cy + radio * Math.sin((grados * Math.PI) / 180)];
    const pausa = (ms) => new Promise((listo) => setTimeout(listo, ms));
    await pagina.evaluate(() => {
      if (window.__punteros !== undefined) return;
      window.__punteros = 0;
      for (const tipo of ["pointerdown", "pointermove", "pointerup"]) addEventListener(tipo, () => window.__punteros++, true);
    });
    let vistos = await pagina.evaluate(() => window.__punteros);
    const llego = async () => {
      for (let i = 0; i < 400; i++) {
        const ahora = await pagina.evaluate(() => window.__punteros);
        if (ahora > vistos) return void (vistos = ahora);
        await pausa(5);
      }
    };
    await pagina.mouse.move(...en(-60));
    await llego();
    await pagina.mouse.down();
    await llego();
    for (let k = 1; k <= 6; k++) {
      await pausa(lento ? 40 : 12);
      await pagina.mouse.move(...en(-60 + sentido * k * (lento ? 2 : 40)));
      await llego();
    }
    await pagina.mouse.up();
    await llego();
  }
  {
    // Con el botón: gira, frena siempre, la lengüeta salta, y se detiene en el premio pedido.
    const { ctx, pagina, errores } = await abrir({ nivel: "completo" });
    await ver(pagina, "ruleta");
    const antes = await mirar(pagina);
    revisar(antes.estado === "lista" && antes.premios === 6 && antes.rotulos === 6 && antes.boton === "Girar" && !antes.apagado && antes.texto === "" && errores.length === 0, `la ruleta parte lista, con sus seis premios también como lista para lectores (${JSON.stringify({ estado: antes.estado, premios: antes.premios })}${errores.length ? `; ${errores[0]}` : ""})`);
    await pagina.locator(`${R("ruleta")} [data-girar]`).focus();
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(150);
    const e1 = await estilos(pagina, `${R("ruleta")} .mk-m-ruleta-zona`);
    // Se mira la rueda cuadro a cuadro hasta que se detiene.
    const giro = await pagina.evaluate(async (q) => {
      const r = document.querySelector(q);
      const rueda = r.querySelector(".mk-m-ruleta-rueda");
      const lengueta = r.querySelector(".mk-m-ruleta-lengueta");
      const estelas = [...r.querySelectorAll(".mk-m-ruleta-estela")];
      const angulos = [];
      let lenguetaMax = 0;
      let estelaMax = 0;
      let corrida = 0;
      const t0 = performance.now();
      while (r.dataset.estado !== "detenida" && performance.now() - t0 < 9000) {
        await new Promise((listo) => requestAnimationFrame(listo));
        angulos.push(parseFloat(getComputedStyle(rueda).rotate) || 0);
        lenguetaMax = Math.max(lenguetaMax, Math.abs(parseFloat(getComputedStyle(lengueta).rotate) || 0));
        for (const e of estelas) {
          estelaMax = Math.max(estelaMax, Number(getComputedStyle(e).opacity));
          corrida = Math.max(corrida, Math.abs((parseFloat(getComputedStyle(e).rotate) || 0) - angulos.at(-1)));
        }
      }
      return { angulos, lenguetaMax, estelas: estelas.length, estelaMax, corrida, tardo: Math.round(performance.now() - t0) };
    }, R("ruleta"));
    const pasos = giro.angulos.slice(1).map((a, i) => a - giro.angulos[i]);
    const retrocede = pasos.some((p) => p < -0.01);
    // Frena: el paso promedio de cada tercio del giro es menor que el del anterior.
    const tercio = Math.floor(pasos.length / 3);
    const medio = (xs) => xs.reduce((s, v) => s + v, 0) / Math.max(1, xs.length);
    const [t1, t2, t3] = [medio(pasos.slice(0, tercio)), medio(pasos.slice(tercio, 2 * tercio)), medio(pasos.slice(2 * tercio))];
    await pagina.waitForTimeout(300);
    const e2 = await estilos(pagina, `${R("ruleta")} .mk-m-ruleta-zona`);
    const final = await mirar(pagina);
    const cambia = cambiados(e1, e2);
    revisar(!retrocede && t1 > t2 && t2 > t3 && pasos.at(-1) < 1.5 && giro.lenguetaMax > 10 && giro.tardo > 2000, `con «Girar» (teclado) la rueda gira ${((giro.angulos.at(-1) - giro.angulos[0]) / 360).toFixed(1)} vueltas en ${(giro.tardo / 1000).toFixed(1)} s, sin retroceder y frenando siempre (${t1.toFixed(1)}° → ${t2.toFixed(1)}° → ${t3.toFixed(1)}° por cuadro; el último paso, ${pasos.at(-1).toFixed(2)}°), y la lengüeta salta (hasta ${giro.lenguetaMax.toFixed(0)}°)`);
    revisar(final.estado === "detenida" && final.premio === 2 && bajoLaFlecha(final.angulo, 6) === 2 && /Premio: Medialuna/.test(final.texto) && JSON.stringify(final.avisos) === "[2]" && final.apagado && errores.length === 0, `se detiene en el premio pedido: lo muestra, lo anuncia y avisa una vez (${JSON.stringify({ premio: final.premio, bajoLaFlecha: bajoLaFlecha(final.angulo, 6), texto: final.texto, avisos: final.avisos })})`);
    revisar(cambia.length > 0 && cambia.every((p) => ANIMABLES.includes(p)), `mientras gira, en la ruleta solo cambia: ${cambia.join(", ")}`);
    revisar(giro.estelas === 2 && giro.estelaMax > 0.3 && giro.corrida > 5 && final.estela === 0 && final.luz === "none", `con la rueda rápida se ve la estela del giro (hasta ${giro.estelaMax.toFixed(2)} de opacidad, corrida ${giro.corrida.toFixed(0)}°), al detenerse no queda, y la luz no gira con la rueda (${final.luz})`);
    await pagina.waitForTimeout(600);
    const velo = (await mirar(pagina)).velo;
    revisar(antes.velo?.opacidad === 0 && velo?.opacidad > 0.99 && Math.abs(velo.giro - 120) < 0.01, `al detenerse, el premio queda destacado: los demás se apagan (el velo pasa de ${antes.velo?.opacidad} a ${velo?.opacidad}, girado ${velo?.giro}°)`);
    revisar(antes.letras.length === 6 && antes.letras.every((l) => l.cabe && l.px >= 9.5), `los rótulos caben enteros, «Sigue participando» incluido (letras de ${antes.letras.map((l) => `${l.px.toFixed(1)}${l.cabe ? "" : " cortado"}`).join(", ")} px)`);
    // Gira una vez: otro «Girar» no hace nada. Detenida, no pide cuadros.
    await pagina.locator(`${R("ruleta")} [data-girar]`).click({ force: true });
    await pagina.waitForTimeout(500);
    const igual = await mirar(pagina);
    const cuadros = await pagina.evaluate(() => {
      const antes = window.__cuadros;
      return new Promise((listo) => setTimeout(() => listo(window.__cuadros - antes), 500));
    });
    revisar(igual.estado === "detenida" && igual.angulo === final.angulo && cuadros === 0, `gira una sola vez, y detenida no pide cuadros (${igual.estado}; ${cuadros} cuadros)`);
    // El impulso se mide con la hora de cada toque, no con la hora en que la página lo atiende: en un teléfono ocupado
    // los toques se atienden todos juntos, y el lanzamiento tiene que contar igual. Aquí la hora de la página se
    // detiene mientras pasa el dedo.
    await pagina.locator(`${seccion("ruleta")} [data-otra]`).click();
    await pagina.waitForFunction((q) => document.querySelector(q)?.dataset.estado === "lista", R("ruleta"), { timeout: 4000 }).catch(() => {});
    await pagina.evaluate(() => {
      const fija = performance.now();
      window.__ahora = performance.now;
      performance.now = () => fija;
    });
    await lanzarConElDedo(pagina, "ruleta", 1);
    await pagina.evaluate(() => {
      performance.now = window.__ahora;
    });
    await pagina.waitForFunction((q) => document.querySelector(q)?.dataset.estado === "detenida", R("ruleta"), { timeout: 12000 }).catch(() => {});
    const junto = await mirar(pagina);
    revisar(junto.estado === "detenida" && junto.premio === 1 && JSON.stringify(junto.avisos) === "[2,1]" && errores.length === 0, `aunque la página atienda todos los toques juntos, el lanzamiento cuenta: el impulso se mide con la hora de cada toque (${junto.estado}, premio ${junto.premio}, avisos ${JSON.stringify(junto.avisos)})`);
    await ctx.close();
  }
  {
    // Veinte lanzamientos distintos (con el botón y con el dedo, hacia los dos lados): siempre cae en el premio pedido.
    // Se adelanta el reloj de la página para no esperar cada giro.
    const { ctx, pagina, errores } = await abrir({ nivel: "completo", antes: (p) => p.clock.install() });
    await pagina.clock.runFor(1500);
    await ver(pagina, "ruleta", 0);
    await pagina.clock.runFor(1500);
    const lanzados = [];
    for (let k = 0; k < 20; k++) {
      await pagina.locator(`${seccion("ruleta")} [data-otra]`).click();
      await pagina.clock.runFor(100);
      const pedido = (await mirar(pagina)).pedido;
      if (k % 3 === 0) await pagina.locator(`${R("ruleta")} [data-girar]`).click();
      else await lanzarConElDedo(pagina, "ruleta", k % 2 ? 1 : -1);
      await pagina.clock.runFor(9000);
      const m = await mirar(pagina);
      lanzados.push({ k, pedido, premio: m.premio, flecha: m.angulo === null ? null : bajoLaFlecha(m.angulo, 6), estado: m.estado });
    }
    const malos = lanzados.filter((l) => l.estado !== "detenida" || l.premio !== l.pedido || l.flecha !== l.pedido);
    revisar(malos.length === 0 && new Set(lanzados.map((l) => l.pedido)).size === 6 && errores.length === 0, `en 20 lanzamientos (con el botón y con el dedo, hacia los dos lados) siempre se detiene en el premio pedido (${lanzados.map((l) => l.premio).join(" ")}${malos.length ? `; fallan: ${JSON.stringify(malos.slice(0, 3))}` : ""})`);
    // Un impulso flojo no cuenta: la rueda vuelve a su lugar y se puede lanzar de nuevo.
    await pagina.locator(`${seccion("ruleta")} [data-otra]`).click();
    await pagina.clock.runFor(100);
    const antes = await mirar(pagina);
    await lanzarConElDedo(pagina, "ruleta", 1, { lento: true });
    await pagina.clock.runFor(1500);
    const flojo = await mirar(pagina);
    revisar(flojo.estado === "lista" && Math.abs(flojo.angulo - antes.angulo) < 0.5 && !flojo.apagado && flojo.avisos.length === antes.avisos.length, `un impulso flojo no cuenta: la rueda vuelve a su lugar y se puede lanzar de nuevo (${antes.angulo} → ${flojo.angulo}; ${flojo.estado})`);
    // El scroll de la página manda: la rueda deja pasar el dedo que baja; y si el navegador se queda con el gesto
    // (pointercancel), la rueda vuelve a su lugar y la vuelta no se gasta.
    const caja = await pagina.locator(`${R("ruleta")} .mk-m-ruleta-zona`).boundingBox();
    await pagina.mouse.move(caja.x + caja.width * 0.8, caja.y + caja.height * 0.3);
    await pagina.mouse.down();
    await pagina.mouse.move(caja.x + caja.width * 0.86, caja.y + caja.height * 0.5, { steps: 3 });
    await pagina.waitForTimeout(150);
    await pagina.clock.runFor(60);
    const tomada = await mirar(pagina);
    await pagina.evaluate((q) => document.querySelector(`${q} .mk-m-ruleta-zona`).dispatchEvent(new PointerEvent("pointercancel", { pointerId: 1, bubbles: true })), R("ruleta"));
    await pagina.mouse.up();
    await pagina.waitForTimeout(100);
    await pagina.clock.runFor(1500);
    const suelta = await mirar(pagina);
    revisar(suelta.tactil === "pan-y" && Math.abs(tomada.angulo - flojo.angulo) > 3 && suelta.estado === "lista" && Math.abs(suelta.angulo - flojo.angulo) < 0.5 && suelta.avisos.length === flojo.avisos.length, `el scroll manda: la rueda deja pasar el dedo que baja (touch-action ${suelta.tactil}), y si el navegador se queda con el gesto, vuelve a su lugar sin gastar la vuelta (${flojo.angulo} → ${tomada.angulo} → ${suelta.angulo}; ${suelta.estado})`);
    await ctx.close();
  }
  {
    // El premio llega del servidor: mientras llega, la rueda gira pareja; cuando llega, frena hacia ese premio.
    const { ctx, pagina, errores } = await abrir({ nivel: "completo" });
    await ver(pagina, "ruleta-servidor");
    await pagina.locator(`${R("ruleta-servidor")} [data-girar]`).click();
    const muestras = await pagina.evaluate(async (q) => {
      const rueda = document.querySelector(`${q} .mk-m-ruleta-rueda`);
      const leer = () => parseFloat(getComputedStyle(rueda).rotate) || 0;
      const espera = (ms) => new Promise((listo) => setTimeout(listo, ms));
      await espera(250);
      const a = [leer()];
      for (let i = 0; i < 3; i++) {
        await espera(300);
        a.push(leer());
      }
      return a;
    }, R("ruleta-servidor"));
    const tramos = muestras.slice(1).map((a, i) => a - muestras[i]);
    const esperando = (await mirar(pagina, "ruleta-servidor")).estado;
    await pagina.waitForFunction((q) => document.querySelector(q)?.dataset.estado === "detenida", R("ruleta-servidor"), { timeout: 12000 }).catch(() => {});
    const final = await mirar(pagina, "ruleta-servidor");
    revisar(esperando === "girando" && Math.max(...tramos) / Math.min(...tramos) < 1.2 && final.premio === 3 && bajoLaFlecha(final.angulo, 6) === 3 && JSON.stringify(final.avisos) === "[3]" && errores.length === 0, `mientras llega el premio del servidor la rueda gira pareja (${tramos.map((t) => t.toFixed(0)).join("°, ")}° cada 300 ms), y cuando llega frena en él (${final.premio}; «${final.texto}»)`);
    // Si la consulta falla: frena donde la lleve su impulso, no anuncia premio y avisa con null.
    await ver(pagina, "ruleta-falla");
    await pagina.locator(`${R("ruleta-falla")} [data-girar]`).click();
    await pagina.waitForFunction((q) => document.querySelector(q)?.dataset.estado === "detenida", R("ruleta-falla"), { timeout: 12000 }).catch(() => {});
    const falla = await mirar(pagina, "ruleta-falla");
    revisar(falla.estado === "detenida" && falla.premio === null && falla.velo?.opacidad === 0 && /no se pudo saber/.test(falla.texto) && JSON.stringify(falla.avisos) === "[null]" && errores.filter((e) => !/sin red/.test(e)).length === 0, `si la consulta falla, la rueda frena sola, no anuncia ni destaca ningún premio y avisa con null («${falla.texto}»; avisos ${JSON.stringify(falla.avisos)})`);
    await ctx.close();
  }
  for (const [nivel, opciones] of [["liviano", {}], ["quieto", {}], [null, { reducedMotion: "reduce" }]]) {
    const { ctx, pagina, errores } = await abrir({ nivel, opciones });
    await ver(pagina, "ruleta");
    const antes = await mirar(pagina);
    await pagina.locator(`${R("ruleta")} [data-girar]`).click();
    await pagina.waitForTimeout(nivel === "liviano" ? 1900 : 300);
    const final = await mirar(pagina);
    const cuadros = await pagina.evaluate(() => window.__cuadros);
    revisar(antes.boton === (nivel === "liviano" ? "Girar" : "Ver premio") && final.estado === "detenida" && final.premio === 2 && bajoLaFlecha(final.angulo, 6) === 2 && cuadros === 0 && JSON.stringify(final.avisos) === "[2]" && errores.length === 0, `${nivel === "liviano" ? "en liviano la rueda da una vuelta corta" : nivel ? "en quieto no gira" : "con movimiento reducido no gira"}: queda en el premio y lo dice, sin pedir cuadros («${antes.boton}» → ${final.estado}, premio ${final.premio}; ${cuadros} cuadros)`);
    await ctx.close();
  }
  {
    // Datos raros y teléfono angosto: 30 premios quedan en 12; con uno solo no hay ruleta; nada se sale de lado.
    const { ctx, pagina, errores } = await abrir({ nivel: "completo", opciones: { viewport: { width: 360, height: 760 } } });
    await ver(pagina, "ruleta-rara");
    const rara = await mirar(pagina, "ruleta-rara");
    const una = await pagina.locator(`${seccion("ruleta-uno")} .mk-m-ruleta`).count();
    const ancho = await pagina.locator(`${R("ruleta-rara")} .mk-m-ruleta-zona`).evaluate((e) => e.getBoundingClientRect().width);
    const sobra = await pagina.evaluate(() => window.__desborde());
    revisar(rara.premios === 12 && rara.rotulos === 12 && una === 0 && ancho <= 300 && sobra <= 0 && errores.length === 0, `con 30 premios quedan 12, con uno solo no hay ruleta, y a 360 px la rueda mide ${Math.round(ancho)} px y nada se sale de lado (${sobra} px${errores.length ? `; ${errores[0]}` : ""})`);
    await ver(pagina, "ruleta");
    const angosta = (await mirar(pagina)).letras;
    revisar(angosta.length === 6 && angosta.every((l) => l.cabe && l.px >= 9), `a 360 px los rótulos siguen cabiendo enteros y se leen (letras de ${angosta.map((l) => `${l.px.toFixed(1)}${l.cabe ? "" : " cortado"}`).join(", ")} px)`);
    await ctx.close();
  }
  // Lo que encontró la revisión final.
  {
    const { ctx, pagina, errores } = await abrir({ nivel: "quieto" });
    for (const id of ["ruleta-huecos", "ruleta-fuera", "ruleta"]) {
      await ver(pagina, id, 100);
      await pagina.locator(`${R(id)} [data-girar]`).click();
    }
    await pagina.waitForTimeout(300);
    const huecos = await mirar(pagina, "ruleta-huecos");
    const fuera = await mirar(pagina, "ruleta-fuera");
    revisar(huecos.premios === 3 && /Premio: Té helado/.test(huecos.texto) && huecos.premio === 2 && JSON.stringify(huecos.avisos) === "[2]" && errores.length === 0, `con un premio vacío en la lista, el índice sigue siendo el de la lista original: el 2 es «Té helado» («${huecos.texto}», avisa ${JSON.stringify(huecos.avisos)})`);
    revisar(fuera.estado === "detenida" && fuera.premio === null && /no se pudo saber/.test(fuera.texto) && JSON.stringify(fuera.avisos) === "[null]", `si el resultado no existe en la lista, la ruleta no inventa un premio: no anuncia ninguno y avisa con null («${fuera.texto}», ${JSON.stringify(fuera.avisos)})`);
    // La lista cambia con la rueda detenida: el anuncio sigue diciendo lo que salió, y ya no se destaca nada.
    const antes = await mirar(pagina);
    await pagina.locator(`${seccion("ruleta")} [data-cambiar]`).click();
    await pagina.waitForTimeout(300);
    const cambiada = await mirar(pagina);
    revisar(/Premio: Medialuna/.test(antes.texto) && antes.velo?.opacidad > 0.99 && cambiada.premios === 4 && /Premio: Medialuna/.test(cambiada.texto) && cambiada.velo?.opacidad === 0, `si la lista de premios cambia con la rueda detenida, el anuncio sigue diciendo lo que salió y ya no se destaca ningún premio («${cambiada.texto}», velo ${cambiada.velo?.opacidad})`);
    await ctx.close();
  }
  {
    const { ctx, pagina, errores } = await abrir({ nivel: "completo" });
    const S = "ruleta-servidor";
    const avisos = (cuantos, espera) => pagina.waitForFunction(([q, n]) => JSON.parse(document.querySelector(`${q} [data-avisos]`)?.textContent || "[]").length >= n, [seccion(S), cuantos], { timeout: espera }).catch(() => {});
    await ver(pagina, S);
    // La página pide otra vuelta a mitad de giro.
    await pagina.locator(`${R(S)} [data-girar]`).click();
    await pagina.waitForTimeout(300);
    await pagina.locator(`${seccion(S)} [data-otra]`).click();
    await pagina.waitForTimeout(200);
    const medio = await mirar(pagina, S);
    await pagina.locator(`${R(S)} [data-girar]`).click({ force: true });
    await avisos(1, 12000);
    await pagina.waitForTimeout(300);
    const fin = await mirar(pagina, S);
    revisar(medio.estado === "girando" && medio.apagado && fin.pedidos === 1 && JSON.stringify(fin.avisos) === "[3]" && fin.estado === "lista" && !fin.apagado && errores.length === 0, `si la página pide otra vuelta a mitad de giro, ese giro termina y avisa una vez, el resultado no se pide dos veces, y la vuelta nueva queda lista al detenerse (${JSON.stringify({ medio: medio.estado, pedidos: fin.pedidos, avisos: fin.avisos, fin: fin.estado })})`);
    // El nivel baja a liviano mientras se espera el resultado.
    await pagina.locator(`${R(S)} [data-girar]`).click({ timeout: 3000 }).catch(() => {});
    await pagina.waitForTimeout(300);
    await pagina.selectOption("[data-prueba=nivel]", "liviano");
    await avisos(2, 6000);
    await pagina.waitForTimeout(300);
    const baja = await mirar(pagina, S);
    const c1 = await pagina.evaluate(() => window.__cuadros);
    await pagina.waitForTimeout(400);
    const c2 = await pagina.evaluate(() => window.__cuadros);
    revisar(baja.estado === "detenida" && baja.premio === 3 && JSON.stringify(baja.avisos) === "[3,3]" && c1 === c2 && errores.length === 0, `si el nivel baja a liviano mientras llega el resultado, la rueda igual termina en el premio y deja de pedir cuadros (${JSON.stringify({ estado: baja.estado, premio: baja.premio, avisos: baja.avisos, cuadros: c2 - c1 })})`);
    // La lista de premios cambia a mitad de giro.
    await pagina.selectOption("[data-prueba=nivel]", "completo");
    await ver(pagina, "ruleta");
    await pagina.locator(`${R("ruleta")} [data-girar]`).click({ timeout: 3000 }).catch(() => {});
    await pagina.waitForTimeout(300);
    await pagina.locator(`${seccion("ruleta")} [data-cambiar]`).click();
    await pagina.waitForTimeout(900);
    const corta = await mirar(pagina);
    const c3 = await pagina.evaluate(() => window.__cuadros);
    await pagina.waitForTimeout(400);
    const c4 = await pagina.evaluate(() => window.__cuadros);
    revisar(corta.estado === "detenida" && corta.premio === null && /no se pudo saber/.test(corta.texto) && JSON.stringify(corta.avisos) === "[null]" && c3 === c4 && errores.length === 0, `si la lista de premios cambia a mitad de giro, la rueda se detiene sin anunciar premio y avisa con null (${JSON.stringify({ estado: corta.estado, texto: corta.texto, avisos: corta.avisos, cuadros: c4 - c3 })})`);
    await ctx.close();
  }
  {
    const { ctx, pagina, errores } = await abrir({ nivel: "liviano", opciones: { reducedMotion: "reduce" } });
    await ver(pagina, "ruleta");
    await pagina.locator(`${R("ruleta")} [data-girar]`).click();
    await pagina.waitForTimeout(500);
    const r = await mirar(pagina);
    revisar(r.estado === "detenida" && r.premio === 2 && JSON.stringify(r.avisos) === "[2]" && errores.length === 0, `con «reducir movimiento» y el nivel forzado en liviano, la ruleta igual termina y avisa (${JSON.stringify({ estado: r.estado, premio: r.premio, avisos: r.avisos })})`);
    await ctx.close();
  }
  {
    // En liviano, lanzar justo después de «otra vuelta»: el fundido del velo no es el final del giro.
    const { ctx, pagina } = await abrir({ nivel: "liviano" });
    await ver(pagina, "ruleta");
    await pagina.locator(`${R("ruleta")} [data-girar]`).click();
    await pagina.waitForFunction((q) => document.querySelector(q)?.dataset.estado === "detenida", R("ruleta"), { timeout: 4000 }).catch(() => {});
    await pagina.waitForTimeout(100);
    await pagina.locator(`${seccion("ruleta")} [data-otra]`).click();
    await pagina.locator(`${R("ruleta")} [data-girar]`).click({ timeout: 3000 }).catch(() => {});
    await pagina.waitForTimeout(700);
    const temprano = await mirar(pagina);
    await pagina.waitForTimeout(1300);
    const tarde = await mirar(pagina);
    revisar(temprano.estado === "girando" && temprano.avisos.length === 1 && tarde.estado === "detenida" && tarde.avisos.length === 2 && tarde.premio === tarde.pedido, `en liviano, lanzar justo después de «otra vuelta» no termina antes de tiempo (a los 0,7 s: ${temprano.estado}, ${temprano.avisos.length} aviso; al final: ${tarde.estado}, ${tarde.avisos.length} avisos)`);
    await ctx.close();
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
