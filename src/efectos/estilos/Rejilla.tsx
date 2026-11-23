import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";
import { lista } from "../semilla";

const LINEA = `color-mix(in srgb,var(--mk-acento-2,${COLOR.acento}) 55%,transparent)`;
const CSS = `
.mk-rejilla{background:linear-gradient(to bottom,transparent 40%,color-mix(in srgb,${COLOR.acento} 20%,transparent) 66%,transparent 67%)}
.mk-rejilla .mk-sol{position:absolute;left:50%;top:66%;width:min(38%,240px);aspect-ratio:1;transform:translate(-50%,-100%);border-radius:50%;background:linear-gradient(${COLOR.acento},color-mix(in srgb,${COLOR.acento} 40%,#ffd21f));opacity:.34}
.mk-rejilla .mk-sol::after{content:"";position:absolute;inset:0;border-radius:50%;background:repeating-linear-gradient(to bottom,transparent 0 12px,var(--mk-fondo,#07060f) 12px 17px);-webkit-mask:linear-gradient(transparent 48%,#000 48%);mask:linear-gradient(transparent 48%,#000 48%)}
.mk-rejilla .mk-piso{position:absolute;left:0;right:0;top:66%;bottom:0;overflow:hidden;border-top:2px solid ${LINEA}}
.mk-rejilla .mk-piso svg{position:absolute;inset:0;width:100%;height:100%}
.mk-rejilla .mk-hz{position:absolute;inset:0;animation:mk-hz var(--v) cubic-bezier(.55,0,1,.6) infinite;animation-delay:var(--r)}
.mk-rejilla .mk-hz::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:${LINEA}}
@keyframes mk-hz{0%{transform:translateY(0);opacity:0}12%{opacity:1}100%{transform:translateY(100%);opacity:1}}
`;

/** Neón: suelo de rejilla que avanza hacia la persona, con un sol rayado en el horizonte. */
export default function Rejilla({ variante = 1, ...p }: EfectoProps) {
  const v = [3.2, 1.8, 4.5][variante - 1];
  const n = 7;
  return (
    <CapaEfecto nombre="rejilla" css={CSS} variante={variante} {...p}>
      {variante !== 3 && <span className="mk-sol" />}
      <span className="mk-piso">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {lista(17).map((i) => (
            <line key={i} x1={50} y1={0} x2={-150 + i * 25} y2={100} stroke={LINEA} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {lista(n).map((i) => (
          <span key={i} className="mk-hz" style={{ "--v": `${v}s`, "--r": `${-(i * v) / n}s`, transform: `translateY(${((i / n) ** 2) * 100}%)` } as React.CSSProperties} />
        ))}
      </span>
    </CapaEfecto>
  );
}
