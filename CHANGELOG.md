# Cambios

## Sin publicar (en `dev`, después de 0.5.0)

### Rastro: huellas por el recorrido

- **`relatoPagina: "rastro"`**: sin línea, huellas que aparecen una tras otra por el recorrido del hilo, alternando el
  lado y mirando hacia donde van. La forma sale de `figura` (patitas, granos de café, sésamo, puntadas, corazones,
  pisadas, estrellitas). Nunca sobre el contenido: donde hay poco lugar se achican y donde no cabe, no van. Solo
  `opacity` y `scale`. El contrato de página suma `rastro` a `relatoPagina` (solo agrega).
- Pruebas: `pruebas/rastro.test.ts` y la parte `rastro` de `scripts/verificar-hilos.mjs`, también con el motor de Safari.

## 0.5.0 (25-11-2026)

Una sola luz para la página (`motion-kit/luz`), cuatro momentos que se manejan con el dedo, tres hilos nuevos para la
página (con el material de cada estilo) y el encabezado listo para moverse con una partitura. El contrato de página
suma valores (los hilos, `figura` y `semilla`); el del encabezado y el de la partitura no cambian. **Cambia cómo se
ven** los botones con forma (el arreglo de abajo). El tope de la entrada principal sube a 90 KB.

### Luz y materia: una sola luz para la página

- **Entrada nueva `motion-kit/luz`** (y `motion-kit/estilos-luz.css`): `Luz` (la luz de la página: la mueven el
  cursor, el dedo, el scroll, la inclinación del teléfono o la hora del reloj), `Materia` (superficies de papel, mate,
  vidrio, metal y holográfico, con su altura), `TarjetaHolografica`, `TituloConVolumen` y `usePermisoInclinacion`.
- **Dentro de una `Luz`,** lo que ya existía mejora solo: las tarjetas y los botones dejan su sombra hacia el lado
  contrario de la luz y los botones se hunden hacia ella; el libro sombrea la hoja que gira; el carrusel oscurece las
  fichas que le dan la espalda a la luz y deja sombra y reflejo en el piso. Fuera de una `Luz` nada cambia.
- Regla de la casa cumplida: solo se corren y se funden capas ya dibujadas; con la página quieta no se pide ningún
  cuadro; con «reducir movimiento» la luz queda fija.
- Pesos (gzip): `luz` 6,6 KB al cargar (tope 8, fijado por Aquiles). El tope de `momentos` pasa de 13 a 17 (lo fijó
  Aquiles para la tanda que sigue, «Con el dedo»; hoy mide 12,9). Las demás entradas no suben al cargar
  (`motion-kit` 79,4 de 80 por el arreglo de abajo); el libro y el carrusel, que se bajan aparte, suman 0,8 KB entre
  los dos; `estilos-momentos.css` pasa de 8,3 a 8,9 KB.
- Pruebas: `pruebas/luz.test.ts` y `scripts/verificar-luz.mjs` (55 revisiones), también con el motor de Safari.
- Con el scroll, cada superficie se ilumina según por dónde va en la pantalla (lo lleva el navegador, sin código,
  donde hay animaciones atadas al scroll).

### El encabezado dentro de una partitura

- **`Encabezado` marca sus partes** con `data-mk-parte` (`antetitulo`, `titulo`, `bajada`, `botones`, `media`,
  `contenido`): una partitura (`ConPartitura`) las encuentra sin pasarle un mapa.
- **`sinEntrada`** (prop nueva de `Encabezado`): sin la entrada del encabezado ni el efecto de su título, para cuando
  los mueve una partitura. `TextoCinetico` gana `cuando="nunca"`.
- Sin `sinEntrada`, nada cambia. Detalle en «El encabezado dentro de una partitura» de `docs/CATALOGO.md`.

### Hilos: tres relatos de página nuevos

- **`relatoPagina: "rulos" | "hebras" | "figura"`**: un hilo que va por delante de los bloques, por lo libre de cada
  uno. Serpentea con un rulo en cada cruce; con `hebras` se abre donde hay tarjetas, deja un nudo en cada una y se
  junta; con `figura`, al final dibuja una figura del rubro de un solo trazo.
- **Campos nuevos en la receta de página** (y props de `PaginaRelato`): `figura` (once figuras; `figuraDeRubro` dice
  cuál le toca a cada rubro) y `semilla` (el slug del negocio). El contrato de página los suma: solo agrega.
- Nunca pasa sobre un texto, una foto, una tarjeta o un botón; donde no cabe, pasa por debajo. Sobre un fondo del
  color del acento cambia de color. El final (la figura) se dibuja con tiempo cuando se ve. En una página sin el
  estilo del kit toma `--lm-acento`; en una vista previa achicada sin scroll propio va entero y quieto. El Hilo de
  siempre no cambia.
- **El hilo de cada estilo:** tubo de luz (neón), lana (retro), cable (rock), cinta (anime), rieles (película).
- Lo dibuja el navegador, atado al scroll; se baja aparte (9,9 KB gzip). El tope de la entrada principal `motion-kit` sube de 80 a 90 KB
  (lo fijó Aquiles; hoy mide 80,3). Detalle en «Hilos» de `docs/CATALOGO.md`.
- Pruebas: `pruebas/hilos.test.ts` y `scripts/verificar-hilos.mjs` (53 revisiones), también con el motor de Safari.
  Vitrina `#hilos`.

### Con el dedo: cuatro momentos que se manejan como objetos

- **Cuatro piezas nuevas en `motion-kit/momentos`** (cada una se baja aparte): `CuponQueSeArranca` (una franja con
  dientes que se arranca y deja el código), `StickerQueSeDespega` (se dobla por donde va el dedo y deja ver lo de
  abajo), `SellosConTimbre` (los sellos nuevos se timbran al verse; cada marca es distinta) y `RuletaDePremios` (se
  lanza con el dedo, gira con peso y se detiene en el premio que le digan).
- **La ruleta no decide quién gana:** recibe `resultado` o lo pide con `alGirar` (puede ser una promesa). Nunca frena
  de golpe ni retrocede. Si la consulta falla, frena sola y avisa con `null`.
- Todas tienen su botón para quien no arrastra, anuncian lo que queda a la vista y, en quieto, lo muestran de
  inmediato. Solo se mueven `rotate`, `translate`, `scale` y `opacity`.
- El scroll manda: el dedo que sube o baja sobre la ruleta mueve la página y no gasta la vuelta. Los índices de la
  ruleta son los de la lista que se pasa, aunque traiga premios vacíos.
- Pesos (gzip): cupón 4,0 KB, sticker 3,8, sellos con timbre 3,1, ruleta 5,7 (aparte). `momentos` al cargar: 13,1 KB
  (tope 17). `estilos-momentos.css` pasa de 8,9 a 11,3 KB.
- Pruebas: `pruebas/momentos4.test.ts`, `pruebas/momentos4-dibujo.test.ts` y `scripts/verificar-momentos4.mjs` (69
  revisiones), también con el motor de
  Safari. Detalle en «Con el dedo» de `docs/CATALOGO.md`.

### Arreglos

- **Las formas de `Boton` nunca se aplicaban** (`recto`, `tecla`, `ticket`, `sello`, `pixel`, `subrayado`,
  `circulo`): su selector perdía una barra en el código y el navegador botaba las reglas; todos salían como pastilla,
  desde el 23-11-2026 hasta la 0.4.0. Corregido. **Cambia cómo se ven** los botones con forma y los paquetes que las
  usan: ahora se ven como se diseñaron.
- Vitrina del Director: el ejemplo «Paralaje» no dejaba ver el efecto (capas lisas, poco recorrido y la profundidad
  al revés). Ahora es un amanecer por capas.

### Conocido, sin resolver

- En el motor de Safari de las pruebas, el libro en dos páginas deja en blanco la página derecha (con luz y sin luz;
  es anterior a esta tanda). Falta mirarlo en un Safari de verdad. Ver «Safari» en `docs/CATALOGO.md`.

## 0.4.0 (24-11-2026)

El Director (el motor de animación propio) con la Partitura versión 1 y su lenguaje en español, la foto profunda, los
efectos vistosos, la segunda tanda de momentos y los fondos vivos de lienzo. Los contratos del encabezado y de la
página no cambian de versión (solo suman valores); se suma un tercero, `contrato/partitura-motionkit.json`.

Lo que puede cambiar para quien venía de la 0.3.0: con cinco fondos más, «Sorpréndeme» puede dar otro encabezado con
la misma semilla. Nada más cambia de lo que ya existía.

### Director, fase 2: el lenguaje en español, Partitura versión 1 e inclinación en 3D

- **Entrada nueva `motion-kit/partitura`** (para quien crea; no viaja a las páginas): `leerPartitura(texto)` y
  `escribirPartitura(partitura)` (el lenguaje en español), `subirPartitura` (de la versión 0 a la 1), `CASA` (16
  partituras de la casa) y `sorprender(semilla, partes)`.
- **Partitura versión 1.** `Cambio` suma `inclinaX` e `inclinaY` (grados; la profundidad, 900 px, la pone el
  Director). Lo que sigue al puntero o a la velocidad lleva su cambio en `a`. `reparto` en lo atado al scroll. En lo
  continuo un paso gira o se inclina, no las dos. **Cambio que rompe respecto de la versión 0** (que era
  experimental): el Director corre solo la 1; una versión 0 se sube antes con `subirPartitura`.
- **Contrato `partitura-motionkit.json`, versión 1:** ya no dice experimental y trae los números de las curvas y los
  resortes, la profundidad y las fórmulas de los tramos de scroll.
- Cada animación del Director lleva nombre (`id`: `mk-verse`, `mk-estado`, `mk-vista`, `mk-scroll`).
- **No se reemplazó ninguna pieza:** medido, los efectos de texto pesan 3,4 KB y el Director 9.
- Vitrina `#director`: cada ejemplo se edita en español o como dato; «De la casa» (con el título con volumen y la
  tarjeta holográfica) y «Sorpréndeme».
- Pruebas: `pruebas/director2.test.ts` (20), `pruebas/partitura-texto.test.ts` (19) y las partes `inclina` y `casa`
  de `verificar-director` (110 revisiones en total), que ahora pasa entero también en Safari/WebKit.
- Pesos al cargar (gzip): `director` 9,8 KB (9.814 bytes; tope 10) y `partitura` 8,1 KB (8.133 bytes; tope 9,
  fijado por Aquiles).
- **De la revisión final:** un texto cortado por palabra lleva cada palabra en su caja (sin ella la inclinación se
  veía plana); la profundidad no se le borra a una página que puso la suya; el lector no se vuelve lento con
  separadores de línea raros, lee los porcentajes sin ruido de decimales, entiende una escena sin dos puntos y no le
  cambia las tildes al nombre de un actor; `subirPartitura` no pierde una `a` que ya venía; `escribirPartitura` exige
  una partitura que vale; el contrato suma `inclinacion`, `porDefecto`, `seguir` y casos calculados, y ya no dice que
  una versión 0 se sube sola.
- **Arreglo de la fase 1:** apuntar muchas veces algo con `estado` ya no gasta el tope de animaciones.
- **Límite conocido:** la profundidad va en el padre de lo que se inclina (en lo continuo y en `estado`); mientras
  está puesta, un hijo `position: fixed` de ese padre se ubica respecto de él. Ver «Director, fase 2» en el catálogo.

### Safari: sondeo de todas las pruebas y un arreglo en la galería

- **Arreglo:** en la galería (`MosaicoQueSeArma` con `viva` o `visor`), arrastrar sobre una foto ya no inicia el
  «arrastrar imagen» del navegador. En Safari eso se tragaba el toque siguiente y el visor no abría.
- `scripts/en-safari.mjs <prueba> [parte]`: corre una prueba visual con el motor de Safari (WebKit), sin tocarla.
- Resultado del sondeo (las quince pruebas, una vez) en `docs/CATALOGO.md`, sección «Safari». Lo demás que apareció
  no eran errores, o es el comportamiento previsto donde no hay animaciones atadas al scroll (Safari antes de la 26).
- Vitrina `#profundidad`: se quitó la herramienta «Prueba con tu foto», que bajaba un modelo de internet (decisión de
  Aquiles del 24-11: por ahora, sin modelos de IA).

### Efectos vistosos: fuegos artificiales, carrusel giratorio y libro que se abre

- **Tres piezas nuevas en `motion-kit/momentos`**, que se bajan aparte y aceptan `respaldo`:
  - `FuegosArtificiales` (`semilla`, `rafagas?`, `alTerminar?`): ráfagas de chispas en un lienzo que cubre a su
    contenedor; dura unos 3 segundos y se quita sola.
  - `CarruselGiratorio` (`fichas`, `etiqueta?`): fichas con foto en un anillo que gira con el dedo, con impulso, y se
    detiene justo en una; botones y flechas del teclado. En liviano o quieto, una fila que desliza el navegador.
  - `LibroQueSeAbre` (`tapa`, `hojas`): la carta de precios como un libro; dos páginas en pantalla ancha y una en el
    teléfono. En liviano o quieto, la carta plana.
- **`SorteoRaspe` suma `celebracion?: "confeti" | "fuegos"`** (por defecto `confeti`, como antes). Los fuegos se bajan
  solo si se piden.
- Fichas y líneas aceptan `agotado`. Una carta larga se parte en hojas de 10 líneas (hasta 16 hojas).
- **Revisión final (24-11), arreglada entera** (5 importantes y 10 menores): el libro dibuja en 3D solo las hojas
  cercanas (memoria en teléfonos) y lleva el texto completo aparte para lectores; los fuegos usan un color festivo si
  el del tema no tiene color; en el carrusel, un arrastre con el dedo ya no se traga el Enter que sigue, una foto
  corregida vuelve a verse, y el foco espera en el carrusel mientras gira; los botones del libro no se corren; las
  pruebas de «nada se sale de lado» ahora miden de verdad.
- Vitrina `#momentos`, sección «Efectos vistosos». Prueba nueva `scripts/verificar-momentos3.mjs` (66 revisiones,
  también en Safari/WebKit) y `pruebas/momentos3.test.ts` (18).
- Pesos al cargar (gzip): `momentos` 12,9 KB (tope 13); las demás entradas no cambian. Aparte: fuegos 2,4 KB, libro 4,3
  y carrusel 5,2.

### Foto profunda: profundidad real en la foto del encabezado

- **Receta del encabezado (v2, sin versión nueva): campo `fotoProfunda`.** Solo en las composiciones con foto. Si la
  receta trae también `fotoViva` o `tomas`, queda apagada, con aviso. El contrato está regenerado: La Mente tiene que
  copiarlo antes de que el Estudio mande ese campo.
- **`Encabezado` suma las props `fotoProfunda` y `mapasFotos`** (la dirección del mapa de profundidad de cada foto de
  `imagenes`, en el mismo orden; se usa el de la primera). Los mapas no van en la receta: los pasa quien arma la página.
- **El efecto** (se baja aparte, unos 4,5 KB; WebGL a mano): lo que está cerca se mueve distinto de lo que está lejos, con el
  cursor, con el paso del encabezado por la pantalla y con la inclinación del teléfono. Solo en nivel completo; dibuja
  solo mientras algo cambia. Si no hay WebGL, si la foto o el mapa no cargan o no dan permiso (CORS), o si se pierde
  el contexto, queda la foto normal.
- **El mapa** es una imagen en grises, más claro es más cerca (se recomienda 256 px de ancho: pesa de 2 a 5 KB; tiene que tener la proporción de la foto). Se
  calcula una vez por foto con un modelo abierto (Depth Anything V2 Small, Apache-2.0). **El modelo no es parte del
  paquete:** corre donde se sube la foto.
- Vitrina `#profundidad`: tres fotos de ejemplo con su mapa (`demo/fotos/`, licencia libre). La herramienta para
  soltar una foto propia (bajaba un modelo de internet) se quitó el 24-11: por decisión de Aquiles todavía no se usan
  modelos de IA. El efecto queda en el kit, dormido hasta que haya de dónde sacar los mapas.
- **Revisión final (24-11), arreglada entera:**
  - La foto de abajo va acercada el mismo 6 % que el lienzo mientras el efecto esté pedido (`data-foto-profunda` en la
    caja de la foto): antes, al aparecer o al irse el lienzo, la foto saltaba.
  - Una foto enorme se sube achicada (lado mayor de 1600 px) y el sombreador pide precisión alta: menos memoria y más
    nitidez en teléfonos.
  - Si la caché del navegador devuelve la foto sin permiso CORS, se pide de nuevo saltándose la caché. Eso ahora vive
    en `src/fotos/imagen.ts`, que comparten la foto profunda y las fotos vivas.
  - La inclinación del teléfono va de a un grado y con holgura: el temblor de la mano ya no despierta al efecto. Con
    el teléfono acostado no se usa, y al girarlo parte de cero.
  - Con la entrada `zoom`, el lienzo espera a que la foto termine de entrar.
  - Un mapa con otra proporción que la foto (más de un 4 %) no se usa. La receta apaga `fotoProfunda` si no hay
    ninguna foto, con aviso. El mapa se suaviza según el ancho del lienzo (de 64 a 160 puntos). El movimiento va igual
    de rápido en pantallas de 60 y de 120 cuadros por segundo. En una composición sin foto, la pieza no se baja.
  - Vitrina: la revisión del modelo quedó fija, y si el modelo no baja se puede reintentar.
- Prueba: parte `profunda` de `scripts/verificar-fotos.mjs` (34 revisiones) y `pruebas/profunda.test.ts` (12).
- Pesos al cargar (gzip): principal 79,3 KB (tope 80), encabezado 34,0 (35), página 15,5 (17), momentos 12,6 (13),
  escena 14,4 (16), receta 9,7 (10) y director 9,1 (10). El efecto, aparte: 3,8 KB más 0,8 KB de lo compartido.

### Director: el motor de animación propio, fase 1 (versión 0, experimental)

- **Entrada nueva `motion-kit/director`** (9,1 KB gzip al cargar, tope 10; lo que sigue al cursor o a la velocidad
  son 1,5 KB más, que se bajan aparte solo si la partitura lo usa). No se exporta desde la entrada principal.
- **Un movimiento es un dato.** Una **partitura** dice quién se mueve (actores: partes de la página con
  `data-mk-parte`), con qué señal (`verse`, `estado`, `vista`, `scroll`, `puntero`, `velocidad`), qué cambia (solo `x`,
  `y`, `escala`, `giro` y `opacidad`) y cuándo (`en`, `luego`, `junto`, `cada`). No es código: no tiene ciclos,
  funciones ni selectores, y trae topes.
- **`montar(raiz, partitura, opciones)`** la hace correr con lo que el navegador ya trae: animaciones nativas para el
  tiempo, líneas de tiempo de scroll nativas (o un respaldo que da lo mismo) y un solo bucle, que duerme, para lo que
  sigue al cursor o a la velocidad. Para React: **`ConPartitura`** y `usePartitura`.
- **Las reglas de la casa van en el motor:** con movimiento reducido no hay animaciones; fuera de la vista o con la
  pestaña oculta todo se detiene; lo que se aprieta no se mueve bajo el cursor ni bajo el foco; al terminar y al
  desmontar no queda nada vivo; el texto que corta (palabras o letras) se lee igual con lector de pantalla y vuelve a
  su forma original, también si React lo cambia a medio camino.
- `validarPartitura` (mensajes en español, con el campo) y el contrato `contrato/partitura-motionkit.json`
  (**versión 0, experimental: La Mente todavía no lo copia**). Las seis partituras de ejemplo están en
  `src/director/partituras.ts` y en la vitrina; todavía no viajan en el paquete.
- **Topes pensados para partituras que guarda un usuario:** el estado final de una entrada no puede esconder nada ni
  sacarlo de su lugar; una partitura arma a lo más 600 animaciones y 100 elementos que siguen; `ConPartitura` recorta en
  los dos sentidos, para que una parte agrandada o corrida no tape el resto de la página.
- Vitrina `#director`: cada ejemplo se ve, se repite y su dato se edita ahí mismo.
- Pruebas: `pruebas/director.test.ts` (34) y `scripts/verificar-director.mjs`, una prueba genérica que revisa las
  reglas de la casa en cualquier partitura (57 revisiones sobre los seis ejemplos, más señales, React, navegador
  incompleto, partituras rotas u hostiles y lo que encontró la revisión final: 86 en total).
- **Revisión final de la fase** (2 críticos, 7 importantes y 14 menores): resueltos los 2 críticos, los 7 importantes y
  11 menores, cada uno con su prueba. Lo más importante: un enlace con el foco o el cursor encima nunca queda escondido;
  una sección mucho más alta que la pantalla igual parte; el texto cortado vuelve a estar entero cuando termina la
  entrada; un actor con transformación propia en el CSS no salta de lugar; al rearmar no se repite lo que ya pasó.

Segunda tanda de momentos (los bloques que faltaban) y cinco fondos vivos de lienzo.

### Momentos, segunda tanda

- **Nueve piezas nuevas en `motion-kit/momentos`**, todas se bajan aparte y aceptan `respaldo` (lo que se ve mientras
  llega su archivo, y si no llega): `FechasQueVienen` (calendario), `ClasesDeHoy`, `NovedadesQueLlegan`,
  `EnlacesDomino`, `EpisodiosOnda`, `SeccionesVivas`, `AvisoQueSeDespliega`, `CintaConImpulso` y `LlamadoConVida`.
- **`LlamadoConVida`** es para los seis bloques que son solo un botón a otra página: una escena chica en SVG por
  bloque (`agenda`, `pedidos`, `buzon`, `cotizaciones`, `encuestas`, `contacto`). Es decoración: no recibe toques ni la
  lee el lector de pantalla.
- Reglas de siempre: el texto real se lee desde el primer cuadro, los enlaces y botones no se mueven al apuntarles ni
  al apretarlos, tres niveles, y los datos raros (listas vacías, fechas malas, enlaces inseguros) no rompen nada.
- **Tope de `momentos`: de 12 a 13 KB** (mide 12,6; lo que suma son los nueve cargadores). Aquiles aprobó hasta 14
  como máximo el 24-11; se subió solo lo necesario.
- Prueba nueva: `scripts/verificar-momentos2.mjs [url] [parte]`. Su parte `cierre` revisa que al salir no queden
  bucles, oyentes ni observadores, que a 360 px nada se salga y que todo el texto se lea antes de bajar.

### Fondos vivos de lienzo

- **Receta del encabezado (v2, sin versión nueva):** `efecto` suma `bandada`, `luciernagas`, `corrientes`, `gotas` y
  `relieve`. El contrato está regenerado: La Mente tiene que copiarlo antes de que el Estudio mande esos valores.
- Los cinco siguen al dedo o al cursor, corren a 30 dibujos por segundo, se detienen fuera de la vista y con la
  pestaña oculta, y con movimiento reducido o en nivel liviano dejan un solo cuadro quieto. Sin azar: todo sale de una
  semilla.
- `src/efectos/fondos/fondo.ts` (`montarFondo`) junta lo común; `cantidadFondo` en `src/efectos/lienzo.ts`.
- `scripts/verificar-dedo.mjs` suma la parte `fondos`, y los cinco entran a `limpieza`, `sinlienzo` y `angosto`.

### Arreglos

- **Título del encabezado (`TextoCinetico`): los efectos por palabra no movían nada.** «Revelar» (el que viene por
  defecto), «impacto» y «trailer» animan cada palabra con una transformación, pero cada palabra era un elemento en
  línea, y el navegador no transforma elementos en línea. Estaba así desde el primer commit. Ahora cada palabra es un
  bloque en línea: **el título sí entra palabra por palabra.** De paso, en «revelar» la palabra parte más abajo, para
  que no asome la tilde de una Ñ. Lo destapó la prueba de la fase 0 del motor de animación, al comparar parte por
  parte en instantes fijos. Prueba nueva en `scripts/verificar-estilos.mjs`.
- **Momentos (base):** la medición de fluidez seguía pidiendo cuadros 4 segundos con «reducir movimiento» activado.
  Ahora se corta cuando ya nadie espera el resultado.
- **Momentos (base):** el observador común de los momentos quedaba vivo al salir de la página, aunque ya no miraba
  nada. Ahora se suelta.
- `descifrar`, `cuadroDescifrar` y `duracionDescifrar` aceptan un tope de duración opcional (el aviso usa 800 ms).
- **Enlaces (`esEnlaceSeguro`):** un `javascript:` disfrazado con saltos de línea, tabuladores o caracteres de control
  («java\nscript:») pasaba por ruta de la misma página. Ahora se mira lo que va a ver el navegador. También se
  rechazan las dos barras invertidas al comienzo.
- **Emoji compuestos:** el título (`TextoCinetico`) y el aviso partían por código una bandera 🇨🇱, un ❤️ o una familia,
  y quedaban rotos. Ahora se parte por letra visible (`Intl.Segmenter`; `src/utils/grafemas.ts`).
- **Revisión final de esta tanda** (1 crítico, 5 importantes y 15 menores, todos resueltos):
  - el texto del aviso va para lectores en un span aparte (un `aria-label` sobre un párrafo no se lee);
  - los enlaces del dominó y las tarjetas de novedades ahora sí se detienen bajo el cursor (la regla anterior perdía
    por especificidad), con pausa y no quitando la animación;
  - la cinta suma copias del lema hasta cubrir el bloque (con un lema corto asomaba un hueco) y tiene respaldo de
    recorte para Safari antes de la 16;
  - «cerrado» en el calendario va tachado con una raya que se dibuja;
  - «Hoy», «Mañana» y «Próxima» se ponen al día si la página queda abierta (`src/momentos/reloj.ts`);
  - cada reproductor de episodio lleva su nombre para lectores, y la onda funciona sin `IntersectionObserver`;
  - el sobre del buzón queda abierto también en liviano y con movimiento reducido, y el punto de «pedidos abierto»
    aparece antes de latir;
  - las secciones ya no ponen `id` (los pone quien arma la página) ni aceptan tipos como «constructor»;
  - «corrientes» dibuja la estela de nuevo en cada cuadro (antes iba borrando y dejaba un velo con el tiempo); las
    luciérnagas serpentean en vez de girar en círculo; la bandada y las luciérnagas reponen lo que sacaron al volver
    de la versión quieta;
  - una palabra más ancha que la franja del aviso se parte; una fecha sin hora en los episodios ya no se corre un día.
- **Regla precisa de los fotogramas** (aislada con un experimento): lo que hace caer la pestaña en Chromium es la
  propiedad `scale` suelta con `calc()` dentro de un `@keyframes`. `transform: scale(…)`, `translate` y `rotate` con
  variables no fallan. Hay una prueba unitaria que lo vigila en todo `src/`.
- Pesos al cargar (gzip): principal 79,1 KB (tope 80), encabezado 33,7 (35), página 15,4 (17), momentos 12,6 (13),
  escena 14,4 (16) y receta 9,6 (10).

## 0.3.0 (24-11-2026)

Receta del encabezado v2, relatos y receta de página, momentos por bloque, fotos vivas y dedo y física. La Mente
copia los contratos de esta etiqueta (`contrato/*.json`).

### Dedo y física (nueve efectos)

- **Receta del encabezado (v2, sin versión nueva):** campos `iman` y `colgante` (este solo con la composición
  `letrero`; con otra queda apagado y avisa); `efectoTexto` suma `descifrar`; `efecto` suma `granos`, `tijeras`,
  `huellas`, `pesas`, `lapices` y `constelacion`; `shader` suma `lava`. `Encabezado` suma las props `iman` y `colgante`.
- **Receta de página (v1, sin versión nueva):** `relato` suma `pila`, `relatoPagina` suma `impulso` y hay un campo
  nuevo, `estela`. `PaginaRelato` suma la prop `estela`. Los dos contratos están regenerados.
- **Cartas apiladas**, **texto que se descifra**, **letras con imán**, **letrero colgante**, **inclinación por
  velocidad**, **objetos del rubro que caen** (con física propia), **constelación**, **lámpara de lava** y **estela y
  chispas**. Todos se bajan aparte y solo corren en nivel completo; en liviano o con movimiento reducido quedan
  quietos o no se montan.
- Para sitios con CSP, el CSS de lo nuevo viaja en `estilos-encabezado.css` y `estilos-pagina.css`.
- Prueba nueva: `scripts/verificar-dedo.mjs [url] [parte]`. Su parte `limpieza` revisa que al salir no queden bucles,
  oyentes ni lienzos.
- Pesos al cargar (gzip): principal 78,8 KB, encabezado 33,4, página 15,4, momentos 11,9, escena 14,4 y receta 9,5.
  Ningún tope cambió.

### Arreglos

- **Shaders (`ShaderFondo`):** al volver a montarse (al cambiar de shader, o siempre en el modo estricto de React en
  desarrollo) el fondo quedaba de un color parejo, porque el programa nuevo no recibía el tamaño del lienzo.
- **Shaders:** piden precisión alta cuando el teléfono la tiene. Con la media, en muchos teléfonos el fondo se veía
  trabado al poco rato.
- **Peso:** `motion-kit/pagina` ya no carga el componente `Estilo` solo por leer su contexto (queda en 15,4 KB aun
  con lo nuevo; antes medía 16,6).
- **Revisión final de «dedo y física»** (2 críticos, 4 importantes y 11 menores, todos resueltos): las cartas apiladas
  ya no saltan al hacer clic con el mouse (se despegan solo con el foco del teclado); apretar un botón del letrero
  colgante no lo balancea, y el letrero queda quieto con el cursor encima; el scroll lo ladea con tope y solo si se ve;
  el imán deja de calcular con el cursor quieto, mueve letras también en los títulos por palabra y mide de nuevo al
  despertar; un título que cambia a mitad del descifrado queda con el texto nuevo; las chispas salen con un toque y no
  al empezar a bajar; la constelación dibuja a 30 por segundo; los lienzos sueltan su memoria al salir.
- **Pruebas:** la medida de «sin scroll horizontal» a 360 px estaba ciega en modo teléfono (restaba `innerWidth`, que
  crece junto con lo que se sale) en `verificar-efectos`, `-encabezados`, `-estilos` y `-piezas`. Ahora mide contra el
  ancho fijo del teléfono.

### Fotos vivas

- **Receta v2: campo nuevo `fotoViva`** (y en el contrato). Solo en las composiciones con foto; no cuenta como
  protagonista. `Encabezado` suma las props `fotoViva` y `origenesFotos`.
- **Foto viva del encabezado** (WebGL a mano, se baja aparte): la foto se arma desde partículas al entrar (una vez por
  carga, y no si hay apertura), ondula bajo el dedo o el cursor y, con varias tomas, cambia con un borde líquido.
  Respeta el tratamiento de foto y la profundidad. Solo en nivel completo.
- **Galería (`MosaicoQueSeArma`)**: `viva` (la foto que se toca ondula, con un solo lienzo que pasa de foto en foto) y
  `visor` (un toque abre la foto, que crece hasta llenar la pantalla; diálogo con Anterior, Siguiente y Cerrar, flechas,
  Escape y gestos). Los gestos, el motor y el visor se bajan aparte con el primer toque.
- **Fotos de otros sitios:** el motor solo pide la textura al mismo sitio, a `data:`/`blob:` y a los orígenes de
  `origenesFotos`; si el servidor no da permiso CORS, queda la foto normal. A lo más dos lienzos WebGL por página.
- Prueba nueva: `scripts/verificar-fotos.mjs`.

### Momentos por bloque (primera tanda)

- Entrada nueva **`motion-kit/momentos`** (11,9 KB gzip al cargar, tope 12; el sorteo, el antes y después, el confeti
  y lo de las fotos vivas se bajan aparte, y si no bajan la página sigue) y su CSS en archivo,
  `motion-kit/estilos-momentos.css`. La entrada exporta las piezas, `useMomento`, el resorte, `faltaPara` y los
  formatos de Chile; los cálculos internos no son parte del paquete.
- El efecto propio de cada bloque de La Mente, con los datos del bloque: `SellosEstampa`, `ResenasPila`,
  `CartaQueSeAbre`, `PrecioQueRueda`, `CuentaRegresiva` (hora del negocio, cambio de hora incluido), `MapaDibujado`,
  `MosaicoQueSeArma`, `AntesDespues` y `SorteoRaspe` (con `Confeti`).
- **Resorte** con curva CSS `linear()` y uno por estilo (`resorte`, `RESORTES_DE_ESTILO`); retro va por pasos.
- Tres niveles (completo, liviano, quieto), texto legible desde el primer cuadro y colores de La Mente (`--lm-*`)
  cuando no hay `Estilo` alrededor.
- **No se exportan desde la entrada principal** `motion-kit` (está en su tope): se importan de `motion-kit/momentos`.

### Encabezado de película (receta v2)

- **Receta v2** (acepta la v1 y la guarda como v2; contrato con `versiones: [1, 2]`): apertura, tomas, foto en las
  letras, tratamiento, estado, palabras que rotan, hora del día, `shader`, `objeto`, `logo` y `nombre`; salidas
  `barra` y `telon`. Protagonista: tomas, fondo animado (efecto o shader, uno solo), palabras, título y luz.
- **Apertura** de película una vez por sesión; **varias tomas** con acercamiento lento; **palabras que rotan** en la
  palabra resaltada, con el ancho reservado.
- **Barra al bajar** (logo o nombre y el mismo botón principal, `inert` mientras se ve el encabezado; `barraPropia`
  para La Mente) y **telón** al bajar.
- **Estado del negocio** (abierto, cerrado, próxima hora libre) con los datos que pasa quien dibuja.
- **Foto dentro de las letras** (con contorno; sin foto o si no carga, el título queda con su color), **tratamiento de
  foto** (duotono, grano, trama, blanco y negro) y **hora del día**.
- **Colores desde la foto**: `paletaDeFoto` propone paleta y tema de La Mente (solo en `motion-kit`, es del editor).
- Shader, objeto 3D y video se cargan aparte con `import()`: `motion-kit/encabezado` queda en 33,7 KB gzip.

### Cambios que pueden romper

- Los medidores del editor (`MedidorPeso`, `MedidorFluidez`, `MedidorCarga`, `SemaforoContraste` y lo de `peso` y
  `calidad`) ya no salen por la entrada principal `motion-kit`: se importan de `motion-kit/escena`, donde ya estaban.
  Libera espacio en la entrada principal (decisión de Aquiles, 23-11).
- `contratoEncabezado`/`textoContrato` ya no salen de `motion-kit/receta` ni de `motion-kit/encabezado`, y
  `contratoPagina`/`textoContratoPagina` no salen de `motion-kit/pagina`: son herramientas de desarrollo y quedan solo en
  `motion-kit`. Lo que usa La Mente son los archivos `contrato/*.json`.
- `paletaDeFoto` está solo en `motion-kit` (es del editor).
- Receta: `palabras` son de 1 a 3 alternativas a la palabra resaltada (antes se pedían 2 o más); `tomas` solo se guardan
  en composiciones con foto.

### Relatos

- **Relatos** (`motion-kit/pagina`): nueve maneras de contar la página al bajar. De bloque: Escenas que aparecen,
  Película continua, Cuento por capítulos, Profundidad, Iris, Carrete y Subtítulos; de página: Hilo y Luz que cambia.
  CSS con animaciones ligadas al scroll (`animation-timeline`), respaldo propio con un solo `IntersectionObserver`, niveles
  completo, liviano y quieto, y movimiento base con el sabor de cada estilo (entrada y cursor sobre las tarjetas).
- `<PaginaRelato>`, `<Relato>` y `<FraseRelato>`. Los bloques marcan sus partes con `data-mk-parte` (`linea`, `foto`,
  `tarjeta`, `frase`); sin las marcas que pide su relato, un bloque se cuenta como Escenas.
- **Receta de página v1**: `validarPagina`, `normalizarPagina`, `relatoDeBloque` y el contrato
  `contrato/pagina-motionkit.json`.
- `motion-kit/estilos-pagina.css` (2,5 KB gzip) para usar con `sinInyectarEstilos()`.
- Demos `#relatos` y `#pagina` (con QR); `scripts/verificar-relatos.mjs`.

- **Biblioteca de diseños** (paso 4): `DisenoBiblioteca` con nombre, rubro, etiquetas, estado (borrador, aprobado,
  archivado), autor, receta y tema/paleta de La Mente para verlo igual; `validarDiseno`, `crearDiseno`, `editarDiseno`,
  `duplicarDiseno`, `filtrarDisenos`, `exportarBiblioteca` e `importarBiblioteca` (gana la edición más nueva; lo que no
  sirve se informa en español) y `almacenLocal()` detrás de la interfaz `AlmacenBiblioteca`, que en el paso 5 se cambia
  por la API de La Mente. Misma forma que la tabla que tendrá La Mente.
- Demo `#biblioteca`: miniaturas con el encabezado de verdad (quieto), filtros, aprobar, archivar, duplicar, borrar con
  confirmación, exportar e importar `.json`, y 10 ejemplos por rubro. El editor guarda en la biblioteca, abre un diseño
  con `#encabezados?id=…` y, si se cambia uno aprobado, vuelve a borrador. `scripts/verificar-biblioteca.mjs`.
- El editor conserva los `href` de los botones de una receta abierta y solo guarda `mover` si no es el de siempre.

### Peso

La biblioteca está solo en `motion-kit` (no en `encabezado` ni `receta`): suma unos 2 KB gzip.

`motion-kit/pagina`: 15,8 KB gzip sola; sobre el encabezado suma unos 7,5 KB. Topes (con «hace todo» de Aquiles):
`pagina` 17 KB y `motion-kit` 80 KB (era 70; con los relatos y la biblioteca mide 72,7).

## 0.2.0 (23-11-2026)

Lo que hace falta para que La Mente guarde y dibuje encabezados de motion-kit.

### Nuevo

- **Receta del encabezado v1** (`motion-kit/receta`): `RecetaEncabezado`, `validarReceta` (errores en español, con el
  campo; topes de largo; enlaces solo `https:`, `#` o rutas de la página), `normalizarReceta` (nunca lanza; un solo
  protagonista) y `recetaAProps`. Solo niveles 1 y 2: shader, objeto 3D y video quedan para la v2.
- **Contrato** `contrato/encabezado-motionkit.json`, generado desde el código con `npm run contrato`. Viaja en el
  paquete (`motion-kit/contrato/encabezado-motionkit.json`).
- **Puente con La Mente**: `estiloDesdeLaMente({ tema, paleta, base })` y `<EstiloLaMente>`. Colores de la paleta y
  letra, mayúsculas, peso, brillo y esquinas del tema; el estilo de motion-kit queda de base.
- **Entradas separadas**: `motion-kit/encabezado` (lo que una página necesita para dibujar un encabezado desde su
  receta), `motion-kit/escena` y `motion-kit/receta` (sin React). `motion-kit` sigue trayendo todo.
- **CSS en archivo**: `motion-kit/estilos.css` (todo) y `motion-kit/estilos-encabezado.css` (solo el encabezado). Con
  `sinInyectarEstilos()` o `<meta name="motion-kit-estilos" content="archivo">` no se inserta ningún `<style>`: sirve
  con una CSP sin `'unsafe-inline'` en `style-src`. Las variables que se ponen con `style={…}` van por CSSOM, que la CSP
  no bloquea.
- **Pruebas**: `npm test` (`node --test`), `npm run peso` (tope por entrada), `npm run probar-paquete` (instala el
  paquete en un proyecto de prueba e importa solo el encabezado) y `scripts/verificar-lamente.mjs`.

### Peso (gzip, minificado, react afuera)

| Entrada | Al cargar | Perezoso (efectos de fondo) | Tope (confirmado por Aquiles) |
|---|---|---|---|
| `motion-kit/encabezado` | 31,6 KB | 12,0 KB | 35 KB |
| `motion-kit/receta` | 8,4 KB | — | 10 KB |
| `motion-kit/escena` | 14,0 KB | — | 16 KB |
| `motion-kit` | 63,7 KB | 10,9 KB | 70 KB |
| `estilos-encabezado.css` | 11,4 KB | — | — |

### Cambios que pueden romper

- `sideEffects` pasa de `false` a `["**/*.css"]`, para que el bundler no bote el `import "motion-kit/estilos.css"`.
- `ALTOS` y `SALIDAS` viven ahora en `encabezados/catalogo.ts` (se siguen exportando igual desde `motion-kit`).

### Arreglos

- Demo: «← Demo» y el botón atrás del navegador vuelven a la portada sin recargar.

## 0.1.0

Primera versión: 27 componentes y 4 hooks; efectos, estilos, encabezados y escena viva sin librerías.
