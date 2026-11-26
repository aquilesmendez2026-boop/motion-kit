// SubirImagen: revisa el archivo antes de subirlo (así el dueño sabe al tiro por qué no sirve) y dice su peso en palabras.

/** Un número con coma decimal y a lo más un decimal: 3.4 → «3,4», 2 → «2». */
const numero = (x: number) => (Math.round(x * 10) / 10).toString().replace(".", ",");

/** El peso como lo muestra el computador: 3_400_000 → «3,4 MB»; 850_000 → «850 KB». */
export function pesoLegible(bytes: number): string {
  const b = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  return b >= 1_000_000 ? `${numero(b / 1_000_000)} MB` : `${Math.round(b / 1000)} KB`;
}

/** El nombre de cada tipo de foto en el mensaje (los demás, en mayúsculas: png → PNG, gif → GIF). */
const NOMBRES: Record<string, string> = { jpeg: "JPG", webp: "WebP" };

/** «PNG, JPG o WebP» a partir de «image/png,image/jpeg,image/webp». */
function listaDeTipos(tipos: string[]): string {
  const nombres = [...new Set(tipos.map((t) => NOMBRES[t.split("/")[1]] ?? t.split("/")[1]?.toUpperCase() ?? t))];
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} o ${nombres[nombres.length - 1]}` : (nombres[0] ?? "");
}

/** Si el tipo calza con lo aceptado («image/png», «image/*»). */
function calza(tipo: string, aceptado: string): boolean {
  if (!tipo) return false;
  if (aceptado.endsWith("/*")) return tipo.startsWith(aceptado.slice(0, -1));
  return tipo === aceptado;
}

/**
 * Revisa un archivo contra lo aceptado (como el `accept` de un `<input>`, separado por comas) y el máximo en MB
 * (1 MB = 1024 × 1024 bytes, para no rechazar una foto que el teléfono dice que pesa justo el máximo).
 */
export function revisarArchivo(
  a: { type: string; size: number },
  aceptar: string,
  maxMB: number,
): { ok: true } | { ok: false; mensaje: string } {
  const aceptados = aceptar.split(",").map((t) => t.trim()).filter(Boolean);
  if (aceptados.length && !aceptados.some((t) => calza(a.type, t))) {
    const conComodin = aceptados.some((t) => t.endsWith("/*"));
    return { ok: false, mensaje: conComodin ? "Ese archivo no es una foto." : `Ese archivo no es una foto ${listaDeTipos(aceptados)}.` };
  }
  if (Number.isFinite(maxMB) && maxMB > 0 && a.size > maxMB * 1024 * 1024) {
    return { ok: false, mensaje: `Esa foto pesa ${pesoLegible(a.size)}: el máximo es ${numero(maxMB)} MB.` };
  }
  return { ok: true };
}
