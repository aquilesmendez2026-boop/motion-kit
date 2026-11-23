import { useState, type CSSProperties } from "react";
import {
  Boton, Tarjeta, TarjetaMedia, TarjetaCuerpo, TarjetaVolteable, Movimiento, MOVIMIENTOS,
  Presencia, CambioContenido, TRANSICIONES,
  type BotonVariante, type BotonEfecto, type MovimientoId, type TransicionId, type TarjetaVariante,
} from "../src";

const PALETAS: Record<string, Record<string, string>> = {
  clásica: { acento: "#7c5cff", fondo: "#ffffff", superficie: "#f4f2ff", texto: "#1b1730", sobre: "#ffffff" },
  noche: { acento: "#8ab4ff", fondo: "#0f1420", superficie: "#182033", texto: "#eef2ff", sobre: "#0f1420" },
  terracota: { acento: "#c8553d", fondo: "#fbf3ec", superficie: "#f3e2d4", texto: "#3a2018", sobre: "#ffffff" },
  océano: { acento: "#0e7c9b", fondo: "#eefafd", superficie: "#d6f0f7", texto: "#07303c", sobre: "#ffffff" },
};

const VARIANTES: BotonVariante[] = ["solido", "contorno", "suave", "fantasma", "degradado", "vidrio"];
const EFECTOS: [BotonEfecto, BotonVariante][] = [
  ["elevar", "solido"], ["relleno", "contorno"], ["brillo", "degradado"], ["flecha", "solido"],
  ["deslizar", "suave"], ["latido", "solido"], ["borde", "solido"],
];
const TARJETAS: TarjetaVariante[] = ["plana", "elevada", "borde", "vidrio", "acento"];
const imagen = (h: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 70% 62%)"/><stop offset="1" stop-color="hsl(${h + 50} 70% 42%)"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><circle cx="250" cy="60" r="34" fill="#fff" opacity=".35"/><path d="M0 200 L90 110 L150 160 L220 90 L320 190 V200Z" fill="#000" opacity=".18"/></svg>`)}`;

export function Piezas() {
  const [paleta, setPaleta] = useState("clásica");
  const [repetir, setRepetir] = useState(0);
  const [tipo, setTipo] = useState<TransicionId>("subir");
  const [abierto, setAbierto] = useState(true);
  const [paso, setPaso] = useState(0);
  const [sentido, setSentido] = useState<1 | -1>(1);
  const [cargando, setCargando] = useState(false);
  const p = PALETAS[paleta];
  const vars = {
    "--lm-acento": p.acento, "--lm-fondo": p.fondo, "--lm-superficie": p.superficie, "--lm-sobre-acento": p.sobre,
    background: p.fondo, color: p.texto,
  } as CSSProperties;
  const ir = (d: 1 | -1) => { setSentido(d); setPaso((n) => (n + d + 3) % 3); };

  return (
    <main className="piezas" style={vars}>
      <header className="galeria-barra">
        <a href="#">← Demo</a>
        <h1>Botones, tarjetas, movimientos y transiciones</h1>
        <div role="group" aria-label="Paleta">
          {Object.keys(PALETAS).map((n) => (
            <button key={n} aria-pressed={paleta === n} onClick={() => setPaleta(n)}>{n}</button>
          ))}
        </div>
      </header>

      <section id="botones" className="piezas-seccion">
        <h2>Botones</h2>
        <h3>Estilos</h3>
        <div className="piezas-fila">
          {VARIANTES.map((v) => <Boton key={v} variante={v}>{v}</Boton>)}
        </div>
        <h3>Efectos (pasa el mouse)</h3>
        <div className="piezas-fila">
          {EFECTOS.map(([e, v]) => <Boton key={e} variante={v} efecto={e} data-prueba={`efecto-${e}`}>{e}</Boton>)}
        </div>
        <h3>Tamaños, carga y enlace</h3>
        <div className="piezas-fila">
          <Boton tamano="sm">Chico</Boton>
          <Boton>Mediano</Boton>
          <Boton tamano="lg" efecto="flecha">Grande</Boton>
          <Boton cargando={cargando} data-prueba="carga" onClick={() => { setCargando(true); setTimeout(() => setCargando(false), 1600); }}>Pagar</Boton>
          <Boton href="#piezas" variante="contorno">Soy un enlace</Boton>
          <Boton disabled>Desactivado</Boton>
        </div>
        <div className="piezas-fila"><Boton completo efecto="brillo" variante="degradado">Reservar hora</Boton></div>
      </section>

      <section id="tarjetas" className="piezas-seccion">
        <h2>Tarjetas</h2>
        <div className="piezas-rejilla">
          {TARJETAS.map((v, i) => (
            <Tarjeta key={v} variante={v} efecto={["elevar", "zoom"]} imagen={imagen(200 + i * 40)} data-prueba={`tarjeta-${v}`}>
              <TarjetaCuerpo><h3>{v}</h3><p>Se eleva y la imagen se acerca.</p></TarjetaCuerpo>
            </Tarjeta>
          ))}
          <Tarjeta variante="elevada" efecto="brillo" imagen={imagen(20)}>
            <TarjetaCuerpo><h3>Brillo</h3><p>Un destello la cruza.</p></TarjetaCuerpo>
          </Tarjeta>
          <Tarjeta variante="borde" efecto="resplandor" href="#tarjetas">
            <TarjetaMedia><div style={{ height: "100%", background: "linear-gradient(135deg,var(--lm-acento),transparent)" }} /></TarjetaMedia>
            <TarjetaCuerpo><h3>Resplandor (enlace)</h3><p>Toda la tarjeta es un enlace.</p></TarjetaCuerpo>
          </Tarjeta>
          <Tarjeta variante="elevada" imagen={imagen(300)} revelar={<Boton tamano="sm" efecto="flecha">Ver producto</Boton>}>
            <TarjetaCuerpo><h3>Revelar</h3><p>Aparece una acción desde abajo.</p></TarjetaCuerpo>
          </Tarjeta>
          <TarjetaVolteable
            data-prueba="volteable"
            frente={<Tarjeta variante="acento" style={{ height: "100%" }}><TarjetaCuerpo><h3>Volteable</h3><p>Tócala o usa el botón.</p></TarjetaCuerpo></Tarjeta>}
            dorso={<Tarjeta variante="plana" style={{ height: "100%" }}><TarjetaCuerpo><h3>Dorso</h3><p>Precio, horario o lo que quieras.</p><Boton tamano="sm">Reservar</Boton></TarjetaCuerpo></Tarjeta>}
          />
        </div>
      </section>

      <section id="movimientos" className="piezas-seccion">
        <h2>Movimientos <Boton tamano="sm" variante="suave" onClick={() => setRepetir((n) => n + 1)}>Repetir</Boton></h2>
        {(["entrada", "atencion"] as const).map((g) => (
          <div key={g}>
            <h3>{g === "entrada" ? "Entradas" : "Para llamar la atención"}</h3>
            <div className="piezas-mov">
              {(Object.keys(MOVIMIENTOS) as MovimientoId[]).filter((id) => MOVIMIENTOS[id].grupo === g).map((id) => (
                <div key={id} className="piezas-mov-caja" data-prueba={`mov-${id}`}>
                  <Movimiento key={repetir} tipo={id} cuando="siempre" className="piezas-mov-figura">●</Movimiento>
                  <span>{MOVIMIENTOS[id].nombre}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section id="transiciones" className="piezas-seccion">
        <h2>Transiciones</h2>
        <div className="piezas-fila" role="group" aria-label="Tipo de transición">
          {(Object.keys(TRANSICIONES) as TransicionId[]).map((t) => (
            <Boton key={t} tamano="sm" variante={tipo === t ? "solido" : "contorno"} aria-pressed={tipo === t} onClick={() => setTipo(t)}>{TRANSICIONES[t].nombre}</Boton>
          ))}
        </div>
        <div className="piezas-rejilla">
          <div className="piezas-escenario">
            <Boton data-prueba="alternar" onClick={() => setAbierto((v) => !v)}>{abierto ? "Ocultar" : "Mostrar"}</Boton>
            <Presencia visible={abierto} tipo={tipo} data-prueba="presencia">
              <Tarjeta variante="plana"><TarjetaCuerpo><h3>Presencia</h3><p>Entra y sale animada antes de quitarse.</p></TarjetaCuerpo></Tarjeta>
            </Presencia>
          </div>
          <div className="piezas-escenario">
            <div className="piezas-fila">
              <Boton variante="suave" onClick={() => ir(-1)}>Anterior</Boton>
              <Boton data-prueba="siguiente" onClick={() => ir(1)}>Siguiente</Boton>
            </div>
            <CambioContenido clave={paso} tipo={tipo} sentido={sentido} data-prueba="cambio">
              <Tarjeta variante="borde"><TarjetaCuerpo><h3>Paso {paso + 1} de 3</h3><p>{["Elige el servicio.", "Elige el día.", "Confirma tus datos."][paso]}</p></TarjetaCuerpo></Tarjeta>
            </CambioContenido>
          </div>
        </div>
      </section>
    </main>
  );
}
