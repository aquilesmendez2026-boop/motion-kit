// Verifica la segunda tanda de momentos (los bloques que faltaban) en #momentos.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-momentos2.mjs [http://localhost:5173] [parte]`,
// donde la parte (opcional) es base, fechas, clases, novedades, enlaces, episodios, secciones, aviso, cinta, llamado o cierre.
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
/** La sección de la demo de una pieza. */
const seccion = (id) => `[data-prueba="${id}"]`;

/** Abre #momentos. `antes` recibe la página antes de cargar (para bloquear archivos o espiar). */
async function abrir(opciones = {}, antes) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  // Cuenta los cuadros de animación pedidos fuera de la medición de fluidez, para saber si algo sigue corriendo.
  await pagina.addInitScript(() => {
    window.__cuadrosEfectos = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (f) => {
      if (!new Error().stack.includes("/escena/nivel.ts")) window.__cuadrosEfectos++;
      return raf(f);
    };
  });
  if (antes) await antes(pagina);
  await pagina.goto(base + "/#momentos");
  await pagina.waitForSelector("[data-prueba=tanda-2]", { timeout: 8000 }).catch(() => {});
  return { ctx, pagina, errores };
}

/** Lleva una sección a la vista y espera a que su pieza arranque y termine de entrar. */
async function ver(pagina, id, espera = 1800) {
  await pagina.locator(seccion(id)).scrollIntoViewIfNeeded().catch(() => {});
  await pagina.waitForTimeout(espera);
}

/**
 * Un clic lento con el mouse (mover, apretar, esperar 150 ms, soltar): si lo apretado se mueve mientras tanto, el clic
 * se pierde. Devuelve cuántos clics recibió el elemento (sin navegar).
 */
async function clicLento(pagina, selector, donde = "centro") {
  const el = pagina.locator(selector).first();
  await el.evaluate((e) => {
    window.__clics = 0;
    e.addEventListener("click", (ev) => {
      ev.preventDefault();
      window.__clics++;
    });
  });
  const caja = await el.boundingBox();
  // Cerca de un borde es donde un elemento que se mueve se escapa del cursor. Van 12 px hacia adentro: la caja que
  // se mide es la que envuelve al elemento, y con un elemento girado (la tarjeta entra ladeada) su borde real queda
  // varios px más adentro que esa caja. A 3 px el punto podía caer fuera de la tarjeta.
  const y = donde === "arriba" ? caja.y + 12 : donde === "abajo" ? caja.y + caja.height - 12 : caja.y + caja.height / 2;
  await pagina.mouse.move(caja.x + caja.width / 2, y);
  await pagina.mouse.down();
  await pagina.waitForTimeout(150);
  await pagina.mouse.up();
  await pagina.waitForTimeout(100);
  return pagina.evaluate(() => window.__clics);
}

/**
 * Vuelve a montar la pieza de una sección (el botón «Repetir» de la vitrina): su entrada parte de nuevo. Antes deja
 * `alCentro` en medio de la pantalla, y aprieta el botón sin mover la página (un clic normal la correría hasta el botón).
 */
const repetir = (pagina, id, alCentro) =>
  pagina.evaluate(([q, c]) => {
    document.querySelector(c)?.scrollIntoView({ block: "center" });
    document.querySelector(`${q} .mom-repetir`).click();
  }, [seccion(id), alCentro ?? seccion(id)]);
/** Con el cursor encima de un elemento que está entrando: ¿sigue con su animación, pero detenida? */
async function alApuntar(pagina, selector) {
  const caja = await pagina.locator(selector).first().boundingBox();
  await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await pagina.waitForTimeout(60);
  const encima = await pagina.locator(selector).first().evaluate((e) => ({ nombre: getComputedStyle(e).animationName, estado: getComputedStyle(e).animationPlayState, apuntado: e.matches(":hover") }));
  await pagina.mouse.move(2, 2);
  await pagina.waitForTimeout(60);
  const fuera = await pagina.locator(selector).first().evaluate((e) => getComputedStyle(e).animationPlayState);
  return { ...encima, fuera };
}

/** El mismo selector, para pasarlo dentro de la página. */
const q_ = (s) => s;
/** Cuántos elementos de una sección tienen una animación CSS corriendo. */
const animados = (pagina, id) =>
  pagina.evaluate((q) => [...document.querySelectorAll(`${q} *`)].filter((e) => e.getAnimations().some((a) => a.playState === "running")).length, seccion(id));

// --- Base: si el archivo de una pieza no baja, queda el respaldo y la página sigue ---
if (parte("base")) {
  const { ctx, pagina, errores } = await abrir({}, (p) => p.route(/FechasQueVienen/, (r) => r.abort()));
  await ver(pagina, "fechas", 1200);
  const visto = await pagina.locator(seccion("fechas")).evaluate((e) => ({ respaldo: e.querySelector("[data-respaldo]") !== null, pieza: e.querySelector("[data-momento]") !== null })).catch(() => ({ respaldo: false, pieza: false }));
  revisar(visto.respaldo && !visto.pieza, `si el archivo de una pieza no baja, se ve el respaldo (${JSON.stringify(visto)})`);
  revisar(errores.length === 0, `y no hay errores de página${errores.length ? `: ${errores.join(" | ")}` : ""}`);
  await ctx.close();
}

/** La opacidad efectiva del texto que se lee en una sección (lo decorativo no cuenta). */
const opacidadTexto = (pagina, id) =>
  pagina.evaluate((q) =>
    [...document.querySelectorAll(`${q} .mk-momento :is(p, a, time, strong, summary, li, span)`)]
      .filter((e) => !e.closest("[aria-hidden=true]") && !e.classList.contains("mk-m-lector") && e.textContent.trim())
      .map((e) => {
        let o = 1;
        for (let n = e; n && n !== document.body; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return o;
      }), seccion(id));

// --- Fechas que vienen (calendario) ---
if (parte("fechas")) {
  {
    const { ctx, pagina, errores } = await abrir();
    await pagina.waitForSelector(`${seccion("fechas")} [data-momento=fechas]`, { timeout: 8000 }).catch(() => {});
    const antes = await opacidadTexto(pagina, "fechas");
    // Antes de verse, la raya del «cerrado» está escondida (corrida a la izquierda de su caja).
    const rayaAntes = await pagina.evaluate((q) => [...document.querySelectorAll(`${q} .mk-m-fechas-raya`)].map((r) => ["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(r).transform)), seccion("fechas"));
    revisar(antes.length >= 4 && antes.every((o) => o === 1), `antes de verse, las fechas ya se leen (${antes.length} textos, opacidad mínima ${Math.min(1, ...antes)})`);
    await ver(pagina, "fechas", 2600);
    const v = await pagina.locator(seccion("fechas")).evaluate((e) => {
      const m = e.querySelector("[data-momento=fechas]");
      const filas = [...m.querySelectorAll("li")];
      const hoy = m.querySelector("li[data-hoy]");
      const girada = (h) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(h).transform) || Number(getComputedStyle(h).opacity) < 1;
      return {
        filas: filas.length,
        hojas: m.querySelectorAll(".mk-m-hoja").length,
        hojasOcultas: [...m.querySelectorAll(".mk-m-hoja")].every((h) => h.closest("[aria-hidden=true]")),
        hoy: hoy ? { dia: hoy.querySelector(".mk-m-hoja-dia")?.textContent, texto: hoy.textContent } : null,
        rayas: m.querySelectorAll(".mk-m-fechas-raya").length,
        cerradas: [...m.querySelectorAll('li[data-tipo="cerrado"] .mk-m-fechas-raya')].map((r) => ({
          oculta: r.getAttribute("aria-hidden"),
          linea: getComputedStyle(r.firstElementChild).textDecorationLine,
          tinta: getComputedStyle(r.firstElementChild).color,
          puesta: ["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(r).transform) && ["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(r.firstElementChild).transform),
          mismoAncho: Math.abs(r.getBoundingClientRect().width - r.parentElement.getBoundingClientRect().width) < 1,
        })),
        activo: m.hasAttribute("data-activo"),
        giradas: [...m.querySelectorAll(".mk-m-hoja")].filter(girada).length,
      };
    });
    const diaHoy = String(Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", day: "2-digit" }).format(new Date())));
    revisar(v.filas === 4 && v.hojas === 4 && v.hojasOcultas, `una hoja de calendario por fecha, decorativa (${v.filas} filas, ${v.hojas} hojas)`);
    revisar(v.hoy && v.hoy.dia === diaHoy && /hoy/i.test(v.hoy.texto), `la de hoy queda marcada y dice «Hoy» (${JSON.stringify(v.hoy)}; hoy es ${diaHoy})`);
    const raya = v.cerradas[0];
    revisar(v.rayas === 1 && v.cerradas.length === 1 && raya.oculta === "true" && raya.linea.includes("line-through") && raya.tinta === "rgba(0, 0, 0, 0)" && raya.puesta && raya.mismoAncho && rayaAntes.length === 1 && rayaAntes[0] === false, `solo la fecha «cerrado» va tachada, con una raya que se dibuja al verse (antes escondida: ${JSON.stringify(rayaAntes)}; al final ${JSON.stringify(raya)})`);
    revisar(v.activo && v.giradas === 0 && (await animados(pagina, "fechas")) === 0, `al verse arranca y termina con las hojas derechas y quietas (${v.giradas} giradas)`);
    // Datos raros: una fecha que no existe sale sin hoja y sin romper; una lista vacía no dibuja nada.
    await ver(pagina, "fechas-bordes", 1200);
    const b = await pagina.evaluate(([q1, q2]) => {
      const m = document.querySelector(`${q1} [data-momento=fechas]`);
      return { filas: m?.querySelectorAll("li").length ?? -1, hojas: m?.querySelectorAll(".mk-m-hoja").length ?? -1, vacia: document.querySelector(`${q2} [data-momento]`) === null };
    }, [seccion("fechas-bordes"), seccion("fechas-vacia")]);
    revisar(b.filas === 2 && b.hojas === 1 && b.vacia, `una fecha que no existe sale sin hoja, y una lista vacía no dibuja nada (${JSON.stringify(b)})`);
    revisar(errores.length === 0, `sin errores con las fechas${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
    await pagina.waitForSelector(`${seccion("fechas")} [data-momento=fechas]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "fechas", 300);
    const q = await pagina.locator(seccion("fechas")).evaluate((e) => [...e.querySelectorAll(".mk-m-hoja")].map((h) => Number(getComputedStyle(h).opacity)));
    revisar(q.length === 4 && q.every((o) => o === 1) && (await animados(pagina, "fechas")) === 0, "con movimiento reducido las hojas están puestas y nada se anima");
    await ctx.close();
  }
}

// --- Clases de hoy ---
if (parte("clases")) {
  {
    const { ctx, pagina, errores } = await abrir();
    await pagina.waitForSelector(`${seccion("clases")} [data-momento=clases]`, { timeout: 8000 }).catch(() => {});
    const antes = await opacidadTexto(pagina, "clases");
    revisar(antes.length >= 6 && antes.every((o) => o === 1), `antes de verse, el horario ya se lee (${antes.length} textos)`);
    await ver(pagina, "clases", 1500);
    const v = await pagina.locator(seccion("clases")).evaluate((e) => {
      const m = e.querySelector("[data-momento=clases]");
      const late = (el) => el.getAnimations().some((a) => a.playState === "running");
      const fila = (texto) => [...m.querySelectorAll("li")].find((li) => li.textContent.includes(texto));
      const barra = (li) => li?.querySelector(".mk-m-clases-barra i");
      return {
        grupos: [...m.querySelectorAll(".mk-m-clases-grupo h3")].map((h) => h.textContent),
        proxima: [...m.querySelectorAll("li[data-proxima]")].map((li) => li.querySelector(".mk-m-clases-nombre").textContent),
        ultimoLate: late(fila("Pilates").querySelector(".mk-m-clases-cupos")),
        llenoLate: late(fila("Funcional").querySelector(".mk-m-clases-cupos")),
        barras: m.querySelectorAll(".mk-m-clases-barra").length,
        sinBarra: barra(fila("Yoga suave")) === null,
        ocupadoPilates: barra(fila("Pilates"))?.style.getPropertyValue("--ocupado"),
        textos: [...m.querySelectorAll(".mk-m-clases-cupos")].map((c) => c.textContent),
        activo: m.hasAttribute("data-activo"),
      };
    });
    revisar(v.grupos.join("|") === "Hoy|Mañana", `dos grupos, hoy y mañana (${v.grupos.join(", ")})`);
    revisar(v.proxima.length === 1 && v.proxima[0] === "Pilates", `la próxima clase del día va resaltada (${v.proxima.join(", ")})`);
    revisar(v.ultimoLate && !v.llenoLate, `«Queda 1» late y «Lleno» queda firme (late: ${v.ultimoLate}, lleno late: ${v.llenoLate})`);
    revisar(v.barras === 2 && v.sinBarra && v.ocupadoPilates === "0.9", `la barra aparece solo si viene el total de cupos, y marca lo ocupado (${v.barras} barras, Pilates ${v.ocupadoPilates})`);
    revisar(v.textos.includes("Quedan 3") && v.textos.includes("Queda 1") && v.textos.includes("Lleno · lista de espera") && v.textos.includes("Lleno") && v.activo, `los cupos van en texto (${v.textos.join(", ")})`);
    await ver(pagina, "clases-vacia", 800);
    const vacia = await pagina.locator(seccion("clases-vacia")).textContent();
    revisar(vacia.includes("No hay clases hoy ni mañana"), "sin clases, lo dice");
    revisar(errores.length === 0, `sin errores con las clases${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
    await pagina.waitForSelector(`${seccion("clases")} [data-momento=clases]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "clases", 400);
    revisar((await animados(pagina, "clases")) === 0, "con movimiento reducido nada late ni se anima en las clases");
    await ctx.close();
  }
}

// --- Clases: la página queda abierta y pasa la hora ---
if (parte("clases")) {
  // Son las 23:57:30 en Chile. La vitrina tiene clases hoy a las 23:58 y 23:59, y mañana a las 07:00 y 08:00.
  const { ctx, pagina, errores } = await abrir({ timezoneId: "America/Santiago" }, (p) => p.clock.install({ time: new Date("2026-11-24T02:57:30Z") }));
  await pagina.waitForSelector(`${seccion("clases")} [data-momento=clases]`, { timeout: 8000 }).catch(() => {});
  await ver(pagina, "clases", 600);
  const ahora = () =>
    pagina.locator(seccion("clases")).evaluate((e) => ({
      grupos: [...e.querySelectorAll(".mk-m-clases-grupo")].map((g) => `${g.querySelector("h3").textContent}: ${[...g.querySelectorAll(".mk-m-clases-nombre")].map((n) => n.textContent).join(", ")}`),
      proxima: [...e.querySelectorAll("li[data-proxima] .mk-m-clases-nombre")].map((n) => n.textContent).join(),
    }));
  const alAbrir = await ahora();
  await pagina.clock.fastForward("01:40");
  await pagina.waitForTimeout(200);
  const dosMinutosDespues = await ahora();
  await pagina.clock.fastForward("01:30");
  await pagina.waitForTimeout(200);
  const pasadaLaMedianoche = await ahora();
  revisar(alAbrir.proxima === "Pilates" && dosMinutosDespues.proxima === "Funcional", `con la página abierta, la «próxima» clase se pone al día (${alAbrir.proxima} → ${dosMinutosDespues.proxima})`);
  revisar(alAbrir.grupos.length === 2 && pasadaLaMedianoche.grupos.length === 1 && pasadaLaMedianoche.grupos[0].startsWith("Hoy: Yoga al amanecer") && pasadaLaMedianoche.proxima === "Yoga al amanecer", `pasada la medianoche, lo de «mañana» pasa a ser lo de «hoy» (${pasadaLaMedianoche.grupos.join(" | ")}; próxima: ${pasadaLaMedianoche.proxima})`);
  revisar(errores.length === 0, `sin errores al pasar la hora${errores.length ? `: ${errores.join(" | ")}` : ""}`);
  await ctx.close();
}

// --- Novedades que llegan ---
if (parte("novedades")) {
  {
    const { ctx, pagina, errores } = await abrir();
    await pagina.waitForSelector(`${seccion("novedades")} [data-momento=novedades]`, { timeout: 8000 }).catch(() => {});
    const antes = await opacidadTexto(pagina, "novedades");
    revisar(antes.length >= 3 && antes.every((o) => o === 1), `antes de verse, las novedades ya se leen (${antes.length} textos)`);
    // Se aprieta la primera tarjeta apenas empieza a entrar: el clic tiene que llegar igual.
    await ver(pagina, "novedades", 120);
    const clics = await clicLento(pagina, `${seccion("novedades")} a.mk-m-nov-tarjeta`);
    revisar(clics === 1, `un clic lento sobre una tarjeta que está entrando llega a su enlace (${clics} clic)`);
    // La tarjeta baja al entrar: apretada cerca de su borde de arriba se escaparía, si no se detuviera.
    await pagina.mouse.move(2, 2);
    await repetir(pagina, "novedades", `${seccion("novedades")} li:nth-child(2)`);
    const alBorde = await clicLento(pagina, `${seccion("novedades")} li:nth-child(2) a.mk-m-nov-tarjeta`, "arriba");
    await pagina.mouse.move(2, 2);
    await repetir(pagina, "novedades", `${seccion("novedades")} li:nth-child(3)`);
    const quieta = await alApuntar(pagina, `${seccion("novedades")} li:nth-child(3) a.mk-m-nov-tarjeta`);
    revisar(alBorde === 1 && quieta.apuntado && quieta.nombre === "mk-m-llega" && quieta.estado === "paused" && quieta.fuera === "running", `con el cursor encima la tarjeta se detiene donde va (no parte de nuevo) y el clic en su borde llega (${alBorde} clic; ${JSON.stringify(quieta)})`);
    await pagina.mouse.move(2, 2);
    await pagina.waitForTimeout(1800);
    const v = await pagina.locator(seccion("novedades")).evaluate((e) => {
      const m = e.querySelector("[data-momento=novedades]");
      const tarjetas = [...m.querySelectorAll(".mk-m-nov-tarjeta")];
      return {
        tarjetas: tarjetas.length,
        enlaces: tarjetas.filter((t) => t.tagName === "A" && t.getAttribute("href")).length,
        nuevas: tarjetas.map((t) => t.querySelector(".mk-m-nov-nuevo") !== null),
        fotos: tarjetas.map((t) => t.querySelector("img") !== null),
        fechas: tarjetas.map((t) => t.querySelector("time")?.textContent ?? ""),
        corridas: tarjetas.filter((t) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(t).transform)).length,
        activo: m.hasAttribute("data-activo"),
      };
    });
    revisar(v.tarjetas === 3 && v.enlaces === 3 && v.fechas.every((f) => / de /.test(f)), `una tarjeta por novedad, cada una es un enlace con su fecha (${v.fechas.join(", ")})`);
    revisar(v.nuevas.join() === "true,false,false", `solo la más nueva y reciente lleva «Nuevo» (${v.nuevas.join(", ")})`);
    revisar(v.fotos.join() === "true,false,true" , `sin foto, la tarjeta va sin imagen (${v.fotos.join(", ")})`);
    revisar(v.activo && v.corridas === 0 && (await animados(pagina, "novedades")) === 0, `al terminar quedan en su lugar y quietas (${v.corridas} corridas)`);
    await ver(pagina, "novedades-bordes", 1200);
    const b = await pagina.locator(seccion("novedades-bordes")).evaluate((e) => {
      const tarjetas = [...e.querySelectorAll(".mk-m-nov-tarjeta")];
      return { tarjetas: tarjetas.length, enlaces: tarjetas.filter((t) => t.tagName === "A").length, nuevas: e.querySelectorAll(".mk-m-nov-nuevo").length, peligro: e.querySelectorAll('a[href^="javascript"]').length };
    });
    revisar(b.tarjetas === 2 && b.enlaces === 1 && b.peligro === 0 && b.nuevas === 0, `un enlace inseguro no se dibuja como enlace, y una fecha futura no es «nueva» (${JSON.stringify(b)})`);
    revisar(errores.length === 0, `sin errores con las novedades${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
    await pagina.waitForSelector(`${seccion("novedades")} [data-momento=novedades]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "novedades", 300);
    revisar((await animados(pagina, "novedades")) === 0, "con movimiento reducido las novedades no se animan");
    await ctx.close();
  }
}

// --- Enlaces en dominó ---
if (parte("enlaces")) {
  {
    const { ctx, pagina, errores } = await abrir();
    await pagina.waitForSelector(`${seccion("enlaces")} [data-momento=enlaces]`, { timeout: 8000 }).catch(() => {});
    const antes = await opacidadTexto(pagina, "enlaces");
    revisar(antes.length >= 4 && antes.every((o) => o === 1), `antes de verse, los enlaces ya se leen (${antes.length} textos)`);
    await ver(pagina, "enlaces", 120);
    const clics = await clicLento(pagina, `${seccion("enlaces")} li:nth-child(2) a`);
    revisar(clics === 1, `un clic lento sobre un enlace que se está levantando llega (${clics} clic)`);
    // El enlace sube al levantarse: apretado cerca de su borde de abajo se escaparía, si no se detuviera.
    await pagina.mouse.move(2, 2);
    await repetir(pagina, "enlaces", `${seccion("enlaces")} li:nth-child(2)`);
    const alBorde = await clicLento(pagina, `${seccion("enlaces")} li:nth-child(2) a`, "abajo");
    await pagina.mouse.move(2, 2);
    await repetir(pagina, "enlaces", `${seccion("enlaces")} li:nth-child(4)`);
    const quieto = await alApuntar(pagina, `${seccion("enlaces")} li:nth-child(4) a`);
    revisar(alBorde === 1 && quieto.apuntado && quieto.nombre === "mk-m-domino" && quieto.estado === "paused" && quieto.fuera === "running", `con el cursor encima el enlace se detiene donde va (no parte de nuevo) y el clic en su borde llega (${alBorde} clic; ${JSON.stringify(quieto)})`);
    await pagina.mouse.move(2, 2);
    await pagina.waitForTimeout(1800);
    const v = await pagina.locator(seccion("enlaces")).evaluate((e) => {
      const m = e.querySelector("[data-momento=enlaces]");
      const as = [...m.querySelectorAll("a")];
      return {
        enlaces: as.length,
        seguros: as.filter((a) => a.target === "_blank" && a.rel.includes("noopener") && a.rel.includes("noreferrer") && /^https:/.test(a.href)).length,
        redes: as.map((a) => a.querySelector(".mk-m-enlace-red")?.textContent ?? ""),
        altos: as.map((a) => Math.round(a.getBoundingClientRect().height)),
        girados: as.filter((a) => !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(getComputedStyle(a).transform) || getComputedStyle(a).rotate !== "none").length,
        activo: m.hasAttribute("data-activo"),
      };
    });
    revisar(v.enlaces === 4 && v.seguros === 4, `un enlace por dato, que abre en otra pestaña de forma segura (${v.seguros} de ${v.enlaces})`);
    revisar(v.redes.join("|") === "YouTube|Spotify|Instagram|WhatsApp", `cada uno dice su red en texto (${v.redes.join(", ")})`);
    revisar(v.altos.every((h) => h >= 44), `cada botón mide 44 px o más de alto (${v.altos.join(", ")})`);
    revisar(v.activo && v.girados === 0 && (await animados(pagina, "enlaces")) === 0, `al terminar quedan derechos y quietos (${v.girados} girados)`);
    await ver(pagina, "enlaces-bordes", 1000);
    const b = await pagina.locator(seccion("enlaces-bordes")).evaluate((e) => ({ enlaces: e.querySelectorAll("a[target=_blank]").length, peligro: e.querySelectorAll('a[href^="javascript"]').length }));
    revisar(b.enlaces === 1 && b.peligro === 0, `una dirección insegura no se dibuja (${JSON.stringify(b)})`);
    revisar(errores.length === 0, `sin errores con los enlaces${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
    await pagina.waitForSelector(`${seccion("enlaces")} [data-momento=enlaces]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "enlaces", 300);
    revisar((await animados(pagina, "enlaces")) === 0, "con movimiento reducido los enlaces no se animan");
    await ctx.close();
  }
}

// --- Episodios con onda ---
if (parte("episodios")) {
  {
    const { ctx, pagina, errores } = await abrir();
    await pagina.waitForSelector(`${seccion("episodios")} [data-momento=episodios]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "episodios", 1200);
    const S = seccion("episodios");
    /** Cómo está cada episodio: si su onda dice que suena y si sus barras se animan. */
    const estado = () =>
      pagina.evaluate((q) => [...document.querySelectorAll(`${q} .mk-m-epi`)].map((li) => ({ suena: li.hasAttribute("data-suena"), anima: [...li.querySelectorAll(".mk-m-onda i")].some((b) => b.getAnimations().some((a) => a.playState === "running")) })), S);
    const tocar = (i, accion) => pagina.evaluate(async ([q, k, que]) => {
      const a = document.querySelectorAll(`${q} audio`)[k];
      a.muted = true;
      if (que === "play") await a.play().catch(() => {});
      else a.pause();
    }, [S, i, accion]);
    const armado = await pagina.locator(S).evaluate((e) => {
      const m = e.querySelector("[data-momento=episodios]");
      const audios = [...m.querySelectorAll("audio")];
      return { episodios: m.querySelectorAll(".mk-m-epi").length, audios: audios.length, controles: audios.every((a) => a.controls && a.preload === "none"), ondas: [...m.querySelectorAll(".mk-m-onda")].every((o) => o.getAttribute("aria-hidden") === "true" && o.children.length >= 20), datos: [...m.querySelectorAll(".mk-m-epi-datos")].map((d) => d.textContent) };
    });
    const nombres = await pagina.locator(S).evaluate((e) => [...e.querySelectorAll(".mk-m-epi")].map((li) => li.querySelector("audio").getAttribute("aria-label") === li.querySelector(".mk-m-epi-titulo").textContent));
    revisar(nombres.length === 3 && nombres.every(Boolean), "cada reproductor lleva el nombre de su episodio para lectores de pantalla");
    revisar(armado.episodios === 3 && armado.audios === 3 && armado.controles && armado.ondas, `cada episodio trae su reproductor y su onda decorativa (${JSON.stringify(armado)})`);
    revisar(armado.datos[0].includes("46 min") && armado.datos[1].includes("1 h 2 min"), `la duración va en palabras (${armado.datos.join(" | ")})`);
    const quieta = await estado();
    revisar(quieta.every((x) => !x.suena && !x.anima), "al inicio las ondas están quietas");
    await tocar(0, "play");
    await pagina.waitForTimeout(500);
    const sonando = await estado();
    revisar(sonando[0].suena && sonando[0].anima && !sonando[1].suena && !sonando[1].anima, `mientras suena un episodio, solo su onda se mueve (${JSON.stringify(sonando)})`);
    await tocar(1, "play");
    await pagina.waitForTimeout(500);
    const otro = await estado();
    revisar(!otro[0].suena && !otro[0].anima && otro[1].suena && otro[1].anima, `al sonar otro, el primero se detiene (${JSON.stringify(otro)})`);
    // Fuera de la vista la onda no se anima, aunque el audio siga.
    await pagina.evaluate(() => window.scrollTo(0, 0));
    await pagina.waitForTimeout(500);
    const lejos = await estado();
    revisar(lejos[1].suena && !lejos[1].anima, `fuera de la vista la onda no se anima (${JSON.stringify(lejos[1])})`);
    await ver(pagina, "episodios", 400);
    await tocar(1, "pause");
    await pagina.waitForTimeout(400);
    const pausado = await estado();
    revisar(pausado.every((x) => !x.suena && !x.anima), "al pausar, la onda se detiene");
    await ver(pagina, "episodios-bordes", 1000);
    await pagina.evaluate((q) => document.querySelector(`${q} audio`)?.play().catch(() => {}), seccion("episodios-bordes"));
    await pagina.waitForTimeout(500);
    revisar(errores.length === 0, `un audio que no carga no rompe la página${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
}

// --- Secciones con resorte ---
if (parte("secciones")) {
  {
    const { ctx, pagina, errores } = await abrir();
    await pagina.waitForSelector(`${seccion("secciones")} [data-momento=secciones]`, { timeout: 8000 }).catch(() => {});
    const antes = await opacidadTexto(pagina, "secciones");
    revisar(antes.length >= 8 && antes.every((o) => o === 1), `antes de verse, las secciones ya se leen (${antes.length} textos)`);
    await ver(pagina, "secciones", 1800);
    const S = seccion("secciones");
    const v = await pagina.locator(S).evaluate((e) => {
      const m = e.querySelector("[data-momento=secciones]");
      return {
        tipos: [...m.querySelectorAll("section[data-seccion]")].map((s) => s.dataset.seccion),
        conId: m.querySelectorAll("[id]").length,
        preguntas: m.querySelectorAll("details > summary").length,
        pasos: [...m.querySelectorAll(".mk-m-sec-numero")].map((n) => n.textContent),
        iniciales: [...m.querySelectorAll(".mk-m-sec-inicial")].map((n) => n.textContent),
        parrafos: m.querySelectorAll(".mk-m-sec-texto p").length,
      };
    });
    revisar(v.tipos.join("|") === "preguntas|pasos|equipo|texto" && v.conId === 0, `cada sección con su tipo y sin poner ids (los pone quien arma la página); las de tipo desconocido, también «constructor», no se dibujan (${v.tipos.join(", ")}; ${v.conId} ids)`);
    const sellos = await pagina.locator(S).evaluate((e) => [...e.querySelectorAll(".mk-m-sec-numero,.mk-m-sec-inicial")].map((x) => Number(getComputedStyle(x).opacity)));
    revisar(sellos.length === 5 && sellos.every((o) => o === 1), `los números y las iniciales terminan a la vista (${sellos.join(", ")})`);
    revisar(v.preguntas === 3 && v.pasos.join() === "01,02,03" && v.iniciales.join() === "C,M" && v.parrafos === 2, `preguntas en acordeón, pasos numerados, iniciales del equipo y párrafos (${JSON.stringify(v)})`);
    // Con teclado: Enter abre la pregunta y la respuesta queda a la vista.
    await pagina.locator(`${S} details summary`).first().focus();
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(900);
    const abierta = await pagina.locator(`${S} details`).first().evaluate((d) => ({ abierta: d.open, opacidad: Number(getComputedStyle(d.querySelector(".mk-m-sec-respuesta")).opacity), alto: d.querySelector(".mk-m-sec-respuesta").getBoundingClientRect().height }));
    revisar(abierta.abierta && abierta.opacidad === 1 && abierta.alto > 10, `con Enter se abre la pregunta y su respuesta queda a la vista (${JSON.stringify(abierta)})`);
    const clics = await clicLento(pagina, `${S} details:nth-of-type(2) summary`).catch(() => -1);
    revisar(clics === 1, `un clic lento sobre una pregunta le llega (${clics} clic)`);
    revisar(errores.length === 0, `sin errores con las secciones${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
    await pagina.waitForSelector(`${seccion("secciones")} [data-momento=secciones]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "secciones", 300);
    await pagina.locator(`${seccion("secciones")} details summary`).first().click();
    await pagina.waitForTimeout(150);
    revisar((await animados(pagina, "secciones")) === 0, "con movimiento reducido las secciones no se animan, tampoco al abrir una pregunta");
    await ctx.close();
  }
}

// --- Aviso que se despliega ---
if (parte("aviso")) {
  {
    const espiar = (p) => p.addInitScript(() => {
      // Anota cada texto distinto que muestra el aviso, con su hora.
      window.__aviso = [];
      new MutationObserver(() => {
        const t = document.querySelector('[data-prueba="aviso"] .mk-m-aviso-texto > [aria-hidden=true]');
        if (t && window.__aviso.at(-1)?.texto !== t.textContent) window.__aviso.push({ texto: t.textContent, t: performance.now() });
      }).observe(document, { subtree: true, childList: true, characterData: true });
    });
    const { ctx, pagina, errores } = await abrir({}, espiar);
    await pagina.waitForSelector(`${seccion("aviso")} [data-momento=aviso]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "aviso", 1600);
    const S = seccion("aviso");
    const FINAL = "Hoy cerramos a las 18:00 por inventario";
    const v = await pagina.locator(S).evaluate((e) => {
      const m = e.querySelector("[data-momento=aviso]");
      const t = m.querySelector(".mk-m-aviso-texto");
      const b = m.querySelector("button");
      return { tono: m.dataset.tono, texto: t.querySelector(":scope > [aria-hidden=true]")?.textContent, lectores: t.querySelector(":scope > .mk-m-lector")?.textContent, etiqueta: t.hasAttribute("aria-label"), boton: b?.getAttribute("aria-label"), lado: b ? Math.round(Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height)) : 0, enlace: m.querySelector("a")?.getAttribute("href"), confeti: m.querySelector(".mk-m-confeti") !== null };
    });
    const pasos = await pagina.evaluate(() => window.__aviso);
    const distintos = pasos.filter((x) => x.texto !== FINAL);
    const duro = pasos.length ? pasos.at(-1).t - pasos[0].t : -1;
    revisar(v.tono === "importante" && v.texto === FINAL && v.lectores === FINAL && !v.etiqueta, `el aviso termina con su texto; para lectores va aparte, en texto real y no en un aria-label del párrafo (${v.tono}; «${v.texto}»; lectores «${v.lectores}»)`);
    revisar(distintos.length >= 3 && duro > 0 && duro < 1000, `el texto se descifra en menos de un segundo (${distintos.length} cuadros distintos en ${Math.round(duro)} ms)`);
    revisar(v.boton === "Cerrar aviso" && v.lado >= 44 && v.enlace === "#momentos" && !v.confeti, `trae «Ver más» y un botón de cerrar de 44 px con nombre (${JSON.stringify(v)})`);
    const clics = await clicLento(pagina, `${S} [data-momento=aviso] a`);
    revisar(clics === 1, `un clic lento sobre «Ver más» llega (${clics} clic)`);
    // Cerrar con teclado: avisa a quien lo usa y la franja deja de dibujarse.
    await pagina.locator(`${S} [data-momento=aviso] button`).focus();
    await pagina.keyboard.press("Enter");
    await pagina.waitForTimeout(300);
    const cerrado = await pagina.locator(S).evaluate((e) => ({ pieza: e.querySelector("[data-momento=aviso]") !== null, aviso: e.querySelector("[data-prueba=aviso-cerrado]") !== null }));
    revisar(!cerrado.pieza && cerrado.aviso, `con Enter en «Cerrar» se avisa y la franja se va (${JSON.stringify(cerrado)})`);
    await ver(pagina, "aviso-celebracion", 600);
    const fiesta = await pagina.evaluate(([a, b]) => ({ celebra: document.querySelector(`${a} .mk-m-confeti`) !== null, info: document.querySelector(`${b} .mk-m-confeti`) !== null, sinEnlace: document.querySelector(`${b} [data-momento=aviso] a`) === null }), [seccion("aviso-celebracion"), seccion("aviso-info")]);
    revisar(fiesta.celebra && !fiesta.info && fiesta.sinEnlace, `solo el tono «celebración» suelta confeti, y un enlace inseguro no se dibuja (${JSON.stringify(fiesta)})`);
    // Una bandera o un corazón son varios códigos seguidos: cada uno queda entero en su letra.
    await pagina.waitForTimeout(1200);
    const letras = await pagina.evaluate((q) => [...document.querySelectorAll(`${q} .mk-tc-l`)].map((l) => l.textContent), seccion("aviso-celebracion"));
    revisar(letras.includes("🇨🇱") && letras.includes("❤️") && letras.every((l) => l.length > 0), `los emoji compuestos quedan enteros en el aviso (${letras.filter((l) => l.length > 1).join(" ")})`);
    revisar(errores.length === 0, `sin errores con el aviso${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
    await pagina.waitForSelector(`${seccion("aviso")} [data-momento=aviso]`, { timeout: 8000 }).catch(() => {});
    const t1 = await pagina.locator(`${seccion("aviso")} .mk-m-aviso-texto > [aria-hidden=true]`).textContent();
    await pagina.waitForTimeout(400);
    const t2 = await pagina.locator(`${seccion("aviso")} .mk-m-aviso-texto > [aria-hidden=true]`).textContent();
    revisar(t1 === t2 && t1 === "Hoy cerramos a las 18:00 por inventario" && (await animados(pagina, "aviso")) === 0 && (await pagina.locator(`${seccion("aviso-celebracion")} .mk-m-confeti`).count()) === 0, "con movimiento reducido el aviso está fijo desde el inicio y sin confeti");
    await ctx.close();
  }
}

// --- Cinta con impulso ---
if (parte("cinta")) {
  {
    const { ctx, pagina, errores } = await abrir();
    await pagina.waitForSelector(`${seccion("cinta")} [data-momento=cinta]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "cinta", 900);
    const S = seccion("cinta");
    /** Cuánto avanzó la cinta (px, sumando las vueltas) en `ms`, opcionalmente bajando la página mientras tanto. */
    const avance = (ms, bajar) =>
      pagina.evaluate(async ([q, cuanto, conScroll]) => {
        const pista = document.querySelector(`${q} .mk-m-cinta-pista`);
        const x = () => parseFloat(getComputedStyle(pista).translate) || 0;
        const mitad = pista.scrollWidth / 2;
        let total = 0;
        let antes = x();
        const fin = performance.now() + cuanto;
        while (performance.now() < fin) {
          if (conScroll) window.scrollBy(0, 20 * conScroll);
          await new Promise((ok) => requestAnimationFrame(ok));
          const ahora = x();
          let d = antes - ahora;
          if (d < -mitad / 2) d += mitad;
          if (d > mitad / 2) d -= mitad;
          total += d;
          antes = ahora;
        }
        return Math.round(total);
      }, [q_(S), ms, bajar ?? 0]);
    const armado = await pagina.locator(S).evaluate((e) => {
      const m = e.querySelector("[data-momento=cinta]");
      return { lector: m.querySelector(".mk-m-lector")?.textContent, pistaOculta: m.querySelector(".mk-m-cinta-pista")?.closest("[aria-hidden=true]") !== null, copias: m.querySelectorAll(".mk-m-cinta-pista span").length };
    });
    revisar(armado.lector === "Tostamos café todos los días" && armado.pistaOculta && armado.copias >= 4, `el lema va una vez para lectores y las copias son decoración (${JSON.stringify(armado)})`);
    const sola = await avance(500);
    revisar(sola > 8 && sola < 60, `sola, la cinta avanza a su paso (${sola} px en medio segundo)`);
    // Con el bloque al pie de la pantalla, para que siga a la vista mientras se baja.
    await pagina.evaluate((q) => document.querySelector(q).scrollIntoView({ block: "end" }), S);
    await pagina.waitForTimeout(1300);
    const bajando = await avance(500, 1);
    revisar(bajando > sola * 1.6, `al bajar la página, la cinta acelera (${bajando} px contra ${sola})`);
    await pagina.evaluate((q) => document.querySelector(q).scrollIntoView({ block: "center" }), S);
    await pagina.waitForTimeout(1500);
    const despues = await avance(500);
    revisar(Math.abs(despues - sola) <= Math.max(6, sola * 0.35), `un segundo y medio después de parar vuelve a su paso (${despues} px; antes ${sola})`);
    // Fuera de la vista no pide cuadros.
    await pagina.evaluate(() => window.scrollTo(0, 0));
    await pagina.waitForTimeout(600);
    const a = await pagina.evaluate(() => window.__cuadrosEfectos);
    await pagina.waitForTimeout(800);
    const pedidos = (await pagina.evaluate(() => window.__cuadrosEfectos)) - a;
    revisar(pedidos === 0, `fuera de la vista la cinta no pide cuadros (${pedidos})`);
    await ver(pagina, "cinta-quieta", 700);
    const quieta = await pagina.evaluate(([a1, b1]) => ({ pista: document.querySelector(`${a1} .mk-m-cinta-pista`) !== null, texto: document.querySelector(`${a1} [data-momento=cinta]`)?.textContent, vacia: document.querySelector(`${b1} [data-momento]`) === null }), [seccion("cinta-quieta"), seccion("cinta-vacia")]);
    revisar(!quieta.pista && quieta.texto === "Tostamos café todos los días" && quieta.vacia, `«quieta» muestra el lema una vez y sin moverse; sin lema no dibuja nada (${JSON.stringify(quieta)})`);
    // Un lema corto en un bloque ancho: cada mitad de la pista cubre el bloque entero (si no, asoma un hueco al dar la vuelta).
    // La tarjeta de la vitrina es angosta: se ensancha el bloque a mano, como en una página de escritorio.
    await ver(pagina, "cinta-corta", 400);
    await pagina.locator(`${seccion("cinta-corta")} [data-momento=cinta]`).evaluate((m) => (m.style.width = "1100px"));
    await pagina.waitForTimeout(500);
    const corta = await pagina.locator(seccion("cinta-corta")).evaluate((e) => {
      const m = e.querySelector("[data-momento=cinta]");
      const p = m.querySelector(".mk-m-cinta-pista");
      return { bloque: m.clientWidth, mitad: Math.round(p.scrollWidth / 2), copias: p.children.length, una: Math.round(p.firstElementChild.getBoundingClientRect().width) };
    });
    revisar(corta.mitad >= corta.bloque + corta.una - 1 && corta.copias > 8 && corta.copias % 2 === 0, `con un lema corto la cinta suma copias hasta cubrir el bloque (${JSON.stringify(corta)})`);
    revisar(errores.length === 0, `sin errores con la cinta${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
    await pagina.waitForSelector(`${seccion("cinta")} [data-momento=cinta]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "cinta", 500);
    const a = await pagina.evaluate(() => window.__cuadrosEfectos);
    await pagina.waitForTimeout(600);
    revisar((await pagina.evaluate(() => window.__cuadrosEfectos)) - a === 0 && (await pagina.locator(`${seccion("cinta")} .mk-m-cinta-pista`).count()) === 0, "con movimiento reducido la cinta queda quieta, con el lema una vez");
    await ctx.close();
  }
}

// --- Llamado con vida (los bloques que son un botón) ---
if (parte("llamado")) {
  const ESCENAS = ["agenda", "pedidos", "buzon", "cotizaciones", "encuestas", "contacto"];
  {
    const { ctx, pagina, errores } = await abrir();
    await pagina.waitForSelector(`${seccion("llamado")} [data-momento=llamado]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "llamado", 150);
    const S = seccion("llamado");
    // Mientras las escenas corren, el botón de al lado recibe el clic.
    const clics = await clicLento(pagina, `${S} [data-escena=buzon] a`);
    revisar(clics === 1, `mientras la escena corre, el botón de al lado recibe el clic (${clics} clic)`);
    await pagina.mouse.move(2, 2);
    await pagina.waitForTimeout(2800);
    const v = await pagina.locator(S).evaluate((e, escenas) => {
      const piezas = [...e.querySelectorAll("[data-momento=llamado]")];
      const corriendo = (p) => [...p.querySelectorAll("*")].filter((x) => x.getAnimations().some((a) => a.playState === "running")).length;
      return {
        escenas: piezas.map((p) => p.dataset.escena),
        svg: piezas.every((p) => p.querySelector("svg") !== null),
        decorativas: piezas.every((p) => p.getAttribute("aria-hidden") === "true" && getComputedStyle(p).pointerEvents === "none"),
        visibles: piezas.every((p) => Number(getComputedStyle(p.querySelector("svg")).opacity) === 1),
        corriendo: Object.fromEntries(piezas.map((p) => [p.dataset.escena, corriendo(p)])),
      };
    }, ESCENAS);
    revisar(v.escenas.join() === ESCENAS.join() && v.svg && v.decorativas && v.visibles, `las seis escenas se dibujan, son decoración y no reciben toques (${v.escenas.join(", ")})`);
    const quietas = ESCENAS.filter((x) => x !== "pedidos").every((x) => v.corriendo[x] === 0);
    revisar(quietas && v.corriendo.pedidos >= 1, `al terminar quedan quietas, salvo el punto de «pedidos abierto», que late (${JSON.stringify(v.corriendo)})`);
    // El punto primero aparece (a los 380 ms) y recién después late (a los 1200): cada animación con su espera.
    const esperas = await pagina.locator(`${S} [data-escena=pedidos] .mk-ll-late`).evaluate((c) => getComputedStyle(c).animationDelay);
    revisar(esperas === "0.38s, 1.2s", `el punto de «abierto» aparece y después late (esperas: ${esperas})`);
    await ver(pagina, "llamado-bordes", 2600);
    const b = await pagina.locator(seccion("llamado-bordes")).evaluate((e) => ({ piezas: [...e.querySelectorAll("[data-momento=llamado]")].map((p) => p.dataset.escena), corriendo: [...e.querySelectorAll("[data-momento=llamado] *")].filter((x) => x.getAnimations().some((a) => a.playState === "running")).length }));
    revisar(b.piezas.join() === "pedidos" && b.corriendo === 0, `con «pedidos» cerrado no hay latido, y una escena desconocida no dibuja nada (${JSON.stringify(b)})`);
    revisar(errores.length === 0, `sin errores con el llamado${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir({ reducedMotion: "reduce" });
    await pagina.waitForSelector(`${seccion("llamado")} [data-momento=llamado]`, { timeout: 8000 }).catch(() => {});
    await ver(pagina, "llamado", 300);
    const q = await pagina.locator(seccion("llamado")).evaluate((e) => [...e.querySelectorAll("[data-momento=llamado] svg")].map((x) => Number(getComputedStyle(x).opacity)));
    // «Terminadas» de verdad: la tapa del sobre queda abierta (dada vuelta hacia arriba) sin depender de la animación.
    const tapa = await pagina.locator(`${seccion("llamado")} [data-escena=buzon] .mk-ll-abre`).evaluate((t) => getComputedStyle(t).transform);
    revisar(q.length === 6 && q.every((o) => o === 1) && (await animados(pagina, "llamado")) === 0 && tapa === "matrix(1, 0, 0, -1, 0, 0)", `con movimiento reducido las escenas están terminadas y quietas, con el sobre abierto (tapa: ${tapa})`);
    await ctx.close();
  }
}

// --- Cierre: al salir no queda nada vivo, a 360 px nada se sale de lado y, antes de bajar, todo se lee ---
if (parte("cierre")) {
  /** Un encabezado sin nada que se mueva: ahí cualquier cuadro pedido es de algo que quedó vivo. */
  const QUIETA = "#vista?d=" + Buffer.from(JSON.stringify({ estilo: "pelicula", titulo: "Nada se mueve", entrada: "ninguna" })).toString("base64url");
  /** Lleva la cuenta de los oyentes puestos en el documento y la ventana, y de los observadores activos (igual que `verificar-dedo`). */
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
  /** Lo que hay en `despues` y no estaba en `antes` (con repetidos). */
  const sobran = (antes, despues) => {
    const quedan = [...antes];
    return despues.filter((x) => {
      const i = quedan.indexOf(x);
      if (i < 0) return true;
      quedan.splice(i, 1);
      return false;
    });
  };
  const ir = async (pagina, ruta, espera) => {
    await pagina.evaluate((r) => (location.hash = r), ruta);
    await pagina.waitForTimeout(espera);
  };
  /** Baja la página entera de a poco (cada pieza alcanza a verse y arrancar) y vuelve arriba. */
  const recorrer = async (pagina, paso = 500, espera = 110) => {
    const alto = await pagina.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < alto; y += paso) {
      await pagina.evaluate((v) => window.scrollTo(0, v), y);
      await pagina.waitForTimeout(espera);
    }
  };
  const medir = async (pagina) => {
    const a = await pagina.evaluate(() => window.__cuadrosEfectos);
    await pagina.mouse.move(300, 300);
    await pagina.mouse.move(760, 420, { steps: 8 });
    await pagina.mouse.wheel(0, 500);
    await pagina.waitForTimeout(150);
    await pagina.mouse.wheel(0, -500);
    await pagina.waitForTimeout(800);
    const cuadros = (await pagina.evaluate(() => window.__cuadrosEfectos)) - a;
    return { cuadros, ...(await pagina.evaluate(() => ({ piezas: document.querySelectorAll("[data-momento]").length, lienzos: document.querySelectorAll("canvas").length, vivos: window.__vivos() }))) };
  };
  {
    const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
    const pagina = await ctx.newPage();
    const errores = [];
    pagina.on("pageerror", (e) => errores.push(e.message));
    await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
    await pagina.addInitScript(() => {
      window.__cuadrosEfectos = 0;
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (f) => {
        if (!new Error().stack.includes("/escena/nivel.ts")) window.__cuadrosEfectos++;
        return raf(f);
      };
    });
    await pagina.addInitScript(contarOyentes);
    await pagina.goto(base + "/" + QUIETA);
    await pagina.waitForSelector(".mk-enc", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(2500);
    const antes = await medir(pagina);
    revisar(antes.cuadros <= 2 && antes.piezas === 0, `la vista quieta de partida no pide cuadros (${antes.cuadros} cuadros, ${antes.piezas} piezas)`);
    for (const vuelta of ["primera", "segunda"]) {
      await ir(pagina, "#momentos", 600);
      await pagina.waitForSelector("[data-prueba=tanda-2] [data-momento=cinta]", { timeout: 8000 }).catch(() => {});
      await recorrer(pagina);
      // Con la cinta a la vista (su bucle corriendo), se sale.
      await pagina.evaluate(() => document.querySelector("[data-prueba=cinta]").scrollIntoView({ block: "center" }));
      await pagina.waitForTimeout(500);
      const dentro = await pagina.evaluate(() => ({ piezas: document.querySelectorAll("[data-prueba=tanda-2] [data-momento]").length, a: window.__cuadrosEfectos }));
      await pagina.waitForTimeout(400);
      const corre = (await pagina.evaluate(() => window.__cuadrosEfectos)) - dentro.a;
      revisar(dentro.piezas >= 20 && corre > 5, `${vuelta} entrada: las piezas están y la cinta corre (${dentro.piezas} piezas, ${corre} cuadros)`);
      await ir(pagina, QUIETA, 1500);
      const fuera = await medir(pagina);
      const quedaron = sobran(antes.vivos, fuera.vivos);
      revisar(fuera.cuadros <= 2 && fuera.piezas === 0 && fuera.lienzos === antes.lienzos, `${vuelta} salida: no quedan bucles, piezas ni lienzos (${fuera.cuadros} cuadros, ${fuera.piezas} piezas, ${fuera.lienzos} lienzos)`);
      revisar(quedaron.length === 0, `${vuelta} salida: no quedan oyentes ni observadores${quedaron.length ? `: ${quedaron.join(", ")}` : ""}`);
    }
    revisar(errores.length === 0, `sin errores al entrar y salir${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    // A 360 px: ninguna pieza se sale de su tarjeta ni de la pantalla, antes y después de activarse.
    const ANCHO = 360;
    const { ctx, pagina, errores } = await abrir({ viewport: { width: ANCHO, height: 780 }, isMobile: true, hasTouch: true });
    await pagina.waitForSelector("[data-prueba=tanda-2] [data-momento=cinta]", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(600);
    // Antes de bajar (nada se ha visto todavía, salvo lo de más arriba): todo el texto de las piezas nuevas se lee.
    const textos = await pagina.evaluate(() =>
      [...document.querySelectorAll("[data-prueba=tanda-2] .mk-momento :is(p, a, time, strong, summary, li, span, h3, button)")]
        .filter((e) => !e.closest("[aria-hidden=true]") && !e.classList.contains("mk-m-lector") && !e.closest(".mk-m-lector") && e.textContent.trim())
        .map((e) => {
          let o = 1;
          for (let n = e; n && n !== document.body; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
          return { o, pieza: e.closest("[data-momento]")?.getAttribute("data-momento"), texto: e.textContent.trim().slice(0, 30) };
        }),
    );
    const apagados = textos.filter((t) => t.o < 1);
    revisar(textos.length > 60 && apagados.length === 0, `antes de bajar, todo el texto de las piezas nuevas se lee (${textos.length} textos${apagados.length ? `; apagados: ${JSON.stringify(apagados.slice(0, 4))}` : ""})`);
    const sobras = async () =>
      pagina.evaluate((ancho) => {
        const malas = [];
        for (const m of document.querySelectorAll("[data-prueba=tanda-2] [data-momento]")) {
          const r = m.getBoundingClientRect();
          const tarjeta = m.closest("[data-prueba]").getBoundingClientRect();
          // La cinta recorta su pista a propósito: de ella solo se mira la caja.
          const adentro = m.getAttribute("data-momento") === "cinta" ? 0 : m.scrollWidth - m.clientWidth;
          if (r.right > ancho + 0.5 || r.left < -0.5 || r.right > tarjeta.right + 0.5 || adentro > 1) malas.push(`${m.getAttribute("data-momento")} (derecha ${Math.round(r.right)}, sobra adentro ${adentro})`);
        }
        return { malas, pagina: document.documentElement.scrollWidth - ancho };
      }, ANCHO);
    const alInicio = await sobras();
    await pagina.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 380) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 110));
      }
    });
    await pagina.waitForTimeout(1200);
    const alFinal = await sobras();
    revisar(alInicio.malas.length === 0 && alFinal.malas.length === 0 && alInicio.pagina <= 0 && alFinal.pagina <= 0, `a 360 px ninguna pieza nueva se sale de lado (${[...alInicio.malas, ...alFinal.malas].join("; ") || "todas adentro"}; la página sobra ${alInicio.pagina} y ${alFinal.pagina})`);
    revisar(errores.length === 0, `sin errores a 360 px${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
}

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
