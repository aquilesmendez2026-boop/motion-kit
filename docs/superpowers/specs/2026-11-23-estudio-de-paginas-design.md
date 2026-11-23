# Estudio de páginas: motion-kit como sitio del equipo de La Mente

Fecha: 23-11-2026. Estado: **decidido (23-11), sin código en La Mente todavía.** Aquiles eligió C, que publique el dueño
y una lista nueva de diseño (ver «Decisiones»). Lo pidió Aquiles: «vamos a crear un módulo o apartado para el equipo de La Mente donde pueda crear o subir
páginas y que se conecten a la base de La Mente»; «adaptar este repo motion kit para que sea un micrositio o un sitio
aparte para crear páginas web adaptadas a La Mente».

## En una frase

Un sitio aparte, `estudio.lamente.cl`, hecho con motion-kit, donde el equipo de La Mente entra con Google, elige un
negocio, arma o sube su página (encabezado vivo incluido, con el medidor de peso a la vista) y la guarda como borrador
en el núcleo `paginas` de La Mente. El dueño la ve en su panel y la publica.

## Qué hay hoy en La Mente (leído el 23-11, backend 47df4ec)

- El núcleo `paginas` guarda el contenido y el `diseno` de cada negocio, con borrador, versiones y publicar
  (`/panel/tenants/{id}/pagina/...`). Lo valida contra `contrato/diseno.json`: **listas cerradas** (paletas, 22
  bloques, 12 temas, ajustes como `fondo`, `efecto`, `alto`, `letras`). La página pública la dibuja `packages/ui` del
  front, no motion-kit.
- Las cabeceras con efectos del 21-11 ya existen en ese contrato (letras, fondos, `rayos`, `foco`; un solo
  protagonista por página).
- Acceso: el panel exige ser miembro del negocio. El super admin (`LAMENTE_ADMINS`, correo verificado) solo puede
  **leer** páginas ajenas. No hay rol para el equipo de diseño.

## Cómo se conecta (recomendado: opción C)

| Opción | Qué guarda el estudio | Lo bueno | Lo que cuesta |
|---|---|---|---|
| A. Solo el contrato de hoy | El `diseno` de siempre, con las listas cerradas | Cero cambios en la página pública; sale ya | Los efectos de motion-kit que no estén en el contrato no se pueden guardar |
| B. Página entera de motion-kit | Una `receta` de motion-kit en vez del `diseno` | Todo motion-kit | Rehacer en motion-kit los 22 bloques que ya funcionan con sus módulos (precios, agenda, pedidos…) |
| **C. Mixta (recomendada)** | El `diseno` de siempre + el **encabezado** como receta de motion-kit (`encabezado.version = "motionkit"`, con su `portada` en datos) | El encabezado gana capas, luz, alto a medida y medidor de peso; el resto de la página sigue igual | Validar la receta en `paginas`; la página pública carga motion-kit **solo** cuando el encabezado es de motion-kit |

La receta del encabezado ya existe como datos en el editor de motion-kit («Lo que se guarda (JSON)»): composición,
entrada, textos, botones, `alto`, `altoCelular`, `profundidad`, `luz`, `mover`, `efecto`, `pack` y fotos (keys de S3).
Se fija como `contrato/encabezado-motionkit.json` en el backend, igual que `diseno.json`: listas cerradas que el
backend valida y el front copia con `sincronizar-contrato.mjs`.

## Partes

1. **Sitio del estudio** (en este repo, carpeta `estudio/`, Vite, sin librerías nuevas salvo el SDK web de Firebase
   para entrar, que ya usa La Mente y es Apache 2.0; solo en el estudio, no en la librería): entrar con Google, buscar el negocio, editor (el de `demo/Encabezados.tsx`
   crecido), vista celular y escritorio, `MedidorPeso` siempre visible, guardar borrador.
2. **Fotos dentro del presupuesto:** al subir una foto, el estudio la achica y la pasa a WebP en el navegador
   (canvas, sin librerías) hasta quedar bajo 200 KB en celular; sube con la firma de `paginas` (la misma de la
   portada: JPEG/WebP, sin EXIF).
3. **Rutas nuevas en `paginas`** (rol de diseño, ver «Por decidir»):
   - `GET /estudio/negocios?busca=` (nombre, slug, rubro, si tiene página)
   - `GET /estudio/tenants/{id}/pagina` y `PUT /estudio/tenants/{id}/pagina/borrador` (escribe solo el borrador,
     con `autor: "estudio"` en la versión)
   - `POST /estudio/tenants/{id}/pagina/foto` (firma de subida)
   - Plantillas del equipo: `GET/PUT/DELETE /estudio/plantillas/{id}` en una tabla nueva
     `lamente-<amb>-paginas-plantillas` (una plantilla es una receta sin negocio, para reusar por rubro).
4. **Página pública y panel** (sesión del front): dibujar `encabezado.version = "motionkit"` con motion-kit cargado
   aparte (`import()`), y en el panel un aviso «El equipo de La Mente dejó un diseño nuevo» con publicar o descartar.
5. **Subir páginas:** se sube una **receta** (JSON exportado del estudio) más sus fotos. **No se sube HTML suelto**:
   los subdominios de los negocios comparten el login de los clientes y un HTML ajeno podría leerlo.
6. **Infra** (con OK): `estudio.lamente.cl` y `estudio.dev.lamente.cl` en S3 + CloudFront como los otros fronts, y
   su origen en `OrigenesPermitidos` de la API.

## Decisiones (Aquiles, 23-11-2026)

- **Conexión: opción C.** Encabezado de motion-kit + el resto con los bloques de La Mente.
- **Publica el dueño.** El estudio solo escribe el borrador; el panel muestra el aviso «El equipo de La Mente dejó un diseño
  nuevo» con publicar o descartar.
- **Acceso: lista nueva `LAMENTE_DISENO`**, aparte de `LAMENTE_ADMINS`.

## Opciones que se evaluaron

1. **Cómo se conecta:** A, B o C (recomendada C).
2. **Quién publica:** el equipo deja borrador y el dueño publica (recomendado: el dueño no se encuentra con cambios
   sin avisar), o el equipo publica directo.
3. **Quién entra al estudio:** la lista `LAMENTE_ADMINS` de hoy, o una lista nueva `LAMENTE_DISENO` (recomendado:
   así diseño no queda con poderes de admin, como créditos).

## Orden propuesto

1. motion-kit: estudio local contra datos de ejemplo (no toca La Mente). **← se puede partir ya**
2. Backend (sesión del backend, encargo en el cerebro): contrato del encabezado, rutas `/estudio/*`, tabla de
   plantillas, pruebas. Dev con OK.
3. Front (sesión del front): encabezado motion-kit en la pública y aviso en el panel. Dev con OK.
4. Infra del estudio en dev, prueba de punta a punta, después prod con OK.

## Riesgos

- Peso: motion-kit en la página pública suma JavaScript. Se carga solo con encabezado de motion-kit y se mide contra
  el presupuesto (`cerebro-aquiles/investigaciones/2026-11-23-pesos-web-y-movil.md`).
- Un solo protagonista por página: el encabezado de motion-kit cuenta como protagonista; `paginas` debe normalizarlo
  igual que hoy.
- Sesiones en paralelo: backend y front tienen sus propias sesiones; esto entra como encargo, no como cambio directo.
