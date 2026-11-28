// La vitrina del panel: las piezas de motion-kit/interfaz con los colores del panel de cada negocio de La Mente (claro
// y oscuro). La prueba es scripts/verificar-panel.mjs.
import { useEffect, useRef, useState } from "react";
import { BotonQueGuarda, BottomSheet, Campo, Cargando, Confirmar, Copiar, Contador, Interruptor, ListaViva, Skeleton, SubirImagen, TabBar, useToast, type FormaCarga } from "../src/entradas/interfaz";
import { variablesTema, type TemaInterfaz } from "../src/interfaz/tema";

/** Los colores del panel de La Mente (lamente-front/fronts/panel/src/theme.ts) y su violeta. */
const TEMAS: Record<"claro" | "oscuro", Partial<TemaInterfaz>> = {
  claro: { fondo: "#FAF7F2", superficie: "#FFFFFF", texto: "#1C1A22", suave: "#5E5A68", borde: "#E7E1D8", acento: "#7c3aed" },
  oscuro: { fondo: "#14121A", superficie: "#1E1B26", texto: "#F2EFF7", suave: "#B3AEBD", borde: "#2E2A38", acento: "#a78bfa", sobreAcento: "#14121A" },
};

/** Pone las variables en la raíz del documento: los avisos y las hojas se dibujan fuera de la vitrina (en body). */
function useTemaEnLaRaiz(tema: "claro" | "oscuro") {
  useEffect(() => {
    const raiz = document.documentElement;
    const vars = variablesTema(TEMAS[tema]);
    for (const [k, v] of Object.entries(vars)) raiz.style.setProperty(k, v);
    return () => {
      for (const k of Object.keys(vars)) raiz.style.removeProperty(k);
    };
  }, [tema]);
}

/** Una foto de mentira (la que «devuelve el servidor»): un degradado con el color de cada recuadro. */
const fotoDeMentira = (color: string, nombre = "") =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><desc>${nombre}</desc><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#f6c453"/></linearGradient></defs><rect width="160" height="90" fill="url(#g)"/></svg>`)}`;

/**
 * Una subida de mentira: avanza de 0 a 1 en 1,5 s y termina con una foto. `falla`: se cae a la mitad. `fallaAlGuardar`:
 * sube y 300 ms después falla al guardar la foto. `real`: como un front de verdad, cada subida sigue aunque se elija
 * otra foto (no se cancelan) y la que termina pone su foto.
 */
function useSubidaDeMentira(color: string, modo: "bien" | "falla" | "fallaAlGuardar" | "real" = "bien") {
  const [imagen, setImagen] = useState<string>();
  const [subiendo, setSubiendo] = useState<number | false>(false);
  const [error, setError] = useState<string>();
  const [elegidos, setElegidos] = useState(0);
  const reloj = useRef<ReturnType<typeof setInterval>>(undefined);
  const relojes = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => {
    clearInterval(reloj.current);
    relojes.current.forEach((r) => clearInterval(r));
  }, []);
  const alElegir = (archivo: File) => {
    setElegidos((n) => n + 1);
    setError(undefined);
    if (modo !== "real") clearInterval(reloj.current);
    let avance = 0;
    setSubiendo(0);
    const r = setInterval(() => {
      avance += 0.1;
      if (modo === "falla" && avance >= 0.5) {
        clearInterval(r);
        setSubiendo(false);
        setError("No se pudo subir. Intenta de nuevo.");
      } else if (avance >= 1) {
        clearInterval(r);
        setSubiendo(false);
        if (modo === "fallaAlGuardar") relojes.current.push(setTimeout(() => setError("No se pudo guardar la foto."), 300));
        else setImagen(fotoDeMentira(color, archivo.name));
      } else setSubiendo(avance);
    }, 150);
    if (modo === "real") relojes.current.push(r);
    else reloj.current = r;
  };
  return { imagen, subiendo, error, elegidos, alElegir, alQuitar: () => setImagen(undefined) };
}

/** Una carga de mentira: vuelve a montar `Cargando` y queda lista en `ms`; «refrescar» la vuelve a pedir sin desmontar. */
function useCargaDeMentira() {
  const [vuelta, setVuelta] = useState(0);
  const [listo, setListo] = useState(true);
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(reloj.current), []);
  const pedir = (ms: number, desmontar: boolean) => {
    clearTimeout(reloj.current);
    if (desmontar) setVuelta((n) => n + 1);
    setListo(false);
    reloj.current = setTimeout(() => setListo(true), ms);
  };
  return { vuelta, listo, rapido: () => pedir(80, true), lento: () => pedir(1000, true), refrescar: () => pedir(1000, false) };
}

const FORMAS: FormaCarga[] = ["texto", "fila", "tarjeta", "tabla", "foto"];

interface Pedido {
  id: string;
  nombre: string;
  listo: boolean;
}
const NOMBRES = ["Ana", "Luis", "Marta", "Pedro", "Sofía", "Tomás", "Valentina", "Diego", "Camila", "Joaquín", "Isidora", "Benja"];
const pedidoN = (n: number): Pedido => ({ id: `p${n}`, nombre: NOMBRES[n % NOMBRES.length], listo: false });
/** Los pendientes arriba (el más nuevo primero) y los listos abajo. */
const ordenar = (l: Pedido[]) => [...l.filter((p) => !p.listo), ...l.filter((p) => p.listo)];

/** «Ahora» de mentira: llegan pedidos, pasan a listos (se reordenan) y se entregan (salen). */
function usePedidosDeMentira() {
  const n = useRef(3);
  const [vuelta, setVuelta] = useState(0);
  const [pedidos, setPedidos] = useState<Pedido[]>(() => [pedidoN(0), pedidoN(1), pedidoN(2)]);
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(reloj.current), []);
  return {
    vuelta,
    pedidos,
    llega: () => setPedidos((l) => ordenar([pedidoN(n.current++), ...l])),
    listo: () => setPedidos((l) => { const i = l.findIndex((p) => !p.listo); return i < 0 ? l : ordenar(l.map((p, j) => (j === i ? { ...p, listo: true } : p))); }),
    entregado: () => setPedidos((l) => { const i = l.findIndex((p) => p.listo); return i < 0 ? l : l.filter((_, j) => j !== i); }),
    // La lista se vuelve a montar vacía y los datos llegan después (como al abrir «Ahora»).
    recargar: () => {
      setVuelta((v) => v + 1);
      setPedidos([]);
      clearTimeout(reloj.current);
      reloj.current = setTimeout(() => setPedidos(Array.from({ length: 10 }, (_, i) => pedidoN(100 + i))), 300);
    },
  };
}

/** Un guardado de mentira: tarda 600 ms y sale bien o mal; cuenta cuántas veces lo llamaron. */
function useGuardadoDeMentira(sale: "bien" | "mal") {
  const [llamadas, setLlamadas] = useState(0);
  const alGuardar = () => {
    setLlamadas((n) => n + 1);
    return new Promise<void>((ok, falla) => setTimeout(() => (sale === "bien" ? ok() : falla(new Error("sin red"))), 600));
  };
  return { llamadas, alGuardar };
}

export function PanelVitrina() {
  const [tema, setTema] = useState<"claro" | "oscuro">(() => (location.hash.includes("oscuro") ? "oscuro" : "claro"));
  const [hoja, setHoja] = useState(false);
  const [pestana, setPestana] = useState("pedidos");
  const toast = useToast();
  useTemaEnLaRaiz(tema);
  const logo = useSubidaDeMentira("#7c3aed");
  const portada = useSubidaDeMentira("#0ea5e9", "real");
  const producto = useSubidaDeMentira("#ef4444", "falla");
  const galeria = useSubidaDeMentira("#22c55e", "fallaAlGuardar");
  const [deshechos, setDeshechos] = useState(0);
  const carga = useCargaDeMentira();
  const ahora = usePedidosDeMentira();
  const guardaBien = useGuardadoDeMentira("bien");
  const guardaMal = useGuardadoDeMentira("mal");
  const [conTercero, setConTercero] = useState(true);
  const [nombre, setNombre] = useState("");
  const [errorNombre, setErrorNombre] = useState<string>();
  const [, setRepinta] = useState(0);
  const [preguntando, setPreguntando] = useState<"" | "simple" | "espera" | "falla">("");
  const [onclicks, setOnclicks] = useState(0);
  const [ventana, setVentana] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [confirmados, setConfirmados] = useState(0);
  const [cancelados, setCancelados] = useState(0);
  const confirmar = () => {
    setConfirmados((n) => n + 1);
    if (preguntando === "falla") {
      // El borrado falla: se apaga «ocupado» y el diálogo queda abierto para reintentar.
      setOcupado(true);
      setTimeout(() => setOcupado(false), 400);
    } else if (preguntando === "espera") {
      setOcupado(true);
      setTimeout(() => { setOcupado(false); setPreguntando(""); }, 800);
    } else setPreguntando("");
  };
  const [abierto, setAbierto] = useState(true);
  const pendientes = ahora.pedidos.filter((p) => !p.listo).length;
  const borrar = (texto = "Borrado") => toast(texto, { accion: { texto: "Deshacer", alHacer: () => setDeshechos((n) => n + 1) } });

  return (
    <div className="panel-pagina" data-tema={tema}>
      <a className="panel-volver" href="#">← Volver</a>
      <header className="panel-cabeza">
        <h1>Panel con vida</h1>
        <p>Las piezas de interfaz con los colores del panel de cada negocio.</p>
        <label className="panel-tema">
          Tema{" "}
          <select data-prueba="panel-tema" value={tema} onChange={(e) => setTema(e.target.value as "claro" | "oscuro")}>
            <option value="claro">Claro</option>
            <option value="oscuro">Oscuro</option>
          </select>
        </label>
      </header>

      <section className="panel-seccion" data-prueba="panel-colores">
        <h2>Colores del tema</h2>
        <p className="panel-nota">La hoja, el aviso, el esqueleto y la barra toman el tema (claro u oscuro).</p>
        <div className="panel-fila">
          <button type="button" className="panel-boton" data-prueba="abrir-hoja" onClick={() => setHoja(true)}>Abrir hoja</button>
          <button type="button" className="panel-boton" data-prueba="mostrar-aviso" onClick={() => toast("Guardado", { duration: 60000 })}>Mostrar aviso</button>
        </div>
        <div className="panel-tarjeta" data-prueba="esqueleto">
          <Skeleton width={48} height={48} radius={999} />
          <div style={{ flex: 1, display: "grid", gap: 8 }}>
            <Skeleton height={14} width="70%" />
            <Skeleton height={12} width="45%" />
          </div>
        </div>
        <div data-prueba="barra">
          <TabBar
            position="static"
            value={pestana}
            onChange={setPestana}
            items={[{ id: "pedidos", label: "Pedidos", icon: "🧾" }, { id: "agenda", label: "Agenda", icon: "📅" }, { id: "caja", label: "Caja", icon: "💵" }]}
          />
        </div>
      </section>

      <section className="panel-seccion" data-prueba="panel-imagen">
        <h2>Tus imágenes</h2>
        <p className="panel-nota">Arrastra una foto o toca para elegir. El producto falla a propósito, para ver el error.</p>
        <div className="panel-imagenes">
          <div data-prueba="subir-logo">
            <SubirImagen etiqueta="Logo" ayuda="PNG, JPG o WebP, hasta 2 MB." forma="redonda" imagen={logo.imagen} subiendo={logo.subiendo} error={logo.error} alElegir={logo.alElegir} alQuitar={logo.alQuitar} />
            <small data-prueba="elegidos-logo">{logo.elegidos}</small>
          </div>
          <div data-prueba="subir-portada" className="panel-ancha">
            <SubirImagen etiqueta="Foto de portada" ayuda="Una foto horizontal de tu local, tus productos o tu trabajo." forma="apaisada" imagen={portada.imagen} subiendo={portada.subiendo} error={portada.error} alElegir={portada.alElegir} />
            <small data-prueba="elegidos-portada">{portada.elegidos}</small>
          </div>
          <div data-prueba="subir-producto">
            <SubirImagen etiqueta="Foto del producto" forma="cuadrada" imagen={producto.imagen} subiendo={producto.subiendo} error={producto.error} alElegir={producto.alElegir} />
            <small data-prueba="elegidos-producto">{producto.elegidos}</small>
          </div>
          <div data-prueba="subir-galeria">
            <SubirImagen etiqueta="Foto de la galería" forma="cuadrada" imagen={galeria.imagen} subiendo={galeria.subiendo} error={galeria.error} alElegir={galeria.alElegir} />
            <small data-prueba="elegidos-galeria">{galeria.elegidos}</small>
          </div>
        </div>
      </section>

      <section className="panel-seccion" data-prueba="panel-avisos">
        <h2>Avisos</h2>
        <p className="panel-nota">Al guardar, al fallar o al borrar (con «Deshacer»). Se cierran deslizándolos o con la ×.</p>
        <div className="panel-fila">
          <button type="button" className="panel-boton" data-prueba="aviso-bien" onClick={() => toast("Guardado", { tipo: "bien" })}>Guardar</button>
          <button type="button" className="panel-boton" data-prueba="aviso-mal" onClick={() => toast("No se pudo guardar", { tipo: "mal" })}>Fallar</button>
          <button type="button" className="panel-boton" data-prueba="aviso-borrar" onClick={() => borrar()}>Borrar</button>
          <button type="button" className="panel-boton" data-prueba="aviso-hola" onClick={() => toast("Hola")}>Aviso simple</button>
          <button type="button" className="panel-boton" data-prueba="aviso-muchos" onClick={() => { borrar("Pedido borrado"); for (let i = 1; i <= 4; i++) toast(`Aviso ${i}`); }}>Cinco avisos</button>
          <button type="button" className="panel-boton" data-prueba="aviso-tres-y-error" onClick={() => { for (let i = 1; i <= 3; i++) borrar(`Borrado ${i}`); toast("No se pudo guardar", { tipo: "mal" }); }}>Tres borrados y un error</button>
        </div>
        <small data-prueba="deshechos" hidden>{deshechos}</small>
      </section>

      <section className="panel-seccion" data-prueba="panel-cargando">
        <h2>Cargando</h2>
        <p className="panel-nota">En vez de una rueda, la forma de lo que viene. Una carga corta no lo muestra; refrescar no lo vuelve a tapar.</p>
        <div className="panel-fila">
          <button type="button" className="panel-boton" data-prueba="cargar-rapido" onClick={carga.rapido}>Carga corta</button>
          <button type="button" className="panel-boton" data-prueba="cargar-lento" onClick={carga.lento}>Carga de 1 s</button>
          <button type="button" className="panel-boton" data-prueba="refrescar" onClick={carga.refrescar}>Refrescar</button>
        </div>
        <div className="panel-tarjeta" data-prueba="carga-demo" style={{ display: "block", minHeight: 140 }}>
          <Cargando key={carga.vuelta} listo={carga.listo} forma="tabla" cuantos={3}>
            <table data-prueba="carga-contenido" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th align="left">Cliente</th><th>Hora</th><th>Total</th></tr></thead>
              <tbody><tr><td>Ana</td><td>10:30</td><td>$12.000</td></tr><tr><td>Luis</td><td>11:00</td><td>$8.500</td></tr></tbody>
            </table>
          </Cargando>
        </div>
        <div className="panel-formas" data-prueba="formas">
          {FORMAS.map((f) => (
            <div key={f} data-prueba={`forma-${f}`}>
              <small>{f}</small>
              <Cargando listo={false} forma={f} cuantos={f === "foto" ? 1 : 3}>{null}</Cargando>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-seccion" data-prueba="panel-guardar">
        <h2>Guardar</h2>
        <p className="panel-nota">El botón cuenta cómo va: guardando, guardado o no se pudo. Tiene el estilo del botón amarillo del panel (que se hunde).</p>
        <div className="panel-fila">
          <BotonQueGuarda className="panel-boton-hunde" data-prueba="guardar-bien" alGuardar={guardaBien.alGuardar}>Guardar</BotonQueGuarda>
          <BotonQueGuarda className="panel-boton-hunde" data-prueba="guardar-mal" alGuardar={guardaMal.alGuardar}>Guardar</BotonQueGuarda>
          {conTercero && <BotonQueGuarda className="panel-boton-hunde" data-prueba="guardar-desmonta" alGuardar={guardaBien.alGuardar}>Guardar y salir</BotonQueGuarda>}
          <button type="button" className="panel-boton" data-prueba="cambiar-seccion" onClick={() => setConTercero(false)}>Cambiar de sección</button>
          <BotonQueGuarda className="panel-boton-hunde" data-prueba="guardar-onclick" onClick={() => setOnclicks((n) => n + 1)} alGuardar={guardaBien.alGuardar}>Guardar (con onClick)</BotonQueGuarda>
        </div>
        <small hidden data-prueba="llamadas-bien">{guardaBien.llamadas}</small>
        <small hidden data-prueba="llamadas-mal">{guardaMal.llamadas}</small>
        <small hidden data-prueba="onclicks">{onclicks}</small>
      </section>

      <section className="panel-seccion" data-prueba="panel-copiar-campo">
        <h2>Copiar y campos</h2>
        <p className="panel-nota">Copiar el link con un globo que lo confirma; un campo cuyo error se sacude y queda al lado.</p>
        <div className="panel-fila">
          <Copiar className="panel-boton" data-prueba="copiar" texto="https://lamente.cl/cami-viaja">⧉ Copiar link</Copiar>
        </div>
        <div data-prueba="campo" style={{ maxWidth: 360 }}>
          <Campo etiqueta="Nombre del negocio" ayuda="Como lo ven tus clientes." error={errorNombre}>
            {(a11y) => <input {...a11y} data-prueba="campo-input" className="panel-input" value={nombre} onChange={(e) => setNombre(e.target.value)} />}
          </Campo>
        </div>
        <div className="panel-fila">
          <button type="button" className="panel-boton" data-prueba="error-uno" onClick={() => setErrorNombre("Escribe el nombre de tu negocio.")}>Guardar vacío</button>
          <button type="button" className="panel-boton" data-prueba="error-mismo" onClick={() => setRepinta((n) => n + 1)}>Repintar (mismo error)</button>
          <button type="button" className="panel-boton" data-prueba="error-otro" onClick={() => setErrorNombre("Ese nombre es muy largo.")}>Otro error</button>
          <button type="button" className="panel-boton" data-prueba="error-nada" onClick={() => setErrorNombre(undefined)}>Sin error</button>
        </div>
      </section>

      <section className="panel-seccion" data-prueba="panel-confirmar">
        <h2>Confirmar</h2>
        <p className="panel-nota">Antes de algo que no se deshace: un globo en el computador, una hoja desde abajo en el teléfono.</p>
        <div className="panel-fila">
          <button type="button" className="panel-boton" data-prueba="abrir-confirmar" onClick={() => setPreguntando("simple")}>🗑 Borrar novedad</button>
          <button type="button" className="panel-boton" data-prueba="abrir-confirmar-espera" onClick={() => setPreguntando("espera")}>🗑 Borrar (tarda)</button>
          <button type="button" className="panel-boton" data-prueba="abrir-confirmar-falla" onClick={() => setPreguntando("falla")}>🗑 Borrar (falla)</button>
          <button type="button" className="panel-boton" data-prueba="abrir-ventana" onClick={() => setVentana(true)}>Abrir una ventana</button>
        </div>
        <small hidden data-prueba="confirmados">{confirmados}</small>
        <small hidden data-prueba="cancelados">{cancelados}</small>
        {ventana && (
          <div data-prueba="ventana-modal" style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,.3)", display: "grid", placeItems: "center" }}>
            <div style={{ background: "#fff", padding: 24, borderRadius: 12 }}>
              <p>Una ventana como las del panel (z-index 1400).</p>
              <button type="button" className="panel-boton" data-prueba="abrir-confirmar-ventana" onClick={() => setPreguntando("simple")}>🗑 Borrar ítem</button>
              <button type="button" className="panel-boton" onClick={() => setVentana(false)}>Cerrar</button>
            </div>
          </div>
        )}
        <Confirmar
          abierto={preguntando !== ""}
          pregunta="¿Borro la novedad?"
          detalle="Tus clientes dejarán de verla."
          textoSi="Sí, borrar"
          peligro
          ocupado={ocupado}
          alConfirmar={confirmar}
          alCancelar={() => { setCancelados((n) => n + 1); setPreguntando(""); }}
        />
      </section>

      <section className="panel-seccion" data-prueba="panel-llega">
        <h2>
          Ahora <Contador data-prueba="contador" valor={pendientes} etiqueta={`${pendientes} pedidos pendientes`} />
        </h2>
        <div data-prueba="interruptor">
          <Interruptor etiqueta="Recibir pedidos" activo={abierto} alCambiar={setAbierto} textos={["Cerrado", "Abierto"]} />
          <small data-prueba="abierto" hidden>{String(abierto)}</small>
        </div>
        <div className="panel-fila">
          <button type="button" className="panel-boton" data-prueba="llega" onClick={ahora.llega}>Llega un pedido</button>
          <button type="button" className="panel-boton" data-prueba="pasa-listo" onClick={ahora.listo}>Pasa a listo</button>
          <button type="button" className="panel-boton" data-prueba="entregado" onClick={ahora.entregado}>Entregado</button>
          <button type="button" className="panel-boton" data-prueba="recargar" onClick={ahora.recargar}>Abrir de nuevo</button>
        </div>
        <ListaViva key={ahora.vuelta} className="panel-pedidos" data-prueba="lista">
          {ahora.pedidos.map((p) => (
            <div key={p.id} className="panel-pedido" data-pedido={p.id} data-listo={p.listo || undefined}>
              <strong>{p.nombre}</strong>
              <span>{p.listo ? "Listo" : "Preparando"}</span>
            </div>
          ))}
        </ListaViva>
      </section>

      <BottomSheet open={hoja} onClose={() => setHoja(false)} label="Hoja de ejemplo">
        <div data-prueba="hoja" style={{ padding: "8px 20px 24px" }}>
          <h3 style={{ margin: "0 0 8px" }}>Confirmar pedido</h3>
          <p style={{ margin: 0 }}>La hoja toma la superficie y el texto del tema.</p>
        </div>
      </BottomSheet>
    </div>
  );
}
