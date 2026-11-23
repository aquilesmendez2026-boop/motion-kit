import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista } from "../semilla";

const CSS = `
.mk-puntos i{position:absolute;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;border-radius:50%;background:${COLOR.acento};opacity:.3;animation:mk-respira 3.6s ease-in-out infinite;animation-delay:var(--r)}
@keyframes mk-respira{0%,100%{transform:scale(.6);opacity:.12}50%{transform:scale(1.5);opacity:.5}}
`;

export default function Puntos({ variante = 1, ...p }: EfectoProps) {
  const cols = [8, 12, 16][variante - 1];
  const filas = Math.round(cols * 0.8);
  return (
    <CapaEfecto nombre="puntos" css={CSS} variante={variante} {...p}>
      {lista(cols * filas).map((k) => {
        const c = k % cols, f = Math.floor(k / cols);
        return <i key={k} style={{ left: `${((c + 0.5) / cols) * 100}%`, top: `${((f + 0.5) / filas) * 100}%`, "--r": `${(variante === 3 ? c - f : c + f) * 0.14}s` } as React.CSSProperties} />;
      })}
    </CapaEfecto>
  );
}
