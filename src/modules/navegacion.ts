import { $, $$ } from './utils';

/* ---------- 1 · navegación: anclas con scroll suave ----------
   (La home y consultoría fueron una sola página con dos vistas que se
   mostraban/ocultaban con data-go; ese mecanismo ya no existe.) */
export function initNavegacion(): void {
  // "Más información" de la home: en escritorio va a /consultoria/; en móvil
  // el contenido de consultoría está en la propia home (.solo-movil), así que
  // baja hasta él. offsetParent es null cuando el bloque está oculto.
  const info = $('.btn-info');
  const bloque = document.getElementById('ai-cyber-amg');
  if (info && bloque) {
    info.addEventListener('click', (e: Event) => {
      if (bloque.offsetParent === null) return;
      e.preventDefault();
      window.scrollTo({ top: bloque.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
    });
  }

  // enlaces internos dentro de la página 2 (#contacto, #diagnostico…)
  $$('#page2 a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e: Event) => {
      const hrefAttr = a.getAttribute('href');
      if (!hrefAttr) return;
      const id = hrefAttr.slice(1);
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
    });
  });

  (function scrollToHashWhenReady(): void {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    const fontsReady: Promise<unknown> = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    const pageLoaded: Promise<void> = new Promise((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
    });

    Promise.all([fontsReady, pageLoaded]).then(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
        cleanHashFromUrl();
      });
    });

    function cleanHashFromUrl(): void {
      let done = false;
      function clean(): void {
        if (done) return;
        done = true;
        window.removeEventListener('scrollend', clean);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if ('onscrollend' in window) window.addEventListener('scrollend', clean, { once: true });
      setTimeout(clean, 1500);
    }
  })();
}
