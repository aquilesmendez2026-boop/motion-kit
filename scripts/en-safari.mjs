// Corre una prueba visual con el motor de Safari (WebKit) en vez del de Chrome, sin tocar la prueba.
// Uso (con `npm run dev` arriba): node scripts/en-safari.mjs <prueba> [parte] [url]
//   por ejemplo: node scripts/en-safari.mjs fotos visor
// Las pruebas están escritas para Chrome: en Safari algunas revisiones fallan sin que haya un error (ver «Safari» en
// docs/CATALOGO.md). Sirve para buscar diferencias de verdad, no como semáforo.
// El WebKit de Playwright va algo atrás del Safari de los teléfonos: no trae, por ejemplo, las animaciones atadas al
// scroll (`animation-timeline`), que Safari tiene desde la versión 26.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const [prueba, ...resto] = process.argv.slice(2);
const origen = `scripts/verificar-${prueba}.mjs`;
if (!prueba || !existsSync(origen)) {
  console.log("Uso: node scripts/en-safari.mjs <prueba> [parte] [url]   (prueba: efectos, fotos, momentos3…)");
  process.exit(1);
}
const url = resto.find((a) => /^https?:/.test(a)) ?? "http://localhost:5173";
const parte = resto.find((a) => !/^https?:/.test(a));
// La misma prueba, lanzando WebKit donde lanzaba Chromium. La copia vive en `scripts/` (ahí resuelve `playwright`)
// y se borra al terminar.
let texto = readFileSync(origen, "utf8").replace(/\bchromium\.launch\(/g, "webkit.launch(");
if (!/import \{[^}]*\bwebkit\b[^}]*\} from "playwright"/.test(texto)) texto = texto.replace(/import \{([^}]*)\} from "playwright"/, 'import {$1, webkit } from "playwright"');
const copia = `scripts/.safari-${prueba}-tmp.mjs`;
writeFileSync(copia, texto);
try {
  const r = spawnSync(process.execPath, [copia, url, ...(parte ? [parte] : [])], { stdio: "inherit" });
  process.exitCode = r.status ?? 1;
} finally {
  rmSync(copia, { force: true });
}
