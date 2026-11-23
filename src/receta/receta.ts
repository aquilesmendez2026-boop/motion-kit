// Receta del encabezado: lo que La Mente guarda y valida. La v2 suma el encabezado de película (apertura, tomas,
// foto en las letras, tratamiento, estado del negocio, palabras que rotan, barra y telón, hora del día), el fondo WebGL,
// el objeto 3D, el logo y el nombre. Una v1 sigue valiendo y se guarda como v2. El video con transparencia queda fuera.
// Este archivo no importa componentes ni React: corre igual en el navegador, en Node (pruebas, contrato) y, copiado
// como contrato, en el backend.
import { ESTILOS, ESTILO_IDS, type EstiloId, type TextoEfecto } from "../estilos/estilos";
import { PACK_IDS, type PackBotonId } from "../piezas/packs";
import {
  ALTO_IDS, COMPOSICION_IDS, ENTRADA_IDS, SALIDA_IDS,
  type AltoEncabezado, type ComposicionId, type EntradaId, type SalidaEncabezado,
} from "../encabezados/catalogo";
import type { EfectoId, Variante } from "../efectos/tokens";
import type { ModoLuz } from "../escena/LuzYReflejo";
import type { FuenteMovimiento } from "../escena/movimiento";
import type { ModoAhorro } from "../escena/nivel";
import type { ShaderId } from "../escena/ShaderFondo";
import type { FormaObjeto } from "../escena/Objeto3DCss";
import type { EncabezadoProps } from "../encabezados/Encabezado";

export const VERSION_RECETA = 2 as const;
/** Las versiones que se aceptan al validar; lo que se guarda es siempre la última. */
export const VERSIONES_RECETA = [1, 2] as const;
export type Tratamiento = "duotono" | "grano" | "trama" | "bn";

// Listas cerradas. Las que no tienen un catálogo de datos se escriben aquí como `Record<Tipo, true>`: si el tipo
// suma o pierde un valor, el typecheck falla hasta que esta lista lo siga.
const TEXTOS: Record<TextoEfecto, true> = {
  revelar: true, voltear: true, rebote: true, encender: true, glitch: true, maquina: true,
  impacto: true, temblor: true, caer: true, trailer: true, onda: true,
};
const EFECTOS: Record<EfectoId, true> = {
  cafe: true, petalos: true, pulso: true, abecedario: true, letrero: true, cometas: true,
  niebla: true, burbujas: true, olas: true, puntos: true, lluvia: true, estrellas: true,
  rejilla: true, tubo: true, ecualizador: true, velocidad: true, grano: true,
};
const LUCES: Record<ModoLuz, true> = { puntero: true, barrido: true };
const MOVIMIENTOS: Record<FuenteMovimiento, true> = { puntero: true, scroll: true, inclinacion: true };
const AHORROS: Record<ModoAhorro, true> = { auto: true, siempre: true, nunca: true };
const TRATAMIENTOS: Record<Tratamiento, true> = { duotono: true, grano: true, trama: true, bn: true };
const SHADERS: Record<ShaderId, true> = { aurora: true, liquido: true, humo: true, luz: true };
const FORMAS: Record<FormaObjeto, true> = { caja: true, lata: true, tarjeta: true };

export const LISTAS_RECETA = {
  estilo: ESTILO_IDS,
  composicion: COMPOSICION_IDS,
  entrada: ENTRADA_IDS,
  efectoTexto: Object.keys(TEXTOS) as TextoEfecto[],
  pack: PACK_IDS,
  alto: ALTO_IDS,
  efecto: Object.keys(EFECTOS) as EfectoId[],
  variante: [1, 2, 3] as Variante[],
  luz: Object.keys(LUCES) as ModoLuz[],
  mover: Object.keys(MOVIMIENTOS) as FuenteMovimiento[],
  salida: SALIDA_IDS,
  ahorro: Object.keys(AHORROS) as ModoAhorro[],
  tratamiento: Object.keys(TRATAMIENTOS) as Tratamiento[],
  shader: Object.keys(SHADERS) as ShaderId[],
  forma: Object.keys(FORMAS) as FormaObjeto[],
};

/** Topes de largo (en letras; los asteriscos del resaltado no cuentan) y de cantidad. */
export const TOPES_RECETA = {
  antetitulo: 60,
  titulo: 80,
  bajada: 220,
  datos: 4,
  dato: 40,
  botones: 2,
  textoBoton: 30,
  href: 500,
  imagenes: 3,
  imagen: 500,
  alt: 120,
  altoMinimo: 20,
  altoMaximo: 100,
  /** Alternativas a la palabra resaltada del título: con ella, rotan de 2 a 4. */
  palabras: 3,
  palabra: 24,
  presenta: 40,
  nombre: 40,
  textoObjeto: 24,
} as const;

/** Lo que se pone cuando la receta no lo trae. `efectoTexto` y `pack` salen del estilo. */
export const DEFECTOS_RECETA = {
  composicion: "izquierda" as ComposicionId,
  entrada: "cascada" as EntradaId,
  alto: "pantalla" as AltoEncabezado,
  profundidad: false,
  salida: "ninguna" as SalidaEncabezado,
  ahorro: "auto" as ModoAhorro,
  variante: 1 as Variante,
};

/**
 * Un solo protagonista: lo que se mueve sin parar. Como en La Mente (`paginas/src/diseno.mjs`), gana el primero en este
 * orden y los demás se calman: el título pasa a una entrada que corre una vez y el brillo que cruza pasa a la luz que
 * sigue al dedo. Las capas 2.5D y la luz que sigue al dedo no cuentan: solo se mueven si la persona las mueve.
 */
export const PROTAGONISTA_RECETA = {
  /** «efecto» es el fondo animado (efecto o fondo WebGL); «fotoEnLetras» solo se movería con video (no existe en v2). */
  orden: ["tomas", "efecto", "palabras", "efectoTexto", "fotoEnLetras", "luz"] as const,
  textosQueSeMueven: ["onda", "temblor", "glitch"] as TextoEfecto[],
  lucesQueSeMueven: ["barrido"] as ModoLuz[],
  calmar: { efectoTexto: "revelar" as TextoEfecto, luz: "puntero" as ModoLuz },
};


export interface BotonReceta {
  texto: string;
  /** `https://…`, `#seccion` o una ruta relativa (`/carta`). */
  href: string;
}

export interface RecetaEncabezado {
  version: typeof VERSION_RECETA;
  estilo: EstiloId;
  composicion: ComposicionId;
  entrada: EntradaId;
  efectoTexto: TextoEfecto;
  pack: PackBotonId;
  antetitulo?: string;
  /** Una palabra entre asteriscos (`*Smash* burgers`) se resalta. */
  titulo: string;
  bajada?: string;
  datos?: string[];
  /** El primero es el principal; el segundo, el secundario. */
  botones?: BotonReceta[];
  alto: AltoEncabezado;
  altoCelular?: AltoEncabezado;
  /** URL `https://` o key de S3 (`negocio/fotos/portada.webp`). */
  imagenes?: string[];
  /** Texto alternativo de la primera foto. */
  alt?: string;
  poster?: string;
  efecto?: EfectoId;
  variante?: Variante;
  profundidad: boolean;
  luz?: ModoLuz;
  mover?: FuenteMovimiento[];
  salida: SalidaEncabezado;
  ahorro: ModoAhorro;
  // --- v2 ---
  /** Apertura de película la primera vez de la sesión: franjas, «X presenta…» y el título. */
  apertura?: { presenta?: string };
  /** Las fotos se suceden con un acercamiento lento (necesita dos o más). */
  tomas?: boolean;
  /** El título relleno con la primera foto (o el póster). */
  fotoEnLetras?: boolean;
  tratamiento?: Tratamiento;
  /** Muestra «Abierto ahora…» con los datos que pasa quien dibuja. */
  estado?: boolean;
  /** Palabras que rotan en la palabra resaltada del título. */
  palabras?: string[];
  /** Tinte según la hora del teléfono (mañana, tarde, noche). */
  horaDelDia?: boolean;
  shader?: ShaderId;
  objeto?: { forma: FormaObjeto; texto?: string };
  /** Para la barra al bajar: URL https o key de S3. */
  logo?: string;
  nombre?: string;
}

/** Campos de la receta, en el orden en que se guardan. */
export const CAMPOS_RECETA = [
  "version", "estilo", "composicion", "entrada", "efectoTexto", "pack", "antetitulo", "titulo", "bajada", "datos",
  "botones", "alto", "altoCelular", "imagenes", "alt", "poster", "efecto", "variante", "profundidad", "luz", "mover",
  "salida", "ahorro", "apertura", "tomas", "fotoEnLetras", "tratamiento", "estado", "palabras", "horaDelDia", "shader",
  "objeto", "logo", "nombre",
] as const satisfies readonly (keyof RecetaEncabezado)[];

/** Los que la receta tiene que traer; el resto toma su valor por defecto. */
export const OBLIGATORIOS_RECETA = ["version", "estilo", "titulo"] as const satisfies readonly (keyof RecetaEncabezado)[];

export interface ErrorReceta {
  campo: string;
  mensaje: string;
}

export type ResultadoReceta =
  | { ok: true; receta: RecetaEncabezado; avisos: string[] }
  | { ok: false; errores: ErrorReceta[] };

// --- Ayudas -------------------------------------------------------------------------------------------------------

const esObjeto = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const en = <T>(lista: readonly T[], v: unknown): v is T => (lista as readonly unknown[]).includes(v);
/** Largo en letras (no en unidades de UTF-16) y sin los asteriscos del resaltado. */
const largo = (s: string) => [...s.replace(/\*/g, "")].length;
const cortar = (s: string, tope: number) => {
  const t = s.trim();
  if (largo(t) <= tope) return t;
  let out = "";
  for (const ch of t) {
    if (largo(out + ch) > tope) break;
    out += ch;
  }
  return out.trim();
};
const CONTROL = /[\u0000-\u001f\u007f]/;
/** Composiciones donde se ve una foto (y por lo tanto, las tomas). */
const COMPOSICIONES_CON_FOTO: ComposicionId[] = ["imagen", "tarjeta", "vinetas", "dividido"];
/** Una palabra resaltada con asteriscos en el título. */
const RESALTADO = /\*[^*]+\*/;

function esHttps(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" && !u.username && !u.password && Boolean(u.hostname);
  } catch {
    return false;
  }
}

/** `https://…`, `#…` o ruta relativa sin esquema (`/carta`, `carta`). Nada de `javascript:`, `//otro.sitio` ni `\`. */
export function esHrefSeguro(h: unknown): h is string {
  if (typeof h !== "string" || !h || h.length > TOPES_RECETA.href || CONTROL.test(h) || /\s|\\/.test(h)) return false;
  if (h.startsWith("#")) return true;
  if (h.startsWith("//")) return false;
  if (h.startsWith("/")) return true;
  if (h.includes(":")) return esHttps(h);
  return true;
}

/** URL `https://` o key de S3: letras, números, `/ _ . -`, sin `..` ni `//`. */
export function esImagenSegura(s: unknown): s is string {
  if (typeof s !== "string" || !s || s.length > TOPES_RECETA.imagen || CONTROL.test(s)) return false;
  if (s.startsWith("https://")) return esHttps(s);
  return /^[A-Za-z0-9][A-Za-z0-9/_.\-]*$/.test(s) && !s.includes("..") && !s.includes("//");
}

const esAlto = (a: unknown): a is AltoEncabezado =>
  en(ALTO_IDS, a) || (typeof a === "number" && Number.isFinite(a) && a >= TOPES_RECETA.altoMinimo && a <= TOPES_RECETA.altoMaximo);

// --- Validar ------------------------------------------------------------------------------------------------------

/**
 * Revisa una receta que llega de afuera (el editor, un `.json` importado, la API). Junta todos los errores, con el
 * campo y un mensaje en español. Si está bien, devuelve la receta normalizada (lo que se guarda) y los avisos de lo que
 * se calmó para dejar un solo protagonista.
 */
export function validarReceta(x: unknown): ResultadoReceta {
  const errores: ErrorReceta[] = [];
  const mal = (campo: string, mensaje: string) => errores.push({ campo, mensaje });
  if (!esObjeto(x)) return { ok: false, errores: [{ campo: "receta", mensaje: "La receta no es válida: tiene que ser un objeto." }] };

  for (const k of Object.keys(x)) {
    if (!(CAMPOS_RECETA as readonly string[]).includes(k)) mal(k, "Este campo no va en la receta del encabezado.");
  }
  if (!(VERSIONES_RECETA as readonly unknown[]).includes(x.version)) mal("version", "La versión de la receta tiene que ser 1 o 2.");
  if (!en(ESTILO_IDS, x.estilo)) mal("estilo", "Elige un estilo de la lista.");

  const lista = (campo: keyof typeof LISTAS_RECETA, mensaje: string) => {
    if (x[campo] !== undefined && !en(LISTAS_RECETA[campo] as readonly unknown[], x[campo])) mal(campo, mensaje);
  };
  lista("composicion", "Elige una composición de la lista.");
  lista("entrada", "Elige una entrada de la lista.");
  lista("efectoTexto", "Elige un efecto del título de la lista.");
  lista("pack", "Elige un pack de botones de la lista.");
  lista("efecto", "Elige un fondo animado de la lista.");
  lista("variante", "La variante del fondo es 1, 2 o 3.");
  lista("luz", "La luz es «puntero» (sigue al dedo) o «barrido» (brillo que cruza).");
  lista("salida", "Elige cómo se va el encabezado al bajar, de la lista.");
  lista("ahorro", "El ahorro es «auto», «siempre» o «nunca».");
  lista("tratamiento", "El tratamiento de foto es duotono, grano, trama o bn.");
  lista("shader", "Elige un fondo WebGL de la lista.");

  const texto = (campo: "antetitulo" | "titulo" | "bajada" | "alt", tope: number, nombre: string, obligatorio = false) => {
    const v = x[campo];
    if (v === undefined) {
      if (obligatorio) mal(campo, `Falta ${nombre}.`);
      return;
    }
    if (typeof v !== "string") return mal(campo, `${cap(nombre)} tiene que ser texto.`);
    if (CONTROL.test(v)) return mal(campo, `${cap(nombre)} trae caracteres que no se pueden mostrar.`);
    if (obligatorio && !v.replace(/\*/g, "").trim()) return mal(campo, `${cap(nombre)} no puede quedar vacío.`);
    if (largo(v.trim()) > tope) mal(campo, `${cap(nombre)} no puede pasar de ${tope} letras (tiene ${largo(v.trim())}).`);
  };
  texto("antetitulo", TOPES_RECETA.antetitulo, "el antetítulo");
  texto("titulo", TOPES_RECETA.titulo, "el título", true);
  texto("bajada", TOPES_RECETA.bajada, "la bajada");
  texto("alt", TOPES_RECETA.alt, "el texto de la foto");

  if (x.datos !== undefined) {
    if (!Array.isArray(x.datos)) mal("datos", "Los datos tienen que ser una lista de textos cortos.");
    else {
      if (x.datos.length > TOPES_RECETA.datos) mal("datos", `Van hasta ${TOPES_RECETA.datos} datos (hay ${x.datos.length}).`);
      x.datos.forEach((d, i) => {
        if (typeof d !== "string" || !d.trim() || CONTROL.test(d)) mal(`datos[${i}]`, "Cada dato tiene que ser un texto, no vacío.");
        else if (largo(d.trim()) > TOPES_RECETA.dato) mal(`datos[${i}]`, `Cada dato va hasta ${TOPES_RECETA.dato} letras (este tiene ${largo(d.trim())}).`);
      });
    }
  }

  if (x.botones !== undefined) {
    if (!Array.isArray(x.botones)) mal("botones", "Los botones tienen que ser una lista.");
    else {
      if (x.botones.length > TOPES_RECETA.botones) mal("botones", `Van hasta ${TOPES_RECETA.botones} botones: el principal y el secundario.`);
      x.botones.forEach((b, i) => {
        const c = `botones[${i}]`;
        if (!esObjeto(b)) return mal(c, "Cada botón trae su texto y su enlace.");
        for (const k of Object.keys(b)) if (k !== "texto" && k !== "href") mal(`${c}.${k}`, "Un botón solo lleva texto y enlace.");
        if (typeof b.texto !== "string" || !b.texto.trim() || CONTROL.test(b.texto)) mal(`${c}.texto`, "Al botón le falta el texto.");
        else if (largo(b.texto.trim()) > TOPES_RECETA.textoBoton) mal(`${c}.texto`, `El texto del botón va hasta ${TOPES_RECETA.textoBoton} letras.`);
        if (!esHrefSeguro(b.href)) mal(`${c}.href`, "El enlace tiene que empezar con https://, # o ser una ruta de la página (/carta).");
      });
    }
  }

  const rangoAlto = `${TOPES_RECETA.altoMinimo} a ${TOPES_RECETA.altoMaximo}`;
  if (x.alto !== undefined && !esAlto(x.alto)) mal("alto", `El alto es un tamaño de la lista o un número de ${rangoAlto} (% de la pantalla).`);
  if (x.altoCelular !== undefined && !esAlto(x.altoCelular)) mal("altoCelular", `El alto en celular es un tamaño de la lista o un número de ${rangoAlto}.`);

  if (x.imagenes !== undefined) {
    if (!Array.isArray(x.imagenes)) mal("imagenes", "Las fotos tienen que ser una lista.");
    else {
      if (x.imagenes.length > TOPES_RECETA.imagenes) mal("imagenes", `Van hasta ${TOPES_RECETA.imagenes} fotos.`);
      x.imagenes.forEach((s, i) => { if (!esImagenSegura(s)) mal(`imagenes[${i}]`, "Cada foto es una URL https:// o una key de S3."); });
    }
  }
  if (x.poster !== undefined && !esImagenSegura(x.poster)) mal("poster", "El póster es una URL https:// o una key de S3.");

  if (x.profundidad !== undefined && typeof x.profundidad !== "boolean") mal("profundidad", "Las capas en profundidad van prendidas (true) o apagadas (false).");
  if (x.mover !== undefined) {
    if (!Array.isArray(x.mover) || !x.mover.length) mal("mover", "«mover» es una lista con puntero, scroll o inclinacion.");
    else {
      if (x.mover.some((m) => !en(LISTAS_RECETA.mover, m))) mal("mover", "«mover» solo lleva puntero, scroll o inclinacion.");
      if (new Set(x.mover).size !== x.mover.length) mal("mover", "«mover» no puede repetir valores.");
    }
  }

  // --- v2 ---
  for (const k of ["tomas", "fotoEnLetras", "estado", "horaDelDia"] as const) {
    if (x[k] !== undefined && typeof x[k] !== "boolean") mal(k, `«${k}» va prendido (true) o apagado (false).`);
  }
  if (x.apertura !== undefined) {
    if (!esObjeto(x.apertura)) mal("apertura", "La apertura es un objeto (con «presenta», si quieres).");
    else {
      for (const k of Object.keys(x.apertura)) if (k !== "presenta") mal(`apertura.${k}`, "La apertura solo lleva «presenta».");
      const p = x.apertura.presenta;
      if (p !== undefined && (typeof p !== "string" || CONTROL.test(p) || largo(p.trim()) > TOPES_RECETA.presenta)) {
        mal("apertura.presenta", `«Presenta» es un texto de hasta ${TOPES_RECETA.presenta} letras.`);
      }
    }
  }
  if (x.palabras !== undefined) {
    if (!Array.isArray(x.palabras)) mal("palabras", "Las palabras son una lista de textos cortos.");
    else {
      if (x.palabras.length > TOPES_RECETA.palabras) mal("palabras", `Van hasta ${TOPES_RECETA.palabras} palabras, más la del título.`);
      x.palabras.forEach((w, i) => {
        if (typeof w !== "string" || !w.trim() || CONTROL.test(w) || largo(w.trim()) > TOPES_RECETA.palabra) {
          mal(`palabras[${i}]`, `Cada palabra va hasta ${TOPES_RECETA.palabra} letras, sin quedar vacía.`);
        }
      });
      if (typeof x.titulo === "string" && !RESALTADO.test(x.titulo)) {
        mal("palabras", "Las palabras rotan en la palabra resaltada: marca una con *asteriscos* en el título.");
      }
    }
  }
  if (x.objeto !== undefined) {
    if (!esObjeto(x.objeto)) mal("objeto", "El objeto 3D trae su forma (caja, lata o tarjeta).");
    else {
      for (const k of Object.keys(x.objeto)) if (k !== "forma" && k !== "texto") mal(`objeto.${k}`, "El objeto 3D solo lleva forma y texto.");
      if (!en(LISTAS_RECETA.forma, x.objeto.forma)) mal("objeto.forma", "La forma del objeto es caja, lata o tarjeta.");
      const t = x.objeto.texto;
      if (t !== undefined && (typeof t !== "string" || CONTROL.test(t) || largo(t.trim()) > TOPES_RECETA.textoObjeto)) {
        mal("objeto.texto", `El texto del objeto va hasta ${TOPES_RECETA.textoObjeto} letras.`);
      }
    }
  }
  if (x.logo !== undefined && !esImagenSegura(x.logo)) mal("logo", "El logo es una URL https:// o una key de S3.");
  if (x.nombre !== undefined && (typeof x.nombre !== "string" || CONTROL.test(x.nombre) || largo(x.nombre.trim()) > TOPES_RECETA.nombre)) {
    mal("nombre", `El nombre del negocio va hasta ${TOPES_RECETA.nombre} letras.`);
  }

  if (errores.length) return { ok: false, errores };
  const { receta, avisos } = normalizar(x);
  return { ok: true, receta, avisos };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// --- Normalizar ---------------------------------------------------------------------------------------------------

/**
 * La receta lista para dibujar, a partir de lo guardado. Nunca lanza: lo desconocido se descarta, lo largo se corta y
 * lo que falta toma su valor por defecto. Deja un solo protagonista (ver `PROTAGONISTA_RECETA`).
 */
export function normalizarReceta(x: unknown): RecetaEncabezado {
  return normalizar(x).receta;
}

function normalizar(x0: unknown): { receta: RecetaEncabezado; avisos: string[] } {
  const x = esObjeto(x0) ? x0 : {};
  const avisos: string[] = [];
  const estilo: EstiloId = en(ESTILO_IDS, x.estilo) ? x.estilo : ESTILO_IDS[0];
  const e = ESTILOS[estilo];
  const deLista = <K extends keyof typeof LISTAS_RECETA>(k: K) =>
    en(LISTAS_RECETA[k] as readonly unknown[], x[k]) ? (x[k] as (typeof LISTAS_RECETA)[K][number]) : undefined;
  const texto = (v: unknown, tope: number) => (typeof v === "string" && !CONTROL.test(v) ? cortar(v, tope) || undefined : undefined);
  const aAlto = (a: unknown): AltoEncabezado | undefined =>
    en(ALTO_IDS, a) ? a : typeof a === "number" && Number.isFinite(a)
      ? Math.max(TOPES_RECETA.altoMinimo, Math.min(TOPES_RECETA.altoMaximo, Math.round(a))) : undefined;

  const datos = Array.isArray(x.datos)
    ? x.datos.map((d) => texto(d, TOPES_RECETA.dato)).filter((d): d is string => Boolean(d)).slice(0, TOPES_RECETA.datos)
    : [];
  const botones = Array.isArray(x.botones)
    ? x.botones.flatMap((b): BotonReceta[] => {
        if (!esObjeto(b) || !esHrefSeguro(b.href)) return [];
        const t = texto(b.texto, TOPES_RECETA.textoBoton);
        return t ? [{ texto: t, href: b.href }] : [];
      }).slice(0, TOPES_RECETA.botones)
    : [];
  const imagenes = Array.isArray(x.imagenes) ? x.imagenes.filter(esImagenSegura).slice(0, TOPES_RECETA.imagenes) : [];
  let efecto = deLista("efecto");
  let shader = deLista("shader");
  const profundidad = x.profundidad === true;
  let luz = deLista("luz");
  let efectoTexto = deLista("efectoTexto") ?? e.texto[0];
  const titulo = texto(x.titulo, TOPES_RECETA.titulo) ?? "";
  const poster = esImagenSegura(x.poster) ? x.poster : undefined;

  // v2: lo que necesita fotos o un título resaltado, y un solo fondo animado.
  const composicion = deLista("composicion") ?? DEFECTOS_RECETA.composicion;
  const conObjeto = esObjeto(x.objeto) && en(LISTAS_RECETA.forma, x.objeto.forma);
  let tomas = x.tomas === true;
  if (tomas && imagenes.length < 2) {
    avisos.push("Las tomas necesitan dos o más fotos: queda una sola foto, quieta.");
    tomas = false;
  }
  // Las tomas pasan en la foto de la composición: sin foto a la vista (o con el objeto 3D en su lugar), no se verían.
  if (tomas && !(COMPOSICIONES_CON_FOTO.includes(composicion) && !(composicion === "dividido" && conObjeto))) {
    avisos.push("Las tomas solo se ven en las composiciones con foto (imagen, tarjeta, viñetas o dividido sin objeto): quedan apagadas.");
    tomas = false;
  }
  const fotoEnLetras = x.fotoEnLetras === true && (imagenes.length > 0 || Boolean(poster));
  // Las palabras son alternativas a la resaltada del título: sin repetirla ni repetirse.
  const destacada = titulo.match(RESALTADO)?.[0].replace(/\*/g, "").trim().toLowerCase();
  let palabras = Array.isArray(x.palabras) && destacada
    ? [...new Set(x.palabras.map((w) => texto(w, TOPES_RECETA.palabra)).filter((w): w is string => Boolean(w)))]
        .filter((w) => w.toLowerCase() !== destacada).slice(0, TOPES_RECETA.palabras)
    : [];
  if (Array.isArray(x.palabras) && x.palabras.length && !palabras.length && destacada) {
    avisos.push("Las palabras no rotan: repiten la del título.");
  }
  if (efecto && shader) {
    avisos.push("Un solo fondo animado: queda el efecto y se quita el fondo WebGL.");
    shader = undefined;
  }

  // Un solo protagonista: gana el primero de PROTAGONISTA_RECETA.orden (tomas, fondo animado, palabras, título, luz).
  let hay = tomas;
  if (efecto || shader) {
    if (hay) {
      avisos.push("Con las tomas, el fondo animado se quita: ya hay fotos que se mueven.");
      efecto = undefined;
      shader = undefined;
    } else hay = true;
  }
  if (palabras.length >= 1) {
    if (hay) {
      avisos.push("Las palabras dejan de rotar: queda la del título, porque ya hay otra cosa que se mueve.");
      palabras = [];
    } else hay = true;
  }
  if (PROTAGONISTA_RECETA.textosQueSeMueven.includes(efectoTexto)) {
    if (hay) {
      avisos.push(`El título pasa de «${efectoTexto}» a «${PROTAGONISTA_RECETA.calmar.efectoTexto}»: ya hay otra cosa que se mueve sola.`);
      efectoTexto = PROTAGONISTA_RECETA.calmar.efectoTexto;
    }
    hay = true;
  }
  if (luz && PROTAGONISTA_RECETA.lucesQueSeMueven.includes(luz)) {
    if (hay) {
      avisos.push("El brillo que cruza pasa a la luz que sigue al dedo: ya hay otra cosa que se mueve sola.");
      luz = PROTAGONISTA_RECETA.calmar.luz;
    }
    hay = true;
  }

  const moverValido = Array.isArray(x.mover) ? [...new Set(x.mover.filter((m): m is FuenteMovimiento => en(LISTAS_RECETA.mover, m)))] : [];
  const usaMover = profundidad || luz === "puntero";
  const alt = texto(x.alt, TOPES_RECETA.alt);
  const apertura = esObjeto(x.apertura) ? { presenta: texto(x.apertura.presenta, TOPES_RECETA.presenta) } : undefined;
  const objeto = esObjeto(x.objeto) && en(LISTAS_RECETA.forma, x.objeto.forma)
    ? { forma: x.objeto.forma, texto: texto(x.objeto.texto, TOPES_RECETA.textoObjeto) }
    : undefined;

  const r: RecetaEncabezado = {
    version: VERSION_RECETA,
    estilo,
    composicion,
    entrada: deLista("entrada") ?? DEFECTOS_RECETA.entrada,
    efectoTexto,
    pack: deLista("pack") ?? e.pack,
    antetitulo: texto(x.antetitulo, TOPES_RECETA.antetitulo),
    titulo,
    bajada: texto(x.bajada, TOPES_RECETA.bajada),
    datos: datos.length ? datos : undefined,
    botones: botones.length ? botones : undefined,
    alto: aAlto(x.alto) ?? DEFECTOS_RECETA.alto,
    altoCelular: aAlto(x.altoCelular),
    imagenes: imagenes.length ? imagenes : undefined,
    alt: alt && (imagenes.length || poster) ? alt : undefined,
    poster,
    efecto,
    variante: efecto ? deLista("variante") ?? DEFECTOS_RECETA.variante : undefined,
    profundidad,
    luz,
    mover: usaMover && moverValido.length ? moverValido : undefined,
    salida: deLista("salida") ?? DEFECTOS_RECETA.salida,
    ahorro: deLista("ahorro") ?? DEFECTOS_RECETA.ahorro,
    apertura: apertura && (apertura.presenta ? apertura : {}),
    tomas: tomas || undefined,
    fotoEnLetras: fotoEnLetras || undefined,
    tratamiento: deLista("tratamiento"),
    estado: x.estado === true || undefined,
    palabras: palabras.length ? palabras : undefined,
    horaDelDia: x.horaDelDia === true || undefined,
    shader,
    objeto: objeto && (objeto.texto ? objeto : { forma: objeto.forma }),
    logo: esImagenSegura(x.logo) ? x.logo : undefined,
    nombre: texto(x.nombre, TOPES_RECETA.nombre),
  };
  return { receta: sinVacios(r), avisos };
}

/** Saca las claves `undefined` y deja el orden de `CAMPOS_RECETA` (así dos recetas iguales se guardan igual). */
function sinVacios(r: RecetaEncabezado): RecetaEncabezado {
  const out: Record<string, unknown> = {};
  for (const k of CAMPOS_RECETA) if (r[k] !== undefined) out[k] = r[k];
  return out as unknown as RecetaEncabezado;
}

/** Qué hace de protagonista en la receta (lo que se mueve sin parar), o `null` si todo es sobrio. */
export function protagonistaDe(r: RecetaEncabezado): (typeof PROTAGONISTA_RECETA.orden)[number] | null {
  if (r.tomas) return "tomas";
  if (r.efecto || r.shader) return "efecto";
  if (r.palabras && r.palabras.length >= 1) return "palabras";
  if (PROTAGONISTA_RECETA.textosQueSeMueven.includes(r.efectoTexto)) return "efectoTexto";
  if (r.luz && PROTAGONISTA_RECETA.lucesQueSeMueven.includes(r.luz)) return "luz";
  return null;
}

// --- A props del componente ---------------------------------------------------------------------------------------

export interface OpcionesProps {
  /** Pasa una key de S3 a su URL pública (por ejemplo, la del CDN del negocio). Sin esto, la key queda tal cual. */
  urlImagen?: (key: string) => string;
}

/** Las props de `Encabezado` para una receta. El estilo va aparte: `<Estilo nombre={receta.estilo}>`. */
export function recetaAProps(r: RecetaEncabezado, { urlImagen }: OpcionesProps = {}): EncabezadoProps {
  const url = (s: string) => (s.startsWith("https://") || !urlImagen ? s : urlImagen(s));
  const p: EncabezadoProps = {
    composicion: r.composicion,
    entrada: r.entrada,
    efectoTexto: r.efectoTexto,
    pack: r.pack,
    antetitulo: r.antetitulo,
    titulo: r.titulo,
    bajada: r.bajada,
    datos: r.datos,
    boton: r.botones?.[0],
    botonSecundario: r.botones?.[1],
    alto: r.alto,
    altoCelular: r.altoCelular,
    imagenes: r.imagenes?.map(url),
    alt: r.alt,
    poster: r.poster && url(r.poster),
    efecto: r.efecto,
    variante: r.variante,
    profundidad: r.profundidad,
    luz: r.luz,
    mover: r.mover,
    salida: r.salida,
    ahorro: r.ahorro,
    shader: r.shader,
    objeto: r.objeto && { tipo: "3d", forma: r.objeto.forma, texto: r.objeto.texto },
    apertura: r.apertura,
    tomas: r.tomas,
    palabras: r.palabras,
    logo: r.logo && url(r.logo),
    nombre: r.nombre,
    estado: r.estado,
    fotoEnLetras: r.fotoEnLetras,
    tratamiento: r.tratamiento,
    horaDelDia: r.horaDelDia,
  };
  for (const k of Object.keys(p) as (keyof EncabezadoProps)[]) if (p[k] === undefined) delete p[k];
  return p;
}
