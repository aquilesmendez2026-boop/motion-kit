// Los datos de Raíz Growshop (muestra del 28-11): la receta, el diseño y los módulos.
const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
const enDias = (n: number) => new Date(Date.now() + n * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
const foto = (n: number) => `/fotos/cultivo${n}.svg`;

export const RECETA = {
  version: 2,
  estilo: "retro",
  composicion: "letrero",
  colgante: true,
  entrada: "cascada",
  efectoTexto: "rebote",
  pack: "sello",
  antetitulo: "Growshop en Ñuñoa",
  titulo: "Todo para tu *huerto*",
  bajada: "Sustratos, iluminación LED, riego e hidroponía, con asesoría de verdad para que tus plantas crezcan sanas.",
  datos: ["Lunes a sábado, 10:00 a 20:00", "Despacho en el día"],
  botones: [
    { texto: "Ver catálogo", href: "#precios" },
    { texto: "Pedir en línea", href: "#pedidos" },
  ],
  efecto: "luciernagas",
  luz: "puntero",
  mover: ["puntero", "scroll"],
  alto: "pantalla",
  salida: "barra",
  logo: "raiz.svg",
  nombre: "Raíz Growshop",
};

const BLOQUES = [
  { tipo: "avisos", version: "viva" },
  { tipo: "encabezado", version: "centrado" },
  { tipo: "cinta", version: "viva" },
  { tipo: "precios", version: "viva", fondo: "superficie", corte: "ola", letras: "suben" },
  { tipo: "pedidos", version: "viva", fondo: "acento", corte: "diagonal" },
  { tipo: "galeria", version: "viva", corte: "rasgado" },
  { tipo: "clases", version: "viva", fondo: "puntos" },
  { tipo: "agenda", version: "viva", fondo: "superficie", corte: "ola" },
  { tipo: "eventos", version: "lista" },
  { tipo: "calendario", version: "viva", fondo: "rejilla" },
  { tipo: "sellos", version: "viva", fondo: "degradado", corte: "diagonal" },
  { tipo: "sorteos", version: "viva" },
  { tipo: "encuestas", version: "viva", fondo: "malla" },
  { tipo: "novedades", version: "viva" },
  { tipo: "resenas", version: "viva", fondo: "superficie", corte: "ola" },
  { tipo: "secciones", version: "viva" },
  { tipo: "episodios", version: "viva", fondo: "grano" },
  { tipo: "cotizaciones", version: "viva", fondo: "acento", corte: "rasgado" },
  { tipo: "buzon", version: "viva" },
  { tipo: "enlaces", version: "viva", fondo: "puntos" },
  { tipo: "contacto", version: "viva", fondo: "superficie" },
  { tipo: "ubicacion", version: "viva" },
].map((b) => ({ ...b, visible: true, entrada: "suave" }));

export const DATOS = {
  nombre: "Raíz Growshop",
  slug: "raiz-growshop",
  logoUrl: "/raiz.svg",
  urlArchivos: typeof window === "undefined" ? "" : window.location.origin,
  pagina: {
    descripcion: "Growshop de barrio: todo para cultivar en casa, con asesoría para partir y para crecer.",
    lema: "Sustratos · Iluminación LED · Riego · Hidroponía · Asesoría gratis",
    direccion: "Av. Irarrázaval 3150, Ñuñoa",
    horario: "Lunes a sábado: 10:00 a 20:00",
    contacto: { instagram: "raizgrowshop", whatsapp: "+56900000000" },
    diseno: {
      tema: "retro",
      paleta: "bosque",
      colores: { fondo: "#12291c", superficie: "#1a3727", texto: "#f1f5e8", textoSuave: "#b6c8b0", acento: "#f0c94a", sobreAcento: "#12291c", borde: "#2c4c38" },
      marca: { botones: "sello", aire: "amplio", botonFijo: "pedir" },
      motionkit: { version: 1, encabezado: RECETA, relato: "escenas", relatoPagina: "enredadera", estela: true, semilla: "raiz-growshop" },
      bloques: BLOQUES,
    },
  },
};

export const MODULOS = {
  precios: {
    listas: [
      { listaId: "sustratos", titulo: "Sustratos y fertilizantes", formato: "lista" },
      { listaId: "iluminacion", titulo: "Iluminación LED", formato: "lista" },
      { listaId: "riego", titulo: "Riego e hidroponía", formato: "lista" },
      { listaId: "carpas", titulo: "Carpas y macetas", formato: "lista" },
    ],
  },
  pedidos: { ejemplo: true },
  agenda: { calendarios: [{ calendarioId: "asesoria", nombre: "Asesoría de cultivo", descripcion: "30 minutos con nuestro equipo, en la tienda o por videollamada." }], ejemplo: true },
  sellos: { sellosPremio: 10, premio: "un saco de sustrato de 50 litros" },
  buzon: { ejemplo: true },
  encuestas: { pregunta: "¿Qué taller quieres para diciembre?", ejemplo: true },
  cotizaciones: { ejemplo: true },
  sorteos: { titulo: "Sorteo de aniversario", premio: "Un kit indoor completo: carpa, LED y extractor", ejemplo: true },
  resenas: {
    promedio: 4.9,
    total: 212,
    ejemplo: true,
    resenas: [
      { resenaId: "r1", creado: enDias(-2), estrellas: 5, nombre: "Daniela", texto: "Me armaron el indoor completo y me explicaron todo con paciencia. Mis tomates cherry están felices." },
      { resenaId: "r2", creado: enDias(-6), estrellas: 5, nombre: "Ignacio", texto: "Los mejores precios en LED de Ñuñoa y el despacho llegó el mismo día.", respuesta: "¡Gracias, Ignacio! Cualquier duda con la luz, nos escribes." },
      { resenaId: "r3", creado: enDias(-15), estrellas: 4, nombre: "Valentina", texto: "Buena asesoría para partir con hidroponía. El sábado se llena." },
    ],
  },
  eventos: {
    ejemplo: true,
    proximos: [
      { titulo: "Feria de semillas y plantas", fecha: enDias(2), hora: "11:00", libres: 60 },
      { titulo: "Charla: compost en departamento", fecha: enDias(5), hora: "19:00", libres: 12 },
      { titulo: "Intercambio de esquejes", fecha: enDias(9), hora: "16:00", libres: 25 },
    ],
  },
  novedades: {
    ejemplo: true,
    entradas: [
      { entradaId: "n1", titulo: "Llegaron los LED de espectro completo", resumen: "Más luz con menos consumo: 30 % menos en la cuenta.", portadaUrl: foto(4), publicada: enDias(-1) },
      { entradaId: "n2", titulo: "Guía: tu primer huerto en el balcón", resumen: "Qué sembrar en verano y cuánto regar.", portadaUrl: foto(1), publicada: enDias(-4) },
      { entradaId: "n3", titulo: "Sustrato propio de la casa", resumen: "Turba, perlita y humus de lombriz, mezclado aquí.", portadaUrl: foto(2), publicada: enDias(-10) },
    ],
  },
  enlaces: {
    ejemplo: true,
    enlaces: [
      { enlaceId: "e1", red: "instagram", titulo: "Instagram", url: "https://instagram.com/" },
      { enlaceId: "e2", red: "youtube", titulo: "Tutoriales de cultivo", url: "https://youtube.com/" },
      { enlaceId: "e3", red: "spotify", titulo: "Raíz Radio, el podcast", url: "https://open.spotify.com/" },
    ],
  },
  episodios: {
    podcast: "Raíz Radio",
    ejemplo: true,
    episodios: [
      { episodioId: "p1", titulo: "Luz, agua y paciencia", fecha: enDias(-3), audio: "/audio/ejemplo.mp3", duracion: 1720, resumen: "Lo básico para que una planta crezca bajo techo." },
      { episodioId: "p2", titulo: "Hidroponía sin miedo", fecha: enDias(-10), audio: "/audio/ejemplo.mp3", duracion: 1980, resumen: "Cultivar sin tierra, explicado fácil." },
      { episodioId: "p3", titulo: "Plagas: cómo prevenirlas", fecha: enDias(-17), audio: "/audio/ejemplo.mp3", duracion: 1510 },
    ],
  },
  galeria: {
    ejemplo: true,
    albumes: [
      { albumId: "a1", titulo: "Indoors de nuestros clientes", descripcion: "Mándanos el tuyo por Instagram.", fotos: [4, 1, 6, 5].map((n) => ({ url: foto(n), pie: `Cultivo ${n}` })) },
      { albumId: "a2", titulo: "La tienda", fotos: [2, 3, 5].map((n) => ({ url: foto(n) })) },
    ],
  },
  avisos: { ejemplo: true, aviso: { avisoId: "av1", texto: "Este sábado: 20 % en sustratos y fertilizantes orgánicos.", tono: "celebracion", hasta: enDias(3) } },
  secciones: {
    secciones: [
      {
        seccionId: "s1",
        titulo: "Preguntas frecuentes",
        tipo: "preguntas",
        items: [
          { pregunta: "¿Hacen despacho?", respuesta: "Sí, en el día dentro de Ñuñoa, Providencia y Macul; al resto de Santiago, al día siguiente." },
          { pregunta: "¿Me ayudan a elegir la luz?", respuesta: "Sí: cuéntanos el tamaño de tu espacio y te recomendamos el LED justo." },
          { pregunta: "¿Puedo pagar con tarjeta?", respuesta: "Débito, crédito y transferencia." },
        ],
      },
      {
        seccionId: "s2",
        titulo: "Arma tu indoor en tres pasos",
        tipo: "pasos",
        items: [
          { titulo: "Mide tu espacio", texto: "Un closet, una pieza o un rincón del balcón." },
          { titulo: "Elige carpa, luz y extractor", texto: "Te armamos el kit según tus medidas." },
          { titulo: "Siembra y aprende", texto: "La primera asesoría va por la casa." },
        ],
      },
      { seccionId: "s3", titulo: "El equipo", tipo: "equipo", items: [{ nombre: "Rocío", cargo: "Hidroponía" }, { nombre: "Felipe", cargo: "Iluminación" }, { nombre: "Ana", cargo: "Huertos urbanos" }] },
    ],
  },
  clases: {
    hoy,
    ejemplo: true,
    sesiones: [
      { claseId: "c1", nombre: "Hidroponía para principiantes", profesor: "Rocío", hora: "18:30", fecha: hoy, libres: 4, espera: "no" },
      { claseId: "c2", nombre: "Compost y lombricultura", profesor: "Ana", hora: "11:00", fecha: enDias(1), libres: 0, espera: "abierta" },
      { claseId: "c3", nombre: "Luz para cultivo interior", profesor: "Felipe", hora: "19:00", fecha: enDias(2), libres: 9, espera: "no" },
    ],
  },
  calendario: {
    ejemplo: true,
    proximas: [
      { titulo: "20 % en sustratos orgánicos", fecha: hoy, tipo: "promocion" },
      { titulo: "Feria de semillas y plantas", fecha: enDias(2), hora: "11:00", tipo: "evento" },
      { titulo: "Cerrado por inventario", fecha: enDias(6), tipo: "cerrado" },
      { titulo: "Taller de esquejes", fecha: enDias(8), hora: "17:00", tipo: "actividad" },
    ],
  },
};

