import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { useStyles } from "../utils/styles";
import type { TextoEfecto } from "./estilos";

export interface TextoCineticoProps extends HTMLAttributes<HTMLElement> {
  texto: string;
  efecto: TextoEfecto;
  como?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** «entrar»: al aparecer en pantalla. «siempre»: al cargar. */
  cuando?: "entrar" | "siempre";
  /** Milisegundos antes de empezar. */
  retraso?: number;
}

const CSS = `
.mk-tc{position:relative}
.mk-tc>span{display:inline}
.mk-tc .mk-tc-palabra{white-space:nowrap}
.mk-tc[data-fase=esperando][data-oculta] .mk-tc-l{opacity:0}
.mk-tc[data-fase=jugando] .mk-tc-l{animation:var(--n) var(--d) var(--c,cubic-bezier(.2,.8,.2,1)) calc(var(--r) + var(--i) * var(--paso)) var(--v,1) both}
.mk-tc[data-efecto=encender]{--n:mk-t-encender;--d:1.1s;--paso:35ms;--c:linear}
.mk-tc[data-efecto=maquina]{--n:mk-t-maquina;--d:60ms;--paso:55ms;--c:linear}
.mk-tc[data-efecto=impacto]{--n:mk-t-impacto;--d:.55s;--paso:160ms}
.mk-tc[data-efecto=temblor]{--n:mk-t-temblor;--d:.36s;--paso:47ms;--c:steps(2);--v:infinite}
.mk-tc[data-efecto=caer]{--n:mk-t-caer;--d:.9s;--paso:45ms;--c:linear}
.mk-tc[data-efecto=trailer]{--n:mk-t-trailer;--d:.9s;--paso:300ms}
.mk-tc[data-efecto=onda]{--n:mk-t-onda;--d:1.8s;--paso:70ms;--c:ease-in-out;--v:infinite}
.mk-tc[data-efecto=revelar]{--n:mk-t-revelar;--d:.8s;--paso:90ms}
.mk-tc[data-efecto=voltear]{--n:mk-t-voltear;--d:.7s;--paso:40ms}
.mk-tc[data-efecto=rebote]{--n:mk-t-rebote;--d:.6s;--paso:45ms;--c:linear}
.mk-tc-mascara{display:inline-block;overflow:clip;vertical-align:bottom;padding-bottom:.12em;margin-bottom:-.12em}
.mk-tc-dest{position:relative;display:inline;z-index:0}
.mk-tc-dest::before{content:"";position:absolute;left:-.08em;right:-.08em;bottom:.06em;height:.38em;background:var(--mk-acento,#7c5cff);opacity:.45;z-index:-1;transform-origin:left;border-radius:.1em}
.mk-tc[data-fase=jugando] .mk-tc-dest::before{animation:mk-t-resaltar .7s cubic-bezier(.2,.8,.2,1) calc(var(--r) + 700ms) both}
.mk-tc[data-fase=esperando] .mk-tc-dest::before{transform:scaleX(0)}
.mk-tc[data-efecto=maquina][data-fase=jugando]::after{content:"";display:inline-block;width:.55em;height:.9em;margin-left:.08em;vertical-align:-.08em;background:currentColor;animation:mk-t-cursor 1s steps(1) infinite}
.mk-tc[data-efecto=glitch]::before,.mk-tc[data-efecto=glitch]::after{content:attr(data-texto);position:absolute;inset:0;pointer-events:none;opacity:0}
.mk-tc[data-efecto=glitch]::before{color:var(--mk-acento-2,#0ff)}
.mk-tc[data-efecto=glitch]::after{color:var(--mk-acento,#f0f)}
.mk-tc[data-efecto=glitch][data-fase=jugando]::before{animation:mk-t-glitch-a 3.2s steps(1) infinite}
.mk-tc[data-efecto=glitch][data-fase=jugando]::after{animation:mk-t-glitch-b 3.2s steps(1) infinite}
@keyframes mk-t-encender{0%{opacity:.08}8%{opacity:.9}10%{opacity:.1}18%{opacity:1}20%{opacity:.25}28%,100%{opacity:1}}
@keyframes mk-t-maquina{from{opacity:0}to{opacity:1}}
@keyframes mk-t-cursor{0%,100%{opacity:1}50%{opacity:0}}
@keyframes mk-t-impacto{0%{opacity:0;transform:scale(2.6)}60%{opacity:1;transform:scale(.92)}80%{transform:scale(1.04)}100%{opacity:1;transform:none}}
@keyframes mk-t-temblor{0%{transform:translate(0,0) rotate(0)}50%{transform:translate(-1px,1px) rotate(-2deg)}100%{transform:translate(1px,-1px) rotate(1.5deg)}}
@keyframes mk-t-caer{0%{opacity:0;transform:translateY(-120%) rotate(-25deg)}55%{opacity:1;transform:translateY(8%) rotate(4deg)}75%{transform:translateY(-6%) rotate(-2deg)}100%{opacity:1;transform:none}}
@keyframes mk-t-trailer{0%{opacity:0;transform:scale(1.18)}100%{opacity:1;transform:none}}
@keyframes mk-t-revelar{from{transform:translateY(110%)}to{transform:none}}
@keyframes mk-t-voltear{from{opacity:0;transform:perspective(400px) rotateX(-95deg)}to{opacity:1;transform:none}}
@keyframes mk-t-rebote{0%{opacity:0;transform:scale(0)}55%{opacity:1;transform:scale(1.3)}75%{transform:scale(.88)}100%{opacity:1;transform:none}}
@keyframes mk-t-resaltar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes mk-t-onda{0%,100%{transform:translateY(0)}50%{transform:translateY(-.18em)}}
@keyframes mk-t-glitch-a{0%,100%{opacity:0;transform:none}6%{opacity:.85;transform:translate(-3px,1px)}8%{opacity:0}62%{opacity:.85;transform:translate(2px,-2px)}64%{opacity:0}}
@keyframes mk-t-glitch-b{0%,100%{opacity:0;transform:none}7%{opacity:.85;transform:translate(3px,-1px)}9%{opacity:0}63%{opacity:.85;transform:translate(-2px,2px)}65%{opacity:0}}
@media (prefers-reduced-motion:reduce){.mk-tc .mk-tc-l,.mk-tc::before,.mk-tc::after,.mk-tc .mk-tc-dest::before{animation:none!important;opacity:1!important}.mk-tc .mk-tc-l,.mk-tc .mk-tc-dest::before{transform:none!important}.mk-tc .mk-tc-dest::before{opacity:.45!important}.mk-tc::before,.mk-tc::after{opacity:0!important}}
`;

const OCULTAS: TextoEfecto[] = ["maquina", "impacto", "caer", "trailer", "encender", "voltear", "rebote"];
const POR_PALABRA: TextoEfecto[] = ["impacto", "trailer", "revelar"];

/**
 * Títulos que se mueven: se encienden como neón, se escriben a máquina, caen, golpean o tiemblan.
 * Una palabra entre asteriscos (`*Smash* burgers`) se resalta con el color de acento.
 * El lector de pantalla lee el texto completo; si el JS no carga, el texto se ve quieto.
 */
export function TextoCinetico({ texto, efecto, como = "h2", cuando = "entrar", retraso = 0, className, style, ...resto }: TextoCineticoProps) {
  useStyles("texto-cinetico", CSS);
  const ref = useRef<HTMLElement>(null);
  const [fase, setFase] = useState<"inicial" | "esperando" | "jugando">("inicial");

  useEffect(() => {
    const el = ref.current;
    if (cuando === "siempre" || !el || typeof IntersectionObserver === "undefined") return setFase("jugando");
    setFase("esperando");
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setFase("jugando");
        o.disconnect();
      }
    }, { threshold: 0.2 });
    o.observe(el);
    return () => o.disconnect();
  }, [cuando, texto, efecto]);

  // *palabra* = destacada (se resalta con el color de acento)
  const limpio = texto.replace(/\*/g, "");
  const segmentos = texto.split(/(\*[^*]+\*[^\s*]*)/).filter(Boolean).map((t) => (/^\*[^*]+\*[^\s*]*$/.test(t) ? { t: t.replace(/\*/g, ""), d: true } : { t, d: false }));
  let i = 0;
  const palabra = (p: string, k: string) => {
    if (POR_PALABRA.includes(efecto)) {
      const l = <span key={k} className="mk-tc-l mk-tc-palabra" style={{ "--i": i++ } as CSSProperties}>{p}</span>;
      return efecto === "revelar" ? <span key={k} className="mk-tc-mascara">{l}</span> : l;
    }
    return (
      <span key={k} className="mk-tc-palabra">
        {Array.from(p).map((ch, j) => (
          <span key={j} className="mk-tc-l" style={{ "--i": i++, display: "inline-block" } as CSSProperties}>{ch}</span>
        ))}
      </span>
    );
  };
  const partes = segmentos.map((seg, n) => {
    const piezas = seg.t.split(/(\s+)/).map((p, k) => (/^\s+$/.test(p) || !p ? <span key={k}>{p}</span> : palabra(p, `${n}-${k}`)));
    return seg.d ? <span key={n} className="mk-tc-dest">{piezas}</span> : <span key={n}>{piezas}</span>;
  });

  const Etiqueta = como as "h2";
  return (
    <Etiqueta
      {...resto}
      ref={ref as React.Ref<HTMLHeadingElement>}
      className={`mk-tc${className ? " " + className : ""}`}
      data-efecto={efecto}
      data-fase={fase}
      data-oculta={OCULTAS.includes(efecto) ? "" : undefined}
      data-texto={limpio}
      aria-label={limpio}
      style={{ "--r": `${retraso}ms`, ...style } as CSSProperties}
    >
      <span aria-hidden="true">{partes}</span>
    </Etiqueta>
  );
}
