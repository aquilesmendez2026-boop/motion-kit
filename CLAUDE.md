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
- Pruebas visuales: `node scripts/verificar-<efectos|piezas|estilos|encabezados|escena|lamente|relatos|biblioteca|pelicula|momentos|fotos|dedo>.mjs [url]` con el servidor
  arriba (usan Playwright).
