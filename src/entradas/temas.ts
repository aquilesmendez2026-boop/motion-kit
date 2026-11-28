// motion-kit/temas: el catálogo de temas (paletas, temas y mezclas de la página y del panel) y cómo se aplican.
// Fase 2 de «Un solo motor». Ver «Temas como datos» en docs/CATALOGO.md.
export type { Para, Colores, Letra, Movimiento, Lado, Tema as DatosTema, Paleta, Mezcla } from "../temas/tipos";
export { PALETAS, TEMAS } from "../temas/datos";
// Las mezclas (con su «por qué») no van aquí: las usan el Estudio y el backend, desde contrato/temas-motionkit.json.
export { buscarTema, variablesDeTema, adornosDe, VARIABLES_TEMA } from "../temas/aplicar";
export { Tema } from "../temas/Tema";
export type { TemaProps } from "../temas/Tema";
export { cargarLetra, familiasDe } from "../temas/letras";
