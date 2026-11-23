# Relatos y encabezado de película

Fecha: 23-11-2026. Estado: **diseño para aprobar** (revisado por un constructor; sus preguntas quedaron respondidas abajo como «decisión mía»). Repo: `motion-kit`, rama `dev`. Bocetos que Aquiles vio y aprobó:
`.superpowers/brainstorm/48334-1795457228/content/pagina-pelicula.html` (A, B, C) y `pagina-pelicula-mas.html` (D a I).

## Para qué

El objetivo de La Mente: **que cualquier dueño entre con su cuenta y tenga en minutos una página sorprendente.** El
encabezado es el punto de partida. Al crearlo, el resto de la página hereda su personalidad (colores, forma de los
botones, movimiento base), y **bajar por la página se siente como una película o como un cuento que te cuentan**.

Palabras de Aquiles: «los bloques de abajo deben tener movimientos de entrar o cuando pasas el cursor por encima, el
encabezado puede [ser] casi una película si es necesario… y cuando bajes se sienta como una película o que te cuenten un
cuento». «Tengamos todos estos efectos en el kit». «Debemos seguir creando más efectos así para mejorar las páginas».

Todo se hace primero en motion-kit y después se lleva a La Mente (decisión del 23-11-2026, «Estudio de páginas, ajuste»).

## Metas

1. **Relatos:** nueve maneras de contar la página al bajar, en el kit: A. Escenas que aparecen, B. Película continua,
   C. Cuento por capítulos, D. Profundidad, E. Iris, F. Carrete, G. Subtítulos, H. Hilo, I. Luz que cambia. El
   encabezado propone un relato para la página y cada bloque puede usar otro.
2. **Movimiento base heredado:** cada bloque entra al aparecer y reacciona al cursor o al dedo (tarjetas y botones),
   con el sabor del estilo del encabezado.
3. **Encabezado de película:** las nueve ideas aprobadas (ver «Encabezado»).
4. **Receta de página v1:** el encabezado más el relato de la página y el de cada bloque, con su contrato, igual que la
   receta del encabezado.
5. **Catálogo que crece:** sumar un relato nuevo es escribir su CSS y su ficha, sin tocar el resto. Aquiles quiere
   seguir sumando: los próximos bocetos (cámara que se acerca, cortina que se parte, páginas de libro, collage, mapa del
   barrio) entran por el mismo camino.

## Lo que no es

- No es llevarlo a La Mente: eso es el paso 5, con su encargo y la orden de Aquiles.
- No se rehacen los bloques de La Mente (precios, agenda, pedidos…): motion-kit los envuelve.
- No es un editor de animaciones libre (línea de tiempo, fotogramas): se elige de un catálogo.

## Lo que lo haría un fracaso aunque funcione

- Que trabe un Android de gama baja o haga lenta la carga.
- Que el movimiento esconda el contenido o impida leer: con «reducir movimiento», sin soporte o en modo quieto, todo se
  ve y se lee completo.
- Que todo se mueva a la vez: se mantiene **un solo protagonista**.
- Que armar una página bonita tome más que unos minutos o pida decisiones técnicas al dueño.

## Restricciones

- **Sin dependencias nuevas** en lo que viaja al navegador (decisión del 23-11-2026). Un trozo propio de JavaScript de
  respaldo está bien.
- **Solo `transform` (o `translate`, `scale`, `rotate`) y `opacity` en lo que se anima.** Los bocetos que no la cumplían
  se rehacen así: Iris con un círculo que crece con `scale` (no `clip-path`); Luz que cambia con capas de cielo que se
  funden con `opacity` (no cambiar el color de fondo); el viajero del Hilo con `offset-distance`… **excepción
  documentada**: el trazo del Hilo (`stroke-dashoffset` de un solo SVG chico) se acepta porque pinta poco; en nivel
  liviano el trazo queda dibujado y quieto.
- Movimiento reducido, accesible, móvil primero, español de Chile.
- **Niveles** del kit (`useNivelEscena`): completo, liviano (teléfono que se traba) y quieto (ahorro de datos, red lenta,
  poca memoria o movimiento reducido). Cada relato dice cómo se ve en liviano y en quieto.
- **Peso:** presupuesto en `cerebro-aquiles/investigaciones/2026-11-23-pesos-web-y-movil.md`. `motion-kit/encabezado`
  tiene tope 35 KB gzip (confirmado). Los relatos van en una entrada nueva (ver «Paquete»).
- **Un solo protagonista** (regla de La Mente, `PROTAGONISTA_RECETA`): lo que se mueve solo y sin parar. Los relatos
  **no** cuentan como protagonista: solo se mueven cuando la persona hace scroll (igual que las capas 2.5D, que se
  mueven con el dedo). Lo nuevo del encabezado que se mueve sin parar (varias tomas, palabras que rotan) **sí** cuenta.

## Formas de construirlo (elegida: A+)

| | A. CSS nativo con scroll | B. Motor propio en JS | **A+ (elegida)** |
|---|---|---|---|
| Quién mueve al bajar | El navegador, fuera del hilo principal | Nuestro código, cuadro a cuadro | El navegador; nuestro código solo donde falta soporte |
| Teléfono barato | Muy fluido | El que más traba | Muy fluido |
| Peso | ~0 KB | ~4 a 8 KB | ~1 a 2 KB de respaldo |
| Navegadores | Chrome/Edge 115+, Safari 26+, Firefox 159+ (una fuente); los antiguos quedan quietos | Todos | Todos: modernos con todo, antiguos con entradas simples |
| Sumar un relato | CSS más ficha | Código y pruebas de rendimiento | CSS más ficha |

Se descartó GSAP: su licencia no es MIT, Apache ni BSD. Aquiles eligió A+ el 23-11-2026 («ok a, vamos») después de ver
la tabla.

**A+ en concreto:** cada relato es CSS con `animation-timeline: view()` / `scroll()` / línea de tiempo con nombre,
dentro de `@supports (animation-timeline: view())`. Sin soporte, un respaldo propio con `IntersectionObserver` marca
`data-visto` y hace la entrada simple (A); los relatos que necesitan scroll fino (B, C, F, G, H, I y la parte de
profundidad de D) caen a su versión quieta, que se lee completa.

## Relatos

Cada relato tiene una ficha en el catálogo `RELATOS`: `id`, `nombre`, `descripcion`, `para` (qué bloques le quedan),
`completo`, `liviano` y `quieto` (qué se ve en cada nivel) y `largo` (si alarga la página).

| Id | Relato | Qué pasa al bajar | Liviano | Quieto / sin soporte | Para |
|---|---|---|---|---|---|
| `escenas` | A. Escenas que aparecen | Cada bloque entra con la entrada del estilo | Igual | Visible | Cualquiera (relato por defecto) |
| `pelicula` | B. Película continua | El encabezado se aleja; cada bloque entra tras un telón del color del acento; cinta de avance | Sin telón, entrada A | Visible | Cualquiera |
| `cuento` | C. Cuento por capítulos | El bloque se queda quieto (sticky) y cuenta línea por línea; la foto se acerca | Sin sticky, entrada A | Visible, sin sticky | Historia, clases, eventos |
| `profundidad` | D. Profundidad | Capas de formas a distinta velocidad; tarjetas en cascada | Sin capas | Visible | Carta, servicios |
| `iris` | E. Iris | Se revela desde un círculo de luz que crece | Entrada A | Visible | Cualquiera |
| `carrete` | F. Carrete | Las fotos pasan de lado como tira de película | Tira deslizable con el dedo | Tira deslizable | Galería, carta, trabajos |
| `subtitulos` | G. Subtítulos | Una frase grande se enciende palabra por palabra | Frase entera con entrada A | Frase entera | Historia, promesa |
| `hilo` | H. Hilo | Una línea une los bloques y una luz viaja contigo | Línea dibujada, sin viajero | Sin línea | Página completa |
| `luz` | I. Luz que cambia | El cielo pasa por las horas del día; el sol se pone | Cielo fijo | Cielo fijo | Página completa |

Notas:
- `hilo` y `luz` son **de página** (van por detrás de todos los bloques); los demás son **de bloque**.
- La ficha `para` sirve para que el editor y «Sorpréndeme» propongan bien (carrete para la galería, subtítulos para la
  historia), no para prohibir.
- Los textos que muestra un relato (palabras de `subtitulos`, líneas de `cuento`) salen del contenido del bloque; el
  relato no inventa texto.

### Movimiento base heredado del estilo

| Estilo | Entrada de los bloques | Al pasar el cursor o tocar |
|---|---|---|
| neón | Se enciende (parpadeo corto con `opacity`) | Brillo del acento en tarjetas y botones |
| retro | Sube en pasos (`steps`) | Sombra dura que se mueve |
| rock | Golpe: entra con escala y un giro chico | Tarjeta que se tuerce |
| anime | Entra de lado con velocidad | Salto corto |
| película | Fundido lento desde abajo | Sube un poco con sombra |

Los botones ya traen sus efectos por pack (`PACKS_BOTONES`); las tarjetas, por `Tarjeta`. El relato decide *cómo
entra el bloque*; el estilo decide *el sabor* de esa entrada.

## Encabezado

Las nueve ideas aprobadas. Las que tocan la receta suben la **receta del encabezado a v2**. La v2 también suma
`shader` (id de `SHADER_IDS`) y `objeto` 3D (`{ forma, texto? }`; el video con alfa sigue fuera hasta el nivel 4), que ya
estaban en el editor. Más `logo` (URL https o key de S3) y `nombre` (hasta 40 letras) para la barra de la idea 8.

**Versiones (decisión mía):** un solo contrato, `contrato/encabezado-motionkit.json`, que describe la v2 y dice
`versiones: [1, 2]`. `validarReceta` acepta las dos; `normalizarReceta` pasa una v1 a v2 (la v1 es un subconjunto: solo
cambia `version`). La Mente guarda lo que devuelve `normalizarReceta`.

| # | Idea | Qué hace | Receta v2 | ¿Protagonista? |
|---|---|---|---|---|
| 1 | Apertura | Franjas de cine que se abren, «X presenta…» y el título. Solo la primera visita de la sesión; se salta tocando | `apertura: { presenta?: string }` | No (corre una vez) |
| 2 | Varias tomas | 2 o 3 fotos que se suceden con acercamiento lento y fundido | `tomas: true` (usa `imagenes`) | Sí |
| 3 | Foto dentro de las letras | El título relleno con la foto (o el video) | `fotoEnLetras: true` | No (video: sí) |
| 4 | Tratamiento de foto | Duotono con la paleta, grano, trama de puntos, blanco y negro con acento | `tratamiento: "duotono" \| "grano" \| "trama" \| "bn"` | No |
| 5 | Colores desde la foto | Al subir la foto, el editor propone paleta y tema de La Mente parecidos | No se guarda (ayuda del editor) | — |
| 6 | Estado del negocio | «Abierto ahora · cierra a las 22:00», próxima hora libre | `estado: true`; los datos llegan como prop desde quien dibuja | No |
| 7 | Palabras que rotan | La palabra resaltada del título cambia entre 2 a 4 | `palabras: string[]` | Sí |
| 8 | Salida que entrega la posta | Al bajar, el encabezado se vuelve la barra de arriba (logo + botón principal) o se abre como telón hacia el relato | `salida: "barra" \| "telon"` (se suman a las de hoy) | No |
| 9 | Hora del día | Mañana, tarde o noche según la hora local: tinte y luz | `horaDelDia: true` | No |

- La 6 en el kit usa datos de ejemplo; los datos reales de La Mente (horario, agenda) se conectan en el paso 5. Forma de
  los datos (decisión mía, se ajusta en el paso 5): prop `estadoNegocio: { abierto: boolean; cierraA?: "HH:MM";
  abreA?: { dia: string; hora: "HH:MM" }; proximaHora?: string }` (`proximaHora` es fecha ISO). Sin la prop, la idea 6
  no muestra nada.
- **La 8, barra (decisión mía):** muestra `logo` o, si no hay, `nombre` (o el título sin asteriscos), más `botones[0]`.
  Donde quien dibuja ya tiene su barra (La Mente tiene `BarraNegocio`), la prop `barraPropia` hace que el encabezado
  solo se achique y deje ver esa barra, sin dibujar otra. Sin soporte de scroll nativo, la barra aparece fija al pasar el
  encabezado (el respaldo `IntersectionObserver` ya existe para eso).
- **Protagonista (decisión mía, revisable):** el orden pasa a `tomas`, `efecto`, `palabras`, `efectoTexto`, video en
  letras, `luz`. Gana el primero que se mueva sin parar. Los demás se calman así: tomas → solo la primera foto, quieta;
  palabras → queda la primera palabra fija; video en letras → la foto (o el póster) dentro de las letras; el resto, como
  hoy. Las tomas van primero porque son la «película» del encabezado. Va al contrato, como en la v1.
- La 5 compara los colores de la foto con `PALETAS_LAMENTE` y propone la más cercana; sin servidor.
- Topes y validación como en la v1: `palabras` hasta 4 de 24 letras; `presenta` hasta 40.

## Receta de página v1

```
{
  version: 1,
  encabezado: RecetaEncabezado,          // v1 o v2
  relato: RelatoId,                      // el de la página; por defecto el que propone el encabezado
  relatoPagina?: "hilo" | "luz",         // relato de fondo para toda la página (opcional)
  bloques?: [{ id: string, relato?: RelatoId | "ninguno" }]
}
```

- `id` de bloque: en el kit, los bloques de la demo; en La Mente, el `tipo` de su bloque (`precios`, `galeria`…).
- **Qué se guarda (decisión mía):** `relato` es opcional. Si la persona lo eligió, se guarda y no cambia al cambiar de
  estilo. Si no viene, se usa el que propone el estilo al dibujar, así que sigue al estilo. `hilo` y `luz` solo valen en
  `relatoPagina`; en `relato` o en un bloque son un error con su mensaje.
- `validarPagina` / `normalizarPagina` / contrato `contrato/pagina-motionkit.json`, generados igual que la receta del
  encabezado. Errores en español.
- El encabezado propone el relato: cada estilo tiene uno sugerido (neón → película continua, película → cuento, rock →
  escenas, anime → profundidad, retro → carrete), y «Sorpréndeme» puede elegir otro.

## Piezas

- `RELATOS` (catálogo) y tipo `RelatoId`.
- `<PaginaRelato relato relatoPagina estilo>`: pone el relato por defecto, el movimiento base y, si hay, el relato de
  página (hilo o luz) por detrás.
- `<Relato modo>`: envuelve un bloque cualquiera (el de La Mente también) y le aplica su relato.
- **Cómo encuentra las partes de un bloque ajeno (decisión mía):** un contrato de marcas en el HTML del bloque:
  `data-mk-parte="linea" | "foto" | "tarjeta" | "frase"` (y los botones del kit ya se reconocen solos). Cuento usa
  `linea` y `foto`; Subtítulos, `frase` (parte las palabras él mismo); Carrete, `foto` o `tarjeta`; Profundidad y el
  movimiento al cursor, `tarjeta`. **Si el bloque no trae las marcas, ese relato cae a Escenas (A)** para ese bloque, sin
  error. Los bloques de ejemplo del kit traen las marcas; en el paso 5, La Mente las suma a sus bloques (una línea por
  elemento, sin rehacerlos). Se descartó adivinar desde el HTML: se rompe con cualquier cambio del bloque.
- Respaldo `IntersectionObserver` compartido (uno por página, no uno por bloque).
- Encabezado: las props nuevas de la tabla; `paletaDeFoto(archivo)` para el editor.

## Paquete

- Entrada nueva **`motion-kit/pagina`**: `PaginaRelato`, `Relato`, `RELATOS`, receta de página. Tope propuesto 12 KB
  gzip al cargar; se mide y se confirma con Aquiles, como los otros.
- CSS de respaldo: `estilos-pagina.css`, generado igual que `estilos-encabezado.css`.
- `motion-kit/encabezado` mantiene su tope de 35 KB: las ideas nuevas son casi todo CSS. Si se pasa, lo pesado (tomas,
  foto en letras con video) se carga aparte con `import()`.

## Demo y pruebas

- `#encabezados`: controles para las nueve ideas nuevas.
- **`#pagina`** (nuevo): el encabezado más bloques de ejemplo (historia, carta, galería, reseñas, contacto); elegir el
  relato de la página y el de cada bloque; QR para verlo en el teléfono.
- `#relatos` (nuevo): los relatos uno al lado del otro, como los bocetos, para comparar y para sumar nuevos.
- `npm test`: receta v2, receta de página, contratos al día, fichas completas del catálogo.
- `scripts/verificar-relatos.mjs` (Playwright): cada relato se dibuja; con movimiento reducido todo está visible; el
  respaldo sin soporte (forzado con un atributo) deja todo visible; solo `transform`/`opacity` en los keyframes (salvo
  la excepción del Hilo); sin errores en consola.
- `npm run peso` con la entrada `pagina`.

## Orden

1. Cerrar el paso 3: commit y etiqueta `v0.2.0` (con OK de Aquiles). El plan de los relatos parte después de esto.
2. Relatos y movimiento base (`motion-kit/pagina`, `#relatos`, `#pagina`).
3. Encabezado de película (receta v2).
4. Biblioteca local (paso 4 del encargo), ya con recetas de página.
5. Llevarlo a La Mente (paso 5, con encargo y orden de Aquiles).

## Lo que queda para quien lo construya

Los keyframes exactos de cada relato y estilo, los rangos de `animation-range`, los nombres de clases y atributos, los
tamaños y el detalle visual de cada pieza, dentro de lo que muestran los bocetos y de las restricciones de arriba.
