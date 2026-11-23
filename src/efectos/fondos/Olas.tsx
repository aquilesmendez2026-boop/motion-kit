import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista } from "../semilla";

const CSS = `
.mk-olas .mk-ola{position:absolute;left:0;bottom:0;width:200%;animation:mk-desliza var(--d) linear infinite}
.mk-olas svg{display:block;width:100%;height:100%}
@keyframes mk-desliza{from{transform:translateX(0)}to{transform:translateX(-50%)}}
`;
const D = "M0 50 C150 0 450 100 600 50 C750 0 1050 100 1200 50 V100 H0Z";

export default function Olas({ variante = 1, ...p }: EfectoProps) {
  const alto = [28, 40, 52][variante - 1];
  const vel = [26, 18, 12][variante - 1];
  return (
    <CapaEfecto nombre="olas" css={CSS} variante={variante} {...p}>
      {lista(3).map((i) => (
        <span key={i} className="mk-ola" style={{ height: `${alto - i * 6}%`, opacity: 0.28 + i * 0.14, "--d": `${vel + i * 7}s`, animationDirection: i % 2 ? "reverse" : "normal" } as React.CSSProperties}>
          <svg viewBox="0 0 1200 100" preserveAspectRatio="none"><path d={D} fill={COLOR.acento} /></svg>
        </span>
      ))}
    </CapaEfecto>
  );
}
