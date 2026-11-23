import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const SIMBOLOS = ["A", "B", "C", "1", "2", "3", "+", "?", "!", "a", "b", "c", "=", "7"];
const CSS = `
.mk-abecedario i{font-style:normal;font-weight:800;font-family:inherit;line-height:1;color:${COLOR.acento};opacity:.32;animation:mk-vaiven var(--v) ease-in-out infinite}
`;

export default function Abecedario({ variante = 1, ...p }: EfectoProps) {
  const n = [10, 16, 22][variante - 1];
  const tam = [34, 28, 24][variante - 1];
  return (
    <CapaEfecto nombre="abecedario" css={CSS} variante={variante} {...p}>
      {lista(n).map((i) => (
        <span
          key={i}
          className="mk-col mk-sube"
          style={{
            left: `${4 + semilla(i) * 92}%`,
            transform: `translateY(${-semilla(i, 3) * 100}%)`,
            animationDuration: `${10 + semilla(i, 1) * 8}s`,
            animationDelay: `${-semilla(i, 2) * 18}s`,
          }}
        >
          <i style={{ fontSize: `${16 + semilla(i, 4) * tam}px`, rotate: `${(semilla(i, 6) - 0.5) * 50}deg`, "--v": `${4 + semilla(i, 5) * 3}s` } as React.CSSProperties}>
            {SIMBOLOS[Math.floor(semilla(i, 9) * SIMBOLOS.length)]}
          </i>
        </span>
      ))}
    </CapaEfecto>
  );
}
