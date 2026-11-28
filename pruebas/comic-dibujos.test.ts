// Los dibujos de cómic (motion-kit/comic): dónde queda la punta de la mano en cada dirección, la letra del estallido
// y los colores y la letra de cartel del tema.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PUNTA_MANO, letraEstallido } from "../src/comic/calculo";
import { CARTEL, fuenteCartel } from "../src/interfaz/tema";

const cerca = (a: number, b: number, d = 0.001) => assert.ok(Math.abs(a - b) <= d, `${a} no está cerca de ${b}`);

test("comic: la punta de la mano por dirección", () => {
  cerca(PUNTA_MANO.derecha.x, 0.973);
  cerca(PUNTA_MANO.derecha.y, 0.167);
  cerca(PUNTA_MANO.izquierda.x, 0.027);
  cerca(PUNTA_MANO.izquierda.y, 0.167);
  cerca(PUNTA_MANO.arriba.x, 0.417);
  cerca(PUNTA_MANO.arriba.y, -0.223);
  cerca(PUNTA_MANO.abajo.x, 0.583);
  cerca(PUNTA_MANO.abajo.y, 0.723);
});

test("comic: la letra del estallido se ajusta a la palabra más larga", () => {
  cerca(letraEstallido("¡Nuevo!", 120), 16.29, 0.01);
  cerca(letraEstallido("¡Publicada!", 130), 11.23, 0.01);
  assert.equal(letraEstallido("Hi", 300), 22);
  assert.equal(letraEstallido("¡30 días gratis!", 124), letraEstallido("gratis!", 124));
  assert.doesNotThrow(() => letraEstallido("", 100));
  assert.ok(Number.isFinite(letraEstallido("", 100)));
});

test("comic: tema", () => {
  assert.equal(fuenteCartel(), "var(--mk-fuente-cartel,'Arial Black','Helvetica Neue',sans-serif)");
  assert.equal(CARTEL, "var(--mk-cartel,#ffd23f)");
});
