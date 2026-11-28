# SDD ledger — plan: /Users/aquilesmendezsoto/Documents/Proyectos Aquiles/motion-kit/docs/superpowers/plans/2026-11-28-un-solo-motor-fases-0-1.md

Spec: docs/superpowers/specs/2026-11-28-un-solo-motor-design.md
Pre-flight: T3→T5/T6 (f, letra, tiempo, fuerza, ritmoDe) coinciden; T4→T5/T6/T8 (capturas tomar/comparar) coinciden; T1→T3/T7 (nombres --mk-*) coinciden.
Ruling: sin commits por tarea (orden de Aquiles: commits solo con su orden) — los rangos de commit quedan vacíos — costo: la revisión final se hace sobre el árbol sin commit.
Task 1: Ruling: el script también revisa los temas del panel (data-tema-panel), no solo las variables, e ignora comentarios — la otra sesión suma temas seguido (ya son 14) — costo: ninguno; si molesta, se quita esa parte.
Task 1: Ruling: varias --lmt-* de detalle (36) quedan con destino «fase 3 (pieza)» y no van al ADN de la fase 1 — el ADN del diseño trae solo forma general; los detalles de cada pieza llegan con la pieza — costo: la traducción de la fase 1 cubre 20 de 46 --lmt.
Task 1: complete (commits 70c6dc7..70c6dc7, tests: npm run tabla → La tabla cubre 65 variables y 14 temas del panel (0 sin destino escrito).)
Task 2: Ruling: en el cerebro, AVANCES, DECISIONES y MAPA tenían cambios de otras sesiones sin commit; el commit f2f1957 lleva solo los de motion-kit (índice armado desde HEAD) y los ajenos siguen en el árbol — costo: ninguno para ellos.
Task 2: complete (commits 70c6dc7..8f3a128, tests: git ls-remote --tags origin v0.6.0 → c97d5e3e0bdd080b2702449703f49fe4742749bb	refs/tags/v0.6.0)
Task 3: Ruling: motion-kit/comic también exporta variablesTema y RITMOS (y sus tipos) — quien usa solo el cómic arma su tema sin bajar interfaz — costo: unos bytes si no se usan (se podan).
Task 3: complete (commits 8f3a128..8f3a128, tests: npm test → ℹ duration_ms 1065.168083)
Task 4: Ruling: la muestra es de la demo (#panel-piezas por sección, #comic por sección, 9 secciones del panel vivo, sellos llenado y Confirmar abierto; 50 capturas) — el front no se captura desde aquí (se lee, no se corre) — costo: el «se ve igual» del front lo prueba su sesión con el encargo. «Antes» guardado en $TMPDIR/mk-antes-adn.
Task 4: complete (commits 8f3a128..8f3a128, tests: node scripts/capturas.mjs comparar /var/folders/1t/w8y7396d7_1_jtl0s9k87gm00000gn/T//mk-antes-adn /var/folders/1t/w8y7396d7_1_jtl0s9k87gm00000gn/T//mk-antes-adn → Iguales: 50 de 50 (máximo 0.00 %).)
Task 5: Ruling: BotonQueGuarda no tiene forma propia (su look lo pone el front con className), así que la parte adn revisa los botones de Confirmar (radio y 44 px) en vez de BotonQueGuarda — costo: ninguno; el plan suponía una forma que la pieza no tiene.
Task 5: Ruling: hundir se sumó con respaldo «none» a los botones de Confirmar, Guia y el aviso (hoy ninguno se hundía) — si no, --mk-hundir no lo leía nadie — costo: con un tema que hunda, esos botones se hunden al tocarlos (es lo buscado).
Task 5: Ruling: quedan fuera del ADN, marcadas adn:no, la rueda de carga, el halo de ListaViva, el aro de la Guia, la sombra de la perilla del Interruptor, el borde punteado de SubirImagen y la sombra hacia arriba de BottomSheet — son efectos o formas propias, no del tema — costo: un tema manga no las cambia.
Task 5: Ruling: la letra del tema va en .mk-confirmar-contenido (lo comparten el globo y la hoja del teléfono), no en el globo: la primera corrida mostró que en el teléfono no la tomaba — costo: ninguno.
Task 5: Ruling: las piezas que se dibujan aparte toman letra('fuente') (Confirmar, aviso, pie de la Guia), además de los títulos — el plan pedía solo títulos — costo: sin --mk-fuente heredan igual que hoy.
Task 5: complete (commits 8f3a128..8f3a128, tests: node scripts/pruebas.mjs tema-interfaz → ℹ duration_ms 81.72025)
Task 6: Ruling: el salto del ✓ de SubirImagen pasó de animate() a una animación CSS al aparecer (con tiempo y fuerza) — con ritmoDe la pieza pesaba 4,05 KB contra su tope de 4; queda en 3,98 sin subir el tope — costo: la curva es por tramo (ease-out en cada uno), casi igual.
Task 6: Ruling: las excepciones de forma salieron de comentarios /* adn:no */ en el CSS a una lista en la prueba — el CSS viaja al navegador y sumaba bytes — costo: ninguno.
Task 6: hallazgo: Chromium cae la pestaña con @keyframes que animan la propiedad scale con var(); Copiar, Confirmar y Celebrar pasan a transform:scale(...) y la prueba «ninguna animación usa la propiedad scale con una variable» lo cuida (RED con los 3 archivos → GREEN). Era la causa de los clics colgados en verificar-panel (vivo) y verificar-comic (copiar). Avisado al front.
Task 6: complete (commits 8f3a128..8f3a128, tests: node scripts/pruebas.mjs tema-interfaz → ℹ duration_ms 126.104958)
Task 7: Ruling: la prueba del selector revisa el radio del globo de Confirmar (20px → 16px → 20px), no el de un BotonQueGuarda — BotonQueGuarda no tiene forma propia (ver Task 5) — costo: ninguno.
Task 7: nota: la prueba del selector se escribió junto con el selector (no la vi fallar antes); pasa y cubre ida y vuelta.
Task 7: Ruling: el encargo dice que las piezas de motion-kit SÍ cambian en el panel al traducir (toman la forma del tema) y pide mostrárselo a Aquiles — el plan decía «capturas iguales», pero el ADN existe justo para eso — costo: si Aquiles no lo quiere, el front traduce solo los colores.
Task 7: complete (commits 8f3a128..8f3a128, tests: node scripts/verificar-panel.mjs vivo → Todo bien. Capturas en /var/folders/1t/w8y7396d7_1_jtl0s9k87gm00000gn/T/mk-panel)
Task 8: Ruling (de Aquiles, «si, sube los topes»): topes por pieza SubirImagen 4→4,2, avisos 3,1→3,2, Copiar 1,7→1,8, por el costo del ADN; Cargando volvió bajo 2,1 dejando fijo su fundido.
Task 8: batería completa (verificar --todo, 28-11) 20/20 a la primera en 42 min 18 s; humo bien en 59 s. Capturas: 28 iguales; las 22 del panel vivo cambian solo por el selector «Forma» de la barra (mirado a ojo).
Task 8: Confirmar suma propsSi/propsNo, aria-describedby (detalle y children; BottomSheet suma «describe») y siHabilitado, pedidos del front — pruebas en verificar-comic confirmar RED→GREEN (escritorio y teléfono); Confirmar 3,8 de 4 KB.
Task 8: Ruling: el ADN usa --mk-radio-tarjeta (no --mk-radio) y --mk-fuente-texto (no --mk-fuente): son los nombres que ya usaban los estilos del encabezado (estilos.ts) — un solo vocabulario; las piezas toman la letra y las esquinas del Estilo que las envuelve — costo: dentro de un Estilo, Confirmar/avisos/globos toman su radio de tarjeta (buscado). Encontrado al armar la página growshop.
Final: fixed I-1 (encargo: las piezas en portal no tomaban la forma del panel) — el encargo pide copiar data-tema-panel a <body> y que la traducción valga ahí; prueba de regresión en verificar-panel adn (forma en body).
Final: fixed I-2 (encargo: la vista previa heredaba la forma del panel) — el encargo pide volver a declarar todas las --mk-* de forma, letra y ritmo en la caja de la página (initial las que no usa).
Final: Ruling: Task 6 — la nota decía «no subir el tope de 4»; después Aquiles subió el tope a 4,2. El paso del ✓ a CSS queda (inocuo y más liviano) — costo: ninguno.
Final: Ruling: Task 8 (nombres) — el costo escrito era incompleto: dentro de un Estilo cambian solo las piezas en línea; las de portal toman :root/body. Corregido en CHANGELOG.
Final: minor (deferred): Confirmar envuelve children en un div y pierden el gap entre sí si vienen varios (el front ya envuelve).
Final: minor (deferred): si siHabilitado pasa a false con el foco en «Sí», el foco cae a body.
Final: minor (deferred): propsSi acepta aria-busy/data-peligro (se pierden) y dangerouslySetInnerHTML (rompería); sacarlos del tipo.
Final: minor (deferred): :active con --mk-hundir pisa un efecto de presión propio de quien use la pieza.
Final: minor (deferred): con trazos de 4 px o none las colas de los globos se descuadran 1-3 px; un --mk-radio-tarjeta de dos valores invalida el radio de BottomSheet; --mk-ritmo-tiempo con unidad anula la animación.
Final: minor (deferred): ritmo quieto: mk-pop sigue parpadeando en opacidad y la mano corre sin moverse (documentar).
Final: minor (deferred): PrecioQueRueda: al rodar, una cifra ancha se recorta en una columna angosta; si cambia valor, el ancho cambia antes de terminar.
Final: minor (deferred): antetítulo del letrero repite el clamp del padding (mejor una variable) y con data-profundidad se despega hasta 6 px.
Final: minor (deferred): la prueba de scale+var revisa línea por línea; un @keyframes en varias líneas se escapa.
