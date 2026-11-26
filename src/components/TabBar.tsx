import type { HTMLAttributes, ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { c } from "../interfaz/tema";

export interface TabBarItem {
  id: string;
  label: string;
  /** Ícono opcional (un SVG, un emoji, lo que sea). */
  icon?: ReactNode;
}

export interface TabBarProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  items: TabBarItem[];
  /** `id` de la pestaña activa. */
  value: string;
  onChange: (id: string) => void;
  /** Color de la marca que se desliza bajo la pestaña activa (por defecto, el acento del tema). */
  accent?: string;
  /** `fixed` la pega al borde inferior de la pantalla. */
  position?: "fixed" | "sticky" | "static";
}

/**
 * Barra de navegación inferior para móvil, con una marca que se desliza hasta
 * la pestaña activa. Queda al alcance del pulgar.
 */
export function TabBar({
  items,
  value,
  onChange,
  accent = c("acento"),
  position = "fixed",
  style,
  ...rest
}: TabBarProps) {
  const reduced = useReducedMotion();
  const active = Math.max(0, items.findIndex((item) => item.id === value));

  return (
    <nav
      style={{
        position,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 900,
        paddingBottom: "env(safe-area-inset-bottom)",
        background: `color-mix(in srgb, ${c("superficie")} 88%, transparent)`,
        color: c("texto"),
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderTop: `1px solid ${c("borde")}`,
        ...style,
      }}
      {...rest}
    >
      <div style={{ position: "relative", display: "flex" }}>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 6,
            bottom: 6,
            left: 0,
            width: `${100 / items.length}%`,
            padding: "0 8px",
            boxSizing: "border-box",
            transform: `translate3d(${active * 100}%, 0, 0)`,
            transition: reduced
              ? "none"
              : "transform 420ms cubic-bezier(0.34, 1.3, 0.64, 1)",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              display: "block",
              height: "100%",
              borderRadius: 14,
              background: accent,
              opacity: 0.22,
            }}
          />
        </span>

        {items.map((item) => {
          const isActive = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onChange(item.id)}
              style={{
                position: "relative",
                flex: 1,
                minWidth: 0,
                minHeight: 56,
                display: "grid",
                placeItems: "center",
                gap: 2,
                padding: "8px 4px",
                border: 0,
                background: "transparent",
                color: "inherit",
                font: "inherit",
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                opacity: isActive ? 1 : 0.6,
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                transition: reduced ? "none" : "opacity 250ms ease",
              }}
            >
              {item.icon != null && (
                <span aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
