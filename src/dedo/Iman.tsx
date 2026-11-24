// Letras con imán: las letras del título se apartan del dedo o del cursor y vuelven con rebote. Se carga aparte y el
// encabezado la monta solo en nivel completo. No dibuja nada: mueve cada letra con la propiedad `translate`, que no
// choca con las animaciones de entrada del título, y deja de calcular cuando cada letra llegó a donde va (también
// con el cursor quieto encima).
import { useEffect, type RefObject } from "react";
import { empujeIman } from "./calculo-iman";
import { pasoResorte } from "./resorte";

interface Letra {
  el: HTMLElement;
  /** Centro de la letra en reposo, respecto del encabezado. */
  cx: number;
  cy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Lo que tarda, por lo menos, la entrada del título: el imán parte después (y espera si la entrada sigue). */
const ESPERA = 1500;

/** Las letras del título: una por una (`.mk-tc-g`) donde el efecto del título va por palabra, o las del efecto. */
const letrasDe = (enc: HTMLElement) =>
  [...enc.querySelectorAll<HTMLElement>(".mk-enc-titulo .mk-tc-l")].flatMap((l) => {
    const sueltas = l.querySelectorAll<HTMLElement>(".mk-tc-g");
    return sueltas.length ? [...sueltas] : [l];
  });

export default function Iman({ raiz }: { raiz: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const enc = raiz.current;
    if (!enc || typeof requestAnimationFrame === "undefined") return;
    let letras: Letra[] = [];
    let dedo: { x: number; y: number } | null = null;
    let cuadro = 0;
    let antes = 0;
    let vivo = true;
    let mascaras: HTMLElement[] = [];

    /** Mide dónde está cada letra en reposo (quitando el corrimiento que tenga). */
    const medir = () => {
      const marco = enc.getBoundingClientRect();
      const previas = new Map(letras.map((l) => [l.el, l]));
      const ahora = letrasDe(enc);
      // Las que ya no están en el título (cambió el texto) quedan sin corrimiento.
      for (const l of letras) if (!ahora.includes(l.el)) l.el.style.translate = "";
      letras = ahora.map((el) => {
        const p = previas.get(el);
        const r = el.getBoundingClientRect();
        return {
          el,
          cx: r.left + r.width / 2 - marco.left - (p?.x ?? 0),
          cy: r.top + r.height / 2 - marco.top - (p?.y ?? 0),
          x: p?.x ?? 0,
          y: p?.y ?? 0,
          vx: p?.vx ?? 0,
          vy: p?.vy ?? 0,
        };
      });
    };

    const paso = (t: number) => {
      cuadro = 0;
      const dt = Math.min(0.032, antes ? (t - antes) / 1000 : 0.016);
      antes = t;
      let moviendo = false;
      for (const l of letras) {
        const meta = dedo ? empujeIman(l.cx - dedo.x, l.cy - dedo.y) : { x: 0, y: 0 };
        const ex = pasoResorte({ x: l.x, v: l.vx }, meta.x, dt);
        const ey = pasoResorte({ x: l.y, v: l.vy }, meta.y, dt);
        // Llegó a donde va (de vuelta a su lugar, o apartada del cursor que está quieto): se deja ahí y no se sigue.
        if (Math.abs(ex.x - meta.x) < 0.05 && Math.abs(ey.x - meta.y) < 0.05 && Math.abs(ex.v) < 0.5 && Math.abs(ey.v) < 0.5) {
          l.x = meta.x;
          l.y = meta.y;
          l.vx = l.vy = 0;
        } else {
          l.x = ex.x;
          l.vx = ex.v;
          l.y = ey.x;
          l.vy = ey.v;
          moviendo = true;
        }
        const corrida = l.x || l.y ? `${l.x.toFixed(2)}px ${l.y.toFixed(2)}px` : "";
        if (l.el.style.translate !== corrida) l.el.style.translate = corrida;
      }
      if (moviendo) pedir();
      else antes = 0;
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(paso);
    };

    const aqui = (e: PointerEvent) => {
      // Al despertar se mide de nuevo: el título puede haber cambiado de lugar o de texto desde la última vez.
      if (!cuadro) medir();
      const marco = enc.getBoundingClientRect();
      dedo = { x: e.clientX - marco.left, y: e.clientY - marco.top };
      pedir();
    };
    const fuera = () => {
      dedo = null;
      pedir();
    };
    // Con el dedo, al levantarlo las letras vuelven; con el mouse, al salir del encabezado.
    const soltar = (e: PointerEvent) => e.pointerType !== "mouse" && fuera();

    let tamano: ResizeObserver | null = null;
    const partir = () => {
      if (!vivo) return;
      // Donde el título se revela por una máscara, se la suelta: si no, recortaría las letras al apartarse.
      mascaras = [...enc.querySelectorAll<HTMLElement>(".mk-enc-titulo .mk-tc-mascara")];
      for (const m of mascaras) m.style.overflow = "visible";
      medir();
      enc.addEventListener("pointermove", aqui);
      enc.addEventListener("pointerdown", aqui);
      enc.addEventListener("pointerleave", fuera);
      enc.addEventListener("pointerup", soltar);
      enc.addEventListener("pointercancel", fuera);
      if (typeof ResizeObserver !== "undefined") {
        tamano = new ResizeObserver(medir);
        tamano.observe(enc);
      }
    };
    const espera = window.setTimeout(() => {
      // Si la entrada del título todavía corre (un telón, un tráiler por palabra), se espera a que termine. Las
      // animaciones sin fin (temblor, onda) no cuentan.
      const titulo = enc.querySelector(".mk-enc-titulo");
      const entrando = (titulo?.getAnimations?.({ subtree: true }) ?? []).filter((a) => a.playState === "running" && Number.isFinite(Number(a.effect?.getComputedTiming().endTime)));
      if (entrando.length) void Promise.allSettled(entrando.map((a) => a.finished)).then(partir);
      else partir();
    }, ESPERA);

    return () => {
      vivo = false;
      window.clearTimeout(espera);
      cancelAnimationFrame(cuadro);
      tamano?.disconnect();
      enc.removeEventListener("pointermove", aqui);
      enc.removeEventListener("pointerdown", aqui);
      enc.removeEventListener("pointerleave", fuera);
      enc.removeEventListener("pointerup", soltar);
      enc.removeEventListener("pointercancel", fuera);
      for (const l of letras) l.el.style.translate = "";
      for (const m of mascaras) m.style.overflow = "";
    };
  }, [raiz]);
  return null;
}
