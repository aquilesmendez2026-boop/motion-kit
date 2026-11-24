// motion-kit/director: el motor de animación propio. Un movimiento es un dato (una partitura) y el Director lo hace
// correr con lo que el navegador ya trae. **Versión 0, experimental:** el modelo puede cambiar hasta la fase 2.
// No se exporta desde la entrada principal.

// El motor, sin React.
export { montar } from "../director/montar";
export type { Montaje, OpcionesMontar } from "../director/montar";
// Para React.
export { ConPartitura, usePartitura } from "../director/ConPartitura";
export type { ConPartituraProps, OpcionesPartitura } from "../director/ConPartitura";
// El modelo y su validador.
export { validarPartitura } from "../director/validar";
export type { ErrorPartitura, ResultadoPartitura } from "../director/validar";
export { VERSION_PARTITURA, SENALES, CURVAS, POR, TRAMOS, ESTADOS, RESORTES, TOPES } from "../director/modelo";
export type { Partitura, Escena, Cambio, PasoTiempo, PasoEstado, PasoScroll, PasoSeguir, Senal, Curva, Por, Tramo, Estado, Resorte } from "../director/modelo";
export type { Nivel } from "../director/fotogramas";
