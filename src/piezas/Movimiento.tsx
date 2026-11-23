import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { useStyles } from "../utils/styles";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { CSS_MOVIMIENTOS, MOVIMIENTOS, type MovimientoId } from "./movimientos";

export interface MovimientoProps extends HTMLAttributes<HTMLElement> {
  tipo: MovimientoId;
  /**
   * Cuándo se mueve. «entrar»: al aparecer en pantalla (por defecto en entradas).
   * «siempre»: al cargar, y repite si el movimiento es de bucle (por defecto en atención).
   * «hover»: al pasar el mouse o enfocar. «toque»: al tocar o hacer clic.
   */
  cuando?: "entrar" | "siempre" | "hover" | "toque";
  /** Milisegundos. */
  duracion?: number;
  /** Milisegundos antes de empezar (sirve para escalonar varios). */
  retraso?: number;
  /** Veces que se repite; `"infinito"` para no parar. */
  repetir?: number | "infinito";
  como?: "div" | "span" | "li" | "section";
}

/**
 * Aplica un movimiento del catálogo `MOVIMIENTOS` a su contenido.
 * Si el JS no carga, el contenido se ve igual. Con «reducir movimiento», las entradas
 * quedan en un fundido corto y los de atención no se mueven.
 */
export function Movimiento({ tipo, cuando, duracion, retraso = 0, repetir, como = "div", style, className, children, onPointerEnter, onFocus, onClick, onAnimationEnd, ...resto }: MovimientoProps) {
  useStyles("movimientos", CSS_MOVIMIENTOS);
  const def = MOVIMIENTOS[tipo];
  const modo = cuando ?? (def.grupo === "entrada" ? "entrar" : "siempre");
  const reducido = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // «inicial» = sin JS o antes de montar: el contenido se ve.
  const [fase, setFase] = useState<"inicial" | "esperando" | "jugando" | "listo">("inicial");

  useEffect(() => {
    if (modo === "siempre") return setFase("jugando");
    if (modo !== "entrar") return setFase("listo");
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setFase("jugando");
    setFase("esperando");
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setFase("jugando");
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [modo, tipo]);

  const disparar = () => {
    const el = ref.current;
    if (fase === "jugando" && el?.getAnimations) {
      for (const a of el.getAnimations()) {
        a.cancel();
        a.play();
      }
    } else setFase("jugando");
  };

  const veces = repetir === "infinito" ? "infinite" : repetir ?? (def.bucle && modo === "siempre" ? "infinite" : 1);
  let animacion: CSSProperties = {};
  if (fase === "esperando") animacion = { opacity: 0 };
  else if (fase === "jugando") {
    if (reducido) {
      animacion = def.grupo === "entrada" ? { animation: `mk-m-aparecer 300ms ease-out ${retraso}ms both` } : {};
    } else {
      animacion = {
        animation: `mk-m-${tipo} ${duracion ?? def.duracion}ms ${def.curva} ${retraso}ms ${veces} both`,
        transformOrigin: def.origen,
      };
    }
  }

  const Etiqueta = como as "div";
  return (
    <Etiqueta
      {...resto}
      ref={ref as React.Ref<HTMLDivElement>}
      className={className}
      data-movimiento={tipo}
      data-fase={fase}
      style={{ ...(como === "span" ? { display: "inline-block" } : null), ...style, ...animacion }}
      onPointerEnter={(e: React.PointerEvent<HTMLDivElement>) => {
        onPointerEnter?.(e as never);
        if (modo === "hover" && e.pointerType === "mouse") disparar();
      }}
      onFocus={(e: React.FocusEvent<HTMLDivElement>) => {
        onFocus?.(e as never);
        if (modo === "hover") disparar();
      }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(e as never);
        if (modo === "toque") disparar();
      }}
      onAnimationEnd={(e: React.AnimationEvent<HTMLDivElement>) => {
        onAnimationEnd?.(e as never);
        if (e.target === e.currentTarget && (modo === "hover" || modo === "toque")) setFase("listo");
      }}
    >
      {children}
    </Etiqueta>
  );
}
