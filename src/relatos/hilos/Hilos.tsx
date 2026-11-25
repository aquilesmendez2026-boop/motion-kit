// Los hilos de una página (rulos, hebras, figura, rastro, enredadera): mide la página, arma el trazado y lo dibuja en un SVG de su mismo
// tamaño, por delante de los bloques. El navegador lo dibuja atado al scroll: después de medir no corre código, salvo
// el viento de la enredadera (mientras la página se mueve). Se vuelve a medir solo cuando algo cambia de tamaño. Se baja
// aparte (lo carga `PaginaRelato`).
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { NivelEscena } from "../../escena/nivel";
import { useStyles } from "../../utils/styles";
import type { FiguraId } from "../catalogo";
import { contenedorScroll, CSS_MIDIENDO, medirPagina, MIDIENDO } from "./medir";
import { suave } from "./geometria";
import { MATERIALES, materialDe, paralela, type Capa, type MaterialId } from "./material";
import { FORMA_HOJA, FORMA_PETALO, REBOTE, TOPE_MECE, trazarEnredadera, type Hoja } from "./enredadera";
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

/** El acento: el del estilo del kit o, en una página de La Mente sin él, el suyo. */
const ACENTO = "var(--mk-acento,var(--lm-acento,#e4572e))";

export const CSS_HILOS =
  `.mk-hilos{position:absolute;left:0;top:0;z-index:1;pointer-events:none;overflow:visible;color:${ACENTO}}` +
  ".mk-hilos path{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:0;opacity:.8}" +
  ".mk-hilos circle{fill:currentColor;opacity:.9}" +
  // Las huellas del rastro: rellenas; cada una aparece cuando el scroll llega a ella.
  ".mk-hilos [data-huella] path{fill:currentColor;stroke:none;stroke-dasharray:none;opacity:.9;transform-box:fill-box;transform-origin:center}" +
  "@keyframes mk-hilos-huella{from{opacity:0;scale:1.5}}" +
  // La enredadera: hojas y pétalos rellenos, que brotan desde su base (el origen de cada uno). Las hojas se mecen con
  // el viento que deja el scroll (`--mk-viento`, en grados; cada una con su fuerza).
  ".mk-hilos :is([data-hoja],[data-flor]) path{fill:currentColor;stroke:none;stroke-dasharray:none;opacity:.85;transform-origin:0 0}" +
  ".mk-hilos [data-flor] circle{fill:color-mix(in srgb,currentColor 35%,#fff);opacity:1;transform-origin:0 0}" +
  ".mk-hilos [data-mece]{transform-origin:0 0;rotate:calc(var(--mk-viento,0)*var(--mk-mece,0)*1deg)}" +
  "@keyframes mk-hilos-brota{from{opacity:0;scale:0}}" +
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
  ".mk-hilos[data-vivo] [data-hoja] path{stroke-dashoffset:0;animation:mk-hilos-brota linear both;animation-timeline:scroll(nearest);animation-range:var(--mk-h-d) calc(var(--mk-h-d) + 2%)}" +
  // Las hojas del final y la flor esperan a que el remate se vea; después brotan y se abren con tiempo.
  ".mk-hilos[data-vivo] :is([data-hoja][data-tiempo] path,[data-flor] path,[data-flor] circle){animation:none;opacity:0}" +
  ".mk-hilos[data-vivo][data-final] [data-hoja][data-tiempo] path{opacity:.85;animation:mk-hilos-brota var(--mk-h-dura) ease-out var(--mk-h-espera) both;animation-timeline:auto;animation-range:normal}" +
  ".mk-hilos[data-vivo][data-final] [data-flor] path{opacity:.85;animation:mk-hilos-brota 520ms cubic-bezier(.3,1.4,.5,1) var(--mk-h-espera) both;animation-timeline:auto;animation-range:normal}" +
  ".mk-hilos[data-vivo][data-final] [data-flor] circle{opacity:1;animation:mk-hilos-brota 420ms cubic-bezier(.3,1.4,.5,1) var(--mk-h-espera) both;animation-timeline:auto;animation-range:normal}" +
  // El final (la llegada y la figura) no va con el scroll: espera a que el remate se vea y se dibuja con tiempo.
  ".mk-hilos[data-vivo] path[data-tiempo]{animation:none;stroke-dashoffset:1}" +
  ".mk-hilos-luz[data-vivo][data-tiempo]{animation:none;opacity:0}" +
  ".mk-hilos[data-vivo][data-final] path[data-tiempo]{animation:mk-hilos-trazo var(--mk-h-dura) linear var(--mk-h-espera) both;animation-timeline:auto;animation-range:normal}" +
  ".mk-hilos-luz[data-vivo][data-final]{animation:mk-hilos-viaja var(--mk-h-dura) linear var(--mk-h-espera) both;animation-timeline:auto;animation-range:normal}}";

const porciento = (n: number) => `${Math.round(n * 100) / 100}%`;
/** Con qué velocidad de bajada (px/s) las hojas se pliegan del todo (`TOPE_MECE`). */
const VIENTO_LLENO = 1800;
/** Cada cuánto se abre un pétalo después del anterior (ms). */
const PETALO_TRAS_PETALO = 70;
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
  useStyles("hilos-medir", CSS_MIDIENDO);
  useStyles("hilos", CSS_HILOS);
  const svg = useRef<SVGSVGElement>(null);
  /** Lo último medido: el tamaño de la página, su trazado, si no hay cómo dibujarlo al bajar y el material (el del estilo). */
  const [hilo, setHilo] = useState<{ ancho: number; alto: number; trazado: Trazado; sinBajada: boolean; material: MaterialId; rastro: { forma: FormaRastro; huellas: Huella[] } | null; hojas: Hoja[] } | null>(null);
  /** Si el remate ya se vio (y lo de arriba ya se dibujó): entonces se dibuja el final. */
  const [final, setFinal] = useState(false);
  /** Las hojas de la enredadera: ahí va el viento (así cada cuadro solo recalcula las hojas, no todo el dibujo). */
  const grupoHojas = useRef<SVGGElement>(null);
  // Otro hilo, otro final: parte de cero.
  useEffect(() => setFinal(false), [tipo]);

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
      // Con «enredadera», el tallo (el recorrido de los rulos, hasta la flor) y sus hojas.
      const enredadera = tipo === "enredadera" ? trazarEnredadera(medidas, { semilla, acento }) : null;
      const trazado = enredadera ? enredadera.trazado : tipo === "rastro" ? { tramos: [], nudos: [] } : trazarHilos(medidas, { tipo, semilla, figura, acento });
      const hojas = enredadera?.hojas ?? [];
      bloques.forEach(mirar);
      // Solo se vuelve a dibujar si algo cambió de verdad.
      const sinBajada = !(medidas.recorrido > 0) || !baja;
      const material = materialDe(el.closest("[data-mk-estilo]")?.getAttribute("data-mk-estilo"));
      const nueva = JSON.stringify([medidas.ancho, medidas.alto, sinBajada, material, trazado.tramos.map((t) => [t.d, t.desde, t.hasta, t.color, t.tiempo]), trazado.nudos, rastro, trazado.flor, hojas]);
      if (nueva === firma) return;
      firma = nueva;
      setHilo({ ancho: medidas.ancho, alto: medidas.alto, trazado, sinBajada, material, rastro, hojas });
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

  // El final se dibuja cuando el remate se ve (una vez), y no antes de que lo último del hilo que va con el scroll esté
  // entero: si ese tramo se dibuja tarde, la llegada y la flor esperan.
  const conTiempo = Boolean(hilo?.trazado.tramos.some((t) => t.tiempo) || hilo?.trazado.flor);
  useEffect(() => {
    const remate = pagina.current?.querySelector(".mk-hilos-remate");
    if (!conTiempo || final || !remate || typeof IntersectionObserver === "undefined") return;
    let visto = false;
    let cuadro = 0;
    const entero = () => {
      const ultimo = [...(svg.current?.querySelectorAll("path[data-tramo]:not([data-tiempo])") ?? [])].pop();
      return !ultimo || (parseFloat(getComputedStyle(ultimo).strokeDashoffset) || 0) < 0.02;
    };
    const mirar = () => {
      cuadro = 0;
      if (visto && entero()) setFinal(true);
    };
    const pedir = () => {
      if (visto && !cuadro) cuadro = requestAnimationFrame(mirar);
    };
    const io = new IntersectionObserver((e) => {
      visto = e.some((x) => x.isIntersecting);
      pedir();
    }, { threshold: 0.6 });
    io.observe(remate);
    document.addEventListener("scroll", pedir, { capture: true, passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(cuadro);
      document.removeEventListener("scroll", pedir, { capture: true });
    };
  }, [pagina, conTiempo, final, hilo]);

  const quieto = nivel === "quieto";
  const material = hilo?.material ?? "linea";
  // Vivo: se dibuja al bajar. Si no (liviano, sin scroll nativo, o una página que no alcanza a bajar), va entero y quieto.
  const vive = Boolean(hilo) && nivel === "completo" && !sinScroll && !hilo?.sinBajada;
  // En quieto no hay hilo: con «figura», solo la figura, dibujada.
  const tramos = hilo ? (quieto ? hilo.trazado.tramos.filter((t) => t.clase === "figura") : hilo.trazado.tramos) : [];
  const nudos = hilo && !quieto ? hilo.trazado.nudos : [];
  // En quieto, de la enredadera queda la flor (abierta): sin tallo, no hay hojas.
  const hojas = hilo && !quieto ? hilo.hojas : [];
  const flor = hilo?.trazado.flor;
  const mece = vive && tipo === "enredadera" && hojas.length > 0;

  // Las hojas se mecen con el viento del scroll: mientras más rápido se baja (o se sube), más se pliegan hacia el tallo,
  // y al parar vuelven meciéndose (un resorte). Solo corre mientras se mueven; en reposo no hay variable.
  useEffect(() => {
    const s = grupoHojas.current;
    const el = pagina.current;
    if (!mece || !s || !el || typeof requestAnimationFrame === "undefined") return;
    /** Lo que hace scroll: lo dice el último evento (la ventana, el `body` o un contenedor que envuelve la página). */
    let fuente: Element | null = null;
    const leer = () => (fuente && fuente !== document.scrollingElement ? fuente.scrollTop : window.scrollY);
    let cuadro = 0;
    let antes = 0;
    let ultimaY = leer();
    let viento = 0;
    let rapidez = 0;
    const paso = (t: number) => {
      cuadro = 0;
      const dt = antes ? Math.min(0.05, Math.max(0.004, (t - antes) / 1000)) : 1 / 60;
      antes = t;
      const y = leer();
      const objetivo = Math.min(1, Math.abs(y - ultimaY) / dt / VIENTO_LLENO) * TOPE_MECE;
      ultimaY = y;
      // Un resorte que se pasa poco (menos que REBOTE): al soltar, la hoja vuelve meciéndose sin llegar al tope.
      rapidez += (70 * (objetivo - viento) - 11 * rapidez) * dt;
      viento += rapidez * dt;
      if (objetivo === 0 && Math.abs(viento) < 0.05 && Math.abs(rapidez) < 0.2) {
        antes = 0;
        viento = rapidez = 0;
        s.style.removeProperty("--mk-viento");
        return;
      }
      s.style.setProperty("--mk-viento", Math.max(-REBOTE, Math.min(TOPE_MECE, viento)).toFixed(2));
      cuadro = requestAnimationFrame(paso);
    };
    // El scroll de la página (de la ventana, del `body` o de lo que la envuelve) despierta al viento; el de una tira de
    // adentro, no.
    const alBajar = (e: Event) => {
      const t = e.target;
      const nueva = t === document ? null : t instanceof Element && t.contains(el) ? t : undefined;
      if (nueva === undefined) return;
      if (nueva !== fuente) {
        fuente = nueva;
        ultimaY = leer();
        antes = 0;
      }
      if (!cuadro) cuadro = requestAnimationFrame(paso);
    };
    document.addEventListener("scroll", alBajar, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", alBajar, { capture: true });
      cancelAnimationFrame(cuadro);
      s.style.removeProperty("--mk-viento");
    };
  }, [mece, pagina]);
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
        <g ref={grupoHojas} data-hojas="">
        {hojas.map((u, i) => (
          <g key={`o${i}`} data-hoja="" data-x={u.x.toFixed(1)} data-y={u.y.toFixed(1)} data-giro={u.giro.toFixed(0)} data-tamano={u.tamano} data-tiempo={u.tiempo ? "" : undefined} transform={`translate(${u.x.toFixed(1)} ${u.y.toFixed(1)}) rotate(${u.giro.toFixed(0)}) scale(${u.tamano})`} style={{ color: u.color } as CSSProperties}>
            <g data-mece="" style={{ "--mk-mece": u.mece.toFixed(2) } as CSSProperties}>
              <path d={FORMA_HOJA} style={(u.tiempo ? { "--mk-h-espera": `${u.tiempo.espera}ms`, "--mk-h-dura": `${u.tiempo.dura}ms` } : { "--mk-h-d": porciento(u.en) }) as unknown as CSSProperties} />
            </g>
          </g>
        ))}
        </g>
        {flor && (
          <g data-flor="" data-x={flor.x.toFixed(1)} data-y={flor.y.toFixed(1)} data-radio={flor.radio.toFixed(1)} transform={`translate(${flor.x.toFixed(1)} ${flor.y.toFixed(1)}) rotate(${flor.giro}) scale(${(flor.radio / 20).toFixed(3)})`}>
            {Array.from({ length: flor.petalos }, (_, k) => (
              // El giro va en un grupo: el pétalo se abre con `scale` (CSS), y en un mismo elemento WebKit puede botar el giro del atributo.
              <g key={k} transform={`rotate(${Math.round((360 * k) / flor.petalos)})`}>
                <path data-petalo="" d={FORMA_PETALO} style={{ "--mk-h-espera": `${flor.espera + k * PETALO_TRAS_PETALO}ms` } as CSSProperties} />
              </g>
            ))}
            <circle r={5.5} style={{ "--mk-h-espera": `${flor.espera + flor.petalos * PETALO_TRAS_PETALO}ms` } as CSSProperties} />
          </g>
        )}
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
