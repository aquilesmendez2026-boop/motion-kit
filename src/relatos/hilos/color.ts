// Colores como los entrega el navegador, y su contraste: para saber sobre qué fondos se pierde el acento (los hilos, las
// ramas y la esfera toman ahí el color del texto). Puro, sin navegador. Va aparte para que la esfera lo use sin bajar el
// trazado de los hilos.

const acota = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** De sRGB lineal (0 a 1) a sRGB (0 a 255). */
const aSrgb = (lineal: number[]) => lineal.map((v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(0, v) ** (1 / 2.4) - 0.055));
/** De Oklab a sRGB lineal. */
function deOklab(l: number, a: number, b: number): number[] {
  const [x, y, z] = [l + 0.3963377774 * a + 0.2158037573 * b, l - 0.1055613458 * a - 0.0638541728 * b, l - 0.0894841775 * a - 1.291485548 * b].map((v) => v ** 3);
  return [4.0767416621 * x - 3.3077115913 * y + 0.2309699292 * z, -1.2684380046 * x + 2.6097574011 * y - 0.3413193965 * z, -0.0041960863 * x - 0.7034186147 * y + 1.707614701 * z];
}
/** De CIELAB (D50) a sRGB lineal. */
function deLab(l: number, a: number, b: number): number[] {
  const fy = (l + 16) / 116;
  const f = (t: number) => (t > 6 / 29 ? t ** 3 : 3 * (6 / 29) ** 2 * (t - 4 / 29));
  const [x, y, z] = [0.96422 * f(fy + a / 500), f(fy), 0.82521 * f(fy - b / 200)];
  return [3.1338561 * x - 1.6168667 * y - 0.4906146 * z, -0.9787684 * x + 1.9161415 * y + 0.033454 * z, 0.0719453 * x - 0.2289914 * y + 1.4052427 * z];
}
/**
 * Un color como lo entrega el navegador (`#hex`, `rgb()`, `color(srgb …)`, `color(display-p3 …)`, `oklab()`,
 * `oklch()`, `lab()`, `lch()`), en rojo, verde y azul; `null` si no se entiende o no tapa.
 */
function rgbDe(color: unknown): number[] | null {
  if (typeof color !== "string") return null;
  const t = color.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(t);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const f = /^(rgba?|color|oklab|oklch|lab|lch)\(([^)]+)\)$/.exec(t);
  if (!f) return null;
  let [cuerpo, alfa] = f[2].split("/");
  let espacio = f[1];
  if (espacio === "color") {
    const [nombre, ...resto] = cuerpo.trim().split(/\s+/);
    // display-p3 es un poco más amplio que sRGB: para saber si se distingue, alcanza con tomarlo como sRGB.
    if (nombre !== "srgb" && nombre !== "display-p3") return null;
    espacio = "srgb";
    cuerpo = resto.join(" ");
  }
  const n = cuerpo.split(/[\s,]+/).filter(Boolean).map((v) => parseFloat(v) * (v.endsWith("%") ? (espacio === "oklab" || espacio === "oklch" ? 0.01 : 1) : 1));
  const tapa = alfa !== undefined ? parseFloat(alfa) * (alfa.includes("%") ? 0.01 : 1) : (n[3] ?? 1);
  if (n.length < 3 || n.slice(0, 3).some((v) => !Number.isFinite(v)) || !(tapa >= 0.5)) return null;
  const [p, q, r] = n;
  const giro = (r * Math.PI) / 180;
  if (espacio === "srgb") return [p, q, r].map((v) => v * 255);
  if (espacio === "oklab") return aSrgb(deOklab(p, q, r));
  if (espacio === "oklch") return aSrgb(deOklab(p, q * Math.cos(giro), q * Math.sin(giro)));
  if (espacio === "lab") return aSrgb(deLab(p, q, r));
  if (espacio === "lch") return aSrgb(deLab(p, q * Math.cos(giro), q * Math.sin(giro)));
  return [p, q, r];
}
const luz = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = acota(v, 0, 255) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** La razón de contraste entre dos colores; 21 (se distinguen) si alguno no se entiende o es transparente. */
export function contraste(a: string, b: string): number {
  const [x, y] = [rgbDe(a), rgbDe(b)];
  if (!x || !y) return 21;
  const [l1, l2] = [luz(x), luz(y)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
}
