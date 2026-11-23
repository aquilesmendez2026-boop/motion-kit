import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { useStyles } from "../utils/styles";
import { CSS_ESCENA } from "./css";

export interface SecuenciaScrollProps extends HTMLAttributes<HTMLElement> {
  /** URL de cada cuadro, en orden (WebP o AVIF, todos del mismo tamaño). */
  cuadros: string[];
  /** Cuánto scroll dura la secuencia (CSS). Por defecto 250svh. */
  largo?: string;
  /** Solo el primer cuadro (ahorro de datos o movimiento reducido): no baja los demás. */
  quieto?: boolean;
  /** Cómo llena la pantalla. */
  ajuste?: "contain" | "cover";
  alt?: string;
  /** Lo que va encima (título, texto). */
  children?: ReactNode;
}

/** Arma la lista de cuadros desde un patrón: `cuadrosDe("/lata/{n}.webp", 60, 3)` → /lata/001.webp … /lata/060.webp. */
export function cuadrosDe(patron: string, total: number, digitos = 3, desde = 1): string[] {
  return Array.from({ length: total }, (_, i) => patron.replace("{n}", String(desde + i).padStart(digitos, "0")));
}

/**
 * Un objeto gira o se arma mientras se baja, cuadro a cuadro (estilo páginas de Apple). Dibuja en un canvas fijo
 * mientras dura la sección. Baja el primer cuadro al tiro y el resto cuando la sección se acerca, de a poco.
 * Recursos: Blender → secuencia PNG → `cwebp` o ffmpeg a WebP. Presupuesto: 1 MB en celular, 2 MB en escritorio.
 */
export function SecuenciaScroll({ cuadros, largo = "250svh", quieto = false, ajuste = "contain", alt = "", children, className, style, ...resto }: SecuenciaScrollProps) {
  useStyles("escena", CSS_ESCENA);
  const seccion = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const sec = seccion.current;
    const cv = lienzo.current;
    const ctx = cv?.getContext("2d");
    if (!sec || !cv || !ctx || cuadros.length === 0) return;
    const reducido = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const parado = quieto || reducido;
    const imagenes: (HTMLImageElement | null)[] = cuadros.map(() => null);
    let actual = -1;
    let pedido = 0;
    let vivo = true;

    const cargarUno = (i: number) =>
      new Promise<void>((ok) => {
        if (imagenes[i]) return ok();
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          imagenes[i] = img;
          if (i === 0 || i === objetivo()) dibujar(true);
          ok();
        };
        img.onerror = () => ok();
        img.src = cuadros[i];
      });

    const objetivo = () => {
      if (parado) return 0;
      const r = sec.getBoundingClientRect();
      const recorrido = Math.max(1, r.height - innerHeight);
      const p = Math.max(0, Math.min(1, -r.top / recorrido));
      return Math.round(p * (cuadros.length - 1));
    };

    const dibujar = (forzar = false) => {
      pedido = 0;
      let i = objetivo();
      // Si ese cuadro no bajó todavía, el más cercano que sí.
      for (let d = 0; d < cuadros.length && !imagenes[i]; d++) {
        if (imagenes[i - d]) i -= d;
        else if (imagenes[i + d]) i += d;
      }
      const img = imagenes[i];
      if (!img || (i === actual && !forzar)) return;
      actual = i;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = Math.round(cv.clientWidth * dpr);
      const h = Math.round(cv.clientHeight * dpr);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      const e = ajuste === "cover" ? Math.max(w / img.naturalWidth, h / img.naturalHeight) : Math.min(w / img.naturalWidth, h / img.naturalHeight);
      const iw = img.naturalWidth * e;
      const ih = img.naturalHeight * e;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
      sec.dataset.cuadro = String(i);
    };
    const alScroll = () => {
      if (!pedido) pedido = requestAnimationFrame(() => dibujar());
    };

    cargarUno(0);
    let cerca: IntersectionObserver | undefined;
    if (!parado) {
      // El resto, de a 6 a la vez, recién cuando la sección se acerca.
      const cargarTodo = async () => {
        const orden = cuadros.map((_, i) => i).slice(1);
        for (let k = 0; k < orden.length && vivo; k += 6) await Promise.all(orden.slice(k, k + 6).map(cargarUno));
      };
      cerca = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          cargarTodo();
          cerca?.disconnect();
        }
      }, { rootMargin: "100% 0px" });
      cerca.observe(sec);
      addEventListener("scroll", alScroll, { passive: true });
      addEventListener("resize", alScroll);
    }
    return () => {
      vivo = false;
      cerca?.disconnect();
      cancelAnimationFrame(pedido);
      removeEventListener("scroll", alScroll);
      removeEventListener("resize", alScroll);
    };
  }, [cuadros, quieto, ajuste]);

  return (
    <section {...resto} ref={seccion} className={`mk-secuencia${className ? " " + className : ""}`} style={{ ...style, "--mk-sec-largo": quieto ? "auto" : largo } as CSSProperties} data-quieto={quieto ? "" : undefined}>
      <div className="mk-secuencia-fija">
        <canvas ref={lienzo} role="img" aria-label={alt} />
        {children && <div className="mk-secuencia-encima">{children}</div>}
      </div>
    </section>
  );
}
