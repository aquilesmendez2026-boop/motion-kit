// Guia: recorre la pantalla paso a paso. La mano de cómic viaja a cada elemento, lo toca y un globo explica; el resto se
// oscurece (cuatro paneles alrededor del recorte: lo señalado se sigue pudiendo tocar). Cada paso apunta a un selector;
// si su elemento no aparece en 1,5 s, se salta. Si todos se saltan, termina (alTerminar).
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { CARTEL } from "../interfaz/tema";
import { useStyles } from "../utils/styles";
import { estilosComic } from "./estilos";
import { Globo } from "./Globo";
import { Mano } from "./Mano";
import { ubicarVisible, type Rect } from "./ubicar";

export interface PasoGuia {
  /** Un selector CSS del elemento que se señala (por ejemplo, una marca de soporte). */
  objetivo: string;
  texto: ReactNode;
}
export interface GuiaProps {
  abierta: boolean;
  pasos: PasoGuia[];
  /** Al llegar al final con «¡Listo!» (o si ningún paso encontró su elemento). */
  alTerminar?: () => void;
  /** Con «Saltar» o Escape. */
  alSaltar?: () => void;
  textos?: Partial<{ atras: string; siguiente: string; listo: string; saltar: string; deN: (i: number, n: number) => string }>;
}

/** Cuánto se espera a que aparezca el elemento de un paso antes de saltarlo (ms). */
export const ESPERA_OBJETIVO = 1500;

const TEXTOS = { atras: "Atrás", siguiente: "Siguiente", listo: "¡Listo!", saltar: "Saltar", deN: (i: number, n: number) => `Paso ${i} de ${n}` };

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-guia{position:fixed;inset:0;z-index:1300;pointer-events:none}
.mk-guia-oscuro{position:fixed;background:rgba(20,18,26,.45);pointer-events:auto}
.mk-guia-foco{position:fixed;left:0;top:0;border-radius:14px;box-shadow:0 0 0 4px ${CARTEL};transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.mk-guia-mano,.mk-guia-globo{position:fixed;left:0;top:0;transition:transform .55s cubic-bezier(.2,.8,.2,1)}
.mk-guia-globo{pointer-events:auto}
.mk-guia-globo .mk-globo{display:block;max-width:none}
.mk-guia-pie{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px;text-transform:none;font-style:normal}
.mk-guia-pie small{font-weight:700;opacity:.7}
.mk-guia-pie button{font:inherit;font-weight:800;min-height:44px;padding:0 14px;border:3px solid currentColor;border-radius:10px;background:transparent;
  color:inherit;box-shadow:3px 3px 0 currentColor;cursor:pointer}
.mk-guia-pie button[data-fuerte]{background:${CARTEL};color:#111;border-color:#111;box-shadow:3px 3px 0 #111}
@media (prefers-reduced-motion:reduce){.mk-guia-foco,.mk-guia-mano,.mk-guia-globo{transition:none}}`);

export function Guia({ abierta, pasos, alTerminar, alSaltar, textos }: GuiaProps) {
  useStyles("comic", estilosComic());
  useStyles("guia", estilos());
  const t = { ...TEXTOS, ...textos };
  const id = useId();
  const reducido = useReducedMotion();
  const [i, setI] = useState(0);
  // La medida va con su paso: se dibuja el último paso encontrado (su texto con su medida) mientras se busca el
  // siguiente; así la guía no desaparece, nunca mezcla un paso con la medida de otro y la mano viaja de uno a otro.
  const [medida, setMedida] = useState<{ paso: number; r: Rect } | null>(null);
  // Al abrirse, desde el paso 1 y sin la medida de la vez anterior (antes de que corra la búsqueda).
  const [estabaAbierta, setEstabaAbierta] = useState(abierta);
  if (abierta !== estabaAbierta) {
    setEstabaAbierta(abierta);
    if (abierta) {
      setI(0);
      setMedida(null);
    }
  }
  const [vista, setVista] = useState({ w: 390, h: 844 });
  /** La parte visible (con el teclado del teléfono abierto, más chica que la ventana). */
  const [visible, setVisible] = useState({ x: 0, y: 0, w: 390, h: 844 });
  const [altoGlobo, setAltoGlobo] = useState(190);
  const globo = useRef<HTMLDivElement>(null);
  const siguiente = useRef<HTMLButtonElement>(null);
  // Hacia dónde iba quien la usa (para saltar un paso que no existe en esa dirección).
  const sentido = useRef(1);
  const pasosRef = useRef(pasos);
  pasosRef.current = pasos;
  const avisos = useRef({ alTerminar, alSaltar });
  avisos.current = { alTerminar, alSaltar };
  const clave = pasos.map((p) => p.objetivo).join("\n");

  useEffect(() => {
    if (abierta) sentido.current = 1;
  }, [abierta]);

  const ir = (n: number) => {
    sentido.current = n >= i ? 1 : -1;
    setI(Math.max(0, n));
  };

  // Buscar el elemento del paso (con reintentos), medirlo y seguirlo al hacer scroll o cambiar de tamaño.
  useEffect(() => {
    if (!abierta) return;
    const lista = pasosRef.current;
    if (i >= lista.length) {
      avisos.current.alTerminar?.();
      return;
    }
    let vivo = true;
    let reloj: ReturnType<typeof setTimeout> | undefined;
    let el: HTMLElement | null = null;
    let cuadro = 0;
    let ultima = "";
    const inicio = performance.now();
    // Se mide en cada cuadro mientras el paso está a la vista: sigue al elemento aunque algo lo corra sin cambiar su
    // tamaño, al hacer scroll, al cambiar el tamaño y con el teclado del teléfono (visualViewport).
    const medir = () => {
      if (!vivo || !el) return;
      const r = el.getBoundingClientRect();
      const vv = typeof visualViewport !== "undefined" && visualViewport ? visualViewport : null;
      const vis = vv ? { x: vv.offsetLeft, y: vv.offsetTop, w: vv.width, h: vv.height } : { x: 0, y: 0, w: innerWidth, h: innerHeight };
      const firma = [r.left, r.top, r.width, r.height, innerWidth, innerHeight, vis.x, vis.y, vis.w, vis.h].map(Math.round).join(",");
      if (firma !== ultima) {
        ultima = firma;
        setMedida({ paso: i, r: { x: r.left, y: r.top, w: r.width, h: r.height } });
        setVista({ w: innerWidth, h: innerHeight });
        setVisible(vis);
      }
      cuadro = requestAnimationFrame(medir);
    };
    const buscar = () => {
      if (!vivo) return;
      const e = document.querySelector<HTMLElement>(lista[i].objetivo);
      const r = e?.getBoundingClientRect();
      if (e && r && r.width > 0 && r.height > 0) {
        el = e;
        e.scrollIntoView({ block: "center", behavior: reducido ? "auto" : "smooth" });
        medir();
        return;
      }
      if (performance.now() - inicio >= ESPERA_OBJETIVO) {
        // No aparece: se salta en el sentido en que iba (hacia atrás, si no queda nada atrás, hacia adelante).
        const siguientePaso = sentido.current < 0 && i > 0 ? i - 1 : i + 1;
        if (siguientePaso > i) sentido.current = 1;
        setI(siguientePaso);
        return;
      }
      reloj = setTimeout(buscar, 150);
    };
    buscar();
    return () => {
      vivo = false;
      clearTimeout(reloj);
      cancelAnimationFrame(cuadro);
    };
  }, [abierta, i, clave, reducido]);

  // Teclado: Escape salta; las flechas pasan de paso.
  useEffect(() => {
    if (!abierta) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") avisos.current.alSaltar?.();
      else if (e.key === "ArrowRight") ir(Math.min(i + 1, pasosRef.current.length - 1));
      else if (e.key === "ArrowLeft") ir(i - 1);
    };
    document.addEventListener("keydown", alTecla);
    return () => document.removeEventListener("keydown", alTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, i]);

  // Lo que se dibuja: el último paso encontrado (mientras se busca el siguiente, sigue a la vista).
  const visto = medida && medida.paso < pasos.length ? medida.paso : -1;
  const rect = visto >= 0 ? medida!.r : null;
  // El foco en «Siguiente» cuando aparece cada paso; el alto real del globo para ubicarlo.
  const enfocado = useRef(-1);
  useLayoutEffect(() => {
    if (!rect) return;
    if (globo.current) setAltoGlobo(globo.current.offsetHeight);
    if (enfocado.current !== visto) {
      enfocado.current = visto;
      siguiente.current?.focus({ preventScroll: true });
    }
  }, [rect, visto]);
  useEffect(() => {
    if (!abierta) enfocado.current = -1;
  }, [abierta]);

  if (!abierta || !rect || typeof document === "undefined") return null;
  const W = visible.w < 560 ? 120 : 150;
  const anchoGlobo = Math.min(300, visible.w - 16);
  const u = ubicarVisible(rect, visible, { mano: W, globo: anchoGlobo, altoGlobo });
  const f = u.foco;
  const ultimo = visto === pasos.length - 1;
  const paneles = [
    { left: 0, top: 0, width: vista.w, height: Math.max(0, f.y) },
    { left: 0, top: f.y + f.h, width: vista.w, height: Math.max(0, vista.h - f.y - f.h) },
    { left: 0, top: f.y, width: Math.max(0, f.x), height: f.h },
    { left: f.x + f.w, top: f.y, width: Math.max(0, vista.w - f.x - f.w), height: f.h },
  ];

  return createPortal(
    <div className="mk-guia">
      {paneles.map((s, k) => (
        <div key={k} className="mk-guia-oscuro" style={s} aria-hidden="true" />
      ))}
      <div className="mk-guia-foco" style={{ width: f.w, height: f.h, transform: `translate(${f.x}px,${f.y}px)` }} aria-hidden="true" />
      <div className="mk-guia-mano" style={{ transform: `translate(${u.mano.x}px,${u.mano.y}px)` }}>
        <Mano key={visto} ancho={W} direccion={u.mano.direccion} />
      </div>
      <div
        ref={globo}
        className="mk-guia-globo"
        role="dialog"
        aria-label={t.deN(visto + 1, pasos.length)}
        aria-describedby={`${id}-texto`}
        style={{ width: anchoGlobo, transform: `translate(${u.globo.x}px,${u.globo.y}px)` }}
      >
        <Globo key={visto} cola={u.globo.cola}>
          <span id={`${id}-texto`}>{pasos[visto].texto}</span>
          <span className="mk-guia-pie">
            <small>{t.deN(visto + 1, pasos.length)}</small>
            {visto > 0 && (
              <button type="button" onClick={() => ir(visto - 1)}>
                {t.atras}
              </button>
            )}
            <button ref={siguiente} type="button" data-fuerte="" onClick={() => (ultimo ? avisos.current.alTerminar?.() : ir(visto + 1))}>
              {ultimo ? t.listo : t.siguiente}
            </button>
            {!ultimo && (
              <button type="button" onClick={() => avisos.current.alSaltar?.()}>
                {t.saltar}
              </button>
            )}
          </span>
        </Globo>
      </div>
    </div>,
    document.body,
  );
}
