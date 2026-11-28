// Mide el peso comprimido (gzip) de cada entrada del paquete en dist/, como lo bajaría un teléfono: empaqueta la entrada
// con esbuild (minificada, con import() en archivos aparte, react afuera) y comprime con node:zlib.
// «Al cargar» es la entrada y lo que importa fijo; «perezoso» es lo que baja con import() (los efectos de fondo: solo
// el que se use). Corre después de `npm run build`.
// Uso: node scripts/medir-paquete.mjs            → muestra la tabla
//      node scripts/medir-paquete.mjs --revisar  → falla (código 1) si una entrada pasa su tope
import { build } from "esbuild";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = "dist";
const ENTRADAS = ["motion-kit", "encabezado", "pagina", "momentos", "escena", "receta", "director", "partitura", "luz", "interfaz", "comic"];
const CSS = ["estilos.css", "estilos-encabezado.css", "estilos-pagina.css", "estilos-momentos.css", "estilos-luz.css"];

/**
 * Topes en KB gzip de lo que baja al cargar (todas las exportaciones; la app que usa menos baja menos). Medido el
 * 23-11-2026: completo 63,7, encabezado 31,6, escena 14,0 y receta 8,4, con ~10 % de margen. Presupuesto del
 * encabezado al cargar en el celular: 250 KB (cerebro-aquiles/investigaciones/2026-11-23-pesos-web-y-movil.md).
 * Confirmados por Aquiles el 23-11-2026.
 */
// 23-11-2026: momentos 12 (diseño de momentos por bloque, aprobado por Aquiles).
// 23-11-2026: pagina 17 (mide 15,8 sola; sobre el encabezado suma ~7,5), con «hace todo» de Aquiles; motion-kit 80
// (era 70; con los relatos y la biblioteca mide 72,7), elegido por Aquiles.
// 24-11-2026: momentos 13 (era 12; con la segunda tanda mide 12,5: nueve piezas que se bajan aparte, y lo que queda al
// cargar son sus nueve cargadores). Aquiles aprobó hasta 14 como máximo en el diseño de la segunda tanda; se sube solo
// lo que hace falta.
// 24-11-2026: director 10 (entrada nueva del motor de animación; tope del diseño de la fase 1, aprobado por Aquiles).
// 24-11-2026: partitura 9 (entrada nueva: el lenguaje en español y lo de quien crea; no viaja a las páginas públicas).
// Lo fijó Aquiles («tope en 9»); el diseño de la fase 2 del Director proponía 8 y la entrada quedó en 8,1.
// 24-11-2026: luz 8 (entrada nueva: la luz de página y sus superficies, con su CSS adentro). Lo fijó Aquiles al aprobar
// el diseño de «Luz y materia».
// 24-11-2026: momentos 17 (era 13). Lo fijó Aquiles («sube el tope a 17») al aprobar el diseño de «Con el dedo»
// (cuatro piezas más que se bajan aparte; al cargar quedan sus cargadores).
// 25-11-2026: motion-kit 90 (era 80; con los hilos y el encabezado dentro de una partitura mide 80,3). Lo fijó Aquiles
// («sube el tope a 90»).
// 25-11-2026: interfaz 14 (entrada nueva: las piezas de interfaz, para el panel; encargo del front). Y lo que importa el
// panel, `{ Accordion, CountUp }`, menos de 5 KB: el criterio del encargo.
// 26-11-2026: interfaz 20 (decisión de Aquiles: «sí, apruebo el diseño y el tope de 20 KB»; suma las piezas del panel:
// SubirImagen, avisos, Cargando y lo que llega).
// 27-11-2026 (decisiones de Aquiles: «1 sí, 2 sí»): motion-kit 105 (nadie en La Mente importa el paquete entero), interfaz
// 28 (el grupo 1: botón que guarda, copiar, confirmar, campo) y comic 14 (la entrada nueva con el cómic del panel).
export const TOPES_KB = { "motion-kit": 105, encabezado: 35, pagina: 17, momentos: 17, escena: 16, receta: 10, director: 10, partitura: 9, luz: 8, interfaz: 28, comic: 14 };
/** Lo que importa el panel desde `motion-kit/interfaz`, con su tope (KB gzip, al cargar y con lo que no usa descartado). */
const USOS = [
  { nombre: "motion-kit/interfaz { Accordion, CountUp }", entrada: "interfaz", piezas: ["Accordion", "CountUp"], tope: 5 },
  { nombre: "motion-kit/interfaz { SubirImagen }", entrada: "interfaz", piezas: ["SubirImagen"], tope: 4.2 }, // 4 en el diseño; 4,2 por el ADN (forma y ritmo), decisión de Aquiles del 28-11
  { nombre: "motion-kit/interfaz { ToastProvider, useToast }", entrada: "interfaz", piezas: ["ToastProvider", "useToast"], tope: 3.2 }, // 3 en el diseño; 3,1 tras la revisión (Aquiles, 26-11); 3,2 por el ADN (Aquiles, 28-11)
  { nombre: "motion-kit/interfaz { Cargando }", entrada: "interfaz", piezas: ["Cargando"], tope: 2.1 }, // 2 en el diseño; 2,1 por decisión de Aquiles (27-11), al sumarse la entrada comic
  { nombre: "motion-kit/interfaz { ListaViva, Contador, Interruptor }", entrada: "interfaz", piezas: ["ListaViva", "Contador", "Interruptor"], tope: 4 },
  { nombre: "motion-kit/interfaz { BotonQueGuarda }", entrada: "interfaz", piezas: ["BotonQueGuarda"], tope: 2 },
  { nombre: "motion-kit/interfaz { Copiar }", entrada: "interfaz", piezas: ["Copiar"], tope: 1.8 }, // 1,5 en el diseño; 1,7 (Aquiles, 27-11); 1,8 por el ADN (Aquiles, 28-11: «si, sube los topes»)
  { nombre: "motion-kit/interfaz { Campo }", entrada: "interfaz", piezas: ["Campo"], tope: 1.5 },
  { nombre: "motion-kit/interfaz { Confirmar }", entrada: "interfaz", piezas: ["Confirmar"], tope: 4 },
  { nombre: "motion-kit/comic { Mano }", entrada: "comic", piezas: ["Mano"], tope: 3 },
  { nombre: "motion-kit/comic { Vacio }", entrada: "comic", piezas: ["Vacio"], tope: 4 },
  { nombre: "motion-kit/comic { Guia }", entrada: "comic", piezas: ["Guia"], tope: 7 },
  { nombre: "motion-kit/comic { useCelebrar }", entrada: "comic", piezas: ["useCelebrar"], tope: 4 },
];

const kb = (b) => b / 1000;
const gz = (x) => gzipSync(x, { level: 9 }).length;

/** Empaqueta una entrada como lo haría la app que la usa y separa lo que baja al cargar de lo perezoso. */
async function medir(entrada) {
  const r = await build({
    entryPoints: [entrada], bundle: true, splitting: true, format: "esm", minify: true, write: false, metafile: true,
    outdir: "salida", platform: "browser", external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"], logLevel: "error",
  });
  const textos = new Map(r.outputFiles.map((f) => [f.path.slice(f.path.indexOf("salida")), f.contents]));
  const salidas = Object.entries(r.metafile.outputs).filter(([k]) => k.endsWith(".js"));
  // Ojo: esbuild marca como entryPoint también cada import(); la raíz es la de esta entrada.
  const raiz = salidas.find(([, o]) => o.entryPoint === entrada)[0];
  const fijos = new Set();
  const pendientes = [raiz];
  while (pendientes.length) {
    const k = pendientes.pop();
    if (fijos.has(k)) continue;
    fijos.add(k);
    for (const i of r.metafile.outputs[k].imports) if (i.kind === "import-statement" && !i.external) pendientes.push(i.path);
  }
  const suma = (ks) => ks.reduce((t, k) => t + gz(textos.get(k.slice(k.indexOf("salida")))), 0);
  return { alCargar: suma([...fijos]), perezoso: suma(salidas.map(([k]) => k).filter((k) => !fijos.has(k))) };
}

if (!existsSync(join(DIST, "motion-kit.js"))) {
  console.error("Falta dist/: corre primero npm run build.");
  process.exit(1);
}
const filas = [];
let pasados = 0;
for (const e of ENTRADAS) {
  const { alCargar, perezoso } = await medir(join(DIST, `${e}.js`));
  const tope = TOPES_KB[e];
  const pasa = kb(alCargar) > tope;
  if (pasa) pasados++;
  filas.push([`motion-kit${e === "motion-kit" ? "" : "/" + e}`, `${kb(alCargar).toFixed(1)} KB`, `${kb(perezoso).toFixed(1)} KB`, `${tope} KB${pasa ? "  ← se pasa" : ""}`]);
}
// Lo que usa de verdad una app que importa solo algunas piezas (el resto se descarta).
for (const u of USOS) {
  const r = await build({
    stdin: { contents: `import { ${u.piezas.join(", ")} } from "./${DIST}/${u.entrada}.js";\nconsole.log(${u.piezas.join(", ")});`, resolveDir: process.cwd() },
    bundle: true, format: "esm", minify: true, write: false, platform: "browser", external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"], logLevel: "error",
  });
  const peso = gz(r.outputFiles[0].contents);
  const pasa = kb(peso) > u.tope;
  if (pasa) pasados++;
  filas.push([u.nombre, `${kb(peso).toFixed(1)} KB`, "—", `${u.tope} KB${pasa ? "  ← se pasa" : ""}`]);
}
for (const c of CSS) if (existsSync(join(DIST, c))) filas.push([`motion-kit/${c}`, `${kb(gz(readFileSync(join(DIST, c)))).toFixed(1)} KB`, "—", "—"]);

const encabezados = ["Entrada", "Al cargar (gzip)", "Perezoso (gzip)", "Tope"];
const anchos = encabezados.map((h, i) => Math.max(h.length, ...filas.map((f) => f[i].length)));
const linea = (f) => f.map((x, i) => x.padEnd(anchos[i])).join("  ");
console.log(linea(encabezados));
for (const f of filas) console.log(linea(f));
if (process.argv.includes("--revisar") && pasados) {
  console.error(`\n${pasados} entrada(s) pasan su tope.`);
  process.exit(1);
}
