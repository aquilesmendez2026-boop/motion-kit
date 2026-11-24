// Avisos: la franja se despliega y su texto se descifra una vez, corto. El tono «celebración» suelta un poco de
// confeti. Conserva el enlace «Ver más» y el botón de cerrar. Para lectores de pantalla el texto real va aparte, en
// un span que no se ve (un `aria-label` sobre un párrafo no se lee): las letras que se descifran quedan ocultas para ellos.
import { useEffect, useRef, useState } from "react";
import { useStyles } from "../utils/styles";
import { grafemas } from "../utils/grafemas";
import { descifrar } from "../estilos/descifrar";
import { useMomento, type ComunesMomento } from "./base";
import { esEnlaceSeguro, numeroDe } from "./calculos";
import { Confeti } from "./perezosos";

export interface AvisoQueSeDespliegaProps extends ComunesMomento {
  texto: string;
  /** A dónde lleva «Ver más». Si no es un enlace seguro, no se dibuja. */
  enlace?: string;
  tono: "info" | "importante" | "celebracion";
  /** Se llama al cerrar. Recordar que se cerró es cosa de quien usa la pieza. */
  alCerrar?: () => void;
}

/** Lo más que dura el descifrado del aviso (ms): es un aviso, no un título. */
const TOPE = 800;

export const CSS_AVISO =
  ".mk-m-aviso{display:flex;align-items:center;justify-content:center;gap:6px 14px;flex-wrap:wrap;padding:6px 52px 6px 14px;min-height:48px;text-align:center;" +
  "transform-origin:50% 0;background:var(--mk-m-superficie);border-bottom:1px solid color-mix(in srgb,var(--mk-m-texto) 18%,transparent)}" +
  ".mk-m-aviso[data-tono=importante]{background:var(--mk-m-acento);color:var(--mk-m-sobre);border-color:transparent}" +
  ".mk-m-aviso[data-tono=celebracion]{background:color-mix(in srgb,var(--mk-m-acento) 22%,var(--mk-m-superficie))}" +
  ".mk-m-aviso-texto{margin:0;font-weight:600}" +
  // Cada palabra va entera a la línea siguiente; una más ancha que la franja (una dirección web) se parte por dentro.
  ".mk-m-aviso-palabra{display:inline-block;max-width:100%}" +
  ".mk-m-aviso-texto .mk-tc-l{display:inline-block}" +
  ".mk-m-aviso-enlace{color:inherit;font-weight:700;text-underline-offset:3px;padding:10px 4px}" +
  ".mk-m-aviso-cerrar{position:absolute;right:4px;top:50%;translate:0 -50%;width:44px;height:44px;display:grid;place-items:center;border:0;border-radius:50%;background:transparent;color:inherit;font:inherit;font-size:1.3rem;line-height:1;cursor:pointer}" +
  ".mk-m-aviso :is(a,button):focus-visible{outline:3px solid currentColor;outline-offset:1px}" +
  ".mk-m-aviso-confeti{position:absolute;left:0;right:0;top:0;height:300px;pointer-events:none}" +
  // Se despliega desde arriba sin esconder el texto (parte ya a la vista, un poco aplastada).
  ".mk-m-aviso[data-activo][data-nivel=completo]{animation:mk-m-despliega var(--mk-resorte-ms,500ms) var(--mk-resorte-curva,cubic-bezier(.2,.8,.2,1)) both}" +
  "@keyframes mk-m-despliega{from{transform:scaleY(.55)}to{transform:none}}";

export default function AvisoQueSeDespliega({ texto, enlace, tono, alCerrar, nivel: forzado, ahorro, className }: AvisoQueSeDespliegaProps) {
  useStyles("momento-aviso", CSS_AVISO);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const [cerrado, setCerrado] = useState(false);
  const letras = useRef<HTMLSpanElement>(null);
  const limpio = typeof texto === "string" ? texto.trim() : "";
  useEffect(() => {
    const el = letras.current;
    if (!el || !activo || nivel !== "completo" || cerrado) return;
    return descifrar(el, numeroDe(limpio), TOPE);
  }, [limpio, activo, nivel, cerrado]);
  if (!limpio || cerrado) return null;
  return (
    <div ref={ref} className={["mk-momento mk-m-aviso", className].filter(Boolean).join(" ")} data-momento="aviso" data-tono={tono} data-nivel={nivel} data-activo={activo ? "" : undefined}>
      <p className="mk-m-aviso-texto">
        <span className="mk-m-lector">{limpio}</span>
        {/* Con un texto nuevo van letras nuevas: el descifrado escribe en ellas. */}
        <span ref={letras} aria-hidden="true" key={limpio}>
          {limpio.split(/(\s+)/).map((trozo, i) =>
            /^\s+$/.test(trozo) ? (
              <span key={i}> </span>
            ) : (
              <span key={i} className="mk-m-aviso-palabra">
                {grafemas(trozo).map((ch, j) => <span key={j} className="mk-tc-l">{ch}</span>)}
              </span>
            ),
          )}
        </span>
      </p>
      {typeof enlace === "string" && esEnlaceSeguro(enlace) && <a className="mk-m-aviso-enlace" href={enlace}>Ver más</a>}
      <button
        type="button"
        className="mk-m-aviso-cerrar"
        aria-label="Cerrar aviso"
        onClick={() => {
          setCerrado(true);
          alCerrar?.();
        }}
      >
        <span aria-hidden="true">×</span>
      </button>
      {tono === "celebracion" && activo && nivel === "completo" && (
        <span className="mk-m-aviso-confeti" aria-hidden="true"><Confeti semilla={numeroDe(limpio)} n={24} /></span>
      )}
    </div>
  );
}
