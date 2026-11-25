import { useEffect, useRef, useState, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { hayQueAhorrar, senalesAhorro, useModoAhorro } from "../escena/nivel";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";
import { RANGO, REPOSO, limpiarLuz, luzDeLaHora, type Punto } from "./calculo-luz";
import { CSS_LUZ } from "./css";
import { FUENTES, hayQuePedirInclinacion, pedirInclinacion, seguirLuz, type FuenteLuz, type Seguidor } from "./seguir-luz";

export interface LuzProps extends HTMLAttributes<HTMLElement> {
  /** Qué mueve a la luz. Por defecto, el cursor (o el dedo) y el scroll. «inclinacion»: el teléfono. «hora»: la del reloj. */
  sigue?: FuenteLuz[];
  /** Cuánto se aparta de su reposo, de 0 a 1. Por defecto 0,35: con eso ninguna sombra cambia de lado. */
  rango?: number;
  /** De dónde viene en reposo (cada eje de -1 a 1). Por defecto, de arriba a la izquierda. */
  desde?: Punto;
  /** La etiqueta que dibuja. Por defecto, `div`. */
  como?: ElementType;
  children?: ReactNode;
}

const POR_DEFECTO: FuenteLuz[] = ["puntero", "scroll"];
/** Cada cuánto se vuelve a mirar la hora (ms). */
const CADA = 600_000;

/**
 * Una sola luz para lo que tiene adentro: todas las sombras caen hacia el mismo lado y los brillos se corren cuando
 * la persona mueve el cursor, el dedo o la página. Deja la luz en variables CSS de su raíz: `--mk-l0x` y `--mk-l0y`
 * (en reposo), `--mk-lx` y `--mk-ly` (ahora). Con «reducir movimiento» o ahorro de datos, la luz queda fija.
 */
export function Luz({ sigue = POR_DEFECTO, rango = RANGO, desde, como: Como = "div", style, children, ...resto }: LuzProps) {
  useStyles("luz", CSS_LUZ);
  const ref = useRef<HTMLElement>(null);
  const reducido = useReducedMotion();
  const ahorro = useModoAhorro();
  const clave = [...new Set((Array.isArray(sigue) ? sigue : POR_DEFECTO).filter((f) => FUENTES.includes(f)))].sort().join(",");
  const conHora = clave.split(",").includes("hora");

  // La hora se mira después de montar: el primer dibujo es igual en el servidor y en el navegador.
  const [hora, setHora] = useState<ReturnType<typeof luzDeLaHora> | null>(null);
  useEffect(() => {
    if (!conHora) return setHora(null);
    const mirar = () => setHora(luzDeLaHora(new Date()));
    mirar();
    const id = setInterval(mirar, CADA);
    return () => clearInterval(id);
  }, [conHora]);

  // `desde` manda sobre la dirección; el tinte y la fuerza son de la hora.
  const reposo = limpiarLuz(desde, hora ?? REPOSO);
  const ahora = useRef({ reposo, rango });
  ahora.current = { reposo, rango };
  const seguidor = useRef<Seguidor | null>(null);
  const fija = reducido || ahorro;

  useEffect(() => {
    const el = ref.current;
    const mueven = new Set(clave.split(",").filter((f) => f && f !== "hora") as FuenteLuz[]);
    // Se mira de nuevo aquí: los avisos de «reducir movimiento» y de ahorro llegan un dibujo después de montar, y
    // sin esto la luz alcanzaría a moverse una vez antes de quedarse quieta.
    const quieta = fija || (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) || hayQueAhorrar(senalesAhorro());
    if (!el || quieta || !mueven.size) return;
    const s = seguirLuz(el, { sigue: mueven, reposo: () => ahora.current.reposo, rango: () => ahora.current.rango });
    seguidor.current = s;
    return () => {
      s.soltar();
      seguidor.current = null;
    };
  }, [clave, fija]);
  useEffect(() => seguidor.current?.refrescar(), [reposo.x, reposo.y, rango]);

  const conScroll = !fija && clave.split(",").includes("scroll");
  const variables = {
    "--mk-l0x": reposo.x,
    "--mk-l0y": reposo.y,
    // Mientras nadie la mueve, la luz de ahora es la del reposo. El seguidor escribe encima.
    "--mk-lx": "var(--mk-l0x)",
    "--mk-ly": "var(--mk-l0y)",
    // Van siempre: así una luz adentro de otra no hereda el tinte ni la fuerza de la de afuera.
    "--mk-luz-tinte": hora?.tinte ?? "#fff",
    "--mk-luz-fuerza": hora?.fuerza ?? 1,
    // Cuánto corre el scroll la luz de cada superficie según por dónde va en la pantalla (lo usa el CSS de `Materia`),
    // y hasta dónde: una luz que viene de arriba no llega a venir de abajo.
    "--mk-lz-paso": conScroll && typeof rango === "number" && Number.isFinite(rango) ? Math.max(0, Math.min(1, rango)) : conScroll ? RANGO : 0,
    "--mk-lz-tope": reposo.y <= -0.05 ? -0.05 : 1,
  } as CSSProperties;
  return (
    <Como {...resto} ref={ref} data-mk-luz="" style={{ ...variables, ...style }}>
      {children}
    </Como>
  );
}

/**
 * Para la inclinación del teléfono en iPhone, que exige un permiso: `hacePedir` dice si hay que mostrar un botón, y
 * `pedir` se llama desde ese botón. En Android y en escritorio `hacePedir` es siempre `false`.
 */
export function usePermisoInclinacion(): { hacePedir: boolean; pedir: () => Promise<boolean> } {
  const [hacePedir, setHacePedir] = useState(false);
  useEffect(() => setHacePedir(hayQuePedirInclinacion()), []);
  return {
    hacePedir,
    pedir: async () => {
      const ok = await pedirInclinacion();
      setHacePedir(hayQuePedirInclinacion());
      return ok;
    },
  };
}
