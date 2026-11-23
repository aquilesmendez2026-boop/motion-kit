import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const CSS = `
.mk-cometas .mk-cm{position:absolute;width:46%;height:2px}
.mk-cometas .mk-cm i{display:block;width:100%;height:100%;border-radius:2px;background:linear-gradient(90deg,transparent,${COLOR.acentoClaro},${COLOR.acento});opacity:.7;animation:mk-cruzar var(--d) linear infinite;animation-delay:var(--r)}
@keyframes mk-cruzar{0%{transform:translateX(-120%);opacity:0}8%{opacity:.8}60%{opacity:.8}100%{transform:translateX(330%);opacity:0}}
`;

export default function Cometas({ variante = 1, ...p }: EfectoProps) {
  const n = [5, 8, 12][variante - 1];
  const ang = [28, 38, 18][variante - 1];
  return (
    <CapaEfecto nombre="cometas" css={CSS} variante={variante} {...p}>
      {lista(n).map((i) => (
        <span key={i} className="mk-cm" style={{ left: `${-10 + semilla(i) * 60}%`, top: `${semilla(i, 1) * 90}%`, transform: `rotate(${ang}deg)` }}>
          <i style={{ "--d": `${5 + semilla(i, 2) * 5}s`, "--r": `${-semilla(i, 3) * 10}s`, transform: `translateX(${60 + semilla(i, 4) * 120}%)`, height: `${1.5 + semilla(i, 5) * 2}px` } as React.CSSProperties} />
        </span>
      ))}
    </CapaEfecto>
  );
}
