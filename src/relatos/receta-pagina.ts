// Receta de página v1: el encabezado más el relato de la página y el de cada bloque. Sin React: corre en el
// navegador, en Node y, copiada como contrato, en el backend de La Mente.
import { normalizarReceta, validarReceta, type ErrorReceta, type RecetaEncabezado } from "../receta/receta";
import { FIGURA_IDS, RELATOS_DE_BLOQUE, RELATOS_DE_PAGINA, RELATO_DE_ESTILO, type FiguraId, type RelatoBloqueId, type RelatoPaginaId } from "./catalogo";

export interface BloqueRelato {
  /** En el kit, el bloque de la demo; en La Mente, el `tipo` de su bloque (`precios`, `galeria`…). */
  id: string;
  relato?: RelatoBloqueId | "ninguno";
}

export interface RecetaPagina {
  version: 1;
  encabezado: RecetaEncabezado;
  /** El de la página. Si no viene, se usa el que propone el estilo del encabezado (y sigue al estilo si cambia). */
  relato?: RelatoBloqueId;
  /** Relato de fondo para toda la página. */
  relatoPagina?: RelatoPaginaId;
  /** Estela y chispas: el cursor deja una estela sobre la página y un toque suelta chispas. */
  estela?: boolean;
  /** La figura que dibuja el hilo al final (con `relatoPagina: "figura"`). Sin ella, una estrella. */
  figura?: FiguraId;
  /** El `slug` del negocio: con él, dos páginas del mismo rubro no salen iguales (los hilos). */
  semilla?: string;
  bloques?: BloqueRelato[];
}

export const TOPES_PAGINA = { bloques: 30, idBloque: 40, semilla: 80 } as const;
export const CAMPOS_PAGINA = ["version", "encabezado", "relato", "relatoPagina", "estela", "figura", "semilla", "bloques"] as const;
const ID_BLOQUE = /^[a-z0-9-]{1,40}$/;

const esObjeto = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const esBloque = (v: unknown): v is RelatoBloqueId => (RELATOS_DE_BLOQUE as unknown[]).includes(v);
const esDePagina = (v: unknown): v is RelatoPaginaId => (RELATOS_DE_PAGINA as unknown[]).includes(v);
const esFigura = (v: unknown): v is FiguraId => (FIGURA_IDS as unknown[]).includes(v);

/** Mensaje para un relato puesto donde no va. */
function relatoMalPuesto(v: unknown, donde: "bloque" | "pagina"): string {
  if (donde === "bloque" && esDePagina(v)) return `«${v}» es un relato de página: va en relatoPagina.`;
  if (donde === "pagina" && esBloque(v)) return `«${v}» es un relato de bloque: va en relato.`;
  return donde === "bloque" ? "Elige un relato de la lista." : `El relato de página es uno de: ${RELATOS_DE_PAGINA.map((id) => `«${id}»`).join(", ")}.`;
}

/**
 * Revisa una receta de página que llega de afuera. Junta todos los errores; los del encabezado llevan la ruta
 * `encabezado.<campo>`. Si está bien, devuelve la página normalizada y los avisos del encabezado.
 */
export function validarPagina(x: unknown): { ok: true; pagina: RecetaPagina; avisos: string[] } | { ok: false; errores: ErrorReceta[] } {
  if (!esObjeto(x)) return { ok: false, errores: [{ campo: "pagina", mensaje: "La página no es válida: tiene que ser un objeto." }] };
  const errores: ErrorReceta[] = [];
  const mal = (campo: string, mensaje: string) => errores.push({ campo, mensaje });
  for (const k of Object.keys(x)) if (!(CAMPOS_PAGINA as readonly string[]).includes(k)) mal(k, "Este campo no va en la receta de página.");
  if (x.version !== 1) mal("version", "La versión de la receta de página tiene que ser 1.");

  let avisos: string[] = [];
  if (x.encabezado === undefined) mal("encabezado", "Falta el encabezado de la página.");
  else {
    const r = validarReceta(x.encabezado);
    if (r.ok) avisos = r.avisos;
    else for (const e of r.errores) mal(e.campo === "receta" ? "encabezado" : `encabezado.${e.campo}`, e.mensaje);
  }
  if (x.relato !== undefined && !esBloque(x.relato)) mal("relato", relatoMalPuesto(x.relato, "bloque"));
  if (x.relatoPagina !== undefined && !esDePagina(x.relatoPagina)) mal("relatoPagina", relatoMalPuesto(x.relatoPagina, "pagina"));
  if (x.estela !== undefined && typeof x.estela !== "boolean") mal("estela", "«estela» va prendida (true) o apagada (false).");
  if (x.figura !== undefined && !esFigura(x.figura)) mal("figura", `La figura es una de: ${FIGURA_IDS.join(", ")}.`);
  if (x.semilla !== undefined && (typeof x.semilla !== "string" || !x.semilla.trim() || x.semilla.trim().length > TOPES_PAGINA.semilla)) mal("semilla", `La semilla es un texto de hasta ${TOPES_PAGINA.semilla}.`);

  if (x.bloques !== undefined) {
    if (!Array.isArray(x.bloques)) mal("bloques", "Los bloques tienen que ser una lista.");
    else {
      if (x.bloques.length > TOPES_PAGINA.bloques) mal("bloques", `Van hasta ${TOPES_PAGINA.bloques} bloques.`);
      const vistos = new Set<string>();
      x.bloques.forEach((b, i) => {
        const c = `bloques[${i}]`;
        if (!esObjeto(b)) return mal(c, "Cada bloque trae su id y, si quieres, su relato.");
        for (const k of Object.keys(b)) if (k !== "id" && k !== "relato") mal(`${c}.${k}`, "Un bloque solo lleva id y relato.");
        if (typeof b.id !== "string" || !ID_BLOQUE.test(b.id)) mal(`${c}.id`, "El id del bloque va en minúsculas, números y guiones, hasta 40.");
        else if (vistos.has(b.id)) mal(`${c}.id`, `El bloque «${b.id}» está repetido.`);
        else vistos.add(b.id);
        if (b.relato !== undefined && b.relato !== "ninguno" && !esBloque(b.relato)) mal(`${c}.relato`, relatoMalPuesto(b.relato, "bloque"));
      });
    }
  }
  if (errores.length) return { ok: false, errores };
  return { ok: true, pagina: normalizarPagina(x), avisos };
}

/** La página lista para dibujar. Nunca lanza: lo que no calza se descarta y el encabezado se normaliza. */
export function normalizarPagina(x0: unknown): RecetaPagina {
  const x = esObjeto(x0) ? x0 : {};
  const vistos = new Set<string>();
  const bloques = (Array.isArray(x.bloques) ? x.bloques : []).flatMap((b): BloqueRelato[] => {
    if (!esObjeto(b) || typeof b.id !== "string" || !ID_BLOQUE.test(b.id) || vistos.has(b.id)) return [];
    vistos.add(b.id);
    return [b.relato === "ninguno" || esBloque(b.relato) ? { id: b.id, relato: b.relato } : { id: b.id }];
  }).slice(0, TOPES_PAGINA.bloques);
  const p: RecetaPagina = { version: 1, encabezado: normalizarReceta(x.encabezado) };
  if (esBloque(x.relato)) p.relato = x.relato;
  if (esDePagina(x.relatoPagina)) p.relatoPagina = x.relatoPagina;
  if (x.estela === true) p.estela = true;
  if (esFigura(x.figura)) p.figura = x.figura;
  if (typeof x.semilla === "string" && x.semilla.trim()) p.semilla = x.semilla.trim().slice(0, TOPES_PAGINA.semilla);
  if (bloques.length) p.bloques = bloques;
  return p;
}

/** El relato con que se dibuja un bloque: el suyo, si no el de la página, si no el que propone el estilo. */
export function relatoDeBloque(p: RecetaPagina, id: string): RelatoBloqueId | "ninguno" {
  return p.bloques?.find((b) => b.id === id)?.relato ?? p.relato ?? RELATO_DE_ESTILO[p.encabezado.estilo];
}
