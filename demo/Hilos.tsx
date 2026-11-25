// #hilos: los hilos (rulos, hebras, figura, rastro, enredadera) sobre una página que imita una de La Mente en el teléfono: franjas de lado a
// lado, pegadas una a la otra, cada una con su relleno, y que entran corridas hasta que se ven (`data-entrada`, como
// las de La Mente). Es la vitrina de scripts/verificar-hilos.mjs.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Estilo } from "../src/estilos/Estilo";
import { ESTILOS, ESTILO_IDS, type EstiloId } from "../src/estilos/estilos";
import { PaginaRelato } from "../src/relatos/PaginaRelato";
import { Relato } from "../src/relatos/Relato";
import { FIGURA_IDS, RELATOS, type FiguraId } from "../src/relatos/catalogo";

type Hilo = "hilo" | "rulos" | "hebras" | "figura" | "rastro" | "enredadera" | "ramas";
const HILOS: Hilo[] = ["rulos", "hebras", "figura", "rastro", "enredadera", "ramas", "hilo"];
const CARTA = ["Clásica · $7.900", "Doble · $9.900", "Veggie · $8.500", "Papas · $3.500"];
const HORARIOS = ["Lunes a jueves · 12:00 a 23:00", "Viernes y sábado · 12:00 a 01:00", "Domingo · 13:00 a 22:00"];
/** Cómo se ve la página: con un estilo del kit, como una de La Mente (sin estilo del kit: sus colores en `--lm-*`), o en su vista previa (achicada, sin scroll propio). */
type Marco = "kit" | "lamente" | "previa";

/** Marca con `data-visto` cada franja que entra a la pantalla, como hace la página de La Mente. */
function useVistos(raiz: React.RefObject<HTMLDivElement | null>, clave: unknown) {
  useEffect(() => {
    const el = raiz.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((e) => e.forEach((x) => x.isIntersecting && x.target.setAttribute("data-visto", "")), { threshold: 0.15 });
    el.querySelectorAll("[data-entrada]").forEach((f) => io.observe(f));
    return () => io.disconnect();
  }, [raiz, clave]);
}

export function Hilos() {
  const [hilo, setHilo] = useState<Hilo>("figura");
  const [figura, setFigura] = useState<FiguraId>("hamburguesa");
  const [semilla, setSemilla] = useState("smash-burgers");
  const [estilo, setEstilo] = useState<EstiloId>("retro");
  const [respaldo, setRespaldo] = useState(false);
  const [largo, setLargo] = useState(false);
  /** Con espacio entre los bloques (ahí se ven los relatos que van detrás, como las ramas). */
  const [separadas, setSeparadas] = useState(false);
  const [marco, setMarco] = useState<Marco>("kit");
  /** El orden de las franjas de abajo (la lista puede subir sobre la foto, como al ordenar los bloques en el Estudio). */
  const [listaArriba, setListaArriba] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  useVistos(raiz, `${marco}-${listaArriba}`);

  const franja = (id: string, clase: string, contenido: ReactNode) => (
    <Relato key={id}>
      <section className={`hil-franja ${clase}`} data-franja={id} data-entrada="">
        {contenido}
      </section>
    </Relato>
  );
  const foto = (
    <Relato key="foto">
      <section className="hil-foto" data-franja="foto" data-entrada="">
        <div className="hil-foto-img" data-mk-parte="foto" role="img" aria-label="El local, de noche" />
      </section>
    </Relato>
  );
  const lista = franja("lista", "", (
    <>
      <h2>Horarios</h2>
      <div className="hil-lista">
        {HORARIOS.map((t) => <article key={t} className="hil-tarjeta" data-mk-parte="tarjeta">{t}</article>)}
      </div>
    </>
  ));
  const pagina = (
    <PaginaRelato relato="escenas" relatoPagina={hilo} figura={figura} semilla={semilla} respaldo={respaldo} data-prueba="hilo-pagina">
      <header className="mk-enc hil-enc">
        <small>SMASH BURGERS</small>
        <b>Doble carne, doble queso</b>
        <span>Pan brioche y papas a mano</span>
      </header>
      {franja("texto", "", (
        <>
          <h2>Nuestra historia</h2>
          <p>Todo partió en un food truck: una plancha, dos amigos y una receta que no hemos cambiado.</p>
          <p>Hoy seguimos aplastando la carne a mano, una por una, frente a ti.</p>
          {largo && <p data-prueba="hilo-extra">Molemos la carne cada mañana, horneamos el pan en la casa y las papas se cortan cuando las pides. Por eso a veces hay que esperar un poco: vale la pena. Los jueves hay música en vivo y los domingos el menú de los niños va por la casa.</p>}
        </>
      ))}
      {franja("grilla", "hil-superficie", (
        <>
          <h2>La carta</h2>
          <div className="hil-grilla">
            {CARTA.map((t) => <article key={t} className="hil-tarjeta" data-mk-parte="tarjeta"><i />{t}</article>)}
          </div>
        </>
      ))}
      {franja("acento", "hil-acento", (
        <>
          <h2>Martes de 2×1</h2>
          <p>Todas las hamburguesas, de 18:00 a 21:00.</p>
          <a className="hil-boton" href="#hilos">Reservar una mesa</a>
        </>
      ))}
      {listaArriba ? [lista, foto] : [foto, lista]}
      {/* Una franja con una foto de fondo (por CSS, no un <img>): el hilo tampoco puede pasar por encima. */}
      {franja("fondo-foto", "hil-con-fondo", (
        <>
          <h2>Ven a conocernos</h2>
          <p>La terraza abre todas las tardes.</p>
        </>
      ))}
      {franja("cierre", "hil-superficie", (
        <>
          <h2>Te esperamos</h2>
          {/* Un chip (con borde, sin marca) y un ícono decorativo: lo que se ve también es contenido. */}
          <span className="hil-chip" data-prueba="hilo-chip">Abierto hoy</span>
          <svg className="hil-icono" data-prueba="hilo-icono" aria-hidden="true" viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="10" r="4" fill="currentColor" /><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          <p>Av. Italia 1234, Providencia.</p>
          <a className="hil-boton" href="#hilos">Cómo llegar</a>
        </>
      ))}
    </PaginaRelato>
  );
  return (
    <main className="hil-demo">
      <a href="#">← Demo</a>
      <h1>Hilos</h1>
      <p className="enc-nota">Baja la página: el hilo va por lo libre de cada franja, se abre donde hay tarjetas y, con «Hilo que dibuja», termina en la figura del rubro.</p>
      <div className="hil-controles">
        <label>
          Hilo{" "}
          <select value={hilo} onChange={(e) => setHilo(e.target.value as Hilo)} data-prueba="hilo-tipo">
            {HILOS.map((id) => <option key={id} value={id}>{RELATOS[id].nombre}</option>)}
          </select>
        </label>
        <label>
          Figura{" "}
          <select value={figura} onChange={(e) => setFigura(e.target.value as FiguraId)} data-prueba="hilo-figura">
            {FIGURA_IDS.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <label>
          Estilo{" "}
          <select value={estilo} onChange={(e) => setEstilo(e.target.value as EstiloId)} data-prueba="hilo-estilo">
            {ESTILO_IDS.map((id) => <option key={id} value={id}>{ESTILOS[id].nombre}</option>)}
          </select>
        </label>
        <label>
          Página{" "}
          <select value={marco} onChange={(e) => setMarco(e.target.value as Marco)} data-prueba="hilo-marco">
            <option value="kit">Con un estilo del kit</option>
            <option value="lamente">Como una de La Mente</option>
            <option value="previa">En la vista previa del Estudio</option>
          </select>
        </label>
        <label>
          Semilla <input value={semilla} onChange={(e) => setSemilla(e.target.value)} data-prueba="hilo-semilla" size={14} />
        </label>
        <label>
          <input type="checkbox" checked={respaldo} onChange={(e) => setRespaldo(e.target.checked)} data-prueba="hilo-respaldo" /> Sin scroll nativo
        </label>
        <label>
          <input type="checkbox" checked={separadas} onChange={(e) => setSeparadas(e.target.checked)} data-prueba="hilo-separadas" /> Con espacio entre bloques
        </label>
        <button type="button" onClick={() => setLargo((v) => !v)} data-prueba="hilo-crece">{largo ? "Acortar el texto" : "Alargar el texto"}</button>
        <button type="button" onClick={() => setListaArriba((v) => !v)} data-prueba="hilo-orden">{listaArriba ? "Bajar los horarios" : "Subir los horarios"}</button>
      </div>
      <div ref={raiz} className={separadas ? "hil-separadas" : undefined}>
        {marco === "kit" && (
          <div className="hil-marco">
            <Estilo nombre={estilo} textura={false}>{pagina}</Estilo>
          </div>
        )}
        {/* Como en La Mente: sin el estilo del kit, con sus colores en `--lm-*`. */}
        {marco === "lamente" && (
          <div className="hil-marco hil-lamente" style={{ "--lm-acento": "#2e7d32", "--lm-fondo": "#fbf7ef", "--lm-superficie": "#ffffff", "--lm-texto": "#1d1d1b" } as CSSProperties}>
            {pagina}
          </div>
        )}
        {/* Como la vista previa del Estudio: la página achicada dentro de dos cajas con `overflow: hidden`, sin scroll propio. */}
        {marco === "previa" && (
          <div className="hil-previa" data-prueba="hilo-previa">
            <div className="hil-previa-hoja">
              <Estilo nombre={estilo} textura={false}>{pagina}</Estilo>
            </div>
          </div>
        )}
      </div>
      <p className="enc-nota hil-pie">Fin de la vitrina (esto está fuera de la página: el scroll total es más largo que ella).</p>
    </main>
  );
}
