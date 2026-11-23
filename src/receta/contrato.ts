import {
  CAMPOS_RECETA, DEFECTOS_RECETA, LISTAS_RECETA, OBLIGATORIOS_RECETA, PROTAGONISTA_RECETA, TOPES_RECETA, VERSION_RECETA, VERSIONES_RECETA,
} from "./receta";

/**
 * El contrato del encabezado (`contrato/encabezado-motionkit.json`): listas cerradas, topes y reglas de la receta, sacados
 * de los catálogos del código. La Mente lo copia, como `diseno.json`, para validar en `paginas` sin cargar motion-kit.
 * Lo escribe `npm run contrato`; una prueba falla si el archivo quedó atrás.
 */
export function contratoEncabezado() {
  return {
    $comentario:
      "Receta del encabezado de motion-kit, v2 (acepta v1 y la guarda como v2). Generado por scripts/generar-contrato.mjs desde src/receta: no editar a mano. " +
      "v2: apertura {presenta}, tomas (2+ fotos y composición con foto: imagen, tarjeta, vinetas o dividido sin objeto), fotoEnLetras (con foto o póster), tratamiento, estado (los datos los pone quien dibuja), palabras (1 a 3 alternativas a la palabra resaltada con *asteriscos*: rotan de 2 a 4), horaDelDia, shader, objeto {forma, texto} (listas.forma es objeto.forma), logo y nombre (para salida «barra»). " +
      "Un campo fuera de «campos» es un error. Textos: el largo se cuenta en letras, sin los asteriscos del resaltado. " +
      "href: https://, #seccion o ruta relativa sin esquema. Fotos y póster: URL https:// o key de S3 (letras, números, / _ . -, sin .. ni //). " +
      "alto y altoCelular: un nombre de la lista o un número de altoMinimo a altoMaximo (% del alto de la pantalla). " +
      "Un solo protagonista: gana el primero de protagonista.orden que se mueva sin parar; los demás se calman con protagonista.calmar. " +
      "En la página de La Mente, un encabezado de motion-kit cuenta como el bloque protagonista.",
    version: VERSION_RECETA,
    versiones: [...VERSIONES_RECETA],
    campos: [...CAMPOS_RECETA],
    obligatorios: [...OBLIGATORIOS_RECETA],
    listas: Object.fromEntries(Object.entries(LISTAS_RECETA).map(([k, v]) => [k, [...v]])),
    topes: { ...TOPES_RECETA },
    defectos: { ...DEFECTOS_RECETA, efectoTexto: "el primero del estilo", pack: "el del estilo" },
    protagonista: {
      orden: [...PROTAGONISTA_RECETA.orden],
      textosQueSeMueven: [...PROTAGONISTA_RECETA.textosQueSeMueven],
      lucesQueSeMueven: [...PROTAGONISTA_RECETA.lucesQueSeMueven],
      calmar: { ...PROTAGONISTA_RECETA.calmar },
    },
  };
}

/** El contrato como texto, tal como se guarda en el archivo. */
export const textoContrato = () => JSON.stringify(contratoEncabezado(), null, 2) + "\n";
