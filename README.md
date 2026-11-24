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

## Efectos protagonistas (uno por página)

12 efectos de fondo para que cada página tenga el suyo. Se cargan solo cuando se usan (un archivo por efecto) y toman
los colores de la página: `--mk-acento`, `--mk-fondo`, `--mk-superficie` o, si no existen, `--lm-acento`, `--lm-fondo`
y `--lm-superficie` de La Mente.

| Rubro | Escena | Fondo vivo |
|---|---|---|
| comida | `cafe` | `niebla` |
| belleza | `petalos` | `burbujas` |
| salud | `pulso` | `olas` |
| clases | `abecedario` | `puntos` |
| barrio | `letrero` (prop `texto`, por defecto «Abierto») | `lluvia` |
| otro | `cometas` | `estrellas` |

Cada uno tiene `variante={1|2|3}` (densidad, velocidad o forma): 36 combinaciones.

```tsx
import { EfectoPagina, EFECTOS } from "motion-kit";

<section style={{ position: "relative", isolation: "isolate" }}>
  <EfectoPagina id={pagina.efecto} variante={2} />
  <div style={{ position: "relative" }}>…contenido…</div>
</section>
```

- `EFECTOS` lista id, nombre, familia (`escena`/`fondo`), rubros y ánimo (`sobrio`/`vistoso`) para armar un selector.
- Un id desconocido o un archivo que no carga no dibuja nada; la página sigue.
- La capa es `aria-hidden`, no recibe toques, se pausa fuera de pantalla y con «reducir movimiento» queda una
  composición quieta.
- Galería para probarlos: `npm run dev` y abrir `#efectos` (variante y paleta se cambian arriba).
- Verificación en navegador: `node scripts/verificar-efectos.mjs http://localhost:5173` (necesita Playwright).

## Estilos completos y plantillas

Cinco estilos que visten todo de una vez: `neon`, `retro`, `rock`, `anime` y `pelicula`. Cada uno trae colores,
letras, botones, tarjetas, textura, cursor, sonido opcional, efecto de fondo, texto animado y transición de página.
Además hay 5 plantillas de página completas guardadas como datos (recetas), un estudio para probar combinaciones
(`#estudio`) y el generador `sorprendeme()`. Guía completa en `docs/ESTILOS-Y-PLANTILLAS.md`.

```tsx
import { Estilo, TextoCinetico, EfectoPagina, Boton, PaginaReceta, RECETAS } from "motion-kit";

<Estilo nombre="neon" cursor fuentes>
  <section style={{ position: "relative" }}>
    <EfectoPagina id="rejilla" />
    <TextoCinetico como="h1" efecto="encender" texto="Abierto hasta tarde" />
    <Boton>Pedir ahora</Boton>
  </section>
</Estilo>

<PaginaReceta receta={RECETAS[0]} />
```

**Encabezados:** `<Encabezado composicion="boleto" entrada="telon" titulo="Esta noche, en *pantalla grande*" />`
(12 composiciones, 7 entradas, ajuste automático del título). **Packs de botones:** `<BotonesPack pack="ticket" />`
(12 packs, 8 formas). Editor tipo cliente en `#encabezados`.

## Botones, tarjetas, movimientos y transiciones

Galería: `npm run dev` y abrir `#piezas`. Verificación: `node scripts/verificar-piezas.mjs http://localhost:5173`.
Todo toma el color de `--mk-acento` / `--lm-acento`; el texto sobre el acento usa `--mk-sobre-acento` /
`--lm-sobre-acento` (blanco por defecto; en paletas oscuras con acento claro conviene oscuro).

**`Boton`**: `variante` = solido, contorno, suave, fantasma, degradado, vidrio. `efecto` = elevar, relleno, brillo,
flecha, deslizar, latido, borde. También `tamano` (sm, md, lg; todos miden al menos 44 px), `cargando`, `icono`,
`iconoFinal`, `completo` y `href` (se dibuja como enlace). Los efectos de mouse no se activan en pantallas táctiles.

```tsx
<Boton variante="degradado" efecto="brillo" completo>Reservar hora</Boton>
<Boton href="/carta" variante="contorno" efecto="flecha">Ver la carta</Boton>
```

**`Tarjeta`**: `variante` = plana, elevada, borde, vidrio, acento. `efecto` (combinables) = elevar, zoom, brillo,
resplandor, revelar. `imagen`, `href` (toda la tarjeta es enlace) y `revelar` (contenido que sube al pasar el mouse;
en celular se ve siempre). Partes: `TarjetaMedia` y `TarjetaCuerpo`. **`TarjetaVolteable`**: `frente`, `dorso`,
`disparador` (toque u hover), `eje` (x o y); trae un botón accesible para voltear.

```tsx
<Tarjeta imagen={foto} efecto={["elevar", "zoom"]} revelar={<Boton tamano="sm">Agregar</Boton>}>
  <TarjetaCuerpo><h3>Corte y barba</h3><p>45 min · $15.000</p></TarjetaCuerpo>
</Tarjeta>
```

**`Movimiento`**: 23 movimientos del catálogo `MOVIMIENTOS`. Entradas: aparecer, subir, bajar, desde-izquierda,
desde-derecha, crecer, zoom, girar-entrar, voltear-x, voltear-y, rebote-entrar, elastico. Para llamar la atención:
latir, flotar, sacudir, balancear, tambalear, gelatina, rebotar, girar, parpadear, respirar, temblar.
`cuando` = entrar (al aparecer en pantalla), siempre, hover o toque; además `duracion`, `retraso` y `repetir`.

```tsx
<Movimiento tipo="subir" retraso={120}><h2>Bienvenidos</h2></Movimiento>
<Movimiento tipo="latir" cuando="hover"><Boton>Pedir ahora</Boton></Movimiento>
```

**Transiciones** (11 en `TRANSICIONES`: fundido, subir, bajar, izquierda, derecha, escalar, zoom, voltear, hoja,
cortina, pasar):
- `Presencia visible={abierto} tipo="hoja"`: entra y sale animado antes de quitarse del DOM (como AnimatePresence).
- `CambioContenido clave={paso} tipo="pasar" sentido={1}`: el contenido viejo sale y entra el nuevo (pasos, pestañas).
- `animarEntrada` / `animarSalida`: las mismas animaciones para usar a mano sobre un elemento.

Con «reducir movimiento»: los botones y tarjetas no se desplazan, las entradas quedan en un fundido corto, los
movimientos de atención se quedan quietos y las transiciones son un fundido de 200 ms. Si el JS no carga, todo
el contenido se ve.

## Empezar a desarrollar

```bash
npm install
npm run dev        # abre la página demo
npm run typecheck  # revisa los tipos
npm run build      # genera la librería en dist/ y mide el peso de cada entrada
npm test           # receta, contrato y puente con La Mente
```

## Usar en otro proyecto

Mientras no esté publicada en npm, se puede instalar directo desde GitHub:

```bash
npm install github:aquilesmendez2026-boop/motion-kit
```

Al instalarla así se compila sola (script `prepare`); no hace falta subir `dist/`.

Una versión fija (recomendado): `npm install github:aquilesmendez2026-boop/motion-kit#v0.3.0`.

Entradas: `motion-kit` (todo), `motion-kit/encabezado` (el encabezado desde su receta; es la que usa La Mente),
`motion-kit/escena`, `motion-kit/receta` (sin React) y los CSS `motion-kit/estilos.css` y
`motion-kit/estilos-encabezado.css` (para usar con `sinInyectarEstilos()`). Cambios en `CHANGELOG.md`.

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
