// PROPUESTA (prototipo): todas las piezas del panel de La Mente. Lo que ya está conectado (motion-kit 0.5.5) y, por cada
// tipo de pieza que usa el panel, cuántas pantallas la usan, qué vería el dueño y una muestra que se puede tocar.
// Los números salen de lamente-front/fronts/panel/src (165 archivos, 27-11-2026). Vitrina: #propuesta.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Contador, CountUp, Interruptor, Tabs, useToast } from "../src/entradas/interfaz";
import { CSS_COMIC, Colgante, Estallido, Globo, Mano } from "./Comic";

const CSS = `
.pp-pagina{min-height:100vh;background:#FAF7F2;color:#1C1A22;font-family:Inter,system-ui,sans-serif;padding:clamp(16px,4vw,40px);overflow-x:clip}
.pp-cabeza{max-width:1100px;margin:0 auto 24px}
.pp-cabeza h1{font-family:Fraunces,Georgia,serif;font-size:clamp(1.9rem,6vw,3rem);margin:.3em 0 .2em}
.pp-cabeza p{margin:0 0 .6em;color:#5E5A68;max-width:70ch;line-height:1.5}
.pp-resumen{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.pp-resumen span{padding:8px 14px;border:2px solid #111;border-radius:999px;background:#fff;font-weight:700;box-shadow:3px 3px 0 #111}
.pp-resumen span b{color:#7c3aed}
.pp-grupo{max-width:1100px;margin:0 auto 34px}
.pp-grupo>h2{font-family:Fraunces,Georgia,serif;font-size:1.45rem;margin:0 0 4px}
.pp-grupo>p{margin:0 0 14px;color:#5E5A68}
.pp-grilla{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))}
.pp-tarjeta{display:grid;gap:10px;align-content:start;padding:18px;background:#fff;border:2px solid #111;border-radius:16px;box-shadow:5px 5px 0 #111}
.pp-tarjeta h3{margin:0;font-size:1.05rem}
.pp-tarjeta p{margin:0;color:#5E5A68;font-size:.92rem;line-height:1.45}
.pp-etiquetas{display:flex;flex-wrap:wrap;gap:6px}
.pp-etiquetas span{font-size:.75rem;font-weight:800;padding:3px 9px;border-radius:999px;border:1.5px solid #111}
.pp-nuevo{background:#ffd23f}
.pp-existe{background:#c8f5dc}
.pp-front{background:#e6dcff}
.pp-donde{background:#fff}
.pp-muestra{min-height:120px;display:grid;place-items:center;gap:10px;padding:14px;background:#FAF7F2;border:1px dashed #d8cfc2;border-radius:12px;position:relative;overflow:hidden}
.pp-boton{font:inherit;font-weight:800;min-height:44px;padding:0 18px;border:2px solid #111;border-radius:12px;background:#ffd23f;color:#111;
  box-shadow:0 4px 0 #111;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:transform .12s,box-shadow .12s}
.pp-boton:active{transform:translateY(3px);box-shadow:0 1px 0 #111}
.pp-boton[data-estado=bien]{background:#1f9d55;color:#fff}
.pp-boton[data-estado=mal]{background:#d64545;color:#fff}
.pp-boton[data-suave]{background:#fff}
.pp-rueda{width:16px;height:16px;border-radius:50%;border:3px solid currentColor;border-right-color:transparent;animation:pp-gira .7s linear infinite}
@keyframes pp-gira{to{transform:rotate(1turn)}}
.pp-salta{animation:pp-salta .4s cubic-bezier(.34,1.56,.64,1)}
@keyframes pp-salta{0%{transform:scale(.85)}60%{transform:scale(1.08)}100%{transform:scale(1)}}
.pp-sacude{animation:pp-sacude .32s ease-out}
@keyframes pp-sacude{25%{transform:translateX(-7px)}50%{transform:translateX(6px)}75%{transform:translateX(-3px)}}
.pp-pildora{display:inline-flex;align-items:center;gap:6px;font-weight:800;padding:6px 14px;border-radius:999px;border:2px solid #111;cursor:pointer;font:inherit;font-weight:800}
.pp-pildora[data-e=preparando]{background:#ffd23f}
.pp-pildora[data-e=listo]{background:#7cf0c8}
.pp-pildora[data-e=entregado]{background:#e6dcff}
.pp-flip{animation:pp-flip .45s ease-out}
@keyframes pp-flip{0%{transform:rotateX(90deg);opacity:0}100%{transform:none;opacity:1}}
.pp-campo{display:grid;gap:6px;width:100%;max-width:260px}
.pp-campo input{font:inherit;padding:10px 12px;border-radius:10px;border:2px solid #E7E1D8;background:#fff}
.pp-campo input[aria-invalid=true]{border-color:#d64545}
.pp-campo small{color:#d64545;font-weight:700}
.pp-barras{display:flex;align-items:flex-end;gap:8px;height:110px;width:100%;max-width:280px}
.pp-barras i{flex:1;background:#7c3aed;border:2px solid #111;border-radius:6px 6px 0 0;transform-origin:50% 100%;transform:scaleY(0);transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.pp-barras i:last-child{background:#ffd23f}
.pp-barras[data-ve] i{transform:scaleY(1)}
.pp-dialogo{position:absolute;inset:0;display:grid;place-items:center;background:rgba(20,18,26,.35)}
.pp-mini-tabla{width:100%;border-collapse:collapse;font-size:.85rem}
.pp-mini-tabla td{padding:6px 4px;border-bottom:1px solid #E7E1D8}
.pp-paso{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center}
@media (prefers-reduced-motion:reduce){.pp-rueda,.pp-salta,.pp-sacude,.pp-flip{animation:none}.pp-barras i{transition:none}}`;

type Estado = "nuevo" | "existe" | "front";
const ETIQUETA: Record<Estado, string> = { nuevo: "Pieza nueva", existe: "Ya existe en motion-kit", front: "Le toca al front" };

function Pieza({ titulo, donde, estado, children, muestra }: { titulo: string; donde: string; estado: Estado[]; children: ReactNode; muestra?: ReactNode }) {
  return (
    <article className="pp-tarjeta">
      <h3>{titulo}</h3>
      <div className="pp-etiquetas">
        {estado.map((e) => <span key={e} className={`pp-${e}`}>{ETIQUETA[e]}</span>)}
        <span className="pp-donde">{donde}</span>
      </div>
      <p>{children}</p>
      {muestra && <div className="pp-muestra">{muestra}</div>}
    </article>
  );
}

/* ---------- Muestras ---------- */

function BotonQueGuarda() {
  const [e, setE] = useState<"listo" | "guardando" | "bien">("listo");
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(reloj.current), []);
  const guardar = () => {
    if (e !== "listo") return;
    setE("guardando");
    reloj.current = setTimeout(() => {
      setE("bien");
      reloj.current = setTimeout(() => setE("listo"), 1600);
    }, 1100);
  };
  return (
    <button type="button" className={`pp-boton${e === "bien" ? " pp-salta" : ""}`} data-estado={e} onClick={guardar} aria-live="polite">
      {e === "guardando" && <span className="pp-rueda" aria-hidden="true" />}
      {e === "listo" ? "Guardar" : e === "guardando" ? "Guardando…" : "✓ Guardado"}
    </button>
  );
}

function Copiar() {
  const [copiado, setCopiado] = useState(0);
  useEffect(() => {
    if (!copiado) return;
    const r = setTimeout(() => setCopiado(0), 1400);
    return () => clearTimeout(r);
  }, [copiado]);
  return (
    <div style={{ position: "relative", display: "grid", placeItems: "center", gap: 8 }}>
      {copiado > 0 && <Globo key={copiado} style={{ position: "absolute", bottom: "100%", marginBottom: 12, whiteSpace: "nowrap" }}>¡Copiado!</Globo>}
      <button type="button" className="pp-boton" data-suave="" onClick={() => setCopiado((n) => n + 1)}>⧉ lamente.cl/wwww</button>
    </div>
  );
}

function PildoraDeEstado() {
  const ESTADOS = ["preparando", "listo", "entregado"] as const;
  const [i, setI] = useState(0);
  const e = ESTADOS[i];
  return (
    <button type="button" key={e} className="pp-pildora pp-flip" data-e={e} onClick={() => setI((i + 1) % 3)} aria-label={`Estado: ${e}. Toca para cambiar.`}>
      {e === "preparando" ? "⏳ Preparando" : e === "listo" ? "✓ Listo" : "📦 Entregado"}
    </button>
  );
}

function CampoConError() {
  const [valor, setValor] = useState("");
  const [error, setError] = useState("");
  const [vuelta, setVuelta] = useState(0);
  return (
    <form className="pp-campo" onSubmit={(ev) => { ev.preventDefault(); if (!valor.trim()) { setError("Escribe el nombre de tu negocio."); setVuelta((v) => v + 1); } else setError(""); }}>
      <label htmlFor="pp-nombre" style={{ fontWeight: 700 }}>Nombre</label>
      <input id="pp-nombre" key={vuelta} className={vuelta ? "pp-sacude" : undefined} value={valor} onChange={(ev) => setValor(ev.target.value)} aria-invalid={Boolean(error)} aria-describedby="pp-error" />
      {error && <small id="pp-error" role="alert">{error}</small>}
      <button type="submit" className="pp-boton" style={{ justifySelf: "start" }}>Guardar</button>
    </form>
  );
}

function BarrasQueCrecen() {
  const ref = useRef<HTMLDivElement>(null);
  const [ve, setVe] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([x]) => x.isIntersecting && setVe(true), { threshold: 0.4 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const dias = [40, 65, 30, 80, 55, 90, 100];
  return (
    <div style={{ display: "grid", gap: 8, justifyItems: "center", width: "100%" }}>
      <strong style={{ fontSize: "1.6rem" }}>$<CountUp to={ve ? 184500 : 0} duration={1200} /></strong>
      <div ref={ref} className="pp-barras" data-ve={ve || undefined} aria-label="Ventas de la semana">
        {dias.map((h, i) => <i key={i} style={{ height: `${h}%`, transitionDelay: `${i * 70}ms` }} />)}
      </div>
      <small style={{ color: "#1f9d55", fontWeight: 800 }}>▲ 18 % más que la semana pasada</small>
    </div>
  );
}

function Vacio() {
  return (
    <div style={{ display: "grid", gap: 10, justifyItems: "center", textAlign: "center" }}>
      <span style={{ fontSize: 34 }}>📭</span>
      <strong>Aún no tienes novedades</strong>
      <div className="pp-paso" style={{ flexWrap: "nowrap" }}>
        <Mano ancho={92} />
        <button type="button" className="pp-boton">＋ Crear la primera</button>
      </div>
    </div>
  );
}

function Oferta() {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
      <Estallido texto="¡30 días gratis!" tamano={124} color="#7cf0c8" />
      <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
        <strong>Reservas</strong>
        <small style={{ color: "#5E5A68" }}>Tus clientes reservan solos.</small>
        <button type="button" className="pp-boton">Probar</button>
      </div>
    </div>
  );
}

function ConfirmarBorrado() {
  const [abierto, setAbierto] = useState(false);
  const toast = useToast();
  return (
    <>
      <button type="button" className="pp-boton" data-estado="mal" onClick={() => setAbierto(true)}>🗑 Borrar novedad</button>
      {abierto && (
        <div className="pp-dialogo" role="dialog" aria-label="Confirmar borrado">
          <Globo>
            ¿La borro?
            <span className="pp-paso" style={{ marginTop: 10, textTransform: "none", fontStyle: "normal" }}>
              <button type="button" className="pp-boton" data-estado="mal" onClick={() => { setAbierto(false); toast("Borrada", { tipo: "info", accion: { texto: "Deshacer", alHacer: () => {} } }); }}>Sí, borrar</button>
              <button type="button" className="pp-boton" data-suave="" onClick={() => setAbierto(false)}>No</button>
            </span>
          </Globo>
        </div>
      )}
    </>
  );
}

function PestanasQueSeDeslizan() {
  const [v, setV] = useState("semana");
  return <Tabs items={[{ id: "dia", label: "Día" }, { id: "semana", label: "Semana" }, { id: "mes", label: "Mes" }]} value={v} onChange={setV} />;
}

function AvisoAlGuardar() {
  const toast = useToast();
  return (
    <div className="pp-paso">
      <button type="button" className="pp-boton" onClick={() => toast("Guardado", { tipo: "bien" })}>Guardar</button>
      <button type="button" className="pp-boton" data-suave="" onClick={() => toast("No se pudo guardar", { tipo: "mal" })}>Fallar</button>
    </div>
  );
}

function AbiertoCerrado() {
  const [a, setA] = useState(true);
  const [n, setN] = useState(3);
  return (
    <div className="pp-paso">
      <Interruptor etiqueta="Recibir pedidos" activo={a} alCambiar={setA} textos={["Cerrado", "Abierto"]} />
      <button type="button" className="pp-boton" data-suave="" onClick={() => setN(n + 1)}>Pedidos <Contador valor={n} etiqueta={`${n} pendientes`} /></button>
    </div>
  );
}

export function PropuestaVitrina() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS_COMIC + CSS;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);
  return (
    <div className="pp-pagina">
      <a href="#" style={{ color: "inherit", opacity: 0.7 }}>← Volver</a>
      <header className="pp-cabeza">
        <h1>Propuesta: todas las piezas del panel</h1>
        <p>
          Revisé el panel de La Mente (165 archivos de pantallas y piezas). El front ya conectó lo de la versión 0.5.5 y rehízo sus
          piezas comunes con el estilo de la portada. Aquí va lo que falta, agrupado por lo que el dueño hace, con cuántas
          pantallas lo usan y una muestra que se puede tocar.
        </p>
        <div className="pp-resumen">
          <span><b>12</b> piezas nuevas</span>
          <span><b>6</b> ya existen (falta usarlas en más pantallas)</span>
          <span>Tocan <b>casi todas</b> las pantallas del panel</span>
        </div>
      </header>

      <section className="pp-grupo">
        <h2>Ya conectado (v0.5.5)</h2>
        <p>Lo que el front ya usa de motion-kit.</p>
        <div className="pp-grilla">
          <Pieza titulo="Subir imágenes" donde="7 pantallas" estado={["existe"]}>SubirImagen en logo, portada, galería, productos y el Estudio.</Pieza>
          <Pieza titulo="Cargando con forma" donde="41 pantallas" estado={["existe"]}>CargaPantalla usa Cargando: esqueletos en vez de la rueda al abrir.</Pieza>
          <Pieza titulo="«Ahora»: lo que llega" donde="2 pantallas" estado={["existe"]}>ListaViva, Contador e Interruptor en los pedidos.</Pieza>
        </div>
      </section>

      <section className="pp-grupo">
        <h2>1. Guardar, copiar y confirmar</h2>
        <p>Lo que el dueño hace en casi todas las pantallas: que cada toque responda.</p>
        <div className="pp-grilla">
          <Pieza titulo="Botón que guarda" donde="51 pantallas con rueda" estado={["nuevo"]} muestra={<BotonQueGuarda />}>
            El botón mismo dice «Guardando…» y después «✓ Guardado» con un saltito, en vez de una rueda suelta.
          </Pieza>
          <Pieza titulo="Avisos al guardar y borrar" donde="1 de ~90 pantallas los usa" estado={["existe", "front"]} muestra={<AvisoAlGuardar />}>
            La pieza ya está: falta ponerla en todas las pantallas que guardan o borran.
          </Pieza>
          <Pieza titulo="Copiar con globo" donde="12 pantallas" estado={["nuevo"]} muestra={<Copiar />}>
            Copiar el link, el código o el QR: un globo de cómic dice «¡Copiado!».
          </Pieza>
          <Pieza titulo="Confirmar sin miedo" donde="5 pantallas" estado={["nuevo"]} muestra={<ConfirmarBorrado />}>
            «¿La borro?» en un globo (en el teléfono, hoja desde abajo); al borrar, aviso con «Deshacer».
          </Pieza>
          <Pieza titulo="Campo con error que se nota" donde="28 pantallas con errores" estado={["nuevo"]} muestra={<CampoConError />}>
            Si falta algo, el campo se sacude suave y el mensaje aparece al lado (prueba guardar vacío).
          </Pieza>
        </div>
      </section>

      <section className="pp-grupo">
        <h2>2. Ver cómo va el negocio</h2>
        <p>Resumen, Caja, Comisiones y Estadísticas hoy son tablas.</p>
        <div className="pp-grilla">
          <Pieza titulo="Números que cuentan y barras que crecen" donde="7 pantallas con tablas" estado={["nuevo"]} muestra={<BarrasQueCrecen />}>
            El total sube contando, las barras crecen al verse y la tendencia contra la semana pasada.
          </Pieza>
          <Pieza titulo="Píldora de estado que cambia" donde="68 pantallas con estados" estado={["nuevo"]} muestra={<PildoraDeEstado />}>
            «Preparando → Listo → Entregado» con un giro corto: se nota que cambió (tócala).
          </Pieza>
          <Pieza titulo="Pestañas con barra que se desliza" donde="8 pantallas" estado={["existe", "front"]} muestra={<PestanasQueSeDeslizan />}>
            La pieza existe (Tabs); falta usarla en Agenda, Panel y las demás.
          </Pieza>
          <Pieza titulo="Abierto/cerrado y pendientes" donde="5 pantallas con interruptor" estado={["existe", "front"]} muestra={<AbiertoCerrado />}>
            Interruptor y Contador ya están; falta llevarlos a Turnos, Reservas y Ajustes.
          </Pieza>
        </div>
      </section>

      <section className="pp-grupo">
        <h2>3. Invitar y guiar (cómic)</h2>
        <p>La cara amable del panel: la mano que apunta, los carteles y los globos de la maqueta #comic.</p>
        <div className="pp-grilla">
          <Pieza titulo="Pantalla vacía que invita" donde="15 pantallas" estado={["nuevo"]} muestra={<Vacio />}>
            Cuando no hay nada, la mano apunta al botón para crear lo primero.
          </Pieza>
          <Pieza titulo="Oferta de módulo con cartel" donde="36 pantallas" estado={["nuevo"]} muestra={<Oferta />}>
            La oferta de un módulo que no tiene, con un estallido que late.
          </Pieza>
          <Pieza titulo="La guía con la mano" donde="todo el panel (marcas de soporte)" estado={["nuevo"]} muestra={<a className="pp-boton" href="#comic">Ver en #comic</a>}>
            La mano viaja a cada botón, lo toca y el globo explica; apunta a los elementos que ya tienen su marca de soporte.
          </Pieza>
          <Pieza titulo="Novedades de La Mente" donde="la campana" estado={["nuevo"]} muestra={<Colgante texto="¡Nuevo!" />}>
            Cuando hay algo nuevo, un cartel cuelga y se mece junto a la campana.
          </Pieza>
          <Pieza titulo="Celebrar los logros" donde="primer pedido, página publicada" estado={["nuevo"]} muestra={<Estallido texto="¡Publicada!" tamano={130} />}>
            Un estallido y confeti (ya existe Confeti en momentos) cuando pasa algo bueno.
          </Pieza>
        </div>
      </section>

      <section className="pp-grupo">
        <h2>4. Los bloques de las páginas</h2>
        <p>Para los clientes de cada negocio (opción A): una viñeta alrededor de cada uno de los ~18 bloques cuando la página usa el tema Cómic o Anime.</p>
        <div className="pp-grilla">
          <Pieza titulo="Viñeta por bloque" donde="18 bloques de la página" estado={["nuevo", "front"]} muestra={<a className="pp-boton" href="#comic">Ver los bloques en #comic</a>}>
            Marco grueso, puntos o líneas de velocidad detrás, el título como cartel y la mano que toca el botón del bloque. El front suma los temas Cómic y Anime.
          </Pieza>
        </div>
      </section>
    </div>
  );
}
