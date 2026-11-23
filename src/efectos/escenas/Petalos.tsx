import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const CSS = `
.mk-petalos i{width:var(--s);height:calc(var(--s)*1.4);border-radius:80% 0 80% 0;background:linear-gradient(135deg,${COLOR.acentoClaro},${COLOR.acento});opacity:.55;animation:mk-giro var(--g) linear infinite}
`;

export default function Petalos({ variante = 1, ...p }: EfectoProps) {
  const n = [8, 14, 20][variante - 1];
  return (
    <CapaEfecto nombre="petalos" css={CSS} variante={variante} {...p}>
      {lista(n).map((i) => (
        <span
          key={i}
          className="mk-col mk-caer"
          style={{
            left: `${4 + semilla(i) * 92}%`,
            transform: `translateY(${semilla(i, 3) * 100}%)`,
            animationDuration: `${11 + semilla(i, 1) * 8}s`,
            animationDelay: `${-semilla(i, 2) * 18}s`,
          }}
        >
          <i style={{ "--s": `${10 + semilla(i, 4) * 12}px`, "--g": `${6 + semilla(i, 5) * 6}s`, rotate: `${semilla(i, 6) * 360}deg` } as React.CSSProperties} />
        </span>
      ))}
    </CapaEfecto>
  );
}
