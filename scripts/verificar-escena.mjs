// Revisa la capa Escena del editor de encabezados: alto, capas en profundidad, luz y medidor de peso.
// Uso: npm run dev (en otra terminal) y después `node scripts/verificar-escena.mjs [http://localhost:5173]`.
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:5173";
let fallas = 0;
const revisar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
const errores = [];
pagina.on("pageerror", (e) => errores.push(e.message));
await pagina.goto(base + "/#encabezados");
await pagina.waitForTimeout(2000);

const enc = pagina.locator(".enc-vista header.mk-enc").first();
// En una máquina de pruebas los cuadros por segundo son bajos y la escena pasaría a «liviano»: se fuerza todo.
await pagina.locator("[data-prueba=ahorro]").selectOption("nunca");
await pagina.locator("[data-prueba=comprimir]").uncheck();
const peso = pagina.locator("[data-prueba=peso]");
revisar((await peso.getAttribute("data-estado")) === "optimo", "sin fotos, el encabezado queda óptimo");

// Alto
await pagina.locator("[data-prueba=alto]").selectOption("numero");
await pagina.waitForTimeout(300);
revisar((await enc.getAttribute("data-alto")) === "numero", "alto a medida marca data-alto=numero");
revisar((await enc.evaluate((e) => e.style.getPropertyValue("--mk-enc-alto"))) === "70svh", "alto a medida parte en 70svh");
await pagina.locator("[data-prueba=alto-celular]").selectOption("compacto");
revisar((await enc.evaluate((e) => e.style.getPropertyValue("--mk-enc-alto-celular"))) === "44svh", "alto en celular compacto = 44svh");

// Capas y luz
await pagina.locator("[data-prueba=profundidad]").check();
await pagina.locator("[data-prueba=luz]").selectOption("puntero");
await pagina.waitForTimeout(300);
revisar((await pagina.locator(".enc-vista header.mk-enc .mk-plano").count()) === 3, "profundidad dibuja 3 planos");
revisar((await pagina.locator(".enc-vista header.mk-enc .mk-luz").count()) === 1, "luz dibujada");
const caja = await enc.boundingBox();
await pagina.mouse.move(caja.x + caja.width * 0.9, caja.y + caja.height * 0.2, { steps: 8 });
await pagina.waitForTimeout(900);
const cx = Number(await enc.evaluate((e) => e.style.getPropertyValue("--mk-cx")));
revisar(cx > 0.1, `el cursor mueve la escena (--mk-cx = ${cx})`);
const t = await pagina.locator(".enc-vista header.mk-enc .mk-plano").nth(2).evaluate((e) => getComputedStyle(e).translate);
revisar(t !== "none" && !t.startsWith("0px"), `el plano del frente se traslada (${t})`);

// Peso con una foto de ~700 KB elegida en el navegador
await pagina.locator("[data-prueba=composicion]").selectOption("dividido");
await pagina.locator("[data-prueba=foto]").setInputFiles({ name: "foto.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(700_000, 1) });
await pagina.waitForTimeout(1500);
const bytes = Number(await peso.getAttribute("data-bytes"));
revisar(bytes >= 700_000, `el medidor cuenta la foto (${bytes} bytes)`);
revisar((await peso.getAttribute("data-estado")) === "aceptable", "en escritorio, 700 KB queda sobre lo óptimo");
await pagina.getByLabel("Ver como celular").check();
await pagina.waitForTimeout(1200);
revisar((await peso.getAttribute("data-estado")) === "excedido", "en celular, 700 KB pasa del máximo");

// Movimiento reducido
const reducida = await navegador.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: "reduce" });
await reducida.goto(base + "/#encabezados");
await reducida.waitForTimeout(1500);
await reducida.locator("[data-prueba=profundidad]").check();
const enc2 = reducida.locator(".enc-vista header.mk-enc").first();
const c2 = await enc2.boundingBox();
await reducida.mouse.move(c2.x + c2.width * 0.9, c2.y + 50, { steps: 5 });
await reducida.waitForTimeout(600);
revisar((await enc2.evaluate((e) => e.style.getPropertyValue("--mk-cx"))) === "", "con movimiento reducido la escena no se mueve");

// Punto 1: compresión de fotos y ahorro de datos
await pagina.getByLabel("Ver como celular").uncheck();
await pagina.locator("[data-prueba=comprimir]").check();
const png = await pagina.evaluate(async () => {
  const c = document.createElement("canvas");
  c.width = 1800; c.height = 1200;
  const x = c.getContext("2d");
  for (let i = 0; i < 4000; i++) { x.fillStyle = `hsl(${i * 37 % 360} 70% ${30 + (i % 40)}%)`; x.fillRect((i * 97) % 1800, (i * 53) % 1200, 40, 40); }
  const img = x.getImageData(0, 0, 1800, 1200);
  for (let i = 0; i < img.data.length; i += 4) img.data[i] ^= (i * 2654435761) & 31;
  x.putImageData(img, 0, 0);
  const b = await new Promise((ok) => c.toBlob(ok, "image/png"));
  return Array.from(new Uint8Array(await b.arrayBuffer()));
});
await pagina.locator("[data-prueba=foto]").setInputFiles({ name: "grande.png", mimeType: "image/png", buffer: Buffer.from(png) });
await pagina.waitForFunction(() => /KB →/.test(document.querySelector("[data-prueba=info-foto]")?.textContent ?? ""), null, { timeout: 60000 });
const info = await pagina.locator("[data-prueba=info-foto]").innerText();
const despues = Number(info.match(/→ (\d+) KB/)?.[1]);
const antes = Number(info.match(/(\d+) KB →/)?.[1]);
revisar(antes > 200 && despues > 0 && despues <= 200, `la foto se comprime bajo 200 KB (${info})`);
await pagina.locator("[data-prueba=ahorro]").selectOption("siempre");
await pagina.waitForTimeout(500);
revisar((await enc.getAttribute("data-nivel")) === "quieto", "con ahorro de datos el encabezado queda quieto");
await pagina.locator("[data-prueba=ahorro]").selectOption("nunca");

// Punto 2: shader, objeto 3D y salida
await pagina.locator("[data-prueba=shader]").selectOption("aurora");
await pagina.waitForTimeout(2000);
const sh = await pagina.locator(".enc-vista header.mk-enc .mk-shader").first().evaluate((e) => ({ listo: e.hasAttribute("data-listo"), sin: e.hasAttribute("data-sin-webgl") }));
revisar(sh.listo || sh.sin, `el shader dibuja (o cae al degradado sin WebGL): ${JSON.stringify(sh)}`);
await pagina.locator("[data-prueba=objeto]").selectOption("lata");
await pagina.waitForTimeout(500);
revisar((await pagina.locator(".enc-vista header.mk-enc .mk-obj-tira").count()) === 20, "la lata 3D tiene 20 caras");
await pagina.locator("[data-prueba=salida]").selectOption("achicar");
await pagina.waitForTimeout(300);
const anim = await pagina.locator(".enc-vista header.mk-enc > .mk-enc-in").first().evaluate((e) => (CSS.supports("animation-timeline: view()") ? getComputedStyle(e).animationName : "sin soporte"));
revisar(anim === "mk-sal-achicar" || anim === "sin soporte", `salida al bajar: ${anim}`);

// Punto 3: medidores
revisar(Number(await pagina.locator("[data-prueba=fluidez]").getAttribute("data-fps")) > 0, "el medidor de fluidez mide cuadros por segundo");
revisar((await pagina.locator("[data-prueba=contraste]").getAttribute("data-estado")) !== null, "el semáforo de contraste responde");

// Punto 4: rubro con semilla y QR a la vista del teléfono
await pagina.locator("[data-prueba=rubro]").selectOption("barberia");
await pagina.locator("[data-prueba=por-rubro]").click();
await pagina.waitForTimeout(1200);
revisar(/Semilla \d+/.test(await pagina.locator("[data-prueba=semilla]").innerText()), "sorpréndeme por rubro deja la semilla");
revisar((await pagina.locator("[data-prueba=qr] path").getAttribute("d")).length > 100, "el QR se dibuja");
const enlace = await pagina.locator("[data-prueba=enlace-vista]").getAttribute("href");
const titulo = await pagina.locator(".enc-vista header.mk-enc .mk-enc-titulo").first().innerText();
const tel = await navegador.newPage({ viewport: { width: 390, height: 844 } });
tel.on("pageerror", (e) => errores.push("vista: " + e.message));
await tel.goto(base + "/" + enlace.slice(enlace.indexOf("#")));
await tel.waitForTimeout(2000);
revisar((await tel.locator(".mk-enc-titulo").first().innerText()) === titulo, "la vista del teléfono muestra el mismo encabezado");

revisar(errores.length === 0, `sin errores en la página${errores.length ? ": " + errores.join(" | ") : ""}`);
await navegador.close();
console.log(fallas ? `\n${fallas} revisión(es) fallaron` : "\nTodo bien");
process.exit(fallas ? 1 : 0);
