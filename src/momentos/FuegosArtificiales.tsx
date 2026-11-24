// Fuegos artificiales: ráfagas de chispas que suben, revientan y caen, sobre un lienzo que cubre a su contenedor.
// Decorativo: no recibe toques, no lo leen los lectores y se quita solo al terminar (unos 3 segundos). Con movimiento
// reducido no dibuja nada. Lo monta quien decide celebrar (igual que el confeti).
import { useEffect, useRef, useState } from "react";
import { useStyles } from "../utils/styles";
import { SUBIDA, VIDA, chispa, cohete, colorVivo, duracionFuegos, rafagasDe } from "./calculo-fuegos";

export interface FuegosArtificialesProps {
  /** Decide dónde y de qué color revienta cada ráfaga. Si cambia con la pieza a la vista, parte de nuevo. */
  semilla: number;
  /** Cuántas ráfagas: de 1 a 5. Por defecto, 3. */
  rafagas?: number;
  /** Se llama una vez cuando termina (o de inmediato, si no hay nada que mostrar). */
  alTerminar?: () => void;
}

export const CSS_FUEGOS = ".mk-m-fuegos{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2}";

/** El lado mayor del lienzo, en px reales: más que esto no se nota y cuesta memoria. */
const LADO_MAXIMO = 1600;
/** De dónde sale cada color: las variables de los momentos, o las de la página si la pieza va suelta. */
const COLORES = [
  "var(--mk-m-acento,var(--mk-acento,var(--lm-acento,#e4572e)))",
  "var(--mk-m-acento-2,var(--mk-acento-2,var(--lm-acento,#f4a259)))",
  "var(--mk-m-texto,var(--mk-texto,var(--lm-texto,#1d1d1b)))",
];
/** Si el color del tema no tiene color (negro, gris, blanco), va uno festivo: dorado, rojo o celeste. */
const FESTIVOS = ["#f4b942", "#e4572e", "#3fa7d6"];
/** La cola de cada chispa: tres tramos hacia atrás, de tantos ms cada uno, cada vez más tenues. */
const COLA = 60;
const TRAMOS = [1, 0.5, 0.22];
/** Cuánto dura el destello del estallido, en ms. */
const DESTELLO = 160;

export default function FuegosArtificiales({ semilla, rafagas = 3, alTerminar }: FuegosArtificialesProps) {
  useStyles("momento-fuegos", CSS_FUEGOS);
  const lienzo = useRef<HTMLCanvasElement>(null);
  // La semilla de la celebración que ya terminó: con esa no se dibuja más.
  const [hecha, setHecha] = useState<number | null>(null);
  const aviso = useRef(alTerminar);
  aviso.current = alTerminar;
  const cuantas = useRef(rafagas);
  cuantas.current = rafagas;
  const avisada = useRef<number | null>(null);

  useEffect(() => {
    const terminar = () => {
      setHecha(semilla);
      // Una sola vez por celebración (el modo estricto de React corre este efecto dos veces).
      if (avisada.current === semilla) return;
      avisada.current = semilla;
      aviso.current?.();
    };
    const c = lienzo.current;
    const g = c?.getContext("2d") ?? null;
    const reducido = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!c || !g || reducido || !c.clientWidth || !c.clientHeight || typeof requestAnimationFrame === "undefined") {
      terminar();
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const k = Math.min(1, LADO_MAXIMO / Math.max(c.clientWidth * dpr, c.clientHeight * dpr));
    const ancho = (c.width = Math.max(1, Math.round(c.clientWidth * dpr * k)));
    const alto = (c.height = Math.max(1, Math.round(c.clientHeight * dpr * k)));
    const lado = Math.min(ancho, alto);
    const grosor = Math.max(1.5 * dpr * k, lado / 200);
    // Los colores se leen una vez, ya resueltos por el navegador.
    const colores = COLORES.map((v, i) => {
      c.style.color = v;
      return colorVivo(getComputedStyle(c).color, FESTIVOS[i]);
    });
    c.style.color = "";
    const lista = rafagasDe(semilla, cuantas.current);
    const total = duracionFuegos(cuantas.current);
    let cuadro = 0;
    let antes = 0;
    let reloj = 0;
    let visible = typeof IntersectionObserver === "undefined";

    const dibujar = () => {
      g.clearRect(0, 0, ancho, alto);
      g.lineCap = "round";
      // Donde dos luces se cruzan, se suman (como la luz de verdad).
      g.globalCompositeOperation = "lighter";
      for (const r of lista) {
        const t = reloj - r.parte;
        const cx = r.x * ancho;
        g.strokeStyle = g.fillStyle = colores[r.color];
        // El cohete que sube: una punta firme y una cola que se desvanece.
        const sube = cohete(r, t);
        if (sube) {
          for (let j = 0; j < TRAMOS.length; j++) {
            const a = cohete(r, Math.max(0, t - j * 45)) ?? sube;
            const b = cohete(r, Math.max(0, t - (j + 1) * 45)) ?? sube;
            g.globalAlpha = TRAMOS[j];
            g.lineWidth = grosor * (1.2 - j * 0.25);
            g.beginPath();
            g.moveTo(cx, a.y * alto);
            g.lineTo(cx, b.y * alto);
            g.stroke();
          }
          continue;
        }
        const te = t - SUBIDA;
        if (te < 0 || te >= VIDA) continue;
        const cy = r.y * alto;
        const brillo = chispa(r.chispas[0], te)?.brillo ?? 0;
        // El destello del estallido, que dura un instante.
        if (te < DESTELLO) {
          g.globalAlpha = (1 - te / DESTELLO) * 0.9;
          g.beginPath();
          g.arc(cx, cy, lado * 0.07 * (0.35 + te / DESTELLO), 0, Math.PI * 2);
          g.fill();
        }
        // Las chispas de una ráfaga comparten brillo: cada tramo de sus colas va en un solo trazo. El tramo de la
        // punta es el más firme; hacia atrás se van desvaneciendo y afinando.
        for (let j = 0; j < TRAMOS.length; j++) {
          g.beginPath();
          for (const ch of r.chispas) {
            const p = chispa(ch, Math.max(0, te - j * COLA));
            const q = chispa(ch, Math.max(0, te - (j + 1) * COLA));
            if (!p || !q) continue;
            g.moveTo(cx + p.dx * lado, cy + p.dy * lado);
            g.lineTo(cx + q.dx * lado, cy + q.dy * lado);
          }
          g.globalAlpha = brillo * TRAMOS[j];
          g.lineWidth = grosor * (1 - j * 0.2);
          g.stroke();
          // El resplandor de la punta.
          if (!j) {
            g.globalAlpha = brillo * 0.25;
            g.lineWidth = grosor * 3.2;
            g.stroke();
          }
        }
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    };
    const puede = () => visible && document.visibilityState !== "hidden";
    const paso = (t: number) => {
      cuadro = 0;
      // El reloj es propio: si la pestaña se oculta o el bloque sale de la vista, al volver sigue donde iba.
      reloj += antes ? Math.min(50, t - antes) : 0;
      antes = t;
      if (reloj >= total) {
        g.clearRect(0, 0, ancho, alto);
        terminar();
        return;
      }
      dibujar();
      pedir();
    };
    const pedir = () => {
      if (cuadro) return;
      if (puede()) cuadro = requestAnimationFrame(paso);
      else antes = 0;
    };
    const vista =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entradas) => {
            visible = entradas[entradas.length - 1].isIntersecting;
            pedir();
          })
        : null;
    vista?.observe(c);
    document.addEventListener("visibilitychange", pedir);
    pedir();
    return () => {
      cancelAnimationFrame(cuadro);
      vista?.disconnect();
      document.removeEventListener("visibilitychange", pedir);
      // Se suelta la memoria del lienzo (en iOS los lienzos tienen un tope).
      c.width = c.height = 0;
    };
  }, [semilla]);

  if (hecha === semilla) return null;
  return <canvas ref={lienzo} className="mk-m-fuegos" aria-hidden="true" />;
}
