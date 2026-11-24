// Los dibujos de los objetos que caen: trazos propios en una caja de 24 (como un ícono), centrados en (12, 12) y
// dentro de un círculo de radio 11, que es lo que choca. Se dibujan con línea (sin relleno).

const circulo = (x: number, y: number, r: number) => `M${x + r} ${y}A${r} ${r} 0 1 1 ${x - r} ${y}A${r} ${r} 0 1 1 ${x + r} ${y}Z`;

export const OBJETOS: Record<"granos" | "tijeras" | "huellas" | "pesas" | "lapices", string> = {
  // Grano de café: un óvalo y su surco.
  granos: "M12 2.5A7 9.5 0 1 1 12 21.5A7 9.5 0 1 1 12 2.5ZM12 2.5C9 8 15 16 12 21.5",
  // Tijeras: dos anillos y dos hojas que se cruzan.
  tijeras: `${circulo(7, 17.5, 2.8)}${circulo(17, 17.5, 2.8)}M8.7 15.3L17 3M15.3 15.3L7 3`,
  // Huella: la almohadilla y cuatro dedos.
  huellas: `M12 12.4C14.8 12.4 17.2 14.7 17.2 17.2C17.2 18.9 15.9 20 14.3 20C13.4 20 12.8 19.5 12 19.5C11.2 19.5 10.6 20 9.7 20C8.1 20 6.8 18.9 6.8 17.2C6.8 14.7 9.2 12.4 12 12.4Z${circulo(5.6, 10.6, 1.7)}${circulo(9.6, 6.4, 1.8)}${circulo(14.4, 6.4, 1.8)}${circulo(18.4, 10.6, 1.7)}`,
  // Pesa: la barra y dos discos por lado.
  pesas: "M8 12H16M5 7H8V17H5ZM16 7H19V17H16ZM2.5 9.5H5V14.5H2.5ZM19 9.5H21.5V14.5H19Z",
  // Lápiz: el cuerpo en diagonal, la punta y la goma.
  lapices: "M4.2 19.8L5.4 15.2L16.4 4.2L19.8 7.6L8.8 18.6ZM5.4 15.2L8.8 18.6M14.4 6.2L17.8 9.6",
};
