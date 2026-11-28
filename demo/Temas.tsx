// La vitrina de temas (#temas, fase 2 de «Un solo motor»): todos los temas del catálogo, del panel y de la página, con
// las piezas de motion-kit y unas partes marcadas (cabeza, barra, hojas) para ver su firma. Su prueba es
// scripts/verificar-temas.mjs.
import { useState, type CSSProperties } from "react";
import { BotonQueGuarda, Campo, Confirmar, Copiar, Interruptor, useToast } from "../src/entradas/interfaz";
import { Globo, Vacio } from "../src/entradas/comic";
import { PALETAS, TEMAS, Tema, buscarTema } from "../src/entradas/temas";
import { TextoCinetico } from "../src/estilos/TextoCinetico";
import type { Para } from "../src/temas/tipos";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function TemasVitrina() {
  const toast = useToast();
  const [lado, setLado] = useState<Para>("panel");
  const [elegido, setElegido] = useState<Record<Para, string>>({ panel: "lamente", pagina: "clasico" });
  const [paleta, setPaleta] = useState("");
  const [preguntando, setPreguntando] = useState(false);
  const [activo, setActivo] = useState(true);
  const [texto, setTexto] = useState("");
  const id = elegido[lado];
  const tema = buscarTema(id, lado);
  const lista = TEMAS.filter((t) => t.para.includes(lado));
  const titulo = tema.movimiento?.titulo ?? "revelar";

  return (
    <div className="tm-pagina">
      <style>{CSS}</style>
      <header className="tm-arriba">
        <a href="#">← Demo</a>
        <h1>Temas</h1>
        <p>
          El catálogo de temas de motion-kit: {TEMAS.filter((t) => t.para.includes("panel")).length} del panel y {TEMAS.filter((t) => t.para.includes("pagina")).length} de la
          página, con {PALETAS.length} paletas. Cada tema declara todas sus variables <code>--mk-*</code> y monta su firma.
        </p>
        <div className="tm-lados" role="group" aria-label="Lado">
          {(["panel", "pagina"] as const).map((l) => (
            <button key={l} type="button" data-lado={l} aria-pressed={lado === l} onClick={() => setLado(l)}>
              {l === "panel" ? "Panel" : "Página"}
            </button>
          ))}
          {lado === "pagina" && (
            <label className="tm-paleta">
              Paleta
              <select value={paleta} onChange={(e) => setPaleta(e.target.value)}>
                <option value="">La del tema</option>
                {PALETAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="tm-selector" data-prueba="selector-temas" role="radiogroup" aria-label="Tema">
          {lista.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={t.id === id} data-tema-id={t.id} onClick={() => setElegido((e) => ({ ...e, [lado]: t.id }))}>
              {t.nombre}
            </button>
          ))}
        </div>
      </header>

      <Tema key={`${lado}-${id}`} tema={id} para={lado} paleta={lado === "pagina" ? paleta || undefined : undefined} className="tm-vista">
        <div className="tm-cabeza" data-mk-adorno="cabeza">
          <span className="tm-icono" data-mk-adorno="icono" aria-hidden="true">
            ✦
          </span>
          <div>
            <TextoCinetico key={id} texto={`Tema ${tema.nombre}`} efecto={titulo} como="h2" className="tm-titulo" data-mk-adorno="titulo" />
            <p className="tm-rubros">{tema.rubros?.length ? `Para ${tema.rubros.join(", ")}` : "Para cualquier negocio"}</p>
          </div>
        </div>

        <div className="tm-cuerpo">
          <nav className="tm-barra" data-mk-adorno="barra" aria-label="Secciones de muestra">
            <p className="tm-grupo" data-mk-adorno="grupo" style={{ "--mk-grupo": "#8b5cf6" } as CSSProperties}>
              Tu página
            </p>
            {["Página", "Precios", "Novedades"].map((s, i) => (
              <a key={s} href="#temas" className="tm-item" aria-current={i === 0 ? "page" : undefined} onClick={(e) => e.preventDefault()}>
                <span className="tm-icono-chico" data-mk-adorno="icono" aria-hidden="true">
                  {["🌐", "🏷️", "📰"][i]}
                </span>
                {s}
              </a>
            ))}
          </nav>

          <div className="tm-hojas">
            <section className="tm-hoja" data-mk-adorno="hoja">
              <h3 data-mk-adorno="titulo">Las piezas</h3>
              <div className="tm-fila">
                <BotonQueGuarda className="tm-boton" data-mk-adorno="boton" alGuardar={() => espera(600)}>
                  Guardar
                </BotonQueGuarda>
                <Copiar texto="https://lamente.cl/mi-negocio" className="tm-boton" data-mk-adorno="boton">
                  Copiar link
                </Copiar>
                <button type="button" className="tm-boton" data-mk-adorno="boton" onClick={() => setPreguntando(true)}>
                  Borrar
                </button>
                <button type="button" className="tm-boton" data-mk-adorno="boton" onClick={() => toast("Guardado.", { tipo: "bien" })}>
                  Un aviso
                </button>
              </div>
              <div className="tm-fila">
                <span className="tm-estado" data-mk-adorno="estado">
                  Activo
                </span>
                <Interruptor activo={activo} alCambiar={setActivo} etiqueta="Visible en la página" />
              </div>
              <Campo etiqueta="Qué haces, en una frase" ayuda="Sale bajo tu nombre.">
                {(a11y) => <input {...a11y} className="tm-entrada" value={texto} onChange={(e) => setTexto(e.target.value)} />}
              </Campo>
            </section>

            <section className="tm-hoja" data-mk-adorno="hoja">
              <h3 data-mk-adorno="titulo">Vacío y globos</h3>
              <Vacio titulo="Aún no hay nada" texto="Crea el primero." accion={<button type="button" className="tm-boton" data-mk-adorno="boton">Crear el primero</button>} />
              <Globo cola="abajo">¡Así se ve un globo!</Globo>
            </section>

            {lado === "panel" && (
              <section className="tm-hoja" data-mk-adorno="hoja">
                <h3 data-mk-adorno="titulo">La vista previa de la página</h3>
                <p className="tm-nota">Dentro del panel, la página no hereda su tema: tiene el suyo.</p>
                <Tema tema="clasico" para="pagina" className="tm-vista-pagina" data-prueba="vista-pagina">
                  <p data-mk-adorno="titulo">Mi negocio</p>
                  <Copiar texto="https://lamente.cl/mi-negocio" className="tm-boton">
                    Copiar
                  </Copiar>
                </Tema>
              </section>
            )}
          </div>
        </div>

        <Confirmar
          abierto={preguntando}
          pregunta="¿Borro la novedad?"
          detalle="Tus clientes dejarán de verla."
          textoSi="Sí, borrar"
          peligro
          alConfirmar={() => setPreguntando(false)}
          alCancelar={() => setPreguntando(false)}
        />
      </Tema>
    </div>
  );
}

// ——— Estilos (solo de la demo): leen las variables del tema ———
const CSS = `
.tm-pagina{min-height:100vh;background:#f4f2ee;color:#1c1a22;font-family:Inter,system-ui,sans-serif;overflow-x:clip}
.tm-arriba{max-width:1180px;margin:0 auto;padding:20px 16px 12px}
.tm-arriba h1{margin:.3em 0 .2em;font-size:clamp(1.8rem,5vw,2.6rem)}
.tm-arriba p{margin:0 0 12px;color:#5e5a68;max-width:70ch}
.tm-lados{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
.tm-lados button,.tm-selector button{min-height:44px;padding:0 16px;border:2px solid #1c1a22;border-radius:999px;background:#fff;font:inherit;font-weight:700;cursor:pointer}
.tm-lados button[aria-pressed=true],.tm-selector button[aria-checked=true]{background:#1c1a22;color:#fff}
.tm-paleta{display:inline-flex;align-items:center;gap:6px;font-weight:700}
.tm-paleta select{min-height:44px;border-radius:10px;padding:0 8px;font:inherit}
.tm-selector{display:flex;flex-wrap:wrap;gap:8px}
.tm-vista{box-sizing:border-box;min-height:70vh;padding:24px 16px 48px;background:var(--mk-fondo,#fff);color:var(--mk-texto,#1c1a22);font-family:var(--mk-fuente-texto,inherit)}
.tm-cabeza{max-width:1180px;margin:0 auto 20px;display:flex;align-items:center;gap:16px;padding:18px;background:var(--mk-superficie,#fff);border:var(--mk-trazo,1px solid #ddd);border-radius:var(--mk-radio-tarjeta,16px);box-shadow:var(--mk-sombra,none)}
.tm-icono{display:grid;place-items:center;flex:none;width:56px;height:56px;border:var(--mk-trazo,1px solid #ddd);border-radius:var(--mk-radio-icono,14px);background:var(--mk-cartel,#ffc83d);color:var(--mk-texto);font-size:1.6rem}
.tm-titulo{margin:0;font-family:var(--mk-fuente-cartel,var(--mk-fuente-titulo,inherit));font-size:clamp(1.6rem,6vw,2.6rem);line-height:1.05}
.tm-rubros{margin:4px 0 0;color:var(--mk-suave,#5e5a68)}
.tm-cuerpo{max-width:1180px;margin:0 auto;display:grid;gap:20px;grid-template-columns:1fr}
@media (min-width:860px){.tm-cuerpo{grid-template-columns:230px 1fr}}
.tm-barra{align-self:start;display:grid;gap:4px;padding:12px;background:var(--mk-superficie,#fff);border:var(--mk-trazo,1px solid #ddd);border-radius:var(--mk-radio-tarjeta,16px)}
.tm-grupo{margin:4px 8px;font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--mk-grupo,var(--mk-acento))}
.tm-item{position:relative;display:flex;align-items:center;gap:10px;min-height:44px;padding:0 10px;border-radius:var(--mk-radio-boton,10px);color:inherit;text-decoration:none;font-weight:600}
.tm-item[aria-current=page]{background:var(--mk-acento,#7c3aed);color:var(--mk-sobre-acento,#fff)}
.tm-icono-chico{display:grid;place-items:center;width:28px;height:28px;border-radius:var(--mk-radio-icono-chico,8px);background:color-mix(in srgb,var(--mk-acento,#7c3aed) 14%,transparent)}
.tm-hojas{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))}
.tm-hoja{display:grid;gap:14px;align-content:start;padding:18px;background:var(--mk-superficie,#fff);border:var(--mk-trazo,1px solid #ddd);border-radius:var(--mk-radio-tarjeta,16px);box-shadow:var(--mk-sombra,none)}
.tm-hoja h3{margin:0;font-family:var(--mk-fuente-titulo,inherit);font-size:1.15rem}
.tm-fila{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.tm-boton{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border:var(--mk-trazo,2px solid currentColor);border-radius:var(--mk-radio-boton,10px);background:var(--mk-superficie,#fff);color:var(--mk-texto,inherit);box-shadow:var(--mk-sombra-suave,none);font:inherit;font-weight:700;cursor:pointer}
.tm-boton:active{transform:var(--mk-hundir,none)}
.tm-estado{display:inline-flex;align-items:center;min-height:28px;padding:0 12px;border-radius:999px;background:var(--mk-cartel,#ffc83d);color:var(--mk-texto);font-size:.8rem;font-weight:800;border:2px solid transparent}
.tm-entrada{box-sizing:border-box;width:100%;min-height:44px;padding:0 12px;border:var(--mk-campo-borde,1.5px solid #ccc);border-radius:var(--mk-radio-campo,12px);background:var(--mk-superficie,#fff);font:inherit;color:inherit}
.tm-nota{margin:0;color:var(--mk-suave,#5e5a68);font-size:.9rem}
.tm-vista-pagina{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:14px;background:var(--mk-fondo,#fff);color:var(--mk-texto);border-radius:12px;border:1px dashed var(--mk-borde,#ccc)}
.tm-vista-pagina p{margin:0;font-family:var(--mk-fuente-titulo,inherit);font-weight:800}
`;
