// El «llamado con vida»: para los bloques que son solo un botón a otra página (agenda, pedidos, buzón, cotizaciones,
// encuestas y contacto). Una escena chica que arranca al verse y después queda quieta. Es decoración: no recibe toques
// ni la lee el lector de pantalla; el título, el texto y el botón siguen siendo los del bloque.
import { useStyles } from "../utils/styles";
import { useMomento, type ComunesMomento } from "./base";
import { ESCENAS_LLAMADO, type EscenaLlamado } from "./escenas-llamado";

export interface LlamadoConVidaProps extends ComunesMomento {
  escena: EscenaLlamado;
  /** Solo en `pedidos`: si el negocio está recibiendo pedidos ahora. Con `true`, el punto late. */
  abierto?: boolean;
}

const R = "var(--mk-resorte-ms,600ms) var(--mk-resorte-curva,cubic-bezier(.2,.8,.2,1)) both";
const VIVO = ".mk-m-llamado[data-activo][data-nivel=completo]";

export const CSS_LLAMADO =
  ".mk-m-llamado{display:inline-block;width:96px;height:96px;pointer-events:none;vertical-align:middle}" +
  ".mk-m-llamado svg{display:block;width:100%;height:100%;overflow:visible;fill:none;stroke:var(--mk-m-texto);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}" +
  ".mk-m-llamado svg *{transform-box:fill-box;transform-origin:50% 50%}" +
  ".mk-ll-acento{fill:var(--mk-m-acento);stroke:none}" +
  ".mk-ll-acento-trazo{stroke:var(--mk-m-acento)}" +
  ".mk-ll-relleno{fill:var(--mk-m-suave);stroke:none}" +
  ".mk-ll-apagado{fill:var(--mk-m-suave);stroke:none}" +
  ".mk-ll-papel,.mk-ll-frente{fill:var(--mk-m-superficie)}" +
  ".mk-ll-grueso{stroke-width:4.5}" +
  // Antes de verse la escena no está; en liviano aparece ya terminada.
  ".mk-m-llamado:not([data-nivel=quieto]):not([data-activo]) svg{opacity:0}" +
  ".mk-m-llamado[data-activo][data-nivel=liviano] svg{animation:mk-ll-aparece .4s ease-out both}" +
  `${VIVO} .mk-ll-cae{animation:mk-ll-cae ${R}}` +
  `${VIVO} .mk-ll-voltea{transform-origin:50% 0;animation:mk-ll-voltea ${R}}` +
  // La tapa del sobre está abierta en reposo (así queda también en liviano, en quieto y con movimiento reducido).
  ".mk-m-llamado svg .mk-ll-abre{transform-origin:50% 0;transform:scaleY(-1)}" +
  `${VIVO} .mk-ll-abre{animation:mk-ll-abre ${R}}` +
  `${VIVO} .mk-ll-sube{animation:mk-ll-sube ${R}}` +
  `${VIVO} .mk-ll-raya{transform-origin:0 50%;animation:mk-ll-raya .45s cubic-bezier(.2,.8,.2,1) both}` +
  `${VIVO} .mk-ll-marca{animation:mk-ll-marca ${R}}` +
  `${VIVO} .mk-ll-bota{animation:mk-ll-bota .5s ease-in-out 3 both}` +
  // El punto de «abierto»: primero aparece y después late.
  `${VIVO} .mk-ll-late{animation:mk-ll-marca ${R},mk-ll-late 1.4s ease-in-out infinite alternate}` +
  "@keyframes mk-ll-aparece{from{opacity:0}to{opacity:1}}" +
  "@keyframes mk-ll-cae{from{opacity:0;transform:translateY(-16px)}40%{opacity:1}to{opacity:1;transform:none}}" +
  // La hoja se voltea en 2D (aplastada → abierta): un giro 3D sobre un elemento SVG no anda igual en todos los navegadores.
  "@keyframes mk-ll-voltea{from{transform:scaleY(0)}to{transform:none}}" +
  "@keyframes mk-ll-abre{from{transform:none}}" +
  "@keyframes mk-ll-sube{from{transform:translateY(22px)}to{transform:none}}" +
  "@keyframes mk-ll-raya{from{transform:scaleX(0)}to{transform:none}}" +
  "@keyframes mk-ll-marca{from{opacity:0;transform:scale(0)}to{opacity:1;transform:none}}" +
  "@keyframes mk-ll-bota{50%{transform:translateY(-6px)}}" +
  "@keyframes mk-ll-late{to{transform:scale(1.3)}}";

export default function LlamadoConVida({ escena, abierto = false, nivel: forzado, ahorro, className }: LlamadoConVidaProps) {
  useStyles("momento-llamado", CSS_LLAMADO);
  const { ref, nivel, activo } = useMomento<HTMLSpanElement>({ nivel: forzado, ahorro });
  const dibujar = Object.prototype.hasOwnProperty.call(ESCENAS_LLAMADO, escena) ? ESCENAS_LLAMADO[escena] : null;
  if (!dibujar) return null;
  return (
    <span ref={ref} className={["mk-momento mk-m-llamado", className].filter(Boolean).join(" ")} data-momento="llamado" data-escena={escena} data-nivel={nivel} data-activo={activo ? "" : undefined} aria-hidden="true">
      <svg viewBox="0 0 96 96" focusable="false">{dibujar(abierto)}</svg>
    </span>
  );
}
