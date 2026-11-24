import { useEffect, useRef, type HTMLAttributes } from "react";
import { useStyles } from "../utils/styles";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { CSS_ESCENA } from "./css";

export type ShaderId = "aurora" | "liquido" | "humo" | "luz" | "lava";

export const SHADERS: Record<ShaderId, { nombre: string; descripcion: string }> = {
  aurora: { nombre: "Aurora", descripcion: "Cortinas de luz que ondulan y se corren hacia el dedo." },
  liquido: { nombre: "Líquido", descripcion: "Colores que se mezclan como tinta en agua; el dedo los revuelve." },
  humo: { nombre: "Humo", descripcion: "Humo lento que sube, con el color del estilo." },
  luz: { nombre: "Foco de luz", descripcion: "Un foco con rayos que sigue al dedo o al cursor." },
  lava: { nombre: "Lámpara de lava", descripcion: "Manchas de color que suben, bajan y se funden; el dedo suma una." },
};
export const SHADER_IDS = Object.keys(SHADERS) as ShaderId[];

const VERTICE = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

// Ruido y fbm cortos, comunes a todos. Se pide precisión alta cuando el teléfono la tiene: con la media (16 bits en
// muchos teléfonos) el tiempo avanza a saltos al poco rato y el fondo se ve trabado.
const COMUN = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 c0;uniform vec3 c1;uniform vec3 c2;uniform float k;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
`;

// Cada uno mezcla el color del estilo sobre el fondo (mix, no suma): así sirve en estilos oscuros y claros.
const FRAGMENTOS: Record<ShaderId, string> = {
  aurora: `${COMUN}void main(){vec2 u=gl_FragCoord.xy/r;vec2 q=vec2(u.x*r.x/r.y,u.y);vec3 col=c0;
for(int i=0;i<3;i++){float fi=float(i);
float y=.42+.13*fi-.08*m.y+.16*sin(q.x*1.3+t*.25*(1.+fi*.3)+fbm(q*1.5+t*.08+fi)*2.5);
float d=u.y-y;float b=exp(-d*d*60.)*(.55+.45*fbm(vec2(q.x*3.+fi*5.,t*.15)))*smoothstep(-.25,.02,d);
col=mix(col,mix(c1,c2,fi*.5+.25*sin(t*.2+q.x+m.x)),clamp(b*.85*k,0.,.9));}
gl_FragColor=vec4(col,1.);}`,
  liquido: `${COMUN}void main(){vec2 u=gl_FragCoord.xy/r;vec2 q=vec2(u.x*r.x/r.y,u.y)*2.2;
vec2 pm=vec2((m.x*.5+.5)*r.x/r.y,.5-m.y*.5)*2.2;q+=(q-pm)*.35*exp(-dot(q-pm,q-pm)*1.5);
vec2 w=vec2(fbm(q+t*.07),fbm(q+vec2(5.2,1.3)-t*.06));float v=fbm(q+3.*w+t*.03);
vec3 col=mix(c0,c1,smoothstep(.35,.85,v)*.6*k);col=mix(col,c2,smoothstep(.62,.95,w.x*v*1.6)*.45*k);
gl_FragColor=vec4(col,1.);}`,
  humo: `${COMUN}void main(){vec2 u=gl_FragCoord.xy/r;vec2 q=vec2(u.x*r.x/r.y,u.y)*3.;
q.y-=t*.12;q.x+=m.x*.3;float v=fbm(q+fbm(q*1.5+t*.05)*1.6);v*=smoothstep(1.1,.1,u.y);
vec3 col=mix(c0,mix(c1,c2,u.x),clamp(pow(v,1.3)*.85*k,0.,.75));gl_FragColor=vec4(col,1.);}`,
  luz: `${COMUN}void main(){vec2 u=gl_FragCoord.xy/r;vec2 a=vec2(r.x/r.y,1.);
vec2 f=vec2(m.x*.4+.5,.62-m.y*.3);vec2 d=(u-f)*a;float l=length(d);
float ang=atan(d.y,d.x);float rayos=.5+.5*sin(ang*9.+t*.4+fbm(vec2(ang*2.,t*.2))*3.);
float g=exp(-l*3.)*(.55+.45*rayos)+exp(-l*l*30.)*.35;
vec3 col=mix(c0,mix(c2,c1,clamp(l*1.6,0.,1.)),clamp(g*.85*k,0.,.8));gl_FragColor=vec4(col,1.);}`,
  // Seis manchas que suben y bajan a su ritmo (y una más donde está el dedo): se suma lo que aporta cada una y, donde
  // la suma pasa el umbral, hay lava. Por eso se funden al acercarse. Hacia el centro, cada mancha vira de a poco al
  // segundo color. Son un poco más altas que anchas y, en pantallas angostas, más chicas (para no tapar todo).
  lava: `${COMUN}void main(){vec2 u=gl_FragCoord.xy/r;float a=r.x/r.y;vec2 q=vec2(u.x*a,u.y);float f=0.,s=min(1.,.55+.45*a);
for(int i=0;i<6;i++){float fi=float(i);
vec2 c=vec2(a*(.5+.4*sin(t*(.07+.013*fi)+fi*2.4)+.1*sin(fi*5.1)),.5+.46*sin(t*(.16+.031*fi)+fi*1.7));
float w=(.11+.035*sin(fi*3.7))*s;vec2 d=q-c;d.x*=1.12;f+=w*w/(dot(d,d)+.0001);}
vec2 e=q-vec2((m.x*.5+.5)*a,.5-m.y*.5);f+=.012*s*s/(dot(e,e)+.0001);
float g=smoothstep(.45,1.,f),v=smoothstep(1.,1.3,f),o=smoothstep(1.,6.,f);
vec3 col=mix(c0,c1,clamp((g*.16+v*.5)*k,0.,.7));col=mix(col,c2,clamp(o*.5*k,0.,.6));gl_FragColor=vec4(col,1.);}`,
};

/** Convierte cualquier color CSS a [r, g, b] de 0 a 1 (el canvas 2D lo resuelve por nosotros). */
function aRgb(css: string, respaldo: [number, number, number]): [number, number, number] {
  if (!css) return respaldo;
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return respaldo;
  c.fillStyle = "#000";
  c.fillStyle = css.trim();
  const v = String(c.fillStyle);
  if (v.startsWith("#") && v.length === 7) return [1, 3, 5].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as [number, number, number];
  const m = v.match(/[\d.]+/g);
  return m ? [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255] : respaldo;
}

export interface ShaderFondoProps extends HTMLAttributes<HTMLDivElement> {
  tipo?: ShaderId;
  /** 1 es la velocidad normal. */
  velocidad?: number;
  /** De 0 a 1,5: cuánto color suma sobre el fondo. */
  intensidad?: number;
  /** Dibuja un cuadro y se queda quieto (ahorro de datos o un teléfono lento). */
  quieto?: boolean;
  /** Resolución interna respecto de la pantalla (0,4 a 1). Menos es más liviano; el shader es difuso y no se nota. */
  resolucion?: number;
}

/**
 * Fondo animado con WebGL, escrito a mano (sin librerías, menos de 10 KB). Toma los colores del `Estilo`
 * (`--mk-fondo`, `--mk-acento`, `--mk-acento-2`) y sigue al dedo si quien lo contiene tiene `--mk-cx` y `--mk-cy`.
 * Sin WebGL queda un degradado CSS. Fuera de pantalla no dibuja.
 */
export function ShaderFondo({ tipo = "aurora", velocidad = 1, intensidad = 1, quieto = false, resolucion = 0.6, className, ...resto }: ShaderFondoProps) {
  useStyles("escena", CSS_ESCENA);
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const reducido = useReducedMotion();
  const parado = quieto || reducido;

  useEffect(() => {
    const div = caja.current;
    const cv = lienzo.current;
    if (!div || !cv) return;
    const gl = cv.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
    if (!gl) {
      div.dataset.sinWebgl = "";
      return;
    }
    const compilar = (tipoSh: number, src: string) => {
      const s = gl.createShader(tipoSh)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERTICE));
      gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FRAGMENTOS[tipo]));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    } catch {
      div.dataset.sinWebgl = "";
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const U = (nombre: string) => gl.getUniformLocation(prog, nombre);
    const uR = U("r"), uT = U("t"), uM = U("m"), uC0 = U("c0"), uC1 = U("c1"), uC2 = U("c2"), uK = U("k");

    const colores = () => {
      const cs = getComputedStyle(div);
      gl.uniform3fv(uC0, aRgb(cs.getPropertyValue("--mk-fondo"), [0.04, 0.03, 0.08]));
      gl.uniform3fv(uC1, aRgb(cs.getPropertyValue("--mk-acento"), [0.49, 0.36, 1]));
      gl.uniform3fv(uC2, aRgb(cs.getPropertyValue("--mk-acento-2") || cs.getPropertyValue("--mk-acento"), [0.15, 0.9, 1]));
    };
    colores();
    gl.uniform1f(uK, Math.max(0, Math.min(1.5, intensidad)));

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * Math.max(0.4, Math.min(1, resolucion));
      const w = Math.max(1, Math.round(div.clientWidth * dpr));
      const h = Math.max(1, Math.round(div.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      // El tamaño va siempre al programa: cuando esto se vuelve a montar (otro shader, o el modo estricto de React), el
      // lienzo ya mide lo mismo, pero el programa es nuevo y sin su tamaño pintaría un color parejo.
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uR, w, h);
    };
    medir();
    let mx = 0, my = 0;
    const dibujar = (t: number) => {
      const cs = getComputedStyle(div);
      const cx = parseFloat(cs.getPropertyValue("--mk-cx")) || 0;
      const cy = parseFloat(cs.getPropertyValue("--mk-cy")) || 0;
      mx += (cx - mx) * 0.1;
      my += (cy - my) * 0.1;
      gl.uniform1f(uT, t);
      gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let cuadro = 0;
    let visible = false;
    const t0 = performance.now();
    const bucle = (ahora: number) => {
      dibujar(((ahora - t0) / 1000) * velocidad + 7);
      if (!div.dataset.listo) div.dataset.listo = "";
      if (visible && !parado) cuadro = requestAnimationFrame(bucle);
    };
    const arrancar = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(bucle);
    };
    const vista = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible) arrancar();
        })
      : undefined;
    if (vista) vista.observe(div);
    else {
      visible = true;
      arrancar();
    }
    const tamano = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { medir(); if (parado) arrancar(); }) : undefined;
    tamano?.observe(div);
    // Si cambia el estilo (otros colores), se vuelven a leer.
    const cambios = new MutationObserver(() => { colores(); if (parado) arrancar(); });
    const conEstilo = div.closest(".mk-estilo") ?? document.documentElement;
    cambios.observe(conEstilo, { attributes: true, attributeFilter: ["class", "style", "data-mk-estilo"] });
    const perdido = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(cuadro);
      div.dataset.sinWebgl = "";
    };
    cv.addEventListener("webglcontextlost", perdido);

    return () => {
      cancelAnimationFrame(cuadro);
      vista?.disconnect();
      tamano?.disconnect();
      cambios.disconnect();
      cv.removeEventListener("webglcontextlost", perdido);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
      delete div.dataset.listo;
      delete div.dataset.sinWebgl;
    };
  }, [tipo, velocidad, intensidad, parado, resolucion]);

  return (
    <div {...resto} ref={caja} className={`mk-shader${className ? " " + className : ""}`} data-tipo={tipo} aria-hidden="true">
      <canvas ref={lienzo} />
    </div>
  );
}
