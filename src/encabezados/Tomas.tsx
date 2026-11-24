import { useEffect, useState } from "react";

/**
 * Varias tomas: las fotos se suceden cada 5 s con un fundido y un acercamiento lento. Quieta (liviano, quieto o una sola
 * foto), queda la primera. No avanza con la pestaña escondida. Con `activa`, la toma la decide quien la usa (la foto
 * viva, que cambia con un borde líquido) y aquí no corre ningún reloj.
 */
export function Tomas({ fotos, alt, quieto, activa: dada }: { fotos: string[]; alt: string; quieto: boolean; activa?: number }) {
  const [propia, setPropia] = useState(0);
  const controlada = dada !== undefined;
  const n = Math.max(1, fotos.length);
  // Mientras otro la lleva, la propia la sigue: si la sueltan, continúa desde la misma foto y no vuelve a la primera.
  useEffect(() => {
    if (controlada) setPropia(dada % n);
  }, [controlada, dada, n]);
  useEffect(() => {
    if (controlada) return;
    if (quieto || fotos.length < 2) return setPropia(0);
    const t = setInterval(() => {
      if (typeof document === "undefined" || !document.hidden) setPropia((x) => (x + 1) % fotos.length);
    }, 5000);
    return () => clearInterval(t);
  }, [controlada, quieto, fotos.length]);
  const activa = controlada ? dada % n : propia;
  return (
    <div className="mk-tomas" data-activa={activa}>
      {fotos.map((f, k) => (
        <img key={k} src={f} alt={k === 0 ? alt : ""} decoding="async" data-activa={k === activa ? "" : undefined} />
      ))}
    </div>
  );
}
