import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const CSS = `
.mk-ecualizador .mk-barras{position:absolute;left:0;right:0;bottom:0;height:46%;display:flex;align-items:flex-end;gap:3%;padding:0 3%}
.mk-ecualizador i{flex:1;height:100%;transform-origin:50% 100%;background:repeating-linear-gradient(to top,${COLOR.acento} 0 8px,transparent 8px 11px);opacity:.32;animation:mk-eq var(--d) ease-in-out infinite alternate;animation-delay:var(--r)}
.mk-ecualizador[data-variante="2"] i{background:linear-gradient(to top,${COLOR.acento},var(--mk-acento-2,${COLOR.acento}))}
@keyframes mk-eq{0%{transform:scaleY(.12)}40%{transform:scaleY(.8)}70%{transform:scaleY(.35)}100%{transform:scaleY(1)}}
`;

/** Rock: barras de ecualizador que suben y bajan. */
export default function Ecualizador({ variante = 1, ...p }: EfectoProps) {
  const n = [12, 18, 7][variante - 1];
  return (
    <CapaEfecto nombre="ecualizador" css={CSS} variante={variante} {...p}>
      <span className="mk-barras">
        {lista(n).map((i) => (
          <i key={i} style={{ "--d": `${0.5 + semilla(i) * 0.9}s`, "--r": `${-semilla(i, 2) * 2}s`, transform: `scaleY(${0.25 + semilla(i, 3) * 0.6})` } as React.CSSProperties} />
        ))}
      </span>
    </CapaEfecto>
  );
}
