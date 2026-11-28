# Un solo motor, fase 3: las piezas del panel y la guía (v0.9.0) — plan

> **Para quien ejecuta:** usar superpowers:executing-plans (nativo) o superpowers:subagent-driven-development, tarea por
> tarea. Los pasos usan casillas (`- [ ]`). Parte con la v0.8.0 publicada.

**Meta:** que las piezas del panel de La Mente (las de `Modulo.tsx` y las conductas que hoy viven en su CSS) sean
piezas de motion-kit que leen el ADN y el detalle del tema; que el front solo las envuelva sin cambiar sus nombres; y que
la guía de todas las piezas, con los 14 temas, viva en la vitrina de motion-kit.

**Arquitectura:** piezas nuevas en `motion-kit/interfaz`, sin Chakra. Cada una:
- lee color, forma y letra (`--mk-*` del ADN) y las variables de detalle del catálogo de temas (`--mk-campo-foco`,
  `--mk-sombra-chica`, `--mk-radio-icono`…), siempre con el valor de «lamente» de respaldo;
- se marca sola con `data-mk-adorno` para que la firma de cada tema la encuentre;
- acepta `className`, `style` y las props de su elemento, para que el front la vista sin tocarla.

Las conductas del front (`SubirImagen`, `ListaViva`, `Campo`) se suman a las piezas que ya existen. La barra lateral
pasa a ser una pieza.

**Técnica:** React 18, TypeScript, CSS perezoso en cadenas (`useStyles` con `estilos()`), node:test, Playwright.

**Diseño:** `docs/superpowers/specs/2026-11-28-un-solo-motor-design.md` (fase 3, «Conductas que el front escribió en
CSS y pasan a las piezas» y el mapa de piezas). Decisiones de Aquiles del 28-11: la guía se centraliza en motion-kit con
esta fase; todo diseño nuevo reutilizable se hace en motion-kit.

**Insumos del front** (solo lectura):
- `fronts/panel/src/components/Modulo.tsx` y `modulo.css` (222 líneas);
- `fronts/panel/src/pages/temaPanel.css` (las conductas: «Subir fotos», campos, casillas, pestañas, títulos; 437
  líneas);
- `fronts/panel/src/pages/barraLateral.css` (206 líneas);
- la guía: `pages/GuiaLaMente.tsx` y `pages/guia/*`.

## Restricciones globales

- **Las de las fases 1 y 2:** sin dependencias; solo `transform`, `translate`, `scale`, `rotate` y `opacity` en lo
  que se anima; movimiento reducido; 44 px; los repos de La Mente se leen y no se tocan.
- **Las piezas no importan Chakra ni nada del front.** El front las envuelve con sus nombres (`BotonChico`,
  `TarjetaItem`…) y sus props de hoy, y las pantallas no se tocan.
- **«Se ve igual»:** con el tema «lamente» y sin clases del front, cada pieza nueva se ve como la del front de hoy, con
  hasta 0,5 % de diferencia en las capturas, comparadas contra capturas tomadas del front en local. Con los otros 13
  temas, como la guía del front.
- **Pesos:**
  - `interfaz` (tope 28 KB, hoy 21,4) no pasa de 26;
  - cada pieza nueva tiene su tope en `medir-paquete.mjs`: `BotonPanel` 1,5 KB, `TarjetaFila` 2,5, `BarraLateral` 4;
  - `temas` no cambia.
- **Antes de la etiqueta:** solo lo que cambió (`verificar --desde=v0.8.0`) y la pasada rápida. Revisión final en
  Opus, porque es salto de versión.

## Foco de la revisión

1. **Las 14 firmas encuentran sus partes en las piezas nuevas:** con «taller», «barbería», «cancha» y «picada», cada
   pieza muestra la firma igual que el panel del front.
2. **Los estados** (`verde`, `gris`, `naranjo`, `morado`, `rojo`) se leen con contraste AA en los 14 temas.
3. **La barra lateral contraída:** se recorre con el teclado, la sección elegida se anuncia (`aria-current`) y cada
   ícono tiene nombre.
4. **Con movimiento reducido**, el barrido, el revelado, el salto, el latido y el temblor no se mueven y todo se ve.
5. **Un texto muy largo** (título de tarjeta, estado, nombre de sección) no rompe el ancho en 390 px.

---

### Task 1: El inventario y las API

**Archivos:**
- Crear: `docs/un-solo-motor/piezas-del-panel.md`

**Interfaces:**
- Produce: para cada pieza o conducta del front, la pieza de motion-kit, sus props y las variables que lee. Las tareas
  2 a 5 copian de aquí los valores.

- [ ] **Paso 1:** leer `Modulo.tsx`, `modulo.css`, las conductas de `temaPanel.css` y `barraLateral.css`. Escribir una
  tabla por pieza con columnas `del front | de motion-kit | props | variables que lee (con su valor de «lamente»)`.
  Mapa ya decidido:
  - `IconoModulo` → `IconoCaja` (tamaños 36, 44 y 56; el ícono va como hijo);
  - `BotonModulo` y `BotonChico` → `BotonPanel` (`tamano: "grande" | "chico"`, `tono?: "principal" | "peligro"`);
  - `EncabezadoModulo` → `CabezaSeccion` (`icono`, `titulo`, `bajada?`, `accion?`);
  - `ListaTarjetas` → `GrillaTarjetas` (`como: "ul" | "div"`; dos columnas desde 1024 px);
  - `TarjetaItem` → `TarjetaFila` (`foto?`, `icono?`, `titulo`, `estado?: { texto, tono }`, `detalle?`, `acciones?`,
    `pie?`, `como: "li" | "article"`);
  - la píldora de estado → `Pastilla` (`tono: "verde" | "gris" | "naranjo" | "morado" | "rojo"`);
  - `VacioModulo` → `Vacio` (ya existe);
  - las copias a mano de sección (8) y selector (3) → `Seccion` (`titulo`, `bajada?`, `accion?`, `children`) y
    `Selector` (un `select` nativo con etiqueta, ayuda y error, como `Campo`);
  - la barra lateral → `BarraLateral` (Task 5).
- [ ] **Paso 2:** en el mismo documento, la lista de **lo que se queda en el front**: `.lm-cabeza`, `.lm-boton-sol`,
  `PasosEnPestanas`, `--lm-grupo` (que se declara) y las recetas de Chakra que no son de estas piezas.
- [ ] **Paso 3:** tomar las capturas «antes» del front en local con el tema «lamente»: las 12 pantallas de la muestra
  de «se ve igual» y su guía con cada tema. Guardarlas en `<tmp>/mk-fase3-front/`. Se toman con un script propio en
  `scripts/.capturas-front.mjs`, que no queda en el repo.

### Task 2: Las piezas base (`IconoCaja`, `BotonPanel`, `Pastilla`)

**Archivos:**
- Crear: `src/interfaz/IconoCaja.tsx`, `src/interfaz/BotonPanel.tsx`, `src/interfaz/Pastilla.tsx` y
  `src/interfaz/tonos.ts` (puro: el color de fondo y de texto de cada tono, como `var(--mk-…)` con respaldo)
- Modificar: `src/entradas/interfaz.ts`, `src/index.ts`, `scripts/medir-paquete.mjs`
- Test: `pruebas/piezas-panel.test.ts`; `scripts/verificar-panel.mjs` (parte nueva `piezas-panel`)

**Interfaces:**
- Produce: `IconoCaja({ tamano?: 36 | 44 | 56, children, ...span })`;
  `BotonPanel({ tamano?: "grande" | "chico", tono?: "principal" | "peligro", ...button })`;
  `Pastilla({ tono, children, ...span })`; `colorDeTono(tono): { fondo: string; texto: string }`.

- [ ] **Paso 1: Pruebas que fallan** en `pruebas/piezas-panel.test.ts`:
  - `colorDeTono` da para cada uno de los 5 tonos un fondo y un texto que pasan AA (contraste ≥ 4,5) con los colores de
    «lamente»;
  - el CSS de cada pieza nueva no trae colores ni formas fijas fuera de `c()`, `f()` o `var(--mk-…)` (la misma regla
    de la fase 1);
  - cada pieza se marca con su `data-mk-adorno` (`icono`, `boton`, `estado`).
- [ ] **Paso 2:** correr → FALLA. **Paso 3:** implementar.
- [ ] **Paso 4: Parte `piezas-panel` en `verificar-panel`,** en una sección nueva de `#panel-piezas`. Revisa:
  - los botones miden al menos 44 px;
  - `BotonPanel` se hunde al tocarlo (`--mk-hundir`);
  - con el tema «taller», el botón toma su trazo y su radio;
  - captura contra la del front: menos de 0,5 %.
- [ ] **Paso 5:** `node scripts/pruebas.mjs piezas-panel` y `node scripts/verificar-panel.mjs piezas-panel` → bien.

### Task 3: Secciones y tarjetas (`CabezaSeccion`, `Seccion`, `GrillaTarjetas`, `TarjetaFila`, `Selector`)

**Archivos:**
- Crear: `src/interfaz/CabezaSeccion.tsx`, `Seccion.tsx`, `GrillaTarjetas.tsx`, `TarjetaFila.tsx` y `Selector.tsx`
- Modificar: entradas, pesos, `demo/Panel.tsx` (su sección en `#panel-piezas`)
- Test: `pruebas/piezas-panel.test.ts`, `verificar-panel` (`piezas-panel`)

**Interfaces:**
- Consume: `IconoCaja`, `Pastilla` (Task 2); `Campo` (para la etiqueta, la ayuda y el error de `Selector`).
- Produce: las props del Task 1. `TarjetaFila` lleva `data-mk-adorno="hoja"` y su título es un `h3`. `CabezaSeccion`
  lleva un `h2` con `data-mk-adorno="titulo"`.

- [ ] **Paso 1: Pruebas que fallan:**
  - en `TarjetaFila` y `CabezaSeccion`, los títulos son `h3` y `h2`;
  - `Selector` pasa `aria-invalid` y `aria-describedby` como `Campo`;
  - el CSS sin valores fijos.
- [ ] **Paso 2: Visual** (`piezas-panel`):
  - en 390 px, un título de 120 caracteres no corre el ancho;
  - la grilla tiene 1 columna en el teléfono y 2 desde 1024 px;
  - con «cancha», la firma inclina el título;
  - las capturas contra el front, menos de 0,5 %.
- [ ] **Paso 3:** implementar. **Paso 4:** las dos pruebas → bien.

### Task 4: Las conductas en las piezas que ya existen

**Archivos:**
- Modificar: `src/interfaz/SubirImagen.tsx`, `ListaViva.tsx` y `Campo.tsx`
- Test: `verificar-panel` (partes `imagen`, `llega` y `adn`); `pruebas/tema-interfaz.test.ts`

- [ ] **Paso 1: Pruebas que fallan,** una por conducta (lo que el front pidió):
  - **`SubirImagen`:**
    - vacía, se levanta al pasar (`--mk-levantar`);
    - al arrastrar, se tiñe y el ícono salta;
    - mientras sube, una franja de luz la cruza (con `transform`);
    - la foto entra revelándose: de borrosa y sin color a nítida, con `opacity` y una capa encima, sin animar
      `filter`;
    - Cambiar y Quitar van en píldora (`BotonPanel` chico).
  - **`ListaViva`:**
    - el destello lee `--mk-destello-color` y `--mk-destello-ancho`;
    - late dos veces (`scale` y `opacity`).
  - **`Campo`:**
    - el control se levanta al pasar y al escribir (`--mk-campo-levantar`);
    - tiembla una vez con error (ya lo hace);
    - deshabilitado, se ve punteado;
    - el error lleva una señal «!»;
    - las casillas usan `accent-color` del acento.
  - **Con movimiento reducido,** nada de eso se mueve.
- [ ] **Paso 2:** implementar. Los respaldos son los valores de hoy del front con «lamente». Lo que antes no existía en
  la pieza toma el valor de «lamente» del catálogo.
- [ ] **Paso 3:** las partes `imagen`, `llega`, `adn` y `piezas-panel` → bien; `verificar-comic campo` → bien; capturas
  de la fase 1 → solo cambian estas piezas, y a ojo calzan con el front.

### Task 5: La barra lateral (`BarraLateral`)

**Archivos:**
- Crear: `src/interfaz/BarraLateral.tsx`
- Modificar: entradas, pesos, `demo/PanelVivo.tsx` (la barra del panel vivo pasa a ser esta pieza)
- Test: `verificar-panel` (parte `vivo`) y `pruebas/piezas-panel.test.ts`

**Interfaces:**
- Produce: `BarraLateral({ grupos: { nombre: string | null; color?: string; secciones: { id, nombre, icono: ReactNode,
  sinModulo?: boolean }[] }[]; actual: string; alElegir: (id) => void; contraida?: boolean; alContraer?: () => void;
  etiqueta?: string })`. Es un `nav` con `aria-label`; la sección elegida lleva `aria-current="page"`; cada grupo
  declara `--mk-grupo`; los íconos van en `IconoCaja` teñida con el color del grupo, saltan al pasar y hacen pop al
  elegir; lo que no tiene módulo va punteado. Contraída, solo íconos, cada uno con su nombre (`aria-label` y un
  `title`). Marcas: `data-mk-adorno="barra"`, `grupo` e `icono`.

- [ ] **Paso 1: Pruebas que fallan** (`vivo`):
  - las 41 secciones con su grupo;
  - las flechas y Tab la recorren;
  - Enter elige;
  - `aria-current` está en la elegida;
  - contraída, cada ícono tiene nombre y mide al menos 44 px;
  - con «taller» lleva la cinta de su firma;
  - con movimiento reducido, ni salto ni pop.
- [ ] **Paso 2:** implementar. **Paso 3:** `vivo` → bien.

### Task 6: La guía en motion-kit

**Archivos:**
- Modificar: `demo/Temas.tsx`. `#temas` pasa a ser la guía de todas las piezas del panel con los 14 temas. Toma del
  front:
  - la portada de cada tema con su `TextoCinetico` y su `WordRotate` de rubros;
  - la muestra de piezas y momentos de `PiezasMotionKit.tsx`;
  - `useSubidaDeMuestra`.
  
  `demo/Guia.tsx` (`#guia`, la guía del front con su propuesta) sigue como historial.
- Modificar: `scripts/verificar-temas.mjs` (cada sección de la guía, con cada tema, sin errores y sin correrse de
  lado).

- [ ] **Paso 1:** la guía con todas las piezas: base, secciones y tarjetas, `SubirImagen` con su recorrido completo,
  `ListaViva`, `Campo`, `Selector`, `BarraLateral`, `Confirmar`, avisos, `Vacio`, `Oferta`, `Guia` y los momentos.
  Cada sección lleva una línea de para qué sirve.
- [ ] **Paso 2:** `verificar-temas` recorre la guía con cada uno de los 14 temas, en teléfono y escritorio: sin
  errores, sin correrse de lado y con la firma en su lugar → bien. Dura menos de 2 minutos.

### Task 7: Encargo al front

**Archivos:**
- Crear: `cerebro-aquiles/lamente/ENCARGO_<fecha>_piezas-panel.md` (borrador hasta la etiqueta `v0.9.0`)

- [ ] **Paso 1:** el encargo.
  - **`Modulo.tsx`:** cada pieza usa por dentro la de motion-kit y mantiene sus nombres y props (`BotonChico` →
    `BotonPanel` chico, etc.). Las pantallas no se tocan.
  - **Se borra en el front:**
    - las reglas de `modulo.css`;
    - las conductas de `temaPanel.css` (subir fotos, campos y casillas);
    - `barraLateral.css` (la barra pasa a `BarraLateral`);
    - los alias `--lmt-*` del panel que ya no lee nadie (la tabla dice cuáles).
  - **Los 55 campos de Chakra:** pasan a `Campo` con su `Input` como control.
  - **La guía:** en el front queda una chica, solo con lo propio de La Mente (`.lm-cabeza`, `PasosEnPestanas`).
  - **Criterio:** capturas del panel con los 14 temas, antes y después, iguales (0,5 %).
- [ ] **Paso 2:** `npm run tabla` y `npm run temas` siguen en verde. Si el front borra variables, la tabla se actualiza.

### Task 8: Cierre y v0.9.0

- [ ] **Paso 1:** `typecheck`, `npm test`, `build`, `peso` (los topes de la tarea 2), `probar-paquete` (sumar: un panel
  con `BotonPanel`, `TarjetaFila` y `BarraLateral` solo trae `interfaz`), `npm run temas` y `npm run tabla`.
- [ ] **Paso 2:** `npm run verificar -- --desde=v0.8.0` y `npm run humo`.
- [ ] **Paso 3:** revisión final en Opus; arreglos con prueba RED→GREEN; los menores, anotados.
- [ ] **Paso 4:** versión 0.9.0, CHANGELOG, catálogo («Piezas del panel» y «Paquete v0.9.0»), README y
  `npm run contrato`.
- [ ] **Paso 5:** con la orden de Aquiles («termina sin preguntar» vale mientras siga en pie): commit, push y etiqueta;
  `AVANCES.md`; el encargo deja de ser borrador; avisar al front.
