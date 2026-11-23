import { useEffect } from "react";

const CLAVE = "mk-apertura-vista";

/** Si la apertura ya se vio en esta sesión. Si el navegador no deja leer (modo privado estricto), se ve otra vez. */
export function aperturaYaVista(): boolean {
  try {
    return sessionStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}
const marcar = () => {
  try {
    sessionStorage.setItem(CLAVE, "1");
  } catch {
    /* sin sessionStorage: se vuelve a ver la próxima vez, sin romper nada */
  }
};
/** Para el editor: que la próxima vez se vea de nuevo. */
export function olvidarApertura() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    /* nada que olvidar */
  }
}

/**
 * Apertura de película: dos franjas negras que se abren, «X presenta…» y el título. Dura 2,6 s, se salta tocando o con
 * cualquier tecla y queda marcada para no repetirse en la sesión. Es decorativa (`aria-hidden`): el título real ya
 * está en el encabezado.
 */
export function Apertura({ presenta, titulo, alTerminar }: { presenta?: string; titulo: string; alTerminar: () => void }) {
  useEffect(() => {
    marcar();
    const t = setTimeout(alTerminar, 2600);
    window.addEventListener("keydown", alTerminar);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", alTerminar);
    };
  }, [alTerminar]);
  return (
    <div className="mk-enc-apertura" aria-hidden="true" onPointerDown={alTerminar}>
      <i className="mk-ap-franja" data-lado="arriba" />
      <i className="mk-ap-franja" data-lado="abajo" />
      <div className="mk-ap-texto">
        {presenta && <small>{presenta}</small>}
        <b>{titulo}</b>
      </div>
    </div>
  );
}
