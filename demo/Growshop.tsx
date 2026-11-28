// La página de muestra de un growshop (#growshop): Raíz Growshop, Ñuñoa, armada solo con motion-kit. Los datos vienen
// del front de La Mente (demo/growshop/datos.ts, 28-11; el front ya no la mantiene); la página se hizo de cero
// (docs/superpowers/specs/2026-11-28-pagina-growshop-design.md): un recorrido de tienda, un momento vivo distinto por
// bloque y teléfono primero. Su prueba es scripts/verificar-growshop.mjs.
import { type CSSProperties, type ReactNode } from "react";
import { Encabezado, EstiloLaMente, recetaAProps, validarReceta } from "../src";
import { PaginaRelato } from "../src/relatos/PaginaRelato";
import { Relato } from "../src/relatos/Relato";
import { PrecioQueRueda } from "../src/momentos/PrecioQueRueda";
import { CartaQueSeAbre } from "../src/momentos/CartaQueSeAbre";
import { CuentaRegresiva } from "../src/momentos/CuentaRegresiva";
import { MosaicoQueSeArma } from "../src/momentos/MosaicoQueSeArma";
import { ResenasPila } from "../src/momentos/ResenasPila";
import { MapaDibujado } from "../src/momentos/MapaDibujado";
import { SorteoRaspe } from "../src/momentos/perezosos";
// Como en el paquete: la segunda y la cuarta tanda se bajan aparte.
import { AvisoQueSeDespliega, CintaConImpulso, ClasesDeHoy, EnlacesDomino, FechasQueVienen, LlamadoConVida, NovedadesQueLlegan, SeccionesVivas } from "../src/momentos/perezosos-2";
import { CuponQueSeArranca, SellosConTimbre } from "../src/momentos/perezosos-4";
import type { SeccionViva } from "../src/momentos/SeccionesVivas";
import type { SesionDeClase } from "../src/momentos/ClasesDeHoy";
import { DATOS, MODULOS, RECETA } from "./growshop/datos";

const foto = (n: number) => new URL(`./growshop/fotos/cultivo${n}.svg`, import.meta.url).href;
const LOGO = new URL("./growshop/raiz.svg", import.meta.url).href;
/** Las imágenes de la receta y de los datos («raiz.svg», «/fotos/cultivo4.svg») a las de la demo. */
const urlImagen = (s: string) => {
  const n = /cultivo(\d)\.svg$/.exec(s);
  return n ? foto(Number(n[1])) : s.endsWith("raiz.svg") ? LOGO : s;
};

const receta = validarReceta(RECETA);

/** Los colores propios del growshop (verde bosque con dorado, de su diseño), sobre la paleta «bosque». */
const c = DATOS.pagina.diseno.colores;
const COLORES = {
  "--mk-fondo": c.fondo, "--mk-superficie": c.superficie, "--mk-texto": c.texto, "--mk-suave": c.textoSuave,
  "--mk-borde": c.borde, "--mk-acento": c.acento, "--mk-acento-2": c.acento, "--mk-sobre-acento": c.sobreAcento,
} as CSSProperties;

/** Lo más pedido: tres productos con su precio que rueda. */
const DESTACADOS = [
  { nombre: "Sustrato de la casa 50 L", detalle: "Turba, perlita y humus de lombriz", precio: 18990, foto: 2 },
  { nombre: "Panel LED 240 W", detalle: "Espectro completo, 30 % menos consumo", precio: 129990, foto: 4 },
  { nombre: "Kit de riego por goteo", detalle: "Para 12 macetas, con temporizador", precio: 24990, foto: 6 },
];

/** Una sección de la página: su relato, su título y su momento. */
function Bloque({ id, titulo, bajada, superficie, children }: { id: string; titulo?: string; bajada?: string; superficie?: boolean; children: ReactNode }) {
  return (
    <Relato id={id} className="gs-blq" data-bloque={id} data-superficie={superficie || undefined}>
      <div className="gs-dentro">
        {titulo && <h2 data-mk-parte="titulo">{titulo}</h2>}
        {bajada && <p className="gs-bajada" data-mk-parte="linea">{bajada}</p>}
        {children}
      </div>
    </Relato>
  );
}

export function Growshop() {
  const p = DATOS.pagina;
  const m = MODULOS;
  return (
    <div className="gs-pagina">
      <style>{CSS}</style>
      <EstiloLaMente tema="retro" paleta="bosque" base="retro" fuentes style={COLORES}>
        <PaginaRelato relato="escenas" relatoPagina="enredadera" estela figura="bolsa" semilla="raiz-growshop">
          <div className="gs-aviso">
            <AvisoQueSeDespliega texto={m.avisos.aviso.texto} tono="celebracion" />
          </div>
          {receta.ok && <Encabezado {...recetaAProps(receta.receta, { urlImagen })} />}

          <Relato className="gs-cinta" data-bloque="cinta">
            <CintaConImpulso lema={p.lema} />
          </Relato>

          {/* 1. Lo que viene a buscar: lo más pedido y la promo del sábado. */}
          <Bloque id="destacados" titulo="Lo más pedido" bajada="Lo que más se llevan esta semana.">
            <div className="gs-destacados">
              {DESTACADOS.map((d) => (
                <article key={d.nombre} className="gs-producto" data-mk-parte="tarjeta">
                  <img src={foto(d.foto)} alt="" width={320} height={200} />
                  <h3>{d.nombre}</h3>
                  <p>{d.detalle}</p>
                  <strong className="gs-precio">
                    <PrecioQueRueda valor={d.precio} />
                  </strong>
                </article>
              ))}
            </div>
            <div className="gs-cupon">
              <CuponQueSeArranca titulo="20 % en sustratos" detalle="Este sábado, en la tienda o en línea" codigo="RAIZ20" />
            </div>
          </Bloque>

          {/* 2. El catálogo completo. */}
          <Bloque id="precios" titulo="Catálogo" bajada="Cuatro listas, con precios al día." superficie>
            <CartaQueSeAbre listas={m.precios.listas.map((l) => ({ titulo: l.titulo, href: `#lista-${l.listaId}` }))} destacada={1} />
          </Bloque>

          {/* 3. Comprar y volver: pedir, juntar sellos, asesorarse. */}
          <Bloque id="pedidos" titulo="Pide en línea" bajada="Despacho en el día en Ñuñoa, Providencia y Macul.">
            <div className="gs-llamado">
              <LlamadoConVida escena="pedidos" abierto />
              <a className="gs-boton" href="#pedidos">Hacer un pedido</a>
            </div>
          </Bloque>

          <Bloque id="sellos" titulo="Tu tarjeta de sellos" bajada={`Junta ${m.sellos.sellosPremio} y te llevas ${m.sellos.premio}.`} superficie>
            <SellosConTimbre total={m.sellos.sellosPremio} llenos={7} nuevos={1} premio={m.sellos.premio} semilla="raiz-growshop" />
          </Bloque>

          <Bloque id="agenda" titulo={m.agenda.calendarios[0].nombre} bajada={m.agenda.calendarios[0].descripcion}>
            <div className="gs-llamado">
              <LlamadoConVida escena="agenda" abierto />
              <a className="gs-boton" href="#agenda">Reservar hora</a>
            </div>
          </Bloque>

          {/* 4. Aprender y juntarse: clases, la feria, el calendario. */}
          <Bloque id="clases" titulo="Talleres de esta semana" superficie>
            <ClasesDeHoy sesiones={m.clases.sesiones.map((s) => ({ ...s, espera: s.espera as SesionDeClase["espera"] }))} />
          </Bloque>

          <Bloque id="eventos" titulo={m.eventos.proximos[0].titulo} bajada="Semillas, plantas y esquejes de la comunidad. Entrada liberada.">
            <CuentaRegresiva titulo={m.eventos.proximos[0].titulo} fecha={m.eventos.proximos[0].fecha} hora={m.eventos.proximos[0].hora} />
          </Bloque>

          <Bloque id="calendario" titulo="Lo que viene" superficie>
            <FechasQueVienen fechas={m.calendario.proximas.map((f) => ({ ...f, tipo: f.tipo as "promocion" | "evento" | "cerrado" | "actividad" }))} />
          </Bloque>

          {/* 5. Lo que muestra la comunidad. */}
          <Bloque id="galeria" titulo={m.galeria.albumes[0].titulo} bajada={m.galeria.albumes[0].descripcion}>
            <MosaicoQueSeArma visor semilla="raiz-growshop" fotos={m.galeria.albumes[0].fotos.map((f) => ({ url: urlImagen(f.url), pie: "pie" in f ? f.pie : undefined }))} />
          </Bloque>

          <Bloque id="novedades" titulo="Novedades" superficie>
            <NovedadesQueLlegan
              entradas={m.novedades.entradas.map((e) => ({ titulo: e.titulo, resumen: e.resumen, foto: urlImagen(e.portadaUrl), publicada: e.publicada, href: "#novedades" }))}
            />
          </Bloque>

          <Bloque id="sorteos" titulo={m.sorteos.titulo} bajada="Raspa y mira si eres el ganador.">
            <SorteoRaspe titulo={m.sorteos.titulo} premio={m.sorteos.premio} semilla="raiz-growshop" />
          </Bloque>

          <Bloque id="resenas" titulo="Lo que dicen" superficie>
            <ResenasPila promedio={m.resenas.promedio} total={m.resenas.total} resenas={m.resenas.resenas.map((r) => ({ nombre: r.nombre, estrellas: r.estrellas, texto: r.texto }))} />
          </Bloque>

          {/* 6. Dudas, redes y cómo llegar. */}
          <Bloque id="secciones">
            <SeccionesVivas secciones={m.secciones.secciones as SeccionViva[]} />
          </Bloque>

          <Bloque id="enlaces" titulo="Síguenos" superficie>
            <EnlacesDomino enlaces={m.enlaces.enlaces.map((e) => ({ titulo: e.titulo, url: e.url, red: e.red }))} />
          </Bloque>

          <Bloque id="contacto" titulo="¿Dudas con tu cultivo?" bajada="Escríbenos: te respondemos en el día.">
            <div className="gs-llamado">
              <LlamadoConVida escena="contacto" abierto />
              <a className="gs-boton" href={`https://wa.me/${p.contacto.whatsapp.replace(/\D/g, "")}`}>Escribir por WhatsApp</a>
            </div>
          </Bloque>

          <Bloque id="ubicacion" titulo="Cómo llegar" bajada={`${p.direccion} · ${p.horario}`} superficie>
            <MapaDibujado direccion={p.direccion} semilla="raiz-growshop" abierto mapsUrl={`https://maps.google.com/?q=${encodeURIComponent(p.direccion)}`} />
          </Bloque>

          <footer className="gs-pie">
            <img src={LOGO} alt="" width={40} height={40} />
            <span>{DATOS.nombre} · {p.direccion}</span>
          </footer>
        </PaginaRelato>
      </EstiloLaMente>
    </div>
  );
}

// ——— Estilos de la página (solo de la demo): teléfono primero ———
const CSS = `
.gs-pagina{min-height:100vh;background:var(--mk-fondo);color:var(--mk-texto);overflow-x:clip}
.gs-pagina .mk-enc h1{max-width:none}
.gs-aviso{padding:10px 16px 0}
.gs-blq{padding:48px 16px}
.gs-blq[data-superficie]{background:var(--mk-superficie)}
.gs-dentro{max-width:1040px;margin:0 auto}
.gs-blq h2{font-family:var(--mk-fuente-titulo);font-size:clamp(28px,7vw,44px);line-height:1.05;margin:0 0 10px}
.gs-bajada{margin:0 0 24px;font-size:17px;line-height:1.5;color:color-mix(in srgb,var(--mk-texto) 82%,transparent);max-width:60ch}
.gs-cinta{padding:8px 0}
.gs-destacados{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.gs-producto{display:flex;flex-direction:column;gap:6px;padding:14px;border-radius:16px;background:var(--mk-superficie);border:1px solid color-mix(in srgb,var(--mk-texto) 14%,transparent)}
.gs-producto img{width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;border-radius:10px}
.gs-producto h3{margin:6px 0 0;font-size:18px}
.gs-producto p{margin:0;font-size:15px;color:color-mix(in srgb,var(--mk-texto) 75%,transparent)}
.gs-precio{margin-top:auto;font-size:24px;font-family:var(--mk-fuente-titulo)}
.gs-cupon{margin-top:24px;display:flex;justify-content:center}
.gs-llamado{display:grid;gap:16px;justify-items:center;text-align:center}
.gs-boton{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;border-radius:999px;background:var(--mk-acento);color:var(--mk-sobre-acento);font-weight:800;text-decoration:none}
.gs-boton:focus-visible{outline:3px solid var(--mk-texto);outline-offset:3px}
.gs-pie{display:flex;align-items:center;justify-content:center;gap:10px;padding:32px 16px 48px;font-size:14px;color:color-mix(in srgb,var(--mk-texto) 70%,transparent)}
@media (min-width:720px){.gs-blq{padding:72px 32px}.gs-aviso{padding:12px 32px 0}}
`;
