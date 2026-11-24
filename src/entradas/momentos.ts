// motion-kit/momentos: el efecto propio de cada bloque de La Mente (sellos, reseñas, precios, eventos, ubicación,
// galería y sorteos), con resorte por estilo y tres niveles. No se exporta desde la entrada principal.
// Aquí va solo lo que usa quien arma la página: las piezas, sus tipos y lo que sirve fuera de ellas (el resorte, la
// cuenta regresiva en palabras y los formatos de Chile). Los cálculos internos (rangos, giros, calles del mapa) quedan
// en src/momentos/, con sus pruebas, y no son parte del paquete público.

// Las piezas, una por bloque.
export { SellosEstampa } from "../momentos/SellosEstampa";
export type { SellosEstampaProps } from "../momentos/SellosEstampa";
export { ResenasPila } from "../momentos/ResenasPila";
export type { ResenasPilaProps, ResenaMomento } from "../momentos/ResenasPila";
export { CartaQueSeAbre } from "../momentos/CartaQueSeAbre";
export type { CartaQueSeAbreProps } from "../momentos/CartaQueSeAbre";
export { PrecioQueRueda } from "../momentos/PrecioQueRueda";
export type { PrecioQueRuedaProps } from "../momentos/PrecioQueRueda";
export { CuentaRegresiva } from "../momentos/CuentaRegresiva";
export type { CuentaRegresivaProps } from "../momentos/CuentaRegresiva";
export { MapaDibujado } from "../momentos/MapaDibujado";
export type { MapaDibujadoProps } from "../momentos/MapaDibujado";
export { MosaicoQueSeArma } from "../momentos/MosaicoQueSeArma";
export type { MosaicoQueSeArmaProps } from "../momentos/MosaicoQueSeArma";
// Estas tres se bajan aparte (React.lazy); si su archivo no baja, la página sigue.
export { AntesDespues, SorteoRaspe, Confeti } from "../momentos/perezosos";
export type { AntesDespuesProps } from "../momentos/AntesDespues";
export type { SorteoRaspeProps } from "../momentos/SorteoRaspe";

// La base: cuándo arranca un momento y en qué nivel, y el resorte de cada estilo.
export { useMomento } from "../momentos/base";
export type { ComunesMomento } from "../momentos/base";
export type { NivelEscena, ModoAhorro } from "../escena/nivel";
export { resorte, RESORTE_MEDIO, RESORTES_DE_ESTILO } from "../momentos/resorte";
export type { OpcionesResorte, Resorte } from "../momentos/resorte";

// Lo que sirve fuera de las piezas: cuánto falta para un evento (con la hora del negocio) y los formatos de Chile.
export { faltaPara, formatoPesos, formatoDecimal } from "../momentos/calculos";
export type { Falta } from "../momentos/calculos";
export { sinInyectarEstilos } from "../utils/styles";
