// PROTOTIPO (desechable): piezas de cómic y anime para la guía del panel y para bloques de las páginas.
// Manos que apuntan y tocan, rayitas de «¡pop!», globos de diálogo, carteles de estallido, líneas de velocidad.
// Todo en SVG y CSS propios; solo transform y opacity en lo que se mueve. Vitrina: #comic.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SubirImagen } from "../src/entradas/interfaz";
import { CartelNovedad, Colgante, Estallido, Globo, Guia, Mano, Oferta, useCelebrar, Vacio } from "../src/entradas/comic";

export const CSS_COMIC = `
.cx-pagina{min-height:100vh;background:#FAF7F2;color:#1C1A22;font-family:Inter,system-ui,sans-serif;padding:clamp(16px,4vw,40px);overflow-x:clip}
.cx-cabeza{max-width:1040px;margin:0 auto 28px}
.cx-cabeza h1{font-family:Fraunces,Georgia,serif;font-size:clamp(1.8rem,6vw,2.8rem);margin:.3em 0 .2em}
.cx-cabeza p{margin:0;color:#5E5A68;max-width:60ch;line-height:1.5}
.cx-seccion{max-width:1040px;margin:0 auto 36px}
.cx-seccion>h2{font-size:1.25rem;margin:0 0 4px}
.cx-nota{margin:0 0 16px;color:#5E5A68;font-size:.95rem}
.cx-muestras{display:flex;flex-wrap:wrap;gap:28px;align-items:center;padding:24px;background:#fff;border:1px solid #E7E1D8;border-radius:16px}

/* Letra de cómic: gruesa, inclinada, en mayúsculas. */
.cx-letra{font-family:"Arial Black","Helvetica Neue",Arial,sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:.02em;font-style:italic}

/* La mano */
.cx-mano{display:block;overflow:visible}
.cx-mano-toca{animation:cx-toca 1.6s cubic-bezier(.3,0,.2,1) infinite}
@keyframes cx-toca{0%,55%,100%{transform:translateX(0)}65%{transform:translateX(-10px)}75%{transform:translateX(9px)}85%{transform:translateX(0)}}
.cx-pop{transform-origin:0 100%;animation:cx-pop 1.6s ease-out infinite;opacity:0}
.cx-pop:nth-child(2){animation-delay:.04s}
@keyframes cx-pop{0%,70%{opacity:0;transform:scale(.3)}76%{opacity:1;transform:scale(1.1)}90%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}

/* El globo de diálogo */
.cx-globo{position:relative;display:inline-block;max-width:280px;padding:12px 16px;background:#fff;border:3px solid #111;border-radius:18px;
  box-shadow:5px 5px 0 #111;font-size:1rem;line-height:1.3;color:#111}
.cx-globo::after{content:"";position:absolute;width:18px;height:18px;background:#fff;border:3px solid #111;border-top:0;border-left:0;
  transform:rotate(45deg);bottom:-11px;left:28px}
.cx-globo[data-cola=izquierda]::after{left:-11px;top:50%;bottom:auto;margin-top:-9px;transform:rotate(135deg)}
.cx-globo[data-cola=arriba]::after{top:-11px;bottom:auto;transform:rotate(-135deg)}
.cx-entra{animation:cx-entra .42s cubic-bezier(.34,1.56,.64,1) both}
@keyframes cx-entra{from{opacity:0;transform:scale(.6) rotate(-4deg)}}

/* El cartel de estallido */
.cx-estallido{display:inline-grid;place-items:center;position:relative}
.cx-estallido svg{display:block}
.cx-estallido span{position:absolute;inset:0;display:grid;place-items:center;text-align:center;line-height:1.05;color:#111;transform:rotate(-8deg)}
.cx-late{animation:cx-late 1.8s ease-in-out infinite}
@keyframes cx-late{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.07) rotate(-3deg)}}

/* El cartel colgante */
.cx-colgante{display:inline-block;transform-origin:50% 0;animation:cx-mece 3s ease-in-out infinite}
@keyframes cx-mece{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
.cx-colgante-cuerda{display:block;margin:0 auto;width:90px;height:34px}
.cx-tabla{padding:14px 22px;background:#ffd23f;border:3px solid #111;border-radius:10px;box-shadow:6px 6px 0 #111;font-size:1.3rem;color:#111}

/* La guía sobre el panel */
.cx-panel{position:relative;overflow:hidden;display:grid;gap:16px;padding:18px;background:#FAF7F2;border:1px solid #E7E1D8;border-radius:16px}
.cx-barra{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
.cx-barra strong{font-family:Fraunces,Georgia,serif;font-size:1.3rem}
.cx-boton{font:inherit;font-weight:600;min-height:44px;padding:0 16px;border-radius:10px;border:1px solid #E7E1D8;background:#fff;color:#1C1A22;cursor:pointer}
.cx-boton[data-fuerte]{background:#7c3aed;border-color:#7c3aed;color:#fff}
.cx-tarjeta{background:#fff;border:1px solid #E7E1D8;border-radius:14px;padding:18px;display:grid;gap:10px}
.cx-tarjeta h3{margin:0;font-size:1.05rem}
.cx-tarjeta p{margin:0;color:#5E5A68}
.cx-fila{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between}
.cx-foco{position:absolute;border-radius:14px;pointer-events:none;box-shadow:0 0 0 4px #ffd23f,0 0 0 9999px rgba(20,18,26,.42);
  transition:transform .45s cubic-bezier(.2,.8,.2,1),width .45s,height .45s;z-index:5}
.cx-guia-mano{position:absolute;left:0;top:0;z-index:6;pointer-events:none;transition:transform .55s cubic-bezier(.2,.8,.2,1)}
.cx-guia-globo{position:absolute;left:0;top:0;z-index:7;transition:transform .55s cubic-bezier(.2,.8,.2,1)}
.cx-guia-pie{display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap}
.cx-guia-pie button{font:inherit;font-weight:800;min-height:40px;padding:0 14px;border:3px solid #111;border-radius:10px;background:#fff;color:#111;box-shadow:3px 3px 0 #111;cursor:pointer}
.cx-guia-pie button[data-fuerte]{background:#ffd23f}
.cx-guia-pie small{color:#5E5A68;font-weight:600}

/* Bloques para las páginas de los negocios */
.cx-bloque{position:relative;overflow:hidden;border:3px solid #111;border-radius:18px;padding:clamp(20px,5vw,44px);display:grid;gap:18px;
  grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));align-items:center;box-shadow:8px 8px 0 #111}
.cx-bloque-comic{background-color:#ff5e7a;background-image:radial-gradient(#111 1.2px,transparent 1.6px);background-size:12px 12px}
.cx-bloque-comic::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,94,122,.92),rgba(255,210,63,.88))}
.cx-bloque-anime{background:#1b1135;color:#fff}
.cx-velocidad{position:absolute;inset:-40%;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.16) 0deg 1.4deg,transparent 1.4deg 7deg);
  animation:cx-gira 26s linear infinite}
@keyframes cx-gira{to{transform:rotate(1turn)}}
.cx-bloque>:not(.cx-velocidad):not(.cx-chispas){position:relative}
.cx-bloque h3{margin:0;font-size:clamp(1.6rem,6vw,2.6rem);line-height:1}
.cx-cta{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}
.cx-cta a{display:inline-block;padding:14px 22px;border:3px solid #111;border-radius:999px;background:#2f80ff;color:#fff;text-decoration:none;
  box-shadow:4px 4px 0 #111;font-size:1.05rem}
.cx-chispas{position:absolute;inset:0;pointer-events:none}
.cx-chispas i{position:absolute;width:10px;height:10px;background:#fff;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);
  animation:cx-brilla 2.4s ease-in-out infinite;opacity:0}
@keyframes cx-brilla{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.2) rotate(45deg)}}

@media (prefers-reduced-motion:reduce){
  .cx-mano-toca,.cx-pop,.cx-late,.cx-colgante,.cx-velocidad,.cx-chispas i{animation:none}
  .cx-pop{opacity:1}
  .cx-entra{animation-duration:.01s}
  .cx-foco,.cx-guia-mano,.cx-guia-globo{transition:opacity .2s}
}`;

type Piel = "clara" | "media" | "morena" | "oscura";
/** Las piezas reales (motion-kit/comic): la vitrina y #propuesta las usan desde aquí. */
export { Mano, Globo, Estallido, Colgante };

/* ---------- La guía: la mano va al elemento, lo toca y el globo explica (la pieza real, Guia) ---------- */

const PASOS_GUIA = [
  { objetivo: '[data-guia="editar-diseno"]', texto: "¡Aquí cambias colores, letras y el estilo de tu página!" },
  { objetivo: '[data-guia="subir-logo"]', texto: "Sube tu logo: arrástralo o toca el círculo." },
  { objetivo: '[data-guia="tarde"]', texto: "Esto aparece cuando la pantalla termina de cargar." },
  { objetivo: '[data-guia="nunca"]', texto: "(Este paso no existe: se salta solo.)" },
  { objetivo: '[data-guia="publicar"]', texto: "¿Lista? ¡Publica y ya está en internet!" },
];

function GuiaDemo() {
  const [abierta, setAbierta] = useState(false);
  const [sinElementos, setSinElementos] = useState(false);
  const [tarde, setTarde] = useState(false);
  const [toques, setToques] = useState(0);
  const [terminadas, setTerminadas] = useState(0);
  const [saltadas, setSaltadas] = useState(0);
  const abrir = () => {
    setTarde(false);
    setAbierta(true);
  };
  // Para la prueba: el elemento del paso 3 aparece cuando ella lo pide (así se prueba la espera de la guía).
  useEffect(() => {
    (window as unknown as { __guiaTarde?: (ms: number) => void }).__guiaTarde = (ms) => setTimeout(() => setTarde(true), ms);
  }, []);
  const cerrar = (como: "terminar" | "saltar") => {
    setAbierta(false);
    setSinElementos(false);
    if (como === "terminar") setTerminadas((n) => n + 1);
    else setSaltadas((n) => n + 1);
  };
  return (
    <div className="cx-panel" data-prueba="guia-demo">
      <div className="cx-barra">
        <strong>wwww</strong>
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="cx-boton" data-prueba="abrir-guia" onClick={abrir}>Ver la guía</button>
          <button type="button" className="cx-boton" data-prueba="abrir-guia-vacia" onClick={() => { setSinElementos(true); setAbierta(true); }}>Guía sin elementos</button>
          <button type="button" className="cx-boton" data-fuerte="" data-guia="publicar">Publicar cambios</button>
        </span>
      </div>
      <div className="cx-tarjeta cx-fila">
        <div>
          <h3>Diseño de tu página</h3>
          <p>Tema Clásico · Paleta Ciruela</p>
        </div>
        <button type="button" className="cx-boton" data-guia="editar-diseno" data-prueba="editar-diseno" onClick={() => setToques((n) => n + 1)}>🎨 Editar el diseño</button>
      </div>
      <div className="cx-fila" style={{ alignItems: "stretch" }}>
        <div className="cx-tarjeta" style={{ flex: "1 1 280px" }}>
          <h3>1. Tu imagen</h3>
          <div data-guia="subir-logo" style={{ justifySelf: "start" }}>
            <SubirImagen etiqueta="Logo" forma="redonda" ayuda="PNG, JPG o WebP, hasta 2 MB." alElegir={() => {}} />
          </div>
        </div>
        <div className="cx-tarjeta" style={{ flex: "1 1 280px" }}>
          <h3>2. Sobre tu negocio</h3>
          {tarde ? <button type="button" className="cx-boton" data-guia="tarde">Ver mi página</button> : <p>Cargando…</p>}
        </div>
      </div>
      <small hidden data-prueba="toques">{toques}</small>
      <small hidden data-prueba="terminadas">{terminadas}</small>
      <small hidden data-prueba="saltadas">{saltadas}</small>
      <Guia
        abierta={abierta}
        pasos={sinElementos ? [{ objetivo: '[data-guia="no-existe"]', texto: "Nada" }] : PASOS_GUIA}
        alTerminar={() => cerrar("terminar")}
        alSaltar={() => cerrar("saltar")}
      />
    </div>
  );
}

/* ---------- Bloques para las páginas de los negocios ---------- */

function BloqueComic() {
  return (
    <div className="cx-bloque cx-bloque-comic">
      <div style={{ display: "grid", gap: 14, justifyItems: "start" }}>
        <Estallido texto="¡Nuevo!" tamano={120} />
        <h3 className="cx-letra">Pan amasado recién salido</h3>
        <Globo>Ven a probarlo: sale a las 8 y vuela.</Globo>
      </div>
      <div className="cx-cta" style={{ justifySelf: "center" }}>
        <Mano ancho={140} piel="morena" manga="#1f6feb" />
        <a href="#comic" className="cx-letra">¡Reserva aquí!</a>
      </div>
    </div>
  );
}

function BloqueAnime() {
  const chispas = [[12, 18], [80, 12], [88, 70], [20, 78], [55, 30], [65, 86]];
  return (
    <div className="cx-bloque cx-bloque-anime">
      <span className="cx-velocidad" aria-hidden="true" />
      <span className="cx-chispas" aria-hidden="true">
        {chispas.map(([x, y], i) => <i key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.37}s` }} />)}
      </span>
      <div style={{ display: "grid", gap: 14, justifyItems: "start" }}>
        <Colgante texto="Clases de hoy" />
        <h3 className="cx-letra" style={{ color: "#ffd23f" }}>¡Tu primera clase gratis!</h3>
        <p style={{ margin: 0, opacity: .85 }}>Kendo para principiantes, martes y jueves.</p>
      </div>
      <div className="cx-cta" style={{ justifySelf: "center" }}>
        <Mano ancho={140} piel="clara" manga="#cc1145" />
        <a href="#comic" className="cx-letra" style={{ background: "#cc1145" }}>¡Inscríbete!</a>
      </div>
    </div>
  );
}

function Invitar() {
  const [novedad, setNovedad] = useState(false);
  const [tocado, setTocado] = useState(0);
  return (
    <section className="cx-seccion" data-prueba="invitar">
      <h2>Invitar: vacío, oferta y novedad</h2>
      <p className="cx-nota">Cuando no hay nada, la mano apunta a crear lo primero; la oferta de un módulo con su estallido; el cartel que cuelga junto a la campana.</p>
      <div className="cx-muestras" style={{ display: "grid", gap: 28 }}>
        <Vacio data-prueba="vacio" icono={<span style={{ fontSize: 34 }}>📋</span>} titulo="Todavía no tienes listas de precios." texto="Tu carta, tus servicios o tus productos con su precio." accion={<button type="button" className="cx-boton" data-fuerte="" data-prueba="vacio-accion">＋ Nueva lista</button>} />
        <Vacio data-prueba="vacio-enlace" titulo="Aún no tienes novedades." accion={<a href="#comic" className="cx-boton" data-prueba="vacio-enlace-accion">Escribir la primera</a>} />
        <Vacio data-prueba="vacio-sin" titulo="No hay reservas para hoy." />
        <Oferta data-prueba="oferta" destacado="¡30 días gratis!" accion={<button type="button" className="cx-boton" data-fuerte="">Probar</button>}>
          <strong>Reservas</strong>
          <p style={{ margin: 0, color: "#5E5A68" }}>Tus clientes reservan solos, a cualquier hora.</p>
        </Oferta>
        <div className="cx-fila" style={{ justifyContent: "flex-start", gap: 24 }}>
          <CartelNovedad texto="¡Nuevo!" visible={novedad} alTocar={() => setTocado((n) => n + 1)}>
            <button type="button" className="cx-boton" data-prueba="campana" aria-label="Avisos">🔔</button>
          </CartelNovedad>
          <button type="button" className="cx-boton" data-prueba="llega-novedad" onClick={() => setNovedad(true)}>Llega una novedad</button>
          <small hidden data-prueba="tocado">{tocado}</small>
        </div>
      </div>
    </section>
  );
}

function Celebrar() {
  const celebrar = useCelebrar();
  const [debajo, setDebajo] = useState(0);
  return (
    <section className="cx-seccion" data-prueba="celebrar">
      <h2>Celebrar</h2>
      <p className="cx-nota">Cuando pasa algo bueno (la página publicada, el primer pedido): un estallido y confeti, sin tapar nada.</p>
      <div className="cx-muestras">
        <button type="button" className="cx-boton" data-fuerte="" data-prueba="publicar" onClick={() => celebrar("¡Publicada!")}>Publicar</button>
        <button type="button" className="cx-boton" data-prueba="publicar-dos" onClick={() => { celebrar("¡Publicada!"); celebrar("¡Primer pedido!"); }}>Dos seguidas</button>
      </div>
      <button type="button" className="cx-boton" data-prueba="debajo" onClick={() => setDebajo((n) => n + 1)} style={{ position: "fixed", left: "calc(50% - 60px)", top: "calc(50% - 22px)", width: 120, zIndex: 1 }}>Debajo</button>
      <small hidden data-prueba="debajo-n">{debajo}</small>
    </section>
  );
}

export function ComicVitrina() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS_COMIC;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);
  const pieles: Piel[] = ["clara", "media", "morena", "oscura"];
  return (
    <div className="cx-pagina">
      <a href="#" style={{ color: "inherit", opacity: 0.7 }}>← Volver</a>
      <header className="cx-cabeza">
        <h1>Cómic y anime (prototipo)</h1>
        <p>Manos que apuntan y tocan, globos, carteles y líneas de velocidad: para la guía del panel y como bloques para las páginas de los negocios. Todo dibujado en SVG propio.</p>
      </header>

      <section className="cx-seccion">
        <h2>Las piezas</h2>
        <p className="cx-nota">La mano toca (con su «¡pop!»), en cuatro tonos de piel y con la manga del color de la marca. El globo, el estallido y el cartel colgante.</p>
        <div className="cx-muestras">
          {pieles.map((p, i) => <Mano key={p} data-prueba={i === 0 ? "mano-toca" : undefined} piel={p} ancho={130} manga={["#2b2b38", "#7c3aed", "#1f6feb", "#cc1145"][i]} />)}
        </div>
        <div className="cx-muestras" data-prueba="direcciones" style={{ marginTop: 16, gap: 48, padding: 40 }}>
          {(["derecha", "izquierda", "arriba", "abajo"] as const).map((d) => (
            <Mano key={d} direccion={d} ancho={120} toca={false} data-prueba={`mano-${d}`} />
          ))}
          <Estallido texto="¡Bienvenidos!" tamano={110} data-prueba="estallido-largo" />
        </div>
        <div className="cx-muestras" style={{ marginTop: 16 }}>
          <Mano direccion="izquierda" ancho={110} toca={false} pop={false} />
          <Mano direccion="abajo" ancho={90} />
          <Globo entra={false}>¡Toca aquí para empezar!</Globo>
          <Estallido texto="¡Aquí!" />
          <Estallido texto="¡Oferta!" color="#7cf0c8" tamano={130} />
          <Colgante texto="Abierto" />
        </div>
      </section>

      <Invitar />

      <Celebrar />

      <section className="cx-seccion">
        <h2>La guía del panel</h2>
        <p className="cx-nota">La mano viaja al botón, lo toca y el globo explica. El resto se oscurece. En el panel real apuntaría a los elementos que ya tienen su marca de soporte.</p>
        <GuiaDemo />
      </section>

      <section className="cx-seccion">
        <h2>Bloques para las páginas</h2>
        <p className="cx-nota">Un bloque estilo cómic (puntos de imprenta) y uno estilo anime (líneas de velocidad y chispas), cada uno con la mano que invita a tocar el botón.</p>
        <div style={{ display: "grid", gap: 28 }}>
          <BloqueComic />
          <BloqueAnime />
        </div>
      </section>
    </div>
  );
}
