// Copiar: copia un texto (un link, un código) y un globo chico dice «¡Copiado!» sobre el botón. Si el navegador no deja,
// «Cópialo a mano». El look del botón lo pone quien lo usa.
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { useStyles } from "../utils/styles";
import { copiarTexto } from "./portapapeles";
import { c, f, fuerza, tiempo } from "./tema";

export interface CopiarProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  texto: string;
  aviso?: string;
  avisoFallo?: string;
  alCopiar?: (ok: boolean) => void;
}

/** Cuánto se ve el globo. */
const DURA_GLOBO = 1400;

let css: string | undefined;
const estilos = () =>
  (css ??= `
.mk-copiar{position:relative;display:inline-block}
.mk-copiar-globo{--t:${c("texto")};--s:${c("superficie")};position:absolute;left:50%;bottom:100%;margin-bottom:12px;translate:-50% 0;
  padding:6px 12px;border:${f("trazo", "2px solid var(--t)")};border-radius:${f("radioTarjeta", "12px")};background:var(--s);color:var(--t);box-shadow:${f("sombraSuave", "3px 3px 0 var(--t)")};
  font-weight:800;font-size:.85rem;white-space:nowrap;pointer-events:none;animation:mk-copiar-entra ${tiempo(320)} cubic-bezier(.34,1.56,.64,1)}
.mk-copiar-globo::after{content:"";position:absolute;left:50%;bottom:-7px;width:10px;height:10px;margin-left:-5px;background:var(--s);
  border:${f("trazo", "2px solid var(--t)")};border-top:0;border-left:0;transform:rotate(45deg)}
@keyframes mk-copiar-entra{from{opacity:0;transform:scale(calc(1 - ${fuerza(0.4)}))}}
@media (prefers-reduced-motion:reduce){.mk-copiar-globo{animation:none}}`);

export function Copiar({ texto, aviso = "¡Copiado!", avisoFallo = "Cópialo a mano", alCopiar, onClick, children, ...resto }: CopiarProps) {
  useStyles("copiar", estilos());
  const [globo, setGlobo] = useState<{ n: number; texto: string } | null>(null);
  const reloj = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(reloj.current), []);

  const alTocar = async (ev: MouseEvent<HTMLButtonElement>) => {
    onClick?.(ev);
    if (ev.defaultPrevented) return;
    const ok = await copiarTexto(texto);
    alCopiar?.(ok);
    clearTimeout(reloj.current);
    setGlobo((g) => ({ n: (g?.n ?? 0) + 1, texto: ok ? aviso : avisoFallo }));
    reloj.current = setTimeout(() => setGlobo(null), DURA_GLOBO);
  };

  return (
    <span className="mk-copiar">
      <button type="button" onClick={alTocar} {...resto}>
        {children}
      </button>
      {globo && (
        <span key={globo.n} className="mk-copiar-globo" aria-hidden="true">
          {globo.texto}
        </span>
      )}
      <span style={{ position: "absolute", clipPath: "inset(50%)" }} aria-live="polite">{globo?.texto ?? ""}</span>
    </span>
  );
}
