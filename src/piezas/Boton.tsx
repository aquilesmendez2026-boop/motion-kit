import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import { useStyles } from "../utils/styles";
import { VARS } from "./colores";

export type BotonVariante = "solido" | "contorno" | "suave" | "fantasma" | "degradado" | "vidrio";
export type BotonEfecto = "ninguno" | "elevar" | "relleno" | "brillo" | "flecha" | "deslizar" | "latido" | "borde";
export type BotonForma = "pastilla" | "recto" | "tecla" | "ticket" | "sello" | "pixel" | "subrayado" | "circulo";

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: BotonVariante;
  /** Efecto al pasar el mouse (en celular solo queda el hundido al tocar, salvo «latido» y «borde», que son continuos). */
  efecto?: BotonEfecto;
  tamano?: "sm" | "md" | "lg";
  /** Silueta: pastilla (por defecto), recto, tecla, ticket, sello, pixel, subrayado (enlace) o circulo (solo ícono, con `aria-label`). */
  forma?: BotonForma;
  /** Muestra un indicador de carga y desactiva el botón. */
  cargando?: boolean;
  icono?: ReactNode;
  iconoFinal?: ReactNode;
  /** Ocupa todo el ancho disponible. */
  completo?: boolean;
  /** Si se pasa, se dibuja como enlace `<a>` con el mismo aspecto. */
  href?: string;
  target?: string;
  rel?: string;
}

const CSS = `
.mk-btn{${VARS}position:relative;display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:44px;padding:0 1.3em;border-radius:var(--mk-radio-boton,999px);border:2px solid transparent;font:inherit;font-weight:600;line-height:1.2;text-decoration:none;cursor:pointer;isolation:isolate;-webkit-tap-highlight-color:transparent;user-select:none;transition:transform .22s cubic-bezier(.2,.8,.2,1),color .25s,background-color .25s,border-color .25s}
.mk-btn[data-tamano=sm]{padding:0 .95em;font-size:.875rem}
.mk-btn[data-tamano=lg]{min-height:54px;padding:0 1.7em;font-size:1.0625rem}
.mk-btn[data-completo]{display:flex;width:100%}
.mk-btn:focus-visible{outline:3px solid var(--a);outline-offset:3px}
.mk-btn:active{transform:scale(.96)}
.mk-btn:disabled,.mk-btn[aria-disabled=true]{opacity:.55;cursor:not-allowed;transform:none}
.mk-btn[data-variante=solido]{background:var(--a);color:var(--sa)}
.mk-btn[data-variante=contorno]{border-color:var(--a);color:var(--mk-acento-texto,var(--a));background:transparent}
.mk-btn[data-variante=suave]{background:color-mix(in srgb,var(--a) 15%,transparent);color:var(--a)}
.mk-btn[data-variante=fantasma]{background:transparent;color:var(--mk-acento-texto,var(--a))}
.mk-btn[data-variante=degradado]{background:linear-gradient(120deg,var(--a),var(--mk-acento-2,color-mix(in srgb,var(--a) 65%,#ff4f8b)));color:var(--sa)}
.mk-btn[data-variante=vidrio]{background:color-mix(in srgb,var(--f) 55%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-color:color-mix(in srgb,currentColor 22%,transparent);color:inherit}
.mk-btn-txt{display:inline-flex;align-items:center;gap:inherit;transition:opacity .2s}
.mk-btn[data-cargando] .mk-btn-txt{opacity:0}
.mk-btn-giro{position:absolute;left:50%;top:50%;width:1.1em;height:1.1em;margin:-.55em 0 0 -.55em;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:mk-b-giro .8s linear infinite}
@keyframes mk-b-giro{to{transform:rotate(360deg)}}
@keyframes mk-b-latido{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.18,1.45);opacity:0}}
.mk-btn-flecha{display:inline-block;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.mk-btn-ventana{display:block;overflow:hidden;height:1.2em}
.mk-btn-rodillo{display:flex;flex-direction:column;transition:transform .32s cubic-bezier(.7,0,.3,1)}
.mk-btn-rodillo>span{display:block;height:1.2em;white-space:nowrap}
.mk-btn[data-efecto=relleno],.mk-btn[data-efecto=brillo],.mk-btn[data-efecto=borde]{overflow:hidden}
.mk-btn[data-efecto=elevar]::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:0 12px 26px -10px var(--a);opacity:0;transition:opacity .25s;z-index:-1}
.mk-btn[data-efecto=relleno]::before{content:"";position:absolute;inset:0;background:var(--a);transform:scaleX(0);transform-origin:right;transition:transform .38s cubic-bezier(.7,0,.3,1);z-index:-1}
.mk-btn[data-efecto=relleno][data-variante=solido]::before,.mk-btn[data-efecto=relleno][data-variante=degradado]::before{background:color-mix(in srgb,var(--a),#000 24%)}
.mk-btn[data-efecto=brillo]::after{content:"";position:absolute;top:0;bottom:0;left:0;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:translateX(-170%) skewX(-20deg);pointer-events:none}
.mk-btn[data-efecto=latido]::after{content:"";position:absolute;inset:-2px;border-radius:inherit;border:2px solid var(--a);animation:mk-b-latido 2s cubic-bezier(.2,.8,.2,1) infinite;pointer-events:none}
.mk-btn[data-efecto=borde]{background:transparent;color:inherit;border-color:transparent}
.mk-btn[data-efecto=borde]::before{content:"";position:absolute;left:50%;top:50%;width:300%;aspect-ratio:1;margin:-150% 0 0 -150%;background:conic-gradient(from 0deg,transparent 0 62%,var(--a) 82%,transparent 92%);animation:mk-b-giro 3.2s linear infinite;z-index:-2}
.mk-btn[data-efecto=borde]::after{content:"";position:absolute;inset:2px;border-radius:inherit;background:var(--mk-boton-fondo,var(--f));z-index:-1}
@media (hover:hover){
.mk-btn:not(:disabled)[data-variante=fantasma]:hover{background:color-mix(in srgb,var(--a) 12%,transparent)}
.mk-btn:not(:disabled)[data-efecto=elevar]:hover{transform:translateY(-3px)}
.mk-btn:not(:disabled)[data-efecto=elevar]:hover::after{opacity:1}
.mk-btn:not(:disabled)[data-efecto=relleno]:hover{color:var(--sa)}
.mk-btn:not(:disabled)[data-efecto=relleno]:hover::before{transform:scaleX(1);transform-origin:left}
.mk-btn:not(:disabled)[data-efecto=brillo]:hover::after{transform:translateX(320%) skewX(-20deg);transition:transform .75s ease}
.mk-btn:not(:disabled):hover .mk-btn-flecha{transform:translateX(5px)}
.mk-btn:not(:disabled):hover .mk-btn-rodillo{transform:translateY(-50%)}
}
.mk-btn:focus-visible .mk-btn-flecha{transform:translateX(5px)}
.mk-btn[data-forma=recto]:not(#\\#){border-radius:5px}
.mk-btn[data-forma=tecla]:not(#\\#){border-radius:12px;box-shadow:0 6px 0 color-mix(in srgb,var(--a),#000 42%),0 8px 14px -6px rgba(0,0,0,.45);transform:translateY(-3px)}
.mk-btn[data-forma=tecla]:not(#\\#):active{transform:translateY(3px);box-shadow:0 0 0 color-mix(in srgb,var(--a),#000 42%)}
.mk-btn[data-forma=ticket]:not(#\\#){border-radius:6px;padding-inline:1.7em;-webkit-mask:radial-gradient(circle 8px at 0 50%,#0000 97%,#000) left/51% 100% no-repeat,radial-gradient(circle 8px at 100% 50%,#0000 97%,#000) right/51% 100% no-repeat;mask:radial-gradient(circle 8px at 0 50%,#0000 97%,#000) left/51% 100% no-repeat,radial-gradient(circle 8px at 100% 50%,#0000 97%,#000) right/51% 100% no-repeat;box-shadow:none}
.mk-btn[data-forma=sello]:not(#\\#){border-radius:4px;border:3px double currentColor;text-transform:uppercase;letter-spacing:.12em;transform:rotate(-3deg);box-shadow:none}
.mk-btn[data-forma=sello][data-variante=solido]:not(#\\#){border-color:var(--sa)}
.mk-btn[data-forma=pixel]:not(#\\#){border-radius:0;box-shadow:none;clip-path:polygon(0 8px,4px 8px,4px 4px,8px 4px,8px 0,calc(100% - 8px) 0,calc(100% - 8px) 4px,calc(100% - 4px) 4px,calc(100% - 4px) 8px,100% 8px,100% calc(100% - 8px),calc(100% - 4px) calc(100% - 8px),calc(100% - 4px) calc(100% - 4px),calc(100% - 8px) calc(100% - 4px),calc(100% - 8px) 100%,8px 100%,8px calc(100% - 4px),4px calc(100% - 4px),4px calc(100% - 8px),0 calc(100% - 8px))}
.mk-btn[data-forma=subrayado]:not(#\\#){background:transparent;border:0;border-radius:0;padding-inline:.15em;color:var(--mk-acento-texto,var(--a));box-shadow:none;text-shadow:none}
.mk-btn[data-forma=subrayado]:not(#\\#)::after{content:"";position:absolute;left:.15em;right:.15em;bottom:.55em;height:2px;background:currentColor;transform:scaleX(.35);transform-origin:left;transition:transform .3s cubic-bezier(.2,.8,.2,1);opacity:1;box-shadow:none;border:0;inset:auto .15em .55em .15em;animation:none}
.mk-btn[data-forma=subrayado]:not(#\\#):focus-visible::after{transform:scaleX(1)}
.mk-btn[data-forma=circulo]:not(#\\#){width:48px;min-width:48px;height:48px;min-height:48px;padding:0;border-radius:50%}
.mk-btn[data-forma=circulo][data-tamano=lg]:not(#\\#){width:58px;height:58px}
.mk-btn[data-forma=tecla]:not(#\\#):is(:disabled,[aria-disabled=true]){transform:none}
@media (hover:hover){
.mk-btn[data-forma=tecla]:not(#\\#):not(:disabled):hover{transform:translateY(-5px)}
.mk-btn[data-forma=sello]:not(#\\#):not(:disabled):hover{transform:rotate(0) scale(1.05)}
.mk-btn[data-forma=subrayado]:not(#\\#):not(:disabled):hover::after{transform:scaleX(1)}
}
@media (prefers-reduced-motion:reduce){.mk-btn[data-forma]:not(#\\#):hover{transform:none}}
@media (prefers-reduced-motion:reduce){
.mk-btn,.mk-btn::before,.mk-btn::after,.mk-btn-flecha,.mk-btn-rodillo{transition-duration:.01ms!important;animation:none!important}
.mk-btn:hover,.mk-btn:active{transform:none!important}
.mk-btn:hover .mk-btn-flecha,.mk-btn:hover .mk-btn-rodillo{transform:none!important}
}
`;

const Flecha = () => (
  <svg className="mk-btn-flecha" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/**
 * Botón del kit: 6 estilos y 8 efectos. Toma el color de `--mk-acento` o `--lm-acento`.
 * Con `href` se dibuja como enlace. Funciona con dedo, mouse y teclado.
 */
export const Boton = /* @__PURE__ */ forwardRef<HTMLButtonElement | HTMLAnchorElement, BotonProps>(function Boton(
  { variante = "solido", efecto = "ninguno", tamano = "md", forma, cargando, icono, iconoFinal, completo, href, target, rel, className, children, disabled, type, ...resto },
  ref
) {
  useStyles("boton", CSS);
  const inactivo = disabled || cargando;
  const contenido = (
    <>
      <span className="mk-btn-txt">
        {icono}
        {efecto === "deslizar" ? (
          <span className="mk-btn-ventana">
            <span className="mk-btn-rodillo">
              <span>{children}</span>
              <span aria-hidden="true">{children}</span>
            </span>
          </span>
        ) : (
          children
        )}
        {iconoFinal ?? (efecto === "flecha" ? <Flecha /> : null)}
      </span>
      {cargando && <span className="mk-btn-giro" aria-hidden="true" />}
    </>
  );
  const comunes = {
    className: `mk-btn${className ? " " + className : ""}`,
    "data-variante": variante,
    "data-efecto": efecto,
    "data-tamano": tamano,
    "data-forma": forma && forma !== "pastilla" ? forma : undefined,
    "data-completo": completo ? "" : undefined,
    "data-cargando": cargando ? "" : undefined,
    "aria-busy": cargando || undefined,
  };

  if (href !== undefined) {
    const { onClick, ...restoA } = resto as Record<string, unknown> & { onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void };
    return (
      <a
        {...(restoA as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        {...comunes}
        ref={ref as Ref<HTMLAnchorElement>}
        href={inactivo ? undefined : href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        aria-disabled={inactivo || undefined}
        role={inactivo ? "link" : undefined}
        onClick={inactivo ? (e) => e.preventDefault() : onClick}
      >
        {contenido}
      </a>
    );
  }
  return (
    <button {...resto} {...comunes} ref={ref as Ref<HTMLButtonElement>} type={type ?? "button"} disabled={inactivo}>
      {contenido}
    </button>
  );
});
