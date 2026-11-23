import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { networkInterfaces } from "node:os";

// La IP de este computador en la Wi-Fi: el QR del editor la usa para abrir la vista desde el teléfono.
const ipLocal = () => Object.values(networkInterfaces()).flat().find((i) => i && i.family === "IPv4" && !i.internal)?.address ?? "";

// `npm run dev` sirve la página demo (index.html).
// `npm run build` genera la librería en dist/ (modo librería).
export default defineConfig(({ command }) => ({
  plugins: [react()],
  define: { __MK_RED__: JSON.stringify(command === "serve" ? ipLocal() : "") },
  build:
    command === "build"
      ? {
          lib: {
            entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
            name: "MotionKit",
            formats: ["es", "cjs"],
            fileName: (format) =>
              format === "es" ? "motion-kit.js" : "motion-kit.cjs",
          },
          rollupOptions: {
            external: ["react", "react-dom", "react/jsx-runtime"],
          },
        }
      : undefined,
}));
