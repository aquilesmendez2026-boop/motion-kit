import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  /** Velocidad en píxeles por segundo. */
  speed?: number;
  /** Hacia dónde se mueve. */
  direction?: "left" | "right";
  /** Espacio entre elementos, en píxeles. */
  gap?: number;
  /** Se detiene al pasar el mouse o al enfocar un elemento con el teclado. */
  pauseOnHover?: boolean;
  /** Difumina los bordes izquierdo y derecho. */
  fade?: boolean;
}

const CSS = `
@keyframes motion-kit-marquee { to { transform: translate3d(-50%, 0, 0); } }
.motion-kit-marquee[data-pause="true"]:hover > div,
.motion-kit-marquee[data-pause="true"]:focus-within > div { animation-play-state: paused; }
`;

const FADE =
  "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)";

/**
 * Cinta infinita de elementos (logos, frases, reseñas) que se desplaza sola.
 */
export function Marquee({
  speed = 60,
  direction = "left",
  gap = 32,
  pauseOnHover = true,
  fade = true,
  className,
  style,
  children,
  ...rest
}: MarqueeProps) {
  useStyles("marquee", CSS);
  const reduced = useReducedMotion();
  const groupRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => setWidth(group.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, []);

  const group: CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    gap,
    paddingRight: gap,
  };

  // Sin movimiento: una sola copia que se puede deslizar a mano.
  if (reduced) {
    return (
      <div className={className} style={{ overflowX: "auto", ...style }} {...rest}>
        <div ref={groupRef} style={{ ...group, width: "max-content" }}>
          {children}
        </div>
      </div>
    );
  }

  const mask = fade ? { WebkitMaskImage: FADE, maskImage: FADE } : null;

  return (
    <div
      className={["motion-kit-marquee", className].filter(Boolean).join(" ")}
      data-pause={pauseOnHover}
      style={{ overflow: "hidden", ...mask, ...style }}
      {...rest}
    >
      <div
        style={{
          display: "flex",
          width: "max-content",
          animation:
            width > 0
              ? `motion-kit-marquee ${width / speed}s linear infinite ${
                  direction === "left" ? "normal" : "reverse"
                }`
              : "none",
        }}
      >
        <div ref={groupRef} style={group}>
          {children}
        </div>
        {/* Segunda copia para que el ciclo no tenga corte. */}
        <div style={group} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
