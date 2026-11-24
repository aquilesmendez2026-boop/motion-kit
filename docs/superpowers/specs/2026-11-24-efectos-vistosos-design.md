# Efectos vistosos (tanda 2 del 24-11): fuegos artificiales, carrusel giratorio y libro que se abre

Diseño. Aquiles aprobó la tanda el 24-11-2026 («si a todo, haz el commit y sigue con la 1 2 y 3»). Las decisiones de
cómo se construye son mías y van marcadas como «decisión mía».

## Para qué

La meta de La Mente: páginas que sorprenden, hechas en minutos por el dueño. Estos tres efectos estaban anotados como
pendientes («carta que se abre como libro, carrusel 3D, fuegos artificiales»). Son alternativas más vistosas para
bloques que ya tienen su momento: la galería, la carta de precios y las celebraciones.

## Qué entra y qué no

Entra:

1. **`FuegosArtificiales`**: ráfagas de chispas que suben, revientan y caen. Para celebrar (ganador de un sorteo, tarjeta
   de sellos completa, la cuenta regresiva que llega a cero).
2. **`CarruselGiratorio`**: fichas con foto puestas en un anillo que gira con el dedo, con impulso, y se detiene en una.
3. **`LibroQueSeAbre`**: la carta de precios como un libro: la tapa se abre y las hojas se pasan.

No entra (y por qué):

- **Título con volumen y tarjeta holográfica.** La decisión del 24-11 («Motor de animación propio») dice que esos dos
  pasan a ser partituras del Director. Necesitan inclinar en 3D, y el modelo de la partitura (versión 0) no lo tiene:
  van con la fase 2 del Director. Hacerlos ahora como piezas sueltas sería trabajo que después se bota.
  **Decisión mía; si Aquiles los quiere ya, se hacen como piezas y se portan después.**
- **Ecualizador con sonido real.** Necesita permiso CORS en los audios de La Mente (cambio en AWS). Queda anotado.
- Cambios en La Mente. Va un encargo en el cerebro.

Anti metas: que una celebración tape un botón o un texto; que el carrusel deje fichas sin poder leerse o apretarse;
que la carta no se pueda leer si el 3D falla; que alguna pieza siga dibujando cuando no se ve.

## Reglas que valen para las tres

- Viven en `motion-kit/momentos`, se bajan aparte (`aparte()`), aceptan `respaldo` y las props comunes
  (`nivel`, `ahorro`, `className`). La entrada `momentos` no puede pasar su tope (13 KB; hoy 12,6).
- Tres niveles, como todos los momentos (`useMomento`): `completo`, `liviano` y `quieto`. Con movimiento reducido,
  `quieto`.
- En CSS solo se animan `transform` y `opacity`. Nada de `Math.random`: lo que parece azar sale de una semilla.
- Todo el contenido está siempre en el DOM y se puede leer: el 3D es solo cómo se ve.
- Lo que se aprieta mide 44 px o más, tiene foco visible y no se mueve bajo el cursor.
- Colores: las variables de los momentos (`--mk-m-acento`, `--mk-m-acento-2`, `--mk-m-superficie`, `--mk-m-texto`).

## 1. `FuegosArtificiales`

```
<FuegosArtificiales semilla={7} rafagas={3} />
```

- **Props:** `semilla: number`; `rafagas?: number` (de 1 a 5; por defecto 3); `alTerminar?: () => void`.
  No lleva `nivel`: quien la monta decide si celebrar (igual que `Confeti`).
- **Qué se ve:** un lienzo que cubre a su contenedor (posición absoluta, sin toques, `aria-hidden`). Cada ráfaga: un
  punto de luz sube desde abajo, revienta en 40 chispas que se abren en círculo, caen con peso y se apagan dejando una
  cola corta. Las ráfagas parten con 450 ms de diferencia, en distintos lugares y colores (acento, acento 2 y texto).
  Dura unos 3 segundos y el lienzo se quita solo.
- **Cómo:** lienzo 2D (decisión mía: son cientos de puntos con cola; en el DOM pesarían más). Los colores se leen una
  vez de las variables. La posición de cada chispa sale de una fórmula del tiempo (no acumula errores y se puede probar).
- **Reglas:** con movimiento reducido no dibuja nada y llama a `alTerminar` de inmediato. Con la pestaña oculta se
  detiene y, al volver, sigue donde iba. Si no hay lienzo 2D, no hace nada. Al desmontarse suelta todo.
- **Dónde se usa:** `SorteoRaspe` suma la prop `celebracion?: "confeti" | "fuegos"` (por defecto `confeti`, como hoy).
  La pieza también sale sola de `motion-kit/momentos` para que La Mente la use donde quiera.

## 2. `CarruselGiratorio`

```
<CarruselGiratorio fichas={[{ url, titulo, pie, precio, href }]} etiqueta="Lo más pedido" />
```

- **Props:** `fichas: { url?: string; alt?: string; titulo?: string; pie?: string; precio?: string; href?: string }[]`
  (calzan con las fotos de la galería y con los platos de una lista de precios de La Mente); `etiqueta?: string` (el
  nombre para lectores; por defecto «Carrusel»). Se usan las primeras 12. Con menos de 3, se muestran en fila, sin
  anillo. Los `href` que no sean `http`, `https` o rutas del sitio no se enlazan (`esEnlaceSeguro`).
- **Qué se ve (completo):**

  ```
        ┌────┐   ┌──────────┐   ┌────┐
        │    │   │   foto   │   │    │      ← las de los lados, giradas y más atrás
        │    │   │  Título  │   │    │
        └────┘   └──────────┘   └────┘
            ‹        ● ○ ○ ○        ›
  ```

  Las fichas están en un anillo. Se gira arrastrando con el dedo o el cursor; al soltar sigue con impulso y se detiene
  justo en una ficha, con resorte. También con los botones «Anterior» y «Siguiente» y con las flechas del teclado. Al
  entrar a la vista por primera vez, el anillo llega girando desde una ficha más allá.
- **Cómo:** un solo elemento (el anillo) cambia su `transform` por cuadro; cada ficha tiene su giro fijo. El bucle
  duerme cuando el anillo llega. El arrastre vertical sigue siendo scroll de la página (`touch-action: pan-y`).
- **Accesible:** es una lista (`<ul>`) dentro de una región con nombre. Todas las fichas se leen. Solo la del frente
  tiene su enlace en el orden del teclado; las demás quedan con `tabindex=-1` (no se puede apretar algo que está de
  lado o atrás). Un texto en vivo dice «Ficha 2 de 6: Título». Un arrastre no cuenta como clic.
- **Liviano, quieto o sin 3D:** una fila que se desliza con el dedo (scroll del navegador con `scroll-snap`), sin
  bucle. Los botones mueven la fila.
- **Fotos:** `loading="lazy"`, con `alt` (el de la ficha, o el título). Una foto que no carga deja la ficha con su
  título sobre el color de superficie.

## 3. `LibroQueSeAbre`

```
<LibroQueSeAbre tapa={{ titulo: "La carta", bajada: "Café Luna" }}
                hojas={[{ titulo: "Cafés", lineas: [{ texto: "Cortado", detalle: "Doble", precio: "$2.500" }] }]} />
```

- **Props:** `tapa: { titulo: string; bajada?: string; imagen?: string }`;
  `hojas: { titulo: string; lineas: { texto: string; detalle?: string; precio?: string }[] }[]` (una hoja por grupo de
  la lista de precios de La Mente). Hasta 12 hojas y 14 líneas por hoja; lo que sobra no se dibuja (el bloque de
  siempre de La Mente sigue siendo donde se ve todo). Sin hojas, no se dibuja nada.
- **Qué se ve (completo), pantalla ancha:** un libro cerrado. Al entrar a la vista la tapa se abre girando sobre su
  lomo y queda el libro abierto en dos páginas. «Página siguiente» da vuelta la hoja de la derecha sobre la izquierda.
- **Pantalla angosta (menos de 620 px de ancho del bloque):** una página a la vez. La tapa y cada hoja giran sobre el
  borde izquierdo y se van desvaneciendo; debajo queda la página que sigue.
- **Cómo:** hojas apiladas con `transform-style: preserve-3d`; cada una gira con `rotateY` por una transición (curva
  del resorte del estilo). En ancho, cada hoja lleva contenido en sus dos caras; en angosto, solo en el frente. El
  reparto lo hace una función pura (`carasLibro`). El orden del DOM es el orden de lectura.
- **Controles:** «Abrir la carta», «Página siguiente», «Página anterior» y «Cerrar» (botones de 44 px, con el estado en
  texto: «Páginas 2 y 3 de 6»). También las flechas del teclado. La tapa se abre sola una vez al entrar a la vista;
  después manda quien lee.
- **Liviano o quieto, o sin 3D:** la carta plana: el título de la tapa y las hojas una debajo de otra, sin botones.
- **Accesible:** todo el texto está en el DOM siempre. Los precios van como texto. Las caras que no se ven no llevan
  nada que se apriete.

## Vitrina, pruebas y documentos

- Vitrina `#momentos`, sección nueva «Efectos vistosos» (`data-prueba=vistosos`), con casos normales y de borde (una
  ficha, doce fichas, textos largos, sin fotos, una sola hoja, doce hojas).
- Pruebas unitarias de lo calculable (`pruebas/momentos3.test.ts`): trayectoria de las chispas, radio y ángulos del
  anillo, dónde se detiene al soltar, reparto de caras del libro, recortes de datos.
- Prueba visual nueva `scripts/verificar-momentos3.mjs` (partes `fuegos`, `carrusel`, `libro`, `cierre`): niveles,
  movimiento reducido, teclado, arrastre, clic lento, que nada siga dibujando al llegar ni fuera de la vista, teléfono
  sin desborde de lado, que el archivo que no baja deje el respaldo, y limpieza al salir. También en WebKit (Safari)
  para lo que no dependa de arrastrar.
- `docs/CATALOGO.md`, `CHANGELOG.md`, `CLAUDE.md` (lista de pruebas) y un encargo para La Mente en el cerebro.

## Caminos que miré

1. **Piezas de `momentos`, que se bajan aparte (elegido).** Calza con cómo La Mente ya usa los momentos y no toca los
   topes de peso.
2. **Como partituras del Director.** No alcanza: un anillo que se arrastra, un lienzo de chispas y un libro con hojas
   son estructuras con estado, no un movimiento sobre partes que ya existen.
3. **Como efectos del encabezado (`efecto` en la receta).** Los fuegos podrían serlo, pero un encabezado que celebra
   siempre cansa; como celebración de un momento tiene sentido.

## Lo que queda para quien construye

Los números finos (cuánto frena el impulso, cuántos grados de holgura, tiempos exactos) y los nombres internos.

## Precisiones tras la revisión del diseño (24-11-2026)

Un revisor leyó el diseño como quien lo construye. Lo que cambió o quedó fijado (todas son decisiones mías, salvo
que Aquiles diga otra cosa):

1. **La carta larga se parte, no se corta.** Un grupo con más de 10 platos sigue en la hoja siguiente («Cafés
   (sigue)»). Tope: 16 hojas, o sea 160 platos. Reemplaza los topes de 12 hojas y 14 líneas de arriba.
2. **Agotado.** Las fichas del carrusel y las líneas del libro aceptan `agotado?: boolean`: muestran «Agotado» y el
   precio va apagado. Cómo se llena desde `ItemPrecio` va en el encargo para La Mente.
3. **Los fuegos solo se conectan a `SorteoRaspe`** (y salen como pieza suelta). Sellos completos y cuenta regresiva en
   cero quedan para cuando La Mente los pida: son dos props más.
4. **Fuegos:** el lienzo usa hasta 2 de densidad de pantalla y un lado máximo de 1600 px. Si cambia `semilla` con la
   pieza montada, parte de nuevo; si cambia otra cosa, no. `alTerminar` se llama desde un efecto, nunca al dibujar. En
   `SorteoRaspe` los fuegos se bajan aparte solo si se piden. La regla «solo `transform` y `opacity`» es para el CSS:
   un lienzo que se redibuja es otra cosa, y ya hay precedentes (los fondos, el raspe).
5. **Carrusel con pocas fichas:** con 3, 4 o 5 fichas el anillo las repite (6, 8 o 10 puestos) para que las de los
   lados no queden de canto. Las copias son decoración (`aria-hidden`, sin enlaces). Con menos de 3 va la misma fila
   que usa el nivel liviano.
6. **Carrusel, dedo y teclado:** un movimiento de más de 6 px es arrastre, no clic. Tocar una ficha de lado la trae al
   frente (no abre su enlace). Si el navegador cancela el gesto (era scroll de la página), no hay impulso. Las flechas
   del teclado solo actúan con el foco dentro del carrusel. El texto en vivo se dice cuando el anillo se detiene, no en
   cada ficha por la que pasa. Los puntos de abajo son decoración.
7. **Libro, apilado:** cada hoja va separada 1 px hacia quien mira según su estado (`apilado`): a la derecha manda la
   primera sin pasar; a la izquierda, la última pasada. Las caras llevan `backface-visibility: hidden`.
8. **Libro, lectura:** el texto de todas las hojas queda legible para lectores de pantalla (no se usa `inert`). Las
   hojas no llevan nada que se apriete; solo los controles reciben foco.
9. **Libro, tamaño:** mide el ancho de su propio bloque (`ResizeObserver`). Al cambiar entre una y dos páginas se sigue
   leyendo la misma hoja (`vueltasAlCambiar`). El alto es el de la hoja más alta (todas las caras comparten la misma
   celda): nada se desplaza por dentro. «Sin 3D» es `CSS.supports("transform-style","preserve-3d")` en falso.
10. **Peso:** las tres piezas se bajan aparte y no cuentan en la entrada; la entrada solo suma sus envoltorios. Se
    mide apenas estén conectadas. Si pasa de 13 KB, se para y se pregunta.

## Precisiones de la revisión final (24-11-2026)

Un revisor independiente leyó el código terminado: sin críticos, 5 importantes y 10 menores. Se arreglaron todos. Lo
que cambia respecto de lo escrito arriba:

1. **Libro, hojas en 3D.** Solo se dibujan las hojas cercanas a la que se lee (de dos antes a una después: cuatro a lo
   más). Cada hoja es una capa en la tarjeta gráfica, y una carta de dieciséis no cabría en un teléfono. Al saltar
   varias hojas de una vez (cerrar) o al cambiar entre una y dos páginas, el libro se arma de nuevo y aparece suave.
2. **Libro, texto.** El texto completo va en una capa que no se ve (`.mk-m-libro-texto`): es lo que leen los lectores
   y lo que da el alto del libro. Las hojas que se ven son decoración (`aria-hidden`).
3. **Libro, botones.** «Anterior», «Siguiente» (o «Abrir la carta») y «Cerrar», con nombre completo para lectores
   («Página anterior», «Página siguiente»). No se corren: el que cambia de texto tiene ancho fijo y el estado va en
   su propia línea. Tocar la mitad izquierda no cierra el libro.
4. **Fuegos, color.** Si el color del tema no tiene color (negro, gris o blanco), va uno festivo.
5. **Carrusel, dedo y teclado.** El arrastre cuenta en cualquier dirección (más de 6 px). Después de un arrastre con
   el dedo, el siguiente Enter o la activación de un lector sí cuentan. Mientras gira, el foco espera en el carrusel.
6. **Carrusel, fotos.** Una foto que no cargó vuelve a verse si cambia su dirección. Una dirección de más de 2.000
   letras se descarta (cortada sería otra).
7. **Anuncios.** La entrada del carrusel y la apertura sola del libro no se anuncian a los lectores.
8. **Respaldo sin medidas de contenedor** (Safari antes de la 16) y `width:100%` en las dos piezas que las usan.

Sin comprobar (no hay aparatos): la memoria del libro en un iPhone real, VoiceOver y TalkBack de verdad.
