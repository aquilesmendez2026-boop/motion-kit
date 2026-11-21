import { useEffect, useState, type HTMLAttributes } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useStyles } from "../utils/styles";

export interface TypewriterProps extends HTMLAttributes<HTMLSpanElement> {
  /** Una frase, o varias para que se vayan alternando. */
  text: string | string[];
  /** Milisegundos por letra al escribir. */
  speed?: number;
  /** Milisegundos que se queda la frase completa antes de borrarse. */
  pause?: number;
  /** Muestra el cursor parpadeando. */
  cursor?: boolean;
}

const CSS = `@keyframes motion-kit-blink { 50% { opacity: 0; } }`;

/**
 * Texto que se escribe solo, letra por letra. Con varias frases, escribe una,
 * la borra y pasa a la siguiente.
 */
export function Typewriter({
  text,
  speed = 45,
  pause = 1400,
  cursor = true,
  ...rest
}: TypewriterProps) {
  useStyles("typewriter", CSS);
  const reduced = useReducedMotion();
  const phrases = Array.isArray(text) ? text : [text];
  const key = phrases.join("\n");

  const [phrase, setPhrase] = useState(0);
  const [count, setCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPhrase(0);
    setCount(0);
    setDeleting(false);
  }, [key]);

  const letters = Array.from(phrases[phrase % phrases.length] ?? "");
  const loops = phrases.length > 1;

  useEffect(() => {
    if (reduced) return;
    let wait = speed;

    if (!deleting && count === letters.length) {
      if (!loops) return;
      wait = pause;
    } else if (deleting) {
      wait = speed / 2;
    }

    const timer = setTimeout(() => {
      if (!deleting && count === letters.length) {
        setDeleting(true);
      } else if (deleting && count === 0) {
        setDeleting(false);
        setPhrase((p) => (p + 1) % phrases.length);
      } else {
        setCount((c) => c + (deleting ? -1 : 1));
      }
    }, wait);
    return () => clearTimeout(timer);
  }, [reduced, deleting, count, letters.length, loops, speed, pause, phrases.length]);

  const shown = reduced ? phrases[0] : letters.slice(0, count).join("");

  return (
    <span aria-label={phrases.join(". ")} {...rest}>
      <span aria-hidden="true">
        {shown}
        {cursor && (
          <span
            style={{
              display: "inline-block",
              width: "0.08em",
              height: "1em",
              marginLeft: "0.08em",
              verticalAlign: "-0.12em",
              background: "currentColor",
              animation: reduced ? "none" : "motion-kit-blink 1s steps(1) infinite",
            }}
          />
        )}
      </span>
    </span>
  );
}
