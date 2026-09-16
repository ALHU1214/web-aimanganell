export function $<T extends HTMLElement = HTMLElement>(s: string, r?: ParentNode): T | null {
  return (r || document).querySelector<T>(s);
}

export function $$<T extends HTMLElement = HTMLElement>(s: string, r?: ParentNode): T[] {
  return Array.prototype.slice.call((r || document).querySelectorAll<T>(s));
}

/* Ejecuta fn cuando la página ya ha cargado y el navegador está libre.
   Para scripts de terceros (analítica, antispam) que no deben competir con
   el primer pintado: bloqueaban 250-480 ms en móvil (Lighthouse). */
export function trasCarga(fn: () => void): void {
  const ocioso = (): void => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2500 });
    else setTimeout(fn, 1);
  };
  if (document.readyState === 'complete') ocioso();
  else window.addEventListener('load', ocioso, { once: true });
}

/* Inserta un <script async> una sola vez */
export function cargarScript(src: string): void {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}
