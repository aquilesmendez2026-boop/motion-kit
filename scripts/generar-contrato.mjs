// Escribe los contratos desde los catálogos del código:
//   contrato/encabezado-motionkit.json (src/receta/contrato.ts)
//   contrato/pagina-motionkit.json     (src/relatos/contrato-pagina.ts)
//   contrato/partitura-motionkit.json  (src/director/contrato-partitura.ts; versión 1)
//   contrato/partituras-casa-motionkit.json (src/director/contrato-casa.ts: las partituras de la casa como JSON)
//   contrato/indice.json               (src/director/indice-contratos.ts: la versión del paquete y la lista)
// Uso: node scripts/generar-contrato.mjs            → escribe los archivos
//      node scripts/generar-contrato.mjs --revisar  → falla (código 1) si alguno quedó atrás
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { importarTs } from "./ts.mjs";

const { textoContrato } = await importarTs("src/receta/contrato.ts");
const { textoContratoPagina } = await importarTs("src/relatos/contrato-pagina.ts");
const { textoContratoPartitura } = await importarTs("src/director/contrato-partitura.ts");
const { textoContratoCasa } = await importarTs("src/director/contrato-casa.ts");
const { textoIndiceContratos } = await importarTs("src/director/indice-contratos.ts");
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const CONTRATOS = [
  ["contrato/encabezado-motionkit.json", textoContrato()],
  ["contrato/pagina-motionkit.json", textoContratoPagina()],
  ["contrato/partitura-motionkit.json", textoContratoPartitura()],
  ["contrato/partituras-casa-motionkit.json", textoContratoCasa()],
  ["contrato/indice.json", textoIndiceContratos(version)],
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
