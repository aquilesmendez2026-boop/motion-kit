// Los dibujos del «llamado con vida»: una escena chica por bloque, en una caja de 96. Trazos propios. Las clases dicen
// cómo se mueve cada parte (ver CSS_LLAMADO): `cae`, `voltea`, `abre`, `sube`, `raya`, `marca`, `bota` y `late`.
import type { CSSProperties, ReactNode } from "react";

export type EscenaLlamado = "agenda" | "pedidos" | "buzon" | "cotizaciones" | "encuestas" | "contacto";

/** Cuándo parte una parte (ms). */
const en = (ms: number) => ({ animationDelay: `${ms}ms` }) as CSSProperties;

export const ESCENAS_LLAMADO: Record<EscenaLlamado, (abierto: boolean) => ReactNode> = {
  // Una hoja de calendario que se voltea y deja marcado un día.
  agenda: () => (
    <>
      <rect x="18" y="22" width="60" height="56" rx="8" />
      <path d="M34 15v12M62 15v12" />
      <rect className="mk-ll-acento mk-ll-voltea" x="18" y="22" width="60" height="17" rx="8" />
      <g className="mk-ll-relleno">
        <circle cx="34" cy="52" r="2.6" />
        <circle cx="48" cy="52" r="2.6" />
        <circle cx="34" cy="65" r="2.6" />
        <circle cx="48" cy="65" r="2.6" />
      </g>
      <circle className="mk-ll-acento mk-ll-marca" style={en(450)} cx="62" cy="59" r="8" />
    </>
  ),
  // Una bolsa que se asienta con rebote; el punto late si está abierto.
  pedidos: (abierto) => (
    <>
      <g className="mk-ll-cae">
        <path d="M27 38h42l4 40H23z" />
        <path d="M38 38v-6a10 10 0 0 1 20 0v6" />
      </g>
      {/* Abierto lleva dos animaciones (aparecer y latir), cada una con su espera: una sola espera pisaría a las dos. */}
      <circle className={abierto ? "mk-ll-acento mk-ll-marca mk-ll-late" : "mk-ll-apagado mk-ll-marca"} style={abierto ? { animationDelay: "380ms, 1200ms" } : en(380)} cx="72" cy="24" r="7" />
    </>
  ),
  // Un sobre que se abre y asoma una carta.
  buzon: () => (
    <>
      <rect x="16" y="36" width="64" height="42" rx="6" />
      <g className="mk-ll-sube" style={en(380)}>
        <rect className="mk-ll-papel" x="26" y="22" width="44" height="34" rx="3" />
        <path className="mk-ll-acento-trazo" d="M34 32h28M34 41h18" />
      </g>
      <path className="mk-ll-frente" d="M16 78V42l32 20 32-20v36z" />
      <path className="mk-ll-abre" d="M16 38l32 20 32-20" />
    </>
  ),
  // Una hoja que se escribe línea a línea y termina con el total subrayado.
  cotizaciones: () => (
    <>
      <rect x="24" y="14" width="48" height="68" rx="6" />
      <path className="mk-ll-raya" style={en(120)} d="M33 30h30" />
      <path className="mk-ll-raya" style={en(300)} d="M33 41h30" />
      <path className="mk-ll-raya" style={en(480)} d="M33 52h18" />
      <path className="mk-ll-acento-trazo mk-ll-grueso mk-ll-raya" style={en(720)} d="M33 68h30" />
    </>
  ),
  // Tres casillas; una se marca con un visto.
  encuestas: () => (
    <>
      <rect x="20" y="16" width="17" height="17" rx="4" />
      <rect x="20" y="40" width="17" height="17" rx="4" />
      <rect x="20" y="64" width="17" height="17" rx="4" />
      <path d="M46 24.5h30M46 48.5h30M46 72.5h20" />
      <path className="mk-ll-acento-trazo mk-ll-grueso mk-ll-marca" style={en(420)} d="M23.5 48.5l4.5 5 8-10" />
    </>
  ),
  // Una burbuja de chat con tres puntos que «escriben» un momento.
  contacto: () => (
    <>
      <path className="mk-ll-cae" d="M20 22h56a7 7 0 0 1 7 7v28a7 7 0 0 1-7 7H46L31 77V64H20a7 7 0 0 1-7-7V29a7 7 0 0 1 7-7z" />
      <g className="mk-ll-acento">
        <circle className="mk-ll-bota" style={en(450)} cx="34" cy="43" r="4" />
        <circle className="mk-ll-bota" style={en(600)} cx="48" cy="43" r="4" />
        <circle className="mk-ll-bota" style={en(750)} cx="62" cy="43" r="4" />
      </g>
    </>
  ),
};
