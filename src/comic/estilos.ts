// El CSS de los dibujos de cómic. Se arma al montarse el primero (no al cargar el módulo): así quien no los usa los puede
// descartar. Tinta del dibujo (#111) fija; el globo toma el texto y la superficie del tema; el amarillo, CARTEL.
import { c, CARTEL, f, fuenteCartel, fuerza, tiempo } from "../interfaz/tema";

let css: string | undefined;
export const estilosComic = () =>
  (css ??= `
.mk-letra-cartel{font-family:${fuenteCartel()};font-weight:900;text-transform:uppercase;letter-spacing:.02em;font-style:italic}
.mk-mano{display:inline-block;flex:none;pointer-events:none}
.mk-mano svg{display:block;overflow:visible}
.mk-mano-toca{animation:mk-toca ${tiempo(1600)} cubic-bezier(.3,0,.2,1) infinite}
.mk-mano[data-una] .mk-mano-toca,.mk-mano[data-una] .mk-pop{animation-iteration-count:1}
@keyframes mk-toca{0%,55%,100%{transform:translateX(0)}65%{transform:translateX(calc(${fuerza(-10)}*1px))}75%{transform:translateX(calc(${fuerza(9)}*1px))}85%{transform:translateX(0)}}
.mk-pop{transform-origin:0 100%;animation:mk-pop ${tiempo(1600)} ease-out infinite;opacity:0}
.mk-pop+.mk-pop{animation-delay:.04s}
@keyframes mk-pop{0%,70%{opacity:0;transform:scale(calc(1 - ${fuerza(0.7)}))}76%{opacity:1;transform:scale(calc(1 + ${fuerza(0.1)}))}90%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
.mk-globo{--t:${c("texto")};--s:${c("superficie")};position:relative;display:inline-block;max-width:300px;padding:12px 16px;background:var(--s);
  color:var(--t);border:${f("trazo", "3px solid var(--t)")};border-radius:${f("radioTarjeta", "18px")};box-shadow:${f("sombra", "5px 5px 0 var(--t)")};font-size:1rem;line-height:1.3}
.mk-globo::after{content:"";position:absolute;width:18px;height:18px;background:var(--s);border:${f("trazo", "3px solid var(--t)")};border-top:0;border-left:0;
  transform:rotate(45deg);bottom:-11px;left:28px}
.mk-globo[data-cola=arriba]::after{top:-11px;bottom:auto;transform:rotate(-135deg)}
.mk-globo[data-cola=izquierda]::after{left:-11px;top:50%;bottom:auto;margin-top:-9px;transform:rotate(135deg)}
.mk-globo[data-cola=derecha]::after{right:-11px;left:auto;top:50%;bottom:auto;margin-top:-9px;transform:rotate(-45deg)}
.mk-globo[data-entra]{animation:mk-entra ${tiempo(420)} cubic-bezier(.34,1.56,.64,1) both}
@keyframes mk-entra{from{opacity:0;transform:scale(calc(1 - ${fuerza(0.4)})) rotate(calc(${fuerza(-4)}*1deg))}}
.mk-estallido{display:inline-grid;place-items:center;position:relative;flex:none}
.mk-estallido svg{display:block}
.mk-estallido>span{position:absolute;inset:0;display:grid;place-items:center;text-align:center;line-height:1.05;color:#111;padding:0 18%;transform:rotate(-8deg)}
.mk-estallido[data-late]{animation:mk-late ${tiempo(1800)} ease-in-out infinite}
@keyframes mk-late{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(calc(1 + ${fuerza(0.07)})) rotate(calc(${fuerza(-3)}*1deg))}}
.mk-colgante{display:inline-block;transform-origin:50% 0;animation:mk-mece ${tiempo(3000)} ease-in-out infinite}
.mk-colgante[data-quieto]{animation:mk-mece ${tiempo(1000)} ease-in-out 3}
@keyframes mk-mece{0%,100%{transform:rotate(calc(${fuerza(-4)}*1deg))}50%{transform:rotate(calc(${fuerza(4)}*1deg))}}
.mk-colgante-cuerda{display:block;margin:0 auto;width:90px;height:34px}
.mk-colgante-tabla{display:block;padding:12px 20px;background:${CARTEL};border:${f("trazo", "3px solid #111")};border-radius:${f("radioTarjeta", "10px")};box-shadow:${f("sombra", "6px 6px 0 #111")};font-size:1.2rem;color:#111}
@media (prefers-reduced-motion:reduce){
  .mk-mano-toca,.mk-pop,.mk-estallido[data-late],.mk-colgante,.mk-colgante[data-quieto]{animation:none}
  .mk-pop{opacity:1}
  .mk-globo[data-entra]{animation:mk-aparece .2s ease-out both}
}
@keyframes mk-aparece{from{opacity:0}}`);
