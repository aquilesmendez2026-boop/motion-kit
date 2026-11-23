import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const CSS = `
.mk-lluvia .mk-rot{position:absolute;inset:-30%}
.mk-lluvia i{width:2px;height:var(--h);border-radius:2px;background:linear-gradient(transparent,${COLOR.acentoClaro},${COLOR.acento});opacity:.45}
`;

export default function Lluvia({ variante = 1, ...p }: EfectoProps) {
  const n = [18, 28, 40][variante - 1];
  const ang = [12, 0, -16][variante - 1];
  return (
    <CapaEfecto nombre="lluvia" css={CSS} variante={variante} {...p}>
      <div className="mk-rot" style={{ transform: `rotate(${ang}deg)` }}>
        {lista(n).map((i) => (
          <span key={i} className="mk-col mk-caer" style={{ left: `${semilla(i) * 100}%`, transform: `translateY(${semilla(i, 3) * 100}%)`, animationDuration: `${1.6 + semilla(i, 1) * 2}s`, animationDelay: `${-semilla(i, 2) * 4}s` }}>
            <i style={{ "--h": `${30 + semilla(i, 4) * 60}px` } as React.CSSProperties} />
          </span>
        ))}
      </div>
    </CapaEfecto>
  );
}
