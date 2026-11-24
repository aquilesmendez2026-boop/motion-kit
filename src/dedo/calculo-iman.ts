// Letras con imán: cuánto se aparta una letra del dedo. Sin React.

/**
 * Hacia dónde se corre una letra cuyo centro está a (`dx`, `dy`) del dedo (letra menos dedo). Fuera del radio, nada;
 * adentro, se aleja del dedo, más mientras más cerca: `fuerza * (1 - d / radio)²`. Justo debajo del dedo, sube.
 */
export function empujeIman(dx: number, dy: number, radio = 140, fuerza = 18): { x: number; y: number } {
  const d = Math.hypot(dx, dy);
  if (!(d < radio)) return { x: 0, y: 0 };
  if (d === 0) return { x: 0, y: -fuerza };
  const largo = fuerza * (1 - d / radio) ** 2;
  return { x: (dx / d) * largo, y: (dy / d) * largo };
}
