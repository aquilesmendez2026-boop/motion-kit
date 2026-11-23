import type { EncabezadoProps, EfectoId, EstiloId, Variante } from "../src";

/** Lo que viaja en el QR: el estilo y las props del encabezado (sin fotos locales, que no salen de este computador). */
export type ConfigVista = Partial<Omit<EncabezadoProps, "boton" | "botonSecundario">> & {
  estilo: EstiloId;
  efecto?: EfectoId;
  variante?: Variante;
  boton?: { texto: string; href: string };
  botonSecundario?: { texto: string; href: string };
  titulo: string;
  /** Tema y paleta de La Mente, si el editor los tenía puestos. */
  lmTema?: string;
  lmPaleta?: string;
};

const aBase64Url = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deBase64Url = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));

export function codificar(c: ConfigVista): string {
  const limpio = JSON.parse(JSON.stringify(c, (_k, v) => (typeof v === "string" && (v.startsWith("blob:") || v.startsWith("data:")) ? undefined : v)));
  return aBase64Url(JSON.stringify(limpio));
}

export function decodificar(d: string): ConfigVista | null {
  try {
    return JSON.parse(deBase64Url(d));
  } catch {
    return null;
  }
}

/** La URL de la vista para el teléfono. En local usa la IP de la red (la pone `vite.config.ts`), no «localhost». */
export function enlaceVista(c: ConfigVista): { url: string; nota: string } {
  return enlaceDe(`#vista?d=${codificar(c)}`);
}

/** Lo mismo para cualquier ruta de la demo (por ejemplo `#pagina?d=…`). */
export function enlaceDe(hash: string): { url: string; nota: string } {
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const red = typeof __MK_RED__ === "string" && __MK_RED__ ? __MK_RED__ : "";
  if (local && red) {
    return { url: `${location.protocol}//${red}:${location.port}${location.pathname}${hash}`, nota: "El teléfono tiene que estar en la misma Wi-Fi y el servidor corriendo con `npm run dev:red`. Las fotos propias no viajan." };
  }
  if (local) return { url: location.origin + location.pathname + hash, nota: "Sin IP de red: corre `npm run dev:red` para abrirlo desde el teléfono." };
  return { url: location.origin + location.pathname + hash, nota: "Escanéalo con la cámara. Las fotos propias no viajan." };
}
