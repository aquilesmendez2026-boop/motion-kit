// Escribe contrato/encabezado-motionkit.json desde los catálogos del código (src/receta/contrato.ts).
// Uso: node scripts/generar-contrato.mjs            → escribe el archivo
//      node scripts/generar-contrato.mjs --revisar  → falla (código 1) si el archivo quedó atrás
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { importarTs } from "./ts.mjs";

const RUTA = "contrato/encabezado-motionkit.json";
const { textoContrato } = await importarTs("src/receta/contrato.ts");
const nuevo = textoContrato();
const actual = existsSync(RUTA) ? readFileSync(RUTA, "utf8") : "";

if (process.argv.includes("--revisar")) {
  if (actual !== nuevo) {
    console.error(`${RUTA} quedó atrás del código. Corre: npm run contrato`);
    process.exit(1);
  }
  console.log(`${RUTA} al día.`);
} else {
  mkdirSync("contrato", { recursive: true });
  writeFileSync(RUTA, nuevo);
  console.log(actual === nuevo ? `${RUTA} sin cambios.` : `${RUTA} escrito.`);
}
