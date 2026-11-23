# Efectos protagonistas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sumar al kit 12 efectos protagonistas (6 escenas y 6 fondos vivos, 3 variantes cada uno) con un registro y carga perezosa.

**Architecture:** Cada efecto es un componente en `src/efectos/` que dibuja una capa absoluta detrás del contenido, hecha con SVG/CSS y animada solo con `transform` y `opacity`. Una base común (`CapaEfecto`) pausa fuera de pantalla y respeta «reducir movimiento». Un registro `EFECTOS` los lista y los carga con `import()`; `EfectoPagina` renderiza uno por id.

**Tech Stack:** React 19, TypeScript, CSS keyframes inyectados con `useStyles`. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-21-efectos-protagonistas-design.md`

## Global Constraints

- Se anima solo `transform` y `opacity`.
- Colores: `var(--mk-acento, var(--lm-acento, #7c5cff))`, `--mk-fondo` → `--lm-fondo`, `--mk-superficie` → `--lm-superficie`; el texto con `currentColor`.
- Capa `aria-hidden="true"`, `position: absolute; inset: 0`, `pointer-events: none`, detrás del contenido.
- Fuera de pantalla: `data-quieto="true"` pausa las animaciones. Con `prefers-reduced-motion: reduce`: sin animación y composición quieta visible.
- Un efecto por archivo, cargado con `import()`. Sin dependencias nuevas. Peso objetivo menor a 4 KB comprimido por efecto.
- Dibujos propios; ningún personaje ni marca.

## Review Focus

- «Reducir movimiento» activo: cada efecto muestra su composición quieta, no una capa vacía. (Task 2, 3)
- Varias instancias a la vez (galería, vista previa del panel más la página): los keyframes no se duplican ni chocan. (Task 1)
- Contenedor muy chico o ancho de teléfono (360 px): sin scroll horizontal. (Task 4)
- Paleta clara y paleta Noche: el efecto no tapa el texto. Capa detrás, opacidad moderada. (Task 4)
- Id desconocido o falla la carga del archivo: la página sigue, sin efecto y sin error visible. (Task 1)

---

### Task 1: Base y registro

**Files:**
- Create: `src/efectos/tokens.ts`, `src/efectos/semilla.ts`, `src/efectos/CapaEfecto.tsx`, `src/efectos/registro.ts`, `src/efectos/EfectoPagina.tsx`, `scripts/verificar-efectos.mjs`
- Modify: `src/index.ts`

**Interfaces:**
- Produces:
  - `type Rubro = "comida" | "belleza" | "salud" | "clases" | "barrio" | "otro"`
  - `type Variante = 1 | 2 | 3`
  - `type EfectoId = "cafe" | "petalos" | "pulso" | "abecedario" | "letrero" | "cometas" | "niebla" | "burbujas" | "olas" | "puntos" | "lluvia" | "estrellas"`
  - `interface EfectoProps extends HTMLAttributes<HTMLDivElement> { variante?: Variante }`
  - `interface EfectoDef { id: EfectoId; nombre: string; familia: "escena" | "fondo"; rubros: Rubro[]; animo: "sobrio" | "vistoso"; cargar: () => Promise<{ default: ComponentType<EfectoProps> }> }`
  - `const EFECTOS: Record<EfectoId, EfectoDef>`
  - `function EfectoPagina(props: EfectoProps & { id: string }): JSX.Element | null`
  - `function CapaEfecto(props: { nombre: string; css: string; variante?: Variante; children: ReactNode } & HTMLAttributes<HTMLDivElement>): JSX.Element`
  - `function semilla(i: number, sal?: number): number` (determinista, entre 0 y 1)
  - `const COLOR: { acento: string; acentoClaro: string; fondo: string; superficie: string }`

- [ ] **Step 1: Escribir `scripts/verificar-efectos.mjs`** (Playwright contra el bundle de la demo). Para cada id de `EFECTOS` y variante 1..3, en la galería `#efectos`: `test_renderiza_hijos` (la capa tiene al menos 1 hijo), `test_solo_transform_y_opacity` (los `@keyframes` con prefijo `mk-` solo declaran `transform` y `opacity`), `test_pausa_fuera_de_pantalla` (con el efecto fuera de vista, `data-quieto="true"`), `test_reducir_movimiento` (con `reducedMotion: "reduce"` ningún elemento de la capa tiene `animation-name` distinto de `none` y la capa tiene hijos visibles), `test_sin_scroll_horizontal` (a 360 px de ancho, `scrollWidth - innerWidth === 0`), `test_tokens` (cambiar `--lm-acento` en el contenedor cambia el color calculado de un elemento de la capa), `test_id_desconocido` (`EfectoPagina id="no-existe"` no lanza error y no deja nodos), `test_estilos_unicos` (con 3 instancias del mismo efecto hay un solo `<style id="motion-kit-...">`).
- [ ] **Step 2: Correrlo y ver que falla** — `node scripts/verificar-efectos.mjs`. Esperado: falla porque no existe `#efectos`.
- [ ] **Step 3: Implementar `tokens.ts`, `semilla.ts` y `CapaEfecto.tsx`.** `CapaEfecto` usa `useStyles(nombre, css + REGLAS_BASE)`; `REGLAS_BASE` incluye la regla de `data-quieto` y el `@media (prefers-reduced-motion: reduce)` que pone `animation: none`. Un `IntersectionObserver` marca `data-quieto`. Sin observer, queda corriendo.
- [ ] **Step 4: Implementar `registro.ts` y `EfectoPagina.tsx`.** `EfectoPagina` usa `React.lazy` con caché por id y un límite de errores (`ErrorBoundary` de clase local) que devuelve `null`. Id desconocido devuelve `null`.
- [ ] **Step 5: Exportar** `EFECTOS`, `EfectoPagina`, `CapaEfecto` y los tipos desde `src/index.ts`.
- [ ] **Step 6: Verificar** — `tsc --noEmit` sin errores. Los checks de la galería se corren en Task 4.

### Task 2: Seis escenas por rubro

**Files:**
- Create: `src/efectos/escenas/{Cafe,Petalos,Pulso,Abecedario,Letrero,Cometas}.tsx`
- Modify: `src/efectos/registro.ts` (apuntar `cargar` a cada archivo)

**Interfaces:**
- Consumes: `CapaEfecto`, `semilla`, `COLOR`, `EfectoProps` (Task 1).
- Produces: cada archivo exporta `default function <Nombre>(props: EfectoProps): JSX.Element`.

- [ ] **Step 1: Registrar los 6 ids** en `EFECTOS` con su familia `"escena"`, rubro y ánimo según la tabla del spec, con `cargar` apuntando al archivo (todavía inexistente). Correr `tsc --noEmit`: falla por módulos que faltan.
- [ ] **Step 2: Implementar `Cafe`** (taza en SVG con 3 hilos de vapor que suben y se desvanecen, y granos que flotan). Variante 1: vapor lento; 2: más hilos; 3: granos más densos.
- [ ] **Step 3: Implementar `Petalos`** (pétalos que caen con giro lento). Variantes: cantidad 8, 14, 20.
- [ ] **Step 4: Implementar `Pulso`** (cruz o corazón central y anillos que se expanden y se desvanecen). Variantes: 2, 3 y 4 anillos.
- [ ] **Step 5: Implementar `Abecedario`** (letras, números y signos `A B C 1 2 3 + ? !` que suben con giro). Variantes: tamaño y densidad.
- [ ] **Step 6: Implementar `Letrero`** (texto «Abierto» configurable con la prop `texto?: string`, brillo con `text-shadow` fijo y parpadeo solo de `opacity`). Variantes: parpadeo suave, corte, sin parpadeo.
- [ ] **Step 7: Implementar `Cometas`** (rayas que cruzan en diagonal). Variantes: cantidad y ángulo.
- [ ] **Step 8: Verificar** — `tsc --noEmit` sin errores y, desde Task 4, los 8 checks del script en estas 6 escenas.

### Task 3: Seis fondos vivos

**Files:**
- Create: `src/efectos/fondos/{Niebla,Burbujas,Olas,Puntos,Lluvia,Estrellas}.tsx`
- Modify: `src/efectos/registro.ts`

**Interfaces:**
- Consumes: igual que Task 2.
- Produces: igual que Task 2.

- [ ] **Step 1: Registrar los 6 ids** con familia `"fondo"`; `tsc --noEmit` falla por módulos que faltan.
- [ ] **Step 2: Implementar `Niebla`** (bandas anchas y suaves que se desplazan en horizontal). Variantes: 2, 3 y 4 bandas.
- [ ] **Step 3: Implementar `Burbujas`** (suben con `translateY` y `opacity`). Variantes: tamaño y cantidad.
- [ ] **Step 4: Implementar `Olas`** (3 capas SVG que se desplazan en horizontal a distinta velocidad). Variantes: altura y velocidad.
- [ ] **Step 5: Implementar `Puntos`** (rejilla de puntos que «respira» con ondas de `opacity` escalonadas). Variantes: densidad y dirección.
- [ ] **Step 6: Implementar `Lluvia`** (rayas finas de luz que caen). Variantes: ángulo y densidad.
- [ ] **Step 7: Implementar `Estrellas`** (puntos que titilan en 3 capas). Variantes: densidad y brillo.
- [ ] **Step 8: Verificar** — `tsc --noEmit` y, desde Task 4, los 8 checks del script en los 6 fondos.

### Task 4: Galería en la demo y verificación

**Files:**
- Create: `demo/Galeria.tsx`
- Modify: `demo/main.tsx` (ruta `#efectos`), `demo/App.tsx` (enlace en el pie), `demo/demo.css`

**Interfaces:**
- Consumes: `EFECTOS`, `EfectoPagina`, `Tabs`, `Variante` (Tasks 1–3).
- Produces: `function Galeria(): JSX.Element` en `#efectos`, con tarjetas de 280 px de alto por efecto, selector de variante 1/2/3, selector de paleta (clásica, noche, terracota, océano) que fija `--lm-acento`, `--lm-fondo` y `--lm-superficie` en el contenedor, y texto de muestra sobre cada capa.

- [ ] **Step 1: Implementar `Galeria`** según Interfaces, más la ruta y el enlace.
- [ ] **Step 2: Compilar la demo con esbuild y correr `node scripts/verificar-efectos.mjs`.** Esperado: todos los checks pasan, o se corrige y se repite.
- [ ] **Step 3: Revisar capturas** a 390 px y 1280 px, con paleta clara y con Noche, buscando texto tapado o capas vacías.

### Task 5: Entrega

**Files:**
- Modify: `README.md`, `docs/CATALOGO.md`

- [ ] **Step 1: Documentar** los 12 efectos, el registro y las variables de color en el README y el catálogo.
- [ ] **Step 2: Copiar a la carpeta del Mac** solo los archivos nuevos y modificados, tras comparar los hashes de los modificados con la versión del Mac para no pisar cambios.
- [ ] **Step 3: En el Mac, correr** `node node_modules/typescript/bin/tsc --noEmit` y `npm run build`. Esperado: ambos sin errores. El build no se corre aquí.
- [ ] **Step 4: No hacer commit**; el commit lo hace Aquiles.
