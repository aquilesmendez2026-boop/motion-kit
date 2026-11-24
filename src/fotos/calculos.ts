// Fotos vivas: lo calculable, sin React ni WebGL. Se prueba con node --test.

/**
 * Si el motor puede pedir la foto como textura (con CORS) sin bajarla dos veces para nada: misma página, `data:image`,
 * `blob:` o un origen de la lista. Cualquier otra se ve como foto normal.
 */
export function origenPermitido(url: string, origenes: string[], origenPagina: string): boolean {
  const u = (url ?? "").trim();
  if (!u || u.startsWith("//")) return false;
  if (/^data:/i.test(u)) return /^data:image\//i.test(u);
  if (/^blob:/i.test(u)) return true;
  const esquema = /^([a-z][a-z0-9+.-]*):/i.exec(u);
  if (esquema && !/^https?$/i.test(esquema[1])) return false;
  try {
    const origen = new URL(u, origenPagina).origin;
    return origen === new URL(origenPagina).origin || origenes.some((o) => {
      try {
        return new URL(o).origin === origen;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/** Cuántos puntos por lado para dibujar la foto con partículas: guarda la proporción y no pasa del máximo. */
export function rejillaParticulas(ancho: number, alto: number, maximo: number): { columnas: number; filas: number } {
  if (!(ancho > 0) || !(alto > 0) || !(maximo >= 1)) return { columnas: 1, filas: 1 };
  const proporcion = ancho / alto;
  let filas = Math.max(1, Math.floor(Math.sqrt(maximo / proporcion)));
  let columnas = Math.max(1, Math.floor(filas * proporcion));
  while (columnas * filas > maximo) columnas > filas ? columnas-- : filas--;
  return { columnas, filas };
}

/** Puntos de las partículas según el dispositivo. */
export const PARTICULAS_MAX = { escritorio: 10000, telefono: 4000 } as const;
