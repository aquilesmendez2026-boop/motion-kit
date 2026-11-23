import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
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
import { ALTOS, type AltoEncabezado, type ComposicionId, type EntradaId, type SalidaEncabezado } from "./catalogo";
import { CapasEscena, CAPAS_POR_DEFECTO, type Capa } from "../escena/CapasProfundidad";
import { LuzEscena, type ModoLuz } from "../escena/LuzYReflejo";
import { useMovimientoEscena, type FuenteMovimiento } from "../escena/movimiento";
import type { ShaderId } from "../escena/ShaderFondo";
import type { FormaObjeto } from "../escena/Objeto3DCss";

// Lo pesado y opcional se carga aparte, solo si el encabezado lo usa (peso de motion-kit/encabezado).
const ShaderFondo = lazy(() => import("../escena/ShaderFondo").then((m) => ({ default: m.ShaderFondo })));
const Objeto3DCss = lazy(() => import("../escena/Objeto3DCss").then((m) => ({ default: m.Objeto3DCss })));
const EscenaVideo = lazy(() => import("../escena/EscenaVideo").then((m) => ({ default: m.EscenaVideo })));
import { useNivelEscena, type ModoAhorro, type NivelEscena } from "../escena/nivel";
import { Apertura, aperturaYaVista } from "./Apertura";
import { Tomas } from "./Tomas";
import { PalabrasRotan } from "./PalabrasRotan";
import { BarraEncabezado } from "./BarraEncabezado";
import { EstadoNegocio, type DatosEstado } from "./EstadoNegocio";
import { franjaDe } from "../receta/hora";
import type { Tratamiento } from "../receta/receta";

export { ALTOS, ALTO_IDS, SALIDAS, SALIDA_IDS } from "./catalogo";
export type { AltoEncabezado, SalidaEncabezado } from "./catalogo";

/** Objeto protagonista: un video con fondo transparente o un objeto en 3D hecho con CSS. */
export type ObjetoEncabezado =
  | { tipo: "video"; webm?: string; hevc?: string; mp4?: string; poster: string; alt?: string }
  | { tipo: "3d"; forma: FormaObjeto; caras?: string[]; texto?: string; etiqueta?: string };

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
  /** Apertura de película la primera vez de la sesión: franjas que se abren, «presenta» y el título. */
  apertura?: { presenta?: string };
  /** Las fotos (dos o más) se suceden con un acercamiento lento, donde la composición usa foto. */
  tomas?: boolean;
  /** Palabras que rotan en la palabra resaltada del título (la del título va primero). */
  palabras?: string[];
  /** Con salida «barra»: la página ya tiene su barra (La Mente); el encabezado solo se achica. */
  barraPropia?: boolean;
  /** Para la barra: logo (URL) y nombre del negocio. */
  logo?: string;
  nombre?: string;
  /** Muestra el estado del negocio (abierto, cerrado, próxima hora) con `estadoNegocio`. */
  estado?: boolean;
  estadoNegocio?: DatosEstado;
  /** El título relleno con la primera foto (o el póster). Sin foto o si no carga, el título queda con su color. */
  fotoEnLetras?: boolean;
  /** Tratamiento de las fotos: duotono con el acento, grano, trama de puntos o blanco y negro. */
  tratamiento?: Tratamiento;
  /** Tinte según la hora (mañana, tarde, noche). */
  horaDelDia?: boolean;
  /** La hora a usar (por defecto, la del teléfono). Para el editor y las pruebas. */
  ahora?: Date;
}

/**
 * Encabezado de página (la portada que llama la atención): 12 composiciones y 7 entradas.
 * Todo son datos, así que el cliente puede editarlo desde un formulario.
 */
export function Encabezado({
  composicion = "izquierda", entrada = "cascada", antetitulo, titulo, bajada, boton, botonSecundario, pack,
  efecto, variante = 1, efectoTexto, imagenes, alt = "", datos, alto = "pantalla", altoCelular, profundidad, luz, mover,
  shader, poster, objeto, salida = "ninguna", ahorro = "auto", alCambiarNivel, apertura, tomas, palabras,
  barraPropia, logo, nombre, estado, estadoNegocio, fotoEnLetras, tratamiento, horaDelDia, ahora, className, style, ...resto
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
        <Suspense fallback={<img src={objeto.poster} alt={objeto.alt ?? alt} decoding="async" />}>
          <EscenaVideo webm={objeto.webm} hevc={objeto.hevc} mp4={objeto.mp4} poster={objeto.poster} alt={objeto.alt ?? alt} quieto={liviano} />
        </Suspense>
      ) : (
        <Suspense fallback={null}>
          <Objeto3DCss forma={objeto.forma} caras={objeto.caras} texto={objeto.texto} etiqueta={objeto.etiqueta} girar={!quieto} tam={objeto.forma === "tarjeta" ? 300 : 220} />
        </Suspense>
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
      // También la palabra que rota (su celda tiene el ancho de la más larga).
      h.querySelectorAll<HTMLElement>(".mk-tc-palabra, .mk-rot").forEach((p) => { max = Math.max(max, p.offsetWidth); });
      if (max > ancho && ancho > 0) h.style.fontSize = `${parseFloat(getComputedStyle(h).fontSize) * (ancho / max) * 0.97}px`;
    };
    ajustar();
    const fuentes = (document as Document & { fonts?: FontFaceSet }).fonts;
    fuentes?.ready.then(ajustar);
    if (typeof ResizeObserver === "undefined") return;
    const o = new ResizeObserver(ajustar);
    o.observe(ref.current!);
    return () => o.disconnect();
  }, [titulo, composicion, efectoTexto, palabras?.join("|")]);

  // Apertura: solo en el navegador, una vez por sesión, nunca en quieto.
  const [abriendo, setAbriendo] = useState(false);
  useLayoutEffect(() => {
    if (apertura && !quieto && !aperturaYaVista()) setAbriendo(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const terminarApertura = useCallback(() => setAbriendo(false), []);
  const destacada = titulo.match(/\*([^*]+)\*/)?.[1];
  const rotacion = destacada && palabras && palabras.length ? [...new Set([destacada, ...palabras])] : undefined;

  // Foto en las letras: solo si la foto existe y carga; si no, el título queda con su color.
  const fotoLetras = fotoEnLetras ? imagenes?.[0] ?? poster : undefined;
  const [fotoLetrasOk, setFotoLetrasOk] = useState(false);
  useEffect(() => {
    setFotoLetrasOk(false);
    if (!fotoLetras || typeof Image === "undefined") return;
    const img = new Image();
    img.onload = () => setFotoLetrasOk(true);
    img.src = fotoLetras;
    return () => { img.onload = null; };
  }, [fotoLetras]);
  // Hora del día: se calcula en el navegador (en el servidor no hay hora del teléfono).
  const [hora, setHora] = useState<string | undefined>(undefined);
  useEffect(() => setHora(horaDelDia ? franjaDe(ahora ?? new Date()) : undefined), [horaDelDia, ahora]);

  const foto = (k: number) => imagenes?.[k] ?? imagenGenerada(estilo?.id ?? "neon", [300, 40, 190][k % 3]);
  const conTomas = Boolean(tomas && imagenes && imagenes.length >= 2);
  const media = (k = 0) => (
    <div className="mk-enc-media" key={k}>
      {k === 0 && conTomas ? <Tomas fotos={imagenes!} alt={alt} quieto={liviano} /> : <img src={foto(k)} alt={k === 0 ? alt : ""} decoding="async" />}
    </div>
  );
  const ante = antetitulo && <p className="mk-enc-ante">{antetitulo}</p>;
  const tit = (
    <TextoCinetico como="h1" className="mk-enc-titulo" texto={titulo} efecto={efectoTexto ?? estilo?.texto[0] ?? "revelar"} cuando="siempre"
      retraso={entrada === "telon" ? 900 : entrada === "foco" ? 600 : 150} resaltado={rotacion && <PalabrasRotan palabras={rotacion} quieto={quieto} />} />
  );
  const est = estado && estadoNegocio && <EstadoNegocio datos={estadoNegocio} />;
  const baj = (bajada || est) && <>{bajada && <p className="mk-enc-bajada">{bajada}</p>}{est}</>;
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
    <>
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
      data-foto-letras={fotoLetrasOk ? "" : undefined}
      data-tratamiento={tratamiento}
      data-hora={hora}
      data-listo={listo ? "" : undefined}
      style={{ ...style, ...(fotoLetrasOk ? { "--mk-foto-letras": `url("${fotoLetras}")` } : {}), "--mk-enc-alto": altoCss(alto), ...(altoCelular !== undefined ? { "--mk-enc-alto-celular": altoCss(altoCelular) } : {}) } as CSSProperties}
    >
      {poster && <img className="mk-enc-poster" src={poster} alt="" decoding="async" fetchPriority="high" />}
      {shader && (liviano ? <div className="mk-shader" data-tipo={shader} aria-hidden="true" /> : (
        <Suspense fallback={<div className="mk-shader" data-tipo={shader} aria-hidden="true" />}><ShaderFondo tipo={shader} /></Suspense>
      ))}
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
      {hora && <i className="mk-enc-hora" aria-hidden="true" />}
      {salida === "telon" && <div className="mk-enc-cortinas" aria-hidden="true"><i /><i /></div>}
      {abriendo && <Apertura presenta={apertura?.presenta} titulo={titulo.replace(/\*/g, "")} alTerminar={terminarApertura} />}
    </header>
    {salida === "barra" && !barraPropia && (
      <BarraEncabezado objetivo={ref} logo={logo} nombre={nombre ?? titulo.replace(/\*/g, "")} boton={boton} pack={pack ?? estilo?.pack ?? "clasico"} />
    )}
    </>
  );
}
