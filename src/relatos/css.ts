// CSS de los relatos. Con scroll nativo (`animation-timeline`), dentro de @supports; sin él, el respaldo marca
// `data-visto` y se usa una transición simple. En quieto (movimiento reducido, ahorro de datos) no hay animación y
// todo queda visible. Solo transform/translate/scale/rotate y opacity en los keyframes (prefijo mk-r-).

/** La página anima con scroll nativo (no está en respaldo ni quieta). */
const ACTIVO = ".mk-pagina:not([data-mk-sin-scroll]):not([data-nivel=quieto])";
/** Además, el teléfono no se traba (nivel completo). */
const COMPLETO = `${ACTIVO}:not([data-nivel=liviano])`;
/** Lo que se cuenta como Escenas: el propio, los capítulos más altos que la pantalla y, en liviano, los pesados. */
const COMO_ESCENAS = [
  `${ACTIVO} .mk-relato[data-modo=escenas]`,
  `${ACTIVO} .mk-relato[data-modo=cuento][data-capitulo-largo]`,
  `${ACTIVO} .mk-relato[data-modo=carrete][data-tira-corta]`,
  `${ACTIVO}[data-nivel=liviano] .mk-relato:is([data-modo=pelicula],[data-modo=cuento],[data-modo=iris],[data-modo=subtitulos],[data-modo=pila])`,
].join(",");

/** Escenas y el sabor de entrada de cada estilo (movimiento base heredado). */
const ESCENAS = `
.mk-pagina{position:relative;overflow-x:clip;--mk-r-entrada:mk-r-fundido;--mk-r-curva:linear}
.mk-relato{position:relative}
[data-mk-estilo=neon] .mk-pagina{--mk-r-entrada:mk-r-enciende}
[data-mk-estilo=retro] .mk-pagina{--mk-r-entrada:mk-r-pasos;--mk-r-curva:steps(5)}
[data-mk-estilo=rock] .mk-pagina{--mk-r-entrada:mk-r-golpe}
[data-mk-estilo=anime] .mk-pagina{--mk-r-entrada:mk-r-lado}
@keyframes mk-r-fundido{from{opacity:0;translate:0 32px}to{opacity:1;translate:0 0}}
@keyframes mk-r-enciende{0%{opacity:0}30%{opacity:.7}40%{opacity:.15}60%{opacity:.9}70%{opacity:.45}100%{opacity:1}}
@keyframes mk-r-pasos{from{opacity:0;translate:0 48px}to{opacity:1;translate:0 0}}
@keyframes mk-r-golpe{from{opacity:0;scale:1.12;rotate:-2deg}70%{opacity:1;scale:.98;rotate:.5deg}to{opacity:1;scale:1;rotate:0deg}}
@keyframes mk-r-lado{from{opacity:0;translate:-64px 0}to{opacity:1;translate:0 0}}
@supports (animation-timeline: view()){
  ${COMO_ESCENAS}{animation:var(--mk-r-entrada) var(--mk-r-curva) both;animation-timeline:view();animation-range:entry 10% entry 80%}
}
`;

/** Respaldo sin scroll nativo: entrada simple al aparecer. */
const RESPALDO = `
.mk-pagina[data-mk-sin-scroll]:not([data-nivel=quieto]) .mk-relato:not([data-modo=ninguno]){opacity:0;translate:0 24px;transition:opacity .6s ease,translate .6s ease}
.mk-pagina[data-mk-sin-scroll]:not([data-nivel=quieto]) .mk-relato[data-visto]:not([data-modo=ninguno]){opacity:1;translate:0 0}
`;

/** Lo que nunca puede quedar escondido: con foco de teclado y en quieto. */
const SIEMPRE_VISIBLE = `
.mk-pagina .mk-relato:focus-within,.mk-pagina .mk-relato:focus-within *{opacity:1!important;translate:none!important;scale:none!important;rotate:none!important;animation:none!important}
.mk-pagina .mk-relato:focus-within::before,.mk-pagina .mk-relato:focus-within::after{display:none!important}
.mk-pagina .mk-relato:focus-within [data-mk-tira]{overflow-x:auto!important;width:auto!important}
.mk-pagina[data-nivel=quieto] .mk-relato,.mk-pagina[data-nivel=quieto] .mk-relato *{animation:none!important}
@media (prefers-reduced-motion:reduce){.mk-pagina .mk-relato,.mk-pagina .mk-relato *{animation:none!important;transition:none!important}}
`;

/** Al pasar el cursor por una tarjeta, con el sabor del estilo (solo con mouse). */
const CURSOR = `
@media (hover:hover){
  .mk-pagina [data-mk-parte=tarjeta]{transition:transform .25s ease}
  .mk-pagina [data-mk-parte=tarjeta]:hover{transform:translateY(-4px)}
  [data-mk-estilo=neon] .mk-pagina [data-mk-parte=tarjeta]:hover{transform:translateY(-3px) scale(1.02)}
  [data-mk-estilo=retro] .mk-pagina [data-mk-parte=tarjeta]:hover{transform:translate(-3px,-3px)}
  [data-mk-estilo=rock] .mk-pagina [data-mk-parte=tarjeta]:hover{transform:rotate(-1.5deg) scale(1.02)}
  [data-mk-estilo=anime] .mk-pagina [data-mk-parte=tarjeta]:hover{transform:translateY(-6px)}
  .mk-pagina[data-nivel=quieto] [data-mk-parte=tarjeta]{transition:none}
}
`;

/** B. Película continua: telón del acento, el encabezado se aleja y una cinta marca el avance. */
const PELICULA = `
@keyframes mk-r-telon{from{scale:1 1}to{scale:0 1}}
@keyframes mk-r-plano{to{scale:.86;opacity:.25}}
@keyframes mk-r-cinta{to{scale:1 1}}
.mk-cinta{position:sticky;top:0;height:0;z-index:20;pointer-events:none}
.mk-cinta>i{position:absolute;right:8px;top:12px;width:4px;height:110px;border-radius:4px;overflow:clip;background:color-mix(in srgb,var(--mk-texto,#888) 20%,transparent)}
.mk-cinta>i::after{content:"";position:absolute;inset:0;background:var(--mk-acento);transform-origin:top;scale:1 0}
.mk-pagina:is([data-mk-sin-scroll],[data-nivel=quieto],[data-nivel=liviano]) .mk-cinta{display:none}
@supports (animation-timeline: view()){
  ${COMPLETO} .mk-relato[data-modo=pelicula]{overflow:clip;view-timeline-name:--mk-telon}
  ${COMPLETO} .mk-relato[data-modo=pelicula]::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:var(--mk-acento);transform-origin:right;
    animation:mk-r-telon linear both;animation-timeline:--mk-telon;animation-range:entry 20% entry 95%}
  ${COMPLETO} .mk-relato[data-modo=pelicula]>.mk-relato-in{animation:mk-r-fundido linear both;animation-timeline:view();animation-range:entry 55% entry 100%}
  ${COMPLETO}[data-mk-relato=pelicula] .mk-enc{animation:mk-r-plano linear both;animation-timeline:view();animation-range:exit 0% exit 100%}
  ${COMPLETO} .mk-cinta>i::after{animation:mk-r-cinta linear both;animation-timeline:scroll(nearest)}
}
`;

/** Lo que se queda quieto mientras se baja (cuento, carrete, subtítulos): el bloque se alarga y su interior se pega. */
const QUIETO_AL_BAJAR = (modo: string, nombre: string, largo: number) => `
  ${COMPLETO} .mk-relato[data-modo=${modo}]:not([data-capitulo-largo]):not([data-tira-corta]){min-height:calc(var(--mk-alto-vista,100vh) * ${largo});view-timeline-name:${nombre}}
  ${COMPLETO} .mk-relato[data-modo=${modo}]:not([data-capitulo-largo]):not([data-tira-corta])>.mk-relato-in{position:sticky;top:0;min-height:var(--mk-alto-vista,100vh);display:flex;flex-direction:column;justify-content:center}`;

/** C. Cuento por capítulos: las líneas entran en orden y la foto se acerca. */
const CUENTO = `
@keyframes mk-r-acerca{from{opacity:0;scale:.6}to{opacity:1;scale:1}}
@supports (animation-timeline: view()){
  ${QUIETO_AL_BAJAR("cuento", "--mk-cap", 2.2)}
  ${COMPLETO} .mk-relato[data-modo=cuento]:not([data-capitulo-largo]) [data-mk-parte=linea]{animation:mk-r-fundido linear both;animation-timeline:--mk-cap;
    animation-range:contain calc(var(--mk-i) / var(--mk-n) * 55%) contain calc((var(--mk-i) + 1) / var(--mk-n) * 55%)}
  ${COMPLETO} .mk-relato[data-modo=cuento]:not([data-capitulo-largo]) [data-mk-parte=foto]{animation:mk-r-acerca linear both;animation-timeline:--mk-cap;animation-range:contain 30% contain 90%}
}
`;

/** D. Profundidad: capas a distinta velocidad y tarjetas en cascada. */
const PROFUNDIDAD = `
@keyframes mk-r-capa{from{translate:0 var(--mk-d)}to{translate:0 calc(var(--mk-d) * -1)}}
.mk-relato[data-modo=profundidad]{overflow:clip}
.mk-relato[data-modo=profundidad]>.mk-relato-in{position:relative;z-index:1}
.mk-capas{position:absolute;inset:0;pointer-events:none;z-index:0}
.mk-capas>i{position:absolute;border-radius:50%;background:color-mix(in srgb,var(--mk-acento) 22%,transparent)}
.mk-capas>i:nth-child(1){width:140px;height:140px;right:-36px;top:8%;--mk-d:90px}
.mk-capas>i:nth-child(2){width:64px;height:64px;left:8px;top:45%;--mk-d:170px;background:color-mix(in srgb,var(--mk-acento) 40%,transparent)}
.mk-capas>i:nth-child(3){width:220px;height:220px;left:20%;top:20%;--mk-d:40px;background:color-mix(in srgb,var(--mk-acento-2,var(--mk-acento)) 14%,transparent)}
.mk-pagina:is([data-nivel=liviano],[data-nivel=quieto],[data-mk-sin-scroll]) .mk-capas{display:none}
@supports (animation-timeline: view()){
  ${COMPLETO} .mk-capas>i{animation:mk-r-capa linear both;animation-timeline:view()}
  ${ACTIVO} .mk-relato[data-modo=profundidad] [data-mk-parte=tarjeta]{animation:mk-r-fundido linear both;animation-timeline:view();
    animation-range:entry calc(5% + var(--mk-i) * 6%) entry min(100%, calc(60% + var(--mk-i) * 6%))}
}
`;

/** E. Iris: el bloque se revela desde un círculo que crece (un velo con un hueco que se agranda con scale). */
const IRIS = `
@keyframes mk-r-iris{from{scale:1}to{scale:9}}
@supports (animation-timeline: view()){
  ${COMPLETO} .mk-relato[data-modo=iris]{overflow:clip;view-timeline-name:--mk-iris}
  ${COMPLETO} .mk-relato[data-modo=iris]::after{content:"";position:absolute;inset:-50%;z-index:3;pointer-events:none;
    background:radial-gradient(circle,transparent 0 12%,var(--mk-fondo,#000) 12.5%);animation:mk-r-iris linear both;animation-timeline:--mk-iris;animation-range:entry 0% entry 100%}
}
`;

/** F. Carrete: la tira pasa de lado; sin scroll nativo, en liviano o quieto, se desliza con el dedo. */
const CARRETE = `
@keyframes mk-r-carrete{to{translate:var(--mk-tira-dx,0px) 0}}
.mk-relato[data-modo=carrete] [data-mk-tira]{display:flex;flex-wrap:nowrap;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}
.mk-relato[data-modo=carrete] [data-mk-tira]>*{flex:0 0 auto;min-width:180px;scroll-snap-align:start}
@supports (animation-timeline: view()){
  ${QUIETO_AL_BAJAR("carrete", "--mk-carrete", 2.4)}
  ${COMPLETO} .mk-relato[data-modo=carrete]:not([data-tira-corta])>.mk-relato-in{overflow:clip}
  ${COMPLETO} .mk-relato[data-modo=carrete]:not([data-tira-corta]) [data-mk-tira]{overflow:visible;width:max-content;animation:mk-r-carrete linear both;animation-timeline:--mk-carrete;animation-range:contain 0% contain 100%}
}
`;

/** G. Subtítulos: la frase se enciende palabra por palabra. */
const SUBTITULOS = `
@keyframes mk-r-palabra{from{opacity:.15}to{opacity:1}}
@supports (animation-timeline: view()){
  ${QUIETO_AL_BAJAR("subtitulos", "--mk-frase", 2.2)}
  ${COMPLETO} .mk-relato[data-modo=subtitulos] [data-mk-palabra]{animation:mk-r-palabra linear both;animation-timeline:--mk-frase;
    animation-range:contain calc(var(--mk-i) / var(--mk-n) * 85%) contain calc((var(--mk-i) + 1) / var(--mk-n) * 85%)}
}
`;

/** H. Hilo: una línea se dibuja mientras se baja y una luz viaja por ella. Va por detrás de los bloques. */
const HILO = `
.mk-pagina[data-mk-relato-pagina]{isolation:isolate}
.mk-hilo{position:absolute;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;overflow:visible}
.mk-hilo path{fill:none;stroke:var(--mk-acento);stroke-width:3;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0;opacity:.7}
.mk-hilo-viajero{position:absolute;left:0;top:0;z-index:-1;width:18px;height:18px;border-radius:50%;background:var(--mk-acento);box-shadow:0 0 16px var(--mk-acento);offset-rotate:0deg;pointer-events:none;display:none}
.mk-pagina:is([data-mk-sin-scroll],[data-nivel=quieto]) .mk-hilo{display:none}
@keyframes mk-r-hilo-trazo{to{stroke-dashoffset:0}}
@keyframes mk-r-hilo-viaje{from{offset-distance:0%}to{offset-distance:100%}}
@supports (animation-timeline: view()){
  ${COMPLETO} .mk-hilo path{stroke-dashoffset:1;animation:mk-r-hilo-trazo linear both;animation-timeline:scroll(nearest)}
  ${COMPLETO} .mk-hilo-viajero{display:block;animation:mk-r-hilo-viaje linear both;animation-timeline:scroll(nearest)}
}
`;

/** I. Luz que cambia: el cielo (tintes de la paleta, para que el texto se siga leyendo) pasa de la tarde a la noche. */
const LUZ = `
.mk-cielo{position:sticky;top:0;height:var(--mk-alto-vista,100vh);margin-bottom:calc(var(--mk-alto-vista,100vh) * -1);z-index:-1;pointer-events:none;overflow:clip}
.mk-cielo>i{position:absolute;inset:0;opacity:0}
.mk-cielo>i[data-hora=tarde]{opacity:1;background:linear-gradient(color-mix(in srgb,var(--mk-acento) 22%,var(--mk-fondo)),var(--mk-fondo))}
.mk-cielo>i[data-hora=atardecer]{background:linear-gradient(color-mix(in srgb,var(--mk-acento) 40%,var(--mk-fondo)),color-mix(in srgb,var(--mk-acento) 12%,var(--mk-fondo)))}
.mk-cielo>i[data-hora=noche]{background:linear-gradient(color-mix(in srgb,var(--mk-texto) 22%,var(--mk-fondo)),var(--mk-fondo))}
.mk-sol{position:absolute;left:50%;top:12%;width:90px;height:90px;margin-left:-45px;border-radius:50%;background:var(--mk-acento);opacity:.55;box-shadow:0 0 60px var(--mk-acento)}
@keyframes mk-r-aparece{from{opacity:0}to{opacity:1}}
@keyframes mk-r-sol{to{translate:0 calc(var(--mk-alto-vista,100vh) * .6);scale:.6;opacity:.25}}
@supports (animation-timeline: view()){
  ${COMPLETO} .mk-cielo>i[data-hora=atardecer]{animation:mk-r-aparece linear both;animation-timeline:scroll(nearest);animation-range:20% 55%}
  ${COMPLETO} .mk-cielo>i[data-hora=noche]{animation:mk-r-aparece linear both;animation-timeline:scroll(nearest);animation-range:55% 95%}
  ${COMPLETO} .mk-sol{animation:mk-r-sol linear both;animation-timeline:scroll(nearest)}
}
`;

export const CSS_RELATOS = ESCENAS + RESPALDO + PELICULA + CUENTO + PROFUNDIDAD + IRIS + CARRETE + SUBTITULOS + HILO + LUZ + SIEMPRE_VISIBLE + CURSOR;
