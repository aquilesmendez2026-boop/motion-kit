// La segunda tanda de momentos: cada pieza se baja aparte cuando se usa (ver aparte.tsx). Mientras llega, se ve el
// `respaldo` que le pasen.
import { aparte } from "./aparte";
import type { FechasQueVienenProps } from "./FechasQueVienen";
import type { ClasesDeHoyProps } from "./ClasesDeHoy";
import type { NovedadesQueLleganProps } from "./NovedadesQueLlegan";
import type { EnlacesDominoProps } from "./EnlacesDomino";
import type { EpisodiosOndaProps } from "./EpisodiosOnda";
import type { SeccionesVivasProps } from "./SeccionesVivas";
import type { AvisoQueSeDespliegaProps } from "./AvisoQueSeDespliega";
import type { CintaConImpulsoProps } from "./CintaConImpulso";
import type { LlamadoConVidaProps } from "./LlamadoConVida";

export const FechasQueVienen = aparte<FechasQueVienenProps>(() => import("./FechasQueVienen"));
export const ClasesDeHoy = aparte<ClasesDeHoyProps>(() => import("./ClasesDeHoy"));
export const NovedadesQueLlegan = aparte<NovedadesQueLleganProps>(() => import("./NovedadesQueLlegan"));
export const EnlacesDomino = aparte<EnlacesDominoProps>(() => import("./EnlacesDomino"));
export const EpisodiosOnda = aparte<EpisodiosOndaProps>(() => import("./EpisodiosOnda"));
export const SeccionesVivas = aparte<SeccionesVivasProps>(() => import("./SeccionesVivas"));
export const AvisoQueSeDespliega = aparte<AvisoQueSeDespliegaProps>(() => import("./AvisoQueSeDespliega"));
export const CintaConImpulso = aparte<CintaConImpulsoProps>(() => import("./CintaConImpulso"));
export const LlamadoConVida = aparte<LlamadoConVidaProps>(() => import("./LlamadoConVida"));
