import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("la entrada principal ya no trae los medidores del editor", () => {
  const indice = readFileSync("src/index.ts", "utf8");
  assert.ok(!/export \* from "\.\/entradas\/escena"/.test(indice));
  for (const n of ["MedidorPeso", "MedidorFluidez", "MedidorCarga", "SemaforoContraste", "medirPeso"]) assert.ok(!indice.includes(n), n);
  const escena = readFileSync("src/entradas/escena.ts", "utf8");
  for (const n of ["MedidorPeso", "MedidorFluidez", "ShaderFondo"]) assert.ok(escena.includes(n), n);
  assert.ok(indice.includes("ShaderFondo") && indice.includes("useNivelEscena"));
});

// --- Lo calculable de cada efecto ---
import { topPila } from "../src/relatos/medidas-pila";
import { SIGNOS, SIGNOS_ANGOSTOS, cuadroDescifrar } from "../src/estilos/descifrar";
import { pasoResorte } from "../src/dedo/resorte";
import { empujeIman } from "../src/dedo/calculo-iman";
import { pasoPendulo, penduloDormido, vientoDe } from "../src/dedo/calculo-pendulo";
import { inclinacionDe, velocidadScroll, type MuestraScroll } from "../src/dedo/calculo-impulso";
import { crearPuntos, moverPuntos, enlaces, cantidadPuntos } from "../src/efectos/fondos/calculo-constelacion";
import { recortarEstela, chispasDe, pasoChispas, tramosEstela } from "../src/dedo/calculo-estela";

test("topPila", () => {
  assert.equal(topPila(300, 800), 0);
  assert.equal(topPila(1200, 800), -400);
  assert.equal(topPila(NaN, 800), 0);
});

test("cuadroDescifrar termina en el original y respeta espacios", () => {
  const letras = Array.from("Ñandú & Café 100% ☕");
  const ini = cuadroDescifrar(letras, 0, 7);
  assert.equal(ini.length, letras.length);
  letras.forEach((l, i) => (l === " " ? assert.equal(ini[i], " ") : assert.ok((SIGNOS + SIGNOS_ANGOSTOS).includes(ini[i]))));
  assert.deepEqual(cuadroDescifrar(letras, 1200, 7), letras);
  assert.deepEqual(cuadroDescifrar(letras, 300, 7), cuadroDescifrar(letras, 300, 7));
  assert.equal(cuadroDescifrar(letras, 46, 7)[0], "Ñ");
});

test("empujeIman", () => {
  assert.deepEqual(empujeIman(200, 0), { x: 0, y: 0 });
  const m = empujeIman(70, 0);
  assert.ok(Math.abs(m.x - 4.5) < 1e-9 && m.y === 0);
  assert.deepEqual(empujeIman(0, 0), { x: 0, y: -18 });
  assert.ok(empujeIman(-30, 0).x < 0);
});

test("pasoResorte vuelve al objetivo y se pasa un poco", () => {
  let e = { x: 10, v: 0 };
  let minimo = 10;
  for (let i = 0; i < 300; i++) {
    e = pasoResorte(e, 0, 1 / 60);
    minimo = Math.min(minimo, e.x);
  }
  assert.ok(Math.abs(e.x) < 0.01 && Math.abs(e.v) < 0.01);
  assert.ok(minimo < 0);
});

test("pasoPendulo se asienta y se balancea", () => {
  let e = { a: 7, w: 0 };
  let minimo = 7;
  let maximo = 7;
  for (let i = 0; i < 240; i++) {
    e = pasoPendulo(e, 1 / 60);
    minimo = Math.min(minimo, e.a);
    maximo = Math.max(maximo, e.a);
  }
  assert.ok(Math.abs(e.a) < 0.1 && minimo < 0 && maximo <= 7.01);
  assert.ok(!penduloDormido({ a: 7, w: 0 }) && penduloDormido({ a: 0.01, w: 0.01 }));
  let o = { a: 0, w: 0 };
  for (let i = 0; i < 400; i++) o = pasoPendulo(o, 1 / 60, 3);
  assert.ok(Math.abs(o.a - 3) < 0.1);
});

test("inclinacionDe", () => {
  assert.equal(inclinacionDe(0), 0);
  assert.equal(inclinacionDe(600), 0.75);
  assert.equal(inclinacionDe(99999), 1.5);
  assert.equal(inclinacionDe(-99999), -1.5);
  assert.equal(inclinacionDe(NaN), 0);
});

test("velocidadScroll: pareja aunque el scroll llegue a saltos, y cero al parar", () => {
  const m: MuestraScroll[] = [];
  assert.equal(velocidadScroll(m, 0, 0), 0, "con una sola muestra no hay velocidad");
  // 120 px cada dos cuadros de 16 ms (como la rueda del mouse): de verdad son 3.750 px por segundo.
  let y = 0;
  const vistas: number[] = [];
  for (let i = 1; i <= 30; i++) {
    if (i % 2) y += 120;
    const v = velocidadScroll(m, i * 16, y);
    if (i > 8) vistas.push(v);
  }
  assert.ok(vistas.every((v) => v > 3000 && v < 4500), `sin saltos entre cuadros: ${vistas.map(Math.round).join(" ")}`);
  assert.ok(m.length <= 9, `guarda solo lo de la ventana (${m.length} muestras)`);
  // Al parar, pasa la ventana y queda en cero.
  let v = 1;
  for (let i = 31; i <= 40; i++) v = velocidadScroll(m, i * 16, y);
  assert.equal(v, 0);
  // Hacia arriba es negativa; dos muestras en el mismo instante no dividen por cero.
  const n: MuestraScroll[] = [];
  velocidadScroll(n, 0, 500);
  assert.equal(velocidadScroll(n, 0, 400), 0);
  assert.ok(velocidadScroll(n, 50, 400) < 0);
});

test("constelación: enlaces y movimiento", () => {
  const e = enlaces([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 500, y: 0 }]);
  assert.equal(e.length, 1);
  assert.deepEqual(e[0].slice(0, 2), [0, 1]);
  assert.ok(Math.abs(e[0][2] - (1 - 50 / 110)) < 1e-9);
  const p = crearPuntos(40, 300, 200, 4);
  assert.deepEqual(p, crearPuntos(40, 300, 200, 4));
  for (let i = 0; i < 600; i++) moverPuntos(p, 1 / 60, 300, 200);
  assert.ok(p.every((q) => q.x >= 0 && q.x <= 300 && q.y >= 0 && q.y <= 200));
  const q = [{ x: 100, y: 100, vx: 0, vy: 0 }];
  moverPuntos(q, 1 / 60, 300, 200, { x: 150, y: 100 });
  assert.ok(q[0].x > 100);
});

test("estela y chispas", () => {
  const p = [{ x: 0, y: 0, t: 0 }, { x: 1, y: 1, t: 300 }, { x: 2, y: 2, t: 600 }];
  assert.deepEqual(recortarEstela(p, 700).map((q) => q.t), [300, 600]);
  const c = chispasDe(10, 10, 3);
  assert.equal(c.length, 10);
  assert.deepEqual(c, chispasDe(10, 10, 3));
  assert.ok(c.every((q) => { const v = Math.hypot(q.vx, q.vy); return v >= 80 && v <= 260; }));
  let vivas = c;
  for (let i = 0; i < 36; i++) vivas = pasoChispas(vivas, 1 / 60);
  assert.equal(vivas.length, 0);
});

// --- Objetos del rubro que caen ---
import { crearCuerpos, pasoFisica, energia, todoQuieto, apilados, golpe, dormir, despertar, cantidadObjetos, type Cuerpo, type Mundo } from "../src/efectos/caida/fisica";
import { OBJETOS } from "../src/efectos/caida/objetos";
import { validarReceta } from "../src/receta/receta";

const adentro = (c: Cuerpo[], mundo: Mundo) => {
  for (const b of c) assert.ok(b.x >= b.r - 0.5 && b.x <= mundo.ancho - b.r + 0.5 && b.y <= mundo.alto - b.r + 0.5, `adentro: ${JSON.stringify(b)}`);
};
const sinEncimarse = (c: Cuerpo[]) => {
  for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) assert.ok(Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y) >= c[i].r + c[j].r - 1.5, `${i} y ${j} se enciman`);
};

test("física: caen, no se enciman y se duermen", () => {
  const mundo = { ancho: 400, alto: 300 };
  const c = crearCuerpos(20, mundo, 5);
  for (let i = 0; i < 900; i++) pasoFisica(c, mundo, 1 / 60);
  for (const b of c) assert.ok(b.x >= b.r - 0.5 && b.x <= mundo.ancho - b.r + 0.5 && b.y <= mundo.alto - b.r + 0.5);
  for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) assert.ok(Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y) >= c[i].r + c[j].r - 1.5);
  assert.ok(todoQuieto(c));
  assert.deepEqual(crearCuerpos(20, mundo, 5), crearCuerpos(20, mundo, 5));
  assert.deepEqual(crearCuerpos(0, mundo, 5), []);
});

test("física: el dedo empuja y un mundo más chico los deja adentro", () => {
  const mundo = { ancho: 400, alto: 300 };
  const c = apilados(12, mundo, 3);
  const antes = energia(c);
  pasoFisica(c, mundo, 1 / 60, { x: c[0].x, y: c[0].y, vx: 300, vy: -200, r: 40 });
  assert.ok(energia(c) > antes);
  const chico = { ancho: 240, alto: 300 };
  for (let i = 0; i < 300; i++) pasoFisica(c, chico, 1 / 60);
  for (const b of c) assert.ok(b.x <= chico.ancho - b.r + 0.5);
});

test("física: parten sobre el borde de arriba, escalonados, y la corrida se repite igual", () => {
  const mundo = { ancho: 360, alto: 420 };
  const c = crearCuerpos(10, mundo, 2);
  assert.ok(c.every((b) => b.r >= 14 && b.r <= 26 && b.y + b.r <= 0 && b.x >= b.r && b.x <= mundo.ancho - b.r), "sobre el borde de arriba, con radios de 14 a 26");
  assert.equal(new Set(c.map((b) => Math.round(b.y))).size, c.length, "no parten todos a la misma altura");
  // En pantallas anchas van más grandes: la misma tanda, con los radios multiplicados.
  const grandes = crearCuerpos(10, mundo, 2, 1.5);
  assert.ok(grandes.every((b, i) => Math.abs(b.r - c[i].r * 1.5) < 1e-9 && b.y + b.r <= 0 && b.x >= b.r && b.x <= mundo.ancho - b.r));
  assert.ok(todoQuieto(apilados(10, mundo, 2, 1.5)) && apilados(10, mundo, 2, 1.5).every((b) => b.r >= 21));
  assert.deepEqual(apilados(18, mundo, 9), apilados(18, mundo, 9));
  const pila = apilados(18, mundo, 9);
  assert.ok(todoQuieto(pila));
  adentro(pila, mundo);
  sinEncimarse(pila);
  assert.ok(pila.every((b) => b.y > mundo.alto / 3), "la pila queda abajo");
});

test("física: un toque los dispersa, vuelven a dormirse y un toque lejos no los despierta", () => {
  const mundo = { ancho: 400, alto: 300 };
  const c = apilados(12, mundo, 3);
  assert.ok(todoQuieto(c) && energia(c) === 0);
  golpe(c, c[0].x + 3, c[0].y + 3);
  assert.ok(energia(c) > 0 && !todoQuieto(c));
  for (let i = 0; i < 900 && !todoQuieto(c); i++) pasoFisica(c, mundo, 1 / 60);
  assert.ok(todoQuieto(c), "vuelven a dormirse");
  adentro(c, mundo);
  sinEncimarse(c);
  golpe(c, -500, -500);
  assert.ok(todoQuieto(c) && energia(c) === 0);
  // Un dedo quieto encima no empuja: solo el que se mueve.
  pasoFisica(c, mundo, 1 / 60, { x: c[0].x, y: c[0].y, vx: 0, vy: 0, r: 40 });
  assert.ok(todoQuieto(c));
});

test("física: una pila apretada (30 objetos en un teléfono) también se duerme, y después de un toque", () => {
  // Medido el 24-11: con la fila de abajo apretada entre las paredes, la pila tiritaba para siempre.
  for (const [ancho, alto, n, sem] of [[390, 640, 30, 2], [390, 640, 30, 3], [360, 520, 30, 1], [320, 300, 30, 3], [320, 300, 12, 3], [390, 640, 20, 2]]) {
    const mundo = { ancho, alto };
    const c = apilados(n, mundo, sem);
    assert.ok(todoQuieto(c), `${ancho}x${alto}, ${n} objetos, semilla ${sem}: se duerme`);
    adentro(c, mundo);
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) assert.ok(Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y) >= c[i].r + c[j].r - 4, `${ancho}x${alto}, ${n}, ${sem}: ${i} y ${j} muy encimados`);
    golpe(c, ancho / 2, alto - 30);
    let pasos = 0;
    while (pasos < 900 && !todoQuieto(c)) {
      pasoFisica(c, mundo, 1 / 60);
      pasos++;
    }
    assert.ok(todoQuieto(c), `${ancho}x${alto}, ${n} objetos, semilla ${sem}: tras un toque vuelve a dormirse`);
  }
});

test("física: la pila se asienta pronto (no se queda resbalando de a poco)", () => {
  // Medido el 24-11: uno de arriba se iba metiendo entre dos de abajo y empujaba la fila entera a 10 px por segundo
  // durante más de 10 segundos. Con roce que frena lo lento, se asientan poco después de caer el último.
  for (const [ancho, alto, n, sem] of [[1920, 700, 18, 9], [760, 360, 18, 8], [1280, 640, 30, 14], [1920, 700, 30, 25]]) {
    const mundo = { ancho, alto };
    const c = crearCuerpos(n, mundo, sem, Math.max(1, Math.min(1.5, ancho / 700)));
    let pasos = 0;
    while (pasos < 900 && !todoQuieto(c)) {
      pasoFisica(c, mundo, 1 / 60);
      pasos++;
    }
    assert.ok(pasos <= 480, `${ancho}x${alto}, ${n} objetos, semilla ${sem}: tardó ${(pasos / 60).toFixed(1)} s en asentarse`);
    adentro(c, mundo);
    sinEncimarse(c);
  }
});

test("física: si se llevan al de abajo, el de arriba no queda en el aire", () => {
  const mundo = { ancho: 300, alto: 200 };
  const abajo: Cuerpo = { x: 150, y: 180, vx: 0, vy: 0, r: 20, a: 0, w: 0, quieto: 999 };
  const arriba: Cuerpo = { x: 150, y: 140, vx: 0, vy: 0, r: 20, a: 0, w: 0, quieto: 999 };
  const c = [abajo, arriba];
  assert.ok(todoQuieto(c));
  // Un dedo chico que solo alcanza al de abajo y lo empuja de lado.
  pasoFisica(c, mundo, 1 / 60, { x: 140, y: 185, vx: 900, vy: 0, r: 12 });
  assert.ok(abajo.vx > 0);
  for (let i = 0; i < 600 && !todoQuieto(c); i++) pasoFisica(c, mundo, 1 / 60);
  assert.ok(todoQuieto(c));
  assert.ok(Math.abs(arriba.y - (mundo.alto - arriba.r)) < 1, `el de arriba baja al piso (quedó en y ${arriba.y.toFixed(1)})`);
});

test("física: entradas raras no la rompen", () => {
  const mundo = { ancho: 400, alto: 300 };
  assert.doesNotThrow(() => pasoFisica([], mundo, 1 / 60));
  assert.ok(todoQuieto([]));
  assert.equal(energia([]), 0);
  assert.deepEqual(apilados(0, mundo, 1), []);
  assert.deepEqual(crearCuerpos(-3, mundo, 1), []);
  const c = crearCuerpos(8, mundo, 1);
  c[1].x = c[0].x;
  c[1].y = c[0].y;
  for (const dt of [0, 1 / 60, 5, NaN, -1]) pasoFisica(c, mundo, dt);
  pasoFisica(c, { ancho: 0, alto: 0 }, 1 / 60);
  pasoFisica(c, mundo, 1 / 60, { x: NaN, y: 0, vx: 500, vy: 0, r: 40 });
  golpe(c, NaN, NaN);
  for (const b of c) for (const k of ["x", "y", "vx", "vy", "a", "w"] as const) assert.ok(Number.isFinite(b[k]), `${k}: ${b[k]}`);
  // Un mundo más angosto que un objeto: no lanza ni deja valores rotos.
  const angosto = crearCuerpos(4, { ancho: 20, alto: 300 }, 1);
  for (let i = 0; i < 200; i++) pasoFisica(angosto, { ancho: 20, alto: 300 }, 1 / 60);
  for (const b of angosto) assert.ok(Number.isFinite(b.x) && Number.isFinite(b.y));
});

test("física: dormir y despertar a todos", () => {
  const mundo = { ancho: 400, alto: 300 };
  const c = crearCuerpos(6, mundo, 1);
  for (let i = 0; i < 30; i++) pasoFisica(c, mundo, 1 / 60);
  assert.ok(!todoQuieto(c) && energia(c) > 0);
  // Dormir a la fuerza (el seguro del lienzo si algo no se durmiera solo): quedan quietos donde están.
  dormir(c);
  assert.ok(todoQuieto(c) && energia(c) === 0);
  const donde = c.map((b) => [b.x, b.y]);
  pasoFisica(c, mundo, 1 / 60);
  assert.deepEqual(c.map((b) => [b.x, b.y]), donde);
  // Despertar (cambió el tamaño): vuelven a caer hasta el piso.
  despertar(c);
  assert.ok(!todoQuieto(c));
  for (let i = 0; i < 900 && !todoQuieto(c); i++) pasoFisica(c, mundo, 1 / 60);
  assert.ok(todoQuieto(c) && c.every((b) => b.y > mundo.alto / 2));
});

test("los cinco objetos tienen su dibujo", () => {
  assert.deepEqual(Object.keys(OBJETOS).sort(), ["granos", "huellas", "lapices", "pesas", "tijeras"]);
  for (const [id, d] of Object.entries(OBJETOS)) assert.match(d, /^M[MmLlHhVvCcSsQqTtAaZz0-9 .,-]+$/, id);
});

test("la receta acepta los objetos que caen y el contrato los lista", () => {
  const contrato = JSON.parse(readFileSync("contrato/encabezado-motionkit.json", "utf8"));
  for (const efecto of ["granos", "tijeras", "huellas", "pesas", "lapices"]) {
    assert.ok(validarReceta({ version: 2, estilo: "neon", titulo: "Hola", efecto }).ok, efecto);
    assert.ok(contrato.listas.efecto.includes(efecto), `contrato: ${efecto}`);
  }
});

test("la receta acepta la constelación y el contrato la lista", () => {
  assert.ok(validarReceta({ version: 2, estilo: "neon", titulo: "Hola", efecto: "constelacion", variante: 3 }).ok);
  const contrato = JSON.parse(readFileSync("contrato/encabezado-motionkit.json", "utf8"));
  assert.ok(contrato.listas.efecto.includes("constelacion"));
});

// --- Lámpara de lava ---
import { SHADERS, SHADER_IDS } from "../src/escena/ShaderFondo";

test("la lámpara de lava está en la lista de shaders", () => {
  assert.ok((SHADER_IDS as string[]).includes("lava"));
  assert.deepEqual((SHADERS as Record<string, unknown>).lava, { nombre: "Lámpara de lava", descripcion: "Manchas de color que suben, bajan y se funden; el dedo suma una." });
});

test("los shaders piden precisión alta cuando el teléfono la tiene", () => {
  // Con precisión media (16 bits en muchos teléfonos) el tiempo avanza a saltos al poco rato y el fondo se ve trabado.
  // En el navegador de las pruebas media y alta son lo mismo, así que no se nota ahí: se revisa que el código la pida.
  const fuente = readFileSync("src/escena/ShaderFondo.tsx", "utf8");
  assert.match(fuente, /#ifdef\s+GL_FRAGMENT_PRECISION_HIGH\s+precision\s+highp\s+float;\s+#else\s+precision\s+mediump\s+float;\s+#endif/);
});

test("tramosEstela: une los puntos seguidos, más tenue lo más viejo, y no une a través de un corte", () => {
  const p = [{ x: 0, y: 0, t: 100 }, { x: 10, y: 0, t: 400 }, { x: 20, y: 0, t: 500 }, { x: 500, y: 90, t: 800, corte: true }, { x: 510, y: 90, t: 820 }];
  const t = tramosEstela(p, 830);
  // El primer punto ya venció (más de 450 ms): quedan 400→500 y 800→820; el salto a (500, 90) no se dibuja.
  assert.deepEqual(t.map((s) => [s.x1, s.x2]), [[10, 20], [500, 510]]);
  assert.ok(t[0].fresco > 0 && t[0].fresco < t[1].fresco && t[1].fresco <= 1);
  assert.deepEqual(tramosEstela([], 0), []);
  assert.deepEqual(tramosEstela([{ x: 1, y: 1, t: 0 }], 10), []);
});

// --- Qué baja al cargar y qué baja aparte ---
import { build } from "esbuild";

/** Los archivos que una entrada carga de inmediato (sin contar lo que baja con `import()`). */
async function alCargar(entrada: string): Promise<Set<string>> {
  const r = await build({ entryPoints: [entrada], bundle: true, write: false, metafile: true, format: "esm", platform: "browser", packages: "external", jsx: "automatic", logLevel: "silent" });
  const fijos = new Set<string>();
  const pendientes = [entrada];
  while (pendientes.length) {
    const k = pendientes.pop()!;
    if (fijos.has(k)) continue;
    fijos.add(k);
    for (const i of r.metafile.inputs[k]?.imports ?? []) if (i.kind === "import-statement" && !i.external) pendientes.push(i.path);
  }
  return fijos;
}

test("lo nuevo se baja aparte: no entra en lo que carga de inmediato el encabezado ni la página", async () => {
  const encabezado = await alCargar("src/entradas/encabezado.ts");
  for (const f of ["src/dedo/Iman.tsx", "src/dedo/Colgante.tsx", "src/efectos/caida/Caida.tsx", "src/efectos/caida/fisica.ts", "src/efectos/fondos/Constelacion.tsx", "src/efectos/lienzo.ts", "src/estilos/descifrar.ts"]) assert.ok(!encabezado.has(f), `encabezado: ${f}`);
  const pagina = await alCargar("src/entradas/pagina.ts");
  for (const f of ["src/relatos/Pila.tsx", "src/dedo/Impulso.tsx", "src/dedo/Estela.tsx", "src/efectos/lienzo.ts"]) assert.ok(!pagina.has(f), `página: ${f}`);
  assert.ok(encabezado.has("src/encabezados/Encabezado.tsx") && pagina.has("src/relatos/PaginaRelato.tsx"), "la cuenta mira los archivos correctos");
});

test("la entrada de página no carga el componente Estilo: solo lee su contexto", async () => {
  // PaginaRelato solo necesita saber qué estilo rige. Si importa el componente, la página baja además su CSS, sus
  // cursores y sus sonidos aunque no use <Estilo> (medido el 24-11: casi 9 KB sin comprimir de peso muerto).
  const pagina = await alCargar("src/entradas/pagina.ts");
  for (const f of ["src/estilos/Estilo.tsx", "src/estilos/css.ts", "src/estilos/texturas.ts", "src/estilos/sonidos.ts"]) assert.ok(!pagina.has(f), f);
});

test("constelación: cuántos puntos según la variante, el ancho y el nivel", () => {
  assert.deepEqual([1, 2, 3].map((v) => cantidadPuntos(v, 1280, false)), [36, 60, 90]);
  // En pantallas angostas, el 60 %.
  assert.deepEqual([1, 2, 3].map((v) => cantidadPuntos(v, 390, false)), [22, 36, 54]);
  // El diseño pide menos puntos en liviano (la versión quieta): otro 60 %.
  assert.deepEqual([1, 2, 3].map((v) => cantidadPuntos(v, 1280, true)), [22, 36, 54]);
  assert.equal(cantidadPuntos(3, 390, true), 32);
  // Una variante rara no rompe: se toma como la 1.
  assert.equal(cantidadPuntos(9, 1280, false), 36);
});

// --- Arreglos de la revisión final ---

test("letrero: el scroll lo ladea poco, pase lo que pase (viento con tope)", () => {
  assert.equal(vientoDe(0), 0);
  assert.equal(vientoDe(200), 1.5);
  assert.equal(vientoDe(99999), 3);
  assert.equal(vientoDe(-99999), -3);
  assert.equal(vientoDe(NaN), 0);
  // Con el viento a tope por 3 segundos (bajar muy rápido), el péndulo nunca pasa de unos pocos grados.
  let e = { a: 0, w: 0 };
  let mayor = 0;
  for (let i = 0; i < 180; i++) {
    e = pasoPendulo(e, 1 / 60, vientoDe(5000));
    mayor = Math.max(mayor, Math.abs(e.a));
  }
  assert.ok(mayor < 5, `se ladeó ${mayor.toFixed(2)}°`);
});

test("objetos que caen: cuántos según la variante y el ancho", () => {
  assert.deepEqual([1, 2, 3].map((v) => cantidadObjetos(v, 1280)), [12, 20, 30]);
  assert.deepEqual([1, 2, 3].map((v) => cantidadObjetos(v, 390)), [7, 12, 18]);
  // Una variante fuera de 1 a 3 (al usar el componente directo) se toma como la 1, no como «ninguno».
  for (const rara of [0, 4, 9, NaN, undefined as unknown as number]) assert.equal(cantidadObjetos(rara, 1280), 12);
});

test("descifrar: las letras angostas pasan por signos angostos", () => {
  // Una «i» o una «l» tienen la caja angosta: una «W» o un «#» ahí se enciman con las vecinas.
  const letras = Array.from("illi.,!");
  for (const t of [0, 40, 80, 120]) {
    cuadroDescifrar(letras, t, 3).forEach((ch, i) => assert.ok(ch === letras[i] || SIGNOS_ANGOSTOS.includes(ch), `«${letras[i]}» pasó por «${ch}»`));
  }
  // Las demás siguen con los signos de siempre.
  assert.ok(SIGNOS.includes(cuadroDescifrar(["M"], 0, 3)[0]));
  assert.deepEqual(cuadroDescifrar(letras, 5000, 3), letras);
});
