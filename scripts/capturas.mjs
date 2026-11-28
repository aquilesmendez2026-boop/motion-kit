// «Se ve igual» (Un solo motor): toma una muestra fija de capturas de la demo y compara dos tomas.
// Uso, con el servidor arriba:
//   node scripts/capturas.mjs tomar <carpeta> [http://localhost:5173]
//   node scripts/capturas.mjs comparar <carpeta-antes> <carpeta-después>
// Las capturas van con movimiento reducido (nada queda a mitad de una animación) y sin las letras de Google. Al
// comparar, un píxel cuenta como distinto si algún canal cambia más de 8; falla si una captura pasa de 0,5 %.
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const [accion, a, b] = process.argv.slice(2);
const TOPE = 0.5;
const TOLERANCIA = 8;
const TAMANOS = { telefono: { width: 390, height: 844 }, escritorio: { width: 1280, height: 800 } };
const SECCIONES_VIVO = ["resumen", "pagina", "precios", "pedidos", "agenda", "colaboraciones", "caja", "modulos", "novedades"];

async function tomar(carpeta, base = "http://localhost:5173") {
  mkdirSync(carpeta, { recursive: true });
  const navegador = await chromium.launch();
  let n = 0;
  const errores = [];
  for (const [tam, viewport] of Object.entries(TAMANOS)) {
    const ctx = await navegador.newContext({ viewport, reducedMotion: "reduce", deviceScaleFactor: 1 });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.fulfill({ status: 200, contentType: "text/css", body: "" }));
    const pagina = await ctx.newPage();
    pagina.on("pageerror", (e) => errores.push(`${tam}: ${e.message}`));
    const ir = async (ruta, ms = 1200) => {
      await pagina.goto("about:blank");
      await pagina.goto(`${base}/${ruta}`);
      await pagina.waitForTimeout(ms);
    };
    const foto = async (nombre, opciones = {}) => {
      await pagina.screenshot({ path: join(carpeta, `${tam}-${nombre}.png`), ...opciones });
      n++;
    };

    // Las piezas sueltas del panel, sección por sección.
    await ir("#panel-piezas");
    await foto("piezas-arriba");
    for (const id of await pagina.$$eval("section[data-prueba^=panel-]", (l) => l.map((s) => s.dataset.prueba))) {
      const s = await pagina.$(`section[data-prueba="${id}"]`);
      await s.scrollIntoViewIfNeeded();
      await pagina.waitForTimeout(150);
      await s.screenshot({ path: join(carpeta, `${tam}-piezas-${id}.png`) });
      n++;
    }
    // El cómic, sección por sección.
    await ir("#comic");
    const secciones = await pagina.$$("section");
    for (const [i, s] of secciones.entries()) {
      await s.scrollIntoViewIfNeeded();
      await pagina.waitForTimeout(150);
      await s.screenshot({ path: join(carpeta, `${tam}-comic-${i + 1}.png`) });
      n++;
    }
    // El panel vivo: una captura por sección de la muestra, antes de que llegue nada solo.
    for (const s of SECCIONES_VIVO) {
      await ir(`#panel?s=${s}`);
      await foto(`vivo-${s}`);
    }
    // Una sección vacía llenada, y Confirmar abierto.
    await ir("#panel?s=sellos");
    await pagina.click("text=Crear el primero");
    await pagina.waitForTimeout(3000);
    await foto("vivo-sellos-lleno");
    await ir("#panel?s=colaboraciones");
    await pagina.click(".pv-colab >> nth=0 >> text=Borrar");
    await pagina.waitForTimeout(600);
    await foto("vivo-confirmar");
    await ctx.close();
  }
  await navegador.close();
  if (errores.length) console.log(`Ojo, errores en la página:\n${errores.join("\n")}`);
  console.log(`${n} capturas en ${carpeta}`);
}

async function comparar(antes, despues) {
  const nombres = [...new Set([...readdirSync(antes), ...readdirSync(despues)])].filter((x) => x.endsWith(".png")).sort();
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  const resultados = [];
  for (const nombre of nombres) {
    const pa = join(antes, nombre);
    const pb = join(despues, nombre);
    if (!existsSync(pa) || !existsSync(pb)) {
      resultados.push({ nombre, falta: existsSync(pa) ? "después" : "antes" });
      continue;
    }
    const pct = await pagina.evaluate(
      async ([x, y, tol]) => {
        const cargar = (src) =>
          new Promise((ok, mal) => {
            const i = new Image();
            i.onload = () => ok(i);
            i.onerror = mal;
            i.src = src;
          });
        const [ia, ib] = await Promise.all([cargar(x), cargar(y)]);
        if (ia.width !== ib.width || ia.height !== ib.height) return 100;
        const datos = (img) => {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          const g = c.getContext("2d");
          g.drawImage(img, 0, 0);
          return g.getImageData(0, 0, c.width, c.height).data;
        };
        const da = datos(ia);
        const db = datos(ib);
        let distintos = 0;
        for (let k = 0; k < da.length; k += 4) {
          if (Math.abs(da[k] - db[k]) > tol || Math.abs(da[k + 1] - db[k + 1]) > tol || Math.abs(da[k + 2] - db[k + 2]) > tol || Math.abs(da[k + 3] - db[k + 3]) > tol) distintos++;
        }
        return (distintos / (da.length / 4)) * 100;
      },
      [`data:image/png;base64,${readFileSync(pa).toString("base64")}`, `data:image/png;base64,${readFileSync(pb).toString("base64")}`, TOLERANCIA],
    );
    resultados.push({ nombre, pct });
  }
  await navegador.close();
  const malas = resultados.filter((r) => r.falta || r.pct > TOPE);
  for (const r of malas) console.log(r.falta ? `✗ ${r.nombre}: falta en «${r.falta}»` : `✗ ${r.nombre}: ${r.pct.toFixed(2)} % distinto`);
  const maximo = Math.max(0, ...resultados.filter((r) => !r.falta).map((r) => r.pct));
  if (malas.length) {
    console.log(`\n${malas.length} de ${resultados.length} capturas cambiaron (tope ${TOPE} %).`);
    process.exit(1);
  }
  console.log(`Iguales: ${resultados.length} de ${resultados.length} (máximo ${maximo.toFixed(2)} %).`);
}

if (accion === "tomar" && a) await tomar(a, b);
else if (accion === "comparar" && a && b) await comparar(a, b);
else {
  console.log("Uso: node scripts/capturas.mjs tomar <carpeta> [url] | comparar <antes> <después>");
  process.exit(1);
}
