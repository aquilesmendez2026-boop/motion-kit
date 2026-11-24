// Libro que se abre: la carta de precios como un libro. La tapa se abre sola una vez al verse y las hojas se pasan con
// botones, con las flechas del teclado o tocando la página. En pantalla ancha se ven dos páginas; en angosta, una.
// En liviano, quieto o sin 3D es la carta plana. Todo el texto está siempre en la página: el 3D es solo cómo se ve.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { apilado, carasLibro, estadoLibro, limpiarHojas, maxVueltas, vueltasAlCambiar, type Hoja } from "./calculo-libro";

export interface LibroQueSeAbreProps extends ComunesMomento {
  tapa: { titulo: string; bajada?: string; imagen?: string };
  /** Una hoja por grupo de la carta. Un grupo con más de diez líneas sigue en la hoja siguiente. */
  hojas: { titulo: string; lineas: { texto: string; detalle?: string; precio?: string; agotado?: boolean }[] }[];
}

/** Desde este ancho del bloque (px) el libro se abre en dos páginas. */
const ANCHO_DOBLE = 620;
/** Cuánto espera la tapa antes de abrirse sola, en ms: primero se ve el libro cerrado. */
const ESPERA = 450;

export const CSS_LIBRO =
  // `width:100%`: con `container-type`, dentro de una fila o una grilla de ancho libre la pieza quedaría de ancho cero.
  ".mk-m-libro{container-type:inline-size;width:100%;box-sizing:border-box}" +
  // Al armarse (y al saltar varias hojas de una vez, o al cambiar de una a dos páginas) el libro aparece suave.
  ".mk-m-libro-mesa{display:grid;justify-items:center;perspective:1700px;padding:10px 0 6px;animation:mk-m-libro-llega .3s linear}" +
  "@keyframes mk-m-libro-llega{from{opacity:0}}" +
  // Todo el texto de la carta, siempre en la página: es lo que leen los lectores de pantalla y lo que da el alto del
  // libro (la hoja más alta). No se ve: lo que se ve son las hojas de encima.
  ".mk-m-libro-texto{grid-area:1/1;display:grid;opacity:0;pointer-events:none}" +
  ".mk-m-libro-texto>*{grid-area:1/1}" +
  ".mk-m-libro-pila{position:relative;display:grid;width:min(100%,400px);transform-style:preserve-3d;cursor:pointer}" +
  ".mk-m-libro[data-modo=doble] .mk-m-libro-pila{width:min(50%,400px);transition:translate .9s cubic-bezier(.3,.05,.2,1)}" +
  // Abierto en dos páginas, el lomo queda al centro.
  ".mk-m-libro[data-modo=doble]:not([data-vueltas=\"0\"]) .mk-m-libro-pila{translate:50% 0}" +
  ".mk-m-libro-hoja{grid-area:1/1;display:grid;transform-style:preserve-3d;transform-origin:left center;transform:translateZ(var(--z)) rotateY(0deg);" +
  "transition:transform .9s cubic-bezier(.3,.05,.2,1),opacity .5s linear}" +
  ".mk-m-libro-hoja[data-pasada]{transform:translateZ(var(--z)) rotateY(-180deg)}" +
  // De a una página: la hoja pasada gira sobre el borde izquierdo y se desvanece; debajo queda la que sigue.
  ".mk-m-libro[data-modo=simple] .mk-m-libro-hoja[data-pasada]{transform:translateZ(var(--z)) rotateY(-105deg);opacity:0;pointer-events:none}" +
  ".mk-m-libro-cara{grid-area:1/1;position:relative;box-sizing:border-box;min-height:360px;padding:1.4rem 1.3rem 2.2rem;border-radius:4px 12px 12px 4px;overflow:hidden;" +
  "backface-visibility:hidden;-webkit-backface-visibility:hidden;background:var(--mk-m-superficie);color:var(--mk-m-texto);" +
  "border:1px solid color-mix(in srgb,var(--mk-m-texto) 14%,transparent);box-shadow:0 16px 30px -22px rgba(0,0,0,.6)}" +
  // La sombra del lomo: da el volumen de la hoja.
  ".mk-m-libro-cara::after{content:\"\";position:absolute;inset:0 auto 0 0;width:22%;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.16),transparent)}" +
  ".mk-m-libro-dorso{transform:rotateY(180deg);border-radius:12px 4px 4px 12px}" +
  ".mk-m-libro-dorso::after{inset:0 0 0 auto;background:linear-gradient(270deg,rgba(0,0,0,.16),transparent)}" +
  ".mk-m-libro-tapa{display:grid;align-content:center;justify-items:center;gap:.5rem;text-align:center;background:var(--mk-m-acento);color:var(--mk-m-sobre);border-color:transparent}" +
  ".mk-m-libro-tapa img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.35}" +
  ".mk-m-libro-tapa-titulo{position:relative;margin:0;font-size:1.8rem;font-size:clamp(1.5rem,7cqi,2.3rem);font-weight:800;line-height:1.1;overflow-wrap:anywhere}" +
  ".mk-m-libro-tapa-bajada{position:relative;margin:0;font-size:1rem;opacity:.9;overflow-wrap:anywhere}" +
  ".mk-m-libro-pagina{margin:0}" +
  ".mk-m-libro-pagina h3{margin:0 0 .7rem;font-size:1.15rem;font-weight:800;color:var(--mk-m-acento);overflow-wrap:anywhere}" +
  ".mk-m-libro-pagina ul{list-style:none;margin:0;padding:0;display:grid;gap:.55rem}" +
  ".mk-m-libro-linea{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:.6rem;align-items:baseline}" +
  ".mk-m-libro-linea b{font-weight:600;overflow-wrap:anywhere}" +
  ".mk-m-libro-linea small{grid-column:1;display:block;font-size:.84rem;color:var(--mk-m-suave);overflow-wrap:anywhere}" +
  ".mk-m-libro-precio{grid-column:2;grid-row:1;font-weight:700;white-space:nowrap}" +
  ".mk-m-libro-linea[data-agotado] .mk-m-libro-precio{color:var(--mk-m-suave);text-decoration:line-through}" +
  ".mk-m-libro-agotado{grid-column:2;font-size:.78rem;font-weight:700;color:var(--mk-m-suave);text-align:right}" +
  ".mk-m-libro-numero{position:absolute;bottom:.7rem;left:0;right:0;text-align:center;font-size:.8rem;color:var(--mk-m-suave)}" +
  ".mk-m-libro-mando{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.5rem .75rem;margin-top:.5rem}" +
  ".mk-m-libro-mando .mk-m-boton[aria-disabled=true]{opacity:.4;cursor:default}" +
  // El botón que cambia de texto tiene ancho fijo y el estado va en su propia línea: nada se corre bajo el cursor.
  ".mk-m-libro-mando [data-ir=despues]{min-width:9.5em}" +
  ".mk-m-libro-estado{flex-basis:100%;margin:0;text-align:center;font-size:.92rem;color:var(--mk-m-suave)}" +
  // La carta plana (liviano, quieto o sin 3D): una hoja debajo de otra.
  ".mk-m-libro[data-modo=plano] .mk-m-libro-plano{display:grid;gap:1.2rem;padding:1.2rem;border-radius:14px;background:var(--mk-m-superficie);color:var(--mk-m-texto)}" +
  ".mk-m-libro-plano-titulo{margin:0;font-size:1.4rem;font-weight:800;overflow-wrap:anywhere}" +
  ".mk-m-libro-plano-bajada{margin:.2rem 0 0;color:var(--mk-m-suave);overflow-wrap:anywhere}";

/** Una página: el título del grupo y sus líneas, con el precio a la derecha. */
function Pagina({ hoja, indice }: { hoja: Hoja; indice: number }) {
  return (
    <section className="mk-m-libro-pagina" data-pagina={indice}>
      {hoja.titulo && <h3>{hoja.titulo}</h3>}
      <ul>
        {hoja.lineas.map((l, k) => (
          <li key={k} className="mk-m-libro-linea" data-linea="" data-agotado={l.agotado ? "" : undefined}>
            <span>
              <b>{l.texto}</b>
              {l.detalle && <small>{l.detalle}</small>}
            </span>
            {l.precio && <span className="mk-m-libro-precio">{l.precio}</span>}
            {l.agotado && <span className="mk-m-libro-agotado">Agotado</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LibroQueSeAbre({ tapa, hojas, nivel: forzado, ahorro, className }: LibroQueSeAbreProps) {
  useStyles("momento-libro", CSS_LIBRO);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  // Las hojas llegan como un arreglo nuevo en cada dibujo: se comparan por su contenido.
  const clave = JSON.stringify(limpiarHojas(hojas));
  const limpias = useMemo(() => JSON.parse(clave) as Hoja[], [clave]);
  const n = limpias.length;
  const titulo = typeof tapa?.titulo === "string" ? tapa.titulo.trim().slice(0, 80) : "";
  const bajada = typeof tapa?.bajada === "string" ? tapa.bajada.trim().slice(0, 140) : "";
  const imagen = typeof tapa?.imagen === "string" ? tapa.imagen.trim() : "";

  const [con3d] = useState(() => typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("transform-style", "preserve-3d"));
  const raiz = useRef<HTMLDivElement | null>(null);
  const [ancho, setAncho] = useState(0);
  const doble = ancho >= ANCHO_DOBLE;
  const modo: "doble" | "simple" | "plano" = nivel === "completo" && con3d ? (doble ? "doble" : "simple") : "plano";

  // Cuántas hojas van dadas vuelta, y en qué forma del libro (una o dos páginas) se contaron.
  // `salto` cuenta las veces que se pasó más de una hoja de golpe (cerrar): ahí el libro se arma de nuevo. `tocado`:
  // alguien ya lo movió (desde ahí se dice a los lectores dónde va; que se abra solo no se anuncia).
  const [estado, setEstado] = useState({ v: 0, doble, salto: 0, tocado: false });
  let v = Math.min(estado.v, maxVueltas(n, estado.doble));
  if (modo !== "plano" && estado.doble !== doble) {
    // El bloque cambió de ancho (se giró el teléfono): se sigue leyendo la misma hoja.
    v = vueltasAlCambiar(v, n, doble);
    setEstado({ ...estado, v, doble });
  }
  const tope = maxVueltas(n, doble);
  const ir = (a: number) => {
    const nueva = Math.max(0, Math.min(tope, a));
    setEstado({ v: nueva, doble, salto: estado.salto + (Math.abs(nueva - v) > 1 ? 1 : 0), tocado: true });
  };

  const pegar = useCallback(
    (el: HTMLDivElement | null) => {
      raiz.current = el;
      ref(el);
    },
    [ref],
  );
  // El ancho del propio bloque decide si el libro va de a una o de a dos páginas.
  useLayoutEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const medir = () => setAncho(el.clientWidth);
    const tamano = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    tamano?.observe(el);
    medir();
    return () => tamano?.disconnect();
  }, [n > 0]);
  // La tapa se abre sola una vez, la primera vez que el libro se ve. Después manda quien lee.
  const abrio = useRef(false);
  useEffect(() => {
    if (!activo || modo === "plano" || abrio.current || !n) return;
    const id = window.setTimeout(() => {
      abrio.current = true;
      setEstado((e) => (e.v === 0 ? { ...e, v: 1 } : e));
    }, ESPERA);
    return () => window.clearTimeout(id);
  }, [activo, modo, n]);

  if (!n) return null;
  const clases = ["mk-momento mk-m-libro", className].filter(Boolean).join(" ");

  if (modo === "plano") {
    return (
      <div ref={pegar} className={clases} data-momento="libro" data-modo="plano" data-nivel={nivel} data-activo={activo ? "" : undefined}>
        <div className="mk-m-libro-plano">
          {(titulo || bajada) && (
            <header>
              {titulo && <p className="mk-m-libro-plano-titulo">{titulo}</p>}
              {bajada && <p className="mk-m-libro-plano-bajada">{bajada}</p>}
            </header>
          )}
          {limpias.map((h, i) => <Pagina key={i} hoja={h} indice={i} />)}
        </div>
      </div>
    );
  }

  const caras = carasLibro(n, doble);
  const cara = (que: number | "tapa" | null, dorso: boolean) => {
    const base = `mk-m-libro-cara ${dorso ? "mk-m-libro-dorso" : "mk-m-libro-frente"}`;
    if (que === "tapa")
      return (
        <div className={`${base} mk-m-libro-tapa`} data-cara="tapa">
          {imagen && <img src={imagen} alt="" loading="lazy" decoding="async" />}
          {titulo && <p className="mk-m-libro-tapa-titulo">{titulo}</p>}
          {bajada && <p className="mk-m-libro-tapa-bajada">{bajada}</p>}
        </div>
      );
    // Papel en blanco (la contratapa): no lleva nada.
    if (que === null) return <div className={base} data-cara="blanco" />;
    return (
      <div className={base} data-cara={que}>
        <Pagina hoja={limpias[que]} indice={que} />
        <span className="mk-m-libro-numero" aria-hidden="true">{que + 1}</span>
      </div>
    );
  };
  const alTeclear = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
    ev.preventDefault();
    ir(v + (ev.key === "ArrowRight" ? 1 : -1));
  };
  /** Tocar el libro: la mitad derecha pasa a la página siguiente; la izquierda, a la anterior. */
  const alTocar = (ev: MouseEvent<HTMLDivElement>) => {
    if (window.getSelection?.()?.toString()) return;
    const caja = ev.currentTarget.getBoundingClientRect();
    const corte = doble ? caja.left : caja.left + caja.width * 0.35;
    if (v === 0 || ev.clientX >= corte) ir(v + 1);
    // Hacia atrás, un toque no cierra el libro: para eso está el botón.
    else if (v > 1) ir(v - 1);
  };

  return (
    <div ref={pegar} className={clases} data-momento="libro" data-modo={modo} data-vueltas={v} data-nivel={nivel} data-activo={activo ? "" : undefined} role="group" aria-label={titulo || "Carta"} onKeyDown={alTeclear}>
      {/* Al cambiar entre una y dos páginas, o al saltar varias hojas, el libro se arma de nuevo: ninguna queda a medio girar. */}
      <div className="mk-m-libro-mesa" key={`${modo}-${estado.salto}`}>
        <div className="mk-m-libro-pila" onClick={alTocar}>
          <div className="mk-m-libro-texto">
            <div className="mk-m-libro-cara mk-m-libro-tapa">
              {titulo && <p className="mk-m-libro-tapa-titulo">{titulo}</p>}
              {bajada && <p className="mk-m-libro-tapa-bajada">{bajada}</p>}
            </div>
            {limpias.map((h, i) => (
              <div key={i} className="mk-m-libro-cara">
                <Pagina hoja={h} indice={i} />
              </div>
            ))}
          </div>
          {/* Solo se dibujan las hojas cercanas a la que se lee (cada una es una capa en la tarjeta gráfica: en un
              teléfono, una carta de dieciséis hojas no cabría). Son decoración: el texto para lectores va arriba. */}
          {caras.map((c, i) =>
            i < v - 2 || i > v + 1 ? null : (
              <div key={i} className="mk-m-libro-hoja" aria-hidden="true" data-hoja={i} data-pasada={i < v ? "" : undefined} style={{ "--z": `${apilado(i, v, caras.length)}px` } as CSSProperties}>
                {cara(c.frente, false)}
                {doble && cara(c.dorso, true)}
              </div>
            ),
          )}
        </div>
      </div>
      <div className="mk-m-libro-mando">
        {/* Los botones son siempre los mismos (así el foco no se pierde al abrir o cerrar); el que no sirve queda apagado. */}
        <button type="button" className="mk-m-boton" data-ir="antes" aria-label="Página anterior" aria-disabled={v === 0 ? true : undefined} onClick={() => ir(v - 1)}>
          <span aria-hidden="true">‹ </span>Anterior
        </button>
        <button type="button" className="mk-m-boton" data-ir="despues" aria-label={v === 0 ? "Abrir la carta" : "Página siguiente"} aria-disabled={v >= tope ? true : undefined} onClick={() => ir(v + 1)}>
          {v === 0 ? "Abrir la carta" : <>Siguiente<span aria-hidden="true"> ›</span></>}
        </button>
        <button type="button" className="mk-m-boton" data-ir="cerrar" aria-disabled={v === 0 ? true : undefined} onClick={() => ir(0)}>Cerrar</button>
        <p className="mk-m-libro-estado" aria-live={estado.tocado ? "polite" : "off"} data-estado-libro="">{estadoLibro(v, n, doble)}</p>
      </div>
    </div>
  );
}
