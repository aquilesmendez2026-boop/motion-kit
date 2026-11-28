// Aplicar un tema del catálogo: sus variables `--mk-*` (todas: lo que el tema no define va como «initial», así cada
// pieza usa su respaldo y se corta lo que viene de afuera, por ejemplo la vista previa de la página dentro del panel).
import { RITMOS } from "../interfaz/tema";
import { PALETAS, TEMAS } from "./datos";
import type { Colores, Lado, Para, Tema } from "./tipos";

const kebab = (n: string) => n.replace(/[A-Z]/g, (l) => "-" + l.toLowerCase());
const COLORES: (keyof Colores)[] = ["fondo", "superficie", "texto", "suave", "borde", "acento", "sobreAcento", "cartel"];
const FORMAS = ["trazo", "radioTarjeta", "radioBoton", "radioCampo", "sombra", "sombraSuave", "hundir"] as const;
const LETRAS = ["fuenteTexto", "fuenteTitulo", "fuenteCartel"] as const;
/** Lo que un tema de la página dice de sus títulos (TemaPagina del front). */
const TITULO = ["--mk-titulo-peso", "--mk-titulo-espaciado", "--mk-titulo-mayusculas", "--mk-titulo-brillo"];
/** Las variables de detalle que usa algún tema (por ejemplo `--mk-campo-foco`). */
const DETALLES = [...new Set(TEMAS.flatMap((t) => [...Object.keys(t.detalle ?? {}), ...Object.keys(t.panel?.detalle ?? {})]))].sort();

/** Todas las variables que declara un tema, en orden. */
export const VARIABLES_TEMA: string[] = [
  ...COLORES.map((c) => `--mk-${kebab(c)}`),
  ...FORMAS.map((f) => `--mk-${kebab(f)}`),
  ...LETRAS.map((l) => `--mk-${kebab(l)}`),
  ...TITULO,
  "--mk-ritmo-tiempo",
  "--mk-ritmo-fuerza",
  ...DETALLES.map((d) => `--mk-${d}`),
];

const POR_DEFECTO: Record<Para, string> = { panel: "lamente", pagina: "clasico" };

/** El tema con ese id para ese lado; uno desconocido (o de otro lado) cae al de siempre: «lamente» o «clasico». */
export function buscarTema(id: string | undefined, para: Para): Tema {
  const t = id ? TEMAS.find((x) => x.id === id && x.para.includes(para)) : undefined;
  return t ?? TEMAS.find((x) => x.id === POR_DEFECTO[para])!;
}

/** Lo que el tema define para ese lado. En el panel, su versión del panel es completa: no hereda nada de la página. */
export const ladoDe = (t: Tema, para: Para): Lado => (para === "panel" && t.panel ? t.panel : t);
const lado = ladoDe;

/** Los adornos de un tema en ese lado. */
export const adornosDe = (id: string | undefined, para: Para): string[] => lado(buscarTema(id, para), para).adornos ?? [];

/**
 * Todas las variables de un tema para un lado. `paleta` cambia solo los colores (en la página, el negocio la elige);
 * `oscuro`, los colores del modo oscuro si el tema los tiene.
 */
export function variablesDeTema(id: string | undefined, { para, paleta, oscuro = false }: { para: Para; paleta?: string; oscuro?: boolean }): Record<string, string> {
  const t = buscarTema(id, para);
  const l = lado(t, para);
  const out: Record<string, string> = Object.fromEntries(VARIABLES_TEMA.map((v) => [v, "initial"]));
  // Una paleta que el catálogo aún no tiene (el backend puede sumarla antes) cae a la del tema.
  const pal = PALETAS.find((p) => p.id === paleta) ?? PALETAS.find((p) => p.id === t.paleta);
  const colores: Partial<Colores> = { ...(paleta || !l.colores ? pal?.colores : undefined), ...(paleta ? {} : l.colores), ...(oscuro ? t.oscuro : undefined) };
  for (const c of COLORES) if (colores[c]) out[`--mk-${kebab(c)}`] = colores[c]!;
  for (const f of FORMAS) if (l.forma?.[f]) out[`--mk-${kebab(f)}`] = l.forma[f]!;
  for (const le of LETRAS) if (l.letra?.[le]) out[`--mk-${kebab(le)}`] = l.letra[le]!;
  if (l.letra?.peso) out["--mk-titulo-peso"] = String(l.letra.peso);
  if (l.letra?.espaciado) out["--mk-titulo-espaciado"] = l.letra.espaciado;
  if (l.letra?.mayusculas) out["--mk-titulo-mayusculas"] = "uppercase";
  if (l.letra?.brillo) out["--mk-titulo-brillo"] = "1";
  if (l.ritmo) {
    out["--mk-ritmo-tiempo"] = String(RITMOS[l.ritmo].tiempo);
    out["--mk-ritmo-fuerza"] = String(RITMOS[l.ritmo].fuerza);
  }
  for (const [d, v] of Object.entries(l.detalle ?? {})) out[`--mk-${d}`] = v;
  return out;
}
