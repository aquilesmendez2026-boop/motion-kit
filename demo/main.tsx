import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Landing } from "./plantillas/Landing";
import { Galeria } from "./Galeria";
import { Piezas } from "./Piezas";
import { Estudio } from "./Estudio";
import { Plantilla } from "./Plantilla";
import { Encabezados } from "./Encabezados";
import { Vista } from "./Vista";
import { ToastProvider } from "../src";
import "./demo.css";

// Navegación mínima por hash: "#landing" muestra la plantilla de ejemplo.
const RUTAS = /^#(landing|efectos|piezas|estudio|encabezados|vista\?d=[\w-]*|plantilla\/[\w-]+)?$/;

// Navegación mínima por hash. Los enlaces internos de una página (#carta, #contacto) solo desplazan.
function Root() {
  const [ruta, setRuta] = useState(RUTAS.test(window.location.hash) ? window.location.hash : "");

  useEffect(() => {
    const onChange = () => {
      const h = window.location.hash;
      if (RUTAS.test(h)) {
        setRuta(h);
        window.scrollTo(0, 0);
      } else {
        document.getElementById(h.slice(1))?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  if (ruta === "#efectos") return <Galeria />;
  if (ruta === "#piezas") return <Piezas />;
  if (ruta === "#estudio") return <Estudio />;
  if (ruta === "#encabezados") return <Encabezados />;
  if (ruta.startsWith("#vista?d=")) return <Vista d={ruta.slice(9)} />;
  if (ruta.startsWith("#plantilla/")) return <Plantilla id={ruta.slice(11)} />;
  return ruta === "#landing" ? <Landing /> : <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <Root />
    </ToastProvider>
  </StrictMode>
);
