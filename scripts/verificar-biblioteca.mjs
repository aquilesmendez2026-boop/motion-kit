// Revisa la biblioteca de diseños (#biblioteca) y su unión con el editor (#encabezados).
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-biblioteca.mjs [http://localhost:5173]`.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const base = (process.argv[2] ?? "http://localhost:5173").replace(/\/$/, "");
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
const p = await contexto.newPage();
const errores = [];
p.on("pageerror", (e) => errores.push(e.message));
// Cambiar solo el hash no recarga la página: se recarga para leer de nuevo lo guardado.
const ir = async (hash) => {
  await p.goto(base + "/" + hash);
  await p.reload();
  await p.waitForTimeout(800);
};
const tarjetas = () => p.locator(".bib-tarjeta");

await ir("#biblioteca");
await p.evaluate(() => localStorage.removeItem("motion-kit:biblioteca"));
await ir("#biblioteca");
revisar((await p.locator(".bib-vacia").count()) === 1, "vacía al partir, con su mensaje");

// Ejemplos, filtros y miniaturas
await p.locator("[data-prueba=ejemplos]").click();
await p.waitForTimeout(1200);
revisar((await tarjetas().count()) === 10, "cargar ejemplos deja 10 diseños, uno por rubro");
revisar((await p.locator(".bib-mini .mk-enc").count()) === 10, "cada diseño tiene su miniatura con el encabezado");
const escala = Number(await p.locator(".bib-mini-lienzo").first().evaluate((e) => getComputedStyle(e.parentElement).getPropertyValue("--escala")));
revisar(escala > 0.15 && escala < 0.6, `la miniatura se achica al ancho de la tarjeta (escala ${escala.toFixed(2)})`);
await p.locator("[data-prueba=f-rubro]").selectOption("barberia");
revisar((await tarjetas().count()) === 1, "filtrar por rubro");
await p.locator("[data-prueba=f-rubro]").selectOption("");
await p.locator("[data-prueba=buscar]").fill("hamburgues");
revisar((await tarjetas().count()) === 1, "buscar por nombre sin importar tildes");
await p.locator("[data-prueba=buscar]").fill("");

// Estados y duplicar
const primera = tarjetas().first();
const nombre1 = await primera.locator("h2").innerText();
await primera.locator("[data-prueba=aprobar]").click();
await p.waitForTimeout(300);
revisar((await p.locator(".bib-tarjeta[data-estado=aprobado]").count()) === 1, "aprobar un diseño");
await p.locator(".bib-tarjeta[data-estado=aprobado] [data-prueba=duplicar]").click();
await p.waitForTimeout(300);
revisar((await tarjetas().count()) === 11 && (await p.getByText(`${nombre1} (copia)`).count()) === 1, "duplicar deja una copia en borrador");
await p.locator(".bib-tarjeta", { hasText: `${nombre1} (copia)` }).locator("[data-prueba=archivar]").click();
await p.waitForTimeout(300);
revisar((await tarjetas().count()) === 10, "lo archivado sale de la lista activa");
await p.locator("[data-prueba=f-estado]").selectOption("archivado");
revisar((await tarjetas().count()) === 1, "y aparece al filtrar por archivados");
await p.locator(".bib-tarjeta [data-prueba=borrar]").click();
await p.locator(".bib-tarjeta [data-prueba=borrar-si]").click();
await p.waitForTimeout(300);
revisar((await tarjetas().count()) === 0, "borrar pide confirmar y borra");
await p.locator("[data-prueba=f-estado]").selectOption("");

// Exportar, vaciar, importar
const [descarga] = await Promise.all([p.waitForEvent("download"), p.locator("[data-prueba=exportar]").click()]);
const ruta = await descarga.path();
const exportado = JSON.parse(readFileSync(ruta, "utf8"));
revisar(exportado.formato === "motion-kit/biblioteca" && exportado.disenos.length === 10, "exportar baja un .json con los 10 diseños");
await p.evaluate(() => localStorage.removeItem("motion-kit:biblioteca"));
await ir("#biblioteca");
await p.locator("[data-prueba=importar]").setInputFiles(ruta);
await p.waitForTimeout(800);
revisar((await tarjetas().count()) === 10, "importar en un navegador vacío devuelve los 10");
revisar(/Se sumaron 10/.test(await p.locator("[data-prueba=aviso]").innerText()), "importar avisa cuántos sumó");
revisar((await p.locator(".bib-tarjeta[data-estado=aprobado]").count()) === 1, "importar conserva el estado aprobado");
await p.locator("[data-prueba=importar]").setInputFiles({ name: "malo.json", mimeType: "application/json", buffer: Buffer.from("{no") });
await p.waitForTimeout(300);
revisar(/no es un JSON/.test(await p.locator("[data-prueba=aviso]").innerText()), "un archivo malo da su error en español");

// Abrir en el editor: lo que se ve es lo guardado
const aprobado = p.locator(".bib-tarjeta[data-estado=aprobado]");
const id = await aprobado.getAttribute("data-diseno");
const recetaGuardada = exportado.disenos.find((d) => d.id === id).receta;
await aprobado.locator("[data-prueba=abrir]").click();
await p.waitForTimeout(1500);
revisar(p.url().endsWith(`#encabezados?id=${id}`), "abrir lleva al editor con el id");
const enEditor = JSON.parse(await p.locator("[data-prueba=json]").textContent());
revisar(JSON.stringify(enEditor) === JSON.stringify(recetaGuardada), "el editor abre la receta tal como estaba");
revisar((await p.locator("[data-prueba=bib-nombre]").inputValue()) === nombre1, "y con su nombre");

// Cambiar y guardar: el aprobado vuelve a borrador
await p.locator("[data-campo=titulo]").fill("Título *nuevo* del diseño");
await p.locator("[data-prueba=bib-guardar]").click();
await p.waitForTimeout(500);
revisar(/vuelve a borrador/.test(await p.locator("[data-prueba=bib-aviso]").innerText()), "guardar cambios de un aprobado lo devuelve a borrador");
await p.locator("[data-prueba=bib-nombre]").fill("Diseño nuevo de prueba");
await p.locator("[data-prueba=bib-etiquetas]").fill("prueba, Noche");
await p.locator("[data-prueba=bib-guardar-nuevo]").click();
await p.waitForTimeout(500);
await ir("#biblioteca");
revisar((await tarjetas().count()) === 11, "guardar como nuevo suma un diseño");
const nuevo = p.locator(".bib-tarjeta", { hasText: "Diseño nuevo de prueba" });
revisar((await nuevo.locator(".bib-etiquetas").innerText()).includes("#noche"), "con sus etiquetas limpias");
revisar((await nuevo.locator(".mk-enc-titulo").innerText()).includes("nuevo"), "y su miniatura muestra el título nuevo");
await ir("#encabezados?id=no-existe");
await p.waitForTimeout(500);
revisar(/ya no está/.test(await p.locator("[data-prueba=bib-aviso]").innerText()), "un id que no existe se avisa");

revisar(errores.length === 0, `sin errores en la página${errores.length ? ": " + errores.join(" | ") : ""}`);
await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron` : "\nTodo bien");
process.exit(fallas ? 1 : 0);
