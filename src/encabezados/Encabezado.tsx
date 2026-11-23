import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { useEstilo } from "../estilos/Estilo";
import { TextoCinetico } from "../estilos/TextoCinetico";
import type { TextoEfecto } from "../estilos/estilos";
import { EfectoPagina } from "../efectos/EfectoPagina";
import type { EfectoId, Variante } from "../efectos/tokens";
import { BotonesPack, type EnlaceBoton } from "../piezas/BotonesPack";
import type { PackBotonId } from "../piezas/packs";
import { imagenGenerada } from "../plantillas/imagenes";
import { CSS_ENCABEZADO } from "./css";
import type { ComposicionId, EntradaId } from "./catalogo";
import { CapasEscena, CAPAS_POR_DEFECTO, type Capa } from "../escena/CapasProfundidad";
import { LuzEscena, type ModoLuz } from "../escena/LuzYReflejo";
import { useMovimientoEscena, type FuenteMovimiento } from "../escena/movimiento";
import { ShaderFondo, type ShaderId } from "../escena/ShaderFondo";
import { Objeto3DCss, type FormaObjeto } from "../escena/Objeto3DCss";
import { EscenaVideo } from "../escena/EscenaVideo";
import { useNivelEscena, type ModoAhorro, type NivelEscena } from "../escena/nivel";

/** Cómo se va el encabezado al bajar (animación de scroll nativa; donde el navegador no la tiene, no se anima). */
export type SalidaEncabezado = "ninguna" | "achicar" | "desvanecer" | "abrir";
export const SALIDAS: Record<SalidaEncabezado, string> = {
  ninguna: "Sin salida",
  achicar: "Se achica al bajar",
  desvanecer: "Sube y se desvanece",
  abrir: "Se abre (texto arriba, foto abajo)",
};
export const SALIDA_IDS = Object.keys(SALIDAS) as SalidaEncabezado[];

/** Objeto protagonista: un video con fondo transparente o un objeto en 3D hecho con CSS. */
export type ObjetoEncabezado =
  | { tipo: "video"; webm?: string; hevc?: string; mp4?: string; poster: string; alt?: string }
  | { tipo: "3d"; forma: FormaObjeto; caras?: string[]; texto?: string; etiqueta?: string };

/** Alto del encabezado: un tamaño con nombre o un número en % del alto de la pantalla (de 20 a 100). */
export type AltoEncabezado = "pantalla" | "grande" | "medio" | "compacto" | "auto" | number;

export const ALTOS: Record<Exclude<AltoEncabezado, number>, { nombre: string; css: string }> = {
  pantalla: { nombre: "Pantalla completa", css: "92svh" },
  grande: { nombre: "Grande", css: "78svh" },
  medio: { nombre: "Medio", css: "62svh" },
  compacto: { nombre: "Compacto", css: "44svh" },
  auto: { nombre: "Solo el contenido", css: "0px" },
};
export const ALTO_IDS = Object.keys(ALTOS) as Exclude<AltoEncabezado, number>[];

const altoCss = (a: AltoEncabezado) => (typeof a === "number" ? `${Math.max(20, Math.min(100, Math.round(a)))}svh` : ALTOS[a].css);

export interface EncabezadoProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  composicion?: ComposicionId;
  entrada?: EntradaId;
  antetitulo?: string;
  /** Título. Una palabra entre asteriscos (`*Smash* burgers`) se resalta. */
  titulo: string;
  bajada?: string;
  boton?: EnlaceBoton;
  botonSecundario?: EnlaceBoton;
  /** Pack de botones; por defecto el del estilo. */
  pack?: PackBotonId;
  /** Efecto de fondo animado (opcional). */
  efecto?: EfectoId;
  variante?: Variante;
  /** Efecto del título; por defecto el del estilo. */
  efectoTexto?: TextoEfecto;
  /** Fotos (URL). La primera se usa en dividido, tarjeta e imagen; viñetas usa tres. Sin fotos, ilustraciones del estilo. */
  imagenes?: string[];
  alt?: string;
  /** Datos cortos: horario, dirección, precio desde… (se ven como etiquetas o, en póster y boleto, como columna). */
  datos?: string[];
  /** Alto: «pantalla» (casi toda la altura), «grande», «medio», «compacto», «auto» o un número (% del alto de la pantalla). */
  alto?: AltoEncabezado;
  /** Alto cuando el encabezado mide 640 px o menos de ancho (celular). Por defecto, el mismo `alto`. */
  altoCelular?: AltoEncabezado;
  /** Capas en profundidad (efecto 2.5D): `true` usa formas con los colores del estilo; o una lista de capas propias. */
  profundidad?: boolean | Capa[];
  /** Luz que sigue al dedo o brillo que cruza. */
  luz?: ModoLuz;
  /** Con qué se mueven las capas y la luz. Por defecto, dedo o cursor y scroll. */
  mover?: FuenteMovimiento[];
  /** Fondo animado con WebGL (aurora, líquido, humo, foco de luz). */
  shader?: ShaderId;
  /** Imagen fija de fondo: se ve al instante y queda sola con ahorro de datos. */
  poster?: string;
  /** Objeto protagonista: video con fondo transparente o objeto 3D. En «dividido» ocupa el lugar de la foto. */
  objeto?: ObjetoEncabezado;
  /** Cómo se va al bajar. */
  salida?: SalidaEncabezado;
  /**
   * «auto» (por defecto): con ahorro de datos, conexión lenta o poca memoria queda quieto, y si el teléfono se traba
   * en los primeros segundos pasa a liviano. «siempre» lo deja quieto; «nunca» lo deja todo.
   */
  ahorro?: ModoAhorro;
  /** Avisa el nivel con que quedó (completo, liviano o quieto). */
  alCambiarNivel?: (nivel: NivelEscena) => void;
}

/**
 * Encabezado de página (la portada que llama la atención): 12 composiciones y 7 entradas.
 * Todo son datos, así que el cliente puede editarlo desde un formulario.
 */
export function Encabezado({
  composicion = "izquierda", entrada = "cascada", antetitulo, titulo, bajada, boton, botonSecundario, pack,
  efecto, variante = 1, efectoTexto, imagenes, alt = "", datos, alto = "pantalla", altoCelular, profundidad, luz, mover,
  shader, poster, objeto, salida = "ninguna", ahorro = "auto", alCambiarNivel, className, style, ...resto
}: EncabezadoProps) {
  useStyles("encabezado", CSS_ENCABEZADO);
  const estilo = useEstilo();
  const [listo, setListo] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => setListo(true), []);
  const capas = profundidad === true ? CAPAS_POR_DEFECTO : Array.isArray(profundidad) && profundidad.length ? profundidad : null;
  const nivel = useNivelEscena({ ahorro, medirFluidez: Boolean(shader || capas || luz || objeto || efecto) });
  useEffect(() => alCambiarNivel?.(nivel), [nivel, alCambiarNivel]);
  const quieto = nivel === "quieto";
  const liviano = nivel !== "completo";
  useMovimientoEscena(ref, { mover, apagado: quieto || (!capas && luz !== "puntero" && !shader && objeto?.tipo !== "3d") });
  const protagonista = objeto && (
    <div className="mk-enc-objeto">
      {objeto.tipo === "video" ? (
        <EscenaVideo webm={objeto.webm} hevc={objeto.hevc} mp4={objeto.mp4} poster={objeto.poster} alt={objeto.alt ?? alt} quieto={liviano} />
      ) : (
        <Objeto3DCss forma={objeto.forma} caras={objeto.caras} texto={objeto.texto} etiqueta={objeto.etiqueta} girar={!quieto} tam={objeto.forma === "tarjeta" ? 300 : 220} />
      )}
    </div>
  );

  // Ajuste automático: si el cliente escribe una palabra muy larga, el título se achica hasta que quepa.
  useLayoutEffect(() => {
    const h = ref.current?.querySelector<HTMLElement>(".mk-enc-titulo");
    if (!h) return;
    const ajustar = () => {
      h.style.fontSize = "";
      const ancho = h.clientWidth;
      let max = 0;
      h.querySelectorAll<HTMLElement>(".mk-tc-palabra").forEach((p) => { max = Math.max(max, p.offsetWidth); });
      if (max > ancho && ancho > 0) h.style.fontSize = `${parseFloat(getComputedStyle(h).fontSize) * (ancho / max) * 0.97}px`;
    };
    ajustar();
    const fuentes = (document as Document & { fonts?: FontFaceSet }).fonts;
    fuentes?.ready.then(ajustar);
    if (typeof ResizeObserver === "undefined") return;
    const o = new ResizeObserver(ajustar);
    o.observe(ref.current!);
    return () => o.disconnect();
  }, [titulo, composicion, efectoTexto]);

  const foto = (k: number) => imagenes?.[k] ?? imagenGenerada(estilo?.id ?? "neon", [300, 40, 190][k % 3]);
  const media = (k = 0) => (
    <div className="mk-enc-media" key={k}>
      <img src={foto(k)} alt={k === 0 ? alt : ""} decoding="async" />
    </div>
  );
  const ante = antetitulo && <p className="mk-enc-ante">{antetitulo}</p>;
  const tit = <TextoCinetico como="h1" className="mk-enc-titulo" texto={titulo} efecto={efectoTexto ?? estilo?.texto[0] ?? "revelar"} cuando="siempre" retraso={entrada === "telon" ? 900 : entrada === "foco" ? 600 : 150} />;
  const baj = bajada && <p className="mk-enc-bajada">{bajada}</p>;
  const dat = datos && datos.length > 0 && <ul className="mk-enc-datos">{datos.map((d) => <li key={d}>{d}</li>)}</ul>;
  const bot = boton && (
    <div className="mk-enc-botones">
      <BotonesPack pack={pack ?? estilo?.pack ?? "clasico"} principal={boton} secundario={botonSecundario} />
    </div>
  );

  let caja: ReactNode;
  switch (composicion) {
    case "gigante":
      caja = <div className="mk-enc-caja">{ante}{tit}<div className="mk-enc-pie"><div>{baj}{dat}</div>{bot}</div></div>;
      break;
    case "poster":
      caja = <div className="mk-enc-caja">{ante}{tit}<div className="mk-enc-lado">{baj}{dat}</div>{bot}</div>;
      break;
    case "letrero":
    case "pantalla":
      caja = <div className="mk-enc-marco"><div className="mk-enc-caja">{ante}{tit}{baj}{dat}{bot}</div></div>;
      break;
    case "boleto":
      caja = (
        <div className="mk-enc-marco">
          <div className="mk-enc-caja">{ante}{tit}{baj}{bot}</div>
          <div className="mk-enc-talon" aria-hidden={datos?.length ? undefined : "true"}>
            {datos?.length ? datos.map((d, i) => (i === 0 ? <b key={d}>{d}</b> : <span key={d}>{d}</span>)) : <><span>Entrada</span><b>Nº 0001</b><span>Admite uno</span></>}
          </div>
        </div>
      );
      break;
    default:
      caja = <div className="mk-enc-caja">{ante}{tit}{baj}{dat}{bot}</div>;
  }

  const fondoFoto = composicion === "tarjeta" || composicion === "imagen";
  return (
    <header
      {...resto}
      ref={ref}
      className={`mk-enc${className ? " " + className : ""}`}
      data-composicion={composicion}
      data-entrada={entrada}
      data-alto={typeof alto === "number" ? "numero" : alto}
      data-profundidad={capas && !quieto ? "" : undefined}
      data-nivel={nivel}
      data-salida={salida !== "ninguna" ? salida : undefined}
      data-objeto={objeto ? objeto.tipo : undefined}
      data-listo={listo ? "" : undefined}
      style={{ ...style, "--mk-enc-alto": altoCss(alto), ...(altoCelular !== undefined ? { "--mk-enc-alto-celular": altoCss(altoCelular) } : {}) } as CSSProperties}
    >
      {poster && <img className="mk-enc-poster" src={poster} alt="" decoding="async" fetchPriority="high" />}
      {shader && (liviano ? <div className="mk-shader" data-tipo={shader} aria-hidden="true" /> : <ShaderFondo tipo={shader} />)}
      {fondoFoto && media(0)}
      {efecto && !quieto && <EfectoPagina id={efecto} variante={variante} />}
      {capas && <CapasEscena capas={capas} />}
      {luz && !liviano && <LuzEscena modo={luz} />}
      {composicion === "marquesina" && (
        <div className="mk-enc-cinta" aria-hidden="true">
          {[0, 1].map((f) => (
            <div key={f}>{Array.from({ length: 6 }, (_, k) => <span key={k}>{titulo.replace(/\*/g, "")}</span>)}</div>
          ))}
        </div>
      )}
      <div className="mk-enc-in">
        {caja}
        {composicion === "dividido" && (protagonista || media(0))}
        {composicion === "vinetas" && <div className="mk-enc-paneles">{[0, 1, 2].map((k) => media(k))}</div>}
      </div>
      {composicion !== "dividido" && protagonista}
      <div className="mk-enc-telon" aria-hidden="true"><i /><i /></div>
    </header>
  );
}
