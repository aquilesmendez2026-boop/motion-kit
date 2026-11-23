import { RUIDO } from "./texturas";

/** Cómo cada estilo viste los títulos, botones y tarjetas del kit. Solo se anima transform y opacity. */
export const CSS_ESTILOS = `
.mk-estilo{position:relative;isolation:isolate;background:var(--mk-fondo);color:var(--mk-texto);font-family:var(--mk-fuente-texto);--lm-acento:var(--mk-acento);--lm-fondo:var(--mk-fondo);--lm-superficie:var(--mk-superficie);--lm-sobre-acento:var(--mk-sobre-acento);--mk-acento-texto:var(--mk-acento)}
.mk-estilo :is(h1,h2,h3,.mk-titulo){font-family:var(--mk-fuente-titulo);line-height:1.08}
.mk-estilo-textura{position:absolute;inset:0;pointer-events:none;z-index:50;overflow:hidden}
@media (hover:hover) and (pointer:fine){.mk-estilo[data-cursor]{cursor:var(--mk-cursor),auto}}

/* Neón */
.mk-estilo[data-mk-estilo=neon] :is(h1,h2){color:#fff;text-shadow:0 0 6px var(--mk-acento),0 0 22px var(--mk-acento),0 0 48px color-mix(in srgb,var(--mk-acento) 60%,transparent)}
.mk-estilo[data-mk-estilo=neon] h3{color:var(--mk-acento-2);text-shadow:0 0 12px color-mix(in srgb,var(--mk-acento-2) 70%,transparent)}
.mk-estilo[data-mk-estilo=neon] .mk-btn{box-shadow:0 0 0 1px var(--a),0 0 18px -2px var(--a),inset 0 0 12px -4px var(--a);text-shadow:0 0 8px currentColor}
.mk-estilo[data-mk-estilo=neon] .mk-btn[data-variante=solido]{text-shadow:none}
.mk-estilo[data-mk-estilo=neon] .mk-btn:is([data-variante=contorno],[data-variante=fantasma]){background:color-mix(in srgb,var(--mk-fondo) 72%,transparent)}
.mk-estilo[data-mk-estilo=neon] .mk-card{background:color-mix(in srgb,var(--mk-superficie) 85%,transparent);border-color:color-mix(in srgb,var(--mk-acento-2) 55%,transparent);box-shadow:0 0 24px -10px var(--mk-acento-2),inset 0 0 30px -18px var(--mk-acento-2)}
.mk-estilo[data-mk-estilo=neon] .mk-estilo-textura{background:radial-gradient(ellipse at 50% 0,transparent 50%,rgba(0,0,0,.55))}

/* Retro */
.mk-estilo[data-mk-estilo=retro] :is(h1,h2,h3){text-transform:uppercase;letter-spacing:.02em;line-height:1.35}
.mk-estilo[data-mk-estilo=retro] h1{text-shadow:4px 4px 0 var(--mk-acento-2)}
.mk-estilo[data-mk-estilo=retro] h1{font-size:clamp(1.5rem,6vw,3.2rem)}
.mk-estilo[data-mk-estilo=retro] h2{color:var(--mk-acento);font-size:clamp(1.05rem,3.4vw,1.6rem)}
.mk-estilo[data-mk-estilo=retro] h3{font-size:.9rem}
.mk-estilo[data-mk-estilo=retro] .mk-btn{font-family:var(--mk-fuente-titulo);font-size:.72rem;text-transform:uppercase;border:3px solid var(--mk-texto);box-shadow:5px 5px 0 var(--mk-acento-2);transition:transform .08s steps(2)}
.mk-estilo[data-mk-estilo=retro] .mk-btn:active{transform:translate(5px,5px);box-shadow:none}
@media (hover:hover){.mk-estilo[data-mk-estilo=retro] .mk-btn:not(:disabled):hover{transform:translate(-2px,-2px)}}
.mk-estilo[data-mk-estilo=retro] .mk-card{border:3px solid var(--mk-texto);box-shadow:7px 7px 0 var(--mk-acento)}
.mk-estilo[data-mk-estilo=retro] .mk-estilo-textura{background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 1px,transparent 1px 3px);opacity:.55}

/* Rock */
.mk-estilo[data-mk-estilo=rock] :is(h1,h2){text-transform:uppercase;letter-spacing:.01em;transform:rotate(-1.5deg);width:fit-content}
.mk-estilo[data-mk-estilo=rock] h1{font-size:clamp(2.8rem,13vw,7rem);line-height:.92}
.mk-estilo[data-mk-estilo=rock] h2{display:inline-block;background:var(--mk-acento);color:var(--mk-sobre-acento);padding:.05em .3em}
.mk-estilo[data-mk-estilo=rock] h3{text-transform:uppercase;color:var(--mk-acento-2)}
.mk-estilo[data-mk-estilo=rock] .mk-btn{font-family:var(--mk-fuente-titulo);text-transform:uppercase;letter-spacing:.06em;font-weight:400;font-size:1.05rem;border:3px solid currentColor}
.mk-estilo[data-mk-estilo=rock] .mk-btn[data-variante=solido]{border-color:var(--mk-acento)}
@media (hover:hover){.mk-estilo[data-mk-estilo=rock] .mk-btn:not(:disabled):hover{transform:rotate(-2deg) scale(1.04)}}
.mk-estilo[data-mk-estilo=rock] .mk-card{border:2px solid color-mix(in srgb,var(--mk-texto) 25%,transparent)}
.mk-estilo[data-mk-estilo=rock] .mk-card:nth-child(odd){transform:rotate(-1deg)}
.mk-estilo[data-mk-estilo=rock] .mk-card:nth-child(even){transform:rotate(.8deg)}
.mk-estilo[data-mk-estilo=rock] .mk-card::before{content:"";position:absolute;top:-10px;left:50%;width:84px;height:22px;margin-left:-42px;background:color-mix(in srgb,var(--mk-acento-2) 70%,transparent);transform:rotate(-4deg);z-index:3}
.mk-estilo[data-mk-estilo=rock] .mk-estilo-textura{background-image:${RUIDO};opacity:.13;mix-blend-mode:screen}

/* Anime */
.mk-estilo[data-mk-estilo=anime] :is(h1,h2){font-style:italic;transform:skewX(-6deg);letter-spacing:-.01em}
.mk-estilo[data-mk-estilo=anime] h1{color:var(--mk-texto);text-shadow:3px 3px 0 var(--mk-acento-2),-2px -2px 0 #fff,6px 6px 0 var(--mk-acento)}
.mk-estilo[data-mk-estilo=anime] h2{color:var(--mk-acento)}
.mk-estilo[data-mk-estilo=anime] .mk-btn{border:3px solid var(--mk-texto);box-shadow:4px 4px 0 var(--mk-texto);font-weight:800}
.mk-estilo[data-mk-estilo=anime] .mk-btn:active{transform:translate(4px,4px);box-shadow:none}
.mk-estilo[data-mk-estilo=anime] .mk-card{border:3px solid var(--mk-texto);box-shadow:6px 6px 0 var(--mk-texto)}
.mk-estilo[data-mk-estilo=anime] .mk-card::before{content:"";position:absolute;top:0;right:0;width:46%;height:46%;border-top-right-radius:inherit;background:radial-gradient(circle,color-mix(in srgb,var(--mk-acento-2) 45%,transparent) 22%,transparent 24%) 0 0/9px 9px;-webkit-mask:linear-gradient(225deg,#000,transparent 70%);mask:linear-gradient(225deg,#000,transparent 70%);pointer-events:none;z-index:1}

/* Película */
.mk-estilo[data-mk-estilo=pelicula] :is(h1,h2){font-weight:800;letter-spacing:.01em}
.mk-estilo[data-mk-estilo=pelicula] h1{font-size:clamp(2.4rem,9vw,5.6rem)}
.mk-estilo[data-mk-estilo=pelicula] h2{color:var(--mk-acento)}
.mk-estilo[data-mk-estilo=pelicula] h3{text-transform:uppercase;letter-spacing:.18em;font-size:.85rem;font-family:var(--mk-fuente-texto);color:var(--mk-acento)}
.mk-estilo[data-mk-estilo=pelicula] .mk-btn{text-transform:uppercase;letter-spacing:.22em;font-size:.78rem;border-width:1px}
.mk-estilo[data-mk-estilo=pelicula] .mk-card{border-color:color-mix(in srgb,var(--mk-acento) 45%,transparent)}
.mk-estilo[data-mk-estilo=pelicula] .mk-estilo-textura{background:${RUIDO},radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.6));opacity:.5;mix-blend-mode:overlay}

/* Puente con La Mente (EstiloLaMente): los títulos siguen al tema y usan el texto de la paleta, como TemaPagina.
   Va al final para ganarle al estilo base; las composiciones sobre foto (más específicas) siguen mandando. */
.mk-estilo[data-lm-tema] :is(h1,h2){color:var(--mk-texto);font-family:var(--mk-fuente-titulo);text-transform:var(--lm-titulo-mayusculas,none);letter-spacing:var(--lm-titulo-espaciado,normal);font-weight:var(--lm-titulo-peso,800)}
.mk-estilo[data-lm-tema] h2{color:var(--mk-acento-texto)}
.mk-estilo[data-lm-claro][data-mk-estilo=neon]:not([data-lm-brillo]) :is(h1,h2){text-shadow:none}
.mk-estilo[data-lm-tema][data-lm-brillo] :is(h1,h2){text-shadow:0 0 .35em color-mix(in srgb,var(--mk-acento) 75%,transparent),0 0 1.2em color-mix(in srgb,var(--mk-acento) 45%,transparent)}

@media (prefers-reduced-motion:reduce){.mk-estilo .mk-btn:hover{transform:none!important}}
`;
