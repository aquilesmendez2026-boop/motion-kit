// Biblioteca de diseños: los encabezados que arma el equipo, con nombre, rubro, etiquetas y estado.
// Tiene la misma forma que tendrá la tabla de La Mente (`lamente-<amb>-paginas-biblioteca`, paso 5): subirla después es
// cambiar el almacén (`AlmacenBiblioteca`), no los datos. No importa React: corre en el navegador y en Node.
import { RUBRO_IDS, type RubroId } from "../encabezados/rubros";
import { validarReceta, type ErrorReceta, type RecetaEncabezado } from "../receta/receta";
import { PALETA_LAMENTE_IDS, TEMA_LAMENTE_IDS, type PaletaLaMente, type TemaLaMente } from "../receta/lamente";

export const VERSION_BIBLIOTECA = 1 as const;
export const FORMATO_BIBLIOTECA = "motion-kit/biblioteca" as const;

export type EstadoDiseno = "borrador" | "aprobado" | "archivado";
export const ESTADOS_DISENO: Record<EstadoDiseno, string> = { borrador: "Borrador", aprobado: "Aprobado", archivado: "Archivado" };
export const ESTADO_IDS = Object.keys(ESTADOS_DISENO) as EstadoDiseno[];

export const TOPES_BIBLIOTECA = { nombre: 60, etiquetas: 8, etiqueta: 24, autor: 80, disenos: 500 } as const;

export interface DisenoBiblioteca {
  id: string;
  nombre: string;
  rubro?: RubroId;
  etiquetas: string[];
  estado: EstadoDiseno;
  /** Correo o nombre de quien lo hizo (en La Mente lo pone el servidor). */
  autor?: string;
  receta: RecetaEncabezado;
  /** Con qué tema y paleta de La Mente se diseñó (solo para verlo igual; la página pone los suyos). */
  vista?: { tema: TemaLaMente; paleta: PaletaLaMente };
  /** Fechas ISO. */
  creado: string;
  actualizado: string;
}

export interface ArchivoBiblioteca {
  formato: typeof FORMATO_BIBLIOTECA;
  version: typeof VERSION_BIBLIOTECA;
  exportado: string;
  disenos: DisenoBiblioteca[];
}

export type ResultadoDiseno = { ok: true; diseno: DisenoBiblioteca } | { ok: false; errores: ErrorReceta[] };

// --- Ayudas -------------------------------------------------------------------------------------------------------

const esObjeto = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const ahoraIso = () => new Date().toISOString();
const esFecha = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));
const letras = (s: string) => [...s].length;

export function nuevoId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return "d-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

/** Etiquetas en minúscula, sin espacios de sobra ni repetidas, con sus topes. */
export function limpiarEtiquetas(xs: unknown): string[] {
  const lista = typeof xs === "string" ? xs.split(",") : Array.isArray(xs) ? xs : [];
  const vistas = new Set<string>();
  for (const x of lista) {
    if (typeof x !== "string") continue;
    const e = x.trim().toLowerCase().replace(/\s+/g, " ");
    if (!e || letras(e) > TOPES_BIBLIOTECA.etiqueta) continue;
    vistas.add(e);
    if (vistas.size >= TOPES_BIBLIOTECA.etiquetas) break;
  }
  return [...vistas];
}

// --- Validar ------------------------------------------------------------------------------------------------------

/** Revisa un diseño que llega de afuera (un .json importado, el almacén, la API). Errores en español, como la receta. */
export function validarDiseno(x: unknown): ResultadoDiseno {
  const errores: ErrorReceta[] = [];
  const mal = (campo: string, mensaje: string) => errores.push({ campo, mensaje });
  if (!esObjeto(x)) return { ok: false, errores: [{ campo: "diseno", mensaje: "El diseño no es válido: tiene que ser un objeto." }] };

  if (typeof x.id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(x.id)) mal("id", "Falta el id del diseño o trae caracteres no permitidos.");
  const nombre = typeof x.nombre === "string" ? x.nombre.trim() : "";
  if (!nombre) mal("nombre", "Ponle un nombre al diseño.");
  else if (letras(nombre) > TOPES_BIBLIOTECA.nombre) mal("nombre", `El nombre es muy largo: máximo ${TOPES_BIBLIOTECA.nombre} letras.`);
  if (x.rubro !== undefined && !(RUBRO_IDS as readonly unknown[]).includes(x.rubro)) mal("rubro", `El rubro «${String(x.rubro)}» no existe.`);
  if (x.etiquetas !== undefined && !Array.isArray(x.etiquetas)) mal("etiquetas", "Las etiquetas tienen que ser una lista.");
  if (!(ESTADO_IDS as readonly unknown[]).includes(x.estado)) mal("estado", "El estado tiene que ser borrador, aprobado o archivado.");
  if (x.autor !== undefined && (typeof x.autor !== "string" || letras(x.autor) > TOPES_BIBLIOTECA.autor)) mal("autor", "El autor no es válido.");
  if (x.vista !== undefined) {
    const v = x.vista;
    if (!esObjeto(v) || !(TEMA_LAMENTE_IDS as readonly unknown[]).includes(v.tema) || !(PALETA_LAMENTE_IDS as readonly unknown[]).includes(v.paleta)) {
      mal("vista", "El tema o la paleta de La Mente no existen.");
    }
  }
  if (!esFecha(x.creado)) mal("creado", "Falta la fecha de creación.");
  if (!esFecha(x.actualizado)) mal("actualizado", "Falta la fecha de la última edición.");

  const r = validarReceta(x.receta);
  if (!r.ok) for (const e of r.errores) mal(`receta.${e.campo}`, e.mensaje);
  if (errores.length || !r.ok) return { ok: false, errores };

  const etiquetas = limpiarEtiquetas(x.etiquetas);
  const diseno: DisenoBiblioteca = {
    id: x.id as string,
    nombre,
    ...(x.rubro !== undefined ? { rubro: x.rubro as RubroId } : {}),
    etiquetas,
    estado: x.estado as EstadoDiseno,
    ...(typeof x.autor === "string" && x.autor.trim() ? { autor: x.autor.trim() } : {}),
    receta: r.receta,
    ...(x.vista !== undefined ? { vista: x.vista as DisenoBiblioteca["vista"] } : {}),
    creado: x.creado as string,
    actualizado: x.actualizado as string,
  };
  return { ok: true, diseno };
}

// --- Crear y cambiar ----------------------------------------------------------------------------------------------

export interface DatosDiseno {
  nombre: string;
  receta: RecetaEncabezado;
  rubro?: RubroId;
  etiquetas?: string[] | string;
  autor?: string;
  vista?: DisenoBiblioteca["vista"];
}

/** Un diseño nuevo, en borrador. Lanza un error con el mensaje si los datos no sirven. */
export function crearDiseno(datos: DatosDiseno, ahora = ahoraIso()): DisenoBiblioteca {
  const r = validarDiseno({ ...datos, id: nuevoId(), estado: "borrador", etiquetas: limpiarEtiquetas(datos.etiquetas), creado: ahora, actualizado: ahora });
  if (!r.ok) throw new Error(r.errores.map((e) => e.mensaje).join(" "));
  return r.diseno;
}

/** Cambia un diseño y le pone la fecha de edición. */
export function editarDiseno(d: DisenoBiblioteca, cambios: Partial<Omit<DisenoBiblioteca, "id" | "creado">>, ahora = ahoraIso()): DisenoBiblioteca {
  const r = validarDiseno({ ...d, ...cambios, etiquetas: limpiarEtiquetas(cambios.etiquetas ?? d.etiquetas), id: d.id, creado: d.creado, actualizado: ahora });
  if (!r.ok) throw new Error(r.errores.map((e) => e.mensaje).join(" "));
  return r.diseno;
}

/** Copia con otro id, en borrador. */
export function duplicarDiseno(d: DisenoBiblioteca, ahora = ahoraIso()): DisenoBiblioteca {
  const base = `${d.nombre} (copia)`;
  const nombre = letras(base) > TOPES_BIBLIOTECA.nombre ? [...d.nombre].slice(0, TOPES_BIBLIOTECA.nombre - 8).join("") + " (copia)" : base;
  return { ...d, id: nuevoId(), nombre, estado: "borrador", creado: ahora, actualizado: ahora };
}

export interface FiltroBiblioteca {
  texto?: string;
  rubro?: RubroId | "";
  estado?: EstadoDiseno | "";
  etiqueta?: string;
  /** Por defecto los archivados quedan fuera, salvo que se pida ese estado. */
  conArchivados?: boolean;
}

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Filtra y ordena (lo editado más reciente primero). El texto busca en el nombre, las etiquetas y el título. */
export function filtrarDisenos(lista: DisenoBiblioteca[], f: FiltroBiblioteca = {}): DisenoBiblioteca[] {
  const t = sinTildes(f.texto?.trim() ?? "");
  return lista
    .filter((d) => (f.estado ? d.estado === f.estado : f.conArchivados || d.estado !== "archivado"))
    .filter((d) => !f.rubro || d.rubro === f.rubro)
    .filter((d) => !f.etiqueta || d.etiquetas.includes(f.etiqueta))
    .filter((d) => !t || sinTildes([d.nombre, ...d.etiquetas, d.receta.titulo.replace(/\*/g, "")].join(" ")).includes(t))
    .sort((a, b) => b.actualizado.localeCompare(a.actualizado));
}

export const etiquetasDe = (lista: DisenoBiblioteca[]) => [...new Set(lista.flatMap((d) => d.etiquetas))].sort((a, b) => a.localeCompare(b, "es"));

// --- Exportar e importar ------------------------------------------------------------------------------------------

export function exportarBiblioteca(disenos: DisenoBiblioteca[], ahora = ahoraIso()): string {
  const archivo: ArchivoBiblioteca = { formato: FORMATO_BIBLIOTECA, version: VERSION_BIBLIOTECA, exportado: ahora, disenos };
  return JSON.stringify(archivo, null, 2);
}

export interface ResultadoImportar {
  disenos: DisenoBiblioteca[];
  agregados: number;
  actualizados: number;
  /** Los que no se pudieron leer, con su posición en el archivo (desde 1). */
  rechazados: { posicion: number; nombre?: string; errores: ErrorReceta[] }[];
  /** Un error del archivo entero (no es JSON o no es una biblioteca). */
  error?: string;
}

/**
 * Lee un .json exportado (o un diseño suelto) y lo junta con lo que ya hay. Si un id ya existe, queda la versión
 * editada más tarde. Lo que no pasa la validación se informa y no entra.
 */
export function importarBiblioteca(texto: string, existentes: DisenoBiblioteca[]): ResultadoImportar {
  const nada = (error: string): ResultadoImportar => ({ disenos: existentes, agregados: 0, actualizados: 0, rechazados: [], error });
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return nada("El archivo no es un JSON válido.");
  }
  let lista: unknown[];
  if (esObjeto(datos) && datos.formato === FORMATO_BIBLIOTECA) {
    if (datos.version !== VERSION_BIBLIOTECA) return nada(`El archivo es de la versión ${String(datos.version)} de la biblioteca; esta lee la ${VERSION_BIBLIOTECA}.`);
    if (!Array.isArray(datos.disenos)) return nada("Al archivo le falta la lista de diseños.");
    lista = datos.disenos;
  } else if (esObjeto(datos) && "receta" in datos) {
    lista = [datos];
  } else {
    return nada("El archivo no es una biblioteca de motion-kit.");
  }

  const porId = new Map(existentes.map((d) => [d.id, d]));
  let agregados = 0;
  let actualizados = 0;
  const rechazados: ResultadoImportar["rechazados"] = [];
  lista.forEach((x, i) => {
    const r = validarDiseno(x);
    if (!r.ok) {
      rechazados.push({ posicion: i + 1, nombre: esObjeto(x) && typeof x.nombre === "string" ? x.nombre : undefined, errores: r.errores });
      return;
    }
    const antes = porId.get(r.diseno.id);
    if (!antes) {
      if (porId.size >= TOPES_BIBLIOTECA.disenos) {
        rechazados.push({ posicion: i + 1, nombre: r.diseno.nombre, errores: [{ campo: "biblioteca", mensaje: `La biblioteca llegó a su tope de ${TOPES_BIBLIOTECA.disenos} diseños.` }] });
        return;
      }
      agregados++;
      porId.set(r.diseno.id, r.diseno);
    } else if (r.diseno.actualizado > antes.actualizado) {
      actualizados++;
      porId.set(r.diseno.id, r.diseno);
    }
  });
  return { disenos: [...porId.values()], agregados, actualizados, rechazados };
}

// --- Almacén ------------------------------------------------------------------------------------------------------

/** Dónde vive la biblioteca. Hoy, el navegador; en el paso 5, la API de La Mente con la misma forma. */
export interface AlmacenBiblioteca {
  listar(): Promise<DisenoBiblioteca[]>;
  guardar(d: DisenoBiblioteca): Promise<void>;
  /** Reemplaza todo (lo usa importar). */
  guardarTodos(lista: DisenoBiblioteca[]): Promise<void>;
  borrar(id: string): Promise<void>;
  /** `false` si el navegador no deja guardar (modo privado, almacenamiento lleno): lo guardado se pierde al recargar. */
  readonly persistente: boolean;
}

interface AlmacenamientoWeb {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

/**
 * Almacén en `localStorage`. Si el navegador no lo permite, guarda en memoria y lo avisa con `persistente: false`.
 * Lo que está guardado y no pasa la validación (por ejemplo, de una versión vieja) se salta en vez de romper la lista.
 */
export function almacenLocal(clave = "motion-kit:biblioteca", web?: AlmacenamientoWeb | null): AlmacenBiblioteca {
  let memoria: DisenoBiblioteca[] = [];
  let ls: AlmacenamientoWeb | null = null;
  try {
    ls = web !== undefined ? web : (globalThis as { localStorage?: AlmacenamientoWeb }).localStorage ?? null;
    if (ls) {
      const prueba = clave + ":prueba";
      ls.setItem(prueba, "1");
      ls.getItem(prueba);
    }
  } catch {
    ls = null;
  }
  const leer = (): DisenoBiblioteca[] => {
    if (!ls) return memoria;
    try {
      const datos: unknown = JSON.parse(ls.getItem(clave) ?? "[]");
      if (!Array.isArray(datos)) return [];
      return datos.flatMap((x) => {
        const r = validarDiseno(x);
        return r.ok ? [r.diseno] : [];
      });
    } catch {
      return [];
    }
  };
  const escribir = (lista: DisenoBiblioteca[]) => {
    memoria = lista;
    if (!ls) return;
    try {
      ls.setItem(clave, JSON.stringify(lista));
    } catch {
      throw new Error("El navegador no dejó guardar (¿almacenamiento lleno?). Exporta la biblioteca para no perderla.");
    }
  };
  return {
    persistente: ls !== null,
    async listar() {
      return leer();
    },
    async guardar(d) {
      const lista = leer().filter((x) => x.id !== d.id);
      if (lista.length >= TOPES_BIBLIOTECA.disenos) throw new Error(`La biblioteca llegó a su tope de ${TOPES_BIBLIOTECA.disenos} diseños.`);
      escribir([d, ...lista]);
    },
    async guardarTodos(lista) {
      escribir(lista.slice(0, TOPES_BIBLIOTECA.disenos));
    },
    async borrar(id) {
      escribir(leer().filter((x) => x.id !== id));
    },
  };
}
