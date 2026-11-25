# Catálogo y hoja de ruta

Qué tiene el kit, qué falta y de dónde salen las ideas. Se actualiza cada vez
que se suma un efecto.

## Criterios del kit

1. **Sin dependencias de animación.** React, CSS y APIs del navegador.
2. **Escrito desde cero.** Las otras librerías se miran para sacar ideas, no
   código (ver `THIRD_PARTY_LICENSES.md`).
3. **Móvil primero.** Un efecto que solo funciona con hover no basta: tiene que
   responder al dedo o tener un equivalente táctil.
4. **Solo `transform` y `opacity`** siempre que se pueda. Son las propiedades
   que el navegador anima sin trabar la página.
5. **Movimiento reducido.** Con `prefers-reduced-motion` el efecto se apaga y el
   contenido queda visible.
6. **Accesible.** Texto animado legible por lectores de pantalla, controles
   usables con teclado, zonas de toque de 44 px o más.

## Secciones de una plantilla y qué pieza las cubre

| Sección | Piezas del kit |
|---|---|
| Portada | `Aurora`, `SplitText`, `WordRotate`, `Typewriter`, `ShinyButton`, `MagneticButton` |
| Cinta de logos o frases | `Marquee` |
| Beneficios | `Stagger`, `Spotlight`, `TiltCard` |
| Cifras | `CountUp` |
| Testimonios | `Carousel` |
| Navegación superior | `Navbar` |
| Precios | `GlowBorder`, `Pressable`, `Tabs` |
| Preguntas frecuentes | `Accordion` |
| Vista previa de app | `DeviceFrame`, `TabBar`, `BottomSheet` |
| Carga y avisos | `Skeleton`, `ToastProvider` + `useToast` |
| Navegación entre pantallas | `useViewTransition` |

## Efectos protagonistas (21-11-2026)

Primera tanda hecha: 12 efectos (escena y fondo por rubro), 3 variantes cada uno, registro `EFECTOS` y
`EfectoPagina`. Diseño y plan en `docs/superpowers/`. Siguiente: el adaptador en La Mente (que `contrato/diseno.json`
acepte estos ids) y una segunda tanda para que no se repitan entre páginas del mismo rubro.

## Botones, tarjetas, movimientos y transiciones (21-11-2026)

Hecho: `Boton` (6 estilos, 8 efectos), `Tarjeta` (5 estilos, 5 efectos combinables) y `TarjetaVolteable`,
`Movimiento` con 23 movimientos (`MOVIMIENTOS`) y transiciones de entrada y salida (`Presencia`, `CambioContenido`,
11 tipos en `TRANSICIONES`). Referencias: Animista y animate.css (catálogo de movimientos), Hover.css y Codrops
(efectos de botón), Aceternity y Magic UI (tarjetas), Motion `AnimatePresence` (salidas). Escrito desde cero, sin
copiar código. Pendiente: transiciones entre páginas con View Transitions (`::view-transition-*`), lista con
reordenamiento animado y entradas escalonadas por lista (hoy `Stagger` o `retraso`).

## Estilos, plantillas y estudio (21-11-2026)

Hecho:
- 5 estilos (`Estilo`: neón, retro, rock, anime, película).
- 5 efectos nuevos: rejilla, tubo, ecualizador, velocidad y grano. Ya son 17.
- `TextoCinetico` con 8 efectos.
- Animación con el scroll nativa (`AlScroll`, `GaleriaHorizontal`).
- Transiciones entre páginas (`transicionVista`, 7 tipos).
- Sonidos sintetizados y vibración, opcionales.
- `sorprendeme()`.
- Recetas como datos con `PaginaReceta` y 5 plantillas completas.
- Estudio en `#estudio`.

Pendiente:
- Confirmar qué edita el cliente (`EDITABLE_POR_CLIENTE`) y llevar la receta al contrato de La Mente.
- Más plantillas por rubro (salud, belleza, clases con otros estilos).
- Fotos reales en lugar de ilustraciones.
- Probar en Android de gama media.

## Encabezados y packs de botones (21-11-2026)

Hecho:
- `Encabezado` con 12 composiciones y 7 entradas.
- Ajuste automático del título.
- 3 efectos de texto nuevos y la palabra destacada con `*asteriscos*`.
- 8 formas de botón y 12 packs (`BotonesPack`).
- Editor de encabezado tipo cliente en `#encabezados`, que guarda un JSON.
- Las 5 plantillas usan ahora una composición distinta cada una.

Ideas siguientes:
- Portada con video corto o foto que se mueve al bajar.
- Encabezado con reserva o pedido incrustado (horario, botón de WhatsApp).
- Contador regresivo para eventos.
- Más composiciones (revista, mapa, menú de pizarra).
- Que el cliente suba su foto y el kit elija el color de acento desde la foto.

## Pendiente

Ordenado por cuánto aportan a una plantilla.

| Idea | Para qué | Nota |
|---|---|---|
| `Modal` | Diálogos en escritorio | Compartir lógica con `BottomSheet` |
| `SwipeRow` | Deslizar una fila para ver acciones | Con alternativa por botón |
| `BentoGrid` | Grilla de características de tamaños mixtos | Solo CSS grid |
| `ScrollReveal` por CSS | `Reveal` sin JavaScript | `animation-timeline: view()` con respaldo |
| `Dock` | Barra de íconos que crecen al acercarse | Solo escritorio |
| `Confetti` suelto | Celebrar una compra o registro | Ya existe `Confeti` en `motion-kit/momentos` (lo usa el sorteo) |
| Fondos: grilla y partículas sueltas | Variedad de portadas | Ya están la rejilla, los puntos y la constelación |
| `ImageCompare` | Antes y después con deslizador | |
| `Cursor` personalizado | Sitios de portafolio | Solo con puntero fino |
| `BrowserFrame` | Marco de navegador para capturas | Par de `DeviceFrame` |

## Paquete v0.5.1 (25-11-2026)

Etiqueta `v0.5.1`: suma el hilo de página `rastro` (huellas del rubro por el recorrido, sin línea). Se instala con
`github:aquilesmendez2026-boop/motion-kit#v0.5.1`. El contrato de página suma `rastro` a `relatoPagina` (solo agrega);
los del encabezado y la partitura no cambian. Antes de la etiqueta: 318 pruebas calculables, pesos dentro de sus topes
y la batería visual completa.

## Paquete v0.5.0 (25-11-2026)

Etiqueta `v0.5.0`: suma la entrada `motion-kit/luz` («Luz y materia»), cuatro momentos que se manejan con el dedo
(cupón, sticker, sellos con timbre y ruleta), tres hilos de página (`rulos`, `hebras`, `figura`) con el material de
cada estilo, y el encabezado listo para una partitura (sus partes marcadas con `data-mk-parte` y `sinEntrada`). Arregla
las formas de `Boton`, que nunca se aplicaban: **cambia cómo se ven** los botones con forma. Se instala con
`github:aquilesmendez2026-boop/motion-kit#v0.5.0`. El contrato de página suma valores (los hilos, `figura`, `semilla`);
los del encabezado y la partitura no cambian. Antes de la etiqueta: 313 pruebas calculables, pesos dentro de sus
topes (el de `motion-kit` sube a 90 KB, fijado por Aquiles) y la batería visual completa.

## Paquete v0.4.0 (24-11-2026)

Etiqueta `v0.4.0`: suma el Director (`motion-kit/director`) con la Partitura **versión 1** y su contrato
(`contrato/partitura-motionkit.json`), la entrada `motion-kit/partitura` (el lenguaje en español, las partituras de
la casa y «Sorpréndeme»), la foto profunda, los efectos vistosos (fuegos artificiales, carrusel giratorio y libro que
se abre), la segunda tanda de momentos y cinco fondos vivos de lienzo. Se instala con
`github:aquilesmendez2026-boop/motion-kit#v0.4.0`. Los contratos del encabezado y de la página siguen en su versión
(suman valores). Antes de la etiqueta: 262 pruebas calculables, pesos dentro de sus topes y la batería visual completa.

## Paquete v0.3.0 (24-11-2026)

Etiqueta `v0.3.0`: la primera con la receta del encabezado **v2**, los relatos y la receta de página, la entrada
`motion-kit/momentos`, las fotos vivas y los nueve efectos de «dedo y física». Se instala con
`github:aquilesmendez2026-boop/motion-kit#v0.3.0`. Cambios que pueden romper respecto de la 0.2.0: en `CHANGELOG.md`.

## Escena: encabezados vivos sin librerías (23-11-2026)

Todo en `src/escena/`, sin dependencias. Presupuesto de peso en
`cerebro-aquiles/investigaciones/2026-11-23-pesos-web-y-movil.md`.

| Pieza | Qué hace | Pesa |
|---|---|---|
| `Encabezado` (props nuevas) | `alto` y `altoCelular` (pantalla, grande, medio, compacto, auto o % a medida), `profundidad`, `luz`, `mover`, `shader`, `poster`, `objeto`, `salida`, `ahorro` | — |
| `CapasProfundidad` | Planos 2.5D que siguen al dedo, cursor, scroll o inclinación | 0 KB (formas SVG) |
| `LuzYReflejo` | Foco que sigue al dedo o brillo que cruza | 0 KB (CSS) |
| `ShaderFondo` | Aurora, líquido, humo o foco de luz en WebGL a mano; colores del estilo; degradado sin WebGL | < 10 KB |
| `Objeto3DCss` | Caja, lata o tarjeta en CSS 3D; se gira arrastrando | 0 KB + fotos |
| `EscenaVideo` | Video con fondo transparente (WebM VP9 + HEVC para Safari); póster primero, baja al acercarse | el video |
| `SecuenciaScroll` | Cuadros que avanzan con el scroll en un canvas (estilo Apple) | los cuadros |
| `comprimirFoto` | Achica y pasa a WebP en el navegador hasta quedar bajo un peso (borra el EXIF) | — |
| `useNivelEscena` | completo, liviano (teléfono trabado) o quieto (ahorro de datos, red lenta, poca memoria, movimiento reducido) | — |
| `MedidorPeso`, `MedidorFluidez`, `MedidorCarga`, `SemaforoContraste` | Peso contra presupuesto, cuadros por segundo, LCP y contraste WCAG en el editor | — |
| `RUBROS`, `encabezadoPorRubro` | 10 rubros con estilos, composiciones, fondos y textos; con semilla | — |
| `CodigoQR` | QR propio (versiones 1 a 40) para abrir la vista en el teléfono | — |

Editor en `#encabezados`; vista para el teléfono en `#vista?d=…` (el QR). `npm run dev:red` abre el servidor a la
Wi-Fi. Pruebas: `scripts/verificar-escena.mjs`. Flujo de GitHub listo en `docs/ci/verificar.yml` (moverlo a
`.github/workflows/`).

## Receta del encabezado v1 (23-11-2026)

Lo que La Mente va a guardar y validar. Todo en `src/receta/`, sin React ni componentes: corre en el navegador, en
Node y, copiado como contrato, en el backend. Solo niveles 1 y 2; shader, objeto 3D y video quedan para la v2.

| Pieza | Qué hace |
|---|---|
| `RecetaEncabezado` | `version: 1`, estilo, composición, entrada, efecto del título, pack, textos, `botones` (hasta 2), alto, fotos (URL https o key de S3), póster, fondo animado, capas, luz, `mover`, salida y ahorro |
| `validarReceta(x)` | `{ ok, receta, avisos }` o `{ ok: false, errores: [{ campo, mensaje }] }`; junta todos los errores, en español. Topes: título 80, bajada 220, antetítulo 60, hasta 4 datos de 40, botón 30, alto 20 a 100; `href` solo `https:`, `#` o ruta relativa |
| `normalizarReceta(r)` | Nunca lanza: quita lo desconocido, corta lo largo, pone lo que falta y deja **un solo protagonista** (gana el fondo animado, después el título que se mueve sin parar y al final el brillo que cruza; los demás se calman) |
| `recetaAProps(r, { urlImagen })` | Props de `Encabezado`; las keys de S3 pasan a URL con `urlImagen` |
| `contrato/encabezado-motionkit.json` | Listas cerradas, topes, defectos y regla del protagonista, generados con `npm run contrato` desde el código |

Las listas que no tienen catálogo propio se escriben como `Record<Tipo, true>`: si un tipo cambia, el typecheck falla.
El editor `#encabezados` guarda su estado como receta: la vista se dibuja desde la receta validada y el bloque «Lo que
se guarda» muestra la receta, sus errores y lo que se calmó. Pruebas: `npm test` (`node --test`, empaquetado con el
esbuild que ya trae Vite; también revisa que el contrato esté al día).

## Puente con La Mente (23-11-2026)

`src/receta/lamente.ts` y `EstiloLaMente`: el encabezado toma los colores de la paleta y la letra, las mayúsculas, el
espaciado, el peso, el brillo y las esquinas del tema, igual que `TemaPagina` del front de La Mente. El estilo de
motion-kit queda de base (formas de botones, efectos y movimiento): el de la receta o el que se propone para el tema
(`BASE_DE_TEMA`, propuesta para revisar).

| Pieza | Qué hace |
|---|---|
| `estiloDesdeLaMente({ tema, paleta, base })` | `{ estilo, colores, googleFonts, brillo, claro }`: las variables `--mk-*` que pisa. El antetítulo usa el acento solo si se lee sobre el fondo |
| `EstiloLaMente` | `<Estilo>` con ese puente, sin textura y con la letra del tema |
| `TEMAS_LAMENTE`, `PALETAS_LAMENTE` | Copia de `lamente-front/packages/ui/src/{temas,paletas}.ts`; una prueba la compara con el original y con `diseno.json` cuando los repos están al lado |

Con tema, el título usa el color de texto de la paleta. El resplandor del estilo neón se apaga sobre paletas claras,
salvo en el tema neón, que tiene brillo propio. Los 12 temas con su paleta y hamburguesería con las 12 paletas pasan el
semáforo de contraste (`scripts/verificar-lamente.mjs`). En el editor: «Tema y paleta de La Mente». El tema y la paleta
son de la página: no van en la receta.

## Paquete v0.2.0 (23-11-2026)

| Entrada | Qué trae | Al cargar (gzip) | Tope |
|---|---|---|---|
| `motion-kit/encabezado` | `Encabezado`, `Estilo`, `EstiloLaMente`, la receta, catálogos y `sinInyectarEstilos` | 31,6 KB (+12 KB de efectos, solo el que se use) | 35 KB |
| `motion-kit/receta` | Receta, contrato y puente, sin React | 8,4 KB | 10 KB |
| `motion-kit/escena` | Capas, luz, shader, objeto 3D, video, secuencia, ahorro y medidores | 14,0 KB | 16 KB |
| `motion-kit` | Todo | 63,7 KB | 70 KB |

Medido minificado y con react afuera (`npm run peso`, que falla si una entrada pasa su tope). CSS de respaldo:
`estilos.css` (14,9 KB gzip) y `estilos-encabezado.css` (11,4 KB), generados desde las constantes CSS del código.
`npm run probar-paquete` instala el paquete en un proyecto de prueba e importa solo el encabezado. Detalle en
`CHANGELOG.md`. Mejora posible: cargar aparte el shader, el objeto 3D y el video (son de la receta v2), unos 3 KB
menos al cargar.

## Encabezado de película (23-11-2026)

Receta v2 y las nueve ideas aprobadas (spec `2026-11-23-relatos-y-encabezado-pelicula-design.md`, plan
`2026-11-23-encabezado-pelicula.md`).

| Idea | Prop / campo | Nota |
|---|---|---|
| Apertura | `apertura: { presenta }` | Una vez por sesión, se salta tocando; aunque `sessionStorage` falle |
| Varias tomas | `tomas` (2+ fotos) | Protagonista; quietas en liviano y quieto |
| Foto dentro de las letras | `fotoEnLetras` | Título entero (no letra por letra) y con contorno |
| Tratamiento de foto | `tratamiento` | duotono, grano, trama, bn |
| Colores desde la foto | `paletaDeFoto(archivo)` | Del editor; propone paleta y tema de La Mente |
| Estado del negocio | `estado` + `estadoNegocio` | Abierto, cerrado y próxima hora libre |
| Palabras que rotan | `palabras` (2 a 4) | En la palabra resaltada; ancho reservado |
| Salida que entrega la posta | `salida: "barra" \| "telon"`, `barraPropia`, `logo`, `nombre` | Barra `inert` mientras se ve el encabezado |
| Hora del día | `horaDelDia` (`ahora` para fijarla) | Mañana 6–12, tarde 12–19, noche |

Pruebas: `npm test` (receta v2, colores desde la foto) y `scripts/verificar-pelicula.mjs`.

## Relatos (23-11-2026)

Cómo se cuenta la página al bajar. Todo en `src/relatos/`, entrada `motion-kit/pagina`. Diseño:
`docs/superpowers/specs/2026-11-23-relatos-y-encabezado-pelicula-design.md`.

| Relato | Alcance | Qué pasa al bajar | Necesita marcas |
|---|---|---|---|
| Escenas que aparecen | bloque | Entra con el sabor del estilo (neón se enciende, retro en pasos, rock golpea, anime de lado, película se funde) | — |
| Película continua | bloque | Telón del acento; el encabezado se aleja; cinta de avance | — |
| Cuento por capítulos | bloque | Se queda quieto y cuenta línea por línea; la foto se acerca | `linea` |
| Profundidad | bloque | Capas a distinta velocidad; tarjetas en cascada | `tarjeta` |
| Iris | bloque | Se revela desde un círculo que crece | — |
| Carrete | bloque | La tira pasa de lado | una tira: 2+ `foto` o `tarjeta` |
| Subtítulos | bloque | La frase se enciende palabra por palabra (`FraseRelato`) | `frase` |
| Hilo | página | Una línea se dibuja y una luz viaja | — |
| Hilo con rulos, Hebras, Hilo que dibuja | página | Un hilo por delante de los bloques, que serpentea, se abre donde hay tarjetas y termina en una figura (ver «Hilos») | — (`tarjeta` para abrirse) |
| Luz que cambia | página | El cielo pasa de la tarde a la noche, con tintes de la paleta | — |

CSS nativo con scroll dentro de `@supports`; sin soporte, respaldo con `data-visto`. En liviano los pesados caen a
Escenas; en quieto (movimiento reducido, ahorro) todo queda visible. Con foco de teclado, el bloque se ve entero. Si un
capítulo no cabe en la pantalla, se cuenta como Escenas. Sumar un relato: su CSS en `src/relatos/css.ts`, su ficha en
`src/relatos/catalogo.ts` y un teléfono en `#relatos`. Pruebas: `npm test` y `scripts/verificar-relatos.mjs`.

## Biblioteca de diseños (23-11-2026)

Paso 4 del plan. `src/biblioteca/biblioteca.ts`, sin React. Misma forma que la tabla que tendrá La Mente
(`lamente-<amb>-paginas-biblioteca`): en el paso 5 se cambia el almacén, no los datos.

| Pieza | Qué hace |
|---|---|
| `DisenoBiblioteca` | `id`, `nombre`, `rubro`, `etiquetas`, `estado` (borrador, aprobado, archivado), `autor`, `receta` (v1), `vista` (tema y paleta de La Mente), `creado`, `actualizado` |
| `validarDiseno` | Errores en español con el campo, también los de la receta (`receta.titulo`) |
| `crearDiseno`, `editarDiseno`, `duplicarDiseno` | Nuevo en borrador; editar pone la fecha; la copia vuelve a borrador |
| `filtrarDisenos`, `etiquetasDe` | Por texto (sin tildes), rubro, estado y etiqueta; los archivados quedan fuera si no se piden |
| `exportarBiblioteca`, `importarBiblioteca` | Archivo `motion-kit/biblioteca` v1; gana la edición más nueva; lo que no sirve se informa |
| `almacenLocal()` / `AlmacenBiblioteca` | `localStorage` con respaldo en memoria (`persistente: false`); tope de 500 diseños |

Demo `#biblioteca` y editor `#encabezados?id=…`. Pruebas: `pruebas/biblioteca.test.ts` y `scripts/verificar-biblioteca.mjs`.

## Momentos por bloque (23-11-2026)

El efecto propio de cada bloque de La Mente, con los datos del bloque. Entrada `motion-kit/momentos` (11,9 KB gzip
con esta tanda y tope 12; desde la segunda tanda, 12,6 y tope 13; sorteo, antes y después, confeti y lo de las fotos vivas se bajan aparte). Diseño `docs/superpowers/specs/2026-11-23-momentos-por-bloque-design.md`,
plan `docs/superpowers/plans/2026-11-23-momentos.md`. Vitrina `#momentos`; prueba `scripts/verificar-momentos.mjs`.

| Bloque | Pieza | Qué hace |
|---|---|---|
| Sellos | `SellosEstampa` | Los sellos se estampan uno tras otro; el del premio late |
| Reseñas | `ResenasPila` | Estrellas que se llenan (fracciones), promedio que cuenta, pila que se pasa con el dedo |
| Precios | `CartaQueSeAbre`, `PrecioQueRueda` | Listas en abanico con la destacada iluminada; cifras como cuentakilómetros |
| Eventos | `CuentaRegresiva` | Cifras que se voltean, con la hora del negocio (cambio de hora incluido) |
| Ubicación | `MapaDibujado` | Plano inventado que aparece por capas y pin que cae; «Abierto ahora» |
| Galería | `MosaicoQueSeArma`, `AntesDespues` | Fotos impresas que caen a su lugar al bajar; deslizador antes y después |
| Sorteos | `SorteoRaspe`, `Confeti` | Raspar para ver el premio (o «Ver premio»); confeti si hay ganador |

Base: `resorte` (curva `linear()` por estilo; retro por pasos), `useMomento` (arranca al verse, tres niveles).
La segunda tanda (los catorce bloques que faltaban) está más abajo. Pendiente: B (resorte en `Movimiento` y repaso de
movimientos) y C (lista pendiente).
`AntesDespues` espera que La Mente decida cómo marca pares de fotos.

## Fotos vivas (23-11-2026)

Las fotos de la página se sienten vivas, con WebGL escrito a mano y cargado aparte. Diseño
`docs/superpowers/specs/2026-11-23-fotos-vivas-design.md`, plan `docs/superpowers/plans/2026-11-23-fotos-vivas.md`,
prueba `scripts/verificar-fotos.mjs [url] [encabezado|galeria|visor]`.

| Dónde | Cómo se prende | Qué hace |
|---|---|---|
| Encabezado | `fotoViva` en la receta v2 (casilla «Foto viva» en `#encabezados`) | La foto se arma desde partículas (una vez por carga; no con apertura), ondula bajo el dedo y cambia de toma con un borde líquido |
| Galería | `viva` en `MosaicoQueSeArma` | La foto que se toca ondula; un solo lienzo pasa de foto en foto |
| Galería | `visor` en `MosaicoQueSeArma` | Un toque abre la foto, que crece hasta llenar la pantalla (View Transitions o animación propia); diálogo con teclado y gestos |

Archivos en `src/fotos/`: `motor.ts` (ondas, partículas y líquido), `FotoVivaEncabezado.tsx`, `galeria.ts` (lienzo
itinerante), `gestos.tsx` (qué hacer con cada toque del mosaico), `VisorFotos.tsx` y `calculos.ts`.

Reglas: a lo más dos lienzos WebGL por página; solo en nivel completo (el visor también en liviano); la `<img>` real
sigue en la página y, si algo falla (sin WebGL, foto caída, contexto perdido), queda la foto normal. Fotos de otros
sitios: solo si su origen está en `origenesFotos` y el servidor da permiso CORS. Para las fotos de los dueños falta el
encargo `cerebro-aquiles/lamente/ENCARGO_2026-11-23_permiso-fotos-webgl.md`.

Pendiente: cartas o tarjetas que crecen y llevan a otra página (depende de las rutas de La Mente); fotos vivas en otros
bloques.

## Foto profunda (24-11-2026)

La foto del encabezado con profundidad real: lo que está cerca se mueve distinto de lo que está lejos. Diseño
`docs/superpowers/specs/2026-11-24-foto-profunda-design.md`, plan `docs/superpowers/plans/2026-11-24-foto-profunda.md`.
Vitrina `#profundidad`. Prueba: `scripts/verificar-fotos.mjs [url] profunda`.

| Qué | Cómo |
|---|---|
| Prenderla | `fotoProfunda: true` en la receta v2, en una composición con foto. No va con `fotoViva` ni con `tomas` (queda apagada, con aviso) |
| El mapa | `mapasFotos` en `Encabezado`: la dirección del mapa de cada foto de `imagenes`, en el mismo orden. No va en la receta. Sin mapa, queda la foto normal |
| Formato del mapa | Imagen en grises (JPG, PNG o WebP) con la proporción de la foto; más claro es más cerca. Se recomienda 256 px de ancho (2 a 5 KB); el motor lo suaviza a entre 64 y 160 puntos según el ancho del lienzo. Si su proporción no es la de la foto (más de un 4 % de diferencia), no se usa |
| Con qué se mueve | El cursor, el paso del encabezado por la pantalla y la inclinación del teléfono (en iPhone, si el encabezado ya pidió el permiso con `mover`) |
| Cuánto | Entre lo más cercano y lo más lejano hay hasta un 3,5 % del ancho de diferencia (cada punto se corre a lo más un 1,75 %). La foto va un 6 % acercada para que no asomen los bordes: el lienzo y también la foto de abajo, mientras el efecto esté pedido, así no hay salto cuando el lienzo aparece o se va |

Archivos: `src/fotos/calculo-profunda.ts` (lo calculable), `profunda.ts` (el motor WebGL, chico y aparte del de las
fotos vivas), `FotoProfunda.tsx` (la pieza, que se baja aparte) e `imagen.ts` (bajar una foto con permiso para WebGL,
con el reintento que salta la caché; lo comparte con las fotos vivas).

Detalles que cuidar (salieron de la revisión final):

- **El calce.** `Encabezado` marca la caja de la foto con `data-foto-profunda` y el CSS acerca la `<img>` un 6 %
  (1,113 con las capas de profundidad, que ya la acercan un 5 %). Si cambia `ACERCAR`, cambian esos dos números.
- **Memoria.** La foto pasa por un lienzo 2D antes de subirla: lado mayor de 1600 px y el tope de la tarjeta gráfica.
- **Batería.** La inclinación va de a un grado y con holgura (`pasoFirme`); fuera de la vista no se mide. El efecto
  llega y duerme cuando lo que falta ya no se ve (`llegoA`).
- **Entradas.** Con la entrada `zoom` (la única que anima la `<img>` y no su caja), el lienzo espera a que termine.

**En pausa (decisión de Aquiles, 24-11-2026):** por ahora no se usan modelos de IA, así que nadie calcula mapas y el
efecto queda dormido (sin mapa, la foto se ve normal). «El sujeto sale del marco», que dependía de un modelo de
recorte, tampoco se construye por ahora. Se retoma cuando Aquiles lo diga (`cerebro-aquiles/DECISIONES.md`).

**De dónde sale el mapa.** De un modelo abierto de profundidad (Depth Anything V2 Small, Apache-2.0), una vez por foto.
No es parte del paquete: corre donde se sube la foto. En la prueba del 24-11, en un navegador y sin tarjeta gráfica,
tomó 4,2 a 4,6 segundos por foto; quien edita baja 3 MB del motor que lo corre, más el modelo. La vitrina trae el
código de referencia (`demo/Profundidad.tsx`, función `calcular`). Ojo con las licencias: las versiones más grandes de
ese modelo son solo para uso no comercial.

Reglas: solo en nivel completo; dibuja solo mientras algo cambia y se detiene fuera de la vista; el mapa se suaviza al
cargarlo (si no, los bordes de las cosas se ven dentados); si falta WebGL, la foto, el mapa o el permiso CORS, o se
pierde el contexto, queda la foto normal. Vale el mismo `origenesFotos` de las fotos vivas.

Pendiente: la galería y las fotos de productos; combinarla con la foto viva y con las tomas; un control de cuánta
profundidad. Para La Mente: `cerebro-aquiles/lamente/ENCARGO_2026-11-24_foto-profunda.md`.

## Dedo y física (23-11-2026)

Nueve efectos que responden al dedo o al cursor, o que tienen física propia. Se eligen desde las recetas, se bajan
aparte cuando se usan y solo corren en nivel completo. Diseño
`docs/superpowers/specs/2026-11-23-dedo-y-fisica-design.md`, plan `docs/superpowers/plans/2026-11-23-dedo-y-fisica.md`,
prueba `scripts/verificar-dedo.mjs [url] [parte]`, con las partes `pila`, `descifrar`, `iman`, `colgante`, `impulso`, `caida`,
`constelacion`, `estela`, `limpieza` (al salir no queda nada vivo), `sinlienzo` (sin Canvas ni WebGL) y `angosto` (360 px).

| Efecto | Cómo se prende | Qué hace |
|---|---|---|
| Cartas apiladas | `relato: "pila"` (página o bloque) | Cada bloque queda pegado arriba y el siguiente sube y lo tapa; el tapado se achica un poco |
| Texto que se descifra | `efectoTexto: "descifrar"` | El título parte en signos y se aclara letra por letra; el lector de pantalla lee siempre el texto real |
| Letras con imán | `iman: true` en el encabezado | Las letras del título se apartan del dedo o del cursor y vuelven con rebote |
| Letrero colgante | `colgante: true` (solo con la composición `letrero`) | El marco cuelga de dos cuerdas y se balancea al abrir y al tocarlo; al bajar la página se ladea apenas. Con el cursor encima queda quieto, para que sus botones no se muevan |
| Inclinación por velocidad | `relatoPagina: "impulso"` | Mientras más rápido se baja, más se inclinan los bloques (hasta 1,5°); al parar se asientan con un rebote corto |
| Objetos del rubro que caen | `efecto`: `granos`, `tijeras`, `huellas`, `pesas` o `lapices` | Caen, se apilan al fondo del encabezado y el dedo o el cursor los empuja; un toque los dispersa |
| Constelación | `efecto: "constelacion"` | Puntos que derivan y se unen con líneas; el cursor los atrae y se suma a la red |
| Lámpara de lava | `shader: "lava"` | Manchas de color que suben, bajan y se funden; el dedo suma una |
| Estela y chispas | `estela: true` en la receta de página | El cursor deja una estela sobre la página; un toque (dedo o lápiz) suelta chispas. Empezar a bajar la página no cuenta como toque |

Archivos: `src/dedo/` (imán, letrero, inclinación, estela y sus cálculos), `src/relatos/Pila.tsx`,
`src/estilos/descifrar.ts`, `src/efectos/caida/` (física, dibujos y lienzo), `src/efectos/fondos/Constelacion.tsx`,
`src/efectos/lienzo.ts` (lo común de los lienzos 2D) y el fragmento `lava` de `src/escena/ShaderFondo.tsx`.
`useAparte` (`src/utils/aparte.ts`) monta una pieza que se baja con `import()`; si no baja, la página sigue.

Reglas: sin librerías (la física es propia: gravedad, choques entre círculos, roce que agarra y cuerpos que se
duermen) y sin azar (todo sale de una semilla). Los lienzos dejan su estado en `data-estado` (`vivo`, `pausa` o
`quieto`), se detienen fuera de la vista y con la pestaña oculta, y al salir no dejan bucles, oyentes ni lienzos (parte
`limpieza` de la prueba). En liviano o con movimiento reducido, los objetos quedan como una pila en reposo y la
constelación como un cuadro quieto con menos puntos; imán, letrero, inclinación y estela no se montan.

Para quien arma la página: las cartas apiladas necesitan que los bloques vayan seguidos (hermanos directos) y un fondo
en `--mk-fondo` o `--lm-fondo`; una carta se despega solo con el foco del teclado, nunca con un clic. `TextoCinetico`
tiene la prop `letras`, que deja cada letra en su span también en los efectos por palabra (la usa el imán).

Pesos al cargar (gzip, 24-11-2026): principal 78,8 KB (tope 80), encabezado 33,4 (35), página 15,4 (17), momentos 11,9
(12), escena 14,4 (16) y receta 9,5 (10). No se subió ningún tope: los medidores del editor salieron de la entrada
principal y la página dejó de cargar el componente `Estilo` (solo lee su contexto, `src/estilos/contexto.ts`).

Pendiente: la tanda que sigue es «escenas por capas» (motor de escenas, diorama, título con volumen y tarjeta
holográfica; anotada en `docs/superpowers/plans/2026-11-23-de-sencillo-a-potente.md`, «Por diseñar»). Después: carta
que se abre como libro, carrusel 3D, fuegos artificiales y ecualizador con sonido real. Y sugerir la lava y los objetos
que caen en `encabezadoPorRubro`.

## Momentos, segunda tanda, y fondos vivos de lienzo (24-11-2026)

Los catorce bloques de La Mente que no tenían momento, y cinco fondos del tipo de la constelación. Diseño
`docs/superpowers/specs/2026-11-24-momentos-2-y-fondos-design.md`, plan
`docs/superpowers/plans/2026-11-24-momentos-2-y-fondos.md`. Vitrinas `#momentos` («Segunda tanda») y `#efectos`.
Viaja desde la etiqueta `v0.4.0`.

Los ocho bloques con datos. Todas las piezas salen de `motion-kit/momentos`, se bajan aparte y aceptan `respaldo`
(lo que se ve mientras llega el archivo, y si no llega):

| Bloque | Pieza | Qué hace |
|---|---|---|
| Calendario | `FechasQueVienen` | Hojas de calendario que se voltean una tras otra; la de hoy encendida; «cerrado» tachado |
| Clases | `ClasesDeHoy` | Hoy y mañana; cupos en texto («Queda 1» late); barra si viene el total; la próxima clase resaltada |
| Novedades | `NovedadesQueLlegan` | Tarjetas que caen como correo; «Nuevo» si tiene 7 días o menos |
| Enlaces | `EnlacesDomino` | Botones que se levantan como fichas de dominó; solo `http` y `https` |
| Episodios | `EpisodiosOnda` | Onda de barras que se mueve solo mientras suena ese audio (`<audio controls>` del navegador) |
| Secciones | `SeccionesVivas` | Acordeón con `<details>`, pasos que se estampan, equipo en cascada, texto |
| Avisos | `AvisoQueSeDespliega` | La franja se despliega y el texto se descifra en menos de un segundo; confeti en «celebración» |
| Cinta | `CintaConImpulso` | El lema corre de lado y sigue la velocidad del scroll; con `quieta`, centrado y sin moverse |

Los seis bloques que son solo un botón a otra página usan una pieza común, `LlamadoConVida`, con la prop `escena`:
`agenda` (hoja que se voltea), `pedidos` (bolsa; con `abierto`, un punto que late), `buzon` (sobre que se abre),
`cotizaciones` (hoja que se escribe), `encuestas` (casilla que se marca) y `contacto` (burbuja que «escribe»). Es
decoración (`aria-hidden`, sin toques): el título, el texto y el botón siguen siendo los de La Mente.

Los cinco fondos, elegibles con `efecto` en la receta del encabezado (v2, sin versión nueva):

| `efecto` | Qué se ve | Con el dedo o el cursor |
|---|---|---|
| `bandada` | Aves chicas que vuelan juntas y giran | La bandada lo esquiva |
| `luciernagas` | Luces que derivan y se encienden y apagan a su ritmo | Las cercanas se encienden |
| `corrientes` | Trazos finos que siguen corrientes y dejan estela | Las corrientes lo rodean |
| `gotas` | Ondas que se abren y se apagan, como gotas en el agua | Cada toque o movimiento suelta una |
| `relieve` | Líneas que dibujan un terreno que ondula | Se levanta un cerro |

Archivos: `src/momentos/` (una pieza por archivo, `aparte.tsx`, `perezosos-2.tsx`, `calculos-2.ts`,
`escenas-llamado.tsx`) y `src/efectos/fondos/` (`fondo.ts` con lo común, y un `calculo-*.ts` más su componente por
fondo). Pruebas: `pruebas/momentos2.test.ts`, `pruebas/fondos.test.ts`, `scripts/verificar-momentos2.mjs [url] [parte]`
(partes `base`, `fechas`, `clases`, `novedades`, `enlaces`, `episodios`, `secciones`, `aviso`, `cinta`, `llamado` y
`cierre`) y la parte `fondos` de `scripts/verificar-dedo.mjs`.

Regla de los fotogramas (aislada con un experimento el 24-11): dentro de un `@keyframes` no va la propiedad `scale`
suelta con `calc()` (por ejemplo `scale:1 calc(var(--h)*.35)`): hace caer la pestaña en Chromium. Sí se puede
`transform: scale(…)`, y `translate` o `rotate` sueltos con variables. La vigila una prueba unitaria en todo `src/`. Los fondos corren a 30
dibujos por segundo, quedan en pausa fuera de la vista y con la pestaña oculta, y con movimiento reducido o en nivel
liviano dejan un solo cuadro.

Pesos al cargar (gzip, 24-11-2026): principal 79,1 KB (tope 80), encabezado 33,7 (35), página 15,4 (17), momentos 12,6
(**13**, era 12; Aquiles aprobó hasta 14 como máximo), escena 14,4 (16) y receta 9,6 (10). La entrada principal quedó
a menos de 1 KB de su tope: lo próximo que sume ahí tiene que bajarse aparte.

Cosas que conviene saber:

- **Sorpréndeme:** con cinco fondos más en el registro hay más candidatos por rubro, así que una misma semilla puede
  dar un encabezado distinto que en `v0.3.0`.
- **Prueba que era inestable, arreglada el 24-11-2026:** `scripts/verificar-biblioteca.mjs` falló dos veces («su
  miniatura muestra el título nuevo») dentro de la batería completa y pasaba siempre sola. Era de tiempos: leía la
  miniatura al tiro. Ahora la espera hasta 5 segundos.
- **Las piezas con hora** (`FechasQueVienen`, `ClasesDeHoy`) se vuelven a dibujar cada medio minuto con la pestaña a la
  vista. Si se les pasa `hoy`, ese valor lo pone al día quien arma la página.
- **`SeccionesVivas` no pone `id`** en sus secciones: las anclas son de quien arma la página.
- **Contraste del aviso «importante»:** usa el color «sobre acento» del estilo; con paletas de La Mente de acento claro
  hay que revisar que llegue a 4,5:1 (no se midió con las paletas reales).

Para La Mente: `cerebro-aquiles/lamente/ENCARGO_2026-11-24_momentos-2-y-fondos.md` (qué pieza va en cada bloque y con
qué datos). `ClasesDeHoy` dibuja la barra de cupos solo si La Mente manda el total (`cupos`), que hoy no manda.

## Efectos vistosos: fuegos artificiales, carrusel giratorio y libro que se abre (24-11-2026)

Tres piezas más de `motion-kit/momentos`: alternativas más vistosas para bloques que ya tenían su momento. Se bajan
aparte y aceptan `respaldo`. Diseño `docs/superpowers/specs/2026-11-24-efectos-vistosos-design.md`, plan
`docs/superpowers/plans/2026-11-24-efectos-vistosos.md`. Vitrina `#momentos` («Efectos vistosos»). Prueba:
`scripts/verificar-momentos3.mjs [url] [fuegos|carrusel|libro|cierre]` (la parte `cierre` las prueba en Safari/WebKit).

| Pieza | Para qué bloque | Qué hace |
|---|---|---|
| `FuegosArtificiales` | Sorteos y otras celebraciones | Ráfagas de chispas que suben, revientan y caen (lienzo 2D). Dura unos 3 segundos y se quita sola. `SorteoRaspe` la usa con `celebracion: "fuegos"` (por defecto sigue el confeti) |
| `CarruselGiratorio` | Galería, o carta con fotos | Fichas con foto en un anillo que gira con el dedo, con impulso, y se detiene justo en una. Botones y flechas del teclado |
| `LibroQueSeAbre` | Carta de precios | La tapa se abre sola una vez al verse y las hojas se pasan. Dos páginas en pantalla ancha; una en el teléfono |

Qué reciben:

| Pieza | Props |
|---|---|
| `FuegosArtificiales` | `semilla` (número; si cambia, parte de nuevo), `rafagas?` (1 a 5; 3), `alTerminar?` |
| `CarruselGiratorio` | `fichas: { url?, alt?, titulo?, pie?, precio?, href?, agotado? }[]` (las primeras 12), `etiqueta?` (el nombre para lectores), y las comunes (`nivel`, `ahorro`, `className`) |
| `LibroQueSeAbre` | `tapa: { titulo, bajada?, imagen? }`, `hojas: { titulo, lineas: { texto, detalle?, precio?, agotado? }[] }[]`, y las comunes |

Reglas que cuidar:

- **Niveles.** En liviano, quieto (movimiento reducido) o sin 3D: el carrusel es una fila que desliza el navegador y el
  libro es la carta plana, una hoja debajo de otra. Los fuegos, con movimiento reducido, no dibujan y avisan de inmediato.
- **Todo se puede leer siempre.** Las fichas y las hojas están en la página aunque no se vean. En el carrusel solo el
  enlace de la ficha del frente está en el orden del teclado; tocar una ficha de lado la trae al frente. En el libro,
  el texto completo va en una capa que no se ve (`.mk-m-libro-texto`, que también da el alto del libro) y las hojas
  que se ven son decoración (`aria-hidden`).
- **Memoria en teléfonos.** El libro dibuja en 3D solo las hojas cercanas a la que se lee (cuatro a lo más): cada
  hoja es una capa en la tarjeta gráfica y una carta de dieciséis no cabría. Sin comprobar en un iPhone real.
- **Colores de los fuegos.** Los del tema (`acento`, `acento-2`); si el del tema no tiene color (negro, gris, blanco),
  uno festivo: dorado, rojo o celeste.
- **Lectores de pantalla.** Que el carrusel entre girando o que el libro se abra solo no se anuncia; desde que alguien
  los mueve, sí. Mientras el carrusel gira, el foco espera en el carrusel y al detenerse pasa a la ficha del frente.
- **Pocas fichas.** Con 3, 4 o 5 el anillo las repite (6, 8 o 10 puestos); las copias son decoración. Con menos de 3 van
  en fila.
- **Carta larga.** Un grupo con más de 10 líneas sigue en la hoja siguiente («Cafés (sigue)»). Tope: 16 hojas.
- **Nada queda corriendo.** El carrusel duerme al detenerse; el libro solo usa transiciones; los fuegos se detienen
  fuera de la vista o con la pestaña oculta y siguen donde iban.
- **Peso.** La entrada `momentos` quedó en 12,9 KB de 13: la próxima pieza necesita subir el tope o ir en otra entrada.
  Aparte: fuegos 2,4 KB, libro 4,3 y carrusel 5,2.
- **Safari antes de la 16** no tiene medidas de contenedor (`cqi`): el ancho de la ficha y el título de la tapa
  tienen un valor de respaldo.

No entraron: **título con volumen** y **tarjeta holográfica**. Por la decisión del 24-11 pasan a ser partituras del
Director, y el modelo de la partitura (versión 0) todavía no inclina en 3D: van con la fase 2 del Director.
Pendiente también: fuegos en sellos completos y en la cuenta regresiva en cero (dos props); ecualizador con sonido real.
Para La Mente: `cerebro-aquiles/lamente/ENCARGO_2026-11-24_efectos-vistosos.md`.

## Director: el motor de animación propio (fase 1, 24-11-2026)

Un movimiento deja de ser una pieza escrita a mano y pasa a ser un **dato**: una partitura. El Director la hace correr
con lo que el navegador ya trae. Análisis y plan general: `docs/superpowers/specs/2026-11-24-motor-de-animacion-analisis-y-plan.md`.
Diseño de esta fase: `docs/superpowers/specs/2026-11-24-director-fase-1-design.md`. Plan:
`docs/superpowers/plans/2026-11-24-director-fase-1.md`. **Desde la fase 2 (más abajo) el modelo es la versión 1:** lo
que sigue al puntero lleva su cambio en `a`, y hay inclinación en 3D. Lo demás de esta sección sigue valiendo.

Entrada `motion-kit/director` (9,8 KB gzip al cargar desde la fase 2, tope 10; 1,5 KB más se bajan aparte si la
partitura sigue al cursor o a la velocidad). Vitrina `#director`.

| Qué | Dónde | Para qué |
|---|---|---|
| El modelo y sus topes | `src/director/modelo.ts` | Qué puede decir una partitura |
| `validarPartitura` | `src/director/validar.ts` | Lo que no calza no vale, con mensaje y campo |
| `montar` | `src/director/montar.ts` | El Director: tres ejecutores y las reglas de la casa |
| `ConPartitura`, `usePartitura` | `src/director/ConPartitura.tsx` | Para React |
| `montarSeguir` | `src/director/seguir.ts` | Lo que sigue al cursor o a la velocidad (el compás); se baja aparte |
| `PARTITURAS` | `src/director/partituras.ts` | Seis ejemplos (portada, tarjetas, paralaje, iman, inercia y boton). Están en la vitrina; todavía no viajan en el paquete |
| Contrato | `contrato/partitura-motionkit.json` | Generado desde el modelo (`npm run contrato`) |

Las seis señales (`con`):

| Señal | Cuándo corre | Cómo |
|---|---|---|
| `verse` | Una vez al verse la raíz (o cada vez, con `repetir`) | Animación nativa por tiempo |
| `estado` | Mientras un actor está `apuntado`, `enfocado` o `apretado` | Animación nativa; al salir se devuelve |
| `vista` | Mientras la raíz entra, sale o cruza la pantalla | Línea de tiempo de vista (o respaldo) |
| `scroll` | Con el avance de la página entera | Línea de tiempo de scroll (o respaldo) |
| `puntero` | Sigue al dedo o al cursor sobre la raíz | El compás, con resorte |
| `velocidad` | Sigue a la velocidad del scroll y vuelve a cero | El compás, con resorte |

Cómo se usa:

```tsx
import { ConPartitura, type Partitura } from "motion-kit/director";

const portada: Partitura = {
  version: 1,
  escenas: [
    { con: "verse", pasos: [
      { actor: "antetitulo", de: { y: 28, opacidad: 0 }, dura: 800, en: 50 },
      { actor: "titulo", por: "palabra", mascara: true, de: { y: "135%" }, dura: 800, cada: 90, en: 150 },
      { actor: "bajada", de: { y: 28, opacidad: 0 }, dura: 800, en: 550 },
      { actor: "botones", por: "hijo", de: { y: 28, opacidad: 0 }, dura: 700, cada: 90, en: 850 },
    ] },
    { con: "vista", tramo: "salida", pasos: [{ actor: "contenido", a: { y: "-14%", opacidad: 0 } }] },
  ],
};

<ConPartitura partitura={portada}>
  <div data-mk-parte="contenido">
    <p data-mk-parte="antetitulo">Tostaduría de barrio</p>
    <h1 data-mk-parte="titulo">Café de especialidad</h1>
    <p data-mk-parte="bajada">Tostamos cada semana.</p>
    <div data-mk-parte="botones"><a href="#pedir">Pedir</a></div>
  </div>
</ConPartitura>
```

Reglas del modelo que conviene saber:

- **La partitura no trae selectores**, solo nombres de partes. Quien monta puede pasar un mapa (`partes`) para piezas
  que no llevan `data-mk-parte`.
- **Un actor sigue a una sola señal continua** (`vista`, `scroll`, `puntero`, `velocidad` o `estado`). Para sumar dos,
  un actor dentro de otro. Las escenas `verse` se suman a cualquiera: escriben en otro canal (`transform`; las
  continuas, en `translate`, `rotate` y `scale`).
- **La opacidad de un actor es de una sola escena.**
- **`por`** reparte un movimiento entre los hijos, las palabras o las letras de un actor. El Director corta el texto
  sin romper React: el nodo original queda vacío en su lugar, y vuelve a estar entero cuando termina la entrada (o al
  desmontar, si lo usa una escena que se repite o una atada al scroll). Un actor se corta de una sola forma.
- **Topes para partituras de usuarios:** el estado final de una entrada (`a` en `verse`) no baja de 0,5 de opacidad ni
  de 0,5 de tamaño, ni se corre más de 200 px; una escena dura a lo más 20 s; una partitura arma a lo más 600
  animaciones y 100 elementos que siguen. `ConPartitura` recorta en los dos sentidos (`recortar`).
- **Lo que se aprieta nunca queda escondido:** con el foco encima, o con el cursor antes de que le toque entrar, la
  pieza termina de una vez; a media entrada se detiene donde va.
- **Niveles:** `quieto` (o «reducir movimiento»): nada se anima. `liviano`: las entradas solo funden y duran a lo más
  400 ms; nada sigue al cursor ni a la velocidad.
- **Reloj manual** (`reloj: "manual"`): nada avanza solo; `irA`, `avanzar` y `senal` lo mueven. Es lo que usa la prueba
  genérica para detener todo en un instante y medir.

Pruebas: `pruebas/director.test.ts` y `scripts/verificar-director.mjs [url] [parte] [ejemplo]`, con las partes `reglas`
(diez reglas de la casa sobre cada ejemplo), `senales`, `react`, `sin` (sin observadores ni animaciones nativas),
`hostil` (partituras rotas) y `vitrina`.

Lo que **no** está todavía (fases 3 a 6 del plan): la capa gráfica compartida, los peldaños continuos y el Estudio en
La Mente. El lenguaje en texto llegó en la fase 2; traspasar piezas existentes se descartó ahí (pesan menos como están).

Las recomendaciones de la revisión final de esta fase se hicieron en la fase 2 (lo que sigue usa un `Cambio`; el
contrato trae los números de las curvas, los resortes y las fórmulas de los tramos; `reparto`; `subirPartitura`).
Limitaciones conocidas: mientras un texto está cortado pierde el subrayado de los enlaces y el
ajuste entre letras; una partitura dentro de otra no comparte actores; lo que sigue al cursor escribe en el estilo en
línea del elemento (si React también lo usa para `scale` u `opacity`, se pisan); y con render en el servidor el texto
se ve entero un instante antes de entrar.

## Director, fase 2: el lenguaje en español, la versión 1 y la inclinación (24-11-2026)

Lo que permite **crear** partituras rápido. Diseño `docs/superpowers/specs/2026-11-24-director-fase-2-design.md`, plan
`docs/superpowers/plans/2026-11-24-director-fase-2.md`. No reemplaza ninguna pieza que ya existe: medido el 24-11, los
12 efectos de texto pesan 3,4 KB y el Director 9; por la regla de Aquiles («pesa menos o se detiene»), el traspaso no va.

**Dos entradas:**

| Entrada | Para quién | Peso al cargar |
|---|---|---|
| `motion-kit/director` | Las páginas: hace correr una partitura | 9,8 KB (9.814 bytes; tope 10) |
| `motion-kit/partitura` | Quien crea (el Estudio, nosotros): el lenguaje, la subida de versión, las de la casa y «Sorpréndeme» | 8,1 KB (8.133 bytes; tope 9, fijado por Aquiles el 24-11-2026) |

**Partitura versión 1** (el Director corre solo esta):

- `Cambio` suma `inclinaX` (se vuelca) e `inclinaY` (se ladea), en grados. La profundidad (900 px) la pone el
  Director: en `verse` va dentro del movimiento; en lo continuo y en `estado`, en el padre de lo que se inclina
  (`perspective`), con cuenta de quién la puso, y se quita al desmontar (si la página puso la suya, antes o después,
  no se toca).
- **Límite conocido de esa profundidad:** mientras la partitura está montada, el padre de lo que se inclina ordena y
  ubica a sus hijos como lo haría uno con `transform`: un hijo `position: fixed` se ubica respecto de él (medido: de
  10,10 pasa a 100,2050 en la prueba) y los `z-index` de sus hijos no salen de él. Si el actor es la raíz de la
  partitura, ese padre queda fuera de la raíz. Solo pasa con partituras que inclinan en lo continuo o en `estado`.
  Para evitarlo: que lo fijo no viva dentro del padre de un actor que se inclina.
- Un texto cortado **por palabra** lleva cada palabra en una caja propia (antes, solo con máscara): sin ella la
  profundidad no se veía. Medido: cada pieza volcada 60° se ve 2 % más ancha, por letra y por palabra.
- `estado` inclina también en nivel `liviano` (a lo más 4°): un estado es chico y lo manda la persona, así que va
  igual en todos los niveles menos `quieto`, como ya pasaba con lo demás del estado.
- Lo que sigue al puntero o a la velocidad lleva su cambio en `a` (`{ actor, a: { x: 16, inclinaY: 8 }, resorte }`).
  Se inclina hacia donde está el cursor.
- En lo continuo un paso **gira o se inclina**, no las dos cosas (comparten `rotate`).
- `reparto` (0,05 a 1) en lo atado al scroll: qué parte del tramo ocupa cada pieza cuando un paso reparte con `por`.
- Topes de inclinación: 90° de partida, 15° en lo que una entrada deja puesto, 25° siguiendo al puntero, 4° en `estado`.
- Una partitura de la versión 0 se sube con `subirPartitura` (de `motion-kit/partitura`). No viaja con el Director,
  para no pesarle a las páginas: nadie fuera de este repo guardó versión 0.
- El contrato (`contrato/partitura-motionkit.json`) es versión 1, ya no dice experimental, y trae lo necesario para
  reproducir el movimiento fuera del navegador: las curvas, los resortes, la profundidad, cómo se aplica la
  inclinación (`inclinacion`), lo que vale por defecto (`porDefecto`), cómo se sigue al puntero y a la velocidad
  (`seguir`: las señales, los signos, el paso del resorte) y las fórmulas de los tramos. Trae además **casos
  calculados por el mismo código** (`seguir.casos`, `seguir.casoResorte`, `tramos.casos`) para que la app compare.
- Cada animación del Director lleva nombre (`id`): `mk-verse`, `mk-estado`, `mk-vista`, `mk-scroll`.

**El lenguaje en español** (`leerPartitura(texto)` y `escribirPartitura(partitura)`): otra forma de escribir el mismo
dato. No ejecuta nada. Lo leído pasa por `validarPartitura`; los errores vuelven con su línea.

```
partitura portada

al verse:
  antetitulo desde abajo 28px, aparece, 800ms, en 50ms
  titulo desde abajo 135%, por palabra, con máscara, 800ms, cada 90ms, en 150ms

al salir de la vista:
  contenido sube 14%, se apaga

con el puntero:
  tarjeta se inclina 6 grados, resorte firme
```

| Escena | Se escribe |
|---|---|
| `verse` | `al verse:` · `cada vez que se ve:` (con `repetir`) |
| `vista` | `al entrar a la vista:` · `al salir de la vista:` · `al cruzar la pantalla:` · `con la vista:` |
| `scroll`, `puntero`, `velocidad` | `con el scroll:` · `con el puntero:` · `con la velocidad:` |
| `estado` | `al apuntar <actor>:` · `al enfocar <actor>:` · `al apretar <actor>:` (el actor es opcional) |

| Frases | Qué ponen |
|---|---|
| `desde abajo 28px` · `desde arriba 20px` · `desde la izquierda 40px` · `desde la derecha 120%` · `aparece` · `aparece desde 0.15` · `crece desde 0.8` · `gira desde -8 grados` · `se levanta desde -70 grados` · `se abre desde 60 grados` | De dónde parte (`de`) |
| `sube 14%` · `baja 20px` · `va a la izquierda 30px` · `va a la derecha 30px` · `se apaga` · `se apaga a 0.6` · `se enciende` · `crece a 1.05` · `se achica a 0.95` · `gira 6 grados` · `se inclina 6 grados` · `se vuelca 8 grados` · `se ladea 10 grados` | A dónde llega, o cuánto cambia con la señal (`a`) |
| `por letra` · `por palabra` · `por hijo` · `con máscara` · `800ms` · `1.2s` · `cada 90ms` · `en 150ms` · `luego` · `junto 80ms` · `curva suave` · `resorte firme` · `entre 60% y 100%` · `reparto 30%` | Cómo y cuándo |

Reglas:

- Con o sin tildes y mayúsculas. El nombre de un actor se pasa a minúsculas, pero no se le quitan tildes ni «ñ»: un
  actor `título` no vale y se dice (un nombre no se cambia en silencio).
- `#` es comentario, menos en la línea del nombre (`partitura Oferta #1` se llama «Oferta #1»).
- Toda frase que mueve lleva su número (`desde arriba 20px`, `se vuelca 8 grados`). El signo va en el verbo (`sube`,
  no `baja -14px`). Los decimales van con punto.
- Una escena se entiende también sin los dos puntos (`al verse`).
- Una frase fuera de su escena, repetida o desconocida es error con su línea (a lo más 20). Un texto enorme o con
  caracteres raros no lo vuelve lento (120.000 «#» seguidos: bajo 300 ms).
- **Ida y vuelta:** leer lo que se escribió da la misma partitura (probado con los ejemplos, valores de borde y 200
  partituras con semilla). Lo que da igual vuelve en su forma canónica: `repetir: false` y `mascara: false` no se
  escriben, `"12.50%"` vuelve `"12.5%"`, el nombre vuelve sin espacios de más, y un número guarda tres decimales.
- `escribirPartitura` exige una partitura que vale: con otra cosa lanza un error que dice por qué.

**Partituras de la casa** (`CASA`, 16): para elegir y combinar al crear.

| Grupo | Cuáles | Nota |
|---|---|---|
| Efectos de texto | `revelar`, `trailer`, `maquina` | Iguales al original (0,00 de diferencia, medido letra por letra) |
| | `voltear`, `impacto`, `rebote`, `caer` | Parecidos: el rebote lo da la curva `resorte`; `voltear` usa la profundidad del Director |
| Entradas del encabezado | `cascada`, `deslizar`, `zoom` | Con las partes `antetitulo`, `titulo`, `bajada`, `botones`, `media`, `contenido` |
| Momentos | `sellos`, `correo`, `domino`, `hojas` | Una grilla que entra en cadena (partes `grilla` y `rotulo`) |
| Nuevas | `titulo-con-volumen`, `tarjeta-holografica` | Con inclinación. El volumen del título es un estilo de la página (copias del texto apiladas con `text-shadow`: ver `.dir-volumen` en `demo/demo.css`) |

No se pueden decir con el modelo (y no se forzaron): `encender` (parpadeo de varios pasos), `temblor` y `onda` (ciclos
sin fin), `glitch` (copias de color) y `descifrar` (cambia las letras).

**`sorprender(semilla, partes)`**: arma una entrada para las partes de la página. La misma semilla da siempre la
misma; siempre vale; sin modelos de IA.

**Safari:** `verificar-director` pasa entero con Chromium (110 revisiones) y con WebKit (107, `node scripts/en-safari.mjs
director`; se saltan con su razón las que comparan contra líneas de tiempo de scroll nativas). Las 10 diferencias del
sondeo eran de la prueba, no del Director.

Pruebas: `pruebas/director2.test.ts`, `pruebas/partitura-texto.test.ts` y las partes `inclina` y `casa` de
`scripts/verificar-director.mjs`. Vitrina `#director`: cada ejemplo se edita en español o como dato; abajo, «De la
casa» y «Sorpréndeme».

De paso se arregló algo de la fase 1 que encontró la revisión final: cada vez que se apuntaba algo con `estado` se
gastaba una del tope de 600 animaciones, y después de unos cientos de pases el estado dejaba de animarse. Ahora la
devuelve al volver al reposo.

Pendiente: la señal `dato` (cupos, sellos, precios); la capa gráfica y los peldaños (fases 3 y 4); el Estudio en La
Mente (encargo `cerebro-aquiles/lamente/ENCARGO_2026-11-24_partitura-y-lenguaje.md`). Margen de `director`: 186 bytes
(9.814 de 10.000); lo próximo grande que se sume ahí obliga a bajar aparte la inclinación de `verse`.

### El encabezado dentro de una partitura (25-11-2026)

Para que una partitura mueva un `Encabezado` de verdad (lo pidió La Mente para conectarla en la página pública):

- **El encabezado marca sus partes** con `data-mk-parte`, siempre: `antetitulo`, `titulo` (el `h1`), `bajada`,
  `botones`, `media` (cada foto; tres en «viñetas») y `contenido` (la caja). Son los nombres que usan las partituras
  de la casa y «Sorpréndeme». Una parte que no está (sin antetítulo, sin botón) no se marca.
- **`sinEntrada`** (prop de `Encabezado`, no va en la receta): apaga la entrada del encabezado y el efecto de su
  título, para que las partes no se muevan dos veces. Quien envuelve el encabezado en `ConPartitura` la pasa. Sin
  ella, el encabezado sigue como siempre. No alcanza con `entrada: "ninguna"`: el título siempre trae un efecto.
- `TextoCinetico` gana `cuando="nunca"`: el texto queda quieto y entero (lo mueve otro).
- Nada del encabezado es `position: fixed` dentro del padre del título ni del de la caja: la profundidad que el
  Director pone ahí para inclinar no descoloca nada. Lo fijo (la barra de salida, la estela) va fuera.
- Pendiente: la composición «tarjeta» no tiene todavía una capa de brillo, así que «Tarjeta holográfica» solo la
  inclinaría. No se ofrece hasta que la tenga.

Prueba: `scripts/verificar-director.mjs [url] encabezado` y `pruebas/encabezado-partes.test.ts`. Peso: `encabezado`
pasa de 34,0 a 34,2 KB (tope 35).

## Luz y materia: una sola luz para la página (24-11-2026)

Para que una página se vea como objetos sobre una mesa, iluminados por una sola luz. Diseño
`docs/superpowers/specs/2026-11-24-luz-y-materia-design.md`, plan `docs/superpowers/plans/2026-11-24-luz-y-materia.md`.
Entrada **`motion-kit/luz`** (6,6 KB gzip al cargar, con su CSS adentro; tope 8, fijado por Aquiles) y
`motion-kit/estilos-luz.css` (2,7 KB). Vitrina `#luz`. No se exporta desde la entrada principal. Viaja desde la
etiqueta `v0.5.0`.

| Qué | Dónde | Para qué |
|---|---|---|
| `Luz` | `src/luz/Luz.tsx` | Envuelve la página o una sección y deja la luz en variables CSS de su raíz |
| `Materia` | `src/luz/Materia.tsx` | Una superficie que responde a la luz: sombra según su altura y brillo según su material |
| `TarjetaHolografica`, `TituloConVolumen` | `src/luz/Piezas.tsx` | Dos piezas nuevas |
| `usePermisoInclinacion` | `src/luz/Luz.tsx` | Para pedir, con un botón, el permiso de inclinación en iPhone |
| Lo calculable | `src/luz/calculo-luz.ts` | Dónde está la luz, la luz de cada hora y la sombra de cada altura |
| El seguidor | `src/luz/seguir-luz.ts` | Junta cursor, scroll e inclinación; duerme cuando nada cambia |

**`Luz`** pone en su raíz `data-mk-luz` y:

- `--mk-l0x`, `--mk-l0y`: de dónde viene la luz **en reposo** (cada eje de -1 a 1). Por defecto, de arriba a la
  izquierda (-0,45; -0,8). La usan las sombras fijas.
- `--mk-lx`, `--mk-ly`: la luz **ahora** (el reposo más lo que la persona la movió). La usan los brillos y las sombras
  de las superficies.
- `sigue`: `"puntero"` (cursor o dedo, medido contra la pantalla), `"scroll"`, `"inclinacion"` (el teléfono, según
  cómo está girada la pantalla; sin probar en un teléfono de verdad) y `"hora"`. Por defecto `["puntero", "scroll"]`.
- **Con `"scroll"`, cada superficie sabe por dónde va en la pantalla:** su brillo se corre mientras pasa, como bajo una
  lámpara fija. Lo hace el navegador solo (una animación atada al scroll, sin código ni escuchadores) en Chrome y en
  Safari desde la 26. Donde no existe, `Luz` corre la luz entera según por dónde va su raíz (0 cuando está al centro
  de la pantalla): ahí, en una página larga, arriba del todo la luz parte corrida hacia arriba.
- `rango` (0 a 1; por defecto 0,35): cuánto se aparta del reposo. La luz nunca cruza al otro lado de su reposo ni
  llega a venir de abajo: las sombras no cambian de lado, con cualquier rango y a cualquier hora. `desde`: otro reposo.
- **`"hora"`:** en la mañana la luz viene baja y cálida desde la izquierda; al mediodía, de arriba y blanca; en la
  tarde, desde la derecha; de noche, tenue y fría. Suma `--mk-luz-tinte` y `--mk-luz-fuerza`. Se mira después de
  montar (el servidor y el navegador dibujan lo mismo) y cada diez minutos.
- Con «reducir movimiento» o ahorro de datos la luz queda fija. Solo trabaja mientras se ve; quieta, no pide cuadros.
- Una `Luz` dentro de otra manda en su zona (también en el tinte y la fuerza de la hora).
- **Costo, medido:** con el procesador frenado 6 veces y unas 25 superficies, mover la luz mantiene 60 cuadros por
  segundo (el 95 % de los cuadros bajo 16,8 ms), con o sin capas propias (`will-change`). No se pusieron: gastarían
  memoria sin ganar nada. Mover la luz con el cursor recalcula el estilo de lo que hay dentro de la `Luz`.

**`Materia`** (`tipo`, `altura` 0 a 4, `alApuntar`, `inclina`, `como`):

| Material | Cómo responde |
|---|---|
| `papel` | No brilla: luz pareja y grano fino |
| `mate` (por defecto) | Claro hacia la luz y más oscuro al otro lado |
| `vidrio` | Deja ver lo de atrás; una franja de luz lo cruza y el canto se ilumina del lado de la luz |
| `metal` | Bandas de luz y de sombra que lo recorren |
| `holografico` | Un arcoíris que cambia con el ángulo |

- **La sombra dice la altura:** una de contacto (chica y oscura) y una proyectada, que se corre al lado contrario de la
  luz 7 px por nivel, crece 2 px por lado y se aclara. Son capas ya difuminadas que solo se corren y se funden: nunca
  se anima `box-shadow`.
- Apuntarla la levanta (donde hay cursor). Si es un enlace, un botón o trae `onClick` (y no está apagada), apretarla
  la hunde hacia su sombra.
- `inclina` (grados): se vuelve hacia el cursor o el dedo. La profundidad va en su propia transformación, no en el padre.
- El brillo se mezcla con el color de la superficie (`--mk-lz-color`; el del texto, `--mk-lz-texto`), así que el
  contraste del texto se cuida solo. Medido con el brillo encima, en claro y en oscuro: mínimo 5 a 1. El vidrio no
  tiene color propio: su texto es el de la página (medido también en una página oscura que no le dice nada).
- Lo que la página puede cambiar con su clase (relleno, borde redondeado, `display`) va sin peso: cualquier clase le gana.
- Fuera de una `Luz` usa la luz de siempre, quieta. Al imprimir, sin sombras.

**Lo que ya existía, dentro de una `Luz`** (fuera de una, nada cambia):

- `Tarjeta` `elevada` y `vidrio`, `Boton` `solido`, `degradado` y `vidrio`, la forma `tecla` y las sombras duras de
  `retro` y `anime`: su sombra cae según la luz en reposo (es fija) y al apretar el botón se corre hacia ella. Lo plano
  sigue plano; `ticket` y `pixel` no ganan sombra; `neon` no cambia. El efecto `elevar` también cae al lado contrario
  de la luz. Un botón apagado no se mueve, y con «reducir movimiento» apretar no corre nada. Lo hace el CSS de la
  entrada `luz`.
- **Libro que se abre:** la hoja que gira se oscurece hasta ponerse de canto y se aclara al caer; la hoja de abajo
  queda en sombra mientras la tapan. Son transiciones de `opacity` en un solo sentido (sin saltos si se cambia de
  dirección a medio giro), y cada capa se esconde cuando su cara no se ve. En una sola página (teléfono) la hoja se
  desvanece: no hay sombreado de giro, pero la hoja de abajo sí se aclara cuando queda a la vista.
- **Carrusel giratorio:** cada ficha se oscurece según le dé la cara o la espalda a la luz (continuo, con `cos()` en
  CSS; escalonado donde no existe), el lado de la luz queda más claro, y el anillo deja sombra y reflejo en el piso
  (el reflejo, donde el navegador refleja).

**`TituloConVolumen`** (`espesor` 2 a 12, `como`): el costado cae al lado contrario de la luz en reposo y toma su color
del color del texto. Sigue siendo texto. **`TarjetaHolografica`**: una `Materia` holográfica que se inclina.

Pruebas: `pruebas/luz.test.ts` (8) y `scripts/verificar-luz.mjs [url] [parte]`, con las partes `luz`, `materia`,
`existe` y `piezas` (55 revisiones en Chromium; en WebKit, 51 y 4 saltadas con su razón: las que ese motor no deja
medir). Una parte que no existe da error.

Pendiente: la «foto profunda», los fondos y los encabezados no usan todavía esta luz; la física (vapor, tela, agua) y
los dioramas son las tandas que siguen; en La Mente, un campo de la receta para la luz de página (encargo
`cerebro-aquiles/lamente/ENCARGO_2026-11-24_luz-y-materia.md`).

### Arreglo: las formas del botón nunca se aplicaban

Las formas de `Boton` (`recto`, `tecla`, `ticket`, `sello`, `pixel`, `subrayado`, `circulo`) no se aplicaron nunca,
desde que se crearon (23-11-2026) hasta `v0.4.0`: el selector que les da peso, `:not(#\#)`, perdía su barra al pasar
por el texto del código y quedaba inválido, así que el navegador botaba las dieciséis reglas. Todos los botones salían
como pastilla. Corregido en `src/piezas/Boton.tsx`; lo cubre la revisión «las formas del botón se ven como su forma»
de `verificar-luz`. **Cambia cómo se ven** los botones con forma y los paquetes que las usan (`minimal`, `neon-tubo`,
`arcade`, `tecla`, `sello`, `ticket`, `flecha`): ahora se ven como se diseñaron. Como las formas pesan más que los
estilos (así se diseñaron), dentro de un estilo una `tecla` lleva su propia sombra y no la del estilo, y `sello`,
`ticket`, `pixel` y `subrayado` van sin la sombra ni el resplandor del estilo. Una `tecla` apagada ya no queda
levantada. Se revisó todo `src/` y `demo/`: no hay otro texto con una barra perdida.

## Con el dedo: cupón, sticker, sellos con timbre y ruleta (25-11-2026)

Cuatro piezas más de `motion-kit/momentos` que se manejan con el dedo y se sienten como objetos: tienen peso, roce y
ceden. Se bajan aparte y aceptan `respaldo`. Diseño `docs/superpowers/specs/2026-11-24-con-el-dedo-design.md`, plan
`docs/superpowers/plans/2026-11-24-con-el-dedo.md`. Vitrina `#momentos` («Con el dedo»). Prueba:
`scripts/verificar-momentos4.mjs [url] [cupon|sticker|sello|ruleta]`.

| Pieza | Para qué bloque | Qué hace |
|---|---|---|
| `CuponQueSeArranca` | Ofertas y cupones | Una franja con dientes que se arranca tirando de la lengüeta: los dientes se cortan de a uno y lo cortado cuelga. Al llegar al 85 % del corte se desprende sola (soltarla antes la deja donde va) y queda el código, con botón para copiarlo |
| `StickerQueSeDespega` | Premios, mensajes, sorpresas | Un sticker que se despega desde la orilla que se toma: se dobla por donde va el dedo y deja ver su revés. Debajo está el premio |
| `SellosConTimbre` | Tarjeta de sellos | Los sellos de antes ya están; los nuevos se timbran al verse: el timbre baja con su sombra, aprieta y deja la marca. Cada marca es distinta (giro, carga de tinta, borde) |
| `RuletaDePremios` | Sorteos y promociones | Se lanza con el dedo o con «Girar»; gira con peso y roce, la lengüeta salta de clavo en clavo, y se detiene en el premio que le digan. Al detenerse, los demás premios se apagan |

Qué reciben (todas, además, las comunes `nivel`, `ahorro`, `className`):

| Pieza | Props |
|---|---|
| `CuponQueSeArranca` | `titulo`, `detalle?`, `codigo`, `vence?` (`AAAA-MM-DD`, inclusive), `vibracion?`, `alArrancar?` |
| `StickerQueSeDespega` | `children` (la cara), `debajo` (lo que queda a la vista), `etiqueta?` («Despegar»), `forma?` (`circulo` o `cuadrado`), `vibracion?`, `alDespegar?` |
| `SellosConTimbre` | `total`, `llenos` (contando los nuevos), `nuevos?` (los que se timbran), `premio`, `semilla?`, `vibracion?` |
| `RuletaDePremios` | `premios` (de 2 a 12; textos o `{ texto }`), `resultado?` (índice donde se detiene), `alGirar?` (para pedirlo al lanzar; puede ser una promesa), `alTerminar?` (recibe el índice, o `null` si no se supo), `vez?` (cambia para permitir otra vuelta), `semilla?`, `celebracion?` (`confeti`, `fuegos`, `nada`), `vibracion?` |

Reglas que cuidar:

- **La ruleta no decide quién gana.** Se detiene donde le digan (`resultado`, o lo que devuelva `alGirar`): el premio
  lo decide el servidor. Mientras llega, gira pareja; si la consulta falla o tarda más de 10 segundos, frena sola, no
  anuncia premio y avisa con `null`. Sin `resultado` ni `alGirar` elige por la semilla (sirve para una vitrina, no
  para un sorteo de verdad).
- **Los índices son los de la lista que se pasa.** Los premios vacíos, o del 13 en adelante, no se dibujan, pero no
  corren a los demás: `resultado`, lo que devuelve `alGirar` y lo que recibe `alTerminar` hablan siempre de la lista
  original. Si ese índice no existe en la rueda, la ruleta no inventa otro: se detiene sin anunciar premio y avisa
  con `null`.
- **Nunca frena de golpe ni retrocede.** Lo que se ajusta para caer en el premio es el roce, apenas (a lo más media
  vuelta de diferencia con lo que habría girado sola); da entre 3 y 7 vueltas. Un impulso flojo (menos de 500° por
  segundo) no cuenta: la rueda vuelve a su lugar.
- **El scroll manda.** El dedo que sube o baja sobre la rueda mueve la página, no la rueda: un scroll no gasta la
  vuelta. Se lanza de lado (o con «Girar»). Si el navegador se queda con el gesto, la rueda vuelve a su lugar.
- **Una vuelta por `vez`.** Si `vez` cambia a mitad de giro, ese giro termina y avisa igual; la vuelta nueva queda
  lista cuando se detiene. Si cambia la lista de premios a mitad de giro, la rueda se detiene sin premio y avisa con
  `null`; si cambia con la rueda detenida, el anuncio sigue diciendo lo que salió y ya no se destaca nada.
- **El impulso se mide con la hora de cada toque,** no con la hora en que la página lo atiende: en un teléfono
  ocupado los toques se atienden juntos y el lanzamiento cuenta igual.
- **Sin dedo también.** Cada pieza tiene su botón: «Ver código», «Despegar», «Girar». Lo que queda a la vista se
  anuncia a los lectores de pantalla; los premios de la ruleta van también como lista.
- **Niveles.** En liviano: el cupón y el sticker se abren con una transición corta, las marcas aparecen sin timbre y
  la ruleta da una vuelta corta. En quieto (o con «reducir movimiento»): el código del cupón y lo de abajo del
  sticker están a la vista desde el principio (`alArrancar` y `alDespegar` avisan una vez, al mostrarlos), y la ruleta
  muestra el premio con «Ver premio», sin pedir cuadros. Con «reducir movimiento» y un `nivel` forzado tampoco queda
  nada esperando una animación que no corre.
- **El foco no se pierde.** Al abrir con el teclado, pasa a «Copiar» (cupón) o a lo de abajo (sticker). Los sellos
  dicen en su texto cuántos son nuevos («7 de 10 sellos (2 nuevos)»).
- **Dentro de una `Luz`,** la sombra del timbre y el brillo de la ruleta caen según esa luz. La luz de la ruleta no
  gira con la rueda.
- **Datos raros.** Cupón vencido: no se arranca y lo dice. Sellos: `llenos` y `nuevos` se acotan al total. Ruleta:
  más de 12 premios, quedan 12; menos de 2, no se dibuja; los rótulos achican la letra para caber y, pasado el mínimo,
  se cortan con puntos.
- **Solo `rotate`, `translate`, `scale` y `opacity`** en lo que se mueve. El borde irregular de los sellos es un
  filtro fijo.

Pesos (gzip): cupón 4,0 KB, sticker 3,8, sellos con timbre 3,1 y ruleta 5,7, cada uno en su archivo aparte (más
0,4 KB que comparten el cupón, el sticker y la ruleta).
`motion-kit/momentos` al cargar: 13,1 KB (tope 17, fijado por Aquiles). `estilos-momentos.css`: 11,3 KB.

Pruebas: `pruebas/momentos4.test.ts` y `pruebas/momentos4-dibujo.test.ts` (15) y `scripts/verificar-momentos4.mjs`
(69 revisiones; la ruleta se lanza 20 veces, con el botón y con el dedo, hacia los dos lados). Pasa entera también con el motor de Safari.

## Hilos: el hilo que gira, se abre, se junta y arma algo (25-11-2026)

Tres relatos de página más, hermanos del Hilo. Van **por delante** de los bloques, por lo libre de cada uno (su
relleno), y se ven en un teléfono con páginas de franjas pegadas como las de La Mente. Cada uno incluye al anterior.
Diseño `docs/superpowers/specs/2026-11-25-hilos-design.md`, plan `docs/superpowers/plans/2026-11-25-hilos.md`.
Vitrina `#hilos` (la página puede verse con un estilo del kit, como una de La Mente o en su vista previa). Prueba:
`scripts/verificar-hilos.mjs [url] [rulos|hebras|figura|niveles|marco|lamente|material|rastro]`.

| `relatoPagina` | Nombre | Qué hace |
|---|---|---|
| `rulos` | Hilo con rulos | Baja serpenteando por la orilla de cada bloque, cruza al otro lado en el paso al siguiente y hace un rulo en cada cruce |
| `hebras` | Hebras | Además, en un bloque con dos o más tarjetas (`data-mk-parte="tarjeta"`) se abre en hebras por sus canales (las orillas y entre columnas; a lo más 5), deja un nudo junto a cada tarjeta y se junta abajo |
| `figura` | Hilo que dibuja | Además, al final el mismo hilo dibuja una figura del rubro de un solo trazo, en una franja propia de 140 px (el remate) |
| `rastro` | Rastro | Sin línea: huellas que aparecen una tras otra por el mismo recorrido (sin rulos), alternando el lado y mirando hacia donde van. La forma sale de `figura`: patitas (`huella`), granos de café (`taza`), sésamo (`hamburguesa`), puntadas (`tijera`, `lapiz`), corazones (`corazon`), pisadas (las demás) o estrellitas. Solo `opacity` y `scale`: no necesita la excepción del trazo. Donde hay poco lugar se achican; donde no cabe ni una chica, no van. Con «reducir movimiento», todas quietas |

Qué recibe `PaginaRelato` (y la receta de página, con los mismos nombres):

- `figura`: `taza`, `hamburguesa`, `plato`, `poste`, `tijera`, `huella`, `pesa`, `lapiz`, `bolsa`, `corazon` o `estrella`
  (por defecto). `figuraDeRubro(rubro)` dice cuál le toca a cada rubro de los encabezados; el contrato lo trae también.
- `semilla`: el `slug` del negocio. Decide por qué lado parte el hilo, cómo son sus rulos y el giro de la figura: dos
  negocios del mismo rubro no salen iguales.

Reglas que cuidar:

- **Nunca sobre el contenido.** El hilo se mide contra cada texto, foto, tarjeta, botón y campo. Va por la orilla
  libre (a lo más a 14 px del borde) y cruza por la franja libre entre lo último de un bloque y lo primero del
  siguiente. Si un bloque tiene relleno propio arriba, cruza ahí, sobre su fondo.
- **Puntadas.** Donde no quedan 10 px libres (una foto de lado a lado), el hilo pasa por debajo: ese tramo no se
  dibuja y queda un ojal donde entra y otro donde sale. También cuentan como sin lugar un bloque con una **foto de
  fondo** (una imagen puesta por CSS que lo cubre, con `cover`, `contain` o sin repetir: el hilo no pasa sobre ella
  aunque su texto deje orilla; una textura que se repite no cuenta como foto) y un bloque con algo
  pegado al bajar (`sticky`: los relatos «pila», «cuento», «carrete» y «subtítulos»). En una página muy apretada el
  hilo se ve a ratos.
- **Las hebras y el cruce se reparten el espacio.** Si el bloque que sigue no trae relleno propio arriba, la junta de
  las hebras y el cruce al otro lado caben los dos en lo que queda bajo las tarjetas (con unos 44 px alcanza).
- **Se mide contra el lugar final de cada bloque,** no contra donde está mientras entra: al medir se quitan por un
  instante los corrimientos de la entrada de los relatos, y de lo que la página marca con `data-entrada` (como las
  franjas de La Mente), sin que se alcance a pintar. Vuelven a su lugar sin transición: medir no hace bajar y subir
  una tarjeta levantada.
- **Se vuelve a medir** cuando algo cambia de tamaño (una foto que carga, un bloque que crece) o de orden (bloques que
  se reordenan sin cambiar de tamaño). Varios cambios seguidos se miden una sola vez, cuando se calman.
- **Dentro de un marco con su propio scroll** sigue al scroll del marco. En una **vista previa achicada y sin scroll
  propio** (como la del Estudio: la página dentro de `overflow: hidden` con `transform: scale`) va entera y quieta,
  medida en su lugar: ahí el scroll no la dibujaría nunca. En pantalla ancha va por las orillas de la página.
- **Color.** Es el acento: `--mk-acento` o, en una página sin el estilo del kit (La Mente), `--lm-acento`. Sobre un
  bloque cuyo fondo se parece al acento (contraste menor que 1,6 a 1), ese tramo toma el color del texto del bloque.
  Entiende los colores como los entrega el navegador (`rgb`, `color(srgb)`, `oklab`, `oklch`, `lab`, `lch`); un fondo
  con degradado o imagen no se puede leer: ahí queda el acento.
- **El final va con tiempo.** La figura está al final de la página y solo cabe entera en la pantalla cuando ya casi no
  queda nada por bajar: la llegada y la figura se dibujan apenas el remate se ve (unos 2 segundos), no con el scroll.
  Lo demás del hilo se dibuja a la vista, nunca bajo el borde de la pantalla. El remate se mide (un relleno bajo él no
  descoloca la figura).
- **El hilo de cada estilo.** El mismo recorrido, con el material del estilo de la página: un tubo de luz en neón,
  dos hebras de lana que se trenzan en retro, un cable en rock, una cinta en anime y los rieles de una tira en
  «película». Sin estilo del kit (La Mente), una línea. Cada capa va a lo más a 3,25 px del centro (no pisa el
  contenido) y todas se dibujan juntas. Si cambia el estilo, se vuelve a medir.
- **El encabezado no lleva hilo.** Parte en el paso al segundo bloque.
- **Sin código al bajar.** Se mide al montar y cuando algo cambia de tamaño (una foto que carga, un bloque que crece);
  después lo dibuja el navegador, atado al scroll. Con la página quieta no pide cuadros.
- **Excepción a «solo `transform` y `opacity`».** Dibujar una línea no se puede con `transform`: como el Hilo de
  siempre, estos animan `stroke-dashoffset` (el trazo) y `offset-distance` (la luz), además de `opacity`. Medido en
  Chromium con el procesador frenado 4 veces: 60 cuadros por segundo al bajar la vitrina, igual que con el Hilo.
- **Niveles.** Completo con animaciones atadas al scroll (Chrome, Safari 26): todo. Liviano, o un navegador sin ellas:
  el hilo entero y quieto, sin luces. Quieto: sin hilo (con `rulos` o `hebras` el archivo ni se baja); con `figura`,
  solo la figura, dibujada, en su remate.
- **Contrato.** `contrato/pagina-motionkit.json` suma los tres ids, la lista `figura`, los campos `figura` y `semilla`
  y `figuraDeRubro`. Solo agrega; quien valide con el contrato viejo rechaza lo nuevo.

Pesos (gzip): los hilos (y el rastro) van en un archivo aparte de 11,1 KB (el diseño pedía 5), que baja solo si la
página eligió uno. Al cargar, `motion-kit/pagina` pasa de 15,5 a 16,2 KB (tope 17) y `motion-kit` de 79,4 a 80,3 KB (tope 90, fijado por Aquiles el
25-11-2026).

Pruebas: `pruebas/hilos.test.ts` (23), `pruebas/rastro.test.ts` (5) y `scripts/verificar-hilos.mjs` (60 revisiones;
parte `rastro`). Con el motor de Safari pasan 45 y 16 no aplican: ese motor no tiene animaciones atadas al scroll, así que ahí el hilo va entero y quieto.

## Safari (sondeo del 24-11-2026)

Las pruebas visuales están escritas para Chrome. El 24-11 se corrieron las quince, una vez, con el motor de Safari
(WebKit de Playwright). Para repetirlo con una: `node scripts/en-safari.mjs <prueba> [parte]`. No es un semáforo:
sirve para buscar diferencias de verdad.

| Prueba | En Safari | Qué era |
|---|---|---|
| efectos, encabezados, lamente, biblioteca, momentos3 | Pasan enteras | — |
| hilos (25-11) | Pasan 45; 16 no aplican | El WebKit de Playwright no tiene animaciones atadas al scroll: el hilo va entero y quieto, y lo que se revisa «al bajar» se salta con su motivo |
| fotos | Un error real, arreglado | Al arrastrar sobre una foto de la galería, el navegador iniciaba su «arrastrar imagen» y se tragaba el toque siguiente: el visor no abría. Ahora las fotos con gestos lo evitan |
| piezas, estilos, escena, momentos, momentos2 | Diferencias que no son errores | Safari no lleva el Tab a los enlaces por defecto; mide distinto lo que sobra dentro de una caja (nada se sale a la vista); la foto de prueba pesa menos; una revisión usa una herramienta que solo tiene Chrome |
| relatos, pelicula (telón), dedo (pila), estilos (galería horizontal) | Más simples, por diseño | Usan animaciones atadas al scroll (`animation-timeline`). Donde el navegador no las trae, cada bloque de un relato hace una entrada simple al verse (el respaldo de `src/relatos/respaldo.ts`), y lo demás se ve quieto o como fila que se desliza. Safari las trae desde la versión 26; el WebKit de las pruebas es anterior |
| momentos3 (libro en dos páginas) | **Sin resolver; hay que mirarlo en un Safari de verdad** | En el WebKit de Playwright el libro abierto en dos páginas deja en blanco la página derecha (0 píxeles de tinta), con luz y sin luz: ese motor no oculta el revés de las hojas, y la última queda encima. Escondiendo los dorsos a mano aparece el texto. Se probaron seis causas (medidas de contenedor, animación de la mesa, `translate` de la pila, transición de la hoja, recorte y borde redondo, `preserve-3d` en la cara) y ninguna lo arregla. Las revisiones anteriores no lo vieron porque miran el texto, no los píxeles. En una página (teléfono) usa otro camino |
| director | Resuelto en la fase 2 | Las 10 diferencias eran de la prueba (contaba como «vivas» las animaciones del respaldo manual). Ahora pasa entero en los dos motores |

Lo que hay que saber:

- **En iPhone con Safari anterior a la 26, los relatos y la pila no siguen al scroll.** Se ve todo, y cada bloque
  hace una entrada simple al aparecer; lo que se pierde es el movimiento atado al scroll (la cinta, el telón, el hilo). El
  Director ya trae un respaldo manual para eso: pasar los relatos al Director (fase 2) les da movimiento también ahí.
- **Sin comprobar en un aparato real.** El WebKit de las pruebas no es el Safari de un iPhone: no prueba el dedo de
  verdad, la memoria ni VoiceOver.
- Firefox no se probó: no está instalado en las pruebas (`npx playwright install firefox`).

## Mejoras a lo que ya existe

- `Toast`: sumar cierre por deslizamiento y variantes (éxito, error).
- `Marquee`: los enlaces de la copia duplicada quedan alcanzables con teclado.
  Marcar la copia como `inert` cuando el mínimo de React sea 19.
- `BottomSheet`, `TabBar`, `Navbar` y `Toast` traen colores oscuros por defecto. Pasarlos a
  variables CSS para que tomen el tema de la plantilla.

## Referencias revisadas

Solo para ideas y para saber qué espera la gente de un kit así.

- React Bits, Magic UI, Aceternity UI: catálogos de efectos y cómo los agrupan.
- Guías de animaciones por scroll con CSS nativo (`animation-timeline`).
- Guía de interacciones naturales de Chrome para desarrolladores.
- Guías de estructura de páginas de aterrizaje.
