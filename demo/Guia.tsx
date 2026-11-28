// La guía de piezas del front de La Mente: cada pieza que tiene (panel, página pública y lo compartido), dónde está,
// cuánto se usa, qué usa hoy de motion-kit y qué propone motion-kit. Con una barra izquierda de muestra. Vitrina: #guia.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BARRA, BLOQUES, CATEGORIAS, PARA_ORDENAR, PIEZAS, ZONAS, type Categoria, type PiezaFront, type Zona } from "./guia-datos";

const CSS = `
.gf-pagina{min-height:100vh;background:#FAF7F2;color:#1C1A22;font-family:Inter,system-ui,sans-serif;padding:clamp(16px,4vw,40px);overflow-x:clip}
.gf-ancho{max-width:1120px;margin:0 auto}
.gf-cabeza h1{font-family:Fraunces,Georgia,serif;font-size:clamp(1.9rem,6vw,3rem);margin:.3em 0 .2em}
.gf-cabeza p{margin:0 0 .6em;color:#5E5A68;max-width:72ch;line-height:1.5}
.gf-cifras{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 6px}
.gf-cifras span{padding:8px 14px;border:2px solid #111;border-radius:999px;background:#fff;font-weight:700;box-shadow:3px 3px 0 #111}
.gf-cifras b{color:#7c3aed}
.gf-indice{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 28px}
.gf-indice a{color:#1C1A22;font-weight:700;padding:6px 12px;border-radius:10px;background:#ffd23f;border:2px solid #111;text-decoration:none}
.gf-seccion{margin:0 0 40px}
.gf-seccion>h2{font-family:Fraunces,Georgia,serif;font-size:1.6rem;margin:0 0 6px}
.gf-seccion>p{margin:0 0 14px;color:#5E5A68;max-width:72ch}
.gf-filtros{position:sticky;top:0;z-index:3;display:grid;gap:10px;padding:12px 0;background:#FAF7F2}
.gf-fila{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.gf-chip{font:inherit;font-size:.85rem;font-weight:700;min-height:36px;padding:0 12px;border-radius:999px;border:2px solid #111;background:#fff;color:#111;cursor:pointer}
.gf-chip[aria-pressed=true]{background:#1C1A22;color:#fff}
.gf-buscar{font:inherit;min-height:40px;padding:0 12px;border-radius:10px;border:2px solid #111;min-width:min(100%,260px)}
.gf-lista{display:grid;gap:12px}
.gf-pieza{display:grid;gap:8px;padding:14px 16px;background:#fff;border:2px solid #111;border-radius:14px;box-shadow:4px 4px 0 #111}
.gf-pieza-cabeza{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}
.gf-pieza h3{margin:0;font-size:1.02rem}
.gf-pieza p{margin:0;font-size:.92rem;line-height:1.45}
.gf-que{color:#5E5A68}
.gf-prop{padding:8px 10px;border-radius:10px;background:#fff8dc;border:1.5px dashed #c9a400}
.gf-prop b{color:#7a5d00}
.gf-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:.78rem}
.gf-meta code{font-size:.75rem;color:#5E5A68;word-break:break-all}
.gf-et{font-weight:800;padding:2px 9px;border-radius:999px;border:1.5px solid #111;white-space:nowrap}
.gf-si{background:#c8f5dc}.gf-indirecto{background:#e6dcff}.gf-no{background:#f1ece4}
.gf-usos{display:inline-flex;align-items:center;gap:6px}
.gf-usos i{display:block;height:8px;border-radius:4px;background:#7c3aed;min-width:3px}
.gf-ver{font-weight:800;color:#7c3aed}
.gf-vacio{padding:20px;text-align:center;color:#5E5A68}
.gf-dos{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));align-items:start}
.gf-caja{padding:16px;background:#fff;border:2px solid #111;border-radius:14px;box-shadow:4px 4px 0 #111}
.gf-caja h3{margin:0 0 8px}
.gf-caja ul{margin:0;padding-left:1.1em;display:grid;gap:6px;line-height:1.4;font-size:.92rem}
/* La barra de muestra */
.gf-barra{position:relative;width:240px;max-width:100%;padding:10px;background:#fff;border:2px solid #111;border-radius:16px;box-shadow:5px 5px 0 #111}
.gf-barra h4{margin:12px 8px 4px;font-size:.78rem;font-weight:900;display:flex;align-items:center;gap:6px}
.gf-barra h4::before{content:"";width:12px;height:3px;border-radius:2px;background:var(--c)}
.gf-item{position:relative;z-index:1;display:block;width:100%;text-align:left;font:inherit;font-size:.92rem;font-weight:600;padding:8px 12px;border:0;background:none;border-radius:10px;cursor:pointer;color:#1C1A22}
.gf-item[aria-current=page]{color:#fff}
.gf-marca{position:absolute;left:10px;right:10px;top:0;z-index:0;border-radius:10px;background:#1C1A22;
  background-image:radial-gradient(rgba(255,255,255,.18) 1px,transparent 1.4px);background-size:7px 7px;
  box-shadow:3px 3px 0 var(--c);transition:transform .38s cubic-bezier(.34,1.3,.64,1),box-shadow .2s;pointer-events:none}
.gf-tabla{width:100%;border-collapse:collapse;background:#fff;border:2px solid #111;border-radius:14px;overflow:hidden;font-size:.9rem}
.gf-tabla th,.gf-tabla td{text-align:left;padding:8px 10px;border-bottom:1px solid #E7E1D8;vertical-align:top}
.gf-tabla th{background:#1C1A22;color:#fff}
.gf-ordenar{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.gf-ordenar li{padding:12px 14px;background:#fff;border:2px solid #111;border-radius:12px;border-left:8px solid #ffd23f}
@media (prefers-reduced-motion:reduce){.gf-marca{transition:none}}`;

/** La barra de muestra: la marca del activo se desliza de un ítem a otro (la propuesta). */
function BarraDeMuestra() {
  const caja = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState("Página");
  const [marca, setMarca] = useState<{ y: number; h: number; c: string } | null>(null);
  const color = BARRA.grupos.find((g) => g.items.includes(activo))?.color ?? "#7c3aed";
  useLayoutEffect(() => {
    const el = caja.current?.querySelector<HTMLElement>(`[data-item="${activo}"]`);
    if (el) setMarca({ y: el.offsetTop, h: el.offsetHeight, c: color });
  }, [activo, color]);
  return (
    <div className="gf-barra" ref={caja} role="navigation" aria-label="Barra de muestra">
      {marca && <span className="gf-marca" style={{ height: marca.h, transform: `translateY(${marca.y}px)`, ["--c" as string]: marca.c }} aria-hidden="true" />}
      {BARRA.grupos.map((g) => (
        <div key={g.titulo || "inicio"} style={{ ["--c" as string]: g.color }}>
          {g.titulo && <h4>{g.titulo}</h4>}
          {g.items.slice(0, 5).map((i) => (
            <button key={i} type="button" className="gf-item" data-item={i} aria-current={i === activo ? "page" : undefined} onClick={() => setActivo(i)}>
              {i}
            </button>
          ))}
          {g.items.length > 5 && <small style={{ display: "block", padding: "2px 12px", color: "#5E5A68" }}>y {g.items.length - 5} más</small>}
        </div>
      ))}
    </div>
  );
}

function Ficha({ p }: { p: PiezaFront }) {
  const max = 110;
  return (
    <article className="gf-pieza">
      <div className="gf-pieza-cabeza">
        <h3>{p.nombre}</h3>
        <span className="gf-meta">
          <span className={`gf-et gf-${p.kit}`}>{p.kit === "si" ? "Usa motion-kit" : p.kit === "indirecto" ? "motion-kit por otra pieza" : "Sin motion-kit"}</span>
          <span className="gf-et">{CATEGORIAS[p.cat]}</span>
        </span>
      </div>
      <p className="gf-que">{p.que}{p.kitDetalle ? ` Hoy: ${p.kitDetalle}.` : ""}</p>
      <p className="gf-prop"><b>Propuesta:</b> {p.propuesta} {p.muestra && <a className="gf-ver" href={p.muestra}>Ver muestra →</a>}</p>
      <div className="gf-meta">
        <span className="gf-usos" title="Archivos que la usan">
          <i style={{ width: Math.max(3, (Math.min(p.usos, max) / max) * 120) }} aria-hidden="true" />
          {p.usos} {p.usos === 1 ? "archivo" : "archivos"}
        </span>
        <code>{p.archivo}</code>
      </div>
    </article>
  );
}

export function GuiaVitrina() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);
  const [zona, setZona] = useState<Zona | "todas">("todas");
  const [cat, setCat] = useState<Categoria | "todas">("todas");
  const [soloSinKit, setSoloSinKit] = useState(false);
  const [buscar, setBuscar] = useState("");

  const lista = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return PIEZAS.filter((p) => (zona === "todas" || p.zona === zona) && (cat === "todas" || p.cat === cat) && (!soloSinKit || p.kit === "no"))
      .filter((p) => !q || `${p.nombre} ${p.que} ${p.propuesta}`.toLowerCase().includes(q))
      .sort((a, b) => b.usos - a.usos);
  }, [zona, cat, soloSinKit, buscar]);

  const conKit = PIEZAS.filter((p) => p.kit !== "no").length;
  const categorias = [...new Set(PIEZAS.filter((p) => zona === "todas" || p.zona === zona).map((p) => p.cat))];

  return (
    <div className="gf-pagina">
      <div className="gf-ancho">
        <a href="#" style={{ color: "inherit", opacity: 0.7 }}>← Volver</a>
        <header className="gf-cabeza">
          <h1>Guía de piezas del front</h1>
          <p>
            Todo lo que tiene hoy el front de La Mente: el panel de cada negocio, la página pública y lo compartido. Por
            cada pieza, dónde está, cuánto se usa, qué usa ya de motion-kit y qué propone motion-kit. Revisado el 27-11-2026
            (128 piezas, agrupadas aquí en {PIEZAS.length} fichas).
          </p>
          <div className="gf-cifras">
            <span><b>79</b> del panel</span>
            <span><b>23</b> de la página pública</span>
            <span><b>26</b> compartidas</span>
            <span><b>{conKit}</b> fichas ya usan motion-kit</span>
            <span><b>22</b> bloques de página</span>
          </div>
          <nav className="gf-indice" aria-label="En esta guía">
            <a href="#guia-piezas" onClick={(e) => { e.preventDefault(); document.getElementById("guia-piezas")?.scrollIntoView({ behavior: "smooth" }); }}>Las piezas</a>
            <a href="#guia-barra" onClick={(e) => { e.preventDefault(); document.getElementById("guia-barra")?.scrollIntoView({ behavior: "smooth" }); }}>La barra izquierda</a>
            <a href="#guia-bloques" onClick={(e) => { e.preventDefault(); document.getElementById("guia-bloques")?.scrollIntoView({ behavior: "smooth" }); }}>Bloques de la página</a>
            <a href="#guia-ordenar" onClick={(e) => { e.preventDefault(); document.getElementById("guia-ordenar")?.scrollIntoView({ behavior: "smooth" }); }}>Para cambiar todo en un lugar</a>
            <a href="#propuesta">Muestras (#propuesta)</a>
            <a href="#comic">Cómic (#comic)</a>
          </nav>
        </header>

        <section className="gf-seccion" id="guia-piezas">
          <h2>Las piezas</h2>
          <p>Ordenadas por cuántos archivos las usan. Filtra por zona, por tipo o solo las que todavía no tienen nada de motion-kit.</p>
          <div className="gf-filtros">
            <div className="gf-fila" role="group" aria-label="Zona">
              {(["todas", "panel", "pagina", "ui"] as const).map((z) => (
                <button key={z} type="button" className="gf-chip" aria-pressed={zona === z} onClick={() => { setZona(z); setCat("todas"); }}>
                  {z === "todas" ? "Todo el front" : ZONAS[z]}
                </button>
              ))}
              <input className="gf-buscar" type="search" placeholder="Buscar (botón, carga, sello…)" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar pieza" />
            </div>
            <div className="gf-fila" role="group" aria-label="Tipo">
              <button type="button" className="gf-chip" aria-pressed={cat === "todas"} onClick={() => setCat("todas")}>Todos los tipos</button>
              {categorias.map((c) => (
                <button key={c} type="button" className="gf-chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{CATEGORIAS[c]}</button>
              ))}
              <button type="button" className="gf-chip" aria-pressed={soloSinKit} onClick={() => setSoloSinKit(!soloSinKit)}>Solo sin motion-kit</button>
            </div>
          </div>
          <div className="gf-lista" aria-live="polite">
            {lista.map((p) => <Ficha key={`${p.zona}-${p.nombre}`} p={p} />)}
            {!lista.length && <p className="gf-vacio">No hay piezas con esos filtros.</p>}
          </div>
        </section>

        <section className="gf-seccion" id="guia-barra">
          <h2>La barra izquierda</h2>
          <p>Cómo está hoy y qué se le puede sumar. A la derecha, una barra de muestra: toca los ítems y mira cómo la marca se desliza con el color de cada grupo.</p>
          <div className="gf-dos">
            <div className="gf-caja">
              <h3>Hoy</h3>
              <ul>{BARRA.hoy.map((t) => <li key={t}>{t}</li>)}</ul>
              <h3 style={{ marginTop: 16 }}>Propuesta</h3>
              <ul>{BARRA.propuesta.map((t) => <li key={t}>{t}</li>)}</ul>
              <p style={{ margin: "12px 0 0", fontSize: ".8rem", color: "#5E5A68" }}><code>{BARRA.archivo}</code></p>
            </div>
            <BarraDeMuestra />
          </div>
        </section>

        <section className="gf-seccion" id="guia-bloques">
          <h2>Bloques de la página pública</h2>
          <p>Los 22 bloques que arma cada página. Casi todos tienen su versión «viva» de motion-kit; con los temas Cómic y Anime, todos ganarían la viñeta.</p>
          <div style={{ overflowX: "auto" }}>
            <table className="gf-tabla">
              <thead><tr><th>Bloque</th><th>Versiones</th><th>Versión viva (motion-kit)</th><th>Con el tema Cómic</th></tr></thead>
              <tbody>
                {BLOQUES.map((b) => (
                  <tr key={b.nombre}>
                    <td><strong>{b.nombre}</strong></td>
                    <td>{b.versiones}</td>
                    <td>{b.viva || <span style={{ color: "#d64545", fontWeight: 700 }}>No tiene</span>}</td>
                    <td>Viñeta, título cartel y la mano al botón</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="gf-seccion" id="guia-ordenar">
          <h2>Para cambiar todo en un solo lugar</h2>
          <p>Lo que conviene ordenar en el front para que, después, cambiar el look de todo el panel sea tocar una pieza o un tema y no cada pantalla.</p>
          <ul className="gf-ordenar">{PARA_ORDENAR.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      </div>
    </div>
  );
}
