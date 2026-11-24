import { Caida } from "../caida/Caida";
import type { EfectoProps } from "../tokens";

/** Tijeras que caen, se apilan al fondo y se dejan empujar. */
export default function Tijeras(p: EfectoProps) {
  return <Caida objeto="tijeras" {...p} />;
}
