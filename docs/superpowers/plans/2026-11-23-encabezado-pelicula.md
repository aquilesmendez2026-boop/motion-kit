# Encabezado de película (receta v2): plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Las nueve ideas aprobadas del encabezado (apertura, varias tomas, foto dentro de las letras, tratamiento de foto, colores desde la foto, estado del negocio, palabras que rotan, salida que entrega la posta, hora del día) y la receta del encabezado v2 que las guarda.

**Architecture:** La receta sube a v2 (un solo contrato que dice `versiones: [1, 2]`; `normalizarReceta` pasa una v1 a v2). `Encabezado` suma props nuevas, casi todo CSS dentro del CSS del encabezado; lo que necesita JS (apertura una vez por sesión, rotación de tomas y palabras, barra al bajar) es propio y chico. `paletaDeFoto` compara los colores de una foto con `PALETAS_LAMENTE` en el navegador.

**Tech Stack:** React 19, TypeScript, CSS de `useStyles`, `node --test` (`scripts/pruebas.mjs`) y Playwright (`scripts/verificar-*.mjs`). Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-23-relatos-y-encabezado-pelicula-design.md`, sección «Encabezado» (y sus «decisión mía»).

## Global Constraints

- Sin dependencias nuevas; solo `transform`/`translate`/`scale`/`rotate` y `opacity` en los keyframes del encabezado (`mk-e-*`, `mk-p-*`).
- Movimiento reducido y nivel «quieto»: nada se mueve solo y todo se lee (apertura saltada, primera toma quieta, primera palabra fija).
- Un solo protagonista, nuevo orden: `tomas`, `efecto`, `palabras`, `efectoTexto`, video en letras, `luz`. Calmar: tomas → primera foto quieta; palabras → primera palabra fija; video en letras → foto o póster; el resto como hoy.
- Receta v2: `validarReceta` acepta `version` 1 y 2; `normalizarReceta` devuelve siempre `version: 2`. Contrato único `contrato/encabezado-motionkit.json` con `versiones: [1, 2]`.
- Topes v2: `palabras` hasta 4 de 24 letras; `presenta` hasta 40; `nombre` hasta 40; `logo` como las fotos (URL https o key de S3).
- `motion-kit/encabezado` mantiene su tope de 35 KB gzip; si se pasa, tomas y foto en letras se cargan con `import()`.
- La apertura se ve **una vez por sesión** (`sessionStorage`, con `try/catch`) y se salta tocando o con cualquier tecla.
- Español de Chile en código, mensajes y documentos. Commits en `dev` con OK de Aquiles (dado: «hace todo», 23-11).

## Review Focus

1. **Apertura que tapa la página** si el JS falla a medias o `sessionStorage` lanza (modo privado): la apertura nunca bloquea; sin JS no existe y a los 4 s se quita sola. Prueba en Task 2.
2. **Palabras que rotan con distinto largo** (la palabra larga no puede romper el título ni moverlo de línea en cada cambio): el ancho queda reservado al de la palabra más larga. Prueba en Task 2.
3. **Barra al bajar con lector de pantalla y teclado**: la barra no duplica el título como encabezado ni deja dos botones principales enfocables a la vez. Prueba en Task 3.
4. **Hora del día en el borde** (23:59 → 00:00, zona horaria del teléfono): la hora sale del reloj local y el corte de franjas es claro (mañana 6–12, tarde 12–19, noche 19–6). Prueba en Task 1.
5. **Foto dentro de las letras sin foto** (o foto que no carga): el título se ve con el color del texto, nunca transparente. Prueba en Task 4.

---

### Task 1: Receta del encabezado v2

**Files:**
- Modify: `src/receta/receta.ts`, `src/receta/contrato.ts`, `src/receta/index.ts`
- Modify: `pruebas/receta.test.ts`, `pruebas/biblioteca.test.ts` (lo que espere `version: 1`)
- Create: `src/receta/hora.ts`
- Generado: `contrato/encabezado-motionkit.json`

**Interfaces:**
- Produces:
  ```ts
  export const VERSION_RECETA = 2;  export const VERSIONES_RECETA = [1, 2] as const;
  type Tratamiento = "duotono" | "grano" | "trama" | "bn";
  type SalidaEncabezado = "ninguna" | "achicar" | "desvanecer" | "abrir" | "barra" | "telon";   // catalogo.ts suma barra y telon
  interface RecetaEncabezado {           // v2: lo de v1 más
    version: 2;
    apertura?: { presenta?: string };   tomas?: boolean;   fotoEnLetras?: boolean;   tratamiento?: Tratamiento;
    estado?: boolean;   palabras?: string[];   horaDelDia?: boolean;
    shader?: ShaderId;   objeto?: { forma: FormaObjeto; texto?: string };   logo?: string;   nombre?: string;
  }
  PROTAGONISTA_RECETA.orden = ["tomas", "efecto", "palabras", "efectoTexto", "fotoEnLetras", "luz"];
  // src/receta/hora.ts
  export type FranjaHora = "manana" | "tarde" | "noche";
  export function franjaDe(fecha: Date): FranjaHora;   // 6–11:59 mañana, 12–18:59 tarde, resto noche (hora local)
  ```
- Reglas: `tomas` sin `imagenes` (o con 1) → se descarta con aviso; `fotoEnLetras` sin `imagenes` ni `poster` → se descarta; `palabras` solo si el título tiene una palabra entre asteriscos (si no, error «Las palabras rotan en la palabra resaltada: marca una con *asteriscos*.»); `shader` cuenta como fondo animado junto a `efecto` (solo uno: si vienen los dos, gana `efecto` y el shader se quita con aviso).

- [ ] **Step 1: Tests** en `pruebas/receta.test.ts`:
  - `test("una receta v1 pasa y se guarda como v2")` → `validarReceta({version:1,…}).receta.version === 2`.
  - `test("los campos v2 se validan")` → `palabras` con 5 o con una de 25 letras, `presenta` de 41, `tratamiento:"sepia"`, `logo:"javascript:x"`, `salida:"barra"` OK, `objeto:{forma:"esfera"}` → errores con campo y mensaje en español; `shader:"aurora"` y `objeto:{forma:"lata"}` ya **no** dan «entra en la receta v2».
  - `test("palabras exige una palabra resaltada")`.
  - `test("protagonista v2")` → `tomas`+`efecto`+`palabras` → queda `tomas`, se quita `efecto` y quedan solo la primera palabra (`palabras` se descarta) con 2 avisos; `efecto`+`shader` → queda `efecto`.
  - `test("franjaDe en los bordes")` → 05:59 noche, 06:00 mañana, 11:59 mañana, 12:00 tarde, 18:59 tarde, 19:00 noche, 23:59 noche, 00:00 noche (Review Focus 4).
  - Ajustar los `deepEqual` que esperan `version: 1` (receta, rubros, plantillas, biblioteca) a `version: 2`.
- [ ] **Step 2: Run** `node scripts/pruebas.mjs receta` → FAIL.
- [ ] **Step 3: Implement** en `receta.ts`, `hora.ts` y el contrato (`versiones`, listas `tratamiento`, `shader`, `forma`, topes nuevos, orden de protagonista). `npm run contrato`.
- [ ] **Step 4: Run** `npm test` → PASS; `npm run typecheck`.
- [ ] **Step 5: Commit** — «Receta del encabezado v2».

### Task 2: Apertura, varias tomas y palabras que rotan

**Files:**
- Modify: `src/encabezados/Encabezado.tsx`, `src/encabezados/css.ts`, `src/receta/receta.ts` (`recetaAProps`)
- Create: `src/encabezados/Apertura.tsx`, `src/encabezados/Tomas.tsx`, `src/encabezados/PalabrasRotan.tsx`
- Create: `scripts/verificar-pelicula.mjs`; Modify: `demo/Encabezados.tsx` (controles con `data-prueba`: `apertura`, `presenta`, `tomas`, `palabras`)

**Interfaces:**
- Produces (props nuevas de `Encabezado`): `apertura?: { presenta?: string }`, `tomas?: boolean`, `palabras?: string[]`. `recetaAProps` las pasa.
  - `Apertura`: capa `aria-hidden` con dos franjas negras que se abren (`scale`), «presenta» y el título; dura ≤ 2,6 s; botón invisible de pantalla completa «Saltar» (tocar o tecla); `sessionStorage["mk-apertura-vista"]`; en quieto no se monta.
  - `Tomas`: hasta 3 `imagenes` que se suceden cada 5 s con acercamiento lento (`scale` 1 → 1,08) y fundido (`opacity`); en liviano/quieto, solo la primera, quieta. Composiciones con foto de fondo (`tarjeta`, `imagen`) y `dividido`.
  - `PalabrasRotan`: dentro de la palabra resaltada; el ancho reservado es el de la palabra más larga (una capa invisible con todas), cambio cada 2,4 s con `translate`/`opacity`; el lector de pantalla lee el título con la primera palabra.
- [ ] **Step 1: Write `scripts/verificar-pelicula.mjs`** con: «apertura: aparece, se abre y se quita sola (≤ 3 s)»; «apertura: con sessionStorage que lanza, igual se quita» (Review Focus 1, `addInitScript` que rompe `sessionStorage`); «apertura: no vuelve en la misma sesión»; «tomas: a los 6 s se ve la segunda foto»; «tomas en quieto: solo la primera»; «palabras: cambian y el título no cambia de alto» (Review Focus 2: alto del `h1` igual en 3 cambios); «palabras: el lector lee una sola»; «sin errores».
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `verificar-pelicula`, `verificar-encabezados` y `npm test` → PASS.
- [ ] **Step 5: Commit** — «Encabezado: apertura, varias tomas y palabras que rotan».

### Task 3: Salida que entrega la posta y estado del negocio

**Files:**
- Modify: `src/encabezados/Encabezado.tsx`, `src/encabezados/css.ts`, `src/encabezados/catalogo.ts`, `src/receta/receta.ts`
- Create: `src/encabezados/BarraEncabezado.tsx`, `src/encabezados/EstadoNegocio.tsx`
- Modify: `demo/Encabezados.tsx`, `scripts/verificar-pelicula.mjs`

**Interfaces:**
- Produces (props): `salida?: SalidaEncabezado` con `"barra" | "telon"`; `barraPropia?: boolean`; `logo?: string`; `nombre?: string`; `estado?: boolean`; `estadoNegocio?: { abierto: boolean; cierraA?: string; abreA?: { dia: string; hora: string }; proximaHora?: string }`.
  - `barra`: al pasar el encabezado aparece una barra fija arriba (`<nav aria-label="Barra del negocio">`, no `h1`) con logo o nombre (o el título sin asteriscos) y el **mismo** botón principal; mientras el encabezado se ve, la barra está `inert` y oculta (Review Focus 3). Con `barraPropia`, no dibuja barra: el encabezado solo se achica. Sin scroll nativo, la barra aparece con `IntersectionObserver`.
  - `telon`: al salir, el encabezado se abre en dos mitades (`translate`) como telón.
  - `EstadoNegocio`: chip «Abierto ahora · cierra a las 22:00» / «Cerrado · abre el lunes a las 9:00» / «Próxima hora libre: hoy 17:30»; sin `estadoNegocio`, nada.
- [ ] **Step 1: Checks** en `verificar-pelicula.mjs`: «barra: aparece al bajar con el botón principal»; «barra: mientras se ve el encabezado está inert y oculta, y hay un solo h1» (Review Focus 3); «barraPropia: no dibuja barra»; «telón: al bajar las mitades se separan»; «estado: abierto, cerrado y próxima hora se leen»; «estado: sin datos no se dibuja».
- [ ] **Step 2–4:** RED → implementar → GREEN (`verificar-pelicula`, `verificar-encabezados`, `npm test`).
- [ ] **Step 5: Commit** — «Encabezado: barra al bajar, telón y estado del negocio».

### Task 4: Foto dentro de las letras, tratamiento de foto y hora del día

**Files:**
- Modify: `src/encabezados/Encabezado.tsx`, `src/encabezados/css.ts`, `demo/Encabezados.tsx`, `scripts/verificar-pelicula.mjs`

**Interfaces:**
- Produces (props): `fotoEnLetras?: boolean`, `tratamiento?: Tratamiento`, `horaDelDia?: boolean` (y `ahora?: Date` para pruebas).
  - Foto en letras: `background-clip: text` con la primera foto en el `h1`; con `@supports not (background-clip:text)` o sin foto o si la foto no carga (`onError`), el título vuelve a `color: var(--mk-texto)` (Review Focus 5).
  - Tratamiento: CSS sobre las fotos del encabezado (`.mk-enc-media img`, póster, tomas): `duotono` (escala de grises + capa del acento con `mix-blend-mode`), `grano` (textura `RUIDO` existente), `trama` (puntos con `radial-gradient` y `mix-blend-mode`), `bn` (blanco y negro con el acento solo en el resaltado). Sin animación.
  - Hora del día: `data-hora={franjaDe(ahora ?? new Date())}` en el `header`; tinte y luz por franja con variables (mañana más clara y cálida, noche más oscura con el acento como luz).
- [ ] **Step 1: Checks**: «foto en letras: el título usa la foto»; «foto en letras sin foto: el título tiene color visible» (Review Focus 5); «tratamientos: cada uno cambia el filtro o la capa de la foto»; «hora del día: data-hora sigue la hora fijada (mañana, tarde, noche)».
- [ ] **Step 2–4:** RED → implementar → GREEN.
- [ ] **Step 5: Commit** — «Encabezado: foto en las letras, tratamiento de foto y hora del día».

### Task 5: Colores desde la foto y editor completo

**Files:**
- Create: `src/receta/paletaDeFoto.ts`
- Modify: `src/receta/index.ts`, `src/entradas/encabezado.ts`, `demo/Encabezados.tsx`
- Test: `pruebas/paleta-foto.test.ts`, `scripts/verificar-pelicula.mjs`

**Interfaces:**
- Produces:
  ```ts
  export function paletaDesdePixeles(px: Uint8ClampedArray): { paleta: PaletaLaMente; tema: TemaLaMente; colores: string[] };
  // colores dominantes (cuantización simple 4×4×4, ignora casi blancos/negros si hay otros), paleta = la de PALETAS_LAMENTE
  // con menor distancia (fondo + acento), tema = el que propone esa paleta (TEMAS_LAMENTE[t].paleta), o «clasico».
  export function paletaDeFoto(archivo: Blob): Promise<ReturnType<typeof paletaDesdePixeles>>; // canvas 64×64 en el navegador
  ```
- Editor: al subir una foto, botón «Usar colores de la foto» que pone tema y paleta de La Mente; todas las ideas nuevas con sus controles; el JSON muestra la receta v2.
- [ ] **Step 1: Tests** `pruebas/paleta-foto.test.ts`: píxeles casi todos verde bosque (`#2f6b3f` y `#f3f7f2`) → `paleta: "bosque"`; casi todos noche (`#111418` y `#f2c14e`) → `"noche"`; imagen toda blanca → `"clasica"`. En `verificar-pelicula`: «colores desde la foto: el botón cambia tema y paleta» y «el JSON es una receta v2 válida».
- [ ] **Step 2–4:** RED → implementar → GREEN.
- [ ] **Step 5: Commit** — «Colores desde la foto y editor del encabezado de película».

### Task 6: Peso, documentos y cierre

**Files:** `scripts/medir-paquete.mjs` (sin cambiar topes salvo OK), `CHANGELOG.md`, `docs/CATALOGO.md`, la hoja de ruta, `CLAUDE.md` (`verificar-pelicula`), `docs/ci/verificar.yml`, `../cerebro-aquiles/AVANCES.md`.

- [ ] **Step 1: Run** `rm -rf dist && npm run build`, `npm run peso` (encabezado ≤ 35 KB; si se pasa, cargar tomas y foto en letras con `import()` y volver a medir), `npm run probar-paquete`.
- [ ] **Step 2: Run** una tras otra `verificar-pelicula`, `-encabezados`, `-relatos`, `-biblioteca`, `-escena`, `-lamente` → todas en verde.
- [ ] **Step 3: Docs** y fila en AVANCES.
- [ ] **Step 4: Commit y push** a `dev` (OK de Aquiles: «hace todo»).
