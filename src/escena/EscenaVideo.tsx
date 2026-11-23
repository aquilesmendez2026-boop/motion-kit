import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import { useStyles } from "../utils/styles";
import { CSS_ESCENA } from "./css";

export interface EscenaVideoProps extends HTMLAttributes<HTMLDivElement> {
  /** WebM VP9 con fondo transparente (Chrome, Firefox, Android). */
  webm?: string;
  /** MOV HEVC con fondo transparente, para Safari (iPhone y Mac). Se marca como QuickTime para que Chrome no lo tome. */
  hevc?: string;
  /** MP4 normal (sin transparencia), de respaldo o si el video no la necesita. */
  mp4?: string;
  /** Imagen fija: se ve al instante, mientras carga, con ahorro de datos y con movimiento reducido. */
  poster: string;
  alt?: string;
  /** Solo el póster (ahorro de datos o teléfono lento). */
  quieto?: boolean;
  bucle?: boolean;
  /** Cómo llena su caja. */
  ajuste?: "contain" | "cover";
}

/**
 * Un objeto real grabado o renderizado (taza humeando, zapatilla girando) con fondo transparente.
 * Primero se ve el póster; el video baja recién cuando la escena está por entrar en pantalla y se pausa al salir.
 * Recursos: Blender o After Effects → secuencia PNG con alfa → ffmpeg (`libvpx-vp9`, `yuva420p`) para `webm`, y HEVC con alfa de macOS (Finder o `avconvert`) para `hevc`.
 */
export function EscenaVideo({ webm, hevc, mp4, poster, alt = "", quieto = false, bucle = true, ajuste = "contain", className, ...resto }: EscenaVideoProps) {
  useStyles("escena", CSS_ESCENA);
  const caja = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [cargar, setCargar] = useState(false);
  const [listo, setListo] = useState(false);
  const [reducido, setReducido] = useState(false);

  useEffect(() => {
    if (typeof matchMedia === "function") setReducido(matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  const soloPoster = quieto || reducido || (!webm && !hevc && !mp4);

  useEffect(() => {
    const el = caja.current;
    if (!el || soloPoster) return;
    if (typeof IntersectionObserver === "undefined") {
      setCargar(true);
      return;
    }
    const cerca = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setCargar(true);
        cerca.disconnect();
      }
    }, { rootMargin: "200px" });
    cerca.observe(el);
    return () => cerca.disconnect();
  }, [soloPoster]);

  useEffect(() => {
    const el = caja.current;
    const v = video.current;
    if (!el || !v || !cargar) return;
    const vista = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    vista.observe(el);
    return () => vista.disconnect();
  }, [cargar]);

  return (
    <div {...resto} ref={caja} className={`mk-video${className ? " " + className : ""}`} data-ajuste={ajuste} data-listo={listo ? "" : undefined}>
      <img className="mk-video-poster" src={poster} alt={alt} decoding="async" />
      {cargar && !soloPoster && (
        <video ref={video} muted playsInline autoPlay loop={bucle} preload="auto" poster={poster} aria-hidden="true" onPlaying={() => setListo(true)}>
          {hevc && <source src={hevc} type='video/quicktime; codecs="hvc1"' />}
          {webm && <source src={webm} type="video/webm" />}
          {mp4 && <source src={mp4} type="video/mp4" />}
        </video>
      )}
    </div>
  );
}
