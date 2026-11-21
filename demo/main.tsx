import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Landing } from "./plantillas/Landing";
import { ToastProvider } from "../src";
import "./demo.css";

// Navegación mínima por hash: "#landing" muestra la plantilla de ejemplo.
function Root() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return hash === "#landing" ? <Landing /> : <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <Root />
    </ToastProvider>
  </StrictMode>
);
