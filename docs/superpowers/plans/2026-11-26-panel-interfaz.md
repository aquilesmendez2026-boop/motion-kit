# Panel con vida: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Piezas de interfaz para el panel de cada negocio en `motion-kit/interfaz`: colores del tema, `SubirImagen`, avisos con tipos y deslizamiento, `Cargando`, y lo que llega (`ListaViva`, `Contador`, `Interruptor`).

**Architecture:** Lo calculable de cada pieza (revisar un archivo, decidir si se muestra el esqueleto, si un deslizamiento cierra, qué entra y sale de una lista) va en módulos puros bajo `src/interfaz/` con pruebas `node:test`. Los componentes React viven al lado, ponen su CSS con `useStyles` y leen los colores por variables (`src/interfaz/tema.ts`). Una vitrina `#panel` en la demo y `scripts/verificar-panel.mjs` (Playwright) prueban lo que se ve.

**Tech Stack:** React 19 + TS, Web Animations API, `node:test` (`node scripts/pruebas.mjs <filtro>`), Playwright, esbuild (pesos).

**Spec:** `docs/superpowers/specs/2026-11-26-panel-interfaz-design.md`

## Global Constraints

- Sin dependencias; en lo que se anima, solo `transform` y `opacity`; móvil primero (toques de 44 px); «reducir movimiento»: solo fundidos cortos, nada que se sacuda, lata ni gire; sin `Math.random`.
- Textos por defecto en español de Chile, todos cambiables.
- Cada pieza pone su CSS al montarse (`useStyles` de `src/utils/styles.ts`); exportada desde `src/entradas/interfaz.ts` y desde `src/index.ts`.
- Colores solo por `var(--mk-…)` con los respaldos de la tabla del diseño; respaldo `--lm-*` solo en `acento`, `fondo` y `superficie`.
- Pesos (gzip, `npm run build` y después `npm run peso`): entrada `interfaz` tope **20 KB** (decisión de Aquiles, 26-11); usos: `{ Accordion, CountUp }` < 5, `{ SubirImagen }` < 4, `{ ToastProvider, useToast }` < 3, `{ Cargando }` < 2, `{ ListaViva, Contador, Interruptor }` < 4.
- Ningún contrato cambia. Rama `interfaz`; sin commits hasta que Aquiles lo pida. No editar `src/`/`demo/` mientras corre una prueba visual (usar una copia `git worktree` con su servidor).

## Review Focus

1. Subir la misma foto dos veces seguidas (el `<input>` no dispara `change` con el mismo archivo): tiene que volver a llamar `alElegir`.
2. Un aviso con «Deshacer» y llegan cuatro avisos más: el de la acción sigue ahí hasta que se toca o vence.
3. `Cargando` que pasa a listo y vuelve a falso al refrescar: no vuelve al esqueleto.
4. `ListaViva` cuyo primer render llega vacío y después trae 10 pedidos: no entran los 10 animados.
5. Cambiar de foto mientras otra sube (el front aún no termina): la vista local nueva reemplaza a la anterior y la anterior se suelta.

---

### Task 1: Los colores del panel

**Files:**
- Create: `src/interfaz/tema.ts`, `demo/Panel.tsx`, `scripts/verificar-panel.mjs`, `pruebas/tema-interfaz.test.ts`
- Modify: `src/components/{Toast,BottomSheet,TabBar,Skeleton}.tsx`, `src/entradas/interfaz.ts`, `src/index.ts`, `demo/main.tsx` (ruta `#panel`), `demo/App.tsx` (enlace), `scripts/medir-paquete.mjs` (tope 20), `scripts/verificar-cambios.mjs`, `scripts/humo.mjs`

**Interfaces:**
- Produces:
  ```ts
  export type ColorInterfaz = "fondo" | "superficie" | "texto" | "suave" | "borde" | "acento" | "acentoTexto" | "bien" | "mal";
  export type TemaInterfaz = Record<ColorInterfaz, string>;
  export const RESPALDO: TemaInterfaz;                       // los valores claros de la tabla del diseño
  export function c(nombre: ColorInterfaz): string;           // "var(--mk-acento,var(--lm-acento,#7c5cff))"
  export function variablesTema(t: Partial<TemaInterfaz>): Record<string, string>; // { "--mk-acento-texto": "#fff", … }
  ```
  Variable de cada color: `--mk-` + nombre en kebab (`acentoTexto` → `--mk-acento-texto`).
- La vitrina `demo/Panel.tsx` exporta `PanelVitrina`; tiene un selector `[data-prueba=panel-tema]` (`claro` | `oscuro`) que pone en su raíz `variablesTema` con los colores del panel de La Mente (claro: fondo `#FAF7F2`, superficie `#FFFFFF`, texto `#1C1A22`, suave `#5E5A68`, borde `#E7E1D8`, acento `#7c3aed`; oscuro: `#14121A`, `#1E1B26`, `#F2EFF7`, `#B3AEBD`, `#2E2A38`, `#a78bfa`). Cada parte siguiente suma su sección con `data-prueba=panel-<parte>`.

- [ ] **Step 1: Pruebas** en `pruebas/tema-interfaz.test.ts`:
  - `tema: c() usa el respaldo --lm solo donde existe` — `c("acento") === "var(--mk-acento,var(--lm-acento,#7c5cff))"`, `c("superficie") === "var(--mk-superficie,var(--lm-superficie,#ffffff))"`, `c("borde") === "var(--mk-borde,#e7e1d8)"`, `c("mal") === "var(--mk-mal,#d64545)"`.
  - `tema: variablesTema pasa a kebab y salta lo vacío` — `variablesTema({ acentoTexto: "#fff", bien: "" })` → `{ "--mk-acento-texto": "#fff" }`.
  - `tema: las piezas no traen colores fijos` — leer como texto `src/components/{Toast,BottomSheet,Skeleton}.tsx`: ninguno contiene `#f1f1f6`, `#12121c`, `#1b1b2b` ni `rgba(255, 255, 255, 0.14)`; `TabBar.tsx` no tiene `accent = "#7c5cff"`.
- [ ] **Step 2:** `node scripts/pruebas.mjs tema-interfaz` → falla (no existe el módulo).
- [ ] **Step 3:** Escribir `tema.ts`; pasar las cuatro piezas a `c(…)` (Toast: superficie, texto, borde 1 px, sombra `0 8px 24px rgba(0,0,0,.12)`; BottomSheet: superficie y texto, tirador con `c("borde")`; TabBar: `accent` opcional, por defecto `c("acento")`; Skeleton: `color-mix(in srgb, ${c("texto")} 10%, transparent)` y brillo `color-mix(in srgb, ${c("superficie")} 60%, transparent)`). Exportar `variablesTema`, `TemaInterfaz`, `ColorInterfaz` desde la entrada y el índice.
- [ ] **Step 4:** `node scripts/pruebas.mjs tema-interfaz` → bien.
- [ ] **Step 5: Vitrina y prueba visual.** `#panel` con el selector de tema y una fila con `BottomSheet` (abrir), un aviso y `Skeleton`. `verificar-panel.mjs` con el patrón de `verificar-luz.mjs` (`[url] [parte]`, `PARTES = ["tema", "imagen", "avisos", "cargando", "llega"]`); parte `tema`: en claro y en oscuro, el fondo calculado de la hoja abierta, del aviso y del esqueleto sigue al tema (oscuro: luminancia < 0,2; claro: > 0,8); contraste texto/superficie del aviso ≥ 4,5; capturas a 390 × 844 y 1280 × 800. Regla en `verificar-cambios.mjs`: `src/interfaz/`, `src/entradas/interfaz`, `src/components/(Toast|BottomSheet|TabBar|Skeleton)`, `demo/Panel` → `["panel", "piezas"]`; `#panel` (selector `[data-prueba=panel-tema]`) en `humo.mjs`. Romper a propósito un color (volver `#1b1b2b`) → la parte falla; restaurar.
- [ ] **Step 6:** `npm test`, `npm run typecheck`, `npm run build` + `npm run peso` (tope `interfaz` 20 con su comentario «decisión de Aquiles del 26-11-2026»), `node scripts/verificar-panel.mjs <url> tema`, `npm run verificar` → bien.

### Task 2: `SubirImagen`

**Files:**
- Create: `src/interfaz/archivo.ts`, `src/interfaz/SubirImagen.tsx`, `pruebas/subir-imagen.test.ts`
- Modify: `src/entradas/interfaz.ts`, `src/index.ts`, `demo/Panel.tsx`, `scripts/verificar-panel.mjs`, `scripts/medir-paquete.mjs` (uso `{ SubirImagen }` < 4), `pruebas/interfaz.test.ts` (sumar `SubirImagen` a `PIEZAS`)

**Interfaces:**
- Consumes: `c()` de la Task 1.
- Produces:
  ```ts
  // archivo.ts
  export function pesoLegible(bytes: number): string;   // 3_400_000 → "3,4 MB"; 850_000 → "850 KB"
  export function revisarArchivo(a: { type: string; size: number }, aceptar: string, maxMB: number):
    { ok: true } | { ok: false; mensaje: string };
  // SubirImagen.tsx
  export interface SubirImagenProps {
    etiqueta: string; ayuda?: string; forma?: "redonda" | "cuadrada" | "apaisada";
    imagen?: string; subiendo?: boolean | number; error?: string;
    alElegir: (archivo: File) => void; alQuitar?: () => void;
    aceptar?: string; maxMB?: number; deshabilitada?: boolean;
    textos?: Partial<{ elegir: string; arrastrar: string; cambiar: string; quitar: string; listo: string }>;
  }
  export function SubirImagen(p: SubirImagenProps): JSX.Element;
  ```
  Estado en el DOM para las pruebas: `data-estado` = `vacia | arrastrando | subiendo | lista | error` en la raíz `.mk-subir`.

- [ ] **Step 1: Pruebas** en `pruebas/subir-imagen.test.ts`:
  - `subir: acepta lo que pide` — `revisarArchivo({ type: "image/png", size: 1_000_000 }, "image/png,image/jpeg,image/webp", 2)` → `{ ok: true }`.
  - `subir: el peso en el mensaje` — 3,4 MB con máximo 2 → `mensaje === "Esa foto pesa 3,4 MB: el máximo es 2 MB."`; justo 2 MB (2 × 1024 × 1024) pasa.
  - `subir: el tipo` — `image/gif` → `"Ese archivo no es una foto PNG, JPG o WebP."`; `aceptar = "image/*"` acepta `image/gif`; tipo vacío no pasa.
  - `subir: pesoLegible` — los dos ejemplos de la interfaz; `0` → `"0 KB"`; `NaN` no lanza.
- [ ] **Step 2:** `node scripts/pruebas.mjs subir-imagen` → falla.
- [ ] **Step 3:** Escribir `archivo.ts` (los nombres del mensaje de tipo salen de `aceptar`: png → PNG, jpeg → JPG, webp → WebP; con comodín, «una foto»).
- [ ] **Step 4:** `node scripts/pruebas.mjs subir-imagen` → bien.
- [ ] **Step 5: Parte visual `imagen`** (antes del componente; tiene que fallar). La vitrina muestra las tres formas; una con subida de mentira que avanza de 0 a 1 en 1,5 s y termina con una imagen, otra que falla con «No se pudo subir. Intenta de nuevo.». Revisa: vacía dice «Arrastra una foto o toca para elegir»; al soltar un archivo (Playwright `DataTransfer` con un PNG de 1 × 1) el estado pasa por `arrastrando` (con `dragenter`) → `subiendo` (la vista local es un `blob:`) → `lista` con el ✓ visible ≤ 1 s y anunciado «Foto lista»; un archivo de 3 MB → `error` con el mensaje de la Task 2, `role="alert"`, y **no** llamó `alElegir` (contador en la vitrina); la sacudida corre una vez por mensaje nuevo (`getAnimations()` en la raíz) y ninguna con movimiento reducido; elegir la misma foto dos veces llama dos veces (Review Focus 1); cambiar de foto mientras sube suelta la vista anterior (`URL.revokeObjectURL` espiado; Review Focus 5); con teclado: Tab llega al recuadro y Enter abre el selector (`filechooser`); «Quitar» solo donde hay `alQuitar`; la forma redonda mide 112 px y la apaisada guarda 16:9; capturas.
- [ ] **Step 6:** Escribir `SubirImagen.tsx`: `<label>` envuelve el recuadro y un `<input type="file">` visualmente oculto (se limpia `value` tras cada elección); arrastrar con `dragenter/over/leave/drop` (contador de entradas para no parpadear); vista local con `URL.createObjectURL`, soltada al llegar `imagen` nueva, al haber error, al elegir otra o al desmontar; anillo SVG: sin porcentaje, un arco fijo que gira con `rotate` (animación de `transform`); con porcentaje, `pathLength=1` y `stroke-dashoffset` puesto de una vez en cada aviso de avance del front, sin transición (no se anima por cuadro); ✓ cuando `subiendo` pasa de verdadero a falso sin `error`; sacudida con WAAPI (`translateX` ±6 px, 300 ms) cuando el texto del error cambia; error propio borrado al elegir otro archivo; el del front manda mientras exista; `aria-busy` al subir.
- [ ] **Step 7:** `node scripts/verificar-panel.mjs <url> imagen` y `node scripts/en-safari.mjs panel imagen <url>` → bien. Mirar capturas en el teléfono y ajustar hasta que se note.
- [ ] **Step 8:** Romper a propósito la revisión del tamaño (llamar `alElegir` igual) → la parte falla; restaurar. `npm test`, typecheck, build + peso, `npm run verificar` → bien.

### Task 3: Avisos

**Files:**
- Create: `src/interfaz/avisos.ts`, `pruebas/avisos.test.ts`
- Modify: `src/components/Toast.tsx`, `demo/Panel.tsx`, `scripts/verificar-panel.mjs`, `scripts/medir-paquete.mjs` (uso `{ ToastProvider, useToast }` < 3)

**Interfaces:**
- Consumes: `c()`.
- Produces:
  ```ts
  // avisos.ts
  export function cierraDeslizando(dx: number, vx: number): boolean;   // |dx| > 80 o |vx| > 0,6 px/ms con |dx| > 24
  export function quienSale<T extends { conAccion: boolean }>(lista: T[]): number; // índice a sacar, o -1
  export function duracionDe(o: { duration?: number; accion?: unknown }): number;   // 3200; 6000 con acción; duration gana
  // Toast.tsx (lo de hoy sigue funcionando)
  export interface ToastOptions { duration?: number; tipo?: "bien" | "mal" | "info"; accion?: { texto: string; alHacer: () => void } }
  ```
  `quienSale`: con más de 3 avisos, el más antiguo sin acción; si todos tienen acción, -1 hasta 4 y después el más antiguo.

- [ ] **Step 1: Pruebas** en `pruebas/avisos.test.ts`: `avisos: deslizar cierra` (80,1 → sí; 79 lento → no; 30 rápido → sí; 10 rápido → no; negativo igual que positivo), `avisos: el de la acción se queda` (4 avisos, el más antiguo con acción → sale el índice 1; 4 con acción → -1; 5 con acción → 0; 3 → -1), `avisos: duración` (los tres casos).
- [ ] **Step 2:** `node scripts/pruebas.mjs avisos` → falla. **Step 3:** escribir `avisos.ts`. **Step 4:** → bien.
- [ ] **Step 5: Parte visual `avisos`** (antes de tocar `Toast`; tiene que fallar): tres botones en la vitrina («Guardado», «No se pudo guardar», «Borrado» con «Deshacer»). Revisa: cada tipo con su ícono y su color (`bien` → borde o ícono con `--mk-bien`); el de error está dentro de la región `[aria-live=assertive]` y los demás en `polite`, y las dos regiones existen antes del primer aviso; «Deshacer» llama su función y cierra; tocar el cuerpo del aviso no lo cierra y la × sí; deslizar 120 px con el puntero lo cierra y 40 px lento no; con el mouse encima no se va pasados 4 s; al soltarlo, sí; mandar 5 avisos con el de «Deshacer» primero: sigue visible (Review Focus 2); sin `<button>` dentro de otro `<button>`; con movimiento reducido no hay animación de entrada; `toast("Hola")` sin opciones sigue mostrando un aviso.
- [ ] **Step 6:** Reescribir `Toast.tsx`: cada aviso es un `div` con ícono, texto, acción opcional y ×; cuenta pausable (tiempo restante guardado al pausar); deslizar con `pointer events` y `touch-action: pan-y`, el aviso sigue al dedo con `translateX` y se desvanece; las dos regiones montadas en el portal desde el inicio.
- [ ] **Step 7:** `node scripts/verificar-panel.mjs <url> avisos`, `en-safari` y `node scripts/verificar-piezas.mjs <url>` (la demo usa `Toast`) → bien. Romper `quienSale` (siempre 0) → falla; restaurar.

### Task 4: `Cargando`

**Files:**
- Create: `src/interfaz/cargando.ts`, `src/interfaz/Cargando.tsx`, `pruebas/cargando.test.ts`
- Modify: entrada, índice, `demo/Panel.tsx`, `scripts/verificar-panel.mjs`, `scripts/medir-paquete.mjs` (uso `{ Cargando }` < 2), `pruebas/interfaz.test.ts`

**Interfaces:**
- Consumes: `Skeleton` (Task 1) y `c()`.
- Produces:
  ```ts
  export type FormaCarga = "texto" | "fila" | "tarjeta" | "tabla" | "foto";
  // cargando.ts: qué mostrar en cada momento (tiempos en ms desde que se montó).
  export function fase(e: { ahora: number; listoEn: number | null; esqueletoDesde: number | null; yaMostro: boolean }):
    "nada" | "esqueleto" | "contenido";
  export const ESPERA = 150, MINIMO = 300;
  export interface CargandoProps { listo: boolean; forma?: FormaCarga; cuantos?: number; etiqueta?: string; children: ReactNode }
  export function Cargando(p: CargandoProps): JSX.Element;
  ```
  `yaMostro`: el contenido ya se mostró una vez → siempre `"contenido"` (Review Focus 3).

- [ ] **Step 1: Pruebas** en `pruebas/cargando.test.ts`: `cargando: rápido no parpadea` (listo a los 100 → `"nada"` a los 50, `"contenido"` a los 100); `cargando: lento muestra el esqueleto` (sin listo a los 200 → `"esqueleto"`); `cargando: el esqueleto dura al menos 300` (esqueleto desde 150, listo a los 200 → `"esqueleto"` a los 300, `"contenido"` a los 450); `cargando: listo al montar` (`listoEn: 0` → `"contenido"` a los 0); `cargando: refrescar no vuelve` (`yaMostro: true`, `listoEn: null` → `"contenido"`).
- [ ] **Step 2:** → falla. **Step 3:** escribir `cargando.ts` y `Cargando.tsx` (un temporizador por cambio de fase, no por cuadro; fundido de 200 ms del esqueleto al contenido; `aria-busy` mientras no hay contenido y un «Cargando…» escondido una sola vez; cada forma armada con `Skeleton`). **Step 4:** → bien.
- [ ] **Step 5: Parte visual `cargando`**: una sección con las cinco formas y un botón que simula una carga de 80 ms y otra de 1 s. La de 80 ms no pinta ningún `[data-mk-esqueleto]` en ningún cuadro (observar con `MutationObserver`); la de 1 s muestra el esqueleto con la forma pedida y después el contenido con fundido; «Refrescar» (listo → falso) deja el contenido; capturas de las cinco formas en claro y oscuro.
- [ ] **Step 6:** verificar-panel `cargando`, `en-safari`, `npm test`, build + peso → bien. Romper `ESPERA` a 0 → la de 80 ms falla; restaurar.

### Task 5: Lo que llega

**Files:**
- Create: `src/interfaz/lista.ts`, `src/interfaz/{ListaViva,Contador,Interruptor}.tsx`, `pruebas/lista-viva.test.ts`
- Modify: entrada, índice, `demo/Panel.tsx`, `scripts/verificar-panel.mjs`, `scripts/medir-paquete.mjs` (uso `{ ListaViva, Contador, Interruptor }` < 4), `pruebas/interfaz.test.ts`

**Interfaces:**
- Consumes: `c()`.
- Produces:
  ```ts
  // lista.ts
  export function cambios(antes: string[], ahora: string[]): { entran: string[]; salen: { clave: string; indice: number }[]; quedan: string[] };
  export function esPrimera(vistas: string[][]): boolean;  // verdadero mientras no haya habido una lista no vacía
  export function textoContador(valor: number, max: number): string; // 3 → "3"; 120 con 99 → "99+"; negativo o NaN → "0"
  export interface ListaVivaProps extends HTMLAttributes<HTMLDivElement> { destello?: boolean; children: ReactNode }
  export interface ContadorProps extends HTMLAttributes<HTMLSpanElement> { valor: number; max?: number; etiqueta?: string }
  export interface InterruptorProps { activo: boolean; alCambiar: (activo: boolean) => void; etiqueta: string; textos?: [string, string]; deshabilitado?: boolean }
  ```

- [ ] **Step 1: Pruebas** en `pruebas/lista-viva.test.ts`: `lista: entra, sale y queda` (`["a","b","c"]` → `["d","a","c"]`: entran `["d"]`, salen `[{clave:"b",indice:1}]`, quedan `["a","c"]`); `lista: la primera no vacía no anima` (`esPrimera([[]])` → verdadero; `esPrimera([[], ["a"]])` → verdadero; `esPrimera([[], ["a"], ["a","b"]])` → falso; Review Focus 4); `lista: claves repetidas no la botan` (`["a","a"]` sin lanzar); `contador: el texto` (los tres casos).
- [ ] **Step 2:** → falla. **Step 3:** escribir `lista.ts`. **Step 4:** → bien.
- [ ] **Step 5: Parte visual `llega`** (antes de los componentes): un «Ahora» de pedidos en la vitrina con botones «Llega un pedido», «Pasa a listo» (reordena) y «Entregado» (sale), con `Contador` de pendientes e `Interruptor` «Cerrado/Abierto». Revisa: al cargar con 3 pedidos, ninguno anima; uno nuevo entra con `getAnimations()` en su elemento y un halo `[data-mk-destello]` que se apaga ≤ 1,4 s; al reordenar, el que cambia de lugar tiene una animación de `transform` y termina en su lugar sin salto (posición final = posición del DOM); al salir, el que sale queda medio visible un momento y la lista no salta (el de abajo sube con animación); el contador late al subir (escala > 1,1 en algún cuadro) y no al bajar; el interruptor cambia con clic, espacio y enter, `aria-checked` sigue, su caja mide ≥ 44 × 44; con movimiento reducido: sin deslizar, sin latido, solo fundidos; capturas.
- [ ] **Step 6:** Escribir los tres componentes: `ListaViva` guarda las claves y posiciones de la vuelta anterior (`useLayoutEffect`), anima con WAAPI (entrada `translateY(12px)` + opacidad, FLIP con `translate`, salida: el hijo que sale se conserva en un clon absoluto en su último lugar mientras se desvanece); `Contador` con WAAPI al subir; `Interruptor` como `<button role="switch">` con perilla que corre con resorte (`--mk-resorte-curva` si existe) y se achata al apretar (`scaleX(1.15)`).
- [ ] **Step 7:** verificar-panel `llega`, `en-safari`, `npm test`, build + peso → bien. Romper `esPrimera` (siempre falso) → falla la de la primera carga; restaurar.

### Task 6: Cierre

**Files:**
- Modify: `scripts/probar-paquete.mjs` (el panel también importa `SubirImagen`, `useToast` y `Cargando` y sigue sin nada pesado), `docs/CATALOGO.md` (sección «Panel con vida» con pesos medidos), `CHANGELOG.md` («Sin publicar»: piezas nuevas y **cambia cómo se ven** `BottomSheet`, `Toast` y `Skeleton`), `README.md`
- Create (en el cerebro, sin commit): borrador del encargo al front `cerebro-aquiles/lamente/ENCARGO_2026-11-26_panel-con-vida.md` (subir la versión en `packages/ui`, `motion-kit/interfaz` en `motionKitPanel.tsx`, el CSS de los colores en claro y oscuro desde los tokens de `theme.ts`, las 7 pantallas de imágenes con sus funciones a `File` y sin su revisión de 2 MB, `Spinner` → `Cargando`, avisos al guardar y borrar, «Ahora» con `ListaViva`, `Contador` e `Interruptor`)

- [ ] **Step 1:** `npm test`, `npm run typecheck`, `npm run build` + `npm run peso`, `npm run probar-paquete`, `npm run verificar`, `npm run humo` → todo bien.
- [ ] **Step 2:** Revisión de toda la rama en Opus (solo lectura) con la sección Review Focus; arreglar lo que encuentre, cada cosa con su prueba que falle primero.
- [ ] **Step 3:** Documentación y borrador del encargo; contarle a Aquiles y esperar su orden para commit, push y etiqueta.
