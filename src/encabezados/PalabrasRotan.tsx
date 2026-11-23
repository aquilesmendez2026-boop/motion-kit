import { useEffect, useState } from "react";

/**
 * Palabras que rotan dentro de la palabra resaltada del título. Todas ocupan la misma celda, así el ancho queda
 * reservado al de la más larga y el título no salta. Cambia cada 2,4 s; quieta, queda la primera. Va dentro del título,
 * que ya tiene su `aria-label` con la primera palabra.
 */
export function PalabrasRotan({ palabras, quieto }: { palabras: string[]; quieto: boolean }) {
  const [activa, setActiva] = useState(0);
  useEffect(() => {
    if (quieto || palabras.length < 2) return setActiva(0);
    const t = setInterval(() => setActiva((x) => (x + 1) % palabras.length), 2400);
    return () => clearInterval(t);
  }, [quieto, palabras.length]);
  return (
    <span className="mk-rot">
      {palabras.map((p, k) => <span key={k} data-activa={k === activa ? "" : undefined}>{p}</span>)}
    </span>
  );
}
