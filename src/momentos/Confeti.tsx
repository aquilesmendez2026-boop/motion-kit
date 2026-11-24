// Confeti: piezas del DOM que caen girando (solo transform y opacidad). Decorativo; se quita solo a los 2,5 s.
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { piezasConfeti } from "./calculos-aparte";

export const CSS_CONFETI =
  ".mk-m-confeti{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2}" +
  ".mk-m-confeti i{position:absolute;left:50%;top:-14px;width:8px;height:12px;border-radius:2px;background:var(--mk-m-acento);" +
  "animation:mk-m-confeti 1.8s cubic-bezier(.2,.6,.4,1) var(--r) both}" +
  ".mk-m-confeti i[data-color=\"1\"]{background:var(--mk-m-acento-2)}" +
  ".mk-m-confeti i[data-color=\"2\"]{background:var(--mk-m-texto)}" +
  "@keyframes mk-m-confeti{from{opacity:1;transform:none}80%{opacity:1}to{opacity:0;transform:translate(calc(var(--x)*3px),380px) rotate(var(--giro))}}";

export function Confeti({ semilla, n = 36 }: { semilla: number; n?: number }) {
  useStyles("momento-confeti", CSS_CONFETI);
  const [vivo, setVivo] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setVivo(false), 2500);
    return () => window.clearTimeout(id);
  }, []);
  const piezas = useMemo(() => piezasConfeti(n, semilla), [n, semilla]);
  if (!vivo) return null;
  return (
    <div className="mk-m-confeti" aria-hidden="true">
      {piezas.map((p, i) => (
        <i key={i} data-color={p.color} style={{ "--x": p.x, "--giro": `${p.giro}deg`, "--r": `${p.retraso}s` } as CSSProperties} />
      ))}
    </div>
  );
}
