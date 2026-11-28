import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as EventoPuntero,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { cierraDeslizando, duracionDe, quienSale } from "../interfaz/avisos";
import { c, f, fuerza, letra, tiempo } from "../interfaz/tema";
import { useStyles } from "../utils/styles";

export interface ToastOptions {
  /** Milisegundos que se muestra el aviso (3200; 6000 si trae acción). */
  duration?: number;
  /** `bien` (✓ verde), `mal` (! rojo, se anuncia al tiro) o `info` (por defecto, sin ícono). */
  tipo?: "bien" | "mal" | "info";
  /** Un botón dentro del aviso, por ejemplo «Deshacer». */
  accion?: { texto: string; alHacer: () => void };
}

export interface ToastProviderProps {
  /** Dónde aparecen los avisos. */
  position?: "top" | "bottom";
  children: ReactNode;
}

interface Entrada {
  id: number;
  mensaje: ReactNode;
  tipo: "bien" | "mal" | "info";
  accion?: ToastOptions["accion"];
  duracion: number;
  saliendo: boolean;
  conAccion: boolean;
}

type ShowToast = (message: ReactNode, options?: ToastOptions) => void;

const ToastContext = /* @__PURE__ */ createContext<ShowToast | null>(null);

const SALIDA = 260;

/** Se arma al montarse (lleva colores del tema): así quien no usa avisos lo puede descartar. */
let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-avisos-zona,.mk-avisos{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}
.mk-avisos-zona{position:fixed;left:0;z-index:1200;box-sizing:border-box;padding:0 16px;pointer-events:none}
.mk-aviso{pointer-events:auto;box-sizing:border-box;width:fit-content;max-width:min(440px,100%);min-height:48px;display:flex;align-items:center;gap:10px;
  padding:6px 6px 6px 14px;border-radius:${f("radioTarjeta", "14px")};border:${f("trazo", `1px solid ${c("borde")}`)};background:${c("superficie")};color:${c("texto")};
  font:inherit;font-family:${letra("fuenteTexto", "inherit")};font-weight:600;box-shadow:${f("sombra", "0 8px 24px rgba(0,0,0,.12)")};touch-action:pan-y;user-select:none;
  transition:opacity ${SALIDA}ms,transform ${SALIDA}ms}
.mk-aviso[data-entra]{animation:mk-aviso-entra ${tiempo(380)} cubic-bezier(.34,1.4,.64,1)}
.mk-aviso[data-saliendo]{opacity:0;transform:scale(.96)}
.mk-aviso-icono{flex:none;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;font-size:13px;font-weight:800;
  color:${c("bien")};background:color-mix(in srgb,currentColor 14%,transparent)}
.mk-aviso[data-tipo=mal] .mk-aviso-icono{color:${c("mal")}}
.mk-aviso-texto{flex:1;min-width:0;padding:6px 0}
.mk-aviso button{font:inherit;border:0;background:none;color:inherit;cursor:pointer;min-height:44px;border-radius:${f("radioBoton", "9px")}}
.mk-aviso button:active{transform:${f("hundir", "none")}}
.mk-aviso .mk-aviso-accion{padding:0 10px;color:${c("acento")};font-weight:700}
.mk-aviso-cerrar{width:44px;font-size:20px;line-height:1;opacity:.6}
@keyframes mk-aviso-entra{from{opacity:0;transform:translateY(calc(var(--mk-aviso-desde,16px) * var(--mk-ritmo-fuerza,1))) scale(calc(1 - ${fuerza(0.04)}))}}`);

/** Un aviso: su cuenta (que se pausa con el mouse, el dedo o el foco encima) y el deslizamiento para cerrarlo. */
function Aviso({ e, cerrar, reducido }: { e: Entrada; cerrar: (id: number) => void; reducido: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const restante = useRef(e.duracion);
  const desde = useRef(0);
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  const arrastre = useRef<{ x: number; t: number; dx: number; v: number } | null>(null);
  const pausas = useRef(0);

  const correr = useCallback(() => {
    clearTimeout(reloj.current);
    desde.current = Date.now();
    reloj.current = setTimeout(() => cerrar(e.id), Math.max(0, restante.current));
  }, [cerrar, e.id]);
  const pausar = () => {
    if (pausas.current++ > 0) return;
    clearTimeout(reloj.current);
    restante.current -= Date.now() - desde.current;
  };
  const seguir = () => {
    pausas.current = Math.max(0, pausas.current - 1);
    if (pausas.current === 0 && !e.saliendo) correr();
  };
  useEffect(() => {
    correr();
    return () => clearTimeout(reloj.current);
  }, [correr]);

  const mover = (dx: number) => {
    if (!el.current) return;
    el.current.style.transition = "none";
    el.current.style.transform = dx ? `translateX(${dx}px)` : "";
    el.current.style.opacity = dx ? String(Math.max(0.2, 1 - Math.abs(dx) / 220)) : "";
  };
  const alBajar = (ev: EventoPuntero<HTMLDivElement>) => {
    if ((ev.target as HTMLElement).closest("button") || e.saliendo) return;
    arrastre.current = { x: ev.clientX, t: performance.now(), dx: 0, v: 0 };
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
  };
  const alMover = (ev: EventoPuntero<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a) return;
    const ahora = performance.now();
    const dx = ev.clientX - a.x;
    a.v = (dx - a.dx) / Math.max(1, ahora - a.t);
    a.dx = dx;
    a.t = ahora;
    mover(dx);
  };
  const alSoltar = () => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a || !el.current) return;
    const nodo = el.current;
    nodo.style.transition = "";
    if (cierraDeslizando(a.dx, a.v)) {
      const fuera = Math.sign(a.dx || a.v) * (nodo.offsetWidth + 40);
      nodo.style.transform = `translateX(${fuera}px)`;
      nodo.style.opacity = "0";
      cerrar(e.id);
    } else {
      nodo.style.transform = "";
      nodo.style.opacity = "";
    }
  };

  return (
    <div
      ref={el}
      className="mk-aviso"
      data-tipo={e.tipo}
      data-entra={reducido ? undefined : ""}
      data-saliendo={e.saliendo ? "" : undefined}
      onPointerEnter={pausar}
      onPointerLeave={seguir}
      onFocus={pausar}
      onBlur={seguir}
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
    >
      {e.tipo !== "info" && (
        <span className="mk-aviso-icono" aria-hidden="true">
          {e.tipo === "bien" ? "✓" : "!"}
        </span>
      )}
      <span className="mk-aviso-texto">{e.mensaje}</span>
      {e.accion && (
        <button
          type="button"
          className="mk-aviso-accion"
          onClick={() => {
            e.accion?.alHacer();
            cerrar(e.id);
          }}
        >
          {e.accion.texto}
        </button>
      )}
      <button type="button" className="mk-aviso-cerrar" aria-label="Cerrar aviso" onClick={() => cerrar(e.id)}>
        ×
      </button>
    </div>
  );
}

/**
 * Envuelve la app para poder mostrar avisos breves con `useToast()`: de bien, de error o de información, con una acción
 * opcional («Deshacer»). Se cierran solos, con la × o deslizándolos hacia el lado. Toman los colores del tema.
 */
export function ToastProvider({ position = "bottom", children }: ToastProviderProps) {
  useStyles("toast", estilos());
  const reducido = useReducedMotion();
  const [lista, setLista] = useState<Entrada[]>([]);
  const [listo, setListo] = useState(false);
  const siguiente = useRef(1);
  const relojes = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setListo(true);
    const pendientes = relojes.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  /** Marca que salen (se desvanecen) y los quita después. */
  const sacar = useCallback((ids: number[]) => {
    if (!ids.length) return;
    setLista((l) => l.map((t) => (ids.includes(t.id) ? { ...t, saliendo: true } : t)));
    relojes.current.push(setTimeout(() => setLista((l) => l.filter((t) => !ids.includes(t.id))), SALIDA));
  }, []);
  const cerrar = useCallback((id: number) => sacar([id]), [sacar]);

  const show = useCallback<ShowToast>(
    (mensaje, o = {}) => {
      const nueva: Entrada = {
        id: siguiente.current++,
        mensaje,
        tipo: o.tipo ?? "info",
        accion: o.accion,
        duracion: duracionDe(o),
        saliendo: false,
        conAccion: Boolean(o.accion),
      };
      setLista((l) => {
        const activos = [...l.filter((t) => !t.saliendo), nueva];
        const salen: number[] = [];
        for (let i = quienSale(activos); i >= 0; i = quienSale(activos)) salen.push(activos.splice(i, 1)[0].id);
        if (salen.length) queueMicrotask(() => sacar(salen));
        return [...l, nueva];
      });
    },
    [sacar]
  );

  const arriba = position === "top";
  const de = (urgente: boolean) => lista.filter((t) => (t.tipo === "mal") === urgente);
  const region = (urgente: boolean) => (
    <div className="mk-avisos" role={urgente ? "alert" : "status"} aria-live={urgente ? "assertive" : "polite"}>
      {de(urgente).map((t) => (
        <Aviso key={t.id} e={t} cerrar={cerrar} reducido={reducido} />
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {listo &&
        createPortal(
          <div
            className="mk-avisos-zona"
            style={{
              ["--mk-aviso-desde" as string]: arriba ? "-16px" : "16px",
              top: arriba ? "calc(16px + env(safe-area-inset-top))" : undefined,
              bottom: arriba ? undefined : "calc(16px + env(safe-area-inset-bottom))",
              flexDirection: arriba ? "column-reverse" : "column",
            }}
          >
            {region(false)}
            {region(true)}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

/**
 * Devuelve la función para mostrar un aviso: `const toast = useToast();
 * toast("Guardado", { tipo: "bien" })`. Necesita un `ToastProvider` más arriba.
 */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast necesita un <ToastProvider> más arriba.");
  return show;
}
