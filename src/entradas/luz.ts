// motion-kit/luz: una sola luz para la página y las superficies que le responden. No se exporta desde la entrada
// principal.

export { Luz, usePermisoInclinacion } from "../luz/Luz";
export type { LuzProps } from "../luz/Luz";
export type { FuenteLuz } from "../luz/seguir-luz";
export { Materia, MATERIAS } from "../luz/Materia";
export type { MateriaProps, TipoMateria } from "../luz/Materia";
export { TarjetaHolografica, TituloConVolumen } from "../luz/Piezas";
export type { TituloConVolumenProps } from "../luz/Piezas";
// Lo calculable, por si la página quiere saber dónde está la luz o dibujar algo propio con ella.
export { REPOSO, RANGO, ALTURA_MAX, limpiarLuz, luzAhora, luzDeLaHora, sombraDe } from "../luz/calculo-luz";
export type { Punto } from "../luz/calculo-luz";
