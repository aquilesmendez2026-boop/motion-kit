# Un solo motor: motion-kit como fuente única de La Mente

Fecha: 28-11-2026. Camino elegido por Aquiles: **A** («si, vamos por A, escribe el diseño»).

## Por qué

Aquiles: «lo que creó el front está muy bien pero gracias a lo que tiene motion-kit; necesitamos unir y consolidar todo
y tener un solo motor de template, componentes, etc.»; «los 3 motores deben consumir lo mismo; si es necesario unir
todo, lo hacemos». Antes: «si tenemos un botón y ese botón cambia, ¿cambian todos?».

Lo que se busca: **un cambio en un solo lugar se ve en todas las pantallas** (la página de cada negocio, el panel y el
Estudio), y lo nuevo que se crea en motion-kit llega a La Mente sin rehacerlo allá.

## Lo que hay hoy (28-11)

Tres motores que deciden cómo se ve algo, con tres nombres para lo mismo:

| | Página pública (`lamente-front/packages/ui`, ~6.400 líneas) | Panel (`fronts/panel`, 169 pantallas, ~42 mil líneas) | motion-kit (~33 mil líneas) |
|---|---|---|---|
| Colores | `--lm-fondo, texto, acento, borde…` (de `PALETAS`) | tokens de Chakra (`tinta`, `purple-600`…) | `--mk-fondo, superficie, texto, suave, borde, acento, sobre-acento, bien, mal` |
| Forma (trazo, sombra, esquinas, hundirse) | no tiene | `--lmt-*` (32 variables, `temaPanel.css`) | no tiene |
| Temas | contrato `diseno.json`: 12 paletas, 12 temas, 24 mezclas | ~11 temas `data-tema-panel` (`temasPanel.css`, 777 líneas, otra sesión, sin commit) | 6 `ESTILOS` (boton, neon, retro, rock, anime, pelicula) |
| Catálogo | 22 bloques × variantes, 13 ajustes (`diseno.ts`) | — | receta del encabezado, relatos de página, momentos, partituras |
| Piezas | 25 bloques con Chakra | `Modulo.tsx`: `BotonChico` (527 usos), `BotonModulo` (144), `EncabezadoModulo` (80), `ListaTarjetas`, `TarjetaItem`, `VacioModulo`, `IconoModulo`; `OfertaModulo` (73), `Confirmar` (33), `Spinner` (119), `CargaPantalla` (135) | `motion-kit/interfaz` (17 archivos del panel ya la usan) y `motion-kit/comic` |
| Contratos | `diseno.json`: **lo manda el backend** y el front lo sincroniza | — | encabezado, página, partitura, partituras de la casa e índice: los manda motion-kit y el backend y el front los copian |

Puentes que ya existen: `theme.ts` del panel traduce a mano los tokens de Chakra a `--mk-*`; `@la-mente/ui` carga
motion-kit aparte (`CargarMomentosContext`, `CargarRelatosContext`, el encabezado del equipo) solo cuando hace falta.

## Metas

1. **Un solo ADN**: un vocabulario de variables (`--mk-*`) para color, forma, letra y movimiento, que leen los tres motores.
2. **Temas como datos**: paletas, temas y mezclas de la página, temas del panel y estilos de motion-kit en **un**
   contrato que sale de motion-kit.
3. **Piezas únicas**: lo que hace una pieza (estados, animación, accesibilidad) vive en motion-kit; el front la envuelve
   sin cambiar su nombre, así cambiarla cambia todos sus usos.
4. **Un solo catálogo de página**: los bloques, sus variantes y los ajustes salen de motion-kit; el backend valida y el
   front dibuja contra ese contrato.
5. **El Estudio** edita con el mismo catálogo y los mismos temas.

## No metas

- Sacar Chakra del front. Chakra sigue para la distribución (`Box`, `Flex`, `Grid`) y los controles mientras dure; lo
  que se une es lo que se ve y cómo se comporta.
- Reescribir las 169 pantallas del panel. Se cambian las piezas por dentro; las pantallas quedan.
- Cambiar cómo se ve hoy La Mente. Cada fase termina con la página y el panel **iguales** (capturas antes y después),
  salvo lo que Aquiles pida cambiar.

## Anti-metas (sería un fracaso aunque funcione)

- Que un diseño guardado de un negocio se vea distinto o se rompa al subir de versión.
- Que la página pública pese más: cada negocio carga solo su tema.
- Que motion-kit dependa de Chakra o de algo de La Mente (también lo usan CBA y Ni Tan Mal a futuro).
- Que queden dos fuentes de verdad «por un tiempo» sin fecha: cada alias tiene la fase en que se borra.

## Restricciones

- motion-kit: sin dependencias nuevas en lo que viaja al navegador; solo `transform` y `opacity` en lo que se anima;
  movimiento reducido; 44 px en el teléfono; peso con tope por entrada.
- Los repos de La Mente se leen, no se tocan desde motion-kit: lo del front y el backend va como **encargo** en
  `cerebro-aquiles/lamente/`, y lo hace la sesión de cada repo.
- Commits, push y etiquetas solo con la orden de Aquiles.
- Los contratos se generan (`scripts/generar-contrato.mjs`), no se editan a mano; `contrato/indice.json` dice la versión
  de cada uno.

## Caminos considerados

- **A. motion-kit es la fuente única (elegido).** Publica el ADN, los temas como datos, las piezas y el catálogo; los
  tres motores los consumen. Es el patrón que ya funciona (contratos JSON, `--mk-*`, `motion-kit/interfaz`) y sirve
  para otros proyectos. Cuesta: es largo y toca tres repos; va por fases.
- **B. El front es dueño de todo (`@la-mente/ui`) y motion-kit queda para efectos.** Más simple con Chakra, pero
  contradice lo decidido (los contratos y el Estudio salen de motion-kit) y se pierden la demo y la batería de pruebas.
- **C. Un repo nuevo solo para el ADN y los contratos.** Un cuarto lugar que coordinar para lo que motion-kit ya hace.

## El diseño

### Las capas

```
  ADN (--mk-*)  →  Temas (datos)  →  Piezas  →  Catálogo de página  →  Motores
  color, forma,    paletas, temas,   botón,      bloques × variantes,    página pública, panel,
  letra, ritmo     mezclas, temas    tarjeta,    ajustes                 Estudio: solo ponen los
                   del panel         sección…                            datos y la distribución
  └──────────────── todo en motion-kit, publicado por etiqueta ────────┘
```

### 1. El ADN

Un solo vocabulario `--mk-*`, ampliado desde el de hoy:

| Grupo | Variables (propuesta; el nombre final lo fija la fase 1) |
|---|---|
| Color | `fondo`, `superficie`, `texto`, `suave`, `borde`, `acento`, `sobre-acento`, `bien`, `mal`, `cartel` (las de hoy) |
| Forma | `trazo` (ancho y color de la línea), `radio`, `radio-boton`, `radio-campo`, `sombra`, `sombra-suave`, `hundir` (lo que hace un botón al tocarlo) |
| Letra | `fuente`, `fuente-titulo`, `fuente-cartel` |
| Ritmo | `ritmo` (`quieto`, `suave`, `vivo`, `manga`): cuánto y cómo se mueven las piezas |

`variablesTema()` (hoy en `src/interfaz/tema.ts`) arma todas. Se mantiene el respaldo que ya existe: si falta una
variable, la pieza se ve como hoy.

**Traducción y fin de los alias:** en la fase 1 el front traduce `--lm-*`, `--lmt-*` y los tokens de Chakra a `--mk-*`
(una tabla en un solo archivo de cada front). En la fase 3 (panel) y la 4 (página) las piezas ya leen `--mk-*`
directo y esos alias se borran.

### 2. Temas como datos

Un contrato nuevo, `contrato/temas-motionkit.json`, con tres conceptos (los de la página, que ya funcionan):

- **Paleta**: solo colores (las 12 de hoy).
- **Tema**: forma, letra, ritmo y su **firma** (las pocas reglas propias que lo hacen reconocible, como la hoja
  cuadriculada de «cuaderno» o el resplandor de «noche»). Para qué sirve cada uno: `pagina`, `panel` o los dos.
  Entran los 12 de la página, los ~11 del panel y los 6 estilos de motion-kit (los repetidos se juntan).
- **Mezcla**: una receta para un tipo de negocio: tema + paleta + bloques sugeridos (las 24 de hoy).

La firma de cada tema es CSS que vive en motion-kit, marcada con `[data-mk-tema="…"]`, y se carga **solo el tema que
usa el negocio** (una entrada nueva `motion-kit/temas`, con un archivo por tema), para que la página no pese más.

Compatibilidad: cada id de hoy sigue valiendo. Si dos se juntan, el contrato trae un mapa `antes → ahora` y el backend y
el front lo leen igual.

### 3. Las piezas

Las piezas de motion-kit traen la conducta (estados, animación, accesibilidad) y se visten con el ADN; aceptan
`className`, `style` y las props de su elemento (regla que ya tienen `interfaz` y `comic`). Nunca importan Chakra.

El front mantiene sus nombres y cambia el interior. Mapa inicial:

| Pieza del front | Por dentro, la de motion-kit |
|---|---|
| `BotonChico`, `BotonModulo` | `Boton` (de `src/piezas`, ampliado con forma del ADN) y `BotonQueGuarda` donde guardan |
| `Spinner` en botones, `CargaPantalla` | `BotonQueGuarda`, `Cargando` |
| `VacioModulo`, `OfertaModulo` | `Vacio`, `Oferta` |
| `Confirmar` (y `Pregunta`, `DialogoEnLinea`) | `Confirmar` |
| `EncabezadoModulo`, `IconoModulo` | **nueva**: `CabezaSeccion` (ícono, antetítulo, título, bajada; `Encabezado` ya es el de la página) |
| `ListaTarjetas`, `TarjetaItem` | `Tarjeta` (de `src/piezas`) y `ListaViva` |
| Copias a mano de tarjeta (9), sección (8), formulario (6), campo (4), selector (3) | `Tarjeta`, **nueva** `Seccion`, `Campo`, **nuevo** `Selector` |

La v0.6.0 (lista, sin publicar) ya trae `BotonQueGuarda`, `Confirmar`, `Copiar`, `Campo`, `Vacio`, `Oferta`,
`CartelNovedad`, `Guia` y `useCelebrar`: es la primera entrega de esta capa.

### 4. El catálogo de página

Hoy `diseno.json` lo manda el backend. Pasa a salir de motion-kit como `contrato/diseno-motionkit.json` (bloques ×
variantes, ajustes, fijos, por defecto, y los ids de paletas, temas y mezclas del contrato de temas). El backend lo
copia y valida contra él, igual que hace con los otros contratos; el front lo sincroniza como hoy.

El marco de cada bloque (variante y ajustes: fondo, corte, entrada, ancho, espacio, tarjetas, efecto, alto, letras)
lo dibuja motion-kit, en `motion-kit/pagina`, que ya tiene los relatos de página. `@la-mente/ui` pone el contenido (la
lista de precios, las reseñas, la agenda) dentro de ese marco. Se migra **bloque por bloque**; mientras tanto conviven el
marco viejo y el nuevo, elegidos por bloque.

### 5. El Estudio

Lee el mismo catálogo y los mismos temas (no tiene listas propias). Lo que cree el equipo (recetas de encabezado,
partituras) ya sale de motion-kit; se suma elegir tema y paleta desde el contrato de temas.

### Cómo llega un cambio

Una etiqueta de motion-kit trae el ADN, los temas, las piezas y los contratos al día (`indice.json` dice la versión de
cada uno). El front sube la versión en `packages/ui/package.json` y el backend copia los contratos. Un contrato nuevo
acepta los ids del anterior: un diseño guardado nunca se rompe.

## Fases

Cada fase termina con: pruebas de motion-kit (las que toca y la pasada rápida; la batería completa en los saltos de
versión), un encargo al front o al backend con lo que les toca, y **capturas antes y después** de la página y el panel
que muestran que se ven igual.

| Fase | Qué | Dónde | Versión propuesta |
|---|---|---|---|
| 0 | Publicar la v0.6.0 (ya lista) y escribir la **tabla de nombres** (cada `--lm-*`, `--lmt-*`, token de Chakra y tema de cada lado, con su `--mk-*` o tema de destino) | motion-kit | v0.6.0 |
| 1 | **ADN**: `--mk-*` con forma, letra y ritmo; `variablesTema()` ampliada; las piezas de hoy leen la forma. Encargo al front: la tabla de alias en un archivo por front | motion-kit, después front | v0.7.0 |
| 2 | **Temas como datos**: `temas-motionkit.json`, entrada `motion-kit/temas` con la firma de cada tema. Encargo al front: los temas del panel (lo de la otra sesión) y `TEMAS`/`PALETAS`/`MEZCLAS` leen el contrato. Encargo al backend: copiar y validar | motion-kit, front, backend | v0.8.0 |
| 3 | **Piezas del panel**: `Encabezado`, `Seccion`, `Selector`; `Boton` con forma. Encargo al front: `Modulo.tsx` y las copias a mano usan las de motion-kit por dentro; se borran los alias del panel | motion-kit, después front | v0.9.0 |
| 4 | **Catálogo de página**: `diseno-motionkit.json` y el marco de bloque en `motion-kit/pagina`. Encargos: el backend valida contra él; `@la-mente/ui` migra bloque por bloque; se borran los alias de la página | motion-kit, backend, front | v0.10.0 |
| 5 | **Estudio**: tema y paleta desde el contrato | front (Estudio) | con la v0.10 |

Orden pensado para que lo más usado (el panel, 527 botones) se una pronto y lo más delicado (los diseños guardados de
los negocios) vaya al final, con el ADN y los temas ya probados.

## Riesgos y cómo se cuidan

- **Diseños guardados**: el contrato nuevo acepta los ids viejos (mapa `antes → ahora`) y hay un caso compartido de
  prueba por tema (como `casos/` del backend).
- **Peso**: la firma de cada tema se carga sola; topes nuevos por entrada (`motion-kit/temas` por tema).
- **Dos sesiones en el mismo front**: los temas del panel de la otra sesión son la materia prima de la fase 2; antes de
  partirla se coordina por el cerebro (regla 10).
- **Tiempos entre repos**: cada fase se publica en motion-kit primero y el front o el backend la toman cuando Aquiles
  da la orden; mientras, todo sigue funcionando con la versión anterior.

## Decisiones de Aquiles (28-11-2026, «1 a y 2 si»)

1. **Un solo catálogo de temas; cada negocio elige el de su panel por separado.** Página y panel leen el mismo contrato
   de temas. El panel parte con el tema «La Mente» de hoy: nada cambia de cara sin que el dueño lo elija. Un tema dice
   para qué sirve (`pagina`, `panel` o los dos); los que sirven para los dos se pueden usar en ambos lados.
2. **El contrato del diseño de página pasa del backend a motion-kit** (fase 4). motion-kit lo genera como
   `contrato/diseno-motionkit.json`; el backend lo copia y valida contra él, igual que con los otros contratos. Se avisa
   a la sesión del backend con el encargo de la fase 4.

## Decisiones tomadas al revisar el diseño (mías; Aquiles puede corregirlas)

Un revisor leyó el diseño como constructor. Lo que se resuelve sin cambiar lo que se construye:

- **Los temas de la otra sesión del front** (`temasPanel.css`, sin commit): la fase 2 parte cuando esa sesión los haya
  dejado en commit; desde ahí son la materia prima y se coordina por un aviso en `cerebro-aquiles/lamente/`. Mientras,
  las fases 0 y 1 no los tocan.
- **«Se ve igual»**: una muestra fija de capturas, teléfono y escritorio: 12 pantallas del panel (Resumen, Página,
  Precios, Pedidos, Agenda, Colaboraciones, Caja, Módulos y 4 con formularios o confirmar) y la página de un negocio por
  tema. Tolerancia: hasta 0,5 % de píxeles distintos por captura (letras y subpíxeles); más que eso, se mira a ojo y
  se explica.
- **Fase 0** necesita la orden de Aquiles para publicar la v0.6.0 (commit, etiqueta, push); la batería completa ya
  corrió. `Vacio` y `Oferta` siguen en `motion-kit/comic`, que es donde el front las toma.
- **`Boton` y las props de Chakra**: la fase 3 parte con un inventario de las props que hoy reciben `BotonChico` y
  `BotonModulo` (y las demás piezas de `Modulo.tsx`). La envoltura del front **sigue aceptando esas props** y las traduce;
  las pantallas no se tocan. Si una prop no tiene equivalente, la envoltura la pasa a Chakra como hoy hasta que se
  reemplace.
- **Diseños guardados**: la fase 4 parte con un encargo al backend para sacar de dev una muestra de diseños reales (sin
  datos personales) como casos de prueba, junto con los de `contrato/casos/`. Si el mapa `antes → ahora` junta dos temas
  que se ven distintos, no se juntan: quedan los dos.
- **Peso**: la página pública base no sube más de 2 KB comprimidos por fase; la firma de cada tema, máximo 3 KB
  comprimidos; `motion-kit/temas` con tope por tema y `motion-kit/pagina` con su tope de hoy más lo que sume el marco,
  medido en la fase 4.

## Lo que queda al constructor

- Los nombres finales de las variables nuevas y de las piezas nuevas (`CabezaSeccion`, `Seccion`, `Selector`).
- Cómo se juntan los temas repetidos (por ejemplo, «neon» de la página con «neon» de motion-kit y «noche» del panel).
- El formato exacto de los contratos nuevos, siguiendo el de los que ya existen (`$comentario`, `version`).
- Qué pruebas visuales nuevas hacen falta (una por fase, en la línea de `verificar-panel`).
