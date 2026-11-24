// Motor de la foto profunda: WebGL a mano sobre un lienzo que va encima de la foto real. Dibuja la foto corriendo cada
// punto según su profundidad (un mapa en grises: más claro es más cerca). Chico y aparte del motor de las fotos vivas.
// Se carga con import(). Si algo falla (sin WebGL, foto o mapa sin permiso, contexto perdido), quien lo usa quita el
// lienzo y queda la foto de siempre.
import { FUERZA, anchoMapa, encuadre, ladoTextura, mismaProporcion } from "./calculo-profunda";
import { pedirConPermiso } from "./imagen";

export interface Profunda {
  /** Pide la foto y su mapa (con permiso CORS si son de otro sitio) y los sube como texturas. `false` si algo no carga. */
  cargar(foto: string, mapa: string): Promise<boolean>;
  /** Dibuja la foto corrida hacia (x, y), de -1 a 1 en cada eje. */
  dibujar(x: number, y: number): void;
  /** Ajusta el lienzo a su caja (hasta 2 de densidad). */
  ajustar(): void;
  alPerder(f: () => void): void;
  destruir(): void;
}

const VERT = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
// `e`: qué parte de la foto se ve (el encuadre). `o`: cuánto se corre lo que está más cerca. La profundidad se mira dos
// veces (la segunda, ya en el punto corrido): así los bordes de las cosas quedan más firmes. Precisión alta donde la
// hay: con la media, en un teléfono las coordenadas se quedan cortas para una foto grande y la imagen tirita.
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D a;uniform sampler2D d;uniform vec2 e;uniform vec2 o;varying vec2 v;
void main(){vec2 u=(v-.5)*e+.5;u.y=1.-u.y;float z=texture2D(d,u).r;z=texture2D(d,u+o*(z-.5)).r;gl_FragColor=vec4(texture2D(a,u+o*(z-.5)).rgb,1.);}`;

/** El lado mayor del lienzo y de la foto que se sube a la tarjeta gráfica. */
const LADO_MAXIMO = 1600;

/** Crea el motor sobre un lienzo. `null` si el navegador no da WebGL. */
export function crearProfunda(lienzo: HTMLCanvasElement): Profunda | null {
  const opciones: WebGLContextAttributes = { alpha: false, antialias: false, preserveDrawingBuffer: false, powerPreference: "low-power" };
  const gl = (lienzo.getContext("webgl", opciones) ?? lienzo.getContext("experimental-webgl", opciones)) as WebGLRenderingContext | null;
  if (!gl) return null;
  const compilar = (tipo: number, fuente: string) => {
    const s = gl.createShader(tipo)!;
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    return s;
  };
  const programa = gl.createProgram()!;
  gl.attachShader(programa, compilar(gl.VERTEX_SHADER, VERT));
  gl.attachShader(programa, compilar(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(programa);
  const soltar = () => gl.getExtension("WEBGL_lose_context")?.loseContext();
  if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
    // El contexto ya está tomado: se suelta (los navegadores tienen un tope de contextos por página).
    soltar();
    return null;
  }
  gl.useProgram(programa);
  const cuadro = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cuadro);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(programa, "p");
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  const U = { e: gl.getUniformLocation(programa, "e"), o: gl.getUniformLocation(programa, "o") };
  gl.uniform1i(gl.getUniformLocation(programa, "a"), 0);
  gl.uniform1i(gl.getUniformLocation(programa, "d"), 1);
  const texturas = [gl.createTexture(), gl.createTexture()];

  let fotoAncho = 0;
  let fotoAlto = 0;
  /** El mapa tal como llegó (es chico): se guarda para volver a suavizarlo si el lienzo cambia mucho de ancho. */
  let mapaOriginal: HTMLImageElement | null = null;
  let mapaAncho = 0;
  let mapaBien = false;
  let vivo = true;
  let alPerder: () => void = () => {};
  const perdido = () => {
    if (vivo) alPerder();
  };
  lienzo.addEventListener("webglcontextlost", perdido);

  /**
   * Sube una imagen a una unidad de textura, llevada antes a `ancho` × `alto` en un lienzo 2D. Así una foto enorme no
   * ocupa decenas de MB en la tarjeta gráfica ni pasa su tope de tamaño, y la orientación de la foto queda igual en
   * todos los navegadores. `false` si el navegador no deja (foto sin permiso, o sin lienzo 2D).
   */
  const subir = (unidad: number, img: HTMLImageElement, ancho: number, alto: number): boolean => {
    const lona = document.createElement("canvas");
    lona.width = ancho;
    lona.height = alto;
    const ctx = lona.getContext("2d");
    if (!ctx) return false;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, ancho, alto);
    gl.activeTexture(gl.TEXTURE0 + unidad);
    gl.bindTexture(gl.TEXTURE_2D, texturas[unidad]);
    // Sin potencias de dos ni mipmaps: basta con no repetir y suavizar.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    let bien = true;
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lona);
    } catch {
      bien = false;
    }
    // La lona ya no hace falta: se suelta su memoria (en iOS los lienzos tienen un tope).
    lona.width = lona.height = 0;
    return bien;
  };

  /**
   * El mapa, suavizado: se achica a pocos puntos y la tarjeta gráfica lo vuelve a estirar. Sin esto, donde el mapa salta
   * de cerca a lejos (el borde de una taza) la foto se ve dentada. Cuántos puntos depende del ancho del lienzo.
   */
  const subirMapa = () => {
    const ancho = anchoMapa(lienzo.width);
    if (!mapaOriginal || ancho === mapaAncho) return;
    mapaAncho = ancho;
    mapaBien = subir(1, mapaOriginal, ancho, Math.max(1, Math.round((ancho * mapaOriginal.naturalHeight) / mapaOriginal.naturalWidth)));
  };

  const ajustar = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const k = Math.min(1, LADO_MAXIMO / Math.max(1, lienzo.clientWidth * dpr, lienzo.clientHeight * dpr));
    const w = Math.round(lienzo.clientWidth * dpr * k);
    const h = Math.round(lienzo.clientHeight * dpr * k);
    if (lienzo.width !== w || lienzo.height !== h) {
      lienzo.width = w;
      lienzo.height = h;
    }
    if (vivo) subirMapa();
  };

  return {
    async cargar(foto, mapa) {
      const [a, d] = await Promise.all([pedirConPermiso(foto), pedirConPermiso(mapa)]);
      // Un mapa con otra proporción no es el de esa foto (cambiaron la foto y el mapa quedó viejo): mejor la foto normal.
      if (!vivo || !a || !d || !mismaProporcion(a.naturalWidth, a.naturalHeight, d.naturalWidth, d.naturalHeight)) return false;
      const t = ladoTextura(a.naturalWidth, a.naturalHeight, Math.min(LADO_MAXIMO, Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || LADO_MAXIMO));
      if (!subir(0, a, t.ancho, t.alto)) return false;
      fotoAncho = t.ancho;
      fotoAlto = t.alto;
      mapaOriginal = d;
      mapaAncho = 0;
      // Primero el tamaño del lienzo: de él depende a cuántos puntos se lleva el mapa.
      ajustar();
      return mapaBien;
    },
    dibujar(x, y) {
      if (!vivo || !fotoAncho || !lienzo.width || !lienzo.height) return;
      const e = encuadre(fotoAncho, fotoAlto, lienzo.width, lienzo.height);
      gl.viewport(0, 0, lienzo.width, lienzo.height);
      gl.uniform2f(U.e, e.x, e.y);
      // El corrimiento va en la medida de lo que se ve, para que sea el mismo con cualquier encuadre.
      gl.uniform2f(U.o, x * FUERZA * e.x, y * FUERZA * e.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    ajustar,
    alPerder(f) {
      alPerder = f;
    },
    destruir() {
      vivo = false;
      mapaOriginal = null;
      lienzo.removeEventListener("webglcontextlost", perdido);
      // Se suelta el contexto ahora: los navegadores tienen un tope de contextos WebGL por página.
      soltar();
    },
  };
}
