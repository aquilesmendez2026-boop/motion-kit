import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validarReceta, normalizarReceta, recetaAProps, protagonistaDe, esHrefSeguro, esImagenSegura, textoContrato,
  TOPES_RECETA, type RecetaEncabezado,
} from "../src/receta";
import { RUBRO_IDS, encabezadoPorRubro, semillaAzar, type EncabezadoDeRubro } from "../src/encabezados/rubros";
import { RECETAS } from "../src/plantillas/recetas";
import { ESTILO_IDS } from "../src/estilos/estilos";

const base = { version: 1, estilo: "pelicula", titulo: "Café de *especialidad*" };

/** Igual que hace el editor con «Sorpréndeme con este rubro» (sin shader: es de la v2). */
const deRubro = (a: EncabezadoDeRubro) => ({
  version: 1, estilo: a.estilo, composicion: a.composicion, entrada: a.entrada, efectoTexto: a.efectoTexto, pack: a.pack,
  ...(a.conEfecto ? { efecto: a.efecto, variante: a.variante } : {}), profundidad: a.profundidad, ...(a.luz ? { luz: a.luz } : {}),
  antetitulo: a.textos.antetitulo, titulo: a.textos.titulo, bajada: a.textos.bajada, datos: a.textos.datos,
  botones: [{ texto: a.textos.boton, href: "#carta" }, { texto: a.textos.secundario, href: "#contacto" }],
});

const errores = (x: unknown) => {
  const r = validarReceta(x);
  assert.equal(r.ok, false, "tenía que fallar");
  return r.ok ? [] : r.errores;
};
const campos = (x: unknown) => errores(x).map((e) => e.campo);

test("una receta mínima pasa y toma los valores por defecto", () => {
  const r = validarReceta(base);
  assert.ok(r.ok);
  assert.deepEqual(r.receta, {
    version: 1, estilo: "pelicula", composicion: "izquierda", entrada: "cascada", efectoTexto: "trailer", pack: r.receta.pack,
    titulo: "Café de *especialidad*", alto: "pantalla", profundidad: false, salida: "ninguna", ahorro: "auto",
  });
  assert.equal(r.avisos.length, 0);
});

test("la receta por defecto del editor pasa", () => {
  const editor = {
    version: 1, estilo: "neon", composicion: "letrero", entrada: "foco", efectoTexto: "encender", efecto: "rejilla", variante: 1,
    pack: "neon-tubo", alto: "pantalla", antetitulo: "Barrio Italia · desde 2019", titulo: "Café de *especialidad*, tostado aquí",
    bajada: "Granos de origen, pan de masa madre y un rincón tranquilo para quedarse.",
    botones: [{ texto: "Ver la carta", href: "#carta" }, { texto: "Cómo llegar", href: "#contacto" }],
    datos: ["Lun a sáb", "8:00 a 20:00", "Santiago"], profundidad: false, salida: "ninguna", ahorro: "auto",
  };
  const r = validarReceta(editor);
  assert.ok(r.ok, JSON.stringify(!r.ok && r.errores));
  assert.deepEqual(r.receta, editor);
});

test("las recetas de los 10 rubros pasan (40 semillas por rubro)", () => {
  for (const rubro of RUBRO_IDS) {
    for (let s = 1; s <= 40; s++) {
      const r = validarReceta(deRubro(encabezadoPorRubro(rubro, semillaAzar(s))));
      assert.ok(r.ok, `${rubro}, semilla ${s}: ${JSON.stringify(!r.ok && r.errores)}`);
      assert.ok(protagonistaDe(r.receta) !== null || !r.receta.efecto, "con efecto siempre hay protagonista");
    }
  }
});

test("las portadas de las plantillas pasan", () => {
  for (const p of RECETAS) {
    const portada = p.secciones.find((s) => s.tipo === "portada");
    assert.ok(portada && portada.tipo === "portada");
    const { tipo: _t, boton, botonSecundario, ...resto } = portada;
    const r = validarReceta({ version: 1, estilo: p.estilo, ...resto, botones: [boton, ...(botonSecundario ? [botonSecundario] : [])] });
    assert.ok(r.ok, `${p.estilo}: ${JSON.stringify(!r.ok && r.errores)}`);
  }
});

test("una receta mala da sus errores en español, con el campo", () => {
  const e = errores({
    version: 2, estilo: "barroco", titulo: "x".repeat(81), composicion: "rara", datos: ["a", "b", "c", "d", "e"],
    botones: [{ texto: "Ir", href: "javascript:alert(1)" }], alto: 150, mover: ["puntero", "puntero"], shader: "aurora", color: "rojo",
  });
  const por = Object.fromEntries(e.map((x) => [x.campo, x.mensaje]));
  assert.match(por.version, /tiene que ser 1/);
  assert.match(por.estilo, /Elige un estilo/);
  assert.match(por.titulo, /no puede pasar de 80 letras \(tiene 81\)/);
  assert.match(por.composicion, /composición/);
  assert.match(por.datos, /hasta 4 datos/);
  assert.match(por["botones[0].href"], /https:\/\//);
  assert.match(por.alto, /20 a 100/);
  assert.match(por.mover, /no puede repetir/);
  assert.match(por.shader, /receta v2/);
  assert.match(por.color, /no va en la receta/);
});

test("faltan lo obligatorio: versión, estilo y título", () => {
  assert.deepEqual(campos({}).sort(), ["estilo", "titulo", "version"]);
  assert.deepEqual(campos({ ...base, titulo: "  **  " }), ["titulo"]);
  assert.deepEqual(errores(null), [{ campo: "receta", mensaje: "La receta no es válida: tiene que ser un objeto." }]);
  assert.deepEqual(campos([]), ["receta"]);
});

test("topes: los asteriscos no cuentan y las letras con tilde valen una", () => {
  assert.ok(validarReceta({ ...base, titulo: "*" + "á".repeat(80) + "*" }).ok);
  assert.deepEqual(campos({ ...base, bajada: "b".repeat(TOPES_RECETA.bajada + 1) }), ["bajada"]);
  assert.deepEqual(campos({ ...base, datos: ["d".repeat(41)] }), ["datos[0]"]);
  assert.deepEqual(campos({ ...base, botones: [{ texto: "t".repeat(31), href: "#a" }] }), ["botones[0].texto"]);
  assert.deepEqual(campos({ ...base, botones: [{ texto: "a", href: "#a" }, { texto: "b", href: "#b" }, { texto: "c", href: "#c" }] }), ["botones"]);
  assert.deepEqual(campos({ ...base, botones: [{ texto: "a", href: "#a", target: "_blank" }] }), ["botones[0].target"]);
  assert.deepEqual(campos({ ...base, titulo: "hola\u0000" }), ["titulo"]);
});

test("alto: nombre de la lista o número de 20 a 100", () => {
  for (const alto of ["pantalla", "grande", "medio", "compacto", "auto", 20, 55.5, 100]) assert.ok(validarReceta({ ...base, alto }).ok, String(alto));
  for (const alto of [19, 101, "enorme", Number.NaN, "70"]) assert.deepEqual(campos({ ...base, alto }), ["alto"], String(alto));
  assert.deepEqual(campos({ ...base, altoCelular: 0 }), ["altoCelular"]);
  const r = validarReceta({ ...base, alto: 55.5 });
  assert.ok(r.ok && r.receta.alto === 56, "el número se redondea");
});

test("enlaces: solo https, # o rutas relativas", () => {
  for (const h of ["https://wa.me/56912345678", "#carta", "/carta", "carta", "/reservar?dia=hoy"]) assert.ok(esHrefSeguro(h), h);
  for (const h of ["javascript:alert(1)", "JavaScript:void(0)", "http://sitio.cl", "//evil.com", "data:text/html,x", "\\\\evil", "tel:+56912345678", "https://u:p@sitio.cl", "", " #a", "#a b"]) {
    assert.ok(!esHrefSeguro(h), h);
  }
});

test("fotos: URL https o key de S3", () => {
  for (const s of ["https://cdn.lamente.cl/a.webp", "negocio/fotos/portada.webp", "a_b-c.jpg"]) assert.ok(esImagenSegura(s), s);
  for (const s of ["http://x.cl/a.jpg", "blob:http://localhost/1", "../secreto", "a//b", "/abs.jpg", "a b.jpg", "data:image/png;base64,x"]) assert.ok(!esImagenSegura(s), s);
  assert.deepEqual(campos({ ...base, imagenes: ["ok.jpg", "blob:x"] }), ["imagenes[1]"]);
  assert.deepEqual(campos({ ...base, imagenes: ["a.jpg", "b.jpg", "c.jpg", "d.jpg"] }), ["imagenes"]);
});

test("normalizar nunca lanza y quita lo desconocido", () => {
  for (const x of [null, undefined, 3, "x", [], { titulo: 5 }, { botones: "x", datos: {}, mover: 3, imagenes: null }]) {
    const r = normalizarReceta(x);
    assert.equal(r.version, 1);
    assert.equal(typeof r.titulo, "string");
  }
  const r = normalizarReceta({ ...base, shader: "aurora", objeto: { tipo: "3d" }, color: "rojo", composicion: "rara", variante: 2 });
  assert.ok(!("shader" in r) && !("objeto" in r) && !("color" in r));
  assert.equal(r.composicion, "izquierda");
  assert.ok(!("variante" in r), "sin efecto no queda la variante");
});

test("normalizar corta lo largo, limpia y es estable", () => {
  const r = normalizarReceta({
    ...base, titulo: "  " + "t".repeat(100) + "  ", datos: ["  a  ", "", 7, "b", "c", "d", "e"],
    botones: [{ texto: "Malo", href: "javascript:x" }, { texto: "  Bueno  ", href: "#b" }], alto: 300, alt: "sin foto",
    mover: ["scroll", "scroll", "raro"],
  });
  assert.equal(r.titulo, "t".repeat(80));
  assert.deepEqual(r.datos, ["a", "b", "c", "d"]);
  assert.deepEqual(r.botones, [{ texto: "Bueno", href: "#b" }]);
  assert.equal(r.alto, 100);
  assert.ok(!("alt" in r), "sin fotos no queda el texto de la foto");
  assert.ok(!("mover" in r), "sin capas ni luz que sigue al dedo, «mover» no se guarda");
  assert.deepEqual(normalizarReceta(r), r);
  const v = validarReceta(r);
  assert.ok(v.ok);
  assert.deepEqual(v.receta, r);
});

test("un solo protagonista: el fondo animado gana y lo demás se calma", () => {
  const r = validarReceta({ ...base, efecto: "rejilla", efectoTexto: "onda", luz: "barrido" });
  assert.ok(r.ok);
  assert.equal(r.receta.efecto, "rejilla");
  assert.equal(r.receta.efectoTexto, "revelar");
  assert.equal(r.receta.luz, "puntero");
  assert.equal(r.avisos.length, 2);
  assert.equal(protagonistaDe(r.receta), "efecto");
});

test("un solo protagonista: sin fondo, el título que se mueve gana a la luz que cruza", () => {
  const r = normalizarReceta({ ...base, efectoTexto: "glitch", luz: "barrido", profundidad: true });
  assert.equal(r.efectoTexto, "glitch");
  assert.equal(r.luz, "puntero");
  assert.equal(protagonistaDe(r), "efectoTexto");
  const solo = normalizarReceta({ ...base, efectoTexto: "revelar", luz: "barrido" });
  assert.equal(solo.luz, "barrido");
  assert.equal(protagonistaDe(solo), "luz");
  assert.equal(protagonistaDe(normalizarReceta({ ...base, efectoTexto: "revelar", profundidad: true, luz: "puntero" })), null);
});

test("el estilo por defecto de cada estilo da una receta válida", () => {
  for (const estilo of ESTILO_IDS) assert.ok(validarReceta({ version: 1, estilo, titulo: "Hola" }).ok, estilo);
});

test("recetaAProps arma las props de Encabezado", () => {
  const r = normalizarReceta({
    ...base, botones: [{ texto: "Reservar", href: "#r" }, { texto: "Carta", href: "/carta" }],
    imagenes: ["negocio/portada.webp", "https://cdn.x.cl/b.jpg"], poster: "negocio/poster.webp", alt: "Taza de café",
    profundidad: true, mover: ["puntero"],
  }) as RecetaEncabezado;
  const p = recetaAProps(r, { urlImagen: (k) => `https://cdn.lamente.cl/${k}` });
  assert.deepEqual(p.boton, { texto: "Reservar", href: "#r" });
  assert.deepEqual(p.botonSecundario, { texto: "Carta", href: "/carta" });
  assert.deepEqual(p.imagenes, ["https://cdn.lamente.cl/negocio/portada.webp", "https://cdn.x.cl/b.jpg"]);
  assert.equal(p.poster, "https://cdn.lamente.cl/negocio/poster.webp");
  assert.equal(p.alt, "Taza de café");
  assert.deepEqual(p.mover, ["puntero"]);
  assert.ok(!("estilo" in p) && !("version" in p));
  assert.ok(Object.values(p).every((v) => v !== undefined));
});

test("el contrato está al día con el código", () => {
  const archivo = readFileSync("contrato/encabezado-motionkit.json", "utf8");
  assert.equal(archivo, textoContrato(), "Corre: npm run contrato");
  const c = JSON.parse(archivo);
  assert.equal(c.version, 1);
  assert.equal(c.listas.composicion.length, 12);
  assert.equal(c.listas.estilo.length, ESTILO_IDS.length);
  assert.ok(!c.campos.includes("shader") && !c.campos.includes("objeto"));
});
