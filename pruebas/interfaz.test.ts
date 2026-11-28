// motion-kit/interfaz: la entrada liviana con las piezas de interfaz (encargo del front, para el panel de cada negocio).
// Empaqueta como lo haría una app y revisa que no arrastre lo pesado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { gzipSync } from "node:zlib";

const ENTRADA = "src/entradas/interfaz.ts";
/** Lo que no puede viajar con las piezas de interfaz: los fondos, las escenas, los encabezados, los relatos y los registros. */
const PESADO = /src\/(efectos|escena|encabezados|relatos|receta|director|partitura|momentos|fotos|luz)\/|registro/;

/** Empaqueta lo que importa una app («import { … } from "motion-kit/interfaz"») y entrega su peso y los archivos que trae. */
async function usar(nombres: string[]) {
  const r = await build({
    stdin: { contents: `import { ${nombres.join(", ")} } from "./${ENTRADA}";\nconsole.log(${nombres.join(", ")});`, resolveDir: process.cwd(), loader: "ts" },
    bundle: true, format: "esm", minify: true, write: false, metafile: true, platform: "browser", logLevel: "error",
    external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
  });
  return { kb: gzipSync(r.outputFiles[0].contents, { level: 9 }).length / 1000, archivos: Object.keys(r.metafile.inputs) };
}

test("interfaz: Accordion y CountUp pesan menos de 5 KB comprimidos y no traen nada pesado", async () => {
  const { kb, archivos } = await usar(["Accordion", "CountUp"]);
  assert.ok(kb < 5, `pesan ${kb.toFixed(1)} KB`);
  const pesados = archivos.filter((a) => PESADO.test(a));
  assert.deepEqual(pesados, [], `traen: ${pesados.join(", ")}`);
});

test("interfaz: SubirImagen sola pesa menos de 4,8 KB y no trae nada pesado", async () => {
  const { kb, archivos } = await usar(["SubirImagen"]);
  assert.ok(kb < 4.8, `pesa ${kb.toFixed(2)} KB`); // 4,2 por el ADN (Aquiles, 28-11); 4,8 por las conductas del panel (fase 3)
  assert.deepEqual(archivos.filter((a) => PESADO.test(a)), []);
});

test("interfaz: trae todas las piezas y los hooks pedidos, y ninguna arrastra lo pesado", async () => {
  const PIEZAS = [
    "Accordion", "CountUp", "Reveal", "Stagger", "Presencia", "Skeleton", "Pressable", "Ripple", "Tabs", "TabBar", "BottomSheet",
    "ToastProvider", "useToast", "Tarjeta", "TarjetaCuerpo", "TarjetaMedia", "GlowBorder", "ShinyButton", "TextoCinetico",
    "SplitText", "Typewriter", "WordRotate", "useReducedMotion", "useInView", "useScrollProgress", "useViewTransition", "transicionVista",
    "SubirImagen", "variablesTema", "Cargando", "ListaViva", "Contador", "Interruptor", "BotonQueGuarda", "Copiar", "Campo", "Confirmar",
  ];
  const modulo = await import("../src/entradas/interfaz");
  const faltan = PIEZAS.filter((p) => !(p in modulo));
  assert.deepEqual(faltan, [], `faltan: ${faltan.join(", ")}`);
  const { kb, archivos } = await usar(PIEZAS);
  const pesados = archivos.filter((a) => PESADO.test(a));
  assert.deepEqual(pesados, [], `traen: ${pesados.join(", ")}`);
  // Todas juntas, igual livianas (el tope de la entrada lo revisa medir-paquete).
  assert.ok(kb < 28, `todas juntas pesan ${kb.toFixed(1)} KB`);
});
