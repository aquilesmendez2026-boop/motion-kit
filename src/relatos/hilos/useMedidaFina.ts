// La medición fina de una página (`medirPagina(…, { fino: true })`), puesta al día con los mismos avisos que los hilos:
// cuando cambia el tamaño de la página o de sus bloques, su orden, su contenido, el estilo o cargan las fuentes. Varios
// avisos seguidos, una sola medición (cuando se calman). La usan las ramas y la esfera.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useStyles } from "../../utils/styles";
import { contenedorScroll, CSS_MIDIENDO, medirPagina } from "./medir";
import type { Medidas } from "./trazar";

export interface MedidaFina {
  medidas: Medidas;
  /** Los elementos de los bloques, en el orden de `medidas.bloques` (para ver cuánto van corridos mientras entran). */
  elementos: HTMLElement[];
  /** Si el scroll que mueve la página la puede bajar (en una vista previa achicada, no). */
  baja: boolean;
}

/**
 * La medida fina de la página (o `null` antes de medir). `claves`: lo que, al cambiar, obliga a medir al tiro. `marcos`:
 * pedir también las cosas a rodear de cada bloque (la esfera).
 */
export function useMedidaFina(pagina: RefObject<HTMLElement | null>, claves: unknown[], o: { marcos?: boolean } = {}): MedidaFina | null {
  const marcos = o.marcos === true;
  useStyles("hilos-medir", CSS_MIDIENDO);
  const [medida, setMedida] = useState<MedidaFina | null>(null);
  const medir = useRef<() => void>(() => {});
  medir.current = () => {
    const el = pagina.current;
    if (!el) return;
    const { medidas, medidos: bloques, baja } = medirPagina(el, { fino: true, marcos });
    const nueva = { medidas, baja: baja && medidas.recorrido > 0 };
    setMedida((vieja) => (vieja && JSON.stringify([vieja.medidas, vieja.baja]) === JSON.stringify([nueva.medidas, nueva.baja]) && vieja.elementos.length === bloques.length && vieja.elementos.every((e, i) => e === bloques[i]) ? vieja : { ...nueva, elementos: bloques }));
  };
  // Se mide al tiro al montar y cuando cambian las claves (las decide quien llama).
  useLayoutEffect(() => medir.current(), claves);
  useEffect(() => {
    const el = pagina.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let espera = 0;
    let vivo = true;
    const pedir = () => {
      // Lo que llega después de desmontar (las fuentes, por ejemplo) no mide.
      if (!vivo) return;
      clearTimeout(espera);
      espera = window.setTimeout(() => vivo && medir.current(), 180);
    };
    const ro = new ResizeObserver(pedir);
    ro.observe(el);
    const propio = (n: Node) => n instanceof Element && n.closest(".mk-ramas,.mk-esfera-capa") !== null;
    for (const b of el.children) if (!propio(b)) ro.observe(b);
    const caja = contenedorScroll(el);
    if (caja) ro.observe(caja);
    const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver((cambios) => {
      if (cambios.some((c) => c.type === "attributes" || (!propio(c.target) && [...c.addedNodes, ...c.removedNodes].some((n) => !propio(n))))) pedir();
    });
    mo?.observe(el, { childList: true, subtree: true, characterData: true });
    const estilo = el.closest("[data-mk-estilo]");
    if (estilo) mo?.observe(estilo, { attributes: true, attributeFilter: ["data-mk-estilo", "style", "class"] });
    document.fonts?.ready.then(pedir, () => {});
    // Algo dentro de la página que hace scroll (una fila que se desliza de lado) mueve su contenido: se vuelve a medir.
    const alDeslizar = (e: Event) => e.target instanceof Element && e.target !== el && el.contains(e.target) && pedir();
    el.addEventListener("scroll", alDeslizar, { capture: true, passive: true });
    return () => {
      vivo = false;
      el.removeEventListener("scroll", alDeslizar, { capture: true });
      clearTimeout(espera);
      ro.disconnect();
      mo?.disconnect();
    };
  }, [pagina]);
  return medida;
}
