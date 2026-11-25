// Los hilos de una página (rulos, hebras, figura): mide la página, arma el trazado y lo dibuja en un SVG de su mismo
// tamaño, por delante de los bloques. El navegador lo dibuja atado al scroll: después de medir no corre código.
// Se vuelve a medir solo cuando algo cambia de tamaño. Se baja aparte (lo carga `PaginaRelato`).
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { NivelEscena } from "../../escena/nivel";
import { useStyles } from "../../utils/styles";
import type { FiguraId } from "../catalogo";
import { contenedorScroll, medirPagina, MIDIENDO } from "./medir";
import { suave } from "./geometria";
import { MATERIALES, materialDe, paralela, type Capa, type MaterialId } from "./material";
import { FORMAS_RASTRO, RADIO_RASTRO, trazarRastro, type FormaRastro, type Huella } from "./rastro";
import { trazarHilos, type TipoHilo, type Tramo, type Trazado } from "./trazar";

export interface HilosProps {
  pagina: RefObject<HTMLElement | null>;
  tipo: TipoHilo | "rastro";
  /** El `slug` del negocio: decide el lado, los rulos y el giro de la figura. */
  semilla?: string;
  figura?: FiguraId;
  nivel: NivelEscena;
  /** Sin animaciones atadas al scroll (o forzado): el hilo va entero y quieto. */
  sinScroll: boolean;
}

/** Lo que entra corrido o achicado y se mide en su lugar: los relatos, sus partes y lo que la página marca con `data-entrada`. */
const ENTRA = ".mk-pagina[data-mk-midiendo] :is(.mk-relato,.mk-relato-in,[data-mk-parte],[data-mk-palabra],[data-entrada])";
/** El acento: el del estilo del kit o, en una página de La Mente sin él, el suyo. */
const ACENTO = "var(--mk-acento,var(--lm-acento,#e4572e))";

export const CSS_HILOS =
  // Mientras se mide, lo que entra va en su lugar y sin transición (si no, el cambio mismo se animaría y se mediría a
  // medio camino). Al volver, todavía sin transición: así no corre de nuevo. Las animaciones no se tocan (se reiniciarían).
  `${ENTRA}{transition:none!important}` +
  `${ENTRA.replace("[data-mk-midiendo]", "[data-mk-midiendo=si]")}{transform:none!important;translate:none!important;scale:none!important;rotate:none!important}` +
  `.mk-hilos{position:absolute;left:0;top:0;z-index:1;pointer-events:none;overflow:visible;color:${ACENTO}}` +
  ".mk-hilos path{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:0;opacity:.8}" +
  ".mk-hilos circle{fill:currentColor;opacity:.9}" +
  // Las huellas del rastro: rellenas; cada una aparece cuando el scroll llega a ella.
  ".mk-hilos [data-huella] path{fill:currentColor;stroke:none;stroke-dasharray:none;opacity:.9;transform-box:fill-box;transform-origin:center}" +
  "@keyframes mk-hilos-huella{from{opacity:0;scale:1.5}}" +
  // Las capas del material (las del tramo, todas con el mismo tramo del scroll).
  ".mk-hilos [data-capas] path{opacity:1}" +
  // La puntada: un ojal por donde el hilo entra o sale.
  ".mk-hilos circle[data-clase=puntada]{fill:none;stroke:currentColor;stroke-width:1.5}" +
  `.mk-hilos-luz{position:absolute;left:0;top:0;z-index:1;width:12px;height:12px;border-radius:50%;background:currentColor;box-shadow:0 0 14px 2px currentColor;color:${ACENTO};offset-rotate:0deg;opacity:0;pointer-events:none}` +
  "@keyframes mk-hilos-trazo{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}" +
  "@keyframes mk-hilos-sale{from{opacity:0}}" +
  // La luz solo se ve mientras se dibuja su tramo.
  "@keyframes mk-hilos-viaja{0%{offset-distance:0%;opacity:0}.5%{opacity:1}99.5%{opacity:1}100%{offset-distance:100%;opacity:0}}" +
  "@supports (animation-timeline:scroll()){" +
  ".mk-hilos[data-vivo] path{stroke-dashoffset:1;animation:mk-hilos-trazo linear both;animation-timeline:scroll(nearest);animation-range:var(--mk-h-d) var(--mk-h-h)}" +
  ".mk-hilos[data-vivo] circle{animation:mk-hilos-sale linear both;animation-timeline:scroll(nearest);animation-range:var(--mk-h-d) calc(var(--mk-h-d) + 1%)}" +
  ".mk-hilos[data-vivo] [data-huella] path{stroke-dashoffset:0;animation:mk-hilos-huella linear both;animation-timeline:scroll(nearest);animation-range:var(--mk-h-d) calc(var(--mk-h-d) + 1.5%)}" +
  ".mk-hilos-luz[data-vivo]{animation:mk-hilos-viaja linear both;animation-timeline:scroll(nearest);animation-range:var(--mk-h-d) var(--mk-h-h)}" +
  // El final (la llegada y la figura) no va con el scroll: espera a que el remate se vea y se dibuja con tiempo.
  ".mk-hilos[data-vivo] path[data-tiempo]{animation:none;stroke-dashoffset:1}" +
  ".mk-hilos-luz[data-vivo][data-tiempo]{animation:none;opacity:0}" +
  ".mk-hilos[data-vivo][data-final] path[data-tiempo]{animation:mk-hilos-trazo var(--mk-h-dura) linear var(--mk-h-espera) both;animation-timeline:auto;animation-range:normal}" +
  ".mk-hilos-luz[data-vivo][data-final]{animation:mk-hilos-viaja var(--mk-h-dura) linear var(--mk-h-espera) both;animation-timeline:auto;animation-range:normal}}";

const porciento = (n: number) => `${Math.round(n * 100) / 100}%`;
/** Los colores de las capas del material. */
const TINTA: Record<Capa["tinta"], string> = {
  hilo: "currentColor",
  claro: "color-mix(in srgb,currentColor 45%,#fff)",
  fondo: "var(--mk-fondo,var(--lm-fondo,#111))",
  blanco: "#fff",
};
/** Las capas de un tramo con ese material: cada una, su camino (al lado del recorrido, si va corrida). */
const capasDe = (t: Tramo, material: MaterialId) =>
  MATERIALES[material].map((c) => ({ ...c, d: c.lado || c.onda ? suave(paralela(t.puntos, c.lado ?? 0, c.onda ?? 0, c.periodo, c.fase)) : t.d }));
/** Las variables de un tramo: su parte del scroll o, en el final, su tiempo. */
const estiloDe = (t: Tramo) => (t.tiempo ? { "--mk-h-espera": `${t.tiempo.espera}ms`, "--mk-h-dura": `${t.tiempo.dura}ms` } : { "--mk-h-d": porciento(t.desde), "--mk-h-h": porciento(t.hasta) });

export default function Hilos({ pagina, tipo, semilla = "", figura, nivel, sinScroll }: HilosProps) {
  useStyles("hilos", CSS_HILOS);
  const svg = useRef<SVGSVGElement>(null);
  /** Lo último medido: el tamaño de la página, su trazado, si no hay cómo dibujarlo al bajar y el material (el del estilo). */
  const [hilo, setHilo] = useState<{ ancho: number; alto: number; trazado: Trazado; sinBajada: boolean; material: MaterialId; rastro: { forma: FormaRastro; huellas: Huella[] } | null } | null>(null);
  /** Si el remate ya se vio: entonces se dibuja el final. */
  const [final, setFinal] = useState(false);

  useEffect(() => {
    const el = pagina.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let vivo = true;
    let cuadro = 0;
    let espera = 0;
    let firma = "";
    let ancho = window.innerWidth;
    let alto = window.innerHeight;
    const mirados = new Set<Element>();
    /** La primera vez se mide al tiro; después, cuando las cosas se calman (una foto que carga avisa varias veces). */
    let primera = true;
    const pedir = () => {
      if (!vivo || cuadro) return;
      if (primera) {
        primera = false;
        cuadro = requestAnimationFrame(medir);
        return;
      }
      clearTimeout(espera);
      espera = window.setTimeout(() => {
        if (vivo && !cuadro) cuadro = requestAnimationFrame(medir);
      }, 180);
    };
    const ro = new ResizeObserver(pedir);
    /** Mira un elemento una sola vez (mirarlo de nuevo volvería a avisar, y sería un ciclo). */
    const mirar = (e: Element | null) => {
      if (!e || mirados.has(e)) return;
      mirados.add(e);
      ro.observe(e);
    };
    // Los bloques pueden cambiar de orden (o llegar nuevos) sin cambiar de tamaño: eso también se mira. Lo que dibuja
    // este mismo hilo no cuenta.
    const propio = (n: Node) => n instanceof Element && n.matches(".mk-hilos,.mk-hilos *,.mk-hilos-luz");
    const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver((cambios) => {
      if (cambios.some((c) => c.type === "attributes" || (!propio(c.target) && [...c.addedNodes, ...c.removedNodes].some((n) => !propio(n))))) pedir();
    });
    mo?.observe(el, { childList: true, subtree: true });
    // Si cambia el estilo de la página (su material, sus letras, sus rellenos), también se vuelve a medir.
    const estilo = el.closest("[data-mk-estilo]");
    if (estilo) mo?.observe(estilo, { attributes: true, attributeFilter: ["data-mk-estilo", "style", "class"] });
    function medir() {
      cuadro = 0;
      if (!vivo || !el) return;
      const { medidas, bloques, baja } = medirPagina(el);
      // Lo que hizo la medición (el atributo, ida y vuelta) no es un cambio de la página.
      mo?.takeRecords();
      const acento = svg.current ? getComputedStyle(svg.current).color : "";
      // Con «rastro» no hay línea: van las huellas por el mismo recorrido.
      const rastro = tipo === "rastro" ? trazarRastro(medidas, { semilla, acento, figura }) : null;
      const trazado = tipo === "rastro" ? { tramos: [], nudos: [] } : trazarHilos(medidas, { tipo, semilla, figura, acento });
      bloques.forEach(mirar);
      // Solo se vuelve a dibujar si algo cambió de verdad.
      const sinBajada = !(medidas.recorrido > 0) || !baja;
      const material = materialDe(el.closest("[data-mk-estilo]")?.getAttribute("data-mk-estilo"));
      const nueva = JSON.stringify([medidas.ancho, medidas.alto, sinBajada, material, trazado.tramos.map((t) => [t.d, t.desde, t.hasta, t.color, t.tiempo]), trazado.nudos, rastro]);
      if (nueva === firma) return;
      firma = nueva;
      setHilo({ ancho: medidas.ancho, alto: medidas.alto, trazado, sinBajada, material, rastro });
    }
    // La barra del navegador del teléfono cambia el alto de la ventana al bajar: eso no es un cambio de página.
    const tactil = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    const alCambiarVentana = () => {
      if (window.innerWidth === ancho && (tactil ? Math.abs(window.innerHeight - alto) < 120 : window.innerHeight === alto)) return;
      [ancho, alto] = [window.innerWidth, window.innerHeight];
      pedir();
    };
    mirar(el);
    // Lo que hay fuera de la página en el mismo scroll también cambia cuánto se puede bajar.
    mirar(contenedorScroll(el) ?? document.body);
    window.addEventListener("resize", alCambiarVentana);
    document.fonts?.ready.then(pedir, () => {});
    pedir();
    return () => {
      vivo = false;
      cancelAnimationFrame(cuadro);
      clearTimeout(espera);
      ro.disconnect();
      mo?.disconnect();
      window.removeEventListener("resize", alCambiarVentana);
      el.removeAttribute(MIDIENDO);
    };
  }, [pagina, tipo, semilla, figura]);

  // El final se dibuja cuando el remate se ve (una vez).
  const conTiempo = Boolean(hilo?.trazado.tramos.some((t) => t.tiempo));
  useEffect(() => {
    const remate = pagina.current?.querySelector(".mk-hilos-remate");
    if (!conTiempo || final || !remate || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setFinal(true), { threshold: 0.6 });
    io.observe(remate);
    return () => io.disconnect();
  }, [pagina, conTiempo, final]);

  const quieto = nivel === "quieto";
  const material = hilo?.material ?? "linea";
  // Vivo: se dibuja al bajar. Si no (liviano, sin scroll nativo, o una página que no alcanza a bajar), va entero y quieto.
  const vive = Boolean(hilo) && nivel === "completo" && !sinScroll && !hilo?.sinBajada;
  // En quieto no hay hilo: con «figura», solo la figura, dibujada.
  const tramos = hilo ? (quieto ? hilo.trazado.tramos.filter((t) => t.clase === "figura") : hilo.trazado.tramos) : [];
  const nudos = hilo && !quieto ? hilo.trazado.nudos : [];
  const [w, h] = [hilo?.ancho ?? 0, hilo?.alto ?? 0];
  return (
    <>
      <svg ref={svg} className="mk-hilos" aria-hidden="true" data-tipo={tipo} data-forma={hilo?.rastro?.forma} data-material={material} data-vivo={vive ? "" : undefined} data-final={final ? "" : undefined} width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {tramos.map((t, i) =>
          material === "linea" ? (
            <path key={i} data-tramo="" data-clase={t.clase} data-tiempo={t.tiempo ? "" : undefined} d={t.d} pathLength={1} style={{ ...estiloDe(t), color: t.color } as CSSProperties} />
          ) : (
            // El tramo, con las capas de su material. La del recorrido (invisible) es la que miran la luz y las pruebas.
            <g key={i} data-capas="" style={{ color: t.color } as CSSProperties}>
              <path data-tramo="" data-clase={t.clase} data-tiempo={t.tiempo ? "" : undefined} d={t.d} pathLength={1} style={{ ...estiloDe(t), stroke: "none" } as CSSProperties} />
              {capasDe(t, material).map((c, k) => (
                <path key={k} data-tiempo={t.tiempo ? "" : undefined} d={c.d} pathLength={1} style={{ ...estiloDe(t), strokeWidth: c.grosor, stroke: TINTA[c.tinta], strokeOpacity: c.opacidad } as CSSProperties} />
              ))}
            </g>
          ),
        )}
        {hilo?.rastro?.huellas.map((u, i) => (
          <g key={`h${i}`} data-huella="" data-x={u.x.toFixed(1)} data-y={u.y.toFixed(1)} data-radio={(RADIO_RASTRO * u.tamano).toFixed(2)} transform={`translate(${u.x.toFixed(1)} ${u.y.toFixed(1)}) rotate(${u.giro.toFixed(0)}) scale(${u.tamano.toFixed(2)})`} style={{ color: u.color } as CSSProperties}>
            <path d={FORMAS_RASTRO[hilo.rastro!.forma]} style={{ "--mk-h-d": porciento(u.en) } as CSSProperties} />
          </g>
        ))}
        {nudos.map((n, i) => (
          <circle key={i} data-nudo="" data-clase={n.clase} cx={n.x} cy={n.y} r={n.clase === "nudo" ? 4 : 3.5} style={{ "--mk-h-d": porciento(n.en) } as CSSProperties} />
        ))}
      </svg>
      {vive &&
        tramos.map((t, i) => (
          <i key={i} className="mk-hilos-luz" aria-hidden="true" data-vivo="" data-tiempo={t.tiempo ? "" : undefined} data-final={t.tiempo && final ? "" : undefined} style={{ offsetPath: `path("${t.d}")`, ...estiloDe(t), color: t.color } as CSSProperties} />
        ))}
    </>
  );
}
