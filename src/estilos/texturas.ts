/** Texturas en SVG (sin archivos). */
const svg = (s: string) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;

export const RUIDO = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.4 -.35"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
);

export const CURSORES: Record<string, string> = {
  neon: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="5" fill="#ff3fd8"/><circle cx="14" cy="14" r="10" fill="none" stroke="#25f2ff" stroke-width="2" opacity=".8"/></svg>`) + " 14 14",
  retro: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" shape-rendering="crispEdges"><path d="M2 2h3v3h3v3h3v3h3v3h3v3h-6v3h3v3h-3v-3h-3v3h-3z" fill="#fff4d6" stroke="#1b1135" stroke-width="1.5"/></svg>`) + " 2 2",
  rock: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><path d="M3 3l18 7-8 3-3 8z" fill="#ff2b1c" stroke="#121110" stroke-width="2" stroke-linejoin="round"/></svg>`) + " 3 3",
  anime: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><path d="M15 2l3 9 9 1-7 6 3 10-8-6-8 6 3-10-7-6 9-1z" fill="#ffd21f" stroke="#17142a" stroke-width="2" stroke-linejoin="round"/></svg>`) + " 15 15",
  pelicula: svg(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="11" fill="none" stroke="#d9a62e" stroke-width="1.5"/><path d="M15 1v8M15 21v8M1 15h8M21 15h8" stroke="#d9a62e" stroke-width="1.5"/></svg>`) + " 15 15",
};
