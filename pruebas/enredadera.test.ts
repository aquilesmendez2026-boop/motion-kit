// Enredadera: un tallo por el recorrido del hilo, con hojas que brotan al bajar y una flor al final. Lo calculable,
// sin navegador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANCHO_HOJA, FORMA_HOJA, FORMA_PETALO, LARGO_HOJA, PASO_HOJA, REBOTE, TOPE_MECE, trazarEnredadera, type Hoja } from "../src/relatos/hilos/enredadera";
import { HOLGURA, trazarHilos, type BloqueMedido, type Caja, type Medidas, type Punto } from "../src/relatos/hilos/trazar";

const caja = (izquierda: number, arriba: number, ancho: number, alto: number): Caja => ({ izquierda, arriba, ancho, alto });
const bloque = (c: Caja, cosas: Caja[], tarjetas: Caja[] = [], mas: Partial<BloqueMedido> = {}): BloqueMedido => ({ caja: c, cosas, tarjetas, fondo: "rgb(255, 255, 255)", texto: "rgb(20, 20, 20)", tira: false, ...mas });
/** La página de las pruebas del hilo, con el remate de 140 px al final. `relleno`: el de los lados (por defecto, 20). */
function pagina(relleno = 20, cambios: (b: BloqueMedido[]) => void = () => {}): Medidas {
  const dentro = 390 - relleno * 2;
  const bloques = [
    bloque(caja(0, 0, 390, 600), [caja(24, 200, 342, 200)]),
    bloque(caja(0, 600, 390, 400), [caja(relleno, 640, dentro, 320)]),
    bloque(caja(0, 1000, 390, 700), [caja(relleno, 1040, 200, 40)], [caja(relleno, 1110, dentro, 520)]),
    bloque(caja(0, 1700, 390, 400), [caja(0, 1700, 390, 400)]),
    bloque(caja(0, 2100, 390, 900), [caja(relleno, 2140, dentro, 800)]),
  ];
  cambios(bloques);
  return { ancho: 390, alto: 3140, vista: 800, arriba: 120, recorrido: 120 + 3140 - 800, bloques, remate: { arriba: 3000, alto: 140 } };
}
const con = (mas: Partial<Parameters<typeof trazarEnredadera>[1]> = {}) => ({ semilla: "vivero-las-rosas", acento: "#2e7d32", ...mas });
const lejos = (p: Punto, c: Caja) => Math.hypot(Math.max(c.izquierda - p.x, 0, p.x - (c.izquierda + c.ancho)), Math.max(c.arriba - p.y, 0, p.y - (c.arriba + c.alto)));
const cajasDe = (m: Medidas) => m.bloques.flatMap((b) => [...b.cosas, ...b.tarjetas]);
/** El eje de una hoja: de su base (en el tallo) a su punta. 0° apunta hacia arriba. */
const ejeDe = (h: Hoja, t: number, mecida = 0): Punto => {
  const g = ((h.giro + mecida) * Math.PI) / 180;
  return { x: h.x + Math.sin(g) * LARGO_HOJA * h.tamano * t, y: h.y - Math.cos(g) * LARGO_HOJA * h.tamano * t };
};
/** Todos los números de un valor (en objetos y listas, a cualquier profundidad). */
const numeros = (v: unknown): number[] => (typeof v === "number" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(numeros) : []);
/** Dónde pasa un tramo más cerca de `p` (proyectado sobre sus segmentos) y en qué parte del scroll se dibuja ahí (0 a 100). */
const brotaDel = (t: { puntos: Punto[]; desde: number; hasta: number }, p: Punto) => {
  const total = t.puntos.slice(1).reduce((s, q, k) => s + Math.hypot(q.x - t.puntos[k].x, q.y - t.puntos[k].y), 0);
  let [mejor, en, hecho] = [Infinity, 0, 0];
  for (let k = 1; k < t.puntos.length; k++) {
    const [a, b] = [t.puntos[k - 1], t.puntos[k]];
    const largo = Math.hypot(b.x - a.x, b.y - a.y);
    const f = largo ? Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (largo * largo))) : 0;
    const d = Math.hypot(a.x + (b.x - a.x) * f - p.x, a.y + (b.y - a.y) * f - p.y);
    if (d < mejor - 1e-9) [mejor, en] = [d, t.desde + ((t.hasta - t.desde) * (hecho + largo * f)) / Math.max(1, total)];
    hecho += largo;
  }
  return { lejos: mejor, en };
};
/** A cuánto queda un punto de una línea quebrada. */
const aLinea = (p: Punto, ps: Punto[]) =>
  Math.min(...ps.slice(1).map((b, i) => {
    const a = ps[i];
    const [dx, dy] = [b.x - a.x, b.y - a.y];
    const k = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p.x - a.x - dx * k, p.y - a.y - dy * k);
  }));

test("enredadera: las formas de la hoja y del pétalo son dibujos chicos, rellenos y sin números malos", () => {
  for (const [nombre, d, tope] of [["hoja", FORMA_HOJA, LARGO_HOJA], ["petalo", FORMA_PETALO, 20]] as const) {
    assert.ok(d.startsWith("M0,0") && d.endsWith("Z") && d.length < 200, nombre);
    assert.ok(!/NaN|undefined/.test(d), nombre);
    const numeros = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    assert.ok(numeros.every((n) => Math.abs(n) <= tope), `${nombre}: se sale de su largo`);
    // Apunta hacia arriba (sus números en y son negativos o cero) y no es más ancha que ANCHO_HOJA (o su escala).
    const pares = d.slice(1).replace(/[MCZ]/g, " ").trim().split(/[\s]+/).map((p) => p.split(",").map(Number));
    assert.ok(pares.every(([, y]) => y <= 0), `${nombre}: no apunta hacia arriba`);
    if (nombre === "hoja") assert.ok(pares.every(([x]) => Math.abs(x) <= ANCHO_HOJA), "la hoja es más ancha que su lugar");
  }
});

test("enredadera: el tallo va sin hebras y sin figura, y termina en una flor en el remate, entrando por abajo", () => {
  const m = pagina();
  const { trazado } = trazarEnredadera(m, con());
  assert.ok(trazado.tramos.length > 3);
  assert.ok(trazado.tramos.every((t) => t.clase === "tronco"), "la enredadera no se abre en hebras ni dibuja una figura");
  assert.equal(trazado.nudos.filter((n) => n.clase === "nudo").length, 0);
  const flor = trazado.flor;
  assert.ok(flor, "no hay flor");
  // La flor entera queda en el remate y en la página.
  assert.ok(flor.y - flor.radio >= 3000 && flor.y + flor.radio <= 3140 && flor.x - flor.radio >= 0 && flor.x + flor.radio <= 390);
  assert.ok(flor.radio >= 14 && flor.radio <= 30);
  assert.ok(flor.petalos === 5 || flor.petalos === 6);
  // La llegada (con tiempo) termina en la flor y solo entra a ella por abajo, derecho hacia su centro.
  const llegada = trazado.tramos.find((t) => t.tiempo);
  assert.ok(llegada, "no hay llegada");
  const fin = llegada.puntos[llegada.puntos.length - 1];
  assert.ok(Math.abs(fin.x - flor.x) < 0.5 && fin.y > flor.y && fin.y < flor.y + flor.radio);
  for (const p of llegada.puntos) {
    if (Math.hypot(p.x - flor.x, p.y - flor.y) < flor.radio + 2) assert.ok(Math.abs(p.x - flor.x) < 0.5 && p.y > flor.y, `el tallo cruza la flor en (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`);
  }
  // Los pétalos se abren cuando el tallo llega.
  assert.equal(flor.espera, llegada.tiempo!.espera + llegada.tiempo!.dura);
  // El mismo recorrido que el hilo con rulos, hasta el remate: todos los tramos iguales, menos el último (que baja al remate).
  const rulos = trazarHilos(m, { tipo: "rulos", semilla: "vivero-las-rosas", acento: "#2e7d32" });
  const alBajar = trazado.tramos.filter((t) => !t.tiempo);
  assert.equal(alBajar.length, rulos.tramos.length);
  alBajar.slice(0, -1).forEach((t, i) => assert.equal(t.d, rulos.tramos[i].d, `el tramo ${i} no es el de los rulos`));
});

test("enredadera: las hojas brotan del tallo, alternando el lado, y aparecen en orden al bajar", () => {
  const m = pagina();
  const { trazado, hojas } = trazarEnredadera(m, con());
  assert.ok(hojas.length > 40, `${hojas.length} hojas`);
  const tallo = trazado.tramos.flatMap((t) => [t.puntos]);
  for (const h of hojas) assert.ok(Math.min(...tallo.map((ps) => aLinea(h, ps))) < 0.6, `una hoja no sale del tallo: (${h.x.toFixed(1)}, ${h.y.toFixed(1)})`);
  // Más o menos una cada PASO_HOJA px, nunca montadas.
  const pasos = hojas.slice(1).map((h, i) => Math.hypot(h.x - hojas[i].x, h.y - hojas[i].y));
  assert.ok(pasos.filter((p) => p < PASO_HOJA * 0.5).length === 0, `hay hojas montadas (${Math.min(...pasos).toFixed(1)} px)`);
  // Un lado y el otro (alguna puede faltar, así que basta con que la mayoría alterne).
  const alternan = hojas.slice(1).filter((h, i) => h.lado !== hojas[i].lado).length;
  assert.ok(alternan > hojas.length * 0.6, `alternan ${alternan} de ${hojas.length}`);
  // Las del scroll aparecen en orden; las del final (en el remate) van con tiempo, después de que el tallo pasa.
  const alBajar = hojas.filter((h) => !h.tiempo);
  const alFinal = hojas.filter((h) => h.tiempo);
  for (let i = 1; i < alBajar.length; i++) assert.ok(alBajar[i].en >= alBajar[i - 1].en, `la hoja ${i} aparece antes que la anterior`);
  assert.ok(alBajar.every((h) => h.en >= 0 && h.en <= 98 && h.y < 3016));
  // Cada hoja brota cuando el tallo ya pasó por su base (no antes), y no mucho después.
  for (const semilla of ["vivero-las-rosas", "a", "x9", "otro"]) {
    const r = trazarEnredadera(m, con({ semilla }));
    const tramos = r.trazado.tramos.filter((t) => !t.tiempo);
    for (const h of r.hojas.filter((x) => !x.tiempo)) {
      // Donde se juntan dos tramos, la base está en los dos: cuenta el que se dibuja primero.
      const cerca = tramos.map((t) => brotaDel(t, h)).filter((x) => x.lejos < 0.6).sort((a, b) => a.en - b.en)[0];
      assert.ok(h.en >= cerca.en - 0.05, `${semilla}: una hoja en (${h.x.toFixed(0)}, ${h.y.toFixed(0)}) brota en ${h.en.toFixed(1)}, antes que su tallo (${cerca.en.toFixed(1)})`);
      assert.ok(h.en <= Math.min(98, cerca.en + 1.5), `${semilla}: una hoja brota mucho después que su tallo (${h.en.toFixed(1)} y ${cerca.en.toFixed(1)})`);
    }
  }
  assert.ok(alFinal.length >= 1 && alFinal.every((h) => h.y >= 3000 && h.tiempo!.espera > 0 && h.tiempo!.espera < trazado.flor!.espera + 1));
  // Se mecen distinto: cada una con su fuerza, entre la mitad y la entera, a uno y otro lado.
  assert.ok(hojas.every((h) => Math.abs(h.mece) >= 0.5 && Math.abs(h.mece) <= 1));
  assert.ok(hojas.some((h) => h.mece > 0) && hojas.some((h) => h.mece < 0));
  // Con el viento se pliegan hacia el tallo (girar con `mece` positivo las cierra): así, al mecerse, nunca se abren
  // hacia el contenido.
  assert.ok(hojas.every((h) => Math.sign(h.mece) === -h.lado), "una hoja se abre con el viento en vez de plegarse");
  // Las hojas apuntan hacia afuera del tallo y hacia donde crece (bajando por la orilla: hacia abajo y a su lado).
  const bajando = hojas.filter((h) => !h.tiempo && h.y > 640 && h.y < 960);
  assert.ok(bajando.length > 4);
  for (const h of bajando) {
    const g = (((h.giro % 360) + 360) % 360);
    assert.ok(g > 90 && g < 270 && Math.abs(g - 180) > 12, `una hoja que baja mira a ${g.toFixed(0)}°`);
  }
});

test("enredadera: ninguna hoja pisa el contenido, la flor ni el borde; donde hay poco lugar se achican o no van", () => {
  for (const relleno of [28, 20, 16, 12]) {
    for (const semilla of ["a", "vivero-las-rosas", "x9"]) {
      const m = pagina(relleno);
      const { trazado, hojas } = trazarEnredadera(m, con({ semilla }));
      const cajas = cajasDe(m);
      const flor = trazado.flor!;
      for (const h of hojas) {
        assert.ok(h.tamano >= 0.5 && h.tamano <= 1);
        const ancho = ANCHO_HOJA * h.tamano;
        for (let k = 1; k <= 20; k++) {
          const p = ejeDe(h, 0.15 + (0.85 * k) / 20);
          for (const c of cajas) assert.ok(lejos(p, c) >= ancho + HOLGURA - 0.01, `relleno ${relleno}/${semilla}: una hoja queda a ${lejos(p, c).toFixed(1)} px del contenido`);
          assert.ok(p.x >= ancho - 1e-9 && p.x <= m.ancho - ancho + 1e-9 && p.y >= ancho - 1e-9 && p.y <= m.alto - ancho + 1e-9, "una hoja se sale de la página");
          assert.ok(Math.hypot(p.x - flor.x, p.y - flor.y) >= flor.radio + ancho - 0.01, "una hoja se mete en la flor");
          // Mecida (plegada al máximo o en su rebote hacia afuera), tampoco toca el contenido.
          for (const mecida of [TOPE_MECE * h.mece, -REBOTE * h.mece]) {
            const q = ejeDe(h, 0.15 + (0.85 * k) / 20, mecida);
            for (const c of cajas) assert.ok(lejos(q, c) >= ancho - 0.01, `relleno ${relleno}/${semilla}: una hoja mecida (${mecida.toFixed(1)}°) toca el contenido: lado ${h.lado}, giro ${h.giro.toFixed(0)}, tamaño ${h.tamano}, en (${h.x.toFixed(1)}, ${h.y.toFixed(1)}), a ${lejos(q, c).toFixed(2)} de ${JSON.stringify(c)}`);
          }
        }
      }
    }
  }
  const media = (hs: Hoja[]) => hs.reduce((s, h) => s + h.tamano, 0) / hs.length;
  assert.ok(media(trazarEnredadera(pagina(28), con()).hojas) > media(trazarEnredadera(pagina(12), con()).hojas));
  // Frente a la foto de lado a lado no hay tallo ni hojas.
  for (const h of trazarEnredadera(pagina(), con()).hojas) assert.ok(h.y < 1700 || h.y > 2100, `hay una hoja sobre la foto, en y = ${h.y}`);
});

test("enredadera: si la página termina en un bloque de lado a lado, el tallo sale de bajo él y llega a la flor", () => {
  const m = pagina(20, (b) => {
    b[4].cosas = [caja(0, 2100, 390, 900)];
  });
  const { trazado } = trazarEnredadera(m, con());
  const llegada = trazado.tramos.find((t) => t.tiempo);
  assert.ok(llegada, "la flor queda suelta, sin tallo");
  const [a, z] = [llegada.puntos[0], llegada.puntos[llegada.puntos.length - 1]];
  assert.ok(a.y >= 3000 && a.y < 3020, `el tallo no sale al empezar el remate (y = ${a.y})`);
  assert.ok(trazado.nudos.some((n) => n.clase === "puntada" && Math.hypot(n.x - a.x, n.y - a.y) < 0.5), "no hay ojal donde sale");
  assert.ok(Math.abs(z.x - trazado.flor!.x) < 0.5 && trazado.flor!.espera === llegada.tiempo!.dura);
});

test("enredadera: con un remate chico la flor se achica, cabe en él y el tallo no la cruza", () => {
  for (const alto of [20, 40, 60, 90, 140, 260]) {
    const m = { ...pagina(), alto: 3000 + alto, remate: { arriba: 3000, alto } };
    const { trazado } = trazarEnredadera(m, con());
    const f = trazado.flor!;
    assert.ok(f.radio > 0 && f.y - f.radio >= 3000 && f.y + f.radio <= 3000 + alto, `remate de ${alto}: la flor no cabe (radio ${f.radio}, centro ${f.y})`);
    const llegada = trazado.tramos.find((t) => t.tiempo);
    for (const p of llegada?.puntos ?? []) {
      if (Math.hypot(p.x - f.x, p.y - f.y) < f.radio + 3) assert.ok(Math.abs(p.x - f.x) < 0.5 && p.y > f.y, `remate de ${alto}: el tallo cruza la flor`);
      assert.ok(p.y <= 3000 + alto, `remate de ${alto}: el tallo se sale de la página`);
    }
  }
});

test("enredadera: sobre un fondo donde el acento se pierde, las hojas toman el color del texto", () => {
  const m = pagina(20, (b) => {
    b[1].fondo = "rgb(46, 125, 50)";
    b[1].texto = "rgb(255, 255, 255)";
  });
  const { hojas } = trazarEnredadera(m, con());
  const enAcento = hojas.filter((h) => h.y > 640 && h.y < 960);
  assert.ok(enAcento.length > 3 && enAcento.every((h) => h.color === "rgb(255, 255, 255)"));
  assert.ok(hojas.filter((h) => h.y > 1100 && h.y < 1600).every((h) => h.color === undefined));
});

test("enredadera: la misma semilla da la misma enredadera; otra, otra; y las medidas raras no la botan", () => {
  const m = pagina();
  const a = JSON.stringify(trazarEnredadera(m, con()));
  assert.equal(JSON.stringify(trazarEnredadera(m, con())), a);
  assert.notEqual(JSON.stringify(trazarEnredadera(m, con({ semilla: "otro-vivero" }))), a);
  assert.ok(numeros(trazarEnredadera(m, con())).every(Number.isFinite));
  for (const rara of [{ ...m, bloques: [] }, { ...m, ancho: NaN }, { ...m, recorrido: 0 }, { ...m, remate: null }, { ...m, bloques: [null, 7] as never }]) {
    const r = trazarEnredadera(rara, con());
    assert.ok(Array.isArray(r.hojas) && r.hojas.every((h) => Number.isFinite(h.x) && Number.isFinite(h.y) && Number.isFinite(h.giro) && Number.isFinite(h.mece)));
    assert.ok(numeros(r).every(Number.isFinite), "hay un número que no es número");
  }
  // Sin bloques no hay tallo ni hojas, pero la flor está (en quieto es lo único que queda).
  const vacia = trazarEnredadera({ ...m, bloques: [] }, con());
  assert.equal(vacia.hojas.length, 0);
  assert.ok(vacia.trazado.flor && vacia.trazado.flor.espera === 0);
});
