export {
  VERSION_RECETA, VERSIONES_RECETA, LISTAS_RECETA, TOPES_RECETA, DEFECTOS_RECETA, PROTAGONISTA_RECETA, CAMPOS_RECETA, OBLIGATORIOS_RECETA,
  validarReceta, normalizarReceta, recetaAProps, protagonistaDe, esHrefSeguro, esImagenSegura,
} from "./receta";
export type { RecetaEncabezado, BotonReceta, ErrorReceta, ResultadoReceta, OpcionesProps, Tratamiento } from "./receta";
export { franjaDe } from "./hora";
export type { FranjaHora } from "./hora";
export { contratoEncabezado, textoContrato } from "./contrato";
export {
  estiloDesdeLaMente, TEMAS_LAMENTE, PALETAS_LAMENTE, TEMA_LAMENTE_IDS, PALETA_LAMENTE_IDS, BASE_DE_TEMA, contraste, luminancia, mezclar,
} from "./lamente";
export type { TemaLaMente, PaletaLaMente, ColorLaMente, FormaTemaLaMente, PuenteLaMente } from "./lamente";
