# Estilos y plantillas

Guía para armar páginas completas con motion-kit. Para verlas: `npm run dev` y abrir `#estudio`
(probar combinaciones y «Sorpréndeme») o `#plantilla/<id>` (las 5 plantillas de ejemplo).

## Estilos

`<Estilo nombre="...">` viste todo lo que contiene: colores, letras, botones, tarjetas, títulos y una textura.
Las piezas del kit adentro (`Boton`, `Tarjeta`, efectos) toman el estilo solas.

| Estilo | Sello | Efecto sugerido | Texto | Transición de página | Sonido |
|---|---|---|---|---|---|
| `neon` | Brillo eléctrico, letreros | `rejilla` (suelo synthwave) | encender, glitch, onda | apagón | zumbido |
| `retro` | Arcade 80, píxeles, sombras duras | `tubo` (pantalla CRT) | máquina, caer, onda | cambio de canal | pitido |
| `rock` | Fotocopia, cinta, letras gruesas | `ecualizador` | temblor, impacto, glitch | corte con sacudón | golpe |
| `anime` | Viñetas, trama de puntos, contornos | `velocidad` (líneas) | impacto, caer, onda | barrido | destello |
| `pelicula` | Franjas, grano, títulos con serifa | `grano` | tráiler, máquina, encender | fundido a negro | proyector |

Opciones de `<Estilo>`:
- `textura` (sí por defecto)
- `cursor` (cursor propio, solo con mouse)
- `sonidos` y `vibracion` (desactivados por defecto; suenan o vibran al tocar un botón)
- `fuentes` (carga la fuente del estilo desde Google Fonts, licencia OFL; sin esto se usa una fuente del sistema parecida)
- `colores` (cambia variables sueltas, por ejemplo `{ "--mk-acento": "#00e0a0" }`)

Variables que fija cada estilo: `--mk-fondo`, `--mk-superficie`, `--mk-texto`, `--mk-acento`, `--mk-acento-2`,
`--mk-sobre-acento`, `--mk-acento-texto`, `--mk-fuente-titulo`, `--mk-fuente-texto`, `--mk-radio-boton`,
`--mk-radio-tarjeta`. También fija `--lm-*`, así lo de La Mente que esté adentro hereda los colores.

## Texto cinético

`<TextoCinetico como="h1" efecto="encender" texto="Abierto hasta tarde" />`

Efectos: `encender`, `glitch`, `maquina`, `impacto`, `temblor`, `caer`, `trailer`, `onda`. El lector de pantalla
lee el texto completo (`aria-label`); si el JS no carga o hay «reducir movimiento», se ve quieto y completo.

## Animación con el scroll

- `<AlScroll animacion="subir">`: avanza con el scroll, con CSS nativo (`animation-timeline: view()`).
  Animaciones: subir, aparecer, escalar, girar, desde-izquierda, desde-derecha, parallax, alejar.
- `<GaleriaHorizontal titulo={...} largo={2}>`: mientras la persona baja, la fila se mueve de lado.

**Ojo:** un ancestro con `overflow: hidden` (por ejemplo, un `main { overflow-x: hidden }` global) convierte ese
elemento en contenedor de scroll y congela estas animaciones. Usar `overflow: clip`, que recorta igual sin ese
problema. Sin soporte del navegador o con «reducir movimiento», todo se ve quieto y la galería queda como fila
deslizable con el dedo.

## Transiciones entre páginas

`transicionVista(() => setPagina("menu"), "apagon")` usa View Transitions. Tipos: fundido, deslizar, apagon,
canal, corte, barrido, cine. Sin soporte o con «reducir movimiento», el cambio es directo.

## Sorpréndeme

`sorprendeme({ estilo?, rubro?, semilla? })` devuelve una combinación (estilo, efecto, variante, texto, botón,
transiciones) que siempre se ve bien: sale de lo que combina con el estilo y, si el efecto es vistoso, el texto
es calmo. La misma semilla da la misma combinación, así se puede guardar.

## Plantillas como datos (recetas)

Una `Receta` describe una página completa: estilo, rubro, efecto, datos del negocio y secciones
(`portada`, `destacados`, `galeria`, `historia`, `testimonios`, `llamado`, `contacto`).
`<PaginaReceta receta={r} />` la dibuja. Hay 5 de ejemplo en `RECETAS`:

| id | Estilo | Rubro |
|---|---|---|
| `hamburgueseria-neon` | neón | comida |
| `barberia-retro` | retro | belleza |
| `sala-ensayo-rock` | rock | barrio |
| `academia-anime` | anime | clases |
| `cineclub-pelicula` | película | otro |

Sin foto, cada imagen es una ilustración del estilo (`imagenGenerada(estilo, tono)`); con `imagen: "https://..."`
se usa la foto real.

### Qué puede cambiar un cliente (propuesta, falta que Aquiles la confirme)

`EDITABLE_POR_CLIENTE` lista lo que proponemos abrir en el editor:
- Datos del negocio, textos de cada sección, botones (texto y enlace), ítems (agregar, quitar, foto, precio) y cifras.
- El color de acento.
- El efecto, solo entre los que combinan con el estilo (`ESTILOS[estilo].efectos`), y su variante.

Queda para el equipo: el estilo, el orden y el tipo de secciones, y las fuentes. Así un cliente no puede romper
el diseño, pero su página no se parece a la del vecino.

### Cómo encaja con La Mente (siguiente paso, no hecho)

La receta es JSON, así que puede vivir en `contrato/diseno.json` como `plantilla: Receta` (o solo `estilo`,
`efecto` y `variante` si las secciones las sigue armando La Mente). El servidor valida que `efecto` esté en
`EFECTOS` y que `estilo` esté en `ESTILOS`.

## Verificación

`node scripts/verificar-estilos.mjs http://localhost:5173` (Playwright) revisa, en las 5 plantillas:
- contraste WCAG de textos y botones,
- que no haya scroll horizontal a 360 px,
- que los títulos terminen visibles,
- que la galería se mueva con el scroll,
- que no haya errores de consola,
- que los keyframes solo animen `transform` y `opacity`,
- que el estudio funcione,
- y que con «reducir movimiento» todo quede quieto.

## Encabezados (la portada)

`<Encabezado>` es la portada de la página: lo primero que se ve y lo que más llama la atención. Todo son datos,
así que el cliente puede editarlo desde un formulario. Editor de ejemplo: `npm run dev` y abrir `#encabezados`.

**12 composiciones** (`composicion`):

| id | Cómo se ve | Va bien con |
|---|---|---|
| `centrado` | Todo al centro sobre el fondo animado | neón, anime, película |
| `izquierda` | Texto a la izquierda, el fondo respira a la derecha | todos |
| `dividido` | Texto y foto lado a lado (en celular la foto arriba) | todos |
| `gigante` | Título que ocupa todo el ancho | rock, película, anime |
| `tarjeta` | Foto de fondo y texto en una tarjeta de vidrio | neón, anime, película |
| `imagen` | Foto a pantalla completa con degradado | película, rock, neón |
| `letrero` | Título dentro de un cartel iluminado | neón, retro |
| `poster` | Título apilado y datos en columna, como afiche de gira | rock, película, anime |
| `boleto` | Entrada de cine con talón | película, retro, rock |
| `pantalla` | Dentro de un monitor antiguo | retro, neón |
| `vinetas` | Collage de paneles de cómic | anime, rock |
| `marquesina` | El título gigante corre detrás | rock, neón, anime, retro |

**7 entradas** (`entrada`): ninguna, cascada, deslizar, zoom, foco (se enciende la luz), telón (se abre) y golpe
(aparece y sacude). Sin JS todo se ve; con «reducir movimiento» todo aparece de inmediato.

**Textos:** el título usa `TextoCinetico`, que ahora tiene 11 efectos. Se sumaron `revelar` (sube detrás de una
máscara), `voltear` y `rebote`. Una palabra entre asteriscos (`Café de *especialidad*`) se resalta con el color
de acento; el lector de pantalla lee el título sin asteriscos.

**Ajuste automático:** si el cliente escribe una palabra muy larga, el título se achica solo hasta que quepa,
en cualquier ancho y con cualquier fuente.

**Otros datos:** `antetitulo`, `bajada`, `datos` (horario, dirección; en póster y boleto van en columna o en el
talón), `imagenes` (la primera para dividido, tarjeta e imagen; viñetas usa tres) y `efecto` (fondo animado).
`encabezadoAlAzar(estilo)` arma una combinación que le queda al estilo.

Nota técnica: los encabezados usan container queries, así que se adaptan al ancho donde estén (también dentro de
la vista previa del panel de La Mente), no solo al ancho de la pantalla.

## Packs de botones

`Boton` tiene ahora `forma`: pastilla, recto, tecla (3D que se hunde), ticket (con muescas), sello (girado, doble
borde), pixel (esquinas escalonadas), subrayado (enlace) y circulo (solo ícono; usar `aria-label`).

Un pack es la pareja principal + secundario lista para usar:
`<BotonesPack pack="ticket" principal={{ texto, href }} secundario={{ texto, href }} />`.

12 packs (`PACKS_BOTONES`): clasico, minimal, neon-tubo, arcade, tecla, sello, ticket, manga, vidrio, degradado,
flecha y borde. Cada estilo tiene uno por defecto (neón → neon-tubo, retro → arcade, rock → sello,
anime → manga, película → ticket).

## Lo que el cliente edita en la portada (propuesta)

Textos (antetítulo, título con palabra destacada, bajada, botones, datos), fotos, composición, entrada, efecto del
título y pack de botones. El editor marca con ★ lo que combina con su estilo. Se guarda un JSON como:

```json
{ "tipo": "portada", "composicion": "boleto", "entrada": "telon", "efectoTexto": "trailer", "pack": "ticket",
  "antetitulo": "Cine de culto", "titulo": "Esta noche, en *pantalla grande*", "bajada": "…",
  "boton": { "texto": "Comprar entrada", "href": "#entradas" }, "datos": ["Viernes", "20:30"] }
```

Verificación: `node scripts/verificar-encabezados.mjs http://localhost:5173`. Revisa:
- Las 12 composiciones en los 5 estilos, en escritorio y a 360 px: todo visible, sin desborde, con contraste WCAG y botones de 44 px.
- Las 7 entradas: cada una termina con todo visible.
- Los packs, la palabra destacada y el JSON.
- «Reducir movimiento».
