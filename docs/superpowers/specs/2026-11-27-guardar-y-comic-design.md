# Guardar, copiar y confirmar (grupo 1) y el cómic del panel (grupo 3): diseño

Fecha: 27-11-2026. Pedido de Aquiles: «necesitamos crear animación como carteles, manos que apuntan, tipo cómic o anime
[…] para crear la guía de cómo se usa»; «debemos hacer todas las piezas de todo el panel»; «parte con los grupos 1 y 3»;
«sí, opción A y el tope de 28 KB». Base: la propuesta `#propuesta`, la guía `#guia` y la maqueta `#comic` de la demo
(rama `comic`).

## Para qué

Que cada toque del dueño en el panel responda (guardar, copiar, confirmar, equivocarse en un campo) y que el panel
invite y guíe con la cara de cómic de La Mente (la mano que apunta, globos, carteles, estallidos). Y que después
**cambiar el look de todas las pantallas sea cambiar una pieza o una variable**, no cada pantalla (pregunta de Aquiles:
«si tenemos un botón y ese botón cambia, cambian todos?»).

## Lo que hay hoy

- El front (lamente-front, panel) ya usa motion-kit `v0.5.5`: `SubirImagen` (7 pantallas), `Cargando` (vía su
  `CargaPantalla`, 41), avisos (vía su `services/avisos.tsx`), `ListaViva`, `Contador`, `Interruptor`, `Stagger`,
  `GlowBorder`, `TextoCinetico`.
- El front rehízo sus piezas comunes el 27-11 (`components/Modulo.tsx`: `BotonModulo` amarillo que se hunde,
  `BotonChico`, `EncabezadoModulo`, `TarjetaItem`, `VacioModulo`), con letra de cartel en `--lmt-cartel`.
- Patrones a mano que este diseño cubre: la rueda de Chakra en 51 archivos (casi siempre dentro de un botón que guarda),
  copiar un link en 12 (`LinkPublico` en 6), 5 diálogos hechos a mano (`Confirmar`, `Pregunta`, `DialogoEnLinea`,
  `Ventana`, `ModalMiPagina`), texto de error rojo a mano en 110, `VacioModulo` en 14, `OfertaModulo` en 36.
- En la demo, la maqueta `#comic` ya tiene la mano (SVG propio, 4 tonos de piel, manga del color de la marca), el globo,
  el estallido, el cartel colgante y una guía que viaja de botón en botón.

## Enfoques (elegido: A)

- **A. Dos lugares** (elegido): el grupo 1 en `motion-kit/interfaz` (piezas básicas de todas las pantallas; tope sube de
  20 a **28 KB**, decisión de Aquiles); el grupo 3 en una entrada nueva **`motion-kit/comic`** que el front baja aparte,
  solo cuando una pantalla muestra la guía, un vacío, una oferta o una celebración (la carga del panel no sube). Los
  dibujos de `comic` sirven después para la viñeta de los bloques de la página.
- B. Todo en `interfaz` (~28 KB con los dibujos de cómic viajando con lo básico).
- C. Todo en `comic` (mezcla lo de todos los días con los dibujos).

## Metas, no metas y lo que sería fallar

**Metas:** las 4 piezas del grupo 1 y las 9 del grupo 3 (abajo), cada una con su prueba visual en el teléfono; el
encargo al front para que sus piezas propias usen estas por dentro.

**No metas:** la viñeta de los bloques de la página (va después, con los mismos dibujos); los grupos 2 y 4 de la
propuesta; juntar las copias del front (`Tarjeta` ×9 y otras: es trabajo del front, va como recomendación en el
encargo); guardar en algún lado que la guía ya se vio (lo hace el front con el aviso `alTerminar`).

**Sería fallar aunque funcione:** que guardar se sienta más lento (el «✓ Guardado» nunca bloquea seguir trabajando);
que la guía tape lo que explica o no se pueda saltar; que una pieza no se pueda usar con teclado o lector de pantalla;
que el panel cargue más al abrir porque viajan los dibujos de cómic; que la mano se vea infantil o pixelada (es el SVG de
la maqueta, aprobado: «como maqueta está bien»).

## Reglas que valen para todo

- Sin dependencias; solo `transform` y `opacity` en lo que se anima; móvil primero (44 px); con «reducir movimiento»,
  nada se sacude, salta ni gira: solo fundidos cortos; textos por defecto en español de Chile, todos cambiables.
- Colores por las variables `--mk-*` de `src/interfaz/tema.ts` (con su respaldo); la letra de cartel por
  `--mk-fuente-cartel` (respaldo `'Arial Black', 'Helvetica Neue', sans-serif`; el front la conecta a `--lmt-cartel`).
- **Un solo lugar de verdad:** cada pieza recibe `className`, `style` y lo demás de su elemento, para que el front la
  vista con su look sin copiarla. Lo que hace (estados, animación, accesibilidad) vive en la pieza; cómo se ve, en las
  variables.
- CSS armado al montarse (`estilos()`), como en `SubirImagen`, para que lo que no se usa se pueda descartar.

## Grupo 1 — en `motion-kit/interfaz`

### `BotonQueGuarda`

El mismo botón cuenta cómo va: «Guardar» → «Guardando…» (con un anillo que gira) → «✓ Guardado» (un saltito; 1,6 s) →
«Guardar». Si falla: «No se pudo» con una sacudida suave (2 s) y vuelve.

```tsx
<BotonQueGuarda alGuardar={() => guardar(datos)} className="mi-boton">Guardar</BotonQueGuarda>
```

- `alGuardar: () => Promise<unknown>`: la pieza maneja los estados con la promesa (resuelve: bien; rechaza: mal).
  También controlado: `estado?: "listo" | "guardando" | "bien" | "mal"` (si se pasa, manda).
- `textos?: Partial<{ guardando, bien, mal }>`. Mientras guarda: `aria-busy`, no se puede volver a tocar (no manda dos
  veces). El cambio de texto se anuncia (`aria-live="polite"`). El ancho no salta entre textos (mínimo el del más largo).
- Es un `<button>` con todas sus props; el look lo pone quien lo usa (el front: su amarillo que se hunde).

### `Copiar`

Copia un texto y un globo chico dice «¡Copiado!» arriba del botón (1,4 s); si el navegador no deja, «Cópialo a mano» y
selecciona el texto.

```tsx
<Copiar texto="https://lamente.cl/cami-viaja">Copiar link</Copiar>
```

- `texto`, `aviso?` («¡Copiado!»), `alCopiar?`. Usa `navigator.clipboard.writeText` y, si falla, un `textarea` escondido
  con `execCommand("copy")`. El aviso también se anuncia por una región `polite`.

### `Confirmar`

Antes de algo que no se deshace: la pregunta en un globo de cómic centrado (computador) o en una hoja desde abajo
(teléfono, con `BottomSheet`).

```tsx
<Confirmar abierto={borrando} pregunta="¿Borro la novedad?" textoSi="Sí, borrar" peligro
  alConfirmar={borrar} alCancelar={() => setBorrando(false)} />
```

- `textoNo?` («No»), `detalle?` (una línea más), `peligro?` (el botón que actúa en `--mk-mal`).
- Accesible: `role="alertdialog"`, foco en el botón seguro al abrir, foco atrapado, Escape cancela, el foco vuelve a
  quien lo abrió. El fondo se oscurece; tocarlo cancela.
- Teléfono: menos de 560 px de ancho (medido por la vista).

### `Campo`

Etiqueta, ayuda y error de un campo, con el error que se sacude una vez por cada mensaje nuevo y queda al lado.

```tsx
<Campo etiqueta="Nombre" ayuda="Como lo ven tus clientes." error={errores.nombre}>
  {(a11y) => <Input {...a11y} value={nombre} onChange={…} />}
</Campo>
```

- `children: (a11y: { id, "aria-invalid", "aria-describedby" }) => ReactNode`: sirve con cualquier control (el `Input`
  de Chakra, un `select`, un `textarea`).
- El error con `role="alert"`; el borde del control lo pone quien lo usa con `aria-invalid` (la pieza trae una regla de
  CSS para `[aria-invalid=true]` dentro del campo: borde `--mk-mal`).

## Grupo 3 — en `motion-kit/comic` (entrada nueva)

### Los dibujos de base (de la maqueta `#comic`)

- **`Mano`**: la mano de cómic que apunta (SVG propio). `direccion` (`derecha` | `izquierda` | `arriba` | `abajo`),
  `piel` (`clara` | `media` | `morena` | `oscura`), `manga` (color; por defecto `--mk-acento`), `toca` (avanza y toca,
  con sus rayitas de «¡pop!»), `ancho`. Exporta dónde queda la punta del dedo (para apuntar con precisión).
- **`Globo`**: globo de diálogo con borde grueso, sombra dura y cola (`abajo` | `arriba` | `izquierda` | `derecha`).
- **`Estallido`**: la estrella de cómic con un texto corto («¡Nuevo!»); la letra se ajusta a la palabra más larga; late.
- **`Colgante`**: cartel que cuelga de dos cuerdas y se mece; `quieto` lo deja quieto tras mecerse al llegar.

### `Vacio`

La sección vacía que invita: ícono (lo pone quien la usa), título, texto y la acción; la mano apunta y toca la acción.

```tsx
<Vacio icono={<Lista />} titulo="Todavía no tienes listas de precios." texto="…" accion={<button>Nueva lista</button>} />
```

En el teléfono la mano apunta desde arriba (hacia abajo) para no apretar la fila.

### `Oferta`

La oferta de un módulo que el negocio no tiene: un `Estallido` que late («¡30 días gratis!»), el contenido y la acción
con la mano que la toca.

### `Guia`

La guía que recorre el panel: la mano viaja a cada elemento, lo toca y un globo explica; el resto se oscurece.

```tsx
<Guia abierta={verGuia} pasos={[
  { objetivo: '[data-soporte="panel.pagina.editarDiseno"]', texto: "Aquí cambias colores y letras." },
  { objetivo: '[data-soporte="panel.pagina.publicar"]', texto: "¿Lista? ¡Publica!" },
]} alTerminar={marcarVista} alSaltar={marcarVista} />
```

- Cada paso apunta a un selector (las marcas de soporte que el panel ya tiene). Si un paso no encuentra su elemento, se
  salta (no se queda pegado).
- Lleva el elemento a la vista, pone la mano donde quepa (a la izquierda apuntando a la derecha; si no cabe, debajo
  apuntando arriba; si no, encima apuntando abajo) y el globo donde no tape (abajo; si no cabe, arriba). Se vuelve a
  ubicar al cambiar el tamaño, al hacer scroll y si el elemento se mueve.
- El foco: un recorte alrededor del elemento con la sombra que oscurece el resto (solo `transform` para moverse).
- Globo con «Atrás», «Siguiente» / «¡Listo!» y «Saltar»; «Paso 2 de 4». `role="dialog"`, foco en «Siguiente», Escape
  salta, las flechas pasan de paso. Mientras está abierta, el elemento señalado sigue tocable (se puede hacer lo que
  dice).
- Se dibuja en un portal sobre todo (`z-index` alto); el oscuro cubre la ventana.

### `CartelNovedad`

Un `Colgante` que aparece junto a algo (la campana) con un texto corto («¡Nuevo!»), se mece al llegar y queda quieto;
tocarlo llama `alTocar`.

### `Celebrar`

Un estallido grande («¡Publicada!») con confeti (el `Confeti` de los momentos) sobre todo, 2,5 s, sin tapar los
botones (no recibe toques). `useCelebrar()` devuelve `celebrar(texto)` para llamarlo desde cualquier parte; necesita un
`CelebrarProvider` arriba (o se monta solo la primera vez).

## Pesos

- `motion-kit/interfaz`: tope **28 KB** (decisión de Aquiles, 27-11). Usos nuevos medidos: `{ BotonQueGuarda }` < 2 KB,
  `{ Copiar }` < 1,5, `{ Confirmar }` < 4 (lleva `BottomSheet`), `{ Campo }` < 1,5. `{ Accordion, CountUp }` sigue bajo 5.
- `motion-kit/comic`: entrada nueva, tope propuesto **14 KB**. Usos: `{ Mano }` < 3, `{ Guia }` < 7 (lleva `Mano` y
  `Globo`), `{ Vacio }` < 4, `{ Celebrar }` < 4.
- `motion-kit` (todo) va en 87,6 de 90: con estas piezas lo pasa. Su tope lo decide Aquiles (ver «Para Aquiles»).

## Cómo se prueba

- Calculables (`node:test`): los estados del botón con una promesa que resuelve y otra que rechaza (con relojes
  falsos); dónde va la mano y el globo en la guía para un elemento en cada borde de la ventana; la letra del estallido
  por largo de palabra; que `Campo` sacuda solo con un mensaje nuevo.
- Vitrina `#comic` (pasa de maqueta a vitrina de las piezas reales) y `#panel` (las del grupo 1); prueba visual
  `scripts/verificar-comic.mjs` (partes `boton`, `copiar`, `confirmar`, `campo`, `dibujos`, `vacio`, `guia`,
  `celebrar`), teléfono y escritorio, con el motor de Safari, y capturas mirando que se note. Teclado y lector en cada
  una.
- `probar-paquete`: un panel que importa `BotonQueGuarda` de `interfaz` y `Guia` de `comic`, sin nada pesado.

## El encargo al front (al publicar)

- Que `BotonModulo` y `BotonChico` usen `BotonQueGuarda` por dentro donde guardan (cambia en las 51 pantallas con rueda
  de una vez); `LinkPublico` use `Copiar`; los 5 diálogos sean `Confirmar`; sus campos usen `Campo`.
- `VacioModulo` use `Vacio`; `OfertaModulo`, `Oferta`; la campana, `CartelNovedad`; «Publicar cambios», `Celebrar`.
- La guía: los pasos con las marcas de soporte que ya existen; recordar que se vio.
- Recomendación: juntar las copias (`Tarjeta` ×9, `Seccion` ×8, `Formulario` ×6, `Campo` ×4, `Selector` ×3) en una
  sola pieza cada una, para que cambiar el look sea cambiar un lugar.

## Decisiones de Aquiles (27-11-2026: «1 sí, 2 sí, 3 lo recomendado»)

- El tope de `motion-kit` (todo) sube de 90 a **105 KB** (nadie en La Mente importa el paquete entero).
- El tope de la entrada nueva `motion-kit/comic`: **14 KB**.
- La versión: **`v0.6.0`** (una entrada nueva); antes de la etiqueta, la batería completa (`--todo`).
- Diseño aprobado con estas decisiones.

## Lo que resolvió la revisión del diseño (27-11)

Decidido por el constructor (Aquiles puede corregirlo):

- **Pesos:** se mide primero cada pieza; si algo no cabe en su tope, se pregunta antes de tocarlo.
- **`Celebrar`** reusa `Confeti` solo si no arrastra nada de `momentos` (se mide); si arrastra, un confeti mínimo propio
  dentro de `comic`. Se monta solo en un portal (sin proveedor obligatorio; `CelebrarProvider` opcional). Dos llamadas
  seguidas: la nueva reemplaza a la anterior. Con «reducir movimiento», sin confeti: el estallido con un fundido.
- **`Confirmar`:** su propia lógica de foco (la del `Confirmar` del front sirve de modelo): `role="alertdialog"`, foco en
  el botón seguro, foco atrapado, Escape cancela, el foco vuelve a lo que estaba enfocado al abrir. En el teléfono usa
  `BottomSheet` con props nuevas que no rompen a nadie (`rol`, `focoInicial`), con `pregunta` como su `label`. Suma
  `ocupado` (mientras actúa: rueda en el botón, Escape y el fondo no cierran) y `children` para contenido libre (además
  de `detalle`). El front adapta su `Confirmar` para que use este por dentro.
- **`BotonQueGuarda`:** limpia sus relojes al desmontarse; en «✓ Guardado» y en «No se pudo» se puede volver a tocar;
  con `estado` controlado, `alGuardar` igual se llama. El saltito y la sacudida van con la propiedad `translate`/`scale`
  sueltas (no `transform`), así conviven con el botón del front que se hunde con `transform`.
- **La letra de cartel:** un ayudante en `tema.ts` (`fuenteCartel()` → `var(--mk-fuente-cartel,'Arial Black',…)`). El
  cómic reusa los colores que ya hay: tinta = `texto`, relleno = `superficie`, amarillo = el de la maqueta como respaldo
  de `--mk-cartel` (nueva, opcional); la piel y la manga son props de `Mano`.
- **`Guia`:** el objetivo es un selector cualquiera (no da por hecho `data-soporte`). Un elemento oculto o sin caja se
  salta; si no aparece, se reintenta 1,5 s antes de saltarlo. Si todos se saltan, llama `alTerminar`. El oscuro son
  cuatro paneles alrededor del recorte, así el elemento señalado sigue tocable. La geometría (dónde va la mano y el
  globo) es una función pura con su prueba.
- **`Oferta`:** el mismo molde que `Vacio`: `destacado` (el texto del estallido), `children` (lo que el front ya tiene,
  por ejemplo su `TarjetaModulo`) y `accion` opcional. El texto lo pone el front con los datos del módulo.
- **`CartelNovedad`:** el ancla es su hijo (`<CartelNovedad texto="¡Nuevo!"><Campana /></CartelNovedad>`).
- **`Vacio`:** la mano toca una vez cuando la sección entra en pantalla y después queda quieta apuntando; la acción
  puede ser botón o enlace.
- **`Mano`:** exporta `PUNTA_MANO`, la punta del dedo por dirección, en fracción del ancho.
- **Lo que no listaba:** entrada `src/entradas/comic.ts`, `./comic` en `exports` de `package.json`, `ENTRADAS` y
  `TOPES_KB` en `medir-paquete.mjs`, `probar-paquete`, la regla en `verificar-cambios.mjs`, `#comic` en la pasada
  rápida y `CLAUDE.md`. La maqueta `#comic` pasa a vitrina de las piezas reales; `#propuesta` y `#guia` quedan como están.
- **Rama:** se sigue en `comic` (como `interfaz` en la tanda anterior) y pasa a `dev` con la orden de Aquiles.

## Lo que queda al constructor

Los tiempos y curvas exactos dentro de lo dicho, los íconos del anillo y del ✓ (SVG propios), el dibujo fino de la mano
(partiendo de la maqueta), y cómo se ven las vitrinas, mientras se note a la primera en un teléfono.
