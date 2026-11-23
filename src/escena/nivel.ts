import { useEffect, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * Cuánto se anima una escena:
 * - «completo»: todo (shader, video, capas, luz).
 * - «liviano»: el teléfono no da abasto; quedan capas y efectos CSS, sin shader, video ni luz.
 * - «quieto»: ahorro de datos, conexión lenta o movimiento reducido; solo la imagen fija y lo quieto.
 */
export type NivelEscena = "completo" | "liviano" | "quieto";
/** «auto» decide con las señales del teléfono; «siempre» fuerza el ahorro; «nunca» lo ignora. */
export type ModoAhorro = "auto" | "siempre" | "nunca";

interface Conexion extends EventTarget {
  saveData?: boolean;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
}

export interface SenalesAhorro {
  /** La persona activó «ahorro de datos» (Chrome en Android lo manda). */
  ahorroDatos: boolean;
  /** La conexión efectiva es 2G o 3G. */
  conexionLenta: boolean;
  /** El teléfono tiene 2 GB de memoria o menos. */
  pocaMemoria: boolean;
  /** Pidió reducir datos en el sistema (`prefers-reduced-data`, donde exista). */
  reducirDatos: boolean;
}

const conexion = (): Conexion | undefined => (typeof navigator !== "undefined" ? (navigator as Navigator & { connection?: Conexion }).connection : undefined);

/** Lo que el navegador dice del teléfono y la red. Safari y Firefox no informan conexión ni memoria: ahí queda todo en `false`. */
export function senalesAhorro(): SenalesAhorro {
  if (typeof navigator === "undefined") return { ahorroDatos: false, conexionLenta: false, pocaMemoria: false, reducirDatos: false };
  const c = conexion();
  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return {
    ahorroDatos: c?.saveData === true,
    conexionLenta: c?.effectiveType === "slow-2g" || c?.effectiveType === "2g" || c?.effectiveType === "3g",
    pocaMemoria: typeof memoria === "number" && memoria <= 2,
    reducirDatos: typeof matchMedia === "function" && matchMedia("(prefers-reduced-data: reduce)").matches,
  };
}

export const hayQueAhorrar = (s: SenalesAhorro) => s.ahorroDatos || s.conexionLenta || s.pocaMemoria || s.reducirDatos;

/** `true` si conviene mostrar solo lo quieto. Se actualiza si cambia la conexión. */
export function useModoAhorro(modo: ModoAhorro = "auto"): boolean {
  const [ahorrar, setAhorrar] = useState(modo === "siempre");
  useEffect(() => {
    if (modo !== "auto") {
      setAhorrar(modo === "siempre");
      return;
    }
    const revisar = () => setAhorrar(hayQueAhorrar(senalesAhorro()));
    revisar();
    const c = conexion();
    c?.addEventListener?.("change", revisar);
    return () => c?.removeEventListener?.("change", revisar);
  }, [modo]);
  return ahorrar;
}

export interface Fluidez {
  /** Cuadros por segundo medidos (mediana de cada segundo). `null` mientras mide. */
  fps: number | null;
  /** Menos de 40 cuadros por segundo: se nota trabado. */
  trabado: boolean;
}

/**
 * Mide la fluidez con requestAnimationFrame. Con `duracion` mide ese rato y para (lo que usa la escena para decidir
 * su nivel); sin `duracion`, mide siempre y se actualiza cada segundo (lo que usa el medidor del editor).
 */
export function useFluidez({ activo = true, duracion }: { activo?: boolean; duracion?: number } = {}): Fluidez {
  const [r, setR] = useState<Fluidez>({ fps: null, trabado: false });
  useEffect(() => {
    if (!activo || typeof requestAnimationFrame === "undefined") return;
    let cuadro = 0;
    let inicio = performance.now();
    let ventana = inicio;
    let n = 0;
    const muestras: number[] = [];
    const paso = (t: number) => {
      n++;
      if (t - ventana >= 1000) {
        // Una pestaña oculta pausa los cuadros: esa muestra no cuenta.
        if (document.visibilityState === "visible" && t - ventana < 2000) muestras.push((n * 1000) / (t - ventana));
        n = 0;
        ventana = t;
        if (muestras.length) {
          const orden = [...muestras.slice(-5)].sort((a, b) => a - b);
          const fps = Math.round(orden[Math.floor(orden.length / 2)]);
          setR({ fps, trabado: fps < 40 });
        }
        if (duracion !== undefined && t - inicio >= duracion) return;
      }
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame((t) => {
      inicio = ventana = t;
      cuadro = requestAnimationFrame(paso);
    });
    return () => cancelAnimationFrame(cuadro);
  }, [activo, duracion]);
  return r;
}

/** El nivel de la escena con el ahorro, el movimiento reducido y la fluidez de los primeros segundos. */
export function useNivelEscena({ ahorro = "auto", medirFluidez = true }: { ahorro?: ModoAhorro; medirFluidez?: boolean } = {}): NivelEscena {
  const reducido = useReducedMotion();
  const ahorrar = useModoAhorro(ahorro);
  const quieto = reducido || ahorrar;
  const { trabado } = useFluidez({ activo: medirFluidez && !quieto && ahorro !== "nunca", duracion: 4000 });
  if (quieto) return "quieto";
  return ahorro !== "nunca" && trabado ? "liviano" : "completo";
}
