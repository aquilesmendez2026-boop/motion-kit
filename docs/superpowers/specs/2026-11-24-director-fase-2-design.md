# Director, fase 2 (enfocada): el lenguaje en español, el modelo versión 1 y la inclinación en 3D

Diseño. Aquiles aprobó este camino el 24-11-2026 («si a todo, ve con el 1»). Las decisiones de cómo se construye son
mías y van marcadas.

## Para qué

La meta de La Mente: páginas que sorprenden, armadas en minutos por el dueño. La fase 1 dejó el motor (el Director) y
su dato (la Partitura). Falta lo que permite **crear** partituras rápido y con confianza: escribirlas en español,
tener un modelo que ya no cambie (para que La Mente lo copie y la app lo reproduzca) y poder inclinar cosas en 3D.

## Qué cambió respecto del plan original

El plan decía: en la fase 2 se pasan al Director los 12 efectos de texto, las entradas del encabezado y cuatro
momentos, con la regla de Aquiles «se ve igual o mejor y **pesa menos**; si pesa más, se detiene». Medido el 24-11:

| Qué | Peso hoy (gzip) |
|---|---|
| Los 12 efectos de texto, con lo suyo (`TextoCinetico`) | 3,4 KB |
| Las entradas del encabezado | cerca de 1 KB |
| El Director completo | 9,1 KB |

Una página con solo el encabezado cambiaría unos 4 KB por 9. Por la regla, **no se reemplaza nada de lo que funciona**.
El Director se paga cuando una página combina muchos movimientos o necesita algo que hoy no existe.

## Qué se entrega

1. **Partitura versión 1**: el modelo con las mejoras que pidió la revisión de la fase 1, y la inclinación en 3D.
   Las partituras de la versión 0 se siguen aceptando y se guardan como versión 1.
2. **El lenguaje en español**: un texto corto que se traduce a la partitura (y de vuelta). Entrada nueva
   `motion-kit/partitura`, que solo usa quien crea (el Estudio, nosotros). No viaja a las páginas públicas.
3. **Partituras de la casa**: los movimientos de hoy escritos como partituras (los efectos de texto que el modelo
   alcanza a decir, las entradas del encabezado y cuatro momentos), más dos nuevas: **título con volumen** y
   **tarjeta holográfica**. Y un «Sorpréndeme» que arma una partitura con una semilla (sin modelos de IA).
4. **El Director probado en Safari**: las 10 diferencias del sondeo del 24-11, resueltas una por una.
5. Vitrina `#director` con un editor de texto (se escribe en español y se ve correr), contrato, documentos y el encargo
   para La Mente.

## Qué no entra

- Reemplazar piezas que ya existen (por la regla del peso).
- La señal `dato` (cupos, sellos, precios): es la tanda que sigue.
- La capa gráfica, los peldaños y las mejoras «con más máquina» (fases 3 y 4).
- Un asistente que escriba partituras: por decisión de Aquiles (24-11), por ahora sin modelos de IA.
- Cambios en La Mente: va un encargo.

Anti metas: que una partitura guardada hoy deje de valer; que el texto permita algo que el JSON no (el texto no es otro
lenguaje, es otra forma de escribir lo mismo); que la inclinación maree o deje algo ilegible; que la entrada del
Director pase de sus 10 KB.

## 1. Partitura versión 1

Todo lo de la versión 0 sigue valiendo. Cambia:

### 1.1 Lo que sigue al puntero o a la velocidad usa un `Cambio`, como lo demás

Antes: `{ actor, x?, y?, giro?, escala?, opacidad?, resorte? }`. Ahora: `{ actor, a: Cambio, resorte? }`. `a` es cuánto
cambia el actor con la señal al máximo. `x` y `y` siguen a la señal de lado y de arriba abajo; `giro` sigue a la de
lado; `escala` y `opacidad` miran qué tan lejos del centro está (como hoy).

### 1.2 Inclinación en 3D

`Cambio` suma dos campos, en grados:

| Campo | Qué hace | Con el puntero |
|---|---|---|
| `inclinaX` | Vuelca hacia adelante o atrás (gira sobre el eje horizontal) | Sigue a la señal de arriba abajo |
| `inclinaY` | Gira hacia un lado (sobre el eje vertical) | Sigue a la señal de lado |

- En una entrada por tiempo (`verse`): `de: { inclinaX: -70, opacidad: 0 }` es una hoja que se levanta.
- Siguiendo al puntero: `a: { inclinaX: 6, inclinaY: 8 }` es una tarjeta que mira hacia el cursor.
- **Profundidad:** la pone el Director, fija en 900 px. No es parte del dato (así dos partituras se ven con la misma
  profundidad y nadie guarda un valor que deforme). En `verse` va dentro del mismo movimiento. En las escenas
  continuas y de estado, el Director pone `perspective` en el padre del actor mientras la partitura está montada, y lo
  quita al desmontar; si el padre ya trae la suya, no la toca. *(Decisión mía.)*
- **Topes:** ±90° de partida en `verse` y en lo atado al scroll; estado final de una entrada, ±15° (lo que queda
  puesto se tiene que poder leer); siguiendo al puntero, ±25°; en `estado`, ±8°.
- En nivel `liviano`, las entradas siguen fundiendo solamente y nada sigue al puntero: no hay inclinación.

### 1.3 Los números van en el contrato

Para que la app (Kotlin) reproduzca lo mismo, `contrato/partitura-motionkit.json` trae:

- cada curva con sus cuatro números (`suave`: 0.2, 0.8, 0.2, 1; etc.) y el resorte sin estilo;
- cada resorte de seguimiento con su rigidez y su freno (`suave` 120 y 22; `firme` 220 y 30; `elastico` 180 y 11);
- la profundidad (900) y todos los topes;
- las fórmulas de los tramos de scroll, en palabras y con los mismos casos que prueban las unitarias (`avanceEn`).

### 1.4 El reparto entre piezas en lo atado al scroll, explícito

Hoy, con `por` en un paso de scroll, cada pieza ocupa la mitad del tramo y parten en cascada. Queda escrito en el
modelo: `reparto?: number` (de 0 a 1; por defecto 0,5) es qué parte del tramo ocupa cada pieza. Con 1, todas juntas.

### 1.5 De la versión 0 a la 1

`validarPartitura` acepta las dos. Una versión 0 se sube sola (`a` en lo que sigue; `reparto` queda en su valor por
defecto) y lo que devuelve es siempre versión 1. `subirPartitura(v0)` queda exportada. El contrato dice `version: 1`
y deja de decir «experimental»: desde aquí los cambios son sumando campos, no rompiendo.

## 2. El lenguaje en español

Entrada `motion-kit/partitura`:

- `leerPartitura(texto) → { ok: true, partitura } | { ok: false, errores: { linea, mensaje }[] }`
- `escribirPartitura(partitura) → texto`

Es **otra forma de escribir el mismo dato**. Lo que sale de `leerPartitura` pasa por `validarPartitura`; lo que no se
puede decir en JSON no se puede decir en texto. No tiene ciclos, funciones, direcciones web ni nada que se ejecute.

```
partitura portada

al verse:
  antetitulo  desde abajo 28px, aparece, 800ms, en 50ms
  titulo      desde abajo 135%, por palabra, con máscara, 800ms, cada 90ms, en 150ms
  bajada      desde abajo 28px, aparece, 800ms, en 550ms
  botones     desde abajo 28px, aparece, por hijo, 700ms, cada 90ms, en 850ms

al salir de la vista:
  contenido   sube 14%, se apaga

con el puntero:
  tarjeta     se inclina 6 grados, resorte firme

al apuntar boton:
  boton       sube 3px, crece a 1.05
```

### 2.1 Forma

- Una línea por cosa. Lo que va después de `#` es un comentario. Las líneas en blanco no cuentan.
- `partitura <nombre>` (opcional), y después escenas. Cada escena parte con una línea que termina en `:`; sus pasos
  van debajo, con sangría.
- Un paso es: el **actor** (el nombre de la parte) y después **frases separadas por comas**.
- Con o sin tildes (`máscara` o `mascara`), mayúsculas o minúsculas.

### 2.2 Las escenas

| Se escribe | Es |
|---|---|
| `al verse:` | `verse` |
| `cada vez que se ve:` | `verse` con `repetir` |
| `al entrar a la vista:` · `al salir de la vista:` · `al cruzar la pantalla:` | `vista` con tramo `entrada`, `salida` o `paso` |
| `con el scroll:` | `scroll` |
| `con el puntero:` · `con la velocidad:` | `puntero`, `velocidad` |
| `al apuntar <actor>:` · `al enfocar <actor>:` · `al apretar <actor>:` | `estado` (el actor es `sobre`; sin él, el de cada paso) |

### 2.3 Las frases de un paso

De dónde parte (`de`):

| Frase | Es |
|---|---|
| `desde abajo 28px` · `desde arriba` · `desde la izquierda` · `desde la derecha` | `de.y` o `de.x` (px o %) |
| `aparece` | `de.opacidad: 0` |
| `crece desde 0.8` | `de.escala` |
| `gira desde -8 grados` | `de.giro` |
| `se levanta desde 70 grados` · `se abre desde 70 grados` | `de.inclinaX` · `de.inclinaY` |

A dónde llega (`a`), o cuánto cambia con la señal:

| Frase | Es |
|---|---|
| `sube 14%` · `baja 20px` · `va a la izquierda 30px` · `va a la derecha 30px` | `a.y` o `a.x` |
| `se apaga` · `se apaga a 0.6` | `a.opacidad` |
| `crece a 1.05` · `se achica a 0.95` | `a.escala` |
| `gira 6 grados` | `a.giro` |
| `se inclina 6 grados` (los dos ejes) · `se vuelca 6 grados` · `se ladea 8 grados` | `a.inclinaX` y `a.inclinaY` |

Cómo y cuándo:

| Frase | Es |
|---|---|
| `por letra` · `por palabra` · `por hijo` | `por` |
| `con máscara` | `mascara` |
| `800ms` · `1.2s` | `dura` |
| `cada 90ms` | `cada` |
| `en 150ms` · `luego` · `luego 100ms` · `junto` · `junto 80ms` | `en`, `luego`, `junto` |
| `curva suave` (o `lineal`, `entra`, `sale`, `vaivén`, `resorte`) | `curva` |
| `resorte suave` (o `firme`, `elástico`) | `resorte` (en lo que sigue) |
| `entre 60% y 100%` | `entre` |
| `reparto 30%` | `reparto` |

Una frase que no existe, un número fuera de tope o una frase que no va en esa escena: error con el número de línea y
qué se esperaba, en español. Primero se lee todo y se juntan los errores (no se detiene en el primero).

### 2.4 De vuelta

`escribirPartitura` deja el texto en su forma canónica (las frases siempre en el mismo orden). Regla que se prueba:
leer lo que se escribió da la misma partitura, para todos los ejemplos y para partituras armadas con semilla.

### 2.5 Peso

La entrada `motion-kit/partitura` es de quien crea: no cuenta para las páginas públicas. Tope propuesto: **8 KB**
gzip. *(Es un tope nuevo: lo fija Aquiles.)*

## 3. Partituras de la casa

En `src/director/casa/`, exportadas desde `motion-kit/partitura` (no desde `motion-kit/director`: son datos para
elegir y combinar al crear).

- **Efectos de texto.** De los 12 de `TextoCinetico`, los que el modelo alcanza a decir (mover, escalar, girar, fundir,
  inclinar, por letra o palabra, con máscara). Los que necesitan otra cosa (cambiar las letras como «descifrar»,
  desenfoque, color) **no se fuerzan**: quedan anotados con qué les falta.
- **Entradas del encabezado:** cascada, deslizar, zoom y las que se puedan decir, con los nombres de parte del
  encabezado.
- **Cuatro momentos:** los que son una entrada en cadena (se eligen al construir).
- **Título con volumen:** las letras se inclinan con el puntero; el volumen lo da un estilo de la vitrina (copias del
  texto apiladas). **Tarjeta holográfica:** la tarjeta se inclina y un brillo se corre al revés del cursor.
- **`sorprender(semilla, partes)`:** arma una partitura valida eligiendo entre las de la casa y variando tiempos y
  distancias dentro de márgenes. La misma semilla da siempre la misma.

«Igual o mejor»: para tres de los efectos de texto se compara contra `TextoCinetico` como en la fase 0 (la posición de
cada letra en varios instantes, con el reloj manual).

## 4. Safari

Las pruebas del Director corren también con WebKit (`node scripts/en-safari.mjs director`). Cada una de las 10
diferencias del 24-11 termina en uno de tres: error del Director, arreglado con su prueba; revisión que no aplica sin
líneas de tiempo de scroll, saltada con su razón escrita; o supuesto de la prueba, corregido. Al final,
`verificar-director` pasa entero en los dos motores.

## Reglas que no cambian

Las de la casa siguen en el Director (movimiento reducido, fuera de la vista se detiene, lo que se aprieta no queda
escondido ni se mueve bajo el cursor, nada queda vivo). Solo `transform`, `translate`, `rotate`, `scale` y `opacity`.
Nada de `Math.random`. La entrada `motion-kit/director` no pasa de 10 KB al cargar (hoy 9,1): si la inclinación no
cabe, se baja aparte con lo que sigue al puntero.

## Caminos que miré

1. **Fase 2 enfocada (elegido por Aquiles).** No reemplaza nada; entrega el lenguaje, el modelo estable y el 3D.
2. **Traspasar las piezas como decía el plan.** La medición dice que pesa más; por la regla de Aquiles se detendría.
3. **Solo el lenguaje, sin tocar el modelo.** Dejaría el modelo en versión 0 «experimental» y el texto habría que
   rehacerlo cuando cambie. Mejor cerrar el modelo primero.

## Decisiones mías que Aquiles puede cambiar

- La profundidad fija (900 px) y sus topes.
- Los nombres `inclinaX` e `inclinaY`, y las frases «se vuelca», «se ladea», «se inclina».
- El nombre de la entrada (`motion-kit/partitura`) y su tope (8 KB).
- Que los efectos que el modelo no alcanza a decir no se fuercen.
- Que «Sorpréndeme» sea por semilla (sin IA).

## Lo que queda para quien construye

Los números finos, los mensajes de error, qué cuatro momentos, y la forma interna del traductor.

## Precisiones tras la revisión del diseño (24-11-2026)

Un revisor leyó el diseño como quien lo construye. Lo que quedó fijado (decisiones mías, salvo las dos marcadas):

### Modelo e inclinación

1. **En qué canal va la inclinación.**
   - En `verse` va en `transform`, al principio de la lista: `perspective(900px) rotateX(…) rotateY(…)` y después lo
     de siempre. `de` y `a` llevan siempre la misma lista (lo que falta va en cero): así el navegador interpola cada
     función y no una matriz.
   - En lo continuo (`vista`, `scroll`, `puntero`, `velocidad`, `estado`) va en la propiedad `rotate`, como un giro
     sobre un eje: eje `(inclinaX, inclinaY, 0)` y ángulo igual al largo de ese vector. Con un solo eje es exacto; con
     los dos, hasta 25° la diferencia con dos giros seguidos no se ve. En los fotogramas de scroll, `de` y `a` usan el
     mismo eje (el que no gira va con ángulo 0).
   - **En lo continuo, un paso gira (`giro`) o se inclina, no las dos cosas:** `rotate` lleva un solo giro. La
     partitura que las mezcla no vale; para sumar, un actor dentro de otro (la regla que ya existe).
2. **La profundidad en lo continuo** va en el padre de lo que se inclina: el padre del actor o, si el texto está
   cortado, el `span` que el propio Director creó para las piezas. El Director lleva la cuenta de quién la puso (un
   contador por elemento): la quita cuando se desmonta la última partitura que la usaba, y deja el valor que había.
   Si el padre ya trae `perspective` propia, no la toca. Que el padre sea la raíz no cambia nada: la profundidad solo
   afecta a los hijos que se inclinan. Dos actores hermanos comparten punto de fuga: se ven como una sola escena.
3. **Lo que se aprieta.** Siguiendo al puntero ya rige la regla de la fase 1: mientras se apunta a algo que se aprieta
   dentro del actor, el actor se queda donde está. En `estado` la inclinación tiene tope de **±4°** (no ±8°): lo que
   se aprieta no puede escaparse del cursor al inclinarse.
4. **Lo que sigue (`a: Cambio`)** se valida con los topes de seguir (200 px, 45° de giro, 25° de inclinación, escala de
   0,5 a 2). `x` e `y` van en px (un porcentaje ahí no vale, como en la versión 0). `escala` y `opacidad` siguen mirando
   qué tan lejos del centro está la señal.
5. **`reparto`** va de 0,05 a 1. Con una sola pieza no hace nada.
6. **La versión 0** no tiene nada sin traducción: sus campos sueltos pasan a `a`. Nadie fuera de este repo guardó
   partituras de la versión 0 (La Mente no copió ese contrato), así que si la subida no cabe en la entrada del
   Director, vive solo en `motion-kit/partitura` y el Director corre versión 1. Si cabe, el Director acepta las dos.
7. **El contrato** pasa a `version: 1` y deja de decir «experimental» **al cerrar esta fase**. *(De Aquiles: si
   prefiere una prueba real en La Mente antes de darlo por estable, se deja la marca.)*
8. **Peso del Director:** si con la inclinación pasa de 10 KB, lo primero que se baja aparte es la subida de la
   versión 0 y después la inclinación de `verse` (junto al corte de texto). El tope no se sube.
9. **Nombre de las animaciones.** El Director le pone a cada animación que crea un nombre (`id`): `mk-verse`,
   `mk-estado`, `mk-vista`, `mk-scroll`. Sirve para depurar y para que las pruebas distingan lo atado al scroll cuando
   corre con el respaldo manual (la causa de 9 de las 10 diferencias en Safari).

### Lenguaje

10. **Signos.** `sube N` es `a.y = -N`; `baja N`, `+N`. `desde abajo N` es `de.y = +N`; `desde arriba N`, `-N`.
    Izquierda es negativo en `x`; derecha, positivo. Al escribir, el signo va en el verbo (`sube 14px`, nunca
    `baja -14px`). `giro` e inclinación sí llevan signo en el número (`gira -6 grados`).
11. **Decimales con punto.** Una coma entre dígitos (`1,05`) se avisa con su propio mensaje: «usa punto para los
    decimales».
12. **«resorte».** `curva resorte` es la curva (solo en `verse` y `estado`). `resorte suave|firme|elástico` es el
    resorte de lo que sigue (solo en `puntero` y `velocidad`). La palabra sola no vale.
13. **Qué frase vale en qué escena** sale del modelo: `por`, `con máscara`, `cada`, `en`, `luego` y `junto` solo en
    `verse` (`por` también en `vista` y `scroll`); `entre` y `reparto` solo en `vista` y `scroll`; `dura` y `curva` en
    `verse` y `estado` (`curva`, sin `resorte`, también en `vista` y `scroll`); `resorte …` solo en lo que sigue. Una
    frase fuera de lugar es error con la línea. Una frase repetida en el mismo paso también.
14. **Formas que faltaban:** `con la vista:` (escena `vista` sin tramo) y `al apuntar:`, `al enfocar:`, `al apretar:`
    sin actor (escena `estado` sin `sobre`).
15. **Los nombres de actor no chocan con el lenguaje:** el actor es siempre la primera palabra de la línea de un paso
    (o lo que va entre el verbo y los dos puntos de una escena de estado).
16. **Ida y vuelta.** Se compara la partitura, no el texto: los comentarios se pierden. `se inclina N grados` se
    escribe solo si los dos ejes valen lo mismo; si no, `se vuelca` y `se ladea`. Un cero se escribe (`sube 0px`): el
    dato es el mismo. Los números van con tres decimales a lo más.

### Partituras de la casa y pruebas

17. **Qué efectos de texto entran** (mirado en `TextoCinetico`): iguales, `revelar`, `voltear` y `trailer` (estos tres
    se comparan contra el original, letra por letra, con el reloj manual); parecidos, con `curva resorte` en vez de
    sus rebotes a mano, `impacto`, `rebote`, `caer` y `maquina` (sin su cursor). No entran `encender` (parpadeo de
    varios pasos), `temblor` y `onda` (ciclos sin fin), `glitch` (copias de color) ni `descifrar` (cambia las letras).
    *(De Aquiles: que un efecto que el modelo no alcanza a decir no cuenta como falla.)*
18. **Título con volumen:** se entrega la partitura. El estilo de las copias apiladas vive en la vitrina y queda
    descrito en el catálogo; no es parte del paquete.
19. **Tarjeta holográfica:** una escena `puntero` con dos pasos: la tarjeta se inclina y el brillo (otro actor) se
    corre con `x` e `y` negativos.
20. **`sorprender`** usa el generador con semilla que ya existe (`src/efectos/semilla.ts`) y redondea lo que varía.
21. **Safari, criterio de hecho:** `verificar-director` pasa entero con Chromium y con WebKit; lo que no aplica sin
    líneas de tiempo de scroll se salta con su razón escrita en la salida. Las revisiones de la inclinación corren en
    los dos.

### Lo que cambió la revisión final (24-11-2026)

22. **La profundidad en el padre tiene un costo** (corrige la precisión 2, que decía que no cambiaba nada): mientras
    está puesta, ese padre ordena y ubica a sus hijos como uno con `transform` (un hijo `position: fixed` se ubica
    respecto de él; los `z-index` de sus hijos no salen de él). Se deja así y se documenta como límite conocido: la
    otra forma (la perspectiva dentro del `transform` del propio actor) rompe la regla de que una entrada (`verse`) se
    suma a cualquier escena continua, porque las dos escribirían en `transform`. *(De Aquiles, si este límite molesta
    en La Mente: cambiar de forma es un trabajo aparte.)*
23. **La profundidad no se le borra a la página:** al soltarla se quita solo si sigue siendo la que puso el Director.
24. **Texto cortado por palabra:** cada palabra va en una caja propia, con o sin máscara. Sin ella el padre de la
    pieza es un elemento en línea y la profundidad no se ve (medido en Chromium y en WebKit; ponerla en el actor
    tampoco sirve, porque no pasa de un elemento intermedio).
25. **`estado` inclina también en `liviano`** (corrige la sección 1.2): un estado va igual en todos los niveles menos
    `quieto`, y su inclinación tiene tope de 4°.
26. **El lenguaje:** una escena se entiende sin los dos puntos; el nombre de un actor se pasa a minúsculas pero no
    pierde tildes ni «ñ» (con ellas no vale, y se dice); `#` no es comentario en la línea del nombre; toda frase que
    mueve lleva su número; U+2028 y U+2029 cortan la línea; los porcentajes se leen redondeados a seis decimales.
27. **Ida y vuelta, precisado:** lo que da igual vuelve en su forma canónica (`repetir: false` y `mascara: false` no
    se escriben; `"12.50%"` vuelve `"12.5%"`; el nombre, sin espacios de más; tres decimales).
28. **`escribirPartitura` exige una partitura que vale** y lanza si no (dice por qué). `leerPartitura` sigue sin lanzar.
29. **`subirPartitura`:** un paso que ya trae `a` no se toca; ningún campo desaparece. Una «versión 0» que usa campos
    de la 1 se sube igual: subir no valida, y el resultado es una versión 1 que vale.
30. **El contrato** suma `inclinacion`, `porDefecto`, `seguir` y casos calculados por el mismo código.
31. **Peso de `motion-kit/partitura`:** con estos arreglos quedó en 8.133 bytes, sobre los 8.000 propuestos. Aquiles
    fijó el tope en **9 KB** («tope en 9», 24-11-2026).
32. **El contrato versión 1 queda sin la marca de experimental** (Aquiles, «si a todo», 24-11-2026): desde aquí los
    cambios suman campos, no rompen.
