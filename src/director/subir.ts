// De la versión 0 de la Partitura a la 1. Lo único que cambió de forma: lo que sigue al puntero o a la velocidad
// llevaba sus números sueltos en el paso (`x`, `y`, `giro`, `escala`, `opacidad`) y ahora los lleva en `a`, como lo
// demás. No valida nada: lo que venga mal, sigue mal y lo dice el validador.

const esObjeto = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
/** Lo que un paso de seguir traía suelto en la versión 0. */
const SUELTOS = ["x", "y", "escala", "giro", "opacidad"];

function subirPaso(p: unknown): unknown {
  // Un paso que ya trae «a» no se toca (si además trae números sueltos, no se adivina cuál vale: lo dirá el validador).
  if (!esObjeto(p) || p.a !== undefined) return p;
  const campos = Object.entries(p);
  const sueltos = campos.filter(([k]) => SUELTOS.includes(k));
  // Sin nada suelto no se inventa un «a»: el validador dirá que falta.
  // `fromEntries` copia cada campo como propio: uno que se llame «__proto__» no se pierde ni cambia el prototipo.
  return sueltos.length ? { ...Object.fromEntries(campos.filter(([k]) => !SUELTOS.includes(k))), a: Object.fromEntries(sueltos) } : p;
}

/** Una partitura de la versión 0, con la forma de la 1. Lo que no es versión 0 se devuelve tal cual. */
export function subirPartitura(x: unknown): unknown {
  if (!esObjeto(x) || x.version !== 0) return x;
  const escenas = Array.isArray(x.escenas)
    ? x.escenas.map((e) => (esObjeto(e) && (e.con === "puntero" || e.con === "velocidad") && Array.isArray(e.pasos) ? { ...e, pasos: e.pasos.map(subirPaso) } : e))
    : x.escenas;
  return { ...x, version: 1, escenas };
}
