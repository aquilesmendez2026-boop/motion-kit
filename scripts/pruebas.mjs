// npm test: empaqueta cada pruebas/*.test.ts y lo corre con node --test (sin librerías de pruebas).
// Uso: node scripts/pruebas.mjs [filtro]   → solo los archivos cuyo nombre contiene el filtro
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { CACHE, empaquetar } from "./ts.mjs";

const filtro = process.argv[2] ?? "";
const archivos = readdirSync("pruebas").filter((f) => f.endsWith(".test.ts") && f.includes(filtro)).sort();
if (!archivos.length) {
  console.error("No hay pruebas que correr.");
  process.exit(1);
}
const salidas = [];
for (const f of archivos) salidas.push(await empaquetar(join("pruebas", f), join(CACHE, "pruebas")));
const r = spawnSync(process.execPath, ["--test", "--enable-source-maps", ...salidas], { stdio: "inherit" });
process.exit(r.status ?? 1);
