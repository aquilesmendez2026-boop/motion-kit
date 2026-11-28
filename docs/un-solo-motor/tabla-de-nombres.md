# Tabla de nombres: de las variables de La Mente al ADN de motion-kit

Fase 0 de «Un solo motor» (`docs/superpowers/specs/2026-11-28-un-solo-motor-design.md`). Dice a qué variable `--mk-*`
va cada variable del front de La Mente. La revisa `npm run tabla`, que lee el front (solo lectura) y falla si aparece
una variable que no está aquí: así la tabla sigue al día aunque el front sume temas.

Destinos:
- `--mk-…`: la variable del ADN que la reemplaza. En la fase 1 el front la traduce (un archivo por front); en la fase 3
  (panel) y la 4 (página) las piezas leen `--mk-*` directo y la variable de La Mente se borra.
- **fase 2 (firma)**: es parte de la firma de un tema; pasa al contrato de temas en la fase 2.
- **fase 3 (pieza)**: es un detalle de una pieza del panel (botón, campo, fila, ícono); pasa con esa pieza en la fase 3.
- **se queda**: es distribución de una pantalla o una marca interna del front; no es del ADN.

Leído del front el 28-11-2026: `packages/ui/src`, `fronts/pagina-publica/src` y `fronts/panel/src` (sin pruebas).

## Color

| Variable de hoy | Destino | Nota |
|---|---|---|
| `--lm-fondo` | `--mk-fondo` | página (paleta) |
| `--lm-superficie` | `--mk-superficie` | |
| `--lm-texto` | `--mk-texto` | |
| `--lm-textoSuave` | `--mk-suave` | |
| `--lm-borde` | `--mk-borde` | |
| `--lm-acento` | `--mk-acento` | |
| `--lm-sobreAcento` | `--mk-sobre-acento` | |
| `--lm-sol` | `--mk-cartel` | panel: el amarillo de carteles y foco |
| `--lmt-sol` | `--mk-cartel` | |
| `--lmt-sobre-sol` | `--mk-texto` | la tinta sobre el amarillo |
| `--lmt-acento` | `--mk-acento` | cada tema del panel |
| `--lmt-sobre-acento` | `--mk-sobre-acento` | |
| `--lmt-tinta` | `--mk-texto` | |
| `--lmt-tinta-suave` | `--mk-suave` | |
| `--lmt-hoja-fondo` | `--mk-superficie` | |
| `--lmt-campo-fondo` | `--mk-superficie` | |
| `--lmt-fantasma-borde` | fase 3 (pieza) | borde del botón fantasma |
| Chakra `fondo` | `--mk-fondo` | ya traducido en `theme.ts` |
| Chakra `superficie` | `--mk-superficie` | ya traducido |
| Chakra `tinta` | `--mk-texto` | ya traducido |
| Chakra `tinta-suave` | `--mk-suave` | ya traducido |
| Chakra `borde` | `--mk-borde` | ya traducido |
| Chakra `purple-600` | `--mk-acento` | ya traducido |
| Chakra `green-600` | `--mk-bien` | ya traducido |
| Chakra `red-600` | `--mk-mal` | ya traducido |

## Forma

| Variable de hoy | Destino | Nota |
|---|---|---|
| `--lmt-trazo` | `--mk-trazo` | `2.5px solid <tinta>` en «lamente» |
| `--lm-trazo` | `--mk-trazo` | alias del panel |
| `--lmt-hoja-borde` | `--mk-trazo` | |
| `--lmt-hoja-radio` | `--mk-radio-tarjeta` | hojas, globos, tarjetas |
| `--lmt-sombra` | `--mk-sombra` | `6px 6px 0 <tinta>` |
| `--lmt-hoja-sombra` | `--mk-sombra` | |
| `--lmt-boton-radio` | `--mk-radio-boton` | |
| `--lm-boton` | `--mk-radio-boton` | página: la forma de los botones de la marca |
| `--lmt-boton-sombra` | `--mk-sombra-suave` | `3px 3px 0 <tinta>` |
| `--lmt-boton-hundir` | `--mk-hundir` | `translate(2px, 2px)` |
| `--lmt-campo-radio` | `--mk-radio-campo` | |
| `--lmt-boton-ancho` | fase 3 (pieza) | ancho del trazo del botón |
| `--lmt-boton-sombra-suave` | fase 3 (pieza) | botón fantasma |
| `--lmt-boton-radio-grande` | fase 3 (pieza) | |
| `--lmt-hundir-grande` | fase 3 (pieza) | |
| `--lmt-pildora` | fase 3 (pieza) | |
| `--lmt-levantar` | fase 3 (pieza) | al pasar el mouse |
| `--lmt-sombra-pasar` | fase 3 (pieza) | |
| `--lmt-sombra-chica` | fase 3 (pieza) | |
| `--lmt-sombra-mini` | fase 3 (pieza) | |
| `--lmt-sombra-hundida` | fase 3 (pieza) | |
| `--lmt-elegida-sombra` | fase 3 (pieza) | |
| `--lmt-cabeza-sombra` | fase 3 (pieza) | `EncabezadoModulo` → `CabezaSeccion` |
| `--lmt-radio-icono` | fase 3 (pieza) | `IconoModulo` |
| `--lmt-radio-icono-chico` | fase 3 (pieza) | |
| `--lmt-radio-foto` | fase 3 (pieza) | |
| `--lmt-fila-borde` | fase 3 (pieza) | `TarjetaItem` |
| `--lmt-fila-radio` | fase 3 (pieza) | |
| `--lmt-campo-borde` | fase 3 (pieza) | `Campo` |
| `--lmt-campo-alto` | fase 3 (pieza) | |
| `--lmt-campo-pasar` | fase 3 (pieza) | |
| `--lmt-campo-foco` | fase 3 (pieza) | |
| `--lmt-campo-error` | fase 3 (pieza) | |
| `--lmt-campo-levantar` | fase 3 (pieza) | |

## Letra

| Variable de hoy | Destino | Nota |
|---|---|---|
| `--lmt-cartel` | `--mk-fuente-cartel` | ya traducido en el panel |
| `--lm-fuenteTitulo` | `--mk-fuente-titulo` | |
| `--lm-fuenteTexto` | `--mk-fuente-texto` | |
| `--lm-tituloPeso` | fase 2 (firma) | |
| `--lm-tituloMayusculas` | fase 2 (firma) | |
| `--lm-tituloEspaciado` | fase 2 (firma) | |
| `--lm-tituloBrillo` | fase 2 (firma) | |

## Ritmo

El front no tiene hoy una variable de ritmo. La página tiene el ajuste `entrada` (`ninguna`, `suave`, `escena`) por
bloque, que es otra cosa (cómo entra un bloque) y pasa con el catálogo en la fase 4. El panel parte con `--mk-ritmo-*`
sin definir (el ritmo de hoy, «vivo»).

## Firma de temas y marcas de pantalla

| Variable de hoy | Destino | Nota |
|---|---|---|
| `--lmt-mantel` | fase 2 (firma) | tema «picada» |
| `--lmt-cielo` | fase 2 (firma) | |
| `--lmt-poste` | fase 2 (firma) | tema «barberia» |
| `--lmt-pulso` | fase 2 (firma) | |
| `--lm-grupo` | se queda | el color de cada grupo de la barra lateral |
| `--lm-paso` | se queda | el color de cada paso en las tarjetas de pasos |
| `--lm-hueco` | se queda | distribución de `PreciosLista` |

## Temas (se juntan en la fase 2)

| De dónde | Ids |
|---|---|
| Página: paletas (`contrato-diseno.json`) | clasica, arena, bosque, oceano, terracota, ciruela, noche, menta, neon, papel, rock, rustico |
| Página: temas | clasico, papel, rock, rustico, neon, mano, retro, bruto, deco, andino, hamburgueseria, peruano |
| Página: mezclas | 24 (cafe-de-barrio, hamburguesa-de-noche, cocina-de-la-casa, …) |
| Panel: `data-tema-panel` | lamente, barberia, calma, cancha, clinica, cuaderno, cultivo, noche, pastel, patitas, picada, rock, salon, taller |
| motion-kit: `ESTILOS` | boton, neon, retro, rock, anime, pelicula |

Repetidos a mirar en la fase 2: `rock` (los tres), `neon` (página y motion-kit), `noche` (paleta y panel), `retro`
(página y motion-kit), `papel` (paleta y tema).
