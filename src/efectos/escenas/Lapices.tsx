import { Caida } from "../caida/Caida";
import type { EfectoProps } from "../tokens";

/** Lápices que caen, se apilan al fondo y se dejan empujar. */
export default function Lapices(p: EfectoProps) {
  return <Caida objeto="lapices" {...p} />;
}
