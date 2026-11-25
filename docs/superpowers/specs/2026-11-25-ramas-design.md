# Ramas: el Hilo de fondo que se divide y choca con los bordes

Fecha: 25-11-2026. Aprobado por Aquiles («ok»). Diseño corto.

## Para qué

Aquiles: «tenemos un efecto de fondo que se llama hilo y es solo una línea que ondula hacia abajo. Puede ser que esa
línea que baja de fondo se divida y algunas choquen con los bordes, pero siempre una baje». Eligió que cada rama que
choca **se apague con una chispa**, y que sea **un relato nuevo** (el Hilo queda igual: cambiarlo cambiaría las
páginas que ya lo eligieron).

## Qué es

Relato de página `ramas`, hermano del Hilo (`relatoPagina: "hilo"`):

- **Detrás de los bloques**, como el Hilo (`z-index: -1`): no se mide el contenido; se ve entre bloques y en páginas
  con espacio entre ellos.
- **El tronco** baja ondulando de arriba al fondo de la página. Su forma sale de la `semilla` (el slug del negocio):
  dos negocios no se ven iguales. Siempre llega abajo. Lleva el punto de luz que viaja, como el Hilo.
- **Las ramas**: más o menos una por cada alto de pantalla se separa del tronco, alternando el lado; entre 3 y 7 según
  el largo de la página. Cada una se curva hacia afuera, más delgada que el tronco, y se dibuja mientras el tronco pasa
  por donde nace. Simples: una curva, sin ramitas propias (se lee claro en un teléfono).
- **El choque**: la rama termina justo en el borde de la página; ahí aparece una chispa (unos rayitos que se abren y se
  apagan), solo con `scale` y `opacity`.

## Enfoques

1. **Líneas SVG calculadas al medir, dibujadas por el navegador con el scroll** (como el Hilo y los hilos):
   `stroke-dashoffset` con `animation-timeline: scroll(nearest)`. Después de medir no corre código. **Elegido.**
2. Un canvas animado cuadro a cuadro: pesa más y corre código todo el rato al bajar. Descartado.

## Reglas

- Sin dependencias; sin `Math.random` (la semilla decide).
- Animar solo `transform`/`scale`/`opacity`; el trazo usa la excepción de los hilos (`stroke-dashoffset`,
  `offset-distance` para la luz).
- Niveles, igual que el Hilo: completo con animaciones atadas al scroll, todo; liviano, el tronco y las ramas enteros
  y quietos, sin luz ni chispas; sin scroll nativo o con «reducir movimiento» (quieto), no se dibuja. (Corregido al
  escribir el plan: el diseño decía «liviano, no se dibuja», pero el Hilo en liviano va entero y quieto.)
- Se vuelve a calcular cuando la página cambia de tamaño (lo que ya mide `PaginaRelato` para el Hilo: ancho y alto).
- Color: el acento (`--mk-acento`, o `--lm-acento` en una página de La Mente).
- Peso: un archivo aparte chico, que baja solo si la página eligió `ramas`; `motion-kit/pagina` sigue bajo su tope
  (17 KB).
- Contrato de página: suma `ramas` a `relatoPagina` (solo agrega).

## Pruebas

- Calculables: el tronco va de arriba al fondo sin salirse de la página; cada rama nace en el tronco y termina justo en
  un borde (izquierdo o derecho), alternando el lado; entre 3 y 7 ramas según el alto; cada rama empieza a dibujarse
  cuando el tronco pasa por donde nace; la misma semilla da lo mismo y otra semilla, otra cosa; medidas raras no la
  botan.
- Visuales (`scripts/verificar-hilos.mjs`, parte `ramas`, en la vitrina `#hilos`): al bajar se dibujan el tronco y las
  ramas en orden; la chispa aparece cuando su rama llega al borde; en quieto y sin scroll nativo no hay nada; capturas
  en un teléfono para ver que se nota.

## Queda al que construye

La forma exacta de la onda del tronco y de la curva de las ramas, el tamaño de la chispa y el nombre de la ficha en el
catálogo.

## Cambio del 25-11-2026 (después de mirar las capturas)

Detrás de los bloques, las ramas casi no se veían: las franjas con fondo las tapan. Aquiles: «por detrás y que algunas
choquen con los elementos y otras se junten al final, unas más delgadas que otras para tener un efecto de profundidad,
y pueden ser en distintas tonalidades». Aprobado («ok, sigue en la rama ramas»). Reemplaza lo de arriba donde choque:

- **Sigue detrás de los bloques.** Solo se ve donde un bloque no tiene fondo o hay espacio entre bloques; en una página
  de La Mente (franjas pegadas, todas con fondo) se verá poco. Se le dijo a Aquiles.
- **Dos clases de rama.** Las que **chocan** salen del tronco hacia un lado y terminan donde tocan el borde de un bloque
  con fondo (se miden solo las cajas de los bloques, no lo de adentro), con su chispa ahí; si no tocan ninguno, en el
  borde de la página. Las que **se juntan** se abren del tronco, bajan por su cuenta y vuelven a unirse con él al fondo
  de la página, justo cuando el tronco termina.
- **Nacen donde se ven:** si el punto del tronco donde tocaba nacer queda tapado por un bloque, se busca uno cercano
  (hasta media pantalla) que quede libre.
- **Profundidad:** cada rama con su grosor (de 1 a 3,5 px). Las delgadas, más tenues (lejos); las gruesas, más marcadas.
- **Tonos:** variaciones del acento, más claras o más oscuras (`color-mix` con blanco o negro), nunca otro color.
- **Cuántas:** de 4 a 9 según el largo de la página, más o menos mitad y mitad.
- **Vitrina:** una opción con espacio entre los bloques, para verlo bien.

## Segundo cambio del 25-11-2026: sobre el fondo, bajo el contenido

En el teléfono, con franjas sólidas, las ramas detrás de los bloques se perdían. Aquiles eligió «Sobre el fondo, bajo el
contenido»: van delante del fondo de los bloques, cortadas con una máscara donde hay contenido (textos, fotos, tarjetas,
botones y enlaces, con 4 px de margen; y las franjas con foto de fondo, enteras). Las que chocan lo hacen con ese
contenido, a 12 px (la chispa, de radio 8, no lo pisa). Se quita el punto de luz que viajaba por el tronco: un elemento
aparte no se puede cortar con la máscara y pasaría sobre el texto.

## Después de la revisión (25-11-2026)

La revisión en Opus encontró 8 problemas; todos arreglados con su prueba: la vista previa (enteras y quietas), volver a
medir con los mismos avisos que los hilos, lo que se mueve al bajar (una tira: hueco entero), ramas que chocaban tapadas
o recién nacidas (ahora se juntan), chispas que no alcanzaban a verse al final (las ramas que chocan terminan a más
tardar en el 97 %), el vaivén de la barra del navegador, contenido sin hueco (modo fino de `medirPagina`: enlaces, ítems,
íconos `aria-hidden`, chips) y que los hilos no cambien (el modo fino es solo para las ramas). También: en el encabezado
la máscara cortaba toda la caja de cada parte marcada; ahora corta sus renglones (lo vio Aquiles en `#pagina`).

También (lo vio Aquiles en `#pagina`): el tronco avanzaba con el scroll de toda la página y su punta iba siempre cerca
del borde de arriba de la pantalla, así que el encabezado se dibujaba cuando ya casi no se veía. Ahora va en tramos y
cada punto se dibuja cuando pasa por el 60 % de la pantalla, como los hilos (`scrollDe`); lo que se ve al cargar ya va
dibujado.
