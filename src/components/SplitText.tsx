import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { useInView } from "../hooks/useInView";
import { useReducedMotion } from "../hooks/useReducedMotion";

export interface SplitTextProps extends HTMLAttributes<HTMLElement> {
  /** Texto a animar. */
  text: string;
  /** Anima palabra por palabra o letra por letra. */
  by?: "word" | "char";
  /** Etiqueta HTML a usar (h1, h2, p, span...). */
  as?: ElementType;
  /** Milisegundos entre una pieza y la siguiente. */
  stagger?: number;
  /** Duración de cada pieza en milisegundos. */
  duration?: number;
  /** Espera inicial en milisegundos. */
  delay?: number;
  /** Las piezas entran desenfocadas y se aclaran. */
  blur?: boolean;
  /** Si es `true`, anima solo la primera vez. */
  once?: boolean;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Titular que aparece palabra por palabra (o letra por letra) al entrar en
 * pantalla. Los lectores de pantalla leen el texto completo de una vez.
 */
export function SplitText({
  text,
  by = "word",
  as: Tag = "span",
  stagger = 45,
  duration = 650,
  delay = 0,
  blur = false,
  once = true,
  ...rest
}: SplitTextProps) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLElement>({ once });
  const visible = reduced || inView;

  const words = text.split(/\s+/).filter(Boolean);
  let index = 0;

  const pieceStyle = (i: number): CSSProperties => ({
    display: "inline-block",
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : "translate3d(0, 0.6em, 0)",
    filter: blur && !visible ? "blur(8px)" : "none",
    transition: reduced
      ? "none"
      : ["opacity", "transform", "filter"]
          .map((p) => `${p} ${duration}ms ${EASE} ${delay + i * stagger}ms`)
          .join(", "),
  });

  return (
    <Tag ref={ref} aria-label={text} {...rest}>
      {words.map((word, w) => (
        <span key={w} aria-hidden="true">
          {by === "word" ? (
            <span style={pieceStyle(index++)}>{word}</span>
          ) : (
            <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {Array.from(word).map((char, c) => (
                <span key={c} style={pieceStyle(index++)}>
                  {char}
                </span>
              ))}
            </span>
          )}
          {w < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
