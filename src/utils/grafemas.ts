// Partir un texto en letras como las ve una persona. Una bandera, un emoji con tono de piel o una familia son varios
// códigos seguidos: partirlos por código los rompe para siempre (cada pedazo queda en su propio span).

type Segmentador = { segment(texto: string): Iterable<{ segment: string }> };
let segmentador: Segmentador | null | undefined;

/** Las letras de un texto, con los emoji compuestos y las tildes sueltas enteros. Sin `Intl.Segmenter`, por código. */
export function grafemas(texto: string): string[] {
  if (segmentador === undefined) {
    const Clase = typeof Intl !== "undefined" ? (Intl as unknown as { Segmenter?: new (idioma: string, opciones: { granularity: "grapheme" }) => Segmentador }).Segmenter : undefined;
    segmentador = Clase ? new Clase("es", { granularity: "grapheme" }) : null;
  }
  return segmentador ? Array.from(segmentador.segment(texto), (s) => s.segment) : Array.from(texto);
}
