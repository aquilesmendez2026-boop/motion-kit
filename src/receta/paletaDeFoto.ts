// Colores desde la foto: al subir una foto, el editor propone la paleta y el tema de La Mente que más se le parecen.
// Todo en el navegador, sin servidor. La lógica (paletaDesdePixeles) no necesita DOM y se prueba en Node.
import { PALETAS_LAMENTE, PALETA_LAMENTE_IDS, TEMAS_LAMENTE, TEMA_LAMENTE_IDS, type PaletaLaMente, type TemaLaMente } from "./lamente";

type RGB = [number, number, number];
const aRgb = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
const aHex = (c: RGB) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const distancia = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** Croma aproximado: qué tan lejos está del gris. Los casi blancos, casi negros y grises no sirven de acento. */
const croma = ([r, g, b]: RGB) => Math.max(r, g, b) - Math.min(r, g, b);

export interface PaletaPropuesta {
  paleta: PaletaLaMente;
  /** El primer tema que usa esa paleta por defecto; si ninguno, el clásico. */
  tema: TemaLaMente;
  /** Los colores dominantes de la foto, del más al menos frecuente. */
  colores: string[];
}

/**
 * Propone paleta y tema desde los píxeles RGBA de una foto. Agrupa los colores en 64 cajas (4 niveles por canal), toma el
 * más frecuente como fondo y el más frecuente con color (no gris) como acento, y elige la paleta con menor distancia en
 * fondo y acento. Si la foto no tiene un color que sirva de acento, compara solo el fondo.
 */
export function paletaDesdePixeles(px: Uint8ClampedArray): PaletaPropuesta {
  const cajas = new Map<number, { n: number; suma: RGB }>();
  for (let i = 0; i + 3 < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    const k = ((px[i] >> 6) << 4) | ((px[i + 1] >> 6) << 2) | (px[i + 2] >> 6);
    const c = cajas.get(k) ?? { n: 0, suma: [0, 0, 0] as RGB };
    c.n++;
    c.suma[0] += px[i];
    c.suma[1] += px[i + 1];
    c.suma[2] += px[i + 2];
    cajas.set(k, c);
  }
  const dominantes = [...cajas.values()].sort((a, b) => b.n - a.n).map((c) => c.suma.map((v) => v / c.n) as RGB);
  if (!dominantes.length) return { paleta: "clasica", tema: "clasico", colores: [] };
  const fondo = dominantes[0];
  const acento = dominantes.find((c) => croma(c) > 40 && distancia(c, fondo) > 60);

  let mejor: PaletaLaMente = "clasica";
  let menor = Infinity;
  for (const id of PALETA_LAMENTE_IDS) {
    const { colores } = PALETAS_LAMENTE[id];
    const d = distancia(fondo, aRgb(colores.fondo)) + (acento ? distancia(acento, aRgb(colores.acento)) : 0);
    if (d < menor) {
      menor = d;
      mejor = id;
    }
  }
  const tema = TEMA_LAMENTE_IDS.find((t) => TEMAS_LAMENTE[t].paleta === mejor) ?? "clasico";
  return { paleta: mejor, tema, colores: dominantes.slice(0, 4).map(aHex) };
}

/** Lo mismo desde un archivo de foto: la achica a 64×64 en un canvas y lee sus píxeles. Solo en el navegador. */
export async function paletaDeFoto(archivo: Blob): Promise<PaletaPropuesta> {
  const bitmap = await createImageBitmap(archivo);
  const lado = 64;
  const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(lado, lado) : Object.assign(document.createElement("canvas"), { width: lado, height: lado });
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Este navegador no deja leer los colores de la foto.");
  ctx.drawImage(bitmap, 0, 0, lado, lado);
  bitmap.close?.();
  return paletaDesdePixeles(ctx.getImageData(0, 0, lado, lado).data);
}
