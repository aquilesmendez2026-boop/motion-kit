// Cupón que se arranca: el código va bajo una franja con línea de puntos. Se tira de la lengüeta con el dedo y la
// franja se corta hasta donde va; lo cortado cuelga y se enrosca. Pasado el 85 % se suelta y cae, y el código queda a
// la vista (como texto). Quien no arrastra tiene el botón «Ver código».
// Todo lo que se mueve son ventanas que recortan y que se corren o se giran (`translate`, `rotate`) y `opacity`.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { alAcabar } from "./al-acabar";
import { vibrar } from "../estilos/sonidos";
import { useMomento, type ComunesMomento } from "./base";
import { SE_SUELTA, cortado, dientesCortados, limpiarCupon, tramosColgando, vencio } from "./calculo-cupon";

export interface CuponQueSeArrancaProps extends ComunesMomento {
  /** La oferta («2×1 en cafés»). */
  titulo: string;
  detalle?: string;
  /** Lo que queda a la vista al arrancar la franja. */
  codigo: string;
  /** Hasta qué día vale (`AAAA-MM-DD`, inclusive). Vencido, no se arranca. */
  vence?: string;
  /** Un golpecito por cada diente que se corta (donde el teléfono vibra). Por defecto, sí. */
  vibracion?: boolean;
  /** Se llama una vez, cuando el código queda a la vista. */
  alArrancar?: () => void;
}

/** La línea de puntos: una fila de perforaciones arriba y otra abajo. */
const PUNTOS = "radial-gradient(circle,var(--mk-m-fondo-cupon) 2.2px,transparent 2.6px)";
export const CSS_CUPON =
  // `width:100%`: con `container-type`, dentro de una fila o una grilla de ancho libre la pieza quedaría de ancho cero.
  ".mk-m-cupon{width:100%;max-width:420px;box-sizing:border-box}" +
  ".mk-m-cupon-papel{position:relative;padding:1.1rem 1.1rem 1rem;border-radius:14px;background:var(--mk-m-superficie);color:var(--mk-m-texto);" +
  "border:1px solid color-mix(in srgb,var(--mk-m-texto) 14%,transparent);box-shadow:calc(var(--mk-l0x,-.45)*-10px) calc(var(--mk-l0y,-.8)*-14px) 26px -16px rgba(0,0,0,.5)}" +
  ".mk-m-cupon-titulo{margin:0;font-size:1.35rem;font-weight:800;line-height:1.15;overflow-wrap:anywhere}" +
  ".mk-m-cupon-detalle{margin:.25rem 0 0;color:var(--mk-m-suave);overflow-wrap:anywhere}" +
  ".mk-m-cupon-vence{margin:.35rem 0 0;font-size:.85rem;color:var(--mk-m-suave)}" +
  // La franja cruza el cupón de lado a lado. Debajo, el hueco donde aparece el código.
  ".mk-m-cupon-franja{position:relative;container-type:inline-size;height:60px;margin:.9rem -1.1rem .85rem;--mk-m-fondo-cupon:color-mix(in srgb,var(--mk-m-texto) 9%,var(--mk-m-superficie))}" +
  ".mk-m-cupon-hueco{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:.75rem;padding:0 .9rem;background:var(--mk-m-fondo-cupon)}" +
  ".mk-m-cupon-hueco strong{font-size:1.25rem;letter-spacing:.12em;overflow-wrap:anywhere;animation:mk-m-cupon-llega .35s ease-out both}" +
  ".mk-m-cupon-hueco .mk-m-boton{min-height:44px;animation:mk-m-cupon-llega .35s ease-out both}" +
  "@keyframes mk-m-cupon-llega{from{opacity:0}}" +
  // La tira: `--mk-cp-a` es cuánto va cortada (0 a 1), `--mk-cp-g` el giro de cada tramo que cuelga y `--mk-cp-b` cuánto baja.
  ".mk-m-cupon-tira{position:absolute;inset:0;--mk-cp-a:0;--mk-cp-g:0;--mk-cp-b:0}" +
  ".mk-m-cupon-pegada,.mk-m-cupon-ventana{position:absolute;inset:0;overflow:hidden;overflow:clip}" +
  // Lo que sigue pegado: una ventana cuyo borde izquierdo avanza con el corte; su contenido se corre al revés y no se mueve.
  ".mk-m-cupon-pegada{translate:calc(var(--mk-cp-a)*100%) 0}" +
  ".mk-m-cupon-pegada>.mk-m-cupon-cara{translate:calc(var(--mk-cp-a)*-100%) 0}" +
  ".mk-m-cupon-cara{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 3.6rem;box-sizing:border-box;font-weight:700;font-size:.95rem;text-align:center;white-space:nowrap;" +
  `color:var(--mk-m-sobre);background:${PUNTOS} 0 0/12px 7px repeat-x,${PUNTOS} 0 100%/12px 7px repeat-x,var(--mk-m-acento)}` +
  // Lo cortado: una cadena de cuatro tramos anclada en el punto de corte. Cada tramo gira un poco más que el anterior.
  ".mk-m-cupon-cuelga{position:absolute;inset:0;pointer-events:none;translate:calc((var(--mk-cp-a) - 1)*100%) 0;" +
  "filter:drop-shadow(calc(var(--mk-l0x,-.45)*-5px) calc(var(--mk-l0y,-.8)*-8px) 5px rgba(0,0,0,.32))}" +
  ".mk-m-cupon-tramo{position:absolute;top:0;right:100%;width:100%;height:100%;transform-origin:100% 0;rotate:calc(var(--mk-cp-g)*-1deg);translate:0 calc(var(--mk-cp-b)*1px)}" +
  ".mk-m-cupon-cuelga>.mk-m-cupon-tramo{right:0;width:25%}" +
  ".mk-m-cupon-ventana>.mk-m-cupon-cara{inset:0 auto 0 0;width:400%;translate:calc(var(--k)*25% - var(--mk-cp-a)*100%) 0}" +
  // La lengüeta: de donde se tira. Va en el frente del corte. Deja pasar el scroll vertical.
  ".mk-m-cupon-lengueta{position:absolute;left:0;top:50%;width:52px;height:52px;margin-top:-26px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;" +
  "background:var(--mk-m-superficie);color:var(--mk-m-acento);font:inherit;font-size:1.3rem;font-weight:800;cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none;" +
  "translate:calc(var(--mk-cp-a)*(100cqi - 52px)) 0;box-shadow:0 2px 8px -2px rgba(0,0,0,.45)}" +
  ".mk-m-cupon-lengueta:active{cursor:grabbing}" +
  // Al soltarse, la tira cae.
  ".mk-m-cupon-tira[data-cae]{animation:mk-m-cupon-cae .55s cubic-bezier(.5,0,.9,.5) both}" +
  "@keyframes mk-m-cupon-cae{to{translate:10% 190%;rotate:-16deg;opacity:0}}" +
  ".mk-m-cupon[data-nivel=liviano] .mk-m-cupon-tira[data-cae]{animation:mk-m-cupon-funde .25s linear both}" +
  "@keyframes mk-m-cupon-funde{to{opacity:0}}" +
  ".mk-m-cupon-pie{display:flex;justify-content:center}" +
  ".mk-m-cupon[data-estado=vencido] .mk-m-cupon-papel{filter:grayscale(1)}" +
  ".mk-m-cupon[data-estado=vencido] .mk-m-cupon-franja{opacity:.45}";

/** `AAAA-MM-DD` dicho como se dice en Chile: 31-12-2026. */
const fechaCorta = (f: string) => f.split("-").reverse().join("-");

export default function CuponQueSeArranca({ titulo, detalle, codigo, vence, vibracion = true, alArrancar, nivel: forzado, ahorro, className }: CuponQueSeArrancaProps) {
  useStyles("momento-cupon", CSS_CUPON);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const cupon = limpiarCupon({ titulo, detalle, codigo, vence });
  const quieto = nivel === "quieto";
  const [abierto, setAbierto] = useState(false);
  const [cae, setCae] = useState(false);
  const [dicho, setDicho] = useState("");
  // Si venció se mira después de montar: el servidor no sabe qué día es en el teléfono. Hasta saberlo (`null`), el
  // código no se dibuja: el de un cupón vencido no llega a la página ni un instante.
  const [vencido, setVencido] = useState<boolean | null>(null);
  useEffect(() => setVencido(vencio(cupon?.vence, new Date())), [cupon?.vence]);
  const vigente = vencido === false;

  const tira = useRef<HTMLDivElement>(null);
  /** Lo que va del gesto. Vive fuera de React: cambia en cada movimiento. */
  const gesto = useRef({ avance: 0, dientes: 0, id: -1, movido: false, cuadro: 0 });
  const avisado = useRef(false);
  const botonVer = useRef<HTMLButtonElement>(null);
  const botonCopiar = useRef<HTMLButtonElement>(null);
  /** Si al abrirse el foco estaba en «Ver código» (que desaparece): hay que pasarlo a «Copiar». */
  const enfocar = useRef(false);
  const anuncio = useRef(0);
  const alCaer = useRef(() => {});
  useEffect(() => () => {
    cancelAnimationFrame(gesto.current.cuadro);
    window.clearTimeout(anuncio.current);
  }, []);
  // La tira cae y, cuando termina, queda el código. No se espera el aviso del navegador a ciegas: con «reducir
  // movimiento» la caída no corre.
  useEffect(() => {
    const el = tira.current;
    if (!cae || !el) return;
    return alAcabar(el, "animation", () => alCaer.current());
  }, [cae]);
  useEffect(() => {
    if (!abierto || !enfocar.current) return;
    enfocar.current = false;
    botonCopiar.current?.focus();
  }, [abierto]);
  // En quieto el código está a la vista desde el principio: se avisa una vez, al mostrarlo.
  useEffect(() => {
    if (!quieto || !vigente || !cupon || avisado.current) return;
    avisado.current = true;
    alArrancar?.();
  }, [quieto, vigente]);

  if (!cupon) return null;
  const visto = abierto || quieto;

  /** Deja la tira cortada hasta `a` (de 0 a 1). El papel no se vuelve a pegar: solo avanza. */
  const cortarHasta = (a: number) => {
    const g = gesto.current;
    if (!(a > g.avance)) return;
    g.avance = a;
    const dientes = dientesCortados(a);
    if (dientes > g.dientes && vibracion) vibrar(6);
    g.dientes = dientes;
    const el = tira.current;
    if (!el) return;
    const [primero] = tramosColgando(a);
    el.style.setProperty("--mk-cp-a", String(Math.round(a * 1000) / 1000));
    el.style.setProperty("--mk-cp-g", String(primero.giro));
    el.style.setProperty("--mk-cp-b", String(primero.baja));
  };
  const mostrar = () => {
    enfocar.current = botonVer.current !== null && document.activeElement === botonVer.current;
    setAbierto(true);
    setCae(false);
    setDicho(`Código: ${cupon.codigo}`);
    if (!avisado.current) {
      avisado.current = true;
      alArrancar?.();
    }
  };
  alCaer.current = mostrar;
  /** Dice algo a los lectores de pantalla, aunque sea lo mismo de recién (un segundo «Copiar»). */
  const decir = (texto: string) => {
    setDicho("");
    window.clearTimeout(anuncio.current);
    anuncio.current = window.setTimeout(() => setDicho(texto), 60);
  };
  /** Termina de cortar (suave) y deja caer la tira. */
  const soltar = () => {
    const g = gesto.current;
    if (cae || abierto || !vigente) return;
    if (nivel !== "completo") return setCae(true);
    cancelAnimationFrame(g.cuadro);
    const desde = g.avance;
    const t0 = performance.now();
    const dura = 120 + (1 - desde) * 420;
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / dura);
      cortarHasta(desde + (1 - desde) * k);
      if (k < 1) g.cuadro = requestAnimationFrame(paso);
      else setCae(true);
    };
    g.cuadro = requestAnimationFrame(paso);
  };

  const alBajar = (ev: PointerEvent<HTMLButtonElement>) => {
    if (cae || abierto || !vigente || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    gesto.current.id = ev.pointerId;
    gesto.current.movido = false;
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
  };
  const alMover = (ev: PointerEvent<HTMLButtonElement>) => {
    const g = gesto.current;
    const el = tira.current;
    if (g.id !== ev.pointerId || !el || nivel !== "completo") return;
    const caja = el.getBoundingClientRect();
    g.movido = true;
    cortarHasta(cortado(ev.clientX - caja.left, caja.width));
    if (g.avance >= SE_SUELTA) {
      g.id = -1;
      soltar();
    }
  };
  const alSoltar = (ev: PointerEvent<HTMLButtonElement>) => {
    const g = gesto.current;
    if (g.id !== ev.pointerId) return;
    g.id = -1;
    // Un toque sin arrastrar (o en un nivel sin arrastre) también la arranca.
    if (ev.type === "pointerup" && (!g.movido || nivel !== "completo")) soltar();
  };

  const cara: ReactNode = (
    <div className="mk-m-cupon-cara">
      <span>{vencido ? "Vencido" : "Tira para ver tu código"}</span>
    </div>
  );
  /** Los cuatro tramos de lo que cuelga, uno adentro del otro. */
  const tramo = (k: number): ReactNode =>
    k > 4 ? null : (
      <div className="mk-m-cupon-tramo">
        <div className="mk-m-cupon-ventana" style={{ "--k": k } as CSSProperties}>{cara}</div>
        {tramo(k + 1)}
      </div>
    );

  return (
    <div ref={ref} className={`mk-momento mk-m-cupon${className ? ` ${className}` : ""}`} data-momento="cupon" data-nivel={nivel} data-activo={activo ? "" : undefined} data-estado={vencido ? "vencido" : visto ? "abierto" : cae ? "cayendo" : "cerrado"}>
      <div className="mk-m-cupon-papel">
        {cupon.titulo && <p className="mk-m-cupon-titulo">{cupon.titulo}</p>}
        {cupon.detalle && <p className="mk-m-cupon-detalle">{cupon.detalle}</p>}
        {cupon.vence && <p className="mk-m-cupon-vence" data-vence="">{vencido ? `Venció el ${fechaCorta(cupon.vence)}` : `Vale hasta el ${fechaCorta(cupon.vence)}`}</p>}
        <div className="mk-m-cupon-franja">
          <div className="mk-m-cupon-hueco">
            {/* El código no está en la página hasta que se arranca la franja. */}
            {visto && vigente && (
              <>
                <strong data-codigo="">{cupon.codigo}</strong>
                <button
                  type="button"
                  className="mk-m-boton"
                  data-copiar=""
                  ref={botonCopiar}
                  onClick={() => {
                    const copia = navigator.clipboard?.writeText(cupon.codigo);
                    if (copia) copia.then(() => decir("Código copiado"), () => decir(`No se pudo copiar. El código es ${cupon.codigo}`));
                    else decir(`El código es ${cupon.codigo}`);
                  }}
                >
                  Copiar
                </button>
              </>
            )}
          </div>
          {!visto && (
            <div className="mk-m-cupon-tira" ref={tira} aria-hidden="true" data-cae={cae ? "" : undefined}>
              <div className="mk-m-cupon-pegada">{cara}</div>
              {nivel === "completo" && <div className="mk-m-cupon-cuelga">{tramo(1)}</div>}
              {vigente && (
                <button type="button" className="mk-m-cupon-lengueta" tabIndex={-1} data-lengueta="" onPointerDown={alBajar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}>
                  ›
                </button>
              )}
            </div>
          )}
        </div>
        {!visto && vigente && (
          <div className="mk-m-cupon-pie">
            <button type="button" className="mk-m-boton" data-ver="" ref={botonVer} onClick={soltar}>Ver código</button>
          </div>
        )}
      </div>
      <p className="mk-m-lector" aria-live="polite" data-dicho="">{dicho}</p>
    </div>
  );
}
