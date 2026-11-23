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

// Escena: encabezados vivos sin dependencias (capas en profundidad, luz) y medidor de peso
export { CapasProfundidad, CapasEscena, CAPAS_POR_DEFECTO } from "./escena/CapasProfundidad";
export type { Capa, FormaCapa, CapasProfundidadProps } from "./escena/CapasProfundidad";
export { LuzYReflejo, LuzEscena } from "./escena/LuzYReflejo";
export type { ModoLuz, LuzYReflejoProps } from "./escena/LuzYReflejo";
export { useMovimientoEscena } from "./escena/movimiento";
export type { FuenteMovimiento, OpcionesMovimiento } from "./escena/movimiento";
export { MedidorPeso, usePeso } from "./escena/MedidorPeso";
export type { MedidorPesoProps } from "./escena/MedidorPeso";
export { medirPeso, recursosDe, estadoPeso, formatearPeso, PRESUPUESTO_ENCABEZADO, PRESUPUESTO_RECURSOS, ANCHO_ESCRITORIO } from "./escena/peso";
export type { Dispositivo, EstadoPeso, Presupuesto, MedicionPeso, RecursoPeso, TipoRecurso, OrigenDato } from "./escena/peso";
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
export { MedidorFluidez, MedidorCarga, SemaforoContraste, useCarga, revisarContraste } from "./escena/calidad";
export type { MedidorFluidezProps, Carga, FallaContraste, SemaforoContrasteProps } from "./escena/calidad";

// Código QR propio (sin librerías)
export { CodigoQR } from "./piezas/CodigoQR";
export type { CodigoQRProps } from "./piezas/CodigoQR";
export { generarQR, caminoQR } from "./utils/qr";

// Receta del encabezado v1: lo que La Mente guarda y valida (contrato en contrato/encabezado-motionkit.json)
export {
  VERSION_RECETA, LISTAS_RECETA, TOPES_RECETA, DEFECTOS_RECETA, PROTAGONISTA_RECETA, CAMPOS_RECETA, OBLIGATORIOS_RECETA,
  validarReceta, normalizarReceta, recetaAProps, protagonistaDe, esHrefSeguro, esImagenSegura, contratoEncabezado, textoContrato,
} from "./receta";
export type { RecetaEncabezado, BotonReceta, ErrorReceta, ResultadoReceta, OpcionesProps } from "./receta";
