// La letra de un tema: qué familias de Google Fonts hay que cargar y cargarlas una vez (como EstiloLaMente).
import type { Letra } from "./tipos";

/** Las del sistema o las que ya trae cualquier página: no se piden a Google. */
const DEL_SISTEMA = /^(system-ui|sans-serif|serif|monospace|cursive|inherit|Arial|Arial Black|Arial Narrow|Arial Rounded MT Bold|Helvetica|Helvetica Neue|Georgia|Impact|Rockwell|Futura|Comic Sans MS|Times New Roman|Courier New|-apple-system|Segoe UI|Roboto)$/i;

/** La primera familia de una lista CSS («'Anton', Impact» → «Anton»). */
const primera = (lista?: string) => lista?.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "");

/**
 * Las familias para `https://fonts.googleapis.com/css2?family=…`: las que el tema dice (`google`) o, si no dice nada,
 * la primera de cada letra que no sea del sistema (`Archivo Black` → `Archivo+Black`).
 */
export function familiasDe(letra?: Letra): string[] {
  if (!letra) return [];
  if (letra.google?.length) return letra.google;
  const nombres = [letra.fuenteTitulo, letra.fuenteCartel, letra.fuenteTexto].map(primera).filter((n): n is string => Boolean(n) && !DEL_SISTEMA.test(n!));
  return [...new Set(nombres)].map((n) => n.replace(/ /g, "+"));
}

const cargadas = new Set<string>();

/** Carga las letras de un tema (una vez por familia y por página). */
export function cargarLetra(letra?: Letra): void {
  if (typeof document === "undefined") return;
  const faltan = familiasDe(letra).filter((f) => !cargadas.has(f));
  if (!faltan.length) return;
  for (const f of faltan) cargadas.add(f);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?${faltan.map((f) => `family=${f}`).join("&")}&display=swap`;
  document.head.appendChild(l);
}
