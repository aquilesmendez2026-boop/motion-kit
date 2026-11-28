// Contador: un número en una insignia («3 pedidos pendientes») que late cuando sube.
import { useEffect, useRef, type HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { textoContador } from "./lista";
import { c, ritmoDe } from "./tema";

export interface ContadorProps extends HTMLAttributes<HTMLSpanElement> {
  valor: number;
  /** Sobre este número muestra «99+». */
  max?: number;
  /** Lo que lee el lector de pantalla («3 pedidos pendientes»). */
  etiqueta?: string;
}

/** Late (escala 1 → 1,18 → 1) cuando el valor sube; al bajar, solo cambia. Sin latido con «reducir movimiento». */
export function Contador({ valor, max = 99, etiqueta, style, ...resto }: ContadorProps) {
  const el = useRef<HTMLSpanElement>(null);
  const antes = useRef(valor);
  const reducido = useReducedMotion();
  useEffect(() => {
    const r = el.current ? ritmoDe(el.current) : { tiempo: 1, fuerza: 1 };
    if (valor > antes.current && !reducido && r.fuerza > 0)
      el.current?.animate([{ transform: "scale(1)" }, { transform: `scale(${1 + 0.18 * r.fuerza})` }, { transform: "scale(1)" }], { duration: 400 * r.tiempo, easing: "ease-out" });
    antes.current = valor;
  }, [valor, reducido]);
  return (
    <span
      ref={el}
      style={{
        display: "inline-grid",
        placeItems: "center",
        boxSizing: "border-box",
        minWidth: "1.6em",
        height: "1.6em",
        padding: "0 .45em",
        borderRadius: 999,
        background: c("acento"),
        color: c("sobreAcento"),
        fontSize: ".8em",
        fontWeight: 700,
        lineHeight: 1,
        ...style,
      }}
      {...resto}
    >
      <span aria-hidden={etiqueta ? true : undefined}>{textoContador(valor, max)}</span>
      {etiqueta && <span style={{ position: "absolute", clipPath: "inset(50%)" }}>{etiqueta}</span>}
    </span>
  );
}
