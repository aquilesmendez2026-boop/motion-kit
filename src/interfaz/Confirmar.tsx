// Confirmar: antes de algo que no se deshace, la pregunta en un globo de cómic centrado (computador) o en una hoja desde
// abajo (teléfono). El foco cae en el botón seguro y no sale del diálogo; Escape o tocar afuera cancelan; el foco vuelve a
// lo que estaba enfocado al abrir. Con `ocupado` (mientras actúa), una rueda en «Sí» y nada cierra.
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BottomSheet } from "../components/BottomSheet";
import { useStyles } from "../utils/styles";
import { enfocables, siguienteFoco } from "./foco";
import { c, f, fuerza, letra, tiempo } from "./tema";

export interface ConfirmarProps {
  abierto: boolean;
  /** La pregunta («¿Borro la novedad?»): también es el nombre del diálogo. */
  pregunta: string;
  /** Una línea más bajo la pregunta. */
  detalle?: ReactNode;
  /** Contenido libre (además de `detalle`). */
  children?: ReactNode;
  textoSi?: string;
  textoNo?: string;
  /** El botón que actúa en rojo. */
  peligro?: boolean;
  /** Mientras actúa: rueda en «Sí»; Escape, «No» y tocar afuera no cierran. */
  ocupado?: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
  /** Para vestirlo con el look de quien lo usa (va en el globo o en la hoja). */
  className?: string;
  style?: CSSProperties;
  /**
   * Atributos para cada botón (por ejemplo `{ "data-soporte-accion": "borrar" }`, `aria-*` o una clase que se suma).
   * `type`, `onClick` y `disabled` los pone la pieza.
   */
  propsSi?: BotonExtra;
  propsNo?: BotonExtra;
  /** Con `false`, «Sí» queda deshabilitado (y no confirma) hasta que quien lo usa lo habilite; por ejemplo, hasta que se escriba el nombre. */
  siHabilitado?: boolean;
}

type BotonExtra = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick" | "disabled"> & Record<`data-${string}`, string | undefined>;

/** Encima de las ventanas del panel (Chakra usa 1400 para las suyas). */
const CAPA = 1450;

/** Menos de esto de ancho, la hoja desde abajo. */
const TELEFONO = "(max-width: 559px)";

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-confirmar-fondo{position:fixed;inset:0;z-index:1450;display:grid;place-items:center;padding:16px;background:rgba(20,18,26,.45)}
.mk-confirmar-globo{--t:${c("texto")};--s:${c("superficie")};position:relative;width:min(420px,100%);box-sizing:border-box;padding:20px;
  background:var(--s);color:var(--t);border:${f("trazo", "3px solid var(--t)")};border-radius:${f("radioTarjeta", "20px")};box-shadow:${f("sombra", "6px 6px 0 var(--t)")};outline:none;
  animation:mk-confirmar-entra ${tiempo(360)} cubic-bezier(.34,1.56,.64,1)}
.mk-confirmar-contenido{display:grid;gap:10px;font-family:${letra("fuenteTexto", "inherit")}}
.mk-confirmar-hoja .mk-confirmar-contenido{padding:4px 20px 22px}
.mk-confirmar-pregunta{margin:0;font-size:1.15rem;font-weight:800;font-family:${letra("fuenteTitulo", "inherit")}}
.mk-confirmar-detalle{margin:0;color:${c("suave")}}
.mk-confirmar-botones{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:6px}
.mk-confirmar-botones button{font:inherit;font-weight:800;min-height:44px;padding:0 18px;border-radius:${f("radioBoton", "12px")};cursor:pointer;
  border:${f("trazo", `2px solid ${c("texto")}`)};display:inline-flex;align-items:center;gap:8px}
.mk-confirmar-botones button:active{transform:${f("hundir", "none")}}
.mk-confirmar-no{background:${c("superficie")};color:${c("texto")}}
.mk-confirmar-si{background:${c("acento")};color:${c("sobreAcento")}}
.mk-confirmar-si[data-peligro]{background:${c("mal")};color:#fff}
.mk-confirmar-botones button:disabled{opacity:.55;cursor:not-allowed}
.mk-confirmar-anillo{width:1em;height:1em;box-sizing:border-box;border-radius:50%;border:.16em solid currentColor;border-right-color:transparent;animation:mk-confirmar-gira .7s linear infinite}
@keyframes mk-confirmar-entra{from{opacity:0;transform:scale(calc(1 - ${fuerza(0.3)}))}}
@keyframes mk-confirmar-gira{to{transform:rotate(1turn)}}
@media (prefers-reduced-motion:reduce){.mk-confirmar-globo{animation:none}.mk-confirmar-anillo{animation:none;border-right-color:currentColor;opacity:.6}}`);

export function Confirmar({ abierto, pregunta, detalle, children, textoSi = "Sí", textoNo = "No", peligro = false, ocupado = false, alConfirmar, alCancelar, className, style, propsSi, propsNo, siHabilitado = true }: ConfirmarProps) {
  const id = useId();
  // Lo que describe el diálogo: el detalle y el contenido libre (el lector de pantalla los lee después de la pregunta).
  const describe = [detalle ? `${id}-detalle` : "", children ? `${id}-cuerpo` : ""].filter(Boolean).join(" ");
  useStyles("confirmar", estilos());
  const caja = useRef<HTMLDivElement>(null);
  const no = useRef<HTMLButtonElement>(null);
  const [telefono, setTelefono] = useState(() => typeof matchMedia !== "undefined" && matchMedia(TELEFONO).matches);
  // Una sola confirmación por vez que se abre (dos toques rápidos no confirman dos veces).
  const yaConfirmo = useRef(false);
  const ocupadoRef = useRef(ocupado);
  // Si la acción terminó (ocupado pasó a falso) y el diálogo sigue abierto, se puede volver a confirmar (reintentar).
  if (ocupadoRef.current && !ocupado) yaConfirmo.current = false;
  ocupadoRef.current = ocupado;

  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const m = matchMedia(TELEFONO);
    const alCambiar = () => setTelefono(m.matches);
    m.addEventListener("change", alCambiar);
    return () => m.removeEventListener("change", alCambiar);
  }, []);

  const cancelar = () => {
    if (ocupadoRef.current) return;
    alCancelar();
  };
  const confirmar = () => {
    if (ocupadoRef.current || yaConfirmo.current || !siHabilitado) return;
    yaConfirmo.current = true;
    alConfirmar();
  };

  // En el computador: el foco al botón seguro al abrir, Escape cancela y el foco vuelve a quien lo abrió.
  useEffect(() => {
    if (!abierto) return;
    yaConfirmo.current = false;
    if (telefono) return;
    const previo = document.activeElement as HTMLElement | null;
    no.current?.focus({ preventScroll: true });
    const alTecla = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") cancelar();
    };
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("keydown", alTecla);
      previo?.focus?.({ preventScroll: true });
    };
    // Solo al abrir y cerrar (y si cambia el modo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, telefono]);

  // El foco no sale del diálogo.
  const atrapar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !caja.current) return;
    const destino = siguienteFoco(enfocables(caja.current), document.activeElement, e.shiftKey);
    if (destino) {
      e.preventDefault();
      destino.focus();
    }
  };

  const contenido = (
    <div ref={caja} className="mk-confirmar-contenido" onKeyDown={atrapar}>
      <p className="mk-confirmar-pregunta">{pregunta}</p>
      {detalle && <p id={`${id}-detalle`} className="mk-confirmar-detalle">{detalle}</p>}
      {children && <div id={`${id}-cuerpo`}>{children}</div>}
      <div className="mk-confirmar-botones">
        <button {...propsNo} ref={no} type="button" className={`mk-confirmar-no${propsNo?.className ? ` ${propsNo.className}` : ""}`} disabled={ocupado} onClick={cancelar}>
          {textoNo}
        </button>
        <button {...propsSi} type="button" className={`mk-confirmar-si${propsSi?.className ? ` ${propsSi.className}` : ""}`} data-peligro={peligro || undefined} aria-busy={ocupado || undefined} disabled={!siHabilitado} onClick={confirmar}>
          {ocupado && <span className="mk-confirmar-anillo" aria-hidden="true" />}
          {textoSi}
        </button>
      </div>
    </div>
  );

  if (telefono)
    return (
      <BottomSheet open={abierto} onClose={cancelar} label={pregunta} rol="alertdialog" focoInicial={no} capa={CAPA} describe={describe} className={`mk-confirmar-hoja${className ? ` ${className}` : ""}`} style={style}>
        {contenido}
      </BottomSheet>
    );
  if (!abierto || typeof document === "undefined") return null;
  return createPortal(
    <div className="mk-confirmar-fondo" onClick={cancelar}>
      <div role="alertdialog" aria-modal="true" aria-label={pregunta} aria-describedby={describe || undefined} className={`mk-confirmar-globo${className ? ` ${className}` : ""}`} style={style} onClick={(e) => e.stopPropagation()}>
        {contenido}
      </div>
    </div>,
    document.body,
  );
}
