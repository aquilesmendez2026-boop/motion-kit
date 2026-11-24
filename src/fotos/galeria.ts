// Lienzo itinerante de la galería: un solo lienzo WebGL para todas las galerías de la página. Se mete dentro del marco
// de la foto que se toca (así la sigue al bajar, respeta lo que tenga encima y gira con ella), dibuja ondas mientras el
// dedo o el cursor se mueve y se va cuando las ondas se apagan. Se carga aparte. Si no se puede (sin WebGL, foto sin
// permiso), la foto queda como siempre.
import { origenPermitido } from "./calculos";
import { crearMotor, type Motor, type Textura } from "./motor";

let lienzo: HTMLCanvasElement | null = null;
let motor: Motor | null = null;
let textura: Textura | null = null;
let actual: HTMLImageElement | null = null;
let sinWebgl = false;
let turno = 0;
let adios = 0;
let quitarOyentes: (() => void) | null = null;
/** Fotos que el motor no pudo usar (su servidor no dio permiso): no se vuelven a pedir en cada pasada. */
const sinPermiso = new Set<string>();

/** Lo que tardan las ondas en apagarse antes de retirar el lienzo. */
const ESPERA = 1700;
/** Las galerías que usan este lienzo se reconocen por su grilla. */
const GALERIAS = ".mk-m-mosaico-grilla";

function retirar() {
  window.clearTimeout(adios);
  quitarOyentes?.();
  quitarOyentes = null;
  actual = null;
  turno++;
  // La foto anterior se suelta aquí, para no volver a subirla si el lienzo cambia de tamaño con la próxima.
  if (textura && motor) motor.soltar(textura);
  textura = null;
  lienzo?.removeAttribute("data-lista");
  lienzo?.remove();
}

/** Destruye el motor y suelta su contexto WebGL (los navegadores permiten pocos a la vez). */
function apagar() {
  retirar();
  motor?.destruir();
  motor = null;
  lienzo = null;
}

/**
 * Suelta la foto que tenía el lienzo. Con `dentroDe` (una galería que se desmonta), solo si la foto era de ahí. Si ya
 * no queda ninguna galería en la página, también se suelta el WebGL.
 */
export function soltarFoto(dentroDe?: Element): void {
  if (!dentroDe || (actual && dentroDe.contains(actual))) retirar();
  if (motor && !document.querySelector(GALERIAS)) apagar();
}

/** Pone el lienzo justo encima de la foto, dentro de su marco. */
function calzar(c: HTMLCanvasElement, img: HTMLImageElement, opacidad: string) {
  // Todo en línea: no depende de ningún CSS.
  c.style.cssText =
    `position:absolute;inset:auto;left:${img.offsetLeft}px;top:${img.offsetTop}px;width:${img.offsetWidth}px;height:${img.offsetHeight}px;` +
    `opacity:${opacidad};pointer-events:none;background:transparent;translate:none;scale:none;display:block`;
}

/**
 * El lienzo pasa a esta foto y hace ondas donde se mueve el dedo o el cursor. `desde` es el punto del primer toque
 * (coordenadas de la ventana), para que la primera onda salga de ahí.
 */
export async function tomarFoto(img: HTMLImageElement, origenes: string[], desde?: { x: number; y: number }): Promise<void> {
  // La foto puede haber salido de la página mientras bajaba este archivo.
  if (sinWebgl || !img.isConnected) return;
  if (img === actual) {
    window.clearTimeout(adios);
    return;
  }
  const src = img.currentSrc || img.src;
  const marco = img.parentElement;
  if (!marco || sinPermiso.has(src) || !origenPermitido(src, origenes, location.origin)) return;
  retirar();
  if (!lienzo) {
    lienzo = document.createElement("canvas");
    lienzo.className = "mk-foto-viva";
    lienzo.setAttribute("aria-hidden", "true");
  }
  calzar(lienzo, img, "0");
  marco.appendChild(lienzo);
  if (!motor) {
    const nuevo = crearMotor(lienzo);
    if (!nuevo) {
      sinWebgl = true;
      lienzo.remove();
      lienzo = null;
      return;
    }
    motor = nuevo;
    nuevo.alPerder(() => {
      sinWebgl = true;
      apagar();
    });
  }
  const m = motor;
  const c = lienzo;
  actual = img;
  const mio = ++turno;
  m.ajustar();
  const t = await m.cargar(src);
  if (mio !== turno || motor !== m || !img.isConnected) {
    if (t) m.soltar(t);
    if (mio === turno) retirar();
    return;
  }
  if (!t) {
    sinPermiso.add(src);
    return retirar();
  }
  textura = t;
  // Aparece recién cuando ya dibujó la foto.
  m.alPintar(() => {
    if (mio !== turno) return;
    c.style.opacity = "1";
    c.setAttribute("data-lista", "");
  });
  m.mostrar(t);

  let ultima = 0;
  const onda = (x: number, y: number) => {
    const r = img.getBoundingClientRect();
    if (r.width && r.height) m.ondas((x - r.left) / r.width, (y - r.top) / r.height);
  };
  const mover = (e: PointerEvent) => {
    window.clearTimeout(adios);
    const ahora = performance.now();
    if (ahora - ultima < 90) return;
    ultima = ahora;
    onda(e.clientX, e.clientY);
  };
  const irse = () => {
    window.clearTimeout(adios);
    adios = window.setTimeout(() => mio === turno && retirar(), ESPERA);
  };
  const subir = (e: PointerEvent) => e.pointerType !== "mouse" && irse();
  img.addEventListener("pointermove", mover);
  img.addEventListener("pointerdown", mover);
  img.addEventListener("pointerleave", irse);
  img.addEventListener("pointercancel", irse);
  img.addEventListener("pointerup", subir);
  // Si la foto cambia de tamaño (la ventana se achica, el teléfono gira), el lienzo la sigue. El motor vuelve a subir
  // la foto a su tamaño nuevo por su cuenta, cuando el cambio se detiene.
  const tamano = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => calzar(c, img, c.style.opacity)) : null;
  tamano?.observe(img);
  quitarOyentes = () => {
    img.removeEventListener("pointermove", mover);
    img.removeEventListener("pointerdown", mover);
    img.removeEventListener("pointerleave", irse);
    img.removeEventListener("pointercancel", irse);
    img.removeEventListener("pointerup", subir);
    tamano?.disconnect();
  };
  if (desde) onda(desde.x, desde.y);
}
