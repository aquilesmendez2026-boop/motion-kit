import { useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface AccordionItem {
  /** Título visible (la pregunta). */
  title: ReactNode;
  /** Contenido que se despliega (la respuesta). */
  content: ReactNode;
}

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
  /** Permite tener varios abiertos a la vez. */
  multiple?: boolean;
  /** Índices que parten abiertos. */
  defaultOpen?: number[];
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Lista de secciones que se abren y cierran con animación de alto. Pensada
 * para preguntas frecuentes. Se maneja con teclado y lectores de pantalla.
 */
export function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
  ...rest
}: AccordionProps) {
  const reduced = useReducedMotion();
  const baseId = useId();
  const [open, setOpen] = useState<number[]>(defaultOpen);

  const toggle = (i: number) =>
    setOpen((current) =>
      current.includes(i)
        ? current.filter((x) => x !== i)
        : multiple
          ? [...current, i]
          : [i]
    );

  return (
    <div {...rest}>
      {items.map((item, i) => {
        const isOpen = open.includes(i);
        const buttonId = `${baseId}-b-${i}`;
        const panelId = `${baseId}-p-${i}`;

        return (
          <div key={i} style={{ borderBottom: "1px solid rgba(128, 128, 128, 0.25)" }}>
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(i)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                width: "100%",
                minHeight: 48,
                padding: "16px 0",
                border: 0,
                background: "transparent",
                color: "inherit",
                font: "inherit",
                fontWeight: 600,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span>{item.title}</span>
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  fontSize: "1.4em",
                  lineHeight: 1,
                  transform: isOpen ? "rotate(45deg)" : "none",
                  transition: reduced ? "none" : `transform 350ms ${EASE}`,
                }}
              >
                +
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              // El truco de 0fr a 1fr anima el alto sin tener que medirlo.
              style={{
                display: "grid",
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                opacity: isOpen ? 1 : 0,
                visibility: isOpen ? "visible" : "hidden",
                transition: reduced
                  ? "none"
                  : `grid-template-rows 350ms ${EASE}, opacity 350ms ${EASE}, visibility 350ms`,
              }}
            >
              <div style={{ overflow: "hidden", minHeight: 0 }}>
                <div style={{ paddingBottom: 16 }}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
