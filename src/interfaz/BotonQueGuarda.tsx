// BotonQueGuarda: el mismo botón cuenta cómo va. «Guardar» → «Guardando…» (con un anillo) → «✓ Guardado» (un saltito) →
// «Guardar»; si falla, «No se pudo» con una sacudida suave. El look lo pone quien lo usa (su clase); el saltito y la
// sacudida van por `scale` y `translate`, así conviven con un botón que se hunde con `transform`.
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";
import { DURA, textoGuardar, type EstadoGuardar } from "./guardar";
import { ritmoDe } from "./tema";

export interface BotonQueGuardaProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Lo que guarda: la pieza sigue la promesa (resuelve: guardado; rechaza: no se pudo). */
  alGuardar?: () => Promise<unknown>;
  /** Controlado: si se pasa, manda sobre el estado propio (alGuardar igual se llama). */
  estado?: EstadoGuardar;
  textos?: Partial<{ guardando: string; bien: string; mal: string }>;
}

const TEXTOS = { guardando: "Guardando…", bien: "✓ Guardado", mal: "No se pudo" };
const ESTADOS: EstadoGuardar[] = ["listo", "guardando", "bien", "mal"];

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-guardar-pila{display:inline-grid;vertical-align:middle}
.mk-guardar-pila>span{grid-area:1/1;display:inline-flex;align-items:center;justify-content:center;gap:.5em;white-space:nowrap}
.mk-guardar-pila>[data-oculto]{visibility:hidden}
.mk-guardar-anillo{flex:none;width:1em;height:1em;box-sizing:border-box;border-radius:50%;border:.16em solid currentColor;border-right-color:transparent;animation:mk-guardar-gira .7s linear infinite}
.mk-guardar-oculto{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@keyframes mk-guardar-gira{to{transform:rotate(1turn)}}
@media (prefers-reduced-motion:reduce){.mk-guardar-anillo{animation:none;border-right-color:currentColor;opacity:.6}}`);

export function BotonQueGuarda({ alGuardar, estado, textos, children, onClick, className, ...resto }: BotonQueGuardaProps) {
  useStyles("boton-guarda", estilos());
  const t = { ...TEXTOS, ...textos };
  const reducido = useReducedMotion();
  const [propio, setPropio] = useState<EstadoGuardar>("listo");
  const e = estado ?? propio;
  const boton = useRef<HTMLButtonElement>(null);
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  const vuelta = useRef(0);
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
      clearTimeout(reloj.current);
    };
  }, []);

  // El saltito al guardar y la sacudida si falla (sobre el mismo botón, sin tocar su transform).
  useEffect(() => {
    if (reducido || !boton.current) return;
    // El ritmo del tema: «quieto» no salta; «manga», más rápido y marcado.
    const r = ritmoDe(boton.current);
    if (r.fuerza === 0) return;
    if (e === "bien") boton.current.animate([{ scale: "1" }, { scale: String(1 + 0.08 * r.fuerza) }, { scale: "1" }], { duration: 380 * r.tiempo, easing: "cubic-bezier(.34,1.56,.64,1)" });
    if (e === "mal") boton.current.animate([0, -6, 5, -2, 0].map((x) => ({ translate: `${x * r.fuerza}px 0` })), { duration: 320 * r.tiempo, easing: "ease-out" });
  }, [e, reducido]);

  const alTocar = (ev: MouseEvent<HTMLButtonElement>) => {
    // Mientras guarda, nada: ni el onClick de quien lo usa ni el envío de un formulario (no manda dos veces).
    if (e === "guardando") {
      ev.preventDefault();
      return;
    }
    onClick?.(ev);
    if (!alGuardar || ev.defaultPrevented) return;
    clearTimeout(reloj.current);
    const mia = ++vuelta.current;
    setPropio("guardando");
    // Si la promesa termina después de otra vuelta o con el botón desmontado, no se toca nada.
    const termina = (r: "bien" | "mal") => {
      if (!vivo.current || mia !== vuelta.current) return;
      setPropio(r);
      reloj.current = setTimeout(() => vivo.current && mia === vuelta.current && setPropio("listo"), DURA[r]);
    };
    alGuardar().then(() => termina("bien"), () => termina("mal"));
  };

  return (
    <>
      <button
        ref={boton}
        type="button"
        className={className}
        data-estado={e}
        aria-busy={e === "guardando" || undefined}
        aria-disabled={e === "guardando" || undefined}
        onClick={alTocar}
        {...resto}
      >
        <span className="mk-guardar-pila">
          {ESTADOS.map((x) => (
            <span key={x} data-oculto={x !== e || undefined} aria-hidden={x !== e || undefined}>
              {x === "guardando" && <span className="mk-guardar-anillo" aria-hidden="true" />}
              {textoGuardar(x, children, t)}
            </span>
          ))}
        </span>
      </button>
      <span className="mk-guardar-oculto" aria-live="polite">{e === "listo" ? "" : t[e]}</span>
    </>
  );
}
