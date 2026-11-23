import type { EfectoId, Rubro, Variante } from "../efectos/tokens";
import type { EstiloId, TextoEfecto } from "../estilos/estilos";
import type { ComposicionId, EntradaId } from "../encabezados/catalogo";
import type { PackBotonId } from "../piezas/packs";

export interface Enlace { texto: string; href: string }

export interface Item {
  titulo: string;
  texto?: string;
  precio?: string;
  /** URL de foto. Sin foto, se dibuja una ilustración del estilo con este tono (0–360). */
  imagen?: string;
  tono?: number;
}

export type Seccion =
  | {
      tipo: "portada";
      /** Una palabra entre asteriscos se resalta: `*Smash* burgers`. */
      titulo: string;
      bajada: string;
      boton: Enlace;
      botonSecundario?: Enlace;
      efectoTexto?: TextoEfecto;
      composicion?: ComposicionId;
      entrada?: EntradaId;
      pack?: PackBotonId;
      antetitulo?: string;
      datos?: string[];
      imagenes?: string[];
    }
  | { tipo: "destacados"; id?: string; titulo: string; items: Item[] }
  | { tipo: "galeria"; id?: string; titulo: string; items: Item[] }
  | { tipo: "historia"; id?: string; titulo: string; parrafos: string[]; cifras?: { valor: string; texto: string }[] }
  | { tipo: "testimonios"; id?: string; titulo: string; items: { texto: string; autor: string }[] }
  | { tipo: "llamado"; id?: string; titulo: string; texto: string; boton: Enlace }
  | { tipo: "contacto"; id?: string; titulo: string };

/**
 * Una página completa descrita como datos. Así se puede guardar (por ejemplo en el contrato de diseño
 * de La Mente), editar desde un formulario y dibujar con `<PaginaReceta>`.
 */
export interface Receta {
  id: string;
  nombre: string;
  estilo: EstiloId;
  rubro: Rubro;
  efecto: EfectoId;
  variante: Variante;
  /** Colores que reemplazan los del estilo, por ejemplo `{ "--mk-acento": "#00e0a0" }`. */
  colores?: Record<string, string>;
  negocio: { nombre: string; lema?: string; direccion?: string; horario?: string; telefono?: string; instagram?: string };
  menu?: Enlace[];
  secciones: Seccion[];
}

/**
 * Propuesta de qué puede cambiar un cliente sin romper la plantilla (el resto lo fija el equipo).
 * Las rutas usan la forma de `Receta`.
 */
export const EDITABLE_POR_CLIENTE = [
  "negocio.*",
  "menu[].texto",
  "secciones[].titulo",
  "secciones[].antetitulo",
  "secciones[].datos",
  "secciones[].imagenes",
  "secciones[].composicion (portada)",
  "secciones[].entrada (portada)",
  "secciones[].efectoTexto (portada)",
  "secciones[].pack (portada)",
  "secciones[].bajada",
  "secciones[].texto",
  "secciones[].parrafos",
  "secciones[].boton",
  "secciones[].items[]",
  "secciones[].cifras",
  "colores['--mk-acento']",
  "efecto (solo entre ESTILOS[estilo].efectos)",
  "variante",
] as const;
