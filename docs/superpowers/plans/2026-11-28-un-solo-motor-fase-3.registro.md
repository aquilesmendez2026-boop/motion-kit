# SDD ledger — plan: /Users/aquilesmendezsoto/Documents/Proyectos Aquiles/motion-kit/docs/superpowers/plans/2026-11-28-un-solo-motor-fase-3.md

Spec: docs/superpowers/specs/2026-11-28-un-solo-motor-design.md
Pre-flight: T1→T2..T5 (inventario: props y variables) ; T2→T3,T5 (IconoCaja, Pastilla, BotonPanel) ; T3→T6 (piezas en la guía).
Ruling: sin commits por tarea (el commit va al cerrar la v0.9.0, con la orden de Aquiles «termina sin preguntar»).
Task 1: Ruling: las capturas «antes» del front son de su guía (/guia?tema=…, 14 temas × teléfono y escritorio, en $TMPDIR/mk-fase3-front): las pantallas del panel piden sesión — costo: la comparación es pieza por pieza contra la guía, no pantalla por pantalla.
Task 1: Ruling: lo que el front anima con box-shadow, background o border en transición pasa a cambio al instante (solo transform se mueve); el barrido (background-position) y el revelado (filter) se rehacen con capas y transform/opacity — regla de motion-kit.
Task 1: Ruling: los fondos de los estados salen como --mk-estado-<tono> con los colores de hoy de respaldo; el modo oscuro sale de los colores del tema (oscuro de «lamente»), no de reglas .dark aparte.
Task 1: complete (commits 0614a75..0614a75, tests: test -f docs/un-solo-motor/piezas-del-panel.md → (no output))
Task 2: Ruling: la comparación «se ve igual» es de estilos calculados (borde, esquina, sombra, colores, letra, relleno) contra la guía del front en local, no de píxeles entre dos apps distintas — 6/6 iguales con «lamente».
Task 2: Ruling: BotonPanel lleva min-height 44px (regla de motion-kit): el chico del front mide menos; con el mismo relleno, el nuestro queda más alto — costo: los chicos se ven un poco más altos en el teléfono.
Task 2: nota: la parte visual piezas-panel se escribió junto con la sección de la vitrina (no la vi fallar antes); compara contra el front de verdad.
Task 2: complete (commits 0614a75..0614a75, tests: npm test → ℹ duration_ms 1040.6365)
Task 3: Ruling: en el índice general (motion-kit) la pieza sale como SeccionPanel, porque ya existe el tipo Seccion de las plantillas; en motion-kit/interfaz se llama Seccion.
Task 3: pendiente: la comparación con el front de la tarjeta, sus títulos y la bajada quedó saltada (la guía del front no mostraba sus piezas mientras su sesión editaba Modulo.tsx); se corre de nuevo en el cierre (Task 8).
Task 3: complete (commits 0614a75..0614a75, tests: npm test → ℹ duration_ms 1374.231)
Task 4: Ruling: la prueba del ADN (pruebas/tema-interfaz.test.ts) acepta también `var(--mk-…)` como forma, igual que la de las piezas nuevas; lo que calza en el ADN va por f() (trazo, radioCampo, sombraSuave) y los efectos de estado de SubirImagen (acento al arrastrar, rojo con error, el trazo fino del ícono, hundida) quedan como excepciones con nombre — costo: una forma fija nueva escrita como var(--mk-x,…) ya no la ataja esa prueba.
Task 4: Ruling: Cambiar y Quitar quedan iguales al BotonPanel chico (trazo, píldora, cielo al pasar, translateY(1px) al tocar, Quitar en rojo), sin las sombras que puse primero — así lo dice el inventario.
Task 4: Ruling: topes subidos por las conductas (es la receta del front, CSS de verdad): SubirImagen 4,2 → 4,8 KB (mide 4,7) y Campo 1,5 → 2,1 KB (mide 2,0), bajo la orden «termina sin preguntar»; se le avisa a Aquiles — costo: ~0,9 KB más en el panel.
Task 4: nota: el halo de ListaViva como plantilla con interpolaciones no se descartaba y viajaba con Copiar, los avisos y Selector (+0,1 KB cada uno); quedó como texto plano y volvieron a su tope.
Task 4: nota: verificar-panel imagen falló una vez en 5 pasadas, en escritorio y en pasos distintos (el ✓, Enter abre el selector): de tiempos; 3/3 seguidas pasan. conductas 22/22, llega 33/33, adn 22/22, piezas-panel 16/16, verificar-comic campo 23/23.
Task 4: complete (commits 0614a75..0614a75, tests: npm test → ℹ duration_ms 1157.897875)
Task 3: pendiente cerrado: la guía del front ahora escucha en localhost:5181 (no 127.0.0.1); con eso la comparación corre y pasa — piezas-panel 26/26 (tarjeta, títulos y bajada iguales al front con «lamente»).
Task 3: Ruling: la comparación no cuenta el estilo ni el color de un borde de ancho 0 (el reseteo de Chakra pone `0 solid` en todo y no se ve) — costo: ninguno visible.
Task 3: nota: el título de CabezaSeccion medía 19,2px en la vitrina por una regla de la demo (.panel-seccion h2); la demo ya no toca los h2 con data-mk-adorno. La pieza estaba bien (clamp 1,45–1,9rem, igual al front).
Task 5: Ruling: cada sección mide al menos 44 px de alto (el front, 40): regla de motion-kit — costo: la barra queda un poco más larga.
Task 5: Ruling: el teclado sigue los botones como están (todos con Tab) y además flechas, Inicio y Fin mueven el foco; no hay tabindex que rote — así lo pide el brief («las flechas y Tab la recorren») — costo: con Tab hay que pasar por las 41.
Task 5: Ruling: cada grupo con nombre es role="group" con aria-label (el nombre visible va aria-hidden, para no leerlo dos veces).
Task 5: Ruling: el punto de novedad de la barra contraída (inventario) no entra: el brief no lo pone en la interfaz de la pieza — costo: el front lo mantiene suyo hasta que se pida (prop futura `nueva`).
Task 5: Ruling: tope nuevo BarraLateral 2,6 KB (mide 2,49 con IconoCaja, que pesa 0,76).
Task 5: nota: vivo 50/50 (con y sin movimiento reducido), verificar-temas 20/20, npm test 417/417. Capturas revisadas: normal, contraída, taller (cinta), noche y la hoja del teléfono.
Final: minor (deferred): en «noche», las tarjetas claras de la agenda de la demo (#panel) dejan la hora casi ilegible (es de la demo, no de las piezas).
Task 5: complete (commits 0614a75..0614a75, tests: npm test → ℹ duration_ms 1043.585125)
Task 6: Ruling: el título y la descripción de cada tema de la guía viven en la demo (DESCRIPCION, «Guía *Nombre*»); rubros y movimiento salen del catálogo — costo: si el front cambia una descripción, aquí no cambia.
Task 6: Ruling: la guía se arma con las piezas de motion-kit (Seccion, CabezaSeccion, BotonPanel, TarjetaFila, BarraLateral…) en vez de copiar el Bloque/Muestra de Chakra del front; las 12 secciones dicen para qué sirven.
Task 6: Ruling (hallazgo de la guía): ningún tema traía su rojo y en «noche» el peligro (#b42318) daba 2,71 sobre su superficie; «noche» declara `mal: #ff7a7a` en su detalle (7,05) y el contrato de temas suma esa línea — prueba «el rojo de peligro se lee…» RED→GREEN — costo: el backend y el front copian el contrato nuevo con la v0.9.0.
Task 6: Ruling (hallazgo de la guía): CabezaSeccion en el teléfono apretaba el título al lado del botón; ahora el botón baja bajo 768 px (como dice el inventario) — prueba piezas-panel RED→GREEN.
Task 6: Ruling (hallazgo de la guía): Seccion no separaba lo que lleva adentro; ahora 1rem (como el Bloque del front) — prueba piezas-panel RED→GREEN. Tope {CabezaSeccion, Seccion, GrillaTarjetas, Selector} 3 → 3,1 KB (Aquiles: «puedes subir el tope si es necesario»).
Task 6: nota: verificar-temas 30/30 (los 14 temas × teléfono y escritorio en 10 s; la subida de muestra, lo que llega, confirmar y el recorrido), piezas-panel 30/30 (con la guía del front), npm test 418/418. Capturas revisadas: lamente, taller y picada en teléfono, noche en escritorio.
Task 6: complete (commits 0614a75..0614a75, tests: npm test → ℹ duration_ms 1040.777834)
Task 7: Ruling (hueco del plan): la barra del front usa insignia de novedad, nombre corto, su propio texto al pasar y data-soporte-accion; BarraLateral no los tenía y el encargo no se podía cumplir sin perderlos. Se suman `insignia` (contraída, un punto), `corto` (el completo para el lector), `titulo` y `atributos` — vivo RED→GREEN (58/58). Tope BarraLateral 2,6 → 2,8 KB (Aquiles: «puedes subir el tope si es necesario»).
Task 7: Ruling (hallazgo del encargo): el «al pasar» de «taller» apuntaba a `:is([role=tab],[aria-current]):hover`; con BarraLateral (nav, aria-current solo en la elegida) se perdía. El adorno suma `.mk-barra-item` — vivo RED→GREEN (60/60); verificar-temas 30/30.
Task 7: Ruling: `npm run temas` ya no compara CSS (el front borró temasPanel.css en su fase 2, 0d85a61): ahora falla si el front vuelve a declarar un tema del panel o si no tiene su copia del contrato, y solo avisa si la copia es de una etiqueta anterior — costo: una copia vieja no detiene nada (se pone al día con cada etiqueta).
Task 7: Ruling: los campos de Chakra son 296 Field.Root en 54 archivos (el plan decía 55): el encargo los ordena por carpeta, en commits chicos.
Task 7: Ruling: el criterio de capturas del encargo nombra lo que cambia a propósito (44 px de botones chicos y de la barra, Cambiar/Quitar, barrido y revelado, el rojo de «noche»); el resto, igual (0,5 %).
Task 7: nota: encargo cerebro-aquiles/lamente/ENCARGO_2026-11-28_piezas-panel.md (borrador hasta v0.9.0). npm run tabla y npm run temas en verde.
Task 7: complete (commits 0614a75..0614a75, tests: sh -c 'npm run tabla && npm run temas && npm test' → ℹ duration_ms 1141.859333)
Final: review: Opus (revisión final v0.9.0) — Con arreglos: 1 crítico, 7 importantes, 12 menores.
Final: fixed C1 estados ilegibles con «cancha» (sobre-sol blanco) — el texto de los estados lee `--mk-estado-texto` (respaldo #10223f) — prueba «cada estado se lee con contraste AA en los 14 temas del panel» RED (cancha 1,22)→GREEN, suite 419/419.
Final: fixed I2 BotonPanel se movía con movimiento reducido (la regla pesaba menos) — `transform:none!important` — piezas-panel (reducido) RED→GREEN.
Final: fixed I3 un estado largo corría el ancho (nowrap) — `max-width:100%;overflow-wrap:anywhere` — piezas-panel «un estado larguísimo no se sale» RED (615 de 341)→GREEN.
Final: fixed I4 la elegida sin módulo no se leía (suave sobre tinta) — el gris va solo en las no elegidas — vivo RED→GREEN.
Final: fixed I5 el foco se perdía en la elegida con 10 firmas (outline:none) — el foco de la pieza va con !important — vivo «con taller, el foco se ve en la elegida» RED→GREEN.
Final: fixed I6 el selector con la letra y el relleno del navegador — `.mk-selector{font:inherit;padding…}` — piezas-panel RED (13,33px, 0)→GREEN.
Final: fixed I7 la barra no se veía como la del front — receta de barraLateral.css (sección sin borde 14px/500 y nombre 600, relleno 8×16, contorno −2px, ícono de la elegida con borde fondo, sin módulo solo el ícono punteado, grupos sin mayúsculas con rayita 10×2, contraída con línea de borde y 0,55, salto como animación, fila del botón con su línea) — 10 comparaciones nuevas contra la guía del front en piezas-panel RED→GREEN (45/45).
Final: Ruling: dos diferencias de la barra quedan a propósito y la prueba no las compara: el texto de las no elegidas usa --mk-suave (el front, grises de Chakra #52525b y #a1a1aa, este último ~2,5 sobre blanco) y fontFamily (depende de la página donde se mide) — costo: si el front quería esos grises, se ve un poco distinto.
Final: fixed I8 el encargo no avisaba lo de la barra — `propsContraer` y `tituloContraida` en la pieza (vivo RED→GREEN: atributos del botón, texto contraída), y el encargo dice: pruebas del front con getByRole("tab") (Negocio.test.tsx 39) y data-colapsada→data-contraida, la caja del front sin marco ni overflow, los dos textos, lo que cambia a propósito, y que Campo viste sus controles.
Final: Ruling: topes — BarraLateral 2,8 → 3 KB (Aquiles: «puedes subir el tope si es necesario»); la entrada interfaz queda en 26,3 KB (el plan decía «no pasa de 26»; su tope del script es 28) — costo: 0,3 KB sobre lo planeado.
Final: minor (deferred): respaldo de sobre-sol #10223f en IconoCaja y BotonPanel (el front usa var(--mk-texto)); en los 11 temas sin sobre-sol la tinta sale azul marino.
Final: minor (deferred): Campo, en «noche» el «!» blanco sobre #ff7a7a da 2,5:1.
Final: minor (deferred): Campo, al pasar sobre un campo con error se pierde el borde rojo (la regla de pasar pesa más).
Final: minor (deferred): SubirImagen, el revelado es solo opacity/scale sin la capa, y corre al montar con fotos que ya estaban.
Final: minor (deferred): Cambiar y Quitar de SubirImagen no llevan data-mk-adorno="boton".
Final: minor (deferred): barbería con la barra contraída: la firma pone padding-inline-start a la elegida y el ícono se recorta ~3 px.
Final: minor (deferred): verificar-temas `sinBajada` no revisa que haya una bajada.
Final: minor (deferred): contraste sobre-acento/acento en la barra: patitas 3,17 y pastel 4,09 (datos del catálogo, de antes).
Final: minor (deferred): topes de pieza agrupados (IconoCaja con Pastilla; cuatro piezas juntas) y el «interfaz no pasa de 26» no lo exige ningún script.
Final: note: insignia={0} ya no escribe «0» (arreglado de paso en la pasada de I8); el inventario ya no dice que Selector acepta `opciones`.
