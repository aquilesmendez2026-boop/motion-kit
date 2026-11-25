import { useState } from "react";
import {
  Accordion,
  Aurora,
  BottomSheet,
  Carousel,
  CountUp,
  DeviceFrame,
  GlowBorder,
  GradientText,
  MagneticButton,
  Marquee,
  Navbar,
  Parallax,
  Pressable,
  Reveal,
  Ripple,
  ScrollProgress,
  ShinyButton,
  Skeleton,
  SplitText,
  Spotlight,
  Stagger,
  TabBar,
  Tabs,
  TiltCard,
  Typewriter,
  WordRotate,
  useToast,
  useViewTransition,
} from "../src";

const tarjetas = [
  { titulo: "Reveal", texto: "Los bloques aparecen al hacer scroll." },
  { titulo: "MagneticButton", texto: "El botón se acerca al cursor." },
  { titulo: "TiltCard", texto: "La tarjeta se inclina en 3D." },
];

const cifras = [
  { to: 27, suffix: "", texto: "componentes y 4 hooks" },
  { to: 0, suffix: "", texto: "dependencias de animación" },
  { to: 100, suffix: "%", texto: "pensado para móvil" },
];

const marcas = ["Landing", "Tienda", "Portafolio", "Podcast", "Reservas", "App móvil", "Blog"];

const laminas = [
  { titulo: "Desliza con el dedo", texto: "Usa el scroll nativo del teléfono." },
  { titulo: "Se ajusta sola", texto: "Cada lámina queda centrada al soltar." },
  { titulo: "Con puntos", texto: "Los puntos también sirven para navegar." },
];

const preguntas = [
  {
    title: "¿Necesito instalar otra librería de animación?",
    content: "No. Todo está hecho con React, CSS y APIs del navegador.",
  },
  {
    title: "¿Funciona en teléfonos?",
    content: "Sí. Los efectos de toque usan eventos de puntero, que sirven para dedo y mouse.",
  },
  {
    title: "¿Qué pasa si alguien pidió reducir el movimiento?",
    content: "Cada efecto se apaga solo y el contenido queda visible.",
  },
];

const pestanas = [
  { id: "inicio", label: "Inicio", icon: "●" },
  { id: "buscar", label: "Buscar", icon: "◆" },
  { id: "perfil", label: "Perfil", icon: "■" },
];

export function App() {
  const [hoja, setHoja] = useState(false);
  const [pestana, setPestana] = useState("inicio");
  const [cargando, setCargando] = useState(true);
  const transicion = useViewTransition();
  const [periodo, setPeriodo] = useState("mensual");
  const toast = useToast();

  return (
    <main>
      <ScrollProgress color="linear-gradient(90deg, #7c5cff, #ff5ca8)" />

      <Navbar>
        <div className="nav">
          <strong>motion-kit</strong>
          <a href="#landing">Plantilla</a>
          <a href="#efectos">Efectos</a>
          <a href="#piezas">Piezas</a>
          <a href="#estudio">Estudio</a>
          <a href="#encabezados">Encabezados</a>
          <a href="#biblioteca">Biblioteca</a>
          <a href="#relatos">Relatos</a>
          <a href="#hilos">Hilos</a>
          <a href="#momentos">Momentos</a>
          <a href="#director">Director</a>
          <a href="#luz">Luz</a>
          <a href="#profundidad">Foto profunda</a>
          <a href="#pagina">Página</a>
        </div>
      </Navbar>

      <section className="hero">
        <Aurora />
        <div className="hero-contenido">
          <Reveal direction="up">
            <p className="etiqueta">motion-kit</p>
          </Reveal>
          <SplitText as="h1" text="Efectos que dan vida a tu página" stagger={70} blur />
          <Reveal direction="up" delay={500}>
            <p className="bajada">
              Para{" "}
              <strong>
                <Typewriter text={["landings", "tiendas", "portafolios", "apps móviles"]} />
              </strong>
            </p>
          </Reveal>
          <Reveal direction="up" delay={650}>
            <MagneticButton className="boton" strength={0.4}>
              Pasa el mouse por aquí
            </MagneticButton>
          </Reveal>
        </div>
        <p className="scroll">Baja para ver más ↓</p>
      </section>

      <Marquee className="cinta" speed={50}>
        {marcas.map((m) => (
          <span key={m} className="cinta-item">
            {m}
          </span>
        ))}
      </Marquee>

      <section className="seccion">
        <Reveal>
          <h2>
            Texto con <GradientText>degradado en movimiento</GradientText>
          </h2>
        </Reveal>
        <div className="grilla">
          <Stagger step={120}>
            {cifras.map((c) => (
              <div key={c.texto} className="cifra">
                <CountUp to={c.to} suffix={c.suffix} className="cifra-numero" />
                <p>{c.texto}</p>
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="seccion">
        <Reveal>
          <h2>Tarjetas con inclinación</h2>
        </Reveal>
        <div className="grilla">
          {tarjetas.map((t, i) => (
            <Reveal key={t.titulo} delay={i * 120}>
              <TiltCard className="tarjeta" glare maxTilt={12}>
                <h3>{t.titulo}</h3>
                <p>{t.texto}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="seccion">
        <Reveal>
          <h2>Luz que sigue al cursor o al dedo</h2>
        </Reveal>
        <div className="grilla">
          <Spotlight className="tarjeta">
            <h3>Spotlight</h3>
            <p>Mueve el cursor o arrastra el dedo sobre la tarjeta.</p>
          </Spotlight>
          <Spotlight className="tarjeta" color="rgba(255, 92, 168, 0.35)">
            <h3>Otro color</h3>
            <p>El color y el tamaño de la luz se cambian con props.</p>
          </Spotlight>
        </div>
      </section>

      <section className="seccion">
        <Reveal>
          <h2>Profundidad al hacer scroll</h2>
        </Reveal>
        <div className="parallax">
          <Parallax speed={-0.12}>
            <div className="caja">Lento</div>
          </Parallax>
          <Parallax speed={0.1}>
            <div className="caja caja-alta">Medio</div>
          </Parallax>
          <Parallax speed={0.3}>
            <div className="caja">Rápido</div>
          </Parallax>
        </div>
      </section>

      <section className="seccion">
        <Reveal>
          <h2>Pensado para móvil</h2>
        </Reveal>
        <div className="movil">
          <DeviceFrame width={300}>
            <div className="pantalla">
              <p className="etiqueta">Tu app</p>
              <h3>Toca los botones</h3>
              <Pressable className="boton boton-ancho">Pressable: se hunde</Pressable>
              <Ripple className="fila-lista" role="button" tabIndex={0}>
                Ripple: onda al tocar
              </Ripple>
              <Pressable className="boton boton-ancho boton-claro" onClick={() => setHoja(true)}>
                Abrir hoja inferior
              </Pressable>
              <Carousel className="a-sangre" label="Ejemplo de carrusel" slideWidth="78%" gap={10}>
                {laminas.map((l) => (
                  <div key={l.titulo} className="lamina">
                    <h4>{l.titulo}</h4>
                    <p>{l.texto}</p>
                  </div>
                ))}
              </Carousel>
              <p className="pantalla-nota">Pestaña activa: {pestana}</p>
            </div>
            <TabBar
              items={pestanas}
              value={pestana}
              onChange={(id) => transicion(() => setPestana(id))}
              position="sticky"
            />
          </DeviceFrame>

          <div className="movil-texto">
            <Stagger step={100} direction="left">
              <p>
                <strong>Pressable</strong> y <strong>Ripple</strong> responden al dedo, no al hover.
              </p>
              <p>
                <strong>Carousel</strong> usa el scroll nativo: se siente como una app.
              </p>
              <p>
                <strong>BottomSheet</strong> sube desde abajo y se cierra arrastrando.
              </p>
              <p>
                <strong>TabBar</strong> es la barra inferior, con la marca que se desliza.
              </p>
              <p>
                <strong>DeviceFrame</strong> es este teléfono: sirve para mostrar plantillas.
              </p>
            </Stagger>
          </div>
        </div>
      </section>

      <section className="seccion">
        <Reveal>
          <h2>
            Piezas para <WordRotate words={["precios", "ofertas", "planes"]} className="acento" />
          </h2>
        </Reveal>
        <div className="grilla">
          <GlowBorder>
            <div className="plan">
              <h3>GlowBorder</h3>
              <p>Una luz recorre el borde para destacar el bloque principal.</p>
              <Tabs
                label="Periodo de pago"
                value={periodo}
                onChange={setPeriodo}
                items={[
                  { id: "mensual", label: "Mensual" },
                  { id: "anual", label: "Anual" },
                ]}
              />
              <p className="plan-precio">{periodo === "mensual" ? "$9.900 al mes" : "$99.000 al año"}</p>
              <ShinyButton
                className="boton boton-ancho"
                onClick={() => toast(`Elegiste el plan ${periodo}`)}
              >
                ShinyButton + Toast
              </ShinyButton>
            </div>
          </GlowBorder>
          <div className="tarjeta plan">
            <h3>Skeleton</h3>
            {cargando ? (
              <div className="esqueleto">
                <Skeleton width="70%" />
                <Skeleton />
                <Skeleton width="45%" />
              </div>
            ) : (
              <p>Así se ve el contenido cuando ya cargó.</p>
            )}
            <button className="enlace" onClick={() => setCargando((c) => !c)}>
              {cargando ? "Mostrar contenido" : "Volver a cargar"}
            </button>
          </div>
        </div>
      </section>

      <section className="seccion seccion-angosta">
        <Reveal>
          <h2>Preguntas frecuentes</h2>
        </Reveal>
        <Accordion items={preguntas} defaultOpen={[0]} className="preguntas" />
      </section>

      <section className="seccion">
        <Reveal direction="left">
          <h2>Entran desde distintos lados</h2>
        </Reveal>
        <div className="fila">
          <Reveal direction="left" distance={80}>
            <div className="caja">Izquierda</div>
          </Reveal>
          <Reveal direction="down" distance={60} delay={150}>
            <div className="caja">Arriba</div>
          </Reveal>
          <Reveal direction="right" distance={80} delay={300}>
            <div className="caja">Derecha</div>
          </Reveal>
        </div>
      </section>

      <footer className="pie">
        <p>
          <a href="#landing">Ver una plantilla de landing hecha con el kit →</a>
        </p>
        Hecho con motion-kit
      </footer>

      <BottomSheet open={hoja} onClose={() => setHoja(false)} label="Hoja de ejemplo">
        <div className="hoja">
          <h3>Hoja inferior</h3>
          <p>Arrástrala hacia abajo desde la barrita, toca afuera o presiona Esc para cerrarla.</p>
          <Pressable className="boton boton-ancho" onClick={() => setHoja(false)}>
            Listo
          </Pressable>
        </div>
      </BottomSheet>
    </main>
  );
}
