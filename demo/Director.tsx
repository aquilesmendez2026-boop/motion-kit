// Vitrina del Director (el motor de animación): seis partituras de ejemplo y las de la casa. Cada una es un dato: se
// ve, se repite y se edita aquí mismo, en español o como JSON. `#director?d=…` muestra una sola, con lo que pida la
// prueba genérica.
import { useState, type ReactNode } from "react";
import { ConPartitura, validarPartitura, type ErrorPartitura, type Montaje, type Nivel, type Partitura } from "../src/entradas/director";
import { PARTITURAS, type PartituraDeEjemplo } from "../src/director/partituras";
// Lo de quien crea (en el paquete, `motion-kit/partitura`): el lenguaje, las partituras de la casa y «Sorpréndeme».
import { CASA, escribirPartitura, leerPartitura, sorprender, type DeLaCasa, type ErrorTexto } from "../src/entradas/partitura";
import { TextoCinetico } from "../src/estilos/TextoCinetico";
import type { TextoEfecto } from "../src/estilos/estilos";

/** Lo que cambia en un escenario desde afuera (para las pruebas). */
interface Extra {
  titulo: string;
}

const TARJETAS = ["Flat white", "Cortado", "Filtrado", "Espresso tónica", "Cold brew", "Mocaccino"];

const EJEMPLOS: Record<PartituraDeEjemplo, { titulo: string; que: string; escenario: (x: Extra) => ReactNode }> = {
  portada: {
    titulo: "Portada",
    que: "Al verse: el título sube palabra por palabra y lo demás entra en cascada. Al bajar: el contenido se apaga y sube.",
    escenario: ({ titulo }) => (
      <div className="dir-portada" data-mk-parte="contenido">
        <p className="dir-ante" data-mk-parte="antetitulo">Tostaduría de barrio</p>
        <h2 className="dir-titulo" data-mk-parte="titulo">{titulo} <em>especialidad</em> en Ñuñoa</h2>
        <p data-mk-parte="bajada">Tostamos cada semana y lo llevamos a tu casa el mismo día.</p>
        <div className="dir-botones" data-mk-parte="botones">
          <a className="dir-boton" href="#director">Pedir café</a>
          <a className="dir-boton dir-linea" href="#director">Ver la carta</a>
        </div>
      </div>
    ),
  },
  tarjetas: {
    titulo: "Tarjetas",
    que: "Al verse (cada vez): el rótulo entra letra por letra y las tarjetas de a una, con el resorte del estilo.",
    escenario: () => (
      <>
        <h3 className="dir-rotulo" data-mk-parte="rotulo">Lo más pedido</h3>
        <div className="dir-grilla" data-mk-parte="grilla">
          {TARJETAS.map((t) => <a key={t} className="dir-tarjetita" href="#director">{t}</a>)}
        </div>
        <p className="dir-nota" data-mk-parte="nota">Todos los cafés se pueden pedir sin lactosa.</p>
      </>
    ),
  },
  paralaje: {
    titulo: "Paralaje",
    que: "Con la vista: al bajar, el sol y los cerros lejanos se quedan atrás y el primer plano se adelanta, como al mirar por una ventana. La frase se enciende palabra por palabra.",
    escenario: () => (
      <div className="dir-paralaje">
        <div className="dir-capa dir-sol" data-mk-parte="sol" aria-hidden="true" />
        <div className="dir-capa dir-fondo" data-mk-parte="fondo" aria-hidden="true" />
        <div className="dir-capa dir-medio" data-mk-parte="medio" aria-hidden="true" />
        <p className="dir-frase" data-mk-parte="frase">Cada taza empieza mucho antes de llegar a tu mesa.</p>
        <div className="dir-capa dir-frente" data-mk-parte="frente" aria-hidden="true"><span className="dir-taza">☕</span></div>
      </div>
    ),
  },
  iman: {
    titulo: "Imán",
    que: "Con el cursor: la tarjeta lo sigue con resorte y su brillo va al revés. Sobre el botón, se queda quieta.",
    escenario: () => (
      <div className="dir-iman">
        <div className="dir-socio" data-mk-parte="tarjeta">
          <span className="dir-brillo" data-mk-parte="brillo" aria-hidden="true" />
          <strong>Tarjeta de socio</strong>
          <span>10 sellos, un café gratis.</span>
          <a className="dir-boton" href="#director">Ver beneficios</a>
        </div>
      </div>
    ),
  },
  inercia: {
    titulo: "Inercia",
    que: "Con la velocidad del scroll: los bloques se inclinan y vuelven solos. Con el scroll: la barra avanza con la página.",
    escenario: () => (
      <>
        <div className="dir-barra" aria-hidden="true"><i data-mk-parte="avance" /></div>
        <div className="dir-fila">
          <div className="dir-bloque" data-mk-parte="izquierda">Tostamos</div>
          <div className="dir-bloque" data-mk-parte="centro">Molemos</div>
          <div className="dir-bloque" data-mk-parte="derecha">Servimos</div>
        </div>
      </>
    ),
  },
  boton: {
    titulo: "Botón",
    que: "Con el estado: se levanta al apuntarlo y se hunde al apretarlo. Movimientos chicos: no se escapa del dedo.",
    escenario: () => (
      <div className="dir-centro">
        <a className="dir-boton dir-grande" data-mk-parte="boton" href="#director"><span data-mk-parte="cara">Reservar una mesa</span></a>
      </div>
    ),
  },
};

const NOMBRES = Object.keys(EJEMPLOS) as PartituraDeEjemplo[];
const NIVELES: Nivel[] = ["completo", "liviano", "quieto"];

/** Un ejemplo de la galería: se ve, se repite y su dato se edita. */
function Tarjeta({ nombre, nivel }: { nombre: PartituraDeEjemplo; nivel: Nivel }) {
  const [vez, setVez] = useState(0);
  const [partitura, setPartitura] = useState<Partitura>(PARTITURAS[nombre]);
  const [texto, setTexto] = useState(() => JSON.stringify(PARTITURAS[nombre], null, 2));
  const [errores, setErrores] = useState<ErrorPartitura[]>([]);
  // La misma partitura, en español. Lo que se escribe en un lado se refleja en el otro.
  const [espanol, setEspanol] = useState(() => escribirPartitura(PARTITURAS[nombre]));
  const [erroresTexto, setErroresTexto] = useState<ErrorTexto[]>([]);
  const aplicar = (nueva: Partitura) => {
    setPartitura(nueva);
    setVez((v) => v + 1);
  };
  const editar = (t: string) => {
    setTexto(t);
    let dato: unknown;
    try {
      dato = JSON.parse(t);
    } catch {
      return setErrores([{ campo: "texto", mensaje: "No es JSON válido todavía." }]);
    }
    const r = validarPartitura(dato);
    setErrores(r.ok ? [] : r.errores);
    if (r.ok) {
      aplicar(r.partitura);
      setEspanol(escribirPartitura(r.partitura));
      setErroresTexto([]);
    }
  };
  const editarEspanol = (t: string) => {
    setEspanol(t);
    const r = leerPartitura(t);
    setErroresTexto(r.ok ? [] : r.errores);
    if (r.ok) {
      aplicar(r.partitura);
      setTexto(JSON.stringify(r.partitura, null, 2));
      setErrores([]);
    }
  };
  const e = EJEMPLOS[nombre];
  return (
    <section className="dir-ejemplo" data-prueba={`dir-${nombre}`}>
      <header>
        <div>
          <h2>{e.titulo}</h2>
          <p>{e.que}</p>
        </div>
        <button type="button" className="mom-repetir" onClick={() => setVez((v) => v + 1)}>Repetir</button>
      </header>
      <ConPartitura partitura={partitura} nivel={nivel} clave={vez} className="dir-escenario">
        {e.escenario({ titulo: "Café de" })}
      </ConPartitura>
      <details className="dir-dato">
        <summary>Ver y editar: en español o como dato ({texto.length} letras)</summary>
        <textarea value={espanol} onChange={(ev) => editarEspanol(ev.target.value)} spellCheck={false} aria-label={`Partitura de ${e.titulo}, en español`} rows={Math.min(16, espanol.split("\n").length + 1)} data-prueba="dir-espanol" />
        {erroresTexto.length > 0 && (
          <ul className="dir-errores" data-prueba="dir-errores-texto">
            {erroresTexto.slice(0, 6).map((x, i) => <li key={i}>Línea {x.linea}: {x.mensaje}</li>)}
          </ul>
        )}
        <textarea value={texto} onChange={(ev) => editar(ev.target.value)} spellCheck={false} aria-label={`Partitura de ${e.titulo}`} rows={14} />
        {errores.length > 0 && (
          <ul className="dir-errores" data-prueba="dir-errores">
            {errores.slice(0, 6).map((x, i) => <li key={i}><code>{x.campo}</code>: {x.mensaje}</li>)}
          </ul>
        )}
      </details>
    </section>
  );
}

const GRUPOS: Record<DeLaCasa["grupo"], string> = { texto: "Efectos de texto", encabezado: "Entradas del encabezado", momento: "Momentos", especial: "Nuevas, con inclinación" };

/** El escenario de una partitura de la casa, según su grupo: trae las partes que ella espera. */
function escenarioDeLaCasa(c: DeLaCasa): ReactNode {
  if (c.grupo === "texto") return <h2 className="dir-titulo" data-mk-parte="titulo">Café de especialidad en Ñuñoa</h2>;
  if (c.grupo === "momento") return EJEMPLOS.tarjetas.escenario({ titulo: "Café de" });
  if (c.id === "titulo-con-volumen") return <h2 className="dir-titulo dir-volumen" data-mk-parte="titulo">Café Luna</h2>;
  if (c.id === "tarjeta-holografica") return <div className="dir-holo">{EJEMPLOS.iman.escenario({ titulo: "Café de" })}</div>;
  return (
    <div className="dir-casa-portada">
      {EJEMPLOS.portada.escenario({ titulo: "Café de" })}
      <div className="dir-casa-media" data-mk-parte="media" aria-hidden="true">☕</div>
    </div>
  );
}

/** Las partituras de la casa: se elige una, se ve correr y se lee en español. Y «Sorpréndeme», que arma una entrada con una semilla. */
function DeLaCasaVitrina({ nivel }: { nivel: Nivel }) {
  const [id, setId] = useState(CASA[0].id);
  const [vez, setVez] = useState(0);
  const [semilla, setSemilla] = useState(0);
  const elegida = CASA.find((c) => c.id === id) ?? CASA[0];
  const sorpresa = semilla ? sorprender(semilla, ["antetitulo", "titulo", "bajada", "botones"]) : null;
  return (
    <>
      <section className="dir-ejemplo" data-prueba="dir-casa">
        <header>
          <div>
            <h2>De la casa</h2>
            <p>Los movimientos de siempre, escritos como partituras, y dos nuevos con inclinación. Sirven para elegir y combinar.</p>
          </div>
          <button type="button" className="mom-repetir" onClick={() => setVez((v) => v + 1)}>Repetir</button>
        </header>
        <label>
          Partitura{" "}
          <select value={id} onChange={(ev) => { setId(ev.target.value); setVez((v) => v + 1); }} data-prueba="dir-casa-elegir">
            {(Object.keys(GRUPOS) as DeLaCasa["grupo"][]).map((g) => (
              <optgroup key={g} label={GRUPOS[g]}>
                {CASA.filter((c) => c.grupo === g).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <ConPartitura partitura={elegida.partitura} nivel={nivel} clave={`${id}-${vez}`} className="dir-escenario" data-prueba="dir-casa-escenario">
          {escenarioDeLaCasa(elegida)}
        </ConPartitura>
        {elegida.nota && <p className="enc-nota">{elegida.nota}</p>}
        <pre className="dir-texto" data-prueba="dir-casa-texto">{escribirPartitura(elegida.partitura)}</pre>
      </section>
      <section className="dir-ejemplo" data-prueba="dir-sorpresa">
        <header>
          <div>
            <h2>Sorpréndeme</h2>
            <p>Arma una entrada para las partes de la página con una semilla. La misma semilla da siempre la misma.</p>
          </div>
          <button type="button" className="mom-repetir" data-prueba="dir-sorprender" onClick={() => setSemilla((n) => n + 1)}>Sorpréndeme</button>
        </header>
        <ConPartitura partitura={sorpresa} nivel={nivel} clave={semilla} className="dir-escenario">
          {EJEMPLOS.portada.escenario({ titulo: "Café de" })}
        </ConPartitura>
        <pre className="dir-texto" data-prueba="dir-sorpresa-texto">{sorpresa ? escribirPartitura(sorpresa) : "Aprieta «Sorpréndeme»."}</pre>
      </section>
    </>
  );
}

/** Para la prueba: el efecto de texto original y, al lado, la partitura de la casa que dice lo mismo, con reloj manual. */
function Comparar({ id }: { id: string }) {
  const c = CASA.find((x) => x.id === id && x.grupo === "texto");
  if (!c) return <p>No hay una partitura de texto con ese nombre.</p>;
  const guardar = (m: Montaje | null) => {
    (window as unknown as { __mkDirectores?: (Montaje | null)[] }).__mkDirectores = [m];
  };
  const frase = "Café de especialidad en Ñuñoa";
  return (
    <div className="dir-comparar">
      <div data-prueba="dir-original"><TextoCinetico como="h2" className="dir-titulo" texto={frase} efecto={id as TextoEfecto} cuando="siempre" /></div>
      <ConPartitura partitura={c.partitura} reloj="manual" alMontar={guardar} className="dir-escenario" data-prueba="dir-escenario">
        <h2 className="dir-titulo" data-mk-parte="titulo">{frase}</h2>
      </ConPartitura>
    </div>
  );
}

/** Lo que puede pedir `#director?d=…` (lo usa la prueba genérica). */
interface Pedido {
  ejemplo?: PartituraDeEjemplo;
  partitura?: Partitura;
  nivel?: Nivel;
  reloj?: "normal" | "manual";
  /** Cuántos escenarios iguales, uno bajo el otro. */
  veces?: number;
  /** Alto del espacio antes del escenario, en porcentaje del alto de la pantalla. */
  arriba?: number;
  /** Parte sin partitura (la página tal cual, para comparar). */
  sin?: boolean;
  /** Alto mínimo del escenario, en porcentaje del alto de la pantalla (para probar una raíz muy alta). */
  alto?: number;
  /** Sin el espacio de abajo: la página no tiene scroll. */
  corta?: boolean;
  /** Muestra un efecto de texto original y la partitura de la casa del mismo nombre, para compararlos. */
  comparar?: string;
}

function leer(d: string | undefined): Pedido {
  try {
    const x = JSON.parse(decodeURIComponent(escape(atob((d ?? "").replace(/-/g, "+").replace(/_/g, "/"))))) as Pedido;
    return x && typeof x === "object" ? x : {};
  } catch {
    return {};
  }
}

/** Un solo ejemplo, con espacio para bajar y los botones que usa la prueba. */
function Uno({ pedido }: { pedido: Pedido }) {
  if (pedido.comparar) return <Comparar id={pedido.comparar} />;
  return <UnEjemplo pedido={pedido} />;
}

function UnEjemplo({ pedido }: { pedido: Pedido }) {
  const nombre = pedido.ejemplo && pedido.ejemplo in EJEMPLOS ? pedido.ejemplo : "portada";
  const [titulo, setTitulo] = useState("Café de");
  const [montado, setMontado] = useState(true);
  const [dirigido, setDirigido] = useState(!pedido.sin);
  const [vez, setVez] = useState(0);
  const [fallas, setFallas] = useState(0);
  const veces = Math.max(1, Math.min(3, pedido.veces ?? 1));
  /** Los montajes quedan a mano para la prueba (reloj manual). */
  const guardar = (i: number) => (m: Montaje | null) => {
    const w = window as unknown as { __mkDirectores?: (Montaje | null)[] };
    (w.__mkDirectores ??= [])[i] = m;
  };
  return (
    <>
      <div style={{ height: `${Math.max(0, pedido.arriba ?? 0)}vh` }} data-prueba="dir-arriba" />
      {montado &&
        Array.from({ length: veces }, (_, i) => (
          <ConPartitura
            key={i}
            partitura={dirigido ? (pedido.partitura ?? PARTITURAS[nombre]) : null}
            nivel={pedido.nivel}
            reloj={pedido.reloj}
            clave={vez}
            alMontar={guardar(i)}
            alFallar={(e) => setFallas(e.length)}
            className="dir-escenario dir-solo"
            style={pedido.alto ? { minHeight: `${pedido.alto}vh`, alignContent: "start" } : undefined}
            data-prueba="dir-escenario"
          >
            {EJEMPLOS[nombre].escenario({ titulo })}
          </ConPartitura>
        ))}
      {!pedido.corta && <div className="dir-relleno" data-prueba="dir-abajo">Baja para ver lo que sigue al scroll.</div>}
      <nav className="dir-botonera">
        <button type="button" data-prueba="dir-repetir" onClick={() => setVez((v) => v + 1)}>Repetir</button>
        <button type="button" data-prueba="dir-cambiar-texto" onClick={() => setTitulo((t) => (t === "Café de" ? "Té y café de" : "Café de"))}>Cambiar el título</button>
        <button type="button" data-prueba="dir-desmontar" onClick={() => setMontado((m) => !m)}>{montado ? "Desmontar" : "Montar"}</button>
        <button type="button" data-prueba="dir-quitar" onClick={() => setDirigido((x) => !x)}>{dirigido ? "Quitar la partitura" : "Poner la partitura"}</button>
        <a href="#director">Todos</a>
        <output data-prueba="dir-fallas">{fallas}</output>
      </nav>
    </>
  );
}

export function Director({ d }: { d?: string }) {
  const [nivel, setNivel] = useState<Nivel>("completo");
  if (d !== undefined) return <main className="dir-demo dir-una"><Uno pedido={leer(d)} /></main>;
  return (
    <main className="dir-demo">
      <a href="#">← Demo</a>
      <h1>Director</h1>
      <p className="enc-nota">
        El motor de animación propio. Cada movimiento es un dato, una <strong>partitura</strong>: abre «Ver y editar» y cámbiale una frase en español, o un número en el dato.
      </p>
      <div className="mom-controles">
        <label>
          Nivel{" "}
          <select value={nivel} onChange={(e) => setNivel(e.target.value as Nivel)} data-prueba="dir-nivel">
            {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="dir-lista">
        {NOMBRES.map((n) => <Tarjeta key={n} nombre={n} nivel={nivel} />)}
        <DeLaCasaVitrina nivel={nivel} />
      </div>
    </main>
  );
}
