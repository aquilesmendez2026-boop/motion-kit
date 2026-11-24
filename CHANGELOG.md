# Cambios

## 0.3.0 (24-11-2026)

Receta del encabezado v2, relatos y receta de página, momentos por bloque, fotos vivas y dedo y física. La Mente
copia los contratos de esta etiqueta (`contrato/*.json`).

### Dedo y física (nueve efectos)

- **Receta del encabezado (v2, sin versión nueva):** campos `iman` y `colgante` (este solo con la composición
  `letrero`; con otra queda apagado y avisa); `efectoTexto` suma `descifrar`; `efecto` suma `granos`, `tijeras`,
  `huellas`, `pesas`, `lapices` y `constelacion`; `shader` suma `lava`. `Encabezado` suma las props `iman` y `colgante`.
- **Receta de página (v1, sin versión nueva):** `relato` suma `pila`, `relatoPagina` suma `impulso` y hay un campo
  nuevo, `estela`. `PaginaRelato` suma la prop `estela`. Los dos contratos están regenerados.
- **Cartas apiladas**, **texto que se descifra**, **letras con imán**, **letrero colgante**, **inclinación por
  velocidad**, **objetos del rubro que caen** (con física propia), **constelación**, **lámpara de lava** y **estela y
  chispas**. Todos se bajan aparte y solo corren en nivel completo; en liviano o con movimiento reducido quedan
  quietos o no se montan.
- Para sitios con CSP, el CSS de lo nuevo viaja en `estilos-encabezado.css` y `estilos-pagina.css`.
- Prueba nueva: `scripts/verificar-dedo.mjs [url] [parte]`. Su parte `limpieza` revisa que al salir no queden bucles,
  oyentes ni lienzos.
- Pesos al cargar (gzip): principal 78,8 KB, encabezado 33,4, página 15,4, momentos 11,9, escena 14,4 y receta 9,5.
  Ningún tope cambió.

### Arreglos

- **Shaders (`ShaderFondo`):** al volver a montarse (al cambiar de shader, o siempre en el modo estricto de React en
  desarrollo) el fondo quedaba de un color parejo, porque el programa nuevo no recibía el tamaño del lienzo.
- **Shaders:** piden precisión alta cuando el teléfono la tiene. Con la media, en muchos teléfonos el fondo se veía
  trabado al poco rato.
- **Peso:** `motion-kit/pagina` ya no carga el componente `Estilo` solo por leer su contexto (queda en 15,4 KB aun
  con lo nuevo; antes medía 16,6).
- **Revisión final de «dedo y física»** (2 críticos, 4 importantes y 11 menores, todos resueltos): las cartas apiladas
  ya no saltan al hacer clic con el mouse (se despegan solo con el foco del teclado); apretar un botón del letrero
  colgante no lo balancea, y el letrero queda quieto con el cursor encima; el scroll lo ladea con tope y solo si se ve;
  el imán deja de calcular con el cursor quieto, mueve letras también en los títulos por palabra y mide de nuevo al
  despertar; un título que cambia a mitad del descifrado queda con el texto nuevo; las chispas salen con un toque y no
  al empezar a bajar; la constelación dibuja a 30 por segundo; los lienzos sueltan su memoria al salir.
- **Pruebas:** la medida de «sin scroll horizontal» a 360 px estaba ciega en modo teléfono (restaba `innerWidth`, que
  crece junto con lo que se sale) en `verificar-efectos`, `-encabezados`, `-estilos` y `-piezas`. Ahora mide contra el
  ancho fijo del teléfono.

### Fotos vivas

- **Receta v2: campo nuevo `fotoViva`** (y en el contrato). Solo en las composiciones con foto; no cuenta como
  protagonista. `Encabezado` suma las props `fotoViva` y `origenesFotos`.
- **Foto viva del encabezado** (WebGL a mano, se baja aparte): la foto se arma desde partículas al entrar (una vez por
  carga, y no si hay apertura), ondula bajo el dedo o el cursor y, con varias tomas, cambia con un borde líquido.
  Respeta el tratamiento de foto y la profundidad. Solo en nivel completo.
- **Galería (`MosaicoQueSeArma`)**: `viva` (la foto que se toca ondula, con un solo lienzo que pasa de foto en foto) y
  `visor` (un toque abre la foto, que crece hasta llenar la pantalla; diálogo con Anterior, Siguiente y Cerrar, flechas,
  Escape y gestos). Los gestos, el motor y el visor se bajan aparte con el primer toque.
- **Fotos de otros sitios:** el motor solo pide la textura al mismo sitio, a `data:`/`blob:` y a los orígenes de
  `origenesFotos`; si el servidor no da permiso CORS, queda la foto normal. A lo más dos lienzos WebGL por página.
- Prueba nueva: `scripts/verificar-fotos.mjs`.

### Momentos por bloque (primera tanda)

- Entrada nueva **`motion-kit/momentos`** (11,9 KB gzip al cargar, tope 12; el sorteo, el antes y después, el confeti
  y lo de las fotos vivas se bajan aparte, y si no bajan la página sigue) y su CSS en archivo,
  `motion-kit/estilos-momentos.css`. La entrada exporta las piezas, `useMomento`, el resorte, `faltaPara` y los
  formatos de Chile; los cálculos internos no son parte del paquete.
- El efecto propio de cada bloque de La Mente, con los datos del bloque: `SellosEstampa`, `ResenasPila`,
  `CartaQueSeAbre`, `PrecioQueRueda`, `CuentaRegresiva` (hora del negocio, cambio de hora incluido), `MapaDibujado`,
  `MosaicoQueSeArma`, `AntesDespues` y `SorteoRaspe` (con `Confeti`).
- **Resorte** con curva CSS `linear()` y uno por estilo (`resorte`, `RESORTES_DE_ESTILO`); retro va por pasos.
- Tres niveles (completo, liviano, quieto), texto legible desde el primer cuadro y colores de La Mente (`--lm-*`)
  cuando no hay `Estilo` alrededor.
- **No se exportan desde la entrada principal** `motion-kit` (está en su tope): se importan de `motion-kit/momentos`.

### Encabezado de película (receta v2)

- **Receta v2** (acepta la v1 y la guarda como v2; contrato con `versiones: [1, 2]`): apertura, tomas, foto en las
  letras, tratamiento, estado, palabras que rotan, hora del día, `shader`, `objeto`, `logo` y `nombre`; salidas
  `barra` y `telon`. Protagonista: tomas, fondo animado (efecto o shader, uno solo), palabras, título y luz.
- **Apertura** de película una vez por sesión; **varias tomas** con acercamiento lento; **palabras que rotan** en la
  palabra resaltada, con el ancho reservado.
- **Barra al bajar** (logo o nombre y el mismo botón principal, `inert` mientras se ve el encabezado; `barraPropia`
  para La Mente) y **telón** al bajar.
- **Estado del negocio** (abierto, cerrado, próxima hora libre) con los datos que pasa quien dibuja.
- **Foto dentro de las letras** (con contorno; sin foto o si no carga, el título queda con su color), **tratamiento de
  foto** (duotono, grano, trama, blanco y negro) y **hora del día**.
- **Colores desde la foto**: `paletaDeFoto` propone paleta y tema de La Mente (solo en `motion-kit`, es del editor).
- Shader, objeto 3D y video se cargan aparte con `import()`: `motion-kit/encabezado` queda en 33,7 KB gzip.

### Cambios que pueden romper

- Los medidores del editor (`MedidorPeso`, `MedidorFluidez`, `MedidorCarga`, `SemaforoContraste` y lo de `peso` y
  `calidad`) ya no salen por la entrada principal `motion-kit`: se importan de `motion-kit/escena`, donde ya estaban.
  Libera espacio en la entrada principal (decisión de Aquiles, 23-11).
- `contratoEncabezado`/`textoContrato` ya no salen de `motion-kit/receta` ni de `motion-kit/encabezado`, y
  `contratoPagina`/`textoContratoPagina` no salen de `motion-kit/pagina`: son herramientas de desarrollo y quedan solo en
  `motion-kit`. Lo que usa La Mente son los archivos `contrato/*.json`.
- `paletaDeFoto` está solo en `motion-kit` (es del editor).
- Receta: `palabras` son de 1 a 3 alternativas a la palabra resaltada (antes se pedían 2 o más); `tomas` solo se guardan
  en composiciones con foto.

### Relatos

- **Relatos** (`motion-kit/pagina`): nueve maneras de contar la página al bajar. De bloque: Escenas que aparecen,
  Película continua, Cuento por capítulos, Profundidad, Iris, Carrete y Subtítulos; de página: Hilo y Luz que cambia.
  CSS con animaciones ligadas al scroll (`animation-timeline`), respaldo propio con un solo `IntersectionObserver`, niveles
  completo, liviano y quieto, y movimiento base con el sabor de cada estilo (entrada y cursor sobre las tarjetas).
- `<PaginaRelato>`, `<Relato>` y `<FraseRelato>`. Los bloques marcan sus partes con `data-mk-parte` (`linea`, `foto`,
  `tarjeta`, `frase`); sin las marcas que pide su relato, un bloque se cuenta como Escenas.
- **Receta de página v1**: `validarPagina`, `normalizarPagina`, `relatoDeBloque` y el contrato
  `contrato/pagina-motionkit.json`.
- `motion-kit/estilos-pagina.css` (2,5 KB gzip) para usar con `sinInyectarEstilos()`.
- Demos `#relatos` y `#pagina` (con QR); `scripts/verificar-relatos.mjs`.

- **Biblioteca de diseños** (paso 4): `DisenoBiblioteca` con nombre, rubro, etiquetas, estado (borrador, aprobado,
  archivado), autor, receta y tema/paleta de La Mente para verlo igual; `validarDiseno`, `crearDiseno`, `editarDiseno`,
  `duplicarDiseno`, `filtrarDisenos`, `exportarBiblioteca` e `importarBiblioteca` (gana la edición más nueva; lo que no
  sirve se informa en español) y `almacenLocal()` detrás de la interfaz `AlmacenBiblioteca`, que en el paso 5 se cambia
  por la API de La Mente. Misma forma que la tabla que tendrá La Mente.
- Demo `#biblioteca`: miniaturas con el encabezado de verdad (quieto), filtros, aprobar, archivar, duplicar, borrar con
  confirmación, exportar e importar `.json`, y 10 ejemplos por rubro. El editor guarda en la biblioteca, abre un diseño
  con `#encabezados?id=…` y, si se cambia uno aprobado, vuelve a borrador. `scripts/verificar-biblioteca.mjs`.
- El editor conserva los `href` de los botones de una receta abierta y solo guarda `mover` si no es el de siempre.

### Peso

La biblioteca está solo en `motion-kit` (no en `encabezado` ni `receta`): suma unos 2 KB gzip.

`motion-kit/pagina`: 15,8 KB gzip sola; sobre el encabezado suma unos 7,5 KB. Topes (con «hace todo» de Aquiles):
`pagina` 17 KB y `motion-kit` 80 KB (era 70; con los relatos y la biblioteca mide 72,7).

## 0.2.0 (23-11-2026)

Lo que hace falta para que La Mente guarde y dibuje encabezados de motion-kit.

### Nuevo

- **Receta del encabezado v1** (`motion-kit/receta`): `RecetaEncabezado`, `validarReceta` (errores en español, con el
  campo; topes de largo; enlaces solo `https:`, `#` o rutas de la página), `normalizarReceta` (nunca lanza; un solo
  protagonista) y `recetaAProps`. Solo niveles 1 y 2: shader, objeto 3D y video quedan para la v2.
- **Contrato** `contrato/encabezado-motionkit.json`, generado desde el código con `npm run contrato`. Viaja en el
  paquete (`motion-kit/contrato/encabezado-motionkit.json`).
- **Puente con La Mente**: `estiloDesdeLaMente({ tema, paleta, base })` y `<EstiloLaMente>`. Colores de la paleta y
  letra, mayúsculas, peso, brillo y esquinas del tema; el estilo de motion-kit queda de base.
- **Entradas separadas**: `motion-kit/encabezado` (lo que una página necesita para dibujar un encabezado desde su
  receta), `motion-kit/escena` y `motion-kit/receta` (sin React). `motion-kit` sigue trayendo todo.
- **CSS en archivo**: `motion-kit/estilos.css` (todo) y `motion-kit/estilos-encabezado.css` (solo el encabezado). Con
  `sinInyectarEstilos()` o `<meta name="motion-kit-estilos" content="archivo">` no se inserta ningún `<style>`: sirve
  con una CSP sin `'unsafe-inline'` en `style-src`. Las variables que se ponen con `style={…}` van por CSSOM, que la CSP
  no bloquea.
- **Pruebas**: `npm test` (`node --test`), `npm run peso` (tope por entrada), `npm run probar-paquete` (instala el
  paquete en un proyecto de prueba e importa solo el encabezado) y `scripts/verificar-lamente.mjs`.

### Peso (gzip, minificado, react afuera)

| Entrada | Al cargar | Perezoso (efectos de fondo) | Tope (confirmado por Aquiles) |
|---|---|---|---|
| `motion-kit/encabezado` | 31,6 KB | 12,0 KB | 35 KB |
| `motion-kit/receta` | 8,4 KB | — | 10 KB |
| `motion-kit/escena` | 14,0 KB | — | 16 KB |
| `motion-kit` | 63,7 KB | 10,9 KB | 70 KB |
| `estilos-encabezado.css` | 11,4 KB | — | — |

### Cambios que pueden romper

- `sideEffects` pasa de `false` a `["**/*.css"]`, para que el bundler no bote el `import "motion-kit/estilos.css"`.
- `ALTOS` y `SALIDAS` viven ahora en `encabezados/catalogo.ts` (se siguen exportando igual desde `motion-kit`).

### Arreglos

- Demo: «← Demo» y el botón atrás del navegador vuelven a la portada sin recargar.

## 0.1.0

Primera versión: 27 componentes y 4 hooks; efectos, estilos, encabezados y escena viva sin librerías.
