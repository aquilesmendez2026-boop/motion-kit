// motion-kit/interfaz: solo las piezas de interfaz y sus hooks, sin fondos, encabezados, relatos ni registros. Para un
// panel o una app que quiere un acordeón o un contador sin cargar los efectos de las páginas (encargo del front de
// La Mente, 25-11-2026). Las piezas ponen su propio CSS al montarse: no hace falta importar ninguna hoja.

export { SubirImagen } from "../interfaz/SubirImagen";
export { BotonQueGuarda } from "../interfaz/BotonQueGuarda";
export { Copiar } from "../interfaz/Copiar";
export { Confirmar } from "../interfaz/Confirmar";
export type { ConfirmarProps } from "../interfaz/Confirmar";
export type { CopiarProps } from "../interfaz/Copiar";
export { Campo } from "../interfaz/Campo";
export type { CampoProps } from "../interfaz/Campo";
export type { BotonQueGuardaProps } from "../interfaz/BotonQueGuarda";
export type { EstadoGuardar } from "../interfaz/guardar";
export { Cargando } from "../interfaz/Cargando";
export { ListaViva } from "../interfaz/ListaViva";
export type { ListaVivaProps } from "../interfaz/ListaViva";
export { Contador } from "../interfaz/Contador";
export type { ContadorProps } from "../interfaz/Contador";
export { Interruptor } from "../interfaz/Interruptor";
export type { InterruptorProps } from "../interfaz/Interruptor";
export type { CargandoProps, FormaCarga } from "../interfaz/Cargando";
export type { SubirImagenProps } from "../interfaz/SubirImagen";
export { Accordion } from "../components/Accordion";
export type { AccordionProps, AccordionItem } from "../components/Accordion";
export { CountUp } from "../components/CountUp";
export type { CountUpProps } from "../components/CountUp";
export { Reveal } from "../components/Reveal";
export type { RevealProps, RevealDirection } from "../components/Reveal";
export { Stagger } from "../components/Stagger";
export type { StaggerProps } from "../components/Stagger";
export { Presencia } from "../piezas/Presencia";
export type { PresenciaProps } from "../piezas/Presencia";
export { Skeleton } from "../components/Skeleton";
export type { SkeletonProps } from "../components/Skeleton";
export { Pressable } from "../components/Pressable";
export type { PressableProps } from "../components/Pressable";
export { Ripple } from "../components/Ripple";
export type { RippleProps } from "../components/Ripple";
export { Tabs } from "../components/Tabs";
export type { TabsProps, TabsItem } from "../components/Tabs";
export { TabBar } from "../components/TabBar";
export type { TabBarProps, TabBarItem } from "../components/TabBar";
export { BottomSheet } from "../components/BottomSheet";
export type { BottomSheetProps } from "../components/BottomSheet";
export { ToastProvider, useToast } from "../components/Toast";
export type { ToastProviderProps, ToastOptions } from "../components/Toast";
export { Tarjeta, TarjetaMedia, TarjetaCuerpo } from "../piezas/Tarjeta";
export type { TarjetaProps, TarjetaVariante, TarjetaEfecto } from "../piezas/Tarjeta";
export { GlowBorder } from "../components/GlowBorder";
export type { GlowBorderProps } from "../components/GlowBorder";
export { ShinyButton } from "../components/ShinyButton";
export type { ShinyButtonProps } from "../components/ShinyButton";
export { TextoCinetico } from "../estilos/TextoCinetico";
export type { TextoCineticoProps } from "../estilos/TextoCinetico";
export { SplitText } from "../components/SplitText";
export type { SplitTextProps } from "../components/SplitText";
export { Typewriter } from "../components/Typewriter";
export type { TypewriterProps } from "../components/Typewriter";
export { WordRotate } from "../components/WordRotate";
export type { WordRotateProps } from "../components/WordRotate";

// Los hooks.
export { useReducedMotion } from "../hooks/useReducedMotion";
export { useInView } from "../hooks/useInView";
export type { UseInViewOptions } from "../hooks/useInView";
export { useScrollProgress } from "../hooks/useScrollProgress";
export { useViewTransition } from "../hooks/useViewTransition";
export { transicionVista } from "../estilos/vista";

// Los colores: cada pieza lee variables --mk-* (ver src/interfaz/tema.ts); variablesTema las arma para un style.
export { variablesTema } from "../interfaz/tema";
export type { TemaInterfaz, ColorInterfaz } from "../interfaz/tema";
