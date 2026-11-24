import { useState, type CSSProperties, type ReactNode } from "react";
import { Estilo, EstiloLaMente, ESTILOS, ESTILO_IDS, TEMA_LAMENTE_IDS, PALETA_LAMENTE_IDS, type EstiloId } from "../src";
import type { NivelEscena } from "../src/escena/nivel";
import { SellosEstampa } from "../src/momentos/SellosEstampa";
import { ResenasPila } from "../src/momentos/ResenasPila";
import { CartaQueSeAbre } from "../src/momentos/CartaQueSeAbre";
import { PrecioQueRueda } from "../src/momentos/PrecioQueRueda";
import { CuentaRegresiva } from "../src/momentos/CuentaRegresiva";
import { MapaDibujado } from "../src/momentos/MapaDibujado";
import { MosaicoQueSeArma } from "../src/momentos/MosaicoQueSeArma";
// Como en el paquete: sorteo y antes y después se bajan aparte.
import { AntesDespues, SorteoRaspe } from "../src/momentos/perezosos";
import { imagenGenerada } from "../src/plantillas/imagenes";

/** Lo que recibe cada sección: el nivel elegido (o automático) y la semilla del negocio de ejemplo. */
type Datos = { nivel?: NivelEscena; semilla: string };
type Seccion = { id: string; titulo: string; dibujar: (d: Datos) => ReactNode };

// Cada momento suma aquí su sección.
const SELLOS: Seccion = {
  id: "sellos", titulo: "Sellos",
  dibujar: (d) => <SellosEstampa total={10} llenos={3} premio="Café gratis" semilla={d.semilla} nivel={d.nivel} />,
};
const RESENAS_DEMO = [
  { nombre: "Cami", estrellas: 5, texto: "El mejor café de Ñuñoa, y el pan de masa madre está increíble." },
  { nombre: "Felipe", estrellas: 4, texto: "Buen ambiente para trabajar. A veces se llena." },
  { nombre: "Rocío", estrellas: 5, texto: "Me atendieron súper bien." },
  { nombre: "Tomás", estrellas: 5 },
  { nombre: "Ale", estrellas: 4, texto: "Rico el flat white." },
];
const SECCIONES: Seccion[] = [
  SELLOS,
  {
    id: "carta", titulo: "Precios: carta que se abre",
    dibujar: (d) => (
      <CartaQueSeAbre
        destacada={1}
        nivel={d.nivel}
        listas={[{ titulo: "Cafés", href: "#momentos" }, { titulo: "Brunch", href: "#momentos" }, { titulo: "Pastelería", href: "#momentos" }, { titulo: "Para llevar", href: "#momentos" }]}
      />
    ),
  },
  { id: "precio", titulo: "Precio que rueda", dibujar: (d) => <PrecioDemo nivel={d.nivel} /> },
  { id: "cuenta", titulo: "Eventos: cuenta regresiva", dibujar: (d) => <CuentaRegresiva titulo="Noche de vinilos" fecha={EVENTO.fecha} hora={EVENTO.hora} nivel={d.nivel} /> },
  {
    id: "mapa", titulo: "Ubicación: mapa dibujado",
    dibujar: (d) => <MapaDibujado direccion="Av. Irarrázaval 3021, Ñuñoa" semilla={d.semilla} abierto mapsUrl="https://maps.google.com/?q=Irarrazaval+3021" nivel={d.nivel} />,
  },
  {
    id: "mosaico", titulo: "Galería: mosaico que se arma",
    dibujar: (d) => (
      <MosaicoQueSeArma
        viva
        visor
        semilla={d.semilla}
        nivel={d.nivel}
        fotos={["El mesón", "Masa madre", "La terraza", "Flat white", "Brunch", "De noche"].map((pie, i) => ({ url: imagenGenerada("pelicula", 20 + i * 55), pie }))}
      />
    ),
  },
  {
    id: "mosaico-una", titulo: "Galería con una sola foto",
    dibujar: (d) => <MosaicoQueSeArma visor semilla={d.semilla} nivel={d.nivel} fotos={[{ url: imagenGenerada("neon", 120) }]} />,
  },
  {
    id: "antesdespues", titulo: "Antes y después",
    dibujar: (d) => (
      <AntesDespues nivel={d.nivel} antes={{ url: imagenGenerada("rock", 10), alt: "El local antes de la remodelación" }} despues={{ url: imagenGenerada("anime", 200), alt: "El local remodelado" }} />
    ),
  },
  { id: "sorteo", titulo: "Sorteos: raspa y mira", dibujar: (d) => <SorteoRaspe titulo="Sorteo de aniversario" premio="Desayuno para dos" semilla={d.semilla} nivel={d.nivel} /> },
  {
    id: "sorteo-ganador", titulo: "Sorteo con ganador",
    dibujar: (d) => <SorteoRaspe titulo="Sorteo de octubre" premio="Kilo de café de grano" ganador="Javiera P." semilla={d.semilla} nivel={d.nivel} />,
  },
  { id: "resenas", titulo: "Reseñas", dibujar: (d) => <ResenasPila promedio={4.6} total={128} resenas={RESENAS_DEMO} nivel={d.nivel} /> },
];
/** Lo que se repite en la sección «suelto» (solo con las variables de La Mente, sin Estilo). */
const SUELTOS: Seccion[] = [{ ...SELLOS, id: "sellos-suelto" }];

const NIVELES: { id: NivelEscena | ""; nombre: string }[] = [
  { id: "", nombre: "Automático" },
  { id: "completo", nombre: "Completo" },
  { id: "liviano", nombre: "Liviano" },
  { id: "quieto", nombre: "Quieto" },
];

const SOLO_LAMENTE = {
  "--lm-acento": "#2a9d8f", "--lm-superficie": "#ffffff", "--lm-texto": "#1d1d1b", "--lm-sobreAcento": "#ffffff",
  background: "#f4f1ea", color: "#1d1d1b", padding: "16px", borderRadius: "16px",
} as CSSProperties;

function PrecioDemo({ nivel }: { nivel?: NivelEscena }) {
  const [valor, setValor] = useState(12990);
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      <span style={{ fontSize: "2.6rem", fontWeight: 800 }}><PrecioQueRueda valor={valor} nivel={nivel} /></span>
      <button type="button" className="mom-repetir" onClick={() => setValor((v) => (v === 12990 ? 15490 : 12990))}>Cambiar precio</button>
    </div>
  );
}

/** Un evento a 3 días y 5 horas de ahora, en la hora de Chile. */
function eventoDemo(): { fecha: string; hora: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(Date.now() + (3 * 24 + 5) * 3600 * 1000))
      .map((x) => [x.type, x.value]),
  );
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}
const EVENTO = eventoDemo();

function Tarjeta({ seccion, datos }: { seccion: Seccion; datos: Datos }) {
  const [vez, setVez] = useState(0);
  return (
    <section className="mom-seccion" data-prueba={seccion.id}>
      <header>
        <h2>{seccion.titulo}</h2>
        <button type="button" className="mom-repetir" onClick={() => setVez((v) => v + 1)}>Repetir</button>
      </header>
      <div key={vez}>{seccion.dibujar(datos)}</div>
    </section>
  );
}

export function Momentos() {
  const [estilo, setEstilo] = useState<EstiloId | "lamente">("pelicula");
  const [nivel, setNivel] = useState<NivelEscena | "">("");
  const datos: Datos = { nivel: nivel || undefined, semilla: "cafe-luna" };
  const contenido = (
    <div className="mom-grilla">
      {SECCIONES.map((s) => <Tarjeta key={s.id} seccion={s} datos={datos} />)}
    </div>
  );
  return (
    <main className="mom-demo">
      <a href="#">← Demo</a>
      <h1>Momentos por bloque</h1>
      <p className="enc-nota">El efecto propio de cada bloque de La Mente. Viene solo, con el estilo y los colores de la página.</p>
      <div className="mom-controles">
        <label>
          Estilo{" "}
          <select value={estilo} onChange={(e) => setEstilo(e.target.value as EstiloId | "lamente")} data-prueba="estilo">
            {ESTILO_IDS.map((id) => <option key={id} value={id}>{ESTILOS[id].nombre}</option>)}
            <option value="lamente">La Mente</option>
          </select>
        </label>
        <label>
          Nivel{" "}
          <select value={nivel} onChange={(e) => setNivel(e.target.value as NivelEscena | "")} data-prueba="nivel">
            {NIVELES.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
          </select>
        </label>
      </div>
      {estilo === "lamente" ? (
        <EstiloLaMente tema={TEMA_LAMENTE_IDS[0]} paleta={PALETA_LAMENTE_IDS[0]} className="mom-marco">{contenido}</EstiloLaMente>
      ) : (
        <Estilo nombre={estilo} fuentes className="mom-marco">{contenido}</Estilo>
      )}
      <h2>Suelto, solo con las variables de La Mente</h2>
      <div style={SOLO_LAMENTE} data-prueba="suelto" className="mom-grilla">
        {SUELTOS.map((s) => <Tarjeta key={s.id} seccion={s} datos={datos} />)}
      </div>
    </main>
  );
}

export { SECCIONES, SUELTOS };
export type { Seccion, Datos };
