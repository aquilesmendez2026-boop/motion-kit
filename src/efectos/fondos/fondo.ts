// Lo común de los fondos vivos de lienzo (bandada, luciérnagas, corrientes, gotas, relieve): corren a 30 dibujos por
// segundo, siguen al dedo, y con «reducir movimiento» o en nivel liviano dejan un solo cuadro quieto. Sin React.
import { crearLienzo, puntoEn, seguirQuietud, zonaPuntero, type Lienzo } from "../lienzo";

export interface Dedo {
  x: number;
  y: number;
}

/** Lo que pone cada fondo. El resto (tamaño, pausa, quietud, dedo y limpieza) es común. */
export interface EscenaFondo {
  /** Un tamaño nuevo (también el primero) o un cambio de quietud, antes de dibujar. `antes` es el tamaño anterior (0 la primera vez). */
  medir(l: Lienzo, quieta: boolean, antes: { ancho: number; alto: number }): void;
  /** Avanza `dt` segundos. Solo se llama mientras corre. */
  mover(dt: number, l: Lienzo, dedo: Dedo | null): void;
  /** Dibuja el cuadro. Con `quieta`, la versión de un solo cuadro (sin dedo). */
  dibujar(l: Lienzo, quieta: boolean, dedo: Dedo | null): void;
  /** El dedo se movió o tocó (`toque`), a los `t` ms. Solo se llama mientras corre. */
  alDedo?(dedo: Dedo, toque: boolean, t: number): void;
}

/** Se mueven lento: con 30 dibujos por segundo alcanza, y es la mitad del trabajo (y de la batería). */
const CADA = 1 / 30;

/** De 0 a 1: cuánto se ve algo según lo cerca que está del borde (así no aparece de golpe al dar la vuelta). */
export const bordeSuave = (x: number, y: number, ancho: number, alto: number, margen = 26): number =>
  Math.max(0, Math.min(1, x / margen, (ancho - x) / margen, y / margen, (alto - y) / margen));

/**
 * Deja la lista con `n` elementos: saca los que sobran (la versión quieta lleva menos) y repone los que faltan (al
 * volver a correr), tomándolos de `crear(n)`.
 */
export function ajustarCantidad<T>(lista: T[], n: number, crear: (n: number) => T[]): T[] {
  if (lista.length > n) lista.length = Math.max(0, n);
  else if (lista.length < n) lista.push(...crear(n).slice(lista.length));
  return lista;
}

/** Monta un fondo en su lienzo. Devuelve cómo desmontarlo (suelta bucles, oyentes y la memoria del lienzo). */
export function montarFondo(cv: HTMLCanvasElement, escena: EscenaFondo): () => void {
  let ancho = 0;
  let alto = 0;
  let quieta = false;
  let dedo: Dedo | null = null;
  let pendiente = 0;

  const paso = (dt: number, l: Lienzo) => {
    if (!ancho || !alto) return false;
    if (!quieta && dt > 0) {
      // Entre un dibujo y otro se junta el tiempo: los cuadros de más no hacen nada.
      pendiente += dt;
      if (pendiente < CADA - 0.004) return true;
      escena.mover(pendiente, l, dedo);
      pendiente = 0;
    }
    escena.dibujar(l, quieta, quieta ? null : dedo);
    return !quieta;
  };
  const alCambiar = (l: Lienzo) => {
    if (!l.ancho || !l.alto) return;
    quieta = quietud.quieta();
    escena.medir(l, quieta, { ancho, alto });
    ancho = l.ancho;
    alto = l.alto;
  };
  const quietud = seguirQuietud(cv, () => {
    const ahora = quietud.quieta();
    if (lienzo && ancho && alto && ahora !== quieta) {
      quieta = ahora;
      escena.medir(lienzo, quieta, { ancho, alto });
    }
    lienzo?.correr();
  });
  const lienzo = crearLienzo(cv, paso, alCambiar);
  if (!lienzo) return quietud.soltar;

  const zona = zonaPuntero(cv);
  const seguir = (ev: PointerEvent, toque: boolean) => {
    const p = puntoEn(cv, ev);
    dedo = { x: p.x, y: p.y };
    if (!quieta && ancho && alto) escena.alDedo?.(dedo, toque, p.t);
  };
  const mover = (ev: PointerEvent) => seguir(ev, false);
  const tocar = (ev: PointerEvent) => seguir(ev, true);
  const salir = () => {
    dedo = null;
  };
  zona?.addEventListener("pointermove", mover, { passive: true });
  if (escena.alDedo) zona?.addEventListener("pointerdown", tocar, { passive: true });
  zona?.addEventListener("pointerleave", salir);
  zona?.addEventListener("pointerup", salir);
  zona?.addEventListener("pointercancel", salir);

  return () => {
    zona?.removeEventListener("pointermove", mover);
    zona?.removeEventListener("pointerdown", tocar);
    zona?.removeEventListener("pointerleave", salir);
    zona?.removeEventListener("pointerup", salir);
    zona?.removeEventListener("pointercancel", salir);
    quietud.soltar();
    lienzo.destruir();
  };
}
