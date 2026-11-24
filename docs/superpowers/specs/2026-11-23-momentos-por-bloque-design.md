# Momentos por bloque (diseño)

Fecha: 23-11-2026. Pedido de Aquiles: «parte con A y después hacemos todo» (A = un momento firma por bloque de La
Mente; después vienen B, pulir lo que hay, y C, las piezas sueltas de la lista pendiente).

## Para qué

La Mente quiere páginas sorprendentes en minutos. Hoy el encabezado y los relatos le dan forma a toda la página, pero
dentro de cada bloque no pasa nada propio: unas reseñas se ven igual que unos sellos. Un **momento** es el efecto que
le pertenece a un bloque y que cuenta lo que el bloque es: el sello que se estampa, la cuenta regresiva del evento.
El dueño pone el bloque y el momento viene solo, con el estilo y los colores de su página.

## Metas

- Primera tanda: 7 momentos para los bloques que más se lucen (abajo), en una entrada nueva `motion-kit/momentos`.
- Movimiento con **resorte** (rebote real, de B) como base de los momentos y disponible para el resto del kit.
- Cada momento con sus tres niveles (completo, liviano, quieto), accesible y dentro de su tope de peso.
- Vitrina `#momentos` en la demo y prueba visual `scripts/verificar-momentos.mjs`.

## No metas (de esta tanda)

- Cambiar los repos de La Mente (se leen, no se tocan desde aquí). La Mente los usa en el paso 5.
- Un interruptor del dueño para apagar el momento: el momento viene siempre; movimiento reducido y ahorro de datos lo
  dejan quieto. Se suma si La Mente lo pide.
- Cambiar la receta de página (`pagina-motionkit.json`): no hay campo nuevo.
- La segunda tanda (los otros 14 bloques), B completo y C: van después, con su propio plan (lista al final).

## Anti metas (sería un fracaso aunque funcione)

- Que un momento tape o retrase el contenido: el texto del bloque se lee desde el primer cuadro, sin esperar la
  animación.
- Que engañe: el raspe del sorteo **muestra el premio que se sortea**, nunca dice «ganaste». El mapa es un dibujo y no
  se presenta como un mapa real.
- Que sea un juguete para el programador y no algo que el dueño recibe sin tocar nada.

## Restricciones (las de siempre)

- Sin librerías ni dependencias nuevas. Escrito desde cero.
- Lo que se anima: solo `transform` y `opacity`. El raspe pinta en un canvas lo que el dedo borra (no es una animación
  de diseño, es dibujo directo).
- Móvil primero: todo responde al dedo; nada depende solo del hover.
- Movimiento reducido: estado final, quieto, contenido visible.
- Accesible: lo decorativo con `aria-hidden`; lo que informa, en texto real; controles con teclado y zonas de 44 px.
- Colores: `var(--mk-acento, var(--lm-acento))` y equivalentes, para que funcione dentro de `Estilo`/`EstiloLaMente` y
  también suelto en una página de La Mente que solo tiene las variables `--lm-*`.
- CSS inyectado con `useStyles` y también en archivo (`estilos-momentos.css`) para la CSP, como las otras entradas.

## Enfoques considerados

| Enfoque | Qué es | Por qué sí o no |
|---|---|---|
| **A. Momento firma por bloque** (elegido por Aquiles) | Una pieza por bloque, con los datos del bloque | Va directo al objetivo: el dueño no elige nada y la página se luce |
| B. Pulir lo que hay | Resortes, tiempos por estilo, repaso de movimientos | Se hace después; de B entra ahora solo el resorte, como base |
| C. Piezas sueltas | Confeti, TextScramble, ImageCompare… | Varias caen dentro de A (confeti, antes y después); el resto después |

Dentro de A, mi decisión de forma: **piezas con los datos del bloque** (no marcas sobre el HTML de La Mente). La
cuenta regresiva, el raspe o los sellos necesitan los datos (fecha, cuántos sellos, el premio); con marcas habría que
leerlos del HTML. Cada pieza recibe un subconjunto de los mismos datos que ya tiene el bloque en La Mente.

## La base común

- **`resorte({ rigidez, amortiguacion, masa })`** en `src/piezas/resorte.ts`, sin React: simula el resorte y devuelve
  una curva CSS `linear(...)` (unos 30 puntos) y su duración en ms. Respaldo `cubic-bezier` donde `linear()` no existe
  (`@supports`). Cada estilo trae su resorte en variables `--mk-resorte` y `--mk-resorte-ms`:
  neón saltón, anime muy saltón, película suave sin rebote visible, rock seco, retro con `steps()` (va con su look de
  8 bits). Fuera de un estilo, un resorte medio por defecto.
  Retro no rebota: llega en 3 o 4 saltos (`steps`). Película usa amortiguación crítica (llega sin pasarse).
- **Al verse, una vez:** el momento arranca cuando el bloque entra a la vista (un `IntersectionObserver` compartido por
  página, como el respaldo de los relatos) y no se repite al volver a subir. Funciona solo, sin relato alrededor.
- **Niveles** con `useNivelEscena`: completo, liviano (sin partículas ni giros 3D; un fundido con resorte) y quieto
  (estado final).
- **Semilla:** lo que es "al azar" (giro de cada sello, calles del mapa, confeti) sale de una semilla (el `slug` del
  negocio), para que la página se vea igual cada vez y en el editor.
- **Sin pelear con los relatos:** el momento anima lo de adentro del bloque; el relato anima el bloque entero. El
  momento arranca con su propio observador cuando un tercio del bloque está a la vista, así el relato ya lo trajo
  (`data-visto` solo existe en el respaldo sin scroll nativo, por eso no se usa como señal). Funciona igual dentro o
  fuera de un `Relato`. El nivel lo decide `useNivelEscena`, no el relato: en quieto, el momento se dibuja ya en su
  estado final.
- **Zona horaria:** `Intl.DateTimeFormat` con `timeZone` (como `hoyEnChile` de La Mente). Navegadores y Node traen la
  zona de Chile; no se escribe una tabla a mano.
- **Vibración:** se reusa `vibrar()` de `src/estilos/sonidos.ts`, que ya respeta las preferencias del kit.

## Los 7 momentos de la primera tanda

Datos: los que ya tiene el bloque de La Mente (`lamente-front/packages/ui/src/bloques/`).

1. **Sellos — `SellosEstampa`** (`total`, `llenos`, `premio`, `semilla`). Los sellos ganados se estampan uno tras otro:
   bajan desde grandes y girados (giro por semilla), golpean y la tarjeta se sacude apenas. El último casillero, el del
   premio, late suave. Texto real: «3 de 10 sellos. Premio: café gratis». Vibración corta al tocar un sello, si el
   teléfono la tiene (opcional, como los sonidos del kit).
2. **Sorteos — `SorteoRaspe`** (`titulo`, `premio`, `ganador?`, `semilla`). Una capa del color del acento tapa el premio
   con «Raspa para ver el premio»; el dedo o el mouse la borra en un canvas; pasado cerca de la mitad, la capa se
   desvanece. Botón «Ver premio» para teclado y para quien no quiera raspar; el premio está en el texto de la página
   siempre (el canvas es `aria-hidden`). Si hay `ganador`, al verse salta confeti una vez (piezas DOM con transform, no
   canvas) y se anuncia el ganador en texto. Movimiento reducido: sin capa ni confeti.
3. **Eventos — `CuentaRegresiva`** (`titulo`, `fecha` `YYYY-MM-DD`, `hora` `HH:MM`, `zona` = `America/Santiago` por
   defecto). Días, horas, minutos y segundos con cifras que se voltean (dos mitades con `rotateX`). Solo corre con el
   bloque a la vista y la pestaña visible. Menos de un día: «¡Es hoy!» con la hora; pasado: «Ya empezó» y sin contador.
   Para lectores de pantalla, un texto que dice «Faltan 3 días y 4 horas», sin anunciar cada segundo. La hora es la del
   negocio, no la del navegador (función pura `faltaPara(fecha, hora, zona, ahora)`).
4. **Reseñas — `ResenasPila`** (`promedio`, `total`, `resenas[]` con `estrellas`, `nombre`, `texto`). Las estrellas se
   llenan hasta el promedio (también fracciones, como 4,6) con una capa que crece de izquierda a derecha (`scaleX`); el
   promedio sube contando. Las tarjetas vienen apiladas y la de arriba se desliza con el dedo para ver la siguiente;
   botones «Anterior» y «Siguiente» para teclado y escritorio. Sin reseñas: no se dibuja.
5. **Galería — `MosaicoQueSeArma`** (`fotos[]` con `url` y `pie`). Las fotos llegan como fotos impresas tiradas sobre
   una mesa (giradas y corridas, por semilla) y caen a su lugar en la grilla mientras se baja. Más **`AntesDespues`**
   (`antes`, `despues`, `etiquetas?`): deslizador con el dedo y con flechas del teclado (`role="slider"`); el corte se
   hace con dos capas que se mueven en sentidos contrarios (solo `transform`). La galería de La Mente hoy no tiene
   pares de fotos: `AntesDespues` queda listo para cuando La Mente decida cómo se marcan (pendiente de La Mente).
6. **Precios — `CartaQueSeAbre` y `PrecioQueRueda`**. En el bloque, las listas de precios llegan como cartas que se
   abren en abanico; la destacada queda adelante con un borde de luz que la recorre. En la página de la lista,
   `PrecioQueRueda` (`valor`, `moneda` = CLP) hace rodar cada cifra hasta el precio, como un cuentakilómetros
   (`$12.990`, formato es-CL), al verse y cuando cambia el valor.
7. **Ubicación — `MapaDibujado`** (`direccion`, `semilla`, `abierto?`). Un plano dibujado en SVG (calles inventadas
   desde la semilla, no un mapa real) que aparece por capas, y un pin que cae con resorte y suelta un anillo. Si el
   negocio está abierto, el punto «Abierto ahora» late (punto propio: `EstadoNegocio` pide el horario completo y aquí
   basta con `abierto`). El SVG es `aria-hidden`; la
   dirección y el botón «Ver en Google Maps» siguen siendo texto y enlace reales.

Orden de construcción: base (resorte, al verse, niveles) → sellos → reseñas → precios → eventos → ubicación → galería
→ sorteos (el más complejo) → vitrina, pruebas y peso.

## Datos: nombres del kit y de dónde salen en La Mente

Las piezas usan nombres propios del kit (cortos y genéricos); La Mente los llena desde sus bloques en el paso 5.
Verificado contra `lamente-front/packages/ui/src/` el 23-11:

| Pieza | Prop del kit | En La Mente |
|---|---|---|
| `SellosEstampa` | `total`, `llenos`, `premio` | `sellosPremio`, `sellos` (de `TarjetaSellos`), `premio` |
| `SorteoRaspe` | `titulo`, `premio`, `ganador?` | iguales (`BloqueSorteos`) |
| `CuentaRegresiva` | `titulo`, `fecha`, `hora` | iguales (`EventoProximo`; se usa el primero de `proximos`) |
| `ResenasPila` | `promedio`, `total`, `resenas[]` (`estrellas`, `nombre`, `texto?`) | iguales (`BloqueResenas`, `ResenaBloque`) |
| `MosaicoQueSeArma` | `fotos[]` (`url`, `pie?`) | `albumes[].fotos` (`AlbumBloque`) |
| `CartaQueSeAbre` | `listas[]` (`titulo`, `href`), `destacada?` (índice) | `ResumenLista` (`titulo`; el enlace lo arma La Mente). La Mente no marca una lista destacada: sin `destacada`, ninguna se adelanta |
| `PrecioQueRueda` | `valor` (pesos enteros), `moneda` | precio de cada producto en `PreciosLista` |
| `MapaDibujado` | `direccion`, `abierto?` | `direccion` (`Ubicacion`); `abierto` desde el horario |
| todas | `semilla` | el `slug` del negocio |

`CartaQueSeAbre` y `PrecioQueRueda` son dos piezas aparte: la carta no lleva precios (el bloque de La Mente solo
enlaza a las listas); `PrecioQueRueda` va en la página de cada lista.

## Entrada, peso y paquete

- Entrada nueva **`motion-kit/momentos`** con tope de **12 KB** gzip (unos 1,5 KB por momento). Se suma a
  `TOPES_KB` en `scripts/medir-paquete.mjs`, a `exports` del `package.json`, a `generar-css.mjs` y a
  `probar-paquete.mjs`.
- **Nada de esto se exporta desde la entrada principal** `motion-kit`, tampoco `resorte`: la principal está en 79,7
  de 80 KB. `resorte` sale de `motion-kit/momentos`; cuando B lo lleve a `Movimiento` se decide su lugar. Se anota en
  el CHANGELOG.
- Si la entrada pasa de 12 KB: primero se carga aparte (`React.lazy`) lo más pesado (`SorteoRaspe` con su confeti, y
  `AntesDespues`), como ya se hace con el shader en el encabezado. Los topes no se suben sin el OK de Aquiles.
- Sin etiqueta nueva todavía: se etiqueta cuando La Mente vaya a instalar.

## Demo y pruebas

- **`#momentos`**: los 7 momentos con datos de ejemplo, selector de estilo (los 5 del kit y uno de La Mente vía
  `EstiloLaMente`) y selector de nivel, para ver completo, liviano y quieto lado a lado. Botón «Repetir» por momento.
- **Pruebas unitarias** (`npm test`): `resorte` (empieza en 0, termina en 1, la amortiguación alta no rebota),
  `faltaPara` (zona de Chile, cambio de hora, evento pasado, «es hoy»), cifras de `PrecioQueRueda` (formato es-CL),
  `cuantoRaspado` (porcentaje borrado de una grilla de muestras), estrellas fraccionarias.
- **`scripts/verificar-momentos.mjs`** (Playwright): cada momento llega a su estado final; con movimiento reducido todo
  queda visible y sin animaciones; el deslizador y «Ver premio» funcionan con teclado; el texto real está en la página
  desde el inicio; nada se sale de la pantalla a 360 px. Se suma a la lista de pruebas visuales del `CLAUDE.md` y a
  `docs/ci/verificar.yml`.

## Qué queda para quien construye

- Las cifras exactas de cada resorte por estilo (que se sientan como el estilo).
- Cuántos puntos tiene la curva `linear()` y el umbral exacto del raspe (alrededor de 50 %).
- El dibujo del mapa y del confeti, dentro de lo descrito.

## Después (pedido «después hacemos todo»)

**Segunda tanda de momentos** (los otros bloques de La Mente):
- **Agenda, calendario y clases:** el día de hoy se enciende y los días se voltean como hojas.
- **Pedidos:** el botón late si está abierto y el carrito rebota al sumar.
- **Contacto:** burbuja de WhatsApp que «escribe».
- **Novedades:** tarjetas que llegan como correo nuevo.
- **Enlaces:** botones que se alinean como dominó.
- **Episodios:** onda de audio (se reusa el ecualizador).
- **Avisos:** la franja se despliega y el texto se descifra.
- **Cinta:** la velocidad sigue al scroll.
- **Buzón:** sobre que se cierra al enviar.
- **Cotizaciones:** hoja que se arma línea a línea.
- **Secciones:** acordeón con resorte.
- **Encuestas:** barras que crecen en los resultados.

**B:** resorte en `Movimiento`, `Presencia` y botones; tiempos por estilo; repaso de los 23 movimientos y los 17
efectos.

**C:** el resto de la lista pendiente del catálogo (`Modal`, `BentoGrid`, `StickyScroll`, `TextScramble`, `Dock`,
`Cursor`, `BrowserFrame`, `SwipeRow`).
