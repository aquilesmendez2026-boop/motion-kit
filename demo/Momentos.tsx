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
// Los efectos vistosos, como en el paquete: cada pieza se baja aparte.
import { CarruselGiratorio, FuegosArtificiales, LibroQueSeAbre } from "../src/momentos/perezosos-3";
import { CuponQueSeArranca, RuletaDePremios, SellosConTimbre, StickerQueSeDespega } from "../src/momentos/perezosos-4";
import type { EscenaLlamado } from "../src/momentos/escenas-llamado";
import type { SeccionViva } from "../src/momentos/SeccionesVivas";

/** Lo que recibe cada sección: el nivel elegido (o automático) y la semilla del negocio de ejemplo. */
type Datos = { nivel?: NivelEscena; semilla: string };
type Seccion = { id: string; titulo: string; dibujar: (d: Datos) => ReactNode; /** Ocupa toda la fila de la vitrina. */ ancha?: boolean; /** Un caso para las pruebas (datos raros, fallas): va aparte, debajo de las piezas. */ caso?: boolean };

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
/** Los fuegos, con un botón para celebrar y otro para quitarlos a medias. Cuenta las veces que avisaron que terminaron. */
function FuegosDemo() {
  const [semilla, setSemilla] = useState<number | null>(null);
  const [fines, setFines] = useState(0);
  return (
    <div>
      <div style={{ position: "relative", height: 320, borderRadius: 14, overflow: "hidden", background: "#12121a" }} data-prueba="fuegos-caja">
        {semilla !== null && <FuegosArtificiales semilla={semilla} alTerminar={() => setFines((n) => n + 1)} />}
      </div>
      <p style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="mom-repetir" data-prueba="celebrar" onClick={() => setSemilla((s) => (s ?? 6) + 1)}>Celebrar</button>
        <button type="button" className="mom-repetir" data-prueba="quitar" onClick={() => setSemilla(null)}>Quitar</button>
        <span>Terminaron: <output data-prueba="fuegos-fin">{fines}</output></span>
      </p>
    </div>
  );
}

const PLATOS = [
  { titulo: "Cortado doble", pie: "Con leche de avena, si quieres", precio: "$2.800", tono: 20 },
  { titulo: "Tostada con palta", pie: "Pan de masa madre", precio: "$4.500", tono: 110 },
  { titulo: "Kuchen de frambuesa", pie: "Receta de la casa", precio: "$3.200", tono: 330 },
  { titulo: "Jugo de naranja", pie: "Exprimido al momento", precio: "$2.500", tono: 40 },
  { titulo: "Sándwich de la casa", pie: "Con queso de campo", precio: "$5.900", tono: 200 },
  { titulo: "Té en hoja", pie: "Seis variedades", precio: "$2.200", tono: 150 },
];
const fichasDemo = (n: number) => PLATOS.slice(0, n).map((p, i) => ({ url: imagenGenerada("neon", p.tono), titulo: p.titulo, pie: p.pie, precio: p.precio, href: i % 2 ? undefined : "#momentos" }));
const FICHAS_RARAS = [
  { titulo: "Una foto que no carga", url: "/__no-existe.jpg", precio: "$1.000" },
  { titulo: "Un enlace que no se puede usar", href: "javascript:alert(1)", url: imagenGenerada("rock", 10) },
  { titulo: "Agotado por hoy", precio: "$3.000", agotado: true, url: imagenGenerada("anime", 280) },
  { titulo: `Un título larguísimo ${"que sigue y sigue ".repeat(40)}`, pie: "palabrasinespaciosquenotermina".repeat(12) },
  ...Array.from({ length: 40 }, (_, i) => ({ titulo: `Plato ${i + 1}`, precio: "$1.990" })),
  null,
  { pie: "sin título ni foto" },
] as unknown as { titulo?: string }[];

/** Un carrusel cuya primera foto parte con una dirección mala y, con el botón, pasa a una buena (como al corregirla en el editor). */
function CarruselCambia({ nivel }: { nivel?: NivelEscena }) {
  const [buena, setBuena] = useState(false);
  const fichas = fichasDemo(4).map((f, i) => (i === 0 && !buena ? { ...f, url: "/__no-existe.jpg" } : f));
  return (
    <div>
      <CarruselGiratorio nivel={nivel} etiqueta="Foto corregida" fichas={fichas} />
      <button type="button" className="mom-repetir" data-prueba="corregir-foto" onClick={() => setBuena(true)}>Corregir la foto</button>
    </div>
  );
}

const CARTA = [
  { titulo: "Cafés", lineas: [{ texto: "Espresso", precio: "$1.900" }, { texto: "Cortado", detalle: "Simple o doble", precio: "$2.400" }, { texto: "Capuchino", precio: "$2.900" }, { texto: "Latte", detalle: "Con leche de avena, si quieres", precio: "$3.100" }, { texto: "Mocaccino", precio: "$3.300" }] },
  { titulo: "Para comer", lineas: [{ texto: "Tostada con palta", detalle: "Pan de masa madre", precio: "$4.500" }, { texto: "Sándwich de la casa", detalle: "Con queso de campo", precio: "$5.900" }, { texto: "Ensalada de estación", precio: "$5.200" }, { texto: "Quiche del día", precio: "$4.800", agotado: true }] },
  { titulo: "Dulces", lineas: [{ texto: "Kuchen de frambuesa", precio: "$3.200" }, { texto: "Brownie", detalle: "Con nueces", precio: "$2.600" }, { texto: "Galletas de avena", precio: "$1.500" }] },
  { titulo: "Para tomar", lineas: [{ texto: "Jugo de naranja", detalle: "Exprimido al momento", precio: "$2.500" }, { texto: "Limonada con menta", precio: "$2.700" }, { texto: "Té en hoja", detalle: "Seis variedades", precio: "$2.200" }] },
];
const CARTA_LARGA = [{ titulo: "Sándwiches", lineas: Array.from({ length: 23 }, (_, i) => ({ texto: `Sándwich número ${i + 1}`, precio: `$${4 + (i % 4)}.${i % 2 ? "9" : "5"}00` })) }];
const CARTA_RARA = [
  { titulo: `Un grupo con un nombre larguísimo ${"que sigue y sigue ".repeat(30)}`, lineas: [{ texto: `Plato ${"con un nombre enorme ".repeat(30)}`, detalle: "palabrasinespaciosquenotermina".repeat(12), precio: "$999.999.999.999.999.999.999" }, { texto: "   " }, null, 7] },
  { titulo: "Sin líneas" },
  null,
  "no es una hoja",
  ...Array.from({ length: 30 }, (_, i) => ({ titulo: `Grupo ${i + 1}`, lineas: [{ texto: "Único plato", precio: "$1.000" }] })),
] as unknown as typeof CARTA;

/** Los efectos vistosos (tanda del 24-11). */
const VISTOSOS: Seccion[] = [
  {
    id: "libro", titulo: "Libro que se abre (la carta de precios)", ancha: true,
    dibujar: (d) => <LibroQueSeAbre nivel={d.nivel} tapa={{ titulo: "La carta", bajada: "Café Luna" }} hojas={CARTA} respaldo={<Respaldo>La carta del café.</Respaldo>} />,
  },
  { id: "libro-una", titulo: "Libro: una sola hoja", ancha: true, dibujar: (d) => <LibroQueSeAbre nivel={d.nivel} tapa={{ titulo: "Promociones", imagen: imagenGenerada("neon", 30) }} hojas={CARTA.slice(0, 1)} /> },
  { id: "libro-largo", titulo: "Libro: un grupo de 23 platos (sigue en la hoja siguiente)", dibujar: (d) => <LibroQueSeAbre nivel={d.nivel} tapa={{ titulo: "Sándwiches" }} hojas={CARTA_LARGA} /> },
  { id: "libro-bordes", titulo: "Libro: datos raros", dibujar: (d) => <LibroQueSeAbre nivel={d.nivel} tapa={{ titulo: `Una tapa ${"larguísima ".repeat(30)}` }} hojas={CARTA_RARA} /> },
  { id: "libro-vacio", titulo: "Libro: sin hojas", dibujar: (d) => <LibroQueSeAbre nivel={d.nivel} tapa={{ titulo: "Vacío" }} hojas={[]} /> },
  {
    id: "carrusel", titulo: "Carrusel giratorio (galería o carta con fotos)",
    dibujar: (d) => <CarruselGiratorio nivel={d.nivel} etiqueta="Lo más pedido" fichas={fichasDemo(6)} respaldo={<Respaldo>Lo más pedido.</Respaldo>} />,
  },
  { id: "carrusel-3", titulo: "Carrusel: tres fichas (el anillo las repite)", dibujar: (d) => <CarruselGiratorio nivel={d.nivel} etiqueta="Destacados" fichas={fichasDemo(3)} /> },
  { id: "carrusel-2", titulo: "Carrusel: dos fichas (van en fila)", dibujar: (d) => <CarruselGiratorio nivel={d.nivel} fichas={fichasDemo(2)} /> },
  { id: "carrusel-bordes", titulo: "Carrusel: datos raros", dibujar: (d) => <CarruselGiratorio nivel={d.nivel} etiqueta="Datos raros" fichas={FICHAS_RARAS} /> },
  { id: "carrusel-cambia", titulo: "Carrusel: una foto que se corrige", dibujar: (d) => <CarruselCambia nivel={d.nivel} /> },
  { id: "carrusel-vacio", titulo: "Carrusel: sin fichas", dibujar: (d) => <CarruselGiratorio nivel={d.nivel} fichas={[]} /> },
  { id: "fuegos", titulo: "Fuegos artificiales", dibujar: () => <FuegosDemo /> },
  {
    id: "sorteo-fuegos", titulo: "Sorteo con ganador, celebrado con fuegos",
    dibujar: (d) => <SorteoRaspe titulo="Sorteo de aniversario" premio="Desayuno para dos" ganador="Camila R." celebracion="fuegos" semilla={d.semilla} nivel={d.nivel} />,
  },
];
/** Un cupón que cuenta cuántas veces avisó que lo arrancaron (para la prueba: tiene que ser una). */
function CuponDemo({ nivel }: { nivel?: NivelEscena }) {
  const [arrancados, setArrancados] = useState(0);
  return (
    <>
      <CuponQueSeArranca nivel={nivel} titulo="2×1 en cafés" detalle="De lunes a jueves, hasta las 12:00" codigo="LUNA2X1" vence="2099-12-31" alArrancar={() => setArrancados((n) => n + 1)} respaldo={<Respaldo>2×1 en cafés.</Respaldo>} />
      <output data-arrancados="" hidden>{arrancados}</output>
    </>
  );
}

/** Un sticker que cuenta cuántas veces avisó que lo despegaron (para la prueba: tiene que ser una). */
function StickerDemo({ nivel, forma }: { nivel?: NivelEscena; forma?: "circulo" | "cuadrado" }) {
  const [despegados, setDespegados] = useState(0);
  return (
    <>
      <StickerQueSeDespega nivel={nivel} forma={forma} debajo={<strong>¡Un café gratis! <a href="#momentos">Cómo cobrarlo</a></strong>} alDespegar={() => setDespegados((n) => n + 1)} respaldo={<Respaldo>Un café gratis.</Respaldo>}>
        Despégame
      </StickerQueSeDespega>
      <output data-despegados="" hidden>{despegados}</output>
    </>
  );
}

const PREMIOS = ["Café gratis", "10 % menos", "Medialuna", "Sigue participando", "2×1 en cafés", "Un kuchen"];

/**
 * Una ruleta con lo que la prueba necesita: anota cada aviso de `alTerminar`, deja pedir otra vuelta con otro premio
 * y, con `servidor`, pide el resultado al lanzar («lenta»: llega al segundo y medio; «falla»: no llega).
 */
function RuletaDemo({ nivel, servidor, semilla, premios = PREMIOS, fijo }: { nivel?: NivelEscena; servidor?: "lenta" | "falla"; semilla: string; premios?: string[]; /** Un `resultado` fijo (para probar índices raros). */ fijo?: number }) {
  const [vuelta, setVuelta] = useState({ vez: 0, resultado: 2 });
  const [avisos, setAvisos] = useState<(number | null)[]>([]);
  const [pedidos, setPedidos] = useState(0);
  const [otros, setOtros] = useState(false);
  const pedir = () => {
    setPedidos((n) => n + 1);
    return new Promise<number>((listo, falla) => setTimeout(() => (servidor === "falla" ? falla(new Error("sin red")) : listo(3)), servidor === "falla" ? 600 : 1500));
  };
  return (
    <>
      <RuletaDePremios
        nivel={nivel}
        premios={otros ? ["Sí", "No", "Quizás", "Otra vez"] : premios}
        resultado={servidor ? undefined : fijo ?? vuelta.resultado}
        alGirar={servidor ? pedir : undefined}
        vez={vuelta.vez}
        semilla={semilla}
        celebracion="nada"
        alTerminar={(i) => setAvisos((a) => [...a, i])}
        respaldo={<Respaldo>La ruleta de premios.</Respaldo>}
      />
      <button type="button" className="mom-repetir" data-otra="" onClick={() => setVuelta((v) => ({ vez: v.vez + 1, resultado: (v.resultado + 5) % PREMIOS.length }))}>Otra vuelta</button>
      <button type="button" className="mom-repetir" data-cambiar="" onClick={() => setOtros(true)}>Cambiar premios</button>
      <output data-avisos="" data-pedido={vuelta.resultado} data-pedidos={pedidos} hidden>{JSON.stringify(avisos)}</output>
    </>
  );
}

/** «Con el dedo»: piezas que se manejan arrastrando. */
const CON_EL_DEDO: Seccion[] = [
  { id: "cupon", titulo: "Cupón que se arranca", dibujar: (d) => <CuponDemo nivel={d.nivel} /> },
  { id: "cupon-vencido", caso: true, titulo: "Cupón: vencido", dibujar: (d) => <CuponQueSeArranca nivel={d.nivel} titulo="Desayuno a mitad de precio" codigo="VIEJO50" vence="2020-01-01" /> },
  { id: "cupon-largo", caso: true, titulo: "Cupón: textos enormes", dibujar: (d) => <CuponQueSeArranca nivel={d.nivel} titulo={`Una promoción ${"larguísima ".repeat(20)}`} detalle={"Con una condición que no termina nunca ".repeat(8)} codigo="CODIGOLARGUISIMOQUENOTERMINANUNCA1234567890" vence="pronto" /> },
  { id: "cupon-sin-codigo", caso: true, titulo: "Cupón: sin código (no se dibuja)", dibujar: (d) => <CuponQueSeArranca nivel={d.nivel} titulo="Sin código" codigo="  " /> },
  { id: "sticker", titulo: "Sticker que se despega", dibujar: (d) => <StickerDemo nivel={d.nivel} /> },
  { id: "sticker-cuadrado", caso: true, titulo: "Sticker: cuadrado", dibujar: (d) => <StickerDemo nivel={d.nivel} forma="cuadrado" /> },
  { id: "timbre", titulo: "Sellos con timbre (dos sellos nuevos)", dibujar: (d) => <SellosConTimbre nivel={d.nivel} total={10} llenos={7} nuevos={2} premio="Café gratis" semilla={d.semilla} respaldo={<Respaldo>7 de 10 sellos.</Respaldo>} /> },
  { id: "timbre-completa", caso: true, titulo: "Sellos con timbre: el último completa la tarjeta", dibujar: (d) => <SellosConTimbre nivel={d.nivel} total={6} llenos={6} nuevos={1} premio="Desayuno para dos" semilla={d.semilla} /> },
  { id: "ruleta", titulo: "Ruleta de premios", dibujar: (d) => <RuletaDemo nivel={d.nivel} semilla={d.semilla} /> },
  { id: "ruleta-servidor", caso: true, titulo: "Ruleta: el premio llega del servidor (tarda un segundo y medio)", dibujar: (d) => <RuletaDemo nivel={d.nivel} semilla={d.semilla} servidor="lenta" /> },
  { id: "ruleta-falla", caso: true, titulo: "Ruleta: la consulta falla", dibujar: (d) => <RuletaDemo nivel={d.nivel} semilla={d.semilla} servidor="falla" /> },
  { id: "ruleta-rara", caso: true, titulo: "Ruleta: 30 premios y textos enormes (quedan 12)", dibujar: (d) => <RuletaDePremios nivel={d.nivel} premios={Array.from({ length: 30 }, (_, i) => (i === 1 ? `Un premio ${"larguísimo ".repeat(12)}` : `Premio ${i + 1}`))} resultado={4} semilla={d.semilla} celebracion="nada" /> },
  { id: "ruleta-huecos", caso: true, titulo: "Ruleta: un premio vacío en la lista (el índice es el de la lista original)", dibujar: (d) => <RuletaDemo nivel={d.nivel} semilla={d.semilla} premios={["Café gratis", "", "Té helado", "Pan amasado"]} fijo={2} /> },
  { id: "ruleta-fuera", caso: true, titulo: "Ruleta: el resultado no existe (no anuncia premio)", dibujar: (d) => <RuletaDemo nivel={d.nivel} semilla={d.semilla} premios={["Café gratis", "", "Té helado", "Pan amasado"]} fijo={9} /> },
  { id: "ruleta-uno", caso: true, titulo: "Ruleta: un solo premio (no se dibuja)", dibujar: (d) => <RuletaDePremios nivel={d.nivel} premios={["Solo uno"]} /> },
  { id: "timbre-raro", caso: true, titulo: "Sellos con timbre: datos raros", dibujar: (d) => <SellosConTimbre nivel={d.nivel} total={5} llenos={9} nuevos={20} premio={`Un premio ${"larguísimo ".repeat(20)}`} semilla={d.semilla} /> },
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
    <section className="mom-seccion" data-prueba={seccion.id} style={seccion.ancha ? { gridColumn: "1 / -1" } : undefined}>
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
      <h2 className="mom-tanda">Efectos vistosos</h2>
      <div className="mom-grilla" data-prueba="vistosos">
        {VISTOSOS.map((s) => <Tarjeta key={s.id} seccion={s} datos={datos} />)}
      </div>
      <h2 className="mom-tanda">Con el dedo</h2>
      <div className="mom-grilla" data-prueba="con-el-dedo">
        {CON_EL_DEDO.filter((s) => !s.caso).map((s) => <Tarjeta key={s.id} seccion={s} datos={datos} />)}
      </div>
      <h3 className="mom-casos">Casos de prueba de «Con el dedo»</h3>
      <p className="enc-nota">Las mismas cuatro piezas con datos raros o fallas. Están aquí para las pruebas visuales.</p>
      <div className="mom-grilla">
        {CON_EL_DEDO.filter((s) => s.caso).map((s) => <Tarjeta key={s.id} seccion={s} datos={datos} />)}
      </div>
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

export { SECCIONES, SECCIONES_2, SUELTOS, VISTOSOS };
export type { Seccion, Datos };
