import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// `npm run dev` sirve la página demo (index.html).
// `npm run build` genera la librería en dist/ (modo librería).
export default defineConfig(({ command }) => ({
  plugins: [react()],
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
