import { Caida } from "../caida/Caida";
import type { EfectoProps } from "../tokens";

/** Huellas que caen, se apilan al fondo y se dejan empujar. */
export default function Huellas(p: EfectoProps) {
  return <Caida objeto="huellas" {...p} />;
}
