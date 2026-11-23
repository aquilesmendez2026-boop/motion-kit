import type { HTMLAttributes } from "react";
import { Boton } from "./Boton";
import { PACKS_BOTONES, type PackBotonId } from "./packs";

export interface EnlaceBoton { texto: string; href: string }

export interface BotonesPackProps extends HTMLAttributes<HTMLDivElement> {
  pack?: PackBotonId;
  principal: EnlaceBoton;
  secundario?: EnlaceBoton;
  tamano?: "sm" | "md" | "lg";
}

/** Pareja de botones (principal y secundario) vestida con un pack. */
export function BotonesPack({ pack = "clasico", principal, secundario, tamano = "lg", style, ...resto }: BotonesPackProps) {
  const p = PACKS_BOTONES[pack] ?? PACKS_BOTONES.clasico;
  const externo = (h: string) => (/^https?:/.test(h) ? { target: "_blank" } : null);
  return (
    <div {...resto} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".9rem 1.1rem", ...style }}>
      <Boton href={principal.href} tamano={tamano} {...p.principal} {...externo(principal.href)}>{principal.texto}</Boton>
      {secundario && <Boton href={secundario.href} tamano={tamano} {...p.secundario} {...externo(secundario.href)}>{secundario.texto}</Boton>}
    </div>
  );
}
