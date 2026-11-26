# Esfera: una esfera de puntos que se abre y dibuja los contornos de la página

Fecha: 25-11-2026. Aprobado por Aquiles («ok, a la derecha, parte en la rama esfera»). Diseño corto. Rama `esfera`.

## Para qué

Aquiles: «figuras con muchos puntos: una esfera que flota y, cuando bajamos, la esfera se mueve y envuelve los elementos
de la página». Eligió «se abre y dibuja sus contornos»: la esfera flota y gira; al llegar a un bloque, sus puntos se
sueltan y forman el contorno punteado de lo que se ve (tarjetas, fotos, botones); entre bloques se vuelven a juntar.
Flota a la derecha. Quiere poder elegir el lugar más adelante, cuando cree páginas con los agentes de La Mente.

## Enfoques

1. **Lienzo 2D** (el motor de los fondos, `src/efectos/lienzo.ts`), pegado a la pantalla dentro de la página (como el
   cielo del relato «luz»: `position: sticky`), con código que corre solo mientras se baja o la esfera gira a la vista.
   **Elegido.**
2. SVG con cientos de puntos movidos desde código: más pesado para el navegador. Descartado.
3. WebGL: más de lo que piden unos 150 puntos. Descartado.

## Qué es

- Relato de página `esfera` (`relatoPagina: "esfera"`), que se elige como las ramas.
- **La esfera:** unos 150 puntos repartidos parejo (espiral de Fibonacci) en una bola que gira lento; los de atrás más
  chicos y tenues (volumen). Color: el acento. Flota a la derecha de la pantalla, centrada en el alto.
- **El lugar** es un parámetro (`derecha` por defecto; `izquierda` y `centro` listos por dentro). Cuando los agentes lo
  necesiten, se suma un campo a la receta de página (solo agrega). No va en el contrato todavía.
- **Al bajar:** cuando un bloque con tarjetas, fotos o botones llega al centro de la pantalla, los puntos vuelan desde
  la esfera al contorno punteado de esos elementos, a 6 px por fuera; al seguir bajando vuelven a la esfera. Atado al
  scroll (subir lo deshace igual), con un poco de suavidad para que no tiemble.
- **Nunca tapa el contenido:** el contenido se mide con la medición fina de las ramas (`medirPagina(…, { fino: true })`)
  y el dibujo se corta ahí (la esfera pasa por detrás de textos, fotos y botones).
- **Niveles:** completo, todo; liviano, la esfera quieta, sin vuelo ni giro; quieto («reducir movimiento»), sin esfera.
  Sin scroll nativo funciona igual (lee el scroll con código).
- **Peso:** un archivo aparte (unos 4 KB más la medición compartida) que baja solo si la página eligió la esfera.
  `motion-kit/pagina` bajo su tope (17).
- **Contrato de página:** suma `esfera` a `relatoPagina` (solo agrega).

## Pruebas

- Calculables (`pruebas/esfera.test.ts`): la bola (cantidad, en la superficie, repartida), su proyección (los de atrás
  más chicos), los puntos de contorno (sobre el borde agrandado de cada caja, nunca dentro del contenido, repartidos
  por el largo), el reparto de los puntos entre la esfera y los contornos según cuánto se ve cada bloque, y que la
  misma semilla dé lo mismo.
- Visuales (`scripts/verificar-hilos.mjs`, parte `esfera`, vitrina `#hilos`): se ve la esfera a la derecha; con las
  tarjetas al centro, se encienden puntos alrededor de ellas y ninguno sobre el contenido; al seguir bajando vuelve la
  esfera; con «reducir movimiento» no hay; capturas en el teléfono.

## Queda al que construye

La velocidad del giro, el radio, la suavidad del vuelo y cuántos puntos van en un teléfono.

## Ajuste del 25-11-2026

Aquiles: «se ven bien los puntos, pero pueden ser más pequeños y más». Ahora: 260 puntos de 0,8 a 2 px, y los
contornos con un punto cada 7 px.

## Después de la revisión (25-11-2026)

La revisión en Opus encontró 6 problemas; todos arreglados con su prueba: el corte (ahora se dibuja y después se borra el
contenido, así queda borrado también donde dos cajas se pisan), la página achicada (coordenadas sin la escala), el final
de la página (se borra lo de fuera de la página, la página recorta lo que sobra y la esfera se centra en lo que se ve), un
bloque más alto que la pantalla (cuenta cada cosa: `pesoMarcos`), el contenedor de scroll (se escucha el scroll de
cualquier contenedor) y las mediciones después de desmontar. También: los contornos y los colores se calculan solo
cuando cambia la medida, un enlace dentro de un párrafo no se rodea, márgenes más holgados (corte 6 px, contorno a 10),
y la esfera descansa a los 4 segundos sin bajar (batería). La caída del peso se hizo más estricta (del todo hasta un 25 %
del camino al borde; nada desde el 65 %).

## Cambio del 25-11-2026: se disuelve una vez y se queda

Aquiles: «la esfera llega fija hasta abajo y debe disolverse y acomodarse en los bloques». Eligió «se disuelve una vez y
se queda»: arriba es una esfera; al empezar a bajar se deshace (en la primera media pantalla, cada punto a su ritmo) y
sus puntos se reparten por los bloques de toda la página (el contorno de tarjetas, fotos y botones o, si no tiene, el
borde del bloque), donde se quedan y bajan con ella; se vuelve a armar al subir al principio. Reemplaza el «se abre en
cada bloque y vuelve a la esfera» (fuera `pesoDe` y `pesoMarcos`). 400 puntos, para que alcancen para toda la página.
En liviano, los puntos ya acomodados y quietos.

## Después de la segunda revisión (25-11-2026)

Encontró 5 problemas; todos arreglados con su prueba: una página corta no terminaba de disolverse (tope: lo más que se
puede bajar), sin dónde acomodar los puntos la esfera quedaba fija (ahora se desvanece), con «profundidad» los bloques la
tapaban (capa a `z-index: 2`), una fila que se desliza de lado dejaba cortes viejos (se vuelve a medir) y una página que
no baja nunca giraba. También: los bloques enteros los marca la medición, el contenedor de scroll se guarda, las fotos de
lado a lado no pierden sus costados, el lienzo sigue el alto de la pantalla, fuera el `overflow-y: clip` de la página
(recortaba sombras) y, mientras un bloque entra con su relato, el corte de cada cosa suya abarca su lugar y el corrido.
