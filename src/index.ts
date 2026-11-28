// Aparición
export { Reveal } from "./components/Reveal";
export type { RevealProps, RevealDirection } from "./components/Reveal";
export { Stagger } from "./components/Stagger";
export type { StaggerProps } from "./components/Stagger";

// Texto
export { SplitText } from "./components/SplitText";
export type { SplitTextProps } from "./components/SplitText";
export { GradientText } from "./components/GradientText";
export type { GradientTextProps } from "./components/GradientText";
export { Typewriter } from "./components/Typewriter";
export type { TypewriterProps } from "./components/Typewriter";
export { CountUp } from "./components/CountUp";
export type { CountUpProps } from "./components/CountUp";

export { WordRotate } from "./components/WordRotate";
export type { WordRotateProps } from "./components/WordRotate";

// Scroll
export { ScrollProgress } from "./components/ScrollProgress";
export type { ScrollProgressProps } from "./components/ScrollProgress";
export { Parallax } from "./components/Parallax";
export type { ParallaxProps } from "./components/Parallax";

// Cursor y toque
export { MagneticButton } from "./components/MagneticButton";
export type { MagneticButtonProps } from "./components/MagneticButton";
export { TiltCard } from "./components/TiltCard";
export type { TiltCardProps } from "./components/TiltCard";
export { Spotlight } from "./components/Spotlight";
export type { SpotlightProps } from "./components/Spotlight";
export { Pressable } from "./components/Pressable";
export type { PressableProps } from "./components/Pressable";
export { Ripple } from "./components/Ripple";
export type { RippleProps } from "./components/Ripple";

export { ShinyButton } from "./components/ShinyButton";
export type { ShinyButtonProps } from "./components/ShinyButton";

// Móvil
export { TabBar } from "./components/TabBar";
export type { TabBarProps, TabBarItem } from "./components/TabBar";
export { Carousel } from "./components/Carousel";
export type { CarouselProps } from "./components/Carousel";
export { BottomSheet } from "./components/BottomSheet";
export type { BottomSheetProps } from "./components/BottomSheet";
export { DeviceFrame } from "./components/DeviceFrame";
export type { DeviceFrameProps } from "./components/DeviceFrame";

// Decoración
export { Marquee } from "./components/Marquee";
export type { MarqueeProps } from "./components/Marquee";
export { Aurora } from "./components/Aurora";
export type { AuroraProps } from "./components/Aurora";

export { GlowBorder } from "./components/GlowBorder";
export type { GlowBorderProps } from "./components/GlowBorder";

// Secciones
export { Accordion } from "./components/Accordion";
export type { AccordionProps, AccordionItem } from "./components/Accordion";
export { Skeleton } from "./components/Skeleton";
export type { SkeletonProps } from "./components/Skeleton";

export { Navbar } from "./components/Navbar";
export type { NavbarProps } from "./components/Navbar";
export { Tabs } from "./components/Tabs";
export type { TabsProps, TabsItem } from "./components/Tabs";
export { ToastProvider, useToast } from "./components/Toast";
export type { ToastProviderProps, ToastOptions } from "./components/Toast";

// Hooks
export { useInView } from "./hooks/useInView";
export type { UseInViewOptions } from "./hooks/useInView";
export { useReducedMotion } from "./hooks/useReducedMotion";
export { useScrollProgress } from "./hooks/useScrollProgress";
export { useViewTransition } from "./hooks/useViewTransition";

// Los colores de las piezas de interfaz (motion-kit/interfaz).
export { CabezaSeccion } from "./interfaz/CabezaSeccion";
export type { CabezaSeccionProps } from "./interfaz/CabezaSeccion";
// En el índice general, `SeccionPanel` (ya existe el tipo `Seccion` de las plantillas); en motion-kit/interfaz, `Seccion`.
export { Seccion as SeccionPanel } from "./interfaz/Seccion";
export type { SeccionProps as SeccionPanelProps } from "./interfaz/Seccion";
export { GrillaTarjetas } from "./interfaz/GrillaTarjetas";
export type { GrillaTarjetasProps } from "./interfaz/GrillaTarjetas";
export { TarjetaFila } from "./interfaz/TarjetaFila";
export type { TarjetaFilaProps } from "./interfaz/TarjetaFila";
export { Selector } from "./interfaz/Selector";
export type { SelectorProps } from "./interfaz/Selector";
export { BarraLateral } from "./interfaz/BarraLateral";
export type { BarraLateralProps, GrupoBarra, SeccionBarra } from "./interfaz/BarraLateral";
export { IconoCaja } from "./interfaz/IconoCaja";
export type { IconoCajaProps } from "./interfaz/IconoCaja";
export { BotonPanel } from "./interfaz/BotonPanel";
export type { BotonPanelProps } from "./interfaz/BotonPanel";
export { Pastilla } from "./interfaz/Pastilla";
export type { PastillaProps } from "./interfaz/Pastilla";
export { colorDeTono, TONOS } from "./interfaz/tonos";
export type { TonoEstado } from "./interfaz/tonos";
export { variablesTema, fuenteCartel, CARTEL, f, letra, tiempo, fuerza, ritmoDe, RITMOS } from "./interfaz/tema";
// El cómic del panel (también en motion-kit/comic).
export { Mano, Globo, Estallido, Colgante, PUNTA_MANO, letraEstallido, Vacio, Oferta, CartelNovedad, Guia, useCelebrar, CelebrarProvider } from "./entradas/comic";
export type { ManoProps, GloboProps, EstallidoProps, ColganteProps, Direccion, Piel } from "./entradas/comic";
export { SubirImagen } from "./interfaz/SubirImagen";
export { BotonQueGuarda } from "./interfaz/BotonQueGuarda";
export { Copiar } from "./interfaz/Copiar";
export { Confirmar } from "./interfaz/Confirmar";
export type { ConfirmarProps } from "./interfaz/Confirmar";
export type { CopiarProps } from "./interfaz/Copiar";
export { Campo } from "./interfaz/Campo";
export type { CampoProps } from "./interfaz/Campo";
export type { BotonQueGuardaProps } from "./interfaz/BotonQueGuarda";
export type { EstadoGuardar } from "./interfaz/guardar";
export { Cargando } from "./interfaz/Cargando";
export { ListaViva } from "./interfaz/ListaViva";
export type { ListaVivaProps } from "./interfaz/ListaViva";
export { Contador } from "./interfaz/Contador";
export type { ContadorProps } from "./interfaz/Contador";
export { Interruptor } from "./interfaz/Interruptor";
export type { InterruptorProps } from "./interfaz/Interruptor";
export type { CargandoProps, FormaCarga } from "./interfaz/Cargando";
export type { SubirImagenProps } from "./interfaz/SubirImagen";
export type { TemaInterfaz, ColorInterfaz, AdnInterfaz, FormaInterfaz, LetraInterfaz, Ritmo } from "./interfaz/tema";

// Efectos protagonistas (uno por página; carga perezosa)
export { EFECTOS } from "./efectos/registro";
export { EfectoPagina } from "./efectos/EfectoPagina";
export { CapaEfecto } from "./efectos/CapaEfecto";
export type { EfectoId, EfectoDef, EfectoProps, Rubro, Variante } from "./efectos/tokens";

// Piezas: botones, tarjetas, movimientos y transiciones
export { Boton } from "./piezas/Boton";
export type { BotonProps, BotonVariante, BotonEfecto } from "./piezas/Boton";
export { Tarjeta, TarjetaMedia, TarjetaCuerpo, TarjetaVolteable } from "./piezas/Tarjeta";
export type { TarjetaProps, TarjetaVariante, TarjetaEfecto, TarjetaVolteableProps } from "./piezas/Tarjeta";
export { Movimiento } from "./piezas/Movimiento";
export type { MovimientoProps } from "./piezas/Movimiento";
export { MOVIMIENTOS } from "./piezas/movimientos";
export type { MovimientoId, MovimientoDef } from "./piezas/movimientos";
export { Presencia } from "./piezas/Presencia";
export type { PresenciaProps } from "./piezas/Presencia";
export { CambioContenido } from "./piezas/CambioContenido";
export type { CambioContenidoProps } from "./piezas/CambioContenido";
export { TRANSICIONES, animarEntrada, animarSalida } from "./piezas/transiciones";
export type { TransicionId } from "./piezas/transiciones";

// Estilos completos: neón, retro, rock, anime, película
export { Estilo, useEstilo } from "./estilos/Estilo";
export type { EstiloProps } from "./estilos/Estilo";
export { ESTILOS, ESTILO_IDS } from "./estilos/estilos";
export type { EstiloId, EstiloDef, SonidoId, VistaId, TextoEfecto } from "./estilos/estilos";
export { TextoCinetico } from "./estilos/TextoCinetico";
export type { TextoCineticoProps } from "./estilos/TextoCinetico";
export { AlScroll, GaleriaHorizontal } from "./estilos/AlScroll";
export type { AlScrollProps, AlScrollAnimacion, GaleriaHorizontalProps } from "./estilos/AlScroll";
export { transicionVista, VISTAS } from "./estilos/vista";
export { sonar, vibrar } from "./estilos/sonidos";

// Plantillas de página completas (recetas como datos)
export { PaginaReceta } from "./plantillas/PaginaReceta";
export type { PaginaRecetaProps } from "./plantillas/PaginaReceta";
export { RECETAS } from "./plantillas/recetas";
export { EDITABLE_POR_CLIENTE } from "./plantillas/receta";
export type { Receta, Seccion, Item, Enlace } from "./plantillas/receta";
export { imagenGenerada } from "./plantillas/imagenes";
export { sorprendeme } from "./plantillas/sorprendeme";
export type { Combinacion } from "./plantillas/sorprendeme";

// Encabezados (portadas) y packs de botones
export { Encabezado } from "./encabezados/Encabezado";
export { olvidarApertura } from "./encabezados/Apertura";
export type { EncabezadoProps, AltoEncabezado } from "./encabezados/Encabezado";
export { ALTOS, ALTO_IDS, SALIDAS, SALIDA_IDS } from "./encabezados/Encabezado";
export type { SalidaEncabezado, ObjetoEncabezado } from "./encabezados/Encabezado";
export { RUBROS, RUBRO_IDS, encabezadoPorRubro, semillaAzar } from "./encabezados/rubros";
export type { RubroId, RubroDef, TextosEncabezado, EncabezadoDeRubro } from "./encabezados/rubros";
export { COMPOSICIONES, COMPOSICION_IDS, ENTRADAS, ENTRADA_IDS } from "./encabezados/catalogo";
export type { ComposicionId, EntradaId } from "./encabezados/catalogo";
export { encabezadoAlAzar } from "./encabezados/sorprendeme";
export type { EncabezadoAzar } from "./encabezados/sorprendeme";
export { BotonesPack } from "./piezas/BotonesPack";
export type { BotonesPackProps, EnlaceBoton } from "./piezas/BotonesPack";
export { PACKS_BOTONES, PACK_IDS } from "./piezas/packs";
export type { PackBotonId, PackBoton } from "./piezas/packs";
export type { BotonForma } from "./piezas/Boton";

// Escena: encabezados vivos sin dependencias (también en motion-kit/escena). Las herramientas del editor (peso,
// fluidez, carga y contraste) salen solo por motion-kit/escena, para no pesar en esta entrada.
export { CapasProfundidad, CapasEscena, CAPAS_POR_DEFECTO } from "./escena/CapasProfundidad";
export type { Capa, FormaCapa, CapasProfundidadProps } from "./escena/CapasProfundidad";
export { LuzYReflejo, LuzEscena } from "./escena/LuzYReflejo";
export type { ModoLuz, LuzYReflejoProps } from "./escena/LuzYReflejo";
export { useMovimientoEscena } from "./escena/movimiento";
export type { FuenteMovimiento, OpcionesMovimiento } from "./escena/movimiento";
export { ShaderFondo, SHADERS, SHADER_IDS } from "./escena/ShaderFondo";
export type { ShaderId, ShaderFondoProps } from "./escena/ShaderFondo";
export { Objeto3DCss, FORMAS_OBJETO } from "./escena/Objeto3DCss";
export type { FormaObjeto, Objeto3DCssProps } from "./escena/Objeto3DCss";
export { EscenaVideo } from "./escena/EscenaVideo";
export type { EscenaVideoProps } from "./escena/EscenaVideo";
export { SecuenciaScroll, cuadrosDe } from "./escena/SecuenciaScroll";
export type { SecuenciaScrollProps } from "./escena/SecuenciaScroll";
export { comprimirFoto } from "./escena/comprimir";
export type { OpcionesComprimir, FotoComprimida } from "./escena/comprimir";
export { useNivelEscena, useModoAhorro, useFluidez, senalesAhorro, hayQueAhorrar } from "./escena/nivel";
export type { NivelEscena, ModoAhorro, SenalesAhorro, Fluidez } from "./escena/nivel";

// Código QR propio (sin librerías)
export { CodigoQR } from "./piezas/CodigoQR";
export type { CodigoQRProps } from "./piezas/CodigoQR";
export { generarQR, caminoQR } from "./utils/qr";

// Receta del encabezado v1: lo que La Mente guarda y valida (contrato en contrato/encabezado-motionkit.json)
export {
  VERSION_RECETA, LISTAS_RECETA, TOPES_RECETA, DEFECTOS_RECETA, PROTAGONISTA_RECETA, CAMPOS_RECETA, OBLIGATORIOS_RECETA,
  validarReceta, normalizarReceta, recetaAProps, protagonistaDe, esHrefSeguro, esImagenSegura,
} from "./receta/index";
// Herramientas de desarrollo (generar y revisar los contratos): solo en motion-kit, no en las entradas de la página.
export { contratoEncabezado, textoContrato } from "./receta/contrato";
export { contratoPagina, textoContratoPagina } from "./relatos/contrato-pagina";
export type { RecetaEncabezado, BotonReceta, ErrorReceta, ResultadoReceta, OpcionesProps, Tratamiento, FranjaHora } from "./receta/index";
export { franjaDe, VERSIONES_RECETA } from "./receta/index";
// Herramienta del editor (no de la página): solo en motion-kit.
export { paletaDeFoto, paletaDesdePixeles } from "./receta/paletaDeFoto";
export type { PaletaPropuesta } from "./receta/paletaDeFoto";
export {
  estiloDesdeLaMente, TEMAS_LAMENTE, PALETAS_LAMENTE, TEMA_LAMENTE_IDS, PALETA_LAMENTE_IDS, BASE_DE_TEMA,
} from "./receta/index";
export type { TemaLaMente, PaletaLaMente, PuenteLaMente } from "./receta/index";
export { EstiloLaMente } from "./receta/EstiloLaMente";
export type { EstiloLaMenteProps } from "./receta/EstiloLaMente";

// CSS: apagar la inserción de <style> cuando se carga motion-kit/estilos.css
export { sinInyectarEstilos } from "./utils/styles";

// Relatos: cómo se cuenta la página al bajar, y la receta de página (también en motion-kit/pagina)
export * from "./entradas/pagina";

// Biblioteca de diseños (paso 4): misma forma que la tabla que tendrá La Mente
export {
  VERSION_BIBLIOTECA, FORMATO_BIBLIOTECA, ESTADOS_DISENO, ESTADO_IDS, TOPES_BIBLIOTECA,
  validarDiseno, crearDiseno, editarDiseno, duplicarDiseno, filtrarDisenos, etiquetasDe, limpiarEtiquetas, nuevoId,
  exportarBiblioteca, importarBiblioteca, almacenLocal,
} from "./biblioteca/biblioteca";
export type {
  DisenoBiblioteca, EstadoDiseno, ArchivoBiblioteca, ResultadoDiseno, DatosDiseno, FiltroBiblioteca, ResultadoImportar, AlmacenBiblioteca,
} from "./biblioteca/biblioteca";
