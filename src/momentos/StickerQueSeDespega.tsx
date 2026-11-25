// Sticker que se despega: se toma de donde se toque y se tira. El doblez queda perpendicular al tirón; la parte
// levantada muestra su revés y deja sombra. Soltarlo con más de la mitad despegada lo termina de despegar y cae;
// con menos, se vuelve a pegar. Debajo hay contenido de verdad, que queda a la vista (y se anuncia) al despegar.
// Lo que se mueve son dos ventanas que recortan (lo que queda y la solapa) y que solo se corren y se giran.
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { pasoResorte } from "../dedo/resorte";
import { useStyles } from "../utils/styles";
import { alAcabar } from "./al-acabar";
import { vibrar } from "../estilos/sonidos";
import { useMomento, type ComunesMomento } from "./base";
import { bordeMasCercano, doblez, type Doblez, type FormaSticker, type Punto } from "./calculo-sticker";

export interface StickerQueSeDespegaProps extends ComunesMomento {
  /** La cara del sticker (un texto corto, un emoji, un dibujo). */
  children?: ReactNode;
  /** Lo que hay debajo: el premio, un mensaje. Queda a la vista al despegar. */
  debajo: ReactNode;
  /** El texto del botón para quien no arrastra. Por defecto, «Despegar». */
  etiqueta?: string;
  forma?: FormaSticker;
  /** Un golpecito al despegarse (donde el teléfono vibra). Por defecto, sí. */
  vibracion?: boolean;
  /** Se llama una vez, cuando lo de abajo queda a la vista. */
  alDespegar?: () => void;
}

/** Pasado esto con el dedo, se termina de despegar solo; y soltándolo pasado `SE_VA`, también. */
const SE_SUELTA = 0.9;
const SE_VA = 0.5;
/** La transformación de una ventana: su borde va sobre el doblez y cubre el lado que queda. */
const VENTANA = "translate(calc(var(--mk-st-x)*1px),calc(var(--mk-st-y)*1px)) rotate(calc(var(--mk-st-a)*1deg)) translate(0,-50%)";
/** La de lo que va adentro, para que quede en su lugar (se deshace la de la ventana). */
const EN_SU_LUGAR = "rotate(calc(var(--mk-st-a)*-1deg)) translate(calc(var(--mk-st-x)*-1px),calc(var(--mk-st-y)*-1px))";

export const CSS_STICKER =
  ".mk-m-sticker{width:100%;display:grid;justify-items:center;gap:.75rem;--mk-st-r:50%}" +
  ".mk-m-sticker[data-forma=cuadrado]{--mk-st-r:18px}" +
  // Chico a propósito: toma todo el gesto, así que tiene que quedar página por donde desplazarse.
  ".mk-m-sticker-zona{position:relative;width:min(100%,220px);aspect-ratio:1}" +
  ".mk-m-sticker[data-forma=cuadrado] .mk-m-sticker-zona{width:min(100%,260px);aspect-ratio:1.3}" +
  ".mk-m-sticker-debajo{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:1.1rem;box-sizing:border-box;border-radius:var(--mk-st-r);" +
  "border:2px dashed color-mix(in srgb,var(--mk-m-texto) 32%,transparent);overflow-wrap:anywhere}" +
  ".mk-m-sticker-pieza{position:absolute;inset:0;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;--mk-st-x:0;--mk-st-y:0;--mk-st-a:0}" +
  ".mk-m-sticker-pieza:active{cursor:grabbing}" +
  // Las dos ventanas: tres veces el sticker, con un borde sobre el doblez. Recortan todo lo que cae del otro lado.
  `.mk-m-sticker-queda,.mk-m-sticker-solapa{position:absolute;left:0;top:0;width:300%;height:300%;overflow:hidden;overflow:clip;transform-origin:0 0;pointer-events:none;transform:${VENTANA}}` +
  ".mk-m-sticker-cara,.mk-m-sticker-reves,.mk-m-sticker-sombra{position:absolute;left:0;top:0;width:33.3334%;height:33.3334%;box-sizing:border-box;border-radius:var(--mk-st-r);transform-origin:0 0}" +
  `.mk-m-sticker-cara{display:grid;place-items:center;text-align:center;padding:1rem;background:var(--mk-m-acento);color:var(--mk-m-sobre);font-weight:800;font-size:1.25rem;line-height:1.15;overflow-wrap:anywhere;transform:translate(0,150%) ${EN_SU_LUGAR}}` +
  // La solapa: el sticker visto por el revés (liso, más claro), reflejado en el doblez. Y su sombra, un poco más allá.
  `.mk-m-sticker-reves{background:linear-gradient(135deg,color-mix(in srgb,var(--mk-m-acento) 14%,#fff),color-mix(in srgb,var(--mk-m-acento) 34%,#e9e4da));transform:translate(0,150%) scaleX(-1) ${EN_SU_LUGAR}}` +
  `.mk-m-sticker-sombra{background:#000;opacity:.34;filter:blur(7px);transform:translate(calc(6px + var(--mk-l0x,-.45)*-6px),calc(150% + var(--mk-l0y,-.8)*-8px)) scaleX(-1) ${EN_SU_LUGAR}}` +
  // Pegado: sin doblez. La ventana es el sticker mismo.
  ".mk-m-sticker-pieza[data-pegado] .mk-m-sticker-queda{width:100%;height:100%;overflow:visible;transform:none}" +
  ".mk-m-sticker-pieza[data-pegado] .mk-m-sticker-cara{width:100%;height:100%;transform:none;box-shadow:calc(var(--mk-l0x,-.45)*-3px) calc(var(--mk-l0y,-.8)*-4px) 8px -3px rgba(0,0,0,.45)}" +
  ".mk-m-sticker-pieza[data-pegado] .mk-m-sticker-solapa{display:none}" +
  // Despegado del todo: se va volando y cae.
  ".mk-m-sticker-pieza[data-cae]{animation:mk-m-sticker-cae .6s cubic-bezier(.5,0,.9,.5) both;pointer-events:none}" +
  "@keyframes mk-m-sticker-cae{to{translate:-30% 170%;rotate:-38deg;opacity:0}}" +
  ".mk-m-sticker[data-nivel=liviano] .mk-m-sticker-pieza[data-cae]{animation:mk-m-sticker-funde .25s linear both}" +
  "@keyframes mk-m-sticker-funde{to{opacity:0}}";

export default function StickerQueSeDespega({ children, debajo, etiqueta = "Despegar", forma = "circulo", vibracion = true, alDespegar, nivel: forzado, ahorro, className }: StickerQueSeDespegaProps) {
  useStyles("momento-sticker", CSS_STICKER);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const figura: FormaSticker = forma === "cuadrado" ? "cuadrado" : "circulo";
  const [caido, setCaido] = useState(false);
  const [cae, setCae] = useState(false);
  const [dicho, setDicho] = useState("");
  const pieza = useRef<HTMLDivElement>(null);
  const abajo = useRef<HTMLDivElement>(null);
  const avisado = useRef(false);
  /** Lo que va del gesto. Vive fuera de React: cambia en cada movimiento. */
  const g = useRef({ id: -1, toma: { x: 0, y: 0 }, dedo: { x: 0, y: 0 }, despegado: 0, cuadro: 0, yendose: false });
  useEffect(() => () => cancelAnimationFrame(g.current.cuadro), []);
  const visto = caido || nivel === "quieto";
  const boton = useRef<HTMLButtonElement>(null);
  /** Si al despegarse el foco estaba en el botón (que desaparece): hay que pasarlo a lo de abajo. */
  const enfocar = useRef(false);
  const alCaer = useRef(() => {});
  // El sticker cae y, cuando termina, queda lo de abajo. No se espera el aviso del navegador a ciegas: con «reducir
  // movimiento» la caída no corre.
  useEffect(() => {
    const el = pieza.current;
    if (!cae || !el) return;
    return alAcabar(el, "animation", () => alCaer.current());
  }, [cae]);
  useEffect(() => {
    if (!caido || !enfocar.current) return;
    enfocar.current = false;
    abajo.current?.focus();
  }, [caido]);
  // En quieto lo de abajo está a la vista desde el principio: se avisa una vez, al mostrarlo.
  useEffect(() => {
    if (nivel !== "quieto" || avisado.current) return;
    avisado.current = true;
    alDespegar?.();
  }, [nivel]);

  const caja = () => {
    const c = pieza.current?.getBoundingClientRect();
    return c ? { izquierda: c.left, arriba: c.top, ancho: c.width, alto: c.height } : null;
  };
  /** Pone el doblez (o lo quita) en la pieza. */
  const doblar = (d: Doblez | null) => {
    const el = pieza.current;
    if (!el) return;
    g.current.despegado = d?.despegado ?? 0;
    el.toggleAttribute("data-pegado", !d);
    el.setAttribute("data-despegado", String(d?.despegado ?? 0));
    if (!d) return;
    el.style.setProperty("--mk-st-x", String(d.x));
    el.style.setProperty("--mk-st-y", String(d.y));
    el.style.setProperty("--mk-st-a", String(d.angulo));
  };
  const llevar = (dedo: Punto) => {
    const c = caja();
    if (!c) return;
    g.current.dedo = dedo;
    doblar(doblez(g.current.toma, dedo, c, figura));
  };
  const mostrar = () => {
    enfocar.current = boton.current !== null && document.activeElement === boton.current;
    setCaido(true);
    setCae(false);
    setDicho((abajo.current?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 200) || "Despegado");
    if (!avisado.current) {
      avisado.current = true;
      alDespegar?.();
    }
  };
  alCaer.current = mostrar;
  /** Termina de despegarse: sigue hacia donde iba (o hacia `meta`) hasta soltarse entero, y cae. */
  const irse = (meta?: Punto) => {
    const s = g.current;
    if (s.yendose || caido) return;
    s.yendose = true;
    if (vibracion) vibrar(10);
    if (nivel !== "completo") return setCae(true);
    cancelAnimationFrame(s.cuadro);
    const c = caja();
    const [dx, dy] = [s.dedo.x - s.toma.x, s.dedo.y - s.toma.y];
    const largo = Math.hypot(dx, dy) || 1;
    // Lo bastante lejos para que el doblez salga del sticker por el otro lado.
    const lejos = c ? (c.ancho + c.alto) * 1.3 : 600;
    const fin = meta ?? { x: s.toma.x + (dx / largo) * lejos, y: s.toma.y + (dy / largo) * lejos };
    const desde = { ...s.dedo };
    const t0 = performance.now();
    const paso = (t: number) => {
      // Con el botón va más lento: así se alcanza a ver cómo se despega.
      const k = Math.min(1, (t - t0) / (meta ? 750 : 380));
      const suave = k * k * (3 - 2 * k);
      llevar({ x: desde.x + (fin.x - desde.x) * suave, y: desde.y + (fin.y - desde.y) * suave });
      if (k < 1 && s.despegado < 0.995) s.cuadro = requestAnimationFrame(paso);
      else setCae(true);
    };
    s.cuadro = requestAnimationFrame(paso);
  };
  /** Vuelve a pegarse, con resorte. */
  const volver = () => {
    const s = g.current;
    cancelAnimationFrame(s.cuadro);
    let ex = { x: s.dedo.x, v: 0 };
    let ey = { x: s.dedo.y, v: 0 };
    let antes = performance.now();
    const paso = (t: number) => {
      const dt = Math.min(0.032, (t - antes) / 1000);
      antes = t;
      ex = pasoResorte(ex, s.toma.x, dt, 260, 24);
      ey = pasoResorte(ey, s.toma.y, dt, 260, 24);
      const llego = Math.hypot(ex.x - s.toma.x, ey.x - s.toma.y) < 1.5 && Math.hypot(ex.v, ey.v) < 20;
      if (llego) return doblar(null);
      llevar({ x: ex.x, y: ey.x });
      s.cuadro = requestAnimationFrame(paso);
    };
    s.cuadro = requestAnimationFrame(paso);
  };

  const alBajar = (ev: PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    const c = caja();
    if (!c || s.yendose || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    cancelAnimationFrame(s.cuadro);
    s.id = ev.pointerId;
    s.toma = bordeMasCercano({ x: ev.clientX - c.izquierda, y: ev.clientY - c.arriba }, c);
    s.dedo = { ...s.toma };
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
  };
  const alMover = (ev: PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    const c = caja();
    if (s.id !== ev.pointerId || !c || s.yendose || nivel !== "completo") return;
    llevar({ x: ev.clientX - c.izquierda, y: ev.clientY - c.arriba });
    if (s.despegado >= SE_SUELTA) {
      s.id = -1;
      irse();
    }
  };
  /** Soltar, o que el navegador cancele el gesto: se va si iba pasada la mitad; si no, vuelve. */
  const alSoltar = (ev: PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (s.id !== ev.pointerId) return;
    s.id = -1;
    if (s.yendose) return;
    if (nivel !== "completo") return ev.type === "pointerup" ? irse() : undefined;
    if (s.despegado > SE_VA) irse();
    else if (s.despegado > 0) volver();
  };
  /** El botón: lo despega desde la esquina de arriba a la derecha. */
  const despegar = () => {
    const s = g.current;
    const c = caja();
    if (!c || s.yendose) return;
    s.toma = { x: c.ancho, y: 0 };
    s.dedo = { ...s.toma };
    irse({ x: -c.ancho * 1.4, y: c.alto * 2.4 });
  };

  return (
    <div ref={ref} className={`mk-momento mk-m-sticker${className ? ` ${className}` : ""}`} data-momento="sticker" data-nivel={nivel} data-activo={activo ? "" : undefined} data-forma={figura} data-estado={visto ? "despegado" : cae ? "cayendo" : "pegado"}>
      <div className="mk-m-sticker-zona">
        {/* Lo de abajo está siempre en la página; mientras está tapado no lo alcanzan ni el foco ni los lectores. */}
        <div className="mk-m-sticker-debajo" ref={abajo} data-debajo="" tabIndex={-1} aria-hidden={visto ? undefined : true} inert={visto ? undefined : true}>
          {debajo}
        </div>
        {!visto && (
          <div
            className="mk-m-sticker-pieza"
            ref={pieza}
            data-pegado=""
            data-despegado="0"
            data-cae={cae ? "" : undefined}
            onPointerDown={alBajar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
          >
            <div className="mk-m-sticker-queda">
              <div className="mk-m-sticker-cara">{children}</div>
            </div>
            <div className="mk-m-sticker-solapa" aria-hidden="true">
              <i className="mk-m-sticker-sombra" />
              <i className="mk-m-sticker-reves" />
            </div>
          </div>
        )}
      </div>
      {!visto && <button type="button" className="mk-m-boton" data-despegar="" ref={boton} onClick={despegar}>{etiqueta}</button>}
      <p className="mk-m-lector" aria-live="polite" data-dicho="">{dicho}</p>
    </div>
  );
}
