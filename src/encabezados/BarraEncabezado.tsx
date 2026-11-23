import { useEffect, useState, type RefObject } from "react";
import { BotonesPack, type EnlaceBoton } from "../piezas/BotonesPack";
import type { PackBotonId } from "../piezas/packs";

/**
 * Salida «barra»: cuando el encabezado ya pasó, aparece una barra fija arriba con el logo (o el nombre) y el mismo botón
 * principal. Mientras el encabezado se ve, la barra está oculta e `inert` (no se enfoca ni se lee): nunca hay dos
 * botones principales a la vez. No es un encabezado (`nav`, sin h1).
 */
export function BarraEncabezado({ objetivo, logo, nombre, boton, pack }: {
  objetivo: RefObject<HTMLElement | null>; logo?: string; nombre: string; boton?: EnlaceBoton; pack: PackBotonId;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = objetivo.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.boundingClientRect.top < 0 && e.intersectionRatio < 0.15), { threshold: [0, 0.15, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [objetivo]);
  return (
    <nav className="mk-enc-barra" aria-label="Barra del negocio" data-visible={visible ? "" : undefined} inert={!visible} aria-hidden={visible ? undefined : true}>
      {logo ? <img className="mk-enc-barra-logo" src={logo} alt={nombre} /> : <span className="mk-enc-barra-nombre">{nombre}</span>}
      {boton && <BotonesPack pack={pack} principal={boton} />}
    </nav>
  );
}
