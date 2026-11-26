// Interruptor: encendido o apagado («Abierto» / «Cerrado»), accesible, con la perilla que corre con resorte y se achata
// un poco al apretar.
import { useStyles } from "../utils/styles";
import { c } from "./tema";

export interface InterruptorProps {
  activo: boolean;
  alCambiar: (activo: boolean) => void;
  /** Lo que enciende o apaga («Recibir pedidos»): el nombre para el lector de pantalla. */
  etiqueta: string;
  /** Lo que se lee al lado: [apagado, encendido]. */
  textos?: [string, string];
  deshabilitado?: boolean;
}

/** Se arma al montarse (lleva colores del tema): así quien no lo usa lo puede descartar. */
let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-int{display:inline-flex;align-items:center;gap:10px;min-height:44px;min-width:44px;padding:0 4px;border:0;background:none;color:inherit;font:inherit;cursor:pointer}
.mk-int:disabled{cursor:not-allowed;opacity:.55}
.mk-int-riel{position:relative;flex:none;width:46px;height:28px;border-radius:999px;background:${c("borde")}}
.mk-int[aria-checked=true] .mk-int-riel{background:${c("bien")}}
.mk-int-perilla{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);
  transition:transform .35s cubic-bezier(.34,1.56,.64,1)}
.mk-int[aria-checked=true] .mk-int-perilla{transform:translateX(18px)}
.mk-int:active .mk-int-perilla{transform:scaleX(1.15)}
.mk-int[aria-checked=true]:active .mk-int-perilla{transform:translateX(18px) scaleX(1.15)}
.mk-int:focus-visible .mk-int-riel{outline:2px solid ${c("acento")};outline-offset:2px}
@media (prefers-reduced-motion:reduce){.mk-int-perilla{transition:none}}`);

/** Un `<button role="switch">`: se cambia con clic, espacio o enter. */
export function Interruptor({ activo, alCambiar, etiqueta, textos, deshabilitado }: InterruptorProps) {
  useStyles("interruptor", estilos());
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={deshabilitado} className="mk-int" onClick={() => alCambiar(!activo)}>
      <span className="mk-int-riel" aria-hidden="true">
        <span className="mk-int-perilla" />
      </span>
      {textos && <span aria-hidden="true">{textos[activo ? 1 : 0]}</span>}
    </button>
  );
}
