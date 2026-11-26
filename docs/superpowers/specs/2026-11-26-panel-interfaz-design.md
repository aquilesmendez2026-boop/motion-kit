# Panel con vida: imágenes, avisos, cargas y lo que llega (diseño)

Fecha: 26-11-2026. Pedido de Aquiles: «debemos mejorar toda la visual de La Mente», «sí, parte con el grupo 1 y 2,
mejoremos lo de las imágenes», «sí, opción A y en ese orden».

## Para qué

El panel de cada negocio (`lamente-front/fronts/panel`, ~90 pantallas en Chakra) se ve plano: textos, tablas, ruedas
de carga y recuadros grises. Lo usa el dueño todos los días. Queremos que se sienta vivo y claro en lo que más usa:
subir sus fotos, saber que algo se guardó o falló, esperar que cargue y ver lo que le llega (pedidos, reservas).

motion-kit pone las piezas, en la entrada liviana `motion-kit/interfaz`; el front las conecta con un encargo (los repos
de La Mente se leen, no se tocan desde aquí).

## Lo que hay hoy

- **Imágenes:** cada pantalla arma su propia subida (`EditorDiseno`, `ContenidoPagina` «1. Tu imagen», `Galeria`,
  `EditorProducto`, `editarLista/Contenido`, `agente/Material`, `estudio/EditorEncabezado`): un recuadro gris punteado
  o una miniatura de 64 px y un botón con un `<input type="file">` escondido. No se puede arrastrar, no se ve que sube,
  no confirma que quedó y el error («pesa más de 2 MB») es texto chico.
- **Cargas:** 60 pantallas muestran un `Spinner`. **Avisos:** una sola pantalla usa avisos.
- **Lo que llega:** «Ahora» (pedidos) es una lista de textos con un interruptor de Chakra para abrir y cerrar.
- **En motion-kit:** `Toast` (claro fijo, `#f1f1f6`), `BottomSheet` (oscuro fijo, `#1b1b2b`), `TabBar` (acento fijo
  `#7c5cff` si no se pasa) y `Skeleton` (gris con brillo blanco) no toman el tema. Nadie fuera de la demo los usa hoy:
  cambiarles los colores no rompe nada en La Mente. `Presencia`, `CountUp`, `Pressable` y `Ripple` ya existen.

## Enfoques (elegido: A)

- **A. Piezas completas en `motion-kit/interfaz`** (elegido): cada pieza con su movimiento, su accesibilidad y sus
  colores del tema por variables; el front las conecta. Todo se ve y se mueve igual en todas las pantallas y se prueba
  aquí.
- **B. Solo los efectos sueltos** (aparecer, latir, sacudir) y el front arma los recuadros con Chakra: más liviano
  aquí, pero cada pantalla queda distinta (lo que pasa hoy con las imágenes).
- Escribir directo en el front: descartado (regla del repo).

## Metas, no metas y lo que sería fallar

**Metas:** las cuatro partes de abajo, en ese orden; cada una usable sola.

**No metas:** subir varias fotos a la vez (la galería pone una `SubirImagen` como recuadro «agregar»); recortar la
foto; el modo oscuro del panel más allá de leer las variables (el front las define en los dos modos); `Modal`,
`SwipeRow`, gráficos y la grilla del Resumen (grupos siguientes); sonidos (el front puede llamar los de motion-kit si
quiere); tocar el `Navbar` (no está en esta entrada).

**Sería fallar aunque funcione:** que el panel se sienta más lento (una animación que hace esperar, un esqueleto que
parpadea en cargas de 100 ms); que algo se mueva sin que el dueño haya hecho nada, salvo lo que llega; que una pieza
no se pueda usar con teclado o lector de pantalla; que el panel con `{ Accordion, CountUp }` deje de pesar menos de
5 KB.

## Reglas que valen para todo

- Sin dependencias; solo `transform` y `opacity` en lo que se anima (el borde que se ilumina al arrastrar es un cambio
  de color de una vez, no una animación por cuadro); móvil primero (toques de 44 px); con «reducir movimiento», solo
  fundidos cortos y nada que se sacuda, lata ni gire; español de Chile en textos por defecto (todos cambiables).
- Cada pieza pone su CSS al montarse (`useStyles`), como las demás de la entrada.
- No cambia ningún contrato. `motion-kit` (la entrada principal) también exporta las piezas nuevas.

## 1. Los colores del panel

Las piezas de `motion-kit/interfaz` leen estas variables (con respaldo `--lm-*` donde ya existe; ver «Lo que resolvió
la revisión») y después un valor claro:

| Variable | Para qué | Respaldo final |
|---|---|---|
| `--mk-fondo` | fondo de la página | `#ffffff` |
| `--mk-superficie` | recuadros, avisos, hojas | `#ffffff` |
| `--mk-texto` | texto | `#1c1a22` |
| `--mk-suave` | texto de ayuda | `#5e5a68` |
| `--mk-borde` | bordes | `#e7e1d8` |
| `--mk-acento` | acción, foco, destello | `#7c5cff` |
| `--mk-sobre-acento` | texto sobre el acento | `#ffffff` |
| `--mk-bien` | guardado, listo, abierto | `#1f9d55` |
| `--mk-mal` | error, cerrado | `#d64545` |

(`--mk-acento`, `--mk-fondo`, `--mk-superficie`, `--mk-texto` y `--mk-sobre-acento` ya existen en el kit con el mismo
sentido; se suman `--mk-suave`, `--mk-borde`, `--mk-bien` y `--mk-mal`. Corregido el 26-11 tras la revisión: decía
`--mk-acento-texto`, que en el kit es «el acento usado como texto».)

- `Toast`, `BottomSheet`, `TabBar` y `Skeleton` pasan a estas variables. `TabBar` sigue aceptando `accent` (si se pasa,
  gana). **Cambia cómo se ven** `BottomSheet` (de oscuro a superficie del tema) y `Toast` (sombra más suave): va en el
  CHANGELOG.
- Un archivo `src/interfaz/tema.ts` con la lista de variables y una función `variablesTema(t: Partial<TemaInterfaz>)`
  que devuelve el objeto de estilo (`{ "--mk-acento": … }`), para quien no quiera escribir CSS.
- En el encargo al front va el CSS de ejemplo que conecta los tokens de Chakra (`fondo`, `superficie`, `tinta`,
  `tintaSuave`, `borde` y el violeta) con estas variables, en claro y oscuro.

## 2. `SubirImagen`

Un recuadro para elegir una foto, que muestra todo el viaje: vacío → arrastrando → subiendo → lista, o error.

```
┌─────────────────┐   vacío: ícono, «Arrastra una foto o toca para elegir», la ayuda abajo
│   ⬆  Arrastra   │   arrastrando encima: el borde y el fondo toman el acento
│   o toca para   │   subiendo: la foto elegida ya se ve (vista local), atenuada, con un anillo de avance
│   elegir        │   lista: la foto entra con un revelado y un ✓ breve (0,8 s); «Cambiar» y «Quitar» sobre ella
└─────────────────┘   error: sacudida suave (0,3 s), borde --mk-mal y el mensaje en rojo
```

**Uso (el front sube; la pieza muestra):**

```tsx
<SubirImagen
  etiqueta="Logo" ayuda="PNG, JPG o WebP, hasta 2 MB." forma="redonda"
  imagen={logoUrl} subiendo={subiendoLogo} error={errorLogo}
  alElegir={(archivo) => subirLogo(archivo)} alQuitar={() => quitarLogo()}
/>
```

- `forma`: `"redonda"` (logo, 112 px), `"cuadrada"` (producto, 160 px) o `"apaisada"` (portada, ancho completo hasta
  480 px, 16:9). Por defecto `"cuadrada"`.
- `imagen?: string`: la foto que ya está (URL). `subiendo?: boolean | number`: `true` = sin porcentaje (el anillo gira
  lento), `0`–`1` = avance. `error?: string`: lo pone el front (falló la subida); la pieza sacude y lo muestra.
- `alElegir(archivo: File)`: solo se llama con un archivo válido. Antes, la pieza revisa `aceptar` (por defecto
  `image/png,image/jpeg,image/webp`) y `maxMB` (por defecto 2): si no cumple, muestra su propio error («Esa foto pesa
  3,4 MB: el máximo es 2.» / «Ese archivo no es una foto PNG, JPG o WebP.») y no llama.
- Vista local: al elegir, muestra la foto al tiro con `URL.createObjectURL` mientras sube; la suelta al llegar la
  `imagen` nueva, al fallar o al desmontarse. El ✓ sale cuando `subiendo` pasa a falso sin `error`.
- `alQuitar?`: si no se pasa, no hay «Quitar». `deshabilitada?`. Textos cambiables: `textos?: Partial<{ elegir,
  arrastrar, cambiar, quitar, listo }>`.
- Accesible: un `<input type="file">` real con su `<label>` (el recuadro entero), foco visible, `aria-busy` mientras
  sube, el error con `role="alert"`, el ✓ anunciado («Foto lista») por una región `polite`.
- Con «reducir movimiento»: sin sacudida (solo el borde rojo), el anillo sin girar (muestra el avance o un punto
  suspensivo), revelado como fundido.
- En el celular, tocar abre el selector del teléfono (cámara o fotos, lo decide el teléfono).

## 3. Avisos y cargas

**Avisos (`Toast`):** la misma pieza, con más:

- `toast("Guardado", { tipo: "bien" })`: `tipo` `"bien"` (✓, `--mk-bien`), `"mal"` (!, `--mk-mal`) o `"info"` (por
  defecto, sin ícono de color). Lo de hoy (`toast("Guardado")`) sigue igual.
- `accion?: { texto: string; alHacer: () => void }`: un botón dentro del aviso («Deshacer»); con acción, dura 6 s.
- Se cierra deslizándolo hacia el lado (más de 80 px o un tirón rápido) o tocando la ×; ya no se cierra al tocar todo
  el aviso (se podía cerrar sin querer al tocar la acción).
- Los de `"mal"` van en una región `assertive`; los demás, `polite`. Pausa la cuenta mientras el dedo o el mouse está
  encima o tiene el foco.

**Esqueletos:**

- `Skeleton` toma el color del texto al 10 % (`color-mix`) con su brillo, sobre cualquier fondo.
- `Cargando` (nuevo): `<Cargando listo={!!datos} forma="tabla" cuantos={5}>{contenido}</Cargando>`. Muestra el
  esqueleto con la forma pedida mientras `listo` es falso y cambia al contenido con un fundido. Si carga en menos de
  150 ms, no muestra el esqueleto (no parpadea); si ya lo mostró, lo deja al menos 300 ms.
- `forma`: `"texto"` (renglones de distinto largo), `"fila"` (círculo + dos renglones), `"tarjeta"` (foto + renglones),
  `"tabla"` (encabezado + filas) o `"foto"`. `cuantos` repite la forma (por defecto 3). `aria-busy` en el contenedor y
  un texto escondido «Cargando…».

## 4. Lo que llega

- **`ListaViva`** (nuevo): `<ListaViva>{pedidos.map((p) => <div key={p.id}>…</div>)}</ListaViva>`. Lo que aparece
  después de la primera vez entra deslizándose con un destello del acento (un halo que se apaga en 1,2 s); lo que
  cambia de lugar (un pedido que pasa a «listo» y se reordena) se mueve a su lugar nuevo (FLIP); lo que sale se va con
  un fundido y la lista se cierra sin saltos. La primera carga no se anima (todo ya estaba). Por clave (`key`) de los
  hijos. `destello?: boolean` (por defecto sí). Sin «reducir movimiento»: sin deslizar ni mover, solo un fundido.
- **`Contador`** (nuevo): un número en una insignia (`<Contador valor={pendientes} />`) que late (escala 1 → 1,18 → 1,
  0,4 s) cuando el valor sube; al bajar, solo cambia. `max?` (por defecto 99, muestra «99+»). `etiqueta` para el
  lector («3 pedidos pendientes»). Sin latido con «reducir movimiento».
- **`Interruptor`** (nuevo): un interruptor accesible (`role="switch"`, `aria-checked`, espacio y enter) con la perilla
  que corre con resorte y se achata un poco al apretar; encendido toma `--mk-bien`, apagado el borde.
  `textos?: [apagado, encendido]` (p. ej. «Cerrado» / «Abierto») al lado. 44 px de alto para el dedo.

## Pesos

- `{ Accordion, CountUp }` sigue bajo 5 KB (no puede subir: las piezas nuevas van en sus propios archivos fuente y no
  las importan).
- Usos nuevos medidos en `npm run peso` con su tope: `{ SubirImagen }` < 4 KB, `{ ToastProvider, useToast }` < 3,1 (era 3; subido tras los arreglos de la revisión, decisión de Aquiles del 26-11),
  `{ Cargando }` < 2, `{ ListaViva, Contador, Interruptor }` < 4.
- La entrada entera hoy pesa 11,8 KB (tope 14, propuesto el 25-11). Con todo esto se estima en 17–19 KB: el tope tiene
  que subir y lo decide Aquiles (ver «Para Aquiles»).

## Cómo se prueba

- Calculables (`node:test`): la revisión del archivo (tipo, tamaño, mensajes con el peso en «3,4 MB»); qué entra, sale
  y se mueve en `ListaViva` comparando claves; cuándo un deslizamiento cierra un aviso; cuándo `Cargando` muestra o
  no el esqueleto (los 150 y 300 ms); `variablesTema`.
- Vitrina nueva `#panel` en la demo: un panel de ejemplo con los colores de La Mente (crema, tinta, violeta; y su
  versión oscura), las tres formas de `SubirImagen` (con una subida de mentira que avanza y otra que falla), avisos de
  los tres tipos con «Deshacer», `Cargando` con cada forma y un «Ahora» de pedidos donde llegan y cambian de estado.
- Prueba visual `scripts/verificar-panel.mjs` (partes `tema`, `imagen`, `avisos`, `cargando`, `llega`), en el
  teléfono y en escritorio, con capturas; también con el motor de Safari. Se suma a `verificar-cambios.mjs` (lo de
  `src/interfaz/` y las piezas tocadas → `panel`) y `#panel` a `humo.mjs`.
- `probar-paquete`: un panel instalado que importa `SubirImagen` y `useToast` desde `motion-kit/interfaz`, sin nada
  pesado.

## Orden de trabajo

En la rama `interfaz` (donde está la entrada, sin commit todavía), por partes y en este orden: colores → `SubirImagen`
→ avisos y cargas → lo que llega. Al final: revisión de toda la rama en Opus, documentación (catálogo, CHANGELOG,
README) y el encargo al front con dónde va cada pieza (las 7 pantallas de imágenes, los `Spinner` → `Cargando`, los
avisos al guardar y borrar, «Ahora» con `ListaViva`, `Contador` e `Interruptor`) y el CSS de los colores. Commit, push
y etiqueta, solo con la orden de Aquiles.

## Para Aquiles

- El tope de la entrada `motion-kit/interfaz`: **20 KB** (decisión de Aquiles del 26-11-2026: «sí, apruebo el diseño y
  el tope de 20 KB»). Diseño aprobado el mismo día.

## Lo que resolvió la revisión del diseño (26-11)

Respondido por el proyecto:

- **Cómo llega al panel:** el front instala motion-kit desde GitHub con una etiqueta (`packages/ui/package.json`, hoy
  `#v0.5.2`); el panel lo usa por `services/motionKitPanel.tsx`. Las piezas llegan con una etiqueta nueva y el encargo
  le pide al front subir la versión y cambiar `import("motion-kit")` por `motion-kit/interfaz`.

Decidido por el constructor (mi criterio; Aquiles puede corregirlo):

- **Variables:** respaldo `--lm-*` solo donde ya existe (`acento`, `fondo`, `superficie`); las nuevas, directo al valor
  claro. En las piezas de interfaz, la superficie cae a `#ffffff`. El panel no define hoy ninguna variable: hasta que
  el front conecte el CSS del encargo, todo se ve con los respaldos claros (que ya son los del panel).
- **Error de `SubirImagen`:** el error propio se borra al elegir otro archivo; el `error` del front manda mientras
  exista; la sacudida sale solo cuando el texto del error cambia a uno nuevo. El encargo le pide al front quitar su
  revisión de 2 MB (para no repetir el mensaje) y cambiar sus funciones a recibir un `File`.
- **«Quitar»:** opcional; el front lo conecta solo donde su backend ya permite borrar. La vista local se suelta siempre
  dentro de la pieza (también al desmontarse, para la galería).
- **Aviso:** deja de ser un `<button>` entero: un recuadro con el botón ×, y el de la acción si hay. Las dos regiones
  (`polite` y `assertive`) se montan desde el principio. Un aviso con acción no lo saca uno nuevo (se muestran hasta
  cuatro si alguno tiene acción). La cuenta se puede pausar (mouse, dedo o foco encima). El deslizamiento usa
  `touch-action: pan-y` para no pelear con el scroll.
- **`Cargando`:** solo la primera carga muestra el esqueleto; si `listo` vuelve a falso (al refrescar), el contenido se
  queda (no parpadea). Si al montar ya está listo, no hay esqueleto ni fundido. El «Cargando…» escondido va una sola
  vez (con `aria-busy`, sin repetir el anuncio).
- **`ListaViva`:** los hijos tienen que ser elementos con `key` (sin clave, no anima; queda documentado). La primera
  lista no vacía cuenta como la primera carga (los datos que llegan tarde no entran todos animados). Lo que sale sigue
  ocupando su lugar mientras se desvanece y después la lista se cierra con FLIP. Es pieza nueva (no usa `Presencia`).
- **`Interruptor`:** área para el dedo de al menos 44 × 44 px.
- **Piezas existentes:** las pruebas visuales de `piezas` (y la demo) se ajustan a los colores nuevos de
  `BottomSheet`, `Toast` y `Skeleton`. `color-mix` pide Safari 16.2 o más nuevo (el mismo piso que ya usa el kit).
- `variablesTema` y `TemaInterfaz` se exportan desde `motion-kit/interfaz` y desde `motion-kit`.

## Lo que queda al constructor

Los tiempos y curvas exactos dentro de lo dicho, los íconos (SVG propios, sin librerías), el dibujo de cada forma del
esqueleto y cómo se ve la vitrina, mientras se note en un teléfono a la primera (mirar capturas).
