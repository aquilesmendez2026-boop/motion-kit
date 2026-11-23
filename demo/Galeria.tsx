import { useState, type CSSProperties } from "react";
import { EFECTOS, EfectoPagina, type EfectoId, type Variante } from "../src";

const PALETAS: Record<string, { acento: string; fondo: string; superficie: string; texto: string }> = {
  clásica: { acento: "#7c5cff", fondo: "#ffffff", superficie: "#f4f2ff", texto: "#1b1730" },
  noche: { acento: "#8ab4ff", fondo: "#0f1420", superficie: "#182033", texto: "#eef2ff" },
  terracota: { acento: "#c8553d", fondo: "#fbf3ec", superficie: "#f3e2d4", texto: "#3a2018" },
  océano: { acento: "#0e7c9b", fondo: "#eefafd", superficie: "#d6f0f7", texto: "#07303c" },
};

export function Galeria() {
  const [variante, setVariante] = useState<Variante>(1);
  const [paleta, setPaleta] = useState("clásica");
  const p = PALETAS[paleta];
  const vars = {
    "--lm-acento": p.acento,
    "--lm-fondo": p.fondo,
    "--lm-superficie": p.superficie,
    background: p.fondo,
    color: p.texto,
  } as CSSProperties;

  return (
    <main className="galeria" style={vars} data-testid="galeria">
      <header className="galeria-barra">
        <a href="#">← Demo</a>
        <h1>Efectos protagonistas</h1>
        <div role="group" aria-label="Variante">
          {([1, 2, 3] as Variante[]).map((v) => (
            <button key={v} aria-pressed={variante === v} onClick={() => setVariante(v)}>
              Variante {v}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Paleta">
          {Object.keys(PALETAS).map((n) => (
            <button key={n} aria-pressed={paleta === n} onClick={() => setPaleta(n)}>
              {n}
            </button>
          ))}
        </div>
      </header>
      <div className="galeria-rejilla">
        {(Object.keys(EFECTOS) as EfectoId[]).map((id) => (
          <section key={id} className="galeria-tarjeta" data-efecto={id} style={{ background: p.superficie }}>
            <EfectoPagina id={id} variante={variante} />
            <div className="galeria-texto">
              <strong>{EFECTOS[id].nombre}</strong>
              <span>
                {EFECTOS[id].familia} · {EFECTOS[id].rubros.join(", ")}
              </span>
            </div>
          </section>
        ))}
        <section className="galeria-tarjeta" data-efecto="no-existe" style={{ background: p.superficie }}>
          <EfectoPagina id="no-existe" />
          <div className="galeria-texto"><strong>id desconocido</strong><span>no dibuja nada</span></div>
        </section>
      </div>
    </main>
  );
}
