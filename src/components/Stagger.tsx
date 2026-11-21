import { Children, type ReactNode } from "react";
import { Reveal, type RevealProps } from "./Reveal";

export interface StaggerProps extends Omit<RevealProps, "children"> {
  /** Milisegundos entre un hijo y el siguiente. */
  step?: number;
  children: ReactNode;
}

/**
 * Envuelve cada hijo en un `Reveal` y los hace entrar en cascada.
 * Los hijos quedan como hermanos directos, así funciona dentro de una grilla.
 */
export function Stagger({ step = 100, delay = 0, children, ...rest }: StaggerProps) {
  return (
    <>
      {Children.toArray(children).map((child, i) => (
        <Reveal key={i} delay={delay + i * step} {...rest}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
