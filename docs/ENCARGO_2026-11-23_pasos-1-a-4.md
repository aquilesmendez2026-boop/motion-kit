# Encargo: pasos 1 a 4 en motion-kit (antes de llevarlo a La Mente)

Fecha: 23-11-2026. Estado: **listo para ejecutar** en una sesión de Claude en VS Code, en este repo (`motion-kit`,
rama `dev`). Lo pidió Aquiles: «podemos crear todo en motion kit y después llevarlo a La Mente… desde lo más sencillo a
lo más potente»; «las haremos en el repo».

Plan completo: `docs/superpowers/plans/2026-11-23-de-sencillo-a-potente.md`. Diseño del estudio:
`docs/superpowers/specs/2026-11-23-estudio-de-paginas-design.md`. Decisiones: `../cerebro-aquiles/DECISIONES.md`
(23-11-2026, «Estudio de páginas» y su «ajuste»).

## Antes de partir

1. Lee `../CLAUDE.md`, `../cerebro-aquiles/REGLAS.md` y las filas recientes de `../cerebro-aquiles/AVANCES.md`.
2. **Push pendiente:** el commit `bf6643a` está en `dev` local y no se subió (la sesión anterior no llegaba a GitHub).
   Corre `git push origin dev`. Si hay cambios sin commit del plan y del spec, súmalos al primer commit de este encargo.
3. Corre `npm run typecheck` y deja `npm run dev` arriba para las pruebas.

## Reglas de este trabajo

- **Sin librerías nuevas** en lo que viaja al navegador. Pruebas con `node:test` y Playwright (ya usado en `scripts/`).
- Criterios del kit en `docs/CATALOGO.md` y en la hoja de ruta: móvil primero, `transform`/`translate`/`scale`/
  `rotate` y `opacity` en lo que se anima, movimiento reducido, accesible, peso medido.
- Español de Chile, frases cortas, en código, mensajes de error y documentos.
- **No tocar los repos de La Mente** (`../lamente-backend`, `../lamente-front`): solo leerlos.
- Commits y push solo con el OK de Aquiles en el chat de esa sesión (regla 2). Un proceso pesado a la vez (regla 9).

## Paso 1: receta del encabezado v1

Lo que La Mente va a guardar y validar. Solo niveles 1 y 2 (base y CSS); shader, objeto 3D y video quedan para v2.

- `src/receta/receta.ts`: tipo `RecetaEncabezado` con `version: 1`, `estilo`, `composicion`, `entrada`, `efectoTexto`,
  `pack`, textos (`antetitulo`, `titulo`, `bajada`, `datos`), botones (`texto`, `href`), `alto`, `altoCelular`,
  `imagenes` (URL o key de S3), `poster`, `efecto`, `variante`, `profundidad`, `luz`, `mover`, `salida`, `ahorro`.
- `validarReceta(x)` → `{ ok: true, receta } | { ok: false, errores: { campo, mensaje }[] }`, con mensajes en español y
  topes (título 80, bajada 220, datos hasta 4 de 40, alto 20 a 100, `href` solo `https:`, `#` o rutas relativas).
- `normalizarReceta(r)`: quita campos desconocidos, pone valores por defecto y aplica **un solo protagonista**, con la
  misma regla de La Mente (leer `../lamente-backend/contrato/diseno.json`, `$comentario`, y
  `../lamente-backend/cores/paginas/src/diseno.mjs`).
- `recetaAProps(r)` → props de `Encabezado`. El editor `#encabezados` guarda su estado como receta y el bloque
  «Lo que se guarda (JSON)» muestra la receta validada.
- `scripts/generar-contrato.mjs` escribe `contrato/encabezado-motionkit.json` (listas cerradas, topes, versión) desde
  los catálogos del código. Una prueba falla si el archivo quedó desactualizado.
- `npm test` con `node --test`: recetas buenas y malas, normalizar, protagonista único, contrato al día.

**Listo cuando:** las recetas del editor, de los rubros y de las plantillas pasan; una mala da su error en español.

## Paso 2: puente con los temas de La Mente

- Leer `../lamente-backend/contrato/diseno.json` (12 temas, 5 paletas) y `../lamente-front/packages/ui/src/temas.ts` y
  `paletas.ts`.
- `src/receta/lamente.ts`: `estiloDesdeLaMente({ tema, paleta })` → el `EstiloId` base más las variables CSS que pisa
  (fondo, superficie, texto, acentos, fuentes, radios), para que el encabezado combine con el resto de la página.
- En el editor: selector «Tema y paleta de La Mente» que muestra el encabezado con ese puente.
- Prueba: cada tema por cada paleta da colores válidos y pasa el semáforo de contraste del título.

**Listo cuando:** un encabezado con tema `hamburgueseria` y paleta `bosque` se ve como parte de una página de La Mente.

## Paso 3: paquete v0.2.0

- Build de librería con entradas separadas: `motion-kit` (todo), `motion-kit/encabezado`, `motion-kit/escena`,
  `motion-kit/receta`; `exports` en `package.json`; `sideEffects: false` (revisar que siga siendo cierto).
- `scripts/medir-paquete.mjs`: tamaño gzip de cada entrada (con `node:zlib`). Fijar el tope de `motion-kit/encabezado`
  después de medir y proponérselo a Aquiles; la prueba falla si se pasa.
- CSS en archivo de respaldo: `motion-kit/estilos.css` generado desde las constantes CSS, y una forma de apagar la
  inyección de `<style>` (por si La Mente quita `'unsafe-inline'` de su CSP).
- `CHANGELOG.md` y versión `0.2.0`. La etiqueta `v0.2.0` y el push, con OK. La Mente lo instalará con
  `github:aquilesmendez2026-boop/motion-kit#v0.2.0`.

**Listo cuando:** `npm run build` saca las entradas, se miden y un proyecto de prueba importa solo
`motion-kit/encabezado`.

## Paso 4: biblioteca en motion-kit (local)

Misma forma que tendrá la tabla de La Mente, para que subirla después sea solo cambiar dónde se guarda.

- Tipo `DisenoBiblioteca`: `{ id, nombre, rubro, etiquetas[], estado: "borrador" | "aprobado" | "archivado", autor?,
  receta, creado, actualizado }`.
- Ruta `#biblioteca` en la demo: lista con miniatura (el `Encabezado` en chico, no una imagen), filtros por rubro,
  estado y etiqueta; abrir en el editor, duplicar, archivar, exportar e importar `.json` (validados con
  `validarReceta`).
- Guardado en el navegador (`localStorage` dentro de `try/catch`), con exportar e importar como respaldo.
- Botón «Guardar en la biblioteca» en el editor.
- Ampliar `scripts/verificar-escena.mjs` o crear `scripts/verificar-biblioteca.mjs`.

**Listo cuando:** el equipo arma una colección, la exporta, la importa en otro navegador y abre cualquier diseño en el
editor tal como estaba.

## Al cerrar cada paso

- `npm run typecheck`, `npm test` y los `scripts/verificar-*.mjs` en verde.
- Actualizar `docs/CATALOGO.md` y la hoja de ruta.
- Una fila en `../cerebro-aquiles/AVANCES.md` (fecha, qué, commit).
- Dejar a Aquiles los próximos pasos y qué hay que correr para verlo (regla 13).

## Pendiente de Aquiles (no bloquea los pasos 1 a 4)

- Las áreas del equipo de La Mente: propuesta Dirección, Diseño, Soporte, Comercial y Desarrollo.
- Si al usar un diseño de la biblioteca en un negocio sigue publicando el dueño (supuesto actual: sí).
- Mover `docs/ci/verificar.yml` a `.github/workflows/` para que las pruebas corran en GitHub.

El paso 5 (llevarlo a La Mente) está en `../cerebro-aquiles/lamente/ENCARGO_2026-11-23_roles-del-equipo-y-biblioteca.md`
y **no se parte sin orden de Aquiles**.
