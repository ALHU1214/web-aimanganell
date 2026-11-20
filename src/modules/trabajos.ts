import { $$ } from './utils';

/* ---------- índice de /diseno-web/ ----------
   Botones (data-ir) que bajan hasta su proyecto (data-proyecto). No son
   enlaces "#salomn" a propósito: con anclas, Google sacaba cada proyecto
   como enlace aparte debajo de AI MANGANELL al buscar la marca
   (20-nov-2026, Álvaro). Quien llegue con un enlace antiguo con #slug
   (guardado, el desvío de /trabajos/ o el de Google mientras lo tenga)
   baja igual hasta su proyecto. */
export function initIndiceTrabajos(): void {
  const proyectos = $$<HTMLElement>('[data-proyecto]');
  if (!proyectos.length) return;
  const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ir(slug: string, comportamiento: ScrollBehavior, enfocar: boolean): void {
    const destino = proyectos.find((p) => p.dataset.proyecto === slug);
    if (!destino) return;
    destino.scrollIntoView({ behavior: comportamiento, block: 'start' });
    const titulo = destino.querySelector<HTMLElement>('.tr-nombre');
    if (enfocar && titulo) {
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }
  }

  $$<HTMLButtonElement>('[data-ir]').forEach((boton) => {
    boton.addEventListener('click', () => ir(boton.dataset.ir || '', suave ? 'smooth' : 'instant', true));
  });

  const ancla = decodeURIComponent(location.hash.slice(1));
  if (ancla) ir(ancla, 'instant', false);
}

/* ---------- página /trabajos/ ----------
   Cada captura es más alta que su marco. Mientras se hace scroll, la
   captura sube dentro del marco: se ve la web pasar de arriba abajo, como
   si alguien la estuviera recorriendo. Sin scroll propio en el marco, para
   no pelearse con el dedo en el móvil: quien quiera verla entera la toca y
   se abre en directo.
   - Móvil: el marco es sticky dentro de un visor más alto (trabajos.css).
     La captura avanza mientras el marco está quieto, empezando por la portada.
   - Escritorio: el marco se mueve con la página y la captura avanza desde
     que asoma entero por abajo hasta que sale a medias por arriba. */
export function initTrabajos(): void {
  const marcos = $$<HTMLElement>('.tr-marco');
  if (!marcos.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let pendiente = false;

  function progreso(marco: HTMLElement, alto: number): number | null {
    const cs = getComputedStyle(marco);
    if (cs.position === 'sticky' && marco.parentElement) {
      const visor = marco.parentElement.getBoundingClientRect();
      if (visor.bottom < 0 || visor.top > alto) return null;
      const tramo = visor.height - marco.offsetHeight;
      if (tramo <= 0) return null;
      return ((parseFloat(cs.top) || 0) - visor.top) / tramo;
    }
    const r = marco.getBoundingClientRect();
    if (r.bottom < 0 || r.top > alto) return null;
    const inicio = alto - r.height;
    const fin = -r.height * 0.5;
    return (inicio - r.top) / (inicio - fin);
  }

  function pintar(): void {
    pendiente = false;
    const alto = window.innerHeight;
    marcos.forEach((marco) => {
      const img = marco.querySelector('img');
      if (!img || !marco.offsetParent) return; // oculto (en móvil, el de escritorio)
      const recorrido = img.offsetHeight - marco.clientHeight;
      const p = progreso(marco, alto);
      if (p === null || recorrido <= 0) return;
      const y = -Math.min(1, Math.max(0, p)) * recorrido;
      img.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    });
  }

  function pedir(): void {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pintar);
  }

  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  marcos.forEach((m) => { m.querySelector('img')?.addEventListener('load', pedir); });
  pedir();
}
