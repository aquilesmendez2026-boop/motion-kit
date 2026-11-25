# Hilos: el hilo que gira, se abre, se junta y arma algo

Fecha: 25-11-2026. Pedido de Aquiles: «más efectos de fondo como el hilo, con giros, que se dividan en varios puntos y
se vuelvan a unir, que a medida que bajas se arme algo». Aprobó la dirección («si a todo… parte con los hilos»):
tres hilos nuevos, y la figura final sale de un set nuestro, por rubro.

## Para qué

El Hilo de hoy (`relatoPagina: "hilo"`) es una S lisa que va **por detrás** de los bloques. En un teléfono casi no se
ve: los bloques lo tapan y asoma solo en los espacios (capturas del 25-11). Y en las páginas de La Mente no hay
espacios: los bloques son franjas de lado a lado, pegadas una a la otra, con su relleno por dentro
(`lamente-front/packages/ui/src/PaginaNegocio.tsx`). Queremos una familia de hilos que se vea a la primera en un
teléfono, en páginas así, que acompañe toda la bajada y que termine en algo: que la página se sienta hecha a mano
para ese negocio.

## Metas

- Tres relatos de página nuevos, que se eligen igual que `hilo`, `luz` e `impulso`.
- Se ven en un teléfono de 360 a 430 px, en una página de franjas pegadas, en toda la bajada.
- Nunca pasan por encima de un texto, una foto, una tarjeta o un botón.
- Con la página quieta no corre código: el dibujo lo lleva el navegador, atado al scroll.

## Lo que no se hace ahora

- Trazar el logo del negocio (necesitaría un modelo; decisión del 24-11: sin modelos).
- Un emblema fijo en una esquina que se va armando (tapa contenido en el teléfono).
- Lienzo (canvas) o código por cuadro.
- Cambiar el `hilo` de hoy: queda como está.
- Pedirle a La Mente que cambie los espacios de sus páginas: el hilo se acomoda a lo que hay.

## Qué sería un fracaso, aunque funcione

- Que en el teléfono no se note, como el Hilo de hoy.
- Que una línea cruce un título, un precio o una cara.
- Que la página se sienta más lenta al bajar.
- Que dos negocios del mismo rubro se vean idénticos.
- Que el hilo se pierda sobre una franja de su mismo color.

## Los tres hilos

| `relatoPagina` | Nombre | Qué hace |
|---|---|---|
| `rulos` | Hilo con rulos | El hilo baja serpenteando: va por la orilla de cada bloque, cruza al otro lado en el paso de un bloque al siguiente y, en cada cruce, hace un rulo |
| `hebras` | Hebras | Lo mismo y, al llegar a un bloque con tarjetas, se abre en varias hebras que bajan por los canales del bloque (sus orillas y entre columnas), dejan un nudo en cada tarjeta y se vuelven a juntar abajo |
| `figura` | Hilo que dibuja | Lo mismo que `hebras` y, al final de la página, el mismo hilo dibuja una figura del rubro (una taza, una tijera…) de un solo trazo |

Cada uno incluye al anterior: así «el más completo» es una sola elección.

### Por dónde pasa (para que se vea y no moleste)

1. **Por delante de los bloques, por lo libre.** El hilo va sobre los bloques (no por detrás como hoy), sin recibir
   toques (`pointer-events: none`), y solo por donde no hay contenido: el **relleno** de cada bloque. Queda por debajo
   de todo lo fijo o pegado de la página (la barra del encabezado, el visor de fotos, botones flotantes).
2. **Lo libre se mide contra el contenido, no contra el bloque.** De cada bloque se toma la caja de su contenido: la
   unión de sus textos, fotos, videos, tarjetas (`data-mk-parte`), botones y campos. Lo que queda entre esa caja y la
   orilla del bloque es por donde puede ir el hilo.
3. **Baja por la orilla** (a media distancia entre el borde de la página y el contenido, a lo más a 14 px del borde) y
   **cruza al otro lado en el paso de un bloque al siguiente**: la franja libre entre lo último de uno y lo primero
   del otro. Alterna el lado en cada bloque: es una serpentina.
4. **Rulos** en los cruces. Radio: lo que quepa en esa franja libre, de 8 a 18 px. Con menos de 24 px libres, cruza
   sin rulo.
5. **Puntadas: donde no cabe, pasa por debajo.** Si en un tramo no quedan 10 px libres (una foto de lado a lado), el
   hilo se mete bajo el bloque y sale donde vuelve a haber lugar: ese tramo no se dibuja, y se marca con un punto donde
   entra y otro donde sale. La luz salta de un punto al otro. Sin lugar, no hay línea sobre el contenido.
6. **Hebras** por los canales de un bloque con tarjetas: su orilla izquierda, los espacios entre columnas y su orilla
   derecha (columnas + 1; a lo más 5). Con una sola columna son dos hebras que abrazan el bloque. Un nudo (un punto de
   4 px de radio) junto a la esquina de cada tarjeta que toca el canal. Las tarjetas son los elementos con
   `data-mk-parte="tarjeta"`; un bloque con menos de 2 tarjetas, o cuyas tarjetas van en una tira que se desliza
   (`carrete`), no abre el hilo. Un canal con menos de 10 px no lleva hebra.
7. **Color que siempre se ve.** El hilo es del acento del estilo (`--mk-acento`), 3 px de grosor, opacidad .8. Sobre
   un bloque cuyo fondo se parece al acento (contraste menor que 1,6 a 1), ese tramo toma el color del texto de ese
   bloque.
8. **La figura** se dibuja en un **remate**: una franja propia al final de la página, dentro de ella y después del
   último bloque (140 px de alto, decorativa, `aria-hidden`), que solo existe con `figura`. El hilo llega al remate y
   sigue de corrido con el trazo de la figura.
9. Una **luz** viaja por la punta del hilo; al abrirse, una luz por hebra; al juntarse, vuelve a ser una.

### La figura

- Un set propio de **diez figuras de un solo trazo** (un camino SVG continuo en una caja de 100 × 100), una por rubro de
  `RubroId`: cafetería (taza), hamburguesería (hamburguesa), restaurante (un plato servido bajo su campana), barbería (el poste),
  peluquería (tijera), veterinaria (huella), gimnasio (pesa), academia (lápiz), tienda (bolsa), consulta (corazón).
  Más una genérica (estrella) para cuando no se dice cuál.
- Campo nuevo y opcional de la receta de página: `figura` (el id de la figura). Se exporta `figuraDeRubro(rubro)`.
  La Mente conoce el rubro y elige; motion-kit no adivina.
- Dos negocios del mismo rubro no salen iguales: la **semilla** decide por qué lado parte el hilo, el sentido y tamaño
  de los rulos, y el giro de la figura (±8°). Llega por un campo nuevo y opcional de la receta, `semilla` (el `slug` del
  negocio), que `PaginaRelato` recibe como prop. Sin semilla, una fija.

## Cómo se hace

### Caminos considerados

1. **Un trazado medido, dibujado por el navegador (elegido).** Al montar (y cuando cambia el tamaño) se miden los
   bloques y su contenido, y una función pura arma los caminos SVG. Cada tramo se dibuja con `stroke-dashoffset` atado
   al scroll, con su propio tramo del scroll (`animation-range`). Después de medir no corre código.
2. **Lienzo que se redibuja al bajar.** Más libertad (grosor que cambia, textura), pero código en cada cuadro del
   scroll y más batería. Descartado: rompe «el dibujo lo lleva el navegador».
3. **Adornos sueltos por bloque**, sin medir. Barato, pero no es un hilo: los tramos no se unen. Descartado.

### Piezas

- `src/relatos/hilos/trazar.ts` (puro, sin navegador):
  `trazarHilos(medidas, opciones) → Trazado`.
  - `medidas`: `{ ancho, alto, vista, recorrido, arriba, bloques: Bloque[] }` en px. `ancho` y `alto` son de la página;
    `vista` es el alto visible; `recorrido` es cuánto se puede bajar en total (el del contenedor que hace scroll, que
    puede tener cosas fuera de la página); `arriba` es dónde parte la página dentro de ese contenedor.
    `Bloque`: `{ caja: Caja; cosas: Caja[]; tarjetas: Caja[]; fondo: string; texto: string; tira: boolean }`
    (`cosas`: cada pieza de contenido fuera de las tarjetas; hace falta para saber qué hay justo sobre y bajo ellas).
  - `opciones`: `{ tipo: "rulos" | "hebras" | "figura", semilla: string, figura?: FiguraId, acento: string }`.
  - `Trazado`: `{ tramos: { d: string; desde: number; hasta: number; clase: "tronco" | "hebra" | "figura";
    color?: string }[]; nudos: { x: number; y: number; en: number; clase: "nudo" | "puntada" }[] }`. `desde`, `hasta` y
    `en` son porcentajes del scroll (0 a 100).
  - El tronco es una **cadena de tramos** (uno por bloque: el cruce con su rulo y la bajada), no un solo camino: así
    la punta del hilo va siempre a la altura de la vista, aunque un tramo tenga más largo por sus rulos.
  - Un punto de la página a la altura `y` se dibuja cuando pasa por el 60 % de la vista:
    `scroll = (arriba + y − 0,6 × vista) / recorrido`, acotado de 0 a 100. El último tramo (y la figura) termina en 100.
- `src/relatos/hilos/medir.ts`: saca `medidas` del DOM.
  - Bloques: los hijos directos de la página que no son decorado (el hilo, el cielo, la cinta, el remate), incluido
    el encabezado. Los que comparten fila (en pantalla ancha) cuentan como un solo bloque. Un bloque dentro de otro no
    cuenta aparte.
  - Se mide el lugar que el bloque ocupa en la página, no dónde lo tiene a medio camino su animación de entrada
    (`offsetTop` y `offsetLeft` acumulados; para el contenido, las cajas menos el `transform` del bloque).
  - Se vuelve a medir cuando cambia el tamaño de la página o de cualquier bloque (`ResizeObserver`): una foto que
    carga, un acordeón que se abre.
- `src/relatos/hilos/figuras.ts`: los once caminos y `figuraDeRubro`.
- `src/relatos/hilos/Hilos.tsx` (se baja aparte, como `Impulso`): mide, llama a `trazarHilos` y dibuja un `<svg>` del
  tamaño exacto de la página en px (sin estirar: los rulos quedan redondos), con un `<path pathLength="1">` por tramo,
  los nudos y las luces (una por tramo, visible solo en el tramo del scroll de ese tramo). Pasa `desde` y `hasta` como
  variables CSS de cada tramo.
- `PaginaRelato`: lo carga con `useAparte` cuando `relatoPagina` es uno de los tres; con `figura`, suma el remate.
  Prop nueva `semilla` y `figura`.
- CSS: lo dibuja `stroke-dashoffset` (1 → 0), las luces van con `offset-distance`, y nudos y luces aparecen con
  `opacity`. Todo con `animation-timeline: scroll(nearest)`. El hilo va con `z-index` 1 dentro de la página (que ya
  aísla sus capas con `isolation`).

### La regla de «solo `transform` y `opacity`»

Dibujar una línea no se puede con `transform`. El Hilo de hoy ya es la excepción (`stroke-dashoffset` y
`offset-distance`), y estos hilos usan lo mismo, nada más. Se anota como excepción en el catálogo. A cambio se mide,
en Chromium: bajando una página de 8 bloques con el procesador frenado 4 veces, no menos de 50 cuadros por segundo;
si no llega, se baja el número de hebras o se quitan las luces antes de cerrar.

### Niveles y navegadores

| Caso | Qué se ve |
|---|---|
| Completo, con animaciones atadas al scroll (Chrome, Safari 26) | Todo: el hilo se dibuja al bajar, con luces |
| Liviano, o un navegador sin animaciones atadas al scroll (Firefox, Safari anterior) | El hilo entero, ya dibujado y quieto, sin luces. Con `figura`, la figura dibujada |
| Quieto (movimiento reducido, ahorro) | Sin hilo. Con `figura`, solo la figura, dibujada y quieta, en su remate |

### Contrato y peso

- `contrato/pagina-motionkit.json` suma los tres ids a `relatoPagina` y los campos `figura` y `semilla`. Es un cambio
  que solo agrega: las páginas de hoy siguen valiendo. La Mente (backend) valida con ese contrato: hasta que lo
  actualice, rechazaría lo nuevo. Va con encargo y fila en `MAPA_CONEXIONES.md`.
- `validarPagina`: `figura` solo se acepta si es un id conocido; `semilla`, un texto de hasta 80 caracteres. Con otro
  `relatoPagina` se guardan pero no hacen nada.
- Peso: `motion-kit/pagina` no sube más de 0,3 KB al cargar (hoy 15,5 de 17). El archivo aparte de los hilos (medir,
  trazar, figuras y pieza): tope de 5 KB gzip. `estilos-pagina.css` suma el CSS nuevo (para quien usa
  `sinInyectarEstilos`).

## Cómo se comprueba

- `pruebas/hilos.test.ts` (lo puro): la cadena es continua (cada tramo parte donde termina el anterior, salvo en una
  puntada); las hebras de un bloque son `columnas + 1` (a lo más 5), parten del mismo punto y se juntan en el mismo
  punto; ningún punto de un tramo cae dentro del contenido ni de una tarjeta (con 2 px de holgura); donde no hay 10 px
  libres hay puntada y no línea; `desde ≤ hasta`, de 0 a 100, los tramos del tronco van en orden y el último termina
  en 100; un tramo sobre un fondo parecido al acento lleva otro color; misma semilla, mismo trazado, y otra semilla,
  otro; las once figuras son un solo trazo dentro de su caja; con medidas raras (sin bloques, un bloque más alto que la
  vista, bloques pegados sin relleno, ancho de 320 px, cosas fuera de la página en el mismo scroll) no falla.
- `scripts/verificar-hilos.mjs`, sobre una vitrina nueva que imita una página de La Mente (franjas de lado a lado,
  pegadas, de fondo alternado, una de acento, una foto de lado a lado, una grilla de tarjetas de 1 y de 2 columnas):
  a diez alturas de la bajada hay hilo dibujado a la vista (no menos de 120 px de trazo; lo dibujado se lee del
  `stroke-dashoffset` calculado de cada tramo); el hilo avanza al bajar y no retrocede; en el bloque de tarjetas hay
  más de un tramo dibujándose a la vez y después uno solo; al final, la figura está completa; ningún punto de un tramo
  cae sobre un texto, una foto o una tarjeta (los puntos se sacan con `getPointAtLength`); sobre la franja de acento
  el tramo se distingue del fondo; en liviano está entero y quieto; en quieto no hay hilo (y con `figura`, sí la
  figura); con la página quieta no se pide ningún cuadro (contando los `requestAnimationFrame`, como en las otras
  pruebas); a 360 px nada se sale de lado; si un bloque cambia de alto, el hilo se vuelve a trazar.
- Los cuadros por segundo se miden solo en Chromium. La pasada por el motor de Safari no es semáforo (como dice
  `CLAUDE.md`): sirve para buscar diferencias.
- Capturas a 390 px a media bajada antes de darlo por bueno.

## Lo que queda a quien lo construye

Los caminos exactos de las figuras; las curvas de los rulos y de los cruces; el orden de dibujo de los nudos; los
nombres de clases; cómo se reparte el archivo aparte; qué elementos cuentan como contenido al medir (la lista de arriba
es el piso).

## Cómo quedó (25-11-2026)

- El archivo aparte mide 7,7 KB gzip, no 5; y al cargar, `pagina` sube 0,7 KB (no 0,3) y `motion-kit` queda en 80,2 KB,
  sobre su tope de 80. Los topes los decide Aquiles.
- Un bloque con una foto de fondo (imagen por CSS) cuenta como sin lugar, igual que uno con algo pegado al bajar.
- Las hebras y el cruce que sigue se reparten el espacio bajo las tarjetas cuando el bloque de abajo no trae relleno.
- La llegada a la figura es un tramo del hilo aparte de la figura: en quieto queda la figura sola.
- Revisión final (Opus): el final (llegada y figura) va con tiempo cuando el remate se ve, no con el scroll (con el
  scroll quedaba bajo la pantalla); los bloques que se montan más de la mitad se juntan; el color cae a `--lm-acento`;
  en una vista previa achicada sin scroll propio el hilo va entero y quieto; se mide lo que entra con `data-entrada`,
  se vuelve a medir si los bloques cambian de orden, y varios cambios seguidos se miden una vez. La medición es «en
  su lugar» de otra forma que la escrita arriba: se quitan los corrimientos con un atributo mientras se mide.
- El encabezado no lleva hilo: parte en el paso al segundo bloque.
- Un bloque con algo pegado al bajar (`sticky`: los relatos «pila», «cuento», «carrete» y «subtítulos») cuenta como sin lugar.
- La punta del hilo va entre el 40 y el 70 % de la vista, no clavada en el 60 %.
- Las esquinas doblan y cada hebra va por su propia línea.

## Decisiones mías, a corregir

1. Los nombres: «Hilo con rulos», «Hebras», «Hilo que dibuja» (`rulos`, `hebras`, `figura`).
2. El hilo va por delante de los bloques, por su relleno, y por debajo de lo fijo.
3. Donde no cabe, pasa por debajo y sale más allá (puntadas), en vez de pedir más espacio a la página.
4. Sobre una franja de acento, el tramo toma el color del texto de esa franja.
5. El remate de 140 px al final de la página con `figura`.
6. La figura se elige con un campo `figura` (La Mente la saca del rubro), con una estrella por defecto; y la variación
   entre negocios llega por un campo `semilla`.
7. Tope de 5 KB para el archivo aparte; `pagina` no sube su tope.
