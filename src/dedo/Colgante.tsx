// Letrero colgante: en la composición «letrero», el marco con el título cuelga de dos cuerdas y se balancea como un
// péndulo: al abrir, al tocarlo, un poco al bajar la página y siguiendo la señal de movimiento del encabezado (dedo,
// cursor o inclinación del teléfono). Se carga aparte y el encabezado lo monta solo en nivel completo. Cuando se
// asienta, deja de calcular.
import { useEffect, type RefObject } from "react";
import { useStyles } from "../utils/styles";
import { pasoPendulo, penduloDormido, vientoDe } from "./calculo-pendulo";

// El marco gira alrededor del punto de donde cuelga, que está arriba, en el borde del encabezado. Se hace con `rotate`
// (gira sobre su centro) más `translate` (lo lleva a donde quedaría colgando): así no se toca `transform-origin`, que
// también usan las entradas del marco. Las cuerdas son parte del marco y giran con él; el borde del encabezado las corta.
const MARCO = ".mk-enc[data-colgante] .mk-enc-marco";
export const CSS_COLGANTE =
  `${MARCO}{translate:var(--mk-tx,0px) var(--mk-ty,0px);rotate:var(--mk-giro,0deg)}` +
  `${MARCO}::before,${MARCO}::after{content:"";position:absolute;bottom:100%;width:2px;height:calc(var(--mk-cuerda,120px) + 80px);` +
  "background:color-mix(in srgb,var(--mk-texto,#fff) 55%,transparent);pointer-events:none}" +
  `${MARCO}::before{left:14%}${MARCO}::after{right:14%}`;

/** Con cuántos grados parte, cuánto empuja un toque (°/s) y cuánto se ladea con la señal de movimiento. */
const INICIO = 7;
const TOQUE = 60;
const LADEO = 3;
/** Lo que se puede tocar dentro del letrero: apretarlo no lo balancea (si se moviera, el clic caería fuera). */
const TOCABLE = "a,button,input,select,textarea,label,summary,[role=button],[tabindex]";

export default function Colgante({ raiz }: { raiz: RefObject<HTMLElement | null> }) {
  useStyles("colgante", CSS_COLGANTE);
  useEffect(() => {
    const enc = raiz.current;
    const marco = enc?.querySelector<HTMLElement>(".mk-enc-marco");
    if (!enc || !marco || typeof requestAnimationFrame === "undefined") return;
    let e = { a: INICIO, w: 0 };
    let cuadro = 0;
    let antes = 0;
    /** Del punto de donde cuelga al centro del marco (px). */
    let largo = 0;
    /** El empujón del scroll: un viento que ladea un poco y se apaga solo. */
    let viento = 0;
    let ultimoScroll = { y: window.scrollY, t: 0 };
    let aLaVista = true;

    /** Del borde de arriba del encabezado al marco, según el diseño de la página (sin contar el giro que lleve). */
    const arriba = () => {
      let y = 0;
      for (let n: HTMLElement | null = marco; n && n !== enc; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
      return y;
    };
    const medir = () => {
      const cuerda = Math.max(40, Math.round(arriba()));
      marco.style.setProperty("--mk-cuerda", `${cuerda}px`);
      largo = cuerda + marco.offsetHeight / 2;
      pintar();
    };
    const pintar = () => {
      const rad = (e.a * Math.PI) / 180;
      marco.style.setProperty("--mk-giro", `${e.a.toFixed(3)}deg`);
      marco.style.setProperty("--mk-tx", `${(-largo * Math.sin(rad)).toFixed(2)}px`);
      marco.style.setProperty("--mk-ty", `${(largo * Math.cos(rad) - largo).toFixed(2)}px`);
    };
    /** El cursor está sobre el letrero: ahí cuelga derecho y quieto, para que sus botones no se muevan al apuntarles. */
    let encima = false;
    // Hacia dónde se ladea: la señal de movimiento del encabezado (de -1 a 1), que este deja en su `style`. Va en
    // pasos chicos, para no despertar por cambios que no se ven.
    const objetivo = () => (encima ? 0 : (Math.round((parseFloat(enc.style.getPropertyValue("--mk-cx")) || 0) * 50) / 50) * LADEO);

    const paso = (t: number) => {
      cuadro = 0;
      const dt = Math.min(0.032, antes ? (t - antes) / 1000 : 0.016);
      antes = t;
      viento *= Math.exp(-dt * 5);
      if (Math.abs(viento) < 0.02) viento = 0;
      const meta = objetivo() + viento;
      e = pasoPendulo(e, dt, meta);
      if (!viento && penduloDormido(e, meta)) {
        e = { a: meta, w: 0 };
        antes = 0;
      } else pedir();
      pintar();
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(paso);
    };

    const entrar = () => {
      encima = true;
      pedir();
    };
    const salir = () => {
      encima = false;
      pedir();
    };
    const tocar = (ev: PointerEvent) => {
      if (ev.target instanceof Element && ev.target.closest(TOCABLE)) return;
      const r = marco.getBoundingClientRect();
      // Tocar un lado lo empuja hacia abajo: el letrero gira hacia ese lado.
      e.w += (ev.clientX > r.left + r.width / 2 ? 1 : -1) * TOQUE;
      pedir();
    };
    // Al bajar la página sopla un viento que depende de la rapidez, con tope: por más rápido o largo que sea el scroll,
    // el letrero se ladea unos pocos grados. Con el encabezado fuera de la vista no hace nada.
    const alBajar = () => {
      const ahora = { y: window.scrollY, t: performance.now() };
      if (aLaVista && ultimoScroll.t && ahora.t > ultimoScroll.t) {
        viento = vientoDe(((ahora.y - ultimoScroll.y) / (ahora.t - ultimoScroll.t)) * 1000);
        pedir();
      }
      ultimoScroll = ahora;
    };
    // Si cambia la señal de movimiento del encabezado (su `style`), el letrero despierta y la sigue.
    let ultimaSenal = objetivo();
    const senal =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            const m = objetivo();
            if (m !== ultimaSenal) {
              ultimaSenal = m;
              pedir();
            }
          })
        : null;
    const tamano = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    const vista =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([en]) => {
            aLaVista = en.isIntersecting;
          })
        : null;

    enc.setAttribute("data-colgante", "");
    medir();
    marco.addEventListener("pointerdown", tocar);
    marco.addEventListener("pointerenter", entrar);
    marco.addEventListener("pointerleave", salir);
    window.addEventListener("scroll", alBajar, { passive: true });
    senal?.observe(enc, { attributes: true, attributeFilter: ["style"] });
    tamano?.observe(enc);
    vista?.observe(enc);
    pedir();

    return () => {
      cancelAnimationFrame(cuadro);
      marco.removeEventListener("pointerdown", tocar);
      marco.removeEventListener("pointerenter", entrar);
      marco.removeEventListener("pointerleave", salir);
      window.removeEventListener("scroll", alBajar);
      senal?.disconnect();
      tamano?.disconnect();
      vista?.disconnect();
      enc.removeAttribute("data-colgante");
      for (const v of ["--mk-giro", "--mk-tx", "--mk-ty", "--mk-cuerda"]) marco.style.removeProperty(v);
    };
  }, [raiz]);
  return null;
}
