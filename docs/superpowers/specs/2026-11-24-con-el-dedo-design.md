# Con el dedo: papel que se arranca, se despega, se timbra y gira — diseño

Fecha: 24-11-2026. Pedido de Aquiles: «sigamos innovando»; eligió el camino 1 («si a todo, parte con el 1 y todo lo
demás»). Los caminos 2 (la página sabe cómo está el negocio) y 3 (naturaleza con peso) van después, cada uno con su
diseño.

## Para qué

Hasta ahora las piezas del kit se miran o se aprietan. Lo que hace sentir que algo es real en un teléfono es poder
**agarrarlo**: tirar de un papel y que se corte, levantar una esquina y ver el revés, bajar un timbre y que deje tinta.

La meta: cuatro piezas que la persona maneja con el dedo, con peso y con papel de verdad, para los momentos en que un
cliente gana o junta algo.

## Lo que se quiere lograr

1. **Cupón que se arranca.** Una franja con línea de puntos: se tira con el dedo, se va cortando diente por diente y
   deja ver el código.
2. **Sticker que se despega.** Se levanta desde donde se lo toma; se ve su revés y lo que había debajo. Si se suelta
   a medio camino, se vuelve a pegar.
3. **Sello que se estampa.** Un timbre baja sobre la tarjeta y deja tinta: cada marca es distinta (más cargada de un
   lado, un poco girada), como un timbre de goma.
4. **Ruleta de premios.** Se lanza con el dedo; gira con peso y roce, la lengüeta va saltando de clavo en clavo, y
   se detiene donde tiene que detenerse.
5. Todas se ven mejor dentro de una `Luz` (lo que se levanta deja sombra), y funcionan igual fuera de una.

## Lo que no entra

- El resultado de un sorteo. La ruleta **no decide** quién gana: se detiene donde le digan (`resultado`). Decidirlo es
  de La Mente.
- Canjear un cupón, validar un código o sumar un sello: son de La Mente. Las piezas avisan (`alArrancar`,
  `alDespegar`, `alTerminar`) y nada más.
- Bloques nuevos en La Mente. Son otra cara para bloques que ya existen (sorteos, sellos, avisos y promociones).
- Sonido grabado. Solo la vibración corta que el kit ya usa, si está activada.
- Modelos de IA. Librerías.

## Lo que sería un fracaso aunque funcione

- Que no se note, o que se sienta como una animación que se dispara y no como algo que se lleva con el dedo.
- Que una persona que no puede arrastrar (teclado, lector de pantalla, movimiento reducido) se quede sin ver el
  código, el premio o sus sellos.
- Que el contenido importante (el código del cupón, el premio) exista solo dibujado y no como texto.
- Que arrastrar la pieza se pelee con el scroll de la página.
- Que la ruleta «haga trampa» a la vista: que frene de golpe o retroceda para caer donde debe.

## Límites

- Reglas del repo: sin dependencias; en lo que se anima, solo `transform` (`translate`, `scale`, `rotate`) y
  `opacity`; móvil primero; movimiento reducido; accesible; español de Chile; sin `Math.random`.
- Tres niveles, como los demás momentos: `completo`, `liviano` (sin arrastre ni 3D: un toque y una transición corta)
  y `quieto` (todo a la vista, sin moverse).
- Cada pieza se baja aparte y acepta `respaldo`.
- Zonas de toque de 44 px o más. El arrastre toma el gesto solo en su eje (`touch-action`), para no trabar el scroll.
- Pesos: los topes no se suben sin Aquiles. `motion-kit/momentos` está en 12,9 KB al cargar; su tope pasa a 17.

## Caminos considerados

1. **Capas de la página, recortadas con transformaciones (elegido).** El papel es HTML de verdad (el texto sigue
   siendo texto). Lo que se arranca o se dobla son ventanas que recortan (`overflow`) y que se corren y se giran; el
   contenido de adentro se gira al revés para quedar en su lugar. Solo transformaciones: cumple la regla y corre
   suave. Costo: el doblez es recto, no una curva.
2. **Dibujar el papel en un lienzo 2D.** Permite rasgaduras irregulares y dobleces curvos. Costo: el texto pasa a
   ser píxeles (hay que duplicarlo escondido para lectores), pesa más y se ve borroso al agrandar.
3. **Una malla en WebGL que se curva.** Lo más real. Costo: mucho peso y un lienzo por pieza.

Aquiles dejó el cómo en mis manos: voy con el 1. *(Decisión mía.)*

## El diseño

Las cuatro van en `motion-kit/momentos` (se bajan aparte) y su CSS en `estilos-momentos.css`.

### 1. `CuponQueSeArranca`

```tsx
<CuponQueSeArranca titulo="2×1 en cafés" detalle="De lunes a jueves" codigo="LUNA2X1" vence="2026-12-31"
  alArrancar={() => …} respaldo={…} />
```

- El cupón muestra la oferta. El código va bajo una **franja** con línea de puntos arriba y abajo y una lengüeta
  («Tira para ver tu código»).
- Al arrastrar la lengüeta, la franja se corta hasta donde va el dedo: lo cortado cuelga y se curva un poco; lo que
  falta sigue pegado. Cada diente que se corta da un golpecito (vibración, si está activada).
- Pasado el 85 %, la franja se suelta y cae. Si se suelta antes, se queda donde va (el papel no se vuelve a pegar).
- El código queda a la vista, con un botón «Copiar». Se avisa a lectores («Código: LUNA2X1»).
- Sin arrastrar: un botón «Ver código» hace lo mismo. En `liviano` la franja se funde; en `quieto` el código está a
  la vista desde el principio.
- `vence`: si la fecha ya pasó, el cupón sale apagado, dice «Venció» y no se arranca.

### 2. `StickerQueSeDespega`

```tsx
<StickerQueSeDespega debajo={<strong>¡Un café gratis!</strong>} etiqueta="Despega para ver tu premio" alDespegar={…}>
  <span>Despégame</span>
</StickerQueSeDespega>
```

- Se toma desde cualquier borde. El doblez queda perpendicular a hacia dónde se tira; la parte levantada muestra su
  **revés** (más claro, con un brillo de adhesivo) y deja sombra sobre lo que queda.
- Soltar con más de la mitad despegada: el sticker sale volando y cae. Con menos: se vuelve a pegar, con resorte.
- `debajo` es contenido de verdad, siempre en la página; mientras está tapado va escondido también para lectores, y
  se anuncia al despegar.
- Sin arrastrar: botón «Despegar». `forma`: `circulo` (por defecto) o `cuadrado`.

### 3. `SellosConTimbre`

```tsx
<SellosConTimbre total={10} llenos={7} nuevos={1} premio="Café gratis" semilla="cafe-luna" />
```

- Como `SellosEstampa` (que sigue existiendo), pero con el timbre: los sellos de antes ya están en la tarjeta; los
  **`nuevos`** se timbran al verse: el timbre baja con su sombra, aprieta (la tarjeta cede un poco) y se levanta
  dejando la marca.
- **Cada marca es distinta y siempre la misma para el mismo sello:** giro, corrimiento y carga de tinta salen de
  `semilla` y del número del sello. La tinta tiene borde irregular y zonas más cargadas; recién puesta brilla y se
  asienta en un segundo.
- El último (el del premio) late, como hoy.
- El texto dice cuántos van. En `liviano` las marcas nuevas aparecen sin timbre; en `quieto`, todas puestas.

### 4. `RuletaDePremios`

```tsx
<RuletaDePremios premios={[{ texto: "Café gratis" }, { texto: "10 % menos" }, …]} resultado={2}
  alTerminar={(i) => …} semilla="cafe-luna" celebracion="fuegos" />
```

- De 2 a 12 premios. La rueda se dibuja con CSS; los textos son texto.
- **Se lanza con el dedo** (arrastrando por el borde: toma la velocidad del gesto) o con el botón «Girar».
- Gira con peso y roce. Arriba, una **lengüeta** se dobla al pasar cada clavo y vuelve con resorte; cada clavo da un
  golpecito.
- **Dónde se detiene lo dice `resultado`** (el índice del premio). La rueda calcula desde el principio cuántas
  vueltas dar para frenar ahí, con el mismo roce de siempre: nunca frena de golpe ni retrocede. Dentro del premio, el
  punto exacto sale de la semilla. Sin `resultado`, es de muestra y se detiene según la semilla.
- Gira una vez. Al detenerse anuncia el premio a lectores y llama `alTerminar`. `celebracion`: `confeti`, `fuegos` o
  nada.
- En `liviano` da una vuelta corta sin lengüeta; en `quieto` muestra el premio de inmediato.

### Con la luz

Dentro de una `Luz`, las sombras de lo que se levanta (la franja, la solapa del sticker, el timbre, la rueda) caen al
lado contrario de la luz en reposo. Fuera de una, hacia abajo a la derecha, como siempre.

### Vitrina

`#momentos`, sección «Con el dedo»: las cuatro, con un botón para volver a empezar cada una.

## Peso

| Qué | Propuesta |
|---|---|
| Cada pieza (se baja aparte) | se mide y se informa; meta: menos de 4 KB gzip cada una |
| `motion-kit/momentos` al cargar | hoy 12,9 KB. Cuatro cargadores más pasaban el tope de 13. **Tope nuevo: 17 KB**, fijado por Aquiles el 24-11-2026 («sube el tope a 17»). |
| Las demás entradas | no suben |

## Pruebas

- **Calculables** (`pruebas/momentos4.test.ts`): cuánto va cortado según el dedo; el doblez del sticker según hacia
  dónde se tira (y que la parte doblada es el espejo de la que falta); la tinta de cada sello (la misma para la misma
  semilla, distinta entre sellos); el plan de la ruleta (para cualquier velocidad y semilla se detiene dentro del
  premio pedido, sin retroceder, y la velocidad solo baja); la limpieza de datos (premios de más, textos enormes,
  fechas malas).
- **Visuales** (`scripts/verificar-momentos4.mjs`, partes `cupon`, `sticker`, `sello`, `ruleta`, `cierre`):
  - arrastrar corta, despega o lanza, y soltar hace lo que debe (incluido soltar a medias);
  - mientras se arrastra, en las capas solo cambian `transform` y `opacity`, y la página no se desplaza de lado;
  - el botón alternativo llega al mismo final; todo se maneja con teclado; lo importante se anuncia;
  - el código, el premio y los sellos están como texto en la página;
  - tres niveles y movimiento reducido; quieto no pide cuadros;
  - a 360 px nada se sale de lado; sin errores; datos raros no rompen;
  - la ruleta cae en `resultado` en 20 lanzamientos distintos;
  - lo mismo con WebKit.
- Capturas a medio gesto, miradas antes de dar cada pieza por hecha: se tiene que notar.

## Orden de trabajo

1. Cupón. 2. Sticker. 3. Sello. 4. Ruleta. 5. Cierre: documentos, encargo para La Mente, revisión final.

Ejecución: en esta sesión, sin commits hasta la orden de Aquiles; revisión final independiente en Opus.

## Lo que queda a criterio de quien construye

- Los números finos: dientes de la línea de puntos, cuánto cuelga y se curva la franja, el resorte del sticker, la
  carga de tinta, el roce de la rueda y el resorte de la lengüeta. Se afinan mirando.
- Los textos por defecto de botones y avisos.
- Nombres internos de clases y variables.

## Aprobado por Aquiles (24-11-2026, «si a todo, sube el tope a 17 y sigue»)

- El diseño completo.
- Tope de `motion-kit/momentos`: **17 KB**.

## Decisiones mías (para que Aquiles las corrija si quiere)

- Camino 1 (capas recortadas con transformaciones).
- Las cuatro van en `motion-kit/momentos`, no en una entrada nueva.
- El sello es una pieza nueva (`SellosConTimbre`); `SellosEstampa` queda como está.
- La ruleta gira una sola vez y nunca decide el resultado.
- La franja del cupón no se vuelve a pegar; el sticker sí.

## Precisiones (después de la lectura de quien lo construiría)

Todas son decisiones mías sobre el cómo; Aquiles las puede corregir.

### La ruleta

1. **La velocidad del dedo se respeta y lo que se ajusta es el roce, poco.** Al soltar, la rueda sale con la velocidad
   del gesto (acotada entre un mínimo y un máximo: de 2 a 7 vueltas). La distancia que recorrería con el roce de
   siempre se corre a lo más media vuelta para caer en el premio, y de ahí sale el roce de ese giro (varía cerca de un
   15 %; no se nota). Frena siempre de más a menos: nunca de golpe, nunca hacia atrás.
2. **Un impulso flojo no cuenta:** la rueda se mueve un poco, vuelve a su lugar y se puede lanzar de nuevo. El botón
   «Girar» lanza con una velocidad fija.
3. **Gira hacia los dos lados**, según el gesto; la lengüeta se dobla para el lado que corresponde. La velocidad es
   angular (el ángulo del dedo respecto del centro).
4. **De dónde sale el resultado:** de `resultado` (si ya se sabe) o de `alGirar`, una función que La Mente pasa y que
   devuelve el índice (puede demorar: es una consulta al servidor). Mientras llega, la rueda gira pareja, sin
   frenar; cuando llega, empieza a frenar hacia ese premio. Si falla o tarda más de 10 segundos, la rueda frena donde
   la lleve su impulso, **no anuncia ningún premio** y avisa con `alTerminar(null)`. Sin `resultado` ni `alGirar` es de
   muestra: se detiene según la semilla.
5. **Gira una vez.** Después el botón queda apagado. Para permitir otra vuelta, la página cambia `vez` (un número).
6. La lengüeta obliga a mover la rueda cuadro a cuadro (no con una transición). Solo corre mientras gira.
7. Los premios van también como una lista de verdad, para lectores; al detenerse se anuncia el premio.

### El sticker

8. **Se toma de cualquier parte:** todo el sticker es zona de agarre, y un toque en el centro tira del borde más
   cercano. Como se tira hacia cualquier lado, el sticker toma todo el gesto (`touch-action: none`). Por eso es
   chico: a lo más 260 px de ancho, para que siempre quede página por donde desplazarse.
9. Soltar con más de la mitad despegada, o llegar al 90 % con el dedo: termina de despegarse solo y cae. Con menos, se
   vuelve a pegar. Que el navegador cancele el gesto cuenta como soltar.
10. **El revés es liso** (más claro, con brillo de adhesivo): no hay texto al revés. El contenido del sticker va una
    sola vez.
11. `debajo` está siempre en la página, pero mientras está tapado no lo alcanzan ni el foco ni los lectores; al
    despegar se anuncia. El botón «Despegar» es el camino de quien no arrastra.

### El cupón

12. **Se arranca de izquierda a derecha.** La lengüeta toma el gesto horizontal y deja pasar el vertical
    (`touch-action: pan-y`), con captura del puntero.
13. **Lo cortado se curva:** va partido en cuatro tramos, cada uno un poco más girado que el anterior. Son
    transformaciones, pero se lee como papel que se enrosca. La copia que cuelga es decoración.
14. **El código** no está en la página hasta que se arranca (o hasta apretar «Ver código»): ahí aparece como texto y
    se anuncia. En `quieto` está a la vista desde el principio.
15. **`vence`** es una fecha (`AAAA-MM-DD`): el cupón vale todo ese día, en la hora del teléfono. Una fecha que no se
    entiende se ignora.

### Para las cuatro

16. **Vibración:** `vibracion` (por defecto, sí), como hace hoy `SellosEstampa`. Nunca en `quieto`.
17. **Sombras:** capas propias que se corren y se funden, con la luz en reposo de la página si hay una
    (`var(--mk-l0x, -.45)`) y, si no, la de siempre. No se importa nada de `motion-kit/luz`.
18. **Semillas:** las mismas funciones de los momentos (`numeroDe`, `girosSellos`).
19. **La tinta del sello:** un filtro fijo por sello (no se anima) le da el borde irregular; el giro, el corrimiento y
    la carga salen de la semilla y del número del sello.
20. **El paquete:** `perezosos-4.tsx`, la entrada `momentos`, `scripts/verificar-momentos4.mjs`, su regla en
    `verificar-cambios.mjs` y `probar-paquete`.
