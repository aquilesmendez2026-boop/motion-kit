// El contrato de temas (fase 2 de «Un solo motor»): paletas, temas, mezclas y los nombres de los adornos, en JSON puro,
// para que el backend valide y el front dibuje con lo mismo. Lo escribe scripts/generar-contrato.mjs.
import { CSS_ADORNOS } from "./datos/adornos";
import { MEZCLAS, PALETAS, TEMAS } from "./datos";
import type { Mezcla, Paleta, Tema } from "./tipos";

export function contratoTemas(): { $comentario: string; version: 1; paletas: Paleta[]; temas: Tema[]; mezclas: Mezcla[]; adornos: string[] } {
  return {
    $comentario:
      "Temas de motion-kit, versión 1. Generado por scripts/generar-contrato.mjs desde src/temas/datos: no editar a mano. " +
      "Paletas (colores), temas (para: pagina, panel o los dos; colores, forma, detalle, letra, ritmo, adornos y su versión " +
      "del panel), mezclas (tema + paleta para un tipo de negocio) y los nombres de los adornos (la firma de cada tema; su CSS " +
      "viene en motion-kit/temas). Las variables que arma cada tema son --mk-* (docs/un-solo-motor/tabla-de-nombres.md). " +
      "Solo se suman ids: ninguno se renombra ni se quita.",
    version: 1,
    paletas: PALETAS,
    temas: TEMAS,
    mezclas: MEZCLAS,
    adornos: Object.keys(CSS_ADORNOS),
  };
}

export const textoContratoTemas = () => JSON.stringify(contratoTemas(), null, 2) + "\n";
