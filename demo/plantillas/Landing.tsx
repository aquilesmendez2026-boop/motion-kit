import {
  Accordion,
  Aurora,
  Carousel,
  CountUp,
  GlowBorder,
  Marquee,
  Pressable,
  Reveal,
  ScrollProgress,
  ShinyButton,
  SplitText,
  Spotlight,
  Stagger,
  WordRotate,
} from "../../src";
import "./landing.css";

// Plantilla de ejemplo: una landing completa armada solo con piezas del kit.
// La marca y los textos son inventados; se cambian por los del cliente.

const medios = ["Envío a todo Chile", "Tostado cada semana", "Sin permanencia", "Grano o molido", "Pausa cuando quieras"];

const beneficios = [
  { titulo: "Recién tostado", texto: "Sale del tostador y llega a tu casa en pocos días." },
  { titulo: "A tu medida", texto: "Eliges el origen, la molienda y cada cuánto te llega." },
  { titulo: "Sin amarras", texto: "Pausas o cancelas desde tu cuenta, sin llamar a nadie." },
];

const cifras = [
  { to: 12, suffix: "", texto: "orígenes distintos al año" },
  { to: 48, suffix: " h", texto: "desde el tostado al despacho" },
  { to: 4.8, decimals: 1, suffix: "", texto: "nota promedio de quienes lo prueban" },
];

const opiniones = [
  { nombre: "Camila R.", texto: "Cambié el café del súper por este y no vuelvo atrás." },
  { nombre: "Diego M.", texto: "Me gusta que cada mes llega un origen distinto." },
  { nombre: "Fran S.", texto: "Pausé dos meses por vacaciones y fue un clic." },
];

const planes = [
  { nombre: "Curioso", precio: "$9.900", detalle: "250 g al mes", destacado: false },
  { nombre: "Cafetero", precio: "$17.900", detalle: "500 g al mes", destacado: true },
  { nombre: "Oficina", precio: "$32.900", detalle: "1 kg al mes", destacado: false },
];

const preguntas = [
  { title: "¿Puedo cambiar de plan?", content: "Sí, cuando quieras, desde tu cuenta." },
  { title: "¿Cuándo llega el primer envío?", content: "Dentro de la semana siguiente a tu compra." },
  { title: "¿Y si no me gusta?", content: "Te cambiamos el origen en el envío siguiente, sin costo." },
];

export function Landing() {
  return (
    <div className="lp">
      <ScrollProgress color="#c2410c" />

      <header className="lp-hero">
        <Aurora colors={["#fdba74", "#fca5a5", "#fde68a"]} intensity={0.7} />
        <div className="lp-hero-in">
          <Reveal>
            <p className="lp-marca">Tostado</p>
          </Reveal>
          <SplitText as="h1" text="Café de especialidad, directo a tu puerta" stagger={60} />
          <Reveal delay={450}>
            <p className="lp-bajada">
              Una suscripción para quienes toman café{" "}
              <WordRotate words={["en casa", "en la oficina", "todos los días"]} className="lp-acento" />
            </p>
          </Reveal>
          <Reveal delay={600}>
            <ShinyButton className="lp-boton">Elegir mi plan</ShinyButton>
          </Reveal>
        </div>
      </header>

      <Marquee className="lp-cinta" speed={45} gap={48}>
        {medios.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </Marquee>

      <section className="lp-seccion">
        <Reveal>
          <h2>Por qué suscribirse</h2>
        </Reveal>
        <div className="lp-grilla">
          <Stagger step={110}>
            {beneficios.map((b) => (
              <Spotlight key={b.titulo} className="lp-tarjeta" color="rgba(194, 65, 12, 0.16)">
                <h3>{b.titulo}</h3>
                <p>{b.texto}</p>
              </Spotlight>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="lp-seccion lp-cifras">
        {cifras.map((c) => (
          <div key={c.texto}>
            <CountUp to={c.to} decimals={c.decimals} suffix={c.suffix} className="lp-numero" />
            <p>{c.texto}</p>
          </div>
        ))}
      </section>

      <section className="lp-seccion">
        <Reveal>
          <h2>Lo que dicen</h2>
        </Reveal>
        <Carousel label="Opiniones de clientes" slideWidth="min(82%, 420px)" dotColor="#c2410c">
          {opiniones.map((o) => (
            <figure key={o.nombre} className="lp-opinion">
              <blockquote>“{o.texto}”</blockquote>
              <figcaption>{o.nombre}</figcaption>
            </figure>
          ))}
        </Carousel>
      </section>

      <section className="lp-seccion">
        <Reveal>
          <h2>Planes</h2>
        </Reveal>
        <div className="lp-grilla">
          <Stagger step={110}>
            {planes.map((p) => {
              const contenido = (
                <div className="lp-plan">
                  <h3>{p.nombre}</h3>
                  <p className="lp-precio">{p.precio}</p>
                  <p>{p.detalle}</p>
                  <Pressable className={p.destacado ? "lp-boton" : "lp-boton lp-boton-borde"}>
                    Quiero este
                  </Pressable>
                </div>
              );
              return p.destacado ? (
                <GlowBorder
                  key={p.nombre}
                  colors={["#c2410c", "#f59e0b", "#fca5a5"]}
                  background="#fffaf3"
                  borderWidth={2}
                >
                  {contenido}
                </GlowBorder>
              ) : (
                <div key={p.nombre} className="lp-tarjeta lp-tarjeta-plana">
                  {contenido}
                </div>
              );
            })}
          </Stagger>
        </div>
      </section>

      <section className="lp-seccion lp-angosta">
        <Reveal>
          <h2>Preguntas frecuentes</h2>
        </Reveal>
        <Accordion items={preguntas} defaultOpen={[0]} />
      </section>

      <section className="lp-cierre">
        <Reveal>
          <h2>Tu próximo café ya se está tostando</h2>
        </Reveal>
        <Reveal delay={150}>
          <ShinyButton className="lp-boton lp-boton-claro" shine="rgba(194, 65, 12, 0.25)">
            Empezar ahora
          </ShinyButton>
        </Reveal>
        <p className="lp-volver">
          <a href="#">← Volver a la demo de efectos</a>
        </p>
      </section>
    </div>
  );
}
