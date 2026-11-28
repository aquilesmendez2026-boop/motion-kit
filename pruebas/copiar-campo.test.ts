// Copiar: usa el portapapeles; si no puede, el textarea escondido; si nada funciona, avisa que no se pudo (sin lanzar).
import { test } from "node:test";
import assert from "node:assert/strict";
import { copiarTexto } from "../src/interfaz/portapapeles";

/** Un documento falso: un textarea que se puede seleccionar y un execCommand que responde lo que se le pida. */
function documentoFalso(copia: boolean) {
  const copiados: string[] = [];
  let valor = "";
  const ta = { value: "", style: {} as Record<string, string>, setAttribute() {}, select() { valor = this.value; }, remove() {} };
  return {
    copiados,
    doc: {
      createElement: () => ta,
      body: { appendChild() {} },
      execCommand: (c: string) => {
        if (c === "copy" && copia) copiados.push(valor);
        return copia;
      },
    } as unknown as Document,
  };
}

test("copiar: usa el portapapeles", async () => {
  let recibido = "";
  const nav = { clipboard: { writeText: async (t: string) => { recibido = t; } } } as unknown as Pick<Navigator, "clipboard">;
  assert.equal(await copiarTexto("https://lamente.cl/cami", nav), true);
  assert.equal(recibido, "https://lamente.cl/cami");
});

test("copiar: si falla, prueba el textarea", async () => {
  const nav = { clipboard: { writeText: async () => { throw new Error("bloqueado"); } } } as unknown as Pick<Navigator, "clipboard">;
  const { doc, copiados } = documentoFalso(true);
  assert.equal(await copiarTexto("hola", nav, doc), true);
  assert.deepEqual(copiados, ["hola"]);
});

test("copiar: sin nada, no se pudo (sin lanzar)", async () => {
  const { doc } = documentoFalso(false);
  assert.equal(await copiarTexto("hola", undefined, doc), false);
  assert.equal(await copiarTexto("hola", undefined, undefined), false);
});
