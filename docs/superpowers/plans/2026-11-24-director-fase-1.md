# Director, fase 1 (el núcleo): plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** que un movimiento sea un dato (una partitura) que el Director hace correr con lo que el navegador ya trae.

**Architecture:** un modelo cerrado (Partitura v0) con su validador y su contrato; un Director sin React que traduce
cada escena a animaciones nativas (tiempo y scroll) y deja un solo bucle (el compás) para lo que sigue al dedo; un
componente de React delgado encima. Las reglas de la casa viven en el Director.

**Tech Stack:** TypeScript, React 19, Web Animations, `ViewTimeline`/`ScrollTimeline`, Vite. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-24-director-fase-1-design.md` (incluye las 15 precisiones).

## Global Constraints

- Sin librerías de animación ni dependencias nuevas.
- Solo se animan `transform`, `translate`, `rotate`, `scale` y `opacity`.
- Nada con `Math.random`.
- Entrada nueva `motion-kit/director`: tope **10 KB** gzip al cargar. Las demás entradas no pueden crecer.
- El contrato sale como **versión 0, experimental**. La Mente no lo copia en esta fase.
- Nada de lo que existe en `src/` cambia de comportamiento.
- Español de Chile, frases cortas, en comentarios, mensajes y documentos.
- Sin commits hasta que Aquiles lo ordene (el commit de la tanda anterior ya lo ordenó; esta fase va aparte).
- No se editan `src/` ni `demo/` mientras corre una prueba visual.

## Review Focus

1. **React cambia un texto cortado, o desmonta un actor a medio animar:** no lanza y el texto queda bien. Prueba en la
   tarea 3 (unitaria con DOM falso no alcanza: visual en la tarea 8).
2. **Partitura hostil o rota** (campos de más, números enormes, tipos equivocados, miles de pasos): el validador la
   rechaza con mensaje y `montar` no lanza aunque se la pasen sin validar. Prueba en las tareas 1 y 5.
3. **Sin `ViewTimeline`, sin `IntersectionObserver` o sin `Element.animate`:** el Director cae al respaldo o no hace
   nada, y la página se ve entera. Prueba en la tarea 8.
4. **La pestaña se oculta o la raíz sale de la vista a mitad de una entrada, y vuelve:** sigue donde iba, no parte de
   nuevo ni queda escondida. Prueba en la tarea 8.
5. **Dos partituras en la misma página:** no comparten estado ni se pisan; desmontar una no afecta a la otra. Prueba
   en la tarea 8.

---

### Task 1: Modelo, validador y contrato

**Files:** Create `src/director/modelo.ts`, `src/director/validar.ts`, `src/director/contrato-partitura.ts`,
`pruebas/director.test.ts`. Modify `scripts/generar-contrato.mjs`, `package.json` (`exports` y `files` del contrato).

**Interfaces — Produces:**
- Tipos `Partitura`, `Escena` (unión por `con`), `PasoTiempo`, `PasoScroll`, `PasoSeguir`, `Cambio`, y las listas
  `SEÑALES = ["verse","estado","vista","scroll","puntero","velocidad"]`, `CURVAS`, `POR`, `TRAMOS`, `ESTADOS`,
  `RESORTES`, y `TOPES` (12 escenas, 24 pasos, 10000 ms, 1000 ms entre piezas, 20000 ms por escena, 200 piezas, 2000 px,
  300 %, escala 0 a 4, giro 720; para `estado`: 6 px, escala 0,94 a 1,08, giro 3).
- `validarPartitura(x: unknown): { ok: true; partitura: Partitura } | { ok: false; errores: { campo: string; mensaje: string }[] }`.
- `textoContratoPartitura(): string` y `contrato/partitura-motionkit.json`.

- [ ] **Step 1: pruebas que fallan.** Una partitura mínima vale; cada tope rechaza; campo desconocido rechaza;
  `version` distinta de 0 rechaza; actor con caracteres raros rechaza (solo `[a-z0-9-]`, 1 a 40); dos escenas
  continuas (incluida `estado`) sobre el mismo actor rechazan; la opacidad de un actor en dos escenas rechaza; `en`,
  `luego` y `junto` juntos rechazan; `mascara` sin `por: palabra|letra` rechaza; porcentaje mal escrito rechaza; un
  dato que no es objeto no lanza. El contrato lista lo mismo que el modelo.
- [ ] **Step 2–4:** FAIL → implementar → `node scripts/pruebas.mjs director`, `npm run contrato` → PASS.

### Task 2: Calendario, curvas y fotogramas (puros)

**Files:** Create `src/director/calendario.ts`, `src/director/fotogramas.ts`. Test en `pruebas/director.test.ts`.

**Interfaces — Produces:**
- `inicios(pasos: PasoTiempo[], piezas: number[]): { inicio: number; fin: number }[]` (aplica `en`, `luego`, `junto`,
  `cada`; `piezas[i]` es cuántas piezas tiene el paso `i`).
- `fotogramasTiempo(p, nivel): Keyframe[] | null` (canal `transform`), `fotogramasSueltos(p, nivel): Keyframe[] | null`
  (canal `translate`/`rotate`/`scale`); `null` si en ese nivel el paso no hace nada.
- `curvaCss(curva, resorteDelEstilo?: { curva: string; ms: number }): { easing: string; ms?: number }`.
- `opcionesLivianas(p)`: 400 ms y 40 ms como máximo.
- `tramoScroll(tramo, entre): { inicio: string; fin: string }` y `avanceEn(rect, alto, tramo): number` (respaldo).

- [ ] **Step 1: pruebas que fallan** con valores exactos (por ejemplo `luego: 100` tras un paso de 800 ms con 3 piezas
  cada 90 ms parte en 1080; `{ y: "135%" }` da `translate(0px,135%)`; en liviano, `{ y: 28 }` pasa a opacidad de 0).
- [ ] **Step 2–4:** FAIL → implementar → PASS.

### Task 3: Corte de texto

**Files:** Create `src/director/cortar.ts`. Test unitario de la parte pura; el DOM se prueba en la tarea 8.

**Interfaces — Produces:**
- `trozos(texto: string, por: "palabra" | "letra"): { texto: string; espacio: boolean; letras?: string[] }[]`.
- `cortar(actor: HTMLElement, por, mascara: boolean): { piezas: HTMLElement[]; soltar(): void; alCambiar(f): void }`
  (deja el nodo original vacío en su lugar; texto invisible para lectores; observa cambios de React; `soltar`
  restaura).

- [ ] **Step 1: pruebas que fallan** de `trozos` (espacios fuera, emoji compuestos enteros, texto vacío, solo
  espacios, saltos de línea).
- [ ] **Step 2–4:** FAIL → implementar → PASS.

### Task 4: Compás y señales

**Files:** Create `src/director/compas.ts`, `src/director/senales.ts`. Tests unitarios de lo puro.

**Interfaces — Produces:**
- `crearCompas(puedeCorrer: () => boolean): { sumar(f: (dt: number) => boolean): () => void; despertar(): void; avanzar(ms: number): void; parar(): void }`
  (un solo `requestAnimationFrame`; duerme si ningún suscriptor tiene trabajo; `avanzar` da pasos de 1/60 s).
- `punteroEn(rect, x, y): { x: number; y: number }` (de -1 a 1), `velocidadNormal(pxPorSegundo): number` (de -1 a 1,
  tope 1500), `RESORTES_SEGUIR` (`suave`, `firme`, `elastico`: rigidez y amortiguación) y `seguir(estado, meta, dt, resorte)`.

- [ ] **Step 1: pruebas que fallan** (normalización, topes, que el resorte llegue y se duerma).
- [ ] **Step 2–4:** FAIL → implementar → PASS.

### Task 5: El Director

**Files:** Create `src/director/montar.ts`. Tests: unitarios donde no haga falta navegador (partitura inválida no
lanza; sin `Element.animate` devuelve un montaje vacío); el resto en la tarea 8.

**Interfaces — Consumes:** todo lo anterior.
**Produces:** `montar(raiz, partitura, opciones?: { partes?: Record<string, string>; nivel?: NivelEscena; reloj?: "normal" | "manual" }): Montaje`,
con `Montaje = { desmontar(): void; rearmar(): void; irA(ms: number): void; avanzar(ms: number): void; señal(nombre, valor): void }`.

- [ ] **Step 1–4:** pruebas que fallan → implementar los tres ejecutores y las siete reglas de la casa → PASS.

### Task 6: React, entrada y paquete

**Files:** Create `src/director/ConPartitura.tsx`, `src/entradas/director.ts`. Modify `vite.config.ts`, `package.json`
(`exports`), `scripts/medir-paquete.mjs` (`ENTRADAS` y tope 10), `scripts/probar-paquete.mjs`.

**Produces:** `<ConPartitura partitura partes? nivel? recortar? clave? como? className>` y `usePartitura(ref, partitura, opciones)`.

- [ ] **Steps:** `npm run build && npm run peso` → la entrada nueva bajo 10 KB y las demás sin cambio;
  `npm run probar-paquete` importa `motion-kit/director`.

### Task 7: Partituras de ejemplo y vitrina

**Files:** Create `src/director/partituras.ts` (las seis), `demo/Director.tsx`. Modify `demo/main.tsx` (ruta
`#director` y `#director?d=…`), `demo/App.tsx` (enlace).

- [ ] **Steps:** cada ejemplo con «Repetir», selector de nivel y su dato a la vista y editable (con los errores del
  validador). La ruta `#director?d=<base64url>` muestra una partitura que le pasen (para la prueba genérica).

### Task 8: La prueba genérica

**Files:** Create `scripts/verificar-director.mjs`.

- [ ] **Steps:** las 10 revisiones del diseño para cada ejemplo, más: React cambia un texto cortado; dos partituras a
  la vez; sin `ViewTimeline`, sin `IntersectionObserver` y sin `Element.animate`; salir de la vista a media entrada
  y volver. Validar cada revisión rompiendo el código a propósito donde se escribió después del código.

### Task 9: Cierre

- [ ] `npm test`, `npm run typecheck`, `npm run peso`, `npm run probar-paquete`.
- [ ] Batería completa (ahora con `director`).
- [ ] Documentos: `docs/CATALOGO.md`, `CHANGELOG.md`, `CLAUDE.md`, `docs/ci/verificar.yml`.
- [ ] Borrar `prototipos/fase0/`.
- [ ] Revisión final independiente y arreglos.
