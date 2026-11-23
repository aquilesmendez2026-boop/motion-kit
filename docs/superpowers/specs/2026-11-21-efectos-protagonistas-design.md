# Efectos protagonistas: diseño

Fecha: 21-11-2026. Aprobado por Aquiles en el chat («si») sobre la propuesta de la sesión.

## Por qué

La Mente aloja muchas páginas y cada una lleva **un solo efecto protagonista** (regla de `08-decisiones.md`, 21-11).
Hoy hay unos 8 efectos, 9 estilos de letras y una escena hecha a medida (hamburguesería). Con cientos de páginas se
repetirían. Se necesita un catálogo grande, con variantes, que tome los colores de la paleta de cada página.
Los usan el equipo (al armar páginas) y los clientes (al elegir en el editor).

## Metas

- 12 efectos nuevos en la primera tanda: una **escena** y un **fondo vivo** por cada uno de los 6 rubros
  (`comida`, `belleza`, `salud`, `clases`, `barrio`, `otro`).
- 3 variantes por efecto (velocidad, densidad, dirección o forma): 36 combinaciones.
- Se ven bien con las 12 paletas de La Mente, incluida Noche, sin tocar el efecto.
- Un registro (`EFECTOS`) con id, familia, rubros sugeridos y ánimo (sobrio o vistoso), para que el editor y el
  contrato de La Mente los listen.

## No metas

- No reemplazar los efectos que La Mente ya tiene (aurora, barrido, foco, rayos, parallax, letras, cinta).
- No tocar el código ni el contrato de La Mente en esta tanda. El adaptador va después.
- Sin librerías de animación, sin GSAP, sin canvas ni WebGL.

## Anti-metas (fallaría aunque funcione)

- Un efecto que tape el texto o baje el contraste de la página.
- Un efecto que deje la página vacía con «reducir movimiento» o si falla la carga.
- Un efecto que trabe un teléfono de gama media.

## Restricciones

- Se anima solo `transform` y `opacity`.
- Colores por variables: `--mk-*` y, si no existen, `--lm-acento`, `--lm-fondo`, `--lm-superficie`; con valores
  de respaldo. El texto usa `currentColor`.
- Cada efecto es una capa `aria-hidden`, detrás del contenido, que no recibe punteros.
- Se pausa fuera de pantalla (`data-quieto`) y con `prefers-reduced-motion` queda una composición quieta que se ve bien.
- Carga perezosa: un efecto por archivo, cargado solo donde se usa.
- Dibujos propios, simples (SVG o CSS). Nada que imite un personaje o marca.
- Peso objetivo: menos de 4 KB comprimido por efecto.

## Enfoques considerados

| Enfoque | Resultado |
|---|---|
| A. Escribirlos dentro de `packages/ui` de La Mente | Más acoplado; el resto de los proyectos no los usa. Descartado. |
| **B. Escribirlos en `motion-kit` y que La Mente los cargue por registro** | **Elegido.** Un solo lugar, sirve a todos los proyectos. Riesgo: el build de Amplify necesita instalar el kit desde GitHub (repo privado pide permiso); lo simple es hacerlo público. |
| C. Prototipar en el kit y copiar los buenos | Se desincroniza. Descartado. |

## Asignación sugerida por rubro

| Rubro | Escena | Fondo |
|---|---|---|
| comida | `cafe` (vapor y granos) | `niebla` |
| belleza | `petalos` | `burbujas` |
| salud | `pulso` (anillos que laten) | `olas` |
| clases | `abecedario` (letras y números que suben) | `puntos` (rejilla que respira) |
| barrio | `letrero` (neón «Abierto») | `lluvia` (rayas de luz) |
| otro | `cometas` | `estrellas` |

## Lo que queda al constructor

Valores finos de cada animación (tiempos, tamaños, densidad) y los dibujos exactos, mientras cumplan las restricciones.
