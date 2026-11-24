// Efectos vistosos (fuegos artificiales, carrusel giratorio y libro que se abre): lo calculable.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CHISPAS, ENTRE_RAFAGAS, SUBIDA, VIDA, rafagasDe, cohete, chispa, duracionFuegos,
  MAX_FICHAS, limpiarFichas, puestosAnillo, pasoAnillo, radioAnillo, alFrente, dondeSeDetiene, haciaFicha,
  MAX_HOJAS, MAX_LINEAS, limpiarHojas, carasLibro, maxVueltas, estadoLibro, vueltasAlCambiar, apilado,
} from "../src/momentos/calculos-3";

// --- Fuegos artificiales ---

test("fuegos: las ráfagas salen de la semilla, siempre iguales, y caben en el lienzo", () => {
  const a = rafagasDe(7, 3);
  assert.deepEqual(a, rafagasDe(7, 3), "la misma semilla da lo mismo");
  assert.notDeepEqual(a, rafagasDe(8, 3), "otra semilla, otras ráfagas");
  assert.equal(a.length, 3);
  for (const [i, r] of a.entries()) {
    assert.ok(r.x >= 0.18 && r.x <= 0.82, `x ${r.x}`);
    assert.ok(r.y >= 0.18 && r.y <= 0.45, `y ${r.y}`);
    assert.equal(r.parte, i * ENTRE_RAFAGAS);
    assert.equal(r.chispas.length, CHISPAS);
    assert.ok([0, 1, 2].includes(r.color));
    for (const c of r.chispas) assert.ok(c.rapidez >= 0.55 && c.rapidez <= 1 && Number.isFinite(c.angulo));
  }
  // Se reparten a lo ancho: nunca dos casi en el mismo lugar (con cualquier semilla y cantidad).
  for (let s = 0; s < 40; s++) {
    for (let n = 2; n <= 5; n++) {
      const xs = rafagasDe(s, n).map((r) => r.x).sort((p, q) => p - q);
      for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 0.05, `semilla ${s}, ${n} ráfagas: ${xs.join(", ")}`);
      assert.ok(xs[0] >= 0.18 && xs[xs.length - 1] <= 0.82);
    }
  }
  // Dos ráfagas seguidas no repiten color.
  assert.notEqual(a[0].color, a[1].color);
  assert.notEqual(a[1].color, a[2].color);
});

test("fuegos: la cantidad de ráfagas va de 1 a 5, y con un dato raro son 3", () => {
  assert.equal(rafagasDe(1, 0).length, 1);
  assert.equal(rafagasDe(1, 99).length, 5);
  assert.equal(rafagasDe(1, NaN).length, 3);
  assert.equal(rafagasDe(NaN, 2).length, 2);
  assert.equal(duracionFuegos(3), 2 * ENTRE_RAFAGAS + SUBIDA + VIDA);
  assert.equal(duracionFuegos(99), 4 * ENTRE_RAFAGAS + SUBIDA + VIDA);
});

test("fuegos: el cohete sube desde abajo hasta donde revienta, y solo existe mientras sube", () => {
  const [r] = rafagasDe(3, 1);
  assert.equal(cohete(r, -1), null);
  assert.deepEqual(cohete(r, 0), { x: r.x, y: 1 });
  const medio = cohete(r, SUBIDA / 2)!;
  assert.ok(medio.y < 1 && medio.y > r.y);
  // Frena al llegar: en la primera mitad del tiempo recorre más de la mitad del camino.
  assert.ok(1 - medio.y > (1 - r.y) / 2);
  assert.equal(cohete(r, SUBIDA), null);
});

test("fuegos: una chispa parte del centro, se abre, cae con peso y se apaga", () => {
  const derecha = { angulo: 0, rapidez: 1 };
  assert.equal(chispa(derecha, -1), null);
  assert.deepEqual(chispa(derecha, 0), { dx: 0, dy: 0, brillo: 1 });
  const a = chispa(derecha, 300)!;
  const b = chispa(derecha, 1000)!;
  assert.ok(a.dx > 0 && b.dx > a.dx, "se aleja");
  assert.ok(b.dx - a.dx < a.dx * 2, "y va frenando");
  assert.ok(b.dy > a.dy && a.dy > 0, "cae");
  assert.ok(b.brillo < a.brillo && b.brillo > 0);
  assert.ok(b.dx <= 0.36, "no se va lejos");
  assert.equal(chispa(derecha, VIDA), null);
  // Una chispa lenta llega menos lejos.
  assert.ok(chispa({ angulo: 0, rapidez: 0.55 }, 1000)!.dx < b.dx);
});

// --- Carrusel giratorio ---

test("carrusel: las fichas se limpian (máximo 12, sin vacías, enlaces seguros, textos cortados)", () => {
  const muchas = Array.from({ length: 40 }, (_, i) => ({ titulo: `Plato ${i}` }));
  assert.equal(limpiarFichas(muchas).length, MAX_FICHAS);
  assert.equal(MAX_FICHAS, 12);
  assert.deepEqual(limpiarFichas([{ titulo: "  Cortado  ", url: " /f.jpg ", pie: "Doble", precio: "$2.500", href: "/carta" }]), [{ titulo: "Cortado", url: "/f.jpg", pie: "Doble", precio: "$2.500", href: "/carta" }]);
  // Sin foto ni título no hay ficha; un enlace raro se quita y la ficha queda.
  assert.deepEqual(limpiarFichas([{}, { pie: "solo pie" }, null, 7, { titulo: "Té", href: "javascript:alert(1)" }]), [{ titulo: "Té" }]);
  assert.equal(limpiarFichas([{ titulo: "x".repeat(500) }])[0].titulo!.length, 80);
  // Un plato agotado lo dice; cualquier otra cosa en ese campo no cuenta.
  assert.deepEqual(limpiarFichas([{ titulo: "Té", agotado: true }, { titulo: "Mate", agotado: "si" }]), [{ titulo: "Té", agotado: true }, { titulo: "Mate" }]);
  assert.deepEqual(limpiarFichas("no es una lista"), []);
  assert.deepEqual(limpiarFichas(undefined), []);
});

test("carrusel: el anillo se arma con el ancho de la ficha y cuántas son", () => {
  assert.equal(pasoAnillo(6), 60);
  assert.equal(radioAnillo(240, 6), 222);
  assert.ok(radioAnillo(240, 12) > radioAnillo(240, 6), "más fichas, anillo más grande");
  assert.equal(radioAnillo(240, 2), 0, "con menos de tres no hay anillo");
  assert.equal(radioAnillo(0, 6), 0);
  assert.equal(radioAnillo(NaN, 6), 0);
});

test("carrusel: con pocas fichas el anillo las repite, para que las de los lados no queden de canto", () => {
  assert.equal(puestosAnillo(3), 6);
  assert.equal(puestosAnillo(4), 8);
  assert.equal(puestosAnillo(5), 10);
  assert.equal(puestosAnillo(6), 6);
  assert.equal(puestosAnillo(12), 12);
  // Con menos de tres no hay anillo (van en fila); con más de doce, doce.
  assert.equal(puestosAnillo(2), 0);
  assert.equal(puestosAnillo(0), 0);
  assert.equal(puestosAnillo(40), 12);
  assert.equal(puestosAnillo(NaN), 0);
});

test("carrusel: qué ficha queda al frente según cuánto giró el anillo", () => {
  assert.equal(alFrente(0, 6), 0);
  assert.equal(alFrente(-60, 6), 1);
  assert.equal(alFrente(60, 6), 5);
  assert.equal(alFrente(-370, 6), 0);
  assert.equal(alFrente(-89, 6), 1);
  assert.equal(alFrente(NaN, 6), 0);
});

test("carrusel: al soltar se detiene justo en una ficha, más lejos si venía con impulso", () => {
  assert.equal(dondeSeDetiene(-10, 0, 6), 0);
  assert.equal(dondeSeDetiene(-35, 0, 6), -60);
  assert.equal(dondeSeDetiene(-10, -400, 6), -120);
  assert.equal(dondeSeDetiene(10, 400, 6), 120);
  // Un tirón enorme no lo deja girando para siempre: a lo más, media vuelta.
  assert.ok(Math.abs(dondeSeDetiene(0, 99999, 6)) <= 180);
  assert.equal(dondeSeDetiene(0, NaN, 6), 0);
});

test("carrusel: para traer una ficha al frente gira por el lado corto", () => {
  assert.equal(haciaFicha(1, 0, 6), -60);
  assert.equal(haciaFicha(5, 0, 6), 60);
  assert.equal(haciaFicha(0, -350, 6), -360);
  assert.equal(haciaFicha(2, -720, 6), -840);
  assert.equal(haciaFicha(0, 0, 6), 0);
});

// --- Libro que se abre ---

test("libro: las hojas se limpian, y un grupo largo se parte en varias hojas en vez de cortarse", () => {
  assert.equal(MAX_HOJAS, 16);
  assert.equal(MAX_LINEAS, 10);
  const grupo = (nombre: string, n: number) => ({ titulo: nombre, lineas: Array.from({ length: n }, (_, k) => ({ texto: `Plato ${k}`, precio: "$1.000" })) });
  // 23 platos: tres hojas (10, 10 y 3); las que siguen lo dicen en su título.
  const partido = limpiarHojas([grupo("Cafés", 23)]);
  assert.deepEqual(partido.map((h) => [h.titulo, h.lineas.length]), [["Cafés", 10], ["Cafés (sigue)", 10], ["Cafés (sigue)", 3]]);
  assert.equal(partido[2].lineas[2].texto, "Plato 22", "no se pierde ningún plato");
  // Una carta enorme llega hasta 16 hojas.
  assert.equal(limpiarHojas(Array.from({ length: 40 }, (_, i) => grupo(`Grupo ${i}`, 3))).length, 16);
  assert.deepEqual(limpiarHojas([{ titulo: " Cafés ", lineas: [{ texto: " Cortado ", detalle: " Doble ", precio: " $2.500 " }, { texto: "   " }, null, { detalle: "sin nombre" }, { texto: "Té", agotado: true }, { texto: "Mate", agotado: "si" }] }]), [
    { titulo: "Cafés", lineas: [{ texto: "Cortado", detalle: "Doble", precio: "$2.500" }, { texto: "Té", agotado: true }, { texto: "Mate" }] },
  ]);
  // Una hoja sin título y sin líneas no cuenta; una con solo título, sí.
  assert.deepEqual(limpiarHojas([{ titulo: "", lineas: [] }, { titulo: "Postres" }, 5, null]), [{ titulo: "Postres", lineas: [] }]);
  assert.equal(limpiarHojas([{ titulo: "x".repeat(300), lineas: [{ texto: "y".repeat(300) }] }])[0].lineas[0].texto.length, 80);
  assert.deepEqual(limpiarHojas("x"), []);
});

test("libro: en angosto cada hoja lleva una página (en su frente); en ancho, dos (frente y dorso)", () => {
  assert.deepEqual(carasLibro(3, false), [
    { frente: "tapa", dorso: null },
    { frente: 0, dorso: null },
    { frente: 1, dorso: null },
    { frente: 2, dorso: null },
  ]);
  assert.deepEqual(carasLibro(4, true), [
    { frente: "tapa", dorso: 0 },
    { frente: 1, dorso: 2 },
    { frente: 3, dorso: null },
  ]);
  // Con las páginas impares, la última queda a la izquierda y a la derecha va la contratapa (en blanco).
  assert.deepEqual(carasLibro(3, true), [
    { frente: "tapa", dorso: 0 },
    { frente: 1, dorso: 2 },
    { frente: null, dorso: null },
  ]);
  assert.deepEqual(carasLibro(1, true), [
    { frente: "tapa", dorso: 0 },
    { frente: null, dorso: null },
  ]);
  assert.deepEqual(carasLibro(0, true), []);
  assert.deepEqual(carasLibro(0, false), []);
});

test("libro: cuántas hojas se pueden dar vuelta y qué se está leyendo", () => {
  assert.equal(maxVueltas(3, false), 3);
  assert.equal(maxVueltas(1, true), 1);
  assert.equal(maxVueltas(2, true), 1);
  assert.equal(maxVueltas(3, true), 2);
  assert.equal(maxVueltas(4, true), 2);
  assert.equal(maxVueltas(0, true), 0);
  assert.equal(estadoLibro(0, 4, true), "Tapa");
  assert.equal(estadoLibro(1, 4, true), "Páginas 1 y 2 de 4");
  assert.equal(estadoLibro(2, 4, true), "Páginas 3 y 4 de 4");
  assert.equal(estadoLibro(2, 3, true), "Página 3 de 3");
  assert.equal(estadoLibro(1, 1, true), "Página 1 de 1");
  assert.equal(estadoLibro(2, 3, false), "Página 2 de 3");
  assert.equal(estadoLibro(0, 3, false), "Tapa");
  // Fuera de rango, se queda en el borde.
  assert.equal(estadoLibro(9, 3, false), "Página 3 de 3");
  assert.equal(estadoLibro(-2, 3, false), "Tapa");
});

test("libro: al girar el teléfono (de una página a dos, o al revés) se sigue leyendo la misma hoja", () => {
  // De angosto a ancho: la página 3 (hoja 2) queda en la segunda vuelta, a la izquierda.
  assert.equal(vueltasAlCambiar(3, 4, true), 2);
  assert.equal(vueltasAlCambiar(1, 4, true), 1);
  assert.equal(vueltasAlCambiar(2, 4, true), 1);
  // De ancho a angosto: se muestra la página de la izquierda.
  assert.equal(vueltasAlCambiar(1, 4, false), 1);
  assert.equal(vueltasAlCambiar(2, 4, false), 3);
  // La tapa sigue siendo la tapa, y nunca se pasa del final.
  assert.equal(vueltasAlCambiar(0, 4, true), 0);
  assert.equal(vueltasAlCambiar(0, 4, false), 0);
  assert.equal(vueltasAlCambiar(2, 3, false), 3);
  assert.equal(vueltasAlCambiar(9, 3, true), 2);
});

test("libro: el orden de apilado. A la derecha, la primera sin pasar va arriba; a la izquierda, la última pasada", () => {
  // Cerrado (ninguna pasada), cuatro hojas: la tapa arriba.
  assert.ok(apilado(0, 0, 4) > apilado(1, 0, 4) && apilado(1, 0, 4) > apilado(2, 0, 4) && apilado(2, 0, 4) > apilado(3, 0, 4));
  // Con dos pasadas: a la izquierda manda la segunda; a la derecha, la tercera.
  assert.ok(apilado(1, 2, 4) > apilado(0, 2, 4));
  assert.ok(apilado(2, 2, 4) > apilado(3, 2, 4));
  // Siempre hacia quien mira, y poco: no deforma la perspectiva.
  for (let v = 0; v <= 4; v++) for (let i = 0; i < 4; i++) assert.ok(apilado(i, v, 4) >= 1 && apilado(i, v, 4) <= 4);
});

// --- Lo que encontró la revisión final (24-11-2026) ---
import { colorVivo } from "../src/momentos/calculo-fuegos";
import { CSS_CARRUSEL } from "../src/momentos/CarruselGiratorio";
import { CSS_LIBRO } from "../src/momentos/LibroQueSeAbre";

test("revisión: los fuegos usan el color del tema solo si tiene color; si es negro, gris o blanco, uno festivo", () => {
  assert.equal(colorVivo("rgb(0, 0, 0)", "#f4b942"), "#f4b942");
  assert.equal(colorVivo("rgb(255, 255, 255)", "#f4b942"), "#f4b942");
  assert.equal(colorVivo("rgb(40, 42, 44)", "#f4b942"), "#f4b942");
  assert.equal(colorVivo("rgb(228, 87, 46)", "#f4b942"), "rgb(228, 87, 46)");
  assert.equal(colorVivo("rgba(42, 157, 143, 0.9)", "#f4b942"), "rgba(42, 157, 143, 0.9)");
  // Como entrega el navegador un color mezclado.
  assert.equal(colorVivo("color(srgb 0.1 0.1 0.1)", "#f4b942"), "#f4b942");
  assert.equal(colorVivo("color(srgb 0.9 0.3 0.2)", "#f4b942"), "color(srgb 0.9 0.3 0.2)");
  // Lo que no se sabe leer se deja como viene; lo vacío, no.
  assert.equal(colorVivo("oklch(0.7 0.2 30)", "#f4b942"), "oklch(0.7 0.2 30)");
  assert.equal(colorVivo("", "#f4b942"), "#f4b942");
});

test("revisión: una dirección demasiado larga se descarta, no se corta (cortada sería otra dirección)", () => {
  const larga = "https://ejemplo.cl/" + "a".repeat(2100);
  assert.deepEqual(limpiarFichas([{ titulo: "Té", url: larga, href: larga }]), [{ titulo: "Té" }]);
  // Sin título, una ficha con la foto descartada no queda.
  assert.deepEqual(limpiarFichas([{ url: larga }]), []);
  const justa = "https://ejemplo.cl/" + "a".repeat(1900);
  assert.equal(limpiarFichas([{ titulo: "Té", url: justa, href: justa }])[0].href, justa);
});

test("revisión: el CSS tiene respaldo donde no hay medidas de contenedor (Safari antes de la 16), y los botones del libro no se corren", () => {
  // Primero el valor de respaldo; el que usa `cqi`, solo donde existe.
  assert.ok(/--mk-c-ancho:min\(58vw,250px\)/.test(CSS_CARRUSEL) && /@supports \(width:1cqi\)\{[^}]*--mk-c-ancho:clamp\(160px,58cqi,250px\)/.test(CSS_CARRUSEL), "carrusel");
  assert.ok(/\.mk-m-libro-tapa-titulo\{[^}]*font-size:1\.8rem;font-size:clamp\(1\.5rem,7cqi,2\.3rem\)/.test(CSS_LIBRO), "libro");
  // Dentro de una fila o una grilla de ancho libre, la pieza no queda de ancho cero.
  assert.ok(/\.mk-m-carrusel\{[^}]*width:100%/.test(CSS_CARRUSEL) && /\.mk-m-libro\{[^}]*width:100%/.test(CSS_LIBRO));
  // El botón que cambia de texto («Abrir la carta», «Siguiente») tiene ancho fijo, y el estado va en su propia línea.
  assert.ok(/\[data-ir=despues\]\{[^}]*min-width:/.test(CSS_LIBRO) && /\.mk-m-libro-estado\{[^}]*flex-basis:100%/.test(CSS_LIBRO));
  // La fila deja lugar para el contorno del foco (3 px más 3 de separación).
  assert.ok(/\.mk-m-carrusel-fila\{[^}]*padding:12px 8px/.test(CSS_CARRUSEL));
});
