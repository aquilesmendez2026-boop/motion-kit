import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Encabezado, Estilo, EstiloLaMente, RUBROS, RUBRO_IDS, encabezadoPorRubro, semillaAzar, normalizarReceta, recetaAProps,
  almacenLocal, crearDiseno, editarDiseno, duplicarDiseno, filtrarDisenos, etiquetasDe, exportarBiblioteca, importarBiblioteca,
  ESTADOS_DISENO, ESTADO_IDS, type DisenoBiblioteca, type EstadoDiseno, type FiltroBiblioteca, type RubroId,
} from "../src";

/** La biblioteca de la demo vive en este navegador. En La Mente (paso 5) se cambia este almacén por el de la API. */
export const almacen = almacenLocal();

/** Un ejemplo por rubro, armado como lo hace «Sorpréndeme con este rubro» (sin shader: es de la receta v2). */
function ejemplos(): DisenoBiblioteca[] {
  return RUBRO_IDS.map((rubro, i) => {
    const a = encabezadoPorRubro(rubro, semillaAzar(1000 + i));
    const receta = normalizarReceta({
      version: 1, estilo: a.estilo, composicion: a.composicion, entrada: a.entrada, efectoTexto: a.efectoTexto, pack: a.pack,
      ...(a.conEfecto ? { efecto: a.efecto, variante: a.variante } : {}), profundidad: a.profundidad, ...(a.luz ? { luz: a.luz } : {}),
      antetitulo: a.textos.antetitulo, titulo: a.textos.titulo, bajada: a.textos.bajada, datos: a.textos.datos,
      botones: [{ texto: a.textos.boton, href: "#carta" }, { texto: a.textos.secundario, href: "#contacto" }],
    });
    return crearDiseno({ nombre: `${RUBROS[rubro].nombre} · ejemplo`, receta, rubro, etiquetas: ["ejemplo"] });
  });
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function Biblioteca() {
  const [lista, setLista] = useState<DisenoBiblioteca[] | null>(null);
  const [f, setF] = useState<FiltroBiblioteca>({});
  const [aviso, setAviso] = useState("");
  const [borrando, setBorrando] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  const recargar = async () => setLista(await almacen.listar());
  useEffect(() => {
    recargar();
  }, []);
  const hacer = async (fn: () => Promise<void>, ok?: string) => {
    try {
      await fn();
      if (ok) setAviso(ok);
    } catch (e) {
      setAviso((e as Error).message);
    }
    await recargar();
  };

  const exportar = () => {
    if (!lista?.length) return;
    const url = URL.createObjectURL(new Blob([exportarBiblioteca(lista)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `biblioteca-motion-kit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAviso(`Exportados ${lista.length} diseños.`);
  };
  const importar = async (file: File | undefined) => {
    if (!file) return;
    const r = importarBiblioteca(await file.text(), lista ?? []);
    if (archivo.current) archivo.current.value = "";
    if (r.error) return setAviso(r.error);
    await hacer(() => almacen.guardarTodos(r.disenos));
    const malos = r.rechazados.map((x) => `n.º ${x.posicion}${x.nombre ? ` («${x.nombre}»)` : ""}: ${x.errores[0]?.mensaje}`);
    setAviso(`Se sumaron ${r.agregados} y se actualizaron ${r.actualizados}.${malos.length ? ` No se pudieron leer ${malos.length}: ${malos.join(" · ")}` : ""}`);
  };
  const estado = (d: DisenoBiblioteca, e: EstadoDiseno, texto: string) => hacer(() => almacen.guardar(editarDiseno(d, { estado: e })), `«${d.nombre}»: ${texto}.`);

  if (!lista) return <p className="bib-cargando">Cargando la biblioteca…</p>;
  const vistos = filtrarDisenos(lista, f);
  const etiquetas = etiquetasDe(lista);

  return (
    <div className="bib">
      <header className="bib-cabeza">
        <a href="#">← Demo</a>
        <h1>Biblioteca de diseños</h1>
        <p>Los encabezados del equipo. Lo aprobado es lo que se podrá usar en los negocios de La Mente.</p>
        {!almacen.persistente && <p className="bib-alerta" role="alert">Este navegador no deja guardar: lo que hagas se pierde al recargar. Exporta para no perderlo.</p>}
        <div className="bib-acciones">
          <a className="bib-boton" href="#encabezados">+ Nuevo en el editor</a>
          <button className="bib-boton" onClick={exportar} disabled={!lista.length} data-prueba="exportar">Exportar .json</button>
          <label className="bib-boton">Importar .json<input ref={archivo} type="file" accept="application/json,.json" hidden onChange={(e) => importar(e.target.files?.[0])} data-prueba="importar" /></label>
          {lista.length === 0 && <button className="bib-boton" onClick={() => hacer(() => almacen.guardarTodos(ejemplos()), "Se cargaron 10 ejemplos, uno por rubro.")} data-prueba="ejemplos">Cargar 10 ejemplos</button>}
        </div>
        {aviso && <p className="bib-aviso" role="status" data-prueba="aviso">{aviso}</p>}
      </header>

      <div className="bib-filtros" role="search">
        <label>Buscar<input type="search" value={f.texto ?? ""} onChange={(e) => setF({ ...f, texto: e.target.value })} placeholder="Nombre, etiqueta o título" data-prueba="buscar" /></label>
        <label>Rubro
          <select value={f.rubro ?? ""} onChange={(e) => setF({ ...f, rubro: e.target.value as RubroId | "" })} data-prueba="f-rubro">
            <option value="">Todos</option>
            {RUBRO_IDS.map((r) => <option key={r} value={r}>{RUBROS[r].nombre}</option>)}
          </select>
        </label>
        <label>Estado
          <select value={f.estado ?? ""} onChange={(e) => setF({ ...f, estado: e.target.value as EstadoDiseno | "" })} data-prueba="f-estado">
            <option value="">Activos (sin archivados)</option>
            {ESTADO_IDS.map((e) => <option key={e} value={e}>{ESTADOS_DISENO[e]}</option>)}
          </select>
        </label>
        <label>Etiqueta
          <select value={f.etiqueta ?? ""} onChange={(e) => setF({ ...f, etiqueta: e.target.value })} data-prueba="f-etiqueta">
            <option value="">Todas</option>
            {etiquetas.map((e) => <option key={e}>{e}</option>)}
          </select>
        </label>
        <small>{vistos.length} de {lista.length}</small>
      </div>

      {lista.length === 0 ? (
        <p className="bib-vacia">Todavía no hay diseños. Guarda uno desde el editor, importa un .json o carga los ejemplos.</p>
      ) : vistos.length === 0 ? (
        <p className="bib-vacia">Ningún diseño calza con el filtro.</p>
      ) : (
        <ul className="bib-lista">
          {vistos.map((d) => (
            <li key={d.id} className="bib-tarjeta" data-estado={d.estado} data-diseno={d.id}>
              <Miniatura d={d} />
              <div className="bib-datos">
                <h2>{d.nombre}</h2>
                <p>
                  <span className="bib-estado">{ESTADOS_DISENO[d.estado]}</span>
                  {d.rubro && <span>{RUBROS[d.rubro].nombre}</span>}
                  <span>editado {fecha(d.actualizado)}</span>
                </p>
                {d.etiquetas.length > 0 && <p className="bib-etiquetas">{d.etiquetas.map((e) => <button key={e} onClick={() => setF({ ...f, etiqueta: e })}>#{e}</button>)}</p>}
                <div className="bib-botones">
                  <a href={`#encabezados?id=${d.id}`} data-prueba="abrir">Abrir en el editor</a>
                  <button onClick={() => hacer(() => almacen.guardar(duplicarDiseno(d)), `Se duplicó «${d.nombre}».`)} data-prueba="duplicar">Duplicar</button>
                  {d.estado === "borrador" && <button onClick={() => estado(d, "aprobado", "aprobado")} data-prueba="aprobar">Aprobar</button>}
                  {d.estado === "aprobado" && <button onClick={() => estado(d, "borrador", "volvió a borrador")}>Volver a borrador</button>}
                  {d.estado !== "archivado"
                    ? <button onClick={() => estado(d, "archivado", "archivado")} data-prueba="archivar">Archivar</button>
                    : <button onClick={() => estado(d, "borrador", "restaurado como borrador")}>Restaurar</button>}
                  {borrando === d.id ? (
                    <span className="bib-confirmar">¿Borrar para siempre?
                      <button onClick={() => { setBorrando(null); hacer(() => almacen.borrar(d.id), `Se borró «${d.nombre}».`); }} data-prueba="borrar-si">Sí, borrar</button>
                      <button onClick={() => setBorrando(null)}>No</button>
                    </span>
                  ) : (
                    <button onClick={() => setBorrando(d.id)} data-prueba="borrar">Borrar</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** El encabezado de verdad, achicado y quieto (sin entrada ni efectos animados), como miniatura. */
function Miniatura({ d }: { d: DisenoBiblioteca }) {
  const props = recetaAProps(d.receta);
  const caja = useRef<HTMLDivElement>(null);
  // El lienzo mide 1280 px (un escritorio) y se achica al ancho de la tarjeta.
  useEffect(() => {
    const el = caja.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const o = new ResizeObserver(() => el.style.setProperty("--escala", String(el.clientWidth / 1280)));
    o.observe(el);
    return () => o.disconnect();
  }, []);
  const marco = (hijos: ReactNode) =>
    d.vista ? <EstiloLaMente tema={d.vista.tema} paleta={d.vista.paleta} base={d.receta.estilo}>{hijos}</EstiloLaMente> : <Estilo nombre={d.receta.estilo}>{hijos}</Estilo>;
  return (
    <div className="bib-mini" ref={caja} aria-hidden="true" inert>
      <div className="bib-mini-lienzo">
        {marco(<Encabezado {...props} entrada="ninguna" alto="medio" ahorro="siempre" boton={props.boton && { ...props.boton, href: "#biblioteca" }} botonSecundario={props.botonSecundario && { ...props.botonSecundario, href: "#biblioteca" }} />)}
      </div>
    </div>
  );
}
