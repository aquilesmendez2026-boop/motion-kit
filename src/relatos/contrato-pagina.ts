import { FIGURA_DE_RUBRO, FIGURA_IDS, PARTES_RELATO, RELATOS, RELATOS_DE_BLOQUE, RELATOS_DE_PAGINA, RELATO_DE_ESTILO } from "./catalogo";
import { CAMPOS_PAGINA, TOPES_PAGINA } from "./receta-pagina";

/**
 * El contrato de la receta de página (`contrato/pagina-motionkit.json`), sacado del catálogo de relatos. La Mente lo
 * copia, como `diseno.json` y `encabezado-motionkit.json`. Lo escribe `npm run contrato`; una prueba lo revisa.
 */
export function contratoPagina() {
  return {
    $comentario:
      "Receta de página de motion-kit, v1. Generado por scripts/generar-contrato.mjs desde src/relatos: no editar a mano. " +
      "El encabezado sigue contrato/encabezado-motionkit.json. relato: el de la página (de bloque); sin él, se usa relatoDeEstilo del estilo del encabezado. " +
      "relatoPagina: relato de fondo para toda la página. figura: lo que dibuja el hilo al final con relatoPagina figura (suma 140 px a la página); con rastro, la forma de las huellas. semilla: el slug del negocio. " +
      "estela: true prende la estela del cursor y las chispas al tocar (solo en nivel completo). " +
      "bloques[].id: minúsculas, números y guiones; en La Mente, el tipo del bloque. " +
      "Marcas: cada bloque marca sus partes con data-mk-parte (partes); un relato que requiere marcas que el bloque no trae se dibuja como «escenas». " +
      "carrete necesita una tira: un contenedor (no el bloque entero) con dos o más fotos o tarjetas; si la tira cabe entera, se cuenta como «escenas». " +
      "pila necesita que los bloques vayan seguidos, como hermanos directos (si cada uno va envuelto en otro elemento, se ven como cartas pero no se pegan) y un fondo de página en --mk-fondo o --lm-fondo (sin él, las cartas van blancas). " +
      "subtitulos necesita la frase con cada palabra en <span data-mk-palabra> (FraseRelato lo hace); el relato no toca el HTML del bloque. " +
      "Los relatos no cuentan como protagonista: solo se mueven con el scroll de la persona.",
    version: 1,
    campos: [...CAMPOS_PAGINA],
    obligatorios: ["version", "encabezado"],
    listas: { relato: [...RELATOS_DE_BLOQUE], relatoPagina: [...RELATOS_DE_PAGINA], relatoBloque: [...RELATOS_DE_BLOQUE, "ninguno"], figura: [...FIGURA_IDS] },
    topes: { ...TOPES_PAGINA },
    relatoDeEstilo: { ...RELATO_DE_ESTILO },
    figuraDeRubro: { ...FIGURA_DE_RUBRO },
    partes: [...PARTES_RELATO],
    requiere: Object.fromEntries(RELATOS_DE_BLOQUE.map((id) => [id, [...RELATOS[id].requiere]])),
  };
}

export const textoContratoPagina = () => JSON.stringify(contratoPagina(), null, 2) + "\n";
