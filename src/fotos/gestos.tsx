// Gestos de la galería: qué hacer con cada toque sobre el mosaico (ondas en la foto, abrir el visor). Se carga aparte
// con el primer gesto, y recién ahí baja lo que haga falta: el motor de fotos para las ondas o el visor para abrir.
import type { ReactNode } from "react";
import type { NivelEscena } from "../escena/nivel";

export interface OpcionesGaleria {
  /** Foto viva: la foto que se toca ondula. */
  ondas: boolean;
  /** Un toque corto abre la foto en el visor. */
  visor: boolean;
  fotos: { url: string; pie?: string }[];
  origenes: string[];
  nivel: NivelEscena;
}

type Galeria = typeof import("./galeria");
let galeria: Galeria | null = null;
/** Dónde partió el toque en curso: un arrastre (que es para hacer ondas) no abre el visor. */
let inicio: { x: number; y: number } | null = null;

/** Atiende un evento del mosaico (pointerover, pointerdown o click). `mostrar` dibuja el visor (o lo quita con null). */
export function atender(ev: Event, o: OpcionesGaleria, mostrar: (visor: ReactNode) => void): void {
  const blanco = ev.target instanceof Element ? ev.target : null;
  if (!blanco) return;
  const p = ev as PointerEvent;
  if (ev.type === "pointerdown") inicio = { x: p.clientX, y: p.clientY };
  if (ev.type !== "click") {
    const img = blanco.closest<HTMLImageElement>(".mk-m-foto img");
    if (!o.ondas || !img) return;
    const desde = { x: p.clientX, y: p.clientY };
    void import("./galeria")
      .then((m) => {
        galeria = m;
        return m.tomarFoto(img, o.origenes, desde);
      })
      .catch(() => {});
    return;
  }
  const boton = blanco.closest<HTMLElement>(".mk-m-foto-abrir");
  if (!o.visor || !boton) return;
  // Con el teclado (detail 0) abre siempre; con el dedo o el mouse, solo si casi no se movió.
  if (p.detail && inicio && Math.hypot(p.clientX - inicio.x, p.clientY - inicio.y) > 10) return;
  const botones = [...(boton.closest(".mk-m-mosaico-grilla")?.querySelectorAll<HTMLElement>(".mk-m-foto-abrir") ?? [])];
  const i = Math.max(0, botones.indexOf(boton));
  void import("./VisorFotos")
    .then((v) =>
      v.abrirCon(boton, o.nivel, () =>
        mostrar(<v.default fotos={o.fotos} inicial={i} origen={boton} nivel={o.nivel} miniatura={(k) => botones[k] ?? null} alCerrar={() => mostrar(null)} />),
      ),
    )
    .catch(() => {});
}

/** Al desmontar una galería: el lienzo de las ondas se suelta si estaba sobre una de sus fotos. */
export function soltar(grilla: Element): void {
  galeria?.soltarFoto(grilla);
}
