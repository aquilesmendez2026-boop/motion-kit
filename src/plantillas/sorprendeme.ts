import { EFECTOS } from "../efectos/registro";
import type { EfectoId, Rubro, Variante } from "../efectos/tokens";
import { ESTILOS, ESTILO_IDS, type EstiloId, type TextoEfecto, type VistaId } from "../estilos/estilos";
import type { BotonEfecto } from "../piezas/Boton";
import type { TransicionId } from "../piezas/transiciones";

export interface Combinacion {
  estilo: EstiloId;
  efecto: EfectoId;
  variante: Variante;
  texto: TextoEfecto;
  boton: BotonEfecto;
  transicion: TransicionId;
  vista: VistaId;
  semilla: number;
}

function azar(semilla: number) {
  let t = semilla >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const BOTONES: BotonEfecto[] = ["elevar", "relleno", "brillo", "flecha", "deslizar", "latido", "borde"];
const TEXTOS_CALMOS: TextoEfecto[] = ["maquina", "trailer", "encender", "onda"];

/**
 * Arma una combinación al azar que siempre se ve bien: el efecto y el texto salen de los que
 * combinan con el estilo, y si el efecto es vistoso el texto es calmo (no compiten).
 * La misma `semilla` da siempre la misma combinación, así se puede guardar.
 */
export function sorprendeme(opciones: { estilo?: EstiloId; rubro?: Rubro; semilla?: number } = {}): Combinacion {
  const semilla = opciones.semilla ?? Math.floor(Math.random() * 1e9);
  const r = azar(semilla);
  const elige = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const estilo = opciones.estilo ?? elige(ESTILO_IDS);
  const e = ESTILOS[estilo];
  let candidatos = e.efectos;
  if (opciones.rubro) {
    const delRubro = candidatos.filter((id) => EFECTOS[id].rubros.includes(opciones.rubro!));
    if (delRubro.length) candidatos = delRubro;
  }
  const efecto = elige(candidatos);
  const vistoso = EFECTOS[efecto].animo === "vistoso";
  const textos = vistoso ? e.texto.filter((t) => TEXTOS_CALMOS.includes(t)) : e.texto;
  return {
    estilo,
    efecto,
    variante: (1 + Math.floor(r() * 3)) as Variante,
    texto: elige(textos.length ? textos : e.texto),
    boton: r() < 0.5 ? e.boton.efecto : elige(BOTONES.filter((b) => !(vistoso && (b === "latido" || b === "borde")))),
    transicion: e.transicion,
    vista: e.vista,
    semilla,
  };
}
