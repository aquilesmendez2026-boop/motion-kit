import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

/** Con qué se mueve la escena. */
export type FuenteMovimiento = "puntero" | "scroll" | "inclinacion";

export interface OpcionesMovimiento {
  /** Por defecto dedo o cursor y scroll. «inclinacion» usa el giroscopio (en iPhone pide permiso con el primer toque). */
  mover?: FuenteMovimiento[];
  /** Suavidad: cuánto se acerca a la posición nueva en cada cuadro (0,02 lento a 0,3 rápido). */
  suavidad?: number;
  /** Apagado (por ejemplo, si no hay capas ni luz). */
  apagado?: boolean;
}

type ConPermiso = { requestPermission?: () => Promise<"granted" | "denied"> };

/**
 * Sigue el dedo, el cursor, el scroll o la inclinación del teléfono y deja la posición en variables CSS del elemento:
 * `--mk-cx` y `--mk-cy` (de -1 a 1, el centro es 0) y `--mk-cs` (scroll: 0 arriba, 1 cuando el elemento ya salió).
 * Las capas las leen con `translate` y `scale`, que el navegador anima sin trabar la página.
 * Solo corre mientras el elemento se ve; con movimiento reducido no hace nada.
 */
export function useMovimientoEscena(ref: RefObject<HTMLElement | null>, { mover = ["puntero", "scroll"], suavidad = 0.08, apagado = false }: OpcionesMovimiento = {}) {
  const reducido = useReducedMotion();
  const clave = mover.join(",");

  useEffect(() => {
    const el = ref.current;
    if (!el || apagado || reducido || typeof window === "undefined") return;
    const usa = new Set(clave.split(",") as FuenteMovimiento[]);
    const meta = { x: 0, y: 0, s: 0 };
    const act = { x: 0, y: 0, s: 0 };
    let cuadro = 0;
    let visible = false;

    const pintar = () => {
      cuadro = 0;
      act.x += (meta.x - act.x) * suavidad;
      act.y += (meta.y - act.y) * suavidad;
      act.s += (meta.s - act.s) * Math.min(1, suavidad * 3);
      el.style.setProperty("--mk-cx", act.x.toFixed(4));
      el.style.setProperty("--mk-cy", act.y.toFixed(4));
      el.style.setProperty("--mk-cs", act.s.toFixed(4));
      const quieto = Math.abs(meta.x - act.x) < 0.001 && Math.abs(meta.y - act.y) < 0.001 && Math.abs(meta.s - act.s) < 0.001;
      if (!quieto && visible) cuadro = requestAnimationFrame(pintar);
    };
    const pedir = () => {
      if (!cuadro && visible) cuadro = requestAnimationFrame(pintar);
    };
    const limitar = (v: number) => Math.max(-1, Math.min(1, v));

    const desde = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      meta.x = limitar(((cx - r.left) / r.width) * 2 - 1);
      meta.y = limitar(((cy - r.top) / r.height) * 2 - 1);
      pedir();
    };
    const alPuntero = (e: PointerEvent) => desde(e.clientX, e.clientY);
    const alTocar = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) desde(t.clientX, t.clientY);
    };
    const alSalir = () => {
      meta.x = 0;
      meta.y = 0;
      pedir();
    };
    const alScroll = () => {
      const r = el.getBoundingClientRect();
      meta.s = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
      pedir();
    };
    const alInclinar = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      meta.x = limitar(e.gamma / 25);
      meta.y = limitar((e.beta - 45) / 25);
      pedir();
    };

    const quitar: (() => void)[] = [];
    const escuchar = <K extends keyof WindowEventMap>(blanco: Window | HTMLElement, tipo: K, fn: (e: WindowEventMap[K]) => void) => {
      blanco.addEventListener(tipo, fn as EventListener, { passive: true });
      quitar.push(() => blanco.removeEventListener(tipo, fn as EventListener));
    };

    if (usa.has("puntero")) {
      escuchar(el, "pointermove", alPuntero);
      escuchar(el, "touchmove", alTocar);
      escuchar(el, "pointerleave", alSalir);
    }
    if (usa.has("scroll")) {
      escuchar(window, "scroll", alScroll);
      alScroll();
    }
    if (usa.has("inclinacion") && "DeviceOrientationEvent" in window) {
      const DOE = window.DeviceOrientationEvent as unknown as ConPermiso;
      if (typeof DOE.requestPermission === "function") {
        // iPhone: el permiso solo se puede pedir dentro de un toque.
        const pedirPermiso = () => {
          DOE.requestPermission!().then((r) => r === "granted" && escuchar(window, "deviceorientation", alInclinar)).catch(() => {});
        };
        el.addEventListener("click", pedirPermiso, { once: true });
        quitar.push(() => el.removeEventListener("click", pedirPermiso));
      } else {
        escuchar(window, "deviceorientation", alInclinar);
      }
    }

    const vista = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible) pedir();
        })
      : undefined;
    if (vista) vista.observe(el);
    else visible = true;

    return () => {
      cancelAnimationFrame(cuadro);
      vista?.disconnect();
      quitar.forEach((q) => q());
      for (const v of ["--mk-cx", "--mk-cy", "--mk-cs"]) el.style.removeProperty(v);
    };
  }, [ref, clave, suavidad, apagado, reducido]);
}
