import { flushSync } from "react-dom";
import type { VistaId } from "./estilos";

const CSS = `
::view-transition-old(root),::view-transition-new(root){animation-duration:.5s;animation-timing-function:cubic-bezier(.4,0,.2,1)}
html[data-mk-vista=deslizar]::view-transition-old(root){animation-name:mk-v-sale-izq}
html[data-mk-vista=deslizar]::view-transition-new(root){animation-name:mk-v-entra-der}
html[data-mk-vista=apagon]::view-transition-old(root){animation:mk-v-apagon .45s steps(6) both}
html[data-mk-vista=apagon]::view-transition-new(root){animation:mk-v-encender .6s .35s steps(5) both}
html[data-mk-vista=canal]::view-transition-old(root){animation:mk-v-canal-sale .32s cubic-bezier(.7,0,1,1) both}
html[data-mk-vista=canal]::view-transition-new(root){animation:mk-v-canal-entra .38s .3s cubic-bezier(0,0,.3,1) both}
html[data-mk-vista=corte]::view-transition-old(root){animation:none;opacity:0}
html[data-mk-vista=corte]::view-transition-new(root){animation:mk-v-sacudon .35s linear both}
html[data-mk-vista=barrido]::view-transition-old(root){animation:mk-v-sale-izq .45s cubic-bezier(.7,0,.3,1) both}
html[data-mk-vista=barrido]::view-transition-new(root){animation:mk-v-barrido .5s cubic-bezier(.2,.8,.2,1) both}
html[data-mk-vista=cine]::view-transition-old(root){animation:mk-v-negro .5s ease-in both}
html[data-mk-vista=cine]::view-transition-new(root){animation:mk-v-aparece .7s .45s ease-out both}
@keyframes mk-v-sale-izq{to{opacity:0;transform:translateX(-30%)}}
@keyframes mk-v-entra-der{from{opacity:0;transform:translateX(30%)}}
@keyframes mk-v-apagon{0%{opacity:1}30%{opacity:.2}45%{opacity:.8}100%{opacity:0}}
@keyframes mk-v-encender{0%{opacity:0}30%{opacity:.7}45%{opacity:.1}100%{opacity:1}}
@keyframes mk-v-canal-sale{60%{opacity:1;transform:scale(1,.02)}100%{opacity:0;transform:scale(0,.02)}}
@keyframes mk-v-canal-entra{0%{opacity:0;transform:scale(0,.02)}40%{opacity:1;transform:scale(1,.02)}100%{opacity:1;transform:none}}
@keyframes mk-v-sacudon{0%{transform:translate(8px,-6px) rotate(.6deg)}25%{transform:translate(-6px,4px)}50%{transform:translate(4px,-2px)}75%{transform:translate(-2px,1px)}100%{transform:none}}
@keyframes mk-v-barrido{from{transform:translateX(100%) skewX(-8deg)}to{transform:none}}
@keyframes mk-v-negro{to{opacity:0}}
@keyframes mk-v-aparece{from{opacity:0;transform:scale(1.04)}}
@media (prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-old(*),::view-transition-new(*){animation:none!important}}
`;

let inyectado = false;
function inyectar() {
  if (inyectado || typeof document === "undefined") return;
  inyectado = true;
  const s = document.createElement("style");
  s.id = "motion-kit-vista";
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Cambia de pantalla con una transición de página completa (View Transitions API).
 * `actualizar` hace el cambio (por ejemplo, `setPagina("menu")`). Sin soporte o con
 * «reducir movimiento», el cambio se aplica directo.
 */
export function transicionVista(actualizar: () => void, tipo: VistaId = "fundido"): Promise<void> {
  const doc = typeof document !== "undefined" ? (document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } }) : null;
  const reducido = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc?.startViewTransition || reducido) {
    actualizar();
    return Promise.resolve();
  }
  inyectar();
  doc.documentElement.dataset.mkVista = tipo;
  const t = doc.startViewTransition(() => flushSync(actualizar));
  return t.finished.catch(() => undefined).finally(() => {
    delete doc.documentElement.dataset.mkVista;
  });
}

export const VISTAS: Record<VistaId, string> = {
  fundido: "Fundido",
  deslizar: "Deslizar",
  apagon: "Apagón (neón)",
  canal: "Cambio de canal (retro)",
  corte: "Corte con sacudón (rock)",
  barrido: "Barrido (anime)",
  cine: "Fundido a negro (película)",
};
