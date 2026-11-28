# Un solo motor, fases 0 y 1: tabla de nombres, v0.6.0 y el ADN (v0.7.0) — plan

> **Para quien ejecuta:** usar superpowers:executing-plans (nativo) o superpowers:subagent-driven-development, tarea por
> tarea. Los pasos usan casillas (`- [ ]`).

**Meta:** que motion-kit tenga un solo vocabulario `--mk-*` de color, forma, letra y ritmo, que las piezas de
`interfaz` y `comic` lo lean sin cambiar cómo se ven hoy, y dejar al front el encargo de traducir sus variables a ese
vocabulario.

**Arquitectura:** `src/interfaz/tema.ts` crece de colores a ADN (forma, letra, ritmo), con la misma regla de hoy: cada
uso trae su respaldo, así sin variables todo se ve igual. Una tabla de nombres (documento + script que la revisa contra el
front, solo lectura) dice a qué `--mk-*` va cada variable de La Mente. Un script de capturas prueba «se ve igual».

**Técnica:** React 18, TypeScript, CSS en cadenas (`useStyles`), node:test (`node scripts/pruebas.mjs`), Playwright.

**Diseño:** `docs/superpowers/specs/2026-11-28-un-solo-motor-design.md` (fases 0 y 1; las 2 a 5 tendrán su plan).

## Restricciones globales

- Sin dependencias nuevas en lo que viaja al navegador; solo `transform`, `translate`, `scale`, `rotate` y `opacity` en
  lo que se anima; movimiento reducido; 44 px en el teléfono.
- Cada fase termina con La Mente **igual**: capturas antes y después, hasta 0,5 % de píxeles distintos por captura.
- Los repos de La Mente se leen, no se tocan: lo del front va como encargo en `cerebro-aquiles/lamente/`.
- Commits, push y etiquetas solo con la orden de Aquiles. Se trabaja en la rama `comic` (después, la que diga Aquiles).
- Nombres en español; módulos puros sin el mismo nombre que un componente (el disco no distingue mayúsculas).
- Pesos: `interfaz` tope 28 KB, `comic` 14 KB, `motion-kit` 105 KB; la v0.7.0 no sube más de 1 KB cada entrada.
- Salto 0.6 → 0.7: batería completa (`npm run verificar -- --todo`) + pasada rápida antes de la etiqueta.

## Foco de la revisión

1. **Sin variables, todo igual**: una pieza sin `--mk-*` de forma se ve exactamente como hoy (las capturas lo prueban).
2. **Valores raros en las variables** (`--mk-radio: 0`, sombra `none`, un trazo de 4 px): la pieza no se rompe ni
   cambia de tamaño al punto de correr lo de al lado (los botones siguen midiendo 44 px).
3. **Ritmo «quieto» y movimiento reducido juntos**: ninguno anula al otro; con cualquiera de los dos no hay saltos.
4. **Las piezas en portales** (avisos, `Confirmar`, `Guia`, `useCelebrar`) toman la forma de `:root`, no de su caja.
5. **El front con sus temas nuevos** (`data-tema-panel`): la tabla cubre cada variable `--lmt-*` que exista ese día.

---

## Fase 0

### Task 1: La tabla de nombres

**Archivos:**
- Crear: `docs/un-solo-motor/tabla-de-nombres.md`
- Crear: `scripts/revisar-tabla-nombres.mjs`
- Modificar: `package.json` (script `"tabla": "node scripts/revisar-tabla-nombres.mjs"`)

**Interfaces:**
- Produce: la tabla que usan la tarea 3 (nombres de `--mk-*`) y la tarea 7 (encargo al front).

- [ ] **Paso 1: Escribir la tabla.** Secciones: *Color*, *Forma*, *Letra*, *Ritmo*, *Temas*. Una fila por variable de
  La Mente: `--lm-*` (de `lamente-front/packages/ui/src/TemaPagina.tsx`), `--lmt-*` (de
  `fronts/panel/src/pages/temaPanel.css` y `temasPanel.css`) y los tokens de Chakra que traduce
  `fronts/panel/src/theme.ts`; columnas: `variable de hoy | --mk-* de destino | nota`. Destinos fijos: los 9 colores de
  hoy + `cartel`; forma `trazo`, `radio-tarjeta`, `radio-boton`, `radio-campo`, `sombra`, `sombra-suave`, `hundir`; letra
  `fuente-texto`, `fuente-titulo`, `fuente-cartel`; ritmo `ritmo-tiempo`, `ritmo-fuerza`. Lo que no tenga destino va con
  destino `—` y la nota «se queda en el front» o «fase 2 (firma del tema)». *Temas*: los ids de paletas, temas y mezclas
  de `contrato-diseno.json`, los `data-tema-panel` y los `ESTILOS` de motion-kit, con la fase en que se juntan (2).
- [ ] **Paso 2: Escribir `scripts/revisar-tabla-nombres.mjs`.** Lee (solo lectura) esos archivos del front en
  `../lamente-front`, junta cada `--lm-*` y `--lmt-*` que aparezca, y falla (código 1) listando las que no están en la
  tabla. Si `../lamente-front` no existe, avisa y sale con 0.
- [ ] **Paso 3: Correrlo.** `npm run tabla` → `La tabla cubre N variables del front (0 sin destino escrito).`
  Si falla, completar la tabla y volver a correr.

### Task 2: Publicar la v0.6.0 (solo con la orden de Aquiles)

- [ ] **Paso 1: Pedir la orden.** Detenerse y pedírsela a Aquiles. Sin orden, la fase 0 queda en la tarea 1.
- [ ] **Paso 2: Con la orden:** revisar el cerebro (regla 10); commit en `comic` (el mensaje dice qué pruebas corrieron:
  batería completa del 27-11, 20/20); llevar a `dev` y `main`; etiqueta `v0.6.0`; push de ramas y etiqueta.
- [ ] **Paso 3:** fila en `cerebro-aquiles/AVANCES.md` (bajo el encabezado de la tabla, con el commit); el encargo
  `lamente/ENCARGO_2026-11-27_guardar-y-comic.md` deja de ser borrador. Commit en el cerebro solo de esos dos archivos.

## Fase 1

### Task 3: El ADN en `tema.ts`

**Archivos:**
- Modificar: `src/interfaz/tema.ts`
- Modificar: `src/entradas/interfaz.ts`, `src/entradas/comic.ts`, `src/index.ts` (exportar lo nuevo)
- Test: `pruebas/tema-interfaz.test.ts`

**Interfaces:**
- Produce:
  - `type FormaInterfaz = "trazo" | "radio" | "radioBoton" | "radioCampo" | "sombra" | "sombraSuave" | "hundir"`
  - `type LetraInterfaz = "fuente" | "fuenteTitulo" | "fuenteCartel"`
  - `type Ritmo = "quieto" | "suave" | "vivo" | "manga"`
  - `type AdnInterfaz = TemaInterfaz & Record<FormaInterfaz | LetraInterfaz, string> & { ritmo: Ritmo }`
  - `f(nombre: FormaInterfaz, respaldo: string): string` → `var(--mk-<kebab>,<respaldo>)`
  - `letra(nombre: LetraInterfaz, respaldo: string): string` → igual, con `--mk-fuente…`
  - `RITMOS: Record<Ritmo, { tiempo: number; fuerza: number }>` = quieto `{tiempo: 1, fuerza: 0}`, suave `{1.25, 0.6}`,
    vivo `{1, 1}`, manga `{0.85, 1.4}`
  - `tiempo(ms: number): string` → `calc(<ms>ms * var(--mk-ritmo-tiempo,1))`; `fuerza(n: number): string` →
    `calc(<n> * var(--mk-ritmo-fuerza,1))`
  - `ritmoDe(el: Element): { tiempo: number; fuerza: number }` (lee las dos variables calculadas; sin ellas, `{1, 1}`)
  - `variablesTema(t: Partial<AdnInterfaz>)` acepta todo; `ritmo` emite `--mk-ritmo-tiempo` y `--mk-ritmo-fuerza`.
  - `fuenteCartel()` pasa a ser `letra("fuenteCartel", "'Arial Black','Helvetica Neue',sans-serif")` (misma salida).

- [ ] **Paso 1: Pruebas que fallan** en `pruebas/tema-interfaz.test.ts`:
  - `adn: f() y letra() usan la variable y el respaldo de cada uso` — `f("radioBoton","12px") ===
    "var(--mk-radio-boton,12px)"`; `letra("fuenteTitulo","serif") === "var(--mk-fuente-titulo,serif)"`.
  - `adn: variablesTema traduce el ritmo a tiempo y fuerza` — `variablesTema({ ritmo: "manga" })` deepEqual
    `{ "--mk-ritmo-tiempo": "0.85", "--mk-ritmo-fuerza": "1.4" }`; `variablesTema({ radio: "0px", trazo: "" })`
    deepEqual `{ "--mk-radio": "0px" }`.
  - `adn: tiempo() y fuerza() escalan por el ritmo` — `tiempo(300) === "calc(300ms * var(--mk-ritmo-tiempo,1))"`.
  - `adn: fuenteCartel no cambia` — igual a la cadena de hoy.
- [ ] **Paso 2:** `node scripts/pruebas.mjs tema-interfaz` → FALLA (no existen `f`, `letra`, `tiempo`).
- [ ] **Paso 3: Implementar** en `tema.ts` lo de Interfaces. `ritmoDe` usa `getComputedStyle(el).getPropertyValue` y
  devuelve `{1, 1}` si no hay número válido.
- [ ] **Paso 4:** `node scripts/pruebas.mjs tema-interfaz` → PASA; `npm run typecheck` → sin errores.

### Task 4: Capturas «se ve igual»

**Archivos:**
- Crear: `scripts/capturas.mjs`
- Modificar: `package.json` (`"capturas": "node scripts/capturas.mjs"`), `CLAUDE.md` (una línea en Comandos)

**Interfaces:**
- Produce: `npm run capturas -- tomar <carpeta> [url]` y `npm run capturas -- comparar <a> <b>`; lo usan las tareas 5,
  6 y 8 y las fases que vienen.

- [ ] **Paso 1: `tomar`** captura, en teléfono (390×844) y escritorio (1280×800), con movimiento reducido (para que
  nada quede a mitad de animación) y las letras de Google bloqueadas (como `verificar-panel`): `#panel-piezas` (arriba
  y cada sección con `data-prueba` de sección), `#comic`, y `#panel?s=` de `resumen`, `pagina`, `precios`, `pedidos`,
  `agenda`, `colaboraciones`, `caja`, `modulos`, `sellos` (con «Crear el primero» tocado) y `novedades`; y `#panel` con
  `Confirmar` abierto. Un PNG por captura en `<carpeta>`.
- [ ] **Paso 2: `comparar`** abre las dos imágenes en una página de Chromium, cuenta píxeles distintos por canal con
  tolerancia 8 y falla (código 1) si alguna pasa de 0,5 %, listando cada captura con su porcentaje. Si falta una imagen
  en un lado, falla diciendo cuál.
- [ ] **Paso 3: Probarlo contra sí mismo:** con el servidor arriba, `tomar` dos veces y `comparar` → `Iguales: N de N
  (máximo 0,0x %)`; y comparar contra una copia donde se borró una imagen → falla nombrándola.
- [ ] **Paso 4: Tomar el «antes»:** `npm run capturas -- tomar <tmp>/mk-antes-adn` **antes de tocar las piezas**.

### Task 5: Las piezas leen la forma y la letra

**Archivos:**
- Modificar: `src/interfaz/{BotonQueGuarda,Copiar,Campo,Confirmar,SubirImagen,Interruptor,Cargando,Contador,ListaViva}.tsx`,
  `src/comic/{estilos.ts,Guia.tsx,CartelNovedad.tsx,Vacio.tsx,Oferta.tsx,Celebrar.tsx}`,
  `src/components/{Toast,BottomSheet,Tabs,TabBar}.tsx`
- Test: `pruebas/tema-interfaz.test.ts`, `scripts/verificar-panel.mjs` (parte nueva `adn`)

**Interfaces:**
- Consume: `f`, `letra` (tarea 3).

- [ ] **Paso 1: Prueba que falla** — `adn: las piezas no traen forma fija`: en cada archivo de la lista, ningún
  `border-radius:`, `box-shadow:` ni `border:` (con ancho) con un valor literal fuera de `${f(…)}`; se permiten `0`,
  `50%`, `999px` (formas de píldora y círculo) y `none`. El mensaje nombra archivo y línea.
- [ ] **Paso 2:** `node scripts/pruebas.mjs tema-interfaz` → FALLA listando los literales de hoy.
- [ ] **Paso 3: Reemplazar** cada literal por `f(<nombre>, <el valor de hoy>)`: esquinas de botones → `radioBoton`;
  de campos → `radioCampo`; de hojas, globos y tarjetas → `radio`; sombras → `sombra` (las fuertes) o `sombraSuave`;
  bordes → `trazo`; las letras de títulos de cómic → `letra("fuenteCartel", …)` (ya), los títulos de `Confirmar` y
  `Vacio` → `letra("fuenteTitulo", "inherit")`. El «hundirse» al tocar (`:active`) → `transform: f("hundir", "<lo de
  hoy o none>")` solo en los botones que ya lo hacen.
- [ ] **Paso 4:** `node scripts/pruebas.mjs tema-interfaz` → PASA.
- [ ] **Paso 5: Se ve igual:** `npm run capturas -- tomar <tmp>/mk-despues-adn` y `comparar` contra el «antes» →
  `Iguales`. Si una pasa de 0,5 %, el respaldo de esa pieza no es el de hoy: corregir el respaldo, no la tolerancia.
- [ ] **Paso 6: Parte `adn` en `verificar-panel.mjs`** (teléfono y escritorio): poner en `:root`
  `variablesTema({ radioBoton: "0px", sombra: "6px 6px 0 #000", trazo: "3px solid #000", fuenteTitulo: "Georgia" })`
  y revisar con `getComputedStyle`: `BotonQueGuarda` con radio 0 y alto ≥ 44; el globo de `Confirmar` (abierto) con esa
  sombra; el aviso de `Toast` (portal) con ese trazo; el título de `Vacio` con Georgia; sin errores. Con
  `radioBoton: "0"` y `sombra: "none"` tampoco hay errores ni cambia el alto.
- [ ] **Paso 7:** `node scripts/verificar-panel.mjs adn` → `Todo bien`; `node scripts/verificar-comic.mjs` → `Todo bien`.

### Task 6: Las piezas siguen el ritmo

**Archivos:**
- Modificar: las animaciones CSS de `src/comic/estilos.ts`, `Guia.tsx`, `Celebrar.tsx`, `src/components/Toast.tsx`; las
  de JS de `src/interfaz/{BotonQueGuarda,Campo,Contador,ListaViva,SubirImagen,Cargando}.tsx`
- Test: `scripts/verificar-panel.mjs` (parte `adn`), `pruebas/tema-interfaz.test.ts`

**Interfaces:**
- Consume: `tiempo`, `fuerza`, `ritmoDe`, `RITMOS` (tarea 3).

- [ ] **Paso 1: Prueba que falla** (parte `adn`): con `variablesTema({ ritmo: "quieto" })` en `:root`, tocar Guardar
  (que termina bien) en `#panel-piezas`: ninguna animación del botón cambia `scale` (`getAnimations()` y sus keyframes);
  con `ritmo: "manga"`, la duración del saltito es 0,85× la de hoy (±5 %). Con movimiento reducido y `manga`, solo
  fundidos (lo de hoy).
- [ ] **Paso 2:** `node scripts/verificar-panel.mjs adn` → FALLA en el ritmo.
- [ ] **Paso 3: Implementar.** CSS: `animation-duration: ${tiempo(<ms de hoy>)}` y, en los keyframes que escalan,
  rotan o trasladan, la amplitud con `fuerza(<valor de hoy>)` (por ejemplo `scale(calc(1 + ${fuerza(0.08)}))`). JS: leer
  `ritmoDe(elemento)` justo antes de `animate()` y multiplicar duración y amplitud. Movimiento reducido manda sobre el
  ritmo (si está reducido, se sigue haciendo lo de hoy).
- [ ] **Paso 4:** `node scripts/verificar-panel.mjs adn` → `Todo bien`; sin ritmo, capturas iguales (paso 5 de la
  tarea 5, otra vez) y `node scripts/verificar-comic.mjs` → `Todo bien`.

### Task 7: La demo lo muestra y el encargo al front

**Archivos:**
- Modificar: `demo/PanelVivo.tsx` (un selector «Forma» en la barra de arriba: «La Mente» = sin variables, «Suave» y
  «Manga», que aplica `variablesTema` en `:root`), `demo/Panel.tsx` si hace falta para la parte `adn`
- Crear: `cerebro-aquiles/lamente/ENCARGO_2026-11-28_adn-motionkit.md` (borrador)

- [ ] **Paso 1: El selector.** «Manga» = `{ trazo: "2.5px solid #10223f", radio: "16px", radioBoton: "999px",
  sombra: "6px 6px 0 #10223f", sombraSuave: "3px 3px 0 #10223f", hundir: "translate(2px,2px)", fuenteCartel: <la de
  hoy del panel vivo>, ritmo: "manga" }`; «Suave» = radios 14 px, sin trazo, sombras difusas, `ritmo: "suave"`. Las
  clases `pv-*` de la demo no cambian (son de la maqueta).
- [ ] **Paso 2:** `node scripts/verificar-panel.mjs vivo` → `Todo bien` (más una revisión: el selector cambia el radio
  de un `BotonQueGuarda` del panel).
- [ ] **Paso 3: El encargo** (borrador, «no partir hasta la etiqueta `v0.7.0` y la orden de Aquiles»): subir a
  `#v0.7.0`; **un archivo por front** con la traducción, según `docs/un-solo-motor/tabla-de-nombres.md`: el panel, en
  `theme.ts` (los tokens de Chakra y las `--lmt-*` de forma y letra → `--mk-*`, también dentro de cada
  `data-tema-panel`); la página, en `TemaPagina.tsx` (`--lm-*` → `--mk-*`). Nada más cambia en el front en esta fase;
  los alias se borran en las fases 3 y 4. Criterio: capturas del front iguales antes y después.

### Task 8: Cierre y v0.7.0

**Archivos:**
- Modificar: `scripts/medir-paquete.mjs` (si un tope por pieza lo pide), `docs/CATALOGO.md` (sección «ADN: forma, letra
  y ritmo» y «Paquete v0.7.0»), `CHANGELOG.md`, `README.md`, `package.json` (0.7.0), `contrato/indice.json`
  (`npm run contrato`)

- [ ] **Paso 1:** `npm run typecheck`, `npm test`, `npm run build`, `npm run peso` (cada entrada ≤ +1 KB contra la
  v0.6.0), `npm run probar-paquete` → todo bien.
- [ ] **Paso 2:** capturas «antes» (tarea 4) contra «después» → `Iguales`.
- [ ] **Paso 3:** batería completa `caffeinate -i npm run verificar -- --todo` y `npm run humo` → todo bien (si una
  falla con el Mac cargado, mirar la carga y repetirla sola, y anotarlo).
- [ ] **Paso 4:** revisión final en Opus de toda la tanda (salto de versión); arreglar lo Importante con prueba RED→GREEN.
- [ ] **Paso 5:** versión 0.7.0, documentos, `npm run contrato`; detenerse y pedir a Aquiles la orden de commit, push y
  etiqueta. Con la orden: fila en `AVANCES.md` y el encargo de la tarea 7 deja de ser borrador.
