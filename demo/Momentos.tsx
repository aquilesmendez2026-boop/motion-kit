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
// La segunda tanda, como en el paquete: cada pieza se baja aparte.
import {
  AvisoQueSeDespliega, CintaConImpulso, ClasesDeHoy, EnlacesDomino, EpisodiosOnda, FechasQueVienen, LlamadoConVida, NovedadesQueLlegan, SeccionesVivas,
} from "../src/momentos/perezosos-2";
import type { EscenaLlamado } from "../src/momentos/escenas-llamado";
import type { SeccionViva } from "../src/momentos/SeccionesVivas";

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
/** Una fecha a `dias` de hoy, en el día de Chile (`AAAA-MM-DD`). */
function fechaEn(dias: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + dias * 86400000));
}
/** Una fecha ISO de hace `dias` días (negativo: en el futuro). */
const haceDias = (dias: number) => new Date(Date.now() - dias * 86400000).toISOString();
/** Un audio de ejemplo: unos segundos de silencio en WAV, armado aquí (sin archivos). */
function audioDeEjemplo(segundos = 4): string {
  const n = 8000 * segundos;
  const b = new Uint8Array(44 + n).fill(128);
  const v = new DataView(b.buffer);
  const texto = (i: number, t: string) => [...t].forEach((c, k) => (b[i + k] = c.charCodeAt(0)));
  texto(0, "RIFF"); v.setUint32(4, 36 + n, true); texto(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); texto(36, "data"); v.setUint32(40, n, true);
  let binario = "";
  for (const x of b) binario += String.fromCharCode(x);
  return `data:audio/wav;base64,${btoa(binario)}`;
}
const AUDIO = audioDeEjemplo();
const SECCIONES_DEMO = [
  { seccionId: "preguntas-frecuentes", titulo: "Lo que más nos preguntan", tipo: "preguntas", items: [
    { pregunta: "¿Se puede reservar?", respuesta: "Sí, por WhatsApp o desde esta página, hasta una hora antes." },
    { pregunta: "¿Tienen opciones sin gluten?", respuesta: "Tres panes y dos tortas, todos los días." },
    { pregunta: "¿Aceptan mascotas?", respuesta: "En la terraza, siempre." },
  ] },
  { seccionId: "como-funciona", titulo: "Cómo pedir", tipo: "pasos", items: [
    { titulo: "Elige tu café", texto: "En grano o molido para tu cafetera." },
    { titulo: "Paga en línea" },
    { titulo: "Lo retiras o te lo llevamos", texto: "El mismo día en Ñuñoa y Providencia." },
  ] },
  { seccionId: "equipo", titulo: "Quiénes somos", tipo: "equipo", items: [
    { nombre: "Camila Soto", cargo: "Tostadora", descripcion: "Diez años entre granos." },
    { nombre: "Matías Rojas", cargo: "Barista" },
  ] },
  { seccionId: "historia", titulo: "Nuestra historia", tipo: "texto", texto: "Partimos en 2019, con una máquina prestada y una mesa.\n\nHoy tostamos nuestro propio café, a la vuelta de la esquina." },
  { seccionId: "algo-nuevo", titulo: "Un tipo que el kit no conoce", tipo: "mapa-del-tesoro" },
  // Un tipo con nombre de algo que todo objeto trae: tampoco se dibuja.
  { seccionId: "algo-raro", titulo: "Otro tipo que el kit no conoce", tipo: "constructor" },
] as unknown as SeccionViva[];
/** Un aviso de la vitrina: al cerrarlo, lo dice (en La Mente, ahí se recuerda que se cerró). */
function AvisoDemo({ nivel, texto, tono, enlace }: { nivel?: NivelEscena; texto: string; tono: "info" | "importante" | "celebracion"; enlace?: string }) {
  const [cerrado, setCerrado] = useState(false);
  if (cerrado) return <p data-prueba="aviso-cerrado">Aviso cerrado.</p>;
  return <AvisoQueSeDespliega nivel={nivel} texto={texto} tono={tono} enlace={enlace} alCerrar={() => setCerrado(true)} respaldo={<Respaldo>{texto}</Respaldo>} />;
}
const LLAMADOS: { escena: EscenaLlamado; boton: string }[] = [
  { escena: "agenda", boton: "Reservar hora" },
  { escena: "pedidos", boton: "Hacer pedido" },
  { escena: "buzon", boton: "Dejar un mensaje" },
  { escena: "cotizaciones", boton: "Pedir presupuesto" },
  { escena: "encuestas", boton: "Votar" },
  { escena: "contacto", boton: "Escribir" },
];
const FILA_LLAMADO: CSSProperties = { display: "flex", alignItems: "center", gap: 14, marginBottom: 10 };
/** Lo que se ve mientras llega el archivo de una pieza (en La Mente, el bloque de siempre). */
const Respaldo = ({ children }: { children: ReactNode }) => <div data-respaldo="">{children}</div>;

/** La segunda tanda (los bloques que faltaban): cada pieza suma aquí su sección. Se bajan aparte, como en el paquete. */
const SECCIONES_2: Seccion[] = [
  {
    id: "fechas", titulo: "Calendario: fechas que vienen",
    dibujar: (d) => (
      <FechasQueVienen
        nivel={d.nivel}
        respaldo={<Respaldo>Lo que viene: catas, cierres y promociones.</Respaldo>}
        fechas={[
          { titulo: "Cata de cafés de Colombia", fecha: fechaEn(0), hora: "19:00", tipo: "evento" },
          { titulo: "2x1 en espresso", fecha: fechaEn(2), tipo: "promocion" },
          { titulo: "Cerrado por inventario", fecha: fechaEn(5), tipo: "cerrado" },
          { titulo: "Taller de latte art", fecha: fechaEn(9), hora: "11:30", tipo: "actividad" },
        ]}
      />
    ),
  },
  {
    id: "fechas-bordes", titulo: "Calendario: datos raros",
    dibujar: (d) => (
      <FechasQueVienen
        nivel={d.nivel}
        fechas={[
          { titulo: "Una fecha que no existe", fecha: "2026-02-30", tipo: "actividad" },
          { titulo: "Feria de emprendedores del barrio, con música en vivo y degustaciones toda la tarde", fecha: fechaEn(20), hora: "16:00", tipo: "evento" },
        ]}
      />
    ),
  },
  { id: "fechas-vacia", titulo: "Calendario: sin fechas", dibujar: (d) => <FechasQueVienen nivel={d.nivel} fechas={[]} /> },
  {
    id: "clases", titulo: "Clases: hoy y mañana",
    dibujar: (d) => (
      <ClasesDeHoy
        nivel={d.nivel}
        respaldo={<Respaldo>Horario de clases de hoy y de mañana.</Respaldo>}
        sesiones={[
          // Las horas van al borde del día para que la próxima sea siempre la misma en la vitrina.
          { nombre: "Yoga suave", profesor: "Dani", hora: "00:01", fecha: fechaEn(0), libres: 3, espera: "no" },
          { nombre: "Pilates", profesor: "Caro", hora: "23:58", fecha: fechaEn(0), libres: 1, espera: "no", cupos: 10 },
          { nombre: "Funcional", hora: "23:59", fecha: fechaEn(0), libres: 0, espera: "abierta" },
          { nombre: "Spinning", profesor: "Nico", hora: "08:00", fecha: fechaEn(1), libres: 0, espera: "llena", cupos: 12 },
          { nombre: "Yoga al amanecer", hora: "07:00", fecha: fechaEn(1), libres: 5, espera: "no" },
        ]}
      />
    ),
  },
  { id: "clases-vacia", titulo: "Clases: sin clases", dibujar: (d) => <ClasesDeHoy nivel={d.nivel} sesiones={[]} /> },
  {
    id: "novedades", titulo: "Novedades que llegan",
    dibujar: (d) => (
      <NovedadesQueLlegan
        nivel={d.nivel}
        respaldo={<Respaldo>Lo nuevo del café.</Respaldo>}
        entradas={[
          { titulo: "Ahora con terraza", resumen: "Abrimos la terraza del patio. Vengan a vernos, con o sin reserva.", foto: imagenGenerada("pelicula", 40), publicada: haceDias(2), href: "#momentos" },
          { titulo: "Nuevo horario de invierno", resumen: "Abrimos una hora antes de lunes a viernes.", publicada: haceDias(20), href: "#momentos" },
          { titulo: "Llegó el café de Huila", foto: imagenGenerada("retro", 200), publicada: haceDias(41), href: "#momentos" },
        ]}
      />
    ),
  },
  {
    id: "novedades-bordes", titulo: "Novedades: datos raros",
    dibujar: (d) => (
      <NovedadesQueLlegan
        nivel={d.nivel}
        entradas={[
          { titulo: "Con un enlace que no se puede usar", publicada: haceDias(60), href: "javascript:alert(1)" },
          { titulo: "Con fecha en el futuro", publicada: haceDias(-10), href: "#momentos" },
        ]}
      />
    ),
  },
  {
    id: "enlaces", titulo: "Enlaces en dominó",
    dibujar: (d) => (
      <EnlacesDomino
        nivel={d.nivel}
        respaldo={<Respaldo>Nuestros canales.</Respaldo>}
        enlaces={[
          { titulo: "Recetas en video", red: "youtube", url: "https://www.youtube.com/" },
          { titulo: "La lista del local", red: "spotify", url: "https://open.spotify.com/" },
          { titulo: "El día a día", red: "instagram", url: "https://www.instagram.com/" },
          { titulo: "Escríbenos", red: "whatsapp", url: "https://wa.me/56900000000" },
        ]}
      />
    ),
  },
  {
    id: "episodios", titulo: "Episodios con onda",
    dibujar: (d) => (
      <EpisodiosOnda
        nivel={d.nivel}
        respaldo={<Respaldo>Los últimos episodios del podcast.</Respaldo>}
        episodios={[
          { titulo: "Cómo elegir un buen café", fecha: haceDias(3), audio: AUDIO, duracion: 46 * 60 },
          { titulo: "Entrevista: del cafetal a la taza", fecha: haceDias(17), audio: AUDIO, duracion: 3720 },
          { titulo: "Tres métodos para la casa", audio: AUDIO },
        ]}
      />
    ),
  },
  { id: "episodios-bordes", titulo: "Episodios: un audio que no carga", dibujar: (d) => <EpisodiosOnda nivel={d.nivel} episodios={[{ titulo: "Sin audio", audio: "https://sin-audio.invalid/episodio.mp3" }]} /> },
  { id: "secciones", titulo: "Secciones con resorte", dibujar: (d) => <SeccionesVivas nivel={d.nivel} respaldo={<Respaldo>Preguntas, pasos, equipo e historia.</Respaldo>} secciones={SECCIONES_DEMO} /> },
  { id: "aviso", titulo: "Aviso que se despliega", dibujar: (d) => <AvisoDemo nivel={d.nivel} texto="Hoy cerramos a las 18:00 por inventario" tono="importante" enlace="#momentos" /> },
  { id: "aviso-celebracion", titulo: "Aviso: celebración", dibujar: (d) => <AvisoDemo nivel={d.nivel} texto="¡Felices Fiestas Patrias 🇨🇱! Hoy el segundo café va por la casa ❤️" tono="celebracion" /> },
  { id: "aviso-info", titulo: "Aviso: informativo", dibujar: (d) => <AvisoDemo nivel={d.nivel} texto="Desde diciembre abrimos los domingos" tono="info" enlace="javascript:alert(1)" /> },
  { id: "aviso-largo", titulo: "Aviso: una palabra muy larga", dibujar: (d) => <AvisoDemo nivel={d.nivel} texto="Reserva en https://cafeluna.example/reservas-de-fin-de-ano-con-menu-completo-y-terraza hasta el viernes" tono="info" /> },
  { id: "cinta", titulo: "Cinta con impulso", dibujar: (d) => <CintaConImpulso nivel={d.nivel} lema="Tostamos café todos los días" respaldo={<Respaldo>Tostamos café todos los días</Respaldo>} /> },
  { id: "cinta-corta", titulo: "Cinta: un lema corto", dibujar: (d) => <CintaConImpulso nivel={d.nivel} lema="Hola" /> },
  { id: "cinta-quieta", titulo: "Cinta quieta", dibujar: (d) => <CintaConImpulso nivel={d.nivel} lema="Tostamos café todos los días" quieta /> },
  { id: "cinta-vacia", titulo: "Cinta: sin lema", dibujar: (d) => <CintaConImpulso nivel={d.nivel} lema="" /> },
  {
    id: "llamado", titulo: "Llamado con vida (los bloques que son un botón)",
    dibujar: (d) => (
      <div>
        {LLAMADOS.map((l) => (
          <div key={l.escena} data-escena={l.escena} style={FILA_LLAMADO}>
            <LlamadoConVida escena={l.escena} abierto nivel={d.nivel} />
            <a className="mom-repetir" href="#momentos" style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }}>{l.boton}</a>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "llamado-bordes", titulo: "Llamado: pedidos cerrado y una escena que no existe",
    dibujar: (d) => (
      <div style={FILA_LLAMADO}>
        <LlamadoConVida escena="pedidos" abierto={false} nivel={d.nivel} />
        <LlamadoConVida escena={"nada" as EscenaLlamado} nivel={d.nivel} />
      </div>
    ),
  },
  {
    id: "enlaces-bordes", titulo: "Enlaces: datos raros",
    dibujar: (d) => (
      <EnlacesDomino
        nivel={d.nivel}
        enlaces={[
          { titulo: "Una dirección que no se puede usar", red: "x", url: "javascript:alert(1)" },
          { titulo: "Una red que no conocemos", red: "mi_red_nueva", url: "https://example.com/" },
        ]}
      />
    ),
  },
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
    <>
      <div className="mom-grilla">
        {SECCIONES.map((s) => <Tarjeta key={s.id} seccion={s} datos={datos} />)}
      </div>
      {SECCIONES_2.length > 0 && (
        <>
          <h2 className="mom-tanda">Segunda tanda: los bloques que faltaban</h2>
          <div className="mom-grilla" data-prueba="tanda-2">
            {SECCIONES_2.map((s) => <Tarjeta key={s.id} seccion={s} datos={datos} />)}
          </div>
        </>
      )}
    </>
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

export { SECCIONES, SECCIONES_2, SUELTOS };
export type { Seccion, Datos };
