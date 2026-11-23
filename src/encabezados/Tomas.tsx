import { useEffect, useState } from "react";

/**
 * Varias tomas: las fotos se suceden cada 5 s con un fundido y un acercamiento lento. Quieta (liviano, quieto o una sola
 * foto), queda la primera. No avanza con la pestaña escondida.
 */
export function Tomas({ fotos, alt, quieto }: { fotos: string[]; alt: string; quieto: boolean }) {
  const [activa, setActiva] = useState(0);
  useEffect(() => {
    if (quieto || fotos.length < 2) return setActiva(0);
    const t = setInterval(() => {
      if (typeof document === "undefined" || !document.hidden) setActiva((x) => (x + 1) % fotos.length);
    }, 5000);
    return () => clearInterval(t);
  }, [quieto, fotos.length]);
  return (
    <div className="mk-tomas" data-activa={activa}>
      {fotos.map((f, k) => (
        <img key={k} src={f} alt={k === 0 ? alt : ""} decoding="async" data-activa={k === activa ? "" : undefined} />
      ))}
    </div>
  );
}
