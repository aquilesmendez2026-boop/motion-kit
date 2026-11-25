// El CSS de «Luz y materia». Todo lee la luz de las variables que pone `Luz` (o, fuera de una, la luz de siempre).
// Regla de la casa: las capas solo se corren, se agrandan y se funden. Los difuminados y los fondos no cambian.

/** Un grano fino de papel (ruido fijo, dibujado una vez). */
const GRANO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .5 -.12'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
/** El blanco de la luz (toma el tinte de la hora, si lo hay). */
const B = "var(--mk-luz-tinte,#fff)";
const m = (tipo: string) => `.mk-lz[data-mk-materia=${tipo}]`;

const CSS_MATERIA =
  // La altura es un número que se puede animar: al apuntar o apretar, las sombras cambian suave.
  '@property --mk-lz-a{syntax:"<number>";inherits:true;initial-value:1}' +
  // Por dónde va la superficie en la pantalla, de -1 (asoma por abajo) a 1 (sale por arriba). Donde el navegador ata
  // animaciones al scroll, lo lleva él solo, sin código; donde no, se queda en 0 y la luz se corre entera (lo hace `Luz`).
  '@property --mk-lz-paso-y{syntax:"<number>";inherits:true;initial-value:0}' +
  "@supports (animation-timeline:view()){.mk-lz{animation:mk-lz-pasa linear both;animation-timeline:view()}@keyframes mk-lz-pasa{from{--mk-lz-paso-y:-1}to{--mk-lz-paso-y:1}}}" +
  // La luz que ve esta superficie: la de ahora, o la de reposo, o la de siempre. `--mk-lz-ix/iy`: hacia dónde se inclinó.
  ".mk-lz{--mk-lz-x:calc(var(--mk-lx,var(--mk-l0x,-.45)) - var(--mk-lz-ix,0)*.5);--mk-lz-y:min(var(--mk-lz-tope,-.05),calc(var(--mk-ly,var(--mk-l0y,-.8)) + var(--mk-lz-paso-y)*var(--mk-lz-paso,0) - var(--mk-lz-iy,0)*.5));" +
  "--mk-lz-bx:clamp(-1,var(--mk-lz-x),1);--mk-lz-by:clamp(-1,var(--mk-lz-y),1);--mk-lz-x0:var(--mk-l0x,-.45);--mk-lz-y0:var(--mk-l0y,-.8);--mk-lz-a:var(--mk-lz-a0,1);" +
  "position:relative;isolation:isolate;box-sizing:border-box;background:none;color:var(--mk-lz-texto,#221d18);-webkit-tap-highlight-color:transparent;" +
  "transition:--mk-lz-a .3s cubic-bezier(.2,.8,.2,1),scale .3s cubic-bezier(.2,.8,.2,1),translate .12s ease-out}" +
  // Lo que la página puede cambiar con su propia clase (por eso va sin peso: cualquier clase le gana).
  ":where(.mk-lz){display:block;margin:0;padding:1.1rem 1.2rem;border:0;border-radius:16px;font:inherit;text-align:inherit;text-decoration:none}" +
  // Apuntar levanta (solo donde hay cursor); apretar hunde hacia la sombra.
  "@media (hover:hover){.mk-lz:hover{--mk-lz-a:var(--mk-lz-a1,2);scale:calc(1 + (var(--mk-lz-a1,2) - var(--mk-lz-a0,1))*.012)}}" +
  ".mk-lz[data-mk-aprieta]{cursor:pointer}" +
  ".mk-lz[data-mk-aprieta]:active{--mk-lz-a:0;scale:.992;translate:calc(var(--mk-lz-x)*-2px) calc(var(--mk-lz-y)*-2px)}" +
  ".mk-lz:focus-visible{outline:3px solid var(--mk-acento,#2456e6);outline-offset:3px}" +
  // Inclinarse hacia el cursor: la profundidad va en su propia transformación (no en el padre).
  ".mk-lz[data-mk-inclina]{transform:perspective(900px) rotateX(calc(var(--mk-lz-iy,0)*var(--mk-lz-i,0)*-1deg)) rotateY(calc(var(--mk-lz-ix,0)*var(--mk-lz-i,0)*1deg));" +
  "transition:--mk-lz-a .3s cubic-bezier(.2,.8,.2,1),scale .3s cubic-bezier(.2,.8,.2,1),translate .12s ease-out,transform .6s cubic-bezier(.2,.8,.2,1)}" +
  ".mk-lz[data-mk-inclinando]{transition-duration:.3s,.3s,.12s,.12s}" +
  // Las capas: decoración, sin toques.
  ".mk-lz-sombra,.mk-lz-cara{position:absolute;inset:0;border-radius:inherit;pointer-events:none}" +
  ".mk-lz-sombra{z-index:-2}" +
  ".mk-lz-sombra>i{position:absolute;inset:0;border-radius:inherit;background:var(--mk-lz-sombra,#1b1410)}" +
  // La de contacto: chica y oscura, casi no se mueve; se aclara cuando la superficie sube.
  ".mk-lz-contacto{filter:blur(2.5px);opacity:calc((.46 - var(--mk-lz-a)*.07)*var(--mk-luz-fuerza,1));translate:calc(var(--mk-lz-x)*-1.5px) calc(var(--mk-lz-y)*-1.5px)}" +
  // La proyectada: al lado contrario de la luz; más lejos, más grande y más clara con la altura (la cuenta de `sombraDe`).
  // Su tamaño y su difuminado salen de la altura de base y no se animan; al apuntar o apretar solo se corre y se funde.
  ".mk-lz-sombra>.mk-lz-proyectada{inset:calc(var(--mk-lz-a0,1)*-2px);filter:blur(calc(5px + var(--mk-lz-a0,1)*3.5px));opacity:calc(min(1,var(--mk-lz-a))*(.42 - var(--mk-lz-a)*.055)*var(--mk-luz-fuerza,1));" +
  "translate:calc(var(--mk-lz-x)*var(--mk-lz-a)*-7px) calc(var(--mk-lz-y)*var(--mk-lz-a)*-7px)}" +
  // La cara: el material. El brillo va adentro, recortado por el borde, y es más grande que la cara: solo se corre.
  // El canto: una línea clara del lado de la luz y una oscura al otro. Da el espesor. Es fija (la luz en reposo).
  ".mk-lz-cara{z-index:-1;overflow:hidden;overflow:clip;isolation:isolate;background:var(--mk-lz-color,#fbf8f2);" +
  "box-shadow:inset calc(var(--mk-lz-x0)*-1.3px) calc(var(--mk-lz-y0)*-1.3px) 0 color-mix(in srgb,#fff 60%,transparent),inset calc(var(--mk-lz-x0)*1.3px) calc(var(--mk-lz-y0)*1.3px) 0 rgba(0,0,0,.14)}" +
  ".mk-lz-brillo{position:absolute;inset:-100%;mix-blend-mode:overlay;opacity:var(--mk-luz-fuerza,1);translate:calc(var(--mk-lz-bx)*20%) calc(var(--mk-lz-by)*20%);" +
  // Mate (por defecto): claro hacia la luz y más oscuro al otro lado.
  `background:radial-gradient(closest-side,${B},transparent 46%,rgba(0,0,0,.34))}` +
  // Papel: sin brillo; una luz pareja y grano fino.
  `${m("papel")} .mk-lz-cara{background:var(--mk-lz-color,#f6f0e4) ${GRANO};background-blend-mode:overlay}` +
  `${m("papel")} .mk-lz-brillo{translate:calc(var(--mk-lz-bx)*15%) calc(var(--mk-lz-by)*15%);background:radial-gradient(closest-side,color-mix(in srgb,${B} 55%,transparent),transparent 58%,rgba(0,0,0,.22))}` +
  `${m("papel")} .mk-lz-proyectada{filter:blur(calc(3px + var(--mk-lz-a0,1)*2.5px))}` +
  // Vidrio: deja ver lo de atrás, una franja nítida que cruza y el canto iluminado del lado de la luz.
  `${m("vidrio")} .mk-lz-cara{background:color-mix(in srgb,var(--mk-lz-color,#fff) 34%,transparent);-webkit-backdrop-filter:blur(12px) saturate(1.3);backdrop-filter:blur(12px) saturate(1.3);` +
  "box-shadow:inset 0 0 0 1px color-mix(in srgb,#fff 34%,transparent),inset calc(var(--mk-lz-x0)*-2.5px) calc(var(--mk-lz-y0)*-2.5px) 1px -1px color-mix(in srgb,#fff 85%,transparent)}" +
  // Su brillo no se mezcla con lo de atrás (no se sabe qué hay): es blanco, más o menos fuerte según el texto.
  `${m("vidrio")} .mk-lz-brillo{--mk-lz-claro:color-mix(in srgb,#fff 7%,transparent);mix-blend-mode:normal;translate:calc(var(--mk-lz-bx)*30%) calc(var(--mk-lz-by)*10%);` +
  "background:linear-gradient(118deg,transparent 45%,var(--mk-lz-claro) 48%,color-mix(in srgb,var(--mk-lz-claro) 35%,transparent) 50.5%,transparent 53%,transparent 57%,color-mix(in srgb,var(--mk-lz-claro) 45%,transparent) 58%,transparent 59.5%),radial-gradient(closest-side,color-mix(in srgb,var(--mk-lz-claro) 55%,transparent),transparent 50%)}" +
  // Qué tan fuerte es la franja sale de qué tan oscuro es el texto: fuerte bajo texto oscuro, casi nada bajo texto claro.
  `@supports (color:rgb(from red r g b)){${m("vidrio")} .mk-lz-brillo{--mk-lz-claro:rgb(from currentColor 255 255 255/calc((255 - r)/255*.5))}}` +
  `${m("vidrio")} .mk-lz-sombra{opacity:.5}` +
  // Metal: bandas que recorren la superficie; el lado contrario se oscurece.
  `${m("metal")} .mk-lz-cara{background:linear-gradient(172deg,#fff,rgba(128,128,128,0) 45%,rgba(0,0,0,.55)) var(--mk-lz-color,#cdd1d8);background-blend-mode:overlay}` +
  `${m("metal")} .mk-lz-brillo{translate:calc(var(--mk-lz-bx)*33%) calc(var(--mk-lz-by)*8%);` +
  `background:linear-gradient(104deg,rgba(0,0,0,.4) 26%,transparent 34%,${B} 40%,transparent 46%,rgba(0,0,0,.42) 52%,transparent 58%,color-mix(in srgb,${B} 80%,transparent) 63%,transparent 69%,rgba(0,0,0,.4) 76%)}` +
  `${m("metal")} .mk-lz-brillo::after{content:"";position:absolute;inset:0;mix-blend-mode:screen;background:linear-gradient(104deg,transparent 34%,#3a3a3a 40%,transparent 46%,transparent 58%,#2c2c2c 63%,transparent 69%)}` +
  `${m("metal")} .mk-lz-contacto{opacity:calc((.6 - var(--mk-lz-a)*.07)*var(--mk-luz-fuerza,1))}` +
  // Holográfico: un arcoíris que cambia con el ángulo, y un rayado fino que destella.
  `${m("holografico")} .mk-lz-cara{background:var(--mk-lz-color,#cbc7dc)}` +
  `${m("holografico")} .mk-lz-brillo{translate:calc(var(--mk-lz-bx)*30%) calc(var(--mk-lz-by)*30%);` +
  `background:repeating-linear-gradient(118deg,transparent 0 6px,color-mix(in srgb,${B} 50%,transparent) 6px 7px),repeating-linear-gradient(118deg,#ff4f86,#ffa64d 4.5%,#ffee58 9%,#5df0bd 13.5%,#5aaeff 18%,#b082ff 22.5%,#ff4f86 27%)}` +
  // El vidrio no tiene color propio: su texto es el de la página (sobre una página oscura, claro).
  `${m("vidrio")}{color:var(--mk-lz-texto,inherit)}` +
  // Con movimiento reducido nada se corre ni se agranda (las sombras siguen diciendo la altura).
  "@media (prefers-reduced-motion:reduce){.mk-lz{animation:none}.mk-lz:hover,.mk-lz:active{translate:none!important;scale:none!important}}" +
  // Al imprimir, plano: sin sombras que ensucien el papel.
  "@media print{.mk-lz-sombra,.mk-lz-brillo{display:none}}";

// --- Lo que ya existía (tarjetas, botones y las sombras duras de los estilos), dentro de una `Luz` ---
// Su sombra cae según la luz en reposo: es fija, no se anima. Fuera de una `Luz` nada de esto aplica.
const X = "var(--mk-l0x)";
const Y = "var(--mk-l0y)";
/** Una sombra corrida `n` px al lado contrario de la luz. */
const hacia = (n: number, resto: string) => `calc(${X}*${-n}px) calc(${Y}*${-n}px) ${resto}`;
/** El peso de un id, para ganarle a las reglas de la pieza sin depender del orden en que llega el CSS. */
const P = ":not(#\\#)";
const PP = P + P;
/** El neón emite luz: no recibe sombra. */
const SIN_NEON = ":not([data-mk-estilo=neon] *)";
/** Las formas que traen su propia sombra o un recorte que se la come. */
const FORMA_PROPIA = ":not([data-forma=tecla],[data-forma=ticket],[data-forma=pixel],[data-forma=sello],[data-forma=subrayado])";
/** Dentro de una luz y de un estilo, en cualquier orden. */
const en = (estilo: string) => `:is([data-mk-luz] [data-mk-estilo=${estilo}],[data-mk-estilo=${estilo}] [data-mk-luz],[data-mk-estilo=${estilo}][data-mk-luz])`;
const BOTON_CON_CUERPO = `[data-mk-luz] .mk-btn:is([data-variante=solido],[data-variante=degradado],[data-variante=vidrio])${FORMA_PROPIA}${P}${SIN_NEON}`;
const TECLA = `[data-mk-luz] .mk-btn[data-forma=tecla]${PP}`;
const LADO = "color-mix(in srgb,var(--a),#000 42%)";
/** Un botón apagado no se aprieta. */
const VIVO = ":not(:disabled,[aria-disabled=true])";
const dura = (estilo: string, boton: number, colorBoton: string, tarjeta: number, colorTarjeta: string) =>
  `${en(estilo)} .mk-btn${FORMA_PROPIA}${PP}{box-shadow:${hacia(boton, `0 ${colorBoton}`)}}` +
  // Al apretar llega justo donde estaba su sombra.
  `${en(estilo)} .mk-btn${FORMA_PROPIA}${PP}${VIVO}:active{transform:none;translate:calc(${X}*${-boton}px) calc(${Y}*${-boton}px);box-shadow:none}` +
  `${en(estilo)} .mk-card${PP}{box-shadow:${hacia(tarjeta, `0 ${colorTarjeta}`)}}`;

const CSS_EXISTE =
  `[data-mk-luz] .mk-card[data-variante=elevada]${P}${SIN_NEON}{box-shadow:${hacia(1.5, "2px rgba(0,0,0,.14)")},${hacia(16, "26px -10px rgba(0,0,0,.36)")}}` +
  `[data-mk-luz] .mk-card[data-variante=vidrio]${P}${SIN_NEON}{box-shadow:${hacia(10, "22px -10px rgba(0,0,0,.2)")}}` +
  // Los botones con cuerpo dejan sombra, y al apretarlos se corren hacia ella.
  `${BOTON_CON_CUERPO}{box-shadow:${hacia(1, "1px rgba(0,0,0,.2)")},${hacia(8, "14px -6px rgba(0,0,0,.38)")}}` +
  `${BOTON_CON_CUERPO}${VIVO}:active{translate:calc(${X}*-1.5px) calc(${Y}*-1.5px);box-shadow:${hacia(1, "1px rgba(0,0,0,.3)")}}` +
  // La tecla: su costado cae al lado contrario de la luz, y al apretarla recorre justo ese costado.
  `${TECLA}{transform:none;box-shadow:calc(${X}*-4px) calc(${Y}*-7px) 0 ${LADO},calc(${X}*-10px) calc(${Y}*-14px) 14px -6px rgba(0,0,0,.45)}` +
  // Al apuntarla se levanta un poco más, hacia la luz (el levante de siempre iba en `transform`, que aquí no se usa).
  `@media (hover:hover){${TECLA}${VIVO}:hover{translate:calc(${X}*2px) calc(${Y}*3px)}}` +
  `${TECLA}${VIVO}:active{transform:none;translate:calc(${X}*-4px) calc(${Y}*-7px);box-shadow:0 0 0 ${LADO}}` +
  // El efecto «elevar» (la sombra que aparece al apuntar) también cae al lado contrario de la luz.
  `[data-mk-luz] .mk-card[data-elevar]${P}::after{box-shadow:calc(${X}*-18px) calc(${Y}*-26px) 40px -18px color-mix(in srgb,var(--a) 70%,#000)}` +
  `[data-mk-luz] .mk-btn[data-efecto=elevar]${P}::after{box-shadow:calc(${X}*-9px) calc(${Y}*-14px) 26px -10px var(--a)}` +
  // Con movimiento reducido, apretar no corre nada.
  "@media (prefers-reduced-motion:reduce){[data-mk-luz] .mk-btn:hover,[data-mk-luz] .mk-btn:active{translate:none!important}}" +
  // Las sombras duras de los estilos retro y anime.
  dura("retro", 8, "var(--mk-acento-2)", 11, "var(--mk-acento)") +
  dura("anime", 6.5, "var(--mk-texto)", 9.5, "var(--mk-texto)");

// El título con volumen: hacia dónde cae su espesor (un píxel por capa) y de qué color es su costado.
const CSS_VOLUMEN =
  ".mk-lz-volumen{--mk-lz-vx:calc(var(--mk-l0x,-.45)*-1.15px);--mk-lz-vy:calc(var(--mk-l0y,-.8)*-1.15px);--mk-lz-lado:color-mix(in srgb,currentColor 58%,#000)}" +
  ":where(.mk-lz-volumen){margin:0;font-weight:800;line-height:1.05;letter-spacing:-.01em}";

export const CSS_LUZ = CSS_MATERIA + CSS_EXISTE + CSS_VOLUMEN;
