// Los efectos vistosos (fuegos artificiales, carrusel giratorio y libro que se abre): cada pieza se baja aparte cuando
// se usa (ver aparte.tsx). Mientras llega, se ve el `respaldo` que le pasen.
import { aparte } from "./aparte";
import type { FuegosArtificialesProps } from "./FuegosArtificiales";
import type { CarruselGiratorioProps } from "./CarruselGiratorio";
import type { LibroQueSeAbreProps } from "./LibroQueSeAbre";

export const FuegosArtificiales = aparte<FuegosArtificialesProps>(() => import("./FuegosArtificiales"));
export const CarruselGiratorio = aparte<CarruselGiratorioProps>(() => import("./CarruselGiratorio"));
export const LibroQueSeAbre = aparte<LibroQueSeAbreProps>(() => import("./LibroQueSeAbre"));
