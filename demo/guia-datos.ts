// Inventario de las piezas del front de La Mente (lamente-front, revisado el 27-11-2026, solo lectura) y, para cada una,
// lo que propone motion-kit. Rutas relativas a lamente-front. `usos`: archivos .tsx (sin pruebas) que la usan.
// La vitrina que lo muestra es demo/Guia.tsx (#guia).

export type Zona = "panel" | "pagina" | "ui";
export type Categoria = "acciones" | "encabezados" | "tarjetas" | "navegacion" | "estados" | "avisos" | "formularios" | "datos" | "imagenes" | "bloques" | "otros";
/** Qué tiene hoy de motion-kit: lo usa, lo usa a medias (por otra pieza) o nada. */
export type Kit = "si" | "indirecto" | "no";

export interface PiezaFront {
  zona: Zona;
  cat: Categoria;
  nombre: string;
  archivo: string;
  que: string;
  usos: number;
  kit: Kit;
  /** El detalle de lo que usa hoy de motion-kit. */
  kitDetalle?: string;
  /** Lo que propone motion-kit. */
  propuesta: string;
  /** Dónde ver una muestra en la demo. */
  muestra?: "#propuesta" | "#comic" | "#panel";
}

export const ZONAS: Record<Zona, string> = { panel: "Panel", pagina: "Página pública", ui: "Compartido (packages/ui)" };
export const CATEGORIAS: Record<Categoria, string> = {
  acciones: "Botones y acciones",
  encabezados: "Cabeceras",
  tarjetas: "Tarjetas y cajas",
  navegacion: "Navegación",
  estados: "Estados y cargas",
  avisos: "Avisos y diálogos",
  formularios: "Formularios",
  datos: "Datos y números",
  imagenes: "Imágenes",
  bloques: "Bloques",
  otros: "Otros",
};

const P = "fronts/panel/src/";
const W = "fronts/pagina-publica/src/";
const U = "packages/ui/src/";

export const PIEZAS: PiezaFront[] = [
  // ---------- Panel: acciones ----------
  { zona: "panel", cat: "acciones", nombre: "BotonModulo", archivo: P + "components/Modulo.tsx:23", que: "Botón principal amarillo de una sección, que se hunde al tocarlo.", usos: 30, kit: "no", propuesta: "Botón que guarda: el mismo botón dice «Guardando…» y «✓ Guardado» con un saltito; con Pressable, onda al tocar.", muestra: "#propuesta" },
  { zona: "panel", cat: "acciones", nombre: "BotonChico", archivo: P + "components/Modulo.tsx:32", que: "Acción de un bloque en píldora con borde (principal o peligro).", usos: 40, kit: "no", propuesta: "Mismo estado de guardando/listo que el principal; el de peligro pide confirmar con el globo.", muestra: "#propuesta" },
  { zona: "panel", cat: "acciones", nombre: "Soporte (botón flotante)", archivo: P + "components/soporte/Soporte.tsx:22", que: "Botón abajo a la derecha: congela la pantalla para marcar el problema.", usos: 1, kit: "no", propuesta: "Al abrir, la mano de cómic aparece y apunta a lo que se marca; un globo «¿Qué falló aquí?».", muestra: "#comic" },
  // ---------- Panel: cabeceras ----------
  { zona: "panel", cat: "encabezados", nombre: "EncabezadoModulo", archivo: P + "components/Modulo.tsx:41", que: "Cabecera de cada sección: ícono, título, para qué sirve y la acción principal.", usos: 37, kit: "no", propuesta: "El ícono entra con un pop y el título con TextoCinetico corto la primera vez que se abre la sección." },
  { zona: "panel", cat: "encabezados", nombre: "IconoModulo", archivo: P + "components/Modulo.tsx:13", que: "Ícono del módulo en su cuadro amarillo con borde.", usos: 1, kit: "no", propuesta: "Pop al aparecer (lo mismo que hace hoy la barra al elegir)." },
  { zona: "panel", cat: "encabezados", nombre: "CabezaPagina", archivo: P + "pages/CabezaPagina.tsx:65", que: "Cabecera oscura de Página: nombre animado, link, estado, deshacer, guardar y publicar.", usos: 1, kit: "si", kitDetalle: "GlowBorder, TextoCinetico", propuesta: "«Publicar cambios» como botón que guarda; al publicar, estallido «¡Publicada!» y confeti.", muestra: "#propuesta" },
  { zona: "panel", cat: "encabezados", nombre: "Cabecera del panel", archivo: P + "pages/Panel.tsx:290", que: "Fila de arriba: La Mente, negocio, campana y Estudio/Admin/Equipo/Salir.", usos: 1, kit: "no", propuesta: "La campana late cuando llega algo (Contador) y cuelga el cartel «¡Nuevo!» con las novedades.", muestra: "#propuesta" },
  { zona: "panel", cat: "encabezados", nombre: "Encabezado (portada)", archivo: P + "pages/portada/Encabezado.tsx:67", que: "Cabecera de la portada del panel.", usos: 1, kit: "indirecto", kitDetalle: "EncabezadoDelEquipo (motion-kit/encabezado)", propuesta: "Ya usa el encabezado de motion-kit: nada nuevo." },
  // ---------- Panel: tarjetas ----------
  { zona: "panel", cat: "tarjetas", nombre: "TarjetaItem", archivo: P + "components/Modulo.tsx:74", que: "Bloque de una lista: foto o ícono, título con estado, detalle, acciones y pie.", usos: 15, kit: "no", propuesta: "Dentro de ListaViva: lo nuevo entra con destello, lo que cambia de estado se mueve; su píldora gira al cambiar.", muestra: "#panel" },
  { zona: "panel", cat: "tarjetas", nombre: "ListaTarjetas", archivo: P + "components/Modulo.tsx:62", que: "Grilla de bloques: dos por fila, una en el teléfono.", usos: 13, kit: "no", propuesta: "ListaViva (entrar, salir y reordenar sin saltos) o Stagger para la primera carga.", muestra: "#panel" },
  { zona: "panel", cat: "tarjetas", nombre: "TarjetaModulo", archivo: P + "pages/Modulos.tsx:36", que: "Un módulo con precio, estado y pedir o cancelar.", usos: 1, kit: "no", propuesta: "Al activarlo, estallido «¡Listo!» y el ítem de la barra se enciende con su pop." },
  { zona: "panel", cat: "tarjetas", nombre: "Tarjetas del Resumen", archivo: P + "pages/Resumen.tsx:47", que: "Las tarjetas del Resumen, que entran en cascada.", usos: 1, kit: "si", kitDetalle: "Stagger", propuesta: "Sumar números que cuentan y barras que crecen donde hay cifras.", muestra: "#propuesta" },
  { zona: "panel", cat: "tarjetas", nombre: "Tarjeta (9 copias locales)", archivo: P + "components/BajaNegocio.tsx:15", que: "Caja con borde y título, reescrita en 9 archivos, cada una distinta.", usos: 9, kit: "no", propuesta: "Una sola pieza (la del front o la Tarjeta de motion-kit con el tema): cambiar el look en un lugar." },
  { zona: "panel", cat: "tarjetas", nombre: "Seccion (5 copias locales)", archivo: P + "pages/Equipo.tsx:17", que: "Caja con título h3 y contenido, copiada en 5 archivos.", usos: 5, kit: "no", propuesta: "Unificar con la Tarjeta (misma razón: un solo lugar para el estilo)." },
  { zona: "panel", cat: "tarjetas", nombre: "ElegirRubro", archivo: P + "components/ElegirRubro.tsx:10", que: "Los seis rubros como tarjetas para elegir.", usos: 2, kit: "no", propuesta: "La elegida salta y se marca con un sello (SellosConTimbre en chico)." },
  // ---------- Panel: navegación ----------
  { zona: "panel", cat: "navegacion", nombre: "Barra lateral (PestanasNegocio)", archivo: P + "pages/Panel.tsx:502", que: "La barra izquierda: grupos, ítem activo oscuro con puntos, módulos con «+», plegar. Animaciones en CSS.", usos: 1, kit: "no", propuesta: "El oscuro del activo se desliza al cambiar de sección; el «+» hace pop al activar; plegar con solo transform; la guía la recorre.", muestra: "#comic" },
  { zona: "panel", cat: "navegacion", nombre: "Subpestañas (Chakra Tabs)", archivo: P + "pages/Agenda.tsx:54", que: "Pestañas internas de una sección (Agenda, Pedidos, Soporte, Admin…).", usos: 8, kit: "no", propuesta: "Tabs de motion-kit: la marca se desliza a la pestaña elegida.", muestra: "#propuesta" },
  { zona: "panel", cat: "navegacion", nombre: "PasosEnPestanas", archivo: P + "pages/PasosEnPestanas.tsx:28", que: "Los pasos de Página como pestañas de carpeta con ✓.", usos: 1, kit: "no", propuesta: "Al completar un paso, el ✓ entra con un sello y la carpeta salta; la mano apunta al siguiente.", muestra: "#comic" },
  { zona: "panel", cat: "navegacion", nombre: "RielDiseno", archivo: P + "pages/EditorDiseno.tsx:1053", que: "Columna de íconos del editor de diseño.", usos: 1, kit: "no", propuesta: "Marca deslizante como en la barra." },
  { zona: "panel", cat: "navegacion", nombre: "ItemLateral (Estudio)", archivo: P + "estudio/comun.tsx:126", que: "Botón de la barra oscura del Estudio.", usos: 2, kit: "no", propuesta: "Igual que la barra del panel (marca deslizante)." },
  { zona: "panel", cat: "navegacion", nombre: "Barra lateral del Estudio (2 copias)", archivo: P + "estudio/Inicio.tsx:71", que: "Menú izquierdo del Estudio, casi igual en dos archivos.", usos: 2, kit: "no", propuesta: "Unificar y usar la misma barra animada." },
  { zona: "panel", cat: "navegacion", nombre: "Pestanas (portada), sin uso", archivo: P + "pages/portada/Pestanas.tsx:7", que: "Pestañas accesibles que nadie importa.", usos: 0, kit: "no", propuesta: "Borrarla o reemplazar las Tabs de Chakra por ella o por las de motion-kit." },
  { zona: "panel", cat: "navegacion", nombre: "PieLegal", archivo: P + "components/PieLegal.tsx:5", que: "Pie con Privacidad, Seguridad y Términos.", usos: 3, kit: "no", propuesta: "Nada: está bien quieto." },
  // ---------- Panel: estados ----------
  { zona: "panel", cat: "estados", nombre: "VacioModulo", archivo: P + "components/Modulo.tsx:131", que: "Sección vacía: ícono grande, qué falta y botón para crear lo primero.", usos: 14, kit: "no", propuesta: "Pantalla vacía que invita: la mano de cómic apunta y toca «Crear el primero».", muestra: "#propuesta" },
  { zona: "panel", cat: "estados", nombre: "CargaPantalla", archivo: P + "components/CargaPantalla.tsx:9", que: "Primera carga de una pantalla con esqueleto.", usos: 41, kit: "si", kitDetalle: "Cargando", propuesta: "Ya está. Falta reemplazar el Spinner que queda en 51 archivos.", muestra: "#panel" },
  { zona: "panel", cat: "estados", nombre: "CargaEntrada", archivo: P + "components/CargaEntrada.tsx:4", que: "Pantalla al entrar: «La Mente» y un Spinner.", usos: 2, kit: "no", propuesta: "El logo «La Mente» con TextoCinetico y un esqueleto del panel en vez de la rueda." },
  { zona: "panel", cat: "estados", nombre: "Spinner de Chakra (patrón antiguo)", archivo: P + "pages/Modulos.tsx:391", que: "Rueda de carga que sigue en 51 archivos.", usos: 51, kit: "no", propuesta: "Dentro de botones: botón que guarda. Al abrir pantallas: Cargando (como CargaPantalla).", muestra: "#propuesta" },
  { zona: "panel", cat: "estados", nombre: "OfertaModulo", archivo: P + "pages/Modulos.tsx:385", que: "Lo que ve la pestaña de un módulo que el negocio no tiene.", usos: 36, kit: "no", propuesta: "Estallido «¡30 días gratis!» que late y la mano apunta a «Probar».", muestra: "#propuesta" },
  { zona: "panel", cat: "estados", nombre: "Píldora de estado (lm-mod-estado)", archivo: P + "components/Modulo.tsx:108", que: "Píldora de color dentro de TarjetaItem.", usos: 15, kit: "no", propuesta: "Píldora que cambia con un giro corto (Preparando → Listo).", muestra: "#propuesta" },
  { zona: "panel", cat: "estados", nombre: "Badge de Chakra (patrón)", archivo: P + "pages/Panel.tsx:445", que: "Insignias y números nuevos (Agenda, Pedidos, Buzón).", usos: 33, kit: "no", propuesta: "Contador: late cuando sube, «99+».", muestra: "#panel" },
  { zona: "panel", cat: "estados", nombre: "EstadoEquipo / PrioridadEtiqueta / PlazoEtiqueta", archivo: P + "pages/equipoLaMente/comun.tsx:11", que: "Píldoras del equipo de La Mente (estado, prioridad, plazo).", usos: 2, kit: "no", propuesta: "La misma píldora que cambia." },
  { zona: "panel", cat: "estados", nombre: "LuzEstado", archivo: P + "estudio/comun.tsx:74", que: "Estado de un proyecto del Estudio como luz chica.", usos: 2, kit: "no", propuesta: "Pulso suave mientras el proyecto está en curso." },
  { zona: "panel", cat: "estados", nombre: "FranjaPreparacion / FranjaPrueba", archivo: P + "pages/FranjaPreparacion.tsx:7", que: "Franjas de arriba (en preparación, cobros de prueba).", usos: 3, kit: "no", propuesta: "Cinta de cómic que entra desde arriba; quieta después." },
  // ---------- Panel: avisos y diálogos ----------
  { zona: "panel", cat: "avisos", nombre: "ProveedorAvisos / useAviso", archivo: P + "services/avisos.tsx:17", que: "Avisos abajo (bien, mal, «Deshacer»).", usos: 7, kit: "si", kitDetalle: "ToastProvider, useToast", propuesta: "Ya está. Falta usarlo en las ~90 pantallas que guardan o borran.", muestra: "#propuesta" },
  { zona: "panel", cat: "avisos", nombre: "Confirmar", archivo: P + "components/Confirmar.tsx:10", que: "Pregunta con botón seguro y botón que actúa.", usos: 2, kit: "no", propuesta: "Confirmar en un globo de cómic (hoja desde abajo en el teléfono) y aviso con «Deshacer».", muestra: "#propuesta" },
  { zona: "panel", cat: "avisos", nombre: "Pregunta", archivo: P + "pages/Piezas.tsx:37", que: "Pregunta en línea «Sí… / No».", usos: 10, kit: "no", propuesta: "La misma pieza de confirmar (una sola para los 5 diálogos hechos a mano)." },
  { zona: "panel", cat: "avisos", nombre: "DialogoEnLinea", archivo: P + "pages/Traspaso.tsx:21", que: "Diálogo dentro de la página.", usos: 5, kit: "no", propuesta: "Unificar con confirmar." },
  { zona: "panel", cat: "avisos", nombre: "Ventana", archivo: P + "components/soporte/Ventana.tsx:13", que: "Ventana propia: a la derecha en computador, entera en teléfono.", usos: 2, kit: "no", propuesta: "BottomSheet en el teléfono y Modal (nuevo) en el computador." },
  { zona: "panel", cat: "avisos", nombre: "ModalMiPagina / DialogoPagar", archivo: P + "pages/DialogoPagar.tsx:24", que: "Ventanas para ver la página o pagar un módulo.", usos: 4, kit: "no", propuesta: "Modal (nuevo); al pagar, estallido «¡Pagado!»." },
  { zona: "panel", cat: "avisos", nombre: "Campana", archivo: P + "pages/Campana.tsx:144", que: "Lista de avisos y aviso emergente de arriba.", usos: 1, kit: "no", propuesta: "La campana se mece al llegar algo; el emergente como globo de cómic.", muestra: "#propuesta" },
  { zona: "panel", cat: "avisos", nombre: "AvisoPagina / AvisoPremios / AvisosFalta", archivo: P + "pages/AvisoPagina.tsx:17", que: "Avisos de prueba, premios y lo que falta.", usos: 4, kit: "no", propuesta: "Cartel colgante que se mece la primera vez." },
  { zona: "panel", cat: "avisos", nombre: "NovedadesLaMente", archivo: P + "components/soporte/NovedadesLaMente.tsx:31", que: "«Hay novedades» y lo que La Mente publicó.", usos: 1, kit: "no", propuesta: "Cartel «¡Nuevo!» colgante junto a la campana.", muestra: "#propuesta" },
  { zona: "panel", cat: "avisos", nombre: "Error role=alert (patrón)", archivo: P + "pages/Resumen.tsx:125", que: "Texto rojo de error escrito a mano en 110 archivos.", usos: 110, kit: "no", propuesta: "Campo con error que se sacude suave y el aviso «mal» cuando no es de un campo.", muestra: "#propuesta" },
  // ---------- Panel: formularios ----------
  { zona: "panel", cat: "formularios", nombre: "Campos de Chakra (patrón)", archivo: P + "pages/Equipo.tsx", que: "Field + Input (70), Textarea (40), NativeSelect (29).", usos: 70, kit: "no", propuesta: "Campo de motion-kit (nuevo): etiqueta, ayuda y error que se sacude; foco con el acento.", muestra: "#propuesta" },
  { zona: "panel", cat: "formularios", nombre: "Campo / Selector (copias locales)", archivo: P + "pages/PaginaExclusiva.tsx:215", que: "Etiqueta + control reescrito en 6 archivos.", usos: 6, kit: "no", propuesta: "Una sola pieza de campo." },
  { zona: "panel", cat: "formularios", nombre: "CambiarLink", archivo: P + "components/CambiarLink.tsx:22", que: "Nuevo link con chequeo Disponible o Ya está tomado.", usos: 2, kit: "no", propuesta: "«Disponible» entra con ✓ verde; «tomado», con sacudida." },
  { zona: "panel", cat: "formularios", nombre: "LinkPublico", archivo: P + "pages/Piezas.tsx:12", que: "Link público con botón Copiar link.", usos: 6, kit: "no", propuesta: "Copiar con globo «¡Copiado!».", muestra: "#propuesta" },
  { zona: "panel", cat: "formularios", nombre: "EditorFicha / EditorHorario / SelectorHora", archivo: P + "components/EditorFicha.tsx:151", que: "Ficha plegable, horario semanal, selector de hora.", usos: 6, kit: "no", propuesta: "La ficha se despliega con Accordion; el horario sin cambios." },
  { zona: "panel", cat: "formularios", nombre: "NombreYLink / Acceso", archivo: P + "components/NombreYLink.tsx:16", que: "Nombre y link del negocio; tarjeta de acceso.", usos: 2, kit: "no", propuesta: "Campo de motion-kit; al entrar, la mano saluda (opcional)." },
  // ---------- Panel: datos ----------
  { zona: "panel", cat: "datos", nombre: "Tablas de Chakra (patrón)", archivo: P + "pages/Caja.tsx", que: "Caja, Comisiones, Turnos, Estadísticas, Admin.", usos: 7, kit: "no", propuesta: "Números que cuentan, barras que crecen y la tendencia; filas con ListaViva.", muestra: "#propuesta" },
  { zona: "panel", cat: "datos", nombre: "Numero / Desplegable", archivo: P + "services/motionKitPanel.tsx:37", que: "Número que sube y bloque que se despliega.", usos: 3, kit: "si", kitDetalle: "CountUp, Accordion (carga diferida)", propuesta: "Ya está. Importarlas directo de motion-kit/interfaz (pesa poco) en vez de cargar aparte." },
  { zona: "panel", cat: "datos", nombre: "TuPaginaEnNumeros / LoQueFalta", archivo: P + "pages/resumen/TuPaginaEnNumeros.tsx:131", que: "Bloques del Resumen con cifras y porcentaje.", usos: 2, kit: "indirecto", kitDetalle: "Numero, Desplegable", propuesta: "Sumar las barras que crecen." },
  { zona: "panel", cat: "datos", nombre: "GrillaSemana", archivo: P + "pages/GrillaSemana.tsx:29", que: "Grilla de la semana cada 15 minutos.", usos: 1, kit: "no", propuesta: "Una reserva nueva entra con destello (como ListaViva)." },
  { zona: "panel", cat: "datos", nombre: "ListaOrdenable", archivo: P + "pages/editarLista/Ordenar.tsx:62", que: "Lista arrastrable con manija.", usos: 1, kit: "no", propuesta: "Usar la física de Pila/Impulso al soltar (ya existen en momentos)." },
  { zona: "panel", cat: "datos", nombre: "VersionesPublicadas / Fila", archivo: P + "components/VersionesPublicadas.tsx:17", que: "Versiones publicadas; filas de etiqueta y monto.", usos: 4, kit: "no", propuesta: "Sin cambios." },
  // ---------- Panel: imágenes ----------
  { zona: "panel", cat: "imagenes", nombre: "SubirImagen", archivo: "motion-kit/interfaz", que: "Arrastrar o elegir una imagen; revisa tipo y peso.", usos: 7, kit: "si", kitDetalle: "SubirImagen", propuesta: "Ya está en las 7 pantallas.", muestra: "#panel" },
  { zona: "panel", cat: "imagenes", nombre: "VistaPrevia / EjemploPagina / Miniatura", archivo: P + "pages/VistaPrevia.tsx:95", que: "Cómo se ve la página; ejemplo por rubro; miniatura del Estudio.", usos: 4, kit: "no", propuesta: "Transición de vista (transicionVista) al cambiar de teléfono a computador." },
  // ---------- Panel: otros ----------
  { zona: "panel", cat: "otros", nombre: "InvitacionLaMente / PropuestaDelEquipo", archivo: P + "components/InvitacionLaMente.tsx:10", que: "Avisos de invitación y de propuesta de diseño.", usos: 3, kit: "no", propuesta: "Cartel colgante con la mano que apunta a «Ver»." },
  { zona: "panel", cat: "otros", nombre: "ArmaTuPack", archivo: P + "components/ArmaTuPack.tsx:22", que: "Armador del pack de módulos.", usos: 1, kit: "no", propuesta: "Cada módulo que se suma cae al pack (ListaViva) y el total cuenta." },
  { zona: "panel", cat: "otros", nombre: "Tema del panel (lm-hoja, lm-fila)", archivo: P + "pages/temaPanel.css:106", que: "Las clases de caja con trazo, esquina y sombra de manga (59 archivos).", usos: 59, kit: "no", propuesta: "Pasar sus colores a las variables --mk-* para que las piezas de motion-kit y las del front tomen lo mismo." },
  // ---------- Página pública ----------
  { zona: "pagina", cat: "estados", nombre: "Mensaje", archivo: W + "Mensaje.tsx:10", que: "Pantalla de «no existe» o error.", usos: 27, kit: "no", propuesta: "Con el tema Cómic: un globo y la mano que apunta a «Volver»." },
  { zona: "pagina", cat: "estados", nombre: "Cargando (Spinner de pantalla)", archivo: W + "Mensaje.tsx:3", que: "Rueda centrada a pantalla completa (25 archivos).", usos: 25, kit: "no", propuesta: "Cargando de motion-kit con la forma de lo que viene (la carta, la agenda).", muestra: "#panel" },
  { zona: "pagina", cat: "estados", nombre: "EnPausa / NegocioCerrado", archivo: W + "EnPausa.tsx:7", que: "Página en pausa o negocio cerrado.", usos: 25, kit: "no", propuesta: "Cartel colgante «Cerrado por hoy» que se mece." },
  { zona: "pagina", cat: "avisos", nombre: "FranjaPresentacion / ConfirmarBorrado", archivo: W + "FranjaPresentacion.tsx:15", que: "Franja de una propuesta; pregunta antes de borrar.", usos: 2, kit: "no", propuesta: "La misma pieza de confirmar del panel." },
  { zona: "pagina", cat: "formularios", nombre: "Campo (reservar/comunes) y CAMPO/ELEGIBLE", archivo: W + "reservar/comunes.tsx:20", que: "Campos y botones de elección con la paleta del negocio.", usos: 9, kit: "no", propuesta: "Campo de motion-kit con la paleta (las variables --lm-* ya existen)." },
  { zona: "pagina", cat: "formularios", nombre: "Formulario (6 copias locales)", archivo: W + "sellos/Formulario.tsx:23", que: "Un formulario por pantalla, cada uno distinto.", usos: 6, kit: "no", propuesta: "Una sola pieza; al enviar, botón que guarda y estallido «¡Listo!»." },
  { zona: "pagina", cat: "formularios", nombre: "AvisoPrivacidad", archivo: W + "legal/AvisoPrivacidad.tsx:29", que: "Aviso de privacidad bajo cada formulario.", usos: 8, kit: "no", propuesta: "Sin cambios." },
  { zona: "pagina", cat: "navegacion", nombre: "Progreso", archivo: W + "reservar/Progreso.tsx:11", que: "«Paso 2 de 3» con una barra por paso.", usos: 1, kit: "no", propuesta: "La barra se llena con scaleX y el paso hecho se sella." },
  { zona: "pagina", cat: "encabezados", nombre: "TituloPaso / MarcoVuelta / PaginaLegal", archivo: W + "reservar/comunes.tsx:12", que: "Títulos de paso, vuelta de un pago y páginas legales.", usos: 8, kit: "no", propuesta: "La vuelta de un pago con estallido «¡Pagado!»; lo legal, sin cambios." },
  { zona: "pagina", cat: "tarjetas", nombre: "Tarjeta (Eventos) y otras propias", archivo: W + "Eventos.tsx:174", que: "Tarjetas de eventos, sesiones y reseñas, cada una propia.", usos: 3, kit: "no", propuesta: "Con el tema Cómic, viñeta; reseñas como globos." },
  { zona: "pagina", cat: "bloques", nombre: "CartaPagina / IndicePrecios", archivo: W + "CartaPagina.tsx:19", que: "La página de la carta (portada, categorías, recomendados, visítanos).", usos: 3, kit: "no", propuesta: "Categorías con marca deslizante; «Agotado» como sello." },
  { zona: "pagina", cat: "otros", nombre: "Estructura repetida de cada página", archivo: W + "Novedades.tsx", que: "TemaPagina + BarraNegocio + Marco + EncabezadoSeccion + SelloLaMente, a mano en ~28 archivos.", usos: 28, kit: "no", propuesta: "Un envoltorio único: ahí se enchufa la viñeta cómic una vez para todas las páginas." },
  // ---------- Compartido (packages/ui) ----------
  { zona: "ui", cat: "bloques", nombre: "Marco", archivo: U + "bloques/comun.tsx:96", que: "Envoltorio de cada bloque: fondo, corte, efecto, entrada, alto y ancho.", usos: 45, kit: "indirecto", kitDetalle: "ConVida en la versión viva", propuesta: "Aquí va la viñeta cómic/anime: marco, puntos o líneas de velocidad, título como cartel y la mano al botón.", muestra: "#comic" },
  { zona: "ui", cat: "encabezados", nombre: "EncabezadoSeccion", archivo: U + "bloques/EncabezadoSeccion.tsx:8", que: "Etiqueta, título, frase y rayita de cada sección.", usos: 32, kit: "no", propuesta: "Con el tema Cómic, el título como cartel colgante.", muestra: "#comic" },
  { zona: "ui", cat: "bloques", nombre: "ConVida", archivo: U + "bloques/ConVida.tsx:26", que: "Carga la pieza viva de motion-kit/momentos con respaldo.", usos: 16, kit: "si", kitDetalle: "motion-kit/momentos (17 piezas)", propuesta: "Ya está." },
  { zona: "ui", cat: "bloques", nombre: "ConRelatos", archivo: U + "bloques/ConRelatos.tsx:65", que: "Relatos de scroll de la receta.", usos: 1, kit: "si", kitDetalle: "motion-kit/pagina", propuesta: "Ya está." },
  { zona: "ui", cat: "bloques", nombre: "EfectoBloque / CapaTema", archivo: U + "bloques/EfectoBloque.tsx:82", que: "Efectos de fondo de un bloque y capa del tema (CSS propio).", usos: 2, kit: "no", propuesta: "Sumar «puntos de imprenta» y «líneas de velocidad» para los temas Cómic y Anime." },
  { zona: "ui", cat: "bloques", nombre: "SelloLaMente", archivo: U + "bloques/SelloLaMente.tsx:13", que: "Última franja de toda página pública.", usos: 26, kit: "no", propuesta: "Sin cambios (o un sello que se estampa al llegar)." },
  { zona: "ui", cat: "bloques", nombre: "TarjetaSellos / Estrellas / BotonResenaGoogle", archivo: U + "bloques/TarjetaSellos.tsx:24", que: "Tarjeta de sellos, estrellas, botón de reseña.", usos: 8, kit: "no", propuesta: "Estrellas que se encienden una a una; la mano apunta a «Déjanos tu reseña»." },
  { zona: "ui", cat: "bloques", nombre: "LoMasPedido / LetrasNombre / EscenaHamburguesa", archivo: U + "bloques/LoMasPedido.tsx:21", que: "Destacados deslizables, nombre letra a letra, escena decorativa.", usos: 3, kit: "no", propuesta: "LoMasPedido con CintaConImpulso (ya existe)." },
  { zona: "ui", cat: "encabezados", nombre: "Encabezado / EncabezadoDelEquipo / Logo", archivo: U + "bloques/Encabezado.tsx:157", que: "Portada del negocio (9 composiciones) y la del equipo.", usos: 6, kit: "indirecto", kitDetalle: "EncabezadoDelEquipo: motion-kit/encabezado y director", propuesta: "Composición «Cómic» con estallido y globo para el nombre." },
  { zona: "ui", cat: "navegacion", nombre: "BarraNegocio", archivo: U + "BarraNegocio.tsx:166", que: "Barra de arriba de la página pública.", usos: 20, kit: "no", propuesta: "El botón destacado con la mano que lo toca (una vez)." },
  { zona: "ui", cat: "otros", nombre: "TemaPagina / TEMAS / PALETAS", archivo: U + "temas.ts:39", que: "Paleta como variables --lm-*; 12 temas de letras y esquinas; 12 paletas.", usos: 30, kit: "no", propuesta: "Sumar los temas «Cómic» y «Anime» (letra de cómic, borde grueso, sombra dura)." },
  { zona: "ui", cat: "otros", nombre: "PaginaNegocio", archivo: U + "PaginaNegocio.tsx:131", que: "Arma la página con sus bloques.", usos: 8, kit: "indirecto", kitDetalle: "ConRelatos, ConVida, EncabezadoDelEquipo", propuesta: "Pasa el tema a cada Marco para la viñeta." },
  { zona: "ui", cat: "datos", nombre: "PreciosLista / CartaConEstilo / FichaProducto / Agotado", archivo: U + "CartaEstilos.tsx:573", que: "Lista de precios, carta en 7 estilos, ficha, agotado.", usos: 10, kit: "indirecto", kitDetalle: "ConVida (LibroQueSeAbre)", propuesta: "Con el tema Cómic: precios en estallido, «Agotado» como sello." },
];

/** La barra izquierda del panel, como está hoy (Panel.tsx y barraLateral.css). */
export const BARRA = {
  archivo: P + "pages/Panel.tsx:502 (grupos en services/direccion.ts)",
  hoy: [
    "Tabs vertical de Chakra dentro de una caja de 15rem (4.25rem plegada), pegada al hacer scroll.",
    "Cada grupo tiene su color: Tu página morado, Clientes teal, Actividades rosado, Tu negocio naranja, Tu cuenta azul.",
    "Ítem activo: fondo de tinta, sombra dura del color del grupo, puntos de manga y un destello ✦ al elegirlo; el ícono hace pop.",
    "Módulos que el negocio no tiene: texto apagado y un «+» punteado; al abrirlos se ve la oferta del módulo.",
    "Insignias nuevas en Agenda, Pedidos y Buzón (un punto cuando está plegada).",
    "Plegar: deja solo los íconos y se recuerda en el navegador. En el teléfono es un botón «Secciones: …» que la abre.",
    "Todo animado con CSS propio; sin motion-kit. Con «reducir movimiento» se quita.",
  ],
  propuesta: [
    "La marca del activo se desliza de un ítem al otro (solo transform), en vez de aparecer de golpe.",
    "Al activar un módulo, el «+» hace ¡pop! y el ítem se enciende con el color del grupo.",
    "Las insignias usan el Contador de motion-kit (laten al subir).",
    "Plegar con transform (escala del contenido) en vez de animar el ancho.",
    "La guía con la mano recorre la barra la primera vez: «Aquí está tu página, aquí tus clientes…».",
    "Los colores por grupo pasan a variables, para cambiar el look en un lugar.",
  ],
  grupos: [
    { titulo: "", color: "#1C1A22", items: ["Resumen"] },
    { titulo: "Tu página", color: "#7c3aed", items: ["Página", "Exclusiva", "Precios", "Novedades", "QR y carteles", "Enlaces", "Kit de medios", "Colaboraciones", "Episodios", "Galería", "Avisos", "Secciones"] },
    { titulo: "Clientes", color: "#0f9f8f", items: ["Agenda", "Recordatorios", "Pedidos", "Sellos", "Clientes", "Con cuenta", "Reseñas", "Buzón", "Cotizaciones"] },
    { titulo: "Actividades", color: "#db2777", items: ["Clases", "Calendario", "Packs", "Encuestas", "Sorteos", "Eventos"] },
    { titulo: "Tu negocio", color: "#ea7a17", items: ["Caja", "Pagos en línea", "Vales", "Turnos", "Horario", "Marcar", "Comisiones", "Stock", "Estadísticas"] },
    { titulo: "Tu cuenta", color: "#2563eb", items: ["Módulos", "Pagos", "Mi consumo"] },
  ],
};

/** Los 22 bloques de la página pública (packages/ui/src/bloques) y sus versiones. */
export const BLOQUES: { nombre: string; versiones: string; viva: string }[] = [
  { nombre: "Encabezado", versiones: "9 composiciones", viva: "receta del equipo (motion-kit/encabezado)" },
  { nombre: "Avisos", versiones: "franja", viva: "AvisoQueSeDespliega" },
  { nombre: "Precios", versiones: "botón, tarjetas, lista, mosaico, pestañas, carta, destacada, íconos", viva: "CartaQueSeAbre" },
  { nombre: "Contacto", versiones: "botones, partido", viva: "LlamadoConVida" },
  { nombre: "Ubicación", versiones: "simple, tarjeta", viva: "MapaDibujado" },
  { nombre: "Agenda", versiones: "botón, calendarios", viva: "sí" },
  { nombre: "Sellos", versiones: "botón, tarjeta", viva: "SellosEstampa" },
  { nombre: "Pedidos", versiones: "botón, destacado", viva: "sí" },
  { nombre: "Buzón", versiones: "botón", viva: "sí" },
  { nombre: "Encuestas", versiones: "tarjeta", viva: "LlamadoConVida (solo el botón)" },
  { nombre: "Reseñas", versiones: "tarjetas", viva: "ResenasPila" },
  { nombre: "Sorteos", versiones: "tarjeta", viva: "SorteoRaspe" },
  { nombre: "Eventos", versiones: "lista", viva: "" },
  { nombre: "Novedades", versiones: "tarjetas", viva: "NovedadesQueLlegan" },
  { nombre: "Enlaces", versiones: "botones", viva: "EnlacesDomino" },
  { nombre: "Episodios", versiones: "lista", viva: "EpisodiosOnda" },
  { nombre: "Galería", versiones: "mosaico, carrusel", viva: "MosaicoQueSeArma / CarruselGiratorio" },
  { nombre: "Secciones", versiones: "apiladas", viva: "SeccionesVivas" },
  { nombre: "Clases", versiones: "semana", viva: "ClasesDeHoy" },
  { nombre: "Calendario", versiones: "próximas", viva: "FechasQueVienen" },
  { nombre: "Cotizaciones", versiones: "botón", viva: "sí" },
  { nombre: "Cinta", versiones: "corre, quieta", viva: "CintaConImpulso" },
];

/** Lo que conviene ordenar en el front antes de cambiar el look (para cambiar todo en un solo lugar). */
export const PARA_ORDENAR: string[] = [
  "Tarjeta tiene 9 copias, Seccion 8, Formulario 6, Campo 4 y Selector 3, cada una distinta: cambiar el look hoy es tocar cada copia.",
  "Conviven dos cargas: CargaPantalla (motion-kit, 41 archivos) y el Spinner de Chakra (51). En la página pública, 25 ruedas sin motion-kit.",
  "Hay 5 diálogos hechos a mano (Confirmar, Pregunta, DialogoEnLinea, Ventana, ModalMiPagina) y uno más copiado en la página pública.",
  "Los avisos de motion-kit se usan en 6 archivos; los errores son texto rojo escrito a mano en 110.",
  "Cada página pública repite a mano su estructura (tema, barra, marco, encabezado, sello) en ~28 archivos.",
  "Las pestañas de la portada (portada/Pestanas.tsx) no las usa nadie.",
  "motion-kit no está en el package.json del panel; llega porque packages/ui lo declara.",
  "Los colores por grupo de la barra están escritos en el código (COLOR_GRUPO).",
];
