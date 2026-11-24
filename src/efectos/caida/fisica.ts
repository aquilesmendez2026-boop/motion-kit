// Física de los objetos que caen: círculos con gravedad, paredes, piso y choques. Propia y chica, sin librerías.
// Sin React y sin azar: lo que varía sale de la semilla. Pensada para pasos fijos de 1/60 de segundo.
import { semilla as azar } from "../semilla";

export interface Cuerpo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Radio. */
  r: number;
  /** Giro (radianes) y cuánto gira por segundo. */
  a: number;
  w: number;
  /** Pasos seguidos sin alejarse de un punto. Desde `DORMIR`, el cuerpo duerme: no se calcula hasta que algo lo despierta. */
  quieto: number;
  /** El punto desde donde se cuentan esos pasos (lo pone la física). */
  ox?: number;
  oy?: number;
}
export interface Mundo {
  ancho: number;
  alto: number;
}
/** El dedo o el cursor: dónde está, cómo se mueve (px por segundo) y hasta dónde alcanza. */
export interface Dedo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/** Gravedad (px/s²) y rapidez máxima (px/s): más rápido, un objeto atravesaría a otro en un solo paso. */
const G = 1500;
const TOPE = 1100;
/** Cuánto rebota un choque; los más lentos que el umbral no rebotan (si no, la pila tirita). */
const REBOTE = 0.3;
const UMBRAL_REBOTE = 110;
/** Parte de la rapidez de lado que se pierde en un choque, y en cada paso apoyado en el piso. */
const ROCE = 0.2;
const ROCE_PISO = 0.08;
/**
 * El roce también agarra: lo que resbala más lento que esto (px/s) se detiene, entre objetos y en el piso. Sin eso,
 * uno de arriba se va metiendo entre dos de abajo y empuja la fila entera de a poco, por más de diez segundos.
 */
const AGARRE = 16;
const AGARRE_PISO = 14;
/** Tan cerca (px) cuenta como tocarse. */
const MARGEN = 0.6;
/**
 * Duerme el que pasa `DORMIR` pasos sin alejarse más de `HOLGURA` px de un punto. Se mira cuánto avanzó de verdad y no
 * su rapidez: un objeto apretado entre la pared y un vecino tirita en el lugar (cae, lo corrigen, vuelve a caer) y con
 * la rapidez nunca se dormiría.
 */
const HOLGURA = 1;
const DORMIR = 24;
/** Se mueve de verdad (y puede despertar a lo que toca) el que va a más de `LENTO` px/s y se alejó de su punto hace poco. */
const LENTO = 16;
const RECIEN = 2;
const VUELTAS = 8;

const numero = (v: number) => (Number.isFinite(v) ? v : 0);
const duerme = (b: Cuerpo) => b.quieto >= DORMIR;
const seMueve = (b: Cuerpo) => b.quieto <= RECIEN && b.vx * b.vx + b.vy * b.vy > LENTO * LENTO;

/**
 * `n` cuerpos que parten sobre el borde de arriba, uno más arriba que el otro (caen de a uno), con radios de 14 a
 * 26 px por `escala` (en pantallas anchas van más grandes). La misma semilla da siempre los mismos.
 */
export function crearCuerpos(n: number, mundo: Mundo, sem: number, escala = 1): Cuerpo[] {
  const cuerpos: Cuerpo[] = [];
  let y = 0;
  for (let i = 0; i < n; i++) {
    const r = (14 + azar(i, sem) * 12) * escala;
    y -= r + (10 + azar(i, sem + 1) * 50) * escala;
    cuerpos.push({
      x: r + azar(i, sem + 2) * Math.max(0, numero(mundo.ancho) - 2 * r),
      y,
      vx: (azar(i, sem + 3) - 0.5) * 120,
      vy: 0,
      r,
      a: azar(i, sem + 4) * 6.283,
      w: (azar(i, sem + 5) - 0.5) * 6,
      quieto: 0,
    });
    y -= r;
  }
  return cuerpos;
}

/** Cuántos objetos caen: 12, 20 o 30 según la variante (cualquier otra cuenta como la 1); el 60 % en pantallas angostas. */
export function cantidadObjetos(variante: number, ancho: number): number {
  return Math.round(([12, 20, 30][variante - 1] ?? 12) * (ancho < 700 ? 0.6 : 1));
}

/** Cuánto se mueven en total (masa por rapidez al cuadrado). Cero: nada se mueve. */
export function energia(cuerpos: Cuerpo[]): number {
  let e = 0;
  for (const b of cuerpos) e += 0.5 * b.r * b.r * (b.vx * b.vx + b.vy * b.vy);
  return e;
}

/** Todos duermen: no hace falta seguir calculando ni dibujando. */
export function todoQuieto(cuerpos: Cuerpo[]): boolean {
  return cuerpos.every(duerme);
}

/** Despierta a todos (por ejemplo, cuando cambia el tamaño del mundo). */
export function despertar(cuerpos: Cuerpo[]): void {
  for (const b of cuerpos) b.quieto = 0;
}

/** Duerme a todos donde están (el seguro del lienzo, por si algo no se durmiera solo). */
export function dormir(cuerpos: Cuerpo[]): void {
  for (const b of cuerpos) {
    b.quieto = DORMIR;
    b.vx = 0;
    b.vy = 0;
    b.w = 0;
  }
}

/** El dedo que se mueve arrastra lo que alcanza y lo aparta un poco. Un dedo quieto no empuja. */
function tocar(cuerpos: Cuerpo[], dedo: Dedo): void {
  const rapidez = Math.hypot(dedo.vx, dedo.vy);
  if (!(rapidez > 30) || !Number.isFinite(dedo.x + dedo.y + dedo.r + rapidez)) return;
  const k = Math.min(1, 1400 / rapidez);
  for (const b of cuerpos) {
    const dx = b.x - dedo.x;
    const dy = b.y - dedo.y;
    const alcance = dedo.r + b.r;
    const d = Math.hypot(dx, dy);
    if (!(d < alcance)) continue;
    const f = (1 - d / alcance) * 0.6;
    const nx = d > 1e-6 ? dx / d : 0;
    const ny = d > 1e-6 ? dy / d : -1;
    // Se acerca a la velocidad del dedo (nunca la pasa) y sale un poco hacia afuera.
    b.vx += (dedo.vx * k * 0.8 + nx * rapidez * k * 0.35 - b.vx) * f;
    b.vy += (dedo.vy * k * 0.8 + ny * rapidez * k * 0.35 - b.vy) * f;
    b.w += ((dedo.vx * k) / b.r - b.w) * f * 0.5;
    b.quieto = 0;
  }
}

/** Un toque: lo que está cerca del punto sale disparado hacia afuera y un poco hacia arriba. */
export function golpe(cuerpos: Cuerpo[], x: number, y: number, radio = 120, fuerza = 700): void {
  if (!Number.isFinite(x + y)) return;
  cuerpos.forEach((b, i) => {
    const dx = b.x - x;
    const dy = b.y - y;
    const alcance = radio + b.r;
    const d = Math.hypot(dx, dy);
    if (!(d < alcance)) return;
    const f = 1 - d / alcance;
    b.vx += (d > 1e-6 ? dx / d : 0) * fuerza * f;
    b.vy += ((d > 1e-6 ? dy / d : -1) - 0.35) * fuerza * f;
    b.w += (azar(i, 11) - 0.5) * 14 * f;
    b.quieto = 0;
  });
}

/**
 * Avanza un paso de `dt` segundos, cambiando los cuerpos en el lugar: gravedad, choques entre círculos (rebote 0,3 y
 * roce), paredes y piso. Con `dedo`, este los empuja. Los que llevan un rato en el mismo lugar duermen y los despierta
 * un choque, el dedo, que algo se les encime o que se mueva lo que los toca.
 */
export function pasoFisica(cuerpos: Cuerpo[], mundo: Mundo, dt: number, dedo?: Dedo | null): void {
  if (dedo) tocar(cuerpos, dedo);
  const h = dt > 0 ? Math.min(dt, 1 / 30) : 0;
  if (!h) return;
  const ancho = Math.max(0, numero(mundo.ancho));
  const alto = Math.max(0, numero(mundo.alto));
  const n = cuerpos.length;

  // 1. Quién despierta: el dormido que quedó fuera del mundo (se achicó) y el que toca a algo que de verdad se mueve
  //    (un golpe, o le sacaron el apoyo). Se mira antes de sumar la gravedad: lo apoyado no cuenta.
  for (let i = 0; i < n; i++) {
    const p = cuerpos[i];
    if (duerme(p) && (p.x < p.r - 0.5 || p.x > ancho - p.r + 0.5 || p.y > alto - p.r + 0.5)) p.quieto = 0;
    for (let j = i + 1; j < n; j++) {
      const q = cuerpos[j];
      if (duerme(p) === duerme(q)) continue;
      const alcance = p.r + q.r + MARGEN;
      const dx = q.x - p.x;
      const dy = q.y - p.y;
      if (dx * dx + dy * dy >= alcance * alcance) continue;
      if (seMueve(duerme(p) ? q : p)) (duerme(p) ? p : q).quieto = 0;
    }
  }

  // 2. Gravedad, con tope de rapidez.
  for (const b of cuerpos) {
    if (duerme(b)) continue;
    b.vy += G * h;
    const v = Math.hypot(b.vx, b.vy);
    if (v > TOPE) {
      b.vx *= TOPE / v;
      b.vy *= TOPE / v;
    }
  }

  // 3. Contactos, varias vueltas: que no se acerquen más (con rebote y roce) y separar lo encimado.
  for (let k = 0; k < VUELTAS; k++) {
    for (let i = 0; i < n; i++) {
      const p = cuerpos[i];
      for (let j = i + 1; j < n; j++) {
        const q = cuerpos[j];
        const pd = duerme(p);
        const qd = duerme(q);
        if (pd && qd) continue;
        const suma = p.r + q.r;
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= (suma + MARGEN) * (suma + MARGEN)) continue;
        const d = Math.sqrt(d2);
        // En el mismo punto no hay hacia dónde: uno sube.
        const nx = d > 1e-6 ? dx / d : 0;
        const ny = d > 1e-6 ? dy / d : -1;
        const encima = suma - d;
        // Lo que acaba de moverse y quedó encimado sobre un dormido lo despierta (así se reacomodan cuando el mundo se
        // achica). Dos que llevan rato apretados no se despiertan entre sí.
        if (encima > 1.5 && ((pd && q.quieto <= RECIEN) || (qd && p.quieto <= RECIEN))) {
          p.quieto = 0;
          q.quieto = 0;
        }
        // Lo dormido no se mueve: todo el empujón se lo lleva el otro. La masa va con el área.
        const ip = pd ? 0 : 1 / (p.r * p.r);
        const iq = qd ? 0 : 1 / (q.r * q.r);
        const rvx = q.vx - p.vx;
        const rvy = q.vy - p.vy;
        const vn = rvx * nx + rvy * ny;
        if (vn < 0) {
          const jn = (-(1 + (vn < -UMBRAL_REBOTE ? REBOTE : 0)) * vn) / (ip + iq);
          const vt = rvx * -ny + rvy * nx;
          const jt = (-vt * (Math.abs(vt) < AGARRE ? 1 : ROCE)) / (ip + iq);
          const ix = jn * nx + jt * -ny;
          const iy = jn * ny + jt * nx;
          p.vx -= ix * ip;
          p.vy -= iy * ip;
          q.vx += ix * iq;
          q.vy += iy * iq;
          p.w *= 0.9;
          q.w *= 0.9;
        }
        if (encima > 0.2) {
          const c = ((encima - 0.2) * 0.5) / (ip + iq);
          p.x -= c * ip * nx;
          p.y -= c * ip * ny;
          q.x += c * iq * nx;
          q.y += c * iq * ny;
        }
      }
    }
    for (const b of cuerpos) if (!duerme(b)) limites(b, ancho, alto, true);
  }

  // 4. Avanzar, rodar en el piso y ver quién se queda quieto.
  for (const b of cuerpos) {
    if (duerme(b)) continue;
    b.x += b.vx * h;
    b.y += b.vy * h;
    b.a += b.w * h;
    limites(b, ancho, alto, false);
    if (b.y >= alto - b.r - MARGEN) {
      b.vx *= 1 - ROCE_PISO;
      b.w += (b.vx / b.r - b.w) * 0.25;
    } else b.w *= 0.995;
    // ¿Sigue donde estaba? Si se alejó de su punto, se cuenta de nuevo desde aquí.
    const mx = b.x - (b.ox ?? b.x);
    const my = b.y - (b.oy ?? b.y);
    if (b.ox === undefined || mx * mx + my * my > HOLGURA * HOLGURA) {
      b.ox = b.x;
      b.oy = b.y;
      b.quieto = 0;
    } else b.quieto++;
    if (duerme(b)) {
      b.vx = 0;
      b.vy = 0;
      b.w = 0;
    }
  }
}

/** Paredes y piso: deja al cuerpo adentro y, con `frenar`, corta (o rebota) la velocidad que lo sacaba. */
function limites(b: Cuerpo, ancho: number, alto: number, frenar: boolean): void {
  const tope = (v: number) => (Math.abs(v) > UMBRAL_REBOTE ? -v * REBOTE : 0);
  if (b.x <= b.r + MARGEN) {
    if (b.x < b.r) b.x = b.r;
    if (frenar && b.vx < 0) b.vx = tope(b.vx);
  } else if (b.x >= ancho - b.r - MARGEN) {
    if (b.x > ancho - b.r) b.x = ancho - b.r;
    if (frenar && b.vx > 0) b.vx = tope(b.vx);
  }
  if (b.y >= alto - b.r - MARGEN) {
    if (b.y > alto - b.r) b.y = alto - b.r;
    if (frenar) {
      if (b.vy > 0) b.vy = tope(b.vy);
      if (Math.abs(b.vx) < AGARRE_PISO) b.vx = 0;
    }
  }
}

/** La pila ya en reposo (para dibujarla quieta): los mismos cuerpos, simulados hasta que duermen. */
export function apilados(n: number, mundo: Mundo, sem: number, escala = 1): Cuerpo[] {
  const cuerpos = crearCuerpos(n, mundo, sem, escala);
  for (let i = 0; i < 900 && !todoQuieto(cuerpos); i++) pasoFisica(cuerpos, mundo, 1 / 60);
  return cuerpos;
}
