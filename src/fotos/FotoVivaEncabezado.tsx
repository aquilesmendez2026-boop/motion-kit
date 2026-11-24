// Foto viva del encabezado: el lienzo del motor, que va encima de la foto de siempre (o de las tomas). Se carga aparte
// y no importa nada del encabezado (así el paquete no se parte en más trozos). La foto la sigue dibujando el
// encabezado, en su mismo lugar: aquí solo se le avisa qué toma va mientras la foto viva las lleva.
// Al entrar, la foto se arma desde partículas (una vez por carga de página); ondula bajo el dedo o el cursor; con
// tomas, cambia de foto con un borde líquido. Si el motor no puede (sin WebGL, foto sin permiso o caída, contexto
// perdido), el lienzo no aparece y todo queda como sin foto viva.
import { useEffect, useRef, type CSSProperties } from "react";
import { origenPermitido, PARTICULAS_MAX } from "./calculos";
import { crearMotor, type Textura } from "./motor";

export interface FotoVivaEncabezadoProps {
  fotos: string[];
  /** Varias fotos que se suceden (dos o más). */
  tomas: boolean;
  /** Armar la foto desde partículas al entrar (falso si el encabezado ya tiene apertura). */
  particulas: boolean;
  /** Orígenes cuyas fotos permiten CORS. */
  origenes: string[];
  /** Qué toma va mientras la foto viva lleva las tomas; `undefined` cuando las suelta (sin lienzo, van solas). */
  alCambiarToma: (activa: number | undefined) => void;
}

const CAJA: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };
// El lienzo calza con la foto; el corrimiento de la profundidad y los filtros del tratamiento se los da el CSS del
// encabezado, igual que a la <img>. Su fondo tapa la foto mientras llegan las partículas.
const LIENZO = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;opacity:0;background:var(--mk-fondo,#000)";

/** Las partículas van una vez por carga de página. */
let yaSeArmo = false;
/** Para el editor: que la próxima foto viva se arme otra vez. */
export function olvidarParticulas() {
  yaSeArmo = false;
}

export default function FotoVivaEncabezado({ fotos, tomas, particulas, origenes, alCambiarToma }: FotoVivaEncabezadoProps) {
  const caja = useRef<HTMLDivElement>(null);
  const avisar = useRef(alCambiarToma);
  avisar.current = alCambiarToma;
  const lista = tomas ? fotos : fotos.slice(0, 1);
  const clave = lista.join("\n");
  const origenesClave = origenes.join("\n");

  useEffect(() => {
    const marco = caja.current;
    if (!marco || !lista.length || !lista.every((f) => origenPermitido(f, origenes, location.origin))) return;
    // El lienzo se crea aquí (no lo dibuja React): cada vez que esto corre parte con un contexto WebGL nuevo.
    const c = document.createElement("canvas");
    c.className = "mk-foto-viva";
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = LIENZO;
    marco.appendChild(c);
    const motor = crearMotor(c);
    if (!motor) {
      c.remove();
      return;
    }
    let vivo = true;
    let reloj = 0;
    let cambiando = false;
    const apagar = () => {
      vivo = false;
      window.clearInterval(reloj);
      motor.destruir();
      c.remove();
    };
    // Sin lienzo, las tomas vuelven a ir solas (siguen desde la foto en que iban).
    const fuera = () => {
      if (!vivo) return;
      apagar();
      avisar.current(undefined);
    };
    motor.alPerder(fuera);

    // Ondas: se escucha en todo el encabezado, porque el texto va encima de la foto.
    const zona = c.closest(".mk-enc") ?? marco.parentElement;
    let ultima = 0;
    const mover = (e: Event) => {
      const p = e as PointerEvent;
      const ahora = performance.now();
      if (ahora - ultima < 90) return;
      const r = c.getBoundingClientRect();
      const x = (p.clientX - r.left) / r.width;
      const y = (p.clientY - r.top) / r.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      ultima = ahora;
      motor.ondas(x, y);
    };
    zona?.addEventListener("pointermove", mover);
    zona?.addEventListener("pointerdown", mover);

    (async () => {
      const texturas: (Textura | null)[] = await Promise.all(lista.map((f) => motor.cargar(f)));
      if (!vivo) return;
      if (texturas.some((t) => !t)) return fuera();
      const ts = texturas as Textura[];
      // El lienzo aparece recién cuando ya dibujó algo: si la página cargó con el encabezado fuera de la vista, el
      // motor está en pausa y, sin esto, se vería un cuadro del color de fondo tapando la foto.
      motor.alPintar(() => {
        if (!vivo) return;
        c.style.opacity = "1";
        c.setAttribute("data-lista", "");
      });
      if (tomas) avisar.current(0);
      if (particulas && !yaSeArmo) {
        yaSeArmo = true;
        const telefono = window.matchMedia?.("(max-width: 700px), (pointer: coarse)").matches;
        await motor.particulas(ts[0], telefono ? PARTICULAS_MAX.telefono : PARTICULAS_MAX.escritorio);
        if (!vivo) return;
      }
      motor.mostrar(ts[0], tomas);
      if (ts.length < 2) return;
      let i = 0;
      reloj = window.setInterval(async () => {
        if (document.hidden || cambiando || !vivo) return;
        cambiando = true;
        const sig = (i + 1) % ts.length;
        await motor.liquido(ts[i], ts[sig], true);
        cambiando = false;
        if (!vivo) return;
        i = sig;
        avisar.current(sig);
      }, 5000);
    })();

    return () => {
      zona?.removeEventListener("pointermove", mover);
      zona?.removeEventListener("pointerdown", mover);
      if (vivo) {
        apagar();
        avisar.current(undefined);
      }
    };
    // `lista` y `origenes` entran por sus claves (son arreglos nuevos en cada render).
  }, [clave, origenesClave, tomas, particulas]);

  return <div ref={caja} aria-hidden="true" style={CAJA} />;
}
