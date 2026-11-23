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
| `StickyScroll` | Texto que avanza con una imagen fija | |
| `ScrollReveal` por CSS | `Reveal` sin JavaScript | `animation-timeline: view()` con respaldo |
| `Dock` | Barra de íconos que crecen al acercarse | Solo escritorio |
| `Confetti` | Celebrar una compra o registro | Canvas |
| Fondos: grilla, puntos, partículas | Variedad de portadas | Canvas o SVG |
| `TextScramble` | Texto que se "descifra" | |
| `ImageCompare` | Antes y después con deslizador | |
| `Cursor` personalizado | Sitios de portafolio | Solo con puntero fino |
| `BrowserFrame` | Marco de navegador para capturas | Par de `DeviceFrame` |

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
