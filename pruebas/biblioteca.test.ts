import { test } from "node:test";
import assert from "node:assert/strict";
import {
  crearDiseno, editarDiseno, duplicarDiseno, validarDiseno, filtrarDisenos, etiquetasDe, limpiarEtiquetas,
  exportarBiblioteca, importarBiblioteca, almacenLocal, TOPES_BIBLIOTECA, type DisenoBiblioteca,
} from "../src/biblioteca/biblioteca";
import { normalizarReceta } from "../src/receta";

const receta = (titulo = "Café de *especialidad*") => normalizarReceta({ version: 1, estilo: "pelicula", titulo });
const T0 = "2026-11-23T10:00:00.000Z";
const T1 = "2026-11-23T11:00:00.000Z";

test("crear: queda en borrador, con id, fechas y etiquetas limpias", () => {
  const d = crearDiseno({ nombre: "  Café Italia ", receta: receta(), rubro: "cafeteria", etiquetas: " Oscuro, oscuro ,  Barrio  Italia,," }, T0);
  assert.equal(d.nombre, "Café Italia");
  assert.equal(d.estado, "borrador");
  assert.match(d.id, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(d.etiquetas, ["oscuro", "barrio italia"]);
  assert.equal(d.creado, T0);
  assert.equal(d.actualizado, T0);
});

test("crear: sin nombre o con una receta mala da el error en español", () => {
  assert.throws(() => crearDiseno({ nombre: " ", receta: receta() }), /Ponle un nombre/);
  assert.throws(() => crearDiseno({ nombre: "Malo", receta: { ...receta(), estilo: "inventado" } as never }), /estilo/i);
});

test("validar: junta los errores con el campo, también los de la receta", () => {
  const r = validarDiseno({ id: "x y", nombre: "", estado: "publicado", rubro: "nave", creado: "ayer", actualizado: T0, receta: { version: 1 } });
  assert.equal(r.ok, false);
  const campos = r.ok ? [] : r.errores.map((e) => e.campo);
  for (const c of ["id", "nombre", "estado", "rubro", "creado"]) assert.ok(campos.includes(c), `falta ${c}`);
  assert.ok(campos.some((c) => c.startsWith("receta.")), "faltan los errores de la receta");
});

test("etiquetas: hasta 8, de hasta 24 letras", () => {
  const muchas = Array.from({ length: 12 }, (_, i) => `e${i}`);
  assert.equal(limpiarEtiquetas(muchas).length, TOPES_BIBLIOTECA.etiquetas);
  assert.deepEqual(limpiarEtiquetas(["x".repeat(25), "ok"]), ["ok"]);
});

test("editar y duplicar", () => {
  const d = crearDiseno({ nombre: "Barbería", receta: receta(), etiquetas: ["retro"] }, T0);
  const e = editarDiseno(d, { estado: "aprobado", etiquetas: ["retro", "navaja"] }, T1);
  assert.equal(e.id, d.id);
  assert.equal(e.estado, "aprobado");
  assert.equal(e.creado, T0);
  assert.equal(e.actualizado, T1);
  const c = duplicarDiseno(e, T1);
  assert.notEqual(c.id, e.id);
  assert.equal(c.nombre, "Barbería (copia)");
  assert.equal(c.estado, "borrador");
  assert.ok(duplicarDiseno({ ...e, nombre: "x".repeat(60) }).nombre.length <= TOPES_BIBLIOTECA.nombre);
  assert.throws(() => editarDiseno(d, { estado: "otro" as never }), /estado/);
});

test("filtrar: sin archivados por defecto, por rubro, estado, etiqueta y texto sin tildes", () => {
  const a = crearDiseno({ nombre: "Café Italia", receta: receta(), rubro: "cafeteria", etiquetas: ["oscuro"] }, T0);
  const b = editarDiseno(crearDiseno({ nombre: "Smash", receta: receta("*Doble* carne"), rubro: "hamburgueseria" }, T0), { estado: "aprobado" }, T1);
  const c = editarDiseno(crearDiseno({ nombre: "Viejo", receta: receta() }, T0), { estado: "archivado" }, T1);
  const lista = [a, b, c];
  assert.deepEqual(filtrarDisenos(lista).map((d) => d.nombre), ["Smash", "Café Italia"]);
  assert.deepEqual(filtrarDisenos(lista, { estado: "archivado" }).map((d) => d.nombre), ["Viejo"]);
  assert.deepEqual(filtrarDisenos(lista, { rubro: "cafeteria" }).map((d) => d.nombre), ["Café Italia"]);
  assert.deepEqual(filtrarDisenos(lista, { etiqueta: "oscuro" }).map((d) => d.nombre), ["Café Italia"]);
  assert.deepEqual(filtrarDisenos(lista, { texto: "cafe" }).map((d) => d.nombre), ["Café Italia"]);
  assert.deepEqual(filtrarDisenos(lista, { texto: "doble" }).map((d) => d.nombre), ["Smash"]);
  assert.deepEqual(etiquetasDe(lista), ["oscuro"]);
});

test("exportar e importar: ida y vuelta igual", () => {
  const lista = [crearDiseno({ nombre: "Uno", receta: receta(), vista: { tema: "hamburgueseria", paleta: "bosque" } }, T0), crearDiseno({ nombre: "Dos", receta: receta() }, T0)];
  const r = importarBiblioteca(exportarBiblioteca(lista), []);
  assert.equal(r.error, undefined);
  assert.equal(r.agregados, 2);
  assert.deepEqual(r.disenos, lista);
});

test("importar: gana la edición más nueva y se informa lo que no sirve", () => {
  const d = crearDiseno({ nombre: "Uno", receta: receta() }, T0);
  const nuevo = { ...d, nombre: "Uno editado", actualizado: T1 };
  const malo = { ...d, id: "otro", receta: { version: 1, estilo: "pelicula" } };
  const texto = JSON.stringify({ formato: "motion-kit/biblioteca", version: 1, exportado: T1, disenos: [nuevo, malo] });
  const r = importarBiblioteca(texto, [d]);
  assert.equal(r.actualizados, 1);
  assert.equal(r.agregados, 0);
  assert.equal(r.disenos[0].nombre, "Uno editado");
  assert.equal(r.rechazados.length, 1);
  assert.equal(r.rechazados[0].posicion, 2);
  assert.ok(r.rechazados[0].errores.some((e) => e.campo === "receta.titulo"));
  // Lo viejo no pisa lo nuevo.
  assert.equal(importarBiblioteca(JSON.stringify(d), [nuevo]).disenos[0].nombre, "Uno editado");
});

test("importar: archivos que no sirven", () => {
  assert.match(importarBiblioteca("{no es json", []).error ?? "", /JSON/);
  assert.match(importarBiblioteca(JSON.stringify({ hola: 1 }), []).error ?? "", /no es una biblioteca/);
  assert.match(importarBiblioteca(JSON.stringify({ formato: "motion-kit/biblioteca", version: 9, disenos: [] }), []).error ?? "", /versión 9/);
});

test("almacén local: guarda, lista, borra y salta lo que no sirve", async () => {
  const datos = new Map<string, string>();
  const web = { getItem: (k: string) => datos.get(k) ?? null, setItem: (k: string, v: string) => void datos.set(k, v) };
  const a = almacenLocal("prueba", web);
  assert.equal(a.persistente, true);
  const d = crearDiseno({ nombre: "Uno", receta: receta() }, T0);
  await a.guardar(d);
  await a.guardar({ ...d, nombre: "Uno bis" });
  assert.deepEqual((await a.listar()).map((x) => x.nombre), ["Uno bis"]);
  datos.set("prueba", JSON.stringify([...(JSON.parse(datos.get("prueba")!) as DisenoBiblioteca[]), { roto: true }]));
  assert.equal((await almacenLocal("prueba", web).listar()).length, 1);
  await a.borrar(d.id);
  assert.deepEqual(await a.listar(), []);
});

test("almacén local: sin localStorage guarda en memoria y lo avisa", async () => {
  const roto = { getItem: () => null, setItem: () => { throw new Error("SecurityError"); } };
  const a = almacenLocal("x", roto);
  assert.equal(a.persistente, false);
  await a.guardar(crearDiseno({ nombre: "Uno", receta: receta() }));
  assert.equal((await a.listar()).length, 1);
  assert.equal(almacenLocal("x", null).persistente, false);
});
