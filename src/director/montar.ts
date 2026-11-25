// El Director: hace correr una partitura sobre una parte de la página, con lo que el navegador ya trae.
// Tres ejecutores: (1) tiempo, con animaciones nativas; (2) scroll, con líneas de tiempo nativas o, si no hay, movidas
// a mano; (3) el compás, un solo bucle para lo que sigue al dedo o a la velocidad, que vive en seguir.ts y se baja
// aparte. Las reglas de la casa viven aquí, no en cada partitura. Sin React.
import { inicios } from "./calendario";
import { cortar, MARCA, type Corte } from "./cortar";
import { avanceEn, curvaCss, fotogramasSueltos, fotogramasTiempo, tramoLocal, tramoScroll, type Nivel } from "./fotogramas";
import { TOPES, type Cambio, type Partitura, type PasoTiempo, type Por } from "./modelo";
import { darProfundidad } from "./profundidad";
import type { Seguimiento } from "./seguir";
import { validarPartitura, type ErrorPartitura } from "./validar";

export interface OpcionesMontar {
  /** Nombre de actor → selector, para piezas que no llevan `data-mk-parte`. Lo pasa quien monta, nunca la partitura. */
  partes?: Record<string, string>;
  nivel?: Nivel;
  /** «manual»: nada avanza solo; se mueve con `irA`, `avanzar` y `senal` (para pruebas). */
  reloj?: "normal" | "manual";
  /** Si la partitura no vale: no se monta nada y se avisa aquí. */
  alFallar?: (errores: ErrorPartitura[]) => void;
}

export interface Montaje {
  desmontar(): void;
  /** Busca los actores de nuevo (si el contenido llegó después). */
  rearmar(): void;
  /** Con reloj manual: lleva las escenas `verse` a un instante (ms). */
  irA(ms: number): void;
  /** Con reloj manual: mueve el compás (ms). */
  avanzar(ms: number): void;
  /** Con reloj manual: pone una señal continua. `vista` y `scroll`: de 0 a 1. `velocidad`: de -1 a 1. `puntero`: x e y de -1 a 1. */
  senal(nombre: "vista" | "scroll" | "puntero" | "velocidad", valor: number | { x: number; y: number }): void;
}

const NADA = () => {};
const VACIO: Montaje = { desmontar: NADA, rearmar: NADA, irA: NADA, avanzar: NADA, senal: NADA };

/** Lo que se puede apretar: bajo el cursor, el foco o el dedo, no se mueve. */
const TOCABLES = "a,button,input,select,textarea,summary,label,[role=button],[tabindex]";

/** Qué escena es dueña de la opacidad de cada actor (el validador garantiza que es una sola). */
export function duenosDeOpacidad(p: Partitura): Map<string, number> {
  const duenos = new Map<string, number>();
  p.escenas.forEach((e, i) => {
    for (const paso of e.pasos) {
      const toca = (paso as PasoTiempo).de?.opacidad !== undefined || (paso as PasoTiempo).a?.opacidad !== undefined;
      if (toca && !duenos.has(paso.actor)) duenos.set(paso.actor, i);
    }
  });
  return duenos;
}

/** Con varias piezas, cada una ocupa la mitad del tramo y parten en cascada: la primera al inicio, la última al medio. */
export function rangoDePieza(entre: [number, number] | undefined, k: number, n: number, reparto = 0.5): [number, number] {
  const [a, b] = entre ?? [0, 1];
  if (n <= 1) return [a, b];
  // `reparto`: qué parte del tramo ocupa cada pieza. Lo que sobra es lo que se demora la cascada entera.
  const largo = (b - a) * reparto;
  const inicio = a + ((b - a - largo) * k) / (n - 1);
  return [inicio, inicio + largo];
}

type ConLineas = {
  ViewTimeline?: new (o: { subject: Element }) => AnimationTimeline;
  ScrollTimeline?: new (o: { source: Element }) => AnimationTimeline;
};

/** Monta una partitura sobre `raiz`. Con un dato (lo que sale de un JSON) nunca lanza: si algo no se puede, la página queda como está. */
export function montar(raiz: HTMLElement, partitura: Partitura, opciones: OpcionesMontar = {}): Montaje {
  if (typeof document === "undefined" || !raiz || typeof raiz.animate !== "function") {
    // Aun así se revisa, para avisar de una partitura mala también fuera del navegador.
    const r = validarPartitura(partitura);
    if (!r.ok) opciones.alFallar?.(r.errores);
    return VACIO;
  }
  const r = validarPartitura(partitura);
  if (!r.ok) {
    opciones.alFallar?.(r.errores);
    return VACIO;
  }
  // Una copia: si quien la pasó la cambia después, aquí no corre nada que no se haya validado.
  const p: Partitura = typeof structuredClone === "function" ? structuredClone(r.partitura) : (JSON.parse(JSON.stringify(r.partitura)) as Partitura);
  const manual = opciones.reloj === "manual";
  const medio = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  let vivo = true;
  /** Las escenas `verse` ya partieron: al rearmar no se repiten. */
  let partio = manual;
  /** Al rearmar (React cambió un texto): en qué instante (ms) iba cada escena `verse`, para seguir desde ahí y no repetir lo que ya pasó. */
  const relojes = new Map<number, number>();
  let actual = armar();

  function rearmar() {
    if (!vivo) return;
    actual.desmontar();
    actual = armar();
  }
  // Regla de la casa: si la persona pide menos movimiento con la página abierta, se rearma (y al revés).
  medio?.addEventListener?.("change", rearmar);

  function armar(): Omit<Montaje, "rearmar"> {
    const nivel: Nivel = medio?.matches ? "quieto" : (opciones.nivel ?? "completo");
    // Regla de la casa: en quieto no hay ninguna animación; todo queda en su estado final, que es la página tal cual.
    if (nivel === "quieto") return VACIO;
    const liviano = nivel === "liviano";
    const limpiar: (() => void)[] = [];
    /** Un actor con el texto cortado: cuántas animaciones siguen moviendo sus piezas, y si alguna las necesita siempre. */
    type Cortado = { el: HTMLElement; por: Por; corte: Corte; pendientes: number; fijo: boolean };
    const cortes = new Map<HTMLElement, Cortado>();
    const corteDe = new Map<HTMLElement, Cortado>();
    /** Cuántas animaciones le queda por armar a esta partitura (tope de la partitura entera; el de los que siguen va en seguir.ts). */
    let quedanAnimaciones: number = TOPES.animaciones;
    /** La transformación que cada pieza trae del CSS de la página, leída antes de animarla. */
    const propias = new Map<HTMLElement, string>();
    let pidioRearmar = false;
    const pedirRearmar = () => {
      if (pidioRearmar) return;
      pidioRearmar = true;
      queueMicrotask(rearmar);
    };

    /** Los elementos de un actor (la raíz también puede serlo). */
    const buscar = (nombre: string): HTMLElement[] => {
      // Solo lo que el mapa trae de verdad (un actor llamado «constructor» no saca nada de los objetos).
      const delMapa = opciones.partes && Object.prototype.hasOwnProperty.call(opciones.partes, nombre) ? opciones.partes[nombre] : undefined;
      const selector = typeof delMapa === "string" ? delMapa : `[data-mk-parte="${nombre}"]`;
      try {
        // Lo que está dentro de otra partitura (una adentro de otra) es de esa, no de esta.
        const propio = (el: HTMLElement) => {
          const otra = el.parentElement?.closest("[data-mk-partitura]");
          return !otra || otra === raiz || !raiz.contains(otra);
        };
        return [...(raiz.matches(selector) ? [raiz] : []), ...[...raiz.querySelectorAll<HTMLElement>(selector)].filter(propio)].slice(0, TOPES.piezas);
      } catch {
        return [];
      }
    };
    /** Las piezas de un actor: él mismo, sus hijos, sus palabras o sus letras. */
    const piezasDe = (nombre: string, por?: Por, mascara = false): HTMLElement[] => {
      const piezas: HTMLElement[] = [];
      for (const el of buscar(nombre)) {
        // El tope se mira antes de cortar: no se corta lo que después no se va a mover.
        if (piezas.length >= TOPES.piezas) break;
        if (!por) piezas.push(el);
        else if (por === "hijo") piezas.push(...[...el.children].filter((h): h is HTMLElement => h instanceof HTMLElement && !h.hasAttribute(MARCA)));
        else {
          // Un actor se corta una sola vez (el validador asegura que siempre se pide igual).
          let hecho = cortes.get(el);
          if (!hecho) {
            hecho = { el, por, corte: cortar(el, por, mascara, pedirRearmar), pendientes: 0, fijo: false };
            cortes.set(el, hecho);
            for (const pieza of hecho.corte.piezas) corteDe.set(pieza, hecho);
          }
          piezas.push(...(hecho.por === por ? hecho.corte.piezas : [el]));
        }
      }
      return piezas.slice(0, TOPES.piezas);
    };
    /** Regla de la casa: el texto no queda cortado más de lo necesario. Cuando ya nadie mueve sus piezas, vuelve a estar entero. */
    const soltarSiPuede = (c: Cortado) => {
      if (c.fijo || c.pendientes > 0 || cortes.get(c.el) !== c) return;
      cortes.delete(c.el);
      c.corte.soltar();
    };

    const estilo = getComputedStyle(raiz);
    const curvaDelEstilo = estilo.getPropertyValue("--mk-resorte-curva").trim();
    const msDelEstilo = parseFloat(estilo.getPropertyValue("--mk-resorte-ms"));
    const resorteDelEstilo = /^(linear|cubic-bezier)\(/.test(curvaDelEstilo) && msDelEstilo > 0 ? { curva: curvaDelEstilo, ms: Math.min(msDelEstilo, TOPES.dura) } : null;
    /** Anima sin lanzar: una curva que este navegador no entiende cae a la de siempre. */
    /** `id`: el nombre de la animación (`mk-verse`, `mk-estado`, `mk-vista`, `mk-scroll`), para depurar y para las pruebas. */
    const animar = (el: HTMLElement, f: Keyframe[], o: KeyframeAnimationOptions, id: string): Animation | null => {
      if (quedanAnimaciones <= 0) return null;
      quedanAnimaciones--;
      try {
        return el.animate(f, { ...o, id });
      } catch {
        try {
          return el.animate(f, { ...o, id, easing: curvaCss("suave").easing });
        } catch {
          return null;
        }
      }
    };
    /** Lo que se inclina en una escena continua o de estado necesita profundidad en su padre. */
    const inclinado = (paso: { de?: Cambio; a?: Cambio }) => [paso.de, paso.a].some((c) => c && (c.inclinaX !== undefined || c.inclinaY !== undefined));
    const conProfundidad = (el: HTMLElement) => limpiar.push(darProfundidad(el.parentElement));

    // --- Lo que se ve y lo que se toca ---
    let aLaVista = manual || typeof IntersectionObserver === "undefined";
    const frenos: (Element | null)[] = [null, null, null]; // apuntado, enfocado, apretado
    const toca = (el: Element, t: Element | null) => t !== null && (el.contains(t) || t.contains(el));
    /** ¿Este elemento contiene algo que se está tocando, o está dentro de eso? Y con qué: el foco pesa más. */
    const toque = (el: Element): "foco" | "cursor" | null => (toca(el, frenos[1]) ? "foco" : toca(el, frenos[0]) || toca(el, frenos[2]) ? "cursor" : null);
    const tocado = (el: Element) => toque(el) !== null;
    /** Lo que hay que volver a mirar cuando la raíz entra a la vista. */
    const alVerse: (() => void)[] = [];

    // --- Ejecutor 1: tiempo (escenas `verse`) ---
    const porTiempo: { a: Animation; el: HTMLElement; repetir: boolean; inicio: number; fin: number; escena: number; termino: boolean }[] = [];
    const opacidadDe = duenosDeOpacidad(p);
    /** Las piezas que ya tienen una animación por tiempo (en cualquier escena `verse`). */
    const vistos = new Set<HTMLElement>();
    p.escenas.forEach((escena, i) => {
      if (escena.con !== "verse") return;
      const repetir = escena.repetir === true;
      // Al rearmar (React cambió un texto), la escena sigue desde donde iba: lo que ya pasó no entra de nuevo.
      const desde = partio && !manual ? (relojes.get(i) ?? 0) : null;
      const pasos = escena.pasos.map((paso) => {
        const curva = curvaCss(paso.curva, resorteDelEstilo);
        return { paso, curva, piezas: piezasDe(paso.actor, paso.por, paso.mascara), tiempos: { ...paso, dura: paso.dura ?? curva.ms } };
      });
      const turnos = inicios(pasos.map((x) => x.tiempos), pasos.map((x) => x.piezas.length), liviano);
      pasos.forEach(({ paso, curva, piezas }, k) => {
        // En liviano una entrada funde, salvo que la opacidad del actor sea de otra escena: ahí solo aparece.
        const f = fotogramasTiempo(paso, nivel, (opacidadDe.get(paso.actor) ?? i) === i);
        if (!f) return;
        piezas.forEach((el, n) => {
          const inicio = turnos[k].inicio + n * turnos[k].cada;
          const fin = inicio + turnos[k].dura;
          const yaPaso = desde !== null && fin <= desde;
          // La primera animación de una pieza la sostiene también antes de partir (así no se ve antes de entrar).
          const primera = !vistos.has(el);
          vistos.add(el);
          // Lo que ya terminó y no deja nada puesto no se arma de nuevo (salvo que la escena se repita al volver a verse).
          if (yaPaso && !paso.a && !repetir) return;
          // Si la pieza ya trae una transformación en el CSS (centrada, girada), la entrada se suma a ella y no la reemplaza.
          if (!propias.has(el)) propias.set(el, getComputedStyle(el).transform);
          const propia = propias.get(el);
          const cuadros = propia && propia !== "none" ? f.map((c) => (typeof c.transform === "string" ? { ...c, transform: `${propia} ${c.transform}` } : c)) : f;
          const a = animar(el, cuadros, { duration: turnos[k].dura, delay: inicio, easing: curva.easing, fill: primera ? "both" : paso.a ? "forwards" : "none" }, "mk-verse");
          if (!a) return;
          a.pause();
          const turno = { a, el, repetir, inicio, fin, escena: i, termino: false };
          // El texto cortado se suelta cuando terminan todas sus piezas, salvo que algo las necesite siempre.
          const cortado = corteDe.get(el);
          const cuenta = cortado !== undefined && !repetir && !paso.a;
          if (cortado && !cuenta) cortado.fijo = true;
          if (cortado && cuenta) cortado.pendientes++;
          let contada = cuenta;
          a.onfinish = () => {
            turno.termino = true;
            // Regla de la casa: al terminar, si vuelve a su estado natural, se suelta. No queda sosteniendo nada.
            if (!paso.a) a.cancel();
            if (cortado && contada) {
              contada = false;
              cortado.pendientes--;
              soltarSiPuede(cortado);
            }
          };
          if (desde !== null) {
            // Una que ya había terminado se deja terminada (si se la pusiera en su final y después corriera, partiría de nuevo).
            if (yaPaso) {
              try {
                a.finish();
              } catch {
                a.cancel();
              }
            } else a.currentTime = desde;
          }
          porTiempo.push(turno);
        });
      });
    });
    const correr = () => {
      if (manual) return;
      for (const { a, el, inicio } of porTiempo) {
        if (a.playState === "finished" || a.playState === "idle") continue;
        const t = toque(el);
        // Regla de la casa: lo que se toca no queda escondido. Con el foco encima, o con el cursor o el dedo antes de
        // que le toque entrar, termina de una vez: se ve entero y en su lugar. Vale aunque la escena no haya partido.
        if (t === "foco" || (t === "cursor" && Number(a.currentTime) <= inicio)) {
          try {
            a.finish();
          } catch {
            a.cancel();
          }
          continue;
        }
        if (!partio) continue;
        // Reglas de la casa: fuera de la vista o con la pestaña oculta, se detiene; lo que se toca a media entrada se
        // queda donde va (no se mueve bajo el cursor) y sigue al soltarlo.
        if (!aLaVista || document.hidden || t) a.pause();
        else a.play();
      }
    };

    // --- `estado`: va mientras dura el estado y se devuelve al salir ---
    for (const escena of p.escenas) {
      if (escena.con !== "estado") continue;
      const [entra, sale] = escena.estado === "apuntado" ? [["pointerenter"], ["pointerleave"]] : escena.estado === "enfocado" ? [["focusin"], ["focusout"]] : [["pointerdown"], ["pointerup", "pointerleave", "pointercancel"]];
      const zonas = escena.sobre ? buscar(escena.sobre) : null;
      for (const paso of escena.pasos) {
        // Un estado es chico y lo manda la persona: en liviano va igual.
        const f = fotogramasSueltos({ a: paso.a }, "completo");
        if (!f) continue;
        for (const el of buscar(paso.actor)) {
          const zona = zonas ? (zonas.find((z) => z.contains(el)) ?? zonas[0]) : el;
          if (!zona) continue;
          if (inclinado(paso)) conProfundidad(el);
          let a: Animation | null = null;
          const ir = (hacia: 1 | -1) => () => {
            // Volver sin haber ido no es nada (el cursor pasó por encima sin apretar): si no, saltaría al final y volvería.
            if (hacia < 0 && !a) return;
            // La animación se crea la primera vez y se suelta al volver al reposo.
            a ??= animar(el, f, { duration: paso.dura ?? 180, easing: curvaCss(paso.curva, resorteDelEstilo).easing, fill: "both" }, "mk-estado");
            if (!a) return;
            // Ir cuando ya llegó tampoco: partiría de nuevo desde el reposo.
            if (hacia > 0 && a.playbackRate > 0 && a.playState === "finished") return;
            const esta = a;
            esta.onfinish = () => {
              if (esta.playbackRate < 0) {
                esta.cancel();
                a = null;
                // Se devuelve al tope: apuntar muchas veces no lo gasta.
                quedanAnimaciones++;
              }
            };
            esta.playbackRate = hacia;
            esta.play();
          };
          const [ida, vuelta] = [ir(1), ir(-1)];
          for (const t of entra) zona.addEventListener(t, ida);
          for (const t of sale) zona.addEventListener(t, vuelta);
          limpiar.push(() => {
            for (const t of entra) zona.removeEventListener(t, ida);
            for (const t of sale) zona.removeEventListener(t, vuelta);
            a?.cancel();
          });
        }
      }
    }

    // --- Ejecutor 2: scroll (escenas `vista` y `scroll`) ---
    const aMano = { vista: 0, scroll: 0 };
    /** Con reloj manual: lo que hay que volver a aplicar cuando cambia una de esas señales. */
    const alCambiarAMano: (() => void)[] = [];
    const ventana = window as unknown as ConLineas;
    for (const escena of p.escenas) {
      if (escena.con !== "vista" && escena.con !== "scroll") continue;
      const tramo = escena.con === "vista" ? (escena.tramo ?? "paso") : null;
      let linea: AnimationTimeline | null = null;
      try {
        if (manual) linea = null;
        else if (tramo) linea = ventana.ViewTimeline ? new ventana.ViewTimeline({ subject: raiz }) : null;
        else linea = ventana.ScrollTimeline ? new ventana.ScrollTimeline({ source: document.documentElement }) : null;
      } catch {
        linea = null;
      }
      /** Sin línea nativa: la misma animación, detenida, y llevada a mano según el avance. */
      const manuales: { a: Animation; rango: [number, number] }[] = [];
      for (const paso of escena.pasos) {
        const f = fotogramasSueltos(paso, nivel);
        if (!f) continue;
        const piezas = piezasDe(paso.actor, paso.por);
        piezas.forEach((el, k) => {
          // Lo atado al scroll necesita sus piezas mientras la partitura viva.
          const cortado = corteDe.get(el);
          if (cortado) cortado.fijo = true;
          const rango = rangoDePieza(paso.entre, k, piezas.length, paso.reparto);
          const { inicio, fin } = tramoScroll(tramo, rango);
          const o = { fill: "both", easing: curvaCss(paso.curva ?? "lineal").easing, ...(linea ? { timeline: linea, rangeStart: inicio, rangeEnd: fin } : { duration: 1000 }) } as KeyframeAnimationOptions;
          const a = animar(el, f, o, tramo ? "mk-vista" : "mk-scroll");
          if (!a) return;
          if (inclinado(paso)) conProfundidad(el);
          limpiar.push(() => a.cancel());
          if (!linea) {
            a.pause();
            manuales.push({ a, rango });
          }
        });
      }
      if (!manuales.length) continue;
      const cual = escena.con;
      let pendiente = true;
      const aplicar = () => {
        pendiente = false;
        const caja = raiz.getBoundingClientRect();
        const total = document.documentElement.scrollHeight - innerHeight;
        const avance = manual ? aMano[cual] : tramo ? avanceEn(caja, innerHeight, tramo) : total > 0 ? Math.max(0, Math.min(1, scrollY / total)) : 0;
        // Una página sin scroll no tiene avance: como la línea nativa, no se aplica nada (así no queda nada escondido).
        const sinRecorrido = !manual && !tramo && total <= 0;
        for (const { a, rango } of manuales) {
          if (sinRecorrido) {
            if (a.playState !== "idle") a.cancel();
            continue;
          }
          if (a.playState === "idle") a.pause();
          a.currentTime = tramoLocal(avance, rango) * 1000;
        }
      };
      aplicar();
      if (manual) {
        alCambiarAMano.push(aplicar);
        continue;
      }
      // Un cuadro por scroll. El avance de la página entera no depende de que la raíz se vea (puede mover una barra fija
      // arriba); el paso de la raíz por la pantalla sí: fuera de la vista espera, y se pone al día al volver.
      let cuadro = 0;
      const alBajar = () => {
        pendiente = true;
        if (tramo && !aLaVista) return;
        cuadro ||= requestAnimationFrame(() => {
          cuadro = 0;
          aplicar();
        });
      };
      if (tramo) alVerse.push(() => pendiente && alBajar());
      document.addEventListener("scroll", alBajar, { capture: true, passive: true });
      window.addEventListener("resize", alBajar);
      limpiar.push(() => {
        cancelAnimationFrame(cuadro);
        document.removeEventListener("scroll", alBajar, { capture: true });
        window.removeEventListener("resize", alBajar);
      });
    }

    // --- Ejecutor 3: lo que sigue al cursor o a la velocidad (se baja aparte: no todas las partituras lo usan) ---
    // Regla de la casa: en liviano no hay nada que siga al dedo ni a la velocidad.
    const queSiguen = liviano ? [] : p.escenas.filter((e) => e.con === "puntero" || e.con === "velocidad");
    let sigue: Seguimiento | null = null;
    let armado = true;
    if (queSiguen.length) {
      void import("./seguir")
        .then((m) => {
          if (armado) sigue = m.montarSeguir({ raiz, escenas: queSiguen, buscar, tocado, aLaVista: () => aLaVista, manual, tope: TOPES.seguidores });
        })
        // Si el archivo no baja, la página queda sin ese movimiento y nada más.
        .catch(() => {});
    }

    // --- Reglas de la casa: lo que se toca, la vista y la pestaña ---
    const tocable = (t: EventTarget | null) => (t instanceof Element ? t.closest(TOCABLES) : null);
    const alTocar = (ev: Event) => {
      const t = ev.type;
      if (t === "pointerover") frenos[0] = tocable(ev.target);
      else if (t === "pointerout") frenos[0] = tocable((ev as PointerEvent).relatedTarget);
      else if (t === "focusin") frenos[1] = tocable(ev.target);
      else if (t === "focusout") frenos[1] = tocable((ev as FocusEvent).relatedTarget);
      else frenos[2] = t === "pointerdown" ? tocable(ev.target) : null;
      correr();
      sigue?.despertar();
    };
    const TOQUES = ["pointerover", "pointerout", "focusin", "focusout", "pointerdown", "pointerup", "pointercancel"];
    if (!manual) for (const t of TOQUES) raiz.addEventListener(t, alTocar);

    const partir = () => {
      partio = true;
      correr();
    };
    const vista =
      !manual && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entradas) => {
              // Si llegan varios avisos juntos, vale el último.
              const e = entradas[entradas.length - 1];
              const antes = aLaVista;
              aLaVista = e.isIntersecting;
              // «Entra a la vista»: se ve un 15 %, o ya ocupa media pantalla (una raíz muy alta).
              if (aLaVista && (e.intersectionRatio >= 0.15 || e.intersectionRect.height >= (e.rootBounds?.height ?? innerHeight) * 0.5)) partio = true;
              if (antes && !aLaVista) {
                // Una escena que se repite vuelve a su inicio al salir, y espera.
                for (const { a, repetir } of porTiempo) {
                  if (!repetir) continue;
                  a.cancel();
                  a.pause();
                }
              } else if (!antes && aLaVista && partio) {
                for (const { a, repetir } of porTiempo) if (repetir && a.playState !== "running") a.currentTime = 0;
              }
              correr();
              if (aLaVista) for (const f of alVerse) f();
              sigue?.despertar();
            },
            { threshold: [0, 0.15, 0.5] },
          )
        : null;
    vista?.observe(raiz);
    // Una raíz mucho más alta que la pantalla nunca llega a verse un 15 %, y el observador de arriba solo avisa cuando
    // asoman sus primeros px. Este otro avisa cuando el comienzo de la raíz cruza la mitad de la pantalla.
    const mitad =
      vista && !partio
        ? new IntersectionObserver(
            (entradas) => {
              if (entradas[entradas.length - 1].isIntersecting) partir();
            },
            { rootMargin: "0px 0px -50% 0px" },
          )
        : null;
    mitad?.observe(raiz);
    if (!vista && !manual) partir();
    const alVolver = () => {
      correr();
      sigue?.despertar();
    };
    if (!manual) document.addEventListener("visibilitychange", alVolver);
    // Al imprimir, lo que todavía no entró sale igual: las entradas terminan de una vez.
    const alImprimir = () => {
      for (const { a } of porTiempo) {
        if (a.playState === "idle" || a.playState === "finished") continue;
        try {
          a.finish();
        } catch {
          a.cancel();
        }
      }
    };
    if (!manual) window.addEventListener("beforeprint", alImprimir);
    // Un corte que al final nadie usa (su paso ya había terminado) se suelta ahora.
    for (const c of [...cortes.values()]) soltarSiPuede(c);

    return {
      // Regla de la casa: al desmontar no queda nada.
      desmontar() {
        vista?.disconnect();
        mitad?.disconnect();
        document.removeEventListener("visibilitychange", alVolver);
        window.removeEventListener("beforeprint", alImprimir);
        for (const t of TOQUES) raiz.removeEventListener(t, alTocar);
        armado = false;
        sigue?.desmontar();
        // Por si esto es un rearme: se anota en qué instante iba cada escena (lo terminado cuenta por su final).
        if (partio) {
          const ahora = new Map<number, number>();
          for (const x of porTiempo) ahora.set(x.escena, Math.max(ahora.get(x.escena) ?? 0, x.termino ? x.fin : Number(x.a.currentTime) || 0));
          // Una escena que no se repite nunca retrocede; una que se repite queda donde esté ahora.
          for (const [i, ms] of ahora) relojes.set(i, p.escenas[i].con === "verse" && (p.escenas[i] as { repetir?: boolean }).repetir ? ms : Math.max(relojes.get(i) ?? 0, ms));
        }
        for (const { a } of porTiempo) {
          a.onfinish = null;
          a.cancel();
        }
        for (const f of limpiar) f();
        for (const { corte } of cortes.values()) corte.soltar();
      },
      irA(ms) {
        if (!manual) return;
        for (const { a } of porTiempo) {
          a.pause();
          a.currentTime = Math.max(0, ms);
        }
      },
      avanzar: (ms) => sigue?.avanzar(ms),
      senal(nombre, valor) {
        if (!manual) return;
        const acotar = (n: unknown, min: number) => (typeof n === "number" && Number.isFinite(n) ? Math.max(min, Math.min(1, n)) : 0);
        if (nombre === "vista" || nombre === "scroll") {
          aMano[nombre] = acotar(valor, 0);
          for (const f of alCambiarAMano) f();
        } else if (nombre === "puntero") {
          const v = valor as { x: number; y: number };
          sigue?.senal("puntero", acotar(v?.x, -1), acotar(v?.y, -1));
        } else sigue?.senal("velocidad", acotar(valor, -1), acotar(valor, -1));
      },
    };
  }

  return {
    desmontar() {
      if (!vivo) return;
      vivo = false;
      medio?.removeEventListener?.("change", rearmar);
      actual.desmontar();
    },
    rearmar,
    irA: (ms) => actual.irA(ms),
    avanzar: (ms) => actual.avanzar(ms),
    senal: (nombre, valor) => actual.senal(nombre, valor),
  };
}
