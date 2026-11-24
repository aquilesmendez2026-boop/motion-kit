# Efectos vistosos (fuegos, carrusel y libro): plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** tres piezas nuevas de `motion-kit/momentos`: `FuegosArtificiales`, `CarruselGiratorio` y `LibroQueSeAbre`.

**Architecture:** lo calculable en un módulo puro (`calculos-3.ts`) con sus pruebas; cada pieza en su archivo, que se
baja aparte con `aparte()`; la vitrina y una prueba visual nueva por pieza.

**Tech Stack:** TypeScript, React 19, lienzo 2D, CSS 3D (`transform`), Vite, Playwright. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-24-efectos-vistosos-design.md` (incluye las 10 precisiones de la revisión).

## Global Constraints

- Sin librerías de animación ni dependencias nuevas. Nada con `Math.random`.
- En CSS solo se animan `transform` (o `translate`, `scale`, `rotate`) y `opacity`.
- Entrada `motion-kit/momentos`: tope **13 KB** gzip al cargar (hoy 12,6). Las piezas nuevas se bajan aparte. Si la
  entrada no cabe: parar y preguntar. Las demás entradas no crecen.
- Móvil primero; movimiento reducido (nivel `quieto`); lo que se aprieta mide 44 px o más y tiene foco visible.
- Español de Chile, frases cortas. Sin commits hasta que Aquiles lo ordene.
- No se editan `src/` ni `demo/` mientras corre una prueba visual. Pruebas visuales: solo las que el cambio toca.
- Los repos de La Mente se leen, no se tocan.

## Review Focus

1. **Datos hostiles o enormes** (500 fichas, textos de 2.000 letras, `href` con `javascript:`, hojas sin líneas, tipos
   equivocados): no lanza, no desborda de lado y no enlaza nada raro. Pruebas en las tareas 1, 3 y 4.
2. **Desmontar a media animación** (fuegos a medias, carrusel con impulso, hoja girando): no quedan cuadros pedidos ni
   oyentes. Pruebas en las tareas 2, 3 y 4.
3. **Dos carruseles o dos libros en la misma página:** cada uno con su estado; las flechas mueven solo el que tiene
   el foco. Pruebas en las tareas 3 y 4.
4. **El libro cambia de una a dos páginas a media lectura** (girar el teléfono): se sigue leyendo la misma hoja y no
   queda ninguna hoja a medio girar. Prueba en la tarea 4.
5. **Un arrastre que empieza sobre el enlace de la ficha del frente:** no navega; un clic simple, sí; un clic lento
   tampoco se pierde. Prueba en la tarea 3.

---

### Task 1: Lo calculable

**Files:** Create `src/momentos/calculos-3.ts`. Test: `pruebas/momentos3.test.ts` (ya escrita, falla por falta del módulo).

**Interfaces — Produces:**
- Fuegos: `CHISPAS = 40`, `ENTRE_RAFAGAS = 450`, `SUBIDA = 520`, `VIDA = 1500` (ms);
  `Rafaga = { x: number; y: number; parte: number; color: 0 | 1 | 2; chispas: { angulo: number; rapidez: number }[] }`;
  `rafagasDe(semilla: number, cuantas: number): Rafaga[]`; `cohete(r: Rafaga, t: number): { x: number; y: number } | null`;
  `chispa(c, t: number): { dx: number; dy: number; brillo: number } | null` (`t` en ms desde que reventó; `dx` y `dy`
  como parte del lado menor del lienzo); `duracionFuegos(cuantas: number): number`.
- Carrusel: `MAX_FICHAS = 12`; `Ficha = { url?; alt?; titulo?; pie?; precio?; href?; agotado?: true }`;
  `limpiarFichas(x: unknown): Ficha[]`; `puestosAnillo(n): number`; `pasoAnillo(puestos): number`;
  `radioAnillo(anchoFicha, puestos, aire = 16): number`; `alFrente(angulo, puestos): number`;
  `dondeSeDetiene(angulo, velocidad, puestos): number` (grados y grados por segundo);
  `haciaFicha(i, angulo, puestos): number`.
- Libro: `MAX_HOJAS = 16`, `MAX_LINEAS = 10`; `Hoja = { titulo: string; lineas: { texto: string; detalle?; precio?; agotado?: true }[] }`;
  `limpiarHojas(x: unknown): Hoja[]`; `carasLibro(n, doble): { frente: number | "tapa" | null; dorso: number | null }[]`;
  `maxVueltas(n, doble): number`; `estadoLibro(vueltas, n, doble): string`; `vueltasAlCambiar(vueltas, n, aDoble): number`;
  `apilado(i, vueltas, total): number`.

- [ ] **Step 1:** `node scripts/pruebas.mjs momentos3` → FAIL (no existe el módulo).
- [ ] **Step 2:** implementar. **Step 3:** `node scripts/pruebas.mjs momentos3` → PASS; `npm run typecheck` limpio.

### Task 2: `FuegosArtificiales`

**Files:** Create `src/momentos/FuegosArtificiales.tsx`, `src/momentos/perezosos-3.tsx`, `scripts/verificar-momentos3.mjs`.
Modify `src/momentos/SorteoRaspe.tsx` (prop `celebracion`), `src/entradas/momentos.ts`, `demo/Momentos.tsx`
(sección `data-prueba=vistosos`), `scripts/probar-paquete.mjs` si lista las piezas.

**Interfaces — Consumes:** `rafagasDe`, `cohete`, `chispa`, `duracionFuegos`.
**Produces:** `FuegosArtificiales({ semilla: number; rafagas?: number; alTerminar?: () => void })` (default export;
`perezosos-3.tsx` la envuelve con `aparte`); lienzo `canvas.mk-m-fuegos[aria-hidden]`.

- [ ] **Step 1 (visual, falla primero):** parte `fuegos` de `verificar-momentos3.mjs`: dibuja (hay píxeles pintados a
  media ráfaga); a los `duracionFuegos + 300` ms el lienzo no está y no se piden más cuadros; `alTerminar` se llamó una
  vez; con movimiento reducido no hay lienzo y `alTerminar` igual se llama; con la pestaña oculta no pide cuadros;
  desmontar a medias no deja cuadros; el sorteo con `celebracion: "fuegos"` y ganador los muestra, y por defecto sigue
  el confeti; si el archivo no baja, la página sigue.
- [ ] **Step 2:** implementar. **Step 3:** PASS. **Step 4:** `npm run build && npm run peso` → `momentos` ≤ 13 KB.

### Task 3: `CarruselGiratorio`

**Files:** Create `src/momentos/CarruselGiratorio.tsx`. Modify `perezosos-3.tsx`, `src/entradas/momentos.ts`,
`demo/Momentos.tsx`, `scripts/verificar-momentos3.mjs`.

**Interfaces — Consumes:** lo del carrusel de la tarea 1, `pasoResorte` (`src/dedo/resorte.ts`), `useMomento`,
`esEnlaceSeguro`.
**Produces:** `CarruselGiratorio({ fichas, etiqueta? } & ComunesMomento)`; raíz `.mk-m-carrusel[data-modo=anillo|fila]`,
anillo `.mk-m-carrusel-anillo`, ficha `[data-ficha]`, la del frente `[data-frente]`, botones `[data-ir=antes|despues]`.

- [ ] **Step 1 (visual, falla primero):** parte `carrusel`: anillo con 6 fichas; con 3 hay 6 puestos y tres copias
  `aria-hidden`; con 2, fila; arrastrar gira y al soltar queda justo en una ficha y el bucle duerme (cero cuadros);
  botones y flechas (solo con foco adentro); solo el enlace del frente es tabulable; un arrastre sobre el enlace no
  navega y un clic lento sí cuenta; tocar una ficha de lado la trae al frente; texto en vivo al detenerse; liviano y
  movimiento reducido: fila con `scroll-snap` y sin cuadros; dos carruseles no se mezclan; datos hostiles; teléfono
  de 360 px sin desborde de lado; desmontar con impulso no deja cuadros; foto caída deja el título.
- [ ] **Step 2:** implementar. **Step 3:** PASS.

### Task 4: `LibroQueSeAbre`

**Files:** Create `src/momentos/LibroQueSeAbre.tsx`. Modify `perezosos-3.tsx`, `src/entradas/momentos.ts`,
`demo/Momentos.tsx`, `scripts/verificar-momentos3.mjs`.

**Interfaces — Consumes:** lo del libro de la tarea 1, `useMomento`.
**Produces:** `LibroQueSeAbre({ tapa, hojas } & ComunesMomento)`; raíz `.mk-m-libro[data-modo=doble|simple|plano]`
con `data-vueltas`, hoja `[data-hoja]` con `data-pasada`, botones `[data-ir=abrir|antes|despues|cerrar]`, estado en
`[data-estado-libro]` (texto en vivo).

- [ ] **Step 1 (visual, falla primero):** parte `libro`: en ancho se abre solo una vez al verse y muestra dos páginas;
  «Página siguiente» y «anterior» cambian el estado en texto; al final «siguiente» queda deshabilitado; «Cerrar»
  vuelve a la tapa y no se reabre solo; en 360 px va de a una página; cambiar el ancho a media lectura conserva la
  hoja; la página visible es la que dice el estado (se mira qué texto está arriba en el centro de cada mitad); todo el
  texto está en el DOM; liviano y movimiento reducido: carta plana sin botones; un grupo de 23 platos sale en tres
  hojas; agotado se lee; dos libros no se mezclan; flechas solo con foco adentro; sin desborde de lado; desmontar a
  media vuelta no deja nada.
- [ ] **Step 2:** implementar. **Step 3:** PASS.

### Task 5: Cierre

- [ ] `npm test`, `npm run typecheck`, `npm run build && npm run peso`, `npm run probar-paquete`.
- [ ] Parte `cierre` de `verificar-momentos3.mjs`: las tres piezas en WebKit (se ven, sin errores; lo que no depende
  de arrastrar). Pruebas visuales de lo tocado: `momentos3`, `momentos` (el sorteo cambió) y `momentos2` (misma vitrina).
- [ ] Documentos: `docs/CATALOGO.md`, `CHANGELOG.md`, `CLAUDE.md` (lista de pruebas), `docs/ci/verificar.yml` si lista
  las pruebas, y encargo `cerebro-aquiles/lamente/ENCARGO_2026-11-24_efectos-vistosos.md`.
- [ ] Revisión final independiente (Opus) y arreglos.
