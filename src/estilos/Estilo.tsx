import { useEffect, type CSSProperties, type HTMLAttributes, type PointerEvent } from "react";
import { useStyles } from "../utils/styles";
import { ESTILOS, type EstiloId } from "./estilos";
import { ContextoEstilo, useEstilo } from "./contexto";
import { CSS_ESTILOS } from "./css";
import { CURSORES } from "./texturas";
import { sonar, vibrar } from "./sonidos";

export interface EstiloProps extends HTMLAttributes<HTMLDivElement> {
  nombre: EstiloId;
  /** Capa de textura del estilo (líneas de tubo, grano, fotocopia). Por defecto sí. */
  textura?: boolean;
  /** Cursor propio del estilo (solo con mouse). */
  cursor?: boolean;
  /** Sonido corto al tocar botones. Desactivado por defecto. */
  sonidos?: boolean;
  /** Vibración corta al tocar botones (Android). Desactivado por defecto. */
  vibracion?: boolean;
  /** Carga las fuentes del estilo desde Google Fonts. Sin esto se usan fuentes del sistema parecidas. */
  fuentes?: boolean;
  /** Cambia colores sueltos, por ejemplo `{ "--mk-acento": "#00e0a0" }`. */
  colores?: Record<string, string>;
}

export { useEstilo };

const fuentesCargadas = new Set<string>();

/**
 * Viste todo lo que contiene con un estilo completo: colores, letras, botones, tarjetas,
 * textura, cursor y sonidos. Las piezas del kit adentro toman el estilo solas.
 */
export function Estilo({ nombre, textura = true, cursor, sonidos, vibracion, fuentes, colores, className, style, children, onPointerDown, ...resto }: EstiloProps) {
  useStyles("estilos", CSS_ESTILOS);
  const def = ESTILOS[nombre];

  useEffect(() => {
    if (!fuentes || typeof document === "undefined" || fuentesCargadas.has(nombre)) return;
    fuentesCargadas.add(nombre);
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = `https://fonts.googleapis.com/css2?${def.googleFonts}&display=swap`;
    document.head.appendChild(l);
  }, [fuentes, nombre, def.googleFonts]);

  const alTocar = (e: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e);
    if (!sonidos && !vibracion) return;
    const t = (e.target as HTMLElement).closest(".mk-btn,[data-mk-sonido]");
    if (!t || (t as HTMLButtonElement).disabled) return;
    if (sonidos) sonar(def.sonido);
    if (vibracion) vibrar();
  };

  const vars = { ...def.vars, ...colores, ...(cursor ? { "--mk-cursor": CURSORES[nombre] } : null), ...style } as CSSProperties;
  return (
    <ContextoEstilo.Provider value={def}>
      <div
        {...resto}
        className={`mk-estilo${className ? " " + className : ""}`}
        data-mk-estilo={nombre}
        data-cursor={cursor ? "" : undefined}
        style={vars}
        onPointerDown={alTocar}
      >
        {children}
        {textura && <div className="mk-estilo-textura" aria-hidden="true" />}
      </div>
    </ContextoEstilo.Provider>
  );
}
