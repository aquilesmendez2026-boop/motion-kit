import type { EstiloId } from "../estilos/estilos";

const enc = (s: string) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;

/** Ilustración de relleno con el sello del estilo, para cuando todavía no hay foto real. */
export function imagenGenerada(estilo: EstiloId, tono = 300): string {
  const a = `hsl(${tono} 85% 60%)`;
  const b = `hsl(${(tono + 60) % 360} 80% 45%)`;
  const caja = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice"`;
  switch (estilo) {
    case "neon":
      return enc(`<svg ${caja}><rect width="400" height="260" fill="#0b0920"/><g fill="none" stroke-linecap="round"><circle cx="200" cy="120" r="62" stroke="${a}" stroke-width="6" opacity=".9"/><circle cx="200" cy="120" r="62" stroke="${a}" stroke-width="18" opacity=".18"/><path d="M60 220h280" stroke="${b}" stroke-width="5"/><path d="M60 220h280" stroke="${b}" stroke-width="16" opacity=".2"/></g></svg>`);
    case "retro": {
      let px = "";
      for (let y = 0; y < 13; y++) for (let x = 0; x < 20; x++) if ((x * 7 + y * 13 + tono) % 11 < 3) px += `<rect x="${x * 20}" y="${y * 20}" width="20" height="20" fill="${(x + y) % 3 ? a : b}" opacity=".85"/>`;
      return enc(`<svg ${caja} shape-rendering="crispEdges"><rect width="400" height="260" fill="#2a1c52"/>${px}</svg>`);
    }
    case "rock":
      return enc(`<svg ${caja}><rect width="400" height="260" fill="#1f1d1a"/><g transform="rotate(-14 200 130)"><rect x="-40" y="70" width="480" height="46" fill="${a}"/><rect x="-40" y="140" width="480" height="16" fill="#f2ede3"/></g><circle cx="300" cy="70" r="30" fill="none" stroke="#f2ede3" stroke-width="6"/></svg>`);
    case "anime":
      return enc(`<svg ${caja}><defs><pattern id="p" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.4" fill="${b}" opacity=".5"/></pattern></defs><rect width="400" height="260" fill="#fff"/><rect width="400" height="260" fill="url(#p)"/><path d="M200 20l30 70 75-20-50 60 60 50-80-5-10 75-30-65-60 45 20-70-70-25 75-15z" fill="${a}" stroke="#17142a" stroke-width="6" stroke-linejoin="round"/></svg>`);
    case "pelicula":
      return enc(`<svg ${caja}><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="hsl(${tono} 30% 30%)"/><stop offset="1" stop-color="#0c0b0a"/></linearGradient></defs><rect width="400" height="260" fill="url(#g)"/><circle cx="290" cy="90" r="40" fill="#efe6d2" opacity=".25"/><path d="M0 260 L120 150 L190 200 L270 120 L400 230 V260Z" fill="#000" opacity=".55"/><g fill="#0c0b0a">${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 42 + 8}" y="6" width="22" height="14" rx="3"/><rect x="${i * 42 + 8}" y="240" width="22" height="14" rx="3"/>`).join("")}</g></svg>`);
  }
}
