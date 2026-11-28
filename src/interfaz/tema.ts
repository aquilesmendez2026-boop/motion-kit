// Los colores de las piezas de interfaz (motion-kit/interfaz). Cada pieza los lee por variables CSS, así toman el tema
// de quien las usa (el panel de La Mente conecta sus colores a estas variables). Sin variables, se ven claras.

export type ColorInterfaz = "fondo" | "superficie" | "texto" | "suave" | "borde" | "acento" | "sobreAcento" | "bien" | "mal";
export type TemaInterfaz = Record<ColorInterfaz, string>;

/** Los valores claros que se usan cuando nadie definió la variable. */
export const RESPALDO: TemaInterfaz = {
  fondo: "#ffffff",
  superficie: "#ffffff",
  texto: "#1c1a22",
  suave: "#5e5a68",
  borde: "#e7e1d8",
  acento: "#7c5cff",
  sobreAcento: "#ffffff",
  bien: "#1f9d55",
  mal: "#d64545",
};

/** Los que ya tenían su variable `--lm-*` en el kit (la de La Mente): se respeta como segundo respaldo. */
const CON_LM: ReadonlySet<ColorInterfaz> = new Set(["acento", "fondo", "superficie"]);

const kebab = (n: string) => n.replace(/[A-Z]/g, (l) => "-" + l.toLowerCase());
const variable = (n: ColorInterfaz) => `--mk-${kebab(n)}`;

/** El color como CSS: `c("acento")` → `var(--mk-acento,var(--lm-acento,#7c5cff))`. */
export function c(nombre: ColorInterfaz): string {
  const respaldo = CON_LM.has(nombre) ? `var(--lm-${kebab(nombre)},${RESPALDO[nombre]})` : RESPALDO[nombre];
  return `var(${variable(nombre)},${respaldo})`;
}

/** La letra de cartel (títulos de cómic, globos): el front la conecta a la suya (`--lmt-cartel`). */
export function fuenteCartel(): string {
  return "var(--mk-fuente-cartel,'Arial Black','Helvetica Neue',sans-serif)";
}

/** El amarillo de los carteles y estallidos de cómic. */
export const CARTEL = "var(--mk-cartel,#ffd23f)";

/** Las variables para un `style`: `variablesTema({ acento: "#7c3aed" })` → `{ "--mk-acento": "#7c3aed" }`. */
export function variablesTema(t: Partial<TemaInterfaz>): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [n, v] of Object.entries(t)) if (v) r[variable(n as ColorInterfaz)] = v;
  return r;
}
