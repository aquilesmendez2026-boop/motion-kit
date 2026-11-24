# Director, fase 1: el núcleo

Fecha: 24-11-2026. Aprobado por Aquiles: «si a todo, haz el commit y sigue con la fase 1».
Viene de `docs/superpowers/specs/2026-11-24-motor-de-animacion-analisis-y-plan.md` (secciones 4, 5 y 8).

## Para qué

Que un movimiento sea un **dato** (una partitura) y no una pieza escrita a mano. La fase 0 mostró que se puede: mismo
resultado, 1,6 KB, sin perder fluidez. Esta fase construye la versión de verdad, dentro del paquete y con pruebas.

Quién lo usa en esta fase: nosotros, desde la vitrina. La Mente todavía no. El contrato sale marcado **versión 0,
experimental**: puede cambiar hasta la fase 2 y La Mente no lo copia aún.

## Qué se entrega

- Una entrada nueva del paquete, `motion-kit/director`, con tope de **10 KB** (gzip, al cargar).
- El modelo de la Partitura (v0), su validador y su contrato (`contrato/partitura-motionkit.json`).
- El Director, con tres ejecutores: tiempo, scroll y compás.
- Seis señales: `verse` (tiempo), `vista`, `scroll`, `velocidad`, `puntero` y `estado`.
- Las reglas de la casa dentro del motor.
- Seis partituras de ejemplo y una vitrina `#director` donde se ven, se repiten y se editan como dato.
- Una prueba genérica (`scripts/verificar-director.mjs`) que revisa las reglas de la casa en **cualquier** partitura.

No entra en esta fase: el lenguaje en texto, traspasar piezas existentes, la capa gráfica, los peldaños continuos y
el Estudio. Nada de lo que ya existe cambia.

## Anti metas

- Que el Director rinda menos o pese más que lo hecho a mano.
- Que una partitura pueda romper una regla de la casa.
- Que una partitura guardada por un usuario pueda ejecutar algo o frenar la página.
- Que se convierta en un lenguaje de programación.

## Caminos considerados

| Camino | Decisión |
|---|---|
| **Traducir cada movimiento a animaciones nativas del navegador y dejar un solo bucle propio para lo que sigue al dedo** | Elegido. Es lo que probó la fase 0 |
| Un bucle propio que calcule todo cuadro a cuadro (como los motores clásicos) | Descartado: gasta el hilo principal en lo que el navegador hace solo |
| Generar CSS (hojas de estilo) desde la partitura | Descartado por ahora: no permite detener, repetir ni soltar una animación desde el motor, y choca con la CSP al inyectar estilos. Puede volver en la fase 2 como paso de «compilar al guardar» |

## El modelo (Partitura v0)

```ts
interface Partitura {
  version: 0;
  nombre?: string;
  escenas: Escena[];        // a lo más 12
}
```

### Actores

Un actor es un **nombre de parte**. El Director lo busca dentro de la raíz como `[data-mk-parte="nombre"]` (la misma
marca que ya usan los relatos). Quien monta la partitura puede pasar además un mapa de nombres a selectores, para
piezas que no llevan la marca (el encabezado de hoy). **La partitura no trae selectores:** así un dato guardado por un
usuario no puede apuntar a cualquier cosa.

`por` reparte un movimiento entre las piezas de un actor, una tras otra:

| `por` | Qué recorre |
|---|---|
| (nada) | El actor entero (si el nombre calza con varios elementos, cada uno) |
| `hijo` | Sus hijos directos |
| `palabra` | Sus palabras. El Director corta el texto |
| `letra` | Sus letras (una bandera o un emoji con tono quedan enteros) |

### Qué puede cambiar

Solo cinco cosas (`Cambio`): `x`, `y` (px, o un porcentaje del propio tamaño como `"-14%"`), `escala`, `giro` (grados)
y `opacidad`. No hay más: es la regla del repo hecha modelo.

### Escenas

Cada escena dice **con qué señal** se mueve.

| `con` | Cuándo corre | Cómo |
|---|---|---|
| `verse` | Una vez, cuando la raíz entra a la vista (`repetir: true` la corre cada vez) | Por tiempo |
| `estado` | Mientras un actor está `apuntado`, `enfocado` o `apretado`; al salir, se devuelve | Por tiempo |
| `vista` | Sigue al scroll mientras la raíz entra (`entrada`), sale (`salida`) o cruza la pantalla (`paso`) | Atada al scroll |
| `scroll` | Sigue al avance de la página entera | Atada al scroll |
| `puntero` | Sigue al dedo o al cursor sobre la raíz, con resorte | Compás |
| `velocidad` | Sigue a la velocidad del scroll, con resorte, y vuelve a cero | Compás |

Un paso de una escena por tiempo:

```ts
{ actor: "titulo", por: "palabra", mascara: true,
  de: { y: "135%" },            // desde dónde (lo que falta: como está en la página)
  a:  { ... },                  // hasta dónde (opcional)
  dura: 800,                    // ms
  curva: "suave",               // suave | lineal | entra | sale | vaiven | resorte
  cada: 90,                     // ms entre una pieza y la siguiente
  en: 150 }                     // cuándo parte: ver abajo
```

**Cuándo parte un paso** (uno de los tres; por defecto `en: 0`):

- `en: N` — a los N ms de empezar la escena.
- `luego: N` — N ms después de que **termina** el paso anterior.
- `junto: N` — N ms después de que **empieza** el paso anterior.

`curva: "resorte"` usa el resorte del estilo de la página (`--mk-resorte-curva` y `--mk-resorte-ms`); sin estilo
alrededor, una curva con rebote corto. `mascara: true` (solo con `palabra` o `letra`) mete cada pieza en una caja que
la recorta: es lo que hace «revelar».

Un paso atado al scroll: `{ actor, por?, de?, a?, entre?: [0.6, 1], curva? }`. `entre` es el tramo de la señal (de 0 a
1) en que ocurre.

Un paso que sigue (puntero o velocidad): `{ actor, x?, y?, giro?, escala?, opacidad?, resorte?: "suave" | "firme" |
"elastico" }`. Los números son cuánto se mueve con la señal al máximo.

### Reglas del modelo (las revisa el validador)

- **Un actor sigue a una sola señal continua.** Si dos escenas de `vista`, `scroll`, `puntero`, `velocidad` o `estado`
  mueven al mismo actor, la partitura no vale. Para sumar dos movimientos se usan dos actores (uno adentro del otro). Las
  escenas por tiempo se suman a las continuas sin problema: escriben en canales distintos.
- **La opacidad de un actor es de una sola escena.**
- **Los movimientos de `estado` son chicos:** hasta 6 px, entre 0,94 y 1,08 de escala y 3 grados. Así lo que se
  aprieta no se escapa del dedo.
- **Topes:** 12 escenas, 24 pasos por escena, 10 s por paso, 1 s entre piezas, 20 s por escena, 200 piezas por paso
  (si un texto tiene más letras, se mueve entero), ±2000 px, ±300 %, escala de 0 a 4, giro de ±720°.
- Un campo que no existe, un valor fuera de lista o un actor sin nombre válido: la partitura no vale, con un mensaje
  en español que dice dónde.

`validarPartitura(dato)` devuelve `{ ok: true, partitura }` o `{ ok: false, errores }`, como las recetas.

## El Director

```ts
montar(raiz, partitura, { partes?, nivel?, reloj? }) → { desmontar(), irA(ms), avanzar(ms), señal(nombre, valor) }
```

Y para React: `<ConPartitura partitura={…} partes={…} nivel={…}>` y el gancho `usePartitura`.

### Los tres ejecutores

1. **Tiempo:** animaciones nativas (Web Animations). Parten al verse la raíz. Al terminar se sueltan, salvo las que
   terminan en un estado distinto al natural (`a`), que quedan sosteniéndolo.
2. **Scroll:** líneas de tiempo de scroll nativas. Si el navegador no las tiene, la misma animación se mueve a mano
   desde el compás.
3. **Compás:** un solo bucle para toda la partitura. Duerme si ninguna señal cambia.

Canales, para que se sumen sin pisarse: `verse` escribe en `transform`; lo atado al scroll, lo que sigue al dedo y
`estado`, en `translate`, `rotate` y `scale`.

### Las reglas de la casa

1. Solo posición, tamaño, giro y opacidad (lo garantiza el modelo).
2. Nada queda escondido para siempre: una escena `verse` parte apenas la raíz se ve; sin observador, de inmediato. Si
   el Director no llega a montarse, la página se ve entera.
3. Lo que se puede apretar no se mueve bajo el cursor ni bajo el foco: su entrada se detiene donde va y sigue al
   salir. Lo que sigue al cursor se congela mientras se apunta a un enlace o botón dentro del actor.
4. Fuera de la vista o con la pestaña oculta: las animaciones por tiempo se detienen y el compás duerme.
5. Con «reducir movimiento» o nivel `quieto`: ninguna animación. Todo queda en su estado final. Si la preferencia
   cambia con la página abierta, el Director se rearma.
6. En nivel `liviano`: las escenas por tiempo solo funden (sin mover) y duran a lo más 400 ms; no hay escenas de
   `puntero` ni de `velocidad`.
7. Al desmontar no queda nada: ni animaciones, ni oyentes, ni observadores, ni el texto cortado.

### Cortar el texto sin romper React

El texto de la página lo dibuja React. Si el Director reemplazara sus nodos, React fallaría al actualizarlos. Por
eso:

- El nodo de texto original **se queda en su lugar, vacío**, y a su lado va un `span` con las piezas.
- Si React cambia ese texto, el Director lo nota, corta de nuevo y vuelve a vaciar el original.
- Al desmontar, el original recupera su texto y el `span` se va.
- El `span` va oculto para lectores de pantalla y a su lado va el texto entero, invisible (precisión 7).
- Cada pieza es un bloque en línea (un elemento en línea no se puede mover: es el error que destapó la fase 0).

### Reloj para pruebas

Con `reloj: "manual"` el Director no avanza solo. `irA(ms)` lleva las escenas por tiempo a un instante; `avanzar(ms)`
da pasos al compás; `señal("puntero", { x, y })` pone una señal a mano. Con eso una prueba detiene todo en un
instante y mide, sin esperas.

## Las seis partituras de ejemplo

| Nombre | Qué muestra |
|---|---|
| `portada` | La entrada de un encabezado: `verse` con máscara por palabra, y `vista` de salida |
| `tarjetas` | Una grilla que entra de a una (`por: "hijo"`, `luego` y `junto`) |
| `paralaje` | Capas que se mueven distinto al cruzar la pantalla (`vista`, tramo `paso`) |
| `iman` | Un bloque que sigue al cursor con resorte (`puntero`) |
| `inercia` | Bloques que se inclinan con la velocidad del scroll (`velocidad`) |
| `boton` | Un botón que responde al apuntarlo y al apretarlo (`estado`) |

## Pruebas

- **Unitarias** (`pruebas/director.test.ts`): el validador (cada regla y cada tope), el calendario de pasos (`en`,
  `luego`, `junto`, `cada`), los fotogramas de cada canal, los tramos de scroll, las señales y el corte de texto.
- **Genérica** (`scripts/verificar-director.mjs`), para cada partitura de ejemplo y para cualquiera que se le pase:
  1. con movimiento reducido no hay animaciones y todo está en su lugar;
  2. al terminar no quedan animaciones por tiempo ni cuadros pedidos en reposo;
  3. fuera de la vista todo se detiene;
  4. un enlace o botón que está entrando se detiene bajo el cursor;
  5. al desmontar no quedan animaciones, oyentes, observadores ni texto cortado, y el texto es el original;
  6. solo se animan las propiedades permitidas;
  7. sin líneas de tiempo de scroll, el respaldo da los mismos valores;
  8. a 360 px nada se sale de lado en ningún instante;
  9. el texto para lectores de pantalla es el original;
  10. dos veces el mismo instante dan el mismo cuadro.
- **React:** cambiar el texto de un actor cortado, y montar y desmontar en modo estricto, no lanza errores.
- **Peso:** `npm run peso` con la entrada nueva y su tope.

## Precisiones (después de la lectura de un revisor, 24-11)

Un revisor leyó este diseño como quien tendría que construirlo. Sus doce preguntas eran de «cómo», así que las
resolví yo. Quedan así:

1. **Tiempo y señal continua sobre el mismo actor se multiplican, y eso es lo que se quiere.** `transform` y
   `translate`/`rotate`/`scale` se componen. Los porcentajes se miden contra la propia pieza en los dos canales. Con
   `por`, una escena de scroll mueve las piezas, igual que una por tiempo.
2. **`estado` escribe en el canal de las continuas** (`translate`, `rotate`, `scale`), no en `transform`. Así se suma a
   una entrada que quedó sosteniendo su estado final. Por lo mismo, cuenta en la regla «un actor, una sola señal
   continua»: `vista`, `scroll`, `puntero`, `velocidad` y `estado` son un grupo, y un actor admite una sola escena de
   ese grupo.
3. **Un estado final sostenido no se mueve**, así que no choca con la regla de lo que se aprieta.
4. **`repetir`:** al salir de la vista, la escena vuelve a su inicio y espera; al volver a verse, corre de nuevo.
5. **«Entra a la vista»** es: se ve al menos un 15 % de la raíz, o la raíz ya ocupa media pantalla (para raíces muy
   altas). Todas las escenas `verse` de una partitura parten juntas. El orden es entre pasos, no entre escenas.
6. **El corte de texto recorre todos los nodos de texto del actor**, también los de adentro de un `em` o un enlace.
   Los espacios quedan fuera de los bloques, así las líneas se parten donde mismo. Con `letra`, cada palabra va además
   en una caja que no se parte. Los números de pieza siguen el orden del documento.
7. **Para lectores de pantalla, siempre igual:** el `span` con las piezas va oculto para ellos y a su lado va el texto
   entero, invisible y sin poder seleccionarse (así al copiar no sale dos veces). Vale para `palabra` y para `letra`.
8. **Cómo se entera el Director de que React cambió un texto:** un observador de cambios sobre el actor. Sus propias
   escrituras no cuentan. El corte se hace antes del primer pintado (`useLayoutEffect`), para que el texto no
   aparezca entero y después salte.
9. **Reloj manual:** no hay observador de vista (todo cuenta como visible). `irA(ms)` mueve solo las escenas `verse`.
   Las señales continuas se ponen con `señal("vista" | "scroll" | "puntero" | "velocidad", valor)`, y las escenas de
   scroll usan el camino de respaldo, movido por ese valor. El compás avanza solo con `avanzar(ms)`, en pasos fijos.
   La comparación «respaldo igual al nativo» se hace con el reloj normal, en dos páginas.
10. **Niveles:** los tres que ya tiene el repo (`completo`, `liviano`, `quieto`; tipo `NivelEscena`). «Reducir
    movimiento» es `quieto` y gana siempre. En `liviano`: un paso por tiempo con `de` pasa a ser un fundido (desde su
    `opacidad`, o desde 0 si no la trae); uno solo con `a` conserva su opacidad, y si no la trae se salta; duran a lo
    más 400 ms y esperan a lo más 40 ms entre piezas. En `vista` y `scroll` sobrevive solo la opacidad. No hay
    `puntero` ni `velocidad`. `estado` sigue igual (es chico y lo manda la persona).
11. **Qué es «lo que se puede apretar»:** `a`, `button`, `input`, `select`, `textarea`, `summary`, `label`,
    `[role=button]` y `[tabindex]`. Cuenta apuntar, enfocar y apretar (también con el dedo). Se detienen las piezas que
    lo contienen o que están dentro de él, no el paso entero.
12. **Un actor sin elementos no es un error:** ese paso no hace nada. El Director busca los actores al montar; si el
    contenido llega después, quien lo usa vuelve a montar (`rearmar()`, o la prop `clave` de `ConPartitura`).
13. **Lo que se sale de lado:** el motor no puede saberlo (depende de la página). `ConPartitura` recorta a lo ancho por
    defecto (`recortar`), para que una entrada que viene desde un lado no agregue scroll horizontal en el teléfono.
    `montar` solo no recorta nada. La revisión 8 de la prueba genérica mira las partituras de ejemplo.
14. **El contrato se genera desde las mismas listas y topes que usa el validador** (como los otros dos), y
    `npm run contrato -- --revisar` lo vigila. Solo se acepta `version: 0`.
15. **Peso:** todo va en la entrada. Si pasara de 10 KB, antes de recortar funciones se bajan aparte el corte de texto
    y el compás, que no todas las partituras usan.

## Decisiones mías que Aquiles puede cambiar

- Los nombres en el dato van en español (`escenas`, `con`, `actor`, `de`, `a`, `dura`, `cada`, `luego`, `junto`).
- La partitura no trae selectores: solo nombres de partes.
- Las escenas de `estado` quedan limitadas a movimientos chicos.
- El componente de React se llama `ConPartitura`.
- El validador viaja en la misma entrada (`motion-kit/director`) y cuenta para su tope.
- La prueba desechable `prototipos/fase0/` se borra cuando la vitrina `#director` tenga la portada.

## Lo que queda para quien construye

Los valores exactos de las curvas con nombre y de los tres resortes, el aspecto de la vitrina y los textos de los
mensajes de error.
