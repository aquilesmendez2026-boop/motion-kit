// El ADN de las piezas (motion-kit/interfaz y motion-kit/comic): color, forma, letra y ritmo. Cada pieza los lee por
// variables CSS `--mk-*`, así toman el tema de quien las usa (el panel de La Mente conecta las suyas a estas). Sin
// variables, cada uso trae su respaldo y se ve como siempre. Fase 1 de «Un solo motor»
// (docs/superpowers/specs/2026-11-28-un-solo-motor-design.md; los nombres de La Mente, en docs/un-solo-motor/).

export type ColorInterfaz = "fondo" | "superficie" | "texto" | "suave" | "borde" | "acento" | "sobreAcento" | "bien" | "mal";
export type TemaInterfaz = Record<ColorInterfaz, string>;
/** La forma: el trazo (borde completo), las esquinas, las sombras y lo que hace un botón al tocarlo. */
export type FormaInterfaz = "trazo" | "radioTarjeta" | "radioBoton" | "radioCampo" | "sombra" | "sombraSuave" | "hundir";
export type LetraInterfaz = "fuenteTexto" | "fuenteTitulo" | "fuenteCartel";
/** Cuánto y cómo se mueven las piezas: «vivo» es el de siempre; «quieto» no salta; «manga», más rápido y marcado. */
export type Ritmo = "quieto" | "suave" | "vivo" | "manga";
export type AdnInterfaz = TemaInterfaz & Record<FormaInterfaz | LetraInterfaz, string> & { ritmo: Ritmo };

/** Cada ritmo: `tiempo` multiplica las duraciones y `fuerza`, cuánto escalan, giran o se corren las piezas. */
export const RITMOS: Record<Ritmo, { tiempo: number; fuerza: number }> = {
  quieto: { tiempo: 1, fuerza: 0 },
  suave: { tiempo: 1.25, fuerza: 0.6 },
  vivo: { tiempo: 1, fuerza: 1 },
  manga: { tiempo: 0.85, fuerza: 1.4 },
};

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
const variable = (n: string) => `--mk-${kebab(n)}`;

/** El color como CSS: `c("acento")` → `var(--mk-acento,var(--lm-acento,#7c5cff))`. */
export function c(nombre: ColorInterfaz): string {
  const respaldo = CON_LM.has(nombre) ? `var(--lm-${kebab(nombre)},${RESPALDO[nombre]})` : RESPALDO[nombre];
  return `var(${variable(nombre)},${respaldo})`;
}

const conRespaldo = (nombre: string, respaldo: string) => `var(${variable(nombre)},${respaldo})`;
/** La forma como CSS, con el valor de hoy de esa pieza como respaldo: `f("radioBoton", "12px")`. */
export const f: (nombre: FormaInterfaz, respaldo: string) => string = conRespaldo;
/** La letra como CSS, con su respaldo: `letra("fuenteTitulo", "inherit")`. */
export const letra: (nombre: LetraInterfaz, respaldo: string) => string = conRespaldo;

/** La letra de cartel (títulos de cómic, globos): el front la conecta a la suya (`--lmt-cartel`). */
export function fuenteCartel(): string {
  return letra("fuenteCartel", "'Arial Black','Helvetica Neue',sans-serif");
}

/** Una duración que sigue el ritmo: `tiempo(300)` → `calc(300ms*var(--mk-ritmo-tiempo,1))`. */
export const tiempo = (ms: number): string => `calc(${ms}ms*var(--mk-ritmo-tiempo,1))`;
/** Una amplitud que sigue el ritmo: `scale(calc(1 + ${fuerza(0.08)}))`. */
export const fuerza = (n: number): string => `calc(${n}*var(--mk-ritmo-fuerza,1))`;

/** El ritmo de un elemento, para las animaciones con `animate()`. Sin variables (o con algo raro), el de siempre. */
export function ritmoDe(el: Element): { tiempo: number; fuerza: number } {
  const estilo = getComputedStyle(el);
  // NaN (sin variable o algo raro) no es >= 0: queda el de siempre.
  const leer = (n: string) => {
    const v = parseFloat(estilo.getPropertyValue("--mk-ritmo-" + n));
    return v >= 0 && v < 10 ? v : 1;
  };
  return { tiempo: leer("tiempo"), fuerza: leer("fuerza") };
}

/** El amarillo de los carteles y estallidos de cómic. */
export const CARTEL = "var(--mk-cartel,#ffd23f)";

/**
 * Las variables para un `style` (o para `:root`): `variablesTema({ acento: "#7c3aed", radioBoton: "0px" })` →
 * `{ "--mk-acento": "#7c3aed", "--mk-radio-boton": "0px" }`. El ritmo se vuelve `--mk-ritmo-tiempo` y `--mk-ritmo-fuerza`.
 */
export function variablesTema(t: Partial<AdnInterfaz>): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [n, v] of Object.entries(t)) {
    if (!v) continue;
    if (n === "ritmo") {
      const ritmo = RITMOS[v as Ritmo];
      if (!ritmo) continue;
      r["--mk-ritmo-tiempo"] = String(ritmo.tiempo);
      r["--mk-ritmo-fuerza"] = String(ritmo.fuerza);
    } else r[variable(n)] = v;
  }
  return r;
}
