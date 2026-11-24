// Cinta: el lema corre de lado y su velocidad sigue al scroll. Al bajar la página acelera, al subir se devuelve, y
// vuelve a su paso con rebote. Solo corre a la vista y con la pestaña visible. Para lectores, el lema va una vez.
import { useCallback, useEffect, useRef, useState } from "react";
import { useStyles } from "../utils/styles";
import { velocidadScroll, type MuestraScroll } from "../dedo/calculo-impulso";
import { pasoResorte } from "../dedo/resorte";
import { useMomento, type ComunesMomento } from "./base";
import { copiasCinta, envolver, ritmoCinta } from "./calculos-2";

export interface CintaConImpulsoProps extends ComunesMomento {
  /** El lema del negocio, en una línea. Sin lema no se dibuja nada. */
  lema: string;
  /** El lema centrado y sin moverse (la otra versión del bloque). */
  quieta?: boolean;
}

/** El paso normal de la cinta (px por segundo). Cuántas copias del lema lleva cada mitad se calcula al medir (`copiasCinta`). */
const PASO = 40;

export const CSS_CINTA =
  ".mk-m-cinta{overflow:hidden;overflow:clip;padding:.5em 0;font-weight:800;font-size:clamp(1.1rem,4vw,1.8rem)}" +
  ".mk-m-cinta-quieta{margin:0;text-align:center}" +
  ".mk-m-cinta-pista{display:flex;width:max-content;white-space:nowrap;will-change:translate}" +
  ".mk-m-cinta-pista span{padding:0 .6em}" +
  ".mk-m-cinta-pista i{font-style:normal;color:var(--mk-m-acento)}";

export default function CintaConImpulso({ lema, quieta = false, nivel: forzado, ahorro, className }: CintaConImpulsoProps) {
  useStyles("momento-cinta", CSS_CINTA);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const pista = useRef<HTMLDivElement>(null);
  const [copias, setCopias] = useState(() => copiasCinta(0, 0));
  const pegar = useCallback(
    (n: HTMLDivElement | null) => {
      ref(n);
      setEl(n);
    },
    [ref],
  );
  const limpio = typeof lema === "string" ? lema.trim() : "";
  const corre = Boolean(limpio) && !quieta && nivel === "completo";

  useEffect(() => {
    const p = pista.current;
    if (!corre || !el || !p || typeof requestAnimationFrame === "undefined") return;
    let cuadro = 0;
    let antes = 0;
    let x = 0;
    let mitad = p.scrollWidth / 2;
    let ritmo = { x: 1, v: 0 };
    let visible = typeof IntersectionObserver === "undefined";
    let velocidad = 0;
    let ultimoScroll = 0;
    const muestras: MuestraScroll[] = [];

    const paso = (t: number) => {
      cuadro = 0;
      const dt = antes ? Math.min(0.05, (t - antes) / 1000) : 0;
      antes = t;
      // Si hace un rato que no hay scroll, la cinta vuelve a su paso.
      ritmo = pasoResorte(ritmo, ritmoCinta(t - ultimoScroll < 160 ? velocidad : 0), dt);
      x = envolver(x + PASO * ritmo.x * dt, mitad);
      p.style.translate = `${(-x).toFixed(1)}px 0`;
      pedir();
    };
    const pedir = () => {
      if (!cuadro && visible && !document.hidden) cuadro = requestAnimationFrame(paso);
      else if (!visible || document.hidden) antes = 0;
    };
    // La posición se toma del propio bloque: sirve si baja la ventana o un contenedor.
    const alBajar = () => {
      if (!visible) return;
      const t = performance.now();
      velocidad = velocidadScroll(muestras, t, -el.getBoundingClientRect().top);
      ultimoScroll = t;
    };
    // Con un lema corto o una pantalla ancha hacen falta más copias: cada mitad tiene que cubrir el bloque entero.
    const medir = () => {
      const una = p.firstElementChild?.getBoundingClientRect().width ?? 0;
      setCopias(copiasCinta(una, el.clientWidth));
      mitad = p.scrollWidth / 2;
    };
    const vista =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([en]) => {
            visible = en.isIntersecting;
            if (!visible) muestras.length = 0;
            pedir();
          })
        : null;
    const tamano = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    vista?.observe(el);
    tamano?.observe(p);
    tamano?.observe(el);
    if (!tamano) medir();
    document.addEventListener("scroll", alBajar, { capture: true, passive: true });
    document.addEventListener("visibilitychange", pedir);
    pedir();
    return () => {
      cancelAnimationFrame(cuadro);
      vista?.disconnect();
      tamano?.disconnect();
      document.removeEventListener("scroll", alBajar, { capture: true });
      document.removeEventListener("visibilitychange", pedir);
      p.style.translate = "";
    };
  }, [corre, el, limpio]);

  if (!limpio) return null;
  return (
    <div ref={pegar} className={["mk-momento mk-m-cinta", className].filter(Boolean).join(" ")} data-momento="cinta" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      {corre ? (
        <>
          <p className="mk-m-lector">{limpio}</p>
          <div className="mk-m-cinta-pista" ref={pista} aria-hidden="true">
            {Array.from({ length: copias * 2 }, (_, i) => (
              <span key={i}>{limpio} <i>✦</i></span>
            ))}
          </div>
        </>
      ) : (
        <p className="mk-m-cinta-quieta">{limpio}</p>
      )}
    </div>
  );
}
