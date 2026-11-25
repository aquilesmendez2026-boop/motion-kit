// Rastro: huellas que van apareciendo por el recorrido del hilo. Lo calculable, sin navegador.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FIGURA_IDS } from "../src/relatos/catalogo";
import { FORMAS_RASTRO, PASO_RASTRO, RADIO_RASTRO, formaDeRastro, trazarRastro, type Huella } from "../src/relatos/hilos/rastro";
import { HOLGURA, type BloqueMedido, type Caja, type Medidas } from "../src/relatos/hilos/trazar";

const caja = (izquierda: number, arriba: number, ancho: number, alto: number): Caja => ({ izquierda, arriba, ancho, alto });
const bloque = (c: Caja, cosas: Caja[], tarjetas: Caja[] = [], mas: Partial<BloqueMedido> = {}): BloqueMedido => ({ caja: c, cosas, tarjetas, fondo: "rgb(255, 255, 255)", texto: "rgb(20, 20, 20)", tira: false, ...mas });
/** La misma página de las pruebas del hilo: franjas pegadas, con su relleno. `relleno`: el de los lados (por defecto, 20). */
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
  return { ancho: 390, alto: 3000, vista: 800, arriba: 120, recorrido: 120 + 3000 - 800, bloques };
}
const con = (mas: Partial<Parameters<typeof trazarRastro>[1]> = {}) => ({ semilla: "vet-los-andes", acento: "#e4572e", ...mas });
/** A cuánto queda un punto de una caja (0 si está adentro). */
const lejos = (p: { x: number; y: number }, c: Caja) => Math.hypot(Math.max(c.izquierda - p.x, 0, p.x - (c.izquierda + c.ancho)), Math.max(c.arriba - p.y, 0, p.y - (c.arriba + c.alto)));
const cajasDe = (m: Medidas) => m.bloques.flatMap((b) => [...b.cosas, ...b.tarjetas]);

test("rastro: cada figura tiene su huella, y lo desconocido es una estrellita", () => {
  for (const figura of FIGURA_IDS) assert.ok(FORMAS_RASTRO[formaDeRastro(figura)], figura);
  assert.equal(formaDeRastro("huella"), "patita");
  assert.equal(formaDeRastro("taza"), "grano");
  assert.equal(formaDeRastro("tijera"), "puntada");
  for (const raro of ["dragon", "", null, undefined, 7]) assert.equal(formaDeRastro(raro), "estrella");
  // Cada forma es un dibujo relleno, chico (cabe en su radio) y sin números malos.
  for (const [nombre, d] of Object.entries(FORMAS_RASTRO)) {
    assert.ok(d.startsWith("M") && d.length < 420, `${nombre}: ${d.length} caracteres`);
    assert.ok(!/NaN|undefined/.test(d), nombre);
    const numeros = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    assert.ok(numeros.every((n) => Math.abs(n) <= RADIO_RASTRO + 2), `${nombre}: se sale de su caja`);
  }
});

test("rastro: las huellas van una tras otra por el recorrido, alternando el lado, y aparecen en orden", () => {
  const m = pagina();
  const { forma, huellas } = trazarRastro(m, con({ figura: "huella" }));
  assert.equal(forma, "patita");
  assert.ok(huellas.length > 60, `${huellas.length} huellas`);
  // Una cada PASO_RASTRO px, más o menos (en las curvas el paso recto es más corto).
  const pasos = huellas.slice(1).map((h, i) => Math.hypot(h.x - huellas[i].x, h.y - huellas[i].y));
  const seguidos = pasos.filter((p) => p < PASO_RASTRO * 2);
  assert.ok(seguidos.length > pasos.length * 0.8, "las huellas no van seguidas");
  assert.ok(seguidos.every((p) => p > PASO_RASTRO * 0.3), `hay huellas montadas (${Math.min(...seguidos).toFixed(1)} px)`);
  // Pie izquierdo, pie derecho.
  const alternan = huellas.slice(1).filter((h, i) => h.lado !== huellas[i].lado).length;
  assert.ok(alternan > huellas.length * 0.9, `alternan ${alternan} de ${huellas.length}`);
  // Aparecen en el orden en que se camina, de 0 a 100, y la última cuando se termina de bajar.
  for (let i = 1; i < huellas.length; i++) assert.ok(huellas[i].en >= huellas[i - 1].en, `la huella ${i} aparece antes que la anterior`);
  assert.ok(huellas.every((h) => h.en >= 0 && h.en <= 100));
  assert.ok(huellas[huellas.length - 1].en > 97);
  // Miran hacia donde van: bajando por la orilla apuntan hacia abajo (180°, con un poco de juego).
  const bajando = huellas.filter((h, i) => i > 0 && i < huellas.length - 1 && Math.abs(huellas[i + 1].x - huellas[i - 1].x) < 4 && huellas[i + 1].y > huellas[i - 1].y + 30);
  assert.ok(bajando.length > 10);
  for (const h of bajando) assert.ok(Math.abs((((h.giro % 360) + 360) % 360) - 180) < 25, `una huella que baja mira a ${h.giro.toFixed(0)}°`);
});

test("rastro: ninguna huella pisa el contenido; donde el lugar es poco, se achican o no van", () => {
  for (const relleno of [28, 20, 16, 12]) {
    for (const semilla of ["a", "vet-los-andes", "x9"]) {
      const m = pagina(relleno);
      const { huellas } = trazarRastro(m, con({ semilla }));
      const cajas = cajasDe(m);
      for (const h of huellas) {
        const radio = RADIO_RASTRO * h.tamano;
        for (const c of cajas) assert.ok(lejos(h, c) >= radio + HOLGURA - 0.01, `relleno ${relleno}/${semilla}: una huella de radio ${radio.toFixed(1)} queda a ${lejos(h, c).toFixed(1)} px del contenido`);
        assert.ok(h.x - radio >= -1e-9 && h.x + radio <= m.ancho + 1e-9 && h.y - radio >= -1e-9 && h.y + radio <= m.alto + 1e-9, `una huella se sale de la página: (${h.x.toFixed(2)}, ${h.y.toFixed(2)}) radio ${radio.toFixed(2)}`);
        assert.ok(h.tamano >= 0.45 && h.tamano <= 1);
      }
    }
  }
  // Con harto lugar van a tamaño completo; con poco, más chicas.
  const media = (hs: Huella[]) => hs.reduce((s, h) => s + h.tamano, 0) / hs.length;
  assert.ok(media(trazarRastro(pagina(28), con()).huellas) > media(trazarRastro(pagina(12), con()).huellas));
  // Frente a la foto de lado a lado no hay huellas: el rastro se pierde y sigue después.
  for (const h of trazarRastro(pagina(), con()).huellas) assert.ok(h.y < 1700 || h.y > 2100, `hay una huella sobre la foto, en y = ${h.y}`);
});

test("rastro: sobre un fondo donde el acento se pierde, las huellas toman el color del texto", () => {
  const m = pagina(20, (b) => {
    b[1].fondo = "rgb(228, 87, 46)";
    b[1].texto = "rgb(255, 255, 255)";
  });
  const { huellas } = trazarRastro(m, con());
  const enAcento = huellas.filter((h) => h.y > 640 && h.y < 960);
  assert.ok(enAcento.length > 5 && enAcento.every((h) => h.color === "rgb(255, 255, 255)"));
  assert.ok(huellas.filter((h) => h.y > 1100 && h.y < 1600).every((h) => h.color === undefined));
});

test("rastro: la misma semilla da el mismo rastro; otra, otro; y las medidas raras no lo botan", () => {
  const m = pagina();
  const a = JSON.stringify(trazarRastro(m, con()));
  assert.equal(JSON.stringify(trazarRastro(m, con())), a);
  assert.notEqual(JSON.stringify(trazarRastro(m, con({ semilla: "otra-vet" }))), a);
  assert.ok(!/NaN|Infinity/.test(a));
  for (const rara of [{ ...m, bloques: [] }, { ...m, ancho: NaN }, { ...m, recorrido: 0 }, { ...m, bloques: [null, 7] as never }]) {
    const r = trazarRastro(rara, con());
    assert.ok(Array.isArray(r.huellas) && r.huellas.every((h) => Number.isFinite(h.x) && Number.isFinite(h.y) && Number.isFinite(h.giro)));
  }
  assert.equal(trazarRastro({ ...m, bloques: [] }, con()).huellas.length, 0);
});
