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
