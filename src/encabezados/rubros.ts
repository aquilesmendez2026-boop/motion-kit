import type { EstiloId } from "../estilos/estilos";
import type { ShaderId } from "../escena/ShaderFondo";
import type { FormaObjeto } from "../escena/Objeto3DCss";
import type { ModoLuz } from "../escena/LuzYReflejo";
import type { ComposicionId } from "./catalogo";
import { encabezadoAlAzar, type EncabezadoAzar } from "./sorprendeme";

export type RubroId =
  | "cafeteria" | "hamburgueseria" | "restaurante" | "barberia" | "peluqueria"
  | "veterinaria" | "gimnasio" | "academia" | "tienda" | "consulta";

export interface TextosEncabezado {
  antetitulo: string;
  titulo: string;
  bajada: string;
  boton: string;
  secundario: string;
  datos: string[];
}

export interface RubroDef {
  nombre: string;
  estilos: EstiloId[];
  composiciones: ComposicionId[];
  shaders: ShaderId[];
  luz?: ModoLuz;
  /** Objeto 3D que le queda al rubro (se sugiere, no se pone solo). */
  objeto?: FormaObjeto;
  /** Textos de ejemplo: el equipo los cambia por los del negocio. */
  textos: TextosEncabezado[];
}

/**
 * Plantillas de encabezado por rubro: qué estilos, composiciones y fondos le quedan, y textos de ejemplo.
 * Con `encabezadoPorRubro` dos negocios del mismo rubro salen distintos (otra semilla, otro resultado).
 */
export const RUBROS: Record<RubroId, RubroDef> = {
  cafeteria: {
    nombre: "Cafetería", estilos: ["pelicula", "retro", "anime"], composiciones: ["dividido", "izquierda", "poster", "tarjeta"], shaders: ["humo", "liquido"], luz: "puntero", objeto: "lata",
    textos: [
      { antetitulo: "Barrio Italia · desde 2019", titulo: "Café de *especialidad*, tostado aquí", bajada: "Granos de origen, pan de masa madre y un rincón tranquilo para quedarse.", boton: "Ver la carta", secundario: "Cómo llegar", datos: ["Lun a sáb", "8:00 a 20:00"] },
      { antetitulo: "Tostaduría de barrio", titulo: "El mejor *cortado* de la cuadra", bajada: "Molemos al momento y horneamos cada mañana.", boton: "Pedir para llevar", secundario: "Horarios", datos: ["Abierto hoy", "Delivery"] },
    ],
  },
  hamburgueseria: {
    nombre: "Hamburguesería", estilos: ["neon", "rock", "retro"], composiciones: ["letrero", "gigante", "marquesina", "dividido"], shaders: ["luz", "aurora"], luz: "barrido", objeto: "caja",
    textos: [
      { antetitulo: "Smash burgers", titulo: "*Doble* carne, doble queso", bajada: "Pan brioche, papas cortadas a mano y salsas de la casa.", boton: "Pedir ahora", secundario: "Ver la carta", datos: ["Jue a dom", "Hasta las 00:00"] },
      { antetitulo: "Desde la plancha", titulo: "Hamburguesas que *suenan*", bajada: "Hechas al momento, nunca congeladas.", boton: "Pedir por WhatsApp", secundario: "Dónde estamos", datos: ["Retiro y delivery"] },
    ],
  },
  restaurante: {
    nombre: "Restaurante", estilos: ["pelicula", "retro", "neon"], composiciones: ["imagen", "tarjeta", "dividido", "centrado"], shaders: ["humo", "aurora"], luz: "puntero",
    textos: [
      { antetitulo: "Cocina de temporada", titulo: "Una mesa para *volver*", bajada: "Productos del día, vinos chilenos y una sobremesa larga.", boton: "Reservar", secundario: "Ver la carta", datos: ["Mar a dom", "13:00 a 23:00"] },
    ],
  },
  barberia: {
    nombre: "Barbería", estilos: ["retro", "rock", "pelicula"], composiciones: ["boleto", "poster", "letrero", "izquierda"], shaders: ["humo", "luz"], luz: "barrido",
    textos: [
      { antetitulo: "Barbería clásica", titulo: "Corte y barba *a navaja*", bajada: "Toalla caliente, buena música y hora sin esperas.", boton: "Reservar hora", secundario: "Precios", datos: ["Lun a sáb", "10:00 a 20:00"] },
      { antetitulo: "Desde 1998", titulo: "El corte de *siempre*, bien hecho", bajada: "Reserva en un minuto y llega a tu hora.", boton: "Agendar", secundario: "Cómo llegar", datos: ["Con y sin hora"] },
    ],
  },
  peluqueria: {
    nombre: "Peluquería y belleza", estilos: ["anime", "pelicula", "neon"], composiciones: ["dividido", "centrado", "tarjeta", "vinetas"], shaders: ["liquido", "aurora"], luz: "puntero",
    textos: [
      { antetitulo: "Color, corte y peinado", titulo: "Tu pelo, *tu estilo*", bajada: "Asesoría de color y productos que cuidan tu pelo.", boton: "Reservar hora", secundario: "Servicios", datos: ["Mar a sáb", "Con hora"] },
    ],
  },
  veterinaria: {
    nombre: "Veterinaria y peluquería de mascotas", estilos: ["anime", "retro"], composiciones: ["dividido", "centrado", "vinetas", "izquierda"], shaders: ["liquido", "aurora"], luz: "puntero",
    textos: [
      { antetitulo: "Veterinaria de barrio", titulo: "Cuidamos a *tu familia*", bajada: "Consultas, vacunas y baño con cariño y sin apuro.", boton: "Reservar hora", secundario: "Urgencias", datos: ["Lun a dom", "9:00 a 21:00"] },
    ],
  },
  gimnasio: {
    nombre: "Gimnasio y deporte", estilos: ["rock", "neon"], composiciones: ["gigante", "marquesina", "poster", "imagen"], shaders: ["luz", "aurora"], luz: "barrido",
    textos: [
      { antetitulo: "Entrena con nosotros", titulo: "Más *fuerte* cada semana", bajada: "Clases guiadas, máquinas nuevas y planes sin matrícula.", boton: "Clase de prueba", secundario: "Planes", datos: ["Lun a vie 6:00 a 23:00"] },
    ],
  },
  academia: {
    nombre: "Academia y clases", estilos: ["anime", "retro", "pelicula"], composiciones: ["vinetas", "dividido", "centrado", "pantalla"], shaders: ["aurora", "liquido"], luz: "puntero",
    textos: [
      { antetitulo: "Clases presenciales y en línea", titulo: "Aprende *haciendo*", bajada: "Grupos chicos, profes que acompañan y horarios flexibles.", boton: "Ver clases", secundario: "Inscribirme", datos: ["Inicio cada mes"] },
    ],
  },
  tienda: {
    nombre: "Tienda", estilos: ["neon", "anime", "pelicula"], composiciones: ["dividido", "tarjeta", "imagen", "marquesina"], shaders: ["liquido", "luz"], luz: "barrido", objeto: "caja",
    textos: [
      { antetitulo: "Hecho a mano", titulo: "Cosas lindas, *bien hechas*", bajada: "Piezas únicas, envíos a todo Chile.", boton: "Ver catálogo", secundario: "Envíos", datos: ["Despacho en 48 h"] },
    ],
  },
  consulta: {
    nombre: "Salud y consulta", estilos: ["pelicula", "anime"], composiciones: ["izquierda", "dividido", "centrado", "tarjeta"], shaders: ["aurora", "humo"],
    textos: [
      { antetitulo: "Atención profesional", titulo: "Tu salud, *sin esperas*", bajada: "Agenda en línea y atención cercana.", boton: "Agendar hora", secundario: "Especialidades", datos: ["Lun a vie", "Con hora"] },
    ],
  },
};
export const RUBRO_IDS = Object.keys(RUBROS) as RubroId[];

export interface EncabezadoDeRubro extends EncabezadoAzar {
  rubro: RubroId;
  estilo: EstiloId;
  shader?: ShaderId;
  /** Con shader, el efecto de fondo va apagado: un solo protagonista de fondo. */
  conEfecto: boolean;
  profundidad: boolean;
  luz?: ModoLuz;
  textos: TextosEncabezado;
}

/** Un generador con semilla: la misma semilla da el mismo encabezado (para repetirlo o guardarlo). */
export function semillaAzar(semilla: number): () => number {
  let a = semilla >>> 0 || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Encabezado para un rubro: estilo, composición, fondo, escena y textos de ejemplo que le quedan. */
export function encabezadoPorRubro(rubro: RubroId, azar: () => number = Math.random): EncabezadoDeRubro {
  const r = RUBROS[rubro];
  const elige = <T,>(xs: readonly T[]) => xs[Math.floor(azar() * xs.length)];
  const estilo = elige(r.estilos);
  const base = encabezadoAlAzar(estilo, azar);
  const usaShader = azar() < 0.55;
  return {
    ...base,
    rubro,
    estilo,
    composicion: elige(r.composiciones),
    shader: usaShader ? elige(r.shaders) : undefined,
    conEfecto: !usaShader,
    profundidad: azar() < 0.6,
    luz: r.luz && azar() < 0.5 ? r.luz : undefined,
    textos: elige(r.textos),
  };
}
