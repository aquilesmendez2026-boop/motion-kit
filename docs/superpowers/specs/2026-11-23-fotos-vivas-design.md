# Fotos vivas (diseño)

Fecha: 23-11-2026. Pedido de Aquiles: «2» (partir por las fotos vivas con WebGL a mano y la foto que crece) y «C»
(en el encabezado y en la galería). Forma de construir: «ok» a un motor de fotos con dos lienzos.

## Para qué

Que las fotos de la página de un negocio se sientan vivas: ondulan como agua bajo el dedo, se arman desde partículas al
entrar, cambian de una a otra con una transición líquida y, al tocarlas en la galería, crecen hasta llenar la pantalla.
Es lo que más sorprende en una página de negocio y cuesta pocos KB. Sigue el objetivo de La Mente: páginas
sorprendentes en minutos, sin que el dueño configure nada más que un interruptor.

## Metas

- **Encabezado:** foto viva con un interruptor en la receta (`fotoViva`). Ondas al tocar o pasar el cursor; al entrar,
  la foto se arma desde partículas; con varias tomas, el cambio entre fotos es líquido.
- **Galería (`MosaicoQueSeArma`):** la foto que tocas ondula; un toque corto la abre en un **visor** que crece desde su
  lugar hasta llenar la pantalla (View Transitions), con anterior, siguiente y cerrar.
- **A lo más dos lienzos WebGL por página:** uno del encabezado y uno que se mueve sobre la foto activa de la galería.
- Todo escrito por nosotros, sin librerías, cargado aparte (`import()`), con sus tres niveles y accesible.

## No metas

- Cartas o tarjetas que crecen y llevan a otra página (eso depende de las rutas de La Mente). Se suma después.
- Efectos en las fotos de otros momentos (reseñas, sorteos): solo encabezado y galería.
- Cambiar los repos de La Mente. El permiso CORS de sus fotos es un encargo para La Mente, con OK de Aquiles.
- Librerías (Three.js y las demás aprobadas quedan para la página de presentación).

## Anti metas

- Que una foto que no permite WebGL se vea rota, en blanco o distinta: se ve la foto normal, siempre.
- Que la página se trabe en un teléfono de gama media: en liviano no hay WebGL.
- Que se baje dos veces cada foto para nada (ver «Fotos de otros sitios»).
- Que el visor atrape a quien usa teclado o lector de pantalla.

## Restricciones

- Las de siempre (`CLAUDE.md`): sin dependencias; móvil primero; movimiento reducido; accesible; peso medido.
- En lo que se anima con CSS: solo `transform` y `opacity`. WebGL dibuja en su lienzo (como el raspe del sorteo).
- Topes de peso sin subir: `motion-kit/encabezado` 35 KB (hoy 33,1), `motion-kit/momentos` 12 KB (hoy 11,8). Por eso
  el motor y el visor se cargan aparte; al cargar solo entra el código mínimo que decide si hace falta.
- La receta v2 todavía no tiene etiqueta (`v0.2.0` es la v1): `fotoViva` se suma a la v2 como campo opcional, sin v3.
  El contrato `contrato/encabezado-motionkit.json` se regenera.

## Enfoques considerados

| Forma | Decisión |
|---|---|
| **Un motor de fotos con dos lienzos** (elegida) | Un módulo WebGL propio con los tres efectos; lienzo fijo en el encabezado y uno itinerante en la galería. Compila una vez, mueve el lienzo con `transform`. |
| Un lienzo por foto, creado al tocar | Descartada: compila y sube la foto en cada toque, con tirones en teléfonos de gama media. |
| Filtros SVG (`feTurbulence`) | Descartada: lentos en teléfonos, fuera de la regla de `transform`/`opacity`, sin partículas. |

## Cómo funciona

### Motor de fotos (`src/fotos/`, se carga aparte)

- Un **lienzo WebGL** por dueño (encabezado o galería), con lo que ya hace `ShaderFondo`: pausa fuera de la vista y con
  la pestaña oculta, resolución con tope (`devicePixelRatio` hasta 2) y se apaga
  en liviano y quieto.
- **Tres efectos**, compilados una vez por lienzo:
  - **Ondas:** el dedo o el cursor deja ondas que se expanden y se apagan (hasta 6 ondas a la vez, cada una con su
    centro y su tiempo). Sin dedo encima, la foto queda quieta.
  - **Partículas:** la foto como una grilla de puntos (unos 10.000 en escritorio, 4.000 en teléfono) que llegan desde
    posiciones desordenadas (por semilla) y forman la foto en ~1,2 s. Al terminar, el lienzo dibuja la foto lisa.
  - **Líquido:** cambio entre dos fotos con un borde ondulado que avanza (ruido), en ~1 s.
- **La foto real queda en el HTML** (`<img>` con su `alt`), debajo del lienzo. El lienzo es `aria-hidden` y solo
  aparece cuando su textura está lista. Si algo falla (sin WebGL, sin permiso, contexto perdido), el lienzo se quita y
  se ve la foto.

### Fotos de otros sitios (CORS)

WebGL solo puede usar una foto si su servidor lo permite. Para no bajar dos veces cada foto ni romper la que se ve:

- La `<img>` visible no cambia (sin `crossorigin`), así nunca deja de cargar.
- El motor pide la textura aparte con `crossOrigin = "anonymous"` **solo** si la dirección es del mismo sitio, `data:`,
  `blob:` o de un origen de la lista `origenesFotos` (prop; La Mente pondrá el de sus fotos). Cualquier otra: foto
  normal, sin efecto ni segunda descarga.
- Si la textura falla (el servidor no dio permiso), foto normal.
- **Encargo para La Mente** (sin partir sin OK): que el servidor de las fotos que suben los dueños responda con
  `Access-Control-Allow-Origin` para sus páginas, y pasar ese origen en `origenesFotos`.

### Encabezado

- Receta: **`fotoViva?: boolean`** (v2, opcional). Solo en composiciones con foto (las mismas de las tomas: imagen,
  tarjeta, viñetas y dividido sin objeto); si no, se apaga con el aviso «La foto viva solo se ve en las composiciones
  con foto: queda apagada.».
- Con `fotoViva`:
  - al entrar, la foto se arma desde partículas, **salvo** si hay `apertura` (la apertura ya es la entrada) o en la
    vista del editor al cambiar opciones (una vez por carga);
  - ondas al tocar o pasar el cursor;
  - con `tomas`, el cambio entre fotos es líquido (reemplaza el fundido de `Tomas`).
- Protagonista: `fotoViva` no entra en el orden. Las ondas solo responden al dedo y las partículas son una vez; con
  tomas, la protagonista sigue siendo `tomas`.
- `recetaAProps` pasa `fotoViva` al `Encabezado`; el editor `#encabezados` suma el interruptor en la parte Película.

### Galería

- `MosaicoQueSeArma` suma **`viva?: boolean`** (ondas en la foto que tocas) y **`visor?: boolean`** (abrir al tocar).
  Ambas apagadas por defecto, para no cambiar lo que ya existe; La Mente las prende.
- **Lienzo itinerante:** uno solo por página para todas las galerías. Se ubica sobre la foto activa con `transform` y
  la sigue al bajar; al soltar el dedo, las ondas se apagan y el lienzo se va.
- **Visor** (pieza nueva `VisorFotos`, se carga aparte): un toque corto (sin arrastre) abre la foto.
  - Crece desde su lugar con View Transitions (`view-transition-name` en la foto tocada y en la del visor). Sin View
    Transitions: crece con una animación propia de `transform`. En quieto: aparece sin animación.
  - Es un diálogo (`role="dialog"`, `aria-modal`, título con el pie o «Foto N de M»): el foco entra al visor, queda
    adentro, Escape cierra y el foco vuelve a la foto. Botones Anterior, Siguiente y Cerrar de 44 px; flechas del
    teclado; deslizar con el dedo a los lados cambia de foto y hacia abajo cierra.
  - El fondo de la página no se desplaza mientras está abierto.

### Niveles

| Nivel | Encabezado | Galería |
|---|---|---|
| Completo | Partículas, ondas y líquido | Ondas y visor con crecimiento |
| Liviano | Sin WebGL: foto normal; tomas con su fundido | Sin ondas; visor con crecimiento (es barato) |
| Quieto | Foto normal, primera toma | Sin ondas; visor sin animación |

## Pruebas

- **Unitarias:** `origenPermitido(url, origenes, origenPagina)` (mismo sitio, data, blob, lista, otros no);
  `rejillaParticulas(ancho, alto, maximo)` (no pasa del máximo, guarda la proporción); validación de `fotoViva` en la
  receta (campo nuevo, aviso sin composición con foto, contrato regenerado); `siguienteFoto` del visor (vuelta).
- **Visuales** (`scripts/verificar-fotos.mjs`, Playwright con WebGL por software):
  - con `fotoViva` hay un lienzo en el encabezado y, al tocar la galería, uno más; nunca más de dos;
  - una foto de otro origen sin permiso queda como foto normal, sin lienzo y sin segunda descarga;
  - el visor abre con un toque, Escape lo cierra y el foco vuelve a la foto; Tab no sale del visor;
  - con movimiento reducido no hay lienzos y el visor abre sin animación;
  - sin WebGL (forzado), todo se ve como fotos normales y sin errores;
  - el peso de las entradas sigue bajo sus topes.

## Decisiones de construcción (mías, tras la revisión)

- **Peso:** el motor, los efectos y el visor viven en módulos aparte. En `motion-kit/encabezado` y `motion-kit/momentos`
  solo entra el `import()` y la decisión (`origenPermitido`, nivel). Si aun así una entrada pasa su tope: parar y
  preguntarle a Aquiles; no se suben topes ni se saca nada existente sin su OK.
- **`ShaderFondo` no se toca:** `src/fotos/` copia lo mínimo (crear el contexto, pausa, pérdida de contexto, tope de
  resolución). Duplica poco y no arriesga lo que hoy funciona.
- **`origenesFotos` vacío por defecto:** se entrega así; las pruebas usan fotos del mismo sitio. Las fotos de los
  dueños tendrán efecto cuando La Mente dé el permiso y pase su origen (encargo).
- **Un solo motor de galería por página:** variable de módulo dentro del código que se carga aparte; todas las
  galerías piden el mismo lienzo itinerante, y lo tiene la foto tocada más recién.
- **El lienzo del encabezado cubre solo la foto** (la misma caja que la `<img>` o las tomas), debajo del texto y de los
  recortes de la composición. El líquido dibuja las dos fotos en ese lienzo y, al terminar, cambia la toma visible.
- **Partículas una vez por carga de página** (variable de módulo, no `sessionStorage`): en el editor no se repiten al
  cambiar opciones; sí con el botón que ya existe para ver la apertura otra vez.
- **`view-transition-name` solo en la foto tocada y en la del visor**, y se quita al cerrar (los nombres son únicos).
  Sin View Transitions, la foto crece con una animación propia de `transform` (desde su caja hasta la del visor), no
  con un fundido.
- **Textos:** «Anterior», «Siguiente», «Cerrar», «Foto N de M»; el aviso de `fotoViva` va en la validación de la
  receta (el contrato JSON solo suma el campo).

## Lo que cambió al construir (23-11)

- **El lienzo de la galería va dentro del marco de la foto** (encima de la `<img>`), no fijo en la ventana siguiéndola:
  así la sigue solo al bajar, queda debajo de barras fijas y gira con la foto.
- **Los gestos de la galería se atienden en `src/fotos/gestos.tsx`**, que se baja con el primer toque; en la entrada
  `motion-kit/momentos` queda solo el aviso. Fue lo que permitió no pasar el tope de 12 KB.
- **El motor reintenta saltándose la caché** cuando la foto de otro sitio falla con CORS: la caché del navegador puede
  devolver la respuesta sin permiso que guardó la `<img>` de siempre.
- **El lienzo del encabezado recibe lo mismo que la foto**: el tratamiento (blanco y negro, duotono) y el corrimiento
  de la profundidad, por CSS del encabezado.
- **La foto viva del encabezado no importa nada del encabezado** (este le pasa cómo dibujar la foto): si no, el paquete
  se partía en más trozos y la entrada principal pasaba su tope.
- **Al cerrar el visor**, la foto vuelve al lugar de la foto que se estaba viendo (si está a la vista); el foco vuelve
  siempre a la foto que se tocó.
- **Peso final:** principal 79,97 de 80 KB (queda justo en el límite), encabezado 33,4 de 35, momentos 11,9 de 12.

## Qué queda para quien construye

- Las cifras de cada efecto (fuerza de las ondas, cantidad de partículas dentro de los topes, tiempos).
- Cómo se reparte el código entre el motor y los efectos, siempre que se cargue aparte.
- Los textos exactos de los botones del visor, en español de Chile y cortos.
