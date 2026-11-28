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
- `npm run demo:armar` y `npm run demo:servir`: la demo armada en `http://localhost:4173` (React en modo producción).
  Para revisar algo que solo falle armado; la batería no gana tiempo con ella (medido el 26-11: 2-4 %).
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
- **Antes de una etiqueta** (decisión de Aquiles del 28-11-2026: «siempre solo lo que cambió»):
  `npm run verificar -- --desde=<etiqueta anterior>` (corre las pruebas que tocan los cambios, también los archivos
  nuevos; si cambió algo común, como `src/estilos`, `src/utils` o `src/hooks`, el script corre todo porque todo queda
  tocado) y `npm run humo`. Sin batería completa periódica: `-- --todo` solo si Aquiles la pide. Anotar en el commit
  del paquete qué se corrió.
- `npm run capturas -- tomar <carpeta>` y `npm run capturas -- comparar <antes> <después>` (con el servidor arriba):
  la muestra fija de «se ve igual» de «Un solo motor» (50 capturas, ~1 min); falla si una cambia más de 0,5 %.
  `npm run tabla`: revisa que la tabla de nombres (`docs/un-solo-motor/`) cubra cada variable del front.
- `node scripts/en-safari.mjs <prueba> [parte]`: la misma prueba con el motor de Safari (WebKit). No es semáforo: ver
  «Safari» en `docs/CATALOGO.md`.
- `motion-kit/comic`: el cómic del panel (la mano, globos, carteles, `Guia`, `useCelebrar`). Ver «Guardar y cómic del
  panel» en `docs/CATALOGO.md`; su prueba visual es `verificar-comic` (con `#comic` y `#panel-piezas`). El panel
  vivo (`#panel`, todas las secciones) se prueba con `node scripts/verificar-panel.mjs vivo`.
- Pruebas visuales: `node scripts/verificar-<efectos|piezas|estilos|encabezados|escena|lamente|relatos|biblioteca|pelicula|momentos|momentos2|momentos3|momentos4|fotos|dedo|director|luz|hilos|panel|comic|growshop|temas>.mjs [url]` con el servidor
  arriba (usan Playwright).
