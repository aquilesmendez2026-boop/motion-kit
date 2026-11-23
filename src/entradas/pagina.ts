// motion-kit/pagina: relatos (cómo se cuenta la página al bajar) y la receta de página. Va junto con
// motion-kit/encabezado: la página de un negocio usa las dos.
export { PaginaRelato, ContextoRelato, caminoHilo } from "../relatos/PaginaRelato";
export type { PaginaRelatoProps, ContextoRelatos } from "../relatos/PaginaRelato";
export { Relato } from "../relatos/Relato";
export type { RelatoProps } from "../relatos/Relato";
export { FraseRelato } from "../relatos/FraseRelato";
export type { FraseRelatoProps } from "../relatos/FraseRelato";
export { RELATOS, RELATO_IDS, RELATOS_DE_BLOQUE, RELATOS_DE_PAGINA, RELATO_DE_ESTILO, PARTES_RELATO } from "../relatos/catalogo";
export type { RelatoId, RelatoBloqueId, RelatoPaginaId, ParteRelato, FichaRelato } from "../relatos/catalogo";
export { validarPagina, normalizarPagina, relatoDeBloque, TOPES_PAGINA, CAMPOS_PAGINA } from "../relatos/receta-pagina";
export type { RecetaPagina, BloqueRelato } from "../relatos/receta-pagina";
export { sinInyectarEstilos } from "../utils/styles";
