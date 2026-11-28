// El estado de una tarjeta del panel, en píldora (Nueva, Conversando, Acordada…). Cinco tonos que se leen con
// contraste AA; el tema puede cambiar cada fondo con `--mk-estado-<tono>`.
import type { HTMLAttributes, ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { colorDeTono, type TonoEstado } from "./tonos";

export interface PastillaProps extends HTMLAttributes<HTMLSpanElement> {
  tono: TonoEstado;
  children: ReactNode;
}

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-pastilla{display:inline-flex;align-items:center;gap:6px;box-sizing:border-box;font-size:.78rem;font-weight:700;line-height:1.4;padding:2px 10px;max-width:100%;overflow-wrap:anywhere;border:var(--mk-trazo,2.5px solid var(--mk-texto,#1C1A22));border-radius:var(--mk-pildora,999px)}`);

export function Pastilla({ tono, className, style, children, ...resto }: PastillaProps) {
  useStyles("pastilla", estilos());
  const { fondo, texto } = colorDeTono(tono);
  return (
    <span {...resto} className={className ? `mk-pastilla ${className}` : "mk-pastilla"} data-mk-adorno="estado" data-tono={tono} style={{ background: fondo, color: texto, ...style }}>
      {children}
    </span>
  );
}
