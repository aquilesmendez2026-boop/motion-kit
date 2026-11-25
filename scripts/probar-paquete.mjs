// Prueba el paquete como lo usaría La Mente: lo empaqueta con `npm pack`, lo instala en un proyecto de prueba (en la
// caché, sin red) y compila una página que importa solo `motion-kit/encabezado` y su CSS. Revisa que los tipos
// resuelvan, que no se cuele nada del resto del kit y que el CSS exista.
// Uso: node scripts/probar-paquete.mjs   (después de npm run build)
import { build } from "esbuild";
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
writeFileSync(join(P, "tsconfig.json"), JSON.stringify({
  compilerOptions: { target: "ES2020", lib: ["ES2020", "DOM"], module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, noEmit: true, skipLibCheck: false },
  files: ["pagina.tsx"],
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

console.log(fallos ? `\n${fallos} fallas` : "\ntodo bien");
process.exit(fallos ? 1 : 0);
