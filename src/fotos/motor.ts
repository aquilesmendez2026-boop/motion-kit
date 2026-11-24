// Motor de fotos vivas: WebGL a mano sobre un lienzo que va encima de la foto real. Tres efectos: ondas bajo el dedo,
// la foto que se arma desde partículas y el cambio líquido entre dos fotos. Se carga aparte (import()). Si algo falla
// (sin WebGL, foto sin permiso, contexto perdido), quien lo usa quita el lienzo y queda la foto de siempre.
import { rejillaParticulas } from "./calculos";
import { pedirConPermiso } from "./imagen";

export interface Textura {
  img: HTMLImageElement;
  tex: WebGLTexture;
}

export type EfectoFoto = "particulas" | "ondas" | "liquido" | "quieta";

export interface Motor {
  /** Pide la foto con permiso CORS y la sube como textura. `null` si no carga o el servidor no da permiso. */
  cargar(url: string): Promise<Textura | null>;
  /** Libera una foto que ya no se va a dibujar. */
  soltar(t: Textura): void;
  /** Dibuja la foto lisa. Con `acercar`, un acercamiento lento de 6 s (como las tomas). */
  mostrar(t: Textura, acercar?: boolean): void;
  /** Una onda en ese punto (0 a 1 del lienzo, desde arriba a la izquierda). Hasta 6 a la vez. */
  ondas(x: number, y: number): void;
  /** La foto se arma desde puntos desordenados. Termina con la foto lisa. */
  particulas(t: Textura, maximo: number): Promise<void>;
  /** Cambio de una foto a otra con un borde ondulado que avanza. Termina con la segunda, lisa. */
  liquido(de: Textura, a: Textura, acercar?: boolean): Promise<void>;
  /** Ajusta el lienzo a su caja (hasta 2 de densidad) y vuelve a dibujar. */
  ajustar(): void;
  /** Avisa una vez, después del próximo dibujo (para mostrar el lienzo recién cuando ya tiene algo). */
  alPintar(f: () => void): void;
  /** Pausa a mano. Además se pausa solo fuera de la vista y con la pestaña oculta. */
  pausar(si: boolean): void;
  alPerder(f: () => void): void;
  destruir(): void;
}

const VERT = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";

// Foto con ondas, acercamiento y mezcla líquida hacia una segunda foto.
// Con precisión media de 16 bits (algunos teléfonos) el ruido del borde líquido sale plano: alta si el GPU la tiene.
// `z` es el acercamiento de la foto `a`; `y`, el de la foto `b` (la que entra en el cambio líquido).
const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D a;uniform sampler2D b;uniform float m;uniform float z;uniform float y;uniform float q;uniform vec3 o[6];varying vec2 v;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){vec2 w=vec2(0.);float luz=0.;
for(int i=0;i<6;i++){vec3 g=o[i];if(g.z>=0.){vec2 d=(v-g.xy)*vec2(q,1.);float l=length(d);
float f=sin(46.*l-10.*g.z)*exp(-2.6*g.z)*exp(-9.*abs(l-g.z*.42));w+=normalize(d+1e-5)*f*.02;luz+=f;}}
vec4 c=texture2D(a,(v-.5)/z+.5+w);
if(m>0.){float e=n(v*5.)*.35+n(v*13.+3.)*.1+v.x*.55;float k=m*1.3-.15;float s=1.-smoothstep(k-.07,k+.07,e);
float borde=1.-abs(s*2.-1.);c=mix(c,texture2D(b,(v-.5)/y+.5+w+(n(v*9.)-.5)*.05*borde),s);luz+=borde*.5;}
gl_FragColor=vec4(c.rgb+luz*.09,1.);}`;

// Una partícula por celda de la foto: llega desde lejos, girando, y toma el color de su lugar.
const VERT_P = `attribute vec3 c;uniform float e;uniform float t;varying vec2 v;
void main(){float k=clamp(e*1.45-c.z*.45,0.,1.);k=1.-pow(1.-k,3.);float g=c.z*18.85+(1.-k)*2.;
vec2 ini=c.xy+vec2(cos(g),sin(g))*(.35+c.z*.9);vec2 pos=mix(ini,c.xy,k);v=c.xy;
gl_Position=vec4(pos*2.-1.,0.,1.);gl_PointSize=t*(1.+(1.-k)*1.2);}`;
const FRAG_P = "precision mediump float;uniform sampler2D a;varying vec2 v;void main(){gl_FragColor=vec4(texture2D(a,v).rgb,1.);}";

const DURACION = { particulas: 1200, liquido: 1000, onda: 1700, acercar: 6000 };
const LADO_MAXIMO = 1600;

/** Crea el motor sobre un lienzo. `null` si el navegador no da WebGL. */
export function crearMotor(lienzo: HTMLCanvasElement): Motor | null {
  const opciones: WebGLContextAttributes = { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: "low-power" };
  const gl = (lienzo.getContext("webgl", opciones) ?? lienzo.getContext("experimental-webgl", opciones)) as WebGLRenderingContext | null;
  if (!gl) return null;

  const compilar = (tipo: number, fuente: string) => {
    const s = gl.createShader(tipo)!;
    gl.shaderSource(s, fuente);
    gl.compileShader(s);
    return s;
  };
  const programa = (v: string, f: string) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, compilar(gl.VERTEX_SHADER, v));
    gl.attachShader(p, compilar(gl.FRAGMENT_SHADER, f));
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  };
  const foto = programa(VERT, FRAG);
  const puntos = programa(VERT_P, FRAG_P);
  if (!foto || !puntos) return null;

  const cuadro = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cuadro);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const nube = gl.createBuffer();
  const uni = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const U = { a: uni(foto, "a"), b: uni(foto, "b"), m: uni(foto, "m"), z: uni(foto, "z"), y: uni(foto, "y"), q: uni(foto, "q"), o: uni(foto, "o") };
  const UP = { a: uni(puntos, "a"), e: uni(puntos, "e"), t: uni(puntos, "t") };

  const texturas = new Set<Textura>();
  let vivo = true;
  let pausado = false;
  let cuadroPedido = 0;
  let perder: (() => void) | null = null;
  let trasPintar: (() => void) | null = null;
  let actual: Textura | null = null;
  let acercarDesde = 0;
  /** Acercamiento lento de una foto que empezó a verse en `desde` (1 si no se acerca). */
  const zoomDe = (ahora: number, desde: number) => (desde ? 1 + 0.08 * Math.min(1, (ahora - desde) / DURACION.acercar) : 1);
  const olas: { x: number; y: number; t0: number }[] = [];
  let anim:
    | { tipo: "particulas"; t0: number; t: Textura; n: number; lado: number; fin: () => void }
    | { tipo: "liquido"; t0: number; de: Textura; a: Textura; acercar: boolean; fin: () => void }
    | null = null;

  /** Sube la foto recortada a la caja del lienzo (como object-fit: cover), ya rasterizada a su tamaño. */
  const subir = (t: Textura) => {
    const w = lienzo.width;
    const h = lienzo.height;
    const iw = t.img.naturalWidth;
    const ih = t.img.naturalHeight;
    const lona = document.createElement("canvas");
    lona.width = w;
    lona.height = h;
    const ctx = lona.getContext("2d");
    if (!ctx || !iw || !ih) return false;
    const k = Math.max(w / iw, h / ih);
    ctx.drawImage(t.img, (w - iw * k) / 2, (h - ih * k) / 2, iw * k, ih * k);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lona);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // La lona ya no hace falta: se suelta su memoria (en iOS los lienzos tienen un tope).
    lona.width = lona.height = 0;
    return true;
  };

  const medir = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const k = Math.min(1, LADO_MAXIMO / Math.max(1, lienzo.clientWidth * dpr, lienzo.clientHeight * dpr));
    const w = Math.max(1, Math.round(lienzo.clientWidth * dpr * k));
    const h = Math.max(1, Math.round(lienzo.clientHeight * dpr * k));
    if (w === lienzo.width && h === lienzo.height) return false;
    lienzo.width = w;
    lienzo.height = h;
    return true;
  };

  const efecto = (): EfectoFoto => anim?.tipo ?? (olas.length ? "ondas" : "quieta");
  const anotar = () => {
    const e = efecto();
    if (lienzo.dataset.efecto !== e) lienzo.dataset.efecto = e;
  };

  const atar = (unidad: number, t: Textura, lugar: WebGLUniformLocation | null) => {
    gl.activeTexture(gl.TEXTURE0 + unidad);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.uniform1i(lugar, unidad);
  };

  const dibujarFoto = (ahora: number, a: Textura, b: Textura | null, mezcla: number, zoomB = 1) => {
    gl.useProgram(foto);
    gl.bindBuffer(gl.ARRAY_BUFFER, cuadro);
    const p = gl.getAttribLocation(foto, "p");
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    atar(0, a, U.a);
    atar(1, b ?? a, U.b);
    gl.uniform1f(U.m, mezcla);
    gl.uniform1f(U.z, zoomDe(ahora, acercarDesde));
    gl.uniform1f(U.y, zoomB);
    gl.uniform1f(U.q, lienzo.width / lienzo.height);
    const datos = new Float32Array(18);
    for (let i = 0; i < 6; i++) {
      const o = olas[i];
      datos.set(o ? [o.x, 1 - o.y, (ahora - o.t0) / 1000] : [0, 0, -1], i * 3);
    }
    gl.uniform3fv(U.o, datos);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const pintar = (ahora: number) => {
    cuadroPedido = 0;
    if (!vivo || pausado) return;
    while (olas.length && ahora - olas[0].t0 > DURACION.onda) olas.shift();
    gl.viewport(0, 0, lienzo.width, lienzo.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const dibujo = Boolean(anim || actual);
    if (anim?.tipo === "particulas") {
      const e = Math.min(1, (ahora - anim.t0) / DURACION.particulas);
      gl.useProgram(puntos);
      gl.bindBuffer(gl.ARRAY_BUFFER, nube);
      const c = gl.getAttribLocation(puntos, "c");
      gl.enableVertexAttribArray(c);
      gl.vertexAttribPointer(c, 3, gl.FLOAT, false, 0, 0);
      atar(0, anim.t, UP.a);
      gl.uniform1f(UP.e, e);
      gl.uniform1f(UP.t, anim.lado);
      gl.drawArrays(gl.POINTS, 0, anim.n);
      if (e >= 1) terminar();
    } else if (anim?.tipo === "liquido") {
      const m = Math.min(1, (ahora - anim.t0) / DURACION.liquido);
      // La foto que entra parte su acercamiento junto con el cambio, para seguirlo sin salto cuando termina.
      dibujarFoto(ahora, anim.de, anim.a, Math.max(0.0001, m), anim.acercar ? zoomDe(ahora, anim.t0) : 1);
      if (m >= 1) terminar();
    } else if (actual) {
      dibujarFoto(ahora, actual, null, 0);
    }
    anotar();
    if (dibujo && trasPintar) {
      const f = trasPintar;
      trasPintar = null;
      f();
    }
    const acercando = acercarDesde && ahora - acercarDesde < DURACION.acercar;
    if (anim || olas.length || acercando) pedir();
  };
  const pedir = () => {
    if (!cuadroPedido && vivo && !pausado) cuadroPedido = requestAnimationFrame(pintar);
  };

  /** Cierra la animación en curso dejando la foto final lista (también si se pausa a medio camino). */
  const terminar = () => {
    const a = anim;
    if (!a) return;
    anim = null;
    if (a.tipo === "particulas") actual = a.t;
    else {
      actual = a.a;
      // Sigue el acercamiento que la foto traía desde que empezó el cambio.
      acercarDesde = a.acercar ? a.t0 : 0;
    }
    a.fin();
    anotar();
    pedir();
  };

  const alPerderContexto = (e: Event) => {
    e.preventDefault();
    vivo = false;
    anim?.fin();
    anim = null;
    perder?.();
  };
  lienzo.addEventListener("webglcontextlost", alPerderContexto);

  // Tres motivos de pausa que no se pisan: fuera de la vista, pestaña oculta y pausa a mano.
  const pausas = { vista: false, pestana: false, mano: false };
  const aplicarPausa = () => {
    const p = pausas.vista || pausas.pestana || pausas.mano;
    if (p === pausado) return;
    pausado = p;
    // En pausa nada avanza: lo que estaba a medias se cierra para que quien espera no quede colgado.
    if (p) terminar();
    else pedir();
  };
  const vista =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((avisos) => {
          // Vale el aviso más nuevo.
          pausas.vista = !avisos[avisos.length - 1].isIntersecting;
          aplicarPausa();
        })
      : null;
  vista?.observe(lienzo);
  const alOcultar = () => {
    pausas.pestana = document.visibilityState === "hidden";
    aplicarPausa();
  };
  document.addEventListener("visibilitychange", alOcultar);
  // Mientras la ventana cambia de tamaño llegan muchos avisos: la foto se vuelve a subir cuando se detiene, no en cada uno.
  let esperaTamano = 0;
  const tamano =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          window.clearTimeout(esperaTamano);
          esperaTamano = window.setTimeout(() => motor.ajustar(), 150);
        })
      : null;
  tamano?.observe(lienzo);
  medir();

  const motor: Motor = {
    async cargar(url) {
      const img = await pedirConPermiso(url, true);
      if (!img || !vivo) return null;
      const t: Textura = { img, tex: gl.createTexture()! };
      let subida = false;
      try {
        subida = subir(t);
      } catch {
        /* foto que no se puede leer */
      }
      if (!subida) {
        gl.deleteTexture(t.tex);
        return null;
      }
      texturas.add(t);
      return t;
    },
    soltar(t) {
      if (!texturas.delete(t)) return;
      if (actual === t) actual = null;
      if (vivo) gl.deleteTexture(t.tex);
    },
    mostrar(t, acercar = false) {
      actual = t;
      acercarDesde = acercar ? performance.now() : 0;
      pedir();
      anotar();
    },
    ondas(x, y) {
      if (!actual && !anim) return;
      if (olas.length >= 6) olas.shift();
      olas.push({ x, y, t0: performance.now() });
      anotar();
      pedir();
    },
    particulas(t, maximo) {
      terminar();
      return new Promise((fin) => {
        if (!vivo) return fin();
        const { columnas, filas } = rejillaParticulas(lienzo.width, lienzo.height, maximo);
        const n = columnas * filas;
        // Cada punto cubre su celda (un poco más, para que no queden rendijas).
        const lado = Math.ceil(Math.max(lienzo.width / columnas, lienzo.height / filas)) + 1;
        // Hay GPUs que no dibujan puntos de ese tamaño: ahí la foto aparece sin partículas.
        const rango = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array | null;
        if (rango && rango[1] < lado) {
          actual = t;
          pedir();
          return fin();
        }
        const datos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const azar = Math.sin((i + 1) * 12.9898) * 43758.5453;
          datos.set([((i % columnas) + 0.5) / columnas, (Math.floor(i / columnas) + 0.5) / filas, azar - Math.floor(azar)], i * 3);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, nube);
        gl.bufferData(gl.ARRAY_BUFFER, datos, gl.STATIC_DRAW);
        anim = { tipo: "particulas", t0: performance.now(), t, n, lado, fin };
        anotar();
        if (pausado) terminar();
        else pedir();
      });
    },
    liquido(de, a, acercar = false) {
      terminar();
      return new Promise((fin) => {
        if (!vivo) return fin();
        anim = { tipo: "liquido", t0: performance.now(), de, a, acercar, fin };
        anotar();
        if (pausado) terminar();
        else pedir();
      });
    },
    ajustar() {
      if (!vivo || !medir()) return;
      try {
        texturas.forEach(subir);
      } catch {
        /* una foto que ya no se puede leer: queda la textura anterior, estirada */
      }
      pedir();
    },
    alPintar(f) {
      trasPintar = f;
      pedir();
    },
    pausar(si) {
      pausas.mano = si;
      aplicarPausa();
    },
    alPerder(f) {
      perder = f;
    },
    destruir() {
      vivo = false;
      trasPintar = null;
      cancelAnimationFrame(cuadroPedido);
      anim?.fin();
      anim = null;
      vista?.disconnect();
      tamano?.disconnect();
      window.clearTimeout(esperaTamano);
      document.removeEventListener("visibilitychange", alOcultar);
      lienzo.removeEventListener("webglcontextlost", alPerderContexto);
      // Suelta el contexto de inmediato: los navegadores permiten pocos a la vez.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
  return motor;
}
