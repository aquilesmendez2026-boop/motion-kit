// Los botones del panel: el grande (la acción principal de una sección, el `BotonModulo` de La Mente) y el chico (una
// acción de una tarjeta, en píldora; `BotonChico`), con su tono principal o de peligro. Leen el tema; se levantan al
// pasar y se hunden al tocar (solo con transform). Ver docs/un-solo-motor/piezas-del-panel.md.
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { useStyles } from "../utils/styles";

export interface BotonPanelProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tamano?: "grande" | "chico";
  /** En el chico: `principal` (amarillo de cartel) o `peligro` (rojo). */
  tono?: "principal" | "peligro";
}

const T = "var(--mk-texto,#1C1A22)";
let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-bp{display:inline-flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box;min-height:44px;cursor:pointer;border:var(--mk-trazo,2.5px solid ${T});transition:transform 120ms ease-out}
.mk-bp:focus-visible{outline:3px solid var(--mk-acento,#9333ea);outline-offset:2px}
.mk-bp:disabled{opacity:.55;cursor:not-allowed}
.mk-bp[data-tamano=grande]{font-family:var(--mk-fuente-cartel,inherit);font-size:1rem;font-weight:400;padding:10px 18px;background:var(--mk-cartel,#ffc83d);color:var(--mk-sobre-sol,#10223f);border-radius:var(--mk-boton-radio-grande,12px);box-shadow:var(--mk-sombra,4px 4px 0 ${T})}
.mk-bp[data-tamano=grande]:hover:not(:disabled){transform:var(--mk-levantar,translate(-1px,-1px));box-shadow:var(--mk-sombra-pasar,5px 5px 0 ${T})}
.mk-bp[data-tamano=grande]:active:not(:disabled){transform:var(--mk-hundir-grande,translate(3px,3px));box-shadow:var(--mk-sombra-hundida,1px 1px 0 ${T})}
.mk-bp[data-tamano=chico]{font:inherit;font-size:.9rem;font-weight:600;padding:6px 14px;background:var(--mk-superficie,#fff);color:${T};border-radius:var(--mk-pildora,999px)}
.mk-bp[data-tamano=chico]:hover:not(:disabled){background:var(--mk-cielo,#eef8fd)}
.mk-bp[data-tamano=chico]:active:not(:disabled){transform:translateY(1px)}
.mk-bp[data-tono=principal]{background:var(--mk-cartel,#ffc83d);color:var(--mk-sobre-sol,#10223f)}
.mk-bp[data-tono=principal]:hover:not(:disabled){background:var(--mk-cartel,#ffc83d)}
.mk-bp[data-tono=peligro]{border-color:var(--mk-mal,#b42318);color:var(--mk-mal,#b42318)}
@media (prefers-reduced-motion:reduce){.mk-bp{transition:none}.mk-bp:is(:hover,:active){transform:none!important}}`);

export const BotonPanel = /* @__PURE__ */ forwardRef<HTMLButtonElement, BotonPanelProps>(function BotonPanel({ tamano = "grande", tono, type = "button", className, children, ...resto }, ref) {
  useStyles("boton-panel", estilos());
  return (
    <button ref={ref} type={type} {...resto} className={className ? `mk-bp ${className}` : "mk-bp"} data-mk-adorno="boton" data-tamano={tamano} data-tono={tono}>
      {children}
    </button>
  );
});
