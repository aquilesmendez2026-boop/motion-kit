# SDD ledger — plan: /Users/aquilesmendezsoto/Documents/Proyectos Aquiles/motion-kit/docs/superpowers/plans/2026-11-28-un-solo-motor-fase-2.md

Spec: docs/superpowers/specs/2026-11-28-un-solo-motor-design.md
Pre-flight: T1→T2..T5 (tipos Tema, Paleta, Mezcla, Lado) coinciden; T2→T3 (PALETAS, TEMAS, MEZCLAS) coinciden; T3→T4,T7 (Tema, variablesDeTema, buscarTema) coinciden; T5→T8 (contrato) coinciden.
Ruling: sin commits por tarea (el commit va al cerrar la v0.8.0, con la orden de Aquiles «termina sin preguntar») — costo: la revisión final se hace sobre el árbol sin commit.
Ruling: los nombres del ADN son --mk-radio-tarjeta y --mk-fuente-texto (v0.7.0): donde el plan dice forma.radio o letra.fuente, va radioTarjeta y fuenteTexto.
Task 1: complete (commits cbd9a41..cbd9a41, tests: npm run typecheck → > tsc --noEmit)
Task 2: Ruling: --lm-grupo pasa de «se queda» a --mk-grupo — un tema lo usa dentro de una sombra (elegida-sombra) y la barra lateral es candidata a pieza — costo: ninguno; el front lo sigue declarando.
Task 2: Ruling: las variables que el tema no define se declaran «initial» (no valen nada): cada pieza usa su respaldo, igual que hoy, y se corta lo que viene de afuera.
Task 2: Ruling: los alias que en un tema difieren de su destino principal (sobre-sol distinto de la tinta, campo-fondo distinto de la superficie) van a detalle con su propio nombre.
Task 2: Ruling: el violeta de Chakra en «lamente» queda como su color fijo (#a855f7 etc.); en los demás temas, como el bloque común del front (sale del acento).
Task 2: complete (commits cbd9a41..cbd9a41, tests: npm run typecheck → > tsc --noEmit)
Task 3: Ruling: el componente es <Tema tema=… para=…> (no id=…, que choca con el atributo HTML) y el tipo de datos sale como DatosTema desde motion-kit/temas — costo: ninguno.
Task 3: Ruling: motion-kit/temas no se reexporta desde motion-kit (todo): el catálogo pesa y el tope de todo es 105 — costo: quien lo use lo importa de motion-kit/temas.
Task 3: Ruling: los títulos de la página (peso, espaciado, mayúsculas, brillo) salen como --mk-titulo-peso, --mk-titulo-espaciado, --mk-titulo-mayusculas y --mk-titulo-brillo.
Task 3: complete (commits cbd9a41..cbd9a41, tests: npm run temas → Los 14 temas del panel dan lo mismo que el front.)
Task 4: Ruling: un adorno por tema por ahora (su firma entera: brillo-noche, hoja-cuaderno, pastel-suave, cinta-peligro, esquina-hoja, cinta-torcida, aura-que-respira, poste-barbero, linea-champana, cola, pulso, inclinado, pizarra-y-mantel); se parte si otro tema quiere reusar una parte — costo: ninguno hoy.
Task 4: Ruling: las partes son hoja, titulo, icono, barra, grupo, cabeza, estado, boton y vacio (data-mk-parte puede llevar varias); el elegido de la barra es [role=tab][aria-selected=true] o [aria-current=page].
Task 4: Ruling: tres animaciones del front no cumplían «solo transform y opacity» y se rehicieron: el aura de calma (una capa ::before fija que se desliza), el poste de barbería (la franja se desliza dentro de la pestaña, que pasa a overflow:clip; ocupa todo el alto en vez de dejar 4 px arriba y abajo) y el pulso de clínica (aparece y se apaga en vez de dibujarse) — costo: se ven un poco distintas que en el front.
Task 4: nota del front (28-11): en <body> el panel no pone data-tema-panel sino data-tema-panel-cuerpo, solo con variables (con la marca entera, reglas del panel se colaban en «Ver mi página»). El encargo de la fase 2 le pide aplicar variablesDeTema en <body> y Tema solo en la caja del panel.
Task 4: complete (commits cbd9a41..cbd9a41, tests: node scripts/pruebas.mjs temas → ℹ duration_ms 79.993458)
Task 5: complete (commits cbd9a41..cbd9a41, tests: node scripts/pruebas.mjs contratos → ℹ duration_ms 79.692666)
Task 6: Ruling: src/receta/lamente.ts NO pasa a leer el catálogo — viaja en motion-kit/encabezado (34,1 de 35 KB) y motion-kit/receta (9,7 de 10), y el catálogo entero no cabe —; queda como copia chica de la página y la prueba «la copia de la página es igual al catálogo de temas» exige que sean iguales — costo: dos lugares que se sostienen con una prueba.
Task 6: hallazgo (menor, para después): src/receta/lamente.ts emite --mk-texto-suave y el ADN usa --mk-suave para lo mismo; hoy nadie lee --mk-texto-suave.
Task 6: complete (commits cbd9a41..cbd9a41, tests: node scripts/pruebas.mjs lamente → ℹ duration_ms 91.829166)
Task 7: Ruling: en el panel vivo, las variables del tema también van en <body> (solo variables, como el front con data-tema-panel-cuerpo), para los avisos y Confirmar; la maqueta pv-* lee --mk-*, y la sección elegida sigue en la tinta (cada tema la cambia con su firma).
Task 7: nota: el plan pedía el selector en dos líneas: se ve entero en 1280 px (prueba). Las capturas del panel vivo cambian (lamente toma su radio de 16 px del catálogo en vez de 20 px).
Task 7: complete (commits cbd9a41..cbd9a41, tests: node scripts/verificar-temas.mjs → Todo bien. Capturas en /var/folders/1t/w8y7396d7_1_jtl0s9k87gm00000gn/T/mk-temas)
Task 8: complete (commits cbd9a41..cbd9a41, tests: test -f ../cerebro-aquiles/lamente/ENCARGO_2026-11-28_temas-motionkit.md → (no output))
Final: fixed C1 (los adornos del panel se colaban en la página y en el título del encabezado) — marcas data-mk-adorno, raíz [data-mk-tema][data-mk-para=panel] y :not([data-mk-para=pagina] *) — «los adornos solo aplican en el panel…» RED→GREEN y verificar-temas «la firma del panel no entra a la página».
Final: fixed C2 (cambiar de tema en vivo dejaba el nuevo sin firma) — el CSS se calcula en el render — verificar-temas «en el panel vivo, pasar de taller a calma…» (escrita junto con el arreglo; no la vi fallar antes).
Final: fixed I1 (rock del panel heredaba letra y forma de la página) — ladoDe: la versión del panel es completa — «la versión del panel de rock es completa» RED→GREEN; npm run temas en dos direcciones lo detectaba.
Final: fixed I2 (letras sin pesos) — el importador saca los pesos de FUENTES_TEMAS del front — «las letras del panel se piden con sus pesos» RED→GREEN.
Final: fixed I3 (precisión del encargo) — dónde va el bloque --lmt←--mk, respaldos de los alias, data-tema-panel en el Tema, data-mk-adorno.
Final: fixed I4 (paleta desconocida dejaba la página sin colores) — cae a la del tema — «una paleta desconocida cae a la del tema» RED→GREEN.
Final: fixed I5 (npm run temas solo comparaba en una dirección) — ahora también avisa lo que el catálogo trae de más (detectó I1).
Final: Ruling: Task 2 (rock con la versión del panel encima) — el revisor tenía razón; ahora la versión del panel es completa.
Final: Ruling: Task 4 (data-mk-parte) — el revisor tenía razón: pasa a data-mk-adorno.
Final: minor (deferred): VARIABLES_TEMA no corta --mk-bien, --mk-mal ni --mk-acento-2 (se heredan del panel).
Final: minor (deferred): los adornos no entran a dist/estilos.css (id con plantilla): con sinInyectarEstilos no aparecen; el front no lo usa hoy.
Final: minor (deferred): con lista vacía queda un <style> de adornos viejo (no aplica: está bajo su data-mk-tema).
Final: minor (deferred): el aura de calma (position:fixed) pinta todo el viewport, fuera de la caja; e impone position:relative a la raíz.
Final: minor (deferred): npm run temas no compara adornos, temas de la página ni modo oscuro; lo ideal sería comparar valores resueltos en el navegador.
Final: minor (deferred): src/receta/lamente.ts emite --mk-texto-suave (el ADN usa --mk-suave).
