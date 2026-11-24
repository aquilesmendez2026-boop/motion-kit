# Foto profunda: profundidad real en la foto del encabezado

Fecha: 24-11-2026. Aprobado por Aquiles: «partamos con la profundidad en fotos» y «si a todo, usa las tres fotos de la
prueba» (solo el encabezado; la vitrina puede bajar el modelo; las tres fotos de la prueba quedan en el repo).

## Para qué

Que la foto del encabezado se sienta con fondo de verdad: al mover el cursor, bajar la página o inclinar el teléfono,
lo que está cerca se mueve distinto de lo que está lejos. Sin recortar la foto ni pedirle nada al dueño.

## Cómo funciona

Cada foto lleva al lado un **mapa de profundidad**: una imagen chica en grises, donde más claro es más cerca. Lo
calcula un modelo abierto (Depth Anything V2 Small, Apache-2.0) una sola vez, cuando el dueño sube la foto. La página
pública solo baja la foto y su mapa, y un efecto en la tarjeta gráfica corre cada punto de la foto según su profundidad.

Medido en la prueba del 24-11 (tres fotos, en un navegador sin ventana, sin tarjeta gráfica): 4,2 a 4,6 segundos por
foto; el mapa de 256 px de ancho pesa 1,7 a 2,5 KB en WebP (3,5 a 4,8 en JPG). Quien edita baja 3 MB del motor que
corre el modelo, más el modelo (decenas de MB; no quedó medido).

## Caminos considerados

| Camino | Decisión |
|---|---|
| **Deformar la foto con el mapa, en la tarjeta gráfica** | Elegido. No hay bordes recortados ni huecos, y si algo falla queda la foto normal |
| Cortar la foto en tres o cuatro capas y moverlas | Descartado: deja huecos en los bordes y multiplica las imágenes |
| Sumarlo al motor de las fotos vivas (partículas, ondas, líquido) | Descartado por ahora: ese motor ya es grande. Va un motor chico aparte; no se combinan todavía |

## Qué se construye (motion-kit)

- **Receta del encabezado (v2, sin versión nueva): campo `fotoProfunda`** (verdadero o falso). Solo en las
  composiciones con foto. Si la receta trae también `fotoViva` o `tomas`, la foto profunda queda apagada, con aviso.
- **`Encabezado` suma dos props:** `fotoProfunda` y `mapasFotos` (la dirección del mapa de cada foto, en el mismo orden
  que `imagenes`; se usa el de la primera). Los mapas no van en la receta: los pasa quien arma la página, como
  `origenesFotos`. Sin mapa para la foto, no pasa nada.
- **El efecto** (`src/fotos/`, se baja aparte): un lienzo WebGL encima de la foto, que sigue ahí debajo.
  - Se mueve con el cursor, con el paso del encabezado por la pantalla (scroll) y con la inclinación del teléfono
    cuando el navegador la entrega (en iPhone, solo si el encabezado ya pidió ese permiso con `mover`).
  - Entre lo más cercano y lo más lejano hay hasta un 3,5 % del ancho de diferencia (cada punto se corre a lo más un
    1,75 %), con la foto un 6 % acercada para que no asomen los bordes. La foto de abajo va acercada igual.
  - Solo en nivel completo. Con movimiento reducido o en liviano, queda la foto normal.
  - Dibuja solo mientras algo cambia; fuera de la vista o con la pestaña oculta, se detiene. Al salir no queda nada.
  - Si no hay WebGL, si la foto o el mapa no cargan, si el servidor no da permiso (CORS) o si se pierde el contexto:
    queda la foto normal, sin errores. Vale el mismo `origenesFotos` de las fotos vivas.
- **El formato del mapa:** una imagen en grises (JPG, PNG o WebP), de cualquier tamaño (se recomienda 256 px de ancho),
  con la misma proporción que la foto; más claro es más cerca.
- **Vitrina `#profundidad`:** las tres fotos de la prueba con su mapa, y una herramienta para soltar una foto: calcula
  el mapa ahí mismo y muestra cuánto demoró y cuánto pesa. El modelo se baja de internet **solo en la vitrina**; no es
  parte del paquete.

## Qué queda para La Mente (encargo)

Calcular el mapa en el Estudio al subir una foto y guardarlo al lado; el mismo permiso CORS de las fotos vivas; pasar
`mapasFotos` al encabezado; ofrecer `fotoProfunda` en el editor.

## No entra ahora

La galería y las fotos de productos; combinar con la foto viva o con varias tomas; un control de cuánta profundidad.

## Anti metas

Que la página pública baje un modelo. Que una foto sin mapa o sin permiso se vea mal. Que el efecto maree: es chico y
suave.

## Pruebas

Unitarias: el encuadre de la foto (igual que `object-fit: cover`), el objetivo según cursor, scroll e inclinación, y el
campo de la receta con sus avisos. En navegador (`scripts/verificar-fotos.mjs`, parte `profunda`): el lienzo aparece y
dibuja; mover el cursor cambia lo dibujado; quieto no dibuja; fuera de la vista se detiene; con movimiento reducido,
sin WebGL, sin mapa, con un mapa que no carga o con el contexto perdido queda la foto normal y sin errores; al salir no
quedan lienzos ni oyentes.

## Decisiones mías que Aquiles puede cambiar

El nombre del campo (`fotoProfunda`) y de la prop (`mapasFotos`); que no se combine todavía con la foto viva ni con las
tomas; el tamaño del movimiento (3,5 % del ancho entre cerca y lejos).

## Precisiones de la revisión final (24-11-2026)

1. **El calce con la foto de abajo.** Mientras el efecto esté pedido y tenga su mapa (en cualquier nivel), la `<img>`
   va acercada el mismo 6 % que dibuja el lienzo. Así no hay salto cuando el lienzo aparece ni cuando se va (contexto
   perdido, o el nivel baja a liviano a media visita). Cuesta un 3 % de foto por lado.
2. **Fotos enormes.** La foto se rasteriza en un lienzo 2D con el lado mayor de 1600 px (y el tope de la tarjeta
   gráfica) antes de subirla. El mapa se suaviza según el ancho del lienzo: un doceavo, entre 64 y 160 puntos, y se
   vuelve a suavizar si el lienzo cambia de ancho.
3. **Nitidez.** El sombreador pide precisión alta cuando el aparato la tiene.
4. **Caché y CORS.** Si la foto de otro sitio no carga con permiso, se pide de nuevo saltándose la caché (igual que
   las fotos vivas; el código es común, `src/fotos/imagen.ts`).
5. **Inclinación.** Va de a un grado, con 0,75° de holgura; menos de medio grado no cuenta. Con el teléfono casi
   vertical (más de 75°) no se usa la lectura de lado a lado. Con el teléfono acostado no se usa ninguna, y al girarlo
   parte de cero. Fuera de la vista no se mide.
6. **Llegada.** El efecto se da por llegado a 0,02 de la carrera (menos de un cuarto de px en un teléfono) y avanza
   según el tiempo, no según los cuadros.
7. **Entrada `zoom`.** El lienzo se muestra cuando la `<img>` termina su animación de entrada.
8. **Mapa ajeno.** Si la proporción del mapa difiere de la de la foto en más de un 4 %, no se usa.
9. **Receta.** `fotoProfunda` sin ninguna foto en `imagenes` queda apagada, con aviso.
10. **Composición.** En una composición sin foto a la vista (por props directas), la pieza no se baja.
