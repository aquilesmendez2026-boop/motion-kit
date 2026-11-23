// Escribe dist/estilos.css con todo el CSS que motion-kit inserta como <style> (para usar con sinInyectarEstilos()).
// Busca en src/ cada `useStyles("id", CONSTANTE)` y cada efecto `<CapaEfecto nombre="x" css={CONSTANTE}>`, y saca el
// valor real de la constante empaquetando el módulo con esbuild (así las partes armadas con ${…} quedan resueltas).
// También escribe estilos-encabezado.css: solo lo que alcanza motion-kit/encabezado (con todos los efectos de fondo,
// porque la receta puede elegir cualquiera).
// Uso: node scripts/generar-css.mjs [--salida ruta]   (por defecto dist/estilos.css)
import { build } from "esbuild";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CACHE } from "./ts.mjs";

const i = process.argv.indexOf("--salida");
const SALIDA = i > 0 ? process.argv[i + 1] : "dist/estilos.css";

const archivos = (d) => readdirSync(d).flatMap((f) => {
  const r = join(d, f);
  return statSync(r).isDirectory() ? archivos(r) : /\.tsx?$/.test(f) ? [resolve(r)] : [];
});

// archivo → [{ id, constante }]
const usos = new Map();
for (const a of archivos("src")) {
  const s = readFileSync(a, "utf8");
  const lista = [];
  for (const m of s.matchAll(/useStyles\(\s*"([\w-]+)"\s*,\s*([A-Za-z_$][\w$]*)\s*\)/g)) lista.push({ id: m[1], constante: m[2] });
  for (const m of s.matchAll(/nombre="([\w-]+)"\s+css=\{([A-Za-z_$][\w$]*)\}/g)) lista.push({ id: `efecto-${m[1]}`, constante: m[2] });
  if (lista.length) usos.set(a, lista);
}

// Un módulo de entrada que importa cada archivo y lee sus constantes, que el plugin deja exportadas.
const nombre = (c) => `__mk_css_${c}`;
let entrada = "";
const tabla = [];
[...usos.entries()].forEach(([a, lista], k) => {
  entrada += `import * as m${k} from ${JSON.stringify(a)};\n`;
  for (const u of lista) tabla.push(`[${JSON.stringify(u.id)}, m${k}.${nombre(u.constante)}]`);
});
entrada += `export const tabla = [${tabla.join(", ")}];\n`;

const exportar = {
  name: "exportar-css",
  setup(b) {
    b.onLoad({ filter: /[\\/]src[\\/].*\.tsx?$/ }, (args) => {
      const lista = usos.get(args.path);
      if (!lista) return undefined;
      const s = readFileSync(args.path, "utf8");
      const constantes = [...new Set(lista.map((u) => u.constante))];
      return { contents: `${s}\nexport { ${constantes.map((c) => `${c} as ${nombre(c)}`).join(", ")} };\n`, loader: args.path.endsWith("x") ? "tsx" : "ts" };
    });
  },
};

mkdirSync(CACHE, { recursive: true });
const salidaJs = join(CACHE, "estilos-css.mjs");
await build({
  stdin: { contents: entrada, resolveDir: resolve("."), loader: "ts" },
  outfile: salidaJs, bundle: true, format: "esm", platform: "node", packages: "external", jsx: "automatic",
  plugins: [exportar], logLevel: "error",
});
const { tabla: filas } = await import(pathToFileURL(salidaJs).href + `?t=${Date.now()}`);

// Los archivos que alcanza la entrada del encabezado (los import() de los efectos se empaquetan adentro).
const { metafile } = await build({
  entryPoints: ["src/entradas/encabezado.ts"], bundle: true, write: false, metafile: true, format: "esm",
  platform: "browser", packages: "external", jsx: "automatic", logLevel: "error",
});
const delEncabezado = new Set(Object.keys(metafile.inputs).map((f) => resolve(f)));
const idsEncabezado = new Set([...usos.entries()].filter(([a]) => delEncabezado.has(a)).flatMap(([, l]) => l.map((u) => u.id)));

// Un bloque por id (el mismo CSS se pide desde varios componentes). Primero la base de estilos, como en la página.
const bloques = new Map();
for (const [id, css] of filas) {
  if (typeof css !== "string") throw new Error(`No se pudo leer el CSS de «${id}».`);
  if (bloques.has(id) && bloques.get(id) !== css) throw new Error(`El id «${id}» tiene dos CSS distintos.`);
  bloques.set(id, css);
}
const ordenar = (xs) => xs.sort((a, b) => (a === "estilos" ? -1 : b === "estilos" ? 1 : a.localeCompare(b)));
function escribir(ruta, ids, que) {
  const texto = `/* motion-kit: ${que}. Generado por scripts/generar-css.mjs.
   Úsalo con sinInyectarEstilos() o con <meta name="motion-kit-estilos" content="archivo">. */\n` +
    ids.map((id) => `\n/* ${id} */\n${bloques.get(id).trim()}\n`).join("");
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, texto);
  console.log(`${ruta}: ${ids.length} bloques, ${(Buffer.byteLength(texto) / 1000).toFixed(1)} KB.`);
}
escribir(SALIDA, ordenar([...bloques.keys()]), "todo el CSS que la librería inserta como <style>");
escribir(join(dirname(SALIDA), "estilos-encabezado.css"), ordenar([...idsEncabezado]), "el CSS de motion-kit/encabezado");
