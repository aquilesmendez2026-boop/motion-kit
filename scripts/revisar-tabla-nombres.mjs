// Revisa que la tabla de nombres (docs/un-solo-motor/tabla-de-nombres.md) cubra cada variable de La Mente que usa el
// front (`--lm-*` y `--lmt-*`) y cada tema del panel (`data-tema-panel`). Lee el front sin tocarlo.
// Uso: `npm run tabla` (busca ../lamente-front) o `node scripts/revisar-tabla-nombres.mjs --front=<carpeta>`.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const arg = process.argv.find((a) => a.startsWith("--front="));
const front = arg ? arg.slice(8) : join(process.cwd(), "..", "lamente-front");
if (!existsSync(front)) {
  console.log(`No encontré el front en ${front}: no hay nada que revisar.`);
  process.exit(0);
}

const CARPETAS = ["packages/ui/src", "fronts/pagina-publica/src", "fronts/panel/src"];
const leerTodo = (dir, salida = []) => {
  if (!existsSync(dir)) return salida;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (n === "node_modules") continue;
    if (statSync(p).isDirectory()) leerTodo(p, salida);
    else if (/\.(tsx?|css)$/.test(n) && !/\.test\./.test(n)) salida.push(p);
  }
  return salida;
};
const archivos = CARPETAS.flatMap((c) => leerTodo(join(front, c)));

const variables = new Set();
const temas = new Set();
for (const a of archivos) {
  // Sin comentarios: un ejemplo en un comentario no es una variable ni un tema de verdad.
  const t = readFileSync(a, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const m of t.matchAll(/--lmt?-[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*/g)) variables.add(m[0]);
  for (const m of t.matchAll(/data-tema-panel="?([a-z][a-z-]*)/g)) temas.add(m[1]);
}

const tabla = readFileSync(join(process.cwd(), "docs/un-solo-motor/tabla-de-nombres.md"), "utf8");
const enTabla = new Set([...tabla.matchAll(/`(--lmt?-[a-zA-Z0-9-]+)`/g)].map((m) => m[1]));
const filaPanel = tabla.split("\n").find((l) => l.startsWith("| Panel: `data-tema-panel`")) ?? "";
const temasEnTabla = new Set(filaPanel.split("|")[2]?.split(",").map((s) => s.trim()) ?? []);

const faltan = [...variables].filter((v) => !enTabla.has(v)).sort();
const temasFaltan = [...temas].filter((t) => !temasEnTabla.has(t)).sort();
if (faltan.length || temasFaltan.length) {
  if (faltan.length) console.log(`Variables del front que no están en la tabla (${faltan.length}): ${faltan.join(", ")}`);
  if (temasFaltan.length) console.log(`Temas del panel que no están en la tabla (${temasFaltan.length}): ${temasFaltan.join(", ")}`);
  console.log("Súmalas a docs/un-solo-motor/tabla-de-nombres.md con su destino.");
  process.exit(1);
}
console.log(`La tabla cubre ${variables.size} variables y ${temas.size} temas del panel (0 sin destino escrito).`);
