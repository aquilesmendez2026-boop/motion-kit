# Luz y materia — plan de construcción

> **Para quien lo ejecute:** se ejecuta con superpowers:executing-plans, tarea por tarea, en esta sesión. Cada paso
> lleva su prueba primero.

**Meta:** una sola luz por página (`Luz`) y superficies que le responden (`Materia`), con el libro, el carrusel, las
tarjetas y los botones mejorados dentro de ella, y dos piezas nuevas.

**Cómo:** la luz son variables CSS en la raíz de `Luz`; cada superficie lleva capas ya dibujadas (sombra y brillo)
que solo se corren, se agrandan y se funden. Entrada nueva `motion-kit/luz`.

**Con qué:** React 19, TypeScript, CSS; pruebas con `node:test` y Playwright (Chromium y WebKit).

**Diseño:** `docs/superpowers/specs/2026-11-24-luz-y-materia-design.md` (con sus 19 precisiones).

## Reglas de todo el plan

- Sin dependencias nuevas. Sin `Math.random`. Sin modelos de IA.
- En lo que se anima, solo `transform`, `translate`, `scale`, `rotate` y `opacity`. `box-shadow`, `filter` y
  `background` pueden estar puestos, pero no cambian cuadro a cuadro.
- Fuera de una `Luz` nada cambia de aspecto. Todo CSS nuevo en piezas que ya existen va bajo `[data-mk-luz]`.
- Topes (KB gzip al cargar): `motion-kit` 80, `encabezado` 35, `pagina` 17, `momentos` 13, `escena` 16, `receta` 10,
  `director` 10, `partitura` 9, y **`luz` 8** (fijado por Aquiles). Ninguno se sube.
- Con «reducir movimiento», ahorro de datos o nivel `liviano`, la luz queda fija.
- Quieta la página, no se pide ningún cuadro.
- El texto bajo el brillo más fuerte conserva un contraste de 4,5 a 1.
- Las capas decorativas llevan `aria-hidden` y no reciben toques.
- Tiene que notarse a la primera, en un teléfono de 390 px.
- Español de Chile, frases cortas. Sin commits hasta la orden de Aquiles.
- No editar `src/` ni `demo/` mientras corre una prueba visual.

## Lo que hay que mirar en la revisión final

1. **Una página larga con muchas superficies:** en reposo no se pide ningún cuadro; al desmontar no queda ningún
   escuchador; una `Luz` dentro de otra manda en su zona.
2. **Contenido difícil en una `Materia`:** texto largo, una foto, un enlace con foco, fondo claro y fondo oscuro: el
   contraste se mantiene, el foco se ve y nada tapa los toques.
3. **Página sin `Luz`:** libro, carrusel, tarjetas y botones se ven igual que en `v0.4.0`, y las entradas que ya
   existían no suben al cargar.
4. **Entradas raras:** `rango` que no es número, `desde` con basura, `altura` 99, un `tipo` que no existe, `hora` sin
   reloj válido, sin `window` (servidor): no lanza y cae al valor por defecto.
5. **Estilos y motores:** un `Estilo` adentro o afuera de la `Luz` (retro, anime); WebKit sin reflejo ni `cos()`;
   imprimir.

---

### Tarea 1: la luz

**Archivos:** crear `src/luz/calculo-luz.ts`, `src/luz/seguir-luz.ts`, `src/luz/Luz.tsx`, `src/luz/css.ts`,
`src/entradas/luz.ts`, `pruebas/luz.test.ts`, `demo/Luz.tsx`, `scripts/verificar-luz.mjs`. Tocar `vite.config.ts`,
`package.json`, `scripts/medir-paquete.mjs`, `scripts/generar-css.mjs`, `scripts/probar-paquete.mjs`,
`scripts/verificar-cambios.mjs`, `demo/main.tsx`, `demo/App.tsx`.

**Entrega:**

- `REPOSO = { x: -0.45, y: -0.8 }`, `RANGO = 0.35`.
- `limpiarLuz(v: unknown, siNo: Punto): Punto` — cada eje acotado a [-1, 1]; lo que no es número, `siNo`.
- `luzAhora(reposo: Punto, senal: Punto, rango: number): Punto` — `reposo + senal × rango`, acotado.
- `luzDeLaHora(fecha: Date): { x: number; y: number; tinte: string; fuerza: number }`.
- `sombraDe(luz: Punto, altura: number): { x: number; y: number; escala: number; opacidad: number }` (px).
- `ALTURAS = 5` (0 a 4).
- `<Luz sigue? rango? desde? como? …>` pone `data-mk-luz`, `--mk-l0x`, `--mk-l0y`, `--mk-lx`, `--mk-ly` y, con
  `"hora"`, `--mk-luz-tinte` y `--mk-luz-fuerza`.
- `usePermisoInclinacion(): { hacePedir: boolean; pedir: () => Promise<boolean> }`.

- [ ] **Paso 1: pruebas calculables** (`pruebas/luz.test.ts`), y verlas fallar:
  - `luzAhora(REPOSO, {x: 1, y: 1}, 0.35)` es `{x: -0.1, y: -0.45}`; con rango 5 queda acotada a 1; con `NaN`, el
    reposo.
  - con el reposo y el rango por defecto, ninguna señal de -1 a 1 cambia el signo de `x` ni de `y`.
  - `luzDeLaHora` a las 8:00 da `x < 0`; a las 18:00, `x > 0`; a las 13:00, `|x| < 0.2` y la `y` más alta del día;
    a las 2:00, `fuerza` 0,6; la misma fecha da siempre lo mismo; una fecha inválida da el reposo y fuerza 1.
  - `sombraDe`: altura 0 da corrimiento 0; a más altura, más corrimiento, más escala y menos opacidad; el
    corrimiento va al lado contrario de la luz; altura 99 se toma como 4 y -3 como 0.
- [ ] **Paso 2:** `calculo-luz.ts` hasta que pasen.
- [ ] **Paso 3: prueba visual, parte `luz`** (`scripts/verificar-luz.mjs`), y verla fallar: `#luz` carga sin errores;
  la raíz trae `data-mk-luz` y las cuatro variables; al mover el cursor `--mk-lx` cambia y `--mk-l0x` no; en reposo
  no se piden cuadros (contador de `requestAnimationFrame`); con `reducedMotion: "reduce"` `--mk-lx` no cambia; una
  `Luz` adentro de otra con otro `desde` manda en su zona; al desmontar no quedan escuchadores (contador).
- [ ] **Paso 4:** `seguir-luz.ts` (cursor contra la pantalla, scroll contra el recorrido de la raíz, inclinación,
  suavizado, duerme al llegar, solo visible y con pestaña visible), `Luz.tsx`, la entrada, el cableado del paquete y
  la vitrina mínima.
- [ ] **Paso 5:** `npm test`, `npm run typecheck`, `npm run build && npm run peso` (las entradas viejas no suben),
  `npm run probar-paquete`, parte `luz` en Chromium y en WebKit.

### Tarea 2: `Materia`

**Archivos:** crear `src/luz/Materia.tsx`; tocar `src/luz/css.ts`, `src/entradas/luz.ts`, `demo/Luz.tsx`,
`demo/demo.css`, `scripts/verificar-luz.mjs`.

**Usa:** las variables de la tarea 1. **Entrega:** `<Materia tipo? altura? alApuntar? inclina? como? …>` con
`tipo: "papel" | "mate" | "vidrio" | "metal" | "holografico"` (por defecto `mate`), `altura` 0 a 4 (por defecto 1).
Clases `mk-lz`, `mk-lz-sombra`, `mk-lz-contacto`, `mk-lz-brillo`.

- [ ] **Paso 1: parte `materia`**, y verla fallar:
  - cada tipo dibuja sus capas, con `aria-hidden` y `pointer-events: none`;
  - la sombra proyectada está corrida al lado contrario de la luz, y más corrida con `altura` 3 que con 1;
  - al mover el cursor el brillo se corre, y entre dos instantes las únicas propiedades que cambian en las capas son
    `translate`, `scale`, `rotate`, `transform` u `opacity`;
  - al apuntar sube (la proyectada se aleja) y al apretar baja (la proyectada se junta);
  - `inclina`: la superficie se inclina hacia el cursor y su padre no recibe `perspective`;
  - el contraste del texto bajo el brillo al máximo es ≥ 4,5 en fondo claro y oscuro, en los cinco tipos;
  - fuera de una `Luz` se ve con la luz por defecto, quieta;
  - en `liviano` y con movimiento reducido no se inclina ni se mueve el brillo;
  - a 360 px nada se sale de lado; `tipo` y `altura` raros no lanzan.
- [ ] **Paso 2:** `Materia.tsx` y su CSS. La vitrina muestra las cinco sobre una mesa, con el control de la luz.
- [ ] **Paso 3:** mirar capturas en 390 px y en escritorio: se tiene que notar. Afinar.
- [ ] **Paso 4:** romper a propósito (sombra sin correr, brillo quieto) y ver que la prueba lo nota.

### Tarea 3: tarjetas, botones y estilos de sombra dura

**Archivos:** tocar `src/luz/css.ts`, `demo/Luz.tsx`, `scripts/verificar-luz.mjs`. **No** se tocan `src/piezas/` ni
`src/estilos/`.

- [ ] **Paso 1: parte `existe`**, y verla fallar: dentro de una `Luz` con la luz desde la derecha, la sombra calculada
  de `Tarjeta elevada`, de `Boton solido` y de `Boton tecla` tiene su corrimiento en x negativo; con la luz desde la
  izquierda, positivo; lo mismo con los estilos `retro` y `anime`, con el `Estilo` adentro y afuera de la `Luz`;
  `plana`, `contorno`, `ticket` y `pixel` no ganan sombra; al apretar, el botón se corre hacia su sombra; fuera de
  una `Luz`, la sombra calculada de cada una es la de siempre.
- [ ] **Paso 2:** el CSS (precisiones 2, 3 y 4).
- [ ] **Paso 3:** `npm run peso`: `motion-kit` no sube.

### Tarea 4: el libro

**Archivos:** tocar `src/momentos/LibroQueSeAbre.tsx` (solo CSS bajo `[data-mk-luz]`), `demo/Luz.tsx`,
`scripts/verificar-luz.mjs`.

- [ ] **Paso 1:** en la parte `existe`, y verla fallar: dentro de una `Luz`, a medio giro la cara de la hoja que gira
  está oscurecida (opacidad de su capa > 0,3) y al terminar vuelve a 0; el dorso parte oscuro y termina claro; la
  hoja de abajo recibe sombra durante el giro; cambiar de dirección a medio giro no produce saltos (la opacidad
  cambia menos de 0,25 entre dos cuadros seguidos); en modo simple no hay sombreado de giro; fuera de una `Luz`, el
  libro a medio giro se ve igual que antes (comparación de píxeles con la versión sin el cambio).
- [ ] **Paso 2:** el CSS (precisión 5).
- [ ] **Paso 3:** `verificar-momentos3 libro` sigue pasando.

### Tarea 5: el carrusel

**Archivos:** tocar `src/momentos/CarruselGiratorio.tsx`, `demo/Luz.tsx`, `scripts/verificar-luz.mjs`.

- [ ] **Paso 1:** en la parte `existe`, y verla fallar: dentro de una `Luz`, una ficha de costado tiene su capa oscura
  con más opacidad que la del frente, y la del lado de la luz menos que la del lado contrario; las fichas no llevan
  el 62 % de opacidad; al girar, la opacidad de la capa cambia de forma continua; hay reflejo o sombra de piso y
  nada queda cortado; el texto de la ficha del frente conserva su contraste; fuera de una `Luz`, igual que antes.
- [ ] **Paso 2:** el anillo deja su ángulo en una variable (`--mk-c-ang`) solo si está dentro de una `Luz`; el CSS
  calcula con `cos()` donde existe y cae a lo escalonado donde no (precisión 6).
- [ ] **Paso 3:** `verificar-momentos3 carrusel` sigue pasando, en Chromium y en WebKit.

### Tarea 6: las dos piezas nuevas

**Archivos:** crear `src/luz/TarjetaHolografica.tsx`, `src/luz/TituloConVolumen.tsx`; tocar `src/luz/css.ts`,
`src/entradas/luz.ts`, `demo/Luz.tsx`, `scripts/verificar-luz.mjs`.

**Entrega:** `<TarjetaHolografica inclina? …>` (una `Materia` holográfica inclinable) y
`<TituloConVolumen como? espesor? …>`.

- [ ] **Paso 1: parte `piezas`**, y verla fallar: la tarjeta se inclina hacia el cursor y su arcoíris se corre; el
  título conserva su texto (se lee y se selecciona), su espesor cae al lado contrario de la luz en reposo y cambia
  de lado con otra luz; sus colores salen del color del texto; a 360 px nada se sale; con movimiento reducido,
  quietas.
- [ ] **Paso 2:** las dos piezas.
- [ ] **Paso 3:** capturas en 390 px: se tiene que notar.

### Tarea 7: cierre

- [ ] `npm test`, `npm run typecheck`, `npm run build && npm run peso`, `npm run probar-paquete`.
- [ ] `npm run verificar`, y `node scripts/en-safari.mjs luz`.
- [ ] Documentos: `docs/CATALOGO.md`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`; encargo
  `cerebro-aquiles/lamente/ENCARGO_2026-11-24_luz-y-materia.md`.
- [ ] Revisión final independiente (Opus) y arreglos.
