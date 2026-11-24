import { CAMPOS, CURVAS, ESTADOS, NOMBRE_ACTOR, POR, PORCENTAJE, RESORTES, SENALES, SENALES_CONTINUAS, TOPES, TRAMOS, VERSION_PARTITURA } from "./modelo";

/**
 * El contrato de la Partitura (`contrato/partitura-motionkit.json`), sacado de las mismas listas y topes que usa el
 * validador. Lo escribe `npm run contrato`. **Versión 0, experimental:** puede cambiar; La Mente todavía no lo copia.
 */
export function contratoPartitura() {
  return {
    $comentario:
      "Partitura de motion-kit, v0, EXPERIMENTAL: puede cambiar sin aviso y La Mente todavía no la copia. Generado por scripts/generar-contrato.mjs desde src/director: no editar a mano. " +
      "Una partitura describe un movimiento como dato: escenas, cada una con una señal (con) y sus pasos. " +
      "actor: el nombre de una parte de la página (data-mk-parte); la partitura no trae selectores. " +
      "Un cambio (de, a) solo toca x, y (px o un porcentaje del propio tamaño, como «-14%»), escala, giro (grados) y opacidad. " +
      "Un paso por tiempo parte de una sola forma: en (ms desde la escena), luego (ms después de que termina el anterior) o junto (ms después de que empieza). " +
      "Un actor sigue a una sola señal continua (señalesContinuas), su opacidad es de una sola escena y su texto se corta de una sola forma (por y mascara). " +
      "El estado final de una entrada (a en una escena verse) tiene topes propios (topes.final): no puede esconder ni sacar de su lugar. " +
      "Una escena por tiempo dura a lo más topes.escena ms. Una partitura arma a lo más topes.animaciones animaciones y topes.seguidores elementos que siguen. " +
      "En estado y en puntero/velocidad los cambios tienen topes más chicos (topes.estado y topes.seguir).",
    version: VERSION_PARTITURA,
    experimental: true,
    campos: CAMPOS,
    obligatorios: ["version", "escenas"],
    listas: { con: [...SENALES], curva: [...CURVAS], por: [...POR], tramo: [...TRAMOS], estado: [...ESTADOS], resorte: [...RESORTES] },
    señalesContinuas: [...SENALES_CONTINUAS],
    topes: TOPES,
    actor: NOMBRE_ACTOR.source,
    porcentaje: PORCENTAJE.source,
  };
}

export const textoContratoPartitura = () => JSON.stringify(contratoPartitura(), null, 2) + "\n";
