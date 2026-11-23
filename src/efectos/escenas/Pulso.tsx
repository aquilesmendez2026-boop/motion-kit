import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista } from "../semilla";

const CSS = `
.mk-pulso .mk-ani{position:absolute;left:50%;top:50%;width:70%;aspect-ratio:1;margin:-35% 0 0 -35%;border-radius:50%;border:2px solid ${COLOR.acento};animation:mk-onda var(--d) ease-out infinite;animation-delay:var(--r)}
.mk-pulso svg{position:absolute;left:50%;top:50%;width:min(22%,110px);margin:calc(min(22%,110px)/-2) 0 0 calc(min(22%,110px)/-2);height:auto;animation:mk-latido 2.4s ease-in-out infinite;opacity:.8}
@keyframes mk-onda{0%{transform:scale(.18);opacity:.65}100%{transform:scale(1.25);opacity:0}}
@keyframes mk-latido{0%,100%{transform:scale(1)}15%{transform:scale(1.14)}30%{transform:scale(1)}45%{transform:scale(1.08)}}
`;

export default function Pulso({ variante = 1, ...p }: EfectoProps) {
  const n = variante + 1;
  const d = 3.6;
  return (
    <CapaEfecto nombre="pulso" css={CSS} variante={variante} {...p}>
      {lista(n).map((i) => (
        <span
          key={i}
          className="mk-ani"
          style={{ "--d": `${d}s`, "--r": `${-(i * d) / n}s`, transform: `scale(${0.3 + (i / n) * 0.8})`, opacity: 0.5 - (i / n) * 0.35 } as React.CSSProperties}
        />
      ))}
      <svg viewBox="0 0 24 24" fill={COLOR.acento}>
        <path d="M12 21s-7.5-4.6-9.6-9.3C.8 8.1 3 4.5 6.6 4.5c2 0 3.6 1 5.4 3 1.8-2 3.4-3 5.4-3 3.6 0 5.8 3.6 4.2 7.2C19.5 16.4 12 21 12 21z" />
      </svg>
    </CapaEfecto>
  );
}
