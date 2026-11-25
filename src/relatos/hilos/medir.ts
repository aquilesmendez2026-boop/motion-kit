// Mide una página para trazar sus hilos: dónde están sus bloques y, dentro de cada uno, lo que el hilo no puede pisar
// (cada texto, las fotos, los botones, las tarjetas). Todo respecto de la página, en px.
import type { BloqueMedido, Caja, Medidas } from "./trazar";

/**
 * El contenedor que de verdad hace scroll (`null`: la ventana). Es el de `relatos/medidas`, copiado: si este archivo,
 * que se baja aparte, lo importara, el empaquetador lo separaría de la página y ella pesaría más al cargar.
 */
export function contenedorScroll(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
    // El `body` tiene scroll propio solo si `html` no se lo pasa a la ventana (con un `overflow` que no es visible).
    if (p === document.body && getComputedStyle(document.documentElement).overflowY === "visible") break;
    const o = getComputedStyle(p).overflowY;
    if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight + 1) return p;
  }
  return null;
}

/** Lo que es decorado de la página y no un bloque. */
const DECORADO = ".mk-hilo,.mk-hilo-viajero,.mk-hilos,.mk-hilos-luz,.mk-hilos-remate,.mk-cielo,.mk-cinta,.mk-estela,[aria-hidden=true]";
/** Lo que cuenta como contenido además de los textos. */
const COSAS = "img,picture,video,canvas,svg,iframe,button,input,select,textarea,[role=img],[data-mk-parte]";
/**
 * El modo fino (para una máscara, como la de las ramas: lo que se ve como contenido, ajustado). Además de lo de siempre:
 * los enlaces y los ítems de lista (el botón entero, la viñeta), lo decorativo con `aria-hidden` que igual se ve (íconos,
 * copias de un carrusel), y cada cosa con fondo o borde propio (una tarjeta sin marca, un chip). Las partes marcadas que
 * envuelven otras cosas o que son texto no cuentan enteras: cuentan sus renglones y lo de adentro.
 */
const COSAS_FINO = `${COSAS},a,li`;
const PARTES_DE_TEXTO = new Set(["linea", "frase", "titulo", "antetitulo", "bajada", "botones", "contenido"]);
/** Lo decorativo de los relatos mismos (en el modo fino, lo `aria-hidden` del contenido sí cuenta). */
const DECORADO_PROPIO = ".mk-hilo,.mk-hilo-viajero,.mk-hilos,.mk-hilos-luz,.mk-hilos-remate,.mk-ramas,.mk-cielo,.mk-cinta,.mk-estela";
const transparente = (c: string) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);
/** Si un elemento tiene fondo o borde propio que se vea. */
function seVeSuCaja(el: Element): boolean {
  const s = getComputedStyle(el);
  if (s.backgroundImage !== "none" || !transparente(s.backgroundColor)) return true;
  return ["Top", "Right", "Bottom", "Left"].some((l) => parseFloat(s.getPropertyValue(`border-${l.toLowerCase()}-width`)) > 0 && s.getPropertyValue(`border-${l.toLowerCase()}-style`) !== "none" && !transparente(s.getPropertyValue(`border-${l.toLowerCase()}-color`)));
}
const TARJETA = '[data-mk-parte="tarjeta"]';
/** Con esto en la página, los bloques quedan en su lugar (sin la entrada de su relato) mientras se mide. */
export const MIDIENDO = "data-mk-midiendo";
/** Lo que entra corrido o achicado y se mide en su lugar: los relatos, sus partes y lo que la página marca con `data-entrada`. */
const ENTRA = ".mk-pagina[data-mk-midiendo] :is(.mk-relato,.mk-relato-in,[data-mk-parte],[data-mk-palabra],[data-entrada])";
/**
 * El CSS que necesita `medirPagina` (quien mida, lo inyecta). Mientras se mide, lo que entra va en su lugar y sin
 * transición (si no, el cambio mismo se animaría y se mediría a medio camino). Al volver, todavía sin transición: así no
 * corre de nuevo. Las animaciones no se tocan (se reiniciarían).
 */
export const CSS_MIDIENDO =
  `${ENTRA}{transition:none!important}` +
  `${ENTRA.replace("[data-mk-midiendo]", "[data-mk-midiendo=si]")}{transform:none!important;translate:none!important;scale:none!important;rotate:none!important}`;

/** Los bloques de la página: los `Relato` y el encabezado; lo que no los contiene y no es decorado cuenta como bloque. */
function bloquesDe(raiz: HTMLElement): HTMLElement[] {
  const bloques: HTMLElement[] = [];
  const anda = (el: HTMLElement) => {
    for (const hijo of el.children) {
      if (!(hijo instanceof HTMLElement) || hijo.matches(DECORADO)) continue;
      if (hijo.matches(".mk-relato,.mk-enc") || !hijo.querySelector(".mk-relato,.mk-enc")) bloques.push(hijo);
      else anda(hijo);
    }
  };
  anda(raiz);
  return bloques;
}

/**
 * El fondo que de verdad se ve en un bloque (el suyo, o el del primero de adentro que lo cubre): su color, el color de
 * su texto y si es una foto. Sobre una foto de fondo el hilo no pasa. Cuenta como foto una imagen puesta por CSS que
 * cubre el bloque (`cover`, `contain` o sin repetir); un motivo chico que se repite (una textura) no lo es, y un
 * degradado tampoco.
 */
function fondoDe(bloque: HTMLElement): { fondo: string; texto: string; foto: boolean } {
  const area = bloque.offsetWidth * bloque.offsetHeight;
  let el: HTMLElement | null = bloque;
  for (let nivel = 0; el && nivel < 4; nivel++) {
    const s = getComputedStyle(el);
    if (s.backgroundImage.includes("url(") && (/cover|contain/.test(s.backgroundSize) || s.backgroundRepeat.includes("no-repeat"))) return { fondo: "", texto: s.color, foto: true };
    if (s.backgroundColor && s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent") return { fondo: s.backgroundColor, texto: s.color, foto: false };
    // Baja al hijo que cubre casi todo el bloque (la franja que trae el fondo), si hay uno.
    el = ([...el.children].find((h) => h instanceof HTMLElement && h.offsetWidth * h.offsetHeight >= area * 0.9) as HTMLElement | undefined) ?? null;
  }
  return { fondo: "", texto: getComputedStyle(bloque).color, foto: false };
}

/**
 * Si el scroll que mueve las animaciones atadas al scroll de la página (`scroll(nearest)`: el contenedor de scroll más
 * cercano según el CSS, que puede ser uno con `overflow: hidden`) es uno que la persona puede bajar. En una vista previa
 * achicada dentro de un `overflow: hidden` no lo es: ahí el hilo no se dibujaría nunca y va entero y quieto.
 */
function scrollQueBaja(pagina: HTMLElement): boolean {
  for (let p = pagina.parentElement; p && p !== document.documentElement; p = p.parentElement) {
    if (p === document.body && getComputedStyle(document.documentElement).overflowY === "visible") break;
    const s = getComputedStyle(p);
    const crea = (o: string) => o === "auto" || o === "scroll" || o === "hidden";
    if (!crea(s.overflowX) && !crea(s.overflowY)) continue;
    return (s.overflowY === "auto" || s.overflowY === "scroll") && p.scrollHeight > p.clientHeight + 1;
  }
  return true;
}

/** Hasta qué profundidad (dentro de cada bloque) se buscan cosas pegadas: los relatos pegan el bloque o su interior. */
const HONDO_PEGADO = 3;
function pegadoEn(el: Element, hondo: number): boolean {
  if (!(el instanceof HTMLElement) || el.matches(DECORADO)) return false;
  if (getComputedStyle(el).position === "sticky") return true;
  return hondo > 0 && [...el.children].some((h) => pegadoEn(h, hondo - 1));
}

/**
 * Las medidas de la página. Los bloques se miden en su lugar: mientras dura la medición se quitan los corrimientos de
 * la entrada de sus relatos (y de lo que la página marca con `data-entrada`), que los corren o los achican cuando
 * todavía no se ven; no se alcanza a pintar. Después vuelven a su lugar sin transición: así una transición no corre de
 * nuevo (una tarjeta levantada no baja y sube) cada vez que se mide.
 * Todo queda en px de la página, aunque la página esté achicada (`transform: scale`, como en una vista previa).
 */
export function medirPagina(pagina: HTMLElement, o: { fino?: boolean } = {}): { medidas: Medidas; bloques: HTMLElement[]; baja: boolean } {
  const fino = o.fino === true;
  const decorado = fino ? DECORADO_PROPIO : DECORADO;
  const scroll = contenedorScroll(pagina);
  const vista = scroll ? scroll.clientHeight : window.innerHeight;
  const recorrido = scroll ? scroll.scrollHeight - scroll.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
  const baja = scrollQueBaja(pagina);
  pagina.setAttribute(MIDIENDO, "si");
  try {
    const p = pagina.getBoundingClientRect();
    // Cuánto está achicada (o agrandada) la página: las cajas que entrega el navegador vienen con eso.
    const escala = pagina.offsetWidth > 0 && p.width > 0 ? p.width / pagina.offsetWidth : 1;
    const arriba = (scroll ? p.top - scroll.getBoundingClientRect().top + scroll.scrollTop : p.top + window.scrollY) / escala;
    const cajaDe = (r: DOMRect): Caja => ({ izquierda: (r.left - p.left) / escala, arriba: (r.top - p.top) / escala, ancho: r.width / escala, alto: r.height / escala });
    const elementos = bloquesDe(pagina);
    const medidos = elementos.flatMap((b): BloqueMedido[] => {
      const caja = cajaDe(b.getBoundingClientRect());
      if (!(caja.ancho > 0 && caja.alto > 0)) return [];
      const { fondo, texto, foto } = fondoDe(b);
      // Un bloque con algo pegado (`sticky`) mueve su contenido al bajar: no hay por dónde pasar con seguridad. Y
      // sobre uno con una foto de fondo no se pasa. En los dos casos el bloque entero cuenta como contenido.
      // En el modo fino, también uno con una tira que se desliza al bajar (sus fotos no están donde se midieron).
      if (foto || pegadoEn(b, HONDO_PEGADO) || (fino && b.querySelector("[data-mk-tira]"))) return [{ caja, cosas: [caja], tarjetas: [], fondo, texto, tira: false }];
      // Las tarjetas de más afuera.
      const tarjetas = [...b.querySelectorAll<HTMLElement>(TARJETA)].filter((t) => !t.parentElement?.closest(TARJETA));
      const cosas: Caja[] = [];
      const suma = (r: DOMRect) => r.width > 0 && r.height > 0 && cosas.push(cajaDe(r));
      const textos = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
      const rango = document.createRange();
      for (let n = textos.nextNode(); n; n = textos.nextNode()) {
        const padre = n.parentElement;
        if (!n.textContent?.trim() || !padre || padre.closest(`${TARJETA},${decorado}`)) continue;
        rango.selectNodeContents(n);
        // Una caja por renglón: la de todo el texto taparía el espacio que deja un renglón corto.
        for (const r of rango.getClientRects()) suma(r);
      }
      if (!fino) {
        for (const e of b.querySelectorAll<HTMLElement>(COSAS)) if (!e.closest(`${TARJETA},${DECORADO}`)) suma(e.getBoundingClientRect());
      } else {
        const area = caja.ancho * caja.alto;
        for (const e of b.querySelectorAll<HTMLElement>(COSAS_FINO)) {
          if (e.closest(`${TARJETA},${decorado}`)) continue;
          const parte = e.getAttribute("data-mk-parte");
          if (parte !== null && (PARTES_DE_TEXTO.has(parte) || e.querySelector(COSAS_FINO))) continue;
          suma(e.getBoundingClientRect());
        }
        // Lo que tiene fondo o borde propio y no es el bloque entero (una tarjeta sin marca, un chip).
        for (const e of b.querySelectorAll<HTMLElement>("*")) {
          if (e.closest(`${TARJETA},${decorado}`) || !seVeSuCaja(e)) continue;
          const r = e.getBoundingClientRect();
          if ((r.width * r.height) / (escala * escala) < area * 0.5) suma(r);
        }
      }
      return [{ caja, cosas, tarjetas: tarjetas.map((t) => cajaDe(t.getBoundingClientRect())).filter((c) => c.ancho > 0 && c.alto > 0), fondo, texto, tira: Boolean(b.querySelector("[data-mk-tira]")) }];
    });
    const r = pagina.querySelector(".mk-hilos-remate");
    const remate = r ? cajaDe(r.getBoundingClientRect()) : null;
    return { medidas: { ancho: pagina.offsetWidth, alto: pagina.offsetHeight, vista, recorrido, arriba, bloques: medidos, remate: remate && remate.alto > 0 ? { arriba: remate.arriba, alto: remate.alto } : null }, bloques: elementos, baja };
  } finally {
    // De vuelta a su lugar, todavía sin transición; y recién después se devuelven las transiciones.
    pagina.setAttribute(MIDIENDO, "volviendo");
    void pagina.offsetHeight;
    pagina.removeAttribute(MIDIENDO);
  }
}
