// Con el dedo (cupón que se arranca, sticker que se despega, sellos con timbre y ruleta de premios): lo calculable.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DIENTES, SE_SUELTA, cortado, dientesCortados, limpiarCupon, tramosColgando, vencio,
  bordeMasCercano, doblez, reflejar,
  limitesTimbre, tintaDe,
  IMPULSO_MINIMO, MAX_PREMIOS, ROCE, anguloEn, clavosPasados, limpiarPremios, planDeGiro, planLibre, premioEn, velocidadDeGesto,
} from "../src/momentos/calculos-4";

// --- El cupón que se arranca ---

test("cupón: lo cortado sigue al dedo, de nada a todo, y no pasa de ahí", () => {
  assert.equal(cortado(0, 300), 0);
  assert.equal(cortado(150, 300), 0.5);
  assert.equal(cortado(300, 300), 1);
  assert.equal(cortado(999, 300), 1);
  assert.equal(cortado(-40, 300), 0);
  // Sin ancho, o con algo que no es un número, no hay nada cortado.
  for (const [x, ancho] of [[100, 0], [100, -5], [NaN, 300], [100, NaN], [Infinity, 300]]) assert.equal(cortado(x, ancho), x === Infinity ? 1 : 0, `${x}, ${ancho}`);
  assert.ok(SE_SUELTA > 0.5 && SE_SUELTA < 1);
});

test("cupón: los dientes se cortan uno por uno y nunca se vuelven a pegar", () => {
  assert.equal(dientesCortados(0), 0);
  assert.equal(dientesCortados(1), DIENTES);
  let antes = 0;
  for (let a = 0; a <= 1.0001; a += 0.01) {
    const n = dientesCortados(a);
    assert.ok(n >= antes && n - antes <= 1, `en ${a.toFixed(2)}: ${antes} → ${n}`);
    antes = n;
  }
  assert.equal(dientesCortados(7), DIENTES);
  assert.equal(dientesCortados(-1), 0);
  assert.equal(dientesCortados(NaN), 0);
});

test("cupón: lo cortado cuelga curvado: cuatro tramos, cada uno más girado que el anterior", () => {
  assert.deepEqual(tramosColgando(0), [0, 0, 0, 0].map(() => ({ giro: 0, baja: 0 })));
  for (const a of [0.1, 0.4, 0.85, 1]) {
    const t = tramosColgando(a);
    assert.equal(t.length, 4);
    for (let k = 0; k < 4; k++) {
      assert.ok(t[k].giro > 0 && t[k].giro <= 80, `giro del tramo ${k} con ${a}: ${t[k].giro}`);
      assert.ok(t[k].baja >= 0);
      if (k) assert.ok(t[k].giro > t[k - 1].giro, `el tramo ${k} gira más que el ${k - 1} con ${a}`);
    }
  }
  // Mientras más se corta, más cuelga.
  assert.ok(tramosColgando(0.8)[3].giro > tramosColgando(0.2)[3].giro);
  assert.deepEqual(tramosColgando(NaN), tramosColgando(0));
  assert.deepEqual(tramosColgando(9), tramosColgando(1));
});

test("cupón: vale todo el día de su vencimiento; una fecha que no se entiende no vence", () => {
  assert.equal(vencio("2026-11-24", new Date(2026, 10, 24, 0, 0)), false);
  assert.equal(vencio("2026-11-24", new Date(2026, 10, 24, 23, 59)), false);
  assert.equal(vencio("2026-11-24", new Date(2026, 10, 25, 0, 1)), true);
  assert.equal(vencio("2026-11-24", new Date(2027, 0, 1)), true);
  assert.equal(vencio("2026-12-31", new Date(2026, 10, 24)), false);
  for (const mala of ["ayer", "2026-13-45", "2026-02-30", "24-11-2026", "", 7, null, undefined, {}]) assert.equal(vencio(mala, new Date(2030, 0, 1)), false, String(mala));
  assert.equal(vencio("2026-11-24", new Date(NaN)), false);
});

test("cupón: los datos se limpian; sin código no hay cupón", () => {
  assert.deepEqual(limpiarCupon({ titulo: "  2×1 en cafés ", detalle: "De lunes a jueves", codigo: " LUNA2X1 ", vence: "2026-12-31" }), { titulo: "2×1 en cafés", detalle: "De lunes a jueves", codigo: "LUNA2X1", vence: "2026-12-31" });
  const largo = limpiarCupon({ titulo: "t".repeat(500), detalle: "d".repeat(900), codigo: "c".repeat(200) })!;
  assert.ok(largo.titulo.length <= 80 && largo.detalle!.length <= 160 && largo.codigo.length <= 40);
  // Sin detalle ni vencimiento no los inventa; un vencimiento que no es fecha se ignora.
  assert.deepEqual(limpiarCupon({ titulo: "Promo", codigo: "X1", vence: "pronto" }), { titulo: "Promo", codigo: "X1" });
  assert.deepEqual(limpiarCupon({ codigo: "X1" }), { titulo: "", codigo: "X1" });
  for (const nada of [null, undefined, 7, "cupón", [], { titulo: "Sin código" }, { codigo: "   " }, { codigo: 123 }]) assert.equal(limpiarCupon(nada), null, JSON.stringify(nada));
});

// --- El sticker que se despega ---

test("sticker: sin tirar no hay nada levantado; tirar más levanta más, hasta todo", () => {
  const caja = { ancho: 200, alto: 200 };
  const toma = { x: 0, y: 100 };
  assert.equal(doblez(toma, toma, caja), null);
  assert.equal(doblez(toma, { x: 1, y: 100 }, caja), null, "un tirón de un píxel no cuenta");
  for (const forma of ["cuadrado", "circulo"] as const) {
    let antes = 0;
    for (let x = 10; x <= 420; x += 10) {
      const d = doblez(toma, { x, y: 100 }, caja, forma)!;
      assert.ok(d.despegado >= antes - 1e-9 && d.despegado >= 0 && d.despegado <= 1, `${forma} en ${x}: ${d.despegado}`);
      antes = d.despegado;
    }
    // Con el dedo en el borde de enfrente va la mitad; al doble, todo.
    assert.ok(Math.abs(doblez(toma, { x: 200, y: 100 }, caja, forma)!.despegado - 0.5) < 0.001, forma);
    assert.equal(doblez(toma, { x: 400, y: 100 }, caja, forma)!.despegado, 1);
  }
  // El círculo se levanta más lento al principio que el cuadrado (tiene menos orilla).
  assert.ok(doblez(toma, { x: 60, y: 100 }, caja, "circulo")!.despegado < doblez(toma, { x: 60, y: 100 }, caja, "cuadrado")!.despegado);
});

test("sticker: el doblez es perpendicular al tirón y pasa por la mitad del camino; lo doblado es el espejo", () => {
  const caja = { ancho: 240, alto: 160 };
  const toma = { x: 240, y: 0 };
  const dedo = { x: 140, y: 100 };
  const d = doblez(toma, dedo, caja)!;
  assert.deepEqual([d.x, d.y], [190, 50]);
  // El ángulo es hacia dónde se tira (abajo a la izquierda: 135°).
  assert.equal(d.angulo, 135);
  // La punta que se tomó, reflejada en el doblez, queda justo bajo el dedo; y un punto del doblez no se mueve.
  const r = reflejar(toma, d);
  assert.ok(Math.abs(r.x - dedo.x) < 0.01 && Math.abs(r.y - dedo.y) < 0.01, JSON.stringify(r));
  const quieto = reflejar({ x: 190 + 30, y: 50 + 30 }, d);
  assert.ok(Math.abs(quieto.x - 220) < 0.01 && Math.abs(quieto.y - 80) < 0.01);
  // Datos raros: sin caja o con algo que no es un número, no hay doblez.
  for (const [a, b, c] of [[toma, dedo, { ancho: 0, alto: 100 }], [toma, { x: NaN, y: 3 }, caja], [null, dedo, caja]]) assert.equal(doblez(a as never, b as never, c as never), null);
});

test("sticker: se toma del borde más cercano", () => {
  const caja = { ancho: 200, alto: 100 };
  assert.deepEqual(bordeMasCercano({ x: 12, y: 50 }, caja), { x: 0, y: 50 });
  assert.deepEqual(bordeMasCercano({ x: 190, y: 40 }, caja), { x: 200, y: 40 });
  assert.deepEqual(bordeMasCercano({ x: 100, y: 90 }, caja), { x: 100, y: 100 });
  // Al centro: el borde de arriba o el de abajo (están a la misma distancia; gana el de arriba).
  assert.deepEqual(bordeMasCercano({ x: 100, y: 50 }, caja), { x: 100, y: 0 });
  // Fuera de la caja se acota adentro.
  assert.deepEqual(bordeMasCercano({ x: -30, y: 500 }, caja), { x: 0, y: 100 });
});

// --- Los sellos con timbre ---

test("timbre: cada sello tiene su tinta, siempre la misma para el mismo negocio y el mismo sello", () => {
  const a = tintaDe("cafe-luna", 3);
  assert.deepEqual(tintaDe("cafe-luna", 3), a);
  // Distinta entre sellos del mismo negocio, y entre negocios.
  const todas = Array.from({ length: 10 }, (_, i) => JSON.stringify(tintaDe("cafe-luna", i)));
  assert.equal(new Set(todas).size, 10);
  assert.notDeepEqual(tintaDe("otro-negocio", 3), a);
  // Todo dentro de lo que un timbre de goma hace de verdad.
  for (const negocio of ["cafe-luna", "", "ñandú", "x".repeat(300)])
    for (let i = 0; i < 30; i++) {
      const t = tintaDe(negocio, i);
      assert.ok(Math.abs(t.giro) <= 14 && Math.abs(t.x) <= 3 && Math.abs(t.y) <= 3, JSON.stringify(t));
      assert.ok(t.carga >= 0.7 && t.carga <= 1 && [0, 1, 2].includes(t.borde), JSON.stringify(t));
      // Más cargada de un lado: de dónde viene el exceso de tinta, en grados.
      assert.ok(t.lado >= 0 && t.lado < 360);
    }
  // Con algo que no es un texto o un número, no lanza.
  assert.deepEqual(tintaDe(null as never, NaN), tintaDe("", 0));
});

test("timbre: los datos se acotan (ni más llenos que el total, ni más nuevos que llenos)", () => {
  assert.deepEqual(limitesTimbre(10, 7, 1), { total: 10, llenos: 7, nuevos: 1 });
  assert.deepEqual(limitesTimbre(10, 14, 3), { total: 10, llenos: 10, nuevos: 3 });
  assert.deepEqual(limitesTimbre(10, 2, 9), { total: 10, llenos: 2, nuevos: 2 });
  assert.deepEqual(limitesTimbre(10, 4, -2), { total: 10, llenos: 4, nuevos: 0 });
  assert.deepEqual(limitesTimbre(500, 3, undefined as never), { total: 30, llenos: 3, nuevos: 0 });
  assert.deepEqual(limitesTimbre(NaN, NaN, NaN), { total: 1, llenos: 0, nuevos: 0 });
});

// --- La ruleta de premios ---

test("ruleta: los premios se limpian (de 2 a 12; con menos no hay ruleta)", () => {
  assert.deepEqual(limpiarPremios([{ texto: " Café gratis " }, { texto: "10 % menos" }]), [{ texto: "Café gratis", indice: 0 }, { texto: "10 % menos", indice: 1 }]);
  assert.equal(limpiarPremios(Array.from({ length: 30 }, (_, i) => ({ texto: `Premio ${i}` }))).length, MAX_PREMIOS);
  assert.ok(limpiarPremios([{ texto: "x".repeat(300) }, { texto: "y" }])[0].texto.length <= 40);
  // Los vacíos y lo que no es un premio se saltan; un texto suelto también vale.
  assert.deepEqual(limpiarPremios([{ texto: "A" }, null, { texto: "  " }, 7, "B", { otro: 1 }]), [{ texto: "A", indice: 0 }, { texto: "B", indice: 4 }]);
  // Un vacío en el medio no corre los índices: cada premio recuerda su lugar en la lista original.
  assert.deepEqual(limpiarPremios(["Café", "", "Té", "Pan"]).map((p) => p.indice), [0, 2, 3]);
  for (const nada of [null, undefined, "premios", 7, [], [{ texto: "Uno solo" }]]) assert.deepEqual(limpiarPremios(nada), []);
});

test("ruleta: el plan de giro termina en el premio pedido, sin retroceder y frenando siempre", () => {
  let probados = 0;
  for (const n of [2, 3, 5, 8, 12])
    for (const velocidad of [-9000, -1600, -700, 520, 900, 2200, 6000])
      for (const angulo of [0, 33.3, -810, 4000.5])
        for (const semilla of ["cafe-luna", "otro"]) {
          const resultado = (probados * 7) % n;
          const plan = planDeGiro(angulo, velocidad, n, resultado, semilla)!;
          probados++;
          assert.ok(plan, `hay plan con ${velocidad}`);
          const etiqueta = `n=${n} v=${velocidad} a=${angulo} r=${resultado}`;
          // Termina en el premio pedido, y no en la orilla.
          assert.equal(premioEn(plan.final, n), resultado, etiqueta);
          assert.equal(premioEn(plan.final + 0.1 * (360 / n), n), resultado, `${etiqueta}: lejos de la orilla`);
          assert.equal(premioEn(plan.final - 0.1 * (360 / n), n), resultado, `${etiqueta}: lejos de la otra orilla`);
          // Gira hacia donde se lanzó, entre 3 y 7 vueltas, y con un roce parecido al de siempre.
          const vueltas = (plan.final - angulo) / 360;
          assert.equal(Math.sign(vueltas), Math.sign(velocidad), etiqueta);
          assert.ok(Math.abs(vueltas) >= 2.5 && Math.abs(vueltas) <= 7.5, `${etiqueta}: ${vueltas.toFixed(2)} vueltas`);
          assert.ok(Math.abs(plan.roce / ROCE - 1) < 0.2, `${etiqueta}: roce ${plan.roce.toFixed(3)}`);
          // Cuadro a cuadro: solo avanza y solo frena; al final queda justo donde debe.
          let antes = angulo;
          let pasoAntes = Infinity;
          for (let t = 1 / 60; t < plan.dura; t += 1 / 60) {
            const a = anguloEn(plan, t);
            const paso = (a - antes) * Math.sign(velocidad);
            assert.ok(paso >= -1e-9, `${etiqueta}: retrocede en ${t.toFixed(2)}`);
            assert.ok(paso <= pasoAntes + 1e-6, `${etiqueta}: acelera en ${t.toFixed(2)}`);
            antes = a;
            pasoAntes = paso;
          }
          assert.equal(anguloEn(plan, plan.dura), plan.final);
          assert.equal(anguloEn(plan, plan.dura + 5), plan.final);
          assert.ok(plan.dura > 2 && plan.dura < 14, `${etiqueta}: dura ${plan.dura.toFixed(1)} s`);
          // El último cuadro no es un salto: llega casi detenida.
          assert.ok(Math.abs(plan.final - anguloEn(plan, plan.dura - 1 / 60)) < 0.6, `${etiqueta}: salto final`);
        }
  assert.equal(probados, 280);
  // La misma semilla, el mismo punto dentro del premio; otra semilla, otro.
  assert.equal(planDeGiro(0, 1500, 6, 2, "a")!.final, planDeGiro(0, 1500, 6, 2, "a")!.final);
  assert.notEqual(planDeGiro(0, 1500, 6, 2, "a")!.final, planDeGiro(0, 1500, 6, 2, "b")!.final);
});

test("ruleta: un impulso flojo no cuenta; sin resultado, frena donde la lleve su impulso", () => {
  for (const v of [0, 40, -150, IMPULSO_MINIMO - 1, NaN]) assert.equal(planDeGiro(0, v, 6, 1, "x"), null, String(v));
  assert.ok(planDeGiro(0, IMPULSO_MINIMO + 1, 6, 1, "x"));
  // El impulso mínimo es un lanzamiento de verdad: la rueda no sale disparada a varias veces la velocidad del dedo.
  assert.ok(planLibre(0, IMPULSO_MINIMO + 1)!.velocidad / IMPULSO_MINIMO < 3, `sale a ${(planLibre(0, IMPULSO_MINIMO + 1)!.velocidad / IMPULSO_MINIMO).toFixed(1)} veces`);
  // Un resultado que no existe no es un plan.
  for (const r of [-1, 6, 2.5, NaN]) assert.equal(planDeGiro(0, 1500, 6, r, "x"), null, String(r));
  // Sin resultado (falló la consulta): con el roce de siempre, sin elegir premio.
  const libre = planLibre(100, -1500)!;
  assert.equal(libre.roce, ROCE);
  assert.ok(libre.final < 100 && Math.abs((libre.final - 100) / 360) >= 2.5);
  assert.equal(planLibre(0, 30), null);
});

test("ruleta: la velocidad del gesto sale de los últimos instantes, y los clavos se cuentan en los dos sentidos", () => {
  // 90 grados en 100 ms: 900 grados por segundo.
  assert.ok(Math.abs(velocidadDeGesto([{ t: 0, a: 0 }, { t: 50, a: 45 }, { t: 100, a: 90 }]) - 900) < 1);
  assert.ok(Math.abs(velocidadDeGesto([{ t: 0, a: 0 }, { t: 100, a: -90 }]) + 900) < 1);
  // Lo viejo no cuenta: un tirón de hace medio segundo y después quieta es cero.
  assert.equal(velocidadDeGesto([{ t: 0, a: 0 }, { t: 60, a: 200 }, { t: 600, a: 200 }, { t: 700, a: 200 }]), 0);
  for (const nada of [[], [{ t: 0, a: 0 }], null]) assert.equal(velocidadDeGesto(nada as never), 0);
  // Seis premios: un clavo cada 60 grados.
  assert.equal(clavosPasados(10, 50, 6), 0);
  assert.equal(clavosPasados(10, 70, 6), 1);
  assert.equal(clavosPasados(70, 10, 6), 1);
  assert.equal(clavosPasados(-10, 250, 6), 5);
  assert.equal(clavosPasados(0, 0, 6), 0);
  assert.equal(premioEn(0, 6), 0);
  assert.equal(premioEn(-30, 6), 0);
  assert.equal(premioEn(-90, 6), 1);
  assert.equal(premioEn(30, 6), 5);
  assert.equal(premioEn(-90 - 720, 6), 1);
});
