// Foto profunda del encabezado: un lienzo encima de la foto, que la dibuja con profundidad real. Lo que está cerca se
// mueve distinto de lo que está lejos, según el cursor, el paso del encabezado por la pantalla y la inclinación del
// teléfono. La foto de siempre sigue debajo: si algo falla, es la que se ve. Se baja aparte y solo va en nivel completo.
import { useEffect, useRef, type CSSProperties } from "react";
import { origenPermitido } from "./calculos";
import { acercarA, inclinacionDe, llegoA, objetivoProfunda, pasoFirme } from "./calculo-profunda";
import { crearProfunda } from "./profunda";

export interface FotoProfundaProps {
  foto: string;
  /** El mapa de profundidad de la foto: una imagen en grises, más claro es más cerca. */
  mapa: string;
  /** Orígenes cuyas fotos permiten CORS. */
  origenes: string[];
}

const CAJA: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };
const LIENZO = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;opacity:0";
const acotar = (n: number) => Math.max(-1, Math.min(1, n));
/** Los avisos de la animación de entrada de la foto de abajo. */
const ENTRADA = ["animationstart", "animationend", "animationcancel"] as const;

export default function FotoProfunda({ foto, mapa, origenes }: FotoProfundaProps) {
  const caja = useRef<HTMLDivElement>(null);
  const origenesClave = origenes.join("\n");

  useEffect(() => {
    const marco = caja.current;
    if (!marco || !origenPermitido(foto, origenes, location.origin) || !origenPermitido(mapa, origenes, location.origin)) return;
    // El lienzo se crea aquí (no lo dibuja React): cada vez que esto corre parte con un contexto WebGL nuevo.
    const c = document.createElement("canvas");
    c.className = "mk-foto-profunda";
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = LIENZO;
    marco.appendChild(c);
    const motor = crearProfunda(c);
    if (!motor) {
      c.remove();
      return;
    }
    const zona = c.closest<HTMLElement>(".mk-enc") ?? marco.parentElement ?? marco;
    let vivo = true;
    let lista = false;
    let cuadro = 0;
    let visible = typeof IntersectionObserver === "undefined";
    let puntero: { x: number; y: number } | null = null;
    let inclinacion: { x: number; y: number } | null = null;
    // La inclinación: cómo estaba el teléfono al empezar, y la lectura ya llevada a grados enteros (con holgura).
    let base: number | null = null;
    let grados: { b: number; g: number } | null = null;
    let antes = 0;
    let meta = { x: 0, y: 0 };
    let pos = { x: 0, y: 0 };

    const estado = (e: "vivo" | "pausa" | "quieto") => c.setAttribute("data-estado", e);
    /** Hacia dónde tiene que ir la foto, con todo lo que la mueve. */
    const medir = () => {
      const r = zona.getBoundingClientRect();
      meta = objetivoProfunda({ puntero, inclinacion, avance: Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height))) });
    };
    // La foto de abajo, mientras entra con su propia animación (la entrada «zoom»): el lienzo espera a que termine.
    const img = marco.parentElement?.querySelector("img") ?? null;
    const entrando = () =>
      Boolean(img?.getAnimations?.().some((a) => a.timeline === document.timeline && (a.playState === "running" || a.pending)));
    const mostrar = () => {
      if (vivo && lista) c.style.opacity = entrando() ? "0" : "1";
    };
    const paso = (t: number) => {
      cuadro = 0;
      if (!vivo || !lista) return;
      // Avanza según el tiempo que pasó (igual en 60 que en 120 cuadros por segundo); el primer cuadro cuenta uno normal.
      const dt = antes ? Math.min(100, t - antes) : undefined;
      antes = t;
      pos = { x: acercarA(pos.x, meta.x, undefined, dt), y: acercarA(pos.y, meta.y, undefined, dt) };
      const llego = llegoA(pos.x, meta.x) && llegoA(pos.y, meta.y);
      if (llego) pos = { ...meta };
      motor.dibujar(pos.x, pos.y);
      // Dibuja solo mientras algo cambia: al llegar, duerme.
      if (!llego && visible && !document.hidden) cuadro = requestAnimationFrame(paso);
      else {
        antes = 0;
        estado(llego ? "quieto" : "pausa");
      }
    };
    const pedir = () => {
      if (cuadro || !vivo || !lista || !visible || document.hidden) return;
      cuadro = requestAnimationFrame(paso);
      estado("vivo");
    };
    const cambio = () => {
      const x = meta.x;
      const y = meta.y;
      medir();
      // Si la meta no cambió y la foto ya está ahí, no hay nada que dibujar.
      if (meta.x !== x || meta.y !== y || pos.x !== meta.x || pos.y !== meta.y) pedir();
    };
    const mover = (ev: PointerEvent) => {
      const r = zona.getBoundingClientRect();
      if (!r.width || !r.height) return;
      puntero = { x: acotar(((ev.clientX - r.left) / r.width - 0.5) * 2), y: acotar(((ev.clientY - r.top) / r.height - 0.5) * 2) };
      cambio();
    };
    const salir = () => {
      puntero = null;
      cambio();
    };
    const alBajar = () => {
      if (visible) cambio();
    };
    const acostado = () => Boolean(screen.orientation?.angle ?? (window as { orientation?: number }).orientation ?? 0);
    const sinInclinacion = () => {
      base = grados = null;
      if (!inclinacion) return;
      inclinacion = null;
      cambio();
    };
    // La inclinación llega sola en Android; en iPhone, solo si el encabezado ya pidió el permiso (con `mover`).
    const alInclinar = (ev: DeviceOrientationEvent) => {
      // Fuera de la vista no se mide nada (el sensor avisa unas 60 veces por segundo).
      if (!visible || ev.beta === null || ev.gamma === null) return;
      // Con el teléfono acostado los ejes del sensor quedan cambiados: ahí la inclinación no se usa.
      if (acostado()) return sinInclinacion();
      base ??= ev.beta;
      const b = pasoFirme(grados?.b ?? null, ev.beta - base);
      const g = pasoFirme(grados?.g ?? null, ev.gamma);
      // El temblor de la mano no cambia el grado: no hay nada que hacer.
      if (grados && grados.b === b && grados.g === g) return;
      grados = { b, g };
      inclinacion = inclinacionDe(base + b, g, base);
      cambio();
    };
    const fuera = () => {
      if (!vivo) return;
      vivo = false;
      cancelAnimationFrame(cuadro);
      vista?.disconnect();
      tamano?.disconnect();
      zona.removeEventListener("pointermove", mover);
      zona.removeEventListener("pointerleave", salir);
      zona.removeEventListener("pointerup", alSoltar);
      zona.removeEventListener("pointercancel", salir);
      document.removeEventListener("scroll", alBajar, { capture: true });
      document.removeEventListener("visibilitychange", pedir);
      window.removeEventListener("deviceorientation", alInclinar);
      window.removeEventListener("orientationchange", sinInclinacion);
      for (const e of ENTRADA) img?.removeEventListener(e, mostrar);
      motor.destruir();
      c.remove();
    };
    // Con el dedo, al levantarlo la foto vuelve a su lugar (con el cursor, sigue donde quedó hasta que sale).
    const alSoltar = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse") salir();
    };
    const vista =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entradas) => {
            visible = entradas[entradas.length - 1].isIntersecting;
            if (visible) cambio();
          })
        : null;
    const tamano =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (!lista) return;
            motor.ajustar();
            medir();
            motor.dibujar(pos.x, pos.y);
          })
        : null;
    motor.alPerder(fuera);
    zona.addEventListener("pointermove", mover, { passive: true });
    zona.addEventListener("pointerleave", salir);
    zona.addEventListener("pointerup", alSoltar);
    zona.addEventListener("pointercancel", salir);
    document.addEventListener("scroll", alBajar, { capture: true, passive: true });
    document.addEventListener("visibilitychange", pedir);
    window.addEventListener("deviceorientation", alInclinar);
    // Al girar el teléfono, la inclinación parte de cero desde como quede.
    window.addEventListener("orientationchange", sinInclinacion);
    for (const e of ENTRADA) img?.addEventListener(e, mostrar);
    vista?.observe(c);
    tamano?.observe(c);

    void motor.cargar(foto, mapa).then((bien) => {
      if (!vivo) return;
      if (!bien) return fuera();
      lista = true;
      medir();
      // Parte ya en su lugar (sin deslizarse desde el centro) y aparece recién con algo dibujado.
      pos = { ...meta };
      motor.dibujar(pos.x, pos.y);
      mostrar();
      c.setAttribute("data-lista", "");
      estado("quieto");
    });

    return fuera;
    // `origenes` entra por su clave (es un arreglo nuevo en cada render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foto, mapa, origenesClave]);

  return <div ref={caja} aria-hidden="true" style={CAJA} />;
}
