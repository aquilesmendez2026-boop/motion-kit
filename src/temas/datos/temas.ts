// Los temas de la página (temas.ts del front) y los del panel (temaPanel.css, temasPanel.css y temasGuia.ts). Importado del front de La Mente el 28-11-2026 con `node scripts/temas-del-front.mjs importar`; desde
// ahora la fuente es este archivo (fase 2 de «Un solo motor»). `npm run temas` revisa que siga dando lo mismo que el
// CSS del front mientras el front no borre el suyo.
import type { Tema } from "../tipos";

export const TEMAS: Tema[] = [
  {
    "id": "clasico",
    "nombre": "Clásico",
    "para": [
      "pagina"
    ],
    "premium": false,
    "paleta": "clasica",
    "estiloBase": "pelicula"
  },
  {
    "id": "papel",
    "nombre": "Papel",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "papel",
    "estiloBase": "pelicula",
    "letra": {
      "fuenteTitulo": "'Fraunces', Georgia, serif",
      "google": [
        "Fraunces:opsz,wght@9..144,800"
      ],
      "peso": 800,
      "espaciado": "-0.01em"
    },
    "forma": {
      "radioTarjeta": "3px",
      "radioBoton": "3px"
    }
  },
  {
    "id": "rock",
    "nombre": "Rock",
    "para": [
      "pagina",
      "panel"
    ],
    "premium": true,
    "paleta": "rock",
    "estiloBase": "rock",
    "letra": {
      "fuenteTitulo": "'Anton', Impact, 'Arial Narrow', sans-serif",
      "google": [
        "Anton"
      ],
      "peso": 400,
      "mayusculas": true,
      "espaciado": "0.02em"
    },
    "forma": {
      "radioTarjeta": "0px",
      "radioBoton": "0px"
    },
    "panel": {
      "colores": {
        "cartel": "#f2b705",
        "fondo": "#efe4cf",
        "superficie": "#faf3e4",
        "texto": "#151111",
        "suave": "#5c5047",
        "borde": "#d6c6a8",
        "acento": "#d4231c",
        "sobreAcento": "#fff6e8"
      },
      "forma": {
        "trazo": "3px solid var(--mk-texto)",
        "sombra": "6px 6px 0 var(--mk-acento)",
        "radioTarjeta": "4px",
        "radioBoton": "4px",
        "sombraSuave": "3px 3px 0 var(--mk-acento)",
        "hundir": "translate(3px, 3px) rotate(-1deg)",
        "radioCampo": "3px"
      },
      "detalle": {
        "fila-borde": "2px solid var(--mk-texto)",
        "fila-radio": "3px",
        "boton-ancho": "3px",
        "boton-sombra-suave": "2px 2px 0 var(--mk-texto)",
        "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 28%, transparent)",
        "campo-borde": "3px solid var(--mk-texto)",
        "campo-alto": "2.75rem",
        "campo-pasar": "3px 3px 0 var(--mk-texto)",
        "campo-foco": "5px 5px 0 var(--mk-acento)",
        "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
        "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
        "boton-radio-grande": "4px",
        "hundir-grande": "translate(4px, 4px) rotate(-1deg)",
        "sombra-chica": "5px 5px 0 var(--mk-acento)",
        "sombra-pasar": "8px 8px 0 var(--mk-acento)",
        "sombra-hundida": "1px 1px 0 var(--mk-acento)",
        "sombra-mini": "2px 2px 0 var(--mk-acento)",
        "levantar": "translate(-2px, -2px) rotate(-1deg)",
        "cabeza-sombra": "10px 10px 0 var(--mk-acento)",
        "elegida-sombra": "4px 4px 0 var(--mk-cartel)",
        "radio-icono": "3px",
        "radio-icono-chico": "2px",
        "radio-foto": "4px",
        "pildora": "4px"
      },
      "letra": {
        "fuenteCartel": "\"Rubik Dirt\", \"Impact\", \"Arial Black\", sans-serif",
        "google": [
          "Rubik+Dirt"
        ]
      },
      "adornos": [
        "cinta-torcida"
      ]
    },
    "rubros": [
      "hamburgueserías roqueras",
      "bares de rock",
      "sangucherías",
      "food trucks"
    ],
    "movimiento": {
      "titulo": "temblor",
      "tarjeta": {
        "variante": "plana",
        "efecto": "zoom"
      },
      "presencia": "bajar",
      "luz": [
        "#d4231c",
        "#f2b705",
        "#d4231c"
      ]
    }
  },
  {
    "id": "rustico",
    "nombre": "Rústico",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "rustico",
    "estiloBase": "pelicula",
    "letra": {
      "fuenteTitulo": "'Zilla Slab', Rockwell, Georgia, serif",
      "google": [
        "Zilla+Slab:wght@700"
      ],
      "peso": 700
    },
    "forma": {
      "radioTarjeta": "6px",
      "radioBoton": "9999px"
    }
  },
  {
    "id": "neon",
    "nombre": "Neón",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "neon",
    "estiloBase": "neon",
    "letra": {
      "fuenteTitulo": "'Tilt Neon', system-ui, sans-serif",
      "google": [
        "Tilt+Neon"
      ],
      "peso": 400,
      "brillo": true
    },
    "forma": {
      "radioTarjeta": "14px",
      "radioBoton": "9999px"
    }
  },
  {
    "id": "mano",
    "nombre": "Hecho a mano",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "arena",
    "estiloBase": "anime",
    "letra": {
      "fuenteTitulo": "'Caveat', 'Comic Sans MS', cursive",
      "google": [
        "Caveat:wght@700"
      ],
      "peso": 700
    },
    "forma": {
      "radioTarjeta": "18px",
      "radioBoton": "9999px"
    }
  },
  {
    "id": "retro",
    "nombre": "Retro 70",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "terracota",
    "estiloBase": "retro",
    "letra": {
      "fuenteTitulo": "'Shrikhand', Georgia, serif",
      "google": [
        "Shrikhand"
      ],
      "peso": 400
    },
    "forma": {
      "radioTarjeta": "28px",
      "radioBoton": "9999px"
    }
  },
  {
    "id": "bruto",
    "nombre": "Neobrutalismo",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "clasica",
    "estiloBase": "retro",
    "letra": {
      "fuenteTitulo": "'Archivo Black', 'Arial Black', sans-serif",
      "google": [
        "Archivo+Black"
      ],
      "peso": 400,
      "mayusculas": true,
      "espaciado": "-0.01em"
    },
    "forma": {
      "radioTarjeta": "0px",
      "radioBoton": "0px"
    }
  },
  {
    "id": "deco",
    "nombre": "Art déco",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "noche",
    "estiloBase": "pelicula",
    "letra": {
      "fuenteTitulo": "'Poiret One', 'Futura', sans-serif",
      "google": [
        "Poiret+One"
      ],
      "peso": 400,
      "mayusculas": true,
      "espaciado": "0.1em"
    },
    "forma": {
      "radioTarjeta": "0px",
      "radioBoton": "0px"
    }
  },
  {
    "id": "andino",
    "nombre": "Textil andino",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "terracota",
    "estiloBase": "anime",
    "letra": {
      "fuenteTitulo": "'Outfit', 'Inter', system-ui, sans-serif",
      "google": [
        "Outfit:wght@900"
      ],
      "peso": 900
    },
    "forma": {
      "radioTarjeta": "8px",
      "radioBoton": "9999px"
    }
  },
  {
    "id": "hamburgueseria",
    "nombre": "Hamburguesería",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "noche",
    "estiloBase": "neon",
    "letra": {
      "fuenteTitulo": "'Lilita One', 'Arial Rounded MT Bold', sans-serif",
      "google": [
        "Lilita+One"
      ],
      "peso": 400,
      "espaciado": "0.01em"
    },
    "forma": {
      "radioTarjeta": "18px",
      "radioBoton": "9999px"
    }
  },
  {
    "id": "peruano",
    "nombre": "Peruano",
    "para": [
      "pagina"
    ],
    "premium": true,
    "paleta": "terracota",
    "estiloBase": "anime",
    "letra": {
      "fuenteTitulo": "'Alfa Slab One', Rockwell, serif",
      "google": [
        "Alfa+Slab+One"
      ],
      "peso": 400
    },
    "forma": {
      "radioTarjeta": "6px",
      "radioBoton": "9999px"
    }
  },
  {
    "id": "noche",
    "nombre": "Noche",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#3ee6ff",
      "fondo": "#100d1a",
      "superficie": "#1a1527",
      "texto": "#f3eefc",
      "suave": "#a89dc4",
      "borde": "#2d2543",
      "acento": "#ff4fa3",
      "sobreAcento": "#14060e"
    },
    "forma": {
      "trazo": "1.5px solid color-mix(in srgb, var(--mk-texto) 20%, transparent)",
      "sombra": "0 0 0 1px color-mix(in srgb, var(--mk-acento) 22%, transparent), 0 22px 44px -24px color-mix(in srgb, var(--mk-acento) 60%, transparent)",
      "radioTarjeta": "18px",
      "radioBoton": "12px",
      "sombraSuave": "0 0 18px -4px color-mix(in srgb, var(--mk-acento) 80%, transparent)",
      "hundir": "scale(0.97)",
      "radioCampo": "12px"
    },
    "detalle": {
      "mal": "#ff7a7a",
      "sobre-sol": "#071318",
      "fila-borde": "1px solid color-mix(in srgb, var(--mk-texto) 13%, transparent)",
      "fila-radio": "12px",
      "boton-ancho": "1.5px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 16%, transparent)",
      "campo-borde": "1.5px solid color-mix(in srgb, var(--mk-texto) 22%, transparent)",
      "campo-fondo": "color-mix(in srgb, var(--mk-fondo) 60%, var(--mk-superficie))",
      "campo-alto": "2.75rem",
      "campo-pasar": "0 0 0 1px color-mix(in srgb, var(--mk-cartel) 40%, transparent)",
      "campo-foco": "0 0 0 3px color-mix(in srgb, var(--mk-acento) 45%, transparent), 0 0 26px -4px var(--mk-acento)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "14px",
      "hundir-grande": "scale(0.96)",
      "campo-levantar": "none",
      "sombra-chica": "0 0 0 1.5px var(--mk-cartel), 0 0 22px -6px var(--mk-cartel)",
      "sombra-pasar": "0 0 0 1.5px var(--mk-cartel), 0 0 30px -6px var(--mk-cartel)",
      "sombra-hundida": "0 0 8px -2px var(--mk-cartel)",
      "sombra-mini": "0 0 12px -2px var(--mk-cartel)",
      "levantar": "translateY(-2px)",
      "cabeza-sombra": "0 0 48px -10px var(--mk-acento)",
      "elegida-sombra": "0 0 20px -4px var(--mk-grupo, var(--mk-acento))",
      "radio-foto": "16px"
    },
    "letra": {
      "fuenteCartel": "\"Unbounded\", \"Arial Black\", system-ui, sans-serif",
      "google": [
        "Unbounded:wght@500;700"
      ]
    },
    "adornos": [
      "brillo-noche"
    ],
    "rubros": [
      "bares",
      "tocatas",
      "discotecas",
      "productoras de eventos"
    ],
    "movimiento": {
      "titulo": "encender",
      "tarjeta": {
        "variante": "vidrio",
        "efecto": [
          "resplandor",
          "zoom"
        ]
      },
      "presencia": "zoom",
      "luz": [
        "#ff4fa3",
        "#3ee6ff",
        "#ff4fa3"
      ]
    }
  },
  {
    "id": "cuaderno",
    "nombre": "Cuaderno",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#dcf46b",
      "fondo": "#f6f5ee",
      "superficie": "#fffefa",
      "texto": "#1d3787",
      "suave": "#56659a",
      "borde": "#cdd6ee",
      "acento": "#d3263a",
      "sobreAcento": "#ffffff"
    },
    "forma": {
      "trazo": "1.5px solid var(--mk-texto)",
      "sombra": "2px 3px 0 color-mix(in srgb, var(--mk-texto) 14%, transparent)",
      "radioTarjeta": "4px",
      "radioBoton": "6px",
      "sombraSuave": "2px 2px 0 color-mix(in srgb, var(--mk-texto) 25%, transparent)",
      "hundir": "translate(1px, 1px) rotate(-0.6deg)",
      "radioCampo": "3px"
    },
    "detalle": {
      "fila-borde": "1px solid color-mix(in srgb, var(--mk-texto) 22%, transparent)",
      "fila-radio": "3px",
      "boton-ancho": "1.5px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 28%, transparent)",
      "campo-borde": "1.5px solid color-mix(in srgb, var(--mk-texto) 45%, transparent)",
      "campo-alto": "2.75rem",
      "campo-pasar": "none",
      "campo-foco": "0 0 0 4px var(--mk-cartel)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "6px",
      "hundir-grande": "translate(2px, 2px) rotate(-0.6deg)",
      "campo-levantar": "none",
      "sombra-chica": "3px 3px 0 color-mix(in srgb, var(--mk-texto) 20%, transparent)",
      "sombra-pasar": "4px 5px 0 color-mix(in srgb, var(--mk-texto) 22%, transparent)",
      "sombra-hundida": "none",
      "sombra-mini": "2px 2px 0 color-mix(in srgb, var(--mk-texto) 25%, transparent)",
      "levantar": "translate(-1px, -2px) rotate(-0.5deg)",
      "cabeza-sombra": "4px 5px 0 var(--mk-cartel)",
      "elegida-sombra": "none",
      "radio-icono": "4px",
      "radio-icono-chico": "3px",
      "radio-foto": "4px",
      "pildora": "6px"
    },
    "letra": {
      "fuenteCartel": "\"Caveat\", \"Comic Sans MS\", cursive",
      "google": [
        "Caveat:wght@600;700"
      ]
    },
    "adornos": [
      "hoja-cuaderno"
    ],
    "rubros": [
      "academias",
      "clases particulares",
      "preuniversitarios",
      "talleres"
    ],
    "movimiento": {
      "titulo": "maquina",
      "tarjeta": {
        "variante": "borde",
        "efecto": "revelar"
      },
      "presencia": "hoja",
      "luz": [
        "#dcf46b",
        "#1d3787",
        "#d3263a"
      ]
    }
  },
  {
    "id": "pastel",
    "nombre": "Pastel",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#ffc4da",
      "fondo": "#fff3f6",
      "superficie": "#ffffff",
      "texto": "#4a2a3d",
      "suave": "#8b6a7c",
      "borde": "#f4d2de",
      "acento": "#d9467f",
      "sobreAcento": "#ffffff"
    },
    "forma": {
      "trazo": "2px solid color-mix(in srgb, var(--mk-acento) 24%, var(--mk-superficie))",
      "sombra": "0 16px 34px -20px color-mix(in srgb, var(--mk-acento) 60%, transparent)",
      "radioTarjeta": "28px",
      "radioBoton": "999px",
      "sombraSuave": "0 8px 18px -8px color-mix(in srgb, var(--mk-acento) 70%, transparent)",
      "hundir": "scale(0.94)",
      "radioCampo": "18px"
    },
    "detalle": {
      "fila-borde": "1.5px solid color-mix(in srgb, var(--mk-acento) 16%, var(--mk-superficie))",
      "fila-radio": "18px",
      "boton-ancho": "0px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-acento) 26%, transparent)",
      "campo-borde": "2px solid color-mix(in srgb, var(--mk-acento) 20%, var(--mk-superficie))",
      "campo-alto": "2.75rem",
      "campo-pasar": "0 0 0 4px color-mix(in srgb, var(--mk-acento) 10%, transparent)",
      "campo-foco": "0 0 0 5px color-mix(in srgb, var(--mk-acento) 22%, transparent)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "999px",
      "hundir-grande": "scale(0.94)",
      "campo-levantar": "scale(1.01)",
      "sombra-chica": "0 12px 24px -12px color-mix(in srgb, var(--mk-acento) 65%, transparent)",
      "sombra-pasar": "0 20px 34px -16px color-mix(in srgb, var(--mk-acento) 70%, transparent)",
      "sombra-hundida": "0 4px 10px -6px color-mix(in srgb, var(--mk-acento) 60%, transparent)",
      "sombra-mini": "0 6px 12px -6px var(--mk-acento)",
      "levantar": "translateY(-3px) scale(1.01)",
      "cabeza-sombra": "0 24px 40px -22px var(--mk-acento)",
      "elegida-sombra": "0 10px 20px -10px var(--mk-grupo, var(--mk-acento))",
      "radio-icono": "999px",
      "radio-icono-chico": "999px",
      "radio-foto": "24px"
    },
    "letra": {
      "fuenteCartel": "\"Fredoka\", \"Nunito\", system-ui, sans-serif",
      "google": [
        "Fredoka:wght@400;500;600"
      ]
    },
    "adornos": [
      "pastel-suave"
    ],
    "rubros": [
      "uñas",
      "cejas y pestañas",
      "pastelerías",
      "tiendas de regalos"
    ],
    "movimiento": {
      "titulo": "rebote",
      "tarjeta": {
        "variante": "elevada",
        "efecto": [
          "elevar",
          "zoom"
        ]
      },
      "presencia": "escalar",
      "luz": [
        "#ffc4da",
        "#d9467f",
        "#c9b5ff"
      ]
    }
  },
  {
    "id": "taller",
    "nombre": "Taller",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#ff6a14",
      "fondo": "#e7e5df",
      "superficie": "#f6f5f0",
      "texto": "#141414",
      "suave": "#57534c",
      "borde": "#c2beb4",
      "acento": "#141414",
      "sobreAcento": "#f6f5f0"
    },
    "forma": {
      "trazo": "3px solid var(--mk-texto)",
      "sombra": "none",
      "radioTarjeta": "0px",
      "radioBoton": "2px",
      "sombraSuave": "none",
      "hundir": "translateY(2px)",
      "radioCampo": "0px"
    },
    "detalle": {
      "fila-borde": "2px solid var(--mk-texto)",
      "fila-radio": "0px",
      "boton-ancho": "3px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 35%, transparent)",
      "campo-borde": "2px solid var(--mk-texto)",
      "campo-alto": "2.75rem",
      "campo-pasar": "inset 0 -4px 0 var(--mk-texto)",
      "campo-foco": "inset 0 -4px 0 var(--mk-cartel), 0 0 0 3px var(--mk-cartel)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "2px",
      "hundir-grande": "translateY(3px)",
      "campo-levantar": "none",
      "sombra-chica": "6px 6px 0 var(--mk-cartel)",
      "sombra-pasar": "7px 7px 0 var(--mk-cartel)",
      "sombra-hundida": "2px 2px 0 var(--mk-cartel)",
      "sombra-mini": "3px 3px 0 var(--mk-cartel)",
      "levantar": "translate(-3px, -3px)",
      "cabeza-sombra": "8px 8px 0 var(--mk-cartel)",
      "elegida-sombra": "inset 6px 0 0 var(--mk-cartel)",
      "radio-icono": "0px",
      "radio-icono-chico": "0px",
      "radio-foto": "0px",
      "pildora": "2px"
    },
    "letra": {
      "fuenteCartel": "\"Archivo Black\", \"Arial Black\", system-ui, sans-serif",
      "google": [
        "Archivo+Black"
      ]
    },
    "adornos": [
      "cinta-peligro"
    ],
    "rubros": [
      "talleres mecánicos",
      "ferreterías",
      "mueblerías",
      "vulcanizaciones"
    ],
    "movimiento": {
      "titulo": "impacto",
      "tarjeta": {
        "variante": "plana",
        "efecto": "brillo"
      },
      "presencia": "cortina",
      "luz": [
        "#ff6a14",
        "#141414",
        "#ff6a14"
      ]
    }
  },
  {
    "id": "cultivo",
    "nombre": "Cultivo",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#c2e07a",
      "fondo": "#eceee0",
      "superficie": "#fbfcf4",
      "texto": "#1c3223",
      "suave": "#5a6d5d",
      "borde": "#cad4bd",
      "acento": "#2e7d48",
      "sobreAcento": "#f6fbef"
    },
    "forma": {
      "trazo": "2px solid var(--mk-texto)",
      "sombra": "0 14px 30px -20px color-mix(in srgb, var(--mk-acento) 75%, transparent)",
      "radioTarjeta": "26px 6px 26px 6px",
      "radioBoton": "16px 4px 16px 4px",
      "sombraSuave": "0 6px 14px -8px color-mix(in srgb, var(--mk-acento) 80%, transparent)",
      "hundir": "scale(0.96)",
      "radioCampo": "14px 4px 14px 4px"
    },
    "detalle": {
      "fila-borde": "1.5px solid color-mix(in srgb, var(--mk-texto) 22%, transparent)",
      "fila-radio": "16px 4px 16px 4px",
      "boton-ancho": "2px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 28%, transparent)",
      "campo-borde": "2px solid color-mix(in srgb, var(--mk-texto) 45%, transparent)",
      "campo-alto": "2.75rem",
      "campo-pasar": "0 0 0 3px color-mix(in srgb, var(--mk-cartel) 60%, transparent)",
      "campo-foco": "0 0 0 4px var(--mk-cartel)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "18px 4px 18px 4px",
      "hundir-grande": "scale(0.96)",
      "campo-levantar": "none",
      "sombra-chica": "0 12px 24px -14px color-mix(in srgb, var(--mk-acento) 80%, transparent)",
      "sombra-pasar": "0 18px 30px -16px color-mix(in srgb, var(--mk-acento) 85%, transparent)",
      "sombra-hundida": "none",
      "sombra-mini": "0 4px 10px -4px var(--mk-acento)",
      "levantar": "translateY(-3px) rotate(-0.4deg)",
      "cabeza-sombra": "0 24px 40px -24px var(--mk-acento)",
      "elegida-sombra": "none",
      "radio-icono": "12px 3px 12px 3px",
      "radio-icono-chico": "10px 2px 10px 2px",
      "radio-foto": "22px 6px 22px 6px"
    },
    "letra": {
      "fuenteCartel": "\"Bricolage Grotesque\", \"Arial Black\", system-ui, sans-serif",
      "google": [
        "Bricolage+Grotesque:opsz,wght@12..96,800"
      ]
    },
    "adornos": [
      "esquina-hoja"
    ],
    "rubros": [
      "growshops",
      "viveros",
      "tiendas de semillas",
      "huertos urbanos"
    ],
    "movimiento": {
      "titulo": "onda",
      "tarjeta": {
        "variante": "borde",
        "efecto": "elevar"
      },
      "presencia": "subir",
      "luz": [
        "#c2e07a",
        "#2e7d48",
        "#c2e07a"
      ]
    }
  },
  {
    "id": "calma",
    "nombre": "Calma",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#f3d9c9",
      "fondo": "#edf1ef",
      "superficie": "#fbfcfb",
      "texto": "#2f3b45",
      "suave": "#6f7c86",
      "borde": "#d8e1de",
      "acento": "#4e8a82",
      "sobreAcento": "#ffffff"
    },
    "forma": {
      "trazo": "1px solid color-mix(in srgb, var(--mk-texto) 14%, transparent)",
      "sombra": "0 30px 60px -40px color-mix(in srgb, var(--mk-acento) 70%, transparent)",
      "radioTarjeta": "30px",
      "radioBoton": "999px",
      "sombraSuave": "none",
      "hundir": "scale(0.98)",
      "radioCampo": "16px"
    },
    "detalle": {
      "fila-borde": "1px solid color-mix(in srgb, var(--mk-texto) 10%, transparent)",
      "fila-radio": "20px",
      "boton-ancho": "1px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 14%, transparent)",
      "campo-borde": "1px solid color-mix(in srgb, var(--mk-texto) 22%, transparent)",
      "campo-alto": "2.75rem",
      "campo-pasar": "0 0 0 4px color-mix(in srgb, var(--mk-acento) 8%, transparent)",
      "campo-foco": "0 0 0 6px color-mix(in srgb, var(--mk-acento) 16%, transparent)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "999px",
      "hundir-grande": "scale(0.98)",
      "campo-levantar": "none",
      "sombra-chica": "0 16px 30px -20px color-mix(in srgb, var(--mk-acento) 80%, transparent)",
      "sombra-pasar": "0 24px 40px -24px color-mix(in srgb, var(--mk-acento) 85%, transparent)",
      "sombra-hundida": "none",
      "sombra-mini": "0 6px 14px -8px var(--mk-acento)",
      "levantar": "translateY(-2px)",
      "cabeza-sombra": "0 30px 60px -36px var(--mk-acento)",
      "elegida-sombra": "none",
      "radio-icono": "999px",
      "radio-icono-chico": "999px",
      "radio-foto": "26px"
    },
    "letra": {
      "fuenteCartel": "\"Marcellus\", \"Georgia\", serif",
      "google": [
        "Marcellus"
      ]
    },
    "adornos": [
      "aura-que-respira"
    ],
    "rubros": [
      "estudios de yoga",
      "terapias de reiki",
      "centros de meditación",
      "masajes"
    ],
    "movimiento": {
      "titulo": "revelar",
      "tarjeta": {
        "variante": "vidrio",
        "efecto": "elevar"
      },
      "presencia": "fundido",
      "luz": [
        "#f3d9c9",
        "#4e8a82",
        "#f3d9c9"
      ]
    }
  },
  {
    "id": "barberia",
    "nombre": "Barbería",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#c9a24a",
      "fondo": "#f2ece2",
      "superficie": "#fffcf6",
      "texto": "#1a2233",
      "suave": "#5a6172",
      "borde": "#d9cfbf",
      "acento": "#a3232b",
      "sobreAcento": "#fff8ef"
    },
    "forma": {
      "trazo": "4px double var(--mk-texto)",
      "sombra": "0 2px 0 var(--mk-texto), 0 18px 30px -24px var(--mk-texto)",
      "radioTarjeta": "8px",
      "radioBoton": "6px",
      "sombraSuave": "0 2px 0 var(--mk-texto)",
      "hundir": "translateY(2px)",
      "radioCampo": "6px"
    },
    "detalle": {
      "fila-borde": "1.5px solid color-mix(in srgb, var(--mk-texto) 30%, transparent)",
      "fila-radio": "6px",
      "boton-ancho": "2px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 28%, transparent)",
      "campo-borde": "2px solid var(--mk-texto)",
      "campo-alto": "2.75rem",
      "campo-pasar": "0 2px 0 var(--mk-texto)",
      "campo-foco": "0 0 0 3px var(--mk-cartel)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "6px",
      "hundir-grande": "translateY(2px)",
      "campo-levantar": "none",
      "sombra-chica": "0 3px 0 var(--mk-texto)",
      "sombra-pasar": "0 4px 0 var(--mk-texto), 0 14px 24px -16px var(--mk-texto)",
      "sombra-hundida": "none",
      "sombra-mini": "0 2px 0 var(--mk-texto)",
      "levantar": "translateY(-2px)",
      "cabeza-sombra": "0 4px 0 var(--mk-cartel)",
      "elegida-sombra": "none",
      "radio-icono": "6px",
      "radio-icono-chico": "5px",
      "radio-foto": "8px",
      "pildora": "6px",
      "poste": "repeating-linear-gradient(-45deg, #a3232b 0 8px, #fffcf6 8px 16px, #1f3f8a 16px 24px, #fffcf6 24px 32px)"
    },
    "letra": {
      "fuenteCartel": "\"Alfa Slab One\", \"Rockwell\", Georgia, serif",
      "google": [
        "Alfa+Slab+One"
      ]
    },
    "adornos": [
      "poste-barbero"
    ],
    "rubros": [
      "barberías",
      "barberías clásicas",
      "estudios de afeitado",
      "tiendas de grooming"
    ],
    "movimiento": {
      "titulo": "voltear",
      "tarjeta": {
        "variante": "borde",
        "efecto": "brillo"
      },
      "presencia": "pasar",
      "luz": [
        "#a3232b",
        "#fffcf6",
        "#1f3f8a"
      ]
    }
  },
  {
    "id": "salon",
    "nombre": "Salón",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#ecdcb8",
      "fondo": "#f6f4f0",
      "superficie": "#ffffff",
      "texto": "#121212",
      "suave": "#6b6862",
      "borde": "#e4e0d8",
      "acento": "#0e6b5c",
      "sobreAcento": "#ffffff"
    },
    "forma": {
      "trazo": "1px solid var(--mk-texto)",
      "sombra": "none",
      "radioTarjeta": "2px",
      "radioBoton": "999px",
      "sombraSuave": "none",
      "hundir": "scale(0.98)",
      "radioCampo": "0px"
    },
    "detalle": {
      "fila-borde": "1px solid var(--mk-borde)",
      "fila-radio": "2px",
      "boton-ancho": "1px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "var(--mk-borde)",
      "campo-borde": "1px solid color-mix(in srgb, var(--mk-texto) 30%, transparent)",
      "campo-alto": "2.75rem",
      "campo-pasar": "inset 0 -2px 0 var(--mk-texto)",
      "campo-foco": "inset 0 -2px 0 var(--mk-acento), 0 0 0 1px var(--mk-acento)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "999px",
      "hundir-grande": "scale(0.98)",
      "campo-levantar": "none",
      "sombra-chica": "0 0 0 1px var(--mk-texto)",
      "sombra-pasar": "0 20px 40px -28px var(--mk-texto)",
      "sombra-hundida": "none",
      "sombra-mini": "none",
      "levantar": "translateY(-2px)",
      "cabeza-sombra": "none",
      "elegida-sombra": "none",
      "radio-icono": "999px",
      "radio-icono-chico": "999px",
      "radio-foto": "2px"
    },
    "letra": {
      "fuenteCartel": "\"Syne\", \"Helvetica Neue\", system-ui, sans-serif",
      "google": [
        "Syne:wght@700;800"
      ]
    },
    "adornos": [
      "linea-champana"
    ],
    "rubros": [
      "peluquerías",
      "salones de color",
      "estudios de peinado",
      "centros de estética"
    ],
    "movimiento": {
      "titulo": "trailer",
      "tarjeta": {
        "variante": "elevada",
        "efecto": "zoom"
      },
      "presencia": "izquierda",
      "luz": [
        "#ecdcb8",
        "#0e6b5c",
        "#ecdcb8"
      ]
    }
  },
  {
    "id": "patitas",
    "nombre": "Patitas",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#ffd166",
      "fondo": "#fff8ea",
      "superficie": "#ffffff",
      "texto": "#29284a",
      "suave": "#6a6987",
      "borde": "#f0e2c6",
      "acento": "#1a9fae",
      "sobreAcento": "#ffffff"
    },
    "forma": {
      "trazo": "2.5px solid var(--mk-texto)",
      "sombra": "5px 6px 0 color-mix(in srgb, var(--mk-acento) 55%, transparent)",
      "radioTarjeta": "24px",
      "radioBoton": "999px",
      "sombraSuave": "3px 4px 0 color-mix(in srgb, var(--mk-acento) 60%, transparent)",
      "hundir": "translateY(3px) scale(0.97)",
      "radioCampo": "16px"
    },
    "detalle": {
      "fila-borde": "2px solid color-mix(in srgb, var(--mk-texto) 18%, transparent)",
      "fila-radio": "16px",
      "boton-ancho": "2.5px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 28%, transparent)",
      "campo-borde": "2.5px solid var(--mk-texto)",
      "campo-alto": "2.75rem",
      "campo-pasar": "3px 3px 0 color-mix(in srgb, var(--mk-acento) 40%, transparent)",
      "campo-foco": "4px 5px 0 var(--mk-acento)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "999px",
      "hundir-grande": "translateY(3px) scale(0.97)",
      "campo-levantar": "translateY(-2px)",
      "sombra-chica": "4px 5px 0 color-mix(in srgb, var(--mk-acento) 60%, transparent)",
      "sombra-pasar": "6px 8px 0 color-mix(in srgb, var(--mk-acento) 65%, transparent)",
      "sombra-hundida": "1px 2px 0 var(--mk-acento)",
      "sombra-mini": "2px 3px 0 var(--mk-acento)",
      "levantar": "translateY(-3px) rotate(1deg)",
      "cabeza-sombra": "8px 9px 0 var(--mk-acento)",
      "elegida-sombra": "3px 4px 0 var(--mk-cartel)",
      "radio-icono": "999px",
      "radio-icono-chico": "999px",
      "radio-foto": "22px"
    },
    "letra": {
      "fuenteCartel": "\"Baloo 2\", \"Nunito\", system-ui, sans-serif",
      "google": [
        "Baloo+2:wght@600;800"
      ]
    },
    "adornos": [
      "cola"
    ],
    "rubros": [
      "peluquerías caninas",
      "spa de mascotas",
      "veterinarias",
      "tiendas de mascotas"
    ],
    "movimiento": {
      "titulo": "caer",
      "tarjeta": {
        "variante": "acento",
        "efecto": "elevar"
      },
      "presencia": "voltear",
      "luz": [
        "#1a9fae",
        "#ffd166",
        "#1a9fae"
      ]
    }
  },
  {
    "id": "clinica",
    "nombre": "Clínica",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#c8f0e2",
      "fondo": "#f2f6f8",
      "superficie": "#ffffff",
      "texto": "#13293d",
      "suave": "#5b6b7a",
      "borde": "#dbe5ec",
      "acento": "#1f6fd1",
      "sobreAcento": "#ffffff"
    },
    "forma": {
      "trazo": "1.5px solid var(--mk-borde)",
      "sombra": "0 1px 2px color-mix(in srgb, var(--mk-texto) 8%, transparent), 0 12px 28px -18px color-mix(in srgb, var(--mk-texto) 40%, transparent)",
      "radioTarjeta": "14px",
      "radioBoton": "10px",
      "sombraSuave": "none",
      "hundir": "scale(0.98)",
      "radioCampo": "10px"
    },
    "detalle": {
      "sobre-sol": "#0f4d3c",
      "fila-borde": "1px solid var(--mk-borde)",
      "fila-radio": "10px",
      "boton-ancho": "1.5px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "var(--mk-borde)",
      "campo-borde": "1.5px solid #c5d3de",
      "campo-alto": "2.75rem",
      "campo-pasar": "none",
      "campo-foco": "0 0 0 4px color-mix(in srgb, var(--mk-acento) 20%, transparent)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "10px",
      "hundir-grande": "scale(0.98)",
      "campo-levantar": "none",
      "sombra-chica": "0 8px 20px -12px color-mix(in srgb, var(--mk-acento) 60%, transparent)",
      "sombra-pasar": "0 16px 30px -18px color-mix(in srgb, var(--mk-acento) 60%, transparent)",
      "sombra-hundida": "none",
      "sombra-mini": "none",
      "levantar": "translateY(-1px)",
      "cabeza-sombra": "0 16px 30px -20px var(--mk-acento)",
      "elegida-sombra": "inset 3px 0 0 var(--mk-acento)",
      "radio-icono": "10px",
      "radio-icono-chico": "8px",
      "radio-foto": "12px",
      "pulso": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 20'%3E%3Cpath d='M0 10h38l5-8 6 16 6-14 4 6h61' fill='none' stroke='%231f6fd1' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'/%3E%3C/svg%3E\")"
    },
    "letra": {
      "fuenteCartel": "\"Lexend\", system-ui, sans-serif",
      "google": [
        "Lexend:wght@500;600"
      ]
    },
    "adornos": [
      "pulso"
    ],
    "rubros": [
      "consultas médicas",
      "dentistas",
      "kinesiología",
      "psicología"
    ],
    "movimiento": {
      "titulo": "revelar",
      "tarjeta": {
        "variante": "elevada",
        "efecto": "elevar"
      },
      "presencia": "fundido",
      "luz": [
        "#1f6fd1",
        "#c8f0e2",
        "#1f6fd1"
      ]
    }
  },
  {
    "id": "cancha",
    "nombre": "Cancha",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#ff3d5e",
      "fondo": "#eef1f6",
      "superficie": "#ffffff",
      "texto": "#0c1a33",
      "suave": "#56627a",
      "borde": "#d3dae6",
      "acento": "#2541ff",
      "sobreAcento": "#ffffff"
    },
    "forma": {
      "trazo": "2px solid var(--mk-texto)",
      "sombra": "8px 8px 0 color-mix(in srgb, var(--mk-acento) 85%, transparent)",
      "radioTarjeta": "6px",
      "radioBoton": "4px",
      "sombraSuave": "4px 4px 0 var(--mk-acento)",
      "hundir": "translateX(4px) skewX(-8deg)",
      "radioCampo": "4px"
    },
    "detalle": {
      "sobre-sol": "#ffffff",
      "fila-borde": "1.5px solid color-mix(in srgb, var(--mk-texto) 25%, transparent)",
      "fila-radio": "4px",
      "boton-ancho": "2px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 28%, transparent)",
      "campo-borde": "2px solid var(--mk-texto)",
      "campo-alto": "2.75rem",
      "campo-pasar": "3px 3px 0 var(--mk-acento)",
      "campo-foco": "5px 5px 0 var(--mk-acento)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "4px",
      "hundir-grande": "translateX(5px) skewX(-8deg)",
      "campo-levantar": "translate(-2px, -2px)",
      "sombra-chica": "5px 5px 0 var(--mk-acento)",
      "sombra-pasar": "9px 6px 0 var(--mk-acento)",
      "sombra-hundida": "1px 1px 0 var(--mk-acento)",
      "sombra-mini": "3px 3px 0 var(--mk-acento)",
      "levantar": "translateX(-4px)",
      "cabeza-sombra": "10px 10px 0 var(--mk-cartel)",
      "elegida-sombra": "4px 4px 0 var(--mk-cartel)",
      "radio-icono": "4px",
      "radio-icono-chico": "3px",
      "radio-foto": "6px",
      "pildora": "4px"
    },
    "letra": {
      "fuenteCartel": "\"Barlow Condensed\", \"Arial Narrow\", system-ui, sans-serif",
      "google": [
        "Barlow+Condensed:ital,wght@1,800"
      ]
    },
    "adornos": [
      "inclinado"
    ],
    "rubros": [
      "gimnasios",
      "crossfit",
      "canchas de fútbol",
      "academias deportivas"
    ],
    "movimiento": {
      "titulo": "impacto",
      "tarjeta": {
        "variante": "borde",
        "efecto": [
          "elevar",
          "zoom"
        ]
      },
      "presencia": "derecha",
      "luz": [
        "#2541ff",
        "#ff3d5e",
        "#2541ff"
      ]
    }
  },
  {
    "id": "picada",
    "nombre": "Picada",
    "para": [
      "panel"
    ],
    "colores": {
      "cartel": "#f4c55a",
      "fondo": "#faf2e2",
      "superficie": "#fffbf3",
      "texto": "#3a2517",
      "suave": "#7a6352",
      "borde": "#e8d8bd",
      "acento": "#2f6b3a",
      "sobreAcento": "#fffbf3"
    },
    "forma": {
      "trazo": "2px solid var(--mk-texto)",
      "sombra": "4px 5px 0 color-mix(in srgb, var(--mk-texto) 85%, transparent)",
      "radioTarjeta": "10px",
      "radioBoton": "10px",
      "sombraSuave": "2px 3px 0 var(--mk-texto)",
      "hundir": "translate(2px, 2px)",
      "radioCampo": "8px"
    },
    "detalle": {
      "fila-borde": "1.5px dashed color-mix(in srgb, var(--mk-texto) 35%, transparent)",
      "fila-radio": "8px",
      "boton-ancho": "2px",
      "boton-sombra-suave": "none",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 28%, transparent)",
      "campo-borde": "2px solid color-mix(in srgb, var(--mk-texto) 70%, transparent)",
      "campo-alto": "2.75rem",
      "campo-pasar": "2px 2px 0 color-mix(in srgb, var(--mk-texto) 25%, transparent)",
      "campo-foco": "3px 4px 0 var(--mk-acento)",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)",
      "cielo": "color-mix(in srgb, var(--mk-acento) 9%, var(--mk-superficie))",
      "boton-radio-grande": "10px",
      "hundir-grande": "translate(3px, 3px)",
      "sombra-chica": "3px 4px 0 var(--mk-texto)",
      "sombra-pasar": "5px 6px 0 var(--mk-texto)",
      "sombra-hundida": "1px 1px 0 var(--mk-texto)",
      "sombra-mini": "2px 2px 0 var(--mk-texto)",
      "levantar": "translate(-1px, -2px)",
      "cabeza-sombra": "6px 7px 0 var(--mk-cartel)",
      "elegida-sombra": "3px 3px 0 var(--mk-cartel)",
      "radio-icono": "50%",
      "radio-icono-chico": "50%",
      "radio-foto": "10px",
      "mantel": "repeating-linear-gradient(0deg, color-mix(in srgb, #c8322c 45%, transparent) 0 10px, transparent 10px 20px), repeating-linear-gradient(90deg, color-mix(in srgb, #c8322c 45%, transparent) 0 10px, #fffbf3 10px 20px)"
    },
    "letra": {
      "fuenteCartel": "\"Kalam\", \"Comic Sans MS\", cursive",
      "google": [
        "Kalam:wght@700"
      ]
    },
    "adornos": [
      "pizarra-y-mantel"
    ],
    "rubros": [
      "comida casera",
      "fuentes de soda",
      "empanadas",
      "amasanderías"
    ],
    "movimiento": {
      "titulo": "maquina",
      "tarjeta": {
        "variante": "borde",
        "efecto": "elevar"
      },
      "presencia": "subir",
      "luz": [
        "#f4c55a",
        "#2f6b3a",
        "#c8322c"
      ]
    }
  },
  {
    "id": "lamente",
    "nombre": "La Mente",
    "para": [
      "panel"
    ],
    "colores": {
      "fondo": "#FAF7F2",
      "superficie": "#FFFFFF",
      "texto": "#1C1A22",
      "suave": "#5E5A68",
      "borde": "#E7E1D8",
      "acento": "#9333ea",
      "sobreAcento": "#fff",
      "cartel": "#ffc83d"
    },
    "forma": {
      "trazo": "2.5px solid var(--mk-texto)",
      "sombra": "6px 6px 0 var(--mk-texto)",
      "radioTarjeta": "16px",
      "radioBoton": "10px",
      "sombraSuave": "3px 3px 0 var(--mk-texto)",
      "hundir": "translate(2px, 2px)",
      "radioCampo": "12px"
    },
    "detalle": {
      "sobre-sol": "#10223f",
      "fila-borde": "1.5px solid color-mix(in srgb, var(--mk-texto) 28%, transparent)",
      "fila-radio": "10px",
      "boton-ancho": "2px",
      "boton-sombra-suave": "2px 2px 0 color-mix(in srgb, var(--mk-texto) 30%, transparent)",
      "fantasma-borde": "color-mix(in srgb, var(--mk-texto) 28%, transparent)",
      "campo-borde": "2px solid color-mix(in srgb, var(--mk-texto) 78%, transparent)",
      "campo-alto": "2.75rem",
      "campo-pasar": "2px 2px 0 color-mix(in srgb, var(--mk-texto) 22%, transparent)",
      "campo-foco": "4px 4px 0 #a855f7",
      "campo-error": "3px 3px 0 color-mix(in srgb, #ef4444 45%, transparent)"
    },
    "letra": {
      "fuenteCartel": "\"Dela Gothic One\", \"Outfit\", \"Arial Black\", system-ui, sans-serif"
    },
    "rubros": [
      "cafés",
      "tiendas de barrio",
      "consultas",
      "cualquier negocio"
    ],
    "movimiento": {
      "titulo": "revelar",
      "tarjeta": {
        "variante": "borde",
        "efecto": "elevar"
      },
      "presencia": "subir",
      "luz": [
        "#ffc83d",
        "#7c3aed",
        "#ffc83d"
      ]
    },
    "oscuro": {
      "fondo": "#14121A",
      "superficie": "#1E1B26",
      "texto": "#F2EFF7",
      "suave": "#B3AEBD",
      "borde": "#2E2A38"
    }
  }
];
