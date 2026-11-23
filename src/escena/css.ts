export const CSS_ESCENA = `
.mk-escena{position:relative;isolation:isolate;overflow:clip}
.mk-escena-contenido{position:relative;z-index:2}
.mk-planos{position:absolute;inset:-6%;z-index:1;pointer-events:none;overflow:visible}
.mk-plano{position:absolute;inset:0;will-change:translate;
  translate:calc(var(--mk-cx,0) * var(--z) * var(--mk-planos-rango,28px)) calc(var(--mk-cy,0) * var(--z) * var(--mk-planos-rango,28px) + var(--mk-cs,0) * var(--z) * -120px);
  scale:var(--zs,1)}
.mk-plano>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.mk-plano>img{position:absolute;max-width:none;translate:-50% -50%;pointer-events:none}
.mk-plano[data-forma=orbes]{color:var(--mk-acento,#7c5cff);opacity:.7}
.mk-luz{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;mix-blend-mode:screen}
.mk-luz>i{position:absolute;display:block}
.mk-luz[data-modo=puntero]>i{left:20%;top:-10%;width:60%;aspect-ratio:1;border-radius:50%;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--mk-acento,#7c5cff) 45%,transparent),transparent);
  translate:calc(var(--mk-cx,0) * 70%) calc(var(--mk-cy,0) * 50%);opacity:.9}
.mk-luz[data-modo=barrido]>i{inset:-50% auto -50% -60%;width:35%;rotate:18deg;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.22) 45%,rgba(255,255,255,.4) 50%,rgba(255,255,255,.22) 55%,transparent);
  animation:mk-luz-barrido 6s ease-in-out 1.2s infinite}
@keyframes mk-luz-barrido{0%{translate:0 0}45%,100%{translate:520% 0}}
@media (prefers-reduced-motion:reduce){.mk-plano{translate:none;scale:none}.mk-luz>i{animation:none!important;translate:none!important}}
/* ShaderFondo: el degradado de abajo es el respaldo sin WebGL y el póster mientras carga */
.mk-shader{position:absolute;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(60% 70% at 25% 20%,color-mix(in srgb,var(--mk-acento,#7c5cff) 38%,transparent),transparent 70%),
    radial-gradient(55% 60% at 80% 75%,color-mix(in srgb,var(--mk-acento-2,var(--mk-acento,#25f2ff)) 30%,transparent),transparent 70%),var(--mk-fondo,#0b0920)}
.mk-shader>canvas{display:block;width:100%;height:100%;opacity:0;transition:opacity .8s ease}
.mk-shader[data-listo]>canvas{opacity:1}
.mk-shader[data-sin-webgl]>canvas{display:none}

/* Objeto3DCss */
.mk-obj{position:relative;width:var(--mk-obj-tam);height:var(--mk-obj-tam);perspective:900px;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none}
.mk-obj[data-forma=tarjeta]{height:calc(var(--mk-obj-tam) / 1.586)}
.mk-obj[data-arrastrando]{cursor:grabbing}
.mk-obj-giro,.mk-obj-cuerpo{position:absolute;inset:0;transform-style:preserve-3d}
.mk-obj-giro{transform:rotateX(calc(var(--mk-cy,0) * -18deg)) rotateY(calc(var(--mk-cx,0) * 30deg + var(--mk-obj-giro,0deg)));transition:transform .2s ease-out}
.mk-obj[data-forma=caja] .mk-obj-giro{transform:rotateX(calc(-14deg + var(--mk-cy,0) * -18deg)) rotateY(calc(-28deg + var(--mk-cx,0) * 30deg + var(--mk-obj-giro,0deg)))}
.mk-obj[data-girar] .mk-obj-cuerpo{animation:mk-obj-girar 16s linear infinite}
.mk-obj[data-arrastrando] .mk-obj-cuerpo{animation-play-state:paused}
@keyframes mk-obj-girar{from{rotate:y 0deg}to{rotate:y 360deg}}
.mk-obj-cara{position:absolute;left:50%;top:50%;translate:-50% -50%;display:grid;place-items:center;overflow:hidden;
  background:var(--mk-acento,#7c5cff) center/cover no-repeat;color:var(--mk-sobre-acento,#fff);border-radius:4px;
  font:700 clamp(1rem,calc(var(--mk-obj-tam) / 9),2.4rem)/1.05 var(--mk-fuente-titulo,inherit);text-align:center;padding:8%}
.mk-obj[data-forma=caja] .mk-obj-cara{box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
.mk-obj[data-forma=caja] .mk-obj-cara:is([data-cara="1"],[data-cara="3"]){filter:brightness(.78)}
.mk-obj[data-forma=caja] .mk-obj-cara[data-cara="2"]{filter:brightness(.7)}
.mk-obj[data-forma=caja] .mk-obj-cara[data-cara="4"]{filter:brightness(1.15)}
.mk-obj[data-forma=caja] .mk-obj-cara[data-cara="5"]{filter:brightness(.55)}
.mk-obj[data-forma=tarjeta] .mk-obj-cara{border-radius:calc(var(--mk-obj-tam) * .05);backface-visibility:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.15)}
.mk-obj[data-forma=tarjeta] .mk-obj-cara[data-cara="1"]{filter:brightness(.8)}
.mk-obj-tira{border-radius:0;padding:0;backface-visibility:hidden;
  background-image:linear-gradient(var(--mk-acento,#7c5cff),color-mix(in srgb,var(--mk-acento,#7c5cff) 70%,#000))}
.mk-obj-tapa{position:absolute;left:50%;top:50%;translate:-50% -50%;border-radius:50%;
  background:radial-gradient(circle,#d9dde3 0 52%,#9ea4ad 53% 60%,#c8ccd2 61% 100%)}
.mk-obj-brillo{position:absolute;left:50%;top:50%;translate:-50% -50%;pointer-events:none;border-radius:6px;mix-blend-mode:soft-light;
  background:linear-gradient(90deg,rgba(0,0,0,.55),rgba(255,255,255,.55) 28%,rgba(255,255,255,0) 52%,rgba(0,0,0,.6))}
.mk-obj-sombra{position:absolute;left:12%;right:12%;bottom:-16%;height:16%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.45),transparent);
  translate:calc(var(--mk-cx,0) * 10px) 0}

/* EscenaVideo */
.mk-video{position:relative;display:grid}
.mk-video>*{grid-area:1/1;width:100%;height:100%;object-fit:contain}
.mk-video[data-ajuste=cover]>*{object-fit:cover}
.mk-video>video{opacity:0;transition:opacity .5s}
.mk-video[data-listo]>video{opacity:1}
.mk-video[data-listo]>.mk-video-poster{opacity:0;transition:opacity .5s .2s}

/* SecuenciaScroll */
.mk-secuencia{position:relative;height:var(--mk-sec-largo,250svh)}
.mk-secuencia[data-quieto]{height:auto}
.mk-secuencia-fija{position:sticky;top:0;height:100svh;overflow:clip;display:grid}
.mk-secuencia[data-quieto] .mk-secuencia-fija{position:relative;height:70svh}
.mk-secuencia-fija>*{grid-area:1/1}
.mk-secuencia canvas{width:100%;height:100%}
.mk-secuencia-encima{position:relative;z-index:1;align-self:end;padding:clamp(1rem,5vw,3rem)}

@media (prefers-reduced-motion:reduce){.mk-obj-cuerpo{animation:none!important}.mk-obj-giro{transition:none}}
`;
