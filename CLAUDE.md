# motion-kit

Librería propia de efectos y animaciones para React, y estudio de encabezados para las páginas de La Mente.

## Al empezar

1. Lee `../CLAUDE.md` y lo que pide: `../cerebro-aquiles/REGLAS.md` y las filas recientes de
   `../cerebro-aquiles/AVANCES.md`.
2. **Revisa si hay un encargo abierto** en `docs/ENCARGO_*.md` (el más reciente primero) y ejecútalo si Aquiles lo pide.
   Hoy: `docs/ENCARGO_2026-11-23_pasos-1-a-4.md`.
3. Hoja de ruta y criterios: `docs/CATALOGO.md` y `docs/superpowers/plans/2026-11-23-de-sencillo-a-potente.md`.

## Reglas del repo

- Sin librerías de animación ni dependencias nuevas en lo que viaja al navegador. Si alguna hace falta, gratis u open
  source (MIT, Apache o BSD) y como adaptador opcional aparte. Decisión del 23-11-2026.
- Móvil primero; en lo que se anima, solo `transform` (o `translate`, `scale`, `rotate`) y `opacity`; movimiento
  reducido; accesible; peso medido contra `../cerebro-aquiles/investigaciones/2026-11-23-pesos-web-y-movil.md`.
- Se trabaja en `dev`. Commits y push solo con el OK de Aquiles.
- Los repos de La Mente se leen, no se tocan desde aquí.
- Español de Chile, frases cortas.

## Comandos

- `npm run dev` (demo en `http://localhost:5173`), `npm run dev:red` (abierto a la Wi-Fi, para el QR del editor).
- `npm run typecheck`, `npm run build` (mide el peso), `npm test` (receta, contrato y puente con La Mente), `npm run contrato`,
  `npm run peso` (topes por entrada, también `momentos`) y `npm run probar-paquete` (instala el paquete e importa el
  encabezado, la página y los momentos).
- Dos entradas del motor de animación: `motion-kit/director` (lo que corre en la página) y `motion-kit/partitura`
  (lo de quien crea: el lenguaje en español, las partituras de la casa). Ver «Director, fase 2» en `docs/CATALOGO.md`.
- `motion-kit/luz`: una sola luz para la página (`Luz`) y las superficies que le responden (`Materia`). Ver «Luz y
  materia» en `docs/CATALOGO.md`.
- `npm run verificar` (con el servidor arriba): corre solo las pruebas visuales, y las partes, que tocan los archivos
  que cambiaron. `-- --lista` dice cuáles sin correrlas; `-- --desde=<commit o etiqueta>` compara contra eso;
  `-- --todo`, la batería completa (~38 min).
- `npm run humo` (con el servidor arriba): la pasada rápida (~1 min): entra a cada vitrina, la recorre y revisa que no
  haya errores; en `#hilos` y `#pagina`, cada relato de página.
- **Antes de una etiqueta** (decisión de Aquiles del 25-11-2026): `npm run verificar -- --desde=<etiqueta anterior>` y
  `npm run humo` (unos 8 min). La batería completa (`-- --todo`), cada 3 etiquetas o antes de un salto de versión
  (0.5 → 0.6); el script ya la pide solo si cambió algo común. Anotar en el commit del paquete cuál se corrió.
- `node scripts/en-safari.mjs <prueba> [parte]`: la misma prueba con el motor de Safari (WebKit). No es semáforo: ver
  «Safari» en `docs/CATALOGO.md`.
- Pruebas visuales: `node scripts/verificar-<efectos|piezas|estilos|encabezados|escena|lamente|relatos|biblioteca|pelicula|momentos|momentos2|momentos3|momentos4|fotos|dedo|director|luz|hilos>.mjs [url]` con el servidor
  arriba (usan Playwright).
