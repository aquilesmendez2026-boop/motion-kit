/**
 * Achica una foto en el navegador y la pasa a WebP hasta que quede bajo un peso. Sin librerías: canvas.
 * Si el navegador no sabe hacer WebP (Safari viejo), usa JPEG.
 */

export interface OpcionesComprimir {
  /** Peso máximo en bytes. Por defecto 200 KB (el máximo del póster en celular). */
  maximo?: number;
  /** Lado más largo en píxeles. Por defecto 1600. */
  lado?: number;
  /** Lado más corto permitido al seguir achicando. */
  ladoMinimo?: number;
}

export interface FotoComprimida {
  archivo: Blob;
  url: string;
  ancho: number;
  alto: number;
  tipo: string;
  calidad: number;
  bytesAntes: number;
  bytes: number;
  /** `false` si ni achicando al mínimo quedó bajo el máximo (se entrega la más liviana). */
  dentro: boolean;
}

const cargar = (archivo: Blob): Promise<ImageBitmap | HTMLImageElement> => {
  if (typeof createImageBitmap === "function") return createImageBitmap(archivo, { imageOrientation: "from-image" } as ImageBitmapOptions);
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => mal(new Error("No se pudo leer la foto"));
    img.src = URL.createObjectURL(archivo);
  });
};

const aBlob = (lienzo: HTMLCanvasElement, tipo: string, calidad: number) =>
  new Promise<Blob | null>((ok) => lienzo.toBlob(ok, tipo, calidad));

/** Al volver a dibujarla, la foto pierde los datos de la cámara (EXIF, ubicación incluida). */
export async function comprimirFoto(archivo: Blob, { maximo = 200_000, lado = 1600, ladoMinimo = 480 }: OpcionesComprimir = {}): Promise<FotoComprimida> {
  const imagen = await cargar(archivo);
  const w0 = "naturalWidth" in imagen ? imagen.naturalWidth : imagen.width;
  const h0 = "naturalHeight" in imagen ? imagen.naturalHeight : imagen.height;
  const lienzo = document.createElement("canvas");
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("El navegador no permite dibujar en canvas");

  let escala = Math.min(1, lado / Math.max(w0, h0));
  let mejor: { blob: Blob; ancho: number; alto: number; calidad: number } | null = null;
  let tipo = "image/webp";

  for (let vuelta = 0; vuelta < 6; vuelta++) {
    lienzo.width = Math.max(1, Math.round(w0 * escala));
    lienzo.height = Math.max(1, Math.round(h0 * escala));
    ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    for (const calidad of [0.8, 0.65, 0.5]) {
      let blob = await aBlob(lienzo, tipo, calidad);
      if (blob && blob.type !== tipo) {
        tipo = "image/jpeg";
        blob = await aBlob(lienzo, tipo, calidad);
      }
      if (!blob) continue;
      if (!mejor || blob.size < mejor.blob.size) mejor = { blob, ancho: lienzo.width, alto: lienzo.height, calidad };
      if (blob.size <= maximo) {
        // Un PNG o WebP que ya cabía y pesaba menos se deja como venía (no trae datos de la cámara como un JPEG).
        if (blob.size > archivo.size && archivo.size <= maximo && archivo.type !== "image/jpeg") {
          return fin({ blob: archivo, ancho: w0, alto: h0, calidad: 1 }, true);
        }
        return fin({ blob, ancho: lienzo.width, alto: lienzo.height, calidad }, true);
      }
    }
    if (Math.min(lienzo.width, lienzo.height) <= ladoMinimo) break;
    escala *= 0.75;
  }
  if (!mejor) throw new Error("No se pudo comprimir la foto");
  return fin(mejor, false);

  function fin(r: { blob: Blob; ancho: number; alto: number; calidad: number }, dentro: boolean): FotoComprimida {
    if ("close" in imagen) imagen.close();
    return { archivo: r.blob, url: URL.createObjectURL(r.blob), ancho: r.ancho, alto: r.alto, tipo: r.blob.type, calidad: r.calidad, bytesAntes: archivo.size, bytes: r.blob.size, dentro };
  }
}
