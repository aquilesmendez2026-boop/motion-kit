import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Landing } from "./plantillas/Landing";
import { Galeria } from "./Galeria";
import { Piezas } from "./Piezas";
import { Estudio } from "./Estudio";
import { Plantilla } from "./Plantilla";
import { Encabezados } from "./Encabezados";
import { Biblioteca } from "./Biblioteca";
import { Vista } from "./Vista";
import { Relatos } from "./Relatos";
import { Pagina } from "./Pagina";
import { Momentos } from "./Momentos";
import { Banco } from "./Banco";
import { ToastProvider } from "../src";
import "./demo.css";

// Navegación mínima por hash: "#landing" muestra la plantilla de ejemplo.
// Sin hash o con «#» solo es la portada (los enlaces «← Demo» y el botón atrás del navegador llegan así).
const RUTAS = /^(#(landing|efectos|piezas|estudio|encabezados(?:\?id=[\w-]+)?|biblioteca|relatos|momentos|pagina(?:\?d=[\w-]*)?|vista\?d=[\w-]*|banco\?d=[\w-]*|plantilla\/[\w-]+)?)?$/;

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
  if (ruta.startsWith("#encabezados")) return <Encabezados key={ruta} id={ruta.startsWith("#encabezados?id=") ? ruta.slice(16) : undefined} />;
  if (ruta === "#biblioteca") return <Biblioteca />;
  if (ruta === "#relatos") return <Relatos />;
  if (ruta === "#momentos") return <Momentos />;
  if (ruta.startsWith("#pagina")) return <Pagina key={ruta} d={ruta.startsWith("#pagina?d=") ? ruta.slice(10) : undefined} />;
  if (ruta.startsWith("#vista?d=")) return <Vista d={ruta.slice(9)} />;
  if (ruta.startsWith("#banco?d=")) return <Banco key={ruta} d={ruta.slice(9)} />;
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
