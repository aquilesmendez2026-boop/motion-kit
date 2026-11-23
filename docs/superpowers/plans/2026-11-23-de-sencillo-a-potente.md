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
| 3. Paquete v0.2.0 | Entradas separadas (`motion-kit/encabezado`, `/escena`), peso del JS medido por entrada con tope, CSS en archivo de respaldo, etiqueta en GitHub | La Mente lo puede instalar desde la etiqueta y baja solo el encabezado |
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
