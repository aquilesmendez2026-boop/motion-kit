# Segunda tanda de momentos y más fondos vivos: plan de construcción

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El efecto propio de los 14 bloques de La Mente que faltan (ocho piezas con datos y un «llamado con vida»
para los seis que son un botón) y cinco fondos nuevos de lienzo para el encabezado, todo bajado aparte y con pruebas.

**Architecture:** Cada pieza vive en su archivo y se exporta desde `motion-kit/momentos` envuelta en una carga
perezosa común (`aparte`), que mientras llega muestra el `respaldo` que le pasen (el bloque de siempre de La Mente).
Lo calculable va en funciones puras con pruebas (`calculos-2.ts` y un `calculo-<fondo>.ts` por fondo). Los fondos
usan `src/efectos/lienzo.ts`, igual que la constelación.

**Tech Stack:** React 19, TypeScript, CSS, Canvas 2D, Vite 7, `node --test`, Playwright 1.49.

**Spec:** `docs/superpowers/specs/2026-11-24-momentos-2-y-fondos-design.md`

## Global Constraints

- Sin librerías ni dependencias nuevas.
- CSS que se anima: solo `transform` (o `translate`, `scale`, `rotate`) y `opacity`. Los lienzos dibujan en su lienzo.
- Todo lo nuevo se baja aparte (`import()`). Lo decorativo: `aria-hidden` y `pointer-events: none`.
- El texto del bloque se lee desde el primer cuadro (opacidad 1 antes de arrancar) y los enlaces y botones no se
  mueven mientras se les apunta ni pierden el clic.
- Nada con `Math.random`: lo que varía sale de una semilla.
- Niveles: completo, liviano (fundido o cuadro quieto) y quieto (estado final, sin moverse). Los fondos, en quieto
  dentro del encabezado, no se dibujan.
- Colores `var(--mk-…, var(--lm-…))` (las variables `--mk-m-*` de `CSS_BASE`).
- Nada corre fuera de la vista ni con la pestaña oculta; al desmontar no quedan bucles, oyentes ni lienzos.
- Topes: `momentos` puede subir de 12 a **14 KB como máximo** (aprobado por Aquiles el 24-11), solo si al medir hace
  falta y después de intentar bajar lo que hay. Principal 80, encabezado 35, página 17, escena 16 y receta 10 no se
  tocan. Si algo no cabe: parar y preguntar.
- Receta del encabezado v2: cinco valores nuevos en `efecto`, sin versión nueva; contrato regenerado.
- Los repos de La Mente no se tocan. Español de Chile, frases cortas. Commits solo con el OK de Aquiles.
- Entorno: no editar `src/` ni `demo/` mientras corre un `verificar-*`; corridas largas con `caffeinate -i`; pasar la
  URL (`http://localhost:5173`); una prueba pesada a la vez.

## Review Focus

1. **Clic mientras el momento corre:** apretar, esperar 150 ms y soltar con el mouse sobre un enlace o botón de la
   pieza (dominó, novedades, aviso, acordeón) llega a destino. Prueba en las tareas 4, 5, 7 y 8.
2. **Datos vacíos o raros:** lista vacía, textos muy largos, fechas inválidas, `libres` negativo, audio que no carga:
   la pieza no lanza y muestra lo que puede. Prueba en cada tarea (unitaria y visual).
3. **Fuera de la vista o pestaña oculta:** la cinta, la onda y los fondos se detienen. Prueba en las tareas 6, 9 y 11.
4. **Desmontar y volver a montar:** no quedan bucles, oyentes del documento ni lienzos. Prueba en la tarea 16.
5. **El archivo no baja (red mala):** queda el `respaldo` y la página sigue. Prueba en la tarea 1.

---

## Archivos

| Archivo | Qué tiene |
|---|---|
| `src/momentos/aparte.tsx` | `aparte(cargar)`: envoltura perezosa común con `respaldo` |
| `src/momentos/calculos-2.ts` | Funciones puras de la tanda |
| `src/momentos/FechasQueVienen.tsx`, `ClasesDeHoy.tsx`, `NovedadesQueLlegan.tsx`, `EnlacesDomino.tsx`, `EpisodiosOnda.tsx`, `SeccionesVivas.tsx`, `AvisoQueSeDespliega.tsx`, `CintaConImpulso.tsx`, `LlamadoConVida.tsx` | Una pieza por archivo |
| `src/momentos/escenas-llamado.ts` | Los dibujos SVG de las seis escenas |
| `src/efectos/fondos/calculo-<bandada\|luciernagas\|corrientes\|gotas\|relieve>.ts` y `<Fondo>.tsx` | Cálculo puro y lienzo de cada fondo |
| `pruebas/momentos2.test.ts`, `pruebas/fondos.test.ts` | Unitarias |
| `scripts/verificar-momentos2.mjs` | Prueba visual de las piezas (`[url] [parte]`) |
| `scripts/verificar-dedo.mjs` | Parte nueva `fondos` y casos en `limpieza`, `sinlienzo` y `angosto` |

Cada pieza: raíz `div.mk-momento.mk-m-<id>` con `data-momento="<id>"`, `data-nivel` y `data-activo` cuando arrancó
(como las de la primera tanda). Ids: `fechas`, `clases`, `novedades`, `enlaces`, `episodios`, `secciones`, `aviso`,
`cinta`, `llamado`. En la demo, cada una en una sección `data-prueba="<id>"` de `#momentos`.

---

### Task 1: Base de la tanda (carga perezosa común, cálculos y vitrina)

**Files:** Create `src/momentos/aparte.tsx`, `src/momentos/calculos-2.ts`, `pruebas/momentos2.test.ts`,
`scripts/verificar-momentos2.mjs`. Modify `demo/Momentos.tsx` (grupo «Segunda tanda»).

**Interfaces — Produces:**
- `aparte<P>(cargar: () => Promise<{ default: ComponentType<P> }>): ComponentType<P & { respaldo?: ReactNode }>` —
  muestra `respaldo` (o nada) mientras llega el archivo y también si no baja; nunca lanza.
- `hoyEn(zona: string, ahora: Date): string` (`AAAA-MM-DD`; zona inválida → la del navegador).
- `horaEn(zona: string, ahora: Date): string` (`HH:MM`).
- `scripts/verificar-momentos2.mjs`: `abrir(opciones, antes)`, `revisar`, `parte(nombre)`, `seccion(id)` (el selector
  `[data-prueba="<id>"]`) y `clicLento(pagina, selector)` (mover, apretar, esperar 150 ms, soltar; devuelve cuántos
  clics recibió el elemento).

- [ ] **Step 1: Write the failing tests.**

```ts
test("hoyEn y horaEn usan la zona del negocio", () => {
  const t = new Date("2026-11-24T02:30:00Z");
  assert.equal(hoyEn("America/Santiago", t), "2026-11-23");
  assert.equal(horaEn("America/Santiago", t), "23:30");
  assert.equal(hoyEn("Zona/Inventada", t).length, 10);
});
```

  Visual (parte `base`): con el archivo de una pieza bloqueado (`page.route` que aborta `**/FechasQueVienen*`), en la
  sección `fechas` se ve el respaldo de la demo y no hay errores de página.
- [ ] **Step 2–4:** FAIL → implement → `node scripts/pruebas.mjs momentos2` y `verificar-momentos2 … base` → PASS
  (la parte `base` queda en rojo hasta la tarea 2, que crea la pieza: se anota y se vuelve a correr ahí).

### Task 2: Fechas que vienen (`FechasQueVienen`)

**Files:** Create `src/momentos/FechasQueVienen.tsx`. Modify `calculos-2.ts`, `src/entradas/momentos.ts`,
`demo/Momentos.tsx`.

**Interfaces — Produces:**
- `hojaDe(fecha: string): { dia: number; mes: string; semana: string } | null` (meses y días cortos en español).
- `FechasQueVienenProps`: `fechas: { titulo: string; fecha: string; hora?: string; tipo: "actividad" | "cerrado" | "promocion" | "evento" }[]`,
  `hoy?`, `zona?`, `ahora?`, `semilla?`, más `ComunesMomento`.

- [ ] **Step 1: Write the failing tests.**

```ts
test("hojaDe", () => {
  assert.deepEqual(hojaDe("2026-12-05"), { dia: 5, mes: "dic", semana: "sáb" });
  assert.equal(hojaDe("2026-13-40"), null);
  assert.equal(hojaDe("mañana"), null);
});
```

  Visual (parte `fechas`): hay una hoja por fecha con su día; la de hoy lleva `data-hoy`; las «cerrado» llevan
  `data-tipo="cerrado"` y su título tachado; el texto se lee antes de arrancar; tras verse, `data-activo` y ninguna
  hoja queda girada; con una fecha inválida en la lista, esa fila sale sin hoja y sin error; lista vacía: no dibuja
  nada; con movimiento reducido no hay animaciones.
- [ ] **Step 2–4:** FAIL → implement → unitarias y `verificar-momentos2 … fechas` y `… base` → PASS.

### Task 3: Clases de hoy (`ClasesDeHoy`)

**Files:** Create `src/momentos/ClasesDeHoy.tsx`. Modify `calculos-2.ts`, entrada, demo.

**Interfaces — Produces:**
- `cuposDe(libres: number, espera: "no" | "abierta" | "llena", cupos?: number): { texto: string; estado: "libre" | "ultimo" | "lleno"; ocupado: number | null }`.
- `proximaClase(sesiones: { fecha: string; hora: string }[], hoy: string, hora: string): number` (índice, o -1).
- `ClasesDeHoyProps`: `sesiones: { nombre: string; profesor?: string; hora: string; fecha: string; libres: number; espera: "no" | "abierta" | "llena"; cupos?: number }[]`,
  `hoy?`, `zona?`, `ahora?`.

- [ ] **Step 1: Write the failing tests.**

```ts
test("cuposDe", () => {
  assert.deepEqual(cuposDe(3, "no"), { texto: "Quedan 3", estado: "libre", ocupado: null });
  assert.deepEqual(cuposDe(1, "no", 10), { texto: "Queda 1", estado: "ultimo", ocupado: 0.9 });
  assert.deepEqual(cuposDe(0, "abierta"), { texto: "Lleno · lista de espera", estado: "lleno", ocupado: null });
  assert.deepEqual(cuposDe(-2, "llena", 8), { texto: "Lleno", estado: "lleno", ocupado: 1 });
});
test("proximaClase", () => {
  const s = [{ fecha: "2026-11-24", hora: "09:00" }, { fecha: "2026-11-24", hora: "19:00" }, { fecha: "2026-11-25", hora: "08:00" }];
  assert.equal(proximaClase(s, "2026-11-24", "10:15"), 1);
  assert.equal(proximaClase(s, "2026-11-24", "21:00"), -1);
  assert.equal(proximaClase([], "2026-11-24", "10:00"), -1);
});
```

  Visual (parte `clases`): grupos «Hoy» y «Mañana»; la próxima lleva `data-proxima`; «Queda 1» tiene una animación
  que late y «Lleno» ninguna; sin `cupos` no hay barra y con `cupos` sí (ancho según lo ocupado, con `scale`); sin
  clases dice «No hay clases hoy ni mañana»; reducido: sin animaciones.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 4: Novedades que llegan (`NovedadesQueLlegan`)

**Files:** Create `src/momentos/NovedadesQueLlegan.tsx`. Modify `calculos-2.ts`, entrada, demo.

**Interfaces — Produces:**
- `esNueva(publicada: string, ahora: Date, dias = 7): boolean` (fecha inválida o futura → `false`).
- `NovedadesQueLleganProps`: `entradas: { titulo: string; resumen?: string; foto?: string; publicada: string; href: string }[]`, `zona?`, `ahora?`.

- [ ] **Step 1: Write the failing tests.**

```ts
test("esNueva", () => {
  const ahora = new Date("2026-11-24T12:00:00Z");
  assert.equal(esNueva("2026-11-20T15:00:00.000Z", ahora), true);
  assert.equal(esNueva("2026-11-10T15:00:00.000Z", ahora), false);
  assert.equal(esNueva("2026-12-01T00:00:00.000Z", ahora), false);
  assert.equal(esNueva("ayer", ahora), false);
});
```

  Visual (parte `novedades`): una tarjeta por entrada, cada una es un enlace con su `href`; solo la más nueva y
  reciente lleva «Nuevo»; `clicLento` sobre la primera tarjeta mientras entra da 1 clic (Review Focus 1); un `href`
  `javascript:` no se dibuja como enlace (se reusa `esEnlaceSeguro`); sin foto, la tarjeta no deja un hueco roto.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 5: Enlaces en dominó (`EnlacesDomino`)

**Files:** Create `src/momentos/EnlacesDomino.tsx`. Modify entrada, demo.

**Interfaces — Produces:** `EnlacesDominoProps`: `enlaces: { titulo: string; red: string; url: string }[]`.
Cada enlace abre en otra pestaña con `rel="noopener noreferrer"`; el nombre de la red va en texto, sin logos.

- [ ] **Step 1: Write the failing tests.** Visual (parte `enlaces`): un enlace por dato, con `target="_blank"` y
  `rel` seguro; tras verse, ninguno queda girado (`rotate`/`transform` en reposo); `clicLento` sobre el segundo
  mientras se levanta da 1 clic; una `url` insegura no se dibuja; cada botón mide 44 px o más de alto.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 6: Episodios con onda (`EpisodiosOnda`)

**Files:** Create `src/momentos/EpisodiosOnda.tsx`. Modify `calculos-2.ts`, entrada, demo (audio de ejemplo generado en
la demo como `data:` WAV corto y silencioso).

**Interfaces — Produces:**
- `barrasOnda(semilla: number, n = 28): number[]` (cada una entre 0,25 y 1; misma semilla, mismas barras).
- `duracionEnPalabras(segundos?: number): string` («46 min», «1 h 2 min», vacío si no viene).
- `EpisodiosOndaProps`: `episodios: { titulo: string; fecha?: string; audio: string; duracion?: number }[]`, `zona?`.

- [ ] **Step 1: Write the failing tests.**

```ts
test("barrasOnda y duracionEnPalabras", () => {
  const b = barrasOnda(7);
  assert.equal(b.length, 28);
  assert.ok(b.every((x) => x >= 0.25 && x <= 1));
  assert.deepEqual(b, barrasOnda(7));
  assert.notDeepEqual(b, barrasOnda(8));
  assert.equal(duracionEnPalabras(46 * 60), "46 min");
  assert.equal(duracionEnPalabras(3720), "1 h 2 min");
  assert.equal(duracionEnPalabras(undefined), "");
});
```

  Visual (parte `episodios`): cada episodio tiene su `<audio controls preload="none">` y su onda (`aria-hidden`);
  quieta al inicio (`data-suena` ausente); al dar `play()` a un audio, solo su onda lleva `data-suena` y se anima; al
  pausar, se detiene; al sonar otro, la primera se detiene; fuera de la vista la onda no se anima (Review Focus 3);
  con un audio que no carga no hay errores de página.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 7: Secciones con resorte (`SeccionesVivas`)

**Files:** Create `src/momentos/SeccionesVivas.tsx`. Modify entrada, demo.

**Interfaces — Produces:** `SeccionesVivasProps`: `secciones: Seccion[]`, con
`Seccion = { seccionId: string; titulo: string } & ({ tipo: "preguntas"; items: { pregunta: string; respuesta: string }[] } | { tipo: "equipo"; items: { nombre: string; cargo?: string; descripcion?: string }[] } | { tipo: "texto"; texto: string } | { tipo: "pasos"; items: { titulo: string; texto?: string }[] })`.
Cada sección lleva `id={seccionId}` y `data-seccion={tipo}`, como en La Mente.

- [ ] **Step 1: Write the failing tests.** Visual (parte `secciones`): las preguntas son `<details>` con `<summary>`;
  se abren con Enter y con clic, y la respuesta abierta tiene opacidad 1 al terminar; `clicLento` en un `summary` lo
  abre (1 clic); los pasos llevan «01», «02»…; el equipo muestra la inicial; el texto respeta los párrafos (línea en
  blanco); una sección de tipo desconocido no se dibuja y no rompe; reducido: sin animaciones.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 8: Aviso que se despliega (`AvisoQueSeDespliega`)

**Files:** Create `src/momentos/AvisoQueSeDespliega.tsx`. Modify entrada, demo.

**Interfaces — Consumes:** `descifrar(el, semilla)` de `src/estilos/descifrar.ts` (trabaja sobre spans `.mk-tc-l`) y
`Confeti` de `src/momentos/perezosos.tsx`.
**Produces:** `AvisoQueSeDespliegaProps`: `texto: string`, `enlace?: string`, `tono: "info" | "importante" | "celebracion"`,
`alCerrar?: () => void`, `semilla?`. Arranca al montarse (va arriba de todo, no espera a verse). El texto real va
para lectores (`aria-label`), como en `TextoCinetico`.

- [ ] **Step 1: Write the failing tests.** Visual (parte `aviso`): la franja tiene `data-tono`; el texto final es el
  dado y para lectores no cambia nunca; pasa por signos menos de un segundo; el botón cerrar (44 px, con nombre
  accesible «Cerrar aviso») llama a `alCerrar` con clic y con Enter, y la franja deja de dibujarse; «Ver más» solo
  con un enlace seguro, y `clicLento` sobre él da 1 clic; el tono «celebración» monta confeti y los otros no;
  reducido: texto fijo desde el inicio.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 9: Cinta con impulso (`CintaConImpulso`)

**Files:** Create `src/momentos/CintaConImpulso.tsx`. Modify `calculos-2.ts`, entrada, demo.

**Interfaces — Consumes:** `velocidadScroll` (`src/dedo/calculo-impulso.ts`) y `pasoResorte` (`src/dedo/resorte.ts`).
**Produces:**
- `ritmoCinta(velocidad: number): number` → `clamp(1 + velocidad / 600, -3, 4)`; no finito → 1.
- `CintaConImpulsoProps`: `lema: string`, `quieta?: boolean`.

- [ ] **Step 1: Write the failing tests.**

```ts
test("ritmoCinta", () => {
  assert.equal(ritmoCinta(0), 1);
  assert.equal(ritmoCinta(600), 2);
  assert.equal(ritmoCinta(-1200), -1);
  assert.equal(ritmoCinta(99999), 4);
  assert.equal(ritmoCinta(-99999), -3);
  assert.equal(ritmoCinta(NaN), 1);
});
```

  Visual (parte `cinta`): el lema va una vez en texto para lectores y las copias son `aria-hidden`; sola, la cinta
  avanza (su `translate` cambia en 300 ms); al bajar rápido avanza más en el mismo tiempo; 1,5 s después de parar
  vuelve a su paso; fuera de la vista y con la pestaña oculta no pide cuadros (Review Focus 3); `quieta`: el lema
  centrado y sin moverse; sin lema no dibuja nada; reducido: quieta.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 10: Llamado con vida (`LlamadoConVida`)

**Files:** Create `src/momentos/LlamadoConVida.tsx`, `src/momentos/escenas-llamado.ts`. Modify entrada, demo (las seis
escenas, cada una junto a un botón de ejemplo).

**Interfaces — Produces:**
- `ESCENAS_LLAMADO: Record<"agenda" | "pedidos" | "buzon" | "cotizaciones" | "encuestas" | "contacto", …>` (las partes
  SVG de cada escena, en una caja de 96).
- `LlamadoConVidaProps`: `escena: keyof typeof ESCENAS_LLAMADO`, `abierto?: boolean` (solo `pedidos`), `semilla?`.
  La raíz es `aria-hidden` y no recibe toques.

- [ ] **Step 1: Write the failing tests.** Unitaria: `ESCENAS_LLAMADO` tiene exactamente las seis llaves. Visual
  (parte `llamado`): cada escena dibuja un SVG; es `aria-hidden` y `pointer-events: none`; el botón de al lado recibe
  el clic (`clicLento`, 1 clic) mientras la escena corre; 2,5 s después de verse no queda ninguna animación corriendo,
  salvo el punto de `pedidos` con `abierto`; con `abierto={false}` no hay latido; una `escena` desconocida no dibuja
  nada; reducido: escena terminada y quieta.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 11: Fondo «bandada» y la parte `fondos` de la prueba

**Files:** Create `src/efectos/fondos/calculo-bandada.ts`, `Bandada.tsx`, `pruebas/fondos.test.ts`. Modify
`src/efectos/tokens.ts`, `registro.ts`, `src/receta/receta.ts` (`EFECTOS`), `scripts/verificar-efectos.mjs` (`IDS`),
`scripts/verificar-dedo.mjs` (parte `fondos`, que recorre una lista de ids; casos en `limpieza`, `sinlienzo` y
`angosto`).

**Interfaces — Produces:**
- `interface Ave { x: number; y: number; vx: number; vy: number }`.
- `crearBandada(n: number, ancho: number, alto: number, semilla: number): Ave[]`.
- `pasoBandada(aves: Ave[], dt: number, ancho: number, alto: number, dedo?: { x: number; y: number } | null): void`
  (se juntan, se alinean, no se enciman; rapidez entre 30 y 90 px/s; dan la vuelta por los bordes; esquivan al dedo a
  menos de 120 px).
- `cantidadFondo(variante: number, ancho: number, cantidades: [number, number, number], quieta = false): number`
  (60 % en pantallas angostas y otro 60 % en quieta; variante rara = la 1), en `src/efectos/lienzo.ts`.
- Parte `fondos` de `verificar-dedo.mjs`: para cada id, dibuja píxeles, corre a unos 30 dibujos por segundo, fuera
  de la vista queda en «pausa», en nivel liviano queda un cuadro quieto, y en la galería con movimiento reducido
  queda dibujado y quieto.

- [ ] **Step 1: Write the failing tests.**

```ts
test("bandada: adentro, con rapidez acotada, repetible y esquiva al dedo", () => {
  const a = crearBandada(30, 400, 300, 3);
  assert.deepEqual(a, crearBandada(30, 400, 300, 3));
  for (let i = 0; i < 600; i++) pasoBandada(a, 1 / 30, 400, 300);
  for (const p of a) {
    const v = Math.hypot(p.vx, p.vy);
    assert.ok(p.x >= 0 && p.x <= 400 && p.y >= 0 && p.y <= 300 && v >= 29 && v <= 91, JSON.stringify(p));
  }
  const uno = [{ x: 100, y: 100, vx: 40, vy: 0 }];
  pasoBandada(uno, 1 / 30, 400, 300, { x: 130, y: 100 });
  assert.ok(uno[0].vx < 40, "frena o se devuelve ante el dedo");
  pasoBandada([], 1 / 30, 0, 0);
  assert.equal(cantidadFondo(2, 1280, [10, 20, 30]), 20);
  assert.equal(cantidadFondo(9, 390, [10, 20, 30], true), 4);
});
```

  Receta: acepta `efecto: "bandada"` y el contrato lo lista. Visual: parte `fondos` con `bandada`.
- [ ] **Step 2–4:** FAIL → implement (`npm run contrato`) → `npm test`, `verificar-dedo … fondos`,
  `verificar-efectos` → PASS.

### Task 12: Fondo «luciérnagas»

**Files:** Create `calculo-luciernagas.ts`, `Luciernagas.tsx`. Modify tokens, registro, receta, `IDS` y la lista de
la parte `fondos`.

**Interfaces — Produces:** `interface Luz { x: number; y: number; fase: number; ritmo: number; vx: number; vy: number }`,
`crearLuces(n, ancho, alto, semilla): Luz[]`, `pasoLuces(luces, dt, ancho, alto): void` (derivan a menos de 12 px/s
y dan la vuelta), `brilloLuz(luz: Luz, t: number, dedo?: { x: number; y: number } | null): number` (de 0 a 1;
a menos de 110 px del dedo, 1).

- [ ] **Step 1: Write the failing tests.** Unitaria: repetible; tras 600 pasos todas adentro; `brilloLuz` entre 0 y 1
  para 200 instantes, y 1 con el dedo encima. Receta y contrato. Visual: `fondos` con `luciernagas`.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 13: Fondo «corrientes»

**Files:** Create `calculo-corrientes.ts`, `Corrientes.tsx`. Modify lo mismo que la tarea 12.

**Interfaces — Produces:** `rumbo(x: number, y: number, t: number, dedo?: { x: number; y: number } | null): number`
(ángulo en radianes, suave y repetible; cerca del dedo rodea), `interface Trazo { x: number; y: number; edad: number }`,
`crearTrazos(n, ancho, alto, semilla): Trazo[]`, `pasoTrazos(trazos, dt, ancho, alto, t, dedo?): void` (avanzan a
40 px/s por el rumbo; al salir o cumplir 6 s renacen en un punto repetible). El lienzo deja estela borrando con
`destination-out` a poca fuerza (no limpia entero en cada cuadro; la prueba cuenta sus dibujos con `fillRect`).

- [ ] **Step 1: Write the failing tests.** Unitaria: `rumbo` finito y repetible, y distinto con el dedo cerca; los
  trazos siguen adentro tras 900 pasos y renacen. Receta y contrato. Visual: `fondos` con `corrientes`.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 14: Fondo «gotas»

**Files:** Create `calculo-gotas.ts`, `Gotas.tsx`. Modify lo mismo.

**Interfaces — Produces:** `interface Gota { x: number; y: number; edad: number }`,
`pasoGotas(gotas: Gota[], dt: number, vida = 2.4): Gota[]`, `radioGota(edad: number): number` (crece hasta 90 px),
`fuerzaGota(edad: number, vida = 2.4): number` (de 1 a 0), `gotaSola(i: number, ancho: number, alto: number, semilla: number): Gota`
(dónde cae la gota número `i`). Sola, cae una cada 0,9 s; un toque o un movimiento (a lo más una cada 120 ms)
suelta otra; a lo más 24 vivas.

- [ ] **Step 1: Write the failing tests.** Unitaria: las gotas envejecen y se van al cumplir la vida; `radioGota`
  crece y no pasa de 90; `fuerzaGota` va de 1 a 0; `gotaSola` adentro y repetible. Receta y contrato. Visual:
  `fondos` con `gotas`, y un toque suma píxeles cerca del punto.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 15: Fondo «relieve»

**Files:** Create `calculo-relieve.ts`, `Relieve.tsx`. Modify lo mismo.

**Interfaces — Produces:** `alturaRelieve(x: number, y: number, t: number, dedo?: { x: number; y: number } | null): number`
(de -1 a 1, suave en `x`, repetible; a menos de 140 px del dedo sube hasta +1). El lienzo dibuja líneas
horizontales (cada 26 px; la variante cambia el paso a 34, 26 o 20) desplazadas en vertical por la altura.

- [ ] **Step 1: Write the failing tests.** Unitaria: siempre entre -1 y 1, repetible, suave (dos puntos a 4 px
  difieren menos de 0,15) y mayor con el dedo encima. Receta y contrato. Visual: `fondos` con `relieve`.
- [ ] **Step 2–4:** FAIL → implement → PASS.

### Task 16: Cierre (limpieza, peso, paquete, documentos y encargo)

**Files:** Modify `scripts/verificar-momentos2.mjs` (parte `cierre`), `scripts/medir-paquete.mjs` (solo si hace falta,
con la fecha y el OK), `scripts/probar-paquete.mjs` (importa dos piezas nuevas), `docs/CATALOGO.md`, `CHANGELOG.md`,
`CLAUDE.md` y `docs/ci/verificar.yml` (suman `momentos2`). Create
`../cerebro-aquiles/lamente/ENCARGO_2026-11-24_momentos-2-y-fondos.md` (cómo conectar cada pieza, con la tabla de
datos del diseño) y actualizar la fila de motion-kit en `MAPA_CONEXIONES.md`.

- [ ] **Step 1: Write the failing check** (parte `cierre`, Review Focus 4): en `#momentos`, tras recorrer todo, ir a
  una vista quieta: 0 cuadros de efectos, 0 lienzos y los mismos oyentes y observadores que antes de entrar (el mismo
  método de la parte `limpieza` de `verificar-dedo`); a 360 px (contra el ancho fijo) nada se sale de lado; antes de
  bajar, todo el texto de las piezas nuevas tiene opacidad 1.
- [ ] **Step 2:** `npm run build && npm run peso`. Si `momentos` pasa de 12: primero bajar lo que hay; si aun así
  hace falta, subir el tope hasta lo aprobado (14 como máximo) y anotarlo. Cualquier otro exceso: parar y preguntar.
- [ ] **Step 3:** `npm test`, `npm run typecheck`, `npm run probar-paquete` y la batería completa, una tras otra:
  `dedo`, `efectos`, `estilos`, `escena`, `relatos`, `pelicula`, `encabezados`, `momentos`, `momentos2`, `fotos`,
  `piezas`, `lamente`, `biblioteca` → todo en verde.
- [ ] **Step 4:** Documentos y encargo.
