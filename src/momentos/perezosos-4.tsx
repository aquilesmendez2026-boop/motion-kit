// «Con el dedo» (cupón que se arranca, sticker que se despega, sellos con timbre y ruleta de premios): cada pieza se
// baja aparte cuando se usa (ver aparte.tsx). Mientras llega, se ve el `respaldo` que le pasen.
import { aparte } from "./aparte";
import type { CuponQueSeArrancaProps } from "./CuponQueSeArranca";
import type { StickerQueSeDespegaProps } from "./StickerQueSeDespega";
import type { SellosConTimbreProps } from "./SellosConTimbre";
import type { RuletaDePremiosProps } from "./RuletaDePremios";

export const CuponQueSeArranca = aparte<CuponQueSeArrancaProps>(() => import("./CuponQueSeArranca"));
export const StickerQueSeDespega = aparte<StickerQueSeDespegaProps>(() => import("./StickerQueSeDespega"));
export const SellosConTimbre = aparte<SellosConTimbreProps>(() => import("./SellosConTimbre"));
export const RuletaDePremios = aparte<RuletaDePremiosProps>(() => import("./RuletaDePremios"));
