export type MovimientoId =
  | "aparecer" | "subir" | "bajar" | "desde-izquierda" | "desde-derecha" | "crecer" | "zoom"
  | "girar-entrar" | "voltear-x" | "voltear-y" | "rebote-entrar" | "elastico"
  | "latir" | "flotar" | "sacudir" | "balancear" | "tambalear" | "gelatina" | "rebotar"
  | "girar" | "parpadear" | "respirar" | "temblar";

export interface MovimientoDef {
  nombre: string;
  /** «entrada»: se juega una vez al aparecer. «atencion»: llama la mirada, puede repetirse. */
  grupo: "entrada" | "atencion";
  duracion: number;
  curva: string;
  /** Se repite sin parar por defecto. */
  bucle?: boolean;
  origen?: string;
  pasos: string;
}

const SALIDA = "cubic-bezier(.2,.8,.2,1)";
const SUAVE = "ease-in-out";

/** Catálogo de movimientos. Todos animan solo `transform` y `opacity`. */
export const MOVIMIENTOS: Record<MovimientoId, MovimientoDef> = {
  aparecer: { nombre: "Aparecer", grupo: "entrada", duracion: 600, curva: SALIDA, pasos: "from{opacity:0}to{opacity:1}" },
  subir: { nombre: "Subir", grupo: "entrada", duracion: 700, curva: SALIDA, pasos: "from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}" },
  bajar: { nombre: "Bajar", grupo: "entrada", duracion: 700, curva: SALIDA, pasos: "from{opacity:0;transform:translateY(-28px)}to{opacity:1;transform:none}" },
  "desde-izquierda": { nombre: "Desde la izquierda", grupo: "entrada", duracion: 700, curva: SALIDA, pasos: "from{opacity:0;transform:translateX(-36px)}to{opacity:1;transform:none}" },
  "desde-derecha": { nombre: "Desde la derecha", grupo: "entrada", duracion: 700, curva: SALIDA, pasos: "from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:none}" },
  crecer: { nombre: "Crecer", grupo: "entrada", duracion: 600, curva: SALIDA, pasos: "from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}" },
  zoom: { nombre: "Zoom", grupo: "entrada", duracion: 700, curva: SALIDA, pasos: "from{opacity:0;transform:scale(1.18)}to{opacity:1;transform:none}" },
  "girar-entrar": { nombre: "Girar al entrar", grupo: "entrada", duracion: 750, curva: SALIDA, pasos: "from{opacity:0;transform:rotate(-10deg) scale(.9)}to{opacity:1;transform:none}" },
  "voltear-x": { nombre: "Voltear (horizontal)", grupo: "entrada", duracion: 800, curva: SALIDA, origen: "50% 0", pasos: "from{opacity:0;transform:perspective(700px) rotateX(-75deg)}to{opacity:1;transform:perspective(700px) rotateX(0)}" },
  "voltear-y": { nombre: "Voltear (vertical)", grupo: "entrada", duracion: 800, curva: SALIDA, pasos: "from{opacity:0;transform:perspective(700px) rotateY(75deg)}to{opacity:1;transform:perspective(700px) rotateY(0)}" },
  "rebote-entrar": { nombre: "Rebote al entrar", grupo: "entrada", duracion: 800, curva: "linear", pasos: "0%{opacity:0;transform:scale(.3)}45%{opacity:1;transform:scale(1.06)}70%{transform:scale(.95)}85%{transform:scale(1.02)}100%{opacity:1;transform:scale(1)}" },
  elastico: { nombre: "Elástico", grupo: "entrada", duracion: 900, curva: "linear", pasos: "0%{opacity:0;transform:translateY(48px)}45%{opacity:1;transform:translateY(-10px)}65%{transform:translateY(5px)}82%{transform:translateY(-2px)}100%{opacity:1;transform:none}" },
  latir: { nombre: "Latir", grupo: "atencion", duracion: 1300, curva: SUAVE, bucle: true, pasos: "0%,100%{transform:scale(1)}14%{transform:scale(1.1)}28%{transform:scale(1)}42%{transform:scale(1.06)}70%{transform:scale(1)}" },
  flotar: { nombre: "Flotar", grupo: "atencion", duracion: 3200, curva: SUAVE, bucle: true, pasos: "0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}" },
  sacudir: { nombre: "Sacudir", grupo: "atencion", duracion: 650, curva: "linear", pasos: "0%,100%{transform:none}15%,55%{transform:translateX(-7px)}35%,75%{transform:translateX(7px)}90%{transform:translateX(-2px)}" },
  balancear: { nombre: "Balancear", grupo: "atencion", duracion: 1000, curva: SUAVE, origen: "50% 0", pasos: "0%,100%{transform:none}20%{transform:rotate(12deg)}40%{transform:rotate(-9deg)}60%{transform:rotate(5deg)}80%{transform:rotate(-3deg)}" },
  tambalear: { nombre: "Tambalear", grupo: "atencion", duracion: 1000, curva: SUAVE, pasos: "0%,100%{transform:none}15%{transform:translateX(-18%) rotate(-5deg)}30%{transform:translateX(14%) rotate(3deg)}45%{transform:translateX(-10%) rotate(-3deg)}60%{transform:translateX(6%) rotate(2deg)}75%{transform:translateX(-3%) rotate(-1deg)}" },
  gelatina: { nombre: "Gelatina", grupo: "atencion", duracion: 900, curva: SUAVE, pasos: "0%,100%{transform:none}30%{transform:scale(1.2,.8)}40%{transform:scale(.8,1.2)}50%{transform:scale(1.12,.88)}65%{transform:scale(.95,1.05)}75%{transform:scale(1.04,.96)}" },
  rebotar: { nombre: "Rebotar", grupo: "atencion", duracion: 1000, curva: SUAVE, pasos: "0%,20%,53%,100%{transform:none}40%,43%{transform:translateY(-22px)}70%{transform:translateY(-10px)}90%{transform:translateY(-3px)}" },
  girar: { nombre: "Girar", grupo: "atencion", duracion: 2400, curva: "linear", bucle: true, pasos: "from{transform:rotate(0)}to{transform:rotate(360deg)}" },
  parpadear: { nombre: "Parpadear", grupo: "atencion", duracion: 1600, curva: SUAVE, bucle: true, pasos: "0%,100%{opacity:1}50%{opacity:.3}" },
  respirar: { nombre: "Respirar", grupo: "atencion", duracion: 4000, curva: SUAVE, bucle: true, pasos: "0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.045);opacity:1}" },
  temblar: { nombre: "Temblar", grupo: "atencion", duracion: 500, curva: "linear", pasos: "0%,100%{transform:none}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,-2px)}80%{transform:translate(1px,2px)}" },
};

export const CSS_MOVIMIENTOS = Object.entries(MOVIMIENTOS)
  .map(([id, m]) => `@keyframes mk-m-${id}{${m.pasos}}`)
  .join("\n");
