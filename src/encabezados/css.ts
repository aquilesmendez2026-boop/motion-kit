export const CSS_ENCABEZADO = `
.mk-enc{position:relative;container-type:inline-size;isolation:isolate;overflow:clip;color:inherit}
.mk-enc-in{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr);min-height:var(--mk-enc-alto,92svh);padding:clamp(4.5rem,10cqi,7rem) clamp(1rem,5cqi,3.5rem) clamp(3rem,7cqi,5rem)}
.mk-enc[data-alto=medio]{--mk-enc-alto:62svh}
@container (max-width:640px){.mk-enc-in{min-height:var(--mk-enc-alto-celular,var(--mk-enc-alto,92svh))}}
.mk-enc[data-alto=compacto]>.mk-enc-in{padding-top:clamp(3rem,7cqi,4.5rem);padding-bottom:clamp(2rem,5cqi,3rem)}
/* Profundidad: el texto y la foto se mueven poco y al revés que las capas */
.mk-enc[data-profundidad] .mk-enc-caja{translate:calc(var(--mk-cx,0) * -8px) calc(var(--mk-cy,0) * -6px)}
.mk-enc[data-profundidad] .mk-enc-media img{translate:calc(var(--mk-cx,0) * -12px) calc(var(--mk-cy,0) * -10px);scale:1.05}
.mk-enc-caja{position:relative;z-index:2;display:flex;flex-direction:column;gap:1.1rem;max-width:780px;min-width:0}
.mk-enc-ante{margin:0;font-size:.85rem;letter-spacing:.16em;text-transform:uppercase;color:var(--mk-acento-texto,var(--mk-acento))}
.mk-enc-titulo{margin:0;align-self:stretch;font-size:clamp(2.3rem,8cqi,5.6rem);line-height:1.04;overflow-wrap:anywhere}
.mk-enc-bajada{margin:0;font-size:clamp(1.02rem,2.2cqi,1.3rem);line-height:1.55;max-width:38em}
.mk-enc-datos{display:flex;flex-wrap:wrap;gap:.5rem;margin:0;padding:0;list-style:none}
.mk-enc-datos li{padding:.35rem .8rem;border-radius:999px;border:1px solid color-mix(in srgb,currentColor 28%,transparent);font-size:.85rem}
.mk-enc-botones{margin-top:.6rem}
.mk-enc-media{position:relative;z-index:1;overflow:hidden;border-radius:var(--mk-radio-tarjeta,18px);background:color-mix(in srgb,var(--mk-acento,#7c5cff) 15%,transparent)}
.mk-enc-media img{display:block;width:100%;height:100%;object-fit:cover}
.mk-enc :is(.mk-enc-bajada,.mk-enc-ante){text-shadow:0 0 4px var(--mk-fondo,transparent),0 0 16px var(--mk-fondo,transparent)}

/* Composiciones */
.mk-enc[data-composicion=centrado]>.mk-enc-in{place-items:center;text-align:center}
.mk-enc[data-composicion=centrado] .mk-enc-caja{align-items:center}
.mk-enc[data-composicion=centrado] :is(.mk-enc-datos,.mk-enc-botones>div){justify-content:center}
.mk-enc[data-composicion=izquierda]>.mk-enc-in{align-items:center}

.mk-enc[data-composicion=dividido]>.mk-enc-in{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(1.5rem,4cqi,3.5rem);align-items:center}
.mk-enc[data-composicion=dividido] .mk-enc-media{aspect-ratio:4/5;max-height:72svh;box-shadow:0 30px 60px -30px rgba(0,0,0,.5)}
.mk-enc:is([data-composicion=dividido],[data-composicion=vinetas]) .mk-enc-titulo{font-size:clamp(2.1rem,5.4cqi,4.6rem)}
@container (max-width:720px){.mk-enc:is([data-composicion=dividido],[data-composicion=vinetas]) .mk-enc-titulo{font-size:clamp(2rem,10cqi,3.4rem)}.mk-enc[data-composicion=dividido]>.mk-enc-in{grid-template-columns:minmax(0,1fr);align-content:start}.mk-enc[data-composicion=dividido] .mk-enc-media{order:-1;aspect-ratio:16/10}}

.mk-enc[data-composicion=gigante]>.mk-enc-in{align-content:end}
.mk-enc[data-composicion=gigante] .mk-enc-caja{max-width:none}
.mk-enc[data-composicion=gigante] .mk-enc-titulo{font-size:clamp(3rem,13.5cqi,13rem);line-height:.9;letter-spacing:-.02em}
.mk-enc[data-composicion=gigante] .mk-enc-pie{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:1.2rem 2.5rem;border-top:1px solid color-mix(in srgb,currentColor 22%,transparent);padding-top:1.2rem}
.mk-enc-pie{display:contents}

.mk-enc[data-composicion=tarjeta]>.mk-enc-in{place-items:center}
.mk-enc[data-composicion=tarjeta] .mk-enc-media,.mk-enc[data-composicion=imagen] .mk-enc-media{position:absolute;inset:0;border-radius:0;z-index:0}
.mk-enc[data-composicion=tarjeta] .mk-enc-caja{padding:clamp(1.5rem,5cqi,3rem);border-radius:var(--mk-radio-tarjeta,18px);background:color-mix(in srgb,var(--mk-superficie,#fff) 80%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid color-mix(in srgb,currentColor 14%,transparent);box-shadow:0 30px 80px -30px rgba(0,0,0,.6)}
.mk-enc[data-composicion=imagen]>.mk-enc-in{align-content:end}
.mk-enc[data-composicion=imagen] .mk-enc-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb,var(--mk-fondo,#000) 10%,transparent) 20%,color-mix(in srgb,var(--mk-fondo,#000) 94%,transparent) 88%)}

.mk-enc[data-composicion=letrero]>.mk-enc-in{place-items:center;text-align:center}
.mk-enc[data-composicion=letrero] .mk-enc-caja{align-items:center}
.mk-enc[data-composicion=letrero] .mk-enc-marco{position:relative;padding:clamp(1.4rem,4cqi,2.6rem) clamp(1.2rem,5cqi,3.4rem);border:3px solid var(--mk-acento,#7c5cff);border-radius:22px;box-shadow:0 0 0 6px color-mix(in srgb,var(--mk-fondo,#000) 80%,transparent),0 0 0 8px color-mix(in srgb,var(--mk-acento-2,var(--mk-acento)) 60%,transparent),0 0 40px -6px var(--mk-acento,#7c5cff),inset 0 0 40px -12px var(--mk-acento,#7c5cff);background:color-mix(in srgb,var(--mk-fondo,#000) 55%,transparent)}
.mk-enc[data-composicion=letrero] .mk-enc-ante{position:absolute;top:0;left:50%;transform:translate(-50%,-55%);background:var(--mk-fondo,#000);padding:.2rem .9rem;white-space:nowrap}
.mk-enc[data-composicion=letrero] :is(.mk-enc-datos,.mk-enc-botones>div){justify-content:center}

.mk-enc[data-composicion=poster]>.mk-enc-in{align-items:center}
.mk-enc[data-composicion=poster] .mk-enc-caja{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,.6fr);gap:1rem 2.5rem;max-width:none;align-items:end}
.mk-enc[data-composicion=poster] .mk-enc-titulo{grid-column:1;font-size:clamp(3rem,11cqi,10rem);line-height:.88;text-transform:uppercase}
.mk-enc[data-composicion=poster] .mk-enc-ante{grid-column:1/-1}
.mk-enc[data-composicion=poster] .mk-enc-lado{grid-column:2;grid-row:2;display:flex;flex-direction:column;gap:1rem;border-left:4px solid var(--mk-acento,#7c5cff);padding-left:1.2rem}
.mk-enc[data-composicion=poster] .mk-enc-datos{flex-direction:column}
.mk-enc[data-composicion=poster] .mk-enc-datos li{border:0;padding:0;border-bottom:2px solid color-mix(in srgb,currentColor 25%,transparent);border-radius:0;font-weight:800;text-transform:uppercase;letter-spacing:.06em;padding-bottom:.4rem}
.mk-enc[data-composicion=poster] .mk-enc-botones{grid-column:1/-1}
@container (max-width:720px){.mk-enc[data-composicion=poster] .mk-enc-caja{grid-template-columns:minmax(0,1fr)}.mk-enc[data-composicion=poster] .mk-enc-lado{grid-column:1;grid-row:auto}}
.mk-enc-lado{display:contents}

.mk-enc[data-composicion=boleto]>.mk-enc-in{place-items:center}
.mk-enc[data-composicion=boleto] .mk-enc-marco{display:grid;grid-template-columns:minmax(0,1fr) auto;max-width:900px;width:100%;background:var(--mk-superficie,#fff);border-radius:14px;box-shadow:0 40px 80px -40px rgba(0,0,0,.7);-webkit-mask:radial-gradient(circle 16px at calc(100% - var(--talon)) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle 16px at calc(100% - var(--talon)) 100%,#0000 97%,#000) bottom/100% 51% no-repeat;mask:radial-gradient(circle 16px at calc(100% - var(--talon)) 0,#0000 97%,#000) top/100% 51% no-repeat,radial-gradient(circle 16px at calc(100% - var(--talon)) 100%,#0000 97%,#000) bottom/100% 51% no-repeat;--talon:150px}
.mk-enc[data-composicion=boleto] .mk-enc-caja{padding:clamp(1.4rem,4cqi,2.8rem)}
.mk-enc[data-composicion=boleto] .mk-enc-talon{width:150px;border-left:2px dashed color-mix(in srgb,currentColor 35%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5rem;padding:1.2rem;text-align:center;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase}
.mk-enc[data-composicion=boleto] .mk-enc-talon b{font-family:var(--mk-fuente-titulo,inherit);font-size:2rem;letter-spacing:0;color:var(--mk-acento-texto,var(--mk-acento))}
.mk-enc-talon{display:none}
@container (max-width:640px){.mk-enc[data-composicion=boleto] .mk-enc-marco{grid-template-columns:minmax(0,1fr);-webkit-mask:none;mask:none}.mk-enc[data-composicion=boleto] .mk-enc-talon{width:auto;border-left:0;border-top:2px dashed color-mix(in srgb,currentColor 35%,transparent);flex-direction:row}}

.mk-enc[data-composicion=pantalla]>.mk-enc-in{place-items:center}
.mk-enc[data-composicion=pantalla] .mk-enc-marco{position:relative;max-width:880px;width:100%;padding:clamp(1.4rem,4cqi,2.8rem);border:clamp(10px,2cqi,18px) solid color-mix(in srgb,var(--mk-texto,#fff) 16%,#222);border-radius:28px;background:var(--mk-fondo,#000);box-shadow:inset 0 0 60px rgba(0,0,0,.45),0 30px 60px -30px rgba(0,0,0,.8)}
.mk-enc[data-composicion=pantalla] .mk-enc-marco::before{content:"";position:absolute;inset:0;border-radius:12px;background:repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0 1px,transparent 1px 3px);pointer-events:none;z-index:3}
.mk-enc[data-composicion=pantalla] .mk-enc-marco::after{content:"";position:absolute;left:50%;bottom:calc(-1 * clamp(10px,2cqi,18px) - 34px);width:120px;height:24px;margin-left:-60px;border-radius:0 0 12px 12px;background:color-mix(in srgb,var(--mk-texto,#fff) 16%,#222)}

.mk-enc[data-composicion=vinetas]>.mk-enc-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(1.5rem,4cqi,3rem);align-items:center}
.mk-enc-paneles{position:relative;z-index:1;display:grid;grid-template-columns:1.2fr .8fr;grid-template-rows:1fr 1fr;gap:12px;aspect-ratio:1;max-height:70svh}
.mk-enc-paneles .mk-enc-media{border:4px solid var(--mk-texto,#111);border-radius:6px}
.mk-enc-paneles .mk-enc-media:nth-child(1){grid-row:1/3;clip-path:polygon(0 0,100% 0,92% 100%,0 100%)}
.mk-enc-paneles .mk-enc-media:nth-child(2){clip-path:polygon(8% 0,100% 0,100% 100%,0 100%);margin-left:-8%}
.mk-enc-paneles .mk-enc-media:nth-child(3){clip-path:polygon(0 0,100% 0,100% 100%,8% 100%);margin-left:-12%}
@container (max-width:720px){.mk-enc[data-composicion=vinetas]>.mk-enc-in{grid-template-columns:minmax(0,1fr);align-content:start}.mk-enc-paneles{order:-1;aspect-ratio:16/10}}

.mk-enc[data-composicion=marquesina]>.mk-enc-in{place-items:center;text-align:center}
.mk-enc[data-composicion=marquesina] .mk-enc-caja{align-items:center}
.mk-enc[data-composicion=marquesina] :is(.mk-enc-datos,.mk-enc-botones>div){justify-content:center}
.mk-enc-cinta{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;justify-content:center;gap:2cqi;pointer-events:none;opacity:.13}
.mk-enc-cinta>div{display:flex;width:max-content;white-space:nowrap;font-family:var(--mk-fuente-titulo,inherit);font-size:18cqi;line-height:1;text-transform:uppercase;animation:mk-e-cinta 30s linear infinite}
.mk-enc-cinta>div:nth-child(2){animation-direction:reverse;color:var(--mk-acento,#7c5cff)}
.mk-enc-cinta span{padding-right:.5em}
@keyframes mk-e-cinta{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* Entradas (solo con JS listo; sin JS todo se ve) */
.mk-enc-telon{display:none}
.mk-enc[data-listo][data-entrada=cascada] :is(.mk-enc-ante,.mk-enc-bajada,.mk-enc-datos,.mk-enc-botones,.mk-enc-talon){animation:mk-e-subir .8s cubic-bezier(.2,.8,.2,1) both}
.mk-enc[data-listo][data-entrada=cascada] .mk-enc-ante{animation-delay:.05s}
.mk-enc[data-listo][data-entrada=cascada] .mk-enc-bajada{animation-delay:.55s}
.mk-enc[data-listo][data-entrada=cascada] .mk-enc-datos{animation-delay:.7s}
.mk-enc[data-listo][data-entrada=cascada] .mk-enc-botones{animation-delay:.85s}
.mk-enc[data-listo][data-entrada=cascada] .mk-enc-talon{animation-delay:1s}
.mk-enc[data-listo][data-entrada=cascada] :is(.mk-enc-media,.mk-enc-marco,.mk-enc-paneles){animation:mk-e-aparecer 1s ease-out .2s both}
.mk-enc[data-listo][data-entrada=deslizar] :is(.mk-enc-caja>*,.mk-enc-marco>.mk-enc-caja>*){animation:mk-e-izq .9s cubic-bezier(.2,.8,.2,1) both}
.mk-enc[data-listo][data-entrada=deslizar] :is(.mk-enc-media,.mk-enc-paneles,.mk-enc-talon){animation:mk-e-der 1s cubic-bezier(.2,.8,.2,1) .15s both}
.mk-enc[data-listo][data-entrada=deslizar] .mk-enc-caja>*:nth-child(2){animation-delay:.1s}
.mk-enc[data-listo][data-entrada=deslizar] .mk-enc-caja>*:nth-child(3){animation-delay:.2s}
.mk-enc[data-listo][data-entrada=deslizar] .mk-enc-caja>*:nth-child(n+4){animation-delay:.3s}
.mk-enc[data-listo][data-entrada=zoom] :is(.mk-enc-media img,.mk-capa){animation:mk-e-acercar 1.8s cubic-bezier(.2,.8,.2,1) both}
.mk-enc[data-listo][data-entrada=zoom] :is(.mk-enc-caja,.mk-enc-marco){animation:mk-e-subir 1s cubic-bezier(.2,.8,.2,1) .35s both}
.mk-enc[data-listo][data-entrada=foco] .mk-enc-telon{display:block;position:absolute;inset:0;z-index:5;background:#000;pointer-events:none;animation:mk-e-luz 1.6s steps(8,end) both}
.mk-enc[data-listo][data-entrada=foco] :is(.mk-enc-caja,.mk-enc-marco){animation:mk-e-crecer 1.6s cubic-bezier(.2,.8,.2,1) .2s both}
.mk-enc[data-listo][data-entrada=telon] .mk-enc-telon{display:block;position:absolute;inset:0;z-index:5;pointer-events:none}
.mk-enc[data-listo][data-entrada=telon] .mk-enc-telon i{position:absolute;top:0;bottom:0;width:50.5%;background:var(--mk-acento,#7c5cff)}
.mk-enc[data-listo][data-entrada=telon] .mk-enc-telon i:first-child{left:0;animation:mk-e-telon-izq 1.1s cubic-bezier(.7,0,.2,1) .25s both}
.mk-enc[data-listo][data-entrada=telon] .mk-enc-telon i:last-child{right:0;background:var(--mk-acento-2,var(--mk-acento,#7c5cff));animation:mk-e-telon-der 1.1s cubic-bezier(.7,0,.2,1) .25s both}
.mk-enc[data-listo][data-entrada=telon] :is(.mk-enc-caja,.mk-enc-marco){animation:mk-e-crecer 1.2s cubic-bezier(.2,.8,.2,1) .6s both}
.mk-enc[data-listo][data-entrada=golpe] :is(.mk-enc-caja,.mk-enc-marco){animation:mk-e-golpe .5s linear .55s both}
.mk-enc[data-listo][data-entrada=golpe] :is(.mk-enc-bajada,.mk-enc-botones,.mk-enc-datos){animation:mk-e-subir .6s cubic-bezier(.2,.8,.2,1) .8s both}
.mk-estilo[data-mk-estilo=retro] .mk-enc:is([data-composicion=gigante],[data-composicion=poster],[data-composicion=marquesina]) .mk-enc-titulo{font-size:clamp(1.6rem,6.2cqi,5.2rem);line-height:1.25}
@keyframes mk-e-subir{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes mk-e-aparecer{from{opacity:0}to{opacity:1}}
@keyframes mk-e-izq{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:none}}
@keyframes mk-e-der{from{opacity:0;transform:translateX(80px)}to{opacity:1;transform:none}}
@keyframes mk-e-acercar{from{transform:scale(1.25)}to{transform:none}}
@keyframes mk-e-luz{0%{opacity:1}20%{opacity:.6}25%{opacity:.95}40%{opacity:.3}45%{opacity:.7}100%{opacity:0}}
@keyframes mk-e-crecer{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
@keyframes mk-e-telon-izq{from{transform:none}to{transform:translateX(-101%)}}
@keyframes mk-e-telon-der{from{transform:none}to{transform:translateX(101%)}}
@keyframes mk-e-golpe{0%,100%{transform:none}20%{transform:translate(-8px,4px) rotate(-1deg)}40%{transform:translate(7px,-5px) rotate(1deg)}60%{transform:translate(-4px,2px)}80%{transform:translate(2px,-1px)}}
@media (prefers-reduced-motion:reduce){.mk-enc *,.mk-enc *::before,.mk-enc *::after{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}.mk-enc .mk-enc-telon{display:none!important}.mk-enc-cinta>div{animation:none!important}}

/* Escena: póster, objeto protagonista y salida al bajar */
.mk-enc-poster{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.mk-enc-objeto{position:relative;z-index:1;display:grid;place-items:center;min-width:0}
.mk-enc:not([data-composicion=dividido])>.mk-enc-objeto{position:absolute;z-index:1;right:clamp(.5rem,5cqi,4rem);bottom:clamp(1rem,8cqi,5rem);width:min(40cqi,360px);aspect-ratio:1;pointer-events:auto}
.mk-enc:not([data-composicion=dividido])>.mk-enc-objeto .mk-video{width:100%;height:100%}
@container (max-width:720px){.mk-enc:not([data-composicion=dividido])>.mk-enc-objeto{position:relative;right:auto;bottom:auto;width:min(80cqi,320px);margin:-2rem auto 2rem}}
.mk-enc[data-composicion=dividido] .mk-enc-objeto .mk-video{width:100%;max-height:72svh;aspect-ratio:1}
@supports (animation-timeline: view()){
  .mk-enc[data-salida]>.mk-enc-in{animation:linear both;animation-timeline:view();animation-range:exit 0% exit 100%}
  .mk-enc[data-salida=achicar]>.mk-enc-in{animation-name:mk-sal-achicar}
  .mk-enc[data-salida=desvanecer]>.mk-enc-in{animation-name:mk-sal-desvanecer}
  .mk-enc[data-salida=abrir] .mk-enc-caja{animation:mk-sal-arriba linear both;animation-timeline:view();animation-range:exit 0% exit 100%}
  .mk-enc[data-salida=abrir] :is(.mk-enc-media,.mk-enc-objeto,.mk-enc-paneles){animation:mk-sal-abajo linear both;animation-timeline:view();animation-range:exit 0% exit 100%}
}
@keyframes mk-sal-achicar{to{scale:.85;opacity:.15}}
@keyframes mk-sal-desvanecer{to{translate:0 -14%;opacity:0}}
@keyframes mk-sal-arriba{to{translate:0 -35%;opacity:0}}
@keyframes mk-sal-abajo{to{translate:0 30%;opacity:.2}}
@media (prefers-reduced-motion:reduce){.mk-enc[data-salida] :is(.mk-enc-in,.mk-enc-caja,.mk-enc-media,.mk-enc-objeto,.mk-enc-paneles){animation:none!important}}
/* Película: apertura, varias tomas y palabras que rotan */
.mk-enc-apertura{position:absolute;inset:0;z-index:40;display:grid;place-items:center;cursor:pointer;animation:mk-p-ap-fuera 2.6s linear forwards}
.mk-ap-franja{position:absolute;left:0;right:0;height:50.5%;background:#000}
.mk-ap-franja[data-lado=arriba]{top:0;animation:mk-p-ap-arriba 2.6s cubic-bezier(.7,0,.2,1) forwards}
.mk-ap-franja[data-lado=abajo]{bottom:0;animation:mk-p-ap-abajo 2.6s cubic-bezier(.7,0,.2,1) forwards}
.mk-ap-texto{position:relative;text-align:center;color:#fff;padding:0 1rem;animation:mk-p-ap-texto 2.6s ease forwards}
.mk-ap-texto small{display:block;letter-spacing:.3em;text-transform:uppercase;font-size:.8rem;opacity:.8;margin-bottom:.6rem}
.mk-ap-texto b{display:block;font-family:var(--mk-fuente-titulo,inherit);font-size:clamp(1.8rem,5cqi,3.4rem);line-height:1.05}
@keyframes mk-p-ap-arriba{0%,45%{translate:0 0}100%{translate:0 -101%}}
@keyframes mk-p-ap-abajo{0%,45%{translate:0 0}100%{translate:0 101%}}
@keyframes mk-p-ap-texto{0%{opacity:0;scale:.96}15%,45%{opacity:1;scale:1}62%,100%{opacity:0;scale:1.04}}
@keyframes mk-p-ap-fuera{0%,90%{opacity:1}100%{opacity:0}}
.mk-tomas{position:relative;width:100%;height:100%}
.mk-tomas>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 1.2s ease}
.mk-tomas>img[data-activa]{opacity:1;animation:mk-p-toma 6s linear both}
@keyframes mk-p-toma{from{scale:1}to{scale:1.08}}
.mk-enc[data-nivel=quieto] .mk-tomas>img,.mk-enc[data-nivel=liviano] .mk-tomas>img{animation:none;transition:none}
.mk-rot{display:inline-grid}
.mk-rot>span{grid-area:1/1;white-space:nowrap;opacity:0;translate:0 .35em;transition:opacity .45s ease,translate .45s ease}
.mk-rot>span[data-activa]{opacity:1;translate:0 0}
@media (prefers-reduced-motion:reduce){.mk-enc-apertura{display:none}.mk-tomas>img,.mk-rot>span{transition:none;animation:none}}
/* Película: salida «barra», telón al bajar y estado del negocio */
.mk-enc-barra{position:fixed;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.6rem clamp(1rem,4vw,2rem);background:color-mix(in srgb,var(--mk-fondo,#fff) 92%,transparent);border-bottom:1px solid color-mix(in srgb,var(--mk-texto,#000) 12%,transparent);backdrop-filter:blur(8px);translate:0 -110%;opacity:0;transition:translate .35s ease,opacity .35s ease}
.mk-enc-barra[data-visible]{translate:0 0;opacity:1}
.mk-enc-barra-logo{height:34px;width:auto}
.mk-enc-barra-nombre{font-family:var(--mk-fuente-titulo,inherit);font-size:1.15rem}
.mk-enc-barra .mk-btn{padding:.5rem 1rem;font-size:.85rem}
.mk-enc-cortinas{position:absolute;inset:0;z-index:6;pointer-events:none;overflow:clip}
.mk-enc-cortinas i{position:absolute;top:0;bottom:0;width:50.5%;background:var(--mk-acento,#7c5cff)}
.mk-enc-cortinas i:first-child{left:0;translate:-100% 0}
.mk-enc-cortinas i:last-child{right:0;translate:100% 0}
@supports (animation-timeline: view()){
  .mk-enc[data-salida=barra]>.mk-enc-in{animation:mk-sal-achicar linear both;animation-timeline:view();animation-range:exit 0% exit 100%}
  .mk-enc[data-salida=telon] .mk-enc-cortinas i{animation:linear both;animation-timeline:view();animation-range:exit 10% exit 90%}
  .mk-enc[data-salida=telon] .mk-enc-cortinas i:first-child{animation-name:mk-sal-cortina-izq}
  .mk-enc[data-salida=telon] .mk-enc-cortinas i:last-child{animation-name:mk-sal-cortina-der}
}
@keyframes mk-sal-cortina-izq{from{translate:-100% 0}to{translate:0 0}}
@keyframes mk-sal-cortina-der{from{translate:100% 0}to{translate:0 0}}
.mk-enc-estado{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem .8rem;margin:0;font-size:.9rem}
.mk-enc-estado>i{width:.6rem;height:.6rem;border-radius:50%;background:color-mix(in srgb,var(--mk-texto,#000) 45%,transparent)}
.mk-enc-estado[data-abierto]>i{background:#2fbf71;box-shadow:0 0 0 3px color-mix(in srgb,#2fbf71 30%,transparent)}
.mk-enc-estado-proxima{opacity:.85}
@media (prefers-reduced-motion:reduce){.mk-enc-cortinas{display:none}.mk-enc-barra{transition:none}}
`;
