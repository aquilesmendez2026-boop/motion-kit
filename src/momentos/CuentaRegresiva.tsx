// Eventos: cuenta regresiva al próximo evento con cifras que se voltean. Corre solo con el bloque a la vista y la
// pestaña visible; para lectores de pantalla, un texto que cambia una vez por minuto.
import { useCallback, useEffect, useRef, useState } from "react";
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { faltaPara } from "./calculos";

export interface CuentaRegresivaProps extends ComunesMomento {
  titulo: string;
  /** YYYY-MM-DD, en la hora del negocio. */
  fecha: string;
  /** HH:MM. */
  hora: string;
  /** Zona del negocio. Por defecto, Chile. */
  zona?: string;
  /** Reloj (pruebas y vitrina). */
  ahora?: () => Date;
}

export const CSS_CUENTA =
  ".mk-m-cuenta{container-type:inline-size}" +
  ".mk-m-cuenta-titulo{margin:0 0 .6rem;font-weight:700;font-size:1.1rem}" +
  ".mk-m-cuenta-cifras{display:flex;gap:10px;flex-wrap:wrap}" +
  ".mk-m-cuenta-grupo{display:grid;justify-items:center;gap:4px;font-size:.75rem;color:var(--mk-m-suave);text-transform:uppercase;letter-spacing:.06em}" +
  ".mk-m-cuenta-par{display:flex;gap:3px;perspective:300px}" +
  ".mk-m-cifra{position:relative;display:grid;place-items:center;width:1.25em;height:1.6em;border-radius:8px;font-size:clamp(1.1rem,8cqi,1.9rem);font-weight:800;" +
  "font-variant-numeric:tabular-nums;color:var(--mk-m-sobre);background:var(--mk-m-acento);transform-origin:50% 0;backface-visibility:hidden}" +
  ".mk-m-cifra::after{content:\"\";position:absolute;left:0;right:0;top:50%;height:1px;background:color-mix(in srgb,var(--mk-m-sobre) 30%,transparent)}" +
  ".mk-m-cuenta[data-activo][data-nivel=completo] .mk-m-cifra{animation:mk-m-voltea .45s var(--mk-resorte-curva) both}" +
  ".mk-m-cuenta[data-activo][data-nivel=liviano] .mk-m-cifra{animation:mk-m-aparece .3s ease-out both}" +
  "@keyframes mk-m-voltea{from{transform:rotateX(-90deg)}to{transform:none}}" +
  "@keyframes mk-m-aparece{from{opacity:.3}to{opacity:1}}" +
  ".mk-m-cuenta-texto{margin:0;font-size:1.25rem;font-weight:700}";

const relojDe = () => new Date();
const dos = (n: number) => String(n).padStart(2, "0");

/** Si el bloque está a la vista ahora (no solo la primera vez) y la pestaña visible. */
function useCorriendo(el: Element | null): { corriendo: boolean; visible: boolean } {
  const [aVista, setAVista] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setAVista(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  useEffect(() => {
    const ver = () => setVisible(document.visibilityState === "visible");
    ver();
    document.addEventListener("visibilitychange", ver);
    return () => document.removeEventListener("visibilitychange", ver);
  }, []);
  return { corriendo: aVista && visible, visible };
}

export function CuentaRegresiva({ titulo, fecha, hora, zona = "America/Santiago", ahora = relojDe, nivel: forzado, ahorro, className }: CuentaRegresivaProps) {
  useStyles("momento-cuenta", CSS_CUENTA);
  const { ref, nivel, activo } = useMomento<HTMLDivElement>({ nivel: forzado, ahorro });
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const { corriendo, visible } = useCorriendo(el);
  const pegar = useCallback(
    (n: HTMLDivElement | null) => {
      ref(n);
      setEl(n);
    },
    [ref],
  );
  const reloj = useRef(ahora);
  reloj.current = ahora;
  const [t, setT] = useState(() => ahora().getTime());
  // Cada segundo con el bloque a la vista; si no, cada minuto (para el texto). Nada con la pestaña oculta.
  const cada = nivel !== "quieto" && corriendo ? 1000 : 60000;
  useEffect(() => {
    if (!visible) return;
    setT(reloj.current().getTime());
    const id = window.setInterval(() => setT(reloj.current().getTime()), cada);
    return () => window.clearInterval(id);
  }, [cada, visible]);

  const f = faltaPara(fecha, hora, zona, new Date(t));
  if (f.estado === "invalida") return null;
  // El texto para lectores cambia una vez por minuto, no cada segundo.
  const texto = faltaPara(fecha, hora, zona, new Date(Math.floor(t / 60000) * 60000)).texto;
  const conCifras = f.estado === "falta" && nivel !== "quieto";
  const grupos: [string, string][] = [
    ...(f.dias > 0 ? [[String(Math.min(999, f.dias)).padStart(2, "0"), f.dias === 1 ? "día" : "días"] as [string, string]] : []),
    [dos(f.horas), "horas"],
    [dos(f.minutos), "min"],
    [dos(f.segundos), "seg"],
  ];
  return (
    <div
      ref={pegar}
      className={["mk-momento mk-m-cuenta", className].filter(Boolean).join(" ")}
      data-momento="cuenta"
      data-nivel={nivel}
      data-activo={activo ? "" : undefined}
    >
      <p className="mk-m-cuenta-titulo">{titulo}</p>
      {conCifras && (
        <div className="mk-m-cuenta-cifras" aria-hidden="true">
          {grupos.map(([cifras, nombre]) => (
            <div key={nombre} className="mk-m-cuenta-grupo">
              <div className="mk-m-cuenta-par">
                {[...cifras].map((c, k) => <span key={`${k}-${c}`} className="mk-m-cifra">{c}</span>)}
              </div>
              {nombre}
            </div>
          ))}
        </div>
      )}
      <p className={conCifras ? "mk-m-lector" : "mk-m-cuenta-texto"}>{texto}</p>
    </div>
  );
}
