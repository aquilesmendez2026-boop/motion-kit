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
Sin etiqueta todavía: está en `dev`, después de `v0.3.0`.

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
- **Prueba inestable conocida:** `scripts/verificar-biblioteca.mjs` falló una vez («su miniatura muestra el título
  nuevo») al final de la batería completa y pasó 25 de 25 las dos veces que se corrió sola. Es anterior a esta tanda y
  parece de tiempos (lee la miniatura a los 500 ms de guardar). Pendiente: esperar a la miniatura en vez de un tiempo fijo.
- **Las piezas con hora** (`FechasQueVienen`, `ClasesDeHoy`) se vuelven a dibujar cada medio minuto con la pestaña a la
  vista. Si se les pasa `hoy`, ese valor lo pone al día quien arma la página.
- **`SeccionesVivas` no pone `id`** en sus secciones: las anclas son de quien arma la página.
- **Contraste del aviso «importante»:** usa el color «sobre acento» del estilo; con paletas de La Mente de acento claro
  hay que revisar que llegue a 4,5:1 (no se midió con las paletas reales).

Para La Mente: `cerebro-aquiles/lamente/ENCARGO_2026-11-24_momentos-2-y-fondos.md` (qué pieza va en cada bloque y con
qué datos). `ClasesDeHoy` dibuja la barra de cupos solo si La Mente manda el total (`cupos`), que hoy no manda.

## Director: el motor de animación propio (fase 1, 24-11-2026)

Un movimiento deja de ser una pieza escrita a mano y pasa a ser un **dato**: una partitura. El Director la hace correr
con lo que el navegador ya trae. Análisis y plan general: `docs/superpowers/specs/2026-11-24-motor-de-animacion-analisis-y-plan.md`.
Diseño de esta fase: `docs/superpowers/specs/2026-11-24-director-fase-1-design.md`. Plan:
`docs/superpowers/plans/2026-11-24-director-fase-1.md`. **Versión 0, experimental:** el modelo puede cambiar hasta la
fase 2 y La Mente todavía no copia su contrato.

Entrada `motion-kit/director` (9,1 KB gzip al cargar, tope 10; 1,5 KB más se bajan aparte si la partitura sigue al
cursor o a la velocidad). Vitrina `#director`.

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
  version: 0,
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

Lo que **no** está todavía (fases 2 a 6 del plan): el lenguaje en texto, traspasar piezas existentes, la capa gráfica
compartida, los peldaños continuos y el Estudio en La Mente. Solo se probó en Chromium.

Para el diseño de la fase 2 (recomendaciones de la revisión final, sin hacer): que lo que sigue use un `Cambio` igual
que lo demás; llevar al contrato los números de las curvas y los resortes (para que la app en Kotlin los reproduzca);
definir los tramos de scroll con su fórmula; hacer explícita la cascada de `por` en scroll; y cómo se pasa de la
versión 0 a la 1. Limitaciones conocidas: mientras un texto está cortado pierde el subrayado de los enlaces y el
ajuste entre letras; una partitura dentro de otra no comparte actores; lo que sigue al cursor escribe en el estilo en
línea del elemento (si React también lo usa para `scale` u `opacity`, se pisan); y con render en el servidor el texto
se ve entero un instante antes de entrar.

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
