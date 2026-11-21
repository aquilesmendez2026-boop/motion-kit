import { useEffect, useMemo, useState, type HTMLAttributes } from "react";
import { useInView } from "../hooks/useInView";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface CountUpProps extends HTMLAttributes<HTMLSpanElement> {
  /** Número final. */
  to: number;
  /** Número inicial. */
  from?: number;
  /** Duración en milisegundos. */
  duration?: number;
  /** Cantidad de decimales. */
  decimals?: number;
  /** Idioma para los separadores de miles (por defecto, Chile). */
  locale?: string;
  /** Texto antes del número, por ejemplo "$". */
  prefix?: string;
  /** Texto después del número, por ejemplo "%" o "+". */
  suffix?: string;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Número que cuenta desde `from` hasta `to` cuando entra en pantalla.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1600,
  decimals = 0,
  locale = "es-CL",
  prefix = "",
  suffix = "",
  ...rest
}: CountUpProps) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLSpanElement>({ once: true });
  const [value, setValue] = useState(from);

  const format = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [locale, decimals]
  );

  useEffect(() => {
    if (!inView) return;
    if (reduced || duration <= 0) {
      setValue(to);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(from + (to - from) * easeOutExpo(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, from, to, duration]);

  const final = `${prefix}${format.format(to)}${suffix}`;

  return (
    <span ref={ref} aria-label={final} {...rest}>
      <span aria-hidden="true" style={{ fontVariantNumeric: "tabular-nums" }}>
        {prefix}
        {format.format(value)}
        {suffix}
      </span>
    </span>
  );
}
