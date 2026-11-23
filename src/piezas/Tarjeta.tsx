import { forwardRef, useState, type HTMLAttributes, type ReactNode, type MouseEvent } from "react";
import { useStyles } from "../utils/styles";
import { VARS } from "./colores";

export type TarjetaVariante = "plana" | "elevada" | "borde" | "vidrio" | "acento";
export type TarjetaEfecto = "ninguno" | "elevar" | "zoom" | "brillo" | "resplandor" | "revelar";

export interface TarjetaProps extends HTMLAttributes<HTMLElement> {
  variante?: TarjetaVariante;
  /** Se pueden combinar: `efecto={["elevar", "zoom"]}`. */
  efecto?: TarjetaEfecto | TarjetaEfecto[];
  /** Imagen de cabecera (url). Para una imagen propia usar `<TarjetaMedia>`. */
  imagen?: string;
  alt?: string;
  /** Contenido que aparece desde abajo con el efecto «revelar» (en celular se ve siempre). */
  revelar?: ReactNode;
  /** Si se pasa, toda la tarjeta es un enlace. */
  href?: string;
  /** Etiqueta HTML del contenedor cuando no es enlace. */
  como?: "article" | "div" | "li" | "section";
}

const CSS = `
.mk-card{${VARS}position:relative;display:flex;flex-direction:column;border-radius:var(--mk-radio-tarjeta,18px);color:inherit;text-decoration:none;isolation:isolate;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.mk-card[data-variante=plana]{background:var(--s)}
.mk-card[data-variante=elevada]{background:var(--f);box-shadow:0 1px 2px rgba(0,0,0,.06),0 10px 28px -14px rgba(0,0,0,.28)}
.mk-card[data-variante=borde]{background:var(--f);border:1px solid color-mix(in srgb,currentColor 14%,transparent)}
.mk-card[data-variante=vidrio]{background:color-mix(in srgb,var(--f) 58%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid color-mix(in srgb,#fff 32%,transparent)}
.mk-card[data-variante=acento]{background:var(--a);color:var(--sa)}
a.mk-card:focus-visible{outline:3px solid var(--a);outline-offset:3px}
.mk-card-media{position:relative;overflow:hidden;aspect-ratio:var(--mk-proporcion,16/10);border-radius:inherit;border-bottom-left-radius:0;border-bottom-right-radius:0;background:color-mix(in srgb,var(--a) 12%,transparent)}
.mk-card-media>img,.mk-card-media>video,.mk-card-media>picture>img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.mk-card-cuerpo{display:flex;flex-direction:column;gap:.4rem;padding:1.1rem 1.25rem 1.3rem;flex:1}
.mk-card-cuerpo>h3,.mk-card-cuerpo>h2{margin:0;font-size:1.1rem}
.mk-card-cuerpo>p{margin:0;opacity:.8}
.mk-card-capa{position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none;z-index:2}
.mk-card-brillo{position:absolute;top:0;bottom:0;left:0;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:translateX(-170%) skewX(-18deg)}
.mk-card-revelar{position:absolute;left:0;right:0;bottom:0;padding:1rem 1.25rem;background:linear-gradient(transparent,color-mix(in srgb,var(--f) 92%,transparent) 30%);pointer-events:auto;transform:translateY(100%);opacity:0;transition:transform .38s cubic-bezier(.2,.8,.2,1),opacity .3s}
.mk-card[data-revelar]:focus-within .mk-card-revelar{transform:none;opacity:1}
.mk-card::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s;z-index:-1}
.mk-card[data-elevar]::after{box-shadow:0 22px 40px -18px color-mix(in srgb,var(--a) 70%,#000)}
.mk-card[data-resplandor]::after{box-shadow:0 0 0 2px var(--a),0 0 28px -4px var(--a)}
@media (hover:hover){
.mk-card[data-elevar]:hover{transform:translateY(-6px)}
.mk-card[data-elevar]:hover::after,.mk-card[data-resplandor]:hover::after{opacity:1}
.mk-card[data-zoom]:hover .mk-card-media>*{transform:scale(1.07)}
.mk-card[data-brillo]:hover .mk-card-brillo{transform:translateX(330%) skewX(-18deg);transition:transform .9s ease}
.mk-card[data-revelar]:hover .mk-card-revelar{transform:none;opacity:1}
}
@media (hover:none){.mk-card-revelar{position:static;transform:none;opacity:1;background:none;padding-top:0}.mk-card[data-revelar] .mk-card-capa{position:static;overflow:visible}}
a.mk-card:focus-visible::after{opacity:1}
@media (prefers-reduced-motion:reduce){
.mk-card,.mk-card *,.mk-card::after{transition-duration:.01ms!important}
.mk-card:hover{transform:none!important}
.mk-card:hover .mk-card-media>*{transform:none!important}
.mk-card-brillo{display:none}
}
.mk-flip{${VARS}position:relative;perspective:1100px;border-radius:var(--mk-radio-tarjeta,18px)}
.mk-flip-giro{position:relative;display:grid;height:100%;border-radius:inherit;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.4,.2,.2,1)}
.mk-flip-cara{grid-area:1/1;border-radius:inherit;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}
.mk-flip[data-eje=y] .mk-flip-dorso{transform:rotateY(180deg)}
.mk-flip[data-eje=x] .mk-flip-dorso{transform:rotateX(180deg)}
.mk-flip[data-eje=y][data-volteada] .mk-flip-giro{transform:rotateY(180deg)}
.mk-flip[data-eje=x][data-volteada] .mk-flip-giro{transform:rotateX(180deg)}
@media (hover:hover){
.mk-flip[data-eje=y][data-disparador=hover]:hover .mk-flip-giro{transform:rotateY(180deg)}
.mk-flip[data-eje=x][data-disparador=hover]:hover .mk-flip-giro{transform:rotateX(180deg)}
}
.mk-flip-boton{position:absolute;top:.5rem;right:.5rem;z-index:3;min-width:44px;min-height:44px;padding:0 .8rem;border:0;border-radius:999px;background:color-mix(in srgb,var(--f) 80%,transparent);color:inherit;font:inherit;font-size:.8rem;font-weight:600;cursor:pointer}
.mk-flip-boton:focus-visible{outline:3px solid var(--a);outline-offset:2px}
@media (prefers-reduced-motion:reduce){
.mk-flip-giro{transform:none!important;transition:none}
.mk-flip-cara{transform:none!important;transition:opacity .25s}
.mk-flip .mk-flip-dorso{opacity:0}
.mk-flip[data-volteada] .mk-flip-frente{opacity:0}
.mk-flip[data-volteada] .mk-flip-dorso{opacity:1}
}
`;

function lista(e: TarjetaProps["efecto"]): TarjetaEfecto[] {
  return e === undefined ? [] : Array.isArray(e) ? e : [e];
}

/** Tarjeta del kit: 5 estilos y efectos combinables al pasar el mouse. */
export const Tarjeta = forwardRef<HTMLElement, TarjetaProps>(function Tarjeta(
  { variante = "elevada", efecto, imagen, alt = "", revelar, href, como = "article", className, children, ...resto },
  ref
) {
  useStyles("tarjeta", CSS);
  const efectos = lista(efecto);
  if (revelar && !efectos.includes("revelar")) efectos.push("revelar");
  const datos: Record<string, string> = { "data-variante": variante };
  for (const e of efectos) if (e !== "ninguno") datos[`data-${e}`] = "";
  const interior = (
    <>
      {imagen && (
        <div className="mk-card-media">
          <img src={imagen} alt={alt} loading="lazy" decoding="async" />
        </div>
      )}
      {children}
      {(efectos.includes("brillo") || revelar) && (
        <span className="mk-card-capa" aria-hidden={revelar ? undefined : "true"}>
          {efectos.includes("brillo") && <span className="mk-card-brillo" />}
          {revelar && <div className="mk-card-revelar">{revelar}</div>}
        </span>
      )}
    </>
  );
  const clase = `mk-card${className ? " " + className : ""}`;
  if (href !== undefined) {
    return (
      <a {...(resto as HTMLAttributes<HTMLAnchorElement>)} {...datos} ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={clase}>
        {interior}
      </a>
    );
  }
  const Etiqueta = como as "div";
  return (
    <Etiqueta {...resto} {...datos} ref={ref as React.Ref<HTMLDivElement>} className={clase}>
      {interior}
    </Etiqueta>
  );
});

/** Zona de imagen o video de una tarjeta; con el efecto «zoom» se acerca. */
export function TarjetaMedia({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={`mk-card-media${className ? " " + className : ""}`} />;
}

/** Zona de texto de una tarjeta, con márgenes y espacio entre líneas. */
export function TarjetaCuerpo({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={`mk-card-cuerpo${className ? " " + className : ""}`} />;
}

export interface TarjetaVolteableProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  frente: ReactNode;
  dorso: ReactNode;
  /** «toque»: se voltea al tocar o con el botón. «hover»: además se voltea al pasar el mouse. */
  disparador?: "toque" | "hover";
  eje?: "x" | "y";
  /** Controlada desde afuera (opcional). */
  volteada?: boolean;
  alCambiar?: (volteada: boolean) => void;
  etiquetaVoltear?: string;
  etiquetaVolver?: string;
}

/** Tarjeta de dos caras que gira en 3D. Con «reducir movimiento» cambia de cara con un fundido. */
export function TarjetaVolteable({
  frente, dorso, disparador = "toque", eje = "y", volteada, alCambiar,
  etiquetaVoltear = "Ver más", etiquetaVolver = "Volver", className, onClick, ...resto
}: TarjetaVolteableProps) {
  useStyles("tarjeta", CSS);
  const [interna, setInterna] = useState(false);
  const v = volteada ?? interna;
  const cambiar = () => {
    setInterna(!v);
    alCambiar?.(!v);
  };
  const alTocar = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
    const t = e.target as HTMLElement;
    if (!e.defaultPrevented && !t.closest("a,button,input,select,textarea,label")) cambiar();
  };
  return (
    <div
      {...resto}
      className={`mk-flip${className ? " " + className : ""}`}
      data-eje={eje}
      data-disparador={disparador}
      data-volteada={v ? "" : undefined}
      onClick={alTocar}
    >
      <button type="button" className="mk-flip-boton" aria-pressed={v} onClick={cambiar}>
        {v ? etiquetaVolver : etiquetaVoltear}
      </button>
      <div className="mk-flip-giro">
        <div className="mk-flip-cara mk-flip-frente" aria-hidden={v || undefined}>{frente}</div>
        <div className="mk-flip-cara mk-flip-dorso" aria-hidden={!v || undefined}>{dorso}</div>
      </div>
    </div>
  );
}
