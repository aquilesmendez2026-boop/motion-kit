// Ruleta de premios: se lanza con el dedo (o con el botón «Girar»), gira con peso y roce, y la lengüeta de arriba va
// saltando de clavo en clavo. Se detiene en el premio que le digan (`resultado`, o lo que devuelva `alGirar`): la
// ruleta no decide quién gana. Nunca frena de golpe ni retrocede (ver calculo-ruleta.ts).
// La luz no gira con la rueda (es de la página); cuando va rápido se ve la estela del giro; al detenerse, los premios
// que no salieron se apagan.
// Lo único que se mueve es el giro de la rueda, de su estela y de la lengüeta (`rotate`), y opacidades.
import { Suspense, lazy, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { pasoResorte } from "../dedo/resorte";
import { semilla as azar } from "../efectos/semilla";
import { useStyles } from "../utils/styles";
import { vibrar } from "../estilos/sonidos";
import { alAcabar } from "./al-acabar";
import { Limite } from "./aparte";
import { numeroDe, useMomento, type ComunesMomento } from "./base";
import { Confeti } from "./Confeti";
import { IMPULSO_BOTON, anguloEn, clavosPasados, limpiarPremios, planDeGiro, planLibre, velocidadDeGesto, type PlanDeGiro, type Premio } from "./calculo-ruleta";

// Los fuegos se bajan aparte, y solo si se piden. Si su archivo no llega, la ruleta sigue sin celebración.
const Fuegos = lazy(() => import("./FuegosArtificiales"));

export interface RuletaDePremiosProps extends ComunesMomento {
  /** De 2 a 12 premios (`{ texto }` o un texto suelto). */
  premios: (Premio | string)[];
  /**
   * El índice (en `premios`, tal como se pasó) del premio donde tiene que detenerse, si ya se sabe. Si ese premio no
   * existe en la rueda, la ruleta no inventa otro: se detiene sin anunciar premio y avisa con `null`.
   */
  resultado?: number;
  /** Para pedir el resultado al lanzar (por ejemplo, al servidor). Mientras llega, la rueda gira pareja. */
  alGirar?: () => number | Promise<number>;
  /** Se llama al detenerse, con el índice del premio (en `premios`, tal como se pasó); o con `null` si no se pudo saber. */
  alTerminar?: (premio: number | null) => void;
  /**
   * La ruleta gira una vez. Para permitir otra vuelta, cambia este número. Si cambia a mitad de giro, ese giro termina
   * y avisa igual; la vuelta nueva queda lista cuando se detiene.
   */
  vez?: number;
  /** El `slug` del negocio: decide el punto exacto donde se detiene dentro del premio. */
  semilla?: string;
  celebracion?: "confeti" | "fuegos" | "nada";
  /** Un golpecito por cada clavo (donde el teléfono vibra). Por defecto, sí. */
  vibracion?: boolean;
}

/**
 * La hora de un toque (ms, en el reloj de `performance.now()`). Es la hora en que pasó, no la hora en que la página lo
 * atiende: en un teléfono ocupado los toques se atienden todos juntos, y medido así el gesto quedaría sin velocidad.
 */
const horaDe = (ev: { timeStamp: number }) => (ev.timeStamp > 0 && ev.timeStamp < 1e12 ? ev.timeStamp : performance.now());
/** La última vuelta que terminó: de qué `vez` fue, qué salió y con qué lista de premios. */
interface Jugada {
  vez: number;
  /** El índice del premio en la lista original, o `null` si no se supo. */
  premio: number | null;
  /** Su lugar en la rueda. */
  lugar: number | null;
  texto: string | null;
  firma: string;
}
/** Cuánto se espera el resultado de `alGirar` antes de dejar que la rueda frene sola (ms). */
const ESPERA_MAXIMA = 10000;
const ACENTO = "var(--mk-m-acento)";
const CLARO = "color-mix(in srgb,var(--mk-m-acento) 14%,var(--mk-m-superficie))";
const MEDIO = "color-mix(in srgb,var(--mk-m-acento) 34%,var(--mk-m-superficie))";
/** Hacia dónde está la luz (la de `Luz`, si la página tiene una), a tanta distancia del centro. */
const HACIA = (d: number) => `calc(50% + var(--mk-l0x,-.45)*${d}%) calc(50% + var(--mk-l0y,-.8)*${d}%)`;

export const CSS_RULETA =
  ".mk-m-ruleta{width:100%;display:grid;justify-items:center;gap:.8rem}" +
  // El dedo que baja o sube es de la página (`pan-y`): un scroll no lanza la rueda. Se lanza de lado, o con el botón.
  ".mk-m-ruleta-zona{position:relative;width:min(100%,300px);aspect-ratio:1;container-type:inline-size;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none}" +
  ".mk-m-ruleta-zona[data-girando]{cursor:default}" +
  ".mk-m-ruleta-sombra{position:absolute;inset:3%;border-radius:50%;background:#000;opacity:.34;filter:blur(12px);translate:calc(var(--mk-l0x,-.45)*-12px) calc(var(--mk-l0y,-.8)*-16px)}" +
  ".mk-m-ruleta-rueda{position:absolute;inset:0;border-radius:50%;box-sizing:border-box;border:6px solid var(--mk-m-texto);overflow:hidden;overflow:clip}" +
  // Cada rótulo va en un brazo girado hasta el centro de su premio; el texto corre del borde hacia el centro.
  ".mk-m-ruleta-rotulo{position:absolute;inset:0;pointer-events:none}" +
  // La letra se achica lo justo para que el texto quepa entero (según su largo), hasta un mínimo; pasado eso, se corta.
  ".mk-m-ruleta-rotulo span{position:absolute;left:50%;top:5.5%;height:37.5%;translate:-50% 0;writing-mode:vertical-rl;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:700;" +
  "font-size:.8rem;font-size:clamp(3.3cqw,calc(64cqw/var(--mk-r-largo,12)),var(--mk-r-letra,4.6cqw));line-height:1.1}" +
  // El velo que apaga los premios que no salieron: deja libre un premio y se gira hasta el que salió.
  ".mk-m-ruleta-velo{position:absolute;inset:0;opacity:0;transition:opacity .5s ease-out;pointer-events:none}" +
  ".mk-m-ruleta-velo[data-ve]{opacity:1}" +
  ".mk-m-ruleta[data-nivel=quieto] .mk-m-ruleta-velo{transition:none}" +
  // La estela: dos copias de los colores, corridas hacia atrás y hacia adelante, que se ven solo cuando va rápido.
  ".mk-m-ruleta-estela{position:absolute;inset:6px;border-radius:50%;opacity:0;pointer-events:none}" +
  // La luz no gira: un brillo del lado de la luz, penumbra del otro, y la sombra del aro sobre la cara.
  `.mk-m-ruleta-luz{position:absolute;inset:0;border-radius:50%;pointer-events:none;background:radial-gradient(circle at ${HACIA(42)},rgba(255,255,255,.3),transparent 52%),radial-gradient(circle at ${HACIA(-44)},rgba(0,0,0,.34),transparent 62%)}` +
  ".mk-m-ruleta-luz::after{content:\"\";position:absolute;inset:6px;border-radius:50%;box-shadow:inset calc(var(--mk-l0x,-.45)*-6px) calc(var(--mk-l0y,-.8)*-8px) 9px rgba(0,0,0,.45)}" +
  ".mk-m-ruleta-clavo{position:absolute;inset:0;pointer-events:none}" +
  ".mk-m-ruleta-clavo::before{content:\"\";position:absolute;left:50%;top:1.2%;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;background:var(--mk-m-superficie);box-shadow:0 0 0 2px var(--mk-m-texto)}" +
  `.mk-m-ruleta-eje{position:absolute;left:50%;top:50%;width:18%;height:18%;margin:-9%;border-radius:50%;border:5px solid var(--mk-m-texto);box-sizing:border-box;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,.5);` +
  `background:radial-gradient(circle at ${HACIA(30)},color-mix(in srgb,var(--mk-m-texto) 50%,var(--mk-m-superficie)),var(--mk-m-superficie) 74%)}` +
  // La lengüeta: cuelga de arriba y se dobla cuando pasa un clavo.
  ".mk-m-ruleta-lengueta{position:absolute;left:50%;top:-4%;width:18px;height:15%;margin-left:-9px;transform-origin:50% 12%;pointer-events:none;z-index:2;" +
  "background:var(--mk-m-texto);clip-path:polygon(0 0,100% 0,100% 30%,50% 100%,0 30%);filter:drop-shadow(0 2px 2px rgba(0,0,0,.4))}" +
  ".mk-m-ruleta-resultado{margin:0;min-height:1.6em;font-size:1.2rem;font-weight:800;text-align:center;overflow-wrap:anywhere}" +
  ".mk-m-ruleta .mk-m-boton[aria-disabled=true]{opacity:.45;cursor:default}";

export default function RuletaDePremios({ premios, resultado, alGirar, alTerminar, vez = 0, semilla = "", celebracion = "confeti", vibracion = true, nivel: forzado, ahorro, className }: RuletaDePremiosProps) {
  useStyles("momento-ruleta", CSS_RULETA);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const lista = limpiarPremios(premios);
  const n = lista.length;
  const paso = n ? 360 / n : 360;
  /** La lista, en un texto: si cambia, es otra rueda. */
  const firma = lista.map((p) => p.texto).join("\n");
  const [girando, setGirando] = useState(false);
  const [jugada, setJugada] = useState<Jugada | null>(null);
  const zona = useRef<HTMLDivElement>(null);
  const rueda = useRef<HTMLDivElement>(null);
  const lengueta = useRef<HTMLDivElement>(null);
  const estela = useRef<(HTMLElement | null)[]>([]);
  /** Lo que mueve a la rueda. Vive fuera de React: cambia en cada cuadro. */
  const m = useRef({
    angulo: 0,
    antes: 0,
    /** Qué tan rápido gira ahora (grados por segundo, con signo). */
    vel: 0,
    cuadro: 0,
    reloj: 0,
    fase: "quieta" as "quieta" | "arrastre" | "espera" | "plan" | "vuelve",
    plan: null as PlanDeGiro | null,
    parte: 0,
    /** Dónde va a quedar: el lugar del premio en la rueda, o `null` si no se sabe. */
    lugar: null as number | null,
    /** De qué `vez` es el giro en curso, y si hay uno. */
    vez: 0,
    gira: false,
    /** Para dejar de esperar el final de la vuelta corta (liviano). */
    soltar: null as (() => void) | null,
    sentido: 1,
    v0: 0,
    base: 0,
    dedo: 0,
    id: -1,
    muestras: [] as { t: number; a: number }[],
    lengua: { x: 0, v: 0 },
    turno: 0,
    espera: 0 as ReturnType<typeof setTimeout> | 0,
    vivo: true,
  });
  // Lo último que pasó la página, para leerlo desde el giro sin rearmar nada.
  const ahora = useRef({ resultado, alGirar, alTerminar, vibracion, semilla, vez, lista, firma, nivel });
  ahora.current = { resultado, alGirar, alTerminar, vibracion, semilla, vez, lista, firma, nivel };

  useEffect(() => {
    const s = m.current;
    s.vivo = true;
    // Si la pieza vuelve a mostrarse con un giro a medias, sigue.
    if (s.fase !== "quieta") pedir();
    return () => {
      s.vivo = false;
      cancelAnimationFrame(s.cuadro);
      s.cuadro = 0;
      if (s.espera) clearTimeout(s.espera);
      s.soltar?.();
    };
  }, []);
  // La lista de premios cambió a mitad de giro: lo que iba a salir ya no vale. Se detiene donde va, sin premio.
  const firmaAntes = useRef(firma);
  useEffect(() => {
    if (firmaAntes.current === firma) return;
    firmaAntes.current = firma;
    const s = m.current;
    if (!s.gira) return;
    s.turno++;
    if (s.espera) clearTimeout(s.espera);
    s.espera = 0;
    s.soltar?.();
    s.soltar = null;
    cancelAnimationFrame(s.cuadro);
    s.cuadro = 0;
    s.vel = 0;
    s.lengua = { x: 0, v: 0 };
    s.lugar = null;
    pintar();
    terminar();
  }, [firma]);

  const pintar = () => {
    const s = m.current;
    if (rueda.current) rueda.current.style.rotate = `${s.angulo.toFixed(2)}deg`;
    if (lengueta.current) lengueta.current.style.rotate = `${s.lengua.x.toFixed(1)}deg`;
    // La estela: más corrida y más visible mientras más rápido va; quieta, no está.
    const fuerza = Math.min(1, Math.abs(s.vel) / 900);
    const corre = Math.sign(s.vel) * Math.min(14, Math.abs(s.vel) * 0.012);
    estela.current.forEach((e, i) => {
      if (!e) return;
      e.style.rotate = `${(s.angulo + (i ? corre : -corre)).toFixed(2)}deg`;
      e.style.opacity = (fuerza * (i ? 0.33 : 0.5)).toFixed(2);
    });
  };
  const terminar = () => {
    const s = m.current;
    const a = ahora.current;
    s.fase = "quieta";
    s.gira = false;
    const p = s.lugar === null ? undefined : a.lista[s.lugar];
    setGirando(false);
    setJugada({ vez: s.vez, premio: p ? p.indice : null, lugar: p ? s.lugar : null, texto: p ? p.texto : null, firma: a.firma });
    a.alTerminar?.(p ? p.indice : null);
  };
  /** Un cuadro: mueve la rueda según la fase y dobla la lengüeta si pasó un clavo. */
  const cuadro = (t: number) => {
    const s = m.current;
    s.cuadro = 0;
    if (!s.vivo) return;
    const dt = Math.min(0.05, Math.max(0, (t - s.reloj) / 1000));
    s.reloj = t;
    if (s.fase === "plan" && s.plan) {
      const va = (t - s.parte) / 1000;
      s.angulo = anguloEn(s.plan, va);
      if (va >= s.plan.dura) terminar();
    } else if (s.fase === "espera") s.angulo += s.sentido * s.v0 * dt;
    else if (s.fase === "vuelve") {
      s.angulo += (s.base - s.angulo) * Math.min(1, dt * 12);
      if (Math.abs(s.base - s.angulo) < 0.3) {
        s.angulo = s.base;
        s.fase = "quieta";
      }
    }
    const cuantos = ahora.current.lista.length;
    const clavos = cuantos ? clavosPasados(s.antes, s.angulo, cuantos) : 0;
    if (clavos) {
      // La rueda empuja la punta hacia donde gira.
      s.lengua = { x: -Math.sign(s.angulo - s.antes) * 26, v: 0 };
      if (ahora.current.vibracion) vibrar(3);
    }
    s.vel = s.fase !== "quieta" && dt > 0 ? (s.angulo - s.antes) / dt : 0;
    s.antes = s.angulo;
    s.lengua = pasoResorte(s.lengua, 0, dt, 520, 17);
    if (s.fase === "quieta" && Math.abs(s.lengua.x) < 0.4 && Math.abs(s.lengua.v) < 4) s.lengua = { x: 0, v: 0 };
    pintar();
    if (s.fase !== "quieta" || s.lengua.x !== 0) pedir();
  };
  const pedir = () => {
    const s = m.current;
    if (!s.cuadro && s.vivo) {
      if (!s.reloj || s.fase === "quieta") s.reloj = performance.now();
      s.cuadro = requestAnimationFrame(cuadro);
    }
  };

  /** Con el resultado en la mano (el lugar del premio en la rueda; o sin él, `null`): arma el plan desde donde va la rueda y la deja frenar. */
  const frenarEn = (lugar: number | null) => {
    const s = m.current;
    const a = ahora.current;
    const plan = lugar === null ? null : planDeGiro(s.angulo, s.sentido * s.v0, a.lista.length, lugar, a.semilla);
    s.lugar = plan ? lugar : null;
    s.plan = plan ?? planLibre(s.angulo, s.sentido * s.v0);
    if (!s.plan) return terminar();
    if (a.nivel !== "completo") {
      // Sin giro largo: una vuelta corta (liviano) o nada (quieto), y queda en su lugar. Si venía girando (el nivel
      // bajó mientras se esperaba el resultado), los cuadros se cortan: de aquí en adelante la mueve el navegador.
      cancelAnimationFrame(s.cuadro);
      s.cuadro = 0;
      s.fase = "quieta";
      s.vel = 0;
      s.lengua = { x: 0, v: 0 };
      const queda = s.angulo + ((((s.plan.final - s.angulo) % 360) + 360) % 360) + (a.nivel === "liviano" ? 360 : 0);
      const el = rueda.current;
      s.angulo = s.antes = queda;
      if (el && a.nivel === "liviano") {
        el.style.transition = "rotate 1.3s cubic-bezier(.2,.8,.2,1)";
        pintar();
        // Termina con la transición de la rueda (no con la de un hijo); si no corre (movimiento reducido), al tiro.
        const dejar = alAcabar(el, "transition", () => {
          el.style.transition = "";
          s.soltar = null;
          if (s.vivo) terminar();
        });
        s.soltar = () => {
          dejar();
          el.style.transition = "";
        };
      } else {
        pintar();
        terminar();
      }
      return;
    }
    s.parte = performance.now();
    s.fase = "plan";
    pedir();
  };
  /** Lanza la rueda con esa velocidad (grados por segundo, con signo). Un impulso flojo no cuenta: vuelve. */
  const lanzar = (velocidad: number) => {
    const s = m.current;
    const a = ahora.current;
    const libre = planLibre(s.angulo, velocidad);
    if (!libre) {
      s.fase = "vuelve";
      return pedir();
    }
    s.sentido = libre.sentido;
    s.v0 = libre.velocidad;
    s.vez = a.vez;
    s.gira = true;
    setGirando(true);
    /** El lugar en la rueda del premio con ese índice (el de la lista original), o `null` si no existe. */
    const lugarDe = (r: unknown): number | null => {
      const i = ahora.current.lista.findIndex((p) => p.indice === r);
      return i < 0 ? null : i;
    };
    // Con un resultado dicho, vale ese; si no existe en la rueda, no se anuncia premio (la ruleta no inventa uno).
    if (a.resultado !== undefined) return frenarEn(lugarDe(a.resultado));
    // Sin resultado ni a quién pedírselo (una vitrina): lo elige la semilla.
    if (!a.alGirar) return frenarEn(Math.floor(azar(a.vez, numeroDe(a.semilla) % 1000) * a.lista.length) % a.lista.length);
    // Se pide el resultado. Mientras llega, la rueda gira pareja; si falla o tarda demasiado, frena sola.
    const turno = ++s.turno;
    const llego = (r: unknown) => {
      if (!s.vivo || turno !== s.turno) return;
      s.turno++;
      if (s.espera) clearTimeout(s.espera);
      s.espera = 0;
      frenarEn(lugarDe(r));
    };
    let pedido: number | Promise<number>;
    try {
      pedido = a.alGirar();
    } catch {
      return llego(null);
    }
    if (typeof pedido === "number") return llego(pedido);
    if (a.nivel === "completo") {
      s.fase = "espera";
      pedir();
    }
    s.espera = setTimeout(() => llego(null), ESPERA_MAXIMA);
    Promise.resolve(pedido).then(llego, () => llego(null));
  };

  /** Si la vuelta de esta `vez` ya se jugó. */
  const hecha = jugada !== null && jugada.vez === vez;
  const puede = n > 0 && !girando && !hecha;
  /** El ángulo del dedo respecto del centro de la rueda (grados). */
  const dedoEn = (ev: PointerEvent<HTMLDivElement>) => {
    const c = zona.current!.getBoundingClientRect();
    return (Math.atan2(ev.clientY - (c.top + c.height / 2), ev.clientX - (c.left + c.width / 2)) * 180) / Math.PI;
  };
  const alBajar = (ev: PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    if (!puede || nivel !== "completo" || s.fase === "espera" || s.fase === "plan" || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    s.id = ev.pointerId;
    s.fase = "arrastre";
    s.base = s.angulo;
    s.dedo = dedoEn(ev);
    s.muestras = [{ t: horaDe(ev), a: s.angulo }];
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
  };
  const alMover = (ev: PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    if (s.id !== ev.pointerId || s.fase !== "arrastre") return;
    const dedo = dedoEn(ev);
    // El giro más corto entre el ángulo anterior del dedo y el de ahora.
    const paso = ((dedo - s.dedo + 540) % 360) - 180;
    s.dedo = dedo;
    s.angulo += paso;
    s.muestras.push({ t: horaDe(ev), a: s.angulo });
    if (s.muestras.length > 12) s.muestras.shift();
    pedir();
  };
  const alSoltar = (ev: PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    if (s.id !== ev.pointerId) return;
    s.id = -1;
    if (s.fase !== "arrastre") return;
    // Si el navegador cancela el gesto, no cuenta como lanzamiento: la rueda vuelve.
    s.muestras.push({ t: horaDe(ev), a: s.angulo });
    lanzar(ev.type === "pointerup" ? velocidadDeGesto(s.muestras) : 0);
  };

  if (!n) return null;
  const fondo = `conic-gradient(${lista.map((_, i) => `${i % 2 === 0 ? (n % 2 === 1 && i === n - 1 ? MEDIO : ACENTO) : CLARO} ${i * paso}deg ${(i + 1) * paso}deg`).join(",")})`;
  const sobre = (i: number) => (i % 2 === 0 && !(n % 2 === 1 && i === n - 1) ? "var(--mk-m-sobre)" : "var(--mk-m-texto)");
  /** El premio que se destaca: solo si la rueda sigue siendo la misma con que se jugó. */
  const destaca = hecha && jugada.lugar !== null && jugada.firma === firma ? jugada.lugar : null;
  return (
    <div ref={ref} className={`mk-momento mk-m-ruleta${className ? ` ${className}` : ""}`} data-momento="ruleta" data-nivel={nivel} data-activo={activo ? "" : undefined} data-estado={girando ? "girando" : hecha ? "detenida" : "lista"} data-premio={hecha && jugada.premio !== null ? jugada.premio : undefined}>
      <div className="mk-m-ruleta-zona" ref={zona} data-girando={puede ? undefined : ""} onPointerDown={alBajar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}>
        <i className="mk-m-ruleta-sombra" aria-hidden="true" />
        <div className="mk-m-ruleta-rueda" ref={rueda} aria-hidden="true" style={{ background: fondo, "--mk-r-letra": n > 8 ? "3.9cqw" : n > 5 ? "4.6cqw" : "5.2cqw" } as CSSProperties}>
          {lista.map((p, i) => (
            <div key={i} className="mk-m-ruleta-rotulo" style={{ rotate: `${(i + 0.5) * paso}deg`, color: sobre(i) }}>
              <span style={{ "--mk-r-largo": p.texto.length } as CSSProperties}>{p.texto}</span>
            </div>
          ))}
          {lista.map((_, i) => <i key={i} className="mk-m-ruleta-clavo" style={{ rotate: `${i * paso}deg` }} />)}
          <i className="mk-m-ruleta-velo" data-ve={destaca === null ? undefined : ""} style={{ background: `conic-gradient(#0000 ${paso}deg,color-mix(in srgb,var(--mk-m-superficie) 64%,#0000) 0)`, rotate: `${(destaca ?? 0) * paso}deg` }} />
        </div>
        {nivel === "completo" && [0, 1].map((i) => <i key={i} className="mk-m-ruleta-estela" aria-hidden="true" ref={(e) => { estela.current[i] = e; }} style={{ background: fondo }} />)}
        <i className="mk-m-ruleta-luz" aria-hidden="true" />
        <i className="mk-m-ruleta-eje" aria-hidden="true" />
        <div className="mk-m-ruleta-lengueta" ref={lengueta} aria-hidden="true" />
        {hecha && jugada.premio !== null && nivel === "completo" && celebracion !== "nada" &&
          (celebracion === "fuegos" ? (
            <Limite siFalla={null}>
              <Suspense fallback={null}><Fuegos semilla={numeroDe(semilla) + vez} /></Suspense>
            </Limite>
          ) : (
            <Confeti semilla={numeroDe(semilla) + vez} />
          ))}
      </div>
      {/* Los premios, también como una lista de verdad (la rueda es un dibujo). */}
      <ul className="mk-m-lector" data-premios="">
        {lista.map((p, i) => <li key={i}>{p.texto}</li>)}
      </ul>
      <button type="button" className="mk-m-boton" data-girar="" aria-disabled={puede ? undefined : true} onClick={() => puede && lanzar(IMPULSO_BOTON)}>
        {nivel === "quieto" ? "Ver premio" : "Girar"}
      </button>
      <p className="mk-m-ruleta-resultado" data-resultado="" aria-live="polite">
        {!hecha ? "" : jugada.texto ? `Premio: ${jugada.texto}` : "La ruleta se detuvo, pero no se pudo saber el premio."}
      </p>
    </div>
  );
}
