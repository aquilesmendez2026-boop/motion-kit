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

## Mejoras a lo que ya existe

- `Toast`: sumar cierre por deslizamiento y variantes (éxito, error).
- `Marquee`: los enlaces de la copia duplicada quedan alcanzables con teclado.
  Marcar la copia como `inert` cuando el mínimo de React sea 19.
- `BottomSheet`, `TabBar`, `Navbar` y `Toast` traen colores oscuros por defecto. Pasarlos a
  variables CSS para que tomen el tema de la plantilla.
- Falta una batería de pruebas automáticas.

## Referencias revisadas

Solo para ideas y para saber qué espera la gente de un kit así.

- React Bits, Magic UI, Aceternity UI: catálogos de efectos y cómo los agrupan.
- Guías de animaciones por scroll con CSS nativo (`animation-timeline`).
- Guía de interacciones naturales de Chrome para desarrolladores.
- Guías de estructura de páginas de aterrizaje.
