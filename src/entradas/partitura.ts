// motion-kit/partitura: lo que usa quien CREA partituras (el Estudio, nosotros). No viaja a las páginas públicas: ahí
// va solo `motion-kit/director`, que las hace correr.
//
// - El lenguaje en español: un texto corto que se traduce a la partitura, y de vuelta.
// - La subida de una partitura de la versión 0 a la 1.
// - El validador y el modelo (los mismos del Director).

export { leerPartitura } from "../partitura/leer";
export type { ErrorTexto, ResultadoTexto } from "../partitura/leer";
export { escribirPartitura } from "../partitura/escribir";
export { subirPartitura } from "../director/subir";
export { validarPartitura } from "../director/validar";
export type { ErrorPartitura, ResultadoPartitura } from "../director/validar";
export { VERSION_PARTITURA, PROFUNDIDAD, NUMEROS_CURVA, SENALES, CURVAS, POR, TRAMOS, ESTADOS, RESORTES, TOPES } from "../director/modelo";
export type { Partitura, Escena, Cambio, PasoTiempo, PasoEstado, PasoScroll, PasoSeguir, Senal, Curva, Por, Tramo, Estado, Resorte } from "../director/modelo";
// Las partituras de la casa (para elegir y combinar) y «Sorpréndeme» (una entrada armada con una semilla).
export { CASA } from "../director/casa";
export type { DeLaCasa } from "../director/casa";
export { sorprender } from "../director/sorprender";
