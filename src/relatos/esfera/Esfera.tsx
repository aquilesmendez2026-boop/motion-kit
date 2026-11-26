// Esfera (relato de página «esfera»): arriba de la página, una esfera de puntos que flota a un costado y gira. Al
// empezar a bajar se disuelve (cada punto a su ritmo, en la primera media pantalla) y sus puntos se acomodan en los
// bloques de toda la página: en el contorno de tarjetas, fotos y botones o, si un bloque no tiene, en su borde. Ahí se
// quedan y bajan con la página; al volver arriba, se vuelve a armar. Se dibuja en un lienzo pegado a la pantalla dentro
// de la página (como el cielo del relato «luz»), recortado a la página y borrado donde hay contenido: nunca lo tapa. Gira
// al cargar y al bajar, y después descansa (batería). Mientras un bloque entra con su relato (corrido), el corte de cada
// cosa suya abarca su lugar y el corrido (y un poco más, por las piezas que entran por su cuenta). Si la página no tiene dónde acomodarlos (todo es contenido entero), la esfera se desvanece.
// Se baja aparte (lo carga `PaginaRelato`). En liviano, los puntos ya acomodados y quietos; donde la página no baja (la
// vista previa), la esfera armada.
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { crearLienzo, CSS_LIENZO, type Lienzo } from "../../efectos/lienzo";
import { useStyles } from "../../utils/styles";
import type { Punto } from "../hilos/trazar";
import { contenedorScroll } from "../hilos/medir";
import { useMedidaFina } from "../hilos/useMedidaFina";
import { PUNTOS_ESFERA, avancePunto, colorDe, disolucion, lugarEsfera, objetivosPagina, proyectar, puntosEsfera, reparto, type LugarEsfera } from "./calculo-esfera";

// Sobre los bloques (también sobre el interior que el relato «profundidad» levanta a 1), bajo los velos (3) y la cinta.
export const CSS_ESFERA =
  ".mk-esfera-capa{position:sticky;top:0;height:var(--mk-alto-vista,100vh);margin-bottom:calc(var(--mk-alto-vista,100vh) * -1);z-index:2;pointer-events:none;overflow:clip}";

/** Cuánto se borra alrededor del contenido (px). */
const MARGEN = 6;
/** Radianes por segundo, y la inclinación de la esfera. */
const GIRO = 0.35;
const INCLINACION = 0.35;
/** Cuánto más se alarga el corte de una cosa mientras su bloque entra (sus piezas pueden entrar por su cuenta), en px. */
const ENTRANDO = 28;
/** Cuánto sigue dibujando después de un scroll aunque no gire (ms): lo que tardan los bloques en terminar de entrar. */
const DESPUES = 1500;
/** Cuánto gira después de cargar o de bajar (ms); después descansa. */
export const GIRA = 4000;

export interface Hueco {
  x: number;
  y: number;
  w: number;
  h: number;
}
/**
 * Dibuja (`dibujar`) y después borra los huecos: así una zona cubierta por dos huecos que se pisan (un botón y su
 * texto) también queda borrada.
 */
export function pintarCortado(ctx: CanvasRenderingContext2D, ancho: number, alto: number, huecos: Hueco[], dibujar: () => void): void {
  ctx.clearRect(0, 0, ancho, alto);
  dibujar();
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000";
  for (const h of huecos) ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.restore();
}

/** Dónde está un elemento en la página según el diseño (sin las transformaciones que lo corren), en px de la página. */
function lugarDe(el: HTMLElement, pagina: HTMLElement): { x: number; y: number } | null {
  let [x, y] = [0, 0];
  for (let p: Element | null = el; p && p !== pagina; p = (p as HTMLElement).offsetParent) {
    if (!(p instanceof HTMLElement)) return null;
    x += p.offsetLeft;
    y += p.offsetTop;
    if (p.offsetParent === null) return null;
  }
  return { x, y };
}
/**
 * Cuánto va corrido un bloque (mientras entra con su relato): se mira el bloque y lo que lo llena por dentro (el interior
 * del relato, la franja), cada uno contra su propio lugar en el diseño, y se toma el que más se corrió. En px de la página.
 */
function corrimiento(e: HTMLElement, pagina: HTMLElement, pr: DOMRect, escala: number): { x: number; y: number } {
  let mejor = { x: 0, y: 0 };
  let el: Element | null = e;
  for (let nivel = 0; el instanceof HTMLElement && nivel < 3; nivel++) {
    const r: DOMRect = el.getBoundingClientRect();
    const lugar = lugarDe(el, pagina);
    if (lugar) {
      const c = { x: (r.left - pr.left) / escala - lugar.x, y: (r.top - pr.top) / escala - lugar.y };
      if (Math.abs(c.y) + Math.abs(c.x) > Math.abs(mejor.y) + Math.abs(mejor.x)) mejor = c;
    }
    // Baja al hijo que lo llena (si hay uno así).
    const w: number = r.width;
    el = [...el.children].find((h) => Math.abs(h.getBoundingClientRect().width - w) < 4) ?? null;
  }
  return Math.abs(mejor.x) + Math.abs(mejor.y) > 0.5 ? mejor : { x: 0, y: 0 };
}

export interface EsferaProps {
  pagina: RefObject<HTMLElement | null>;
  /** Liviano: los puntos ya acomodados y quietos. */
  quieta: boolean;
  /** Dónde flota (por ahora, siempre a la derecha; el resto queda listo para cuando la receta lo pida). */
  lugar?: LugarEsfera;
}

export default function Esfera({ pagina, quieta, lugar = "derecha" }: EsferaProps) {
  useStyles("lienzo", CSS_LIENZO);
  useStyles("esfera", CSS_ESFERA);
  const capa = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const medida = useMedidaFina(pagina, [], { marcos: true });
  // Lo que sale de la medida (solo cuando ella cambia): cada bloque con su contenido, y a dónde va cada punto.
  const { bloques, objetivos } = useMemo(() => {
    const bloques = (medida?.medidas.bloques ?? []).map((b) => ({ caja: b.caja, fondo: b.fondo, texto: b.texto, contenido: [...b.cosas, ...b.tarjetas], marcos: b.marcos ?? [], entera: b.entero === true }));
    return { bloques, objetivos: reparto(PUNTOS_ESFERA, objetivosPagina(bloques, PUNTOS_ESFERA)) as ((Punto & { b: number }) | null)[] };
  }, [medida]);
  const datos = useRef({ bloques, objetivos, quieta, baja: true, tope: 0, elementos: [] as HTMLElement[] });
  datos.current = { bloques, objetivos, quieta, baja: medida?.baja ?? true, tope: medida ? medida.medidas.recorrido - medida.medidas.arriba : 0, elementos: medida?.elementos ?? [] };
  const lienzoVivo = useRef<Lienzo | null>(null);
  // Cuando cambia lo medido, se vuelve a dibujar (aunque esté quieta).
  useEffect(() => {
    lienzoVivo.current?.correr();
  }, [bloques, quieta]);

  useEffect(() => {
    const cv = lienzo.current;
    const el = pagina.current;
    const caja = capa.current;
    if (!cv || !el || !caja) return;
    const bola = puntosEsfera(PUNTOS_ESFERA);
    let giro = 0;
    let escrita = -1;
    let ultimoMovimiento = performance.now();
    /** El color de cada bloque (cambia solo con la medida o con el acento del estilo). */
    let tintas: { de: unknown; color: string; lista: string[] } = { de: null, color: "", lista: [] };
    /** Lo que hace scroll (se vuelve a buscar cuando cambia la medida o el scroll viene de otro lado). */
    let contenedor = contenedorScroll(el);
    let medidaVista: unknown = null;
    /** Cómo iban corridos los bloques en el cuadro anterior: mientras cambie (un bloque que termina de entrar), se sigue. */
    let corridosAntes = "";
    const paso = (dt: number, l: Lienzo): boolean => {
      const { bloques, objetivos, quieta, baja, tope, elementos } = datos.current;
      if (medidaVista !== bloques) {
        medidaVista = bloques;
        contenedor = contenedorScroll(el);
      }
      const pr = el.getBoundingClientRect();
      const cr = cv.getBoundingClientRect();
      const escala = el.offsetWidth > 0 ? pr.width / el.offsetWidth : 1;
      // El lienzo está dentro de la página (achicada con ella): sus px son los de la página, corridos.
      const [dx, dy] = [(pr.left - cr.left) / escala, (pr.top - cr.top) / escala];
      // Lo que se ve de la página en el lienzo: dentro de la pantalla (o de su contenedor) y dentro de la página.
      const vista = contenedor?.getBoundingClientRect() ?? { top: 0, bottom: window.innerHeight };
      const arribaVisto = Math.max(0, (vista.top - cr.top) / escala, dy);
      const abajoVisto = Math.min(l.alto, (vista.bottom - cr.top) / escala, dy + el.offsetHeight);
      const alto = Math.max(0, abajoVisto - arribaVisto);
      // Cuánto se disolvió: según lo que la página bajó. En liviano, ya acomodada; donde no baja, armada.
      const bajado = (vista.top - pr.top) / escala;
      const d = quieta ? 1 : !baja ? 0 : disolucion(bajado, (vista.bottom - vista.top) / escala, tope);
      // Cuánto va corrido cada bloque a la vista (mientras entra con su relato); los que no se ven, en su lugar.
      const corridos = bloques.map((b, k) => {
        const e = elementos[k];
        const y = b.caja.arriba + dy;
        return e && y < abajoVisto + 80 && y + b.caja.alto > arribaVisto - 80 ? corrimiento(e, el, pr, escala) : { x: 0, y: 0 };
      });
      /** Si no hay dónde acomodar los puntos (la página es todo contenido entero), la esfera se desvanece al disolverse. */
      const sinLugar = !objetivos.some(Boolean);
      if (tintas.de !== bloques || tintas.color !== l.color) {
        tintas = { de: bloques, color: l.color, lista: bloques.map((b) => colorDe(l.color, [b], { x: b.caja.izquierda, y: b.caja.arriba })) };
      }
      // Gira mientras haya esfera, al cargar y al bajar; después descansa (frena en el último segundo).
      const quietoHace = performance.now() - ultimoMovimiento;
      const gira = quieta || d >= 1 ? 0 : Math.max(0, Math.min(1, (GIRA - quietoHace) / 1000));
      giro += dt * GIRO * gira;
      // La esfera, a su lado y al medio de la pantalla, sin salirse de lo que se ve de la página.
      const sitio = lugarEsfera(lugar, l.ancho, alto);
      const radio = Math.max(0, Math.min(sitio.radio, alto / 2 - 8));
      const medio = ((vista.top + vista.bottom) / 2 - cr.top) / escala;
      const centro = { x: sitio.x, y: Math.min(Math.max(medio, arribaVisto + radio + 8), abajoVisto - radio - 8) };
      // Cada punto, entre su lugar en la esfera y su lugar en la página, según cuánto avanzó.
      const puntos = bola.map((p3, i) => {
        const q = proyectar(p3, giro, INCLINACION);
        const enEsfera = { x: centro.x + q.x * radio, y: centro.y + q.y * radio };
        const objetivo = objetivos[i] ?? null;
        const k = objetivo ? avancePunto(d, i, PUNTOS_ESFERA) : 0;
        const meta = objetivo ? { x: objetivo.x + dx, y: objetivo.y + dy } : enEsfera;
        // Sin dónde ir, se desvanece a medida que la esfera se disuelve.
        const queda = objetivo || !sinLugar ? 1 : 1 - avancePunto(d, i, PUNTOS_ESFERA);
        return { x: enEsfera.x + (meta.x - enEsfera.x) * k, y: enEsfera.y + (meta.y - enEsfera.y) * k, k, q, queda };
      });
      // Los huecos: lo que queda fuera de la página (arriba y abajo) y el contenido a la vista, agrandado.
      const huecos: Hueco[] = [
        { x: 0, y: 0, w: l.ancho, h: Math.max(0, dy) },
        { x: 0, y: dy + el.offsetHeight, w: l.ancho, h: Math.max(0, l.alto - dy - el.offsetHeight) },
      ];
      bloques.forEach((b, k) => {
        const m = corridos[k];
        // Mientras el bloque entra (corrido), cada cosa se corta en su lugar y en el corrido, con un margen más.
        const extra = m.x || m.y ? ENTRANDO : 0;
        for (const c of b.contenido) {
          const y = c.arriba + dy + Math.min(0, m.y) - MARGEN - extra;
          const h = c.alto + Math.abs(m.y) + 2 * (MARGEN + extra);
          if (y + h > 0 && y < l.alto) huecos.push({ x: c.izquierda + dx + Math.min(0, m.x) - MARGEN - extra, y, w: c.ancho + Math.abs(m.x) + 2 * (MARGEN + extra), h });
        }
      });
      pintarCortado(l.ctx, l.ancho, l.alto, huecos, () => {
        const ctx = l.ctx;
        for (const a of puntos) {
          // Fuera del lienzo no se dibuja; y si casi no se ve la página, la esfera no cabe: solo los que ya salieron.
          if (a.queda <= 0 || a.y < -4 || a.y > l.alto + 4 || (radio < 12 && a.k < 0.02)) continue;
          const [px, py] = [a.x - dx, a.y - dy];
          const b = bloques.findIndex((x) => px >= x.caja.izquierda && px <= x.caja.izquierda + x.caja.ancho && py >= x.caja.arriba && py <= x.caja.arriba + x.caja.alto);
          ctx.fillStyle = b >= 0 ? tintas.lista[b] : l.color;
          // Acomodado, cada punto se ve parejo; en la esfera, los de atrás más chicos y tenues.
          const tamano = a.q.tamano + (1.4 - a.q.tamano) * a.k;
          ctx.globalAlpha = (a.q.alfa + (0.85 - a.q.alfa) * a.k) * a.queda;
          ctx.beginPath();
          ctx.arc(a.x, a.y, tamano / 2 + 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      // Para las pruebas: cuánto se disolvió, con dos decimales, y cuántos bloques a la vista van entrando (solo al cambiar).
      const redondo = Math.round(d * 100) / 100;
      const entrando = corridos.filter((m) => m.x || m.y).length;
      if (redondo !== escrita || String(entrando) !== caja.dataset.entrando) {
        escrita = redondo;
        caja.dataset.disuelta = String(redondo);
        caja.dataset.entrando = String(entrando);
      }
      // Sigue mientras gire, un rato después de cada scroll (las entradas de los bloques empiezan y terminan después) y
      // mientras algún bloque a la vista se siga moviendo; si no, descansa hasta el próximo scroll.
      const firma = corridos.map((m) => `${Math.round(m.x)},${Math.round(m.y)}`).join(";");
      const moviendo = firma !== corridosAntes;
      corridosAntes = firma;
      return gira > 0 || moviendo || quietoHace < DESPUES;
    };
    const l = crearLienzo(cv, paso, undefined, 1.5);
    lienzoVivo.current = l;
    if (!l) return;
    l.correr();
    // Al bajar (en la ventana o en cualquier contenedor), se vuelve a dibujar: los puntos bajan con la página, el corte
    // cambia y, si todavía hay esfera, gira otra vez.
    const alBajar = (e: Event) => {
      // Si el scroll viene de algo que envuelve la página y no es lo que se tenía, ese es el que hace scroll ahora.
      const t = e.target;
      if (t instanceof HTMLElement && t !== contenedor && t.contains(el) && t !== document.scrollingElement) contenedor = t;
      ultimoMovimiento = performance.now();
      l.correr();
    };
    document.addEventListener("scroll", alBajar, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", alBajar, { capture: true });
      l.destruir();
      lienzoVivo.current = null;
    };
  }, [pagina, lugar]);

  return (
    <div ref={capa} className="mk-esfera-capa" aria-hidden="true" data-lugar={lugar}>
      <canvas ref={lienzo} className="mk-lienzo mk-esfera" />
    </div>
  );
}
