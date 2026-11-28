// Cargando: mientras llega lo que se pidió, un esqueleto con la forma de lo que viene (fila, tarjeta, tabla…) en vez de
// una rueda. No parpadea en cargas cortas y, una vez que el contenido se vio, refrescar no lo vuelve a tapar.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Skeleton } from "../components/Skeleton";
import { ESPERA, MINIMO, fase as faseDe, type FormaCarga } from "./carga";

export type { FormaCarga };

export interface CargandoProps {
  /** Ya llegó lo que se pidió. */
  listo: boolean;
  /** La forma del esqueleto: `texto`, `fila`, `tarjeta`, `tabla` o `foto`. */
  forma?: FormaCarga;
  /** Cuántas veces se repite la forma (renglones, filas, tarjetas). */
  cuantos?: number;
  /** Lo que se anuncia al lector de pantalla mientras carga. */
  etiqueta?: string;
  children: ReactNode;
}

const LARGOS = ["100%", "92%", "76%", "85%"];

/** Una forma del esqueleto. */
function Forma({ forma, i }: { forma: FormaCarga; i: number }) {
  const renglon = (ancho: string, alto = 12) => <Skeleton height={alto} width={ancho} />;
  if (forma === "texto") return renglon(LARGOS[i % LARGOS.length], 14);
  const foto = <Skeleton height="auto" style={{ aspectRatio: "16 / 9" }} radius={12} />;
  if (forma === "foto") return foto;
  if (forma === "fila")
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Skeleton width={40} height={40} radius={999} />
        <div style={{ flex: 1, display: "grid", gap: 8 }}>
          {renglon("60%", 13)}
          {renglon("38%", 11)}
        </div>
      </div>
    );
  if (forma === "tarjeta")
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {foto}
        {renglon("70%", 14)}
        {renglon("45%")}
      </div>
    );
  // tabla: cada repetición es una fila de cuatro celdas (la primera, el encabezado, más alta).
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
      {[0, 1, 2, 3].map((c) => (
        <Skeleton key={c} height={i === 0 ? 14 : 12} width={c === 0 ? "80%" : "60%"} />
      ))}
    </div>
  );
}

/**
 * `<Cargando listo={!!datos} forma="tabla" cuantos={5}>{contenido}</Cargando>`: el esqueleto aparece si la carga pasa
 * de 150 ms, dura al menos 300 ms y cambia al contenido con un fundido.
 */
export function Cargando({ listo, forma = "fila", cuantos = 3, etiqueta = "Cargando…", children }: CargandoProps) {
  const t0 = useRef(performance.now());
  const tiempos = useRef<{ listoEn: number | null; esqueletoDesde: number | null; yaMostro: boolean }>({ listoEn: null, esqueletoDesde: null, yaMostro: listo });
  const [fase, setFase] = useState<"nada" | "esqueleto" | "contenido">(listo ? "contenido" : "nada");
  const venia = useRef(false);
  const contenido = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = tiempos.current;
    const ahora = () => performance.now() - t0.current;
    if (listo && t.listoEn === null) t.listoEn = ahora();
    if (!listo && !t.yaMostro) t.listoEn = null;
    const decidir = () => {
      const f = faseDe({ ahora: ahora(), ...t });
      if (f === "esqueleto" && t.esqueletoDesde === null) t.esqueletoDesde = ahora();
      if (f === "contenido") {
        venia.current = t.esqueletoDesde !== null && !t.yaMostro;
        t.yaMostro = true;
      }
      setFase(f);
      return f;
    };
    const f = decidir();
    if (f === "contenido") return;
    // Lo que falta para el próximo cambio: que aparezca el esqueleto, o que cumpla su mínimo.
    const espera = f === "nada" ? ESPERA - ahora() : t.listoEn !== null ? (t.esqueletoDesde ?? 0) + MINIMO - ahora() : -1;
    if (espera < 0) return;
    const reloj = setTimeout(decidir, Math.max(0, espera) + 1);
    return () => clearTimeout(reloj);
  }, [listo]);

  // Del esqueleto al contenido, un fundido (corto: también con «reducir movimiento»).
  useEffect(() => {
    if (fase === "contenido" && venia.current) {
      venia.current = false;
      // Un fundido corto y fijo: no se mueve nada, así que no sigue el ritmo del tema.
      contenido.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    }
  }, [fase]);

  if (fase === "contenido") return <div ref={contenido}>{children}</div>;
  return (
    <div aria-busy="true">
      <span style={{ position: "absolute", clipPath: "inset(50%)" }}>{etiqueta}</span>
      {fase === "esqueleto" && (
        <div data-mk-esqueleto={forma} style={{ display: "grid", gap: forma === "texto" ? 10 : 16 }}>
          {Array.from({ length: Math.max(1, cuantos | 0) + (forma === "tabla" ? 1 : 0) }, (_, i) => (
            <Forma key={i} forma={forma} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}
