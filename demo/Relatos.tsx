import { useState, type ReactNode } from "react";
import { Estilo, ESTILOS, ESTILO_IDS, type EstiloId } from "../src";
import { PaginaRelato } from "../src/relatos/PaginaRelato";
import { Relato } from "../src/relatos/Relato";
import { FraseRelato } from "../src/relatos/FraseRelato";
import { RELATOS, type RelatoBloqueId, type RelatoPaginaId } from "../src/relatos/catalogo";

/** Bloques de ejemplo de una hamburguesería, con sus partes marcadas (data-mk-parte). */
export function BloquesEjemplo({ modo }: { modo?: RelatoBloqueId }) {
  return (
    <>
      <Relato modo={modo} className="rel-blq" data-prueba="con-lineas">
        <h3>Nuestra historia</h3>
        <p data-mk-parte="linea">Todo partió en un food truck.</p>
        <p data-mk-parte="linea">Una plancha, dos amigos y una receta.</p>
        <div className="rel-foto" data-mk-parte="foto" />
      </Relato>
      <Relato modo={modo} className="rel-blq">
        <h3>La carta</h3>
        <div className="rel-cartas">
          {["Clásica · $7.900", "Doble · $9.900", "Veggie · $8.500", "Papas · $3.500"].map((t) => (
            <div key={t} className="rel-carta" data-mk-parte="tarjeta"><i />{t}</div>
          ))}
        </div>
      </Relato>
      <Relato modo={modo} className="rel-blq">
        <h3>Galería</h3>
        <div className="rel-galeria">
          {["Clásica", "Doble", "Veggie", "Papas", "Shake"].map((t) => <div key={t} className="rel-cuadro" data-mk-parte="foto">{t}</div>)}
        </div>
      </Relato>
      <Relato modo={modo} className="rel-blq">
        <FraseRelato className="rel-frase" texto="Cada carne se aplasta al momento, en la misma plancha desde 2016." />
      </Relato>
      <Relato modo={modo} className="rel-blq">
        <h3>Lo que dicen</h3>
        <blockquote className="rel-carta" data-mk-parte="tarjeta">«La mejor smash de Ñuñoa.» — Cami</blockquote>
      </Relato>
      <Relato modo={modo} className="rel-blq rel-fin">
        <h3>¿Con hambre?</h3>
        <a className="rel-btn" href="#relatos">Pedir por WhatsApp</a>
      </Relato>
      <Relato modo={modo} className="rel-pie" data-prueba="pie">© 2026 Smash Burgers</Relato>
    </>
  );
}

/** Un teléfono con scroll propio, como en los bocetos. */
export function Telefono({ id, estilo, relato, relatoPagina, respaldo, children }: {
  id: string; estilo: EstiloId; relato?: RelatoBloqueId; relatoPagina?: RelatoPaginaId; respaldo: boolean; children?: ReactNode;
}) {
  return (
    <div className="rel-tel" data-telefono={id}>
      <Estilo nombre={estilo} textura={false}>
        <PaginaRelato relato={relato} relatoPagina={relatoPagina} respaldo={respaldo}>
          <div className="rel-enc mk-enc"><small>SMASH BURGERS</small><b>Doble carne, doble queso</b><span>Pan brioche y papas a mano</span></div>
          {children ?? <BloquesEjemplo />}
        </PaginaRelato>
      </Estilo>
    </div>
  );
}

/** #relatos: los relatos uno al lado del otro, para comparar y para sumar nuevos. */
export function Relatos() {
  const [respaldo, setRespaldo] = useState(false);
  return (
    <div className="rel-demo">
      <a href="#">← Demo</a>
      <h1>Relatos</h1>
      <p>Haz scroll dentro de cada teléfono. Cada estilo le da su sabor a la entrada de los bloques.</p>
      <label className="estudio-check">
        <input type="checkbox" checked={respaldo} onChange={(e) => setRespaldo(e.target.checked)} data-prueba="respaldo" />
        Ver como un navegador sin scroll nativo (respaldo)
      </label>
      <h2>Escenas que aparecen, por estilo</h2>
      <div className="rel-fila">
        {ESTILO_IDS.map((e) => (
          <figure key={e}>
            <figcaption>{ESTILOS[e].nombre}</figcaption>
            <Telefono id={e} estilo={e} relato="escenas" respaldo={respaldo} />
          </figure>
        ))}
        <figure>
          <figcaption>Cuento sin marcas → escenas</figcaption>
          <Telefono id="sin-marcas" estilo="pelicula" relato="escenas" respaldo={respaldo}>
            <Relato modo="cuento" className="rel-blq" data-prueba="sin-marcas">
              <h3>Un bloque sin marcas</h3>
              <p>Pide «cuento», pero no trae líneas marcadas: se cuenta como escenas.</p>
            </Relato>
            <Relato modo="subtitulos" className="rel-blq" data-prueba="frase-sin-palabras">
              <p data-mk-parte="frase">Una frase marcada, pero sin sus palabras en spans.</p>
            </Relato>
            <BloquesEjemplo />
          </Telefono>
        </figure>
      </div>
      <h2>Relatos de bloque</h2>
      <div className="rel-fila">
        {(["pelicula", "cuento", "profundidad", "iris", "carrete", "subtitulos"] as RelatoBloqueId[]).map((r, k) => (
          <figure key={r}>
            <figcaption>{RELATOS[r].nombre}</figcaption>
            <Telefono id={`r-${r}`} estilo={ESTILO_IDS[k % ESTILO_IDS.length]} relato={r} respaldo={respaldo}>
              <BloquesEjemplo modo={r} />
              {r === "carrete" && (
                <Relato modo="carrete" className="rel-blq" data-prueba="tira-corta">
                  <h3>Dos fotos</h3>
                  <div className="rel-galeria">{["Uno", "Dos"].map((t) => <div key={t} className="rel-mini" data-mk-parte="foto">{t}</div>)}</div>
                </Relato>
              )}
            </Telefono>
          </figure>
        ))}
        <figure>
          <figcaption>{RELATOS.pila.nombre}</figcaption>
          <Telefono id="p-pila" estilo="pelicula" relato="pila" respaldo={respaldo} />
        </figure>
        <figure>
          <figcaption>Hilo (relato de página)</figcaption>
          <Telefono id="p-hilo" estilo="neon" relato="escenas" relatoPagina="hilo" respaldo={respaldo} />
        </figure>
        <figure>
          <figcaption>Luz que cambia (relato de página)</figcaption>
          <Telefono id="p-luz" estilo="pelicula" relato="escenas" relatoPagina="luz" respaldo={respaldo} />
        </figure>
        <figure>
          <figcaption>{RELATOS.impulso.nombre} (relato de página)</figcaption>
          <Telefono id="p-impulso" estilo="rock" relato="escenas" relatoPagina="impulso" respaldo={respaldo} />
        </figure>
        <figure>
          <figcaption>{RELATOS.figura.nombre} (relato de página, dentro de un marco con su propio scroll)</figcaption>
          <Telefono id="p-figura" estilo="retro" relato="escenas" relatoPagina="figura" respaldo={respaldo} />
        </figure>
        <figure>
          <figcaption>Cuento más alto que la pantalla</figcaption>
          <Telefono id="r-cuento-largo" estilo="pelicula" relato="cuento" respaldo={respaldo}>
            <Relato modo="cuento" className="rel-blq">
              <h3>Una historia larga</h3>
              {Array.from({ length: 16 }, (_, i) => <p key={i} data-mk-parte="linea">Línea {i + 1} de una historia que no cabe en una pantalla.</p>)}
            </Relato>
            <BloquesEjemplo />
          </Telefono>
        </figure>
      </div>
    </div>
  );
}
