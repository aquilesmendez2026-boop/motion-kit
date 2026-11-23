import { CapaEfecto } from "../CapaEfecto";
import { RUIDO } from "../../estilos/texturas";
import type { EfectoProps } from "../tokens";

const CSS = `
.mk-grano{background:radial-gradient(ellipse at center,transparent 45%,rgba(0,0,0,.55))}
.mk-grano .mk-ruido{position:absolute;inset:-60px;background-image:${RUIDO};opacity:.35;animation:mk-grano .5s steps(4) infinite}
.mk-grano .mk-raya{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,.5);opacity:0;animation:mk-raya var(--d) steps(1) infinite;animation-delay:var(--r)}
.mk-grano .mk-franja{position:absolute;left:0;right:0;height:9%;background:#000}
@keyframes mk-grano{0%{transform:translate(0,0)}25%{transform:translate(-22px,14px)}50%{transform:translate(18px,-26px)}75%{transform:translate(-10px,30px)}}
@keyframes mk-raya{0%,100%{opacity:0;transform:translateX(0)}12%{opacity:.7;transform:translateX(30px)}14%{opacity:0}55%{opacity:.5;transform:translateX(-40px)}57%{opacity:0}}
`;

/** Película: grano, rayas de cinta y franjas de cine (variante 2 sin franjas, 3 con más rayas). */
export default function Grano({ variante = 1, ...p }: EfectoProps) {
  const rayas = [2, 2, 5][variante - 1];
  return (
    <CapaEfecto nombre="grano" css={CSS} variante={variante} {...p}>
      <span className="mk-ruido" />
      {Array.from({ length: rayas }, (_, i) => (
        <span key={i} className="mk-raya" style={{ left: `${15 + i * 17}%`, "--d": `${3 + i * 1.3}s`, "--r": `${-i * 0.9}s` } as React.CSSProperties} />
      ))}
      {variante !== 2 && (
        <>
          <span className="mk-franja" style={{ top: 0 }} />
          <span className="mk-franja" style={{ bottom: 0 }} />
        </>
      )}
    </CapaEfecto>
  );
}
