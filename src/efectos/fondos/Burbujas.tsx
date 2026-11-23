import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const CSS = `
.mk-burbujas i{width:var(--s);height:var(--s);border-radius:50%;border:1.5px solid ${COLOR.acento};background:color-mix(in srgb,${COLOR.acento} 14%,transparent);opacity:.6;animation:mk-vaiven var(--v) ease-in-out infinite}
`;

export default function Burbujas({ variante = 1, ...p }: EfectoProps) {
  const n = [10, 16, 24][variante - 1];
  const tam = [40, 30, 22][variante - 1];
  return (
    <CapaEfecto nombre="burbujas" css={CSS} variante={variante} {...p}>
      {lista(n).map((i) => (
        <span
          key={i}
          className="mk-col mk-sube"
          style={{
            left: `${3 + semilla(i) * 94}%`,
            transform: `translateY(${-semilla(i, 3) * 100}%)`,
            animationDuration: `${9 + semilla(i, 1) * 9}s`,
            animationDelay: `${-semilla(i, 2) * 16}s`,
          }}
        >
          <i style={{ "--s": `${8 + semilla(i, 4) * tam}px`, "--v": `${3 + semilla(i, 5) * 3}s` } as React.CSSProperties} />
        </span>
      ))}
    </CapaEfecto>
  );
}
