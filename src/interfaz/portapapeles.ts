// Copiar: el portapapeles del navegador y, si no deja (permisos, http, navegador viejo), un textarea escondido con
// execCommand. Devuelve si se pudo; nunca lanza.

export async function copiarTexto(
  t: string,
  nav: Pick<Navigator, "clipboard"> | undefined = typeof navigator === "undefined" ? undefined : navigator,
  doc: Document | undefined = typeof document === "undefined" ? undefined : document,
): Promise<boolean> {
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(t);
      return true;
    }
  } catch {
    // Sigue con el textarea.
  }
  if (!doc) return false;
  try {
    const ta = doc.createElement("textarea");
    ta.value = t;
    ta.setAttribute("readonly", "");
    Object.assign(ta.style, { position: "fixed", top: "0", left: "0", opacity: "0", pointerEvents: "none" });
    doc.body.appendChild(ta);
    ta.select();
    const ok = doc.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
