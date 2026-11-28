// Corre solo las pruebas visuales que tocan los archivos que cambiaron (y, donde la prueba tiene partes, solo esas).
// Uso (con `npm run dev` arriba):
//   node scripts/verificar-cambios.mjs [url] [--lista] [--todo] [--desde=<commit>]
//   --lista   solo dice qué correría, sin correr nada
//   --todo    la batería completa (antes de una etiqueta, o si cambió algo común a todo)
//   --desde   compara contra ese commit (por defecto: lo que hay sin commit, contra el último commit)
// Lo que no se prueba aquí: lo calculable (`npm test`), los tipos (`npm run typecheck`) y el paquete
// (`npm run build && npm run peso && npm run probar-paquete`).
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:/.test(a)) ?? "http://localhost:5173";
const soloLista = args.includes("--lista");
const desde = args.find((a) => a.startsWith("--desde="))?.slice(8);

/** Todas las pruebas visuales que existen. */
const TODAS = readdirSync("scripts")
  .map((f) => /^verificar-([a-z0-9]+)\.mjs$/.exec(f)?.[1])
  .filter((n) => n && n !== "cambios");
const TODO = "todo";
const MOMENTOS = ["momentos", "momentos2", "momentos3", "momentos4"];
const ENCABEZADO = ["encabezados", "pelicula", "lamente", "escena", "dedo", "fotos:encabezado", "fotos:profunda"];
const pieza2 = (archivo, parte) => [new RegExp(`^src/momentos/${archivo}`), [`momentos2:${parte}`]];

/**
 * Qué pruebas tocan qué archivos. La primera regla que calza decide. «prueba:parte» corre solo esa parte. Un archivo
 * de `src/` o `demo/` que no calza con ninguna corre todo (más vale de más): si pasa seguido, se le suma su regla.
 */
const REGLAS = [
  // Momentos: con el dedo.
  [/^src\/momentos\/(CuponQueSeArranca|calculo-cupon)/, ["momentos4:cupon"]],
  [/^src\/momentos\/(StickerQueSeDespega|calculo-sticker)/, ["momentos4:sticker"]],
  [/^src\/momentos\/(SellosConTimbre|calculo-timbre)/, ["momentos4:sello"]],
  [/^src\/momentos\/(RuletaDePremios|calculo-ruleta)/, ["momentos4:ruleta"]],
  [/^src\/momentos\/(perezosos-4|calculos-4|al-acabar)/, ["momentos4"]],
  // Momentos: efectos vistosos.
  [/^src\/momentos\/(FuegosArtificiales|calculo-fuegos)/, ["momentos3:fuegos"]],
  [/^src\/momentos\/(CarruselGiratorio|calculo-carrusel)/, ["momentos3:carrusel", "luz:existe"]],
  [/^src\/momentos\/(LibroQueSeAbre|calculo-libro)/, ["momentos3:libro", "luz:existe"]],
  [/^src\/momentos\/(perezosos-3|calculos-3)/, ["momentos3"]],
  // Momentos: segunda tanda.
  pieza2("FechasQueVienen", "fechas"),
  pieza2("ClasesDeHoy", "clases"),
  pieza2("NovedadesQueLlegan", "novedades"),
  pieza2("EnlacesDomino", "enlaces"),
  pieza2("EpisodiosOnda", "episodios"),
  pieza2("SeccionesVivas", "secciones"),
  pieza2("AvisoQueSeDespliega", "aviso"),
  pieza2("CintaConImpulso", "cinta"),
  pieza2("(LlamadoConVida|escenas-llamado)", "llamado"),
  [/^src\/momentos\/(perezosos-2|calculos-2|reloj)/, ["momentos2"]],
  // Momentos: primera tanda y lo común.
  [/^src\/momentos\/(SorteoRaspe|Confeti)/, ["momentos", "momentos2:aviso", "momentos3:fuegos"]],
  [/^src\/momentos\/MosaicoQueSeArma/, ["momentos", "fotos:galeria", "fotos:visor"]],
  [/^src\/momentos\/(base|aparte|resorte|calculos|calculos-aparte)\./, MOMENTOS],
  [/^src\/momentos\//, ["momentos"]],
  [/^src\/entradas\/momentos/, MOMENTOS],
  [/^demo\/Momentos/, MOMENTOS],
  // Fotos.
  [/^src\/fotos\/(FotoProfunda|profunda|calculo-profunda)/, ["fotos:profunda"]],
  [/^src\/fotos\//, ["fotos"]],
  [/^demo\/(Profundidad|fotos\/)/, ["fotos:profunda"]],
  [/^demo\/Galeria/, ["fotos:galeria", "fotos:visor"]],
  // Luz y materia.
  [/^(src\/luz\/|src\/entradas\/luz|demo\/Luz)/, ["luz"]],
  // Director.
  [/^(src\/director\/|src\/partitura\/|src\/entradas\/(director|partitura)|demo\/Director)/, ["director"]],
  // Dedo y física.
  [/^src\/dedo\/resorte/, ["dedo", "momentos2:cinta", "momentos3:carrusel"]],
  [/^src\/dedo\/calculo-impulso/, ["dedo:impulso", "momentos2:cinta"]],
  [/^src\/dedo\//, ["dedo"]],
  // Encabezado, receta, escena y efectos de fondo.
  // El encabezado también va dentro de una partitura (sus partes marcadas y `sinEntrada`).
  [/^(src\/encabezados\/|src\/entradas\/encabezado)/, [...ENCABEZADO, "director:encabezado"]],
  [/^(src\/receta\/|src\/entradas\/receta)/, ["encabezados", "pelicula", "lamente"]],
  [/^src\/escena\/nivel/, [...ENCABEZADO, ...MOMENTOS, "relatos"]],
  [/^(src\/escena\/|src\/entradas\/escena)/, ["escena", "encabezados", "pelicula"]],
  [/^src\/efectos\/fondos\//, ["efectos", "dedo:fondos", "dedo:constelacion"]],
  [/^src\/efectos\/caida\//, ["efectos", "dedo:caida"]],
  [/^src\/efectos\//, ["efectos", "encabezados", "dedo"]],
  [/^demo\/(Encabezados|Vista|compartir)/, [...ENCABEZADO, "estilos"]],
  // Página, relatos, biblioteca, piezas y plantillas.
  // Los hilos y las ramas: su trazado, su pieza y su vitrina (las ramas se prueban en verificar-hilos). Lo demás de la
  // página (que los carga) corre también la prueba de hilos.
  [/^(src\/relatos\/(hilos|ramas|esfera)\/|demo\/Hilos)/, ["hilos"]],
  [/^(src\/relatos\/|src\/entradas\/pagina|demo\/(Pagina|Relatos))/, ["relatos", "hilos", "dedo:impulso", "dedo:estela", "dedo:pila"]],
  [/^(src\/biblioteca\/|demo\/Biblioteca)/, ["biblioteca"]],
  // Los botones y las tarjetas cambian de sombra dentro de una luz, y los paquetes de botones van en el encabezado.
  [/^src\/piezas\/(Boton|Tarjeta)/, ["piezas", "luz:existe", "encabezados"]],
  // El cómic del panel (motion-kit/comic) y su vitrina.
  [/^(src\/comic\/|src\/entradas\/comic|demo\/Comic)/, ["comic", "panel:vivo"]],
  // La página de muestra del growshop: usa encabezados, relatos, momentos y estilos.
  [/^(demo\/Growshop|demo\/growshop\/|src\/(encabezados|relatos|momentos|estilos|receta)\/)/, ["growshop"]],
  // Las piezas del panel (motion-kit/interfaz) y las que toman sus colores: la vitrina #panel y la de piezas.
  [/^(src\/interfaz\/|src\/entradas\/interfaz|src\/components\/(Toast|BottomSheet|TabBar|Skeleton)|demo\/Panel)/, ["panel", "piezas"]],
  // motion-kit/interfaz solo reexporta piezas de interfaz (su peso y lo que arrastra lo revisan npm test y probar-paquete).
  [/^(src\/(piezas|components)\/|src\/entradas\/interfaz|demo\/Piezas)/, ["piezas"]],
  [/^(src\/plantillas\/|demo\/(Estudio|Plantilla|plantillas\/))/, ["estilos", "biblioteca"]],
  // Cada prueba, si cambia ella misma.
  [/^scripts\/verificar-([a-z0-9]+)\.mjs$/, (m) => (m[1] === "cambios" ? [] : [m[1]])],
  // Común a todo.
  // El título que se mueve solo lo usan el encabezado y las plantillas (y la vitrina del Director, que lo compara).
  [/^src\/estilos\/TextoCinetico/, [...ENCABEZADO, "director", "estilos", "biblioteca"]],
  // El contexto del estilo lo leen Estilo y lo que va dentro de un estilo (encabezados, plantillas de la biblioteca).
  [/^src\/estilos\/contexto\.ts$/, ["estilos", "encabezados", "biblioteca"]],
  [/^src\/(estilos|utils|hooks)\//, [TODO]],
  // El índice solo reexporta: si una exportación se rompe, lo atrapan `npm run typecheck` y la pasada rápida (que abre
  // todas las vitrinas). Antes pedía todo y, como cambia en casi cada etiqueta, la batería completa salía siempre (26-11).
  [/^src\/index\.ts$/, ["piezas"]],
  // El armazón de la vitrina (rutas, portada, su CSS): casi siempre se le suma algo. Si se rompe, no carga ninguna
  // página, y eso lo nota cualquier prueba: bastan tres cortas, que pasan por varias rutas.
  [/^demo\/(main|App)\.tsx$|^demo\/demo\.css$|^index\.html$/, ["estilos", "efectos", "piezas"]],
];

function cambiados() {
  const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).split("\n").filter(Boolean);
  if (desde) return git("diff", "--name-only", desde);
  return [...new Set([...git("diff", "--name-only", "HEAD"), ...git("ls-files", "--others", "--exclude-standard")])];
}

/** De los archivos cambiados, qué correr: { prueba → partes (o null si va entera) } y por qué. */
function elegir(archivos) {
  const plan = new Map();
  const porque = [];
  const sumar = (item, archivo) => {
    const [prueba, parte] = item.split(":");
    if (!TODAS.includes(prueba)) return;
    porque.push(`${item} ← ${archivo}`);
    if (!parte) plan.set(prueba, null);
    else if (plan.get(prueba) !== null) plan.set(prueba, new Set([...(plan.get(prueba) ?? []), parte]));
  };
  for (const archivo of archivos) {
    // Los guiones temporales y lo que no es código del navegador no tienen prueba visual.
    if (/(^|\/)\.[^/]+$/.test(archivo) || !/^(src|demo|scripts)\/|^index\.html$/.test(archivo)) continue;
    const regla = REGLAS.find(([patron]) => patron.test(archivo));
    const que = !regla ? (/^(src|demo)\//.test(archivo) ? [TODO] : []) : typeof regla[1] === "function" ? regla[1](regla[0].exec(archivo)) : regla[1];
    if (que.includes(TODO)) {
      porque.push(`todo ← ${archivo}${regla ? "" : " (sin regla propia: se corre todo)"}`);
      for (const t of TODAS) plan.set(t, null);
    } else for (const item of que) sumar(item, archivo);
  }
  return { plan, porque };
}

const archivos = args.includes("--todo") ? [] : cambiados();
const { plan, porque } = args.includes("--todo") ? { plan: new Map(TODAS.map((t) => [t, null])), porque: ["todo ← --todo"] } : elegir(archivos);
/** Una corrida por prueba entera, o una por parte. */
const corridas = [...plan].flatMap(([prueba, partes]) => (partes ? [...partes].map((p) => ({ prueba, parte: p })) : [{ prueba, parte: null }]));

if (!corridas.length) {
  console.log(`Nada que probar en el navegador: ${archivos.length} archivo(s) con cambios, ninguno toca una prueba visual.`);
  process.exit(0);
}
console.log(`Pruebas que tocan estos cambios (${corridas.length} de ${TODAS.length} pruebas con sus partes):`);
for (const c of corridas) console.log(`  ${c.prueba}${c.parte ? ` · ${c.parte}` : ""}`);
if (soloLista || args.includes("--porque")) for (const p of [...new Set(porque)]) console.log(`    ${p}`);
if (soloLista) process.exit(0);

const salidas = join(tmpdir(), `mk-verificar-${Date.now()}`);
mkdirSync(salidas, { recursive: true });
/** En Mac, `caffeinate` evita que el computador se duerma a media prueba (las esperas vencerían por reloj). */
const conCafeina = existsSync("/usr/bin/caffeinate");
const correr = ({ prueba, parte }) =>
  new Promise((listo) => {
    const orden = ["node", `scripts/verificar-${prueba}.mjs`, url, ...(parte ? [parte] : [])];
    const hijo = conCafeina ? spawn("/usr/bin/caffeinate", ["-i", ...orden]) : spawn(orden[0], orden.slice(1));
    let texto = "";
    hijo.stdout.on("data", (d) => (texto += d));
    hijo.stderr.on("data", (d) => (texto += d));
    hijo.on("close", (codigo) => listo({ codigo, texto }));
  });

const inicio = Date.now();
let fallaron = 0;
// De a una: dos a la vez cargan el computador y aparecen fallas falsas.
for (const c of corridas) {
  const t0 = Date.now();
  const nombre = `${c.prueba}${c.parte ? `-${c.parte}` : ""}`;
  const { codigo, texto } = await correr(c);
  writeFileSync(join(salidas, `${nombre}.txt`), texto);
  const lineas = texto.split("\n");
  const bien = lineas.filter((l) => /^(✓|ok\b)/.test(l)).length;
  const mal = lineas.filter((l) => /^(✗|FALLA|no\b)/.test(l));
  const paso = codigo === 0 && !mal.length;
  if (!paso) fallaron++;
  console.log(`${paso ? "✓" : "✗"} ${nombre.padEnd(24)} ${String(bien).padStart(3)} bien, ${mal.length} fallas, ${Math.round((Date.now() - t0) / 1000)} s`);
  for (const l of mal) console.log(`    ${l.slice(0, 300)}`);
  if (codigo !== 0 && !mal.length) console.log(`    terminó con código ${codigo}: ${lineas.filter(Boolean).slice(-2).join(" | ").slice(0, 300)}`);
}
const total = Math.round((Date.now() - inicio) / 1000);
console.log(`\n${fallaron ? `${fallaron} prueba(s) con fallas` : "Todo bien"} en ${Math.floor(total / 60)} min ${total % 60} s. Salidas completas: ${salidas}`);
process.exit(fallaron ? 1 : 0);
