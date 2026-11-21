# motion-kit

Librería propia de efectos y animaciones para React. Sin dependencias de
animación: todo está escrito con React, CSS y APIs nativas del navegador.

## Efectos incluidos

| Grupo | Componente | Qué hace |
|---|---|---|
| Aparición | `Reveal` | Hace aparecer un bloque (desplazamiento y fade) al entrar en pantalla |
| | `Stagger` | Hace entrar a varios hijos en cascada |
| Texto | `SplitText` | Titular que aparece palabra por palabra o letra por letra |
| | `GradientText` | Texto con degradado en movimiento |
| | `Typewriter` | Texto que se escribe solo; alterna varias frases |
| | `WordRotate` | Palabra que cambia cada cierto tiempo dentro de un titular |
| | `CountUp` | Número que cuenta hasta su valor al entrar en pantalla |
| Scroll | `ScrollProgress` | Barra fija que muestra el avance de lectura |
| | `Parallax` | Mueve un bloque a otra velocidad que el scroll |
| Cursor y toque | `MagneticButton` | Botón que se acerca al cursor |
| | `TiltCard` | Tarjeta que se inclina en 3D hacia el cursor o el dedo |
| | `Spotlight` | Tarjeta con una luz que sigue al cursor o al dedo |
| | `Pressable` | Botón que se hunde al tocarlo |
| | `Ripple` | Onda que nace donde se toca |
| | `ShinyButton` | Botón con un destello que lo cruza |
| Móvil | `Carousel` | Carrusel que se desliza con el dedo (scroll nativo) |
| | `BottomSheet` | Hoja que sube desde abajo y se cierra arrastrando |
| | `TabBar` | Barra de navegación inferior con marca deslizante |
| | `DeviceFrame` | Marco de teléfono para mostrar pantallas |
| Decoración | `Marquee` | Cinta infinita de logos o frases |
| | `Aurora` | Fondo de luces de colores en movimiento |
| | `GlowBorder` | Tarjeta con luz que recorre el borde |
| Secciones | `Accordion` | Preguntas frecuentes que se abren con animación |
| | `Skeleton` | Bloque de carga con brillo |
| | `Navbar` | Barra superior que toma fondo y se esconde al bajar |
| | `Tabs` | Selector de pestañas con píldora deslizante |
| | `ToastProvider` + `useToast` | Avisos breves tras una acción |

Hooks: `useInView`, `useReducedMotion`, `useScrollProgress`, `useViewTransition`.

Todos los efectos respetan `prefers-reduced-motion`. Los que usan keyframes
insertan su CSS solos: no hay que importar ninguna hoja de estilos.

La demo trae además una plantilla de landing completa hecha solo con piezas del
kit: `npm run dev` y abrir `/#landing` (código en `demo/plantillas/`).

Lo que viene y de dónde salen las ideas está en `docs/CATALOGO.md`.

## Empezar a desarrollar

```bash
npm install
npm run dev        # abre la página demo
npm run typecheck  # revisa los tipos
npm run build      # genera la librería en dist/
```

## Usar en otro proyecto

Mientras no esté publicada en npm, se puede instalar directo desde GitHub:

```bash
npm install github:aquilesmendez2026-boop/motion-kit
```

Al instalarla así se compila sola (script `prepare`); no hace falta subir `dist/`.

```tsx
import { Reveal, MagneticButton, TiltCard } from "motion-kit";

<Reveal direction="up" delay={100}>
  <h1>Hola</h1>
</Reveal>

<MagneticButton strength={0.4}>Entrar</MagneticButton>

<TiltCard maxTilt={12} glare>
  Contenido
</TiltCard>
```

## Cómo agregar un efecto nuevo

1. Crear `src/components/MiEfecto.tsx` (o un hook en `src/hooks/`).
2. Exportarlo en `src/index.ts`.
3. Mostrarlo en `demo/App.tsx`.
4. Si se copia código de otro proyecto, registrarlo en `THIRD_PARTY_LICENSES.md`.

## Licencia

MIT. Ver `LICENSE`.
