// SubirImagen: un recuadro para elegir una foto que muestra todo el viaje (vacía → arrastrando → subiendo → lista, o
// error). Quien la usa sube el archivo; la pieza lo revisa antes, lo muestra al tiro y cuenta cómo va.
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";
import { revisarArchivo } from "./archivo";
import { c, f, fuerza, tiempo } from "./tema";

export interface SubirImagenProps {
  /** Lo que es («Logo», «Foto de portada»): el título y el nombre para el lector de pantalla. */
  etiqueta: string;
  /** Una línea de ayuda bajo el recuadro (formatos, tamaño). */
  ayuda?: string;
  /** `redonda` (logo, 112 px), `cuadrada` (producto, 160 px) o `apaisada` (portada, 16:9 hasta 480 px). */
  forma?: "redonda" | "cuadrada" | "apaisada";
  /** La foto que ya está (su URL). */
  imagen?: string;
  /** Subiendo: `true` sin porcentaje, o el avance de 0 a 1. */
  subiendo?: boolean | number;
  /** El error de la subida (lo pone quien sube). Manda sobre el de la pieza mientras exista. */
  error?: string;
  /** Se llama solo con un archivo que cumple `aceptar` y `maxMB`. */
  alElegir: (archivo: File) => void;
  /** Si se pasa, aparece «Quitar» cuando hay foto. */
  alQuitar?: () => void;
  /** Los tipos aceptados, como el `accept` de un `<input>`. */
  aceptar?: string;
  /** El peso máximo, en MB. */
  maxMB?: number;
  deshabilitada?: boolean;
  textos?: Partial<{ elegir: string; arrastrar: string; cambiar: string; quitar: string; listo: string }>;
}

const TEXTOS = {
  elegir: "Arrastra una foto o toca para elegir",
  arrastrar: "Suelta la foto aquí",
  cambiar: "Cambiar",
  quitar: "Quitar",
  listo: "Foto lista",
};

/** Cuánto se ve el ✓ al terminar. */
const LISTO_MS = 800;

/** El CSS se arma al montarse la primera (no al cargar el módulo): así quien no la usa la puede descartar. */
let css: string | undefined;
const estilos = () => (css ??= `
.mk-subir{--t:${c("texto")};--b:${c("borde")};--a:${c("acento")};--u:${c("suave")};--m:${c("mal")};--s:${c("superficie")};--v:${c("bien")};
  display:flex;flex-direction:column;gap:8px;color:var(--t);font:inherit;min-width:0}
.mk-subir[data-forma=redonda]{display:grid;grid-template-columns:auto 1fr;column-gap:14px;align-items:center}
.mk-subir[data-forma=redonda]>.mk-subir-etiqueta{grid-column:1/-1}
.mk-subir-etiqueta{font-weight:600;font-size:.95rem}
.mk-subir-caja{position:relative;display:grid;place-items:center;overflow:hidden;box-sizing:border-box;cursor:pointer;
  border:1.5px dashed var(--b);background:color-mix(in srgb,var(--t) 3%,transparent);border-radius:${f("radioCampo", "14px")};
  transition:border-color .2s,background-color .2s}
.mk-subir[data-forma=redonda] .mk-subir-caja{width:112px;height:112px;border-radius:50%}
.mk-subir[data-forma=cuadrada] .mk-subir-caja{width:160px;height:160px}
.mk-subir[data-forma=apaisada] .mk-subir-caja{width:100%;max-width:480px;aspect-ratio:16/9}
.mk-subir-caja:focus-within{outline:2px solid var(--a);outline-offset:3px}
.mk-subir[data-estado=arrastrando] .mk-subir-caja{border-style:solid;border-color:var(--a);background:color-mix(in srgb,var(--a) 12%,transparent)}
.mk-subir[data-estado=error] .mk-subir-caja{border-color:var(--m)}
.mk-subir[data-estado=lista] .mk-subir-caja,.mk-subir[data-estado=subiendo] .mk-subir-caja{border-style:solid}
.mk-subir[aria-disabled=true] .mk-subir-caja{cursor:not-allowed;opacity:.55}
.mk-subir-input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.mk-subir-foto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .25s}
.mk-subir[data-estado=subiendo] .mk-subir-foto{opacity:.5}
.mk-subir-vacia{display:grid;justify-items:center;gap:6px;padding:10px;text-align:center;font-size:.85rem;line-height:1.3;color:var(--u)}
.mk-subir-vacia svg{width:28px;height:28px;color:var(--a)}
.mk-subir[data-forma=redonda] .mk-subir-vacia span{display:none}
.mk-subir-anillo{position:absolute;width:48px;height:48px}
.mk-subir-anillo[data-gira]{animation:mk-subir-gira 1s linear infinite}
.mk-subir-listo{position:absolute;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--v);color:#fff}
@media (prefers-reduced-motion:no-preference){.mk-subir-listo{animation:mk-subir-listo ${tiempo(360)} ease-out}}
@keyframes mk-subir-listo{0%{opacity:0;transform:scale(calc(1 - ${fuerza(0.6)}))}60%{opacity:1;transform:scale(calc(1 + ${fuerza(0.08)}))}}
.mk-subir-lado{display:grid;gap:6px;min-width:0}
.mk-subir-acciones{display:flex;gap:8px;flex-wrap:wrap}
.mk-subir-acciones button{font:inherit;font-size:.85rem;font-weight:600;min-height:44px;padding:0 12px;border-radius:${f("radioBoton", "9px")};cursor:pointer;
  border:${f("trazo", "1px solid var(--b)")};background:var(--s);color:var(--t)}
.mk-subir-acciones .mk-subir-quitar{color:var(--m)}
.mk-subir-ayuda,.mk-subir-pista{margin:0;font-size:.8rem;line-height:1.35;color:var(--u)}
.mk-subir-error{margin:0;font-size:.85rem;font-weight:600;color:var(--m)}
.mk-subir-oculto{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@keyframes mk-subir-gira{to{transform:rotate(1turn)}}`);

/** Una flecha que sube a una foto (ícono propio, sin librerías). */
const Icono = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="15" rx="3" />
    <path d="M3 16l5-5 4 4 3-3 6 6" />
    <path d="M17 2v6M14.5 4.5L17 2l2.5 2.5" />
  </svg>
);

/**
 * Elegir una foto, con arrastrar y soltar, la foto a la vista mientras sube, un anillo de avance, un ✓ al terminar y
 * los errores claros (pesa mucho, no es foto, falló la subida). Accesible con teclado y lector de pantalla.
 */
export function SubirImagen({
  etiqueta,
  ayuda,
  forma = "cuadrada",
  imagen,
  subiendo,
  error,
  alElegir,
  alQuitar,
  aceptar = "image/png,image/jpeg,image/webp",
  maxMB = 2,
  deshabilitada = false,
  textos,
}: SubirImagenProps) {
  useStyles("subir-imagen", estilos());
  const t = { ...TEXTOS, ...textos };
  const id = useId();
  const reducido = useReducedMotion();
  const input = useRef<HTMLInputElement>(null);
  const caja = useRef<HTMLLabelElement>(null);
  const [vista, setVista] = useState<{ url: string } | null>(null);
  const [errorPropio, setErrorPropio] = useState<string>();
  const [arrastrando, setArrastrando] = useState(false);
  const [listo, setListo] = useState(false);
  const [anuncio, setAnuncio] = useState("");
  const entradas = useRef(0);

  const estaSubiendo = subiendo !== undefined && subiendo !== false;
  const mensaje = error || errorPropio;
  const foto = vista?.url ?? imagen;
  const estado = arrastrando ? "arrastrando" : estaSubiendo ? "subiendo" : mensaje ? "error" : foto ? "lista" : "vacia";

  // La vista local (la última foto elegida) se suelta cuando llegaron las fotos de todas las subidas que se eligieron
  // (si se eligió otra mientras una subía, la que termina primero no es la elegida), si la subida falla y al desmontarse.
  const vistaRef = useRef(vista);
  vistaRef.current = vista;
  const pendientes = useRef(0);
  const soltarVista = () => {
    if (vistaRef.current) URL.revokeObjectURL(vistaRef.current.url);
    vistaRef.current = null;
    pendientes.current = 0;
    setVista(null);
  };
  useEffect(() => {
    if (vistaRef.current && --pendientes.current <= 0) soltarVista();
    // Solo cuando cambia la foto que manda quien sube.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagen]);
  useEffect(() => {
    if (error && vistaRef.current) soltarVista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);
  const relojListo = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => {
    clearTimeout(relojListo.current);
    if (vistaRef.current) URL.revokeObjectURL(vistaRef.current.url);
  }, []);

  // El ✓: cuando deja de subir sin error.
  const subiaAntes = useRef(estaSubiendo);
  useEffect(() => {
    const subia = subiaAntes.current;
    subiaAntes.current = estaSubiendo;
    // Si llega un error (p. ej. la foto subió pero no se pudo guardar), el ✓ se apaga.
    if (error) {
      clearTimeout(relojListo.current);
      setListo(false);
      setAnuncio("");
      return;
    }
    if (!subia || estaSubiendo) return;
    setListo(true);
    setAnuncio(t.listo);
    clearTimeout(relojListo.current);
    relojListo.current = setTimeout(() => setListo(false), LISTO_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estaSubiendo, error]);

  // El ✓ entra con un pequeño salto: lo hace el CSS al aparecer (.mk-subir-listo), con el ritmo del tema.

  // La sacudida: una vez por cada mensaje de error nuevo.
  const ultimoMensaje = useRef<string | undefined>(undefined);
  useEffect(() => {
    const antes = ultimoMensaje.current;
    ultimoMensaje.current = mensaje;
    if (!mensaje || mensaje === antes || reducido) return;
    caja.current?.animate(
      [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "none" }],
      { duration: 300, easing: "ease-out" },
    );
  }, [mensaje, reducido]);

  const elegir = (archivo: File | undefined) => {
    if (!archivo || deshabilitada) return;
    const r = revisarArchivo(archivo, aceptar, maxMB);
    if (!r.ok) {
      setErrorPropio(r.mensaje);
      return;
    }
    setErrorPropio(undefined);
    setListo(false);
    setAnuncio("");
    if (vistaRef.current) URL.revokeObjectURL(vistaRef.current.url);
    const nueva = { url: URL.createObjectURL(archivo) };
    vistaRef.current = nueva;
    pendientes.current += 1;
    setVista(nueva);
    alElegir(archivo);
  };

  const conArchivos = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
  const alEntrar = (e: DragEvent) => {
    if (deshabilitada || !conArchivos(e)) return;
    e.preventDefault();
    entradas.current += 1;
    setArrastrando(true);
  };
  const alSalir = () => {
    entradas.current = Math.max(0, entradas.current - 1);
    if (entradas.current === 0) setArrastrando(false);
  };
  const alSoltar = (e: DragEvent) => {
    if (deshabilitada || !conArchivos(e)) return;
    e.preventDefault();
    entradas.current = 0;
    setArrastrando(false);
    elegir(e.dataTransfer.files?.[0]);
  };

  const avance = typeof subiendo === "number" ? Math.min(1, Math.max(0, Number.isFinite(subiendo) ? subiendo : 0)) : null;
  const idAyuda = `${id}-ayuda`;
  const conFoto = Boolean(foto) && !estaSubiendo;

  const lado = (
    <>
      {forma === "redonda" && !foto && !estaSubiendo && <p className="mk-subir-pista">{arrastrando ? t.arrastrar : t.elegir}</p>}
      {conFoto && (
        <div className="mk-subir-acciones">
          <button type="button" className="mk-subir-cambiar" disabled={deshabilitada} onClick={() => input.current?.click()}>
            {t.cambiar}
          </button>
          {alQuitar && (
            <button type="button" className="mk-subir-quitar" disabled={deshabilitada} onClick={() => { soltarVista(); setErrorPropio(undefined); setAnuncio(""); alQuitar(); }}>
              {t.quitar}
            </button>
          )}
        </div>
      )}
      {mensaje ? (
        <p className="mk-subir-error" role="alert" id={idAyuda}>{mensaje}</p>
      ) : (
        ayuda && <p className="mk-subir-ayuda" id={idAyuda}>{ayuda}</p>
      )}
    </>
  );

  return (
    <div className="mk-subir" data-estado={estado} data-forma={forma} aria-busy={estaSubiendo || undefined} aria-disabled={deshabilitada || undefined}>
      <span className="mk-subir-etiqueta">{etiqueta}</span>
      <label
        ref={caja}
        className="mk-subir-caja"
        onDragEnter={alEntrar}
        onDragOver={(e) => { if (!deshabilitada && conArchivos(e)) e.preventDefault(); }}
        onDragLeave={alSalir}
        onDrop={alSoltar}
      >
        <input
          ref={input}
          id={id}
          className="mk-subir-input"
          type="file"
          accept={aceptar}
          aria-label={etiqueta}
          aria-describedby={mensaje || ayuda ? idAyuda : undefined}
          disabled={deshabilitada}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            // Limpio: así la misma foto se puede volver a elegir.
            e.target.value = "";
            elegir(archivo);
          }}
        />
        {foto && <img className="mk-subir-foto" src={foto} alt="" />}
        {!foto && !estaSubiendo && (
          <span className="mk-subir-vacia">
            <Icono />
            <span>{arrastrando ? t.arrastrar : t.elegir}</span>
          </span>
        )}
        {estaSubiendo && (
          <svg className="mk-subir-anillo" viewBox="0 0 48 48" aria-hidden="true" data-gira={avance === null && !reducido ? "" : undefined}>
            <circle cx="24" cy="24" r="20" fill="none" stroke={c("superficie")} strokeOpacity=".85" strokeWidth="5" />
            <circle
              cx="24" cy="24" r="20" fill="none" stroke={c("acento")} strokeWidth="5" strokeLinecap="round" pathLength={1}
              strokeDasharray={avance === null ? "0.25 0.75" : "1 1"}
              strokeDashoffset={avance === null ? 0 : 1 - avance}
              transform="rotate(-90 24 24)"
            />
          </svg>
        )}
        {listo && (
          <span className="mk-subir-listo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        )}
      </label>
      {forma === "redonda" ? <div className="mk-subir-lado">{lado}</div> : lado}
      <span className="mk-subir-oculto" aria-live="polite">{anuncio}</span>
    </div>
  );
}
