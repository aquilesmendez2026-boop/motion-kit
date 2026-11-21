import { useEffect, useState, type HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface WordRotateProps extends HTMLAttributes<HTMLSpanElement> {
  /** Palabras o frases cortas que se van turnando. */
  words: string[];
  /** Milisegundos que se muestra cada una. */
  interval?: number;
}

const CSS = `
@keyframes motion-kit-word-in {
  from { opacity: 0; transform: translate3d(0, 0.5em, 0); filter: blur(6px); }
}`;

/**
 * Palabra que cambia cada cierto tiempo dentro de un titular.
 * Ejemplo: "Páginas para <WordRotate words={["tiendas", "podcasts"]} />".
 */
export function WordRotate({ words, interval = 2200, style, ...rest }: WordRotateProps) {
  useStyles("word-rotate", CSS);
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || words.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [reduced, words.length, interval]);

  const word = words[index % words.length] ?? "";

  return (
    <span
      aria-label={words.join(", ")}
      style={{ display: "inline-block", ...style }}
      {...rest}
    >
      <span
        key={reduced ? "fija" : index}
        aria-hidden="true"
        style={{
          display: "inline-block",
          animation: reduced
            ? "none"
            : "motion-kit-word-in 500ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {word}
      </span>
    </span>
  );
}
