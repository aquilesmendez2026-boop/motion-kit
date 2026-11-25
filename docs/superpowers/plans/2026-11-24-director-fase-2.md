# Director, fase 2 (enfocada): plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** poder escribir partituras en español, con un modelo estable (versión 1) que incline en 3D, y el Director
pasando entero en Chromium y en WebKit.

**Architecture:** el modelo, el validador y el Director de la fase 1 se extienden (no se reescriben). El lenguaje es
un lector y un escritor puros en una entrada aparte (`motion-kit/partitura`), junto con las partituras de la casa.

**Tech Stack:** TypeScript, React 19, Web Animations, Vite, Playwright (Chromium y WebKit). Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-24-director-fase-2-design.md` (incluye 21 precisiones, que mandan sobre el cuerpo).

## Global Constraints

- Sin librerías de animación ni dependencias nuevas. Nada con `Math.random`. Sin modelos de IA.
- Solo se animan `transform`, `translate`, `rotate`, `scale` y `opacity`.
- `motion-kit/director`: tope **10 KB** gzip al cargar (hoy 9,1). No se sube: si no cabe, se baja aparte en el orden
  de la precisión 8. Las demás entradas no crecen.
- `motion-kit/partitura` (nueva, solo para quien crea): tope propuesto **8 KB**, pendiente de que lo fije Aquiles. Si
  pasa de 8, parar y preguntar.
- No se reemplaza ninguna pieza que ya existe. Nada de lo publicado cambia de comportamiento.
- Toda partitura de la versión 0 que valía sigue valiendo (subida a 1).
- Español de Chile, frases cortas. Sin commits hasta que Aquiles lo ordene.
- No se editan `src/` ni `demo/` mientras corre una prueba visual. Pruebas visuales: solo las que el cambio toca
  (`npm run verificar`), más `node scripts/en-safari.mjs director`.

## Review Focus

1. **Texto hostil para el lector** (miles de líneas, una línea enorme, tabuladores, caracteres raros, solo comentarios):
   no lanza, tarda poco y devuelve a lo más 20 errores con su línea. Prueba en la tarea 4.
2. **Una versión 0 mal formada al subirla** (campos de más, tipos equivocados, sin `escenas`): se rechaza con mensaje y
   no lanza. Prueba en la tarea 1.
3. **La profundidad puesta en un padre:** dos partituras sobre el mismo padre, un actor que React desmonta a media
   animación, un padre que ya traía la suya. Al desmontar todo, el padre queda como estaba. Prueba en la tarea 2.
4. **Ida y vuelta con valores de borde** (ceros, negativos, porcentajes, justo en los topes, nombres de actor que son
   palabras del lenguaje): leer lo escrito da la misma partitura. Prueba en la tarea 4.
5. **Inclinación en texto cortado por letra, atada al scroll y con el respaldo manual** (sin líneas de tiempo de
   scroll, como en Safari): se ve lo mismo que con la nativa y al desmontar no queda nada. Prueba en las tareas 2 y 3.

---

### Task 1: Modelo versión 1, validador, subida y contrato

**Files:** Modify `src/director/modelo.ts`, `src/director/validar.ts`, `src/director/contrato-partitura.ts`,
`src/director/partituras.ts` (los seis ejemplos pasan a versión 1). Create `src/director/subir.ts`. Test:
`pruebas/director.test.ts` (se ajusta) y `pruebas/director2.test.ts` (nueva).

**Interfaces — Produces:**
- `VERSION_PARTITURA = 1`. `Cambio` suma `inclinaX?: number` e `inclinaY?: number` (grados).
- `PasoSeguir = { actor: string; a: Cambio; resorte?: Resorte }`. `PasoScroll` suma `reparto?: number` (0,05 a 1).
- `TOPES` suma `inclina: 90`, `final.inclina: 15`, `seguir.inclina: 25`, `estado.inclina: 4`, `reparto: [0.05, 1]` y
  `PROFUNDIDAD = 900`.
- `subirPartitura(x: unknown): unknown` (`src/director/subir.ts`): versión 0 → forma de la 1 (sin validar; lo demás
  pasa tal cual).
- `validarPartitura(x)` devuelve siempre `partitura.version === 1`. Reglas nuevas: en lo continuo y en `estado`, un
  paso con `giro` y con inclinación no vale; `x` o `y` con porcentaje en lo que sigue no vale.
- El contrato trae `version: 1`, `curvas` (cuatro números cada una), `resortes` (rigidez y freno), `profundidad`,
  los topes nuevos y `tramos` (las fórmulas en palabras).

- [ ] **Step 1: pruebas que fallan** (`pruebas/director2.test.ts`): una versión 0 con `puntero` plano se sube y vale;
  cada tope de inclinación rechaza (91° en `de`, 16° en `a` de `verse`, 26° en seguir, 5° en `estado`); `giro` con
  inclinación en `vista`, `puntero` y `estado` rechaza, y en `verse` vale; `reparto` 0 y 1,2 rechazan, 0,05 y 1 valen;
  porcentaje en `a.x` de `puntero` rechaza; una versión 0 con basura no lanza; `version: 2` rechaza; el contrato lista
  curvas, resortes, profundidad y `version: 1`; los seis ejemplos valen.
- [ ] **Step 2–3:** FAIL → implementar → `node scripts/pruebas.mjs director` → PASS; `npm run contrato`; typecheck.

### Task 2: El Director con inclinación, `a` en lo que sigue, reparto y nombres

**Files:** Modify `src/director/fotogramas.ts`, `src/director/senales.ts`, `src/director/seguir.ts`,
`src/director/montar.ts`. Create `src/director/profundidad.ts`. Modify `demo/Director.tsx` (ejemplos con inclinación) y
`scripts/verificar-director.mjs` (parte `inclina`). Test: `pruebas/director2.test.ts`.

**Interfaces — Produces:**
- `fotogramasTiempo` pone `perspective(900px) rotateX() rotateY()` al principio cuando el paso inclina, con la misma
  lista en `de` y `a`. `fotogramasSueltos` y `valorSeguido(p, sx, sy)` devuelven `rotate` como `"<x> <y> 0 <ángulo>deg"`
  cuando hay inclinación (eje con el mismo signo en `de` y `a`; ángulo = largo del vector).
- `rangoDePieza(entre, k, n, reparto = 0.5)`.
- `darProfundidad(el: Element): () => void` (`profundidad.ts`): pone `perspective: 900px` en `el` si no trae una, con
  contador por elemento; lo devuelto la suelta.
- Cada animación creada lleva `id`: `mk-verse`, `mk-estado`, `mk-vista` o `mk-scroll`.

- [ ] **Step 1: pruebas que fallan.** Unitarias: fotogramas con inclinación (lista igual en `de` y `a`; liviano sin
  inclinación), eje y ángulo del `rotate`, `valorSeguido` con `a`, `rangoDePieza` con reparto 0,05, 0,5 y 1. Visual
  (parte `inclina`): una entrada que se levanta termina plana y legible; una tarjeta sigue al puntero inclinándose y
  vuelve; el padre recibe la profundidad y al desmontar queda como estaba (también con dos partituras y con un padre
  que ya la traía); en liviano y con movimiento reducido no hay inclinación; con el cursor sobre algo que se aprieta
  la tarjeta no se inclina; texto por letra inclinado con scroll, nativo y con respaldo, da lo mismo.
- [ ] **Step 2–3:** FAIL → implementar → PASS. `npm run build && npm run peso`: `director` ≤ 10 KB.

### Task 3: Safari para el Director

**Files:** Modify `scripts/verificar-director.mjs` (usa los nombres de las animaciones; lo que necesita líneas de
tiempo nativas se salta con su razón cuando no existen).

- [ ] **Step 1:** `node scripts/en-safari.mjs director` → hoy 10 fallas (anotadas en el catálogo).
- [ ] **Step 2:** corregir la prueba y lo que resulte ser del Director (cada arreglo del Director con su revisión).
- [ ] **Step 3:** `node scripts/verificar-director.mjs` y `node scripts/en-safari.mjs director` → los dos sin fallas.

### Task 4: El lenguaje en español

**Files:** Create `src/partitura/leer.ts`, `src/partitura/escribir.ts`, `src/partitura/frases.ts` (la tabla de frases,
que usan los dos), `src/entradas/partitura.ts`, `pruebas/partitura-texto.test.ts`. Modify `vite.config.ts`,
`package.json` (`exports`), `scripts/medir-paquete.mjs` (entrada y tope 8), `scripts/probar-paquete.mjs`.

**Interfaces — Produces:**
- `leerPartitura(texto: string): { ok: true; partitura: Partitura } | { ok: false; errores: { linea: number; mensaje: string }[] }`
  (a lo más 20 errores; lo leído pasa por `validarPartitura`, y sus errores se devuelven con la línea del paso).
- `escribirPartitura(p: Partitura): string` (forma canónica).
- La entrada `motion-kit/partitura` exporta las dos, `subirPartitura`, `validarPartitura` y, desde la tarea 5, las
  partituras de la casa y `sorprender`.

- [ ] **Step 1: pruebas que fallan:** el ejemplo del diseño (§2) da la partitura esperada, campo por campo; cada fila
  de las tablas 2.2 y 2.3 con su valor y su signo; tildes y mayúsculas; comentarios; frase fuera de escena, frase
  repetida, frase desconocida, coma decimal, número fuera de tope: error con línea; texto hostil (foco 1); ida y vuelta
  de los seis ejemplos, de los valores de borde (foco 4) y de 200 partituras armadas con semilla.
- [ ] **Step 2–3:** FAIL → implementar → PASS. `npm run build && npm run peso`: `partitura` ≤ 8 KB; `probar-paquete`.

### Task 5: Partituras de la casa, «Sorpréndeme» y vitrina

**Files:** Create `src/director/casa/textos.ts`, `encabezado.ts`, `momentos.ts`, `especiales.ts`, `sorprender.ts`,
`indice.ts`. Modify `src/entradas/partitura.ts`, `demo/Director.tsx`, `demo/demo.css`, `scripts/verificar-director.mjs`
(parte `casa`). Test: `pruebas/director2.test.ts`.

**Interfaces — Produces:**
- `CASA: { id: string; nombre: string; grupo: "texto" | "encabezado" | "momento" | "especial"; partes: string[]; partitura: Partitura; nota?: string }[]`
  (texto: revelar, voltear, trailer, impacto, rebote, caer, maquina; encabezado: cascada, deslizar, zoom; momento:
  cuatro; especial: titulo-con-volumen, tarjeta-holografica).
- `sorprender(semilla: number, partes: string[]): Partitura`.

- [ ] **Step 1: pruebas que fallan:** todas las de la casa valen y se escriben y leen igual; `sorprender` da lo mismo
  con la misma semilla, distinto con otra, siempre válida (500 semillas) y solo usa las partes que le pasan. Visual
  (parte `casa`): revelar, voltear y trailer coinciden con `TextoCinetico` letra por letra en cinco instantes (reloj
  manual); la vitrina deja escribir en español, muestra los errores con su línea y corre lo escrito; título con
  volumen y tarjeta holográfica responden al puntero.
- [ ] **Step 2–3:** FAIL → implementar → PASS.

### Task 6: Cierre

- [ ] `npm test`, `npm run typecheck`, `npm run build && npm run peso`, `npm run probar-paquete`, `npm run contrato`.
- [ ] `npm run verificar` y `node scripts/en-safari.mjs director`.
- [ ] Documentos: `docs/CATALOGO.md` (Director fase 2, lenguaje, casa, Safari al día), `CHANGELOG.md`, `CLAUDE.md`,
  `scripts/verificar-cambios.mjs` (reglas para `src/partitura/`), y encargo
  `cerebro-aquiles/lamente/ENCARGO_2026-11-24_partitura-y-lenguaje.md`.
- [ ] Revisión final independiente (Opus) y arreglos.
