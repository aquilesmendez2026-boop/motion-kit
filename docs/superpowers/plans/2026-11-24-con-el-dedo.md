# Con el dedo — plan de construcción

> **Para quien lo ejecute:** se ejecuta con superpowers:executing-plans, tarea por tarea, en esta sesión. Cada paso
> lleva su prueba primero.

**Meta:** cuatro piezas que se manejan con el dedo: un cupón que se arranca, un sticker que se despega, sellos que se
timbran y una ruleta de premios.

**Cómo:** HTML de verdad recortado con ventanas (`overflow`) que se corren y se giran; lo calculable (cuánto va
cortado, el doblez, la tinta, el plan de la ruleta) vive aparte, sin navegador. Van en `motion-kit/momentos` y se
bajan aparte.

**Con qué:** React 19, TypeScript, CSS; pruebas con `node:test` y Playwright (Chromium y WebKit).

**Diseño:** `docs/superpowers/specs/2026-11-24-con-el-dedo-design.md` (con sus 20 precisiones).

## Reglas de todo el plan

- Sin dependencias nuevas. Sin `Math.random`. Sin modelos de IA.
- En lo que se anima, solo `transform`, `translate`, `scale`, `rotate` y `opacity`.
- Tres niveles: `completo`, `liviano` (un toque y una transición corta), `quieto` (todo a la vista, sin moverse).
- El código, el premio y los sellos son texto de la página. Cada pieza tiene un botón para quien no arrastra, se
  maneja con teclado y anuncia lo importante.
- Zonas de toque de 44 px o más. Arrastrar no desplaza la página de lado.
- Cada pieza se baja aparte y acepta `respaldo`. Datos raros no rompen.
- Topes (KB gzip al cargar): `momentos` 17 (fijado por Aquiles); los demás no se suben.
- La ruleta no decide el resultado, no frena de golpe y no retrocede.
- Tiene que notarse: capturas a medio gesto, miradas antes de dar cada pieza por hecha.
- Español de Chile, frases cortas. Sin commits hasta la orden de Aquiles.
- No editar `src/` ni `demo/` mientras corre una prueba visual.

## Lo que hay que mirar en la revisión final

1. **Gestos difíciles:** soltar a medias, dos dedos, el navegador cancela el gesto, arrastrar fuera de la pieza,
   tocar muy rápido dos veces, girar la pantalla a medio gesto: la pieza queda en un estado válido y sin escuchadores
   colgando.
2. **La ruleta con el servidor:** `alGirar` que tarda, que falla, que devuelve un índice que no existe o que resuelve
   después de desmontar; `resultado` que cambia a medio giro; `vez` que cambia a medio giro.
3. **Quien no arrastra:** teclado, lector de pantalla y movimiento reducido llegan al mismo final en las cuatro, y lo
   escondido (el código, lo de debajo del sticker) no se alcanza antes de tiempo.
4. **Datos raros:** premios de más o de menos, textos enormes, `llenos` mayor que `total`, `nuevos` mayor que
   `llenos`, fechas malas, un código vacío, hijos que no son texto.
5. **Peso y aislamiento:** cada archivo aparte y lo que suma `momentos` al cargar; nada de `src/luz/` importado; una
   página sin estas piezas no baja nada nuevo.

---

### Tarea 1: el cupón que se arranca

**Archivos:** crear `src/momentos/calculo-cupon.ts`, `src/momentos/CuponQueSeArranca.tsx`,
`src/momentos/perezosos-4.tsx`, `src/momentos/calculos-4.ts` (barril para las pruebas), `pruebas/momentos4.test.ts`,
`scripts/verificar-momentos4.mjs`. Tocar `src/entradas/momentos.ts`, `demo/Momentos.tsx`,
`scripts/verificar-cambios.mjs`, `scripts/probar-paquete.mjs`.

**Entrega:**

- `DIENTES = 24`; `cortado(xDedo: number, ancho: number): number` (0 a 1, acotado); `dientesCortados(avance)`;
  `tramosColgando(avance: number): { giro: number; baja: number }[]` (cuatro tramos, cada uno más girado);
  `vencio(vence: unknown, hoy: Date): boolean`; `limpiarCupon(x)`.
- `<CuponQueSeArranca titulo detalle? codigo vence? vibracion? alArrancar? nivel? respaldo? />`.

- [ ] **Paso 1: pruebas calculables**, y verlas fallar: `cortado` va de 0 a 1 con el dedo y no pasa de ahí; los
  dientes cortados solo aumentan; los tramos se giran cada uno más que el anterior y en 0 no cuelga nada; `vencio`
  vale todo el día de la fecha, y una fecha mala no vence; textos enormes se acortan.
- [ ] **Paso 2:** `calculo-cupon.ts`.
- [ ] **Paso 3: parte `cupon` de la prueba visual**, y verla fallar: arrastrar la lengüeta corta hasta donde va el
  dedo; soltar a medias la deja donde va; pasado el 85 % se suelta y aparece el código como texto, con «Copiar», y se
  anuncia; antes de eso el código no está en la página; el botón «Ver código» llega al mismo final; con teclado
  también; en `quieto` el código está desde el principio; un cupón vencido no se arranca; mientras se arrastra, en
  las capas solo cambian `transform` y `opacity` y la página no se corre de lado; a 360 px nada se sale; sin errores.
- [ ] **Paso 4:** la pieza, su carga aparte y su lugar en la vitrina («Con el dedo»).
- [ ] **Paso 5:** capturas a medio corte en 390 px. Afinar. Romper a propósito (el corte no sigue al dedo) y ver que
  la prueba lo nota.

### Tarea 2: el sticker que se despega

**Archivos:** crear `src/momentos/calculo-sticker.ts`, `src/momentos/StickerQueSeDespega.tsx`; tocar los de la tarea 1.

**Entrega:**

- `doblez(toma: Punto, dedo: Punto, caja: { ancho: number; alto: number }): { angulo: number; distancia: number; despegado: number }`
  (la recta del doblez, perpendicular a hacia dónde se tira, y qué parte del sticker va levantada, de 0 a 1);
  `bordeMasCercano(punto, caja)`.
- `<StickerQueSeDespega debajo etiqueta? forma? vibracion? alDespegar? nivel? respaldo?>…</StickerQueSeDespega>`.

- [ ] **Paso 1: pruebas calculables**, y verlas fallar: sin moverse no hay nada levantado; tirar más levanta más; el
  doblez es perpendicular al tirón; tirar hasta el otro borde da 1; un toque al centro toma el borde más cercano.
- [ ] **Paso 2:** `calculo-sticker.ts`.
- [ ] **Paso 3: parte `sticker`**, y verla fallar: tirar levanta una solapa cuya área crece con el tirón; soltar con
  menos de la mitad lo vuelve a pegar; con más, se despega, cae y lo de abajo queda a la vista y se anuncia; antes de
  eso lo de abajo no recibe foco ni lo leen los lectores; el botón «Despegar» llega al mismo final; cancelar el gesto
  cuenta como soltar; solo `transform` y `opacity`; la página no se desplaza mientras se tira; a 360 px nada se sale.
- [ ] **Paso 4:** la pieza.
- [ ] **Paso 5:** capturas a medio despegar. Afinar. Romper a propósito y ver que la prueba lo nota.

### Tarea 3: los sellos con timbre

**Archivos:** crear `src/momentos/calculo-timbre.ts`, `src/momentos/SellosConTimbre.tsx`; tocar los de la tarea 1.

**Entrega:**

- `tintaDe(semilla: string, sello: number): { giro: number; x: number; y: number; carga: number; borde: number }`;
  `limitesTimbre(total, llenos, nuevos)`.
- `<SellosConTimbre total llenos nuevos? premio semilla? vibracion? nivel? respaldo? />`.

- [ ] **Paso 1: pruebas calculables**, y verlas fallar: la misma semilla y el mismo sello dan la misma tinta; sellos
  distintos, tinta distinta; todo dentro de sus rangos; `llenos` mayor que `total` y `nuevos` mayor que `llenos` se
  acotan.
- [ ] **Paso 2:** `calculo-timbre.ts`.
- [ ] **Paso 3: parte `sello`**, y verla fallar: los sellos de antes están puestos desde el principio; los nuevos se
  timbran al verse, uno tras otro, y quedan; cada marca tiene su giro; el texto dice cuántos van; en `liviano` no hay
  timbre; en `quieto` todo está puesto y no se pide ningún cuadro; solo `transform` y `opacity`.
- [ ] **Paso 4:** la pieza.
- [ ] **Paso 5:** capturas con el timbre abajo. Afinar. Romper a propósito y ver que la prueba lo nota.

### Tarea 4: la ruleta de premios

**Archivos:** crear `src/momentos/calculo-ruleta.ts`, `src/momentos/RuletaDePremios.tsx`; tocar los de la tarea 1.

**Entrega:**

- `limpiarPremios(x): Premio[]` (2 a 12); `velocidadDeGesto(muestras): number`;
  `planDeGiro(angulo: number, velocidad: number, n: number, resultado: number, semilla: string): { final: number; roce: number; dura: number } | null`
  (`null`: impulso flojo); `anguloEn(plan, t)`; `clavosPasados(a0, a1, n)`.
- `<RuletaDePremios premios resultado? alGirar? alTerminar? vez? semilla? celebracion? vibracion? nivel? respaldo? />`.

- [ ] **Paso 1: pruebas calculables**, y verlas fallar: para 500 combinaciones de velocidad, ángulo, premios, resultado
  y semilla, el plan termina dentro del premio pedido; el ángulo solo avanza (en el sentido del gesto) y la velocidad
  solo baja; da entre 2 y 7 vueltas; el roce queda a menos de un 20 % del de siempre; un impulso flojo da `null`; los
  clavos pasados entre dos ángulos se cuentan bien en los dos sentidos; premios de más se recortan y con menos de 2
  no hay ruleta.
- [ ] **Paso 2:** `calculo-ruleta.ts`.
- [ ] **Paso 3: parte `ruleta`**, y verla fallar: lanzar con el dedo la hace girar y se detiene en `resultado`, en
  20 lanzamientos distintos; el botón «Girar» también; un impulso flojo vuelve y deja lanzar de nuevo; con `alGirar`
  que tarda, gira pareja hasta que llega y recién ahí frena; si falla, no anuncia premio y avisa con `null`; gira una
  vez y el botón queda apagado; al cambiar `vez` se puede de nuevo; el premio se anuncia; en `quieto` se muestra de
  inmediato; solo `transform` y `opacity`; a 360 px nada se sale.
- [ ] **Paso 4:** la pieza.
- [ ] **Paso 5:** capturas girando. Afinar. Romper a propósito (el plan cae un premio más allá) y ver que la prueba
  lo nota.

### Tarea 5: cierre

- [ ] `npm test`, `npm run typecheck`, `npm run build && npm run peso`, `npm run probar-paquete`.
- [ ] `npm run verificar`, y `node scripts/en-safari.mjs momentos4`.
- [ ] Documentos: `docs/CATALOGO.md`, `CHANGELOG.md`, `CLAUDE.md`; encargo
  `cerebro-aquiles/lamente/ENCARGO_2026-11-24_con-el-dedo.md`.
- [ ] Revisión final independiente (Opus) y arreglos.
