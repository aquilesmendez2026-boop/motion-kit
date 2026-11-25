// Ramas: el Hilo de fondo con un tronco que siempre llega abajo; unas ramas chocan con los bloques (o con el borde) y
// otras se juntan con el tronco al fondo; cada una con su grosor, su opacidad y su tono. Lo calculable, sin navegador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { CHOQUE_HASTA, GROSOR_MAXIMO, GROSOR_MINIMO, LARGO_CHOQUE, trazarRamas, type Caja, type Rama, type TrazoRama } from "../src/relatos/ramas/trazar-ramas";

type P = { x: number; y: number };
const ANCHOS = [280, 390, 1200];
const ALTOS = [600, 3000, 9000];
const con = (semilla = "vivero-las-rosas", vista = 800, bloques: Caja[] = []) => ({ semilla, vista, bloques });
const largo = (ps: P[]) => ps.slice(1).reduce((s, q, k) => s + Math.hypot(q.x - ps[k].x, q.y - ps[k].y), 0);
const numeros = (v: unknown): number[] => (typeof v === "number" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(numeros) : []);
const dentro = (p: P, c: Caja) => p.x > c.izquierda && p.x < c.izquierda + c.ancho && p.y > c.arriba && p.y < c.arriba + c.alto;
/** A cuánto queda un punto del borde de una caja. */
const aBorde = (p: P, c: Caja) => {
  const [x0, x1, y0, y1] = [c.izquierda, c.izquierda + c.ancho, c.arriba, c.arriba + c.alto];
  if (dentro(p, c)) return Math.min(p.x - x0, x1 - p.x, p.y - y0, y1 - p.y);
  return Math.hypot(Math.max(x0 - p.x, 0, p.x - x1), Math.max(y0 - p.y, 0, p.y - y1));
};
function enElTronco(t: TrazoRama, p: P) {
  const total = largo(t.puntos);
  let [mejor, en, hecho] = [Infinity, 0, 0];
  for (let k = 1; k < t.puntos.length; k++) {
    const [a, b] = [t.puntos[k - 1], t.puntos[k]];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    const f = l ? Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (l * l))) : 0;
    const d = Math.hypot(a.x + (b.x - a.x) * f - p.x, a.y + (b.y - a.y) * f - p.y);
    if (d < mejor) [mejor, en] = [d, t.desde + ((t.hasta - t.desde) * (hecho + l * f)) / total];
    hecho += l;
  }
  return { lejos: mejor, en };
}
/** Una página de franjas con espacio entre ellas (de 60 px) y una foto de lado a lado. */
const franjas = (ancho: number): Caja[] => [
  { izquierda: 0, arriba: 0, ancho, alto: 520 },
  { izquierda: 16, arriba: 580, ancho: ancho - 32, alto: 700 },
  { izquierda: 0, arriba: 1340, ancho, alto: 400 },
  { izquierda: 16, arriba: 1800, ancho: ancho - 32, alto: 1140 },
];

test("ramas: el tronco va de arriba al fondo sin salirse", () => {
  for (const ancho of ANCHOS) {
    for (const alto of ALTOS) {
      const { tronco } = trazarRamas(ancho, alto, con());
      assert.ok(tronco, `${ancho}×${alto}: no hay tronco`);
      const [a, z] = [tronco.puntos[0], tronco.puntos[tronco.puntos.length - 1]];
      assert.equal(a.y, 0);
      assert.equal(z.y, alto);
      assert.ok(tronco.puntos.every((p) => p.x >= 12 && p.x <= ancho - 12), `${ancho}×${alto}: el tronco se sale`);
      assert.ok(tronco.puntos.slice(1).every((p, k) => p.y >= tronco.puntos[k].y), "el tronco sube");
      assert.equal(tronco.desde, 0);
      assert.equal(tronco.hasta, 100);
      assert.ok(tronco.d.startsWith("M") && !/NaN|undefined/.test(tronco.d));
    }
  }
});

test("ramas: de 4 a 9 según el alto, de las dos clases", () => {
  assert.equal(trazarRamas(390, 600, con()).ramas.length, 4);
  assert.equal(trazarRamas(390, 20000, con()).ramas.length, 9);
  for (const alto of [100, 600, 3000, 9000, 20000]) {
    for (const semilla of ["a", "vivero-las-rosas", "x9", "otro"]) {
      const { ramas } = trazarRamas(390, alto, con(semilla));
      assert.ok(ramas.length >= 4 && ramas.length <= 9, `${alto}: ${ramas.length} ramas`);
      assert.ok(ramas.some((r) => r.clase === "choca") && ramas.some((r) => r.clase === "junta"), `${alto}/${semilla}: falta una clase`);
    }
  }
});

test("ramas: las que chocan nacen en el tronco y terminan en el borde de la página si no hay bloques", () => {
  for (const ancho of ANCHOS) {
    for (const alto of ALTOS) {
      for (const semilla of ["a", "vivero-las-rosas", "x9"]) {
        const { tronco, ramas } = trazarRamas(ancho, alto, con(semilla));
        for (const r of ramas.filter((x) => x.clase === "choca")) {
          const [a, z] = [r.puntos[0], r.puntos[r.puntos.length - 1]];
          assert.ok(enElTronco(tronco!, a).lejos < 0.5, `${ancho}×${alto}/${semilla}: una rama no nace en el tronco`);
          assert.ok(z.x === 0 || z.x === ancho, `${ancho}×${alto}/${semilla}: una rama que choca no llega al borde (x = ${z.x})`);
          assert.deepEqual(r.choque, z);
          assert.ok(z.y > a.y && r.puntos.every((p) => p.x >= 0 && p.x <= ancho && p.y >= 0 && p.y <= alto));
        }
      }
    }
  }
});

test("ramas: con bloques, las que chocan nacen donde se ven y terminan justo al tocar uno", () => {
  for (const ancho of [390, 1200]) {
    for (const semilla of ["a", "vivero-las-rosas", "x9", "otro"]) {
      const bloques = franjas(ancho);
      const { ramas } = trazarRamas(ancho, 3000, con(semilla, 800, bloques));
      const chocan = ramas.filter((r) => r.clase === "choca");
      assert.ok(chocan.length >= 2);
      for (const r of chocan) {
        const [a, z] = [r.puntos[0], r.puntos[r.puntos.length - 1]];
        // Nace en un espacio libre (hay uno a menos de media pantalla de cualquier punto de esta página).
        assert.ok(!bloques.some((c) => dentro(a, c)), `${ancho}/${semilla}: una rama nace tapada, en y = ${a.y.toFixed(0)}`);
        // Todo su camino va por lo libre y termina en el borde de un bloque (o de la página).
        assert.ok(r.puntos.slice(0, -1).every((p) => !bloques.some((c) => dentro(p, c))), `${ancho}/${semilla}: una rama pasa por debajo de un bloque`);
        const enBloque = bloques.some((c) => aBorde(z, c) < 0.6);
        assert.ok(enBloque || z.x === 0 || z.x === ancho, `${ancho}/${semilla}: una rama termina en el aire (${z.x.toFixed(1)}, ${z.y.toFixed(1)})`);
        assert.deepEqual(r.choque, z);
      }
      assert.ok(chocan.some((r) => bloques.some((c) => aBorde(r.choque!, c) < 0.6)), `${ancho}/${semilla}: ninguna choca con un bloque`);
    }
  }
});

test("ramas: las que se juntan nacen en el tronco, se abren y vuelven a él al fondo, cuando el tronco termina", () => {
  for (const ancho of ANCHOS) {
    for (const alto of ALTOS) {
      const { tronco, ramas } = trazarRamas(ancho, alto, con());
      const fin = tronco!.puntos[tronco!.puntos.length - 1];
      for (const r of ramas.filter((x) => x.clase === "junta")) {
        const [a, z] = [r.puntos[0], r.puntos[r.puntos.length - 1]];
        assert.ok(enElTronco(tronco!, a).lejos < 0.5, "una rama que se junta no nace en el tronco");
        assert.deepEqual(z, fin, "una rama que se junta no vuelve al tronco al fondo");
        assert.equal(r.hasta, 100);
        assert.equal(r.choque, undefined);
        // Se abre: en algún punto va lejos del tronco.
        assert.ok(Math.max(...r.puntos.map((p) => enElTronco(tronco!, p).lejos)) > ancho * 0.08, "una rama que se junta no se abre");
        assert.ok(r.puntos.every((p) => p.x >= 0 && p.x <= ancho && p.y >= 0 && p.y <= alto));
        assert.ok(r.puntos.slice(1).every((p, k) => p.y >= r.puntos[k].y), "una rama que se junta sube");
      }
    }
  }
});

test("ramas: cada una con su grosor, su opacidad y su tono; las delgadas, más tenues", () => {
  const todas: Rama[] = ["a", "vivero-las-rosas", "x9", "otro"].flatMap((s) => trazarRamas(390, 9000, con(s)).ramas);
  for (const r of todas) {
    assert.ok(r.grosor >= GROSOR_MINIMO && r.grosor <= GROSOR_MAXIMO);
    assert.ok(r.opacidad >= 0.3 && r.opacidad <= 0.85);
    assert.ok(r.tono >= -1 && r.tono <= 1);
  }
  const grosores = todas.map((r) => r.grosor);
  assert.ok(Math.max(...grosores) - Math.min(...grosores) >= 1.2, "los grosores no varían");
  assert.ok(todas.some((r) => r.tono > 0.2) && todas.some((r) => r.tono < -0.2), "los tonos no varían");
  // Más delgada, más tenue (la profundidad).
  const orden = [...todas].sort((a, b) => a.grosor - b.grosor);
  assert.ok(orden.slice(1).every((r, k) => r.opacidad >= orden[k].opacidad), "una rama más delgada se ve más marcada");
});

test("ramas: cada rama se dibuja cuando el tronco pasa por donde nace, y en orden", () => {
  for (const alto of ALTOS) {
    for (const bloques of [[], franjas(390)]) {
      const { tronco, ramas } = trazarRamas(390, alto, con("vivero-las-rosas", 800, bloques));
      for (const [i, r] of ramas.entries()) {
        const nace = enElTronco(tronco!, r.puntos[0]);
        assert.ok(Math.abs(r.desde - nace.en) <= 0.5, `${alto}: la rama ${i} parte en ${r.desde.toFixed(2)} y el tronco pasa en ${nace.en.toFixed(2)}`);
        assert.ok(r.hasta > r.desde && r.hasta <= 100);
        if (r.clase === "choca") {
          // Al paso del tronco, pero termina a más tardar en el 97 %: así su chispa (3 % del scroll) se ve entera.
          const paso = (100 * largo(r.puntos)) / largo(tronco!.puntos);
          assert.ok(Math.abs(r.hasta - Math.min(CHOQUE_HASTA, r.desde + paso)) < 0.01, `${alto}: la rama ${i} no va al paso del tronco`);
          assert.ok(r.hasta <= CHOQUE_HASTA, `${alto}: la chispa de la rama ${i} no alcanza a verse entera (${r.hasta})`);
        }
        if (i) assert.ok(r.desde >= ramas[i - 1].desde, "las ramas no van en orden");
      }
    }
  }
});

/** Una página densa como las de verdad: cada renglón de texto y cada tarjeta es una caja (agrandada 12 px, como lo hace el dibujo). */
function densa(ancho: number): Caja[] {
  const cajas: Caja[] = [];
  for (let y = 40; y < 2900; y += 260) {
    for (let k = 0; k < 5; k++) cajas.push({ izquierda: 24, arriba: y + k * 26, ancho: 120 + ((k * 37 + y) % (ancho - 200)), alto: 18 });
    cajas.push({ izquierda: 24, arriba: y + 150, ancho: (ancho - 64) / 2, alto: 80 }, { izquierda: ancho / 2 + 8, arriba: y + 150, ancho: (ancho - 64) / 2, alto: 80 });
  }
  return cajas.map((c) => ({ izquierda: c.izquierda - 12, arriba: c.arriba - 12, ancho: c.ancho + 24, alto: c.alto + 24 }));
}

test("ramas: una que choca nunca nace tapada ni choca recién nacida; si no hay lugar, se junta", () => {
  for (const [nombre, ancho, bloques] of [["densa 390", 390, densa(390)], ["densa 1200", 1200, densa(1200)], ["franjas", 390, franjas(390)], ["tapada", 390, [{ izquierda: 0, arriba: 0, ancho: 390, alto: 3000 }]]] as const) {
    for (const semilla of ["a", "vivero-las-rosas", "x9", "otro", "b2"]) {
      const { ramas } = trazarRamas(ancho, 3000, con(semilla, 800, [...bloques]));
      assert.ok(ramas.length >= 4, `${nombre}/${semilla}: ${ramas.length} ramas`);
      for (const r of ramas.filter((x) => x.clase === "choca")) {
        assert.ok(!bloques.some((c) => dentro(r.puntos[0], c)), `${nombre}/${semilla}: una rama que choca nace tapada`);
        assert.ok(!bloques.some((c) => dentro(r.choque!, c)), `${nombre}/${semilla}: una chispa queda sobre el contenido`);
        assert.ok(r.puntos.slice(0, -1).every((p) => !bloques.some((c) => dentro(p, c))), `${nombre}/${semilla}: una rama que choca pasa sobre el contenido`);
        assert.ok(largo(r.puntos) >= LARGO_CHOQUE, `${nombre}/${semilla}: una rama choca recién nacida (${largo(r.puntos).toFixed(1)} px)`);
        assert.ok(r.choque!.y <= 3000 - 12, `${nombre}/${semilla}: una chispa queda bajo el borde de abajo`);
      }
    }
  }
  // En la página tapada entera no hay dónde chocar: todas se juntan.
  assert.ok(trazarRamas(390, 3000, con("a", 800, [{ izquierda: 0, arriba: 0, ancho: 390, alto: 3000 }])).ramas.every((r) => r.clase === "junta"));
});

test("ramas: con el scroll de la página, cada punto se dibuja cuando pasa por el 60 % de la pantalla (como los hilos)", () => {
  // Una página que parte 120 px más abajo en su scroll, con 800 de pantalla.
  const scroll = { arriba: 120, recorrido: 120 + 3000 - 800 };
  const { tronco, tramos, ramas } = trazarRamas(390, 3000, { ...con(), scroll });
  assert.ok(tronco && tramos.length >= 10, `${tramos.length} tramos`);
  // Los tramos son el tronco entero, en orden, de 0 a 100, sin huecos ni vueltas atrás.
  assert.deepEqual(tramos[0].puntos[0], tronco.puntos[0]);
  assert.deepEqual(tramos[tramos.length - 1].puntos.at(-1), tronco.puntos.at(-1));
  for (let i = 0; i < tramos.length; i++) {
    const t = tramos[i];
    // Uno que ya está a la vista al cargar va de 0 a 0 (dibujado desde el principio); los demás tienen su parte.
    assert.ok(t.desde >= 0 && t.hasta <= 100 && (t.hasta > t.desde || (t.desde === 0 && t.hasta === 0)), `tramo ${i}: ${t.desde}–${t.hasta}`);
    if (i) {
      assert.deepEqual(t.puntos[0], tramos[i - 1].puntos.at(-1), `el tramo ${i} no sigue al anterior`);
      assert.ok(t.desde >= tramos[i - 1].hasta - 1e-9, `el tramo ${i} parte antes de que termine el anterior`);
    }
  }
  assert.equal(tramos.at(-1)!.hasta, 100);
  // Lo que se ve al cargar (sobre el 60 % de la pantalla) ya va dibujado: el encabezado no espera al scroll.
  const visto = 0.6 * 800 - 120;
  const yaVistos = tramos.filter((t) => t.puntos.at(-1)!.y <= visto);
  assert.ok(yaVistos.length >= 1);
  for (const t of yaVistos) assert.ok(t.desde === 0 && t.hasta === 0, `un tramo a la vista al cargar se dibuja en ${t.desde}–${t.hasta}`);
  // Un punto más abajo se dibuja cuando pasa por el 60 % de la pantalla: a mitad de página, cerca de la mitad del scroll.
  const medio = tramos.find((t) => t.puntos[0].y <= 1500 && t.puntos.at(-1)!.y >= 1500)!;
  const esperado = (100 * (120 + 1500 - 0.6 * 800)) / scroll.recorrido;
  assert.ok(Math.abs((medio.desde + medio.hasta) / 2 - esperado) < 4, `a mitad de página se dibuja en ${((medio.desde + medio.hasta) / 2).toFixed(1)} (se esperaba ${esperado.toFixed(1)})`);
  // Cada rama parte cuando el tronco pasa por donde nace (dentro del tramo que la contiene).
  for (const r of ramas) {
    const t = tramos.find((x) => x.puntos.some((q) => q.x === r.puntos[0].x && q.y === r.puntos[0].y))!;
    assert.ok(t && r.desde >= t.desde - 1e-9 && r.desde <= t.hasta + 1e-9, "una rama parte fuera del tramo donde nace");
    if (r.clase === "choca") assert.ok(r.hasta <= CHOQUE_HASTA && r.hasta > r.desde);
  }
  // Sin el scroll (sin medir), el tronco va en un solo tramo, como antes.
  assert.equal(trazarRamas(390, 3000, con()).tramos.length, 1);
});

test("ramas: la misma semilla da lo mismo; otra, otra cosa; y las medidas raras no la botan", () => {
  const a = JSON.stringify(trazarRamas(390, 3000, con()));
  assert.equal(JSON.stringify(trazarRamas(390, 3000, con())), a);
  assert.notEqual(JSON.stringify(trazarRamas(390, 3000, con("otro-vivero"))), a);
  assert.ok(numeros(trazarRamas(390, 3000, con("a", 800, franjas(390)))).every(Number.isFinite));
  // Con un scroll raro (sin recorrido, o con números que no son), igual que sin scroll.
  for (const scroll of [{ arriba: 0, recorrido: 0 }, { arriba: NaN, recorrido: 900 }, { arriba: 10, recorrido: -4 }]) {
    const r = trazarRamas(390, 3000, { ...con(), scroll });
    assert.ok(r.tramos.length === 1 && numeros(r).every(Number.isFinite), JSON.stringify(scroll));
  }
  for (const [ancho, alto, vista] of [[0, 3000, 800], [390, 0, 800], [390, 3000, 0], [NaN, 3000, 800], [390, NaN, 800], [390, 3000, NaN], [-5, 3000, 800], [390, -1, 800], [Infinity, 3000, 800]]) {
    assert.deepEqual(trazarRamas(ancho, alto, con("a", vista)), { tronco: null, tramos: [], ramas: [] }, `${ancho}×${alto} vista ${vista}`);
  }
  // Cajas raras, o una semilla que no es texto: se ignoran.
  const raras = trazarRamas(390, 3000, { vista: 800, semilla: 7 as never, bloques: [null, { izquierda: NaN, arriba: 0, ancho: 10, alto: 10 }, 5] as never });
  assert.ok(raras.tronco && raras.ramas.length >= 4 && numeros(raras).every(Number.isFinite));
  // Una página tapada entera por un bloque: igual hay ramas y no lanza.
  const tapada = trazarRamas(390, 3000, con("a", 800, [{ izquierda: 0, arriba: 0, ancho: 390, alto: 3000 }]));
  assert.ok(tapada.ramas.length >= 4 && numeros(tapada).every(Number.isFinite));
});
