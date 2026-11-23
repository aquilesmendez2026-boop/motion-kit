import { CapaEfecto } from "../CapaEfecto";
import { COLOR, type EfectoProps } from "../tokens";

const CSS = `
.mk-letrero .mk-neon{position:absolute;left:50%;top:22%;transform:translateX(-50%);max-width:88%;padding:.2em .7em;border:3px solid ${COLOR.acentoClaro};border-radius:.5em;font:800 clamp(28px,9vw,64px)/1.1 inherit;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;color:${COLOR.acentoClaro};text-shadow:0 0 6px ${COLOR.acento},0 0 18px ${COLOR.acento};box-shadow:0 0 10px ${COLOR.acento},inset 0 0 10px ${COLOR.acento};opacity:.8}
.mk-letrero[data-variante="1"] .mk-neon{animation:mk-parpadeo 4.5s ease-in-out infinite}
.mk-letrero[data-variante="2"] .mk-neon{animation:mk-corte 5s steps(1) infinite}
@keyframes mk-parpadeo{0%,100%{opacity:.85}50%{opacity:.5}}
@keyframes mk-corte{0%,100%{opacity:.85}44%{opacity:.85}45%{opacity:.2}47%{opacity:.85}50%{opacity:.25}52%{opacity:.85}}
`;

export default function Letrero({ variante = 1, texto = "Abierto", ...p }: EfectoProps & { texto?: string }) {
  return (
    <CapaEfecto nombre="letrero" css={CSS} variante={variante} {...p}>
      <div className="mk-neon">{texto}</div>
    </CapaEfecto>
  );
}
