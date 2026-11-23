import { Fragment, type HTMLAttributes } from "react";

export interface FraseRelatoProps extends HTMLAttributes<HTMLElement> {
  texto: string;
  como?: "p" | "h2" | "h3" | "div";
}

/**
 * Una frase marcada para el relato «Subtítulos»: cada palabra va en su `<span data-mk-palabra>`, que el relato enciende
 * una por una al bajar. Sin relato, se lee como texto normal.
 */
export function FraseRelato({ texto, como: Etiqueta = "p", ...resto }: FraseRelatoProps) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  return (
    <Etiqueta {...resto} data-mk-parte="frase">
      {palabras.map((p, i) => (
        <Fragment key={i}>
          <span data-mk-palabra="">{p}</span>
          {i < palabras.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Etiqueta>
  );
}
