import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";

// La IP de este computador en la Wi-Fi: el QR del editor la usa para abrir la vista desde el teléfono.
const ipLocal = () => Object.values(networkInterfaces()).flat().find((i) => i && i.family === "IPv4" && !i.internal)?.address ?? "";

// `npm run dev` sirve la página demo (index.html).
// `npm run build` genera la librería en dist/ (modo librería, una entrada por subpaquete).
// `npm run demo:armar` arma la demo en dist-demo/ (`--mode demo`) y `npm run demo:servir` la sirve en el 4173: las pruebas
// visuales corren más rápido contra la demo armada que contra el servidor de desarrollo.
export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  define: { __MK_RED__: JSON.stringify(command === "serve" ? ipLocal() : "") },
  build:
    mode === "demo"
      ? { outDir: "dist-demo", emptyOutDir: true }
      : command === "build"
      ? {
          // Entradas separadas: quien importa motion-kit/encabezado baja solo lo del encabezado.
          lib: {
            entry: {
              "motion-kit": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
              encabezado: fileURLToPath(new URL("./src/entradas/encabezado.ts", import.meta.url)),
              escena: fileURLToPath(new URL("./src/entradas/escena.ts", import.meta.url)),
              pagina: fileURLToPath(new URL("./src/entradas/pagina.ts", import.meta.url)),
              momentos: fileURLToPath(new URL("./src/entradas/momentos.ts", import.meta.url)),
              director: fileURLToPath(new URL("./src/entradas/director.ts", import.meta.url)),
              partitura: fileURLToPath(new URL("./src/entradas/partitura.ts", import.meta.url)),
              luz: fileURLToPath(new URL("./src/entradas/luz.ts", import.meta.url)),
              interfaz: fileURLToPath(new URL("./src/entradas/interfaz.ts", import.meta.url)),
              comic: fileURLToPath(new URL("./src/entradas/comic.ts", import.meta.url)),
              receta: fileURLToPath(new URL("./src/receta/index.ts", import.meta.url)),
            },
            formats: ["es", "cjs"],
            fileName: (format, entrada) => `${entrada}.${format === "es" ? "js" : "cjs"}`,
          },
          rollupOptions: {
            external: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
          },
        }
      : undefined,
}));
