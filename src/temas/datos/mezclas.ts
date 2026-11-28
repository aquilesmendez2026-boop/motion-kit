// Las mezclas (contrato de diseño del backend). Importado del front de La Mente el 28-11-2026 con `node scripts/temas-del-front.mjs importar`; desde
// ahora la fuente es este archivo (fase 2 de «Un solo motor»). `npm run temas` revisa que siga dando lo mismo que el
// CSS del front mientras el front no borre el suyo.
import type { Mezcla } from "../tipos";

export const MEZCLAS: Mezcla[] = [
  {
    "id": "cafe-de-barrio",
    "nombre": "Café de barrio",
    "rubros": [
      "comida"
    ],
    "tema": "papel",
    "paleta": "arena",
    "porQue": "Crema y tostado con una letra editorial: cálido, cercano y con oficio, como el café de la esquina."
  },
  {
    "id": "hamburguesa-de-noche",
    "nombre": "Hamburguesa de noche",
    "rubros": [
      "comida"
    ],
    "tema": "hamburgueseria",
    "paleta": "noche",
    "porQue": "Fondo oscuro y acento amarillo: el par de la comida rápida, con apetito y ganas de salir."
  },
  {
    "id": "cocina-de-la-casa",
    "nombre": "Cocina de la casa",
    "rubros": [
      "comida"
    ],
    "tema": "mano",
    "paleta": "terracota",
    "porQue": "Letra a mano y terracota: comida casera, picada o pastelería de barrio."
  },
  {
    "id": "sabor-con-fuego",
    "nombre": "Sabor con fuego",
    "rubros": [
      "comida"
    ],
    "tema": "peruano",
    "paleta": "papel",
    "porQue": "Rojo ladrillo sobre crema con letra gruesa: parrilla, cocina peruana o sanguchería con carácter."
  },
  {
    "id": "salon-sereno",
    "nombre": "Salón sereno",
    "rubros": [
      "belleza"
    ],
    "tema": "clasico",
    "paleta": "arena",
    "porQue": "Neutros suaves y limpios: peluquería o estética que vende calma y confianza."
  },
  {
    "id": "elegancia-deco",
    "nombre": "Elegancia déco",
    "rubros": [
      "belleza"
    ],
    "tema": "deco",
    "paleta": "ciruela",
    "porQue": "Letra fina en mayúsculas y ciruela: uñas, maquillaje o estética con aire de lujo."
  },
  {
    "id": "barberia-dorada",
    "nombre": "Barbería dorada",
    "rubros": [
      "belleza"
    ],
    "tema": "deco",
    "paleta": "noche",
    "porQue": "Negro con acento dorado: la barbería clásica, sobria y de cuidado."
  },
  {
    "id": "estudio-retro",
    "nombre": "Estudio retro",
    "rubros": [
      "belleza",
      "otro"
    ],
    "tema": "retro",
    "paleta": "terracota",
    "porQue": "Letra redonda de los 70 y terracota: peluquería joven, tatuajes o tienda con onda."
  },
  {
    "id": "consulta-de-confianza",
    "nombre": "Consulta de confianza",
    "rubros": [
      "salud"
    ],
    "tema": "clasico",
    "paleta": "oceano",
    "porQue": "Azul sobre blanco con letra limpia: consulta, dentista o centro médico que da confianza."
  },
  {
    "id": "bienestar-verde",
    "nombre": "Bienestar verde",
    "rubros": [
      "salud"
    ],
    "tema": "clasico",
    "paleta": "menta",
    "porQue": "Verde menta: nutrición, terapias o farmacia de barrio con aire fresco."
  },
  {
    "id": "terapia-natural",
    "nombre": "Terapia natural",
    "rubros": [
      "salud",
      "clases"
    ],
    "tema": "papel",
    "paleta": "bosque",
    "porQue": "Verde bosque con letra serena: psicología, terapias o masajes; calmado y humano."
  },
  {
    "id": "kine-en-movimiento",
    "nombre": "Kine en movimiento",
    "rubros": [
      "salud",
      "clases"
    ],
    "tema": "andino",
    "paleta": "oceano",
    "porQue": "Azul con letra firme y redonda: kinesiología o rehabilitación, confianza con energía."
  },
  {
    "id": "respira",
    "nombre": "Respira",
    "rubros": [
      "clases"
    ],
    "tema": "mano",
    "paleta": "menta",
    "porQue": "Verde suave y letra a mano: yoga, pilates o meditación."
  },
  {
    "id": "gimnasio-intenso",
    "nombre": "Gimnasio intenso",
    "rubros": [
      "clases"
    ],
    "tema": "rock",
    "paleta": "rock",
    "porQue": "Negro y rojo con letra condensada en mayúsculas: el par del entrenamiento fuerte."
  },
  {
    "id": "clases-que-se-notan",
    "nombre": "Clases que se notan",
    "rubros": [
      "clases",
      "otro"
    ],
    "tema": "bruto",
    "paleta": "clasica",
    "porQue": "Blanco y negro con letra gruesa: academia, preuniversitario o taller que quiere verse directo."
  },
  {
    "id": "baile-de-noche",
    "nombre": "Baile de noche",
    "rubros": [
      "clases"
    ],
    "tema": "neon",
    "paleta": "neon",
    "porQue": "Neón sobre oscuro: baile, música o clases nocturnas con energía."
  },
  {
    "id": "almacen-de-esquina",
    "nombre": "Almacén de esquina",
    "rubros": [
      "barrio",
      "comida"
    ],
    "tema": "rustico",
    "paleta": "rustico",
    "porQue": "Tonos de madera y letra de cartel: almacén, panadería o verdulería de toda la vida."
  },
  {
    "id": "ferreteria-de-siempre",
    "nombre": "Ferretería de siempre",
    "rubros": [
      "barrio"
    ],
    "tema": "peruano",
    "paleta": "oceano",
    "porQue": "Azul marino con letra gruesa: ferretería, gasfitería o taller; firme y de confianza."
  },
  {
    "id": "esquina-de-noche",
    "nombre": "Esquina de noche",
    "rubros": [
      "barrio"
    ],
    "tema": "rock",
    "paleta": "noche",
    "porQue": "Oscuro con dorado y letra de cartel: botillería, bar o local que abre tarde."
  },
  {
    "id": "feria-fresca",
    "nombre": "Feria fresca",
    "rubros": [
      "barrio",
      "comida"
    ],
    "tema": "mano",
    "paleta": "bosque",
    "porQue": "Verde y letra de pizarra: verdulería, feria o productos naturales."
  },
  {
    "id": "sobrio-y-claro",
    "nombre": "Sobrio y claro",
    "rubros": [
      "otro"
    ],
    "tema": "clasico",
    "paleta": "clasica",
    "porQue": "Blanco y negro sin adornos: cualquier negocio que quiere verse ordenado."
  },
  {
    "id": "editorial",
    "nombre": "Editorial",
    "rubros": [
      "otro"
    ],
    "tema": "papel",
    "paleta": "papel",
    "porQue": "Crema con acento rojo y letra de revista: librería, oficios o servicios con personalidad."
  },
  {
    "id": "moderno-oscuro",
    "nombre": "Moderno oscuro",
    "rubros": [
      "otro"
    ],
    "tema": "clasico",
    "paleta": "noche",
    "porQue": "Oscuro y limpio con acento dorado: tecnología, fotografía o servicios premium."
  },
  {
    "id": "creativo-pop",
    "nombre": "Creativo pop",
    "rubros": [
      "otro"
    ],
    "tema": "bruto",
    "paleta": "ciruela",
    "porQue": "Letra gruesa y ciruela: diseño, regalos o emprendimiento con humor."
  }
];
