# Un solo motor, fase 2: los temas como datos (v0.8.0) — plan

> **Para quien ejecuta:** usar superpowers:executing-plans (nativo) o superpowers:subagent-driven-development, tarea por
> tarea. Los pasos usan casillas (`- [ ]`). Parte cuando la v0.7.0 esté publicada.

**Meta:** que todos los temas (los 12 temas, 12 paletas y 24 mezclas de la página, los 14 temas del panel y el
movimiento de cada uno) vivan en motion-kit como datos, con un contrato que copian el front y el backend, y que aplicar
un tema dé exactamente lo que hoy dibuja el front.

**Arquitectura:** una carpeta `src/temas/` con los datos (paletas, temas, mezclas), las funciones que los vuelven
variables `--mk-*` y un componente `Tema` que marca su caja (`data-mk-tema`), declara **todas** sus variables (así corta
lo que hereda de afuera) y carga sus adornos y su letra. Los temas del panel se importan del front con un script que
también revisa, hasta que el front borre los suyos, que el catálogo dé lo mismo que su CSS.

**Técnica:** React 18, TypeScript, CSS en cadenas (`useStyles`) con perezoso por tema, node:test, Playwright.

**Diseño:** `docs/superpowers/specs/2026-11-28-un-solo-motor-design.md` (fase 2 y «Lo que trae el front para la fase 2»).
Insumos del front (rama `dev`, `5971d66`): `fronts/panel/src/pages/temasPanel.css`, `temaPanel.css`,
`pages/guia/temasGuia.ts`; de la página: `packages/ui/src/temas.ts`, `paletas.ts`, `contrato-diseno.json`.

## Restricciones globales

- Las del plan de la fase 1 (sin dependencias, solo `transform`/`opacity` animados, movimiento reducido, 44 px, commits
  y etiquetas con la orden de Aquiles, los repos de La Mente se leen y no se tocan).
- **Solo sumar** (regla del backend): todo id de tema, paleta y mezcla de `lamente-backend/contrato/diseno.json` existe
  en el catálogo con el mismo id; ninguno se renombra ni se quita.
- Un id que existe en la página y en el panel con valores distintos (`noche`, `rock`) es **un solo tema** con su
  variante de panel (`panel: { … }`), no dos ids.
- Las variables de detalle de las piezas (las 26 filas «fase 3 (pieza)» de `docs/un-solo-motor/tabla-de-nombres.md`)
  entran al catálogo como `--mk-<nombre>` (por ejemplo `--mk-campo-foco`); las piezas las leerán en la fase 3.
- Las firmas de los temas van como **adornos con nombre** que apuntan a partes marcadas (`[data-mk-parte="hoja"]`,
  `barra`, `titulo`, `icono`, `pestana`, `cabeza`), nunca a clases del front.
- No se juntan con `ESTILOS` (los estilos del encabezado de motion-kit): un tema dice cuál es su `estiloBase`, como hoy
  `BASE_DE_TEMA` en `src/receta/lamente.ts`.
- Pesos: los datos del catálogo, nueva entrada `motion-kit/temas`, **tope 8 KB** (aprobado por Aquiles el 28-11: «si, el tope de 8 KB está bien»);
  los adornos de un tema, máximo 3 KB comprimidos cada uno, cargados solo con su tema; ninguna otra entrada sube más de
  1 KB.

## Foco de la revisión

1. **El alcance**: un `Tema` de página dentro de un `Tema` de panel muestra los valores de la página, no los del panel
   (la vista previa del front).
2. **Un tema con el mismo id en página y panel** (`noche`, `rock`): cada lado ve su versión.
3. **Un id desconocido** (de un contrato más nuevo o mal escrito): cae al tema por defecto de su lado sin errores, como
   hace hoy el backend.
4. **Cambiar de tema en vivo**: los adornos y la letra del anterior se van; no quedan reglas pegadas.
5. **Movimiento reducido con un tema de adornos animados** (poste de barbero, pulso de clínica, colas de patitas): los
   adornos quedan quietos.

---

### Task 1: Los tipos y el tope

**Archivos:**
- Crear: `src/temas/tipos.ts`
- Modificar: `scripts/medir-paquete.mjs` (entrada `temas`, tope 8), `vite.config.ts` y `package.json` (`exports`
  `./temas`), `src/entradas/temas.ts` (nueva, vacía al principio)

**Interfaces:**
- Produce:
  - `type Para = "pagina" | "panel"`
  - `interface Colores { fondo; superficie; texto; suave; borde; acento; sobreAcento; cartel?: string }` (todas `string`)
  - `interface Letra { fuente?: string; fuenteTitulo?: string; fuenteCartel?: string; google?: string[]; peso?: number; mayusculas?: boolean; espaciado?: string; brillo?: boolean }`
  - `interface Movimiento { titulo: TextoEfecto; tarjeta: { variante: TarjetaVariante; efecto: TarjetaEfecto | TarjetaEfecto[] }; presencia: string; luz: string[] }`
  - `interface Lado { colores?: Partial<Colores>; forma?: Partial<Record<FormaInterfaz, string>>; detalle?: Record<string, string>; letra?: Letra; ritmo?: Ritmo; adornos?: string[] }`
  - `interface Tema extends Lado { id: string; nombre: string; para: Para[]; premium?: boolean; paleta?: string; estiloBase?: EstiloId; rubros?: string[]; movimiento?: Movimiento; panel?: Lado }`
  - `interface Paleta { id: string; nombre: string; colores: Colores }`
  - `interface Mezcla { id: string; nombre: string; rubros: string[]; tema: string; paleta: string; porQue: string }`

- [x] **Paso 1:** el tope de 8 KB para `motion-kit/temas` (aprobado por Aquiles el 28-11).
- [ ] **Paso 2:** escribir los tipos; `npm run typecheck` → sin errores.

### Task 2: Importar y revisar los temas del front

**Archivos:**
- Crear: `scripts/temas-del-front.mjs` (modos `importar` y `revisar`)
- Crear (generado una vez por `importar`, después se edita a mano): `src/temas/datos/panel.ts`, `src/temas/datos/pagina.ts`,
  `src/temas/datos/mezclas.ts`, `src/temas/datos/paletas.ts`
- Modificar: `package.json` (`"temas": "node scripts/temas-del-front.mjs revisar"`)

**Interfaces:**
- Consume: los tipos de la tarea 1 y la tabla de nombres (destino de cada `--lmt-*` y token de Chakra).
- Produce: `PALETAS: Paleta[]`, `TEMAS: Tema[]`, `MEZCLAS: Mezcla[]` (exportados desde `src/temas/datos/index.ts`).

- [ ] **Paso 1: `importar`** lee del front (solo lectura): cada bloque `[data-tema-panel="<id>"]{…}` de `temasPanel.css`
  y el de `:where([data-tema-panel])` de `temaPanel.css` (los valores por defecto = tema `lamente`), traduce cada
  variable con la tabla (`--chakra-colors-tinta` → `colores.texto`, `--lmt-sol` → `colores.cartel`, `--lmt-trazo` →
  `forma.trazo`, `--lmt-campo-foco` → `detalle["campo-foco"]`, `--lmt-cartel` → `letra.fuenteCartel`…), suma
  `movimiento` y `rubros` de `temasGuia.ts`; de la página toma `temas.ts`, `paletas.ts` y las mezclas de
  `contrato-diseno.json`, y `estiloBase` de `BASE_DE_TEMA`. Lo que no traduce lo lista y falla.
- [ ] **Paso 2:** correr `importar`; revisar los archivos generados a ojo (14 + 12 temas, 12 paletas, 24 mezclas;
  `noche` y `rock` con `panel: {…}`). Las reglas propias de cada tema (selectores que no son el bloque de variables)
  quedan listadas para la tarea 4.
- [ ] **Paso 3: Prueba que falla** `temas: el catálogo da lo mismo que el CSS del front` (en `npm run temas`): para cada
  tema del panel, las variables que arma `variablesDeTema` (tarea 3) traducidas de vuelta con la tabla son iguales a las
  del bloque de `temasPanel.css` (comparación de texto normalizado). Corre → FALLA (no existe `variablesDeTema`).

### Task 3: Aplicar un tema

**Archivos:**
- Crear: `src/temas/aplicar.ts`, `src/temas/Tema.tsx`, `src/temas/letras.ts`
- Modificar: `src/entradas/temas.ts`, `src/index.ts`
- Test: `pruebas/temas.test.ts`

**Interfaces:**
- Consume: datos de la tarea 2; `variablesTema` (fase 1).
- Produce:
  - `buscarTema(id: string | undefined, para: Para): Tema` (desconocido → `lamente` en el panel, `clasico` en la página)
  - `variablesDeTema(id: string, opciones: { para: Para; paleta?: string }): Record<string, string>` — **todas** las
    variables del ADN y de detalle, con los valores del tema, su variante del lado y su paleta; lo que el tema no define
    lleva el valor por defecto de su lado (por eso corta lo que hereda)
  - `<Tema id para paleta? as? className? children>` — una caja con `data-mk-tema={id}`, `data-mk-para={para}`, sus
    variables en `style`, sus adornos (tarea 4) y su letra
  - `cargarLetra(tema: Tema): void` — agrega una vez el `<link>` de Google Fonts de `letra.google` (la misma forma que
    `cargarFuenteTema` del front)

- [ ] **Paso 1: Pruebas que fallan** en `pruebas/temas.test.ts`:
  - `temas: cada id del contrato del backend existe en el catálogo` (lee `../lamente-backend/contrato/diseno.json` si
    está; paletas, temas y mezclas).
  - `temas: variablesDeTema declara todas las variables` — para `taller` (panel) y `papel` (página), las claves son el
    mismo conjunto completo (ADN + detalle).
  - `temas: el mismo id da su versión en cada lado` — `variablesDeTema("noche", {para:"panel"})["--mk-fondo"]` distinto
    del de `{para:"pagina"}`, y cada uno igual al del front.
  - `temas: un id desconocido cae al de su lado` — `buscarTema("nada","panel").id === "lamente"`, `("nada","pagina")`
    → `"clasico"`.
  - `temas: una paleta cambia solo los colores` — `variablesDeTema("papel",{para:"pagina",paleta:"bosque"})` toma los
    colores de `bosque` y la forma y letra de `papel`.
- [ ] **Paso 2:** `node scripts/pruebas.mjs temas` → FALLA.
- [ ] **Paso 3:** implementar lo de Interfaces.
- [ ] **Paso 4:** `node scripts/pruebas.mjs temas` → PASA; `npm run temas` (la prueba de la tarea 2) → `Los 14 temas del
  panel dan lo mismo que el front`.

### Task 4: Los adornos con nombre

**Archivos:**
- Crear: `src/temas/adornos.ts`
- Modificar: `src/temas/Tema.tsx`, `src/temas/datos/panel.ts` (cada tema con sus `adornos`)
- Test: `pruebas/temas.test.ts`

**Interfaces:**
- Produce: `ADORNOS: Record<string, () => string>` (CSS perezoso por adorno) con estos nombres, uno por firma del front:
  `cinta-peligro` (taller), `poste-barbero` (barberia), `pulso` (clinica), `pizarra` y `mantel` (picada), `aura` y
  `respira` (calma), `cola` (patitas), `linea-champana` (salon), `cinta-torcida` (rock, panel), `esquina-hoja`
  (cultivo), `inclinado` (cancha); y los que salgan del listado de la tarea 2.

- [ ] **Paso 1: Prueba que falla** `temas: cada adorno apunta a partes marcadas y respeta movimiento reducido` — el CSS
  de cada adorno solo usa selectores dentro de `[data-mk-tema="<id>"]` y `[data-mk-parte="…"]` (ninguna clase `.lm-`),
  anima solo `transform`/`opacity`, trae su bloque `prefers-reduced-motion` si anima, y pesa ≤ 3 KB comprimido.
- [ ] **Paso 2:** correr → FALLA.
- [ ] **Paso 3:** escribir cada adorno a partir de las reglas propias de `temasPanel.css` (listado de la tarea 2),
  cambiando sus clases por partes: `.lm-hoja` → `hoja`, `.lm-barra` → `barra`, los títulos → `titulo`, los íconos →
  `icono`, las pestañas → `pestana`, `.lm-cabeza` → `cabeza`. `Tema` monta con `useStyles` solo los adornos de su tema.
- [ ] **Paso 4:** correr → PASA.

### Task 5: El contrato de temas

**Archivos:**
- Crear: `src/temas/contrato.ts`; generado `contrato/temas-motionkit.json`
- Modificar: `scripts/generar-contrato.mjs`, `src/director/indice-contratos.ts`, `pruebas/contratos.test.ts`

**Interfaces:**
- Produce: `contratoTemas(): { $comentario; version: 1; paletas: Paleta[]; temas: Tema[]; mezclas: Mezcla[]; adornos: string[] }`
  y `textoContratoTemas()`. Mismos campos de cabecera que los otros contratos (el backend exige el mismo `$origen`).

- [ ] **Paso 1: Pruebas que fallan** en `pruebas/contratos.test.ts`: el contrato de temas es JSON puro, trae todos los
  ids del contrato del backend y cada `adornos[]` de un tema existe en `adornos`; el índice lista
  `temas-motionkit.json` con su versión; el archivo está al día.
- [ ] **Paso 2:** correr → FALLA. **Paso 3:** implementar y `npm run contrato`. **Paso 4:** correr → PASA.

### Task 6: La copia de La Mente deja de ser copia

**Archivos:**
- Modificar: `src/receta/lamente.ts` (`PALETAS_LAMENTE`, `TEMAS_LAMENTE` y `BASE_DE_TEMA` salen del catálogo),
  `pruebas/lamente.test.ts`

- [ ] **Paso 1:** correr `node scripts/pruebas.mjs lamente` → PASA (punto de partida).
- [ ] **Paso 2:** reemplazar las constantes copiadas por lecturas del catálogo, con la misma forma y los mismos valores.
- [ ] **Paso 3:** `node scripts/pruebas.mjs lamente` y `npm test` → PASAN sin tocar sus aserciones (incluida «la copia
  de temas y paletas sigue igual que en lamente-front», que ahora compara el catálogo con el front).

### Task 7: La vitrina de temas y el panel vivo

**Archivos:**
- Crear: `demo/Temas.tsx` (ruta `#temas`)
- Modificar: `demo/main.tsx`, `demo/App.tsx`, `demo/PanelVivo.tsx` (el selector «Forma» pasa a «Tema» con los 14 del
  panel, envolviendo el panel en `<Tema para="panel">` y marcando sus partes con `data-mk-parte`), `scripts/humo.mjs`,
  `scripts/verificar-cambios.mjs` (regla `src/temas/` → `temas`)
- Crear: `scripts/verificar-temas.mjs` (la prueba visual)

- [ ] **Paso 1: `#temas`**: el selector de todos los temas (en **dos líneas** en pantalla ancha, sin deslizar), y para
  el elegido: las piezas de `interfaz` y `comic`, una cabecera y una barra con sus partes marcadas (para ver los
  adornos), y su título con el efecto de su `movimiento`; con su lado (página o panel) y, en la página, su paleta.
- [ ] **Paso 2: Prueba que falla** `verificar-temas.mjs` (teléfono y escritorio): cada tema se aplica sin errores; el
  `data-mk-tema` de la caja cambia; un `Tema para="pagina"` dentro de uno de panel muestra los colores de la página
  (alcance); cambiar de tema quita los adornos del anterior (ninguna regla `[data-mk-tema="<anterior>"]` aplica); con
  movimiento reducido, ningún adorno anima; el selector se ve entero sin deslizar en 1280 px. Corre → FALLA.
- [ ] **Paso 3:** implementar. **Paso 4:** `node scripts/verificar-temas.mjs` → `Todo bien`; `npm run humo` → bien.

### Task 8: Encargos al front y al backend

**Archivos:**
- Crear: `cerebro-aquiles/lamente/ENCARGO_<fecha>_temas-motionkit.md` (borrador hasta la etiqueta `v0.8.0`)

- [ ] **Paso 1: Front.** Subir a `#v0.8.0`. **Panel:** envolver el panel en `<Tema para="panel" id={temaDelNegocio}>`
  (con `lamente` por defecto) y marcar sus partes con `data-mk-parte`; sus variables `--lmt-*` pasan a leer las
  `--mk-*` (la tabla, al revés de la fase 1) y los tokens de Chakra, un solo bloque que lee `--mk-*`; se borran los
  bloques de `temasPanel.css`. **Página:** `TEMAS`, `PALETAS` y `MEZCLAS` salen de `contrato/temas-motionkit.json`
  (copiado como hoy `contrato-diseno.json`); la vista previa va dentro de `<Tema para="pagina">` (corta el alcance).
  Criterio: capturas del panel con cada uno de los 14 temas y de una página por tema, antes y después, iguales.
- [ ] **Paso 2: Backend.** Copiar `temas-motionkit.json` junto a los otros (mismo `$origen`); `validarDiseno` y
  `colores.mjs` toman paletas, temas y mezclas de ahí; `diseno.json` sigue mandando bloques y ajustes hasta la fase 4.
  Rearmar después (`scripts/rearmar.mjs <amb>`). Las seis reglas del backend (diseño, fase 4) valen desde ya para los
  ids de temas.

### Task 9: Cierre y v0.8.0

- [ ] **Paso 1:** `npm run typecheck`, `npm test`, `npm run build`, `npm run peso` (temas ≤ 8 KB, cada adorno ≤ 3 KB,
  las demás entradas ≤ +1 KB), `npm run probar-paquete` (sumar: importar `motion-kit/temas` y aplicar un tema),
  `npm run temas` y `npm run tabla` → todo bien.
- [ ] **Paso 2:** capturas «se ve igual» de la fase 1 contra las nuevas: iguales salvo `#temas` (nueva) y el panel vivo
  (cambió el selector); revisarlas a ojo.
- [ ] **Paso 3:** salto 0.7 → 0.8: batería completa (`caffeinate -i npm run verificar -- --todo`) y `npm run humo`.
- [ ] **Paso 4:** revisión final en Opus; arreglos con prueba RED→GREEN.
- [ ] **Paso 5:** versión 0.8.0, `CHANGELOG`, catálogo («Temas como datos» y «Paquete v0.8.0»), README (`motion-kit/temas`),
  `npm run contrato`; pedir a Aquiles la orden de commit, push y etiqueta; con la orden, fila en `AVANCES.md`, la fila
  de `MAPA_CONEXIONES.md` (contrato nuevo) y los encargos dejan de ser borrador.
