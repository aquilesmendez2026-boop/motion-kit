// Hilos (rulos, hebras y figura): lo calculable. El trazado sale de medidas de la página, sin navegador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FIGURA_IDS, figuraDeRubro } from "../src/relatos/catalogo";
import { CAMINOS, puntosDeFigura } from "../src/relatos/hilos/figuras";
import {
  HOLGURA, REMATE, contraste, scrollDe, trazarHilos,
  type BloqueMedido, type Caja, type Medidas, type OpcionesHilo, type Punto, type Tramo,
} from "../src/relatos/hilos/trazar";

const caja = (izquierda: number, arriba: number, ancho: number, alto: number): Caja => ({ izquierda, arriba, ancho, alto });
const bloque = (c: Caja, cosas: Caja[], tarjetas: Caja[] = [], mas: Partial<BloqueMedido> = {}): BloqueMedido => ({ caja: c, cosas, tarjetas, fondo: "rgb(255, 255, 255)", texto: "rgb(20, 20, 20)", tira: false, ...mas });

/** Una página como las de La Mente en un teléfono: franjas de lado a lado, pegadas, con su relleno. */
function pagina(cambios: (b: BloqueMedido[]) => void = () => {}, remate = false): Medidas {
  const bloques = [
    // 0. El encabezado.
    bloque(caja(0, 0, 390, 600), [caja(24, 200, 342, 200)]),
    // 1. Un texto, con 20 px de relleno a los lados y 40 arriba y abajo.
    bloque(caja(0, 600, 390, 400), [caja(20, 640, 350, 320)]),
    // 2. Una grilla de 2 columnas y 4 tarjetas, con su título.
    bloque(caja(0, 1000, 390, 700), [caja(20, 1040, 200, 40)], [caja(20, 1110, 165, 250), caja(205, 1110, 165, 250), caja(20, 1380, 165, 250), caja(205, 1380, 165, 250)]),
    // 3. Una foto de lado a lado, sin relleno.
    bloque(caja(0, 1700, 390, 400), [caja(0, 1700, 390, 400)]),
    // 4. Una lista de 1 columna y 3 tarjetas.
    bloque(caja(0, 2100, 390, 900), [caja(24, 2140, 200, 40)], [caja(24, 2210, 342, 200), caja(24, 2430, 342, 200), caja(24, 2650, 342, 200)]),
  ];
  cambios(bloques);
  const alto = 3000 + (remate ? REMATE : 0);
  return { ancho: 390, alto, vista: 800, arriba: 120, recorrido: 120 + alto - 800, bloques };
}
const con = (tipo: OpcionesHilo["tipo"], mas: Partial<OpcionesHilo> = {}): OpcionesHilo => ({ tipo, semilla: "cafe-luna", acento: "#e4572e", ...mas });
const dentro = (p: Punto, c: Caja, holgura = HOLGURA) => p.x > c.izquierda + holgura && p.x < c.izquierda + c.ancho - holgura && p.y > c.arriba + holgura && p.y < c.arriba + c.alto - holgura;
const lejos = (a: Punto, b: Punto) => Math.hypot(a.x - b.x, a.y - b.y);
const primero = (t: Tramo) => t.puntos[0];
const ultimo = (t: Tramo) => t.puntos[t.puntos.length - 1];
const enBloque = (t: Tramo, b: BloqueMedido) => t.puntos.every((p) => p.y >= b.caja.arriba - 80 && p.y <= b.caja.arriba + b.caja.alto + 80);
/** Cuántas veces el camino cambia de sentido de lado a lado (un rulo lo hace dos veces). */
function vueltas(puntos: Punto[]): number {
  let n = 0;
  let antes = 0;
  for (let i = 1; i < puntos.length; i++) {
    const dx = puntos[i].x - puntos[i - 1].x;
    if (Math.abs(dx) < 0.3) continue;
    if (antes && Math.sign(dx) !== antes) n++;
    antes = Math.sign(dx);
  }
  return n;
}

test("figuras: once, de un solo trazo y dentro de su caja", () => {
  assert.equal(FIGURA_IDS.length, 11);
  for (const id of FIGURA_IDS) {
    assert.equal((CAMINOS[id].match(/[Mm]/g) ?? []).length, 1, `${id}: tiene que ser un solo trazo`);
    const puntos = puntosDeFigura(id);
    assert.ok(puntos.length >= 12, `${id}: ${puntos.length} puntos`);
    for (const p of puntos) assert.ok(p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100, `${id}: (${p.x}, ${p.y}) se sale de la caja`);
    // Ocupa su caja: no es un garabato en una esquina.
    const [xs, ys] = [puntos.map((p) => p.x), puntos.map((p) => p.y)];
    const [ancho, alto] = [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
    assert.ok(Math.max(ancho, alto) >= 60 && Math.min(ancho, alto) >= 40, `${id}: muy chica (${ancho.toFixed(0)} × ${alto.toFixed(0)})`);
  }
});

test("figuraDeRubro: cada rubro tiene su figura y lo desconocido es la estrella", () => {
  const rubros = ["cafeteria", "hamburgueseria", "restaurante", "barberia", "peluqueria", "veterinaria", "gimnasio", "academia", "tienda", "consulta"];
  const figuras = rubros.map(figuraDeRubro);
  assert.equal(new Set(figuras).size, 10);
  assert.ok(figuras.every((f) => FIGURA_IDS.includes(f) && f !== "estrella"));
  assert.equal(figuraDeRubro("cafeteria"), "taza");
  for (const raro of ["ferreteria", "", null, undefined, 7, {}]) assert.equal(figuraDeRubro(raro), "estrella");
});

test("scrollDe: va de 0 a 100, crece con la altura y cuenta lo que hay sobre la página", () => {
  const m = pagina();
  assert.equal(scrollDe(0, m), 0);
  assert.equal(scrollDe(m.alto, m), 100);
  // El punto pasa por el 60 % de la vista cuando se ha bajado (arriba + y − 0,6 × vista).
  assert.ok(Math.abs(scrollDe(1000, m) - ((120 + 1000 - 480) / m.recorrido) * 100) < 1e-9);
  assert.ok(scrollDe(1500, m) > scrollDe(1000, m));
  assert.ok(scrollDe(1000, { ...m, arriba: 400 }) > scrollDe(1000, m));
  for (const raro of [{ ...m, recorrido: 0 }, { ...m, recorrido: NaN }, { ...m, vista: NaN }]) assert.equal(scrollDe(500, raro), 100);
});

test("contraste: entiende los colores que entrega el navegador", () => {
  assert.ok(Math.abs(contraste("#000", "#ffffff") - 21) < 0.01);
  assert.ok(contraste("rgb(228, 87, 46)", "#e4572e") < 1.01);
  assert.ok(contraste("color(srgb 0.894 0.341 0.18)", "#e4572e") < 1.1);
  assert.ok(contraste("rgba(228, 87, 46, 0.9)", "#e4572e") < 1.1);
  // Lo que no se entiende, o no tapa (transparente), cuenta como que se distingue.
  for (const raro of ["transparent", "rgba(0, 0, 0, 0)", "linear-gradient(red, blue)", "", "color(rec2020 0.5 0.5 0.5)"]) assert.equal(contraste(raro, "#e4572e"), 21);
});

test("rulos: una cadena de tramos, uno por bloque con lugar, en orden y de 0 a 100", () => {
  const m = pagina();
  const { tramos, nudos } = trazarHilos(m, con("rulos"));
  assert.ok(tramos.every((t) => t.clase === "tronco"));
  // El encabezado no lleva hilo y la foto de lado a lado tampoco: quedan el texto, la grilla y la lista.
  assert.equal(tramos.length, 3);
  for (const t of tramos) {
    assert.ok(t.d.startsWith("M") && t.puntos.length > 4);
    assert.ok(t.desde >= 0 && t.hasta <= 100 && t.desde < t.hasta, `${t.desde} → ${t.hasta}`);
  }
  for (let i = 1; i < tramos.length; i++) {
    assert.ok(tramos[i].desde >= tramos[i - 1].desde, "los tramos van en orden");
    // Cada tramo parte donde terminó el anterior, salvo que entre medio el hilo pase por debajo (una puntada).
    const salto = lejos(ultimo(tramos[i - 1]), primero(tramos[i]));
    const porDebajo = nudos.some((n) => n.clase === "puntada" && lejos(n, ultimo(tramos[i - 1])) < 2) && nudos.some((n) => n.clase === "puntada" && lejos(n, primero(tramos[i])) < 2);
    assert.ok(salto <= 1 || porDebajo, `tramo ${i}: salto de ${salto.toFixed(1)} px sin puntada`);
  }
  assert.equal(tramos[tramos.length - 1].hasta, 100);
  // Serpentea: el tramo del texto termina a un lado y el de la grilla, al otro.
  assert.notEqual(ultimo(tramos[0]).x < 195, ultimo(tramos[1]).x < 195);
});

test("el hilo nunca pisa el contenido ni una tarjeta", () => {
  for (const tipo of ["rulos", "hebras", "figura"] as const) {
    for (const semilla of ["a", "cafe-luna", "barberia-don-pepe", "x9"]) {
      const m = pagina(undefined, tipo === "figura");
      const { tramos, nudos } = trazarHilos(m, con(tipo, { semilla }));
      const cajas = m.bloques.flatMap((b) => [...b.cosas, ...b.tarjetas]);
      for (const t of tramos) for (const p of t.puntos) for (const c of cajas) assert.ok(!dentro(p, c), `${tipo}/${semilla}: (${p.x.toFixed(1)}, ${p.y.toFixed(1)}) cae sobre el contenido`);
      for (const n of nudos) for (const c of cajas) assert.ok(!dentro(n, c), `${tipo}/${semilla}: un nudo cae sobre el contenido`);
      for (const t of tramos) for (const p of t.puntos) assert.ok(p.x >= 0 && p.x <= m.ancho && p.y >= 0 && p.y <= m.alto, `${tipo}: un punto se sale de la página`);
    }
  }
});

test("rulos: hay rulo donde caben 24 px libres, y no donde no", () => {
  // El cruce hacia el texto tiene 40 px de relleno: lleva rulo.
  const conRulo = trazarHilos(pagina(), con("rulos")).tramos[0];
  assert.ok(vueltas(conRulo.puntos.filter((p) => p.y < 645)) >= 2, "el cruce no hace un rulo");
  // Con el texto pegado arriba (16 px libres entre lo último del encabezado y lo primero del texto), cruza sin rulo.
  const apretada = pagina((b) => {
    b[0] = bloque(caja(0, 0, 390, 600), [caja(24, 200, 342, 392)]);
    b[1] = bloque(caja(0, 600, 390, 400), [caja(20, 608, 350, 352)]);
  });
  const sinRulo = trazarHilos(apretada, con("rulos")).tramos[0];
  assert.equal(vueltas(sinRulo.puntos.filter((p) => p.y < 612)), 0);
});

test("puntadas: frente a la foto de lado a lado no hay línea; el hilo entra y sale", () => {
  const m = pagina();
  const { tramos, nudos } = trazarHilos(m, con("rulos"));
  for (const t of tramos) for (const p of t.puntos) assert.ok(p.y <= 1700 + HOLGURA || p.y >= 2100 - HOLGURA, `hay línea sobre la foto, en y = ${p.y}`);
  const puntadas = nudos.filter((n) => n.clase === "puntada");
  assert.equal(puntadas.length, 2);
  assert.ok(puntadas[0].y <= 1700 && puntadas[1].y >= 2100);
  assert.ok(puntadas.every((n) => n.en >= 0 && n.en <= 100));
});

test("hebras: una por canal, parten de un punto y se juntan en otro; un nudo por tarjeta", () => {
  const m = pagina();
  const { tramos, nudos } = trazarHilos(m, con("hebras"));
  const hebras = (b: BloqueMedido) => tramos.filter((t) => t.clase === "hebra" && enBloque(t, b));
  // Dos columnas: orilla, entre columnas y orilla. Una columna: dos hebras que la abrazan.
  const [grilla, lista] = [hebras(m.bloques[2]), hebras(m.bloques[4])];
  assert.equal(grilla.length, 3);
  assert.equal(lista.length, 2);
  for (const grupo of [grilla, lista]) {
    for (const h of grupo) {
      assert.ok(lejos(primero(h), primero(grupo[0])) <= 1, "las hebras no parten del mismo punto");
      assert.ok(lejos(ultimo(h), ultimo(grupo[0])) <= 1, "las hebras no se juntan en el mismo punto");
      assert.equal(h.desde, grupo[0].desde);
      assert.equal(h.hasta, grupo[0].hasta);
    }
    // Cada hebra baja por su propio canal.
    const medios = grupo.map((h) => Math.round(h.puntos[Math.floor(h.puntos.length / 2)].x));
    assert.equal(new Set(medios).size, grupo.length);
    // El tronco llega al punto donde se abren y sigue desde donde se juntan.
    const troncos = tramos.filter((t) => t.clase === "tronco");
    assert.ok(troncos.some((t) => lejos(ultimo(t), primero(grupo[0])) <= 1), "el tronco no llega a donde se abre");
    assert.ok(troncos.some((t) => lejos(primero(t), ultimo(grupo[0])) <= 1), "el tronco no sigue desde donde se juntan");
  }
  const deNudo = nudos.filter((n) => n.clase === "nudo");
  assert.equal(deNudo.filter((n) => n.y > 1000 && n.y < 1700).length, 4);
  assert.equal(deNudo.filter((n) => n.y > 2100 && n.y < 3000).length, 3);
  // Con «rulos» no hay hebras ni nudos.
  const solo = trazarHilos(m, con("rulos"));
  assert.ok(solo.tramos.every((t) => t.clase === "tronco") && solo.nudos.every((n) => n.clase === "puntada"));
});

test("hebras: a lo más 5; una tira que se desliza o menos de 2 tarjetas no abren el hilo", () => {
  // Seis columnas angostas: siete canales, quedan 5.
  const muchas = pagina((b) => {
    b[2] = bloque(caja(0, 1000, 390, 700), [caja(20, 1040, 200, 40)], Array.from({ length: 6 }, (_, i) => caja(15 + i * 61, 1110, 49, 400)));
  });
  assert.equal(trazarHilos(muchas, con("hebras")).tramos.filter((t) => t.clase === "hebra" && enBloque(t, muchas.bloques[2])).length, 5);
  const tira = pagina((b) => void (b[2].tira = true));
  assert.equal(trazarHilos(tira, con("hebras")).tramos.filter((t) => t.clase === "hebra" && enBloque(t, tira.bloques[2])).length, 0);
  const una = pagina((b) => void (b[2].tarjetas = b[2].tarjetas.slice(0, 1)));
  assert.equal(trazarHilos(una, con("hebras")).tramos.filter((t) => t.clase === "hebra" && enBloque(t, una.bloques[2])).length, 0);
  // Sin lugar sobre las tarjetas para abrirse (el título pegado a ellas), tampoco.
  const pegado = pagina((b) => void (b[2].cosas = [caja(20, 1040, 350, 68)]));
  assert.equal(trazarHilos(pegado, con("hebras")).tramos.filter((t) => t.clase === "hebra" && enBloque(t, pegado.bloques[2])).length, 0);
});

test("color: sobre un fondo parecido al acento, el tramo toma el color del texto de ese bloque", () => {
  const m = pagina((b) => {
    b[1].fondo = "rgb(228, 87, 46)";
    b[1].texto = "rgb(255, 255, 255)";
  });
  const { tramos } = trazarHilos(m, con("rulos"));
  assert.equal(tramos[0].color, "rgb(255, 255, 255)");
  assert.equal(tramos[1].color, undefined);
  // Y el cruce va dentro del relleno de ese bloque: no queda un pedazo del color equivocado sobre el bloque de arriba.
  assert.ok(tramos[0].puntos.every((p) => p.y >= 600));
});

test("figura: el hilo termina dibujando la figura en el remate", () => {
  const m = pagina(undefined, true);
  const { tramos } = trazarHilos(m, con("figura", { figura: "taza" }));
  const figura = tramos[tramos.length - 1];
  assert.equal(figura.clase, "figura");
  assert.equal(tramos.filter((t) => t.clase === "figura").length, 1);
  // El final va con tiempo, no con el scroll: primero la llegada (un tramo del hilo) y después la figura.
  const llegada = tramos[tramos.length - 2];
  assert.ok(figura.tiempo && llegada.tiempo && llegada.clase === "tronco", "la llegada y la figura tienen que ir con tiempo");
  assert.equal(llegada.tiempo.espera, 0);
  assert.equal(figura.tiempo.espera, llegada.tiempo.dura);
  assert.ok(figura.tiempo.dura >= 800 && figura.tiempo.dura <= 1700 && llegada.tiempo.dura >= 150 && llegada.tiempo.dura <= 800, `${llegada.tiempo.dura} y ${figura.tiempo.dura} ms`);
  // Lo demás sigue al scroll, y termina antes de que parta el final.
  assert.ok(tramos.slice(0, -2).every((t) => !t.tiempo && t.hasta <= 100));
  assert.ok(figura.puntos.every((p) => p.y >= m.alto - REMATE - 1 && p.y <= m.alto), "la figura se sale del remate");
  // Es el mismo hilo: sigue de corrido desde donde venía.
  assert.ok(tramos.some((t) => t !== figura && lejos(ultimo(t), primero(figura)) <= 1), "la figura no sigue de corrido");
  // Se nota: ocupa buena parte del remate.
  const ys = figura.puntos.map((p) => p.y);
  assert.ok(Math.max(...ys) - Math.min(...ys) >= 70);
  // Otra figura, otro dibujo; sin decir cuál, la estrella.
  assert.notEqual(trazarHilos(m, con("figura", { figura: "tijera" })).tramos.at(-1)!.d, figura.d);
  assert.equal(trazarHilos(m, con("figura")).tramos.at(-1)!.d, trazarHilos(m, con("figura", { figura: "estrella" })).tramos.at(-1)!.d);
  // Sin «figura» no hay remate ni dibujo.
  assert.ok(trazarHilos(pagina(), con("hebras")).tramos.every((t) => t.clase !== "figura"));
});

test("semilla: la misma da el mismo trazado; otra, otro", () => {
  const m = pagina(undefined, true);
  const a = JSON.stringify(trazarHilos(m, con("figura", { semilla: "cafe-luna" })));
  assert.equal(JSON.stringify(trazarHilos(m, con("figura", { semilla: "cafe-luna" }))), a);
  assert.notEqual(JSON.stringify(trazarHilos(m, con("figura", { semilla: "otro-cafe" }))), a);
});

test("medidas raras no lo botan ni dejan líneas sobre el contenido", () => {
  const base = pagina();
  const raras: Medidas[] = [
    { ...base, bloques: [] },
    { ...base, bloques: [base.bloques[0]] },
    { ...base, vista: 5000 },
    { ...base, recorrido: 0 },
    { ...base, ancho: NaN, alto: NaN },
    { ancho: 320, alto: 900, vista: 600, arriba: 0, recorrido: 300, bloques: [bloque(caja(0, 0, 320, 450), [caja(0, 0, 320, 450)]), bloque(caja(0, 450, 320, 450), [caja(0, 450, 320, 450)])] },
    { ...base, bloques: base.bloques.map((b) => ({ ...b, cosas: [], tarjetas: [] })) },
    { ...base, bloques: [null, 7, { caja: null }] as never },
  ];
  for (const m of raras) {
    for (const tipo of ["rulos", "hebras", "figura"] as const) {
      const r = trazarHilos(m, con(tipo));
      assert.ok(Array.isArray(r.tramos) && Array.isArray(r.nudos));
      for (const t of r.tramos) {
        assert.ok(!/NaN|Infinity|undefined/.test(t.d), `${tipo}: el camino trae un número malo`);
        assert.ok(t.desde >= 0 && t.hasta <= 100 && t.desde <= t.hasta);
      }
    }
  }
  // Dos fotos de lado a lado pegadas: no hay por dónde pasar, así que no hay línea.
  assert.equal(trazarHilos(raras[5], con("rulos")).tramos.length, 0);
});

test("hebras: se abren y se juntan aunque el bloque que sigue no deje relleno (el espacio se reparte con el cruce)", () => {
  const grilla = () => bloque(caja(0, 1000, 390, 674), [caja(20, 1040, 200, 40)], [caja(20, 1110, 165, 250), caja(205, 1110, 165, 250), caja(20, 1380, 165, 250), caja(205, 1380, 165, 250)]);
  const sinPisar = (m: Medidas, r: ReturnType<typeof trazarHilos>) => {
    const cajas = m.bloques.flatMap((b) => [...b.cosas, ...b.tarjetas]);
    for (const t of r.tramos) for (const p of t.puntos) for (const c of cajas) assert.ok(!dentro(p, c), `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}) cae sobre el contenido`);
  };
  // 1. Sigue una foto de lado a lado pegada: quedan 44 px bajo las tarjetas. El hilo se abre, se junta y pasa por debajo.
  const conFoto = pagina((b) => {
    b[2] = grilla();
    b[3] = bloque(caja(0, 1674, 390, 426), [caja(0, 1674, 390, 426)]);
  });
  const a = trazarHilos(conFoto, con("hebras"));
  const hebrasA = a.tramos.filter((t) => t.clase === "hebra" && enBloque(t, conFoto.bloques[2]));
  assert.equal(hebrasA.length, 3);
  assert.ok(hebrasA.every((h) => ultimo(h).y > 1630 && ultimo(h).y < 1674), "no se juntan en el espacio bajo las tarjetas");
  assert.ok(a.nudos.some((n) => n.clase === "puntada" && n.y > 1630 && n.y <= 1674), "falta la puntada antes de la foto");
  sinPisar(conFoto, a);
  // 2. Sigue un texto casi sin relleno arriba (6 px): en los 50 px que quedan caben la junta y el cruce al otro lado.
  const conTexto = pagina((b) => {
    b[2] = grilla();
    b[3] = bloque(caja(0, 1674, 390, 426), [caja(20, 1680, 350, 380)]);
  });
  const c = trazarHilos(conTexto, con("hebras"));
  const hebrasC = c.tramos.filter((t) => t.clase === "hebra" && enBloque(t, conTexto.bloques[2]));
  assert.equal(hebrasC.length, 3);
  const junta = ultimo(hebrasC[0]);
  // El tronco sigue desde la junta y después cruza, más abajo, hacia el texto.
  const sigue = c.tramos.filter((t) => t.clase === "tronco" && primero(t).y >= junta.y - 1 && t.puntos.some((p) => p.y > 1700));
  assert.ok(sigue.length >= 1, "el hilo no sigue hacia el bloque de abajo");
  // El primero de esos es el tramo del bloque del texto (los demás son de más abajo).
  const cruce = sigue[0].puntos.filter((p) => p.y < 1682);
  assert.ok(Math.max(...cruce.map((p) => p.x)) - Math.min(...cruce.map((p) => p.x)) > 300, "el hilo no cruza al otro lado antes del texto");
  assert.ok(cruce.every((p) => p.y > junta.y), "el cruce se monta sobre la junta de las hebras");
  sinPisar(conTexto, c);
});

// --- Lo que encontró la revisión final ---

test("revisión: un bloque vacío antes de una foto de lado a lado no deja línea ni puntada sobre la foto", () => {
  const foto = caja(0, 724, 390, 300);
  const m: Medidas = {
    ancho: 390, alto: 1300, vista: 760, recorrido: 600, arriba: 0,
    bloques: [
      bloque(caja(0, 0, 390, 400), [caja(24, 100, 342, 200)]),
      bloque(caja(0, 400, 390, 300), [caja(24, 440, 342, 220)]),
      // Un bloque vacío (un separador) y, pegada, la foto.
      bloque(caja(0, 700, 390, 24), []),
      bloque(foto, [foto]),
      bloque(caja(0, 1024, 390, 276), [caja(24, 1064, 342, 200)]),
    ],
  };
  for (const semilla of ["a", "b", "c", "d", "e", "f"]) {
    const r = trazarHilos(m, con("rulos", { semilla }));
    for (const t of r.tramos) for (const q of t.puntos) assert.ok(!dentro(q, foto), `${semilla}: (${q.x.toFixed(0)}, ${q.y.toFixed(1)}) cae sobre la foto`);
    for (const n of r.nudos) assert.ok(!dentro(n, foto), `${semilla}: una puntada cae sobre la foto (y = ${n.y.toFixed(1)})`);
  }
  // Y si el bloque vacío es el último, el hilo no sale por debajo de la página.
  const alFinal: Medidas = { ...m, alto: 724, bloques: m.bloques.slice(0, 3) };
  for (const semilla of ["a", "b", "c", "d"]) for (const t of trazarHilos(alFinal, con("rulos", { semilla })).tramos) for (const q of t.puntos) assert.ok(q.y <= alFinal.alto, `${semilla}: el hilo baja hasta ${q.y.toFixed(1)} y la página mide ${alFinal.alto}`);
});

test("revisión: si no puede cruzar y sigue por su lado, se corre de orilla en lo libre, no sobre el último renglón", () => {
  // El bloque de arriba llega casi hasta su borde (6 px) y el de abajo parte casi en el suyo (6 px): quedan 12 px
  // libres. El de abajo solo deja orilla a la izquierda, y más adentro que el de arriba.
  for (const espejo of [false, true]) {
    const x = (izq: number, ancho: number) => (espejo ? 390 - izq - ancho : izq);
    const m: Medidas = {
      ancho: 390, alto: 1500, vista: 760, recorrido: 900, arriba: 0,
      bloques: [
        bloque(caja(0, 0, 390, 300), [caja(24, 60, 342, 180)]),
        bloque(caja(0, 300, 390, 300), [caja(24, 340, 342, 220)]),
        bloque(caja(0, 600, 390, 300), [caja(x(10, 370), 640, 370, 254)]),
        bloque(caja(0, 900, 390, 300), [caja(x(40, 345), 906, 345, 280)]),
        bloque(caja(0, 1200, 390, 300), [caja(24, 1240, 342, 220)]),
      ],
    };
    const cajas = m.bloques.flatMap((b) => b.cosas);
    for (const semilla of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      const r = trazarHilos(m, con("rulos", { semilla }));
      for (const t of r.tramos) for (const q of t.puntos) for (const c of cajas) assert.ok(!dentro(q, c), `${espejo ? "espejo/" : ""}${semilla}: (${q.x.toFixed(1)}, ${q.y.toFixed(1)}) cae sobre el contenido`);
    }
  }
});

test("revisión: con bloques que se montan, el cruce no pasa sobre lo último del bloque de arriba", () => {
  // El segundo bloque parte 40 px antes de que termine el primero y trae 40 px de relleno arriba.
  const m: Medidas = {
    ancho: 390, alto: 1200, vista: 760, recorrido: 500, arriba: 0,
    bloques: [
      bloque(caja(0, 0, 390, 300), [caja(24, 60, 342, 180)]),
      bloque(caja(0, 300, 390, 400), [caja(20, 340, 350, 340)]),
      bloque(caja(0, 660, 390, 540), [caja(20, 700, 350, 460)]),
    ],
  };
  const arriba = m.bloques[1].cosas[0];
  for (const semilla of ["a", "b", "c", "d", "e", "f"]) {
    for (const t of trazarHilos(m, con("rulos", { semilla })).tramos) for (const q of t.puntos) assert.ok(!dentro(q, arriba), `${semilla}: (${q.x.toFixed(1)}, ${q.y.toFixed(1)}) cae sobre el bloque de arriba`);
  }
});

test("revisión: los tramos del tronco se dibujan uno después del otro, sin adelantarse", () => {
  for (const tipo of ["rulos", "hebras"] as const) {
    for (const semilla of ["a", "cafe-luna", "barberia-don-pepe", "x9", "b", "c", "d", "e"]) {
      const m = pagina();
      const { tramos, nudos } = trazarHilos(m, con(tipo, { semilla }));
      const tronco = tramos.filter((t) => t.clase === "tronco");
      for (let i = 1; i < tronco.length; i++) {
        // Donde el anterior ya llegó al final del scroll no queda dónde ponerlo después.
        if (tronco[i - 1].hasta > 98) continue;
        assert.ok(tronco[i].desde >= tronco[i - 1].hasta - 1e-6, `${tipo}/${semilla}: el tramo ${i} parte en ${tronco[i].desde.toFixed(2)} y el anterior termina en ${tronco[i - 1].hasta.toFixed(2)}`);
      }
      assert.ok(nudos.every((n) => n.en >= 0 && n.en <= 100));
    }
  }
});

test("revisión: el remate se mide; con relleno bajo él, la figura sigue dentro del remate", () => {
  // La página trae 60 px de relleno abajo: el remate no son sus últimos 140 px.
  const base = pagina(undefined, true);
  const m: Medidas = { ...base, alto: base.alto + 60, recorrido: base.recorrido + 60, remate: { arriba: 3000, alto: 140 } };
  const { tramos } = trazarHilos(m, con("figura", { figura: "taza" }));
  const figura = tramos[tramos.length - 1];
  assert.equal(figura.clase, "figura");
  assert.ok(figura.puntos.every((q) => q.y >= 3000 - 1 && q.y <= 3140 + 1), `la figura va de ${Math.min(...figura.puntos.map((q) => q.y)).toFixed(0)} a ${Math.max(...figura.puntos.map((q) => q.y)).toFixed(0)} y el remate de 3000 a 3140`);
  // Sin esa medida (no debería pasar), se supone que el remate es lo último de la página.
  const sin = trazarHilos(base, con("figura", { figura: "taza" })).tramos.at(-1)!;
  assert.ok(sin.puntos.every((q) => q.y >= base.alto - REMATE - 1 && q.y <= base.alto));
});

test("revisión: lo que se dibuja con el scroll se dibuja a la vista, nunca bajo el borde de la pantalla", () => {
  // Cuánto falta para que un punto quede a la vista, mirado en el momento en que se dibuja (en partes de la pantalla:
  // 0 arriba, 1 en el borde de abajo).
  const donde = (y: number, m: Medidas) => (m.arriba + y - (scrollDe(y, m) / 100) * m.recorrido) / m.vista;
  for (const abajo of [0, 130, 250, 900]) {
    for (const conRemate of [false, true]) {
      const base = pagina(undefined, conRemate);
      const m: Medidas = { ...base, recorrido: base.recorrido + abajo };
      for (let y = 700; y <= m.alto; y += 20) assert.ok(donde(y, m) <= 1.0001, `con ${abajo} px bajo la página, el punto y = ${y} se dibuja en ${donde(y, m).toFixed(2)} de la pantalla`);
      // En el medio de la página va cerca del 60 %.
      assert.ok(Math.abs(donde(1200, m) - 0.6) < 0.01);
      // Y los tramos que siguen al scroll (todos menos el final, que va con tiempo) también.
      const r = trazarHilos(m, con(conRemate ? "figura" : "hebras", { figura: "taza" }));
      for (const t of r.tramos.filter((x) => !x.tiempo)) {
        const y = t.puntos[t.puntos.length - 1].y;
        assert.ok((m.arriba + y - (t.hasta / 100) * m.recorrido) / m.vista <= 1.0001, `con ${abajo} px debajo: un tramo termina de dibujarse con su punta bajo la pantalla`);
      }
    }
  }
});

test("revisión: el contraste entiende los colores modernos que entrega el navegador", () => {
  // El naranjo #e4572e escrito de otras formas: contra sí mismo no se distingue.
  for (const mismo of ["oklch(0.6542 0.1708 37.4)", "oklab(0.6542 0.1357 0.1037)", "lab(57.2 50.9 52.7)", "lch(57.2 73.3 46)", "color(display-p3 0.83 0.38 0.23)"]) {
    assert.ok(contraste(mismo, "#e4572e") < 1.25, `${mismo}: ${contraste(mismo, "#e4572e").toFixed(2)}`);
  }
  // Blanco y negro en esos espacios.
  assert.ok(contraste("oklch(1 0 0)", "oklch(0 0 0)") > 20);
  assert.ok(contraste("lab(100 0 0)", "#000") > 20);
  assert.ok(contraste("oklab(0.5 0 0 / 0.2)", "#000") === 21, "un fondo casi transparente no cuenta");
});

// --- El hilo de cada estilo ---

test("material: una paralela va al lado del camino, a la distancia pedida, y ondula si se pide", async () => {
  const { paralela, MATERIALES, materialDe } = await import("../src/relatos/hilos/material");
  // Una recta que baja: la paralela a +3 va 3 px a un lado; a −3, al otro.
  const baja = Array.from({ length: 30 }, (_, i) => ({ x: 100, y: i * 8 }));
  const [a, b] = [paralela(baja, 3), paralela(baja, -3)];
  assert.equal(a.length, baja.length);
  assert.ok(a.every((p) => Math.abs(Math.abs(p.x - 100) - 3) < 1e-9) && b.every((p) => Math.abs(Math.abs(p.x - 100) - 3) < 1e-9));
  assert.ok(a.every((p, i) => Math.sign(p.x - 100) === -Math.sign(b[i].x - 100)));
  // Con onda, se aleja y se acerca (como una hebra que se trenza), sin pasar nunca de la distancia más la onda.
  const lana = paralela(baja, 1.4, 1.4, 22);
  const lejos = lana.map((p) => Math.abs(p.x - 100));
  assert.ok(Math.max(...lejos) > 2.5 && Math.min(...lejos) < 0.4 && Math.max(...lejos) <= 2.8 + 1e-9);
  // En una curva (un arco), la paralela sigue al costado (a la misma distancia del centro, más o menos).
  const arcoDe = Array.from({ length: 40 }, (_, i) => ({ x: 100 + 40 * Math.cos((i / 39) * Math.PI), y: 100 + 40 * Math.sin((i / 39) * Math.PI) }));
  for (const p of paralela(arcoDe, 3)) assert.ok(Math.abs(Math.hypot(p.x - 100, p.y - 100) - 40) > 2.5 && Math.abs(Math.hypot(p.x - 100, p.y - 100) - 40) < 3.5);
  // Con menos de dos puntos, o puntos repetidos, no falla.
  assert.deepEqual(paralela([], 3), []);
  assert.ok(paralela([{ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 9 }], 3).every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
  // Cada estilo del kit tiene su material, y ninguno se aleja del centro más de 3,25 px (así no pisa el contenido).
  for (const estilo of ["neon", "retro", "rock", "anime", "pelicula"]) assert.ok(MATERIALES[materialDe(estilo)], estilo);
  assert.equal(materialDe(null), "linea");
  assert.equal(materialDe("otro"), "linea");
  for (const [nombre, capas] of Object.entries(MATERIALES)) {
    for (const c of capas) assert.ok(Math.abs(c.lado ?? 0) + (c.onda ?? 0) + c.grosor / 2 <= 3.25 + 1e-9, `${nombre}: una capa llega a ${(Math.abs(c.lado ?? 0) + (c.onda ?? 0) + c.grosor / 2).toFixed(2)} px del centro`);
  }
});
