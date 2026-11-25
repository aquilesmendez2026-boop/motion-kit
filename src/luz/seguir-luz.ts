// El seguidor de la luz: junta lo que la mueve (el cursor o el dedo, el scroll, la inclinación del teléfono) y deja
// la luz de ahora en `--mk-lx` y `--mk-ly` de la raíz. Sin React. Solo trabaja mientras algo cambia: al llegar, duerme.
import { inclinacionEnPantalla, luzAhora, type Punto } from "./calculo-luz";

/** Lo que puede mover a la luz. «hora» no la mueve cuadro a cuadro: cambia su reposo (lo ve `Luz`). */
export type FuenteLuz = "puntero" | "scroll" | "inclinacion" | "hora";
export const FUENTES: readonly FuenteLuz[] = ["puntero", "scroll", "inclinacion", "hora"];

/** Cuánto se acerca a su lugar en cada cuadro. */
const SUAVE = 0.14;
const acotar = (n: number) => Math.max(-1, Math.min(1, n));

// --- El permiso de la inclinación (iPhone lo pide; lo demás no) ---
const AVISO = "mk-luz-inclinacion";
type ConPermiso = { requestPermission?: () => Promise<"granted" | "denied"> };
const sensor = () => (typeof window !== "undefined" ? (window.DeviceOrientationEvent as unknown as ConPermiso | undefined) : undefined);
let concedido = false;

/** ¿Este teléfono exige pedir permiso para leer su inclinación, y todavía no se dio? */
export const hayQuePedirInclinacion = () => typeof sensor()?.requestPermission === "function" && !concedido;

/**
 * Pide el permiso de la inclinación. Hay que llamarla desde un toque de la persona (un botón). Devuelve si quedó
 * permitido; donde no hace falta permiso (Android, escritorio), `true`, aunque el aparato no tenga sensor.
 */
export async function pedirInclinacion(): Promise<boolean> {
  const s = sensor();
  if (!s) return false;
  if (typeof s.requestPermission !== "function") return true;
  try {
    concedido = (await s.requestPermission()) === "granted";
  } catch {
    concedido = false;
  }
  if (concedido) window.dispatchEvent(new Event(AVISO));
  return concedido;
}

export interface Seguidor {
  /** Deja de escuchar y devuelve la luz a su reposo. */
  soltar(): void;
  /** El reposo o el rango cambiaron: se vuelve a escribir. */
  refrescar(): void;
}

/** Sigue lo que diga `sigue` y escribe la luz en `raiz`. `reposo` y `rango` se leen cada vez (pueden cambiar). */
export function seguirLuz(raiz: HTMLElement, o: { sigue: ReadonlySet<FuenteLuz>; reposo: () => Punto; rango: () => number }): Seguidor {
  const puntero = { x: 0, y: 0 };
  const inclinada = { x: 0, y: 0 };
  let bajada = 0;
  const meta = { x: 0, y: 0 };
  const act = { x: 0, y: 0 };
  let cuadro = 0;
  let visible = true;
  const limpiar: (() => void)[] = [];

  const escribir = () => {
    const l = luzAhora(o.reposo(), act, o.rango());
    raiz.style.setProperty("--mk-lx", String(l.x));
    raiz.style.setProperty("--mk-ly", String(l.y));
  };
  const paso = () => {
    cuadro = 0;
    act.x += (meta.x - act.x) * SUAVE;
    act.y += (meta.y - act.y) * SUAVE;
    const llego = Math.abs(meta.x - act.x) < 0.004 && Math.abs(meta.y - act.y) < 0.004;
    if (llego) Object.assign(act, meta);
    escribir();
    if (!llego) pedir();
  };
  const pedir = () => {
    if (!cuadro && visible && !document.hidden) cuadro = requestAnimationFrame(paso);
  };
  const juntar = () => {
    meta.x = acotar(puntero.x + inclinada.x);
    meta.y = acotar(puntero.y + inclinada.y + bajada);
    if (meta.x !== act.x || meta.y !== act.y) pedir();
  };
  const escuchar = (tipo: string, f: (e: never) => void, captura = false) => {
    window.addEventListener(tipo, f as EventListener, { passive: true, capture: captura });
    limpiar.push(() => window.removeEventListener(tipo, f as EventListener, { capture: captura }));
  };

  if (o.sigue.has("puntero")) {
    // El cursor (o el dedo) contra la pantalla: (0, 0) al centro, ±1 en los bordes.
    escuchar("pointermove", (e: PointerEvent) => {
      puntero.x = acotar((e.clientX / Math.max(1, innerWidth) - 0.5) * 2);
      puntero.y = acotar((e.clientY / Math.max(1, innerHeight) - 0.5) * 2);
      juntar();
    });
    // Al salir de la ventana, o al levantar el dedo, la luz vuelve a su lugar.
    const volver = () => {
      puntero.x = puntero.y = 0;
      juntar();
    };
    escuchar("pointerout", (e: PointerEvent) => e.relatedTarget === null && volver());
    escuchar("pointerup", (e: PointerEvent) => e.pointerType !== "mouse" && volver());
    escuchar("pointercancel", volver);
  }
  // Donde el navegador ata animaciones al scroll, cada superficie sabe sola por dónde va en la pantalla (lo hace el
  // CSS de `Materia`, sin código). Donde no, se mueve la luz entera según por dónde va la raíz.
  if (o.sigue.has("scroll") && !(typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()"))) {
    // Por dónde va la raíz en la pantalla: 0 cuando está al centro; hacia 1 cuando sube y sale por arriba.
    const medir = () => {
      const c = raiz.getBoundingClientRect();
      bajada = acotar((innerHeight / 2 - (c.top + c.height / 2)) / Math.max(1, innerHeight / 2 + c.height / 2));
      juntar();
    };
    // Con captura: también cuando lo que se desplaza es un contenedor de la página y no la ventana.
    escuchar("scroll", medir, true);
    escuchar("resize", medir);
    medir();
  }
  if (o.sigue.has("inclinacion") && sensor()) {
    const alInclinar = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      Object.assign(inclinada, inclinacionEnPantalla(e.gamma, e.beta, screen.orientation?.angle ?? 0));
      juntar();
    };
    const partir = () => escuchar("deviceorientation", alInclinar);
    if (hayQuePedirInclinacion()) {
      // Se espera a que la página pida el permiso con su botón.
      const alConceder = () => partir();
      window.addEventListener(AVISO, alConceder, { once: true });
      limpiar.push(() => window.removeEventListener(AVISO, alConceder));
    } else partir();
  }

  // Fuera de la vista o con la pestaña oculta no trabaja; al volver, sigue.
  if (typeof IntersectionObserver !== "undefined") {
    const ojo = new IntersectionObserver((e) => {
      visible = e[e.length - 1]?.isIntersecting ?? true;
      if (visible && (meta.x !== act.x || meta.y !== act.y)) pedir();
    });
    ojo.observe(raiz);
    limpiar.push(() => ojo.disconnect());
  }
  const alVolver = () => !document.hidden && (meta.x !== act.x || meta.y !== act.y) && pedir();
  document.addEventListener("visibilitychange", alVolver);
  limpiar.push(() => document.removeEventListener("visibilitychange", alVolver));

  // Parte donde le toca, sin deslizarse desde el reposo.
  Object.assign(act, meta);
  cancelAnimationFrame(cuadro);
  cuadro = 0;
  escribir();

  return {
    soltar() {
      cancelAnimationFrame(cuadro);
      for (const f of limpiar) f();
      raiz.style.setProperty("--mk-lx", "var(--mk-l0x)");
      raiz.style.setProperty("--mk-ly", "var(--mk-l0y)");
    },
    refrescar: escribir,
  };
}
