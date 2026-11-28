// El foco atrapado de un diálogo (Confirmar): qué se puede enfocar adentro y a cuál pasa Tab o Shift+Tab, dando la vuelta.

const SELECTOR = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

/** Lo enfocable dentro de `raiz`: visible y habilitado. */
export function enfocables(raiz: HTMLElement): HTMLElement[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>(SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true" && el.getClientRects().length > 0,
  );
}

/** El siguiente (o el anterior) en la lista, dando la vuelta; desde afuera, el primero (o el último). */
export function siguienteFoco(lista: HTMLElement[], actual: Element | null, atras: boolean): HTMLElement | undefined {
  if (!lista.length) return undefined;
  const i = actual ? lista.indexOf(actual as HTMLElement) : -1;
  if (atras) return i <= 0 ? lista[lista.length - 1] : lista[i - 1];
  return i === -1 || i === lista.length - 1 ? lista[0] : lista[i + 1];
}
