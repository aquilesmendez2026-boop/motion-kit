import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const CSS = `
.mk-niebla .mk-banda{position:absolute;left:-30%;width:160%;height:38%;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,${COLOR.acentoClaro} 55%,transparent),transparent);filter:blur(14px);opacity:.5;animation:mk-deriva var(--d) ease-in-out infinite alternate;animation-delay:var(--r)}
@keyframes mk-deriva{from{transform:translateX(-8%)}to{transform:translateX(8%)}}
`;

export default function Niebla({ variante = 1, ...p }: EfectoProps) {
  const n = variante + 1;
  return (
    <CapaEfecto nombre="niebla" css={CSS} variante={variante} {...p}>
      {lista(n).map((i) => (
        <span key={i} className="mk-banda" style={{ top: `${(i / n) * 80 + semilla(i) * 8}%`, transform: `translateX(${(semilla(i, 1) - 0.5) * 12}%)`, "--d": `${14 - variante * 2 + i * 3}s`, "--r": `${-i * 4}s` } as React.CSSProperties} />
      ))}
    </CapaEfecto>
  );
}
