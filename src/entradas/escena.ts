// motion-kit/escena: encabezados vivos sin dependencias (capas, luz, shader, objeto 3D, video, secuencia),
// ahorro según el teléfono y medidores para el editor (peso, fluidez, carga, contraste).
export { CapasProfundidad, CapasEscena, CAPAS_POR_DEFECTO } from "../escena/CapasProfundidad";
export type { Capa, FormaCapa, CapasProfundidadProps } from "../escena/CapasProfundidad";
export { LuzYReflejo, LuzEscena } from "../escena/LuzYReflejo";
export type { ModoLuz, LuzYReflejoProps } from "../escena/LuzYReflejo";
export { useMovimientoEscena } from "../escena/movimiento";
export type { FuenteMovimiento, OpcionesMovimiento } from "../escena/movimiento";
export { MedidorPeso, usePeso } from "../escena/MedidorPeso";
export type { MedidorPesoProps } from "../escena/MedidorPeso";
export { medirPeso, recursosDe, estadoPeso, formatearPeso, PRESUPUESTO_ENCABEZADO, PRESUPUESTO_RECURSOS, ANCHO_ESCRITORIO } from "../escena/peso";
export type { Dispositivo, EstadoPeso, Presupuesto, MedicionPeso, RecursoPeso, TipoRecurso, OrigenDato } from "../escena/peso";
export { ShaderFondo, SHADERS, SHADER_IDS } from "../escena/ShaderFondo";
export type { ShaderId, ShaderFondoProps } from "../escena/ShaderFondo";
export { Objeto3DCss, FORMAS_OBJETO } from "../escena/Objeto3DCss";
export type { FormaObjeto, Objeto3DCssProps } from "../escena/Objeto3DCss";
export { EscenaVideo } from "../escena/EscenaVideo";
export type { EscenaVideoProps } from "../escena/EscenaVideo";
export { SecuenciaScroll, cuadrosDe } from "../escena/SecuenciaScroll";
export type { SecuenciaScrollProps } from "../escena/SecuenciaScroll";
export { comprimirFoto } from "../escena/comprimir";
export type { OpcionesComprimir, FotoComprimida } from "../escena/comprimir";
export { useNivelEscena, useModoAhorro, useFluidez, senalesAhorro, hayQueAhorrar } from "../escena/nivel";
export type { NivelEscena, ModoAhorro, SenalesAhorro, Fluidez } from "../escena/nivel";
export { MedidorFluidez, MedidorCarga, SemaforoContraste, useCarga, revisarContraste } from "../escena/calidad";
export type { MedidorFluidezProps, Carga, FallaContraste, SemaforoContrasteProps } from "../escena/calidad";
