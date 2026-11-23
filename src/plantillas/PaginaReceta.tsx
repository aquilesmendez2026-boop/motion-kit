import type { CSSProperties } from "react";
import { useStyles } from "../utils/styles";
import { Estilo, type EstiloProps } from "../estilos/Estilo";
import { ESTILOS } from "../estilos/estilos";
import { TextoCinetico } from "../estilos/TextoCinetico";
import { AlScroll, GaleriaHorizontal } from "../estilos/AlScroll";
import { Boton } from "../piezas/Boton";
import { Tarjeta, TarjetaCuerpo } from "../piezas/Tarjeta";
import { Movimiento } from "../piezas/Movimiento";
import { imagenGenerada } from "./imagenes";
import { Encabezado } from "../encabezados/Encabezado";
import type { Item, Receta, Seccion } from "./receta";

const CSS = `
.mk-pag{min-height:100vh;overflow-x:clip}
.mk-pag-main{overflow:visible!important}
.mk-pag-nav{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:1rem;padding:.6rem clamp(1rem,4vw,2.5rem);background:color-mix(in srgb,var(--mk-fondo) 82%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.mk-pag-nav strong{font-family:var(--mk-fuente-titulo);font-size:1rem;margin-right:auto}
.mk-pag-nav a{color:inherit;text-decoration:none;font-size:.9rem;opacity:.85;padding:.7rem .2rem}
.mk-pag-nav a:hover{opacity:1}
@media (max-width:560px){.mk-pag-nav nav{display:none}}
.mk-pag-sec{position:relative;padding:clamp(3.5rem,9vw,6.5rem) clamp(1rem,5vw,3rem);max-width:1180px;margin:0 auto}
.mk-pag-sec>h2{font-size:clamp(1.7rem,5vw,3rem);margin:0 0 1.8rem}
.mk-pag-portada{position:relative;min-height:92vh;min-height:92svh;display:grid;align-items:center;padding:clamp(5rem,12vw,8rem) clamp(1rem,5vw,3rem) 4rem;overflow:hidden}
.mk-pag-portada-in{position:relative;z-index:1;max-width:820px}
.mk-pag-portada h1{font-size:clamp(2.4rem,8.5vw,5.6rem);margin:0 0 1.2rem}
.mk-pag-portada p{font-size:clamp(1.05rem,2.6vw,1.3rem);max-width:36em;opacity:.9;margin:0 0 2rem}
.mk-pag-portada p,.mk-pag-lema{text-shadow:0 0 4px var(--mk-fondo),0 0 16px var(--mk-fondo)}
.mk-pag-portada .mk-btn[data-variante=fantasma]{background:color-mix(in srgb,var(--mk-fondo) 72%,transparent)}
.mk-pag-lema{display:inline-block;margin-bottom:1rem;font-size:.85rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mk-acento)}
.mk-pag-botones{display:flex;flex-wrap:wrap;gap:.9rem}
.mk-pag-rejilla{display:grid;gap:1.6rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))}
.mk-pag-precio{font-weight:800;font-size:1.15rem;color:var(--mk-acento-texto,var(--mk-acento));margin-top:auto;padding-top:.6rem}
.mk-pag-gh-titulo{padding:0 clamp(1rem,5vw,3rem);margin:0 0 1.4rem;font-size:clamp(1.7rem,5vw,3rem)}
.mk-pag-gh-item{width:min(78vw,360px)}
.mk-pag-historia{display:grid;gap:2.5rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));align-items:center}
.mk-pag-historia p{font-size:1.1rem;line-height:1.65;margin:0 0 1rem;opacity:.9}
.mk-pag-cifras{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;text-align:center}
.mk-pag-cifras b{display:block;font-family:var(--mk-fuente-titulo);font-size:clamp(1.4rem,4.4vw,2.6rem);color:var(--mk-acento-texto,var(--mk-acento));line-height:1.1}
.mk-pag-cifras span{font-size:.85rem;opacity:.8}
.mk-pag-cita{font-size:1.15rem;line-height:1.5;margin:0}
.mk-pag-autor{opacity:.75;font-size:.9rem;margin-top:.8rem}
.mk-pag-llamado{text-align:center;display:flex;flex-direction:column;align-items:center;gap:1.2rem}
.mk-pag-llamado h2{font-size:clamp(2rem,7vw,4rem);margin:0}
.mk-pag-llamado p{margin:0 0 .6rem;font-size:1.15rem;opacity:.9}
.mk-pag-contacto{display:grid;gap:1.2rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))}
.mk-pag-contacto dt{font-size:.8rem;text-transform:uppercase;letter-spacing:.12em;color:var(--mk-acento-texto,var(--mk-acento));margin-bottom:.3rem}
.mk-pag-contacto dd{margin:0;font-size:1.05rem}
.mk-pag-pie{padding:2rem clamp(1rem,5vw,3rem);text-align:center;font-size:.85rem;opacity:.7;border-top:1px solid color-mix(in srgb,var(--mk-texto) 15%,transparent)}
`;

export interface PaginaRecetaProps extends Omit<EstiloProps, "nombre" | "children"> {
  receta: Receta;
}

const imagenDe = (r: Receta, it: Item) => it.imagen ?? imagenGenerada(r.estilo, it.tono);

/** Dibuja una página completa a partir de una receta (datos). */
export function PaginaReceta({ receta: r, className, ...estilo }: PaginaRecetaProps) {
  useStyles("pagina-receta", CSS);
  const def = ESTILOS[r.estilo];
  const boton = def.boton;
  const seccion = (s: Seccion, i: number) => {
    switch (s.tipo) {
      case "portada":
        return (
          <Encabezado
            key={i}
            composicion={s.composicion ?? "izquierda"}
            entrada={s.entrada ?? "cascada"}
            antetitulo={s.antetitulo ?? r.negocio.lema}
            titulo={s.titulo}
            bajada={s.bajada}
            boton={s.boton}
            botonSecundario={s.botonSecundario}
            pack={s.pack}
            efecto={r.efecto}
            variante={r.variante}
            efectoTexto={s.efectoTexto}
            datos={s.datos}
            imagenes={s.imagenes}
            alt={r.negocio.nombre}
          />
        );
      case "destacados":
        return (
          <section key={i} id={s.id} className="mk-pag-sec">
            <AlScroll animacion="subir"><h2>{s.titulo}</h2></AlScroll>
            <div className="mk-pag-rejilla">
              {s.items.map((it, k) => (
                <AlScroll key={k} animacion={k % 2 ? "escalar" : "subir"}>
                  <Tarjeta variante={def.tarjeta} efecto={["elevar", "zoom"]} imagen={imagenDe(r, it)} alt={it.titulo} style={{ height: "100%" }}>
                    <TarjetaCuerpo>
                      <h3>{it.titulo}</h3>
                      {it.texto && <p>{it.texto}</p>}
                      {it.precio && <div className="mk-pag-precio">{it.precio}</div>}
                    </TarjetaCuerpo>
                  </Tarjeta>
                </AlScroll>
              ))}
            </div>
          </section>
        );
      case "galeria":
        return (
          <GaleriaHorizontal key={i} id={s.id} largo={Math.max(1.6, s.items.length * 0.5)} titulo={<h2 className="mk-pag-gh-titulo">{s.titulo}</h2>}>
            {s.items.map((it, k) => (
              <Tarjeta key={k} className="mk-pag-gh-item" variante={def.tarjeta} efecto="zoom" imagen={imagenDe(r, it)} alt={it.titulo}>
                <TarjetaCuerpo><h3>{it.titulo}</h3></TarjetaCuerpo>
              </Tarjeta>
            ))}
          </GaleriaHorizontal>
        );
      case "historia":
        return (
          <section key={i} id={s.id} className="mk-pag-sec mk-pag-historia">
            <AlScroll animacion="desde-izquierda">
              <h2>{s.titulo}</h2>
              {s.parrafos.map((p, k) => <p key={k}>{p}</p>)}
            </AlScroll>
            {s.cifras && (
              <AlScroll animacion="desde-derecha" className="mk-pag-cifras">
                {s.cifras.map((c, k) => <div key={k}><b>{c.valor}</b><span>{c.texto}</span></div>)}
              </AlScroll>
            )}
          </section>
        );
      case "testimonios":
        return (
          <section key={i} id={s.id} className="mk-pag-sec">
            <AlScroll animacion="subir"><h2>{s.titulo}</h2></AlScroll>
            <div className="mk-pag-rejilla">
              {s.items.map((t, k) => (
                <AlScroll key={k} animacion={k % 2 ? "desde-derecha" : "desde-izquierda"}>
                  <Tarjeta variante={def.tarjeta} style={{ height: "100%" }}>
                    <TarjetaCuerpo>
                      <p className="mk-pag-cita">“{t.texto}”</p>
                      <div className="mk-pag-autor">— {t.autor}</div>
                    </TarjetaCuerpo>
                  </Tarjeta>
                </AlScroll>
              ))}
            </div>
          </section>
        );
      case "llamado":
        return (
          <section key={i} id={s.id} className="mk-pag-sec mk-pag-llamado">
            <TextoCinetico como="h2" texto={s.titulo} efecto={def.texto[1] ?? def.texto[0]} />
            <p>{s.texto}</p>
            <Boton href={s.boton.href} tamano="lg" variante="solido" efecto="latido" target={s.boton.href.startsWith("http") ? "_blank" : undefined}>{s.boton.texto}</Boton>
          </section>
        );
      case "contacto": {
        const n = r.negocio;
        const datos = [["Dirección", n.direccion], ["Horario", n.horario], ["Teléfono", n.telefono], ["Instagram", n.instagram]].filter(([, v]) => v);
        return (
          <section key={i} id={s.id} className="mk-pag-sec">
            <AlScroll animacion="aparecer"><h2>{s.titulo}</h2></AlScroll>
            <dl className="mk-pag-contacto">
              {datos.map(([k, v]) => (
                <AlScroll key={k} animacion="subir"><dt>{k}</dt><dd>{v}</dd></AlScroll>
              ))}
            </dl>
          </section>
        );
      }
    }
  };

  return (
    <Estilo nombre={r.estilo} colores={r.colores} className={`mk-pag${className ? " " + className : ""}`} {...estilo}>
      <div className="mk-pag-nav" style={{ "--mk-pag": 1 } as CSSProperties}>
        <strong>{r.negocio.nombre}</strong>
        {r.menu && (
          <nav aria-label="Secciones">
            {r.menu.map((m) => <a key={m.href} href={m.href}>{m.texto}</a>)}
          </nav>
        )}
        <Boton tamano="sm" variante={boton.variante} href={(r.secciones.find((s) => s.tipo === "llamado") as { id?: string } | undefined)?.id ? `#${(r.secciones.find((s) => s.tipo === "llamado") as { id?: string }).id}` : "#contacto"}>
          {(r.secciones.find((s) => s.tipo === "portada") as { boton: { texto: string } } | undefined)?.boton.texto ?? "Contacto"}
        </Boton>
      </div>
      <main className="mk-pag-main">{r.secciones.map(seccion)}</main>
      <footer className="mk-pag-pie">{r.negocio.nombre} · {r.negocio.direccion}</footer>
    </Estilo>
  );
}
