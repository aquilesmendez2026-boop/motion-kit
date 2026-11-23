/** Franja del día para la idea «hora del día» del encabezado. */
export type FranjaHora = "manana" | "tarde" | "noche";

/** Con la hora local del teléfono: de 6:00 a 11:59 mañana, de 12:00 a 18:59 tarde, el resto noche. */
export function franjaDe(fecha: Date): FranjaHora {
  const h = fecha.getHours();
  if (h >= 6 && h < 12) return "manana";
  if (h >= 12 && h < 19) return "tarde";
  return "noche";
}
