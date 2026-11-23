import { useRef, type CSSProperties, type HTMLAttributes, type PointerEvent as PE } from "react";
import { useStyles } from "../utils/styles";
import { CSS_ESCENA } from "./css";

export type FormaObjeto = "caja" | "lata" | "tarjeta";

export const FORMAS_OBJETO: Record<FormaObjeto, string> = {
  caja: "Caja (6 caras)",
  lata: "Lata o vaso (cilindro con etiqueta)",
  tarjeta: "Tarjeta (frente y reverso)",
};

export interface Objeto3DCssProps extends HTMLAttributes<HTMLDivElement> {
  forma?: FormaObjeto;
  /**
   * Fotos de las caras. Caja: frente, derecha, atrás, izquierda, arriba, abajo (las que falten van de color).
   * Lata: la etiqueta completa (una foto ancha que da la vuelta). Tarjeta: frente y reverso.
   */
  caras?: string[];
  /** Texto en la cara del frente cuando no hay foto. */
  texto?: string;
  /** Tamaño en píxeles (alto de la caja o de la lata, ancho de la tarjeta). */
  tam?: number;
  /** Gira solo. Al arrastrarlo con el dedo se detiene y gira con el dedo. */
  girar?: boolean;
  /** Descripción para lectores de pantalla. */
  etiqueta?: string;
}

const LADOS = 20;

/**
 * Objeto con volumen hecho con CSS 3D (sin WebGL ni librerías): caja, lata o tarjeta, con sombra y brillo.
 * Se inclina con el dedo o el cursor si quien lo contiene tiene `--mk-cx` y `--mk-cy`, y se puede girar arrastrando.
 */
export function Objeto3DCss({ forma = "caja", caras = [], texto, tam = 220, girar = true, etiqueta, className, style, ...resto }: Objeto3DCssProps) {
  useStyles("escena", CSS_ESCENA);
  const ref = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ x: number; giro: number } | null>(null);
  const giro = useRef(0);

  const bajar = (e: PE<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX, giro: giro.current };
    el.dataset.arrastrando = "";
  };
  const mover = (e: PE<HTMLDivElement>) => {
    const a = arrastre.current;
    const el = ref.current;
    if (!a || !el) return;
    giro.current = a.giro + (e.clientX - a.x) * 0.6;
    el.style.setProperty("--mk-obj-giro", `${giro.current}deg`);
  };
  const soltar = () => {
    arrastre.current = null;
    if (ref.current) delete ref.current.dataset.arrastrando;
  };

  const cara = (i: number, estilo: CSSProperties, conTexto = false) => (
    <div key={i} className="mk-obj-cara" style={{ ...estilo, ...(caras[i] ? { backgroundImage: `url("${caras[i]}")` } : {}) }} data-cara={i}>
      {conTexto && !caras[i] && texto && <span>{texto}</span>}
    </div>
  );

  let cuerpo;
  if (forma === "caja") {
    const m = tam / 2;
    const tr = ["", "rotateY(90deg)", "rotateY(180deg)", "rotateY(-90deg)", "rotateX(90deg)", "rotateX(-90deg)"];
    cuerpo = tr.map((t, i) => cara(i, { width: tam, height: tam, transform: `${t} translateZ(${m}px)` }, i === 0));
  } else if (forma === "lata") {
    const radio = tam * 0.3;
    const ancho = (2 * Math.PI * radio) / LADOS + 0.6;
    const vuelta = ancho * LADOS;
    cuerpo = [
      ...Array.from({ length: LADOS }, (_, i) => (
        <div
          key={i}
          className="mk-obj-cara mk-obj-tira"
          style={{
            width: ancho, height: tam, transform: `rotateY(${(i * 360) / LADOS}deg) translateZ(${radio}px)`,
            ...(caras[0] ? { backgroundImage: `url("${caras[0]}")`, backgroundSize: `${vuelta}px ${tam}px`, backgroundPosition: `${-i * (ancho - 0.6)}px 0` } : {}),
          }}
        />
      )),
      <div key="arriba" className="mk-obj-tapa" style={{ width: radio * 2, height: radio * 2, transform: `rotateX(90deg) translateZ(${tam / 2}px)` }} />,
      <div key="abajo" className="mk-obj-tapa" style={{ width: radio * 2, height: radio * 2, transform: `rotateX(-90deg) translateZ(${tam / 2}px)` }} />,
    ];
  } else {
    const alto = tam / 1.586;
    cuerpo = [
      cara(0, { width: tam, height: alto, transform: "translateZ(2px)" }, true),
      cara(1, { width: tam, height: alto, transform: "rotateY(180deg) translateZ(2px)" }),
    ];
  }

  return (
    <div
      {...resto}
      ref={ref}
      className={`mk-obj${className ? " " + className : ""}`}
      data-forma={forma}
      data-girar={girar ? "" : undefined}
      role="img"
      aria-label={etiqueta ?? texto ?? "Objeto en 3D"}
      style={{ ...style, "--mk-obj-tam": `${tam}px` } as CSSProperties}
      onPointerDown={bajar}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
    >
      <div className="mk-obj-sombra" aria-hidden="true" />
      <div className="mk-obj-giro">
        <div className="mk-obj-cuerpo">{cuerpo}</div>
      </div>
      {forma === "lata" && <div className="mk-obj-brillo" aria-hidden="true" style={{ width: tam * 0.6, height: tam }} />}
    </div>
  );
}
