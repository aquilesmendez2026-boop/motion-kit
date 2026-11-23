import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const CSS = `
.mk-estrellas i{position:absolute;border-radius:50%;background:${COLOR.acentoClaro};box-shadow:0 0 6px ${COLOR.acento};opacity:.5;animation:mk-titilar var(--d) ease-in-out infinite;animation-delay:var(--r)}
`;

export default function Estrellas({ variante = 1, ...p }: EfectoProps) {
  const n = [30, 50, 80][variante - 1];
  return (
    <CapaEfecto nombre="estrellas" css={CSS} variante={variante} {...p}>
      {lista(n).map((i) => {
        const s = 1.5 + semilla(i, 3) * (variante === 3 ? 2 : 2.8);
        return <i key={i} style={{ left: `${semilla(i) * 100}%`, top: `${semilla(i, 1) * 100}%`, width: s, height: s, "--d": `${2 + semilla(i, 2) * 4}s`, "--r": `${-semilla(i, 5) * 6}s` } as React.CSSProperties} />;
      })}
    </CapaEfecto>
  );
}
