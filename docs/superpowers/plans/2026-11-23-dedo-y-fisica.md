# Dedo y física (nueve efectos): plan de construcción

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nueve efectos nuevos (cartas apiladas, texto que se descifra, letras con imán, letrero colgante, inclinación
por velocidad, objetos del rubro que caen, constelación, lámpara de lava y estela con chispas), elegibles desde las
recetas, cargados aparte y con sus pruebas.

**Architecture:** Cada efecto vive en un archivo que se baja con `import()` cuando se usa; en las entradas solo entran
el nombre (para validar la receta), el aviso y la conexión. Lo calculable (resortes, péndulo, física de círculos,
enlaces, estela, descifrado) son funciones puras con pruebas. Las piezas de React que se cargan aparte se montan con
el hook nuevo `useAparte` (si el archivo no baja, la página sigue).

**Tech Stack:** React 19, TypeScript, CSS con scroll nativo, Canvas 2D, WebGL 1, Vite 7, `node --test`, Playwright 1.49.

**Spec:** `docs/superpowers/specs/2026-11-23-dedo-y-fisica-design.md`

## Global Constraints

- Sin librerías ni dependencias nuevas. La física es propia.
- CSS que se anima: solo `transform` (o `translate`, `scale`, `rotate`) y `opacity`. Canvas y WebGL dibujan en su lienzo.
- Todo lo nuevo se carga aparte (`import()`). Capas decorativas: `aria-hidden` y `pointer-events: none`.
- El texto real no cambia para lectores de pantalla (`aria-label` de `TextoCinetico` intacto).
- Nada con `Math.random`: lo que varía sale de una semilla.
- Niveles: Canvas, WebGL, imán, letrero, inclinación y estela solo en completo; en liviano, versión quieta o nada;
  en quieto, nada se mueve.
- Un solo fondo animado por encabezado (regla existente): objetos que caen, constelación y lava son `efecto`/`shader`.
  `iman`, `colgante` y `estela` no entran al orden del protagonista.
- Topes: aprobado por Aquiles («ok», 23-11) sacar los medidores del editor de la entrada principal y, **como máximo**,
  `pagina` 18 KB y `receta` 11 KB. Un tope se sube solo si al medir hace falta y nunca sobre eso; `encabezado` 35,
  `momentos` 12 y principal 80 no se tocan. Si algo no cabe ni así: parar y preguntar.
- Recetas: campos y valores nuevos en el encabezado v2 y la página v1 (sin versiones nuevas); contratos regenerados.
- Avisos exactos: «El letrero colgante va con la composición «letrero»: queda apagado.» y «Con la foto en las letras,
  el imán queda apagado.».
- Español de Chile, frases cortas. Sin commits (instrucción de Aquiles); todo queda en el árbol de trabajo.

## Review Focus

1. **Desmontar y volver a montar** (cambiar de página, «otra vez» en el editor): no quedan bucles de animación,
   oyentes ni lienzos vivos. Prueba en la tarea 11.
2. **Cambiar el tamaño o girar el teléfono:** los lienzos se ajustan y los objetos que caen quedan dentro del
   encabezado. Prueba en la tarea 7.
3. **Fuera de la vista o con la pestaña oculta:** los bucles se detienen. Prueba en las tareas 7, 8 y 10.
4. **Foco del teclado en un bloque tapado** (cartas apiladas): el bloque se despega y lo enfocado se ve. Prueba en la
   tarea 2.
5. **Títulos con acentos, signos, emojis o muy largos** en «descifrar» e «imán»: terminan iguales al original y sin
   cambiar el ancho. Pruebas en las tareas 3 y 4.

---

## Archivos

| Archivo | Qué tiene |
|---|---|
| `src/utils/aparte.ts` | `useAparte` (monta una pieza cargada con `import()`) |
| `src/dedo/resorte.ts`, `calculo-iman.ts`, `calculo-pendulo.ts`, `calculo-impulso.ts`, `calculo-estela.ts` | Funciones puras (el nombre no puede diferir del componente solo en mayúsculas: en Mac se confunden) |
| `src/dedo/Iman.tsx`, `Colgante.tsx`, `Impulso.tsx`, `Estela.tsx` | Piezas que se cargan aparte (devuelven `null` o un lienzo) |
| `src/relatos/Pila.tsx`, `src/relatos/medidas-pila.ts` | Cartas apiladas (pieza aparte y su cálculo) |
| `src/estilos/descifrar.ts` | Texto que se descifra (puro y DOM) |
| `src/efectos/caida/fisica.ts`, `objetos.ts`, `Caida.tsx` | Física de círculos, dibujos y lienzo |
| `src/efectos/escenas/Granos.tsx`, `Tijeras.tsx`, `Huellas.tsx`, `Pesas.tsx`, `Lapices.tsx` | Un fondo por objeto |
| `src/efectos/fondos/Constelacion.tsx`, `calculo-constelacion.ts` | Constelación y su cálculo |
| `src/escena/ShaderFondo.tsx` | Fragmento `lava` |
| `pruebas/dedo.test.ts` | Pruebas de lo puro y de las recetas |
| `scripts/verificar-dedo.mjs` | Prueba visual (`[url] [parte]`, una parte por efecto) |

Cada lienzo nuevo expone su estado en `data-estado` (`"vivo"` mientras dibuja, `"quieto"` cuando se detiene), para
las pruebas.

---

### Task 1: Espacio en las entradas y base común

**Files:** Modify `src/index.ts` (reemplazar `export * from "./entradas/escena"` por la lista explícita de lo mismo
**menos** lo de `escena/MedidorPeso`, `escena/peso` y `escena/calidad`), `demo/Encabezados.tsx` y `demo/Vista.tsx` (y
cualquier otro de `demo/` que importe medidores: ahora desde `../src/entradas/escena`), `CHANGELOG.md` (en «Cambios
que pueden romper»). Create `src/utils/aparte.ts`, `pruebas/dedo.test.ts`, `scripts/verificar-dedo.mjs` (armado como
`verificar-fotos.mjs`: `abrir`, `revisar`, `parte(nombre)`).

**Interfaces — Produces:**
- `useAparte<P>(activo: boolean, cargar: () => Promise<{ default: ComponentType<P> }>): ComponentType<P> | null` — con
  `activo`, baja el archivo una vez y devuelve el componente; si no baja, devuelve `null` y no lanza. Al apagarse
  `activo`, vuelve a `null`.

- [ ] **Step 1: Write the failing test** (`pruebas/dedo.test.ts`):

```ts
test("la entrada principal ya no trae los medidores del editor", () => {
  const indice = readFileSync("src/index.ts", "utf8");
  assert.ok(!/export \* from "\.\/entradas\/escena"/.test(indice));
  for (const n of ["MedidorPeso", "MedidorFluidez", "MedidorCarga", "SemaforoContraste", "medirPeso"]) assert.ok(!indice.includes(n), n);
  const escena = readFileSync("src/entradas/escena.ts", "utf8");
  for (const n of ["MedidorPeso", "MedidorFluidez", "ShaderFondo"]) assert.ok(escena.includes(n), n);
  assert.ok(indice.includes("ShaderFondo") && indice.includes("useNivelEscena"));
});
```

- [ ] **Step 2: Run** `node scripts/pruebas.mjs dedo` → FAIL.
- [ ] **Step 3: Implement** lo de arriba.
- [ ] **Step 4: Run** `node scripts/pruebas.mjs dedo && npm run typecheck && npm run build && npm run peso` → PASS; la
  principal baja varios KB (anotar la cifra en la bitácora).
- [ ] **Step 5: Run** (con `npm run dev`) `node scripts/verificar-escena.mjs` y `node scripts/verificar-encabezados.mjs`
  → todo bien (los medidores del editor siguen funcionando).

### Task 2: Cartas apiladas (`relato: "pila"`)

**Files:** Modify `src/relatos/catalogo.ts` (`RelatoBloqueId` suma `"pila"`; ficha: nombre «Cartas apiladas»,
alcance bloque, `para: ["cualquiera"]`, `requiere: []`, `largo: false`), `src/relatos/css.ts` (en liviano, `pila`
cuenta como escenas), `src/relatos/Relato.tsx` (con `efectivo === "pila"` y nivel completo monta `Pila` con
`useAparte`), `demo/Relatos.tsx` (un teléfono `id="p-pila"` con `relato="pila"`). Create `src/relatos/pila.ts`,
`src/relatos/Pila.tsx`.

**Interfaces — Produces:**
- `topPila(altoBloque: number, altoVista: number): number` → `Math.min(0, altoVista - altoBloque)`; no finito → 0.
- `Pila({ bloque }: { bloque: RefObject<HTMLDivElement | null> })` (default, devuelve `null`): inyecta su CSS
  (`useStyles("relato-pila", CSS_PILA)`), pone `data-pila` en el bloque, mide con `ResizeObserver` y deja
  `--mk-pila-top`, `--mk-pila-z` y los nombres de las líneas de tiempo; al desmontar limpia todo.
- CSS (solo con scroll nativo, nivel completo y `data-pila`): el bloque lleva fondo `var(--mk-fondo)`, esquinas de
  arriba de 24 px y sombra; si el bloque que sigue también es `pila` (`:has(+ …)`), queda `position: sticky` con
  `top: var(--mk-pila-top)` y su `.mk-relato-in` se achica hasta `scale: .94` y `opacity: .65` según entra el
  siguiente (línea de tiempo `view()` del siguiente, con nombre propio y `timeline-scope` en `.mk-pagina`).
  `:focus-within` → `position: relative; top: auto`.

- [ ] **Step 1: Write the failing tests.** Unitaria:

```ts
test("topPila", () => {
  assert.equal(topPila(300, 800), 0);
  assert.equal(topPila(1200, 800), -400);
  assert.equal(topPila(NaN, 800), 0);
});
```

  Visuales (parte `pila`, en `#relatos`, teléfono `p-pila`): al bajar hasta que el bloque 2 tapa al 1, el 1 sigue
  arriba del teléfono (pegado) y su interior tiene `scale` menor que 1; un bloque más alto que el teléfono se ve
  entero antes de quedar pegado; con el foco en un enlace de un bloque tapado, `elementFromPoint` en el centro del
  enlace devuelve el enlace (Review Focus 4); con movimiento reducido y con `respaldo`, ningún bloque queda `sticky`;
  la página mide lo mismo de alto que con «escenas» (no alarga).
- [ ] **Step 2: Run** `node scripts/pruebas.mjs dedo` y `node scripts/verificar-dedo.mjs http://localhost:5173 pila` → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** lo mismo y `node scripts/verificar-relatos.mjs` → PASS.

### Task 3: Texto que se descifra (`efectoTexto: "descifrar"`)

**Files:** Modify `src/estilos/estilos.ts` (`TextoEfecto` suma `"descifrar"`), `src/receta/receta.ts` (`TEXTOS`),
`src/estilos/TextoCinetico.tsx` (al pasar a `jugando` con ese efecto: `import("./descifrar")`; el texto se ve desde
el inicio, no entra en `OCULTAS`), `demo/Encabezados.tsx` (nombre «Descifrar» donde se listan los efectos de texto).
Create `src/estilos/descifrar.ts`.

**Interfaces — Produces:**
- `SIGNOS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&?"`.
- `cuadroDescifrar(letras: string[], t: number, semilla: number): string[]` — lo que muestra cada letra a los `t` ms:
  la original si `t >= (i + 1) * paso`, con `n` = letras que no son espacio, `i` = posición de la letra entre esas
  (los espacios no cuentan ni retrasan) y `paso = Math.min(45, 1200 / n)`; si no, un signo de `SIGNOS` elegido por
  (`i`, `Math.floor(t / 40)`, `semilla`). Los espacios no cambian.
- `descifrar(el: HTMLElement): () => void` — fija el ancho de cada `.mk-tc-l`, corre los cuadros y al terminar deja
  el texto y los anchos como estaban; devuelve cómo cancelar (que también restaura). No hace nada con movimiento
  reducido ni dentro de `[data-nivel=liviano]` o `[data-nivel=quieto]`.

- [ ] **Step 1: Write the failing tests.** Unitaria:

```ts
test("cuadroDescifrar termina en el original y respeta espacios", () => {
  const letras = Array.from("Ñandú & Café 100% ☕");
  const ini = cuadroDescifrar(letras, 0, 7);
  assert.equal(ini.length, letras.length);
  letras.forEach((l, i) => l === " " ? assert.equal(ini[i], " ") : assert.ok(SIGNOS.includes(ini[i])));
  assert.deepEqual(cuadroDescifrar(letras, 1200, 7), letras);
  assert.deepEqual(cuadroDescifrar(letras, 300, 7), cuadroDescifrar(letras, 300, 7));
  assert.equal(cuadroDescifrar(letras, 46, 7)[0], "Ñ");
});
```

  Y en `pruebas/receta.test.ts`: la receta acepta `efectoTexto: "descifrar"` y el contrato lo lista. Visuales (parte
  `descifrar`, `#vista` con título «Ñandú & *Café* 100%»): a los ~150 ms el texto visible difiere del final y tiene
  las mismas letras; a los 1,6 s es igual; el ancho del título no cambia más de 1 px entre ambos momentos; el
  `aria-label` es siempre el texto completo; con movimiento reducido nunca difiere (Review Focus 5).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (y `npm run contrato`). **Step 4: Run** `npm test`,
  `verificar-dedo … descifrar`, `verificar-estilos.mjs` y `verificar-encabezados.mjs` → PASS.

### Task 4: Letras con imán (`iman: true`)

**Files:** Modify `src/receta/receta.ts` (campo `iman` después de `palabras` en el tipo y en `CAMPOS_RECETA`;
booleano; se apaga con `fotoEnLetras`, con el aviso exacto; `recetaAProps`), `src/encabezados/Encabezado.tsx` (prop
`iman`; con nivel completo monta `Iman` con `useAparte`), `demo/Encabezados.tsx` (casilla «Letras con imán»,
`data-prueba="iman"`). Create `src/dedo/resorte.ts`, `src/dedo/iman.ts`, `src/dedo/Iman.tsx`.

**Interfaces — Produces:**
- `pasoResorte(e: { x: number; v: number }, objetivo: number, dt: number, rigidez = 180, amortiguacion = 14): { x: number; v: number }`.
- `empujeIman(dx: number, dy: number, radio = 140, fuerza = 18): { x: number; y: number }` — `dx, dy` = letra menos
  dedo. Fuera del radio, cero; adentro, se aleja del dedo con largo `fuerza * (1 - d / radio) ** 2`; con `d = 0`,
  `{ x: 0, y: -fuerza }`.
- `Iman({ raiz }: { raiz: RefObject<HTMLElement | null> })` (default, `null`): escucha `pointermove` y `pointerdown`
  en el encabezado, mueve cada `.mk-enc-titulo .mk-tc-l` con la propiedad `translate` y resortes, y se detiene cuando
  todo volvió a su lugar. Parte 1,5 s después de montar (la entrada del título ya terminó).

- [ ] **Step 1: Write the failing tests.** Unitarias:

```ts
test("empujeIman", () => {
  assert.deepEqual(empujeIman(200, 0), { x: 0, y: 0 });
  const m = empujeIman(70, 0);
  assert.ok(Math.abs(m.x - 4.5) < 1e-9 && m.y === 0);
  assert.deepEqual(empujeIman(0, 0), { x: 0, y: -18 });
  assert.ok(empujeIman(-30, 0).x < 0);
});
test("pasoResorte vuelve al objetivo y se pasa un poco", () => {
  let e = { x: 10, v: 0 }, minimo = 10;
  for (let i = 0; i < 300; i++) { e = pasoResorte(e, 0, 1 / 60); minimo = Math.min(minimo, e.x); }
  assert.ok(Math.abs(e.x) < 0.01 && Math.abs(e.v) < 0.01);
  assert.ok(minimo < 0);
});
```

  Receta (`pruebas/receta.test.ts`): `iman: true` queda en la receta y en `recetaAProps`; con `fotoEnLetras: true` y
  fotos, `iman` no queda y está el aviso exacto; `iman: "si"` es error; el contrato lo lista. Visuales (parte
  `iman`, `#vista`): con el mouse sobre el título, alguna `.mk-tc-l` tiene `translate` distinto de `none`; lejos y
  1,5 s después, todas vuelven; con «Ñandú & Café ☕» el `aria-label` no cambia (Review Focus 5); con movimiento
  reducido ninguna se mueve.
- [ ] **Step 2–4:** FAIL → implement (`npm run contrato`) → `npm test`, `verificar-dedo … iman`,
  `verificar-pelicula.mjs` → PASS.

### Task 5: Letrero colgante (`colgante: true`)

**Files:** Modify `src/receta/receta.ts` (campo `colgante` después de `iman`; se apaga si la composición no es
`letrero`, con el aviso exacto; `recetaAProps`), `src/encabezados/Encabezado.tsx` (prop `colgante`; el movimiento de
la escena no se apaga con `colgante`; monta `Colgante` con `useAparte` solo en completo y composición `letrero`),
`demo/Encabezados.tsx` (casilla «Letrero colgante», `data-prueba="colgante"`). Create `src/dedo/pendulo.ts`,
`src/dedo/Colgante.tsx`.

**Interfaces — Produces:**
- `pasoPendulo(e: { a: number; w: number }, dt: number, objetivo = 0, g = 22, roce = 2.4): { a: number; w: number }`
  (grados; `w' = -g * (a - objetivo) - roce * w`).
- `penduloDormido(e: { a: number; w: number }, objetivo = 0): boolean` → `|a - objetivo| < 0.05 && |w| < 0.05`.
- `Colgante({ raiz }: { raiz: RefObject<HTMLElement | null> })` (default, `null`): CSS propio
  (`useStyles("colgante", CSS_COLGANTE)`): cuerdas con `::before` y `::after` del marco y
  `transform-origin: 50% calc(-1 * var(--mk-cuerda))`; pone `data-colgante` en el encabezado, mide `--mk-cuerda`
  (del borde de arriba del encabezado al marco) y mueve el marco con la propiedad `rotate`. Parte en 7°; empujón de
  ±60 °/s al tocar el marco (según el lado), empujón por scroll (`Δy * 0.4`, tope ±40 °/s) y objetivo
  `3° × --mk-cx` (leído del `style` del encabezado). Deja de calcular con `penduloDormido` y despierta con toque,
  scroll o cambio de `--mk-cx`.

- [ ] **Step 1: Write the failing tests.** Unitarias:

```ts
test("pasoPendulo se asienta y se balancea", () => {
  let e = { a: 7, w: 0 }, minimo = 7, maximo = 7;
  for (let i = 0; i < 240; i++) { e = pasoPendulo(e, 1 / 60); minimo = Math.min(minimo, e.a); maximo = Math.max(maximo, e.a); }
  assert.ok(Math.abs(e.a) < 0.1 && minimo < 0 && maximo <= 7.01);
  assert.ok(!penduloDormido({ a: 7, w: 0 }) && penduloDormido({ a: 0.01, w: 0.01 }));
  let o = { a: 0, w: 0 };
  for (let i = 0; i < 400; i++) o = pasoPendulo(o, 1 / 60, 3);
  assert.ok(Math.abs(o.a - 3) < 0.1);
});
```

  Receta: `colgante` con composición `letrero` queda; con otra, no queda y está el aviso exacto; error si no es
  booleano; contrato. Visuales (parte `colgante`, `#vista` con composición `letrero`): a los 300 ms el marco tiene
  `rotate` de más de 1° en valor absoluto; a los 4,5 s, menos de 0,2°; un clic en el lado derecho del marco lo vuelve
  a mover; el botón del encabezado sigue recibiendo el clic (`elementFromPoint` en su centro es el botón); con
  movimiento reducido, `rotate` es `none`.
- [ ] **Step 2–4:** FAIL → implement (`npm run contrato`) → `npm test`, `verificar-dedo … colgante`,
  `verificar-encabezados.mjs` → PASS.

### Task 6: Inclinación por velocidad (`relatoPagina: "impulso"`)

**Files:** Modify `src/relatos/catalogo.ts` (`RelatoPaginaId` suma `"impulso"`; ficha: nombre «Inclinación por
velocidad», alcance página), `src/relatos/PaginaRelato.tsx` (con ese relato y nivel completo monta `Impulso` con
`useAparte`), `demo/Relatos.tsx` (teléfono `id="p-impulso"`), `demo/Pagina.tsx` si lista los relatos de página a
mano. Create `src/dedo/impulso.ts`, `src/dedo/Impulso.tsx`.

**Interfaces — Produces:**
- `inclinacionDe(velocidad: number, tope = 1.5, escala = 1200): number` → `clamp(velocidad / escala, -1, 1) * tope`
  (px/s a grados); no finito → 0.
- `Impulso({ pagina }: { pagina: RefObject<HTMLDivElement | null> })` (default, `null`): CSS propio
  (`.mk-pagina[data-mk-relato-pagina=impulso] .mk-relato-in{transform:skewY(calc(var(--mk-impulso,0)*1deg))}`);
  escucha el scroll del contenedor (`contenedorScroll` de `medidas.ts`), calcula la velocidad, la pasa por
  `inclinacionDe` y `pasoResorte` y deja `--mk-impulso` en la página; se detiene al volver a 0.

- [ ] **Step 1: Write the failing tests.** Unitaria:

```ts
test("inclinacionDe", () => {
  assert.equal(inclinacionDe(0), 0);
  assert.equal(inclinacionDe(600), 0.75);
  assert.equal(inclinacionDe(99999), 1.5);
  assert.equal(inclinacionDe(-99999), -1.5);
  assert.equal(inclinacionDe(NaN), 0);
});
```

  `pruebas/pagina.test.ts`: la receta de página acepta `relatoPagina: "impulso"` y rechaza `relato: "impulso"` con el
  mensaje que ya existe; contrato. Visuales (parte `impulso`, teléfono `p-impulso`): bajando rápido,
  `--mk-impulso` es distinto de 0 y nunca pasa de 1,5 en valor absoluto; 1,2 s después de parar, menos de 0,02; con
  movimiento reducido no existe; sin scroll horizontal.
- [ ] **Step 2–4:** FAIL → implement (`npm run contrato`) → `npm test`, `verificar-dedo … impulso`,
  `verificar-relatos.mjs` → PASS.

### Task 7: Objetos del rubro que caen (`efecto`)

**Files:** Modify `src/efectos/tokens.ts` (`EfectoId` suma `granos`, `tijeras`, `huellas`, `pesas`, `lapices`),
`src/efectos/registro.ts` (5 entradas, familia `escena`, ánimo `vistoso`; rubros: granos `comida`, tijeras
`belleza`, huellas `otro`, pesas `salud`, lapices `clases`), `src/receta/receta.ts` (`EFECTOS`),
`scripts/verificar-efectos.mjs` (sumar los ids nuevos a `IDS`). Create `src/efectos/caida/fisica.ts`, `objetos.ts`,
`Caida.tsx` y los cinco `src/efectos/escenas/<Objeto>.tsx` (cada uno: `Caida` con su objeto).

**Interfaces — Produces:**
- `interface Cuerpo { x: number; y: number; vx: number; vy: number; r: number; a: number; w: number }`,
  `interface Mundo { ancho: number; alto: number }`.
- `crearCuerpos(n: number, mundo: Mundo, semilla: number): Cuerpo[]` — parten sobre el borde de arriba, escalonados;
  radios de 14 a 26 px.
- `pasoFisica(cuerpos: Cuerpo[], mundo: Mundo, dt: number, dedo?: { x: number; y: number; vx: number; vy: number; r: number } | null): void`
  (los cambia en el lugar: gravedad, paredes, piso, choques entre círculos con rebote 0,3 y roce).
- `energia(cuerpos: Cuerpo[]): number`, `todoQuieto(cuerpos: Cuerpo[]): boolean`.
- `apilados(n: number, mundo: Mundo, semilla: number): Cuerpo[]` — la pila ya en reposo (simula hasta 900 pasos).
- `OBJETOS: Record<"granos" | "tijeras" | "huellas" | "pesas" | "lapices", string>` (trazo SVG en una caja de 24).
- `Caida({ objeto, variante }: { objeto: keyof typeof OBJETOS } & EfectoProps)`: lienzo dentro de `CapaEfecto`;
  cantidad por variante 12, 20 o 30 (60 % en pantallas de menos de 700 px); escucha el puntero en el `.mk-enc` más
  cercano (o su padre); un toque da un impulso hacia afuera; se pausa fuera de la vista; al cambiar de tamaño ajusta
  el lienzo y el mundo (los cuerpos quedan adentro); dentro de `[data-nivel=liviano]` dibuja `apilados` una vez.
  Dibuja a 60 % de opacidad con los colores del estilo.

- [ ] **Step 1: Write the failing tests.** Unitarias:

```ts
test("física: caen, no se enciman y se duermen", () => {
  const mundo = { ancho: 400, alto: 300 };
  const c = crearCuerpos(20, mundo, 5);
  for (let i = 0; i < 900; i++) pasoFisica(c, mundo, 1 / 60);
  for (const b of c) assert.ok(b.x >= b.r - 0.5 && b.x <= mundo.ancho - b.r + 0.5 && b.y <= mundo.alto - b.r + 0.5);
  for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) assert.ok(Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y) >= c[i].r + c[j].r - 1.5);
  assert.ok(todoQuieto(c));
  assert.deepEqual(crearCuerpos(20, mundo, 5), crearCuerpos(20, mundo, 5));
  assert.deepEqual(crearCuerpos(0, mundo, 5), []);
});
test("física: el dedo empuja y un mundo más chico los deja adentro", () => {
  const mundo = { ancho: 400, alto: 300 };
  const c = apilados(12, mundo, 3);
  const antes = energia(c);
  pasoFisica(c, mundo, 1 / 60, { x: c[0].x, y: c[0].y, vx: 300, vy: -200, r: 40 });
  assert.ok(energia(c) > antes);
  const chico = { ancho: 240, alto: 300 };
  for (let i = 0; i < 300; i++) pasoFisica(c, chico, 1 / 60);
  for (const b of c) assert.ok(b.x <= chico.ancho - b.r + 0.5);
});
```

  Receta: acepta los cinco ids y el contrato los lista. Visuales (parte `caida`, `#vista` con `efecto: "granos"`): hay
  un lienzo dentro de `.mk-capa`; a los 6 s `data-estado="quieto"`, el tercio de arriba del lienzo está vacío y el
  quinto de abajo tiene píxeles; pasar el mouse por la pila lo vuelve a `vivo`; al achicar la ventana a 700 px los
  píxeles siguen dentro del lienzo y vuelve a `quieto` (Review Focus 2); con el encabezado fuera de la vista, los
  pedidos de cuadro por segundo bajan a casi cero (Review Focus 3); con movimiento reducido no hay lienzo.
- [ ] **Step 2–4:** FAIL → implement (`npm run contrato`) → `npm test`, `verificar-dedo … caida`,
  `verificar-efectos.mjs http://localhost:5173` → PASS.

### Task 8: Constelación (`efecto: "constelacion"`)

**Files:** Modify `tokens.ts`, `registro.ts` (familia `fondo`, rubro `otro`, ánimo `sobrio`), `receta.ts`,
`scripts/verificar-efectos.mjs`. Create `src/efectos/fondos/constelacion.ts`, `Constelacion.tsx`.

**Interfaces — Produces:**
- `interface Punto { x: number; y: number; vx: number; vy: number }`.
- `crearPuntos(n: number, ancho: number, alto: number, semilla: number): Punto[]` (rapidez de 6 a 14 px/s).
- `moverPuntos(puntos: Punto[], dt: number, ancho: number, alto: number, dedo?: { x: number; y: number } | null): void`
  (dan la vuelta por los bordes; a menos de 160 px del dedo se le acercan).
- `enlaces(puntos: { x: number; y: number }[], distancia = 110): [number, number, number][]` — pares `i < j` más
  cerca que `distancia`, con fuerza `1 - d / distancia`.
- `Constelacion(p: EfectoProps)`: lienzo en `CapaEfecto`; puntos por variante 36, 60 o 90 (60 % en pantallas
  angostas); con movimiento reducido o en liviano dibuja un cuadro y no sigue; se pausa fuera de la vista.

- [ ] **Step 1: Write the failing tests.** Unitarias:

```ts
test("constelación: enlaces y movimiento", () => {
  const e = enlaces([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 500, y: 0 }]);
  assert.equal(e.length, 1);
  assert.deepEqual(e[0].slice(0, 2), [0, 1]);
  assert.ok(Math.abs(e[0][2] - (1 - 50 / 110)) < 1e-9);
  const p = crearPuntos(40, 300, 200, 4);
  assert.deepEqual(p, crearPuntos(40, 300, 200, 4));
  for (let i = 0; i < 600; i++) moverPuntos(p, 1 / 60, 300, 200);
  assert.ok(p.every((q) => q.x >= 0 && q.x <= 300 && q.y >= 0 && q.y <= 200));
  const q = [{ x: 100, y: 100, vx: 0, vy: 0 }];
  moverPuntos(q, 1 / 60, 300, 200, { x: 150, y: 100 });
  assert.ok(q[0].x > 100);
});
```

  Visuales (parte `constelacion`, `#efectos` y `#vista`): el lienzo tiene píxeles dibujados; `data-variante`
  aplicada; con movimiento reducido el lienzo tiene píxeles pero casi no pide cuadros; fuera de la vista deja de
  pedirlos (Review Focus 3).
- [ ] **Step 2–4:** FAIL → implement (`npm run contrato`) → `npm test`, `verificar-dedo … constelacion`,
  `verificar-efectos.mjs http://localhost:5173` → PASS.

### Task 9: Lámpara de lava (`shader: "lava"`)

**Files:** Modify `src/escena/ShaderFondo.tsx` (`ShaderId`, `SHADERS.lava` con nombre «Lámpara de lava» y
descripción «Manchas de color que suben, bajan y se funden; el dedo suma una.», `FRAGMENTOS.lava`),
`src/receta/receta.ts` (`SHADERS`), `scripts/verificar-escena.mjs` (sumar `lava` donde recorre los shaders).

**Interfaces — Produces:** `ShaderId` incluye `"lava"`. El fragmento usa los uniformes que ya existen (`r`, `t`, `m`,
`c0`, `c1`, `c2`, `k`): seis manchas que se mueven con senos, campo sumado, umbral suave y mezcla de `c0` a `c1` y
`c2`; una mancha más en `m`.

- [ ] **Step 1: Write the failing tests.** `pruebas/receta.test.ts`: la receta acepta `shader: "lava"` y el contrato
  lo lista. Visual: `verificar-escena.mjs` con `lava` en su lista (compila y dibuja como los demás, sin errores).
- [ ] **Step 2–4:** FAIL → implement (`npm run contrato`) → `npm test`, `verificar-escena.mjs` → PASS.

### Task 10: Estela y chispas (`estela: true`)

**Files:** Modify `src/relatos/receta-pagina.ts` (campo `estela` en el tipo, en `CAMPOS_PAGINA`, validación booleana
y normalización), `src/relatos/PaginaRelato.tsx` (prop `estela`; en completo monta `Estela` con `useAparte`),
`demo/Pagina.tsx` (casilla «Estela y chispas», `data-prueba="estela"`). Create `src/dedo/estela.ts`,
`src/dedo/Estela.tsx`.

**Interfaces — Produces:**
- `interface PuntoEstela { x: number; y: number; t: number }`,
  `interface Chispa { x: number; y: number; vx: number; vy: number; vida: number }`.
- `recortarEstela(puntos: PuntoEstela[], ahora: number, vida = 450): PuntoEstela[]`.
- `chispasDe(x: number, y: number, semilla: number, n = 10): Chispa[]` (rapidez de 80 a 260 px/s, vida 0,5 s).
- `pasoChispas(chispas: Chispa[], dt: number): Chispa[]` (gravedad 600 px/s², baja la vida y saca las que terminan).
- `Estela({ pagina }: { pagina: RefObject<HTMLDivElement | null> })` (default): un lienzo fijo en un portal al
  `body`, `aria-hidden`, sin toques, `z-index: 999`, densidad hasta 1,5; `pointermove` de mouse suma puntos;
  `pointerdown` de dedo o lápiz suelta chispas; dibuja solo mientras hay algo vivo y limpia al terminar; color
  `--mk-acento` de la página.

- [ ] **Step 1: Write the failing tests.** Unitarias:

```ts
test("estela y chispas", () => {
  const p = [{ x: 0, y: 0, t: 0 }, { x: 1, y: 1, t: 300 }, { x: 2, y: 2, t: 600 }];
  assert.deepEqual(recortarEstela(p, 700).map((q) => q.t), [300, 600]);
  const c = chispasDe(10, 10, 3);
  assert.equal(c.length, 10);
  assert.deepEqual(c, chispasDe(10, 10, 3));
  assert.ok(c.every((q) => { const v = Math.hypot(q.vx, q.vy); return v >= 80 && v <= 260; }));
  let vivas = c;
  for (let i = 0; i < 36; i++) vivas = pasoChispas(vivas, 1 / 60);
  assert.equal(vivas.length, 0);
});
```

  `pruebas/pagina.test.ts`: `estela: true` queda en la receta; `estela: "si"` es error; contrato. Visuales (parte
  `estela`, `#pagina` con la casilla): al mover el mouse, el lienzo tiene píxeles y `data-estado="vivo"`; 1 s
  después, vacío y `quieto`; con dedo (contexto táctil), un toque dibuja chispas y después se limpia; un enlace bajo
  el lienzo recibe el clic; con la página fuera de foco no pide cuadros (Review Focus 3); con movimiento reducido no
  hay lienzo.
- [ ] **Step 2–4:** FAIL → implement (`npm run contrato`) → `npm test`, `verificar-dedo … estela`,
  `verificar-relatos.mjs` → PASS.

### Task 11: Limpieza al desmontar, peso, paquete y documentos

**Files:** Modify `scripts/verificar-dedo.mjs` (parte `limpieza`), `scripts/medir-paquete.mjs` (solo si hace falta, y
con comentario de la fecha y el OK), `scripts/probar-paquete.mjs` (si hace falta), `docs/CATALOGO.md` (sección
«Dedo y física (23-11-2026)» y sacar de «Pendiente» lo que ya está: `TextScramble`, `StickyScroll`), `CHANGELOG.md`,
`CLAUDE.md` y `docs/ci/verificar.yml` (sumar `dedo`), `../cerebro-aquiles/MAPA_CONEXIONES.md` (los valores nuevos de
las recetas en la fila de motion-kit → La Mente).

- [ ] **Step 1: Write the failing check** (parte `limpieza`, Review Focus 1): en `#vista` con `iman`, `colgante` no
  (otra composición), `efecto: "granos"` y, aparte, en `#pagina` con `estela`, `impulso` y `pila`: se cuenta cuántos
  `requestAnimationFrame` se piden por segundo; al cambiar a `#` (portada) y esperar 1 s, la cuenta baja a menos de 5
  por segundo y no queda ningún `canvas` de estos efectos en el documento.
- [ ] **Step 2: Run** → si falla, arreglar el efecto que quedó vivo (superpowers:systematic-debugging).
- [ ] **Step 3: Run** `npm run build && npm run peso`. Si `pagina` o `receta` pasan su tope, subirlo a lo aprobado
  (18 y 11 como máximo) y anotarlo; cualquier otro exceso: parar y preguntar.
- [ ] **Step 4: Run** `npm test`, `npm run typecheck`, `npm run probar-paquete` y, una tras otra con el servidor
  arriba: `verificar-dedo`, `verificar-efectos`, `verificar-estilos`, `verificar-escena`, `verificar-relatos`,
  `verificar-pelicula`, `verificar-encabezados`, `verificar-momentos`, `verificar-fotos` → todo en verde.
- [ ] **Step 5:** Documentos.
