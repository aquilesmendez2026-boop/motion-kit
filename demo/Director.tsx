// Vitrina del Director (fase 1 del motor de animación): seis partituras de ejemplo. Cada una es un dato: se ve, se
// repite y se edita aquí mismo. `#director?d=…` muestra una sola, con lo que pida la prueba genérica.
import { useState, type ReactNode } from "react";
import { ConPartitura, validarPartitura, type ErrorPartitura, type Montaje, type Nivel, type Partitura } from "../src/entradas/director";
import { PARTITURAS, type PartituraDeEjemplo } from "../src/director/partituras";

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
    que: "Con la vista: tres capas se mueven distinto al cruzar la pantalla y la frase se enciende palabra por palabra.",
    escenario: () => (
      <div className="dir-paralaje">
        <div className="dir-capa dir-fondo" data-mk-parte="fondo" aria-hidden="true" />
        <div className="dir-capa dir-medio" data-mk-parte="medio" aria-hidden="true" />
        <div className="dir-capa dir-frente" data-mk-parte="frente" aria-hidden="true">☕</div>
        <p className="dir-frase" data-mk-parte="frase">Cada taza empieza mucho antes de llegar a tu mesa.</p>
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
      setPartitura(r.partitura);
      setVez((v) => v + 1);
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
        <summary>Ver y editar el dato ({texto.length} letras)</summary>
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
        El motor de animación propio (fase 1). Cada movimiento es un dato, una <strong>partitura</strong>: abre «Ver y editar el dato» y cámbiale un número.
        Versión 0, experimental.
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
      </div>
    </main>
  );
}
