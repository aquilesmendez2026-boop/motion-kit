// motion-kit/encabezado: lo que una página necesita para dibujar un encabezado desde su receta. Es la entrada que
// usa La Mente; no trae el editor, los rubros, las plantillas ni los medidores (esos están en motion-kit y en
// motion-kit/escena).
export { Encabezado } from "../encabezados/Encabezado";
export type { EncabezadoProps, ObjetoEncabezado } from "../encabezados/Encabezado";
export { ALTOS, ALTO_IDS, SALIDAS, SALIDA_IDS, COMPOSICIONES, COMPOSICION_IDS, ENTRADAS, ENTRADA_IDS } from "../encabezados/catalogo";
export type { AltoEncabezado, SalidaEncabezado, ComposicionId, EntradaId } from "../encabezados/catalogo";
export { Estilo, useEstilo } from "../estilos/Estilo";
export type { EstiloProps } from "../estilos/Estilo";
export type { EstiloId, TextoEfecto } from "../estilos/estilos";
export type { EfectoId, Variante } from "../efectos/tokens";
export type { PackBotonId } from "../piezas/packs";
export type { EnlaceBoton } from "../piezas/BotonesPack";
export type { ModoLuz } from "../escena/LuzYReflejo";
export type { FuenteMovimiento } from "../escena/movimiento";
export type { ModoAhorro, NivelEscena } from "../escena/nivel";
export { EstiloLaMente } from "../receta/EstiloLaMente";
export type { EstiloLaMenteProps } from "../receta/EstiloLaMente";
export * from "../receta/index";
export { sinInyectarEstilos } from "../utils/styles";
