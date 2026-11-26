// Ramas (relato de página «ramas»): el tronco y las ramas de `trazarRamas`, en un SVG del tamaño de la página. Van
// sobre el fondo de los bloques pero bajo su contenido: se cortan (con una máscara) donde hay un texto, una foto, una
// tarjeta o un botón, así parecen pasar por detrás de él y nunca tapan lo que se lee. Las que chocan lo hacen con ese
// contenido (o con el borde de la página), y ahí va su chispa. El navegador las dibuja atadas al scroll: después de
// medir no corre código. Se vuelve a medir cuando algo cambia (tamaño, orden de los bloques, estilo, fuentes), como los
// hilos. Donde la página no baja (una vista previa achicada), van enteras y quietas. Se baja aparte (lo carga
// `PaginaRelato`, que ya mide el ancho y el alto de la página).
import { useId, useMemo, useRef, type CSSProperties, type RefObject } from "react";
import { useStyles } from "../../utils/styles";
import { useMedidaFina } from "../hilos/useMedidaFina";
import { trazarRamas, type Caja } from "./trazar-ramas";

/** El acento: el del estilo del kit o, en una página de La Mente sin él, el suyo. */
const ACENTO = "var(--mk-acento,var(--lm-acento,#e4572e))";
/** Cuánto del scroll dura la chispa (de 0 a 100). */
const CHISPA = 3;
/** Cuánto se corta la rama alrededor del contenido (px). */
export const MARGEN_CONTENIDO = 4;
/** A cuánto del contenido choca una rama (px): la chispa (7 px, hasta 11 al apagarse) no alcanza a pisarlo. */
export const DISTANCIA_CHOQUE = 12;

export const CSS_RAMAS =
  `.mk-ramas{position:absolute;left:0;top:0;z-index:1;pointer-events:none;overflow:visible;color:${ACENTO}}` +
  ".mk-ramas path{fill:none;stroke:currentColor;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0;opacity:.7}" +
  ".mk-ramas path[data-rama=tronco]{stroke-width:3}" +
  ".mk-ramas [data-chispa] line{stroke:currentColor;stroke-width:2;stroke-linecap:round}" +
  ".mk-ramas [data-chispa]>g{opacity:0}" +
  "@keyframes mk-ramas-trazo{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}" +
  // La chispa: se abre, brilla y se apaga.
  "@keyframes mk-ramas-chispa{0%{opacity:0;scale:.2}30%{opacity:1;scale:1}100%{opacity:0;scale:1.6}}" +
  "@supports (animation-timeline:scroll()){" +
  ".mk-ramas[data-vivo] path{stroke-dashoffset:1;animation:mk-ramas-trazo linear both;animation-timeline:scroll(nearest);animation-range:var(--mk-r-d) var(--mk-r-h)}" +
  // Lo que ya se ve al cargar va dibujado desde el principio (su parte del scroll es de 0 a 0; Chromium ya la dibuja
  // entera, esto es por si otro navegador no).
  ".mk-ramas[data-vivo] path[data-ya]{animation:none;stroke-dashoffset:0}" +
  ".mk-ramas[data-vivo] [data-chispa]>g{animation:mk-ramas-chispa linear both;animation-timeline:scroll(nearest);animation-range:var(--mk-r-d) calc(var(--mk-r-d) + " + CHISPA + "%)}}";

const porciento = (n: number) => `${Math.round(n * 100) / 100}%`;
/** El tono de una rama: el acento, más claro (hacia el blanco) o más oscuro (hacia el negro). */
const tonoDe = (t: number) => (t >= 0 ? `color-mix(in srgb,currentColor ${Math.round(100 - 45 * t)}%,#fff)` : `color-mix(in srgb,currentColor ${Math.round(100 + 45 * t)}%,#000)`);
/** Los rayitos de una chispa, alrededor de su centro (hasta 7 px). */
const RAYOS = Array.from({ length: 6 }, (_, i) => {
  const a = (i * 60 * Math.PI) / 180;
  return { x1: (2.5 * Math.cos(a)).toFixed(2), y1: (2.5 * Math.sin(a)).toFixed(2), x2: (7 * Math.cos(a)).toFixed(2), y2: (7 * Math.sin(a)).toFixed(2) };
});
/** En el teléfono, la barra del navegador cambia el alto visible al bajar: eso no es otra pantalla. */
const BARRA = 120;
const crece = (c: Caja, m: number): Caja => ({ izquierda: c.izquierda - m, arriba: c.arriba - m, ancho: c.ancho + 2 * m, alto: c.alto + 2 * m });

export interface RamasProps {
  /** La página: se mide su contenido. */
  pagina: RefObject<HTMLElement | null>;
  ancho: number;
  alto: number;
  /** El alto visible (de él sale cuántas ramas van). */
  vista: number;
  /** El `slug` del negocio. */
  semilla?: string;
  /** Liviano: enteras y quietas, sin chispas. */
  quieta: boolean;
}

export default function Ramas({ pagina, ancho, alto, vista, semilla = "", quieta }: RamasProps) {
  useStyles("ramas", CSS_RAMAS);
  const mascara = `mk-ramas-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // El contenido (cada texto, foto, botón y tarjeta), si la página baja de verdad (en una vista previa achicada dentro
  // de un `overflow: hidden`, o en una página más corta que la pantalla, el scroll no la dibujaría nunca) y su scroll.
  const medida = useMedidaFina(pagina, [ancho, alto]);
  // El alto visible, sin el vaivén de la barra del navegador del teléfono (si no, toda la forma saltaría al bajar).
  const vistaFija = useRef(vista);
  const tactil = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  if (!tactil || Math.abs(vista - vistaFija.current) >= BARRA) vistaFija.current = vista;
  const vistaUsada = vistaFija.current;
  const contenido = useMemo(() => (medida ? medida.medidas.bloques.flatMap((b) => [...b.cosas, ...b.tarjetas]) : []), [medida]);
  const baja = medida?.baja ?? true;
  const scroll = useMemo(() => (medida ? { arriba: Math.round(medida.medidas.arriba), recorrido: Math.round(medida.medidas.recorrido) } : null), [medida]);
  // Con el scroll de la página, cada punto se dibuja cuando pasa por el 60 % de la pantalla (como los hilos): lo que se
  // ve al cargar, como el encabezado, ya va dibujado.
  const { tronco, tramos, ramas } = useMemo(
    () => trazarRamas(ancho, alto, { vista: vistaUsada, semilla, scroll: scroll ?? undefined, bloques: contenido.map((c) => crece(c, DISTANCIA_CHOQUE)) }),
    [ancho, alto, vistaUsada, semilla, scroll, contenido],
  );
  /** Quieta: en liviano, o donde la página no baja. */
  const sinMover = quieta || !baja;
  if (!tronco) return null;
  const tramo = (desde: number, hasta: number) => ({ "--mk-r-d": porciento(desde), "--mk-r-h": porciento(hasta) }) as CSSProperties;
  return (
    <svg className="mk-ramas" aria-hidden="true" data-vivo={sinMover ? undefined : ""} width={ancho} height={alto} viewBox={`0 0 ${ancho} ${alto}`}>
      <mask id={mascara} maskUnits="userSpaceOnUse" x={0} y={0} width={ancho} height={alto}>
        <rect width={ancho} height={alto} fill="#fff" />
        {contenido.map((c, i) => {
          const h = crece(c, MARGEN_CONTENIDO);
          return <rect key={i} data-hueco="" x={h.izquierda.toFixed(1)} y={h.arriba.toFixed(1)} width={h.ancho.toFixed(1)} height={h.alto.toFixed(1)} rx={6} fill="#000" />;
        })}
      </mask>
      <g mask={`url(#${mascara})`}>
        {tramos.map((t, i) => (
          <path key={`t${i}`} data-rama="tronco" data-ya={t.hasta === 0 ? "" : undefined} d={t.d} pathLength={1} style={tramo(t.desde, t.hasta)} />
        ))}
        {ramas.map((r, i) => (
          <path key={i} data-rama="rama" data-clase={r.clase} data-lado={r.lado} d={r.d} pathLength={1} style={{ ...tramo(r.desde, r.hasta), strokeWidth: r.grosor.toFixed(2), opacity: r.opacidad.toFixed(2), stroke: tonoDe(r.tono) }} />
        ))}
      </g>
      {!sinMover &&
        ramas.map((r, i) =>
          r.choque ? (
            <g key={`c${i}`} data-chispa="" data-x={r.choque.x.toFixed(1)} data-y={r.choque.y.toFixed(1)} transform={`translate(${r.choque.x.toFixed(1)} ${r.choque.y.toFixed(1)})`} style={{ "--mk-r-d": porciento(r.hasta), color: tonoDe(r.tono) } as CSSProperties}>
              <g>
                {RAYOS.map((y, k) => <line key={k} {...y} />)}
              </g>
            </g>
          ) : null,
        )}
    </svg>
  );
}
