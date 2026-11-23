# Cambios

## Sin publicar

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
