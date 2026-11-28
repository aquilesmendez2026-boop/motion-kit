# Guardar, copiar y confirmar + el cómic del panel: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Las 4 piezas del grupo 1 en `motion-kit/interfaz` y las 9 del grupo 3 en la entrada nueva `motion-kit/comic`, listas para que el front las use por dentro de sus propias piezas.

**Architecture:** Lo calculable de cada pieza (geometría de la guía, letra del estallido, punta de la mano, textos por estado) en módulos puros con `node:test`; los componentes al lado, con su CSS armado al montarse y los colores por `--mk-*`. Los dibujos de cómic salen de la maqueta `demo/Comic.tsx` a `src/comic/`. Vitrinas `#comic` (grupo 3) y `#panel` (grupo 1) y la prueba visual `scripts/verificar-comic.mjs`.

**Tech Stack:** React 19 + TS, Web Animations API, `node:test` (`node scripts/pruebas.mjs <filtro>`), Playwright, esbuild (pesos).

**Spec:** `docs/superpowers/specs/2026-11-27-guardar-y-comic-design.md`

## Global Constraints

- Sin dependencias; en lo que se anima, solo `transform`/`translate`/`scale`/`rotate` y `opacity`; móvil primero (44 px); «reducir movimiento»: nada se sacude, salta ni gira, solo fundidos cortos; sin `Math.random` en lo que se dibuja (semilla).
- Textos por defecto en español de Chile, todos cambiables. Cada pieza acepta `className`/`style`/props de su elemento.
- Colores por `c()` de `src/interfaz/tema.ts`; letra de cartel por `fuenteCartel()` (`var(--mk-fuente-cartel,'Arial Black','Helvetica Neue',sans-serif)`); amarillo de cómic por `var(--mk-cartel,#ffd23f)`.
- CSS armado al montarse (`let css; const estilos = () => (css ??= …)`), nunca un template con llamadas a nivel de módulo.
- Topes (gzip): `interfaz` **28**, `comic` **14**, `motion-kit` **105**; usos: `{ BotonQueGuarda }` < 2, `{ Copiar }` < 1,5, `{ Confirmar }` < 4, `{ Campo }` < 1,5, `{ Accordion, CountUp }` < 5; `{ Mano }` < 3, `{ Guia }` < 7, `{ Vacio }` < 4, `{ Celebrar }` < 4. Si algo no cabe: medir, recortar y, si aún no cabe, preguntar a Aquiles (no subir topes solo).
- Rama `comic`; sin commits hasta la orden de Aquiles. Versión `v0.6.0`: batería completa (`--todo`) antes de la etiqueta. No editar `src/`/`demo/` mientras corre una prueba visual.

## Review Focus

1. `BotonQueGuarda` que se desmonta mientras guarda (el dueño cambia de sección): sin errores ni avisos de React, sin relojes vivos.
2. `Confirmar` abierto y el dueño toca «Sí, borrar» dos veces rápido: `alConfirmar` se llama una vez (con `ocupado` o sin él).
3. `Guia` con un paso cuyo elemento aparece 800 ms después (la pantalla carga): no se salta; con uno que nunca aparece: se salta a los 1,5 s.
4. `Guia` en el teléfono con el elemento al borde inferior o detrás del teclado: la mano y el globo quedan dentro de la ventana.
5. `Celebrar` llamado dos veces seguidas (publicar dos veces): un solo estallido a la vista, sin confeti amontonado.

---

### Task 1: La entrada `comic` y los dibujos de base

**Files:**
- Create: `src/comic/{mano.ts,Mano.tsx,Globo.tsx,Estallido.tsx,Colgante.tsx}`, `src/entradas/comic.ts`, `pruebas/comic-dibujos.test.ts`, `scripts/verificar-comic.mjs`
- Modify: `src/interfaz/tema.ts` (`fuenteCartel`, `CARTEL`), `vite.config.ts` (entrada `comic`), `package.json` (`exports["./comic"]`), `scripts/medir-paquete.mjs` (ENTRADAS + `comic: 14`, `motion-kit: 105` con su comentario de la decisión, usos `{ Mano }`), `scripts/verificar-cambios.mjs` (`src/comic/`, `src/entradas/comic`, `demo/Comic` → `comic`), `scripts/humo.mjs` (`#comic`), `demo/Comic.tsx` (usa las piezas reales; queda como vitrina), `src/index.ts`
**Interfaces — Produces:**
```ts
// src/interfaz/tema.ts
export function fuenteCartel(): string;   // "var(--mk-fuente-cartel,'Arial Black','Helvetica Neue',sans-serif)"
export const CARTEL: string;              // "var(--mk-cartel,#ffd23f)"
// src/comic/mano.ts
export type Direccion = "derecha" | "izquierda" | "arriba" | "abajo";
export type Piel = "clara" | "media" | "morena" | "oscura";
export const PUNTA_MANO: Record<Direccion, { x: number; y: number }>; // fracción del ANCHO, desde la esquina sup. izq. de la caja ya girada
export function letraEstallido(texto: string, tamano: number): number; // px: min(22, tamano·0,95 / max(5, palabra más larga))
// componentes (props como la maqueta)
export function Mano(p: { ancho?: number; piel?: Piel; manga?: string; direccion?: Direccion; toca?: boolean; pop?: boolean } & HTMLAttributes<HTMLSpanElement>): JSX.Element;
export function Globo(p: { cola?: "abajo" | "arriba" | "izquierda" | "derecha"; entra?: boolean } & HTMLAttributes<HTMLSpanElement>): JSX.Element;
export function Estallido(p: { texto: string; tamano?: number; color?: string; late?: boolean } & HTMLAttributes<HTMLSpanElement>): JSX.Element;
export function Colgante(p: { texto: ReactNode; quieto?: boolean } & HTMLAttributes<HTMLSpanElement>): JSX.Element;
```
`PUNTA_MANO.derecha = {x: .973, y: .167}`; las demás salen de girar la caja W×W/2 sobre su centro (izquierda: `{x: .027, y: .167}`; arriba: `{x: .417, y: -.223}`; abajo: `{x: .583, y: .723}`).

- [ ] **Step 1: Pruebas** `pruebas/comic-dibujos.test.ts`: `comic: la punta de la mano por dirección` (los cuatro valores ±0,001); `comic: la letra del estallido se ajusta a la palabra más larga` (`letraEstallido("¡Nuevo!",120)` ≈ 16,3; `letraEstallido("¡Publicada!",130)` ≈ 11,2; `letraEstallido("Hi",300)` = 22; texto vacío no lanza); `comic: tema` (`fuenteCartel()` y `CARTEL` con su respaldo exacto).
- [ ] **Step 2:** `node scripts/pruebas.mjs comic-dibujos` → falla (no existe).
- [ ] **Step 3:** Escribir `mano.ts`, los 4 componentes (SVG y CSS de la maqueta; manga por defecto `c("acento")`; tinta `c("texto")`; relleno de globo `c("superficie")`; amarillo `CARTEL`; letra `fuenteCartel()`), `entradas/comic.ts`, la entrada en `vite.config.ts`, `exports`, topes y reglas. `demo/Comic.tsx` importa de `../src/entradas/comic`.
- [ ] **Step 4:** `node scripts/pruebas.mjs comic-dibujos` → bien.
- [ ] **Step 5: Parte visual `dibujos`** en `verificar-comic.mjs` (patrón de `verificar-panel.mjs`, `PARTES = ["dibujos","boton","copiar","campo","confirmar","vacio","guia","celebrar"]`): las 4 direcciones de `Mano` con el punto `PUNTA_MANO` cayendo sobre el píxel de la uña (±4 px en la captura); la mano que toca tiene una animación de `translate`/`transform` y sus `.mk-pop` aparecen; con movimiento reducido, ninguna animación; el texto del estallido no se sale de su caja (`scrollWidth ≤ clientWidth`); capturas en teléfono y escritorio.
- [ ] **Step 6:** `npm test`, `npm run typecheck`, `npm run build` + `npm run peso` (`comic` aparece con tope 14; `{ Mano }` < 3), `node scripts/verificar-comic.mjs <url> dibujos` → bien.

### Task 2: `BotonQueGuarda`

**Files:** Create `src/interfaz/guardar.ts`, `src/interfaz/BotonQueGuarda.tsx`, `pruebas/boton-guarda.test.ts`; Modify `src/entradas/interfaz.ts`, `src/index.ts`, `demo/Panel.tsx` (sección «Guardar»), `scripts/verificar-comic.mjs` (parte `boton`), `scripts/medir-paquete.mjs` (`{ BotonQueGuarda }` < 2), `scripts/medir-paquete.mjs` (`interfaz: 28`), `pruebas/interfaz.test.ts` (PIEZAS)
**Interfaces — Produces:**
```ts
export type EstadoGuardar = "listo" | "guardando" | "bien" | "mal";
export const DURA = { bien: 1600, mal: 2000 };
export function textoGuardar(e: EstadoGuardar, base: ReactNode, t: { guardando: string; bien: string; mal: string }): ReactNode;
export interface BotonQueGuardaProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  alGuardar?: () => Promise<unknown>; estado?: EstadoGuardar; textos?: Partial<{ guardando: string; bien: string; mal: string }>;
}
```
Textos por defecto: «Guardando…», «✓ Guardado», «No se pudo».

- [ ] **Step 1: Pruebas:** `guardar: los textos` (los 4 estados; `listo` devuelve `base`); `guardar: las duraciones` (`DURA`).
- [ ] **Step 2:** → falla. **Step 3:** escribir `guardar.ts`. **Step 4:** → bien.
- [ ] **Step 5: Parte visual `boton`** (antes del componente; pieza provisoria vacía): con una promesa de 600 ms que resuelve: «Guardando…» con `aria-busy` y el anillo, un segundo clic no vuelve a llamar (contador en la vitrina), «✓ Guardado» con una animación de `scale` (no de `transform`), vuelve a «Guardar» a los 1,6 s; con una que rechaza: «No se pudo» con animación de `translate` y vuelve a los 2 s; en «✓ Guardado» y en «No se pudo» se puede volver a tocar; el ancho del botón no cambia más de 1 px entre estados; desmontarlo mientras guarda (botón «Cambiar de sección» en la vitrina) no deja errores en la consola (Review Focus 1); dentro de un botón con `transform` propio al apretar (`:active{transform:translateY(3px)}` en la vitrina) el saltito y el hundido conviven (la animación usa `scale`); con movimiento reducido, sin animaciones.
- [ ] **Step 6:** Escribir el componente (relojes en refs, limpiados al desmontar y en cada cambio; la animación con WAAPI sobre `scale`/`translate`; el ancho mínimo medido con un espaciador oculto con el texto más largo).
- [ ] **Step 7:** `verificar-comic boton`, `en-safari`, `npm test`, build + peso → bien. Romper el bloqueo del segundo clic → falla; restaurar.

### Task 3: `Copiar` y `Campo`

**Files:** Create `src/interfaz/{Copiar.tsx,Campo.tsx,copiar.ts}`, `pruebas/copiar-campo.test.ts`; Modify entrada, índice, `demo/Panel.tsx`, `verificar-comic.mjs` (partes `copiar`, `campo`), `medir-paquete.mjs` (usos < 1,5 cada uno), `pruebas/interfaz.test.ts`
**Interfaces — Produces:**
```ts
export function copiarTexto(t: string, nav?: Pick<Navigator, "clipboard">, doc?: Document): Promise<boolean>; // false si no se pudo
export interface CopiarProps extends ButtonHTMLAttributes<HTMLButtonElement> { texto: string; aviso?: string; avisoFallo?: string; alCopiar?: (ok: boolean) => void }
export interface CampoProps { etiqueta: ReactNode; ayuda?: ReactNode; error?: string; children: (a11y: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode; className?: string }
```
Textos: «¡Copiado!», «Cópialo a mano».

- [ ] **Step 1: Pruebas:** `copiar: usa el portapapeles` (un `clipboard` falso que resuelve → `true`, recibe el texto); `copiar: si falla, prueba el textarea` (clipboard que rechaza + `doc` falso con `execCommand` → `true`); `copiar: sin nada` → `false`, sin lanzar.
- [ ] **Step 2–4:** → falla; escribir `copiar.ts`; → bien.
- [ ] **Step 5: Partes visuales:** `copiar`: el globo «¡Copiado!» aparece sobre el botón ≤ 200 ms y se va a los 1,4 s, se anuncia en una región `polite`, el portapapeles tiene el texto (permiso de Playwright `clipboard-read`); con el portapapeles bloqueado, «Cópialo a mano». `campo`: el control recibe `id`, `aria-invalid` y `aria-describedby` que apunta al error; el error tiene `role="alert"`; se sacude una vez por mensaje nuevo (no al re-render con el mismo); el borde del control con `aria-invalid` toma `--mk-mal`; la etiqueta enfoca el control al tocarla.
- [ ] **Step 6–7:** escribir los componentes; partes visuales, `en-safari`, pesos → bien.

### Task 4: `Confirmar`

**Files:** Create `src/interfaz/Confirmar.tsx`, `src/interfaz/foco.ts`, `pruebas/foco.test.ts`; Modify `src/components/BottomSheet.tsx` (props `rol?: "dialog" | "alertdialog"`, `focoInicial?: RefObject<HTMLElement | null>`), entrada, índice, `demo/Panel.tsx`, `verificar-comic.mjs` (parte `confirmar`), `medir-paquete.mjs` (`{ Confirmar }` < 4), `pruebas/interfaz.test.ts`
**Interfaces — Produces:**
```ts
export function enfocables(raiz: HTMLElement): HTMLElement[];          // botones, enlaces, campos visibles y habilitados
export function siguienteFoco(lista: HTMLElement[], actual: Element | null, atras: boolean): HTMLElement | undefined; // da la vuelta
export interface ConfirmarProps { abierto: boolean; pregunta: string; detalle?: ReactNode; children?: ReactNode; textoSi?: string; textoNo?: string;
  peligro?: boolean; ocupado?: boolean; alConfirmar: () => void; alCancelar: () => void }
```
Textos: `textoSi` «Sí», `textoNo` «No». Teléfono: ancho de la vista < 560 px.

- [ ] **Step 1: Pruebas** `pruebas/foco.test.ts` (con objetos falsos que imitan elementos): `foco: da la vuelta hacia adelante y hacia atrás`; `foco: sin enfocables, undefined`.
- [ ] **Step 2–4:** → falla; escribir `foco.ts`; → bien.
- [ ] **Step 5: Parte visual `confirmar`** (antes del componente): en escritorio, un globo centrado con `role="alertdialog"` y su `aria-label` = pregunta; el foco cae en «No»; Tab y Shift+Tab no salen del diálogo; Escape cancela y el foco vuelve al botón que lo abrió; tocar el fondo cancela; «Sí» con `peligro` en `--mk-mal`; con `ocupado`, rueda en «Sí», Escape y el fondo no cierran, y dos clics rápidos en «Sí» llaman `alConfirmar` una vez (Review Focus 2); en el teléfono es la hoja desde abajo con el mismo rol y foco; `BottomSheet` sin las props nuevas se comporta igual que antes (la parte `tema` de `verificar-panel` sigue pasando).
- [ ] **Step 6–7:** escribir `Confirmar` y las props de `BottomSheet`; parte visual, `en-safari`, `verificar-panel tema`, pesos → bien. Romper el foco atrapado → falla; restaurar.

### Task 5: `Vacio`, `Oferta` y `CartelNovedad`

**Files:** Create `src/comic/{Vacio.tsx,Oferta.tsx,CartelNovedad.tsx}`; Modify `src/entradas/comic.ts`, `demo/Comic.tsx`, `verificar-comic.mjs` (parte `vacio`), `medir-paquete.mjs` (`{ Vacio }` < 4)
**Interfaces — Consumes:** `Mano`, `Estallido`, `Colgante`, `PUNTA_MANO` (Task 1). **Produces:**
```ts
export function Vacio(p: { icono?: ReactNode; titulo: ReactNode; texto?: ReactNode; accion?: ReactNode } & HTMLAttributes<HTMLDivElement>): JSX.Element;
export function Oferta(p: { destacado: string; children: ReactNode; accion?: ReactNode } & HTMLAttributes<HTMLDivElement>): JSX.Element;
export function CartelNovedad(p: { texto: ReactNode; visible?: boolean; alTocar?: () => void; children: ReactNode }): JSX.Element;
```

- [ ] **Step 1: Parte visual `vacio`** (antes de los componentes): `Vacio` sin `accion` no dibuja mano; con `accion`, la punta del dedo (`PUNTA_MANO`) queda a ≤ 8 px del borde de la acción, en escritorio apuntando a la derecha y en el teléfono desde arriba; toca una vez al entrar en pantalla y queda quieta (sin animaciones a los 2 s); funciona con un `<a>` como acción. `Oferta`: el estallido con el texto de `destacado` late; los `children` se ven completos. `CartelNovedad`: con `visible` aparece colgando del ancla (su hijo), se mece al llegar y a los 3 s queda quieto; tocarlo llama `alTocar`; con movimiento reducido, sin mecerse.
- [ ] **Step 2:** escribir los tres componentes (`useInView` de `src/hooks` para el toque una vez).
- [ ] **Step 3:** parte visual, `en-safari`, pesos → bien.

### Task 6: `Guia`

**Files:** Create `src/comic/guia.ts`, `src/comic/Guia.tsx`, `pruebas/guia.test.ts`; Modify `src/entradas/comic.ts`, `demo/Comic.tsx` (la guía real sobre la pantalla de ejemplo), `verificar-comic.mjs` (parte `guia`), `medir-paquete.mjs` (`{ Guia }` < 7)
**Interfaces — Consumes:** `Mano`, `Globo`, `PUNTA_MANO`. **Produces:**
```ts
export interface Rect { x: number; y: number; w: number; h: number }
export interface Ubicacion { mano: { x: number; y: number; direccion: Direccion }; globo: { x: number; y: number; cola: "arriba" | "abajo" }; foco: Rect }
export function ubicar(objetivo: Rect, vista: { w: number; h: number }, ancho: { mano: number; globo: number; altoGlobo: number }): Ubicacion;
export interface PasoGuia { objetivo: string; texto: ReactNode }
export interface GuiaProps { abierta: boolean; pasos: PasoGuia[]; alTerminar?: () => void; alSaltar?: () => void;
  textos?: Partial<{ atras: string; siguiente: string; listo: string; saltar: string; deN: (i: number, n: number) => string }> }
export const ESPERA_OBJETIVO = 1500;
```
`ubicar`: mano a la izquierda apuntando a la derecha si cabe; si no, debajo apuntando arriba; si no, encima apuntando abajo; globo debajo del objetivo (y de la mano) si cabe, si no encima; todo dentro de la vista con 8 px de margen. Textos: «Atrás», «Siguiente», «¡Listo!», «Saltar», «Paso 2 de 4».

- [ ] **Step 1: Pruebas** `pruebas/guia.test.ts`: `guia: con espacio, la mano a la izquierda` (punta a ≤ 2 px del borde izquierdo del objetivo, a media altura); `guia: pegado a la izquierda, la mano abajo apuntando arriba`; `guia: pegado abajo, la mano encima apuntando abajo y el globo arriba`; `guia: todo queda dentro de la vista` (para 40 objetivos en una grilla que cubre la vista de 390×844, mano y globo dentro con 8 px; Review Focus 4); `guia: medidas raras no la botan` (NaN, 0, objetivo más grande que la vista).
- [ ] **Step 2–4:** → falla; escribir `guia.ts`; → bien.
- [ ] **Step 5: Parte visual `guia`** (antes del componente): con 4 pasos sobre la pantalla de ejemplo: el paso 1 apunta a su elemento (punta a ≤ 6 px), el globo dice «Paso 1 de 4» y tiene el foco en «Siguiente»; el elemento señalado se puede tocar (su contador sube) y lo de fuera no; Siguiente/Atrás/flechas mueven; Escape llama `alSaltar`; un paso cuyo elemento aparece a los 800 ms se muestra (Review Focus 3) y uno que nunca aparece se salta a los 1,5 s; si todos se saltan, `alTerminar`; al hacer scroll o cambiar el tamaño, la mano sigue al elemento; en el teléfono, mano y globo dentro de la ventana; con movimiento reducido, sin viajes (aparece en su lugar).
- [ ] **Step 6:** escribir `Guia.tsx` (portal; cuatro paneles oscuros alrededor del recorte; `ResizeObserver` + scroll + resize; reintento cada 150 ms hasta `ESPERA_OBJETIVO`).
- [ ] **Step 7:** parte visual, `en-safari`, pesos → bien. Romper el reintento → falla el paso tardío; restaurar.

### Task 7: `Celebrar`

**Files:** Create `src/comic/Celebrar.tsx`; Modify `src/entradas/comic.ts`, `demo/Comic.tsx`, `verificar-comic.mjs` (parte `celebrar`), `medir-paquete.mjs` (`{ Celebrar }` < 4)
**Interfaces — Consumes:** `Estallido`; `Confeti` de `src/momentos/Confeti.tsx` solo si `{ Celebrar }` queda < 4 sin arrastrar otro archivo de `src/momentos/` (si no, un confeti propio en `src/comic/confeti.ts`, con semilla). **Produces:**
```ts
export function useCelebrar(): (texto: string) => void;
export function CelebrarProvider(p: { children: ReactNode }): JSX.Element; // opcional
export const DURA_CELEBRAR = 2500;
```

- [ ] **Step 1: Parte visual `celebrar`:** `celebrar("¡Publicada!")` muestra el estallido grande y confeti sobre todo, sin recibir toques (un botón debajo se puede tocar), y se va a los 2,5 s; dos llamadas seguidas dejan un solo estallido y un solo confeti (Review Focus 5); sin `CelebrarProvider` funciona igual (se monta solo); con movimiento reducido, sin confeti y el estallido con fundido; se anuncia el texto en una región `polite`.
- [ ] **Step 2:** escribir `Celebrar.tsx` (medir primero el peso con `Confeti`; decidir y anotar en el registro).
- [ ] **Step 3:** parte visual, `en-safari`, pesos → bien.

### Task 8: Cierre

**Files:** Modify `scripts/probar-paquete.mjs` (un panel que importa `BotonQueGuarda` de `interfaz` y `Guia` de `comic`, sin nada pesado y sin clases de fondos), `docs/CATALOGO.md` (sección «Guardar y cómic del panel» con pesos medidos), `CHANGELOG.md` («Sin publicar»: entrada nueva `motion-kit/comic`, piezas, props nuevas de `BottomSheet`), `README.md` (entradas), `CLAUDE.md` (`verificar-comic`); Create (en el cerebro, sin commit) `cerebro-aquiles/lamente/ENCARGO_2026-11-27_guardar-y-comic.md` (lo de la sección «El encargo al front» del diseño)

- [ ] **Step 1:** `npm test`, `npm run typecheck`, `npm run build` + `npm run peso`, `npm run probar-paquete`, `node scripts/verificar-comic.mjs <url>` (todas las partes), `npm run humo` → bien.
- [ ] **Step 2:** Revisión de toda la rama en Opus (tanda grande) con la sección Review Focus; cada arreglo con su prueba que falle primero.
- [ ] **Step 3:** Documentación y borrador del encargo; batería completa (`npm run verificar -- --todo`, por la `v0.6.0`); contarle a Aquiles y esperar su orden para commit, push y etiqueta.
