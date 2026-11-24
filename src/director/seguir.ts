// El tercer ejecutor del Director: lo que sigue al cursor o a la velocidad del scroll, con resorte, en un solo bucle
// (el compás). Se baja aparte (`import()`): solo lo necesitan las partituras con escenas `puntero` o `velocidad`.
import { velocidadScroll, type MuestraScroll } from "../dedo/calculo-impulso";
import { crearCompas } from "./compas";
import type { Escena } from "./modelo";
import { llego, punteroEn, seguir, valorSeguido, velocidadNormal } from "./senales";

export interface Seguimiento {
  /** Algo cambió (lo que se toca, la vista, la pestaña): el compás mira si tiene trabajo. */
  despertar(): void;
  /** Con reloj manual: mueve el compás (ms). */
  avanzar(ms: number): void;
  /** Con reloj manual: pone una señal a mano, de -1 a 1. */
  senal(nombre: "puntero" | "velocidad", x: number, y: number): void;
  desmontar(): void;
}

export interface OpcionesSeguir {
  raiz: HTMLElement;
  escenas: Escena[];
  buscar: (nombre: string) => HTMLElement[];
  /** ¿Se está tocando algo que se aprieta dentro de este elemento? */
  tocado: (el: Element) => boolean;
  aLaVista: () => boolean;
  manual: boolean;
  /** Cuántos elementos pueden seguir, a lo más, en toda la partitura. */
  tope: number;
}

export function montarSeguir(o: OpcionesSeguir): Seguimiento {
  const { raiz, manual } = o;
  const compas = crearCompas(() => o.aLaVista() && !document.hidden, manual);
  const limpiar: (() => void)[] = [];
  const metas = { puntero: { x: 0, y: 0 }, velocidad: { x: 0, y: 0 } };
  let quedan = o.tope;
  for (const escena of o.escenas) {
    if (escena.con !== "puntero" && escena.con !== "velocidad") continue;
    const meta = metas[escena.con];
    const seguidores = escena.pasos.flatMap((paso) => o.buscar(paso.actor).map((el) => ({ paso, el, ex: { x: 0, v: 0 }, ey: { x: 0, v: 0 } }))).slice(0, quedan);
    quedan -= seguidores.length;
    if (!seguidores.length) continue;
    let ultimo = 0;
    const esVelocidad = escena.con === "velocidad";
    limpiar.push(
      compas.sumar((dt) => {
        // La velocidad vuelve a cero si hace un rato que no hay scroll.
        if (esVelocidad && !manual && performance.now() - ultimo > 160) meta.x = meta.y = 0;
        let queda = false;
        for (const s of seguidores) {
          // Regla de la casa: mientras se apunta a algo que se aprieta dentro del actor, se queda donde está (y sin
          // impulso: no sigue por inercia).
          if (o.tocado(s.el)) {
            s.ex.v = s.ey.v = 0;
            continue;
          }
          s.ex = seguir(s.ex, meta.x, dt, s.paso.resorte);
          s.ey = seguir(s.ey, meta.y, dt, s.paso.resorte);
          // Al llegar se deja justo en la meta (no a un pelo de ella), y ahí duerme.
          if (llego(s.ex, meta.x)) s.ex = { x: meta.x, v: 0 };
          if (llego(s.ey, meta.y)) s.ey = { x: meta.y, v: 0 };
          Object.assign(s.el.style, valorSeguido(s.paso, s.ex.x, s.ey.x));
          queda ||= s.ex.x !== meta.x || s.ey.x !== meta.y;
        }
        return queda;
      }),
      () => {
        for (const s of seguidores) {
          Object.assign(s.el.style, { translate: "", rotate: "", scale: "", opacity: "" });
          // Que no quede un `style=""` vacío de recuerdo.
          if (s.el.getAttribute("style") === "") s.el.removeAttribute("style");
        }
      },
    );
    if (manual) continue;
    if (esVelocidad) {
      const muestras: MuestraScroll[] = [];
      const alBajar = () => {
        if (!o.aLaVista()) return;
        ultimo = performance.now();
        // La posición se toma de la propia raíz: sirve si baja la ventana o un contenedor.
        meta.x = meta.y = velocidadNormal(velocidadScroll(muestras, ultimo, -raiz.getBoundingClientRect().top));
        compas.despertar();
      };
      document.addEventListener("scroll", alBajar, { capture: true, passive: true });
      limpiar.push(() => document.removeEventListener("scroll", alBajar, { capture: true }));
    } else {
      const mover = (ev: PointerEvent) => {
        Object.assign(meta, punteroEn(raiz.getBoundingClientRect(), ev.clientX, ev.clientY));
        compas.despertar();
      };
      const salir = () => {
        meta.x = meta.y = 0;
        compas.despertar();
      };
      raiz.addEventListener("pointermove", mover, { passive: true });
      raiz.addEventListener("pointerleave", salir);
      limpiar.push(() => {
        raiz.removeEventListener("pointermove", mover);
        raiz.removeEventListener("pointerleave", salir);
      });
    }
  }
  return {
    despertar: () => compas.despertar(),
    avanzar: (ms) => compas.avanzar(ms),
    senal(nombre, x, y) {
      metas[nombre].x = x;
      metas[nombre].y = y;
    },
    desmontar() {
      compas.parar();
      for (const f of limpiar) f();
    },
  };
}
