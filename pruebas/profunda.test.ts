// Foto profunda: lo calculable del efecto y el campo de la receta.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ACERCAR, FUERZA, acercarA, encuadre, inclinacionDe, llegoA, objetivoProfunda } from "../src/fotos/calculo-profunda";
import { normalizarReceta, recetaAProps, validarReceta } from "../src/receta/receta";
import { textoContrato } from "../src/receta/contrato";

const cerca = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("encuadre: la foto llena la caja como object-fit: cover, un poco acercada", () => {
  assert.equal(ACERCAR, 1.06);
  // Misma proporción: se ve entera, menos el acercamiento.
  const igual = encuadre(900, 600, 300, 200);
  assert.ok(cerca(igual.x, 1 / 1.06) && cerca(igual.y, 1 / 1.06));
  // Caja más angosta que la foto: se ve todo el alto y se recortan los lados.
  const angosta = encuadre(900, 600, 600, 600);
  assert.ok(cerca(angosta.x, 1 / 1.5 / 1.06) && cerca(angosta.y, 1 / 1.06), JSON.stringify(angosta));
  // Caja más ancha: se ve todo el ancho y se recorta arriba y abajo.
  const ancha = encuadre(900, 600, 1200, 400);
  assert.ok(cerca(ancha.x, 1 / 1.06) && cerca(ancha.y, 0.5 / 1.06), JSON.stringify(ancha));
  assert.ok(cerca(encuadre(900, 600, 300, 200, 1).x, 1));
  for (const malo of [[0, 600, 300, 200], [900, 0, 300, 200], [900, 600, 0, 200], [900, 600, 300, NaN]]) assert.deepEqual(encuadre(malo[0], malo[1], malo[2], malo[3]), { x: 1, y: 1 });
});

test("objetivo: el cursor, el scroll y la inclinación se suman, sin pasar de -1 a 1", () => {
  assert.deepEqual(objetivoProfunda({}), { x: 0, y: 0 });
  assert.deepEqual(objetivoProfunda({ puntero: { x: 0.5, y: -0.5 } }), { x: 0.5, y: -0.5 });
  // El scroll mueve de arriba abajo: a mitad de camino no corre nada.
  assert.ok(cerca(objetivoProfunda({ avance: 0.5 }).y, 0));
  assert.ok(cerca(objetivoProfunda({ avance: 1 }).y, 0.6));
  assert.ok(cerca(objetivoProfunda({ avance: 0 }).y, -0.6));
  assert.deepEqual(objetivoProfunda({ puntero: { x: 0.9, y: 0.9 }, inclinacion: { x: 0.9, y: 0.9 }, avance: 1 }), { x: 1, y: 1 });
  assert.deepEqual(objetivoProfunda({ puntero: { x: NaN, y: Infinity } }), { x: 0, y: 1 });
});

test("inclinación: 20 grados ya es el máximo, contando desde como estaba el teléfono al empezar", () => {
  assert.deepEqual(inclinacionDe(45, 0, 45), { x: 0, y: 0 });
  assert.deepEqual(inclinacionDe(55, 10, 45), { x: 0.5, y: 0.5 });
  assert.deepEqual(inclinacionDe(70, -40, 45), { x: -1, y: 1 });
  assert.deepEqual(inclinacionDe(null, null, 45), { x: 0, y: 0 });
});

test("el movimiento se acerca suave a su meta y sabe cuándo llegó", () => {
  let e = 0;
  for (let i = 0; i < 200; i++) e = acercarA(e, 1);
  assert.ok(llegoA(e, 1) && e <= 1);
  assert.ok(!llegoA(0.9, 1));
  assert.ok(acercarA(0, 1) > 0 && acercarA(0, 1) < 0.2, "de a poco");
  assert.ok(FUERZA > 0.02 && FUERZA <= 0.05, "un movimiento chico: no marea");
});

const base = { version: 2, estilo: "pelicula", titulo: "Café *Luna*", composicion: "imagen", imagenes: ["a.jpg"] };

test("receta: «fotoProfunda» es un campo de la v2 que pide una composición con foto", () => {
  const r = normalizarReceta({ ...base, fotoProfunda: true });
  assert.equal(r.fotoProfunda, true);
  assert.equal(recetaAProps(r).fotoProfunda, true);
  assert.ok(validarReceta({ ...base, fotoProfunda: true }).ok);
  assert.ok(!("fotoProfunda" in normalizarReceta(base)), "apagada no se escribe");
  const sinFoto = validarReceta({ ...base, composicion: "gigante", fotoProfunda: true });
  assert.ok(sinFoto.ok && !("fotoProfunda" in sinFoto.receta) && sinFoto.avisos.some((a) => /foto profunda/i.test(a)));
  const mala = validarReceta({ ...base, fotoProfunda: "si" });
  assert.ok(!mala.ok && mala.errores.some((e) => e.campo === "fotoProfunda"));
  assert.ok(JSON.parse(textoContrato()).campos.includes("fotoProfunda"));
});

test("receta: la foto profunda no se combina todavía con la foto viva ni con las tomas", () => {
  const conViva = validarReceta({ ...base, fotoProfunda: true, fotoViva: true });
  assert.ok(conViva.ok && conViva.receta.fotoViva === true && !("fotoProfunda" in conViva.receta) && conViva.avisos.some((a) => /foto viva/i.test(a)));
  const conTomas = validarReceta({ ...base, imagenes: ["a.jpg", "b.jpg"], tomas: true, fotoProfunda: true });
  assert.ok(conTomas.ok && conTomas.receta.tomas === true && !("fotoProfunda" in conTomas.receta) && conTomas.avisos.some((a) => /tomas/i.test(a)));
  // Normalizar dos veces da lo mismo.
  const una = normalizarReceta({ ...base, fotoProfunda: true });
  assert.deepEqual(normalizarReceta(una), una);
});

// --- Lo que encontró la revisión final (24-11-2026) ---
import { anchoMapa, ladoTextura, mismaProporcion, pasoFirme } from "../src/fotos/calculo-profunda";

test("revisión: la inclinación tiene zona muerta (el temblor de la mano no despierta al efecto)", () => {
  // Menos de medio grado no cuenta.
  assert.deepEqual(inclinacionDe(45.2, 0.3, 45), { x: 0, y: 0 });
  assert.deepEqual(inclinacionDe(44.8, -0.2, 45), { x: 0, y: 0 });
  // Y va de a pasos: dos lecturas casi iguales dan lo mismo.
  assert.deepEqual(inclinacionDe(50.1, 5.1, 45), inclinacionDe(50.3, 5.2, 45));
  assert.deepEqual(inclinacionDe(55, 10, 45), { x: 0.5, y: 0.5 });
});

test("revisión: llega cuando el movimiento que falta ya no se ve, y a cualquier cantidad de cuadros por segundo va igual de rápido", () => {
  assert.ok(llegoA(0.985, 1), "falta menos de un cuarto de px: ya llegó");
  assert.ok(!llegoA(0.9, 1));
  // Dos cuadros de una pantalla de 120 por segundo avanzan lo mismo que uno de 60.
  const aSesenta = acercarA(0, 1, 0.08, 16.7);
  const aCientoVeinte = acercarA(acercarA(0, 1, 0.08, 8.35), 1, 0.08, 8.35);
  assert.ok(Math.abs(aSesenta - aCientoVeinte) < 1e-6, `${aSesenta} y ${aCientoVeinte}`);
  assert.ok(Math.abs(acercarA(0, 1) - 0.08) < 1e-9, "sin decirle cuánto pasó, cuenta un cuadro normal");
  // Un cuadro muy largo (la pestaña volvió) no se pasa de la meta, y un tiempo raro no mueve nada.
  assert.ok(acercarA(0, 1, 0.08, 5000) <= 1 && acercarA(0, 1, 0.08, 5000) > 0.99);
  assert.equal(acercarA(0.3, 1, 0.08, -5), 0.3);
  assert.equal(acercarA(0.3, 1, 0.08, NaN), 0.3);
});

test("revisión: una foto enorme se sube achicada, y el mapa se suaviza según el ancho de la caja", () => {
  assert.deepEqual(ladoTextura(4032, 3024, 1600), { ancho: 1600, alto: 1200 });
  assert.deepEqual(ladoTextura(3024, 4032, 1600), { ancho: 1200, alto: 1600 });
  assert.deepEqual(ladoTextura(900, 600, 1600), { ancho: 900, alto: 600 });
  assert.deepEqual(ladoTextura(0, 600, 1600), { ancho: 1, alto: 1 });
  assert.equal(anchoMapa(390), 64);
  assert.equal(anchoMapa(1200), 100);
  assert.equal(anchoMapa(4000), 160);
  assert.equal(anchoMapa(NaN), 64);
});

test("revisión: un mapa con otra proporción no es de esa foto", () => {
  assert.ok(mismaProporcion(900, 600, 256, 171));
  assert.ok(mismaProporcion(900, 600, 256, 170));
  assert.ok(!mismaProporcion(900, 600, 800, 500));
  assert.ok(!mismaProporcion(900, 600, 600, 900));
  assert.ok(!mismaProporcion(900, 600, 0, 0));
});

test("revisión: la foto profunda sin ninguna foto queda apagada, con aviso", () => {
  const sin = validarReceta({ version: 2, estilo: "pelicula", titulo: "Café", composicion: "imagen", fotoProfunda: true });
  assert.ok(sin.ok && !("fotoProfunda" in sin.receta) && sin.avisos.some((a) => /foto profunda/i.test(a)), JSON.stringify(sin));
});

test("revisión: la lectura del sensor no baila entre dos pasos (holgura), y con el teléfono casi parado no cruza de lado", () => {
  // Cerca del borde entre 5° y 6°, el ruido no cambia el paso ya tomado.
  assert.equal(pasoFirme(5, 5.6), 5);
  assert.equal(pasoFirme(5, 4.4), 5);
  assert.equal(pasoFirme(5, 5.8), 6);
  assert.equal(pasoFirme(5, 9.2), 9);
  assert.equal(pasoFirme(null, 5.4), 5);
  assert.equal(pasoFirme(0, -0.3), 0);
  // Con el teléfono casi vertical, la lectura de lado a lado salta de signo: ahí no se usa.
  assert.equal(inclinacionDe(85, 15, 80).x, 0);
  assert.equal(inclinacionDe(-85, 15, -80).x, 0);
  assert.equal(inclinacionDe(60, 10, 60).x, 0.5);
});
