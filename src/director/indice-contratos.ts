// El índice de los contratos (encargo del backend del 27-11): la versión de motion-kit y la lista de contratos con su
// versión, para que el backend y el front copien todo de una vez y sepan de qué etiqueta salió.
import { contratoPartitura } from "./contrato-partitura";
import { contratoCasa } from "./contrato-casa";
import { contratoEncabezado } from "../receta/contrato";
import { contratoPagina } from "../relatos/contrato-pagina";
import { contratoTemas } from "../temas/contrato";

export function indiceContratos(motionKit: string) {
  return {
    $comentario:
      "Índice de los contratos de motion-kit. Generado por scripts/generar-contrato.mjs: no editar a mano. Cada etiqueta lleva " +
      "todos los contratos al día; motionKit es la versión del paquete de la que salieron.",
    motionKit,
    contratos: [
      { archivo: "encabezado-motionkit.json", version: contratoEncabezado().version },
      { archivo: "pagina-motionkit.json", version: contratoPagina().version },
      { archivo: "partitura-motionkit.json", version: contratoPartitura().version },
      { archivo: "partituras-casa-motionkit.json", version: contratoCasa().version },
      { archivo: "temas-motionkit.json", version: contratoTemas().version },
    ],
  };
}

export const textoIndiceContratos = (motionKit: string) => JSON.stringify(indiceContratos(motionKit), null, 2) + "\n";
