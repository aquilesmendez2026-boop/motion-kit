# La página de muestra del growshop en la vitrina (diseño corto)

Fecha: 28-11-2026. Aprobado por Aquiles: «si, toma los datos y hazla de cero con esas ideas».

**Para qué:** una página completa de un negocio real (Raíz Growshop, Ñuñoa) armada solo con motion-kit, para ver todo
junto y probarlo. Viene del front (orden de Aquiles del 28-11, «sí, parte con las dos»), que deja de mantenerla.

**Caminos:** copiar la del front no se puede (usa `@la-mente/ui` y Chakra); rehacer los datos no aporta. Se toman los
datos (`datos.ts`: la receta del encabezado, el diseño, los 22 módulos; el logo y las 6 ilustraciones) y la página se
hace de cero en `demo/` (ruta `#growshop`).

**Cómo es:**
1. Un recorrido con intención, como una tienda: encabezado (la receta) → lo más pedido → precios → pedidos → sellos →
   novedades y el resto → contacto y ubicación al final.
2. Cada bloque con su momento vivo de motion-kit, sin repetir el mismo efecto dos veces seguidas.
3. Teléfono primero: perfecta en 390 px; 44 px para tocar.
4. Una prueba visual (`verificar-growshop`): al bajar todo queda visible (sin bloques transparentes), un solo
   encabezado, sin errores, y con movimiento reducido solo fundidos. Reemplaza `diag.ts` del front.
5. Con la fase 2, un selector de tema y paleta para ver la misma tienda con otros temas.

**Lo que se conserva de lo que aprendió el front:** sin `horaDelDia` en el estilo retro (tapaba los rayos); las
palabras que rotan no conviven con las luciérnagas en el mismo protagonista.

**Fuera:** depender de `@la-mente/ui`, Chakra o cualquier librería nueva.
