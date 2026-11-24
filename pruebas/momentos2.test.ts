import { test } from "node:test";
import assert from "node:assert/strict";
import { hoyEn, horaEn, hojaDe, cuposDe, proximaClase, sumarDias, esNueva, fechaLarga, nombreDeRed, barrasOnda, duracionEnPalabras, parrafosDe, inicialDe, numeroDePaso, ritmoCinta, envolver } from "../src/momentos/calculos-2";
import { cuadroDescifrar, duracionDescifrar } from "../src/estilos/descifrar";
import { ESCENAS_LLAMADO } from "../src/momentos/escenas-llamado";

test("hoyEn y horaEn usan la zona del negocio", () => {
  const t = new Date("2026-11-24T02:30:00Z");
  assert.equal(hoyEn("America/Santiago", t), "2026-11-23");
  assert.equal(horaEn("America/Santiago", t), "23:30");
  // Una zona que no existe no rompe: se usa la del navegador.
  assert.equal(hoyEn("Zona/Inventada", t).length, 10);
  assert.match(horaEn("Zona/Inventada", t), /^\d\d:\d\d$/);
});

test("hojaDe: el día, el mes y el día de la semana de una fecha", () => {
  assert.deepEqual(hojaDe("2026-12-05"), { dia: 5, mes: "dic", semana: "sáb" });
  assert.deepEqual(hojaDe("2026-11-24"), { dia: 24, mes: "nov", semana: "mar" });
  assert.equal(hojaDe("2026-13-40"), null);
  assert.equal(hojaDe("2026-02-30"), null);
  assert.equal(hojaDe("mañana"), null);
  assert.equal(hojaDe(undefined as unknown as string), null);
});

test("cuposDe: el texto de los cupos, su estado y cuánto está ocupado", () => {
  assert.deepEqual(cuposDe(3, "no"), { texto: "Quedan 3", estado: "libre", ocupado: null });
  assert.deepEqual(cuposDe(1, "no", 10), { texto: "Queda 1", estado: "ultimo", ocupado: 0.9 });
  assert.deepEqual(cuposDe(0, "abierta"), { texto: "Lleno · lista de espera", estado: "lleno", ocupado: null });
  assert.deepEqual(cuposDe(-2, "llena", 8), { texto: "Lleno", estado: "lleno", ocupado: 1 });
  // Datos raros: más libres que cupos, cupos en cero o no numéricos.
  assert.equal(cuposDe(12, "no", 10).ocupado, 0);
  assert.equal(cuposDe(2, "no", 0).ocupado, null);
  assert.equal(cuposDe(NaN, "no").estado, "lleno");
});

test("proximaClase y sumarDias", () => {
  const s = [{ fecha: "2026-11-24", hora: "09:00" }, { fecha: "2026-11-24", hora: "19:00" }, { fecha: "2026-11-25", hora: "08:00" }];
  assert.equal(proximaClase(s, "2026-11-24", "10:15"), 1);
  assert.equal(proximaClase(s, "2026-11-24", "19:00"), 1);
  assert.equal(proximaClase(s, "2026-11-24", "21:00"), -1);
  assert.equal(proximaClase([], "2026-11-24", "10:00"), -1);
  assert.equal(sumarDias("2026-11-30", 1), "2026-12-01");
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(sumarDias("no", 1), "");
});

test("esNueva y fechaLarga (novedades)", () => {
  const ahora = new Date("2026-11-24T12:00:00Z");
  assert.equal(esNueva("2026-11-20T15:00:00.000Z", ahora), true);
  assert.equal(esNueva("2026-11-10T15:00:00.000Z", ahora), false);
  assert.equal(esNueva("2026-12-01T00:00:00.000Z", ahora), false, "una fecha futura no es «nueva»");
  assert.equal(esNueva("ayer", ahora), false);
  assert.equal(fechaLarga("2026-11-15T15:00:00.000Z", "America/Santiago"), "15 de noviembre");
  // Las 02:00 UTC del 16 todavía son el 15 en Chile.
  assert.equal(fechaLarga("2026-11-16T02:00:00.000Z", "America/Santiago"), "15 de noviembre");
  assert.equal(fechaLarga("cualquier cosa", "America/Santiago"), "");
});

test("nombreDeRed (enlaces)", () => {
  assert.equal(nombreDeRed("youtube"), "YouTube");
  assert.equal(nombreDeRed("apple_podcasts"), "Apple Podcasts");
  assert.equal(nombreDeRed("x"), "X");
  assert.equal(nombreDeRed("mi_red_nueva"), "Mi red nueva");
  assert.equal(nombreDeRed(""), "");
});

test("barrasOnda y duracionEnPalabras (episodios)", () => {
  const b = barrasOnda(7);
  assert.equal(b.length, 28);
  assert.ok(b.every((x) => x >= 0.25 && x <= 1));
  assert.deepEqual(b, barrasOnda(7));
  assert.notDeepEqual(b, barrasOnda(8));
  assert.equal(barrasOnda(7, 0).length, 0);
  assert.equal(duracionEnPalabras(46 * 60), "46 min");
  assert.equal(duracionEnPalabras(3720), "1 h 2 min");
  assert.equal(duracionEnPalabras(3600), "1 h");
  assert.equal(duracionEnPalabras(20), "1 min");
  assert.equal(duracionEnPalabras(undefined), "");
  assert.equal(duracionEnPalabras(-5), "");
});

test("parrafosDe, inicialDe y numeroDePaso (secciones)", () => {
  assert.deepEqual(parrafosDe("Uno.\n\nDos,\nsigue.\n\n\n  Tres.  "), ["Uno.", "Dos,\nsigue.", "Tres."]);
  assert.deepEqual(parrafosDe(""), []);
  assert.deepEqual(parrafosDe(undefined as unknown as string), []);
  assert.equal(inicialDe("  camila soto"), "C");
  assert.equal(inicialDe("Álvaro"), "Á");
  assert.equal(inicialDe(""), "");
  assert.equal(numeroDePaso(0), "01");
  assert.equal(numeroDePaso(11), "12");
});

test("descifrar con tope de tiempo (para el aviso, que es corto)", () => {
  const letras = Array.from("Hoy cerramos a las 18:00 por inventario, gracias por entender");
  const n = letras.filter((l) => l.trim()).length;
  assert.equal(duracionDescifrar(n), 1200, "sin tope, como siempre");
  assert.equal(duracionDescifrar(n, 800), 800);
  assert.deepEqual(cuadroDescifrar(letras, 800, 5, 800), letras, "con tope de 800 ms, a los 800 ya está el texto");
  assert.notDeepEqual(cuadroDescifrar(letras, 800, 5), letras, "sin tope todavía no");
});

test("ritmoCinta y envolver (cinta)", () => {
  assert.equal(ritmoCinta(0), 1);
  assert.equal(ritmoCinta(600), 2);
  assert.equal(ritmoCinta(-1200), -1);
  assert.equal(ritmoCinta(99999), 4);
  assert.equal(ritmoCinta(-99999), -3);
  assert.equal(ritmoCinta(NaN), 1);
  assert.equal(envolver(250, 200), 50);
  assert.equal(envolver(-30, 200), 170);
  assert.equal(envolver(200, 200), 0);
  assert.equal(envolver(10, 0), 0);
});

test("el llamado con vida tiene sus seis escenas", () => {
  assert.deepEqual(Object.keys(ESCENAS_LLAMADO).sort(), ["agenda", "buzon", "contacto", "cotizaciones", "encuestas", "pedidos"]);
});

// --- Lo que encontró la revisión final (24-11-2026) ---
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { esEnlaceSeguro } from "../src/momentos/calculos";
import { copiasCinta } from "../src/momentos/calculos-2";
import { grafemas } from "../src/utils/grafemas";
import { CSS_ENLACES } from "../src/momentos/EnlacesDomino";
import { CSS_NOVEDADES } from "../src/momentos/NovedadesQueLlegan";
import { CSS_CINTA } from "../src/momentos/CintaConImpulso";
import { CSS_LLAMADO } from "../src/momentos/LlamadoConVida";

test("esEnlaceSeguro no se deja engañar por un javascript: disfrazado", () => {
  // El navegador quita saltos y tabuladores de cualquier parte, y espacios y controles del comienzo.
  for (const malo of ["java\nscript:alert(1)", "\u0001javascript:alert(1)", " \tjavascript:alert(1)", "jav\tascript:alert(1)", "JAVA\rSCRIPT:alert(1)", "\u0000data:text/html,x", "\\\\evil.com", "/\\evil.com", "\n//evil.com"]) {
    assert.equal(esEnlaceSeguro(malo), false, JSON.stringify(malo));
  }
  for (const ok of ["https://a.cl", " https://a.cl ", "#momentos", "/precios/1", "precios/1?x=1", "mailto:hola@a.cl", "tel:+56912345678"]) assert.equal(esEnlaceSeguro(ok), true, ok);
  assert.equal(esEnlaceSeguro(undefined as unknown as string), false);
});

test("fechaLarga: una fecha sin hora es ese día, sin correrse por la zona", () => {
  assert.equal(fechaLarga("2026-11-20", "America/Santiago"), "20 de noviembre");
  assert.equal(fechaLarga("2026-01-01", "America/Santiago"), "1 de enero");
  assert.equal(fechaLarga("2026-02-30", "America/Santiago"), "");
  // Con hora, vale la zona del negocio: las 02:00 UTC son todavía el día anterior en Chile.
  assert.equal(fechaLarga("2026-11-20T02:00:00Z", "America/Santiago"), "19 de noviembre");
});

test("grafemas: una bandera, un corazón o una familia quedan enteros", () => {
  assert.deepEqual(grafemas("🇨🇱❤️a"), ["🇨🇱", "❤️", "a"]);
  assert.deepEqual(grafemas("ñandú"), ["ñ", "a", "n", "d", "ú"]);
  assert.equal(grafemas("👨‍👩‍👧").length, 1);
  assert.equal(grafemas("👍🏽").length, 1);
  assert.deepEqual(grafemas(""), []);
  assert.equal(grafemas("é").length, 1, "una letra con su tilde suelta es una sola");
});

test("copiasCinta: cada mitad cubre el ancho del bloque y una copia más", () => {
  assert.equal(copiasCinta(135, 1100), 10);
  assert.equal(copiasCinta(500, 360), 4);
  assert.equal(copiasCinta(0, 1000), 4);
  assert.equal(copiasCinta(NaN, 1000), 4);
  assert.equal(copiasCinta(120, NaN), 4);
  assert.equal(copiasCinta(1, 5000), 40, "con tope");
  for (const [copia, bloque] of [[135, 1100], [90, 1920], [300, 700]]) assert.ok(copiasCinta(copia, bloque) * copia >= bloque + copia);
});

/** Todos los archivos de código de `src/`. */
function fuentes(dir = "src"): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? fuentes(ruta) : /\.tsx?$/.test(n) ? [ruta] : [];
  });
}

test("ningún fotograma usa `scale` suelto con calc(): hace caer la pestaña en Chromium", () => {
  // Visto y aislado el 24-11-2026: `@keyframes x{to{scale:1 calc(var(--h)*.35)}}` cuelga la pestaña. Con
  // `transform:scale(…)`, o con `translate` y `rotate` sueltos, no pasa.
  const malos: string[] = [];
  for (const f of fuentes()) {
    const s = readFileSync(f, "utf8");
    for (const m of s.matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
      if (/(^|[{;\s])scale\s*:[^;}]*calc\(/.test(m[1])) malos.push(`${f}: ${m[0].slice(0, 60)}`);
    }
  }
  assert.deepEqual(malos, []);
});

test("al apuntar, enfocar o apretar, el enlace o la tarjeta se detiene de verdad (misma fuerza que la regla que anima)", () => {
  for (const [css, raiz, hijo] of [[CSS_ENLACES, ".mk-m-enlaces", ".mk-m-enlace"], [CSS_NOVEDADES, ".mk-m-novedades", ".mk-m-nov-tarjeta"]]) {
    const regla = `${raiz}[data-activo][data-nivel=completo] ${hijo}:is(:hover,:focus-visible,:active){animation-play-state:paused}`;
    assert.ok(css.includes(regla), `${hijo}: falta «${regla}»`);
    // Quitar la animación la haría partir de cero al sacar el cursor.
    assert.ok(!/:is\(:hover[^{]*\{animation:none/.test(css), `${hijo}: no se quita la animación`);
    // La regla que detiene va después de la que anima.
    assert.ok(css.indexOf(regla) > css.indexOf(`${raiz}[data-activo][data-nivel=completo] ${hijo}{animation:`), hijo);
  }
});

test("detalles de CSS de la revisión: dominó con perspectiva propia, cinta con respaldo de recorte y buzón abierto en reposo", () => {
  assert.ok(/@keyframes mk-m-domino\{from\{transform:perspective\(600px\) rotateX/.test(CSS_ENLACES), "el giro lleva su perspectiva");
  assert.ok(/\.mk-m-cinta\{overflow:hidden;overflow:clip/.test(CSS_CINTA), "overflow:hidden antes de clip (Safari antes de la 16)");
  // La tapa del sobre queda abierta sin depender de la animación (nivel liviano, quieto o movimiento reducido).
  assert.ok(/\.mk-ll-abre\{[^}]*transform:scaleY\(-1\)/.test(CSS_LLAMADO));
  assert.ok(/@keyframes mk-ll-abre\{from\{transform:none\}\}/.test(CSS_LLAMADO));
});
