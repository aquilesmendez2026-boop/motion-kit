// Precio que rueda: cada cifra gira como un cuentakilómetros hasta el precio, al verse y cuando cambia el valor.
import { useEffect, useState, type CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { formatoPesos } from "./calculos";

export interface PrecioQueRuedaProps extends ComunesMomento {
  /** Pesos enteros. */
  valor: number;
  moneda?: "CLP";
}

export const CSS_PRECIO =
  ".mk-m-precio{display:inline-block;font-variant-numeric:tabular-nums;line-height:1}" +
  ".mk-m-precio-cifras{display:inline-flex}" +
  // Cada columna mide lo que mide su cifra final (con letras de números de ancho variable, el «1» no deja hueco); el
  // rodillo va centrado encima y se recorta.
  ".mk-m-rueda{position:relative;display:inline-block;height:1em;overflow:hidden}" +
  ".mk-m-ancho{visibility:hidden}" +
  ".mk-m-tira{position:absolute;top:0;left:0;right:0;display:flex;flex-direction:column;align-items:center;transform:translateY(calc(var(--d)*-10%))}" +
  ".mk-m-tira span{height:1em}" +
  ".mk-m-precio[data-fase=cero] .mk-m-tira{transform:none}" +
  ".mk-m-precio[data-fase=rueda]:not([data-nivel=quieto]) .mk-m-tira{transition:transform var(--mk-resorte-ms) var(--mk-resorte-curva) calc(var(--j)*60ms)}";

const CIFRAS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function PrecioQueRueda({ valor, nivel: forzado, ahorro, className }: PrecioQueRuedaProps) {
  useStyles("momento-precio", CSS_PRECIO);
  const { ref, nivel, activo } = useMomento<HTMLSpanElement>({ nivel: forzado, ahorro });
  // final: quieto en el precio (antes de verse). cero: un cuadro en cero. rueda: gira hasta el precio.
  const [fase, setFase] = useState<"final" | "cero" | "rueda">("final");
  useEffect(() => {
    if (!activo || nivel === "quieto") return;
    setFase("cero");
    let b = 0;
    const a = requestAnimationFrame(() => (b = requestAnimationFrame(() => setFase("rueda"))));
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [activo, nivel]);
  const texto = formatoPesos(valor);
  if (!texto) return null;
  const chars = [...texto];
  return (
    <span ref={ref} className={["mk-momento mk-m-precio", className].filter(Boolean).join(" ")} data-momento="precio" data-nivel={nivel} data-activo={activo ? "" : undefined} data-fase={fase}>
      <span className="mk-m-lector">{texto}</span>
      <span className="mk-m-precio-cifras" aria-hidden="true">
        {chars.map((c, j) =>
          /\d/.test(c) ? (
            <span key={`c${chars.length - j}`} className="mk-m-rueda">
              <span className="mk-m-ancho">{c}</span>
              <span className="mk-m-tira" style={{ "--d": Number(c), "--j": j } as CSSProperties}>
                {CIFRAS.map((x) => <span key={x}>{x}</span>)}
              </span>
            </span>
          ) : (
            <span key={`s${chars.length - j}`}>{c}</span>
          ),
        )}
      </span>
    </span>
  );
}
