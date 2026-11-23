/** Los datos del negocio que pasa quien dibuja (en La Mente, desde su horario y su agenda). */
export interface DatosEstado {
  abierto: boolean;
  /** "22:00" */
  cierraA?: string;
  abreA?: { dia: string; hora: string };
  /** Fecha ISO de la próxima hora libre. */
  proximaHora?: string;
}

const dosDigitos = (n: number) => String(n).padStart(2, "0");

/** «hoy 17:30», «mañana 10:00» o «28/11 10:00», con la hora local. */
export function cuandoEs(iso: string, ahora = new Date()): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hora = `${d.getHours()}:${dosDigitos(d.getMinutes())}`;
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((dia(d) - dia(ahora)) / 86_400_000);
  if (dias === 0) return `hoy ${hora}`;
  if (dias === 1) return `mañana ${hora}`;
  return `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)} ${hora}`;
}

/** Las frases del estado: «Abierto ahora · cierra a las 22:00» y, si hay, «Próxima hora libre: hoy 17:30». */
export function frasesEstado(d: DatosEstado, ahora = new Date()): string[] {
  const principal = d.abierto
    ? `Abierto ahora${d.cierraA ? ` · cierra a las ${d.cierraA}` : ""}`
    : `Cerrado${d.abreA ? ` · abre el ${d.abreA.dia} a las ${d.abreA.hora}` : ""}`;
  const cuando = d.proximaHora ? cuandoEs(d.proximaHora, ahora) : null;
  return cuando ? [principal, `Próxima hora libre: ${cuando}`] : [principal];
}

/** El chip del estado del negocio en el encabezado. */
export function EstadoNegocio({ datos, ahora }: { datos: DatosEstado; ahora?: Date }) {
  const [principal, proxima] = frasesEstado(datos, ahora);
  return (
    <p className="mk-enc-estado" data-abierto={datos.abierto ? "" : undefined}>
      <i aria-hidden="true" />
      <span>{principal}</span>
      {proxima && <span className="mk-enc-estado-proxima">{proxima}</span>}
    </p>
  );
}
