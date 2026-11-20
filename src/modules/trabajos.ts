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

/* ---------- página /diseno-web/ ----------
   Cada captura es más alta que su marco. Mientras se hace scroll, la
   captura sube dentro del marco: se ve la web pasar de arriba abajo, como
   si alguien la estuviera recorriendo. Sin scroll propio en el marco, para
   no pelearse con el dedo en el móvil: quien quiera verla entera la toca y
   se abre en directo.
   - Móvil: el marco es sticky dentro de un visor más alto (trabajos.css).
     La captura avanza mientras el marco está quieto, empezando por la portada.
   - Ordenador (20-nov-2026, Álvaro): la escena entera (.tr-escena) es sticky
     y se queda centrada; el artículo mide una ventana más --tr-recorrido,
     que se calcula aquí (lo que baja la captura: 1 px de rueda = 1 px de
     web). La web pasa mientras la escena está quieta, desde su portada.
   - Ventanas bajas, donde no cabe quieta (sin sticky): la captura avanza
     desde que el marco asoma entero por abajo hasta que sale a medias por
     arriba. */
export function initTrabajos(): void {
  const marcos = $$<HTMLElement>('.tr-marco');
  if (!marcos.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const proyectos = $$<HTMLElement>('.tr-proyecto');
  let pendiente = false;

  /* Lo que alarga cada proyecto: lo que más baja de sus capturas visibles. */
  function medir(): void {
    proyectos.forEach((proyecto) => {
      let recorrido = 0;
      proyecto.querySelectorAll<HTMLElement>('.tr-marco').forEach((marco) => {
        const img = marco.querySelector('img');
        if (img && marco.offsetParent) recorrido = Math.max(recorrido, img.offsetHeight - marco.clientHeight);
      });
      if (recorrido > 0) proyecto.style.setProperty('--tr-recorrido', `${Math.round(recorrido)}px`);
    });
  }

  function progreso(marco: HTMLElement, alto: number): number | null {
    const cs = getComputedStyle(marco);
    if (cs.position === 'sticky' && marco.parentElement) {
      const visor = marco.parentElement.getBoundingClientRect();
      if (visor.bottom < 0 || visor.top > alto) return null;
      const tramo = visor.height - marco.offsetHeight;
      if (tramo <= 0) return null;
      return ((parseFloat(cs.top) || 0) - visor.top) / tramo;
    }
    const escena = marco.closest<HTMLElement>('.tr-escena');
    if (escena && escena.parentElement) {
      const ce = getComputedStyle(escena);
      if (ce.position === 'sticky') {
        const articulo = escena.parentElement.getBoundingClientRect();
        if (articulo.bottom < 0 || articulo.top > alto) return null;
        const tramo = articulo.height - escena.offsetHeight;
        if (tramo <= 0) return null;
        return ((parseFloat(ce.top) || 0) - articulo.top) / tramo;
      }
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
    // Primero se mide todo y luego se mueve: así el navegador no tiene que
    // recalcular la página entre un marco y otro.
    const cambios: Array<[HTMLImageElement, number]> = [];
    marcos.forEach((marco) => {
      const img = marco.querySelector('img');
      if (!img || !marco.offsetParent) return; // oculto (en móvil, el de escritorio)
      const recorrido = img.offsetHeight - marco.clientHeight;
      const p = progreso(marco, alto);
      if (p === null || recorrido <= 0) return;
      cambios.push([img, -Math.min(1, Math.max(0, p)) * recorrido]);
    });
    cambios.forEach(([img, y]) => { img.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`; });
  }

  function pedir(): void {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pintar);
  }

  function rehacer(): void {
    medir();
    pedir();
  }

  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', rehacer);
  marcos.forEach((m) => { m.querySelector('img')?.addEventListener('load', rehacer); });
  rehacer();
}
