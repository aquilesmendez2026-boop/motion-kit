// Escribe los contratos desde los catálogos del código:
//   contrato/encabezado-motionkit.json (src/receta/contrato.ts)
//   contrato/pagina-motionkit.json     (src/relatos/contrato-pagina.ts)
//   contrato/partitura-motionkit.json  (src/director/contrato-partitura.ts; versión 0, experimental)
// Uso: node scripts/generar-contrato.mjs            → escribe los archivos
//      node scripts/generar-contrato.mjs --revisar  → falla (código 1) si alguno quedó atrás
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { importarTs } from "./ts.mjs";

const { textoContrato } = await importarTs("src/receta/contrato.ts");
const { textoContratoPagina } = await importarTs("src/relatos/contrato-pagina.ts");
const { textoContratoPartitura } = await importarTs("src/director/contrato-partitura.ts");
const CONTRATOS = [
  ["contrato/encabezado-motionkit.json", textoContrato()],
  ["contrato/pagina-motionkit.json", textoContratoPagina()],
  ["contrato/partitura-motionkit.json", textoContratoPartitura()],
];

let atrasados = 0;
for (const [ruta, nuevo] of CONTRATOS) {
  const actual = existsSync(ruta) ? readFileSync(ruta, "utf8") : "";
  if (process.argv.includes("--revisar")) {
    if (actual !== nuevo) {
      console.error(`${ruta} quedó atrás del código. Corre: npm run contrato`);
      atrasados++;
    } else console.log(`${ruta} al día.`);
  } else {
    mkdirSync("contrato", { recursive: true });
    writeFileSync(ruta, nuevo);
    console.log(actual === nuevo ? `${ruta} sin cambios.` : `${ruta} escrito.`);
  }
}
if (atrasados) process.exit(1);
