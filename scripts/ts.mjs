// Corre TypeScript del repo en Node sin dependencias nuevas: lo empaqueta con el esbuild que ya trae Vite.
// Los paquetes (react, node:test…) quedan afuera y se cargan desde node_modules.
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const CACHE = resolve("node_modules/.cache/motion-kit");

/** Empaqueta `entrada` (un .ts) a un .mjs en la caché y devuelve su ruta. */
export async function empaquetar(entrada, carpeta = CACHE) {
  mkdirSync(carpeta, { recursive: true });
  const salida = join(carpeta, basename(entrada).replace(/\.tsx?$/, ".mjs"));
  await build({
    entryPoints: [entrada],
    outfile: salida,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    packages: "external",
    jsx: "automatic",
    sourcemap: "inline",
    logLevel: "error",
  });
  return salida;
}

/** Importa un módulo .ts del repo. */
export async function importarTs(entrada) {
  return import(pathToFileURL(await empaquetar(entrada)).href + `?t=${Date.now()}`);
}
