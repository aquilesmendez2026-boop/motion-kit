// La prueba visual de «Luz y materia»: la luz de página, las superficies que le responden y lo que ya existía.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-luz.mjs [http://localhost:5173] [parte]`,
// donde la parte (opcional) es luz, materia, existe o piezas.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
const solo = process.argv[3];
const PARTES = ["luz", "materia", "existe", "piezas"];
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

/** Lleva la cuenta de los oyentes del documento y la ventana, de los observadores activos y de los cuadros pedidos. */
const contar = () => {
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
  window.__cuadros = 0;
  const pedir = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (f) => {
    window.__cuadros++;
    return pedir(f);
  };
};

/** Abre `#luz` (la vitrina) o `#luz?d=…` (un caso de prueba). `antes`: lo que se hace con la página antes de cargar. */
async function abrir(pedido, { opciones = {}, antes } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text().slice(0, 200)));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.addInitScript(contar);
  if (antes) await antes(pagina);
  await pagina.goto(`${base}/#luz${pedido ? `?d=${Buffer.from(JSON.stringify(pedido)).toString("base64url")}` : ""}`);
  await pagina.waitForSelector("[data-mk-luz]", { timeout: 8000 }).catch(() => {});
  await pagina.waitForTimeout(300);
  return { ctx, pagina, errores };
}

/** Las variables de la luz que ve un elemento (ya resueltas), como números. */
const luzEn = (pagina, selector) =>
  pagina.locator(selector).first().evaluate((e) => {
    const c = getComputedStyle(e);
    const n = (v) => Number(c.getPropertyValue(v).trim());
    return { l0x: n("--mk-l0x"), l0y: n("--mk-l0y"), lx: n("--mk-lx"), ly: n("--mk-ly"), tinte: c.getPropertyValue("--mk-luz-tinte").trim(), fuerza: c.getPropertyValue("--mk-luz-fuerza").trim() };
  });
const cuadrosEn = async (pagina, ms) => {
  const antes = await pagina.evaluate(() => window.__cuadros);
  await pagina.waitForTimeout(ms);
  return (await pagina.evaluate(() => window.__cuadros)) - antes;
};
const cerca = (a, b, margen = 0.02) => Math.abs(a - b) <= margen;

// --- La luz ---
if (parte("luz")) {
  {
    // En reposo viene de arriba a la izquierda; el cursor la corre dentro de su rango y el reposo no cambia.
    // (Solo con el cursor: el scroll también la corre según dónde está la raíz en la pantalla; va más abajo.)
    const { ctx, pagina, errores } = await abrir({ caso: "luz", sigue: ["puntero"] });
    const raiz = "[data-prueba=luz-raiz]";
    const marcada = await pagina.locator(raiz).evaluate((e) => e.hasAttribute("data-mk-luz"));
    const reposo = await luzEn(pagina, "[data-prueba=luz-dentro]");
    revisar(marcada && cerca(reposo.l0x, -0.45) && cerca(reposo.l0y, -0.8) && cerca(reposo.lx, -0.45) && cerca(reposo.ly, -0.8) && errores.length === 0, `la luz en reposo viene de arriba a la izquierda y la ve lo de adentro (${JSON.stringify(reposo)}${errores.length ? `; ${errores[0]}` : ""})`);
    // El cursor al 90 % de la pantalla, abajo a la derecha: la señal es 0,8 en cada eje.
    await pagina.mouse.move(1280 * 0.5, 800 * 0.5);
    await pagina.mouse.move(1280 * 0.9, 800 * 0.9, { steps: 8 });
    await pagina.waitForTimeout(1200);
    const corrida = await luzEn(pagina, "[data-prueba=luz-dentro]");
    revisar(cerca(corrida.lx, -0.45 + 0.8 * 0.35) && cerca(corrida.ly, -0.8 + 0.8 * 0.35) && corrida.l0x === reposo.l0x && corrida.l0y === reposo.l0y, `el cursor corre la luz dentro de su rango y el reposo no cambia (${corrida.lx}, ${corrida.ly}; reposo ${corrida.l0x}, ${corrida.l0y})`);
    // Quieta, no pide cuadros.
    const quieta = await cuadrosEn(pagina, 700);
    revisar(quieta === 0, `con el cursor quieto no se pide ningún cuadro (${quieta} en 700 ms)`);
    // A medio camino va suave: no salta de una vez.
    await pagina.mouse.move(1280 * 0.1, 800 * 0.1);
    await pagina.waitForTimeout(60);
    const aMedias = await luzEn(pagina, "[data-prueba=luz-dentro]");
    await pagina.waitForTimeout(1300);
    const alFinal = await luzEn(pagina, "[data-prueba=luz-dentro]");
    revisar(aMedias.lx > alFinal.lx + 0.05 && cerca(alFinal.lx, -0.45 - 0.8 * 0.35), `la luz llega suave a su lugar (a los 60 ms ${aMedias.lx}; al final ${alFinal.lx})`);
    // Una luz adentro de otra manda en su zona, y si no sigue nada, se queda quieta aunque la de afuera se mueva.
    const adentro = await luzEn(pagina, "[data-prueba=luz-dentro-2]");
    revisar(cerca(adentro.l0x, 0.6) && cerca(adentro.lx, 0.6) && cerca(adentro.ly, -0.5), `una luz adentro de otra manda en su zona (${JSON.stringify({ l0x: adentro.l0x, lx: adentro.lx, ly: adentro.ly })})`);
    // Al desmontar no queda nada escuchando: lo mismo que en una página cuya luz no sigue nada.
    const sinSeguir = await abrir({ caso: "luz", sigue: [] });
    const base = await sinSeguir.pagina.evaluate(() => window.__vivos());
    await sinSeguir.ctx.close();
    const durante = await pagina.evaluate(() => window.__vivos());
    await pagina.locator("[data-prueba=luz-desmontar]").click();
    await pagina.waitForTimeout(300);
    const despues = await pagina.evaluate(() => window.__vivos());
    const deMas = (lista) => {
      const quedan = [...base];
      return lista.filter((v) => (quedan.includes(v) ? (quedan.splice(quedan.indexOf(v), 1), false) : true));
    };
    revisar(deMas(durante).length >= 5 && deMas(despues).length === 0 && (await pagina.locator(raiz).count()) === 0, `al desmontar no queda nada escuchando (mientras sigue: ${deMas(durante).join(", ")}; después: ${deMas(despues).join(", ") || "nada"})`);
    await ctx.close();
  }
  {
    // El scroll también cuenta. Donde el navegador ata animaciones al scroll, cada superficie sabe sola por dónde va
    // en la pantalla (se prueba en «materia») y la raíz no se toca; donde no, se corre la luz entera.
    const { ctx, pagina, errores } = await abrir({ caso: "luz", sigue: ["scroll"], alto: 300 });
    const nativo = await pagina.evaluate(() => CSS.supports("animation-timeline: view()"));
    const arriba = await luzEn(pagina, "[data-prueba=luz-dentro]");
    await pagina.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await pagina.waitForTimeout(1300);
    const abajo = await luzEn(pagina, "[data-prueba=luz-dentro]");
    await pagina.mouse.move(1000, 600, { steps: 4 });
    await pagina.waitForTimeout(600);
    const conCursor = await luzEn(pagina, "[data-prueba=luz-dentro]");
    const oyeScroll = await pagina.evaluate(() => window.__vivos().filter((v) => /:scroll$/.test(v)).length);
    revisar((nativo ? abajo.ly === arriba.ly && oyeScroll === 0 : abajo.ly > arriba.ly + 0.2) && abajo.lx === arriba.lx && conCursor.lx === abajo.lx && errores.length === 0, nativo ? `con «scroll», aquí cada superficie sigue sola su paso por la pantalla: la raíz no escucha el scroll ni se mueve (y: ${arriba.ly} → ${abajo.ly}), y el cursor no la mueve` : `con «scroll», bajar la página corre la luz hacia abajo y el cursor no la mueve (y: ${arriba.ly} → ${abajo.ly}; x: ${arriba.lx} → ${conCursor.lx})`);
    await ctx.close();
  }
  {
    // Ahorro de datos: la luz queda fija, como con movimiento reducido.
    const { ctx, pagina, errores } = await abrir({ caso: "luz" }, { antes: (p) => p.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true, addEventListener() {}, removeEventListener() {} }, configurable: true })) });
    await pagina.mouse.move(1280 * 0.9, 800 * 0.9, { steps: 6 });
    await pagina.waitForTimeout(800);
    const l = await luzEn(pagina, "[data-prueba=luz-dentro]");
    const cuadros = await cuadrosEn(pagina, 400);
    revisar(l.lx === l.l0x && l.ly === l.l0y && cuadros === 0 && errores.length === 0, `con ahorro de datos la luz queda fija (${l.lx}, ${l.ly}; ${cuadros} cuadros)`);
    await ctx.close();
  }
  {
    // Fuera de la vista no trabaja; al volver, se pone al día.
    const { ctx, pagina, errores } = await abrir({ caso: "luz", sigue: ["puntero"], arriba: 200 });
    await pagina.waitForTimeout(300);
    const antes = await luzEn(pagina, "[data-prueba=luz-dentro]");
    await pagina.mouse.move(1280 * 0.9, 800 * 0.9, { steps: 6 });
    const cuadros = await cuadrosEn(pagina, 600);
    const lejos = await luzEn(pagina, "[data-prueba=luz-dentro]");
    await pagina.evaluate(() => document.querySelector("[data-prueba=luz-raiz]").scrollIntoView());
    await pagina.waitForTimeout(1300);
    const cerca2 = await luzEn(pagina, "[data-prueba=luz-dentro]");
    revisar(cuadros === 0 && lejos.lx === antes.lx && cerca(cerca2.lx, -0.45 + 0.8 * 0.35) && errores.length === 0, `fuera de la vista la luz no trabaja (${cuadros} cuadros; ${lejos.lx}) y al volver se pone al día (${cerca2.lx})`);
    await ctx.close();
  }
  for (const [que, opciones, pedido] of [["con movimiento reducido", { reducedMotion: "reduce" }, {}], ["sin seguir nada", {}, { sigue: [] }]]) {
    const { ctx, pagina, errores } = await abrir({ caso: "luz", ...pedido }, { opciones });
    await pagina.mouse.move(1280 * 0.9, 800 * 0.9, { steps: 6 });
    await pagina.waitForTimeout(900);
    const l = await luzEn(pagina, "[data-prueba=luz-dentro]");
    const cuadros = await cuadrosEn(pagina, 500);
    const oyentes = await pagina.evaluate(() => window.__vivos().filter((v) => /pointermove|scroll|deviceorientation/.test(v)));
    revisar(l.lx === l.l0x && l.ly === l.l0y && cuadros === 0 && oyentes.length === 0 && errores.length === 0, `${que} la luz queda fija y no escucha nada (${l.lx}, ${l.ly}; ${cuadros} cuadros; ${oyentes.join(", ") || "sin oyentes"})`);
    await ctx.close();
  }
  for (const [hora, lado] of [[8, "izquierda"], [18, "derecha"], [2, "noche"]]) {
    // La luz de la hora: se fija el reloj de la página.
    const { ctx, pagina, errores } = await abrir({ caso: "luz", sigue: ["hora"] }, { antes: (p) => p.clock.setFixedTime(new Date(2026, 10, 24, hora, 0)) });
    await pagina.waitForTimeout(400);
    const l = await luzEn(pagina, "[data-prueba=luz-dentro]");
    const bien = lado === "izquierda" ? l.l0x < -0.3 && /^#/.test(l.tinte) && l.tinte !== "#ffffff" : lado === "derecha" ? l.l0x > 0.3 : l.fuerza === "0.6";
    const adentro = await luzEn(pagina, "[data-prueba=luz-dentro-2]");
    revisar(bien && cerca(l.lx, l.l0x) && adentro.tinte === "#fff" && adentro.fuerza === "1" && errores.length === 0, `con «hora», a las ${hora}:00 la luz ${lado === "noche" ? "es tenue y fría" : `viene de la ${lado}`} (${JSON.stringify(l)})`);
    await ctx.close();
  }
  {
    // Datos raros: no lanza y cae a lo de siempre.
    const { ctx, pagina, errores } = await abrir({ caso: "luz", rango: "mucho", desde: { x: "a", y: 99 }, sigue: ["puntero", "luna", 7] });
    const l = await luzEn(pagina, "[data-prueba=luz-dentro]");
    await pagina.mouse.move(1280 * 0.9, 400, { steps: 4 });
    await pagina.waitForTimeout(1000);
    const corrida = await luzEn(pagina, "[data-prueba=luz-dentro]");
    revisar(cerca(l.l0x, -0.45) && l.l0y === 1 && cerca(corrida.lx, -0.45 + 0.8 * 0.35) && errores.length === 0, `con datos raros no lanza y usa lo de siempre (reposo ${l.l0x}, ${l.l0y}; corrida ${corrida.lx}${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
  {
    // La vitrina carga, sin errores y sin salirse de lado en un teléfono.
    const { ctx, pagina, errores } = await abrir(null, { opciones: { viewport: { width: 360, height: 760 } } });
    const sobra = await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    revisar((await pagina.locator("[data-mk-luz]").count()) > 0 && sobra <= 0 && errores.length === 0, `la vitrina «#luz» carga a 360 px sin errores y sin salirse de lado (${sobra} px${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
}

// --- Las superficies ---
/** Dónde están y cómo se ven las capas de una superficie. */
const capas = (pagina, selector) =>
  pagina.locator(selector).first().evaluate((e) => {
    const de = (clase) => {
      const c = e.querySelector(`:scope > .mk-lz-sombra > .${clase}, :scope > .mk-lz-cara > .${clase}`);
      if (!c) return null;
      const s = getComputedStyle(c);
      // El corrimiento, en px (el del brillo viene en porcentaje de su propio tamaño).
      const [x = 0, y = 0] = s.translate === "none" ? [] : s.translate.split(" ").map((v, i) => (v.endsWith("%") ? (parseFloat(v) / 100) * (i ? c.offsetHeight : c.offsetWidth) : parseFloat(v)));
      return { x, y, crece: (c.offsetWidth - e.offsetWidth) / 2, opacidad: Number(s.opacity) };
    };
    const propio = getComputedStyle(e);
    return { proyectada: de("mk-lz-proyectada"), contacto: de("mk-lz-contacto"), brillo: de("mk-lz-brillo"), translate: propio.translate, transform: propio.transform, padre: getComputedStyle(e.parentElement).perspective };
  });
/** Todo el estilo calculado de las capas decorativas de la página (sin las variables), para ver qué cambia entre dos instantes. */
const estilos = (pagina) =>
  pagina.evaluate(() =>
    [...document.querySelectorAll(".mk-lz-sombra, .mk-lz-sombra > *, .mk-lz-cara, .mk-lz-brillo")].map((c) => {
      const s = getComputedStyle(c);
      return Object.fromEntries([...s].filter((p) => !p.startsWith("--")).map((p) => [p, s.getPropertyValue(p)]));
    }),
  );
/** El peor contraste entre el color del texto y lo que tiene detrás (se esconde el texto y se miran los píxeles). */
async function contraste(pagina, selector) {
  const texto = pagina.locator(selector).first();
  const color = await texto.evaluate((e) => {
    const c = getComputedStyle(e).color;
    e.style.color = "transparent";
    return c;
  });
  const caja = await texto.boundingBox();
  const foto = (await pagina.screenshot({ clip: caja })).toString("base64");
  await texto.evaluate((e) => (e.style.color = ""));
  return pagina.evaluate(
    async ([png, rgb]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const lienzo = document.createElement("canvas");
      lienzo.width = img.width;
      lienzo.height = img.height;
      const g = lienzo.getContext("2d");
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, img.width, img.height).data;
      const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const luz = (r, v, a) => 0.2126 * lin(r) + 0.7152 * lin(v) + 0.0722 * lin(a);
      const [r, v, a] = rgb.match(/[\d.]+/g).map(Number);
      const delTexto = luz(r, v, a);
      let peor = 21;
      for (let i = 0; i < d.length; i += 4) {
        const fondo = luz(d[i], d[i + 1], d[i + 2]);
        peor = Math.min(peor, (Math.max(fondo, delTexto) + 0.05) / (Math.min(fondo, delTexto) + 0.05));
      }
      return Math.round(peor * 100) / 100;
    },
    [foto, color],
  );
}
const TIPOS = ["papel", "mate", "vidrio", "metal", "holografico"];
const ANIMABLES = ["translate", "scale", "rotate", "transform", "opacity"];

if (parte("materia")) {
  {
    const { ctx, pagina, errores } = await abrir({ caso: "materia", sigue: ["puntero"] });
    // Cada tipo dibuja sus capas, que son decoración.
    const armadas = await pagina.evaluate((tipos) =>
      tipos.map((t) => {
        const e = document.querySelector(`[data-prueba=mat-${t}]`);
        const decoracion = e ? [...e.querySelectorAll(":scope > .mk-lz-sombra, :scope > .mk-lz-cara > .mk-lz-brillo")] : [];
        return { tipo: t, marcada: e?.getAttribute("data-mk-materia") === t, capas: decoracion.length, ocultas: decoracion.every((c) => c.closest("[aria-hidden=true]")), sinToque: decoracion.every((c) => getComputedStyle(c).pointerEvents === "none"), proyectada: !!e?.querySelector(".mk-lz-proyectada"), contacto: !!e?.querySelector(".mk-lz-contacto") };
      }), TIPOS);
    revisar(armadas.every((a) => a.marcada && a.capas === 2 && a.ocultas && a.sinToque && a.proyectada && a.contacto) && errores.length === 0, `las cinco materias dibujan su sombra y su brillo, que son decoración (${armadas.map((a) => `${a.tipo}: ${a.capas}`).join(", ")}${errores.length ? `; ${errores[0]}` : ""})`);
    // La sombra proyectada: al lado contrario de la luz, y según la altura (la misma cuenta que `sombraDe`).
    const baja = await capas(pagina, "[data-prueba=mat-mate]");
    const alta = await capas(pagina, "[data-prueba=mat-alta]");
    const pegada = await capas(pagina, "[data-prueba=mat-pegada]");
    revisar(cerca(baja.proyectada.x, 0.45 * 7, 0.1) && cerca(baja.proyectada.y, 0.8 * 7, 0.1) && cerca(alta.proyectada.x, 0.45 * 21, 0.1) && cerca(alta.proyectada.y, 0.8 * 21, 0.1) && cerca(baja.proyectada.opacidad, 0.365, 0.01) && cerca(alta.proyectada.opacidad, 0.255, 0.01) && baja.proyectada.crece === 2 && alta.proyectada.crece === 6 && pegada.proyectada.opacidad === 0, `la sombra cae al lado contrario de la luz y dice la altura (altura 1: ${baja.proyectada.x.toFixed(1)}, ${baja.proyectada.y.toFixed(1)} px, opacidad ${baja.proyectada.opacidad}; altura 3: ${alta.proyectada.x.toFixed(1)}, ${alta.proyectada.y.toFixed(1)} px, opacidad ${alta.proyectada.opacidad}; altura 0: opacidad ${pegada.proyectada.opacidad})`);
    // Al mover el cursor, el brillo y la sombra se corren; en las capas solo cambian transformaciones y opacidad.
    await pagina.mouse.move(640, 400);
    await pagina.mouse.move(1150, 720, { steps: 6 });
    await pagina.waitForTimeout(1200);
    const antes = await estilos(pagina);
    const brilloAntes = (await capas(pagina, "[data-prueba=mat-metal]")).brillo;
    await pagina.mouse.move(120, 60, { steps: 6 });
    await pagina.waitForTimeout(1200);
    const despues = await estilos(pagina);
    const brilloDespues = (await capas(pagina, "[data-prueba=mat-metal]")).brillo;
    const sombraDespues = (await capas(pagina, "[data-prueba=mat-alta]")).proyectada;
    const cambiaron = [...new Set(antes.flatMap((a, i) => Object.keys(a).filter((p) => a[p] !== despues[i]?.[p])))];
    revisar(Math.abs(brilloAntes.x - brilloDespues.x) > 20 && sombraDespues.x > alta.proyectada.x + 3 && cambiaron.length > 0 && cambiaron.every((p) => ANIMABLES.includes(p)), `al mover el cursor el brillo se corre (${brilloAntes.x.toFixed(0)} → ${brilloDespues.x.toFixed(0)} px) y la sombra con él; en las capas solo cambia: ${cambiaron.join(", ")}`);
    const quieta = await cuadrosEn(pagina, 600);
    revisar(quieta === 0, `con el cursor quieto no se pide ningún cuadro (${quieta})`);
    await ctx.close();
  }
  {
    // Apuntar levanta; apretar hunde.
    const { ctx, pagina, errores } = await abrir({ caso: "materia", sigue: [] });
    const boton = "[data-prueba=mat-boton]";
    const reposo = await capas(pagina, boton);
    const caja = await pagina.locator(boton).boundingBox();
    await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 3 });
    await pagina.waitForTimeout(500);
    const apuntado = await capas(pagina, boton);
    await pagina.mouse.down();
    await pagina.waitForTimeout(400);
    const apretado = await capas(pagina, boton);
    await pagina.mouse.up();
    await pagina.mouse.move(5, 5);
    await pagina.waitForTimeout(500);
    const suelto = await capas(pagina, boton);
    const corrido = apretado.translate === "none" ? [0, 0] : apretado.translate.split(" ").map(parseFloat);
    revisar(apuntado.proyectada.y > reposo.proyectada.y + 3 && apretado.proyectada.opacidad === 0 && corrido[0] > 0 && corrido[1] > 0 && cerca(suelto.proyectada.y, reposo.proyectada.y, 0.1) && errores.length === 0, `apuntar levanta (la sombra pasa de ${reposo.proyectada.y.toFixed(1)} a ${apuntado.proyectada.y.toFixed(1)} px) y apretar hunde hacia la sombra (se corre ${apretado.translate}; sombra ${apretado.proyectada.opacidad}); al soltar vuelve`);
    // Inclinar: hacia el cursor, con la profundidad en su propia transformación (el padre no la recibe).
    const sup = "[data-prueba=mat-inclina]";
    const c = await pagina.locator(sup).boundingBox();
    await pagina.mouse.move(c.x + c.width * 0.85, c.y + c.height * 0.2, { steps: 4 });
    await pagina.waitForTimeout(500);
    const inclinada = await capas(pagina, sup);
    await pagina.mouse.move(5, 5);
    await pagina.waitForTimeout(900);
    const vuelta = await capas(pagina, sup);
    // Plana: sin giro (puede quedar solo la profundidad, que sin giro no se ve).
    const plana = (t) => {
      if (t === "none" || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t)) return true;
      const n = /^matrix3d\((.+)\)$/.exec(t)?.[1].split(",").map(Number);
      return !!n && n[0] === 1 && n[5] === 1 && n[1] === 0 && n[2] === 0 && n[4] === 0 && n[6] === 0 && n[8] === 0 && n[9] === 0;
    };
    revisar(/^matrix3d/.test(inclinada.transform) && !plana(inclinada.transform) && inclinada.padre === "none" && plana(vuelta.transform), `«inclina» la vuelve hacia el cursor sin poner profundidad en el padre, y al salir vuelve (${inclinada.transform.slice(0, 40)}…; padre: ${inclinada.padre}; después: ${vuelta.transform.slice(0, 24)})`);
    // Fuera de una luz: la de siempre, quieta.
    const fuera = await capas(pagina, "[data-prueba=mat-fuera]");
    revisar(cerca(fuera.proyectada.x, 0.45 * 7, 0.1) && cerca(fuera.proyectada.y, 0.8 * 7, 0.1), `fuera de una «Luz», una materia usa la luz de siempre (${fuera.proyectada.x.toFixed(1)}, ${fuera.proyectada.y.toFixed(1)} px)`);
    await ctx.close();
  }
  {
    // Con «scroll»: cada superficie se ilumina según por dónde va en la pantalla (donde el navegador lo permite).
    const { ctx, pagina, errores } = await abrir({ caso: "materia", sigue: ["scroll"], alto: 300 });
    const nativo = await pagina.evaluate(() => CSS.supports("animation-timeline: view()"));
    const sup = "[data-prueba=mat-metal]";
    await pagina.locator(sup).evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * 0.85));
    await pagina.waitForTimeout(900);
    const abajo = await capas(pagina, sup);
    await pagina.locator(sup).evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * 0.05));
    await pagina.waitForTimeout(900);
    const arriba = await capas(pagina, sup);
    const oyentes = await pagina.evaluate(() => window.__vivos().filter((v) => /:scroll$/.test(v)).length);
    // Donde el navegador no ata animaciones al scroll se corre la luz entera, y en una raíz alta eso es menos.
    revisar(Math.abs(arriba.brillo.y - abajo.brillo.y) > (nativo ? 8 : 2) && arriba.proyectada.y > 0 && abajo.proyectada.y > 0 && (!nativo || oyentes === 0) && errores.length === 0, `con «scroll», el brillo de una superficie se corre según por dónde va en la pantalla (${abajo.brillo.y.toFixed(0)} px abajo, ${arriba.brillo.y.toFixed(0)} px arriba; la sombra sigue cayendo hacia abajo: ${abajo.proyectada.y.toFixed(1)} y ${arriba.proyectada.y.toFixed(1)} px${nativo ? "; sin escuchar el scroll" : ""})`);
    await ctx.close();
  }
  {
    const { ctx, pagina, errores } = await abrir({ caso: "materia", sigue: [] });
    // Una superficie apagada no se aprieta; y si el navegador cancela el gesto, la página se entera.
    const apagada = await pagina.locator("[data-prueba=mat-apagada]").evaluate((e) => ({ aprieta: e.hasAttribute("data-mk-aprieta"), cursor: getComputedStyle(e).cursor }));
    const avisa = pagina.locator("[data-prueba=mat-avisa]");
    const caja = await avisa.boundingBox();
    await pagina.mouse.move(caja.x + caja.width * 0.8, caja.y + caja.height * 0.3, { steps: 3 });
    await pagina.waitForTimeout(300);
    const inclinada = (await capas(pagina, "[data-prueba=mat-avisa]")).transform;
    await avisa.evaluate((e) => e.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true })));
    await pagina.waitForTimeout(900);
    const despues = await avisa.evaluate((e) => ({ avisado: e.hasAttribute("data-cancelado"), ix: e.style.getPropertyValue("--mk-lz-ix") }));
    revisar(!apagada.aprieta && apagada.cursor !== "pointer" && /^matrix3d/.test(inclinada) && despues.avisado && despues.ix === "" && errores.length === 0, `una superficie apagada no se aprieta, y si el navegador cancela el gesto la superficie vuelve y la página se entera (${JSON.stringify({ ...apagada, ...despues })})`);
    await ctx.close();
  }
  for (const fondo of ["claro", "oscuro", "noche"]) {
    // El texto manda: con el brillo encima, el contraste no baja de 4,5.
    const { ctx, pagina, errores } = await abrir({ caso: "materia", sigue: ["puntero"], rango: 1, fondo });
    const medidos = [];
    for (const tipo of TIPOS) {
      const caja = await pagina.locator(`[data-prueba=mat-${tipo}] [data-prueba=mat-texto]`).boundingBox();
      let peor = 21;
      // Se pasea la luz: el peor caso es el que cuenta.
      for (const [x, y] of [[0.1, 0.1], [0.9, 0.1], [0.5, 0.5], [0.1, 0.9], [0.9, 0.9]]) {
        await pagina.mouse.move(1280 * x, 800 * y, { steps: 2 });
        await pagina.waitForTimeout(700);
        peor = Math.min(peor, await contraste(pagina, `[data-prueba=mat-${tipo}] [data-prueba=mat-texto]`));
      }
      medidos.push({ tipo, peor, visible: !!caja });
    }
    revisar(medidos.every((m) => m.visible && m.peor >= 4.5) && errores.length === 0, `sobre fondo ${fondo === "noche" ? "oscuro sin decirle nada a las materias" : fondo}, el texto conserva su contraste bajo el brillo (${medidos.map((m) => `${m.tipo} ${m.peor}`).join(", ")})`);
    await ctx.close();
  }
  for (const [que, opciones] of [["con movimiento reducido", { reducedMotion: "reduce" }]]) {
    const { ctx, pagina, errores } = await abrir({ caso: "materia" }, { opciones });
    const antes = await capas(pagina, "[data-prueba=mat-metal]");
    await pagina.mouse.move(1150, 720, { steps: 4 });
    const c = await pagina.locator("[data-prueba=mat-inclina]").boundingBox();
    await pagina.mouse.move(c.x + c.width * 0.85, c.y + c.height * 0.2, { steps: 4 });
    await pagina.waitForTimeout(700);
    const despues = await capas(pagina, "[data-prueba=mat-metal]");
    const inclinada = await capas(pagina, "[data-prueba=mat-inclina]");
    revisar(antes.brillo.x === despues.brillo.x && antes.proyectada.x === despues.proyectada.x && cerca(antes.proyectada.x, 0.45 * 7, 0.1) && inclinada.transform === "none" && errores.length === 0, `${que} las sombras siguen en su lugar y nada se mueve ni se inclina (brillo ${antes.brillo.x} → ${despues.brillo.x}; ${inclinada.transform})`);
    await ctx.close();
  }
  {
    // Datos raros y teléfono angosto.
    const { ctx, pagina, errores } = await abrir({ caso: "materia", tipo: "plutonio", altura: 99, inclina: "mucho" }, { opciones: { viewport: { width: 360, height: 760 } } });
    const rara = await pagina.locator("[data-prueba=mat-rara]").evaluate((e) => ({ tipo: e.getAttribute("data-mk-materia"), altura: e.getAttribute("data-mk-altura") }));
    const sobra = await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    revisar(rara.tipo === "mate" && rara.altura === "4" && sobra <= 0 && errores.length === 0, `con un tipo y una altura que no existen usa «mate» y la altura más alta, sin errores, y a 360 px nada se sale (${JSON.stringify(rara)}; ${sobra} px${errores.length ? `; ${errores[0]}` : ""})`);
    await ctx.close();
  }
}

// --- Lo que ya existía ---
/** La sombra más corrida de un elemento (su `box-shadow` calculado), o `null` si no tiene. */
const sombraDe = (pagina, prueba) =>
  pagina.locator(`[data-prueba=${prueba}]`).first().evaluate((e) => {
    const texto = getComputedStyle(e).boxShadow;
    if (!texto || texto === "none") return null;
    // Cada sombra: «color x y difuminado extensión [inset]». Se parten por las comas que no están dentro de un color.
    const una = texto.split(/,(?![^(]*\))/).map((t) => {
      const px = t.replace(/(rgba?|color|hsla?|oklab|oklch|lab|lch)\([^)]*\)/g, "").match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
      return { x: px[0] ?? 0, y: px[1] ?? 0, dentro: /inset/.test(t) };
    });
    return una.filter((u) => !u.dentro).sort((a, b) => Math.abs(b.x) + Math.abs(b.y) - Math.abs(a.x) - Math.abs(a.y))[0] ?? null;
  });
const textoSombra = (pagina, prueba) => pagina.locator(`[data-prueba=${prueba}]`).first().evaluate((e) => getComputedStyle(e).boxShadow);

if (parte("existe")) {
  const CON_SOMBRA = ["ex-tarjeta", "ex-tarjeta-vidrio", "ex-boton", "ex-degradado", "ex-tecla", "ex-retro-tarjeta", "ex-retro-boton", "ex-anime-tarjeta", "ex-anime-boton", "ex-retro-afuera-tarjeta", "ex-retro-afuera-boton"];
  const lados = {};
  for (const [lado, x] of [["derecha", 0.6], ["izquierda", -0.6]]) {
    const { ctx, pagina, errores } = await abrir({ caso: "existe", desde: { x, y: -0.8 } });
    lados[lado] = { errores: errores.length };
    for (const p of CON_SOMBRA) lados[lado][p] = await sombraDe(pagina, p);
    if (lado === "derecha") {
      // Lo que es plano por diseño sigue plano, y lo que tiene recorte no gana sombra.
      const planos = {};
      for (const p of ["ex-plana", "ex-contorno", "ex-ticket", "ex-pixel"]) planos[p] = await textoSombra(pagina, p);
      revisar(Object.values(planos).every((v) => v === "none"), `lo plano sigue plano y lo recortado no gana sombra (${Object.entries(planos).map(([k, v]) => `${k}: ${v}`).join("; ")})`);
      // El neón emite luz: no cambia. Y fuera de una luz, todo sigue como siempre.
      const iguales = {};
      for (const [con, sin] of [["ex-neon-boton", "sin-neon-boton"], ["ex-neon-tarjeta", "sin-neon-tarjeta"]]) iguales[con] = (await textoSombra(pagina, con)) === (await textoSombra(pagina, sin));
      const sinLuz = { tarjeta: await sombraDe(pagina, "sin-tarjeta"), tecla: await sombraDe(pagina, "sin-tecla"), boton: await textoSombra(pagina, "sin-boton"), retro: await sombraDe(pagina, "sin-retro-tarjeta") };
      revisar(Object.values(iguales).every(Boolean) && sinLuz.tarjeta?.x === 0 && sinLuz.tarjeta?.y === 10 && sinLuz.tecla?.x === 0 && sinLuz.boton === "none" && sinLuz.retro?.x === 7 && sinLuz.retro?.y === 7, `el estilo neón no cambia dentro de una luz, y fuera de una luz todo sigue como siempre (${JSON.stringify(sinLuz)})`);
    }
    await ctx.close();
  }
  {
    // Las formas del botón (fuera de una luz): cada una se ve como su forma. Estuvieron sin aplicarse desde que
    // nacieron: el selector que les da peso perdía su barra al pasar por el texto del código.
    const { ctx, pagina } = await abrir({ caso: "existe" });
    const f = await pagina.evaluate(() =>
      Object.fromEntries(
        ["recto", "tecla", "ticket", "sello", "pixel", "subrayado", "circulo"].map((n) => {
          const c = getComputedStyle(document.querySelector(`[data-prueba=forma-${n}]`));
          return [n, { radio: c.borderTopLeftRadius, sombra: c.boxShadow !== "none", mascara: (c.maskImage || c.webkitMaskImage || "none") !== "none", recorte: c.clipPath !== "none", girado: c.transform !== "none", borde: c.borderTopStyle, fondo: c.backgroundColor, ancho: c.width }];
        }),
      ),
    );
    revisar(f.recto.radio === "5px" && f.tecla.sombra && f.tecla.radio === "12px" && f.ticket.mascara && f.sello.girado && f.sello.borde === "double" && f.pixel.recorte && /rgba\(0, 0, 0, 0\)|transparent/.test(f.subrayado.fondo) && f.circulo.radio === "50%" && f.circulo.ancho === "48px", `las formas del botón se ven como su forma (${Object.entries(f).map(([k, v]) => `${k}: ${v.radio}${v.sombra ? ", sombra" : ""}${v.mascara ? ", máscara" : ""}${v.recorte ? ", recorte" : ""}${v.girado ? ", girado" : ""}`).join(" | ")})`);
    await ctx.close();
  }
  const hacia = (lado, signo) => CON_SOMBRA.filter((p) => !(lados[lado][p] && Math.sign(lados[lado][p].x) === signo && lados[lado][p].y > 0));
  revisar(hacia("derecha", -1).length === 0 && hacia("izquierda", 1).length === 0 && lados.derecha.errores + lados.izquierda.errores === 0, `dentro de una luz, tarjetas, botones y sombras duras caen al lado contrario de la luz, con el estilo adentro o afuera (luz a la derecha: ${CON_SOMBRA.map((p) => lados.derecha[p]?.x ?? "sin").join(", ")}; a la izquierda: ${CON_SOMBRA.map((p) => lados.izquierda[p]?.x ?? "sin").join(", ")}${hacia("derecha", -1).concat(hacia("izquierda", 1)).length ? `; fallan: ${[...new Set(hacia("derecha", -1).concat(hacia("izquierda", 1)))].join(", ")}` : ""})`);
  {
    const { ctx, pagina, errores } = await abrir({ caso: "existe" });
    const centro = async (p) => {
      const c = await pagina.locator(`[data-prueba=${p}]`).first().boundingBox();
      return { x: c.x + c.width / 2, y: c.y + c.height / 2 };
    };
    // Un botón apagado no se mueve al apretarlo, ni dentro de una luz ni fuera; y una tecla apagada no queda levantada.
    const movidos = {};
    for (const p of ["ex-apagado", "ex-tecla-apagada", "sin-tecla-apagada"]) {
      const antes = await centro(p);
      await pagina.mouse.move(antes.x, antes.y, { steps: 2 });
      await pagina.mouse.down();
      await pagina.waitForTimeout(250);
      const apretado = await centro(p);
      await pagina.mouse.up();
      movidos[p] = Math.hypot(apretado.x - antes.x, apretado.y - antes.y);
    }
    await pagina.mouse.move(5, 5);
    const levantada = await pagina.locator("[data-prueba=sin-tecla-apagada]").evaluate((e) => getComputedStyle(e).transform);
    revisar(Object.values(movidos).every((d) => d < 0.2) && (levantada === "none" || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(levantada)) && errores.length === 0, `un botón apagado no se mueve al apretarlo, y una tecla apagada no queda levantada (${Object.entries(movidos).map(([k, v]) => `${k}: ${v.toFixed(1)} px`).join("; ")}; ${levantada})`);
    // La tecla, dentro de una luz, se sigue levantando al apuntarla.
    const tecla = await centro("ex-tecla");
    await pagina.mouse.move(tecla.x, tecla.y, { steps: 3 });
    await pagina.waitForTimeout(350);
    const apuntada = await centro("ex-tecla");
    await pagina.mouse.move(5, 5);
    revisar(apuntada.y < tecla.y - 1, `dentro de una luz, la tecla se levanta al apuntarla (${(tecla.y - apuntada.y).toFixed(1)} px)`);
    await ctx.close();
  }
  {
    // El efecto «elevar» de una tarjeta: al apuntarla, su sombra también cae al lado contrario de la luz.
    const lados = {};
    for (const [lado, x] of [["derecha", 0.6], ["izquierda", -0.6]]) {
      const { ctx, pagina } = await abrir({ caso: "existe", desde: { x, y: -0.8 } });
      lados[lado] = await pagina.locator("[data-prueba=ex-elevar]").first().evaluate((e) => {
        const t = getComputedStyle(e, "::after").boxShadow;
        return parseFloat(t.replace(/(rgba?|color|hsla?|oklab|oklch|lab|lch)\([^)]*\)/g, "").match(/-?[\d.]+px/)?.[0] ?? "0");
      });
      if (lado === "derecha") lados.sin = await pagina.locator("[data-prueba=sin-elevar]").first().evaluate((e) => getComputedStyle(e, "::after").boxShadow);
      await ctx.close();
    }
    revisar(lados.derecha < -3 && lados.izquierda > 3 && /0px 22px 40px -18px/.test(lados.sin), `el efecto «elevar» de una tarjeta también cae al lado contrario de la luz (${lados.derecha} y ${lados.izquierda} px), y fuera de una luz es el de siempre`);
  }
  {
    // Con movimiento reducido, apretar no mueve nada (tampoco dentro de una luz).
    const { ctx, pagina, errores } = await abrir({ caso: "existe" }, { opciones: { reducedMotion: "reduce" } });
    const movidos = {};
    for (const p of ["ex-boton", "ex-tecla", "ex-retro-boton"]) {
      const c0 = await pagina.locator(`[data-prueba=${p}]`).first().boundingBox();
      await pagina.mouse.move(c0.x + c0.width / 2, c0.y + c0.height / 2, { steps: 2 });
      await pagina.waitForTimeout(150);
      const c1 = await pagina.locator(`[data-prueba=${p}]`).first().boundingBox();
      await pagina.mouse.down();
      await pagina.waitForTimeout(250);
      const c2 = await pagina.locator(`[data-prueba=${p}]`).first().boundingBox();
      await pagina.mouse.up();
      movidos[p] = Math.hypot(c2.x + c2.width / 2 - (c1.x + c1.width / 2), c2.y + c2.height / 2 - (c1.y + c1.height / 2));
    }
    revisar(Object.values(movidos).every((d) => d < 0.2) && errores.length === 0, `con movimiento reducido, apretar un botón dentro de una luz no lo mueve (${Object.entries(movidos).map(([k, v]) => `${k}: ${v.toFixed(1)} px`).join("; ")})`);
    await ctx.close();
  }
  {
    // Apretar: el botón se corre hacia su sombra y la sombra se junta.
    const { ctx, pagina, errores } = await abrir({ caso: "existe" });
    const medidos = [];
    for (const p of ["ex-boton", "ex-tecla", "ex-retro-boton"]) {
      const boton = pagina.locator(`[data-prueba=${p}]`).first();
      const antes = await boton.boundingBox();
      const sombraAntes = await sombraDe(pagina, p);
      await pagina.mouse.move(antes.x + antes.width / 2, antes.y + antes.height / 2, { steps: 2 });
      await pagina.mouse.down();
      await pagina.waitForTimeout(350);
      const apretado = await boton.boundingBox();
      const sombraApretado = await sombraDe(pagina, p);
      await pagina.mouse.up();
      await pagina.mouse.move(5, 5);
      await pagina.waitForTimeout(250);
      // Se mira el centro: algunos botones además se achican un poco al apretar.
      medidos.push({ p, dx: apretado.x + apretado.width / 2 - (antes.x + antes.width / 2), dy: apretado.y + apretado.height / 2 - (antes.y + antes.height / 2), antes: Math.abs(sombraAntes?.x ?? 0) + Math.abs(sombraAntes?.y ?? 0), apretado: Math.abs(sombraApretado?.x ?? 0) + Math.abs(sombraApretado?.y ?? 0) });
    }
    revisar(medidos.every((m) => m.dx > 0.3 && m.dy > 0.5 && m.apretado < m.antes) && errores.length === 0, `al apretar, el botón se corre hacia su sombra y la sombra se junta (${medidos.map((m) => `${m.p}: ${m.dx.toFixed(1)}, ${m.dy.toFixed(1)} px; sombra ${m.antes.toFixed(0)} → ${m.apretado.toFixed(0)}`).join(" | ")})`);
    await ctx.close();
  }
}

// --- El libro ---
/** Mira el libro cuadro a cuadro durante `ms`: de cada hoja, su ángulo y la opacidad de sus sombreados. */
const mirarLibro = (pagina, donde, ms) =>
  pagina.evaluate(
    async ([sel, dura]) => {
      const libro = document.querySelector(`${sel} .mk-m-libro`);
      const capa = (el, pseudo) => {
        if (!el) return null;
        const c = getComputedStyle(el, pseudo);
        // WebKit no entrega la opacidad de un pseudo-elemento (devuelve vacío): ahí no se sabe.
        return c.content === "none" || c.content === "normal" ? 0 : c.opacity === "" ? null : Number(c.opacity);
      };
      const salida = [];
      const t0 = performance.now();
      while (performance.now() - t0 < dura) {
        await new Promise((listo) => requestAnimationFrame(listo));
        salida.push(
          Object.fromEntries(
            [...libro.querySelectorAll(".mk-m-libro-hoja")].map((h) => {
              const m = getComputedStyle(h).transform;
              const n = m.startsWith("matrix3d") ? m.slice(9, -1).split(",").map(Number) : [1, 0, 0];
              return [h.dataset.hoja, { angulo: Math.abs((Math.atan2(-n[2], n[0]) * 180) / Math.PI), frente: capa(h.querySelector(".mk-m-libro-frente"), "::before"), dorso: capa(h.querySelector(".mk-m-libro-dorso"), "::before"), tapada: capa(h, "::before") }];
            }),
          ),
        );
      }
      return salida;
    },
    [donde, ms],
  );
const siguiente = (pagina, donde) => pagina.locator(`${donde} [data-ir=despues]`).click();
/** Qué tan clara se ve una zona de la página (0 negro, 1 blanco): se le saca una foto y se promedian sus píxeles. */
async function claridad(pagina, zona) {
  const foto = (await pagina.screenshot({ clip: zona })).toString("base64");
  return pagina.evaluate(async (png) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const lienzo = document.createElement("canvas");
    lienzo.width = img.width;
    lienzo.height = img.height;
    const g = lienzo.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    let suma = 0;
    for (let i = 0; i < d.length; i += 4) suma += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    return suma / (d.length / 4);
  }, foto);
}
/** Cuántos píxeles oscuros (tinta: texto) hay en una zona de la página. */
async function tinta(pagina, zona) {
  const foto = (await pagina.screenshot({ clip: zona })).toString("base64");
  return pagina.evaluate(async (png) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const lienzo = document.createElement("canvas");
    lienzo.width = img.width;
    lienzo.height = img.height;
    const g = lienzo.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 300) n++;
    return n;
  }, foto);
}
/** La parte de arriba de la página derecha: ahí van las primeras líneas de la hoja abierta. */
const arribaDerecha = (pagina, donde) =>
  pagina.locator(`${donde} .mk-m-libro-pila`).evaluate((e) => {
    const c = e.getBoundingClientRect();
    return { x: c.left + 20, y: c.top + 20, width: c.width - 40, height: 120 };
  });
/** La franja de la página derecha pegada al lomo: ahí pasa la hoja que gira. */
const juntoAlLomo = (pagina, donde) =>
  pagina.locator(`${donde} .mk-m-libro-pila`).evaluate((e) => {
    const c = e.getBoundingClientRect();
    return { x: c.left + c.width * 0.06, y: c.top + c.height * 0.45, width: c.width * 0.3, height: c.height * 0.45 };
  });
const saltarLectura = (_ok, texto) => console.log(`– no aplica aquí (este navegador no deja leer la opacidad de las capas): ${texto.split(" (")[0]}`);

if (parte("existe")) {
  {
    const { ctx, pagina, errores } = await abrir({ caso: "libro" });
    const con = "[data-prueba=libro-luz]";
    // El libro se abre solo al verse (pasa la tapa): se espera a que termine antes de tocarlo.
    await pagina.waitForSelector(`${con} .mk-m-libro[data-modo=doble][data-vueltas="1"]`, { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(1300);
    // Lo que se ve: a poco de empezar el giro, la zona junto al lomo está más oscura que al terminar. Sin luz, no.
    const sinLuz = "[data-prueba=libro-sin]";
    await pagina.waitForSelector(`${sinLuz} .mk-m-libro[data-vueltas="1"]`, { timeout: 8000 }).catch(() => {});
    // Antes de comparar: ¿este motor dibuja la página derecha? (El WebKit de Playwright la deja en blanco en dos
    // páginas, con luz y sin luz: es anterior a la luz y queda anotado aparte. Ahí no hay nada que comparar.)
    const dibuja = { [con]: await tinta(pagina, await arribaDerecha(pagina, con)), [sinLuz]: await tinta(pagina, await arribaDerecha(pagina, sinLuz)) };
    const verGiro = dibuja[sinLuz] > 200 ? revisar : (_ok, texto) => console.log(`– no aplica aquí (este motor deja en blanco la página derecha del libro, también sin luz: ${dibuja[sinLuz]} píxeles de tinta): ${texto.split(" (")[0]}`);
    // Con luz y sin luz, el libro en reposo muestra lo mismo: la luz no tapa nada.
    revisar(Math.abs(dibuja[con] - dibuja[sinLuz]) <= Math.max(40, dibuja[sinLuz] * 0.1), `en reposo, el libro con luz muestra el mismo texto que sin luz (${dibuja[con]} y ${dibuja[sinLuz]} píxeles de tinta en la página derecha)`);
    const visto = {};
    for (const donde of [con, sinLuz]) {
      const zona = await juntoAlLomo(pagina, donde);
      await siguiente(pagina, donde);
      await pagina.waitForTimeout(110);
      const durante = await claridad(pagina, zona);
      await pagina.waitForTimeout(1300);
      const despues = await claridad(pagina, zona);
      visto[donde] = 1 - durante / despues;
      await pagina.locator(`${donde} [data-ir=antes]`).click();
      await pagina.waitForTimeout(1300);
    }
    verGiro(visto[con] > 0.06 && Math.abs(visto[sinLuz]) < 0.03, `se ve: dentro de una luz, la hoja que gira oscurece la zona junto al lomo (${(visto[con] * 100).toFixed(1)} % más oscura a medio giro); fuera de una luz, no (${(visto[sinLuz] * 100).toFixed(1)} %)`);
    // Se pasa la hoja 1 y se mira cuadro a cuadro.
    await siguiente(pagina, con);
    const giro = (await mirarLibro(pagina, con, 1200)).map((m) => ({ ...m["1"], abajo: m["2"]?.tapada ?? null })).filter((m) => m.angulo !== undefined);
    const deCanto = giro.reduce((a, b) => (Math.abs(b.angulo - 90) < Math.abs(a.angulo - 90) ? b : a), giro[0]);
    const pasado = giro.find((m) => m.angulo > 96);
    const alFinal = giro.at(-1);
    const lee = giro[0].abajo !== null && deCanto.frente !== null;
    const medir = lee ? revisar : saltarLectura;
    medir(giro.length > 20 && deCanto.frente > 0.6 && pasado?.dorso > 0.4 && alFinal.dorso < 0.05 && alFinal.angulo > 179 && errores.length === 0, `dentro de una luz, la hoja que gira se oscurece hasta ponerse de canto y se aclara al caer (de canto, a ${deCanto.angulo.toFixed(0)}°: cara ${deCanto.frente?.toFixed(2)}; recién pasada: dorso ${pasado?.dorso?.toFixed(2)}; al final: dorso ${alFinal.dorso?.toFixed(2)})`);
    medir(giro[0].abajo > 0.8 && alFinal.abajo < 0.05, `la hoja de abajo está en sombra mientras la tapa la que gira, y se aclara cuando queda a la vista (${giro[0].abajo?.toFixed(2)} → ${alFinal.abajo?.toFixed(2)})`);
    // Cambiar de dirección a medio giro: nada salta. (Se devuelve la hoja 1 y, a medio camino, se vuelve a pasar.)
    await pagina.locator(`${con} [data-ir=antes]`).click();
    await pagina.waitForTimeout(260);
    const mirando = mirarLibro(pagina, con, 1500);
    await siguiente(pagina, con);
    const vuelta = await mirando;
    let salto = 0;
    for (let i = 1; i < vuelta.length; i++)
      for (const hoja of Object.keys(vuelta[i]))
        for (const capa of ["frente", "dorso", "tapada"]) salto = Math.max(salto, Math.abs((vuelta[i][hoja]?.[capa] ?? 0) - (vuelta[i - 1][hoja]?.[capa] ?? vuelta[i][hoja]?.[capa] ?? 0)));
    const quedo = vuelta.at(-1)["1"];
    medir(salto < 0.25 && quedo && quedo.angulo > 179 && quedo.dorso < 0.05, `al cambiar de dirección a medio giro nada salta (el cambio más grande entre dos cuadros: ${salto.toFixed(2)}) y la hoja termina de pasar, clara (${JSON.stringify(quedo)})`);
    // Fuera de una luz, el libro no tiene nada de esto.
    const sin = "[data-prueba=libro-sin]";
    await pagina.waitForSelector(`${sin} .mk-m-libro[data-vueltas="1"]`, { timeout: 8000 }).catch(() => {});
    await siguiente(pagina, sin);
    await pagina.waitForTimeout(300);
    const aMedias = (await mirarLibro(pagina, sin, 200)).at(-1);
    const sombraCara = await pagina.locator(`${sin} .mk-m-libro-hoja .mk-m-libro-cara`).first().evaluate((e) => getComputedStyle(e).boxShadow);
    revisar(errores.length === 0 && Object.values(aMedias).every((h) => !h.frente && !h.dorso && !h.tapada) && sombraCara === "rgba(0, 0, 0, 0.6) 0px 16px 30px -22px", `fuera de una luz, el libro gira sin sombreados y con su sombra de siempre (${sombraCara})`);
    await ctx.close();
  }
  {
    // De a una página (teléfono): la hoja se desvanece; no hay sombreado de giro.
    const { ctx, pagina, errores } = await abrir({ caso: "libro" }, { opciones: { viewport: { width: 390, height: 800 } } });
    const con = "[data-prueba=libro-luz]";
    await pagina.waitForSelector(`${con} .mk-m-libro[data-modo=simple][data-vueltas="1"]`, { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(900);
    await siguiente(pagina, con);
    const giro = await mirarLibro(pagina, con, 900);
    const mayor = Math.max(...giro.flatMap((m) => Object.values(m).map((h) => Math.max(h.frente ?? 0, h.dorso ?? 0))));
    const sobra = await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    revisar(mayor === 0 && sobra <= 0 && errores.length === 0, `de a una página no hay sombreado de giro, y a 390 px nada se sale (${mayor}; ${sobra} px)`);
    await ctx.close();
  }
}

// --- El carrusel ---
/** Las fichas del frente y de sus dos lados: su opacidad y la de su capa oscura; y el piso. */
const mirarCarrusel = (pagina, donde) =>
  pagina.evaluate((sel) => {
    const c = document.querySelector(`${sel} .mk-m-carrusel`);
    const lis = [...(c.querySelector(".mk-m-carrusel-anillo")?.children ?? [])];
    const i0 = lis.findIndex((l) => l.hasAttribute("data-frente"));
    const de = (li) => {
      const f = li.querySelector(".mk-m-carrusel-ficha");
      const capa = getComputedStyle(f, "::after");
      return { opacidad: Number(getComputedStyle(f).opacity), capa: capa.content === "none" || capa.content === "normal" ? null : Number(capa.opacity) };
    };
    const escena = c.querySelector(".mk-m-carrusel-escena");
    const piso = getComputedStyle(escena, "::after");
    const n = lis.length;
    const reflejo = getComputedStyle(escena).webkitBoxReflect;
    return {
      n,
      frente: de(lis[i0]),
      derecha: de(lis[(i0 + 1) % n]),
      izquierda: de(lis[(i0 - 1 + n) % n]),
      reflejo: reflejo === undefined ? "no existe" : reflejo,
      sabeReflejar: CSS.supports("-webkit-box-reflect", "below"),
      sabeCoseno: CSS.supports("opacity", "calc(cos(1deg))"),
      piso: piso.content !== "none" && piso.content !== "normal",
      cabe: escena.getBoundingClientRect().bottom <= c.getBoundingClientRect().bottom + 0.5,
    };
  }, donde);

if (parte("existe")) {
  const lados = {};
  for (const [lado, x] of [["izquierda", -0.6], ["derecha", 0.6]]) {
    const { ctx, pagina, errores } = await abrir({ caso: "carrusel", desde: { x, y: -0.8 } });
    await pagina.waitForSelector("[data-prueba=carrusel-luz] .mk-m-carrusel[data-modo=anillo] li[data-frente]", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(1500);
    lados[lado] = { ...(await mirarCarrusel(pagina, "[data-prueba=carrusel-luz]")), errores: errores.length };
    if (lado === "izquierda") {
      // Al girar, la capa cambia de a poco (donde el navegador sabe calcular el coseno).
      const muestras = pagina.evaluate(async () => {
        const f = document.querySelector("[data-prueba=carrusel-luz] li[data-frente] .mk-m-carrusel-ficha");
        const salida = [];
        const t0 = performance.now();
        while (performance.now() - t0 < 1100) {
          await new Promise((listo) => requestAnimationFrame(listo));
          salida.push(Number(getComputedStyle(f, "::after").opacity));
        }
        return salida;
      });
      await pagina.locator("[data-prueba=carrusel-luz] [data-ir=despues]").click();
      const capa = await muestras;
      const distintos = new Set(capa.map((v) => v.toFixed(2))).size;
      const salto = Math.max(0, ...capa.slice(1).map((v, i) => Math.abs(v - capa[i])));
      (lados.izquierda.sabeCoseno ? revisar : (_ok, t) => console.log(`– no aplica aquí (este navegador no calcula cosenos en CSS): ${t.split(" (")[0]}`))(distintos >= 6 && salto < 0.2 && capa.at(-1) > capa[0] + 0.1, `al girar, la ficha se oscurece de a poco (${distintos} valores distintos; el salto más grande ${salto.toFixed(2)}; de ${capa[0].toFixed(2)} a ${capa.at(-1).toFixed(2)})`);
      // Fuera de una luz, el carrusel sigue como siempre.
      const sin = await mirarCarrusel(pagina, "[data-prueba=carrusel-sin]");
      revisar(sin.derecha.opacidad === 0.62 && sin.frente.opacidad === 1 && sin.derecha.capa === null && !sin.piso && (sin.reflejo === "none" || sin.reflejo === "no existe"), `fuera de una luz, el carrusel sigue como siempre (${JSON.stringify(sin.derecha)}; piso: ${sin.piso}; reflejo: ${sin.reflejo})`);
    }
    await ctx.close();
  }
  const i = lados.izquierda;
  const d = lados.derecha;
  revisar(i.frente.capa !== null && i.frente.capa < 0.08 && d.frente.capa < 0.08 && i.izquierda.capa < i.derecha.capa - 0.15 && d.derecha.capa < d.izquierda.capa - 0.15 && [i, d].every((l) => l.frente.opacidad === 1 && l.derecha.opacidad === 1 && l.izquierda.opacidad === 1) && i.errores + d.errores === 0, `dentro de una luz, la ficha del frente queda clara y la del lado de la luz, más clara que la del otro lado (luz a la izquierda: izquierda ${i.izquierda.capa}, frente ${i.frente.capa}, derecha ${i.derecha.capa}; luz a la derecha: izquierda ${d.izquierda.capa}, frente ${d.frente.capa}, derecha ${d.derecha.capa})`);
  revisar(i.piso && i.cabe && (!i.sabeReflejar || (i.reflejo !== "none" && i.reflejo !== "no existe")), `el anillo deja su sombra en el piso${i.sabeReflejar ? " y su reflejo" : " (este navegador no refleja)"}, y nada queda cortado (reflejo: ${String(i.reflejo).slice(0, 40)}; cabe: ${i.cabe})`);
  {
    const { ctx, pagina, errores } = await abrir({ caso: "carrusel" }, { opciones: { viewport: { width: 390, height: 800 } } });
    await pagina.waitForTimeout(1200);
    const sobra = await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    revisar(sobra <= 0 && errores.length === 0, `el carrusel con luz, a 390 px, no se sale de lado (${sobra} px)`);
    await ctx.close();
  }
}

// --- Las dos piezas nuevas ---
/** El espesor de un título: sus capas (`text-shadow`), cada una con su corrimiento y su color. */
const espesorDe = (pagina, prueba) =>
  pagina.locator(`[data-prueba=${prueba}]`).first().evaluate((e) => {
    const c = getComputedStyle(e);
    const capas = c.textShadow === "none" ? [] : c.textShadow.split(/,(?![^(]*\))/).map((t) => {
      const px = t.replace(/(rgba?|color|hsla?|oklab|oklch|lab|lch)\([^)]*\)/g, "").match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
      return { x: px[0] ?? 0, y: px[1] ?? 0, difuso: px[2] ?? 0, color: t.match(/(rgba?|color|hsla?|oklab|oklch|lab|lch)\([^)]*\)/)?.[0] ?? "" };
    });
    return { texto: e.textContent, etiqueta: e.tagName, seleccion: c.userSelect || c.webkitUserSelect, color: c.color, capas };
  });

if (parte("piezas")) {
  const titulos = {};
  for (const [lado, x] of [["izquierda", -0.6], ["derecha", 0.6]]) {
    const { ctx, pagina, errores } = await abrir({ caso: "piezas", desde: { x, y: -0.8 }, sigue: ["puntero"] });
    titulos[lado] = { ...(await espesorDe(pagina, "pz-titulo")), otro: await espesorDe(pagina, "pz-titulo-azul"), grueso: await espesorDe(pagina, "pz-titulo-grueso"), errores: errores.length };
    if (lado === "izquierda") {
      // La tarjeta holográfica: se inclina hacia el cursor y su arcoíris se corre.
      const tarjeta = "[data-prueba=pz-holo]";
      const marcada = await pagina.locator(tarjeta).getAttribute("data-mk-materia");
      const c = await pagina.locator(tarjeta).boundingBox();
      await pagina.mouse.move(c.x + c.width * 0.15, c.y + c.height * 0.8, { steps: 4 });
      await pagina.waitForTimeout(600);
      const a = await capas(pagina, tarjeta);
      await pagina.mouse.move(c.x + c.width * 0.85, c.y + c.height * 0.2, { steps: 4 });
      await pagina.waitForTimeout(600);
      const b = await capas(pagina, tarjeta);
      revisar(marcada === "holografico" && /^matrix3d/.test(a.transform) && a.transform !== b.transform && Math.abs(a.brillo.x - b.brillo.x) > 20 && a.padre === "none", `la tarjeta holográfica se inclina hacia el cursor y su arcoíris se corre (${Math.abs(a.brillo.x - b.brillo.x).toFixed(0)} px), sin profundidad en el padre`);
    }
    await ctx.close();
  }
  const i = titulos.izquierda;
  const d = titulos.derecha;
  const lados = (t) => t.capas.filter((c) => c.difuso === 0);
  revisar(
    i.texto === "Café Luna" && i.etiqueta === "H2" && i.seleccion !== "none" && lados(i).length === 6 && lados(i.grueso).length === 10 && lados(i).every((c) => c.x > 0 && c.y > 0) && lados(d).every((c) => c.x < 0 && c.y > 0) && i.capas.some((c) => c.difuso > 4) && i.errores + d.errores === 0,
    `el título con volumen sigue siendo texto (se lee «${i.texto}», se puede seleccionar), y su espesor cae al lado contrario de la luz (luz a la izquierda: ${lados(i).at(-1)?.x}, ${lados(i).at(-1)?.y} px; a la derecha: ${lados(d).at(-1)?.x}, ${lados(d).at(-1)?.y} px; ${lados(i).length} capas, ${lados(i.grueso).length} con «espesor» 10)`,
  );
  revisar(lados(i)[0].color !== lados(i.otro)[0].color && lados(i)[0].color !== i.color, `el color del costado sale del color del texto (texto ${i.color} → costado ${lados(i)[0].color}; texto ${i.otro.color} → costado ${lados(i.otro)[0].color})`);
  {
    // Movimiento reducido: la tarjeta no se inclina. Y a 360 px nada se sale de lado.
    const { ctx, pagina, errores } = await abrir({ caso: "piezas" }, { opciones: { reducedMotion: "reduce", viewport: { width: 360, height: 760 } } });
    const c = await pagina.locator("[data-prueba=pz-holo]").boundingBox();
    await pagina.mouse.move(c.x + c.width * 0.85, c.y + c.height * 0.2, { steps: 3 });
    await pagina.waitForTimeout(500);
    const quieta = await capas(pagina, "[data-prueba=pz-holo]");
    const sobra = await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    revisar(quieta.transform === "none" && sobra <= 0 && errores.length === 0, `con movimiento reducido la tarjeta no se inclina, y a 360 px nada se sale de lado (${quieta.transform}; ${sobra} px)`);
    await ctx.close();
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
