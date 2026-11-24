# Plan: de lo más sencillo a lo más potente

Fecha: 23-11-2026. Decisión de Aquiles: **todo se crea primero en motion-kit y después se lleva a La Mente**, empezando
por lo más sencillo. Cada paso termina con algo que se puede usar y probar solo; lo que se sube a La Mente es siempre lo
que ya está terminado en motion-kit. Ver `DECISIONES.md` del cerebro (23-11-2026, «Estudio de páginas, ajuste»).

## Los niveles de un encabezado

| Nivel | Qué trae | Peso extra | Riesgo en un teléfono barato |
|---|---|---|---|
| 1. Base | Composición, entrada, textos, botones, alto, estilo, fotos | 0 KB + fotos | Ninguno |
| 2. CSS | Efectos de fondo CSS, capas 2.5D, luz, salida al bajar, póster | 0 KB | Bajo |
| 3. WebGL y 3D CSS | Fondos con shader, objeto 3D (caja, lata, tarjeta) | < 10 KB | Medio: baja a «liviano» solo |
| 4. Recursos | Video con transparencia, secuencia con scroll | 0,8 a 2 MB | Alto: solo con buena red |
| 5. Adaptadores | Lottie (dotlottie-web, MIT), 3D real (three.js, MIT) | el reproductor | Alto; solo si hace falta |

## Pasos

| Paso | Qué | Listo cuando |
|---|---|---|
| 1. Receta del encabezado v1 ✅ (23-11) | El formato con versión (solo nivel 1 y 2), `validarReceta` y `normalizarReceta` (un solo protagonista, topes), y el contrato `encabezado-motionkit.json` generado desde el código | Las recetas de los ejemplos y del editor pasan la validación; una mala da el error en español |
| 2. Puente con La Mente ✅ (23-11) | Los 12 temas y 5 paletas de La Mente pasan a colores y letras de motion-kit | Un encabezado con tema «hamburgueseria» y paleta «bosque» combina con la página de La Mente |
| 3. Paquete v0.2.0 ✅ (23-11, falta etiqueta) | Entradas separadas (`motion-kit/encabezado`, `/escena`), peso del JS medido por entrada con tope, CSS en archivo de respaldo, etiqueta en GitHub | La Mente lo puede instalar desde la etiqueta y baja solo el encabezado |
| 4. Biblioteca en motion-kit | Guardar, abrir, duplicar y etiquetar diseños por rubro, con miniatura; exportar e importar en el mismo formato que tendrá La Mente | El equipo arma una colección de diseños en local |
| 5. Llevar el nivel 1 y 2 a La Mente | Encargo: roles del equipo por área con invitación, biblioteca en `paginas`, encabezado de motion-kit en la página pública, el estudio sube a la biblioteca | Un diseño aprobado llega como borrador a un negocio de dev y el dueño lo publica |
| 6. Nivel 3 | Receta v2 con shader y objeto 3D (v1 sigue valiendo) | Probado en Android de gama media con el QR; sube a La Mente como versión nueva |
| 7. Nivel 4 | Renders reales (Blender) para video y secuencia, con presupuesto | Un objeto real dentro del presupuesto de peso |
| 8. Nivel 5 | Adaptadores opcionales, solo si un diseño lo pide | Cargan aparte y no suman peso a quien no los usa |

El paso 5 (La Mente) parte cuando Aquiles dé la orden, con el encargo
`cerebro-aquiles/lamente/ENCARGO_2026-11-23_roles-del-equipo-y-biblioteca.md`.

## Lo que ya está hecho (23-11)

El editor `#encabezados` con todos los niveles 1 a 4 funcionando, medidores (peso, fluidez, carga, contraste),
compresión de fotos, modo ahorro, plantillas por rubro y QR para el teléfono. Falta lo que hace que La Mente lo pueda
guardar y usar: pasos 1 a 5.

**Paso 1 listo (23-11):** `src/receta/` con `validarReceta`, `normalizarReceta`, `recetaAProps` y el contrato
`contrato/encabezado-motionkit.json`; el editor guarda su estado como receta; `npm test` con 17 pruebas en verde.

**Paso 2 listo (23-11):** `estiloDesdeLaMente` y `EstiloLaMente` con los 12 temas y las 12 paletas (no 5: el encargo
se equivocó en la cuenta). Selector en el editor y en la vista del QR; `scripts/verificar-lamente.mjs`.

**Paso 3 listo (23-11):** entradas `encabezado`, `escena` y `receta`; peso medido con tope; `estilos.css` y
`estilos-encabezado.css` con `sinInyectarEstilos()`; versión 0.2.0 y `CHANGELOG.md`. Falta la etiqueta `v0.2.0` y el push
(con OK de Aquiles).

**Paso 4 listo (23-11):** biblioteca en `src/biblioteca/` (`DisenoBiblioteca`, validar, crear, editar, duplicar,
filtrar, exportar, importar, `almacenLocal` detrás de `AlmacenBiblioteca`) y demo `#biblioteca` unida al editor
(`#encabezados?id=…`). `npm test` (48) y `verificar-biblioteca` (25) en verde. Sigue el paso 5 (La Mente), con orden de
Aquiles.

**Relatos listos (23-11):** los nueve relatos, el movimiento base por estilo y la receta de página v1 en
`motion-kit/pagina` (plan `docs/superpowers/plans/2026-11-23-relatos.md`). Sigue el encabezado de película (receta v2).

**Encabezado de película listo (23-11):** receta v2 con las nueve ideas aprobadas (plan
`docs/superpowers/plans/2026-11-23-encabezado-pelicula.md`).

## Por diseñar (pedidos de Aquiles, 23-11)

- **Página de presentación, sin tope de peso:** para mostrar lo mejor (todos los relatos, shader, objeto 3D, video con
  transparencia, secuencias, fotos grandes). **Primero web**; las páginas de los negocios mantienen su presupuesto.
  **En el teléfono (web móvil) carga en baja:** parte en nivel liviano y sin los recursos pesados (video, secuencias,
  fotos grandes); la versión completa es para computador.
- **Después, la app móvil:** `lamente-app` es Kotlin Multiplatform, no React. Decidir entre mostrar la página web
  dentro de la app (rápido, igual que la web) o rehacer en Compose los efectos más usados (más fluido, más trabajo).
- **Tanda que sigue: motor de animación propio (Partitura y Director)**, aprobado por Aquiles el 24-11 («si a todo,
  partamos con la fase 0»). Reemplaza a «escenas por capas», que queda adentro (sus efectos pasan a ser partituras).
  Análisis y plan: `docs/superpowers/specs/2026-11-24-motor-de-animacion-analisis-y-plan.md`.
- **Escenas por capas** (pedido de Aquiles, 24-11; ahora dentro del motor de animación). Lo anotado antes:
  - **Motor de escenas por capas:** una «receta de escena» (la lista de capas; qué mueve a cada una: dedo,
    inclinación, scroll o tiempo; con qué fuerza; su foco y su sombra) y un solo motor que la dibuja. «Sorpréndeme»
    arma escenas con una semilla. Se apoya en lo que ya existe: `CapasProfundidad`, la luz, el resorte, el péndulo, la
    física y el lienzo.
  - **Dónde vive cada parte** (decisión de Aquiles, 24-11: «el motor de escena en La Mente y aquí solo los
    efectos»; «sí, déjalo así»; anotada en `cerebro-aquiles/DECISIONES.md`): en **La Mente**, el motor que arma escenas (elegir capas, «Sorpréndeme», guardar,
    permisos), dentro del Estudio común. En **motion-kit**, los efectos (las capas y lo que las mueve), la receta de
    escena con su contrato (La Mente la copia y la valida, como hoy) y el componente que dibuja una receta. Aquí quedan
    recetas de ejemplo fijas para la demo y las pruebas. La parte de La Mente va como encargo en el cerebro (sus repos
    no se tocan desde motion-kit).
  - **Tres efectos para partir:** diorama (una escena en capas con foco, sombra y aire, que se mueve con el teléfono),
    título con volumen (letras 3D con copias del texto apiladas) y tarjeta holográfica (brillo que cambia con la
    inclinación).
  - **Después:** foto con relieve (una sola foto que gira en 3D; necesita un mapa de profundidad por foto, que habría
    que generar al subirla: sería un servicio en La Mente, con costo, y se ve aparte), vidrio esmerilado, ventana o
    portal y libro pop-up. Y cruces de lo que ya hay: física con foto (la foto se rompe en pedazos que caen),
    partículas con texto (título de arena), sensores con capas y sonido con shader.
  - **Criterio:** el realismo sale de cinco cosas (cada capa se mueve distinto; lo lejano y lo muy cercano van
    desenfocados; la luz y las sombras calzan; lo lejano pierde contraste; algo pasa por delante del texto), no de
    sumar capas. De 4 a 7 capas: cada capa a pantalla completa ocupa unos 12 MB de memoria gráfica en un teléfono. Para
    más volumen, un solo lienzo WebGL que haga las capas por dentro.
  - Siguen anotados para después de esa tanda: carta que se abre como libro, carrusel 3D, fuegos artificiales y
    ecualizador con sonido real.
- **Más adelante: creador de personajes y de foto a plantilla** (anotado el 23-11, sin fecha):
  - Personajes en estilo propio (recorte de papel o anime, sin copiar obras de otros) como receta de partes, colores y
    gestos; motion-kit los dibuja en SVG y los anima con `transform` y `opacity`. Claude arma la receta, no dibuja.
  - De una foto, un flyer o una captura a una receta de encabezado o de página (Claude con visión; los colores ya
    salen de `paletaDeFoto`).
  - Antes de partir: choca con «no usamos modelos remotos» (llamar a Claude desde La Mente es un modelo remoto y
    cuesta por uso: Opus 5.5 unos US$0,04 a 0,08 por creación, Haiku 5.5 menos de US$0,005) y las fotos de los
    negocios saldrían a Anthropic (ley de datos: transferencia internacional y consentimiento). Son dos proyectos.
