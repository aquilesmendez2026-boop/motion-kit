// El contrato de las partituras de la casa (encargo del backend del 27-11): cada partitura de CASA con su id, su nombre,
// una línea de qué hace y la partitura misma, en JSON puro. Así el backend y el front la copian sin leer el TypeScript.
import { CASA, type DeLaCasa } from "./casa";

/** Qué hace cada una, en una línea (para el Estudio y los agentes). */
const QUE_HACE: Record<string, string> = {
  revelar: "El título entra palabra por palabra, subiendo desde abajo como detrás de una línea.",
  trailer: "El título aparece palabra por palabra, achicándose desde grande, como un tráiler de cine.",
  maquina: "El título se escribe letra por letra, como una máquina de escribir.",
  voltear: "Cada letra del título gira desde atrás hasta quedar de frente.",
  impacto: "Cada palabra del título cae desde muy grande y rebota al llegar.",
  rebote: "Cada letra del título crece desde nada con un rebote.",
  caer: "Las letras del título caen desde arriba, girando, y rebotan al llegar.",
  cascada: "El encabezado entra en cascada: antetítulo, título palabra por palabra, foto, bajada y botones.",
  deslizar: "Todo el encabezado entra deslizándose de lado; la foto, desde el otro lado.",
  zoom: "La foto se acerca lento y el contenido sube encima.",
  sellos: "Los elementos de la grilla se estampan uno tras otro, como sellos.",
  correo: "Los elementos de la grilla caen uno tras otro, como novedades que llegan.",
  domino: "Los elementos de la grilla se paran uno tras otro, como fichas de dominó.",
  hojas: "El rótulo entra letra por letra y la grilla se voltea como hojas.",
  "titulo-con-volumen": "El título se inclina siguiendo el dedo o el mouse, con volumen.",
  "tarjeta-holografica": "La tarjeta se inclina con el dedo o el mouse y su brillo se mueve encima.",
};

export interface PartituraDeLaCasaContrato {
  id: string;
  nombre: string;
  que: string;
  grupo: DeLaCasa["grupo"];
  partes: string[];
  nota?: string;
  partitura: DeLaCasa["partitura"];
}

export function contratoCasa(): { $comentario: string; version: 1; partituras: PartituraDeLaCasaContrato[] } {
  return {
    $comentario:
      "Partituras de la casa de motion-kit, versión 1. Generado por scripts/generar-contrato.mjs desde src/director/casa.ts: " +
      "no editar a mano. Cada una: id, nombre, qué hace (una línea), grupo (texto, encabezado, momento o especial), las partes " +
      "que mueve (data-mk-parte) y la partitura (versión 1 del contrato de partitura).",
    version: 1,
    partituras: CASA.map((p) => {
      const que = QUE_HACE[p.id];
      if (!que) throw new Error(`La partitura de la casa «${p.id}» no dice qué hace (QUE_HACE en src/director/contrato-casa.ts).`);
      return { id: p.id, nombre: p.nombre, que, grupo: p.grupo, partes: p.partes, ...(p.nota ? { nota: p.nota } : {}), partitura: p.partitura };
    }),
  };
}

export const textoContratoCasa = () => JSON.stringify(contratoCasa(), null, 2) + "\n";
