import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";

const CSS = `
.mk-tubo{background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.45));}
.mk-tubo .mk-lineas{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 2px,transparent 2px 4px);animation:mk-parpadeo-tubo 5s steps(1) infinite}
.mk-tubo .mk-barra{position:absolute;left:0;right:0;top:-30%;height:28%;background:linear-gradient(transparent,color-mix(in srgb,${COLOR.acento} 20%,transparent),transparent);animation:mk-barra var(--v) linear infinite}
.mk-tubo .mk-pixel{position:absolute;width:10px;height:10px;background:${COLOR.acento};opacity:.0;animation:mk-pixel 2.4s steps(1) infinite}
@keyframes mk-barra{from{transform:translateY(0)}to{transform:translateY(480%)}}
@keyframes mk-parpadeo-tubo{0%,100%{opacity:1}31%{opacity:.75}32%{opacity:1}}
@keyframes mk-pixel{0%,100%{opacity:0}20%,60%{opacity:.6}}
`;

/** Retro: pantalla de tubo con líneas, barra que baja y píxeles que se encienden. */
export default function Tubo({ variante = 1, ...p }: EfectoProps) {
  const px = [6, 12, 0][variante - 1];
  return (
    <CapaEfecto nombre="tubo" css={CSS} variante={variante} {...p}>
      <span className="mk-lineas" />
      <span className="mk-barra" style={{ "--v": ["6s", "3.5s", "9s"][variante - 1] } as React.CSSProperties} />
      {Array.from({ length: px }, (_, i) => (
        <span key={i} className="mk-pixel" style={{ left: `${(i * 37) % 95}%`, top: `${(i * 53) % 90}%`, animationDelay: `${-i * 0.37}s` }} />
      ))}
    </CapaEfecto>
  );
}
