// Galería: las fotos llegan como fotos impresas tiradas sobre una mesa y caen a su lugar mientras se baja (ligado al
// scroll donde el navegador lo permite; si no, en cascada al verse). Solo se mueven: nunca se esconden.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type SyntheticEvent } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { desordenDe, fotosValidas, numeroDe } from "./calculos";

export interface MosaicoQueSeArmaProps extends ComunesMomento {
  fotos: { url: string; pie?: string }[];
  /** El `slug` del negocio: decide cómo caen. */
  semilla?: string;
  /** Foto viva: la foto que se toca ondula (WebGL, solo en nivel completo). */
  viva?: boolean;
  /** Orígenes cuyas fotos permiten CORS (para la foto viva). */
  origenesFotos?: string[];
  /** Visor: un toque en una foto la abre y crece hasta llenar la pantalla. */
  visor?: boolean;
}


const DESORDEN = "translate(var(--x),var(--y)) rotate(var(--giro)) scale(1.08)";

export const CSS_MOSAICO =
  ".mk-m-mosaico{overflow-x:clip;overflow-clip-margin:12px}" +
  ".mk-m-mosaico-grilla{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}" +
  ".mk-m-foto{--giro:var(--giro-semilla);position:relative;margin:0;padding:6px 6px 0;background:#fff;color:#1d1d1b;border-radius:4px;box-shadow:0 10px 24px -12px rgba(0,0,0,.55)}" +
  ".mk-m-foto img{display:block;width:100%;aspect-ratio:1;object-fit:cover;background:#ddd}" +
  ".mk-m-foto figcaption{padding:6px 2px 8px;font-size:.8rem;line-height:1.2;min-height:1.2em}" +
  ".mk-m-foto-abrir{display:block;position:relative;width:100%;padding:0;border:0;background:none;color:inherit;font:inherit;cursor:zoom-in}" +
  ".mk-m-foto-abrir:focus-visible{outline:3px solid var(--mk-m-acento);outline-offset:2px}" +
  ".mk-m-mosaico[data-nivel=liviano] .mk-m-foto{--giro:0deg}" +
  ".mk-m-mosaico:not([data-nivel=quieto]):not([data-activo]) .mk-m-foto{transform:" + DESORDEN + "}" +
  ".mk-m-mosaico[data-activo]:not([data-nivel=quieto]) .mk-m-foto{transition:transform var(--mk-resorte-ms) var(--mk-resorte-curva) calc(var(--i)*70ms)}" +
  "@supports (animation-timeline:view()){.mk-m-mosaico:not([data-nivel=quieto]) .mk-m-foto{animation:mk-m-foto linear both;animation-timeline:view();animation-range:entry 0% cover 35%}}" +
  "@keyframes mk-m-foto{from{transform:" + DESORDEN + "}to{transform:none}}";

const SIN_ORIGENES: string[] = [];

export function MosaicoQueSeArma({ fotos, semilla = "", viva, origenesFotos = SIN_ORIGENES, visor, nivel: forzado, ahorro, className }: MosaicoQueSeArmaProps) {
  useStyles("momento-mosaico", CSS_MOSAICO);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const lista = fotosValidas(fotos).slice(0, 12);
  const desorden = useMemo(() => desordenDe(lista.length, numeroDe(semilla)), [lista.length, semilla]);
  // Foto viva y visor: los gestos se atienden en un archivo que se baja aparte con el primer toque.
  const grilla = useRef<HTMLDivElement>(null);
  const cargado = useRef(false);
  const [visorAbierto, setVisorAbierto] = useState<ReactNode>(null);
  const conOndas = Boolean(viva) && nivel === "completo";
  const gesto = (e: SyntheticEvent) => {
    const ev = e.nativeEvent;
    cargado.current = true;
    void import("../fotos/gestos")
      .then((m) => m.atender(ev, { ondas: conOndas, visor: Boolean(visor), fotos: lista, origenes: origenesFotos, nivel }, setVisorAbierto))
      .catch(() => {});
  };
  // La última grilla que existió: al desmontar, React ya soltó la referencia, y si al montar no había fotos todavía
  // no había grilla.
  const ultimaGrilla = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (grilla.current) ultimaGrilla.current = grilla.current;
  });
  useEffect(
    () => () => {
      const g = ultimaGrilla.current;
      if (cargado.current && g) void import("../fotos/gestos").then((m) => m.soltar(g)).catch(() => {});
    },
    [],
  );
  if (!lista.length) return null;
  // El pie ya dice qué es la foto: el alt vacío evita que se lea dos veces.
  const foto = (url: string) => <img src={url} alt="" loading="lazy" decoding="async" />;
  return (
    <div ref={ref} className={["mk-momento mk-m-mosaico", className].filter(Boolean).join(" ")} data-momento="mosaico" data-nivel={nivel} data-activo={activo ? "" : undefined}>
      <div
        ref={grilla}
        className="mk-m-mosaico-grilla"
        onPointerOver={conOndas ? gesto : undefined}
        onPointerDown={conOndas || visor ? gesto : undefined}
        // Con gestos sobre las fotos, el navegador no debe iniciar su propio «arrastrar imagen»: se traga el resto del
        // gesto y el toque que sigue (en Safari, después de arrastrar, el toque siguiente no abría el visor).
        onDragStart={conOndas || visor ? (e) => e.preventDefault() : undefined}
        onClick={visor ? gesto : undefined}
      >
        {lista.map((f, i) => (
          <figure
            key={`${f.url}-${i}`}
            className="mk-m-foto"
            style={{ "--x": `${desorden[i].x}px`, "--y": `${desorden[i].y}px`, "--giro-semilla": `${desorden[i].giro}deg`, "--i": i } as CSSProperties}
          >
            {visor ? (
              // Con visor, la foto es un botón (se abre también con el teclado).
              <button type="button" className="mk-m-foto-abrir" aria-label={f.pie ? `Ver foto: ${f.pie}` : `Ver foto ${i + 1} de ${lista.length}`}>
                {foto(f.url)}
              </button>
            ) : (
              foto(f.url)
            )}
            {f.pie && <figcaption>{f.pie}</figcaption>}
          </figure>
        ))}
      </div>
      {visorAbierto}
    </div>
  );
}
