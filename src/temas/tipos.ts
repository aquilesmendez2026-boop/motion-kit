// Los temas como datos (fase 2 de «Un solo motor»): paletas, temas y mezclas de la página y del panel de La Mente, en
// un solo catálogo. Diseño: docs/superpowers/specs/2026-11-28-un-solo-motor-design.md; plan:
// docs/superpowers/plans/2026-11-28-un-solo-motor-fase-2.md.
import type { EstiloId, TextoEfecto } from "../estilos/estilos";
import type { FormaInterfaz, Ritmo } from "../interfaz/tema";
import type { TarjetaEfecto, TarjetaVariante } from "../piezas/Tarjeta";

/** Para qué lado sirve un tema: la página pública de cada negocio o su panel. */
export type Para = "pagina" | "panel";

/** Los colores de una paleta (o de un tema que trae los suyos). `cartel`: el amarillo de carteles y foco del panel. */
export interface Colores {
  fondo: string;
  superficie: string;
  texto: string;
  suave: string;
  borde: string;
  acento: string;
  sobreAcento: string;
  cartel?: string;
}

/** La letra de un tema. `google`: las familias que se cargan al elegirlo (el texto de `family=` de Google Fonts). */
export interface Letra {
  fuenteTexto?: string;
  fuenteTitulo?: string;
  fuenteCartel?: string;
  google?: string[];
  peso?: number;
  mayusculas?: boolean;
  espaciado?: string;
  brillo?: boolean;
}

/** Cómo se mueve un tema (de la guía del front, temasGuia.ts). */
export interface Movimiento {
  titulo: TextoEfecto;
  tarjeta: { variante: TarjetaVariante; efecto: TarjetaEfecto | TarjetaEfecto[] };
  presencia: string;
  /** Los colores de la luz que recorre un borde (GlowBorder). */
  luz: string[];
}

/** Lo que un tema define para un lado. `detalle`: variables de detalle de las piezas (`campo-foco` → `--mk-campo-foco`). */
export interface Lado {
  colores?: Partial<Colores>;
  forma?: Partial<Record<FormaInterfaz, string>>;
  detalle?: Record<string, string>;
  letra?: Letra;
  ritmo?: Ritmo;
  /** Los adornos con nombre (la firma del tema), ver src/temas/adornos.ts. */
  adornos?: string[];
}

export interface Tema extends Lado {
  id: string;
  nombre: string;
  para: Para[];
  premium?: boolean;
  /** La paleta por defecto (en la página, el negocio puede elegir otra). */
  paleta?: string;
  /** El estilo del encabezado que le queda (como BASE_DE_TEMA de src/receta/lamente.ts). */
  estiloBase?: EstiloId;
  rubros?: string[];
  movimiento?: Movimiento;
  /** Lo que cambia en el panel cuando el mismo id existe en los dos lados con valores distintos (noche, rock). */
  panel?: Lado;
  /** Los colores en modo oscuro, si el tema lo tiene (hoy, «lamente» del panel). */
  oscuro?: Partial<Colores>;
}

export interface Paleta {
  id: string;
  nombre: string;
  colores: Colores;
}

/** Una receta para un tipo de negocio: tema + paleta + por qué. */
export interface Mezcla {
  id: string;
  nombre: string;
  rubros: string[];
  tema: string;
  paleta: string;
  porQue: string;
}
