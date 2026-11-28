// Una caja con un tema del catálogo: marca `data-mk-tema` y `data-mk-para`, declara todas sus variables (corta lo que
// hereda de afuera), monta sus adornos y carga su letra. Para el panel entero, la vista previa de la página o cualquier
// parte que necesite su propio tema.
import { useEffect, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { adornosDe, buscarTema, ladoDe, variablesDeTema } from "./aplicar";
import { useAdornos } from "./adornos";
import { cargarLetra } from "./letras";
import type { Para } from "./tipos";

export interface TemaProps extends HTMLAttributes<HTMLDivElement> {
  /** El id del tema (`lamente`, `taller`, `papel`…). Uno desconocido cae al de siempre de su lado. */
  tema?: string;
  para: Para;
  /** En la página, la paleta que eligió el negocio (cambia solo los colores). */
  paleta?: string;
  /** Los colores del modo oscuro, si el tema los tiene. */
  oscuro?: boolean;
  /** Sin cargar letras de Google (por ejemplo, si quien lo usa ya las cargó). */
  sinLetras?: boolean;
  children?: ReactNode;
}

export function Tema({ tema, para, paleta, oscuro, sinLetras, style, children, ...resto }: TemaProps) {
  const t = buscarTema(tema, para);
  const letra = ladoDe(t, para).letra;
  useAdornos(adornosDe(t.id, para));
  useEffect(() => {
    if (!sinLetras) cargarLetra(letra);
  }, [t.id, para, sinLetras]); // eslint-disable-line react-hooks/exhaustive-deps
  const vars = variablesDeTema(t.id, { para, paleta, oscuro }) as CSSProperties;
  return (
    <div {...resto} data-mk-tema={t.id} data-mk-para={para} style={{ ...vars, ...style }}>
      {children}
    </div>
  );
}
