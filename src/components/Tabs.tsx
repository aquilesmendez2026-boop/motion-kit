import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface TabsItem {
  id: string;
  label: ReactNode;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: TabsItem[];
  /** `id` de la pestaña activa. */
  value: string;
  onChange: (id: string) => void;
  /** Color de la píldora que marca la pestaña activa. */
  accent?: string;
  /** Nombre del grupo para lectores de pantalla. */
  label?: string;
}

/**
 * Selector de pestañas con una píldora que se desliza hasta la activa.
 * Sirve para "mensual / anual", filtros o secciones. Se maneja con las flechas.
 * El contenido de cada pestaña lo dibuja quien lo usa, según `value`.
 */
export function Tabs({
  items,
  value,
  onChange,
  accent = "#7c5cff",
  label,
  style,
  ...rest
}: TabsProps) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const active = Math.max(0, items.findIndex((item) => item.id === value));

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const button = list.querySelectorAll<HTMLElement>('[role="tab"]')[active];
      if (button) setPill({ left: button.offsetLeft, width: button.offsetWidth });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active, items.length]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (active + step + items.length) % items.length;
    onChange(items[next].id);
    listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{
        position: "relative",
        display: "inline-flex",
        maxWidth: "100%",
        padding: 4,
        borderRadius: 999,
        background: "rgba(128, 128, 128, 0.16)",
        ...style,
      }}
      {...rest}
    >
      {pill && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: 0,
            width: pill.width,
            borderRadius: 999,
            background: accent,
            transform: `translate3d(${pill.left}px, 0, 0)`,
            transition: reduced
              ? "none"
              : "transform 380ms cubic-bezier(0.34, 1.25, 0.64, 1), width 380ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      )}
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={i === active}
          tabIndex={i === active ? 0 : -1}
          onClick={() => onChange(item.id)}
          style={{
            position: "relative",
            minHeight: 40,
            padding: "8px 18px",
            border: 0,
            borderRadius: 999,
            background: "transparent",
            color: i === active ? "#fff" : "inherit",
            font: "inherit",
            fontWeight: 600,
            whiteSpace: "nowrap",
            cursor: "pointer",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            transition: reduced ? "none" : "color 250ms ease",
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
