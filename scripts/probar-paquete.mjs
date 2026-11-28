// Prueba el paquete como lo usaría La Mente: lo empaqueta con `npm pack`, lo instala en un proyecto de prueba (en la
// caché, sin red) y compila una página que importa solo `motion-kit/encabezado` y su CSS. Revisa que los tipos
// resuelvan, que no se cuele nada del resto del kit y que el CSS exista.
// Uso: node scripts/probar-paquete.mjs   (después de npm run build)
import { build } from "esbuild";
import { gzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { CACHE } from "./ts.mjs";

const P = join(CACHE, "proyecto-prueba");
rmSync(P, { recursive: true, force: true });
mkdirSync(join(P, "node_modules"), { recursive: true });

// 1. npm pack (sin scripts: dist/ ya está construido) y desempacar como node_modules/motion-kit.
const tgz = execFileSync("npm", ["pack", "--ignore-scripts", "--silent", "--pack-destination", P], { encoding: "utf8" }).trim().split("\n").pop();
execFileSync("tar", ["-xzf", join(P, tgz), "-C", P]);
cpSync(join(P, "package"), join(P, "node_modules", "motion-kit"), { recursive: true });
for (const d of ["react", "react-dom", "@types/react", "@types/react-dom"]) {
  mkdirSync(join(P, "node_modules", d, ".."), { recursive: true });
  symlinkSync(resolve("node_modules", d), join(P, "node_modules", d));
}
// Su propio package.json: sin esto, «motion-kit/…» se resuelve al repo mismo (autorreferencia de Node) y no al
// paquete instalado, y la prueba no probaría nada.
writeFileSync(join(P, "package.json"), JSON.stringify({ name: "proyecto-prueba", private: true, type: "module" }));

// 2. Una página que usa solo el encabezado.
writeFileSync(join(P, "pagina.tsx"), `
import { createRoot } from "react-dom/client";
import { Encabezado, EstiloLaMente, recetaAProps, validarReceta, sinInyectarEstilos, type RecetaEncabezado } from "motion-kit/encabezado";
import { PaginaRelato, Relato, validarPagina, FIGURA_IDS, figuraDeRubro, type FiguraId } from "motion-kit/pagina";
import { SellosEstampa, CuentaRegresiva, FechasQueVienen, LlamadoConVida, FuegosArtificiales, CarruselGiratorio, LibroQueSeAbre, CuponQueSeArranca, StickerQueSeDespega, SellosConTimbre, RuletaDePremios, type RuletaDePremiosProps, type FechaQueViene, type EscenaLlamado, type LibroQueSeAbreProps } from "motion-kit/momentos";
import { ConPartitura, validarPartitura, type Partitura } from "motion-kit/director";
import { leerPartitura, escribirPartitura, subirPartitura } from "motion-kit/partitura";
import { Luz, luzDeLaHora, type LuzProps } from "motion-kit/luz";
import "motion-kit/estilos-luz.css";
import "motion-kit/estilos-encabezado.css";
import "motion-kit/estilos-pagina.css";
import "motion-kit/estilos-momentos.css";

sinInyectarEstilos();
const r = validarReceta({ version: 1, estilo: "neon", titulo: "Smash *burgers*", botones: [{ texto: "Pedir", href: "#pedir" }], efecto: "constelacion", iman: true });
const receta: RecetaEncabezado | null = r.ok ? r.receta : null;
const fondo = validarReceta({ version: 2, estilo: "neon", titulo: "Hola", efecto: "bandada" });
const fechas: FechaQueViene[] = [{ fecha: "2026-12-24", titulo: "Cerramos a las 14:00", tipo: "cerrado" }];
const escena: EscenaLlamado = "agenda";
const hojas: LibroQueSeAbreProps["hojas"] = [{ titulo: "Cafés", lineas: [{ texto: "Cortado", precio: "$2.400", agotado: true }] }];
const partitura: Partitura = { version: 1, escenas: [{ con: "verse", pasos: [{ actor: "titulo", por: "palabra", mascara: true, de: { y: "135%" } }] }] };
const vale = validarPartitura(partitura);
const luz: LuzProps = { sigue: ["puntero", "hora"], rango: 0.3, desde: { x: -0.4, y: -0.8 } };
const ruleta: RuletaDePremiosProps = { premios: ["Café gratis", { texto: "10 % menos" }], alGirar: async () => 1, alTerminar: (premio: number | null) => void premio, celebracion: "fuegos" };
// El lenguaje en español: se lee, se escribe y da lo mismo; y una partitura de la versión 0 se sube.
const leida = leerPartitura("al verse:\\n  titulo desde abajo 135%, por palabra, con máscara");
const escrita: string = leida.ok ? escribirPartitura(leida.partitura) : "";
const subida = validarPartitura(subirPartitura({ version: 0, escenas: [{ con: "puntero", pasos: [{ actor: "tarjeta", x: 8 }] }] }));
const p = validarPagina({ version: 1, encabezado: { version: 1, estilo: "neon", titulo: "Hola" }, relato: "carrete", relatoPagina: "figura", figura: figuraDeRubro("cafeteria"), semilla: "cafe-luna", estela: true });
const figuras: FiguraId[] = FIGURA_IDS;
if (receta && p.ok && fondo.ok && vale.ok && leida.ok && escrita && subida.ok) createRoot(document.getElementById("raiz")!).render(
  <EstiloLaMente tema="hamburgueseria" paleta="bosque" base={receta.estilo}>
    <PaginaRelato relato={p.pagina.relato} relatoPagina={p.pagina.relatoPagina} estela={p.pagina.estela} figura={p.pagina.figura ?? figuras[0]} semilla={p.pagina.semilla}>
      <Encabezado {...recetaAProps(receta)} />
      <Relato modo="cuento"><p data-mk-parte="linea">Había una vez…</p></Relato>
      <SellosEstampa total={10} llenos={3} premio="Café gratis" semilla="cafe" />
      <CuentaRegresiva titulo="Noche de vinilos" fecha="2026-12-01" hora="20:00" />
      <FechasQueVienen fechas={fechas} hoy="2026-11-24" respaldo={<p>Fechas</p>} />
      <LlamadoConVida escena={escena} />
      <FuegosArtificiales semilla={7} rafagas={2} alTerminar={() => {}} />
      <CarruselGiratorio etiqueta="Lo más pedido" fichas={[{ titulo: "Cortado", url: "/f.jpg", precio: "$2.400", href: "/carta" }]} respaldo={<p>Carrusel</p>} />
      <LibroQueSeAbre tapa={{ titulo: "La carta" }} hojas={hojas} />
      <CuponQueSeArranca titulo="2×1 en cafés" codigo="CAFE2X1" vence="2026-12-31" alArrancar={() => {}} />
      <StickerQueSeDespega debajo={<b>Un café gratis</b>} forma="cuadrado" alDespegar={() => {}}>Despégame</StickerQueSeDespega>
      <SellosConTimbre total={10} llenos={4} nuevos={1} premio="Café gratis" semilla="cafe" />
      <RuletaDePremios {...ruleta} />
      <ConPartitura partitura={partitura}><h2 data-mk-parte="titulo">Hola</h2></ConPartitura>
      <Luz {...luz}><p>Con luz a las {luzDeLaHora(new Date()).fuerza}</p></Luz>
    </PaginaRelato>
  </EstiloLaMente>
);
`);
// 2b. Un panel que usa solo dos piezas de interfaz (lo que pidió el front de La Mente).
writeFileSync(join(P, "panel-comic.tsx"), `
import { createRoot } from "react-dom/client";
import { BotonQueGuarda } from "motion-kit/interfaz";
import { Guia } from "motion-kit/comic";

createRoot(document.getElementById("raiz")!).render(
  <>
    <BotonQueGuarda alGuardar={() => Promise.resolve()}>Guardar</BotonQueGuarda>
    <Guia abierta pasos={[{ objetivo: "button", texto: "Aquí guardas." }]} />
  </>,
);
`);
// 2c. Un panel con un tema del catálogo (fase 2 de «Un solo motor»).
writeFileSync(join(P, "panel-temas.tsx"), `
import { createRoot } from "react-dom/client";
import { Tema, variablesDeTema } from "motion-kit/temas";

const cuerpo: Record<string, string> = variablesDeTema("taller", { para: "panel" });
createRoot(document.getElementById("raiz")!).render(
  <Tema tema="taller" para="panel"><p data-mk-parte="titulo">{cuerpo["--mk-trazo"]}</p></Tema>,
);
`);
writeFileSync(join(P, "panel-piezas.tsx"), `
import { createRoot } from "react-dom/client";
import { BarraLateral, BotonPanel, TarjetaFila } from "motion-kit/interfaz";

createRoot(document.getElementById("raiz")!).render(
  <>
    <BarraLateral grupos={[{ nombre: "Tu página", color: "#8b5cf6", secciones: [{ id: "precios", nombre: "Precios", icono: "🏷️", insignia: "2" }] }]} actual="precios" alElegir={() => {}} />
    <TarjetaFila titulo="Carta de verano" estado={{ texto: "Publicada", tono: "verde" }} acciones={<BotonPanel tamano="chico">Editar</BotonPanel>} />
    <BotonPanel>Nueva lista</BotonPanel>
  </>,
);
`);
writeFileSync(join(P, "panel-completo.tsx"), `
import { createRoot } from "react-dom/client";
import { Cargando, SubirImagen, ToastProvider, useToast } from "motion-kit/interfaz";

function Vista() {
  const toast = useToast();
  return (
    <Cargando listo forma="tarjeta">
      <SubirImagen etiqueta="Logo" forma="redonda" alElegir={() => toast("Guardado", { tipo: "bien" })} />
    </Cargando>
  );
}
createRoot(document.getElementById("raiz")!).render(<ToastProvider><Vista /></ToastProvider>);
`);
writeFileSync(join(P, "panel.tsx"), `
import { createRoot } from "react-dom/client";
import { Accordion, CountUp, type AccordionItem } from "motion-kit/interfaz";

const preguntas: AccordionItem[] = [{ title: "¿Cómo va el mes?", content: "Bien" }];
createRoot(document.getElementById("raiz")!).render(<><CountUp to={128} /><Accordion items={preguntas} /></>);
`);
writeFileSync(join(P, "tsconfig.json"), JSON.stringify({
  compilerOptions: { target: "ES2020", lib: ["ES2020", "DOM"], module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: false },
  files: ["pagina.tsx", "panel.tsx", "panel-completo.tsx", "panel-comic.tsx", "panel-temas.tsx"],
}));

let fallos = 0;
const ok = (c, m) => { console.log((c ? "ok   " : "FALLA") + " " + m); if (!c) fallos++; };

// 3. Tipos: el proyecto compila contra los .d.ts publicados.
try {
  execFileSync(resolve("node_modules/.bin/tsc"), ["-p", P], { encoding: "utf8", stdio: "pipe" });
  ok(true, "los tipos de motion-kit/encabezado, motion-kit/pagina y motion-kit/momentos resuelven");
} catch (e) {
  ok(false, "los tipos de motion-kit/encabezado, motion-kit/pagina y motion-kit/momentos resuelven:\n" + (e.stdout || e.message));
}

// 4. Empaquetar como lo haría la app (react afuera) y revisar qué entró.
const r = await build({
  entryPoints: [join(P, "pagina.tsx")], absWorkingDir: P, bundle: true, splitting: true, format: "esm", minify: true,
  outdir: join(P, "salida"), metafile: true, write: true, jsx: "automatic", external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
  loader: { ".css": "css" }, logLevel: "error",
});
const entradas = Object.keys(r.metafile.inputs);
if (process.env.VER) console.log(entradas.join("\n"));
const delKit = entradas.filter((f) => f.includes("node_modules/motion-kit/"));
const fuera = delKit.filter((f) => /\/motion-kit\.js$|\/escena\.js$/.test(f));
ok(delKit.length > 0 && fuera.length === 0, "solo entra motion-kit/encabezado (no el paquete completo ni la escena)" + (fuera.length ? ": " + fuera.join(", ") : ""));
console.log("     archivos del kit que entran: " + delKit.map((f) => f.split("/").pop()).join(", "));
const css = Object.keys(r.metafile.outputs).find((f) => f.endsWith(".css"));
ok(Boolean(css) && r.metafile.outputs[css].bytes > 10_000, "el CSS del encabezado viaja como archivo");
ok(Boolean(css) && readFileSync(join(P, css), "utf8").includes(".mk-relato"), "el CSS de la página viaja como archivo");
ok(Boolean(css) && readFileSync(join(P, css), "utf8").includes(".mk-m-sellos-lista"), "el CSS de los momentos viaja como archivo");
const js = Object.entries(r.metafile.outputs).filter(([f]) => f.endsWith(".js")).map(([f]) => f);
const todo = js.map((f) => readFileSync(join(P, f), "utf8")).join("");
for (const pieza of ["mk-peso-barra", "mk-pag-precio"]) ok(!todo.includes(pieza), `no se cuela «${pieza}»`);
ok(existsSync(join(P, "node_modules/motion-kit/contrato/encabezado-motionkit.json")), "el contrato viaja en el paquete");

// 5. El panel: solo entra motion-kit/interfaz, liviano y sin ningún efecto de fondo.
const panel = await build({
  entryPoints: [join(P, "panel.tsx")], absWorkingDir: P, bundle: true, splitting: true, format: "esm", minify: true,
  outdir: join(P, "salida-panel"), metafile: true, write: true, jsx: "automatic", external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"], logLevel: "error",
});
const delKitPanel = Object.keys(panel.metafile.inputs).filter((f) => f.includes("node_modules/motion-kit/"));
const ajenos = delKitPanel.filter((f) => /\/(motion-kit|encabezado|pagina|escena|momentos|director|partitura|luz)\.js$/.test(f));
ok(delKitPanel.length > 0 && ajenos.length === 0, "el panel solo trae motion-kit/interfaz" + (ajenos.length ? ": " + ajenos.join(", ") : ""));
// Lo que baja al cargar el panel: su archivo y lo que importa de entrada. Un import() que quedó en un trozo compartido
// (el efecto «descifrar» de TextoCinetico) sale como archivo aparte, pero solo baja si alguien usa ese efecto.
const salidasPanel = panel.metafile.outputs;
const raizPanel = Object.keys(salidasPanel).find((f) => salidasPanel[f].entryPoint?.endsWith("panel.tsx"));
const alCargar = new Set();
for (const pendientes = [raizPanel]; pendientes.length; ) {
  const f = pendientes.pop();
  if (alCargar.has(f)) continue;
  alCargar.add(f);
  for (const i of salidasPanel[f].imports) if (i.kind === "import-statement" && !i.external) pendientes.push(i.path);
}
const jsPanel = [...alCargar].map((f) => readFileSync(join(P, f)));
const pesoPanel = jsPanel.reduce((t, x) => t + gzipSync(x, { level: 9 }).length, 0) / 1000;
ok(pesoPanel < 5, `el panel con Accordion y CountUp pesa ${pesoPanel.toFixed(1)} KB comprimidos al cargar (menos de 5)`);
// Ningún archivo del panel (ni los perezosos) trae clases de los fondos, escenas, encabezados o relatos.
const textoPanel = Object.keys(salidasPanel).filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(P, f), "utf8")).join("");
for (const pieza of ["mk-lienzo", "mk-capa", "mk-escena", "mk-enc", "mk-relato"]) ok(!textoPanel.includes(pieza), `no se cuela «${pieza}» en el panel`);

// 6. El panel con las piezas nuevas (imágenes, avisos y cargas): también solo motion-kit/interfaz y nada pesado.
const completo = await build({
  entryPoints: [join(P, "panel-completo.tsx")], absWorkingDir: P, bundle: true, splitting: true, format: "esm", minify: true,
  outdir: join(P, "salida-panel-completo"), metafile: true, write: true, jsx: "automatic", external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"], logLevel: "error",
});
const delKitCompleto = Object.keys(completo.metafile.inputs).filter((f) => f.includes("node_modules/motion-kit/"));
const ajenosCompleto = delKitCompleto.filter((f) => /\/(motion-kit|encabezado|pagina|escena|momentos|director|partitura|luz)\.js$/.test(f));
ok(delKitCompleto.length > 0 && ajenosCompleto.length === 0, "el panel con imágenes, avisos y cargas solo trae motion-kit/interfaz" + (ajenosCompleto.length ? ": " + ajenosCompleto.join(", ") : ""));
const textoCompleto = Object.keys(completo.metafile.outputs).filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(P, f), "utf8")).join("");
for (const pieza of ["mk-lienzo", "mk-capa", "mk-escena", "mk-enc", "mk-relato"]) ok(!textoCompleto.includes(pieza), `no se cuela «${pieza}» en el panel con imágenes, avisos y cargas`);
const pesoCompleto = Object.keys(completo.metafile.outputs).filter((f) => f.endsWith(".js")).reduce((t, f) => t + gzipSync(readFileSync(join(P, f)), { level: 9 }).length, 0) / 1000;
ok(pesoCompleto < 10, `el panel con imágenes, avisos y cargas pesa ${pesoCompleto.toFixed(1)} KB comprimidos (menos de 10)`);

// 7. El panel con el cómic: BotonQueGuarda (interfaz) y Guia (comic), sin nada pesado.
const comic = await build({
  entryPoints: [join(P, "panel-comic.tsx")], absWorkingDir: P, bundle: true, splitting: true, format: "esm", minify: true,
  outdir: join(P, "salida-panel-comic"), metafile: true, write: true, jsx: "automatic", external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"], logLevel: "error",
});
const delKitComic = Object.keys(comic.metafile.inputs).filter((f) => f.includes("node_modules/motion-kit/"));
const ajenosComic = delKitComic.filter((f) => /\/(motion-kit|encabezado|pagina|escena|momentos|director|partitura|luz)\.js$/.test(f));
ok(delKitComic.some((f) => f.endsWith("/comic.js")) && ajenosComic.length === 0, "el panel con el cómic solo trae motion-kit/interfaz y motion-kit/comic" + (ajenosComic.length ? ": " + ajenosComic.join(", ") : ""));
const textoComic = Object.keys(comic.metafile.outputs).filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(P, f), "utf8")).join("");
for (const pieza of ["mk-lienzo", "mk-capa", "mk-escena", "mk-enc", "mk-relato"]) ok(!textoComic.includes(pieza), `no se cuela «${pieza}» en el panel con el cómic`);
const pesoComic = Object.keys(comic.metafile.outputs).filter((f) => f.endsWith(".js")).reduce((s, f) => s + gzipSync(readFileSync(join(P, f)), { level: 9 }).length, 0) / 1000;
ok(pesoComic < 10, `el panel con el botón que guarda y la guía pesa ${pesoComic.toFixed(1)} KB comprimidos (menos de 10)`);

// 8. El panel con un tema: solo motion-kit/temas (y lo poco de interfaz que usa), sin nada pesado; la firma va aparte.
const temas = await build({
  entryPoints: [join(P, "panel-temas.tsx")], absWorkingDir: P, bundle: true, splitting: true, format: "esm", minify: true,
  outdir: join(P, "salida-panel-temas"), metafile: true, write: true, jsx: "automatic", external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"], logLevel: "error",
});
const delKitTemas = Object.keys(temas.metafile.inputs).filter((f) => f.includes("node_modules/motion-kit/"));
const ajenosTemas = delKitTemas.filter((f) => /\/(motion-kit|encabezado|pagina|escena|momentos|director|partitura|luz|comic)\.js$/.test(f));
ok(delKitTemas.some((f) => f.endsWith("/temas.js")) && ajenosTemas.length === 0, "el panel con un tema solo trae motion-kit/temas" + (ajenosTemas.length ? ": " + ajenosTemas.join(", ") : ""));
const entradaTemas = Object.entries(temas.metafile.outputs).find(([, o]) => o.entryPoint)?.[0];
const pesoTemas = gzipSync(readFileSync(join(P, entradaTemas)), { level: 9 }).length / 1000;
ok(pesoTemas < 9, `el panel con un tema pesa ${pesoTemas.toFixed(1)} KB comprimidos al cargar (menos de 9; la firma se baja aparte)`);

// 9. El panel con las piezas del panel (fase 3): BotonPanel, TarjetaFila y BarraLateral solo traen motion-kit/interfaz.
const piezas = await build({
  entryPoints: [join(P, "panel-piezas.tsx")], absWorkingDir: P, bundle: true, splitting: true, format: "esm", minify: true,
  outdir: join(P, "salida-panel-piezas"), metafile: true, write: true, jsx: "automatic", external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"], logLevel: "error",
});
const delKitPiezas = Object.keys(piezas.metafile.inputs).filter((f) => f.includes("node_modules/motion-kit/"));
const ajenosPiezas = delKitPiezas.filter((f) => /\/(motion-kit|encabezado|pagina|escena|momentos|director|partitura|luz|comic|temas)\.js$/.test(f));
ok(delKitPiezas.some((f) => f.endsWith("/interfaz.js")) && ajenosPiezas.length === 0, "el panel con BotonPanel, TarjetaFila y BarraLateral solo trae motion-kit/interfaz" + (ajenosPiezas.length ? ": " + ajenosPiezas.join(", ") : ""));
const textoPiezas = Object.keys(piezas.metafile.outputs).filter((f) => f.endsWith(".js")).map((f) => readFileSync(join(P, f), "utf8")).join("");
for (const pieza of ["mk-lienzo", "mk-capa", "mk-escena", "mk-enc", "mk-relato", "mk-subir", "mk-confirmar"]) ok(!textoPiezas.includes(pieza), `no se cuela «${pieza}» en el panel con las piezas del panel`);
const pesoPiezas = Object.keys(piezas.metafile.outputs).filter((f) => f.endsWith(".js")).reduce((s, f) => s + gzipSync(readFileSync(join(P, f)), { level: 9 }).length, 0) / 1000;
ok(pesoPiezas < 6, `el panel con las piezas del panel pesa ${pesoPiezas.toFixed(1)} KB comprimidos (menos de 6)`);

console.log(fallos ? `\n${fallos} fallas` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
