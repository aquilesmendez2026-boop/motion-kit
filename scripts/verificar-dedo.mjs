// Verifica los efectos de «dedo y física»: cartas apiladas, texto que se descifra, letras con imán, letrero colgante,
// inclinación por velocidad, objetos que caen, constelación, estela y chispas, y que nada quede vivo al salir.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-dedo.mjs [http://localhost:5173] [parte]`,
// donde la parte (opcional) es pila, descifrar, iman, colgante, impulso, caida, constelacion, fondos, estela, limpieza,
// sinlienzo o angosto.
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

/** Abre una ruta de la demo. `antes` corre en la página antes de cargar (para contar cuadros, por ejemplo). */
async function abrir(hash, { opciones = {}, antes } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 860 }, ...opciones });
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));
  pagina.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  await pagina.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
  // Cuenta los cuadros de animación pedidos, para saber si algo sigue corriendo.
  await pagina.addInitScript(() => {
    window.__cuadros = 0;
    window.__cuadrosEfectos = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (f) => {
      window.__cuadros++;
      // Aparte, sin la medición de fluidez: el medidor del editor (en #vista) mide siempre, a propósito.
      if (!new Error().stack.includes("/escena/nivel.ts")) window.__cuadrosEfectos++;
      return raf(f);
    };
  });
  for (const guion of [antes].flat().filter(Boolean)) await pagina.addInitScript(guion);
  await pagina.goto(base + "/" + hash);
  return { ctx, pagina, errores };
}
/** La vista de un encabezado suelto (la misma del QR del editor), con la receta que se le pase. */
const vista = (config) => "#vista?d=" + Buffer.from(JSON.stringify({ estilo: "pelicula", titulo: "Café *Luna*", ...config })).toString("base64url");
/** La página sola (como la ve la gente), con lo que se le pida a la receta de página. */
const paginaSola = (extra = {}) => "#pagina?d=" + Buffer.from(JSON.stringify({ version: 1, encabezado: { version: 2, estilo: "neon", titulo: "Smash *burgers*" }, ...extra })).toString("base64url");
/** Cuántos cuadros piden los efectos en un segundo (sin contar la medición de fluidez). */
async function cuadrosDeEfectos(pagina) {
  const a = await pagina.evaluate(() => window.__cuadrosEfectos);
  await pagina.waitForTimeout(1000);
  return (await pagina.evaluate(() => window.__cuadrosEfectos)) - a;
}
/** Cuántos cuadros de animación se piden en un segundo. */
async function cuadrosPorSegundo(pagina) {
  const a = await pagina.evaluate(() => window.__cuadros);
  await pagina.waitForTimeout(1000);
  return (await pagina.evaluate(() => window.__cuadros)) - a;
}

// --- 1. Cartas apiladas (relato «pila») ---
if (parte("pila")) {
  const T = '[data-telefono="p-pila"]';
  /** Dónde está cada bloque del teléfono (respecto del borde de arriba del teléfono) y cómo está su interior. */
  const bloques = (pagina) =>
    pagina.evaluate((t) => {
      const tel = document.querySelector(t);
      const r = tel.getBoundingClientRect();
      return [...tel.querySelectorAll(".mk-relato")].map((b) => {
        const q = b.getBoundingClientRect();
        const inn = getComputedStyle(b.querySelector(".mk-relato-in"));
        return { top: Math.round(q.top - r.top - tel.clientTop), alto: Math.round(q.height), baja: b.offsetTop, pos: getComputedStyle(b).position, escala: inn.scale === "none" ? 1 : Number(inn.scale), opacidad: Number(inn.opacity) };
      });
    }, T);
  const bajar = async (pagina, y) => {
    await pagina.evaluate(([t, v]) => (document.querySelector(t).scrollTop = v), [T, y]);
    await pagina.waitForTimeout(250);
  };
  {
    const { ctx, pagina, errores } = await abrir("#relatos");
    await pagina.waitForSelector(`${T} .mk-relato[data-pila][data-pila-sig]`, { timeout: 8000 }).catch(() => {});
    await pagina.locator(T).scrollIntoViewIfNeeded();
    const alto = await pagina.evaluate((t) => document.querySelector(t).scrollHeight, T);
    const quieto = await bloques(pagina);
    // Con el bloque 2 a medio tapar el 1: el 1 sigue pegado arriba y su interior ya se achicó algo.
    await bajar(pagina, quieto[1].baja - Math.round(quieto[0].alto / 2));
    const medio = await bloques(pagina);
    revisar(medio[0].pos === "sticky" && medio[0].top === 0 && medio[1].top > 0 && medio[1].top < medio[0].alto, `el bloque tapado queda pegado arriba mientras el siguiente sube (arriba ${medio[0].top}, siguiente en ${medio[1].top})`);
    revisar(medio[0].escala < 1 && medio[0].escala > 0.94 && medio[0].opacidad < 1, `a medio tapar, el bloque ya se achicó algo (escala ${medio[0].escala}, opacidad ${medio[0].opacidad})`);
    // Tapado entero: llega a su mínimo.
    await bajar(pagina, quieto[1].baja);
    const tapado = await bloques(pagina);
    revisar(Math.abs(tapado[0].escala - 0.94) < 0.005 && Math.abs(tapado[0].opacidad - 0.65) < 0.01, `tapado entero, queda en 0,94 y 0,65 (escala ${tapado[0].escala}, opacidad ${tapado[0].opacidad})`);
    // Foco en un bloque tapado: se despega y lo enfocado se ve.
    const visto = await pagina.evaluate((t) => {
      const p = document.querySelector(`${t} .mk-relato p`);
      p.tabIndex = 0;
      p.focus();
      const r = p.getBoundingClientRect();
      const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { esEl: arriba === p || p.contains(arriba), pos: getComputedStyle(p.closest(".mk-relato")).position };
    }, T);
    revisar(visto.esEl && visto.pos === "relative", `con el foco en un bloque tapado, el bloque se despega y lo enfocado se ve (${visto.pos})`);
    await pagina.evaluate(() => document.activeElement?.blur());
    // Un bloque más alto que el teléfono se recorre entero antes de quedar pegado.
    await pagina.evaluate((t) => (document.querySelectorAll(`${t} .mk-relato`)[2].style.minHeight = "900px"), T);
    await pagina.waitForTimeout(300);
    const conAlto = await bloques(pagina);
    const vista = await pagina.evaluate((t) => document.querySelector(t).clientHeight, T);
    await bajar(pagina, conAlto[3].baja - vista);
    const alPie = await bloques(pagina);
    await bajar(pagina, conAlto[3].baja - vista + 180);
    const despues = await bloques(pagina);
    revisar(Math.abs(alPie[2].top + alPie[2].alto - vista) <= 2 && Math.abs(despues[2].top + despues[2].alto - vista) <= 2 && despues[3].top < vista - 100, `un bloque más alto que la pantalla se ve hasta su pie y ahí queda pegado (pie en ${alPie[2].top + alPie[2].alto} y ${despues[2].top + despues[2].alto} de ${vista})`);
    // No alarga la página: mide lo mismo que sin pegarse.
    await pagina.evaluate((t) => (document.querySelectorAll(`${t} .mk-relato`)[2].style.minHeight = ""), T);
    await pagina.waitForTimeout(300);
    const sinPegar = await pagina.evaluate((t) => {
      const tel = document.querySelector(t);
      tel.querySelectorAll(".mk-relato").forEach((b) => (b.style.position = "relative"));
      const h = tel.scrollHeight;
      tel.querySelectorAll(".mk-relato").forEach((b) => (b.style.position = ""));
      return h;
    }, T);
    revisar(Math.abs(alto - sinPegar) <= 1, `las cartas apiladas no alargan la página (${alto} y ${sinPegar} px)`);
    revisar(errores.length === 0, `sin errores con las cartas apiladas${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    // Con el respaldo (navegador sin scroll nativo) nada queda pegado.
    await pagina.locator('[data-prueba="respaldo"]').check();
    await pagina.waitForTimeout(500);
    revisar((await bloques(pagina)).every((b) => b.pos !== "sticky"), "con el respaldo sin scroll nativo, ningún bloque queda pegado");
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir("#relatos", { opciones: { reducedMotion: "reduce" } });
    await pagina.waitForSelector(`${T} .mk-relato`);
    await pagina.waitForTimeout(800);
    revisar((await bloques(pagina)).every((b) => b.pos !== "sticky" && b.escala === 1), "con movimiento reducido, ningún bloque queda pegado ni achicado");
    await ctx.close();
  }
}

// --- 1b. Cartas apiladas: un clic con el mouse en una carta pegada llega a su enlace ---
if (parte("pila")) {
  const T = '[data-telefono="p-pila"]';
  const { ctx, pagina } = await abrir("#relatos");
  await pagina.waitForSelector(`${T} .mk-relato[data-pila][data-pila-sig]`, { timeout: 8000 }).catch(() => {});
  await pagina.locator(T).scrollIntoViewIfNeeded();
  // Un enlace arriba del primer bloque, que cuenta sus clics.
  await pagina.evaluate((t) => {
    const b = document.querySelector(`${t} .mk-relato .mk-relato-in`);
    b.insertAdjacentHTML("afterbegin", '<a href="#relatos" data-prueba="enlace-pila" style="display:inline-block;padding:10px 14px">Reservar</a>');
    window.__clics = 0;
    b.querySelector("[data-prueba=enlace-pila]").addEventListener("click", (e) => {
      e.preventDefault();
      window.__clics++;
    });
  }, T);
  await pagina.waitForTimeout(400);
  // El segundo bloque ya tapa la mitad del primero, que sigue pegado arriba.
  await pagina.evaluate((t) => {
    const tel = document.querySelector(t);
    const [a, b] = tel.querySelectorAll(".mk-relato");
    tel.scrollTop = b.offsetTop - Math.round(a.offsetHeight / 2);
  }, T);
  await pagina.waitForTimeout(300);
  const donde = () => pagina.evaluate((t) => {
    const e = document.querySelector(`${t} [data-prueba=enlace-pila]`);
    const r = e.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, pos: getComputedStyle(e.closest(".mk-relato")).position };
  }, T);
  const antes = await donde();
  await pagina.mouse.move(antes.x, antes.y);
  await pagina.mouse.down();
  await pagina.waitForTimeout(150);
  const apretado = await donde();
  await pagina.mouse.up();
  await pagina.waitForTimeout(150);
  const clics = await pagina.evaluate(() => window.__clics);
  revisar(clics === 1 && apretado.pos === "sticky" && Math.abs(apretado.y - antes.y) < 2, `un clic con el mouse en una carta pegada llega a su enlace y la carta no salta (${clics} clic; ${apretado.pos}; se corrió ${Math.round(apretado.y - antes.y)} px al apretar)`);
  // Con el teclado sí se despega: lo enfocado nunca queda tapado.
  await pagina.locator(`${T} [data-prueba=enlace-pila]`).focus();
  await pagina.keyboard.press("Tab");
  await pagina.keyboard.press("Shift+Tab");
  await pagina.waitForTimeout(150);
  const conTeclado = await pagina.evaluate((t) => {
    const e = document.querySelector(`${t} [data-prueba=enlace-pila]`);
    return { enfocado: document.activeElement === e, pos: getComputedStyle(e.closest(".mk-relato")).position };
  }, T);
  revisar(conTeclado.enfocado && conTeclado.pos === "relative", `con el foco del teclado la carta se despega (${JSON.stringify(conTeclado)})`);
  await ctx.close();
}

// --- 2. Texto que se descifra ---
if (parte("descifrar")) {
  const TITULO = "Ñandú & *Café* 100%";
  const FINAL = "Ñandú & Café 100%";
  /** Anota cada texto distinto que muestra el título y su ancho en ese momento. */
  const espiarTitulo = () => {
    window.__titulo = [];
    const anotar = () => {
      const t = document.querySelector(".mk-enc-titulo");
      if (!t) return;
      const texto = t.textContent;
      if (window.__titulo.at(-1)?.texto !== texto) window.__titulo.push({ texto, ancho: t.getBoundingClientRect().width });
    };
    new MutationObserver(anotar).observe(document, { subtree: true, childList: true, characterData: true });
  };
  {
    const { ctx, pagina, errores } = await abrir(vista({ titulo: TITULO, efectoTexto: "descifrar" }), { antes: espiarTitulo });
    await pagina.waitForSelector(".mk-enc-titulo");
    // Se espera a que el título llegue a su texto (con el computador cargado tarda más que un tiempo fijo), con tope.
    await pagina.waitForFunction((fin) => window.__titulo?.at(-1)?.texto === fin && window.__titulo.length > 3, FINAL, { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(300);
    const vistos = await pagina.evaluate(() => window.__titulo);
    const letras = (t) => Array.from(t).length;
    const distintos = vistos.filter((v) => v.texto !== FINAL);
    revisar(distintos.length > 3 && vistos.at(-1).texto === FINAL, `el título pasa por signos y termina en el texto (${distintos.length} cuadros distintos; termina en «${vistos.at(-1)?.texto}»)`);
    revisar(vistos.every((v) => letras(v.texto) === letras(FINAL)), "mientras se descifra tiene siempre las mismas letras");
    const anchos = vistos.map((v) => v.ancho);
    revisar(Math.max(...anchos) - Math.min(...anchos) <= 1, `el ancho del título no cambia mientras se descifra (${(Math.max(...anchos) - Math.min(...anchos)).toFixed(2)} px)`);
    revisar((await pagina.locator(".mk-enc-titulo").getAttribute("aria-label")) === FINAL, "para lectores de pantalla el texto es siempre el completo");
    revisar(errores.length === 0, `sin errores al descifrar${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    // Si el título cambia mientras se descifra (alguien lo corrige en el editor), termina mostrando el texto nuevo.
    const { ctx, pagina } = await abrir(vista({ titulo: "Casa Luna abierta", efectoTexto: "descifrar" }));
    await pagina.waitForSelector(".mk-enc-titulo .mk-tc-l");
    // Se espera a que de verdad esté descifrando (ya hay signos) y ahí se cambia.
    await pagina.waitForFunction(() => document.querySelector(".mk-enc-titulo").textContent !== "Casa Luna abierta", null, { timeout: 5000 }).catch(() => {});
    await pagina.evaluate((r) => (location.hash = r), vista({ titulo: "Cafe Lupa abierto", efectoTexto: "descifrar" }));
    await pagina.waitForTimeout(2800);
    const visto = await pagina.locator(".mk-enc-titulo").evaluate((e) => ({ texto: e.textContent, lectores: e.getAttribute("aria-label") }));
    revisar(visto.texto === "Cafe Lupa abierto" && visto.lectores === "Cafe Lupa abierto", `si el título cambia a mitad del descifrado, queda el texto nuevo (se ve «${visto.texto}»)`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir(vista({ titulo: TITULO, efectoTexto: "descifrar" }), { antes: espiarTitulo, opciones: { reducedMotion: "reduce" } });
    await pagina.waitForSelector(".mk-enc-titulo");
    await pagina.waitForTimeout(1500);
    const vistos = await pagina.evaluate(() => window.__titulo);
    revisar(vistos.length > 0 && vistos.every((v) => v.texto === FINAL), "con movimiento reducido el título no cambia");
    await ctx.close();
  }
}

// --- 3. Letras con imán ---
if (parte("iman")) {
  const TITULO = "Ñandú & Café ☕";
  /** Cuántas letras del título están corridas de su lugar (el imán las corre con `translate` puesto en línea). */
  const corridas = (pagina) =>
    pagina.evaluate(() => [...document.querySelectorAll(".mk-enc-titulo :is(.mk-tc-l, .mk-tc-g)")].filter((l) => l.style.translate !== "" && !["0px", "0px 0px"].includes(l.style.translate)).length);
  const alTitulo = async (pagina) => {
    const r = await pagina.locator(".mk-enc-titulo").boundingBox();
    await pagina.mouse.move(r.x + r.width * 0.3, r.y + r.height * 0.5);
    await pagina.mouse.move(r.x + r.width * 0.5, r.y + r.height * 0.5, { steps: 8 });
    await pagina.waitForTimeout(200);
  };
  {
    const { ctx, pagina, errores } = await abrir(vista({ titulo: TITULO, iman: true }));
    await pagina.waitForSelector(".mk-enc-titulo .mk-tc-l");
    await pagina.waitForTimeout(2200);
    await alTitulo(pagina);
    const cerca = await corridas(pagina);
    revisar(cerca > 0, `con el cursor encima, las letras se apartan (${cerca} corridas)`);
    // Con el cursor quieto encima, las letras quedan apartadas pero ya no se calcula nada.
    await pagina.waitForTimeout(1500);
    const quietoEncima = await cuadrosDeEfectos(pagina);
    revisar(quietoEncima === 0 && (await corridas(pagina)) > 0, `con el cursor quieto sobre el título deja de calcular (${quietoEncima} cuadros pedidos en un segundo; ${await corridas(pagina)} letras siguen apartadas)`);
    await pagina.mouse.move(4, 4);
    await pagina.waitForTimeout(1800);
    const lejos = await corridas(pagina);
    revisar(lejos === 0, `sin el cursor, todas vuelven a su lugar (${lejos} corridas)`);
    revisar((await pagina.locator(".mk-enc-titulo").getAttribute("aria-label")) === TITULO, "el texto para lectores de pantalla no cambia");
    await pagina.waitForTimeout(400);
    const enReposo = await cuadrosDeEfectos(pagina);
    revisar(enReposo === 0, `en reposo no queda calculando por su cuenta (${enReposo} cuadros pedidos en un segundo)`);
    revisar(errores.length === 0, `sin errores con el imán${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    // Con los efectos de título que van por palabra (el del estilo película o anime), el imán igual mueve letras.
    const { ctx, pagina } = await abrir(vista({ estilo: "anime", titulo: "Patitas felices", efectoTexto: "impacto", iman: true }));
    await pagina.waitForSelector(".mk-enc-titulo .mk-tc-l");
    await pagina.waitForTimeout(2600);
    await alTitulo(pagina);
    const letras = await pagina.evaluate(() => {
      const movidas = [...document.querySelectorAll(".mk-enc-titulo :is(.mk-tc-l, .mk-tc-g)")].filter((l) => l.style.translate !== "" && !["0px", "0px 0px"].includes(l.style.translate));
      return { movidas: movidas.length, deUnaLetra: movidas.filter((l) => Array.from(l.textContent).length === 1).length, distintas: new Set(movidas.map((l) => l.style.translate)).size };
    });
    revisar(letras.deUnaLetra >= 3 && letras.deUnaLetra === letras.movidas && letras.distintas >= 3, `con un efecto de título por palabra, el imán mueve letras y no palabras enteras (${JSON.stringify(letras)})`);
    await ctx.close();
  }
  {
    // Si el título cambió de lugar desde que se midió (cargó la fuente, terminó una entrada larga), al despertar mide de nuevo.
    const { ctx, pagina } = await abrir(vista({ titulo: TITULO, iman: true }));
    await pagina.waitForSelector(".mk-enc-titulo .mk-tc-l");
    await pagina.waitForTimeout(2200);
    await pagina.evaluate(() => (document.querySelector(".mk-enc-titulo").style.translate = "0 90px"));
    await pagina.waitForTimeout(100);
    const r = await pagina.locator(".mk-enc-titulo").boundingBox();
    const cursor = { x: r.x + r.width * 0.5, y: r.y + r.height * 0.5 };
    await pagina.mouse.move(cursor.x - 80, cursor.y);
    await pagina.mouse.move(cursor.x, cursor.y, { steps: 8 });
    await pagina.waitForTimeout(300);
    const lejos = await pagina.evaluate((c) => {
      let mayor = null;
      for (const l of document.querySelectorAll(".mk-enc-titulo :is(.mk-tc-l, .mk-tc-g)")) {
        const [x = 0, y = 0] = (l.style.translate || "0 0").split(" ").map(parseFloat);
        const fuerza = Math.hypot(x, y || 0);
        if (!mayor || fuerza > mayor.fuerza) {
          const q = l.getBoundingClientRect();
          mayor = { fuerza, distancia: Math.hypot(q.left + q.width / 2 - c.x, q.top + q.height / 2 - c.y) };
        }
      }
      return mayor;
    }, cursor);
    revisar(lejos && lejos.fuerza > 1 && lejos.distancia < 110, `si el título se movió, el imán vuelve a medir: la letra más apartada es la que está junto al cursor (a ${Math.round(lejos?.distancia ?? -1)} px)`);
    await ctx.close();
  }
  {
    // La palabra que rota no entra al imán: las demás letras se apartan y ella queda en su lugar.
    const { ctx, pagina } = await abrir(vista({ titulo: "Café de *especialidad*", palabras: ["barrio", "autor"], iman: true }));
    await pagina.waitForSelector(".mk-enc-titulo .mk-rot", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(2200);
    const r = await pagina.locator(".mk-enc-titulo .mk-rot").boundingBox();
    await pagina.mouse.move(r.x - 60, r.y + r.height / 2);
    await pagina.mouse.move(r.x + r.width / 2, r.y + r.height / 2, { steps: 8 });
    await pagina.waitForTimeout(200);
    // El imán corre cada letra con `translate` puesto en línea; la palabra que rota tiene el suyo en su CSS, no en línea.
    const rota = await pagina.evaluate(() => {
      const rot = document.querySelector(".mk-enc-titulo .mk-rot");
      return { movidas: [rot, ...rot.querySelectorAll("*")].filter((e) => e.style.translate !== "").length, letras: rot.querySelectorAll(".mk-tc-l").length };
    });
    revisar((await corridas(pagina)) > 0 && rota.movidas === 0 && rota.letras === 0, `la palabra que rota no se mueve con el imán (${JSON.stringify(rota)}; ${await corridas(pagina)} letras corridas alrededor)`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir(vista({ titulo: TITULO, iman: true }), { opciones: { reducedMotion: "reduce" } });
    await pagina.waitForSelector(".mk-enc-titulo .mk-tc-l");
    await pagina.waitForTimeout(2200);
    await alTitulo(pagina);
    revisar((await corridas(pagina)) === 0, "con movimiento reducido las letras no se mueven");
    await ctx.close();
  }
}

// --- 4. Letrero colgante ---
if (parte("colgante")) {
  /** El giro del marco, en grados (0 si no gira). */
  const giro = (pagina) =>
    pagina.evaluate(() => {
      const m = document.querySelector(".mk-enc-marco");
      const g = m ? getComputedStyle(m).rotate : "none";
      return g === "none" ? 0 : parseFloat(g);
    });
  const LETRERO = { composicion: "letrero", titulo: "Café *Luna*", colgante: true, boton: { texto: "Pedir", href: "#pedir" } };
  {
    const { ctx, pagina, errores } = await abrir(vista(LETRERO));
    await pagina.waitForSelector(".mk-enc[data-colgante] .mk-enc-marco", { timeout: 8000 }).catch(() => {});
    // Se mira varias veces durante el primer segundo: en un balanceo, un instante suelto puede caer justo en cero.
    const vistos = [];
    for (let i = 0; i < 15; i++) {
      vistos.push(await giro(pagina));
      await pagina.waitForTimeout(60);
    }
    const [menor, mayor] = [Math.min(...vistos), Math.max(...vistos)];
    revisar(mayor > 2 && menor < -0.5, `al abrir, el letrero parte inclinado y se balancea a los dos lados (de ${menor.toFixed(2)}° a ${mayor.toFixed(2)}°)`);
    await pagina.waitForTimeout(4200);
    const asentado = await giro(pagina);
    revisar(Math.abs(asentado) < 0.2, `a los 4,5 s ya se asentó (${asentado.toFixed(2)}°)`);
    const marco = await pagina.locator(".mk-enc-marco").boundingBox();
    await pagina.mouse.click(marco.x + marco.width - 12, marco.y + 14);
    await pagina.waitForTimeout(260);
    const empujado = await giro(pagina);
    revisar(Math.abs(empujado) > 0.3, `un toque en un lado lo vuelve a mover (${empujado.toFixed(2)}°)`);
    await pagina.waitForTimeout(4600);
    // Apretar el botón del letrero no lo balancea: el clic llega aunque se suelte un rato después y lejos del centro.
    await pagina.evaluate(() => {
      window.__clics = 0;
      document.querySelector(".mk-enc .mk-btn").addEventListener("click", (e) => {
        e.preventDefault();
        window.__clics++;
      });
    });
    const cajaBoton = await pagina.locator(".mk-enc .mk-btn").first().boundingBox();
    await pagina.mouse.move(cajaBoton.x + cajaBoton.width * 0.85, cajaBoton.y + cajaBoton.height / 2);
    await pagina.mouse.down();
    await pagina.waitForTimeout(180);
    const alApretar = await giro(pagina);
    await pagina.mouse.up();
    await pagina.waitForTimeout(100);
    const clics = await pagina.evaluate(() => window.__clics);
    revisar(clics === 1 && Math.abs(alApretar) < 0.3, `apretar el botón del letrero no lo balancea y el clic llega (${clics} clic; giro al apretar ${alApretar.toFixed(2)}°)`);
    const boton = await pagina.evaluate(() => {
      const b = document.querySelector(".mk-enc .mk-btn");
      const r = b.getBoundingClientRect();
      const arriba = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return arriba === b || b.contains(arriba);
    });
    revisar(boton, "el botón del letrero sigue recibiendo los toques");
    // Tras el toque tarda unos 5 s en dormirse del todo (el balanceo se apaga de a poco): se le da ese tiempo.
    await pagina.waitForTimeout(2500);
    const pedidos = await cuadrosDeEfectos(pagina);
    revisar(pedidos === 0, `ya asentado, el letrero deja de calcular (${pedidos} cuadros pedidos en un segundo)`);
    revisar(errores.length === 0, `sin errores con el letrero${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir(vista({ ...LETRERO, composicion: "centrado" }));
    await pagina.waitForSelector(".mk-enc");
    await pagina.waitForTimeout(1200);
    revisar((await pagina.locator(".mk-enc[data-colgante]").count()) === 0, "en otra composición el letrero colgante no se prende");
    await ctx.close();
  }
  {
    // Al bajar la página se ladea poco (grados contados) y, con el encabezado fuera de la vista, ni se entera.
    const { ctx, pagina } = await abrir(vista(LETRERO));
    await pagina.waitForSelector(".mk-enc[data-colgante] .mk-enc-marco", { timeout: 8000 }).catch(() => {});
    await pagina.evaluate(() => document.body.insertAdjacentHTML("beforeend", '<div style="height:6000px"></div>'));
    await pagina.waitForTimeout(5200);
    // Sube y baja 240 px a unos 1.000 px por segundo durante 2 segundos, con el encabezado siempre a la vista.
    const mayor = await pagina.evaluate(async () => {
      const m = document.querySelector(".mk-enc-marco");
      let mayor = 0;
      let sentido = 1;
      for (let i = 0; i < 120; i++) {
        if (window.scrollY >= 240) sentido = -1;
        if (window.scrollY <= 0) sentido = 1;
        window.scrollBy(0, 17 * sentido);
        await new Promise((ok) => requestAnimationFrame(ok));
        const g = getComputedStyle(m).rotate;
        mayor = Math.max(mayor, Math.abs(g === "none" ? 0 : parseFloat(g)));
      }
      return mayor;
    });
    revisar(mayor > 0.3 && mayor < 6, `al bajar rápido (1.000 px por segundo) el letrero se ladea poco (hasta ${mayor.toFixed(1)}°)`);
    // Lejos, con el encabezado fuera de la vista: el scroll no lo despierta.
    await pagina.evaluate(() => window.scrollTo(0, 3000));
    await pagina.waitForTimeout(6500);
    const a = await pagina.evaluate(() => window.__cuadrosEfectos);
    for (let i = 0; i < 20; i++) {
      await pagina.evaluate(() => window.scrollBy(0, 40));
      await pagina.waitForTimeout(40);
    }
    const pedidos = (await pagina.evaluate(() => window.__cuadrosEfectos)) - a;
    revisar(pedidos === 0, `con el encabezado fuera de la vista, bajar la página no despierta al letrero (${pedidos} cuadros pedidos)`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir(vista(LETRERO), { opciones: { reducedMotion: "reduce" } });
    await pagina.waitForSelector(".mk-enc-marco");
    await pagina.waitForTimeout(1200);
    revisar((await giro(pagina)) === 0, "con movimiento reducido el letrero queda derecho");
    await ctx.close();
  }
}

// --- 5. Inclinación por velocidad (relato de página «impulso») ---
if (parte("impulso")) {
  const T = '[data-telefono="p-impulso"]';
  /**
   * Baja el teléfono rápido y anota en cada paso lo que de verdad se ve: la mayor inclinación de sus bloques (sacada de
   * su transformación), cuántos están inclinados, cuántos de esos quedaron fuera de la vista, cuántos de los que se ven
   * quedaron sin inclinar y si algo se sale de lado.
   */
  const bajarRapido = (pagina) =>
    pagina.evaluate(async (t) => {
      const tel = document.querySelector(t);
      const grados = (b) => {
        const m = getComputedStyle(b).transform;
        return m === "none" ? 0 : (Math.atan(new DOMMatrixReadOnly(m).b) * 180) / Math.PI;
      };
      const dosCuadros = () => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
      const pasos = [];
      for (let i = 0; i < 14; i++) {
        tel.scrollTop += 120;
        await dosCuadros();
        const caja = tel.getBoundingClientRect();
        const arriba = Math.max(caja.top, 0);
        const abajo = Math.min(caja.bottom, window.innerHeight);
        const seVe = (b) => {
          const r = b.getBoundingClientRect();
          return r.bottom > arriba + 1 && r.top < abajo - 1;
        };
        const fueraDeVista = (b) => {
          const r = b.getBoundingClientRect();
          return r.bottom < arriba - 1 || r.top > abajo + 1;
        };
        const bloques = [...tel.querySelectorAll(".mk-relato-in")];
        const inclinados = bloques.filter((b) => b.hasAttribute("data-impulso"));
        pasos.push({
          mayor: Math.max(0, ...bloques.map((b) => Math.abs(grados(b)))),
          inclinados: inclinados.length,
          fuera: inclinados.filter(fueraDeVista).length,
          sinInclinar: bloques.filter((b) => seVe(b) && !b.hasAttribute("data-impulso")).length,
          deLado: tel.scrollWidth - tel.clientWidth,
        });
      }
      return pasos;
    }, T);
  /** Cómo quedaron los bloques: cuántos siguen marcados, con transformación o con la variable puesta. */
  const restos = (pagina) =>
    pagina.evaluate((t) => {
      const bloques = [...document.querySelectorAll(`${t} .mk-relato-in`)];
      return {
        bloques: bloques.length,
        marcados: bloques.filter((b) => b.hasAttribute("data-impulso")).length,
        torcidos: bloques.filter((b) => getComputedStyle(b).transform !== "none").length,
        conVariable: bloques.filter((b) => b.style.getPropertyValue("--mk-impulso") !== "").length,
      };
    }, T);
  {
    const { ctx, pagina, errores } = await abrir("#relatos");
    await pagina.waitForSelector(`${T} .mk-relato`, { timeout: 8000 }).catch(() => {});
    const hay = await pagina.locator(T).count();
    revisar(hay === 1, "la demo tiene el teléfono de la inclinación por velocidad");
    if (hay) {
      await pagina.locator(T).scrollIntoViewIfNeeded();
      await pagina.waitForTimeout(900);
      const antes = await restos(pagina);
      revisar(antes.bloques >= 3 && antes.torcidos === 0 && antes.marcados === 0, `en reposo los bloques quedan sin transformación, como sin el relato (${JSON.stringify(antes)})`);
      // Al cargar, cada página mide su fluidez unos segundos (pide cuadros): se espera a que termine.
      let enReposo = await cuadrosPorSegundo(pagina);
      for (let i = 0; i < 10 && enReposo > 2; i++) enReposo = await cuadrosPorSegundo(pagina);
      // El scroll de algo que está dentro de la página (una tira de fotos, por ejemplo) no es bajar la página.
      await pagina.evaluate((t) => document.querySelector(`${t} .mk-relato-in`).dispatchEvent(new Event("scroll")), T);
      await pagina.waitForTimeout(120);
      revisar((await restos(pagina)).marcados === 0, "el scroll de algo que está dentro de la página no lo despierta");
      const pasos = await bajarRapido(pagina);
      const mayor = Math.max(...pasos.map((x) => x.mayor));
      revisar(mayor > 1 && mayor <= 1.501, `al bajar rápido los bloques se inclinan, sin pasar de 1,5° (máximo ${mayor.toFixed(2)}°)`);
      const fuera = Math.max(...pasos.map((x) => x.fuera));
      const sinInclinar = Math.max(...pasos.filter((x) => x.mayor > 0).map((x) => x.sinInclinar), 0);
      const inclinados = Math.max(...pasos.map((x) => x.inclinados));
      revisar(inclinados >= 1 && inclinados < antes.bloques && fuera === 0 && sinInclinar === 0, `se inclinan todos los bloques que se ven y solo esos (hasta ${inclinados} de ${antes.bloques}; ${fuera} fuera de la vista, ${sinInclinar} a la vista sin inclinar)`);
      const deLado = Math.max(...pasos.map((x) => x.deLado));
      revisar(deLado <= 0, `la inclinación no saca nada de la pantalla (${deLado} px de sobra)`);
      // Al parar se asientan con rebote: pasan un poco al otro lado antes de quedar derechos (lo pide el diseño).
      const vuelta = await pagina.evaluate(async (t) => {
        const tel = document.querySelector(t);
        const vistos = [];
        for (let i = 0; i < 45; i++) {
          await new Promise((ok) => requestAnimationFrame(ok));
          const b = tel.querySelector(".mk-relato-in[data-impulso]");
          const m = b ? getComputedStyle(b).transform : "none";
          vistos.push(m === "none" ? 0 : (Math.atan(new DOMMatrixReadOnly(m).b) * 180) / Math.PI);
        }
        return vistos;
      }, T);
      const alOtroLado = Math.min(...vuelta);
      revisar(alOtroLado < -0.03 && alOtroLado > -0.6, `al parar se asientan con rebote: pasan un poco al otro lado y vuelven (hasta ${alOtroLado.toFixed(2)}°)`);
      await pagina.waitForTimeout(700);
      const despues = await restos(pagina);
      revisar(despues.marcados === 0 && despues.torcidos === 0 && despues.conVariable === 0, `al parar vuelven a quedar derechos y sin rastro (${JSON.stringify(despues)})`);
      const alFinal = await cuadrosPorSegundo(pagina);
      revisar(enReposo <= 2 && alFinal <= 2, `ya derechos, deja de calcular (${alFinal} cuadros pedidos por segundo; antes de bajar, ${enReposo})`);
    }
    revisar(errores.length === 0, `sin errores con la inclinación${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir("#relatos", { opciones: { reducedMotion: "reduce" } });
    await pagina.waitForSelector(`${T} .mk-relato`, { timeout: 8000 }).catch(() => {});
    if (await pagina.locator(T).count()) {
      await pagina.locator(T).scrollIntoViewIfNeeded();
      await pagina.waitForTimeout(600);
      const pasos = await bajarRapido(pagina);
      revisar(pasos.every((x) => x.mayor === 0 && x.inclinados === 0), "con movimiento reducido no hay inclinación");
    } else revisar(false, "con movimiento reducido no hay inclinación (falta el teléfono)");
    await ctx.close();
  }
}

// Para los lienzos 2D de los fondos nuevos: cuenta sus dibujos y deja a la prueba decidir si están a la vista.
const espiarLienzo2d = () => {
  window.__dibujos2d = 0;
  const limpiar = CanvasRenderingContext2D.prototype.clearRect;
  CanvasRenderingContext2D.prototype.clearRect = function (...a) {
    if (this.canvas?.closest?.(".mk-capa, .mk-estela")) window.__dibujos2d++;
    return limpiar.apply(this, a);
  };
  const Real = window.IntersectionObserver;
  const falsos = [];
  window.IntersectionObserver = class {
    constructor(aviso, opciones) {
      this.aviso = aviso;
      this.real = new Real((es) => aviso(es, this), opciones);
      this.mios = [];
    }
    observe(el) {
      // Solo se finge para el lienzo del fondo (o su capa) cuando la prueba lo pidió.
      if (window.__fingirVista && (el instanceof HTMLCanvasElement ? el.closest(".mk-capa") : el.classList?.contains("mk-capa") && el.querySelector("canvas"))) {
        this.mios.push(el);
        falsos.push(this);
        return;
      }
      this.real.observe(el);
    }
    unobserve(el) {
      this.real.unobserve(el);
    }
    disconnect() {
      this.real.disconnect();
      this.mios = [];
    }
    takeRecords() {
      return [];
    }
  };
  window.__vista = (si) => {
    for (const f of falsos) for (const el of f.mios) f.aviso([{ isIntersecting: si, intersectionRatio: si ? 1 : 0, target: el }], f);
  };
};
async function dibujosPorSegundo(pagina, cuenta = "__dibujos2d") {
  const a = await pagina.evaluate((c) => window[c], cuenta);
  await pagina.waitForTimeout(1000);
  return (await pagina.evaluate((c) => window[c], cuenta)) - a;
}
/** Los fondos vivos de lienzo de la segunda tanda (todos se prueban igual). */
const FONDOS = ["bandada", "luciernagas", "corrientes", "gotas", "relieve"];
/** Cuántos píxeles pintados tiene un lienzo 2D en una franja (de 0 a 1 de su alto). */
const pintados = (pagina, selector, desde = 0, hasta = 1) =>
  pagina.evaluate(
    ([q, a, b]) => {
      const c = document.querySelector(q);
      if (!c || !c.width || !c.height) return -1;
      const y0 = Math.floor(c.height * a);
      const alto = Math.max(1, Math.floor(c.height * b) - y0);
      const d = c.getContext("2d").getImageData(0, y0, c.width, alto).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
      return n;
    },
    [selector, desde, hasta],
  );

// --- 6. Objetos del rubro que caen ---
if (parte("caida")) {
  const LIENZO = ".mk-enc .mk-capa canvas";
  {
    const { ctx, pagina, errores } = await abrir(vista({ efecto: "granos", variante: 2 }), { antes: espiarLienzo2d });
    await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
    revisar((await pagina.locator(LIENZO).count()) === 1, "los objetos que caen se dibujan en un lienzo detrás del encabezado");
    await pagina.waitForSelector(`${LIENZO}[data-estado="quieto"]`, { timeout: 15000 }).catch(() => {});
    const [arriba, abajo] = [await pintados(pagina, LIENZO, 0, 0.33), await pintados(pagina, LIENZO, 0.8, 1)];
    revisar((await pagina.locator(LIENZO).getAttribute("data-estado")) === "quieto" && arriba === 0 && abajo > 200, `caen, se apilan al fondo y se quedan quietos (arriba ${arriba} píxeles, abajo ${abajo})`);
    revisar((await dibujosPorSegundo(pagina)) <= 1, "ya quietos, dejan de dibujar");
    // El cursor los empuja.
    const caja = await pagina.locator(".mk-enc").boundingBox();
    await pagina.mouse.move(caja.x + 40, caja.y + caja.height - 30);
    await pagina.mouse.move(caja.x + caja.width - 40, caja.y + caja.height - 20, { steps: 20 });
    revisar((await pagina.waitForSelector(`${LIENZO}[data-estado="vivo"]`, { timeout: 2500 }).catch(() => null)) !== null, "el cursor los empuja y vuelven a moverse");
    await pagina.waitForSelector(`${LIENZO}[data-estado="quieto"]`, { timeout: 15000 }).catch(() => {});
    // Un toque en la pila los dispersa.
    const antesDelToque = await pagina.locator(LIENZO).getAttribute("data-estado");
    await pagina.mouse.click(caja.x + caja.width / 2, caja.y + caja.height - 25);
    revisar(antesDelToque === "quieto" && (await pagina.waitForSelector(`${LIENZO}[data-estado="vivo"]`, { timeout: 2500 }).catch(() => null)) !== null, "un toque en la pila los dispersa");
    await pagina.waitForSelector(`${LIENZO}[data-estado="quieto"]`, { timeout: 15000 }).catch(() => {});
    // Si el estilo cambia de color, la pila quieta se vuelve a dibujar con el color nuevo (sin que nadie la toque).
    const verde = () =>
      pagina.locator(LIENZO).evaluate((c) => {
        const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let pintados = 0;
        let verdes = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] <= 80) continue;
          pintados++;
          if (d[i + 1] > d[i] + 60 && d[i + 1] > d[i + 2] + 60) verdes++;
        }
        return pintados ? verdes / pintados : 0;
      });
    const verdeAntes = await verde();
    await pagina.evaluate(() => document.querySelector(".mk-enc").closest(".mk-estilo").style.setProperty("--mk-acento", "rgb(0, 200, 0)"));
    await pagina.waitForTimeout(400);
    const verdeDespues = await verde();
    revisar(verdeAntes < 0.1 && verdeDespues > 0.9, `al cambiar el color del estilo, la pila quieta se redibuja con el color nuevo (de ${(verdeAntes * 100).toFixed(0)} % a ${(verdeDespues * 100).toFixed(0)} % de verde)`);
    // Al achicar la ventana siguen dentro del encabezado (no se pierden fuera del lienzo).
    const antes = await pintados(pagina, LIENZO);
    await pagina.setViewportSize({ width: 700, height: 860 });
    await pagina.waitForTimeout(600);
    await pagina.waitForSelector(`${LIENZO}[data-estado="quieto"]`, { timeout: 15000 }).catch(() => {});
    const despues = await pintados(pagina, LIENZO);
    const cabe = await pagina.locator(LIENZO).evaluate((c) => Math.abs(c.getBoundingClientRect().width - c.parentElement.getBoundingClientRect().width) <= 1);
    revisar(cabe && despues > antes * 0.5, `al achicar la ventana el lienzo se ajusta y los objetos siguen adentro (${antes} → ${despues} píxeles)`);
    revisar(errores.length === 0, `sin errores con los objetos que caen${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    // Fuera de la vista no simula ni dibuja, aunque todavía estén cayendo.
    const { ctx, pagina } = await abrir(vista({ efecto: "tijeras", variante: 3 }), { antes: [() => (window.__fingirVista = true), espiarLienzo2d] });
    await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(500);
    // Mientras no entra a la vista está en pausa: «quieto» es solo cuando ya terminaron de caer.
    const antesDeVerse = await pagina.locator(LIENZO).getAttribute("data-estado");
    revisar(antesDeVerse === "pausa", `antes de entrar a la vista espera en pausa, sin darse por terminado (${antesDeVerse})`);
    await pagina.evaluate(() => window.__vista(true));
    await pagina.waitForTimeout(400);
    const cayendo = await dibujosPorSegundo(pagina);
    await pagina.evaluate(() => window.__vista(false));
    await pagina.waitForTimeout(200);
    const fuera = await dibujosPorSegundo(pagina);
    const alSalir = await pagina.locator(LIENZO).getAttribute("data-estado");
    revisar(cayendo > 20 && fuera <= 1 && alSalir === "pausa", `fuera de la vista los objetos no se dibujan y quedan en pausa (a la vista ${cayendo}/s, fuera ${fuera}/s, ${alSalir})`);
    await ctx.close();
  }
  {
    // Un teléfono que no da abasto (los cuadros llegan a 20 por segundo): el encabezado pasa a nivel liviano y los
    // objetos quedan como una pila en reposo, sin simular y sin seguir al cursor ni a los toques.
    const telefonoLento = () => {
      window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 50);
      window.cancelAnimationFrame = (id) => clearTimeout(id);
    };
    const { ctx, pagina } = await abrir(vista({ efecto: "pesas", variante: 2 }), { antes: [telefonoLento, espiarLienzo2d] });
    await pagina.waitForSelector('.mk-enc[data-nivel="liviano"]', { timeout: 12000 }).catch(() => {});
    await pagina.waitForTimeout(700);
    const nivel = await pagina.locator(".mk-enc").getAttribute("data-nivel");
    const [arriba, abajo] = [await pintados(pagina, LIENZO, 0, 0.33), await pintados(pagina, LIENZO, 0.8, 1)];
    const estado = await pagina.locator(LIENZO).getAttribute("data-estado");
    revisar(nivel === "liviano" && estado === "quieto" && arriba === 0 && abajo > 200, `en nivel liviano queda la pila en reposo (nivel ${nivel}, ${estado}, arriba ${arriba} píxeles, abajo ${abajo})`);
    const caja = await pagina.locator(".mk-enc").boundingBox();
    await pagina.mouse.move(caja.x + 40, caja.y + caja.height - 30);
    await pagina.mouse.move(caja.x + caja.width - 40, caja.y + caja.height - 20, { steps: 20 });
    await pagina.mouse.click(caja.x + caja.width / 2, caja.y + caja.height - 25);
    const dibujos = await dibujosPorSegundo(pagina);
    revisar(dibujos <= 1 && (await pagina.locator(LIENZO).getAttribute("data-estado")) === "quieto", `en nivel liviano el cursor y los toques no los mueven (${dibujos} dibujos por segundo)`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir(vista({ efecto: "granos" }), { opciones: { reducedMotion: "reduce" } });
    await pagina.waitForSelector(".mk-enc");
    await pagina.waitForTimeout(1000);
    revisar((await pagina.locator(LIENZO).count()) === 0, "con movimiento reducido no hay objetos que caen");
    await ctx.close();
  }
  {
    // En la galería de efectos (sin encabezado), con movimiento reducido se ve la pila ya en reposo y no se mueve.
    const G = '[data-efecto="lapices"] .mk-capa canvas';
    const { ctx, pagina } = await abrir("#efectos", { opciones: { reducedMotion: "reduce" }, antes: espiarLienzo2d });
    await pagina.waitForSelector(G, { timeout: 8000 }).catch(() => {});
    await pagina.locator('[data-efecto="lapices"]').scrollIntoViewIfNeeded().catch(() => {});
    await pagina.waitForTimeout(800);
    const [arriba, abajo] = [await pintados(pagina, G, 0, 0.33), await pintados(pagina, G, 0.75, 1)];
    const dibujos = await dibujosPorSegundo(pagina);
    revisar(arriba === 0 && abajo > 100 && dibujos <= 1, `con movimiento reducido, en la galería queda la pila en reposo (arriba ${arriba} píxeles, abajo ${abajo}, ${dibujos} dibujos por segundo)`);
    await ctx.close();
  }
}

// --- 7. Constelación ---
if (parte("constelacion")) {
  const LIENZO = ".mk-enc .mk-capa canvas";
  {
    const { ctx, pagina, errores } = await abrir(vista({ efecto: "constelacion", variante: 2 }), { antes: [() => (window.__fingirVista = true), espiarLienzo2d] });
    await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
    await pagina.evaluate(() => window.__vista(true));
    await pagina.waitForTimeout(600);
    const n = await pintados(pagina, LIENZO);
    const corriendo = await dibujosPorSegundo(pagina);
    revisar(n > 100 && corriendo > 20 && corriendo < 42, `la constelación dibuja puntos y líneas y se mueve, a unos 30 dibujos por segundo (${n} píxeles, ${corriendo} dibujos/s)`);
    const caja = await pagina.locator(".mk-enc").boundingBox();
    await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 6 });
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => window.__vista(false));
    await pagina.waitForTimeout(200);
    const fuera = await dibujosPorSegundo(pagina);
    const alSalir = await pagina.locator(LIENZO).getAttribute("data-estado").catch(() => null);
    revisar(fuera <= 1 && alSalir === "pausa", `fuera de la vista la constelación no dibuja y queda en pausa (${fuera}/s, ${alSalir})`);
    revisar(errores.length === 0, `sin errores con la constelación${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    // Un teléfono que no da abasto (nivel liviano): queda un cuadro dibujado y deja de moverse.
    const telefonoLento = () => {
      window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 50);
      window.cancelAnimationFrame = (id) => clearTimeout(id);
    };
    const { ctx, pagina } = await abrir(vista({ efecto: "constelacion", variante: 3 }), { antes: [telefonoLento, espiarLienzo2d] });
    await pagina.waitForSelector('.mk-enc[data-nivel="liviano"]', { timeout: 12000 }).catch(() => {});
    await pagina.waitForTimeout(500);
    const nivel = await pagina.locator(".mk-enc").getAttribute("data-nivel");
    const n = await pintados(pagina, LIENZO);
    const dibujos = await dibujosPorSegundo(pagina);
    const estado = await pagina.locator(LIENZO).getAttribute("data-estado").catch(() => null);
    revisar(nivel === "liviano" && n > 100 && dibujos <= 1 && estado === "quieto", `en nivel liviano la constelación queda dibujada y quieta (nivel ${nivel}, ${estado}, ${n} píxeles, ${dibujos} dibujos/s)`);
    await ctx.close();
  }
  {
    // En la vitrina, con movimiento reducido queda un cuadro quieto (como los demás fondos).
    const { ctx, pagina } = await abrir("#efectos", { antes: espiarLienzo2d, opciones: { reducedMotion: "reduce" } });
    const sel = '[data-efecto="constelacion"] .mk-capa canvas';
    await pagina.waitForSelector(sel, { timeout: 8000 }).catch(() => {});
    await pagina.locator(sel).scrollIntoViewIfNeeded().catch(() => {});
    await pagina.waitForTimeout(700);
    const n = await pintados(pagina, sel);
    const quieta = await dibujosPorSegundo(pagina);
    revisar(n > 100 && quieta <= 1, `con movimiento reducido la constelación queda dibujada y quieta (${n} píxeles, ${quieta} dibujos/s)`);
    await ctx.close();
  }
}

// --- 8. Fondos vivos de lienzo (segunda tanda) ---
if (parte("fondos")) {
  const LIENZO = ".mk-enc .mk-capa canvas";
  /** Cuántos píxeles pintados hay en un cuadro de `lado` px en torno a un punto del lienzo (en px de CSS). */
  const cerca = (pagina, x, y, lado = 70) =>
    pagina.evaluate(
      ([q, px, py, l]) => {
        const c = document.querySelector(q);
        const k = c.width / c.clientWidth;
        const d = c.getContext("2d").getImageData(Math.round((px - l / 2) * k), Math.round((py - l / 2) * k), Math.round(l * k), Math.round(l * k)).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
        return n;
      },
      [LIENZO, x, y, lado],
    );
  for (const id of FONDOS) {
    const cuenta = "__dibujos2d";
    {
      const { ctx, pagina, errores } = await abrir(vista({ efecto: id, variante: 2 }), { antes: [() => (window.__fingirVista = true), espiarLienzo2d] });
      await pagina.waitForSelector(LIENZO, { timeout: 8000 }).catch(() => {});
      const antesDeVerse = await pagina.locator(LIENZO).getAttribute("data-estado").catch(() => null);
      await pagina.evaluate(() => window.__vista(true));
      await pagina.waitForTimeout(700);
      const n = await pintados(pagina, LIENZO);
      const corriendo = await dibujosPorSegundo(pagina, cuenta);
      revisar(antesDeVerse === "pausa" && n > 100 && corriendo > 20 && corriendo < 42, `${id}: espera en pausa, dibuja y se mueve a unos 30 dibujos por segundo (${antesDeVerse}, ${n} píxeles, ${corriendo} dibujos/s)`);
      // El dedo o el cursor: no rompe nada y el fondo sigue corriendo.
      const caja = await pagina.locator(".mk-enc").boundingBox();
      const lienzo = await pagina.locator(LIENZO).boundingBox();
      const [px, py] = [Math.round(lienzo.width * 0.3), Math.round(lienzo.height * 0.7)];
      if (id === "gotas") {
        // Un toque suelta una gota ahí mismo.
        const antes = Math.max(await cerca(pagina, px, py), await cerca(pagina, px, py));
        await pagina.mouse.click(lienzo.x + px, lienzo.y + py);
        await pagina.waitForTimeout(300);
        const despues = await cerca(pagina, px, py);
        revisar(despues > antes + 80, `gotas: un toque suelta una gota en ese punto (${antes} → ${despues} píxeles cerca)`);
      }
      await pagina.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2, { steps: 8 });
      await pagina.waitForTimeout(300);
      const conDedo = await dibujosPorSegundo(pagina, cuenta);
      revisar(conDedo > 20 && conDedo < 42 && (await pintados(pagina, LIENZO)) > 100, `${id}: con el cursor encima sigue dibujando (${conDedo} dibujos/s)`);
      await pagina.evaluate(() => window.__vista(false));
      await pagina.waitForTimeout(200);
      const fuera = await dibujosPorSegundo(pagina, cuenta);
      const alSalir = await pagina.locator(LIENZO).getAttribute("data-estado").catch(() => null);
      revisar(fuera <= 1 && alSalir === "pausa", `${id}: fuera de la vista no dibuja y queda en pausa (${fuera}/s, ${alSalir})`);
      revisar(errores.length === 0, `${id}: sin errores${errores.length ? `: ${errores.join(" | ")}` : ""}`);
      await ctx.close();
    }
    {
      // Un teléfono que no da abasto (nivel liviano): queda un cuadro dibujado y deja de moverse.
      const telefonoLento = () => {
        window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 50);
        window.cancelAnimationFrame = (n) => clearTimeout(n);
      };
      const { ctx, pagina } = await abrir(vista({ efecto: id, variante: 3 }), { antes: [telefonoLento, espiarLienzo2d] });
      await pagina.waitForSelector('.mk-enc[data-nivel="liviano"]', { timeout: 12000 }).catch(() => {});
      await pagina.waitForTimeout(500);
      const nivel = await pagina.locator(".mk-enc").getAttribute("data-nivel");
      const n = await pintados(pagina, LIENZO);
      const dibujos = await dibujosPorSegundo(pagina, "__dibujos2d");
      const estado = await pagina.locator(LIENZO).getAttribute("data-estado").catch(() => null);
      revisar(nivel === "liviano" && n > 100 && dibujos <= 1 && estado === "quieto", `${id}: en nivel liviano queda dibujado y quieto (nivel ${nivel}, ${estado}, ${n} píxeles, ${dibujos} dibujos/s)`);
      // Quieto, el cursor no lo despierta.
      const caja = await pagina.locator(".mk-enc").boundingBox();
      await pagina.mouse.move(caja.x + 200, caja.y + 200, { steps: 6 });
      await pagina.mouse.click(caja.x + 220, caja.y + 220);
      await pagina.waitForTimeout(200);
      const despierto = await dibujosPorSegundo(pagina, "__dibujos2d");
      revisar(despierto <= 1 && (await pagina.locator(LIENZO).getAttribute("data-estado")) === "quieto", `${id}: quieto, el cursor y un toque no lo despiertan (${despierto} dibujos)`);
      await ctx.close();
    }
    {
      // En la vitrina, con movimiento reducido queda un cuadro quieto (como los demás fondos).
      const { ctx, pagina } = await abrir("#efectos", { antes: espiarLienzo2d, opciones: { reducedMotion: "reduce" } });
      const sel = `[data-efecto="${id}"] .mk-capa canvas`;
      await pagina.waitForSelector(sel, { timeout: 8000 }).catch(() => {});
      await pagina.locator(sel).scrollIntoViewIfNeeded().catch(() => {});
      await pagina.waitForTimeout(700);
      const n = await pintados(pagina, sel);
      const quieta = await dibujosPorSegundo(pagina, "__dibujos2d");
      revisar(n > 100 && quieta <= 1, `${id}: con movimiento reducido queda dibujado y quieto (${n} píxeles, ${quieta} dibujos)`);
      await ctx.close();
    }
  }
}

// --- 9. Estela y chispas ---
if (parte("estela")) {
  const LIENZO = "canvas.mk-estela";
  /** La página sola (como la ve la gente), con la estela prendida. */
  const sola = "#pagina?d=" + Buffer.from(JSON.stringify({ version: 1, encabezado: { version: 2, estilo: "neon", titulo: "Smash *burgers*" }, estela: true })).toString("base64url");
  const estado = (pagina) => pagina.locator(LIENZO).getAttribute("data-estado").catch(() => null);
  {
    // En el editor: la casilla la prende y la apaga; el cursor deja estela solo sobre la página.
    const { ctx, pagina, errores } = await abrir("#pagina", { antes: espiarLienzo2d });
    await pagina.locator('[data-prueba="estela"]').check({ timeout: 5000 }).catch(() => {});
    await pagina.waitForSelector(LIENZO, { state: "attached", timeout: 8000 }).catch(() => {});
    const hay = (await pagina.locator(LIENZO).count()) === 1;
    revisar(hay, "con la casilla prendida hay un lienzo para la estela");
    if (hay) {
      const caja = await pagina.locator(".mk-pagina").first().boundingBox();
      await pagina.waitForTimeout(400);
      // Sobre el panel del editor (fuera de la página) no deja estela.
      await pagina.mouse.move(40, 200);
      await pagina.mouse.move(260, 320, { steps: 10 });
      await pagina.waitForTimeout(60);
      revisar((await estado(pagina)) !== "vivo" && (await pintados(pagina, LIENZO)) <= 0, "fuera de la página el cursor no deja estela");
      await pagina.mouse.move(caja.x + 80, 300);
      await pagina.mouse.move(caja.x + 480, 420, { steps: 14 });
      await pagina.waitForTimeout(60);
      const viva = [await estado(pagina), await pintados(pagina, LIENZO), await pagina.locator(LIENZO).evaluate((c) => getComputedStyle(c).visibility)];
      revisar(viva[0] === "vivo" && viva[1] > 50 && viva[2] === "visible", `al mover el cursor sobre la página aparece la estela (${viva.join(", ")} píxeles)`);
      // Usa el acento de la página (el neón es rosado): casi todo lo pintado tira a ese color.
      const rosado = await pagina.locator(LIENZO).evaluate((c) => {
        const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        let r = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] <= 60) continue;
          n++;
          if (d[i] > d[i + 1] + 60 && d[i + 2] > d[i + 1] + 40) r++;
        }
        return n ? r / n : 0;
      });
      revisar(rosado > 0.8, `la estela usa el color de acento de la página (${(rosado * 100).toFixed(0)} % de lo pintado)`);
      await pagina.waitForTimeout(1100);
      const despues = [await estado(pagina), await pintados(pagina, LIENZO), await pagina.locator(LIENZO).evaluate((c) => getComputedStyle(c).visibility)];
      revisar(despues[0] === "quieto" && despues[1] === 0 && despues[2] === "hidden" && (await dibujosPorSegundo(pagina)) <= 1, `un segundo después se apagó, quedó limpia y oculta, y dejó de dibujar (${despues.join(", ")})`);
      const toca = await pagina.evaluate((q) => {
        const c = document.querySelector(q);
        const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
        return { recibe: e !== c, oculto: c.getAttribute("aria-hidden") === "true", toques: getComputedStyle(c).pointerEvents };
      }, LIENZO);
      revisar(toca.recibe && toca.oculto && toca.toques === "none", "la estela no recibe toques ni la lee el lector de pantalla");
      // Con la pestaña oculta no pide cuadros, aunque llegue movimiento.
      await pagina.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      const antes = await pagina.evaluate(() => window.__dibujos2d);
      await pagina.mouse.move(caja.x + 100, 500);
      await pagina.mouse.move(caja.x + 420, 380, { steps: 10 });
      await pagina.waitForTimeout(300);
      const dibujados = (await pagina.evaluate(() => window.__dibujos2d)) - antes;
      revisar((await estado(pagina)) !== "vivo" && dibujados === 0, `con la pestaña oculta la estela no corre, aunque llegue movimiento (${dibujados} dibujos, ${await estado(pagina)})`);
      await pagina.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await pagina.locator('[data-prueba="estela"]').uncheck();
      await pagina.waitForTimeout(300);
      revisar((await pagina.locator(LIENZO).count()) === 0, "al apagar la casilla el lienzo se va");
    }
    revisar(errores.length === 0, `sin errores con la estela${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
  {
    // Con el dedo, en la página sola: un toque suelta chispas, que después se apagan.
    const { ctx, pagina } = await abrir(sola, { antes: espiarLienzo2d, opciones: { viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true } });
    await pagina.waitForSelector(LIENZO, { state: "attached", timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(400);
    // Empezar a bajar la página con el dedo no es un toque: el navegador cancela el puntero, o el dedo se mueve.
    const gesto = (pasos) =>
      pagina.evaluate((lista) => {
        const el = document.querySelector(".mk-pagina");
        for (const [tipo, x, y] of lista) el.dispatchEvent(new PointerEvent(tipo, { bubbles: true, pointerId: 7, pointerType: "touch", clientX: x, clientY: y }));
      }, pasos);
    await gesto([["pointerdown", 200, 400], ["pointermove", 200, 380], ["pointercancel", 200, 380]]);
    await pagina.waitForTimeout(120);
    const alBajar = [await pintados(pagina, LIENZO), await estado(pagina)];
    await gesto([["pointerdown", 200, 400], ["pointermove", 200, 330], ["pointerup", 200, 330]]);
    await pagina.waitForTimeout(120);
    const alArrastrar = [await pintados(pagina, LIENZO), await estado(pagina)];
    revisar(alBajar[0] <= 0 && alBajar[1] !== "vivo" && alArrastrar[0] <= 0 && alArrastrar[1] !== "vivo", `empezar a bajar la página con el dedo no suelta chispas (${alBajar.join(", ")}; arrastrando: ${alArrastrar.join(", ")})`);
    await pagina.touchscreen.tap(200, 400).catch(() => {});
    await pagina.waitForTimeout(120);
    const n = await pintados(pagina, LIENZO);
    await pagina.waitForTimeout(1000);
    const fin = [await pintados(pagina, LIENZO), await estado(pagina)];
    revisar(n > 20 && fin[0] === 0 && fin[1] === "quieto", `un toque suelta chispas y después se apagan (${n} píxeles; al final ${fin.join(", ")})`);
    await ctx.close();
  }
  {
    const { ctx, pagina } = await abrir(sola, { opciones: { reducedMotion: "reduce" } });
    await pagina.waitForSelector(".mk-pagina", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(900);
    revisar((await pagina.locator(".mk-pagina").count()) === 1 && (await pagina.locator(LIENZO).count()) === 0, "con movimiento reducido no hay estela");
    await ctx.close();
  }
}

// --- 10. Limpieza: al salir de la vista no queda nada vivo (ni bucles, ni lienzos, ni oyentes) ---
if (parte("limpieza")) {
  const LIENZOS = "canvas.mk-lienzo, canvas.mk-estela, .mk-shader canvas";
  const MARCAS = "[data-impulso], [data-colgante], [data-pila]";
  /** Un encabezado sin nada que se mueva: ahí cualquier cuadro pedido (fuera del medidor de fluidez) es de algo que quedó vivo. */
  const QUIETA = vista({ entrada: "ninguna", titulo: "Nada se mueve" });
  /** Lleva la cuenta de los oyentes puestos en el documento y la ventana, y de los observadores activos. */
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
        // Los de una sola vez se van solos: no cuentan.
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
  /** Mueve el cursor y baja la página: lo que despierta a los efectos. */
  const molestar = async (pagina) => {
    await pagina.mouse.move(300, 300);
    await pagina.mouse.move(760, 420, { steps: 10 });
    await pagina.mouse.wheel(0, 600);
    await pagina.waitForTimeout(150);
    await pagina.mouse.wheel(0, -600);
  };
  /** Cuántos cuadros piden los efectos mientras se molesta (cerca de un segundo), qué lienzos y marcas hay, y qué oyentes y observadores. */
  const medir = async (pagina) => {
    const a = await pagina.evaluate(() => window.__cuadrosEfectos);
    await molestar(pagina);
    await pagina.waitForTimeout(700);
    const cuadros = (await pagina.evaluate(() => window.__cuadrosEfectos)) - a;
    return { cuadros, ...(await pagina.evaluate(([q, m]) => ({ lienzos: document.querySelectorAll(q).length, marcas: document.querySelectorAll(m).length, vivos: window.__vivos() }), [LIENZOS, MARCAS])) };
  };
  const corto = (m) => `${m.cuadros} cuadros, ${m.lienzos} lienzos, ${m.marcas} marcas`;
  /** Cambia de vista con el hash (como navegar dentro del sitio) y espera a que asiente. */
  const ir = async (pagina, ruta, espera) => {
    await pagina.evaluate((r) => (location.hash = r), ruta);
    await pagina.waitForTimeout(espera);
  };
  const sola = "#pagina?d=" + Buffer.from(JSON.stringify({ version: 1, encabezado: { version: 2, estilo: "neon", titulo: "Smash *burgers*" }, relato: "pila", relatoPagina: "impulso", estela: true })).toString("base64url");
  const casos = [
    ["imán y objetos que caen", vista({ efecto: "granos", variante: 3, iman: true }), 1],
    ["letrero colgante y constelación", vista({ composicion: "letrero", colgante: true, efecto: "constelacion" }), 1],
    ["lámpara de lava", vista({ shader: "lava", ahorro: "nunca" }), 1],
    ["página con pila, inclinación y estela", sola, 1],
    ...FONDOS.map((id) => [`fondo «${id}»`, vista({ efecto: id, variante: 2 }), 1]),
  ];
  for (const [nombre, ruta, lienzos] of casos) {
    // Parte en la vista quieta, entra al caso, vuelve a la quieta, y otra vez: al volver todo tiene que quedar como al partir.
    const { ctx, pagina, errores } = await abrir(QUIETA, { antes: contarOyentes });
    await pagina.waitForSelector(".mk-enc", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(2500);
    const antes = await medir(pagina);
    revisar(antes.cuadros <= 2 && antes.lienzos === 0, `${nombre}: la vista quieta de partida no pide cuadros (${corto(antes)})`);
    await ir(pagina, ruta, 3000);
    const dentro = await medir(pagina);
    revisar(dentro.lienzos === lienzos && dentro.cuadros > 5, `${nombre}: a la vista hay ${lienzos} lienzo(s) y corre (${corto(dentro)})`);
    // Se guardan los lienzos de los fondos y de la estela, para ver después que soltaron su memoria.
    await pagina.evaluate(() => (window.__lienzos = [...document.querySelectorAll("canvas.mk-lienzo, canvas.mk-estela")]));
    await ir(pagina, QUIETA, 1500);
    const fuera = await medir(pagina);
    const memoria = await pagina.evaluate(() => window.__lienzos.map((c) => c.width * c.height));
    revisar(memoria.every((px) => px === 0), `${nombre}: al salir, los lienzos sueltan su memoria (${memoria.join(", ") || "sin lienzos 2D"} píxeles)`);
    const quedaron = sobran(antes.vivos, fuera.vivos);
    revisar(fuera.lienzos === 0 && fuera.marcas === 0 && fuera.cuadros <= 2, `${nombre}: al salir no quedan bucles, lienzos ni marcas (${corto(fuera)})`);
    revisar(quedaron.length === 0, `${nombre}: al salir no quedan oyentes ni observadores${quedaron.length ? `: ${quedaron.join(", ")}` : ""}`);
    await ir(pagina, ruta, 3000);
    const otraVez = await medir(pagina);
    await ir(pagina, QUIETA, 1500);
    const fuera2 = await medir(pagina);
    const quedaron2 = sobran(antes.vivos, fuera2.vivos);
    revisar(otraVez.lienzos === lienzos && otraVez.cuadros > 5 && fuera2.lienzos === 0 && fuera2.marcas === 0 && fuera2.cuadros <= 2 && quedaron2.length === 0, `${nombre}: al volver a entrar funciona igual y al salir queda limpio (${corto(otraVez)} → ${corto(fuera2)}${quedaron2.length ? `; quedaron ${quedaron2.join(", ")}` : ""})`);
    // Y a la portada (se desmonta todo de una vez): tampoco quedan lienzos ni marcas.
    await ir(pagina, ruta, 2000);
    await ir(pagina, "", 800);
    const portada = await pagina.evaluate(([q, m]) => ({ lienzos: document.querySelectorAll(q).length, marcas: document.querySelectorAll(m).length }), [LIENZOS, MARCAS]);
    revisar(portada.lienzos === 0 && portada.marcas === 0, `${nombre}: al ir a la portada no quedan lienzos ni marcas (${JSON.stringify(portada)})`);
    revisar(errores.length === 0, `${nombre}: sin errores al entrar y salir${errores.length ? `: ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
}

// --- 11. Sin Canvas ni WebGL: no hay errores y la página se ve igual ---
if (parte("sinlienzo")) {
  const sinLienzo = () => {
    HTMLCanvasElement.prototype.getContext = () => null;
  };
  const casos = [
    ["objetos que caen", vista({ efecto: "granos", variante: 3 })],
    ["constelación", vista({ efecto: "constelacion" })],
    ["lámpara de lava", vista({ shader: "lava", ahorro: "nunca" })],
    ["página con estela, inclinación y pila", paginaSola({ relato: "pila", relatoPagina: "impulso", estela: true })],
    ...FONDOS.map((id) => [`fondo «${id}»`, vista({ efecto: id })]),
  ];
  for (const [nombre, ruta] of casos) {
    const { ctx, pagina, errores } = await abrir(ruta, { antes: sinLienzo });
    await pagina.waitForSelector(".mk-enc-titulo", { timeout: 8000 }).catch(() => {});
    await pagina.waitForTimeout(1500);
    await pagina.mouse.move(300, 300);
    await pagina.mouse.move(700, 420, { steps: 10 });
    await pagina.mouse.click(640, 400);
    await pagina.mouse.wheel(0, 500);
    await pagina.waitForTimeout(600);
    const titulo = await pagina.locator(".mk-enc-titulo").first().evaluate((e) => ({ alto: e.getBoundingClientRect().height, texto: e.getAttribute("aria-label") ?? e.textContent })).catch(() => ({ alto: 0, texto: "" }));
    revisar(errores.length === 0 && titulo.alto > 0 && Boolean(titulo.texto), `sin Canvas ni WebGL, ${nombre}: sin errores y el encabezado se ve${errores.length ? ` — ${errores.join(" | ")}` : ""}`);
    await ctx.close();
  }
}

// --- 12. A 360 px de ancho: nada se sale de lado ---
if (parte("angosto")) {
  const ANCHO = 360;
  const telefono = { viewport: { width: ANCHO, height: 780 }, isMobile: true, hasTouch: true };
  const casos = [
    ["letras con imán", vista({ titulo: "Hamburguesas *gigantes* y papas fritas", iman: true })],
    ["letrero colgante", vista({ composicion: "letrero", colgante: true, titulo: "Barbería *El Corte*" })],
    ["texto que se descifra", vista({ efectoTexto: "descifrar", titulo: "Café de *especialidad* en Ñuñoa" })],
    ["objetos que caen", vista({ efecto: "pesas", variante: 3 })],
    ["constelación", vista({ efecto: "constelacion", variante: 3 })],
    ["lámpara de lava", vista({ shader: "lava", ahorro: "nunca" })],
    ["página con pila, inclinación y estela", paginaSola({ relato: "pila", relatoPagina: "impulso", estela: true })],
    ...FONDOS.map((id) => [`fondo «${id}»`, vista({ efecto: id, variante: 3 })]),
  ];
  for (const [nombre, ruta] of casos) {
    const { ctx, pagina, errores } = await abrir(ruta, { opciones: telefono });
    await pagina.waitForSelector(".mk-enc", { timeout: 8000 }).catch(() => {});
    const sobras = [];
    // Se mide contra el ancho del teléfono y no contra `innerWidth`: en modo teléfono, `innerWidth` crece junto con lo
    // que se sale (el navegador aleja la página) y la resta daría siempre cero.
    const sobra = async () => sobras.push(await pagina.evaluate((ancho) => document.documentElement.scrollWidth - ancho, ANCHO));
    // Mientras se mueve (el letrero se balancea al abrir), después de tocar y al bajar rápido.
    await pagina.waitForTimeout(350);
    await sobra();
    await pagina.touchscreen.tap(250, 380).catch(() => {});
    await pagina.waitForTimeout(250);
    await sobra();
    for (let i = 0; i < 6; i++) {
      await pagina.evaluate(() => window.scrollBy(0, 160));
      await pagina.waitForTimeout(40);
    }
    await sobra();
    await pagina.waitForTimeout(1500);
    await sobra();
    const mayor = Math.max(...sobras);
    revisar(mayor <= 0 && errores.length === 0, `a 360 px, ${nombre}: nada se sale de lado (${mayor} px de sobra)${errores.length ? ` — ${errores.join(" | ")}` : ""}`);
    if (ruta === casos[casos.length - 1][1]) {
      // Control de la medida: algo que de verdad se sale (una caja de 500 px) sí se detecta.
      await pagina.evaluate(() => document.body.insertAdjacentHTML("beforeend", '<div style="width:500px;height:1px"></div>'));
      sobras.length = 0;
      await sobra();
      revisar(sobras[0] > 100, `control: la medida detecta lo que se sale de lado (${sobras[0]} px con una caja de 500 px)`);
    }
    await ctx.close();
  }
}

// Cada tarea del plan suma aquí su parte.

await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron.` : "\nTodo bien.");
process.exit(fallas ? 1 : 0);
