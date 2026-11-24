// Lo común de los fondos que se dibujan en un lienzo 2D (objetos que caen, constelación): tamaño nítido, pausa fuera de
// la vista y con la pestaña oculta, los colores del estilo y un bucle que corre solo mientras hace falta. Sin React.
import { COLOR } from "./tokens";

/**
 * El lienzo llena su capa. Los colores se piden por CSS (así el navegador resuelve las variables del estilo) y se leen
 * de vuelta. La transición de 1 ms no se alcanza a ver (el lienzo no pinta con esas propiedades): sirve para que el
 * navegador avise (`transitionend`) cuando el estilo cambia de color, y entonces se vuelve a dibujar. Por si el sitio
 * apaga las transiciones, también se mira el `Estilo` que lo envuelve.
 */
export const CSS_LIENZO = `.mk-lienzo{position:absolute;inset:0;width:100%;height:100%;display:block;color:${COLOR.acento};outline-color:${COLOR.acentoClaro};transition:color 1ms,outline-color 1ms}`;

export interface Lienzo {
  ctx: CanvasRenderingContext2D;
  /** Tamaño en px de CSS: lo que se dibuja ya viene escalado a la densidad de la pantalla. */
  ancho: number;
  alto: number;
  /** El acento del estilo y su versión clara, ya resueltos. */
  color: string;
  claro: string;
  /** Pide dibujar: sigue corriendo mientras `paso` devuelva `true` y el lienzo esté a la vista. */
  correr(): void;
  destruir(): void;
}

/**
 * Prepara el lienzo. `paso(dt)` avanza `dt` segundos y dibuja; devuelve si hay que seguir. `alCambiar` avisa de un
 * tamaño nuevo (también del primero), antes de dibujar. El lienzo deja su estado en `data-estado`: «vivo» mientras
 * corre, «quieto» cuando ya no queda nada por mover y «pausa» si se detuvo con algo pendiente (fuera de la vista, la
 * pestaña oculta o antes de empezar). `densidadMaxima` limita los píxeles reales por px de CSS (un lienzo grande pesa).
 * Sin lienzo 2D devuelve `null`.
 */
export function crearLienzo(cv: HTMLCanvasElement, paso: (dt: number, l: Lienzo) => boolean, alCambiar?: (l: Lienzo) => void, densidadMaxima = 1.5): Lienzo | null {
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  let cuadro = 0;
  let antes = 0;
  let vivo = true;
  let visible = typeof IntersectionObserver === "undefined";

  const estado = (e: "vivo" | "pausa" | "quieto") => cv.setAttribute("data-estado", e);
  const aLaVista = () => visible && !document.hidden;
  const pedir = () => {
    if (cuadro || !vivo) return;
    cuadro = requestAnimationFrame(bucle);
    estado("vivo");
  };
  const parar = (pendiente: boolean) => {
    antes = 0;
    estado(pendiente ? "pausa" : "quieto");
  };
  const bucle = (t: number) => {
    cuadro = 0;
    const dt = antes ? Math.min(0.05, Math.max(0, (t - antes) / 1000)) : 0;
    antes = t;
    const seguir = paso(dt, l);
    if (seguir && aLaVista()) pedir();
    else parar(seguir);
  };
  /** Dibuja ya (sin esperar al próximo cuadro, para que un cambio de tamaño no deje el lienzo en blanco) y sigue si hace falta. */
  const dibujar = () => {
    if (!vivo) return;
    const seguir = paso(0, l);
    if (seguir && aLaVista()) pedir();
    else if (!cuadro) parar(seguir);
  };
  const colores = () => {
    const cs = getComputedStyle(cv);
    l.color = cs.color;
    l.claro = cs.outlineColor || cs.color;
  };
  const medir = () => {
    const densidad = Math.min(window.devicePixelRatio || 1, densidadMaxima);
    l.ancho = cv.clientWidth;
    l.alto = cv.clientHeight;
    const w = Math.round(l.ancho * densidad);
    const h = Math.round(l.alto * densidad);
    // Cambiar el tamaño borra el lienzo: solo si de verdad cambió.
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    ctx.setTransform(densidad, 0, 0, densidad, 0, 0);
  };
  const alMedir = () => {
    medir();
    colores();
    alCambiar?.(l);
    dibujar();
  };

  const l: Lienzo = {
    ctx,
    ancho: 0,
    alto: 0,
    color: "",
    claro: "",
    correr: () => aLaVista() && pedir(),
    destruir: () => {
      vivo = false;
      cancelAnimationFrame(cuadro);
      vista?.disconnect();
      tamano?.disconnect();
      estilo?.disconnect();
      cv.removeEventListener("transitionend", alColor);
      document.removeEventListener("visibilitychange", alVolver);
      // Se suelta la memoria del lienzo ahora: algunos navegadores (Safari en el teléfono) la liberan tarde y tienen tope.
      cv.width = 0;
      cv.height = 0;
    },
  };

  /** Si de verdad cambió algún color, se vuelve a dibujar. */
  const alColor = () => {
    const antes = l.color + l.claro;
    colores();
    if (l.color + l.claro !== antes) dibujar();
  };
  const conEstilo = typeof MutationObserver !== "undefined" ? cv.closest(".mk-estilo") : null;
  const estilo = conEstilo ? new MutationObserver(alColor) : null;
  estilo?.observe(conEstilo!, { attributes: true, attributeFilter: ["class", "style", "data-mk-estilo"] });
  const alVolver = () => l.correr();
  const vista =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          l.correr();
        })
      : null;
  const tamano = typeof ResizeObserver !== "undefined" ? new ResizeObserver(alMedir) : null;

  estado("pausa");
  cv.addEventListener("transitionend", alColor);
  document.addEventListener("visibilitychange", alVolver);
  vista?.observe(cv);
  // El observador avisa del primer tamaño; sin él, se mide una vez.
  if (tamano) tamano.observe(cv);
  else alMedir();
  return l;
}

/**
 * ¿El fondo debe quedarse quieto? Sí con «reducir movimiento» y dentro de algo en nivel liviano o quieto. `alCambiar`
 * avisa si eso cambia después (el encabezado baja de nivel cuando el teléfono no da abasto). Devuelve cómo preguntar y
 * cómo dejar de escuchar.
 */
export function seguirQuietud(el: HTMLElement, alCambiar: () => void): { quieta: () => boolean; soltar: () => void } {
  const reducido = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  const conNivel = el.closest("[data-nivel]");
  const nivel = conNivel && typeof MutationObserver !== "undefined" ? new MutationObserver(alCambiar) : null;
  if (conNivel) nivel?.observe(conNivel, { attributes: true, attributeFilter: ["data-nivel"] });
  reducido?.addEventListener?.("change", alCambiar);
  return {
    quieta: () => Boolean(reducido?.matches) || el.closest("[data-nivel=liviano],[data-nivel=quieto]") !== null,
    soltar: () => {
      nivel?.disconnect();
      reducido?.removeEventListener?.("change", alCambiar);
    },
  };
}

/** Dónde escuchar el puntero: el encabezado (o lo que envuelve a la capa), porque la capa del fondo no recibe toques. */
export const zonaPuntero = (cv: HTMLElement): HTMLElement | null => cv.closest<HTMLElement>(".mk-enc") ?? cv.parentElement?.parentElement ?? null;

/** El punto del puntero dentro del lienzo (px de CSS) y cuándo fue. */
export function puntoEn(cv: HTMLElement, ev: PointerEvent): { x: number; y: number; t: number } {
  const r = cv.getBoundingClientRect();
  return { x: ev.clientX - r.left, y: ev.clientY - r.top, t: ev.timeStamp };
}
