// Bajar una foto para usarla en WebGL. Lo comparten el motor de las fotos vivas y el de la foto profunda.

/** Baja una foto. Con `cors`, pidiendo permiso para usarla en WebGL. `null` si no carga. */
export function pedirImagen(src: string, cors: boolean): Promise<HTMLImageElement | null> {
  return new Promise((listo) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => listo(img);
    img.onerror = () => listo(null);
    img.src = src;
  });
}

export function esDeOtroSitio(url: string): boolean {
  try {
    const u = new URL(url, location.href);
    return /^https?:$/.test(u.protocol) && u.origin !== location.origin;
  } catch {
    return false;
  }
}

/**
 * Baja una foto con permiso para WebGL. Si es de otro sitio y falla, la pide de nuevo saltándose la caché: el <img> de
 * siempre pide la foto sin CORS y, si el servidor solo da el permiso cuando se lo piden, la caché del navegador puede
 * devolver esa respuesta sin permiso. `null` si no hay caso (sin permiso de verdad, o sin red).
 */
export async function pedirConPermiso(url: string, cors = esDeOtroSitio(url)): Promise<HTMLImageElement | null> {
  let img = await pedirImagen(url, cors);
  if (!img && esDeOtroSitio(url)) {
    try {
      const r = await fetch(url, { mode: "cors", cache: "reload", credentials: "omit" });
      if (r.ok) {
        const direccion = URL.createObjectURL(await r.blob());
        img = await pedirImagen(direccion, false);
        URL.revokeObjectURL(direccion);
      }
    } catch {
      /* sin permiso de verdad (o sin red): queda la foto normal */
    }
  }
  return img;
}
