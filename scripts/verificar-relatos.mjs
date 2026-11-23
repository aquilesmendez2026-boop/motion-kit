// Verifica los relatos en #relatos (y #pagina): entradas, caída a escenas, respaldo sin scroll nativo, movimiento
// reducido, contenido que llega después, foco con teclado y que los keyframes solo animen transform y opacity.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-relatos.mjs [http://localhost:5173]`.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const navegador = await chromium.launch();

async function abrir(ruta, opciones = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  await pagina.goto(base + "/" + ruta);
  await pagina.waitForSelector(".mk-pagina .mk-relato");
  return { ctx, pagina, errores };
}

/** Baja por un teléfono de a poco (para que el respaldo vea pasar cada bloque) y espera a que terminen las entradas. */
async function recorrer(pagina, sel) {
  await pagina.locator(sel).scrollIntoViewIfNeeded();
  await pagina.evaluate(async (s) => {
    const t = document.querySelector(s);
    for (let y = 0; y <= t.scrollHeight; y += 120) {
      t.scrollTop = y;
      await new Promise((r) => setTimeout(r, 40));
    }
    t.scrollTop = t.scrollHeight;
  }, sel);
  await pagina.waitForTimeout(900);
}
const opacidades = (pagina, sel) =>
  pagina.evaluate((s) => [...document.querySelectorAll(`${s} .mk-relato, ${s} [data-mk-parte], ${s} [data-mk-palabra]`)].map((e) => Number(getComputedStyle(e).opacity)), sel);

// 1. Escenas por estilo
{
  const { ctx, pagina, errores } = await abrir("#relatos");
  for (const estilo of ["neon", "retro", "rock", "anime", "pelicula"]) {
    const sel = `[data-telefono="${estilo}"]`;
    await recorrer(pagina, sel);
    const ops = await opacidades(pagina, sel);
    revisar(ops.length > 0 && ops.every((o) => o > 0.99), `escenas en ${estilo}: tras bajar, todo queda visible (${ops.length} elementos)`);
  }
  const sinMarcas = pagina.locator('[data-prueba="sin-marcas"]');
  revisar((await sinMarcas.getAttribute("data-pedido")) === "cuento" && (await sinMarcas.getAttribute("data-modo")) === "escenas", "sin marcas, «cuento» cae a escenas");

  // Contenido que llega después (Review Focus 1)
  const n = await pagina.evaluate(async () => {
    const b = document.querySelector('[data-prueba="con-lineas"]');
    const p = document.createElement("p");
    p.setAttribute("data-mk-parte", "linea");
    p.textContent = "Línea que llegó después.";
    b.appendChild(p);
    await new Promise((r) => setTimeout(r, 200));
    const todas = b.querySelectorAll('[data-mk-parte="linea"]');
    return { n: p.style.getPropertyValue("--mk-n"), i: p.style.getPropertyValue("--mk-i"), total: todas.length };
  });
  revisar(n.n === String(n.total) && n.i === String(n.total - 1), `una línea agregada después recibe --mk-i y --mk-n (${n.i}/${n.n} de ${n.total})`);

  // Keyframes: solo transform y opacity (salvo el trazo y el viajero del hilo)
  const malos = await pagina.evaluate(() => {
    const r = [];
    for (const s of document.querySelectorAll('style[id^="motion-kit-"]'))
      for (const m of s.textContent.matchAll(/@keyframes\s+(mk-r-[\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g))
        for (const d of m[2].matchAll(/\{([^}]*)\}/g))
          for (const prop of d[1].split(";").map((x) => x.split(":")[0].trim()).filter(Boolean)) {
            const ok = ["transform", "translate", "scale", "rotate", "opacity", "animation-timing-function"].includes(prop) ||
              (m[1].startsWith("mk-r-hilo") && ["stroke-dashoffset", "offset-distance"].includes(prop));
            if (!ok) r.push(`${m[1]}: ${prop}`);
          }
    return r;
  });
  revisar(malos.length === 0, "keyframes mk-r-: solo transform y opacity" + (malos.length ? " -> " + malos.slice(0, 4).join(", ") : ""));
  revisar(errores.length === 0, "sin errores en #relatos" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}

// 1b. Los seis relatos de bloque
const RELATOS_BLOQUE = ["pelicula", "cuento", "profundidad", "iris", "carrete", "subtitulos"];
/** Deja el bloque de un relato a mitad de su recorrido dentro del teléfono. */
async function aMitad(pagina, tel, modo) {
  return pagina.evaluate(async ([t, m]) => {
    const tele = document.querySelector(t);
    const b = tele.querySelector(`.mk-relato[data-modo="${m}"]`);
    const arriba = b.getBoundingClientRect().top - tele.getBoundingClientRect().top + tele.scrollTop;
    for (let y = 0; y <= arriba + (b.offsetHeight - tele.clientHeight) / 2; y += 100) { tele.scrollTop = y; await new Promise((r) => setTimeout(r, 30)); }
    tele.scrollTop = arriba + (b.offsetHeight - tele.clientHeight) / 2;
    await new Promise((r) => setTimeout(r, 400));
    return true;
  }, [tel, modo]);
}
{
  const { ctx, pagina, errores } = await abrir("#relatos");
  for (const r of RELATOS_BLOQUE) {
    const sel = `[data-telefono="r-${r}"]`;
    const n = await pagina.locator(`${sel} .mk-relato[data-modo="${r}"]`).count();
    await recorrer(pagina, sel);
    const ops = await opacidades(pagina, sel);
    revisar(n > 0 && ops.every((o) => o > 0.99), `${r}: el bloque usa su relato (${n}) y, al final, todo queda visible`);
  }
  // Carrete: un bloque con una sola foto no es una tira
  const unaFoto = await pagina.getAttribute('[data-telefono="r-carrete"] [data-prueba="con-lineas"]', "data-modo");
  revisar(unaFoto === "escenas", `carrete: un bloque con una sola foto cae a escenas (${unaFoto})`);
  // Película: la cinta de avance se llena al bajar (ya se recorrió el teléfono hasta abajo)
  const cinta = await pagina.evaluate(() => getComputedStyle(document.querySelector('[data-telefono="r-pelicula"] .mk-cinta>i'), "::after").scale);
  revisar(String(cinta).startsWith("1 1") || String(cinta) === "1", `película: la cinta de avance se llena al bajar (scale ${cinta})`);
  // Película: el telón termina recogido
  const telon = await pagina.evaluate(() => getComputedStyle(document.querySelector('[data-telefono="r-pelicula"] .mk-relato[data-modo="pelicula"]'), "::before").scale);
  revisar(String(telon).startsWith("0"), `película: el telón termina recogido (scale ${telon})`);
  // Carrete: la tira avanza de lado a mitad del bloque
  await aMitad(pagina, '[data-telefono="r-carrete"]', "carrete");
  const tx = await pagina.evaluate(() => getComputedStyle(document.querySelector('[data-telefono="r-carrete"] [data-mk-tira]')).translate);
  revisar(parseFloat(tx) < -10, `carrete: la tira se desplazó de lado a mitad del bloque (translate ${tx})`);
  // Subtítulos: a mitad, hay palabras encendidas y apagadas
  await aMitad(pagina, '[data-telefono="r-subtitulos"]', "subtitulos");
  const pal = await pagina.evaluate(() => [...document.querySelectorAll('[data-telefono="r-subtitulos"] [data-mk-palabra]')].map((e) => Number(getComputedStyle(e).opacity)));
  revisar(pal.some((o) => o > 0.9) && pal.some((o) => o < 0.5), `subtítulos: a mitad hay palabras encendidas y apagadas (${pal.map((o) => o.toFixed(1)).join(" ")})`);
  // Cuento más alto que la pantalla (Review Focus 4)
  const largo = await pagina.evaluate(() => {
    const b = document.querySelector('[data-telefono="r-cuento-largo"] .mk-relato[data-modo="cuento"]');
    return { largo: b.hasAttribute("data-capitulo-largo"), pos: getComputedStyle(b.querySelector(".mk-relato-in")).position };
  });
  revisar(largo.largo && largo.pos !== "sticky", `cuento más alto que la pantalla: sin sticky (${largo.pos}) y con entrada de escenas`);
  revisar(errores.length === 0, "sin errores con los seis relatos" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}

// 1c. Relatos de página: hilo y luz
{
  const { ctx, pagina, errores } = await abrir("#relatos");
  const medir = (sel, que) => pagina.evaluate(([s, q]) => {
    const t = document.querySelector(s);
    if (q === "trazo") return parseFloat(getComputedStyle(t.querySelector(".mk-hilo path")).strokeDashoffset);
    if (q === "viajero") return parseFloat(getComputedStyle(t.querySelector(".mk-hilo-viajero")).offsetDistance);
    if (q === "noche") return Number(getComputedStyle(t.querySelector('.mk-cielo [data-hora="noche"]')).opacity);
    if (q === "d") return t.querySelector(".mk-hilo path").getAttribute("d");
  }, [sel, que]);
  const hilo = '[data-telefono="p-hilo"]';
  await pagina.locator(hilo).scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(300);
  const t0 = await medir(hilo, "trazo"), v0 = await medir(hilo, "viajero");
  await recorrer(pagina, hilo);
  const t1 = await medir(hilo, "trazo"), v1 = await medir(hilo, "viajero");
  revisar(t1 < t0, `hilo: el trazo avanza al bajar (${t0} → ${t1})`);
  revisar(v1 > v0, `hilo: el viajero avanza (${v0}% → ${v1}%)`);
  // Review Focus 5: cambio de tamaño
  const d0 = await medir(hilo, "d");
  await pagina.evaluate((s) => { document.querySelector(s).style.width = "420px"; }, hilo);
  await pagina.waitForTimeout(400);
  const d1 = await medir(hilo, "d");
  revisar(d0 && d1 && d0 !== d1, "hilo: al cambiar el tamaño se recalcula el camino");
  const luz = '[data-telefono="p-luz"]';
  await pagina.locator(luz).scrollIntoViewIfNeeded();
  await pagina.waitForTimeout(300);
  const n0 = await medir(luz, "noche");
  await recorrer(pagina, luz);
  const n1 = await medir(luz, "noche");
  revisar(n0 < 0.2 && n1 > 0.8, `luz: al inicio la noche no se ve y al final sí (${n0.toFixed(2)} → ${n1.toFixed(2)})`);
  revisar(errores.length === 0, "sin errores con hilo y luz" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}

// 1d. Hallazgos de la revisión final
{
  const { ctx, pagina, errores } = await abrir("#relatos");
  // Carrete: la tira se vuelve a medir cuando llegan fotos después
  const dx = await pagina.evaluate(async () => {
    const tel = document.querySelector('[data-telefono="r-carrete"]');
    const b = [...tel.querySelectorAll('.mk-relato[data-modo="carrete"]')].find((x) => x.querySelector(".rel-cuadro"));
    const antes = parseFloat(b.style.getPropertyValue("--mk-tira-dx"));
    const tira = b.querySelector("[data-mk-tira]");
    for (let i = 0; i < 4; i++) { const f = tira.firstElementChild.cloneNode(true); tira.appendChild(f); }
    await new Promise((r) => setTimeout(r, 400));
    return { antes, despues: parseFloat(b.style.getPropertyValue("--mk-tira-dx")) };
  });
  revisar(dx.despues < dx.antes - 100, `carrete: con fotos nuevas la tira se vuelve a medir (${dx.antes} → ${dx.despues})`);
  // Carrete que cabe entero: no alarga la página
  const corta = await pagina.evaluate(() => {
    const b = document.querySelector('[data-prueba="tira-corta"]');
    const tel = b.closest(".rel-tel");
    return { corta: b.hasAttribute("data-tira-corta"), alto: b.offsetHeight, vista: tel.clientHeight };
  });
  revisar(corta.corta && corta.alto < corta.vista, `carrete que cabe entero: no alarga la página (${corta.alto}px de ${corta.vista})`);
  // Subtítulos sin palabras marcadas: escenas
  revisar((await pagina.getAttribute('[data-prueba="frase-sin-palabras"]', "data-modo")) === "escenas", "subtítulos sin palabras marcadas cae a escenas");
  // Foco con teclado dentro de la tira y del telón (sin mover el scroll)
  const foco = await pagina.evaluate(async () => {
    const tel = document.querySelector('[data-telefono="r-carrete"]');
    tel.scrollTop = 0;
    const tira = tel.querySelector(".rel-galeria[data-mk-tira]");
    const a = document.createElement("a"); a.href = "#relatos"; a.textContent = "ver"; tira.lastElementChild.appendChild(a);
    await new Promise((r) => setTimeout(r, 200));
    a.focus({ preventScroll: true });
    await new Promise((r) => setTimeout(r, 300));
    const cs = getComputedStyle(tira);
    const enTira = { translate: cs.translate, overflow: cs.overflowX };
    const telP = document.querySelector('[data-telefono="r-pelicula"]');
    telP.scrollTop = 0;
    const blq = telP.querySelectorAll('.mk-relato[data-modo="pelicula"]');
    const ultimo = [...blq].find((b) => b.querySelector("a"));
    ultimo.querySelector("a").focus({ preventScroll: true });
    await new Promise((r) => setTimeout(r, 300));
    const tel2 = getComputedStyle(ultimo, "::before");
    return { ...enTira, telon: tel2.content === "none" || tel2.display === "none" };
  });
  revisar(foco.translate === "none" && foco.overflow === "auto", `foco en la tira: queda quieta y deslizable (${foco.translate}, ${foco.overflow})`);
  revisar(foco.telon, "foco en un bloque de película: el telón no tapa");
  // Rock: la entrada no corre la página de lado
  revisar((await pagina.evaluate(() => getComputedStyle(document.querySelector('[data-telefono="rock"] .mk-pagina')).overflowX)) === "clip", "la página no se corre de lado con las entradas (overflow-x: clip)");
  revisar(errores.length === 0, "sin errores en los hallazgos" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}
// Página con body{overflow-x:hidden}: no crece sin límite
{
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 800 } });
  const pagina = await ctx.newPage();
  await pagina.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => { const st = document.createElement("style"); st.textContent = "body{overflow-x:hidden}"; document.head.appendChild(st); });
  });
  const d = Buffer.from(JSON.stringify({ version: 1, encabezado: { version: 1, estilo: "pelicula", titulo: "Hola" }, relato: "cuento" })).toString("base64url");
  await pagina.goto(base + "/#pagina?d=" + d);
  await pagina.waitForSelector(".mk-pagina .mk-relato");
  await pagina.waitForTimeout(800);
  const alto = await pagina.evaluate(() => document.documentElement.scrollHeight);
  revisar(alto < 30000, `con body{overflow-x:hidden}, la página no crece sin límite (${alto}px)`);
  await ctx.close();
}

// 2. Respaldo forzado (navegador sin scroll nativo)
{
  const { ctx, pagina } = await abrir("#relatos");
  await pagina.locator('[data-prueba="respaldo"]').check();
  await pagina.waitForTimeout(200);
  // Foco con teclado en un bloque que todavía no entró (Review Focus 2)
  const foco = await pagina.evaluate(async () => {
    const tel = document.querySelector('[data-telefono="pelicula"]');
    tel.scrollTop = 0;
    const conEnlace = [...tel.querySelectorAll(".mk-relato")].filter((b) => b.querySelector("a,button"));
    const ultimo = conEnlace[conEnlace.length - 1];
    const boton = ultimo.querySelector("a,button");
    boton.focus({ preventScroll: true });
    await new Promise((r) => setTimeout(r, 900));
    return { visto: ultimo.hasAttribute("data-visto"), opacidad: Number(getComputedStyle(ultimo).opacity) };
  });
  revisar(!foco.visto && foco.opacidad > 0.99, `con respaldo, un botón enfocado muestra su bloque (opacidad ${foco.opacidad})`);
  const sel = '[data-telefono="rock"]';
  await recorrer(pagina, sel);
  const estado = await pagina.evaluate((s) => [...document.querySelectorAll(`${s} .mk-relato`)].map((e) => [e.hasAttribute("data-visto"), Number(getComputedStyle(e).opacity)]), sel);
  revisar((await pagina.locator(".mk-pagina[data-mk-sin-scroll]").count()) > 0, "respaldo: la página se marca sin scroll nativo");
  revisar(estado.length > 0 && estado.every(([v, o]) => v && o > 0.99), "respaldo: al bajar, los bloques reciben data-visto y quedan visibles");
  await ctx.close();
}

// 3. Movimiento reducido: todo visible sin bajar
{
  const { ctx, pagina } = await abrir("#relatos", { reducedMotion: "reduce" });
  await pagina.waitForTimeout(300);
  const ops = await opacidades(pagina, "[data-telefono]");
  revisar((await pagina.locator('.mk-pagina[data-nivel="quieto"]').count()) > 0, "movimiento reducido: nivel quieto");
  revisar(ops.length > 0 && ops.every((o) => o > 0.99), `movimiento reducido: todo visible sin bajar (${ops.length} elementos)`);
  // Review Focus 3: ningún telón, círculo de iris ni capa tapa el contenido
  const tapas = await pagina.evaluate(() => [...document.querySelectorAll(".mk-relato")].flatMap((b) =>
    ["::before", "::after"].map((p) => getComputedStyle(b, p)).filter((c) => c.content !== "none" && c.display !== "none").map(() => b.dataset.modo)));
  revisar(tapas.length === 0, "quieto: ningún telón ni iris tapa el contenido" + (tapas.length ? " -> " + tapas.join(", ") : ""));
  const fondo = await pagina.evaluate(() => {
    const r = {};
    for (const id of ["p-hilo", "p-luz"]) {
      const t = document.querySelector(`[data-telefono="${id}"]`);
      t.scrollIntoView({ block: "center" });
      const h = t.querySelector(".mk-relato h3").getBoundingClientRect();
      const arriba = document.elementFromPoint(h.left + h.width / 2, h.top + h.height / 2);
      const viajero = t.querySelector(".mk-hilo-viajero");
      r[id] = { texto: Boolean(arriba?.closest(".mk-relato")), viajero: viajero ? getComputedStyle(viajero).display : "no hay" };
    }
    return r;
  });
  revisar(fondo["p-hilo"].viajero !== "block" && fondo["p-hilo"].texto && fondo["p-luz"].texto, `quieto: sin viajero y el cielo no tapa el texto (${JSON.stringify(fondo)})`);
  await ctx.close();
}

// 4. #pagina: encabezado, relatos por bloque y receta de página
{
  const { ctx, pagina, errores } = await abrir("#pagina");
  const modo = (id) => pagina.getAttribute(`[data-bloque="${id}"]`, "data-modo");
  await pagina.locator('[data-prueba="relato-galeria"]').selectOption("carrete");
  await pagina.waitForTimeout(200);
  revisar((await modo("galeria")) === "carrete", "#pagina: elegir carrete en la galería cambia su data-modo");
  await pagina.locator('[data-prueba="relato-contacto"]').selectOption("carrete");
  await pagina.waitForTimeout(200);
  revisar((await modo("contacto")) === "escenas", "#pagina: carrete en contacto (sin marcas) cae a escenas");
  await pagina.locator('[data-prueba="relato-historia"]').selectOption("cuento");
  await pagina.locator('[data-prueba="relato-pagina"]').selectOption("hilo");
  await pagina.waitForTimeout(200);
  const json = JSON.parse(await pagina.locator('[data-prueba="json-pagina"]').textContent());
  revisar(json.version === 1 && json.encabezado?.version === 1 && (await pagina.locator('[data-prueba="json-pagina"][data-valida]').count()) === 1,
    "#pagina: el JSON es una receta de página válida");
  revisar(json.relatoPagina === "hilo" && json.bloques?.some((b) => b.id === "galeria" && b.relato === "carrete"), "#pagina: la receta guarda los relatos elegidos");
  const ids = ["historia", "carta", "galeria", "resenas", "contacto"];
  const antes = await Promise.all(ids.map(modo));
  const href = await pagina.locator('[data-prueba="enlace-pagina"]').getAttribute("href");
  await pagina.goto(base + "/" + href.slice(href.indexOf("#")));
  await pagina.waitForSelector(".mk-pagina .mk-relato");
  await pagina.waitForTimeout(300);
  const despues = await Promise.all(ids.map(modo));
  revisar(JSON.stringify(antes) === JSON.stringify(despues), `#pagina?d=… abre con los mismos relatos (${despues.join(", ")})`);
  revisar((await pagina.locator('.mk-pagina[data-mk-relato-pagina="hilo"]').count()) === 1, "#pagina?d=… trae el relato de página");
  revisar(errores.length === 0, "sin errores en #pagina" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}

await navegador.close();
console.log(fallas ? `\n${fallas} fallas` : "\nTodo bien");
process.exit(fallas ? 1 : 0);
