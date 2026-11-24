// Visor de fotos: la foto que se toca en la galería crece desde su lugar hasta llenar la pantalla. Es un diálogo: el
// foco entra y queda adentro, Escape cierra y el foco vuelve a la foto tocada. Se pasa de foto con los botones, las
// flechas o deslizando; deslizar hacia abajo cierra. Se carga aparte (import()).
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { createPortal, flushSync } from "react-dom";
import type { NivelEscena } from "../escena/nivel";
import { useStyles } from "../utils/styles";

export interface VisorFotosProps {
  fotos: { url: string; pie?: string }[];
  /** La foto con que abre. */
  inicial: number;
  /** El botón de la foto tocada: desde ahí crece y ahí vuelve el foco al cerrar. */
  origen: HTMLElement | null;
  nivel: NivelEscena;
  /** El botón de la foto `i` en la galería, para que al cerrar la foto vuelva a su lugar. */
  miniatura?: (i: number) => HTMLElement | null;
  alCerrar: () => void;
}

const NOMBRE = "mk-visor-foto";

// El visor va en un portal al <body>: no hereda los colores del estilo, así que usa blanco sobre negro.
export const CSS_VISOR =
  ".mk-visor{position:fixed;inset:0;z-index:1000;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:12px;padding:16px;box-sizing:border-box;" +
  // pinch-zoom: se puede ampliar la foto con dos dedos; con uno, el gesto llega al visor (deslizar o cerrar).
  "color:#fff;outline:none;touch-action:pinch-zoom}" +
  ".mk-visor-fondo{position:absolute;inset:0;background:rgba(8,8,10,.92)}" +
  // El marco no recibe toques: al lado de la foto, el toque llega al fondo y cierra.
  ".mk-visor-marco{position:relative;margin:0;width:100%;min-height:0;display:grid;align-content:center;justify-items:center;gap:10px;pointer-events:none}" +
  ".mk-visor-foto{display:block;max-width:100%;max-height:calc(100svh - 150px);object-fit:contain;border-radius:8px;pointer-events:auto;" +
  "touch-action:pinch-zoom;user-select:none;-webkit-user-drag:none;box-shadow:0 30px 80px -20px rgba(0,0,0,.8)}" +
  ".mk-visor-pie{margin:0;text-align:center;pointer-events:auto}" +
  ".mk-visor-pie small{display:block;opacity:.75}" +
  ".mk-visor-botones{position:relative;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}" +
  ".mk-visor-botones button{min-width:44px;min-height:44px;padding:0 16px;border-radius:999px;border:2px solid rgba(255,255,255,.7);" +
  "background:rgba(0,0,0,.45);color:#fff;font:inherit;cursor:pointer}" +
  ".mk-visor-botones button:focus-visible{outline:3px solid #fff;outline-offset:2px}" +
  ".mk-visor:not([data-nivel=quieto]) .mk-visor-fondo{animation:mk-visor-entra .25s ease-out both}" +
  ".mk-visor:not([data-nivel=quieto]) .mk-visor-foto[data-cambio]{animation:mk-visor-cambia .2s ease-out both}" +
  "@keyframes mk-visor-entra{from{opacity:0}to{opacity:1}}" +
  "@keyframes mk-visor-cambia{from{opacity:.35}to{opacity:1}}" +
  "@media (prefers-reduced-motion:reduce){.mk-visor,.mk-visor *{animation:none!important;transition:none!important}}";

type DocumentoConVista = Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } };

const imgDe = (el: HTMLElement | null): HTMLElement | null => (el instanceof HTMLImageElement ? el : el?.querySelector("img") ?? null);

function enVista(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

function proporcionDe(el: HTMLElement | null): number | null {
  const img = imgDe(el);
  return img instanceof HTMLImageElement && img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null;
}

/**
 * Hace el cambio (abrir o cerrar) con la foto creciendo de `antes` a lo que devuelva `despues`. Con View Transitions
 * usa el nombre compartido (solo en esas dos fotos, y se quita al terminar). Sin ellas, y solo con `respaldo` (al
 * abrir), una animación propia de `transform`: al cerrar no, porque la foto que vuelve vive dentro de la galería y
 * quedaría tapada y recortada. En quieto, el cambio va directo.
 */
function animar(nivel: NivelEscena, antes: HTMLElement | null, cambiar: () => void, despues: () => HTMLElement | null, respaldo: boolean): void {
  if (nivel === "quieto" || !antes) return cambiar();
  const doc = document as DocumentoConVista;
  if (doc.startViewTransition) {
    antes.style.setProperty("view-transition-name", NOMBRE);
    let nuevo: HTMLElement | null = null;
    const t = doc.startViewTransition(() => {
      antes.style.removeProperty("view-transition-name");
      flushSync(cambiar);
      nuevo = despues();
      nuevo?.style.setProperty("view-transition-name", NOMBRE);
    });
    const limpiar = () => {
      antes.style.removeProperty("view-transition-name");
      nuevo?.style.removeProperty("view-transition-name");
    };
    t.finished.then(limpiar, limpiar);
    return;
  }
  if (!respaldo) return cambiar();
  const r0 = antes.getBoundingClientRect();
  flushSync(cambiar);
  const d = despues();
  if (!d || typeof d.animate !== "function") return;
  const r1 = d.getBoundingClientRect();
  if (!r1.width || !r1.height) return;
  d.animate(
    [
      { transformOrigin: "0 0", transform: `translate(${r0.left - r1.left}px,${r0.top - r1.top}px) scale(${r0.width / r1.width},${r0.height / r1.height})` },
      { transformOrigin: "0 0", transform: "none" },
    ],
    { duration: 350, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
}

/** Abre el visor (lo que haga `abrir`) con la foto creciendo desde el botón tocado. */
export function abrirCon(origen: HTMLElement, nivel: NivelEscena, abrir: () => void): void {
  animar(nivel, imgDe(origen), abrir, () => document.querySelector<HTMLElement>(".mk-visor-foto"), true);
}

export default function VisorFotos({ fotos, inicial, origen, nivel, miniatura, alCerrar }: VisorFotosProps) {
  useStyles("visor-fotos", CSS_VISOR);
  const n = fotos.length;
  const [indice, setIndice] = useState(inicial);
  const [cambios, setCambios] = useState(0);
  const [proporcion, setProporcion] = useState<number | null>(() => proporcionDe(origen));
  const dialogo = useRef<HTMLDivElement>(null);
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const arrastre = useRef<{ x: number; y: number } | null>(null);
  // Si la lista se achica con el visor abierto, el índice vuelve al rango.
  const i = n ? Math.min(Math.max(0, indice), n - 1) : 0;

  // Mientras está abierto, la página de atrás no se mueve; al cerrar, el foco vuelve a la foto tocada.
  useEffect(() => {
    const html = document.documentElement;
    const previo = { overflow: html.style.overflow, relleno: html.style.paddingRight };
    const barra = window.innerWidth - html.clientWidth;
    // Sin la barra de desplazamiento la página se ensancharía: se compensa para que nada salte.
    if (barra > 0) html.style.paddingRight = `${(parseFloat(getComputedStyle(html).paddingRight) || 0) + barra}px`;
    html.style.overflow = "hidden";
    botonCerrar.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = previo.overflow;
      html.style.paddingRight = previo.relleno;
      origen?.focus?.({ preventScroll: true });
    };
  }, [origen]);

  // Sin fotos no hay nada que mostrar: se cierra.
  useEffect(() => {
    if (!n) alCerrar();
  }, [n, alCerrar]);
  if (!n) return null;

  const ir = (paso: 1 | -1) => {
    if (n < 2) return;
    setIndice((((i + paso) % n) + n) % n);
    setCambios((c) => c + 1);
  };
  const cerrar = () => {
    // La foto vuelve a su lugar en la galería si ese lugar está a la vista; si no, el visor solo se desvanece.
    const destino = miniatura?.(i) ?? (i === inicial ? origen : null);
    animar(nivel, dialogo.current?.querySelector<HTMLElement>(".mk-visor-foto") ?? null, alCerrar, () => (destino && destino.isConnected && enVista(destino) ? imgDe(destino) : null), false);
  };

  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") cerrar();
    else if (e.key === "ArrowRight") ir(1);
    else if (e.key === "ArrowLeft") ir(-1);
    else if (e.key === "Tab") {
      // El foco da la vuelta entre los botones del visor: nunca sale a la página de atrás.
      const focos = [...(dialogo.current?.querySelectorAll<HTMLElement>("button") ?? [])];
      if (!focos.length) return;
      const actual = focos.indexOf(document.activeElement as HTMLElement);
      const sig = e.shiftKey ? (actual <= 0 ? focos.length - 1 : actual - 1) : actual < 0 || actual === focos.length - 1 ? 0 : actual + 1;
      focos[sig].focus();
    } else return;
    e.preventDefault();
  };

  const bajar = (e: PointerEvent<HTMLImageElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX, y: e.clientY };
  };
  const subir = (e: PointerEvent<HTMLImageElement>) => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a) return;
    const dx = e.clientX - a.x;
    const dy = e.clientY - a.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) ir(dx < 0 ? 1 : -1);
    else if (dy > 80 && dy > Math.abs(dx)) cerrar();
  };

  const f = fotos[i];
  const cuenta = `Foto ${i + 1} de ${n}`;
  return createPortal(
    <div ref={dialogo} className="mk-visor" role="dialog" aria-modal="true" aria-label={f.pie || cuenta} tabIndex={-1} data-nivel={nivel} onKeyDown={tecla}>
      <div className="mk-visor-fondo" onClick={cerrar} />
      <figure className="mk-visor-marco">
        <img
          key={i}
          className="mk-visor-foto"
          src={f.url}
          // Con pie, el pie ya la describe (no se lee dos veces).
          alt={f.pie ? "" : cuenta}
          draggable={false}
          data-cambio={cambios ? "" : undefined}
          // Con la proporción conocida, la foto ocupa lo más que cabe sin deformarse.
          style={proporcion ? { width: `min(100%, 1100px, calc((100svh - 150px) * ${proporcion}))`, aspectRatio: String(proporcion) } : undefined}
          onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            if (w && h) setProporcion(w / h);
          }}
          onPointerDown={bajar}
          onPointerUp={subir}
          onPointerCancel={() => (arrastre.current = null)}
        />
        <figcaption className="mk-visor-pie" aria-live="polite">
          {f.pie && <span>{f.pie}</span>}
          <small>{cuenta}</small>
        </figcaption>
      </figure>
      <div className="mk-visor-botones">
        {n > 1 && <button type="button" onClick={() => ir(-1)}>Anterior</button>}
        {n > 1 && <button type="button" onClick={() => ir(1)}>Siguiente</button>}
        <button ref={botonCerrar} type="button" onClick={cerrar}>Cerrar</button>
      </div>
    </div>,
    document.body,
  );
}
