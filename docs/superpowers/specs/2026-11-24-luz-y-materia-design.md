# Luz y materia: una sola luz para la página — diseño

Fecha: 24-11-2026. Pedido de Aquiles: «aún debemos ser más realistas en lo que creamos, siempre mejor a lo que ya
tenemos»; eligió el camino 1 («si a todo, parte con el 1»).

## Para qué

Hoy las piezas del kit se mueven bien, pero se nota que son dibujos: una tarjeta se inclina y su sombra no cambia;
cada pieza trae su propia sombra, hacia donde le tocó; el brillo es un adorno que cruza, no la luz pegando en algo.
Lo que hace que un objeto se vea real es la **luz**: de dónde viene, qué sombra deja y cómo responde cada material.

La meta: que una página armada con el kit se vea como objetos sobre una mesa, iluminados por una sola luz.

## Lo que se quiere lograr

1. **Una sola luz por página.** Todas las sombras caen hacia el mismo lado.
2. **La sombra dice a qué altura está cada cosa.** Lo que se levanta deja una sombra más larga, más blanda y más
   clara; lo que se aprieta se hunde y su sombra se junta.
3. **El brillo se corre** cuando la persona mueve el cursor, el dedo o la página. No es un adorno que pasa solo.
4. **Cada material responde distinto:** papel, plástico mate, vidrio, metal y holográfico.
5. **Mejora lo que ya existe:** tarjetas, botones, el libro que se abre y el carrusel giratorio.

## Lo que no entra

- Luz calculada con WebGL, mapas de relieve ni modelos 3D.
- Sombras de una pieza sobre otra pieza (cada una proyecta sobre el fondo, no sobre su vecina).
- Cambios en los contratos de La Mente. Al final va un encargo.
- Física (vapor, tela, agua) y dioramas: son los caminos 2 y 3, después.
- Modelos de IA.

## Lo que sería un fracaso aunque funcione

- Que un texto se lea peor por tener un brillo encima.
- Que la luz se mueva sola y distraiga, o que gaste batería con la página quieta.
- Que no se note. Aquiles lo dijo del paralaje de la vitrina («no se nota el efecto»): lo que se entrega tiene que
  verse a la primera, en un teléfono, sin que nadie lo explique.
- Que se vea falso por exagerado (sombras negras, brillos de plástico). Se nota, pero como se nota en un objeto real.
- Que una página sin `Luz` cambie en algo, o que suba el peso de las entradas que ya existen al cargar.

## Límites

- Reglas del repo: sin dependencias; en lo que se anima, solo `transform` (`translate`, `scale`, `rotate`) y
  `opacity`; móvil primero; movimiento reducido; accesible; español de Chile.
- Sin `Math.random`. Sin modelos de IA.
- Los topes de peso no se suben sin Aquiles. Hoy quedan estrechos: `motion-kit` 79,3 de 80 KB, `encabezado` 34,0 de
  35, `momentos` 12,9 de 13. Por eso la luz va en una **entrada nueva**.
- Nada sigue la inclinación del teléfono si no se pide: en iPhone eso abre un permiso del sistema.

## Caminos considerados

1. **Variables CSS y capas (elegido).** La luz es un par de números en variables CSS. Cada superficie lleva capas
   decorativas ya dibujadas (una sombra, un brillo) que solo se **corren, se agrandan y se funden**. Pesa poco, corre
   en el compositor y sirve para lo que ya existe. Costo: no es luz «calculada»; es un truco bien afinado.
2. **Animar `box-shadow` y filtros directo.** Más simple de escribir, pero cada cuadro vuelve a pintar: rompe la regla
   del repo y se traba en teléfonos.
3. **WebGL con relieve por pieza.** Lo más real, pero un lienzo por pieza, mucho peso y texto que deja de ser texto.

Aquiles dejó el cómo en mis manos («si a todo»): voy con el 1. *(Decisión mía.)*

## El diseño

### 1. La luz: `Luz`

Entrada nueva **`motion-kit/luz`**, con su CSS (`estilos-luz.css`).

```tsx
<Luz sigue={["puntero", "scroll"]}>
  …la página o una sección…
</Luz>
```

- Pone en su raíz `data-mk-luz` y dos pares de variables:
  - `--mk-l0x`, `--mk-l0y`: **de dónde viene la luz en reposo** (de -1 a 1). Por defecto, de arriba a la izquierda
    (-0.45, -0.8). Cambia poco o nunca: lo usan las sombras de todo.
  - `--mk-lx`, `--mk-ly`: **la luz ahora**: el reposo más lo que la persona la movió. Lo usan los brillos y las
    sombras de las superficies con capas.
- `sigue`: qué la mueve. `"puntero"` (cursor o dedo), `"scroll"` (se corre un poco al bajar), `"inclinacion"` (el
  teléfono; solo si se pide) y `"hora"`. Por defecto `["puntero", "scroll"]`. *(Decisión mía.)*
- `rango` (0 a 1, por defecto 0,35): cuánto se aparta del reposo. Con suavizado; al quedar quieta deja de calcular.
- `desde`: el reposo, si se quiere otro (`{ x, y }`).
- **`"hora"`:** el reposo sale de la hora del teléfono. En la mañana la luz viene baja y cálida desde la izquierda;
  al mediodía, de arriba y neutra; en la tarde, baja y cálida desde la derecha; de noche, fría y tenue. Suma
  `--mk-luz-tinte` (un color) y `--mk-luz-fuerza` (0,6 a 1). Se recalcula cada diez minutos. Sin red ni ubicación.
- **Niveles:** con «reducir movimiento» o en nivel `liviano` la luz queda fija en su reposo. Las sombras siguen
  siendo coherentes; solo deja de moverse.
- Solo trabaja mientras se ve y con la pestaña visible.
- Una `Luz` dentro de otra manda en su zona.

Lo calculable vive en `src/luz/calculo-luz.ts` (sin navegador): acotar la luz, la luz de la hora, y la geometría de
la sombra (para pruebas y para la vitrina).

### 2. Las superficies: `Materia`

```tsx
<Materia tipo="vidrio" altura={2} como="article">…contenido…</Materia>
```

- `tipo`: `papel` · `mate` · `vidrio` · `metal` · `holografico`.
- `altura` (0 a 4): qué tan levantada está. `alApuntar` (por defecto, una más): se levanta al apuntarla.
  Al apretarla baja a 0.
- `inclina` (grados, por defecto 0): la superficie se inclina hacia el cursor o el dedo. La profundidad va en su
  propia transformación, no en el padre (no mueve a los hijos fijos de nadie).
- Dibuja dos capas decorativas (`aria-hidden`, sin recibir toques):
  - **La sombra**, detrás: dos manchas ya difuminadas. Una de **contacto** (chica, oscura, casi no se mueve) y una
    **proyectada**, que se corre al lado contrario de la luz en proporción a la altura, se agranda y se aclara.
    Cambiar de altura es fundir y correr esas capas: nunca se anima `box-shadow`.
  - **El brillo**, adentro y recortado por el borde: más grande que la superficie; se corre con la luz.
- **Cada material:**

| Material | Sombra | Brillo |
|---|---|---|
| `papel` | Blanda y cercana | Sin brillo: apenas más claro hacia la luz, con grano fino |
| `mate` | Media | Ancho y suave |
| `vidrio` | Tenue y teñida por lo que hay detrás | Una franja nítida en diagonal y el canto iluminado del lado de la luz |
| `metal` | Marcada | Bandas que recorren la superficie; el lado contrario se oscurece |
| `holografico` | Media | Un arcoíris que cambia según el ángulo |

- **El texto manda:** el brillo nunca baja el contraste del contenido de lo que exige la norma (4,5 a 1). Se mide.
- Fuera de una `Luz`, una `Materia` usa la luz por defecto, fija.

### 3. Lo que ya existe, dentro de una `Luz`

Fuera de una `Luz` nada cambia.

- **Tarjetas y botones** (`Tarjeta`, `Boton`, y las sombras duras de los estilos `retro` y `anime`): su sombra pasa a
  caer según la luz **en reposo**, y al apretar un botón se hunde hacia su sombra. Es una sombra fija (no se anima),
  así que no hay costo por cuadro. Lo hace el CSS de la entrada `luz`; la entrada principal no crece. El brillo que se
  corre y los materiales son de `Materia`: una tarjeta o un botón «de verdad» se arma con `Materia` (precisión 1).
- **Libro que se abre:** la hoja que se pasa se sombrea mientras gira (más oscura al ponerse de canto), deja sombra
  sobre la hoja de abajo y las hojas quietas se aclaran hacia la luz. Va en el archivo del libro, que se baja aparte.
- **Carrusel giratorio:** cada ficha se oscurece cuando le da la espalda a la luz y se aclara al quedar de frente; el
  anillo deja un reflejo en el piso donde el navegador lo permite, y una sombra de piso donde no.
- La «foto profunda», los fondos y los encabezados no se tocan en esta tanda.

### 4. Dos piezas nuevas en `motion-kit/luz`

Hoy viven solo como estilos de la vitrina del Director.

- **`TarjetaHolografica`**: una `Materia` holográfica que se inclina, lista para una membresía, un cupón o un sello.
- **`TituloConVolumen`**: un título con espesor, extruido hacia el lado contrario de la luz en reposo, con su sombra.
  El texto sigue siendo texto (se lee, se selecciona, lo lee un lector de pantalla).

### 5. Vitrina

`#luz`: una mesa con las cinco materias, el control de la luz (qué la mueve, la hora, el rango) y, para cada pieza
mejorada, **antes y ahora** lado a lado. Es donde Aquiles juzga si se ve más real.

## Peso

| Qué | Propuesta |
|---|---|
| Entrada `motion-kit/luz` al cargar | tope **8 KB** gzip, con su CSS adentro (fijado por Aquiles el 24-11-2026) |
| `estilos-luz.css` | se mide; sin tope, como los otros CSS |
| `motion-kit`, `encabezado`, `momentos` al cargar | no suben |
| Libro y carrusel (se bajan aparte) | se miden y se informan |

## Pruebas

- **Calculables** (`pruebas/luz.test.ts`): la luz siempre queda dentro de su rango; la hora da lo mismo para la misma
  fecha y cambia de lado entre mañana y tarde; a más altura, la sombra proyectada queda más lejos, más grande y más
  clara, siempre del lado contrario de la luz.
- **Visuales** (`scripts/verificar-luz.mjs`, partes `luz`, `materia`, `existe`, `piezas`, `cierre`):
  - todas las sombras de una página caen hacia el mismo lado, y cambian de lado si cambia la luz;
  - al mover el cursor el brillo se corre, y lo único que cambia en las capas es `transform` y `opacity`;
  - con la página quieta no se pide ningún cuadro;
  - con movimiento reducido y en `liviano` la luz no se mueve;
  - apretar hunde y apuntar levanta;
  - el contraste del texto bajo el brillo más fuerte, medido;
  - a 360 px nada se sale de lado; sin errores en la consola;
  - una página sin `Luz` se ve igual que antes (libro, carrusel, tarjetas, botones);
  - lo mismo con WebKit (`en-safari.mjs`).
- `npm run verificar` conoce la prueba nueva. Pesos y `probar-paquete` con la entrada nueva.

## Orden de trabajo

1. La luz y lo calculable.
2. `Materia` con sus cinco materiales, y la vitrina.
3. Tarjetas, botones y estilos de sombra dura.
4. El libro.
5. El carrusel.
6. `TarjetaHolografica` y `TituloConVolumen`.
7. Cierre: documentos, encargo para La Mente, revisión final.

Ejecución: en esta sesión, sin commits hasta la orden de Aquiles; revisión final independiente en Opus.

## Lo que queda a criterio de quien construye

- Los números finos: cuánto se corre cada sombra por nivel de altura, tamaños y opacidades, las bandas del metal, los
  colores del holográfico, la curva del suavizado. Se afinan mirando la vitrina.
- Cómo se sombrea la hoja del libro por dentro (capas y tiempos), respetando lo de arriba.
- Los nombres internos de clases y variables auxiliares.

## Aprobado por Aquiles (24-11-2026, «si a todo, haz el commit y parte»)

- El diseño completo, con sus precisiones.
- Las tarjetas y los botones que ya existen: solo sombra coherente y hundirse; el resto es de `Materia`.
- Tope de `motion-kit/luz`: **8 KB**.

## Decisiones mías (para que Aquiles las corrija si quiere)

- Camino 1 (variables y capas).
- La luz por defecto viene de arriba a la izquierda y la mueven el cursor y el scroll; el giroscopio, solo si se pide.
- En tarjetas y botones que ya existen la sombra sigue a la luz en reposo (fija), no a la luz que se mueve.
- Tope propuesto de 8 KB para la entrada nueva (el CSS que la pieza inyecta cuenta dentro).
- La tarjeta holográfica y el título con volumen pasan de la vitrina al kit.

## Precisiones (después de la lectura de quien lo construiría)

### Lo que ya existe

1. **`Materia` es una pieza aparte.** `Tarjeta` y `Boton` no ganan materiales ni brillo: no tienen capas libres (sus
   `::before` y `::after` están ocupados) y la entrada principal está a 0,7 KB de su tope. Dentro de una `Luz` solo
   cambian su sombra y cómo se aprietan. No se anidan: dentro de una `Materia`, una `Tarjeta` va `plana`.
2. **Quién recibe sombra dentro de una `Luz`:** `Tarjeta` `elevada` y `vidrio` (esta, tenue); `Boton` `solido`,
   `degradado` y `vidrio`, y la forma `tecla`; las sombras duras de `retro` y `anime`. Lo que es plano por diseño
   sigue plano (`plana`, `borde`, `acento`, `contorno`, `suave`, `fantasma`). Las formas `ticket` y `pixel` quedan
   fuera: su recorte se come cualquier sombra. `neon` no cambia: emite luz, no la recibe.
3. **Que el CSS de la luz gane siempre:** sus reglas van con los dos órdenes (`[data-mk-luz] .mk-estilo …` y
   `.mk-estilo [data-mk-luz] …`) y con el mismo truco de peso que usan las formas del botón (`:not(#\#)`). La prueba
   mira la sombra calculada en cada estilo, no el CSS.
4. **Apretar:** dentro de una `Luz` el botón se corre hacia su sombra (unos píxeles, con `translate`) y la sombra
   proyectada se quita de una vez, sin transición. `tecla` ya se hundía: lo nuevo es hacia dónde.
5. **El libro.** La hoja que gira muestra su cara hasta los 90° y su dorso después. Entonces: la cara se oscurece
   durante la primera mitad del giro y el dorso se aclara durante la segunda. Son dos transiciones de `opacity`
   sobre el `::before` de cada lado (libre hoy), cada una en un solo sentido: si alguien cambia de dirección a medio
   giro, se devuelven solas, sin salto. La sombra sobre la hoja de abajo es una capa de la hoja siguiente. En el modo
   simple (la hoja se desvanece) no hay sombreado de giro. Todo bajo `[data-mk-luz]`; el libro no importa nada de
   la entrada `luz`.
6. **El carrusel.** El oscurecimiento es continuo: al pintar, el carrusel deja en cada ficha un número (qué tan de
   frente a la luz está) y una capa oscura sobre la ficha (`::after`, libre hoy) cambia su `opacity`. Solo mientras
   gira. Dentro de una `Luz` esa capa **reemplaza** al 62 % de opacidad que hoy tienen las fichas de costado (así el
   texto no pierde contraste dos veces). El lado de donde viene la luz queda más claro que el otro. El reflejo va en
   la escena, no en el anillo, solo donde `@supports (-webkit-box-reflect: below)`; donde no, una sombra de piso. Se
   revisa en Chromium y en WebKit que el 3D no se aplane y que nada quede cortado.
7. El libro y el carrusel suman CSS a sus archivos (que se bajan aparte) y a `estilos-momentos.css`. Se mide y se
   informa.

### La luz

8. **`Luz` dibuja un `div`** (acepta `como`, `className`, `style` y lo demás). Lleva su propio seguidor, chico: el
   cursor se mide contra **la pantalla**, no contra la raíz (una página mide miles de píxeles); el scroll, contra lo
   que la raíz lleva recorrido. No reutiliza el del encabezado, que mide contra su caja.
9. **Inclinación del teléfono:** solo si `sigue` trae `"inclinacion"`. En Android parte sola. En iPhone hay que pedir
   permiso: `Luz` no lo pide por su cuenta; se pide con un botón explícito (`usePermisoInclinacion`, que la página
   pone donde quiera).
10. **Niveles:** la luz queda fija en `quieto` y en `liviano`. `Luz` mira «reducir movimiento» y el ahorro de datos;
    no mide la fluidez. En esos niveles `Materia` conserva su altura y sus sombras, y no se inclina.
11. **Con los valores por defecto ninguna sombra cambia de lado:** el reposo es (-0,45; -0,8) y el rango 0,35, así
    que la luz que se mueve nunca cruza al otro lado. La prueba «todas caen hacia el mismo lado» mira el signo.
12. **`hora`:** se calcula después de montar (el primer dibujo usa el reposo por defecto: no hay diferencia con lo
    que mandó el servidor). `desde`, si viene, manda sobre la dirección; el tinte y la fuerza siguen siendo de la
    hora. El tinte y la fuerza los usan las superficies (`Materia` y las dos piezas nuevas), no las tarjetas ni los
    botones que ya existían.
13. **Nombres:** el encabezado ya tiene una luz propia (`LuzYReflejo`, clase `.mk-luz`, variables `--mk-cx`). La de
    página es otra cosa y usa otros nombres (`data-mk-luz`, `--mk-lx`, clases `mk-lz-…`). No se mezclan.

### `Materia` y las piezas nuevas

14. **La sombra tiene la forma de la superficie:** dos capas del mismo tamaño y con el mismo borde redondeado que la
    superficie, negras y con un difuminado fijo (el difuminado no se anima). Cambiar de altura es correr, agrandar
    y fundir la proyectada. Pensado para decenas de superficies por página, no cientos.
15. **El canto del vidrio** puede ser fijo (orientado por la luz en reposo) si moverlo cuesta más de lo que luce.
16. **Contraste:** se mide en la vitrina, con el brillo al máximo, sobre un fondo claro y uno oscuro.
17. **`inclina`** lleva su propio seguimiento del cursor sobre la superficie; cuenta dentro del tope.
18. **`TituloConVolumen`** saca sus colores del color del texto (`color-mix`), no de colores fijos.
    **`TarjetaHolografica`** se construye desde cero: lo de la vitrina era solo un brillo.

### Lo que cambió la revisión final (25-11-2026)

20. **El scroll, superficie por superficie** (cambia la precisión 8): donde el navegador ata animaciones al scroll,
    cada `Materia` lleva sola por dónde va en la pantalla y su brillo se corre al pasar; `Luz` no escucha el scroll.
    Donde no existe, queda lo de antes (la luz entera según por dónde va la raíz).
21. **La luz no cruza de lado ni viene de abajo** (cambia la precisión 11, que valía solo para los valores por
    defecto): vale para cualquier rango y cualquier hora.
22. **El vidrio toma el color de texto de la página**; no impone uno oscuro.
23. **Sin capas propias (`will-change`):** medido, mover la luz no baja de 60 cuadros por segundo con el procesador
    frenado 6 veces. La frase «corre en el compositor» del camino elegido era de más: se repinta, y alcanza.
24. Una `Luz` adentro de otra tampoco hereda el tinte ni la fuerza de la hora. Un botón apagado no se mueve; con
    «reducir movimiento» apretar no corre nada; la tecla se sigue levantando al apuntarla; el efecto `elevar` sigue a
    la luz. La inclinación del teléfono mira cómo está girada la pantalla.

### El paquete

19. El CSS se inyecta desde la pieza (cuenta en el tope) y además sale como `estilos-luz.css`, igual que las otras
    entradas. Hay que sumar la entrada en `vite.config.ts`, `package.json`, `scripts/medir-paquete.mjs`,
    `scripts/generar-css.mjs`, `scripts/probar-paquete.mjs` y `scripts/verificar-cambios.mjs`, y comprobar que nada
    se corra de bytes en las entradas que ya están justas.
