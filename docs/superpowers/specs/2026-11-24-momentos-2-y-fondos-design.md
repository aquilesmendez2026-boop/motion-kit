# Segunda tanda de momentos y más fondos vivos (diseño)

Fecha: 24-11-2026. Pedido de Aquiles: «sigamos con la segunda tanda de momentos y más efectos como el de
constelación». Sobre los seis bloques que son solo un botón, eligió la opción 1: un «llamado con vida» común.

## Para qué

La Mente está construyendo el Estudio común: el dueño arma su página con bloques. Hoy 9 de los 22 bloques llegan con
su efecto propio; los otros se ven planos. Esta tanda le da un efecto a los 14 que faltan y suma cinco fondos del tipo
de la constelación, para que el Estudio tenga más de dónde elegir sin que el dueño configure nada.

## Qué se encontró en La Mente (solo lectura, 24-11)

Revisado en `lamente-front/packages/ui/src/bloques/` y `PaginaNegocio.tsx`. Los 14 bloques existen con esos nombres.

| Grupo | Bloques | Qué datos trae el bloque |
|---|---|---|
| Con datos (8) | `calendario`, `clases`, `novedades`, `enlaces`, `episodios`, `secciones`, `avisos`, `cinta` | Fechas, cupos, tarjetas, enlaces, audio, preguntas, un texto |
| Solo un botón a otra página (6) | `agenda`, `pedidos`, `buzon`, `cotizaciones`, `encuestas`, `contacto` | Un botón o enlaces; el formulario, el carrito y los votos viven en otra página |

Por eso tres ideas anotadas en la primera tanda no se pueden hacer dentro del bloque: las barras con los resultados de
la encuesta (el bloque solo trae la pregunta), el carrito que rebota (no hay carrito ahí) y el sobre que se cierra al
enviar (el formulario está en `/buzon`). La cinta ya se mueve sola en La Mente (`lm-cinta-corre`); lo nuevo es que su
velocidad siga al scroll. La Mente todavía no usa motion-kit en su página pública.

## Metas

- Un efecto para cada uno de los 14 bloques: 8 piezas con los datos del bloque y una pieza común, el «llamado con
  vida», para los 6 que son un botón.
- Cinco fondos nuevos para el encabezado, elegibles con `efecto` en la receta, como la constelación.
- Todo se baja aparte, tiene sus tres niveles, es accesible y viene con sus pruebas.
- Se ven en la demo (`#momentos` y `#efectos`) y quedan listos para que La Mente los conecte.

## No metas

- Conectar las piezas en La Mente (sus repos no se tocan desde aquí): va como encargo en el cerebro.
- Pedirle a La Mente datos que hoy el bloque no trae (resultados de encuestas, el carrito).
- Las páginas de destino (`/reservar`, `/pedido`, `/buzon`, `/cotizar`, `/encuesta`): otra tanda, si se pide.
- Escenas por capas, y B y C de la primera tanda: siguen anotadas en la hoja de ruta.

## Anti metas

- Que un momento tape o retrase el contenido: el texto del bloque se lee desde el primer cuadro.
- Que engañe: el llamado de la encuesta no muestra barras ni porcentajes (no hay resultados en el bloque); la onda de
  los episodios es un dibujo que acompaña al audio, no un análisis del sonido, y no se presenta como tal.
- Que estorbe la acción: el botón o el enlace del bloque nunca se mueve mientras se le apunta, y el momento no le
  quita el clic (lección de la revisión de «dedo y física»).
- Que gaste batería: nada corre fuera de la vista ni con la pestaña oculta; lo que no necesita seguir, se detiene.

## Restricciones

- Las del repo (`CLAUDE.md`): sin dependencias; móvil primero; en CSS que se anima, solo `transform` (o `translate`,
  `scale`, `rotate`) y `opacity`; movimiento reducido; accesible.
- Nada «al azar» de verdad: lo que varía sale de una semilla.
- Colores `var(--mk-…, var(--lm-…))`, para que funcione dentro de un `Estilo` y también suelto en una página de La
  Mente.
- Un solo fondo animado por encabezado: los cinco fondos nuevos entran en esa regla.
- Pesos: ver «Peso» (hay una decisión de Aquiles).

## Enfoques considerados

Para los seis bloques que son solo un botón:

| Enfoque | Decisión |
|---|---|
| **Un «llamado con vida» común: una escena chica por bloque, que acompaña al botón de La Mente** (elegido por Aquiles) | Parejo, barato y no promete datos que el bloque no tiene |
| Dejar esos bloques sin efecto | Descartado: quedan seis bloques planos en el Estudio |
| Pedirle más datos a La Mente | Descartado por ahora: depende de cambios en La Mente y demora |

Para la forma de las piezas (decisión mía, la misma de la primera tanda): **piezas de React que reciben los datos del
bloque como props**, no marcas sobre el HTML de La Mente. Varias necesitan los datos (fechas, cupos, la duración del
audio) y así cada pieza se prueba sola. La escena del llamado es solo decoración: La Mente conserva su botón y su
enlace tal como están, y la pieza se pone al lado.

## La base común (ya existe, se reusa)

- `useMomento` (arranca una vez, al verse; niveles completo, liviano y quieto), el resorte por estilo, `CSS_BASE`.
- `velocidadScroll` y el resorte de `src/dedo/` (para la cinta), `descifrar` (para el aviso) y `src/efectos/lienzo.ts`
  (para los fondos).
- Las fechas y horas se leen en la zona del negocio (por defecto Chile), con `Intl`, como `faltaPara`.

## Los 8 momentos con datos

Cada uno dibuja el contenido del bloque (texto real, enlaces reales) y lo anima. El encabezado de la sección (etiqueta,
título y frase) y el botón de «ver todo» los sigue poniendo La Mente. La pieza dibuja lo que recibe: cuántas filas o
tarjetas mostrar lo decide La Mente, como hoy (5 fechas, 3 novedades, 3 episodios). Los nombres de las props son del
kit; la tabla de «Datos» dice de dónde salen en La Mente.

1. **Fechas que vienen** (`calendario`) — `FechasQueVienen`. Cada fecha lleva una hoja de calendario (día y mes) que se
   voltea al verse, una tras otra. La de hoy queda encendida con el acento. Las de tipo «cerrado» van tachadas con una
   línea que se dibuja. Liviano: fundido. Quieto: todo en su estado final.
2. **Clases de hoy** (`clases`) — `ClasesDeHoy`. Dos grupos, hoy y mañana. Cada clase muestra sus cupos en texto,
   como hoy («Quedan 3», «Queda 1», «Lleno»); «Queda 1» late suave y «Lleno» queda firme. Si además viene el total
   (`cupos`, que hoy La Mente no manda), se suma una barra que se llena hasta lo ocupado; sin él no hay barra. La
   próxima clase del día (según la hora del negocio) va resaltada.
3. **Novedades que llegan** (`novedades`) — `NovedadesQueLlegan`. Las tarjetas entran de a una, como correo que cae
   en la bandeja (resorte del estilo). La más nueva lleva la marca «Nuevo» solo si tiene 7 días o menos.
4. **Enlaces en dominó** (`enlaces`) — `EnlacesDomino`. Los botones se levantan uno tras otro, como fichas de dominó
   al revés. Después quedan quietos: son enlaces y no se mueven al apuntarles.
5. **Episodios con onda** (`episodios`) — `EpisodiosOnda`. Cada episodio lleva una onda de barras. Está quieta hasta
   que se le da a reproducir; mientras suena ese audio, se mueve; al pausar, se detiene. La forma sale de una semilla.
   El reproductor es el `<audio controls>` del navegador, con `preload="none"`, como hoy.
6. **Secciones con resorte** (`secciones`) — `SeccionesVivas`. Preguntas: acordeón con `<details>` real; al abrir, la
   respuesta aparece con resorte y la flecha gira (al cerrar se cierra de una, como el `<details>` del navegador: no
   se anima el alto). Pasos: los números se estampan en orden. Equipo: las iniciales
   entran en cascada. Texto: fundido.
7. **Aviso que se despliega** (`avisos`) — `AvisoQueSeDespliega`. La franja se abre desde arriba y su texto se
   descifra una vez (corto: menos de un segundo). El tono «celebración» suelta un poco de confeti (se reusa `Confeti`).
   Conserva el enlace «Ver más» y el botón de cerrar, con teclado.
8. **Cinta con impulso** (`cinta`) — `CintaConImpulso`. Con `quieta` (la otra versión del bloque en La Mente), el
   lema va centrado y no se mueve. Si no, la cinta corre sola y, al bajar o subir la página, acelera o
   se devuelve según la velocidad del scroll, y vuelve a su paso con rebote. El lema también va en texto para
   lectores de pantalla, una sola vez.

## El «llamado con vida» (los 6 bloques de botón)

Una pieza, `LlamadoConVida`, con la prop `escena`. Dibuja una escena chica (unos 96 px, en SVG, con los colores del
estilo) que arranca al verse y después queda quieta. Es decoración (`aria-hidden`, sin recibir toques): el título, el
texto y el botón siguen siendo los de La Mente.

| `escena` | Qué se ve |
|---|---|
| `agenda` | Una hoja de calendario que se voltea y deja marcado un día |
| `pedidos` | Una bolsa que se asienta con rebote; con `abierto`, un punto que late; cerrado, quieto y apagado |
| `buzon` | Un sobre que se abre y asoma una carta |
| `cotizaciones` | Una hoja que se escribe línea a línea y termina con un total subrayado |
| `encuestas` | Tres casillas; una se marca con un visto |
| `contacto` | Una burbuja de chat con tres puntos que «escriben» un momento y se detienen |

Liviano: la escena aparece con un fundido, ya terminada. Quieto: terminada, sin moverse.

## Los cinco fondos nuevos (`efecto` del encabezado)

Todos en un lienzo 2D sobre `lienzo.ts`, como la constelación: se detienen fuera de la vista y con la pestaña oculta,
toman los colores del estilo, van detrás del texto y a media fuerza, y dibujan a 30 por segundo. En liviano o con
movimiento reducido en la galería: un cuadro quieto. En quieto dentro del encabezado: no se dibujan.

| `efecto` | Qué se ve | Con el dedo o el cursor | Rubro, ánimo |
|---|---|---|---|
| `bandada` | Puntos alargados que se mueven en grupo, como pájaros o peces | El grupo lo esquiva | otro, vistoso |
| `luciernagas` | Luces que flotan lento y se encienden y apagan a su ritmo | Las cercanas se encienden | comida, sobrio |
| `corrientes` | Trazos finos que siguen corrientes invisibles y dejan estela | Las corrientes se desvían a su alrededor | belleza, sobrio |
| `gotas` | Anillos que se abren y se apagan, como gotas en el agua, de a poco | Cada toque o movimiento suelta una | salud, sobrio |
| `relieve` | Curvas de nivel que ondulan lento, como un mapa de cerros | La zona cercana se levanta | clases, sobrio |

`variante` (1 a 3) es la densidad; menos elementos en pantallas angostas.

## Recetas y contratos

- **Encabezado (v2):** cinco valores nuevos en `efecto`. Sin campos nuevos ni versión nueva; el contrato se regenera.
- **Página (v1):** sin cambios. Los momentos no van en la receta: La Mente decide qué pieza usa cada bloque.
- La copia del contrato en La Mente tiene que traer los cinco valores antes de que el Estudio los mande.

## Datos: props del kit y de dónde salen en La Mente

| Pieza | Props del kit | En La Mente |
|---|---|---|
| `FechasQueVienen` | `fechas[]` (`titulo`, `fecha`, `hora?`, `tipo`), `hoy?` | `ProximaBloque` (`BloqueCalendario`) |
| `ClasesDeHoy` | `sesiones[]` (`nombre`, `profesor?`, `hora`, `fecha`, `libres`, `espera`, `cupos?`), `hoy?` | `SesionBloque` (`BloqueClases`). `cupos` (el total) no viene hoy: sin él no hay barra |
| `NovedadesQueLlegan` | `entradas[]` (`titulo`, `resumen?`, `foto?`, `publicada`, `href`) | `EntradaBloque` (`portadaUrl`; el enlace lo arma La Mente) |
| `EnlacesDomino` | `enlaces[]` (`titulo`, `red`, `url`) | `EnlaceBloque` |
| `EpisodiosOnda` | `episodios[]` (`titulo`, `fecha?`, `audio`, `duracion?`) | `EpisodioBloque` |
| `SeccionesVivas` | `secciones[]` (unión por `tipo`: `preguntas`, `equipo`, `texto`, `pasos`) | `SeccionBloque` |
| `AvisoQueSeDespliega` | `texto`, `enlace?`, `tono`, `alCerrar` | `AvisoBloque`; recordar el cierre sigue en La Mente |
| `CintaConImpulso` | `lema`, `quieta?` | `pagina.lema`; `quieta` según la versión del bloque |
| `LlamadoConVida` | `escena`, `abierto?` | El tipo del bloque; `abierto` de `EstadoPedidos` |
| todas | `semilla` | El `slug` del negocio |

`hoy` (`AAAA-MM-DD`) es opcional: sin él, la pieza usa el día de hoy en la zona del negocio (`zona`, por defecto
Chile). Las piezas con fechas aceptan además un reloj (`ahora`) para las pruebas y la vitrina, como `CuentaRegresiva`.

## Peso (decisión de Aquiles)

Todo el código nuevo se baja aparte. Aun así, exportar nueve piezas más desde `motion-kit/momentos` suma su envoltura
(lo que se ve mientras llega cada archivo):

| Entrada | Hoy | Tope | Lo que suma esta tanda (estimado) |
|---|---|---|---|
| `momentos` | 11,9 KB | 12 | cerca de 1 a 1,5 KB: **no cabe** |
| Principal | 78,8 KB | 80 | cerca de 0,4 KB (cinco fondos en el registro): cabe |
| `encabezado` | 33,4 KB | 35 | cerca de 0,1 KB: cabe |
| `receta` | 9,5 KB | 10 | menos de 0,1 KB: cabe |

Propuesta, **aprobada por Aquiles el 24-11 («ok»)**, junto con este diseño: subir el tope de `momentos` de 12 a
**14 KB como máximo**, y solo si al medir hace falta. Antes de usarlo
se intenta bajar lo que ya hay (una envoltura común para todo lo que se baja aparte). Lo que de verdad baja un
teléfono no cambia: la página de un negocio carga solo las piezas de los bloques que usa.

Si al medir algo no cabe ni así, se para y se pregunta.

## Demo y pruebas

- **`#momentos`:** las nueve piezas nuevas con datos de ejemplo, con el selector de estilo y de nivel que ya existe.
- **`#efectos`:** los cinco fondos aparecen solos (la galería lista el registro).
- **Unitarias** (funciones puras): qué fecha es hoy y cuál es la próxima clase en la zona del negocio, la barra de
  cupos, la marca «Nuevo», las barras de la onda (misma semilla, mismo dibujo), el orden del dominó, la velocidad de
  la cinta (tope y vuelta a su paso) y el movimiento de cada fondo (bandada que no se sale de la caja, gotas que se
  apagan, etc.).
- **Visuales** (Playwright): cada pieza llega a su estado final; el texto real está desde el inicio; con movimiento
  reducido todo queda visible y quieto; los enlaces y botones reciben el clic también mientras el momento corre
  (apretar, esperar y soltar con el mouse); la onda se mueve solo mientras suena su audio; el acordeón y el aviso
  funcionan con teclado; a 360 px nada se sale de lado (medido contra el ancho fijo); al salir no queda nada vivo
  (bucles, lienzos, oyentes); sin Canvas no hay errores.
- Las pruebas que ya existen siguen pasando.

## Entrega

- Un plan, una tarea por pieza: primero los ocho momentos con datos, después el llamado y después los cinco fondos.
  Cada tarea deja su pieza completa y probada, así que si hay que cortar se cortan los últimos.
- Ejecución en esta sesión, con revisión final independiente, como las tandas anteriores. Commits solo con el OK de
  Aquiles.
- Al cerrar: encargo en el cerebro para que La Mente conecte las piezas, con la tabla de datos de arriba.

## Qué queda para quien construye

- Las cifras finas de cada momento (tiempos, giros, fuerzas) dentro de lo descrito.
- El dibujo de cada escena del llamado y de cada fondo (trazos simples, con los colores del estilo).
- Cómo se reparte el código, siempre que se baje aparte.
