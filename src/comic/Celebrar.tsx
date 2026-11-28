// Celebrar: cuando pasa algo bueno (la página publicada, el primer pedido), un estallido grande y confeti sobre todo,
// 2,5 s, sin recibir toques. `useCelebrar()` devuelve `celebrar(texto)`. Se monta solo (su propia raíz en el body); si
// hay un `CelebrarProvider` arriba, se dibuja ahí. Dos seguidas: la nueva reemplaza a la anterior.
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { Confeti } from "../momentos/Confeti";
import { c, CARTEL } from "../interfaz/tema";
import { useStyles } from "../utils/styles";
import { Estallido } from "./Estallido";
import { estilosComic } from "./estilos";

/** Cuánto dura una celebración (ms). */
export const DURA_CELEBRAR = 2500;

let actual: { n: number; texto: string } | null = null;
let cuenta = 0;
let reloj: ReturnType<typeof setTimeout> | undefined;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());
const suscribir = (f: () => void) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};
const leer = () => actual;

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-celebrar{position:fixed;inset:0;z-index:1400;display:grid;place-items:center;pointer-events:none;
  --mk-m-acento:${c("acento")};--mk-m-acento-2:${CARTEL};--mk-m-texto:${c("bien")}}
.mk-celebrar .mk-estallido{animation:mk-celebrar-entra .5s cubic-bezier(.34,1.56,.64,1)}
.mk-celebrar-oculto{position:absolute;clip-path:inset(50%)}
@keyframes mk-celebrar-entra{from{opacity:0;scale:.3}}
@media (prefers-reduced-motion:reduce){.mk-celebrar .mk-estallido{animation:mk-celebrar-aparece .25s ease-out}}
@keyframes mk-celebrar-aparece{from{opacity:0}}`);

/** Lo que se ve: el estallido y el confeti de la celebración que está ahora. */
function Escenario() {
  useStyles("comic", estilosComic());
  useStyles("celebrar", estilos());
  const reducido = useReducedMotion();
  const ahora = useSyncExternalStore(suscribir, leer, () => null);
  return (
    <>
      {ahora && (
        <div className="mk-celebrar" key={ahora.n} aria-hidden="true">
          {!reducido && <Confeti semilla={ahora.n} />}
          <Estallido texto={ahora.texto} tamano={220} late={false} />
        </div>
      )}
      <span className="mk-celebrar-oculto" aria-live="polite">{ahora?.texto ?? ""}</span>
    </>
  );
}

const ConProveedor = createContext(false);
let raizPropia = false;

/** Opcional: dibuja las celebraciones dentro de la app (si no, se montan solas en el body). */
export function CelebrarProvider({ children }: { children: ReactNode }) {
  return (
    <ConProveedor.Provider value={true}>
      {children}
      {typeof document !== "undefined" && createPortal(<Escenario />, document.body)}
    </ConProveedor.Provider>
  );
}

/** `const celebrar = useCelebrar(); celebrar("¡Publicada!")`. */
/** Monta la raíz propia (con su región que anuncia, vacía) antes de la primera celebración: así el lector la anuncia. */
function montarRaiz() {
  if (raizPropia || typeof document === "undefined") return;
  raizPropia = true;
  const nodo = document.createElement("div");
  nodo.setAttribute("data-mk-celebrar", "");
  document.body.appendChild(nodo);
  createRoot(nodo).render(<Escenario />);
}

export function useCelebrar(): (texto: string) => void {
  const hayProveedor = useContext(ConProveedor);
  useEffect(() => {
    if (!hayProveedor) montarRaiz();
  }, [hayProveedor]);
  return (texto: string) => {
    if (typeof document === "undefined") return;
    if (!hayProveedor) montarRaiz();
    clearTimeout(reloj);
    actual = { n: ++cuenta, texto };
    avisar();
    reloj = setTimeout(() => {
      actual = null;
      avisar();
    }, DURA_CELEBRAR);
  };
}
