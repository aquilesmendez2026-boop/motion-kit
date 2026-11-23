import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const CSS = `
.mk-velocidad .mk-rayo{position:absolute;left:50%;top:50%;width:75%;height:0;transform-origin:0 0}
.mk-velocidad .mk-rayo i{position:absolute;left:0;top:calc(var(--g) / -2);width:100%;height:var(--g);background:linear-gradient(90deg,transparent 38%,${COLOR.acento});clip-path:polygon(0 50%,100% 0,100% 100%);opacity:.0;animation:mk-rayo var(--d) linear infinite;animation-delay:var(--r)}
@keyframes mk-rayo{0%{opacity:0;transform:translateX(40%)}20%{opacity:.55}70%{opacity:.4}100%{opacity:0;transform:translateX(0)}}
`;

/** Anime: líneas de velocidad que convergen al centro. */
export default function Velocidad({ variante = 1, ...p }: EfectoProps) {
  const n = [28, 44, 18][variante - 1];
  return (
    <CapaEfecto nombre="velocidad" css={CSS} variante={variante} {...p}>
      {lista(n).map((i) => (
        <span key={i} className="mk-rayo" style={{ transform: `rotate(${(i / n) * 360 + semilla(i) * 6}deg)` }}>
          <i style={{ "--g": `${4 + semilla(i, 1) * (variante === 3 ? 16 : 9)}px`, "--d": `${0.9 + semilla(i, 2) * 1.2}s`, "--r": `${-semilla(i, 3) * 2}s` } as React.CSSProperties} />
        </span>
      ))}
    </CapaEfecto>
  );
}
