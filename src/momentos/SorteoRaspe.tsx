// Sorteos: una capa del color del acento tapa el premio; se raspa con el dedo o el mouse y, pasada la mitad, se
// desvanece. «Ver premio» hace lo mismo con teclado. El premio está siempre en el texto. Nunca dice «ganaste»:
// muestra el premio que se sortea. Si ya hay ganador, se anuncia y salta confeti una vez.
import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { numeroDe } from "./calculos";
import { cuantoRaspado, UMBRAL_RASPE } from "./calculos-aparte";
import { Confeti } from "./Confeti";
import { Limite } from "./aparte";

// Los fuegos se bajan aparte, y solo si se piden. Si su archivo no llega, el sorteo sigue sin celebración.
const Fuegos = lazy(() => import("./FuegosArtificiales"));

export interface SorteoRaspeProps extends ComunesMomento {
  titulo: string;
  premio: string;
  ganador?: string;
  /** El `slug` del negocio: decide el confeti. */
  semilla?: string;
  /** Cómo se celebra cuando hay ganador: confeti (lo de siempre) o fuegos artificiales. */
  celebracion?: "confeti" | "fuegos";
}

export const CSS_SORTEO =
  ".mk-m-sorteo-titulo{margin:0 0 .6rem;font-weight:700;font-size:1.1rem}" +
  ".mk-m-raspe-zona{position:relative;display:grid;place-items:center;min-height:140px;padding:1rem;border-radius:14px;text-align:center;" +
  "background:var(--mk-m-superficie);border:2px dashed var(--mk-m-acento)}" +
  ".mk-m-raspe-premio{margin:0;display:grid;gap:.25rem}" +
  ".mk-m-raspe-premio span{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--mk-m-suave)}" +
  ".mk-m-raspe-premio strong{font-size:1.5rem}" +
  // color y border-color solo sirven para leer los colores ya resueltos desde el canvas.
  ".mk-m-raspe-zona canvas{position:absolute;inset:0;width:100%;height:100%;border-radius:12px;touch-action:none;cursor:grab;" +
  "color:var(--mk-m-acento);border:0 solid var(--mk-m-sobre);transition:opacity .4s}" +
  ".mk-m-raspe-zona canvas[data-desvanece]{opacity:0}" +
  ".mk-m-sorteo .mk-m-boton{margin-top:.75rem}" +
  ".mk-m-sorteo-ganador{margin:.75rem 0 0;font-weight:700}";

export function SorteoRaspe({ titulo, premio, ganador, semilla = "", celebracion = "confeti", nivel: forzado, ahorro, className }: SorteoRaspeProps) {
  useStyles("momento-sorteo", CSS_SORTEO);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const [revelado, setRevelado] = useState(false);
  const [desvanece, setDesvanece] = useState(false);
  const [sinCanvas, setSinCanvas] = useState(false);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const trazo = useRef<{ x: number; y: number; movidas: number } | null>(null);
  const conCapa = nivel !== "quieto" && !revelado && !sinCanvas;

  // Pinta la capa antes del primer cuadro, para que el premio no se asome. Si cambia el tamaño (el teléfono gira):
  // sin raspar, se vuelve a pintar; ya raspado, se revela (no se puede estirar lo borrado).
  const raspado = useRef(false);
  useLayoutEffect(() => {
    const c = lienzo.current;
    if (!conCapa || !c) return;
    // Se lee el canvas varias veces al raspar: el navegador lo guarda donde leerlo es rápido.
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setSinCanvas(true);
      return;
    }
    const pintar = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.max(1, Math.round(c.offsetWidth * dpr));
      c.height = Math.max(1, Math.round(c.offsetHeight * dpr));
      const estilo = getComputedStyle(c);
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = estilo.color;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = estilo.borderTopColor;
      ctx.font = `700 ${Math.round(16 * dpr)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Raspa para ver el premio", c.width / 2, c.height / 2);
    };
    pintar();
    if (typeof ResizeObserver === "undefined") return;
    let ancho = c.offsetWidth;
    let alto = c.offsetHeight;
    const ro = new ResizeObserver(() => {
      if (c.offsetWidth === ancho && c.offsetHeight === alto) return;
      ancho = c.offsetWidth;
      alto = c.offsetHeight;
      if (raspado.current) revelarRef.current();
      else pintar();
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [conCapa]);

  const revelarRef = useRef(() => {});
  const temporizador = useRef(0);
  useEffect(() => () => window.clearTimeout(temporizador.current), []);
  const revelar = () => {
    if (desvanece) return;
    setDesvanece(true);
    // Sin transitionend: con movimiento reducido la transición no corre.
    temporizador.current = window.setTimeout(() => setRevelado(true), 450);
  };
  revelarRef.current = revelar;

  const punto = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    // Un factor por eje: el canvas puede no tener la misma proporción que su caja.
    const kx = e.currentTarget.width / (r.width || 1);
    const ky = e.currentTarget.height / (r.height || 1);
    return { x: (e.clientX - r.left) * kx, y: (e.clientY - r.top) * ky, k: kx };
  };
  const bajar = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = punto(e);
    trazo.current = { x: p.x, y: p.y, movidas: 0 };
  };
  const mover = (e: PointerEvent<HTMLCanvasElement>) => {
    const t = trazo.current;
    const c = e.currentTarget;
    const ctx = c.getContext("2d");
    if (!t || !ctx) return;
    const p = punto(e);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 36 * p.k;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    t.x = p.x;
    t.y = p.y;
    raspado.current = true;
    if (++t.movidas % 10 === 0 && cuantoRaspado(ctx.getImageData(0, 0, c.width, c.height).data, 16) >= UMBRAL_RASPE) revelar();
  };
  const soltar = () => (trazo.current = null);

  return (
    <div ref={ref} className={["mk-momento mk-m-sorteo", className].filter(Boolean).join(" ")} data-momento="sorteo" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      <p className="mk-m-sorteo-titulo">{titulo}</p>
      <div className="mk-m-raspe-zona">
        <p className="mk-m-raspe-premio"><span>Premio</span><strong>{premio}</strong></p>
        {conCapa && (
          <canvas
            ref={lienzo}
            aria-hidden="true"
            data-desvanece={desvanece ? "" : undefined}
            onPointerDown={bajar}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
          />
        )}
      </div>
      {conCapa && <button type="button" className="mk-m-boton" onClick={revelar}>Ver premio</button>}
      {ganador && <p className="mk-m-sorteo-ganador">Ganador: {ganador}</p>}
      {ganador && activo && nivel === "completo" &&
        (celebracion === "fuegos" ? (
          <Limite siFalla={null}>
            <Suspense fallback={null}><Fuegos semilla={numeroDe(semilla)} /></Suspense>
          </Limite>
        ) : (
          <Confeti semilla={numeroDe(semilla)} />
        ))}
    </div>
  );
}
