# Cambios

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
