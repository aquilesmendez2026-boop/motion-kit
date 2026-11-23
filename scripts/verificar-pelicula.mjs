// Verifica el encabezado de película en el editor (#encabezados): apertura, varias tomas, palabras que rotan, barra y
// telón al bajar, estado del negocio, foto en las letras, tratamiento de foto, hora del día y colores desde la foto.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-pelicula.mjs [http://localhost:5173]`.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};
const navegador = await chromium.launch();
const VISTA = '[data-prueba="vista"]';

async function abrir(opciones = {}, antes) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  if (antes) await pagina.addInitScript(antes);
  await pagina.goto(base + "/#encabezados");
  await pagina.waitForSelector(`${VISTA} .mk-enc`);
  return { ctx, pagina, errores };
}
const hay = (pagina, sel) => pagina.locator(`${VISTA} ${sel}`).count();

// --- Apertura ---
{
  const { ctx, pagina, errores } = await abrir();
  await pagina.locator('[data-prueba="presenta"]').fill("Café Vinilo presenta");
  await pagina.locator('[data-prueba="apertura"]').check();
  await pagina.waitForTimeout(150);
  const aparece = await hay(pagina, ".mk-enc-apertura");
  const presenta = aparece ? await pagina.locator(`${VISTA} .mk-enc-apertura`).textContent() : "";
  await pagina.waitForTimeout(3200);
  revisar(aparece === 1 && presenta.includes("Café Vinilo presenta") && (await hay(pagina, ".mk-enc-apertura")) === 0, "apertura: aparece con «presenta» y se quita sola (≤ 3 s)");
  await pagina.locator('[data-prueba="repetir"]').click();
  await pagina.waitForTimeout(300);
  revisar((await hay(pagina, ".mk-enc-apertura")) === 0, "apertura: no vuelve en la misma sesión");
  await pagina.locator('[data-prueba="apertura-otra-vez"]').click();
  await pagina.waitForTimeout(150);
  const otra = await hay(pagina, ".mk-enc-apertura");
  await pagina.mouse.click(700, 300);
  await pagina.waitForTimeout(250);
  revisar(otra === 1 && (await hay(pagina, ".mk-enc-apertura")) === 0, "apertura: «ver otra vez» la muestra y un toque la salta");
  revisar(errores.length === 0, "apertura: sin errores" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}
{
  // Review Focus 1: sessionStorage que lanza (modo privado estricto)
  const { ctx, pagina, errores } = await abrir({}, () => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("bloqueado"); } });
  });
  await pagina.locator('[data-prueba="apertura"]').check();
  await pagina.waitForTimeout(150);
  const aparece = await hay(pagina, ".mk-enc-apertura");
  await pagina.waitForTimeout(3200);
  revisar(aparece === 1 && (await hay(pagina, ".mk-enc-apertura")) === 0 && errores.length === 0, "apertura: con sessionStorage que lanza, igual aparece y se quita, sin errores");
  await ctx.close();
}

// --- Varias tomas ---
async function prepararTomas(pagina) {
  await pagina.locator('[data-prueba="composicion"]').selectOption("imagen");
  await pagina.locator('[data-prueba="fotos-ejemplo"]').check();
  await pagina.locator('[data-prueba="tomas"]').check();
  await pagina.waitForTimeout(600);
}
const tomaActiva = (pagina) => pagina.locator(`${VISTA} .mk-tomas`).getAttribute("data-activa");
{
  const { ctx, pagina, errores } = await abrir();
  await prepararTomas(pagina);
  const a = await tomaActiva(pagina);
  const n = await pagina.locator(`${VISTA} .mk-tomas img`).count();
  await pagina.waitForTimeout(5600);
  const b = await tomaActiva(pagina);
  revisar(n === 3 && a === "0" && b === "1", `tomas: tres fotos y a los 6 s se ve la segunda (${a} → ${b})`);
  revisar(errores.length === 0, "tomas: sin errores" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}
{
  const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
  await prepararTomas(pagina);
  await pagina.waitForTimeout(5600);
  revisar((await tomaActiva(pagina)) === "0", "tomas en quieto: solo la primera, quieta");
  await ctx.close();
}

// --- Palabras que rotan ---
{
  const { ctx, pagina, errores } = await abrir();
  // Un solo protagonista: sin fondo animado, para que las palabras sean las que se mueven.
  await pagina.locator('[data-prueba="efecto"]').selectOption("");
  await pagina.locator('[data-prueba="palabras"]').fill("barrio, autor, la casa");
  await pagina.locator('[data-prueba="palabras"]').blur();
  await pagina.waitForTimeout(1500); // el título se ajusta a su ancho una vez; después ya no debe moverse
  const leer = () => pagina.evaluate((v) => {
    const h = document.querySelector(`${v} .mk-enc-titulo`);
    const activa = h.querySelector(".mk-rot [data-activa]");
    return { alto: Math.round(h.getBoundingClientRect().height), palabra: activa?.textContent ?? "", aria: h.getAttribute("aria-label") };
  }, VISTA);
  const vistos = [await leer()];
  for (let k = 0; k < 3; k++) {
    await pagina.waitForTimeout(2500);
    vistos.push(await leer());
  }
  const palabras = new Set(vistos.map((v) => v.palabra));
  revisar(palabras.size >= 3, `palabras: cambian (${[...palabras].join(", ")})`);
  revisar(new Set(vistos.map((v) => v.alto)).size === 1, `palabras: el título no cambia de alto (${vistos.map((v) => v.alto).join(", ")})`);
  revisar(vistos[0].aria === "Café de especialidad, tostado aquí", `palabras: el lector lee el título con una sola palabra («${vistos[0].aria}»)`);
  // Con fondo animado, las palabras se calman (queda la del título).
  await pagina.locator('[data-prueba="efecto"]').selectOption("rejilla");
  await pagina.waitForTimeout(400);
  revisar((await pagina.locator(`${VISTA} .mk-rot`).count()) === 0, "palabras: con fondo animado no rotan (un solo protagonista)");
  revisar(errores.length === 0, "palabras: sin errores" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}

// --- Barra al bajar, telón y estado del negocio ---
const bajarHasta = (pagina, fraccion) => pagina.evaluate(async ([v, f]) => {
  const h = document.querySelector(`${v} .mk-enc`);
  const y = window.scrollY + h.getBoundingClientRect().top + h.offsetHeight * f;
  window.scrollTo(0, y);
  await new Promise((r) => setTimeout(r, 500));
}, [VISTA, fraccion]);
{
  const { ctx, pagina, errores } = await abrir();
  await pagina.locator('[data-prueba="salida"]').selectOption("barra");
  await pagina.locator('[data-prueba="nombre"]').fill("Café Vinilo");
  await pagina.waitForTimeout(300);
  const antes = await pagina.evaluate(() => {
    const b = document.querySelector(".mk-enc-barra");
    return { hay: Boolean(b), inert: b?.inert, visible: b?.hasAttribute("data-visible"), h1: document.querySelectorAll('[data-prueba="vista"] h1').length, h1EnBarra: b?.querySelectorAll("h1,h2").length };
  });
  revisar(antes.hay && antes.inert && !antes.visible && antes.h1 === 1 && antes.h1EnBarra === 0, `barra: mientras se ve el encabezado está oculta e inert, y hay un solo h1 (${JSON.stringify(antes)})`);
  await bajarHasta(pagina, 1.2);
  const despues = await pagina.evaluate(() => {
    const b = document.querySelector(".mk-enc-barra");
    return { visible: b.hasAttribute("data-visible"), inert: b.inert, texto: b.textContent, botones: b.querySelectorAll("a,button").length };
  });
  revisar(despues.visible && !despues.inert && despues.texto.includes("Café Vinilo") && despues.texto.includes("Ver la carta") && despues.botones === 1,
    `barra: al bajar aparece con el nombre y el botón principal (${JSON.stringify(despues)})`);
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.locator('[data-prueba="barra-propia"]').check();
  await pagina.waitForTimeout(300);
  revisar((await pagina.locator(".mk-enc-barra").count()) === 0, "barraPropia: no dibuja otra barra");
  // Telón
  await pagina.locator('[data-prueba="salida"]').selectOption("telon");
  await pagina.waitForTimeout(300);
  const cortina = () => pagina.evaluate((v) => getComputedStyle(document.querySelector(`${v} .mk-enc-cortinas i`)).translate, VISTA);
  const c0 = await cortina();
  await bajarHasta(pagina, 0.7);
  const c1 = await cortina();
  revisar(c0 !== c1, `telón: al bajar, las cortinas avanzan (${c0} → ${c1})`);
  await pagina.evaluate(() => window.scrollTo(0, 0));
  // Estado del negocio
  const estado = async (v) => {
    await pagina.locator('[data-prueba="estado"]').selectOption(v);
    await pagina.waitForTimeout(250);
    return (await pagina.locator(`${VISTA} .mk-enc-estado`).count()) ? (await pagina.locator(`${VISTA} .mk-enc-estado`).textContent()) : null;
  };
  const abierto = await estado("abierto");
  const cerrado = await estado("cerrado");
  const proxima = await estado("proxima");
  const nada = await estado("");
  revisar(abierto?.includes("Abierto ahora · cierra a las 22:00"), `estado: abierto se lee («${abierto}»)`);
  revisar(cerrado?.includes("Cerrado · abre el lunes a las 9:00"), `estado: cerrado se lee («${cerrado}»)`);
  revisar(proxima?.includes("Próxima hora libre: hoy 17:30"), `estado: próxima hora se lee («${proxima}»)`);
  revisar(nada === null, "estado: sin datos no se dibuja");
  revisar(errores.length === 0, "barra, telón y estado: sin errores" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}

// --- Foto en las letras, tratamiento de foto y hora del día ---
const titulo = (pagina) => pagina.evaluate((v) => {
  const h = document.querySelector(`${v} .mk-enc-titulo`);
  const cs = getComputedStyle(h);
  return { clip: cs.backgroundClip || cs.webkitBackgroundClip, fondo: cs.backgroundImage, color: cs.color };
}, VISTA);
{
  const { ctx, pagina, errores } = await abrir();
  await pagina.locator('[data-prueba="composicion"]').selectOption("gigante");
  await pagina.locator('[data-prueba="fotos-ejemplo"]').check();
  await pagina.locator('[data-prueba="foto-letras"]').check();
  await pagina.waitForTimeout(600);
  const t = await titulo(pagina);
  revisar(t.clip === "text" && t.fondo.startsWith("url("), `foto en letras: el título usa la foto (${t.clip}, ${t.fondo.slice(0, 20)}…)`);
  // Las letras no pueden ser capas aparte (animación, opacidad, inline-block): background-clip:text no las alcanza y el título desaparece.
  const capas = await pagina.evaluate((v) => [...document.querySelectorAll(`${v} .mk-enc-titulo *`)]
    .filter((e) => { const cs = getComputedStyle(e); return cs.animationName !== "none" || Number(cs.opacity) < 1 || cs.display === "inline-block" || cs.transform !== "none" || (cs.position !== "static" && cs.zIndex !== "auto"); }).length, VISTA);
  revisar(capas === 0, `foto en letras: ninguna letra va en una capa aparte, así el título se ve (${capas} capas)`);
  const contorno = await pagina.evaluate((v) => getComputedStyle(document.querySelector(`${v} .mk-enc-titulo`)).webkitTextStrokeWidth, VISTA);
  revisar(parseFloat(contorno) > 0, `foto en letras: las letras llevan contorno para leerse con cualquier foto (${contorno})`);
  await pagina.locator('[data-prueba="foto-letras"]').uncheck();
  // Tratamientos
  await pagina.locator('[data-prueba="composicion"]').selectOption("dividido");
  const capa = () => pagina.evaluate((v) => {
    const m = document.querySelector(`${v} .mk-enc-media`);
    const img = m.querySelector("img");
    return { filtro: getComputedStyle(img).filter, capa: getComputedStyle(m, "::after").content };
  }, VISTA);
  const sin = await capa();
  const cambios = [];
  for (const tr of ["duotono", "grano", "trama", "bn"]) {
    await pagina.locator('[data-prueba="tratamiento"]').selectOption(tr);
    await pagina.waitForTimeout(250);
    const c = await capa();
    cambios.push(`${tr}:${c.filtro !== sin.filtro || c.capa !== sin.capa ? "sí" : "no"}`);
  }
  revisar(cambios.every((c) => c.endsWith("sí")), `tratamientos: cada uno cambia el filtro o la capa de la foto (${cambios.join(", ")})`);
  // Hora del día (fijada desde el editor)
  const horas = [];
  for (const h of ["manana", "tarde", "noche"]) {
    await pagina.locator('[data-prueba="hora"]').selectOption(h);
    await pagina.waitForTimeout(200);
    horas.push(await pagina.locator(`${VISTA} .mk-enc`).getAttribute("data-hora"));
  }
  revisar(horas.join(",") === "manana,tarde,noche", `hora del día: data-hora sigue la hora fijada (${horas.join(", ")})`);
  await pagina.locator('[data-prueba="hora"]').selectOption("");
  await pagina.waitForTimeout(200);
  revisar((await pagina.locator(`${VISTA} .mk-enc[data-hora]`).count()) === 0, "hora del día: apagada, sin tinte");
  revisar(errores.length === 0, "foto en letras, tratamiento y hora: sin errores" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}
{
  // Review Focus 5: foto en letras sin foto o con una foto que no carga → el título se ve
  for (const [nombre, extra] of [["sin foto", {}], ["con foto rota", { imagenes: ["https://motion-kit.invalid/no-existe.jpg"] }]]) {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 } });
    const pagina = await ctx.newPage();
    await pagina.route(/motion-kit\.invalid/, (r) => r.abort());
    const d = Buffer.from(JSON.stringify({ estilo: "pelicula", titulo: "Café de *barrio*", composicion: "gigante", fotoEnLetras: true, ...extra })).toString("base64url");
    await pagina.goto(base + "/#vista?d=" + d);
    await pagina.waitForSelector(".mk-enc-titulo");
    await pagina.waitForTimeout(800);
    const t = await pagina.evaluate(() => {
      const cs = getComputedStyle(document.querySelector(".mk-enc-titulo"));
      return { clip: cs.backgroundClip || cs.webkitBackgroundClip, color: cs.color };
    });
    revisar(t.clip !== "text" && !/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(t.color), `foto en letras ${nombre}: el título tiene color visible (${t.clip}, ${t.color})`);
    await ctx.close();
  }
}

// --- Colores desde la foto y receta v2 ---
{
  const { ctx, pagina, errores } = await abrir();
  const b64 = await pagina.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 100; c.height = 100;
    const x = c.getContext("2d");
    x.fillStyle = "#f3f7f2"; x.fillRect(0, 0, 100, 70);
    x.fillStyle = "#2f6b3f"; x.fillRect(0, 70, 100, 30);
    return c.toDataURL("image/png").split(",")[1];
  });
  await pagina.locator('[data-prueba="foto"]').setInputFiles({ name: "bosque.png", mimeType: "image/png", buffer: Buffer.from(b64, "base64") });
  await pagina.locator('[data-prueba="colores-foto"]').click();
  await pagina.waitForTimeout(800);
  const tema = await pagina.locator('[data-prueba="lm-tema"]').inputValue();
  const paleta = await pagina.locator('[data-prueba="lm-paleta"]').inputValue().catch(() => "");
  revisar(paleta === "bosque" && tema === "clasico", `colores desde la foto: el botón pone tema y paleta de La Mente (${tema} + ${paleta})`);
  const json = JSON.parse(await pagina.locator('[data-prueba="json"]').textContent());
  revisar(json.version === 2 && (await pagina.locator('[data-prueba="json"][data-valida]').count()) === 1, "el JSON del editor es una receta v2 válida");
  revisar(errores.length === 0, "colores desde la foto: sin errores" + (errores.length ? ": " + errores[0] : ""));
  await ctx.close();
}

await navegador.close();
console.log(fallas ? `\n${fallas} fallas` : "\nTodo bien");
process.exit(fallas ? 1 : 0);
