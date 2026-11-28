# Piezas del panel: del front de La Mente a motion-kit

Fase 3 de «Un solo motor» (plan `docs/superpowers/plans/2026-11-28-un-solo-motor-fase-3.md`). Cada pieza y cada conducta
que hoy vive en el front (`fronts/panel/src/components/Modulo.tsx` y `modulo.css`, `pages/temaPanel.css`,
`pages/barraLateral.css`), con su pieza de motion-kit, sus props y las variables que lee. Leído el 28-11-2026.

**Reglas para todas:**
- Leen `--mk-*`: el ADN y el detalle del catálogo de temas.
- El respaldo es el valor de hoy del front con «lamente». Cuando el catálogo tiene la variable, es el de la columna;
  cuando no (es `initial` en «lamente»), es el respaldo que el front pone en ese lugar.
- Se marcan con `data-mk-adorno` y aceptan `className`, `style` y las props de su elemento.
- **Lo que motion-kit no anima igual que el front** (solo `transform` y `opacity`):
  - las transiciones de `box-shadow`, `background-color` y `border-color` pasan a ser cambios al instante (solo
    `transform` se mueve);
  - el barrido de `SubirImagen` (`background-position` → una capa que se desliza con `transform`);
  - el revelado de la foto (`filter: blur saturate` → una capa encima que se desvanece y la foto que entra con
    `scale` y `opacity`).
- **El modo oscuro del panel** (`.dark .lm-mod`) sale de los colores del tema (`oscuro` de «lamente»), no de reglas
  aparte.

## Valores de «lamente» (catálogo)

`--mk-texto` `#1C1A22` · `--mk-suave` `#5E5A68` · `--mk-superficie` `#FFFFFF` · `--mk-fondo` `#FAF7F2` · `--mk-borde`
`#E7E1D8` · `--mk-acento` `#9333ea` · `--mk-sobre-acento` `#fff` · `--mk-cartel` `#ffc83d` · `--mk-sobre-sol` `#10223f` ·
`--mk-trazo` `2.5px solid var(--mk-texto)` · `--mk-radio-tarjeta` `16px` · `--mk-radio-boton` `10px` ·
`--mk-radio-campo` `12px` · `--mk-sombra` `6px 6px 0 var(--mk-texto)` · `--mk-sombra-suave` `3px 3px 0 var(--mk-texto)`
· `--mk-hundir` `translate(2px, 2px)` · `--mk-fuente-cartel` `"Dela Gothic One", "Outfit", "Arial Black", system-ui,
sans-serif` · `--mk-campo-borde`, `--mk-campo-pasar`, `--mk-campo-foco`, `--mk-campo-error`, `--mk-campo-alto`,
`--mk-fila-borde`, `--mk-fila-radio`, `--mk-boton-ancho`, `--mk-boton-sombra-suave`, `--mk-fantasma-borde` (sus valores, en
`variablesDeTema("lamente", { para: "panel" })`).

## Piezas

| Del front | De motion-kit | Props | Variables que lee (respaldo de «lamente») |
|---|---|---|---|
| `IconoModulo` (`.lm-mod-icono`) | `IconoCaja` | `tamano?: 36 \| 44 \| 56` (44); el ícono como hijo | trazo `--mk-trazo`; radio `--mk-radio-icono` (10px); fondo `--mk-cartel`; color `--mk-sobre-sol` (`#10223f`) |
| `BotonModulo` (`.lm-mod-boton`) | `BotonPanel tamano="grande"` | las de `button` | letra `--mk-fuente-cartel`, 1rem; relleno 10px 18px; fondo `--mk-cartel`; color `--mk-sobre-sol`; trazo `--mk-trazo`; radio `--mk-boton-radio-grande` (12px); sombra `--mk-sombra` (4px 4px 0 tinta en el módulo); al pasar `--mk-levantar` (translate(-1px,-1px)) y `--mk-sombra-pasar` (5px 5px 0 tinta); al tocar `--mk-hundir-grande` (translate(3px,3px)) y `--mk-sombra-hundida` (1px 1px 0 tinta); foco 3px `--mk-acento`; deshabilitado opacidad .55 |
| `BotonChico` (`.lm-mod-chico`) | `BotonPanel tamano="chico" tono?` | `tono?: "principal" \| "peligro"` | 600, .9rem; relleno 6px 14px; trazo; radio `--mk-pildora` (999px); fondo `--mk-superficie`; al pasar fondo `--mk-cielo` (`#eef8fd`); al tocar translateY(1px); `principal`: fondo `--mk-cartel`, color `--mk-sobre-sol`; `peligro`: borde y color `--mk-mal` (`#b42318`) |
| `EncabezadoModulo` (`.lm-mod` con `h2.lm-mod-titulo` y `.lm-mod-bajada`) | `CabezaSeccion` | `icono`, `titulo`, `bajada?`, `accion?` | título: `--mk-fuente-cartel`, 400, clamp(1.45rem, 1.2rem + .9vw, 1.9rem), alto 1.1, -0.01em; bajada `--mk-suave`, alto 1.5; el ícono en `IconoCaja` 44; la acción a la derecha desde 768 px |
| `ListaTarjetas` | `GrillaTarjetas` | `como?: "ul" \| "div"` (`ul`) | 1 columna; 2 desde 1024 px (lg); separación 1.25rem; sin viñetas |
| `TarjetaItem` (`.lm-mod-tarjeta`) | `TarjetaFila` | `foto?`, `icono?`, `titulo`, `estado?: { texto, tono }`, `detalle?`, `acciones?`, `pie?`, `como?: "li" \| "article"` (`li`) | fondo `--mk-superficie`; trazo; radio `--mk-radio-tarjeta` (14px en el módulo); sombra `--mk-sombra`; relleno 16px 18px; al pasar `--mk-levantar` y `--mk-sombra-pasar`; foto 56 con trazo y `--mk-radio-icono`; título `h3` 700 1.02rem; detalle `--mk-suave` .9rem; acciones abajo (margen auto) |
| Píldora de estado (`.lm-mod-estado`) | `Pastilla` | `tono: "verde" \| "gris" \| "naranjo" \| "morado" \| "rojo"` | .78rem 700; relleno 2px 10px; trazo; `--mk-pildora`; color `--mk-sobre-sol`; fondos `#c9f2d6`, `#e6e9ef`, `#ffd9b8`, `#e3d7ff`, `#ffd2d2` (como `--mk-estado-<tono>`) |
| `VacioModulo` (`.lm-mod-vacio`) | `Vacio` (existe) | — | ya en uso por el front (v0.6.0) |
| Copias de sección (8) | `Seccion` | `titulo`, `bajada?`, `accion?`, `children` | la hoja de `TarjetaFila` con su título `h2` en letra de cartel |
| Copias de selector (3) | `Selector` | `etiqueta`, `ayuda?`, `error?` y los hijos `option` | el `select` con lo de `Campo` (abajo) |

## Conductas

| Del front | En motion-kit | Qué hace (y con qué) |
|---|---|---|
| Campos de Chakra (`temaPanel.css`, «Los campos») | `Campo` (las reglas viven en la pieza; el control lo pone quien la usa) | radio `--mk-radio-campo`; borde `--mk-campo-borde`; fondo `--mk-campo-fondo` (superficie); color `--mk-texto`; cursor de texto `--mk-acento`; alto `--mk-campo-alto` (2.75rem); al pasar borde tinta y `--mk-campo-pasar`; con foco `--mk-campo-foco` y `--mk-campo-levantar` (translate(-2px,-2px)); con error borde `--mk-mal` y `--mk-campo-error` y tiembla una vez (ya lo hace); deshabilitado punteado, fondo mezcla y sin sombra; etiqueta 600; ayuda `--mk-suave`; error 600 `--mk-mal` con una señal «!» (círculo rojo de 1.05rem); casillas `accent-color: --mk-acento`, 1.05rem |
| Pestañas de sección | (se queda en el front: son de Chakra) | — |
| Títulos de sección (`h2.chakra-heading`) | `CabezaSeccion` y `Seccion` | en `--mk-fuente-cartel` |
| Subir fotos (`.mk-subir-*`) | `SubirImagen` | vacía: punteado 2px tinta 60 % sobre rayas fondo/superficie; radio `--mk-radio-foto` (14px); al pasar `--mk-levantar` y `--mk-sombra-chica` (4px 4px 0 tinta); al tocar translate(1px,1px); el ícono en su cuadradito de sol (22px, relleno 7px, trazo 2px, `--mk-radio-icono`) que se inclina al pasar; arrastrando: borde 2.5px `--mk-acento`, fondo acento 14 %, scale(1.03) y sombra 5px acento, el ícono salta (translateY(-5px) ida y vuelta); lista o subiendo: trazo y `--mk-sombra-chica`; subiendo: una franja de luz de `--mk-cartel` 55 % que la cruza (capa con `transform`); la foto entra revelándose (capa y `scale`/`opacity`); el ✓ de 48px en sol con trazo 2.5px y sombra 3px; error: borde y sombra 4px `--mk-mal`; Cambiar y Quitar como `BotonPanel` chico (Quitar con `--mk-mal`) |
| Destello de lo que llega (`[data-mk-destello]`) | `ListaViva` | marco `0 0 0 3px --mk-destello-color` (sol) y `0 0 0 5px --mk-texto` y un halo de sol; late dos veces (scale(1.025), .45s) |
| Barra lateral (`barraLateral.css`) | `BarraLateral` | ítem con `--mk-radio-boton`; ícono 28px en cuadradito (trazo 2px tinta, `--mk-radio-icono-chico` 8px), teñido con el color del grupo (`--mk-grupo` 18 % sobre superficie); sin módulo: punteado, transparente, con un «+» punteado a la derecha; al pasar: fondo `--mk-grupo` 10 %, el ícono se levanta (-1px, `--mk-sombra-mini`) y salta (translateY(-3px) rotate(-8deg)); la elegida: fondo tinta, letra `--mk-fondo`, sombra `--mk-elegida-sombra` (3px 3px 0 grupo), contorno 2px tinta, ícono en sol con pop (scale .6 rotate(-12deg) → normal); grupos con una rayita del color del grupo y la letra de cartel; contraída: solo íconos (los nombres quedan para el lector), grupos como una línea, punto de novedad; la barra es una hoja (superficie, trazo, `--mk-radio-tarjeta`, `--mk-sombra`) |

## Lo que se queda en el front

- `.lm-cabeza` (la cabecera oscura de la portada), `.lm-boton-sol` (el botón de la portada), `.lm-ajustes`,
  `.lm-paso-tarjeta` y `PasosEnPestanas`: son de pantallas de La Mente.
- Las pestañas de sección de Chakra (`.chakra-tabs__trigger`) y `.chakra-badge`.
- `--lm-grupo` y `--lm-paso`: el front los declara (el color de cada grupo y de cada paso). Las piezas leen
  `--mk-grupo`; el front lo declara junto con `--lm-grupo`.
- Las recetas de Chakra de botones que no son estas piezas (`theme.ts`).
