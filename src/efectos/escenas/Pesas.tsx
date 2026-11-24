import { Caida } from "../caida/Caida";
import type { EfectoProps } from "../tokens";

/** Pesas que caen, se apilan al fondo y se dejan empujar. */
export default function Pesas(p: EfectoProps) {
  return <Caida objeto="pesas" {...p} />;
}
