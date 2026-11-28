// La guía de motion-kit (#temas): todas las piezas del panel con cada tema del catálogo (14 del panel y 12 de la
// página). Es la guía que tenía el front de La Mente (/guia?tema=…, con su portada, la muestra de piezas y momentos y
// la subida de muestra), ahora aquí: fase 3 de «Un solo motor». Cada sección dice para qué sirve. Su prueba es
// scripts/verificar-temas.mjs. (#guia, la guía del front con su propuesta, queda como historial.)
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Accordion, BarraLateral, BotonPanel, BotonQueGuarda, BottomSheet, CabezaSeccion, Campo, Confirmar, Contador, Copiar, CountUp, GlowBorder,
  GrillaTarjetas, Interruptor, ListaViva, Presencia, Pressable, Ripple, Seccion, Selector, ShinyButton, SubirImagen, SplitText, Tabs, Tarjeta,
  TarjetaCuerpo, TarjetaFila, TarjetaMedia, TextoCinetico, Typewriter, useToast, WordRotate, type GrupoBarra,
} from "../src/entradas/interfaz";
import { TarjetaVolteable, type TarjetaVariante } from "../src";
import { Globo, Guia, Oferta, Vacio, type PasoGuia } from "../src/entradas/comic";
import { Confeti, CuentaRegresiva, PrecioQueRueda, SellosEstampa } from "../src/entradas/momentos";
import { PALETAS, TEMAS, Tema, buscarTema } from "../src/entradas/temas";
import type { Para } from "../src/temas/tipos";
import type { TransicionId } from "../src/piezas/transiciones";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Lo que es cada tema, en una línea (de la guía del front, temasGuia.ts). */
const DESCRIPCION: Record<string, string> = {
  lamente: "El de siempre: amarillo sol, trazo grueso de tinta, sombra de manga y la letra de cartel.",
  noche: "Oscuro y con luz de neón: nada de sombras duras, lo importante se enciende.",
  cuaderno: "Hoja cuadriculada, tinta de lápiz pasta, destacador verde y las correcciones en rojo.",
  pastel: "Rosado suave, todo redondo, sombras de color y movimientos con rebote.",
  taller: "Hormigón, trazo grueso, esquinas rectas, cinta de peligro y naranjo de seguridad.",
  cultivo: "Papel salvia, verde hoja y brote; las esquinas tienen forma de hoja y todo sube como si creciera.",
  rock: "Afiche de tocata fotocopiado: trama de puntos, rojo, mostaza, letra gastada y todo un poco chueco.",
  calma: "Neblina y aire: sin bordes marcados, un aura que se mueve muy lento y los íconos que respiran.",
  barberia: "Azul marino, rojo de poste y bronce; bordes dobles de letrero antiguo y el poste girando en lo elegido.",
  salon: "Blanco de revista, esmeralda y champaña, líneas finas y una letra de moda.",
  patitas: "Turquesa de baño, burbujas, todo redondo y juguetón; los íconos mueven la cola.",
  clinica: "Limpio y en calma: azul de confianza, menta, una letra muy fácil de leer y un pulso que late bajo cada título.",
  cancha: "Azul eléctrico y rojo de camiseta, letra angosta en cursiva y todo inclinado hacia adelante, como en carrera.",
  picada: "Mantel a cuadros, verde botella, dorado de empanada y los títulos escritos con tiza en la pizarra del menú.",
};

const GRUPOS: GrupoBarra[] = [
  { nombre: null, color: "#10223f", secciones: [{ id: "resumen", nombre: "Resumen", icono: "🏠" }] },
  { nombre: "Tu página", color: "#8b5cf6", secciones: [{ id: "pagina", nombre: "Página", icono: "🌐" }, { id: "precios", nombre: "Precios", icono: "🏷️" }, { id: "exclusiva", nombre: "Página exclusiva", icono: "💎", sinModulo: true }] },
  { nombre: "Clientes", color: "#14b8a6", secciones: [{ id: "agenda", nombre: "Agenda", icono: "📅" }, { id: "pedidos", nombre: "Pedidos", icono: "🛍️" }] },
];

const TONOS = [
  { tono: "verde", texto: "Publicada" },
  { tono: "gris", texto: "Borrador" },
  { tono: "naranjo", texto: "Por vencer" },
  { tono: "morado", texto: "Nueva" },
  { tono: "rojo", texto: "Pausada" },
] as const;

const VARIANTES: { variante: TarjetaVariante; nombre: string; texto: string }[] = [
  { variante: "plana", nombre: "Plana", texto: "Solo el fondo, sin borde." },
  { variante: "elevada", nombre: "Elevada", texto: "Flota con una sombra suave." },
  { variante: "borde", nombre: "Con borde", texto: "Una línea fina alrededor." },
  { variante: "vidrio", nombre: "Vidrio", texto: "Deja ver lo que hay detrás." },
  { variante: "acento", nombre: "Acento", texto: "Con el color del tema." },
];

const PREGUNTAS = [
  { title: "¿Cuánto demora en verse un cambio?", content: "Al tiro: guardas y tu página se actualiza en menos de un minuto." },
  { title: "¿Puedo pausar mi página?", content: "Sí. Mientras está en pausa, tus clientes ven un aviso y no se cobra el mes." },
];

const VISITAS: Record<string, { visitas: number; pedidos: number }> = {
  hoy: { visitas: 184, pedidos: 12 },
  semana: { visitas: 1260, pedidos: 87 },
  mes: { visitas: 5430, pedidos: 341 },
};

const MENU = ["Latte grande", "Empanada de pino", "Torta de mil hojas", "Café con leche", "Sándwich de queso"];

/** Una subida de muestra: elige una foto y «sube» en dos segundos, con su avance (de la guía del front). */
function useSubidaDeMuestra() {
  const [imagen, setImagen] = useState<string>();
  const [subiendo, setSubiendo] = useState<number>();
  const reloj = useRef<ReturnType<typeof setInterval>>(undefined);
  const url = useRef<string>(undefined);
  useEffect(
    () => () => {
      clearInterval(reloj.current);
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );
  const alElegir = (archivo: File) => {
    clearInterval(reloj.current);
    const nueva = URL.createObjectURL(archivo);
    let avance = 0;
    setSubiendo(0);
    reloj.current = setInterval(() => {
      avance += 0.08;
      if (avance < 1) return setSubiendo(avance);
      clearInterval(reloj.current);
      if (url.current) URL.revokeObjectURL(url.current);
      url.current = nueva;
      setSubiendo(undefined);
      setImagen(nueva);
    }, 110);
  };
  return { imagen, subiendo, alElegir, alQuitar: () => setImagen(undefined) };
}

const enUnaSemana = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

/** Una muestra dentro de una sección: su nombre y, a la derecha, sus botones. */
function Muestra({ titulo, acciones, children }: { titulo: string; acciones?: ReactNode; children: ReactNode }) {
  return (
    <div className="tm-muestra">
      <div className="tm-muestra-cabeza">
        <h3>{titulo}</h3>
        {acciones && <div className="tm-fila">{acciones}</div>}
      </div>
      {children}
    </div>
  );
}

export function TemasVitrina() {
  const [lado, setLado] = useState<Para>("panel");
  const [elegido, setElegido] = useState<Record<Para, string>>({ panel: "lamente", pagina: "clasico" });
  const [paleta, setPaleta] = useState("");
  const id = elegido[lado];
  const tema = buscarTema(id, lado);
  const lista = TEMAS.filter((t) => t.para.includes(lado));

  return (
    <div className="tm-pagina">
      <style>{CSS}</style>
      <header className="tm-arriba">
        <a href="#">← Demo</a>
        <h1>La guía</h1>
        <p>
          Todas las piezas del panel con cada tema del catálogo: {TEMAS.filter((t) => t.para.includes("panel")).length} del panel y{" "}
          {TEMAS.filter((t) => t.para.includes("pagina")).length} de la página, con {PALETAS.length} paletas. Si cambia el tema, cambian todas.
        </p>
        <div className="tm-lados" role="group" aria-label="Lado">
          {(["panel", "pagina"] as const).map((l) => (
            <button key={l} type="button" data-lado={l} aria-pressed={lado === l} onClick={() => setLado(l)}>
              {l === "panel" ? "Panel" : "Página"}
            </button>
          ))}
          {lado === "pagina" && (
            <label className="tm-paleta">
              Paleta
              <select value={paleta} onChange={(e) => setPaleta(e.target.value)}>
                <option value="">La del tema</option>
                {PALETAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="tm-selector" data-prueba="selector-temas" role="radiogroup" aria-label="Tema">
          {lista.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={t.id === id} data-tema-id={t.id} onClick={() => setElegido((e) => ({ ...e, [lado]: t.id }))}>
              {t.nombre}
            </button>
          ))}
        </div>
      </header>

      <Tema key={`${lado}-${id}`} tema={id} para={lado} paleta={lado === "pagina" ? paleta || undefined : undefined} className="tm-vista">
        <div className="tm-cabeza" data-mk-adorno="cabeza" data-guia-paso="portada">
          <TextoCinetico
            key={id}
            como="h2"
            texto={id === "lamente" ? "Guía de *La Mente*" : `Guía *${tema.nombre}*`}
            efecto={tema.movimiento?.titulo ?? "revelar"}
            cuando="siempre"
            className="tm-titulo"
            data-mk-adorno="titulo"
          />
          <p className="tm-rubros">
            Hecho para{" "}
            <WordRotate key={id} words={tema.rubros?.length ? tema.rubros : ["cafés", "tiendas de barrio", "cualquier negocio"]} interval={1900} className="tm-rubro" />
          </p>
          <p className="tm-nota">{DESCRIPCION[id] ?? "Un tema de la página pública."} Todas las piezas de abajo son las del panel.</p>
        </div>
        <Guia_ lado={lado} temaId={id} />
      </Tema>
    </div>
  );
}

/** El cuerpo de la guía: una sección por pieza. Se vuelve a montar con cada tema (como el panel al cambiar de tema). */
function Guia_({ lado, temaId }: { lado: Para; temaId: string }) {
  const toast = useToast();
  const tema = buscarTema(temaId, lado);
  const mov = tema.movimiento;
  const [actual, setActual] = useState("precios");
  const [preguntando, setPreguntando] = useState(false);
  const [activo, setActivo] = useState(true);
  const [texto, setTexto] = useState("");
  const [recibe, setRecibe] = useState(true);
  const logo = useSubidaDeMuestra();
  const producto = useSubidaDeMuestra();
  const portada = useSubidaDeMuestra();
  const [pedidos, setPedidos] = useState(() => MENU.slice(0, 3).map((nombre, i) => ({ id: i + 1, nombre })));
  const siguiente = useRef(4);
  const [alReves, setAlReves] = useState(false);
  const [periodo, setPeriodo] = useState("hoy");
  const [hoja, setHoja] = useState(false);
  const [visible, setVisible] = useState(true);
  const [recorrido, setRecorrido] = useState(false);
  const [precio, setPrecio] = useState(4900);
  const [sellos, setSellos] = useState(5);
  const [confeti, setConfeti] = useState(0);
  const [fecha] = useState(enUnaSemana);
  const ordenados = [...pedidos].sort((a, b) => (alReves ? b.id - a.id : a.id - b.id));
  const cifras = VISITAS[periodo];
  const icono = (e: string) => <span aria-hidden="true">{e}</span>;
  const pasos: PasoGuia[] = [
    { objetivo: '[data-guia-paso="portada"]', texto: "Arriba, el nombre del tema y para qué negocios es." },
    { objetivo: '[data-guia-paso="barra"]', texto: "La barra con las secciones, por grupo." },
    { objetivo: '[data-guia-paso="campos"]', texto: "Los campos: así escribe y sube fotos el dueño." },
  ];

  return (
    <div className="tm-guia">
      <Seccion titulo="Cabecera de sección" bajada="Para abrir cada sección del panel: el ícono en su cuadradito, el título en letra de cartel, qué hace y la acción principal.">
        <CabezaSeccion icono={icono("🏷️")} titulo="Precios" bajada="Arma tus listas y descarga el QR para imprimirlo en tu local." accion={<BotonPanel>Nueva lista</BotonPanel>} />
      </Seccion>

      <Seccion titulo="Barra lateral" bajada="Para moverse por el panel: las secciones por grupo, con su color; contraída, solo los íconos.">
        <div className="tm-dos tm-barras" data-guia-paso="barra">
          <BarraLateral grupos={GRUPOS} actual={actual} alElegir={setActual} etiqueta="Secciones (abierta)" />
          <BarraLateral grupos={GRUPOS} actual={actual} alElegir={setActual} contraida etiqueta="Secciones (contraída)" />
        </div>
      </Seccion>

      <Seccion titulo="Botones" bajada="Para actuar: el grande para la acción principal de una sección, el chico para una tarjeta; los que guardan, copian o brillan.">
        <div className="tm-fila">
          <BotonPanel>Publicar</BotonPanel>
          <BotonPanel tamano="chico">Editar</BotonPanel>
          <BotonPanel tamano="chico" tono="principal">
            Activar
          </BotonPanel>
          <BotonPanel tamano="chico" tono="peligro">
            Borrar
          </BotonPanel>
          <BotonPanel tamano="chico" disabled>
            Sin permiso
          </BotonPanel>
        </div>
        <div className="tm-fila">
          <BotonQueGuarda className="tm-boton" data-mk-adorno="boton" alGuardar={() => espera(600)}>
            Guardar
          </BotonQueGuarda>
          <Copiar texto="https://lamente.cl/mi-negocio" className="tm-boton" data-mk-adorno="boton">
            Copiar link
          </Copiar>
          <Pressable className="tm-boton" data-mk-adorno="boton">
            Se hunde y rebota
          </Pressable>
          <Ripple color="color-mix(in srgb, var(--mk-acento) 35%, transparent)" style={{ borderRadius: "var(--mk-radio-boton, 10px)" }}>
            <button type="button" className="tm-boton" data-mk-adorno="boton">
              Onda al tocar
            </button>
          </Ripple>
          <ShinyButton className="tm-boton" data-mk-adorno="boton" interval={2.5}>
            Brilla
          </ShinyButton>
        </div>
        <GlowBorder colors={mov?.luz ?? ["#ffc83d", "#7c3aed", "#ffc83d"]} radius={14} speed={5} background="var(--mk-superficie, #fff)">
          <div className="tm-glow">
            <strong>Plan destacado</strong>
            <span className="tm-nota">La luz del borde toma los colores del tema.</span>
          </div>
        </GlowBorder>
      </Seccion>

      <Seccion titulo="Tarjetas" bajada="Para listar lo que el negocio tiene (listas, productos, eventos), cada una con su estado y sus acciones.">
        <GrillaTarjetas>
          {TONOS.map((t) => (
            <TarjetaFila
              key={t.tono}
              icono={icono("📋")}
              titulo={`Carta ${t.texto.toLowerCase()}`}
              estado={t}
              detalle={<span>12 productos · actualizada hoy</span>}
              acciones={
                <>
                  <BotonPanel tamano="chico">Editar</BotonPanel>
                  <BotonPanel tamano="chico" tono="peligro" onClick={() => setPreguntando(true)}>
                    Borrar
                  </BotonPanel>
                </>
              }
            />
          ))}
        </GrillaTarjetas>
        <Muestra titulo={`Tarjetas de contenido (este tema: ${VARIANTES.find((v) => v.variante === mov?.tarjeta.variante)?.nombre ?? "con borde"})`}>
          <div className="tm-tarjetas">
            {VARIANTES.map((v) => (
              <Tarjeta key={v.variante} variante={v.variante} efecto={mov?.tarjeta.efecto ?? "elevar"} como="div" revelar={<span>Lo que aparece al pasar.</span>}>
                <TarjetaMedia>
                  <div className="tm-media" style={{ background: `linear-gradient(135deg, ${(mov?.luz ?? ["#ffc83d", "#7c3aed"])[0]}, ${(mov?.luz ?? ["#ffc83d", "#7c3aed"])[1]})` }} />
                </TarjetaMedia>
                <TarjetaCuerpo>
                  <strong>{v.nombre}</strong>
                  <p className="tm-nota">{v.texto}</p>
                </TarjetaCuerpo>
              </Tarjeta>
            ))}
            <TarjetaVolteable frente={<div className="tm-volteable">Volteable: tócala</div>} dorso={<div className="tm-volteable tm-dorso">El dorso, con más detalle</div>} style={{ minHeight: 170 }} />
          </div>
        </Muestra>
      </Seccion>

      <Seccion titulo="Sin contenido" bajada="Para cuando una sección todavía no tiene nada: qué va ahí y cómo empezar.">
        <Vacio icono={icono("🏷️")} titulo="Todavía no tienes listas de precios." texto="Tu carta, tus servicios o tus productos con su precio: se ven en tu página y con un QR en tu local." accion={<BotonPanel>Nueva lista</BotonPanel>} />
      </Seccion>

      <Seccion titulo="Campos" bajada="Para que el dueño escriba, elija y suba fotos: con ayuda, con error, deshabilitado y la subida con su avance.">
        <div className="tm-dos" data-guia-paso="campos">
          <div className="tm-columna">
            <Campo etiqueta="Qué haces, en una frase" ayuda="Sale bajo tu nombre.">
              {(a11y) => <input {...a11y} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Café de especialidad en Ñuñoa" />}
            </Campo>
            <Campo etiqueta="Correo" error="Escribe un correo, por ejemplo hola@minegocio.cl.">
              {(a11y) => <input {...a11y} type="email" defaultValue="hola@" />}
            </Campo>
            <Campo etiqueta="Tu dirección en La Mente" ayuda="Se cambia desde Ajustes.">
              {(a11y) => <input {...a11y} defaultValue="lamente.cl/cami-viaja" disabled />}
            </Campo>
            <Selector etiqueta="Abres los domingos" ayuda="Sale en tu página." defaultValue="no">
              <option value="no">No</option>
              <option value="si">Sí, de 10:00 a 14:00</option>
            </Selector>
            <Campo etiqueta="Avisos">
              {(a11y) => (
                <label className="tm-casilla">
                  <input {...a11y} type="checkbox" checked={recibe} onChange={(e) => setRecibe(e.target.checked)} /> Recibir un correo con cada pedido
                </label>
              )}
            </Campo>
            <Interruptor activo={activo} alCambiar={setActivo} etiqueta="Visible en la página" />
          </div>
          <div className="tm-columna">
            <div className="tm-fila tm-subidas">
              <SubirImagen etiqueta="Logo" forma="redonda" imagen={logo.imagen} subiendo={logo.subiendo} alElegir={logo.alElegir} alQuitar={logo.alQuitar} />
              <SubirImagen etiqueta="Producto" forma="cuadrada" imagen={producto.imagen} subiendo={producto.subiendo} alElegir={producto.alElegir} alQuitar={producto.alQuitar} />
            </div>
            <SubirImagen etiqueta="Foto de portada" ayuda="Horizontal, como una foto del celular de lado." forma="apaisada" imagen={portada.imagen} subiendo={portada.subiendo} alElegir={portada.alElegir} alQuitar={portada.alQuitar} />
          </div>
        </div>
      </Seccion>

      <Seccion
        titulo="Lo que llega"
        bajada="Para lo que cambia solo (pedidos, reservas, mensajes): lo nuevo entra con un destello y lo que se va se desvanece."
        accion={<Contador valor={pedidos.length} etiqueta={`${pedidos.length} por atender`} />}
      >
        <div className="tm-fila">
          <BotonPanel tamano="chico" tono="principal" onClick={() => setPedidos((x) => [...x, { id: siguiente.current, nombre: MENU[(siguiente.current++ - 1) % MENU.length] }])}>
            Llega un pedido
          </BotonPanel>
          <BotonPanel tamano="chico" onClick={() => setPedidos((x) => x.slice(1))} disabled={!pedidos.length}>
            Despachar el primero
          </BotonPanel>
          <BotonPanel tamano="chico" onClick={() => setAlReves((x) => !x)}>
            {alReves ? "Los más antiguos primero" : "Los más nuevos primero"}
          </BotonPanel>
        </div>
        <ListaViva className="tm-pedidos">
          {ordenados.map((p) => (
            <div key={p.id} className="tm-pedido" data-mk-adorno="hoja">
              <strong>#{p.id}</strong> {p.nombre}
            </div>
          ))}
        </ListaViva>
      </Seccion>

      <Seccion titulo="Confirmar y avisos" bajada="Para preguntar antes de borrar, avisar lo que pasó (y deshacerlo) y mostrar más sin salir de la pantalla.">
        <div className="tm-fila">
          <BotonPanel tamano="chico" tono="peligro" onClick={() => setPreguntando(true)}>
            Borrar «Latte»
          </BotonPanel>
          <BotonPanel tamano="chico" tono="principal" onClick={() => toast("Guardado", { tipo: "bien" })}>
            Guardado
          </BotonPanel>
          <BotonPanel tamano="chico" onClick={() => toast("No se pudo guardar: revisa tu conexión", { tipo: "mal" })}>
            Un error
          </BotonPanel>
          <BotonPanel tamano="chico" onClick={() => toast("Borraste «Latte»", { accion: { texto: "Deshacer", alHacer: () => toast("Volvió «Latte»", { tipo: "bien" }) } })}>
            Con deshacer
          </BotonPanel>
          <BotonPanel tamano="chico" onClick={() => setHoja(true)}>
            La hoja de abajo
          </BotonPanel>
          <BotonPanel tamano="chico" onClick={() => setVisible((x) => !x)}>
            {visible ? "Ocultar el aviso" : "Mostrar el aviso"}
          </BotonPanel>
        </div>
        <div className="tm-presencia">
          <Presencia visible={visible} tipo={(mov?.presencia ?? "subir") as TransicionId} duracion={420}>
            <div className="tm-muestra">
              <strong>Tu página está publicada</strong>
              <span className="tm-nota">Aparece y se va con la transición «{mov?.presencia ?? "subir"}».</span>
            </div>
          </Presencia>
        </div>
        <p className="tm-nota">
          <Typewriter text={["Escribiendo tu descripción…", "Revisando los precios…", "Listo para publicar."]} speed={45} pause={1300} cursor />
        </p>
        <BottomSheet open={hoja} onClose={() => setHoja(false)} label="Hoja de ejemplo">
          <div className="tm-hoja-abajo">
            <SplitText as="h3" text="Así sube una hoja en el teléfono" by="word" blur className="tm-hoja-titulo" />
            <p className="tm-nota">Se cierra arrastrándola hacia abajo, tocando afuera o con Esc.</p>
            <BotonPanel tamano="chico" tono="principal" onClick={() => setHoja(false)}>
              Cerrar
            </BotonPanel>
          </div>
        </BottomSheet>
      </Seccion>

      <Seccion titulo="Pestañas, cifras y preguntas" bajada="Para resumir: elegir un período, ver cómo cuentan las cifras y desplegar las dudas de siempre.">
        <div className="tm-dos">
          <Muestra titulo="Visitas">
            <Tabs items={[{ id: "hoy", label: "Hoy" }, { id: "semana", label: "Semana" }, { id: "mes", label: "Mes" }]} value={periodo} onChange={setPeriodo} accent="var(--mk-acento, #7c3aed)" label="Período" style={{ width: "fit-content" }} />
            <div className="tm-fila tm-cifras">
              <div>
                <CountUp key={`v-${periodo}`} to={cifras.visitas} duration={900} className="tm-cifra" />
                <span className="tm-nota">visitas a tu página</span>
              </div>
              <div>
                <CountUp key={`p-${periodo}`} to={cifras.pedidos} duration={900} className="tm-cifra" />
                <span className="tm-nota">pedidos</span>
              </div>
            </div>
          </Muestra>
          <Muestra titulo="Preguntas frecuentes">
            <Accordion items={PREGUNTAS} defaultOpen={[0]} />
          </Muestra>
        </div>
      </Seccion>

      <Seccion titulo="El cómic" bajada="Para ofrecer algo nuevo, decir algo en un globo y mostrar el panel paso a paso la primera vez.">
        <div className="tm-dos">
          <Oferta destacado="¡30 días gratis!" accion={<BotonPanel tamano="chico" tono="principal">Probar gratis</BotonPanel>}>
            <div className="tm-muestra">
              <strong>Novedades</strong>
              <span className="tm-nota">Publica lo nuevo y le llega a tu gente en tu página y por correo.</span>
            </div>
          </Oferta>
          <div className="tm-columna">
            <Globo cola="abajo">¡Así se ve un globo!</Globo>
            <BotonPanel tamano="chico" onClick={() => setRecorrido(true)}>
              Recorrer la guía
            </BotonPanel>
          </div>
        </div>
        <Guia abierta={recorrido} pasos={pasos} alTerminar={() => setRecorrido(false)} alSaltar={() => setRecorrido(false)} />
      </Seccion>

      <Seccion titulo="Momentos de la página pública" bajada="Lo que ve el cliente en la página del negocio: el precio que rueda, la cuenta regresiva, los sellos y el confeti.">
        <div className="tm-dos">
          <Muestra titulo="Precio que rueda" acciones={<BotonPanel tamano="chico" onClick={() => setPrecio((p) => (p === 4900 ? 3990 : 4900))}>Cambiar precio</BotonPanel>}>
            <div className="tm-precio">
              <PrecioQueRueda valor={precio} nivel="completo" />
            </div>
          </Muestra>
          <Muestra titulo="Cuenta regresiva">
            <CuentaRegresiva titulo="Abrimos el local nuevo" fecha={fecha} hora="19:00" nivel="completo" />
          </Muestra>
          <Muestra
            titulo="Tarjeta de sellos"
            acciones={
              <>
                <BotonPanel tamano="chico" tono="principal" onClick={() => setSellos((s) => Math.min(8, s + 1))} disabled={sellos >= 8}>
                  Sumar un sello
                </BotonPanel>
                <BotonPanel tamano="chico" onClick={() => setSellos(0)}>
                  De nuevo
                </BotonPanel>
              </>
            }
          >
            <SellosEstampa total={8} llenos={sellos} premio="Un café gratis" semilla="guia" nivel="completo" />
          </Muestra>
          <Muestra titulo="Confeti" acciones={<BotonPanel tamano="chico" tono="principal" onClick={() => setConfeti((c) => c + 1)}>Celebrar</BotonPanel>}>
            <div className="tm-confeti">
              <span className="tm-nota">Para cuando el dueño publica su página.</span>
              {confeti > 0 && <Confeti key={confeti} semilla={confeti} n={90} />}
            </div>
          </Muestra>
        </div>
      </Seccion>

      {lado === "panel" && (
        <Seccion titulo="La vista previa de la página" bajada="Dentro del panel, la página no hereda su tema: tiene el suyo.">
          <Tema tema="clasico" para="pagina" className="tm-vista-pagina" data-prueba="vista-pagina">
            <p data-mk-adorno="titulo">Mi negocio</p>
            <Copiar texto="https://lamente.cl/mi-negocio" className="tm-boton">
              Copiar
            </Copiar>
          </Tema>
        </Seccion>
      )}

      <Confirmar
        abierto={preguntando}
        pregunta="¿Borrar «Latte»?"
        detalle="Deja de verse en tu página."
        textoSi="Sí, borrar"
        peligro
        alConfirmar={() => {
          setPreguntando(false);
          toast("Borraste «Latte»", { tipo: "bien" });
        }}
        alCancelar={() => setPreguntando(false)}
      />
    </div>
  );
}

// ——— Estilos (solo de la demo): leen las variables del tema ———
const CSS = `
.tm-pagina{min-height:100vh;background:#f4f2ee;color:#1c1a22;font-family:Inter,system-ui,sans-serif;overflow-x:clip}
.tm-arriba{max-width:1180px;margin:0 auto;padding:20px 16px 12px}
.tm-arriba h1{margin:.3em 0 .2em;font-size:clamp(1.8rem,5vw,2.6rem)}
.tm-arriba p{margin:0 0 12px;color:#5e5a68;max-width:70ch}
.tm-lados{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
.tm-lados button,.tm-selector button{min-height:44px;padding:0 16px;border:2px solid #1c1a22;border-radius:999px;background:#fff;font:inherit;font-weight:700;cursor:pointer}
.tm-lados button[aria-pressed=true],.tm-selector button[aria-checked=true]{background:#1c1a22;color:#fff}
.tm-paleta{display:inline-flex;align-items:center;gap:6px;font-weight:700}
.tm-paleta select{min-height:44px;border-radius:10px;padding:0 8px;font:inherit}
.tm-selector{display:flex;flex-wrap:wrap;gap:8px}
.tm-vista{box-sizing:border-box;min-height:70vh;padding:24px 16px 64px;background:var(--mk-fondo,#fff);color:var(--mk-texto,#1c1a22);font-family:var(--mk-fuente-texto,inherit)}
.tm-cabeza{box-sizing:border-box;max-width:1180px;margin:0 auto 24px;display:grid;gap:8px;padding:clamp(18px,4vw,32px);background:var(--mk-superficie,#fff);border:var(--mk-trazo,1px solid #ddd);border-radius:var(--mk-radio-tarjeta,16px);box-shadow:var(--mk-sombra,none)}
.tm-titulo{margin:0;font-family:var(--mk-fuente-cartel,var(--mk-fuente-titulo,inherit));font-size:clamp(2.2rem,1.4rem + 3.6vw,4.2rem);line-height:1.05;overflow-wrap:anywhere}
.tm-rubros{margin:0;font-size:clamp(1.05rem,1rem + .4vw,1.3rem)}
.tm-rubro{font-weight:800;color:var(--mk-acento,#7c3aed)}
.tm-guia{box-sizing:border-box;max-width:1180px;margin:0 auto;display:grid;gap:24px;min-width:0}
.tm-dos{display:grid;gap:18px;grid-template-columns:minmax(0,1fr);align-items:start}
@media (min-width:900px){.tm-dos{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tm-barras{grid-template-columns:minmax(0,1fr) auto;justify-items:start}
.tm-barras>.mk-barra:first-child{width:min(100%,280px)}
.tm-columna{display:grid;gap:16px;min-width:0}
.tm-fila{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.tm-subidas>*{flex:1 1 140px;min-width:0}
.tm-muestra{display:grid;gap:12px;min-width:0;padding:16px;background:var(--mk-superficie,#fff);border:var(--mk-fila-borde,1px solid var(--mk-borde,#ddd));border-radius:var(--mk-fila-radio,12px)}
.tm-muestra-cabeza{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}
.tm-muestra h3{margin:0;font-size:1.05rem}
.tm-nota{margin:0;color:var(--mk-suave,#5e5a68);font-size:.9rem}
.tm-boton{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border:var(--mk-trazo,2px solid currentColor);border-radius:var(--mk-radio-boton,10px);background:var(--mk-superficie,#fff);color:var(--mk-texto,inherit);box-shadow:var(--mk-sombra-suave,none);font:inherit;font-weight:700;cursor:pointer}
.tm-boton:active{transform:var(--mk-hundir,none)}
.tm-glow{display:grid;gap:4px;padding:16px}
.tm-tarjetas{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}
.tm-media{height:100%;min-height:90px}
.tm-volteable{box-sizing:border-box;display:grid;place-items:center;height:100%;min-height:170px;padding:16px;text-align:center;font-weight:700;background:var(--mk-superficie,#fff);border:var(--mk-fila-borde,1px solid var(--mk-borde,#ddd));border-radius:var(--mk-fila-radio,12px)}
.tm-dorso{background:color-mix(in srgb,var(--mk-acento,#7c3aed) 14%,var(--mk-superficie,#fff))}
.tm-casilla{display:inline-flex;align-items:center;gap:8px;min-height:44px;font-weight:600}
.tm-pedidos{display:grid;gap:10px}
.tm-pedido{padding:12px 14px;background:var(--mk-superficie,#fff);border:var(--mk-fila-borde,var(--mk-trazo,1px solid #ddd));border-radius:var(--mk-fila-radio,12px)}
.tm-presencia{min-height:4.5rem}
.tm-hoja-abajo{display:grid;gap:12px;padding:20px}
.tm-hoja-titulo{margin:0;font-family:var(--mk-fuente-cartel,inherit);font-size:1.5rem}
.tm-cifras{gap:32px}
.tm-cifra{display:block;font-family:var(--mk-fuente-cartel,inherit);font-size:2.4rem;line-height:1}
.tm-precio{font-size:2rem;font-weight:700}
.tm-confeti{position:relative;display:grid;place-items:center;min-height:9rem;overflow:hidden}
.tm-vista-pagina{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:14px;background:var(--mk-fondo,#fff);color:var(--mk-texto);border-radius:12px;border:1px dashed var(--mk-borde,#ccc)}
.tm-vista-pagina p{margin:0;font-family:var(--mk-fuente-titulo,inherit);font-weight:800}
`;
