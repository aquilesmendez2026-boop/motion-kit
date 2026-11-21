import {
  Children,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface CarouselProps extends HTMLAttributes<HTMLDivElement> {
  /** Ancho de cada lámina (cualquier medida CSS). */
  slideWidth?: string;
  /** Espacio entre láminas, en píxeles. */
  gap?: number;
  /** Muestra los puntos de navegación. */
  dots?: boolean;
  /** Color del punto activo. */
  dotColor?: string;
  /** Nombre del carrusel para lectores de pantalla. */
  label?: string;
  children: ReactNode;
}

const CSS = `
.motion-kit-carousel { scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.motion-kit-carousel::-webkit-scrollbar { display: none; }
`;

/**
 * Carrusel que se desliza con el dedo. Usa el scroll nativo del navegador
 * (scroll-snap), así que se siente igual que una app y no pelea con el scroll
 * vertical de la página.
 */
export function Carousel({
  slideWidth = "82%",
  gap = 16,
  dots = true,
  dotColor = "#7c5cff",
  label = "Carrusel",
  style,
  children,
  ...rest
}: CarouselProps) {
  useStyles("carousel", CSS);
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slides = Children.toArray(children);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      Array.from(track.children).forEach((child, i) => {
        const slide = child as HTMLElement;
        const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [slides.length]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const slide = track?.children[i] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <div style={style} {...rest}>
      <div
        ref={trackRef}
        className="motion-kit-carousel"
        role="region"
        aria-roledescription="carrusel"
        aria-label={label}
        tabIndex={0}
        style={{
          display: "flex",
          gap,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          overscrollBehaviorX: "contain",
          paddingInline: `calc((100% - ${slideWidth}) / 2)`,
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="lámina"
            aria-label={`${i + 1} de ${slides.length}`}
            style={{ flex: `0 0 ${slideWidth}`, scrollSnapAlign: "center", minWidth: 0 }}
          >
            {slide}
          </div>
        ))}
      </div>

      {dots && slides.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir a la lámina ${i + 1}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              style={{
                // Zona de toque de 28 px aunque el punto se vea chico.
                width: 28,
                height: 28,
                padding: 0,
                border: 0,
                background: "transparent",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: 8,
                  width: i === active ? 22 : 8,
                  borderRadius: 999,
                  background: i === active ? dotColor : "rgba(128, 128, 128, 0.45)",
                  transition: reduced ? "none" : "width 300ms ease, background 300ms ease",
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
