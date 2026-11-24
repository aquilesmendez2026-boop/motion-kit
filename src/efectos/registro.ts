import type { EfectoDef, EfectoId } from "./tokens";

export const EFECTOS: Record<EfectoId, EfectoDef> = {
  cafe: { id: "cafe", nombre: "Café", familia: "escena", rubros: ["comida"], animo: "sobrio", cargar: () => import("./escenas/Cafe") },
  petalos: { id: "petalos", nombre: "Pétalos", familia: "escena", rubros: ["belleza"], animo: "sobrio", cargar: () => import("./escenas/Petalos") },
  pulso: { id: "pulso", nombre: "Pulso", familia: "escena", rubros: ["salud"], animo: "sobrio", cargar: () => import("./escenas/Pulso") },
  abecedario: { id: "abecedario", nombre: "Abecedario", familia: "escena", rubros: ["clases"], animo: "vistoso", cargar: () => import("./escenas/Abecedario") },
  letrero: { id: "letrero", nombre: "Letrero de neón", familia: "escena", rubros: ["barrio"], animo: "vistoso", cargar: () => import("./escenas/Letrero") },
  cometas: { id: "cometas", nombre: "Cometas", familia: "escena", rubros: ["otro"], animo: "vistoso", cargar: () => import("./escenas/Cometas") },
  niebla: { id: "niebla", nombre: "Niebla", familia: "fondo", rubros: ["comida"], animo: "sobrio", cargar: () => import("./fondos/Niebla") },
  burbujas: { id: "burbujas", nombre: "Burbujas", familia: "fondo", rubros: ["belleza"], animo: "vistoso", cargar: () => import("./fondos/Burbujas") },
  olas: { id: "olas", nombre: "Olas", familia: "fondo", rubros: ["salud"], animo: "sobrio", cargar: () => import("./fondos/Olas") },
  puntos: { id: "puntos", nombre: "Puntos que respiran", familia: "fondo", rubros: ["clases"], animo: "sobrio", cargar: () => import("./fondos/Puntos") },
  lluvia: { id: "lluvia", nombre: "Lluvia de luz", familia: "fondo", rubros: ["barrio"], animo: "vistoso", cargar: () => import("./fondos/Lluvia") },
  rejilla: { id: "rejilla", nombre: "Rejilla neón", familia: "estilo", rubros: ["barrio", "otro"], animo: "vistoso", cargar: () => import("./estilos/Rejilla") },
  tubo: { id: "tubo", nombre: "Pantalla de tubo", familia: "estilo", rubros: ["clases", "otro"], animo: "sobrio", cargar: () => import("./estilos/Tubo") },
  ecualizador: { id: "ecualizador", nombre: "Ecualizador", familia: "estilo", rubros: ["barrio", "otro"], animo: "vistoso", cargar: () => import("./estilos/Ecualizador") },
  velocidad: { id: "velocidad", nombre: "Líneas de velocidad", familia: "estilo", rubros: ["clases", "otro"], animo: "vistoso", cargar: () => import("./estilos/Velocidad") },
  grano: { id: "grano", nombre: "Grano de película", familia: "estilo", rubros: ["comida", "otro"], animo: "sobrio", cargar: () => import("./estilos/Grano") },
  estrellas: { id: "estrellas", nombre: "Estrellas", familia: "fondo", rubros: ["otro"], animo: "sobrio", cargar: () => import("./fondos/Estrellas") },
  // Objetos del rubro que caen y se apilan (lienzo 2D con física propia).
  granos: { id: "granos", nombre: "Granos que caen", familia: "escena", rubros: ["comida"], animo: "vistoso", cargar: () => import("./escenas/Granos") },
  tijeras: { id: "tijeras", nombre: "Tijeras que caen", familia: "escena", rubros: ["belleza"], animo: "vistoso", cargar: () => import("./escenas/Tijeras") },
  huellas: { id: "huellas", nombre: "Huellas que caen", familia: "escena", rubros: ["otro"], animo: "vistoso", cargar: () => import("./escenas/Huellas") },
  pesas: { id: "pesas", nombre: "Pesas que caen", familia: "escena", rubros: ["salud"], animo: "vistoso", cargar: () => import("./escenas/Pesas") },
  lapices: { id: "lapices", nombre: "Lápices que caen", familia: "escena", rubros: ["clases"], animo: "vistoso", cargar: () => import("./escenas/Lapices") },
  constelacion: { id: "constelacion", nombre: "Constelación", familia: "fondo", rubros: ["otro"], animo: "sobrio", cargar: () => import("./fondos/Constelacion") },
  // Fondos vivos de lienzo (segunda tanda): siguen al dedo y quedan en un cuadro con movimiento reducido.
  bandada: { id: "bandada", nombre: "Bandada", familia: "fondo", rubros: ["otro"], animo: "vistoso", cargar: () => import("./fondos/Bandada") },
  luciernagas: { id: "luciernagas", nombre: "Luciérnagas", familia: "fondo", rubros: ["comida"], animo: "sobrio", cargar: () => import("./fondos/Luciernagas") },
  corrientes: { id: "corrientes", nombre: "Corrientes", familia: "fondo", rubros: ["belleza"], animo: "sobrio", cargar: () => import("./fondos/Corrientes") },
  gotas: { id: "gotas", nombre: "Gotas", familia: "fondo", rubros: ["salud"], animo: "sobrio", cargar: () => import("./fondos/Gotas") },
  relieve: { id: "relieve", nombre: "Relieve", familia: "fondo", rubros: ["clases"], animo: "sobrio", cargar: () => import("./fondos/Relieve") },
};

export const ids = Object.keys(EFECTOS) as EfectoId[];
