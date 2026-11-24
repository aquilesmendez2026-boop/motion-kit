// Reseñas: las estrellas se llenan hasta el promedio y las reseñas vienen en una pila que se pasa con el dedo.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { datosResenas, estrellasDe, formatoDecimal, siguienteIndice, type ResenaDatos } from "./calculos";

/** Una reseña: nombre, estrellas (0 a 5; fuera de rango se corrige) y texto opcional. */
export type ResenaMomento = ResenaDatos;

export interface ResenasPilaProps extends ComunesMomento {
  promedio: number | null;
  total: number;
  resenas: ResenaMomento[];
}

// Estrella recortada con clip-path (sin imágenes: pasa cualquier CSP). La capa del acento crece con scaleX.
const ESTRELLA = "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)";

export const CSS_RESENAS =
  `.mk-m-estrella{display:inline-block;position:relative;width:1.5em;height:1.5em;clip-path:${ESTRELLA};background:color-mix(in srgb,var(--mk-m-texto) 18%,transparent)}` +
  ".mk-m-estrella i{position:absolute;inset:0;background:var(--mk-m-acento);transform-origin:left;transform:scaleX(var(--f))}" +
  ".mk-m-resenas:not([data-nivel=quieto]):not([data-activo]) .mk-m-estrella i{transform:scaleX(0)}" +
  ".mk-m-resenas[data-activo]:not([data-nivel=quieto]) .mk-m-estrella i{transition:transform calc(var(--mk-resorte-ms)*.8) var(--mk-resorte-curva) calc(var(--k)*120ms)}" +
  ".mk-m-resenas-cabeza{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}" +
  ".mk-m-resenas-promedio{font-size:2rem;font-weight:700;font-variant-numeric:tabular-nums}" +
  ".mk-m-resenas-total{color:var(--mk-m-suave)}" +
  ".mk-m-pila{position:relative;display:grid;margin-top:1rem;padding-bottom:24px;outline:none;overflow-x:clip;overflow-clip-margin:12px}" +
  ".mk-m-pila:focus-visible{outline:3px solid var(--mk-m-acento);outline-offset:4px;border-radius:12px}" +
  ".mk-m-resena{grid-area:1/1;margin:0;padding:1rem;border-radius:14px;background:var(--mk-m-superficie);color:var(--mk-m-texto);" +
  "border:1px solid color-mix(in srgb,var(--mk-m-texto) 14%,transparent);box-shadow:0 8px 24px -14px rgba(0,0,0,.45);" +
  "transform:translateY(calc(var(--k)*10px)) scale(calc(1 - var(--k)*.05));z-index:calc(3 - var(--k));touch-action:pan-y}" +
  ".mk-m-resenas:not([data-nivel=quieto]):not([data-activo]) .mk-m-resena{transform:none}" +
  ".mk-m-resenas[data-activo]:not([data-nivel=quieto]) .mk-m-resena{transition:transform var(--mk-resorte-ms) var(--mk-resorte-curva),opacity .25s}" +
  ".mk-m-resena[data-arrastre]{transition:none!important}" +
  ".mk-m-resena[data-sale]{opacity:0}" +
  ".mk-m-resena .mk-m-estrella{width:1em;height:1em}" +
  ".mk-m-resena p{margin:.5rem 0}" +
  ".mk-m-resena footer{font-weight:600}" +
  ".mk-m-pila-botones{display:flex;gap:.5rem;margin-top:.5rem}";

function Estrellas({ llenas, chicas }: { llenas: number[]; chicas?: boolean }) {
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", gap: chicas ? 2 : 4 }}>
      {llenas.map((f, k) => (
        <span key={k} className="mk-m-estrella" style={{ "--f": f, "--k": k } as CSSProperties}><i /></span>
      ))}
    </span>
  );
}

/**
 * El promedio sube contando hasta su valor cuando el momento arranca. Antes de arrancar queda en 0, igual que las
 * estrellas vacías, para no mostrar el valor y después volver a 0. En quieto, el valor final de una vez.
 */
function usePromedioContando(valor: number, esperando: boolean, contar: boolean): number {
  const [actual, setActual] = useState(esperando ? 0 : valor);
  useEffect(() => {
    if (esperando) return;
    if (!contar) {
      setActual(valor);
      return;
    }
    let cuadro = 0;
    const inicio = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / 900);
      setActual(valor * (1 - (1 - p) ** 3));
      if (p < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [valor, esperando, contar]);
  return actual;
}

export function ResenasPila({ promedio, total, resenas, nivel: forzado, ahorro, className }: ResenasPilaProps) {
  useStyles("momento-resenas", CSS_RESENAS);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const datos = datosResenas(promedio, total, resenas);
  const lista = datos.resenas;
  const n = lista.length;
  const [i, setI] = useState(0);
  // Si llegan menos reseñas que antes, el índice vuelve al rango.
  const actual = n ? i % n : 0;
  const temporizador = useRef(0);
  useEffect(() => () => window.clearTimeout(temporizador.current), []);
  const [dx, setDx] = useState(0);
  const [sale, setSale] = useState<0 | 1 | -1>(0);
  const arrastre = useRef<{ x0: number; ancho: number } | null>(null);
  const valor = datos.valor;
  const mostrado = usePromedioContando(valor ?? 0, !activo && nivel !== "quieto", activo && nivel !== "quieto" && valor !== null);

  if (!datos.dibujar) return null;

  const pasar = (dir: 1 | -1) => {
    if (n < 2 || sale) return;
    if (dir === -1 || nivel === "quieto") {
      setI((x) => siguienteIndice(x, n, dir));
      return;
    }
    setSale(dx > 0 ? 1 : -1);
    // Sale volando y después pasa al fondo de la pila.
    temporizador.current = window.setTimeout(() => {
      setI((x) => siguienteIndice(x, n, 1));
      setSale(0);
      setDx(0);
    }, 260);
  };

  // Con el dedo o el lápiz la tarjeta se arrastra; con el mouse se usan los botones y el texto se puede seleccionar.
  const bajar = (e: PointerEvent<HTMLElement>) => {
    if (n < 2 || e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { x0: e.clientX, ancho: e.currentTarget.offsetWidth };
  };
  const mover = (e: PointerEvent<HTMLElement>) => {
    if (arrastre.current) setDx(e.clientX - arrastre.current.x0);
  };
  const soltar = () => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a) return;
    if (Math.abs(dx) > a.ancho * 0.3) pasar(1);
    else setDx(0);
  };
  const tecla = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") pasar(1);
    else if (e.key === "ArrowLeft") pasar(-1);
    else return;
    e.preventDefault();
  };

  const visibles = Array.from({ length: Math.min(3, n) }, (_, k) => ({ k, r: lista[(actual + k) % n], idx: (actual + k) % n }));
  const giro = nivel === "completo" ? dx / 20 : 0;
  const movida = sale ? `translateX(${sale * 120}%) rotate(${nivel === "completo" ? sale * 12 : 0}deg)` : `translateX(${dx}px) rotate(${giro}deg)`;

  return (
    <div
      ref={ref}
      className={["mk-momento mk-m-resenas", className].filter(Boolean).join(" ")}
      data-momento="resenas"
      data-nivel={nivel}
      data-activo={activo ? "" : undefined}
    >
      {valor !== null && (
        <div className="mk-m-resenas-cabeza">
          <span className="mk-m-resenas-promedio" aria-hidden="true">{formatoDecimal(mostrado)}</span>
          <Estrellas llenas={estrellasDe(valor)} />
          <span className="mk-m-resenas-total" aria-hidden="true">{datos.total} {datos.total === 1 ? "reseña" : "reseñas"}</span>
          <span className="mk-m-lector">Promedio {formatoDecimal(valor)} de 5, {datos.total} {datos.total === 1 ? "reseña" : "reseñas"}.</span>
        </div>
      )}
      {n > 0 && (
        <>
          <div className="mk-m-pila" role="group" tabIndex={n > 1 ? 0 : undefined} onKeyDown={tecla} aria-label={n > 1 ? "Reseñas, usa las flechas para pasar" : "Reseñas"}>
            {visibles.reverse().map(({ k, r, idx }) => (
              <blockquote
                key={idx}
                className="mk-m-resena"
                style={{ "--k": k, ...(k === 0 && (dx || sale) ? { transform: movida } : null) } as CSSProperties}
                data-arrastre={k === 0 && arrastre.current ? "" : undefined}
                data-sale={k === 0 && sale ? "" : undefined}
                aria-hidden={k === 0 ? undefined : "true"}
                onPointerDown={k === 0 ? bajar : undefined}
                onPointerMove={k === 0 ? mover : undefined}
                onPointerUp={k === 0 ? soltar : undefined}
                onPointerCancel={k === 0 ? soltar : undefined}
              >
                <Estrellas llenas={estrellasDe(r.estrellas)} chicas />
                <span className="mk-m-lector">{r.estrellas} de 5 estrellas.</span>
                {r.texto && <p>«{r.texto}»</p>}
                <footer>{r.nombre}</footer>
              </blockquote>
            ))}
          </div>
          <p className="mk-m-lector" aria-live="polite" data-prueba="reseña-actual">Reseña {actual + 1} de {n}</p>
          {n > 1 && (
            <div className="mk-m-pila-botones">
              <button type="button" className="mk-m-boton" onClick={() => pasar(-1)}>Anterior</button>
              <button type="button" className="mk-m-boton" onClick={() => pasar(1)}>Siguiente</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
