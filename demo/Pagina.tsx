import { useState, type ReactNode } from "react";
import {
  CodigoQR, Encabezado, Estilo, EstiloLaMente, ESTILOS, ESTILO_IDS, PALETAS_LAMENTE, PALETA_LAMENTE_IDS, TEMAS_LAMENTE,
  TEMA_LAMENTE_IDS, recetaAProps, type EstiloId, type PaletaLaMente, type TemaLaMente,
} from "../src";
import { PaginaRelato } from "../src/relatos/PaginaRelato";
import { Relato } from "../src/relatos/Relato";
import { FraseRelato } from "../src/relatos/FraseRelato";
import { RELATOS, RELATOS_DE_BLOQUE, RELATOS_DE_PAGINA, RELATO_DE_ESTILO, type RelatoBloqueId, type RelatoPaginaId } from "../src/relatos/catalogo";
import { normalizarPagina, relatoDeBloque, validarPagina, type RecetaPagina } from "../src/relatos/receta-pagina";
import { codificar, decodificar, enlaceDe, type ConfigVista } from "./compartir";

const BLOQUES = ["historia", "carta", "galeria", "resenas", "contacto"] as const;
type IdBloque = (typeof BLOQUES)[number];
const NOMBRES: Record<IdBloque, string> = { historia: "Historia", carta: "Carta", galeria: "Galería", resenas: "Reseñas", contacto: "Contacto" };

/** El contenido de ejemplo de cada bloque, con sus partes marcadas. El contacto va sin marcas. */
function contenido(id: IdBloque): ReactNode {
  switch (id) {
    case "historia":
      return (
        <>
          <h2>Nuestra historia</h2>
          <p data-mk-parte="linea">Todo partió en un food truck, en 2016.</p>
          <p data-mk-parte="linea">Una plancha, dos amigos y una receta que no cambió.</p>
          <p data-mk-parte="linea">Hoy seguimos aplastando cada carne al momento.</p>
          <FraseRelato className="pag-frase" texto="Cada carne se aplasta al momento, en la misma plancha desde 2016." />
          <div className="pag-foto" data-mk-parte="foto" />
        </>
      );
    case "carta":
      return (
        <>
          <h2>La carta</h2>
          <div className="pag-cartas">
            {["Clásica · $7.900", "Doble · $9.900", "Veggie · $8.500", "Papas · $3.500", "Shake · $4.200", "Combo · $12.900"].map((t) => (
              <div key={t} className="pag-carta" data-mk-parte="tarjeta"><i />{t}</div>
            ))}
          </div>
        </>
      );
    case "galeria":
      return (
        <>
          <h2>Galería</h2>
          <div className="pag-galeria">
            {["La plancha", "Doble queso", "Papas", "El local", "Noche de rock"].map((t) => <div key={t} className="pag-cuadro" data-mk-parte="foto">{t}</div>)}
          </div>
        </>
      );
    case "resenas":
      return (
        <>
          <h2>Lo que dicen</h2>
          <div className="pag-cartas">
            {["«La mejor smash de Ñuñoa.» — Cami", "«Volvería solo por las papas.» — Nico", "«Rápidos y amables.» — Fran"].map((t) => (
              <blockquote key={t} className="pag-carta" data-mk-parte="tarjeta">{t}</blockquote>
            ))}
          </div>
        </>
      );
    case "contacto":
      return (
        <>
          <h2>¿Con hambre?</h2>
          <p>Jueves a domingo, hasta las 00:00. Av. Irarrázaval 1234.</p>
          <a className="pag-btn" href="#pagina">Pedir por WhatsApp</a>
        </>
      );
  }
}

const elige = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];

/** #pagina: el encabezado y el resto de la página con sus relatos; la receta de página validada y el QR. */
export function Pagina({ d }: { d?: string }) {
  const inicial = d ? normalizarPagina(decodificar(d)) : null;
  const [estilo, setEstilo] = useState<EstiloId>(inicial?.encabezado.estilo ?? "neon");
  const [lmTema, setLmTema] = useState<TemaLaMente | "">("");
  const [lmPaleta, setLmPaleta] = useState<PaletaLaMente>("clasica");
  const [relato, setRelato] = useState<RelatoBloqueId | "">(inicial?.relato ?? "");
  const [relatoPagina, setRelatoPagina] = useState<RelatoPaginaId | "">(inicial?.relatoPagina ?? "");
  const [estela, setEstela] = useState(Boolean(inicial?.estela));
  const [porBloque, setPorBloque] = useState<Record<IdBloque, RelatoBloqueId | "ninguno" | "">>(() =>
    Object.fromEntries(BLOQUES.map((id) => [id, inicial?.bloques?.find((b) => b.id === id)?.relato ?? ""])) as Record<IdBloque, RelatoBloqueId | "ninguno" | "">);

  const encabezado = {
    version: 1, estilo, composicion: "izquierda", entrada: "cascada", antetitulo: "Smash burgers · Ñuñoa", titulo: "Doble carne, *doble* queso",
    bajada: "Pan brioche, papas cortadas a mano y salsas de la casa.", botones: [{ texto: "Pedir ahora", href: "#pagina" }, { texto: "Ver la carta", href: "#pagina" }],
    datos: ["Jue a dom", "Hasta las 00:00"], alto: "grande",
  };
  const cruda = {
    version: 1, encabezado, ...(relato ? { relato } : {}), ...(relatoPagina ? { relatoPagina } : {}), ...(estela ? { estela: true } : {}),
    bloques: BLOQUES.filter((id) => porBloque[id]).map((id) => ({ id, relato: porBloque[id] })),
  };
  const resultado = validarPagina(cruda);
  const pagina: RecetaPagina = resultado.ok ? resultado.pagina : normalizarPagina(cruda);
  const enlace = enlaceDe(`#pagina?d=${codificar(pagina as unknown as ConfigVista)}`);

  const sorprendeme = () => {
    const e = elige(ESTILO_IDS);
    setEstilo(e);
    setRelato(Math.random() < 0.5 ? "" : elige(RELATOS_DE_BLOQUE));
    setRelatoPagina(elige(["", "", ...RELATOS_DE_PAGINA] as const));
    setPorBloque(Object.fromEntries(BLOQUES.map((id) => {
      const quedan = RELATOS_DE_BLOQUE.filter((r) => RELATOS[r].para.includes(id) || RELATOS[r].para.includes("cualquiera"));
      return [id, Math.random() < 0.4 ? "" : elige(quedan)];
    })) as Record<IdBloque, RelatoBloqueId | "">);
  };

  const vista = (
    <Marco tema={lmTema} paleta={lmPaleta} estilo={estilo}>
      {/* La figura y la semilla de esta hamburguesería (las usan los hilos: rulos, hebras, figura, rastro, enredadera y ramas). */}
      <PaginaRelato relato={pagina.relato} relatoPagina={pagina.relatoPagina} estela={pagina.estela} figura="hamburguesa" semilla="smash-burgers">
        <Encabezado {...recetaAProps(pagina.encabezado)} />
        {BLOQUES.map((id) => (
          <Relato key={id} modo={relatoDeBloque(pagina, id)} className="pag-blq" data-bloque={id}>{contenido(id)}</Relato>
        ))}
      </PaginaRelato>
    </Marco>
  );
  if (d) return <div className="pag-sola">{vista}</div>;

  const opcion = (r: RelatoBloqueId) => <option key={r} value={r}>{RELATOS[r].nombre}</option>;
  return (
    <div className="pag-editor">
      <aside className="estudio-panel">
        <a href="#">← Demo</a>
        <h1>Página completa</h1>
        <p className="enc-nota">El encabezado propone cómo se cuenta la página al bajar; cada bloque puede usar otro relato.</p>
        <button className="enc-azar" onClick={sorprendeme} data-prueba="sorprendeme">🎲 Sorpréndeme</button>
        <fieldset><legend>Estilo</legend>
          <div className="estudio-chips">{ESTILO_IDS.map((e) => <button key={e} aria-pressed={estilo === e} onClick={() => setEstilo(e)}>{ESTILOS[e].nombre}</button>)}</div>
        </fieldset>
        <fieldset><legend>Tema y paleta de La Mente</legend>
          <label>Tema
            <select value={lmTema} onChange={(e) => { const v = e.target.value as TemaLaMente | ""; setLmTema(v); if (v) setLmPaleta(TEMAS_LAMENTE[v].paleta); }}>
              <option value="">Sin La Mente</option>
              {TEMA_LAMENTE_IDS.map((t) => <option key={t} value={t}>{TEMAS_LAMENTE[t].nombre}</option>)}
            </select>
          </label>
          {lmTema && (
            <label>Paleta
              <select value={lmPaleta} onChange={(e) => setLmPaleta(e.target.value as PaletaLaMente)}>
                {PALETA_LAMENTE_IDS.map((p) => <option key={p} value={p}>{PALETAS_LAMENTE[p].nombre}</option>)}
              </select>
            </label>
          )}
        </fieldset>
        <fieldset><legend>Cómo se cuenta</legend>
          <label>Relato de la página
            <select value={relato} onChange={(e) => setRelato(e.target.value as RelatoBloqueId | "")} data-prueba="relato">
              <option value="">El del estilo ({RELATOS[RELATO_DE_ESTILO[estilo]].nombre})</option>
              {RELATOS_DE_BLOQUE.map(opcion)}
            </select>
          </label>
          <label>De fondo
            <select value={relatoPagina} onChange={(e) => setRelatoPagina(e.target.value as RelatoPaginaId | "")} data-prueba="relato-pagina">
              <option value="">Nada</option>
              {RELATOS_DE_PAGINA.map((r) => <option key={r} value={r}>{RELATOS[r].nombre}</option>)}
            </select>
          </label>
          <label className="estudio-check"><input type="checkbox" checked={estela} onChange={(e) => setEstela(e.target.checked)} data-prueba="estela" /> Estela y chispas (el cursor deja estela; un toque suelta chispas)</label>
          {BLOQUES.map((id) => (
            <label key={id}>{NOMBRES[id]}
              <select value={porBloque[id]} onChange={(e) => setPorBloque({ ...porBloque, [id]: e.target.value as RelatoBloqueId | "ninguno" | "" })} data-prueba={`relato-${id}`}>
                <option value="">El de la página</option>
                <option value="ninguno">Ninguno (quieto)</option>
                {RELATOS_DE_BLOQUE.map(opcion)}
              </select>
            </label>
          ))}
        </fieldset>
        <fieldset className="enc-qr"><legend>Probar en tu teléfono</legend>
          <CodigoQR texto={enlace.url} tam={168} />
          <small>{enlace.nota}</small>
          <a href={enlace.url} target="_blank" rel="noreferrer" data-prueba="enlace-pagina">Abrir la página sola</a>
        </fieldset>
        <details><summary>Lo que se guarda (receta de página, JSON)</summary>
          {!resultado.ok && <ul className="enc-errores">{resultado.errores.map((e) => <li key={e.campo + e.mensaje}><b>{e.campo}</b>: {e.mensaje}</li>)}</ul>}
          <pre data-prueba="json-pagina" data-valida={resultado.ok ? "" : undefined}>{JSON.stringify(resultado.ok ? resultado.pagina : cruda, null, 2)}</pre>
        </details>
      </aside>
      <main className="pag-vista">{vista}</main>
    </div>
  );
}

/** Con tema de La Mente, la página se viste con su paleta y su letra; si no, con los colores del estilo. */
function Marco({ tema, paleta, estilo, children }: { tema: TemaLaMente | ""; paleta: PaletaLaMente; estilo: EstiloId; children: ReactNode }) {
  return tema
    ? <EstiloLaMente tema={tema} paleta={paleta} base={estilo} fuentes>{children}</EstiloLaMente>
    : <Estilo nombre={estilo} fuentes textura={false}>{children}</Estilo>;
}
