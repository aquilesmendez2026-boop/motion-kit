# Fotos vivas: plan de construcción

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foto viva en el encabezado (partículas, ondas, líquido entre tomas) y en la galería (ondas y visor que crece),
con un motor WebGL propio de a lo más dos lienzos por página, cargado aparte.

**Architecture:** `src/fotos/` tiene lo puro (`calculos.ts`), el motor WebGL (`motor.ts`, se carga aparte), la foto
viva del encabezado (`FotoVivaEncabezado.tsx`, aparte), el lienzo itinerante de la galería (`galeria.ts`, aparte) y el
visor (`VisorFotos.tsx`, aparte). El encabezado y el mosaico solo deciden y hacen `import()`. La receta v2 suma
`fotoViva`.

**Tech Stack:** React 19, TypeScript, WebGL 1 a mano, View Transitions, Vite 7, `node --test`, Playwright 1.49.

**Spec:** `docs/superpowers/specs/2026-11-23-fotos-vivas-design.md`

## Global Constraints

- Sin librerías ni dependencias nuevas. `ShaderFondo` no se toca: `src/fotos/` copia lo mínimo.
- CSS que se anima: solo `transform` y `opacity`. WebGL dibuja en su lienzo.
- A lo más **dos** lienzos WebGL de fotos por página: uno del encabezado, uno itinerante de galería.
- La `<img>` visible nunca cambia ni lleva `crossorigin`. El motor pide la textura aparte con
  `crossOrigin = "anonymous"` solo si `origenPermitido` (mismo sitio, `data:`, `blob:` u `origenesFotos`).
- Cualquier falla (sin WebGL, textura sin permiso, contexto perdido, foto que no carga): el lienzo se quita y se ve la
  foto normal. El lienzo es `aria-hidden`.
- Niveles: completo = todo; liviano = sin WebGL (visor con crecimiento sí); quieto = sin WebGL y visor sin animación.
- Topes sin subir: `encabezado` 35 KB, `momentos` 12 KB. Si una entrada se pasa, parar y preguntar a Aquiles.
- Receta: `fotoViva?: boolean` en la v2 (sin v3); aviso «La foto viva solo se ve en las composiciones con foto: queda
  apagada.»; contrato regenerado.
- Textos: «Anterior», «Siguiente», «Cerrar», «Foto N de M». Español de Chile.
- Sin commits (Aquiles: «no hagas commit»). Los cambios quedan en el árbol de trabajo.

## Review Focus

1. **Foto que no carga (404) con foto viva:** se ve igual que hoy (la `<img>` rota o el fondo), sin lienzo negro. Prueba
   en la tarea 3.
2. **Bajar o girar con el lienzo itinerante encima:** el lienzo sigue a la foto (misma caja ±2 px). Prueba en la tarea 4.
3. **Visor con una sola foto y con teclado:** sin Anterior ni Siguiente; Tab no sale del visor; el foco vuelve a la
   foto. Prueba en la tarea 5.
4. **Contexto WebGL perdido** (`WEBGL_lose_context`): el lienzo se quita y queda la foto, sin errores. Prueba en la
   tarea 3.
5. **Foto viva con apertura:** no hay partículas (la apertura ya es la entrada). Prueba en la tarea 3.

---

## Archivos

| Archivo | Qué tiene |
|---|---|
| `src/fotos/calculos.ts` | `origenPermitido`, `rejillaParticulas` (puro) |
| `src/fotos/motor.ts` | `crearMotor` y los tres efectos (aparte) |
| `src/fotos/FotoVivaEncabezado.tsx` | Foto viva del encabezado sobre la `<img>` o las tomas (aparte) |
| `src/fotos/galeria.ts` | Lienzo itinerante de la galería, uno por página (aparte) |
| `src/fotos/VisorFotos.tsx` | Visor que crece (aparte) |
| `src/encabezados/Encabezado.tsx`, `Tomas.tsx` | Props `fotoViva`, `origenesFotos`; tomas controladas |
| `src/receta/receta.ts`, `contrato/encabezado-motionkit.json` | Campo `fotoViva` |
| `src/momentos/MosaicoQueSeArma.tsx` | Props `viva`, `visor`, `origenesFotos` |
| `pruebas/fotos.test.ts`, `pruebas/receta.test.ts` | Pruebas puras |
| `scripts/verificar-fotos.mjs` | Prueba visual |
| `demo/Encabezados.tsx`, `demo/Momentos.tsx` | Interruptor «Foto viva» y galería viva |
| Documentos | `docs/CATALOGO.md`, `CHANGELOG.md`, `CLAUDE.md`, `docs/ci/verificar.yml`, encargo para La Mente |

El lienzo de fotos lleva `className="mk-foto-viva"`, `aria-hidden="true"` y `data-efecto` con lo que está dibujando:
`"particulas" | "ondas" | "liquido" | "quieta"` (lo leen las pruebas).

---

### Task 1: Cálculos puros

**Files:** Create `src/fotos/calculos.ts`, `pruebas/fotos.test.ts`.

**Interfaces — Produces:**
- `origenPermitido(url: string, origenes: string[], origenPagina: string): boolean` — `true` para `data:image/`,
  `blob:`, rutas relativas y URLs absolutas cuyo `origin` sea `origenPagina` o esté en `origenes`; `false` para lo
  demás (incluye `javascript:`, vacío y `//otro`).
- `rejillaParticulas(ancho: number, alto: number, maximo: number): { columnas: number; filas: number }` — guarda la
  proporción, `columnas × filas ≤ maximo`, mínimo 1×1; ancho o alto ≤ 0 o NaN → 1×1.
- `PARTICULAS_MAX = { escritorio: 10000, telefono: 4000 }`.

- [ ] **Step 1: Write the failing tests** (`pruebas/fotos.test.ts`):

```ts
test("origenPermitido", () => {
  const P = "https://cafe.lamente.cl";
  assert.equal(origenPermitido("https://cafe.lamente.cl/f.jpg", [], P), true);
  assert.equal(origenPermitido("/f.jpg", [], P), true);
  assert.equal(origenPermitido("data:image/png;base64,AA", [], P), true);
  assert.equal(origenPermitido("blob:https://cafe.lamente.cl/x", [], P), true);
  assert.equal(origenPermitido("https://fotos.lamente.cl/f.jpg", ["https://fotos.lamente.cl"], P), true);
  assert.equal(origenPermitido("https://instagram.com/f.jpg", ["https://fotos.lamente.cl"], P), false);
  assert.equal(origenPermitido("//otro.cl/f.jpg", [], P), false);
  assert.equal(origenPermitido("javascript:x", [], P), false);
  assert.equal(origenPermitido("", [], P), false);
});
test("rejillaParticulas guarda la proporción y el tope", () => {
  const r = rejillaParticulas(1600, 900, 10000);
  assert.ok(r.columnas * r.filas <= 10000 && r.columnas * r.filas > 9000);
  assert.ok(Math.abs(r.columnas / r.filas - 16 / 9) < 0.05);
  assert.deepEqual(rejillaParticulas(0, 900, 10000), { columnas: 1, filas: 1 });
  assert.deepEqual(rejillaParticulas(NaN, NaN, 4000), { columnas: 1, filas: 1 });
});
```

- [ ] **Step 2: Run** `node scripts/pruebas.mjs fotos` → FAIL (no existe el módulo).
- [ ] **Step 3: Implement** en `src/fotos/calculos.ts` (`new URL(url, origenPagina)` para resolver; `data:` solo si es
  `data:image/`).
- [ ] **Step 4: Run** `node scripts/pruebas.mjs fotos` → PASS.

### Task 2: Receta `fotoViva`, contrato y editor

**Files:** Modify `src/receta/receta.ts` (tipo, `CAMPOS_RECETA` después de `tomas`, validación booleana junto a
`tomas`, normalización, `recetaAProps`), `contrato/encabezado-motionkit.json` (con `npm run contrato`),
`src/encabezados/Encabezado.tsx` (props `fotoViva?: boolean`, `origenesFotos?: string[]`, sin efecto todavía),
`demo/Encabezados.tsx` (casilla «Foto viva (ondas, partículas y cambio líquido)», `data-prueba="foto-viva"`, en la
parte Película junto a «Varias tomas»), `pruebas/receta.test.ts`.

**Interfaces — Produces:** `RecetaEncabezado.fotoViva?: boolean`; `recetaAProps(r).fotoViva`; props de `Encabezado`
`fotoViva` y `origenesFotos`.

- [ ] **Step 1: Write the failing tests** (`pruebas/receta.test.ts`):

```ts
test("fotoViva: campo de la v2, pide composición con foto", () => {
  const r = normalizarReceta({ version: 2, estilo: "pelicula", titulo: "Café", composicion: "imagen", imagenes: ["a.jpg"], fotoViva: true });
  assert.equal(r.fotoViva, true);
  assert.equal(recetaAProps(r).fotoViva, true);
  const sin = validarReceta({ version: 2, estilo: "pelicula", titulo: "Café", composicion: "gigante", fotoViva: true });
  assert.ok(sin.ok && sin.avisos.includes("La foto viva solo se ve en las composiciones con foto: queda apagada."));
  assert.equal(sin.ok && sin.receta.fotoViva, undefined);
  const mala = validarReceta({ version: 2, estilo: "pelicula", titulo: "Café", fotoViva: "si" });
  assert.ok(!mala.ok && mala.errores.some((e) => e.campo === "fotoViva"));
  assert.ok(contratoEncabezado().campos.includes("fotoViva"));
});
```

  (Ajustar los nombres `avisos`, `errores`, `campo` y la forma del resultado a los que ya usa `validarReceta` en
  `pruebas/receta.test.ts`; los valores y el texto del aviso son fijos.)

- [ ] **Step 2: Run** `node scripts/pruebas.mjs receta` → FAIL.
- [ ] **Step 3: Implement.** Con objeto 3D en «dividido» también se apaga (misma regla que `tomas`). `fotoViva` no entra
  en `PROTAGONISTA_RECETA`. Después, `npm run contrato`.
- [ ] **Step 4: Run** `npm test && npm run typecheck` → PASS (incluye `generar-contrato --revisar`).

### Task 3: Motor y foto viva del encabezado

**Files:** Create `src/fotos/motor.ts`, `src/fotos/FotoVivaEncabezado.tsx`, `scripts/verificar-fotos.mjs`. Modify
`src/encabezados/Encabezado.tsx` (en `media(0)`), `src/encabezados/Tomas.tsx`, `demo/Encabezados.tsx` (el botón
«Ver la apertura otra vez» también llama `olvidarParticulas()`, importado con `import()` para no cargar el motor).

**Interfaces:**
- Consumes: `origenPermitido`, `rejillaParticulas`, `PARTICULAS_MAX` (tarea 1); `fotoViva`, `origenesFotos` (tarea 2).
- Produces:
  - `crearMotor(lienzo: HTMLCanvasElement): Motor | null` (`null` si no hay WebGL) con
    `cargar(url: string): Promise<Textura | null>`, `mostrar(t: Textura): void`, `ondas(x: number, y: number): void`
    (coordenadas 0..1 del lienzo; hasta 6 ondas), `particulas(t: Textura, maximo: number): Promise<void>` (~1,2 s),
    `liquido(de: Textura, a: Textura): Promise<void>` (~1 s), `ajustar(): void` (tamaño con `devicePixelRatio` hasta 2),
    `pausar(si: boolean): void`, `alPerder(f: () => void): void`, `destruir(): void`.
  - `Tomas` acepta `activa?: number` (controlada: sin temporizador propio) además de lo que ya tiene.
  - `FotoVivaEncabezado({ fotos, alt, tomas, particulas, origenes }: { fotos: string[]; alt: string; tomas: boolean; particulas: boolean; origenes: string[] })`
    — dibuja la `<img>` (o `Tomas` controladas) y encima el lienzo; con `tomas` lleva el temporizador de 5 s (pausado
    con la pestaña oculta) y, si el lienzo está listo, hace `liquido` y después cambia `activa`; si no, cambia `activa`
    directo (fundido de siempre). Partículas: una vez por carga de página (variable de módulo), salvo `particulas`
    falso. Exporta `olvidarParticulas()` para el editor.
- `Encabezado`: con `fotoViva` y nivel completo, `media(0)` usa `lazy(() => import("../fotos/FotoVivaEncabezado"))`
  con `Suspense` cuyo respaldo es lo de hoy; `particulas = !apertura`. En liviano o quieto, lo de hoy.

- [ ] **Step 1: Write the failing visual checks** en `scripts/verificar-fotos.mjs` (mismo armado que
  `verificar-momentos.mjs`; abre `#encabezados`, elige composición «imagen», marca `foto-viva` y `fotos-ejemplo`):
  - hay un `.mk-foto-viva` dentro de `.mk-enc` y su `data-efecto` pasa por `particulas` y termina en `quieta`;
  - pasar el mouse sobre la foto pone `data-efecto="ondas"`;
  - con `tomas` marcado, en 6,5 s el lienzo pasa por `liquido` y cambia la toma activa;
  - con apertura marcada y recargando, `data-efecto` nunca es `particulas` (Review Focus 5);
  - con la foto respondiendo 404 (`route`), no hay `.mk-foto-viva` (Review Focus 1);
  - `WEBGL_lose_context().loseContext()` en el lienzo → el lienzo desaparece y no hay errores (Review Focus 4);
  - una foto de otro origen sin permiso (`route` a `https://otro.ejemplo/f.jpg` sin cabecera CORS) → sin lienzo y una
    sola petición a esa foto;
  - con `reducedMotion: "reduce"` no hay `.mk-foto-viva`;
  - sin errores de consola.
- [ ] **Step 2: Run** `node scripts/verificar-fotos.mjs` (con `npm run dev`) → las revisiones nuevas fallan.
- [ ] **Step 3: Implement.** Shaders cortos como en `ShaderFondo`: ondas = desplazamiento de las coordenadas de la
  textura por ondas que se expanden y se apagan en ~1,5 s; partículas = `gl.POINTS` (una por celda de
  `rejillaParticulas`) que interpolan desde una posición por semilla hasta su lugar, color de la textura;
  líquido = mezcla de dos texturas con un borde de ruido que avanza. Pausa fuera de la vista (`IntersectionObserver`)
  y con la pestaña oculta; `webglcontextlost` → `alPerder`.
- [ ] **Step 4: Run** `node scripts/verificar-fotos.mjs`, `node scripts/verificar-pelicula.mjs` y
  `node scripts/verificar-encabezados.mjs` → todo ✓.

### Task 4: Lienzo itinerante de la galería

**Files:** Create `src/fotos/galeria.ts`. Modify `src/momentos/MosaicoQueSeArma.tsx`, `demo/Momentos.tsx`,
`scripts/verificar-fotos.mjs`.

**Interfaces:**
- Produces: `tomarFoto(img: HTMLImageElement, origenes: string[]): Promise<void>` — un solo lienzo por página
  (variable de módulo); lo ubica sobre `img` con `position: fixed` y `transform` según `getBoundingClientRect()`,
  y lo realinea en `scroll` y `resize` (con `requestAnimationFrame`); dibuja ondas mientras el dedo o el cursor se
  mueve sobre la foto; al salir o soltar, se apaga en ~1,5 s y se esconde. `soltarFoto(): void`.
- `MosaicoQueSeArma` suma `viva?: boolean`, `visor?: boolean`, `origenesFotos?: string[]` (apagados por defecto). Con
  `viva` y nivel completo: en `pointerenter`/`pointerdown` sobre una foto, `import("../fotos/galeria")` y `tomarFoto`.
- Demo `#momentos`: la sección del mosaico con `viva` y `visor`.

- [ ] **Step 1: Write the failing checks** en `verificar-fotos.mjs` (`#momentos`): al pasar el mouse sobre una foto del
  mosaico aparece un `.mk-foto-viva` con `data-efecto="ondas"` y misma caja que la foto ±2 px; tras bajar 120 px sigue
  en la caja de la foto ±2 px (Review Focus 2); al pasar a otra foto el lienzo se mueve (sigue habiendo uno solo); en
  toda la página nunca hay más de 2 `.mk-foto-viva`; en liviano no aparece.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Reusa `crearMotor` (tarea 3).
- [ ] **Step 4: Run** `node scripts/verificar-fotos.mjs` y `node scripts/verificar-momentos.mjs` → todo ✓.

### Task 5: Visor que crece

**Files:** Create `src/fotos/VisorFotos.tsx`. Modify `src/momentos/MosaicoQueSeArma.tsx`, `scripts/verificar-fotos.mjs`.

**Interfaces — Produces:** `VisorFotos({ fotos, inicial, origen, nivel, alCerrar }: { fotos: { url: string; pie?: string }[]; inicial: number; origen: HTMLElement | null; nivel: NivelEscena; alCerrar: () => void })`.
Con `visor`, un toque corto (menos de 10 px de movimiento) sobre una foto del mosaico lo abre (`lazy`).

- [ ] **Step 1: Write the failing checks:** clic en una foto → `[role=dialog][aria-modal=true]` con la foto y el título
  (el pie o «Foto N de M»); el foco está dentro; Tab 10 veces no sale del visor; «Siguiente» y flecha derecha avanzan
  y dan la vuelta; Escape cierra y el foco vuelve a la foto tocada; con una sola foto no hay «Anterior» ni «Siguiente»
  (Review Focus 3); mientras está abierto `scrollY` no cambia con la rueda; con movimiento reducido abre sin
  animaciones (`getAnimations()` vacío); a 360 px el visor no genera scroll horizontal.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Con `document.startViewTransition`: `view-transition-name: mk-visor-foto` en la foto
  tocada antes de abrir y en la foto del visor después; se quita al terminar y al cerrar (el cierre hace lo inverso).
  Sin View Transitions: animación propia de `transform` (de la caja de la foto a la del visor, ~350 ms, con
  `--mk-resorte-curva`). Quieto: sin animación. Deslizar a los lados cambia de foto; hacia abajo más de 80 px cierra.
  Fondo bloqueado con `overflow: hidden` en `html` mientras está abierto (se devuelve al cerrar).
- [ ] **Step 4: Run** `node scripts/verificar-fotos.mjs` y `node scripts/verificar-momentos.mjs` → todo ✓.

### Task 6: Peso, paquete, documentos y encargo

**Files:** Modify `scripts/probar-paquete.mjs` (si hace falta), `docs/CATALOGO.md` (sección «Fotos vivas
(23-11-2026)»), `CHANGELOG.md` (en «Sin publicar»), `CLAUDE.md` (sumar `fotos` a las pruebas visuales),
`docs/ci/verificar.yml` (sumar `fotos`). Create `../cerebro-aquiles/lamente/ENCARGO_2026-11-23_permiso-fotos-webgl.md`
(que el servidor de las fotos de los dueños responda `Access-Control-Allow-Origin` para sus páginas y que el front
pase su origen en `origenesFotos`; no partir sin OK de Aquiles; nada en AWS sin OK).

- [ ] **Step 1: Run** `npm run build && npm run peso` → `encabezado` ≤ 35 y `momentos` ≤ 12; lo nuevo aparece como
  perezoso. Si no cabe: parar y preguntar a Aquiles.
- [ ] **Step 2: Run** `npm run probar-paquete`, `npm test`, `npm run typecheck` y, con el servidor arriba,
  `verificar-fotos`, `verificar-momentos`, `verificar-pelicula`, `verificar-encabezados`, `verificar-relatos` → todo ✓.
- [ ] **Step 3:** Documentos y encargo.
