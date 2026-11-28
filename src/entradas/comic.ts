// motion-kit/comic: la cara de cómic del panel de La Mente. La mano que apunta, el globo, el estallido y el cartel que
// cuelga, y las piezas armadas con ellos (el vacío que invita, la oferta, la guía, el cartel de novedad y la
// celebración). Se baja aparte: solo cuando una pantalla muestra una de estas piezas. Las piezas ponen su propio CSS.

export { Mano } from "../comic/Mano";
export type { ManoProps } from "../comic/Mano";
export { Globo } from "../comic/Globo";
export type { GloboProps } from "../comic/Globo";
export { Estallido } from "../comic/Estallido";
export type { EstallidoProps } from "../comic/Estallido";
export { Colgante } from "../comic/Colgante";
export type { ColganteProps } from "../comic/Colgante";
export { PUNTA_MANO, letraEstallido } from "../comic/calculo";
export { Vacio } from "../comic/Vacio";
export type { VacioProps } from "../comic/Vacio";
export { Oferta } from "../comic/Oferta";
export type { OfertaProps } from "../comic/Oferta";
export { CartelNovedad } from "../comic/CartelNovedad";
export type { CartelNovedadProps } from "../comic/CartelNovedad";
export type { Direccion, Piel } from "../comic/calculo";
export { Guia, ESPERA_OBJETIVO } from "../comic/Guia";
export type { GuiaProps, PasoGuia } from "../comic/Guia";
export { ubicar } from "../comic/ubicar";
export type { Rect, Ubicacion } from "../comic/ubicar";
export { useCelebrar, CelebrarProvider, DURA_CELEBRAR } from "../comic/Celebrar";

// El ADN, también desde aquí: quien usa solo el cómic arma su tema sin bajar motion-kit/interfaz.
export { variablesTema, RITMOS } from "../interfaz/tema";
export type { AdnInterfaz, Ritmo } from "../interfaz/tema";
