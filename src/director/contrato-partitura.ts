import { CAMPOS, CURVAS, ESTADOS, NOMBRE_ACTOR, NUMEROS_CURVA, POR, PORCENTAJE, PROFUNDIDAD, RESORTES, SENALES, SENALES_CONTINUAS, TOPES, TRAMOS, VERSION_PARTITURA } from "./modelo";
import { avanceEn } from "./fotogramas";
import { rangoDePieza } from "./montar";
import { RESORTES_SEGUIR, VELOCIDAD_MAXIMA, VELOCIDAD_VUELVE_MS, seguir, valorSeguido } from "./senales";

/** Casos de lo que sigue: el cambio del paso, la señal y lo que se escribe. Los calcula el mismo código que corre. */
const CASOS_SEGUIR = [
  { a: { x: 16, y: 10 }, senal: { x: 1, y: -0.5 } },
  { a: { inclinaX: 8, inclinaY: 10 }, senal: { x: 1, y: 0 } },
  { a: { inclinaX: 8, inclinaY: 10 }, senal: { x: 0, y: -1 } },
  { a: { inclinaX: 8, inclinaY: 10 }, senal: { x: 0.5, y: 0.5 } },
  { a: { giro: 6, escala: 1.1, opacidad: 0.6 }, senal: { x: -0.5, y: 0.25 } },
].map((c) => ({ ...c, escribe: valorSeguido({ actor: "x", a: c.a }, c.senal.x, c.senal.y) }));
const RESORTE_CASO = { desde: { x: 0, v: 0 }, meta: 1, dt: 0.016, resorte: "firme" as const };

/** Casos de los tramos: una pantalla de 800 px de alto y una raíz de 400 (o de 1200, más alta que la pantalla). */
const CASOS_TRAMO = [
  ...(["entrada", "salida", "paso"] as const).flatMap((tramo) =>
    [
      { alto: 800, arriba: 700, altoRaiz: 400 },
      { alto: 800, arriba: 200, altoRaiz: 400 },
      { alto: 800, arriba: -300, altoRaiz: 400 },
      { alto: 800, arriba: -500, altoRaiz: 1200 },
    ].map((c) => ({ tramo, ...c, avance: avanceEn({ top: c.arriba, height: c.altoRaiz }, c.alto, tramo) })),
  ),
  ...[
    { entre: [0, 1] as [number, number], pieza: 0, piezas: 5, reparto: 0.5 },
    { entre: [0, 1] as [number, number], pieza: 4, piezas: 5, reparto: 0.5 },
    { entre: [0.2, 0.7] as [number, number], pieza: 2, piezas: 5, reparto: 0.3 },
    { entre: [0.2, 0.7] as [number, number], pieza: 0, piezas: 1, reparto: 0.3 },
  ].map((c) => ({ ...c, rango: rangoDePieza(c.entre, c.pieza, c.piezas, c.reparto) })),
];

/**
 * El contrato de la Partitura (`contrato/partitura-motionkit.json`), sacado de las mismas listas y topes que usa el
 * validador. Lo escribe `npm run contrato`. Versión 1: desde aquí los cambios suman campos, no rompen.
 */
export function contratoPartitura() {
  return {
    $comentario:
      "Partitura de motion-kit, versión 1. Generado por scripts/generar-contrato.mjs desde src/director: no editar a mano. " +
      "Una partitura describe un movimiento como dato: escenas, cada una con una señal (con) y sus pasos. " +
      "actor: el nombre de una parte de la página (data-mk-parte); la partitura no trae selectores. " +
      "Un cambio (de, a) solo toca x, y (px o un porcentaje del propio tamaño, como «-14%»), escala, giro (grados), inclinaX e inclinaY (grados, en 3D) y opacidad. " +
      "Un paso por tiempo parte de una sola forma: en (ms desde la escena), luego (ms después de que termina el anterior) o junto (ms después de que empieza). " +
      "Un actor sigue a una sola señal continua (señalesContinuas), su opacidad es de una sola escena y su texto se corta de una sola forma (por y mascara). " +
      "En una escena continua un paso gira (giro) o se inclina (inclinaX, inclinaY), no las dos cosas. " +
      "El estado final de una entrada (a en una escena verse) tiene topes propios (topes.final): no puede esconder ni sacar de su lugar. " +
      "Una escena por tiempo dura a lo más topes.escena ms. Una partitura arma a lo más topes.animaciones animaciones y topes.seguidores elementos que siguen. " +
      "En estado y en puntero/velocidad los cambios tienen topes más chicos (topes.estado y topes.seguir); en puntero/velocidad, x e y van en px. " +
      "El Director corre solo la versión 1. Una partitura de la versión 0 (lo que sigue llevaba x, y, giro, escala y opacidad sueltos en el paso) se sube antes con subirPartitura, de motion-kit/partitura: esos campos pasan a «a». " +
      "La inclinación de las escenas continuas y de estado se ve con la profundidad (perspective) puesta en el padre del actor mientras la partitura está montada: ese padre ordena y ubica a sus hijos como uno con transform (un hijo con position: fixed se ubica respecto de él).",
    version: VERSION_PARTITURA,
    campos: CAMPOS,
    obligatorios: ["version", "escenas"],
    listas: { con: [...SENALES], curva: [...CURVAS], por: [...POR], tramo: [...TRAMOS], estado: [...ESTADOS], resorte: [...RESORTES] },
    señalesContinuas: [...SENALES_CONTINUAS],
    topes: TOPES,
    actor: NOMBRE_ACTOR.source,
    porcentaje: PORCENTAJE.source,
    /** Para reproducir el movimiento fuera del navegador (la app). */
    curvas: NUMEROS_CURVA,
    resortes: Object.fromEntries(RESORTES.map((r) => [r, { rigidez: RESORTES_SEGUIR[r][0], freno: RESORTES_SEGUIR[r][1] }])),
    profundidad: PROFUNDIDAD,
    /** Cómo se aplica la inclinación (inclinaX: se vuelca, sobre el eje horizontal; inclinaY: se ladea, sobre el vertical). */
    inclinacion: {
      verse: "En una escena por tiempo va primero, antes de mover, girar y agrandar: perspectiva (profundidad), giro de inclinaX grados sobre el eje X y después giro de inclinaY grados sobre el eje Y. Cada pieza tiene su propio punto de fuga, en su centro.",
      continua: "En las escenas continuas y de estado es un solo giro en 3D: sobre el eje (ix, iy, 0), en un ángulo igual al largo de ese vector, √(ix² + iy²) grados. Entre los dos extremos de un paso se interpola el ángulo, con el eje del extremo que no es cero. La perspectiva (profundidad) va en el padre del actor: el punto de fuga es el centro de ese padre.",
    },
    /** Lo que vale cuando la partitura no lo dice. */
    porDefecto: {
      $comentario: "dura: ms de un paso por tiempo. duraEstado: ms de un paso de estado. curva: la de un paso por tiempo o de estado. curvaScroll: la de un paso atado al scroll. tramo: el de una escena vista. La curva «resorte» usa la del estilo de la página si la trae (--mk-resorte-curva y --mk-resorte-ms); si no, la de curvas.resorte. liviano: en un teléfono lento un paso dura a lo más liviano.dura y las piezas se esperan a lo más liviano.cada; las entradas solo funden y nada sigue al puntero ni a la velocidad.",
      dura: 600,
      duraEstado: 180,
      curva: "suave",
      curvaScroll: "lineal",
      tramo: "paso",
      resorte: "suave",
      reparto: 0.5,
      liviano: { dura: 400, cada: 40 },
    },
    /** Lo que sigue al puntero o a la velocidad. */
    seguir: {
      puntero: "La señal es dónde está el cursor (o el dedo) dentro de la raíz de la partitura: sx y sy van de -1 a 1, con (0, 0) al centro y ±1 en los bordes. Fuera de la raíz vuelve a (0, 0).",
      velocidad: "La señal es la velocidad del scroll dividida por velocidadMaxima (px por segundo), acotada entre -1 y 1; sx y sy valen lo mismo. Sin scroll durante velocidadVuelveMs, vuelve a 0.",
      velocidadMaxima: VELOCIDAD_MAXIMA,
      velocidadVuelveMs: VELOCIDAD_VUELVE_MS,
      valor: "Los números de «a» son cuánto cambia con la señal al máximo. Corrimiento: (sx × x, sy × y) px. Giro: sx × giro grados. Escala y opacidad miran qué tan lejos del centro está la señal, no hacia dónde: 1 + lejos × (valor - 1), con lejos = max(|sx|, |sy|).",
      inclinacion: "Se inclina hacia donde está la señal: ix = -sy × inclinaX e iy = sx × inclinaY (grados), aplicados como dice inclinacion.continua. Con el cursor arriba, el borde de arriba se aleja; a la derecha, se aleja el derecho.",
      resorte: "Cada eje de la señal se sigue con un resorte de masa 1 (resortes: rigidez y freno), paso a paso (Euler semiimplícito, dt en segundos): v += (-rigidez × (x - meta) - freno × v) × dt; x += v × dt.",
      reposo: "Cuando la distancia a la meta es menor que 0.002 y la velocidad menor que 0.02, queda justo en la meta y deja de calcularse. Mientras se apunta a algo que se aprieta dentro del actor, el actor se queda donde está.",
      casos: CASOS_SEGUIR,
      casoResorte: { ...RESORTE_CASO, queda: seguir(RESORTE_CASO.desde, RESORTE_CASO.meta, RESORTE_CASO.dt, RESORTE_CASO.resorte) },
    },
    tramos: {
      $comentario: "Cómo avanza (de 0 a 1) una escena atada al scroll. alto: el alto de la pantalla. arriba y altoRaiz: dónde está y cuánto mide la raíz de la partitura. Todo se acota entre 0 y 1.",
      entrada: "Desde que el borde de arriba de la raíz asoma por abajo de la pantalla hasta que entró entera (o la cubre): (alto - arriba) / m, con m = min(altoRaiz, alto).",
      salida: "Desde que la raíz empieza a salir por arriba hasta que salió entera: (m - (arriba + altoRaiz)) / m, con m = min(altoRaiz, alto).",
      paso: "Todo el cruce, desde que asoma por abajo hasta que termina de salir por arriba: (alto - arriba) / (alto + altoRaiz).",
      scroll: "La página entera: lo bajado dividido por lo que se puede bajar.",
      entre: "Un paso ocurre en un trozo del avance: entre [a, b] quiere decir que parte en a y termina en b.",
      reparto: "Con «por», cada pieza ocupa una parte del trozo (reparto, por defecto 0.5) y parten en cascada: la pieza k de n parte en a + (b - a) × (1 - reparto) × k / (n - 1) y dura (b - a) × reparto.",
      /** Calculados por el mismo código que corre: con `tramo`, el avance de la escena; sin él, el trozo que ocupa una pieza. */
      casos: CASOS_TRAMO,
    },
  };
}

export const textoContratoPartitura = () => JSON.stringify(contratoPartitura(), null, 2) + "\n";
