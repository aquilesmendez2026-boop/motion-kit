import { Caida } from "../caida/Caida";
import type { EfectoProps } from "../tokens";

/** Granos de café que caen, se apilan al fondo y se dejan empujar. */
export default function Granos(p: EfectoProps) {
  return <Caida objeto="granos" {...p} />;
}
