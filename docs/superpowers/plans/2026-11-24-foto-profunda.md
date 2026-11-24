# Foto profunda: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** que la foto del encabezado se mueva con profundidad real, usando un mapa en grises que viaja al lado de la foto.

**Architecture:** un motor WebGL chico y aparte (no el de las fotos vivas), cargado con `import()`; lo calculable en un
archivo puro; un campo en la receta y dos props en `Encabezado`.

**Spec:** `docs/superpowers/specs/2026-11-24-foto-profunda-design.md`

## Global Constraints

- Sin dependencias en lo que viaja al navegador. El modelo se baja de internet solo en la vitrina.
- Solo nivel completo; movimiento reducido y liviano: la foto normal.
- Las entradas no pueden pasar sus topes (principal 79,1 de 80; encabezado 33,7 de 35; receta 9,6 de 10).
- Sin commits hasta que Aquiles lo ordene. No se editan `src/` ni `demo/` mientras corre una prueba visual.

## Review Focus

1. La foto o el mapa no cargan, o el servidor no da CORS: queda la foto normal, sin errores ni lienzo a medias.
2. El encabezado cambia de tamaño o gira el teléfono: el encuadre sigue calzando con la foto de abajo.
3. Se pierde el contexto WebGL: el lienzo se va y queda la foto.
4. Desmontar a medio cargar: no quedan lienzos, oyentes ni bucles.
5. La receta trae `fotoProfunda` junto con `fotoViva`, con `tomas` o sin foto: queda apagada, con aviso, y no lanza.

### Task 1: Lo calculable y la receta
Files: Create `src/fotos/calculo-profunda.ts`, `pruebas/profunda.test.ts`. Modify `src/receta/receta.ts`, contrato.
Produces: `encuadre(fotoAncho, fotoAlto, cajaAncho, cajaAlto, acercar?): { x: number; y: number }`,
`objetivoProfunda({ puntero, avance, inclinacion }): { x; y }`, `inclinacionDe(beta, gamma, base)`, `FUERZA`, `ACERCAR`.
Steps: pruebas que fallan → implementar → `node scripts/pruebas.mjs profunda`, `npm run contrato`.

### Task 2: El motor y la pieza
Files: Create `src/fotos/profunda.ts`, `src/fotos/FotoProfunda.tsx`. Modify `src/encabezados/Encabezado.tsx`.
Produces: `crearProfunda(lienzo): Profunda | null`; `FotoProfunda({ foto, mapa, origenes })` por defecto.

### Task 3: Vitrina y fotos de ejemplo
Files: Create `demo/Profundidad.tsx`, `demo/fotos/*`. Modify `demo/main.tsx`, `demo/App.tsx`.

### Task 4: Prueba en navegador
Files: Modify `scripts/verificar-fotos.mjs` (parte `profunda`).

### Task 5: Cierre
Peso, paquete, batería, documentos (`CATALOGO`, `CHANGELOG`), encargo para La Mente y fila del mapa; revisión final.
