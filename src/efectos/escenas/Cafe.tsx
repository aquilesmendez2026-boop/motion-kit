import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista, semilla } from "../semilla";

const CSS = `
.mk-cafe .mk-vapor i{width:16px;height:90px;border-radius:50%;background:linear-gradient(${COLOR.acentoClaro},transparent);filter:blur(7px);opacity:.55}
.mk-cafe .mk-grano i{width:9px;height:14px;border-radius:50%;background:${COLOR.acento};opacity:.45;animation:mk-giro var(--g) linear infinite}
.mk-cafe svg{position:absolute;right:6%;bottom:5%;width:min(34%,170px);height:auto;opacity:.5}
`;

export default function Cafe({ variante = 1, ...p }: EfectoProps) {
  const vapores = [3, 5, 5][variante - 1];
  const granos = [5, 6, 14][variante - 1];
  const dur = [8, 6, 6][variante - 1];
  return (
    <CapaEfecto nombre="cafe" css={CSS} variante={variante} {...p}>
      {lista(vapores).map((i) => (
        <span
          key={`v${i}`}
          className="mk-col mk-sube mk-vapor"
          style={{
            left: `${72 + ((i % 5) - 2) * 4 + semilla(i) * 3}%`,
            transform: `translateY(${-30 - semilla(i, 3) * 40}%)`,
            animationDuration: `${dur + semilla(i, 1) * 3}s`,
            animationDelay: `${-i * 1.7}s`,
          }}
        >
          <i />
        </span>
      ))}
      {lista(granos).map((i) => (
        <span
          key={`g${i}`}
          className="mk-col mk-caer mk-grano"
          style={{
            left: `${5 + semilla(i, 7) * 90}%`,
            transform: `translateY(${semilla(i, 8) * 100}%)`,
            animationDuration: `${14 + semilla(i, 1) * 8}s`,
            animationDelay: `${-semilla(i, 2) * 20}s`,
          }}
        >
          <i style={{ "--g": `${7 + semilla(i, 5) * 6}s`, rotate: `${semilla(i, 6) * 180}deg` } as React.CSSProperties} />
        </span>
      ))}
      <svg viewBox="0 0 120 100" fill="none" stroke={COLOR.acento} strokeWidth="4" strokeLinecap="round">
        <path d="M18 38h66v26a26 26 0 0 1-26 26h-14a26 26 0 0 1-26-26z" fill="color-mix(in srgb, currentColor 0%, transparent)" />
        <path d="M84 46h8a12 12 0 0 1 0 24h-8" />
        <path d="M10 96h82" />
      </svg>
    </CapaEfecto>
  );
}
