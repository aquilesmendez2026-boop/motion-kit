// Cortar el texto de un actor en palabras o letras, sin romper React. El nodo de texto original se queda en su lugar,
// vacío, y a su lado va un `span` con las piezas (oculto para lectores de pantalla) y otro con el texto entero,
// invisible (para ellos). Si React cambia el texto, se avisa para cortar de nuevo. Al soltar, todo vuelve a como estaba.
import { grafemas } from "../utils/grafemas";
import { TOPES } from "./modelo";

export interface Trozo {
  texto: string;
  /** Espacios y saltos: no son piezas, quedan entre ellas. */
  espacio: boolean;
  /** Con `letra`: las letras de la palabra (una bandera o un emoji con tono quedan enteros). */
  letras?: string[];
}

/** Un texto en palabras, con los espacios aparte. Juntando los trozos sale el texto original. */
export function trozos(texto: string, por: "palabra" | "letra"): Trozo[] {
  return texto
    .split(/(\s+)/)
    .filter(Boolean)
    .map((t) => (/^\s+$/.test(t) ? { texto: t, espacio: true } : por === "letra" ? { texto: t, espacio: false, letras: grafemas(t) } : { texto: t, espacio: false }));
}

export interface Corte {
  /** Las piezas, en el orden del documento. Si no se pudo cortar, el actor entero. */
  piezas: HTMLElement[];
  soltar(): void;
}

/** La marca de lo que pone el Director (para no cortar lo propio y para limpiarlo). */
export const MARCA = "data-mk-d";

/** Una caja en línea: un elemento en línea no se puede mover. */
function caja(texto: string | null, recorta = false): HTMLSpanElement {
  const s = document.createElement("span");
  s.style.display = "inline-block";
  if (texto !== null) s.textContent = texto;
  if (recorta) {
    // Un poco de aire abajo, para que no se corten las letras que bajan (g, p, y).
    s.style.overflow = "clip";
    s.style.verticalAlign = "bottom";
    s.style.paddingBottom = ".12em";
    s.style.marginBottom = "-.12em";
  }
  return s;
}

/**
 * Corta el texto de `actor`. `alCambiar` avisa si alguien de afuera (React) cambió ese texto: quien llama suelta este
 * corte y hace uno nuevo. Con más piezas que el tope, no corta: el actor se mueve entero.
 */
export function cortar(actor: HTMLElement, por: "palabra" | "letra", mascara: boolean, alCambiar: () => void): Corte {
  const entero: Corte = { piezas: [actor], soltar() {} };
  if (typeof document === "undefined" || typeof document.createTreeWalker !== "function") return entero;
  const nodos: Text[] = [];
  const paseo = document.createTreeWalker(actor, NodeFilter.SHOW_TEXT);
  for (let n = paseo.nextNode(); n; n = paseo.nextNode()) {
    const padre = n.parentElement;
    // No se corta lo propio, ni lo que no es texto de la página (guiones, estilos, cajas de formulario, dibujos SVG).
    if (!n.nodeValue?.trim() || !padre || padre.closest(`[${MARCA}]`) || padre.closest("script,style,textarea,select,option,svg")) continue;
    nodos.push(n as Text);
  }
  const planes = nodos.map((n) => trozos(n.nodeValue ?? "", por));
  const total = planes.reduce((c, plan) => c + plan.reduce((k, t) => k + (t.espacio ? 0 : (t.letras?.length ?? 1)), 0), 0);
  if (!total || total > TOPES.piezas) return entero;

  const piezas: HTMLElement[] = [];
  const hechos = nodos.map((nodo, i) => {
    const original = nodo.nodeValue ?? "";
    const lector = document.createElement("span");
    lector.setAttribute(MARCA, "lector");
    lector.textContent = original;
    // Invisible, pero se lee. No se puede seleccionar: así al copiar el texto no sale dos veces.
    Object.assign(lector.style, { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap", userSelect: "none" });
    const visible = document.createElement("span");
    visible.setAttribute(MARCA, "corte");
    visible.setAttribute("aria-hidden", "true");
    for (const t of planes[i]) {
      if (t.espacio) visible.append(t.texto);
      else if (t.letras) {
        // La palabra en una caja que no se parte; adentro, una caja por letra.
        const palabra = caja(null, mascara);
        palabra.style.whiteSpace = "nowrap";
        for (const letra of t.letras) piezas.push(palabra.appendChild(caja(letra)));
        visible.append(palabra);
      } else {
        // Cada palabra va dentro de una caja propia: la que recorta (con máscara), y la que le da profundidad si se
        // inclina (la profundidad va en el padre, y un padre en línea no la da).
        const pieza = caja(t.texto);
        piezas.push(pieza);
        visible.appendChild(caja(null, mascara)).append(pieza);
      }
    }
    nodo.before(lector, visible);
    nodo.nodeValue = "";
    return { nodo, original, lector, visible };
  });

  let vivo = true;
  const observador =
    typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => {
          // ¿Alguien escribió en un nodo que dejamos vacío, o lo sacó? Entonces el corte ya no vale.
          if (vivo && hechos.some((h) => h.nodo.nodeValue !== "" || !h.nodo.isConnected || h.visible.nextSibling !== h.nodo)) alCambiar();
        })
      : null;
  observador?.observe(actor, { characterData: true, childList: true, subtree: true });

  return {
    piezas,
    soltar() {
      if (!vivo) return;
      vivo = false;
      observador?.disconnect();
      for (const h of hechos) {
        // Si sigue vacío, recupera su texto; si React ya le puso otro, se respeta.
        if (h.nodo.isConnected && h.nodo.nodeValue === "") h.nodo.nodeValue = h.original;
        h.lector.remove();
        h.visible.remove();
      }
    },
  };
}
