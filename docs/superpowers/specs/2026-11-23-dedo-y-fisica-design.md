# Dedo y física: nueve efectos (diseño)

Fecha: 23-11-2026. Pedido de Aquiles: «necesitamos más efectos» y, sobre la lista propuesta, «hazla completa en ese
orden».

## Para qué

Más efectos para que las páginas de los negocios sorprendan, con la mezcla que mejor nos resulta: CSS como base y
JavaScript propio con Canvas o WebGL para lo que reacciona al dedo, la física y los fondos. Todo escrito por nosotros,
cargado aparte y elegible desde las recetas, para que el dueño lo prenda sin configurar nada más.

## Los nueve, en el orden pedido

| # | Efecto | Dónde va | Cómo se prende | Con qué |
|---|---|---|---|---|
| 1 | **Cartas apiladas** | Bloques, al bajar | Receta de página: `relato: "pila"` (de la página o de un bloque) | CSS con scroll nativo y un poco de JS para medir |
| 2 | **Texto que se descifra** | Título del encabezado y cualquier `TextoCinetico` | `efectoTexto: "descifrar"` | JavaScript |
| 3 | **Letras con imán** | Título del encabezado | Receta del encabezado: `iman: true` | JavaScript (resortes) |
| 4 | **Letrero colgante** | Encabezado, composición «letrero» | Receta del encabezado: `colgante: true` | JavaScript (péndulo) |
| 5 | **Inclinación por velocidad** | Toda la página | Receta de página: `relatoPagina: "impulso"` | JavaScript |
| 6 | **Objetos del rubro que caen** | Fondo del encabezado | `efecto: "granos"`, `"tijeras"`, `"huellas"`, `"pesas"` o `"lapices"` | Canvas con física propia |
| 7 | **Constelación** | Fondo del encabezado | `efecto: "constelacion"` | Canvas |
| 8 | **Lámpara de lava** | Fondo del encabezado | `shader: "lava"` | WebGL |
| 9 | **Estela y chispas** | Toda la página | Receta de página: `estela: true` | Canvas |

## Metas

- Los nueve efectos, cada uno con sus tres niveles, accesible y con sus pruebas.
- Todo lo nuevo se carga aparte (`import()`): en las entradas solo entran los nombres, la validación y el aviso.
- Se eligen desde las recetas (encabezado v2 y página v1, que todavía no tienen etiqueta: se suman campos y valores sin
  abrir versiones nuevas) y aparecen en los editores de la demo.
- Vitrina: los fondos en `#efectos`, lo del encabezado en `#encabezados`, lo de página en `#relatos` y `#pagina`.

## No metas

- La carta que se abre como libro, el carrusel 3D, los fuegos artificiales y el ecualizador con sonido real: tanda
  siguiente.
- Librerías (Matter.js queda para la página de presentación): la física de esta tanda es propia y chica.
- Cambiar los repos de La Mente.

## Anti metas

- Que un efecto tape o vuelva ilegible el texto: los fondos van detrás del contenido y a media fuerza.
- Que maree: la inclinación por velocidad y el letrero se mueven poco (grados contados) y se apagan con movimiento
  reducido.
- Que el teléfono se trabe: lo de Canvas y WebGL solo en nivel completo; en liviano, una versión quieta o nada.
- Que un bloque con el foco del teclado quede tapado por otro (cartas apiladas).

## Restricciones

- Las del repo (`CLAUDE.md`): sin dependencias; móvil primero; en lo que se anima con CSS, solo `transform` (o
  `translate`, `scale`, `rotate`) y `opacity`; Canvas y WebGL dibujan en su lienzo; movimiento reducido; accesible.
- Capas decorativas con `aria-hidden` y sin recibir toques; el texto real no cambia para lectores de pantalla.
- Nada «al azar» de verdad: lo que varía sale de una semilla, para que la página se vea igual cada vez.
- Un solo fondo animado por encabezado (regla que ya existe): los objetos que caen, la constelación y la lava son
  fondos y entran en esa regla. El imán, el letrero y la estela responden al dedo o se asientan: no cuentan como
  protagonista.
- Pesos: ver «Peso» (hay una decisión de Aquiles).

## Enfoques considerados

| Enfoque | Decisión |
|---|---|
| **CSS como base y JavaScript propio con Canvas o WebGL para lo que sorprende** (elegido por Aquiles) | Lo más liviano que alcanza para física, partículas y dedo; todo se carga aparte |
| Matter.js para la física | Descartado aquí: 80 KB para treinta círculos; queda para la página de presentación |
| Solo CSS | No alcanza para lo que reacciona al dedo ni para la física |

## Cómo funciona cada uno

### 1. Cartas apiladas (`relato: "pila"`)

- Cada bloque queda pegado arriba mientras el siguiente sube y lo tapa; el tapado se achica un poco (hasta 0,94) y se
  apaga un poco, ligado al scroll. Los bloques llevan el fondo de la página, esquinas de arriba redondeadas y una
  sombra suave, para que se lean como cartas.
- Un bloque más alto que la pantalla primero se recorre entero y recién ahí queda pegado (JS mide su alto y lo deja en
  una variable; con `ResizeObserver`).
- **Foco:** un bloque con el foco adentro deja de quedar pegado, así nunca queda tapado.
- Sin scroll nativo, en liviano o quieto: se comporta como «escenas» (lo que ya hacen los relatos pesados).
- No alarga la página.

### 2. Texto que se descifra (`efectoTexto: "descifrar"`)

- El texto está visible y completo desde el inicio. Al entrar a la vista, cada letra pasa por unos signos y se resuelve
  de izquierda a derecha (unos 45 ms por letra, 1,2 s como máximo).
- Cada letra mantiene su ancho mientras cambia, para que el título no baile.
- Los signos salen de una semilla. Para lectores de pantalla el texto no cambia (`aria-label`, como hoy).
- Liviano y quieto: el texto queda como está.

### 3. Letras con imán (`iman: true`)

- Las letras del título se apartan del dedo o del cursor (hasta unos 18 px, en un radio de unos 140 px) y vuelven con
  rebote. En el teléfono reaccionan al toque.
- Parte cuando termina la entrada del título. No se aplica a la palabra que rota ni con la foto en las letras (ahí se
  apaga, con aviso en la receta).
- Solo en nivel completo.

### 4. Letrero colgante (`colgante: true`)

- En la composición «letrero», el marco con el título cuelga de dos cuerdas y se balancea como un péndulo: al abrir
  (parte inclinado unos 7° y se asienta en menos de 4 s), al tocarlo (empujón hacia el lado tocado), al bajar la página
  (empujón chico) y, si el encabezado ya sigue la inclinación del teléfono, se ladea un poco con él.
- El texto y los botones siguen siendo reales y se pueden tocar. Cuando se asienta, deja de calcular.
- En otra composición se apaga, con aviso. Liviano y quieto: quieto y derecho.

### 5. Inclinación por velocidad (`relatoPagina: "impulso"`)

- Al bajar rápido, los bloques se inclinan apenas (1,5° como máximo) en el sentido del movimiento y se asientan con
  rebote al parar.
- Es un relato de página, como «hilo» y «luz»: se elige uno.
- Solo en nivel completo.

### 6. Objetos del rubro que caen (`efecto`)

- Cinco fondos nuevos, uno por objeto: **granos** de café, **tijeras**, **huellas**, **pesas** y **lápices**. La
  `variante` (1 a 3) es la cantidad.
- Caen desde arriba, chocan entre sí, se apilan al fondo del encabezado y se quedan quietos. El dedo o el cursor los
  empuja; un toque los hace saltar.
- Física propia: círculos con gravedad, choques y roce; a lo más 30 objetos (menos en teléfonos); se duerme cuando todo
  está quieto.
- Van detrás del texto, a media fuerza, con los colores del estilo.
- Liviano: aparecen ya apilados, sin simular. Quieto: no se dibujan (como los demás fondos).

### 7. Constelación (`efecto: "constelacion"`)

- Puntos que se mueven lento; los que están cerca se unen con líneas; los cercanos al dedo se le acercan y se unen a él.
- `variante`: densidad. Menos puntos en teléfonos.
- Liviano: menos puntos y sin seguir al dedo. Quieto: no se dibuja.

### 8. Lámpara de lava (`shader: "lava"`)

- Manchas de color que suben, bajan y se funden, con los colores del estilo; el dedo suma una mancha.
- Un fragmento más en `ShaderFondo`, que ya se carga aparte y ya se apaga en liviano y quieto.

### 9. Estela y chispas (`estela: true`)

- Con mouse: una estela de luz corta que sigue al cursor y se apaga rápido. Con el dedo: cada toque suelta unas
  chispas.
- Un lienzo fijo sobre la página, que no recibe toques y solo dibuja mientras hay algo vivo.
- Solo en nivel completo.

## Recetas y contratos

- **Encabezado (v2):** valores nuevos en `efecto` (6), `shader` (1) y `efectoTexto` (1); campos nuevos `iman` y
  `colgante` (booleanos). Avisos: «El letrero colgante va con la composición «letrero»: queda apagado.» y «Con la foto
  en las letras, el imán queda apagado.».
- **Página (v1):** `"pila"` en `relato`, `"impulso"` en `relatoPagina` y el campo nuevo `estela` (booleano).
- Los dos contratos se regeneran. Antes de que La Mente mande estos valores, su copia del contrato tiene que estar al
  día (misma condición que ya existe para la v2).

## Peso (decisión de Aquiles)

Todo el código nuevo se carga aparte. En las entradas solo entran los nombres para validar, los avisos y la conexión.
Aun así, tres entradas no tienen espacio:

| Entrada | Hoy | Tope | Lo que suma esta tanda (estimado) |
|---|---|---|---|
| Principal | 79,97 KB | 80 | cerca de 1 KB: **no cabe** |
| `pagina` | 16,6 KB | 17 | cerca de 0,4 KB: queda al borde o se pasa |
| `receta` | 9,4 KB | 10 | cerca de 0,4 KB: cabe justo |
| `encabezado` | 33,4 KB | 35 | cerca de 0,6 KB: cabe |

Propuesta, **aprobada por Aquiles el 23-11 («ok»)**. Los topes nuevos son un máximo: se suben solo si al medir hace
falta.

1. **Principal:** los medidores del editor (peso, fluidez, carga, contraste) dejan de salir por la entrada principal y
   quedan solo en `motion-kit/escena`, donde ya están. Libera cerca de 7 KB. Cambia desde dónde se importan (se anota
   en el CHANGELOG como cambio que rompe).
2. **`pagina` y `receta`:** subir sus topes a 18 y 11 KB. Es código que de verdad se usa al abrir (los nombres de los
   efectos para validar la receta), y sigue lejos del presupuesto de la página.

Si al medir algo no cabe ni con esto, se para y se pregunta.

## Decisiones de construcción (mías, tras la revisión)

- **Punto de partida:** el árbol de trabajo actual, con los momentos y las fotos vivas cerrados y sus pruebas en verde
  (todavía sin commit, por instrucción de Aquiles). Los pesos de la tabla salen de ese estado.
- **Peso:** el plan parte con la propuesta de arriba como supuesto y tiene una parada obligatoria: `TOPES_KB` y las
  exportaciones de la entrada principal no se tocan sin el OK de Aquiles.
- **Quién usa hoy los medidores desde la entrada principal:** nadie fuera de la demo. La Mente todavía no instala
  motion-kit (revisado el 23-11) y `probar-paquete` no los importa. Se cambian los `import` de la demo y basta; no hace
  falta período de transición.
- **Contratos sin versión nueva:** basta con lo que ya existe. El contrato viaja en el paquete con cada etiqueta y La
  Mente lo copia al instalarla; ni la receta v2 ni la de página tienen etiqueta todavía. No se agrega una marca nueva.
- **Entrega:** un solo plan, una tarea por efecto, en el orden pedido. Cada tarea deja su efecto completo y probado, así
  que si hay que cortar se cortan los últimos. Sin commits (salvo que Aquiles diga otra cosa) y una revisión final en
  Opus, como en las tandas anteriores.
- **`descifrar`** es un efecto de `TextoCinetico`: queda disponible para cualquier título que use ese componente y, en
  la receta del encabezado, entra solo a la lista `efectoTexto`. La receta de página no tiene campo de efecto de texto
  y no se le agrega.
- **Letrero e inclinación del teléfono:** usa la señal de movimiento que ya tiene el encabezado (`--mk-cx`, que sigue
  al dedo o al cursor y, si `mover` trae «inclinacion», al giroscopio). Con `colgante`, el encabezado mantiene esa
  señal prendida aunque no haya profundidad ni luz.
- **`pila` por bloque o de página:** el mecanismo ya existe (`relato` de la página y `bloques[].relato`); «pila» es un
  valor más de la misma lista. Los momentos no chocan: animan lo de adentro del bloque y arrancan al verse.

## Pruebas

- **Unitarias** (funciones puras): paso de la física (los círculos no quedan encimados, descansan en el piso, la
  energía baja), péndulo (se asienta en 0), imán (nada fuera del radio, máximo al centro, se aleja del dedo),
  descifrado (termina en el texto original, misma semilla da lo mismo), `top` de las cartas apiladas, inclinación
  (tope y vuelta a 0), enlaces de la constelación, vida de la estela y las chispas; recetas y contratos.
- **Visuales** (`scripts/verificar-dedo.mjs`, Playwright): cada efecto se ve y termina donde debe; con movimiento
  reducido no hay animaciones ni lienzos; el texto sigue completo para lectores; el foco no queda tapado en las cartas
  apiladas; los objetos terminan dentro del encabezado y se duermen; sin WebGL o sin Canvas no hay errores; a 360 px
  no hay scroll horizontal; los keyframes solo animan `transform` y `opacity`.
- Las pruebas que ya existen (efectos, relatos, película, encabezados, momentos, fotos) siguen pasando.

## Qué queda para quien construye

- Las cifras finas de cada efecto (fuerzas, radios, tiempos) dentro de lo descrito.
- El dibujo de cada objeto (trazos simples, con los colores del estilo).
- Cómo se reparte el código, siempre que se cargue aparte.
