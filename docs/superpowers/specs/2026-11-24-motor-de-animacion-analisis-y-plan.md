# Motor de animación propio: análisis y plan

Fecha: 24-11-2026. Pedido de Aquiles: llevar la creación de páginas con animación a otro nivel, con un motor o un
lenguaje propio, pensando en que los computadores y los teléfonos van a seguir mejorando.

Estado: **aprobado por Aquiles el 24-11-2026 («si a todo, partamos con la fase 0»).** Aprobó las cinco decisiones
de la sección 7 tal como se proponen. Las fases siguientes se aprueban una por una, con los números de la anterior.

## Resumen

- **El problema no es que falten efectos. Es cómo los hacemos.** Hoy cada efecto es una pieza escrita a mano, con su
  propio reloj, sus propios oyentes y su propia entrada en el contrato. Sumar uno cuesta lo mismo que el primero, y
  las piezas no se pueden combinar ni coordinar.
- **La propuesta:** dejar de sumar piezas y pasar a un **lenguaje para describir movimiento** (lo llamo
  **Partitura**) y un **motor que lo interpreta** (lo llamo **Director**). Un efecto nuevo pasa a ser un dato, no
  código nuevo.
- **No se reinventa lo que el navegador ya hace bien.** El Director traduce cada partitura a lo más barato que el
  navegador ofrece (animaciones nativas, líneas de tiempo de scroll, transiciones de vista, la tarjeta gráfica) y
  solo corre código propio donde no hay otra forma.
- **Está pensado para crecer con los equipos.** Una partitura se escribe para un teléfono modesto y declara qué
  mejora cuando hay más máquina. El mismo diseño se ve mejor en un equipo mejor, sin tocarlo.
- **No recomiendo adoptar un motor de terceros.** El más conocido (GSAP) tiene una licencia que prohíbe usarlo en
  herramientas que compitan con Webflow, y el Estudio de La Mente es un constructor de páginas.
- **«Escenas por capas», la tanda anotada, queda dentro de esto.** Su «receta de escena» es una partitura.
- **Plan en seis fases.** La primera es una prueba chica y desechable para medir antes de comprometerse.

## 1. Dónde estamos

Lo que hay hoy en motion-kit (contado en el repo el 24-11-2026):

| Qué | Cuánto |
|---|---|
| Efectos de fondo y escena en el registro | 28 |
| Efectos de texto | 12 |
| Composiciones del encabezado | 12 |
| Piezas de momentos (por bloque) | 18 |
| Relatos (de página y de bloque) | 8, 3 y 9 |
| Campos de la receta del encabezado | 37 |
| Animaciones CSS distintas (`@keyframes`) | 148 |
| Archivos con su propio bucle de cuadros | 19 |
| Archivos con su propio observador de «está a la vista» | 17 |
| Pruebas visuales | 13 guiones, unas 4.600 líneas, cerca de 930 revisiones |

Funciona y está probado. Pero tiene siete límites que no se arreglan sumando piezas.

1. **Cada efecto nuevo cuesta lo mismo que el primero.** Hay que escribir el componente, su CSS, sus pruebas, sumar
   un valor al contrato, regenerarlo, que el backend de La Mente lo copie y publicar una etiqueta. Cinco fondos fueron
   una tanda entera.
2. **Las piezas no se conocen entre sí.** El título, el fondo, la foto y los botones tienen cada uno su reloj. No se
   puede decir «cuando termine el título, que el fondo reaccione y recién ahí aparezca el botón». La coordinación hoy
   son esperas fijas en milisegundos.
3. **Cada efecto conecta sus propias entradas.** El dedo, el scroll, la inclinación y el tiempo se escuchan ocho
   veces, de ocho formas. No hay una idea común de «señal».
4. **Las recetas eligen, no componen.** El Estudio puede escoger entre 28 fondos y 12 efectos de texto. No puede
   crear un movimiento que no exista. «Sorpréndeme» baraja la misma lista.
5. **Los niveles miran hacia abajo.** Hay completo, liviano y quieto, y se decide una vez, a los 4 segundos. No hay
   un nivel para equipos fuertes, ni ajuste mientras la página está abierta.
6. **Hay tres mundos que no se hablan:** CSS, lienzo 2D y WebGL. Cada lienzo es aparte (por eso el tope de dos
   lienzos WebGL por página).
7. **La app móvil no puede reusar nada.** Los efectos son código de React y CSS. `lamente-app` es Kotlin. Si el
   movimiento fuera un dato, la app podría interpretarlo.

Y uno más, que costó caro en esta tanda: **las mismas fallas se redescubren pieza por pieza.** El enlace que se mueve
bajo el cursor, el oyente que queda vivo, el texto que no se lee con lector de pantalla, la animación que sigue con
movimiento reducido. Cada pieza las resuelve de nuevo, y la revisión final las vuelve a encontrar.

## 2. Hacia dónde va el navegador

Revisado en noviembre de 2026. Las fuentes están al final.

| Capacidad | Estado | Qué permite |
|---|---|---|
| Animaciones atadas al scroll, sin código (`animation-timeline`) | En todos los navegadores desde octubre de 2026 (Firefox 159 fue el último) | Movimiento que sigue al scroll sin gastar el hilo principal |
| Animaciones que se disparan al llegar a un punto del scroll (`animation-trigger`) | Anunciado para Chrome 145; los demás, no todavía | Reemplaza nuestros observadores de «a la vista» |
| Transiciones de vista dentro de una página | En todos desde octubre de 2025 (Firefox 144 fue el último) | Un elemento que crece, cambia de lugar o de forma |
| Transiciones de vista entre páginas | Chrome 126 y Safari 18.2; Firefox, a medias | La foto de la tarjeta que viaja a la página siguiente |
| Transiciones de vista por elemento, varias a la vez | Solo Chrome 147 | Varias transiciones independientes en la misma página |
| WebGPU | Chrome, Edge, Safari 26 (también iPhone) y Firefox en Windows y en Mac nuevos; en Android, Chrome sí y Firefox no | Decenas de miles de partículas, fluidos, luz real |
| Contenido real de la página dentro de un lienzo (HTML en canvas) | En prueba en Chrome 148 a 151; no se sabe si sale | Efectos de vidrio, agua o calor sobre el texto y las fotos de verdad |

Tres conclusiones:

- **Lo básico ya no necesita librería.** Tiempo, scroll y cambios de estado los anima el navegador solo, fuera del
  hilo principal. Un motor de 2026 no debería calcular cuadro a cuadro lo que el navegador ya calcula.
- **La tarjeta gráfica llegó a los teléfonos.** WebGPU está en el iPhone y en Chrome de Android. Hoy la usamos en dos
  efectos escritos a mano.
- **Lo que viene cambia qué es posible, no solo qué tan rápido.** Si «HTML en canvas» sale, cualquier bloque de la
  página podrá deformarse como agua. Un motor bien pensado deja ese lugar listo, para que las recetas no cambien el
  día que llegue.

## 3. Los caminos posibles

| Camino | A favor | En contra |
|---|---|---|
| **A. Seguir como hoy** (una pieza por efecto) | Sin riesgo. Sabemos hacerlo | Costo parejo para siempre. Nada se combina. No aprovecha equipos mejores |
| **B. Adoptar un motor de terceros** | Años de trabajo ya hecho | Ver abajo |
| **C. Motor y lenguaje propios, montados sobre lo que el navegador ya trae** (recomendado) | Un efecto nuevo es un dato. Todo se coordina. Las reglas de la casa se cumplen en un solo lugar. Sirve a la app | Es una inversión: dos o tres tandas antes de ver efectos nuevos. Riesgo de construir algo que rinda menos que lo hecho a mano |

Por qué no el camino B:

| Motor | Licencia | Por qué no nos sirve como base |
|---|---|---|
| GSAP | Gratis desde 2025, pero con licencia propia de Webflow, no abierta. Según lo que encontré, prohíbe usarlo en herramientas que compitan con Webflow (no leí la licencia entera) | El Estudio de La Mente es un constructor de páginas. Y, aparte de eso, rompe la regla del repo (solo MIT, Apache o BSD) |
| Motion | MIT | Resuelve el «cómo se mueve» (entre 3 y 18 KB), que es justo lo que el navegador ya hace. No resuelve lo nuestro: recetas que arma la gente, niveles, pesos, accesibilidad |
| Rive | El reproductor es MIT | Los diseños se hacen en su editor (cerrado). Sirve para personajes y dibujos, no para animar el texto y las fotos de una página. El reproductor trae su propio motor de dibujo en WASM (no conseguí la cifra de su peso) |

Ninguno entiende de negocios chicos, de los datos de un bloque de La Mente, ni de páginas que arma alguien sin saber
de animación. Eso es lo que hay que construir, y es chico: lo pesado ya lo pone el navegador.

Motion o Rive pueden entrar después como **adaptadores opcionales**, como ya permite la regla del repo.

## 4. La propuesta

Dos cosas con nombre propio (los nombres son propuesta):

- **Partitura:** el lenguaje. Describe **quién** se mueve, **cuándo**, **cómo** y **en respuesta a qué**. Es un dato,
  no código.
- **Director:** el motor. Lee una partitura y la hace correr de la forma más barata posible en ese equipo.

### 4.1 Las cinco ideas de la Partitura

| Idea | Qué es | Hoy |
|---|---|---|
| **Actores** | Lo que se mueve: una parte de la página (ya se marcan con `data-mk-parte`), sus letras o palabras, o una capa que crea el motor (partículas, luz) | Cada pieza busca sus elementos |
| **Señales** | Lo que manda: `tiempo`, `vista` (cuánto ha entrado en pantalla), `scroll`, `velocidad`, `puntero`, `inclinacion`, `toque`, `estado` (apuntado, enfocado, abierto), `dato` (un número del negocio: cupos, sellos, precio) y, más adelante, `audio` y `hora` | Cada efecto escucha lo suyo |
| **Movimientos** | Un cambio de un actor: de dónde a dónde, con qué curva o resorte, atado a una señal | 148 animaciones CSS escritas a mano |
| **Escenas** | El orden: «después de», «junto con», «de a uno cada 80 ms» | Esperas fijas |
| **Mejoras** | Lo que se suma cuando hay más máquina: más cantidad, más detalle, otra técnica | Tres niveles, hacia abajo |

### 4.2 Cómo se escribe

Dos formas de lo mismo:

- **JSON**, que es la forma oficial. Es lo que se guarda, lo que valida el contrato y lo que viaja a la página.
- **Texto**, para escribir rápido. Se traduce a JSON. Solo lo usa quien crea (nosotros, el Estudio, un asistente).

Ejemplo en texto, para dar la idea (la sintaxis exacta se define en la fase 2):

```
escena portada

al verse:
  titulo   entra desde abajo 24px, por letra, cada 30ms, resorte suave
  luego    foto aparece, 600ms
  junto    fondo bandada, cantidad 24

con vista:
  foto     sube 0 a -40px
  titulo   se apaga 1 a 0, entre 60% y 100%

con puntero:
  tarjeta  se inclina hasta 6 grados, resorte firme

con dato cupos:
  barra    se llena hasta el valor

mejoras:
  con mas maquina   fondo bandada, cantidad 50
  con gpu           fondo bandada, cantidad 2000, con estela
```

Por qué un texto en español y no solo JSON:

- **Lo podemos escribir y leer rápido**, nosotros y quien revise. Una entrada nueva son diez líneas.
- **Un asistente lo puede escribir.** «Hazme una entrada elegante para una cafetería» pasa a ser generar diez líneas
  que el contrato valida. Con JSON suelto se equivoca más y es más difícil de corregir a mano.
- **Es corto y cerrado.** No es un lenguaje de programación: no tiene ciclos, ni funciones, ni direcciones web. No
  puede ejecutar nada. Eso importa, porque las partituras las va a guardar gente con su propio login.

### 4.3 Cómo trabaja el Director

La idea central: **traducir, no interpretar.** Para cada movimiento elige al ejecutor más barato que lo pueda hacer.

```
                    ┌────────────────────────── Partitura (JSON) ─────────────────────────┐
                    │     actores · señales · movimientos · escenas · mejoras             │
                    └──────────────────────────────────┬──────────────────────────────────┘
                                                       │  valida, aplica las reglas de la casa,
                                                       │  mira el equipo y reparte
        ┌──────────────────┬───────────────────────────┼─────────────────────┬─────────────────────┐
        ▼                  ▼                           ▼                     ▼                     ▼
  1. Navegador:      2. Navegador:              3. Navegador:          4. El compás:          5. La capa gráfica:
  animación por      línea de tiempo            transición             un solo bucle para     un solo lienzo por
  tiempo             de scroll                  de vista               lo que sigue al dedo   página (2D, WebGL
  (sin código        (sin código                (cambios de            o a la velocidad;      o WebGPU), con todas
  por cuadro)        por cuadro)                estado o página)       duerme si nada cambia  las capas adentro
```

- **Ejecutores 1, 2 y 3:** los pone el navegador. Corren fuera del hilo principal. Si el navegador no tiene alguno,
  el Director cae al siguiente (el 4), y la partitura no cambia.
- **Ejecutor 4, el compás:** un bucle para toda la página en vez de los 19 de hoy. Lee todo junto y escribe todo
  junto. Se detiene cuando ninguna señal cambia.
- **Ejecutor 5, la capa gráfica:** un lienzo compartido en vez de uno por efecto. Termina con el tope de dos lienzos.
  Usa WebGPU donde hay, y si no, WebGL o lienzo 2D.
- **Lugar reservado:** cuando «HTML en canvas» salga, será un sexto ejecutor. Las partituras no cambian.

### 4.4 Las reglas de la casa, en un solo lugar

Hoy cada pieza tiene que acordarse de cumplirlas. Con el Director son parte del motor, y ninguna partitura las puede
saltar:

- En la página solo se anima posición, giro, tamaño y opacidad.
- El texto se lee desde el primer cuadro. Lo que entra animado es decoración.
- Lo que se puede apretar no se mueve bajo el cursor ni bajo el dedo.
- Fuera de la vista o con la pestaña oculta, todo se detiene.
- Con «reducir movimiento», todo queda en su estado final.
- Al salir no queda nada vivo.
- Nada de azar: todo sale de una semilla.
- Cada partitura tiene topes: cuántos movimientos, cuánto dura, cuántas partículas.

Cuatro fallas de esta tanda (el enlace que se movía bajo el cursor, el observador que
quedaba vivo, la medición que seguía con movimiento reducido, el texto que el lector no leía) son de este tipo. Con
el Director se arreglan una vez.

### 4.5 Pensado para equipos mejores

Hoy se diseña para el mejor caso y se recorta. La propuesta es al revés: **se diseña para un teléfono modesto y se
declara qué mejora.**

| Peldaño | Equipo | Qué se ve |
|---|---|---|
| Quieto | Movimiento reducido o ahorro | El estado final, sin movimiento |
| Liviano | Teléfono lento o con poca batería | Fundidos simples, sin capa gráfica |
| Completo | Teléfono actual | Lo que la partitura describe |
| **Pleno** (nuevo) | Computador o teléfono fuerte, con tarjeta gráfica | Lo mismo, más las mejoras: más cantidad, más detalle, 120 cuadros por segundo |

- El Director mide **todo el tiempo**, no solo los primeros 4 segundos. Si el equipo se calienta, baja un peldaño; si
  le sobra, sube. Con margen, para que no ande saltando.
- Cuando salgan equipos mejores o capacidades nuevas, se suma un peldaño o un ejecutor. **Las partituras ya guardadas
  mejoran solas.**

### 4.6 Dónde vive cada parte

El 24-11 Aquiles decidió, para las escenas por capas: «el motor de escena en La Mente y aquí solo los efectos». Para
que esta propuesta calce con esa decisión, separo dos cosas que se llaman «motor»:

| Parte | Dónde | Por qué |
|---|---|---|
| **El Director** (lo que hace correr una partitura en el navegador) | motion-kit | Es lo que viaja a la página: aquí se mide su peso y se prueba |
| **El contrato de la Partitura** | motion-kit; La Mente lo copia, como hoy | Igual que las recetas |
| **El Estudio** (armar partituras, «Sorpréndeme», guardar, permisos, el asistente) | La Mente | Es de La Mente: logins, datos, negocios |
| **Un reproductor para la app** (Kotlin) | `lamente-app`, más adelante | Lee el mismo JSON |

Esto necesita el visto bueno de Aquiles: es la lectura que propongo de su decisión, no algo que él haya dicho.

Un efecto práctico: hoy cada valor nuevo obliga al backend a copiar el contrato antes de que el Estudio lo pueda
mandar. Con la Partitura, un movimiento nuevo es un dato que el contrato ya acepta. **El contrato cambia mucho menos.**

### 4.7 Lo que ya existe no se bota

- Las piezas de hoy siguen funcionando. La Partitura entra al lado, en una entrada nueva (`motion-kit/director`), con
  su propio tope de peso. La entrada principal está a menos de 1 KB de su tope: nada de esto puede ir ahí.
- De a poco, las piezas se reescriben como partituras. Los 12 efectos de texto son el mejor primer candidato: son el
  mismo movimiento con distintos números.
- Lo que ya está resuelto se reusa tal cual: el resorte, las señales del dedo y del scroll, los niveles, el lienzo
  común, la semilla.

## 5. El plan

Cada fase termina con algo que se ve en la vitrina y con números medidos. Los tamaños van en «tandas»: una tanda es
lo que tomó «dedo y física» o esta segunda tanda de momentos. Son estimaciones.

| Fase | Qué se construye | Se da por buena si… | Tamaño |
|---|---|---|---|
| **0. Prueba** | Algo desechable: una sola partitura (la entrada de un encabezado) corriendo con animación nativa y línea de tiempo de scroll | Se ve igual que la de hoy, pesa menos de 4 KB y no pierde fluidez en un teléfono. Si no, se replantea antes de gastar más | Media tanda |
| **1. Núcleo** | El modelo, el contrato en JSON, el Director con los ejecutores 1, 2 y 4, las señales básicas (tiempo, vista, scroll, velocidad, puntero, estado), las reglas de la casa y un reloj falso para pruebas | Seis ejemplos en la vitrina. Una prueba genérica que revisa las reglas de la casa en cualquier partitura. Entrada nueva bajo 10 KB | 2 tandas |
| **2. Lenguaje y traspaso** | El texto en español y su traductor. Los 12 efectos de texto, las entradas del encabezado y cuatro momentos reescritos como partituras. «Sorpréndeme» que genera partituras | Lo reescrito se ve igual o mejor y pesa menos que hoy. Si pesa más, se detiene el traspaso | 2 tandas |
| **3. Capa gráfica** | Un lienzo por página. Constelación, bandada, gotas y lava dentro de él. El peldaño «pleno» con WebGPU | Tres capas a la vez en un teléfono sin perder fluidez. En un equipo con tarjeta gráfica, diez veces más partículas | 2 a 3 tandas |
| **4. Peldaños vivos** | La medición continua, subir y bajar con margen, 120 cuadros por segundo, las mejoras | Una misma partitura se ve distinta, y bien, en tres equipos. No hay saltos visibles al cambiar de peldaño | 1 tanda |
| **5. Estudio** (La Mente, por encargo) | Guardar partituras, editarlas con perillas (intensidad, ritmo, orden), el asistente que las escribe | Lo define La Mente | De La Mente |
| **6. Fronteras** | Transiciones entre páginas, señal de audio, «HTML en canvas» si sale, reproductor para la app | Una por una, según lo que salga | Abierto |

Orden de valor: las fases 0 a 2 ya entregan lo principal (componer y coordinar, y efectos nuevos como datos). La 3 y
la 4 son las que aprovechan equipos mejores.

### Qué pasa con lo pendiente

| Pendiente | Qué propongo |
|---|---|
| Escenas por capas (diorama, título con volumen, tarjeta holográfica) | Entra en las fases 1 y 3: son partituras con capas |
| Carta-libro, carrusel 3D, fuegos artificiales, ecualizador | Después de la fase 2, ya como partituras |
| Conectar en La Mente lo de esta tanda | Sigue igual: no depende de esto |

## 6. Riesgos

| Riesgo | Cómo se controla |
|---|---|
| Construir un motor que rinda menos que las piezas hechas a mano | La fase 0 mide antes de comprometerse. En la fase 2 la regla es «igual o mejor, y más liviano, o se detiene» |
| Que el lenguaje crezca hasta ser un lenguaje de programación | Queda cerrado por diseño: sin ciclos, sin funciones, sin direcciones. Lo que no se pueda decir se hace como pieza a mano, que sigue existiendo |
| Dos sistemas a la vez por mucho tiempo | El traspaso va por familias completas, con fecha. Lo que no vale la pena traspasar se queda como está |
| Diferencias entre navegadores | Cada ejecutor tiene respaldo. Las pruebas de hoy solo corren en Chromium: habría que sumar WebKit (el motor de Safari) y Firefox, que Playwright ya trae |
| Peso | Entrada aparte con su tope. Los ejecutores 3 y 5 se bajan solo si la partitura los usa |
| Partituras de usuarios que frenen la página | Topes en el contrato y en el motor. El peldaño baja solo si el equipo no da |
| Depender de capacidades que no salgan («HTML en canvas») | Nada del plan depende de ellas. Solo se deja el lugar |

Lo que un motor **no** resuelve: el gusto. Un buen movimiento hay que diseñarlo igual; el motor solo hace que
diseñarlo una vez sirva para siempre. Tampoco hace milagros en teléfonos viejos.

## 7. Lo que se le pidió a Aquiles (aprobó las cinco el 24-11-2026)

1. **¿Partimos con la fase 0?** Es media tanda y es desechable. Sirve para decidir con números.
2. **¿Dónde vive cada parte?** Propongo el reparto de 4.6: el Director y el contrato aquí; el Estudio en La Mente.
3. **Los nombres.** Partitura y Director son propuesta.
4. **¿El texto en español?** Yo lo haría: es lo que hace que un asistente pueda escribir movimiento.
5. **¿Esto reemplaza a «escenas por capas» como la tanda que sigue?** Yo lo haría: es lo mismo, mejor planteado.

Con el visto bueno escribo el plan detallado de la fase 0 (tareas, pruebas y criterios), como en las tandas
anteriores.

## 8. Resultados de la fase 0 (24-11-2026)

La prueba está en `prototipos/fase0/` (desechable; no es parte del paquete). Es un Director mínimo que hace correr una
partitura con la entrada de un encabezado: lo mismo que hoy hacen la entrada «cascada», el texto «revelar» y la salida
«desvanecer», que en `src/` son tres piezas de CSS distintas. Se mide con `node prototipos/fase0/medir.mjs`.

| Criterio | Meta | Resultado |
|---|---|---|
| Peso del Director | Menos de 4 KB | **1,59 KB** (gzip). La partitura de la portada, el dato, pesa 0,33 KB |
| Se ve igual que hoy | Igual | **0,00 px y 0,000 de opacidad de diferencia**, parte por parte, en 13 instantes de la entrada y 6 puntos del scroll, en computador y en teléfono simulado |
| No pierde fluidez | No pierde | **Ningún cuadro largo en ninguna de las dos**; el cuadro más lento (p95) es el mismo, 16,8 ms. Ver el detalle abajo |

Trabajo del hilo principal (teléfono simulado, procesador frenado 4 veces, mediana de 5 corridas alternadas):

| Tramo | Hoy | Partitura | Diferencia |
|---|---|---|---|
| Entrada (2,5 s, incluye volver a montar el encabezado) | 39,4 ms | 49,9 ms | 10,5 ms más |
| Salida al bajar (2,1 s) | 16,0 ms | 25,3 ms | 9,3 ms más |
| En reposo (1,5 s) | 4,7 ms | 3,9 ms | Igual; ninguna de las dos pide cuadros |

El Director trabaja un poco más (unos 10 ms repartidos en dos segundos, con el procesador frenado 4 veces), porque
arma las animaciones con código en vez de que estén escritas en la hoja de estilos. No alcanza a notarse en los
cuadros. Como referencia de peso: el CSS de hoy para las 7 entradas, las 6 salidas y los 11 efectos de texto suma
2,18 KB.

Lo que el Director hizo y el encabezado de hoy no hace, con la misma partitura y sin escribir nada más:

- detener la entrada fuera de la vista y seguirla al volver;
- detener un botón que está entrando cuando se le pone el cursor encima;
- soltar todas las animaciones al terminar (no queda ninguna viva);
- funcionar igual sin líneas de tiempo de scroll (respaldo probado quitándolas);
- con «reducir movimiento», no crear ninguna animación;
- sumar una escena que sigue al cursor con resorte (una línea en la partitura), con un bucle que duerme si el cursor
  está quieto.

**Lo más importante que salió de la prueba no estaba planeado.** Para comparar se detienen las dos versiones en el
mismo instante y se mide cada parte. Ese método mostró que el efecto de texto por defecto del encabezado, «revelar»,
**nunca movió las palabras** (tampoco «impacto» ni «trailer»): estaba así desde el primer commit y las cerca de 930
revisiones visuales no lo veían. Ya está arreglado en `src/` y con prueba. Es el mejor argumento para el motor: con
un reloj que se puede detener, las pruebas dejan de depender de esperas.

Lo que la prueba enseñó para la fase 1:

- **Cada señal necesita su canal.** El tiempo escribió en `transform` y el scroll en `translate`; así se suman sin
  pisarse. Si dos escenas quieren mover lo mismo por el mismo canal, gana la última. La fase 1 tiene que definir cómo
  se combinan.
- **El Director necesita su propio corte de texto** en palabras y letras. La prueba usó el del título de hoy. Estimo
  menos de 0,5 KB.
- **El orden relativo («luego», «junto») no se probó:** la partitura usó tiempos fijos, para calzar con lo de hoy.

Lo que la prueba **no** demuestra:

- Un teléfono real. Todo se midió en un teléfono simulado. Para verlo en uno: `npm run dev:red` y abrir
  `/prototipos/fase0/index.html`.
- Safari y Firefox. Solo se probó en Chromium.
- La capa gráfica, los peldaños, el lenguaje en texto y el ahorro de peso al traspasar muchas piezas. Son las fases
  1 a 4.

**Conclusión: la fase 0 cumple sus tres metas. Recomiendo seguir con la fase 1.**

## Fuentes

- [WebGPU ya está en los navegadores principales (web.dev)](https://web.dev/blog/webgpu-supported-major-browsers)
- [Novedades de la plataforma web, octubre de 2026 (web.dev)](https://web.dev/blog/web-platform-10-2026)
- [Guía de animaciones por scroll solo con CSS (WebKit)](https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/)
- [Animaciones disparadas por scroll (Chrome)](https://developer.chrome.com/blog/scroll-triggered-animations)
- [Las transiciones de vista dentro de una página ya están en todos (web.dev)](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)
- [Novedades de las transiciones de vista (Chrome)](https://developer.chrome.com/blog/view-transitions-in-2025)
- [Transiciones de vista por elemento (Chrome)](https://developer.chrome.com/docs/css-ui/view-transitions/element-scoped-view-transitions)
- [Transiciones de vista entre documentos (caniuse)](https://caniuse.com/cross-document-view-transitions)
- [HTML en canvas, prueba de origen (Chrome)](https://developer.chrome.com/blog/html-in-canvas-origin-trial)
- [GSAP pasa a ser gratis (Webflow)](https://webflow.com/blog/gsap-becomes-free)
- [GSAP frente a Motion (Motion; es la página de un competidor)](https://motion.dev/docs/gsap-vs-motion)
- [Reproductores de Rive](https://rive.app/runtimes)
