// La vitrina de «Luz y materia»: una sola luz para la página y las superficies que le responden.
// `#luz` es la vitrina; `#luz?d=…` arma un caso para las pruebas (scripts/verificar-luz.mjs).
import { useState, type CSSProperties, type ReactElement } from "react";
import { Boton, Estilo, Tarjeta } from "../src";
import { CarruselGiratorio, LibroQueSeAbre } from "../src/momentos/perezosos-3";
import { Luz, MATERIAS, Materia, TarjetaHolografica, TituloConVolumen, luzDeLaHora, type FuenteLuz, type Punto, type TipoMateria } from "../src/entradas/luz";

/** Lo que pide una prueba. */
interface Pedido {
  caso?: string;
  sigue?: FuenteLuz[];
  rango?: number;
  desde?: Punto;
  /** Alto de la raíz, en pantallas (para poder bajar). */
  alto?: number;
  /** Espacio antes de la raíz, en pantallas (para que parta fuera de la vista). */
  arriba?: number;
  /** «noche»: una página oscura que no le dice nada a las materias (ni su color ni el de su texto). */
  fondo?: "claro" | "oscuro" | "noche";
  /** Para la materia «rara» del caso: datos que no existen. */
  tipo?: TipoMateria;
  altura?: number;
  inclina?: number;
}

function leerPedido(d: string | undefined): Pedido | null {
  if (d === undefined) return null;
  try {
    const x = JSON.parse(decodeURIComponent(escape(atob(d.replace(/-/g, "+").replace(/_/g, "/"))))) as Pedido;
    return x && typeof x === "object" ? x : {};
  } catch {
    return {};
  }
}

/** Caso «luz»: una luz con algo adentro, otra luz adentro de ella y un botón para desmontar. */
function CasoLuz({ pedido }: { pedido: Pedido }) {
  const [montada, setMontada] = useState(true);
  return (
    <>
      {pedido.arriba ? <div style={{ height: `${pedido.arriba}vh` }} /> : null}
      {montada && (
        <Luz sigue={pedido.sigue} rango={pedido.rango} desde={pedido.desde} data-prueba="luz-raiz" className="luz-caso" style={pedido.alto ? { minHeight: `${pedido.alto}vh` } : undefined}>
          <p data-prueba="luz-dentro">Lo que está adentro ve la luz.</p>
          <Luz sigue={[]} desde={{ x: 0.6, y: -0.5 }} data-prueba="luz-anidada">
            <p data-prueba="luz-dentro-2">Y aquí manda otra.</p>
          </Luz>
        </Luz>
      )}
      <nav className="dir-botonera">
        <button type="button" data-prueba="luz-desmontar" onClick={() => setMontada((m) => !m)}>{montada ? "Desmontar" : "Montar"}</button>
      </nav>
    </>
  );
}

const NOMBRES: Record<TipoMateria, string> = { papel: "Papel", mate: "Mate", vidrio: "Vidrio", metal: "Metal", holografico: "Holográfico" };
const TEXTO = "Un texto de prueba sobre la superficie, lo bastante largo para medir su contraste.";

/** Caso «materia»: las cinco superficies y sus variantes, dentro de una luz; y una afuera. */
function CasoMateria({ pedido }: { pedido: Pedido }) {
  return (
    <>
      <Luz sigue={pedido.sigue} rango={pedido.rango} desde={pedido.desde} data-prueba="luz-raiz" className="luz-caso luz-grilla" style={pedido.alto ? { minHeight: `${pedido.alto}vh`, alignContent: "center" } : undefined}>
        {MATERIAS.map((t) => (
          <Materia key={t} tipo={t} data-prueba={`mat-${t}`}>
            <h3>{NOMBRES[t]}</h3>
            <p data-prueba="mat-texto">{TEXTO}</p>
          </Materia>
        ))}
        <Materia altura={3} data-prueba="mat-alta"><h3>Alta</h3><p>Altura 3.</p></Materia>
        <Materia altura={0} data-prueba="mat-pegada"><h3>Pegada</h3><p>Altura 0.</p></Materia>
        <Materia como="button" type="button" data-prueba="mat-boton">Un botón de verdad</Materia>
        <Materia como="button" type="button" disabled data-prueba="mat-apagada">Un botón apagado</Materia>
        <Materia inclina={10} data-prueba="mat-avisa" onPointerCancel={(e) => e.currentTarget.setAttribute("data-cancelado", "")}><h3>Avisa</h3><p>Si el navegador cancela el gesto.</p></Materia>
        <Materia tipo="holografico" inclina={14} altura={2} data-prueba="mat-inclina"><h3>Se inclina</h3><p>Hacia el cursor.</p></Materia>
        <Materia tipo={pedido.tipo} altura={pedido.altura} inclina={pedido.inclina} data-prueba="mat-rara"><h3>Rara</h3><p>Con lo que venga.</p></Materia>
      </Luz>
      <div className="luz-caso luz-grilla">
        <Materia data-prueba="mat-fuera"><h3>Afuera</h3><p>Sin una luz alrededor.</p></Materia>
      </div>
    </>
  );
}

/** Las tarjetas y los botones que ya existían, con un prefijo para encontrarlos. */
function Existentes({ p }: { p: string }) {
  return (
    <div className="luz-existentes">
      <Tarjeta variante="elevada" data-prueba={`${p}-tarjeta`}><p>Tarjeta elevada</p></Tarjeta>
      <Tarjeta variante="vidrio" data-prueba={`${p}-tarjeta-vidrio`}><p>Tarjeta de vidrio</p></Tarjeta>
      <Tarjeta variante="plana" data-prueba={`${p}-plana`}><p>Tarjeta plana</p></Tarjeta>
      <Boton data-prueba={`${p}-boton`}>Sólido</Boton>
      <Boton variante="degradado" data-prueba={`${p}-degradado`}>Degradado</Boton>
      <Boton variante="contorno" data-prueba={`${p}-contorno`}>Contorno</Boton>
      <Boton forma="tecla" data-prueba={`${p}-tecla`}>Tecla</Boton>
      <Boton forma="ticket" data-prueba={`${p}-ticket`}>Ticket</Boton>
      <Boton forma="pixel" data-prueba={`${p}-pixel`}>Pixel</Boton>
      <Boton disabled data-prueba={`${p}-apagado`}>Apagado</Boton>
      <Boton forma="tecla" disabled data-prueba={`${p}-tecla-apagada`}>Tecla apagada</Boton>
      <Tarjeta variante="elevada" efecto="elevar" data-prueba={`${p}-elevar`}><p>Se eleva</p></Tarjeta>
    </div>
  );
}

/** Caso «existe»: lo que ya existía, dentro de una luz, con un estilo adentro o afuera, y sin luz. */
function CasoExiste({ pedido }: { pedido: Pedido }) {
  return (
    <>
      <Luz sigue={[]} desde={pedido.desde} data-prueba="luz-raiz" className="luz-caso">
        <Existentes p="ex" />
        {(["retro", "anime", "neon"] as const).map((e) => (
          <Estilo key={e} nombre={e} textura={false} className="luz-estilo">
            <Existentes p={`ex-${e}`} />
          </Estilo>
        ))}
      </Luz>
      <Estilo nombre="retro" textura={false} className="luz-estilo">
        <Luz sigue={[]} desde={pedido.desde} className="luz-caso">
          <Existentes p="ex-retro-afuera" />
        </Luz>
      </Estilo>
      <div className="luz-caso">
        <Existentes p="sin" />
        <div className="luz-existentes">
          {(["recto", "tecla", "ticket", "sello", "pixel", "subrayado", "circulo"] as const).map((f) => (
            <Boton key={f} forma={f} data-prueba={`forma-${f}`}>{f === "circulo" ? "+" : f}</Boton>
          ))}
        </div>
        <Estilo nombre="retro" textura={false} className="luz-estilo">
          <Existentes p="sin-retro" />
        </Estilo>
        <Estilo nombre="neon" textura={false} className="luz-estilo">
          <Existentes p="sin-neon" />
        </Estilo>
      </div>
    </>
  );
}

const CARTA = [
  { titulo: "Cafés", lineas: [{ texto: "Espresso", precio: "$2.200" }, { texto: "Cortado", detalle: "Con leche vaporizada", precio: "$2.600" }, { texto: "Flat white", precio: "$3.100" }, { texto: "Filtrado", detalle: "V60, según el grano", precio: "$3.400" }] },
  { titulo: "Para comer", lineas: [{ texto: "Medialuna", precio: "$1.800" }, { texto: "Tostada con palta", precio: "$4.200" }, { texto: "Kuchen de nuez", precio: "$3.300" }] },
  { titulo: "Fríos", lineas: [{ texto: "Cold brew", precio: "$3.200" }, { texto: "Limonada de menta", precio: "$2.900" }, { texto: "Té helado", precio: "$2.700" }] },
  { titulo: "Para llevar", lineas: [{ texto: "Café en grano, 250 g", precio: "$8.900" }, { texto: "Filtros", precio: "$3.500" }] },
];
const FICHAS = ["Cortado", "Flat white", "Medialuna", "Cold brew", "Kuchen", "Filtrado"].map((titulo, i) => ({ titulo, pie: "De la casa", precio: `$${2 + i}.${4 + i}00` }));

/** Caso «libro»: el libro dentro de una luz y otro afuera. */
function CasoLibro({ pedido }: { pedido: Pedido }) {
  return (
    <>
      <Luz sigue={[]} desde={pedido.desde} className="luz-caso" data-prueba="libro-luz">
        <LibroQueSeAbre tapa={{ titulo: "La carta", bajada: "Café Luna" }} hojas={CARTA} />
      </Luz>
      <div className="luz-caso" data-prueba="libro-sin">
        <LibroQueSeAbre tapa={{ titulo: "La carta", bajada: "Café Luna" }} hojas={CARTA} />
      </div>
    </>
  );
}

/** Caso «carrusel»: el carrusel dentro de una luz y otro afuera. */
function CasoCarrusel({ pedido }: { pedido: Pedido }) {
  return (
    <>
      <Luz sigue={[]} desde={pedido.desde} className="luz-caso" data-prueba="carrusel-luz">
        <CarruselGiratorio etiqueta="Lo más pedido" fichas={FICHAS} />
      </Luz>
      <div className="luz-caso" data-prueba="carrusel-sin">
        <CarruselGiratorio etiqueta="Lo más pedido" fichas={FICHAS} />
      </div>
    </>
  );
}

/** Caso «piezas»: el título con volumen y la tarjeta holográfica. */
function CasoPiezas({ pedido }: { pedido: Pedido }) {
  return (
    <Luz sigue={pedido.sigue} desde={pedido.desde} className="luz-caso luz-piezas" data-prueba="luz-raiz">
      <TituloConVolumen data-prueba="pz-titulo" style={{ color: "#c9502e" }}>Café Luna</TituloConVolumen>
      <TituloConVolumen como="p" data-prueba="pz-titulo-azul" style={{ color: "#2456e6" }}>Tostado hoy</TituloConVolumen>
      <TituloConVolumen espesor={10} data-prueba="pz-titulo-grueso">Abierto</TituloConVolumen>
      <TarjetaHolografica data-prueba="pz-holo" className="luz-ficha">
        <h3>Socio del café</h3>
        <p>Diez sellos y el próximo va por la casa.</p>
      </TarjetaHolografica>
    </Luz>
  );
}

const CASOS: Record<string, (p: { pedido: Pedido }) => ReactElement> = { materia: CasoMateria, existe: CasoExiste, libro: CasoLibro, carrusel: CasoCarrusel, piezas: CasoPiezas };

export function LuzVitrina({ d }: { d?: string }) {
  const pedido = leerPedido(d);
  if (pedido) {
    const Caso = CASOS[pedido.caso ?? ""] ?? CasoLuz;
    return <main className={`luz-pagina${pedido.fondo === "oscuro" ? " luz-oscura" : pedido.fondo === "noche" ? " luz-noche" : ""}`}><Caso pedido={pedido} /></main>;
  }
  return <Mesa />;
}

/** Unas pocas piezas de las de siempre, para verlas con y sin luz. */
function MuestraPiezas() {
  return (
    <div className="luz-existentes">
      <Tarjeta variante="elevada"><p>Tarjeta elevada</p></Tarjeta>
      <Boton>Reservar</Boton>
      <Boton forma="tecla">Tecla</Boton>
      <Estilo nombre="retro" textura={false} className="luz-estilo">
        <Boton>Retro</Boton>
      </Estilo>
    </div>
  );
}

const QUE_MUEVE: { id: FuenteLuz; nombre: string }[] = [
  { id: "puntero", nombre: "El cursor o el dedo" },
  { id: "scroll", nombre: "Bajar la página" },
];
const QUE_ES: Record<TipoMateria, string> = {
  papel: "No brilla: recibe la luz pareja y deja ver su grano.",
  mate: "Claro hacia la luz y más oscuro al otro lado.",
  vidrio: "Deja ver lo que hay detrás; una franja de luz lo cruza.",
  metal: "Bandas de luz y de sombra que lo recorren.",
  holografico: "Un arcoíris que cambia según cómo le da la luz.",
};
const dosCifras = (n: number) => String(n).padStart(2, "0");

/** La vitrina: una mesa con las cinco materias y el control de la luz. */
function Mesa() {
  const [sigue, setSigue] = useState<FuenteLuz[]>(["puntero", "scroll"]);
  const [rango, setRango] = useState(0.35);
  /** La hora que se prueba (en minutos del día), o `null`: la luz de siempre. */
  const [minutos, setMinutos] = useState<number | null>(null);
  const hora = minutos === null ? null : luzDeLaHora(new Date(2026, 10, 24, Math.floor(minutos / 60), minutos % 60));
  const cambiar = (f: FuenteLuz) => setSigue((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));
  const deLaHora = hora ? ({ "--mk-luz-tinte": hora.tinte, "--mk-luz-fuerza": hora.fuerza } as CSSProperties) : undefined;
  return (
    <main className="luz-pagina">
      <a className="luz-volver" href="#">← Demo</a>
      <Luz className="luz-mesa" sigue={sigue} rango={rango} desde={hora ?? undefined} style={deLaHora} data-prueba="luz-mesa">
        <header className="luz-cabeza">
          <h1>Luz y materia</h1>
          <p>Una sola luz para toda la página. Todas las sombras caen hacia el mismo lado, y el brillo se corre cuando mueves el cursor, el dedo o la página.</p>
        </header>

        <Materia tipo="papel" altura={1} alApuntar={1} className="luz-control" data-prueba="luz-control">
          <fieldset>
            <legend>Qué mueve la luz</legend>
            {QUE_MUEVE.map((q) => (
              <label key={q.id}>
                <input type="checkbox" checked={sigue.includes(q.id)} onChange={() => cambiar(q.id)} /> {q.nombre}
              </label>
            ))}
          </fieldset>
          <label className="luz-deslizador">
            <span>Cuánto se mueve: {Math.round(rango * 100)} %</span>
            <input type="range" min={0} max={100} value={Math.round(rango * 100)} onChange={(e) => setRango(Number(e.target.value) / 100)} />
          </label>
          <label className="luz-deslizador">
            <span>{minutos === null ? "La hora: la luz de siempre" : `La hora: ${dosCifras(Math.floor(minutos / 60))}:${dosCifras(minutos % 60)}`}</span>
            <input type="range" min={0} max={1430} step={10} value={minutos ?? 540} onChange={(e) => setMinutos(Number(e.target.value))} data-prueba="luz-hora" />
          </label>
          {minutos !== null && <button type="button" className="luz-enlace" onClick={() => setMinutos(null)}>Volver a la luz de siempre</button>}
        </Materia>

        <section className="luz-seccion">
          <h2>Cinco materias</h2>
          <p className="luz-nota">Cada una responde distinto a la misma luz.</p>
          <div className="luz-grilla luz-materias">
            {MATERIAS.map((t) => (
              <div key={t} className={t === "vidrio" ? "luz-detras" : undefined}>
                <Materia tipo={t} altura={2} inclina={t === "holografico" ? 12 : undefined} className="luz-ficha">
                  <h3>{NOMBRES[t]}</h3>
                  <p>{QUE_ES[t]}</p>
                </Materia>
              </div>
            ))}
          </div>
        </section>

        <section className="luz-seccion">
          <h2>La sombra dice la altura</h2>
          <p className="luz-nota">Lo que está más arriba deja una sombra más lejana, más grande y más clara. Apunta una para levantarla.</p>
          <div className="luz-grilla luz-alturas">
            {[0, 1, 2, 3, 4].map((a) => (
              <Materia key={a} altura={a} className="luz-ficha luz-chica">
                <h3>Altura {a}</h3>
              </Materia>
            ))}
          </div>
        </section>

        <section className="luz-seccion">
          <h2>Se aprietan de verdad</h2>
          <p className="luz-nota">Al apretar, el botón se hunde hacia su sombra y la sombra se junta.</p>
          <div className="luz-botones">
            <Materia como="button" type="button" tipo="mate" altura={2} className="luz-boton luz-primario">Reservar una mesa</Materia>
            <Materia como="button" type="button" tipo="metal" altura={2} className="luz-boton">Ver la carta</Materia>
            <Materia como="button" type="button" tipo="vidrio" altura={2} className="luz-boton">Cómo llegar</Materia>
          </div>
        </section>

        <section className="luz-seccion">
          <h2>Dos piezas nuevas</h2>
          <p className="luz-nota">Un título con espesor, que cae al lado contrario de la luz, y una tarjeta holográfica que se inclina hacia el cursor o el dedo.</p>
          <div className="luz-nuevas">
            <TituloConVolumen className="luz-titulo-grande" espesor={8}>Café Luna</TituloConVolumen>
            <TarjetaHolografica className="luz-socio">
              <small>Socio del café</small>
              <h3>Camila Rojas</h3>
              <p>8 de 10 sellos. El próximo café va por la casa.</p>
            </TarjetaHolografica>
          </div>
        </section>
      </Luz>

      <section className="luz-ancho luz-seccion">
        <h2>Lo que ya existía: antes y ahora</h2>
        <p className="luz-nota">Las mismas piezas de siempre. A la izquierda, sueltas. A la derecha, dentro de la luz de la página.</p>
        {(
          [
            ["Tarjetas y botones", () => <MuestraPiezas />],
            ["El libro: pasa una hoja", () => <LibroQueSeAbre tapa={{ titulo: "La carta", bajada: "Café Luna" }} hojas={CARTA} />],
            ["El carrusel: gíralo", () => <CarruselGiratorio etiqueta="Lo más pedido" fichas={FICHAS} />],
          ] as const
        ).map(([titulo, dibujar]) => (
          <div key={titulo} className="luz-comparar">
            <h3>{titulo}</h3>
            <div>
              <p className="luz-rotulo">Antes</p>
              {dibujar()}
            </div>
            <Luz sigue={sigue} rango={rango} desde={hora ?? undefined} style={deLaHora}>
              <p className="luz-rotulo">Ahora</p>
              {dibujar()}
            </Luz>
          </div>
        ))}
      </section>
    </main>
  );
}
