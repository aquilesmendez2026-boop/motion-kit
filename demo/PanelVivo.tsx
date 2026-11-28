// El panel vivo (#panel): una maqueta del panel de cada negocio de La Mente, con todas las secciones de su barra
// lateral (lamente-front/fronts/panel/src/services/direccion.ts), armada con las piezas de motion-kit y con estilo de
// manga: trazo grueso, sombra dura, líneas de velocidad, sellos que se estampan y cosas que llegan solas.
// Las piezas sueltas están en #panel-piezas (su prueba, verificar-panel) y el cómic en #comic.
import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { BarraLateral, BotonQueGuarda, BottomSheet, Campo, Confirmar, Contador, Copiar, CountUp, Interruptor, ListaViva, SubirImagen, Tabs, TextoCinetico, useToast } from "../src/entradas/interfaz";
import { CartelNovedad, Estallido, Globo, Guia, Oferta, useCelebrar, Vacio, type PasoGuia } from "../src/entradas/comic";
import { variablesTema } from "../src/interfaz/tema";
import { TEMAS, Tema, variablesDeTema } from "../src/entradas/temas";

// ——— Las secciones, como en el panel de verdad ———

interface Seccion {
  id: string;
  nombre: string;
  icono: string;
  /** El negocio no tiene su módulo: en la barra va punteada. */
  sinModulo?: boolean;
  corto?: string;
  titulo?: string;
  tituloContraida?: string;
  insignia?: string;
  atributos?: Record<`data-${string}`, string>;
}
interface Grupo {
  nombre: string | null;
  color: string;
  secciones: Seccion[];
}
/** Cami Viaja no tiene estos módulos (en la barra van punteados). */
const SIN_MODULO = new Set(["exclusiva", "turnos", "comisiones"]);
const CORTOS: Record<string, string> = { "clientes-cuenta": "Con cuenta" };
const s = (id: string, nombre: string, icono: string): Seccion => ({
  id,
  nombre,
  icono,
  corto: CORTOS[id],
  sinModulo: SIN_MODULO.has(id) || undefined,
  titulo: SIN_MODULO.has(id) ? "No está en tu pack. Ábrelo para ver cómo sumarlo." : undefined,
  tituloContraida: SIN_MODULO.has(id) ? `${nombre}. No está en tu pack.` : undefined,
  insignia: id === "pedidos" ? "3" : undefined,
  atributos: { "data-soporte-accion": `Pestaña ${nombre}` },
});

/** Los grupos de la barra y su tinta (Panel.tsx, COLOR_GRUPO del 27-11). */
const GRUPOS: Grupo[] = [
  { nombre: null, color: "#10223f", secciones: [s("resumen", "Resumen", "🏠")] },
  {
    nombre: "Tu página",
    color: "#8b5cf6",
    secciones: [
      s("pagina", "Página", "🌐"), s("exclusiva", "Página exclusiva", "💎"), s("agente", "Agente", "✨"), s("precios", "Precios", "🏷️"),
      s("novedades", "Novedades", "📰"), s("carteles", "QR y carteles", "🔳"), s("enlaces", "Enlaces", "🔗"), s("kit", "Kit de medios", "🎖️"),
      s("colaboraciones", "Colaboraciones", "🤝"), s("episodios", "Episodios", "🎙️"), s("galeria", "Galería", "🖼️"), s("avisos", "Avisos", "📣"),
      s("secciones", "Secciones extra", "📑"),
    ],
  },
  {
    nombre: "Clientes",
    color: "#14b8a6",
    secciones: [
      s("agenda", "Agenda", "📅"), s("recordatorios", "Recordatorios", "🔔"), s("pedidos", "Pedidos", "🛍️"), s("sellos", "Sellos", "🎟️"),
      s("clientes", "Clientes", "👥"), s("clientes-cuenta", "Clientes con cuenta", "✅"), s("resenas", "Reseñas", "⭐"), s("buzon", "Buzón", "📥"),
      s("cotizaciones", "Cotizaciones", "📄"),
    ],
  },
  {
    nombre: "Actividades",
    color: "#ec4899",
    secciones: [s("clases", "Horario de clases", "🏋️"), s("calendario", "Calendario", "🗓️"), s("packs", "Packs y abonos", "📦"), s("encuestas", "Encuestas", "🗳️"), s("sorteos", "Sorteos", "🎁"), s("eventos", "Eventos", "🎫")],
  },
  {
    nombre: "Tu negocio",
    color: "#f97316",
    secciones: [
      s("caja", "Caja", "💰"), s("pagosenlinea", "Pagos en línea", "💳"), s("vales", "Vales de regalo", "🎀"), s("turnos", "Turnos del equipo", "🕒"),
      s("asistencia", "Control de horario", "👆"), s("marcar", "Pantalla para marcar", "📲"), s("comisiones", "Comisiones", "％"), s("stock", "Stock", "🗃️"),
      s("estadisticas", "Estadísticas", "📈"),
    ],
  },
  { nombre: "Tu cuenta", color: "#3b82f6", secciones: [s("modulos", "Módulos", "🧩"), s("pagos", "Pagos", "🧾"), s("consumo", "Mi consumo", "📊")] },
];
const TODAS = GRUPOS.flatMap((g) => g.secciones.map((x) => ({ ...x, grupo: g })));
const buscar = (id: string) => TODAS.find((x) => x.id === id) ?? TODAS[0];

/** Qué hace cada sección, en una línea (bajo el título). */
const BAJADA: Record<string, string> = {
  resumen: "Cómo va tu negocio hoy, de un vistazo.",
  pagina: "Tu página en internet: el diseño, los textos y las fotos.",
  precios: "Lo que vendes y cuánto cuesta. Aparece en tu página.",
  novedades: "Cuéntale a tu gente lo nuevo.",
  colaboraciones: "Las marcas que quieren trabajar contigo. Responde, acuerda o descarta.",
  pedidos: "Lo que te piden por tu página, en el orden en que llega.",
  agenda: "Tus horas libres y las reservas de cada día.",
  caja: "Lo que entra y sale hoy.",
  consumo: "Lo que llevas usado de tu plan este mes.",
};

/** Ejemplos para las demás secciones: «título — detalle», separados por «;». */
const EJEMPLOS: Record<string, string> = {
  exclusiva: "Para suscriptores — 12 personas;Contenido de abril — 4 videos;Detrás de cámara — borrador",
  agente: "Responder preguntas — activo;Tomar reservas — activo;Recomendar viajes — en prueba",
  carteles: "QR del mesón — 230 lecturas;Cartel de vitrina — A4;Sticker para la caja — 5 × 5 cm",
  enlaces: "Instagram — 1.204 clics;YouTube — 860 clics;Mi guía de viaje — 312 clics",
  kit: "Audiencia — 48 mil;Tarifas 2026 — PDF;Marcas con que trabajé — 9",
  episodios: "Ep. 12 · Chiloé en invierno — 38 min;Ep. 11 · Comer en Valpo — 41 min;Ep. 10 · Atacama — 35 min",
  galeria: "Torres del Paine — 24 fotos;San Pedro — 18 fotos;Cajón del Maipo — 11 fotos",
  avisos: "Cerrado el 18 — hasta el 19;Nuevo horario — desde el lunes;Envíos gratis — este mes",
  secciones: "Preguntas frecuentes — 8;Cómo llegar — mapa;Equipo — 3 personas",
  recordatorios: "Un día antes — por correo;Dos horas antes — por WhatsApp;Después de la visita — reseña",
  sellos: "10 sellos = 1 gratis — 42 clientes;Cumpleaños — doble sello;Primera compra — 1 de regalo",
  clientes: "Javiera Soto — 6 visitas;Matías Rojas — 3 visitas;Fernanda Díaz — nueva",
  "clientes-cuenta": "javi.soto@correo.cl — desde marzo;mati.r@correo.cl — desde abril;fer.diaz@correo.cl — hoy",
  resenas: "«Lo mejor del verano» — ★★★★★;«Muy buena guía» — ★★★★★;«Volvería» — ★★★★",
  buzon: "¿Hacen tours privados? — hace 1 h;Consulta por fechas — ayer;Felicitaciones — lunes",
  cotizaciones: "Tour para 8 personas — $640.000;Video para hotel — $380.000;Charla en colegio — $120.000",
  clases: "Lunes 19:00 · Fotografía — 8 cupos;Miércoles 18:30 · Edición — 6 cupos;Sábado 10:00 · Salida — 12 cupos",
  calendario: "Feria de viajes — 3 dic;Salida a Cajón — 7 dic;Taller de video — 14 dic",
  packs: "Pack 4 clases — $48.000;Pack 8 clases — $88.000;Abono mensual — $110.000",
  encuestas: "¿A dónde vamos en enero? — 214 votos;¿Mejor horario? — 98 votos;¿Video o foto? — 61 votos",
  sorteos: "Mochila de viaje — termina el 5;Noche en Valpo — 312 participantes;Tour gratis — borrador",
  eventos: "Charla en Santiago — 40 entradas;Cine al aire libre — 120 entradas;Cena de cierre — 25 entradas",
  pagosenlinea: "Mercado Pago — conectado;Transferencia — activa;Tarjeta en la página — activa",
  vales: "Vale $20.000 — 6 vendidos;Vale $50.000 — 2 vendidos;Vale tour — 1 vendido",
  turnos: "Cami — lunes a viernes;Pablo — fines de semana;Sofi — tardes",
  asistencia: "Cami — entró 9:02;Pablo — entró 10:15;Sofi — sale 18:00",
  marcar: "Tablet del mesón — conectada;Celular de Pablo — conectado;Código del día — 4821",
  comisiones: "Pablo — 10 %;Sofi — 8 %;Ventas por la página — 0 %",
  stock: "Mochilas — 14;Guías impresas — 3 (¡pocas!);Stickers — 220",
  estadisticas: "Visitas a la página — 1.284;De Instagram — 61 %;Se quedan — 2 min 10 s",
  modulos: "Pedidos — activo;Agenda — activo;Novedades — prueba gratis",
  pagos: "Plan Crece — $12.990 al mes;Próximo cobro — 1 dic;Boleta de noviembre — lista",
};

// ——— Pequeñas ayudas ———

const TEMA = { fondo: "#FAF7F2", superficie: "#FFFFFF", texto: "#10223f", suave: "#5E5A68", borde: "#E7E1D8", acento: "#7c3aed" };

/** Las variables del tema en la raíz: los avisos, las hojas y la guía se dibujan fuera del panel. */
function useTemaEnLaRaiz() {
  useEffect(() => {
    const raiz = document.documentElement;
    const vars: Record<string, string> = { ...variablesTema(TEMA), "--mk-cartel": "#ffc83d", "--mk-fuente-cartel": '"Dela Gothic One","Arial Black",system-ui,sans-serif' };
    for (const [k, v] of Object.entries(vars)) raiz.style.setProperty(k, v);
    return () => {
      for (const k of Object.keys(vars)) raiz.style.removeProperty(k);
    };
  }, []);
}

/** Los temas del panel del catálogo (fase 2 de «Un solo motor»). */
const TEMAS_PANEL = TEMAS.filter((x) => x.para.includes("panel"));

/**
 * Las variables del tema también en <body>, solo las variables (como hace el front con data-tema-panel-cuerpo): los
 * avisos, Confirmar y la guía se dibujan ahí, fuera de la caja del panel.
 */
function useTemaEnElCuerpo(tema: string) {
  useEffect(() => {
    const cuerpo = document.body;
    const vars = variablesDeTema(tema, { para: "panel" });
    for (const [k, v] of Object.entries(vars)) cuerpo.style.setProperty(k, v);
    return () => {
      for (const k of Object.keys(vars)) cuerpo.style.removeProperty(k);
    };
  }, [tema]);
}

const TELEFONO = "(max-width: 819px)";
function useTelefono() {
  const [tel, setTel] = useState(() => typeof window !== "undefined" && window.matchMedia(TELEFONO).matches);
  useEffect(() => {
    const m = window.matchMedia(TELEFONO);
    const cambio = () => setTel(m.matches);
    m.addEventListener("change", cambio);
    return () => m.removeEventListener("change", cambio);
  }, []);
  return tel;
}

/** Un reloj que se limpia solo al desmontar. */
function useCada(ms: number, fn: () => void, activo = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!activo) return;
    const r = setInterval(() => ref.current(), ms);
    return () => clearInterval(r);
  }, [ms, activo]);
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
let siguienteId = 100;
const nuevoId = () => ++siguienteId;

/** Una tarjeta de manga: la caja negra de atrás es la sombra dura; la tarjeta se levanta al pasar y se hunde al tocar. */
function Hoja({ i = 0, className = "", children, ...resto }: { i?: number; className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="pv-sombra" style={{ "--i": i } as CSSProperties}>
      <div className={`pv-hoja ${className}`} data-mk-adorno="hoja" {...resto}>
        {children}
      </div>
    </div>
  );
}

/** La pastilla de estado: al cambiar, se estampa de nuevo. */
function Pastilla({ texto, tono }: { texto: string; tono: string }) {
  return (
    <span key={texto} className="pv-pastilla" data-tono={tono} data-mk-adorno="estado">
      {texto}
    </span>
  );
}

// ——— El panel ———

export function PanelVivo() {
  useTemaEnLaRaiz();
  const [tema, setTema] = useState("lamente");
  useTemaEnElCuerpo(tema);
  const tel = useTelefono();
  const toast = useToast();
  const [id, setId] = useState(() => (location.hash.startsWith("#panel?s=") ? location.hash.slice(9) : "colaboraciones"));
  const [menu, setMenu] = useState(false);
  const [contraida, setContraida] = useState(false);
  const [guia, setGuia] = useState(false);
  const [novedad, setNovedad] = useState(true);
  const [globo, setGlobo] = useState(false);
  // En el teléfono el cartel tapa el título: se ve unos segundos y queda la campana.
  const [cartelCorto, setCartelCorto] = useState(false);
  const actual = buscar(id);

  useEffect(() => {
    const r = setTimeout(() => setCartelCorto(true), 4000);
    return () => clearTimeout(r);
  }, []);

  useEffect(() => {
    const a = setTimeout(() => setGlobo(true), 2500);
    const b = setTimeout(() => setGlobo(false), 11000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  const ir = (nuevo: string) => {
    setId(nuevo);
    setMenu(false);
    history.replaceState(null, "", `#panel?s=${nuevo}`);
    window.scrollTo({ top: 0 });
  };

  const pasos: PasoGuia[] = [
    { objetivo: tel ? '[data-guia="barra-tel"]' : '[data-guia="barra"]', texto: "Aquí están todas las secciones de tu panel, ordenadas por grupo." },
    { objetivo: '[data-guia="cabeza"]', texto: "Cada sección parte con su nombre y lo que hace." },
    { objetivo: '[data-guia="accion"]', texto: "¡Y este botón es para empezar!" },
    { objetivo: '[data-guia="soporte"]', texto: "¿Dudas? Escríbenos aquí y te ayudamos." },
  ];

  // La sección activa queda a la vista en la barra (las de abajo quedan bajo el borde).
  const lado = useRef<HTMLElement>(null);
  useEffect(() => {
    lado.current?.querySelector<HTMLElement>("[aria-current=page]")?.scrollIntoView({ block: "nearest" });
  }, [id]);

  const barra = (conContraer: boolean) => (
    <BarraLateral
      grupos={GRUPOS}
      actual={id}
      alElegir={ir}
      contraida={conContraer && contraida}
      alContraer={conContraer ? () => setContraida((c) => !c) : undefined}
      propsContraer={{ "data-soporte-accion": "Contraer la barra", "aria-controls": "secciones-del-panel" }}
    />
  );

  return (
    <Tema tema={tema} para="panel" className="pv-panel">
      <style>{CSS}</style>
      <header className="pv-arriba">
        <a href="#" className="pv-marca">
          La Mente
        </a>
        <span className="pv-negocio">
          <span className="pv-avatar" aria-hidden="true">
            CV
          </span>
          Cami Viaja
        </span>
        {tel && (
          <button type="button" data-mk-adorno="boton" className="pv-boton pv-chico pv-menu" onClick={() => setMenu(true)} data-guia="barra-tel" aria-label="Secciones">
            ☰
          </button>
        )}
        <span className="pv-espacio" />
        <CartelNovedad
          texto="¡3 novedades!"
          visible={novedad && !(tel && cartelCorto)}
          alTocar={() => {
            setNovedad(false);
            toast("Llegaron 3 novedades de La Mente: el cómic del panel, la guía y los sellos nuevos.", { tipo: "info" });
          }}
          etiqueta="Novedades de La Mente"
        >
          <span className="pv-campana" aria-hidden="true">
            🔔
          </span>
        </CartelNovedad>
        <label className="pv-forma">
          <span>Tema</span>
          <select value={tema} onChange={(ev) => setTema(ev.target.value)} data-prueba="tema">
            {TEMAS_PANEL.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre}
              </option>
            ))}
          </select>
        </label>
        <button type="button" data-mk-adorno="boton" className="pv-boton pv-chico pv-amarillo" onClick={() => setGuia(true)}>
          {tel ? "Guía" : "¿Cómo se usa?"}
        </button>
      </header>

      <div className="pv-cuerpo" data-contraida={!tel && contraida ? "" : undefined}>
        {!tel && (
          <aside className="pv-lado" data-guia="barra" ref={lado}>
            {barra(true)}
          </aside>
        )}
        <main className="pv-principal" style={{ "--pv-grupo": actual.grupo.color } as CSSProperties}>
          <Cabeza key={actual.id} seccion={actual} />
          <div key={`c-${actual.id}`} className="pv-contenido">
            <Contenido id={actual.id} ir={ir} />
          </div>
        </main>
      </div>

      <BottomSheet open={menu} onClose={() => setMenu(false)} label="Secciones" maxHeight="80vh">
        <div className="pv-hoja-menu">{barra(false)}</div>
      </BottomSheet>

      <div className="pv-soporte-caja">
        {globo && (
          <Globo cola="abajo" className="pv-soporte-globo">
            ¿Te ayudo?
          </Globo>
        )}
        <button
          type="button"
          className="pv-soporte"
          data-guia="soporte"
          onClick={() => {
            setGlobo(false);
            toast("Soporte: te respondemos en minutos.", { tipo: "info" });
          }}
        >
          💬 Soporte
        </button>
      </div>

      <Guia abierta={guia} pasos={pasos} alTerminar={() => setGuia(false)} alSaltar={() => setGuia(false)} />
    </Tema>
  );
}

/** El encabezado de cada sección: el ícono amarillo con líneas de velocidad, el grupo y el título que cae. */
function Cabeza({ seccion }: { seccion: (typeof TODAS)[number] }) {
  return (
    <div className="pv-cabeza" data-guia="cabeza" data-mk-adorno="cabeza">
      <span className="pv-icono-caja" aria-hidden="true">
        <span className="pv-rayos" />
        <span className="pv-icono" data-mk-adorno="icono">{seccion.icono}</span>
      </span>
      <div className="pv-titulos">
        {seccion.grupo.nombre && <p className="pv-antetitulo">{seccion.grupo.nombre}</p>}
        <TextoCinetico texto={seccion.nombre} efecto="impacto" como="h1" className="pv-titulo" data-mk-adorno="titulo" />
        <p className="pv-bajada">{BAJADA[seccion.id] ?? "Lo que tengas aquí aparece en tu página."}</p>
      </div>
    </div>
  );
}

function Contenido({ id, ir }: { id: string; ir: (id: string) => void }) {
  switch (id) {
    case "resumen":
      return <Resumen ir={ir} />;
    case "pagina":
      return <PaginaSeccion />;
    case "precios":
      return <Precios />;
    case "novedades":
      return <Novedades />;
    case "colaboraciones":
      return <Colaboraciones />;
    case "pedidos":
      return <Pedidos />;
    case "agenda":
      return <Agenda />;
    case "caja":
      return <Caja />;
    case "consumo":
      return <Consumo />;
    default:
      return <Generica id={id} />;
  }
}

// ——— Resumen ———

const LLEGA = ["Javiera reservó para el sábado", "Nueva reseña: ★★★★★", "Pedido de Matías: 2 mochilas", "Café Altura quiere colaborar", "Fernanda se sumó a tus sellos", "12 visitas desde Instagram"];

function Resumen({ ir }: { ir: (id: string) => void }) {
  const [feed, setFeed] = useState(() => LLEGA.slice(0, 3).map((t, i) => ({ id: i, t })));
  const vuelta = useRef(3);
  useCada(4500, () => {
    const t = LLEGA[vuelta.current++ % LLEGA.length];
    setFeed((f) => [{ id: nuevoId(), t }, ...f].slice(0, 5));
  });
  const datos = [
    { n: 1284, t: "Visitas", d: "+12 %" },
    { n: 37, t: "Pedidos", d: "+5" },
    { n: 12, t: "Reservas", d: "hoy 3" },
    { n: 48, t: "Reseñas", d: "★ 4,8" },
  ];
  const semana = [40, 62, 48, 80, 70, 95, 58];
  return (
    <>
      <div className="pv-datos">
        {datos.map((d, i) => (
          <Hoja key={d.t} i={i} className="pv-dato">
            <span className="pv-dato-n">
              <CountUp to={d.n} locale="es-CL" />
            </span>
            <span className="pv-dato-t">{d.t}</span>
            <Pastilla texto={d.d} tono="menta" />
          </Hoja>
        ))}
      </div>
      <div className="pv-dos">
        <Hoja i={4}>
          <h2 className="pv-h2" data-mk-adorno="titulo">Esta semana</h2>
          <div className="pv-barras" role="img" aria-label="Visitas de la semana: el sábado fue el mejor día">
            {semana.map((v, i) => (
              <span key={i} className="pv-barra-dia" style={{ "--i": i, "--alto": v / 100 } as CSSProperties}>
                <b />
                <small>{"LMMJVSD"[i]}</small>
              </span>
            ))}
          </div>
        </Hoja>
        <Hoja i={5}>
          <h2 className="pv-h2" data-mk-adorno="titulo">
            Lo que llega <span className="pv-envivo">● en vivo</span>
          </h2>
          <ListaViva className="pv-feed">
            {feed.map((f) => (
              <div key={f.id} className="pv-feed-fila">
                {f.t}
              </div>
            ))}
          </ListaViva>
        </Hoja>
      </div>
      <div className="pv-fila-botones">
        <button type="button" data-mk-adorno="boton" className="pv-boton pv-amarillo" data-guia="accion" onClick={() => ir("pagina")}>
          Editar mi página →
        </button>
        <button type="button" data-mk-adorno="boton" className="pv-boton" onClick={() => ir("pedidos")}>
          Ver pedidos
        </button>
      </div>
    </>
  );
}

// ——— Página ———

function useSubida() {
  const [imagen, setImagen] = useState<string>();
  const [subiendo, setSubiendo] = useState<number | false>(false);
  const reloj = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(reloj.current), []);
  return {
    imagen,
    subiendo,
    alElegir: (archivo: File) => {
      clearInterval(reloj.current);
      let a = 0;
      setSubiendo(0);
      reloj.current = setInterval(() => {
        a += 0.12;
        if (a >= 1) {
          clearInterval(reloj.current);
          setSubiendo(false);
          setImagen(URL.createObjectURL(archivo));
        } else setSubiendo(a);
      }, 150);
    },
    alQuitar: () => setImagen(undefined),
  };
}

const ESTILOS = [
  { id: "manga", nombre: "Manga", fondo: "#10223f", tinta: "#ffc83d" },
  { id: "suave", nombre: "Suave", fondo: "#f3e8ff", tinta: "#6d28d9" },
  { id: "noche", nombre: "Noche", fondo: "#0b0b12", tinta: "#22d3ee" },
];

function PaginaSeccion() {
  const celebrar = useCelebrar();
  const [pestana, setPestana] = useState("diseno");
  const [estilo, setEstilo] = useState(ESTILOS[0]);
  const [publicada, setPublicada] = useState(false);
  const [texto, setTexto] = useState("Viajes y videos por Chile");
  const [error, setError] = useState<string>();
  const logo = useSubida();
  const portada = useSubida();
  return (
    <>
      <div className="pv-dos pv-dos-ancha">
        <Hoja i={0} className="pv-vista" style={{ "--pv-vista-fondo": estilo.fondo, "--pv-vista-tinta": estilo.tinta } as CSSProperties}>
          <span className="pv-vista-rayos" aria-hidden="true" />
          {publicada && (
            <span className="pv-vista-sello">
              <Estallido texto="¡En vivo!" tamano={86} late />
            </span>
          )}
          <span className="pv-vista-logo" aria-hidden="true">
            {logo.imagen ? <img src={logo.imagen} alt="" /> : "CV"}
          </span>
          <strong className="pv-vista-nombre">Cami Viaja</strong>
          <span className="pv-vista-texto">{texto || "…"}</span>
          <span className="pv-vista-boton">Reservar</span>
        </Hoja>
        <Hoja i={1}>
          <h2 className="pv-h2" data-mk-adorno="titulo">Tu link</h2>
          <p className="pv-nota">Compártelo en tu Instagram o por WhatsApp.</p>
          <div className="pv-link">
            <code>lamente.cl/cami-viaja</code>
            <Copiar texto="https://lamente.cl/cami-viaja" data-mk-adorno="boton" className="pv-boton pv-chico">
              Copiar
            </Copiar>
          </div>
          <div className="pv-fila-botones">
            <button
              type="button"
              data-mk-adorno="boton" className="pv-boton pv-amarillo"
              data-guia="accion"
              onClick={() => {
                setPublicada(true);
                celebrar("¡Publicada!");
              }}
            >
              {publicada ? "Publicar de nuevo" : "Publicar"}
            </button>
          </div>
        </Hoja>
      </div>
      <div className="pv-carpeta">
        <Tabs
          items={[
            { id: "diseno", label: "Diseño" },
            { id: "textos", label: "Textos" },
            { id: "fotos", label: "Fotos" },
          ]}
          value={pestana}
          onChange={setPestana}
          label="Qué editar"
          className="pv-pestanas"
        />
        <Hoja key={pestana} className="pv-carpeta-hoja">
          {pestana === "diseno" && (
            <div className="pv-estilos" role="radiogroup" aria-label="Estilo de la página">
              {ESTILOS.map((e) => (
                <button key={e.id} type="button" role="radio" aria-checked={e.id === estilo.id} className="pv-estilo" style={{ "--f": e.fondo, "--t": e.tinta } as CSSProperties} onClick={() => setEstilo(e)}>
                  <span aria-hidden="true" />
                  {e.nombre}
                </button>
              ))}
            </div>
          )}
          {pestana === "textos" && (
            <form
              className="pv-form"
              onSubmit={(ev) => ev.preventDefault()}
            >
              <Campo etiqueta="Qué haces, en una frase" ayuda="Al menos 20 letras. Sale bajo tu nombre." error={error}>
                {(a11y) => <textarea {...a11y} className="pv-entrada" rows={3} value={texto} onChange={(ev) => setTexto(ev.target.value)} />}
              </Campo>
              <BotonQueGuarda
                data-mk-adorno="boton" className="pv-boton pv-amarillo"
                alGuardar={async () => {
                  await espera(700);
                  if (texto.trim().length < 20) {
                    setError("Escribe un poco más: al menos 20 letras.");
                    throw new Error("corto");
                  }
                  setError(undefined);
                }}
              >
                Guardar borrador
              </BotonQueGuarda>
            </form>
          )}
          {pestana === "fotos" && (
            <div className="pv-fotos">
              <SubirImagen etiqueta="Tu logo" forma="redonda" imagen={logo.imagen} subiendo={logo.subiendo} alElegir={logo.alElegir} alQuitar={logo.alQuitar} />
              <SubirImagen etiqueta="Portada" ayuda="Horizontal, como una foto del celular de lado." forma="apaisada" imagen={portada.imagen} subiendo={portada.subiendo} alElegir={portada.alElegir} alQuitar={portada.alQuitar} />
            </div>
          )}
        </Hoja>
      </div>
    </>
  );
}

// ——— Precios ———

const PRECIOS = [
  ["Tour por Valparaíso", 25000],
  ["Video para tu marca", 180000],
  ["Asesoría de viaje", 35000],
  ["Taller de fotos con celular", 20000],
] as const;
const peso = (n: number) => `$${n.toLocaleString("es-CL")}`;

function Precios() {
  const celebrar = useCelebrar();
  const toast = useToast();
  const [lista, setLista] = useState<{ id: number; nombre: string; precio: number; visible: boolean }[]>([]);
  const [borrar, setBorrar] = useState<number | null>(null);
  const agregar = () => {
    const [nombre, precio] = PRECIOS[lista.length % PRECIOS.length];
    if (lista.length === 0) celebrar("¡Primer precio!");
    setLista((l) => [...l, { id: nuevoId(), nombre, precio, visible: true }]);
  };
  if (lista.length === 0)
    return (
      <Hoja i={0}>
        <Vacio icono={<span className="pv-icono-chico pv-icono-grande">🏷️</span>} titulo="Aún no tienes precios" texto="Crea el primero y aparece al tiro en tu página." accion={<button type="button" data-mk-adorno="boton" className="pv-boton pv-amarillo" data-guia="accion" onClick={agregar}>Crear el primero</button>} />
      </Hoja>
    );
  const quien = lista.find((p) => p.id === borrar);
  return (
    <>
      <ListaViva className="pv-grilla">
        {lista.map((p) => (
          <Hoja key={p.id}>
            <div className="pv-fila">
              <strong>{p.nombre}</strong>
              <span className="pv-precio">{peso(p.precio)}</span>
            </div>
            <div className="pv-fila">
              <Interruptor activo={p.visible} etiqueta="Se ve en la página" textos={["Oculto", "Visible"]} alCambiar={(v) => setLista((l) => l.map((x) => (x.id === p.id ? { ...x, visible: v } : x)))} />
              <button type="button" data-mk-adorno="boton" className="pv-boton pv-chico pv-peligro" onClick={() => setBorrar(p.id)}>
                Borrar
              </button>
            </div>
          </Hoja>
        ))}
      </ListaViva>
      <div className="pv-fila-botones">
        <button type="button" data-mk-adorno="boton" className="pv-boton pv-amarillo" data-guia="accion" onClick={agregar}>
          + Agregar precio
        </button>
      </div>
      <Confirmar
        abierto={borrar !== null}
        pregunta={`¿Borrar «${quien?.nombre ?? ""}»?`}
        detalle="Deja de verse en tu página."
        textoSi="Sí, borrar"
        peligro
        alCancelar={() => setBorrar(null)}
        alConfirmar={() => {
          const antes = lista;
          setLista((l) => l.filter((x) => x.id !== borrar));
          setBorrar(null);
          toast("Precio borrado.", { accion: { texto: "Deshacer", alHacer: () => setLista(antes) } });
        }}
      />
    </>
  );
}

// ——— Novedades ———

function Novedades() {
  const celebrar = useCelebrar();
  const [activo, setActivo] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [error, setError] = useState<string>();
  const [posts, setPosts] = useState([{ id: 1, t: "¡Nuevo tour a Chiloé en enero!", f: "hace 2 días" }]);
  if (!activo)
    return (
      <Oferta destacado="¡30 días gratis!" accion={<button type="button" data-mk-adorno="boton" className="pv-boton pv-amarillo" data-guia="accion" onClick={() => { setActivo(true); celebrar("¡Activado!"); }}>Probar gratis</button>}>
        <Hoja i={0} className="pv-oferta">
          <h2 className="pv-h2" data-mk-adorno="titulo">Novedades</h2>
          <p className="pv-nota">Publica lo nuevo y le llega a tu gente en tu página y por correo.</p>
          <ul className="pv-lista-check">
            <li>Fotos y texto corto</li>
            <li>Aviso por correo a tus clientes</li>
            <li>Se ordena solo, lo último primero</li>
          </ul>
        </Hoja>
      </Oferta>
    );
  return (
    <>
      <Hoja i={0}>
        <form className="pv-form" onSubmit={(ev) => ev.preventDefault()}>
          <Campo etiqueta="¿Qué hay de nuevo?" error={error}>
            {(a11y) => <input {...a11y} className="pv-entrada" value={titulo} placeholder="Ej.: ¡Fechas nuevas para Atacama!" onChange={(ev) => setTitulo(ev.target.value)} />}
          </Campo>
          <BotonQueGuarda
            data-mk-adorno="boton" className="pv-boton pv-amarillo"
            data-guia="accion"
            textos={{ guardando: "Publicando…", bien: "¡Publicada!" }}
            alGuardar={async () => {
              await espera(600);
              if (!titulo.trim()) {
                setError("Escribe la novedad primero.");
                throw new Error("vacia");
              }
              setError(undefined);
              setPosts((p) => [{ id: nuevoId(), t: titulo.trim(), f: "recién" }, ...p]);
              setTitulo("");
            }}
          >
            Publicar novedad
          </BotonQueGuarda>
        </form>
      </Hoja>
      <ListaViva className="pv-grilla">
        {posts.map((p) => (
          <Hoja key={p.id}>
            <div className="pv-fila">
              <strong>{p.t}</strong>
              <Pastilla texto={p.f} tono={p.f === "recién" ? "lila" : "gris"} />
            </div>
          </Hoja>
        ))}
      </ListaViva>
    </>
  );
}

// ——— Colaboraciones (como la pantalla de verdad) ———

type EstadoColab = "nueva" | "conversando" | "acordada" | "descartada";
const ESTADOS: { id: EstadoColab; nombre: string; tono: string }[] = [
  { id: "nueva", nombre: "Nueva", tono: "lila" },
  { id: "conversando", nombre: "Conversando", tono: "durazno" },
  { id: "acordada", nombre: "Acordada", tono: "menta" },
  { id: "descartada", nombre: "Descartada", tono: "gris" },
];
interface Colab {
  id: number;
  marca: string;
  persona: string;
  correo: string;
  estado: EstadoColab;
  presupuesto: string;
  texto: string;
  link: string;
  fecha: string;
}
const COLABS: Colab[] = [
  { id: 1, marca: "Café Altura", persona: "Daniela Paz", correo: "daniela@cafealtura.cl", estado: "nueva", presupuesto: "$150.000", texto: "Queremos un video de 60 s mostrando nuestro café en tu próximo viaje al sur.", link: "cafealtura.cl", fecha: "hace 2 h" },
  { id: 2, marca: "Mochilas Andes", persona: "Tomás Vera", correo: "tomas@andes.cl", estado: "conversando", presupuesto: "$300.000", texto: "Te mandamos una mochila para el tour de Chiloé y la muestras en 3 historias.", link: "mochilasandes.cl", fecha: "ayer" },
  { id: 3, marca: "Hostal Cerro Alegre", persona: "Inés Mora", correo: "ines@cerroalegre.cl", estado: "acordada", presupuesto: "2 noches", texto: "Canje: dos noches a cambio de un reel del hostal y una mención en tu página.", link: "cerroalegre.cl", fecha: "lunes" },
  { id: 4, marca: "App Rutas", persona: "Bruno Leal", correo: "bruno@rutas.app", estado: "descartada", presupuesto: "—", texto: "Probar la app en un viaje y contar qué te pareció.", link: "rutas.app", fecha: "15 nov" },
];
const LLEGAN: Omit<Colab, "id" | "estado" | "fecha">[] = [
  { marca: "Bloqueador Sur", persona: "Rocío Salas", correo: "rocio@bloqueadorsur.cl", presupuesto: "$90.000", texto: "Una historia en la playa usando nuestro bloqueador. ¿Te tinca?", link: "bloqueadorsur.cl" },
  { marca: "Tren Central", persona: "Marco Díaz", correo: "marco@trencentral.cl", presupuesto: "$220.000", texto: "Un viaje en tren a Talca contado en un video corto.", link: "trencentral.cl" },
];

function Colaboraciones() {
  const toast = useToast();
  const [lista, setLista] = useState(COLABS);
  const [filtro, setFiltro] = useState<"todas" | EstadoColab>("todas");
  const [borrar, setBorrar] = useState<number | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const llegadas = useRef(0);
  const cuenta = (e: EstadoColab) => lista.filter((c) => c.estado === e).length;
  const visibles = filtro === "todas" ? lista : lista.filter((c) => c.estado === filtro);
  const nuevas = cuenta("nueva");
  const llega = () => {
    const c = LLEGAN[llegadas.current++ % LLEGAN.length];
    setLista((l) => [{ ...c, id: nuevoId(), estado: "nueva", fecha: "recién" }, ...l]);
    toast(`${c.marca} quiere colaborar contigo.`, { tipo: "bien" });
  };
  const quien = lista.find((c) => c.id === borrar);
  return (
    <>
      <div className="pv-barra-filtros">
        <Tabs
          items={[{ id: "todas", label: `Todas (${lista.length})` }, ...ESTADOS.map((e) => ({ id: e.id, label: `${e.nombre} (${cuenta(e.id)})` }))]}
          value={filtro}
          onChange={(v) => setFiltro(v as typeof filtro)}
          label="Filtrar por estado"
          className="pv-pestanas"
        />
        {nuevas > 0 && (
          <span className="pv-sello-nuevas" aria-hidden="true">
            <Estallido texto={`¡${nuevas} nueva${nuevas > 1 ? "s" : ""}!`} tamano={78} late />
          </span>
        )}
      </div>
      {visibles.length === 0 ? (
        <Hoja>
          <Vacio icono={<span className="pv-icono-chico pv-icono-grande">🤝</span>} titulo="Nada por aquí" texto="Cuando una marca te escriba desde tu página, aparece aquí." />
        </Hoja>
      ) : (
        <ListaViva key={filtro} className="pv-grilla">
          {visibles.map((c, i) => {
            const e = ESTADOS.find((x) => x.id === c.estado)!;
            return (
              <Hoja key={c.id} i={i} className="pv-colab" data-estado={c.estado}>
                <div className="pv-colab-cabeza">
                  <span className="pv-icono-chico" aria-hidden="true">
                    🤝
                  </span>
                  <div>
                    <strong className="pv-colab-marca">{c.marca}</strong>
                    <span className="pv-meta">
                      {c.persona} · {c.fecha}
                    </span>
                  </div>
                  <Pastilla texto={e.nombre} tono={e.tono} />
                </div>
                <p className="pv-colab-texto">{c.texto}</p>
                <div className="pv-colab-datos">
                  <span>
                    <small>Presupuesto</small>
                    <b>{c.presupuesto}</b>
                  </span>
                  <span>
                    <small>Web</small>
                    <a href={`https://${c.link}`} onClick={(ev) => ev.preventDefault()}>
                      {c.link}
                    </a>
                  </span>
                </div>
                <div className="pv-colab-acciones">
                  <a data-mk-adorno="boton" className="pv-boton pv-amarillo pv-chico" href={`mailto:${c.correo}`} onClick={(ev) => { ev.preventDefault(); toast(`Abriría tu correo para responderle a ${c.persona}.`); if (c.estado === "nueva") setLista((l) => l.map((x) => (x.id === c.id ? { ...x, estado: "conversando" } : x))); }} {...(i === 0 ? { "data-guia": "accion" } : {})}>
                    Responder por correo
                  </a>
                  <label className="pv-select">
                    <span className="pv-oculto">Estado de {c.marca}</span>
                    <select value={c.estado} onChange={(ev) => setLista((l) => l.map((x) => (x.id === c.id ? { ...x, estado: ev.target.value as EstadoColab } : x)))}>
                      {ESTADOS.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" data-mk-adorno="boton" className="pv-boton pv-chico pv-peligro" onClick={() => setBorrar(c.id)}>
                    Borrar
                  </button>
                </div>
              </Hoja>
            );
          })}
        </ListaViva>
      )}
      <div className="pv-fila-botones">
        <button type="button" data-mk-adorno="boton" className="pv-boton" onClick={llega}>
          Simular que llega una
        </button>
      </div>
      <Confirmar
        abierto={borrar !== null}
        pregunta={`¿Borrar la colaboración con ${quien?.marca ?? ""}?`}
        detalle="Se borra el mensaje. La marca no se entera."
        textoSi="Sí, borrar"
        peligro
        ocupado={ocupado}
        alCancelar={() => setBorrar(null)}
        alConfirmar={async () => {
          setOcupado(true);
          await espera(500);
          const antes = lista;
          setLista((l) => l.filter((x) => x.id !== borrar));
          setOcupado(false);
          setBorrar(null);
          toast("Colaboración borrada.", { accion: { texto: "Deshacer", alHacer: () => setLista(antes) } });
        }}
      />
    </>
  );
}

// ——— Pedidos ———

const PASOS_PEDIDO = [
  { nombre: "Nuevo", tono: "lila" },
  { nombre: "Preparando", tono: "durazno" },
  { nombre: "Listo", tono: "menta" },
  { nombre: "Entregado", tono: "gris" },
];
const CLIENTES = ["Javiera", "Matías", "Fernanda", "Pablo", "Sofía", "Diego"];
const COSAS = ["2 mochilas", "1 guía impresa", "Tour Valpo × 3", "Pack de stickers", "Vale $20.000"];

function Pedidos() {
  const toast = useToast();
  const celebrar = useCelebrar();
  const [recibir, setRecibir] = useState(true);
  const [pedidos, setPedidos] = useState([
    { id: 1, quien: "Javiera", que: "Tour Valpo × 2", paso: 1 },
    { id: 2, quien: "Matías", que: "1 guía impresa", paso: 2 },
  ]);
  const n = useRef(0);
  const primero = useRef(true);
  const llega = () => {
    const p = { id: nuevoId(), quien: CLIENTES[n.current % CLIENTES.length], que: COSAS[n.current % COSAS.length], paso: 0 };
    n.current++;
    setPedidos((l) => [p, ...l].slice(0, 8));
    if (primero.current) {
      primero.current = false;
      celebrar("¡Pedido nuevo!");
    } else toast(`Llegó un pedido de ${p.quien}.`, { tipo: "bien" });
  };
  useCada(9000, llega, recibir);
  const pendientes = pedidos.filter((p) => p.paso < 3).length;
  return (
    <>
      <Hoja i={0} className="pv-fila pv-fila-ancha">
        <Interruptor activo={recibir} alCambiar={setRecibir} etiqueta="Recibir pedidos por la página" textos={["Pausado", "Abierto"]} />
        <Contador valor={pendientes} etiqueta="por atender" />
        <button type="button" data-mk-adorno="boton" className="pv-boton pv-amarillo" data-guia="accion" onClick={llega}>
          Simular un pedido
        </button>
      </Hoja>
      <ListaViva className="pv-grilla">
        {pedidos.map((p) => {
          const paso = PASOS_PEDIDO[p.paso];
          return (
            <Hoja key={p.id} className="pv-pedido">
              <div className="pv-fila">
                <strong>{p.quien}</strong>
                <Pastilla texto={paso.nombre} tono={paso.tono} />
              </div>
              <span className="pv-meta">{p.que}</span>
              <div className="pv-pasos" aria-hidden="true">
                {PASOS_PEDIDO.map((_, i) => (
                  <i key={i} data-hecho={i <= p.paso || undefined} />
                ))}
              </div>
              {p.paso < 3 && (
                <button type="button" data-mk-adorno="boton" className="pv-boton pv-chico" onClick={() => setPedidos((l) => l.map((x) => (x.id === p.id ? { ...x, paso: x.paso + 1 } : x)))}>
                  {PASOS_PEDIDO[p.paso + 1].nombre} →
                </button>
              )}
            </Hoja>
          );
        })}
      </ListaViva>
    </>
  );
}

// ——— Agenda ———

const DIAS = ["Lun 1", "Mar 2", "Mié 3", "Jue 4", "Vie 5"];
const HORAS = ["10:00", "11:30", "13:00", "15:00", "16:30", "18:00"];

function Agenda() {
  const toast = useToast();
  const [dia, setDia] = useState(DIAS[0]);
  const [reservas, setReservas] = useState<Record<string, string>>({ "Lun 1 11:30": "Javiera", "Lun 1 16:30": "Matías", "Mar 2 10:00": "Sofía" });
  return (
    <>
      <Tabs items={DIAS.map((d) => ({ id: d, label: d }))} value={dia} onChange={setDia} label="Día" className="pv-pestanas" />
      <div key={dia} className="pv-horas">
        {HORAS.map((h, i) => {
          const clave = `${dia} ${h}`;
          const quien = reservas[clave];
          return (
            <Hoja key={h} i={i} className="pv-hora" data-reservada={quien ? "" : undefined}>
              <b>{h}</b>
              {quien ? (
                <>
                  <span>{quien}</span>
                  <Pastilla texto="Reservada" tono="menta" />
                </>
              ) : (
                <button
                  type="button"
                  data-mk-adorno="boton" className="pv-boton pv-chico pv-amarillo"
                  {...(i === 0 ? { "data-guia": "accion" } : {})}
                  onClick={() => {
                    setReservas((r) => ({ ...r, [clave]: "Tú (a mano)" }));
                    toast(`Agendado el ${dia} a las ${h}.`, { tipo: "bien" });
                  }}
                >
                  Agendar
                </button>
              )}
            </Hoja>
          );
        })}
      </div>
    </>
  );
}

// ——— Caja ———

function Caja() {
  const [movs, setMovs] = useState([
    { id: 1, t: "Venta: Tour Valpo", n: 25000 },
    { id: 2, t: "Gasto: bencina", n: -18000 },
  ]);
  const total = movs.reduce((a, m) => a + m.n, 0);
  const anotar = (t: string, n: number) => setMovs((l) => [{ id: nuevoId(), t, n }, ...l]);
  return (
    <>
      <Hoja i={0} className="pv-caja-total">
        <small>Hoy en caja</small>
        <span key={total} className="pv-caja-n">
          <CountUp to={total} prefix="$" locale="es-CL" duration={700} />
        </span>
        <div className="pv-fila-botones">
          <button type="button" data-mk-adorno="boton" className="pv-boton pv-amarillo" data-guia="accion" onClick={() => anotar("Venta: asesoría", 35000)}>
            + Venta $35.000
          </button>
          <button type="button" data-mk-adorno="boton" className="pv-boton" onClick={() => anotar("Gasto: café", -2500)}>
            − Gasto $2.500
          </button>
        </div>
      </Hoja>
      <ListaViva className="pv-grilla pv-grilla-una">
        {movs.map((m) => (
          <Hoja key={m.id}>
            <div className="pv-fila">
              <span>{m.t}</span>
              <b className={m.n < 0 ? "pv-rojo" : "pv-verde"}>{(m.n < 0 ? "−" : "+") + peso(Math.abs(m.n))}</b>
            </div>
          </Hoja>
        ))}
      </ListaViva>
    </>
  );
}

// ——— Mi consumo ———

function Consumo() {
  const usos = [
    { t: "Correos enviados", v: 640, max: 1000 },
    { t: "Fotos guardadas", v: 182, max: 500 },
    { t: "Respuestas del agente", v: 910, max: 1000 },
  ];
  return (
    <div className="pv-grilla pv-grilla-una">
      {usos.map((u, i) => (
        <Hoja key={u.t} i={i}>
          <div className="pv-fila">
            <strong>{u.t}</strong>
            <span className="pv-meta">
              <CountUp to={u.v} locale="es-CL" /> de {u.max.toLocaleString("es-CL")}
            </span>
          </div>
          <span className="pv-uso" data-alto={u.v / u.max > 0.85 || undefined}>
            <b style={{ "--uso": u.v / u.max, "--i": i } as CSSProperties} />
          </span>
          {u.v / u.max > 0.85 && <p className="pv-nota pv-rojo" {...(i === 2 ? { "data-guia": "accion" } : {})}>¡Casi llegas al tope! Sube de plan en Módulos.</p>}
        </Hoja>
      ))}
    </div>
  );
}

// ——— Las demás: parten vacías, con la mano, y se llenan con ejemplos ———

function Generica({ id }: { id: string }) {
  const celebrar = useCelebrar();
  const sec = buscar(id);
  const ejemplos = (EJEMPLOS[id] ?? "Primero — ejemplo;Segundo — ejemplo;Tercero — ejemplo").split(";").map((x) => x.split(" — "));
  const [items, setItems] = useState<{ id: number; t: string; m: string; activo: boolean }[]>([]);
  if (items.length === 0)
    return (
      <Hoja i={0}>
        <Vacio
          icono={<span className="pv-icono-chico pv-icono-grande">{sec.icono}</span>}
          titulo={`Aún no hay nada en ${sec.nombre}`}
          texto="Parte con unos ejemplos y después los cambias por los tuyos."
          accion={
            <button
              type="button"
              data-mk-adorno="boton" className="pv-boton pv-amarillo"
              data-guia="accion"
              onClick={() => {
                setItems(ejemplos.map(([t, m]) => ({ id: nuevoId(), t, m: m ?? "", activo: true })));
                celebrar("¡Listo!");
              }}
            >
              Crear el primero
            </button>
          }
        />
      </Hoja>
    );
  return (
    <ListaViva className="pv-grilla">
      {items.map((it, i) => (
        <Hoja key={it.id} i={i}>
          <div className="pv-colab-cabeza">
            <span className="pv-icono-chico" aria-hidden="true">
              {sec.icono}
            </span>
            <div>
              <strong>{it.t}</strong>
              <span className="pv-meta">{it.m}</span>
            </div>
            <Pastilla texto={it.activo ? "Activo" : "Pausado"} tono={it.activo ? "menta" : "gris"} />
          </div>
          <Interruptor activo={it.activo} etiqueta="Activo" alCambiar={(v) => setItems((l) => l.map((x) => (x.id === it.id ? { ...x, activo: v } : x)))} />
        </Hoja>
      ))}
    </ListaViva>
  );
}

// ——— Estilos (solo de la demo) ———

const CSS = `
.pv-panel{--pv-tinta:var(--mk-texto,#10223f);--pv-sol:var(--mk-cartel,#ffc83d);--pv-fondo:var(--mk-fondo,#FAF7F2);--pv-carta:var(--mk-fuente-cartel,'Dela Gothic One','Arial Black',system-ui,sans-serif);min-height:100vh;background:var(--pv-fondo);color:var(--pv-tinta);font-family:Outfit,Inter,system-ui,sans-serif;overflow-x:clip}
.pv-arriba{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:12px;padding:10px clamp(12px,3vw,24px);background:var(--pv-fondo);border-bottom:2.5px solid var(--pv-tinta)}
.pv-pestanas{max-width:100%;overflow-x:auto;scrollbar-width:none}
.pv-menu{width:44px;padding:0;font-size:1.2rem}
.pv-marca{white-space:nowrap;font-family:var(--pv-carta);font-weight:900;font-size:1.15rem;color:var(--pv-tinta);text-decoration:none;letter-spacing:.01em}
.pv-negocio{display:inline-flex;align-items:center;gap:8px;font-weight:600;font-size:.95rem}
.pv-avatar{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--pv-tinta);color:var(--pv-sol);font-size:.7rem;font-weight:800}
.pv-espacio{flex:1}
.pv-forma{display:inline-flex;align-items:center;gap:6px;font-size:.8rem;font-weight:700}
.pv-forma select{min-height:44px;padding:0 8px;border:2px solid var(--pv-tinta);border-radius:10px;background:#fff;font:inherit;color:inherit}
.pv-campana{display:grid;place-items:center;width:44px;height:44px;font-size:1.3rem}
.pv-cuerpo{display:grid;grid-template-columns:262px minmax(0,1fr);align-items:start}
.pv-cuerpo[data-contraida]{grid-template-columns:92px minmax(0,1fr)}
.pv-lado{position:sticky;top:62px;max-height:calc(100vh - 62px);overflow:auto;padding:14px 12px 90px 14px}
.pv-principal{min-width:0;padding:clamp(16px,3vw,32px) clamp(16px,3vw,36px) 120px;background-image:radial-gradient(color-mix(in srgb,var(--pv-tinta) 9%,transparent) 1px,transparent 1.4px);background-size:14px 14px}
.pv-hoja-menu{padding:4px 8px 24px}
.pv-hoja-menu .mk-barra{padding:0;border:0;box-shadow:none}

.pv-cabeza{display:flex;align-items:center;gap:18px;margin:0 0 22px}
.pv-icono-caja{position:relative;flex:none;display:grid;place-items:center;width:76px;height:76px}
.pv-rayos{position:absolute;inset:-26px;border-radius:50%;background:repeating-conic-gradient(var(--pv-grupo) 0 4deg,transparent 4deg 18deg);-webkit-mask:radial-gradient(circle,transparent 36%,#000 38%,#000 58%,transparent 70%);mask:radial-gradient(circle,transparent 36%,#000 38%,#000 58%,transparent 70%);opacity:.45}
.pv-icono{position:relative;display:grid;place-items:center;width:64px;height:64px;border:2.5px solid var(--pv-tinta);border-radius:14px;background:var(--pv-sol);box-shadow:5px 5px 0 var(--pv-tinta);font-size:1.9rem}
.pv-titulos{min-width:0}
.pv-antetitulo{margin:0;font-size:.75rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--pv-grupo)}
.pv-titulo{margin:.05em 0 .1em;font-family:var(--pv-carta);font-weight:900;font-size:clamp(1.9rem,6vw,3rem);line-height:1.02;letter-spacing:-.01em}
.pv-bajada{margin:0;color:#5E5A68;max-width:60ch;line-height:1.45}

.pv-sombra{border-radius:var(--mk-radio-tarjeta,16px)}
.pv-hoja{position:relative;height:100%;box-sizing:border-box;padding:18px;border:var(--mk-trazo,2.5px solid var(--pv-tinta));border-radius:var(--mk-radio-tarjeta,16px);background:var(--mk-superficie,#fff);box-shadow:var(--mk-sombra,6px 6px 0 var(--pv-tinta));transition:transform .18s cubic-bezier(.3,1.6,.5,1)}
.pv-hoja:hover{transform:var(--mk-levantar,translate(-2px,-2px))}
.pv-h2{display:flex;align-items:center;gap:10px;margin:0 0 12px;font-size:1.05rem;font-weight:800}
.pv-nota{margin:0 0 12px;color:#5E5A68;font-size:.92rem;line-height:1.45}
.pv-meta{display:block;color:#5E5A68;font-size:.85rem}
.pv-oculto{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.pv-rojo{color:#c2410c}
.pv-verde{color:#047857}

.pv-boton{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:0 18px;border:var(--mk-trazo,2px solid var(--pv-tinta));border-radius:var(--mk-radio-boton,10px);background:var(--mk-superficie,#fff);color:var(--pv-tinta);font:inherit;font-weight:700;text-decoration:none;cursor:pointer;box-shadow:var(--mk-sombra-suave,3px 3px 0 var(--pv-tinta));transition:transform .12s}
.pv-boton:hover{transform:translate(-1px,-1px)}
.pv-boton:active{transform:translate(2px,2px)}
.pv-boton:focus-visible{outline:3px solid #7c3aed;outline-offset:2px}
.pv-amarillo{background:var(--pv-sol);border-radius:999px}
.pv-chico{min-height:44px;padding:0 14px;font-size:.88rem}
.pv-peligro{border-color:#dc2626;color:#dc2626;box-shadow:none;background:#fff}
.pv-fila-botones{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}

.pv-pastilla{display:inline-flex;align-items:center;min-height:26px;padding:0 10px;border:2px solid var(--pv-tinta);border-radius:999px;font-size:.78rem;font-weight:800;white-space:nowrap;background:#e9defc;color:#4c1d95}
.pv-pastilla[data-tono=durazno]{background:#ffe1c7;color:#9a3412}
.pv-pastilla[data-tono=menta]{background:#c9f2df;color:#065f46}
.pv-pastilla[data-tono=gris]{background:#e5e7eb;color:#374151}

.pv-datos{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:18px;margin-bottom:22px}
.pv-dato{display:flex;flex-direction:column;gap:4px;align-items:flex-start}
.pv-dato-n{font-family:var(--pv-carta);font-size:2rem;font-weight:900;line-height:1}
.pv-dato-t{color:#5E5A68;font-weight:600}
.pv-dos{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:20px}
.pv-dos-ancha{margin-bottom:24px}
.pv-barras{display:flex;align-items:flex-end;gap:10px;height:150px}
.pv-barra-dia{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
.pv-barra-dia b{display:block;width:100%;height:100%;border:2px solid var(--pv-tinta);border-radius:6px 6px 0 0;background:var(--pv-grupo,#7c3aed);transform:scaleY(var(--alto));transform-origin:bottom}
.pv-barra-dia:nth-child(6) b{background:var(--pv-sol)}
.pv-barra-dia small{font-weight:700;color:#5E5A68}
.pv-envivo{font-size:.75rem;color:#dc2626;font-weight:800}
.pv-feed{display:grid;gap:8px}
.pv-feed-fila{padding:10px 12px;border:1.5px solid color-mix(in srgb,var(--pv-tinta) 28%,transparent);border-radius:10px;background:#FAF7F2;font-size:.92rem}

.pv-grilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr));gap:22px;margin-top:4px}
.pv-grilla-una{grid-template-columns:1fr;max-width:640px}
.pv-fila{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.pv-fila + .pv-fila{margin-top:12px}
.pv-fila-ancha{margin-bottom:22px}
.pv-precio{font-family:var(--pv-carta);font-size:1.2rem}
.pv-barra-filtros{position:relative;display:flex;align-items:center;gap:16px;margin-bottom:22px}
.pv-barra-filtros .pv-pestanas{flex:0 1 auto;min-width:0}
.pv-sello-nuevas{display:inline-block;transform:rotate(-8deg)}
.pv-colab-cabeza{display:flex;align-items:center;gap:12px}
.pv-colab-cabeza>div{flex:1;min-width:0}
.pv-colab-cabeza strong{display:block}
.pv-icono-chico{flex:none;display:grid;place-items:center;width:44px;height:44px;border:2px solid var(--pv-tinta);border-radius:10px;background:var(--pv-sol);font-size:1.2rem}
.pv-icono-grande{width:64px;height:64px;border-width:2.5px;border-radius:14px;font-size:1.9rem;box-shadow:4px 4px 0 var(--pv-tinta);transform:rotate(-6deg)}
.pv-colab-marca{font-size:1.05rem}
.pv-colab-texto{margin:14px 0;line-height:1.5}
.pv-colab-datos{display:flex;gap:22px;flex-wrap:wrap;margin-bottom:14px}
.pv-colab-datos span{display:flex;flex-direction:column}
.pv-colab-datos small{color:#5E5A68;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.pv-colab-datos a{color:#6d28d9;font-weight:600}
.pv-colab-acciones{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.pv-select select{min-height:44px;padding:0 10px;border:2px solid var(--pv-tinta);border-radius:10px;background:#fff;font:inherit;font-weight:600;color:var(--pv-tinta)}
.pv-colab[data-estado=descartada] .pv-colab-texto{opacity:.6}

.pv-vista{--pv-vista-fondo:#10223f;--pv-vista-tinta:#ffc83d;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:240px;overflow:hidden;background:var(--pv-vista-fondo);color:#fff;text-align:center}
.pv-vista-rayos{position:absolute;inset:-60%;background:repeating-conic-gradient(color-mix(in srgb,var(--pv-vista-tinta) 30%,transparent) 0 3deg,transparent 3deg 14deg)}
.pv-vista>*:not(.pv-vista-rayos){position:relative}
.pv-vista-logo{display:grid;place-items:center;width:64px;height:64px;overflow:hidden;border:3px solid var(--pv-vista-tinta);border-radius:50%;background:#fff;color:var(--pv-tinta);font-weight:900}
.pv-vista-logo img{width:100%;height:100%;object-fit:cover}
.pv-vista-nombre{font-family:var(--pv-carta);font-size:1.8rem;color:var(--pv-vista-tinta)}
.pv-vista-boton{padding:8px 18px;border:2px solid #fff;border-radius:999px;background:var(--pv-vista-tinta);color:var(--pv-tinta);font-weight:800}
.pv-vista .pv-vista-sello{position:absolute;top:8px;right:8px;transform:rotate(10deg)}
.pv-link{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pv-link code{padding:10px 12px;border:1.5px dashed var(--pv-tinta);border-radius:10px;background:#FAF7F2;font-size:.92rem}
.pv-carpeta{max-width:760px}
.pv-carpeta-hoja{border-top-left-radius:0}
.pv-carpeta .pv-sombra{margin-top:10px}
.pv-estilos{display:flex;flex-wrap:wrap;gap:12px}
.pv-estilo{display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 16px 0 8px;border:2px solid var(--pv-tinta);border-radius:12px;background:#fff;font:inherit;font-weight:700;cursor:pointer;transition:transform .15s}
.pv-estilo span{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--f) 55%,var(--t) 55%);border:2px solid var(--pv-tinta)}
.pv-estilo[aria-checked=true]{background:var(--pv-sol);transform:translate(-2px,-2px);box-shadow:4px 4px 0 var(--pv-tinta)}
.pv-form{display:grid;gap:14px;justify-items:start}
.pv-form .mk-campo{width:100%}
.pv-entrada{box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:1.5px solid #E7E1D8;border-radius:12px;background:color-mix(in srgb,#FAF7F2 65%,#fff);font:inherit;color:inherit}
.pv-entrada:focus{outline:none;border-color:var(--pv-tinta);box-shadow:3px 3px 0 #7c3aed}
.pv-fotos{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}
.pv-oferta{max-width:520px}
.pv-lista-check{margin:0;padding:0;list-style:none;display:grid;gap:8px}
.pv-lista-check li::before{content:"✓";display:inline-grid;place-items:center;width:22px;height:22px;margin-right:8px;border:2px solid var(--pv-tinta);border-radius:6px;background:var(--pv-sol);font-weight:900;font-size:.75rem}
.pv-pedido .pv-boton{margin-top:12px}
.pv-pasos{display:flex;gap:6px;margin-top:12px}
.pv-pasos i{flex:1;height:8px;border:2px solid var(--pv-tinta);border-radius:99px;background:#fff}
.pv-pasos i[data-hecho]{background:var(--pv-grupo)}
.pv-horas{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:18px;margin-top:18px}
.pv-hora{display:flex;align-items:center;gap:12px;flex-wrap:wrap;min-height:76px}
.pv-hora b{font-family:var(--pv-carta);font-size:1.2rem}
.pv-hora[data-reservada]{background:#f0fdf8}
.pv-caja-total{display:flex;flex-direction:column;align-items:flex-start;max-width:640px;margin-bottom:22px}
.pv-caja-total small{color:#5E5A68;font-weight:700}
.pv-caja-n{font-family:var(--pv-carta);font-size:clamp(2.2rem,8vw,3.4rem);line-height:1.1}
.pv-uso{display:block;height:16px;margin-top:12px;overflow:hidden;border:2px solid var(--pv-tinta);border-radius:99px;background:#fff}
.pv-uso b{display:block;height:100%;background:var(--pv-grupo);transform:scaleX(var(--uso));transform-origin:left}
.pv-uso[data-alto] b{background:#f97316}
.pv-uso + .pv-nota{margin:10px 0 0}

.pv-soporte-caja{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:60;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.pv-soporte{min-height:48px;padding:0 20px;border:2.5px solid var(--pv-tinta);border-radius:999px;background:var(--pv-tinta);color:#fff;font:inherit;font-weight:800;cursor:pointer;box-shadow:4px 4px 0 var(--pv-sol);transition:transform .12s}
.pv-soporte:active{transform:translate(2px,2px)}
.pv-soporte-globo{margin-right:12px}

@media (prefers-reduced-motion: no-preference){
  .pv-sombra{animation:pv-estampa .5s cubic-bezier(.3,1.5,.5,1) both;animation-delay:calc(var(--i,0) * 70ms)}
  .pv-icono{animation:pv-salta .6s cubic-bezier(.3,1.7,.5,1) both}
  .pv-rayos{animation:pv-gira 14s linear infinite}
  .pv-vista-rayos{animation:pv-gira 40s linear infinite}
  .pv-antetitulo,.pv-bajada{animation:pv-sube .45s ease-out both .12s}
  .pv-contenido{animation:pv-sube .35s ease-out both}
  .pv-pastilla{animation:pv-sello .42s cubic-bezier(.3,1.8,.5,1) both}
  .pv-barra-dia b{animation:pv-crece .7s cubic-bezier(.3,1.4,.5,1) both;animation-delay:calc(var(--i) * 80ms + .2s)}
  .pv-uso b{animation:pv-llena 1s cubic-bezier(.3,1.2,.5,1) both;animation-delay:calc(var(--i) * 120ms + .2s)}
  .pv-envivo{animation:pv-late 1.2s ease-in-out infinite}
  .pv-soporte{animation:pv-flota 3.2s ease-in-out infinite}
  .pv-icono-chico{transition:transform .2s cubic-bezier(.3,1.7,.5,1)}
  .pv-hoja:hover .pv-icono-chico{transform:rotate(-8deg) scale(1.08)}
}
@keyframes pv-estampa{from{opacity:0;transform:scale(.86) rotate(-2.5deg)}to{opacity:1;transform:none}}
@keyframes pv-salta{0%{opacity:0;transform:scale(.3) rotate(-25deg)}100%{opacity:1;transform:none}}
@keyframes pv-gira{to{transform:rotate(360deg)}}
@keyframes pv-sube{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes pv-sello{0%{opacity:0;transform:scale(1.8) rotate(-12deg)}100%{opacity:1;transform:none}}
@keyframes pv-crece{from{transform:scaleY(0)}to{transform:scaleY(var(--alto))}}
@keyframes pv-llena{from{transform:scaleX(0)}to{transform:scaleX(var(--uso))}}
@keyframes pv-late{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes pv-flota{0%,100%{transform:none}50%{transform:translateY(-4px)}}

@media (max-width: 819px){
  .pv-cuerpo{grid-template-columns:1fr}
  .pv-negocio{display:none}
  .pv-arriba{gap:8px}
  .pv-arriba .pv-amarillo{padding:0 12px}
  .pv-cabeza{gap:14px}
  .pv-icono-caja{width:60px;height:60px}
  .pv-icono{width:52px;height:52px;font-size:1.5rem}
  .pv-hoja{padding:16px}
  .pv-marca{font-size:1rem}
  .pv-forma span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  .pv-sello-nuevas{display:none}
}
`;
