/**
 * Generador de códigos QR propio (sin librerías): modo byte (UTF-8), corrección M, versiones 1 a 40
 * (hasta 2.331 bytes; una URL corta queda en un código chico y fácil de leer). Sigue la norma ISO/IEC 18004; basado en el algoritmo
 * público de Project Nayuki, reescrito y reducido para motion-kit.
 * Devuelve una matriz de módulos: `true` es oscuro.
 */

// Corrección M, por versión (índice 0 sin uso).
const ECC_POR_BLOQUE = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28];
const BLOQUES = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49];
const VERSION_MAX = 40;

const modulosDatos = (v: number) => {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const n = Math.floor(v / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (v >= 7) r -= 36;
  }
  return r;
};
const capacidad = (v: number) => Math.floor(modulosDatos(v) / 8) - ECC_POR_BLOQUE[v] * BLOQUES[v];

// Aritmética en GF(2^8) con el polinomio 0x11D.
const mul = (x: number, y: number) => {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
};
const divisor = (grado: number) => {
  const r: number[] = new Array(grado - 1).fill(0);
  r.push(1);
  let raiz = 1;
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = mul(r[j], raiz);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    raiz = mul(raiz, 0x02);
  }
  return r;
};
const resto = (datos: number[], div: number[]) => {
  const r = div.map(() => 0);
  for (const b of datos) {
    const f = b ^ (r.shift() as number);
    r.push(0);
    div.forEach((c, i) => (r[i] ^= mul(c, f)));
  }
  return r;
};

const alineaciones = (v: number, tam: number) => {
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2;
  const paso = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
  const r = [6];
  for (let p = tam - 7; r.length < n; p -= paso) r.splice(1, 0, p);
  return r;
};

const MASCARAS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

export function generarQR(texto: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(texto));
  let v = 1;
  for (; v <= VERSION_MAX; v++) {
    const bitsLargo = v <= 9 ? 8 : 16;
    if (4 + bitsLargo + bytes.length * 8 <= capacidad(v) * 8) break;
  }
  if (v > VERSION_MAX) throw new Error("El texto es muy largo para el QR (máximo 2.331 bytes)");
  const tam = v * 4 + 17;

  // 1. Bits: modo byte, largo, datos, terminador y relleno.
  const bits: number[] = [];
  const poner = (valor: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
  };
  poner(0b0100, 4);
  poner(bytes.length, v <= 9 ? 8 : 16);
  bytes.forEach((b) => poner(b, 8));
  const cap = capacidad(v) * 8;
  poner(0, Math.min(4, cap - bits.length));
  poner(0, (8 - (bits.length % 8)) % 8);
  for (let relleno = 0xec; bits.length < cap; relleno ^= 0xec ^ 0x11) poner(relleno, 8);
  const datos: number[] = [];
  for (let i = 0; i < bits.length; i += 8) datos.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

  // 2. Corrección de errores por bloque e intercalado.
  const nBloques = BLOQUES[v];
  const ecc = ECC_POR_BLOQUE[v];
  const crudos = Math.floor(modulosDatos(v) / 8);
  const cortos = nBloques - (crudos % nBloques);
  const largoCorto = Math.floor(crudos / nBloques);
  const div = divisor(ecc);
  const bloques: number[][] = [];
  for (let i = 0, k = 0; i < nBloques; i++) {
    const d = datos.slice(k, k + largoCorto - ecc + (i < cortos ? 0 : 1));
    k += d.length;
    const e = resto(d, div);
    if (i < cortos) d.push(0);
    bloques.push(d.concat(e));
  }
  const final: number[] = [];
  for (let i = 0; i < bloques[0].length; i++)
    bloques.forEach((b, j) => {
      if (i !== largoCorto - ecc || j >= cortos) final.push(b[i]);
    });

  // 3. Patrones fijos.
  const m: boolean[][] = Array.from({ length: tam }, () => new Array(tam).fill(false));
  const fijo: boolean[][] = Array.from({ length: tam }, () => new Array(tam).fill(false));
  const fijar = (x: number, y: number, oscuro: boolean) => {
    m[y][x] = oscuro;
    fijo[y][x] = true;
  };
  for (let i = 0; i < tam; i++) {
    fijar(6, i, i % 2 === 0);
    fijar(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [[3, 3], [tam - 4, 3], [3, tam - 4]])
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || x >= tam || y < 0 || y >= tam) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        fijar(x, y, d !== 2 && d !== 4);
      }
  const al = alineaciones(v, tam);
  al.forEach((ax, i) =>
    al.forEach((ay, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) fijar(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }),
  );
  const formato = (mascara: number) => {
    const d = (0 << 3) | mascara; // corrección M = 00
    let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412;
    const bit = (i: number) => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) fijar(8, i, bit(i));
    fijar(8, 7, bit(6));
    fijar(8, 8, bit(7));
    fijar(7, 8, bit(8));
    for (let i = 9; i < 15; i++) fijar(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) fijar(tam - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) fijar(8, tam - 15 + i, bit(i));
    fijar(8, tam - 8, true);
  };
  formato(0);
  if (v >= 7) {
    let r = v;
    for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const b = (v << 12) | r;
    for (let i = 0; i < 18; i++) {
      const oscuro = ((b >>> i) & 1) === 1;
      const a = tam - 11 + (i % 3), c = Math.floor(i / 3);
      fijar(a, c, oscuro);
      fijar(c, a, oscuro);
    }
  }

  // 4. Datos en zigzag.
  let k = 0;
  for (let der = tam - 1; der >= 1; der -= 2) {
    if (der === 6) der = 5;
    for (let vert = 0; vert < tam; vert++)
      for (let j = 0; j < 2; j++) {
        const x = der - j;
        const arriba = ((der + 1) & 2) === 0;
        const y = arriba ? tam - 1 - vert : vert;
        if (!fijo[y][x] && k < final.length * 8) {
          m[y][x] = ((final[k >>> 3] >>> (7 - (k & 7))) & 1) === 1;
          k++;
        }
      }
  }

  // 5. La máscara con menos penalización.
  const aplicar = (n: number) => {
    for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) if (!fijo[y][x] && MASCARAS[n](x, y)) m[y][x] = !m[y][x];
  };
  const penalidad = () => {
    let p = 0;
    const linea = (get: (i: number, j: number) => boolean) => {
      for (let i = 0; i < tam; i++) {
        let corrida = 1;
        for (let j = 1; j <= tam; j++) {
          if (j < tam && get(i, j) === get(i, j - 1)) corrida++;
          else {
            if (corrida >= 5) p += corrida - 2;
            corrida = 1;
          }
        }
        for (let j = 0; j + 10 < tam; j++) {
          const s = Array.from({ length: 11 }, (_, q) => (get(i, j + q) ? 1 : 0)).join("");
          if (s === "10111010000" || s === "00001011101") p += 40;
        }
      }
    };
    linea((i, j) => m[i][j]);
    linea((i, j) => m[j][i]);
    for (let y = 0; y + 1 < tam; y++) for (let x = 0; x + 1 < tam; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
    const oscuros = m.reduce((s, f) => s + f.filter(Boolean).length, 0);
    p += Math.floor(Math.abs((oscuros * 20) / (tam * tam) - 10)) * 10;
    return p;
  };
  let mejor = 0;
  let menor = Infinity;
  for (let n = 0; n < 8; n++) {
    formato(n);
    aplicar(n);
    const pe = penalidad();
    if (pe < menor) {
      menor = pe;
      mejor = n;
    }
    aplicar(n);
  }
  formato(mejor);
  aplicar(mejor);
  return m;
}

/** El QR como un `d` de SVG (un cuadrado por módulo oscuro), con 4 módulos de margen. */
export function caminoQR(texto: string): { d: string; lado: number } {
  const m = generarQR(texto);
  const borde = 4;
  let d = "";
  m.forEach((fila, y) => fila.forEach((o, x) => o && (d += `M${x + borde} ${y + borde}h1v1h-1z`)));
  return { d, lado: m.length + borde * 2 };
}
