// Estela y chispas: el cursor deja una estela que se apaga sobre la página, y un toque (dedo o lápiz) suelta chispas.
// Un lienzo fijo sobre toda la ventana, puesto directo en el `body` (fuera de la página, para que nada lo recorte). No
// recibe toques ni lo lee el lector de pantalla. Se carga aparte y la página lo monta solo en nivel completo.
import { useEffect, type RefObject } from "react";
import { useStyles } from "../utils/styles";
import { crearLienzo, type Lienzo } from "../efectos/lienzo";
import { chispasDe, pasoChispas, recortarEstela, tramosEstela, type Chispa, type PuntoEstela } from "./calculo-estela";

// Solo se ve (y el navegador solo lo compone) mientras hay algo vivo.
export const CSS_ESTELA =
  ".mk-estela{position:fixed;inset:0;width:100%;height:100%;z-index:999;pointer-events:none;visibility:hidden}" +
  ".mk-estela[data-estado=vivo]{visibility:visible}";

/** Cuánto dura la estela (ms), cuánto vive una chispa (s) y hasta cuántos píxeles reales por px de CSS. */
const VIDA = 450;
const VIDA_CHISPA = 0.5;
const DENSIDAD = 1.5;
/** Si pasan más de estos ms entre dos movimientos, parte una estela nueva (no se une con una recta a la anterior). */
const PAUSA = 120;
/** Cuánto se puede mover el dedo (px) entre que baja y sube para que siga siendo un toque. */
const MOVIMIENTO_DE_TOQUE = 10;

export default function Estela({ pagina }: { pagina: RefObject<HTMLDivElement | null> }) {
  useStyles("estela", CSS_ESTELA);
  useEffect(() => {
    const el = pagina.current;
    if (!el) return;
    const cv = document.createElement("canvas");
    cv.className = "mk-estela";
    cv.setAttribute("aria-hidden", "true");
    let puntos: PuntoEstela[] = [];
    let chispas: Chispa[] = [];
    let toques = 0;
    let color = "";

    const paso = (dt: number, l: Lienzo) => {
      const ahora = performance.now();
      puntos = recortarEstela(puntos, ahora, VIDA);
      chispas = pasoChispas(chispas, dt);
      const { ctx } = l;
      ctx.clearRect(0, 0, l.ancho, l.alto);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineCap = "round";
      // La estela: cada tramo más fino y más tenue mientras más viejo.
      for (const tramo of tramosEstela(puntos, ahora, VIDA)) {
        ctx.globalAlpha = tramo.fresco * 0.7;
        ctx.lineWidth = 1 + tramo.fresco * 5;
        ctx.beginPath();
        ctx.moveTo(tramo.x1, tramo.y1);
        ctx.lineTo(tramo.x2, tramo.y2);
        ctx.stroke();
      }
      for (const c of chispas) {
        // Parten grandes y brillantes y se achican al apagarse.
        const fresca = c.vida / VIDA_CHISPA;
        ctx.globalAlpha = Math.min(1, fresca * 1.6);
        ctx.beginPath();
        ctx.arc(c.x, c.y, 1.2 + fresca * 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      return puntos.length > 0 || chispas.length > 0;
    };

    document.body.appendChild(cv);
    const lienzo = crearLienzo(cv, paso, undefined, DENSIDAD);
    if (!lienzo) {
      cv.remove();
      return;
    }
    /**
     * Al partir se lee el acento de la página, resuelto por el navegador (el lienzo está fuera de la página y no hereda
     * sus variables). Mientras corre ya lo tiene: no se lee en cada movimiento del cursor.
     */
    const despertar = () => {
      if (cv.getAttribute("data-estado") !== "vivo") {
        const cs = getComputedStyle(el);
        cv.style.color = cs.getPropertyValue("--mk-acento").trim() || cs.getPropertyValue("--lm-acento").trim() || "#7c5cff";
        color = getComputedStyle(cv).color;
      }
      lienzo.correr();
    };
    const mover = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse") return;
      const t = performance.now();
      const ultimo = puntos[puntos.length - 1];
      // Tras una pausa (el cursor salió de la página y volvió, o se detuvo) parte una estela nueva; la anterior se apaga sola.
      puntos.push({ x: ev.clientX, y: ev.clientY, t, corte: ultimo !== undefined && t - ultimo.t > PAUSA });
      despertar();
    };
    // Las chispas son de un toque: el dedo baja y sube casi en el mismo punto. Empezar a bajar la página también
    // parte con el dedo abajo, pero ahí el dedo se mueve o el navegador cancela el puntero: eso no suelta chispas.
    let apoyado: { id: number; x: number; y: number } | null = null;
    const apoyar = (ev: PointerEvent) => {
      apoyado = ev.pointerType === "mouse" ? null : { id: ev.pointerId, x: ev.clientX, y: ev.clientY };
    };
    const levantar = (ev: PointerEvent) => {
      const a = apoyado;
      apoyado = null;
      if (!a || a.id !== ev.pointerId || Math.hypot(ev.clientX - a.x, ev.clientY - a.y) > MOVIMIENTO_DE_TOQUE) return;
      chispas = chispas.concat(chispasDe(ev.clientX, ev.clientY, ++toques));
      despertar();
    };
    const cancelar = () => {
      apoyado = null;
    };
    el.addEventListener("pointermove", mover, { passive: true });
    el.addEventListener("pointerdown", apoyar, { passive: true });
    el.addEventListener("pointerup", levantar, { passive: true });
    el.addEventListener("pointercancel", cancelar);

    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerdown", apoyar);
      el.removeEventListener("pointerup", levantar);
      el.removeEventListener("pointercancel", cancelar);
      lienzo.destruir();
      cv.remove();
    };
  }, [pagina]);
  return null;
}
