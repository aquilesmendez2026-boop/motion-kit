// Carrusel giratorio: fichas con foto puestas en un anillo que gira con el dedo, con impulso, y se detiene justo en
// una. También con botones y con las flechas del teclado. En liviano, quieto, sin 3D o con menos de tres fichas es
// una fila que se desliza (scroll del navegador). Todas las fichas están siempre en la página y se pueden leer.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { useStyles } from "../utils/styles";
import { pasoResorte } from "../dedo/resorte";
import { useMomento, type ComunesMomento } from "./base";
import { alFrente, dondeSeDetiene, haciaFicha, limpiarFichas, pasoAnillo, puestosAnillo, radioAnillo, type Ficha } from "./calculo-carrusel";

export interface CarruselGiratorioProps extends ComunesMomento {
  /** Las fichas: una foto, un título o los dos. Se usan las primeras doce. */
  fichas: { url?: string; alt?: string; titulo?: string; pie?: string; precio?: string; href?: string; agotado?: boolean }[];
  /** El nombre del carrusel para lectores de pantalla. */
  etiqueta?: string;
}

/** Cuántos px tiene que moverse el dedo para que sea un arrastre y no un toque. */
const HOLGURA = 6;
/** El aire entre una ficha y la siguiente, en px. */
const AIRE = 16;

export const CSS_CARRUSEL =
  // `width:100%`: con `container-type`, dentro de una fila o una grilla de ancho libre la pieza quedaría de ancho cero.
  ".mk-m-carrusel{container-type:inline-size;width:100%;box-sizing:border-box;overflow:hidden;overflow:clip;padding:.25rem 0}" +
  // El ancho de la ficha sale del ancho del carrusel (`cqi`); donde no hay medidas de contenedor (Safari antes de la 16), de la pantalla.
  ".mk-m-carrusel-escena,.mk-m-carrusel-fila{--mk-c-ancho:min(58vw,250px)}" +
  "@supports (width:1cqi){.mk-m-carrusel-escena,.mk-m-carrusel-fila{--mk-c-ancho:clamp(160px,58cqi,250px)}}" +
  ".mk-m-carrusel-escena{display:grid;place-items:center;perspective:1100px;padding:12px 0;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none}" +
  ".mk-m-carrusel-escena[data-arrastrando]{cursor:grabbing}" +
  ".mk-m-carrusel-anillo{list-style:none;margin:0;padding:0;position:relative;width:var(--mk-c-ancho);height:calc(var(--mk-c-ancho)*1.32);transform-style:preserve-3d;will-change:transform}" +
  ".mk-m-carrusel-anillo>li{position:absolute;inset:0;transform:rotateY(var(--giro)) translateZ(var(--radio));backface-visibility:hidden;-webkit-backface-visibility:hidden}" +
  ".mk-m-carrusel-anillo>li:not([data-frente]) .mk-m-carrusel-ficha{opacity:.62}" +
  ".mk-m-carrusel[data-nivel=completo] .mk-m-carrusel-ficha{transition:opacity .25s linear}" +
  ".mk-m-carrusel-ficha{position:relative;display:flex;flex-direction:column;height:100%;box-sizing:border-box;border-radius:16px;overflow:hidden;background:var(--mk-m-superficie);color:var(--mk-m-texto);" +
  "text-decoration:none;border:1px solid color-mix(in srgb,var(--mk-m-texto) 14%,transparent);box-shadow:0 18px 34px -22px rgba(0,0,0,.6)}" +
  ".mk-m-carrusel-ficha:focus-visible{outline:3px solid var(--mk-m-acento);outline-offset:3px}" +
  ".mk-m-carrusel-ficha img{display:block;width:100%;flex:1 1 0;min-height:0;object-fit:cover;pointer-events:none;-webkit-user-drag:none}" +
  ".mk-m-carrusel-texto{display:grid;gap:.15rem;padding:.7rem .85rem .8rem}" +
  ".mk-m-carrusel-ficha[data-sin-foto] .mk-m-carrusel-texto{margin:auto 0;text-align:center;padding:1rem}" +
  ".mk-m-carrusel-titulo{font-weight:700;font-size:1.02rem;line-height:1.2;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
  ".mk-m-carrusel-pie{font-size:.86rem;color:var(--mk-m-suave);overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
  ".mk-m-carrusel-precio{font-weight:700;color:var(--mk-m-acento)}" +
  ".mk-m-carrusel-ficha[data-agotado] .mk-m-carrusel-precio{color:var(--mk-m-suave);text-decoration:line-through}" +
  ".mk-m-carrusel-agotado{position:absolute;top:10px;left:10px;padding:.15rem .6rem;border-radius:999px;background:var(--mk-m-texto);color:var(--mk-m-superficie);font-size:.78rem;font-weight:700}" +
  ".mk-m-carrusel-mando{display:flex;align-items:center;justify-content:center;gap:.75rem;margin-top:.25rem}" +
  ".mk-m-carrusel-mando .mk-m-boton{padding:0;font-size:1.3rem;line-height:1}" +
  ".mk-m-carrusel-puntos{display:flex;gap:6px}" +
  ".mk-m-carrusel-puntos i{width:8px;height:8px;border-radius:50%;background:var(--mk-m-suave);opacity:.5}" +
  ".mk-m-carrusel-puntos i[data-actual]{background:var(--mk-m-acento);opacity:1}" +
  // La fila: lo que se ve sin anillo. La mueve el navegador.
  ".mk-m-carrusel-fila{list-style:none;margin:0;padding:12px 8px;display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain}" +
  ".mk-m-carrusel-fila>li{flex:0 0 var(--mk-c-ancho);height:calc(var(--mk-c-ancho)*1.32);scroll-snap-align:center}";

/** Una ficha: su foto (si carga), su título, su pie y su precio. Es un enlace si lleva `href`. */
function Tarjeta({ ficha, foco, alApretar }: { ficha: Ficha; foco: boolean; alApretar?: (ev: MouseEvent) => void }) {
  const [caida, setCaida] = useState(false);
  const conFoto = Boolean(ficha.url) && !caida;
  const adentro = (
    <>
      {conFoto && <img src={ficha.url} alt={ficha.alt ?? ficha.titulo ?? ""} loading="lazy" decoding="async" draggable={false} onError={() => setCaida(true)} />}
      {ficha.agotado && <span className="mk-m-carrusel-agotado">Agotado</span>}
      {(ficha.titulo || ficha.pie || ficha.precio) && (
        <span className="mk-m-carrusel-texto">
          {ficha.titulo && <span className="mk-m-carrusel-titulo">{ficha.titulo}</span>}
          {ficha.pie && <span className="mk-m-carrusel-pie">{ficha.pie}</span>}
          {ficha.precio && <span className="mk-m-carrusel-precio">{ficha.precio}</span>}
        </span>
      )}
    </>
  );
  const comunes = { className: "mk-m-carrusel-ficha", "data-sin-foto": conFoto ? undefined : "", "data-agotado": ficha.agotado ? "" : undefined, onClick: alApretar };
  return ficha.href ? (
    <a {...comunes} href={ficha.href} tabIndex={foco ? 0 : -1} draggable={false}>{adentro}</a>
  ) : (
    <div {...comunes}>{adentro}</div>
  );
}

export default function CarruselGiratorio({ fichas, etiqueta = "Carrusel", nivel: forzado, ahorro, className }: CarruselGiratorioProps) {
  useStyles("momento-carrusel", CSS_CARRUSEL);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  // Las fichas llegan como un arreglo nuevo en cada dibujo: se comparan por su contenido.
  const clave = JSON.stringify(limpiarFichas(fichas));
  const limpias = useMemo(() => JSON.parse(clave) as Ficha[], [clave]);
  const n = limpias.length;
  const puestos = puestosAnillo(n);
  const paso = pasoAnillo(puestos);
  const [con3d] = useState(() => typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("transform-style", "preserve-3d"));
  const anillo = nivel === "completo" && puestos > 0 && con3d;

  const raiz = useRef<HTMLDivElement | null>(null);
  const aro = useRef<HTMLUListElement>(null);
  const fila = useRef<HTMLUListElement>(null);
  const [radio, setRadio] = useState(0);
  /** El puesto que está al frente, y lo que se dice a los lectores (solo cuando el anillo se detiene). */
  const [frente, setFrente] = useState(0);
  const [dicho, setDicho] = useState("");
  /** Cuenta las veces que el anillo se detuvo con el foco en una ficha: ahí el foco pasa a la del frente. */
  const [conFoco, setConFoco] = useState(0);
  /** Lo que mueve al anillo. Vive fuera de React: cambia en cada cuadro. */
  const motor = useRef({
    angulo: 0,
    velocidad: 0,
    meta: 0,
    cuadro: 0,
    antes: 0,
    radio: 0,
    entro: false,
    arrastre: null as null | { id: number; x: number; y: number; ancho: number; angulo: number; movido: boolean; muestras: { t: number; a: number }[] },
    /** El último gesto fue un arrastre: el clic que le sigue no cuenta. */
    arrastro: false,
    /** Alguien ya movió el carrusel: desde ahí se dice a los lectores dónde quedó (la entrada sola no se anuncia). */
    anunciar: false,
    /** El foco estaba en una ficha cuando empezó a girar: al detenerse pasa a la del frente. */
    focoPendiente: false,
  });

  const pintar = () => {
    const m = motor.current;
    if (aro.current) aro.current.style.transform = `translateZ(${-m.radio}px) rotateY(${m.angulo.toFixed(2)}deg)`;
  };
  const alLlegar = () => {
    const m = motor.current;
    const i = alFrente(m.angulo, puestos);
    setFrente(i);
    const ficha = limpias[i % n];
    if (m.anunciar) setDicho(`Ficha ${(i % n) + 1} de ${n}${ficha?.titulo ? `: ${ficha.titulo}` : ""}`);
    raiz.current?.setAttribute("data-angulo", String(Math.round(m.angulo)));
    // Si el foco estaba en una ficha, pasa a la que ahora está al frente (lo que se aprieta no queda de lado).
    if (m.focoPendiente || aro.current?.contains(document.activeElement)) setConFoco((v) => v + 1);
    m.focoPendiente = false;
  };
  /**
   * Alguien mueve el carrusel. Si el foco está en una ficha, mientras gira pasa al carrusel mismo: la ficha puede
   * quedar de lado o volverse una copia, y el foco no puede quedar en algo escondido.
   */
  const alMoverlo = () => {
    const m = motor.current;
    m.anunciar = true;
    if (!aro.current?.contains(document.activeElement)) return;
    m.focoPendiente = true;
    raiz.current?.focus({ preventScroll: true });
  };
  const correr = () => {
    const m = motor.current;
    if (m.cuadro || typeof requestAnimationFrame === "undefined") return;
    m.antes = 0;
    const tic = (t: number) => {
      m.cuadro = 0;
      const dt = m.antes ? Math.min(0.05, (t - m.antes) / 1000) : 1 / 60;
      m.antes = t;
      const e = pasoResorte({ x: m.angulo, v: m.velocidad }, m.meta, dt, 110, 19);
      m.angulo = e.x;
      m.velocidad = e.v;
      const llego = Math.abs(m.angulo - m.meta) < 0.08 && Math.abs(m.velocidad) < 3;
      if (llego) {
        m.angulo = m.meta;
        m.velocidad = 0;
      }
      pintar();
      const i = alFrente(m.angulo, puestos);
      setFrente((antes) => (antes === i ? antes : i));
      if (llego) alLlegar();
      else m.cuadro = requestAnimationFrame(tic);
    };
    m.cuadro = requestAnimationFrame(tic);
  };
  /** Gira hasta dejar un puesto al frente, por el lado corto. */
  const irA = (puesto: number) => {
    const m = motor.current;
    alMoverlo();
    m.meta = haciaFicha(((puesto % puestos) + puestos) % puestos, m.meta, puestos);
    correr();
  };
  const mover = (cuanto: number) => {
    if (anillo) {
      const m = motor.current;
      alMoverlo();
      m.meta = Math.round(m.meta / paso) * paso - cuanto * paso;
      correr();
      return;
    }
    const f = fila.current;
    const una = f?.firstElementChild?.getBoundingClientRect().width ?? 0;
    f?.scrollBy({ left: cuanto * (una + AIRE), behavior: nivel === "quieto" ? "auto" : "smooth" });
  };

  // El anillo: su radio sale del ancho real de una ficha. Si cambian las fichas, vuelve a la primera.
  useLayoutEffect(() => {
    const m = motor.current;
    const a = aro.current;
    if (!anillo || !a) return;
    if (m.entro) {
      m.angulo = m.meta = m.velocidad = 0;
      setFrente(0);
    }
    const medir = () => {
      const r = radioAnillo(a.offsetWidth, puestos, AIRE);
      m.radio = r;
      setRadio(r);
      pintar();
    };
    const tamano = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    tamano?.observe(a);
    medir();
    return () => {
      tamano?.disconnect();
      cancelAnimationFrame(m.cuadro);
      m.cuadro = 0;
      m.arrastre = null;
    };
    // `pintar` lee de referencias: no cambia lo que hace entre dibujos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anillo, puestos]);
  // La primera vez que se ve, llega girando desde una ficha más allá.
  useLayoutEffect(() => {
    const m = motor.current;
    if (!anillo) return;
    if (m.entro) {
      // Ya entró: si quedó a medio camino (el modo estricto de React corta el giro), lo termina.
      if (m.angulo !== m.meta && !m.cuadro && !m.arrastre) correr();
      return;
    }
    m.angulo = paso;
    m.meta = 0;
    pintar();
    if (!activo) return;
    m.entro = true;
    correr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anillo, activo, puestos]);
  useEffect(() => {
    if (conFoco) (aro.current?.querySelector<HTMLElement>("li[data-frente] a[href]") ?? raiz.current)?.focus({ preventScroll: true });
  }, [conFoco]);
  const pegar = useCallback(
    (el: HTMLDivElement | null) => {
      raiz.current = el;
      ref(el);
    },
    [ref],
  );

  if (!n) return null;

  const alBajar = (ev: PointerEvent<HTMLDivElement>) => {
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    const m = motor.current;
    cancelAnimationFrame(m.cuadro);
    m.cuadro = 0;
    m.velocidad = 0;
    m.arrastro = false;
    // El ancho de la ficha se mide una vez, al empezar: no en cada movimiento.
    m.arrastre = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, ancho: (aro.current?.offsetWidth ?? 200) + AIRE, angulo: m.angulo, movido: false, muestras: [] };
  };
  const alMover = (ev: PointerEvent<HTMLDivElement>) => {
    const m = motor.current;
    const g = m.arrastre;
    if (!g || g.id !== ev.pointerId) return;
    const dx = ev.clientX - g.x;
    if (!g.movido) {
      // Cuenta el movimiento en cualquier dirección: mover el cursor hacia abajo sobre un enlace tampoco es un clic.
      if (Math.hypot(dx, ev.clientY - g.y) <= HOLGURA) return;
      g.movido = true;
      m.arrastro = true;
      alMoverlo();
      try {
        ev.currentTarget.setPointerCapture?.(ev.pointerId);
      } catch {
        /* el puntero ya se soltó: se sigue sin capturarlo */
      }
      ev.currentTarget.setAttribute("data-arrastrando", "");
    }
    // Mover el dedo el ancho de una ficha gira un puesto.
    m.angulo = g.angulo + (dx / g.ancho) * paso;
    const t = performance.now();
    g.muestras.push({ t, a: m.angulo });
    while (g.muestras.length > 2 && t - g.muestras[0].t > 110) g.muestras.shift();
    pintar();
    const i = alFrente(m.angulo, puestos);
    setFrente((antes) => (antes === i ? antes : i));
  };
  const soltar = (ev: PointerEvent<HTMLDivElement>, conImpulso: boolean) => {
    const m = motor.current;
    const g = m.arrastre;
    if (!g || g.id !== ev.pointerId) return;
    m.arrastre = null;
    ev.currentTarget.removeAttribute("data-arrastrando");
    if (!g.movido) {
      // Fue un toque: el anillo sigue hacia donde iba (o se queda).
      if (m.angulo !== m.meta) correr();
      return;
    }
    // Con el mouse, el clic que sigue a este arrastre llega ahora mismo y no cuenta. Con el dedo no llega ninguno: la
    // guarda se suelta sola, para no tragarse el próximo Enter o la activación de un lector de pantalla.
    window.setTimeout(() => (m.arrastro = false), 0);
    const [a, b] = [g.muestras[0], g.muestras[g.muestras.length - 1]];
    const velocidad = conImpulso && a && b && b.t > a.t ? ((b.a - a.a) / (b.t - a.t)) * 1000 : 0;
    m.velocidad = velocidad;
    m.meta = dondeSeDetiene(m.angulo, velocidad, puestos);
    correr();
  };
  const alTeclear = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
    ev.preventDefault();
    mover(ev.key === "ArrowRight" ? 1 : -1);
  };
  /** Un clic que viene de un arrastre no cuenta. */
  const alClicCapturado = (ev: MouseEvent<HTMLDivElement>) => {
    if (!motor.current.arrastro) return;
    motor.current.arrastro = false;
    // `detail` en 0: no viene de un puntero (teclado o lector de pantalla). Ese siempre cuenta.
    if (ev.detail === 0) return;
    ev.preventDefault();
    ev.stopPropagation();
  };
  const comunes = {
    ref: pegar,
    className: ["mk-momento mk-m-carrusel", className].filter(Boolean).join(" "),
    "data-momento": "carrusel",
    "data-nivel": nivel,
    "data-activo": activo ? "" : undefined,
    role: "region",
    "aria-roledescription": "carrusel",
    "aria-label": etiqueta,
    tabIndex: -1,
    onKeyDown: alTeclear,
  };
  const mando = n > 1 && (
    <div className="mk-m-carrusel-mando">
      <button type="button" className="mk-m-boton" data-ir="antes" aria-label="Anterior" onClick={() => mover(-1)}>‹</button>
      {anillo && (
        <span className="mk-m-carrusel-puntos" aria-hidden="true">
          {limpias.map((_, i) => <i key={i} data-actual={i === frente % n ? "" : undefined} />)}
        </span>
      )}
      <button type="button" className="mk-m-boton" data-ir="despues" aria-label="Siguiente" onClick={() => mover(1)}>›</button>
    </div>
  );

  if (!anillo) {
    return (
      <div {...comunes} data-modo="fila">
        <ul className="mk-m-carrusel-fila" ref={fila}>
          {limpias.map((f, i) => (
            <li key={`${i}|${f.url ?? ""}`} data-ficha={i}><Tarjeta ficha={f} foco /></li>
          ))}
        </ul>
        {mando}
      </div>
    );
  }
  return (
    <div {...comunes} data-modo="anillo">
      <div className="mk-m-carrusel-escena" onPointerDown={alBajar} onPointerMove={alMover} onPointerUp={(ev) => soltar(ev, true)} onPointerCancel={(ev) => soltar(ev, false)} onClickCapture={alClicCapturado}>
        <ul className="mk-m-carrusel-anillo" ref={aro} style={{ "--radio": `${radio}px` } as CSSProperties}>
          {Array.from({ length: puestos }, (_, i) => {
            // Con pocas fichas el anillo las repite. Para lectores cada ficha va una sola vez: cuentan las del tramo
            // donde está la del frente; las otras son copias.
            const copia = Math.floor(i / n) !== Math.floor(frente / n);
            const alFrenteEste = i === frente;
            return (
              <li key={`${i}|${limpias[i % n].url ?? ""}`} data-ficha={i % n} data-copia={copia ? "" : undefined} data-frente={alFrenteEste ? "" : undefined} aria-hidden={copia ? true : undefined} aria-current={alFrenteEste ? true : undefined} style={{ "--giro": `${i * paso}deg` } as CSSProperties}>
                <Tarjeta
                  ficha={limpias[i % n]}
                  foco={alFrenteEste}
                  alApretar={(ev) => {
                    // Tocar una ficha que está de lado la trae al frente: no abre su enlace.
                    if (alFrenteEste && alFrente(motor.current.meta, puestos) === i) return;
                    ev.preventDefault();
                    irA(i);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </div>
      {mando}
      <p className="mk-m-lector" aria-live="polite" data-dicho="">{dicho}</p>
    </div>
  );
}
