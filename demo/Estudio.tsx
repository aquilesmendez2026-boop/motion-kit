import { useState } from "react";
import {
  Boton, EFECTOS, ESTILOS, ESTILO_IDS, Estilo, EfectoPagina, RECETAS, TextoCinetico, Tarjeta, TarjetaCuerpo,
  sorprendeme, transicionVista, imagenGenerada,
  type BotonEfecto, type Combinacion, type EfectoId, type EstiloId, type TextoEfecto, type Variante,
} from "../src";

const TEXTOS: TextoEfecto[] = ["encender", "glitch", "maquina", "impacto", "temblor", "caer", "trailer", "onda"];
const BOTONES: BotonEfecto[] = ["elevar", "relleno", "brillo", "flecha", "deslizar", "latido", "borde"];

export function Estudio() {
  const [c, setC] = useState<Combinacion>(() => sorprendeme({ estilo: "neon", semilla: 7 }));
  const [titulo, setTitulo] = useState("Tu negocio, sorprendente");
  const [sonidos, setSonidos] = useState(false);
  const [repetir, setRepetir] = useState(0);
  const cambiar = (nuevo: Partial<Combinacion>, conVista = false) => {
    const sig = { ...c, ...nuevo };
    if (conVista) transicionVista(() => { setC(sig); setRepetir((n) => n + 1); }, ESTILOS[sig.estilo].vista);
    else { setC(sig); setRepetir((n) => n + 1); }
  };
  const elegirEstilo = (e: EstiloId) => {
    const d = ESTILOS[e];
    cambiar({ estilo: e, efecto: d.efectos[0], texto: d.texto[0], boton: d.boton.efecto === "ninguno" ? "flecha" : d.boton.efecto, vista: d.vista, transicion: d.transicion }, true);
  };
  const codigo = `<Estilo nombre="${c.estilo}">
  <section style={{ position: "relative" }}>
    <EfectoPagina id="${c.efecto}" variante={${c.variante}} />
    <TextoCinetico como="h1" efecto="${c.texto}" texto="${titulo}" />
    <Boton efecto="${c.boton}">Reservar</Boton>
  </section>
</Estilo>
// o: sorprendeme({ semilla: ${c.semilla} })`;

  return (
    <div className="estudio">
      <aside className="estudio-panel">
        <a href="#">← Demo</a>
        <h1>Estudio</h1>
        <Boton completo variante="degradado" efecto="brillo" data-prueba="sorprendeme" onClick={() => { const s = sorprendeme(); cambiar(s, s.estilo !== c.estilo); }}>
          🎲 Sorpréndeme
        </Boton>
        <fieldset><legend>Estilo</legend>
          <div className="estudio-chips">{ESTILO_IDS.map((e) => <button key={e} aria-pressed={c.estilo === e} onClick={() => elegirEstilo(e)}>{ESTILOS[e].nombre}</button>)}</div>
        </fieldset>
        <label>Título<input value={titulo} onChange={(e) => { setTitulo(e.target.value); }} onBlur={() => setRepetir((n) => n + 1)} /></label>
        <label>Efecto de fondo
          <select value={c.efecto} onChange={(e) => cambiar({ efecto: e.target.value as EfectoId })}>
            {(Object.keys(EFECTOS) as EfectoId[]).map((id) => <option key={id} value={id}>{EFECTOS[id].nombre}{ESTILOS[c.estilo].efectos.includes(id) ? " ★" : ""}</option>)}
          </select>
        </label>
        <label>Variante
          <select value={c.variante} onChange={(e) => cambiar({ variante: Number(e.target.value) as Variante })}>{[1, 2, 3].map((v) => <option key={v}>{v}</option>)}</select>
        </label>
        <label>Texto animado
          <select value={c.texto} onChange={(e) => cambiar({ texto: e.target.value as TextoEfecto })}>{TEXTOS.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label>Efecto del botón
          <select value={c.boton} onChange={(e) => cambiar({ boton: e.target.value as BotonEfecto })}>{BOTONES.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="estudio-check"><input type="checkbox" checked={sonidos} onChange={(e) => setSonidos(e.target.checked)} /> Sonidos al tocar</label>
        <details><summary>Código</summary><pre>{codigo}</pre></details>
        <p><a href="#encabezados">Editor de encabezados →</a></p>
        <h2>Plantillas completas</h2>
        <ul className="estudio-recetas">
          {RECETAS.map((r) => <li key={r.id}><a href={`#plantilla/${r.id}`}>{r.nombre}</a> <small>{ESTILOS[r.estilo].nombre}</small></li>)}
        </ul>
      </aside>
      <Estilo nombre={c.estilo} cursor sonidos={sonidos} vibracion={sonidos} fuentes className="estudio-vista" data-prueba="vista">
        <section className="estudio-portada">
          <EfectoPagina id={c.efecto} variante={c.variante} />
          <div className="estudio-portada-in" key={repetir}>
            <span className="estudio-lema">{ESTILOS[c.estilo].descripcion}</span>
            <TextoCinetico como="h1" efecto={c.texto} texto={titulo} cuando="siempre" />
            <div className="estudio-botones">
              <Boton tamano="lg" efecto={c.boton} variante={ESTILOS[c.estilo].boton.variante}>Reservar</Boton>
              <Boton tamano="lg" variante="fantasma">Ver más</Boton>
            </div>
          </div>
        </section>
        <section className="estudio-tarjetas">
          {[0, 1, 2].map((k) => (
            <Tarjeta key={k} variante={ESTILOS[c.estilo].tarjeta} efecto={["elevar", "zoom"]} imagen={imagenGenerada(c.estilo, 40 + k * 110)}>
              <TarjetaCuerpo><h3>{["Primero", "Segundo", "Tercero"][k]}</h3><p>Tarjeta con el estilo {ESTILOS[c.estilo].nombre.toLowerCase()}.</p></TarjetaCuerpo>
            </Tarjeta>
          ))}
        </section>
      </Estilo>
    </div>
  );
}
