import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  COMPOSICIONES, COMPOSICION_IDS, EFECTOS, ENTRADAS, ENTRADA_IDS, ESTILOS, ESTILO_IDS, Encabezado, Estilo,
  PACKS_BOTONES, PACK_IDS, encabezadoAlAzar, transicionVista, ALTOS, ALTO_IDS, MedidorPeso,
  SHADERS, SHADER_IDS, SALIDAS, SALIDA_IDS, FORMAS_OBJETO, RUBROS, RUBRO_IDS, encabezadoPorRubro, semillaAzar, comprimirFoto,
  MedidorFluidez, MedidorCarga, SemaforoContraste, CodigoQR, validarReceta, normalizarReceta, recetaAProps, imagenGenerada, olvidarApertura, paletaDeFoto,
  EstiloLaMente, TEMAS_LAMENTE, PALETAS_LAMENTE, TEMA_LAMENTE_IDS, PALETA_LAMENTE_IDS, BASE_DE_TEMA, type TemaLaMente, type PaletaLaMente,
  type FormaObjeto, type ModoAhorro, type NivelEscena, type ObjetoEncabezado, type RubroId, type SalidaEncabezado, type ShaderId,
  crearDiseno, editarDiseno, type DisenoBiblioteca, type RecetaEncabezado,
  type AltoEncabezado, type Tratamiento, type ComposicionId, type EfectoId, type EntradaId, type EstiloId, type FuenteMovimiento, type ModoLuz, type PackBotonId, type TextoEfecto, type Variante,
} from "../src";

import { enlaceVista, type ConfigVista } from "./compartir";
import { almacen } from "./Biblioteca";

const TEXTOS: TextoEfecto[] = ["revelar", "voltear", "rebote", "encender", "glitch", "maquina", "impacto", "temblor", "caer", "trailer", "onda"];
const EJEMPLO = { antetitulo: "Barrio Italia · desde 2019", titulo: "Café de *especialidad*, tostado aquí", bajada: "Granos de origen, pan de masa madre y un rincón tranquilo para quedarse.", boton: "Ver la carta", secundario: "Cómo llegar", datos: "Lun a sáb, 8:00 a 20:00, Santiago" };

/** El editor. Con `id`, abre ese diseño de la biblioteca. */
/** Datos de ejemplo del estado del negocio (en La Mente vienen de su horario y su agenda). */
const hoyA = (h: number, m: number) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); };
const ESTADOS_DEMO = {
  abierto: { abierto: true, cierraA: "22:00" },
  cerrado: { abierto: false, abreA: { dia: "lunes", hora: "9:00" } },
  proxima: { abierto: true, cierraA: "22:00", proximaHora: hoyA(17, 30) },
};

/** Horas fijas para ver la hora del día sin esperar. */
const HORAS_DEMO = { manana: new Date(2026, 10, 23, 9, 0), tarde: new Date(2026, 10, 23, 15, 0), noche: new Date(2026, 10, 23, 22, 0) };

export function Encabezados({ id }: { id?: string } = {}) {
  const [estilo, setEstilo] = useState<EstiloId>("neon");
  const [composicion, setComposicion] = useState<ComposicionId>("letrero");
  const [entrada, setEntrada] = useState<EntradaId>("foco");
  const [efectoTexto, setEfectoTexto] = useState<TextoEfecto>("encender");
  const [efecto, setEfecto] = useState<EfectoId | "">("rejilla");
  const [variante, setVariante] = useState<Variante>(1);
  const [pack, setPack] = useState<PackBotonId>("neon-tubo");
  const [t, setT] = useState(EJEMPLO);
  const [celular, setCelular] = useState(false);
  const [n, setN] = useState(0);
  const [alto, setAlto] = useState<AltoEncabezado>("pantalla");
  const [altoCelular, setAltoCelular] = useState<AltoEncabezado | "">("");
  const [profundidad, setProfundidad] = useState(false);
  const [luz, setLuz] = useState<ModoLuz | "">("");
  const [mover, setMover] = useState("puntero,scroll");
  const [foto, setFoto] = useState<string>("");
  const [comprimir, setComprimir] = useState(true);
  const [infoFoto, setInfoFoto] = useState("");
  const [shader, setShader] = useState<ShaderId | "">("");
  const [forma, setForma] = useState<FormaObjeto | "">("");
  const [salida, setSalida] = useState<SalidaEncabezado>("ninguna");
  const [ahorro, setAhorro] = useState<ModoAhorro>("auto");
  const [nivel, setNivel] = useState<NivelEscena>("completo");
  const [rubro, setRubro] = useState<RubroId>("cafeteria");
  const [semilla, setSemilla] = useState<number | null>(null);
  const [lmTema, setLmTema] = useState<TemaLaMente | "">("");
  const [lmPaleta, setLmPaleta] = useState<PaletaLaMente>("clasica");
  const [hrefs, setHrefs] = useState<[string, string]>(["#carta", "#contacto"]);
  // Película (receta v2)
  const [apertura, setApertura] = useState(false);
  const [presenta, setPresenta] = useState("");
  const [fotosEjemplo, setFotosEjemplo] = useState(false);
  const [tomas, setTomas] = useState(false);
  const [palabras, setPalabras] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [barraPropia, setBarraPropia] = useState(false);
  const [estadoDemo, setEstadoDemo] = useState<keyof typeof ESTADOS_DEMO | "">("");
  const [fotoLetras, setFotoLetras] = useState(false);
  const [tratamiento, setTratamiento] = useState<Tratamiento | "">("");
  const [horaDemo, setHoraDemo] = useState<"" | "auto" | "manana" | "tarde" | "noche">("");
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [infoColores, setInfoColores] = useState("");
  const usarColoresDeFoto = async () => {
    if (!archivoFoto) return;
    try {
      const r = await paletaDeFoto(archivoFoto);
      setLmTema(r.tema); setLmPaleta(r.paleta);
      setInfoColores(`Colores de la foto: ${r.colores.join(", ")} → paleta ${PALETAS_LAMENTE[r.paleta].nombre}, tema ${TEMAS_LAMENTE[r.tema].nombre}.`);
    } catch (e) {
      setInfoColores(`No se pudieron leer los colores: ${(e as Error).message}`);
    }
  };
  // Biblioteca: el diseño abierto (si vino de ahí), su nombre y etiquetas, y el último aviso.
  const [abierto, setAbierto] = useState<DisenoBiblioteca | null>(null);
  const [nombre, setNombre] = useState("");
  const [etiquetas, setEtiquetas] = useState("");
  const [avisoBib, setAvisoBib] = useState("");
  const vista = useRef<HTMLDivElement>(null);
  useEffect(() => () => { if (foto) URL.revokeObjectURL(foto); }, [foto]);
  const subirFoto = async (f: File | undefined) => {
    if (!f) { setFoto(""); setInfoFoto(""); return; }
    if (!comprimir) { setFoto(URL.createObjectURL(f)); setInfoFoto(`${Math.round(f.size / 1000)} KB, sin comprimir`); return; }
    setInfoFoto("Comprimiendo…");
    try {
      const c = await comprimirFoto(f, { maximo: celular ? 100_000 : 200_000 });
      setFoto(c.url);
      setInfoFoto(`${Math.round(c.bytesAntes / 1000)} KB → ${Math.round(c.bytes / 1000)} KB (${c.tipo.replace("image/", "").toUpperCase()}, ${c.ancho}×${c.alto})${c.dentro ? "" : " · no alcanzó el máximo"}`);
    } catch (e) {
      setInfoFoto(`No se pudo comprimir: ${(e as Error).message}`);
    }
  };
  const porRubro = (s0?: number) => {
    const sem = s0 ?? Math.floor(Math.random() * 1e9);
    const a = encabezadoPorRubro(rubro, semillaAzar(sem));
    transicionVista(() => {
      setSemilla(sem);
      setEstilo(a.estilo); setComposicion(a.composicion); setEntrada(a.entrada); setEfecto(a.conEfecto ? a.efecto : ""); setVariante(a.variante);
      setEfectoTexto(a.efectoTexto); setPack(a.pack); setShader(a.shader ?? ""); setProfundidad(a.profundidad); setLuz(a.luz ?? "");
      setT({ ...a.textos, datos: a.textos.datos.join(", ") }); otra();
    }, ESTILOS[a.estilo].vista);
  };
  const elegirAlto = (v: string, poner: (a: AltoEncabezado) => void) => poner(v === "numero" ? 70 : (v as AltoEncabezado));
  const otra = () => setN((x) => x + 1);

  const aplicarEstilo = (e: EstiloId) => {
    const d = ESTILOS[e];
    setEstilo(e); setEfecto(d.efectos[0]); setEfectoTexto(d.texto[0]); setPack(d.pack);
    if (!COMPOSICIONES[composicion].estilos.includes(e)) setComposicion(COMPOSICION_IDS.find((c) => COMPOSICIONES[c].estilos.includes(e))!);
    otra();
  };
  const usarEstilo = (e: EstiloId, conTransicion = true) => (conTransicion ? transicionVista(() => aplicarEstilo(e), ESTILOS[e].vista) : aplicarEstilo(e));
  const azar = () => {
    const e = ESTILO_IDS[Math.floor(Math.random() * ESTILO_IDS.length)];
    const a = encabezadoAlAzar(e);
    transicionVista(() => {
      setEstilo(e); setComposicion(a.composicion); setEntrada(a.entrada); setEfecto(a.efecto); setVariante(a.variante); setEfectoTexto(a.efectoTexto); setPack(a.pack); otra();
    }, ESTILOS[e].vista);
  };
  const datos = t.datos.split(",").map((d) => d.trim()).filter(Boolean);
  // Lo que se guarda: la receta (ver src/receta). La foto local se ve aquí, pero no viaja en ella; las fotos de ejemplo
  // van como keys «ejemplo/N», que la vista convierte en ilustraciones del estilo.
  const botones = [{ texto: t.boton, href: hrefs[0] }, { texto: t.secundario, href: hrefs[1] }].filter((b) => b.texto.trim());
  const cruda = {
    version: 1, estilo, composicion, entrada, efectoTexto, pack, ...(efecto ? { efecto, variante } : {}),
    antetitulo: t.antetitulo, titulo: t.titulo, bajada: t.bajada, datos, botones, alto, ...(altoCelular !== "" ? { altoCelular } : {}),
    profundidad, ...(luz ? { luz } : {}), ...((profundidad || luz === "puntero") && mover !== "puntero,scroll" ? { mover: mover.split(",") as FuenteMovimiento[] } : {}),
    salida, ahorro, ...(shader ? { shader } : {}), ...(forma ? { objeto: { forma, texto: (t.titulo.match(/\*([^*]+)\*/)?.[1] ?? t.titulo).slice(0, 24) } } : {}),
    ...(fotosEjemplo ? { imagenes: ["ejemplo/1", "ejemplo/2", "ejemplo/3"], alt: "Foto de ejemplo" } : {}),
    ...(apertura ? { apertura: presenta.trim() ? { presenta } : {} } : {}), ...(tomas ? { tomas: true } : {}),
    ...(palabras.trim() ? { palabras: palabras.split(",").map((w) => w.trim()).filter(Boolean) } : {}),
    ...(nombreNegocio.trim() ? { nombre: nombreNegocio } : {}), ...(estadoDemo ? { estado: true } : {}),
    ...(fotoLetras ? { fotoEnLetras: true } : {}), ...(tratamiento ? { tratamiento } : {}), ...(horaDemo ? { horaDelDia: true } : {}),
  };
  const resultado = validarReceta(cruda);
  const receta = resultado.ok ? resultado.receta : normalizarReceta(cruda);
  const props = recetaAProps(receta, { urlImagen: (k) => (k.startsWith("ejemplo/") ? imagenGenerada(estilo, [300, 40, 190][(Number(k.slice(8)) - 1) % 3]) : k) });
  const objeto: ObjetoEncabezado | undefined = forma ? { tipo: "3d", forma, caras: foto ? [foto, foto] : undefined, texto: (t.titulo.match(/\*([^*]+)\*/)?.[1] ?? t.titulo).slice(0, 24) } : undefined;
  const config: ConfigVista = { estilo, ...(lmTema ? { lmTema, lmPaleta } : {}), ...props, ...(shader ? { shader } : {}), objeto: objeto && { ...objeto, caras: undefined } };
  const enlace = enlaceVista(config);
  // Pone en el editor una receta guardada (lo inverso de `cruda`).
  const aplicarReceta = (r: RecetaEncabezado) => {
    setEstilo(r.estilo); setComposicion(r.composicion); setEntrada(r.entrada); setEfectoTexto(r.efectoTexto); setPack(r.pack);
    setEfecto(r.efecto ?? ""); setVariante(r.variante ?? 1);
    setT({
      antetitulo: r.antetitulo ?? "", titulo: r.titulo, bajada: r.bajada ?? "", datos: (r.datos ?? []).join(", "),
      boton: r.botones?.[0]?.texto ?? "", secundario: r.botones?.[1]?.texto ?? "",
    });
    setHrefs([r.botones?.[0]?.href ?? "#carta", r.botones?.[1]?.href ?? "#contacto"]);
    setAlto(r.alto); setAltoCelular(r.altoCelular ?? ""); setProfundidad(r.profundidad); setLuz(r.luz ?? "");
    setMover((r.mover ?? ["puntero", "scroll"]).join(",")); setSalida(r.salida); setAhorro(r.ahorro);
    setShader(r.shader ?? ""); setForma(r.objeto?.forma ?? "");
    setApertura(Boolean(r.apertura)); setPresenta(r.apertura?.presenta ?? ""); setTomas(Boolean(r.tomas));
    setFotosEjemplo(Boolean(r.imagenes?.length && r.imagenes.every((k) => k.startsWith("ejemplo/")))); setPalabras((r.palabras ?? []).join(", "));
    setNombreNegocio(r.nombre ?? ""); setEstadoDemo(r.estado ? "abierto" : "");
    setFotoLetras(Boolean(r.fotoEnLetras)); setTratamiento(r.tratamiento ?? ""); setHoraDemo(r.horaDelDia ? "auto" : "");
    otra();
  };
  useEffect(() => {
    if (!id) return;
    let vivo = true;
    almacen.listar().then((lista) => {
      const d = lista.find((x) => x.id === id);
      if (!vivo) return;
      if (!d) return setAvisoBib("Ese diseño ya no está en la biblioteca.");
      aplicarReceta(d.receta);
      setAbierto(d); setNombre(d.nombre); setEtiquetas(d.etiquetas.join(", "));
      if (d.rubro) setRubro(d.rubro);
      setLmTema(d.vista?.tema ?? ""); if (d.vista) setLmPaleta(d.vista.paleta);
      setAvisoBib(`Abierto «${d.nombre}» (${d.estado}).`);
    });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const guardarEnBiblioteca = async (comoNuevo: boolean) => {
    if (!resultado.ok) return setAvisoBib("Arregla los errores de la receta antes de guardar.");
    const datosVista = lmTema ? { vista: { tema: lmTema, paleta: lmPaleta } } : {};
    try {
      // Un diseño aprobado que se cambia vuelve a borrador: hay que aprobarlo de nuevo.
      const d = abierto && !comoNuevo
        ? editarDiseno(abierto, { nombre, etiquetas: etiquetas.split(","), rubro, receta: resultado.receta, vista: lmTema ? { tema: lmTema, paleta: lmPaleta } : undefined, estado: abierto.estado === "archivado" ? "archivado" : "borrador" })
        : crearDiseno({ nombre, receta: resultado.receta, rubro, etiquetas, ...datosVista });
      await almacen.guardar(d);
      setAbierto(d);
      setAvisoBib(`Guardado «${d.nombre}» en la biblioteca${abierto && !comoNuevo && abierto.estado === "aprobado" ? " (vuelve a borrador: hay que aprobarlo de nuevo)" : ""}.`);
      if (location.hash !== `#encabezados?id=${d.id}`) history.replaceState(null, "", `#encabezados?id=${d.id}`);
    } catch (e) {
      setAvisoBib((e as Error).message);
    }
  };
  const campo = (k: keyof typeof EJEMPLO, etiqueta: string, ayuda?: string) => (
    <label>{etiqueta}
      <input value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value })} onBlur={otra} data-campo={k} />
      {ayuda && <small>{ayuda}</small>}
    </label>
  );

  return (
    <div className="enc-editor">
      <aside className="estudio-panel">
        <a href="#">← Demo</a>
        <h1>Editor de encabezado</h1>
        <p className="enc-nota">Así lo vería un cliente: cambia textos, composición, entrada y botones sin tocar código.</p>
        <div className="enc-acciones">
          <button className="enc-azar" onClick={azar} data-prueba="azar">🎲 Sorpréndeme</button>
          <button className="enc-repetir" onClick={otra} data-prueba="repetir">↻ Repetir entrada</button>
        </div>
        <fieldset><legend>Plantilla por rubro</legend>
          <label>Rubro
            <select value={rubro} onChange={(e) => setRubro(e.target.value as RubroId)} data-prueba="rubro">
              {RUBRO_IDS.map((r) => <option key={r} value={r}>{RUBROS[r].nombre}</option>)}
            </select>
          </label>
          <button className="enc-azar" onClick={() => porRubro()} data-prueba="por-rubro">🎲 Sorpréndeme con este rubro</button>
          {semilla !== null && <small data-prueba="semilla">Semilla {semilla}: la misma semilla repite este encabezado.</small>}
        </fieldset>
        <fieldset><legend>Tema y paleta de La Mente</legend>
          <label>Tema
            <select value={lmTema} data-prueba="lm-tema" onChange={(e) => {
              const v = e.target.value as TemaLaMente | "";
              transicionVista(() => {
                setLmTema(v);
                if (v) { setLmPaleta(TEMAS_LAMENTE[v].paleta); usarEstilo(BASE_DE_TEMA[v], false); }
              });
            }}>
              <option value="">Sin La Mente (colores del estilo)</option>
              {TEMA_LAMENTE_IDS.map((x) => <option key={x} value={x}>{TEMAS_LAMENTE[x].nombre}</option>)}
            </select>
          </label>
          {lmTema && (
            <label>Paleta
              <select value={lmPaleta} onChange={(e) => setLmPaleta(e.target.value as PaletaLaMente)} data-prueba="lm-paleta">
                {PALETA_LAMENTE_IDS.map((x) => <option key={x} value={x}>{PALETAS_LAMENTE[x].nombre}{TEMAS_LAMENTE[lmTema].paleta === x ? " ★" : ""}</option>)}
              </select>
            </label>
          )}
          <small>{lmTema
            ? `Colores de la paleta y letra del tema, como la página de La Mente. El estilo de abajo pone las formas y los efectos (para este tema se propone ${ESTILOS[BASE_DE_TEMA[lmTema]].nombre}). El tema y la paleta son de la página: no van en la receta.`
            : "Elige un tema para ver el encabezado como parte de una página de La Mente."}</small>
        </fieldset>
        <fieldset><legend>Estilo</legend>
          <div className="estudio-chips">{ESTILO_IDS.map((e) => <button key={e} aria-pressed={estilo === e} onClick={() => usarEstilo(e)}>{ESTILOS[e].nombre}</button>)}</div>
        </fieldset>
        <label>Composición
          <select value={composicion} onChange={(e) => { setComposicion(e.target.value as ComposicionId); otra(); }} data-prueba="composicion">
            {COMPOSICION_IDS.map((c) => <option key={c} value={c}>{COMPOSICIONES[c].nombre}{COMPOSICIONES[c].estilos.includes(estilo) ? " ★" : ""}</option>)}
          </select>
          <small>{COMPOSICIONES[composicion].descripcion}</small>
        </label>
        <label>Entrada
          <select value={entrada} onChange={(e) => { setEntrada(e.target.value as EntradaId); otra(); }} data-prueba="entrada">{ENTRADA_IDS.map((x) => <option key={x} value={x}>{ENTRADAS[x]}</option>)}</select>
        </label>
        <label>Texto animado
          <select value={efectoTexto} onChange={(e) => { setEfectoTexto(e.target.value as TextoEfecto); otra(); }}>{TEXTOS.map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <label>Fondo animado
          <select value={efecto} onChange={(e) => setEfecto(e.target.value as EfectoId | "")} data-prueba="efecto">
            <option value="">Ninguno</option>
            {(Object.keys(EFECTOS) as EfectoId[]).map((id) => <option key={id} value={id}>{EFECTOS[id].nombre}{ESTILOS[estilo].efectos.includes(id) ? " ★" : ""}</option>)}
          </select>
        </label>
        <label>Variante del fondo
          <select value={variante} onChange={(e) => setVariante(Number(e.target.value) as Variante)}>{[1, 2, 3].map((v) => <option key={v}>{v}</option>)}</select>
        </label>
        <label>Pack de botones
          <select value={pack} onChange={(e) => setPack(e.target.value as PackBotonId)} data-prueba="pack">{PACK_IDS.map((p) => <option key={p} value={p}>{PACKS_BOTONES[p].nombre}{ESTILOS[estilo].pack === p ? " ★" : ""}</option>)}</select>
        </label>
        {campo("antetitulo", "Antetítulo")}
        {campo("titulo", "Título", "Pon una palabra entre *asteriscos* para resaltarla.")}
        {campo("bajada", "Bajada")}
        {campo("boton", "Botón principal")}
        {campo("secundario", "Botón secundario")}
        {campo("datos", "Datos (separados por coma)")}
        <fieldset><legend>Tamaño</legend>
          <label>Alto
            <select value={typeof alto === "number" ? "numero" : alto} onChange={(e) => elegirAlto(e.target.value, setAlto)} data-prueba="alto">
              {ALTO_IDS.map((a) => <option key={a} value={a}>{ALTOS[a].nombre}</option>)}
              <option value="numero">A medida</option>
            </select>
          </label>
          {typeof alto === "number" && (
            <label>{alto} % del alto de la pantalla
              <input type="range" min={20} max={100} value={alto} onChange={(e) => setAlto(Number(e.target.value))} data-prueba="alto-numero" />
            </label>
          )}
          <label>Alto en celular
            <select value={altoCelular === "" ? "" : typeof altoCelular === "number" ? "numero" : altoCelular} onChange={(e) => (e.target.value === "" ? setAltoCelular("") : elegirAlto(e.target.value, setAltoCelular))} data-prueba="alto-celular">
              <option value="">Igual que en escritorio</option>
              {ALTO_IDS.map((a) => <option key={a} value={a}>{ALTOS[a].nombre}</option>)}
              <option value="numero">A medida</option>
            </select>
          </label>
          {typeof altoCelular === "number" && (
            <label>{altoCelular} % en celular
              <input type="range" min={20} max={100} value={altoCelular} onChange={(e) => setAltoCelular(Number(e.target.value))} />
            </label>
          )}
        </fieldset>
        <fieldset><legend>Película</legend>
          <label className="estudio-check"><input type="checkbox" checked={apertura} onChange={(e) => { setApertura(e.target.checked); olvidarApertura(); otra(); }} data-prueba="apertura" /> Apertura (franjas, «presenta» y el título)</label>
          <label>Presenta
            <input value={presenta} onChange={(e) => setPresenta(e.target.value)} placeholder="Café Vinilo presenta" data-prueba="presenta" />
          </label>
          <button className="enc-repetir" onClick={() => { olvidarApertura(); otra(); }} data-prueba="apertura-otra-vez">↻ Ver la apertura otra vez</button>
          <label className="estudio-check"><input type="checkbox" checked={fotosEjemplo} onChange={(e) => setFotosEjemplo(e.target.checked)} data-prueba="fotos-ejemplo" /> Fotos de ejemplo (tres)</label>
          <label className="estudio-check"><input type="checkbox" checked={tomas} onChange={(e) => setTomas(e.target.checked)} data-prueba="tomas" /> Varias tomas (necesita dos o más fotos)</label>
          <label>Nombre del negocio (para la barra al bajar)
            <input value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} placeholder="Café Vinilo" data-prueba="nombre" />
          </label>
          <label className="estudio-check"><input type="checkbox" checked={barraPropia} onChange={(e) => setBarraPropia(e.target.checked)} data-prueba="barra-propia" /> La página ya tiene su barra (como La Mente)</label>
          <label>Estado del negocio (datos de ejemplo)
            <select value={estadoDemo} onChange={(e) => setEstadoDemo(e.target.value as keyof typeof ESTADOS_DEMO | "")} data-prueba="estado">
              <option value="">No mostrar</option>
              <option value="abierto">Abierto, cierra a las 22:00</option>
              <option value="cerrado">Cerrado, abre el lunes</option>
              <option value="proxima">Abierto y próxima hora libre</option>
            </select>
          </label>
          <label className="estudio-check"><input type="checkbox" checked={fotoLetras} onChange={(e) => setFotoLetras(e.target.checked)} data-prueba="foto-letras" /> La foto dentro de las letras del título</label>
          <label>Tratamiento de la foto
            <select value={tratamiento} onChange={(e) => setTratamiento(e.target.value as Tratamiento | "")} data-prueba="tratamiento">
              <option value="">Sin tratamiento</option>
              <option value="duotono">Duotono con el acento</option>
              <option value="grano">Grano de película</option>
              <option value="trama">Trama de puntos</option>
              <option value="bn">Blanco y negro</option>
            </select>
          </label>
          <label>Hora del día
            <select value={horaDemo} onChange={(e) => setHoraDemo(e.target.value as typeof horaDemo)} data-prueba="hora">
              <option value="">Apagada</option>
              <option value="auto">Según la hora del teléfono</option>
              <option value="manana">Ver como mañana</option>
              <option value="tarde">Ver como tarde</option>
              <option value="noche">Ver como noche</option>
            </select>
          </label>
          <label>Palabras que rotan (en la palabra resaltada, separadas por coma)
            <input value={palabras} onChange={(e) => setPalabras(e.target.value)} placeholder="barrio, autor" data-prueba="palabras" />
          </label>
        </fieldset>
        <fieldset><legend>Escena</legend>
          <label className="estudio-check"><input type="checkbox" checked={profundidad} onChange={(e) => setProfundidad(e.target.checked)} data-prueba="profundidad" /> Capas en profundidad (2.5D)</label>
          <label>Luz
            <select value={luz} onChange={(e) => setLuz(e.target.value as ModoLuz | "")} data-prueba="luz">
              <option value="">Sin luz</option>
              <option value="puntero">Sigue al dedo</option>
              <option value="barrido">Brillo que cruza</option>
            </select>
          </label>
          <label>Se mueve con
            <select value={mover} onChange={(e) => setMover(e.target.value)}>
              <option value="puntero,scroll">Dedo o cursor y scroll</option>
              <option value="puntero">Solo dedo o cursor</option>
              <option value="scroll">Solo scroll</option>
              <option value="puntero,scroll,inclinacion">También inclinar el teléfono</option>
            </select>
          </label>
          <label>Fondo WebGL
            <select value={shader} onChange={(e) => setShader(e.target.value as ShaderId | "")} data-prueba="shader">
              <option value="">Ninguno</option>
              {SHADER_IDS.map((x) => <option key={x} value={x}>{SHADERS[x].nombre}</option>)}
            </select>
            {shader && <small>{SHADERS[shader].descripcion} Pesa menos de 10 KB. Mejor sin «Fondo animado» al mismo tiempo.</small>}
          </label>
          <label>Objeto 3D
            <select value={forma} onChange={(e) => setForma(e.target.value as FormaObjeto | "")} data-prueba="objeto">
              <option value="">Ninguno</option>
              {(Object.keys(FORMAS_OBJETO) as FormaObjeto[]).map((x) => <option key={x} value={x}>{FORMAS_OBJETO[x]}</option>)}
            </select>
            <small>Usa la foto propia como etiqueta o cara. En «Dividido» va en el lugar de la foto. Se gira arrastrando.</small>
          </label>
          <label>Al bajar
            <select value={salida} onChange={(e) => setSalida(e.target.value as SalidaEncabezado)} data-prueba="salida">
              {SALIDA_IDS.map((x) => <option key={x} value={x}>{SALIDAS[x]}</option>)}
            </select>
          </label>
          <label>Ahorro de datos
            <select value={ahorro} onChange={(e) => setAhorro(e.target.value as ModoAhorro)} data-prueba="ahorro">
              <option value="auto">Automático (según el teléfono)</option>
              <option value="siempre">Siempre quieto (probar cómo se ve)</option>
              <option value="nunca">Nunca (todo animado)</option>
            </select>
          </label>
          <label>Foto propia (para ver cuánto pesa)
            <input type="file" accept="image/*" onChange={(e) => { setArchivoFoto(e.target.files?.[0] ?? null); setInfoColores(""); subirFoto(e.target.files?.[0]); }} data-prueba="foto" />
            <small>Se usa en las composiciones con foto (dividido, tarjeta, foto completa, viñetas) y en el objeto 3D.</small>
          </label>
          {archivoFoto && <button className="enc-repetir" onClick={usarColoresDeFoto} data-prueba="colores-foto">🎨 Usar colores de la foto (tema y paleta de La Mente)</button>}
          {infoColores && <small data-prueba="info-colores">{infoColores}</small>}
          <label className="estudio-check"><input type="checkbox" checked={comprimir} onChange={(e) => setComprimir(e.target.checked)} data-prueba="comprimir" /> Comprimir al subir (WebP bajo 200 KB; 100 KB en celular)</label>
          {infoFoto && <small data-prueba="info-foto">{infoFoto}</small>}
        </fieldset>
        <MedidorPeso objetivo={vista} data-prueba="peso" />
        <MedidorFluidez nivel={nivel} data-prueba="fluidez" />
        <MedidorCarga data-prueba="carga" />
        <SemaforoContraste objetivo={vista} data-prueba="contraste" />
        <fieldset className="enc-qr"><legend>Probar en tu teléfono</legend>
          <CodigoQR texto={enlace.url} tam={168} data-prueba="qr" />
          <small>{enlace.nota}</small>
          <a href={enlace.url} target="_blank" rel="noreferrer" data-prueba="enlace-vista">Abrir la vista aquí</a>
        </fieldset>
        <label className="estudio-check"><input type="checkbox" checked={celular} onChange={(e) => setCelular(e.target.checked)} /> Ver como celular</label>
        <details><summary>Lo que se guarda (receta, JSON)</summary>
          {!resultado.ok && (
            <ul className="enc-errores" data-prueba="errores">
              {resultado.errores.map((e) => <li key={e.campo + e.mensaje}><b>{e.campo}</b>: {e.mensaje}</li>)}
            </ul>
          )}
          {resultado.ok && resultado.avisos.length > 0 && (
            <ul className="enc-avisos" data-prueba="avisos">{resultado.avisos.map((a) => <li key={a}>{a}</li>)}</ul>
          )}
          {forma && foto && <small>Las caras del objeto con tu foto se ven aquí; en la receta va la forma y el texto.</small>}
          {foto && <small>La foto propia no va en la receta: en La Mente se sube y queda su key de S3.</small>}
          <pre data-prueba="json" data-valida={resultado.ok ? "" : undefined}>{JSON.stringify(resultado.ok ? resultado.receta : cruda, null, 2)}</pre>
        </details>
        <fieldset className="enc-bib"><legend>Biblioteca</legend>
          <label>Nombre del diseño<input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} placeholder="Ej.: Café Italia, versión noche" data-prueba="bib-nombre" /></label>
          <label>Etiquetas (separadas por coma)<input value={etiquetas} onChange={(e) => setEtiquetas(e.target.value)} placeholder="oscuro, navidad" data-prueba="bib-etiquetas" /></label>
          <small>Se guarda con el rubro de arriba ({RUBROS[rubro].nombre}){lmTema ? " y el tema y la paleta de La Mente elegidos" : ""}.</small>
          <div className="enc-acciones">
            <button onClick={() => guardarEnBiblioteca(false)} disabled={!resultado.ok || !nombre.trim()} data-prueba="bib-guardar">{abierto ? "Guardar cambios" : "Guardar en la biblioteca"}</button>
            {abierto && <button onClick={() => guardarEnBiblioteca(true)} disabled={!resultado.ok || !nombre.trim()} data-prueba="bib-guardar-nuevo">Guardar como nuevo</button>}
          </div>
          {avisoBib && <small role="status" data-prueba="bib-aviso">{avisoBib}</small>}
          <a href="#biblioteca">Ver la biblioteca →</a>
        </fieldset>
      </aside>
      <main className="enc-vista">
        <div className={celular ? "enc-celular" : "enc-ancho"} ref={vista}>
          <Marco key={`${lmTema}-${lmPaleta}`} tema={lmTema} paleta={lmPaleta} estilo={estilo}>
            {/* La vista sale de la receta validada: lo que se ve es lo que se guarda (más shader, objeto y foto local). */}
            <Encabezado key={n} {...props} boton={props.boton && { ...props.boton, href: "#encabezados" }} botonSecundario={props.botonSecundario && { ...props.botonSecundario, href: "#encabezados" }}
              imagenes={foto ? [foto, foto, foto] : props.imagenes} shader={shader || undefined} objeto={objeto} alCambiarNivel={setNivel}
              barraPropia={barraPropia} estadoNegocio={estadoDemo ? ESTADOS_DEMO[estadoDemo] : undefined}
              ahora={horaDemo && horaDemo !== "auto" ? HORAS_DEMO[horaDemo] : undefined} />
          </Marco>
        </div>
        <h2 className="enc-galeria-titulo">Las 12 composiciones</h2>
        {COMPOSICION_IDS.map((c) => {
          const e = COMPOSICIONES[c].estilos[0];
          return (
            <section key={c} className="enc-muestra" data-muestra={c}>
              <div className="enc-etiqueta">{COMPOSICIONES[c].nombre} · {ESTILOS[e].nombre}</div>
              <Estilo nombre={e}>
                <Encabezado composicion={c} entrada="ninguna" alto="medio" efecto={ESTILOS[e].efectos[0]} antetitulo={EJEMPLO.antetitulo}
                  titulo={EJEMPLO.titulo} bajada={EJEMPLO.bajada} boton={{ texto: EJEMPLO.boton, href: "#" }} botonSecundario={{ texto: EJEMPLO.secundario, href: "#" }} datos={datos} />
              </Estilo>
            </section>
          );
        })}
      </main>
    </div>
  );
}

/** Con tema de La Mente, el encabezado se viste con su paleta y su letra; si no, con los colores del estilo. */
function Marco({ tema, paleta, estilo, children }: { tema: TemaLaMente | ""; paleta: PaletaLaMente; estilo: EstiloId; children: ReactNode }) {
  return tema
    ? <EstiloLaMente tema={tema} paleta={paleta} base={estilo} fuentes cursor data-prueba="vista" data-lm-paleta={paleta}>{children}</EstiloLaMente>
    : <Estilo nombre={estilo} fuentes cursor data-prueba="vista">{children}</Estilo>;
}
